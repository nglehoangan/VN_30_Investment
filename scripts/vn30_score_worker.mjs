/** Trusted-host bridge to the existing current-purpose scoring engine. */
import {fstatSync, readFileSync, realpathSync, statSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve, sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const database = resolve(root, 'data/vn30.sqlite');

function requireCondition(condition, code) {
  if (!condition) throw Error(code);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

function sha(value) {
  return createHash('sha256').update(value).digest('hex');
}

function readPin(pin) {
  const path = realpathSync(resolve(root, pin.path));
  requireCondition(path.startsWith(root + sep), 'SCORING_PIN_PATH_ESCAPE');
  const bytes = readFileSync(path);
  requireCondition(sha(bytes) === pin.sha256, 'SCORING_PIN_HASH_MISMATCH');
  return {path, bytes};
}

function jsonPin(pin) {
  return JSON.parse(readPin(pin).bytes);
}

async function run(job, action) {
  const req = job.request;
  const subject = {
    ticker: req.ticker, securityId: req.securityId, exchange: req.exchange,
    sector: req.sector, universeVersion: req.universe.version,
    universeHash: req.universe.registryEntryHash, cutoff: req.referenceDate,
    purpose: 'CURRENT_FORMAL_VALUATION',
  };
  const catalog = JSON.parse(readFileSync(resolve(root, 'scripts/vn30-score-routes.json')));
  requireCondition(catalog.contract === 'vn30-current-scoring-routes-v1', 'SCORING_ROUTE_REGISTRY_CONTRACT');
  const matches = catalog.routes.filter(row =>
    JSON.stringify(canonical(row.subject)) === JSON.stringify(canonical(subject)));
  requireCondition(matches.length === 1, 'NO_EXACT_TICKER_SCORING_AUTHORITY');
  const route = matches[0];
  requireCondition(sha(JSON.stringify(canonical(route))) === req.parameters.routeHash, 'SCORING_ROUTE_CHANGED');

  const owner = jsonPin(route.authorization);
  const {authorization, ...approvedRoute} = route;
  const approvalHash = sha(JSON.stringify(canonical(approvedRoute)));
  const statement = `Approve exact single-ticker VN30 score ${approvalHash} for ${subject.ticker} at ${subject.cutoff}`;
  requireCondition(owner.contract === 'vn30-single-ticker-score-approval-v1' &&
    owner.ownerAuthority === 'PROJECT_OWNER' && owner.scope === 'CURRENT_SCORE_ARTIFACT_ONLY' &&
    owner.statement === statement && owner.approvalHash === approvalHash &&
    readPin(owner.source).bytes.toString().split(/\r?\n/).includes(statement),
  'NO_EXACT_TICKER_SCORING_AUTHORITY');
  requireCondition(route.database === 'data/vn30.sqlite' && realpathSync(database) === database,
    'UNAPPROVED_SCORE_DATABASE');

  const packet = jsonPin(route.assessment);
  const reference = jsonPin(route.reference);
  const input = packet.input;
  requireCondition(packet.contract === 'current-assessment-adoption-v1' &&
    input.securityId === subject.securityId && input.normalization.sector === subject.sector &&
    input.asOf.slice(0, 10) === subject.cutoff &&
    reference.context.ticker === subject.ticker && reference.context.securityId === subject.securityId &&
    reference.context.economicCutoff === subject.cutoff && reference.context.purpose === subject.purpose,
  'SCORING_INPUT_IDENTITY_MISMATCH');

  // Reuse the repository's existing Jiti loader convention for aliased TS modules.
  const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
  const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
  const {createJiti} = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
  const jiti = createJiti(import.meta.url, {
    alias: {'@': resolve(root, 'src'), 'server-only': resolve(root, 'node_modules/next/dist/compiled/server-only/empty.js')},
    fsCache: false, moduleCache: true,
  });
  const load = path => jiti.import(resolve(root, path));
  const {PrismaClient} = await load('src/infrastructure/db/generated/client.ts');
  const {PrismaBetterSqlite3} = await import('@prisma/adapter-better-sqlite3');
  const {PrismaMethodologyRegistry} = await load('src/infrastructure/repositories/methodology-registry.ts');
  const {CurrentPurposeScoring, PinnedCurrentAssessmentAdoption} = await load('src/infrastructure/source-admission/current-scoring.ts');
  const {CurrentPurposeScoringConsumer} = await load('src/infrastructure/source-admission/current-scoring-consumer.ts');
  const {PinnedCurrentExecutableAuthority} = await load('src/infrastructure/source-admission/current-scoring-authority.ts');
  const {assertNotRevoked} = await load('src/infrastructure/repositories/unified-admission.ts');
  const {snapshotHash} = await load('src/infrastructure/fundamentals/snapshot-hash.ts');
  const {instant} = await load('src/shared/time.ts');
  requireCondition(instant(owner.recordedAt) <= instant(new Date().toISOString()), 'SCORING_APPROVAL_NOT_EFFECTIVE');

  const reader = new PrismaClient({adapter: new PrismaBetterSqlite3({
    url: database, readonly: true, fileMustExist: true,
  })});
  let writer;
  try {
    const factory = await jiti.import(readPin(route.adapter).path);
    const data = await factory.createCurrentDatasetConsumer(reader, root, subject);
    requireCondition(data instanceof CurrentPurposeScoringConsumer, 'GOVERNED_DATASET_CONSUMER_REQUIRED');
    const adoption = new PinnedCurrentAssessmentAdoption(root, route.assessment, route.reviewBindings);
    const executable = new PinnedCurrentExecutableAuthority(root, route.executable, {now: () => input.knownAt});
    const verifyAuthority = async db => {
      await assertNotRevoked(db, `vn30-score-approval:${approvalHash}`);
      await assertNotRevoked(db, route.executable.sha256);
    };
    const registry = new PrismaMethodologyRegistry(reader);
    const scorer = new CurrentPurposeScoring(reader, registry, data, adoption, executable);
    await verifyAuthority(reader);
    const preflight = await scorer.preflight(input, reference);
    requireCondition(snapshotHash(preflight) === route.preflightHash, 'EXACT_GOVERNED_PREFLIGHT_MISMATCH');
    if (action === 'preflight') return {blockers: []};

    const fd = Number(process.argv[3]);
    requireCondition(Number.isInteger(fd) && fd > 2, 'SCORING_ROLLOUT_LOCK_REQUIRED');
    const lease = fstatSync(fd);
    const expected = statSync(resolve(root, 'outputs/vn30-rollout/.rollout.lock'));
    requireCondition(lease.dev === expected.dev && lease.ino === expected.ino, 'SCORING_ROLLOUT_LOCK_REQUIRED');

    // Existing scorer owns artifact idempotency and performs its own data revocation checks.
    writer = new PrismaClient({adapter: new PrismaBetterSqlite3({url: database, fileMustExist: true})});
    await writer.$executeRawUnsafe('PRAGMA foreign_keys = ON');
    await writer.$executeRawUnsafe('PRAGMA recursive_triggers = ON');
    const guardedWriter = {
      $transaction: callback => writer.$transaction(async tx => {
        await verifyAuthority(tx);
        return callback(tx);
      }),
    };
    const exactDataset = {
      async resolve(ref, context) {
        const dataset = await data.resolve(ref, context);
        requireCondition(snapshotHash(dataset) === preflight.datasetHash, 'EXACT_GOVERNED_DATASET_CHANGED');
        return dataset;
      },
    };
    const card = await new CurrentPurposeScoring(guardedWriter, registry, exactDataset, adoption, executable)
      .score(input, reference);
    return {blockers: [], artifact: {id: card.id, sha256: snapshotHash(card), totalScore: card.totalScore,
      authorizationHash: route.preflightHash, ownerApprovalHash: approvalHash}};
  } finally {
    await Promise.all([reader.$disconnect(), writer?.$disconnect()]);
  }
}

try {
  const action = process.argv[2];
  requireCondition(['preflight', 'score'].includes(action), 'INVALID_WORKER_ACTION');
  console.log(JSON.stringify(await run(JSON.parse(readFileSync(0, 'utf8')), action)));
} catch (error) {
  const codes = Array.isArray(error.issues) ? error.issues.map(issue => issue.reason) : [error.message];
  const blockers = codes.filter(code => typeof code === 'string' && /^[A-Z][A-Z0-9_]+$/.test(code));
  console.log(JSON.stringify({blockers: blockers.length ? blockers : ['GOVERNED_WORKER_RUNTIME_FAILED']}));
}
