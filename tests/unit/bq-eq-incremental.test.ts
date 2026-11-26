import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { MATERIALITY_TOPICS, scoreIncrementalEconomicQuality, type IncrementalInput } from "@/domain/current-scoring/bq-eq-incremental";
import { retainLatestValidEconomicQuality } from "@/domain/current-scoring/bq-eq-retention";
import { RUBRICS } from "@/domain/scoring/methodology";
import {
  aggregateResearchEffectiveScores, buildResearchDecisionScoreInput, rankResearchEffectiveScores,
  resolveEconomicQualityEffectiveScore,
} from "@/domain/current-scoring/research-effective-score";
import type { EconomicQualityAssessment } from "@/domain/current-scoring/bq-eq-research";

const retentionCommand = ["tools/scoring/validate_fpt_bq_eq_retention.mjs", "--ticker", "FPT"];
const command = ["tools/scoring/validate_fpt_bq_eq_incremental.mjs", "--ticker", "FPT"];
const old = { required: ["fy"], supporting: [], rationale: "Reviewed statement" };
const annual: EconomicQualityAssessment = {
  returns: { ...old, hurdle: "WACC", measure: "ROIC", comparable: true, leverageReviewed: true, relativeToHurdleEstablished: true },
  cost: { ...old, low: .12, high: .15, method: "WACC", assumptions: "Market assumptions", sensitivity: "Stress", limitations: "Estimate" },
  persistence: { ...old, fiscalYears: [2023, 2024, 2025], comparable: true },
  counter: old, margins: { ...old, material: false, contradictionResolved: true },
  attempts: [{ route: "A", status: "SUPPORTED", rationale: "Operating return" }],
  proposed: { band: "Good economics", points: 5, strongerEvidence: "", exceptionalJustification: "", durableSuperior: false },
};
const unable: EconomicQualityAssessment = {
  ...annual, returns: { ...annual.returns, comparable: false }, proposed: null,
  attempts: (["A", "B", "C", "D"] as const).map(route => ({ route, status: "UNAVAILABLE", rationale: "Insufficient comparable capital" })),
};
function fixture(): IncrementalInput {
  const baseline = {
    id: "prior", methodology: "v1.0", implementation: "prior", quality: "CONSERVATIVE" as const,
    economicCutoff: "2026-03-19", assessedAt: "2026-03-20", financialPeriod: "2025-12-31",
    method: { normalization: "operating returns", capitalCostFramework: "WACC", scope: "same" },
    confidence: { dimensions: [2, 2, 2, 1, 1] as const, rationale: "Annual review" }, assessment: annual,
  };
  return {
    sector: "TECHNOLOGY", baseline,
    reassessment: { ...baseline, id: "new", economicCutoff: "2026-11-13", assessedAt: "2026-11-26",
      financialPeriod: "2026-09-30", assessment: unable },
    evidence: {
      fy: { publicBy: "2026-03-19", periodEnd: "2025-12-31", kind: "ANNUAL" },
      q3: { publicBy: "2026-10-28", periodEnd: "2026-09-30", kind: "INTERIM" },
    },
    updateRefs: ["q3"],
    review: {
      cutoff: "2026-11-13", reviewedAt: "2026-11-26", financialPeriod: "2026-09-30",
      reviewedRefs: ["q3"], changes: MATERIALITY_TOPICS.map(topic => ({
        topic, status: "NO_MATERIAL_IMPACT", refs: ["q3"], impact: "Operating trend consistent",
      })),
      continuedApplicability: { refs: ["q3"], established: true, rationale: "Published operating results corroborate spread" },
      inheritanceRationale: "Current operations support the band despite incomplete reports",
      unresolvedMetrics: ["current ROIC"], limitations: ["partial current capital"],
      reassessmentTriggers: ["new authoritative annual results"],
      confidence: { dimensions: [2, 1, 2, 1, 1], rationale: "Limited current calculations" },
      transition: null,
    },
  };
}
const fresh = (points: number, band: string): EconomicQualityAssessment => ({
  ...annual, returns: { ...annual.returns, required: ["q3"] }, proposed: { ...annual.proposed!, points, band },
  counter: { ...old, required: ["q3"] },
});

