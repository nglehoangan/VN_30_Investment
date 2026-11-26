import { RUBRICS } from "@/domain/scoring/methodology";
import { evaluatePublicProxy, PUBLIC_PROXY_REVIEW_OBSERVATION } from "./public-proxy-review";
import { scoreIncrementalResearchAssessment, type ResearchIncrementalInput } from "./research-incremental";
import { retainLatestValidEconomicQuality } from "./bq-eq-retention";
import { resolveEconomicQualityEffectiveScore } from "./research-effective-score";

export const GQ_METHODOLOGY = "wp3-growth-quality-v1.0.0";
export const GQ_EXECUTABLE = "gq-route-research-v1.0.0";
export const profiles = {
  "GQ-HIST": ["STRUCTURAL_VALUE_DESTRUCTIVE_CONTRACTION", "WEAK_PUBLIC_GROWTH_PROFILE",
    "LIMITED_OR_LOW_QUALITY_GROWTH_PROFILE", "MODERATE_VALUE_CREATING_GROWTH_PROFILE", "STRONG_PUBLIC_GROWTH_PROFILE"],
  "GQ-FWD": ["STRUCTURAL_DECLINE_OUTLOOK", "WEAK_OR_STAGNANT_GROWTH_OUTLOOK",
    "LIMITED_OR_CYCLICAL_GROWTH_OUTLOOK", "MODERATE_GROWTH_OUTLOOK_WITH_MATERIAL_CONSTRAINTS", "GOOD_PUBLIC_GROWTH_RUNWAY"],
  "GQ-INC": ["EVIDENCED_VALUE_DESTRUCTIVE_EXPANSION", "PERSISTENTLY_WEAK_CAPITAL_PRODUCTIVITY",
    "MIXED_OR_DETERIORATING_CAPITAL_PRODUCTIVITY", "ACCEPTABLE_INCREMENTAL_CAPITAL_PRODUCTIVITY"],
} as const;
type Id = keyof typeof profiles;
type Note = { refs: string[]; rationale: string };
type Proposal = { band: string; points: number; rationale: string; higher: string; lower: string; maximumJustification?: Note };
type ProxyAssessment = NonNullable<Parameters<typeof evaluatePublicProxy>[0]>;
type ProxyInput = Parameters<typeof evaluatePublicProxy>[1];
type Scenario = { name: string; revenue: number; years: number; growth: number; margin: number; reinvestment: number;
  workingCapital: string; funding: string; rationale: string; refs: string[] };

const directTopics = {
  "GQ-HIST": ["trend", "acquisitions", "base_effects", "per_share", "normalization"],
  "GQ-FWD": ["runway", "reinvestment", "funding", "execution", "conversion", "downside"],
  "GQ-INC": ["incremental_return", "denominator", "unit_economics", "cost", "deployment", "classification"],
};
const eligibleDetailGaps = {
  "GQ-HIST": ["NORMALIZED_ORGANIC_AND_PER_SHARE_BRIDGE_UNAVAILABLE", "NORMALIZED_SCOPE_AND_PER_SHARE_BRIDGE_UNAVAILABLE", "COMPARABLE_CYCLE_OR_BASE_EFFECTS_UNAVAILABLE"],
  "GQ-FWD": ["DETAILED_CONVERSION_AND_FUNDING_UNAVAILABLE", "DETAILED_REINVESTMENT_OR_DOWNSIDE_UNAVAILABLE"],
  "GQ-INC": ["NORMALIZED_ALIGNED_INCREMENTAL_CAPITAL_UNAVAILABLE", "DEPLOYMENT_TIMING_OR_GRANULARITY_UNAVAILABLE"],
};
const profileTopics = {
  "GQ-HIST": ["trend", "base_effects", "per_share", "acquisitions"],
  "GQ-FWD": ["runway", "reinvestment", "funding", "execution"],
  "GQ-INC": ["earnings", "deployment", "windows", "asset_movements", "attribution", "corroboration"],
};
const profileFindings = {
  "GQ-HIST": ["persistent_deterioration", "weak_growth", "limited_quality", "meaningful_growth", "corroborated_strength"],
  "GQ-FWD": ["structural_decline", "weak_visibility", "limited_opportunity", "multi_year_opportunity", "credible_expansion"],
  "GQ-INC": ["value_destruction", "persistent_weakness", "mixed_productivity", "acceptable_productivity"],
};
export type GrowthAssessment = {
  id: Id; normalization: string; scopeAligned: boolean;
  direct: { proposal: Proposal | null; evidence: Record<string, Note>; detailGap: string; knownAdverse: boolean };
  directDeployment?: { nopatDelta: number; capitalDelta: number; minimumMeaningfulCapital: number; years: number; support: Note }[];
  proxy?: { assessment: ProxyAssessment; input: ProxyInput };
  proxyGap?: string;
  profile: { proposal: Proposal | null; evidence: Record<string, Note>; reason: string };
  counter: (Note & { disposition: string; effectOnBand: string })[];
  limitations: string[]; assumptions: string[]; scenarios?: Scenario[];
};
const restrictions = ["RESEARCH_ONLY", "NO_FORMAL_GATE_CREDIT", "NO_CROSS_ROUTE_CARDINAL_EQUIVALENCE"];

