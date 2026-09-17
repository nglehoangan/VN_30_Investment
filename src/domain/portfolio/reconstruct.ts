import { instant, type Instant } from "@/shared/time";
import { ACCOUNTING_METHOD, Decimal, decimal, requireRule, type PortfolioId, type LedgerWatermark } from "./values";
import { type Transaction, type TransactionLeg, deepFreeze } from "./transaction";
export interface PositionState { readonly securityId: string; readonly quantity: string; readonly openCost: string; readonly averageCost: string | null; readonly realizedPnl: string }
export interface PortfolioState {
  readonly supportedInceptionAt: Instant | null; readonly portfolioId: PortfolioId; readonly asOf: Instant; readonly ledgerWatermark: LedgerWatermark;
  readonly accountingMethod: string; readonly methodologyIds: readonly string[]; readonly transactionIds: readonly string[];
  readonly cash: string; readonly receivables: string; readonly payables: string; readonly netContributions: string;
  readonly realizedPnl: string; readonly netDividends: string; readonly grossDividends: string | null; readonly dividendTax: string | null;
  readonly expenses: string; readonly cashAdjustments: string; readonly supportedInception: "ZERO" | "IMPORTED";
  readonly positions: readonly PositionState[]; readonly obligations: readonly { id: string; transactionId: string; type: "PAYABLE" | "RECEIVABLE"; amount: string }[];
}
type Position = { quantity: Decimal; cost: Decimal; realized: Decimal };
type Effect = { cost: Decimal; realized: Decimal; flow: Decimal; net: Decimal; gross: Decimal; tax: Decimal; unknown: number; adjustments: Decimal; expenses: Decimal };
const emptyEffect = (): Effect => ({ cost: Decimal.zero, realized: Decimal.zero, flow: Decimal.zero, net: Decimal.zero, gross: Decimal.zero, tax: Decimal.zero, unknown: 0, adjustments: Decimal.zero, expenses: Decimal.zero });
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
/** Pure leg-level replay; watermark never participates in economic ordering. */
export function reconstructPortfolio(portfolioId: PortfolioId, history: readonly Transaction[], asOf: Instant, ledgerWatermark: LedgerWatermark, inceptionAt?: Instant): PortfolioState {
  instant(asOf);
  if (inceptionAt) { instant(inceptionAt); requireRule(asOf >= inceptionAt, "BEFORE_SUPPORTED_INCEPTION"); }
  const transactions = history.filter(t => t.facts.portfolioId === portfolioId && t.status === "POSTED");
  requireRule(new Set(transactions.map(t => t.facts.id)).size === transactions.length, "DUPLICATE_TRANSACTION");
  const byId = new Map(transactions.map(t => [t.facts.id, t]));
  const rows = transactions.flatMap(t => t.legs.filter(l => l.effectiveAt <= asOf).map(l => ({ t, l })))
    .sort((a, b) => compare(a.l.effectiveAt, b.l.effectiveAt) || compare(a.t.facts.eventAt, b.t.facts.eventAt) || compare(a.t.facts.id, b.t.facts.id) || a.l.sequence - b.l.sequence);
  const positions = new Map<string, Position>(), obligations = new Map<string, { transactionId: string; type: "PAYABLE" | "RECEIVABLE"; amount: Decimal }>();
  const activeActions = new Map<string, string>();
  const effects = new Map<string, Effect>(), visited = new Set<string>(), reversed = new Set<string>();
  let cash = Decimal.zero, totals = emptyEffect(), imported = false;
  const position = (id: string) => { if (!positions.has(id)) positions.set(id, { quantity: Decimal.zero, cost: Decimal.zero, realized: Decimal.zero }); return positions.get(id)!; };
  const verify = () => {
    requireRule(!cash.negative, "INSUFFICIENT_SETTLED_CASH");
    decimal(cash.toString());
    for (const key of ["realized", "flow", "net", "gross", "tax", "adjustments", "expenses"] as const) decimal(totals[key].toString());
    for (const kind of ["PAYABLE", "RECEIVABLE"]) decimal([...obligations.values()].filter(o => o.type === kind).reduce((a, o) => a.add(o.amount), Decimal.zero).toString());
    for (const p of positions.values()) { decimal(p.quantity.toString()); decimal(p.cost.toString()); decimal(p.realized.toString()); }
    for (const p of positions.values()) requireRule(!p.quantity.negative && !p.cost.negative && (!p.quantity.isZero || p.cost.isZero), "POSITION_COST_INVARIANT");
    for (const o of obligations.values()) requireRule(!o.amount.negative, "SETTLEMENT_MISMATCH");
    // Conservative no-margin capability: no unsettled receivable is treated as spendable cash.
    const payables = [...obligations.values()].filter(o => o.type === "PAYABLE").reduce((a, o) => a.add(o.amount), Decimal.zero);
    requireRule(cash.units >= payables.units, "UNFUNDED_PAYABLE_REQUIRES_REVIEW");
  };
  for (let i = 0; i < rows.length; i++) {
    const { t, l } = rows[i], f = t.facts;
    requireRule(t.accountingMethod === ACCOUNTING_METHOD, "UNSUPPORTED_ACCOUNTING_METHOD");
    if (!visited.has(f.id)) {
      visited.add(f.id);
      const e = emptyEffect();
      if (f.type === "REVERSAL") {
        const original = byId.get(f.reversesId!);
        requireRule(original && effects.has(original.facts.id) && !reversed.has(original.facts.id), "REVERSAL_MISMATCH");
        if (original.facts.type === "BUY" || original.facts.type === "SELL") {
          const activeSettlements = transactions.filter(s => s.facts.settlesId === original.facts.id && visited.has(s.facts.id) && !reversed.has(s.facts.id));
          requireRule(activeSettlements.every(s => f.correctionGroupId && transactions.some(r => r.facts.reversesId === s.facts.id && r.facts.correctionGroupId === f.correctionGroupId && r.facts.effectiveAt === f.effectiveAt)), "SETTLED_TRADE_REQUIRES_CORRECTION_GROUP");
        }
        const old = effects.get(original.facts.id)!;
        for (const key of ["cost", "realized", "flow", "net", "gross", "tax", "expenses", "adjustments"] as const) e[key] = old[key].neg();
        e.unknown = -old.unknown;
        if (original.facts.securityId && (!e.cost.isZero || !e.realized.isZero)) {
          const p = position(original.facts.securityId); p.cost = p.cost.add(e.cost); p.realized = p.realized.add(e.realized);
        }
        reversed.add(original.facts.id);
        const originalAction = original.facts.corporateAction;
        if (originalAction?.stage === "EFFECTIVE") activeActions.delete(originalAction.id);
      } else {
        // Evaluate activity in economic replay order, never from future reversal metadata.
        if (f.corporateAction?.stage === "EFFECTIVE") {
          requireRule(!activeActions.has(f.corporateAction.id), "DUPLICATE_CORPORATE_ACTION_STAGE");
          activeActions.set(f.corporateAction.id, f.id);
        }
        if (f.type === "OPENING_BALANCE") {
          requireRule(!transactions.some(other => other.facts.type !== "OPENING_BALANCE" && other.legs.some(leg => leg.effectiveAt < l.effectiveAt)), "OPENING_AFTER_ACTIVITY"); imported = true;
        }
        if (f.type === "CORPORATE_ACTION" && ["MERGER", "SPINOFF"].includes(f.corporateAction!.subtype)) {
          const c = f.corporateAction!, prior = position(f.securityId!);
          requireRule(prior.quantity.positive && decimal(c.numerator).positive && decimal(c.denominator).positive &&
            prior.quantity.mul(decimal(c.numerator)).eq(decimal(c.destinationQuantity!).mul(decimal(c.denominator))), "ACTION_EXCHANGE_RATIO_MISMATCH");
          requireRule(decimal(c.basis!).units <= prior.cost.units, "BASIS_TRANSFER_EXCEEDS_SOURCE");
          if (c.subtype === "MERGER") requireRule(decimal(f.quantity!).neg().eq(prior.quantity) && decimal(c.basis!).eq(prior.cost), "FULL_MERGER_TERMS_REQUIRED");
          else requireRule(decimal(f.quantity!).isZero, "SPINOFF_PRESERVES_SOURCE_QUANTITY");
        }
        if (f.type === "CASH_DEPOSIT") e.flow = decimal(f.amount!);
        if (f.type === "CASH_WITHDRAWAL") e.flow = decimal(f.amount!).neg();
        if (f.type === "CASH_ADJUSTMENT") e.adjustments = decimal(f.amount!);
        if (f.type === "FEE" || f.type === "TAX") e.expenses = decimal(f.amount!);
        if (f.type === "DIVIDEND_CASH") {
          e.net = decimal(f.dividend!.net); e.unknown = f.dividend!.gross === null ? 1 : 0;
          e.gross = decimal(f.dividend!.gross ?? "0"); e.tax = decimal(f.dividend!.withholding ?? "0");
        }
      }
      effects.set(f.id, e);
      totals = { cost: Decimal.zero, realized: totals.realized.add(e.realized), flow: totals.flow.add(e.flow), net: totals.net.add(e.net), gross: totals.gross.add(e.gross), tax: totals.tax.add(e.tax), unknown: totals.unknown + e.unknown, adjustments: totals.adjustments.add(e.adjustments), expenses: totals.expenses.add(e.expenses) };
    }
    const e = effects.get(f.id)!;
    if (l.type === "SECURITY_QUANTITY") {
      const p = position(l.securityId!), q = decimal(l.quantity!);
      if (f.type === "BUY") { e.cost = decimal(f.amount!).add(decimal(f.fee ?? "0")).add(decimal(f.tax ?? "0")); p.cost = p.cost.add(e.cost); }
      if (f.type === "SELL") {
        const sold = q.neg(); requireRule(p.quantity.units >= sold.units, "NEGATIVE_POSITION_ERROR");
        const released = sold.eq(p.quantity) ? p.cost : p.cost.proportional(sold, p.quantity);
        e.cost = released.neg(); e.realized = decimal(f.amount!).sub(decimal(f.fee ?? "0")).sub(decimal(f.tax ?? "0")).sub(released);
        p.cost = p.cost.sub(released); p.realized = p.realized.add(e.realized); totals.realized = totals.realized.add(e.realized);
      }
      if (f.type === "CORPORATE_ACTION" && ["SPLIT", "REVERSE_SPLIT"].includes(f.corporateAction!.subtype)) {
        const c = f.corporateAction!;
        requireRule(p.quantity.positive && p.quantity.add(q).mul(decimal(c.denominator)).eq(p.quantity.mul(decimal(c.numerator))), "SPLIT_QUANTITY_RATIO_MISMATCH");
        requireRule(c.subtype === "SPLIT" ? q.positive : q.negative, "SPLIT_DIRECTION_MISMATCH");
      }
      p.quantity = p.quantity.add(q); requireRule(!p.quantity.negative, "NEGATIVE_POSITION_ERROR");
    } else if (l.type === "COST_BASIS_ADJUSTMENT") {
      // Explicit opening/action basis, including its reversal, changes only through this leg.
      const p = position(l.securityId!); p.cost = p.cost.add(decimal(l.amount!));
    } else if (l.type === "PAYABLE" || l.type === "RECEIVABLE") {
      const key = l.settlementReference ?? l.id, amount = decimal(l.amount!);
      if (l.settlementReference) {
        const o = obligations.get(key); requireRule(o && o.type === l.type, "UNMATCHED_OBLIGATION");
        if (f.type === "TRADE_SETTLEMENT") requireRule(o.transactionId === f.settlesId && !reversed.has(o.transactionId), "SETTLEMENT_ORIGIN_MISMATCH");
        o.amount = o.amount.add(amount);
      } else { requireRule(amount.positive && !obligations.has(key), "INVALID_OBLIGATION"); obligations.set(key, { type: l.type, transactionId: f.id, amount }); }
    } else cash = cash.add(decimal(l.amount!));
    const next = rows[i + 1];
    // Complete same-effective-time correction groups are atomic; ordinary events validate individually.
    if (!next || (next.t.facts.id !== f.id && !(f.correctionGroupId && next.t.facts.correctionGroupId === f.correctionGroupId && next.l.effectiveAt === l.effectiveAt))) verify();
  }
  const obligationRows = [...obligations].sort(([a], [b]) => compare(a, b));
  const sum = (type: TransactionLeg["type"]) => obligationRows.filter(([, o]) => o.type === type).reduce((a, [, o]) => a.add(o.amount), Decimal.zero).toString();
  return deepFreeze({ supportedInceptionAt: inceptionAt ?? null, portfolioId, asOf, ledgerWatermark, accountingMethod: ACCOUNTING_METHOD,
    methodologyIds: [...new Set(transactions.filter(t => visited.has(t.facts.id)).map(t => t.facts.methodologyId))].sort(), transactionIds: [...visited],
    cash: cash.toString(), receivables: sum("RECEIVABLE"), payables: sum("PAYABLE"), netContributions: totals.flow.toString(), realizedPnl: totals.realized.toString(),
    netDividends: totals.net.toString(), grossDividends: totals.unknown ? null : totals.gross.toString(), dividendTax: totals.unknown ? null : totals.tax.toString(), expenses: totals.expenses.toString(), cashAdjustments: totals.adjustments.toString(), supportedInception: imported ? "IMPORTED" : "ZERO",
    positions: [...positions].sort(([a], [b]) => compare(a, b)).map(([securityId, p]) => ({ securityId, quantity: p.quantity.toString(), openCost: p.cost.toString(), averageCost: p.quantity.isZero ? null : p.cost.div(p.quantity).toString(), realizedPnl: p.realized.toString() })),
    obligations: obligationRows.map(([id, o]) => ({ id, transactionId: o.transactionId, type: o.type, amount: o.amount.toString() })) });
}
