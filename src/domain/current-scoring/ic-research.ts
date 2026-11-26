import { RUBRICS } from "@/domain/scoring/methodology";
import { evaluatePublicProxy, PUBLIC_PROXY_REVIEW_OBSERVATION } from "./public-proxy-review";
import { scoreIncrementalResearchAssessment, type ResearchIncrementalInput } from "./research-incremental";
import { retainLatestValidEconomicQuality } from "./bq-eq-retention";
import { resolveEconomicQualityEffectiveScore } from "./research-effective-score";

export const IC_METHODOLOGY = "wp4-industry-competitive-position-v1.0.0";
export const IC_EXECUTABLE = "ic-route-research-v1.0.0";
export const profiles = {
  "IC-IND": ["VALUE_DESTRUCTIVE_INDUSTRY_PROFILE", "STRUCTURALLY_DIFFICULT_INDUSTRY_PROFILE",
    "MIXED_INDUSTRY_STRUCTURE_PROFILE", "ATTRACTIVE_PUBLIC_INDUSTRY_PROFILE"],
  "IC-POS": ["STRUCTURALLY_DISADVANTAGED_CAPABILITY_PROFILE", "WEAK_COMPETITIVE_CAPABILITY_PROFILE",
    "ESTABLISHED_COMPETITIVE_CAPABILITY_PROFILE", "STRONG_COMPETITIVE_CAPABILITY_PROFILE"],
  "IC-CYCLE": ["ADVERSE_CYCLE_EXPOSURE", "MIXED_OR_BALANCED_CYCLE_EXPOSURE"],
} as const;
type Id = keyof typeof profiles;
type Note = { refs: string[]; rationale: string };
type Proposal = { band: string; points: number; rationale: string; higher: string; lower: string; maximumJustification?: Note };
type Proxy = { assessment: NonNullable<Parameters<typeof evaluatePublicProxy>[0]>;
  input: Parameters<typeof evaluatePublicProxy>[1] };

const directTopics = {
  "IC-IND": ["barriers", "competition", "demand", "disruption", "pricing", "bargaining", "capital",
    "industry_profitability", "regulation"],
  "IC-POS": ["share", "cost_position", "distribution", "market_alignment", "sustainability"],
  "IC-CYCLE": ["cycle", "forward_asymmetry", "survivability", "normalization", "downside", "recovery"],
};
const independentFindings = {
  "IC-IND": ["industry_destruction", "structural_pressure", "mixed_structure", "durable_industry_economics"],
  "IC-POS": ["structural_disadvantage", "persistent_weakness", "established_capability", "relative_strength"],
  "IC-CYCLE": ["adverse_exposure", "mixed_exposure"],
};
const profileTopics = {
  "IC-IND": ["barriers", "competition", "demand", "disruption"],
  "IC-POS": ["participation", "commercial", "delivery", "access", "economics"],
  "IC-CYCLE": ["demand", "comparable_trends", "normalization", "forward_risk", "vulnerability"],
};
const detailGap = { "IC-IND": "INDUSTRY_ECONOMICS_DETAIL_UNAVAILABLE", "IC-POS": "RELATIVE_MARKET_EVIDENCE_UNAVAILABLE",
  "IC-CYCLE": "NORMALIZED_ASYMMETRY_OR_SURVIVABILITY_UNAVAILABLE" };
const maximumFinding = { "IC-IND": "industry_durability", "IC-POS": "representative_leadership", "IC-CYCLE": "favorable_asymmetry" };

type Ownership = { family: string; refs: string[]; primary: string; channel: string; secondary: string[];
  commonDependency: string; independence: string; duplication: string; counterevidence: string; admission: string };
export type IndustryAssessment = {
  id: Id; normalization: string;
  scope: { issuer: string; industry: string; segment: string; product: string; geography: string; customers: string;
    comparators: string; period: string; consolidation: string; associates: string; representativeness: string };
  evidenceFamilies: Record<string, { origin: "ISSUER" | "EXTERNAL"; ref: string }>;
  ownership: Ownership[];
  direct: { proposal: Proposal | null; evidence: Record<string, Note>; gap: string; knownAdverse: boolean };
  profile: { proposal: Proposal | null; evidence: Record<string, Note>; reason: string };
  proxy?: Proxy;
  proxyGap?: string;
  counter: (Note & { disposition: string; effectOnBand: string })[];
  assumptions: string[]; limitations: string[];
};

