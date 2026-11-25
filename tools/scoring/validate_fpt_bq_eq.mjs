import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const packetPath = 'docs/fundamental-data-engine/fpt-bq-eq/2026-11-25/FPT_BQ_EQ_INPUT.json';
const configPath = 'docs/03 SCORING/BQ_EQ_EVIDENCE_SUFFICIENCY_v1.0.json';
const implementationPath = 'src/domain/current-scoring/bq-eq-research.ts';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFileSync(resolve(root, path));
function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}
requireCondition(JSON.stringify(process.argv.slice(2)) === '["--ticker","FPT"]', 'FPT_RESEARCH_ONLY');
const inputBytes = read(packetPath);
const packet = JSON.parse(inputBytes);
const configBytes = read(configPath);
const config = JSON.parse(configBytes);
requireCondition(packet.ticker === 'FPT' && packet.sector === 'TECHNOLOGY' &&
  packet.scope === 'REAL_ISSUER_RESEARCH' && config.status === 'APPROVED_BASELINE' &&
  config.realIssuerValidation.includes(packet.ticker) &&
  sha(read(config.approvalReference)) === config.approvalSha256 &&
  !config.productionScoringAuthorized && !config.publicationAuthorized, 'RESEARCH_AUTHORITY_REQUIRED');
requireCondition(JSON.stringify(packet.stages.map(({id, cutoff}) => [id, cutoff])) ===
  '[["FY2025","2026-03-19"],["2026-11-13","2026-11-13"]]', 'FPT_REVIEW_WINDOWS_REQUIRED');

const context = JSON.parse(execFileSync('python3', [
  '-B', 'skills/vn30-rollout-orchestrator/scripts/runtime.py', 'prepare',
  '--skill', 'equity-s1-s5-assessment', '--ticker', 'FPT', '--reference-date', '2026-11-13',
  '--purpose', 'RETROSPECTIVE_RESEARCH', '--universe-version', 'vn30-20260803-reviewed-20261115',
  '--sector', 'TECHNOLOGY',
], { cwd: root, encoding: 'utf8' }));
requireCondition(context.executionId === packet.executionId &&
  context.request.ticker === packet.ticker && context.request.sector === packet.sector &&
  !context.permissions.scoringAuthorized && !context.permissions.publicationAuthorized, 'INVALID_RESEARCH_CONTEXT');

const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const { BQ_EQ_RESEARCH, scoreEconomicQuality } = await jiti.import(resolve(root, implementationPath));
requireCondition(config.implementationIdentity === BQ_EQ_RESEARCH, 'UNSUPPORTED_IMPLEMENTATION');

const documents = new Map();
for (const [id, pin] of Object.entries(packet.evidence)) {
  const path = realpathSync(resolve(root, pin.path));
  requireCondition(path.startsWith(root + sep), 'EVIDENCE_OUTSIDE_REPOSITORY');
  const bytes = readFileSync(path);
  requireCondition(sha(bytes) === pin.sha256, `EVIDENCE_HASH_MISMATCH ${id}`);
  documents.set(id, pin.path.endsWith('.json') ? JSON.parse(bytes) : bytes.toString());
}
function usable(ref, cutoff) {
  const pin = packet.evidence[ref];
  return !!pin && documents.has(ref) && pin.periodEnd <= pin.publicBy && pin.publicBy <= cutoff;
}
const proof = documents.get('FYProof');
requireCondition(proof.ticker === packet.ticker && proof.publicationDate === packet.stages[0].cutoff,
  'FY_PUBLICATION_PROOF_MISMATCH');
