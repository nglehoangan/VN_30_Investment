import { snapshotHash as hash } from '@/infrastructure/fundamentals/snapshot-hash';
import { seal, readSealed, reference } from '@/domain/market-boundary/validation';
import { marketFreshness } from '@/domain/market-boundary/freshness';
import type { Evidence, Bodies, Sealed, Consumption, SessionPolicy } from '@/domain/market-boundary/contracts';
import { BoundaryLifecycle } from '@/application/market-boundary/lifecycle';
import type { BoundaryAuthority, BoundaryStore } from '@/ports/market-boundary';
export const at='2026-10-19T08:00:00.000Z',before='2026-10-19T07:00:00.000Z',later='2026-10-25T08:00:00.000Z';
export const proof=(id:string):Evidence=>({id,hash:hash(id),knownAt:before,effectiveAt:before});
export function fixture() {
 const calendar=proof('calendar');
 const policyBody={knownAt:before,effectiveAt:before,timezone:'Asia/Ho_Chi_Minh' as const,calendar,purposes:['NEW_CAPITAL','SCORING','PORTFOLIO_NAV'] as const,field:'CLOSE' as const,adjustment:'RAW' as const,windows:[
  {from:at,through:'2026-10-19T23:00:00.000Z',tradingDate:'2026-10-19',session:'CLOSE',observationCutoff:at},
  // Test-only calendar: Sunday explicitly uses the preceding Friday, no calendar-day freshness shortcut.
  {from:later,through:'2026-10-25T23:00:00.000Z',tradingDate:'2026-10-23',session:'CLOSE',observationCutoff:'2026-10-23T08:00:00.000Z'},
 ]};
 const policy:SessionPolicy={id:'session-policy',hash:hash(policyBody),...policyBody};
 const policyPin={id:policy.id,hash:policy.hash,knownAt:before,effectiveAt:before};
 const source={...proof('raw'),sourceId:'test-source',request:proof('request'),rawPath:'raw.json',retrievedAt:before,providerAt:before,schemaVersion:'test-v1',origin:'REAL_SOURCE' as const};
 const cap=seal('CAPABILITY','cap',at,before,{sourceContract:proof('source'),sourceId:'test-source',sourceSchema:'test-v1',normalizerVersion:'n-v1',identityVersion:'identity-v1',semanticsVersion:'sem-v1',corporateActionPolicy:proof('actions'),freshnessPolicy:policyPin,calendar,rawSamples:[source],normalizedSampleHash:hash([]),negativeValidation:proof('negative'),missingBehavior:'BLOCK',duplicateBehavior:'BLOCK_CONFLICT'},hash);
 const members=Array.from({length:30},(_,n)=>({securityId:n===0?'MBB':n===1?'TCX':`SEC${n}`,ticker:n===0?'MBB':n===1?'TCX':`T${n}`,exchange:'HOSE',state:n===0?'DEFERRED' as const:'SCORABLE' as const}));
 const exception={...proof('tcx-exception'),securityId:'TCX',status:'ACTIVE' as const,classification:'OWNER_ANALYTICAL_EXCEPTION' as const,amountVnd:'5284485167173'};
 const init=seal('INITIALIZATION','init',at,before,{universe:proof('full30'),members,securityMaster:proof('security'),sectorMaster:proof('sector'),fundamentals:proof('fundamentals'),qualifications:proof('qualifications'),dispositions:proof('dispositions'),partition:proof('partition'),exceptions:[exception],provenanceContract:proof('provenance'),capability:reference(cap),dataClassPolicy:proof('data-class'),softwareVersion:'test',schemaVersion:'1'},hash);
 const obs={securityId:'TCX',ticker:'TCX',exchange:'HOSE',value:'10000',currency:'VND' as const,unit:'VND_PER_SHARE' as const,field:'CLOSE' as const,adjustment:'RAW' as const,corporateActions:proof('actions'),tradingDate:'2026-10-19',session:'CLOSE',observedAt:before,availableAt:before,source:{id:source.id,hash:source.hash},pointer:'/close',conflict:'MATCH' as const};
 const market=seal('MARKET','market',at,before,{capability:reference(cap),universe:init.body.universe,requestedAsOf:at,purpose:'NEW_CAPITAL',acceptedTradingDate:'2026-10-19',session:'CLOSE',observations:[obs],sources:[source],normalizationVersion:'n-v1',freshnessPolicy:policyPin,calendar},hash);
 const request:Consumption={mode:'LIVE',requestedAt:at,knownAt:at,now:at,purpose:'NEW_CAPITAL',securityIds:['TCX'],universe:init.body.universe};
 return {policy,cap,init,market,request,exception};
}
export const changeMarket=(m:Sealed<'MARKET'>,body:Partial<Bodies['MARKET']>)=>seal('MARKET',m.id,m.createdAt,m.knownAt,{...m.body,...body},hash);
/** Synthetic fixtures exercise enforcement; they certify no production source or calendar. */
export function harness() {
 const f=fixture(),records=new Map<string,Sealed>(),clock={now:()=>at as ReturnType<import('@/ports/runtime').Clock['now']>};
 const dependency={id:'head',hash:hash('dependencies')};let failSeal=false;
 const store:BoundaryStore={sealRanking:async()=>{},append:async r=>{records.set(r.id,r);},find:async(p,k)=>{const r=records.get(p.id);if(!r||r.kind!==k||r.contentHash!==p.hash)throw Error('MISSING');return readSealed(r,k,hash);},sealDecision:async r=>{if(failSeal)throw Error('PERSISTENCE_FAILURE');records.set(r.id,r);}};
 const authority:BoundaryAuthority={hash,approve:async()=>{},replayCapability:async()=>{},replayMarket:async()=>{},resolvePolicy:async()=>f.policy,marketCurrent:async()=>{},initializationCurrent:async()=>{},portfolioCurrent:async()=>{},prerequisite:async()=>{},currentDependencies:async()=>dependency};
 const lifecycle=new BoundaryLifecycle(store,authority,clock);
 return {...f,records,store,authority,dependency,lifecycle,clock,failPersistence:()=>{failSeal=true;}};
}
export function analysis(h:ReturnType<typeof harness>, m=h.market) {
 const b:Bodies['ANALYSIS']={initialization:reference(h.init),fundamentals:h.init.body.fundamentals,universe:h.init.body.universe,market:reference(m),marketRequirement:'REQUIRED',purpose:'NEW_CAPITAL',analysisTimestamp:at,members:h.init.body.members,exceptions:[h.exception],inputArtifacts:[],sourceHashes:[{id:m.body.sources[0].id,hash:m.body.sources[0].hash}],freshness:marketFreshness(m,h.cap,h.policy,h.request,hash),policy:proof('investment-policy'),scoringModel:proof('scoring-model'),engineVersion:'test',prerequisiteProof:proof('analysis-prerequisites')};
 return seal('ANALYSIS','analysis',at,at,b,hash);
}
export function portfolio() {return seal('PORTFOLIO','portfolio',at,at,{portfolioSnapshotId:'legacy-portfolio-id',portfolioAsOf:at,ledgerWatermark:'ledger1',cash:'100',positionsHash:hash([]),costBasisHash:hash([]),pendingTransactionsHash:hash([]),navInputs:[],accountingVersion:'unchanged'},hash);}
export function decision(h:ReturnType<typeof harness>) {
 const a=analysis(h);return seal('DECISION','decision-envelope',at,at,{decisionId:'candidate',decisionTimestamp:at,securityId:'TCX',universe:h.init.body.universe,initialization:reference(h.init),fundamentals:h.init.body.fundamentals,market:reference(h.market),analysis:reference(a),portfolio:reference(portfolio()),policy:a.body.policy,scoringModel:a.body.scoringModel,engineVersion:'test',sourceHashes:a.body.sourceHashes,freshness:a.body.freshness,disposition:h.init.body.dispositions,exceptions:[h.exception],decisionState:'SYNTHETIC_TEST_ONLY',eligibilityProof:proof('decision-prerequisites'),executionEligibility:'PASS',dependenciesHash:h.dependency.hash},hash);
}
export async function setup(h:ReturnType<typeof harness>){await h.lifecycle.qualifyCapability(h.cap);await h.lifecycle.initialize(h.init);await h.lifecycle.acceptMarket(h.market);await h.lifecycle.analyze(analysis(h),h.request);await h.lifecycle.bindPortfolio(portfolio());}
