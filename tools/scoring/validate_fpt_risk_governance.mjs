import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const policyPath = 'docs/03 SCORING/WP6_RISK_GOVERNANCE_AMENDMENT_v1.0.json';
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
const accepted = document(policy.predecessor);
const owner = pinned(policy.owner).toString();
const ownership = document(policy.ownership);
const prior = document(accepted.result);
const workflow = document(accepted.workflow);
check(policy.status === 'APPROVED_BASELINE' && owner.includes('owner approves WP5 v2.0 Final Research Acceptance') &&
  accepted.status === 'OWNER_ACCEPTED_RESEARCH_ONLY' && !accepted.formalAuthority &&
  !policy.productionScoringAuthorized && !policy.publicationAuthorized &&
  same(accepted.owner, policy.owner) && prior.ticker === 'FPT' && prior.cutoff === '2026-11-13' &&
  accepted.executionId === workflow.executionId && accepted.queueId === workflow.queueId &&
  same(prior.aggregation.effectiveScores, workflow.evidence.find(row => row.stage === 'SCORING').result.aggregation.effectiveScores) &&
  prior.aggregation.effectiveScores.length === 16 && prior.aggregation.assessedPoints === 39 &&
  prior.aggregation.ratedWeight === 85, 'WP5_ACCEPTED_BASELINE_REQUIRED');
check(same(prior.investmentDecisionInput.gates, {
  stage0: 'UNKNOWN', hardVeto: 'PENDING', residualRisk: 'NOT_RATED',
  financialHealth: 'NOT_ASSESSED', valuation: 'NOT_ASSESSED', portfolio: 'NOT_ASSESSED',
}), 'FORMAL_RISK_AUTHORITY_UNCHANGED_REQUIRED');
const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const engine = 'src/domain/current-scoring/risk-governance-research.ts';
const { thesisSensitivity, evaluateRiskGovernance, resolveRiskEffectiveScore } = await load(engine);
const { aggregateResearchEffectiveScores, rankResearchEffectiveScores,
  buildResearchDecisionScoreInput } = await load('src/domain/current-scoring/research-effective-score.ts');
