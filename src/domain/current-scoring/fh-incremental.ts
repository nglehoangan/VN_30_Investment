import { scoreFinancialHealth, type FinancialHealthAssessment } from "./fh-research";
import { scoreIncrementalResearchAssessment, type ResearchIncrementalInput } from "./research-incremental";
import { retainLatestValidEconomicQuality } from "./bq-eq-retention";
import { resolveEconomicQualityEffectiveScore } from "./research-effective-score";
import { dateOnly } from "@/shared/time";

export function scoreIncrementalFinancialHealth(input: ResearchIncrementalInput<FinancialHealthAssessment>,
  applicability: { historicalUsableThrough: string | null; nearTermFundingUnrepresentative: boolean; reason: string }) {
  const lifecycle = scoreIncrementalResearchAssessment(input, scoreFinancialHealth, a => ({
    method: a.method, core: Object.values(a.topics).flatMap(topic => topic.refs),
    persistence: [], counter: a.counter.refs,
  }));
  const retained = retainLatestValidEconomicQuality(lifecycle, input.baseline, input.reassessment);
  if (applicability.historicalUsableThrough) dateOnly(applicability.historicalUsableThrough);
  const expired = applicability.historicalUsableThrough !== null &&
    input.review.cutoff > applicability.historicalUsableThrough;
  const fundingRisk = applicability.nearTermFundingUnrepresentative ||
    input.reassessment.assessment.covenant === "BREACH_RISK";
  const blocked = expired || fundingRisk;
  const eligible = blocked && retained.current.updateStatus === "CARRIED_FORWARD"
    ? { ...retained, updateStatus: "MATERIAL_REVIEW_PENDING" as const,
        current: { ...retained.current, updateStatus: "MATERIAL_REVIEW_PENDING" as const, points: null, band: null, validity: "NOT_RATED",
          quality: "N/R", inheritedFrom: null, underlyingFinancialPeriod: null } }
    : retained;
  const { currentComparableRoic: unused, id: unusedId, ...score } = resolveEconomicQualityEffectiveScore(eligible);
  void unused; void unusedId;
  return {
    ...eligible, baseline: lifecycle.baseline, freshness: { ...applicability, expired, fundingRisk },
    effectiveScore: { ...score, id: input.reassessment.assessment.id,
      ...(blocked && score.validity === "PROVISIONAL"
        ? { points: null, validity: "N/R", basis: null, financialPeriod: null } as const : {}),
      foundationFinancialPeriod: retained.latestValidAssessment?.financialPeriod ?? null,
    },
  };
}
