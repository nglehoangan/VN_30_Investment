import { workflowFixture } from "../fixtures/workflow";
import { describe, it, expect } from "vitest";
import { testDatabase } from "../fixtures/database";
import { marginalDatabase } from "../fixtures/marginal-database";
import { marginalCommand, marginalFrame, prefer, substitutionEvidence } from "../fixtures/marginal";
import { MarginalDecisionEngine } from "@/application/decision/marginal";
import { WorkflowEngine } from "@/application/workflow/engine";
import { createReview } from "@/domain/workflow/reviews";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { ACCOUNTING_METHOD, portfolioId, securityId, watermark } from "@/domain/portfolio/values";
import { methodologyFixture } from "../fixtures/methodology";
import { at, method, W0, deposit, buy } from "../fixtures/portfolio/history";
const command = (x: Awaited<ReturnType<typeof marginalDatabase>>) => marginalCommand(x.p, [marginalFrame(x.p), marginalFrame(x.p, [0]), marginalFrame(x.p, [0, 0])]);
describe("M6.6.1 persisted marginal boundary", () => {
  it("persists/replays two authoritative lots and stop, creates a new review, never posts trades", async () => {
    const db = await testDatabase(); try {
      const x = await marginalDatabase(db), old = await x.workflow.create(x.p.command), oldBody = JSON.stringify(old);
      await expect(x.workflow.linkExecution({ id: "forged-legacy-link", reviewId: old.id, proposalId: old.proposal!.id, decisionId: x.p.decisions[0].id, transactionId: "missing", marginalAssessmentReference: "unrelated:step:0", variance: "Injected marginal reference" })).rejects.toThrow();
      const m = await x.engine.create(command(x)); expect(await x.engine.create(command(x))).toEqual(m);
      expect(await x.artifacts.find(m.id)).toEqual(m);
      const review = await x.workflow.create({ ...x.p.command, id: "review-marginal", priorReviewId: old.id, supersedesReviewId: old.id, marginalAllocationId: m.id });
      expect(review.proposal?.items).toHaveLength(2); expect(review.methodology).toBe("m661-marginal-orchestration-v1");
      expect(JSON.stringify(await x.reviews.find(old.id))).toBe(oldBody); expect(await db.client.ledgerTransaction.count()).toBe(0);
      expect(await x.reviews.find(review.id)).toEqual(review); expect((await x.workflow.executionReadiness(old.id)).ready).toBe(false);
      await expect(db.client.marginalAllocation.update({ where: { id: m.id }, data: { body: "{}" } })).rejects.toThrow();
      await expect(db.client.marginalAllocation.delete({ where: { id: m.id } })).rejects.toThrow();
      await expect(db.client.$executeRawUnsafe('INSERT OR REPLACE INTO marginal_allocation SELECT * FROM marginal_allocation WHERE id = ?', m.id)).rejects.toThrow();
    } finally { await db.close(); }
  });
  it("rejects forged authority, corrupted artifacts, stale snapshots and formal/synthetic crossing", async () => {
    const db = await testDatabase(); try {
      const x = await marginalDatabase(db); x.setCurrent(false); await expect(x.engine.create(command(x))).rejects.toThrow(); x.setCurrent(true);
      const formal = new MarginalDecisionEngine(x.artifacts, x.decisions, x.analytical, db.registry, x.read, x.clock);
      await expect(formal.create(command(x))).rejects.toThrow();
      const m = await x.engine.create(command(x));
      await expect(x.artifacts.append({ ...m, id: "forged", steps: m.steps.map(s => ({ ...s, result: "AUTHORIZED" })) })).rejects.toThrow();
      await expect(x.engine.create({ ...command(x), authorizedQuantity: "10000" } as ReturnType<typeof command>)).rejects.toThrow();
      await expect(x.workflow.create({ ...x.p.command, preferredCandidate: x.p.decisions[0].id } as typeof x.p.command)).rejects.toThrow();
      const unavailable = await x.workflow.create({ ...x.p.command, id: "missing-marginal-review", marginalAllocationId: "missing" });
      expect(unavailable.proposal?.items).toEqual([]); expect(unavailable.disposition).toBe("REVIEW REQUIRED");
      const fake = createReview({ ...x.p, command: { ...x.p.command, id: "fake-marginal-review", marginalAllocationId: m.id }, marginalAllocation: m });
      await expect(x.reviews.append({ ...fake, proposal: { ...fake.proposal!, items: [] } }, [])).rejects.toThrow();
      await db.client.$executeRawUnsafe('DROP TRIGGER marginal_no_update');
      await db.client.marginalAllocation.update({ where: { id: m.id }, data: { bodyHash: "corrupt" } });
      await expect(x.artifacts.find(m.id)).rejects.toThrow();
      await expect(x.workflow.create({ ...x.p.command, id: "corrupt-review", marginalAllocationId: m.id })).rejects.toThrow();
    } finally { await db.close(); }
  });
  it("substitution history is persisted, required on later reviews, and cannot be omitted or forged", async () => {
    const db = await testDatabase(); try {
      const p = workflowFixture(2, (i, n) => { i.portfolio.executableCash = "3000000"; if (n === 0) i.assessment.sizing.price = "40000"; });
      const x = await marginalDatabase(db, p), frame = prefer(p, marginalFrame(p), 0); frame.substitutionEvidence = [substitutionEvidence(p)];
      const c = marginalCommand(p, [frame, prefer(p, marginalFrame(p, [1]), 0)]);
      const first = await x.engine.create(c); expect(first.steps[0].substitution).toBeDefined();
      expect(await x.artifacts.substitutionHistory(p.command.portfolioId, p.command.scope, p.command.evidenceCutoff)).toEqual([first.id]);
      await expect(x.engine.create({ ...c, id: "missing-history" })).rejects.toThrow();
      const revised = structuredClone(c) as import("../fixtures/workflow").Mutable<typeof c>; revised.frames[0].substitutionEvidence![0].historyIds = [first.id];
      revised.frames[0].substitutionEvidence![0].patternReview = "RECURRING — FRESH COMPETITIVE REVIEW";
      revised.frames[0].substitutionEvidence![0].remainsCompetitiveAfterFreshReview = true;
      const second = await x.engine.create({ ...revised, id: "reviewed-history" }); expect(second.steps[0].substitution?.historyIds).toEqual([first.id]);
      expect(await x.artifacts.find(first.id)).toEqual(first); expect(await db.client.ledgerTransaction.count()).toBe(0);
      const review = await x.workflow.create({ ...p.command, marginalAllocationId: first.id });
      expect(review.proposal?.items[0].decisionId).toBe(p.decisions[1].id);
      expect(review.proposal?.marginalAllocation?.steps[0].preferredDecisionId).toBe(p.decisions[0].id);
    } finally { await db.close(); }
  });
  it("links actual fills to individual marginal lots and rejects duplicate or missing lot references", async () => {
    const db = await testDatabase(); try {
      const x = await marginalDatabase(db), m = await x.engine.create(command(x));
      const review = await x.workflow.create({ ...x.p.command, marginalAllocationId: m.id }), pid = portfolioId(x.p.command.portfolioId), item = review.proposal!.items[0];
      await db.registry.append({ ...methodologyFixture(method), implementationIdentity: ACCOUNTING_METHOD });
      await db.client.portfolio.create({ data: { id: pid, name: "Marginal fills", currency: "VND", inceptionAt: at(1), createdAt: x.clock.now() } });
      await db.client.security.create({ data: { id: item.securityId, name: "Fill fixture" } });
      const ledger = new PrismaPortfolioLedger(db.client), accounting = new PortfolioEngine(ledger, x.clock);
      await accounting.post([{ ...deposit("fill-cash", "80000000"), portfolioId: pid }], W0);
      for (let n = 0; n < 2; n++) await accounting.post([{ ...buy(`actual-fill-${n}`), portfolioId: pid, securityId: securityId(item.securityId) }], watermark(String(n + 1)));
      const transactions = (await ledger.read(pid)).transactions;
      const engine = new WorkflowEngine(x.reviews, { ...x.workflowRead, transaction: async (_pid, tid) => transactions.find(t => t.facts.id === tid) ?? null }, x.decisions, x.analytical, db.registry, x.clock, "SYNTHETIC_TEST");
      const first = { id: "fill-link-0", reviewId: review.id, proposalId: review.proposal!.id, decisionId: item.decisionId, transactionId: "actual-fill-0", variance: "Separately recorded actual fill differs from proposal estimate" };
      await expect(engine.linkExecution(first)).rejects.toThrow();
      await engine.linkExecution({ ...first, marginalAssessmentReference: item.marginalAssessmentReference });
      expect((await engine.executionReadiness(review.id)).reasons).not.toContain("EXECUTION ALREADY LINKED");
      await expect(engine.linkExecution({ ...first, id: "duplicate-step", transactionId: "actual-fill-1", marginalAssessmentReference: item.marginalAssessmentReference })).rejects.toThrow();
      await engine.linkExecution({ ...first, id: "fill-link-1", transactionId: "actual-fill-1", marginalAssessmentReference: review.proposal!.items[1].marginalAssessmentReference });
      expect((await engine.executionReadiness(review.id)).reasons).toContain("EXECUTION ALREADY LINKED");
      expect((await ledger.read(pid)).transactions).toEqual(transactions); expect(await x.reviews.find(review.id)).toEqual(review);
    } finally { await db.close(); }
  });
  it("M6.6 populated upgrade preserves reviews, proposals, embedded journals, audits, decision and execution links byte-for-byte", async () => {
    const db = await testDatabase({ workflowOnly: true }); try {
      const x = await marginalDatabase(db), review = await x.workflow.create(x.p.command);
      const pid = portfolioId(x.p.command.portfolioId), item = review.proposal!.items[0];
      await db.registry.append({ ...methodologyFixture(method), implementationIdentity: ACCOUNTING_METHOD });
      await db.client.portfolio.create({ data: { id: pid, name: "M6.6 upgrade", currency: "VND", inceptionAt: at(1), createdAt: x.clock.now() } });
      await db.client.security.create({ data: { id: item.securityId, name: "Fixture security" } });
      const ledger = new PrismaPortfolioLedger(db.client), accounting = new PortfolioEngine(ledger, x.clock);
      await accounting.post([{ ...deposit("upgrade-deposit", "80000000"), portfolioId: pid }], W0);
      await accounting.post([{ ...buy("upgrade-buy"), portfolioId: pid, securityId: securityId(item.securityId) }], watermark("1"));
      const trade = (await ledger.read(pid)).transactions.find(t => t.facts.id === "upgrade-buy")!;
      const execution = new WorkflowEngine(x.reviews, { ...x.workflowRead, transaction: async () => trade }, x.decisions, x.analytical, db.registry, x.clock, "SYNTHETIC_TEST");
      await execution.linkExecution({ id: "old-execution", reviewId: review.id, proposalId: review.proposal!.id, decisionId: item.decisionId, transactionId: trade.facts.id, variance: "Recorded actual fill" });
      await x.workflow.followUp({ id: "old-audit", reviewId: review.id, journalId: review.journal!.id, decisionId: item.decisionId, horizon: 3, auditDate: x.clock.now(), evidence: x.p.command.evidence, processQuality: "GOOD", decisionQuality: "GOOD", evidenceQuality: "GOOD", thesisAccuracy: "GOOD", riskAssessmentQuality: "GOOD", executionQuality: "GOOD", outcomeQuality: "UNKNOWN", rationale: "Early evidence audit, outcome pending" });
      const rows = async () => ({ reviews: await db.client.workflowReview.findMany(), proposals: await db.client.workflowProposal.findMany(), audits: await db.client.workflowAudit.findMany(), executions: await db.client.workflowExecution.findMany(), decisions: await db.client.decisionArtifact.findMany(), cards: await db.client.analyticalArtifact.findMany(), transactions: await db.client.ledgerTransaction.findMany(), legs: await db.client.ledgerLeg.findMany(), methods: await db.client.methodologyRecord.findMany() });
      const before = JSON.stringify(await rows());
      for (let run = 0; run < 2; run++) { expect(db.migration("migrate")).toBe(0); expect(db.migration("status")).toBe(0); expect(JSON.stringify(await rows())).toBe(before); }
      expect(await x.reviews.find(review.id)).toEqual(review);
      await x.engine.create(command(x)); expect(JSON.stringify(await rows())).toBe(before);
    } finally { await db.close(); }
  });
});
