import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { MATERIALITY_TOPICS, scoreIncrementalEconomicQuality, type IncrementalInput } from "@/domain/current-scoring/bq-eq-incremental";
import type { EconomicQualityAssessment } from "@/domain/current-scoring/bq-eq-research";

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

it.each(["MATERIAL_INVALIDATING", "MATERIAL_IMPACT_UNRESOLVED"] as const)("blocks inheritance on %s", status => {
  const x = fixture();
  x.review.changes = x.review.changes.map(row => row.topic === "returns" ? { ...row, status } : row);
  expect(scoreIncrementalEconomicQuality(x).current).toMatchObject({ points: null, updateStatus: "INVALIDATED",
    inheritanceGaps: ["MATERIAL_IMPACT_BLOCKS_INHERITANCE"] });
  x.reassessment.assessment = fresh(3, "Average economics");
  expect(scoreIncrementalEconomicQuality(x).current.updateStatus).toBe("UPDATED");
});

it("rejects missing, expired or unsupported prior evidence", () => {
  const x = fixture();
  const expired = { ...x, evidence: { ...x.evidence, fy: { ...x.evidence.fy, expiresOn: "2026-06-30" } } };
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
});

it("requires newer authoritative annual evidence to replace the inherited assessment", () => {
  const x = fixture();
  expect(scoreIncrementalEconomicQuality(x).current.updateStatus).toBe("CARRIED_FORWARD");
  x.evidence = { ...x.evidence, next: { publicBy: "2027-03-18", periodEnd: "2026-12-31", kind: "ANNUAL" } };
  x.updateRefs = [...x.updateRefs, "next"];
  x.review = { ...x.review, reviewedAt: "2027-03-20", cutoff: "2027-03-19", financialPeriod: "2026-12-31",
    reviewedRefs: ["q3", "next"] };
  expect(scoreIncrementalEconomicQuality(x).current.inheritanceGaps).toContain("NEW_ANNUAL_REASSESSMENT_REQUIRED");
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
