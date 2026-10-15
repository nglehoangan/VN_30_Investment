import {decimal} from '@/domain/portfolio/values';
import {deepFreeze} from '@/domain/portfolio/transaction';
import {instant,dateOnly} from '@/shared/time';
import {requireFundamental} from './validation';
import type {DebtMetadata,DebtDimensionedFact,DebtValidationContext} from './debt-contract';

export const CURRENT_QUALIFICATION_VERSION='hpg-current-decision-grade-qualification-v1';
export type MaterialityVerdict='IMMATERIAL_FOR_CURRENT_ANALYSIS'|'MATERIAL'|'UNRESOLVED_MATERIALITY';
export interface MaterialityReview {
 readonly ticker:string;readonly periodEnd:string;readonly mode:'CURRENT_ANALYSIS';
 readonly verdict:MaterialityVerdict;readonly assessmentScope:string;readonly rationale:string;
 readonly unclassifiedLiabilityAmount:string|null;readonly debtValue:string;readonly sourceHashes:readonly string[];
 readonly reviewedAt:string;readonly evidenceReference:string;readonly evidenceHash:string;readonly bodyHash:string;
}
export interface CommonShareQualification {
 readonly contract:'issuer-ordinary-share-earnings-qualification-v1';readonly ticker:string;
 readonly period:{readonly start:string;readonly end:string};readonly scope:'CONSOLIDATED';readonly currency:'VND';
 readonly definition:'EXPLICIT_ISSUER_ORDINARY_SHARE_EPS_NUMERATOR';readonly ordinaryShareAttributionVerified:true;
 readonly ordinaryProfit:string;readonly parentProfit:string;
 readonly appropriations:readonly {readonly amount:string;readonly classification:string;readonly sourcePage:number}[];
 readonly normalizationStatus:'AS_REPORTED_NOT_NORMALIZED';readonly issuerEstimateCaveat:string;
 readonly sourceHash:string;readonly sourcePage:number;readonly reviewedAt:string;
 readonly evidenceReference:string;readonly evidenceHash:string;readonly bodyHash:string;
}
export interface AnalyticalQualificationWitness {
 readonly role:'UNRESTRICTED_CASH'|'NORMALIZED_EBITDA';readonly ticker:string;readonly value:string;
 readonly period:{readonly start:string;readonly end:string};readonly scope:'CONSOLIDATED';readonly currency:'VND';
 readonly sourceHash:string;readonly reviewedAt:string;readonly evidenceReference:string;readonly evidenceHash:string;
 readonly leasePolicyVersion:string|null;readonly normalizationAdjustments:readonly NormalizationAdjustment[];readonly bodyHash:string;
}
export interface CurrentDefinitionValidationContext extends DebtValidationContext {readonly commonShareReviewWitnesses?:readonly CommonShareQualification[];readonly analyticalQualificationWitnesses?:readonly AnalyticalQualificationWitness[]}
const body=(value:object)=>Object.fromEntries(Object.entries(value).filter(([key])=>key!=='bodyHash'));
const bound=(reference:string,hash:string,c:DebtValidationContext)=>c.sourceBindings.some(b=>b.path===reference&&b.sha256===hash);
/** Only the case-specific current-analysis judgment changes. UNKNOWN amounts and strict population status persist. */
export function applyCurrentMateriality(m:DebtMetadata,r:MaterialityReview,c:DebtValidationContext&{readonly mode:'CURRENT_ANALYSIS'|'HISTORICAL_REPLAY'},hash:(value:unknown)=>string):DebtMetadata {
 instant(r.reviewedAt);dateOnly(r.periodEnd);
 requireFundamental(c.mode==='CURRENT_ANALYSIS'&&r.mode==='CURRENT_ANALYSIS'&&r.ticker===m.ticker&&r.periodEnd===m.periodEnd&&r.reviewedAt<=c.systemKnownAt&&r.assessmentScope.length>0&&r.rationale.length>0,'SCOPED_CURRENT_MATERIALITY_REVIEW');
 requireFundamental(r.bodyHash===hash(body(r))&&bound(r.evidenceReference,r.evidenceHash,c)&&r.sourceHashes.length>0&&r.sourceHashes.every(s=>m.sourceHashes.includes(s)),'RETAINED_MATERIALITY_REVIEW');
 requireFundamental(r.unclassifiedLiabilityAmount===m.uncertainty.unclassifiedLiabilityAmount&&r.debtValue===m.uncertainty.unclassifiedLiabilityRatioToBorrowings?.denominator,'EXACT_REVIEWED_OPAQUE_POPULATION');
 requireFundamental(['IMMATERIAL_FOR_CURRENT_ANALYSIS','MATERIAL','UNRESOLVED_MATERIALITY'].includes(r.verdict),'EXPLICIT_CASE_MATERIALITY_VERDICT');
 const updated={...body(m),reviewedAt:r.reviewedAt,uncertainty:{...m.uncertainty,materialityAssessment:r.verdict==='IMMATERIAL_FOR_CURRENT_ANALYSIS'?'NON_MATERIAL_VERIFIED':r.verdict==='MATERIAL'?'MATERIAL':'UNASSESSED',materialityEvidenceReference:r.evidenceReference}};
 return deepFreeze({...updated,bodyHash:hash(updated)}) as DebtMetadata;
}
export function validCommonShareQualification(f:DebtDimensionedFact&{readonly commonShareQualification?:CommonShareQualification},c:CurrentDefinitionValidationContext,hash:(value:unknown)=>string){try{
 const q=f.commonShareQualification;if(!q)return false;instant(q.reviewedAt);dateOnly(q.period.start);dateOnly(q.period.end);
 requireFundamental(q.contract==='issuer-ordinary-share-earnings-qualification-v1'&&q.definition==='EXPLICIT_ISSUER_ORDINARY_SHARE_EPS_NUMERATOR'&&q.ordinaryShareAttributionVerified&&q.normalizationStatus==='AS_REPORTED_NOT_NORMALIZED','EXPLICIT_ORDINARY_SHARE_DEFINITION');
 requireFundamental(f.itemId==='NET_INCOME_ATTRIBUTABLE_COMMON'&&q.ticker===f.ticker&&q.period.start===f.period.start&&q.period.end===f.period.end&&q.scope===f.scope&&f.scope==='CONSOLIDATED'&&f.unit==='CURRENCY'&&q.currency===f.currency&&f.currency==='VND'&&q.ordinaryProfit===f.value&&q.sourceHash===f.sourceHash,'COMMON_EARNINGS_EXACT_DIMENSIONS');
 requireFundamental(c.commonShareReviewWitnesses?.some(w=>w.bodyHash===q.bodyHash&&w.evidenceReference===q.evidenceReference&&w.evidenceHash===q.evidenceHash&&hash(body(w))===w.bodyHash),'INDEPENDENT_ORDINARY_PROFIT_REVIEW_WITNESS');
 requireFundamental(q.reviewedAt<=c.systemKnownAt&&q.bodyHash===hash(body(q))&&bound(q.evidenceReference,q.evidenceHash,c)&&Number.isInteger(q.sourcePage)&&q.sourcePage>0&&q.issuerEstimateCaveat.length>0,'COMMON_EARNINGS_RETAINED_PROOF');
 requireFundamental(c.statements.some(s=>s.ticker===q.ticker&&s.reportingScope===q.scope&&s.reportingPeriod.end===q.period.end&&s.SHA256===q.sourceHash&&s.verifiedHash===q.sourceHash&&s.reviewStatus==='QUALIFIED'),'COMMON_EARNINGS_QUALIFIED_SOURCE');
 let expenses=decimal('0');for(const a of q.appropriations){requireFundamental(a.classification.length>0&&Number.isInteger(a.sourcePage)&&a.sourcePage>0&&!decimal(a.amount).negative,'ISSUER_APPROPRIATION_TRACE');expenses=expenses.add(decimal(a.amount));}
 requireFundamental(decimal(q.parentProfit).sub(expenses).toString()===q.ordinaryProfit,'ISSUER_ORDINARY_PROFIT_RECONCILIATION');return true;
 }catch{return false;}}
