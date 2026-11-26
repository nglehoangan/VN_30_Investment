import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const configPath = 'docs/03 SCORING/BQ_EQ_INCREMENTAL_ASSESSMENT_v1.2.json';
const modulePath = 'src/domain/current-scoring/bq-eq-retention.ts';
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
const config = JSON.parse(read(configPath));
readPin(config.approval);
readPin(config.retainedInput);
const predecessor = JSON.parse(readPin(config.predecessor));
requireCondition(config.status === 'APPROVED_BASELINE' && config.realIssuerValidation.includes('FPT') &&
  config.productionExecutableApproved === false && config.productionScoringAuthorized === false &&
  config.publicationAuthorized === false, 'RESEARCH_AUTHORITY_REQUIRED');

const adapter = 'tools/scoring/validate_fpt_bq_eq_incremental.mjs';
const replay = execFileSync(process.execPath, [adapter, '--ticker', 'FPT'], { cwd: root });
requireCondition(replay.equals(readPin(config.retainedResult)), 'PREDECESSOR_REPLAY_MISMATCH');
const prior = JSON.parse(replay);
requireCondition(prior.ticker === 'FPT' && prior.scope === 'REAL_ISSUER_RESEARCH' &&
  prior.implementation === predecessor.implementationIdentity &&
  prior.input.path === config.retainedInput.path && prior.input.sha256 === config.retainedInput.sha256,
  'PREDECESSOR_SUBJECT_OR_INPUT_MISMATCH');

const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const { BQ_EQ_RETENTION, retainLatestValidEconomicQuality } = await jiti.import(resolve(root, modulePath));
requireCondition(BQ_EQ_RETENTION === config.implementationIdentity, 'UNSUPPORTED_IMPLEMENTATION');
const replacement = prior.current.points === null ? null : {
  id: prior.current.assessmentId,
  financialPeriod: prior.current.underlyingFinancialPeriod,
  economicCutoff: prior.current.review.cutoff,
  assessedAt: prior.current.review.reviewedAt,
  methodology: predecessor.methodologyId,
  implementation: predecessor.implementationIdentity,
  method: { ...prior.originalAssessment.method, scope: 'FTEL_EQUITY_METHOD' },
};
const result = retainLatestValidEconomicQuality(prior, prior.originalAssessment, replacement);
process.stdout.write(JSON.stringify({
  implementation: BQ_EQ_RETENTION,
  executable: reference(modulePath),
  adapter: reference('tools/scoring/validate_fpt_bq_eq_retention.mjs'),
  methodology: reference(configPath), input: config.retainedInput,
  predecessorResult: config.retainedResult,
  ticker: prior.ticker, executionId: prior.executionId, scope: prior.scope,
  baseline: prior.baseline, ...result, decisionEligible: false,
}, null, 2) + '\n');
