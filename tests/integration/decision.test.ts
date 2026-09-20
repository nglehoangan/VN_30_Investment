import { describe, it, expect } from "vitest";
import { testDatabase } from "../fixtures/database";
import { decisionFixture, mutableDecision } from "../fixtures/decision";
import { decide } from "@/domain/decision/engine";
import { PrismaDecisionArtifacts } from "@/infrastructure/repositories/decision-artifacts";
import { PrismaAnalyticalArtifacts } from "@/infrastructure/repositories/analytical-artifacts";
import { DecisionEngine, type DecisionCommand } from "@/application/decision/engine";
import { instant } from "@/shared/time";
import { methodologyId } from "@/shared/ids";

describe("M6.5 immutable persisted decisions", () => {
  it("append/read, duplicate rejection, prior/snapshot/score/method/evidence lineage, later artifacts cannot rewrite history", async () => {
    const db = await testDatabase();
    try {
      const i = decisionFixture(); await db.registry.append(i.methods.decision);
      const repository = new PrismaDecisionArtifacts(db.client);
      const d = decide(i); await repository.append(d);
      expect(await repository.find(d.id)).toEqual(d);
      await expect(repository.append(d)).rejects.toThrow();
      const changed = mutableDecision(); changed.id = "decision-2"; changed.priorDecisionId = d.id; changed.revisionReason = "New methodology and updated underwriting";
      changed.portfolio.integrity.snapshotId = "snapshot-2"; changed.portfolio.integrity.ledgerWatermark = "2";
      changed.scorecard.id = "score-revision-2"; changed.scorecard.input.id = "score-revision-2";
      changed.scorecard.input.priorScorecardId = i.scorecard.id;
      changed.methods.decision = { ...changed.methods.decision, methodologyId: methodologyId("synthetic-m65-revision") };
      await db.registry.append(changed.methods.decision);
      changed.evidence[0].summary = "Updated synthetic assessment";
      changed.assessment.opportunity.cash = "BETTER";
      const next = decide(changed); await repository.append(next);
      expect(await repository.find(next.id)).toEqual(next);
      expect(await repository.find(d.id)).toEqual(d);
      expect(next.lineage).toMatchObject({ priorDecisionId: d.id, snapshotId: "snapshot-2", ledgerWatermark: "2", scorecardId: "score-revision-2" });
      await expect(db.client.decisionArtifact.update({ where: { id: d.id }, data: { body: "{}" } })).rejects.toThrow();
      await expect(db.client.decisionArtifact.delete({ where: { id: d.id } })).rejects.toThrow();
      await expect(db.client.$executeRawUnsafe('INSERT OR REPLACE INTO decision_artifact SELECT * FROM decision_artifact WHERE id = ?', d.id)).rejects.toThrow();
      expect(await repository.find(d.id)).toEqual(d);
      expect(db.migration("migrate")).toBe(0); expect(db.migration("status")).toBe(0);
      expect(await repository.find(next.id)).toEqual(next);
    } finally { await db.close(); }
  });
  it("application resolves stored artifacts and rechecks portfolio instead of accepting client decision authority", async () => {
    const db = await testDatabase();
    try {
      const i = decisionFixture(); await db.registry.append(i.methods.decision); await db.registry.append(i.scorecard.methodology);
      const cards = new PrismaAnalyticalArtifacts(db.client); await cards.append(i.scorecard);
      const repository = new PrismaDecisionArtifacts(db.client);
      let current = true;
      const engine = new DecisionEngine(db.registry, cards, repository, { read: async () => i.portfolio, isCurrent: async () => current }, { now: () => instant(i.recordedAt) });
      const { scorecard, ranking: _rank, comparatorScorecards: _comp, portfolio: _p, recordedAt: _time, ...base } = i;
      void _rank; void _comp; void _p; void _time;
      const command: DecisionCommand = { ...base, scorecardId: scorecard.id, rankingId: null, comparatorScorecardIds: [] };
      const result = await engine.create(command);
      expect(result.decisionState).toBe("BUY"); expect(result.lineage.scorecardId).toBe(scorecard.id);
      await expect(engine.create({ ...command, id: "bad", decisionState: "SELL" } as DecisionCommand)).rejects.toThrow();
      current = false; await expect(engine.create({ ...command, id: "stale" })).rejects.toThrow();
      expect(await repository.find("stale")).toBeNull();
    } finally { await db.close(); }
  });
  it("rejects missing prior record, invented result and mismatched prior security", async () => {
    const db = await testDatabase();
    try {
      const i = decisionFixture(); await db.registry.append(i.methods.decision); const repo = new PrismaDecisionArtifacts(db.client);
      await expect(repo.append({ ...decide(i), decisionState: "SELL" })).rejects.toThrow();
      const changed = { ...i, priorDecisionId: "not-present", revisionReason: "Correction" };
      await expect(repo.append(decide(changed))).rejects.toThrow();
      expect(await repo.find(i.id)).toBeNull();
    } finally { await db.close(); }
  });
  it("populated M6.4 SQLite upgrade preserves exact upstream rows and supports repeated migrations", async () => {
    const db = await testDatabase({ scoringOnly: true });
    try {
      const i = decisionFixture(); await db.registry.append(i.scorecard.methodology); await db.registry.append(i.methods.decision);
      const cards = new PrismaAnalyticalArtifacts(db.client); await cards.append(i.scorecard);
      const before = await cards.find(i.scorecard.id);
      expect(db.migration("migrate")).toBe(0);
      const repo = new PrismaDecisionArtifacts(db.client); await repo.append(decide(i));
      expect(await cards.find(i.scorecard.id)).toEqual(before); expect((await repo.find(i.id))?.decisionState).toBe("BUY");
      expect(db.migration("migrate")).toBe(0); expect(db.migration("status")).toBe(0);
      expect(await cards.find(i.scorecard.id)).toEqual(before);
    } finally { await db.close(); }
  });
});
