import type { IncrementalInput, scoreIncrementalEconomicQuality } from "./bq-eq-incremental";

export const BQ_EQ_RETENTION = "bq-eq-latest-valid-research-v1.2.0";

type ScoredReview = ReturnType<typeof scoreIncrementalEconomicQuality>;
type Assessment = IncrementalInput["reassessment"];
type AssessmentIdentity = Pick<Assessment,
  "id" | "financialPeriod" | "economicCutoff" | "assessedAt" | "methodology" | "implementation" | "method">;

function retained(identity: AssessmentIdentity, points: number, band: string,
  quality: string, confidence: ScoredReview["current"]["confidence"]) {
  const { id, financialPeriod, economicCutoff, assessedAt, methodology, implementation, method } = identity;
  return { id, financialPeriod, economicCutoff, assessedAt, methodology, implementation, method,
    points, band, quality, confidence };
}

/** Project the outcome of a qualified BQ-EQ lifecycle replay into v1.2. */
export function retainLatestValidEconomicQuality(
  { baseline, current }: ScoredReview,
  original: AssessmentIdentity | null,
  replacement: AssessmentIdentity | null,
) {
  const historic = original && baseline && baseline.assessmentId === original.id &&
    baseline.points !== null && baseline.band !== null &&
    original.economicCutoff <= current.review.cutoff && original.assessedAt <= current.review.reviewedAt
    ? retained(original, baseline.points, baseline.band, baseline.quality, baseline.confidence)
    : null;
  const accepted = current.points !== null && current.band !== null && current.validity === "VALID_RESEARCH";
  const latestValidAssessment = accepted && replacement && current.updateStatus === "UPDATED"
    ? retained(replacement, current.points!, current.band!, current.quality, current.confidence)
    : historic;

  const reviewQualified = !current.reassessmentGaps.some(gap =>
    gap === "FRESH_REVIEW_REQUIRED" || gap === "MATERIALITY_REVIEW_REQUIRED");
  const confirmedInvalidation = reviewQualified &&
    current.review.changes.some(change => change.status === "MATERIAL_INVALIDATING");
  const unresolvedMateriality = reviewQualified &&
    current.review.changes.some(change => change.status === "MATERIAL_IMPACT_UNRESOLVED");
  const updateStatus = accepted ? current.updateStatus
    : !historic ? "NOT_RATED"
    : confirmedInvalidation ? "INVALIDATED"
    : unresolvedMateriality ? "MATERIAL_REVIEW_PENDING"
    : "UPDATE_PENDING";

  return {
    latestValidAssessment,
    updateStatus,
    current: { ...current, updateStatus },
    currentRankingEligible: false,
    investmentActionable: false,
  };
}
