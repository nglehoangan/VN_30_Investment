import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const configPath = 'docs/03 SCORING/WP3_GROWTH_QUALITY_AMENDMENT_v1.0.json';
const read = path => readFileSync(resolve(root, path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ref = path => ({ path, sha256: sha(read(path)) });
const json = bytes => JSON.parse(bytes);
function check(ok, reason) { if (!ok) throw Error(reason); }
function pinned(pin) {
  const path = realpathSync(resolve(root, pin.path));
  check(path.startsWith(root + sep), 'GROWTH_PIN_ESCAPE');
  const bytes = readFileSync(path);
  check(sha(bytes) === pin.sha256, 'GROWTH_PIN_MISMATCH');
  return bytes;
}
check(JSON.stringify(process.argv.slice(2)) === '["--ticker","FPT"]', 'FPT_RESEARCH_ONLY');
const config = json(read(configPath));
pinned(config.owner);
pinned(config.predecessorAcceptance);
const input = json(pinned(config.input));
const prior = json(pinned(config.predecessorResult));
const original = json(pinned(config.legacyFacts));
const annual = json(pinned(config.annualOperands));
const financials = json(pinned(config.legacyFinancials)).financials;
check(config.status === 'APPROVED_BASELINE' && !config.productionScoringAuthorized && !config.publicationAuthorized &&
  [prior, original, input].every(row => row.ticker === 'FPT' && row.cutoff === '2026-11-13') &&
  annual.ticker === 'FPT' && input.sector === 'TECHNOLOGY', 'GROWTH_SCOPE_INVALID');
for (const record of [...Object.values(input.evidence), ...Object.values(original.ownedEvidence), ...Object.values(annual.evidence)]) pinned(record);
const bq = json(pinned(original.ownedEvidence.bq)).financials;
const q3 = json(pinned(original.ownedEvidence.q3)).cells;
const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const engine = 'src/domain/current-scoring/gq-research.ts';
const { GQ_METHODOLOGY, GQ_EXECUTABLE, profiles, scoreIncrementalGrowth, pairedGrowth, projectGrowth, incrementalReturn } = await load(engine);
const { aggregateResearchEffectiveScores, rankResearchEffectiveScores,
  buildResearchDecisionScoreInput } = await load('src/domain/current-scoring/research-effective-score.ts');
const { RUBRICS } = await load('src/domain/scoring/methodology.ts');
check(config.methodology === GQ_METHODOLOGY && config.implementation === GQ_EXECUTABLE &&
  Object.entries(profiles).every(([id, bands]) => config.profiles[id].map(row => row.band).join() === bands.join()),
  'GROWTH_METHODOLOGY_MISMATCH');

const operands = input.retainedDerivedOperands;
const epsReadback = pinned(input.evidence[operands.pairedEPSSource]).toString().replaceAll(".", "");
check(operands.pairedEPS.every(([current, prior]) => epsReadback.includes(`${current}/${prior}`)),
  'GROWTH_EPS_PAIR_LINEAGE_MISMATCH');
const paired = pairedGrowth(operands.pairedEPS);
const historical = financials.annual.map((row, i) => {
  const observed = bq.annual[i];
  const cells = annual.annualCells[row.year];
  check(row.year === observed.year && row.scope === observed.scope && row.revenue === observed.revenue &&
    row.revenue === Number(cells.revenue.value) && row.capex === observed.capex, 'GROWTH_ANNUAL_BINDING_MISMATCH');
  return { year: row.year, scope: row.scope, revenue: row.revenue, ebit: row.ebit,
    parentNpat: Number(cells.parentIncome.value), eps: operands.pairedEPS[i - 1]?.[0] ?? null,
    pairedEpsGrowth: i ? operands.pairedEPS[i - 1][0] / operands.pairedEPS[i - 1][1] - 1 : null,
    cfo: observed.cfo, capex: observed.capex, fcf: observed.fcf, margin: row.ebit / row.revenue,
    equity: row.equity, debt: row.debt, deposits: row.bookDeposits };
});
const last = historical.at(-1);
const first = historical[0];
const cagr = key => (last[key] / first[key]) ** (1 / (last.year - first.year)) - 1;
const interim = bq.current;
const current = { financialPeriod: interim.period, scope: interim.scope, revenue: interim.revenue,
  restatedRevenueGrowth: interim.revenue / (operands.roundedRestated9M2025RevenueMillions * 1e6) - 1,
  ebit: financials.current.ebit, eps: null,
  parentNpat: Number(q3.find(cell => cell.concept === 'NET_INCOME_ATTRIBUTABLE_PARENT' && cell.period.start === '2026-01-01').value),
  cfo: interim.cfo, capex: interim.capex, fcf: interim.fcf, margin: financials.current.ebit / interim.revenue };
const productivity = [[0, 2], [0, 3], [1, 3], [2, 3]].map(([start, end]) => {
  const a = historical[start], b = historical[end];
  const nopatDelta = (b.ebit - a.ebit) * 0.8;
  return { start: a.year, end: b.year, nopatDelta, scope: b.scope, capital: [0, 0.5, 1].map(k => {
    const capitalDelta = b.equity - a.equity + b.debt - a.debt - k * (b.deposits - a.deposits);
    return { depositExclusion: k, capitalDelta, returnProxy: incrementalReturn(nopatDelta, capitalDelta, 0) };
  }) };
});
const selectedCapital = { capitalDelta: operands.selectedOperatingCapitalDelta, nopatDelta: productivity.at(-1).nopatDelta,
  returnProxy: incrementalReturn(productivity.at(-1).nopatDelta, operands.selectedOperatingCapitalDelta, 0),
  scope: 'PARTIAL_OPERATING_CAPITAL_NOT_COMPLETE_INVESTED_CAPITAL' };

const cases = Object.values(input.cases);
const growth = cases.map(({ historical, ...entry }) => scoreIncrementalGrowth({
  ...entry, sector: input.sector, evidence: input.evidence,
}, historical));
const forecast = ['baseline', 'reassessment'].map(stage => {
  const expectedBase = stage === 'baseline' ? last.revenue : interim.revenue * 4 / 3;
  return { stage, classification: 'SENSITIVITY', scenarios: input.cases['GQ-FWD'][stage].assessment.scenarios.map(s => {
    check(s.revenue === expectedBase, 'GROWTH_FORECAST_BASE_MISMATCH');
    return { assumptions: s, output: projectGrowth(s) };
  }) };
});

const effectiveScores = [...prior.aggregation.effectiveScores, ...growth.map(row => row.effectiveScore)];
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
const routeQualifications = [...prior.aggregation.routeQualifications, ...growth.map(({ effectiveScore }) =>
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
  effectiveFinancialHealth: categories.find(row => row.id === 'FH'), effectiveGrowthQuality: categories.find(row => row.id === 'GQ') };
process.stdout.write(JSON.stringify({
  ticker: input.ticker, cutoff: input.cutoff, scope: 'REAL_ISSUER_RESEARCH', implementation: GQ_EXECUTABLE,
  methodology: ref(configPath), input: config.input, prior: config.predecessorResult,
  executables: [engine, 'tools/scoring/validate_fpt_growth_quality.mjs'].map(ref),
  financialEvidence: { amountUnit: 'VND', historical, current, ratios: { revenueCagr: cagr('revenue'),
    parentNpatCagr: cagr('parentNpat'), pairedEPS: paired }, forecast, productivity, selectedCapital,
    qualifications: ['Historical pairs use within-report action adjustment. Current shares do not join the series.',
      'The 20% tax and financing-capital treatments are sensitivities only.', 'GQ-INC current capital and earnings scope unaligned.'] },
  growth, aggregation, researchRanking, investmentDecisionInput, decisionEligible: false, publicationAuthorized: false,
}, null, 2) + '\n');
