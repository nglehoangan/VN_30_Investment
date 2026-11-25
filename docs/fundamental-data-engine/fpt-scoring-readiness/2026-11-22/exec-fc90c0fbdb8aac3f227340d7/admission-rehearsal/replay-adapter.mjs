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
const { inspectFptTechnologyInputs } = await jiti.import(resolve(root, 'tools/scoring/fpt-technology-adapter.ts'));
const { sha } = await jiti.import(resolve(root, 'src/infrastructure/source-admission/registry.ts'));
const pin = path => ({ path, sha256: sha(readFileSync(path)) });
const source = pin(relative(root, resolve(import.meta.dirname, 'FPT_TECHNOLOGY_INPUTS.json')));
const { context } = JSON.parse(readFileSync(source.path));
const path = realpathSync(process.argv[2]);
assert.ok(path.startsWith(realpathSync('/tmp') + '/'), 'USE_ISOLATED_SQLITE');
const db = new DatabaseSync(path, { readOnly: true });
try {
  const driver = { $queryRawUnsafe: async (sql, ...args) => db.prepare(sql).all(...args) };
  const actual = await inspectFptTechnologyInputs(driver, root, source, context);
  assert.equal(actual.topics.length, 23);
  assert.equal(actual.financialFacts, 9);
  assert.equal(actual.historyFacts, 88);
  assert.equal(actual.reportedBorrowings, '18449527497052');
  assert.deepEqual(await inspectFptTechnologyInputs(driver, root, source, context), actual);
  await assert.rejects(inspectFptTechnologyInputs(driver, root, source, { ...context, ticker: 'VNM' }), /FPT_TECHNOLOGY_SUBJECT_MISMATCH/);
  await assert.rejects(inspectFptTechnologyInputs(driver, root, source, { ...context, economicCutoff: '2026-11-15' }), /FPT_TECHNOLOGY_SUBJECT_MISMATCH/);
  await assert.rejects(inspectFptTechnologyInputs(driver, root, { ...source, sha256: '0'.repeat(64) }, context), /SOURCE_HASH_MISMATCH/);
  console.log(JSON.stringify({ status: 'ISOLATED_ADAPTER_REPLAY_PASS', adapter: pin('tools/scoring/fpt-technology-adapter.ts'),
    input: source, ...actual, formalRouteRegistered: false }, null, 2));
} finally {
  db.close();
}
