import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const configPath = 'docs/03 SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.2.json';
const read = path => readFileSync(resolve(root, path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ref = path => ({ path, sha256: sha(read(path)) });
const json = bytes => JSON.parse(bytes);
function check(ok, reason) { if (!ok) throw Error(reason); }
function pinned(pin) {
  const path = realpathSync(resolve(root, pin.path));
  check(path.startsWith(root + sep), 'VALUATION_PIN_ESCAPE');
  const bytes = readFileSync(path);
  check(sha(bytes) === pin.sha256, 'VALUATION_PIN_MISMATCH');
  return bytes;
}
check(JSON.stringify(process.argv.slice(2)) === '["--ticker","FPT"]', 'FPT_RESEARCH_ONLY');
const config = json(read(configPath));
pinned(config.owner);
pinned(config.predecessorAcceptance);
const input = json(pinned(config.input));
const v11 = json(pinned(config.predecessorResult));
const prior = { ...v11, aggregation: { ...v11.aggregation, effectiveScores: v11.aggregation.effectiveScores.slice(0, 13),
  routeQualifications: v11.aggregation.routeQualifications.slice(0, -3) } };
const external = json(pinned(config.externalEvidence));
for (const report of Object.values(external.reports)) check(pinned(report).subarray(0, 4).toString() === '%PDF', 'ERE_PDF_IDENTITY');
for (const item of Object.values(external.observations)) {
  const doc = external.reports[item.documentId];
  check(doc && item.lineage === doc.sha256 && item.physicalPage >= 1 && item.physicalPage <= doc.pages &&
    item.publicBy === doc.publicBy, 'ERE_OBSERVATION_LINEAGE');
}
const evidence = Object.fromEntries(Object.entries(input.evidence).map(([id, pin]) => [id, pinned(pin)]));
check(config.status === 'APPROVED_BASELINE' && !config.productionScoringAuthorized && !config.publicationAuthorized &&
  [prior, input].every(r => r.ticker === 'FPT' && r.cutoff === '2026-11-13'), 'VALUATION_SCOPE_INVALID');
const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const engine = 'src/domain/current-scoring/valuation-research-v12.ts';
const { VAL_V12_METHODOLOGY, VAL_V12_EXECUTABLE, evaluateBoundedReturn } = await load(engine);
const { aggregateResearchEffectiveScores, rankResearchEffectiveScores,
  buildResearchDecisionScoreInput } = await load('src/domain/current-scoring/research-effective-score.ts');
const { RUBRICS } = await load('src/domain/scoring/methodology.ts');
check(config.methodology === VAL_V12_METHODOLOGY && config.implementation === VAL_V12_EXECUTABLE, 'BOUNDED_VALUATION_IDENTITY_MISMATCH');
const { financialEvidence } = v11;
check(input.retainedSensitivityIdentity.sha256 === config.predecessorResult.sha256 &&
  financialEvidence.prices.current.value === 50100 &&
  financialEvidence.markets.current.shares === 1885727648, 'BOUNDED_MARKET_OR_SENSITIVITY_BINDING');
const valuation = Object.fromEntries(['annual', 'current'].map(period => {
  const review = input.stages[period];
  const market = financialEvidence.markets[period];
  const assessment = input.boundedAssessment[period];
  const usable = (ref, cutoff, assumptionId) => {
    if (cutoff !== review.cutoff || assessment.informationCutoff !== review.informationCutoff) return false;
    const obs = external.observations[ref];
    if (obs) {
      const report = external.reports[obs.documentId];
      return report.admission === 'EXTERNAL_RESEARCH_EVIDENCE' && obs.publicBy <= review.informationCutoff &&
        (!assumptionId || obs.assumptions.includes(assumptionId)) &&
        (!Array.isArray(obs.period) || obs.period.every(y => Number.isInteger(y) && y <= report.horizon));
    }
    return Object.hasOwn(evidence, ref) && !!input.retainedPublicBy[ref] &&
      input.retainedPublicBy[ref] <= review.informationCutoff;
  };
  const ret = evaluateBoundedReturn({ ...review, market }, assessment, usable);
  return [period, v11.valuation[period].map(row => row.id === 'VAL-RET' ? ret : row)];
}));
const newPaths = valuation.current[1].boundedReturn.paths.filter(p => p.id.startsWith('RETAINED_'));
check(newPaths.length === 3 && newPaths.every((path, i) =>
  path.irr !== null && Math.abs(path.irr - financialEvidence.researchDiagnostics.horizon[i].baseZeroCredit) < 1e-10),
  'BOUNDED_ENTITLEMENT_REPLAY_MISMATCH');
const retainedTrial = { horizons: financialEvidence.researchDiagnostics.horizon,
  positiveCreditConstantGrowth: financialEvidence.sensitivities.noRerating.irr,
  zeroCreditConstantGrowth: financialEvidence.researchDiagnostics.oldZeroCreditSensitivity };
const effectiveScores = [...prior.aggregation.effectiveScores, ...valuation.current];
const base = aggregateResearchEffectiveScores(effectiveScores[0], effectiveScores.slice(1).flatMap(row =>
  row.points === null ? [] : [{ id: row.id, points: row.points, evidenceReference: config.input.path }]));
const weight = id => RUBRICS.find(row => row.id === id).max;
const measure = rows => ({ count: rows.length, weight: rows.reduce((sum, row) => sum + weight(row.id), 0) });
const confirmed = effectiveScores.filter(row => row.validity === 'CONFIRMED_CURRENT');
const provisional = effectiveScores.filter(row => row.validity === 'PROVISIONAL');
const genuine = effectiveScores.filter(row => row.points === null);
const outside = RUBRICS.filter(row => !effectiveScores.some(result => result.id === row.id));
const coverage = { ...base.coverage, confirmedCurrent: measure(confirmed), provisional: measure(provisional),
  genuineNR: measure(genuine), outsideRollout: measure(outside), unratedTotal: base.coverage.genuineNR };
const categories = base.categories.map(row => ({ ...row, includesProvisional: row.includesProvisional ||
  provisional.some(rubric => RUBRICS.find(item => item.id === rubric.id).category === row.id) }));
const routeQualifications = [...prior.aggregation.routeQualifications, ...valuation.current.map(effectiveScore =>
  ({ id: effectiveScore.id, ...effectiveScore.routeQualification }))];
const comparability = 'ORDINAL_DIRECTION_ONLY_NO_VALIDATED_CROSS_ROUTE_CARDINAL_EQUIVALENCE';
const aggregation = { ...base, categories, effectiveScores, routeQualifications, comparability, coverage,
  pointsByValidity: { confirmedCurrent: confirmed.reduce((v, x) => v + x.points, 0),
    provisional: provisional.reduce((v, x) => v + x.points, 0) },
  genuineNrInScope: genuine.map(row => row.id), outsideRollout: outside.map(row => row.id) };
const researchRanking = rankResearchEffectiveScores([{ ticker: input.ticker, aggregation }])
  .map(row => ({ ...row, effectiveScores, coverage, routeQualifications, comparability }));
const gates = prior.investmentDecisionInput.gates;
const investmentDecisionInput = { ...buildResearchDecisionScoreInput(aggregation, gates), gates,
  effectiveScores, routeQualifications, comparability,
  effectiveFinancialHealth: categories.find(row => row.id === 'FH'), effectiveGrowthQuality: categories.find(row => row.id === 'GQ'), effectiveIndustry: categories.find(row => row.id === 'IC'), effectiveValuation: categories.find(row => row.id === 'VAL') };
process.stdout.write(JSON.stringify({
  ticker: input.ticker, cutoff: input.cutoff, scope: 'REAL_ISSUER_RESEARCH', implementation: VAL_V12_EXECUTABLE,
  methodology: ref(configPath), input: config.input, prior: config.predecessorResult,
  executables: [engine, 'tools/scoring/validate_fpt_bounded_return.mjs'].map(ref),
  financialEvidence, retainedTrial, valuation, aggregation, researchRanking, investmentDecisionInput,
  decisionEligible: false, publicationAuthorized: false,
}, null, 2) + '\n');
