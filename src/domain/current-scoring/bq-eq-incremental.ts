import { dateOnly } from "@/shared/time";
import { scoreEconomicQuality, type EconomicQualityAssessment } from "./bq-eq-research";

export const BQ_EQ_INCREMENTAL = "bq-eq-incremental-research-v1.1.0";
export const MATERIALITY_TOPICS = [
  "activities", "profitability", "returns", "capitalStructure", "leverage", "segmentMix",
  "consolidation", "acquisitionsDivestments", "accounting", "costOfCapital", "adverseEvents",
] as const;

type Materiality = "NO_MATERIAL_IMPACT" | "MATERIAL_BUT_BOUNDED" |
  "MATERIAL_INVALIDATING" | "MATERIAL_IMPACT_UNRESOLVED";
type Dimension = 0 | 1 | 2;
type Confidence = {
  dimensions: readonly [Dimension, Dimension, Dimension, Dimension, Dimension];
  rationale: string;
};
type Method = { normalization: string; capitalCostFramework: string; scope: string };
type Assessment = {
  id: string;
  financialPeriod: string;
  economicCutoff: string;
  assessedAt: string;
  methodology: string;
  implementation: string;
  method: Method;
  quality: "VERIFIED" | "CONSERVATIVE";
  confidence: Confidence;
  assessment: EconomicQualityAssessment;
};
type Evidence = {
  publicBy: string;
  periodEnd: string;
  kind?: "ANNUAL" | "INTERIM";
  expiresOn?: string;
};
type Review = {
  cutoff: string;
  reviewedAt: string;
  financialPeriod: string;
  reviewedRefs: readonly string[];
  changes: readonly {
    topic: typeof MATERIALITY_TOPICS[number];
    status: Materiality;
    refs: readonly string[];
    impact: string;
  }[];
  continuedApplicability: {
    refs: readonly string[];
    rationale: string;
    established: boolean;
  };
  inheritanceRationale: string;
  unresolvedMetrics: readonly string[];
  limitations: readonly string[];
  reassessmentTriggers: readonly string[];
  confidence: Confidence;
  transition: { rationale: string; implications: string; refs: readonly string[] } | null;
};

export type IncrementalInput = {
  sector: string;
  baseline: Assessment | null;
  reassessment: Assessment;
  review: Review;
  evidence: Readonly<Record<string, Evidence>>;
  updateRefs: readonly string[];
};

function confidenceSummary(confidence: Confidence) {
  if (confidence.dimensions.length !== 5 || !confidence.dimensions.every(value => [0, 1, 2].includes(value)) ||
      !confidence.rationale.trim()) throw Error("BQ_EQ_INVALID_CONFIDENCE");
  return { ...confidence, total: confidence.dimensions.reduce<number>((sum, value) => sum + value, 0) };
}

function score(assessment: Assessment, sector: string, usable: (ref: string) => boolean) {
  return scoreEconomicQuality(assessment.assessment, sector, usable);
}

function assessmentWindow(assessment: Assessment | null) {
  if (!assessment) return false;
  [assessment.financialPeriod, assessment.economicCutoff, assessment.assessedAt].forEach(dateOnly);
  return assessment.financialPeriod <= assessment.economicCutoff &&
    assessment.economicCutoff <= assessment.assessedAt &&
    [assessment.id, assessment.methodology, assessment.implementation, ...Object.values(assessment.method)]
      .every(value => value.trim());
}

