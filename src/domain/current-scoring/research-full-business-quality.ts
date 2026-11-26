import { RUBRICS } from "@/domain/scoring/methodology";
import { aggregateResearchEffectiveScores, buildResearchDecisionScoreInput, rankResearchEffectiveScores,
  type EconomicQualityEffectiveScore } from "./research-effective-score";
import type { scoreIncrementalCompetitiveAdvantage } from "./bq-moat-incremental";
import type { scoreIncrementalCashRealization, scoreIncrementalBusinessResilience } from "./bq-cash-res-incremental";

type AdditionalScores = readonly [
  ReturnType<typeof scoreIncrementalCompetitiveAdvantage>["effectiveScore"],
  ReturnType<typeof scoreIncrementalCashRealization>["effectiveScore"],
  ReturnType<typeof scoreIncrementalBusinessResilience>["effectiveScore"],
];

export function aggregateFullResearchBusinessQuality(
  eq: EconomicQualityEffectiveScore, additional: AdditionalScores, evidenceReference: string,
) {
  if (additional.some(row => row.reviewCutoff !== eq.reviewCutoff)) throw Error("MIXED_RESEARCH_CUTOFF");
  const scored = aggregateResearchEffectiveScores(eq, additional.flatMap(row =>
    row.points === null ? [] : [{ id: row.id, points: row.points, evidenceReference }]));
  const provisional = additional.filter(row => row.points !== null && row.validity === "PROVISIONAL");
  const weight = provisional.reduce((sum, row) => sum + RUBRICS.find(rubric => rubric.id === row.id)!.max, 0);
  const initial = scored.coverage;
  const category = scored.categories.find(row => row.id === "BQ")!;
  return {
    ...scored,
    categories: scored.categories.map(row => row.id === "BQ" && provisional.length ? { ...row, includesProvisional: true } : row),
    effectiveScores: [eq, ...additional],
    businessQuality: { ...category, includesProvisional: category.includesProvisional || provisional.length > 0,
      effectiveRubricCount: scored.ratedRubrics.filter(id => id.startsWith("BQ-")).length, rubricCount: 4,
      validity: category.points === null ? "INCOMPLETE" : category.includesProvisional || provisional.length ? "PROVISIONAL" : "CONFIRMED_CURRENT" },
    coverage: {
      ...initial,
      confirmedCurrent: { count: initial.confirmedCurrent.count - provisional.length, weight: initial.confirmedCurrent.weight - weight },
      provisional: { count: initial.provisional.count + provisional.length, weight: initial.provisional.weight + weight },
    },
    confirmedCurrentInvestmentScore: provisional.length ? null : scored.confirmedCurrentInvestmentScore,
    provisionalInvestmentScore: scored.provisionalInvestmentScore ??
      (provisional.length ? scored.confirmedCurrentInvestmentScore : null),
  };
}

type Aggregate = ReturnType<typeof aggregateFullResearchBusinessQuality>;

export function rankFullResearchBusinessQuality(inputs: readonly { ticker: string; aggregation: Aggregate }[]) {
  const byTicker = new Map(inputs.map(row => [row.ticker, row.aggregation]));
  return rankResearchEffectiveScores(inputs).map(row => ({
    ...row, effectiveScores: byTicker.get(row.ticker)!.effectiveScores,
  }));
}

export function buildFullResearchBusinessQualityDecisionInput(
  score: Aggregate, gates: Parameters<typeof buildResearchDecisionScoreInput>[1],
) {
  return { ...buildResearchDecisionScoreInput(score, gates),
    effectiveBusinessQuality: score.businessQuality, effectiveScores: score.effectiveScores };
}
