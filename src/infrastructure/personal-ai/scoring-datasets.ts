import type { PrismaClient } from "@/infrastructure/db/generated/client";
import type { FundamentalRepository, FundamentalDerivationRepository, FundamentalSnapshotRepository } from "@/ports/fundamentals";
import type { RegistryRelease } from "@/domain/fundamentals/contracts";
import type { AvailabilityAssessment } from "@/domain/fundamentals/availability";
import type { AiAcceptanceReader, AiReviewVerifier, AiScoreArtifactStore, AiScoringDatasets, AiDatasetSelection, AiDatasetBinding } from "@/ports/personal-ai-scoring";
import { validateDIAcceptance, bindDIAcceptance, evaluateScoringReadiness, scoringInputSemantic } from "@/domain/personal-ai/scoring-readiness";
import { calculateScorecard, type ScoreInput, type Scorecard } from "@/domain/personal-ai/scorecard";
import { canonicalJson } from "@/domain/fundamentals/snapshot";
import { snapshotHash, manifestDigest } from "@/infrastructure/fundamentals/snapshot-hash";
import { PrismaMethodologyRegistry } from "@/infrastructure/repositories/methodology-registry";
import { methodologyId } from "@/shared/ids";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { check, snapshot, id } from "@/domain/scoring/validation";

