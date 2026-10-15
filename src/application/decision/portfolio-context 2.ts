import type { PortfolioEngine } from "@/application/portfolio/engine";
import { scopedIntegrity } from "@/application/scoring/portfolio-context";
import type { ReconciliationEvidence } from "@/domain/portfolio/reconciliation";
import { decimal } from "@/domain/portfolio/values";
import { deepFreeze } from "@/domain/portfolio/transaction";
import type { DecisionPortfolioRead } from "@/ports/decision";
import type { DecisionPortfolio } from "@/domain/decision/contracts";
import { requireDecision } from "@/domain/decision/validation";
type Derived = Awaited<ReturnType<PortfolioEngine["snapshot"]>>;
/** Reads the existing application snapshot, never ledger events or accounting SQL. */
export class DerivedDecisionPortfolioRead implements DecisionPortfolioRead {
  constructor(private readonly load: (asOf: string) => Promise<{ snapshot: Derived; evidence: ReconciliationEvidence | null; current: boolean }>,
    private readonly current: (snapshot: DecisionPortfolio) => Promise<boolean>) {}
  async read(asOf: string): Promise<DecisionPortfolio> {
    const { snapshot: s, evidence, current } = await this.load(asOf);
    requireDecision(s.asOf === asOf, "PORTFOLIO_ASOF_MISMATCH");
    const integrity = scopedIntegrity(s, evidence, current);
    // Cash includes contributions exactly once. Existing payable obligations are reserved.
    const executable = decimal(s.state.cash).sub(decimal(s.state.payables));
    return deepFreeze({ integrity: { ...integrity, snapshotId: `${integrity.snapshotId}:${s.valuation.inputVersion}:${s.referenceVersion}:${s.calculatedAt}` }, capturedAt: s.calculatedAt,
      nav: s.valuation.nav, executableCash: executable.negative ? "0" : executable.toString(),
      positions: s.valuation.positions.map(p => ({ securityId: p.securityId, shares: p.quantity, marketValue: p.marketValue, sector: s.reference.find(r => r.securityId === p.securityId)?.sector ?? null })) });
  }
  isCurrent(snapshot: DecisionPortfolio) { return this.current(snapshot); }
}
