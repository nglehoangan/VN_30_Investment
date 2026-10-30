// @vitest-environment node
import {describe,it,expect} from 'vitest';
import {afterTaxCommonAdjustment,loanProvisionNormalization,postAcquisitionCash,ownerCashForecast,positivePayoffIrr} from '@/domain/scoring/economic-normalization';
const adjustment={parentNpat:'100',reportedCommon:'90',printedFund:'10',pretaxAdjustment:'-20',taxRate:'0.2',sourceRefs:['synthetic-only']};
describe('economic normalization arithmetic and accounting boundaries',()=>{
 it('keeps fixed allocations distinct from a modeled percentage on normalized income',()=>{
  expect(afterTaxCommonAdjustment({...adjustment,fundPolicy:{kind:'RETAIN_PRINTED_ALLOCATION'}}).modelCommonEarnings).toBe('74');
  const r=afterTaxCommonAdjustment({...adjustment,fundPolicy:{kind:'REESTIMATE_AS_MODEL_ASSUMPTION',rate:'0.1'}});expect(r.modelCommonEarnings).toBe('75.6');expect(r.comprehensiveNormalizationClaimed).toBe(false);
 });
 it('adds back an identified loss symmetrically and refuses a broken reported fund bridge',()=>{
  expect(afterTaxCommonAdjustment({...adjustment,pretaxAdjustment:'20',fundPolicy:{kind:'REESTIMATE_AS_MODEL_ASSUMPTION',rate:'0.1'}}).modelCommonEarnings).toBe('104.4');
  expect(()=>afterTaxCommonAdjustment({...adjustment,reportedCommon:'91',fundPolicy:{kind:'RETAIN_PRINTED_ALLOCATION'}})).toThrow(expect.objectContaining({issues:expect.arrayContaining([expect.objectContaining({reason:'REPORTED_COMMON_FUND_BRIDGE_MISMATCH'})])}));
 });
 it('replays SSB disposal under an explicit tax/fund assumption without deducting the fund twice',()=>{
  const r=afterTaxCommonAdjustment({parentNpat:'5509539000000',reportedCommon:'5344253000000',printedFund:'165286000000',pretaxAdjustment:'-2607318000000',taxRate:'0.2',fundPolicy:{kind:'REESTIMATE_AS_MODEL_ASSUMPTION',rate:'0.03'},sourceRefs:['checkedSSBpages52/55/57']});
  expect(r.modelCommonEarnings).toBe('3320974062000');expect(r.transactionSpecificTaxProven).toBe(false);
 });
 it('preserves a negative reported cash residual and refuses negative spending magnitudes',()=>{expect(postAcquisitionCash('100','120').reportedPostAcquisitionCash).toBe('-20');expect(()=>postAcquisitionCash('100','-120')).toThrow();expect(postAcquisitionCash('100','50').normalizedOwnerFcfe).toBe(false);});
});
describe('matched customer-loan provision normalization',()=>{
 const input={years:[1,2,3].map(n=>({year:2022+n,grossOpeningLoans:'100',grossClosingLoans:'100',customerLoanProvision:String(n),sourceRefs:['synthetic-only']})),targetYear:2025,currentPAndLProvision:'2.5',componentReconciliationVerified:true,denominatorDefinitionVerified:true};
 it('normalizes the matched loan component while preserving the signed non-loan residual',()=>{const r=loanProvisionNormalization(input);expect(r.weightedRate).toBe('0.02');expect(r.targetLoanProvision).toBe('2');expect(r.currentNonLoanResidual).toBe('-0.5');expect(r.modelTotalProvision).toBe('1.5');expect(r.pretaxProfitAdjustment).toBe('1');expect(r.fullCreditCycleProven).toBe(false);});
 it('blocks aggregate-risk expenses divided blindly by customer loans',()=>{expect(()=>loanProvisionNormalization({...input,componentReconciliationVerified:false})).toThrow();expect(()=>loanProvisionNormalization({...input,denominatorDefinitionVerified:false})).toThrow();});
 it('requires a contiguous comparable period sequence and at least3years',()=>{expect(()=>loanProvisionNormalization({...input,years:input.years.slice(1)})).toThrow();expect(()=>loanProvisionNormalization({...input,years:input.years.map((y,i)=>i===1?{...y,grossOpeningLoans:'101'}:y)})).toThrow();});
});
describe('internally funded owner cash projections and returns',()=>{
 const forecast={normalizedCommonEarnings:'100',depreciation:'10',maintenanceCapex:'10',reinvestmentReserve:'5',growthRates:['0.02','0'],returnOnIncrementalEquity:'0.1',terminalGrowth:'0',assumptionRefs:['synthetic-only']};
 it('funds growth and includes standing reinvestment once, with no fresh debt/equity windfall',()=>{const r=ownerCashForecast(forecast);expect(r.years[0].growthFundingRequired).toBe('20.4');expect(r.years[0].totalReinvestment).toBe('20.4');expect(r.cashflows).toEqual(['81.6','96.9']);expect(r.externalEquityAndIncrementalBorrowingAssumed).toBe('0');});
 it('makes maintenance capex affect cash even when depreciation is unchanged',()=>{expect(ownerCashForecast({...forecast,maintenanceCapex:'20'}).cashflows[0]).toBe('71.4');});
 it('does not fund growth for free or mismatch terminal investment requirements',()=>{expect(()=>ownerCashForecast({...forecast,returnOnIncrementalEquity:'0.01'})).toThrow();expect(()=>ownerCashForecast({...forecast,growthRates:['0.02','0.01']})).toThrow();});
 it('preserves negative forecast cash, leaving valuation qualification to the primary model',()=>{expect(Number(ownerCashForecast({...forecast,maintenanceCapex:'200'}).cashflows[0])).toBeLessThan(0);});
 it('solves ordinary positive and negative annual IRRs without using inversePE as expected return',()=>{expect(Number(positivePayoffIrr('100',['110']).annualIrr)).toBeCloseTo(0.1,10);expect(Number(positivePayoffIrr('100',['90']).annualIrr)).toBeCloseTo(-0.1,10);expect(Number(positivePayoffIrr('100',['0','100']).annualIrr)).toBeCloseTo(0,10);});
 it('refuses non-standard sign-changing cashflows or returns outside its declared bracket',()=>{expect(()=>positivePayoffIrr('100',['-5','120'])).toThrow();expect(()=>positivePayoffIrr('100',['1'])).toThrow();});
});
