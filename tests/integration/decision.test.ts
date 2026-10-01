import { createHash } from "node:crypto";
import m652History from "../fixtures/m652-historical-decisions.json";
import historicalDecisions from "../fixtures/m65-historical-decisions.json";
import { APPROVED_METHOD, APPROVED_DECISION_METHODOLOGY, MONOTONIC_METHOD, MONOTONIC_DECISION_METHODOLOGY } from "@/domain/decision/approved-methodology";
import type { DecisionInput } from "@/domain/decision/contracts";
import { calculateScorecard } from "@/domain/scoring/scorecard";
import { describe, it, expect } from "vitest";
import { testDatabase } from "../fixtures/database";
import { decisionFixture, mutableDecision, monotonicDecision } from "../fixtures/decision";
import { decide, type Decision } from "@/domain/decision/engine";
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


it("pending candidate cannot claim approval; retirement never rewrites historical synthetic decisions", async () => {
  const db = await testDatabase();
  try {
    const i = decisionFixture(); await db.registry.append(i.methods.decision);
    const repo = new PrismaDecisionArtifacts(db.client); const d = decide(i); await repo.append(d);
    const before = JSON.stringify(await repo.find(d.id));
    await expect(db.registry.append({ ...i.methods.decision, methodologyId: methodologyId("candidate-claimed-approved"), governanceStatus: "APPROVED", intendedUse: "PRODUCTION", approvalReference: "docs/06_DASHBOARD/6.5 Decision Engine/CHANGE_REQUESTS.md" })).rejects.toThrow();
    await expect(db.registry.append({ ...i.methods.decision, methodologyId: methodologyId("pending-with-approval"), approvalReference: "CR-01" })).rejects.toThrow();
    await expect(db.registry.append({ ...i.methods.decision, methodologyId: methodologyId("approval-without-evidence"), governanceStatus: "APPROVED", intendedUse: "PRODUCTION" })).rejects.toThrow();
    await db.registry.append({ ...i.methods.decision, methodologyId: methodologyId("candidate-retired-record"), governanceStatus: "RETIRED" });
    expect(JSON.stringify(await repo.find(d.id))).toBe(before);
    expect((await db.registry.findById(i.methods.decision.methodologyId))?.governanceStatus).toBe("PROPOSED");
  } finally { await db.close(); }
});

