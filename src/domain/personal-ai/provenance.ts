import { instant } from "@/shared/time";
import { RUBRICS, CATEGORY_MAXIMA, IMPLEMENTATION, VERSION, SECTORS } from "@/domain/scoring/methodology";
import { check, snapshot, text, unique } from "@/domain/scoring/validation";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { settlementCanonical } from "@/domain/portfolio/dividend-settlement";
import type { ScoreInput as LegacyScoreInput, Assessment as LegacyAssessment } from "@/domain/scoring/scorecard";
export const AI_SCORING_IMPLEMENTATION = "m64-clarification-1-ai-origin-v1";
export type AiHash = (value: unknown) => string;
export interface AiReviewPass {
  readonly kind: "PREPARATION" | "CHALLENGE"; readonly at: string;
  readonly actor: "CHATGPT"; readonly model: string; readonly sessionReference: string;
  readonly toolReferences: readonly string[]; readonly artifactReference: string; readonly artifactHash: string;
}
export interface AiReviewProvenance {
  readonly contract: "personal-ai-review-provenance-v1";
  readonly mode: "OWNER_AUTHORIZED_AI_SELF_REVIEW"; readonly independentHumanReviewClaimed: false;
  readonly ownerAuthorizationReference: string;
  readonly inputHash: string; readonly evidenceHash: string; readonly methodologyHash: string; readonly financialRulesHash: string;
  readonly assessmentHashes: readonly { readonly rubricId: string; readonly sha256: string }[];
  readonly passes: readonly [AiReviewPass, AiReviewPass];
}
export interface AiReviewInput extends Omit<LegacyScoreInput, "assessments"> {
  readonly contract: "personal-ai-score-input-v1";
  readonly assessments: readonly (Omit<LegacyAssessment, "source"> & { readonly source: "AI" })[];
  readonly review: AiReviewProvenance;
}
export function financialRulesHash(hash: AiHash) { return hash({ IMPLEMENTATION, VERSION, CATEGORY_MAXIMA, RUBRICS, SECTORS }); }
export function aiInputSemantic(input: Omit<AiReviewInput, "review"> & { readonly review?: AiReviewProvenance }) {
  const { review, id, calculatedAt, ...payload } = input; void review; void id; void calculatedAt; return payload;
}
function exact(value: object, fields: string) { check(!!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(" ") === fields.split(" ").sort().join(" "), "AI_REVIEW_EXACT_FIELDS"); }
const digest = (value: string) => check(typeof value === "string" && /^[a-f0-9]{64}$/.test(value), "AI_REVIEW_HASH_REQUIRED");
/** Structural/content verification only. External session/tool artifacts require trusted server bindings. */
export function validateAiScoringReview(input: AiReviewInput, hash: AiHash) {
  check(input.contract === "personal-ai-score-input-v1", "AI_SCORE_CONTRACT_REQUIRED");
  const r = input.review;
  exact(r, "contract mode independentHumanReviewClaimed ownerAuthorizationReference inputHash evidenceHash methodologyHash financialRulesHash assessmentHashes passes");
  check(r.contract === "personal-ai-review-provenance-v1" && r.mode === "OWNER_AUTHORIZED_AI_SELF_REVIEW" && r.independentHumanReviewClaimed === false, "AI_SELF_REVIEW_NOT_INDEPENDENT_HUMAN");
  text(r.ownerAuthorizationReference); [r.inputHash,r.evidenceHash,r.methodologyHash,r.financialRulesHash].forEach(digest);
  check(r.inputHash === hash(aiInputSemantic(input)) && r.evidenceHash === hash(input.evidence) && r.methodologyHash === hash(input.methodology) && r.financialRulesHash === financialRulesHash(hash), "AI_REVIEW_CONTENT_OR_RULES_MISMATCH");
  check(Array.isArray(r.assessmentHashes) && r.assessmentHashes.length === input.assessments.length && r.assessmentHashes.length <= RUBRICS.length, "AI_REVIEW_ASSESSMENT_MANIFEST");
  unique(r.assessmentHashes.map(a => a.rubricId));
  for (const a of input.assessments) {
    const pin = r.assessmentHashes.find(p => p.rubricId === a.subcategory);
    check(a.source === "AI" && a.analyst === "CHATGPT" && pin && pin.sha256 === hash(a), "AI_ASSESSMENT_PROVENANCE_MISMATCH");
  }
  for (const pin of r.assessmentHashes) { exact(pin, "rubricId sha256"); digest(pin.sha256); }
  check(Array.isArray(r.passes) && r.passes.length === 2 && r.passes[0].kind === "PREPARATION" && r.passes[1].kind === "CHALLENGE", "AI_TWO_PASS_REVIEW_REQUIRED");
  instant(input.knownAt); instant(input.calculatedAt);
  for (const p of r.passes) {
    exact(p, "kind at actor model sessionReference toolReferences artifactReference artifactHash"); instant(p.at);
    check(p.actor === "CHATGPT" && p.at <= input.knownAt && p.at <= input.calculatedAt, "AI_REVIEW_FUTURE_OR_ACTOR_MISMATCH");
    [p.model,p.sessionReference,p.artifactReference].forEach(text); digest(p.artifactHash);
    check(Array.isArray(p.toolReferences) && p.toolReferences.length > 0 && p.toolReferences.length <= 100, "AI_REVIEW_TOOL_REFERENCES_REQUIRED"); p.toolReferences.forEach(text); unique(p.toolReferences);
  }
  check(r.passes[0].at <= r.passes[1].at && r.passes[0].artifactReference !== r.passes[1].artifactReference && r.passes[0].artifactHash !== r.passes[1].artifactHash, "AI_DISTINCT_RECORDED_PASSES_REQUIRED");
  return deepFreeze(snapshot(r));
}
export interface AiPassArtifact {
  readonly contract: "personal-ai-pass-artifact-v1";
  readonly pass: AiReviewPass["kind"]; readonly at: string; readonly actor: "CHATGPT";
  readonly model: string; readonly sessionReference: string; readonly toolReferences: readonly string[];
  readonly inputHash: string; readonly evidenceHash: string; readonly methodologyHash: string; readonly financialRulesHash: string;
  readonly checks: readonly { readonly id: string; readonly expectedHash: string; readonly actualHash: string; readonly evidenceReferences: readonly string[] }[];
}
/** Checks are attestations tied to real retained artifacts, never authentication by caller-supplied labels. */
export function validateAiPassArtifact(value: AiPassArtifact, pass: AiReviewPass, review: AiReviewProvenance) {
  exact(value, "contract pass at actor model sessionReference toolReferences inputHash evidenceHash methodologyHash financialRulesHash checks");
  check(value.contract === "personal-ai-pass-artifact-v1" && value.pass === pass.kind && value.at === pass.at && value.actor === "CHATGPT" && value.model === pass.model && value.sessionReference === pass.sessionReference && settlementCanonical(value.toolReferences) === settlementCanonical(pass.toolReferences), "AI_SESSION_ARTIFACT_MISMATCH");
  for (const field of ["inputHash","evidenceHash","methodologyHash","financialRulesHash"] as const) check(value[field] === review[field], "AI_PASS_DATASET_BINDING_MISMATCH");
  check(Array.isArray(value.checks) && value.checks.length > 0 && value.checks.length <= 1000, "AI_PASS_EXPECTED_ACTUAL_REQUIRED");
  unique(value.checks.map(c => c.id));
  for (const c of value.checks) {
    exact(c, "id expectedHash actualHash evidenceReferences"); text(c.id); digest(c.expectedHash); digest(c.actualHash);
    check(c.expectedHash === c.actualHash && Array.isArray(c.evidenceReferences) && c.evidenceReferences.length > 0, "AI_PASS_CHECK_FAILED"); c.evidenceReferences.forEach(text);
  }
}
