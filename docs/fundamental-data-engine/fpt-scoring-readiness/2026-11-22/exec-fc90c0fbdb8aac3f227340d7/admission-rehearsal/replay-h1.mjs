import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const vitestRequire = createRequire(realpathSync('node_modules/vitest/package.json'));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = (path) => jiti.import(resolve(root, 'src/infrastructure/source-admission', path));
const { sha } = await load('registry.ts');
const { RetainedFinancialAdmissionAdapter } = await load('retained-mapping.ts');
const { CurrentFinancialAdmissions } = await load('current-financial.ts');
const pin = (path) => ({ path, sha256: sha(readFileSync(path)) });
const local = (name) => relative(root, join(import.meta.dirname, name));
const mapping = pin(local('FPT_H1_MAPPING.json'));
const cellsPin = pin(local('FPT_H1_REVIEWED_CELLS.json'));
const data = JSON.parse(readFileSync(cellsPin.path));
const adapter = new RetainedFinancialAdmissionAdapter(root, mapping);
const clock = new Date().toISOString();
const context = {
  ticker: 'FPT',
  securityId: 'ec91b3cb-8eab-45ae-95e7-738bb3c7de52',
  economicCutoff: '2026-11-15',
  purpose: 'CURRENT_FORMAL_VALUATION',
  knownAt: clock,
};
const request = { ...context, observations: adapter.retainedObservations() };
delete request.securityId;
const plan = adapter.plan(request);
assert.equal(plan.accepted.length, data.cells.length);
assert.deepEqual(plan.quarantine, []);
assert.deepEqual(adapter.plan(request), plan);
assert.equal(plan.accepted.length, 9);
assert.deepEqual(plan.quarantine, []);
const dbPath = process.argv[2];
assert.ok(dbPath && realpathSync(dbPath).startsWith(realpathSync('/tmp') + '/'));
const productionBefore = pin('data/vn30.sqlite');
const db = new DatabaseSync(dbPath);
const driver = {
  $executeRawUnsafe: async (sql, ...args) => db.prepare(sql).run(...args).changes,
  $queryRawUnsafe: async (sql, ...args) => db.prepare(sql).all(...args),
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
try {
  const registry = pin(local('VERSIONED_SOURCE_REGISTRY_V7_FPT_ISOLATED.json'));
  const documents = pin(local('FPT_H1_DOCUMENT_BINDINGS.json'));
  const identities = pin('docs/fundamental-data-engine/evidence/2026-10-16-vn30-data-initialization-final-closure/VN30_UNIVERSE_RECONCILIATION.json');
  const composition = { registry: () => registry, mapping, documents, identities, clock: { now: () => clock } };
  const admissions = new CurrentFinancialAdmissions(driver, root, composition);
  const admitted = await admissions.ingest(request, context.securityId);
  const consumed = await admissions.consume(admitted.id, context);
  assert.deepEqual(consumed.facts.map(f => [f.itemId, f.value]).sort(), plan.accepted.map(f => [f.itemId, f.value]).sort());
  const retry = await admissions.ingest(request, context.securityId);
  assert.equal(retry.id, admitted.id);
  assert.equal(retry.duplicate, true);
  const q3Mapping = pin(local('FPT_Q3_MAPPING_CANDIDATE.json'));
  const q3 = new CurrentFinancialAdmissions(driver, root, { ...composition, mapping: q3Mapping });
  assert.throws(() => q3.plan(request, context.securityId), /CURRENT_CATALOG_NOT_BOUND/);
  const priceFile = pin('data/market-history/cafef/FPT.json');
  const priceHistory = JSON.parse(readFileSync(priceFile.path));
  assert.equal(priceHistory.prices.some(row => row.date === context.economicCutoff && row.raw?.GiaDongCua > 0), false);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM current_financial_dataset WHERE ticker = ?').get('FPT').n, 0);
  assert.deepEqual(pin('data/vn30.sqlite'), productionBefore);
  console.log(JSON.stringify({
    context, registry, mapping, documents, identities,
    sourcePdfSha256: data.sourceReceipt.sha256,
    admissionId: admitted.id,
    admittedFacts: consumed.facts.map(({itemId, value, period, unit, currency}) => ({itemId, value, period, unit, currency})),
    governedFinancialReadback: 'PASS', duplicateReplay: 'PASS',
    q3MappingStillExcluded: true, fullDatasetReadback: 'NOT_BOUND',
    market: { priceFile, lastRetainedDate: priceHistory.prices.at(-1).date, exactCutoffPrice: 'MISSING' },
    productionDatabaseUnchanged: true, scoringAuthorized: false,
  }, null, 2));
} finally {
  db.close();
}
