/** Checked bank components plus explicit analyst scenarios; no production admission. */
import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {decimal}=await import('../src/domain/portfolio/values.ts');
const {loanProvisionNormalization,afterTaxCommonAdjustment,positivePayoffIrr}=await import('../src/domain/scoring/economic-normalization.ts');
const {residualIncomeValue}=await import('../src/domain/scoring/review-analysis.ts');
const root='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4';
const prior='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30';
const read=p=>JSON.parse(readFileSync(p,'utf8')),save=(n,v)=>writeFileSync(root+'/'+n,JSON.stringify(v,null,2)+'\n');
const mul=(a,b)=>decimal(a).proportional(decimal(b),decimal('1')).toString();
const checked=s=>assert.equal(createHash('sha256').update(readFileSync(s.pdfPath)).digest('hex'),s.sha256);
const detail=read(root+'/acb-loan-provision-components.json'),capital=read(root+'/acb-current-common-book.json');
detail.sourceEvidence.forEach(checked);checked(capital.source);
const native=read(prior+'/b6-comparability-r2/native-inputs/ACB.json');
const get=(item,date)=>{const rows=native.observations.filter(o=>o.itemId===item&&o.periodEnd===date);assert.equal(rows.length,1);return rows[0].normalized.value;};
const loan=loanProvisionNormalization({years:detail.rows.map(r=>({year:r.year,grossOpeningLoans:get('BANK_GROSS_CUSTOMER_LOANS',`${r.year-1}-12-31`),grossClosingLoans:get('BANK_GROSS_CUSTOMER_LOANS',`${r.year}-12-31`),customerLoanProvision:mul(r.customerLoanProvision,'1000000'),sourceRefs:detail.sourceEvidence.flatMap(s=>s.hrefs)})),targetYear:2025,currentPAndLProvision:mul(detail.rows.at(-1).pAndLTotal,'1000000'),componentReconciliationVerified:true,denominatorDefinitionVerified:true});
const common=read(prior+'/b6-economics-r3/checked-common-earnings.json').facts.find(r=>r.ticker==='ACB');checked(common.source);
const adjustment=afterTaxCommonAdjustment({parentNpat:mul(common.sourcePreDeductionProfit,common.currencyMultiplier),reportedCommon:common.reportedCommonProfitVnd,printedFund:'100000000000',pretaxAdjustment:loan.pretaxProfitAdjustment,taxRate:'0.20',fundPolicy:{kind:'RETAIN_PRINTED_ALLOCATION'},sourceRefs:[...detail.sourceEvidence.flatMap(s=>s.hrefs),common.source.href]});
const book=mul(capital.commonEquity,capital.currencyMultiplier);
const avgBook=decimal(get('TOTAL_EQUITY','2024-12-31')).add(decimal(get('TOTAL_EQUITY','2025-12-31'))).div(decimal('2'));
const historicalModelRoe=decimal(adjustment.modelCommonEarnings).div(avgBook).toString();
const specs=[{name:'BEAR',roe:['0.14','0.14','0.14','0.14','0.14'],growth:['0.02','0.02','0.02','0.02','0.02'],cost:'0.18',terminal:'0.02'},
 {name:'BASE',roe:['0.18','0.18','0.18','0.18','0.18'],growth:['0.05','0.05','0.04','0.03','0.03'],cost:'0.15',terminal:'0.03'},
 {name:'BULL',roe:['0.20','0.20','0.20','0.20','0.20'],growth:['0.07','0.06','0.05','0.04','0.04'],cost:'0.15',terminal:'0.04'}];
