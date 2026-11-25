import { RUBRICS } from "@/domain/scoring/methodology";

export const ACB_LIMITED_METHOD = "current-scoring-acb-official-limited-v3";
export const ACB_UNRATED_RUBRICS = [
  "BQ-MOAT", "FH-LIQ", "FH-STRESS", "GQ-FWD", "IC-POS", "VAL-PRIMARY", "RG-GOV", "RG-RISK", "CA-REINV",
] as const;
const reasons: Record<typeof ACB_UNRATED_RUBRICS[number], string> = {
  "BQ-MOAT": "Customer retention and durable cost advantage are unresolved.",
  "FH-LIQ": "Available Q3 funding and representative rollover are unresolved.",
  "FH-STRESS": "Funding availability and combined capital outcomes under stress are unresolved.",
  "GQ-FWD": "A consistent growth, margin, credit-cost and capital bridge is unresolved.",
  "IC-POS": "Comparable market share and distribution evidence are insufficient to select a band.",
  "VAL-PRIMARY": "Normalized ROE and cost of equity do not support selecting a single representative valuation band.",
  "RG-GOV": "Transaction-specific conflict handling and price oversight remain unresolved.",
  "RG-RISK": "Exposure, terms, and control effectiveness do not support a residual risk class.",
  "CA-REINV": "Comparable subsidiary earnings and timing of productive deployment are unresolved.",
};

const originalUnratedRubrics = new Set<string>(["FH-LIQ", "FH-STRESS", "RG-GOV", "RG-RISK"]);

export const ACB_LIMITED_DISPOSITIONS = ACB_UNRATED_RUBRICS.map(rubricId => ({
  rubricId, state: "NOT_RATED" as const, points: null,
  maxPoints: RUBRICS.find(rubric => rubric.id === rubricId)!.max,
  reason: reasons[rubricId],
  evidenceFile: originalUnratedRubrics.has(rubricId)
    ? "docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/assessment/ACB_CIO_LIMITED_COVERAGE_DISPOSITION.md"
    : "docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/assessment/ACB_LIMITED_COVERAGE_SCOPE_DECISION_PROPOSAL.md",
}));

export const FPT_LIMITED_METHOD = "current-scoring-fpt-official-limited-v1";
export const FPT_RATED_RUBRICS: readonly string[] = ["BQ-MOAT", "IC-IND"];
export const FPT_UNRATED_RUBRICS = RUBRICS.filter(rubric => !FPT_RATED_RUBRICS.includes(rubric.id)).map(rubric => rubric.id);
export const FPT_LIMITED_DISPOSITIONS = RUBRICS.filter(rubric => FPT_UNRATED_RUBRICS.includes(rubric.id)).map(rubric => ({
  rubricId: rubric.id, state: "NOT_RATED" as const, points: null, maxPoints: rubric.max,
  reason: "Excluded from the exact FPT limited scope pending evidence and formal assessment.",
  evidenceFile: "docs/fundamental-data-engine/fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/admission-rehearsal/FPT_LIMITED_EXACT_SCOPE.md",
}));

export function coverageOf(rows: readonly {id: string; max: number; points: number | null}[]) {
  const unrated = rows.filter(row => row.points === null);
  const confirmedScore = rows.reduce((sum, row) => row.points === null ? sum : sum + row.points, 0);
  const totalMaxPoints = rows.reduce((sum, row) => sum + row.max, 0);
  const unratedMaxPoints = unrated.reduce((sum, row) => sum + row.max, 0);
  const ratedMaxPoints = totalMaxPoints - unratedMaxPoints;
  return {
    confirmedScore, ratedMaxPoints, unratedMaxPoints, totalMaxPoints,
    ratedRubricCount: rows.length - unrated.length, totalRubricCount: rows.length,
    coverageRatio: ratedMaxPoints / totalMaxPoints,
    scoreLowerBound: confirmedScore, scoreUpperBound: confirmedScore + unratedMaxPoints,
    unratedRubrics: unrated.map(row => row.id),
  };
}

export type OfficialLimitedCoverage = ReturnType<typeof coverageOf> & {
  readonly status: "OFFICIAL_LIMITED";
  readonly fullOfficialScore: null;
  readonly eligibleForRanking: false;
  readonly allocationAuthorized: false;
  readonly dispositions: typeof ACB_LIMITED_DISPOSITIONS | typeof FPT_LIMITED_DISPOSITIONS;
};
