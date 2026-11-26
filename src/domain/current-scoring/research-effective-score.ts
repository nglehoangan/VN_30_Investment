import { CATEGORY_MAXIMA, RUBRICS } from "@/domain/scoring/methodology";
import type { retainLatestValidEconomicQuality } from "./bq-eq-retention";

export const BQ_EQ_EFFECTIVE = "bq-eq-effective-research-v1.2-d19-d23";
type Retention = ReturnType<typeof retainLatestValidEconomicQuality>;
type RubricId = typeof RUBRICS[number]["id"];

export function resolveEconomicQualityEffectiveScore(result: Retention, currentComparableRoic: number | null = null) {
  const { current, latestValidAssessment: prior, updateStatus } = result;
  const currentAccepted = current.validity === "VALID_RESEARCH" && current.points !== null;
  const provisional = !currentAccepted && prior !== null &&
    (updateStatus === "UPDATE_PENDING" || updateStatus === "MATERIAL_REVIEW_PENDING") &&
    !current.inheritanceGaps.some(gap => gap === "VALID_BASELINE_REQUIRED" ||
      gap === "NEW_ANNUAL_REASSESSMENT_REQUIRED");
  const points = currentAccepted ? current.points : provisional ? prior.points : null;
  return {
    id: "BQ-EQ" as const,
    points,
    validity: currentAccepted ? "CONFIRMED_CURRENT" as const
      : provisional ? "PROVISIONAL" as const : "N/R" as const,
    basis: currentAccepted ? current.updateStatus : provisional ? "LATEST_VALID_HISTORICAL_ASSESSMENT" : null,
    financialPeriod: currentAccepted ? current.underlyingFinancialPeriod : provisional ? prior.financialPeriod : null,
    latestValidPoints: prior?.points ?? null,
    currentReassessmentPoints: current.updateStatus === "CARRIED_FORWARD" ? null : current.points,
    currentConfirmedPoints: currentAccepted ? current.points : null,
    currentComparableRoic,
    reviewedFinancialPeriod: current.review.financialPeriod,
    reviewCutoff: current.review.cutoff,
    updateStatus,
    confidence: current.confidence,
    materialDependencies: current.review.changes.filter(change =>
      change.status === "MATERIAL_IMPACT_UNRESOLVED" || change.status === "MATERIAL_INVALIDATING"),
    reassessmentTriggers: current.review.reassessmentTriggers,
    limitations: current.review.limitations,
    certificationGaps: current.inheritanceGaps,
  };
}

export type EconomicQualityEffectiveScore = ReturnType<typeof resolveEconomicQualityEffectiveScore>;
type ConfirmedRubric = { id: Exclude<RubricId, "BQ-EQ">; points: number; evidenceReference: string };

/** Aggregate qualified research inputs on the existing weights, outside the formal scorecard contract. */
export function aggregateResearchEffectiveScores(
  bqEq: EconomicQualityEffectiveScore,
  otherConfirmed: readonly ConfirmedRubric[] = [],
) {
  const supplied = new Map<RubricId, number>();
  for (const row of otherConfirmed) {
    const rubric = RUBRICS.find(item => item.id === row.id);
    if (!rubric || rubric.id === "BQ-EQ" || supplied.has(row.id) || !row.evidenceReference.trim() ||
        !Number.isInteger(row.points) || row.points < 0 || row.points > rubric.max) throw Error("INVALID_RESEARCH_RUBRIC");
    supplied.set(row.id, row.points);
  }
  if (bqEq.points !== null) supplied.set("BQ-EQ", bqEq.points);
  const rubrics = RUBRICS.map(rubric => ({
    id: rubric.id, category: rubric.category, max: rubric.max,
    points: supplied.get(rubric.id) ?? null,
    provisional: rubric.id === "BQ-EQ" && bqEq.validity === "PROVISIONAL",
    confirmed: rubric.id === "BQ-EQ" ? bqEq.validity === "CONFIRMED_CURRENT" : supplied.has(rubric.id),
  }));
  const summarize = (rows: typeof rubrics) => ({
    count: rows.length, weight: rows.reduce((sum, row) => sum + row.max, 0),
  });
  const effective = rubrics.filter(row => row.points !== null);
  const provisional = rubrics.filter(row => row.provisional);
  const unrated = rubrics.filter(row => row.points === null);
  const assessedPoints = effective.reduce((sum, row) => sum + row.points!, 0);
  const categories = Object.entries(CATEGORY_MAXIMA).map(([id, max]) => {
    const rows = rubrics.filter(row => row.category === id);
    const rated = rows.filter(row => row.points !== null);
    const assessedPoints = rated.reduce((sum, row) => sum + row.points!, 0);
    return { id, max, assessedPoints, ratedWeight: summarize(rated).weight,
      points: rated.length === rows.length ? assessedPoints : null,
      includesProvisional: rated.some(row => row.provisional) };
  });
  const fullScore = unrated.length ? null : assessedPoints;
  return {
    rubric: bqEq, categories, assessedPoints, ratedWeight: summarize(effective).weight,
    theoreticalMaximum: summarize(rubrics).weight,
    confirmedCurrentInvestmentScore: provisional.length ? null : fullScore,
    provisionalInvestmentScore: provisional.length ? fullScore : null,
    coverage: {
      confirmedCurrent: summarize(rubrics.filter(row => row.confirmed)),
      effective: summarize(effective), provisional: summarize(provisional), genuineNR: summarize(unrated),
    },
    ratedRubrics: effective.map(row => row.id),
    formalScore: null, formalRankingEligible: false, investmentActionable: false,
  };
}

