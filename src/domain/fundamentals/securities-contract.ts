import {decimal} from '@/domain/portfolio/values';
import {deepFreeze} from '@/domain/portfolio/transaction';
export interface SecuritiesEvidence {
 readonly concept:string; readonly value:string|null; readonly frame:'INSTANT'|'ANNUAL'|'YTD'|'QUARTER';
 readonly scope:string; readonly start:string; readonly end:string; readonly sourceHash:string; readonly locator:string;
 readonly components:readonly {concept:string;value:string|null}[];
}
const unavailable=(reason:string)=>deepFreeze({status:'UNAVAILABLE' as const,value:null,reason});
/** No label-based inference, receivable aggregation, or missing-value substitution. */
export function securitiesQuantity(metric:'MARGIN_LOANS'|'FVTPL_ASSETS'|'FVTPL_TOTAL_EARNINGS'|'PROPRIETARY_TRADING_PROFIT'|'REGULATORY_SAFETY_RATIO',e:SecuritiesEvidence){
 if(e.value===null)return unavailable('MISSING_SECURITIES_VALUE');
 if(!/^[a-f0-9]{64}$/.test(e.sourceHash)||!e.locator||!['CONSOLIDATED','STANDALONE'].includes(e.scope))return unavailable('QUALIFIED_SECURITIES_SOURCE_REQUIRED');
 if(e.concept!==metric)return unavailable('SECURITIES_DEFINITION_MISMATCH');
 if(['MARGIN_LOANS','FVTPL_ASSETS','REGULATORY_SAFETY_RATIO'].includes(metric)&&(e.frame!=='INSTANT'||e.start!==e.end))return unavailable('PERIOD_END_STOCK_REQUIRED');
 if(metric==='MARGIN_LOANS'&&(e.components.length!==1||e.components[0].concept!=='MARGIN_LOANS'||e.components[0].value!==e.value))return unavailable('MARGIN_LOANS_EXCLUDE_ADVANCES_AND_OTHER_RECEIVABLES');
 // Neither a realized gain nor an asset balance establishes total earnings or normalized trading profit.
 if(['FVTPL_TOTAL_EARNINGS','PROPRIETARY_TRADING_PROFIT'].includes(metric))return unavailable('APPROVED_EARNINGS_RECONSTRUCTION_NOT_QUALIFIED');
 if(metric==='REGULATORY_SAFETY_RATIO')return unavailable('REGULATORY_DISCLOSURE_CONTRACT_NOT_QUALIFIED');
 try{if(decimal(e.value).negative)return unavailable('INVALID_SECURITIES_STOCK');}catch{return unavailable('INVALID_SECURITIES_VALUE');}
 return deepFreeze({status:'AVAILABLE' as const,value:e.value,reason:null});
}
export function securitiesLevelOneReadiness(input:{coreMissing:number;sectorCoreMissing:number;materialConflicts:number;currentYtdMissing:boolean;historicalPit:string}){
 return deepFreeze({levelOneReady:input.coreMissing===0&&input.sectorCoreMissing===0&&input.materialConflicts===0&&!input.currentYtdMissing,historicalPit:input.historicalPit,readyForScoring:false,decisionReady:false});
}
