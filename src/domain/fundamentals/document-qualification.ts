import type { SecurityId } from '@/domain/portfolio/values';
import { securityId } from '@/domain/portfolio/values';
import type { ReportingScope } from './contracts';
import { fundamentalId, fundamentalHash, requireFundamental } from './validation';
import { dateOnly, instant } from '@/shared/time';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { snapshot } from '@/domain/scoring/validation';

export type DocumentQualificationStatus = 'UNQUALIFIED' | 'QUALIFIED' | 'REJECTED' | 'CONFLICTED';
/** A reference to existing Security/issuer ownership, not another security master. */
export interface DocumentIssuerIdentity {
  readonly securityId: SecurityId;
  readonly ticker: string;
  readonly issuerReference: string;
}
export interface DocumentPeriod {
  readonly start: string; readonly end: string;
  readonly type: 'QUARTER' | 'YTD' | 'ANNUAL';
  readonly fiscalYear: number; readonly fiscalQuarter: 1 | 2 | 3 | 4 | null;
  readonly calendarReference: string;
}
declare const verifiedDocumentBrand: unique symbol;
export interface VerifiedRawDocument {
  readonly [verifiedDocumentBrand]: true;
  readonly documentId: string; readonly bodyHash: string; readonly sourceVersionId: string;
  readonly importExecutionId: string; readonly captureIds: readonly string[];
  readonly resourceReference: string; readonly retrievedAt: string; readonly ingestedAt: string;
  readonly bodyBase64: string;
}
export interface DocumentQualification {
  readonly id: string; readonly documentId: string; readonly bodyHash: string;
  readonly sourceVersionId: string; readonly importExecutionId: string; readonly captureIds: readonly string[];
  readonly intendedIssuer: DocumentIssuerIdentity;
  readonly evidencedIssuer: DocumentIssuerIdentity | null;
  readonly documentType: 'FINANCIAL_STATEMENTS' | 'OTHER' | null;
  readonly period: DocumentPeriod | null; readonly reportingScope: ReportingScope | null;
  readonly status: DocumentQualificationStatus;
  readonly method: 'DOCUMENT_CONTENT_REVIEW' | 'NOT_REVIEWED';
  readonly evidence: readonly { readonly dimension: 'ISSUER_IDENTITY' | 'DOCUMENT_TYPE' | 'REPORTING_PERIOD' | 'REPORTING_SCOPE';
    readonly reference: string; readonly locator: string; readonly bodyHash: string }[];
  readonly reviewedAt: string; readonly reviewerReference: string | null; readonly policyVersion: string;
  readonly supersedesQualificationId: string | null; readonly correctionReason: string | null;
}

