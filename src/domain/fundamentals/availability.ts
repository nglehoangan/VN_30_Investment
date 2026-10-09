import type { FundamentalObservation, RegistryRelease } from './contracts';
import { validateFundamentalObservation, requireFundamental, fundamentalId } from './validation';
import { instant, dateOnly } from '@/shared/time';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { snapshot } from '@/domain/scoring/validation';

export interface AvailabilityPolicy {
  readonly version: string;
  readonly algorithm: 'operational-max-v1';
  readonly governanceStatus: 'PROPOSED' | 'APPROVED';
  readonly approvalReference: string | null;
  readonly recordedAt: string;
  readonly dateOnlyZones: readonly ('UTC' | 'Asia/Ho_Chi_Minh')[];
}
export interface AvailabilityAssessment {
  readonly id: string; readonly observationId: string; readonly observationHash: string;
  readonly mode: 'AS_KNOWN'; readonly policy: AvailabilityPolicy; readonly policyHash: string; readonly assessedAt: string;
  readonly publicBoundary: string | null; readonly availableAt: string | null;
  readonly status: 'VERIFIED' | 'UNKNOWN' | 'INVALID'; readonly finding: string | null;
  readonly provenance: readonly string[];
}
export function validateAvailabilityPolicy(raw: AvailabilityPolicy) {
  const p=snapshot(raw);
  requireFundamental(Object.keys(p).sort().join(' ')==='algorithm approvalReference dateOnlyZones governanceStatus recordedAt version','AVAILABILITY_POLICY_FIELDS');
  fundamentalId(p.version);instant(p.recordedAt);
  requireFundamental(p.algorithm==='operational-max-v1'&&['PROPOSED','APPROVED'].includes(p.governanceStatus)&&
    (p.approvalReference===null||typeof p.approvalReference==='string'&&p.approvalReference.length>0&&p.approvalReference.length<=4000)&&
    (p.governanceStatus==='APPROVED')===(p.approvalReference!==null),'AVAILABILITY_POLICY_APPROVAL');
  requireFundamental(Array.isArray(p.dateOnlyZones)&&new Set(p.dateOnlyZones).size===p.dateOnlyZones.length&&p.dateOnlyZones.every(z=>['UTC','Asia/Ho_Chi_Minh'].includes(z)),'AVAILABILITY_POLICY_TIMEZONES');
  return deepFreeze({...p,dateOnlyZones:[...p.dateOnlyZones].sort()});
}
/** New artifact only. Signing and fiscal dates never substitute for publication. */
export function assessAvailability(input:{id:string;observation:FundamentalObservation;registry:RegistryRelease;policy:AvailabilityPolicy;assessedAt:string;hash:(v:unknown)=>string}):AvailabilityAssessment {
  fundamentalId(input.id);instant(input.assessedAt);
  const o=validateFundamentalObservation(input.observation,input.registry),p=validateAvailabilityPolicy(input.policy);
  requireFundamental(o.ingestedAt<=input.assessedAt&&p.recordedAt<=input.assessedAt,'AVAILABILITY_ASSESSMENT_CHRONOLOGY');
  let publicBoundary:string|null=null,status:AvailabilityAssessment['status']='UNKNOWN',finding:string|null='PUBLICATION_UNKNOWN';
  const pub=o.publication;
  if(pub.publicationStatus==='VERIFIED'&&pub.publicationPrecision==='TIMESTAMP')publicBoundary=pub.publishedAt;
  else if(pub.publicationStatus==='VERIFIED'&&pub.publicationPrecision==='DATE_ONLY'){
    if(p.governanceStatus!=='APPROVED')finding='DATE_ONLY_POLICY_UNAPPROVED';
    else if(!p.dateOnlyZones.includes(pub.timezone as 'UTC'))finding='DATE_ONLY_TIMEZONE_UNAPPROVED';
    else {
      dateOnly(pub.publicationDate!);
      const offset=pub.timezone==='Asia/Ho_Chi_Minh'?7*3600000:0;
      const start=Date.parse(pub.publicationDate!+'T00:00:00.000Z')-offset;
      publicBoundary=new Date(start+86400000).toISOString();
      if(Date.parse(o.retrievedAt)<start||(o.providerReceivedAt!==null&&Date.parse(o.providerReceivedAt)<start)){
        status='INVALID';finding='PUBLICATION_RECEIPT_CHRONOLOGY';
      }
    }
  }
  if(publicBoundary!==null&&status!=='INVALID'){
    status='VERIFIED';finding=null;
  }
  const boundaries=[publicBoundary,o.retrievedAt,o.ingestedAt,o.providerReceivedAt,o.correctionKnownAt].filter((v):v is string=>v!==null);
  const availableAt=status==='VERIFIED'?[...boundaries].sort().at(-1)!:null;
  return deepFreeze({id:input.id,observationId:o.id,observationHash:input.hash(o),mode:'AS_KNOWN',policy:p,policyHash:input.hash(p),assessedAt:input.assessedAt,publicBoundary,availableAt,status,finding,
    provenance:[pub.evidenceReference,o.providerReceiptReference,o.revisionEvidenceReference,...o.transformationReferences].filter((v):v is string=>v!==null).sort()});
}
