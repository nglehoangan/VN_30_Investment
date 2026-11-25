import { RUBRICS } from "@/domain/scoring/methodology";

export const BQ_EQ_RESEARCH = "bq-eq-evidence-sufficiency-research-v1.0.0";
const rubric = RUBRICS.find(row => row.id === "BQ-EQ")!;

type Topic = {
  required: readonly string[];
  supporting: readonly string[];
  rationale: string;
};
type Attempt = {
  route: "A" | "B" | "C" | "D";
  status: "SUPPORTED" | "UNAVAILABLE";
  rationale: string;
};
export type EconomicQualityAssessment = {
  attempts: readonly Attempt[];
  returns: Topic & {
    hurdle: "WACC" | "COST_OF_EQUITY" | "SECTOR_EQUIVALENT";
    measure: "ROIC" | "ROE_ROTE" | "SECTOR_EQUIVALENT" | "COMBINED";
    comparable: boolean;
    leverageReviewed: boolean;
    relativeToHurdleEstablished: boolean;
  };
  persistence: Topic & { fiscalYears: readonly number[]; comparable: boolean };
  cost: Topic & { low: number; high: number; method: string; assumptions: string; sensitivity: string; limitations: string };
  margins: Topic & { material: boolean; contradictionResolved: boolean };
  counter: Topic;
  proposed: { band: string; points: number; strongerEvidence: string; exceptionalJustification: string; durableSuperior: boolean } | null;
};

export function scoreEconomicQuality(
  assessment: EconomicQualityAssessment,
  sector: string,
  usable: (ref: string) => boolean,
) {
  const { attempts, returns, persistence, cost, margins, counter, proposed } = assessment;
  const established = (topic: Topic) =>
    topic.rationale.trim() && topic.required.length > 0 && topic.required.every(usable);
  const gaps: string[] = [];
  const routeOrder = ["A", "B", "C", "D"];
  const last = attempts.at(-1);
  if (!last ||
      !attempts.every((attempt, i) => attempt.route === routeOrder[i] && attempt.rationale.trim() &&
        attempt.status === (i === attempts.length - 1 && proposed ? "SUPPORTED" : "UNAVAILABLE")) ||
      (!proposed && attempts.length !== routeOrder.length)) gaps.push("RETURN_FALLBACK_REVIEW");
  const measureFitsRoute = last?.route === "A" ? ["ROIC", "ROE_ROTE"].includes(returns.measure)
    : last?.route === "B" ? ["ROE_ROTE", "SECTOR_EQUIVALENT"].includes(returns.measure)
    : last?.route === "C" ? returns.measure !== "COMBINED" : returns.measure === "COMBINED";
  const compatibleHurdle = returns.measure === "ROE_ROTE" ? sector === "BANK" && returns.hurdle === "COST_OF_EQUITY"
    : returns.measure === "ROIC" ? returns.hurdle === "WACC"
    : returns.measure === "COMBINED" ? returns.hurdle === (sector === "BANK" ? "COST_OF_EQUITY" : "WACC")
    : returns.hurdle === "SECTOR_EQUIVALENT";
  if (!established(returns) || !returns.comparable || !returns.leverageReviewed ||
      !returns.relativeToHurdleEstablished || !measureFitsRoute || !compatibleHurdle) gaps.push("RETURNS");
  if (!established(persistence) || !persistence.comparable || persistence.fiscalYears.length < 3 ||
      !persistence.fiscalYears.every((year, i, years) => Number.isInteger(year) && (!i || year === years[i - 1] + 1))) gaps.push("PERSISTENCE");
  if (!established(cost) || !Number.isFinite(cost.low) || !Number.isFinite(cost.high) ||
      cost.low <= 0 || cost.high < cost.low ||
      ![cost.method, cost.assumptions, cost.sensitivity, cost.limitations].every(value => value.trim())) gaps.push("COST_OF_CAPITAL");
  if (!margins.rationale.trim() || !margins.contradictionResolved ||
      ((margins.material || proposed?.points === rubric.max) && !established(margins))) gaps.push("MARGINS");
  if (!established(counter)) gaps.push("COUNTEREVIDENCE");
  if (proposed) {
    const band = rubric.bands.find(row => row.label === proposed.band);
    if (!band || !Number.isInteger(proposed.points) || proposed.points < band.min || proposed.points > band.max)
      gaps.push("INVALID_BAND");
    else if (band.min < band.max && proposed.points === band.max && !proposed.strongerEvidence.trim())
      gaps.push("UPPER_POINT_SUPPORT");
    if (proposed.points === rubric.max && (!proposed.durableSuperior || !proposed.exceptionalJustification.trim()))
      gaps.push("MAXIMUM_PREREQUISITES");
  }
  const points = gaps.length ? null : proposed?.points ?? null;
  return {
    rubricId: rubric.id, maxPoints: rubric.max, points, band: points === null ? null : proposed!.band,
    route: points === null ? "E" : last!.route, gaps, totalScore: null,
    productionEligible: false, publicationAuthorized: false,
  };
}