/** Apply the M3 same-family/distinct-channel rule to the research routes before scoring. */
export function reviewIndustryOwnership(assessments: IndustryAssessment[]) {
  const claimsByFamily = new Map<string, Set<string>>();
  for (const assessment of assessments) {
    for (const entry of assessment.ownership) {
      const claim = entry.channel.trim().toLowerCase();
      const claims = claimsByFamily.get(entry.family) ?? new Set<string>();
      if (!claim || claims.has(claim)) return false;
      claims.add(claim);
      claimsByFamily.set(entry.family, claims);
    }
  }
  return true;
}

export function scoreIndustry(a: IndustryAssessment, sector: string, usable: (ref: string) => boolean) {
  const rubric = RUBRICS.find(row => row.id === a.id)!;
  const cap = profiles[a.id].length - 1;
  const documented = (note?: Note) => !!note?.rationale.trim() && !!note.refs.length && note.refs.every(usable);
  const full = a.direct.proposal;
  const p = a.profile.proposal;
  const judgment = (proposal: Proposal) => [proposal.rationale, proposal.higher, proposal.lower].every(v => v.trim());
  const external = (refs: string[]) => Object.values(a.evidenceFamilies).some(f =>
    f.origin === "EXTERNAL" && refs.includes(f.ref) && usable(f.ref));
  const notes = [...Object.values(a.direct.evidence), ...Object.values(a.profile.evidence), ...a.counter];
  const approvedRefs = new Set(a.ownership.flatMap(row => row.refs));
  const normalization = sector === "BANK" ? "BANK" : sector === "REAL_ESTATE" ? "PROPERTY" : sector;
  const invalidated = a.counter.some(c => c.disposition === "CONFIRMED_INVALIDATION");
  const common = [
    ...(Object.values(a.scope).some(v => !v.trim()) || a.normalization !== normalization ? ["MARKET_SCOPE_OR_SECTOR_UNQUALIFIED"] : []),
    ...(!notes.every(documented) ? ["SOURCE_INTEGRITY_OR_PIT"] : []),
    ...(!a.counter.length || !a.counter.every(c => c.effectOnBand.trim() &&
      ["RESOLVED", "BOUNDED_LIMITATION", "UNRESOLVED_NON_INVALIDATING"].includes(c.disposition)) ? ["COUNTEREVIDENCE_BLOCKS"] : []),
    ...(!a.ownership.length || new Set(a.ownership.map(o => o.family)).size !== a.ownership.length ||
      !a.ownership.every(o => a.evidenceFamilies[o.family] && o.refs.includes(a.evidenceFamilies[o.family].ref) &&
        o.refs.every(usable) && o.secondary.includes(a.id) &&
        [o.primary, o.channel, o.commonDependency, o.independence, o.duplication, o.counterevidence, o.admission].every(v => v.trim())) ||
      notes.some(n => n.refs.some(ref => !approvedRefs.has(ref))) ? ["ECONOMIC_CHANNEL_UNQUALIFIED"] : []),
  ];
  const canonical = (band: string, points: number) => Number.isInteger(points) &&
    rubric.bands.some(b => b.label === band && points >= b.min && points <= b.max);
  const bGaps = [...common, ...directTopics[a.id].filter(k => !documented(a.direct.evidence[k])),
    ...(!full ? [a.direct.gap || "NO_DIRECT_PROPOSAL"] : []),
    ...(a.id === "IC-IND" && !external(Object.values(a.direct.evidence).flatMap(n => n.refs))
      ? ["NO_DIRECT_EXTERNAL_INDUSTRY_EVIDENCE"] : []),
    ...(full && (!canonical(full.band, full.points) || !judgment(full) || (full.points === rubric.max &&
      (!documented(full.maximumJustification) || !documented(a.direct.evidence[maximumFinding[a.id]]))))
      ? ["CANONICAL_BAND_OR_MAXIMUM"] : [])];
  const directPoints = full && !bGaps.length ? full.points : null;
  const fallback = !full && !a.direct.knownAdverse && !common.length && a.direct.gap === detailGap[a.id];
  const proxy = a.proxy;
  const pxGaps = a.id !== "IC-POS" || directPoints !== null ? [] :
    !fallback || !proxy ? [a.proxyGap || "PX03_NOT_ELIGIBLE"] : (() => {
      const { assessment, input } = proxy;
      const topics = assessment.evidence;
      const declaration = input.evidence.find(e => e.observation === PUBLIC_PROXY_REVIEW_OBSERVATION &&
        topics.some(t => t.refs.includes(e.id)));
      return declaration && assessment.subcategory === a.id && assessment.sector === sector &&
        canonical(assessment.assessment, assessment.selectedPoints) &&
        rubric.topics.every(k => topics.some(t => t.topic === k)) &&
        topics.every(t => t.refs.every(ref => ref === declaration.id || approvedRefs.has(ref))) &&
        evaluatePublicProxy(assessment, input, usable).eligible ? [] : ["PX03_EXISTING_CONTRACT_REJECTED"];
    })();
  const proxyPoints = a.id === "IC-POS" && proxy && fallback && !pxGaps.length ? proxy.assessment.selectedPoints : null;
  const evaluated = fallback && proxyPoints === null;
  const selectedFinding = p && a.profile.evidence[independentFindings[a.id][p.points]];
  const aGaps = evaluated ? [
    ...profileTopics[a.id].filter(k => !documented(a.profile.evidence[k])),
    ...(a.id === "IC-IND" && !external(Object.values(a.profile.evidence).flatMap(n => n.refs)) ? ["EXTERNAL_INDUSTRY_EVIDENCE_REQUIRED"] : []),
    ...(!p ? [a.profile.reason || "NO_PROFILE_PROPOSAL"] : []),
    ...(p && (!Number.isInteger(p.points) || p.points < 0 || p.points > cap) ? ["PROFILE_CEILING"] : []),
    ...(p && (profiles[a.id][p.points] !== p.band || !judgment(p) || !documented(selectedFinding || undefined))
      ? ["PROFILE_CONCLUSION_UNSUPPORTED"] : []),
    ...(p && a.id === "IC-IND" && p.points === 3 && !external(selectedFinding?.refs ?? [])
      ? ["INDEPENDENT_DURABLE_INDUSTRY_ECONOMICS_REQUIRED"] : []),
    ...(p && a.id === "IC-POS" && p.points >= 2 && new Set(profileTopics[a.id].flatMap(k =>
      a.profile.evidence[k]?.refs ?? []).map(ref => Object.entries(a.evidenceFamilies).find(([, f]) =>
      f.ref === ref)?.[0]).filter(Boolean)).size < 2 ? ["INDEPENDENT_CAPABILITY_CORROBORATION_REQUIRED"] : []),
    ...(p && a.id === "IC-POS" && p.points === 3 && !external(selectedFinding?.refs ?? [])
      ? ["RELATIVE_CAPABILITY_CORROBORATION_REQUIRED"] : []),
    ...(p && a.id === "IC-CYCLE" && p.points === 1 &&
      ["cycle_upside", "cycle_downside"].some(k => !documented(a.profile.evidence[k])) ? ["TWO_SIDED_CYCLE_EVIDENCE_REQUIRED"] : []),
    ...(!a.assumptions.length || !a.limitations.length ? ["ASSUMPTIONS_AND_LIMITATIONS"] : []),
  ] : common;
  const profilePoints = evaluated && p && !aGaps.length ? p.points : null;
  const points = directPoints ?? proxyPoints ?? profilePoints;
  const route = directPoints !== null ? "B_DIRECT" : proxyPoints !== null ? "PX03" : profilePoints !== null ? "A_PROFILE" : "E";
  const band = directPoints !== null ? full!.band : proxyPoints !== null ? proxy!.assessment.assessment : profilePoints !== null ? p!.band : null;
  return {
    rubricId: a.id, maxPoints: rubric.max, totalScore: null, productionEligible: false, publicationAuthorized: false,
    points, band, route, gaps: points === null ? [...new Set([...bGaps, ...pxGaps, ...aGaps])] : [], invalidated,
    analyst: a, qualification: points === null ? null : { methodologyVersion: IC_METHODOLOGY, assessmentMethod: route,
      assessmentObjective: a.id, bandSemantics: route === "A_PROFILE" ? "PUBLIC_INDUSTRY_PROFILE_V1" : "CANONICAL",
      selectedBand: band, selectedPoints: points, economicScope: a.scope,
      economicChannels: a.ownership.map(({ family, primary, channel, independence }) => ({ family, primary, channel, independence })),
      maximumEligiblePoints: route === "A_PROFILE" ? cap : rubric.max,
      actionabilityRestrictions: ["RESEARCH_ONLY", "NO_FORMAL_GATE_CREDIT", "NO_CROSS_ROUTE_CARDINAL_EQUIVALENCE"] },
    routes: { B: { points: directPoints, gaps: bGaps }, PX03: a.id === "IC-POS" ? { points: proxyPoints, gaps: pxGaps } : null,
      A: { evaluated, proposal: p, points: profilePoints, gaps: aGaps } },
  };
}

