import { dateOnly, instant } from "@/shared/time";
import { settlementCanonical } from "./dividend-settlement";
import { deepFreeze, type Transaction } from "./transaction";
import { decimal, requireRule, shareQuantity } from "./values";
import type { PortfolioState } from "./reconstruct";
import type { OwnershipObservation } from "./ownership-reconciliation";

export interface AccountingEvidencePin {
  readonly id: string; readonly sha256: string; readonly pointer: string;
  readonly retrievedAt: string | null; readonly knownAt: string | null;
}
export interface Wp1Evidence {
  readonly portfolioId: string; readonly accountReference: string;
  readonly ownership: OwnershipObservation;
  readonly openingBalances: { readonly cash: string; readonly receivables: string };
  readonly openingEvidence: AccountingEvidencePin;
  readonly ownerEvidence: AccountingEvidencePin;
  readonly receiptEvidence: AccountingEvidencePin;
  readonly feeEvidence: AccountingEvidencePin;
  readonly feePolicyEvidence: AccountingEvidencePin;
  readonly openingHoldings: AccountingEvidencePin;
  readonly latestHoldings: AccountingEvidencePin;
  readonly receipt: { readonly id: string; readonly issuer: "MWG"; readonly amount: string; readonly receiptDate: string; readonly recordDate: string };
  readonly fee: { readonly amount: string; readonly asOfDate: string };
}
export type PreviewEffect =
  | { readonly kind: "PENDING_OWNERSHIP"; readonly securityId: "TCB"; readonly delta: string; readonly available: string; readonly pending: string }
  | { readonly kind: "CLAIM_TO_CASH"; readonly securityId: "MWG"; readonly amount: string; readonly receiptId: string; readonly originalLegId: string; readonly recordDate: string; readonly originalClaimAmount: string; readonly remainingClaimAmount: string }
  | { readonly kind: "ACCRUED_PAYABLE"; readonly amount: string }
  | { readonly kind: "OWNERSHIP_PARTITION"; readonly securityId: "FPT"; readonly available: string; readonly pending: string };
export interface AccountingEventProposal {
  readonly id: string; readonly economicKey: string; readonly effect: PreviewEffect;
  readonly economicEffectiveDate: string | null; readonly economicEffectiveAt: null;
  readonly observedAsOfDate: string | null; readonly brokerActionId: null;
  readonly evidence: readonly AccountingEvidencePin[];
  readonly ledgerRelationship: string; readonly costBasisDelta: "0";
  readonly requiredAuthorization: string; readonly blockers: readonly string[];
}
export interface AccountingEventPlan {
  readonly version: "wp1-accounting-preview-v1"; readonly portfolioId: string;
  readonly ledgerWatermark: string; readonly ledgerReplayAsOf: string; readonly ledgerHash: string; readonly evidenceHash: string;
  readonly events: readonly AccountingEventProposal[];
  readonly productionApplication: "BLOCKED"; readonly postingCommands: readonly never[];
}
export type AccountingHash = (value: unknown) => string;
const same = (a: unknown, b: unknown) => settlementCanonical(a) === settlementCanonical(b);

