import { describe, it, expect } from 'vitest';
import { snapshotHash as hash } from '@/infrastructure/fundamentals/snapshot-hash';
import { seal, readSealed, reference } from '@/domain/market-boundary/validation';
import { marketFreshness } from '@/domain/market-boundary/freshness';
import { boundaryCandidateReadiness } from '@/application/market-boundary/readiness';
import { rankPolicyB, rankScorecards } from '@/domain/ranking/rank';
import { RetainedMarketAuthority } from '@/infrastructure/market-boundary-authority';
import { rankingFixture, ASOF, IDS } from '../fixtures/scoring';
import { at, before, later, fixture, proof, changeMarket, harness, analysis, decision, setup } from '../fixtures/market-boundary';
describe('prospective market boundary (synthetic enforcement tests, not source qualification)',()=>{
 it('binds full30,29/1,MBB quarantine and active TCX without current prices',()=>{
  const {init}=fixture();expect(init.body.members).toHaveLength(30);expect(init.body.members.filter(m=>m.state==='SCORABLE')).toHaveLength(29);expect(init.body.members.find(m=>m.ticker==='MBB')?.state).toBe('DEFERRED');expect(init.body.exceptions[0].amountVnd).toBe('5284485167173');expect('market' in init.body).toBe(false);
 });
 it('capability cannot mean current market or decision readiness',()=>{expect(boundaryCandidateReadiness(true)).toMatchObject({initialized:false,initializationCandidate:'BLOCKED',marketCurrent:false,analysisReady:false,decisionReady:false,readyForScoring:false});expect(boundaryCandidateReadiness(false).initializationCandidate).toBe('BLOCKED');expect(boundaryCandidateReadiness(true,true,true).initializationCandidate).toBe('PASS_CANDIDATE');});
 it('unknown contract version and modified payload fail closed',()=>{const {init}=fixture();expect(()=>readSealed({...init,contractVersion:'future'},'INITIALIZATION',hash)).toThrow('UNSUPPORTED_VERSION');expect(()=>readSealed({...init,id:'changed'},'INITIALIZATION',hash)).toThrow('CONTENT_HASH_MISMATCH');});
 it('real-source missing raw blocks capability and initialization',async()=>{const h=harness();h.authority.replayCapability=async()=>{throw Error('RAW_NOT_AVAILABLE');};await expect(h.lifecycle.qualifyCapability(h.cap)).rejects.toThrow('RAW_NOT_AVAILABLE');await expect(h.lifecycle.initialize(h.init)).rejects.toThrow('MISSING');expect(h.records.size).toBe(0);});
 it('mock-only capability fails contract validation',()=>{const {cap}=fixture();expect(()=>seal('CAPABILITY',cap.id,at,before,{...cap.body,rawSamples:cap.body.rawSamples.map(s=>({...s,origin:'SYNTHETIC_TEST'}))},hash)).toThrow('REAL_SOURCE_REQUIRED');});
 it('fresh snapshot passes explicit session policy',()=>{const f=fixture();expect(marketFreshness(f.market,f.cap,f.policy,f.request,hash).status).toBe('PASS');});
 it('Oct19 initialization persists, Oct19 market remains replayable, Oct25 analysis blocks',async()=>{const h=harness();await h.lifecycle.qualifyCapability(h.cap);await h.lifecycle.initialize(h.init);await h.lifecycle.acceptMarket(h.market);const proof=marketFreshness(h.market,h.cap,h.policy,{...h.request,requestedAt:later,knownAt:later,now:later},hash);expect(proof.reasons).toContain('STALE_SESSION');expect((await h.lifecycle.replay(reference(h.init),'INITIALIZATION')).contentHash).toBe(h.init.contentHash);expect((await h.lifecycle.replay(reference(h.market),'MARKET')).contentHash).toBe(h.market.contentHash);});
 it('missing snapshot and capability block',()=>{const f=fixture();expect(marketFreshness(null,null,f.policy,f.request,hash).reasons).toEqual(expect.arrayContaining(['CURRENT_MARKET_SNAPSHOT_NOT_AVAILABLE','MARKET_CAPABILITY_REPLAY_NOT_QUALIFIED']));});
 it('retrieval timestamp never makes old session fresh',()=>{const f=fixture();const m=changeMarket(f.market,{acceptedTradingDate:'2026-10-18',observations:f.market.body.observations.map(o=>({...o,tradingDate:'2026-10-18'}))});expect(marketFreshness(m,f.cap,f.policy,f.request,hash).reasons).toContain('STALE_SESSION');});
 it('unknown calendar blocks; approved Sunday window uses preceding Friday',()=>{const f=fixture();expect(marketFreshness(f.market,f.cap,{...f.policy,windows:[]},f.request,hash).status).toBe('BLOCKED');const q={...f.request,requestedAt:later,knownAt:later,now:later};expect(marketFreshness(f.market,f.cap,f.policy,q,hash).reasons).toContain('STALE_SESSION');});
 it('past asOf cannot bypass live clock',()=>{const f=fixture();expect(()=>marketFreshness(f.market,f.cap,f.policy,{...f.request,now:later},hash)).toThrow('LIVE_TRUSTED_CLOCK');});
 for(const [name,patch] of [
  ['unknown currency',{currency:'USD'}],['unknown unit',{unit:'thousands'}],['unknown semantics',{field:'UNKNOWN'}],['adjustment ambiguity',{adjustment:'UNKNOWN'}],['unresolved conflict',{conflict:'SOURCE_CONFLICT'}],['future observation',{observedAt:later}],
 ] as const)it(name+' blocks',()=>{const f=fixture();expect(()=>changeMarket(f.market,{observations:f.market.body.observations.map(o=>({...o,...patch})) as never})).toThrow();});
 it('duplicate observation blocks',()=>{const f=fixture();expect(()=>changeMarket(f.market,{observations:[...f.market.body.observations,...f.market.body.observations]})).toThrow('DUPLICATE_CONFLICT');});
 for(const part of ['fundamentals','universe','exceptions'] as const)it('future '+part+' cannot leak backward',()=>{const f=fixture();const body=part==='exceptions'?{...f.init.body,exceptions:f.init.body.exceptions.map(e=>({...e,knownAt:later}))}:{...f.init.body,[part]:{...f.init.body[part],knownAt:later}};expect(()=>seal('INITIALIZATION','future',at,before,body,hash)).toThrow('PIT_EVIDENCE_UNAVAILABLE');});
 it('later corporate actions cannot reinterpret earlier observations',()=>{const f=fixture();expect(()=>changeMarket(f.market,{observations:f.market.body.observations.map(o=>({...o,corporateActions:{...o.corporateActions,knownAt:later}}))})).toThrow('PIT_EVIDENCE_UNAVAILABLE');});
 it('legacy ranking still requires full coverage; vNext rejects MBB placeholder',()=>{const {init}=fixture();const input={id:'rank',asOf:at,calculatedAt:at,cards:[],universe:{referenceVersion:init.body.universe.id,securityIds:init.body.members.map(m=>m.securityId),complete:true},portfolio:null,requiredReturnAssessments:[]};expect(rankScorecards(input).status).toBe('BLOCKED');expect(()=>rankPolicyB(input,init,hash)).toThrow('RANK_EXACT_ELIGIBLE_COVERAGE');});
 it('changed universe cannot use cached proof',()=>{const f=fixture();expect(marketFreshness(f.market,f.cap,f.policy,{...f.request,universe:proof('new-universe')},hash).reasons).toContain('UNIVERSE_CHANGED');});
 it('wrong identity blocks acceptance at consumption',async()=>{const h=harness();await h.lifecycle.qualifyCapability(h.cap);await h.lifecycle.initialize(h.init);const wrong=changeMarket(h.market,{observations:h.market.body.observations.map(o=>({...o,ticker:'REUSED'}))});h.records.set(wrong.id,wrong);const a=analysis(h,wrong);await expect(h.lifecycle.analyze(a,h.request)).rejects.toThrow('SECURITY_IDENTITY_MISMATCH');});
 it('missing accepted analysis prevents publication',async()=>{const h=harness();await expect(h.lifecycle.publish(decision(h),h.request)).rejects.toThrow('MISSING');});
 it('publishes only after analysis, portfolio and successful seal; persistence failure exposes nothing',async()=>{
  const h=harness();await setup(h);const d=decision(h);h.failPersistence();await expect(h.lifecycle.publish(d,h.request)).rejects.toThrow('PERSISTENCE_FAILURE');expect(h.records.has(d.id)).toBe(false);
  const good=harness();await setup(good);expect((await good.lifecycle.publish(decision(good),good.request)).kind).toBe('DECISION');
 });
 it('missing/stale portfolio and changed dependency fail publication',async()=>{const h=harness();await setup(h);h.authority.portfolioCurrent=async()=>{throw Error('STALE_PORTFOLIO');};await expect(h.lifecycle.publish(decision(h),h.request)).rejects.toThrow('STALE_PORTFOLIO');h.authority.portfolioCurrent=async()=>{};h.authority.currentDependencies=async()=>({id:'head',hash:hash('changed')});await expect(h.lifecycle.publish(decision(h),h.request)).rejects.toThrow('DEPENDENCIES_CHANGED');});
 it('TCX exception omission cannot be admitted',async()=>{const h=harness();await h.lifecycle.qualifyCapability(h.cap);await h.lifecycle.initialize(h.init);await h.lifecycle.acceptMarket(h.market);const a=analysis(h);const bad=seal('ANALYSIS',a.id,at,at,{...a.body,exceptions:[]},hash);await expect(h.lifecycle.analyze(bad,h.request)).rejects.toThrow('TCX_EXCEPTION_PROPAGATION');});
 it('unapproved source/schema cannot certify real capability',async()=>{const h=harness();const a=new RetainedMarketAuthority('/private/tmp',{approvals:[],policies:[],adapters:[],marketCurrent:async()=>{},initializationCurrent:async()=>{},portfolioCurrent:async()=>{},prerequisite:async()=>{},currentDependencies:async()=>h.dependency});await expect(a.replayCapability(h.cap)).rejects.toThrow('INDEPENDENT_APPROVAL_REQUIRED');});
 it('Policy-B synthetic ranking retains30 identities, ranks eligible29, excludes MBB with null score and unchanged arithmetic',()=>{
  const f=fixture(),r=rankingFixture(),historical=JSON.parse(JSON.stringify(f.init.body).replaceAll(before,'2020-01-01T00:00:00.000Z'));
  historical.members=historical.members.map((m: {securityId:string},i:number)=>({...m,securityId:IDS[i]}));historical.exceptions=historical.exceptions.map((e:object)=>({...e,securityId:IDS[1]}));historical.universe.id='reference-v1';
  const i=seal('INITIALIZATION','test-historical-init',ASOF,'2020-01-01T00:00:00.000Z',historical,hash);
  const input={...r,cards:r.cards.filter(c=>c.securityId!==IDS[0])};const output=rankPolicyB(input,i,hash);
  expect(output).toMatchObject({FULL_UNIVERSE_COUNT:30,ELIGIBLE_COUNT:29,DEFERRED_COUNT:1,weightRedistribution:false,capitalRedistribution:false});
  expect(output.members).toHaveLength(30);expect(output.excludedDeferred[0]).toMatchObject({ticker:'MBB',securityId:IDS[0],score:null});
  expect(output.ranking.entries.some(e=>e.securityId===IDS[0])).toBe(false);expect(output.ranking.top10.some(e=>e.securityId===IDS[0])).toBe(false);
  expect(output.label).toContain('currently scorable');expect(output.ranking.entries.every(e=>r.cards.find(c=>c.securityId===e.securityId)?.totalScore===e.score)).toBe(true);
 });
 it('MBB price can support held NAV but never fundamental eligibility or new capital',async()=>{
  const h=harness();await h.lifecycle.qualifyCapability(h.cap);await h.lifecycle.initialize(h.init);
  const m=changeMarket(h.market,{purpose:'PORTFOLIO_NAV',observations:h.market.body.observations.map(o=>({...o,securityId:'MBB',ticker:'MBB'}))});await h.lifecycle.acceptMarket(m);
  const request={...h.request,purpose:'PORTFOLIO_NAV' as const,securityIds:['MBB']};const a=analysis(h);
  const nav=seal('ANALYSIS','nav-test',at,at,{...a.body,purpose:'PORTFOLIO_NAV',market:reference(m),exceptions:[],freshness:marketFreshness(m,h.cap,h.policy,request,hash)},hash);
  expect((await h.lifecycle.analyze(nav,request)).kind).toBe('ANALYSIS');
  const capital=seal('ANALYSIS','capital-test',at,at,{...a.body,exceptions:[]},hash);
  await expect(h.lifecycle.analyze(capital,{...h.request,securityIds:['MBB']})).rejects.toThrow('MBB_QUARANTINE');
 });

 it('missing portfolio, changed disposition and expired freshness prevent candidate publication',async()=>{
  const h=harness();await setup(h);h.records.delete('portfolio');await expect(h.lifecycle.publish(decision(h),h.request)).rejects.toThrow('MISSING');
  const changed=harness();await setup(changed);changed.authority.initializationCurrent=async()=>{throw Error('DISPOSITION_CHANGED');};await expect(changed.lifecycle.publish(decision(changed),changed.request)).rejects.toThrow('DISPOSITION_CHANGED');
  const expired=harness();await setup(expired);expired.clock.now=()=>later as ReturnType<typeof expired.clock.now>;
  await expect(expired.lifecycle.publish(decision(expired),expired.request)).rejects.toThrow('MARKET_DATA_FRESHNESS_GATE');
 });
 it('missing policy/model or engine identity cannot become a decision snapshot',()=>{
  const h=harness(),d=decision(h);
  expect(()=>seal('DECISION',d.id,at,at,{...d.body,engineVersion:''},hash)).toThrow('DECISION_METADATA');
  expect(()=>seal('DECISION',d.id,at,at,{...d.body,scoringModel:{...d.body.scoringModel,id:''}},hash)).toThrow('INVALID_PIN');
  expect(()=>seal('DECISION',d.id,at,at,{...d.body,policy:{...d.body.policy,id:''}},hash)).toThrow('INVALID_PIN');
 });
 it('newly retrieved future source availability cannot be inserted into an earlier snapshot',()=>{
  const f=fixture();expect(()=>changeMarket(f.market,{sources:f.market.body.sources.map(s=>({...s,retrievedAt:later}))})).toThrow('RAW_SOURCE_REQUIRED');
 });

 it('newer invalid/conflicting source revision cannot be bypassed by an older cached snapshot',async()=>{const h=harness();await setup(h);h.authority.marketCurrent=async()=>{throw Error('LATEST_SOURCE_REVISION_CONFLICT');};await expect(h.lifecycle.publish(decision(h),h.request)).rejects.toThrow('LATEST_SOURCE_REVISION_CONFLICT');});

});
