import { describe, it, expect } from "vitest";
import { decimal } from "@/domain/portfolio/values";
import { decide } from "@/domain/decision/engine";
import type { DecisionInput } from "@/domain/decision/contracts";
import { MONOTONIC_DECISION_METHODOLOGY } from "@/domain/decision/approved-methodology";
import { monotonicDecision } from "../fixtures/decision";
import historical from "../fixtures/m652-historical-decisions.json";

const exposures = ["24.99", "25", "25.01", "29.99", "30", "30.01", "32", "34.99", "35", "35.01", "37", "39.99", "40", "40.01"];
const approvals = ["NONE", "GENERIC", "DRAWDOWN", "SMALL_NAV", "NORMALIZATION", "FORGED_SECTOR_SCOPE"] as const;
function sectorInput(exposure: string, approval: typeof approvals[number] = "GENERIC", owned = false) {
  const i = monotonicDecision(owned);
  i.assessment.sizing.proposedShares = "1000";
  i.assessment.risk.elevatedSizeJustification = "Unchanged assessment of elevated exposure";
  i.portfolio.executableCash = "50000000";
  i.portfolio.positions.push({ securityId: "sector-peer", shares: "100", marketValue: decimal(exposure).mul(decimal("1000000")).sub(decimal(owned ? "2000000" : "0")).toString(), sector: i.scorecard.reference.sector });
  if (approval !== "NONE" && approval !== "NORMALIZATION") i.assessment.risk.approvalReference = approval === "FORGED_SECTOR_SCOPE" ? "APPROVED — SECTOR_CONCENTRATION: client claims unlimited permission" : "Same arbitrary approval reference";
  if (approval === "DRAWDOWN") i.assessment.risk.drawdown = "CRITICAL";
  if (approval === "SMALL_NAV") i.assessment.risk.smallNavException = true;
  if (["NORMALIZATION", "SMALL_NAV", "FORGED_SECTOR_SCOPE"].includes(approval)) i.assessment.risk.normalizationPlan = "Client claims a plan permits adding until 40 percent";
  return i;
}
function sizingOf(d: ReturnType<typeof decide>) {
  if (d.portfolioImpact.status !== "PASS" || !d.portfolioImpact.sizing) throw new Error("Expected validated sizing for this fixture");
  return d.portfolioImpact.sizing;
}
function row(exposure: string, approval: typeof approvals[number], owned = false) {
  const d = decide(sectorInput(exposure, approval, owned));
  const sizing = sizingOf(d);
  return { exposure, validatedExceptionScope: "NONE — CONTRACT CANNOT VALIDATE SECTOR-ADD AUTHORITY", riskCompliantShares: sizing.riskCompliantShares,
    boardLotExecutableShares: sizing.boardLotExecutableShares, decisionState: d.decisionState, executionStatus: d.executionStatus, tradeAuthorization: d.tradeAuthorization };
}

