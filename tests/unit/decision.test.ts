import historicalDecisions from "../fixtures/m65-historical-decisions.json";
import { describe, it, expect } from "vitest";
import { decide } from "@/domain/decision/engine";
import { STATES, METHOD, LEGACY_SYNTHETIC_METHOD, type DecisionInput } from "@/domain/decision/contracts";
import { mutableDecision, decisionFixture, approvedDecision } from "../fixtures/decision";
import { calculateScorecard } from "@/domain/scoring/scorecard";
import { fixture, rankingFixture } from "../fixtures/scoring";
import { rankScorecards } from "@/domain/ranking/rank";

function strong(owned = false) { const i = mutableDecision(owned); i.assessment.valuation.expectedReturn = "0.20"; i.assessment.valuation.exceptionalAsymmetry = true; return i; }
function broken() { const i = mutableDecision(true); i.assessment.thesis.status = "BROKEN"; i.assessment.thesis.violatedCondition = "Permanent loss of franchise"; return i; }
function reduce() { const i = mutableDecision(true); i.assessment.risk.hiddenFactorBlocksAdd = true; i.assessment.ownershipCase.reductionReason = "RISK"; i.assessment.ownershipCase.targetShares = "50"; return i; }
function hold() { const i = mutableDecision(true); i.assessment.valuation.expectedReturn = "0.11"; i.assessment.valuation.lowerReturn = "0.08"; i.assessment.valuation.status = "FAIR"; return i; }
function switchInput() {
  const i = hold(), f = fixture(1), card = calculateScorecard(f);
  i.comparatorScorecards = [JSON.parse(JSON.stringify(card))];
  i.assessment.opportunity = { ...i.assessment.opportunity, mode: "EXISTING CAPITAL REALLOCATION", switchingTo: card.securityId, robustAfterFriction: true, zeroSuperiorToResidual: true,
    comparators: [{ analyst: "Synthetic reviewer", source: "HUMAN", assessedAt: i.knownAt, evidenceRefs: ["decision-evidence"], rationale: "Independent qualified replacement after all M4 gates", securityId: card.securityId, scorecardId: card.id, decisionId: "qualified-replacement", kind: "NEW", expectedReturn: "0.16", lowerReturn: "0.12", upperReturn: "0.20", eligible: true, qualityNoWorse: true, riskNoWorse: true, confidenceNoLower: true, thesisNoWorse: true, fitNoWorse: true, robustlySuperior: true, marginalCapacity: "0.08" }] };
  return i;
}
describe("M6.5 approved decision states", () => {
  it.each([
    ["STRONG BUY", () => strong()], ["BUY", () => mutableDecision()], ["ACCUMULATE", () => mutableDecision(true)],
    ["HOLD", hold], ["REDUCE", reduce], ["SELL", broken], ["AVOID", () => { const i = mutableDecision(); i.assessment.valuation.status = "EXPENSIVE"; return i; }],
  ] as const)("positive %s", (state, make) => { expect(decide(make()).decisionState).toBe(state); });
  it("exact seven states", () => expect(STATES).toEqual(["STRONG BUY", "BUY", "ACCUMULATE", "HOLD", "REDUCE", "SELL", "AVOID"]));
  it.each([false, true])("STRONG BUY ownership %s", owned => { const d = decide(strong(owned)); expect(d.decisionState).toBe("STRONG BUY"); expect(d.action).toBe(owned ? "ADD" : "INITIATE"); });
  it.each([false, true])("BUY/ACCUMULATE mutually exclusive %s", owned => expect(decide(decisionFixture(owned)).decisionState).toBe(owned ? "ACCUMULATE" : "BUY"));
  it("strong negative confidence gate", () => { const i = strong(); i.scorecard.confidence = "MEDIUM"; expect(decide(i).decisionState).toBe("BUY"); });
  it("strong negative residual-risk gate", () => { const i = strong(); i.scorecard.input.residualRisk.status = "ELEVATED_CONTROLLED"; i.assessment.requiredReturn.riskAdjustmentRequired = true; i.assessment.requiredReturn.adjustedHurdle = "0.19"; i.assessment.requiredReturn.calibrationReference = "synthetic-calibration"; expect(decide(i).decisionState).toBe("BUY"); });
  it("BUY negative category gate", () => { const i = mutableDecision(); i.scorecard.categories.find(x => x.category === "FH")!.points = "7"; expect(decide(i).decisionState).toBe("AVOID"); });
  it("ACCUMULATE negative fresh-thesis gate", () => { const i = mutableDecision(true); i.assessment.thesis.freshUnderwriting = false; expect(decide(i).decisionState).toBe("HOLD"); });
  it("HOLD incompatible with ownership veto", () => { const i = hold(); i.assessment.risk.veto = "OWNERSHIP VETO"; i.scorecard.input.hardVeto.status = "ACTIVE"; expect(decide(i).decisionState).toBe("SELL"); });
  it("REDUCE negative residual gate", () => { const i = reduce(); i.assessment.ownershipCase.targetShares = "0"; expect(() => decide(i)).toThrow(); });
  it("SELL negative unsupported valuation rationale", () => { const i = hold(); i.assessment.ownershipCase.zeroOwnershipReason = "VALUATION"; expect(decide(i).decisionState).toBe("HOLD"); });
  it("AVOID never owned", () => { const i = mutableDecision(true); i.scorecard.confidence = "LOW"; expect(decide(i).decisionState).toBe("HOLD"); });
  it.each(["HOLD", "REDUCE", "SELL"])("unowned cannot receive %s", state => { const i = state === "SELL" ? broken() : state === "REDUCE" ? reduce() : hold(); i.portfolio.positions = []; expect(decide(i).decisionState).toBe("AVOID"); });
});
describe("M6.5 anti-shortcuts / A–J", () => {
  it.each(["high score", "Top 10", "low P/E", "technical signal", "affordable board lot", "monthly DCA cash"])("%s alone is not BUY", label => {
    const i = mutableDecision(); i.assessment.valuation.status = "EXPENSIVE"; i.assessment.technical.status = "FAVORABLE";
    if (label === "Top 10") { const r = rankingFixture(); i.ranking = JSON.parse(JSON.stringify(rankScorecards(r))); i.scorecard = JSON.parse(JSON.stringify(r.cards[0])); }
    expect(decide(i).decisionState).toBe("AVOID"); expect(decide(i).opportunityCost.capitalUse).not.toBe("DEPLOY");
  });
  it.each(["price decline", "loss position"])("%s alone is not ACCUMULATE (C)", () => { const i = mutableDecision(true); i.assessment.thesis.status = "WEAKENING"; i.assessment.thesis.averagingDown = true; expect(decide(i).decisionState).toBe("HOLD"); });
  it.each(["+20%", "+25%", "technical weakness"])("%s alone is not REDUCE/SELL (D)", () => { const i = mutableDecision(true); i.assessment.technical.status = "UNFAVORABLE"; expect(decide(i).decisionState).toBe("ACCUMULATE"); });
  it("A/B same score, different ownership", () => { expect(decide(decisionFixture()).decisionState).toBe("BUY"); expect(decide(decisionFixture(true)).decisionState).toBe("ACCUMULATE"); });
  it("same score different valuation", () => { const i = mutableDecision(); i.assessment.valuation.status = "EXPENSIVE"; expect(decide(i).decisionState).toBe("AVOID"); expect(decide(decisionFixture()).decisionState).toBe("BUY"); });
  it("same score different required return", () => { const i = mutableDecision(); i.assessment.requiredReturn.riskAdjustmentRequired = true; i.assessment.requiredReturn.adjustedHurdle = "0.18"; i.assessment.requiredReturn.calibrationReference = "risk-calibration"; expect(decide(i).decisionState).toBe("AVOID"); });
  it("same score different portfolio impact", () => { const i = mutableDecision(true); i.assessment.sizing.portfolioImpact = "NEGATIVE — DO NOT ADD"; expect(decide(i).decisionState).toBe("HOLD"); });
  it("E broken thesis zero target even without replacement cash", () => { const i = broken(); i.portfolio.executableCash = "0"; expect(decide(i)).toMatchObject({ decisionState: "SELL", targetShares: "0", executionStatus: "EXECUTE" }); });
  it("F valuation-only SELL needs robust switch", () => { const i = switchInput(); i.assessment.valuation.status = "EXTREME"; i.assessment.valuation.extremeRobust = true; i.assessment.valuation.returnInadequate = true; i.assessment.ownershipCase.continuedOwnership = false; i.assessment.ownershipCase.zeroOwnershipReason = "VALUATION"; expect(decide(i).decisionState).toBe("SELL"); i.assessment.opportunity.robustAfterFriction = false; expect(() => decide(i)).toThrow(); });
  it("G LOW confidence cannot allocate", () => { const i = strong(); i.scorecard.confidence = "LOW"; expect(decide(i).decisionState).toBe("AVOID"); });
  it("H cash wins with attractive candidate", () => { const i = strong(); i.assessment.opportunity.cash = "BETTER"; expect(decide(i)).toMatchObject({ decisionState: "AVOID", opportunityCost: { capitalUse: "HOLD CASH" } }); });
  it("I technical WAIT is execution deferral", () => { const i = mutableDecision(); i.assessment.technical = { ...i.assessment.technical, timing: "TEMPORARILY DEFERRED", concreteRisk: "Event gap risk", resumeCondition: "Liquidity normalizes", expiryTrigger: "Next results event" }; expect(decide(i)).toMatchObject({ decisionState: "BUY", executionStatus: "TEMPORARILY DEFERRED", executableShares: null }); });
  it("J blocked accounting fails closed", () => { const i = mutableDecision(); i.portfolio.integrity.status = "BLOCKED"; expect(decide(i)).toMatchObject({ decisionState: "AVOID", reviewStatus: "PENDING", executableShares: null }); });
});
describe("M6.5 gates and historical truth", () => {
  it("missing evidence produces provisional HOLD/PENDING", () => { const i = mutableDecision(true); i.assessment.missingCritical = ["Latest report"]; expect(decide(i)).toMatchObject({ decisionState: "HOLD", decisionQualifier: "Provisional HOLD", reviewStatus: "PENDING" }); });
  it("Stage0 fail early termination", () => { const i = mutableDecision(); i.assessment.stage0.outcome = "FAIL — INVESTABILITY"; i.assessment.stage0.findings = ["FAIL — INVESTABILITY"]; i.scorecard.input.stage0.status = "FAIL"; expect(decide(i).pipeline[0].status).toBe("N/A — TERMINATED AT STAGE 0"); expect(decide(i).decisionState).toBe("AVOID"); });
  it("Stage0 secondary veto preserved with ineligibility", () => { const i = broken(); i.assessment.stage0.outcome = "FAIL — INELIGIBLE"; i.assessment.stage0.findings = ["FAIL — RISK VETO", "FAIL — INELIGIBLE"]; i.scorecard.input.stage0.status = "FAIL"; i.assessment.risk.veto = "OWNERSHIP VETO"; i.scorecard.input.hardVeto.status = "ACTIVE"; expect(decide(i).decisionState).toBe("SELL"); });
  it("Stage0 precedence cannot be overwritten", () => { const i = mutableDecision(); i.assessment.stage0.findings.push("FAIL — INVESTABILITY"); expect(() => decide(i)).toThrow(); });
  it("cash insufficiency preserves BUY", () => { const i = mutableDecision(); i.portfolio.executableCash = "0"; expect(decide(i)).toMatchObject({ decisionState: "BUY", executionStatus: "REQUIRES CASH ACCUMULATION" }); });
  it("cost-only integrity permits exposure analysis", () => { const i = mutableDecision(); i.portfolio.integrity.costStatus = "BLOCKED"; expect(decide(i).decisionState).toBe("BUY"); });
  it("concentration resolution blocks owned STRONG BUY", () => { const i = strong(true); i.portfolio.positions[0].marketValue = "16000000"; expect(decide(i).decisionState).toBe("HOLD"); });
  it("broken-thesis resolution cannot REDUCE", () => { const i = broken(); i.assessment.ownershipCase.reductionReason = "THESIS"; i.assessment.ownershipCase.targetShares = "50"; expect(decide(i).decisionState).toBe("SELL"); });
  it("exception rationale does not need user approval", () => { const i = mutableDecision(); i.scorecard.input.residualRisk.status = "LOW"; i.assessment.valuation.expectedReturn = "0.135"; i.assessment.requiredReturn.exceptionRequested = true; expect(decide(i)).toMatchObject({ decisionState: "BUY", requiredReturn: { exceptionApplied: true, requiredReturn: "0.12" } }); });
  it.each(["0.119999999999", "0.12", "0.149999999999", "0.15"])("normal hurdle boundary %s", value => { const i = mutableDecision(); i.assessment.valuation.expectedReturn = value; i.assessment.valuation.lowerReturn = "0.10"; expect(decide(i).requiredReturn.hurdleMet).toBe(value === "0.15"); });
  it("missing risk calibration cannot pass", () => { const i = mutableDecision(); i.assessment.requiredReturn.riskAdjustmentRequired = true; expect(decide(i).requiredReturn.status).toBe("NOT_ASSESSED"); });
  it("switch edge must survive uncertainty", () => { const i = switchInput(); i.assessment.opportunity.robustAfterFriction = false; expect(decide(i).opportunityCost.switchEligible).toBe(false); });
  it("2pp switch rejected", () => { const i = switchInput(); i.assessment.opportunity.comparators[0].expectedReturn = "0.13"; expect(decide(i).opportunityCost.switchEligible).toBe(false); });
  it("no fixed 100-share execution", () => { const i = mutableDecision(); i.assessment.sizing.boardLot = "10"; i.assessment.sizing.proposedShares = "20"; expect(decide(i).executableShares).toBe("20"); });
  it("immutability and scorecard/snapshot/methodology lineage", () => { const i = mutableDecision(); const d = decide(i); const before = JSON.stringify(d); i.id = "decision-2"; i.priorDecisionId = d.id; i.revisionReason = "Portfolio changed"; i.portfolio.integrity.snapshotId = "snapshot-2"; i.assessment.sizing.portfolioImpact = "NEGATIVE — DO NOT ADD"; expect(decide(i).decisionState).toBe("AVOID"); expect(JSON.stringify(d)).toBe(before); expect(d.lineage.scorecardId).toBe(i.scorecard.id); expect(Object.isFrozen(d.input.assessment)).toBe(true); });
  it("future evidence rejected", () => { const i = mutableDecision(); i.evidence[0].receivedAt = "2026-01-01T00:00:00.000Z"; expect(() => decide(i)).toThrow(); });
  it("AI assessment rejected", () => { const i = mutableDecision(); Object.assign(i.assessment, { source: "AI" }); expect(() => decide(i)).toThrow(); });
  it("client final state rejected", () => { const i = mutableDecision(); Object.assign(i, { decisionState: "BUY" }); expect(() => decide(i)).toThrow(); });
  it("synthetic cannot become formal", () => { const i = mutableDecision(); i.scope = "FORMAL"; expect(() => decide(i)).toThrow(); });
  it("missing valuation is not zero forecast", () => { const i = mutableDecision(); i.assessment.valuation.expectedReturn = null; expect(decide(i).requiredReturn.status).toBe("NOT_ASSESSED"); });
});

