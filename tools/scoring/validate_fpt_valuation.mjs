import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const configPath = 'docs/03 SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.0.json';
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
const prior = json(pinned(config.predecessorResult));
const evidence = Object.fromEntries(Object.entries(input.evidence).map(([id, pin]) => [id, pinned(pin)]));
check(config.status === 'APPROVED_BASELINE' && !config.productionScoringAuthorized && !config.publicationAuthorized &&
  [prior, input].every(r => r.ticker === 'FPT' && r.cutoff === '2026-11-13'), 'VALUATION_SCOPE_INVALID');
const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const engine = 'src/domain/current-scoring/valuation-research.ts';
const { VAL_METHODOLOGY, VAL_EXECUTABLE, evaluateValuation, shareholderIrr, reverseGrowth, ownerEarningsDcf, marginOfSafety, valuationMethods } = await load(engine);
const { aggregateResearchEffectiveScores, rankResearchEffectiveScores,
  buildResearchDecisionScoreInput } = await load('src/domain/current-scoring/research-effective-score.ts');
const { RUBRICS } = await load('src/domain/scoring/methodology.ts');
check(config.methodology === VAL_METHODOLOGY && config.implementation === VAL_EXECUTABLE, 'VALUATION_IDENTITY_MISMATCH');
const history = json(evidence.market);
const sharesReview = json(evidence.share_review);
const admission = json(evidence.cutoff_admission);
for (const key of ['anchor', 'capitalResolution', 'events', 'listing', 'policy']) pinned(sharesReview[key]);
pinned(admission.price.lineage.authority);
pinned(admission.price.lineage.raw);
const verifyClose = (cutoff, hash, expected) => {
  const dates = cutoff.split('-');
  const requestedDate = [dates[1], dates[2], dates[0]].join('/');
  const trade = [dates[2], dates[1], dates[0]].join('/');
  const request = history.requests.find(r => r.sha256 === hash);
  const matches = history.prices.filter(row => row.date === cutoff && row.responseSha256 === hash);
  check(history.provider === 'CAFEF' && history.symbol === 'FPT' && history.exchange === 'HOSE' &&
    matches.length === 1 && request?.httpStatus === 200 && request.parameters.Symbol === 'FPT' &&
    request.parameters.ExchangeType === 'HOSE' && request.parameters.StartDate === requestedDate &&
    request.parameters.EndDate === requestedDate && sha(request.rawResponse) === hash,
    'VALUATION_RAW_CLOSE_SOURCE_INTEGRITY');
  const body = json(request.rawResponse);
  const retained = body.Data.Data.filter(row => row.Symbol === 'FPT' && row.Ngay === trade);
  check(body.Success && retained.length === 1 && retained[0].GiaDongCua === matches[0].raw.GiaDongCua &&
    retained[0].GiaDongCua * 1000 === expected && request.receivedAt === matches[0].receivedAt,
    'VALUATION_RAW_CLOSE_ROW_MISMATCH');
  return { date: cutoff, field: 'GiaDongCua', nativeValue: retained[0].GiaDongCua,
    value: expected, unit: 'VND_PER_SHARE', responseSha256: hash, receivedAt: request.receivedAt, source: input.evidence.market,
    historicalPitAuthority: false };
};
const cutoffPrice = verifyClose('2026-11-13', '6e334cb4dfde2722ecc5319403acc9aecb4929c548cbc3a37e9e06769c9817a1', 50100);
const annualPrice = verifyClose('2025-12-31', '720a10640ef658546734a26613a8b004a7667ae6ad1512bf323182c3f42433a5', 95800);
check(admission.price.field === cutoffPrice.field && admission.price.value === String(cutoffPrice.value) &&
  admission.price.unit === cutoffPrice.unit && sharesReview.cutoff === cutoffPrice.date &&
  sharesReview.status === 'CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS' &&
  sharesReview.completeNegativeSearch === false && sharesReview.ticker === 'FPT' &&
  sharesReview.capitalResolution.sharesIssued === '171401226' &&
  evidence.annual.toString().includes('1.703.507.121'), 'VALUATION_SHARE_OR_ADMISSION_MISMATCH');

const historicalShares = 1703507121;
const currentShares = Number(sharesReview.shares);
const currentNpat = json(evidence.q3).cells.find(row =>
  row.concept === 'NET_INCOME_ATTRIBUTABLE_PARENT' && row.period.start === '2026-01-01');
check(currentNpat?.value === '7778081180761' && currentShares === 1885727648, 'VALUATION_FINANCIAL_OPERANDS_UNBOUND');
const currentEpsProxy = Number(currentNpat.value) * 4 / 3 / currentShares;
const annualEps = input.financialOperands.fyWorkingProfit / historicalShares;
const market = (price, shares, shareBasis) => ({ ticker: 'FPT', exchange: 'HOSE', date: price.date,
  price: price.value, shares, rawField: price.field, shareBasis, verifiedPrice: true, verifiedShares: true,
  evidence: 'RETAINED_RAW_CLOSE' });
