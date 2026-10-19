import type { Bodies, Consumption, Kind, Pin, Sealed } from '@/domain/market-boundary/contracts';
import { marketFreshness } from '@/domain/market-boundary/freshness';
import { evidence, partition, readSealed, requireBoundary, seal, same } from '@/domain/market-boundary/validation';
import type { BoundaryAuthority, BoundaryStore } from '@/ports/market-boundary';
import type { Clock } from '@/ports/runtime';
/** Prospective acceptance/publication service. Dependency authority is server-configured, not supplied by callers. */
export class BoundaryLifecycle {
  constructor(private readonly store: BoundaryStore, private readonly authority: BoundaryAuthority, private readonly clock: Clock) {}
  private read<K extends Kind>(raw: Sealed<K>, kind: K) { return readSealed(raw,kind,this.authority.hash); }
  async qualifyCapability(raw: Sealed<'CAPABILITY'>) {
    const c=this.read(raw,'CAPABILITY');
    for(const e of [c.body.sourceContract,c.body.corporateActionPolicy,c.body.freshnessPolicy,c.body.calendar,c.body.negativeValidation])await this.authority.approve(e,c.knownAt);
    await this.authority.replayCapability(c); await this.store.append(c); return c;
  }
  async initialize(raw: Sealed<'INITIALIZATION'>) {
    const i=this.read(raw,'INITIALIZATION');partition(i.body);requireBoundary(i.createdAt<=this.clock.now(),'FUTURE_INITIALIZATION');
    const c=await this.store.find(i.body.capability,'CAPABILITY');
    requireBoundary(c.knownAt<=i.knownAt,'PIT_CAPABILITY');await this.authority.replayCapability(c);
    for(const e of [i.body.universe,i.body.securityMaster,i.body.sectorMaster,i.body.fundamentals,i.body.qualifications,i.body.dispositions,i.body.partition,i.body.provenanceContract,i.body.dataClassPolicy,...i.body.exceptions])await this.authority.approve(e,i.knownAt);
    // No current market snapshot/price/clock-based market-age check belongs here.
    await this.store.append(i); return i;
  }
  async acceptMarket(raw: Sealed<'MARKET'>) {
    const m=this.read(raw,'MARKET'),c=await this.store.find(m.body.capability,'CAPABILITY');
    requireBoundary(c.knownAt<=m.knownAt,'PIT_CAPABILITY');await this.authority.replayCapability(c);await this.authority.replayMarket(m);
    await this.store.append(m);return m;
  }
  private consumption(request: Consumption): Consumption {
    const now=this.clock.now();
    requireBoundary(request.requestedAt<=now&&request.knownAt<=now,'FUTURE_CONSUMPTION_REQUEST');
    return request.mode==='LIVE'?{...request,now,requestedAt:now,knownAt:now}:{...request,now};
  }
  private async gate(i: Sealed<'INITIALIZATION'>, market: Pin | null, request: Consumption) {
    request=this.consumption(request);
    await this.authority.initializationCurrent(i,request);
    const c=await this.store.find(i.body.capability,'CAPABILITY');await this.authority.replayCapability(c);
    const policy=await this.authority.resolvePolicy(c.body.freshnessPolicy,request.knownAt);
    const m=market?await this.store.find(market,'MARKET'):null;
    if(m){await this.authority.replayMarket(m);if(request.mode==='LIVE')await this.authority.marketCurrent(m,request);
      for(const o of m.body.observations)requireBoundary(i.body.members.some(x=>x.securityId===o.securityId&&x.ticker===o.ticker&&x.exchange===o.exchange),'SECURITY_IDENTITY_MISMATCH');
    }
    const proof=marketFreshness(m,c,policy,request,this.authority.hash);
    requireBoundary(proof.status==='PASS','MARKET_DATA_FRESHNESS_GATE:'+proof.reasons.join(','));return proof;
  }
  async analyze(raw: Sealed<'ANALYSIS'>, request: Consumption) {
    const a=this.read(raw,'ANALYSIS'),b=a.body,i=await this.store.find(b.initialization,'INITIALIZATION');
    requireBoundary(request.purpose===b.purpose&&request.requestedAt===b.analysisTimestamp&&a.knownAt===request.knownAt,'ANALYSIS_REQUEST_BINDING');
    requireBoundary(i.knownAt<=request.knownAt&&i.createdAt<=a.createdAt&&b.universe.effectiveAt<=request.requestedAt,'PIT_INITIALIZATION');
    this.analysisBindings(b,i,request.securityIds);
    request=this.consumption(request);
    await this.authority.initializationCurrent(i,request);await this.authority.prerequisite(b.prerequisiteProof,request);
    await this.authority.approve(b.policy,request.knownAt);await this.authority.approve(b.scoringModel,request.knownAt);
    let accepted=a;
    if(b.marketRequirement==='REQUIRED'){
      const m=await this.store.find(b.market!,'MARKET');
      requireBoundary(same(b.sourceHashes,m.body.sources.map(s=>({id:s.id,hash:s.hash}))),'ANALYSIS_RAW_SOURCE_BINDING');
      const freshness=await this.gate(i,b.market,request);
      accepted=seal('ANALYSIS',a.id,freshness.at,request.knownAt,{...b,freshness,analysisTimestamp:request.requestedAt},this.authority.hash);
    }
    else requireBoundary(request.purpose==='FUNDAMENTAL_DESCRIPTION'&&b.market===null,'NO_GENERIC_MARKET_BYPASS');
    await this.store.append(accepted);return accepted;
  }
  private analysisBindings(b: Bodies['ANALYSIS'], i: Sealed<'INITIALIZATION'>, ids: readonly string[]) {
    requireBoundary(same(b.universe,i.body.universe)&&same(b.fundamentals,i.body.fundamentals)&&same(b.members,i.body.members),'ANALYSIS_INITIALIZATION_BINDING');
    requireBoundary(ids.every(id=>i.body.members.some(m=>m.securityId===id)),'COVERAGE_OUTSIDE_UNIVERSE');
    if(b.purpose!=='PORTFOLIO_NAV'&&b.purpose!=='FUNDAMENTAL_DESCRIPTION')requireBoundary(ids.every(id=>i.body.members.find(m=>m.securityId===id)?.state==='SCORABLE'),'MBB_QUARANTINE');
    const exceptions=i.body.exceptions.filter(e=>ids.includes(e.securityId));requireBoundary(same(b.exceptions,exceptions),'TCX_EXCEPTION_PROPAGATION');
  }
  async bindPortfolio(raw: Sealed<'PORTFOLIO'>) { const p=this.read(raw,'PORTFOLIO');await this.authority.portfolioCurrent(p,this.clock.now());await this.store.append(p);return p; }
  /** Candidate is never an actionable return value; only the committed immutable envelope is returned. */
  async publish(raw: Sealed<'DECISION'>, request: Consumption) {
    const d=this.read(raw,'DECISION'),b=d.body;
    requireBoundary(request.mode==='LIVE'&&request.requestedAt===b.decisionTimestamp&&d.knownAt===request.knownAt,'LIVE_DECISION_TIME');
    request=this.consumption(request);
    requireBoundary(['NEW_CAPITAL','DCA','EXECUTION'].includes(request.purpose)&&request.securityIds.length===1&&request.securityIds[0]===b.securityId,'DECISION_PURPOSE_SCOPE');
    const expected=await this.authority.currentDependencies();requireBoundary(expected.hash===b.dependenciesHash,'DEPENDENCIES_CHANGED');
    const a=await this.store.find(b.analysis,'ANALYSIS'),i=await this.store.find(b.initialization,'INITIALIZATION'),p=await this.store.find(b.portfolio,'PORTFOLIO');
    requireBoundary(a.body.marketRequirement==='REQUIRED'&&a.body.purpose===request.purpose&&a.body.analysisTimestamp<=b.decisionTimestamp&&a.knownAt<=d.knownAt,'ACCEPTED_ANALYSIS_REQUIRED');
    this.analysisBindings(a.body,i,request.securityIds);
    requireBoundary(same(a.body.initialization,b.initialization)&&same(a.body.market,b.market)&&same(a.body.universe,b.universe)&&same(a.body.fundamentals,b.fundamentals)&&same(a.body.policy,b.policy)&&same(a.body.scoringModel,b.scoringModel)&&same(a.body.sourceHashes,b.sourceHashes)&&same(a.body.exceptions,b.exceptions)&&same(b.disposition,i.body.dispositions),'DECISION_EVIDENCE_BINDING');
    await this.authority.prerequisite(b.eligibilityProof,request);await this.authority.prerequisite(a.body.prerequisiteProof,request);
    await this.authority.portfolioCurrent(p,request.now);
    for(const e of [b.policy,b.scoringModel,b.disposition,...b.exceptions]){evidence(e,request.knownAt);await this.authority.approve(e,request.knownAt);}
    const freshness=await this.gate(i,b.market,request);
    requireBoundary(b.executionEligibility==='PASS','CAPITAL_ELIGIBILITY_BLOCKED');
    requireBoundary((await this.authority.currentDependencies()).hash===expected.hash&&freshness.eligibleUntil!==null&&this.clock.now()<=freshness.eligibleUntil,'DEPENDENCIES_CHANGED_BEFORE_SEAL');
    const accepted=seal('DECISION',d.id,freshness.at,request.knownAt,{...b,freshness,decisionTimestamp:freshness.at},this.authority.hash);
    await this.store.sealDecision(accepted,expected);return accepted;
  }
  async validateAnalysisForConsumption(pin: Pin, request: Consumption) {
    request=this.consumption(request);
    const a=await this.store.find(pin,'ANALYSIS'),i=await this.store.find(a.body.initialization,'INITIALIZATION');
    requireBoundary(a.knownAt<=request.knownAt&&a.body.purpose===request.purpose&&a.body.marketRequirement==='REQUIRED','ANALYSIS_CONSUMPTION_CONTEXT');
    this.analysisBindings(a.body,i,request.securityIds);
    await this.authority.initializationCurrent(i,request);await this.authority.prerequisite(a.body.prerequisiteProof,request);
    for(const e of [a.body.policy,a.body.scoringModel,...a.body.exceptions])await this.authority.approve(e,request.knownAt);
    const freshness=await this.gate(i,a.body.market,request);return {analysis:a,initialization:i,freshness};
  }
  async replay<K extends Kind>(pin: Pin, kind: K) { return this.store.find(pin,kind); }
}
