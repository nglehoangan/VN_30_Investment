import { instant, vietnamBusinessDate, type Instant } from "@/shared/time";
import { reconstructPortfolio } from "./reconstruct";
import { referenceAt, validateReference, type ReferenceData } from "./reference";
import { valuePortfolio, type ValuationInputs } from "./valuation";
import { deepFreeze, type Transaction } from "./transaction";
import { decimal, requireRule, type PortfolioId, type LedgerWatermark } from "./values";

export interface InceptionInputs { readonly prices: ValuationInputs; readonly references: ReferenceData }
/** Opening facts only: same-instant contributions/trades are subsequent activity, not imported capital. */
export function deriveSupportedInception(portfolioId: PortfolioId, history: readonly Transaction[], ledgerWatermark: LedgerWatermark,
  inceptionAt: Instant, inputs: InceptionInputs | null, taxonomy: string, calculatedAt: Instant) {
  instant(inceptionAt); instant(calculatedAt);
  const opening = history.filter(t => t.facts.portfolioId === portfolioId && t.facts.type === "OPENING_BALANCE");
  requireRule(opening.every(t => t.legs.every(l => l.effectiveAt === inceptionAt)), "OPENING_REQUIRES_SUPPORTED_INCEPTION");
  const state = reconstructPortfolio(portfolioId, opening, inceptionAt, ledgerWatermark, inceptionAt);
  const base = { portfolioId, asOf: inceptionAt, calculatedAt, ledgerWatermark, kind: state.supportedInception,
    transactionIds: state.transactionIds, accountingMethod: state.accountingMethod, methodologyIds: state.methodologyIds, taxonomy };
  if (state.supportedInception === "ZERO") return deepFreeze({ ...base, status: "VALID" as const, nav: "0", reason: null,
    priceVersion: null, referenceVersion: null, valuationMethodologyId: null, prices: [], reference: [], referenceEvidence: [] });
  if (!inputs) return deepFreeze({ ...base, status: "BLOCKED" as const, nav: null, reason: "MISSING_INCEPTION_INPUTS",
    priceVersion: null, referenceVersion: null, valuationMethodologyId: null, prices: [], reference: [], referenceEvidence: [] });
  requireRule(inputs.prices.observations.every(o => o.receivedAt <= calculatedAt), "FUTURE_PRICE_EVIDENCE");
  validateReference(inputs.references);
  const valuation = valuePortfolio(state, inputs.prices), day = vietnamBusinessDate(inceptionAt);
  const reference = state.positions.filter(p => decimal(p.quantity).positive).map(p => referenceAt(inputs.references, p.securityId, day, taxonomy));
  const valid = valuation.status === "VALID" && reference.every(r => r.sector !== null && r.membership !== "UNKNOWN_OR_UNSUPPORTED");
  const selectedPrices = new Set(valuation.positions.map(p => p.priceId));
  return deepFreeze({ ...base, status: valid ? "VALID" as const : "BLOCKED" as const, nav: valid ? valuation.nav : null,
    reason: valid ? null : "INVALID_INCEPTION_MARKET_OR_REFERENCE_DATA", priceVersion: inputs.prices.version,
    referenceVersion: inputs.references.version, valuationMethodologyId: inputs.prices.methodologyId,
    prices: inputs.prices.observations.filter(o => selectedPrices.has(o.id)), reference,
    referenceEvidence: inputs.references.intervals.filter(r => r.from <= day && (!r.to || day < r.to)) });
}
