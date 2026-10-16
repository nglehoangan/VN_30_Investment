import {bankNpl, bankRatio, reportedBankCapital, type BankQuantity} from './bank-contract';
import {decimal} from '@/domain/portfolio/values';

/** A receipt is a transcription of an issuer table, never a provider-derived population. */
export interface BankLoanReceipt {
 readonly ticker:string; readonly end:string; readonly scope:'CONSOLIDATED'|'STANDALONE';
 readonly sourceHash:string; readonly currency:'VND'; readonly unitBasis:'MILLION_CURRENCY';
 readonly loanQuality:{readonly sourceHash?:string;readonly page:number;readonly column:string;readonly group3Million:string;readonly group4Million:string;readonly group5Million:string;readonly grossMillion:string;readonly classificationBasis:string};
 readonly allowance:{readonly sourceHash?:string;readonly page:number;readonly column:string;readonly generalMillion:string;readonly specificMillion:string;readonly separatelyExcludedMillion:string;readonly balanceSheetAllowanceMillion:string;readonly population:string};
}
const integer=(s:string)=>/^\d+$/.test(s);
const vnd=(s:string)=>decimal(s).mul(decimal('1000000')).toString();
export function qualifyBankLoanReceipt(r:BankLoanReceipt) {
 const a=r.allowance,q=r.loanQuality;
 if(!r.ticker||!/^\d{4}-\d{2}-\d{2}$/.test(r.end)||!['CONSOLIDATED','STANDALONE'].includes(r.scope)||!/^[a-f0-9]{64}$/.test(r.sourceHash)||r.currency!=='VND'||r.unitBasis!=='MILLION_CURRENCY'||a.population!=='CUSTOMER_LOANS'||!Number.isInteger(q.page)||q.page<1||!Number.isInteger(a.page)||a.page<1||!q.column||!a.column||!q.classificationBasis||![q.group3Million,q.group4Million,q.group5Million,q.grossMillion,a.generalMillion,a.specificMillion,a.separatelyExcludedMillion,a.balanceSheetAllowanceMillion].every(integer))throw new Error('QUALIFIED_BANK_RECEIPT_DIMENSIONS_REQUIRED');
 const allowance=decimal(a.generalMillion).add(decimal(a.specificMillion));
 if(!allowance.add(decimal(a.separatelyExcludedMillion)).eq(decimal(a.balanceSheetAllowanceMillion)))throw new Error('CUSTOMER_ALLOWANCE_BRIDGE_DOES_NOT_RECONCILE');
 const quantity=(concept:string,value:string,page:number,sourceHash=r.sourceHash):BankQuantity=>({id:[r.ticker,r.end,concept,sourceHash,page].join(':'),ticker:r.ticker,end:r.end,scope:r.scope,population:'CUSTOMER_LOANS',concept,value,sourceHash,locator:`PDF page ${page}; ${page===q.page?q.column:a.column}`,frame:'INSTANT'});
 const groups=[q.group3Million,q.group4Million,q.group5Million].map((v,i)=>quantity('GROUP_'+(i+3),vnd(v),q.page,q.sourceHash??r.sourceHash));
 const gross=quantity('GROSS_CUSTOMER_LOANS',vnd(q.grossMillion),q.page,q.sourceHash??r.sourceHash);
 const npl=bankNpl(groups,gross);
 if(npl.status!=='AVAILABLE')throw new Error(npl.reason??'NPL_NOT_QUALIFIED');
 const approvedAllowance=quantity('CUSTOMER_LOAN_ALLOWANCE_GENERAL_PLUS_SPECIFIC',vnd(allowance.toString()),a.page,a.sourceHash??r.sourceHash);
 const llr=bankRatio('LLR',approvedAllowance,quantity('NPL_CUSTOMER_LOANS',npl.value,q.page,q.sourceHash??r.sourceHash));
 if(llr.status!=='AVAILABLE')throw new Error(llr.reason??'LLR_NOT_QUALIFIED');
 return {groups,gross,npl,approvedAllowance,llr,general:vnd(a.generalMillion),specific:vnd(a.specificMillion),separatelyExcluded:vnd(a.separatelyExcludedMillion),balanceSheetAllowance:vnd(a.balanceSheetAllowanceMillion)};
}
export function qualifyBankCapitalIdentity(r:{metric:'CAR'|'CET1';identity:'CAR'|'TIER_1'|'CET1';value:string|null;method:'REPORTED'|'DERIVED';framework:string;scope:string;end:string;sourceHash:string;locator:string}) {
 if(r.metric!==r.identity)throw new Error('REGULATORY_RATIO_IDENTITY_MISMATCH');
 return reportedBankCapital(r);
}
export const BANK_GAP_CLASSES=['EXTRACTION_NOT_YET_PERFORMED','SOURCE_NOT_YET_ACQUIRED','DEFINITION_NOT_YET_QUALIFIED','TRUE_DATA_INTEGRITY_CONFLICT','SOURCE_UNAVAILABLE_AFTER_REASONABLE_SEARCH','ANALYTICAL_ONLY_GAP'] as const;
export function bankGapIsMajor(classification:typeof BANK_GAP_CLASSES[number],material:boolean){
 return material&&(classification==='TRUE_DATA_INTEGRITY_CONFLICT'||classification==='SOURCE_UNAVAILABLE_AFTER_REASONABLE_SEARCH');
}
