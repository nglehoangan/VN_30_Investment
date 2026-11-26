import { RUBRICS } from "@/domain/scoring/methodology";
import { dateOnly } from "@/shared/time";
import { scoreFinancialHealth, type FinancialHealthAssessment } from "./fh-research";
import { scoreIncrementalResearchAssessment, type ResearchIncrementalInput } from "./research-incremental";
import { retainLatestValidEconomicQuality } from "./bq-eq-retention";
import { resolveEconomicQualityEffectiveScore } from "./research-effective-score";

export const FH_DUAL_ROUTE = "fh-dual-route-ab-research-v1.1.0";
type Observation = { refs: readonly string[]; rationale: string };
type FhId = "FH-LIQ" | "FH-STRESS";
type Basic = {
  topics: Record<string, Observation>;
  cashBasis: "UNRESTRICTED" | "BOOK_PROXY_REVIEWED" | "UNQUALIFIED";
  restrictedCashExcluded: boolean;
  unsupportedFundingExcluded: boolean;
  obligationsPreserved: boolean;
  materialAdverseEvidenceUnresolved: boolean;
  conclusion: "UNRESOLVED" | "UNCOVERED" | "SEVERE_DEPENDENCE" | "ADEQUATE_DEPENDENT" | "SOUND" |
    "FAILURE" | "DISTRESSED_FINANCING" | "SEVERE_VULNERABILITY" | "SURVIVAL";
  demonstratedIndependentOfUnsupportedAssumptions: boolean;
  counter: Observation & { resolved: boolean };
  proposed: { band: string; points: number } | null;
};
export type DualFinancialHealth = {
  full: FinancialHealthAssessment & { id: FhId };
  fullDisposition: "INSUFFICIENT_DETAIL" | "AVAILABLE" | "KNOWN_ADVERSE";
  basic: Basic;
};

const requirements = {
  "FH-LIQ": ["resources", "obligations", "refinancing", "restrictionReview", "covenantReview"],
  "FH-STRESS": ["severeScenario", "earningsAndInterest", "cashAndCapex", "bufferAndMaturity", "fundingAndCapital"],
} as const;
const conclusions = {
  "FH-LIQ": ["UNCOVERED", "SEVERE_DEPENDENCE", "ADEQUATE_DEPENDENT", "SOUND"],
  "FH-STRESS": ["FAILURE", "DISTRESSED_FINANCING", "SEVERE_VULNERABILITY", "SURVIVAL", "SURVIVAL"],
} as const;
const fallbackGaps = {
  "FH-LIQ": ["OBLIGATIONS", "LIQUIDITY", "MATURITIES", "MATCHED_TIMING_UNRESOLVED", "COVENANT_DISPOSITION_UNRESOLVED"],
  "FH-STRESS": ["SCENARIO", "FUNDING_RESPONSE", "CAPITAL_RESPONSE", "CAPITAL_CONCLUSION_UNRESOLVED"],
} as const;

