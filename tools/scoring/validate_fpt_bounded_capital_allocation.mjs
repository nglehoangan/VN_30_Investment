import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const policyPath = 'docs/03 SCORING/WP7_CAPITAL_ALLOCATION_AMENDMENT_v1.1.json';
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
const approval = pinned(policy.approval).toString();
const prior = document(accepted.result);
const workflow = document(accepted.workflow);
pinned(accepted.methodology);
pinned(accepted.candidate);
const lifecycle = document(policy.lifecycle);
check(policy.status === 'APPROVED_BASELINE' && owner.includes('only after owner approval of CA25–CA34') &&
  approval.includes('Owner reply, verbatim: có') && lifecycle.decisions.D22 &&
  Object.keys(policy.decisions).length === 10 && !policy.productionScoringAuthorized &&
  !policy.publicationAuthorized && workflow.executionId === accepted.executionId && workflow.queueId === accepted.queueId &&
  prior.ticker === 'FPT' && prior.cutoff === '2026-11-13' && prior.aggregation.assessedPoints === 43 &&
  prior.aggregation.ratedWeight === 95 && prior.aggregation.effectiveScores.length === 23 &&
  same(prior.aggregation,workflow.evidence.find(row=>row.stage==='SCORING').result.aggregation) &&
  same(prior.investmentDecisionInput.gates,{stage0:'UNKNOWN',hardVeto:'PENDING',residualRisk:'NOT_RATED',
    financialHealth:'NOT_ASSESSED',valuation:'NOT_ASSESSED',portfolio:'NOT_ASSESSED'}),'WP711_RESEARCH_AUTHORITY');
const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const engine='src/domain/current-scoring/capital-allocation-bounded.ts';
const existing='src/domain/current-scoring/capital-allocation-research.ts';
const { capitalIds, assessCapitalAllocation, fullCapitalResearchScore } = await load(existing);
const { resolveBoundedCapitalEffective, portfolioLinkage, ownershipBridge,
  reviewParentCash, eventValueAssessment, sequentialTransfer } = await load(engine);
const { aggregateResearchEffectiveScores, rankResearchEffectiveScores,
  buildResearchDecisionScoreInput } = await load('src/domain/current-scoring/research-effective-score.ts');
