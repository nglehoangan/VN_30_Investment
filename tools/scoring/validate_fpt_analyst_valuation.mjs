import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const policyPath = 'docs/03 SCORING/WP5_VALUE_INVESTING_ANALYSIS_AMENDMENT_v2.0.json';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFileSync(resolve(root, path));
const ref = path => ({ path, sha256: sha(read(path)) });
const hash = value => sha(JSON.stringify(value));
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function check(ok, reason) { if (!ok) throw Error(reason); }
function pinned(pin) {
  const real = realpathSync(resolve(root, pin.path));
  check(real.startsWith(root + sep), 'VALUATION_PIN_ESCAPE');
  const bytes = readFileSync(real);
  check(sha(bytes) === pin.sha256, 'VALUATION_PIN_MISMATCH');
  return bytes;
}
const document = pin => JSON.parse(pinned(pin));
check(same(process.argv.slice(2), ['--ticker', 'FPT']), 'FPT_RESEARCH_ONLY');
const policy = document(ref(policyPath));
const owner = pinned(policy.owner).toString();
check(policy.status === 'APPROVED_BASELINE' && !policy.productionScoringAuthorized && !policy.publicationAuthorized &&
  owner.includes('owner approves the transition'), 'VALUATION_RESEARCH_AUTHORITY_REQUIRED');

const legacy = document(policy.legacyConfiguration);
const source = document(legacy.input);
const prior = document(policy.predecessorResult);
const external = document(legacy.externalEvidence);
const financialEvidence = prior.financialEvidence;
check(same(financialEvidence.externalEvidence, legacy.externalEvidence) && prior.ticker === 'FPT' &&
  prior.cutoff === '2026-11-13', 'FPT_LEGACY_IDENTITY');

const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const engine = 'src/domain/current-scoring/valuation-research-v20.ts';
const { VAL_V20_METHODOLOGY, evaluateAnalystValuation } = await load(engine);
const { shareholderIrr, shareholderFlows, marginOfSafety } = await load('src/domain/current-scoring/valuation-research.ts');
const { aggregateResearchEffectiveScores, rankResearchEffectiveScores,
  buildResearchDecisionScoreInput } = await load('src/domain/current-scoring/research-effective-score.ts');
const { RUBRICS } = await load('src/domain/scoring/methodology.ts');
check(policy.methodology === VAL_V20_METHODOLOGY, 'VALUATION_METHODOLOGY_IDENTITY');

