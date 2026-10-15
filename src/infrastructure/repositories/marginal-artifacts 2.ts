import { createHash } from "node:crypto";
import type { PrismaClient } from "@/infrastructure/db/generated/client";
import type { MarginalArtifacts } from "@/ports/marginal";
import { assessMarginalAllocation, type MarginalAllocation } from "@/domain/decision/marginal";
import { identifier, requireDecision } from "@/domain/decision/validation";
import { PrismaDecisionArtifacts } from "./decision-artifacts";
import { DataIntegrityError } from "@/shared/errors";
const hash = (body: string) => createHash("sha256").update(body).digest("hex");
export class PrismaMarginalArtifacts implements MarginalArtifacts {
  constructor(private readonly client: PrismaClient) {}
  async currentCandidates(snapshotId: string, cutoff: string) {
    // Check body integrity before embedded scope/snapshot predicates can hide it.
    const inventory = await this.client.marginalAllocation.findMany({ select: { body: true, bodyHash: true } });
    if (inventory.some(row => hash(row.body) !== row.bodyHash)) throw new DataIntegrityError();
    const rows = await this.client.$queryRawUnsafe<{ id: string }[]>(
      "SELECT id FROM marginal_allocation WHERE json_extract(body, '$.baseSnapshotId') = ? AND json_extract(body, '$.scope') = 'FORMAL' AND json_extract(body, '$.command.evidenceCutoff') <= ? AND json_extract(body, '$.recordedAt') <= ? ORDER BY id LIMIT 2",
      snapshotId, cutoff, cutoff);
    return rows.map(row => row.id);
  }
  async substitutionHistory(portfolioId: string, scope: string, cutoff: string) {
    const rows = await this.client.marginalAllocation.findMany();
    return rows.flatMap(row => {
      requireDecision(hash(row.body) === row.bodyHash, "MARGINAL_HASH_MISMATCH");
      const a = JSON.parse(row.body) as MarginalAllocation;
      return a.scope === scope && a.recordedAt <= cutoff && a.finalProjection.context.integrity.portfolioId === portfolioId && a.steps.some(s => s.substitution) ? [a.id] : [];
    }).sort();
  }
  private async replay(a: MarginalAllocation) {
    const decisions = new PrismaDecisionArtifacts(this.client), bases = [];
    for (const id of a.command.baseDecisionIds) { const d = await decisions.find(id); requireDecision(d, "PERSISTED_MARGINAL_BASE_REQUIRED"); bases.push(d); }
    const replay = assessMarginalAllocation(a.command, bases, a.recordedAt);
    requireDecision(JSON.stringify(replay) === JSON.stringify(a), "MARGINAL_REPLAY_MISMATCH"); return replay;
  }
  async append(a: MarginalAllocation) {
    const replay = await this.replay(a), body = JSON.stringify(replay);
    try { await this.client.$transaction(async tx => {
      const history = await new PrismaMarginalArtifacts(tx as PrismaClient).substitutionHistory(a.finalProjection.context.integrity.portfolioId, a.scope, a.command.evidenceCutoff);
      for (const frame of a.command.frames) for (const e of frame.substitutionEvidence ?? []) requireDecision(JSON.stringify(e.historyIds.filter(id => !id.startsWith(`${a.id}:step:`)).sort()) === JSON.stringify(history), "COMPLETE_SUBSTITUTION_HISTORY_REQUIRED");
      await tx.marginalAllocation.create({ data: { id: a.id, body, bodyHash: hash(body) } });
    }); }
    catch (error) { throw new DataIntegrityError({ cause: error }); }
  }
  async find(id: string) {
    identifier(id); const row = await this.client.marginalAllocation.findUnique({ where: { id } }); if (!row) return null;
    try { requireDecision(hash(row.body) === row.bodyHash, "MARGINAL_HASH_MISMATCH"); const a = JSON.parse(row.body) as MarginalAllocation; requireDecision(a.id === row.id, "MARGINAL_ID_MISMATCH"); return await this.replay(a); }
    catch (error) { throw new DataIntegrityError({ cause: error }); }
  }
}
