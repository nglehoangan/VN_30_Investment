import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const configPath = 'docs/03 SCORING/BUSINESS_QUALITY_CASH_RES_AMENDMENTS_v1.0.json';
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
function amount(raw) {
  requireCondition(typeof raw === 'string' && /^-?\d+$/.test(raw) && Number.isSafeInteger(Number(raw)), 'INVALID_VND_AMOUNT');
  return Number(raw);
}
const args = JSON.stringify(process.argv.slice(2));
const html = args === '["--ticker","FPT","--html"]';
requireCondition(html || args === '["--ticker","FPT"]', 'FPT_RESEARCH_ONLY');
const config = JSON.parse(read(configPath));
readPin(config.approval);
readPin(config.bqMoatFinalAcceptance.methodology);
const packet = JSON.parse(readPin(config.input));
requireCondition(config.status === 'APPROVED_BASELINE' && config.replayScope.includes('FPT') &&
  config.bqMoatFinalAcceptance.status === 'ACCEPTED_AND_CLOSED' &&
  !config.productionScoringAuthorized && !config.publicationAuthorized &&
  packet.ticker === 'FPT' && packet.scope === 'REAL_ISSUER_RESEARCH', 'RESEARCH_AUTHORITY_REQUIRED');

const evidence = Object.fromEntries(Object.entries(packet.sourceBindings).map(([id, binding]) => {
  const lines = readPin(binding).toString('utf8').split('\n');
  const [start, end] = binding.locator.lines;
  requireCondition(start > 0 && end <= lines.length && start <= end &&
    lines.slice(start - 1, end).some(line => line.includes(binding.locator.contains)), 'SOURCE_LOCATOR_MISMATCH');
  return [id, { publicBy: binding.publicBy, periodEnd: binding.periodEnd, kind: binding.kind }];
}));
const acceptedMoat = execFileSync(process.execPath, ['tools/scoring/validate_fpt_bq_moat.mjs', '--ticker', 'FPT'], { cwd: root });
requireCondition(acceptedMoat.equals(readPin(config.bqMoatFinalAcceptance.acceptedResult)), 'CLOSED_BQ_MOAT_REPLAY_MISMATCH');
const accepted = JSON.parse(acceptedMoat);
for (const [section, rubric] of [[packet.cash, 'BQ-CASH'], [packet.resilience, 'BQ-RES']]) {
  requireCondition(section.sector === 'TECHNOLOGY' && section.review.cutoff === accepted.bqMoat.current.review.cutoff &&
    section.review.reviewedAt === config.recordedDate &&
    [section.baseline, section.reassessment].every(row => row.methodology === config.scopedAmendments[rubric].methodologyId &&
      row.implementation === config.implementationIdentity), 'BQ_WINDOW_OR_METHOD_MISMATCH');
}
const display = JSON.parse(readPin(packet.financialSources.auditedDisplay));
const canonical = JSON.parse(readPin(packet.financialSources.canonical)).canonicalFacts;
requireCondition(display.ticker === packet.ticker &&
  packet.annual.map(row => row.year).join(',') === '2022,2023,2024,2025', 'INVALID_ANNUAL_FOUNDATION');
function annualCell(year, cell) {
  if (cell.canonicalIndex !== undefined) {
    const row = canonical[cell.canonicalIndex];
    requireCondition(row.ticker === packet.ticker && row.fiscalYear === year && row.scope === 'CONSOLIDATED' &&
      row.itemId === cell.concept && row.qualified && row.currency === 'VND' && row.reportPeriodType === 'ANNUAL' &&
      row.period.end === `${year}-12-31` && row.value === cell.value && row.sourceHash === cell.sourceHash,
    'INVALID_CANONICAL_ANNUAL_CELL');
  } else {
    const variant = display.reports[cell.report].periods[year].variants[cell.variant];
    const group = variant.groups[cell.group];
    const row = group.rows[cell.row];
    requireCondition(variant.id.startsWith(`FPT_Baocaotaichinh_${year}_Kiemtoan_Hopnhat.pdf`) &&
      variant.reportingScope === 'CONSOLIDATED' && group.unitEvidence.currency === 'VND' && group.unitEvidence.scale === '1' &&
      group.sourcePage === cell.physicalPage && row.label === cell.caption && row.value === cell.value &&
      variant.source.payloadHash === cell.sourceHash && row.status === 'VALUE', 'INVALID_ANNUAL_DISPLAY_CELL');
  }
  return amount(cell.value);
}
const annual = packet.annual.map(({ year, cells }) => {
  const values = Object.fromEntries(Object.entries(cells).map(([key, cell]) => [key, annualCell(year, cell)]));
  return { year, scope: 'FULL_FTEL_CONSOLIDATION', ...values,
    fcf: values.cfo - values.capex,
    normalizedNpat: null,
    fxOnlyNpatSensitivity: values.reportedNpat + Math.round(values.fxRemeasurementAdjustment * .8),
  };
});
const sourceQ3 = JSON.parse(readPin(packet.financialSources.q3Reviewed));
readPin(packet.financialSources.q3Pdf);
requireCondition(sourceQ3.sourceReceipt.sha256 === packet.financialSources.q3Pdf.sha256 &&
  sourceQ3.sourceReceipt.ticker === packet.ticker, 'Q3_SOURCE_IDENTITY_MISMATCH');
