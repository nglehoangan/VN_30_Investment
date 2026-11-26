import { scoreBusinessResilience, scoreCashRealization, type CashAssessment, type ResilienceAssessment } from "./bq-cash-res-research";
import { retainLatestValidEconomicQuality } from "./bq-eq-retention";
import { resolveEconomicQualityEffectiveScore } from "./research-effective-score";
import { scoreIncrementalResearchAssessment, type ResearchIncrementalInput } from "./research-incremental";

function resolve<T>(
  input: ResearchIncrementalInput<T>,
  score: Parameters<typeof scoreIncrementalResearchAssessment<T, ReturnType<typeof scoreCashRealization>>>[1],
  refs: Parameters<typeof scoreIncrementalResearchAssessment<T, ReturnType<typeof scoreCashRealization>>>[2],
) {
  const lifecycle = scoreIncrementalResearchAssessment(input, score, refs);
  const retained = retainLatestValidEconomicQuality(lifecycle, input.baseline, input.reassessment);
  const { currentComparableRoic: unused, id: unusedId, ...effective } = resolveEconomicQualityEffectiveScore(retained);
  void unused; void unusedId;
  return { baseline: lifecycle.baseline, ...retained, effectiveScore: {
    ...effective, foundationFinancialPeriod: retained.latestValidAssessment?.financialPeriod ?? null,
  } };
}

export function scoreIncrementalCashRealization(input: ResearchIncrementalInput<CashAssessment>) {
  const result = resolve(input, scoreCashRealization, assessment => ({
    method: assessment.realization.route,
    core: [...assessment.realization.refs, ...assessment.recognition.refs],
    persistence: assessment.workingCapital.refs,
    counter: assessment.counter.refs,
  }));
  return { ...result, effectiveScore: { ...result.effectiveScore, id: "BQ-CASH" as const } };
}

export function scoreIncrementalBusinessResilience(input: ResearchIncrementalInput<ResilienceAssessment>) {
  const result = resolve(input, scoreBusinessResilience, assessment => ({
    method: "operating resilience",
    core: [...assessment.concentration.refs, ...assessment.cyclicality.refs],
    persistence: assessment.stress.refs,
    counter: assessment.counter.refs,
  }));
  return { ...result, effectiveScore: { ...result.effectiveScore, id: "BQ-RES" as const } };
}