const { RUBRICS } = await load('src/domain/scoring/methodology.ts');
const applicability=document(policy.applicability);
const portfolio=document(policy.portfolio);
const products={};
const frozen={};
const periods={annual:['2025-12-31','2026-04-08'],h1:['2026-06-30','2026-08-21'],current:['2026-11-13','2026-11-13']};
const capital=Object.fromEntries(Object.entries(periods).map(([period,[date,deadline]])=>{
  const pins=policy.inputs[period];
  const f=document(pins.freeze);
  const retained=document(f.predecessorFreeze);
  check(f.ticker===prior.ticker && f.sector===retained.sector && f.cutoff===date && f.informationCutoff===deadline &&
    f.historicalPit===false && Object.entries(f.sources).every(([id,pin])=>same(pin,retained.sources[id])) &&
    (period==='h1' || (same(f.researchDocuments,retained.researchDocuments) &&
      same(f.researchObservations,retained.researchObservations))), 'WP711_FREEZE_SCOPE');
  const buffers=Object.fromEntries(Object.entries(f.sources).map(([key,pin])=>[key,pinned(pin)]));
  const known=(source,pointer)=>{
    if (!buffers[source]) return false;
    if (pointer.startsWith('/')) return !!pointer.split('/').slice(1).reduce((obj,key)=>obj?.[key],JSON.parse(buffers[source]));
    return [...pointer.matchAll(/L(\d+)/g)].every(([,line])=>!!buffers[source].toString().split('\n')[Number(line)-1]);
  };
  const usable=key=>f.facts.some(row=>row.id===key&&row.publicBy<=deadline&&known(row.source,row.pointer));
  frozen[period]={f,usable};
  const packet={initial:document(pins.initial),initialReview:document(pins.initialReview),
    finalReview:document(pins.finalReview),...(pins.revision?{revision:document(pins.revision)}:{})};
  const rows=assessCapitalAllocation({...f,sha256:pins.freeze.sha256},packet,hash,known);
  const retainedProduct=prior.products[period==='annual'?'annual':'current'];
  const h1=period==='annual'?null:reviewParentCash(f.parentH1);
  const fy=reviewParentCash(period==='h1'?retained.parentFY:f.parentFY);
  check(fy.reconciles && fy.residual===prior.products.annual.parentFY.residual &&
    (!h1 || h1.reconciles && h1.residual===prior.products.current.parentH1.residual &&
      same(f.parentH1,retained.parentH1)), 'WP711_PARENT_CASH_REPLAY');
  if (period==='h1') {
    check(rows.filter(row=>row.points!==null).every(row=>row.id==='CA-DIST'), 'WP711_H1_SCOPE');
    products.h1={pins,parentH1:h1,financialPeriod:date,informationCutoff:deadline};
    return [period,rows];
  }
  const notes=JSON.parse(buffers.notes).documents;
  const employeeExpense=30929275947813;
  check(notes[3].pages[58].text.includes('30.929.275.947.813'),'WP711_EMPLOYEE_COST');
  const shareBridge=period==='annual'?null:ownershipBridge(
    retainedProduct.wp5CommonMultiple.annual.comparisonAt10x / 10,
    retainedProduct.wp5CommonMultiple.current.comparisonAt10x / 10,
    retainedProduct.currentProgram.beginning,f.currentProgram.issued,f.capitalization2026,f.conditionalShares);
  const portfolioSupported=portfolioLinkage(portfolio,usable);
  const issuance=[...retainedProduct.issuance,...(retainedProduct.currentProgram?[retainedProduct.currentProgram]:[])].map(event=>{
    const assessed=eventValueAssessment({before:event.beginning,issued:event.newShares,
      valueRange:event.modeledValueRange??[],eventDate:event.eventDate??null,valueKnownBy:event.year===2026?'2026-03-19':null,
      comparabilityVerified:false,grossProceeds:event.grossProceeds,netProceeds:event.netProceeds,
      benefitsBounded:false,materialityReason:'Retention may matter. No incremental attributable offset bound or same basis event value.'});
    return {year:event.year,before:event.beginning,issued:event.issued,newShares:event.newShares,
      treasury:event.treasury??0,registrationDate:event.registeredCapitalDate??null,issuePrice:event.issuePrice??null,
      grossProceeds:event.grossProceeds,netProceeds:event.netProceeds,benefitStatus:'UNKNOWN',
      valueRange:event.modeledValueRange??[],estimateStatus:'PERIOD_ONLY_NOT_EVENT_QUALIFIED',
      ...assessed,breakEvenVsFY25EmployeeCost:event.year===2025?
        assessed.sensitivities.map(s=>s.breakEvenBenefit/employeeExpense):null};
  });
  const reinvest=rows.find(row=>row.id==='CA-REINV');
  const dilution=rows.find(row=>row.id==='CA-DIL');
  check(portfolioSupported || reinvest.points===null,'WP711_PORTFOLIO_LINKAGE');
  check(issuance.every(row=>row.economicConclusionEligible) || dilution.points===null,'WP711_DILUTION_ECONOMICS');
  const grossEvents=issuance.filter(row=>row.proceedsBasis==='GROSS_SENSITIVITY' && row.sensitivities.length);
  products[period]={...retainedProduct,pins,parentCalculation:{fy,h1},portfolio,portfolioSupported,
    allocationContext:period==='current'?{q3SinceH1GroupFcf:1405325970306,limitation:'Sequential group improvement cannot identify a project return.'}:null,
    shareBridge, employeeExpense, eventEconomics:issuance,
    sequentialGrossSensitivity:grossEvents.length?{
      years:grossEvents.map(row=>row.year),
      losses:[0,1].map(endpoint=>sequentialTransfer(grossEvents.map(row=>
        (endpoint ? row.sensitivities.at(-1) : row.sensitivities[0]).economicLoss))),
      limitations:'Compounds only the gross-proceeds screened years. No credited benefits or verified event values.'
    }:null};
  return [period,rows];
}));
const effectiveCapital=capital.current.map((row,i)=>{
  const fy=capital.annual[i];
  const latest=row.id==='CA-DIST'?capital.h1[i]:fy;
  return resolveBoundedCapitalEffective(row,fy,latest,applicability[row.id],frozen.current.usable);
});
const effectiveScores=[...prior.aggregation.effectiveScores.slice(0,19),...effectiveCapital];
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
const routeQualifications = [...prior.aggregation.routeQualifications.filter(row=>!capitalIds.includes(row.id)), ...effectiveCapital.map(row =>
  ({ id: row.id, ...row.routeQualification }))];