const products = {};
const valuation = Object.fromEntries(['annual', 'current'].map(period => {
  const pins = policy.inputs[period];
  const freeze = document(pins.freeze);
  const stage = source.stages[period];
  const market = financialEvidence.markets[period];
  const foundation = financialEvidence.foundations[period];
  check(freeze.issuer === stage.ticker && freeze.exchange === stage.exchange && freeze.sector === stage.sector &&
    freeze.assessmentPeriod === period && freeze.cutoff === stage.cutoff && freeze.informationCutoff === stage.informationCutoff &&
    same(market, freeze.market) && same(financialEvidence.prices[period], freeze.marketObservation) &&
    same(freeze.researchManifest, legacy.externalEvidence), 'FREEZE_FINANCIAL_MARKET_OR_WINDOW_MISMATCH');
  const facts = new Map(freeze.facts.map(fact => [fact.id, fact]));
  check(facts.size === 3 && freeze.facts.length === facts.size && freeze.facts.every(fact => fact.class === 'FACT') &&
    facts.get('parent_npat')?.value === foundation.reportedParentNpat &&
    facts.get('parent_npat')?.scope === 'CONSOLIDATED_ATTRIBUTABLE_TO_PARENT_SHAREHOLDERS' &&
    facts.get('parent_npat')?.unit === 'VND' && facts.get('raw_close')?.unit === 'VND/share' &&
    facts.get('raw_close')?.value === market.price && facts.get('reported_ending_shares')?.unit === 'ordinary shares' &&
    facts.get('reported_ending_shares')?.value === market.shares, 'FREEZE_FACT_IDENTITY');
  pinned(freeze.marketObservation.source);
  const historical = Object.entries(freeze.evidence);
  for (const [id, item] of historical) {
    check(same(source.evidence[id], { path: item.path, sha256: item.sha256 }) &&
      item.underlyingAvailableBy === source.retainedPublicBy[id] &&
      item.underlyingAvailableBy <= stage.informationCutoff, 'FREEZE_EVIDENCE_TIMING_OR_IDENTITY');
    pinned(item);
  }
  const eligibleReports = Object.fromEntries(Object.entries(external.reports)
    .filter(([, row]) => row.publicBy <= stage.informationCutoff));
  const eligibleObs = Object.fromEntries(Object.entries(external.observations)
    .filter(([, row]) => eligibleReports[row.documentId] && row.publicBy <= stage.informationCutoff));
  check(same(eligibleReports, freeze.researchDocuments) && same(eligibleObs, freeze.observations), 'FREEZE_EXTERNAL_WINDOW');
  for (const row of Object.values(freeze.researchDocuments)) {
    check(pinned(row).subarray(0, 4).toString() === '%PDF', 'ERE_PDF_IDENTITY');
  }
  for (const obs of Object.values(freeze.observations)) {
    const report = freeze.researchDocuments[obs.documentId];
    check(obs.lineage === report.sha256 && obs.physicalPage >= 1 && obs.physicalPage <= report.pages &&
      obs.publicBy === report.publicBy, 'ERE_OBSERVATION_LINEAGE');
  }
  if (period === 'current') {
    check(same(financialEvidence.sharesReview, freeze.corporateActions.review) &&
      freeze.corporateActions.capitalizationSharesAlreadyInAnchor === Number(financialEvidence.sharesReview.capitalResolution.sharesIssued) &&
      same(freeze.economicAssessments.effectiveScores, prior.aggregation.effectiveScores.slice(0, 13)), 'FREEZE_ENTITLEMENT_OR_PRIOR_SCOPE');
    pinned(freeze.corporateActions.cutoffReview);
    for (const name of ['anchor', 'capitalResolution', 'events', 'listing', 'policy']) pinned(freeze.corporateActions.review[name]);
  }
  for (const entry of freeze.economicAssessments.retainedAssessmentPins ?? []) {
    const accepted = document(entry.source);
    const keys = entry.sections.map(pointer => pointer.slice(1).split('/'));
    check(accepted.ticker === stage.ticker && keys.every(parts => {
      const historical = parts.reduce((value, part) => value?.[part], accepted);
      return historical && Object.hasOwn(historical, 'points');
    }), 'FREEZE_HISTORICAL_ASSESSMENT_IDENTITY');
  }
  check(same(freeze.economicAssessments.source, policy.predecessorResult), 'FREEZE_PRIOR_RESULT_IDENTITY');
  const usable = (id, cutoff) => cutoff === stage.cutoff &&
    (Object.hasOwn(freeze.evidence, id) || id === 'market' ||
      freeze.researchDocuments[freeze.observations[id]?.documentId]?.admission === 'EXTERNAL_RESEARCH_EVIDENCE');
  const packet = { freeze: pins.freeze.sha256, initial: document(pins.initial), initialReview: document(pins.initialReview),
    finalReview: document(pins.finalReview), ...(pins.revision ? { revision: document(pins.revision) } : {}) };
  for (const proposal of [packet.initial, packet.revision].filter(Boolean)) {
    const calc = proposal.calculations;
    const norm = calc.normalization;
    const fy = financialEvidence.foundations.annual;
    const fund = 1 - fy.workingProfit / fy.reportedParentNpat;
    const annual = period === 'annual';
    const raw = annual ? fy.workingProfit / market.shares : foundation.reportedParentNpat / market.shares;
    const eps = norm.factors.map(([season, residual]) => Math.round(raw * season * (annual ? 1 : 1 - fund) * (1 - residual)));
    const est = (id, rubric) => proposal.estimates.find(row => row.id === id && row.rubrics.includes(rubric)).value;
    const pe = est('fair_pe', 'VAL-PRIMARY');
    const conservative = Math.round(eps[0] * (1 - norm.impairment));
    const mosValue = conservative * est('fair_pe', 'VAL-MOS');
    const scenarios = proposal.models['VAL-RET'].scenarios;
    check(calc.classification === 'CALCULATED' && raw === norm.residualBasis && fund === norm.referenceFundRate &&
      same(eps, norm.eps) && same(eps, est('normalized_eps', 'VAL-PRIMARY')) &&
      same(eps, est('normalized_eps', 'VAL-RET')) && conservative === norm.conservativeEps &&
      conservative === est('normalized_eps', 'VAL-MOS') && norm.impairment === est('permanent_impairment', 'VAL-MOS') &&
      same(calc.primary, [eps[0] * pe[0], ((eps[0] + eps[1]) / 2) * ((pe[0] + pe[1]) / 2), eps[1] * pe[1]]) &&
      calc.mosValue === mosValue && Math.abs(calc.mos - marginOfSafety(market.price, mosValue)) < 1e-12 &&
      Object.entries(scenarios).every(([caseId, scenario]) =>
        Math.abs(calc.returnIrr[caseId] - shareholderIrr(market.price, scenario)) < 1e-10), 'ANALYST_CALCULATION_MISMATCH');
  }
  const reviewed = packet.revision ?? packet.initial;
  const rows = evaluateAnalystValuation({ ...stage, market }, packet, hash, usable);
  const { scenarios } = reviewed.models['VAL-RET'];
  const returnChecks = Object.fromEntries(Object.entries(scenarios).map(([name, scenario]) => [name, {
    flows: shareholderFlows(scenario), irr: shareholderIrr(market.price, scenario),
    zeroCredit: shareholderIrr(market.price, { ...scenario, payout: 0 }),
    noRerating: shareholderIrr(market.price, { ...scenario, exitMultiple: market.price / scenario.eps }),
    zeroCreditNoRerating: shareholderIrr(market.price, { ...scenario, payout: 0, exitMultiple: market.price / scenario.eps }),
  }]));
  products[period] = { pins, reviewedProposal: hash(reviewed), terminal: reviewed.terminal,
    calculations: reviewed.calculations, returnChecks, legacyBoundedReturn: prior.valuation[period][1].boundedReturn };
  return [period, rows];
}));

