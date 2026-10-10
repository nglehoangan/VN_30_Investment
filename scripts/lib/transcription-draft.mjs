import {createHash} from 'node:crypto';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const requireDraft = (condition, code) => { if (!condition) throw new Error(code); };

/** Offline aid only. Deliberately incompatible with StatementExtract and canonical scopes. */
export function transcriptionDraft(document, rows = []) {
  requireDraft(document && /^[a-f0-9]{64}$/.test(document.documentId) && /^[a-f0-9]{64}$/.test(document.bodyHash), 'VERIFIED_DOCUMENT_REQUIRED');
  requireDraft(Array.isArray(document.captureIds) && document.captureIds.length > 0 &&
    new Set(document.captureIds).size === document.captureIds.length && document.sourceVersionId && document.importExecutionId,
  'RAW_LINEAGE_REQUIRED');
  requireDraft(Array.isArray(rows), 'ROWS_REQUIRED');
  for (const row of rows) {
    requireDraft(Object.keys(row).sort().join(' ') === 'currency lexicalValue method pageReference periodEnd periodReference periodStart periodType reportingScope scale scopeReference sourceCaption unit unitReference', 'EXACT_DRAFT_ROW_REQUIRED');
    requireDraft(row.lexicalValue === null || typeof row.lexicalValue === 'string', 'LEXICAL_STRING_OR_NULL_REQUIRED');
    requireDraft(typeof row.sourceCaption === 'string' && row.sourceCaption.trim() && /^page:[1-9][0-9]*(?:\/[^\s]+)?$/.test(row.pageReference), 'PAGE_CONTENT_EVIDENCE_REQUIRED');
    requireDraft(['TEXT_EXTRACTION_AID','OCR_AID','UNREVIEWED_TRANSCRIPTION'].includes(row.method), 'AID_METHOD_REQUIRED');
    for (const key of ['unitReference','periodReference','scopeReference']) {
      requireDraft(row[key] === null || /^page:[1-9][0-9]*(?:\/[^\s]+)?$/.test(row[key]), 'CONTENT_LOCATOR_REQUIRED');
    }
    requireDraft(row.scale === null || typeof row.scale === 'string' && /^(?:1|1000|1000000|1000000000|0\.01)$/.test(row.scale), 'DECLARED_SCALE_REQUIRED');
    requireDraft(row.currency === null || typeof row.currency === 'string' && /^[A-Z]{3}$/.test(row.currency), 'DECLARED_CURRENCY_REQUIRED');
    requireDraft(row.unit === null || ['CURRENCY','SHARES','RATIO','CURRENCY_PER_SHARE'].includes(row.unit), 'DECLARED_UNIT_REQUIRED');
    requireDraft(row.reportingScope === null || ['CONSOLIDATED','SEPARATE_STANDALONE'].includes(row.reportingScope), 'DECLARED_SCOPE_REQUIRED');
    requireDraft(row.periodType === null || ['QUARTER','YTD','ANNUAL','INSTANT'].includes(row.periodType), 'DECLARED_PERIOD_REQUIRED');
    for (const key of ['periodStart','periodEnd']) requireDraft(row[key] === null || typeof row[key] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row[key]) && !Number.isNaN(Date.parse(row[key])) && new Date(row[key]).toISOString().slice(0,10) === row[key], 'VALID_DATE_REQUIRED');
    requireDraft(row.periodStart === null || row.periodEnd === null || row.periodStart <= row.periodEnd, 'ORDERED_PERIOD_REQUIRED');
  }
  const draft = {schemaVersion:1,kind:'UNREVIEWED_TRANSCRIPTION_AID',status:'BLOCKED',
    document:{documentId:document.documentId,bodyHash:document.bodyHash,sourceVersionId:document.sourceVersionId,
      importExecutionId:document.importExecutionId,captureIds:[...document.captureIds],retrievedAt:document.retrievedAt,ingestedAt:document.ingestedAt},
    qualificationId:null,securityId:null,sector:null,reviewerReference:null,reviewedAt:null,
    canonicalAdmissionPermitted:false,rows:structuredClone(rows),
    blockers:['OFFICIAL_SECURITY_SECTOR_REQUIRED','SLICE_02_CONTENT_QUALIFICATION_REQUIRED','GENUINE_REVIEWED_TRANSCRIPTION_REQUIRED','EXACT_APPROVED_REGISTRY_MAPPING_REQUIRED']};
  return {...draft,draftHash:hash(draft)};
}

/** Include every research candidate, including missing ones; never assert official membership. */
export function researchReadiness(sources, documents) {
  requireDraft(Array.isArray(sources) && new Set(sources.map(s => s.ticker)).size === sources.length, 'DUPLICATE_RESEARCH_TICKER');
  return sources.filter(s => s.scope === 'research_basket').map(s => ({ticker:s.ticker,securityId:null,sector:null,
    officialMembershipStatus:'UNKNOWN',denominatorBasis:'RESEARCH_CANDIDATES_ONLY',
    reportingWindow:{start:'2025-01-01',end:'2026-06-30'},requiredPeriods:['2025-Q1','2025-Q2','2025-Q3','2025-Q4','2025-FY','2026-Q1','2026-Q2'],
    rawPdfReceipts:documents.filter(d => d.researchTicker === s.ticker).length,
    qualifiedDocuments:0,canonicalItems:0,normalizations:0,derivedMetrics:0,availabilityAssessments:0,
    marketCoverage:'UNKNOWN',valuationCoverage:'UNKNOWN',freshness:'NOT_EVALUATED',conflicts:'NOT_EVALUATED',
    dataReady:false,readyForScoring:false,
    blockers:['OFFICIAL_MEMBERSHIP_SECURITY_SECTOR_MISSING','QUALIFICATION_AND_GOVERNED_MAPPING_MISSING','CANONICAL_PIT_MARKET_VALUATION_SNAPSHOT_MISSING','INDEPENDENT_DI_REVIEW_MISSING']}));
}
