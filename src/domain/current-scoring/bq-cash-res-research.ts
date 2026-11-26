import { RUBRICS } from "@/domain/scoring/methodology";

export const BQ_CASH_RES_RESEARCH = "bq-cash-res-evidence-sufficiency-research-v1.0.0";
type RubricId = "BQ-CASH" | "BQ-RES";
type Observation = { refs: readonly string[]; rationale: string };
type MaterialObservation = Observation & { material: boolean; resolved: boolean };
type Proposal = {
  band: string; points: number; strongerEvidence: boolean;
  maximumPrerequisitesMet: boolean; exceptionalJustification: string;
};
type Common = { proposed: Proposal | null; counter: Observation & { resolved: boolean } };

export type CashAssessment = Common & {
  realization: Observation & {
    route: "CASH_FLOW" | "BANK_RECOGNITION" | "PROPERTY_COLLECTIONS";
    comparable: boolean;
  };
  recognition: Observation;
  oneOffs: MaterialObservation;
  workingCapital: MaterialObservation;
  capex: MaterialObservation & { splitAvailable: boolean };
  exceptional: Observation;
};
export type ResilienceAssessment = Common & {
  concentration: Observation & {
    basis: "REVENUE_DISCLOSED" | "QUALIFIED_ALTERNATIVE" | "UNDISCLOSED";
    customerShare: number | null;
    mitigation: Observation;
  };
  cyclicality: Observation;
  pricing: MaterialObservation;
  stress: Observation & {
    basis: "OBSERVED" | "SUPPORTED_SCENARIO" | "UNAVAILABLE";
    severePlausible: boolean;
    franchiseProtected: boolean;
    noDistressedCapital: boolean;
  };
};

type CashPeriod = {
  period: string; cashScope: string; earningsScope: string;
  cfo: number; capex: number; earnings: number | null; meaningfulEarnings: boolean;
};

export function cumulativeCashConversion(periods: readonly CashPeriod[]) {
  if (!periods.length || new Set(periods.map(row => row.period)).size !== periods.length ||
      !periods.every(row => row.cashScope && row.cashScope === row.earningsScope &&
        row.cashScope === periods[0].cashScope && Number.isFinite(row.cfo) &&
        Number.isFinite(row.capex) && row.capex >= 0 && row.meaningfulEarnings &&
        row.earnings !== null && Number.isFinite(row.earnings) && row.earnings > 0)) return null;
  const cfo = periods.reduce((sum, row) => sum + row.cfo, 0);
  const capex = periods.reduce((sum, row) => sum + row.capex, 0);
  const earnings = periods.reduce((sum, row) => sum + row.earnings!, 0);
  return { cfo, capex, fcf: cfo - capex, earnings, cfoConversion: cfo / earnings, fcfConversion: (cfo - capex) / earnings };
}

function sufficiency(id: RubricId, assessment: Common, usable: (ref: string) => boolean) {
  const rubric = RUBRICS.find(row => row.id === id)!;
  const { proposed, counter } = assessment;
  const gaps: string[] = [];
  const documented = (observation: Observation) =>
    observation.refs.length > 0 && observation.refs.every(usable) && !!observation.rationale.trim();
  const conditional = (observation: MaterialObservation) => !!observation.rationale.trim() &&
    (!observation.material || (observation.resolved && documented(observation)));
  if (!documented(counter) || !counter.resolved) gaps.push("COUNTEREVIDENCE");
  if (proposed) {
    const band = rubric.bands.find(row => row.label === proposed.band);
    if (!band || !Number.isInteger(proposed.points) || proposed.points < band.min || proposed.points > band.max)
      gaps.push("INVALID_BAND");
    else if (band.min !== band.max && proposed.points === band.max && !proposed.strongerEvidence)
      gaps.push("STRONGER_EVIDENCE_REQUIRED");
    if (proposed.points === rubric.max && (!proposed.maximumPrerequisitesMet || !proposed.exceptionalJustification.trim()))
      gaps.push("MAXIMUM_PREREQUISITES");
  }
  return {
    gaps, documented, conditional,
    finish(route: string) {
      const points = gaps.length ? null : proposed?.points ?? null;
      return { rubricId: id, maxPoints: rubric.max, points, band: points === null ? null : proposed!.band,
        route: points === null ? "E" : route, gaps, totalScore: null, productionEligible: false, publicationAuthorized: false };
    },
  };
}

export function scoreCashRealization(assessment: CashAssessment, sector: string, usable: (ref: string) => boolean) {
  const { gaps, documented, conditional, finish } = sufficiency("BQ-CASH", assessment, usable);
  const { realization, recognition, oneOffs, workingCapital, capex, proposed, exceptional } = assessment;
  const sectorRoute = sector === "BANK" ? "BANK_RECOGNITION" : sector === "REAL_ESTATE" ? "PROPERTY_COLLECTIONS" : "CASH_FLOW";
  if (!documented(realization) || !realization.comparable || realization.route !== sectorRoute) gaps.push("REALIZATION");
  if (!documented(recognition)) gaps.push("RECOGNITION");
  if (!conditional(oneOffs)) gaps.push("ONE_OFFS");
  if (!conditional(workingCapital)) gaps.push("WORKING_CAPITAL");
  if (!conditional(capex) || (capex.material && !capex.splitAvailable)) gaps.push("CAPEX");
  if (proposed?.points === 6 && !documented(exceptional)) gaps.push("EXCEPTIONAL_REALIZATION");
  return finish(realization.route);
}

export function scoreBusinessResilience(assessment: ResilienceAssessment, _sector: string, usable: (ref: string) => boolean) {
  const { gaps, documented, conditional, finish } = sufficiency("BQ-RES", assessment, usable);
  const { concentration, cyclicality, pricing, stress, proposed } = assessment;
  const points = proposed?.points ?? 0;
  if (!documented(concentration) || (concentration.basis === "REVENUE_DISCLOSED"
    ? concentration.customerShare === null || !Number.isFinite(concentration.customerShare) ||
      concentration.customerShare < 0 || concentration.customerShare > 1
    : concentration.basis !== "QUALIFIED_ALTERNATIVE" || concentration.customerShare !== null)) gaps.push("CONCENTRATION");
  if (concentration.customerShare !== null && concentration.customerShare > .20 && points >= 3 &&
      !documented(concentration.mitigation)) gaps.push("CONCENTRATION_MITIGATION");
  if (!documented(cyclicality)) gaps.push("CYCLICALITY");
  if (!conditional(pricing)) gaps.push("PRICING");
  if (!stress.rationale.trim() || !stress.refs.every(usable) ||
      (points >= 4 && (stress.basis === "UNAVAILABLE" || !documented(stress)))) gaps.push("STRESS");
  if (points === 5 && (!stress.severePlausible || !stress.franchiseProtected || !stress.noDistressedCapital))
    gaps.push("SEVERE_STRESS_PROTECTION");
  return finish("OPERATING_RESILIENCE");
}