const comparability = prior.aggregation.comparability;
const completeResearchScore = fullCapitalResearchScore(effectiveScores);
const aggregation = { ...aggregate, completeResearchScore,
  confirmedCurrentInvestmentScore: provisional.length ? null : completeResearchScore,
  provisionalInvestmentScore: provisional.length ? completeResearchScore : null, categories, effectiveScores, routeQualifications, comparability, coverage,
  pointsByValidity: { confirmedCurrent: confirmed.reduce((v, x) => v + x.points, 0),
    provisional: provisional.reduce((v, x) => v + x.points, 0) },
  genuineNrInScope: genuine.map(row => row.id), outsideRollout: outside.map(row => row.id) };
const researchRanking = rankResearchEffectiveScores([{ ticker: prior.ticker, aggregation }])
  .map(row => ({ ...row, effectiveScores, coverage, routeQualifications, comparability }));
const gates = prior.investmentDecisionInput.gates;
const investmentDecisionInput = { ...buildResearchDecisionScoreInput(aggregation, gates), gates,
  effectiveScores, routeQualifications, comparability,
  ...Object.fromEntries([['FinancialHealth', 'FH'], ['GrowthQuality', 'GQ'], ['Industry', 'IC'], ['Valuation', 'VAL'], ['RiskGovernance', 'RG'], ['CapitalAllocation', 'CA']]
    .map(([key, id]) => ['effective' + key, categories.find(row => row.id === id)])) };
const scorecard=prior.scorecard.map(row=>{
  const effective=effectiveCapital.find(x=>x.id===row.id);
  if (!effective) return row;
  return {...row,points:effective.points,validity:effective.validity,route:effective.routeQualification.route,
    confidence:effective.confidence,underlyingPeriod:effective.underlyingAssessmentCutoff,
    currentAssessmentPoints:effective.currentReassessmentPoints,latestEligiblePoints:effective.latestEligiblePoints,
    provisionalOrigin:effective.inheritance?effective.underlyingAssessmentCutoff:null,
    limitations:effective.applicabilityReview.rationale,nrReason:effective.points===null?row.nrReason:null};
});
process.stdout.write(JSON.stringify({ticker:prior.ticker,cutoff:prior.cutoff,scope:'REAL_ISSUER_RESEARCH',
  methodology:ref(policyPath),implementation:'bounded-capital-allocation-research-v1.1.0',prior:accepted.result,
  executables:[engine,existing,'tools/scoring/validate_fpt_bounded_capital_allocation.mjs'].map(ref),
  capital,products,scorecard,aggregation,researchRanking,investmentDecisionInput,
  researchResidualRisk:prior.researchResidualRisk,formalResidualRisk:gates.residualRisk,
  decisionEligible:false,publicationAuthorized:false},null,2)+'\n');
