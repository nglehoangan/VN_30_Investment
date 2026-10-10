import type {FundamentalObservation,RegistryRelease} from './contracts';
import {isEvidenceAssessment,validateAvailabilityPolicy,type AvailabilityAssessment} from './availability';
import type {DerivationAssessment} from './derivation';
import type {FundamentalSnapshot} from './snapshot';
import {canonicalJson} from './snapshot';
import {requireFundamental,fundamentalId,validateFundamentalObservation} from './validation';
import {validateEvidence,type Evidence,type CanonicalEvidenceTime} from '@/domain/scoring/evidence';
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
/** Shared predicate for sealed selection, scoring bridge and fundamental readiness. Sources
 * are independently reloaded/replayed by the repository; request JSON is never authority. */
export function eligibleScoringFact(s:FundamentalSnapshot,securityId:string,sources:ScoringBridgeSources,id:string,legacyReplay=false){
 requireFundamental(s.request.scope!=='REVIEW_CANDIDATE','CANDIDATES_NOT_FOR_SCORING');
 const r=s.request,member=s.members.find(m=>m.observationId===id),o=sources.observations.find(o=>o.id===id),a=sources.assessments.find(a=>a.id===member?.assessmentId);
 requireFundamental(member&&o&&a&&o.securityId===securityId&&a.observationId===id&&a.status==='VERIFIED'&&a.availableAt!==null&&a.availableAt<=r.systemKnownAt&&a.availableAt<=r.fundamentalCutoff,'BRIDGE_SELECTED_PIT_INPUT_REQUIRED');
 validateFundamentalObservation(o!,sources.registry);requireFundamental(o!.scope===r.scope&&o!.quality==='VALID'&&o!.normalized.value!==null&&o!.applicability==='APPLICABLE'&&o!.scopeFallback===null,'BRIDGE_VALID_CANONICAL_INPUT_REQUIRED');
 if(legacyReplay){requireFundamental(o!.publication.publicationStatus==='VERIFIED'&&o!.publication.publicationPrecision==='TIMESTAMP','BRIDGE_EXACT_PUBLICATION_REQUIRED');return {o:o!,a:a!};}
 const q=r.requirements.find(q=>q.securityId===securityId&&q.itemId===o!.itemId&&q.reportingScope===o!.reportingScope&&q.periodStart===o!.periodStart&&q.periodEnd===o!.periodEnd);
 requireFundamental(q&&q.maxAgeDays!==null&&Date.parse(r.fundamentalCutoff)-Date.parse(q.periodEnd+'T00:00:00.000Z')<=q.maxAgeDays*86400000&&a!.observationHash===member!.observationHash&&canonicalJson(a!.policy)===canonicalJson(validateAvailabilityPolicy(r.policy)),'BRIDGE_REQUIREMENT_AND_ASSESSMENT_BINDING');
 requireFundamental(r.references.find(v=>v.kind==='SECTOR')!.content.includes(securityId+':'+o!.sector),'BRIDGE_SECTOR_BINDING');
 const pub=o!.publication;
 requireFundamental(pub.publicationStatus==='VERIFIED'&&['TIMESTAMP','DATE_ONLY'].includes(pub.publicationPrecision),'BRIDGE_VERIFIED_PUBLICATION_REQUIRED');
 requireFundamental(a!.availableAt! >= o!.retrievedAt&&a!.availableAt! >= o!.ingestedAt&&(o!.correctionKnownAt===null||a!.availableAt! >= o!.correctionKnownAt),'BRIDGE_OPERATIONAL_KNOWLEDGE');
 if(pub.publicationPrecision==='TIMESTAMP')requireFundamental(a!.publicBoundary===pub.publishedAt,'BRIDGE_EXACT_PUBLICATION_BINDING');
 if(pub.publicationPrecision==='DATE_ONLY'){
  requireFundamental(a!.policy.governanceStatus==='APPROVED'&&a!.policy.dateOnlyZones.includes(pub.timezone as 'UTC')&&a!.publicBoundary!==null,'BRIDGE_GOVERNED_DATE_ONLY_REQUIRED');
  const fallback=new Date(Date.parse(pub.publicationDate!+'T00:00:00.000Z')-(pub.timezone==='Asia/Ho_Chi_Minh'?7*3600000:0)+86400000).toISOString();
  requireFundamental(isEvidenceAssessment(a!)?a!.publicFallbackBoundary===fallback&&(a!.boundaryBasis==='CONSERVATIVE_DATE_ONLY_FALLBACK'?a!.publicBoundary===fallback:a!.boundaryBasis==='TRUSTED_PROVIDER_RECEIPT'&&a!.evidenceBackedBoundary===a!.publicBoundary&&a!.publicBoundary===a!.providerEvidenceBinding?.receipt.receivedAt):a!.publicBoundary===fallback,'BRIDGE_DATE_ONLY_BOUNDARY_BINDING');
  if(isEvidenceAssessment(a!)&&a!.boundaryBasis==='TRUSTED_PROVIDER_RECEIPT')requireFundamental(a!.providerEvidenceBinding&&a!.providerEvidenceBinding.authority.governanceStatus==='APPROVED'&&a!.providerEvidenceBinding.receipt.status==='VERIFIED'&&a!.providerEvidenceBinding.receipt.observationHash===member!.observationHash&&a!.availableAt!>=a!.providerEvidenceBinding.receipt.knownAt&&a!.policy.dateOnlyEvidenceClasses.includes('TRUSTED_PROVIDER_RECEIPT'),'BRIDGE_GOVERNED_RECEIPT_REQUIRED');
 }
 requireFundamental(a!.publicBoundary!==null&&a!.availableAt!>=a!.publicBoundary,'BRIDGE_PUBLIC_KNOWLEDGE');return {o:o!,a:a!};
}
/** Legacy replay is selected only for stored v1 bindings; new bridges always emit v2. */
export function bridgeScoringInputs(s:FundamentalSnapshot,securityId:string,plan:ScoringBridgePlan,sources:ScoringBridgeSources,legacyReplay=false){
 validateBridgePlan(plan);const r=s.request,cutoff=r.systemKnownAt,evidence:Evidence[]=[],metrics:MetricRequest[]=[];
 const eligible=(id:string)=>eligibleScoringFact(s,securityId,sources,id,legacyReplay);
 function time(inputs:ReturnType<typeof eligible>[],reviewKnownAt:readonly string[]=[]):CanonicalEvidenceTime{
  const constituents=inputs.map(({o,a})=>({observationId:o.id,publicationPrecision:o.publication.publicationPrecision as 'TIMESTAMP'|'DATE_ONLY',publicationStatus:'VERIFIED' as const,publishedAt:o.publication.publishedAt,publicationDate:o.publication.publicationDate,timezone:o.publication.timezone,evidenceReference:o.publication.evidenceReference!,assessmentId:a.id,observationHash:a.observationHash,policyHash:a.policyHash,availableAt:a.availableAt!,availabilityProvenance:canonicalJson(a)}));
  return {contract:'canonical-evidence-time-v2',snapshotRunId:r.runId,fundamentalCutoff:r.fundamentalCutoff,availableAt:[...constituents.map(c=>c.availableAt),...reviewKnownAt].sort().at(-1)!,reviewKnownAt,constituents};
 }
 function unit(o:FundamentalObservation){requireFundamental(!o.normalized.unit.startsWith('CURRENCY')||o.normalized.currency==='VND','BRIDGE_NO_IMPLICIT_FX');return o.normalized.unit==='CURRENCY'?'VND' as const:o.normalized.unit==='CURRENCY_PER_SHARE'?'VND_PER_SHARE' as const:o.normalized.unit;}
 for(const p of plan.facts){const {o,a}=eligible(p.observationId);requireFundamental(p.validThrough>=r.decisionAsOf,'BRIDGE_FRESHNESS_REQUIRED');
  evidence.push({id:p.evidenceId,version:o.recordVersion,securityId,observation:'canonical-'+o.itemId,value:o.normalized.value!,unit:unit(o),classification:'FACT',source:'canonical-source:'+o.sourceVersionId+';publication:'+o.publication.evidenceReference,periodStart:o.periodStart,periodEnd:o.periodEnd,asOf:r.decisionAsOf,...(legacyReplay?{publishedAt:o.publication.publishedAt!}:{publishedAt:o.publication.publishedAt,time:time([{o,a}])}),receivedAt:a.availableAt!,validThrough:p.validThrough,critical:true,quality:'VALID',family:'canonical-'+o.itemId});
 }
 for(const p of plan.metrics){
  const d=sources.derived.find(d=>d.id===p.derivationId);requireFundamental(s.derivedIds.includes(p.derivationId)&&d&&d.request.securityId===securityId&&d.request.scope===r.scope&&d.status==='CALCULATED'&&d.value!==null&&d.confidence!=='LOW','BRIDGE_SELECTED_DERIVATION_REQUIRED');
  if(!legacyReplay)requireFundamental(d!.crosswalk.effectiveDate<=cutoff.slice(0,10)&&r.references.find(v=>v.kind==='SECTOR')!.content.includes(securityId+':'+d!.request.sector),'BRIDGE_DERIVATION_SECTOR_AND_EFFECTIVITY');
  requireFundamental(d!.crosswalk.recordedAt<=cutoff&&d!.request.operands.every(o=>!o.adjustment||o.adjustment.reviewedAt<=cutoff),'BRIDGE_DERIVATION_NOT_KNOWN');requireFundamental(p.validThrough>=r.decisionAsOf,'BRIDGE_FRESHNESS_REQUIRED');
  d!.operands.forEach((operand,i)=>{
   const inputs=operand.observationIds.map(eligible),adjustment=d!.request.operands[i].adjustment;
   requireFundamental(operand.value!==null&&operand.unit==='CURRENCY'&&operand.currency==='VND'&&operand.confidence!=='LOW','BRIDGE_OPERAND_DIMENSIONS');
   evidence.push({id:p.evidenceIds[i],version:d!.crosswalk.version,securityId,observation:'operand-'+d!.request.metric+'-'+operand.role,value:operand.value!,unit:'VND',classification:adjustment?'ESTIMATE':'FACT',source:'derived:'+d!.id+';crosswalk:'+d!.crosswalkHash,periodStart:d!.request.periodStart,periodEnd:d!.request.periodEnd,asOf:r.decisionAsOf,...(legacyReplay?{publishedAt:inputs.map(v=>v.o.publication.publishedAt!).sort().at(-1)!}:{publishedAt:inputs.every(v=>v.o.publication.publicationPrecision==='TIMESTAMP')?inputs.map(v=>v.o.publication.publishedAt!).sort().at(-1)!:null,time:time(inputs,[d!.crosswalk.recordedAt,...(adjustment?[adjustment.reviewedAt]:[])])}),receivedAt:[...inputs.map(v=>v.a.availableAt!),...(!legacyReplay?[d!.crosswalk.recordedAt]:[]),...(adjustment?[adjustment.reviewedAt]:[])].sort().at(-1)!,validThrough:p.validThrough,critical:true,quality:'VALID',family:'canonical-'+inputs[0].o.itemId});
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
 for(const origin of plan.external){const e=input.evidence.find(e=>e.id===origin.evidenceId);requireFundamental(e,'BRIDGE_EXTERNAL_EVIDENCE_REQUIRED');requireFundamental(!e!.time&&e!.publishedAt!==null,'EXTERNAL_CANNOT_CLAIM_CANONICAL_TIME_AUTHORITY');
  if(origin.kind==='HUMAN')requireFundamental(e!.unit==='TEXT'||e!.classification!=='FACT','HUMAN_CANNOT_SUPPLY_REPORTED_NUMERIC_FACT');
  if(origin.kind==='VALUATION')requireFundamental(e!.classification!=='FACT','VALUATION_REQUIRES_EXPLICIT_ESTIMATE');
  if(origin.kind==='MARKET')requireFundamental(isMarketEvidence(e!),'MARKET_EVIDENCE_ALLOWLIST');
 }
}
