/** Integrates checked economic bridges into per-issuer AI review, preserving R1–R3. */
import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {decimal}=await import('../src/domain/portfolio/values.ts');
const {postAcquisitionCash}=await import('../src/domain/scoring/economic-normalization.ts');
const {evaluateAIReview}=await import('../src/domain/scoring/review-analysis.ts');
const base='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30',root=base+'/b6-underwriting-r4';
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const save=(n,v)=>{mkdirSync(root+'/'+n.slice(0,n.lastIndexOf('/')),{recursive:true});writeFileSync(root+'/'+n,JSON.stringify(v,null,2)+'\n');};
const at=new Date().toISOString(),facts=read(base+'/b6-economics-r3/checked-common-earnings.json').facts;
const extras=read(root+'/checked-extra-capex.json').rows,banks=read(root+'/checked-bank-risk-expense.json').rows;
const sourceContexts=read(base+'/b6-comparability-r2/native-review-sources.json').contexts;
const capture=read(root+'/profile-capture-reference.json');assert.equal(sha(capture.path),capture.sha256);
const profiles=read(capture.path);assert.equal(profiles.rows.length,30);
for(const r of extras)assert.equal(sha(r.source.pdfPath),r.source.sha256);
for(const r of banks)for(const e of r.sourceEvidence)assert.equal(sha(e.pdfPath),e.sha256);
const special={
 BSR:['Reconcile21,135,191,895VNDprinted common-profit discrepancy; preserve printed and arithmetic values','Normalize refining margin, inventory gains/losses and turnaround cash spending'],
 FPT:['Keep same-method historical comparatives and2026scope bridge; no unbridged growth/TTM splice','Separate parent common claims, subsidiary interests and maintenance/reinvestment needs'],
 GAS:['Normalize gas-price/volume cycle and project replacement spending; cash acquisitions are not proven maintenance'],
 GVR:['Reconcile fund deduction versus unestimated-fund footnote','Separate rubber-cycle earnings, land/conversion gains and subsidiaries/NCI'],
 HPG:['Normalize steel spread and capacity ramp-up; expansion cash outflows cannot be replaced by depreciation without a funding plan'],
 MCH:['Separate recurring consumer earnings, employee allocations, intra-group financial income and cash available to common holders'],
 MSN:['Bridge holding-company recourse debt, subsidiary common interests and cash upstreaming; do not capitalize groupCFO as parentFCFE'],
 MWG:['Normalize store restructuring/closures and associate income; assess inventory/payable cash release versus recurring working capital'],
 SAB:['Bridge group cash and minority stakes, employee allocation and cash availability; no automatic net-cash addition to financial-incomeDCF'],
 VJC:['Separate aircraft sale/leaseback effects from recurring operating earnings; reconcile lease/debt payments and fleet commitments'],
 VHM:['Project-by-project legal status, delivery timing, ownership, remaining costs/taxes and corporate debt bridge required'],
 VIC:['Look-throughSOTP across property, vehicles and other businesses; separate recourse debt, NCI and cross-funding before equity valuation'],
 VPL:['UseFY2023onward as authorized; noFY2022gap','Hotel/tourism occupancy, recurring operating cash, refurbishment/expansion and asset debt need a business-specificDCF/NAV bridge; sector label alone does not justify a developerRNAV'],
 VRE:['FY2023row21 explicitly mixes asset acquisitions and investment deposits; keep8,321,768million gross outflow separate from cleanmaintenancecapex','Separate recurring rentals, property transfers, tenant incentives, deposits and treasury shares'],
 SSI:['Normalize recurring brokerage/margin income versus trading/valuation gains and investment cycle','244,818,160,367VNDlaterparentfund bridge is partial group coverage; keep treasury/outstanding shares distinct'],
 TCX:['Keep reportedstandalone scope explicit; verify group relevance before mixing commonbook or earnings','Separate recurring margin/brokerage from proprietarytrading and newly issued capital effects'],
 LPB:['Keep auditedstandalone scope explicit; do not silently relabel as consolidated','Finalize common-owner employee-fund leakage and future capital retention'],
 STB:['Restructuring/VAMC provisions, collateral recoveries and disposal timing require their own bridge; do not erase them using a peermean'],
 SSB:['PTF100%disposal gain2,607,318million removed under explicit tax/fund scenarios','275,000million approved fund period is not explicit; unquantified convertible dilution remains'],
 SHB:['Separate bad-debt recoveries from ordinary NIM/fees and securitiesprovision reversals; do not classify all otherincome as one-off'],
 HDB:['Later25billionparentfund only partially resolves group leakage','Currentprofile outstanding includes provisionalrights and differs from listingcount; verify issue/effective-date bridge'],
 MBB:['No substitution for deferredH126CAR','Reconcile group employee leakage, credit mix and currentrights/issuance bridge'],
 TCB:['Currentprofile provisionaloutstanding differs materially from listingcount; establish price/action denominator before pershare valuation'],
 ACB:['Matchedloanprovisions reconciled; retain nonloan residual−694millionVND','H126commonbook and completedbonusissue checked; lateractions, funding/capitalstress and forwardrisk remain'],
 VNM:['Parent ownercash forecast now explicitly funds growth and standingreinvestment','Current-period earnings/cash bridge, maintenance split and scenario robustness remain before valuationadmission'],
};
const all=[],cashRows=[];
for(const f of facts){
 const old=read(base+'/b6-economics-r3/issuers/'+f.ticker+'.json'),native=read(base+'/b6-comparability-r2/native-inputs/'+f.ticker+'.json');
 const profile=profiles.rows.find(p=>p.ticker===f.ticker);assert.ok(profile);
 assert.equal(sha(profile.rawPath),profile.sha256);assert.equal(sha(profile.discovery.rawPath),profile.discovery.sha256);
 const field=label=>profile.fields.find(x=>x.label===label)??null;
 const shareReference={source:profile.rawPath,listed:field('Khối lượng niêm yết'),outstanding:field('Khối lượng lưu hành'),date:profile.retrievedAt,listedDiffersFromProviderOutstanding:field('Khối lượng niêm yết')?.value!==field('Khối lượng lưu hành')?.value,denominatorAccepted:false};
 let cash=[];
 if(!['BANK','SECURITIES'].includes(f.sector))for(let year=f.ticker==='VPL'?2023:2022;year<=2025;year++){
  const rows=native.observations.filter(o=>o.itemId==='CFO'&&o.fiscalYear===year&&o.periodType==='ANNUAL');assert.equal(rows.length,1);
  const cfo=rows[0],nativeCapex=native.observations.filter(o=>o.itemId==='CASH_CAPEX_REPORTED'&&o.fiscalYear===year&&o.periodType==='ANNUAL');assert.ok(nativeCapex.length<=1);
  const extra=extras.find(r=>r.ticker===f.ticker&&r.fiscalYear===year);assert.ok(!(extra&&nativeCapex.length));
  const spending=extra?.spendingMagnitudeVnd??nativeCapex[0]?.normalized.value??null;
  const contexts=[cfo,...nativeCapex].map(o=>{const c=sourceContexts.find(c=>c.observationId===o.id);assert.ok(c);assert.equal(sha(c.sourcePath),c.sourceHash);return c;});
  if(nativeCapex.length)assert.equal(nativeCapex[0].reportingScope,cfo.reportingScope);
  if(extra)assert.equal(extra.sourceScope,cfo.reportingScope);
  const bridge={ticker:f.ticker,year,sourceScope:cfo.reportingScope,cfoObservationId:cfo.id,capexObservationId:nativeCapex[0]?.id??null,capexCheckedReadingId:extra?.id??null,sourceContexts:contexts,extraSource:extra?.source??null,...(spending===null?{cfo:cfo.normalized.value,cashAcquisitionSpending:null,reportedPostAcquisitionCash:null,missing:'FY2023VREmixeddeposit/assetcaption; seevre-mixed-investing-flow.json',normalizedOwnerFcfe:false}:postAcquisitionCash(cfo.normalized.value,spending))};
  cash.push(bridge);cashRows.push(bridge);
 }
 const bank=banks.find(r=>r.ticker===f.ticker)??null;
 const specific=special[f.ticker]??(f.sector==='BANK'?['Disaggregate customerloan, bond and offbalance riskexpenses before normalizing creditcost','Reconcile commonowner equity/funds, NIM/fees, capital retention and forwardassetquality']:[]);
 let model=null;
 if(f.ticker==='VNM')model=read(root+'/VNM-conditional-owner-valuation.json');
 if(f.ticker==='ACB')model=read(root+'/ACB-conditional-residual-income.json');
 const scoreInput=structuredClone(old.scoreInput);scoreInput.knownAt=at;
 if(model){
  const id='underwriting-forecast-range-'+f.ticker,modelPath=root+'/'+(f.ticker==='VNM'?'VNM-conditional-owner-valuation.json':'ACB-conditional-residual-income.json');
  scoreInput.evidence.push({id,knownAt:at,sourceRefs:[modelPath],checked:true,supportedTopics:['forecast_range','sensitivity','dependencies'],qualification:'SCORING_SUPPORT',family:'issuer-specific-forecast-range'});
  const a=scoreInput.assessments.find(a=>a.subcategory==='RG-UNC');
  Object.assign(a,{points:0,band:'High uncertainty',rationale:'Source-backed scenarios show material value sensitivity and unresolved currentcapital/reinvestment dependencies. This is an explicit AI judgment of forecast uncertainty, not a penalty merely for missing files.',economicChannel:'RG-UNC-future-value-estimate-precision',topics:['forecast_range','sensitivity','dependencies'].map(topic=>({topic,refs:[id]})),counterEvidenceRefs:[id],missing:[],strongerEvidence:false,maximumPrerequisitesMet:false});
 }
 const scoreReview=evaluateAIReview(scoreInput);
 const normalization=f.ticker==='ACB'?read(root+'/ACB-conditional-residual-income.json').earningsAdjustment:f.ticker==='SSB'?read(root+'/SSB-identified-normalization.json'):f.ticker==='VNM'?{source:root+'/VNM-conditional-owner-valuation.json',scenarios:model.scenarios.map(s=>({name:s.name,normalizedCommonEarnings:s.normalizedCommonEarningsAfterScenarioHaircut}))}:old.normalization;
 const result={ticker:f.ticker,sector:f.sector,reviewedAt:at,sourceScope:f.sourceScope,reportedCommonProfitVnd:f.reportedCommonProfitVnd,normalization,annualReportedCashBridge:cash,bankRiskExpense:bank,currentSharesReference:shareReference,conditionalValuation:model,scoreInput,scoreReview,acceptance:{state:'NOT_ACCEPTED_FOR_COMPLETE_SCORE',normalizationAccepted:false,primaryValuationAccepted:false,currentCommonDenominatorAccepted:false,totalScoreAccepted:false,independentHumanRequired:false,ownerActionRequired:false},remainingWork:specific,readyForScoring:false,productionScoringAuthorized:false};
 save('issuers/'+f.ticker+'.json',result);
 all.push({ticker:f.ticker,sector:f.sector,annualCashBridges:cash.filter(r=>r.reportedPostAcquisitionCash!==null).length,negativeAnnualCashBridges:cash.filter(r=>r.reportedPostAcquisitionCash!==null&&decimal(r.reportedPostAcquisitionCash).negative).map(r=>r.year),checkedBankRiskExpenseYears:bank?3:0,conditionalValuationScenarios:model?.scenarios.length??0,scoredRubrics:scoreReview.rows.filter(r=>r.points!==null).length,coveredMaximum:scoreReview.coveredMaximum,totalScore:null,remainingWork:specific,path:root+'/issuers/'+f.ticker+'.json'});
}
save('annual-cash-bridges.json',{contract:'b6-reported-cash-bridges-v1',rows:cashRows,notNormalizedFcfe:true,ownerActionRequired:false});
const index={contract:'b6-underwriting-review-index-v1',reviewedAt:at,tickers:all.length,checkedBankExpenseYears:banks.length*3,extraCheckedCapexValues:extras.length,annualCashBridges:cashRows.filter(r=>r.reportedPostAcquisitionCash!==null).length,unresolvedMixedCashFlowRows:cashRows.filter(r=>r.reportedPostAcquisitionCash===null).length,conditionalValuationScenarios:all.reduce((n,r)=>n+r.conditionalValuationScenarios,0),scoredRubrics:all.reduce((n,r)=>n+r.scoredRubrics,0),acceptedPrimaryValuations:0,acceptedTotalScores:0,ownerDataRequests:[],rows:all,productionScoringAuthorized:false};save('review-index.json',index);
console.log(JSON.stringify({...index,rows:undefined}));
