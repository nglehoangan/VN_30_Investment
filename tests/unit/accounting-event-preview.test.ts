import { describe, expect, it, vi } from "vitest";
import { proposeWp1Events, applyAccountingPreview, initialAccountingPreview, previewAvailabilityConversion, requireWp1PostingAuthority } from "@/domain/portfolio/accounting-event-preview";
import { PortfolioAccountingValidation } from "@/application/portfolio/accounting-validation";
import { previewFixture, hash } from "../fixtures/portfolio/accounting-preview";
import { P, W0, NOW, at } from "../fixtures/portfolio/history";
const rule = (reason: RegExp) => expect.objectContaining({ issues: expect.arrayContaining([expect.objectContaining({ reason: expect.stringMatching(reason) })]) });
const setup = () => { const f = previewFixture(); return { ...f, plan: proposeWp1Events(f.state, f.transactions, f.evidence, hash) }; };
describe("evidence-bound WP1 event proposals", () => {
  it("preserves date precision, null action IDs and unknown original knowledge timestamps", () => {
    const { plan } = setup(); expect(plan.events).toHaveLength(4);
    expect(plan.events.map(e => e.economicEffectiveAt)).toEqual([null, null, null, null]);
    expect(plan.events.map(e => e.brokerActionId)).toEqual([null, null, null, null]);
    expect(plan.events[1]).toMatchObject({ economicEffectiveDate: "2026-01-16", costBasisDelta: "0", ledgerRelationship: "opening:leg:2" });
    expect(plan.events[1].evidence[1].knownAt).toBeNull();
    expect(plan.events[2]).toMatchObject({ economicEffectiveDate: null, observedAsOfDate: "2026-01-28" });
    expect(plan).toMatchObject({ productionApplication: "BLOCKED", postingCommands: [] });
  });
  it("projects the separate economic components without creating income, cash adjustments or purchase basis", () => {
    const { state, plan } = setup(), before = JSON.stringify(state);
    const projected = plan.events.reduce((s, event) => applyAccountingPreview(s, event, event), initialAccountingPreview(state));
    expect(projected).toMatchObject({ cash: "327420", receivables: "475000", payables: "420", accruedExpensesDelta: "420", commonEconomicCutoff: null, productionAccepted: false });
    expect(projected.positions).toEqual([{ securityId: "FPT", total: "220", available: "200", pending: "20", openCost: "16065060" }, { securityId: "TCB", total: "150", available: "100", pending: "50", openCost: "1000000" }]);
    expect(JSON.stringify(state)).toBe(before); expect(projected.lineage).toEqual(plan.events); expect(Object.isFrozen(projected.lineage)).toBe(true);
  });
  it.each([0, 1, 2, 3])("rejects duplicate event %s", i => {
    const { state, plan } = setup(), event = plan.events[i];
    const once = applyAccountingPreview(initialAccountingPreview(state), event, event);
    expect(() => applyAccountingPreview(once, event, event)).toThrow(rule(/WP1_DUPLICATE_PREVIEW_EVENT/));
  });
  it("rejects the same receipt under another transport identity", () => {
    const { state, plan } = setup(), event = plan.events[1];
    const once = applyAccountingPreview(initialAccountingPreview(state), event, event);
    const renamed = { ...event, id: "another", economicKey: "another" };
    expect(() => applyAccountingPreview(once, renamed, renamed)).toThrow(rule(/DUPLICATE_DIVIDEND_RECEIPT/));
  });
  it.each(["timestamp", "date", "source", "amount", "action"]) ("rejects unsupported %s overrides", key => {
    const { state, plan } = setup(), trusted = plan.events[1];
    const event = JSON.parse(JSON.stringify(trusted));
    if (key === "timestamp") event.economicEffectiveAt = "2026-01-16T00:00:00.000Z";
    if (key === "date") event.economicEffectiveDate = "2026-01-17";
    if (key === "source") event.evidence[0].sha256 = "b".repeat(64);
    if (key === "amount") event.effect.amount = "95001";
    if (key === "action") event.brokerActionId = "invented-action";
    expect(() => applyAccountingPreview(initialAccountingPreview(state), event, trusted)).toThrow(rule(/WP1_UNSUPPORTED_EVENT_DATE_OR_SOURCE_BINDING/));
  });
  it("rejects a changed opening baseline and source identity", () => {
    const { state, transactions, evidence } = previewFixture();
    expect(() => proposeWp1Events({ ...state, cash: "327420" }, transactions, evidence, hash)).toThrow(rule(/WP1_OPENING_BASELINE_CHANGED/));
    expect(() => proposeWp1Events(state, transactions, { ...evidence, accountReference: "wrong" }, hash)).toThrow(rule(/WP1_ACCOUNT_SOURCE_MISMATCH/));
    expect(() => proposeWp1Events(state, transactions, { ...evidence, latestHoldings: { ...evidence.latestHoldings, id: "wrong-source" } }, hash)).toThrow(rule(/WP1_ACCOUNT_SOURCE_MISMATCH/));
  });
  it("cannot turn a preview into posting authorization", () => expect(() => requireWp1PostingAuthority(setup().plan)).toThrow(/WP1_PRODUCTION_POSTING_NOT_AUTHORIZED/));
});
describe("pending-to-available lifecycle preview only", () => {
  const converted = () => {
    const { state, plan, evidence } = setup();
    const preview = plan.events.reduce((s, e) => applyAccountingPreview(s, e, e), initialAccountingPreview(state));
    const c = { securityId: "FPT", quantity: "20", effectiveAt: at(20) as string | null, source: evidence.latestHoldings, economicKey: "SYNTHETIC_CONVERSION_ONLY" };
    return { preview, c };
  };
  it("conserves ownership and cost through evidenced conversion and rejects duplicates", () => {
    const { preview, c } = converted(), next = previewAvailabilityConversion(preview, c, c, NOW);
    expect(next.positions.find(p => p.securityId === "FPT")).toMatchObject({ total: "220", available: "220", pending: "0", openCost: "16065060" });
    expect(next.conversions).toEqual([c]); expect(() => previewAvailabilityConversion(next, c, c, NOW)).toThrow(rule(/WP1_DUPLICATE_PREVIEW_EVENT/));
  });
  it("rejects unevidenced, excessive or foreign-source conversion", () => {
    const { preview, c } = converted();
    expect(() => previewAvailabilityConversion(preview, { ...c, effectiveAt: null }, { ...c, effectiveAt: null }, NOW)).toThrow(rule(/WP1_CONVERSION_EVIDENCE_REQUIRED/));
    expect(() => previewAvailabilityConversion(preview, { ...c, quantity: "21" }, { ...c, quantity: "21" }, NOW)).toThrow(rule(/WP1_CONVERSION_EXCEEDS_PENDING/));
    expect(() => previewAvailabilityConversion(preview, { ...c, source: { ...c.source, id: "foreign" } }, c, NOW)).toThrow(rule(/WP1_CONVERSION_EVIDENCE_REQUIRED/));
  });
});
describe("application accounting validation workflow", () => {
  const service = () => {
    const f = previewFixture(), read = vi.fn(async () => ({ watermark: W0, inceptionAt: at(1), transactions: f.transactions })), evidenceRead = vi.fn(async () => f.evidence);
    return { read, evidenceRead, service: new PortfolioAccountingValidation({ read }, { read: evidenceRead }, hash), f };
  };
  const input = { portfolioId: P, expectedWatermark: W0, ledgerAsOf: NOW, calculatedAt: NOW, maxReceiptAgeMs: 400 * 86400000 };
  it("connects both before/projected ownership guards and never grants NAV or trading authority", async () => {
    const { service: s, read } = service(), result = await s.preview(input);
    expect(result.reconciliation.positions.find(p => p.securityId === "TCB")?.issues).toContain("LEDGER_OWNERSHIP_MISMATCH");
    expect(result.projectedReconciliation.positions.find(p => p.securityId === "TCB")?.issues).not.toContain("LEDGER_OWNERSHIP_MISMATCH");
    expect(result.projectedReconciliation.positions.find(p => p.securityId === "FPT")?.issues).toContain("MISSING_CORPORATE_ACTION_EVIDENCE");
    expect(result.reconciliation.reasons).toContain("MISSING_ECONOMIC_CUTOFF");
    expect(result).toMatchObject({ status: "BLOCKED", productionAccepted: false, navAuthorized: false, tradingAuthorized: false, postingCommands: [] }); expect(read).toHaveBeenCalledTimes(2);
  });
  it("preserves stale observation block", async () => expect((await service().service.preview({ ...input, maxReceiptAgeMs: 0 })).reconciliation.reasons).toContain("STALE_OBSERVATION"));
  it("rejects wrong scope, stale revision, future evidence and evidence changing during the read", async () => {
    const s = service(); s.evidenceRead.mockResolvedValueOnce({ ...s.f.evidence, accountReference: "foreign" }); await expect(s.service.preview(input)).rejects.toThrow(rule(/WP1_ACCOUNT_SOURCE_MISMATCH/));
    const r = service(); await expect(r.service.preview({ ...input, expectedWatermark: "999" as never })).rejects.toThrow(rule(/WP1_STALE_LEDGER_REVISION/));
    const t = service(); t.evidenceRead.mockResolvedValueOnce({ ...t.f.evidence, ownerEvidence: { ...t.f.evidence.ownerEvidence, knownAt: "2030-01-01T00:00:00.000Z" } }); await expect(t.service.preview(input)).rejects.toThrow(rule(/WP1_FUTURE_EVIDENCE/));
    const e = service(); e.evidenceRead.mockResolvedValueOnce(e.f.evidence).mockResolvedValueOnce({ ...e.f.evidence, accountReference: "changed" }); await expect(e.service.preview(input)).rejects.toThrow(rule(/WP1_EVIDENCE_CHANGED_DURING_PREVIEW/));
  });
  it("rejects noncanonical saved accounting legs", async () => {
    const s = service(), transactions = JSON.parse(JSON.stringify(s.f.transactions));
    transactions[0].legs[0].amount = "232421";
    s.read.mockResolvedValueOnce({ watermark: W0, inceptionAt: at(1), transactions });
    await expect(s.service.preview(input)).rejects.toThrow(rule(/WP1_NONCANONICAL_LEDGER/));
  });
  it("rejects ledger drift and incomplete ledger horizons", async () => {
    const s = service(); s.read.mockResolvedValueOnce({ watermark: W0, inceptionAt: at(1), transactions: s.f.transactions }).mockResolvedValueOnce({ watermark: "1" as never, inceptionAt: at(1), transactions: s.f.transactions });
    await expect(s.service.preview(input)).rejects.toThrow(rule(/WP1_LEDGER_CHANGED_DURING_PREVIEW/));
    await expect(service().service.preview({ ...input, ledgerAsOf: "2026-01-01T00:00:00.000Z" })).rejects.toThrow(rule(/WP1_LEDGER_CUTOFF_INCOMPLETE/));
  });
});
