import type { PrismaClient } from '@/infrastructure/db/generated/client';
import type { PreScoringContext } from '@/ports/pre-scoring-datasets';
import { instant } from '@/shared/time';
import { buildCafefCandidate, consumeCafefValuation, type StandingProfile, type StandingTrust } from '@/infrastructure/market-boundary/cafef-standing';
import { PrismaBoundaryStore } from '@/infrastructure/repositories/market-boundary';
import { GovernedBankAdmissions } from './current-bank-admission';
import { sourceBytes, type SourcePin } from './registry';
import { TcbBankFinancialDatasets } from './tcb-bank-dataset';

type BindingVersion = Parameters<typeof import('./current-bank-admission').bankVersionApprovalHash>[0] & {
  binding: { requirements: SourcePin; marketCapture: SourcePin; marketKnownAt: string };
};


type BindingSources = {
  approvedFinancialVersion: SourcePin;
  marketRoot: string;
  marketTrust: StandingTrust;
};

// Compose the current BANK dataset from the approved financial catalog and the accepted CaféF record.
// The host supplies the standing market authority and replay root.
export function createTcbBankBinding(
  db: PrismaClient, root: string, sources: BindingSources, clock = { now: () => new Date().toISOString() },
) {
  const version = JSON.parse(sourceBytes(root, sources.approvedFinancialVersion).toString()) as BindingVersion;
  const { subject, binding } = version;
  if (version.status !== 'APPROVED' || !version.ownerSource || !binding ||
      subject.ticker !== 'TCB' || subject.exchange !== 'HOSE' || subject.sector !== 'BANK' ||
      subject.securityId !== '2a3c69b1-08aa-473c-bbd5-92d096a0d23a' || subject.referenceDate !== '2026-10-30') {
    throw Error('TCB_BANK_EXACT_ADMISSION_APPROVAL_REQUIRED');
  }
  const admission = new GovernedBankAdmissions(db, root, () => sources.approvedFinancialVersion, clock);
  const marketStore = new PrismaBoundaryStore(db, { now: () => instant(clock.now()) });
  async function market(context: PreScoringContext) {
    if (context.ticker !== subject.ticker || context.securityId !== subject.securityId ||
        context.economicCutoff !== subject.referenceDate || context.purpose !== 'CURRENT_FORMAL_VALUATION') {
      throw Error('TCB_BANK_BINDING_CONTEXT');
    }
    const profile = JSON.parse(sourceBytes(sources.marketRoot, subject.universe.profile).toString()) as StandingProfile;
    if (instant(context.knownAt) < instant(binding.marketKnownAt)) throw Error('TCB_MARKET_LATER_KNOWLEDGE');
    const candidate = buildCafefCandidate(sources.marketRoot, profile, {
      ticker: subject.ticker, exchange: subject.exchange, date: subject.referenceDate,
      knownAt: binding.marketKnownAt, raw: binding.marketCapture,
    });
    const market = await consumeCafefValuation(sources.marketRoot, candidate, sources.marketTrust, marketStore, {
      mode: 'HISTORICAL', purpose: 'VALUATION', securityIds: [subject.securityId],
      requestedAt: candidate.market.body.requestedAsOf, knownAt: binding.marketKnownAt,
      now: binding.marketKnownAt, universe: candidate.market.body.universe,
    }, { now: () => instant(binding.marketKnownAt) });
    const observation = market.observation;
    return {
      ticker: observation.ticker, securityId: observation.securityId, date: observation.tradingDate,
      value: observation.value, field: 'GiaDongCua' as const, unit: 'VND_PER_SHARE' as const,
      lineage: { raw: binding.marketCapture, marketHash: candidate.market.contentHash, responseSha256: candidate.provenance.responseSha256 },
    };
  }
  const dataset = new TcbBankFinancialDatasets(db, root, admission, { requirements: binding.requirements, market });
  return {
    async materialize(context: PreScoringContext) {
      await market(context);
      const accepted = await admission.ingest(context);
      return dataset.bind(accepted.id, context);
    },
    consume: (id: string, context: PreScoringContext) => dataset.consume(id, context),
  };
}
