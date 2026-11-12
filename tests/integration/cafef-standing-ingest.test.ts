// @vitest-environment node
import { describe,it,expect } from 'vitest';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { cafefFixture } from '../fixtures/cafef-standing';
import { ingestCafef, ingestItem, ingestRetainedCafef, validateCafefLifecycle } from '../../app/server/cafef-standing-services';
import { buildCafefCandidate, buildCafefCandidateFromBytes, assertStandingTrust, availability, cafefAuthority, implementationPins, consumeCafefValuation } from '@/infrastructure/market-boundary/cafef-standing';
import { reference, seal } from '@/domain/market-boundary/validation';
import { snapshotHash as hash } from '@/infrastructure/fundamentals/snapshot-hash';
const count=async(f:Awaited<ReturnType<typeof cafefFixture>>,table:string)=>Number((await f.db.$queryRawUnsafe<{n:bigint}[]>('SELECT COUNT(*) AS n FROM '+table))[0].n);
const request=(c:ReturnType<typeof buildCafefCandidate>)=>({mode:'HISTORICAL' as const,requestedAt:c.market.body.requestedAsOf,knownAt:c.spec.knownAt,now:c.spec.knownAt,purpose:'VALUATION' as const,securityIds:[c.market.body.observations[0].securityId],universe:c.market.body.universe});
describe('SYNTHETIC: standing-policy lifecycle and existing SQLite boundary, not real source approval',()=>{
 it('raw ingestion transforms and commits actual capability/market lifecycle plus atomic provenance',async()=>{
  const f=await cafefFixture();try{
   const c=f.make();const result=await ingestCafef(f.root,f.repo,'fixture-run',[c],f.trust);
   expect(result.accepted).toEqual([c.market.id]);expect(await count(f,'market_boundary_record')).toBe(2);
   expect(await count(f,'market_boundary_ingest_raw')).toBe(1);expect(await count(f,'market_boundary_ingest_link')).toBe(1);
   const row=await f.repo.find(reference(c.market),'MARKET');expect(row.body.observations[0]).toMatchObject({value:'56900',field:'CLOSE',adjustment:'RAW',unit:'VND_PER_SHARE'});
   const consumed=await consumeCafefValuation(f.root,c,f.trust,f.repo,request(c));
   expect(consumed.freshness.status).toBe('PASS');expect(consumed.financialEvidenceAdmission).toBe('F2_OPEN');expect(consumed.historicalPIT).toBe(false);
  }finally{await f.close();}
 });
 it('immutable raw bytes/links, duplicate ingest and changed-ingestion-time retries are idempotent',async()=>{
  const f=await cafefFixture();try{
   const c=f.make();await ingestCafef(f.root,f.repo,'run-a',[c],f.trust);
   const duplicate=await ingestCafef(f.root,f.repo,'run-b',[c],f.trust);expect(duplicate.duplicates).toEqual([c.market.id]);
   const later=buildCafefCandidate(f.root,f.profile,{...c.spec,knownAt:new Date(Date.parse(f.at)+1000).toISOString()});
   expect((await ingestCafef(f.root,f.repo,'run-c',[later],f.trust)).duplicates).toEqual([c.market.id]);
   expect(await count(f,'market_boundary_record')).toBe(2);
   expect(await f.repo.revokeMarketRun('run-b',f.at,'duplicate run rollback')).toBe(0);
   await expect(f.db.$executeRawUnsafe("UPDATE market_boundary_ingest_raw SET raw_text='{}'")).rejects.toThrow();
   await expect(f.db.$executeRawUnsafe('DELETE FROM market_boundary_ingest_link')).rejects.toThrow();
  }finally{await f.close();}
 });
 it('adjusted-only revisions cannot alter raw-close acceptance; all original receipts remain immutable',async()=>{
  const f=await cafefFixture();try{
   const c=f.make();await ingestCafef(f.root,f.repo,'initial',[c],f.trust);
   const revised=f.make('VNM','2026-10-30',f.raw('VNM',['2026-10-30'],{},56.9,999999));
   expect(revised.market.body.observations[0].value).toBe('56900');
   expect((await ingestCafef(f.root,f.repo,'adjusted-audit',[revised],f.trust)).duplicates).toEqual([c.market.id]);
   expect(await count(f,'market_boundary_record')).toBe(2);expect(await count(f,'market_boundary_ingest_raw')).toBe(2);
   expect(await count(f,'market_boundary_ingest_receipt')).toBe(1);
   await ingestCafef(f.root,f.repo,'adjusted-audit-repeat',[revised],f.trust);
   expect(await count(f,'market_boundary_ingest_receipt')).toBe(1);
   expect((await consumeCafefValuation(f.root,c,f.trust,f.repo,request(c))).observation.value).toBe('56900');
  }finally{await f.close();}
 });
 it('partial batch failure rolls back raw, capability, market and links; quarantine stays separate',async()=>{
  const f=await cafefFixture();try{
   const raw=f.raw('VNM',['2026-10-29','2026-10-30']);const a=f.make('VNM','2026-10-29',raw),b=f.make('VNM','2026-10-30',raw);
   const items=[ingestItem(a),ingestItem(b)];let n=0;
   await expect(f.repo.commitMarketIngest('partial',{hash:raw.sha256,provider:'CAFEF_PRICE_HISTORY',path:raw.path,text:a.rawText},items,async(store,reader,item)=>{
    if(++n===2)throw Error('INJECTED_SECOND_OBSERVATION_FAILURE');
    await validateCafefLifecycle(f.root,item.market.id===a.market.id?a:b,f.trust,store,reader);
   })).rejects.toThrow('INJECTED_SECOND_OBSERVATION_FAILURE');
   for(const table of ['market_boundary_record','market_boundary_ingest_raw','market_boundary_ingest_link'])expect(await count(f,table)).toBe(0);
   const id=await f.repo.quarantineMarket({hash:raw.sha256,provider:'CAFEF_PRICE_HISTORY',path:raw.path,text:a.rawText},'INJECTED_SECOND_OBSERVATION_FAILURE',{run:'partial'});
   expect(await f.repo.quarantineMarket({hash:raw.sha256,provider:'CAFEF_PRICE_HISTORY',path:raw.path,text:a.rawText},'INJECTED_SECOND_OBSERVATION_FAILURE',{run:'partial'})).toBe(id);
   expect(await count(f,'market_boundary_ingest_quarantine')).toBe(1);expect(await count(f,'market_boundary_record')).toBe(0);
  }finally{await f.close();}
 });
 it('rollback appends revocations and preserves evidence; valuation refuses revoked observations',async()=>{
  const f=await cafefFixture();try{
   const c=f.make();await ingestCafef(f.root,f.repo,'rollback-run',[c],f.trust);
   expect(await f.repo.revokeMarketRun('rollback-run',f.at,'fixture rollback')).toBe(1);
   expect(await count(f,'market_boundary_record')).toBe(2);expect(await count(f,'market_boundary_ingest_raw')).toBe(1);
   await expect(consumeCafefValuation(f.root,c,f.trust,f.repo,request(c))).rejects.toThrow('MARKET_INGEST_REVOKED');
   await expect(ingestCafef(f.root,f.repo,'reingest-revoked',[c],f.trust)).rejects.toThrow('OBSERVATION_REVOKED_REQUALIFICATION_REQUIRED');
  }finally{await f.close();}
 });
 it('deterministic replay and valuation can use immutable SQLite raw after the source file is removed',async()=>{
  const f=await cafefFixture();try{
   const c=f.make();await ingestCafef(f.root,f.repo,'stored-raw',[c],f.trust);rmSync(resolve(f.root,c.spec.raw.path));
   const bytes=await f.repo.retainedRaw(c.market.body.sources[0]);const replay=buildCafefCandidateFromBytes(f.root,c.profile,c.spec,bytes);
   expect(replay.market.contentHash).toBe(c.market.contentHash);
   expect((await consumeCafefValuation(f.root,c,f.trust,f.repo,request(c))).observation.value).toBe('56900');
  }finally{await f.close();}
 });
 it('one standing material acceptance supports multiple tickers without inheriting financial facts',async()=>{
  const f=await cafefFixture();try{
   for(const ticker of ['VNM','FPT','HPG','VCB']){
    const c=f.make(ticker);expect(c.materialHash).toBe(f.material);await ingestCafef(f.root,f.repo,'multi-'+ticker,[c],f.trust);
    expect(c.market.body.observations[0].ticker).toBe(ticker);
   }
   expect(await count(f,'market_boundary_ingest_link')).toBe(4);expect(await count(f,'market_boundary_record')).toBe(8);
   await expect(f.repo.find(reference(f.make('FPT').market),'MARKET').then(r=>{if(r.body.observations[0].ticker!=='VNM')throw Error('CROSS_TICKER_NOT_VNM');})).rejects.toThrow('CROSS_TICKER_NOT_VNM');
  }finally{await f.close();}
 });
 it('missing/superseded standing authorization and unaccepted material cannot write',async()=>{
  const f=await cafefFixture();try{
   const c=f.make();f.unapprove();await expect(ingestCafef(f.root,f.repo,'unapproved',[c],f.trust)).rejects.toThrow('INDEPENDENT_MATERIAL_ACCEPTANCE_REQUIRED');
   f.suspend();await expect(ingestCafef(f.root,f.repo,'superseded',[c],f.trust)).rejects.toThrow('STANDING_AUTHORIZATION_MISSING_OR_SUPERSEDED');
   expect(await count(f,'market_boundary_record')).toBe(0);
  }finally{await f.close();}
 });
 it('later receipts remain later; October-knownAt and unsupported LIVE purpose are rejected',async()=>{
  const f=await cafefFixture();try{
   const c=f.make();expect(c.provenance.originalReceivedAt).toBe('2026-11-11T00:00:00.000123+00:00');expect(c.market.body.observations[0].availableAt).toBe('2026-11-11T00:00:00.001Z');
   expect(availability(c.provenance.originalReceivedAt)).toBe(c.provenance.canonicalAvailability);
   expect(()=>buildCafefCandidate(f.root,f.profile,{...c.spec,knownAt:'2026-10-30T08:00:00.000Z'})).toThrow('MATERIAL_KNOWLEDGE');
   await ingestCafef(f.root,f.repo,'later',[c],f.trust);
   await expect(consumeCafefValuation(f.root,c,f.trust,f.repo,{...request(c),mode:'LIVE'})).rejects.toThrow('CAFEF_VALUATION_PURPOSE_SCOPE');
  }finally{await f.close();}
 });
 it('trusted server clock rejects invented future ingestion/consumption times',async()=>{
  const f=await cafefFixture();try{
   const c=f.make();const future=buildCafefCandidate(f.root,f.profile,{...c.spec,knownAt:'2099-01-01T00:00:00.000Z'});
   await expect(ingestCafef(f.root,f.repo,'future',[future],f.trust)).rejects.toThrow('FUTURE_INGESTION_KNOWLEDGE');
   expect(await count(f,'market_boundary_record')).toBe(0);expect(await count(f,'market_boundary_ingest_raw')).toBe(0);
   await ingestCafef(f.root,f.repo,'present',[c],f.trust);
   await expect(consumeCafefValuation(f.root,c,f.trust,f.repo,{...request(c),knownAt:'2099-01-01T00:00:00.000Z',now:'2099-01-01T00:00:00.000Z'})).rejects.toThrow('FUTURE_REQUEST');
  }finally{await f.close();}
 });
 it.each(['MISSING_RAW','ADJUSTED_ONLY','WRONG_UNIT','WRONG_TICKER','WRONG_EXCHANGE','NON_TRADING','SCHEMA','ROW_SCHEMA','RAW_HASH'])('%s fails closed before any acceptance',async kind=>{
  const f=await cafefFixture();try{
   const raw=f.raw();let data=JSON.parse(readFileSync(resolve(f.root,raw.path),'utf8'));
   if(kind==='MISSING_RAW'||kind==='ADJUSTED_ONLY'){
    data.prices[0].raw.GiaDongCua=null;const b=JSON.parse(data.requests[0].rawResponse);b.Data.Data[0].GiaDongCua=null;if(kind==='ADJUSTED_ONLY'){delete data.prices[0].raw.GiaDongCua;delete b.Data.Data[0].GiaDongCua;}data.requests[0].rawResponse=JSON.stringify(b);
    const h=(await import('@/infrastructure/market-boundary/cafef-standing')).bytesHash(data.requests[0].rawResponse);data.requests[0].sha256=h;data.prices[0].responseSha256=h;
   }
   if(kind==='WRONG_UNIT')data.units='VND_PER_SHARE';if(kind==='WRONG_TICKER')data.symbol='FPT';if(kind==='WRONG_EXCHANGE')data.exchange='HNX';if(kind==='SCHEMA')data.schemaVersion=2;
   if(kind==='ROW_SCHEMA'){const b=JSON.parse(data.requests[0].rawResponse);b.Data.Data[0].NewSemantic='unknown';data.prices[0].raw.NewSemantic='unknown';data.requests[0].rawResponse=JSON.stringify(b);const h=(await import('@/infrastructure/market-boundary/cafef-standing')).bytesHash(data.requests[0].rawResponse);data.requests[0].sha256=h;data.prices[0].responseSha256=h;}
   let pin=f.write(raw.path,JSON.stringify(data));if(kind==='RAW_HASH'){writeFileSync(resolve(f.root,raw.path),'tampered');}
   if(kind!=='NON_TRADING')expect(()=>f.make('VNM','2026-10-30',pin)).toThrow();
   if(kind==='NON_TRADING')expect(()=>f.make('VNM','2026-10-25')).toThrow('NON_TRADING_DATE');
   expect(await count(f,'market_boundary_record')).toBe(0);
  }finally{await f.close();}
 });
 it('raw entrypoint normalizes in ingestion and quarantines invalid observations with exact reasons',async()=>{
  const f=await cafefFixture();try{
   const raw=f.raw();const valid=await ingestRetainedCafef(f.root,f.repo,'direct-raw',f.profile,[{raw,ticker:'VNM',exchange:'HOSE',date:'2026-10-30',knownAt:f.at}],f.trust);
   expect(valid.status).toBe('ACCEPTED_OR_IDEMPOTENT');expect(await count(f,'market_boundary_ingest_link')).toBe(1);
   const bad=f.raw('FPT',['2026-10-30'],{units:'UNDECLARED_OR_WRONG'});
   const quarantined=await ingestRetainedCafef(f.root,f.repo,'bad-unit',f.profile,[{raw:bad,ticker:'FPT',exchange:'HOSE',date:'2026-10-30',knownAt:f.at}],f.trust);
   expect(quarantined).toMatchObject({status:'QUARANTINED',accepted:[],reason:'MARKET_BOUNDARY:ORIGINAL_UNITS_CONTRADICT_STANDING_CONTRACT'});
   expect(await count(f,'market_boundary_ingest_link')).toBe(1);expect(await count(f,'market_boundary_ingest_quarantine')).toBe(1);
  }finally{await f.close();}
 });
 it('an accepted source does not permit conflicting replacement or cross-ticker batch contamination',async()=>{
  const f=await cafefFixture();try{
   const c=f.make();await ingestCafef(f.root,f.repo,'original',[c],f.trust);
   const changed=f.make('VNM','2026-10-30',f.raw('VNM',['2026-10-30'],{},57));
   await expect(ingestCafef(f.root,f.repo,'conflict',[changed],f.trust)).rejects.toThrow('DUPLICATE_OBSERVATION_CONFLICT');
   const other=f.make('FPT');await expect(ingestCafef(f.root,f.repo,'mixed',[changed,other],f.trust)).rejects.toThrow('ATOMIC_BATCH_REQUIRES_SAME_RAW');
   expect(await count(f,'market_boundary_ingest_link')).toBe(1);
   expect((await consumeCafefValuation(f.root,c,f.trust,f.repo,request(c))).observation.value).toBe('56900');
  }finally{await f.close();}
 });
 it('unknown capture, out-of-range membership and wrong API identity remain unqualified',async()=>{
  const f=await cafefFixture();try{
   const c=f.make();const noCapture={...f.trust,capturedSource:()=>null};
   await expect(ingestCafef(f.root,f.repo,'untrusted',[c],noCapture)).rejects.toThrow('UNTRUSTED_CAPTURE_EVIDENCE');
   expect(()=>f.make('VNM','2026-07-31')).toThrow('VN30_MEMBERSHIP_OUTSIDE_VERIFIED_INTERVAL');
   const raw=f.raw();const data=JSON.parse(readFileSync(resolve(f.root,raw.path),'utf8'));
   data.requests[0].url=data.prices[0].sourceUrl='https://unapproved.invalid/price?Symbol=VNM';
   const bad=f.write(raw.path,JSON.stringify(data));expect(()=>f.make('VNM','2026-10-30',bad)).toThrow('API_IDENTITY_MISMATCH');
  }finally{await f.close();}
 });
 it('recomputed profile after a code change still needs new independent material acceptance',async()=>{
  const f=await cafefFixture();try{
   const c=f.make();writeFileSync(resolve(f.root,'src/domain/market-boundary/cafef-raw-close.ts'),'changed implementation bytes');
   f.profile.code=implementationPins(f.root);const next=f.make('VNM','2026-10-30',c.spec.raw);
   expect(next.materialHash).not.toBe(c.materialHash);
   await expect(ingestCafef(f.root,f.repo,'requalify',[next],f.trust)).rejects.toThrow('INDEPENDENT_MATERIAL_ACCEPTANCE_REQUIRED');
  }finally{await f.close();}
 });
 it('valuation requires an accepted link and cannot consume another security or purpose',async()=>{
  const f=await cafefFixture();try{
   const c=f.make();await expect(consumeCafefValuation(f.root,c,f.trust,f.repo,request(c))).rejects.toThrow('ACCEPTED_RAW_NORMALIZED_LINK_REQUIRED');
   await ingestCafef(f.root,f.repo,'scope',[c],f.trust);
   await expect(consumeCafefValuation(f.root,c,f.trust,f.repo,{...request(c),securityIds:['FPT']})).rejects.toThrow('CAFEF_VALUATION_PURPOSE_SCOPE');
   await expect(consumeCafefValuation(f.root,c,f.trust,f.repo,{...request(c),purpose:'SCORING'})).rejects.toThrow('CAFEF_VALUATION_PURPOSE_SCOPE');
   f.suspend();await expect(consumeCafefValuation(f.root,c,f.trust,f.repo,request(c))).rejects.toThrow('STANDING_AUTHORIZATION_MISSING_OR_SUPERSEDED');
  }finally{await f.close();}
 });
 it('default filesystem authority replay retains original source hash checks',async()=>{
  const f=await cafefFixture();try{
   const c=f.make(),a=await cafefAuthority(f.root,c,f.trust);
   await expect(a.replayCapability(c.capability)).resolves.toBeUndefined();
   writeFileSync(resolve(f.root,c.spec.raw.path),'changed raw evidence');
   await expect(a.replayMarket(c.market)).rejects.toThrow('RAW_HASH_MISMATCH');
  }finally{await f.close();}
 });
 it('tampered candidate/replay and changed code/semantics require new qualification',async()=>{
  const f=await cafefFixture();try{
   const c=f.make(),o={...c.market.body.observations[0],value:'1'};
   const bad={...c,market:seal('MARKET',c.market.id,c.market.createdAt,c.market.knownAt,{...c.market.body,observations:[o]},hash)};
   expect(()=>assertStandingTrust(f.root,bad,f.trust)).toThrow('CANDIDATE_REPLAY_MISMATCH');
   writeFileSync(resolve(f.root,'src/domain/market-boundary/cafef-raw-close.ts'),'changed implementation');
   expect(()=>assertStandingTrust(f.root,c,f.trust)).toThrow('SOURCE_HASH_MISMATCH');
  }finally{await f.close();}
 });
});