const markets = { annual: market(annualPrice, historicalShares, 'FY2025_REPORTED_ENDING_ORDINARY_SHARES'),
  current: market(cutoffPrice, currentShares, sharesReview.status) };
const qualification = (key, dates, eps) => {
  const entry = input.stages[key];
  return evaluateValuation({ ...entry, market: markets[key], assumptions: entry.assumptions.map(row =>
    row.id === 'working_eps' ? { ...row, value: eps } : row) }, (ref, cutoff) => Object.hasOwn(evidence, ref) && cutoff === dates);
};
const valuation = { annual: qualification('annual', annualPrice.date, annualEps),
  current: qualification('current', cutoffPrice.date, currentEpsProxy) };
const sharePrice = cutoffPrice.value;
const sensitivity = (eps, growth, exitMultiple, payout, dilution = .007) => ({ eps, growth, exitMultiple, payout, dilution });
const currentTrials = [
  sensitivity(currentEpsProxy, .05, 10, 0), sensitivity(currentEpsProxy, .10, 14, .20),
  sensitivity(currentEpsProxy, .15, 18, .30),
];
const noRerating = sensitivity(4950, .10, sharePrice / 4950, .20, .007);
const returnScenarios = currentTrials.map(parameters => ({ parameters, irr: shareholderIrr(sharePrice, parameters) }));
const currentDcf = [[.05, .28, .16], [.10, .45, .14], [.15, .71, .12]].map(([growth, conversion, discount]) => {
  const dcf = ownerEarningsDcf({ eps: currentEpsProxy, growth, dilution: .007 }, conversion, discount, .03);
  return { growth, conversion, discount, ...dcf, mos: marginOfSafety(sharePrice, dcf.value) };
});
const earnings = [[4400, 10], [4950, 12], [5500, 14]].map(([eps, multiple]) =>
  ({ eps, multiple, value: eps * multiple, mos: marginOfSafety(sharePrice, eps * multiple) }));
const reverse = [.08, .12, .15, .18, .20, .22].map(target => ({ target,
  noReratingGrowth: reverseGrowth(sharePrice, target, noRerating),
  compressedMultipleGrowth: reverseGrowth(sharePrice, target, { ...noRerating, exitMultiple: 8 }) }));
const historicalIllustration = [ [.07, 16, 1000], [.10, annualPrice.value / annualEps, 2000], [.12, 20, 2000] ]
  .map(([growth, multiple, dps]) => {
    // Fixed nominal dividends are separate from the earnings growth path.
    const terminal = annualEps * ((1 + growth) / 1.007) ** 5 * multiple;
    const npv = r => Array.from({length: 5}, (_, i) => (dps + (i === 4 ? terminal : 0)) / (1 + r) ** (i + 1))
      .reduce((sum, v) => sum + v, -annualPrice.value);
    let low = -.95, high = 1;
    for (let i = 0; i < 80; i++) { const mid = (low + high) / 2; if (npv(mid) > 0) low = mid; else high = mid; }
    return { growth, multiple, dps, terminal, irr: (low + high) / 2 };
  });
const financialEvidence = {
  validationScope: 'ISOLATED_RESEARCH_REPLAY_NOT_HISTORICAL_PIT',
  prices: { annual: annualPrice, current: cutoffPrice }, markets, sharesReview,
  foundations: { annual: { reportedParentNpat: input.financialOperands.fyParentNpat, workingProfit: input.financialOperands.fyWorkingProfit,
    workingEps: annualEps, indicativePe: annualPrice.value / annualEps, marketCap: annualPrice.value * historicalShares },
  current: { reportedParentNpat: Number(currentNpat.value), annualizedParentNpat: Number(currentNpat.value) * 4 / 3,
    workingEps: currentEpsProxy, indicativePe: sharePrice / currentEpsProxy, marketCap: sharePrice * currentShares } },
  assumptionQualification: input.stages,
  valuation: { normalizedEpsRange: null, qualifiedPrimaryValue: null, qualifiedBaseIrr: null,
    qualifiedConservativeValue: null, qualifiedMos: null },
  sensitivities: { classification: 'SENSITIVITY_ONLY', currentDcf, earnings, returnScenarios, historicalIllustration,
    noRerating: { parameters: noRerating, irr: shareholderIrr(sharePrice, noRerating) }, reverse,
    epsHaircuts: [0, .1, .2, .3].map(haircut => ({ haircut, eps: currentEpsProxy * (1 - haircut) })) },
};
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
  ticker: input.ticker, cutoff: input.cutoff, scope: 'REAL_ISSUER_RESEARCH', implementation: VAL_EXECUTABLE,
  methodology: ref(configPath), input: config.input, prior: config.predecessorResult,
  executables: [engine, 'tools/scoring/validate_fpt_valuation.mjs'].map(ref),
  financialEvidence, valuationMethods, valuation, aggregation, researchRanking, investmentDecisionInput,
  decisionEligible: false, publicationAuthorized: false,
}, null, 2) + '\n');
