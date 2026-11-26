import { scoreCompetitiveAdvantage, type MoatAssessment } from "./bq-moat-research";
import { retainLatestValidEconomicQuality } from "./bq-eq-retention";
import { resolveEconomicQualityEffectiveScore } from "./research-effective-score";
import { scoreIncrementalResearchAssessment, type ResearchIncrementalInput } from "./research-incremental";

export function scoreIncrementalCompetitiveAdvantage(input: ResearchIncrementalInput<MoatAssessment>) {
  const lifecycle = scoreIncrementalResearchAssessment(input,
    (assessment, _sector, usable) => {
      const score = scoreCompetitiveAdvantage(assessment, usable);
      return { ...score, route: score.points === null ? "E" : "PUBLIC_COMPETITIVE_MECHANISM",
        totalScore: null, productionEligible: false, publicationAuthorized: false };
    }, assessment => ({
      method: "public competitive mechanism and customer behavior",
      core: assessment.mechanisms.flatMap(row => [...row.advantage.refs, ...row.behavior.refs]),
      persistence: assessment.persistence.refs,
      counter: assessment.counter.refs,
    }));
  const retained = retainLatestValidEconomicQuality(lifecycle, input.baseline, input.reassessment);
  const { currentComparableRoic: _roic, ...effectiveScore } = resolveEconomicQualityEffectiveScore(retained);
  void _roic;
  return { baseline: lifecycle.baseline, ...retained,
    effectiveScore: { ...effectiveScore, id: "BQ-MOAT" as const,
      foundationFinancialPeriod: retained.latestValidAssessment?.financialPeriod ?? null } };
}
