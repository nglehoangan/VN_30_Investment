import {securitiesQuantity} from './securities-contract';

export interface TcxAccountingRow {
 readonly ticker:string; readonly metric:string; readonly concept:string; readonly value:string|null;
 readonly start:string; readonly end:string; readonly frame:'INSTANT'|'ANNUAL'|'YTD'|'QUARTER';
 readonly scope:string; readonly unit:string; readonly currency:string; readonly basis:string;
 readonly source:{ticker:string;hash:string;path:string;scope:string;end:string;audit:string;locator:string;identityVerified:boolean};
 readonly components:readonly {id:string;concept:string;value:string;basis:string}[];
 readonly populationComplete:boolean;
}
const concepts:Readonly<Record<string,string>>={TOTAL_ASSETS:'TOTAL_ASSETS',TOTAL_EQUITY:'TOTAL_EQUITY',NET_INCOME:'TOTAL_NET_INCOME',CASH_AND_EQUIVALENTS:'COMPANY_ACCOUNTING_CASH',SECURITIES_MARGIN_LOANS:'MARGIN_LOANS',FINANCIAL_DEBT:'INTEREST_BEARING_FINANCING',CURRENT_ASSETS:'CURRENT_ASSETS',CURRENT_LIABILITIES:'CURRENT_LIABILITIES',BASIC_EPS:'AS_REPORTED_EPS'};
/** TCX review boundary; shared approved accounting metrics and denominators are unchanged. */
export function qualifyTcxAccountingRow(metric:string,target:{start:string;end:string;frame:string},r:TcxAccountingRow){
 const no=(reason:string)=>({status:'UNAVAILABLE' as const,value:null,reason});
 const s=r.source;
 if(r.ticker!=='TCX'||s.ticker!=='TCX'||!s.path.startsWith('data/manual-fundamentals/TCX/')||!s.identityVerified||!/^[a-f0-9]{64}$/.test(s.hash)||!s.locator||!['AUDITED','REVIEWED'].includes(s.audit))return no('TCX_ISSUER_PROVENANCE_REQUIRED');
 if(!concepts[metric]||r.metric!==metric||r.concept!==concepts[metric])return no('APPROVED_EXACT_CONCEPT_REQUIRED');
 if(r.scope!=='STANDALONE'||s.scope!==r.scope||s.end<r.end)return no('TCX_QUALIFIED_ISSUER_PERIMETER_REQUIRED');
 if(r.end!==target.end||r.start!==target.start||r.frame!==target.frame)return no('EXACT_PERIOD_FRAME_REQUIRED');
 if(r.unit!==(metric==='BASIC_EPS'?'CURRENCY_PER_SHARE':'CURRENCY')||r.currency!=='VND'||r.value===null||! /^-?\d+(\.\d+)?$/.test(r.value))return no('EXPLICIT_VND_VALUE_REQUIRED');
 if(!r.populationComplete)return no('POPULATION_UNRESOLVED');
 if(metric==='SECURITIES_MARGIN_LOANS'){
  const q=securitiesQuantity('MARGIN_LOANS',{concept:r.concept,value:r.value,frame:r.frame,start:r.start,end:r.end,scope:r.scope,sourceHash:s.hash,locator:s.locator,components:r.components.map(c=>({concept:c.concept,value:c.value}))});
  if(q.status!=='AVAILABLE')return no(q.reason!);
 }
 if(metric==='CASH_AND_EQUIVALENTS'&&(r.components.length!==1||r.components[0].concept!=='COMPANY_ACCOUNTING_CASH'||r.components[0].value!==r.value))return no('CUSTOMER_MONEY_EXCLUDED');
 if(metric==='FINANCIAL_DEBT'){
  if(r.basis!=='ISSUER_REPORTED_CARRYING_AMOUNT'||!r.components.length||new Set(r.components.map(c=>c.id)).size!==r.components.length)return no('UNIQUE_CARRYING_COMPONENTS_REQUIRED');
  if(r.components.some(c=>!['BANK_BORROWING','EXPLICIT_ISAVE_BORROWING','BOND','CONVERTIBLE_LOAN_LIABILITY'].includes(c.concept)||c.basis!=='ISSUER_REPORTED_CARRYING_AMOUNT'||!/^\d+$/.test(c.value)))return no('EXPLICIT_FINANCING_ONLY');
  if(r.components.reduce((n,c)=>n+BigInt(c.value),0n).toString()!==r.value)return no('DEBT_COMPONENT_SUM_MISMATCH');
 }
 if(metric==='BASIC_EPS'&&r.basis!=='AS_REPORTED')return no('NORMALIZED_EPS_NOT_QUALIFIED');
 return {status:'AVAILABLE' as const,value:r.value,reason:null};
}
