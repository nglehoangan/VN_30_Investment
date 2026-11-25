import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { relative, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const vitest = createRequire(realpathSync('node_modules/vitest/package.json'));
const vite = createRequire(vitest.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(vite.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const { prepareFptTechnologyBinding, createCurrentDatasetConsumer } = await jiti.import(resolve(root, 'tools/scoring/fpt-technology-adapter.ts'));
const { sha } = await jiti.import(resolve(root, 'src/infrastructure/source-admission/registry.ts'));
const pin = path => ({ path, sha256: sha(readFileSync(path)) });
const successor = process.argv.includes('--v8');
const primary = process.argv.includes('--apply-primary');
const source = pin(relative(root, resolve(import.meta.dirname,
  successor ? 'FPT_TECHNOLOGY_INPUTS_V8.json' : 'FPT_TECHNOLOGY_INPUTS.json')));
const { context } = JSON.parse(readFileSync(source.path));
const path = realpathSync(process.argv[2]);
assert.ok(primary ? successor && path === realpathSync('data/vn30.sqlite') : path.startsWith(realpathSync('/tmp') + '/'));
const db = new DatabaseSync(path);
db.exec('PRAGMA foreign_keys=ON');
const liveBefore = pin('data/vn30.sqlite');
try {
  const driver = {
    $queryRawUnsafe: async (sql, ...args) => db.prepare(sql).all(...args),
    $executeRawUnsafe: async (sql, ...args) => db.prepare(sql).run(...args).changes,
    async $transaction(callback) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const result = await callback(this);
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
  const { reference, consumer } = await prepareFptTechnologyBinding(driver, root, source, context);
  const data = await consumer.resolve(reference, context);
  if (successor) {
  const reader = new DatabaseSync(path, { readOnly: true });
  try {
    const readDriver = {
      $queryRawUnsafe: async (sql, ...args) => reader.prepare(sql).all(...args),
      $transaction: callback => callback(readDriver),
    };
    const cliConsumer = await createCurrentDatasetConsumer(readDriver, root, {
      ...context, cutoff: context.economicCutoff, sector: 'TECHNOLOGY',
    });
    assert.deepEqual(await cliConsumer.resolve(reference, context), data);
    await assert.rejects(createCurrentDatasetConsumer(readDriver, root, {
      ...context, cutoff: context.economicCutoff, sector: 'BANK',
    }), /FPT_TECHNOLOGY_SUBJECT_MISMATCH/);
  } finally {
    reader.close();
  }
  }
  assert.equal(data.facts.length, 10);
  assert.equal(data.history.length, 88);
  assert.equal(data.price.value, '50100');
  assert.equal(data.shares.value, '1885727648');
  assert.equal(data.facts.find(fact => fact.itemId === 'REPORTED_BORROWINGS').value, '18449527497052');
  assert.equal(data.readyForScoring, false);
  assert.deepEqual((await prepareFptTechnologyBinding(driver, root, source, context)).reference, reference);
  assert.deepEqual(await consumer.resolve(reference, context), data);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM current_scoring_data_acceptance WHERE binding_id=?').get(reference.bindingId).n, 1);
  await assert.rejects(consumer.resolve({ ...reference, manifestHash: '0'.repeat(64) }, context), /FPT_BINDING_REFERENCE_MISMATCH/);
  await assert.rejects(consumer.resolve(reference, { ...context, ticker: 'VNM' }), /FPT_BINDING_CONTEXT_MISMATCH/);
  await assert.rejects(consumer.resolve(reference, { ...context, economicCutoff: '2026-11-15' }), /FPT_BINDING_CONTEXT_MISMATCH/);
  if (!primary) assert.deepEqual(pin('data/vn30.sqlite'), liveBefore);
  console.log(JSON.stringify({ status: 'CURRENT_PURPOSE_SCORING_CONSUMER_READBACK_PASS', reference,
    dataAcceptanceId: data.dataAcceptanceId, parentDatasetId: data.parentDatasetId, facts: data.facts.length,
    historyFacts: data.history.length, debt: data.facts.find(fact => fact.itemId === 'REPORTED_BORROWINGS').value,
    duplicateReplay: 'PASS', productionDatabaseUnchanged: !primary, readyForScoring: data.readyForScoring,
    implementation: [pin('tools/scoring/fpt-technology-adapter.ts'), pin('src/infrastructure/source-admission/current-scoring-consumer.ts')], inputs: source }, null, 2));
} finally {
  db.close();
}
