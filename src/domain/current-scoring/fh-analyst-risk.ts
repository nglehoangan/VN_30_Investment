import { RUBRICS } from "@/domain/scoring/methodology";
import { dateOnly } from "@/shared/time";
import { scoreDualRouteFinancialHealth, type DualFinancialHealth } from "./fh-dual-route";
import { scoreIncrementalResearchAssessment, type ResearchIncrementalInput } from "./research-incremental";
import { retainLatestValidEconomicQuality } from "./bq-eq-retention";
import { resolveEconomicQualityEffectiveScore } from "./research-effective-score";

export const FH_ANALYST_RISK = "fh-analyst-risk-research-v1.2.0";
export const FH_RISK_METHODOLOGY = "wp2-financial-health-analyst-risk-v1.2.0";
export const restrictions = ["RESEARCH_ONLY", "NO_DIRECT_ADEQUACY_OR_SURVIVAL_CERTIFICATION",
  "NO_FORMAL_GATE_CREDIT", "NO_CROSS_ROUTE_CARDINAL_EQUIVALENCE"] as const;

export const riskBands = {
  "FH-LIQ": [
    ["CRITICAL_LIQUIDITY_DISTRESS", ["criticalDistress"]],
    ["WEAK_LIQUIDITY_RISK_PROFILE", ["weakResources", "weakGenerationOrService", "severeDependence"]],
    ["MATERIAL_REFINANCING_RISK_WITH_FINANCIAL_CAPACITY", ["financialCapacity", "refinancingRisk"]],
    ["SOUND_LIQUIDITY_RISK_PROFILE", ["adequateBuffers", "cashGeneration", "manageableDependence"]],
  ],
  "FH-STRESS": [
    ["CRITICAL_STRESS_FAILURE", ["criticalFailure"]],
    ["SEVERE_FINANCIAL_FRAGILITY", ["veryWeakCapacity", "adverseActionDependence"]],
    ["MATERIAL_STRESS_VULNERABILITY", ["materialPressure", "economicVulnerability"]],
    ["ADEQUATE_STRESS_BUFFER_WITH_MATERIAL_CONSTRAINTS", ["meaningfulBuffer", "manageablePressure", "materialConstraints"]],
    ["STRONG_STRESS_RESILIENCE", ["strongCapacity", "substantialBuffers", "manageablePressure", "sensitivityRobustness"]],
  ],
} as const;

type Note = { rationale: string; refs: readonly string[] };
type Counter = Note & { disposition: "RESOLVED" | "BOUNDED_LIMITATION" | "UNRESOLVED_NON_INVALIDATING" |
  "MATERIAL_CONTRADICTION" | "CONFIRMED_INVALIDATION"; effectOnBand: string };
type AnalystAssessment = {
  proposed: { band: string; points: number } | null;
  conclusion: string;
  economicRationale: string;
  higherBand: string;
  lowerBand: string;
  findings: Record<string, Note & { basis: "QUALIFIED_EVIDENCE" | "UNSUPPORTED_ASSUMPTION" }>;
  counterevidence: readonly Counter[];
  assumptions: readonly string[];
  limitations: readonly string[];
};
export type RiskFinancialHealth = DualFinancialHealth & { analyst: AnalystAssessment };

export function scoreAnalystRisk(a: RiskFinancialHealth, sector: string, usable: (ref: string) => boolean) {
  // Reuse B and its eligibility policy. v1.1's A conclusion and proposal are not inputs to v1.2 validation.
  const legacy = scoreDualRouteFinancialHealth({
    ...a, basic: { ...a.basic, proposed: null },
  }, sector, usable);
  const { B } = legacy.routes;
  const id = a.full.id;
  const cap = RUBRICS.find(row => row.id === id)!.max - 1;
  const review = a.analyst;
  const evaluated = legacy.routes.A.evaluated;
  const gaps: string[] = [];
  const documented = (note?: Note) => !!note?.rationale.trim() && note.refs.length > 0 && note.refs.every(usable);
  const filled = (list: readonly string[]) => list.length > 0 && list.every(value => value.trim());
  const invalidated = review.counterevidence.some(entry => entry.disposition === "CONFIRMED_INVALIDATION");
  if (evaluated) {
    gaps.push(...legacy.routes.A.gaps.filter(gap => gap !== "BASIC_ECONOMIC_CONCLUSION_NOT_ESTABLISHED" &&
      gap !== "BASIC_MATERIAL_RISK_NOT_RESOLVED"));
    if (!review.counterevidence.length || !review.counterevidence.every(entry => documented(entry) &&
        entry.effectOnBand.trim() && ["RESOLVED", "BOUNDED_LIMITATION", "UNRESOLVED_NON_INVALIDATING"].includes(entry.disposition)))
      gaps.push("RISK_COUNTEREVIDENCE_BLOCKS_OR_UNQUALIFIED");
    if (!filled([review.economicRationale, review.higherBand, review.lowerBand]) ||
        !filled(review.assumptions) || !filled(review.limitations))
      gaps.push("RISK_ANALYST_REVIEW_INCOMPLETE");
    const proposal = review.proposed;
    const band = proposal && riskBands[id][proposal.points];
    if (!proposal) gaps.push("RISK_PROFILE_NOT_ESTABLISHED");
    else {
      if (proposal.points > cap) gaps.push("RISK_CEILING_EXCEEDED");
      if (!Number.isInteger(proposal.points) || !band || band[0] !== proposal.band || band[0] !== review.conclusion)
        gaps.push("RISK_BAND_CONCLUSION_MISMATCH");
      if (band && !band[1].every(key => documented(review.findings[key]) &&
          review.findings[key].basis === "QUALIFIED_EVIDENCE"))
        gaps.push("RISK_SELECTED_BAND_EVIDENCE_INSUFFICIENT");
    }
  }
  const aPoints = evaluated && !gaps.length ? review.proposed?.points ?? null : null;
  const assessmentMethod = B.points !== null ? "B_FULL" : aPoints !== null ? "A_ANALYST_RISK" : null;
  const qualification = {
    assessmentMethod,
    assessmentObjective: assessmentMethod === "B_FULL" ? "DIRECT_FINANCIAL_ASSESSMENT" : "PUBLIC_FINANCIAL_RISK_PROFILE",
    bandSemantics: assessmentMethod === "B_FULL" ? "CANONICAL_DIRECT" : "ANALYST_RISK_PROFILE_V1_2",
    methodologyVersion: FH_RISK_METHODOLOGY,
    selectedBand: B.band ?? (aPoints !== null ? review.proposed!.band : null),
    selectedPoints: B.points ?? aPoints,
    maximumEligiblePoints: B.points !== null ? B.maximumEligiblePoints : aPoints !== null ? cap : null,
    actionabilityRestrictions: restrictions,
  };
  return {
    ...legacy, ...qualification, qualification, points: qualification.selectedPoints, band: qualification.selectedBand,
    route: assessmentMethod ?? "E",
    gaps: assessmentMethod ? [] : [...B.gaps, ...gaps],
    routeSelectionReason: assessmentMethod === "A_ANALYST_RISK" ? "FULL_DETAIL_INSUFFICIENT_RISK_PROFILE_QUALIFIED" :
      evaluated ? "NEITHER_ROUTE_SUPPORTS_A_BAND" : legacy.routeSelectionReason,
    routes: { B, A: { evaluated, maximumEligiblePoints: cap, points: aPoints,
      band: aPoints === null ? null : review.proposed!.band, gaps, analyst: review, invalidated } },
  };
}

