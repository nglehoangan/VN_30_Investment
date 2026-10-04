import { copyFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { testDatabase } from "../fixtures/database";
import { marginalDatabase } from "../fixtures/marginal-database";
import { workflowFixture, sections } from "../fixtures/workflow";
import { marginalCommand, marginalFrame } from "../fixtures/marginal";
import { WEEKLY_AREAS, QUARTERLY_AREAS, ANNUAL_AREAS } from "@/domain/workflow/reviews";
import { initializePortfolio } from "@/application/portfolio/initialize";
import { PrismaPortfolioSetup } from "@/infrastructure/repositories/portfolio-ledger";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { methodologyFixture } from "../fixtures/methodology";
import { ACCOUNTING_METHOD, watermark, securityId, portfolioId } from "@/domain/portfolio/values";
import { at, NOW, method, deposit, buy } from "../fixtures/portfolio/history";
export default async function setup() {
  const destination = process.env.VN30_E2E_DATABASE;
  if (!destination || !path.resolve(destination).startsWith(path.join(tmpdir(), "vn30-ui-e2e-"))) throw new Error("E2E requires an owned temporary database");
  const db = await testDatabase();
  try {
    const stamp = new Date().toISOString();
    const sourceFile = path.join(path.dirname(destination), "current-source.json");
    writeFileSync(sourceFile, JSON.stringify({ version: "synthetic-price-1", portfolioId: "portfolio-1", scope: "SYNTHETIC_TEST", asOf: stamp, receivedAt: stamp, ledgerWatermark: "2", taxonomy: "SYNTHETIC", valuationMethodologyId: "m63-valuation-test-only", prices: [{ id: "synthetic-quote", securityId: "SYNTHETIC-00", price: "20", currency: "VND", observedAt: stamp, receivedAt: stamp, validThrough: "2026-12-31T00:00:00.000Z", sourceReference: "SYNTHETIC TEST ONLY", provider: "SYNTHETIC_TEST", revision: "1", quality: "VALID", policyReference: "SYNTHETIC TEST ONLY validity fixture", adjustment: "RAW" }], references: { version: "synthetic-reference-1", intervals: [{ id: "member", kind: "MEMBERSHIP", securityId: "SYNTHETIC-00", from: "2026-01-01", to: null, value: "VN30", taxonomy: null, sourceReference: "SYNTHETIC TEST ONLY" }, { id: "sector", kind: "SECTOR", securityId: "SYNTHETIC-00", from: "2026-01-01", to: null, value: "INDUSTRIAL", taxonomy: "SYNTHETIC", sourceReference: "SYNTHETIC TEST ONLY" }] }, referenceAsOf: stamp, referenceValidThrough: "2026-12-31T00:00:00.000Z", referencePolicy: "SYNTHETIC TEST ONLY", reconciliation: { id: "synthetic-recon", portfolioId: "portfolio-1", asOf: stamp, receivedAt: stamp, sourceReference: "SYNTHETIC TEST ONLY independent fixture", cash: "10000", positions: [{ securityId: "SYNTHETIC-00", quantity: "100", openCost: "1000" }], receivables: "0", payables: "1000", unresolvedDiscrepancy: false }, analyst: null }));
    // All values are synthetic test evidence, only in this disposable test database.
    await db.registry.append({ ...methodologyFixture(method), family: "ACCOUNTING", approvalReference: "SYNTHETIC TEST ONLY", governanceStatus: "APPROVED", intendedUse: "PRODUCTION", implementationIdentity: ACCOUNTING_METHOD });
    const P = portfolioId("portfolio-1");
    await initializePortfolio(new PrismaPortfolioSetup(db.client), { id: P, name: "SYNTHETIC TEST ONLY — not a real portfolio", currency: "VND", inceptionAt: at(1), createdAt: NOW }, [{ id: securityId("SYNTHETIC-00"), name: "SYNTHETIC A" }, { id: securityId("security-b"), name: "SYNTHETIC B" }]);
    const engine = new PortfolioEngine(new PrismaPortfolioLedger(db.client), { now: () => NOW });
    await engine.post([{ ...deposit(), portfolioId: P }], watermark("0"));
    await engine.post([{ ...buy(), portfolioId: P, securityId: securityId("SYNTHETIC-00") }], watermark("1"));
    const f = workflowFixture(1, i => { i.portfolio.executableCash = "1000000"; i.portfolio.integrity.ledgerWatermark = "2"; });
    const x = await marginalDatabase(db, f);
    await x.workflow.create({ ...f.command, id: "hold-cash-review" });
    await x.workflow.create({ ...f.command, id: "weekly-review", type: "WEEKLY", sections: sections(WEEKLY_AREAS) });
    // Separate period, same approved decision lineage; marginal plan preserves cash.
    const marginal = await x.engine.create(marginalCommand(f, [marginalFrame(f)]));
    await x.workflow.create({ ...f.command, id: "marginal-review", period: "2026-10-marginal", marginalAllocationId: marginal.id });
    const proposalFixture = JSON.parse(JSON.stringify(workflowFixture(1, i => { i.portfolio.integrity.ledgerWatermark = "2"; i.assessment.sizing.fees = "0"; i.assessment.sizing.economicTargetUpper = "0.04"; }))
      .replaceAll('score-SYNTHETIC', 'proposal-score-SYNTHETIC').replaceAll('synthetic-rank', 'proposal-rank').replaceAll('workflow-decision', 'z-proposal-decision').replaceAll('snapshot-1', 'proposal-snapshot')) as ReturnType<typeof workflowFixture>;
    const y = await marginalDatabase(db, proposalFixture);
    const allocation = await y.engine.create({ ...marginalCommand(proposalFixture, [marginalFrame(proposalFixture), marginalFrame(proposalFixture, [0]), marginalFrame(proposalFixture, [0, 0])]), id: "proposal-marginal" });
    await y.workflow.create({ ...proposalFixture.command, id: "proposal-review", period: "2026-10-proposal", marginalAllocationId: allocation.id });
    await x.workflow.create({ ...f.command, id: "quarterly-review", type: "QUARTERLY", sections: sections(QUARTERLY_AREAS) });
    await x.workflow.create({ ...f.command, id: "annual-review", type: "ANNUAL", sections: sections(ANNUAL_AREAS), governance: "NO POLICY CHANGE" });
    await x.workflow.create({ ...f.command, id: "event-review", type: "EVENT_DRIVEN", triggers: [{ id: "synthetic-event", category: "COMPANY", priority: "HARD RISK / SOLVENCY / GOVERNANCE", severity: "T4", effectiveAt: f.command.asOf, evidenceRefs: ["decision-evidence"], verified: true, decisionReady: true, governingRule: "SYNTHETIC M5 event review", affectedSecurityId: f.decisions[0].securityId, requiredEvidence: "Formal decision refresh", rationale: "SYNTHETIC TEST ONLY material event" }] });
    await db.client.$disconnect();
    copyFileSync(db.config.filePath, destination);
  } finally { await db.close(); }
}
