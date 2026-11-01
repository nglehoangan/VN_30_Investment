// @vitest-environment node
import { execFileSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";
import { reconcileOwnership, type OwnershipObservation } from "@/domain/portfolio/ownership-reconciliation";
import { buildTransaction, type Transaction } from "@/domain/portfolio/transaction";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import { portfolioId, watermark } from "@/domain/portfolio/values";
import { instant } from "@/shared/time";

/** Explicit private-fixture opt-in; never manufactures a passing result when evidence is absent. */
describe.skipIf(process.env.WP1_PRIVATE_DB !== "1")("WP1 actual retained SQLite -> canonical replay -> diagnostics", () => {
  let audit: {
    transactions: Transaction[]; ledgerPositions: { securityId: string; quantity: string }[];
    observation: OwnershipObservation; protectedBytesUnchanged: boolean; accountScopeMatches: boolean;
    receipt: { amountVnd: string; date: string; dividendDescription: string };
    observedBalance: { cashBalance: string; cashDevident: string; depoFee: string };
  };
  beforeAll(() => { audit = JSON.parse(execFileSync("python3", ["scripts/audit-wp1-accounting.py", "--transactions"], { encoding: "utf8" })); });
  it("rebuilds every actual transaction and stored leg without posting", () => {
    expect(audit.transactions).toHaveLength(12);
    for (const tx of audit.transactions) {
      expect(buildTransaction(tx.facts, tx.createdAt, audit.transactions.filter(t => t.facts.id !== tx.facts.id)).legs).toEqual(tx.legs);
    }
    const state = reconstructPortfolio(portfolioId("tcbs-personal-v1"), audit.transactions, instant("2026-10-31T00:00:00.000Z"), watermark("1"), instant("2026-10-08T11:38:01.705Z"));
    expect(state).toMatchObject({ cash: "232420", receivables: "570000", payables: "0" });
    expect(state.positions).toHaveLength(11);
    expect(state.positions.find(p => p.securityId === "FPT")).toMatchObject({ quantity: "220", openCost: "16065060" });
  });
  it("detects actual TCB mismatch while refusing to invent an economic cutoff or CA reference", () => {
    const result = reconcileOwnership(audit.ledgerPositions, audit.observation, {
      accountReference: "PRIVATE_SCOPE_MATCH_VERIFIED", sourceReference: audit.observation.sourceReference,
      calculatedAt: "2026-10-29T05:00:00.000Z", economicAsOf: "2026-10-29T04:56:24.764Z", maxReceiptAgeMs: 300000,
    });
    expect(result.reasons).toContain("MISSING_ECONOMIC_CUTOFF");
    expect(result.positions.find(p => p.securityId === "TCB")).toMatchObject({ difference: "50", available: "100", pending: "50" });
    expect(result.positions.find(p => p.securityId === "FPT")).toMatchObject({ difference: "0", observedTotal: "220", available: "200", pending: "20" });
    expect(result.positions.filter(p => p.difference !== "0").map(p => p.securityId)).toEqual(["TCB"]);
    expect(result).toMatchObject({ status: "BLOCKED", pendingValuationEligible: false, ledgerCommands: [] });
  });
  it("reuses the sourced MWG receipt and leaves fee payable", () => {
    expect(audit.receipt).toMatchObject({ amountVnd: "95000", date: "2026-10-16" });
    expect(audit.receipt.dividendDescription).toContain("MWG");
    expect(audit.receipt.dividendDescription).toContain("08/10/2026");
    expect(audit.observedBalance).toMatchObject({ cashBalance: "327420", cashDevident: "475000", depoFee: "420" });
    expect(audit.accountScopeMatches).toBe(true); expect(audit.protectedBytesUnchanged).toBe(true);
  });
});