export function scoreIncrementalAnalystRisk(
  input: ResearchIncrementalInput<RiskFinancialHealth>,
  applicability: { historicalUsableThrough: string | null; nearTermFundingUnrepresentative: boolean; reason: string },
) {
  const cutoff = dateOnly(input.review.cutoff);
  const currentAssessment = input.reassessment.assessment;
  const candidate = scoreAnalystRisk(currentAssessment, input.sector, ref => {
    const item = input.evidence[ref];
    return !!item && item.periodEnd <= item.publicBy && item.publicBy <= cutoff &&
      (!item.expiresOn || cutoff <= item.expiresOn);
  });
  const lifecycle = scoreIncrementalResearchAssessment({
    ...input,
    review: candidate.points === null && !candidate.routes.A.invalidated ? input.review : {
      ...input.review, continuedApplicability: { ...input.review.continuedApplicability, established: false },
    },
  }, scoreAnalystRisk, a => ({
    method: a.full.method,
    core: [...Object.values(a.full.topics), ...Object.values(a.basic.topics),
      ...Object.values(a.analyst.findings)].flatMap(note => note.refs),
    persistence: [], counter: [...a.full.counter.refs, ...a.analyst.counterevidence.flatMap(note => note.refs)],
  }));
  const retained = retainLatestValidEconomicQuality(lifecycle, input.baseline, input.reassessment);
  const expired = !!applicability.historicalUsableThrough && cutoff > dateOnly(applicability.historicalUsableThrough);
  const fundingRisk = applicability.nearTermFundingUnrepresentative || currentAssessment.full.covenant === "BREACH_RISK" ||
    currentAssessment.fullDisposition === "KNOWN_ADVERSE";
  const invalidated = candidate.routes.A.invalidated;
  const blocked = expired || fundingRisk || invalidated;
  const current = blocked && retained.current.updateStatus === "CARRIED_FORWARD"
    ? { ...retained.current, updateStatus: "MATERIAL_REVIEW_PENDING" as const, points: null, band: null,
        validity: "NOT_RATED", quality: "N/R", inheritedFrom: null, underlyingFinancialPeriod: null }
    : retained.current;
  const effectiveInput = { ...retained, current, updateStatus: current.updateStatus };
  const { currentComparableRoic: unused, id: unusedId, ...score } = resolveEconomicQualityEffectiveScore(effectiveInput);
  void unused; void unusedId;
  const inherited = !blocked && current.updateStatus === "CARRIED_FORWARD" && score.points !== null;
  const effective = inherited
    ? { ...score, validity: "PROVISIONAL", basis: "LATEST_VALID_HISTORICAL_ASSESSMENT",
        currentConfirmedPoints: null } as const
    : score.validity === "PROVISIONAL"
      ? { ...score, points: null, validity: "N/R", basis: null, financialPeriod: null } as const
      : score;
  const selected = inherited ? lifecycle.baseline : candidate;
  const freshness = { ...applicability, expired, fundingRisk, invalidated };
  return {
    ...effectiveInput, baseline: lifecycle.baseline, freshness,
    effectiveScore: { ...effective, id: currentAssessment.full.id,
      foundationFinancialPeriod: retained.latestValidAssessment?.financialPeriod ?? null,
      routeQualification: effective.points === null || !selected ? null : {
        ...selected.qualification, assessmentValidity: effective.validity, confidence: inherited ? lifecycle.baseline?.confidence : effective.confidence, freshness,
      },
    },
  };
}
