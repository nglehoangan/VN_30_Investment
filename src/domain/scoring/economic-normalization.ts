/** Analyst estimate arithmetic. Source qualifications and formal score admission remain separate. */
import {decimal} from '@/domain/portfolio/values';
import {deepFreeze} from '@/domain/portfolio/transaction';
import {check} from './validation';
const one=decimal('1'),zero=decimal('0');
const mul=(a:string,b:string)=>decimal(a).proportional(decimal(b),one);
export function afterTaxCommonAdjustment(input:{parentNpat:string;reportedCommon:string;printedFund:string;pretaxAdjustment:string;taxRate:string;fundPolicy:{kind:'RETAIN_PRINTED_ALLOCATION'}|{kind:'REESTIMATE_AS_MODEL_ASSUMPTION';rate:string};sourceRefs:readonly string[]}){
 check(input.sourceRefs.length>0,'NORMALIZATION_SOURCE_REFS_REQUIRED');
 const tax=decimal(input.taxRate);check(!tax.negative&&tax.units<one.units,'EXPLICIT_VALID_TAX_ASSUMPTION_REQUIRED');
 check(decimal(input.parentNpat).sub(decimal(input.printedFund)).eq(decimal(input.reportedCommon)),'REPORTED_COMMON_FUND_BRIDGE_MISMATCH');
 const afterTax=mul(input.pretaxAdjustment,one.sub(tax).toString()),adjusted=decimal(input.parentNpat).add(afterTax);
 let fund=decimal(input.printedFund);
 if(input.fundPolicy.kind==='REESTIMATE_AS_MODEL_ASSUMPTION'){
  const rate=decimal(input.fundPolicy.rate);check(!rate.negative&&rate.units<one.units,'EXPLICIT_VALID_FUND_ASSUMPTION_REQUIRED');
  // An allocation expense is not mechanically generated on negative normalized income.
  check(!adjusted.negative,'NEGATIVE_EARNINGS_NEED_EXPLICIT_FUND_LOSS_POLICY');fund=adjusted.proportional(rate,one);
 }
 return deepFreeze({classification:'ANALYST_NORMALIZATION_ESTIMATE',sourceReportedCommon:input.reportedCommon,afterTaxAdjustment:afterTax.toString(),adjustedParentNpat:adjusted.toString(),modelFund:fund.toString(),modelCommonEarnings:adjusted.sub(fund).toString(),fundPolicy:input.fundPolicy,transactionSpecificTaxProven:false,comprehensiveNormalizationClaimed:false,productionScoringAuthorized:false});
}
export function loanProvisionNormalization(input:{years:readonly {year:number;grossOpeningLoans:string;grossClosingLoans:string;customerLoanProvision:string;sourceRefs:readonly string[]}[];targetYear:number;currentPAndLProvision:string;componentReconciliationVerified:boolean;denominatorDefinitionVerified:boolean}){
 check(input.componentReconciliationVerified&&input.denominatorDefinitionVerified,'MATCHED_LOAN_PROVISION_NUMERATOR_AND_DENOMINATOR_REQUIRED');
 check(input.years.length>=3&&new Set(input.years.map(y=>y.year)).size===input.years.length,'MINIMUM_THREE_UNIQUE_ANNUAL_CREDIT_OBSERVATIONS');
 const sorted=[...input.years].sort((a,b)=>a.year-b.year);let sumLoans=zero,sumProvision=zero;
 const terms=sorted.map((y,i)=>{
  check(y.sourceRefs.length>0&&decimal(y.grossOpeningLoans).positive&&decimal(y.grossClosingLoans).positive&&!decimal(y.customerLoanProvision).negative,'SOURCED_LOAN_BALANCES_AND_PROVISION_REQUIRED');
  if(i){check(y.year===sorted[i-1].year+1&&y.grossOpeningLoans===sorted[i-1].grossClosingLoans,'CONTIGUOUS_COMPARABLE_LOAN_BALANCES_REQUIRED');}
  const average=decimal(y.grossOpeningLoans).add(decimal(y.grossClosingLoans)).div(decimal('2'));
  sumLoans=sumLoans.add(average);sumProvision=sumProvision.add(decimal(y.customerLoanProvision));
  return {...y,averageLoans:average.toString(),reportedLoanProvisionRate:decimal(y.customerLoanProvision).div(average).toString()};
 });
 const target=terms.find(t=>t.year===input.targetYear);check(target,'TARGET_YEAR_NOT_IN_REVIEWED_CREDIT_WINDOW');
 const rate=sumProvision.div(sumLoans),provision=decimal(target.averageLoans).proportional(rate,one);
 const residual=decimal(input.currentPAndLProvision).sub(decimal(target.customerLoanProvision));
 return deepFreeze({classification:'HISTORICAL_RATE_NORMALIZATION_ASSUMPTION',method:'SUM_CUSTOMER_LOAN_PROVISIONS_DIV_SUM_ANNUAL_AVERAGE_CUSTOMER_LOANS',terms,weightedRate:rate.toString(),targetLoanProvision:provision.toString(),currentNonLoanResidual:residual.toString(),modelTotalProvision:provision.add(residual).toString(),pretaxProfitAdjustment:decimal(target.customerLoanProvision).sub(provision).toString(),fullCreditCycleProven:false,forwardAssetQualityProven:false,productionScoringAuthorized:false});
}
/** Positive cost magnitudes; this is a reported group cash bridge, never automatically FCFE. */
export function postAcquisitionCash(cfo:string,spending:string){
 check(!decimal(spending).negative,'CASH_ACQUISITION_SPENDING_MAGNITUDE_REQUIRED');
 return deepFreeze({cfo,cashAcquisitionSpending:spending,reportedPostAcquisitionCash:decimal(cfo).sub(decimal(spending)).toString(),scope:'AS_REPORTED_GROUP_BEFORE_COMMON_CLAIM_AND_REINVESTMENT_NORMALIZATION',normalizedOwnerFcfe:false});
}
export function ownerCashForecast(input:{normalizedCommonEarnings:string;depreciation:string;maintenanceCapex:string;reinvestmentReserve:string;growthRates:readonly string[];returnOnIncrementalEquity:string;terminalGrowth:string;assumptionRefs:readonly string[]}){
 check(input.assumptionRefs.length>0&&input.growthRates.length>=2,'EXPLICIT_SOURCED_FORECAST_ASSUMPTIONS_REQUIRED');
 const roi=decimal(input.returnOnIncrementalEquity),terminal=decimal(input.terminalGrowth);check(roi.positive&&!terminal.negative,'POSITIVE_INCREMENTAL_RETURN_AND_NONNEGATIVE_TERMINAL_GROWTH_REQUIRED');
 check(input.growthRates.at(-1)===input.terminalGrowth,'TERMINAL_GROWTH_AND_REINVESTMENT_TRANSITION_REQUIRED');
 check(!decimal(input.depreciation).negative&&!decimal(input.maintenanceCapex).negative&&!decimal(input.reinvestmentReserve).negative,'NONNEGATIVE_EXPLICIT_CASH_COSTS_REQUIRED');
 let earnings=decimal(input.normalizedCommonEarnings),da=decimal(input.depreciation),capex=decimal(input.maintenanceCapex),reserve=decimal(input.reinvestmentReserve);check(earnings.positive,'POSITIVE_COMMON_EARNINGS_BASE_REQUIRED');
 const years=input.growthRates.map((value,i)=>{
  const growth=decimal(value);check(!growth.negative&&growth.units<roi.units,'GROWTH_REQUIRES_INTERNAL_FUNDING_AT_EXPLICIT_INCREMENTAL_RETURN');
  earnings=earnings.proportional(one.add(growth),one);da=da.proportional(one.add(growth),one);capex=capex.proportional(one.add(growth),one);reserve=reserve.proportional(one.add(growth),one);
  const growthBudget=earnings.proportional(growth.div(roi),one),investment=growthBudget.units>reserve.units?growthBudget:reserve;
  // The larger budget includes the standing WC/subsidiary reserve, not both added twice.
  const cash=earnings.add(da).sub(capex).sub(investment);
  return {year:i+1,growth:growth.toString(),commonEarnings:earnings.toString(),depreciation:da.toString(),maintenanceCapex:capex.toString(),growthFundingRequired:growthBudget.toString(),standingReinvestmentReserve:reserve.toString(),totalReinvestment:investment.toString(),forecastOwnerCash:cash.toString()};
 });
 return deepFreeze({classification:'CONDITIONAL_ANALYST_OWNER_CASH_FORECAST',years,cashflows:years.map(y=>y.forecastOwnerCash),terminalGrowth:input.terminalGrowth,externalEquityAndIncrementalBorrowingAssumed:'0',cashAndSubsidiaryValuesAddedSeparately:false,productionScoringAuthorized:false});
}
/** Annual end-period cashflow IRR; requires a standard one-outflow positive-payoff profile. */
export function positivePayoffIrr(purchasePrice:string,annualPayoffs:readonly string[]){
 const price=decimal(purchasePrice);check(price.positive&&annualPayoffs.length>0&&annualPayoffs.length<=20,'POSITIVE_PRICE_AND_BOUNDED_ANNUAL_PAYOFFS_REQUIRED');
 check(annualPayoffs.every(v=>!decimal(v).negative)&&annualPayoffs.some(v=>decimal(v).positive),'STANDARD_POSITIVE_PAYOFF_PROFILE_REQUIRED');
 const npv=(r:ReturnType<typeof decimal>)=>{let factor=one,total=zero;for(const c of annualPayoffs){factor=factor.proportional(one.add(r),one);check(factor.positive,'DISCOUNT_FACTOR_PRECISION_UNDERFLOW');total=total.add(decimal(c).div(factor));}return total.sub(price);};
 let lo=decimal('-0.5'),hi=decimal('10');check(!npv(lo).negative&&npv(hi).negative,'IRR_OUTSIDE_DECLARED_BRACKET');
 for(let i=0;i<80&&hi.sub(lo).units>1n;i++){const mid=lo.add(hi).div(decimal('2'));if(npv(mid).negative)hi=mid;else lo=mid;}
 return deepFreeze({annualIrr:lo.add(hi).div(decimal('2')).toString(),classification:'CONDITIONAL_MODEL_IRR_NOT_GUARANTEED_RETURN',periodConvention:'ANNUAL_END_OF_PERIOD',productionScoringAuthorized:false});
}
