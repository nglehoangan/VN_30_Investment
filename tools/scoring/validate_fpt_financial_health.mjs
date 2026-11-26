import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const configPath = 'docs/03 SCORING/WP2_FINANCIAL_HEALTH_AMENDMENT_v1.0.json';
const read = path => readFileSync(resolve(root, path));
const json = bytes => JSON.parse(bytes);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ref = path => ({ path, sha256: sha(read(path)) });
function check(valid, code) { if (!valid) throw Error(code); }
function pin(p) {
  const absolute = realpathSync(resolve(root, p.path));
  check(absolute.startsWith(root + sep), 'SOURCE_PATH_OUTSIDE_REPOSITORY');
  const bytes = readFileSync(absolute);
  check(sha(bytes) === p.sha256, 'FH_PIN_MISMATCH');
  return bytes;
}
const args = JSON.stringify(process.argv.slice(2));
const html = args === '["--ticker","FPT","--html"]';
check(html || args === '["--ticker","FPT"]', 'FPT_RESEARCH_ONLY');
const config = json(read(configPath));
pin(config.owner);
check(config.status === 'APPROVED_BASELINE' && !config.productionScoringAuthorized && !config.publicationAuthorized &&
  config.acceptedWp1.status === 'ACCEPTED_AND_CLOSED' && json(pin(config.px01)).approvedRoutes.PX01 === 'FH-LIQ',
  'FH_SCOPE_OR_PROXY_AUTHORITY_INVALID');
const packet = json(pin(config.input));
const accepted = json(pin(config.acceptedWp1.result));
const bq = accepted.evidence.find(row => row.stage === 'SCORING').result;
check(packet.ticker === 'FPT' && accepted.ticker === packet.ticker && accepted.status === 'COMPLETED' &&
  bq.aggregation.businessQuality.points === 14 && bq.aggregation.businessQuality.validity === 'PROVISIONAL' &&
  packet.cases.every(({ assessment }) => assessment.sector === 'TECHNOLOGY' && assessment.review.cutoff === packet.cutoff &&
    [assessment.baseline, assessment.reassessment].every(stage => stage.methodology === config.methodology &&
      stage.implementation === config.implementation)), 'WP2_IDENTITY_MISMATCH');
const evidence = Object.fromEntries(Object.entries(packet.evidence).map(([id, item]) => {
  const lines = pin(item).toString().split('\n');
  const [first, last] = item.locator.lines;
  check(first >= 1 && last <= lines.length && lines.slice(first - 1, last).some(line => line.includes(item.locator.contains)),
    'FH_EVIDENCE_LOCATOR_INVALID');
  return [id, item];
}));
const display = json(pin(packet.ownedEvidence.display));
const canon = json(pin(packet.ownedEvidence.canonical)).canonicalFacts;
const eq = json(pin(packet.ownedEvidence.eq));
const priorBq = json(pin(packet.ownedEvidence.bq));
const q3 = json(pin(packet.ownedEvidence.q3));
check(display.ticker === 'FPT' && eq.ticker === 'FPT' && priorBq.ticker === 'FPT' && q3.sourceReceipt.ticker === 'FPT',
  'FH_FINANCIAL_ISSUER_MISMATCH');
