import { readFile, lstat, realpath } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import type { AiAcceptanceReader, AiReviewVerifier } from "@/ports/personal-ai-scoring";
import { validateDIAcceptance, type DataInitializationAcceptance } from "@/domain/personal-ai/scoring-readiness";
import type { ScoreInput } from "@/domain/personal-ai/scorecard";
import { validateAiPassArtifact, validateAiScoringReview, type AiPassArtifact } from "@/domain/personal-ai/provenance";
import { snapshotHash } from "@/infrastructure/fundamentals/snapshot-hash";
import { check, snapshot, id, unique } from "@/domain/scoring/validation";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { exactReadinessFields } from "@/domain/fundamentals/scoring-bridge";
export interface AiArtifactPin { readonly reference: string; readonly path: string; readonly sha256: string }
export interface AiReviewTrustBinding {
  readonly reviewHash: string; readonly ownerAuthorizationReference: string;
  readonly passArtifacts: readonly [AiArtifactPin, AiArtifactPin];
  readonly toolArtifacts: readonly AiArtifactPin[];
}
export interface AiAcceptancePin extends AiArtifactPin { readonly id: string }
/** Trusted local immutable evidence bytes only. No network, DB writes or receipt generation. */
export async function pinnedAiBytes(root: string, pin: AiArtifactPin) {
  check(/^[a-f0-9]{64}$/.test(pin.sha256), "AI_PIN_HASH_REQUIRED");
  const base = await realpath(root), path = resolve(base, pin.path), rel = relative(base, path);
  check(rel.length > 0 && !rel.startsWith("..") && !isAbsolute(rel), "AI_PIN_PATH_ESCAPE");
  const stat = await lstat(path), target = await realpath(path), realRel = relative(base, target);
  check(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 16000000 && !realRel.startsWith("..") && !isAbsolute(realRel), "AI_PIN_FILE_REQUIRED");
  const bytes = await readFile(path);
  check(createHash("sha256").update(bytes).digest("hex") === pin.sha256, "AI_PIN_BYTES_MISMATCH");
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
}
export class PinnedAiReviewVerifier implements AiReviewVerifier {
  private readonly bindings: readonly AiReviewTrustBinding[];
  constructor(private readonly root: string, bindings: readonly AiReviewTrustBinding[] = []) {
    this.bindings = deepFreeze(snapshot(bindings)); unique(this.bindings.map(b => b.reviewHash));
  }
  async verify(input: ScoreInput) {
    const review = validateAiScoringReview(input, snapshotHash);
    const trusted = this.bindings.find(b => b.reviewHash === snapshotHash(review) && b.ownerAuthorizationReference === review.ownerAuthorizationReference);
    check(trusted, "TRUSTED_AI_REVIEW_BINDING_REQUIRED");
    check(Array.isArray(trusted.toolArtifacts) && trusted.toolArtifacts.length > 0, "TRUSTED_AI_TOOL_EVIDENCE_REQUIRED");
    unique(trusted.toolArtifacts.map(p => p.reference));
    for (const [index, pass] of review.passes.entries()) {
      const pin = trusted.passArtifacts[index];
      check(pin.reference === pass.artifactReference && pin.sha256 === pass.artifactHash, "AI_TRUSTED_PASS_BINDING_MISMATCH");
      const artifact = await pinnedAiBytes(this.root, pin) as AiPassArtifact;
      validateAiPassArtifact(artifact, pass, review);
      for (const reference of new Set([...pass.toolReferences, ...artifact.checks.flatMap(c => c.evidenceReferences)])) {
        const evidence = trusted.toolArtifacts.find(p => p.reference === reference);
        check(evidence, "AI_PASS_TOOL_EVIDENCE_BINDING_REQUIRED");
        await pinnedAiBytes(this.root, evidence);
      }
    }
  }
}
export class PinnedAiAcceptanceReader implements AiAcceptanceReader {
  private readonly pins: readonly AiAcceptancePin[];
  constructor(private readonly root: string, pins: readonly AiAcceptancePin[] = []) {
    this.pins = deepFreeze(snapshot(pins)); unique(this.pins.map(p => p.id));
  }
  async read(key: string) {
    id(key); const pin = this.pins.find(p => p.id === key); check(pin, "TRUSTED_AI_ACCEPTANCE_PIN_REQUIRED");
    const a = validateDIAcceptance(await pinnedAiBytes(this.root, pin) as DataInitializationAcceptance);
    check(a.id === key && a.reviewArtifactReference === pin.reference, "AI_ACCEPTANCE_RECORD_IDENTITY_MISMATCH");
    // This exact field set prevents caller acceptance booleans or legacy independent-review claims.
    exactReadinessFields(a, "contract reviewMode independentHumanReviewClaimed id snapshotRunId contentHash manifestDigest requirements requirementsHash scoringMethodologyHash universeHash acceptedAt producerReference reviewerReference reviewArtifactReference approvalReference methodologyId gates issues tickers");
    return a;
  }
}