const effectiveScores = [...prior.aggregation.effectiveScores.slice(0, 13), ...valuation.current];
const aggregate = aggregateResearchEffectiveScores(effectiveScores[0], effectiveScores.slice(1).flatMap(row =>
  row.points === null ? [] : [{ id: row.id, points: row.points, evidenceReference: policyPath }]));
const weight = id => RUBRICS.find(rubric => rubric.id === id).max;
const measure = rows => ({ count: rows.length, weight: rows.reduce((sum, row) => sum + weight(row.id), 0) });
const confirmed = effectiveScores.filter(row => row.validity === 'CONFIRMED_CURRENT');
const provisional = effectiveScores.filter(row => row.validity === 'PROVISIONAL');
const genuine = effectiveScores.filter(row => row.points === null);
const outside = RUBRICS.filter(row => !effectiveScores.some(result => result.id === row.id));
const coverage = { ...aggregate.coverage, confirmedCurrent: measure(confirmed), provisional: measure(provisional),
  genuineNR: measure(genuine), outsideRollout: measure(outside), unratedTotal: aggregate.coverage.genuineNR };
const categories = aggregate.categories.map(row => ({ ...row, includesProvisional: row.includesProvisional ||
  provisional.some(rubric => RUBRICS.find(item => item.id === rubric.id).category === row.id) }));
const valuationIds = new Set(valuation.current.map(row => row.id));
const routeQualifications = [...prior.aggregation.routeQualifications.filter(row => !valuationIds.has(row.id)), ...valuation.current.map(row =>
  ({ id: row.id, ...row.routeQualification }))];
const comparability = prior.aggregation.comparability;
const aggregation = { ...aggregate, categories, effectiveScores, routeQualifications, comparability, coverage,
  pointsByValidity: { confirmedCurrent: confirmed.reduce((v, x) => v + x.points, 0),
    provisional: provisional.reduce((v, x) => v + x.points, 0) },
  genuineNrInScope: genuine.map(row => row.id), outsideRollout: outside.map(row => row.id) };
const researchRanking = rankResearchEffectiveScores([{ ticker: prior.ticker, aggregation }])
  .map(row => ({ ...row, effectiveScores, coverage, routeQualifications, comparability }));
const gates = prior.investmentDecisionInput.gates;
const investmentDecisionInput = { ...buildResearchDecisionScoreInput(aggregation, gates), gates,
  effectiveScores, routeQualifications, comparability,
  ...Object.fromEntries([['FinancialHealth', 'FH'], ['GrowthQuality', 'GQ'], ['Industry', 'IC'], ['Valuation', 'VAL']]
    .map(([key, id]) => ['effective' + key, categories.find(row => row.id === id)])) };
process.stdout.write(JSON.stringify({ ticker: prior.ticker, cutoff: prior.cutoff, scope: 'REAL_ISSUER_RESEARCH',
  methodology: ref(policyPath), implementation: 'valuation-analyst-research-v2.0.0', prior: policy.predecessorResult,
  executables: [engine, 'tools/scoring/validate_fpt_analyst_valuation.mjs'].map(ref),
  valuation, products, aggregation, researchRanking, investmentDecisionInput,
  decisionEligible: false, publicationAuthorized: false }, null, 2) + '\n');