/** Creates proposals from verified retained evidence, not executable TransactionInput payloads. */
export function proposeWp1Events(state: PortfolioState, history: readonly Transaction[], evidence: Wp1Evidence, hash: AccountingHash): AccountingEventPlan {
  requireRule(state.portfolioId === evidence.portfolioId && evidence.ownership.accountReference === evidence.accountReference, "WP1_ACCOUNT_SOURCE_MISMATCH");
  for (const pin of [evidence.openingEvidence, evidence.ownerEvidence, evidence.receiptEvidence, evidence.feeEvidence, evidence.feePolicyEvidence, evidence.openingHoldings, evidence.latestHoldings]) {
    requireRule(!!pin.id.trim() && /^[a-f0-9]{64}$/.test(pin.sha256) && pin.pointer.startsWith("/"), "WP1_EVIDENCE_BINDING_REQUIRED");
    if (pin.retrievedAt !== null) instant(pin.retrievedAt);
    if (pin.knownAt !== null) instant(pin.knownAt);
  }
  dateOnly(evidence.receipt.receiptDate); dateOnly(evidence.receipt.recordDate); dateOnly(evidence.fee.asOfDate);
  requireRule(evidence.receipt.recordDate <= evidence.receipt.receiptDate && decimal(evidence.receipt.amount).positive && decimal(evidence.fee.amount).positive, "WP1_EVENT_FACTS_INVALID");
  requireRule(evidence.ownership.sourceReference === evidence.latestHoldings.id && evidence.ownership.receivedAt === evidence.latestHoldings.retrievedAt, "WP1_ACCOUNT_SOURCE_MISMATCH");
  requireRule(!history.some(t => t.facts.dividendSettlement?.receipt.id === evidence.receipt.id), "DUPLICATE_DIVIDEND_RECEIPT");
  requireRule(history.every(t => t.facts.type === "OPENING_BALANCE") && decimal(state.cash).eq(decimal(evidence.openingBalances.cash)) && decimal(state.receivables).eq(decimal(evidence.openingBalances.receivables)) && decimal(state.payables).isZero, "WP1_OPENING_BASELINE_CHANGED_REPLAN_REQUIRED");
  const opening = history.find(t => t.facts.type === "OPENING_BALANCE" && t.facts.opening?.evidence === evidence.openingEvidence.id && t.legs.some(l => l.type === "RECEIVABLE"));
  const claim = opening?.legs.find(l => l.type === "RECEIVABLE" && !l.settlementReference);
  requireRule(claim && state.obligations.some(o => o.id === claim.id && decimal(o.amount).units >= decimal(evidence.receipt.amount).units), "WP1_ORIGINAL_CLAIM_UNAVAILABLE");
  const held = (id: string) => { const p = state.positions.find(p => p.securityId === id); requireRule(p, "WP1_LEDGER_POSITION_MISSING"); return p; };
  const observed = (id: string) => { const p = evidence.ownership.positions.find(p => p.securityId === id); requireRule(p, "WP1_OBSERVED_POSITION_MISSING");
    requireRule(shareQuantity(p.available).add(shareQuantity(p.pending)).eq(shareQuantity(p.total)), "WP1_OWNERSHIP_PARTITION_MISMATCH"); return p; };
  const tcb = observed("TCB"), fpt = observed("FPT");
  requireRule(decimal(tcb.available).eq(decimal(held("TCB").quantity)) && decimal(tcb.total).sub(decimal(held("TCB").quantity)).eq(decimal(tcb.pending)), "WP1_TCB_OPENING_RELATIONSHIP_MISMATCH");
  requireRule(decimal(fpt.total).eq(decimal(held("FPT").quantity)), "WP1_FPT_ALREADY_OWNED_MISMATCH");
  const common = { economicEffectiveAt: null, brokerActionId: null, costBasisDelta: "0", requiredAuthorization: "SEPARATE_EXACT_EVIDENCE_BOUND_OWNER_POSTING_AUTHORIZATION", } as const;
  const events: AccountingEventProposal[] = [
    { ...common, id: "WP1-TCB-PENDING", economicKey: `${evidence.latestHoldings.id}#/data/stock/6/stockDividend`,
      effect: { kind: "PENDING_OWNERSHIP", securityId: "TCB", delta: tcb.pending, available: tcb.available, pending: tcb.pending },
      economicEffectiveDate: null, observedAsOfDate: null, evidence: [{ ...evidence.latestHoldings, pointer: "/data/stock/6" }, { ...evidence.ownerEvidence, pointer: "/facts/0" }], ledgerRelationship: `EXISTING_OWNERSHIP:TCB:${held("TCB").quantity}`,
      blockers: ["ENTITLEMENT_EFFECTIVE_DATE_UNKNOWN", "EXACT_ECONOMIC_INSTANT_REQUIRED", "CORPORATE_ACTION_ADMISSION_REQUIRED", "PENDING_OWNERSHIP_LEDGER_CAPABILITY_NOT_ACTIVATED"] },
    { ...common, id: "WP1-MWG-RECEIPT", economicKey: `OWNER_EXCEL_RECEIPT:${evidence.receipt.id}`,
      effect: { kind: "CLAIM_TO_CASH", securityId: "MWG", amount: evidence.receipt.amount, receiptId: evidence.receipt.id, originalLegId: claim.id, recordDate: evidence.receipt.recordDate, originalClaimAmount: claim.amount!, remainingClaimAmount: decimal(claim.amount!).sub(decimal(evidence.receipt.amount)).toString() },
      economicEffectiveDate: evidence.receipt.receiptDate, observedAsOfDate: evidence.receipt.receiptDate,
      evidence: [{ ...evidence.openingHoldings, pointer: "/data/stock/4/cashDividend" }, evidence.receiptEvidence, { ...evidence.ownerEvidence, pointer: "/facts/2" }, { ...evidence.latestHoldings, pointer: "/data/stock/4/cashDividend" }], ledgerRelationship: claim.id,
      blockers: ["EXACT_ECONOMIC_INSTANT_REQUIRED", "RECEIPT_KNOWLEDGE_INSTANT_UNKNOWN", "CLAIM_ALLOCATION_AND_SOURCE_ADMISSION_REQUIRED"] },
    { ...common, id: "WP1-CUSTODY-ACCRUAL", economicKey: `CUSTODY_PAYABLE_AS_OF:${evidence.fee.asOfDate}`,
      effect: { kind: "ACCRUED_PAYABLE", amount: evidence.fee.amount }, economicEffectiveDate: null, observedAsOfDate: evidence.fee.asOfDate,
      evidence: [evidence.feeEvidence, evidence.feePolicyEvidence, { ...evidence.ownerEvidence, pointer: "/facts/3" }], ledgerRelationship: `EXISTING_PAYABLES:${state.payables}`,
      blockers: ["ACCRUAL_RECOGNITION_TIME_UNKNOWN", "SOURCE_ADMISSION_REQUIRED", "ACCRUED_LIABILITY_LEDGER_CAPABILITY_NOT_ACTIVATED"] },
    { ...common, id: "WP1-FPT-PARTITION", economicKey: `${evidence.openingHoldings.id}#/data/stock/0/stockDividend`,
      effect: { kind: "OWNERSHIP_PARTITION", securityId: "FPT", available: fpt.available, pending: fpt.pending },
      economicEffectiveDate: null, observedAsOfDate: null, evidence: [{ ...evidence.openingHoldings, pointer: "/data/stock/0" }, { ...evidence.latestHoldings, pointer: "/data/stock/0" }, { ...evidence.ownerEvidence, pointer: "/facts/4" }], ledgerRelationship: `ALREADY_INCLUDED_OWNERSHIP:FPT:${held("FPT").quantity}`,
      requiredAuthorization: "PREVIEW_ONLY_NO_ADDITIONAL_20_SHARE_POSTING;SEPARATE_EVIDENCED_CONVERSION_IF_CLAIMED",
      blockers: ["CORPORATE_ACTION_ADMISSION_REQUIRED", "NO_EVIDENCED_CONVERSION_EVENT", "PENDING_RIGHT_VALUATION_NOT_ACCEPTED"] },
  ];
  return deepFreeze({ version: "wp1-accounting-preview-v1", portfolioId: state.portfolioId, ledgerWatermark: state.ledgerWatermark, ledgerReplayAsOf: state.asOf,
    ledgerHash: hash({ state, history }), evidenceHash: hash(evidence), events, productionApplication: "BLOCKED", postingCommands: [] });
}

