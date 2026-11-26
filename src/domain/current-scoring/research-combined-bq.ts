import { RUBRICS } from "@/domain/scoring/methodology";
import {
  aggregateResearchEffectiveScores, buildResearchDecisionScoreInput, rankResearchEffectiveScores,
  type EconomicQualityEffectiveScore,
} from "./research-effective-score";
import type { scoreIncrementalCompetitiveAdvantage } from "./bq-moat-incremental";

type MoatScore = ReturnType<typeof scoreIncrementalCompetitiveAdvantage>["effectiveScore"];

export function aggregateResearchBusinessQuality(eq: EconomicQualityEffectiveScore, moat: MoatScore, evidenceReference: string) {
  if (eq.reviewCutoff !== moat.reviewCutoff) throw Error("MIXED_RESEARCH_CUTOFF");
  const scored = aggregateResearchEffectiveScores(eq, moat.points === null ? [] :
    [{ id: moat.id, points: moat.points, evidenceReference }]);
  if (moat.validity !== "PROVISIONAL") return { ...scored, moat };

  // The existing aggregator owns all points and maxima. Reclassify the moat's coverage and full total.
  const moatWeight = RUBRICS.find(row => row.id === "BQ-MOAT")!.max;
  return {
    ...scored, moat,
    categories: scored.categories.map(row => row.id === "BQ" ? { ...row, includesProvisional: true } : row),
    coverage: {
      ...scored.coverage,
      confirmedCurrent: { count: scored.coverage.confirmedCurrent.count - 1, weight: scored.coverage.confirmedCurrent.weight - moatWeight },
      provisional: { count: scored.coverage.provisional.count + 1, weight: scored.coverage.provisional.weight + moatWeight },
    },
    confirmedCurrentInvestmentScore: null,
    provisionalInvestmentScore: scored.provisionalInvestmentScore ?? scored.confirmedCurrentInvestmentScore,
  };
}

type Combined = ReturnType<typeof aggregateResearchBusinessQuality>;

export function rankResearchBusinessQuality(inputs: readonly { ticker: string; aggregation: Combined }[]) {
  const byTicker = new Map(inputs.map(row => [row.ticker, row.aggregation.moat]));
  return rankResearchEffectiveScores(inputs).map(row => ({ ...row, bqMoat: byTicker.get(row.ticker)! }));
}

export function buildResearchBusinessQualityDecisionInput(
  score: Combined, gates: Parameters<typeof buildResearchDecisionScoreInput>[1],
) {
  return { ...buildResearchDecisionScoreInput(score, gates), bqMoat: score.moat };
}
