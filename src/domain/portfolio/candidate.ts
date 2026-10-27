import { buildTransaction, type Transaction, type TransactionInput } from "@/domain/portfolio/transaction";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import { requireRule, type LedgerWatermark, type PortfolioId } from "@/domain/portfolio/values";
import type { Instant } from "@/shared/time";

/** Run inside the authoritative commit callback, after its revision claim. */
export function prepareCandidate(id: PortfolioId, history: readonly Transaction[], drafts: readonly TransactionInput[], now: Instant, next: LedgerWatermark) {
  const complete = [...history], additions: Transaction[] = [];
  for (const f of drafts) {
    requireRule(!complete.some(t => t.facts.id === f.id || t.facts.idempotencyKey === f.idempotencyKey ||
      (t.facts.source.source === f.source.source && t.facts.source.reference === f.source.reference)), "DUPLICATE_SOURCE_REFERENCE");
    const transaction = buildTransaction(f, now, complete);
    complete.push(transaction); additions.push(transaction);
  }
  // Replay validates EACH event/correction boundary, not just the final balances.
  // Include existing later legs too: a new earlier event can invalidate a previously valid future sale.
  const horizon = complete.reduce((cutoff, t) => t.legs.reduce((last, leg) => leg.effectiveAt > last ? leg.effectiveAt : last, cutoff), now);
  reconstructPortfolio(id, complete, horizon, next);
  return additions;
}
