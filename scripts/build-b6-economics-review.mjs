/** Runs current AI review/valuation contracts against actual checked source readings. */
import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
const {normalizeCommonEarningsReading,reportedEarningsSensitivity,evaluateAIReview}=await import('../src/domain/scoring/review-analysis.ts');
const {RUBRICS}=await import('../src/domain/scoring/methodology.ts');
const {latestCompletedHoseSession}=await import('../src/domain/market-boundary/completed-session.ts');
const {HOSE_HOLIDAYS_2026}=await import('../src/domain/market-boundary/hose-calendar.ts');
const root='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-economics-r3';
const prior='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-comparability-r2';
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),save=(p,v)=>{mkdirSync(p.slice(0,p.lastIndexOf('/')),{recursive:true});writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const at=new Date().toISOString(),readings=read(root+'/checked-common-earnings.json').facts;
const laterFundBridges=read(root+'/later-fund-bridges.json').rows;
const bsrReconciliation=read(root+'/bsr-source-reconciliation.json');
assert.equal(sha(bsrReconciliation.source.pdfPath),bsrReconciliation.source.sha256);
const checkedPages=new Set(readings.flatMap(f=>[f.source.page,...(f.additionalEvidencePages??[])].map(p=>f.source.pdfPath+'#page='+p)));
for(const b of laterFundBridges)for(const p of b.source.pages)checkedPages.add(b.source.pdfPath+'#page='+p);
for(const p of bsrReconciliation.physicalPagesInspected)checkedPages.add(bsrReconciliation.source.pdfPath+'#page='+p);
for(const b of laterFundBridges)assert.equal(sha(b.source.pdfPath),b.source.sha256);
const marketReview=read(root+'/market-review.json');
assert.equal(marketReview.state,'PASS_COMPLETED_CLOSE_REFERENCE');
const marketDatabase=new DatabaseSync('data/vn30.sqlite',{readOnly:true});
const currentPrices=new Map();
try{for(const ref of marketReview.rows){
 const row=marketDatabase.prepare('SELECT body,body_hash FROM broker_observation WHERE id=?').get(ref.observationId);
 assert.ok(row);assert.equal(createHash('sha256').update(row.body).digest('hex'),row.body_hash);
 const price=JSON.parse(row.body);assert.equal(price.ticker,ref.ticker);assert.equal(price.selectedAt,marketReview.capturedAt);
 currentPrices.set(ref.ticker,{...price,observationId:ref.observationId});
}}finally{marketDatabase.close();}
const policy={contract:'owner-authorized-ai-economics-review-policy-v1',actor:'CHATGPT',scope:'REVIEW_CANDIDATE',ownerAuthorizationReference:'OWNER_REQUEST_PERSONAL_AI_ACCEPTANCE_AND_20261030_NORMALIZATION_VALUATION_SCORE_REVIEW',
 sourcePriority:'PDF_FIRST',normalizationRules:['Reported common earnings are not total NPAT or normalized earnings','No unknown fund or dash becomes zero','No weighted/listed shares substitute for current common shares','No H1 doubling or unverifiable TTM splice','Keep source standalone/consolidated scopes separate','Preserve reported source conflict and recomputed amount separately'],
 valuationRules:{primaryBySector:{BANK:'RESIDUAL_INCOME',SECURITIES:'NORMALIZED_EARNINGS_AND_BOOK',REAL_ESTATE:'PROJECT_RNAV_OR_LOOK_THROUGH_SOTP',OTHER:'NORMALIZED_OWNER_EARNINGS_DCF'},discountRates:[{value:'0.18',role:'HIGHER_HURDLE_SENSITIVITY_ASSUMPTION'},{value:'0.15',role:'NORMAL_BUY_RETURN_HURDLE_REFERENCE_NOT_ESTIMATED_WACC'},{value:'0.12',role:'EXCEPTIONAL_POLICY_FLOOR_SENSITIVITY_NOT_NORMAL_BUY_HURDLE'}],sensitivityIsPrimaryValuation:false,sensitivityForecast:'No growth and100%distribution assumption for diagnostic capitalization only; not a sustainable payout forecast',reference:'docs/01 SYSTEM/RISK_POLICY_v1.0.md#12'},
 scoreRules:['Reuse unchanged23 rubrics/maxima and100point weights','AI provenance is not HUMAN or independent review','Unsupported points remainN/R; never redistribute missing weights','No production acceptance or investment actions from this review'],productionScoringAuthorized:false};
save(root+'/economics-review-policy.json',policy);
const expectedSession=latestCompletedHoseSession(at,{version:'hose-calendar-2026-v1',validFrom:'2026-01-01',validThrough:'2026-12-31',holidayDates:HOSE_HOLIDAYS_2026});
const index=[];
for(const f of readings){
 assert.equal(sha(f.source.pdfPath),f.source.sha256);const old=read(prior+'/native-inputs/'+f.ticker+'.json'),normalized=normalizeCommonEarningsReading(f);
 const sourceRef=root+'/checked-common-earnings.json#'+f.id;
 const laterFundBridge=laterFundBridges.find(b=>b.ticker===f.ticker)??null;
 const evidence=[{id:f.id,knownAt:at,sourceRefs:[f.source.pdfPath+'#page='+f.source.page,sourceRef],checked:true,supportedTopics:[],qualification:'CONTEXT_ONLY',family:'common-earnings-FY2025'}];
 const current=currentPrices.get(f.ticker);assert.ok(current);
 const marketQualified=current.tradingDate===expectedSession;
 const market={...current,asOfReview:at,expectedSession,runId:marketReview.runId,qualification:marketQualified?'CHECKED_COMPLETED_CLOSE_REFERENCE':'STALE_FOR_CURRENT_VALUATION',currentValuationQualified:marketQualified,productionScoringAuthorized:false};
 const sensitivities=normalized.accountingCommonProfitVnd===null?[]:policy.valuationRules.discountRates.map(r=>({...reportedEarningsSensitivity(normalized.accountingCommonProfitVnd,r.value),assumptionRole:r.role,basisPeriod:'FY2025',sourceScope:f.sourceScope,normalizationStatus:normalized.status}));
 const sectorNeeds=f.sector==='BANK'?['COMMON_EQUITY_EX_NCI_AND_PREFERENCE_CLAIMS','NORMALIZED_CREDIT_COST_NIM_AND_SUSTAINABLE_ROE','CAPITAL_RETENTION_AND_GROWTH_RECONCILIATION']:f.sector==='SECURITIES'?['RECURRING_VS_TRADING_AND_UNREALIZED_EARNINGS','SUSTAINABLE_COMMON_ROE_AND_BOOK_VALUE']:f.sector==='REAL_ESTATE'?['PROJECT_LEGAL_SCHEDULE_COST_TAX_AND_OWNERSHIP','PROJECT_EQUITY_CASHFLOWS_AND_TIMING','CORPORATE_DEBT_RECOURSE_NCI_AND_CASH_TRANSFER_BRIDGE']:['MAINTENANCE_VS_GROWTH_CAPEX','NORMALIZED_RECURRING_COMMON_OWNER_CASHFLOW','WORKING_CAPITAL_TAX_AND_REINVESTMENT_FORECAST'];
 const val={status:'PRIMARY_VALUATION_N_R_EXPLICIT_INPUTS',model:old.valuationAssumptions.model,scenarios:['BEAR','BASE','BULL'].map(name=>({name,forecast:null,fairValuePerShare:null,missing:[...sectorNeeds,'CURRENT_COMMON_SHARES_AND_ACTION_BRIDGE',...normalized.flags]})),
  reportedEarningsSensitivities:sensitivities,market,primaryValuationQualified:false,screeningValuesAreFairValue:false};
 const assessments=RUBRICS.map(r=>{
  const previous=old.rubricInputs.find(a=>a.subcategory===r.id),missing=[previous.rationale];
  if(['BQ-EQ','BQ-CASH','GQ-HIST','CA-PSV'].includes(r.id))missing.push(...normalized.flags);
  if(r.category==='VAL')missing.push(...sectorNeeds,'CURRENT_SHARE_DENOMINATOR_NOT_QUALIFIED',...(!marketQualified?['CURRENT_PRICE_NOT_QUALIFIED']:[]));
  return {subcategory:r.id,source:'AI',actor:'CHATGPT',points:null,band:null,rationale:previous.rationale+' CheckedFY2025 common numerator:'+f.reportedCommonProfitVnd+'VND; '+normalized.status,
   economicChannel:r.id+'-distinct-economic-channel',topics:[],counterEvidenceRefs:[f.id],missing:[...new Set(missing)],strongerEvidence:false,maximumPrerequisitesMet:false};
 });
 const input={contract:'owner-authorized-ai-score-review-v1',scope:'REVIEW_CANDIDATE',ticker:f.ticker,knownAt:at,ownerAuthorizationReference:policy.ownerAuthorizationReference,assessments,evidence,normalizationQualified:false,valuationQualified:false,marketQualified,gatesQualified:false,expectedReturn:null};
 const scoreReview=evaluateAIReview(input);assert.equal(scoreReview.totalScore,null);assert.equal(scoreReview.productionScoringAuthorized,false);
 const plan={ticker:f.ticker,sourceScope:f.sourceScope,sourceReading:f,normalization:{...normalized,laterFundBridge,sourceArithmeticInvestigation:f.ticker==='BSR'?bsrReconciliation:null},valuation:val,scoreInput:input,scoreReview,
  remainingResearch:{normalization:normalized.flags,valuation:sectorNeeds,qualitativeRubricReview:'Topic-specific economic assessment still required; EPS-note evidence alone does not prove23 rubric topics',ownerDataRequest:[]},readyForScoring:false};
 save(root+'/issuers/'+f.ticker+'.json',plan);index.push({ticker:f.ticker,sector:f.sector,sourceScope:f.sourceScope,normalization:normalized.status,reportedCommonProfitVnd:f.reportedCommonProfitVnd,accountingCommonProfitVnd:normalized.accountingCommonProfitVnd,normalizationFlags:normalized.flags,sensitivityScenarios:sensitivities.length,marketStatus:market.qualification,scoredRubrics:scoreReview.rows.filter(r=>r.points!==null).length,totalScore:null,productionScoringAuthorized:false,path:root+'/issuers/'+f.ticker+'.json'});
}
save(root+'/economics-review-index.json',{contract:'b6-economics-current-review-index-v1',reviewedAt:at,expectedMarketSession:expectedSession,tickers:index.length,checkedSourcePages:checkedPages.size,accountingCommonReadingsReconciled:index.filter(r=>r.accountingCommonProfitVnd!==null).length,sourceArithmeticConflicts:index.filter(r=>r.accountingCommonProfitVnd===null).map(r=>r.ticker),sensitivityScenarios:index.reduce((n,r)=>n+r.sensitivityScenarios,0),currentMarketPricesQualified:index.filter(r=>r.marketStatus==='CHECKED_COMPLETED_CLOSE_REFERENCE').length,primaryValuationsReady:0,acceptedTotalScores:0,rows:index,productionScoringAuthorized:false});
console.log(JSON.stringify({tickers:index.length,accountingCommonReadingsReconciled:index.filter(r=>r.accountingCommonProfitVnd!==null).length,referenceSensitivityScenarios:index.reduce((n,r)=>n+r.sensitivityScenarios,0),acceptedTotalScores:0,expectedMarketSession:expectedSession}));
