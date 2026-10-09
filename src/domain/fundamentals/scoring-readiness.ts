import {ValidationError} from '@/shared/errors';
import type {ScoreInput} from '@/domain/scoring/scorecard';
import {validateEvidence} from '@/domain/scoring/evidence';
import {calculateScorecard} from '@/domain/scoring/scorecard';
import {SECTORS,RUBRICS,type Sector} from '@/domain/scoring/methodology';
import {referenceAt} from '@/domain/portfolio/reference';
import {instant,dateOnly,vietnamBusinessDate} from '@/shared/time';
import {deepFreeze} from '@/domain/portfolio/transaction';
import {snapshot} from '@/domain/scoring/validation';
import type {FundamentalSnapshot} from './snapshot';
import {requireFundamental,fundamentalId,fundamentalHash} from './validation';
import {bridgeScoringInputs,assertBridgeMatches,isMarketEvidence,exactReadinessFields,validateBridgePlan,type ScoringBridgePlan,type ScoringBridgeSources} from './scoring-bridge';
import type {MetricId} from '@/domain/scoring/metrics';
import {METRICS} from '@/domain/scoring/metrics';
export const REQUIRED_DI_GATES=Array.from({length:15},(_,i)=>'DI'+(i+1));
export interface ScoringReadinessRequirements {
 readonly version:string;readonly algorithm:'strict-canonical-m3-readiness-v1';readonly governanceStatus:'APPROVED';readonly approvalReference:string;readonly methodologyId:string;
 readonly recordedAt:string;readonly effectiveDate:string;readonly authorityReferences:readonly string[];
 readonly flowTechnical:'NOT_APPLICABLE_PERMANENT_M3';
 readonly sectors:readonly {readonly sector:Sector;readonly requiredItems:readonly string[];readonly requiredMetrics:readonly MetricId[];readonly requiredMarketObservations:readonly string[];readonly requiredValuationObservations:readonly string[]}[];
}
export interface DataInitializationAcceptance {
 readonly contract:'independent-di-acceptance-v1';readonly id:string;readonly snapshotRunId:string;readonly contentHash:string;readonly manifestDigest:string;
 readonly requirements:ScoringReadinessRequirements;readonly requirementsHash:string;readonly scoringMethodologyHash:string;
 readonly universeHash:string;readonly acceptedAt:string;readonly producerReference:string;readonly reviewerReference:string;
 readonly reviewArtifactReference:string;readonly approvalReference:string;readonly methodologyId:string;
 readonly gates:readonly {readonly gate:string;readonly status:'PASS';readonly evidenceReference:string}[];
 readonly issues:readonly {readonly id:string;readonly severity:'CRITICAL'|'MAJOR'|'MINOR';readonly resolutionReference:string|null}[];
 readonly tickers:readonly {readonly securityId:string;readonly input:ScoreInput|null;readonly bridge:ScoringBridgePlan|null}[];
}
export type ReadinessStatus='READY'|'BLOCKED'|'NOT_APPLICABLE';
export interface TickerScoringReadiness {
 readonly securityId:string;readonly universe:ReadinessStatus;readonly market:ReadinessStatus;
 readonly fundamentals:ReadinessStatus;readonly valuation:ReadinessStatus;readonly flowTechnical:ReadinessStatus;
 readonly confidence:ReadinessStatus;readonly assessmentsAndGates:ReadinessStatus;
 readonly dataReady:boolean;readonly readyForScoring:boolean;readonly blockers:readonly string[];
}
function ref(v:string){requireFundamental(typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=4000&&!/[\x00-\x1f<>]/.test(v),'READINESS_REFERENCE');}
export function scoringInputSemantic(input:ScoreInput){const {id,calculatedAt,...semantic}=input;void id;void calculatedAt;return semantic;}
export function validateReadinessRequirements(raw:ScoringReadinessRequirements){
 const p=snapshot(raw);exactReadinessFields(p,'version algorithm governanceStatus approvalReference methodologyId recordedAt effectiveDate authorityReferences flowTechnical sectors');
 [p.version,p.methodologyId].forEach(fundamentalId);ref(p.approvalReference);instant(p.recordedAt);dateOnly(p.effectiveDate);
 requireFundamental(p.algorithm==='strict-canonical-m3-readiness-v1'&&p.governanceStatus==='APPROVED'&&p.flowTechnical==='NOT_APPLICABLE_PERMANENT_M3'&&Array.isArray(p.authorityReferences)&&p.authorityReferences.length>0,'READINESS_REQUIREMENTS_GOVERNANCE');p.authorityReferences.forEach(ref);
 requireFundamental(Array.isArray(p.sectors)&&p.sectors.length>0&&new Set(p.sectors.map(s=>s.sector)).size===p.sectors.length,'READINESS_SECTOR_ROUTES');
 for(const r of p.sectors){exactReadinessFields(r,'sector requiredItems requiredMetrics requiredMarketObservations requiredValuationObservations');requireFundamental(SECTORS.includes(r.sector)&&Array.isArray(r.requiredItems)&&r.requiredItems.length>0&&new Set(r.requiredItems).size===r.requiredItems.length&&Array.isArray(r.requiredMetrics)&&new Set(r.requiredMetrics).size===r.requiredMetrics.length,'READINESS_SECTOR_REQUIREMENTS');r.requiredItems.forEach(fundamentalId);
  for(const required of [r.requiredMarketObservations,r.requiredValuationObservations]){requireFundamental(Array.isArray(required)&&required.length>0&&new Set(required).size===required.length,'EXPLICIT_REQUIRED_MARKET_VALUATION_INPUTS');required.forEach(fundamentalId);}
  requireFundamental(r.requiredMarketObservations.every((id:string)=>['price','market_cap','EV','shares'].includes(id)),'REQUIRED_MARKET_OBSERVATION_ALLOWLIST');requireFundamental(r.requiredMetrics.every((m:MetricId)=>Object.hasOwn(METRICS,m)),'READINESS_EXISTING_METRICS_ONLY');requireFundamental(r.sector!=='BANK'||!r.requiredMetrics.some((m:MetricId)=>['FCF','ROIC','NET_DEBT_EBITDA','CFO_CONVERSION','INTEREST_COVERAGE','INCREMENTAL_ROIC'].includes(m)),'READINESS_BANK_ROUTE_NOT_EQUIVALENT');}
 return deepFreeze(p);
}
export function validateDIAcceptance(raw:DataInitializationAcceptance){
 const a=snapshot(raw);exactReadinessFields(a,'contract id snapshotRunId contentHash manifestDigest requirements requirementsHash scoringMethodologyHash universeHash acceptedAt producerReference reviewerReference reviewArtifactReference approvalReference methodologyId gates issues tickers');
 requireFundamental(a.contract==='independent-di-acceptance-v1','SUPPORTED_DI_ACCEPTANCE_CONTRACT');
 [a.id,a.snapshotRunId,a.methodologyId].forEach(fundamentalId);[a.contentHash,a.manifestDigest,a.requirementsHash,a.scoringMethodologyHash,a.universeHash].forEach(fundamentalHash);instant(a.acceptedAt);
 [a.producerReference,a.reviewerReference,a.reviewArtifactReference,a.approvalReference].forEach(ref);requireFundamental(a.producerReference!==a.reviewerReference,'INDEPENDENT_DI_REVIEW_REQUIRED');validateReadinessRequirements(a.requirements);
 requireFundamental(Array.isArray(a.gates)&&a.gates.length===15&&new Set(a.gates.map(g=>g.gate)).size===15,'ALL_REQUIRED_DI_GATES');
 for(const g of a.gates){exactReadinessFields(g,'gate status evidenceReference');requireFundamental(REQUIRED_DI_GATES.includes(g.gate)&&g.status==='PASS','REQUIRED_DI_NOT_PASS');ref(g.evidenceReference);}
 requireFundamental(Array.isArray(a.issues)&&new Set(a.issues.map(i=>i.id)).size===a.issues.length,'DI_ISSUE_REGISTER');
 for(const i of a.issues){exactReadinessFields(i,'id severity resolutionReference');fundamentalId(i.id);requireFundamental(['CRITICAL','MAJOR','MINOR'].includes(i.severity),'DI_ISSUE_SEVERITY');if(i.resolutionReference!==null)ref(i.resolutionReference);requireFundamental(i.severity==='MINOR'||i.resolutionReference!==null,'UNRESOLVED_CRITICAL_MAJOR_DI_ISSUE');}
 requireFundamental(Array.isArray(a.tickers)&&a.tickers.length===30&&new Set(a.tickers.map(t=>t.securityId)).size===30,'ALL_VN30_TICKERS_ACCOUNTED');
 for(const t of a.tickers){exactReadinessFields(t,'securityId input bridge');fundamentalId(t.securityId);requireFundamental((t.input===null)===(t.bridge===null),'READINESS_INPUT_BRIDGE_PAIR');if(t.input){requireFundamental(t.input.securityId===t.securityId,'READINESS_SECURITY_BINDING');validateBridgePlan(t.bridge!);}}
 return deepFreeze(a);
}
/** Trust/governance is independently verified by the repository; this function only binds reviewed semantics. */
export function bindDIAcceptance(a:DataInitializationAcceptance,s:FundamentalSnapshot,hash:(v:unknown)=>string,digest:(bytes:string)=>string){
 validateDIAcceptance(a);const r=s.request,p=a.requirements,universe=r.references.find(v=>v.kind==='UNIVERSE')!;
 requireFundamental(r.scope==='FORMAL'&&r.mode==='AS_KNOWN'&&r.revisionCutoff===null,'FORMAL_AS_KNOWN_SNAPSHOT_REQUIRED');
 requireFundamental(a.snapshotRunId===r.runId&&a.contentHash===s.contentHash&&a.manifestDigest===digest(s.manifest)&&a.requirementsHash===hash(p)&&r.requirementsVersion===p.version&&a.universeHash===hash(universe),'DI_EXACT_DATASET_BINDING');
 requireFundamental(universe.content.length===30&&new Set(universe.content).size===30&&a.tickers.every(t=>universe.content.includes(t.securityId)),'DI_EXACT_UNIVERSE_BINDING');
 requireFundamental(s.blockers.length===0&&p.recordedAt<=r.systemKnownAt&&p.effectiveDate<=r.decisionAsOf.slice(0,10)&&r.builtAt<=a.acceptedAt,'DI_SNAPSHOT_OR_REQUIREMENTS_NOT_READY');
 for(const sid of universe.content){
  const sector=r.references.find(v=>v.kind==='SECTOR')!.content.find(v=>v.startsWith(sid+':'))?.slice(sid.length+1),route=p.sectors.find(v=>v.sector===sector);
  requireFundamental(route&&route.requiredItems.every(item=>r.requirements.some(q=>q.securityId===sid&&q.itemId===item)),'DI_REQUIRED_UNIVERSE_FINANCIAL_COVERAGE');
 }
}
export function evaluateScoringReadiness(a:DataInitializationAcceptance,s:FundamentalSnapshot,sources:ScoringBridgeSources,hash:(v:unknown)=>string):readonly TickerScoringReadiness[]{
 return deepFreeze(a.tickers.map(t=>{
  const blockers:string[]=[],dimensions={universe:'READY',market:'BLOCKED',fundamentals:'BLOCKED',valuation:'BLOCKED',flowTechnical:'NOT_APPLICABLE',confidence:'BLOCKED',assessmentsAndGates:'BLOCKED'} as {universe:ReadinessStatus;market:ReadinessStatus;fundamentals:ReadinessStatus;valuation:ReadinessStatus;flowTechnical:ReadinessStatus;confidence:ReadinessStatus;assessmentsAndGates:ReadinessStatus};
  const input=t.input,sector=s.request.references.find(v=>v.kind==='SECTOR')!.content.find(v=>v.startsWith(t.securityId+':'))?.slice(t.securityId.length+1),route=a.requirements.sectors.find(r=>r.sector===sector);
  if(route&&route.requiredItems.every(item=>sources.observations.some(o=>o.securityId===t.securityId&&o.itemId===item&&o.normalized.value!==null&&o.quality==='VALID'))&&route.requiredMetrics.every(metric=>sources.derived.some(d=>s.derivedIds.includes(d.id)&&d.request.securityId===t.securityId&&d.request.metric===metric&&d.status==='CALCULATED')))dimensions.fundamentals='READY';
  if(!input||!t.bridge){blockers.push('BLOCKED_ASSESSMENT_REQUIRED','BLOCKED_SCORING_INPUT_REQUIRED');return {securityId:t.securityId,...dimensions,dataReady:false,readyForScoring:false,blockers};}
  try{
   requireFundamental(input.artifactScope==='FORMAL'&&input.asOf===s.request.decisionAsOf&&input.knownAt===s.request.systemKnownAt&&hash(input.methodology)===a.scoringMethodologyHash,'READINESS_MODEL_OR_CUTOFF_MISMATCH');
   const refAt=referenceAt(input.reference.data,t.securityId,vietnamBusinessDate(instant(input.asOf)),input.reference.taxonomy);
   const active=input.reference.data.intervals.filter(v=>v.kind==='MEMBERSHIP'&&v.from<=vietnamBusinessDate(instant(input.asOf))&&(v.to===null||vietnamBusinessDate(instant(input.asOf))<v.to));
   requireFundamental(refAt.membership==='MEMBER'&&refAt.sector===sector&&new Set(active.map(v=>v.securityId)).size===30&&active.every(v=>s.request.references.find(v=>v.kind==='UNIVERSE')!.content.includes(v.securityId!)),'READINESS_REFERENCE_UNIVERSE_MISMATCH');
   requireFundamental(route,'READINESS_SECTOR_ROUTE_REQUIRED');
   const evidenceConflicts=validateEvidence(input.evidence,input.securityId,input.asOf,input.knownAt);
   function requiredExternal(kind:'MARKET'|'VALUATION',observations:readonly string[]){return observations.every(observation=>input!.evidence.some(e=>e.observation===observation&&(kind!=='MARKET'||isMarketEvidence(e))&&e.quality==='VALID'&&e.validThrough>=input!.asOf&&!evidenceConflicts.includes(e.id)&&t.bridge!.external.some(origin=>origin.evidenceId===e.id&&origin.kind===kind)));}
   if(requiredExternal('MARKET',route.requiredMarketObservations))dimensions.market='READY';else blockers.push('BLOCKED_MARKET_INPUTS');
   const valuationInputsPresent=requiredExternal('VALUATION',route.requiredValuationObservations);
   if(input.assessments.length!==RUBRICS.length)blockers.push('BLOCKED_ASSESSMENT_REQUIRED');
   const generated=bridgeScoringInputs(s,t.securityId,t.bridge,sources);assertBridgeMatches(input,generated,t.bridge);
   requireFundamental(route&&route.requiredItems.every(item=>t.bridge!.facts.some(f=>sources.observations.find(o=>o.id===f.observationId)?.itemId===item)||t.bridge!.metrics.some(m=>sources.derived.find(d=>d.id===m.derivationId)?.observations.some(o=>o.itemId===item)))&&route.requiredMetrics.every(m=>generated.metrics.some(v=>v.metric===m)),'READINESS_REQUIRED_FINANCIAL_INPUTS');
   // Every bridged report must support a governed financial topic or an executable operand.
   for(const fact of t.bridge.facts){const o=sources.observations.find(o=>o.id===fact.observationId)!,item=sources.registry.manifest.items.find(i=>i.itemId===o.itemId)!;requireFundamental(input.assessments.some(ass=>ass.evidence.some(e=>e.refs.includes(fact.evidenceId)&&item.evidenceTopicMappings.some(m=>m.rubricId===ass.subcategory&&m.topic===e.topic))),'BRIDGE_GOVERNED_TOPIC_REQUIRED');}
   dimensions.fundamentals='READY';
   const card=calculateScorecard(input);
   if(valuationInputsPresent&&input.expectedReturn&&card.subcategories.filter(c=>c.category==='VAL').every(c=>c.points!==null))dimensions.valuation='READY';else blockers.push('BLOCKED_VALUATION_INPUTS');
   if(input.confidence.level!=='LOW'&&!input.confidence.dimensions.includes('Weak')&&card.confidence!=='LOW')dimensions.confidence='READY';else blockers.push('BLOCKED_EVIDENCE_CONFIDENCE');
   if(input.assessments.length===RUBRICS.length&&card.totalScore!==null&&input.stage0.status!=='UNKNOWN'&&input.hardVeto.status!=='PENDING'&&input.doubleCountReview.passed)dimensions.assessmentsAndGates='READY';else blockers.push('BLOCKED_ASSESSMENT_REQUIRED');
  }catch(error){blockers.push('BLOCKED_INPUT_VALIDATION');if(error instanceof ValidationError)blockers.push(...error.issues.map(i=>i.reason));else blockers.push('INVALID_REVIEWED_INPUT');}
  const dataReady=dimensions.universe==='READY'&&dimensions.market==='READY'&&dimensions.fundamentals==='READY',readyForScoring=dataReady&&dimensions.valuation==='READY'&&dimensions.confidence==='READY'&&dimensions.assessmentsAndGates==='READY';
  return {securityId:t.securityId,...dimensions,dataReady,readyForScoring,blockers:[...new Set(blockers)].sort()};
 }));
}