describe("M6.5.2 approved methodology persistence", () => {
  it.each([false, true])("append-only migration over populated M6.4/M6.5; decision history %s", withDecisions => runUpgrade(withDecisions));
  async function runUpgrade(withDecisions: boolean) {
    const db = await testDatabase(withDecisions ? { decisionOnly: true } : { scoringOnly: true });
    try {
      const repo = new PrismaDecisionArtifacts(db.client);
      for (const artifact of historicalDecisions) {
        const input = artifact.input as unknown as DecisionInput;
        // Both historical artifacts share the original registry ID, as historical replay pins full metadata.
        if (!(await db.registry.findById(input.methods.decision.methodologyId))) await db.registry.append(input.methods.decision);
        if (withDecisions) await repo.append(artifact as unknown as Decision);
      }
      const i = decisionFixture(); await db.registry.append(i.scorecard.methodology);
      const cards = new PrismaAnalyticalArtifacts(db.client); await cards.append(i.scorecard);
      const beforeMethods = await db.client.methodologyRecord.findMany({ orderBy: { methodologyId: "asc" } });
      const beforeCards = await db.client.analyticalArtifact.findMany();
      const beforeArtifacts = withDecisions ? await db.client.decisionArtifact.findMany({ orderBy: { id: "asc" } }) : [];
      expect(db.migration("migrate")).toBe(0);
      expect(await db.registry.findById(APPROVED_DECISION_METHODOLOGY.methodologyId)).toEqual(APPROVED_DECISION_METHODOLOGY);
      const afterMethods = await db.client.methodologyRecord.findMany({ where: { methodologyId: { notIn: [APPROVED_METHOD, MONOTONIC_METHOD] } }, orderBy: { methodologyId: "asc" } });
      expect(afterMethods).toEqual(beforeMethods);
      expect(await db.client.analyticalArtifact.findMany()).toEqual(beforeCards);
      if (withDecisions) {
        expect(await db.client.decisionArtifact.findMany({ orderBy: { id: "asc" } })).toEqual(beforeArtifacts);
        for (const artifact of historicalDecisions) expect(JSON.stringify(await repo.find(artifact.id))).toBe(JSON.stringify(artifact));
      }
      expect(db.migration("migrate")).toBe(0); expect(db.migration("status")).toBe(0);
      expect(await db.registry.findById(APPROVED_DECISION_METHODOLOGY.methodologyId)).toEqual(APPROVED_DECISION_METHODOLOGY);
      if (withDecisions) expect(await db.client.decisionArtifact.findMany({ orderBy: { id: "asc" } })).toEqual(beforeArtifacts);
    } finally { await db.close(); }
  }
  it("fresh database pins immutable approval, rejects forged metadata and leaves historical candidates non-production", async () => {
    const db = await testDatabase();
    try {
      const method = APPROVED_DECISION_METHODOLOGY;
      expect(await db.registry.findById(method.methodologyId)).toEqual(method);
      await expect(db.registry.append(method)).rejects.toThrow();
      for (const key of ["approvalReference", "semanticVersion", "methodologyId", "implementationIdentity", "governingDocumentReference", "governanceStatus", "intendedUse"] as const) {
        await expect(db.registry.append({ ...method, [key]: "forged" })).rejects.toThrow();
      }
      await expect(db.client.methodologyRecord.update({ where: { methodologyId: method.methodologyId }, data: { semanticVersion: "9.0.0" } })).rejects.toThrow();
      await expect(db.client.methodologyRecord.delete({ where: { methodologyId: method.methodologyId } })).rejects.toThrow();
      expect(await db.registry.findById(method.methodologyId)).toEqual(method);
    } finally { await db.close(); }
  });
  it("approved identity creates a new formal artifact through server resolution, without upgrading synthetic history", async () => {
    const db = await testDatabase();
    try {
      const repo = new PrismaDecisionArtifacts(db.client), cards = new PrismaAnalyticalArtifacts(db.client);
      const old = historicalDecisions[1] as unknown as Decision;
      await db.registry.append(old.input.methods.decision); await repo.append(old);
      const before = await db.client.decisionArtifact.findUniqueOrThrow({ where: { id: old.id } });
      const i = monotonicDecision(); i.id = "new-formal-m653"; i.scope = "FORMAL";
      // Isolated test-only upstream governance prerequisites; this is not project M6.4 approval.
      for (const key of ["risk", "stage0"] as const) {
        i.methods[key] = { ...i.methods[key], methodologyId: methodologyId(`fixture-formal-${key}`), family: `FIXTURE_${key}`, implementationIdentity: `fixture-${key}-implementation`, governanceStatus: "APPROVED", intendedUse: "PRODUCTION", approvalReference: "TEST FIXTURE ONLY: independent upstream approval prerequisite" };
        await db.registry.append(i.methods[key]);
      }
      i.assessment.stage0.methodologyId = i.methods.stage0.methodologyId;
      const scoreInput = i.scorecard.input;
      scoreInput.artifactScope = "FORMAL";
      scoreInput.methodology = { ...scoreInput.methodology, methodologyId: methodologyId("fixture-formal-scoring"), family: "SCORING", governanceStatus: "APPROVED", intendedUse: "PRODUCTION", approvalReference: "TEST FIXTURE ONLY: independent scoring approval prerequisite" };
      const card = calculateScorecard(scoreInput); await db.registry.append(card.methodology); await cards.append(card);
      const engine = new DecisionEngine(db.registry, cards, repo, { read: async () => i.portfolio, isCurrent: async () => true }, { now: () => instant(i.recordedAt) });
      const { scorecard: _score, ranking: _rank, comparatorScorecards: _comp, portfolio: _p, recordedAt: _time, ...base } = i;
      void _score; void _rank; void _comp; void _p; void _time;
      const command: DecisionCommand = { ...base, scorecardId: card.id, rankingId: null, comparatorScorecardIds: [] };
      const formal = await engine.create(command);
      expect(formal).toMatchObject({ scope: "FORMAL", methodology: MONOTONIC_METHOD, decisionState: "BUY" });
      expect(await repo.find(formal.id)).toEqual(formal);
      expect(await db.client.decisionArtifact.findUniqueOrThrow({ where: { id: old.id } })).toEqual(before);
      expect((await repo.find(old.id))?.scope).toBe("SYNTHETIC_TEST");
      await expect(engine.create({ ...command, id: "forged-approval", methods: { ...command.methods, decision: { ...command.methods.decision, approvalReference: "fake" } } })).rejects.toThrow();
      await expect(engine.create({ ...command, id: "override-block", executionStatus: "EXECUTE" } as DecisionCommand)).rejects.toThrow();
      await expect(repo.append({ ...formal, id: "fake-state", decisionState: "SELL" })).rejects.toThrow();
      const unsupported = { ...i, scorecard: card, methods: { ...i.methods, decision: { ...i.methods.decision, implementationIdentity: "unknown-approved" } } };
      expect(() => decide(unsupported)).toThrow();
    } finally { await db.close(); }
  });
});

