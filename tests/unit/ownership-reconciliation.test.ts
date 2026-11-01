import { describe, expect, it } from "vitest";
import { inspectCustodyFee, reconcileOwnership, type OwnershipObservation } from "@/domain/portfolio/ownership-reconciliation";
const scope = { accountReference: "account", sourceReference: "retained-holdings", calculatedAt: "2026-10-29T05:00:00.000Z", economicAsOf: "2026-10-29T04:56:00.000Z", maxReceiptAgeMs: 300000 };
const observation = (): OwnershipObservation => ({ accountReference: "account", sourceReference: "retained-holdings", receivedAt: "2026-10-29T04:56:24.764Z", economicAsOf: scope.economicAsOf,
  positions: [{ securityId: "TCB", total: "150", available: "100", pending: "50", actionReference: null }, { securityId: "FPT", total: "220", available: "200", pending: "20", actionReference: null }] });
const ledger = [{ securityId: "TCB", quantity: "100" }, { securityId: "FPT", quantity: "220" }];
describe("read-only ownership diagnostics", () => {
  it("detects TCB +50 and preserves FPT ownership without changing input or granting valuation", () => {
    const o = observation(), before = JSON.stringify(o), result = reconcileOwnership(ledger, o, scope);
    expect(result.positions).toMatchObject([{ difference: "50", available: "100", pending: "50", issues: ["LEDGER_OWNERSHIP_MISMATCH", "MISSING_CORPORATE_ACTION_EVIDENCE"] }, { difference: "0", available: "200", pending: "20", issues: ["MISSING_CORPORATE_ACTION_EVIDENCE"] }]);
    expect(result).toMatchObject({ status: "BLOCKED", productionAccepted: false, pendingValuationEligible: false, ledgerCommands: [] });
    expect(JSON.stringify(o)).toBe(before); expect(Object.isFrozen(result.positions)).toBe(true);
  });
  it.each([["pending treated as tradable", "150", "50"], ["incorrect total", "100", "70"]])("blocks %s", (_, available, pending) => {
    const o = observation(); o.positions[0].available = available; o.positions[0].pending = pending;
    expect(reconcileOwnership(ledger, o, scope).positions[0].issues).toContain("OWNERSHIP_PARTITION_MISMATCH");
  });
  it("rejects adding another 20 FPT", () => {
    const o = observation(); o.positions[1].total = "240";
    expect(reconcileOwnership(ledger, o, scope).positions[1].issues).toEqual(["OWNERSHIP_PARTITION_MISMATCH", "LEDGER_OWNERSHIP_MISMATCH", "MISSING_CORPORATE_ACTION_EVIDENCE"]);
  });
  it.each(["accountReference", "sourceReference"] as const)("blocks %s mismatch", key => {
    expect(reconcileOwnership(ledger, { ...observation(), [key]: "wrong" }, scope).reasons).toContain("SOURCE_MISMATCH");
  });
  it("blocks stale and future receipt", () => {
    expect(reconcileOwnership(ledger, observation(), { ...scope, maxReceiptAgeMs: 1 }).reasons).toContain("STALE_OBSERVATION");
    expect(reconcileOwnership(ledger, { ...observation(), receivedAt: "2026-10-30T00:00:00.000Z" }, scope).reasons).toContain("FUTURE_OBSERVATION");
  });
  it("does not invent a common economic time from receipt", () => {
    expect(reconcileOwnership(ledger, { ...observation(), economicAsOf: null }, scope).reasons).toContain("MISSING_ECONOMIC_CUTOFF");
    expect(reconcileOwnership(ledger, { ...observation(), economicAsOf: scope.calculatedAt }, scope).reasons).toContain("ECONOMIC_CUTOFF_MISMATCH");
  });
  it("a separately evidenced availability conversion conserves FPT aggregate ownership", () => {
    const o = observation(); Object.assign(o.positions[1], { total: "220", available: "220", pending: "0", actionReference: "synthetic-conversion" });
    const result = reconcileOwnership(ledger, o, scope);
    expect(result.positions[1]).toMatchObject({ difference: "0", observedTotal: "220", available: "220", pending: "0", issues: [] });
    expect(result.ledgerCommands).toEqual([]);
    expect(ledger[1].quantity).toBe("220");
  });
  it("requires complete position perimeter", () => expect(reconcileOwnership(ledger, { ...observation(), positions: [] }, scope).positions.every(p => p.issues.includes("POSITION_PERIMETER_MISMATCH"))).toBe(true));
  it("rejects duplicates and fractional/negative shares", () => {
    expect(() => reconcileOwnership([...ledger, ledger[0]], observation(), scope)).toThrow();
    const o = observation(); o.positions[0].pending = "-1"; expect(() => reconcileOwnership(ledger, o, scope)).toThrow();
    o.positions[0].pending = "0.5"; expect(() => reconcileOwnership(ledger, o, scope)).toThrow();
    expect(() => reconcileOwnership(ledger, { ...observation(), positions: [o.positions[1], o.positions[1]] }, scope)).toThrow();
  });
  it("even a synthetic match never grants accounting or valuation authority", () => {
    const o = observation(); o.positions.forEach(p => { p.actionReference = "synthetic-action"; });
    expect(reconcileOwnership([{ securityId: "TCB", quantity: "150" }, ledger[1]], o, scope)).toMatchObject({ status: "OBSERVED_MATCH", productionAccepted: false, pendingValuationEligible: false });
  });
});
describe("custody payable versus actual debit", () => {
  it("retains unpaid 420 without inventing payment", () => expect(inspectCustodyFee({ accrued: "420", claimedPaid: false, debit: null })).toMatchObject({ classification: "ACCRUED_PAYABLE", settlementSupported: false, ledgerCommands: [] }));
  it("blocks unsupported fee settlement", () => expect(inspectCustodyFee({ accrued: "420", claimedPaid: true, debit: null })).toMatchObject({ settlementSupported: false, reason: "UNSUPPORTED_FEE_SETTLEMENT" }));
  it("an unmatched debit cannot settle the obligation", () => expect(inspectCustodyFee({ accrued: "420", claimedPaid: true, debit: { amount: "419", effectiveAt: scope.calculatedAt, sourceReference: "debit" } }).settlementSupported).toBe(false));
  it("a matching debit still requires admission and grants no posting", () => expect(inspectCustodyFee({ accrued: "420", claimedPaid: true, debit: { amount: "420", effectiveAt: scope.calculatedAt, sourceReference: "debit" } })).toMatchObject({ debitAmountMatches: true, settlementSupported: false, productionAccepted: false, reason: "DEBIT_REQUIRES_ACCOUNT_OBLIGATION_ADMISSION" }));
});
