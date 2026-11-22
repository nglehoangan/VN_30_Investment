/** Read-only TCB executable proposal checks. Governed scoring authority is applied separately. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = realpathSync(resolve(import.meta.dirname, '../..'));
const folder = 'docs/fundamental-data-engine/tcb-scoring-readiness/2026-11-22/exec-c636021bde64b53de84eb66e';
const pathFor = path => {
  const resolved = realpathSync(resolve(root, path));
  assert(resolved.startsWith(root + sep), 'TCB_PIN_PATH_ESCAPE');
  return resolved;
};
const read = path => JSON.parse(readFileSync(pathFor(path), 'utf8'));
const pin = path => ({path, sha256: createHash('sha256').update(readFileSync(pathFor(path))).digest('hex')});
const checked = expected => {
  assert.deepEqual(pin(expected.path), {path: expected.path, sha256: expected.sha256});
  return read(expected.path);
};

const requireVitest = createRequire(pathFor('node_modules/vitest/package.json'));
const requireVite = createRequire(requireVitest.resolve('vite/package.json'));
const {createJiti} = await import(pathToFileURL(requireVite.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, {
  alias: {'@': resolve(root, 'src'), 'server-only': resolve(root, 'node_modules/next/dist/compiled/server-only/empty.js')},
  fsCache: false,
});
const load = path => jiti.import(pathFor(path));

const routePath = folder + '/TCB_EVIDENCE_COMPLETE_SCORING_ROUTE_CANDIDATE.json';
const route = read(routePath);
const {subject} = route;
assert.deepEqual([subject.ticker, subject.sector, subject.exchange, subject.cutoff],
  ['TCB', 'BANK', 'HOSE', '2026-10-30']);
const scope = checked(route.limitedScopeApproval);
const m1 = checked(route.m1AdoptionApproval);
const assessment = checked(route.assessment);
const reference = checked(route.reference);
const {input} = assessment;
assert.equal(scope.datasetHash, assessment.datasetHash);
assert.equal(m1.datasetHash, assessment.datasetHash);
assert.equal(m1.ticker, 'TCB');
assert.equal(m1.economicCutoff, subject.cutoff);
assert.equal(scope.ticker, 'TCB');
assert.equal(scope.cutoff, subject.cutoff);
assert.equal(m1.status, 'OWNER_APPROVED_EXACT_M1_ADOPTION');
assert.equal(scope.status, 'OWNER_APPROVED_ALL_23_RUBRIC_DISPOSITIONS');
checked(m1.m1);
const reviewedScope = checked(scope.assessment);
const {snapshotHash: hash} = await load('src/infrastructure/fundamentals/snapshot-hash.ts');
const {validateEvidence} = await load('src/domain/scoring/evidence.ts');
const methodologyPath = 'src/domain/scoring/methodology.ts';
const {RUBRICS} = await load(methodologyPath);
assert.deepEqual(Object.fromEntries(Object.entries(m1.gates).map(([gate]) => [gate, input[gate].status])), m1.gates);
assert(input.stage0.status === 'PASS WITH CONDITIONS' && input.hardVeto.status === 'CLEAR');
assert.deepEqual(validateEvidence(input.evidence, subject.securityId, input.asOf, input.knownAt, subject.purpose), []);
const evidenceIds = new Set(input.evidence.map(row => row.id));
assert.equal(evidenceIds.size, input.evidence.length);
const rows = input.assessments;
assert.equal(rows.length, 20);
assert.equal(new Set(rows.map(row => row.subcategory)).size, 20);
const unrated = RUBRICS.filter(rule => !rows.some(row => row.subcategory === rule.id));
assert.deepEqual(unrated.map(rule => rule.id), scope.unratedRubrics);
assert.deepEqual(scope.unratedRubrics, ['FH-STRESS', 'CA-DIST', 'CA-DIL']);
assert.equal(RUBRICS.reduce((weight, rule) => weight + rule.max, 0) -
  unrated.reduce((weight, rule) => weight + rule.max, 0), 93);
for (const row of rows) {
  const rule = RUBRICS.find(item => item.id === row.subcategory);
  const approved = reviewedScope.rubrics.find(item => item.rubric === row.subcategory);
  assert(scope.ratedRubrics.includes(row.subcategory));
  assert.equal(row.selectedPoints, approved.researchPoints);
  assert.equal(row.assessment, approved.band);
  assert(rule.bands.some(band => band.label === row.assessment &&
    band.min <= row.selectedPoints && row.selectedPoints <= band.max));
  assert.deepEqual(row.evidence.map(topic => topic.topic).sort(), [...rule.topics].sort());
  assert(row.evidence.every(topic => topic.refs.length && topic.refs.every(id => evidenceIds.has(id))));
  assert(row.disconfirmingEvidence.length && row.disconfirmingEvidence.every(id => evidenceIds.has(id)));
}
assert.equal(rows.find(row => row.subcategory === 'RG-RISK').assessment, input.residualRisk.status);
const metricsPath = 'src/domain/scoring/metrics.ts';
const {METRICS} = await load(metricsPath);
assert.deepEqual(assessment.metricDecisions.map(row => row.metric).sort(), Object.keys(METRICS).sort());
assert(assessment.metricDecisions.every(row => row.evidenceRefs.length && row.evidenceRefs.every(id => evidenceIds.has(id))));

const adapter = pin(route.adapter.path);
assert.deepEqual(adapter, route.adapter);
const {createCurrentDatasetConsumer} = await load(adapter.path);
const {PrismaClient} = await load('src/infrastructure/db/generated/client.ts');
const {PrismaBetterSqlite3} = await import('@prisma/adapter-better-sqlite3');
assert.equal(route.database, 'data/vn30.sqlite');
const db = new PrismaClient({adapter: new PrismaBetterSqlite3({
  url: pathFor(route.database), readonly: true, fileMustExist: true,
})});
try {
  const data = createCurrentDatasetConsumer(db, root, subject);
  const dataset = await data.resolve(reference, reference.context);
  assert.equal(hash(dataset), assessment.datasetHash);
  assert(dataset.evidence.every(fact => input.evidence.some(row => row.id === fact.id && hash(row) === hash(fact))));
  const executable = {
    contract: 'tcb-limited-prepare-executable-candidate-v1',
    subject,
    method: input.methodology,
    sourcePins: [
      pin('tools/scoring/prepare_tcb_scoring_candidate.mjs'), adapter,
      ...[
        methodologyPath, metricsPath, 'src/domain/scoring/evidence.ts',
        'src/domain/current-scoring/scorecard.ts', 'src/domain/current-scoring/provenance.ts',
        'src/infrastructure/source-admission/current-review.ts',
        'src/infrastructure/source-admission/tcb-bank-binding.ts',
        'src/infrastructure/source-admission/tcb-bank-dataset.ts',
      ].map(pin),
    ],
    route: pin(routePath),
    assessment: route.assessment,
    datasetHash: hash(dataset),
    dataAcceptanceId: dataset.dataAcceptanceId,
    reference: route.reference,
    scope: route.limitedScopeApproval,
    m1: route.m1AdoptionApproval,
  };
  console.log(JSON.stringify({
    status: 'CANDIDATE_CHECKS_PASSED',
    executable,
    candidateHash: hash(executable),
    review: {
      preparation: {evidenceRecords: dataset.evidence.length, missingTopics: [], verifiedRubrics: 20},
      challenge: {unrated: scope.unratedRubrics, ratedWeight: 93, supportedPoints: rows.reduce((sum, row) => sum + row.selectedPoints, 0)},
    },
    governedRouteReady: false,
    scoringAuthorized: false,
  }, null, 2));
} finally {
  await db.$disconnect();
}