function annualCell(year, x) {
  const variant = display.reports[x.report].periods[year].variants.find(item => item.id === x.variantId);
  const group = variant.groups[x.group];
  check(variant.reportingScope === 'CONSOLIDATED' && group.sourcePage === x.page && group.unitEvidence.currency === 'VND' &&
    group.unitEvidence.scale === '1' && group.rows[x.row].value === x.value && variant.source.payloadHash === x.sourceHash,
    'FH_ANNUAL_CELL_INVALID');
  return Number(x.value);
}
const annual = packet.annual.map(({ year, cash, da, interest }) => {
  const row = canon[cash.index];
  check(row.ticker === 'FPT' && row.scope === 'CONSOLIDATED' && row.currency === 'VND' && row.fiscalYear === year &&
    row.itemId === 'CASH_AND_EQUIVALENTS' && row.reportPeriodType === 'ANNUAL' && row.qualified && row.value === cash.value &&
    row.sourceHash === cash.sourceHash, 'FH_CASH_CELL_INVALID');
  const x = eq.financials.find(record => record.year === String(year));
  const p = priorBq.financials.annual.find(record => record.year === year);
  const ebitdaProxy = x.ebit + annualCell(year, da);
  const indicativeNetDebt = x.debt - Number(cash.value);
  return { year, scope: 'FULL_FTEL_CONSOLIDATION', cash: Number(cash.value), restrictedCash: null,
    eligibleDeposits: null, bookDeposits: x.shortDeposits, shortDebt: x.shortDebt, longDebt: x.longDebt,
    debt: x.debt, equity: x.equity, interest: annualCell(year, interest), ebit: x.ebit,
    ebitdaProxy, indicativeNetDebt, indicativeNetDebtEbitda: indicativeNetDebt / ebitdaProxy,
    qualifiedNetDebt: null, receivables: p.receivables, revenue: p.revenue, capex: p.capex };
});
function currentCell(concept) {
  const cell = q3.cells.find(item => item.concept === concept);
  check(cell.ticker === 'FPT' && cell.scope === 'CONSOLIDATED' && cell.unit === 'VND' &&
    cell.period.end === '2026-09-30' && cell.sourceHash === q3.sourceReceipt.sha256, 'FH_CURRENT_CELL_INVALID');
  return Number(cell.value);
}
function boundAmount(raw, sources) {
  check(sources.some(id => pin(evidence[id]).toString().replaceAll('.', '').includes(raw)), 'FH_UNBOUND_AMOUNT');
  return Number(raw);
}
pin(packet.ownedEvidence.q3Pdf);
check(packet.ownedEvidence.q3Pdf.sha256 === q3.sourceReceipt.sha256, 'FH_Q3_PDF_SCOPE_MISMATCH');
function visualCell(key, page, code) {
  const cell = packet.funding.current.visuallyReviewed[key];
  check(cell.page === page && cell.code === code && /^\d+$/.test(cell.value), 'FH_INVALID_VISUAL_CELL');
  return Number(cell.value);
}
const fy = annual.at(-1);
const current = { period: '2026-09-30', scope: 'FTEL_EQUITY_METHOD',
  cash: currentCell('CASH_AND_EQUIVALENTS'), shortDebt: currentCell('SHORT_TERM_FINANCIAL_BORROWINGS'),
  longDebt: currentCell('LONG_TERM_FINANCIAL_BORROWINGS'), receivables: currentCell('RECEIVABLES'),
  bookDeposits: boundAmount(packet.funding.current.deposits, ['q3Liq']),
  equityApproxTrillion: packet.funding.current.equityApproxTrillion,
  interest: visualCell('interest', 7, '24'),
  ebit: boundAmount(packet.funding.current.ebit, ['bridge']),
  restrictedCash: null, eligibleDeposits: null, qualifiedNetDebt: null, ebitdaProxy: null,
};
current.debt = current.shortDebt + current.longDebt;
current.indicativeNetDebt = current.debt - current.cash;
current.ebitdaProxy = current.ebit + visualCell('da', 10, '02');
current.indicativeAnnualizedNetDebtEbitda = current.indicativeNetDebt / (current.ebitdaProxy * 4 / 3);
const leases = [boundAmount(packet.funding.annual.lease, ['fyLiq']),
  boundAmount(packet.funding.current.lease, ['q3Liq'])];
const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const engine = 'src/domain/current-scoring/fh-research.ts';
const incremental = 'src/domain/current-scoring/fh-incremental.ts';
const aggregationPath = 'src/domain/current-scoring/research-effective-score.ts';
const { FH_RESEARCH, runFinancialStress, timedLiquidity, positiveDenominatorRatio } = await load(engine);
const { scoreIncrementalFinancialHealth } = await load(incremental);
const { aggregateResearchEffectiveScores, rankResearchEffectiveScores, buildResearchDecisionScoreInput } = await load(aggregationPath);
check(FH_RESEARCH === config.implementation, 'FH_IMPLEMENTATION_MISMATCH');
const liquidity = [fy, current].map((x, i) => {
  const obligations = [{ id: 'principal', amount: x.shortDebt, month: 12 }, { id: 'operating-lease', amount: leases[i], month: 12 }];
  const bookResources = [{ id: 'cash', amount: x.cash, month: 0, kind: 'UNVERIFIED' },
    { id: 'deposits', amount: x.bookDeposits, month: 12, kind: 'UNVERIFIED' }];
  const binding = timedLiquidity(obligations, bookResources);
  const due = binding[0].due;
  return { scope: x.scope, obligations, bookResources, qualifiedResourceAmount: null, bindingCoverage: null,
    shortTermLeaseIncludedInPrincipal: true, operatingLeaseSeparate: true,
    committedCapexUnscheduled: i === 0 ? boundAmount(packet.funding.annual.committedCapexUnscheduled, ['fyCommit']) : null,
    breakEvenDepositFractionBeforeOtherObligations: (due - x.cash) / x.bookDeposits,
    sensitivities: [0, .25, .50, .75, 1].map(fraction => ({
      fraction, ratio: positiveDenominatorRatio(x.cash + fraction * x.bookDeposits, due, true),
      surplus: x.cash + fraction * x.bookDeposits - due })),
    grossInterestCoverage: positiveDenominatorRatio(x.ebit, x.interest, true), covenant: 'UNRESOLVED' };
});
const stress = [fy, current].map((x, i) => {
  const revenue = i === 0 ? fy.revenue : priorBq.financials.current.revenue * 4 / 3;
  return { scope: x.scope, baseRevenue: revenue,
    assumptions: 'Book cash is a sensitivity hypothesis, not verified usable liquidity. Shocks are analytical estimates. No committed new credit is assumed.',
    cases: [[0, x.ebit / (i === 0 ? fy.revenue : priorBq.financials.current.revenue), 0, 0], [.15, .12, .03, .02], [.25, .10, .05, .03]]
      .flatMap(([contraction, margin, workingCapitalRate, rateShock]) => [.25, .50].map(fraction => ({
        depositFraction: fraction,
        ...runFinancialStress({ revenue, contraction, margin, tax: .20, workingCapitalRate, rateShock,
          interest: x.interest * (i === 0 ? 1 : 4 / 3), debt: x.debt,
          capex: i === 0 ? fy.capex : priorBq.financials.current.capex * 4 / 3, principal: x.shortDebt,
          operatingLease: leases[i], openingLiquidity: x.cash + fraction * x.bookDeposits, committedFunding: 0 }),
      }))) };
});
const fh = packet.cases.map(row => scoreIncrementalFinancialHealth({ ...row.assessment, evidence }, row.applicability));
const scores = fh.map(row => row.effectiveScore);
const wp1 = bq.aggregation.effectiveScores;
const all = [...wp1, ...scores];
const scored = aggregateResearchEffectiveScores(wp1[0],
  all.slice(1).flatMap(row => row.points === null ? [] : [{ id: row.id, points: row.points, evidenceReference: config.input.path }]));