export interface NormalizationAdjustment {
 readonly id:string;readonly reason:string;readonly amount:string;readonly period:{readonly start:string;readonly end:string};
 readonly source:string;readonly classification:'REPORTED_RECONCILIATION'|'ANALYST_NORMALIZATION'|'ASSUMPTION';
 readonly reversibility:'REVERSIBLE'|'NON_REVERSIBLE'|'UNKNOWN';readonly confidence:'HIGH'|'MEDIUM'|'LOW';readonly admitted:boolean;
}
/** The ledger is evidence, never an EBITDA recipe or automatic normalization permission. */
export function validateNormalizationAdjustments(adjustments:readonly NormalizationAdjustment[]){
 requireFundamental(new Set(adjustments.map(a=>a.id)).size===adjustments.length,'UNIQUE_NORMALIZATION_ADJUSTMENTS');
 for(const a of adjustments){dateOnly(a.period.start);dateOnly(a.period.end);decimal(a.amount);requireFundamental(a.reason.length>0&&a.source.length>0&&a.period.start<=a.period.end&&['REPORTED_RECONCILIATION','ANALYST_NORMALIZATION','ASSUMPTION'].includes(a.classification)&&['REVERSIBLE','NON_REVERSIBLE','UNKNOWN'].includes(a.reversibility)&&['HIGH','MEDIUM','LOW'].includes(a.confidence)&&typeof a.admitted==='boolean','EXPLICIT_NORMALIZATION_ADJUSTMENT_TRACE');if(a.admitted)requireFundamental(a.classification==='ANALYST_NORMALIZATION'&&a.confidence!=='LOW'&&a.reversibility!=='UNKNOWN','UNQUALIFIED_NORMALIZATION_NOT_ADMITTED');}
 return deepFreeze([...adjustments]);
}
export const CURRENT_ANALYSIS_SECTIONS=['BusinessQuality','FinancialHealth','Growth','Industry','ValuationInputs','Risk'] as const;
export interface CurrentSectionAssessment {readonly section:typeof CURRENT_ANALYSIS_SECTIONS[number];readonly status:'FULL'|'PARTIAL'|'INSUFFICIENT';readonly evidenceReferences:readonly string[];readonly materialMissing:readonly string[];readonly rationale:string}
export interface CurrentDecisionGradeInput {
 readonly mode:'CURRENT_ANALYSIS';readonly ticker:string;readonly currentStatementAdmitted:boolean;
 readonly CORE:{readonly available:number;readonly required:number};readonly SECTOR_CORE:{readonly available:number;readonly required:number};
 readonly financingMateriality:MaterialityVerdict;readonly qualifiedUnrestrictedCash:boolean;readonly netDebtAvailable:boolean;
 readonly normalizedOrDownsideEbitdaQualified:boolean;readonly leaseCompatible:boolean;
 readonly unresolvedMaterialConflicts:number;readonly sections:readonly CurrentSectionAssessment[];
 readonly historicalReplayReady:boolean;
}
/** Historical eligibility is reported separately and is never used as a current-analysis gate. */
export function evaluateCurrentDecisionGrade(input:CurrentDecisionGradeInput){
 requireFundamental(input.mode==='CURRENT_ANALYSIS'&&input.ticker.length>0&&input.CORE.required>0&&input.SECTOR_CORE.required>0,'EXPLICIT_CURRENT_DECISION_GRADE_SCOPE');
 requireFundamental(input.sections.length===CURRENT_ANALYSIS_SECTIONS.length&&new Set(input.sections.map(s=>s.section)).size===CURRENT_ANALYSIS_SECTIONS.length&&CURRENT_ANALYSIS_SECTIONS.every(id=>input.sections.some(s=>s.section===id)),'ALL_CURRENT_ANALYSIS_SECTIONS_REQUIRED');
 const coreReady=input.currentStatementAdmitted&&input.CORE.available===input.CORE.required&&input.SECTOR_CORE.available===input.SECTOR_CORE.required;
 const blockers=[...input.financingMateriality!=='IMMATERIAL_FOR_CURRENT_ANALYSIS'?['FINANCING_MATERIALITY_NOT_RESOLVED']:[],...!input.qualifiedUnrestrictedCash||!input.netDebtAvailable?['QUALIFIED_CASH_NET_DEBT_UNAVAILABLE']:[],...!input.normalizedOrDownsideEbitdaQualified?['NORMALIZED_DOWNSIDE_EBITDA_UNAVAILABLE']:[],...!input.leaseCompatible?['LEASE_COMPARABILITY_NOT_ESTABLISHED']:[],...input.unresolvedMaterialConflicts>0?['UNRESOLVED_MATERIAL_CONFLICT']:[],...input.sections.flatMap(s=>s.materialMissing.map(m=>s.section+':'+m))];
 const sectionsFull=input.sections.every(s=>s.status==='FULL'&&s.materialMissing.length===0&&s.evidenceReferences.length>0&&s.rationale.length>0);
 const ready=coreReady&&blockers.length===0&&sectionsFull;
 return deepFreeze({mode:'CURRENT_ANALYSIS' as const,ticker:input.ticker,currentAnalysisReady:ready,financialEvidenceStatus:!coreReady?'INSUFFICIENT' as const:ready?'FULL' as const:'PARTIAL' as const,financialConfidence:ready?'HIGH' as const:'LOW' as const,fundamentalScorable:ready,historicalReplayReady:input.historicalReplayReady,historicalPITUsedAsCurrentGate:false,blockers,sections:input.sections,readyForScoring:false,decisionReady:false,DI14Approved:false,DI15Approved:false});
}

