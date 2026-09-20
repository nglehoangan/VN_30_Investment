import { createHash } from "node:crypto";
import type { PrismaClient } from "@/infrastructure/db/generated/client";
import type { DecisionArtifacts } from "@/ports/decision";
import { decide, type Decision } from "@/domain/decision/engine";
import { identifier, requireDecision } from "@/domain/decision/validation";
import { ConflictError, DataIntegrityError } from "@/shared/errors";
const hash = (body: string) => createHash("sha256").update(body).digest("hex");
export class PrismaDecisionArtifacts implements DecisionArtifacts {
  constructor(private readonly client: PrismaClient) {}
  async append(decision: Decision) {
    const validated = decide(decision.input);
    requireDecision(JSON.stringify(decision) === JSON.stringify(validated), "DECISION_REVALIDATION_FAILED");
    if (await this.client.decisionArtifact.findUnique({ where: { id: decision.id } })) throw new ConflictError();
    if (decision.priorDecisionId !== null) {
      const prior = await this.find(decision.priorDecisionId);
      requireDecision(prior && prior.securityId === decision.securityId && prior.scope === decision.scope && prior.asOf <= decision.asOf && prior.recordedAt <= decision.knownAt, "PRIOR_DECISION_LINEAGE_MISMATCH");
    }
    const body = JSON.stringify(validated);
    try {
      await this.client.decisionArtifact.create({ data: { id: decision.id, securityId: decision.securityId, methodologyId: decision.input.methods.decision.methodologyId,
        asOf: decision.asOf, recordedAt: decision.recordedAt, priorDecisionId: decision.priorDecisionId, body, bodyHash: hash(body) } });
    } catch (error) { if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new ConflictError(); throw new DataIntegrityError({ cause: error }); }
  }
  async find(id: string): Promise<Decision | null> {
    identifier(id); const row = await this.client.decisionArtifact.findUnique({ where: { id } }); if (!row) return null;
    try {
      requireDecision(hash(row.body) === row.bodyHash, "DECISION_CHECKSUM_MISMATCH");
      const stored = JSON.parse(row.body) as Decision;
      requireDecision(stored.id === row.id && stored.securityId === row.securityId && stored.asOf === row.asOf && stored.recordedAt === row.recordedAt && stored.priorDecisionId === row.priorDecisionId && stored.input.methods.decision.methodologyId === row.methodologyId, "DECISION_METADATA_MISMATCH");
      const replay = decide(stored.input);
      requireDecision(JSON.stringify(replay) === row.body, "DECISION_REPLAY_MISMATCH");
      return replay;
    } catch (error) { throw new DataIntegrityError({ cause: error }); }
  }
}
