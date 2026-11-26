import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { RUBRICS } from "@/domain/scoring/methodology";
import { scoreCompetitiveAdvantage, type MoatAssessment } from "@/domain/current-scoring/bq-moat-research";
import { scoreIncrementalCompetitiveAdvantage } from "@/domain/current-scoring/bq-moat-incremental";
import { aggregateResearchBusinessQuality } from "@/domain/current-scoring/research-combined-bq";
import { scoreIncrementalResearchAssessment } from "@/domain/current-scoring/research-incremental";
import { scoreIncrementalEconomicQuality, type IncrementalInput } from "@/domain/current-scoring/bq-eq-incremental";
import { scoreEconomicQuality } from "@/domain/current-scoring/bq-eq-research";

const dir = "docs/fundamental-data-engine/fpt-bq-moat/v1.0";
const eqDir = "docs/fundamental-data-engine/fpt-bq-eq";
const command = ["tools/scoring/validate_fpt_bq_moat.mjs", "--ticker", "FPT"];
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const observation = { refs: ["source"], rationale: "Reviewed customer evidence and distinct economic linkage" };
const rubric = RUBRICS.find(row => row.id === "BQ-MOAT")!;
function assessment(points = 3): MoatAssessment {
  return {
    mechanisms: [{
      id: "integration", advantage: { ...observation, kind: "OBSERVED_MECHANISM" },
      behavior: { ...observation, kind: "CUSTOMER_BEHAVIOR" },
      proxy: { interpretation: "Observed renewal of integrated service work", limitation: "Exact switching cost and retention rate unavailable" },
    }, {
      id: "distribution", advantage: { ...observation, kind: "OBSERVED_MECHANISM" },
      behavior: { ...observation, kind: "SECTOR_EQUIVALENT" }, proxy: null,
    }],
    persistence: {
      ...observation, strength: points < 4 ? "UNCERTAIN" : points === 4 ? "OBSERVED" : "DEMONSTRATED_MULTI_YEAR",
      durableMechanisms: points < 5 ? [] : [{ id: "integration", ...observation }, { id: "distribution", ...observation }],
    },
    counter: { ...observation, materialContradictionResolved: true },
    proposed: { points, band: rubric.bands[points].label, maximumPrerequisitesMet: true, exceptionalJustification: "Two durable mechanisms corroborated across years" },
  };
}
const score = (x: MoatAssessment) => scoreCompetitiveAdvantage(x, ref => ref === "source");

it.each([0, 1, 2, 3, 4, 5, 6])("validates the exact %i point band with proportionate evidence", points => {
  const x = assessment(points);
  if (points === 0) x.mechanisms = x.mechanisms.map(row => ({
    ...row, advantage: { ...row.advantage, kind: "OBSERVED_DISADVANTAGE" },
  }));
  if (points <= 3) x.persistence.refs = [];
  expect(score(x)).toMatchObject({ points, band: rubric.bands[points].label, maxPoints: 6 });
});

it.each(["margin", "growth", "market share", "ROIC"])("rejects %s as the sole economic behavior", signal => {
  const x = assessment();
  x.mechanisms = [{ ...x.mechanisms[0], behavior: { ...observation, rationale: signal, kind: "FINANCIAL_ONLY" } }];
  expect(score(x)).toMatchObject({ points: null, gaps: ["ECONOMIC_BEHAVIOR"] });
});

it("rejects narratives, unsupported proxies, missing core and adverse contradictions", () => {
  const x = assessment(1);
  const first = x.mechanisms[0];
  expect(score({ ...x, mechanisms: [] }).points).toBeNull();
  x.mechanisms = [{ ...first, advantage: { ...observation, kind: "MANAGEMENT_NARRATIVE" } }];
  expect(score(x).gaps).toContain("ADVANTAGE");
  x.mechanisms = [{ ...first, proxy: { interpretation: "Claim exact churn", limitation: "" } }];
  expect(score(x).gaps).toContain("ECONOMIC_BEHAVIOR");
  x.mechanisms = [first];
  x.counter.materialContradictionResolved = false;
  expect(score(x).gaps).toContain("COUNTEREVIDENCE");
});

it("requires qualified durable mechanisms, multiple distinct advantages and maximum prerequisites at the top", () => {
  const x = assessment(5);
  x.persistence.strength = "OBSERVED";
  expect(score(x).gaps).toContain("PERSISTENCE");
  const y = assessment(6);
  y.persistence.durableMechanisms = y.persistence.durableMechanisms.slice(0, 1);
  expect(score(y).gaps).toContain("MAXIMUM_PREREQUISITES");
  const z = assessment(6);
  z.proposed!.maximumPrerequisitesMet = false;
  expect(score(z).gaps).toContain("MAXIMUM_PREREQUISITES");
});

function lifecycle() {
  const packet = read(`${dir}/FPT_BQ_MOAT_INPUT.json`);
  return { ...packet.input, evidence: packet.sourceBindings } as Parameters<typeof scoreIncrementalCompetitiveAdvantage>[0];
}

