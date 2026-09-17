import { decimal } from "@/domain/portfolio/values";
import { check, id, keys, list, text, unique } from "./validation";
import { available, type Evidence } from "./evidence";
import type { Sector } from "./methodology";
/** Ordered operand definitions are immutable methodology, never supplied formulas. Ratios are fractions, not percent units. */
export const METRICS = {
  ROIC: ["NOPAT", "average_invested_capital"], ROE: ["normalized_common_profit", "average_common_equity"],
  CFO_CONVERSION: ["cumulative_CFO", "cumulative_normalized_NPAT"], FCF: ["CFO", "issuer_capex"],
  NET_DEBT: ["interest_bearing_debt", "unrestricted_cash"], INTEREST_COVERAGE: ["normalized_EBIT", "net_interest"],
  NPL: ["NPL", "gross_loans"], COVERAGE: ["loan_loss_reserves", "NPL"], CASA: ["current_and_savings", "deposits"],
  FCF_YIELD: ["normalized_FCFE", "market_cap"], EARNINGS_YIELD: ["normalized_EPS", "price"],
  DIVIDEND_YIELD: ["sustainable_DPS", "price"], PB: ["price", "BVPS"], EV_EBIT: ["EV", "normalized_EBIT"],
  MOS: ["conservative_value", "price"], REVENUE_CAGR: ["revenue_end", "revenue_start"], EPS_CAGR: ["adjusted_EPS_end", "adjusted_EPS_start"],
  INCREMENTAL_ROIC: ["change_normalized_NOPAT", "change_invested_capital"], NET_DEBT_EBITDA: ["net_debt", "normalized_EBITDA"],
} as const;
export type MetricId = keyof typeof METRICS;
export interface MetricRequest {
  readonly id: string; readonly metric: MetricId; readonly evidenceRefs: readonly string[];
  readonly years: 3 | 5 | null; readonly comparable: boolean;
  readonly normalization: { readonly kind: "AS_REPORTED" | "NORMALIZED" | "ACTION_ADJUSTED"; readonly rationale: string; readonly evidenceRefs: readonly string[] };
}
function growth(end: string, start: string, years: number) {
  const scale = 1_000_000_000_000n, a = decimal(end).units, b = decimal(start).units;
  check(a > 0n && b > 0n, "CAGR_NOT_MEANINGFUL");
  const target = a * scale ** BigInt(years), n = BigInt(years);
  let lo = 0n, hi = scale;
  while (hi ** n * b <= target) hi *= 2n;
  while (hi - lo > 1n) { const mid = (lo+hi)/2n; if (mid ** n * b <= target) lo = mid; else hi = mid; }
  const twiceMid = (2n*lo+1n) ** n * b, twiceTarget = target * 2n ** n;
  const rounded = lo + (twiceTarget > twiceMid || (twiceTarget === twiceMid && lo % 2n !== 0n) ? 1n : 0n);
  const units = rounded - scale, negative = units < 0n, abs = negative ? -units : units;
  return decimal(`${negative ? "-" : ""}${abs/scale}.${(abs%scale).toString().padStart(12,"0")}`).toString();
}
export function calculateMetrics(requests: readonly MetricRequest[], evidence: readonly Evidence[], sector: Sector, asOf: string, conflicts: readonly string[], cyclical: boolean) {
  list(requests); unique(requests.map(r => r.id));
  return requests.map(r => {
    keys(r,"id metric evidenceRefs years comparable normalization"); id(r.id);
    check(Object.hasOwn(METRICS,r.metric), "UNKNOWN_METRIC"); list(r.evidenceRefs); check(r.evidenceRefs.length === 2, "TWO_ORDERED_OPERANDS_REQUIRED");
    keys(r.normalization,"kind rationale evidenceRefs"); text(r.normalization.rationale); list(r.normalization.evidenceRefs);
    check(["AS_REPORTED","NORMALIZED","ACTION_ADJUSTED"].includes(r.normalization.kind), "INVALID_NORMALIZATION");
    check(typeof r.comparable === "boolean", "COMPARABILITY_REQUIRED");
    check([null,3,5].includes(r.years), "INVALID_YEARS");
    if (sector === "BANK") check(!["CFO_CONVERSION","FCF","NET_DEBT_EBITDA","INTEREST_COVERAGE","ROIC","INCREMENTAL_ROIC"].includes(r.metric),"BANK_METRIC_NOT_EQUIVALENT");
    const refs = [...r.evidenceRefs,...r.normalization.evidenceRefs];
    const missing = refs.filter(ref => !evidence.some(e => e.id === ref && available(e,asOf,conflicts)));
    const operands = r.evidenceRefs.map(ref => evidence.find(e => e.id === ref));
    let value: string | null = null, reason: string | null = null;
    if (missing.length || !r.comparable) reason = "N/R — MISSING_OR_INCOMPARABLE_EVIDENCE";
    else if (cyclical && r.normalization.kind === "AS_REPORTED") reason = "N/R — CYCLE_NORMALIZATION_REQUIRED";
    else {
      const [a,b] = operands as Evidence[];
      check(a.unit !== "TEXT" && a.unit === b.unit, "METRIC_UNIT_MISMATCH");
      if (!["DIVIDEND_YIELD","MOS"].includes(r.metric)) check(a.periodStart === b.periodStart && a.periodEnd === b.periodEnd, "METRIC_PERIOD_MISMATCH");
      const x=decimal(a.value), y=decimal(b.value);
      if (["FCF","NET_DEBT"].includes(r.metric)) value=x.sub(y).toString();
      else if (!y.positive || ((r.metric.endsWith("CAGR") || r.metric === "EARNINGS_YIELD") && !x.positive)) reason="N/R — NONPOSITIVE_DENOMINATOR_OR_EARNINGS";
      else if (r.metric.endsWith("CAGR")) { check(r.years !== null,"CAGR_YEARS_REQUIRED"); value=growth(a.value,b.value,r.years); }
      else if (r.metric === "MOS") { if(x.positive)value=x.sub(y).div(x).toString();else reason="N/R — NONPOSITIVE_INTRINSIC_VALUE"; }
      else value=x.div(y).toString();
    }
    return { ...r, operandDefinitions: METRICS[r.metric], operands, value, unit: ["FCF","NET_DEBT"].includes(r.metric) ? operands[0]?.unit ?? null : "RATIO", missingEvidence: missing, reason };
  });
}
