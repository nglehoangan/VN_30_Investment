import policy from './cafef-raw-close-policy.json';
import type { Evidence, Observation, RawSource } from './contracts';
import { decimal } from '@/domain/portfolio/values';
import { dateOnly, instant } from '@/shared/time';

export const CAFE_F_RAW_CLOSE_POLICY = Object.freeze(policy);
export const isCafefMarketSource = (sourceId: string) => sourceId.toLowerCase().startsWith('cafef');
function requireCafef(ok: unknown, reason: string): asserts ok {
  if (!ok) throw new Error('CAFEF_RAW_CLOSE_ONLY:' + reason);
}
function proof(value: Evidence | null): value is Evidence {
  if (!value || !value.id.trim() || !/^[a-f0-9]{64}$/.test(value.hash)) return false;
  try { instant(value.knownAt); instant(value.effectiveAt); return true; } catch { return false; }
}

export interface CafefRawCloseProfile {
  readonly securityId: string;
  readonly ticker: string;
  readonly exchange: string;
  readonly tradingDate: string;
  readonly observedAt: string;
  readonly session: string;
  readonly sourceUnit: 'THOUSAND_VND_PER_SHARE';
  readonly unitEvidence: Evidence;
  readonly corporateActionPolicy: Evidence;
  /** Pointer to the provider row in the pinned raw response, not a selected-value copy. */
  readonly rowPointer: string;
}

/** Calculation boundary only: does not fetch, mutate source data, admit a source or activate runtime. */
export function normalizeCafefRawClose(raw: unknown, source: RawSource, profile: CafefRawCloseProfile): Observation {
  requireCafef(raw !== null && typeof raw === 'object' && !Array.isArray(raw), 'ROW_REQUIRED');
  requireCafef(isCafefMarketSource(source.sourceId), 'PROVIDER_IDENTITY_REQUIRED');
  requireCafef(profile.sourceUnit === policy.sourceUnit && proof(profile.unitEvidence), 'EXPLICIT_UNIT_EVIDENCE_REQUIRED');
  requireCafef(proof(profile.corporateActionPolicy), 'CORPORATE_ACTION_POLICY_REFERENCE_REQUIRED');
  requireCafef(profile.securityId.trim() && profile.ticker.trim() && profile.exchange.trim() && profile.session.trim(), 'IDENTITY_REQUIRED');
  requireCafef(/^[a-f0-9]{64}$/.test(source.hash) && source.id.trim() && source.rawPath.trim(), 'SOURCE_PIN_REQUIRED');
  requireCafef(/^\/(?:[^/~]|~[01])+(?:\/(?:[^/~]|~[01])+)*$/.test(profile.rowPointer), 'ROW_POINTER_REQUIRED');
  dateOnly(profile.tradingDate); instant(profile.observedAt); instant(source.retrievedAt);
  requireCafef(profile.observedAt <= source.retrievedAt && profile.observedAt.slice(0,10) === profile.tradingDate, 'PRICE_TIME_MISMATCH');
  const row = raw as Record<string, unknown>;
  requireCafef(row.Symbol === profile.ticker, 'TICKER_MISMATCH');
  const date = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(row.Ngay));
  requireCafef(date && dateOnly(`${date[3]}-${date[2]}-${date[1]}`) === profile.tradingDate, 'TRADING_DATE_MISMATCH');
  // No adjusted-field lookup, inferred dividend or fallback is permitted here.
  const close = row.GiaDongCua;
  requireCafef((typeof close === 'string' && /^(0|[1-9]\d*)(\.\d+)?$/.test(close)) ||
    (typeof close === 'number' && Number.isFinite(close)), 'RAW_CLOSE_REQUIRED_NO_FALLBACK');
  const value = decimal(String(close));
  requireCafef(value.positive, 'POSITIVE_RAW_CLOSE_REQUIRED');
  return Object.freeze({
    securityId: profile.securityId, ticker: profile.ticker, exchange: profile.exchange,
    value: value.mul(decimal(policy.multiplier)).toString(), currency: 'VND', unit: 'VND_PER_SHARE',
    field: 'CLOSE', adjustment: 'RAW', corporateActions: profile.corporateActionPolicy,
    tradingDate: profile.tradingDate, session: profile.session, observedAt: profile.observedAt,
    availableAt: source.retrievedAt, source: {id: source.id, hash: source.hash},
    pointer: profile.rowPointer + '/' + policy.eligibleCloseField, conflict: 'MATCH',
  });
}