function fields(value: object, names: string) {
  requireFundamental(value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join(' ') === names.split(' ').sort().join(' '), 'DOCUMENT_EXACT_FIELDS');
}
function reference(value: string) {
  requireFundamental(typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= 4000 &&
    !/[\x00-\x1f<>?@#]/.test(value) && !/bearer\s|token\s*=|api[_-]?key\s*=/i.test(value), 'DOCUMENT_REFERENCE_REQUIRED');
}
function issuer(value: DocumentIssuerIdentity) {
  fields(value,'securityId ticker issuerReference'); securityId(value.securityId); reference(value.issuerReference);
  requireFundamental(/^[A-Z0-9]{1,20}$/.test(value.ticker),'DOCUMENT_TICKER_REQUIRED');
}
export function sameIssuer(a: DocumentIssuerIdentity, b: DocumentIssuerIdentity) {
  return a.securityId === b.securityId && a.ticker === b.ticker && a.issuerReference === b.issuerReference;
}
export function validateDocumentQualification(raw: DocumentQualification): DocumentQualification {
  const q = snapshot(raw);
  fields(q,'id documentId bodyHash sourceVersionId importExecutionId captureIds intendedIssuer evidencedIssuer documentType period reportingScope status method evidence reviewedAt reviewerReference policyVersion supersedesQualificationId correctionReason');
  [q.id,q.sourceVersionId,q.importExecutionId,q.policyVersion].forEach(fundamentalId);
  fundamentalHash(q.documentId); fundamentalHash(q.bodyHash); issuer(q.intendedIssuer);
  requireFundamental(Array.isArray(q.captureIds) && q.captureIds.length > 0 && q.captureIds.length <= 64 &&
    new Set(q.captureIds).size === q.captureIds.length,'DOCUMENT_CAPTURE_IDS');
  q.captureIds.forEach(fundamentalId); instant(q.reviewedAt);
  requireFundamental(['UNQUALIFIED','QUALIFIED','REJECTED','CONFLICTED'].includes(q.status),'DOCUMENT_STATUS');
  requireFundamental(['DOCUMENT_CONTENT_REVIEW','NOT_REVIEWED'].includes(q.method),'DOCUMENT_METHOD');
  requireFundamental([null,'FINANCIAL_STATEMENTS','OTHER'].includes(q.documentType),'DOCUMENT_TYPE');
  requireFundamental([null,'CONSOLIDATED','SEPARATE_STANDALONE'].includes(q.reportingScope),'DOCUMENT_SCOPE');
  if (q.evidencedIssuer !== null) issuer(q.evidencedIssuer);
  if (q.period !== null) {
    const p = q.period;
    fields(p,'start end type fiscalYear fiscalQuarter calendarReference');
    dateOnly(p.start); dateOnly(p.end); reference(p.calendarReference);
    requireFundamental(p.start <= p.end && ['QUARTER','YTD','ANNUAL'].includes(p.type) &&
      Number.isInteger(p.fiscalYear) && p.fiscalYear >= 1900 && p.fiscalYear <= 9999 &&
      (p.type === 'ANNUAL' ? p.fiscalQuarter === null : [1,2,3,4].includes(p.fiscalQuarter!)), 'DOCUMENT_PERIOD');
  }
  requireFundamental(Array.isArray(q.evidence) && q.evidence.length <= 100, 'DOCUMENT_EVIDENCE');
  for (const e of q.evidence) {
    fields(e,'dimension reference locator bodyHash'); reference(e.reference); reference(e.locator); fundamentalHash(e.bodyHash);
    requireFundamental(['ISSUER_IDENTITY','DOCUMENT_TYPE','REPORTING_PERIOD','REPORTING_SCOPE'].includes(e.dimension) &&
      /^page:[1-9][0-9]{0,4}(?:\/[A-Za-z0-9_:-]+)?$/.test(e.locator),'DOCUMENT_CONTENT_LOCATOR_REQUIRED');
    requireFundamental(e.bodyHash === q.bodyHash,'DOCUMENT_EVIDENCE_HASH_MISMATCH');
  }
  if (q.reviewerReference !== null) reference(q.reviewerReference);
  if (q.supersedesQualificationId !== null) fundamentalId(q.supersedesQualificationId);
  if (q.correctionReason !== null) reference(q.correctionReason);
  requireFundamental((q.supersedesQualificationId !== null) === (q.correctionReason !== null) &&
    q.supersedesQualificationId !== q.id,'DOCUMENT_CORRECTION_LINEAGE');
  if (q.status === 'QUALIFIED') {
    requireFundamental(q.method === 'DOCUMENT_CONTENT_REVIEW' && q.reviewerReference !== null && q.evidence.length > 0 &&
      q.documentType === 'FINANCIAL_STATEMENTS' && q.period !== null && q.reportingScope !== null &&
      q.evidencedIssuer !== null && sameIssuer(q.intendedIssuer,q.evidencedIssuer),'DOCUMENT_IDENTITY_NOT_QUALIFIED');
    requireFundamental(new Set(q.evidence.map(e => e.dimension)).size === 4,'DOCUMENT_ALL_IDENTITY_EVIDENCE_REQUIRED');
  }
  return deepFreeze(q);
}

/** History is an explicit single chain; dates/filenames never choose a favorable record. */
export function qualificationHead(history: readonly DocumentQualification[]): DocumentQualification | null {
  if (!history.length) return null;
  const records = history.map(validateDocumentQualification);
  requireFundamental(new Set(records.map(q => q.id)).size === records.length,'DOCUMENT_DUPLICATE_QUALIFICATION');
  const root = records.filter(q => q.supersedesQualificationId === null);
  requireFundamental(root.length === 1,'DOCUMENT_AMBIGUOUS_HISTORY');
  let head = root[0], visited = 1;
  while (true) {
    const next = records.filter(q => q.supersedesQualificationId === head.id);
    requireFundamental(next.length <= 1,'DOCUMENT_QUALIFICATION_FORK');
    if (!next.length) break;
    const q = next[0];
    requireFundamental(q.documentId === head.documentId && q.bodyHash === head.bodyHash &&
      q.sourceVersionId === head.sourceVersionId && q.importExecutionId === head.importExecutionId &&
      JSON.stringify(q.captureIds) === JSON.stringify(head.captureIds) && sameIssuer(q.intendedIssuer,head.intendedIssuer) &&
      q.reviewedAt >= head.reviewedAt,'DOCUMENT_CORRECTION_MISMATCH');
    head = q; visited++;
    requireFundamental(visited <= records.length,'DOCUMENT_QUALIFICATION_CYCLE');
  }
  requireFundamental(visited === records.length,'DOCUMENT_DISCONNECTED_HISTORY');
  return head;
}

export function documentQualificationStatus(history: readonly DocumentQualification[]): DocumentQualificationStatus {
  return qualificationHead(history)?.status ?? 'UNQUALIFIED';
}

declare const candidateBrand: unique symbol;
/** Future Slice 3 must accept this gate result, never FundamentalRawCapture. */
export type QualifiedNormalizationCandidate = Readonly<{
  rawDocument: VerifiedRawDocument; qualification: DocumentQualification;
  readonly [candidateBrand]: true;
}>;
export function requireQualifiedDocument(rawDocument: VerifiedRawDocument, history: readonly DocumentQualification[],
  intendedIssuer: DocumentIssuerIdentity): QualifiedNormalizationCandidate {
  issuer(intendedIssuer);
  const q = qualificationHead(history);
  requireFundamental(q !== null && q.status === 'QUALIFIED','DOCUMENT_UNQUALIFIED');
  requireFundamental(q!.documentId === rawDocument.documentId && q!.bodyHash === rawDocument.bodyHash &&
    q!.sourceVersionId === rawDocument.sourceVersionId && q!.importExecutionId === rawDocument.importExecutionId &&
    JSON.stringify(q!.captureIds) === JSON.stringify(rawDocument.captureIds) && sameIssuer(q!.intendedIssuer,intendedIssuer) &&
    q!.reviewedAt >= rawDocument.ingestedAt,'DOCUMENT_QUALIFICATION_BINDING');
  return deepFreeze({rawDocument,qualification:q!}) as QualifiedNormalizationCandidate;
}