function annualCell(year, cell) {
  const pin = packet.evidence[cell.source];
  requireCondition(usable(cell.source, packet.stages[0].cutoff) && pin.periodEnd === `${year}-12-31` &&
    pin.scope === 'FULL_FTEL_CONSOLIDATION' && /^\d+$/.test(cell.value), 'INVALID_ANNUAL_CELL');
  const doc = documents.get(cell.source);
  const parts = cell.pointer.slice(1).split('/');
  const at = path => path.reduce((node, key) => node[key], doc);
  const parent = at(parts.slice(0, -1));
  if (parts[0] === 'reports') {
    const variant = at(parts.slice(0, 6));
    const group = at(parts.slice(0, 8));
    requireCondition(doc.ticker === 'FPT' && parts[3] === year && variant.reportingScope === 'CONSOLIDATED' &&
      variant.source.payloadHash === cell.sourceHash && parent.status === 'VALUE' &&
      group.unitEvidence.currency === "VND" && group.unitEvidence.scale === "1" &&
      parent.cellEvidence?.page === cell.page, 'INVALID_STATEMENT_CELL');
  } else {
    requireCondition(parent.ticker === 'FPT' && parent.scope === 'CONSOLIDATED' && parent.currency === 'VND' &&
      parent.fiscalYear === Number(year) && parent.qualified && parent.sourceHash === cell.sourceHash, 'INVALID_CANONICAL_CELL');
  }
  requireCondition(at(parts) === cell.value, 'CELL_VALUE_MISMATCH');
  return Number(cell.value);
}
function currentOperand(key) {
  const value = packet.current[key];
  const bridge = documents.get('FTEL');
  requireCondition(/^-?\d+$/.test(value) &&
    bridge.replaceAll('.', '').includes(value.replace(/^-/, '')), `UNBOUND_BRIDGE_OPERAND ${key}`);
  return Number(value);
}
const tax = 0.20; // Research tax stress. Published group effective rates do not establish operating tax.
const mean = (a, b) => (a + b) / 2;
const annual = Object.entries(packet.annualCells).map(([year, cells]) => {
  const source = Object.fromEntries(Object.entries(cells).map(([key, cell]) => [key, annualCell(year, cell)]));
  const debt = source.shortDebt + source.longDebt;
  const commonEquityProxy = source.equity - source.minority;
  const capital = [0, 0.5, 1].map(fraction => source.equity + debt - fraction * source.shortDeposits);
  return { year, ...source, debt, debtToEquity: debt / source.equity, commonEquityProxy, capital };
});
const financials = annual.slice(1).map((row, i) => {
  const ebit = row.grossProfit - row.sellingExpense - row.adminExpense;
  const nopat = ebit * (1 - tax);
  const averageCapital = row.capital.map((cap, j) => mean(annual[i].capital[j], cap));
  return {
    ...row, ebit, ebitMargin: ebit / row.revenue, tax, nopat, averageCapital,
    roic: averageCapital.map(cap => nopat / cap),
    reportedRoe: row.parentIncome / mean(annual[i].commonEquityProxy, row.commonEquityProxy),
  };
});
const q3 = documents.get('Q3');
const q3Value = concept => {
  const matches = q3.cells.filter(cell => cell.concept === concept);
  requireCondition(matches.length === 1, 'Q3_CELL_NOT_UNIQUE');
  const [cell] = matches;
  requireCondition(cell.ticker === 'FPT' && cell.scope === 'CONSOLIDATED' && cell.unit === 'VND' &&
    cell.period.end === packet.current.periodEnd && cell.pdfSha256 === q3.sourceReceipt.sha256 &&
    /^\d+$/.test(cell.value), 'INVALID_Q3_CELL');
  return Number(cell.value);
};
const ebit = currentOperand('ebit');
const revenue = q3Value('REVENUE');
const q3SelectedCapital = currentOperand('q3SelectedCapital');
const selectedAverageCapital6M = mean(currentOperand('q1SelectedCapital'), q3SelectedCapital);
const ebit6M = ebit - currentOperand('q1Ebit');
const reportedTax = (currentOperand('q3TaxCurrent') + currentOperand('q3TaxDeferred')) / currentOperand('q3Pretax');
const updates = ['Q1', 'Q2', 'H1', 'Q3', 'Subsequent'].map(ref => {
  const { publicBy, periodEnd, scope } = packet.evidence[ref];
  requireCondition(usable(ref, packet.stages[1].cutoff) && scope === 'FTEL_EQUITY_METHOD',
    `INELIGIBLE_CURRENT_UPDATE ${ref}`);
  return { ref, publicBy, periodEnd };
});
requireCondition(updates.every((item, i) => !i || item.publicBy > updates[i - 1].publicBy),
  'CURRENT_UPDATES_OUT_OF_ORDER');
const current = {
  periodEnd: packet.current.periodEnd, revenue, ebit, ebitMargin: ebit / revenue,
  tax, nopatStress: ebit * (1 - tax), reportedTax,
  reportedParentIncome: q3Value('NET_INCOME_ATTRIBUTABLE_PARENT'),
  cashRealization: q3Value('CFO') - q3Value('ASSET_PURCHASE_CASH_OUTFLOW'),
  debt: q3Value('SHORT_TERM_FINANCIAL_BORROWINGS') + q3Value('LONG_TERM_FINANCIAL_BORROWINGS'),
  q3SelectedCapital, selectedAverageCapital6M, ebit6M,
  selected6MReturn: [tax, reportedTax].map(rate => ebit6M * (1 - rate) / selectedAverageCapital6M),
  comparable9MCapital: null, comparable9MRoic: null,
};
const results = packet.stages.map(({id, cutoff, assessment}) => {
  const result = scoreEconomicQuality(assessment, packet.sector, ref => usable(ref, cutoff));
  return { id, cutoff, analystSelected: assessment.proposed, executable: result };
});
process.stdout.write(JSON.stringify({
  implementation: BQ_EQ_RESEARCH,
  executableSha256: sha(read(implementationPath)),
  adapterSha256: sha(read('tools/scoring/validate_fpt_bq_eq.mjs')),
  bandRegistrySha256: sha(read('src/domain/scoring/methodology.ts')),
  methodology: { path: configPath, sha256: sha(configBytes) },
  input: { path: packetPath, sha256: sha(inputBytes) },
  ticker: packet.ticker, executionId: packet.executionId, scope: packet.scope,
  stage0: 'UNKNOWN', hardVeto: 'PENDING', residualRisk: 'NOT_RATED', decisionEligible: false,
  financials, current, updates, results,
}, null, 2) + '\n');
