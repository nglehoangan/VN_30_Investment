import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@/infrastructure/db/generated/client';
import type { PreScoringContext } from '@/ports/pre-scoring-datasets';
import type { GovernedBankAdmissions } from '@/infrastructure/source-admission/current-bank-admission';
import { CurrentBankFinancialDatasets } from '@/infrastructure/source-admission/current-bank-dataset';
import { TcbBankFinancialDatasets } from '@/infrastructure/source-admission/tcb-bank-dataset';
import { sha } from '@/infrastructure/source-admission/registry';

const context: PreScoringContext = {
  ticker: 'TCB', securityId: '2a3c69b1-08aa-473c-bbd5-92d096a0d23a',
  economicCutoff: '2026-10-30', knownAt: '2026-11-22T08:00:00.000Z',
  purpose: 'CURRENT_FORMAL_VALUATION',
};
const capitalHash = '96eb45c3fb1b16eda3582aed795e7eaacaf53a41090cec85edfafef533fb6b91';
let scratch: string | undefined;
afterEach(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});

function fixture(carValue = '0.1495', carHash = capitalHash) {
  scratch = mkdtempSync(join(tmpdir(), 'tcb-bank-policy-'));
  const policy = 'docs/fundamental-data-engine/tcb-scoring-readiness/2026-11-22/exec-c636021bde64b53de84eb66e/TCB_BANK_CAPITAL_REQUIREMENTS_V2.json';
  writePolicy(join(scratch, policy), readFileSync(policy));
  const shareReview = join(dirname(policy), 'TCB_VERIFIED_SHARE_CHANGE.json');
  const reviewBytes = readFileSync(shareReview);
  writePolicy(join(scratch, shareReview), reviewBytes);
  const source = JSON.parse(reviewBytes.toString()).source.path as string;
  writePolicy(join(scratch, source), readFileSync(source));
  const names = ['TOTAL_ASSETS', 'TOTAL_EQUITY', 'NET_INCOME', 'BANK_GROSS_CUSTOMER_LOANS',
    'BANK_CUSTOMER_DEPOSITS', 'BANK_LOAN_LOSS_RESERVES', 'BANK_REPORTED_CAR'];
  const financial = names.map(itemId => ({
    itemId, scope: itemId === 'BANK_REPORTED_CAR' ? 'REGULATORY_CONSOLIDATED' : 'CONSOLIDATED',
    start: itemId === 'NET_INCOME' ? '2026-01-01' : '2026-06-30', end: '2026-06-30',
    vintage: 'fixture', unit: itemId === 'BANK_REPORTED_CAR' ? 'RATIO' : 'VND',
  }));
  const requirements = JSON.stringify({ contract: 'current-bank-dataset-requirements-v1',
    ticker: context.ticker, securityId: context.securityId, cutoff: context.economicCutoff, financial });
  writeFileSync(join(scratch, 'requirements.json'), requirements);
  const facts = financial.map(({ start, end, unit, ...requirement }) => {
    const isCar = requirement.itemId === 'BANK_REPORTED_CAR';
    const value = isCar ? carValue : '1000000';
    return { ...requirement, id: requirement.itemId, ticker: context.ticker, period: { start, end },
      value, rawHash: isCar ? carHash : 'a'.repeat(64),
      evidence: { unit, value, securityId: context.securityId, quality: 'VALID' } };
  });
  const admission = { consume: vi.fn(async () => ({ facts, plan: { versionId: 'fixture', approvalHash: 'fixture' } })) } as unknown as Pick<GovernedBankAdmissions, 'consume'>;
  const inputs = {
    requirements: { path: 'requirements.json', sha256: sha(requirements) },
    market: async () => ({ ticker: context.ticker, securityId: context.securityId, date: context.economicCutoff,
      value: '21600', unit: 'VND_PER_SHARE' as const, field: 'GiaDongCua' as const, lineage: {} }),
    shares: async () => ({ ticker: context.ticker, securityId: context.securityId, asOf: context.economicCutoff,
      value: '1', unit: 'SHARES' as const, status: 'CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS' as const,
      lineage: {} }),
  };
  let stored: { body: string; body_hash: string } | undefined;
  const db = {
    $queryRawUnsafe: vi.fn(async (sql: string) => sql.includes('FROM current_financial_dataset') && stored ? [stored] : []),
    $executeRawUnsafe: vi.fn(async (_sql: string, ...parameters: string[]) => {
      stored = { body: parameters[5], body_hash: parameters[6] };
    }),
    $transaction: async <T>(run: (tx: unknown) => Promise<T>) => run(db),
  };
  return { source: join(scratch, source), tcb: new TcbBankFinancialDatasets(db as unknown as PrismaClient, scratch, admission, inputs),
    legacy: new CurrentBankFinancialDatasets(db as unknown as PrismaClient, scratch, admission, inputs), writes: db.$executeRawUnsafe };
}

