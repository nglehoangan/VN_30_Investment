import type { PortfolioEngine } from "@/application/portfolio/engine";
import { DerivedDecisionPortfolioRead } from "@/application/decision/portfolio-context";
import type { ReconciliationEvidence } from "@/domain/portfolio/reconciliation";
import type { PortfolioLedger } from "@/ports/portfolio";
import type { WorkflowPortfolioRead } from "@/ports/workflow";
import type { WorkflowPortfolio } from "@/domain/workflow/contracts";
import { portfolioId, watermark } from "@/domain/portfolio/values";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { requireWorkflow } from "@/domain/workflow/validation";
type Derived = Awaited<ReturnType<PortfolioEngine["snapshot"]>>;
/** Loader resolves an explicitly captured M6.3 snapshot, never a mutable latest-price query. */
export class DerivedWorkflowPortfolioRead implements WorkflowPortfolioRead {
  constructor(private readonly load: (snapshotId: string) => Promise<{ snapshot: Derived; evidence: ReconciliationEvidence | null; current: boolean }>,
    private readonly current: (p: WorkflowPortfolio) => Promise<boolean>, private readonly ledger: PortfolioLedger) {}
  async read(snapshotId: string, asOf: string, contributionId: string | null, cutoff: string) {
    const captured = await this.load(snapshotId);
    const upstream = new DerivedDecisionPortfolioRead(async () => captured, async () => captured.current);
    const decisionContext = await upstream.read(asOf);
    requireWorkflow(decisionContext.integrity.snapshotId === snapshotId && captured.snapshot.calculatedAt <= cutoff, "PINNED_SNAPSHOT_REQUIRED");
    let contribution: WorkflowPortfolio["contribution"] = null;
    if (contributionId !== null) {
      const history = await this.ledger.read(portfolioId(decisionContext.integrity.portfolioId), watermark(decisionContext.integrity.ledgerWatermark));
      const t = history.transactions.find(t => t.facts.id === contributionId);
      requireWorkflow(t && t.facts.type === "CASH_DEPOSIT" && t.facts.effectiveAt <= asOf && t.createdAt <= cutoff && t.facts.amount && !history.transactions.some(r => r.facts.reversesId === contributionId && r.facts.effectiveAt <= asOf), "POSTED_EMBEDDED_CONTRIBUTION_REQUIRED");
      contribution = { transactionId: contributionId, amount: t.facts.amount, recordedAt: t.createdAt };
    }
    return deepFreeze({ decisionContext, ledgerCash: captured.snapshot.state.cash, reservedCash: captured.snapshot.state.payables, contribution });
  }
  isCurrent(p: WorkflowPortfolio) { return this.current(p); }
  async transaction(id: string, transactionId: string) {
    const history = await this.ledger.read(portfolioId(id));
    const t = history.transactions.find(t => t.facts.id === transactionId);
    requireWorkflow(!history.transactions.some(r => r.facts.reversesId === transactionId), "REVERSED_TRANSACTION");
    return t ?? null;
  }
}