type Aggregate = ReturnType<typeof aggregateResearchEffectiveScores>;
type ComparisonInput = { ticker: string; aggregation: Aggregate };

/** Compare only the same rubric set at the same cutoff; a one-name cohort has no ordinal. */
export function rankResearchEffectiveScores(inputs: readonly ComparisonInput[]) {
  if (new Set(inputs.map(input => input.ticker)).size !== inputs.length) throw Error("DUPLICATE_RESEARCH_ISSUER");
  const cohorts = new Map<string, ComparisonInput[]>();
  for (const item of inputs) {
    const { aggregation } = item;
    const key = JSON.stringify([aggregation.rubric.reviewCutoff, aggregation.ratedRubrics]);
    const group = cohorts.get(key) ?? [];
    group.push(item);
    cohorts.set(key, group);
  }
  return Array.from(cohorts.values()).flatMap(group => {
    group.sort((a, b) => b.aggregation.assessedPoints - a.aggregation.assessedPoints ||
      a.ticker.localeCompare(b.ticker));
    return group.map(({ ticker, aggregation }) => ({
      ticker, scope: "RESEARCH_ONLY" as const, cutoff: aggregation.rubric.reviewCutoff,
      comparableRubrics: aggregation.ratedRubrics,
      rank: group.length > 1 && aggregation.ratedRubrics.length
        ? group.findIndex(item => item.aggregation.assessedPoints === aggregation.assessedPoints) + 1 : null,
      comparedIssuerCount: group.length, assessedPoints: aggregation.assessedPoints, ratedWeight: aggregation.ratedWeight,
      provisionalInvestmentScore: aggregation.provisionalInvestmentScore, bqEqPoints: aggregation.rubric.points,
      includesProvisional: aggregation.coverage.provisional.count > 0,
      confidence: aggregation.rubric.confidence, materialDependencies: aggregation.rubric.materialDependencies,
      formalRankingEligible: false,
    }));
  });
}

export function buildResearchDecisionScoreInput(
  score: Aggregate,
  gates: { stage0: string; hardVeto: string; residualRisk: string },
) {
  return {
    scope: "RESEARCH_DECISION_SUPPORT" as const,
    effectiveBusinessQuality: score.categories.find(category => category.id === "BQ")!,
    bqEq: score.rubric,
    assessedPoints: score.assessedPoints, ratedWeight: score.ratedWeight,
    provisionalInvestmentScore: score.provisionalInvestmentScore,
    confirmedCurrentInvestmentScore: score.confirmedCurrentInvestmentScore,
    coverage: score.coverage,
    gates: { ...gates, financialHealth: "NOT_ASSESSED", valuation: "NOT_ASSESSED", portfolio: "NOT_ASSESSED" },
    investmentActionable: false, formalDecisionAuthorized: false,
  };
}
