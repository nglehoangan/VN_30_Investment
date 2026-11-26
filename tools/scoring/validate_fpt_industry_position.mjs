import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const configPath = 'docs/03 SCORING/WP4_INDUSTRY_COMPETITIVE_POSITION_AMENDMENT_v1.0.json';
const read = path => readFileSync(resolve(root, path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ref = path => ({ path, sha256: sha(read(path)) });
const json = bytes => JSON.parse(bytes);
function check(ok, reason) { if (!ok) throw Error(reason); }
function pinned(pin) {
  const path = realpathSync(resolve(root, pin.path));
  check(path.startsWith(root + sep), 'INDUSTRY_PIN_ESCAPE');
  const bytes = readFileSync(path);
  check(sha(bytes) === pin.sha256, 'INDUSTRY_PIN_MISMATCH');
  return bytes;
}
check(JSON.stringify(process.argv.slice(2)) === '["--ticker","FPT"]', 'FPT_RESEARCH_ONLY');
const config = json(read(configPath));
pinned(config.owner);
pinned(config.predecessorAcceptance);
const input = json(pinned(config.input));
const prior = json(pinned(config.predecessorResult));
const v8 = json(pinned(config.officialV8)).input;
const v8Readback = json(pinned(config.officialV8Readback));
const stress = json(pinned(config.priorStress));
check(config.status === 'APPROVED_BASELINE' && !config.productionScoringAuthorized && !config.publicationAuthorized &&
  [prior, stress, input].every(row => row.ticker === 'FPT' && row.cutoff === '2026-11-13') &&
  input.sector === 'TECHNOLOGY', 'INDUSTRY_SCOPE_INVALID');
for (const record of Object.values(input.evidence)) pinned(record);
const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const engine = 'src/domain/current-scoring/ic-research.ts';
const { IC_METHODOLOGY, IC_EXECUTABLE, profiles, reviewIndustryOwnership, scoreIncrementalIndustry } = await load(engine);
const { aggregateResearchEffectiveScores, rankResearchEffectiveScores,
  buildResearchDecisionScoreInput } = await load('src/domain/current-scoring/research-effective-score.ts');
const { RUBRICS } = await load('src/domain/scoring/methodology.ts');
check(config.methodology === IC_METHODOLOGY && config.implementation === IC_EXECUTABLE &&
  Object.entries(profiles).every(([id, bands]) => config.profiles[id].map(row => row.band).join() === bands.join()),
  'INDUSTRY_METHODOLOGY_MISMATCH');

const authorizedIndustry = v8.assessments.find(row => row.subcategory === 'IC-IND');
check(authorizedIndustry?.selectedPoints === 2 && v8.artifactScope &&
  !prior.investmentDecisionInput.formalDecisionAuthorized, 'INDUSTRY_V8_SCOPE_UNRESOLVED');
const refs = new Set(authorizedIndustry.evidence.flatMap(row => row.refs).concat(authorizedIndustry.disconfirmingEvidence));
const v8Lineage = { scorecardId: v8Readback.id, cutoff: input.cutoff,
  recordedPoints: authorizedIndustry.selectedPoints, recordedBand: authorizedIndustry.assessment,
  observedAssessmentEvidence: v8.evidence.filter(row => refs.has(row.id)).map(row => ({ id: row.id, source: row.source,
    publishedAt: row.publishedAt, observation: row.observation })),
  disposition: 'HISTORICAL_AUTHORIZED_REFERENCE_ONLY; WP4 uses eligible underlying observations, not the V8 point or post-cutoff wrapper.' };
const o = input.operands;
const annualSource = pinned(input.evidence.fy_segment).toString();
const interimSource = pinned(input.evidence.res9m).toString();
const peerSource = pinned(input.evidence.cmc).toString();
const localized = n => n.toLocaleString('de-DE');
check(o.annualSegmentBillions.every(([, sales, pbt]) => annualSource.includes(`${localized(sales)}/${localized(pbt)}`)) &&
  o.currentSegmentMillions.every(value => interimSource.includes(localized(value)) ||
    pinned(input.evidence.q3).toString().includes(localized(value)) || interimSource.includes(String(value))) &&
  peerSource.includes('1,283'), 'INDUSTRY_OPERANDS_UNBOUND');
const financialEvidence = {
  annual: o.annualSegmentBillions.map(([year, sales, pbt, growth]) => ({ year, revenueVnd: sales * 1e9, pbtVnd: pbt * 1e9,
    reportedGrowth: growth / 100, margin: pbt / sales, definition: 'SEGMENT_PBT', nativeUnit: 'VND_BILLION' })),
  current: { revenueVnd: o.currentSegmentMillions[0] * 1e6, operatingResultVnd: o.currentSegmentMillions[1] * 1e6,
    margin: o.currentSegmentMillions[1] / o.currentSegmentMillions[0], nativeUnit: 'VND_MILLION',
    period: '9M2026', definition: 'REPORTED_SEGMENT_OPERATING_RESULT', marginTrendComparable: false,
    cashFlow: prior.financialEvidence.current.fcf, restatedRevenueGrowth: prior.financialEvidence.current.restatedRevenueGrowth },
  comparator: { issuer: 'CMC', revenueVnd: o.selectedCmcBillions * 1e9, nativeUnit: 'VND_BILLION_RETAINED_PRECISION',
    descriptiveRatio: o.annualSegmentBillions[1][1] / o.selectedCmcBillions,
    fptPeriod: '2024-01 to 2024-12', cmcPeriod: '2024-04 to 2025-03',
    fptBasis: 'INTERNATIONAL_IT_SERVICES', cmcBasis: 'GLOBAL_BUSINESS_BEFORE_GROUP_ELIMINATION',
    qualifiedRank: null, marketShare: null },
  stressContext: stress.financialEvidence.map(row => ({ stage: row.stage, scope: row.scope,
    stressedCases: row.estimates.severeStress })),
};
const cases = Object.values(input.cases);
const economicChannelReview = ['baseline', 'reassessment'].map(stage => ({
  stage, sameFamilyDistinctChannels: reviewIndustryOwnership(cases.map(entry => entry[stage].assessment)),
}));
check(economicChannelReview.every(row => row.sameFamilyDistinctChannels), 'INDUSTRY_DUPLICATE_ECONOMIC_CHANNEL');
const industry = cases.map(({ historical, ...entry }) => scoreIncrementalIndustry({
  ...entry, sector: input.sector, evidence: input.evidence,
}, historical));
const effectiveScores = [...prior.aggregation.effectiveScores, ...industry.map(row => row.effectiveScore)];
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
const routeQualifications = [...prior.aggregation.routeQualifications, ...industry.map(({ effectiveScore }) =>
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
  effectiveFinancialHealth: categories.find(row => row.id === 'FH'), effectiveGrowthQuality: categories.find(row => row.id === 'GQ'), effectiveIndustry: categories.find(row => row.id === 'IC') };
process.stdout.write(JSON.stringify({
  ticker: input.ticker, cutoff: input.cutoff, scope: 'REAL_ISSUER_RESEARCH', implementation: IC_EXECUTABLE,
  methodology: ref(configPath), input: config.input, prior: config.predecessorResult,
  executables: [engine, 'tools/scoring/validate_fpt_industry_position.mjs'].map(ref),
  financialEvidence, v8Lineage, economicChannelReview, industry, aggregation, researchRanking, investmentDecisionInput,
  decisionEligible: false, publicationAuthorized: false,
}, null, 2) + '\n');