const currentReviewed = Object.fromEntries(Object.entries(packet.current.visuallyReviewedCells).map(([key, cell]) => {
  requireCondition([3, 5, 7, 10].includes(cell.page) && /^\d{2,3}b?$/.test(cell.code), 'INVALID_Q3_CELL_LOCATOR');
  return [key, amount(cell.value)];
}));
function q3Cell(concept, expectedStart) {
  const cells = sourceQ3.cells.filter(cell => cell.concept === concept);
  requireCondition(cells.length === 1 && cells[0].ticker === packet.ticker && cells[0].scope === 'CONSOLIDATED' &&
    cells[0].period.start === expectedStart && cells[0].period.end === '2026-09-30' &&
    cells[0].unit === 'VND' && cells[0].pdfSha256 === packet.financialSources.q3Pdf.sha256, 'INVALID_Q3_REVIEWED_CELL');
  return amount(cells[0].value);
}
const bridge = readPin(packet.financialSources.q3Bridge).toString('utf8').replaceAll('.', '');
requireCondition(Object.values(packet.current.tax).every(value => bridge.includes(value.replace('-', ''))),
  'UNBOUND_Q3_TAX_OPERAND');
const reviewedCash = readPin(packet.sourceBindings.cashFY).toString('utf8').replaceAll('.', '');
requireCondition(Object.values(packet.current.retainedAprilToSeptember).every(value => reviewedCash.includes(value)),
  'UNBOUND_INTERIM_CASH_OPERAND');
const { pretax, current: currentTax, deferred } = packet.current.tax;
requireCondition(currentReviewed.reportedNpat === amount(pretax) - amount(currentTax) - amount(deferred), 'Q3_NPAT_DOES_NOT_RECONCILE');
const cfo = q3Cell('CFO', '2026-01-01');
const capex = q3Cell('ASSET_PURCHASE_CASH_OUTFLOW', '2026-01-01');
const current = {
  scope: 'FTEL_EQUITY_METHOD', period: '2026-09-30', ...currentReviewed, cfo, capex,
  revenue: q3Cell('REVENUE', '2026-01-01'), receivables: q3Cell('RECEIVABLES', '2026-09-30'),
  normalizedNpat: null, fcf: cfo - capex, reportedConversion: cfo / currentReviewed.reportedNpat,
  aprilToSeptemberFcf: amount(packet.current.retainedAprilToSeptember.cfo) - amount(packet.current.retainedAprilToSeptember.capex),
};
const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const scoring = 'src/domain/current-scoring/bq-cash-res-research.ts';
const lifecycle = 'src/domain/current-scoring/bq-cash-res-incremental.ts';
const aggregationPath = 'src/domain/current-scoring/research-full-business-quality.ts';
const { BQ_CASH_RES_RESEARCH, cumulativeCashConversion } = await load(scoring);
const { scoreIncrementalCashRealization, scoreIncrementalBusinessResilience } = await load(lifecycle);
const { aggregateFullResearchBusinessQuality, rankFullResearchBusinessQuality,
  buildFullResearchBusinessQualityDecisionInput } = await load(aggregationPath);
requireCondition(BQ_CASH_RES_RESEARCH === config.implementationIdentity, 'UNSUPPORTED_IMPLEMENTATION');
const convert = (rows, denominator) => cumulativeCashConversion(rows.map(row => ({
  period: String(row.year), cashScope: row.scope, earningsScope: row.scope,
  cfo: row.cfo, capex: row.capex, earnings: row[denominator], meaningfulEarnings: true,
})));
const conversion = {
  reported4Y: convert(annual, 'reportedNpat'),
  fxOnlySensitivity4Y: convert(annual, 'fxOnlyNpatSensitivity'),
  reported3Y: convert(annual.slice(1), 'reportedNpat'),
  fxOnlySensitivity3Y: convert(annual.slice(1), 'fxOnlyNpatSensitivity'),
  normalized4Y: convert(annual, 'normalizedNpat'),
};
requireCondition(conversion.reported4Y && conversion.fxOnlySensitivity4Y, 'CASH_BASELINE_CALCULATION_REQUIRED');
const cash = scoreIncrementalCashRealization({ ...packet.cash, evidence });
const resilience = scoreIncrementalBusinessResilience({ ...packet.resilience, evidence });
const aggregation = aggregateFullResearchBusinessQuality(accepted.aggregation.rubric,
  [accepted.bqMoat.effectiveScore, cash.effectiveScore, resilience.effectiveScore], config.input.path);
const researchRanking = rankFullResearchBusinessQuality([{ ticker: packet.ticker, aggregation }]);
const { stage0, hardVeto, residualRisk } = accepted.investmentDecisionInput.gates;
const investmentDecisionInput = buildFullResearchBusinessQualityDecisionInput(aggregation, { stage0, hardVeto, residualRisk });
if (html) {
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { FullBusinessQualityResearchView } = await load('src/ui/research-full-business-quality.tsx');
  process.stdout.write('<!doctype html><html lang="en"><meta charset="utf-8"><title>FPT Business Quality</title><body>' +
    renderToStaticMarkup(createElement(FullBusinessQualityResearchView, { ticker: packet.ticker, score: aggregation })) + '</body></html>\n');
} else {
  process.stdout.write(JSON.stringify({
    implementation: BQ_CASH_RES_RESEARCH,
    executables: [scoring, lifecycle, aggregationPath, 'tools/scoring/validate_fpt_business_quality.mjs'].map(ref),
    methodology: ref(configPath), input: config.input, acceptedMoat: config.bqMoatFinalAcceptance.acceptedResult,
    acceptedEconomicQuality: accepted.acceptedBqEq,
    ticker: packet.ticker, scope: packet.scope, executionId: accepted.executionId,
    financials: { unit: 'VND', annual, conversion, current },
    analystSelected: { cash: [packet.cash.baseline.assessment.proposed, packet.cash.reassessment.assessment.proposed],
      resilience: [packet.resilience.baseline.assessment.proposed, packet.resilience.reassessment.assessment.proposed] },
    cash, resilience, aggregation, researchRanking, investmentDecisionInput, decisionEligible: false, publicationAuthorized: false,
  }, null, 2) + '\n');
}
