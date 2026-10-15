import { describe, expect, it } from "vitest";
import { assessMarginalAllocation } from "@/domain/decision/marginal";
import { createReview } from "@/domain/workflow/reviews";
import { workflowFixture, NOW } from "../fixtures/workflow";
import { marginalCommand, marginalFrame, prefer, substitutionEvidence } from "../fixtures/marginal";
const twoLots = () => workflowFixture(1, i => { i.assessment.sizing.fees = "0"; i.assessment.sizing.economicTargetUpper = "0.04"; i.assessment.sizing.proposedShares = "300"; });
describe("M6.6.1 M6.5-owned marginal authorization", () => {
  it("A/B: two lots authorized; third blocked; post-lot exposures and residual are preserved", () => {
    const p = twoLots(), c = marginalCommand(p, [marginalFrame(p), marginalFrame(p, [0]), marginalFrame(p, [0, 0])]);
    const m = assessMarginalAllocation(c, p.decisions, NOW);
    expect(m.steps.map(s => s.result)).toEqual(["AUTHORIZED", "AUTHORIZED", "HOLD CASH"]);
    expect(m.steps[1].projection.context.executableCash).toBe("78000000");
    expect(m.steps[1].projection.context.positions[0].marketValue).toBe("2000000");
    expect(m.finalProjection.context.executableCash).toBe("76000000");
    expect(m.steps[2].reasons.join()).toContain("ECONOMIC_TARGET_CAP");
    const r = createReview({ ...p, command: { ...p.command, marginalAllocationId: m.id }, marginalAllocation: m });
    expect(r.proposal?.items).toHaveLength(2); expect(r.proposal?.proposedAllocation).toBe("4000000"); expect(r.proposal?.unallocatedCash).toBe("76000000");
    expect(r.proposal?.items.map(i => i.marginalAssessmentReference)).toEqual(["marginal-1:step:0", "marginal-1:step:1"]);
  });
  it("C: projected sector capacity stops the next lot", () => {
    const p = workflowFixture(1, i => { i.assessment.sizing.fees = "0"; i.portfolio.positions = [{ securityId: "other-sector-holding", shares: "1000", marketValue: "28000000", sector: i.scorecard.reference.sector! }]; });
    const m = assessMarginalAllocation(marginalCommand(p, [marginalFrame(p), marginalFrame(p, [0])]), p.decisions, NOW);
    expect(m.steps[0].result).toBe("AUTHORIZED"); expect(m.steps[1].authorizedLot).toBeNull(); expect(m.steps[1].reasons.join()).toContain("SECTOR_NO_ADD");
  });
  it("D: cash stops after one lot without exhausting the residual", () => {
    const p = workflowFixture(1, i => { i.portfolio.executableCash = "3000000"; });
    const m = assessMarginalAllocation(marginalCommand(p, [marginalFrame(p), marginalFrame(p, [0])]), p.decisions, NOW);
    expect(m.steps[0].result).toBe("AUTHORIZED"); expect(m.steps[1].result).toBe("HOLD CASH"); expect(m.finalProjection.context.executableCash).toBe("997000");
  });
  it("E: risk capacity below a board lot preserves merit without fractional authorization", () => {
    const p = workflowFixture(1, i => { i.assessment.sizing.economicTargetUpper = "0.01"; });
    const m = assessMarginalAllocation(marginalCommand(p, [marginalFrame(p)]), p.decisions, NOW);
    expect(m.steps[0].assessments[0].decision.decisionState).toBe("BUY"); expect(m.steps[0].authorizedLot).toBeNull();
  });
  it("F: unavailable next assessment fails closed", () => {
    const p = twoLots(), m = assessMarginalAllocation(marginalCommand(p, [marginalFrame(p)]), p.decisions, NOW);
    expect(m.steps[1].result).toBe("REVIEW REQUIRED");
    const r = createReview({ ...p, command: { ...p.command, marginalAllocationId: m.id }, marginalAllocation: m });
    expect(r.proposal?.items).toEqual([]); expect(r.disposition).toBe("REVIEW REQUIRED");
  });
  it("G: only refreshed authoritative comparisons permit A then B", () => {
    const p = workflowFixture(2), frames = [prefer(p, marginalFrame(p), 0), prefer(p, marginalFrame(p, [0]), 1), marginalFrame(p, [0, 1])];
    frames[2].candidates.forEach(c => { c.assessment.opportunity.cash = "BETTER"; });
    const m = assessMarginalAllocation(marginalCommand(p, frames), p.decisions, NOW);
    expect(m.steps.map(s => s.authorizedLot?.decisionId ?? null)).toEqual([p.decisions[0].id, p.decisions[1].id, null]);
  });
  it("H: a new tie requires review, never alphabetical selection", () => {
    const p = workflowFixture(2), m = assessMarginalAllocation(marginalCommand(p, [prefer(p, marginalFrame(p), 0), marginalFrame(p, [0])]), p.decisions, NOW);
    expect(m.steps[1].result).toBe("REVIEW REQUIRED"); expect(m.steps[1].preferredDecisionId).toBeNull();
  });
  it("I: 15 candidates use comparison evidence, with deterministic replay", () => {
    const p = workflowFixture(15), frames = [prefer(p, marginalFrame(p), 12), marginalFrame(p, [12])];
    frames[1].candidates.forEach(c => { c.assessment.opportunity.cash = "BETTER"; });
    const c = marginalCommand(p, frames), m = assessMarginalAllocation(c, p.decisions, NOW);
    expect(m.steps[0].authorizedLot?.decisionId).toBe(p.decisions[12].id); expect(assessMarginalAllocation(c, p.decisions, NOW)).toEqual(m);
  });
  it("J: affordable alternative that fails required return receives no substitution", () => {
    const p = workflowFixture(2, (i, n) => { i.portfolio.executableCash = "3000000"; if (n === 0) i.assessment.sizing.price = "40000"; });
    const frame = prefer(p, marginalFrame(p), 0); frame.substitutionEvidence = [substitutionEvidence(p)];
    frame.candidates[1].assessment.valuation.expectedReturn = "0.10"; frame.candidates[1].assessment.valuation.lowerReturn = "0.08";
    const m = assessMarginalAllocation(marginalCommand(p, [frame]), p.decisions, NOW);
    expect(m.steps[0].result).toBe("HOLD CASH"); expect(m.steps[0].authorizedLot).toBeNull();
  });
  it("K: approved §12 conjunction permits B, then cash stops; preserves A's merit", () => {
    const p = workflowFixture(2, (i, n) => { i.portfolio.executableCash = "3000000"; if (n === 0) i.assessment.sizing.price = "40000"; });
    const frame = prefer(p, marginalFrame(p), 0); frame.substitutionEvidence = [substitutionEvidence(p)];
    const stop = prefer(p, marginalFrame(p, [1]), 0);
    const m = assessMarginalAllocation(marginalCommand(p, [frame, stop]), p.decisions, NOW);
    expect(m.steps[0].preferredDecisionId).toBe(p.decisions[0].id); expect(m.steps[0].authorizedLot?.decisionId).toBe(p.decisions[1].id);
    expect(m.steps[0].substitution?.policy).toContain("§12.1"); expect(m.steps[1].authorizedLot).toBeNull();
    expect(m.finalProjection.context.executableCash).toBe("997000");
  });
  it("L: lower share price alone grants no substitution authority", () => {
    const p = workflowFixture(2, (i, n) => { i.portfolio.executableCash = "3000000"; i.assessment.sizing.price = n === 0 ? "40000" : "1000"; });
    const m = assessMarginalAllocation(marginalCommand(p, [prefer(p, marginalFrame(p), 0)]), p.decisions, NOW);
    expect(m.steps[0].result).toBe("HOLD CASH"); expect(m.steps[0].authorizedLot).toBeNull();
  });
  it.each(["mosNotMateriallyWeaker", "concentrationNotWorse", "diversionDoesNotStarvePreferred"] as const)("missing %s evidence retains cash", flag => {
    const p = workflowFixture(2, (i, n) => { i.portfolio.executableCash = "3000000"; if (n === 0) i.assessment.sizing.price = "40000"; });
    const frame = prefer(p, marginalFrame(p), 0); frame.substitutionEvidence = [{ ...substitutionEvidence(p), [flag]: null }];
    expect(assessMarginalAllocation(marginalCommand(p, [frame]), p.decisions, NOW).steps[0].result).toBe("HOLD CASH");
  });
  it("recurring diversion requires fresh competitive evidence", () => {
    const p = workflowFixture(2, (i, n) => { i.portfolio.executableCash = "3000000"; if (n === 0) i.assessment.sizing.price = "40000"; });
    const frame = prefer(p, marginalFrame(p), 0); frame.substitutionEvidence = [{ ...substitutionEvidence(p), patternReview: "RECURRING — FRESH COMPETITIVE REVIEW", remainsCompetitiveAfterFreshReview: false }];
    expect(assessMarginalAllocation(marginalCommand(p, [frame]), p.decisions, NOW).steps[0].result).toBe("HOLD CASH");
  });
  it("rejects changed projected cash and unreviewed price/quantity", () => {
    const p = twoLots(), frame = marginalFrame(p); frame.projection.context.executableCash = "999999999";
    expect(() => assessMarginalAllocation(marginalCommand(p, [frame]), p.decisions, NOW)).toThrow();
    const other = marginalFrame(p); other.candidates[0].assessment.sizing.proposedShares = "999";
    expect(() => assessMarginalAllocation(marginalCommand(p, [other]), p.decisions, NOW)).toThrow();
  });
  it.each(["result", "authorizedQuantity", "preferredCandidate", "ordering", "substitutionApproved"])("rejects client-injected %s", key => {
    const p = twoLots(), c = marginalCommand(p, [marginalFrame(p)]);
    expect(() => assessMarginalAllocation({ ...c, [key]: "PASS" }, p.decisions, NOW)).toThrow();
  });
  it("rejects stale evidence, mismatched base and future cutoff", () => {
    const p = twoLots(), c = marginalCommand(p, [marginalFrame(p)]);
    expect(assessMarginalAllocation(c, p.decisions, "2026-10-02T09:00:00.000Z").steps[0].result).toBe("REVIEW REQUIRED");
    expect(() => assessMarginalAllocation({ ...c, baseDecisionIds: ["other"] }, p.decisions, NOW)).toThrow();
    expect(() => assessMarginalAllocation({ ...c, evidenceCutoff: "2027-01-01T00:00:00.000Z" }, p.decisions, NOW)).toThrow();
  });
});