export function scoreIncrementalEconomicQuality(input: IncrementalInput) {
  const { baseline, reassessment, review, sector, evidence, updateRefs } = input;
  [review.cutoff, review.reviewedAt, review.financialPeriod].forEach(dateOnly);
  const usable = (ref: string, asOf: string) => {
    const item = evidence[ref];
    if (!item) return false;
    [item.periodEnd, item.publicBy].forEach(dateOnly);
    if (item.expiresOn) dateOnly(item.expiresOn);
    return item.periodEnd <= item.publicBy && item.publicBy <= asOf &&
      (!item.expiresOn || asOf <= item.expiresOn);
  };
  const prior = assessmentWindow(baseline) && baseline
    ? score(baseline, sector, ref => usable(ref, baseline.economicCutoff)) : null;
  const baselineResult = baseline && prior ? {
    ...prior, assessmentId: baseline.id, updateStatus: "BASELINE" as const,
    quality: prior.points === null ? "N/R" : baseline.quality,
    confidence: confidenceSummary(baseline.confidence),
  } : null;

  const gaps: string[] = [];
  const reviewed = new Set(review.reviewedRefs);
  const useReviewed = (ref: string) => reviewed.has(ref) && usable(ref, review.cutoff);
  const documented = (refs: readonly string[]) => refs.length > 0 && refs.every(useReviewed);
  const eligibleUpdates = updateRefs.filter(ref => evidence[ref]?.publicBy <= review.cutoff);
  const latestFinancial = eligibleUpdates.filter(ref => evidence[ref].kind)
    .reduce((latest, ref) => evidence[ref].periodEnd > latest ? evidence[ref].periodEnd : latest,
      baseline?.financialPeriod ?? "");
  if (review.cutoff > review.reviewedAt || review.financialPeriod !== latestFinancial ||
      !updateRefs.every(ref => Object.hasOwn(evidence, ref)) ||
      !eligibleUpdates.every(useReviewed) || !review.reviewedRefs.every(useReviewed) ||
      !review.limitations.length || !review.reassessmentTriggers.length ||
      ![...review.limitations, ...review.reassessmentTriggers].every(value => value.trim()))
    gaps.push("FRESH_REVIEW_REQUIRED");
  if (review.changes.length !== MATERIALITY_TOPICS.length ||
      !MATERIALITY_TOPICS.every(topic => review.changes.filter(change => change.topic === topic).length === 1) ||
      !review.changes.every(change => change.impact.trim() && documented(change.refs) &&
        ["NO_MATERIAL_IMPACT", "MATERIAL_BUT_BOUNDED", "MATERIAL_INVALIDATING", "MATERIAL_IMPACT_UNRESOLVED"].includes(change.status)))
    gaps.push("MATERIALITY_REVIEW_REQUIRED");

  const current = score(reassessment, sector, ref => usable(ref, review.cutoff));
  const hasPrior = !!baselineResult && baselineResult.points !== null && !!baseline &&
    baseline.economicCutoff < review.cutoff && baseline.assessedAt <= review.reviewedAt;
  const sameMethod = !!baseline && baseline.method.scope === reassessment.method.scope &&
    baseline.method.normalization === reassessment.method.normalization &&
    baseline.method.capitalCostFramework === reassessment.method.capitalCostFramework &&
    baseline.assessment.returns.measure === reassessment.assessment.returns.measure &&
    baseline.assessment.returns.hurdle === reassessment.assessment.returns.hurdle &&
    prior?.route === current.route;
  const transition = review.transition;
  const qualifiedTransition = !!transition && !!transition.rationale.trim() && !!transition.implications.trim() &&
    documented(transition.refs);
  const blockingChanges = review.changes.filter(change => change.status === "MATERIAL_IMPACT_UNRESOLVED" ||
    change.status === "MATERIAL_INVALIDATING");
  const counterReviewed = blockingChanges.every(change =>
    change.refs.some(ref => reassessment.assessment.counter.required.includes(ref)));
  const newestAnnual = eligibleUpdates.filter(ref => evidence[ref].kind === "ANNUAL" &&
    (!baseline || evidence[ref].periodEnd > baseline.financialPeriod));
  const newReturns = reassessment.assessment.returns.required.some(ref => eligibleUpdates.includes(ref));
  const annualConsumed = newestAnnual.every(ref => reassessment.assessment.returns.required.includes(ref) ||
    reassessment.assessment.persistence.required.includes(ref));
  const replacement = newReturns && annualConsumed && counterReviewed && !gaps.length &&
    current.points !== null && assessmentWindow(reassessment) &&
    reassessment.economicCutoff === review.cutoff && reassessment.assessedAt === review.reviewedAt &&
    reassessment.financialPeriod === review.financialPeriod && (!hasPrior || sameMethod || qualifiedTransition);
  const inheritanceGaps = [...gaps];
  if (!hasPrior || !baseline || score(baseline, sector, ref => usable(ref, review.cutoff)).points === null)
    inheritanceGaps.push("VALID_BASELINE_REQUIRED");
  if (newestAnnual.length) inheritanceGaps.push("NEW_ANNUAL_REASSESSMENT_REQUIRED");
  if (blockingChanges.length) inheritanceGaps.push("MATERIAL_IMPACT_BLOCKS_INHERITANCE");
  if (baseline && baseline.method.scope !== reassessment.method.scope && !qualifiedTransition)
    inheritanceGaps.push("SCOPE_TRANSITION_REVIEW_REQUIRED");
  if (!review.continuedApplicability.established || !review.continuedApplicability.rationale.trim() ||
      !documented(review.continuedApplicability.refs) ||
      !review.continuedApplicability.refs.some(ref => eligibleUpdates.includes(ref)) || !review.inheritanceRationale.trim())
    inheritanceGaps.push("AFFIRMATIVE_SUPPORT_REQUIRED");

  const inherited = !(replacement && sameMethod) && inheritanceGaps.length === 0;
  const updated = !inherited && replacement;
  const outcome = inherited ? prior! : current;
  const points = inherited || updated ? outcome.points : null;
  const updateStatus = inherited ? "CARRIED_FORWARD" : updated
    ? hasPrior && sameMethod && current.band === prior?.band && current.points === prior?.points ? "REAFFIRMED" : "UPDATED"
    : "INVALIDATED";
  return {
    baseline: baselineResult,
    current: {
      ...outcome, points, band: points === null ? null : outcome.band, route: points === null ? "E" : outcome.route,
      updateStatus, validity: points === null ? "NOT_RATED" : "VALID_RESEARCH",
      quality: inherited ? baseline!.quality : updated ? reassessment.quality : "N/R",
      inheritedFrom: inherited ? baseline!.id : null,
      underlyingFinancialPeriod: inherited ? baseline!.financialPeriod : updated ? reassessment.financialPeriod : null,
      confidence: confidenceSummary(review.confidence),
      review, inheritanceGaps, reassessmentGaps: [...gaps, ...current.gaps,
        ...(!replacement && current.points !== null ? ["REASSESSMENT_WINDOW_OR_METHOD_UNQUALIFIED"] : [])],
    },
  };
}
