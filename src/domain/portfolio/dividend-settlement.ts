import { instant, type Instant } from "@/shared/time";
import { decimal, requireRule } from "./values";
import type { Transaction, TransactionInput } from "./transaction";

export interface ClaimEvidence { readonly reference: string; readonly sha256: string; readonly pointer: string; readonly knownAt: Instant }
export interface DividendAllocation {
  readonly id: string; readonly portfolioId: string; readonly originalTransactionId: string; readonly originalLegId: string;
  readonly currency: "VND"; readonly basis: "NET"; readonly acceptanceReference: string; readonly knownAt: Instant;
  readonly claims: readonly { readonly id: string; readonly securityId: string; readonly actionId: string; readonly amount: string; readonly evidence: readonly ClaimEvidence[] }[];
}
export interface DividendReceipt {
  readonly namespace: string; readonly id: string; readonly portfolioId: string; readonly securityId: string; readonly actionId: string;
  readonly currency: "VND"; readonly net: string; readonly effectiveAt: Instant; readonly knownAt: Instant; readonly evidence: readonly ClaimEvidence[];
}
export interface DividendSettlement {
  readonly version: "dividend-receivable-settlement-v1"; readonly allocation: DividendAllocation;
  readonly correctionOf: string | null; readonly claimId: string; readonly actionId: string; readonly receipt: DividendReceipt; readonly knownAt: Instant;
}
/** Deterministic structural identity; hashing/authenticity belong to the trusted infrastructure adapter. */
export function settlementCanonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(settlementCanonical).join(",")}]`;
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${settlementCanonical((value as Record<string, unknown>)[k])}`).join(",")}}`;
}
function fields(value: unknown, keys: string) {
  requireRule(value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(" ") === keys.split(" ").sort().join(" "), "SETTLEMENT_SCHEMA_FIELDS");
}
function text(v: unknown) { requireRule(typeof v === "string" && v.trim().length > 0 && v.length <= 256, "SETTLEMENT_ID_REQUIRED"); }
function evidence(items: readonly ClaimEvidence[], cutoff: Instant) {
  requireRule(Array.isArray(items) && items.length > 0 && items.length <= 100, "SETTLEMENT_EVIDENCE_REQUIRED");
  for (const e of items) {
    fields(e, "reference sha256 pointer knownAt"); text(e.reference); text(e.pointer);
    requireRule(/^[a-f0-9]{64}$/.test(e.sha256) && e.pointer.startsWith("/"), "SETTLEMENT_EVIDENCE_INVALID");
    instant(e.knownAt); requireRule(e.knownAt <= cutoff, "FUTURE_SETTLEMENT_EVIDENCE");
  }
}
/** Structural/economic qualification only: never treats an acceptance reference as authenticated authority. */
export function validateDividendSettlement(f: TransactionInput, now: Instant, history: readonly Transaction[]) {
  const s = f.dividendSettlement; requireRule(s, "CLAIM_ALLOCATION_REQUIRED");
  fields(s, "version allocation claimId actionId receipt knownAt correctionOf");
  requireRule(s.version === "dividend-receivable-settlement-v1", "SETTLEMENT_VERSION_UNSUPPORTED");
  const a = s.allocation, r = s.receipt;
  fields(a, "id portfolioId originalTransactionId originalLegId currency basis acceptanceReference knownAt claims");
  fields(r, "namespace id portfolioId securityId actionId currency net effectiveAt knownAt evidence");
  [a.id,a.originalTransactionId,a.originalLegId,a.acceptanceReference,s.claimId,s.actionId,r.namespace,r.id,r.securityId,r.actionId].forEach(text);
  [s.knownAt,a.knownAt,r.knownAt,r.effectiveAt].forEach(instant);
  requireRule(a.basis === "NET", "GROSS_CLAIM_REQUIRES_ACCOUNTING_AMENDMENT");
  requireRule(a.currency === "VND" && r.currency === "VND" && a.portfolioId === f.portfolioId && r.portfolioId === f.portfolioId, "CLAIM_PORTFOLIO_CURRENCY_MISMATCH");
  requireRule(s.knownAt <= now && a.knownAt <= s.knownAt && r.knownAt <= s.knownAt && f.effectiveAt <= s.knownAt && r.effectiveAt <= f.effectiveAt && (s.correctionOf !== null || (f.eventAt === r.effectiveAt && f.effectiveAt === r.effectiveAt)), "SETTLEMENT_TIME_MISMATCH");
  evidence(r.evidence, r.knownAt);
  const origin = history.find(t => t.facts.id === a.originalTransactionId && t.facts.portfolioId === f.portfolioId);
  const leg = origin?.legs.find(l => l.id === a.originalLegId && l.type === "RECEIVABLE" && !l.settlementReference);
  requireRule(origin?.facts.type === "OPENING_BALANCE" && leg?.amount && leg.effectiveAt < f.effectiveAt, "DIVIDEND_OPENING_CLAIM_REQUIRED");
  requireRule(Array.isArray(a.claims) && a.claims.length > 0 && a.claims.length <= 100 && new Set(a.claims.map(c => c.id)).size === a.claims.length, "CLAIM_ALLOCATION_OVERLAP");
  let total = decimal("0");
  for (const c of a.claims) {
    fields(c, "id securityId actionId amount evidence"); [c.id,c.securityId,c.actionId].forEach(text); evidence(c.evidence,a.knownAt);
    const amount = decimal(c.amount); requireRule(amount.positive, "POSITIVE_CLAIM_REQUIRED"); total = total.add(amount);
  }
  requireRule(new Set(a.claims.map(c => `${c.securityId}\u0000${c.actionId}`)).size === a.claims.length, "CLAIM_ALLOCATION_OVERLAP");
  requireRule(total.eq(decimal(leg.amount)), "CLAIM_ALLOCATION_TOTAL_MISMATCH");
  const claim = a.claims.find(c => c.id === s.claimId); requireRule(claim && claim.securityId === f.securityId && claim.actionId === s.actionId && r.securityId === claim.securityId && r.actionId === claim.actionId, "CLAIM_ISSUER_ACTION_MISMATCH");
  requireRule(decimal(r.net).positive && decimal(r.net).eq(decimal(f.amount ?? "")), "RECEIPT_NET_MISMATCH");
  requireRule(s.correctionOf === null || typeof s.correctionOf === "string", "INVALID_SETTLEMENT_CORRECTION");
  const lineage = new Set<string>();
  if (s.correctionOf !== null) {
    const prior = history.find(t => t.facts.id === s.correctionOf)?.facts;
    const reversal = history.find(t => t.facts.reversesId === s.correctionOf)?.facts;
    requireRule(prior?.dividendSettlement && reversal && f.correctionGroupId && reversal.correctionGroupId === f.correctionGroupId && reversal.effectiveAt === f.effectiveAt && f.eventAt === f.effectiveAt, "SETTLEMENT_CORRECTION_LINEAGE_REQUIRED");
    let cursor: TransactionInput | undefined = prior;
    while (cursor?.dividendSettlement) {
      requireRule(!lineage.has(cursor.id), "CYCLIC_SETTLEMENT_CORRECTION"); lineage.add(cursor.id);
      cursor = history.find(t => t.facts.id === cursor!.dividendSettlement!.correctionOf)?.facts;
    }
    requireRule(prior.dividendSettlement.receipt.namespace === r.namespace && prior.dividendSettlement.receipt.id === r.id, "CORRECTION_RECEIPT_ID_CHANGED");
  }
  // v1 consumes one whole receipt; split receipt allocation is deliberately unsupported.
  for (const t of history) {
    const old = t.facts.dividendSettlement;
    if (old?.allocation.originalLegId === a.originalLegId) requireRule(settlementCanonical(old.allocation) === settlementCanonical(a), "CLAIM_ALLOCATION_CHANGED");
    let descendant = old?.correctionOf ?? null;
    const seen = new Set<string>();
    while (descendant && descendant !== f.id && !seen.has(descendant)) {
      seen.add(descendant); descendant = history.find(x => x.facts.id === descendant)?.facts.dividendSettlement?.correctionOf ?? null;
    }
    if (old) requireRule(!(old.receipt.namespace === r.namespace && old.receipt.id === r.id) || lineage.has(t.facts.id) || descendant === f.id, "DUPLICATE_DIVIDEND_RECEIPT");
  }
  return { allocation: a, claim, receipt: r, leg };
}