/** Versioned AI acceptance path. Native financial eligibility is unchanged; no independent-human claim. */
export class PersonalAiScoringDatasets implements AiScoringDatasets {
  constructor(private readonly client: PrismaClient, private readonly snapshots: FundamentalSnapshotRepository,
    private readonly facts: FundamentalRepository, private readonly derivations: FundamentalDerivationRepository,
    private readonly registry: RegistryRelease, private readonly acceptances: AiAcceptanceReader,
    private readonly reviews: AiReviewVerifier, private readonly artifacts: AiScoreArtifactStore) {}
  private async accepted(key: string) {
    const a = validateDIAcceptance(await this.acceptances.read(key)), methods = new PrismaMethodologyRegistry(this.client);
    const method = await methods.findById(methodologyId(a.methodologyId)), policy = await methods.findById(methodologyId(a.requirements.methodologyId));
    check(method && method.governanceStatus === "APPROVED" && method.intendedUse === "PRODUCTION" && method.approvalReference === a.approvalReference && method.configurationReference === "personal-ai-di-acceptance-sha256:" + snapshotHash(a) && method.recordedAt <= a.acceptedAt && method.effectiveDate <= a.acceptedAt.slice(0,10), "AI_ACCEPTANCE_METHODOLOGY_BINDING_REQUIRED");
    const p = a.requirements;
    check(policy && policy.governanceStatus === "APPROVED" && policy.intendedUse === "PRODUCTION" && policy.approvalReference === p.approvalReference && policy.configurationReference === "readiness-requirements-sha256:" + snapshotHash(p) && policy.recordedAt <= p.recordedAt && policy.effectiveDate <= p.effectiveDate, "READINESS_EXTERNAL_REQUIREMENTS_BINDING");
    check(p.sectors.every(r => r.requiredItems.every(item => this.registry.manifest.items.some(i => i.itemId === item && i.status === "ACTIVE" && i.sectorApplicability.includes(r.sector)))), "READINESS_APPROVED_CANONICAL_ITEM_ROUTE");
    const s = await this.snapshots.findRun(a.snapshotRunId); check(s, "SEALED_DI_SNAPSHOT_REQUIRED");
    bindDIAcceptance(a, s, snapshotHash, manifestDigest);
    check(this.registry.registryHash === JSON.parse(s.manifest).registry.registryHash, "READINESS_CANONICAL_REGISTRY_BINDING");
    for (const t of a.tickers) if (t.input) { check(t.input.calculatedAt >= a.acceptedAt, "AI_ACCEPTANCE_INPUT_TIME_MISMATCH"); await this.reviews.verify(t.input); }
    return { a, s };
  }
  private async sources(s: NonNullable<Awaited<ReturnType<FundamentalSnapshotRepository["findRun"]>>>) {
    const observations = await Promise.all(s.members.map(async m => { const o = await this.facts.findObservation(m.observationId); check(o && snapshotHash(o) === m.observationHash, "READINESS_OBSERVATION_INTEGRITY"); return o; }));
    const assessments = await Promise.all(s.members.map(async m => {
      const row = await this.client.fundamentalAvailabilityAssessment.findUniqueOrThrow({ where: { id: m.assessmentId } });
      const a = JSON.parse(row.body) as AvailabilityAssessment;
      check(snapshotHash(a) === row.bodyHash && a.id === m.assessmentId && a.observationId === m.observationId, "READINESS_ASSESSMENT_INTEGRITY"); return a;
    }));
    const derived = await Promise.all(s.derivedIds.map(async key => { const d = await this.derivations.find(key); check(d, "READINESS_DERIVATION_INTEGRITY"); return d; }));
    return { registry: this.registry, observations, assessments, derived };
  }
  async readiness(key: string) { const { a, s } = await this.accepted(key); return evaluateScoringReadiness(a, s, await this.sources(s), snapshotHash); }
  async authorize(raw: ScoreInput, rawSelection: AiDatasetSelection): Promise<AiDatasetBinding> {
    const input = snapshot(raw), selection = snapshot(rawSelection); id(selection.snapshotRunId); id(selection.acceptanceId);
    check(Object.keys(selection).sort().join(" ") === "acceptanceId snapshotRunId" && input.artifactScope === "FORMAL", "AI_FORMAL_DATASET_SELECTION_REQUIRED");
    const { a, s } = await this.accepted(selection.acceptanceId);
    check(selection.snapshotRunId === a.snapshotRunId && a.acceptedAt <= input.calculatedAt, "DI_RUN_OR_ACCEPTANCE_TIME_MISMATCH");
    const reviewed = a.tickers.find(t => t.securityId === input.securityId)?.input;
    check(reviewed && canonicalJson(scoringInputSemantic(input)) === canonicalJson(scoringInputSemantic(reviewed)), "REVIEWED_SCORING_INPUT_REQUIRED");
    await this.reviews.verify(input);
    const method = await new PrismaMethodologyRegistry(this.client).findById(input.methodology.methodologyId);
    check(method && canonicalJson(method) === canonicalJson(input.methodology), "REGISTERED_SCORING_METHOD_REQUIRED");
    const readiness = evaluateScoringReadiness(a, s, await this.sources(s), snapshotHash);
    check(readiness.find(t => t.securityId === input.securityId)?.readyForScoring, "TICKER_NOT_READY_FOR_SCORING");
    return deepFreeze({ contract: "personal-ai-scoring-dataset-binding-v1", selection, acceptanceHash: snapshotHash(a), inputHash: snapshotHash(input), reviewHash: snapshotHash(input.review), requirementsHash: a.requirementsHash, readiness });
  }
  async append(card: Scorecard, binding: AiDatasetBinding) {
    check(Object.isFrozen(card) && canonicalJson(calculateScorecard(card.input, snapshotHash)) === canonicalJson(card), "AI_SCORING_DOMAIN_REPLAY_REQUIRED");
    const verified = await this.authorize(card.input, binding.selection);
    check(canonicalJson(verified) === canonicalJson(binding), "AI_AUTHORIZATION_REPLAY_REQUIRED");
    await this.artifacts.append(deepFreeze({ contract: "personal-ai-score-artifact-v1", card, binding: verified }));
  }
  async find(key: string) {
    const record = await this.artifacts.find(key); if (!record) return null;
    check(canonicalJson(calculateScorecard(record.card.input, snapshotHash)) === canonicalJson(record.card), "AI_SCORING_DOMAIN_REPLAY_REQUIRED");
    const current = await this.authorize(record.card.input, record.binding.selection);
    check(canonicalJson(current) === canonicalJson(record.binding), "AI_DATASET_BINDING_REPLAY_REQUIRED"); return record;
  }
}
