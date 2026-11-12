import { selectCafefRawCloseValue } from '@/domain/market-boundary/cafef-raw-close';
import { decimal } from '@/domain/portfolio/values';
import { dateOnly, instant } from '@/shared/time';
import type { Evidence } from '@/domain/market-boundary/contracts';

export interface Ref { path: string; sha256: string; pointer?: string; expected?: unknown }
export interface Publication {
  kind: 'DATE_ONLY_CANDIDATE' | 'TIMESTAMP_CANDIDATE' | 'UPDATE_CLUE' | 'MISSING';
  date: string | null; timestamp: string | null; timezone: string | null;
  evidence: Ref | null;
}
export interface Action {
  id: string; ticker: string; kind: string; period: string;
  exDate: string | null; recordDate: string | null; effectiveDate: string | null;
  providerValue: string | null; providerEvidence: Ref;
  official: null | {id: string; ticker: string; kind: string; period: string;
    exDate: string | null; recordDate: string | null; effectiveDate: string | null;
    value: string | null; unit: string; reviewed: boolean; evidence: Ref; definitionSource: Ref; definitionLayout: 'RETAINED_REVIEW_V1' | 'NORMALIZED_EVENT_V1'};
  publication: Publication; retrievedAt: string; reviewedAt: string;
}
export interface ReviewInput {
  schemaVersion: 'vn30-s4-review-input-v1'; sourceMode: 'RETAINED_RESEARCH' | 'SYNTHETIC_TEST'; ticker: string; exchange: string;
  cutoff: string; reviewedAt: string; rawPrice: Record<string, unknown>;
  price: {ticker: string; exchange: string; date: string; rawEvidence: Ref; receiptEvidence: Ref;
    receivedAt: string; sourceUrl: string; sourceBodySha256: string;
    sourceUnit: 'THOUSAND_VND_PER_SHARE' | 'UNKNOWN'; unitEvidence: Evidence | null; unitSource: Ref | null};
  actions: Action[];
  shares: {anchor: Record<string, unknown>; review: Record<string, unknown>; anchorSource: Ref; reviewSource: Ref};
  historicalCoverage: {complete: boolean; limitations: string[]};
  sourceLocations: Ref[];
}
export interface Dependencies {
  assessShares(anchor: Record<string, unknown>, cutoff: string, review: Record<string, unknown>): Record<string, unknown>;
}
function insist(ok: unknown, reason: string): asserts ok { if (!ok) throw new Error('S4_REVIEW:' + reason); }
export function publicationCandidate(p: Publication) {
  if (p.kind === 'MISSING') return {status: 'MISSING_PUBLICATION_EVIDENCE', candidate: p};
  insist(p.evidence && /^[a-f0-9]{64}$/.test(p.evidence.sha256), 'PUBLICATION_SOURCE_REQUIRED');
  if (p.kind === 'DATE_ONLY_CANDIDATE') {
    dateOnly(p.date!); insist(p.timezone && p.timestamp === null, 'DATE_ONLY_TIMEZONE_REQUIRED');
  } else if (p.kind === 'TIMESTAMP_CANDIDATE') instant(p.timestamp!);
  else { insist(p.kind === 'UPDATE_CLUE', 'UNKNOWN_PUBLICATION_KIND'); dateOnly(p.date!); }
  return {status: p.kind === 'UPDATE_CLUE' ? 'RETAINED_UPDATE_CLUE_REQUIRES_SOURCE_ROLE_ASSESSMENT' : 'CANDIDATE_REQUIRES_GOVERNED_QUALIFICATION', candidate: p};
}
/** Offline research orchestration only. It cannot turn caller PASS flags into formal authority. */
export function review(input: ReviewInput, deps: Dependencies) {
  insist(input.schemaVersion === 'vn30-s4-review-input-v1', 'SCHEMA');
  insist(/^[A-Z][A-Z0-9]{1,9}$/.test(input.ticker) && ['HOSE','HNX','UPCOM'].includes(input.exchange), 'IDENTITY');
  insist(['RETAINED_RESEARCH','SYNTHETIC_TEST'].includes(input.sourceMode), 'SOURCE_MODE');
  dateOnly(input.cutoff); insist(Number.isFinite(Date.parse(input.reviewedAt)), 'REVIEW_TIME');
  const p = input.price;
  insist(Number.isFinite(Date.parse(p.receivedAt)) && Date.parse(p.receivedAt) <= Date.parse(input.reviewedAt), 'PRICE_RECEIPT_AFTER_REVIEW');
  insist(p.ticker === input.ticker && p.exchange === input.exchange && p.date === input.cutoff, 'PRICE_SCOPE');
  if (p.unitEvidence) insist(Date.parse(p.unitEvidence.knownAt) <= Date.parse(input.reviewedAt), 'UNIT_EVIDENCE_AFTER_REVIEW');
  insist(input.rawPrice.Symbol === input.ticker, 'CROSS_TICKER_PRICE');
  insist(input.shares.anchor.ticker === input.ticker && input.shares.review.ticker === input.ticker, 'CROSS_TICKER_SHARES');
  insist(input.actions.every(a => a.ticker === input.ticker && (!a.official || a.official.ticker === input.ticker)), 'CROSS_TICKER_ACTION');
  insist(new Set(input.actions.map(a => a.id)).size === input.actions.length, 'DUPLICATE_ACTION_ID');
  insist(!input.historicalCoverage.complete ? input.historicalCoverage.limitations.length > 0 : true, 'COVERAGE_LIMITATION_REQUIRED');
  let price: {status: string; value: string | null; reason: string | null};
  try {
    insist(p.sourceUnit === 'THOUSAND_VND_PER_SHARE' && p.unitEvidence && p.unitSource, 'UNIT_EVIDENCE_MISSING');
    price = {status: 'RESEARCH_QUALIFIED', value: selectCafefRawCloseValue(input.rawPrice,
    {ticker: input.ticker, tradingDate: input.cutoff, sourceUnit: p.sourceUnit, unitEvidence: p.unitEvidence}), reason: null}; }
  catch (error) { price = {status: 'NOT_QUALIFIED', value: null, reason: String(error)}; }
  const actions = [...input.actions].sort((a,b) => a.id.localeCompare(b.id, 'en')).map(a => {
    [a.exDate,a.recordDate,a.effectiveDate].filter((s): s is string => s !== null).forEach(dateOnly);
    insist(Number.isFinite(Date.parse(a.retrievedAt)) && Number.isFinite(Date.parse(a.reviewedAt)) &&
      Date.parse(a.retrievedAt) <= Date.parse(input.reviewedAt) && Date.parse(a.reviewedAt) <= Date.parse(input.reviewedAt), 'ACTION_TIME');
    const o = a.official;
    const sameDefinition = o && o.id === a.id && o.kind === a.kind && o.period === a.period &&
      o.exDate === a.exDate && o.recordDate === a.recordDate && o.effectiveDate === a.effectiveDate;
    const cash = a.kind === 'CASH_DIVIDEND';
    let valid = !!sameDefinition && o!.reviewed && o!.value !== null &&
      ['CASH_DIVIDEND','STOCK_DIVIDEND','BONUS','ISSUANCE','CANCELLATION','SPLIT','CONSOLIDATION','TREASURY'].includes(a.kind);
    if (valid && !cash) {
      try { const n = decimal(o!.value!); valid = o!.unit === 'SHARES' ? !n.negative && n.integer : o!.unit === 'RATIO' && n.positive; }
      catch { valid = false; }
    }
    if (valid && cash) {
      try { valid = o!.unit === 'VND_PER_SHARE' && /^\d+(\.\d+)?$/.test(o!.value!) && !decimal(o!.value!).negative; }
      catch { valid = false; }
    }
    return {id: a.id, kind: a.kind, period: a.period, status: valid ? 'RESEARCH_RECONCILED' : 'NOT_QUALIFIED',
      selectedValue: valid ? o!.value : null, unit: valid ? o!.unit : null,
      providerValue: a.providerValue, conflictingObservation: a.providerValue !== o?.value,
      conflictResolution: valid ? 'REVIEWED_SAME_EVENT_DEFINITION_OFFICIAL_EVIDENCE' : 'UNRESOLVED_OR_MISSING_OFFICIAL_EVIDENCE',
      exDate: a.exDate, recordDate: a.recordDate, effectiveDate: a.effectiveDate,
      effectiveByCutoff: a.effectiveDate === null ? null : a.effectiveDate <= input.cutoff,
      official: o, providerEvidence: a.providerEvidence, publication: publicationCandidate(a.publication),
      retrievedAt: a.retrievedAt, reviewedAt: a.reviewedAt};
  });
  // Route observed capital changes to the existing evaluator; an omitted share-review
  // event must not hide a change found in the separately reviewed action list.
  const projected = actions.filter(a => a.kind !== 'CASH_DIVIDEND').map(a => ({
    id: 'skill-action:' + a.id, ticker: input.ticker,
    sourceReference: a.official?.evidence.path ?? a.providerEvidence.path,
    affectsOutstanding: a.kind === 'UNKNOWN' ? null : true,
    effectiveDate: a.effectiveDate,
    status: a.status === 'RESEARCH_RECONCILED' ? 'CONFIRMED' : 'POTENTIAL',
  }));
  const shares = deps.assessShares(input.shares.anchor, input.cutoff, {...input.shares.review,
    events: [...(input.shares.review.events as unknown[]), ...projected]});
  const ready = price.status === 'RESEARCH_QUALIFIED' && actions.every(a => a.status === 'RESEARCH_RECONCILED') &&
    shares.status === 'CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS';
  return {schemaVersion: 'vn30-s4-research-output-v1', ticker: input.ticker, exchange: input.exchange, sourceMode: input.sourceMode,
    economicDate: input.cutoff, reviewedAt: input.reviewedAt, price: {...price, field: 'GiaDongCua',
      unit: 'VND_PER_SHARE', sourceUnit: p.sourceUnit, originalReceipt: p.receivedAt, sourceUrl: p.sourceUrl,
      rawEvidence: p.rawEvidence, sourceBodySha256: p.sourceBodySha256, unitSource: p.unitSource,
      publicationDate: null, observedAtInstant: null},
    actions, shares, historicalCoverage: input.historicalCoverage,
    acceptance: {research: ready ? (input.sourceMode === 'SYNTHETIC_TEST' ? 'SYNTHETIC_TEST_ONLY' : 'READY_FOR_OWNER_ADMISSION') : 'PARTIAL_NOT_QUALIFIED',
      R1: shares.acceptance, R3: 'RESTRICTED_TO_HISTORICAL_COMPLETENESS', R4: 'CLOSED_BY_SCOPE_EXCLUSION',
      adjustedPriceSeries: 'EXCLUDED_BY_OWNER_POLICY', formal: 'NOT_ASSESSED_BY_OFFLINE_REVIEW',
      F1: 'EXISTING_MARKET_AUTHORITY_ACCEPTANCE_REQUIRED', F2: 'PER_FACT_GOVERNED_TIME_RUN_BINDING_REQUIRED',
      PIT: 'NOT_QUALIFIED_BY_THIS_REVIEW', historicalTotalReturn: 'NOT_QUALIFIED_BY_THIS_REVIEW',
      productionActivated: false, formalAdmissionGranted: false, ownerApproval: null},
    sourceLocations: input.sourceLocations};
}