export function pairedGrowth(pairs: readonly (readonly [number, number])[]) {
  if (!pairs.length || pairs.some(pair => pair.some(v => !Number.isFinite(v) || v <= 0))) return null;
  const factor = pairs.reduce((growth, [end, start]) => growth * end / start, 1);
  return { cumulative: factor - 1, cagr: factor ** (1 / pairs.length) - 1 };
}

export function incrementalReturn(nopatDelta: number, capitalDelta: number, minimumMeaningfulCapital: number) {
  return [nopatDelta, capitalDelta, minimumMeaningfulCapital].every(Number.isFinite) &&
    minimumMeaningfulCapital >= 0 && capitalDelta > minimumMeaningfulCapital ? nopatDelta / capitalDelta : null;
}

export function projectGrowth({ revenue, years, growth, margin, reinvestment }: Scenario) {
  if (!Number.isInteger(years) || years < 3 || years > 5 || ![revenue, growth, margin, reinvestment].every(Number.isFinite) ||
      revenue <= 0 || growth <= -1 || reinvestment < 0) return null;
  return {
    years: Array.from({ length: years }, (_, i) => {
      const sales = revenue * (1 + growth) ** (i + 1);
      return { year: i + 1, revenue: sales, ebit: sales * margin, reinvestment: sales * reinvestment,
        cashAfterReinvestmentProxy: sales * (margin * 0.8 - reinvestment) };
    }),
  };
}

