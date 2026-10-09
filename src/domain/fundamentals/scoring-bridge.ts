import type {FundamentalObservation,RegistryRelease} from './contracts';
import type {AvailabilityAssessment} from './availability';
import type {DerivationAssessment} from './derivation';
import type {FundamentalSnapshot} from './snapshot';
import {canonicalJson} from './snapshot';
import {requireFundamental,fundamentalId,validateFundamentalObservation} from './validation';
import {validateEvidence,type Evidence} from '@/domain/scoring/evidence';
import {calculateMetrics,type MetricRequest} from '@/domain/scoring/metrics';
import {instant} from '@/shared/time';
import {deepFreeze} from '@/domain/portfolio/transaction';
export interface ScoringBridgePlan {
 readonly facts:readonly {readonly observationId:string;readonly evidenceId:string;readonly validThrough:string}[];
 readonly metrics:readonly {readonly derivationId:string;readonly requestId:string;readonly evidenceIds:readonly [string,string];readonly validThrough:string}[];
 readonly external:readonly {readonly evidenceId:string;readonly kind:'HUMAN'|'MARKET'|'VALUATION'}[];
}
export interface ScoringBridgeSources {
 readonly registry:RegistryRelease;readonly observations:readonly FundamentalObservation[];
 readonly assessments:readonly AvailabilityAssessment[];readonly derived:readonly DerivationAssessment[];
}
export function exactReadinessFields(x:object,fields:string){requireFundamental(x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(' ')===fields.split(' ').sort().join(' '),'SCORING_READINESS_EXACT_FIELDS');}
export function validateBridgePlan(p:ScoringBridgePlan){
 exactReadinessFields(p,'facts metrics external');requireFundamental(Array.isArray(p.facts)&&Array.isArray(p.metrics)&&Array.isArray(p.external),'BRIDGE_PLAN_ARRAYS');
 for(const r of p.facts){exactReadinessFields(r,'observationId evidenceId validThrough');[r.observationId,r.evidenceId].forEach(fundamentalId);instant(r.validThrough);}
 for(const r of p.metrics){exactReadinessFields(r,'derivationId requestId evidenceIds validThrough');[r.derivationId,r.requestId].forEach(fundamentalId);requireFundamental(Array.isArray(r.evidenceIds)&&r.evidenceIds.length===2,'TWO_BRIDGE_OPERANDS');r.evidenceIds.forEach(fundamentalId);instant(r.validThrough);}
 for(const r of p.external){exactReadinessFields(r,'evidenceId kind');fundamentalId(r.evidenceId);requireFundamental(['HUMAN','MARKET','VALUATION'].includes(r.kind),'EXTERNAL_EVIDENCE_ORIGIN');}
 const ids=[...p.facts.map(r=>r.evidenceId),...p.metrics.flatMap(r=>r.evidenceIds),...p.external.map(r=>r.evidenceId)];requireFundamental(new Set(ids).size===ids.length&&new Set(p.facts.map(r=>r.observationId)).size===p.facts.length&&new Set(p.metrics.map(r=>r.requestId)).size===p.metrics.length,'UNIQUE_BRIDGE_MANIFEST');
}
/** Strict current Evidence boundary: DATE_ONLY/UNKNOWN never becomes an invented publishedAt. */
export function bridgeScoringInputs(s:FundamentalSnapshot,securityId:string,plan:ScoringBridgePlan,sources:ScoringBridgeSources){
 validateBridgePlan(plan);const r=s.request,cutoff=r.systemKnownAt,evidence:Evidence[]=[],metrics:MetricRequest[]=[];
 function eligible(id:string){
  const member=s.members.find(m=>m.observationId===id),o=sources.observations.find(o=>o.id===id),a=sources.assessments.find(a=>a.id===member?.assessmentId);
  requireFundamental(member&&o&&a&&o.securityId===securityId&&a.observationId===id&&a.status==='VERIFIED'&&a.availableAt!==null&&a.availableAt<=cutoff&&a.availableAt<=r.fundamentalCutoff,'BRIDGE_SELECTED_PIT_INPUT_REQUIRED');
  validateFundamentalObservation(o!,sources.registry);requireFundamental(o!.scope===r.scope&&o!.quality==='VALID'&&o!.normalized.value!==null&&o!.applicability==='APPLICABLE'&&o!.scopeFallback===null,'BRIDGE_VALID_CANONICAL_INPUT_REQUIRED');
  requireFundamental(o!.publication.publicationStatus==='VERIFIED'&&o!.publication.publicationPrecision==='TIMESTAMP','BRIDGE_EXACT_PUBLICATION_REQUIRED');return {o:o!,a:a!};
 }
 function unit(o:FundamentalObservation){requireFundamental(!o.normalized.unit.startsWith('CURRENCY')||o.normalized.currency==='VND','BRIDGE_NO_IMPLICIT_FX');return o.normalized.unit==='CURRENCY'?'VND' as const:o.normalized.unit==='CURRENCY_PER_SHARE'?'VND_PER_SHARE' as const:o.normalized.unit;}
 for(const p of plan.facts){const {o,a}=eligible(p.observationId);requireFundamental(p.validThrough>=r.decisionAsOf,'BRIDGE_FRESHNESS_REQUIRED');
  evidence.push({id:p.evidenceId,version:o.recordVersion,securityId,observation:'canonical-'+o.itemId,value:o.normalized.value!,unit:unit(o),classification:'FACT',source:'canonical-source:'+o.sourceVersionId+';publication:'+o.publication.evidenceReference,periodStart:o.periodStart,periodEnd:o.periodEnd,asOf:r.decisionAsOf,publishedAt:o.publication.publishedAt!,receivedAt:a.availableAt!,validThrough:p.validThrough,critical:true,quality:'VALID',family:'canonical-'+o.itemId});
 }
 for(const p of plan.metrics){
  const d=sources.derived.find(d=>d.id===p.derivationId);requireFundamental(s.derivedIds.includes(p.derivationId)&&d&&d.request.securityId===securityId&&d.request.scope===r.scope&&d.status==='CALCULATED'&&d.value!==null&&d.confidence!=='LOW','BRIDGE_SELECTED_DERIVATION_REQUIRED');
  requireFundamental(d!.crosswalk.recordedAt<=cutoff&&d!.request.operands.every(o=>!o.adjustment||o.adjustment.reviewedAt<=cutoff),'BRIDGE_DERIVATION_NOT_KNOWN');requireFundamental(p.validThrough>=r.decisionAsOf,'BRIDGE_FRESHNESS_REQUIRED');
  d!.operands.forEach((operand,i)=>{
   const inputs=operand.observationIds.map(eligible),adjustment=d!.request.operands[i].adjustment;
   requireFundamental(operand.value!==null&&operand.unit==='CURRENCY'&&operand.currency==='VND'&&operand.confidence!=='LOW','BRIDGE_OPERAND_DIMENSIONS');
   evidence.push({id:p.evidenceIds[i],version:d!.crosswalk.version,securityId,observation:'operand-'+d!.request.metric+'-'+operand.role,value:operand.value!,unit:'VND',classification:adjustment?'ESTIMATE':'FACT',source:'derived:'+d!.id+';crosswalk:'+d!.crosswalkHash,periodStart:d!.request.periodStart,periodEnd:d!.request.periodEnd,asOf:r.decisionAsOf,publishedAt:inputs.map(v=>v.o.publication.publishedAt!).sort().at(-1)!,receivedAt:[...inputs.map(v=>v.a.availableAt!),...(adjustment?[adjustment.reviewedAt]:[])].sort().at(-1)!,validThrough:p.validThrough,critical:true,quality:'VALID',family:'canonical-'+inputs[0].o.itemId});
  });
  const operations=d!.request.operands.map(o=>o.operation),kind=operations.includes('HUMAN_NORMALIZED')?'NORMALIZED':operations.includes('ACTION_ADJUSTED')?'ACTION_ADJUSTED':'AS_REPORTED';
  const request:MetricRequest={id:p.requestId,metric:d!.request.metric,evidenceRefs:p.evidenceIds,years:null,comparable:true,normalization:{kind,rationale:'Governed derivation '+d!.id+' / '+d!.crosswalk.version,evidenceRefs:[]}};
  const calculated=calculateMetrics([request],evidence,d!.request.sector,r.decisionAsOf,[],d!.request.cyclical)[0];requireFundamental(calculated.value===d!.value,'BRIDGE_FORMULA_REPLAY');metrics.push(request);
 }
 requireFundamental(validateEvidence(evidence,securityId,r.decisionAsOf,cutoff).length===0,'BRIDGE_CONFLICTING_EVIDENCE');return deepFreeze({evidence,metrics});
}
/** Market roles retain their monetary/share dimensions; a numeric ratio is not a price. */
export function isMarketEvidence(e:Evidence){
 return e.classification==='FACT'&&(e.observation==='price'?['VND','VND_PER_SHARE'].includes(e.unit):e.observation==='shares'?e.unit==='SHARES':['market_cap','EV'].includes(e.observation)&&e.unit==='VND');
}
export function assertBridgeMatches(input:{evidence:readonly Evidence[];metrics:readonly MetricRequest[]},generated:ReturnType<typeof bridgeScoringInputs>,plan:ScoringBridgePlan){
 requireFundamental(canonicalJson(input.metrics)===canonicalJson(generated.metrics),'BRIDGE_METRIC_REQUEST_MISMATCH');
 const mapped=generated.evidence.map(e=>e.id);requireFundamental(input.evidence.length===mapped.length+plan.external.length,'BRIDGE_COMPLETE_EVIDENCE_MANIFEST');
 for(const e of generated.evidence)requireFundamental(canonicalJson(input.evidence.find(x=>x.id===e.id))===canonicalJson(e),'BRIDGE_EVIDENCE_MISMATCH');
 for(const origin of plan.external){const e=input.evidence.find(e=>e.id===origin.evidenceId);requireFundamental(e,'BRIDGE_EXTERNAL_EVIDENCE_REQUIRED');
  if(origin.kind==='HUMAN')requireFundamental(e!.unit==='TEXT'||e!.classification!=='FACT','HUMAN_CANNOT_SUPPLY_REPORTED_NUMERIC_FACT');
  if(origin.kind==='VALUATION')requireFundamental(e!.classification!=='FACT','VALUATION_REQUIRES_EXPLICIT_ESTIMATE');
  if(origin.kind==='MARKET')requireFundamental(isMarketEvidence(e!),'MARKET_EVIDENCE_ALLOWLIST');
 }
}
