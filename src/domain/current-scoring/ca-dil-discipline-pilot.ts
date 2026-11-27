import { resolveCapitalEffective, fullCapitalResearchScore } from "./capital-allocation-research";

export const DISCIPLINE_PILOT = "CA_DIL_ECONOMIC_DISCIPLINE_PILOT_V1_0";
export const disciplineBands = {
  DISCIPLINED_WITH_LIMITATIONS: 1,
  MATERIAL_VALUE_DESTRUCTION_OR_WEAK_ECONOMIC_DISCIPLINE: 0,
} as const;
export type DisciplineBand = keyof typeof disciplineBands;
const groups = ["magnitude", "alignment", "protection", "outcome"] as const;
type Group = { supporting: string[]; adverse: string[]; limitation: string; refs: string[] };
export type DisciplineProposal = {
  band: DisciplineBand | null;
  groups: Record<typeof groups[number], Group>;
  judgment: string;
  exposure: "CONTROLLED" | "MATERIAL_DETRIMENT" | "UNRESOLVED";
  actualIssuanceAndMaterialTermsSupported: boolean;
  unknownBenefitTreatment: "NO_CREDIT_NO_ZERO_INFERENCE";
  outcomeAttribution: "CORROBORATION_ONLY";
  confidence: [number, number, number, number, number];
};
export type DisciplineReview = {
  accepted: boolean;
  criteria: Record<`RV${"01" | "02" | "03" | "04" | "05" | "06"}`, string>;
  blockers: { code: "RB01" | "RB02" | "RB03" | "RB04" | "RB05"; finding: string }[];
};

export function validateDisciplinePilot(proposal: DisciplineProposal, review: DisciplineReview,
  eligibleRefs: ReadonlySet<string>) {
  const gaps: string[] = [];
  if (!proposal.judgment.trim() || proposal.confidence.length !== 5 ||
      proposal.confidence.some(value => ![0, 1, 2].includes(value))) gaps.push("ASSESSMENT_RECORD");
  for (const name of groups) {
    const group = proposal.groups[name];
    if (!group || !group.limitation.trim() || !group.refs.length ||
        group.refs.some(ref => !eligibleRefs.has(ref)) ||
        !group.supporting.some(text => text.trim()) || !group.adverse.some(text => text.trim())) {
      gaps.push(`UNQUALIFIED_GROUP_${name.toUpperCase()}`);
    }
  }
  if (proposal.unknownBenefitTreatment !== "NO_CREDIT_NO_ZERO_INFERENCE" ||
      proposal.outcomeAttribution !== "CORROBORATION_ONLY") gaps.push("ECONOMIC_INFERENCE");
  if (proposal.band !== null && (!Object.hasOwn(disciplineBands, proposal.band) ||
      !proposal.actualIssuanceAndMaterialTermsSupported ||
      proposal.exposure !== (proposal.band === "DISCIPLINED_WITH_LIMITATIONS" ? "CONTROLLED" : "MATERIAL_DETRIMENT"))) {
    gaps.push("BAND_NOT_SUPPORTED");
  }
  if (!review.accepted || ["RV01", "RV02", "RV03", "RV04", "RV05", "RV06"].some(id =>
      !review.criteria[id as keyof DisciplineReview["criteria"]]?.trim()) ||
      review.blockers.some(row => !row.finding.trim()) ||
      (proposal.band !== null && review.blockers.length > 0)) gaps.push("REVIEW_NOT_ACCEPTED");
  const band = gaps.length ? null : proposal.band;
  return { band, points: band === null ? null : disciplineBands[band], gaps,
    confidence: { dimensions: proposal.confidence, total: proposal.confidence.reduce((sum, value) => sum + value, 0) } };
}

type Canonical = Parameters<typeof resolveCapitalEffective>[0];
type Carry = Parameters<typeof resolveCapitalEffective>[2];
type Validated = ReturnType<typeof validateDisciplinePilot>;

export function resolveDisciplinePilot(
  current: Canonical, annual: Canonical, direct: Validated, history: Validated, applicability?: Carry,
) {
  // Detailed B and PX05, when already eligible, retain their approved interpretation.
  const adapt = (row: Canonical, assessment: Validated): Canonical => {
    if (row.points !== null && ["B", "PROXY"].includes(row.routeQualification.route ?? "")) return row;
    return { ...row, points: assessment.points, confidence: assessment.confidence,
      validity: assessment.points === null ? "N/R" : "CONFIRMED_CURRENT",
      basis: assessment.points === null ? null : "CURRENT_DIRECT_RESEARCH",
      routeQualification: { ...row.routeQualification, route: assessment.points === null ? null : "A" } };
  };
  const effective = resolveCapitalEffective(adapt(current, direct), adapt(annual, history), applicability);
  const canonicalPriority = effective.points !== null && ["B", "PROXY"].includes(effective.routeQualification.route ?? "");
  return { methodology: DISCIPLINE_PILOT, id: "CA-DIL", points: effective.points, validity: effective.validity,
    sourceCutoff: effective.underlyingAssessmentCutoff, canonicalCurrentPoints: current.points, directPoints: direct.points,
    annualPoints: history.points, annualCutoff: annual.reviewCutoff, band: canonicalPriority ? null : effective.inheritance ? history.band : direct.band,
    route: canonicalPriority ? effective.routeQualification.route : effective.points === null ? null : "METHOD_A_PILOT",
    confidence: effective.confidence, inheritance: effective.inheritance };
}

type ScoreRow = { id: string; category: string; weight: number; points: number | null; validity: string };
export function summarizeDisciplineCandidate<T extends ScoreRow>(predecessor: readonly T[],
  pilot: ReturnType<typeof resolveDisciplinePilot>) {
  if (predecessor.length !== 23 || new Set(predecessor.map(row => row.id)).size !== 23 ||
      !predecessor.some(row => row.id === "CA-DIL" && row.weight === 1 && row.points === null) ||
      !predecessor.some(row => row.id === "CA-REINV" && row.points === null) ||
      ![0, 1, null].includes(pilot.points) || (pilot.points === null) !== (pilot.validity === "N/R")) throw Error("PILOT_SCORECARD_SCOPE");
  const scorecard = predecessor.map(row => row.id === "CA-DIL"
    ? { ...row, points: pilot.points, validity: pilot.validity, route: pilot.route,
      currentAssessmentPoints: pilot.directPoints, historicalPoints: pilot.annualPoints,
      historicalCutoff: pilot.annualPoints === null ? null : pilot.annualCutoff,
      provisionalOrigin: pilot.inheritance ? pilot.sourceCutoff : null,
      latestEligiblePoints: pilot.annualPoints, confidence: pilot.confidence,
      nrReason: pilot.points === null ? "NEITHER_PILOT_BAND_DEFENSIBLE" : null,
      pilotMethodology: pilot.methodology, pilotBand: pilot.band } : row);
  const summarize = (rows: readonly ScoreRow[]) => ({
    count: rows.length, weight: rows.reduce((sum, row) => sum + row.weight, 0),
    points: rows.reduce((sum, row) => sum + (row.points ?? 0), 0),
  });
  return { scorecard, assessed: summarize(scorecard.filter(row => row.points !== null)),
    confirmedCurrent: summarize(scorecard.filter(row => row.validity === "CONFIRMED_CURRENT")),
    provisional: summarize(scorecard.filter(row => row.validity === "PROVISIONAL")),
    unrated: summarize(scorecard.filter(row => row.points === null)),
    fullResearchScore: fullCapitalResearchScore(scorecard), formalScore: null };
}
