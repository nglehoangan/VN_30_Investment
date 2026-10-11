/** Frozen M3 input preference. No N/R, score or weight redistribution. */
export const CAPITAL_PREFERENCE_AUTHORITY='Use the most authoritative disclosed regulatory capital ratio available, ideally CET1/common-equity or equivalent plus total CAR.';
export const BANK_CASH_SUBSTITUTE_AUTHORITY='### Bank substitute — BQ-CASH-BANK';
export function metricInputs(metric,sector,disclosedCurrentItems,authorityText){
 const original=metric.canonicalInputsBySector?.[sector]??metric.canonicalInputs;
 if(metric.metricId==='BQ-CASH-03'&&sector==='BANK'){
  if(!authorityText.includes(BANK_CASH_SUBSTITUTE_AUTHORITY)||!authorityText.includes('accrued interest quality;')||!authorityText.includes('off-balance-sheet risk where material.'))throw Error('FROZEN_BANK_CASH_SUBSTITUTE_AUTHORITY_REQUIRED');
  return {required:[],preferred:[],substitute:{metricId:'BQ-CASH-BANK',status:'REQUIRED_REVIEWED_BANK_EARNINGS_QUALITY_CONTEXT',requiredEvidence:['NPL recognition quality','provisioning coverage','credit-cost adequacy','accrued interest quality','fee-income recurrence','off-balance-sheet risk where material'],treatment:'NO_AUTOMATIC_SATISFACTION_NO_N_R_NO_SCORE_NO_WEIGHT_REDISTRIBUTION'}};
 }
 if(metric.metricId!=='FH-BS-BANK-01'||sector!=='BANK')return {required:[...original],preferred:[]};
 if(!authorityText.includes(CAPITAL_PREFERENCE_AUTHORITY)||!original.includes('BANK_REPORTED_CAR'))throw Error('FROZEN_CAPITAL_PREFERENCE_AUTHORITY_REQUIRED');
 const disclosed=disclosedCurrentItems.has('BANK_REPORTED_CET1');
 return {required:original.filter(id=>id!=='BANK_REPORTED_CET1'||disclosed),preferred:[{itemId:'BANK_REPORTED_CET1',status:disclosed?'DISCLOSED_REQUIRED_VERIFICATION':'PREFERRED_EVIDENCE_NOT_ESTABLISHED',treatment:'NO_ZERO_NO_N_R_NO_SCORE_NO_WEIGHT_REDISTRIBUTION; TOTAL_CAR_REMAINS_REQUIRED'}]};
}
