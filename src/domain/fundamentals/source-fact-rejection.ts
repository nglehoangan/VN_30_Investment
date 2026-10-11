import type {FundamentalObservation} from './contracts';
import {fundamentalHash, requireFundamental} from './validation';
import {instant,dateOnly} from '@/shared/time';

/** Proven extraction/mapping defects are quarantined, never treated as issuer revisions. */
export interface SourceFactRejection {
 readonly observationId:string;readonly observationHash:string;readonly bodyHash:string;
 readonly sourceLocator:string;readonly recordedAt:string;
 readonly reason:'WRONG_CANONICAL_CAPTION'|'WRONG_SOURCE_COLUMN_PERIOD';
 readonly sourceCaption:string;readonly sourcePeriodStart:string;readonly sourcePeriodEnd:string;
 readonly sourcePageEvidenceHashes:readonly string[];
 readonly evidenceReference:string;readonly status:'REVIEW_CANDIDATE';readonly approvalReference:null;
}
export function validateSourceFactRejections(records:readonly SourceFactRejection[],rows:readonly FundamentalObservation[],cutoff:string,hash:(v:unknown)=>string){
 const rejected=new Set<string>();
 for(const r of records){
  requireFundamental(Object.keys(r).sort().join(' ')==='approvalReference bodyHash evidenceReference observationHash observationId reason recordedAt sourceCaption sourceLocator sourcePageEvidenceHashes sourcePeriodEnd sourcePeriodStart status','FACT_REJECTION_FIELDS');
  instant(r.recordedAt);requireFundamental(r.recordedAt<=cutoff,'FACT_REJECTION_KNOWLEDGE');
  dateOnly(r.sourcePeriodStart);dateOnly(r.sourcePeriodEnd);
  requireFundamental(r.sourcePeriodStart<=r.sourcePeriodEnd,'FACT_REJECTION_PERIOD');
  [r.observationHash,r.bodyHash].forEach(fundamentalHash);
  const o=rows.find(o=>o.id===r.observationId);
  requireFundamental(o&&o.scope==='REVIEW_CANDIDATE'&&r.status==='REVIEW_CANDIDATE'&&r.approvalReference===null,'FACT_REJECTION_CANDIDATE_ONLY');
  requireFundamental(hash(o)===r.observationHash&&!rejected.has(o.id)&&o.ingestedAt<=r.recordedAt&&o.transformationReferences.includes('document-sha256:'+r.bodyHash)&&r.sourceLocator===o.raw.fieldLocator,'FACT_REJECTION_SOURCE_BINDING');
  requireFundamental(typeof r.sourceCaption==='string'&&r.sourceCaption.trim().length>0&&typeof r.evidenceReference==='string'&&r.evidenceReference.trim().length>0,'FACT_REJECTION_SOURCE_REASON');
  requireFundamental(r.reason==='WRONG_CANONICAL_CAPTION'?r.sourceCaption!==o.raw.label&&r.sourcePeriodStart===o.periodStart&&r.sourcePeriodEnd===o.periodEnd:
   r.reason==='WRONG_SOURCE_COLUMN_PERIOD'&&(r.sourcePeriodStart!==o.periodStart||r.sourcePeriodEnd!==o.periodEnd),'FACT_REJECTION_PROVEN_DEFECT');
  requireFundamental(new Set(r.sourcePageEvidenceHashes).size>=2,'FACT_REJECTION_INDEPENDENT_SOURCE_PROOFS');r.sourcePageEvidenceHashes.forEach(fundamentalHash);
  rejected.add(o.id);
 }
 return rejected;
}
