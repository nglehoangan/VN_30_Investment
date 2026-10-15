import { describe, expect, it } from "vitest";
import { createReview, WEEKLY_AREAS, QUARTERLY_AREAS, ANNUAL_AREAS, suggestedAuditDate } from "@/domain/workflow/reviews";
import { validateReview } from "@/domain/workflow/validation";
import { BIASES } from "@/domain/workflow/contracts";
import { workflowFixture, sections, NOW } from "../fixtures/workflow";
function weekly() { const p = workflowFixture(); p.command.type = "WEEKLY"; p.command.sections = sections(WEEKLY_AREAS); return p; }
function event(severity: "T0" | "T1" | "T2" | "T3" | "T4", verified = true) {
  return { id: "event-1", category: "COMPANY" as const, priority: "HARD RISK / SOLVENCY / GOVERNANCE" as const, severity, effectiveAt: NOW, evidenceRefs: ["decision-evidence"], verified, decisionReady: verified && ["T3", "T4"].includes(severity), governingRule: "M5 EVENT_DRIVEN_REVIEW §4", affectedSecurityId: null, requiredEvidence: "Validated issuer disclosure and underwriting", rationale: "Material governance evidence" };
}
describe("M5 review workflows", () => {
  it("ordinary week has NO ACTION, no score/rank/decision refresh, no trade", () => { const r = createReview(weekly()); expect(r.disposition).toBe("NO ACTION"); expect(r.refresh).toEqual({ score: false, ranking: false, valuation: false, decision: false }); expect(r.proposal).toBeNull(); });
  it("week elapsed alone does not force a refresh with valid evidence", () => { const p = weekly(); p.command.reviewDate = "2026-10-08T09:00:00.000Z"; p.recordedAt = p.command.reviewDate; p.command.evidence.forEach(e => { e.validThrough = p.command.reviewDate; }); expect(createReview(p).disposition).toBe("NO ACTION"); });
  it("missing surveillance checks cannot become a completed clean week", () => { const p = weekly(); p.command.sections = []; expect(createReview(p).disposition).toBe("REVIEW REQUIRED"); });
  it.each(["T0", "T1", "T2", "T3", "T4"] as const)("event severity %s routes without a trade", severity => { const p = weekly(); p.command.type = "EVENT_DRIVEN"; p.command.triggers = [event(severity)]; const r = createReview(p); expect(r.disposition).toBe(severity === "T0" ? "NO ACTION" : ["T3", "T4"].includes(severity) ? "DECISION REQUIRED" : "REVIEW REQUIRED"); expect(r.proposal).toBeNull(); if (severity === "T4") expect(r.status).toBe("ESCALATED"); });
  it("unverified severe allegation requires review, never a manufactured decision", () => { const p = weekly(); p.command.triggers = [event("T4", false)]; expect(createReview(p).disposition).toBe("REVIEW REQUIRED"); });
  it("future membership change does not act as effective removal", () => { const p = weekly(); p.command.triggers = [{ ...event("T3"), category: "MANDATE / REFERENCE", effectiveAt: "2026-10-10T09:00:00.000Z" }]; expect(createReview(p).disposition).toBe("NO ACTION"); });
  it.each(["MANDATE / REFERENCE", "COMPANY", "POSITION", "PORTFOLIO INTEGRITY"] as const)("supported event category %s", category => { const p = weekly(); p.command.triggers = [{ ...event("T3"), category }]; expect(createReview(p).disposition).toBe("DECISION REQUIRED"); });
  it("event during monthly review blocks allocation and links escalation", () => { const p = workflowFixture(); p.openEventReviewIds = ["event-review-1"]; const r = createReview(p); expect(r.status).toBe("ESCALATED"); expect(r.proposal?.items).toEqual([]); expect(r.linkedEventReviewIds).toEqual(["event-review-1"]); });
  it("quarter with complete unchanged fundamentals: NO ACTION", () => { const p = workflowFixture(1, i => { i.portfolio.positions = [{ securityId: i.securityId, shares: "100", marketValue: "2000000", sector: "INDUSTRIAL" }]; }); p.command.type = "QUARTERLY"; p.command.sections = sections(QUARTERLY_AREAS, p.decisions[0].securityId); p.command.theses = [{ securityId: p.decisions[0].securityId, prior: "INTACT", current: "INTACT", evidenceRefs: ["decision-evidence"], rationale: "Normalized economics intact" }]; expect(createReview(p).disposition).toBe("NO ACTION"); expect(createReview(p).proposal).toBeNull(); });
  it.each(["WEAKENING", "BROKEN"] as const)("quarterly thesis %s requires M6.5 refresh", current => { const p = weekly(); p.command.type = "QUARTERLY"; p.command.theses = [{ securityId: p.decisions[0].securityId, prior: "INTACT", current, evidenceRefs: ["decision-evidence"], rationale: "Structural evidence" }]; expect(createReview(p).disposition).toBe("DECISION REQUIRED"); });
  it.each(["NO POLICY CHANGE", "OPERATIONAL IMPROVEMENTS ONLY", "MODEL/RULE VALIDATION REQUIRED", "POLICY REVIEW PROPOSAL REQUIRED"] as const)("annual governance %s stays a recommendation", governance => { const p = weekly(); p.command.type = "ANNUAL"; p.command.sections = sections(ANNUAL_AREAS); p.command.governance = governance; const r = createReview(p); expect(r.command.governance).toBe(governance); expect(r.proposal).toBeNull(); });
  it("unavailable benchmark marks annual review incomplete without blocking ordinary surveillance", () => { const p = weekly(); expect(createReview(p).disposition).toBe("NO ACTION"); p.command.type = "ANNUAL"; p.command.sections = sections(ANNUAL_AREAS); p.command.sections.find(s => s.area === "BENCHMARK")!.finding = "MISSING"; expect(createReview(p).disposition).toBe("REVIEW REQUIRED"); });
  it.each(["PRICE DECLINE ONLY", "FORCED MONTHLY DEPLOYMENT", "PROFIT THRESHOLD ONLY"] as const)("behavioral process evidence: %s", indicator => { const p = workflowFixture(); p.command.behavioral = [{ bias: indicator === "PROFIT THRESHOLD ONLY" ? "Disposition Effect" : "Action Bias", evidenceRefs: ["decision-evidence"], originalWording: indicator, indicator, controlApplied: false, control: "Restate thesis, valuation and opportunity cost" }]; expect(createReview(p).proposal?.items).toEqual([]); expect(createReview(p).reasons.join()).toContain("BIAS CONCERN"); });
  it("all documented bias tags require contemporaneous evidence", () => { for (const bias of BIASES) { const p = weekly(); p.command.behavioral = [{ bias, evidenceRefs: [], originalWording: "Recorded process deviation", indicator: "DOCUMENTED PROCESS DEVIATION", controlApplied: false, control: "Review" }]; expect(() => createReview(p)).toThrow(); } });
  it("valid ACCUMULATE/SELL never acquire behavioral flags from gains or losses", () => { const p = workflowFixture(); p.command.evidence[0].summary = "Price fell; valid thesis and valuation. Another profitable holding has a broken thesis."; expect(createReview(p).command.behavioral).toEqual([]); });
  it("3/6/12 months are calendar reminders with end-of-month clamping", () => { expect(suggestedAuditDate("2026-01-31T09:00:00.000Z", 3)).toBe("2026-04-30T09:00:00.000Z"); expect(suggestedAuditDate(NOW, 6)).toBe("2027-04-01T09:00:00.000Z"); expect(suggestedAuditDate(NOW, 12)).toBe("2027-10-01T09:00:00.000Z"); });
  it.each(["allocationQuantity", "workflowOutcome", "decisionState", "cash", "methodology"])("rejects client authority field %s", field => { expect(() => validateReview({ ...weekly().command, [field]: "BUY" })).toThrow(); });
  it("strict nested schema and missing fields fail safely", () => { const p = weekly(); expect(() => validateReview({ ...p.command, triggers: [{ ...event("T3"), outcome: "SELL" }] } as unknown as typeof p.command)).toThrow(); expect(() => validateReview({ id: "incomplete" } as unknown as typeof p.command)).toThrow(); });
});

