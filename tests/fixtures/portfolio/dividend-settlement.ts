import { createHash } from "node:crypto";
import { settlementCanonical } from "@/domain/portfolio/dividend-settlement";
import { input, P, A, B, at, NOW } from "./history";
import type { TransactionInput } from "@/domain/portfolio/transaction";
import type { DividendAllocation } from "@/domain/portfolio/dividend-settlement";
import type { DividendSettlementAuthority } from "@/infrastructure/repositories/dividend-settlement-guard";
export const evidence = [{ reference: "SYNTHETIC_ONLY", sha256: "a".repeat(64), pointer: "/fixture", knownAt: at(2) }];
export const openingClaim = () => input("opening-claim", "OPENING_BALANCE", 1, { amount: "10", opening: { cost: "0", receivable: "100", migrationVersion: "fixture-v1", evidence: "SYNTHETIC_ONLY" } });
export const openingPosition = () => input("opening-position", "OPENING_BALANCE", 1, { securityId: A, quantity: "2", opening: { cost: "20", migrationVersion: "fixture-v1", evidence: "SYNTHETIC_ONLY" } });
export const allocation = (): DividendAllocation => ({ id: "fixture-allocation", portfolioId: P, originalTransactionId: "opening-claim", originalLegId: "opening-claim:leg:2", currency: "VND", basis: "NET", acceptanceReference: "SYNTHETIC_ACCEPTANCE_NOT_PRODUCTION", knownAt: at(2), claims: [{ id: "claim-a", securityId: A, actionId: "action-a", amount: "70", evidence }, { id: "claim-b", securityId: B, actionId: "action-b", amount: "30", evidence }] });
export function receipt(id = "s1", amount = "70", day = 3): TransactionInput {
  return input(id, "DIVIDEND_RECEIVABLE_SETTLEMENT", day, { amount, securityId: A, dividendSettlement: { version: "dividend-receivable-settlement-v1", correctionOf: null, allocation: allocation(), claimId: "claim-a", actionId: "action-a", knownAt: NOW, receipt: { namespace: "SYNTHETIC", id: `receipt-${id}`, portfolioId: P, securityId: A, actionId: "action-a", currency: "VND", net: amount, effectiveAt: at(day), knownAt: NOW, evidence } } });
}
/** ONLY tests. Models trusted accepted-record lookup; never installed in application composition. */
export const syntheticAuthority: DividendSettlementAuthority = {
  async authorize(_tx, event, original) {
    if (!event.dividendSettlement && !original?.dividendSettlement) throw Error("invalid fixture scope");
    const s = event.dividendSettlement ?? original!.dividendSettlement!;
    const hash = (v: unknown) => createHash("sha256").update(settlementCanonical(v)).digest("hex");
    return { acceptanceReference: "SYNTHETIC_ACCEPTANCE_NOT_PRODUCTION", verifierReference: "SYNTHETIC_DISTINCT_VALIDATOR", allocationHash: hash(s.allocation), receiptHash: hash(s.receipt) };
  },
  async receiptIdentity(_tx, f) { return f.dividendSettlement ? { namespace: f.dividendSettlement.receipt.namespace, id: f.dividendSettlement.receipt.id } : { namespace: "SYNTHETIC", id: f.source.reference }; },
};
