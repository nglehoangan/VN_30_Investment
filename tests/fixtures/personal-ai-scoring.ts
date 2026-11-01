import { snapshotHash, manifestDigest } from "@/infrastructure/fundamentals/snapshot-hash";
import { AI_SCORING_IMPLEMENTATION, aiInputSemantic, financialRulesHash, type AiPassArtifact, type AiReviewProvenance } from "@/domain/personal-ai/provenance";
import type { ScoreInput } from "@/domain/personal-ai/scorecard";
import type { ScoreInput as HumanInput } from "@/domain/scoring/scorecard";
import type { DataInitializationAcceptance } from "@/domain/personal-ai/scoring-readiness";
import type { ScoringBridgePlan } from "@/domain/personal-ai/scoring-bridge";
import { canonicalJson } from "@/domain/fundamentals/snapshot";
import { scoringReadinessFixture } from "./scoring-readiness";
/** Synthetic test identities, not records of actual ChatGPT sessions or production approval. */
export function reviewedAiInput(legacy: HumanInput) {
  const body = { ...legacy, contract: "personal-ai-score-input-v1" as const,
    methodology: { ...legacy.methodology, methodologyId: "synthetic-personal-ai-score" as typeof legacy.methodology.methodologyId, implementationIdentity: AI_SCORING_IMPLEMENTATION },
    assessments: legacy.assessments.map(a => ({ ...a, source: "AI" as const, analyst: "CHATGPT" as const })) };
  return signAiInput(body);
}
export function signAiInput(input: Omit<ScoreInput, "review"> & { readonly review?: AiReviewProvenance }) {
  const inputHash = snapshotHash(aiInputSemantic(input)), evidenceHash = snapshotHash(input.evidence), methodologyHash = snapshotHash(input.methodology), rulesHash = financialRulesHash(snapshotHash);
  const artifacts: AiPassArtifact[] = ["PREPARATION", "CHALLENGE"].map(kind => ({ contract: "personal-ai-pass-artifact-v1", pass: kind as AiPassArtifact["pass"], at: input.knownAt, actor: "CHATGPT", model: "SYNTHETIC_MODEL_NOT_REAL_SESSION", sessionReference: "SYNTHETIC_SAME_SESSION_ALLOWED", toolReferences: ["SYNTHETIC_TOOL_LOG_NOT_REAL_PROVENANCE"], inputHash, evidenceHash, methodologyHash, financialRulesHash: rulesHash,
    checks: [{ id: "synthetic-source-formula-check", expectedHash: inputHash, actualHash: inputHash, evidenceReferences: ["SYNTHETIC_TOOL_LOG_NOT_REAL_PROVENANCE"] }] }));
  const review: AiReviewProvenance = { contract: "personal-ai-review-provenance-v1", mode: "OWNER_AUTHORIZED_AI_SELF_REVIEW", independentHumanReviewClaimed: false, ownerAuthorizationReference: "SYNTHETIC_OWNER_APPROVAL_NOT_REAL",
    inputHash, evidenceHash, methodologyHash, financialRulesHash: rulesHash, assessmentHashes: input.assessments.map(a => ({ rubricId: a.subcategory, sha256: snapshotHash(a) })),
    passes: artifacts.map((a,index) => ({ kind: a.pass, at: a.at, actor: a.actor, model: a.model, sessionReference: a.sessionReference, toolReferences: a.toolReferences, artifactReference: `SYNTHETIC_PASS_${index}`, artifactHash: manifestDigest(canonicalJson(a)) })) as unknown as AiReviewProvenance["passes"] };
  return { input: { ...input, review } as ScoreInput, artifacts };
}
export function personalAiDatasetFixture() {
  const f = scoringReadinessFixture(), ai = reviewedAiInput(f.input);
  const plan: ScoringBridgePlan = { ...f.plan, external: f.plan.external.map(p => ({ ...p, kind: p.kind === "HUMAN" ? "AI_REVIEW" : p.kind })) };
  const acceptance: DataInitializationAcceptance = { ...f.acceptance, id: "synthetic-personal-ai-acceptance", contract: "personal-ai-di-acceptance-v1", reviewMode: "OWNER_AUTHORIZED_AI_SELF_REVIEW", independentHumanReviewClaimed: false,
    methodologyId: "synthetic-personal-ai-di", scoringMethodologyHash: snapshotHash(ai.input.methodology), producerReference: "CHATGPT", reviewerReference: "CHATGPT", reviewArtifactReference: "SYNTHETIC_AI_ACCEPTANCE_ARTIFACT",
    tickers: f.acceptance.tickers.map(t => ({ ...t, input: t.input ? ai.input : null, bridge: t.bridge ? plan : null })) };
  return { ...f, input: ai.input, artifacts: ai.artifacts, plan, acceptance };
}