describe("M6.5 policy boundary regressions", () => {
  it("conditional Stage0 permits only unowned BUY", () => {
    const i = strong(); i.assessment.stage0.outcome = "PASS WITH CONDITIONS"; i.assessment.stage0.findings = ["PASS WITH CONDITIONS"];
    i.assessment.stage0.conditionalBuyPermitted = true; i.assessment.stage0.conditionalMitigation = "Non-veto condition monitored and reflected in sizing";
    i.scorecard.input.stage0.status = "PASS WITH CONDITIONS";
    expect(decide(i).decisionState).toBe("BUY");
    i.portfolio.positions = JSON.parse(JSON.stringify(decisionFixture(true).portfolio.positions));
    expect(decide(i).decisionState).toBe("HOLD");
  });
  it("owned Stage0 investability failure requires explicit residual reduction review", () => {
    const i = reduce(); i.assessment.stage0.outcome = "FAIL — INVESTABILITY"; i.assessment.stage0.findings = ["FAIL — INVESTABILITY"]; i.scorecard.input.stage0.status = "FAIL";
    expect(decide(i).decisionState).toBe("REDUCE");
    i.assessment.ownershipCase.reductionReason = "NONE"; i.assessment.risk.hiddenFactorBlocksAdd = false;
    expect(() => decide(i)).toThrow();
  });
  it("SELL survives blocked accounting but executable quantity does not", () => { const i = broken(); i.portfolio.integrity.status = "BLOCKED"; expect(decide(i)).toMatchObject({ decisionState: "SELL", executableShares: null, executionStatus: "BLOCKED — PORTFOLIO/RISK" }); });
  it("SELL post-trade exposure is zero", () => expect(decide(broken()).portfolioImpact.postWeight).toBe("0"));
  it("REDUCE post-trade exposure decreases", () => { const d = decide(reduce()); expect(Number(d.portfolioImpact.postWeight)).toBeLessThan(Number(d.portfolioImpact.currentWeight)); });
  it("31% lot cannot be authorized by an exception", () => { const i = mutableDecision(); i.assessment.sizing.proposedShares = "1600"; i.assessment.sizing.economicTargetUpper = "0.5"; i.assessment.risk.smallNavException = true; i.assessment.risk.approvalReference = "user-approved-test"; i.assessment.risk.normalizationPlan = "Reduce concentration with future contributions"; i.assessment.risk.elevatedSizeJustification = "Small NAV"; expect(decide(i).decisionState).toBe("AVOID"); });
  it("critical drawdown needs explicit risk approval", () => { const i = mutableDecision(); i.assessment.risk.drawdown = "CRITICAL"; expect(decide(i).decisionState).toBe("AVOID"); i.assessment.risk.approvalReference = "synthetic-risk-approval"; expect(decide(i).decisionState).toBe("BUY"); });
  it("pending review is never normal HOLD", () => { const i = hold(); i.assessment.reviewStatus = "ESCALATED"; expect(decide(i)).toMatchObject({ reviewStatus: "ESCALATED", decisionQualifier: "Provisional HOLD" }); });
  it.each(["pe", "unrealizedPnl", "gainPercent", "priceDecline", "monthlyContribution", "clientFinalState"])("raw %s cannot enter decision authority", field => { const i = mutableDecision(); Object.assign(i, { [field]: "0.25" }); expect(() => decide(i)).toThrow(); });
  it("valid averaging-up add remains ACCUMULATE", () => { const i = mutableDecision(true); i.assessment.thesis.status = "IMPROVING"; i.assessment.sizing.price = "22000"; expect(decide(i).decisionState).toBe("ACCUMULATE"); });
  it("ordinary HOLD cannot replace a missing residual thesis", () => { const i = hold(); i.assessment.ownershipCase.continuedOwnership = false; expect(() => decide(i)).toThrow(); });
  it("owned legacy never receives new capital", () => { const i = mutableDecision(true); i.scorecard.reference.membership = "NON_MEMBER_CONFIRMED"; i.assessment.ownershipCase.legacyExitPlan = "Orderly exit on liquidity window"; expect(decide(i)).toMatchObject({ decisionState: "HOLD", membership: "LEGACY" }); });
  it("cash-only missing evidence remains unavailable, not zero", () => { const i = mutableDecision(); i.assessment.valuation.expectedReturn = null; expect(decide(i).requiredReturn.expectedReturn).toBeNull(); });
  it("stale comparator cannot authorize a switch", () => { const i = switchInput(); i.evidence[0].validThrough = "2025-06-29T09:00:00.000Z"; i.evidence[0].asOf = "2025-06-28T09:00:00.000Z"; expect(decide(i).opportunityCost.switchEligible).toBe(false); });
});

