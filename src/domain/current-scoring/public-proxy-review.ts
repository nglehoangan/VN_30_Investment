import { ACTION_METRICS, requiresActionComparability } from "./action-dependencies";
import type { Assessment, ScoreInput } from "./scorecard";
import { RUBRICS } from "@/domain/scoring/methodology";

export const PUBLIC_PROXY_VERSION = "m3-public-data-proxy-v1.0.0";
export const PUBLIC_PROXY_EXECUTABLE = "m64-public-data-proxy-candidate-1";

const proxyRubrics = {
  PX01: "FH-LIQ", PX02: "GQ-INC", PX03: "IC-POS", PX04: "CA-REINV", PX05: "CA-DIL",
} as const;

type ProxyId = keyof typeof proxyRubrics;
type Route = "DIRECT" | "PROXY" | "MODEL" | "N_R";
type AssessmentMode = "VERIFIED" | "CONSERVATIVE";

/** Review claims must be supported by admitted references. They are not source facts. */
export interface PublicRouteReview {
  readonly rubricId: string;
  readonly route: Route;
  readonly improvementRounds: 0 | 1;
  readonly originalSearchContinued: boolean;
  readonly originalSearchAfterSufficientEvidence: boolean;
  readonly reason: string;
  readonly reopeningTrigger?: string;
}

export function validatePublicRouteReview(review: PublicRouteReview) {
  if (!RUBRICS.some(row => row.id === review.rubricId) ||
      !["DIRECT", "PROXY", "MODEL", "N_R"].includes(review.route) ||
      ![0, 1].includes(review.improvementRounds) ||
      typeof review.originalSearchContinued !== "boolean" ||
      review.originalSearchAfterSufficientEvidence !== false ||
      (review.route === "MODEL" && review.originalSearchContinued) ||
      !review.reason.trim() ||
      (review.route === "N_R" && !review.reopeningTrigger?.trim())) {
    throw Error("INVALID_PUBLIC_ROUTE_REVIEW");
  }
}

export interface ProxyReview {
  readonly proxy: ProxyId;
  readonly mode: AssessmentMode;
  readonly economicScope: "CONSOLIDATED_OUTCOMES" | "PER_SHARE_OR_SCOPE_AFFECTED";
  readonly materialDependency: "RESOLVED" | "UNRESOLVED";
  readonly checks: readonly string[];
  readonly counterReview: string;
  readonly routeReview: PublicRouteReview;
}

const requiredChecks: Record<ProxyId, readonly string[]> = {
  PX01: ["TIMED_OBLIGATIONS", "USABLE_RESOURCES", "COVENANT_DISPOSITION", "NO_RESOURCE_OVERLAP"],
  PX02: ["ALIGNED_OPERANDS", "PERSISTENCE", "SCOPE_BRIDGE", "INDEPENDENT_CORROBORATION", "GRANULARITY_REVIEW"],
  PX03: ["DEFINED_POPULATION", "MATCHED_POSITION", "INDEPENDENT_COST", "DISTRIBUTION"],
  PX04: ["EVENT_COVERAGE", "OPERATING_OUTCOMES", "ALLOCATION_LINK", "ACTION_SCOPE_REVIEW"],
  PX05: ["EVENT_COVERAGE", "SHAREHOLDER_PROTECTION"],
};

function parseReview(value: string): ProxyReview | null {
  try {
    const review = JSON.parse(value);
    if (!review || !Object.hasOwn(proxyRubrics, review.proxy) ||
        !["VERIFIED", "CONSERVATIVE"].includes(review.mode) ||
        !["CONSOLIDATED_OUTCOMES", "PER_SHARE_OR_SCOPE_AFFECTED"].includes(review.economicScope) ||
        review.materialDependency !== "RESOLVED" ||
        typeof review.counterReview !== "string" || !review.counterReview.trim() ||
        !Array.isArray(review.checks) || !review.checks.every((item: unknown) => typeof item === "string")) return null;
    validatePublicRouteReview(review.routeReview);
    if (review.routeReview.route !== "PROXY" || review.routeReview.rubricId !== proxyRubrics[review.proxy as ProxyId]) return null;
    return review;
  } catch {
    return null;
  }
}

export const PUBLIC_PROXY_REVIEW_OBSERVATION = "PUBLIC_PROXY_REVIEW_V1";

