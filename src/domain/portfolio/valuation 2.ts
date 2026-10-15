import { instant, type Instant } from "@/shared/time";
import { Decimal, decimal, price, requireRule } from "./values";
import type { PortfolioState } from "./reconstruct";
import { deepFreeze } from "./transaction";
/** Absolute VND accounting/valuation NAV bridge, not an investment return measure.
 * Not TWR, CAGR, XIRR, annualized or benchmark-relative return, and not evidence
 * of achieving the 15–20% annual investment objective.
 */
export const NAV_BRIDGE_SEMANTICS = Object.freeze({ kind: "ACCOUNTING_VALUATION_NAV_BRIDGE", unit: "VND",
  scope: "SINCE_SUPPORTED_INCEPTION", isInvestmentReturn: false, provesAnnualInvestmentObjective: false } as const);
export interface PriceObservation {
  readonly id: string; readonly securityId: string; readonly price: string; readonly currency: "VND";
  readonly observedAt: Instant; readonly receivedAt: Instant; readonly validThrough: Instant; readonly sourceReference: string;
}
export interface ValuationInputs { readonly version: string; readonly methodologyId: string; readonly observations: readonly PriceObservation[] }
/** Reproducible derived evidence, never an editable accounting balance. */
export interface InceptionBaseline {
  readonly portfolioId: string; readonly asOf: Instant; readonly ledgerWatermark: string;
  readonly kind: "ZERO" | "IMPORTED"; readonly status: "VALID" | "BLOCKED"; readonly nav: string | null;
  readonly priceVersion: string | null; readonly referenceVersion: string | null;
}
export function valuePortfolio(state: PortfolioState, inputs: ValuationInputs, inception?: InceptionBaseline) {
  if (inception) requireRule(inception.portfolioId === state.portfolioId && inception.ledgerWatermark === state.ledgerWatermark &&
    inception.asOf === state.supportedInceptionAt && inception.asOf <= state.asOf && inception.kind === state.supportedInception,
    "INCEPTION_BASELINE_SCOPE_MISMATCH");
  requireRule(inputs.version.trim() && inputs.methodologyId.trim(), "VALUATION_VERSION_REQUIRED");
  const positions = state.positions.filter(p => decimal(p.quantity).positive).map(p => {
    const candidates = inputs.observations.filter(o => o.securityId === p.securityId && o.observedAt <= state.asOf)
      .sort((a, b) => a.observedAt < b.observedAt ? 1 : a.observedAt > b.observedAt ? -1 : 0);
    const selected = candidates[0];
    if (!selected) return { ...p, priceId: null, priceStatus: "MISSING_REQUIRED_DATA" as const, marketValue: null, unrealizedPnl: null };
    instant(selected.observedAt); instant(selected.receivedAt); instant(selected.validThrough);
    requireRule(selected.currency === "VND" && selected.sourceReference.trim() && selected.validThrough >= selected.observedAt, "INVALID_PRICE_OBSERVATION");
    const conflict = candidates.filter(o => o.observedAt === selected.observedAt).length > 1;
    const priceStatus = conflict ? "CONFLICTING_DATA" as const : selected.validThrough < state.asOf ? "STALE" as const : "VALID" as const;
    const mv = decimal(p.quantity).mul(price(selected.price));
    return { ...p, priceId: selected.id, priceStatus, marketValue: conflict ? null : mv.toString(), unrealizedPnl: conflict ? null : mv.sub(decimal(p.openCost)).toString() };
  });
  const valid = positions.every(p => p.priceStatus === "VALID");
  const marketValue = valid ? positions.reduce((a, p) => a.add(decimal(p.marketValue!)), Decimal.zero) : null;
  const nav = marketValue?.add(decimal(state.cash)).add(decimal(state.receivables)).sub(decimal(state.payables)) ?? null;
  const inceptionNav = state.supportedInception === "ZERO" ? "0" : inception?.status === "VALID" ? inception.nav : null;
  const economicGain = nav !== null && inceptionNav !== null ? nav.sub(decimal(inceptionNav)).sub(decimal(state.netContributions)).toString() : null;
  return deepFreeze({ portfolioId: state.portfolioId, asOf: state.asOf, inputVersion: inputs.version, methodologyId: inputs.methodologyId,
    status: valid ? "VALID" as const : "BLOCKED" as const, nav: nav?.toString() ?? null, marketValue: marketValue?.toString() ?? null,
    unrealizedPnl: valid ? positions.reduce((a, p) => a.add(decimal(p.unrealizedPnl!)), Decimal.zero).toString() : null,
    supportedInceptionNav: inceptionNav,
    economicPnlStatus: nav !== null && inceptionNav !== null ? "VALID" as const : "BLOCKED" as const,
    economicGainSinceSupportedInception: economicGain,
    economicGainSemantics: NAV_BRIDGE_SEMANTICS,
    /** @deprecated Compatibility alias for economicGainSinceSupportedInception; NOT investment return. */
    economicPnl: economicGain,
    cashWeight: nav?.positive ? decimal(state.cash).div(nav).toString() : null,
    netObligationWeight: nav?.positive ? decimal(state.receivables).sub(decimal(state.payables)).div(nav).toString() : null,
    positions: positions.map(p => ({ ...p, weight: nav?.positive ? decimal(p.marketValue!).div(nav).toString() : null })) });
}
export type PortfolioValuation = ReturnType<typeof valuePortfolio>;
