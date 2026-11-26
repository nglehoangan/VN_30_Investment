import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { scoreAnalystRisk, scoreIncrementalAnalystRisk,
  type RiskFinancialHealth } from "@/domain/current-scoring/fh-analyst-risk";

const dir = "docs/fundamental-data-engine/fpt-financial-health";
const v2 = `${dir}/analyst-risk-v1.2`;
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const retained = read(`${dir}/v1.0/FPT_FH_INPUT.json`);
const proposals = read(`${v2}/FPT_FH_ANALYST_RISK_ASSESSMENT.json`);
const command = ["tools/scoring/validate_fpt_fh_analyst_risk.mjs", "--ticker", "FPT"];

function fixture(index = 1, stage: "annual" | "current" = "annual"): RiskFinancialHealth {
  const full = retained.cases[index].assessment[stage === "annual" ? "baseline" : "reassessment"].assessment;
  return structuredClone({ full, ...proposals.assessments[full.id][stage] });
}

const score = (a: RiskFinancialHealth) => scoreAnalystRisk(a, "TECHNOLOGY", ref => Object.hasOwn(retained.evidence, ref));
function lifecycle() {
  const input = structuredClone(retained.cases[1].assessment);
  input.baseline.assessment = fixture();
  input.reassessment.assessment = fixture(1, "current");
  return { ...input, evidence: retained.evidence };
}
const policy = { historicalUsableThrough: null, nearTermFundingUnrepresentative: false, reason: "Test review" };

it.each([1, 2])("accepts supported rubric %i risk without a v1.1 conclusion", index => {
  const a = fixture(index);
  expect(a.basic.conclusion).toBe("UNRESOLVED");
  expect(score(a)).toMatchObject({ points: 2, assessmentMethod: "A_ANALYST_RISK", routes: {
    B: { points: null }, A: { evaluated: true, gaps: [] },
  } });
});

it("prefers a lower valid canonical B band and suppresses fallback on adverse B evidence", () => {
  const a = fixture();
  a.full.timedCoverageEstablished = true;
  a.full.covenant = "NONDISCLOSURE_BOUNDED";
  a.full.proposed = { band: "Severe funding dependence", points: 1, strongerEvidence: false };
  expect(score(a)).toMatchObject({ points: 1, band: "Severe funding dependence", assessmentMethod: "B_FULL",
    bandSemantics: "CANONICAL_DIRECT", routes: { A: { evaluated: false } } });
  a.full.proposed = null;
  a.fullDisposition = "KNOWN_ADVERSE";
  expect(score(a).routes.A.evaluated).toBe(false);
  a.fullDisposition = "INSUFFICIENT_DETAIL";
  a.full.covenant = "BREACH_RISK";
  expect(score(a).routes.A.evaluated).toBe(false);
});

it("rejects ineligible evidence and does not turn missing evidence into points", () => {
  const a = fixture();
  a.full.counter.resolved = false;
  expect(score(a).routes.A.evaluated).toBe(false);
  a.full.counter.resolved = true;
  a.analyst.proposed = null;
  expect(score(a)).toMatchObject({ points: null, gaps: expect.arrayContaining(["RISK_PROFILE_NOT_ESTABLISHED"]) });
});

it("rejects unsupported evidence, unqualified resources and a material contradiction", () => {
  const a = fixture();
  a.analyst.findings.financialCapacity.basis = "UNSUPPORTED_ASSUMPTION";
  expect(score(a).gaps).toContain("RISK_SELECTED_BAND_EVIDENCE_INSUFFICIENT");
  a.analyst.findings.financialCapacity.basis = "QUALIFIED_EVIDENCE";
  a.analyst.findings.financialCapacity.refs = ["missing"];
  expect(score(a).gaps).toContain("RISK_SELECTED_BAND_EVIDENCE_INSUFFICIENT");
  a.basic.cashBasis = "UNQUALIFIED";
  a.basic.unsupportedFundingExcluded = false;
  expect(score(a).gaps).toContain("BASIC_FUNDING_OR_SCOPE_NOT_QUALIFIED");
  a.analyst.counterevidence = [{ ...a.analyst.counterevidence[0], disposition: "MATERIAL_CONTRADICTION" }];
  expect(score(a).gaps).toContain("RISK_COUNTEREVIDENCE_BLOCKS_OR_UNQUALIFIED");
});

it.each([[1, 4], [2, 5]])("rejects excess rubric %i points", (index, points) => {
  const a = fixture(index);
  a.analyst.proposed = { ...a.analyst.proposed!, points };
  expect(score(a)).toMatchObject({ points: null, gaps: expect.arrayContaining(["RISK_CEILING_EXCEEDED"]) });
});

