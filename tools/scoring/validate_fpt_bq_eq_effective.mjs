import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const configPath = 'docs/03 SCORING/BQ_EQ_EFFECTIVE_SCORE_ADDENDUM_v1.2.json';
const modulePath = 'src/domain/current-scoring/research-effective-score.ts';
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
const args = JSON.stringify(process.argv.slice(2));
const html = args === '["--ticker","FPT","--html"]';
requireCondition(html || args === '["--ticker","FPT"]', 'FPT_RESEARCH_ONLY');
const config = JSON.parse(read(configPath));
readPin(config.approval);
const predecessor = JSON.parse(readPin(config.predecessor));
requireCondition(config.status === 'APPROVED_BASELINE' && config.realIssuerValidation.includes('FPT') &&
  config.productionScoringAuthorized === false && config.publicationAuthorized === false, 'RESEARCH_AUTHORITY_REQUIRED');

const retentionAdapter = 'tools/scoring/validate_fpt_bq_eq_retention.mjs';
const bytes = execFileSync(process.execPath, [retentionAdapter, '--ticker', 'FPT'], { cwd: root });
requireCondition(bytes.equals(readPin(config.retentionReplay)), 'RETENTION_REPLAY_MISMATCH');
const retained = JSON.parse(bytes);
const financial = JSON.parse(readPin(config.financialReplay));
requireCondition(retained.ticker === 'FPT' && retained.scope === 'REAL_ISSUER_RESEARCH' &&
  retained.implementation === predecessor.implementationIdentity &&
  retained.executionId === financial.executionId && financial.ticker === retained.ticker &&
  financial.current.comparable9MRoic === retained.current.comparableRoic,
  'REPLAY_SUBJECT_OR_METRIC_MISMATCH');

const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const {
  BQ_EQ_EFFECTIVE, resolveEconomicQualityEffectiveScore, aggregateResearchEffectiveScores,
  rankResearchEffectiveScores, buildResearchDecisionScoreInput,
} = await jiti.import(resolve(root, modulePath));
requireCondition(BQ_EQ_EFFECTIVE === config.implementationIdentity, 'UNSUPPORTED_IMPLEMENTATION');

const effectiveScore = resolveEconomicQualityEffectiveScore(retained, retained.current.comparableRoic);
const aggregation = aggregateResearchEffectiveScores(effectiveScore);
const researchRanking = rankResearchEffectiveScores([{ ticker: retained.ticker, aggregation }]);
const investmentDecisionInput = buildResearchDecisionScoreInput(aggregation, {
  stage0: financial.stage0, hardVeto: financial.hardVeto, residualRisk: financial.residualRisk,
});
if (html) {
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { ResearchEffectiveScoreView } = await jiti.import(resolve(root, 'src/ui/research-effective-score.tsx'));
  process.stdout.write('<!doctype html><html lang="en"><meta charset="utf-8"><title>FPT BQ-EQ research</title><body>' +
    renderToStaticMarkup(createElement(ResearchEffectiveScoreView, { ticker: retained.ticker, score: aggregation })) +
    '</body></html>\n');
} else {
  process.stdout.write(JSON.stringify({
    implementation: BQ_EQ_EFFECTIVE, executable: reference(modulePath),
    adapter: reference('tools/scoring/validate_fpt_bq_eq_effective.mjs'), methodology: reference(configPath),
    input: retained.input, retentionReplay: config.retentionReplay,
    ticker: retained.ticker, scope: retained.scope, executionId: retained.executionId,
    latestValidAssessment: retained.latestValidAssessment, current: retained.current,
    effectiveScore, aggregation, researchRanking, investmentDecisionInput,
    decisionEligible: false, publicationAuthorized: false,
  }, null, 2) + '\n');
}