function writePolicy(path: string, bytes: Buffer) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
}

it('binds and replays the qualified TCB CAR with distinctly named Tier 1 and null CET1', async () => {
  const { tcb, writes } = fixture();
  const first = await tcb.bind('fixture', context);
  expect(first.manifest.capitalDispositions).toEqual({ car: '0.1495', tier1: '0.1406', cet1: null });
  expect(first.manifest.shares).toMatchObject({
    value: '10629355539', asOf: '2026-10-30', status: 'VERIFIED_EFFECTIVE_CHANGE',
    lineage: { effectiveDate: '2026-10-30', reportSignedDate: '2026-11-09',
      publicationDate: '2026-11-10', availableAt: '2026-11-22T07:31:21.230Z' },
  });
  expect((await tcb.consume(first.id, context)).datasetHash).toBe(first.datasetHash);
  expect((await tcb.bind('fixture', context)).duplicate).toBe(true);
  expect(writes).toHaveBeenCalledTimes(1);
});

it('keeps the legacy dual-capital requirement and rejects using the TCB exception for ACB', async () => {
  const { tcb, legacy, writes } = fixture();
  await expect(legacy.bind('fixture', context)).rejects.toThrow('BANK_CAPITAL_REQUIREMENTS_MISSING');
  await expect(tcb.bind('fixture', { ...context, ticker: 'ACB' })).rejects.toThrow('TCB_BANK_CAPITAL_REQUIREMENT_SCOPE');
  expect(writes).not.toHaveBeenCalled();
});

it.each([['0.1406', capitalHash], ['0.1495', 'b'.repeat(64)]])(
  'rejects a CAR value or source that differs from the approved disclosure', async (value, hash) => {
    const { tcb, writes } = fixture(value, hash);
    await expect(tcb.bind('fixture', context)).rejects.toThrow('TCB_BANK_CAR_EVIDENCE_MISMATCH');
    expect(writes).not.toHaveBeenCalled();
  },
);


it('rejects binding before the share issuance report is available', async () => {
  const { tcb, writes } = fixture();
  await expect(tcb.bind('fixture', { ...context, knownAt: '2026-11-22T07:31:21.229Z' }))
    .rejects.toThrow('TCB_BANK_SHARE_CHANGE_SCOPE_OR_TIME');
  expect(writes).not.toHaveBeenCalled();
});

it('rejects binding when the issuance source bytes change', async () => {
  const { tcb, source, writes } = fixture();
  writeFileSync(source, '%PDF-tampered');
  await expect(tcb.bind('fixture', context)).rejects.toThrow('SOURCE_HASH_MISMATCH');
  expect(writes).not.toHaveBeenCalled();
});

it('stops the TCB binding at exact owner admission approval before using any databases', async () => {
  const { createTcbBankBinding } = await import('@/infrastructure/source-admission/tcb-bank-binding');
  const path = 'docs/fundamental-data-engine/tcb-scoring-readiness/2026-11-22/exec-c636021bde64b53de84eb66e/TCB_BANK_VERSION_PROPOSED.json';
  const options = {
    approvedFinancialVersion: { path, sha256: sha(readFileSync(path)) },
    marketRoot: '/unopened',
    marketTrust: {
      currentAuthorization: () => null,
      capturedSource: () => null,
      independentMaterialAcceptance: () => null,
    },
  };
  expect(() => createTcbBankBinding({} as PrismaClient, process.cwd(), options))
    .toThrow('TCB_BANK_EXACT_ADMISSION_APPROVAL_REQUIRED');
});
