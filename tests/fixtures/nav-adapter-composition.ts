import type { PortfolioLedger } from "@/ports/portfolio";
import type { BrokerEvidenceReader, BlockedNavInputsV1 } from "@/ports/nav-read-adapters";
import type { Clock } from "@/ports/runtime";
import type { CurrentNavRequestV1, CurrentNavResultV1, NavDigest } from "@/domain/current-nav/contracts";
import { PortfolioNavLedgerReader } from "@/application/current-nav/ledger-read-adapter";
import { ReadOnlyNavInputProvider, type NavReadAdapterScope } from "@/application/current-nav/input-provider-skeleton";
import { CurrentNavReadService } from "@/application/current-nav/read-service";
import { deepFreeze } from "@/domain/portfolio/transaction";
/** Test-only composition. New provider per invocation; no global last-result cache or write capability. */
export function isolatedNavAdapters(source: Pick<PortfolioLedger, "read">, broker: BrokerEvidenceReader, scope: NavReadAdapterScope, clock: Clock, hash: NavDigest) {
  return Object.freeze({ async read(request: CurrentNavRequestV1): Promise<{ readonly nav: CurrentNavResultV1; readonly preparation: BlockedNavInputsV1 | null }> {
    const ledger = new PortfolioNavLedgerReader(source, hash), provider = new ReadOnlyNavInputProvider(ledger, broker, scope, hash);
    let preparation: BlockedNavInputsV1 | null = null;
    const nav = await new CurrentNavReadService(ledger, {
      async load(r, l, c) { preparation = await provider.prepare(r, c, l.factsHash); return null; },
      async isCurrent(h) { return provider.isCurrent(h); },
    }, clock, hash).read(request);
    return deepFreeze({ nav, preparation });
  } });
}
