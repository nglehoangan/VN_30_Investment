import { realpathSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { PrismaClient } from '@/infrastructure/db/generated/client';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
import { checkedBody, type QualifiedCurrentFact } from '@/infrastructure/source-admission/current-financial';
import { evaluateDebtReceipt, type DebtPopulationReceipt } from '@/domain/fundamentals/debt-contract';
import { RUBRICS } from '@/domain/scoring/methodology';
import { sha, sourceBytes, type SourcePin } from '@/infrastructure/source-admission/registry';
import { CurrentPurposeScoringConsumer } from '@/infrastructure/source-admission/current-scoring-consumer';
import { assertNotRevoked } from '@/infrastructure/repositories/unified-admission';
import { canonicalJson } from '@/domain/fundamentals/snapshot';
import type { CurrentMarketValue, CurrentShareValue } from '@/infrastructure/source-admission/current-dataset';
import type { PreScoringContext, PreScoringDatasetReference } from '@/ports/pre-scoring-datasets';

type Stored = { body: string; body_hash: string };
type FactPin = { id: string; hash: string };
type Manifest = { ticker: string; securityId: string; economicCutoff: string; knownAt: string; purpose: string;
  admissionId: string; financialCoverageComplete: boolean; facts: FactPin[];
  price: CurrentMarketValue; shares: CurrentShareValue };
type ResearchTopic = { rubricId: string; topics: string[]; researchReferences: SourcePin[] };
type Inputs = {
  contract: string; sector: string; context: PreScoringContext; datasetId: string;
  history: { admissionId: string; bodyHash: string; qualifiedFactCount: number };
  debt: { value: string; receipt: DebtPopulationReceipt; notes: SourcePin };
  evidence: { handoff: SourcePin; topics: ResearchTopic[] };
};

function requireFpt(condition: unknown, message: string): asserts condition {
  if (!condition) throw Error(message);
}

/** Read-only preparation adapter. Registration as a formal scorer requires an accepted assessment and reference. */
async function readFptTechnologyInputs(db: PrismaClient, root: string, inputsPin: SourcePin, context: PreScoringContext) {
  const inputs = JSON.parse(sourceBytes(root, inputsPin).toString()) as Inputs;
  requireFpt(['fpt-technology-scoring-inputs-isolated-v1', 'fpt-technology-scoring-inputs-primary-v8'].includes(inputs.contract) && inputs.sector === 'TECHNOLOGY' &&
    context.ticker === 'FPT' && context.purpose === 'CURRENT_FORMAL_VALUATION' &&
    snapshotHash(inputs.context) === snapshotHash(context), 'FPT_TECHNOLOGY_SUBJECT_MISMATCH');
  const datasets = await db.$queryRawUnsafe<Stored[]>('SELECT body,body_hash FROM current_financial_dataset WHERE id=? AND ticker=?', inputs.datasetId, context.ticker);
  const { id, manifest } = checkedBody<{ id: string; manifest: Manifest }>(datasets[0]);
  requireFpt(id === inputs.datasetId && manifest.ticker === context.ticker && manifest.securityId === context.securityId &&
    manifest.economicCutoff === context.economicCutoff && manifest.knownAt === context.knownAt &&
    manifest.purpose === context.purpose && manifest.financialCoverageComplete, 'FPT_TECHNOLOGY_DATASET_SCOPE');
  const facts = await Promise.all(manifest.facts.map(async ref => {
    const rows = await db.$queryRawUnsafe<Stored[]>('SELECT body,body_hash FROM current_financial_fact WHERE id=? AND admission_id=?', ref.id, manifest.admissionId);
    const fact = checkedBody<QualifiedCurrentFact>(rows[0]);
    requireFpt(fact.id === ref.id && fact.ticker === context.ticker && snapshotHash(fact) === ref.hash, 'FPT_TECHNOLOGY_FACT_MISMATCH');
    return fact;
  }));
  const histories = await db.$queryRawUnsafe<Stored[]>('SELECT body,body_hash FROM fundamental_admission_run WHERE id=?', inputs.history.admissionId);
  const history = checkedBody<{ snapshotId: string; canonicalFacts: { ticker: string; qualified: boolean; period: { end: string } }[] }>(histories[0]);
  requireFpt(histories[0].body_hash === inputs.history.bodyHash && history.snapshotId === inputs.history.admissionId &&
    history.canonicalFacts.length === inputs.history.qualifiedFactCount && history.canonicalFacts.every(fact =>
      fact.ticker === context.ticker && fact.qualified && fact.period.end <= context.economicCutoff), 'FPT_TECHNOLOGY_HISTORY_MISMATCH');
  const { receipt } = inputs.debt;
  const short = facts.find(fact => fact.id === receipt.shortCanonicalId);
  const long = facts.find(fact => fact.id === receipt.longCanonicalId);
  requireFpt(short && long && short.raw.sha256 === long.raw.sha256 && receipt.sector === inputs.sector,
    'FPT_TECHNOLOGY_DEBT_OPERANDS');
  const sourceBindings = [short.raw, inputs.debt.notes, { path: receipt.metadata.evidenceReference, sha256: receipt.metadata.evidenceHash }];
  for (const pin of sourceBindings) sourceBytes(root, pin);
  const debt = evaluateDebtReceipt(receipt, facts, {
    analysisAt: context.economicCutoff + 'T23:59:59.999Z', systemKnownAt: context.knownAt, sourceBindings,
    statements: [{ ticker: context.ticker, reportingScope: short.scope, reportingPeriod: { end: short.period.end },
      SHA256: short.raw.sha256, verifiedHash: short.raw.sha256, reviewStatus: 'QUALIFIED' }],
  }, snapshotHash);
  requireFpt(debt && debt.value === inputs.debt.value, 'FPT_TECHNOLOGY_DEBT_REPLAY');
  sourceBytes(root, inputs.evidence.handoff);
  requireFpt(inputs.evidence.topics.length === RUBRICS.length, 'FPT_TECHNOLOGY_RUBRIC_SCOPE');
  const topics = RUBRICS.map(rubric => {
    const item = inputs.evidence.topics.find(row => row.rubricId === rubric.id);
    requireFpt(item && snapshotHash(item.topics) === snapshotHash(rubric.topics), 'FPT_TECHNOLOGY_TOPIC_SCOPE');
    for (const pin of item.researchReferences) sourceBytes(root, pin);
    return { rubricId: rubric.id, topics: rubric.topics, candidateTopics: rubric.id === 'VAL-PRIMARY' ? ['price'] : [] };
  });
  requireFpt(manifest.price.field === 'GiaDongCua' && manifest.price.date === context.economicCutoff &&
    manifest.price.unit === 'VND_PER_SHARE' && manifest.shares.asOf === context.economicCutoff, 'FPT_TECHNOLOGY_MARKET_SCOPE');
  const summary = { context, datasetId: id, historyAdmissionId: history.snapshotId, historyFacts: history.canonicalFacts.length,
    financialFacts: facts.length, reportedBorrowings: debt.value, price: manifest.price, shares: manifest.shares,
    topics, formalTopicAssessmentRequired: true, readyForScoring: false as const };
  return { summary, manifest, facts, history, receipt, short, debt };
}

export async function inspectFptTechnologyInputs(db: PrismaClient, root: string, inputsPin: SourcePin, context: PreScoringContext) {
  return (await readFptTechnologyInputs(db, root, inputsPin, context)).summary;
}

/** Persist an isolated rehearsal or the exact authorized V8 primary binding. */
export async function prepareFptTechnologyBinding(
  db: PrismaClient, root: string, inputsPin: SourcePin, context: PreScoringContext,
) {
  const databases = await db.$queryRawUnsafe<{name: string; file: string}[]>('PRAGMA database_list');
  const file = realpathSync(databases.find(row => row.name === 'main')?.file ?? '');
  const live = statSync(resolve(root, 'data/vn30.sqlite'));
  const candidate = statSync(file);
  const isPrimary = file === realpathSync(resolve(root, 'data/vn30.sqlite'));
  const isIsolated = file.startsWith(realpathSync('/tmp') + sep) &&
    !(live.dev === candidate.dev && live.ino === candidate.ino);
  requireFpt(isIsolated || (isPrimary && inputsPin.path === primaryInputs.path &&
    inputsPin.sha256 === primaryInputs.sha256), 'FPT_BINDING_DATABASE_SCOPE');

  return buildFptTechnologyBinding(db, root, inputsPin, context, true);
}

async function buildFptTechnologyBinding(
  db: PrismaClient, root: string, inputsPin: SourcePin, context: PreScoringContext, persist: boolean,
) {
  async function rebuild() {
    const input = await readFptTechnologyInputs(db, root, inputsPin, context);
    const { summary, manifest, facts, history, receipt, short, debt } = input;
    for (const id of [summary.datasetId, manifest.admissionId, history.snapshotId, ...facts.map(fact => fact.id)]) {
      await assertNotRevoked(db, id);
    }
    const debtId = 'current-reported-debt:' + snapshotHash(receipt);
    await assertNotRevoked(db, debtId);
    const reviewedAt = receipt.metadata.reviewedAt;
    const availableAt = [short.evidence.time.availableAt, reviewedAt, context.knownAt].sort().at(-1)!;
    const qualifiedDebtFact = {
      ...short, id: debtId, itemId: 'REPORTED_BORROWINGS', value: debt.value,
      evidence: {
        ...short.evidence, id: debtId, observation: 'REPORTED_BORROWINGS', value: debt.value,
        family: 'FINANCIAL_DERIVED' as const, receivedAt: availableAt,
        time: { ...short.evidence.time, qualificationReference: receipt.metadata.evidenceReference,
          reviewedAt, ingestedAt: context.knownAt, availableAt },
      },
    };
    const binding = {
      contract: inputsPin.sha256 === primaryInputs.sha256
        ? 'fpt-technology-primary-enrichment-v8' : 'fpt-technology-isolated-enrichment-v1', context, inputsPin, parentDatasetId: summary.datasetId,
      manifestHash: snapshotHash(manifest), historyAdmissionId: summary.historyAdmissionId, debtReceipt: receipt,
    };
    return { binding, manifest, coverage: {
      parentDatasetId: summary.datasetId, historicalWindowsBound: true, currentNativeCoreDebtQualified: true,
      qualifiedDebtFact, previouslyAdmittedHistory: history.canonicalFacts,
      research: { topics: summary.topics, formalTopicAssessmentRequired: true },
    }, native: { financialCoverageComplete: manifest.financialCoverageComplete, facts, price: manifest.price, shares: manifest.shares } };
  }

  const { binding, manifest } = await rebuild();
  const manifestHash = snapshotHash(binding);
  const bindingId = 'current-coverage:' + manifestHash;
  const body = canonicalJson({ id: bindingId, result: binding });
  const reference: PreScoringDatasetReference = {
    contract: 'current-purpose-pre-scoring-reference-v1', bindingId, context: { ...context },
    manifestHash, permitsScoring: false, historicalPitGranted: false,
  };
  if (persist) await db.$transaction(async tx => {
    await assertNotRevoked(tx, bindingId);
    const rows = await tx.$queryRawUnsafe<Stored[]>('SELECT body,body_hash FROM current_financial_enrichment WHERE id=?', bindingId);
    if (rows.length) {
      requireFpt(rows[0].body === body && rows[0].body_hash === sha(body), 'FPT_BINDING_ID_REUSE');
    } else {
      await tx.$executeRawUnsafe('INSERT INTO current_financial_enrichment VALUES(?,?,?,?,?)',
        bindingId, binding.parentDatasetId, manifest.admissionId, body, sha(body));
    }
  });
  const assertSubject = (requested: PreScoringContext) => {
    requireFpt(snapshotHash(requested) === snapshotHash(context), 'FPT_BINDING_CONTEXT_MISMATCH');
  };
  // The approved consumer uses only these three methods at runtime.
  type BindingInput = ReturnType<typeof rebuild> extends Promise<infer Input> ? Input : never;
  type ConsumerConstructor = new (
    database: PrismaClient,
    bindingReader: { verify(reference: PreScoringDatasetReference, context: PreScoringContext): Promise<void> },
    coverageReader: { consume(id: string, context: PreScoringContext): Promise<BindingInput['coverage']> },
    datasetReader: { consume(id: string, context: PreScoringContext): Promise<BindingInput['native']> },
  ) => CurrentPurposeScoringConsumer;
  const Consumer = CurrentPurposeScoringConsumer as unknown as ConsumerConstructor;
  const consumer = new Consumer(db, {
    async verify(candidateRef, requested) {
      assertSubject(requested);
      requireFpt(snapshotHash(candidateRef) === snapshotHash(reference), 'FPT_BINDING_REFERENCE_MISMATCH');
      await assertNotRevoked(db, bindingId);
      const rows = await db.$queryRawUnsafe<Stored[]>('SELECT body,body_hash FROM current_financial_enrichment WHERE id=?', bindingId);
      requireFpt(rows[0]?.body === body && rows[0].body_hash === sha(body), 'FPT_BINDING_STORED_MISMATCH');
    },
  }, {
    async consume(id, requested) {
      assertSubject(requested);
      requireFpt(id === bindingId, 'FPT_BINDING_REFERENCE_MISMATCH');
      const replay = await rebuild();
      requireFpt(snapshotHash(replay.binding) === manifestHash, 'FPT_BINDING_REPLAY_MISMATCH');
      return replay.coverage;
    },
  }, {
    async consume(id, requested) {
      assertSubject(requested);
      requireFpt(id === binding.parentDatasetId, 'FPT_BINDING_PARENT_MISMATCH');
      const replay = await rebuild();
      requireFpt(snapshotHash(replay.binding) === manifestHash, 'FPT_BINDING_REPLAY_MISMATCH');
      return replay.native;
    },
  });
  return { reference, consumer };
}

const primaryInputs: SourcePin = {
  path: 'docs/fundamental-data-engine/fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/admission-rehearsal/FPT_TECHNOLOGY_INPUTS_V8.json',
  sha256: 'ce7a6a45f562400a69e6f342320ecf5869ce8fe47bfdb1f2ebdbc8270574d3c4',
};

/** Formal CLI entry point. The worker supplies its read-only connection and exact subject. */
export async function createCurrentDatasetConsumer(
  db: PrismaClient, root: string,
  subject: { ticker: string; sector: string; securityId: string; cutoff: string; purpose: string },
) {
  const inputsPin = primaryInputs;
  const { context, sector } = JSON.parse(sourceBytes(root, inputsPin).toString()) as Inputs;
  requireFpt(subject.ticker === context.ticker && subject.sector === sector && subject.securityId === context.securityId &&
    subject.cutoff === context.economicCutoff && subject.purpose === context.purpose, 'FPT_TECHNOLOGY_SUBJECT_MISMATCH');
  return (await buildFptTechnologyBinding(db, root, inputsPin, context, false)).consumer;
}
