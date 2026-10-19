// @vitest-environment node
import { it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { RetainedMarketAuthority } from '@/infrastructure/market-boundary-authority';
import { testDatabase } from '../fixtures/database';
import { PrismaBoundaryStore } from '@/infrastructure/repositories/market-boundary';
import { seal, reference } from '@/domain/market-boundary/validation';
import { snapshotHash as hash } from '@/infrastructure/fundamentals/snapshot-hash';
import {at,harness,analysis,decision,portfolio} from '../fixtures/market-boundary';
it('additive migration preserves legacy rows; immutable vNext reader fails unknown/hash/index; decision append cannot bypass seal',async()=>{
 const db=await testDatabase();try{
  expect(db.migration('status')).toBe(0);const repo=new PrismaBoundaryStore(db.client,{now:()=>at as ReturnType<import('@/ports/runtime').Clock['now']>});
  const p=seal('PORTFOLIO','binding',at,at,{portfolioSnapshotId:'old-id',portfolioAsOf:at,ledgerWatermark:'unchanged',cash:'0',positionsHash:hash([]),costBasisHash:hash([]),pendingTransactionsHash:hash([]),navInputs:[],accountingVersion:'unchanged'},hash);
  await repo.append(p);expect(await repo.find(reference(p),'PORTFOLIO')).toEqual(p);
  await expect(repo.find({...reference(p),hash:'a'.repeat(64)},'PORTFOLIO')).rejects.toThrow();
  await expect(db.client.marketBoundaryRecord.update({where:{id:p.id},data:{body:'{}'}})).rejects.toThrow();
  await expect(db.client.marketBoundaryRecord.delete({where:{id:p.id}})).rejects.toThrow();
  const future={...p,id:'future',contractVersion:'unsupported'};await db.client.marketBoundaryRecord.create({data:{id:'future',kind:'PORTFOLIO',contractVersion:'unsupported',createdAt:at,body:JSON.stringify(future),bodyHash:future.contentHash}});
  await expect(repo.find({id:future.id,hash:future.contentHash},'PORTFOLIO')).rejects.toThrow('UNSUPPORTED_VERSION');
  expect(await db.client.decisionArtifact.count()).toBe(0);expect(await db.client.marketBoundaryDecisionSeal.count()).toBe(0);
  expect(await db.client.$queryRawUnsafe('PRAGMA foreign_key_check')).toEqual([]);
 }finally{await db.close();}
},30000);
it('migration is additive and immutable source statements remain present',()=>{
 const sql=readFileSync('prisma/migrations/202610190002_market_boundary/migration.sql','utf8');expect(sql).not.toMatch(/DROP|ALTER TABLE/i);expect(sql).toContain('market_boundary_record_no_update');expect(sql).toContain('market_boundary_seal_no_delete');
});

it('atomic decision insert+seal rolls back on missing dependencies, changed head or seal failure',async()=>{
 const db=await testDatabase();try{
  const h=harness(),repo=new PrismaBoundaryStore(db.client,{now:()=>at as ReturnType<import('@/ports/runtime').Clock['now']>});
  for(const r of [h.cap,h.init,h.market,analysis(h),portfolio()])await repo.append(r);
  const d=decision(h);
  await expect(repo.append(d)).rejects.toThrow('DECISION_REQUIRES_ATOMIC_SEAL');
  await expect(repo.sealDecision(d,h.dependency)).rejects.toThrow('DEPENDENCIES_CHANGED_AT_PUBLICATION');
  expect(await db.client.marketBoundaryRecord.findUnique({where:{id:d.id}})).toBeNull();
  await db.client.marketBoundaryDependencyHead.create({data:{id:h.dependency.id,bodyHash:h.dependency.hash,updatedAt:at}});
  // A failing insert must rollback the first write as well.
  await db.client.$executeRawUnsafe(`CREATE TRIGGER test_seal_failure BEFORE INSERT ON market_boundary_decision_seal BEGIN SELECT RAISE(ABORT,'injected persistence failure'); END`);
  await expect(repo.sealDecision(d,h.dependency)).rejects.toThrow();
  expect(await db.client.marketBoundaryRecord.findUnique({where:{id:d.id}})).toBeNull();
  await db.client.$executeRawUnsafe('DROP TRIGGER test_seal_failure');
  const expiredRepo=new PrismaBoundaryStore(db.client,{now:()=> '2026-10-25T08:00:00.000Z' as ReturnType<import('@/ports/runtime').Clock['now']>});
  await expect(expiredRepo.sealDecision(d,h.dependency)).rejects.toThrow('FRESHNESS_EXPIRED_AT_SEAL');
  expect(await db.client.marketBoundaryRecord.findUnique({where:{id:d.id}})).toBeNull();
  await repo.sealDecision(d,h.dependency);
  expect(await db.client.marketBoundaryDecisionSeal.count()).toBe(1);
  expect(await repo.find(reference(d),'DECISION')).toEqual(d);
  await expect(db.client.marketBoundaryDecisionSeal.deleteMany()).rejects.toThrow();
 }finally{await db.close();}
},30000);
it('retained raw bytes rehash/replay; missing raw, mismatch and unknown schema block (synthetic corpus, no production certification)',async()=>{
 const root=mkdtempSync(join(tmpdir(),'boundary-raw-'));try{
  const h=harness(),bytes=Buffer.from('{"synthetic":true}');writeFileSync(join(root,'raw.json'),bytes);
  const source={...h.cap.body.rawSamples[0],hash:createHash('sha256').update(bytes).digest('hex')};
  const rows=[{...h.market.body.observations[0],source:{id:source.id,hash:source.hash}}];
  const cap=seal('CAPABILITY','fixture-cap',at,h.cap.knownAt,{...h.cap.body,rawSamples:[source],normalizedSampleHash:hash(rows)},hash);
  const approvals=[cap.body.sourceContract,cap.body.corporateActionPolicy,cap.body.freshnessPolicy,cap.body.calendar,cap.body.negativeValidation,source.request];
  const bindings={approvals,policies:[h.policy],adapters:[{sourceId:'test-source',schemaVersion:'test-v1',normalizerVersion:'n-v1',identityVersion:'identity-v1',semanticsVersion:'sem-v1',identities:[{securityId:'TCX',ticker:'TCX',exchange:'HOSE',from:'2020-01-01',to:null,knownAt:source.request.knownAt}],field:'CLOSE' as const,adjustment:'RAW' as const,normalize:()=>rows}],marketCurrent:async()=>{},initializationCurrent:async()=>{},portfolioCurrent:async()=>{},prerequisite:async()=>{},currentDependencies:async()=>h.dependency};
  const authority=new RetainedMarketAuthority(root,bindings);await expect(authority.replayCapability(cap)).resolves.toBeUndefined();
  for(const patch of [{ticker:'REUSED'},{currency:'USD'},{unit:'UNKNOWN'},{field:'UNKNOWN'},{adjustment:'UNKNOWN'},{conflict:'SOURCE_CONFLICT'}]){
    const badRows=rows.map(o=>({...o,...patch})) as typeof rows;
    const badAdapter={...bindings.adapters[0],normalize:()=>badRows};
    const badCap=seal('CAPABILITY','bad-cap',at,cap.knownAt,{...cap.body,normalizedSampleHash:hash(badRows)},hash);
    await expect(new RetainedMarketAuthority(root,{...bindings,adapters:[badAdapter]}).replayCapability(badCap)).rejects.toThrow();
  }
  writeFileSync(join(root,'raw.json'),'changed');await expect(authority.replayCapability(cap)).rejects.toThrow('RAW_HASH_MISMATCH');
  rmSync(join(root,'raw.json'));await expect(authority.replayCapability(cap)).rejects.toThrow();
  await expect(new RetainedMarketAuthority(root,{...bindings,adapters:[]}).replayCapability(cap)).rejects.toThrow('NO_QUALIFIED_REAL_SOURCE_ADAPTER');
 }finally{rmSync(root,{recursive:true,force:true});}
});
