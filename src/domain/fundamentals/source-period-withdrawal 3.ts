import type {FundamentalObservation} from './contracts';
import {fundamentalHash,requireFundamental} from './validation';
import {instant} from '@/shared/time';

/** Quarantine a proven transcription-period defect; this is not an issuer revision. */
export interface SourcePeriodWithdrawal {
 readonly observationId:string;readonly observationHash:string;readonly replacementObservationId:string;readonly replacementObservationHash:string;
 readonly priorQualificationId:string;readonly correctedQualificationId:string;readonly bodyHash:string;
 readonly recordedAt:string;readonly reason:'SOURCE_PERIOD_QUALIFICATION_CORRECTION';readonly sourcePageEvidenceHashes:readonly string[];
 readonly status:'REVIEW_CANDIDATE'|'APPROVED';readonly approvalReference:string|null;
}
export function validateSourcePeriodWithdrawals(records:readonly SourcePeriodWithdrawal[],rows:readonly FundamentalObservation[],cutoff:string,hash:(v:unknown)=>string){
 const withdrawn=new Set<string>();
 for(const r of records){
  requireFundamental(JSON.stringify(Object.keys(r).sort())===JSON.stringify('observationId observationHash replacementObservationId replacementObservationHash priorQualificationId correctedQualificationId bodyHash recordedAt reason sourcePageEvidenceHashes status approvalReference'.split(' ').sort()),'WITHDRAWAL_EXACT_FIELDS');
  instant(r.recordedAt);requireFundamental(r.recordedAt<=cutoff&&r.reason==='SOURCE_PERIOD_QUALIFICATION_CORRECTION','WITHDRAWAL_KNOWLEDGE');
  requireFundamental(r.status==='REVIEW_CANDIDATE'&&r.approvalReference===null||r.status==='APPROVED'&&typeof r.approvalReference==='string'&&r.approvalReference.trim().length>0,'WITHDRAWAL_APPROVAL');
  [r.observationHash,r.replacementObservationHash,r.bodyHash].forEach(fundamentalHash);
  const old=rows.find(o=>o.id===r.observationId),next=rows.find(o=>o.id===r.replacementObservationId);
  requireFundamental(old&&next&&old.id!==next.id&&!withdrawn.has(old.id)&&hash(old)===r.observationHash&&hash(next)===r.replacementObservationHash,'WITHDRAWAL_EXACT_OCCURRENCES');
  requireFundamental(old.scope==='REVIEW_CANDIDATE'&&next.scope==='REVIEW_CANDIDATE'||r.status==='APPROVED','WITHDRAWAL_FORMAL_APPROVAL');
  requireFundamental(old.ingestedAt<=r.recordedAt&&next.ingestedAt<=r.recordedAt&&next.quality==='VALID'&&next.dataPresence==='AVAILABLE','WITHDRAWAL_VALID_REPLACEMENT');
  requireFundamental(['scope','securityId','itemId','reportingScope','accountingBasis','sourceVersionId','rawCaptureId'].every(k=>old[k as keyof FundamentalObservation]===next[k as keyof FundamentalObservation])&&JSON.stringify(old.normalized)===JSON.stringify(next.normalized),'WITHDRAWAL_SAME_SOURCE_VALUE_IDENTITY');
  requireFundamental(old.periodStart!==next.periodStart||old.periodEnd!==next.periodEnd||old.periodType!==next.periodType,'WITHDRAWAL_PERIOD_MUST_CHANGE');
  requireFundamental(old.transformationReferences.includes('document-sha256:'+r.bodyHash)&&next.transformationReferences.includes('document-sha256:'+r.bodyHash)&&old.transformationReferences.includes('qualification:'+r.priorQualificationId)&&next.transformationReferences.includes('qualification:'+r.correctedQualificationId)&&r.priorQualificationId!==r.correctedQualificationId,'WITHDRAWAL_QUALIFICATION_LINEAGE');
  requireFundamental(Array.isArray(r.sourcePageEvidenceHashes)&&new Set(r.sourcePageEvidenceHashes).size>=2,'WITHDRAWAL_SOURCE_PAGES');r.sourcePageEvidenceHashes.forEach(fundamentalHash);
  withdrawn.add(old.id);
 }
 requireFundamental(records.every(r=>!withdrawn.has(r.replacementObservationId)),'WITHDRAWAL_REPLACEMENT_NOT_WITHDRAWN');
 return withdrawn;
}