it("M6.3 cash adapter carries deposits once and preserves ledger/reserved/executable concepts", async () => {
  const { PortfolioEngine } = await import("@/application/portfolio/engine");
  const { DerivedDecisionPortfolioRead } = await import("@/application/decision/portfolio-context");
  const { DerivedWorkflowPortfolioRead } = await import("@/application/workflow/portfolio-context");
  const { P, W0, at, deposit, history, NOW: capturedAt } = await import("../fixtures/portfolio/history");
  let writes = 0;
  const transactions = history([deposit("month-1", "5000000", 1), deposit("month-2", "5000000", 20)]);
  const ledger = { read: async () => ({ inceptionAt: at(1), watermark: W0, transactions }), commit: async () => { writes++; throw new Error("Forbidden"); } };
  const engine = new PortfolioEngine(ledger, { now: () => capturedAt });
  for (const [day, amount, depositId] of [[1, "5000000", "month-1"], [20, "10000000", "month-2"]] as const) {
    const evidence = { id: `reconciled-${day}`, portfolioId: P, asOf: at(day), receivedAt: at(day), sourceReference: "Fixture reconciliation", cash: amount, receivables: "0", payables: "0", unresolvedDiscrepancy: false, positions: [] };
    const s = await engine.snapshot(P, at(day), { version: "price-v1", methodologyId: "fixture-valuation", observations: [] }, evidence, { version: "reference-v1", intervals: [] }, "test");
    const captured = { snapshot: s, evidence, current: true };
    const d = await new DerivedDecisionPortfolioRead(async () => captured, async () => true).read(s.asOf);
    const reader = new DerivedWorkflowPortfolioRead(async () => captured, async () => true, ledger);
    const result = await reader.read(d.integrity.snapshotId, s.asOf, depositId, capturedAt);
    expect(result.ledgerCash).toBe(amount); expect(result.reservedCash).toBe("0"); expect(result.decisionContext.executableCash).toBe(amount); expect(result.contribution?.amount).toBe("5000000");
    await expect(reader.read("fabricated-snapshot", s.asOf, depositId, capturedAt)).rejects.toThrow();
    await expect(reader.read(d.integrity.snapshotId, s.asOf, "unrecorded-contribution", capturedAt)).rejects.toThrow();
  }
  expect(writes).toBe(0);
});