/** A declared qualifier cannot overrule the independent reviewed analytical-evidence inventory. */
export function validAnalyticalQualificationWitness(f:DebtDimensionedFact,role:AnalyticalQualificationWitness['role'],c:CurrentDefinitionValidationContext,hash:(value:unknown)=>string){try{
 const q=role==='UNRESTRICTED_CASH'?f.cashQualification:f.ebitdaQualification;if(!q)return false;
 const witness=c.analyticalQualificationWitnesses?.find(w=>w.role===role&&w.ticker===f.ticker&&w.value===f.value&&w.period.start===f.period.start&&w.period.end===f.period.end&&w.scope===f.scope&&w.currency===f.currency&&w.sourceHash===f.sourceHash&&w.evidenceReference===q.evidenceReference&&w.evidenceHash===q.evidenceHash);
 requireFundamental(witness&&witness.bodyHash===hash(body(witness))&&bound(witness.evidenceReference,witness.evidenceHash,c),'INDEPENDENT_ANALYTICAL_QUALIFICATION_WITNESS');
 instant(witness.reviewedAt);requireFundamental(witness.reviewedAt<=c.systemKnownAt,'ANALYTICAL_WITNESS_FUTURE_KNOWLEDGE');
 if(role==='NORMALIZED_EBITDA'){requireFundamental(witness.leasePolicyVersion===f.ebitdaQualification!.leasePolicyVersion,'NORMALIZATION_WITNESS_LEASE_POLICY');validateNormalizationAdjustments(witness.normalizationAdjustments);}else requireFundamental(witness.leasePolicyVersion===null&&witness.normalizationAdjustments.length===0,'CASH_NOT_ANALYST_NORMALIZATION');return true;
 }catch{return false;}}
