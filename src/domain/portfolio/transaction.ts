import { instant, dateOnly, vietnamBusinessDate, type Instant, type DateOnly } from "@/shared/time";
import { type MethodologyId } from "@/shared/ids";
import { ACCOUNTING_METHOD, decimal, price, shareQuantity, requireRule, sourceReference, transactionId, portfolioId, securityId, type PortfolioId, type SecurityId, type TransactionId, type SourceReference } from "./values";

export const transactionTypes = ["CASH_DEPOSIT", "BUY", "SELL", "TRADE_SETTLEMENT", "DIVIDEND_CASH", "CASH_WITHDRAWAL", "FEE", "TAX", "REVERSAL", "OPENING_BALANCE", "CORPORATE_ACTION", "CASH_ADJUSTMENT"] as const;
export type TransactionType = typeof transactionTypes[number];
export type LegType = "CASH" | "FEE_CASH" | "TAX_CASH" | "OTHER_CASH" | "SECURITY_QUANTITY" | "COST_BASIS_ADJUSTMENT" | "RECEIVABLE" | "PAYABLE";
export interface TransactionLeg {
  readonly id: string; readonly sequence: number; readonly type: LegType; readonly effectiveAt: Instant;
  readonly securityId: SecurityId | null; readonly quantity: string | null; readonly amount: string | null;
  readonly settlementReference: string | null;
}
export interface TransactionInput {
  readonly id: TransactionId; readonly portfolioId: PortfolioId; readonly type: TransactionType;
  readonly eventAt: Instant; readonly effectiveAt: Instant; readonly source: SourceReference;
  readonly idempotencyKey: string; readonly methodologyId: MethodologyId; readonly currency: "VND";
  readonly securityId?: SecurityId; readonly tradeDate?: DateOnly; readonly settlementDate?: DateOnly;
  readonly quantity?: string; readonly price?: string; readonly amount?: string;
  readonly fee?: string; readonly tax?: string; readonly representation?: "NET_SETTLEMENT" | "SPLIT_SETTLEMENT";
  readonly settlesId?: TransactionId; readonly reversesId?: TransactionId; readonly correctionGroupId?: string;
  readonly dividend?: { readonly net: string; readonly gross: string | null; readonly withholding: string | null; readonly entitlementDate?: DateOnly; readonly eventReference?: string };
  readonly opening?: { readonly cost: string; readonly migrationVersion: string; readonly evidence: string };
  readonly corporateAction?: { readonly id: string; readonly subtype: string; readonly numerator: string; readonly denominator: string; readonly evidence: string; readonly stage: "EFFECTIVE" | "SETTLEMENT"; readonly basis?: string; readonly destinationSecurityId?: SecurityId; readonly destinationQuantity?: string; readonly originatingTransactionId?: TransactionId };
  readonly adjustment?: { readonly reasonCode: string; readonly evidence: string; readonly note: string };
  readonly notes?: string;
}
export interface Transaction {
  readonly facts: TransactionInput; readonly status: "POSTED"; readonly createdAt: Instant;
  readonly accountingMethod: typeof ACCOUNTING_METHOD; readonly externalFlow: "NONE" | "CONTRIBUTION" | "WITHDRAWAL";
  readonly legs: readonly TransactionLeg[];
}
export function buildTransaction(input: TransactionInput, now: Instant, history: readonly Transaction[]): Transaction {
  // Copy at the command boundary; callers cannot mutate a validated pending payload during IO.
  const f = JSON.parse(JSON.stringify(input)) as TransactionInput;
  transactionId(f.id); portfolioId(f.portfolioId); instant(f.eventAt); instant(f.effectiveAt); instant(now);
  sourceReference(f.source.source, f.source.reference);
  requireRule(transactionTypes.includes(f.type), "UNKNOWN_TRANSACTION_TYPE");
  requireRule(f.currency === "VND" && f.idempotencyKey?.length > 0 && f.idempotencyKey.length <= 128, "CURRENCY_OR_IDEMPOTENCY_INVALID");
  requireRule(f.effectiveAt <= now && f.eventAt <= now, "FUTURE_SPECULATIVE_POSTING");
  if (f.securityId) securityId(f.securityId);
  if (f.tradeDate) dateOnly(f.tradeDate);
  if (f.settlementDate) dateOnly(f.settlementDate);
  const effectiveDate = vietnamBusinessDate(f.effectiveAt);
  if (f.type === "BUY" || f.type === "SELL") requireRule(f.tradeDate === effectiveDate, "TRADE_EFFECTIVE_DATE_MISMATCH");
  if (f.type === "TRADE_SETTLEMENT") requireRule(f.settlementDate === effectiveDate, "SETTLEMENT_EFFECTIVE_DATE_MISMATCH");
  if (f.tradeDate && f.settlementDate) requireRule(f.settlementDate >= f.tradeDate, "SETTLEMENT_BEFORE_TRADE");
  const isTrade = f.type === "BUY" || f.type === "SELL";
  requireRule(!f.price || isTrade, "EXECUTION_PRICE_REQUIRES_TRADE");
  requireRule(!f.quantity || isTrade || f.type === "OPENING_BALANCE" || f.type === "CORPORATE_ACTION", "QUANTITY_FACT_NOT_APPLICABLE");
  requireRule(!f.tradeDate || isTrade, "TRADE_DATE_NOT_APPLICABLE");
  requireRule(!f.securityId || isTrade || ["DIVIDEND_CASH", "OPENING_BALANCE", "CORPORATE_ACTION"].includes(f.type), "SECURITY_FACT_NOT_APPLICABLE");
  requireRule(!f.representation || isTrade || f.type === "DIVIDEND_CASH", "SETTLEMENT_REPRESENTATION_NOT_APPLICABLE");
  if (f.type === "REVERSAL") requireRule(!f.amount, "REVERSAL_FACTS_DERIVE_FROM_ORIGINAL");
  const fee = decimal(f.fee ?? "0"), tax = decimal(f.tax ?? "0");
  requireRule(!fee.negative && !tax.negative, "NEGATIVE_CHARGE");
  requireRule(f.type === "BUY" || f.type === "SELL" || (fee.isZero && tax.isZero), "CHARGES_BELONG_TO_ORIGINATING_EVENT");
  requireRule(!f.settlesId || f.type === "TRADE_SETTLEMENT", "UNEXPECTED_SETTLEMENT_LINK");
  requireRule(!f.reversesId || f.type === "REVERSAL", "UNEXPECTED_REVERSAL_LINK");
  requireRule(!f.dividend || f.type === "DIVIDEND_CASH", "UNEXPECTED_DIVIDEND_DETAIL");
  requireRule(!f.adjustment || f.type === "CASH_ADJUSTMENT", "UNEXPECTED_ADJUSTMENT_DETAIL");
  requireRule(!f.opening || f.type === "OPENING_BALANCE", "UNEXPECTED_OPENING_DETAIL");
  requireRule(!f.corporateAction || f.type === "CORPORATE_ACTION", "UNEXPECTED_ACTION_DETAIL");
  const legs: TransactionLeg[] = [];
  const leg = (type: LegType, value: string, sec: SecurityId | null = null, reference: string | null = null) => {
    const sequence = legs.length + 1;
    legs.push(Object.freeze({ id: `${f.id}:leg:${sequence}`, sequence, type, effectiveAt: f.effectiveAt,
      securityId: sec, quantity: type === "SECURITY_QUANTITY" ? value : null,
      amount: type === "SECURITY_QUANTITY" ? null : value, settlementReference: reference }));
  };
  const positiveAmount = () => { const a = decimal(f.amount ?? ""); requireRule(a.positive, "POSITIVE_AMOUNT_REQUIRED"); return a; };
  switch (f.type) {
    case "CASH_DEPOSIT": case "CASH_WITHDRAWAL": case "FEE": case "TAX": {
      const a = positiveAmount();
      leg(f.type === "FEE" ? "FEE_CASH" : f.type === "TAX" ? "TAX_CASH" : "CASH", (f.type === "CASH_DEPOSIT" ? a : a.neg()).toString());
      break;
    }
    case "BUY": case "SELL": {
      requireRule(f.securityId && f.tradeDate && f.representation, "TRADE_FACTS_REQUIRED");
      const q = shareQuantity(f.quantity ?? ""), p = price(f.price ?? "");
      requireRule(q.positive, "POSITIVE_QUANTITY_REQUIRED");
      const gross = q.mul(p); requireRule(gross.eq(positiveAmount()), "TRADE_VALUE_MISMATCH");
      const net = f.type === "BUY" ? gross.add(fee).add(tax) : gross.sub(fee).sub(tax);
      requireRule(net.positive, "POSITIVE_OBLIGATION_REQUIRED");
      leg("SECURITY_QUANTITY", (f.type === "BUY" ? q : q.neg()).toString(), f.securityId);
      leg(f.type === "BUY" ? "PAYABLE" : "RECEIVABLE", net.toString());
      break;
    }
    case "TRADE_SETTLEMENT": {
      const original = history.find(t => t.facts.id === f.settlesId && t.facts.portfolioId === f.portfolioId);
      requireRule(original && ["BUY", "SELL"].includes(original.facts.type) && f.settlementDate, "SETTLEMENT_ORIGIN_REQUIRED");
      const a = positiveAmount(), buy = original.facts.type === "BUY";
      const obligation = original.legs.find(l => l.type === (buy ? "PAYABLE" : "RECEIVABLE"))!;
      if (original.facts.representation === "SPLIT_SETTLEMENT") {
        requireRule(a.eq(decimal(obligation.amount!)), "PARTIAL_SPLIT_SETTLEMENT_UNSUPPORTED");
        leg("CASH", (buy ? decimal(original.facts.amount!).neg() : decimal(original.facts.amount!)).toString());
        for (const [kind, amount] of [["FEE_CASH", original.facts.fee ?? "0"], ["TAX_CASH", original.facts.tax ?? "0"]] as const) {
          if (!decimal(amount).isZero) leg(kind, decimal(amount).neg().toString());
        }
      } else leg("CASH", (buy ? a.neg() : a).toString());
      leg(buy ? "PAYABLE" : "RECEIVABLE", a.neg().toString(), null, obligation.id);
      break;
    }
    case "DIVIDEND_CASH": {
      const d = f.dividend; requireRule(d && f.securityId, "DIVIDEND_FACTS_REQUIRED");
      const net = decimal(d.net); requireRule(net.positive, "POSITIVE_DIVIDEND_REQUIRED");
      requireRule((d.gross === null) === (d.withholding === null), "INCOMPLETE_DIVIDEND_TAX_FACTS");
      if (d.entitlementDate) dateOnly(d.entitlementDate);
      if (d.gross !== null && d.withholding !== null) {
        requireRule(!decimal(d.withholding).negative && decimal(d.gross).sub(decimal(d.withholding)).eq(net), "DIVIDEND_RECONCILIATION_ERROR");
      }
      if (f.representation === "SPLIT_SETTLEMENT") {
        requireRule(d.gross !== null && d.withholding !== null, "SPLIT_DIVIDEND_REQUIRES_GROSS_TAX");
        leg("CASH", decimal(d.gross).toString());
        if (!decimal(d.withholding).isZero) leg("TAX_CASH", decimal(d.withholding).neg().toString());
      } else leg("CASH", net.toString());
      break;
    }
    case "OPENING_BALANCE": {
      requireRule(f.opening && f.opening.evidence.trim() && f.opening.migrationVersion.trim(), "OPENING_BALANCE_EVIDENCE_MISSING");
      if (f.amount) { requireRule(!decimal(f.amount).negative, "NEGATIVE_OPENING_CASH_UNSUPPORTED"); leg("CASH", decimal(f.amount).toString()); }
      if (f.securityId) {
        const q = shareQuantity(f.quantity ?? ""); const cost = decimal(f.opening.cost);
        requireRule(q.positive && !cost.negative, "OPENING_HOLDING_INVALID");
        leg("SECURITY_QUANTITY", q.toString(), f.securityId); leg("COST_BASIS_ADJUSTMENT", cost.toString(), f.securityId);
      } else requireRule(decimal(f.opening.cost).isZero, "OPENING_BASIS_REQUIRES_SECURITY");
      requireRule(legs.length > 0, "EMPTY_OPENING_BALANCE"); break;
    }
    case "CORPORATE_ACTION": {
      const c = f.corporateAction;
      requireRule(c && c.evidence.trim() && f.securityId, "UNSUPPORTED_MISSING_CORPORATE_ACTION_TERMS");
      transactionId(c.id);
      if (["SPLIT", "REVERSE_SPLIT"].includes(c.subtype)) {
        requireRule(c.stage === "EFFECTIVE" && decimal(c.numerator).positive && decimal(c.denominator).positive, "INVALID_SPLIT_RATIO");
        const delta = decimal(f.quantity ?? ""); requireRule(delta.integer && !delta.isZero, "FRACTIONAL_ACTION_UNSUPPORTED");
        leg("SECURITY_QUANTITY", delta.toString(), f.securityId);
      } else if (c.subtype === "RIGHTS_SUBSCRIPTION" && c.stage === "EFFECTIVE") {
        const q = shareQuantity(f.quantity ?? ""), a = positiveAmount();
        requireRule(q.positive && c.basis && decimal(c.basis).eq(a), "RIGHTS_CONSIDERATION_BASIS_MISMATCH");
        leg("SECURITY_QUANTITY", q.toString(), f.securityId); leg("COST_BASIS_ADJUSTMENT", a.toString(), f.securityId); leg("PAYABLE", a.toString());
      } else if (c.subtype === "RIGHTS_SUBSCRIPTION" && c.stage === "SETTLEMENT") {
        const original = history.find(t => t.facts.id === c.originatingTransactionId && t.facts.portfolioId === f.portfolioId);
        requireRule(original?.facts.corporateAction?.id === c.id && original.facts.corporateAction.stage === "EFFECTIVE" && original.facts.corporateAction.subtype === "RIGHTS_SUBSCRIPTION", "ACTION_SETTLEMENT_ORIGIN_REQUIRED");
        const obligation = original.legs.find(l => l.type === "PAYABLE"); requireRule(obligation, "ACTION_OBLIGATION_REQUIRED");
        const a = positiveAmount(); leg("CASH", a.neg().toString()); leg("PAYABLE", a.neg().toString(), null, obligation.id);
      } else if (["MERGER", "SPINOFF"].includes(c.subtype) && c.stage === "EFFECTIVE") {
        requireRule(c.destinationSecurityId && c.destinationSecurityId !== f.securityId && c.basis, "BASIS_TRANSFER_TERMS_REQUIRED");
        securityId(c.destinationSecurityId);
        const q = decimal(f.quantity ?? ""), destination = shareQuantity(c.destinationQuantity ?? ""), basis = decimal(c.basis);
        requireRule(q.integer && !q.positive && destination.positive && !basis.negative, "INVALID_BASIS_TRANSFER");
        if (!q.isZero) leg("SECURITY_QUANTITY", q.toString(), f.securityId);
        leg("COST_BASIS_ADJUSTMENT", basis.neg().toString(), f.securityId);
        leg("SECURITY_QUANTITY", destination.toString(), c.destinationSecurityId);
        leg("COST_BASIS_ADJUSTMENT", basis.toString(), c.destinationSecurityId);
      } else requireRule(false, "UNSUPPORTED_MISSING_CORPORATE_ACTION_TERMS");
      break;
    }
    case "REVERSAL": {
      const original = history.find(t => t.facts.id === f.reversesId && t.facts.portfolioId === f.portfolioId);
      requireRule(original && original.facts.type !== "REVERSAL", "REVERSAL_ORIGIN_REQUIRED");
      requireRule(original.legs.every(l => l.effectiveAt < f.effectiveAt), "REVERSAL_MUST_FOLLOW_ORIGINAL");
      requireRule(!history.some(t => t.facts.reversesId === f.reversesId), "ALREADY_REVERSED");
      for (const l of original.legs) leg(l.type, decimal(l.quantity ?? l.amount!).neg().toString(), l.securityId, l.settlementReference ?? (l.type === "PAYABLE" || l.type === "RECEIVABLE" ? l.id : null));
      break;
    }
    case "CASH_ADJUSTMENT": {
      requireRule(f.adjustment?.reasonCode.trim() && f.adjustment.evidence.trim() && f.adjustment.note.trim(), "EXCEPTIONAL_ADJUSTMENT_EVIDENCE_REQUIRED");
      const a = decimal(f.amount ?? ""); requireRule(!a.isZero, "NONZERO_ADJUSTMENT_REQUIRED"); leg("OTHER_CASH", a.toString()); break;
    }
  }
  const externalFlow = f.type === "CASH_DEPOSIT" ? "CONTRIBUTION" : f.type === "CASH_WITHDRAWAL" ? "WITHDRAWAL" : "NONE";
  return deepFreeze({ facts: f, status: "POSTED" as const, createdAt: now, accountingMethod: ACCOUNTING_METHOD, externalFlow, legs });
}
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") { Object.freeze(value); for (const v of Object.values(value)) deepFreeze(v); }
  return value;
}
