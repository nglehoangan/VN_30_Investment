import { createHash } from "node:crypto";
import { settlementCanonical } from "@/domain/portfolio/dividend-settlement";
import { history, input, NOW, P, W0, at } from "./history";
import { securityId } from "@/domain/portfolio/values";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import type { AccountingEvidencePin, Wp1Evidence } from "@/domain/portfolio/accounting-event-preview";
export const hash = (v: unknown) => createHash("sha256").update(settlementCanonical(v)).digest("hex");
export function previewFixture() {
  const pin = (id: string): AccountingEvidencePin => ({ id, sha256: "a".repeat(64), pointer: "/synthetic", retrievedAt: at(20), knownAt: at(20) });
  const transactions = history([
    input("opening", "OPENING_BALANCE", 1, { amount: "232420", opening: { cost: "0", receivable: "570000", migrationVersion: "SYNTHETIC", evidence: "opening-source" } }),
    input("tcb", "OPENING_BALANCE", 1, { securityId: securityId("TCB"), quantity: "100", opening: { cost: "1000000", migrationVersion: "SYNTHETIC", evidence: "opening-source" } }),
    input("fpt", "OPENING_BALANCE", 1, { securityId: securityId("FPT"), quantity: "220", opening: { cost: "16065060", migrationVersion: "SYNTHETIC", evidence: "opening-source" } }),
  ]);
  const state = reconstructPortfolio(P, transactions, NOW, W0, at(1));
  const evidence: Wp1Evidence = { portfolioId: P, accountReference: "SYNTHETIC_ACCOUNT", openingBalances: { cash: "232420", receivables: "570000" },
    openingEvidence: pin("opening-source"), openingHoldings: pin("opening-holdings"), latestHoldings: pin("latest-holdings"), ownerEvidence: { ...pin("owner-record"), knownAt: null, retrievedAt: null },
    receiptEvidence: { ...pin("receipt"), knownAt: null, retrievedAt: null }, feeEvidence: pin("fee"), feePolicyEvidence: { ...pin("fee-policy"), knownAt: null, retrievedAt: null },
    receipt: { id: "receipt-source-row", issuer: "MWG", amount: "95000", recordDate: "2026-01-08", receiptDate: "2026-01-16" }, fee: { amount: "420", asOfDate: "2026-01-28" },
    ownership: { sourceReference: "latest-holdings", accountReference: "SYNTHETIC_ACCOUNT", receivedAt: at(20), economicAsOf: null,
      positions: [{ securityId: "TCB", total: "150", available: "100", pending: "50", actionReference: null }, { securityId: "FPT", total: "220", available: "200", pending: "20", actionReference: null }] } };
  return { transactions, state, evidence };
}
