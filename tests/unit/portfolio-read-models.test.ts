import { describe, it, expect } from "vitest";
import { valuePortfolio, type ValuationInputs } from "@/domain/portfolio/valuation";
import { reconcilePortfolio, type ReconciliationEvidence } from "@/domain/portfolio/reconciliation";
import { referenceAt, type ReferenceData } from "@/domain/portfolio/reference";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import { dateOnly } from "@/shared/time";
import { securityId } from "@/domain/portfolio/values";
import { P, A, B, NOW, W0, at, deposit, history, goldenInputs } from "../fixtures/portfolio/history";
const state = () => reconstructPortfolio(P, history(goldenInputs()), at(12), W0);
export const prices = (): ValuationInputs => ({ version: "prices-fixture-v1", methodologyId: "valuation-fixture-v1", observations: [
  { id: "price-a", securityId: A, price: "15", currency: "VND", observedAt: at(12), receivedAt: at(12), validThrough: at(12), sourceReference: "fixture-a" },
  { id: "price-b", securityId: B, price: "60", currency: "VND", observedAt: at(12), receivedAt: at(12), validThrough: at(12), sourceReference: "fixture-b" }] });
const evidence = (): ReconciliationEvidence => ({ id: "statement", portfolioId: P, asOf: at(12), receivedAt: at(12), sourceReference: "fixture-statement", cash: "8270", receivables: "0", payables: "0", unresolvedDiscrepancy: false,
  positions: [{ securityId: A, quantity: "90", openCost: "966" }, { securityId: B, quantity: "20", openCost: "1000" }] });
