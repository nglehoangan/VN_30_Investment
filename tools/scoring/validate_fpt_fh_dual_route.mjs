import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const configPath = 'docs/03 SCORING/WP2_FINANCIAL_HEALTH_DUAL_ROUTE_v1.1.json';
const read = path => readFileSync(resolve(root, path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ref = path => ({ path, sha256: sha(read(path)) });
const json = bytes => JSON.parse(bytes);
function check(ok, reason) { if (!ok) throw Error(reason); }
function pinned(pin) {
  const path = realpathSync(resolve(root, pin.path));
  check(path.startsWith(root + sep), 'DUAL_ROUTE_PIN_ESCAPE');
  const bytes = readFileSync(path);
  check(sha(bytes) === pin.sha256, 'DUAL_ROUTE_PIN_MISMATCH');
  return bytes;
}
check(JSON.stringify(process.argv.slice(2)) === '["--ticker","FPT"]', 'FPT_RESEARCH_ONLY');
const config = json(read(configPath));
pinned(config.owner);
pinned(config.predecessor);
const input = json(pinned(config.input));
const retained = json(pinned(config.legacyInput));
const legacy = json(pinned(config.legacyResult));
const cashFlow = json(pinned(retained.ownedEvidence.bq)).financials;
const refinancing = pinned(config.refinancingSource).toString().replaceAll('.', '');
check(refinancing.includes('43070812885074') && refinancing.includes('36890984827601'), 'REFINANCING_VALUES_UNBOUND');
check(config.status === 'APPROVED_BASELINE' && !config.productionScoringAuthorized && !config.publicationAuthorized &&
  input.ticker === 'FPT' && retained.ticker === input.ticker && legacy.ticker === input.ticker &&
  input.cutoff === retained.cutoff && legacy.cutoff === input.cutoff, 'DUAL_ROUTE_SCOPE_INVALID');
for (const row of Object.values(retained.evidence)) pinned(row);

const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const engine = 'src/domain/current-scoring/fh-dual-route.ts';
const { FH_DUAL_ROUTE, scoreIncrementalDualRouteFinancialHealth } = await load(engine);
const { aggregateResearchEffectiveScores, rankResearchEffectiveScores,
  buildResearchDecisionScoreInput } = await load('src/domain/current-scoring/research-effective-score.ts');
const { RUBRICS } = await load('src/domain/scoring/methodology.ts');
check(FH_DUAL_ROUTE === config.implementation, 'DUAL_ROUTE_IMPLEMENTATION_MISMATCH');

const financialEvidence = ['annual', 'current'].map((stage, index) => {
  const x = index ? legacy.financials.current : legacy.financials.annual.at(-1);
  const due = legacy.financials.liquidity[index];
  const cases = legacy.financials.stress[index].cases;
  return {
    stage, scope: x.scope, unit: 'VND',
    facts: { reportedCash: x.cash, verifiedUnrestrictedCash: null, restrictedCash: x.restrictedCash,
      reportedDeposits: x.bookDeposits, qualifiedDeposits: x.eligibleDeposits,
      shortDebtAndFinanceLeases: x.shortDebt, longDebtAndFinanceLeases: x.longDebt,
      grossInterest: x.interest, operatingLeases: due.obligations[1].amount,
      committedUndrawnFunding: null, unscheduledCommittedCapex: due.committedCapexUnscheduled,
      reportedCashCapex: index ? cashFlow.current.capex : x.capex,
      historicalCfo: index ? cashFlow.current.cfo : cashFlow.annual.at(-1).cfo,
      historicalRefinancing: index ? null : { draws: 43070812885074, repayments: 36890984827601 } },
    derived: { bookCashDebtCoverage: x.cash / x.shortDebt, bookCashDepositDebtCoverage: (x.cash + x.bookDeposits) / x.shortDebt,
      shortDebtShare: x.shortDebt / x.debt, directEbit: x.ebit, grossInterestCoverage: due.grossInterestCoverage },
    estimates: { ebitdaProxy: x.ebitdaProxy, severeStress: cases.filter(row => row.contraction === .25).map(row => ({
      ...row, stressedInterestCoverage: row.ebit / row.stressedInterest,
      stressedFcfProxy: row.operatingCashProxy - row.capex,
    })) },
    assumptions: ['Retained revenue, margin, interest and working-capital shocks.',
      'Book cash and assumed deposit fractions are sensitivities; no unrestricted stock or future committed refinancing is assumed.'],
    limitations: ['Deposit restrictions, obligor access and applicable guarantees are unresolved; no verified unrestricted cash amount.',
      'Only known selected obligations are quantified; verified mandatory maintenance CAPEX is unavailable.'],
  };
});
const fh = retained.cases.map((row, i) => {
  if (i === 0) return legacy.fh[0];
  const old = row.assessment;
  const id = old.baseline.assessment.id;
  const assessment = input.assessments[id];
  const bind = (stage, key) => ({
    ...stage, methodology: config.methodology, implementation: FH_DUAL_ROUTE,
    assessment: { full: stage.assessment, ...assessment[key] },
  });
  return scoreIncrementalDualRouteFinancialHealth({
    ...old, baseline: bind(old.baseline, 'annual'), reassessment: bind(old.reassessment, 'current'), evidence: retained.evidence,
  }, row.applicability);
});
const bq = legacy.aggregation.effectiveScores.slice(0, 4);
const effectiveScores = [...bq, ...fh.map(row => row.effectiveScore)];
const aggregate = aggregateResearchEffectiveScores(bq[0],
  effectiveScores.slice(1).flatMap(row => row.points === null ? [] : [{ id: row.id, points: row.points, evidenceReference: config.input.path }]));
const provisional = effectiveScores.slice(1).filter(row => row.points !== null && row.validity === 'PROVISIONAL');
const weight = id => RUBRICS.find(row => row.id === id).max;
const measure = rows => ({ count: rows.length, weight: rows.reduce((sum, row) => sum + weight(row.id), 0) });
const genuine = effectiveScores.filter(row => row.points === null);
const outside = RUBRICS.filter(row => !effectiveScores.some(item => item.id === row.id));
const transfer = measure(provisional);
const coverage = { ...aggregate.coverage,
  confirmedCurrent: { count: aggregate.coverage.confirmedCurrent.count - transfer.count, weight: aggregate.coverage.confirmedCurrent.weight - transfer.weight },
  provisional: { count: aggregate.coverage.provisional.count + transfer.count, weight: aggregate.coverage.provisional.weight + transfer.weight },
  genuineNR: measure(genuine), outsideRollout: measure(outside), unratedTotal: aggregate.coverage.genuineNR };
const categories = aggregate.categories.map(row => ({ ...row, includesProvisional: row.includesProvisional ||
  provisional.some(rubric => RUBRICS.find(item => item.id === rubric.id).category === row.id) }));
const aggregation = { ...aggregate, categories, coverage, effectiveScores,
  genuineNrInScope: genuine.map(row => row.id), outsideRollout: outside.map(row => row.id),
  confirmedCurrentInvestmentScore: transfer.count ? null : aggregate.confirmedCurrentInvestmentScore,
  provisionalInvestmentScore: aggregate.provisionalInvestmentScore ?? (transfer.count ? aggregate.confirmedCurrentInvestmentScore : null) };
const researchRanking = rankResearchEffectiveScores([{ ticker: input.ticker, aggregation }])
  .map(row => ({ ...row, effectiveScores, coverage }));
const { stage0, hardVeto, residualRisk } = legacy.investmentDecisionInput.gates;
const investmentDecisionInput = { ...buildResearchDecisionScoreInput(aggregation, { stage0, hardVeto, residualRisk }),
  effectiveScores, effectiveFinancialHealth: categories.find(row => row.id === 'FH') };
process.stdout.write(JSON.stringify({
  ticker: input.ticker, cutoff: input.cutoff, scope: 'REAL_ISSUER_RESEARCH', implementation: FH_DUAL_ROUTE,
  methodology: ref(configPath), input: config.input, sourceEvaluation: config.legacyResult, executables: [engine,
    'tools/scoring/validate_fpt_fh_dual_route.mjs'].map(ref),
  financialEvidence, fh, aggregation, researchRanking, investmentDecisionInput,
  decisionEligible: false, publicationAuthorized: false,
}, null, 2) + '\n');
