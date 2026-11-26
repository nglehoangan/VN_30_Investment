import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const inputPath = 'docs/fundamental-data-engine/fpt-bq-eq/2026-11-26/FPT_BQ_EQ_INCREMENTAL_INPUT.json';
const configPath = 'docs/03 SCORING/BQ_EQ_INCREMENTAL_ASSESSMENT_v1.1.json';
const modulePath = 'src/domain/current-scoring/bq-eq-incremental.ts';
const read = path => readFileSync(resolve(root, path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const reference = path => ({ path, sha256: sha(read(path)) });
function requireCondition(ok, reason) {
  if (!ok) throw Error(reason);
}
function readPin({ path, sha256 }) {
  const absolute = realpathSync(resolve(root, path));
  requireCondition(absolute.startsWith(root + sep), 'PIN_OUTSIDE_REPOSITORY');
  const bytes = readFileSync(absolute);
  requireCondition(sha(bytes) === sha256, 'PIN_HASH_MISMATCH');
  return bytes;
}
requireCondition(JSON.stringify(process.argv.slice(2)) === '["--ticker","FPT"]', 'FPT_RESEARCH_ONLY');
const input = JSON.parse(read(inputPath));
const config = JSON.parse(read(configPath));
readPin(config.approval);
const priorConfig = JSON.parse(readPin(config.predecessor));
requireCondition(input.ticker === 'FPT' && input.scope === 'REAL_ISSUER_RESEARCH' &&
  config.status === 'APPROVED_BASELINE' && config.realIssuerValidation.includes(input.ticker) &&
  config.productionExecutableApproved === false && config.productionScoringAuthorized === false &&
  config.publicationAuthorized === false, 'RESEARCH_AUTHORITY_REQUIRED');
const priorInput = JSON.parse(readPin(input.predecessorInput));
const sealed = readPin(input.predecessorResult);
const replay = execFileSync(process.execPath, ['tools/scoring/validate_fpt_bq_eq.mjs', '--ticker', 'FPT'], { cwd: root });
requireCondition(replay.equals(sealed), 'PREDECESSOR_REPLAY_MISMATCH');
const priorResult = JSON.parse(replay);
const [annual, cutoff] = priorInput.stages;
requireCondition(priorInput.ticker === input.ticker && priorResult.ticker === input.ticker &&
  priorResult.scope === input.scope && priorResult.implementation === priorConfig.implementationIdentity &&
  priorResult.input.sha256 === input.predecessorInput.sha256 &&
  input.baseline.financialPeriod === priorInput.evidence.FYProof.periodEnd &&
  input.baseline.assessmentDate === priorConfig.effectiveDate &&
  input.review.cutoff === cutoff.cutoff && input.review.reviewedAt === config.effectiveDate &&
  input.review.financialPeriod === priorResult.current.periodEnd &&
  priorResult.current.comparable9MRoic === null, 'REVIEW_WINDOW_OR_METRIC_MISMATCH');

const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const { BQ_EQ_INCREMENTAL, scoreIncrementalEconomicQuality } = await jiti.import(resolve(root, modulePath));
requireCondition(BQ_EQ_INCREMENTAL === config.implementationIdentity, 'UNSUPPORTED_IMPLEMENTATION');

const baseline = {
  id: input.baseline.id, financialPeriod: input.baseline.financialPeriod,
  assessedAt: input.baseline.assessmentDate, economicCutoff: annual.cutoff,
  methodology: priorConfig.methodologyId, implementation: priorResult.implementation,
  method: input.baseline.method, quality: 'CONSERVATIVE', confidence: input.baseline.confidence,
  assessment: annual.assessment,
};
const reassessment = {
  id: 'FPT-BQ-EQ-2026-11-13-v1.1', financialPeriod: input.review.financialPeriod,
  assessedAt: input.review.reviewedAt, economicCutoff: cutoff.cutoff,
  methodology: config.methodologyId, implementation: BQ_EQ_INCREMENTAL,
  method: { ...baseline.method, scope: 'FTEL_EQUITY_METHOD' },
  quality: 'CONSERVATIVE', confidence: input.review.confidence, assessment: cutoff.assessment,
};
const interim = new Set(['Q1', 'Q2', 'H1', 'Q3']);
const evidence = Object.fromEntries(Object.entries(priorInput.evidence).map(([ref, item]) =>
  [ref, { ...item, ...(interim.has(ref) ? { kind: 'INTERIM' } : {}) }]));
const updateRefs = [...priorResult.updates.map(update => update.ref), 'FTEL', 'NovemberCost'];
const result = scoreIncrementalEconomicQuality({ baseline, reassessment, review: input.review,
  sector: priorInput.sector, evidence, updateRefs });
requireCondition(result.baseline?.points === priorResult.results[0].executable.points &&
  result.baseline.band === priorResult.results[0].executable.band, 'BASELINE_SCORE_DRIFT');

process.stdout.write(JSON.stringify({
  implementation: BQ_EQ_INCREMENTAL,
  executable: reference(modulePath),
  adapter: reference('tools/scoring/validate_fpt_bq_eq_incremental.mjs'),
  methodology: reference(configPath), input: reference(inputPath),
  ticker: input.ticker, executionId: priorResult.executionId, scope: input.scope,
  predecessorInput: input.predecessorInput, predecessorResult: input.predecessorResult,
  originalAssessment: baseline,
  baseline: result.baseline,
  priorCutoff: priorResult.results[1],
  current: { ...result.current, assessmentId: reassessment.id,
    analystSelected: cutoff.assessment.proposed, comparableRoic: priorResult.current.comparable9MRoic },
  decisionEligible: false,
}, null, 2) + '\n');