describe("M6.5 cash switching", () => {
  it("cash is an explicit destination for robust valuation-only zero ownership", () => {
    const i = hold(); i.assessment.valuation = { ...i.assessment.valuation, status: "EXTREME", expectedReturn: "-0.05", lowerReturn: "-0.10", upperReturn: "-0.01", extremeRobust: true, returnInadequate: true };
    i.assessment.ownershipCase.continuedOwnership = false; i.assessment.ownershipCase.zeroOwnershipReason = "VALUATION";
    i.assessment.opportunity = { ...i.assessment.opportunity, mode: "EXISTING CAPITAL REALLOCATION", switchingTo: "CASH", cash: "BETTER", cashExpectedReturn: "0", robustAfterFriction: true, zeroSuperiorToResidual: true };
    expect(decide(i).decisionState).toBe("SELL");
    i.assessment.opportunity.cashExpectedReturn = null;
    expect(() => decide(i)).toThrow();
  });
});

it("lot feasibility does not rewrite economic BUY", () => { const i = mutableDecision(); i.assessment.sizing.proposedShares = "15"; expect(decide(i)).toMatchObject({ decisionState: "BUY", executionStatus: "BLOCKED — PORTFOLIO/RISK", executableShares: null }); });

it("M6.4 retains conditional Stage0 without changing score arithmetic", () => { const input = fixture(); const before = calculateScorecard(input); const conditional = JSON.parse(JSON.stringify(input)); conditional.stage0.status = "PASS WITH CONDITIONS"; const after = calculateScorecard(conditional); expect(after.totalScore).toBe(before.totalScore); expect(after.validity).toBe(before.validity); expect(after.input.stage0.status).toBe("PASS WITH CONDITIONS"); });