describe("M6.5.3 sector concentration monotonicity", () => {
  it.each(approvals)("fixed %s evidence cannot unlock capacity as concentration worsens", approval => {
    for (const owned of [false, true]) {
      const rows = exposures.map(exposure => row(exposure, approval, owned));
      for (let index = 1; index < rows.length; index++) {
        expect(decimal(rows[index].riskCompliantShares).units, JSON.stringify(rows)).toBeLessThanOrEqual(decimal(rows[index - 1].riskCompliantShares).units);
        expect(decimal(rows[index].boardLotExecutableShares).units).toBeLessThanOrEqual(decimal(rows[index - 1].boardLotExecutableShares).units);
      }
      for (const r of rows.filter(r => Number(r.exposure) >= 30)) expect(r).toMatchObject({ riskCompliantShares: "0", boardLotExecutableShares: "0", decisionState: owned ? "HOLD" : "AVOID", executionStatus: "NOT ACTIONABLE", tradeAuthorization: "NOT AUTHORIZED" });
    }
  });
  it.each(exposures)("records boundary %s with identical generic approval", exposure => {
    const r = row(exposure, "GENERIC");
    const expected = Number(exposure) < 30 ? {
      riskCompliantShares: ({ "24.99": "250.455", "25": "249.955", "25.01": "249.455", "29.99": "0.455" } as Record<string, string>)[exposure],
      boardLotExecutableShares: exposure === "29.99" ? "0" : "200", decisionState: "BUY",
      executionStatus: exposure === "29.99" ? "BLOCKED — PORTFOLIO/RISK" : "EXECUTE", tradeAuthorization: exposure === "29.99" ? "NOT AUTHORIZED" : "AUTHORIZED",
    } : { riskCompliantShares: "0", boardLotExecutableShares: "0", decisionState: "AVOID", executionStatus: "NOT ACTIONABLE", tradeAuthorization: "NOT AUTHORIZED" };
    expect(r).toEqual({ exposure, validatedExceptionScope: "NONE — CONTRACT CANNOT VALIDATE SECTOR-ADD AUTHORITY", ...expected });
  });
  it("M65-R3-M01: same candidate/NAV/approval/normalization, 37% cannot unlock what 32% blocks", () => {
    const a = sectorInput("32", "FORGED_SECTOR_SCOPE"), b = sectorInput("37", "FORGED_SECTOR_SCOPE");
    expect({ ...a, portfolio: null }).toEqual({ ...b, portfolio: null });
    expect({ ...a.portfolio, positions: null }).toEqual({ ...b.portfolio, positions: null });
    const low = decide(a), high = decide(b);
    expect(decimal(sizingOf(high).riskCompliantShares).units).toBeLessThanOrEqual(decimal(sizingOf(low).riskCompliantShares).units);
    for (const d of [low, high]) expect(d).toMatchObject({ decisionState: "AVOID", executableShares: null, tradeAuthorization: "NOT AUTHORIZED" });
  });
  it.each(["BUY", "STRONG BUY", "ACCUMULATE"])("CR-01 preserves %s with smaller sector-compliant capacity", state => {
    const i = sectorInput("25", "GENERIC", state === "ACCUMULATE");
    if (state === "STRONG BUY") { i.assessment.valuation.expectedReturn = "0.20"; i.assessment.valuation.exceptionalAsymmetry = true; }
    expect(decide(i)).toMatchObject({ decisionState: state, executableShares: "200", executionStatus: "EXECUTE" });
    i.portfolio.positions[i.portfolio.positions.length - 1].marketValue = state === "ACCUMULATE" ? "27990000" : "29990000";
    expect(decide(i)).toMatchObject({ decisionState: state, executableShares: null, executionStatus: "BLOCKED — PORTFOLIO/RISK" });
  });
  it("CR-02 BROKEN remains SELL despite sector block and staging", () => {
    const i = sectorInput("40.01", "GENERIC", true); i.assessment.thesis.status = "BROKEN"; i.assessment.thesis.violatedCondition = "Franchise lost"; i.assessment.technical.timing = "STAGED";
    expect(decide(i)).toMatchObject({ decisionState: "SELL", executionStatus: "STAGED", targetShares: "0" });
  });
  it("CR-03 12% floor retains qualification/evidence and independent risk approval", () => {
    const i = sectorInput("25", "NONE"); i.scorecard.input.residualRisk.status = "LOW"; i.assessment.valuation.expectedReturn = "0.135"; i.assessment.requiredReturn.exceptionRequested = true;
    expect(decide(i)).toMatchObject({ decisionState: "BUY", requiredReturn: { exceptionApplied: true, requiredReturn: "0.12", evidenceRefs: i.assessment.evidenceRefs } });
    i.assessment.risk.drawdown = "CRITICAL";
    expect(decide(i)).toMatchObject({ tradeAuthorization: "NOT AUTHORIZED", requiredReturn: { exceptionApplied: true } });
    i.assessment.risk.approvalReference = "Independent drawdown approval";
    expect(decide(i).decisionState).toBe("BUY");
    i.assessment.requiredReturn.strongDownsideProtection = false;
    expect(decide(i).requiredReturn.exceptionApplied).toBe(false);
  });
  it.each(["sectorException", "decisionState", "executionStatus", "riskCompliantShares"])("client %s is rejected", key => {
    const i = sectorInput("37"); Object.assign(i, { [key]: "APPROVED" }); expect(() => decide(i)).toThrow();
  });
  it.each(["approvalReference", "methodologyId", "implementationIdentity", "semanticVersion", "governingDocumentReference"])("client cannot forge current methodology %s", key => {
    const i = sectorInput("37"); Object.assign(i.methods.decision, { [key]: "forged" }); expect(() => decide(i)).toThrow();
  });
  it("M6.5.2 formal artifacts replay exactly; the corrected version creates different new truth", () => {
    for (const artifact of historical) {
      expect(JSON.stringify(decide(artifact.input as unknown as DecisionInput))).toBe(JSON.stringify(artifact));
      const input = JSON.parse(JSON.stringify(artifact.input).replaceAll("2026-09-30T09:00:00.000Z", "2026-10-01T09:00:00.000Z"));
      input.methods.decision = MONOTONIC_DECISION_METHODOLOGY; input.methods.requiredReturn = MONOTONIC_DECISION_METHODOLOGY; input.id += "-corrected";
      expect(decide(input)).toMatchObject({ decisionState: "AVOID", tradeAuthorization: "NOT AUTHORIZED" });
    }
    expect(historical.map(d => d.decisionState)).toEqual(["AVOID", "BUY"]);
  });
});