it("reproduces the baseline and inherits with an independently reassessed confidence", () => {
  const outcome = scoreIncrementalEconomicQuality(fixture());
  expect(outcome.baseline).toMatchObject({ points: 5, updateStatus: "BASELINE", confidence: { total: 8 } });
  expect(outcome.current).toMatchObject({ points: 5, inheritedFrom: "prior", updateStatus: "CARRIED_FORWARD",
    underlyingFinancialPeriod: "2025-12-31", quality: "CONSERVATIVE", confidence: { total: 7 } });
  expect(outcome.current).not.toHaveProperty("comparableRoic");
});

it.each([
  [7, "Consistently superior economics", "UPDATED"],
  [3, "Average economics", "UPDATED"],
  [5, "Good economics", "REAFFIRMED"],
] as const)("executes a supported current assessment of %i", (points, band, status) => {
  const x = fixture();
  x.reassessment.assessment = fresh(points, band);
  expect(scoreIncrementalEconomicQuality(x).current).toMatchObject({ points, band, updateStatus: status });
});

it("permits a documented and economically bounded structural transition", () => {
  const x = fixture();
  x.reassessment.method = { ...x.reassessment.method, scope: "changed" };
  expect(scoreIncrementalEconomicQuality(x).current.inheritanceGaps).toContain("SCOPE_TRANSITION_REVIEW_REQUIRED");
  x.review.transition = { rationale: "Accounting change", implications: "Comparable economics bounded", refs: ["q3"] };
  x.review.changes = x.review.changes.map(row => row.topic === "consolidation"
    ? { ...row, status: "MATERIAL_BUT_BOUNDED" } : row);
  expect(scoreIncrementalEconomicQuality(x).current.updateStatus).toBe("CARRIED_FORWARD");
});

const retention = (input: IncrementalInput) =>
  retainLatestValidEconomicQuality(scoreIncrementalEconomicQuality(input), input.baseline, input.reassessment);

it("retains the latest valid score while material impact remains unresolved", () => {
  const x = fixture();
  x.review.changes = x.review.changes.map(row => row.topic === "returns"
    ? { ...row, status: "MATERIAL_IMPACT_UNRESOLVED" } : row);
  expect(retention(x)).toMatchObject({
    latestValidAssessment: { id: "prior", points: 5, financialPeriod: "2025-12-31" },
    current: { points: null, validity: "NOT_RATED", totalScore: null,
      inheritanceGaps: ["MATERIAL_IMPACT_BLOCKS_INHERITANCE"], publicationAuthorized: false },
    updateStatus: "MATERIAL_REVIEW_PENDING", currentRankingEligible: false, investmentActionable: false,
  });
});

it("preserves the historical record after confirmed invalidation of current use", () => {
  const x = fixture();
  x.review.changes = x.review.changes.map(row => row.topic === "returns"
    ? { ...row, status: "MATERIAL_INVALIDATING" } : row);
  expect(retention(x)).toMatchObject({
    latestValidAssessment: { id: "prior", points: 5 },
    current: { points: null, validity: "NOT_RATED" },
    updateStatus: "INVALIDATED", currentRankingEligible: false,
  });
  x.review.reviewedRefs = [];
  expect(retention(x).updateStatus).toBe("UPDATE_PENDING");
});

it("advances to a supported replacement only after reviewing material counterevidence", () => {
  const x = fixture();
  x.review.changes = x.review.changes.map(row => row.topic === "returns"
    ? { ...row, status: "MATERIAL_IMPACT_UNRESOLVED" } : row);
  x.reassessment.assessment = { ...fresh(3, "Average economics"), counter: old };
  expect(retention(x).updateStatus).toBe("MATERIAL_REVIEW_PENDING");
  x.reassessment.assessment = fresh(3, "Average economics");
  const result = retention(x);
  expect(result).toMatchObject({
    latestValidAssessment: { id: "new", points: 3, financialPeriod: "2026-09-30" },
    current: { points: 3, validity: "VALID_RESEARCH" }, updateStatus: "UPDATED",
    currentRankingEligible: false, investmentActionable: false,
  });
});

it("retains historical points without affirmative support for current inheritance", () => {
  const x = fixture();
  x.review.continuedApplicability.established = false;
  expect(retention(x)).toMatchObject({
    latestValidAssessment: { points: 5 },
    current: { points: null, inheritanceGaps: ["AFFIRMATIVE_SUPPORT_REQUIRED"] },
    updateStatus: "UPDATE_PENDING",
  });
});

it("preserves valid inherited and reaffirmed current results", () => {
  const x = fixture();
  expect(retention(x)).toMatchObject({ updateStatus: "CARRIED_FORWARD", current: { points: 5, validity: "VALID_RESEARCH" } });
  x.reassessment.assessment = fresh(5, "Good economics");
  expect(retention(x)).toMatchObject({
    updateStatus: "REAFFIRMED", latestValidAssessment: { id: "prior", points: 5 },
    current: { points: 5, validity: "VALID_RESEARCH" },
  });
});

