import type { PortfolioLedger } from "@/ports/portfolio";
import type { Wp1EvidenceReader } from "@/ports/accounting-preview";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import { buildTransaction, deepFreeze } from "@/domain/portfolio/transaction";
import { reconcileOwnership } from "@/domain/portfolio/ownership-reconciliation";
import { applyAccountingPreview, initialAccountingPreview, proposeWp1Events, type AccountingHash } from "@/domain/portfolio/accounting-event-preview";
import { requireRule, type PortfolioId, type LedgerWatermark } from "@/domain/portfolio/values";
import { instant } from "@/shared/time";

/** Read-only application workflow. No commit port, projection writer, NAV calculation or authority verifier. */
export class PortfolioAccountingValidation {
  constructor(private readonly ledger: Pick<PortfolioLedger, "read">, private readonly evidenceReader: Wp1EvidenceReader, private readonly hash: AccountingHash) {}
  async preview(input: { portfolioId: PortfolioId; expectedWatermark: LedgerWatermark; ledgerAsOf: string; calculatedAt: string; maxReceiptAgeMs: number }) {
    const calculatedAt = instant(input.calculatedAt), asOf = instant(input.ledgerAsOf);
    requireRule(asOf <= calculatedAt, "WP1_FUTURE_LEDGER_CUTOFF");
    const read = await this.ledger.read(input.portfolioId);
    requireRule(read.watermark === input.expectedWatermark, "WP1_STALE_LEDGER_REVISION");
    for (const t of read.transactions) {
      requireRule(t.facts.portfolioId === input.portfolioId && t.createdAt <= calculatedAt && t.legs.every(l => l.effectiveAt <= asOf), "WP1_LEDGER_CUTOFF_INCOMPLETE");
      const rebuilt = buildTransaction(t.facts, t.createdAt, read.transactions.filter(other => other.facts.id !== t.facts.id));
      requireRule(this.hash(rebuilt) === this.hash(t), "WP1_NONCANONICAL_LEDGER");
    }
    const state = reconstructPortfolio(input.portfolioId, read.transactions, asOf, read.watermark, read.inceptionAt);
    const evidence = deepFreeze(await this.evidenceReader.read());
    for (const pin of [evidence.openingEvidence, evidence.ownerEvidence, evidence.receiptEvidence, evidence.feeEvidence, evidence.feePolicyEvidence, evidence.openingHoldings, evidence.latestHoldings]) {
      if (pin.knownAt !== null) requireRule(instant(pin.knownAt) <= calculatedAt, "WP1_FUTURE_EVIDENCE");
      if (pin.retrievedAt !== null) requireRule(instant(pin.retrievedAt) <= calculatedAt, "WP1_FUTURE_EVIDENCE");
    }
    const scope = { accountReference: evidence.accountReference, sourceReference: evidence.latestHoldings.id,
      calculatedAt, economicAsOf: asOf, maxReceiptAgeMs: input.maxReceiptAgeMs };
    const reconciliation = reconcileOwnership(state.positions, evidence.ownership, scope);
    const plan = proposeWp1Events(state, read.transactions, evidence, this.hash);
    let preview = initialAccountingPreview(state);
    for (const event of plan.events) preview = applyAccountingPreview(preview, event, event);
    const projectedReconciliation = reconcileOwnership(preview.positions.map(p => ({ securityId: p.securityId, quantity: p.total })), evidence.ownership, scope);
    const latest = await this.ledger.read(input.portfolioId), currentEvidence = await this.evidenceReader.read();
    requireRule(latest.watermark === read.watermark && this.hash(latest) === this.hash(read), "WP1_LEDGER_CHANGED_DURING_PREVIEW");
    requireRule(this.hash(currentEvidence) === plan.evidenceHash, "WP1_EVIDENCE_CHANGED_DURING_PREVIEW");
    return deepFreeze({ status: "BLOCKED" as const, plan, state, preview, reconciliation, projectedReconciliation,
      financialBridgeExplained: true, commonEconomicCutoffCertified: false, productionAccepted: false, navAuthorized: false, tradingAuthorized: false, postingCommands: [] });
  }
}