const { RUBRICS } = await load('src/domain/scoring/methodology.ts');
const product = {};
const valuation = Object.fromEntries(['annual','current'].map(period => {
  const pins = policy.inputs[period];
  const freeze = document(pins.freeze);
  const model = prior.products[period];
  const annual = period === 'annual';
  check(freeze.ticker === prior.ticker && freeze.assessmentPeriod === period &&
    freeze.cutoff === (annual ? '2025-12-31' : prior.cutoff) &&
    freeze.informationCutoff === (annual ? '2026-04-08' : prior.cutoff) && !freeze.historicalPit &&
    same(freeze.modelInput.proposals, model.pins) && same(freeze.modelInput.source.path, accepted.result.path) &&
    freeze.modelInput.source.sha256 === accepted.result.sha256, 'RG_FREEZE_IDENTITY_REQUIRED');
  const sourceBytes = Object.fromEntries(Object.entries(freeze.sources).map(([id, pin]) => [id, pinned(pin)]));
  const notes = JSON.parse(sourceBytes.notes);
  const fyRevenue = JSON.parse(sourceBytes.canonical).canonicalFacts.find(fact =>
    fact.ticker === freeze.ticker && fact.itemId === 'REVENUE' &&
    fact.period.start === '2025-01-01' && fact.period.end === '2025-12-31');
  check(Number(fyRevenue?.value) === 70112825100710 &&
    notes.documents[3].pages[6].text.includes('HAN 4324') &&
    notes.documents[3].pages[53].text.includes('10.260.939') &&
    notes.documents[3].pages[61].text.includes('545.779.810.843'),
  'RG_FY_GOVERNANCE_OR_CANONICAL_IDENTITY');
  const external = document(freeze.external);
  const reports = Object.fromEntries(Object.entries(external.reports).filter(([, doc]) =>
    doc.publicBy <= freeze.informationCutoff));
  const observations = Object.fromEntries(Object.entries(external.observations).filter(([, obs]) =>
    reports[obs.documentId] && obs.publicBy <= freeze.informationCutoff));
  check(same(reports, freeze.researchDocuments) && same(observations, freeze.observations), 'RG_EXTERNAL_WINDOW_REQUIRED');
  for (const doc of Object.values(reports)) check(pinned(doc).subarray(0,4).toString() === '%PDF', 'RG_RESEARCH_PDF_PIN');
  const known = (source, pointer) => {
    if (source === 'notes' || source === 'q3Extract') {
      const doc = source === 'notes' ? notes : JSON.parse(sourceBytes.q3Extract);
      return !!pointer.split('/').slice(1).reduce((value, key) => value?.[key], doc);
    }
    if (source === 'external') {
      const obs = observations[pointer.split('/').at(-1)];
      return !!obs && reports[obs.documentId].admission === 'EXTERNAL_RESEARCH_EVIDENCE' &&
        obs.lineage === reports[obs.documentId].sha256;
    }
    if (!sourceBytes[source]) return false;
    if (/^L\d/.test(pointer)) return [...pointer.matchAll(/L(\d+)/g)]
      .every(([, line]) => !!sourceBytes[source].toString().split('\n')[Number(line)-1]);
    return true;
  };
  const proposal = document(model.pins.revision ?? model.pins.initial);
  const sensitivity = thesisSensitivity(proposal.market.price, proposal.models['VAL-RET'].scenarios);
  check(hash(proposal) === model.reviewedProposal &&
    Object.keys(sensitivity.joint).every(id => Math.abs(sensitivity.joint[id] - model.calculations.returnIrr[id]) < 1e-10) &&
    sensitivity.rows.every(row => row.spread !== null), 'WP5_SENSITIVITY_REPLAY_MISMATCH');
  const packet = { initial: document(pins.initial), initialReview: document(pins.initialReview),
    finalReview: document(pins.finalReview), ...(pins.revision ? { revision: document(pins.revision) } : {}) };
  const assessments = Object.values((packet.revision ?? packet.initial).candidates['RG-RISK']);
  check(assessments.every(a => a.channels.every(c => Object.hasOwn(ownership,c.owner))), 'RG_OWNERSHIP_MATRIX_REQUIRED');
  const rows = evaluateRiskGovernance({ ...freeze, sha256: pins.freeze.sha256 }, packet, sensitivity, hash, known);
  const q3 = annual ? null : JSON.parse(sourceBytes.q3Extract);
  if (q3) {
    const cells = JSON.parse(sourceBytes.q3).cells;
    check(q3.ticker === freeze.ticker && q3.publicBy <= freeze.informationCutoff &&
      q3.periodEnd === '2026-09-30' && q3.source.path === freeze.sources.retainedQ3.path &&
      q3.source.sha256 === freeze.sources.retainedQ3.sha256 && q3.fx.physicalPage === 42 &&
      q3.relatedParties.physicalPage === 47 && q3.fx.usdHedgedSourceCells[0] === '-' &&
      Object.values(cells).some(cell => Number(cell.value) === q3.relatedParties.groupRevenueVnd),
      'RG_Q3_REVIEWED_SOURCE_IDENTITY');
  }
  const hedge = { classification: 'CALCULATED', fiscal2024: { disclosedUsd: 32900000, hedgedUsd: 25000000,
    ratio: 25000000 / 32900000, gapsUsd: 32900000-25000000 },
  fiscal2025: { disclosedUsd: 6750000, hedgedUsd: 6750000, ratio: 1, gapsUsd: 0 },
  ...(q3 ? { latestQ3: { jpyLoanVnd: q3.fx.jpyVndEquivalents[0], fyJpyLoanVnd: q3.fx.jpyVndEquivalents[1],
    originalCurrencyBalanceRatio: q3.fx.jpyLoans[0] / q3.fx.jpyLoans[1], hedgeCoverage: null,
    gbpLoans: q3.fx.gbpLoans[0], usdHedgedSourceCells: q3.fx.usdHedgedSourceCells } } : {}) };
  const fyLoanTable = notes.documents[3].pages[50].text;
  check(['6.750.000,00','32.900.000,00','25.000.000,00'].every(value => fyLoanTable.includes(value)) &&
    (annual || ['36.846.652.367,00','17.440.367.486,00','6.003.607.117.212']
      .every(value => notes.documents[1].pages[48].text.includes(value))), 'RG_SCOPED_LOAN_DISCLOSURE_REQUIRED');
  const rptSales = q3 ? q3.relatedParties.salesVnd.reduce((sum, value) => sum + value, 0) : 545779810843;
  const revenue = q3 ? q3.relatedParties.groupRevenueVnd : Number(fyRevenue.value);
  const rptPurchases = q3 ? q3.relatedParties.purchasesVnd.reduce((sum,value)=>sum+value,0) : 905686036632;
  product[period] = { pins, sensitivity, hedge, relatedPartySalesMateriality: {
    classification: 'CALCULATED', reportedSalesVnd: rptSales, reportedPurchasesVnd: rptPurchases, groupRevenueVnd: revenue,
    ratio: rptSales / revenue, limitation: 'Gross disclosed sales only; no fairness or net exposure inference.' },
    selectedWp5Inputs: { primary: model.calculations.primary, normalizedEps: model.calculations.normalization.eps,
      conservativeValue: model.calculations.mosValue }, findings: rows.flatMap(row => row.findings) };
  return [period, rows];
}));
const effectiveRisk = valuation.current.map((row, i) => resolveRiskEffectiveScore(row, valuation.annual[i]));
const effectiveScores = [...prior.aggregation.effectiveScores, ...effectiveRisk];
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
const routeQualifications = [...prior.aggregation.routeQualifications, ...effectiveRisk.map(row =>
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
  ...Object.fromEntries([['FinancialHealth', 'FH'], ['GrowthQuality', 'GQ'], ['Industry', 'IC'], ['Valuation', 'VAL'], ['RiskGovernance', 'RG']]
    .map(([key, id]) => ['effective' + key, categories.find(row => row.id === id)])) };
process.stdout.write(JSON.stringify({ ticker: prior.ticker, cutoff: prior.cutoff, scope: 'REAL_ISSUER_RESEARCH',
  methodology: ref(policyPath), implementation: 'risk-governance-research-v1.0.0', prior: accepted.result,
  executables: [engine, 'tools/scoring/validate_fpt_risk_governance.mjs'].map(ref),
  valuation, products: product, aggregation, researchRanking, investmentDecisionInput,
  researchResidualRisk: effectiveRisk[1].routeQualification.researchResidualRisk,
  formalResidualRisk: gates.residualRisk, decisionEligible: false, publicationAuthorized: false }, null, 2) + '\n');