it("rejects missing, expired or unsupported prior evidence", () => {
  const x = fixture();
  const expired = { ...x, evidence: { ...x.evidence, fy: { ...x.evidence.fy, expiresOn: "2026-06-30" } } };
  expect(retention(expired)).toMatchObject({
    latestValidAssessment: { points: 5 }, current: { points: null }, investmentActionable: false,
  });
  for (const invalid of [{ ...x, baseline: null }, { ...x, evidence: { q3: x.evidence.q3 } }]) {
    expect(retention(invalid)).toMatchObject({ latestValidAssessment: null, updateStatus: "NOT_RATED" });
  }
  for (const invalid of [expired, { ...x, baseline: null }, { ...x, evidence: { q3: x.evidence.q3 } }]) {
    expect(scoreIncrementalEconomicQuality(invalid).current.inheritanceGaps).toContain("VALID_BASELINE_REQUIRED");
  }
});

it("requires affirmative new evidence and a cutoff-bound review", () => {
  const x = fixture();
  x.review.continuedApplicability.established = false;
  expect(scoreIncrementalEconomicQuality(x).current.inheritanceGaps).toContain("AFFIRMATIVE_SUPPORT_REQUIRED");
  const stale = fixture();
  stale.review.reviewedRefs = [];
  expect(scoreIncrementalEconomicQuality(stale).current.inheritanceGaps).toContain("FRESH_REVIEW_REQUIRED");
  const future = { ...x, evidence: { ...x.evidence, q3: { ...x.evidence.q3, publicBy: "2026-11-14" } } };
  expect(scoreIncrementalEconomicQuality(future).current.points).toBeNull();
  expect(retention(future)).toMatchObject({ updateStatus: "UPDATE_PENDING",
    latestValidAssessment: { points: 5 }, current: { points: null } });
  expect(retention({ ...x, baseline: { ...x.baseline!, economicCutoff: "2026-11-14" } })
    .latestValidAssessment).toBeNull();
});

it("requires newer authoritative annual evidence to replace the inherited assessment", () => {
  const x = fixture();
  expect(scoreIncrementalEconomicQuality(x).current.updateStatus).toBe("CARRIED_FORWARD");
  x.evidence = { ...x.evidence, next: { publicBy: "2027-03-18", periodEnd: "2026-12-31", kind: "ANNUAL" } };
  x.updateRefs = [...x.updateRefs, "next"];
  x.review = { ...x.review, reviewedAt: "2027-03-20", cutoff: "2027-03-19", financialPeriod: "2026-12-31",
    reviewedRefs: ["q3", "next"] };
  expect(scoreIncrementalEconomicQuality(x).current.inheritanceGaps).toContain("NEW_ANNUAL_REASSESSMENT_REQUIRED");
  expect(retention(x)).toMatchObject({ updateStatus: "UPDATE_PENDING", latestValidAssessment: { points: 5 },
    current: { points: null } });
  x.reassessment = { ...x.reassessment, assessedAt: x.review.reviewedAt, economicCutoff: x.review.cutoff,
    financialPeriod: x.review.financialPeriod, assessment: { ...fresh(7, "Consistently superior economics"),
      returns: { ...annual.returns, required: ["next"] } } };
  expect(scoreIncrementalEconomicQuality(x).current).toMatchObject({ points: 7, updateStatus: "UPDATED" });
});

it("blocks undocumented method substitution and still enforces D1–D8", () => {
  const x = fixture();
  x.reassessment.method = { ...x.reassessment.method, scope: "changed" };
  x.reassessment.assessment = fresh(7, "Consistently superior economics");
  expect(scoreIncrementalEconomicQuality(x).current.points).toBeNull();
  x.review.transition = { rationale: "Structural change", implications: "Normalize the operands", refs: ["q3"] };
  x.review.continuedApplicability.established = false;
  const supported = fresh(8, "Consistently superior economics");
  x.reassessment.assessment = supported;
  expect(scoreIncrementalEconomicQuality(x).current.reassessmentGaps).toContain("MAXIMUM_PREREQUISITES");
});

