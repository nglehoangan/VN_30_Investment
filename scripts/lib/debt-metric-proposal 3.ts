/** Dormant review prototype. This module is never imported by src/, app/ or production scoring. */
export const DEBT_PROPOSAL_STATUS='PROPOSED_UNAPPROVED' as const;
export const NON_FINANCIAL_DEBT_SECTORS=['REAL_ESTATE','RETAIL','TECHNOLOGY','INDUSTRIAL','MATERIALS','UTILITIES','ENERGY','CONGLOMERATE'] as const;
export type DebtBasis='ISSUER_REPORTED_CARRYING_AMOUNT'|'ISSUER_VERIFIED_PRINCIPAL';
export interface ProposedOperand {readonly amount:string;readonly verified:boolean;readonly scope:'CONSOLIDATED';readonly periodEnd:string;readonly currency:'VND';readonly sourceHash:string;readonly evidenceReference:string}
export interface ProposedFinancingItem extends Omit<ProposedOperand,'amount'> {readonly measurementBasis:DebtBasis;readonly inclusionEvidenceVerified:boolean;readonly id:string;readonly kind:'BOND'|'FINANCE_LEASE'|'SECTOR_APPLICABLE_LEASE'|'OTHER_INTEREST_BEARING_FINANCING';readonly amount:string|null;readonly verified:boolean;readonly identifiedAsFinancing:boolean;readonly applicable:boolean;readonly alreadyIncludedIn:'SHORT'|'LONG'|null;readonly evidenceReference:string}
export interface UnclassifiedLiability {readonly id:string;readonly caption:string;readonly amount:string|null;readonly interestBearing:'UNKNOWN';readonly evidenceReference:string}
export interface ReportedBorrowingsProposalInput {readonly ticker:string;readonly sector:string;readonly periodEnd:string;readonly measurementBasis:DebtBasis;readonly short:ProposedOperand;readonly long:ProposedOperand;readonly currentPortion:ProposedOperand;readonly shortIncludesCurrentPortion:boolean;readonly longIncludesCurrentPortion:boolean;readonly financingSurveyReviewed:boolean;readonly knownFinancingItems:readonly ProposedFinancingItem[];readonly unclassifiedLiabilities:readonly UnclassifiedLiability[];readonly leasePolicy:'INCLUDE_FINANCE_AND_APPLICABLE_SECTOR_LEASE_FINANCING';readonly leaseComparabilityAssessed:boolean}
const amount=(value:string)=>{if(!/^(0|[1-9]\d*)$/.test(value))throw new Error('EXACT_NONNEGATIVE_VND_INTEGER_REQUIRED');return BigInt(value);};
const demand=(condition:boolean,message:string)=>{if(!condition)throw new Error(message);};
/** Calculates only a proposed reported-population scenario; it grants no canonical or scoring admission. */
export function evaluateReportedBorrowingsProposal(input:ReportedBorrowingsProposalInput){
 demand(NON_FINANCIAL_DEBT_SECTORS.some(s=>s===input.sector),'FINANCIAL_SECTOR_CONTRACT_UNCHANGED');
 demand(input.measurementBasis==='ISSUER_REPORTED_CARRYING_AMOUNT'||input.measurementBasis==='ISSUER_VERIFIED_PRINCIPAL','MEASUREMENT_BASIS_REQUIRED');
 demand(input.financingSurveyReviewed,'REPORTED_FINANCING_SURVEY_REQUIRED');
 demand(input.leasePolicy==='INCLUDE_FINANCE_AND_APPLICABLE_SECTOR_LEASE_FINANCING'&&input.leaseComparabilityAssessed,'LEASE_POLICY_REVIEW_REQUIRED');
 for(const o of [input.short,input.long,input.currentPortion]){demand(o.verified&&o.scope==='CONSOLIDATED'&&o.periodEnd===input.periodEnd&&o.currency==='VND'&&/^[a-f0-9]{64}$/.test(o.sourceHash)&&o.evidenceReference.length>0,'QUALIFIED_SAME_DIMENSION_ISSUER_OPERANDS_REQUIRED');amount(o.amount);}
 demand(new Set(input.knownFinancingItems.map(i=>i.id)).size===input.knownFinancingItems.length,'UNIQUE_IDENTIFIED_FINANCING_ITEMS_REQUIRED');
 const short=amount(input.short.amount),long=amount(input.long.amount),current=amount(input.currentPortion.amount);
 if(input.shortIncludesCurrentPortion)demand(current<=short,'CURRENT_PORTION_EXCEEDS_SHORT');if(input.longIncludesCurrentPortion)demand(current<=long,'CURRENT_PORTION_EXCEEDS_GROSS_LONG');
 const addCurrent=input.shortIncludesCurrentPortion?0n:current,subtractCurrent=input.longIncludesCurrentPortion?current:0n;
 let additions=0n;
 for(const i of input.knownFinancingItems){demand(i.identifiedAsFinancing&&i.evidenceReference.length>0,'EXPLICIT_FINANCING_IDENTIFICATION_REQUIRED');if(!i.applicable){demand(i.kind==='SECTOR_APPLICABLE_LEASE','KNOWN_INTEREST_BEARING_FINANCING_CANNOT_BE_EXCLUDED');continue;}demand(i.verified&&i.amount!==null,'KNOWN_FINANCING_ITEM_NOT_VERIFIED');demand(i.scope==='CONSOLIDATED'&&i.periodEnd===input.periodEnd&&i.currency==='VND'&&i.measurementBasis===input.measurementBasis&&/^[a-f0-9]{64}$/.test(i.sourceHash),'FINANCING_ITEM_DIMENSION_OR_BASIS_MISMATCH');demand(i.inclusionEvidenceVerified,'FINANCING_OVERLAP_EVIDENCE_REQUIRED');amount(i.amount!);if(i.alreadyIncludedIn===null)additions+=amount(i.amount!);else demand(amount(i.amount!)<=(i.alreadyIncludedIn==='SHORT'?short:long),'CLAIMED_EMBEDDED_FINANCING_EXCEEDS_CAPTION');}
 const value=short+addCurrent+long-subtractCurrent+additions;
 let unclassified=0n,unknownAmounts=0;
 for(const u of input.unclassifiedLiabilities){demand(u.interestBearing==='UNKNOWN'&&u.evidenceReference.length>0,'UNCLASSIFIED_LIABILITY_EVIDENCE_REQUIRED');if(u.amount===null)unknownAmounts++;else unclassified+=amount(u.amount);}
 return {proposalStatus:DEBT_PROPOSAL_STATUS,ticker:input.ticker,periodEnd:input.periodEnd,metricId:'REPORTED_BORROWINGS',measurementBasis:input.measurementBasis,scenarioValue:value.toString(),formulaVersion:'reported-borrowings-proposed-v1',formula:'short + current_not_in_short + long - current_in_gross_long + separately_identified_qualifying_financing_not_already_included',formulaTerms:{short:short.toString(),currentNotInShort:addCurrent.toString(),long:long.toString(),currentInGrossLong:subtractCurrent.toString(),separateAdditions:additions.toString()},knownFinancingItems:input.knownFinancingItems,uncertainty:{debtPopulationStatus:input.knownFinancingItems.some(i=>i.applicable&&i.alreadyIncludedIn===null)?'REPORTED_PLUS_IDENTIFIED_ADDITIONS':'REPORTED_COMPLETE',comprehensivePopulationStatus:'COMPREHENSIVE_UNVERIFIED',unclassifiedLiabilities:input.unclassifiedLiabilities,unclassifiedLiabilityAmount:unknownAmounts?null:unclassified.toString(),knownUnclassifiedLiabilityAmount:unclassified.toString(),unquantifiedComponentCount:unknownAmounts,unclassifiedLiabilityRatioToBorrowings:unknownAmounts||value===0n?null:{numerator:unclassified.toString(),denominator:value.toString()},ratioDoesNotBoundUnreportedDebt:true,materialityAssessment:'UNASSESSED_NO_APPROVED_THRESHOLD'},COMPREHENSIVE_FINANCIAL_DEBT:null,FINANCIAL_DEBT:null,wouldClassifyAs:'SAFE_DERIVED',canonicalAdmission:false,approvedBaselineAvailable:false,readyForScoring:false};
}
export interface ProposedDebtSelection {readonly ticker:string;readonly currency:'VND';readonly leasePolicyVersion:string;readonly metricId:'REPORTED_BORROWINGS'|'COMPREHENSIVE_FINANCIAL_DEBT';readonly value:string;readonly measurementBasis:DebtBasis;readonly scope:'CONSOLIDATED';readonly periodEnd:string;readonly verified:boolean;readonly completePopulationVerified:boolean}
/** Preference is valid only after compatible measurement/scope/end; a mixed basis is not silently interchangeable. */
export function selectProposedDebtBasis(candidates:readonly ProposedDebtSelection[],context:{readonly measurementBasis:DebtBasis;readonly periodEnd:string;readonly ticker:string;readonly leasePolicyVersion:string}){
 const eligible=candidates.filter(c=>c.verified&&c.ticker===context.ticker&&c.currency==='VND'&&c.leasePolicyVersion===context.leasePolicyVersion&&c.measurementBasis===context.measurementBasis&&c.scope==='CONSOLIDATED'&&c.periodEnd===context.periodEnd&&(c.metricId!=='COMPREHENSIVE_FINANCIAL_DEBT'||c.completePopulationVerified));
 for(const id of ['REPORTED_BORROWINGS','COMPREHENSIVE_FINANCIAL_DEBT']){const values=new Set(eligible.filter(c=>c.metricId===id).map(c=>amount(c.value).toString()));demand(values.size<=1,'DEBT_SELECTION_CONFLICT');}
 const strict=eligible.find(c=>c.metricId==='COMPREHENSIVE_FINANCIAL_DEBT'),reported=eligible.find(c=>c.metricId==='REPORTED_BORROWINGS');
 if(strict&&reported)demand(amount(strict.value)>=amount(reported.value),'COMPREHENSIVE_REPORTED_POPULATION_RECONCILIATION_REQUIRED');
 return {proposalStatus:DEBT_PROPOSAL_STATUS,selection:strict??reported??null,canonicalAdmission:false,readyForScoring:false};
}

export function validateProposedDebtSeries(candidates:readonly ProposedDebtSelection[]){
 demand(new Set(candidates.map(c=>c.ticker+'|'+c.currency+'|'+c.leasePolicyVersion)).size<=1,'SERIES_IDENTITY_OR_LEASE_POLICY_CHANGED');
 demand(new Set(candidates.map(c=>c.measurementBasis)).size<=1,'SERIES_MEASUREMENT_BASIS_CHANGED');
 demand(new Set(candidates.map(c=>c.metricId)).size<=1,'SERIES_POPULATION_COMPARABILITY_REVIEW_REQUIRED');
 return {proposalStatus:DEBT_PROPOSAL_STATUS,seriesComparable:true,readyForScoring:false};
}