// This market reference is a validated R3 observation, not a new external capture.
const market=read(prior+'/b6-economics-r3/issuers/ACB.json').valuation.market;
const scenarios=specs.map(s=>{
 assert.equal(s.growth.at(-1),s.terminal);assert.equal(s.roe.at(-1),s.roe.at(-2));
 const model=residualIncomeValue({sector:'BANK',commonEquity:book,commonEquityQualified:true,normalizedRoe:s.roe,roeQualified:true,bookGrowth:s.growth,costOfEquity:s.cost,terminalResidualGrowth:s.terminal,sourceRefs:capital.source.hrefs});
 const shares=decimal(capital.commonSharesOutstanding),g=decimal(s.terminal),last=model.years.at(-1);
 // Constant terminal ROE and book growth imply a clean-surplus terminal P/B.
 const endingBook=decimal(last.openingBook).add(decimal(last.retained));
 const terminalPrice=endingBook.proportional(decimal(s.roe.at(-1)).sub(g),decimal('1')).div(decimal(s.cost).sub(g));
 const payoffs=model.years.map((y,i)=>(i===model.years.length-1?decimal(y.dividends).add(terminalPrice):decimal(y.dividends)).div(shares).toString());
 return {name:s.name,assumptions:s,modelQualification:'EXPLICIT_ANALYST_SCENARIO_NOT_FORMAL_ACCEPTANCE',model,equityValuePerReferenceShare:decimal(model.equityValue).div(shares).toString(),returnEstimate:positivePayoffIrr(market.value,payoffs),terminalPriceBeforePerShare:terminalPrice.toString(),acceptedFairValuePerShare:null};
});
save('ACB-conditional-residual-income.json',{contract:'b6-acb-conditional-residual-income-v1',ticker:'ACB',reviewedAt:new Date().toISOString(),sourceScope:'CONSOLIDATED',loanNormalization:loan,earningsAdjustment:adjustment,modelHistoricalRoeOnAverageFY2024FY2025Book:historicalModelRoe,commonEquityH126:book,referenceShares:capital.commonSharesOutstanding,capitalSource:root+'/acb-current-common-book.json',marketReference:market,scenarios,assumptions:['20% marginal tax on provision adjustment is a model assumption','Retain reported100billionVND fund; no second deduction','3-year weighted customer-loan provision rate is an estimate, not a full credit cycle','ForwardROE14/18/20%and retained book growth are explicit forecasts, not reported profits or regulatory permission','Terminal last2years use stableROE and finalbookgrowth equals terminalgrowth','H126book includes issuedbonus capital; no new cash or duplicate6.677654trillion addition','Retained growth cannot exceed earnings; regulatory capital and funding feasibility need separate stress assessment','No H126doubling or syntheticTTM; FY2025normalizedROE is a historical anchor, not the forwardforecast'],counterEvidence:['FY2025NPL categories3/4/5 are764791/770229/5136367millionVND; collateral and recovery timing not proven by a3-year mean','Growing marginloan business changes the risk mix','Publicprofile matches H126ordinary count; full later-action bridge remains unaccepted','Fundingmaturities, capitalstress, relatedparty and offbalance exposures still need separate assessment'],currentDenominatorFormallyQualified:false,primaryValuationAccepted:false,readyForScoring:false,productionScoringAuthorized:false});
const ssb=read(root+'/ssb-disposal-adjustment-input.json');checked(ssb.source);
const ssbScenarios=['RETAIN_PRINTED_ALLOCATION','REESTIMATE_AS_MODEL_ASSUMPTION'].map(kind=>({fundTreatment:kind,...afterTaxCommonAdjustment({parentNpat:mul(ssb.parentNpat,'1000000'),reportedCommon:mul(ssb.reportedCommonEarnings,'1000000'),printedFund:mul(ssb.printedFundDeduction,'1000000'),pretaxAdjustment:mul(ssb.disposal.preTaxGain,'-1000000'),taxRate:'0.20',fundPolicy:kind==='RETAIN_PRINTED_ALLOCATION'?{kind}:{kind,rate:'0.03'},sourceRefs:ssb.source.hrefs})}));
save('SSB-identified-normalization.json',{contract:'b6-ssb-identified-normalization-v1',ticker:'SSB',reviewedAt:new Date().toISOString(),scenarios:ssbScenarios,source:root+'/ssb-disposal-adjustment-input.json',laterEvidence:root+'/ssb-later-fund-and-capital.json',limitations:['20%transaction tax is assumed, not separately disclosed','3%fund reestimate is a model assumption, not a restated issuerEPS','275billionapproved allocation period not explicit in the checked paragraph; never silently substitute it intoFY2025','4.3trillion sale proceeds are not the2.607318trillion pretaxgain','Do not remove realized sale gain from book equity again','Historic PTF consolidation changes credit/earnings scope; no unbridged credit-cost average','Unknown convertible share number remains a valuation dependency'],comprehensiveNormalizationAccepted:false,readyForScoring:false,productionScoringAuthorized:false});
console.log(JSON.stringify({loanRate:loan.weightedRate,acbNormalizedCommon:adjustment.modelCommonEarnings,acbScenarios:scenarios.map(s=>({name:s.name,value:s.equityValuePerReferenceShare})),ssb:ssbScenarios.map(s=>s.modelCommonEarnings)}));