it("replays real FPT from sealed inputs, leaves current ROIC null and refuses publication", () => {
  const actual = execFileSync(process.execPath, command, { encoding: "utf8" });
  expect(actual).toBe(readFileSync("docs/fundamental-data-engine/fpt-bq-eq/2026-11-26/FPT_BQ_EQ_INCREMENTAL_RESULT.json", "utf8"));
  const result = JSON.parse(actual);
  expect(result).toMatchObject({ scope: "REAL_ISSUER_RESEARCH", baseline: { points: 5 },
    current: { points: null, comparableRoic: null, updateStatus: "INVALIDATED", publicationAuthorized: false } });
  expect(spawnSync(process.execPath, [...command, "--publish"]).status).toBe(1);
});

it("replays v1.2 on the exact retained FPT input without promoting historical points", () => {
  const actual = execFileSync(process.execPath, retentionCommand, { encoding: "utf8" });
  expect(actual).toBe(readFileSync("docs/fundamental-data-engine/fpt-bq-eq/v1.2/FPT_BQ_EQ_V1_2_RESULT.json", "utf8"));
  expect(JSON.parse(actual)).toMatchObject({
    scope: "REAL_ISSUER_RESEARCH", updateStatus: "MATERIAL_REVIEW_PENDING",
    latestValidAssessment: { points: 5, band: "Good economics", financialPeriod: "2025-12-31" },
    current: { points: null, totalScore: null, comparableRoic: null, validity: "NOT_RATED",
      review: { cutoff: "2026-11-13", financialPeriod: "2026-09-30" } },
    currentRankingEligible: false, investmentActionable: false,
  });
  expect(spawnSync(process.execPath, [...retentionCommand, "--publish"]).status).toBe(1);
});

const effective = (x: IncrementalInput) => resolveEconomicQualityEffectiveScore(retention(x));
const effectiveCommand = ["tools/scoring/validate_fpt_bq_eq_effective.mjs", "--ticker", "FPT"];

it("uses qualified points provisionally despite unresolved materiality and missing affirmative support", () => {
  const x = fixture();
  x.review.continuedApplicability.established = false;
  expect(effective(x)).toMatchObject({ points: 5, validity: "PROVISIONAL", updateStatus: "UPDATE_PENDING" });
  x.review.changes = x.review.changes.map(row => row.topic === "returns"
    ? { ...row, status: "MATERIAL_IMPACT_UNRESOLVED" } : row);
  expect(effective(x)).toMatchObject({ points: 5, validity: "PROVISIONAL", updateStatus: "MATERIAL_REVIEW_PENDING",
    currentReassessmentPoints: null, currentConfirmedPoints: null, currentComparableRoic: null });
  x.reassessment.assessment = fresh(3, "Average economics");
  expect(effective(x)).toMatchObject({ points: 3, validity: "CONFIRMED_CURRENT", currentReassessmentPoints: 3 });
});

it("accepts confirmed inheritance while preserving the distinction from a new reassessment", () => {
  expect(effective(fixture())).toMatchObject({ points: 5, validity: "CONFIRMED_CURRENT", basis: "CARRIED_FORWARD",
    currentReassessmentPoints: null, currentConfirmedPoints: 5 });
});

it("excludes confirmed invalidation, expired foundations and unqualified historical scores", () => {
  const x = fixture();
  x.review.changes = x.review.changes.map(row => row.topic === "returns"
    ? { ...row, status: "MATERIAL_INVALIDATING" } : row);
  expect(effective(x)).toMatchObject({ points: null, latestValidPoints: 5, validity: "N/R" });

  const y = fixture();
  expect(effective({ ...y, baseline: null }).points).toBeNull();
  expect(effective({ ...y, evidence: { ...y.evidence, fy: { ...y.evidence.fy, expiresOn: "2026-06-30" } } }))
    .toMatchObject({ points: null, latestValidPoints: 5 });
  expect(effective({ ...y, evidence: { q3: y.evidence.q3 } }).latestValidPoints).toBeNull();

  y.evidence = { ...y.evidence, annual: { kind: "ANNUAL", publicBy: "2026-11-10", periodEnd: "2026-09-30" } };
  y.updateRefs = [...y.updateRefs, "annual"];
  y.review.reviewedRefs = [...y.review.reviewedRefs, "annual"];
  expect(effective(y)).toMatchObject({ points: null, latestValidPoints: 5, updateStatus: "UPDATE_PENDING" });
});

