import { prepareCandidate } from "./candidate";
import { completePost } from "./post-commit";
import { deriveSupportedInception, type InceptionInputs } from "@/domain/portfolio/inception";
import type { Clock } from "@/ports/runtime";
import type { PortfolioLedger, PortfolioProjection } from "@/ports/portfolio";
import type { TransactionInput } from "@/domain/portfolio/transaction";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import { valuePortfolio, type ValuationInputs } from "@/domain/portfolio/valuation";
import { reconcilePortfolio, type ReconciliationEvidence } from "@/domain/portfolio/reconciliation";
import { referenceAt, type ReferenceData } from "@/domain/portfolio/reference";
import { decimal, requireRule, watermark, type PortfolioId, type LedgerWatermark } from "@/domain/portfolio/values";
import { vietnamBusinessDate, type Instant } from "@/shared/time";
/** Explicit post command, not a pending-event CRUD service. Every affected historical transition is revalidated. */
export class PortfolioEngine {
  constructor(private readonly ledger: PortfolioLedger, private readonly clock: Clock, private readonly projection?: PortfolioProjection) {}
  async post(inputs: readonly TransactionInput[], expected: LedgerWatermark) {
    requireRule(inputs.length > 0 && inputs.length <= 100, "BOUNDED_POST_BATCH_REQUIRED");
    const drafts = JSON.parse(JSON.stringify(inputs)) as TransactionInput[];
    const id = drafts[0].portfolioId, now = this.clock.now();
    requireRule(drafts.every(f => f.portfolioId === id), "MIXED_PORTFOLIO_BATCH");
    if (drafts.length > 1) requireRule(drafts[0].correctionGroupId && drafts.every(f => f.correctionGroupId === drafts[0].correctionGroupId && f.effectiveAt === drafts[0].effectiveAt), "ATOMIC_CORRECTION_GROUP_REQUIRED");
    const committed = await this.ledger.commit(id, expected, history =>
      prepareCandidate(id, history, drafts, now, watermark((BigInt(expected) + 1n).toString())));
    return completePost(id, committed, now, this.ledger, this.projection);
  }

  async reverse(input: TransactionInput & { readonly type: "REVERSAL" }, expected: LedgerWatermark) {
    requireRule(input.type === "REVERSAL", "REVERSAL_COMMAND_REQUIRED");
    return this.post([input], expected);
  }
  async reconstruct(id: PortfolioId, asOf: Instant, through?: LedgerWatermark) {
    const read = await this.ledger.read(id, through);
    return reconstructPortfolio(id, read.transactions, asOf, read.watermark, read.inceptionAt);
  }
  async snapshot(id: PortfolioId, asOf: Instant, prices: ValuationInputs, evidence: ReconciliationEvidence | null, references: ReferenceData, taxonomy: string, inceptionInputs: InceptionInputs | null = null) {
    const read = await this.ledger.read(id), calculatedAt = this.clock.now();
    const state = reconstructPortfolio(id, read.transactions, asOf, read.watermark, read.inceptionAt);
    const inception = deriveSupportedInception(id, read.transactions, read.watermark, read.inceptionAt, inceptionInputs, taxonomy, calculatedAt);
    requireRule(prices.observations.every(o => o.receivedAt <= calculatedAt), "FUTURE_PRICE_EVIDENCE");
    const valuation = valuePortfolio(state, prices, inception), reconciliation = reconcilePortfolio(state, evidence, calculatedAt);
    const reference = state.positions.filter(p => decimal(p.quantity).positive).map(p => referenceAt(references, p.securityId, vietnamBusinessDate(asOf), taxonomy));
    const latest = await this.ledger.read(id);
    const stale = latest.watermark !== state.ledgerWatermark;
    const referenceBlocked = reference.some(r => r.membership === "UNKNOWN_OR_UNSUPPORTED" || r.sector === null);
    return { portfolioId: id, asOf, calculatedAt, inception, ledgerWatermark: state.ledgerWatermark, state, valuation, reconciliation, reference,
      referenceVersion: references.version, status: stale ? "STALE" : valuation.status === "VALID" && inception.status === "VALID" && !reconciliation.actionabilityBlocked && !referenceBlocked ? "VALID" : "BLOCKED",
      actionabilityBlocked: stale || valuation.status !== "VALID" || inception.status !== "VALID" || reconciliation.actionabilityBlocked || referenceBlocked } as const;
  }
  async isSnapshotCurrent(snapshot: { portfolioId: PortfolioId; ledgerWatermark: LedgerWatermark; referenceVersion: string; valuation: { inputVersion: string }; inception?: { kind: string; priceVersion: string | null; referenceVersion: string | null } }, versions: { referenceVersion: string; priceVersion: string; inceptionPriceVersion?: string; inceptionReferenceVersion?: string }) {
    return await this.isCurrent(snapshot) && snapshot.referenceVersion === versions.referenceVersion && snapshot.valuation.inputVersion === versions.priceVersion &&
      (!snapshot.inception || snapshot.inception.kind === "ZERO" ||
        (snapshot.inception.priceVersion === versions.inceptionPriceVersion && snapshot.inception.referenceVersion === versions.inceptionReferenceVersion));
  }
  async isCurrent(snapshot: { portfolioId: PortfolioId; ledgerWatermark: LedgerWatermark }) {
    return (await this.ledger.read(snapshot.portfolioId)).watermark === snapshot.ledgerWatermark;
  }
}
