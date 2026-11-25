import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const vitestRequire = createRequire(realpathSync('node_modules/vitest/package.json'));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src'), 'server-only': resolve(root, 'node_modules/next/dist/compiled/server-only/empty.js') }, fsCache: false });
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
const registryName = process.argv.includes('--primary-successor')
  ? 'VERSIONED_SOURCE_REGISTRY_V8_FPT_PRIMARY.json'
  : 'VERSIONED_SOURCE_REGISTRY_V7_FPT_ISOLATED.json';
const registry = pin(local(registryName));
const registryBody = JSON.parse(readFileSync(registry.path));
const isSuccessor = registryBody.registrationScope === 'FPT_PRIMARY_SQLITE_DATA_ADMISSION_ONLY';
const clock = isSuccessor ? registryBody.recordedAt : process.argv.includes('--replay-retained-clock')
  ? JSON.parse(readFileSync(local('FPT_CUTOFF_RESULT.json'))).context.knownAt
  : new Date().toISOString();
const context = {
  ticker: 'FPT',
  securityId: 'ec91b3cb-8eab-45ae-95e7-738bb3c7de52',
  economicCutoff: '2026-11-13',
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
assert.ok(dbPath, 'SQLite path required');
const liveDb = realpathSync('data/vn30.sqlite');
const targetDb = realpathSync(dbPath);
const primary = process.argv.includes('--apply-primary');
assert.ok(primary ? isSuccessor && targetDb === liveDb : targetDb.startsWith(realpathSync('/tmp') + '/'));
if (isSuccessor) {
  assert.deepEqual(registryBody.target, {
    database: 'data/vn30.sqlite', ticker: context.ticker, economicCutoff: context.economicCutoff, purpose: context.purpose,
  });
  assert.deepEqual(pin(registryBody.primaryAdmissionOwnerRequest.path), registryBody.primaryAdmissionOwnerRequest);
}
const productionBefore = pin('data/vn30.sqlite');
const { PrismaClient } = await jiti.import(resolve(root, 'src/infrastructure/db/generated/client'));
const require = createRequire(resolve(root, 'package.json'));
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const driver = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: pathToFileURL(realpathSync(dbPath)).href }) });
const marketRoot = mkdtempSync(join(dirname(realpathSync(dbPath)), "market-pins-"));
try {
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
  const project = p => jiti.import(resolve(root, p));
  const { CurrentFinancialDatasets } = await load('current-dataset.ts');
  const { VersionStandingAuthority } = await load('versioned-authority.ts');
  const { buildCafefCandidate, consumeCafefValuation } = await project('src/infrastructure/market-boundary/cafef-standing.ts');
  const { PrismaBoundaryStore } = await project('src/infrastructure/repositories/market-boundary.ts');
  const { ingestCafef } = await project('app/server/cafef-standing-services.ts');
  const base = 'docs/fundamental-data-engine/vnm-f1-membership-closure/2026-11-15/';
  const read = p => JSON.parse(readFileSync(p));
  const priceFile = pin('data/market-history/cafef/FPT.json');
  const profile = read(base + 'MARKET_PROFILE.json');
  const bindings = read(base + 'TRUSTED_SOURCE_INPUTS_SUCCESSOR.json');
  bindings.catalogs.cafef = [priceFile];
  // The owner removed the historical host script. Replay its exact pinned bytes in scratch only.
  function stage(value) {
    if (value === null || typeof value !== 'object') return;
    if (typeof value.path === 'string' && typeof value.sha256 === 'string') {
      const bytes = value.path === 'scripts/cafef-standing.mjs'
        ? execFileSync('git', ['show', '91267322^:scripts/cafef-standing.mjs'])
        : readFileSync(resolve(root, value.path));
      assert.equal(sha(bytes), value.sha256, value.path);
      const target = resolve(marketRoot, value.path);
      assert.ok(target.startsWith(marketRoot + '/'));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes);
      return;
    }
    for (const child of Object.values(value)) stage(child);
  }
  const version = read(registry.path);
  const marketVersion = version.authorities.find(entry => entry.domain === 'F1');
  stage([profile, bindings.marketReferences, priceFile, registry, version.ownerDecision,
    version.legacyAuthorizations.F1, read(profile.authorization.path).source, marketVersion.code]);
  const authority = new VersionStandingAuthority(marketRoot, () => registry, bindings);
  const store = new PrismaBoundaryStore(driver);
  const candidate = buildCafefCandidate(marketRoot, profile, {
    raw: priceFile, ticker: context.ticker, exchange: 'HOSE', date: context.economicCutoff, knownAt: clock,
  });
  await ingestCafef(marketRoot, store, (isSuccessor ? 'fpt-primary-admission-v8' : 'fpt-isolated-cutoff'), [candidate], authority.marketTrust());
  const market = async ctx => {
    const marketBody = candidate.market.body;
    const result = await consumeCafefValuation(marketRoot, candidate, authority.marketTrust(), store, {
      mode: 'HISTORICAL', requestedAt: marketBody.requestedAsOf, knownAt: ctx.knownAt, now: ctx.knownAt,
      purpose: 'VALUATION', securityIds: [ctx.securityId], universe: marketBody.universe,
    }, { now: () => ctx.knownAt });
    return { ticker: ctx.ticker, securityId: ctx.securityId, date: ctx.economicCutoff,
      value: result.observation.value, unit: 'VND_PER_SHARE', field: 'GiaDongCua',
      lineage: { raw: priceFile, pointer: result.observation.pointer, authority: registry } };
  };
  const sharePin = pin(local('FPT_CUTOFF_SHARE_REVIEW.json'));
  const shares = async ctx => {
    const review = read(sharePin.path);
    assert.equal(review.cutoff, ctx.economicCutoff);
    assert.equal(review.ticker, ctx.ticker);
    assert.ok(review.reviewedAt <= ctx.knownAt);
    for (const source of [review.anchor, review.capitalResolution, review.events, review.listing, review.policy]) {
      assert.equal(pin(source.path).sha256, source.sha256);
    }
    return { ticker: review.ticker, securityId: ctx.securityId, asOf: review.cutoff,
      value: review.shares, status: review.status, unit: 'SHARES',
      lineage: { review: sharePin, completeNegativeSearch: false } };
  };
  const requirements = pin(local('FPT_CUTOFF_REQUIREMENTS.json'));
  const datasets = new CurrentFinancialDatasets(driver, root, admissions, { requirements, market, shares });
  const bound = await datasets.bind(admitted.id, context);
  const dataset = await datasets.consume(bound.id, context);
  assert.equal(dataset.facts.length, 9);
  assert.equal(dataset.price.value, '50100');
  assert.equal(dataset.shares.value, '1885727648');
  assert.equal(dataset.financialCoverageComplete, true);
  assert.equal((await datasets.bind(admitted.id, context)).duplicate, true);
  if (!primary) assert.deepEqual(pin('data/vn30.sqlite'), productionBefore);
  console.log(JSON.stringify({
    context, registry, requirements, datasetId: bound.id, admissionId: admitted.id,
    findings: dataset.manifest.facts, price: dataset.price, shares: dataset.shares,
    datasetReadback: 'PASS', productionDatabaseUnchanged: !primary,
    fullM3CoverageCertified: false, scoringAuthorized: false,
  }, null, 2));
} finally {
  await driver.$disconnect();
  rmSync(marketRoot, { recursive: true, force: true });
}