describe("M6.5.1 pending governance", () => {
  it.each([METHOD, LEGACY_SYNTHETIC_METHOD])("candidate %s cannot issue formal decisions even with relabeled metadata", identity => {
    const i = mutableDecision(); i.scope = "FORMAL";
    for (const method of Object.values(i.methods)) {
      method.implementationIdentity = identity; method.governanceStatus = "APPROVED"; method.intendedUse = "PRODUCTION";
      // Real pending document used as an adversarial claim, never an approval fixture.
      method.approvalReference = "docs/06_DASHBOARD/6.5 Decision Engine/CHANGE_REQUESTS.md";
    }
    i.scorecard.input.artifactScope = "FORMAL";
    i.scorecard.methodology.governanceStatus = "APPROVED"; i.scorecard.methodology.intendedUse = "PRODUCTION";
    try { decide(i); expect.fail("Formal issuance must be blocked"); }
    catch (error) { expect(error).toMatchObject({ issues: [{ reason: "PENDING_GOVERNANCE_TEST_ONLY" }] }); }
  });
  it("synthetic proposed semantics retain the neutral identity and no approval", () => {
    const i = mutableDecision(true); i.assessment.thesis.status = "BROKEN"; i.assessment.thesis.violatedCondition = "Synthetic thesis break";
    const d = decide(i); expect(d.decisionState).toBe("SELL"); expect(d.methodology).toBe(METHOD);
    expect(d.input.methods.decision).toMatchObject({ governanceStatus: "PROPOSED", intendedUse: "TEST", approvalReference: "" });
  });
  it("legacy synthetic replay keeps its original identity and bytes", () => {
    const i = mutableDecision(); for (const method of Object.values(i.methods)) method.implementationIdentity = LEGACY_SYNTHETIC_METHOD;
    const d = decide(i); expect(d.methodology).toBe(LEGACY_SYNTHETIC_METHOD);
    expect(JSON.stringify(decide(d.input))).toBe(JSON.stringify(d));
  });
});

