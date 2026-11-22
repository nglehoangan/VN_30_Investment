import { RUBRICS } from "@/domain/scoring/methodology";
import { check, keys, list, snapshot, text, unique } from "@/domain/scoring/validation";
import { calculateScorecard, type ScoreInput } from "./scorecard";
import { coverageOf } from "./limited-coverage";
import type { AiHash } from "./provenance";

export interface ConservativeAssessment {
  readonly rubricId: string;
  readonly band: string;
  readonly rationale: string;
  readonly evidenceRefs: readonly string[];
  readonly counterEvidenceRefs: readonly string[];
  readonly counterEvidenceReview: string;
}

export type EbcsStatus = "OFFICIAL_COMPLETE" | "OFFICIAL_LIMITED" | "RESEARCH_ONLY";

interface RubricEvaluation {
  readonly rubricId: string;
  readonly state: "VERIFIED" | "CONSERVATIVE" | "NOT_RATED";
  readonly points: number | null;
  readonly maxPoints: number;
  readonly conservativeAssessment: ConservativeAssessment | null;
}

/** Research preview. Official calculation and persistence have no dependency on this module. */
export function previewEvidenceBasedScore(
  input: ScoreInput,
  conservativeAssessments: readonly ConservativeAssessment[],
  hash: AiHash,
) {
  const claims = snapshot(conservativeAssessments);
  list(claims, RUBRICS.length);
  for (const claim of claims) {
    keys(claim, "rubricId band rationale evidenceRefs counterEvidenceRefs counterEvidenceReview");
    check(RUBRICS.some(row => row.id === claim.rubricId), "EBCS_UNKNOWN_RUBRIC");
    text(claim.rationale);
    text(claim.counterEvidenceReview);
    list(claim.evidenceRefs);
    list(claim.counterEvidenceRefs);
    check(claim.evidenceRefs.length > 0, "EBCS_SUPPORT_REQUIRED");
    unique([...claim.evidenceRefs, ...claim.counterEvidenceRefs]);
  }
  unique(claims.map(claim => claim.rubricId));

  const card = calculateScorecard(input, hash);
  const rubrics: RubricEvaluation[] = card.subcategories.map(row => {
    const base = { rubricId: row.id, maxPoints: row.max };
    const claim = claims.find(item => item.rubricId === row.id);
    if (!claim) {
      return {
        ...base, state: row.points === null ? "NOT_RATED" : "VERIFIED",
        points: row.points, conservativeAssessment: null,
      };
    }

    const rubric = RUBRICS.find(item => item.id === row.id);
    const band = rubric?.bands.find(item => item.label === claim.band);
    const assessment = row.assessment;
    check(assessment && band && row.points === band.min && assessment.assessment === band.label,
      "EBCS_LOWEST_SUPPORTED_BAND_REQUIRED");
    const refs = assessment.evidence.flatMap(topic => topic.refs);
    check(claim.evidenceRefs.every(ref => refs.includes(ref)) &&
      claim.counterEvidenceRefs.every(ref => assessment.disconfirmingEvidence.includes(ref)) &&
      assessment.disconfirmingEvidence.every(ref => claim.counterEvidenceRefs.includes(ref)),
    "EBCS_EVIDENCE_MUST_MATCH_REVIEWED_RUBRIC");
    return { ...base, state: "CONSERVATIVE", points: row.points, conservativeAssessment: claim };
  });

  return {
    contract: "ebcs-research-preview-v1" as const,
    status: "RESEARCH_ONLY" as const satisfies EbcsStatus,
    fullOfficialScore: null,
    eligibleForRanking: false,
    allocationAuthorized: false,
    ticker: card.ticker,
    cutoff: card.input.currentPurpose.economicCutoff,
    methodology: card.methodology,
    methodologyHash: hash(card.methodology),
    financialRulesHash: card.input.review.financialRulesHash,
    inputHash: hash(card.input),
    conservativeAssessmentsHash: hash(claims),
    ...coverageOf(card.subcategories),
    conservativeRubrics: rubrics.filter(row => row.state === "CONSERVATIVE").map(row => row.rubricId),
    missingEvidence: card.missingEvidence,
    blockingEvidence: card.blockingEvidence,
    rubrics,
  };
}
