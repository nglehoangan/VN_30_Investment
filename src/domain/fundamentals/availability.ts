import type { FundamentalObservation, RegistryRelease } from './contracts';
import { validateFundamentalObservation, requireFundamental, fundamentalId } from './validation';
import { instant, dateOnly } from '@/shared/time';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { snapshot } from '@/domain/scoring/validation';
import { bindProviderReceipt } from './availability-evidence';
import type { ProviderReceiptEvidenceBinding, AvailabilityEvidenceInput } from './availability-evidence';

interface AvailabilityPolicyBase {
  readonly version: string;
  readonly governanceStatus: 'PROPOSED' | 'APPROVED';
  readonly approvalReference: string | null;
  readonly recordedAt: string;
  readonly dateOnlyZones: readonly ('UTC' | 'Asia/Ho_Chi_Minh')[];
}
export interface LegacyAvailabilityPolicy extends AvailabilityPolicyBase {readonly algorithm:'operational-max-v1'}
export interface EvidenceAvailabilityPolicy extends AvailabilityPolicyBase {
  readonly algorithm:'operational-evidence-v2';
  readonly dateOnlyEvidenceClasses:readonly 'TRUSTED_PROVIDER_RECEIPT'[];
}
export type AvailabilityPolicy=LegacyAvailabilityPolicy|EvidenceAvailabilityPolicy;
interface AvailabilityAssessmentBase {
  readonly id: string; readonly observationId: string; readonly observationHash: string;
  readonly mode: 'AS_KNOWN'; readonly policy: AvailabilityPolicy; readonly policyHash: string; readonly assessedAt: string;
  readonly publicBoundary: string | null; readonly availableAt: string | null;
  readonly status: 'VERIFIED' | 'UNKNOWN' | 'INVALID'; readonly finding: string | null;
  readonly provenance: readonly string[];
}
export interface LegacyAvailabilityAssessment extends AvailabilityAssessmentBase {readonly policy:LegacyAvailabilityPolicy}
export interface EvidenceAvailabilityAssessment extends AvailabilityAssessmentBase {
  readonly policy:EvidenceAvailabilityPolicy;
  readonly publicFallbackBoundary:string|null; readonly evidenceBackedBoundary:string|null;
  readonly boundaryBasis:'ISSUER_PUBLICATION_TIMESTAMP'|'CONSERVATIVE_DATE_ONLY_FALLBACK'|'TRUSTED_PROVIDER_RECEIPT'|null;
  readonly evidenceInputs:readonly AvailabilityEvidenceInput[];
  readonly providerEvidenceBinding:ProviderReceiptEvidenceBinding|null;
}
export type AvailabilityAssessment=LegacyAvailabilityAssessment|EvidenceAvailabilityAssessment;
export function isEvidenceAssessment(a:AvailabilityAssessment):a is EvidenceAvailabilityAssessment{return a.policy.algorithm==='operational-evidence-v2';}
export function validateAvailabilityPolicy(raw: AvailabilityPolicy) {
  const p=snapshot(raw);
  const fields='algorithm approvalReference dateOnlyZones governanceStatus recordedAt version'+(p.algorithm==='operational-evidence-v2'?' dateOnlyEvidenceClasses':'');
  requireFundamental(Object.keys(p).sort().join(' ')===fields.split(' ').sort().join(' '),'AVAILABILITY_POLICY_FIELDS');
  fundamentalId(p.version);instant(p.recordedAt);
  requireFundamental(['operational-max-v1','operational-evidence-v2'].includes(p.algorithm)&&['PROPOSED','APPROVED'].includes(p.governanceStatus)&&
    (p.approvalReference===null||typeof p.approvalReference==='string'&&p.approvalReference.length>0&&p.approvalReference.length<=4000)&&
    (p.governanceStatus==='APPROVED')===(p.approvalReference!==null),'AVAILABILITY_POLICY_APPROVAL');
  requireFundamental(Array.isArray(p.dateOnlyZones)&&new Set(p.dateOnlyZones).size===p.dateOnlyZones.length&&p.dateOnlyZones.every(z=>['UTC','Asia/Ho_Chi_Minh'].includes(z)),'AVAILABILITY_POLICY_TIMEZONES');
  if(p.algorithm==='operational-evidence-v2')requireFundamental(Array.isArray(p.dateOnlyEvidenceClasses)&&new Set(p.dateOnlyEvidenceClasses).size===p.dateOnlyEvidenceClasses.length&&p.dateOnlyEvidenceClasses.every(c=>c==='TRUSTED_PROVIDER_RECEIPT'),'DATE_ONLY_PUBLIC_EVIDENCE_CLASSES');
  return deepFreeze({...p,dateOnlyZones:[...p.dateOnlyZones].sort()});
}
/** New artifact only. Signing and fiscal dates never substitute for publication. */
export function assessAvailability(input:{id:string;observation:FundamentalObservation;registry:RegistryRelease;policy:AvailabilityPolicy;assessedAt:string;providerEvidenceBinding?:ProviderReceiptEvidenceBinding|null;hash:(v:unknown)=>string}):AvailabilityAssessment {
  fundamentalId(input.id);instant(input.assessedAt);
  const o=validateFundamentalObservation(input.observation,input.registry),p=validateAvailabilityPolicy(input.policy);
  requireFundamental(o.ingestedAt<=input.assessedAt&&p.recordedAt<=input.assessedAt,'AVAILABILITY_ASSESSMENT_CHRONOLOGY');
  const trusted=p.algorithm==='operational-evidence-v2'&&input.providerEvidenceBinding?bindProviderReceipt(input.providerEvidenceBinding,o,input.assessedAt,input.hash):null;
  let publicFallbackBoundary:string|null=null,evidenceBackedBoundary:string|null=null;
  let boundaryBasis:EvidenceAvailabilityAssessment['boundaryBasis']=null;
  let publicBoundary:string|null=null,status:AvailabilityAssessment['status']='UNKNOWN',finding:string|null='PUBLICATION_UNKNOWN';
  const pub=o.publication;
  if(pub.publicationStatus==='VERIFIED'&&pub.publicationPrecision==='TIMESTAMP'){publicBoundary=pub.publishedAt;boundaryBasis='ISSUER_PUBLICATION_TIMESTAMP';}
  else if(pub.publicationStatus==='VERIFIED'&&pub.publicationPrecision==='DATE_ONLY'){
    if(p.governanceStatus!=='APPROVED')finding='DATE_ONLY_POLICY_UNAPPROVED';
    else if(!p.dateOnlyZones.includes(pub.timezone as 'UTC'))finding='DATE_ONLY_TIMEZONE_UNAPPROVED';
    else {
      dateOnly(pub.publicationDate!);
      const offset=pub.timezone==='Asia/Ho_Chi_Minh'?7*3600000:0;
      const start=Date.parse(pub.publicationDate!+'T00:00:00.000Z')-offset;
      publicBoundary=new Date(start+86400000).toISOString();publicFallbackBoundary=publicBoundary;boundaryBasis='CONSERVATIVE_DATE_ONLY_FALLBACK';
      if(trusted&&p.algorithm==='operational-evidence-v2'&&p.dateOnlyEvidenceClasses.includes('TRUSTED_PROVIDER_RECEIPT')&&Date.parse(trusted.receipt.receivedAt)>=start&&trusted.receipt.receivedAt<publicFallbackBoundary){
        evidenceBackedBoundary=trusted.receipt.receivedAt;publicBoundary=evidenceBackedBoundary;boundaryBasis='TRUSTED_PROVIDER_RECEIPT';
      }
      if(Date.parse(o.retrievedAt)<start||(o.providerReceivedAt!==null&&Date.parse(o.providerReceivedAt)<start)){
        status='INVALID';finding='PUBLICATION_RECEIPT_CHRONOLOGY';
      }
    }
  }
  // V2 rejects known local-day inconsistencies even when a policy cannot authorize a boundary.
  if(p.algorithm==='operational-evidence-v2'&&pub.publicationStatus==='VERIFIED'&&pub.publicationPrecision==='DATE_ONLY'&&['UTC','Asia/Ho_Chi_Minh'].includes(pub.timezone!)){
    const start=Date.parse(pub.publicationDate!+'T00:00:00.000Z')-(pub.timezone==='Asia/Ho_Chi_Minh'?7*3600000:0);
    if(Date.parse(o.retrievedAt)<start||(o.providerReceivedAt!==null&&Date.parse(o.providerReceivedAt)<start)){status='INVALID';finding='PUBLICATION_RECEIPT_CHRONOLOGY';}
  }
  if(publicBoundary!==null&&status!=='INVALID'){
    status='VERIFIED';finding=null;
  }
  const boundaries=[publicBoundary,o.retrievedAt,o.ingestedAt,o.providerReceivedAt,o.correctionKnownAt,...(trusted?[trusted.authority.recordedAt,trusted.receipt.knownAt]:[])].filter((v):v is string=>v!==null);
  const availableAt=status==='VERIFIED'?[...boundaries].sort().at(-1)!:null;
  const base={id:input.id,observationId:o.id,observationHash:input.hash(o),mode:'AS_KNOWN' as const,policy:p,policyHash:input.hash(p),assessedAt:input.assessedAt,publicBoundary,availableAt,status,finding,
    provenance:[pub.evidenceReference,o.providerReceiptReference,o.revisionEvidenceReference,...o.transformationReferences].filter((v):v is string=>v!==null).sort()};
  if(p.algorithm==='operational-max-v1')return deepFreeze({...base,policy:p});
  const evidenceInputs:AvailabilityEvidenceInput[]=[];
  function evidence(evidenceClass:AvailabilityEvidenceInput['evidenceClass'],timestamp:string,reference:string,canEstablishPublicBoundary=false,authorityHash:string|null=null,knownAt:string|null=null){evidenceInputs.push({evidenceClass,timestamp,evidenceReference:reference,canEstablishPublicBoundary,authorityHash,knownAt});}
  if(pub.publicationPrecision==='TIMESTAMP')evidence('ISSUER_PUBLICATION_TIMESTAMP',pub.publishedAt!,pub.evidenceReference!,true);
  if(o.providerReceivedAt!==null)evidence(trusted?'TRUSTED_PROVIDER_RECEIPT':'UNTRUSTED_PROVIDER_RECEIPT',o.providerReceivedAt,o.providerReceiptReference!,boundaryBasis==='TRUSTED_PROVIDER_RECEIPT',trusted?input.hash(trusted.authority):null,trusted?.receipt.knownAt??null);
  evidence('LOCAL_RETRIEVAL',o.retrievedAt,'raw-capture:'+o.rawCaptureId);evidence('LOCAL_INGESTION',o.ingestedAt,'observation:'+o.id);
  if(o.correctionKnownAt!==null)evidence('CORRECTION_KNOWLEDGE',o.correctionKnownAt,o.revisionEvidenceReference!);
  return deepFreeze({...base,policy:p,publicFallbackBoundary,evidenceBackedBoundary,boundaryBasis,evidenceInputs,providerEvidenceBinding:trusted});
}