export function scoreGrowth(a: GrowthAssessment, sector: string, usable: (ref: string) => boolean) {
  const rubric = RUBRICS.find(row => row.id === a.id)!;
  const cap = profiles[a.id].length - 1;
  const documented = (note?: Note) => !!note?.rationale.trim() && !!note.refs.length && note.refs.every(usable);
  const refsOk = [...Object.values(a.direct.evidence), ...Object.values(a.profile.evidence), ...a.counter].every(documented);
  const invalidated = a.counter.some(c => c.disposition === "CONFIRMED_INVALIDATION");
  const counterOk = a.counter.length > 0 && a.counter.every(c => c.effectOnBand.trim() &&
    ["RESOLVED", "BOUNDED_LIMITATION", "UNRESOLVED_NON_INVALIDATING"].includes(c.disposition));
  const method = sector === "BANK" ? "BANK" : sector === "REAL_ESTATE" ? "PROPERTY" : "NONFINANCIAL";
  const shared = [
    ...(!refsOk ? ["SOURCE_INTEGRITY_OR_PIT"] : []),
    ...(!counterOk ? ["COUNTEREVIDENCE_BLOCKS"] : []),
    ...(a.normalization !== method ? ["SECTOR_NORMALIZATION"] : []),
    ...(a.id === "GQ-INC" && !a.scopeAligned ? ["CURRENT_CAPITAL_SCOPE_UNALIGNED"] : []),
  ];
  const judgment = (p: Proposal) => [p.rationale, p.higher, p.lower].every(v => v.trim());
  const canonical = (p: Proposal) => Number.isInteger(p.points) && rubric.bands.some(b =>
    b.label === p.band && p.points >= b.min && p.points <= b.max) && judgment(p) &&
    (p.points !== rubric.max || documented(p.maximumJustification));
  const scenariosOk = a.id !== "GQ-FWD" || (!!a.scenarios && a.scenarios.length >= 3 &&
    new Set(a.scenarios.map(s => s.name)).size >= 3 && a.scenarios.every(s =>
      !!projectGrowth(s) && documented(s) && s.funding.trim() && s.workingCapital.trim()));
  const direct = a.direct.proposal;
  const deployment = a.directDeployment ?? [];
  const directDeploymentOk = a.id !== "GQ-INC" || (deployment.length >= 2 &&
    deployment.some(window => window.years >= 2) && deployment.every(window => documented(window.support) &&
      window.minimumMeaningfulCapital > 0 && incrementalReturn(window.nopatDelta, window.capitalDelta, window.minimumMeaningfulCapital) !== null));
  const directGaps = [...shared,
    ...(!direct ? [a.direct.detailGap || "NO_DIRECT_ANALYST_PROPOSAL"] : []),
    ...directTopics[a.id].filter(k => !documented(a.direct.evidence[k])),
    ...(!scenariosOk ? ["SCENARIO_CONTRACT"] : []),
    ...(direct && !directDeploymentOk ? ["DIRECT_DEPLOYMENT_WINDOWS_UNQUALIFIED"] : []),
    ...(direct && !a.scopeAligned ? ["DIRECT_SCOPE_UNALIGNED"] : []),
    ...(!direct && a.direct.detailGap && !eligibleDetailGaps[a.id].includes(a.direct.detailGap)
      ? ["DIRECT_FALLBACK_REASON_UNQUALIFIED"] : []),
    ...(direct && !canonical(direct) ? ["CANONICAL_BAND_OR_MAXIMUM"] : [])];
  const directPoints = direct && !directGaps.length ? direct.points : null;
  const fallback = directPoints === null && !a.direct.knownAdverse && !shared.length &&
    !direct && eligibleDetailGaps[a.id].includes(a.direct.detailGap);
  let pxPoints: number | null = null;
  const pxGaps: string[] = [];
  if (a.id === "GQ-INC" && directPoints === null) {
    const px = a.proxy;
    if (!fallback || !px) pxGaps.push(...shared, a.proxyGap || "PX02_NOT_ELIGIBLE");
    else {
      const refs = px.assessment.evidence;
      const proposal = px.assessment;
      const declaration = px.input.evidence.find(e => e.observation === PUBLIC_PROXY_REVIEW_OBSERVATION &&
        refs.some(topic => topic.refs.includes(e.id)));
      const band = rubric.bands.find(b => b.label === proposal.assessment);
      if (!declaration || proposal.subcategory !== a.id || proposal.sector !== sector ||
          !band || !Number.isInteger(proposal.selectedPoints) || proposal.selectedPoints < band.min ||
          proposal.selectedPoints > band.max || !rubric.topics.every(topic => refs.some(t => t.topic === topic)) ||
          !evaluatePublicProxy(proposal, px.input, usable).eligible) pxGaps.push("PX02_EXISTING_CONTRACT_REJECTED");
      if (!pxGaps.length) pxPoints = proposal.selectedPoints;
    }
  }
  const evaluated = fallback && pxPoints === null;
  const p = a.profile.proposal;
  const profileGaps = evaluated ? [
    ...(!p ? [a.profile.reason || "NO_PROFILE_ANALYST_PROPOSAL"] : []),
    ...profileTopics[a.id].filter(k => !documented(a.profile.evidence[k])),
    ...(!scenariosOk ? ["SCENARIO_CONTRACT"] : []),
    ...(p && (!Number.isInteger(p.points) || profiles[a.id][p.points] !== p.band || !judgment(p)) ? ["PROFILE_BAND"] : []),
    ...(p && !documented(a.profile.evidence[profileFindings[a.id][p.points]]) ? ["SELECTED_CONCLUSION_UNSUPPORTED"] : []),
    ...(p && a.id === "GQ-INC" && (p.points === 0 || p.points === 3) &&
      !documented(a.profile.evidence.cost) ? ["ECONOMIC_COST_CONTEXT_REQUIRED"] : []),
    ...(p && (p.points > cap || p.points < 0) ? ["PROFILE_CEILING"] : []),
    ...(p && (!a.assumptions.length || !a.limitations.length) ? ["ASSUMPTIONS_AND_LIMITATIONS"] : []),
  ] : shared;
  const profilePoints = evaluated && p && !profileGaps.length ? p.points : null;
  const points = directPoints ?? pxPoints ?? profilePoints;
  const route = directPoints !== null ? "B_DIRECT" : pxPoints !== null ? "PX02" : profilePoints !== null ? "A_PROFILE" : "E";
  const band = route === "B_DIRECT" ? direct!.band : route === "PX02" ? a.proxy!.assessment.assessment :
    profilePoints !== null ? p!.band : null;
  return {
    rubricId: a.id, maxPoints: rubric.max, totalScore: null, productionEligible: false, publicationAuthorized: false,
    points, band, route, gaps: points === null ? [...new Set([...directGaps, ...pxGaps, ...profileGaps])] : [],
    invalidated, analyst: a, qualification: points === null ? null : {
      methodologyVersion: GQ_METHODOLOGY, assessmentMethod: route, assessmentObjective: a.id,
      bandSemantics: route === "A_PROFILE" ? "APPROVED_PUBLIC_GROWTH_PROFILE_V1" : "CANONICAL",
      selectedBand: band, selectedPoints: points, maximumEligiblePoints: route === "A_PROFILE" ? cap : rubric.max,
      actionabilityRestrictions: restrictions,
    },
    routes: { B: { points: directPoints, gaps: directGaps }, PX02: a.id === "GQ-INC" ? { points: pxPoints, gaps: pxGaps } : null,
      A: { evaluated, proposal: p, points: profilePoints, gaps: profileGaps } },
  };
}