export function evaluatePublicProxy(
  assessment: Assessment | undefined,
  input: Pick<ScoreInput, "metrics" | "evidence">,
  usable: (id: string) => boolean,
): { eligible: boolean; requiresAction: boolean } {
  const rubricId = assessment?.subcategory ?? "";
  const legacyAction = requiresActionComparability(rubricId, assessment, input.metrics, input.evidence);
  const unchanged = { eligible: true, requiresAction: legacyAction };
  if (!assessment) return unchanged;

  const refs = new Set(assessment.evidence.flatMap(topic => topic.refs));
  const declarations = input.evidence.filter(row => refs.has(row.id) && row.observation === PUBLIC_PROXY_REVIEW_OBSERVATION);
  if (!declarations.length) return unchanged;
  const invalid = { eligible: false, requiresAction: legacyAction };
  const [declaration] = declarations;
  if (declarations.length !== 1 || !usable(declaration.id) ||
      declaration.classification !== "ESTIMATE" || declaration.unit !== "TEXT") return invalid;
  const review = parseReview(declaration.value);
  if (!review || proxyRubrics[review.proxy] !== rubricId ||
      !requiredChecks[review.proxy].every(item => review.checks.includes(item)) ||
      assessment.evidence.some(topic => !topic.refs.some(ref => ref !== declaration.id && usable(ref)))) return invalid;

  const checks = new Set(review.checks);
  const rubric = RUBRICS.find(row => row.id === rubricId);
  if (review.proxy === "PX01") {
    const dispositions = ["COVENANT_TERMS_EVIDENCED", "COVENANT_ABSENCE_VERIFIED", "COVENANT_INAPPLICABLE", "NONDISCLOSURE_BOUNDED"];
    if (dispositions.filter(item => checks.has(item)).length !== 1) return invalid;
    if (assessment.selectedPoints === rubric?.max && checks.has("NONDISCLOSURE_BOUNDED")) return invalid;
  }
  if (review.proxy === "PX01" && assessment.sector === "BANK" && !checks.has("BANK_FUNDING")) return invalid;
  if (review.proxy === "PX02" && assessment.sector === "BANK" && !checks.has("BANK_CAPITAL_EFFICIENCY")) return invalid;
  if (review.proxy === "PX02" && assessment.sector === "RETAIL" &&
      !checks.has("MATERIAL_COHORTS_COVERED") && !checks.has("COHORTS_IMMATERIAL")) return invalid;

  const band = rubric?.bands.find(row => row.label === assessment.assessment);
  if (!band || (review.mode === "CONSERVATIVE" && assessment.selectedPoints !== band.min)) return invalid;
  if (assessment.selectedPoints === rubric?.max &&
      (!assessment.maximumPrerequisitesMet || !assessment.exceptionalJustification?.trim() ||
       !assessment.disconfirmingEvidence.length || !assessment.disconfirmingEvidence.every(usable))) return invalid;
  if (review.proxy === "PX04" && !checks.has(assessment.sector === "BANK" ? "BANK_CAPITAL_DEPLOYMENT" : "CASH_CAPEX")) return invalid;
  if (review.proxy === "PX03" && assessment.selectedPoints === rubric?.max &&
      !checks.has("REPRESENTATIVE_MARKET_LEADERSHIP")) return invalid;
  if (review.proxy === "PX05") {
    const basis = ["MATERIAL_DESTRUCTION", "DISCIPLINED_NEUTRAL_OR_ACCRETIVE", "VERIFIED_NO_MATERIAL_DILUTION"]
      .filter(item => checks.has(item));
    if (basis.length !== 1 || ((assessment.selectedPoints === 0) !== (basis[0] === "MATERIAL_DESTRUCTION"))) return invalid;
    if (basis[0] === "VERIFIED_NO_MATERIAL_DILUTION") {
      if (!checks.has("NO_EVENT_WINDOW_RECONCILED")) return invalid;
    } else if (!["EVENT_VALUE", "ISSUE_TERMS", "NET_PROCEEDS", "RIGHTS_AND_OFFSETS"].every(item => checks.has(item))) {
      return invalid;
    }
  }

  if (review.proxy !== "PX04" || review.economicScope !== "CONSOLIDATED_OUTCOMES") return unchanged;
  // The legacy predicate for a non-exempt, non-mandatory rubric checks referenced action metrics and share operands.
  const requiresAction = requiresActionComparability("PX04_CONSOLIDATED_OUTCOMES", assessment, input.metrics, input.evidence);
  const normalizationDependency = input.metrics.some(metric =>
    ACTION_METRICS.includes(metric.metric) &&
    metric.normalization.evidenceRefs.some(ref => refs.has(ref) || assessment.disconfirmingEvidence.includes(ref)));
  return { eligible: true, requiresAction: requiresAction || normalizationDependency };
}
