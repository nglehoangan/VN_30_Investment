import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const policyPath = 'docs/03 SCORING/WP7_CAPITAL_ALLOCATION_AMENDMENT_v1.0.json';
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
check(policy.status === 'APPROVED_BASELINE' && owner.includes('owner approves WP6 Risk & Governance v1.0 Final Research Acceptance') &&
  accepted.status === 'OWNER_ACCEPTED_RESEARCH_ONLY' && !accepted.formalAuthority &&
  !policy.productionScoringAuthorized && !policy.publicationAuthorized &&
  same(accepted.owner, policy.owner) && prior.ticker === 'FPT' && prior.cutoff === '2026-11-13' &&
  accepted.executionId === workflow.executionId && accepted.queueId === workflow.queueId &&
  same(prior.aggregation.effectiveScores, workflow.evidence.find(row => row.stage === 'SCORING').result.aggregation.effectiveScores) &&
  prior.aggregation.effectiveScores.length === 19 && prior.aggregation.assessedPoints === 43 &&
  prior.aggregation.ratedWeight === 95, 'WP6_ACCEPTED_BASELINE_REQUIRED');
check(same(prior.investmentDecisionInput.gates, {
  stage0: 'UNKNOWN', hardVeto: 'PENDING', residualRisk: 'NOT_RATED',
  financialHealth: 'NOT_ASSESSED', valuation: 'NOT_ASSESSED', portfolio: 'NOT_ASSESSED',
}), 'FORMAL_RISK_AUTHORITY_UNCHANGED_REQUIRED');
const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const engine = 'src/domain/current-scoring/capital-allocation-research.ts';
const { economicTransfer, compoundRatios, parentCashBridge, assessCapitalAllocation, resolveCapitalEffective, fullCapitalResearchScore } = await load(engine);
const { aggregateResearchEffectiveScores, rankResearchEffectiveScores,
  buildResearchDecisionScoreInput } = await load('src/domain/current-scoring/research-effective-score.ts');
