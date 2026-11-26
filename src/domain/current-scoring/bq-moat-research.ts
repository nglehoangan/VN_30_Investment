import { RUBRICS } from "@/domain/scoring/methodology";

export const BQ_MOAT_RESEARCH = "bq-moat-evidence-sufficiency-research-v1.0.0";
const rubric = RUBRICS.find(row => row.id === "BQ-MOAT")!;

type Observation = {
  refs: readonly string[];
  rationale: string;
};
type Mechanism = {
  id: string;
  advantage: Observation & {
    kind: "OBSERVED_MECHANISM" | "OBSERVED_DISADVANTAGE" | "MANAGEMENT_NARRATIVE" | "FINANCIAL_ONLY";
  };
  behavior: Observation & {
    kind: "CUSTOMER_BEHAVIOR" | "DELIVERY_OUTCOME" | "PRICING_EFFICIENCY" | "SECTOR_EQUIVALENT" | "FINANCIAL_ONLY";
  };
  proxy: { interpretation: string; limitation: string } | null;
};
export type MoatAssessment = {
  mechanisms: readonly Mechanism[];
  persistence: Observation & {
    strength: "UNCERTAIN" | "OBSERVED" | "DEMONSTRATED_MULTI_YEAR";
    durableMechanisms: readonly (Observation & { id: string })[];
  };
  counter: Observation & { materialContradictionResolved: boolean };
  proposed: { band: string; points: number; maximumPrerequisitesMet: boolean; exceptionalJustification: string } | null;
};

export function scoreCompetitiveAdvantage(assessment: MoatAssessment, usable: (ref: string) => boolean) {
  const { mechanisms, persistence, counter, proposed } = assessment;
  const gaps: string[] = [];
  const documented = (item: Observation) =>
    item.rationale.trim() && item.refs.length > 0 && item.refs.every(usable);
  const behaviorKinds = ["CUSTOMER_BEHAVIOR", "DELIVERY_OUTCOME", "PRICING_EFFICIENCY", "SECTOR_EQUIVALENT"];
  if (!mechanisms.length || new Set(mechanisms.map(row => row.id)).size !== mechanisms.length ||
      !mechanisms.every(row => row.id.trim() && documented(row.advantage) &&
        ["OBSERVED_MECHANISM", "OBSERVED_DISADVANTAGE"].includes(row.advantage.kind))) gaps.push("ADVANTAGE");
  if (!mechanisms.length || !mechanisms.every(row => documented(row.behavior) &&
      behaviorKinds.includes(row.behavior.kind) &&
      (!row.proxy || (row.proxy.interpretation.trim() && row.proxy.limitation.trim())))) gaps.push("ECONOMIC_BEHAVIOR");
  if (!documented(counter) || !counter.materialContradictionResolved) gaps.push("COUNTEREVIDENCE");
  if (proposed) {
    const { points, band } = proposed;
    if (!rubric.bands.some(row => row.label === band && row.min === points)) gaps.push("INVALID_BAND");
    if (points === 0 && !mechanisms.some(row => row.advantage.kind === "OBSERVED_DISADVANTAGE"))
      gaps.push("DISADVANTAGE_EVIDENCE_REQUIRED");
    if (points >= 3 && !mechanisms.some(row => row.advantage.kind === "OBSERVED_MECHANISM"))
      gaps.push("POSITIVE_MECHANISM_REQUIRED");
    const persistenceDocumented = persistence.rationale.trim() && persistence.refs.every(usable);
    const durable = new Set(persistence.durableMechanisms.map(row => row.id));
    if (!persistenceDocumented || (points >= 4 && (!documented(persistence) ||
        !["OBSERVED", "DEMONSTRATED_MULTI_YEAR"].includes(persistence.strength))) ||
        (points >= 5 && (persistence.strength !== "DEMONSTRATED_MULTI_YEAR" || !durable.size ||
          persistence.durableMechanisms.some(proof => !documented(proof) || !mechanisms.some(row => row.id === proof.id && row.advantage.kind === "OBSERVED_MECHANISM"))))) gaps.push("PERSISTENCE");
    if (points === rubric.max && (durable.size < 2 || !proposed.maximumPrerequisitesMet ||
        !proposed.exceptionalJustification.trim())) gaps.push("MAXIMUM_PREREQUISITES");
  }
  const points = gaps.length ? null : proposed?.points ?? null;
  return { rubricId: rubric.id, points, band: points === null ? null : proposed!.band, maxPoints: rubric.max, gaps };
}
