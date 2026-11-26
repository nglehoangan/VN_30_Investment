import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const configPath = 'docs/03 SCORING/BQ_MOAT_EVIDENCE_SUFFICIENCY_v1.0.json';
const modulePath = 'src/domain/current-scoring/bq-moat-research.ts';
const incrementalPath = 'src/domain/current-scoring/bq-moat-incremental.ts';
const read = path => readFileSync(resolve(root, path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ref = path => ({ path, sha256: sha(read(path)) });
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
const packet = JSON.parse(readPin(config.input));
requireCondition(config.status === 'APPROVED_BASELINE' && config.realIssuerValidation.includes('FPT') &&
  !config.productionScoringAuthorized && !config.publicationAuthorized && packet.ticker === 'FPT' &&
  packet.scope === 'REAL_ISSUER_RESEARCH' && packet.input.sector === 'TECHNOLOGY' &&
  packet.input.review.cutoff === '2026-11-13' && packet.input.review.reviewedAt === config.effectiveDate &&
  [packet.input.baseline, packet.input.reassessment].every(row =>
    row.methodology === config.methodologyId && row.implementation === config.implementationIdentity),
  'MOAT_RESEARCH_AUTHORITY_REQUIRED');
const evidence = Object.fromEntries(Object.entries(packet.sourceBindings).map(([id, binding]) => {
  const lines = readPin(binding).toString('utf8').split('\n');
  const [start, end] = binding.locator.lines;
  requireCondition(start > 0 && end <= lines.length && start <= end &&
    lines.slice(start - 1, end).some(line => line.includes(binding.locator.contains)), 'SOURCE_LOCATOR_MISMATCH');
  return [id, { publicBy: binding.publicBy, periodEnd: binding.periodEnd, kind: binding.kind }];
}));

const replay = execFileSync(process.execPath, ['tools/scoring/validate_fpt_bq_eq_effective.mjs', '--ticker', 'FPT'], { cwd: root });
requireCondition(replay.equals(readPin(config.acceptedEffectiveReplay)), 'ACCEPTED_BQ_EQ_REPLAY_MISMATCH');
const eq = JSON.parse(replay);
requireCondition(eq.ticker === packet.ticker && eq.scope === packet.scope &&
  eq.effectiveScore.reviewCutoff === packet.input.review.cutoff, 'COMBINED_RESEARCH_SUBJECT_MISMATCH');

const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const { BQ_MOAT_RESEARCH } = await jiti.import(resolve(root, modulePath));
const { scoreIncrementalCompetitiveAdvantage } = await jiti.import(resolve(root, incrementalPath));
requireCondition(BQ_MOAT_RESEARCH === config.implementationIdentity, 'UNSUPPORTED_IMPLEMENTATION');
const { aggregateResearchBusinessQuality, rankResearchBusinessQuality,
  buildResearchBusinessQualityDecisionInput } = await jiti.import(resolve(root, 'src/domain/current-scoring/research-combined-bq.ts'));

const moat = scoreIncrementalCompetitiveAdvantage({ ...packet.input, evidence });
const aggregation = aggregateResearchBusinessQuality(eq.effectiveScore, moat.effectiveScore, config.input.path);
const researchRanking = rankResearchBusinessQuality([{ ticker: packet.ticker, aggregation }]);
const { stage0, hardVeto, residualRisk } = eq.investmentDecisionInput.gates;
const investmentDecisionInput = buildResearchBusinessQualityDecisionInput(aggregation, { stage0, hardVeto, residualRisk });
if (html) {
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { ResearchMoatScoreView } = await jiti.import(resolve(root, 'src/ui/research-moat-score.tsx'));
  process.stdout.write('<!doctype html><html lang="en"><meta charset="utf-8"><title>FPT Business Quality research</title><body>' +
    renderToStaticMarkup(createElement(ResearchMoatScoreView, { ticker: packet.ticker, score: aggregation })) + '</body></html>\n');
} else {
  process.stdout.write(JSON.stringify({
    implementation: BQ_MOAT_RESEARCH,
    executable: [modulePath, incrementalPath, 'src/domain/current-scoring/research-incremental.ts',
      'src/domain/current-scoring/research-combined-bq.ts', 'tools/scoring/validate_fpt_bq_moat.mjs'].map(ref),
    methodology: ref(configPath), input: config.input, acceptedBqEq: config.acceptedEffectiveReplay,
    ticker: packet.ticker, scope: packet.scope, executionId: eq.executionId,
    analystSelected: { baseline: packet.input.baseline.assessment.proposed, current: packet.input.reassessment.assessment.proposed },
    bqMoat: moat, aggregation, researchRanking, investmentDecisionInput, decisionEligible: false, publicationAuthorized: false,
  }, null, 2) + '\n');
}