it("adds exactly five points at the original weight and calculates a full provisional total only with complete coverage", () => {
  const x = fixture();
  x.review.continuedApplicability.established = false;
  const bq = effective(x);
  const partial = aggregateResearchEffectiveScores(bq);
  expect(partial.categories.find(category => category.id === "BQ")).toMatchObject({
    max: 25, points: null, assessedPoints: 5, ratedWeight: 8, includesProvisional: true,
  });
  expect(partial).toMatchObject({
    assessedPoints: 5, ratedWeight: 8, provisionalInvestmentScore: null, confirmedCurrentInvestmentScore: null,
    coverage: { confirmedCurrent: { count: 0, weight: 0 }, effective: { count: 1, weight: 8 },
      provisional: { count: 1, weight: 8 }, genuineNR: { count: 22, weight: 92 } },
  });
  const full = aggregateResearchEffectiveScores(bq, RUBRICS.filter(row => row.id !== "BQ-EQ")
    .map(row => ({ id: row.id, points: row.max, evidenceReference: "synthetic-qualified-coverage-fixture" })));
  expect(full.categories.find(category => category.id === "BQ")).toMatchObject({ max: 25, points: 22, includesProvisional: true });
  expect(full).toMatchObject({
    theoreticalMaximum: 100, provisionalInvestmentScore: 97, confirmedCurrentInvestmentScore: null,
    formalScore: null, formalRankingEligible: false, investmentActionable: false,
  });
});

it("compares matched research inputs and forwards the same score and controlling gates to Decision research", () => {
  const first = fixture();
  first.review.continuedApplicability.established = false;
  const second = fixture();
  second.reassessment.assessment = fresh(3, "Average economics");
  const firstScore = aggregateResearchEffectiveScores(effective(first));
  const secondScore = aggregateResearchEffectiveScores(effective(second));
  expect(rankResearchEffectiveScores([
    { ticker: "SECOND_FIXTURE", aggregation: secondScore }, { ticker: "FIRST_FIXTURE", aggregation: firstScore },
  ])).toMatchObject([
    { ticker: "FIRST_FIXTURE", rank: 1, bqEqPoints: 5, includesProvisional: true, formalRankingEligible: false },
    { ticker: "SECOND_FIXTURE", rank: 2, bqEqPoints: 3 },
  ]);
  expect(buildResearchDecisionScoreInput(firstScore, { stage0: "FAIL", hardVeto: "ACTIVE", residualRisk: "HIGH" }))
    .toMatchObject({ bqEq: { points: 5 }, gates: { stage0: "FAIL", hardVeto: "ACTIVE", residualRisk: "HIGH" },
      investmentActionable: false, formalDecisionAuthorized: false });
});

it("runs the actual FPT Effective Score through aggregation, research ranking, Decision inputs and local scorecard", () => {
  const actual = execFileSync(process.execPath, effectiveCommand, { encoding: "utf8" });
  expect(actual).toBe(readFileSync("docs/fundamental-data-engine/fpt-bq-eq/v1.2/FPT_BQ_EQ_V1_2_EFFECTIVE_RESULT.json", "utf8"));
  expect(JSON.parse(actual)).toMatchObject({
    scope: "REAL_ISSUER_RESEARCH",
    effectiveScore: { points: 5, validity: "PROVISIONAL", financialPeriod: "2025-12-31", updateStatus: "MATERIAL_REVIEW_PENDING",
      reviewedFinancialPeriod: "2026-09-30", currentReassessmentPoints: null, currentComparableRoic: null },
    aggregation: { assessedPoints: 5, ratedWeight: 8, provisionalInvestmentScore: null,
      coverage: { effective: { count: 1, weight: 8 } } },
    researchRanking: [{ bqEqPoints: 5, assessedPoints: 5, rank: null, comparedIssuerCount: 1 }],
    investmentDecisionInput: { bqEq: { points: 5, materialDependencies: expect.arrayContaining([
      expect.objectContaining({ topic: "consolidation", status: "MATERIAL_IMPACT_UNRESOLVED" }),
    ]) }, investmentActionable: false, gates: { stage0: "UNKNOWN", hardVeto: "PENDING", residualRisk: "NOT_RATED" } },
  });
  const html = execFileSync(process.execPath, [...effectiveCommand, "--html"], { encoding: "utf8" });
  for (const text of ["BQ-EQ 5/8", "FY2025", "2026-11-13", "MATERIAL_REVIEW_PENDING", "N/R", "Unavailable", "PROVISIONAL"]) {
    expect(html).toContain(text);
  }
  expect(spawnSync(process.execPath, [...effectiveCommand, "--publish"]).status).toBe(1);
}, 20000);