export function scoreIncrementalIndustry(input: ResearchIncrementalInput<IndustryAssessment>,
  historical: { eligible: boolean; reviewReason: string; usableThrough: string | null }) {
  const lifecycle = scoreIncrementalResearchAssessment(input, scoreIndustry, a => ({
    method: a.normalization, core: [...Object.values(a.profile.evidence), ...Object.values(a.direct.evidence)].flatMap(n => n.refs),
    persistence: [], counter: a.counter.flatMap(n => n.refs),
  }));
  const retained = retainLatestValidEconomicQuality(lifecycle, input.baseline, input.reassessment);
  const { baseline, current } = lifecycle;
  const score = resolveEconomicQualityEffectiveScore(retained);
  const blocked = !historical.eligible || !historical.reviewReason.trim() || current.invalidated ||
    (historical.usableThrough !== null && current.review.cutoff > historical.usableThrough) ||
    current.review.changes.some(c => c.status === "MATERIAL_INVALIDATING") ||
    current.inheritanceGaps.some(g => ["FRESH_REVIEW_REQUIRED", "MATERIALITY_REVIEW_REQUIRED", "VALID_BASELINE_REQUIRED",
      "NEW_ANNUAL_REASSESSMENT_REQUIRED", "AFFIRMATIVE_SUPPORT_REQUIRED", "SCOPE_TRANSITION_REVIEW_REQUIRED"].includes(g)) ||
    (input.reassessment.assessment.id === "IC-CYCLE" && current.inheritanceGaps.includes("MATERIAL_IMPACT_BLOCKS_INHERITANCE"));
  const confirmed = score.validity === "CONFIRMED_CURRENT" && current.updateStatus !== "CARRIED_FORWARD";
  const provisional = !blocked && (score.validity === "PROVISIONAL" || current.updateStatus === "CARRIED_FORWARD");
  const points = confirmed ? score.points : provisional ? baseline?.points ?? null : null;
  const validity = confirmed ? "CONFIRMED_CURRENT" : points !== null ? "PROVISIONAL" : "N/R";
  const selected = confirmed ? current : provisional ? baseline : null;
  return { ...retained, baseline, historical, effectiveScore: { ...score, id: input.reassessment.assessment.id,
    points, validity, currentConfirmedPoints: confirmed ? points : null,
    basis: confirmed ? score.basis : provisional ? "LATEST_VALID_HISTORICAL_ASSESSMENT" : null,
    financialPeriod: confirmed ? score.financialPeriod : provisional ? input.baseline?.financialPeriod ?? null : null,
    routeQualification: selected?.qualification ? { ...selected.qualification, confidence: selected.confidence,
      assessmentValidity: validity, currentReview: current.review.cutoff, historical } : null,
  } };
}