describe("M6.5.2 approved governance alignment", () => {
  it.each([
    ["A", false, false, "1000", "2000000", "BUY", "499.985", "400", "EXECUTE"],
    ["B", false, true, "1000", "2000000", "STRONG BUY", "499.985", "400", "EXECUTE"],
    ["C", true, false, "1000", "2000000", "ACCUMULATE", "399.985", "300", "EXECUTE"],
    ["D", true, false, "1000", "16000000", "HOLD", "0", "0", "NOT ACTIONABLE"],
    ["E", true, false, "100", "9000000", "ACCUMULATE", "49.985", "0", "BLOCKED — PORTFOLIO/RISK"],
    ["F", false, false, "100", "2000000", "AVOID", "0", "0", "NOT ACTIONABLE"],
  ] as const)("CR-01 %s: requested/risk/lot and ownership", (label, owned, strong, requested, value, state, riskSize, lotSize, status) => {
    const i = approvedDecision(owned); i.assessment.sizing.proposedShares = requested;
    if (owned) i.portfolio.positions[0].marketValue = value;
    if (strong) { i.assessment.valuation.expectedReturn = "0.20"; i.assessment.valuation.exceptionalAsymmetry = true; }
    if (label === "F") i.assessment.risk.hiddenFactorBlocksAdd = true;
    const d = decide(i);
    expect(d).toMatchObject({ decisionState: state, executionStatus: status, executableShares: lotSize === "0" ? null : lotSize,
      tradeAuthorization: lotSize === "0" ? "NOT AUTHORIZED" : "AUTHORIZED",
      portfolioImpact: { sizing: { requestedShares: requested, riskCompliantShares: riskSize, boardLotExecutableShares: lotSize } } });
    if (["A", "B", "C"].includes(label)) {
      expect(d.reasons).toContain("CONSTRAINED — SMALLER SIZE REQUIRED");
      expect(Number(d.portfolioImpact.postWeight)).toBeLessThanOrEqual(0.10);
    }
  });
  it("owned STRONG BUY clips without becoming HOLD", () => {
    const i = approvedDecision(true); i.assessment.sizing.proposedShares = "1000";
    i.assessment.valuation.expectedReturn = "0.20"; i.assessment.valuation.exceptionalAsymmetry = true;
    expect(decide(i)).toMatchObject({ decisionState: "STRONG BUY", executableShares: "300" });
  });
  it("cash is checked against clipped quantity; arbitrary board lot is execution only", () => {
    const i = approvedDecision(); i.assessment.sizing.proposedShares = "1000"; i.assessment.sizing.boardLot = "10";
    i.portfolio.executableCash = "9803000";
    expect(decide(i)).toMatchObject({ decisionState: "BUY", executionStatus: "EXECUTE", executableShares: "490" });
    i.portfolio.executableCash = "9802999";
    expect(decide(i)).toMatchObject({ decisionState: "BUY", executionStatus: "REQUIRES CASH ACCUMULATION", executableShares: null });
  });
  it("sub-share compliant capacity preserves economics without rounding into authorization", () => {
    const i = approvedDecision(true); i.portfolio.positions[0].marketValue = "9990000";
    expect(decide(i)).toMatchObject({ decisionState: "ACCUMULATE", executionStatus: "BLOCKED — PORTFOLIO/RISK", executableShares: null,
      portfolioImpact: { sizing: { riskCompliantShares: "0.485", boardLotExecutableShares: "0" } } });
  });
  it.each(["0.10", "0.15"])("exact capacity boundary %s and fees never over-allocate", cap => {
    const i = approvedDecision(); i.assessment.sizing.fees = "0"; i.assessment.sizing.economicTargetUpper = cap;
    i.assessment.risk.elevatedSizeJustification = "Documented elevated size"; i.assessment.sizing.proposedShares = "1000";
    expect(decide(i).executableShares).toBe(cap === "0.10" ? "500" : "700");
    expect(Number(decide(i).portfolioImpact.postWeight)).toBeLessThanOrEqual(Number(cap));
  });
  it("sector capacity clips, but existing no-add zone cannot be skipped by a large order", () => {
    const i = approvedDecision(); i.assessment.sizing.proposedShares = "1000";
    i.portfolio.positions.push({ securityId: "sector-peer", shares: "100", marketValue: "27000000", sector: i.scorecard.reference.sector });
    expect(decide(i)).toMatchObject({ decisionState: "BUY", executableShares: "100" });
    i.portfolio.positions[0].marketValue = "32000000"; i.assessment.risk.approvalReference = "Independent review";
    expect(decide(i)).toMatchObject({ decisionState: "AVOID", executableShares: null });
    i.portfolio.positions[0].marketValue = "37000000";
    expect(decide(i)).toMatchObject({ decisionState: "BUY", executableShares: "100" });
  });
  it("small-NAV approval never exceeds emergency ceiling; missing approval clips normally", () => {
    const i = approvedDecision(); i.assessment.sizing.proposedShares = "1600"; i.assessment.sizing.economicTargetUpper = "0.5";
    i.assessment.risk.smallNavException = true; i.assessment.risk.normalizationPlan = "Future contributions normalize exposure";
    i.assessment.risk.elevatedSizeJustification = "Small NAV";
    expect(decide(i).executableShares).toBe("700");
    i.assessment.risk.approvalReference = "Independent approved risk exception";
    const d = decide(i); expect(d.executableShares).toBe("1400"); expect(Number(d.portfolioImpact.postWeight)).toBeLessThanOrEqual(0.30);
  });
  it.each(["EXECUTE", "STAGED", "TEMPORARILY DEFERRED"] as const)("CR-02 BROKEN always SELL with %s timing", timing => {
    const i = approvedDecision(true); i.assessment.thesis.status = "BROKEN"; i.assessment.thesis.violatedCondition = "Franchise lost";
    i.assessment.ownershipCase.reductionReason = "THESIS"; i.assessment.ownershipCase.targetShares = "50";
    i.assessment.technical.timing = timing;
    if (timing === "TEMPORARILY DEFERRED") Object.assign(i.assessment.technical, { concreteRisk: "Settlement restriction", resumeCondition: "Restriction clears", expiryTrigger: "Daily review" });
    expect(decide(i)).toMatchObject({ decisionState: "SELL", targetShares: "0", executionStatus: timing === "EXECUTE" ? "EXECUTE" : "STAGED" });
    i.assessment.sizing.operationalBlock = "Trading halt";
    expect(decide(i)).toMatchObject({ decisionState: "SELL", executionStatus: "BLOCKED — PORTFOLIO/RISK", executableShares: null });
  });
  function exceptional() {
    const i = approvedDecision(); i.scorecard.input.residualRisk.status = "LOW";
    i.assessment.valuation.expectedReturn = "0.135"; i.assessment.requiredReturn.exceptionRequested = true;
    return i;
  }
  it("CR-03 qualifying exception retains evidence/rationale without manual approval", () => {
    const i = exceptional(); const d = decide(i);
    expect(d).toMatchObject({ decisionState: "BUY", requiredReturn: { requiredReturn: "0.12", exceptionApplied: true, evidenceRefs: i.assessment.evidenceRefs } });
    expect(d.input.assessment.requiredReturn.rationale).toBe(i.assessment.requiredReturn.rationale);
    expect(d.lineage.evidenceRefs).toEqual(i.assessment.evidenceRefs);
    i.assessment.requiredReturn.rationale = ""; expect(() => decide(i)).toThrow();
  });
  it.each(["veryHighQuality", "strongFinancialResilience", "strongDownsideProtection", "resilienceBenefit", "noBetterQualifiedAlternative"] as const)("CR-03 missing %s rejects exception", key => {
    const i = exceptional(); i.assessment.requiredReturn[key] = false;
    expect(decide(i)).toMatchObject({ decisionState: "AVOID", requiredReturn: { exceptionApplied: false, requiredReturn: "0.15" } });
  });
  it("CR-03 independent risk approval still blocks new capital", () => {
    const i = exceptional(); i.assessment.risk.drawdown = "CRITICAL";
    expect(decide(i)).toMatchObject({ decisionState: "AVOID", tradeAuthorization: "NOT AUTHORIZED", requiredReturn: { exceptionApplied: true } });
    i.assessment.risk.approvalReference = "Independent risk approval";
    expect(decide(i).executionStatus).toBe("EXECUTE");
  });
  it.each(["approvalReference", "methodologyId", "semanticVersion", "effectiveDate", "recordedAt", "governingDocumentReference"] as const)("client cannot change pinned %s", key => {
    const i = approvedDecision(); Object.assign(i.methods.decision, { [key]: "forged" }); expect(() => decide(i)).toThrow();
  });
  it.each(["decisionState", "executionStatus", "riskCompliantShares", "allocationBlocked"])("client cannot override %s", key => {
    const i = approvedDecision(); Object.assign(i, { [key]: "override" }); expect(() => decide(i)).toThrow();
  });
  it("historical artifacts captured before alignment replay byte-for-byte", () => {
    for (const artifact of historicalDecisions) expect(JSON.stringify(decide(artifact.input as unknown as DecisionInput))).toBe(JSON.stringify(artifact));
  });
});

