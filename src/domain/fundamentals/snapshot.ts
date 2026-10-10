import type { FundamentalObservation, RegistryRelease, ReportingScope } from './contracts';
import type { AvailabilityAssessment, AvailabilityPolicy } from './availability';
import { assessAvailability, validateAvailabilityPolicy, isEvidenceAssessment } from './availability';
import type { ProviderReceiptEvidenceBinding } from './availability-evidence';
import type { DerivationAssessment } from './derivation';
import { comparableKey } from './normalization';
import { requireFundamental, fundamentalId, validateFundamentalObservation } from './validation';
import { snapshot } from '@/domain/scoring/validation';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { instant, dateOnly } from '@/shared/time';

function codePointCompare(a:string,b:string):number {
  const left=Array.from(a),right=Array.from(b);
  for(let i=0;i<Math.min(left.length,right.length);i++){
    const difference=left[i].codePointAt(0)!-right[i].codePointAt(0)!;
    if(difference!==0)return difference;
  }
  return left.length-right.length;
}
/** Code-point key order, ordered arrays. Domain callers explicitly sort unordered sets. */
export function canonicalJson(value: unknown): string {
  if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'){requireFundamental(Number.isFinite(value),'CANONICAL_NUMBER');return JSON.stringify(value);}
  if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']';
  requireFundamental(typeof value==='object'&&value!==null,'CANONICAL_JSON_VALUE');
  return '{'+Object.keys(value).sort(codePointCompare).map(k=>JSON.stringify(k)+':'+canonicalJson((value as Record<string,unknown>)[k])).join(',')+'}';
}
export interface SnapshotRequirement {
  readonly securityId:string;readonly itemId:string;readonly reportingScope:ReportingScope;
  readonly periodStart:string;readonly periodEnd:string;readonly maxAgeDays:number|null;
}
export interface SnapshotReference {
  readonly kind:'UNIVERSE'|'SECTOR'|'MARKET'|'REFERENCE';readonly version:string;
  readonly knownAt:string;readonly content:readonly string[];
}
export interface SnapshotRequest {
  readonly runId:string;readonly scope:FundamentalObservation['scope'];
  readonly mode:'AS_KNOWN'|'AS_REVISED';readonly decisionAsOf:string;readonly systemKnownAt:string;
  readonly marketCutoff:string;readonly fundamentalCutoff:string;readonly revisionCutoff:string|null;
  readonly policy:AvailabilityPolicy;readonly requirementsVersion:string;
  readonly requirements:readonly SnapshotRequirement[];readonly references:readonly SnapshotReference[];
  readonly assessmentPins:readonly {readonly observationId:string;readonly assessmentId:string}[];
  readonly derivedIds:readonly string[];
  readonly builtAt:string;readonly softwareBuild:string;readonly operatorReference:string;
  readonly validationRunReference:string;readonly reviewContext:string;
}
export interface SnapshotInputs {
  readonly providerEvidenceBindings?:readonly ProviderReceiptEvidenceBinding[];
  readonly registry:RegistryRelease;readonly observations:readonly FundamentalObservation[];
  readonly assessments:readonly AvailabilityAssessment[];readonly derived:readonly DerivationAssessment[];
}
export interface SnapshotMember {readonly observationId:string;readonly assessmentId:string;readonly semanticHash:string;readonly observationHash:string}
export interface FundamentalSnapshot {
  readonly request:SnapshotRequest;readonly contentHash:string;readonly manifest:string;
  readonly members:readonly SnapshotMember[];readonly derivedIds:readonly string[];
  readonly blockers:readonly string[];
}
function exact(x:object,fields:string){requireFundamental(x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort(codePointCompare).join(' ')===fields.split(' ').sort(codePointCompare).join(' '),'SNAPSHOT_EXACT_FIELDS');}
export function validateSnapshotRequest(raw:SnapshotRequest){
  const r=snapshot(raw);
  exact(r,'runId scope mode decisionAsOf systemKnownAt marketCutoff fundamentalCutoff revisionCutoff policy requirementsVersion requirements references assessmentPins derivedIds builtAt softwareBuild operatorReference validationRunReference reviewContext');
  [r.runId,r.requirementsVersion,r.softwareBuild,r.operatorReference,r.validationRunReference,r.reviewContext].forEach(fundamentalId);
  [r.decisionAsOf,r.systemKnownAt,r.marketCutoff,r.fundamentalCutoff,r.builtAt].forEach(instant);
  requireFundamental(['FORMAL','SYNTHETIC_TEST','REVIEW_CANDIDATE'].includes(r.scope)&&['AS_KNOWN','AS_REVISED'].includes(r.mode),'SNAPSHOT_SCOPE_MODE');
  requireFundamental(r.systemKnownAt<=r.decisionAsOf&&r.marketCutoff<=r.decisionAsOf&&r.fundamentalCutoff<=r.decisionAsOf&&r.builtAt>=r.decisionAsOf,'SNAPSHOT_CUTOFF_ORDER');
  requireFundamental(r.mode==='AS_KNOWN'?r.revisionCutoff===null:r.revisionCutoff!==null&&instant(r.revisionCutoff)<=r.builtAt,'SNAPSHOT_REVISION_CUTOFF');
  validateAvailabilityPolicy(r.policy);
  requireFundamental(r.requirements.length>0&&r.requirements.length<=5000&&new Set(r.requirements.map(q=>canonicalJson([q.securityId,q.itemId,q.reportingScope,q.periodStart,q.periodEnd]))).size===r.requirements.length,'SNAPSHOT_REQUIREMENTS');
  for(const q of r.requirements){exact(q,'securityId itemId reportingScope periodStart periodEnd maxAgeDays');fundamentalId(q.securityId);fundamentalId(q.itemId);dateOnly(q.periodStart);dateOnly(q.periodEnd);
    requireFundamental(q.periodStart<=q.periodEnd&&q.periodEnd<=r.fundamentalCutoff.slice(0,10)&&['CONSOLIDATED','SEPARATE_STANDALONE'].includes(q.reportingScope)&&(q.maxAgeDays===null?r.scope==='REVIEW_CANDIDATE':Number.isInteger(q.maxAgeDays)&&q.maxAgeDays>=0&&q.maxAgeDays<=36500),'SNAPSHOT_REQUIREMENT_PERIOD');}
  requireFundamental(new Set(r.assessmentPins.map(p=>p.observationId)).size===r.assessmentPins.length&&new Set(r.assessmentPins.map(p=>p.assessmentId)).size===r.assessmentPins.length&&new Set(r.derivedIds).size===r.derivedIds.length,'SNAPSHOT_UNIQUE_PINS');
  r.assessmentPins.forEach(p=>{exact(p,'observationId assessmentId');fundamentalId(p.observationId);fundamentalId(p.assessmentId);});r.derivedIds.forEach(fundamentalId);
  requireFundamental(r.references.length>=3&&r.references.length<=100&&['UNIVERSE','SECTOR','MARKET'].every(k=>r.references.filter(v=>v.kind===k).length===1),'SNAPSHOT_REFERENCE_SET');
  for(const ref of r.references){exact(ref,'kind version knownAt content');fundamentalId(ref.version);instant(ref.knownAt);requireFundamental(['UNIVERSE','SECTOR','MARKET','REFERENCE'].includes(ref.kind)&&ref.knownAt<=r.systemKnownAt&&Array.isArray(ref.content)&&ref.content.length>0&&ref.content.every(s=>typeof s==='string'&&s.length>0&&s.length<=4000)&&new Set(ref.content).size===ref.content.length,'SNAPSHOT_REFERENCE_KNOWLEDGE');}
  requireFundamental(r.requirements.every(q=>r.references.find(v=>v.kind==='UNIVERSE')!.content.includes(q.securityId)),'SNAPSHOT_UNIVERSE_MEMBERSHIP');
  return deepFreeze(r);
}
/** Fixed v1 classification: normalization execution IDs live in run bodies, not investment content. */
function interpretationReferences(refs:readonly string[]){return refs.filter(r=>!r.startsWith('normalization-run:')).sort(codePointCompare);}
/** Fixed fields: storage occurrence IDs excluded; receipt times and all interpretation retained. */
export function factSemantic(o:FundamentalObservation,predecessorHash:string|null){
  return {contract:'canonical-fact-semantic-v1',scope:o.scope,securityId:o.securityId,ticker:o.ticker,identifierReference:o.identifierReference,sourceVersionId:o.sourceVersionId,
    itemId:o.itemId,registryVersion:o.registryVersion,registryHash:o.registryHash,itemDefinitionVersion:o.itemDefinitionVersion,
    statementType:o.statementType,measurementSemantic:o.measurementSemantic,sector:o.sector,reportingScope:o.reportingScope,segment:o.segment,accountingBasis:o.accountingBasis,auditStatus:o.auditStatus,
    periodStart:o.periodStart,periodEnd:o.periodEnd,periodType:o.periodType,fiscalYear:o.fiscalYear,fiscalQuarter:o.fiscalQuarter,fiscalCalendarReference:o.fiscalCalendarReference,
    reportDate:o.reportDate,reportDateReference:o.reportDateReference,publication:o.publication,providerReceivedAt:o.providerReceivedAt,providerReceiptReference:o.providerReceiptReference,retrievedAt:o.retrievedAt,ingestedAt:o.ingestedAt,
    raw:o.raw,normalized:o.normalized,mappingVersion:o.mappingVersion,transformationReferences:interpretationReferences(o.transformationReferences),dataPresence:o.dataPresence,quality:o.quality,applicability:o.applicability,
    applicabilityReference:o.applicabilityReference,scopeFallback:o.scopeFallback,fxLineageReference:o.fxLineageReference,revisionKind:o.revisionKind,recordVersion:o.recordVersion,predecessorHash,
    revisionReason:o.revisionReason,revisionEvidenceReference:o.revisionEvidenceReference,correctionKnownAt:o.correctionKnownAt,ancestorReferences:[...o.ancestorReferences].sort(codePointCompare)};
}
export function buildFundamentalSnapshot(request:SnapshotRequest,inputs:SnapshotInputs,hash:(v:unknown)=>string):FundamentalSnapshot {
  const r=validateSnapshotRequest(request),policy=validateAvailabilityPolicy(r.policy);
  requireFundamental(hash(inputs.registry.manifest)===inputs.registry.registryHash,'SNAPSHOT_REGISTRY_HASH');
  const cutoff=r.mode==='AS_REVISED'?r.revisionCutoff!:[r.systemKnownAt,r.fundamentalCutoff].sort(codePointCompare)[0];
  requireFundamental(policy.recordedAt<=cutoff&&inputs.registry.manifest.recordedAt<=cutoff,'SNAPSHOT_GOVERNANCE_KNOWLEDGE');
  requireFundamental(r.scope!=='FORMAL'||policy.governanceStatus==='APPROVED'&&inputs.registry.manifest.governanceStatus==='APPROVED','FORMAL_SNAPSHOT_GOVERNANCE');
  requireFundamental(r.requirements.every(q=>inputs.registry.manifest.items.some(i=>i.itemId===q.itemId&&i.status==='ACTIVE')),'SNAPSHOT_REQUIRED_CANONICAL_ITEMS');
  const all=inputs.observations.map(o=>validateFundamentalObservation(o,inputs.registry));
  requireFundamental(new Set(all.map(o=>o.id)).size===all.length,'SNAPSHOT_DUPLICATE_FACTS');
  const byId=new Map(all.map(o=>[o.id,o])),fingerprints=new Map<string,string>();
  function fingerprint(id:string,visited=new Set<string>()):string {
    if(fingerprints.has(id))return fingerprints.get(id)!;
    const o=byId.get(id);requireFundamental(o&&!visited.has(id),'SNAPSHOT_REVISION_LINEAGE');visited.add(id);
    let predecessorHash:string|null=null;
    if(o!.supersedesObservationId){const prev=byId.get(o!.supersedesObservationId);requireFundamental(prev&&comparableKey(prev)===comparableKey(o!)&&prev.ingestedAt<=o!.ingestedAt&&prev.ingestedAt<=o!.correctionKnownAt!,'SNAPSHOT_COMPARABLE_PREDECESSOR');if(o!.revisionKind==='ISSUER_RESTATEMENT')requireFundamental(o!.publication.evidenceReference!==null&&o!.publication.evidenceReference!==prev!.publication.evidenceReference,'SNAPSHOT_RESTATEMENT_DISCLOSURE');
      if(o!.revisionKind!=='ISSUER_RESTATEMENT')requireFundamental(canonicalJson(prev!.publication)===canonicalJson(o!.publication),'SNAPSHOT_CORRECTION_PUBLICATION');predecessorHash=fingerprint(o!.supersedesObservationId,visited);}
    const f=hash(factSemantic(o!,predecessorHash));fingerprints.set(id,f);return f;
  }
  const candidates=all.filter(o=>o.scope===r.scope&&o.ingestedAt<=cutoff&&r.requirements.some(q=>q.securityId===o.securityId&&q.itemId===o.itemId&&q.reportingScope===o.reportingScope&&q.periodStart===o.periodStart&&q.periodEnd===o.periodEnd));
  requireFundamental(r.assessmentPins.length===candidates.length&&r.assessmentPins.every(p=>candidates.some(o=>o.id===p.observationId)),'SNAPSHOT_COMPLETE_ASSESSMENT_PINS');
  const pinned=new Map<string,AvailabilityAssessment>();
  for(const o of candidates){
    const pin=r.assessmentPins.find(p=>p.observationId===o.id)!,a=inputs.assessments.find(a=>a.id===pin.assessmentId);
    requireFundamental(a&&a.assessedAt<=r.builtAt,'SNAPSHOT_ASSESSMENT_NOT_FOUND');
    const providerEvidenceBinding=isEvidenceAssessment(a!)?a!.providerEvidenceBinding:null;
    requireFundamental(!providerEvidenceBinding||inputs.providerEvidenceBindings?.some(b=>canonicalJson(b)===canonicalJson(providerEvidenceBinding)),'SNAPSHOT_TRUSTED_EVIDENCE_BINDING_REQUIRED');
    const replay=assessAvailability({id:a!.id,observation:o,registry:inputs.registry,policy,assessedAt:a!.assessedAt,providerEvidenceBinding,hash});
    requireFundamental(canonicalJson(replay)===canonicalJson(a),'SNAPSHOT_ASSESSMENT_REPLAY');pinned.set(o.id,a!);fingerprint(o.id);
    requireFundamental(r.references.find(v=>v.kind==='SECTOR')!.content.includes(o.securityId+':'+o.sector),'SNAPSHOT_SECTOR_BINDING');
  }
  const selected:FundamentalObservation[]=[],findings:unknown[]=[],blockers:string[]=[];
  for(const q of [...r.requirements].sort((a,b)=>codePointCompare(canonicalJson(a),canonicalJson(b)))){
    const rows=candidates.filter(o=>o.securityId===q.securityId&&o.itemId===q.itemId&&o.reportingScope===q.reportingScope&&o.periodStart===q.periodStart&&o.periodEnd===q.periodEnd);
    const eligible=rows.filter(o=>{const a=pinned.get(o.id)!;return a.status==='VERIFIED'&&a.availableAt!<=cutoff&&(r.mode==='AS_KNOWN'||o.quality==='VALID'&&o.dataPresence==='AVAILABLE'&&o.applicability==='APPLICABLE');});
    const superseded=new Set<string>();
    for(const o of eligible){let prev=o.supersedesObservationId;while(prev){superseded.add(prev);prev=byId.get(prev)!.supersedesObservationId;}}
    const heads=eligible.filter(o=>!superseded.has(o.id));
    let code:string|null=null;
    const roots=new Set(rows.map(o=>{let root=o;while(root.supersedesObservationId)root=byId.get(root.supersedesObservationId)!;return root.id;}));
    if(heads.length>1||roots.size>1)code='BLOCKED_CONFLICT';
    else if(heads.length===0)code=rows.some(o=>pinned.get(o.id)!.status==='UNKNOWN')?'BLOCKED_PUBLICATION_UNKNOWN':rows.some(o=>pinned.get(o.id)!.status==='INVALID')?'BLOCKED_INVALID_AVAILABILITY':rows.length?'BLOCKED_NOT_YET_AVAILABLE':'BLOCKED_REQUIRED_FACT_MISSING';
    else if(heads[0].quality!=='VALID'||heads[0].dataPresence!=='AVAILABLE'||heads[0].applicability!=='APPLICABLE')code='BLOCKED_FACT_QUALITY';
    else if(q.maxAgeDays===null)code='BLOCKED_FRESHNESS_POLICY_UNRESOLVED';
    else if(Date.parse(r.fundamentalCutoff)-Date.parse(q.periodEnd+'T00:00:00.000Z')>q.maxAgeDays*86400000)code='BLOCKED_STALE_FUNDAMENTALS';
    if(code){blockers.push(code);findings.push({requirement:q,code,candidates:rows.map(o=>({fingerprint:fingerprint(o.id),availability:availabilitySemantic(pinned.get(o.id)!)})).sort((a,b)=>a.fingerprint<b.fingerprint?-1:1)});}
    else selected.push(heads[0]);
  }
  const members=selected.map(o=>({observationId:o.id,assessmentId:pinned.get(o.id)!.id,semanticHash:fingerprint(o.id),observationHash:hash(o)})).sort((a,b)=>a.semanticHash<b.semanticHash?-1:1);
  const derivedContent:unknown[]=[],derivedIds:string[]=[];
  requireFundamental(inputs.derived.length===r.derivedIds.length&&inputs.derived.every(d=>r.derivedIds.includes(d.id)),'SNAPSHOT_DERIVED_MANIFEST');
  for(const d of inputs.derived){
    requireFundamental(d.recordedAt<=r.builtAt,'SNAPSHOT_DERIVATION_AFTER_BUILD');
    const ids=d.request.operands.flatMap(o=>o.observationIds),adjustments=d.request.operands.flatMap(o=>o.adjustment?[o.adjustment]:[]);
    if(d.request.scope!==r.scope||d.status!=='CALCULATED'||!ids.every(id=>members.some(m=>m.observationId===id))||adjustments.some(a=>a.reviewedAt>cutoff)||d.crosswalk.recordedAt>cutoff||d.crosswalk.effectiveDate>cutoff.slice(0,10)){blockers.push('BLOCKED_DERIVED_INPUTS');findings.push({code:'BLOCKED_DERIVED_INPUTS',metric:d.request.metric,securityId:d.request.securityId,periodStart:d.request.periodStart,periodEnd:d.request.periodEnd,crosswalk:d.crosswalk,operands:d.operands.map((o,i)=>({role:o.role,operation:o.operation,value:o.value,reason:o.reason,unit:o.unit,currency:o.currency,confidence:o.confidence,adjustment:d.request.operands[i].adjustment})),reason:d.reason,status:d.status});continue;}
    derivedIds.push(d.id);
    derivedContent.push({contract:'derived-semantic-v1',securityId:d.request.securityId,sector:d.request.sector,metric:d.request.metric,periodStart:d.request.periodStart,periodEnd:d.request.periodEnd,cyclical:d.request.cyclical,
      crosswalk:d.crosswalk,crosswalkHash:hash(d.crosswalk),operands:d.operands.map((o,i)=>({role:o.role,operation:o.operation,value:o.value,reason:o.reason,unit:o.unit,currency:o.currency,confidence:o.confidence,inputs:o.observationIds.map(id=>fingerprint(id)),adjustment:d.request.operands[i].adjustment})),
      value:d.value,unit:d.unit,currency:d.currency,reason:d.reason,confidence:d.confidence,status:d.status,availableAt:[...ids.map(id=>pinned.get(id)!.availableAt!),...adjustments.map(a=>a.reviewedAt)].sort(codePointCompare).at(-1)});
  }
  const manifest=canonicalJson({contract:policy.algorithm==='operational-max-v1'?'fundamental-snapshot-content-v1':'fundamental-snapshot-content-v2',selectorVersion:'explicit-chain-operational-v1',scope:r.scope,mode:r.mode,diagnosticOnly:r.mode==='AS_REVISED',
    decisionAsOf:r.decisionAsOf,systemKnownAt:r.systemKnownAt,marketCutoff:r.marketCutoff,fundamentalCutoff:r.fundamentalCutoff,revisionCutoff:r.revisionCutoff,
    registry:inputs.registry,policy,policyHash:hash(policy),requirementsVersion:r.requirementsVersion,requirements:[...r.requirements].sort((a,b)=>codePointCompare(canonicalJson(a),canonicalJson(b))),
    references:r.references.map(ref=>({...ref,content:[...ref.content].sort(codePointCompare)})).sort((a,b)=>codePointCompare(canonicalJson(a),canonicalJson(b))),
    facts:members.map(m=>({fingerprint:m.semanticHash,fact:factSemantic(byId.get(m.observationId)!,byId.get(m.observationId)!.supersedesObservationId?fingerprint(byId.get(m.observationId)!.supersedesObservationId!):null),availability:availabilitySemantic(pinned.get(m.observationId)!)})),
    exclusions:candidates.filter(o=>!members.some(m=>m.observationId===o.id)).map(o=>({fingerprint:fingerprint(o.id),availability:availabilitySemantic(pinned.get(o.id)!),state:pinned.get(o.id)!.status!=='VERIFIED'?pinned.get(o.id)!.finding:pinned.get(o.id)!.availableAt!>cutoff?'NOT_YET_AVAILABLE':'SUPERSEDED_OR_BLOCKED'})).sort((a,b)=>a.fingerprint<b.fingerprint?-1:1),
    derived:derivedContent.sort((a,b)=>codePointCompare(canonicalJson(a),canonicalJson(b))),findings:findings.sort((a,b)=>codePointCompare(canonicalJson(a),canonicalJson(b))),blockers:[...new Set(blockers)].sort(codePointCompare),scoringReadiness:'DEFERRED_SLICE_06'});
  return deepFreeze({request:JSON.parse(JSON.stringify(r)) as SnapshotRequest,contentHash:hash(JSON.parse(manifest)),manifest,members,derivedIds:derivedIds.sort(codePointCompare),blockers:[...new Set(blockers)].sort(codePointCompare)});
}
function availabilitySemantic(a:AvailabilityAssessment){
  const base={mode:a.mode,policyHash:a.policyHash,publicBoundary:a.publicBoundary,availableAt:a.availableAt,status:a.status,finding:a.finding,provenance:interpretationReferences(a.provenance)};
  if(!isEvidenceAssessment(a))return base;
  return {...base,publicFallbackBoundary:a.publicFallbackBoundary,evidenceBackedBoundary:a.evidenceBackedBoundary,boundaryBasis:a.boundaryBasis,
    evidenceInputs:a.evidenceInputs.map(e=>({...e,evidenceReference:e.evidenceClass==='LOCAL_RETRIEVAL'||e.evidenceClass==='LOCAL_INGESTION'?null:e.evidenceReference})),
    providerEvidenceAuthority:a.providerEvidenceBinding?.authority??null,
    providerReceiptEvidence:a.providerEvidenceBinding?{receivedAt:a.providerEvidenceBinding.receipt.receivedAt,evidenceReference:a.providerEvidenceBinding.receipt.evidenceReference,status:a.providerEvidenceBinding.receipt.status,knownAt:a.providerEvidenceBinding.receipt.knownAt}:null};
}
