import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const vitest = createRequire(realpathSync('node_modules/vitest/package.json'));
const vite = createRequire(vitest.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(vite.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const { sha, sourceBytes } = await jiti.import(resolve(root, 'src/infrastructure/source-admission/registry.ts'));
const { snapshotHash: hash } = await jiti.import(resolve(root, 'src/infrastructure/fundamentals/snapshot-hash.ts'));
const { evaluateDebtReceipt } = await jiti.import(resolve(root, 'src/domain/fundamentals/debt-contract.ts'));
const { RUBRICS } = await jiti.import(resolve(root, 'src/domain/scoring/methodology.ts'));
const local = name => relative(root, join(import.meta.dirname, name));
const pin = path => ({ path, sha256: sha(readFileSync(path)) });
const read = path => JSON.parse(readFileSync(path));
const seal = body => ({ ...body, bodyHash: hash(body) });
const checked = row => {
  assert.equal(sha(row.body), row.body_hash);
  return JSON.parse(row.body);
};
const path = realpathSync(process.argv[2]);
const primary = process.argv.includes('--primary-v8');
assert.ok(primary ? path === realpathSync('data/vn30.sqlite') : path.startsWith(realpathSync('/tmp') + '/'));
const db = new DatabaseSync(path, { readOnly: true });
try {
  const result = read(local(primary ? 'FPT_PRIMARY_ADMISSION_RESULT.json' : 'FPT_CUTOFF_RESULT.json'));
  const topicPath = local('FPT_CUTOFF_RUBRIC_HANDOFF.json');
  const topicHandoff = read(topicPath);
  const { context, datasetId } = result;
  assert.equal(context.ticker, 'FPT');
  const {knownAt: researchClock, ...researchSubject} = topicHandoff.context;
  const {knownAt, ...subject} = context;
  assert.deepEqual(researchSubject, subject);
  assert.ok(researchClock <= knownAt);
  if (!primary) assert.equal(topicHandoff.datasetId, datasetId);
  const dataset = checked(db.prepare('SELECT body,body_hash FROM current_financial_dataset WHERE id=? AND ticker=?').get(datasetId, 'FPT'));
  assert.deepEqual(dataset.manifest.facts, result.findings);
  const facts = dataset.manifest.facts.map(ref => {
    const fact = checked(db.prepare('SELECT body,body_hash FROM current_financial_fact WHERE id=? AND admission_id=?').get(ref.id, result.admissionId));
    assert.equal(hash(fact), ref.hash);
    return fact;
  });

  const historyRow = db.prepare('SELECT id,body,body_hash FROM fundamental_admission_run WHERE id=?').get('reviewed-vn30-20261019-FPT');
  const history = checked(historyRow);
  assert.equal(history.contract, 'structured-issuer-verified-current-v1');
  assert.equal(history.snapshotId, historyRow.id);
  assert.equal(history.canonicalFacts.length, 88);
  assert.ok(history.canonicalFacts.every(fact => fact.ticker === 'FPT' && fact.qualified === true && fact.period.end <= context.economicCutoff));
  const windows = Object.fromEntries([2022, 2023, 2024, 2025].map(year => {
    const annual = history.canonicalFacts.filter(fact => fact.period.end === year + '-12-31' && fact.scope === 'CONSOLIDATED');
    assert.ok(annual.some(fact => fact.period.start === year + '-01-01' && fact.itemId === 'REVENUE'));
    return [year, annual.map(({ id, itemId, period }) => ({ id, itemId, period }))];
  }));

  const periodEnd = '2026-06-30';
  const short = facts.find(fact => fact.itemId === 'SHORT_TERM_FINANCIAL_BORROWINGS' && fact.period.end === periodEnd);
  const long = facts.find(fact => fact.itemId === 'LONG_TERM_FINANCIAL_BORROWINGS' && fact.period.end === periodEnd);
  assert.ok(short && long && short.raw.sha256 === long.raw.sha256);
  const raw = short.raw;
  assert.equal(sourceBytes(root, raw).subarray(0, 5).toString(), '%PDF-');
  const notes = pin('data/manual-extracted-pdf/notes/FPT.json');
  const transcript = read(notes.path).documents.find(doc => doc.sourceHash === raw.sha256);
  const text = transcript.pages.filter(page => [47, 48].includes(page.page)).map(page => page.text).join('\n');
  for (const amount of ['16.368.916.886.521', '2.080.610.610.531', '1.003.635.638.154', '225.896.361', '812.037.290']) {
    assert.ok(text.includes(amount), amount);
  }
  const historicDebt = history.canonicalFacts.find(fact => fact.itemId === 'REPORTED_BORROWINGS' && fact.period.end === periodEnd);
  assert.ok(historicDebt && historicDebt.value === '18449527497052');
  const legacy = historicDebt.debtMetadata;
  const legacyReview = { path: legacy.evidenceReference, sha256: legacy.evidenceHash };
  sourceBytes(root, legacyReview);
  const { bodyHash, ...priorMetadata } = legacy;
  const reviewedAt = read(local('FPT_H1_REVIEWED_CELLS.json')).reviewKnownAt;
  const metadata = seal({ ...priorMetadata, reviewedAt, sourceHashes: [raw.sha256] });
  const receipt = seal({
    id: 'fpt-technology-h1-reported-borrowings', ticker: 'FPT', sector: 'TECHNOLOGY', periodEnd,
    shortCanonicalId: short.id, longCanonicalId: long.id, shortValue: short.value, longValue: long.value,
    currentPortion: '1003635638154', shortIncludesCurrentPortion: true, longIncludesCurrentPortion: false,
    knownFinancingItems: [
      { id: 'current-lease', amount: '225896361', alreadyIncludedIn: 'SHORT' },
      { id: 'noncurrent-lease', amount: '812037290', alreadyIncludedIn: 'LONG' },
    ].map(item => ({ ...item, kind: 'FINANCE_LEASE', applicable: true, verified: true,
      inclusionEvidenceVerified: true, evidenceReference: legacyReview.path })),
    reportedSurveyVerified: true, currentPortionVerified: true, metadata,
  });
  const validation = {
    analysisAt: context.economicCutoff + 'T23:59:59.999Z', systemKnownAt: context.knownAt,
    sourceBindings: [raw, notes, legacyReview],
    statements: [{ ticker: 'FPT', reportingScope: 'CONSOLIDATED', reportingPeriod: { end: periodEnd },
      SHA256: raw.sha256, verifiedHash: raw.sha256, reviewStatus: 'QUALIFIED' }],
  };
  const debt = evaluateDebtReceipt(receipt, facts, validation, hash);
  assert.equal(debt?.value, historicDebt.value);
  const { bodyHash: _receiptHash, ...receiptBody } = receipt;
  assert.equal(evaluateDebtReceipt(seal({ ...receiptBody, ticker: 'VNM' }), facts, validation, hash), null);
  assert.equal(evaluateDebtReceipt(seal({ ...receiptBody, shortValue: '0' }), facts, validation, hash), null);
  assert.equal(topicHandoff.rubrics.length, RUBRICS.length);
  const topics = RUBRICS.map(rubric => {
    const evidence = topicHandoff.rubrics.find(row => row.rubricId === rubric.id);
    assert.deepEqual(evidence.requiredFormalTopics, rubric.topics);
    for (const ref of evidence.researchEvidence) sourceBytes(root, ref);
    return { rubricId: rubric.id, topics: rubric.topics, researchReferences: evidence.researchEvidence,
      datasetTopicCandidates: rubric.id === 'VAL-PRIMARY' ? { price: dataset.manifest.price } : {},
      formalTopicBindings: evidence.formalTopicBindings };
  });
  console.log(JSON.stringify({
    contract: primary ? 'fpt-technology-scoring-inputs-primary-v8' : 'fpt-technology-scoring-inputs-isolated-v1', context, sector: 'TECHNOLOGY', datasetId,
    history: { admissionId: historyRow.id, bodyHash: historyRow.body_hash, qualifiedFactCount: 88, windows },
    debt: { status: 'PASS_REPORTED_BORROWINGS', value: debt.value, receipt, notes, pages: [47, 48],
      comprehensivePopulationVerified: false },
    evidence: { handoff: pin(topicPath), topics, formalTopicsBound: 0 },
    scoringRouteRegistered: false, readyForFormalPrepare: false,
  }, null, 2));
} finally {
  db.close();
}
