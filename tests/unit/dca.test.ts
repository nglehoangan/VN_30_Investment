import { describe, expect, it } from "vitest";
import { createReview } from "@/domain/workflow/reviews";
import { workflowFixture, orderedWorkflowFixture } from "../fixtures/workflow";
import { calculateScorecard } from "@/domain/scoring/scorecard";
import { STATES } from "@/domain/decision/contracts";
const proposal = (p: ReturnType<typeof workflowFixture>) => createReview(p).proposal!;

describe("M6.6 DCA baseline", () => {
  it("DCA-01 contribution exists without qualified candidates: HOLD CASH", () => {
    const p = workflowFixture(1, i => { i.assessment.opportunity.cash = "BETTER"; });
    p.command.contributionId = "deposit-1"; p.portfolio.contribution = { transactionId: "deposit-1", amount: "5000000", recordedAt: p.recordedAt };
    const a = proposal(p); expect(a.outcome).toBe("HOLD CASH"); expect(a.proposedAllocation).toBe("0"); expect(a.availableCapital).toBe(p.portfolio.ledgerCash); expect(a.unallocatedCash).toBe(a.availableCapital);
  });
  it("DCA-02 accumulated cash, no new contribution, eligible lot", () => {
    const a = proposal(workflowFixture(1, i => { i.portfolio.executableCash = "10000000"; }));
    expect(a.outcome).toBe("BUY"); expect(a.items[0].quantity).toBe("100"); expect(a.unallocatedCash).toBe("7997000");
  });
  it("DCA-03 rank #1 fails M6.5, not allocated", () => {
    const a = proposal(workflowFixture(1, i => { i.assessment.valuation.status = "EXPENSIVE"; }));
    expect(a.candidates[0].displayRank).toBe(1); expect(a.items).toEqual([]);
  });
  it("DCA-04 high score LOW confidence cannot deploy", () => {
    const a = proposal(workflowFixture(1, i => { const s = structuredClone(i.scorecard.input); s.confidence.level = "LOW"; i.scorecard = JSON.parse(JSON.stringify(calculateScorecard(s))); }));
    expect(a.items).toEqual([]);
  });
  it("DCA-05 losing HOLD cannot receive DCA", () => {
    const a = proposal(workflowFixture(1, i => { i.portfolio.positions = [{ securityId: i.securityId, shares: "100", marketValue: "2000000", sector: "INDUSTRIAL" }]; i.assessment.valuation.status = "FAIR"; }));
    expect(a.candidates[0].decisionState).toBe("HOLD"); expect(a.items).toEqual([]);
  });
  it("DCA-06 fresh ACCUMULATE supported by M6.5", () => {
    const a = proposal(workflowFixture(1, i => { i.portfolio.positions = [{ securityId: i.securityId, shares: "100", marketValue: "2000000", sector: "INDUSTRIAL" }]; i.assessment.thesis.averagingDown = true; }));
    expect(a.outcome).toBe("ACCUMULATE"); expect(a.items).toHaveLength(1);
  });
  it("DCA-07 profit percentage cannot generate a sell", () => {
    const p = workflowFixture(1, i => { i.portfolio.positions = [{ securityId: i.securityId, shares: "100", marketValue: "2000000", sector: "INDUSTRIAL" }]; i.assessment.valuation.status = "FAIR"; });
    p.command.evidence[0].summary = "Holding +25%, intact thesis and HOLD";
    expect(proposal(p).candidates[0].decisionState).toBe("HOLD"); expect(proposal(p).items).toEqual([]); expect(STATES).toHaveLength(7);
  });
  it("DCA-08 BUY merit survives insufficient lot cash", () => {
    const a = proposal(workflowFixture(1, i => { i.portfolio.executableCash = "1000000"; }));
    expect(a.outcome).toBe("HOLD CASH"); expect(a.candidates[0]).toMatchObject({ decisionState: "BUY", executionStatus: "REQUIRES CASH ACCUMULATION" });
  });
  it("DCA-09 M6.5 robust comparator evidence determines priority", () => {
    const p = orderedWorkflowFixture(); const [a] = p.decisions;
    const result = proposal(p); expect(result.items[0].decisionId).toBe(a.id); expect(result.candidates.map(c => c.economicPriority)).toEqual([1, 2]);
  });
  it("DCA-10 required return fails: HOLD CASH", () => { expect(proposal(workflowFixture(1, i => { i.assessment.valuation.expectedReturn = "0.10"; i.assessment.valuation.lowerReturn = "0.08"; })).outcome).toBe("HOLD CASH"); });
  it("DCA-11 blocked portfolio fails closed", () => { const p = workflowFixture(); p.portfolio.decisionContext.integrity.status = "BLOCKED"; const a = proposal(p); expect(a.outcome).toBe("REVIEW REQUIRED"); expect(a.items).toEqual([]); });
  it("DCA-12 no formal decision cannot allocate from ranking", () => { const p = workflowFixture(); p.command.decisionIds = []; p.decisions = []; expect(proposal(p).outcome).toBe("DECISION REQUIRED"); });
  it.each([2, 5, 15])("%i equal candidates preserve economic tie regardless of affordability", count => { const a = proposal(workflowFixture(count)); expect(a.outcome).toBe("REVIEW REQUIRED"); expect(a.items).toEqual([]); expect(a.candidates.every(c => c.economicPriority === 1)).toBe(true); });
  it("multi-lot approval cannot bypass missing sequential marginal simulation", () => { const a = proposal(workflowFixture(1, i => { i.assessment.sizing.proposedShares = "200"; })); expect(a.outcome).toBe("REVIEW REQUIRED"); expect(a.rationale.join()).toContain("CR-01"); });
  it("risk capacity smaller than requested is consumed from M6.5", () => {
    const p = workflowFixture(1, i => { i.portfolio.nav = "30000000"; i.assessment.sizing.proposedShares = "500"; });
    expect(proposal(p).items[0].quantity).toBe(p.decisions[0].executableShares); expect(proposal(p).items[0].quantity).toBe("100");
  });
  it("sector constraints block capital even with cash and strong score", () => {
    const a = proposal(workflowFixture(1, i => { i.portfolio.positions = [{ securityId: "OTHER", shares: "1000", marketValue: "31000000", sector: "INDUSTRIAL" }]; })); expect(a.items).toEqual([]);
  });
  it.each(["cash alone", "Top10 alone", "rank #1 alone", "high score alone", "low P/E alone", "price decline alone", "unrealized loss alone", "profit >20% alone", "technical signal alone", "board-lot affordability alone", "monthly contribution alone"])("anti-shortcut: %s", reason => {
    const p = workflowFixture(1, i => { i.assessment.opportunity.cash = "BETTER"; });
    p.command.evidence[0].summary = reason.replace(">", "above"); expect(proposal(p).items).toEqual([]);
  });
  it("stale decision and stale evidence fail closed without TTL invention", () => {
    const p = workflowFixture(); p.command.reviewDate = "2026-10-02T09:00:00.000Z"; p.recordedAt = p.command.reviewDate;
    expect(proposal(p).outcome).toBe("REVIEW REQUIRED");
  });
  it("economically preferred but unaffordable does not substitute next affordable", () => {
    const p = orderedWorkflowFixture(); const [a] = p.decisions;
    a.executionStatus = "REQUIRES CASH ACCUMULATION"; a.executableShares = null;
    expect(proposal(p).outcome).toBe("HOLD CASH"); expect(proposal(p).items).toEqual([]);
  });
  it("old proposal remains immutable when all current artifacts change", () => {
    const p = workflowFixture(), old = createReview(p), body = JSON.stringify(old);
    const next = workflowFixture(1, i => { i.portfolio.executableCash = "10000000"; }); next.command.id = "review-2"; next.command.supersedesReviewId = old.id;
    createReview(next, old.proposal!.id); expect(JSON.stringify(old)).toBe(body); expect(Object.isFrozen(old.proposal)).toBe(true);
  });
});