it.each(["score", "Top10", "low P/E", "technical signal", "board-lot affordability", "monthly DCA cash"])("approved CR-01 preserves anti-shortcut: %s alone is not BUY", () => {
  const i = approvedDecision(); i.assessment.valuation.status = "EXPENSIVE"; i.assessment.technical.status = "FAVORABLE";
  expect(decide(i)).toMatchObject({ decisionState: "AVOID", executableShares: null });
});
it.each(["price decline", "loss position"])("approved CR-01 preserves anti-shortcut: %s alone is not ACCUMULATE", () => {
  const i = approvedDecision(true); i.assessment.thesis.averagingDown = true; i.assessment.thesis.forwardEconomicsImproved = false;
  expect(decide(i).decisionState).toBe("HOLD");
});
it.each(["+20% gain", "technical weakness"])("approved CR-01 preserves anti-shortcut: %s alone is not REDUCE/SELL", () => {
  const i = approvedDecision(true); i.assessment.technical.status = "UNFAVORABLE";
  expect(decide(i).decisionState).toBe("ACCUMULATE");
});
it("approved implementation preserves accounting and cash opportunity gates", () => {
  const i = approvedDecision(); i.portfolio.integrity.status = "BLOCKED";
  expect(decide(i)).toMatchObject({ decisionState: "AVOID", executableShares: null });
  i.portfolio.integrity.status = "PASS"; i.assessment.opportunity.cash = "BETTER";
  expect(decide(i)).toMatchObject({ decisionState: "AVOID", opportunityCost: { capitalUse: "HOLD CASH" } });
});

it("zero requested shares is execution infeasibility, not zero portfolio capacity", () => {
  const i = approvedDecision(); i.assessment.sizing.proposedShares = "0";
  expect(decide(i)).toMatchObject({ decisionState: "BUY", executionStatus: "BLOCKED — PORTFOLIO/RISK", executableShares: null });
});