export function scoreIncrementalGrowth(input: ResearchIncrementalInput<GrowthAssessment>,
  historical: { eligible: boolean; reason: string; usableThrough: string | null }) {
  const lifecycle = scoreIncrementalResearchAssessment(input, scoreGrowth, a => ({
    method: a.normalization, core: [...Object.values(a.direct.evidence), ...Object.values(a.profile.evidence)].flatMap(n => n.refs),
    persistence: [], counter: a.counter.flatMap(n => n.refs),
  }));
  const retained = retainLatestValidEconomicQuality(lifecycle, input.baseline, input.reassessment);
  const { current, baseline } = lifecycle;
  const review = current.review;
  const blocked = current.invalidated || review.changes.some(c => c.status === "MATERIAL_INVALIDATING") ||
    !historical.eligible || !historical.reason.trim() || (!!historical.usableThrough && review.cutoff > historical.usableThrough) ||
    current.inheritanceGaps.some(gap => ["FRESH_REVIEW_REQUIRED", "MATERIALITY_REVIEW_REQUIRED",
      "VALID_BASELINE_REQUIRED", "NEW_ANNUAL_REASSESSMENT_REQUIRED", "AFFIRMATIVE_SUPPORT_REQUIRED",
      "SCOPE_TRANSITION_REVIEW_REQUIRED"].includes(gap));
  const inherited = !blocked && current.updateStatus === "CARRIED_FORWARD";
  const score = resolveEconomicQualityEffectiveScore(retained);
  const provisional = !blocked && (inherited || score.validity === "PROVISIONAL");
  const confirmed = score.validity === "CONFIRMED_CURRENT" && !inherited && current.updateStatus !== "CARRIED_FORWARD";
  const effectivePoints = confirmed ? score.points : provisional ? baseline?.points ?? null : null;
  const effectiveValidity = confirmed ? "CONFIRMED_CURRENT" : effectivePoints !== null ? "PROVISIONAL" : "N/R";
  const source = confirmed ? current : provisional ? baseline : null;
  return {
    ...retained, baseline, historical, effectiveScore: { ...score, id: input.reassessment.assessment.id,
      points: effectivePoints, validity: effectiveValidity, currentConfirmedPoints: confirmed ? score.points : null,
      basis: confirmed ? score.basis : provisional ? "LATEST_VALID_HISTORICAL_ASSESSMENT" : null,
      financialPeriod: confirmed ? score.financialPeriod : provisional ? input.baseline?.financialPeriod ?? null : null,
      routeQualification: source?.qualification ? { ...source.qualification, confidence: source.confidence,
        assessmentValidity: effectiveValidity, freshness: historical, currentReview: review.cutoff } : null,
    },
  };
}
