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
const { CurrentFinancialDatasets } = await load('current-dataset.ts');
const pin = (path) => ({ path, sha256: sha(readFileSync(path)) });
const local = (name) => relative(root, join(import.meta.dirname, name));
const mapping = pin(local('FPT_Q3_MAPPING_CANDIDATE.json'));
const cellsPin = pin(local('FPT_Q3_REVIEWED_CELLS.json'));
const catalog = JSON.parse(readFileSync(mapping.path));
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
const altered = (changes) => adapter.plan({
  ...request, observations: [{ ...request.observations[0], ...changes }],
});
assert.equal(altered({ ticker: 'VNM' }).quarantine[0].reason, 'CROSS_TICKER_OBSERVATION');
assert.equal(altered({ value: '0' }).quarantine[0].reason, 'NATIVE_VALUE_MISMATCH');
assert.equal(altered({ scope: 'STANDALONE' }).quarantine[0].reason, 'OBSERVATION_DIMENSION_MISMATCH:scope');
assert.equal(adapter.plan({ ...request, economicCutoff: '2026-09-29' }).accepted.length, 0);
assert.equal(plan.accepted.find((f) => f.itemId === 'ASSET_PURCHASE_CASH_OUTFLOW').value, '2028801162827');
assert.equal(catalog.bindings.length, 9);

const dbPath = process.argv[2];
assert.ok(dbPath && realpathSync(dbPath).startsWith(realpathSync('/tmp') + '/'), 'Use a SQLite copy under /tmp');
const liveBefore = pin('data/vn30.sqlite');
const db = new DatabaseSync(dbPath);
const driver = {
  $executeRawUnsafe: async (sql, ...args) => db.prepare(sql).run(...args).changes,
  $queryRawUnsafe: async (sql, ...args) => db.prepare(sql).all(...args),
};
try {
  db.exec('CREATE TEMP TABLE candidate_fct (id TEXT PRIMARY KEY, body TEXT NOT NULL, sha256 TEXT NOT NULL)');
  const append = db.prepare('INSERT OR IGNORE INTO candidate_fct VALUES (?, ?, ?)');
  for (const fact of plan.accepted) {
    const body = JSON.stringify(fact);
    assert.equal(append.run(fact.mappingId, body, sha(body)).changes, 1);
    assert.equal(append.run(fact.mappingId, body, sha(body)).changes, 0);
  }
  const rows = db.prepare('SELECT body, sha256 FROM candidate_fct ORDER BY id').all();
  assert.equal(rows.length, plan.accepted.length);
  for (const row of rows) assert.equal(sha(row.body), row.sha256);
  assert.deepEqual(rows.map((row) => JSON.parse(row.body)), [...plan.accepted].sort((a, b) => a.mappingId < b.mappingId ? -1 : 1));

  const registry = pin('docs/fundamental-data-engine/vnm-f2-coverage-closure/2026-11-16/VERSIONED_SOURCE_REGISTRY_V6.json');
  // Existing trusted registry is read as-is. VNM document and identity pins are never used as FPT inputs.
  // Intentionally missing FPT composition ports stay absent. The catalog check rejects before accessing them.
  const admission = new CurrentFinancialAdmissions(driver, root, { registry: () => registry, mapping, clock: { now: () => clock } });
  let admissionFailure;
  await assert.rejects(() => admission.ingest(request, context.securityId), (err) => {
    admissionFailure = err.message;
    return /CURRENT_CATALOG_NOT_BOUND|CURRENT_ADAPTER_CODE_NOT_BOUND|SOURCE_HASH_CHANGED/.test(err.message);
  });
  const datasets = new CurrentFinancialDatasets(driver, root, admission, {});
  await assert.rejects(() => datasets.consume('current-dataset:FPT-PREFLIGHT-NOT-BOUND', context), /CURRENT_STORED_BODY_INTEGRITY/);
  const count = (name) => db.prepare('SELECT COUNT(*) AS n FROM ' + name + ' WHERE ticker = ?').get('FPT').n;
  assert.equal(count('current_financial_admission'), 0);
  assert.equal(count('current_financial_dataset'), 0);
  assert.deepEqual(pin('data/vn30.sqlite'), liveBefore);
  console.log(JSON.stringify({
    contract: 'fpt-isolated-admission-rehearsal-v1',
    context, mapping, cells: cellsPin, existingRegistry: registry,
    sourcePdfSha256: data.sourceReceipt.sha256,
    verifiedMappingRows: plan.accepted.length,
    isolatedCandidateReadback: 'PASS',
    candidateReplayDeduplication: 'PASS',
    negativeMappingChecks: ['cross-ticker', 'changed amount', 'scope mismatch', 'post-cutoff'],
    governedAdmission: { status: 'BLOCKED', reason: admissionFailure },
    governedDatasetReadback: 'NO_DATASET_BOUND',
    productionDatabaseHash: liveBefore.sha256,
    productionDatabaseUnchanged: true,
    formalTopicBindingsCreated: false,
    scoringAuthorized: false,
  }, null, 2));
} finally {
  db.close();
}
