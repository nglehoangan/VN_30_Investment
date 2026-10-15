import {decimal} from '@/domain/portfolio/values';
import {deepFreeze} from '@/domain/portfolio/transaction';
/** Source-row qualification for the existing registry; no new canonical metrics or M3 requirements. */
export interface RealEstateRow {
 readonly ticker:string;readonly metric:string;readonly value:string|null;readonly sourceValue:string|null;
 readonly sourceCategory:string;readonly scope:string;readonly currency:string;readonly unit:string;
 readonly frame:'INSTANT'|'ANNUAL'|'YTD'|'QUARTER';readonly start:string;readonly end:string;
 readonly sourceHash:string;readonly locator:string;readonly sourceUnitMultiplier:'1'|'1000000';
 readonly zeroVerified:boolean;
}
const categories:Readonly<Record<string,string>>={INVENTORY:'REPORTED_INVENTORY_TOTAL',REVENUE:'REPORTED_CONSOLIDATED_REVENUE',TOTAL_ASSETS:'REPORTED_CONSOLIDATED_TOTAL_ASSETS',TOTAL_EQUITY:'REPORTED_CONSOLIDATED_TOTAL_EQUITY',CASH_AND_EQUIVALENTS:'REPORTED_CASH_AND_EQUIVALENTS',CFO:'REPORTED_OPERATING_CASH_FLOW',CASH_CAPEX_REPORTED:'REPORTED_FIXED_ASSET_CASH_PAYMENTS',SHORT_TERM_FINANCIAL_BORROWINGS:'REPORTED_SHORT_BORROWING_CAPTION',LONG_TERM_FINANCIAL_BORROWINGS:'REPORTED_NONCURRENT_BORROWING_CAPTION',CURRENT_ASSETS:'REPORTED_CURRENT_ASSETS',CURRENT_LIABILITIES:'REPORTED_CURRENT_LIABILITIES',RECEIVABLES:'REPORTED_RECEIVABLES',NET_INCOME:'REPORTED_CONSOLIDATED_NET_INCOME',NET_INCOME_ATTRIBUTABLE_PARENT:'REPORTED_PARENT_ATTRIBUTABLE_EARNINGS',OPERATING_PROFIT:'REPORTED_OPERATING_PROFIT',BASIC_EPS:'REPORTED_BASIC_EPS'};
const unavailable=(reason:string)=>deepFreeze({status:'UNAVAILABLE' as const,value:null,reason});
export function realEstateRowCategory(metric:string){return categories[metric]??null;}
export function qualifyRealEstateRow(ticker:string,metric:string,target:{start:string;end:string;frame:RealEstateRow['frame']},row:RealEstateRow){
 if(row.value===null||row.sourceValue===null)return unavailable('MISSING_SOURCE_IS_NOT_ZERO');
 if(row.ticker!==ticker||row.metric!==metric||row.scope!=='CONSOLIDATED'||row.currency!=='VND'||row.unit!==(metric==='BASIC_EPS'?'CURRENCY_PER_SHARE':'CURRENCY')||!/^[a-f0-9]{64}$/.test(row.sourceHash)||!row.locator)return unavailable('TICKER_SCOPE_UNIT_OR_PROVENANCE_MISMATCH');
 if(!categories[metric]||row.sourceCategory!==categories[metric])return unavailable('ACCOUNTING_POPULATION_MISMATCH');
 if(row.frame!==target.frame||row.start!==target.start||row.end!==target.end)return unavailable('EXACT_FRAME_REQUIRED_NO_ANNUALIZATION');
 try{const source=decimal(row.sourceValue),expected=source.mul(decimal(row.sourceUnitMultiplier));const value=metric==='CASH_CAPEX_REPORTED'?(source.positive?null:expected.neg()):expected;if(value===null||value.toString()!==decimal(row.value).toString()||value.isZero&&!row.zeroVerified)return unavailable('SOURCE_VALUE_OR_ZERO_QUALIFICATION_MISMATCH');return deepFreeze({status:'AVAILABLE' as const,value:row.value,reason:null});}catch{return unavailable('INVALID_SOURCE_VALUE');}
}
export function realEstateFinancingComponent(row:{category:string;explicitFinancing:boolean;amount:string|null;measurementBasis:string;sourceHash:string;locator:string}){
 if(!['BANK_BORROWING','BOND','FINANCE_LEASE','RELATED_PARTY_FINANCING','OTHER_IDENTIFIED_FINANCING'].includes(row.category)||!row.explicitFinancing||row.measurementBasis!=='ISSUER_REPORTED_CARRYING_AMOUNT'||row.amount===null||!/^[a-f0-9]{64}$/.test(row.sourceHash)||!row.locator)return unavailable('EXPLICIT_CARRYING_FINANCING_REQUIRED');
 try{if(decimal(row.amount).negative)return unavailable('NEGATIVE_FINANCING');return deepFreeze({status:'AVAILABLE' as const,value:row.amount,reason:null});}catch{return unavailable('INVALID_FINANCING');}
}
export function realEstateLevelOneReadiness(input:{coreMissing:number;sectorCoreMissing:number;materialConflicts:number;criticalIssues:number;currentYtdMissing:boolean;historicalPit:string}){return deepFreeze({levelOneReady:input.coreMissing===0&&input.sectorCoreMissing===0&&input.materialConflicts===0&&input.criticalIssues===0&&!input.currentYtdMissing,historicalPit:input.historicalPit,readyForScoring:false,decisionReady:false});}
