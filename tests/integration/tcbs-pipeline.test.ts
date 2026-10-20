// @vitest-environment node
import {it,expect} from 'vitest';
import {readFileSync,mkdtempSync,rmSync,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {buildTcbsPipeline,createTcbsEodAdapter,replayTcbsPipeline,requireTcbsIndependentAcceptance,hashBytes,type TcbsPipelineCandidate} from '@/infrastructure/market-boundary/tcbs-pipeline';
import {readTcbsCandidateStatus,type TcbsCandidateBinding} from '@/infrastructure/market-boundary/status';
import {PinnedFiles} from '@/infrastructure/market-boundary/tcbs-pipeline';
import {RetainedMarketAuthority} from '@/infrastructure/market-boundary-authority';
import {testDatabase} from '../fixtures/database';
import {PrismaBoundaryStore} from '@/infrastructure/repositories/market-boundary';
import {reference,seal} from '@/domain/market-boundary/validation';
const binding=()=>JSON.parse(readFileSync('data/market-boundary/active-candidate.json','utf8')) as TcbsCandidateBinding;
const candidate=()=>JSON.parse(readFileSync(binding().path,'utf8')) as TcbsPipelineCandidate;
it('REAL retained full30 corpus replays canonical/market evidence with29/1 and activeTCX; no investment output',()=>{
 const c=candidate();expect(snapshotHash(c)).toBe(binding().sha256);expect(replayTcbsPipeline(process.cwd(),c)).toEqual(c);
 expect(c.market.body.observations).toHaveLength(30);expect(c.capability.body.rawSamples.every(s=>s.origin==='REAL_SOURCE')).toBe(true);
 expect(c.initialization.body.members.filter(m=>m.state==='SCORABLE')).toHaveLength(29);expect(c.initialization.body.members.find(m=>m.ticker==='MBB')?.state).toBe('DEFERRED');
 expect(c.initialization.body.exceptions[0]).toMatchObject({status:'ACTIVE',amountVnd:'5284485167173',classification:'OWNER_ANALYTICAL_EXCEPTION'});
 expect(c.initializationCandidate).toBe('PASS_CANDIDATE');expect(c.financialFreshness.every(f=>f.status==='CURRENT')).toBe(true);
 expect(c).toMatchObject({independentAcceptance:'PENDING_INDEPENDENT_REVIEW',readyForScoring:false,decisionReady:false});
});
it('REAL raw corpus passes existing retained authority rehash/normalization with test-only approval bindings; real acceptance stays denied',async()=>{
 const c=candidate(),cap=c.capability.body,authority=new RetainedMarketAuthority(process.cwd(),{adapters:[createTcbsEodAdapter(c.profile)],policies:[c.policy],approvals:[cap.sourceContract,cap.calendar,cap.corporateActionPolicy,cap.freshnessPolicy,cap.negativeValidation,...cap.rawSamples.map(s=>s.request)],marketCurrent:async()=>{},initializationCurrent:async()=>{},portfolioCurrent:async()=>{},prerequisite:async()=>{},currentDependencies:async()=>({id:'test-only',hash:snapshotHash('fixture')})});
 await expect(authority.replayCapability(c.capability)).resolves.toBeUndefined();await expect(authority.replayMarket(c.market)).resolves.toBeUndefined();
 expect(()=>requireTcbsIndependentAcceptance(c,[])).toThrow('INDEPENDENT_ACCEPTANCE_REQUIRED');
});
it('market expiry never invalidates historical capability/init replay; runtime status separates technical candidate from acceptance',()=>{
 const c=candidate(),s=readTcbsCandidateStatus(process.cwd(),'2026-10-25T08:00:00.000Z',binding());
 expect(s).toMatchObject({marketCapability:true,initialized:false,initializationCandidate:'PASS_CANDIDATE',marketCurrent:false,analysisReady:false,decisionReady:false,marketSnapshotCandidate:'BLOCKED'});
 expect(readTcbsCandidateStatus(process.cwd(),c.input.builtAt,null).marketCapability).toBe(false);
 expect(replayTcbsPipeline(process.cwd(),c).initialization.contentHash).toBe(c.initialization.contentHash);
});
it('raw hash mismatch and unknown candidate version fail closed without changing retained evidence',()=>{
 const temp=mkdtempSync(join(tmpdir(),'tcbs-pin-'));try{mkdirSync(join(temp,'data'));writeFileSync(join(temp,'data','raw.json'),'{}');const files=new PinnedFiles(temp);expect(()=>files.read('data/raw.json','0'.repeat(64))).toThrow('SOURCE_HASH_MISMATCH');
 const c=candidate();expect(()=>replayTcbsPipeline(process.cwd(),{...c,version:'unknown'} as unknown as TcbsPipelineCandidate)).toThrow('UNSUPPORTED_TCBS_PIPELINE');expect(readTcbsCandidateStatus(temp,c.input.builtAt)).toMatchObject({marketCapability:false,marketCurrent:false});}finally{rmSync(temp,{recursive:true});}
});
it('additive immutable snapshot storage replays real candidate contracts on isolated DB; no production writes',async()=>{
 const db=await testDatabase();try{const c=candidate(),repo=new PrismaBoundaryStore(db.client);
 for(const r of [c.capability,c.initialization,c.market])await repo.append(r);
 expect(await repo.find(reference(c.capability),'CAPABILITY')).toEqual(c.capability);expect(await repo.find(reference(c.initialization),'INITIALIZATION')).toEqual(c.initialization);
 expect(await db.client.decisionArtifact.count()).toBe(0);expect(await db.client.marketBoundaryDecisionSeal.count()).toBe(0);expect(await db.client.fundamentalAdmissionRun.count()).toBe(0);
 expect(()=>seal('MARKET','test-conflict',c.market.createdAt,c.market.knownAt,{...c.market.body,observations:c.market.body.observations.map((o,i)=>i?o:{...o,value:'0'})},snapshotHash)).toThrow('PRICE_UNIT_CURRENCY');
 }finally{await db.close();}
});
it('protected production database bytes retain starting fingerprint',()=>{
 const baseline=JSON.parse(readFileSync('docs/fundamental-data-engine/evidence/2026-10-19-di-market-data-boundary-amendment/PROTECTED_DATA_HASHES.json','utf8'));
 expect(hashBytes(readFileSync('data/vn30.sqlite'))).toBe(baseline['data/vn30.sqlite']);
});

it('preopen board without matchPrice never replaces a completed-session candidate or becomes zero',()=>{
 const c=candidate(),before=readFileSync('data/market-boundary/active-candidate.json','utf8');
 expect(()=>buildTcbsPipeline(process.cwd(),{...c.input,boardFolder:c.input.captureFolder})).toThrow('BOARD_COMPLETED_CLOSE_UNAVAILABLE');
 expect(readFileSync('data/market-boundary/active-candidate.json','utf8')).toBe(before);
});
