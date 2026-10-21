import type { Assessment } from '@/domain/scoring/scorecard';
import { RUBRICS, VERSION } from '@/domain/scoring/methodology';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { instant } from '@/shared/time';
import { fundamentalHash, requireFundamental } from './validation';

export type ReviewStatus = 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'INVALIDATED';
export interface AssessmentContext {
  readonly securityId:string; readonly rubricId:string; readonly asOf:string; readonly methodologyHash:string;
  readonly executableHash:string; readonly evidenceHashes:readonly string[]; readonly derivationHashes:readonly string[];
  readonly sectorContextHash:string; readonly marketHash:string; readonly invalidationTriggers:readonly string[];
  readonly validThrough:string;
}
export interface HumanReviewRecord {
  readonly id:string; readonly context:AssessmentContext; readonly status:ReviewStatus;
  readonly assessment:Assessment|null; readonly draft:{readonly label:'UNTRUSTED_ANALYST_DRAFT';readonly text:string}|null;
  readonly actor:string; readonly authenticatedSessionReference:string; readonly at:string;
  readonly previousHash:string|null; readonly contentHash:string;
}
export function validateReviewContext(c:AssessmentContext) {
  [c.asOf,c.validThrough].forEach(instant);
  requireFundamental(c.validThrough>=c.asOf && c.securityId.trim() && RUBRICS.some(r=>r.id===c.rubricId), 'REVIEW_CONTEXT');
  [c.methodologyHash,c.executableHash,c.sectorContextHash,c.marketHash,...c.evidenceHashes,...c.derivationHashes].forEach(fundamentalHash);
  requireFundamental(c.evidenceHashes.length>0 && new Set(c.evidenceHashes).size===c.evidenceHashes.length && new Set(c.derivationHashes).size===c.derivationHashes.length && c.invalidationTriggers.length>0, 'REVIEW_DEPENDENCIES_REQUIRED');
}
export function validateHumanSelection(a:Assessment,c:AssessmentContext,actor:string,at:string) {
  validateReviewContext(c); instant(a.assessedAt); instant(at);
  const rubric=RUBRICS.find(r=>r.id===c.rubricId)!,band=rubric.bands.find(b=>b.label===a.assessment);
  requireFundamental(a.source==='HUMAN' && a.analyst===actor && a.methodologyVersion===VERSION && a.subcategory===c.rubricId &&
    a.assessedAt<=at && band && Number.isInteger(a.selectedPoints) && a.selectedPoints>=band.min && a.selectedPoints<=band.max, 'EXPLICIT_AUTHENTICATED_HUMAN_SELECTION_REQUIRED');
  requireFundamental([a.rationale,a.sectorRationale,a.economicChannel].every(t=>typeof t==='string'&&t.trim()) &&
    a.evidence.length>0 && a.evidence.every(e=>rubric.topics.includes(e.topic)&&e.refs.length>0&&e.rationale.trim()), 'HUMAN_SELECTION_EVIDENCE_REQUIRED');
  requireFundamental(a.selectedPoints!==rubric.max || a.maximumPrerequisitesMet && a.strongerEvidence && a.disconfirmingEvidence.length>0 && a.exceptionalJustification?.trim(), 'HUMAN_MAXIMUM_PREREQUISITES_REQUIRED');
}
/** Eligibility only, never automatic reuse or rolling an owner gate to a new asOf. */
export function assessmentReuseCandidate(r:HumanReviewRecord,current:AssessmentContext,at:string,hash:(v:unknown)=>string) {
  validateReviewContext(current);instant(at);
  const reasons:string[]=[];
  if(r.status!=='APPROVED'||!r.assessment)reasons.push('PRIOR_REVIEW_NOT_APPROVED');
  const {contentHash,...body}=r;if(hash(body)!==contentHash)reasons.push('REVIEW_HASH_MISMATCH');
  const fields=['securityId','rubricId','methodologyHash','executableHash','evidenceHashes','derivationHashes','sectorContextHash','marketHash','invalidationTriggers','asOf','validThrough'] as const;
  for(const field of fields)if(hash(r.context[field])!==hash(current[field]))reasons.push('DEPENDENCY_CHANGED:'+field);
  if(r.context.validThrough<at||r.at>at)reasons.push('REVIEW_EXPIRED_OR_FUTURE');
  return deepFreeze({eligibleForOwnerReview:reasons.length===0,automaticReuseAuthorized:false as const,reasons,assessmentHash:contentHash});
}
