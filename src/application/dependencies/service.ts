import type {AcceptedDependencyCatalog,DependencyRegistry} from '@/ports/dependencies';
import type {Clock} from '@/ports/runtime';
import {PROJECTION_ID,changeEffect,type Resolution,type Publication} from '@/domain/dependencies/contracts';
import {head,ref,makeRelease,readRelease,readPublication,boundary} from '@/domain/dependencies/validation';
import type {Digest,Pin,Purpose,Sealed,Consumption,SessionPolicy} from '@/domain/market-boundary/contracts';
import {requireBoundary as check,same,reference} from '@/domain/market-boundary/validation';
import {marketFreshness} from '@/domain/market-boundary/freshness';
import {instant} from '@/shared/time';
/** Constructed only by trusted server composition. No head/approval/mode parameters on production resolution. */
export class ProductionDependencies {
 constructor(private readonly registry:DependencyRegistry,private readonly catalog:AcceptedDependencyCatalog,private readonly clock:Clock,private readonly hash:Digest){}
 async activate(expected:Pin|null,reason:string){const at=this.clock.now(),heads=await this.catalog.readAccepted();await this.catalog.assertCurrent(heads,at);const release=makeRelease(heads,expected,at,reason,this.hash);await this.registry.activate(release,expected);return release;}
 private async current(at:string){const r=await this.registry.current();check(r,'MISSING_HEAD');readRelease(r,this.hash);check(r.recordedAt<=at&&r.effectiveFrom<=at,'FUTURE_HEAD');await this.catalog.assertCurrent(r.heads,at);return r;}
 private request(r:Resolution):Consumption {const now=this.clock.now(),i=boundary(r.heads,'INITIALIZATION','INITIALIZATION',this.hash);return {mode:'LIVE',now,requestedAt:now,knownAt:now,purpose:r.purpose,securityIds:i.body.members.filter(m=>r.purpose==='PORTFOLIO_NAV'||r.purpose==='FUNDAMENTAL_DESCRIPTION'||m.state==='SCORABLE').map(m=>m.securityId),universe:i.body.universe};}
 private fresh(r:Resolution){if(r.purpose==='FUNDAMENTAL_DESCRIPTION')return;const policy=head(r.heads,'SESSION_POLICY').content as SessionPolicy;const market=r.heads.some(h=>h.type==='MARKET')?boundary(r.heads,'MARKET','MARKET',this.hash):null;const proof=marketFreshness(market,boundary(r.heads,'MARKET_CAPABILITY','CAPABILITY',this.hash),policy,this.request(r),this.hash);check(proof.status==='PASS','REFRESH_REQUIRED:'+proof.reasons.join(','));}
 async resolveProductionAnalysisDependencies(input:{purpose:Purpose;requestedAsOf:string}):Promise<Resolution>{
  check(Object.keys(input).every(k=>['purpose','requestedAsOf'].includes(k)),'CALLER_SELECTED_STALE_HEAD');instant(input.requestedAsOf);check(input.requestedAsOf<=this.clock.now(),'FUTURE_REQUEST');
  const r=await this.current(this.clock.now());check(r.effectiveFrom<=input.requestedAsOf&&r.heads.every(h=>h.effectiveFrom<=input.requestedAsOf),'HEAD_NOT_EFFECTIVE_ASOF');
  const out:Resolution={mode:'PRODUCTION',release:ref(r),heads:r.heads,purpose:input.purpose,requestedAsOf:input.requestedAsOf};this.fresh(out);return out;
 }
 private async revalidate(r:Resolution){check(r.mode==='PRODUCTION','REPLAY_MODE_PRODUCTION_ESCAPE');const active=await this.current(this.clock.now());check(same(ref(active),r.release)&&same(active.heads,r.heads),'DEPENDENCY_CHANGED_DURING_ANALYSIS');this.fresh(r);}
 private analysisBindings(a:Sealed<'ANALYSIS'>,r:Resolution){
  const i=boundary(r.heads,'INITIALIZATION','INITIALIZATION',this.hash),b=a.body;
  check(same(b.initialization,reference(i))&&same(b.fundamentals,i.body.fundamentals)&&same(b.universe,i.body.universe)&&same(b.members,i.body.members),'CALLER_SELECTED_STALE_HEAD');
  for(const [type,p] of [['POLICY',b.policy],['SCORING_MODEL',b.scoringModel]] as const)check(same(head(r.heads,type).pin,{id:p.id,hash:p.hash}),'CALLER_SELECTED_STALE_HEAD:'+type);
  check(b.engineVersion===(head(r.heads,'SCORING_MODEL').content as {implementationIdentity:string}).implementationIdentity&&b.purpose===r.purpose,'INCOMPATIBLE_DEPENDENCY_SET');
  check(same(b.exceptions,i.body.exceptions),'TCX_EXCEPTION_CHANGED');
  if(b.purpose!=='FUNDAMENTAL_DESCRIPTION')check(b.market!==null&&same(b.market,head(r.heads,'MARKET').pin),'CALLER_SELECTED_STALE_HEAD:MARKET');
 }
 private envelope(kind:'ANALYSIS'|'DECISION',snapshot:Sealed<'ANALYSIS'>|Sealed<'DECISION'>,analysisRelease:Pin,decisionRelease:Pin|null):Publication {
  const b={contract:'production-dependency-publication-v1' as const,id:'production-'+snapshot.id,kind,createdAt:this.clock.now(),snapshot,analysisRelease,decisionRelease};return {...b,contentHash:this.hash(b)};
 }
 async sealAnalysis(candidate:Sealed<'ANALYSIS'>,resolution:Resolution){
  await this.revalidate(resolution);this.analysisBindings(candidate,resolution);
  const accepted=await this.catalog.validateAnalysis(candidate,resolution,{...this.request(resolution),requestedAt:candidate.body.analysisTimestamp,knownAt:candidate.knownAt});this.analysisBindings(accepted,resolution);
  await this.revalidate(resolution);const p=this.envelope('ANALYSIS',accepted,resolution.release,null);await this.registry.publish(p,resolution.release,()=>this.clock.now());return p;
 }
 async resolveProductionDecisionDependencies(acceptedAnalysis:Pin,purpose:Purpose):Promise<{analysis:Publication;resolution:Resolution}>{
  const a=readPublication(await this.registry.publication(acceptedAnalysis),this.hash);check(a.kind==='ANALYSIS','ACCEPTED_ANALYSIS_REQUIRED');
  const r=await this.resolveProductionAnalysisDependencies({purpose,requestedAsOf:this.clock.now()});
  // Conservative approved default: any changed release requires rebuild. No silent NO_MATERIAL_EFFECT rule.
  if(!same(a.analysisRelease,r.release)){const previous=await this.registry.find(a.analysisRelease),changed=r.heads.filter(h=>!previous.heads.some(old=>same(old,h))).map(h=>h.type);const classification=changed.some(t=>changeEffect(t)==='REANALYSIS_REQUIRED')?'REANALYSIS_REQUIRED':'REVALIDATION_REQUIRED';check(false,classification+':'+(changed.join(',')||'RELEASE_ACTIVATION'));}head(r.heads,'PORTFOLIO');head(r.heads,'RISK_STATE');return {analysis:a,resolution:r};
 }
 async sealDecision(candidate:Sealed<'DECISION'>,analysisPin:Pin,resolution:Resolution){
  check(resolution.mode==='PRODUCTION','REPLAY_MODE_PRODUCTION_ESCAPE');check(['NEW_CAPITAL','DCA','EXECUTION'].includes(resolution.purpose),'DECISION_PURPOSE_NOT_QUALIFIED');const {analysis,resolution:current}=await this.resolveProductionDecisionDependencies(analysisPin,resolution.purpose);
  check(same(current.release,resolution.release),'DEPENDENCY_CHANGED_DURING_DECISION');const b=candidate.body;
  check(same(b.analysis,reference(analysis.snapshot))&&same(b.initialization,head(current.heads,'INITIALIZATION').pin)&&same(b.portfolio,head(current.heads,'PORTFOLIO').pin),'STALE_DECISION_DEPENDENCY');
  check(b.dependenciesHash===current.release.hash&&same(b.exceptions,(analysis.snapshot as Sealed<'ANALYSIS'>).body.exceptions),'TCX_EXCEPTION_OR_DEPENDENCY_CHANGED');
  const init=boundary(current.heads,'INITIALIZATION','INITIALIZATION',this.hash);check(init.body.members.some(m=>m.securityId===b.securityId&&m.state==='SCORABLE'),'MBB_ELIGIBILITY_BYPASS');
  const ab=(analysis.snapshot as Sealed<'ANALYSIS'>).body;check(same(b.policy,ab.policy)&&same(b.scoringModel,ab.scoringModel)&&same(b.universe,ab.universe)&&same(b.fundamentals,ab.fundamentals)&&same(b.disposition,init.body.dispositions)&&same(b.market,head(current.heads,'MARKET').pin)&&b.engineVersion===head(current.heads,'DECISION_ENGINE').contract,'STALE_DECISION_DEPENDENCY');
  const accepted=await this.catalog.validateDecision(candidate,current,{...this.request(current),requestedAt:candidate.body.decisionTimestamp,knownAt:candidate.knownAt,securityIds:[candidate.body.securityId]});await this.revalidate(current);
  const p=this.envelope('DECISION',accepted,analysis.analysisRelease,current.release);await this.registry.publish(p,current.release,()=>this.clock.now());return p;
 }
 /** Trusted internal audit path only. Never returns a production Resolution/token. */
 async replayHistorical(pin:Pin,knownAt:string){instant(knownAt);const r=readRelease(await this.registry.find(pin),this.hash);check(r.recordedAt<=knownAt&&r.heads.every(h=>h.recordedAt<=knownAt),'PIT_HEAD_UNAVAILABLE');return {mode:'HISTORICAL_REPLAY' as const,release:r,publicationAuthority:false as const};}
 async cacheState(release:Pin){const active=await this.current(this.clock.now());return same(ref(active),release)?'CURRENT_DEPENDENCIES':'STALE_DEPENDENCY';}
 async currentProjection(){const r=await this.current(this.clock.now());return {id:PROJECTION_ID,hash:r.contentHash};}
}