const siblingProvisional = all.slice(1).filter(row => row.points !== null && row.validity === 'PROVISIONAL');
const { RUBRICS } = await load('src/domain/scoring/methodology.ts');
const weight = siblingProvisional.reduce((sum, row) => sum + RUBRICS.find(r => r.id === row.id).max, 0);
const coverage = { ...scored.coverage,
  provisional: { count: scored.coverage.provisional.count + siblingProvisional.length, weight: scored.coverage.provisional.weight + weight },
  confirmedCurrent: { count: scored.coverage.confirmedCurrent.count - siblingProvisional.length, weight: scored.coverage.confirmedCurrent.weight - weight } };
const categories = scored.categories.map(row => ({ ...row, includesProvisional: row.includesProvisional ||
  siblingProvisional.some(s => RUBRICS.find(r => r.id === s.id).category === row.id) }));
const aggregation = { ...scored, categories, coverage, effectiveScores: all,
  provisionalInvestmentScore: scored.provisionalInvestmentScore ?? (weight ? scored.confirmedCurrentInvestmentScore : null),
  confirmedCurrentInvestmentScore: weight ? null : scored.confirmedCurrentInvestmentScore,
  outsideRollout: RUBRICS.filter(r => !all.some(row => row.id === r.id)).map(r => r.id),
  genuineNrInScope: all.filter(row => row.points === null).map(row => row.id) };
const researchRanking = rankResearchEffectiveScores([{ ticker: 'FPT', aggregation }]).map(row => ({ ...row, effectiveScores: all }));
const { stage0, hardVeto, residualRisk } = bq.investmentDecisionInput.gates;
const decision = { ...buildResearchDecisionScoreInput(aggregation, { stage0, hardVeto, residualRisk }),
  effectiveScores: all, effectiveFinancialHealth: categories.find(row => row.id === 'FH') };
if (html) {
  process.stdout.write('<!doctype html><html lang="en"><meta charset="utf-8"><title>FPT Financial Health research</title>' +
    '<h1>FPT Business Quality 14/25 PROVISIONAL · Financial Health research</h1>' +
    '<p>Current and provisional coverage shown separately. Full Investment Score incomplete.</p><ul>' +
    all.map(row => `<li>${row.id}: ${row.points ?? 'N/R'} · ${row.validity} · ${row.updateStatus}</li>`).join('') +
    '</ul></html>\n');
} else {
  process.stdout.write(JSON.stringify({
    ticker: 'FPT', cutoff: packet.cutoff, scope: 'REAL_ISSUER_RESEARCH', implementation: FH_RESEARCH,
    methodology: ref(configPath), input: config.input, executable: [engine, incremental, 'tools/scoring/validate_fpt_financial_health.mjs'].map(ref),
    acceptedWp1: config.acceptedWp1.result, financials: { annual, current, liquidity, stress }, fh, aggregation, researchRanking,
    investmentDecisionInput: decision, decisionEligible: false, publicationAuthorized: false,
  }, null, 2) + '\n');
}
