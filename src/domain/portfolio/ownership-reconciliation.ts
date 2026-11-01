import { instant } from "@/shared/time";
import { deepFreeze } from "./transaction";
import { decimal, requireRule, shareQuantity } from "./values";

export interface OwnershipObservation {
  readonly sourceReference: string;
  readonly accountReference: string;
  readonly receivedAt: string;
  /** Economic time is not inferred from transport receipt time. */
  readonly economicAsOf: string | null;
  readonly positions: readonly {
    securityId: string; total: string; available: string; pending: string;
    actionReference: string | null;
  }[];
}

/** Diagnostic only: never accepts sources, values pending rights or produces ledger commands. */
export function reconcileOwnership(
  ledger: readonly { securityId: string; quantity: string }[],
  observation: OwnershipObservation,
  scope: { accountReference: string; sourceReference: string; calculatedAt: string; economicAsOf: string; maxReceiptAgeMs: number },
) {
  const calculatedAt = instant(scope.calculatedAt), receivedAt = instant(observation.receivedAt);
  instant(scope.economicAsOf);
  if (observation.economicAsOf !== null) instant(observation.economicAsOf);
  requireRule(Number.isSafeInteger(scope.maxReceiptAgeMs) && scope.maxReceiptAgeMs >= 0, "INVALID_OBSERVATION_AGE_POLICY");
  requireRule(new Set(ledger.map(p => p.securityId)).size === ledger.length, "DUPLICATE_LEDGER_POSITION");
  requireRule(new Set(observation.positions.map(p => p.securityId)).size === observation.positions.length, "DUPLICATE_OBSERVED_POSITION");
  const reasons: string[] = [];
  if (!scope.accountReference.trim() || !scope.sourceReference.trim() || observation.accountReference !== scope.accountReference || observation.sourceReference !== scope.sourceReference) reasons.push("SOURCE_MISMATCH");
  if (receivedAt > calculatedAt) reasons.push("FUTURE_OBSERVATION");
  if (Date.parse(calculatedAt) - Date.parse(receivedAt) > scope.maxReceiptAgeMs) reasons.push("STALE_OBSERVATION");
  if (observation.economicAsOf === null) reasons.push("MISSING_ECONOMIC_CUTOFF");
  else if (observation.economicAsOf !== scope.economicAsOf || observation.economicAsOf > receivedAt) reasons.push("ECONOMIC_CUTOFF_MISMATCH");
  const positions = [...new Set([...ledger.map(p => p.securityId), ...observation.positions.map(p => p.securityId)])].map(securityId => {
    const internal = ledger.find(p => p.securityId === securityId);
    const external = observation.positions.find(p => p.securityId === securityId);
    const quantity = shareQuantity(internal?.quantity ?? "0");
    const issues: string[] = [];
    if (!internal || !external) issues.push("POSITION_PERIMETER_MISMATCH");
    if (!external) return { securityId, ledgerQuantity: quantity.toString(), observedTotal: null, available: null, pending: null, difference: null, issues };
    const total = shareQuantity(external.total), available = shareQuantity(external.available), pending = shareQuantity(external.pending);
    if (!available.add(pending).eq(total)) issues.push("OWNERSHIP_PARTITION_MISMATCH");
    if (!quantity.eq(total)) issues.push("LEDGER_OWNERSHIP_MISMATCH");
    if (pending.positive && !external.actionReference?.trim()) issues.push("MISSING_CORPORATE_ACTION_EVIDENCE");
    return { securityId, ledgerQuantity: quantity.toString(), observedTotal: total.toString(), available: available.toString(), pending: pending.toString(), difference: total.sub(quantity).toString(), issues };
  });
  return deepFreeze({ methodology: "read-only-ownership-reconciliation-v1", sourceReference: observation.sourceReference,
    receivedAt, economicAsOf: observation.economicAsOf, reasons, positions,
    status: reasons.length || positions.some(p => p.issues.length) ? "BLOCKED" : "OBSERVED_MATCH",
    productionAccepted: false, pendingValuationEligible: false, ledgerCommands: [] });
}

/** A scheduled month-end deduction is not actual settlement evidence. */
export function inspectCustodyFee(input: { accrued: string; claimedPaid: boolean; debit: { amount: string; effectiveAt: string; sourceReference: string } | null }) {
  const accrued = decimal(input.accrued);
  requireRule(!accrued.negative, "NEGATIVE_ACCRUED_FEE");
  if (input.debit) {
    instant(input.debit.effectiveAt);
    requireRule(decimal(input.debit.amount).positive && !!input.debit.sourceReference.trim(), "INVALID_FEE_DEBIT_EVIDENCE");
  }
  return deepFreeze({ accrued: accrued.toString(), classification: "ACCRUED_PAYABLE",
    debitAmountMatches: input.debit !== null && decimal(input.debit.amount).eq(accrued),
    settlementSupported: false,
    reason: input.claimedPaid && input.debit === null ? "UNSUPPORTED_FEE_SETTLEMENT" : input.debit !== null ? "DEBIT_REQUIRES_ACCOUNT_OBLIGATION_ADMISSION" : "NO_OBSERVED_DEBIT",
    productionAccepted: false, ledgerCommands: [] });
}
