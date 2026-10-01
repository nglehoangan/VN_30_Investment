import { PortfolioEngine } from "@/application/portfolio/engine";
import { PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { methodologyFixture } from "../fixtures/methodology";
import { ACCOUNTING_METHOD, portfolioId, securityId, watermark } from "@/domain/portfolio/values";
import { P, at, method, W0, deposit, buy, NOW as ACCOUNTING_NOW } from "../fixtures/portfolio/history";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { describe, expect, it } from "vitest";
import { testDatabase } from "../fixtures/database";
import { workflowFixture, sections, NOW } from "../fixtures/workflow";
import { PrismaWorkflowArtifacts } from "@/infrastructure/repositories/workflow-artifacts";
import { PrismaDecisionArtifacts } from "@/infrastructure/repositories/decision-artifacts";
import { PrismaAnalyticalArtifacts } from "@/infrastructure/repositories/analytical-artifacts";
import { WorkflowEngine } from "@/application/workflow/engine";
import { WEEKLY_AREAS, createReview } from "@/domain/workflow/reviews";
import { instant } from "@/shared/time";
import type { ReviewCommand, FollowUpCommand } from "@/domain/workflow/contracts";
async function setup(db: Awaited<ReturnType<typeof testDatabase>>, p = workflowFixture()) {
  const artifacts = new PrismaWorkflowArtifacts(db.client), decisions = new PrismaDecisionArtifacts(db.client), analytical = new PrismaAnalyticalArtifacts(db.client);
  for (const d of p.decisions) for (const m of Object.values(d.input.methods)) if (!(await db.registry.findById(m.methodologyId))) await db.registry.append(m);
  for (const card of p.ranking!.input.cards) {
    if (!(await db.registry.findById(card.methodology.methodologyId))) await db.registry.append(card.methodology);
    if (!(await analytical.find(card.id))) await analytical.append(deepFreeze(structuredClone(card)));
  }
  await analytical.append(deepFreeze(structuredClone(p.ranking!)));
  for (const d of p.decisions) await decisions.append(d);
  let current = true, now = NOW;
  const read = { read: async (id: string) => { if (id !== p.command.snapshotId) throw new Error("Unknown snapshot"); return p.portfolio; }, isCurrent: async () => current, transaction: async () => null };
  const engine = new WorkflowEngine(artifacts, read, decisions, analytical, db.registry, { now: () => instant(now) }, "SYNTHETIC_TEST");
  return { engine, artifacts, decisions, analytical, read, setCurrent: (v: boolean) => { current = v; }, setNow: (v: string) => { now = v; }, p };
}

describe("M6.6 immutable application and persistence", () => {
  it("persists proposal/journal atomically, deduplicates runs, never posts transactions", async () => {
    const db = await testDatabase(); try {
      const { engine, artifacts, p } = await setup(db);
      const before = await db.client.ledgerTransaction.count();
      const r = await engine.create(p.command); expect(r.proposal?.outcome).toBe("BUY"); expect(r.journal?.entryType).toBe("TRADE_DECISION");
      expect(await engine.create(p.command)).toEqual(r);
      expect(await engine.create({ ...p.command, id: "different-id-same-review" })).toEqual(r);
      expect(await db.client.workflowReview.count()).toBe(1); expect(await db.client.workflowProposal.count()).toBe(1);
      expect(await db.client.ledgerTransaction.count()).toBe(before);
      expect(await artifacts.find(r.id)).toEqual(r);
      await expect(db.client.workflowReview.update({ where: { id: r.id }, data: { body: "{}" } })).rejects.toThrow();
      await expect(db.client.workflowReview.delete({ where: { id: r.id } })).rejects.toThrow();
      await expect(db.client.workflowProposal.update({ where: { id: r.proposal!.id }, data: { body: "{}" } })).rejects.toThrow();
      await expect(db.client.$executeRawUnsafe('INSERT OR REPLACE INTO workflow_review SELECT * FROM workflow_review WHERE id = ?', r.id)).rejects.toThrow();
      await expect(engine.create({ ...p.command, period: "different" })).rejects.toThrow();
      expect(await artifacts.find(r.id)).toEqual(r);
    } finally { await db.close(); }
  });
  it("same weekly invocation is idempotent; elapsed week creates no trades", async () => {
    const db = await testDatabase(); try { const { engine, p } = await setup(db); p.command.type = "WEEKLY"; p.command.sections = sections(WEEKLY_AREAS); const r = await engine.create(p.command); expect(r.disposition).toBe("NO ACTION"); expect(await engine.create(p.command)).toEqual(r); expect(await db.client.ledgerTransaction.count()).toBe(0); } finally { await db.close(); }
  });
  it("missing, stale, corrupt and client-injected authority all fail closed", async () => {
    const db = await testDatabase(); try {
      const { engine, p, setCurrent, artifacts } = await setup(db);
      for (const change of [{ decisionIds: ["missing"] }, { rankingId: "missing" }, { snapshotId: "missing" }, { priorReviewId: "missing" }, { supersedesReviewId: "missing" }, { outcome: "BUY" }, { quantity: "1000000" }]) await expect(engine.create({ ...p.command, ...change } as ReviewCommand)).rejects.toThrow();
      setCurrent(false); await expect(engine.create(p.command)).rejects.toThrow(); setCurrent(true);
      const fake = createReview(p); await expect(artifacts.append({ ...fake, disposition: "DECISION REQUIRED" }, [])).rejects.toThrow();
      const fakeProposal = { ...fake, proposal: { ...fake.proposal!, proposedAllocation: "1" } }; await expect(artifacts.append(fakeProposal, [])).rejects.toThrow();
      expect(await db.client.workflowReview.count()).toBe(0);
      await db.client.$executeRawUnsafe('DROP TRIGGER decision_no_update');
      await db.client.decisionArtifact.update({ where: { id: p.decisions[0].id }, data: { bodyHash: "corrupt" } });
      await expect(engine.create(p.command)).rejects.toThrow();
    } finally { await db.close(); }
  });
  it("production boundary rejects synthetic history", async () => {
    const db = await testDatabase(); try { const x = await setup(db); const formal = new WorkflowEngine(x.artifacts, x.read, x.decisions, x.analytical, db.registry, { now: () => instant(NOW) }); await expect(formal.create(x.p.command)).rejects.toThrow(); await expect(formal.create({ ...x.p.command, scope: "FORMAL" })).rejects.toThrow(); } finally { await db.close(); }
  });
  it("event supersedes pending schedule, blocks new monthly runs and preserves historical proposal", async () => {
    const db = await testDatabase(); try {
      const { engine, artifacts, p } = await setup(db); const original = await engine.create(p.command), before = JSON.stringify(original);
      const eventCommand: ReviewCommand = { ...p.command, id: "event-review", type: "EVENT_DRIVEN", supersedesReviewId: original.id,
        triggers: [{ id: "fraud-event", category: "COMPANY", priority: "HARD RISK / SOLVENCY / GOVERNANCE", severity: "T4", effectiveAt: NOW, evidenceRefs: ["decision-evidence"], verified: true, decisionReady: true, governingRule: "M5 Event §10", affectedSecurityId: p.decisions[0].securityId, requiredEvidence: "Formal M6.5 refresh", rationale: "Verified material event" }] };
      const event = await engine.create(eventCommand); expect(event.disposition).toBe("DECISION REQUIRED");
      const later = await engine.create({ ...p.command, id: "monthly-after-event", priorReviewId: original.id }); expect(later.status).toBe("ESCALATED"); expect(later.proposal?.items).toEqual([]);
      expect(JSON.stringify(await artifacts.find(original.id))).toBe(before);
      expect((await artifacts.openEvents(p.command.portfolioId)).map(e => e.id)).toEqual([event.id]);
    } finally { await db.close(); }
  });
  it("decision audit preserves contemporaneous evidence and separates profit from quality", async () => {
    const db = await testDatabase(); try {
      const { engine, artifacts, p, setNow } = await setup(db); const original = await engine.create(p.command);
      setNow("2027-01-01T09:00:00.000Z");
      const command: FollowUpCommand = { id: "audit-1", reviewId: original.id, journalId: original.journal!.id, decisionId: p.decisions[0].id, horizon: 3, auditDate: "2027-01-01T09:00:00.000Z", evidence: p.command.evidence,
        processQuality: "BAD", decisionQuality: "BAD", evidenceQuality: "GOOD", thesisAccuracy: "GOOD", riskAssessmentQuality: "BAD", executionQuality: "GOOD", outcomeQuality: "GOOD", rationale: "Profitable outcome does not cure original process deviation" };
      const a = await engine.followUp(command); expect(a.classification).toBe("BAD DECISION / GOOD OUTCOME"); expect(a.originalEvidenceCutoff).toBe(NOW); expect(await artifacts.findFollowUp(command.id)).toEqual(a);
      await expect(engine.followUp(command)).rejects.toThrow();
      const b = await engine.followUp({ ...command, id: "audit-2", processQuality: "GOOD", decisionQuality: "GOOD", outcomeQuality: "BAD" }); expect(b.classification).toBe("GOOD DECISION / BAD OUTCOME");
      await expect(engine.followUp({ ...command, id: "bad-link", journalId: "invented" })).rejects.toThrow();
      await expect(db.client.workflowAudit.delete({ where: { id: command.id } })).rejects.toThrow();
      expect(await artifacts.find(original.id)).toEqual(original);
    } finally { await db.close(); }
  });
  it("historical R1/A1 survive new cash, snapshot, score/rank/decision and scoring identity", async () => {
    const db = await testDatabase(); try {
      const first = await setup(db); const r1 = await first.engine.create(first.p.command); const original = JSON.stringify(r1);
      const next = workflowFixture(1, i => { i.portfolio.executableCash = "10000000"; });
      const replacements = new Map<string, string>([[NOW, "2026-11-01T09:00:00.000Z"], [next.command.id, "review-2"], [next.command.snapshotId, "snapshot-2"], [next.ranking!.id, "ranking-2"], ["synthetic-m64-method", "synthetic-m64-method-revision"]]);
      next.ranking!.input.cards.forEach(c => replacements.set(c.id, `${c.id}-r2`));
      next.decisions.forEach(d => replacements.set(d.id, `${d.id}-r2`));
      const changed = JSON.parse(JSON.stringify(next), (_key, value) => typeof value === "string" ? replacements.get(value) ?? value : value) as typeof next;
      changed.command.period = "2026-11"; changed.command.priorReviewId = r1.id; changed.command.supersedesReviewId = r1.id;
      const second = await setup(db, changed); second.setNow(changed.recordedAt);
      const r2 = await second.engine.create(changed.command);
      expect(r2.proposal?.outcome).toBe("BUY"); expect(r2.proposal?.supersedesProposalId).toBe(r1.proposal?.id);
      expect(r2.proposal?.availableCapital).toBe("10000000"); expect(r2.proposal?.rankingReference).not.toBe(r1.proposal?.rankingReference);
      expect(r2.proposal?.methodologyVersions).not.toEqual(r1.proposal?.methodologyVersions);
      expect(JSON.stringify(await first.artifacts.find(r1.id))).toBe(original);
      expect((await first.engine.executionReadiness(r1.id)).ready).toBe(false);
    } finally { await db.close(); }
  });
  it("execution readiness expires on new evidence, changed portfolio or an event", async () => {
    const db = await testDatabase(); try {
      const x = await setup(db); const review = await x.engine.create(x.p.command);
      expect((await x.engine.executionReadiness(review.id)).ready).toBe(true);
      x.setCurrent(false); expect((await x.engine.executionReadiness(review.id)).reasons).toContain("STALE PORTFOLIO");
      x.setCurrent(true); x.setNow("2026-10-02T09:00:00.000Z"); expect((await x.engine.executionReadiness(review.id)).reasons).toContain("STALE DECISION EVIDENCE");
    } finally { await db.close(); }
  });
  it("execution links require a posted matching M6.3 transaction", async () => {
    const db = await testDatabase(); try { const { engine, p } = await setup(db); const r = await engine.create(p.command); await expect(engine.linkExecution({ id: "link-1", reviewId: r.id, proposalId: r.proposal!.id, decisionId: p.decisions[0].id, transactionId: "fabricated-trade", variance: "No variance" })).rejects.toThrow(); expect(await db.client.workflowExecution.count()).toBe(0); } finally { await db.close(); }
  });
  it("links an explicit posted trade without changing the original proposal or ledger", async () => {
    const db = await testDatabase(); try {
      const x = await setup(db), r = await x.engine.create(x.p.command), item = r.proposal!.items[0];
      const pid = portfolioId(x.p.command.portfolioId);
      await db.registry.append({ ...methodologyFixture(method), implementationIdentity: ACCOUNTING_METHOD });
      await db.client.portfolio.create({ data: { id: pid, name: "Execution fixture", currency: "VND", inceptionAt: at(1), createdAt: ACCOUNTING_NOW } });
      await db.client.security.create({ data: { id: item.securityId, name: "Execution security" } });
      const ledger = new PrismaPortfolioLedger(db.client), accounting = new PortfolioEngine(ledger, { now: () => instant(NOW) });
      await accounting.post([{ ...deposit("execution-cash", "80000000"), portfolioId: pid }], W0);
      await accounting.post([{ ...buy("explicit-user-trade"), portfolioId: pid, securityId: securityId(item.securityId) }], watermark("1"));
      const transactions = (await ledger.read(pid)).transactions, trade = transactions.find(t => t.facts.id === "explicit-user-trade")!;
      const engine = new WorkflowEngine(x.artifacts, { ...x.read, transaction: async () => trade }, x.decisions, x.analytical, db.registry, { now: () => instant(NOW) }, "SYNTHETIC_TEST");
      const link = await engine.linkExecution({ id: "execution-link", reviewId: r.id, proposalId: r.proposal!.id, decisionId: item.decisionId, transactionId: trade.facts.id, variance: "Explicit execution at different price and capital; retained for audit" });
      expect(await x.artifacts.findExecution(link.id)).toEqual(link);
      expect((await ledger.read(pid)).transactions).toEqual(transactions);
      expect(await x.artifacts.find(r.id)).toEqual(r);
      expect((await engine.executionReadiness(r.id)).reasons).toContain("EXECUTION ALREADY LINKED");
      await expect(engine.linkExecution({ ...link, id: "duplicate-link" })).rejects.toThrow();
    } finally { await db.close(); }
  });
  it("fresh and populated M6.5 migration repeatability preserves every upstream row", async () => {
    const db = await testDatabase({ monotonicDecisionOnly: true }); try {
      const p = workflowFixture(); await setup(db, p);
      await db.registry.append({ ...methodologyFixture(method), implementationIdentity: ACCOUNTING_METHOD });
      await db.client.portfolio.create({ data: { id: P, name: "Preserved M6.3 history", currency: "VND", inceptionAt: at(1), createdAt: ACCOUNTING_NOW } });
      const accounting = new PortfolioEngine(new PrismaPortfolioLedger(db.client), { now: () => ACCOUNTING_NOW });
      await accounting.post([deposit()], W0);
      expect(await db.client.ledgerTransaction.count()).toBe(1);
      const before = { methods: await db.client.methodologyRecord.findMany(), cards: await db.client.analyticalArtifact.findMany(), decisions: await db.client.decisionArtifact.findMany(), transactions: await db.client.ledgerTransaction.findMany() };
      for (let run = 0; run < 2; run++) { expect(db.migration("migrate")).toBe(0); expect(db.migration("status")).toBe(0); expect({ methods: await db.client.methodologyRecord.findMany(), cards: await db.client.analyticalArtifact.findMany(), decisions: await db.client.decisionArtifact.findMany(), transactions: await db.client.ledgerTransaction.findMany() }).toEqual(before); }
      const artifacts = new PrismaWorkflowArtifacts(db.client); await artifacts.append(createReview(p), []); expect((await artifacts.find(p.command.id))?.proposal?.outcome).toBe("BUY");
    } finally { await db.close(); }
  });
});