it("uses a provisional prior during unresolved review, invalidates confirmed loss and rejects expiry", () => {
  const x = lifecycle();
  x.reassessment.assessment.proposed = null;
  x.review.changes = x.review.changes.map(row => row.topic === "activities"
    ? { ...row, status: "MATERIAL_IMPACT_UNRESOLVED" } : row);
  const pending = scoreIncrementalCompetitiveAdvantage(x);
  expect(pending).toMatchObject({ updateStatus: "MATERIAL_REVIEW_PENDING", current: { points: null },
    effectiveScore: { points: 3, validity: "PROVISIONAL" } });
  const eq = read(`${eqDir}/v1.2/FPT_BQ_EQ_V1_2_EFFECTIVE_RESULT.json`).effectiveScore;
  expect(aggregateResearchBusinessQuality(eq, pending.effectiveScore, "qualified-fixture").coverage)
    .toMatchObject({ confirmedCurrent: { weight: 0 }, provisional: { count: 2, weight: 14 } });
  x.review.changes = x.review.changes.map(row => row.topic === "activities"
    ? { ...row, status: "MATERIAL_INVALIDATING" } : row);
  expect(scoreIncrementalCompetitiveAdvantage(x)).toMatchObject({
    updateStatus: "INVALIDATED", latestValidAssessment: { points: 3 }, effectiveScore: { points: null },
  });
  const y = lifecycle();
  y.reassessment.assessment.proposed = null;
  y.evidence = { ...y.evidence, annual: { ...y.evidence.annual, expiresOn: "2026-06-01" } };
  expect(scoreIncrementalCompetitiveAdvantage(y).effectiveScore.points).toBeNull();
});

it("keeps an eligible annual assessment through incomplete interim evidence and blocks hindsight", () => {
  const x = lifecycle();
  x.reassessment.assessment.proposed = null;
  expect(scoreIncrementalCompetitiveAdvantage(x)).toMatchObject({
    updateStatus: "CARRIED_FORWARD", effectiveScore: { points: 3, currentReassessmentPoints: null },
  });
  x.evidence = { ...x.evidence, annual: { ...x.evidence.annual, publicBy: "2026-11-14" } };
  expect(scoreIncrementalCompetitiveAdvantage(x).effectiveScore.points).toBeNull();
});

it("matches the parameterized lifecycle to the accepted BQ-EQ lifecycle on retained input", () => {
  const eq = read(`${eqDir}/2026-11-26/FPT_BQ_EQ_INCREMENTAL_RESULT.json`);
  const prior = read(`${eqDir}/2026-11-25/FPT_BQ_EQ_INPUT.json`);
  const input: IncrementalInput = {
    baseline: eq.originalAssessment,
    reassessment: { ...eq.originalAssessment, id: eq.current.assessmentId, assessedAt: eq.current.review.reviewedAt,
      economicCutoff: eq.current.review.cutoff, financialPeriod: eq.current.review.financialPeriod,
      method: { ...eq.originalAssessment.method, scope: "FTEL_EQUITY_METHOD" }, assessment: prior.stages[1].assessment },
    review: eq.current.review, sector: prior.sector,
    evidence: Object.fromEntries(Object.entries(prior.evidence).map(([key, value]) => [
      key, { ...(value as object), ...(["Q1", "Q2", "H1", "Q3"].includes(key) ? { kind: "INTERIM" } : {}) },
    ])) as IncrementalInput["evidence"],
    updateRefs: ["Q1", "Q2", "H1", "Q3", "Subsequent", "FTEL", "NovemberCost"],
  };
  const generic = scoreIncrementalResearchAssessment(input, scoreEconomicQuality, assessment => ({
    method: JSON.stringify([assessment.returns.measure, assessment.returns.hurdle]),
    core: assessment.returns.required, persistence: assessment.persistence.required, counter: assessment.counter.required,
  }));
  expect(generic).toEqual(scoreIncrementalEconomicQuality(input));
});

it("executes real FPT and both scores reach aggregated Research, Decision and presentation", () => {
  const actual = execFileSync(process.execPath, command, { encoding: "utf8" });
  expect(actual).toBe(readFileSync(`${dir}/FPT_BQ_MOAT_RESULT.json`, "utf8"));
  expect(JSON.parse(actual)).toMatchObject({
    scope: "REAL_ISSUER_RESEARCH", bqMoat: { baseline: { points: 3 }, current: { points: 3, updateStatus: "REAFFIRMED" },
      effectiveScore: { points: 3, validity: "CONFIRMED_CURRENT" } },
    aggregation: { rubric: { points: 5, validity: "PROVISIONAL", updateStatus: "MATERIAL_REVIEW_PENDING" },
      assessedPoints: 8, ratedWeight: 14, theoreticalMaximum: 100, provisionalInvestmentScore: null,
      categories: expect.arrayContaining([{ id: "BQ", max: 25, assessedPoints: 8, ratedWeight: 14, points: null, includesProvisional: true }]),
      coverage: { effective: { count: 2, weight: 14 }, confirmedCurrent: { count: 1, weight: 6 }, provisional: { count: 1, weight: 8 } } },
    researchRanking: [{ rank: null, bqEqPoints: 5, bqMoat: { points: 3 } }],
    investmentDecisionInput: { bqEq: { points: 5 }, bqMoat: { points: 3 }, formalDecisionAuthorized: false },
    publicationAuthorized: false,
  });
  const html = execFileSync(process.execPath, [...command, "--html"], { encoding: "utf8" });
  for (const value of ["BQ-EQ 5/8", "BQ-MOAT 3/6", "REAFFIRMED", "14/25", "2026-09-30", "7/10"]) expect(html).toContain(value);
  expect(spawnSync(process.execPath, [...command, "--publish"]).status).toBe(1);
}, 20000);