describe("M6.3 Valuation", () => {
  it("multi-security hand-audited NAV/unrealized/weights include cash and obligations", () => {
    expect(valuePortfolio(state(), prices())).toMatchObject({ nav: "10820", marketValue: "2550", unrealizedPnl: "584", economicPnl: "920", status: "VALID", positions: [{ marketValue: "1350", unrealizedPnl: "384", weight: "0.124768946396" }, { marketValue: "1200", unrealizedPnl: "200" }] });
  });
  it("unsettled BUY payable is subtracted from NAV before cash settlement", () => {
    const s = reconstructPortfolio(P, history(goldenInputs()), at(2), W0);
    const p = { ...prices(), observations: [{ ...prices().observations[0], observedAt: at(2), receivedAt: at(2), validThrough: at(2), price: "10" }] };
    expect(valuePortfolio(s, p)).toMatchObject({ nav: "9990", unrealizedPnl: "-10", economicPnl: "-10" });
  });
  it("VC-MD03 missing price cannot become zero NAV", () => expect(valuePortfolio(state(), { ...prices(), observations: [] })).toMatchObject({ status: "BLOCKED", nav: null, positions: [{ marketValue: null }, { marketValue: null }] }));
  it("stale price carries stale provenance and blocks official NAV", () => expect(valuePortfolio({ ...state(), asOf: at(13) }, prices())).toMatchObject({ status: "BLOCKED", nav: null, positions: [{ priceStatus: "STALE", priceId: "price-a" }, { priceStatus: "STALE" }] }));
  it("future observations cannot value historical state", () => expect(valuePortfolio({ ...state(), asOf: at(11) }, prices()).nav).toBeNull());
  it("conflicting prices block instead of choosing arbitrarily", () => { const p = prices(); expect(valuePortfolio(state(), { ...p, observations: [...p.observations, { ...p.observations[0], id: "conflict", price: "16" }] }).positions[0].priceStatus).toBe("CONFLICTING_DATA"); });
  it("contributions do not create investment profit", () => expect(valuePortfolio(reconstructPortfolio(P, history([deposit()]), at(1), W0), { ...prices(), observations: [] })).toMatchObject({ nav: "10000", economicPnl: "0" }));
  it("imported inception does not invent lifetime profit", () => expect(valuePortfolio({ ...state(), supportedInception: "IMPORTED" }, prices()).economicPnl).toBeNull());
});
describe("M6.3 Reconciliation", () => {
  it("VC-RC01 exact match", () => expect(reconcilePortfolio(state(), evidence(), NOW)).toMatchObject({ status: "MATCH", actionabilityBlocked: false }));
  it("VC-RC02 cash mismatch preserves internal cash and reports external minus internal", () => { const s = state(), r = reconcilePortfolio(s, { ...evidence(), cash: "8271" }, NOW); expect(s.cash).toBe("8270"); expect(r).toMatchObject({ status: "MISMATCH", actionabilityBlocked: true, differences: expect.arrayContaining([{ field: "cash", securityId: null, internal: "8270", external: "8271", difference: "1", material: true }]) }); });
  it("VC-RC03 quantity mismatch", () => expect(reconcilePortfolio(state(), { ...evidence(), positions: [] }, NOW).status).toBe("MISMATCH"));
  it("VC-RC04 stale reference cannot MATCH", () => expect(reconcilePortfolio(state(), { ...evidence(), asOf: at(11) }, NOW).status).toBe("NOT_COMPARABLE"));
  it("missing reference evidence blocks", () => expect(reconcilePortfolio(state(), null, NOW).status).toBe("MISSING_EVIDENCE"));
  it("unresolved discrepancy blocks even matching balances", () => expect(reconcilePortfolio(state(), { ...evidence(), unresolvedDiscrepancy: true }, NOW).status).toBe("MISMATCH"));
  it("cost basis and obligations participate in comparison", () => expect(reconcilePortfolio(state(), { ...evidence(), payables: "1", positions: [{ securityId: A, quantity: "90", openCost: "965" }, evidence().positions[1]] }, NOW).status).toBe("MISMATCH"));
  it("missing cost evidence cannot assert fully reconciled", () => expect(reconcilePortfolio(state(), { ...evidence(), positions: evidence().positions.map(p => ({ ...p, openCost: null })) }, NOW).status).toBe("MISSING_EVIDENCE"));
});
describe("M6.3 effective reference data", () => {
  const refs = (): ReferenceData => ({ version: "reference-v1", intervals: [
    { id: "old-ticker", kind: "IDENTIFIER", securityId: A, from: dateOnly("2025-01-01"), to: dateOnly("2026-01-05"), value: "OLD", taxonomy: null, sourceReference: "old" },
    { id: "new-ticker", kind: "IDENTIFIER", securityId: A, from: dateOnly("2026-01-05"), to: null, value: "NEW", taxonomy: null, sourceReference: "new" },
    { id: "sector", kind: "SECTOR", securityId: A, from: dateOnly("2026-01-05"), to: null, value: "TECH", taxonomy: "taxonomy-v1", sourceReference: "classification" }] });
  it("historical ticker and sector never use today's classification retroactively", () => {
    expect(referenceAt(refs(), A, dateOnly("2026-01-04"), "taxonomy-v1")).toMatchObject({ identifier: "OLD", sector: null, membership: "UNKNOWN_OR_UNSUPPORTED" });
    expect(referenceAt(refs(), A, dateOnly("2026-01-05"), "taxonomy-v1")).toMatchObject({ identifier: "NEW", sector: "TECH" });
  });
  it("no membership interval is false only within complete 30-member coverage", () => {
    const r = refs(); const intervals: ReferenceData["intervals"][number][] = [...r.intervals, { id: "coverage", kind: "COVERAGE", securityId: null, from: dateOnly("2026-01-01"), to: null, value: "COMPLETE_CONFIRMED", taxonomy: null, sourceReference: "complete-list" }];
    for (let i = 0; i < 30; i++) intervals.push({ id: `m${i}`, kind: "MEMBERSHIP", securityId: securityId(`other-${i}`), from: dateOnly("2026-01-01"), to: null, value: "MEMBER", taxonomy: null, sourceReference: "index-event" });
    expect(referenceAt({ ...r, intervals }, A, dateOnly("2026-01-12"), "taxonomy-v1").membership).toBe("NON_MEMBER_CONFIRMED");
    expect(referenceAt({ ...r, intervals: intervals.slice(0, -1) }, A, dateOnly("2026-01-12"), "taxonomy-v1").membership).toBe("UNKNOWN_OR_UNSUPPORTED");
  });
  it("overlapping identifier history blocks", () => { const r = refs(); expect(() => referenceAt({ ...r, intervals: [...r.intervals, { ...r.intervals[0], id: "overlap" }] }, A, dateOnly("2026-01-01"), "taxonomy-v1")).toThrow(); });
});
