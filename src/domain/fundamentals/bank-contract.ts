import {decimal} from '@/domain/portfolio/values';
import {deepFreeze} from '@/domain/portfolio/transaction';

/** Supplementary accounting calculations; does not extend the approved requirement registry. */
export interface BankQuantity {
 readonly id:string;readonly ticker:string;readonly end:string;readonly scope:'CONSOLIDATED'|'STANDALONE';
 readonly population:'CUSTOMER_LOANS'|'CUSTOMER_DEPOSITS'|'EARNING_ASSETS'|'TOTAL_ASSETS'|'OTHER';
 readonly concept:string;readonly value:string|null;readonly sourceHash:string;readonly locator:string;
 readonly start?:string;readonly frame?:'ANNUAL'|'YTD'|'QUARTER'|'INSTANT';
}
const unavailable=(reason:string)=>deepFreeze({status:'UNAVAILABLE' as const,value:null,classification:null,reason,operandIds:[] as string[]});
function compatible(q:readonly BankQuantity[]){return q.length>0&&q.every(x=>x.value!==null&&x.ticker===q[0].ticker&&x.end===q[0].end&&x.scope===q[0].scope&&/^[a-f0-9]{64}$/.test(x.sourceHash)&&x.locator.length>0);}
export function bankNpl(groups:readonly BankQuantity[],gross:BankQuantity){
 if(groups.length!==3||new Set(groups.map(q=>q.concept)).size!==3||!['GROUP_3','GROUP_4','GROUP_5'].every(c=>groups.some(g=>g.concept===c))||!compatible([...groups,gross])||[...groups,gross].some(q=>q.population!=='CUSTOMER_LOANS')||gross.concept!=='GROSS_CUSTOMER_LOANS')return unavailable('NPL_POPULATION_OR_DENOMINATOR_MISMATCH');
 try{if(!decimal(gross.value!).positive||groups.some(g=>decimal(g.value!).negative))return unavailable('INVALID_LOAN_POPULATION');const npl=groups.reduce((s,g)=>s.add(decimal(g.value!)),decimal('0'));if(npl.units>decimal(gross.value!).units)return unavailable('NPL_EXCEEDS_GROSS_LOANS');return deepFreeze({status:'AVAILABLE' as const,value:npl.toString(),ratio:npl.div(decimal(gross.value!)).toString(),classification:'SAFE_DERIVED' as const,reason:null,operandIds:[...groups,gross].map(q=>q.id)});}catch{return unavailable('INVALID_BANK_VALUE');}
}
export function bankRatio(metric:'LLR'|'CASA'|'NIM',numerator:BankQuantity,denominator:BankQuantity){
 if(!compatible([numerator,denominator]))return unavailable('BANK_SCOPE_DATE_OR_SOURCE_MISMATCH');
 const expected=metric==='LLR'?['CUSTOMER_LOAN_ALLOWANCE_GENERAL_PLUS_SPECIFIC','NPL_CUSTOMER_LOANS','CUSTOMER_LOANS']:metric==='CASA'?['CURRENT_AND_SAVINGS_DEPOSITS','TOTAL_CUSTOMER_DEPOSITS','CUSTOMER_DEPOSITS']:['NET_INTEREST_INCOME','AVERAGE_EARNING_ASSETS','EARNING_ASSETS'];
 if(numerator.concept!==expected[0]||denominator.concept!==expected[1]||numerator.population!==expected[2]||denominator.population!==expected[2])return unavailable('BANK_DEFINITION_MISMATCH');
 // No implicit annualization and no total-assets NIM proxy.
 if(metric==='NIM'&&(numerator.frame!=='ANNUAL'||denominator.frame!=='ANNUAL'||numerator.start!==denominator.start))return unavailable('NIM_ANNUAL_WINDOW_AND_EARNING_ASSETS_REQUIRED');
 try{if(!decimal(denominator.value!).positive||decimal(numerator.value!).negative)return unavailable('INVALID_BANK_RATIO_OPERANDS');return deepFreeze({status:'AVAILABLE' as const,value:decimal(numerator.value!).div(decimal(denominator.value!)).toString(),classification:'SAFE_DERIVED' as const,reason:null,operandIds:[numerator.id,denominator.id]});}catch{return unavailable('INVALID_BANK_VALUE');}
}
export function reportedBankCapital(input:{metric:'CAR'|'CET1';value:string|null;method:'REPORTED'|'DERIVED';framework:string;scope:string;end:string;sourceHash:string;locator:string}){
 if(input.value===null)return unavailable('REGULATORY_METRIC_UNAVAILABLE');
 if(input.method!=='REPORTED'||!['TT41_2016_BASEL_II','TT14_2025_STANDARDIZED'].includes(input.framework)||!['CONSOLIDATED','STANDALONE'].includes(input.scope)||!/^\d{4}-\d{2}-\d{2}$/.test(input.end)||!/^[a-f0-9]{64}$/.test(input.sourceHash)||!input.locator)return unavailable('QUALIFIED_REGULATORY_DISCLOSURE_REQUIRED');
 try{if(!decimal(input.value).positive||decimal(input.value).units>decimal('1').units)return unavailable('INVALID_REGULATORY_RATIO');return deepFreeze({status:'AVAILABLE' as const,value:input.value,classification:'REPORTED' as const,reason:null,operandIds:[] as string[]});}catch{return unavailable('INVALID_BANK_VALUE');}
}
export function bankLevelOneReadiness(input:{coreMissing:number;sectorCoreMissing:number;materialConflicts:number;criticalIssues:number;currentYtdMissing:boolean;historicalPit:string}){
 return deepFreeze({levelOneReady:input.coreMissing===0&&input.sectorCoreMissing===0&&input.materialConflicts===0&&input.criticalIssues===0&&!input.currentYtdMissing,historicalPit:input.historicalPit,readyForScoring:false,decisionReady:false});
}