describe("M6.5.3 immutable sector remediation", () => {
  async function seedHistoricalRows(db: Awaited<ReturnType<typeof testDatabase>>, artifacts: readonly Decision[]) {
    for (const d of artifacts) {
      for (const method of Object.values(d.input.methods)) if (!(await db.registry.findById(method.methodologyId))) await db.registry.append(method);
      const body = JSON.stringify(d);
      // Test-only restoration of rows produced by earlier releases. Current append must reject old formal issuance.
      await db.client.decisionArtifact.create({ data: { id: d.id, securityId: d.securityId, methodologyId: d.input.methods.decision.methodologyId,
        asOf: d.asOf, recordedAt: d.recordedAt, priorDecisionId: d.priorDecisionId, body, bodyHash: createHash("sha256").update(body).digest("hex") } });
    }
  }
  it.each(["M6.4", "M6.5.1", "M6.5.2"] as const)("populated %s upgrade/repeat preserves every historical row", async baseline => {
    const db = await testDatabase(baseline === "M6.4" ? { scoringOnly: true } : baseline === "M6.5.1" ? { decisionOnly: true } : { approvedDecisionOnly: true });
    try {
      const artifacts = baseline === "M6.4" ? [] : baseline === "M6.5.1" ? historicalDecisions : [...historicalDecisions, ...m652History];
      await seedHistoricalRows(db, artifacts as unknown as Decision[]);
      const i = decisionFixture(); await db.registry.append(i.scorecard.methodology);
      await new PrismaAnalyticalArtifacts(db.client).append(i.scorecard);
      const methods = await db.client.methodologyRecord.findMany({ orderBy: { methodologyId: "asc" } });
      const scores = await db.client.analyticalArtifact.findMany();
      const decisions = baseline === "M6.4" ? [] : await db.client.decisionArtifact.findMany({ orderBy: { id: "asc" } });
      for (let run = 0; run < 2; run++) {
        expect(db.migration("migrate")).toBe(0); expect(db.migration("status")).toBe(0);
        const historicalMethods = await db.client.methodologyRecord.findMany({ where: { methodologyId: { in: methods.map(m => m.methodologyId) } }, orderBy: { methodologyId: "asc" } });
        expect(historicalMethods).toEqual(methods);
        expect(await db.client.analyticalArtifact.findMany()).toEqual(scores);
        expect(await db.client.decisionArtifact.findMany({ orderBy: { id: "asc" } })).toEqual(decisions);
        expect(await db.registry.findById(MONOTONIC_DECISION_METHODOLOGY.methodologyId)).toEqual(MONOTONIC_DECISION_METHODOLOGY);
        const repo = new PrismaDecisionArtifacts(db.client);
        for (const artifact of artifacts) expect(JSON.stringify(await repo.find(artifact.id))).toBe(JSON.stringify(artifact));
      }
    } finally { await db.close(); }
  });
  it("fresh registry pins the corrected record and cannot rewrite either approved version", async () => {
    const db = await testDatabase();
    try {
      for (const method of [APPROVED_DECISION_METHODOLOGY, MONOTONIC_DECISION_METHODOLOGY]) {
        expect(await db.registry.findById(method.methodologyId)).toEqual(method);
        await expect(db.registry.append(method)).rejects.toThrow();
        await expect(db.client.methodologyRecord.update({ where: { methodologyId: method.methodologyId }, data: { semanticVersion: "9.0.0" } })).rejects.toThrow();
        await expect(db.client.methodologyRecord.delete({ where: { methodologyId: method.methodologyId } })).rejects.toThrow();
        await expect(db.client.$executeRawUnsafe('INSERT OR REPLACE INTO methodology_record SELECT * FROM methodology_record WHERE methodology_id = ?', method.methodologyId)).rejects.toThrow();
      }
      for (const field of ["approvalReference", "methodologyId", "semanticVersion", "implementationIdentity", "governingDocumentReference", "configurationReference", "effectiveDate", "recordedAt", "governanceStatus", "intendedUse"]) {
        await expect(db.registry.append({ ...MONOTONIC_DECISION_METHODOLOGY, [field]: "forged" })).rejects.toThrow();
      }
      expect(await db.registry.findById(MONOTONIC_DECISION_METHODOLOGY.methodologyId)).toEqual(MONOTONIC_DECISION_METHODOLOGY);
    } finally { await db.close(); }
  });
  it("server blocks old-version selection and arbitrary approval/plan/state strings; new formal truth leaves historical BUY intact", async () => {
    const db = await testDatabase();
    try {
      const old = m652History[1] as unknown as Decision;
      await seedHistoricalRows(db, [old]);
      const before = await db.client.decisionArtifact.findUniqueOrThrow({ where: { id: old.id } });
      const i = JSON.parse(JSON.stringify(old.input).replaceAll("2026-09-30T09:00:00.000Z", "2026-10-01T09:00:00.000Z")) as ReturnType<typeof monotonicDecision>;
      i.id = "m653-formal-sector-correction"; i.priorDecisionId = old.id; i.revisionReason = "M65-R3-M01 implementation correction";
      i.methods.decision = { ...MONOTONIC_DECISION_METHODOLOGY }; i.methods.requiredReturn = { ...MONOTONIC_DECISION_METHODOLOGY };
      i.assessment.risk.approvalReference = "APPROVED — SECTOR_CONCENTRATION: arbitrary client string";
      i.assessment.risk.normalizationPlan = "Arbitrary plan claims additions are permitted";
      const card = calculateScorecard(i.scorecard.input); await db.registry.append(card.methodology);
      const cards = new PrismaAnalyticalArtifacts(db.client); await cards.append(card);
      const repo = new PrismaDecisionArtifacts(db.client);
      const engine = new DecisionEngine(db.registry, cards, repo, { read: async () => i.portfolio, isCurrent: async () => true }, { now: () => instant(i.recordedAt) });
      const { scorecard: _c, ranking: _r, comparatorScorecards: _cs, portfolio: _p, recordedAt: _at, ...base } = i;
      void _c; void _r; void _cs; void _p; void _at;
      const command: DecisionCommand = { ...base, scorecardId: card.id, rankingId: null, comparatorScorecardIds: [] };
      const result = await engine.create(command);
      expect(result).toMatchObject({ scope: "FORMAL", methodology: MONOTONIC_METHOD, decisionState: "AVOID", tradeAuthorization: "NOT AUTHORIZED", executableShares: null, priorDecisionId: old.id });
      expect(await repo.find(result.id)).toEqual(result);
      await expect(engine.create({ ...command, id: "choose-old", methods: { ...command.methods, decision: APPROVED_DECISION_METHODOLOGY, requiredReturn: APPROVED_DECISION_METHODOLOGY } })).rejects.toMatchObject({ issues: [{ reason: "SUPERSEDED_DECISION_METHOD_REPLAY_ONLY" }] });
      await expect(repo.append(decide({ ...old.input, id: "bypass-application-old" }))).rejects.toMatchObject({ issues: [{ reason: "SUPERSEDED_DECISION_METHOD_REPLAY_ONLY" }] });
      for (const field of ["decisionState", "executionStatus", "riskCompliantShares"]) await expect(engine.create({ ...command, id: `fake-${field}`, [field]: "BUY" } as DecisionCommand)).rejects.toThrow();
      await expect(engine.create({ ...command, id: "fake-approval", methods: { ...command.methods, decision: { ...command.methods.decision, approvalReference: "client-approved" } } })).rejects.toThrow();
      expect(await db.client.decisionArtifact.findUniqueOrThrow({ where: { id: old.id } })).toEqual(before);
      expect((await repo.find(old.id))?.decisionState).toBe("BUY");
    } finally { await db.close(); }
  });
});