export function scoreDualRouteFinancialHealth(a: DualFinancialHealth, sector: string, usable: (ref: string) => boolean) {
  const id = a.full.id;
  const rubric = RUBRICS.find(row => row.id === id)!;
  const full = scoreFinancialHealth(a.full, sector, usable);
  const b = a.basic;
  const documented = (item?: Observation) => !!item?.rationale.trim() && item.refs.length > 0 && item.refs.every(usable);
  const allowed = a.fullDisposition === "INSUFFICIENT_DETAIL" && a.full.covenant !== "BREACH_RISK" &&
    full.gaps.length > 0 && full.gaps.every(gap => (fallbackGaps[id] as readonly string[]).includes(gap));
  const tryBasic = full.points === null && allowed;
  const gaps: string[] = [];
  const cap = rubric.max - 1;
  if (tryBasic) {
    for (const name of requirements[id]) if (!documented(b.topics[name])) gaps.push(name.toUpperCase());
    if (!documented(b.counter) || !b.counter.resolved || b.materialAdverseEvidenceUnresolved)
      gaps.push("BASIC_MATERIAL_RISK_NOT_RESOLVED");
    if (b.cashBasis === "UNQUALIFIED" || !b.restrictedCashExcluded || !b.unsupportedFundingExcluded || !b.obligationsPreserved)
      gaps.push("BASIC_FUNDING_OR_SCOPE_NOT_QUALIFIED");
    if (b.conclusion === "UNRESOLVED" || !b.demonstratedIndependentOfUnsupportedAssumptions)
      gaps.push("BASIC_ECONOMIC_CONCLUSION_NOT_ESTABLISHED");
    if (b.proposed) {
      const band = rubric.bands.find(entry => entry.label === b.proposed?.band);
      const p = b.proposed.points;
      if (!Number.isInteger(p) || !band || p < band.min || p > band.max) gaps.push("INVALID_BASIC_BAND");
      if (p > cap) gaps.push("BASIC_CEILING_EXCEEDED");
      if (b.conclusion !== (conclusions[id] as readonly string[])[p]) gaps.push("BASIC_BAND_CONCLUSION_MISMATCH");
    }
  }
  const basicPoints = tryBasic && !gaps.length ? b.proposed?.points ?? null : null;
  const selected = full.points !== null ? "B_FULL" : basicPoints !== null ? "A_BASIC" : null;
  return {
    ...full,
    points: full.points ?? basicPoints,
    band: full.band ?? (basicPoints !== null ? b.proposed!.band : null),
    route: selected ?? "E",
    gaps: selected ? [] : tryBasic ? [...full.gaps, ...gaps] : full.gaps,
    assessmentMethod: selected,
    maximumEligiblePoints: selected === "B_FULL" ? rubric.max : selected === "A_BASIC" ? cap : null,
    routeSelectionReason: selected === "B_FULL" ? "FULL_ROUTE_QUALIFIED" :
      selected === "A_BASIC" ? "FULL_DETAIL_INSUFFICIENT_BASIC_QUALIFIED" :
      tryBasic ? "NEITHER_ROUTE_SUPPORTS_A_BAND" : "BASIC_FALLBACK_NOT_AUTHORIZED",
    routes: {
      B: { maximumEligiblePoints: rubric.max, points: full.points, band: full.band, gaps: full.gaps, disposition: a.fullDisposition },
      A: { maximumEligiblePoints: cap, evaluated: tryBasic, points: basicPoints,
        band: basicPoints === null ? null : b.proposed!.band, gaps },
    },
  };
}

export function scoreIncrementalDualRouteFinancialHealth(
  input: ResearchIncrementalInput<DualFinancialHealth>,
  applicability: { historicalUsableThrough: string | null; nearTermFundingUnrepresentative: boolean; reason: string },
) {
  // A qualified replacement takes precedence when its route transition is documented.
  const cutoff = dateOnly(input.review.cutoff);
  const candidate = scoreDualRouteFinancialHealth(input.reassessment.assessment, input.sector, ref => {
    const item = input.evidence[ref];
    return !!item && dateOnly(item.periodEnd) <= dateOnly(item.publicBy) &&
      item.publicBy <= cutoff && (!item.expiresOn || cutoff <= dateOnly(item.expiresOn));
  });
  const review = candidate.points === null ? input.review : {
    ...input.review, continuedApplicability: { ...input.review.continuedApplicability, established: false },
  };
  const lifecycle = scoreIncrementalResearchAssessment({ ...input, review }, scoreDualRouteFinancialHealth, a => ({
    method: a.full.method,
    core: [...Object.values(a.full.topics), ...Object.values(a.basic.topics)].flatMap(topic => topic.refs),
    persistence: [], counter: [...a.full.counter.refs, ...a.basic.counter.refs],
  }));
  const retained = retainLatestValidEconomicQuality(lifecycle, input.baseline, input.reassessment);
  if (applicability.historicalUsableThrough) dateOnly(applicability.historicalUsableThrough);
  const expired = !!applicability.historicalUsableThrough && input.review.cutoff > applicability.historicalUsableThrough;
  const fundingRisk = applicability.nearTermFundingUnrepresentative ||
    input.reassessment.assessment.full.covenant === "BREACH_RISK" ||
    input.reassessment.assessment.fullDisposition === "KNOWN_ADVERSE";
  const blocked = expired || fundingRisk;
  const effectiveInput = blocked && retained.current.updateStatus === "CARRIED_FORWARD"
    ? { ...retained, updateStatus: "MATERIAL_REVIEW_PENDING" as const,
        current: { ...retained.current, updateStatus: "MATERIAL_REVIEW_PENDING" as const, points: null,
          band: null, validity: "NOT_RATED", inheritedFrom: null, underlyingFinancialPeriod: null } }
    : retained;
  const { currentComparableRoic: unused, id: unusedId, ...score } = resolveEconomicQualityEffectiveScore(effectiveInput);
  void unused; void unusedId;
  return {
    ...effectiveInput, baseline: lifecycle.baseline, freshness: { ...applicability, expired, fundingRisk },
    effectiveScore: { ...score, id: input.reassessment.assessment.full.id,
      ...(blocked && score.validity === "PROVISIONAL"
        ? { points: null, validity: "N/R", basis: null, financialPeriod: null } as const : {}),
      foundationFinancialPeriod: retained.latestValidAssessment?.financialPeriod ?? null,
    },
  };
}