it("blocks an invalidated or expired historical assessment", () => {
  const input = lifecycle();
  const a: RiskFinancialHealth = input.reassessment.assessment;
  a.analyst.counterevidence = [{ ...a.analyst.counterevidence[0], disposition: "CONFIRMED_INVALIDATION" }];
  expect(scoreIncrementalAnalystRisk(input, policy)).toMatchObject({
    baseline: { points: 2 }, freshness: { invalidated: true }, effectiveScore: { points: null },
  });
  a.analyst.counterevidence = fixture(1, "current").analyst.counterevidence;
  a.analyst.proposed = null;
  expect(scoreIncrementalAnalystRisk(input, { ...policy, historicalUsableThrough: "2026-10-01" }))
    .toMatchObject({ freshness: { expired: true }, effectiveScore: { points: null } });
});

it("keeps confidence independent of points and rejects malformed confidence", () => {
  const input = lifecycle();
  input.review.confidence.dimensions = [0, 0, 0, 0, 0];
  expect(scoreIncrementalAnalystRisk(input, policy)).toMatchObject({
    effectiveScore: { points: 2, validity: "CONFIRMED_CURRENT", routeQualification: {
      confidence: { total: 0 }, actionabilityRestrictions: expect.arrayContaining(["NO_FORMAL_GATE_CREDIT"]),
    } },
  });
  input.review.confidence.dimensions = [3, 0, 0, 0, 0];
  expect(() => scoreIncrementalAnalystRisk(input, policy)).toThrow("BQ_EQ_INVALID_CONFIDENCE");
});

it("replays FPT, preserves accepted rows and qualifies all downstream consumers", () => {
  const raw = execFileSync(process.execPath, command, { encoding: "utf8" });
  expect(raw).toBe(readFileSync(`${v2}/FPT_FH_ANALYST_RISK_RESULT.json`, "utf8"));
  const result = JSON.parse(raw);
  const { aggregation, investmentDecisionInput, researchRanking } = result;
  const prior = read(`${dir}/dual-route-v1.1/FPT_FH_DUAL_ROUTE_RESULT.json`);
  expect(aggregation.effectiveScores.slice(0, 5)).toEqual(prior.aggregation.effectiveScores.slice(0, 5));
  expect(aggregation).toMatchObject({ assessedPoints: 21, ratedWeight: 40, formalScore: null,
    coverage: { genuineNR: { count: 0 }, outsideRollout: { count: 16 }, effective: { count: 7 } } });
  expect(investmentDecisionInput).toMatchObject({ investmentActionable: false, formalDecisionAuthorized: false,
    gates: { financialHealth: "NOT_ASSESSED" }, routeQualifications: aggregation.routeQualifications });
  expect(researchRanking[0]).toMatchObject({ rank: null, routeQualifications: aggregation.routeQualifications });
  expect(spawnSync(process.execPath, [...command, "--publish"]).status).toBe(1);
});

it("marks an explicitly eligible carried-forward A band provisional and preserves its period and method", () => {
  const input = lifecycle();
  input.review.changes = input.review.changes.map((change: { status: string }) =>
    ({ ...change, status: "MATERIAL_BUT_BOUNDED" }));
  input.review.continuedApplicability = { established: true, rationale: "Qualified persistence", refs: ["q3"] };
  input.review.inheritanceRationale = "Retained FY risk profile remains applicable after review.";
  input.reassessment.assessment.analyst.proposed = null;
  expect(scoreIncrementalAnalystRisk(input, policy)).toMatchObject({
    effectiveScore: { points: 2, validity: "PROVISIONAL", currentConfirmedPoints: null,
      financialPeriod: "2025-12-31", routeQualification: { assessmentMethod: "A_ANALYST_RISK" } },
  });
});

it("retains distinct period qualifications when a valid Method B replaces Method A", () => {
  const input = lifecycle();
  const a: RiskFinancialHealth = input.reassessment.assessment;
  a.full.timedCoverageEstablished = true;
  a.full.covenant = "NONDISCLOSURE_BOUNDED";
  a.full.proposed = { band: "Severe funding dependence", points: 1, strongerEvidence: false };
  expect(scoreIncrementalAnalystRisk(input, policy)).toMatchObject({
    baseline: { bandSemantics: "ANALYST_RISK_PROFILE_V1_2", points: 2 },
    current: { bandSemantics: "CANONICAL_DIRECT", points: 1 },
    effectiveScore: { validity: "CONFIRMED_CURRENT", routeQualification: {
      assessmentMethod: "B_FULL", bandSemantics: "CANONICAL_DIRECT", selectedPoints: 1,
    } },
  });
});