export interface AccountingPreviewState {
  readonly cash: string; readonly receivables: string; readonly payables: string;
  readonly accruedExpensesDelta: string;
  readonly positions: readonly { securityId: string; total: string; available: string | null; pending: string | null; openCost: string }[];
  readonly consumedKeys: readonly string[]; readonly receiptIds: readonly string[];
  readonly lineage: readonly AccountingEventProposal[];
  readonly conversions: readonly AvailabilityConversion[];
  readonly commonEconomicCutoff: null; readonly productionAccepted: false;
}
export function initialAccountingPreview(state: PortfolioState): AccountingPreviewState {
  return deepFreeze({ cash: state.cash, receivables: state.receivables, payables: state.payables, accruedExpensesDelta: "0",
    positions: state.positions.map(p => ({ securityId: p.securityId, total: p.quantity, available: null, pending: null, openCost: p.openCost })),
    consumedKeys: [], receiptIds: [], lineage: [], conversions: [], commonEconomicCutoff: null, productionAccepted: false });
}

/** Append-only PREVIEW transition. Equality to the server-generated proposal prevents date/source/effect overrides. */
export function applyAccountingPreview(previous: AccountingPreviewState, event: AccountingEventProposal, trusted: AccountingEventProposal): AccountingPreviewState {
  requireRule(same(event, trusted), "WP1_UNSUPPORTED_EVENT_DATE_OR_SOURCE_BINDING");
  requireRule(!previous.consumedKeys.includes(event.economicKey) && !previous.lineage.some(e => e.id === event.id), "WP1_DUPLICATE_PREVIEW_EVENT");
  const next = { ...previous, positions: previous.positions.map(p => ({ ...p })), consumedKeys: [...previous.consumedKeys, event.economicKey], receiptIds: [...previous.receiptIds], lineage: [...previous.lineage, event] };
  const e = event.effect;
  if (e.kind === "CLAIM_TO_CASH") {
    requireRule(!previous.receiptIds.includes(e.receiptId), "DUPLICATE_DIVIDEND_RECEIPT");
    requireRule(decimal(previous.receivables).units >= decimal(e.amount).units, "WP1_CLAIM_OVER_SETTLEMENT");
    next.cash = decimal(previous.cash).add(decimal(e.amount)).toString(); next.receivables = decimal(previous.receivables).sub(decimal(e.amount)).toString();
    next.receiptIds.push(e.receiptId);
  } else if (e.kind === "ACCRUED_PAYABLE") {
    next.payables = decimal(previous.payables).add(decimal(e.amount)).toString();
    next.accruedExpensesDelta = decimal(previous.accruedExpensesDelta).add(decimal(e.amount)).toString();
  } else {
    const p = next.positions.find(p => p.securityId === e.securityId); requireRule(p, "WP1_PREVIEW_POSITION_MISSING");
    if (e.kind === "PENDING_OWNERSHIP") p.total = shareQuantity(p.total).add(shareQuantity(e.delta)).toString();
    p.available = shareQuantity(e.available).toString(); p.pending = shareQuantity(e.pending).toString();
    requireRule(decimal(p.available).add(decimal(p.pending)).eq(decimal(p.total)), "WP1_PREVIEW_OWNERSHIP_MISMATCH");
  }
  return deepFreeze(next);
}

