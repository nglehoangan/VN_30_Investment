import {decimal} from '@/domain/portfolio/values';
import {deepFreeze} from '@/domain/portfolio/transaction';
/** Qualifies source accounting populations; does not add sector requirements or analytical metrics. */
export interface EnergyAccountingRow {
 readonly ticker:string;readonly metric:string;readonly value:string|null;readonly sourceValue:string|null;
 readonly sourceCategory:string;readonly scope:string;readonly currency:string;readonly unit:string;
 readonly frame:'INSTANT'|'ANNUAL'|'YTD'|'QUARTER';readonly start:string;readonly end:string;
 readonly sourceHash:string;readonly locator:string;readonly sourceUnitMultiplier:'1'|'1000000';readonly zeroVerified:boolean;
 readonly inventory?:{readonly gross:string;readonly provision:string};
}
const categories:Readonly<Record<string,string>>={
 GROSS_PROFIT:'REPORTED_ACCOUNTING_GROSS_PROFIT',TOTAL_ASSETS:'CONSOLIDATED_TOTAL_ASSETS',TOTAL_EQUITY:'CONSOLIDATED_TOTAL_EQUITY',REVENUE:'CONSOLIDATED_NET_ACCOUNTING_REVENUE',
 NET_INCOME:'CONSOLIDATED_NET_INCOME',CFO:'OPERATING_CASH_FLOW',CASH_AND_EQUIVALENTS:'ISSUER_CASH_AND_EQUIVALENTS',
 INVENTORY:'REPORTED_NET_INVENTORY',NET_INCOME_ATTRIBUTABLE_PARENT:'PARENT_ATTRIBUTABLE_EARNINGS',BASIC_EPS:'REPORTED_BASIC_EPS',
 OPERATING_PROFIT:'REPORTED_OPERATING_PROFIT',CASH_CAPEX_REPORTED:'FIXED_ASSET_ACQUISITION_CASH_PAYMENTS',CURRENT_ASSETS:'CURRENT_ASSETS',
 CURRENT_LIABILITIES:'CURRENT_LIABILITIES',RECEIVABLES:'REPORTED_RECEIVABLES',SHORT_TERM_FINANCIAL_BORROWINGS:'SHORT_BORROWING_CAPTION',LONG_TERM_FINANCIAL_BORROWINGS:'NONCURRENT_BORROWING_CAPTION',
};
const unavailable=(reason:string)=>deepFreeze({status:'UNAVAILABLE' as const,value:null,reason});
export const energyAccountingCategory=(metric:string)=>categories[metric]??null;
export function qualifyEnergyAccountingRow(ticker:string,metric:string,target:{start:string;end:string;frame:EnergyAccountingRow['frame']},row:EnergyAccountingRow){
 if(!['GAS','BSR'].includes(ticker))return unavailable('ENERGY_EXECUTION_TICKER_SCOPE');
 if(row.value===null||row.sourceValue===null)return unavailable('MISSING_IS_NOT_ZERO');
 if(row.ticker!==ticker||row.metric!==metric||row.scope!=='CONSOLIDATED'||row.currency!=='VND'||row.unit!==(metric==='BASIC_EPS'?'CURRENCY_PER_SHARE':'CURRENCY')||!/^[a-f0-9]{64}$/.test(row.sourceHash)||!row.locator)return unavailable('TICKER_SCOPE_UNIT_OR_PROVENANCE_MISMATCH');
 if(!categories[metric]||categories[metric]!==row.sourceCategory)return unavailable('ACCOUNTING_POPULATION_MISMATCH');
 if(row.frame!==target.frame||row.start!==target.start||row.end!==target.end)return unavailable('EXACT_FRAME_REQUIRED_NO_ANNUALIZATION');
 if(!['1','1000000'].includes(row.sourceUnitMultiplier))return unavailable('UNQUALIFIED_UNIT_MULTIPLIER');
 try{
  const source=decimal(row.sourceValue),expected=source.mul(decimal(row.sourceUnitMultiplier));
  const value=metric==='CASH_CAPEX_REPORTED'?(source.positive?null:expected.neg()):expected;
  if(value===null||!value.eq(decimal(row.value))||value.isZero&&!row.zeroVerified)return unavailable('SOURCE_VALUE_OR_ZERO_UNQUALIFIED');
  if(metric==='INVENTORY'){
   if(!row.inventory)return unavailable('INVENTORY_PROVISION_RECONCILIATION_REQUIRED');
   const gross=decimal(row.inventory.gross),provision=decimal(row.inventory.provision);
   if(gross.negative||provision.positive||!gross.add(provision).eq(source))return unavailable('NET_INVENTORY_RECONCILIATION_FAILED');
  }
  return deepFreeze({status:'AVAILABLE' as const,value:row.value,reason:null});
 }catch{return unavailable('INVALID_SOURCE_VALUE');}
}
export function qualifyEnergyFinancing(row:{category:string;explicitFinancing:boolean;amount:string|null;measurementBasis:string;sourceHash:string;locator:string}){
 if(!['BANK_BORROWING','BOND','FINANCE_LEASE','RELATED_PARTY_FINANCING','OTHER_IDENTIFIED_FINANCING'].includes(row.category)||!row.explicitFinancing||row.measurementBasis!=='ISSUER_REPORTED_CARRYING_AMOUNT'||row.amount===null||!/^[a-f0-9]{64}$/.test(row.sourceHash)||!row.locator)return unavailable('EXPLICIT_CARRYING_FINANCING_REQUIRED');
 try{return decimal(row.amount).negative?unavailable('NEGATIVE_FINANCING'):deepFreeze({status:'AVAILABLE' as const,value:row.amount,reason:null});}catch{return unavailable('INVALID_FINANCING');}
}
export function energyLevelOneReady(input:{coreMissing:number;sectorCoreMissing:number;materialIssues:number;currentYtdMissing:boolean;historicalPit:string}){
 return input.coreMissing===0&&input.sectorCoreMissing===0&&input.materialIssues===0&&!input.currentYtdMissing;
}
