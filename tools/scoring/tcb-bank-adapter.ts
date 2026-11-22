import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { PrismaClient } from '@/infrastructure/db/generated/client';
import { CurrentBankScoringConsumer } from '@/infrastructure/source-admission/current-bank-scoring';
import { createTcbBankBinding } from '@/infrastructure/source-admission/tcb-bank-binding';
import { VersionStandingAuthority, type VersionAuthorityBindings } from '@/infrastructure/source-admission/versioned-authority';
import type { StandingProfile } from '@/infrastructure/market-boundary/cafef-standing';
import { sha, sourceBytes, type SourcePin } from '@/infrastructure/source-admission/registry';

const approval: SourcePin = {
  path: 'docs/fundamental-data-engine/tcb-scoring-readiness/2026-11-22/exec-c636021bde64b53de84eb66e/TCB_BANK_VERSION_APPROVED.json',
  sha256: 'bd8c5eafb4d2aa8ac82e69330cc72a486ba0bca3540ad7cf7f13c81eaf43e6dc',
};
const references: SourcePin = {
  path: 'docs/fundamental-data-engine/vnm-f1-membership-closure/2026-11-15/TRUSTED_SOURCE_INPUTS_SUCCESSOR.json',
  sha256: 'ff8cc3044040841aa7db775f2fa8fbe71b6a37814525d1e84d92611219d948fa',
};
const registry: SourcePin = {
  path: 'docs/fundamental-data-engine/standing-authority-version/2026-11-12/VERSIONED_SOURCE_REGISTRY.json',
  sha256: '8846af07ce6ffc13bc016ada5da635e8f964d8f7a6d1c9b8097c448f26336fea',
};
type Subject = { ticker: string; securityId: string; sector: string; cutoff: string };

export function createCurrentDatasetConsumer(db: PrismaClient, root: string, subject: Subject) {
  if (subject.ticker !== 'TCB' || subject.sector !== 'BANK' || subject.cutoff !== '2026-10-30' ||
      subject.securityId !== '2a3c69b1-08aa-473c-bbd5-92d096a0d23a') {
    throw Error('TCB_BANK_ADAPTER_SCOPE_MISMATCH');
  }
  const json = <T>(pin: SourcePin): T => JSON.parse(sourceBytes(root, pin).toString());
  const version = json<{ subject: { universe: { profile: SourcePin } }; binding: { marketCapture: SourcePin } }>(approval);
  const profilePin = version.subject.universe.profile;
  const profile = json<StandingProfile>(profilePin);
  const trustRefs = json<Pick<VersionAuthorityBindings, 'marketReferences'>>(references);
  const registryInfo = json<{ ownerDecision: SourcePin; legacyAuthorizations: { F1: SourcePin } }>(registry);
  const owner = json<{ source: SourcePin }>(profile.authorization);
  type DatasetPort = ConstructorParameters<typeof CurrentBankScoringConsumer>[1];
  const datasets = {
    async consume(...args: Parameters<DatasetPort['consume']>) {
      const marketRoot = mkdtempSync(join(tmpdir(), 'tcb-bank-replay-'));
      try {
        const pins = [registry, registryInfo.ownerDecision, registryInfo.legacyAuthorizations.F1, owner.source,
          version.binding.marketCapture, profilePin, profile.policyFile, profile.authorization, profile.membership,
          profile.membership.identitySource, profile.unitSource, profile.unitReceipt, ...profile.calendarSources, ...profile.code];
        for (const pin of new Map(pins.map(pin => [pin.path, pin])).values()) {
          const bytes = pin.path === 'scripts/cafef-standing.mjs'
            ? execFileSync('git', ['cat-file', 'blob', 'a087ca60d1dcbdfa6177175a844ac720ca799948'], { cwd: root })
            : sourceBytes(root, pin);
          if (sha(bytes) !== pin.sha256) throw Error('TCB_MARKET_REPLAY_PIN_MISMATCH');
          const destination = join(marketRoot, pin.path);
          mkdirSync(dirname(destination), { recursive: true });
          writeFileSync(destination, bytes, { flag: 'wx' });
        }
        const authority = new VersionStandingAuthority(marketRoot, () => registry, {
          marketReferences: trustRefs.marketReferences,
          catalogs: { cafef: [version.binding.marketCapture], apiReceipts: [], pdfReceipts: [],
            pdfExtractions: [], financialSemantics: [] },
        });
        return await createTcbBankBinding(db, root, {
          approvedFinancialVersion: approval, marketRoot, marketTrust: authority.marketTrust(),
        }).consume(...args);
      } finally {
        rmSync(marketRoot, { recursive: true, force: true });
      }
    },
  };
  // The existing BANK consumer reads the shared manifest and fact fields, including string-valued share status.
  return new CurrentBankScoringConsumer(db, datasets as unknown as DatasetPort, { ...subject, sector: 'BANK' });
}