export interface AvailabilityConversion {
  readonly securityId: string; readonly quantity: string; readonly effectiveAt: string | null;
  readonly source: AccountingEvidencePin; readonly economicKey: string;
}
/** Only an evidence-bound conversion proposal can change availability; aggregate ownership and cost stay fixed. */
export function previewAvailabilityConversion(previous: AccountingPreviewState, conversion: AvailabilityConversion, trusted: AvailabilityConversion, calculatedAt: string) {
  requireRule(same(conversion, trusted) && conversion.effectiveAt !== null, "WP1_CONVERSION_EVIDENCE_REQUIRED");
  const at = instant(conversion.effectiveAt), now = instant(calculatedAt);
  requireRule(conversion.source.knownAt !== null && conversion.source.retrievedAt !== null && !!conversion.source.id.trim() && conversion.source.pointer.startsWith("/") && /^[a-f0-9]{64}$/.test(conversion.source.sha256), "WP1_CONVERSION_EVIDENCE_REQUIRED");
  requireRule(at <= instant(conversion.source.knownAt) && instant(conversion.source.knownAt) <= instant(conversion.source.retrievedAt) && conversion.source.retrievedAt <= now, "WP1_UNSUPPORTED_CONVERSION_TIME");
  requireRule(!previous.consumedKeys.includes(conversion.economicKey) && !!conversion.economicKey.trim(), "WP1_DUPLICATE_PREVIEW_EVENT");
  const positions = previous.positions.map(p => ({ ...p })), p = positions.find(p => p.securityId === conversion.securityId), q = shareQuantity(conversion.quantity);
  requireRule(p && p.pending !== null && p.available !== null && q.positive && shareQuantity(p.pending).units >= q.units, "WP1_CONVERSION_EXCEEDS_PENDING");
  p.pending = decimal(p.pending).sub(q).toString(); p.available = decimal(p.available).add(q).toString();
  requireRule(decimal(p.pending).add(decimal(p.available)).eq(decimal(p.total)), "WP1_PREVIEW_OWNERSHIP_MISMATCH");
  return deepFreeze({ ...previous, positions, consumedKeys: [...previous.consumedKeys, conversion.economicKey], conversions: [...previous.conversions, conversion] });
}

/** No production adapter is provided by this preview. An override cannot turn a proposal into a ledger command. */
export function requireWp1PostingAuthority(plan: AccountingEventPlan): never {
  void plan; throw new Error("WP1_PRODUCTION_POSTING_NOT_AUTHORIZED");
}