/** All purposes use this guard, including valuation/scoring/portfolio analytics. Other providers keep their policies. */
export function assertCafefCalculationObservation(observation: Observation, sourceId: string): void {
  if (!isCafefMarketSource(sourceId)) return;
  requireCafef(observation.field === 'CLOSE' && observation.adjustment === 'RAW' &&
    observation.pointer.endsWith('/' + policy.eligibleCloseField), 'ADJUSTED_OR_FALLBACK_CLOSE_FORBIDDEN');
  requireCafef(observation.currency === 'VND' && observation.unit === 'VND_PER_SHARE', 'NORMALIZED_VND_UNIT_REQUIRED');
}

export interface CafefActionRegister {
  readonly ticker: string; readonly from: string; readonly through: string;
  readonly status: 'VERIFIED_COMPLETE' | 'INCOMPLETE' | 'UNKNOWN';
  readonly evidence: Evidence | null;
  readonly events: readonly {
    readonly id: string; readonly date: string; readonly verified: boolean;
    readonly evidence: Evidence | null;
  }[];
}
export interface CafefHistoricalUse {
  readonly purpose: 'HISTORICAL_TOTAL_RETURN' | 'BACKTEST';
  readonly ticker: string; readonly from: string; readonly through: string;
  readonly prices: readonly Observation[];
  readonly sourceId: string;
  readonly expectedSessions: readonly string[] | null;
  readonly calendarEvidence: Evidence | null;
  readonly corporateActions: CafefActionRegister;
  readonly pointInTimeEvidence: Evidence | null;
}
type HistoricalQualification =
  | {readonly status: 'NOT_QUALIFIED'; readonly reason: string; readonly returnValue: null}
  | {readonly status: 'QUALIFIED_INPUTS_ONLY'; readonly prices: readonly Observation[];
      readonly corporateActions: CafefActionRegister; readonly returnValue: null};

/** Input gate, not a new return/backtest model or authority decision. Actions stay separate from prices. */
export function qualifyCafefHistoricalUse(input: CafefHistoricalUse): HistoricalQualification {
  const fail = (reason: string): HistoricalQualification => ({status: 'NOT_QUALIFIED', reason, returnValue: null});
  try {
    dateOnly(input.from); dateOnly(input.through);
    if (!['HISTORICAL_TOTAL_RETURN','BACKTEST'].includes(input.purpose) || input.from > input.through ||
        !isCafefMarketSource(input.sourceId)) return fail('INVALID_SCOPE');
    const actions = input.corporateActions;
    if (actions.status !== 'VERIFIED_COMPLETE' || !proof(actions.evidence) || actions.ticker !== input.ticker ||
        actions.from > input.from || actions.through < input.through) return fail('CORPORATE_ACTION_EVIDENCE_INCOMPLETE');
    dateOnly(actions.from); dateOnly(actions.through);
    const actionIds = new Set<string>();
    for (const action of actions.events) {
      dateOnly(action.date);
      if (!action.id.trim() || actionIds.has(action.id) || !action.verified || !proof(action.evidence) ||
          action.date < input.from || action.date > input.through) return fail('CORPORATE_ACTION_EVIDENCE_INCOMPLETE');
      actionIds.add(action.id);
    }
    if (!proof(input.calendarEvidence) || !input.expectedSessions?.length) return fail('SESSION_COVERAGE_NOT_VERIFIED');
    const expected = [...input.expectedSessions].sort();
    if (new Set(expected).size !== expected.length || expected.some(day => day < input.from || day > input.through)) return fail('INVALID_EXPECTED_SESSIONS');
    expected.forEach(dateOnly);
    const actual = input.prices.map(price => {
      assertCafefCalculationObservation(price,input.sourceId);
      requireCafef(price.ticker === input.ticker && decimal(price.value).positive, 'PRICE_SCOPE_OR_VALUE');
      dateOnly(price.tradingDate); return price.tradingDate;
    }).sort();
    if (JSON.stringify(expected) !== JSON.stringify(actual)) return fail('RAW_PRICE_SESSION_GAP_OR_DUPLICATE');
    if (input.purpose === 'BACKTEST' && !proof(input.pointInTimeEvidence)) return fail('POINT_IN_TIME_NOT_QUALIFIED');
    return {status: 'QUALIFIED_INPUTS_ONLY', prices: input.prices, corporateActions: actions, returnValue: null};
  } catch { return fail('INVALID_RAW_PRICE_OR_ACTION_EVIDENCE'); }
}
