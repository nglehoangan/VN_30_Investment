import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const folder = 'docs/fundamental-data-engine/fpt-capital-allocation/ca-dil-discipline-pilot-v1.0';
const read = path => readFileSync(resolve(root, path));
const input = JSON.parse(read(folder + '/INPUT_PINS.json'));
function requireFact(ok, reason) { if (!ok) throw Error(reason); }
function pinned(pin) {
  const path = realpathSync(resolve(root, pin.path));
  requireFact(path.startsWith(root + sep), 'PILOT_PIN_ESCAPE');
  const bytes = readFileSync(path);
  requireFact(createHash('sha256').update(bytes).digest('hex') === pin.sha256, 'PILOT_PIN_MISMATCH: ' + pin.path);
  return bytes;
}
const document = pin => JSON.parse(pinned(pin));
requireFact(JSON.stringify(process.argv.slice(2)) === '["--ticker","FPT"]', 'FPT_RESEARCH_ONLY');
const policy = document(input.methodology);
const context = document(input.prepare);
requireFact(policy.status === 'PROPOSED_RESEARCH_ONLY_PENDING_FINAL_ACCEPTANCE' &&
  !policy.formalScoringAuthorized && !policy.publicationAuthorized && policy.ticker === 'FPT' && policy.rubric === 'CA-DIL' &&
  context.request.ticker === 'FPT' && context.request.referenceDate === '2026-11-13' &&
  context.request.purpose === 'RETROSPECTIVE_RESEARCH' && Object.values(context.permissions).every(value => value === false),
'PILOT_AUTHORITY');
pinned(policy.approval);
input.references.forEach(pinned);
const predecessor = document(input.predecessor.result);
const workflow = document(input.predecessor.workflow);
requireFact(predecessor.ticker === context.request.ticker && predecessor.cutoff === context.request.referenceDate &&
  workflow.executionId === input.predecessor.executionId && workflow.queueId === input.predecessor.queueId &&
  workflow.status === 'COMPLETED' &&
  predecessor.aggregation.assessedPoints === 45 && predecessor.aggregation.ratedWeight === 97 &&
  predecessor.aggregation.formalScore === null, 'PILOT_PREDECESSOR');
const hist = document(input.historical).products.annual;
const retained = Object.fromEntries(Object.entries(input.retained).map(([name, pin]) => [name, document(pin)]));
Object.values(retained.SOURCE_INVENTORY).forEach(pinned);
const review = document(input.review);
requireFact(review.revisionCount === 0, 'PILOT_REVIEW_LINEAGE');
const proposals = document(review.proposal);

const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const { DISCIPLINE_PILOT, validateDisciplinePilot, resolveDisciplinePilot, summarizeDisciplineCandidate } =
  await jiti.import(resolve(root, 'src/domain/current-scoring/ca-dil-discipline-pilot.ts'));
const { compoundRatios } = await jiti.import(resolve(root, 'src/domain/current-scoring/capital-allocation-research.ts'));
const { issueSensitivity, managementAllocation } =
  await jiti.import(resolve(root, 'src/domain/current-scoring/capital-allocation-targeted-evidence.ts'));
requireFact(policy.id === DISCIPLINE_PILOT, 'PILOT_METHODOLOGY_ID');
const outcome = {
  adjustedEps: compoundRatios(hist.pairs.map(([value, comparison]) => value / comparison)),
  parentNpat: compoundRatios(hist.group.slice(1).map((row, i) => row.parentNpat / hist.group[i].parentNpat)),
  group: hist.group,
};
const periods = Object.fromEntries(['annual', 'current'].map(period => {
  const annual = period === 'annual';
  const freeze = retained[annual ? 'UPDATED_FREEZE_ANNUAL' : 'UPDATED_FREEZE_CURRENT'];
  requireFact(freeze.informationCutoff === (annual ? '2026-04-08' : '2026-11-13'), 'PILOT_INFORMATION_WINDOW');
  pinned(freeze.retained);
  pinned(freeze.newObservations);
  const eligible = Object.entries(retained.SOURCE_INVENTORY)
    .filter(([, source]) => source.availableBy <= freeze.informationCutoff).map(([id]) => id);
  requireFact(JSON.stringify(eligible) === JSON.stringify(freeze.evidenceIds), 'PILOT_FREEZE_ELIGIBILITY');
  const product = predecessor.products[period];
  const programmeHistory = product.retainedIssueHistory.map(row => ({
    ...row, scaleOnOpeningShares: row.issued / row.beginning, actualOwnershipDilution: null,
  }));
  const cumulativeProgrammeScreen = (extraFactors, key) =>
    1 - [...programmeHistory.map(row => row[key]), ...extraFactors].reduce((factor, value) => factor * value, 1);
  const canonical = predecessor.capital[period].find(row => row.id === 'CA-DIL');
  requireFact(canonical?.points === null && (annual ? product.esop === null : Boolean(product.esop)), 'PILOT_CANONICAL_CONTROL');
  const assessment = validateDisciplinePilot(proposals[period], review.periods[period], new Set(['HIST', ...eligible]));
  requireFact(assessment.gaps.length === 0, 'PILOT_VALIDATION: ' + assessment.gaps.join(','));
  const currentIssue = annual ? null : product.esop;
  const verification = currentIssue && (() => {
    const { before, after, employee, managers, actualGrossLine31, issuePrice, kpi } = currentIssue.issue;
    const issued = employee.shares + managers.shares;
    requireFact(before + issued === after && issued * issuePrice === actualGrossLine31 &&
      currentIssue.incrementalBenefit === null && currentIssue.netProceeds === null, 'PILOT_ESOP_RECONCILIATION');
    const sensitivity = issueSensitivity(before, issued, currentIssue.quote, actualGrossLine31, 0, 0);
    requireFact(JSON.stringify(sensitivity) === JSON.stringify(currentIssue.completion), 'PILOT_SENSITIVITY_DRIFT');
    const allocation = managementAllocation(kpi.growth, kpi.tsr, before);
    return { ...currentIssue, discountToCompletionClose: 1 - issuePrice / currentIssue.quote,
      issueScaleOnActualPreIssueShares: issued / before, reconciledKpi: allocation,
      proRataSharesExcluded: 171401226, treasurySharesIssued: 0 };
  })();
  const factors = verification ? [1 - verification.completion.ownershipDilution] : [];
  return [period, { freeze: freeze.informationCutoff, eligible, assessment, canonical, programmeHistory, currentIssue: verification,
    historicalProgrammeScreen: cumulativeProgrammeScreen(factors, 'mechanicalProgrammeFactor'),
    historicalNewShareScreen: cumulativeProgrammeScreen(factors, 'newSharesOnlyFactor'),
    humanCapital: product.humanCapital, outcome, financialScope: product.financialContext.group9M }];
}));
const effective = resolveDisciplinePilot(periods.current.canonical, periods.annual.canonical,
  periods.current.assessment, periods.annual.assessment);
const cumulative = summarizeDisciplineCandidate(predecessor.scorecard, effective);
requireFact(cumulative.scorecard.filter(row => row.id !== 'CA-DIL')
  .every(row => predecessor.scorecard.includes(row)), 'PILOT_UNAFFECTED_SCORECARD');
console.log(JSON.stringify({ methodology: DISCIPLINE_PILOT, scope: 'RESEARCH_PILOT_ONLY', ticker: 'FPT',
  cutoff: context.request.referenceDate, executionId: context.executionId, predecessor: input.predecessor,
  permissions: context.permissions, formalGates: predecessor.investmentDecisionInput.gates,
  rankingAuthorized: false, investmentActionable: false, periods, effective, cumulative }, null, 2));
