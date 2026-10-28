import type { PortfolioLedger } from "@/ports/portfolio";
import type { NavLedgerSnapshotReader, LedgerSnapshotV1 } from "@/ports/nav-read-adapters";
import type { CurrentNavRequestV1, NavDigest } from "@/domain/current-nav/contracts";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { portfolioId } from "@/domain/portfolio/values";
import { instant } from "@/shared/time";

export class NavReadError extends Error {
  constructor(readonly reason: string) { super(reason); }
}
export const adapterCheck = (condition: unknown, reason: string): void => { if (!condition) throw new NavReadError(reason); };
/** A capability wrapper: no commit, engine, projection or source repository is exposed. */
export class PortfolioNavLedgerReader implements Pick<PortfolioLedger, "read">, NavLedgerSnapshotReader {
  constructor(private readonly source: Pick<PortfolioLedger, "read">, private readonly hash: NavDigest) {}
  async read(id: Parameters<PortfolioLedger["read"]>[0], through?: Parameters<PortfolioLedger["read"]>[1]) {
    const read = JSON.parse(JSON.stringify(await this.source.read(id, through))) as Awaited<ReturnType<PortfolioLedger["read"]>>;
    adapterCheck(read.transactions.every(t => t.facts.portfolioId === id && t.status === "POSTED"), "LEDGER_PORTFOLIO_MISMATCH");
    // Replay is order-independent; stable history order also stabilizes source fact hashes.
    const transactions = [...read.transactions].sort((a, b) => a.facts.id < b.facts.id ? -1 : a.facts.id > b.facts.id ? 1 : 0);
    return deepFreeze({ ...read, transactions });
  }
  async snapshot(request: CurrentNavRequestV1, valuationAt: string, expected?: { readonly stateHash?: string; readonly factsHash?: string }): Promise<LedgerSnapshotV1> {
    const r = deepFreeze(JSON.parse(JSON.stringify(request)) as CurrentNavRequestV1);
    adapterCheck(r.version === "current-nav-request-v1" && r.purpose === "PORTFOLIO_NAV" && r.valuationMode === "LATEST_COMPLETED_EOD" && r.knowledgeMode === "RETROSPECTIVE", "UNSUPPORTED_LEDGER_READ_REQUEST");
    if (expected?.stateHash !== undefined) adapterCheck(/^[a-f0-9]{64}$/.test(expected.stateHash), "LEDGER_STATE_HASH_MISMATCH");
    if (expected?.factsHash !== undefined) adapterCheck(/^[a-f0-9]{64}$/.test(expected.factsHash), "LEDGER_FACTS_HASH_MISMATCH");
    const t = instant(valuationAt), k = instant(r.knowledgeCutoff), id = portfolioId(r.portfolioId);
    adapterCheck(t <= k, "FUTURE_ECONOMIC_OBSERVATION");
    const before = await this.read(id);
    adapterCheck(before.watermark === r.ledgerRevision, "LEDGER_REVISION_MISMATCH");
    adapterCheck(before.transactions.every(x => x.createdAt <= k && x.facts.eventAt <= k), "FUTURE_LEDGER_KNOWLEDGE");
    const state = reconstructPortfolio(id, before.transactions, t, before.watermark, before.inceptionAt);
    const factsHash = this.hash(before.transactions), stateHash = this.hash(state);
    adapterCheck(!expected?.stateHash || expected.stateHash === stateHash, "LEDGER_STATE_HASH_MISMATCH");
    adapterCheck(!expected?.factsHash || expected.factsHash === factsHash, "LEDGER_FACTS_HASH_MISMATCH");
    const after = await this.read(id);
    adapterCheck(after.watermark === before.watermark && this.hash(after) === this.hash(before), "STALE_LEDGER_SNAPSHOT");
    return deepFreeze({ version: "nav-ledger-read-v1", portfolioId: id, ledgerRevision: before.watermark, valuationAt: t, knowledgeCutoff: k, factsHash, stateHash, ledger: before, state, financiallyComplete: false });
  }
}
