import { dateOnly, instant } from '@/shared/time';
import { fundamentalHash, fundamentalId, requireFundamental } from './validation';
import { deepFreeze } from '@/domain/portfolio/transaction';
export type OperationalFreshnessClass='MARKET'|'FUNDAMENTALS'|'VN30_MEMBERSHIP'|'SECTOR_MASTER'|'ESTIMATES';
export type OperationalFreshnessStatus='CURRENT'|'AGING'|'STALE'|'UNKNOWN';
export interface OperationalFreshnessPolicy {
 readonly version:string;readonly recordedAt:string;readonly governanceStatus:'PROPOSED'|'APPROVED';readonly approvalReference:string|null;
 readonly methodologyReference:string;readonly algorithm:'reporting-cycle-and-version-v1';
 readonly graceRule:'EXPLICIT_PREEXISTING_CYCLE_OR_WORKFLOW_EVIDENCE_ONLY';
}
export interface OperationalFreshnessEvidence {
 readonly class:OperationalFreshnessClass;readonly cutoff:string;readonly periodOrVersion:string;
 readonly requiredPeriodOrVersion:string|null;readonly requirementKnownAt:string|null;
 readonly requirementEvidenceReference:string|null;readonly publicationUsable:boolean;
 readonly inventoryVerifiedThrough:string|null;readonly graceUntil:string|null;
 readonly graceEvidenceReference:string|null;readonly validUntil:string|null;readonly contentHash:string;
}
/** Version/cycle evidence is supplied by public-source composition, never a universal age cutoff. */
export function assessOperationalFreshness(policy:OperationalFreshnessPolicy,e:OperationalFreshnessEvidence,hash:(v:unknown)=>string){
 requireFundamental(Object.keys(policy).sort().join(' ')==='algorithm approvalReference governanceStatus graceRule methodologyReference recordedAt version','FRESHNESS_POLICY_FIELDS');
 requireFundamental(Object.keys(e).sort().join(' ')==='class contentHash cutoff graceEvidenceReference graceUntil inventoryVerifiedThrough periodOrVersion publicationUsable requiredPeriodOrVersion requirementEvidenceReference requirementKnownAt validUntil','FRESHNESS_EVIDENCE_FIELDS');
 requireFundamental(['MARKET','FUNDAMENTALS','VN30_MEMBERSHIP','SECTOR_MASTER','ESTIMATES'].includes(e.class)&&typeof e.publicationUsable==='boolean'&&typeof e.periodOrVersion==='string'&&e.periodOrVersion.trim().length>0,'FRESHNESS_EVIDENCE_TYPES');
 for(const value of [policy.methodologyReference,policy.approvalReference,e.requiredPeriodOrVersion,e.requirementEvidenceReference,e.graceEvidenceReference])requireFundamental(value===null||typeof value==='string'&&value.trim()===value&&value.length>0&&value.length<=4000&&!/[\x00-\x1f<>]/.test(value),'FRESHNESS_REFERENCE');
 fundamentalId(policy.version);instant(policy.recordedAt);instant(e.cutoff);fundamentalHash(e.contentHash);
 requireFundamental(policy.algorithm==='reporting-cycle-and-version-v1'&&policy.graceRule==='EXPLICIT_PREEXISTING_CYCLE_OR_WORKFLOW_EVIDENCE_ONLY'&&policy.methodologyReference.length>0,'FRESHNESS_POLICY');
 requireFundamental((policy.governanceStatus==='APPROVED')===(policy.approvalReference!==null)&&['PROPOSED','APPROVED'].includes(policy.governanceStatus),'FRESHNESS_GOVERNANCE');
 requireFundamental(policy.recordedAt<=e.cutoff,'FRESHNESS_POLICY_NOT_KNOWN');
 for(const t of [e.requirementKnownAt,e.inventoryVerifiedThrough,e.graceUntil,e.validUntil])if(t!==null)instant(t);
 requireFundamental(e.requirementKnownAt===null||e.requirementKnownAt<=e.cutoff,'FRESHNESS_REQUIREMENT_NOT_KNOWN');
 requireFundamental(e.inventoryVerifiedThrough===null||e.inventoryVerifiedThrough<=e.cutoff,'FRESHNESS_INVENTORY_FUTURE');
 requireFundamental((e.graceUntil===null)===(e.graceEvidenceReference===null),'FRESHNESS_GRACE_EVIDENCE');
 let status:OperationalFreshnessStatus='UNKNOWN',reason='LATEST_REQUIREMENT_OR_PUBLIC_INVENTORY_UNPROVEN';
 if(e.requiredPeriodOrVersion!==null&&e.requirementKnownAt!==null&&e.requirementEvidenceReference&&e.inventoryVerifiedThrough!==null&&e.publicationUsable){
  if(e.periodOrVersion===e.requiredPeriodOrVersion){status='CURRENT';reason='LATEST_REQUIRED_PUBLIC_PERIOD_OR_VERSION';}
  else if(e.graceUntil!==null&&e.graceUntil>=e.cutoff){status='AGING';reason='EXPLICIT_OPERATIONAL_GRACE';}
  else {status='STALE';reason='NEWER_REQUIRED_PUBLIC_PERIOD_OR_VERSION';}
 }
 if(e.class==='ESTIMATES'&&status==='CURRENT'){
  if(e.validUntil===null){status='UNKNOWN';reason='ESTIMATE_WORKFLOW_VALIDITY_UNPROVEN';}
  else if(e.validUntil<e.cutoff){status='STALE';reason='ESTIMATE_WORKFLOW_VALIDITY_EXCEEDED';}
 }
 if(e.class==='FUNDAMENTALS'){dateOnly(e.periodOrVersion);if(e.requiredPeriodOrVersion!==null)dateOnly(e.requiredPeriodOrVersion);}
 return deepFreeze({policy,policyHash:hash(policy),evidence:e,evidenceHash:hash(e),status,reason,eligible:status==='CURRENT'});
}