const { RUBRICS } = await load('src/domain/scoring/methodology.ts');
const products = {};
const capital = Object.fromEntries(['annual','current'].map(period=>{
  const pins=policy.inputs[period];
  const f=document(pins.freeze);
  const annual=period==='annual';
  check(f.ticker===prior.ticker && f.period===period && f.cutoff===(annual?'2025-12-31':prior.cutoff) &&
    f.informationCutoff===(annual?'2026-04-08':prior.cutoff) && !f.historicalPit, 'CA_FREEZE_REQUIRED');
  const source=Object.fromEntries(Object.entries(f.sources).map(([key,pin])=>[key,pinned(pin)]));
  const known=(key,pointer)=>{
    if (!source[key]) return false;
    if (pointer.startsWith('/')) return !!pointer.split('/').slice(1).reduce((obj,k)=>obj?.[k],JSON.parse(source[key]));
    return [...pointer.matchAll(/L(\d+)/g)].every(([,line])=>!!source[key].toString().split('\n')[Number(line)-1]);
  };
  const research=document(f.researchManifest);
  const reports=Object.fromEntries(Object.entries(research.reports).filter(([,r])=>r.publicBy<=f.informationCutoff));
  check(same(reports,f.researchDocuments) && same(f.researchObservations,Object.fromEntries(
    Object.entries(research.observations).filter(([,o])=>reports[o.documentId] && o.publicBy<=f.informationCutoff))),
    'CA_EXTERNAL_WINDOW');
  for (const doc of Object.values(reports)) pinned(doc);
  const facts=JSON.parse(source.canonical).canonicalFacts;
  const canonical=(year,item)=>Number(facts.find(row=>row.ticker===f.ticker&&row.itemId===item&&row.period.end===year+'-12-31')?.value);
  check(f.financials.every(r=>r.cfo===canonical(r.year,'CFO') && r.capex===canonical(r.year,'CASH_CAPEX_REPORTED') &&
    r.parentNpat===canonical(r.year,'NET_INCOME_ATTRIBUTABLE_PARENT')), 'CA_CANONICAL_OPERANDS');
  const notes=JSON.parse(source.notes).documents;
  const pages=(i,indices)=>indices.map(j=>notes[i].pages[j].text).join('\n');
  const signedTokens=(data,keys,text)=>keys.every(key=>text.replace(/[.,]/g,'').includes(String(Math.abs(data[key]))));
  const parentKeys=['cfo','capex','receipts','paid','contributions','openingCash','closingCash','lendingOut','lendingRecovered'];
  check(signedTokens(f.parentFY,parentKeys,pages(2,[10,11])) &&
    (annual || signedTokens(f.parentH1,[...parentKeys,'borrowed','repaid'],pages(0,[10,11]))), 'CA_PARENT_SCOPE');
  const group=f.financials.map((r,i)=>{
    const futureFactor=f.stockDividendFactors.slice(i).reduce((a,b)=>a*b,1);
    return {...r,fcf:r.cfo-r.capex,capexCfo:r.capex/r.cfo,
      groupFcfPerEquivalentClosingShare:(r.cfo-r.capex)/(r.shares*futureFactor)};
  });
  const direct=f.directEbitInputs.map(([gross,sell,admin])=>gross-sell-admin);
  check(f.directEbitInputs.flat().every(value=>pages(3,[11,12,13,14]).replace(/[.,]/g,'').includes(String(value))),
    'CA_DIRECT_EBIT_SOURCE');
  if (!annual) {
    const cells=JSON.parse(source.q3).cells;
    check(['cfo','capex'].every(k=>cells.some(r=>Number(r.value)===f.group9M[k])) &&
      notes[0].pages[41].text.includes('10.819.301') &&
      f.currentProgram.before+f.currentProgram.issued+f.capitalization2026===f.conditionalShares &&
      f.currentDividend.paymentDate===null,'CA_CURRENT_ACTION_OR_OPERANDS');
  }
  const reconcileParent = row => {
    const bridge=parentCashBridge(row);
    const netBorrowing=row.borrowed-row.repaid;
    const netLending=row.lendingRecovered-row.lendingOut;
    const reconstructed=row.openingCash+bridge.residual+netLending+netBorrowing+row.assetDisposals+row.shareCash+row.fx;
    check(reconstructed===row.closingCash,'CA_PARENT_FULL_BRIDGE');
    return {...row,...bridge,netBorrowing,netLending,reconstructed};
  };
  const parentFY=reconcileParent(f.parentFY);
  const parentH1=annual?null:reconcileParent(f.parentH1);
  const market=JSON.parse(source.raw).prices;
  const multipleAnchor=group.map(r=>{
    const raw=market.filter(p=>p.date.startsWith(String(r.year))).at(-1);
    return { year:r.year, date:raw?.date??null, close:raw?raw.raw.GiaDongCua*1000:null,
      pe:raw?raw.raw.GiaDongCua*1000*r.shares/r.parentNpat:null };
  });
  function screen(p) {
    const previous=group.find(row=>row.year===p.year-1);
    const eligible=multipleAnchor.filter(row=>row.year<p.year).flatMap(x=>x.pe===null?[]:[x.pe]).sort((a,b)=>a-b);
    const anchors=eligible.length?[eligible[0],eligible[Math.floor((eligible.length-1)/2)]]:[];
    const values=previous&&anchors.length?[...new Set(anchors.map(pe=>Math.round(pe*previous.parentNpat/p.beginning)))]:null;
    const sensitivities=values?.map(value=>{
      const grossUpper=p.grossProceeds??0;
      return {value,zeroProceeds:economicTransfer({before:p.beginning,issued:p.newShares,value,netProceeds:0,incrementalBenefit:0}),
        grossProceedsCase:p.grossProceeds==null?null:economicTransfer({before:p.beginning,issued:p.newShares,value,
          netProceeds:grossUpper,incrementalBenefit:0})};
    });
    return {...p,retrospectiveValuationStatus:'PERIOD_SCREEN_ONLY_EVENT_DATE_OR_AVAILABLE_INFORMATION_NOT_BOUND',
      modeledValueRange:values,sensitivities:sensitivities??null,
      mechanicalProgrammeFactor:p.beginning/(p.beginning+p.issued),newSharesOnlyFactor:p.beginning/(p.beginning+p.newShares)};
  }
  const issuance=f.programs.map(screen);
  const mechanical=compoundRatios(issuance.map(r=>r.mechanicalProgrammeFactor));
  const newSharesOnly=compoundRatios(issuance.map(r=>r.newSharesOnlyFactor));
  const valueOnly=readWp5Comparison(source);
  const packet={initial:document(pins.initial),initialReview:document(pins.initialReview),
    finalReview:document(pins.finalReview),...(pins.revision?{revision:document(pins.revision)}:{})};
  check(Object.keys(packet.initial.models).every(id=>Object.hasOwn(ownership,id)),'CA_OWNERSHIP_REQUIRED');
  const rows=assessCapitalAllocation({...f,sha256:pins.freeze.sha256},packet,hash,known);
  products[period]={pins,classification:'CALCULATED',group,directEbit:direct,
    annualChange:{cfo:group[3].cfo/group[2].cfo-1,capex:group[3].capex/group[2].capex-1,
      fcf:group[3].fcf/group[2].fcf-1,directEbit:direct[1]/direct[0]-1},
    cumulative:Object.fromEntries(['cfo','capex','fcf'].map(key=>[key,group.reduce((sum,row)=>sum+row[key],0)])),
    parentFY,parentH1,group9M:annual?null:{...f.group9M,fcf:f.group9M.cfo-f.group9M.capex},
    decisionRegister:f.decisionRegister,goodwillAccountingIncrease:f.goodwillAccountingIncrease,
    issuance,multipleAnchor,mechanical,newSharesOnly,currentProgram:annual?null:screen({...f.currentProgram,year:2026,beginning:f.currentProgram.before,
      newShares:f.currentProgram.issued,grossProceeds:null}),
    eps:compoundRatios(f.epsPairs.map(([a,b])=>a/b)),pairs:f.epsPairs,
    wp5CommonMultiple:annual?{annual:valueOnly.annual}:{annual:valueOnly.annual,current:valueOnly.current,
      limitation:'Multiply representative recurring EPS by the same 10x; scope and entitlement remain different.'}};
  return [period,rows];
}));
function readWp5Comparison(source) {
  const models=JSON.parse(source.wp5).products;
  return Object.fromEntries(Object.entries(models).map(([period,row])=>{
    const eps=row.calculations.normalization.eps;
    return [period,{eps,comparisonAt10x:(eps[0]+eps[1])*5,acceptedRepresentativeValue:row.calculations.primary[1]}];
  }));
}
const effectiveCapital=capital.current.map((row,i)=>resolveCapitalEffective(row,capital.annual[i]));
const effectiveScores = [...prior.aggregation.effectiveScores, ...effectiveCapital];
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
const routeQualifications = [...prior.aggregation.routeQualifications, ...effectiveCapital.map(row =>
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
const baselines=Object.fromEntries(Object.entries(policy.historicalPins).map(([key,pin])=>[key,document(pin)]));
const bq=baselines.bq;
const eq=document(bq.acceptedEconomicQuality).latestValidAssessment;
const moat=document(bq.acceptedMoat).bqMoat.baseline;
const history=new Map([
  ['BQ-EQ',eq],['BQ-MOAT',moat],['BQ-CASH',bq.cash.baseline],['BQ-RES',bq.resilience.baseline],
  ...[...baselines.fh.fh,...baselines.gq.growth,...baselines.ic.industry].map(x=>[x.baseline.rubricId,x.baseline]),
  ...prior.valuation.annual.map(x=>[x.id,x]),
  ...document(document(policy.inputs.annual.freeze).sources.wp5).valuation.annual.map(x=>[x.id,x]),
  ...capital.annual.map(x=>[x.id,x]),
]);
const scorecard = RUBRICS.map(r=>{
  const current=effectiveScores.find(s=>s.id===r.id);
  const historical=history.get(r.id);
  const qualification=routeQualifications.find(s=>s.id===r.id);
  return {id:r.id,weight:r.max,category:r.category,points:current.points,validity:current.validity,
    currentCutoff:current.reviewCutoff,underlyingPeriod:current.underlyingAssessmentCutoff??current.financialPeriod??null,
    historicalCutoff:historical ? historical.reviewCutoff??'2025-12-31' : null,historicalPoints:historical?.points??null,
    route:current.routeQualification?.route??qualification?.route??null,confidence:current.confidence??null,
    provisionalOrigin:current.validity==='PROVISIONAL'?(current.latestValidAssessment??current.financialPeriod??current.basis):null,
    limitations:current.routeQualification?.limitation??current.limitations??null,
    nrReason:current.points===null?current.routes?.A?.model?.reopening??'NO_ELIGIBLE_EFFECTIVE_SCORE':null};
});
process.stdout.write(JSON.stringify({ticker:prior.ticker,cutoff:prior.cutoff,scope:'REAL_ISSUER_RESEARCH',
  methodology:ref(policyPath),implementation:'capital-allocation-research-v1.0.0',prior:accepted.result,
  executables:[engine,'tools/scoring/validate_fpt_capital_allocation.mjs'].map(ref),capital,products,
  scorecard,aggregation,researchRanking,investmentDecisionInput,researchResidualRisk:prior.researchResidualRisk,
  formalResidualRisk:gates.residualRisk,decisionEligible:false,publicationAuthorized:false},null,2)+'\n');
