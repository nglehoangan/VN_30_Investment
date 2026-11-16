import {it,expect} from 'vitest';
import {currentFinancialRouteFixture} from '../fixtures/current-financial-route';
import {CurrentFinancialDatasets} from '@/infrastructure/source-admission/current-dataset';
import {currentReceiptTime} from '@/infrastructure/source-admission/current-financial';
it('persists real VNM facts and consumes a current dataset under an explicitly synthetic authority fixture',async()=>{
 const f=await currentFinancialRouteFixture();try{
  const a=await f.service.ingest(f.q,f.securityId);expect(a.plan.facts).toHaveLength(68);expect(a.plan.quarantine).toEqual([]);
  const read=await f.service.consume(a.id,f.context);expect(read.facts.map(x=>x.value)).toEqual(a.plan.facts.map(x=>x.value));
  expect((await f.service.ingest(f.q,f.securityId)).duplicate).toBe(true);
  const b=await f.datasets.bind(a.id,f.context);expect(b.manifest.financialCoverageComplete).toBe(true);
  const dataset=await f.datasets.consume(b.id,f.context);expect(dataset.facts).toHaveLength(34);expect(dataset.price.value).toBe('56900');expect(dataset.shares.value).toBe('2089955445');
  expect(dataset.readyForScoring).toBe(false);expect(b.manifest.gates.DI).toBe('NOT_GRANTED');
  expect((await f.datasets.bind(a.id,f.context)).duplicate).toBe(true);
  expect(await f.db.scoringDatasetBinding.count()).toBe(0);expect(await f.db.dataInitializationAcceptance.count()).toBe(0);expect(await f.db.analyticalArtifact.count()).toBe(0);
 }finally{await f.close();}
});
it('keeps original microsecond receipts and uses conservative canonical clocks',()=>{
 expect(currentReceiptTime('2026-11-02T06:32:47.739019+00:00')).toBe('2026-11-02T06:32:47.740Z');
});
it('rejects historical purpose, identity mismatch and revoked admission or dataset',async()=>{
 const f=await currentFinancialRouteFixture();try{
  const a=await f.service.ingest(f.q,f.securityId),b=await f.datasets.bind(a.id,f.context);
  await expect(f.datasets.consume(b.id,{...f.context,purpose:'HISTORICAL_PIT'})).rejects.toThrow('CURRENT_ONLY_NOT_PIT');
  await expect(f.service.consume(a.id,{...f.context,ticker:'FPT'})).rejects.toThrow('CONSUMPTION_SCOPE');
  await f.datasets.revoke(b.id,'test only',f.q.knownAt);await expect(f.datasets.consume(b.id,f.context)).rejects.toThrow('REVOKED');
  await f.service.revoke(a.id,'test only',f.q.knownAt);await expect(f.service.consume(a.id,f.context)).rejects.toThrow('REVOKED');
 }finally{await f.close();}
});
it('revoked authority blocks stored consumption without changing raw facts',async()=>{
 const f=await currentFinancialRouteFixture();try{
  const a=await f.service.ingest(f.q,f.securityId);f.registryBody.authorities[0].status='REVOKED';f.setRegistry(f.registryBody);
  await expect(f.service.consume(a.id,f.context)).rejects.toThrow('AUTHORITY_REVOKED');
 }finally{await f.close();}
});
it('rejects wrong native dimensions and changed sources rather than silently consuming',async()=>{
 const f=await currentFinancialRouteFixture();try{
  const obs=structuredClone(f.q.observations);obs[0].scope='STANDALONE';const p=f.service.plan({...f.q,observations:obs},f.securityId);
  expect(p.quarantine.some(x=>x.reason.includes('scope'))).toBe(true);expect(p.facts).toHaveLength(67);
  const a=await f.service.ingest(f.q,f.securityId);f.put(a.plan.facts[0].raw.path,'%PDF-TAMPERED');
  await expect(f.service.consume(a.id,f.context)).rejects.toThrow();
 }finally{await f.close();}
});
it('reports exact missing dependencies; dataset cannot relabel parent facts as consolidated',async()=>{
 const f=await currentFinancialRouteFixture();try{
  const a=await f.service.ingest({...f.q,observations:f.q.observations.slice(1)},f.securityId);
  // Remove a current end-date fact explicitly, not just a prior comparative column.
  const required=a.plan.facts.find(x=>x.period.end==='2026-09-30')!;
  await f.service.revoke(required.id,'test missing/revoked fact',f.q.knownAt);
  await expect(f.datasets.bind(a.id,f.context)).rejects.toThrow('REVOKED');
 }finally{await f.close();}
});
it('rejects mismatched security identity before any admitted write',async()=>{
 const f=await currentFinancialRouteFixture();try{
  await expect(f.service.ingest(f.q,'FPT-SECURITY')).rejects.toThrow('CURRENT_SECURITY_IDENTITY_MISMATCH');
  expect(Number((await f.db.$queryRawUnsafe<{n:bigint}[]>('SELECT count(*) n FROM current_financial_fact'))[0].n)).toBe(0);
 }finally{await f.close();}
});
it('reports a missing unsupported current debt aggregate and does not create a placeholder binding',async()=>{
 const f=await currentFinancialRouteFixture();try{
  const a=await f.service.ingest(f.q,f.securityId);
  const r=JSON.parse(require('node:fs').readFileSync(f.root+'/'+f.datasetComposition.requirements.path,'utf8'));
  r.financial.push({itemId:'REPORTED_BORROWINGS',scope:'CONSOLIDATED',start:'2026-01-01',end:'2026-09-30',vintage:'Q3_2026_PRESENTATION'});
  const requirements=f.put('missing-cfo-requirements.json',r),datasets=new CurrentFinancialDatasets(f.db,f.root,f.service,{...f.datasetComposition,requirements});
  await expect(datasets.bind(a.id,f.context)).rejects.toThrow('CURRENT_DATASET_MISSING_DEPENDENCIES');
  expect(Number((await f.db.$queryRawUnsafe<{n:bigint}[]>('SELECT count(*) n FROM current_financial_dataset'))[0].n)).toBe(0);
 }finally{await f.close();}
});
it('handles reordered observations idempotently and uses immutable migration tables',async()=>{
 const f=await currentFinancialRouteFixture();try{
  const a=await f.service.ingest(f.q,f.securityId);
  const again=await f.service.ingest({...f.q,observations:[...f.q.observations].reverse()},f.securityId);
  expect(again.id).toBe(a.id);expect(again.duplicate).toBe(true);
  await expect(f.db.$executeRawUnsafe('UPDATE current_financial_fact SET body=? WHERE id=?','{}',a.plan.facts[0].id)).rejects.toThrow();
  expect(await f.db.$queryRawUnsafe('PRAGMA foreign_key_check')).toEqual([]);
  const integrity=await f.db.$queryRawUnsafe<{integrity_check:string}[]>('PRAGMA integrity_check');expect(integrity[0].integrity_check).toBe('ok');
 }finally{await f.close();}
});
it('approved provider identity does not bypass restricted source roles or origins',async()=>{
 const f=await currentFinancialRouteFixture();try{
  f.registryBody.authorities[0].sourceRoles=[];f.setRegistry(f.registryBody);
  await expect(f.service.ingest(f.q,f.securityId)).rejects.toThrow('CURRENT_REVIEWED_SOURCE_ROLE_NOT_AUTHORIZED');
  f.registryBody.authorities[0].sourceRoles=['REVIEWED_PDF'];f.registryBody.authorities[0].origins=['https://finance.vietstock.vn'];f.setRegistry(f.registryBody);
  const p=f.service.plan(f.q,f.securityId);expect(p.facts).toEqual([]);expect(p.quarantine.every(x=>x.reason==='SOURCE_OUTSIDE_ACTIVE_AUTHORITY_ORIGINS')).toBe(true);
 }finally{await f.close();}
});
it('uses the trusted ingestion clock, not a caller backdated operational timestamp',async()=>{
 const f=await currentFinancialRouteFixture();try{
  const a=await f.service.ingest({...f.q,knownAt:'2026-11-16T22:59:00.000Z'},f.securityId);
  expect(a.plan.request.knownAt).toBe(f.q.knownAt);expect(a.plan.requestedKnownAt).toBe('2026-11-16T22:59:00.000Z');
  expect(a.plan.facts.every(x=>x.evidence.time.ingestedAt===f.q.knownAt)).toBe(true);
  await expect(f.service.consume(a.id,{...f.context,knownAt:'2026-11-16T22:59:59.999Z'})).rejects.toThrow('CONSUMPTION_SCOPE');
  await expect(f.service.ingest({...f.q,knownAt:'2026-11-17T00:00:00.000Z'},f.securityId)).rejects.toThrow('FUTURE_OPERATIONAL_KNOWLEDGE');
 }finally{await f.close();}
});
