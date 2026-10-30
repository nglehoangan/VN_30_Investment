/** Owner-authorized AI review v1. Does not amend or impersonate the sealed HUMAN/FORMAL contract. */
import {decimal} from '@/domain/portfolio/values';
import {deepFreeze} from '@/domain/portfolio/transaction';
import {instant} from '@/shared/time';
import {RUBRICS,CATEGORY_MAXIMA,type Sector} from './methodology';
import {check} from './validation';
const one=decimal('1');
const product=(a:string,b:string)=>decimal(a).proportional(decimal(b),one).toString();
export function discountedFlows(cashflows:readonly string[],discountRate:string){
 const r=decimal(discountRate);check(r.positive,'POSITIVE_DISCOUNT_RATE_REQUIRED');
 check(cashflows.length>0&&cashflows.length<=100,'EXPLICIT_FORECAST_HORIZON_REQUIRED');
 let factor=one,pv=decimal('0');const terms=[];
 for(const [i,c] of cashflows.entries()){factor=factor.proportional(one.add(r),one);const discounted=decimal(c).div(factor);pv=pv.add(discounted);terms.push({year:i+1,cashflow:c,discountFactor:factor.toString(),presentValue:discounted.toString()});}
 return {value:pv.toString(),discountFactor:factor.toString(),terms};
}
export function ownerEarningsDcf(input:{sector:Sector;basis:'NORMALIZED_FCFE';qualified:boolean;normalizationRefs:readonly string[];cashflows:readonly string[];discountRate:string;terminalGrowth:string}){
 check(!['BANK','SECURITIES','INSURANCE','REAL_ESTATE'].includes(input.sector),'SECTOR_PRIMARY_MODEL_MISMATCH');
 check(input.basis==='NORMALIZED_FCFE'&&input.qualified&&input.normalizationRefs.length>0,'NORMALIZED_COMMON_OWNER_CASHFLOW_REQUIRED');
 const r=decimal(input.discountRate),g=decimal(input.terminalGrowth);check(r.units>g.units&&!g.negative,'DISCOUNT_MUST_EXCEED_TERMINAL_GROWTH');
 const pv=discountedFlows(input.cashflows,input.discountRate),last=decimal(input.cashflows.at(-1)!);check(last.positive,'POSITIVE_SUSTAINABLE_TERMINAL_CASHFLOW');
 const terminal=last.proportional(one.add(g),one).div(r.sub(g));
 return deepFreeze({model:'OWNER_EARNINGS_DCF',unit:'VND',equityValue:decimal(pv.value).add(terminal.div(decimal(pv.discountFactor))).toString(),forecast:pv.terms,terminalValue:terminal.toString(),productionScoringAuthorized:false});
}
export function residualIncomeValue(input:{sector:Sector;commonEquity:string;commonEquityQualified:boolean;normalizedRoe:readonly string[];roeQualified:boolean;bookGrowth:readonly string[];costOfEquity:string;terminalResidualGrowth:string;sourceRefs:readonly string[]}){
 check(['BANK','SECURITIES','INSURANCE'].includes(input.sector),'SECTOR_PRIMARY_MODEL_MISMATCH');
 check(input.commonEquityQualified&&input.roeQualified&&input.sourceRefs.length>0,'COMMON_EQUITY_AND_NORMALIZED_RETURN_REQUIRED');
 check(input.normalizedRoe.length===input.bookGrowth.length&&input.normalizedRoe.length>0,'MATCHED_EXPLICIT_BOOK_FORECAST_REQUIRED');
 let book=decimal(input.commonEquity);check(book.positive,'POSITIVE_COMMON_EQUITY_REQUIRED');const opening=book,residuals=[],years=[];
 const cost=decimal(input.costOfEquity),g=decimal(input.terminalResidualGrowth);check(cost.positive&&cost.units>g.units&&!g.negative,'DISCOUNT_MUST_EXCEED_TERMINAL_GROWTH');
 for(let i=0;i<input.normalizedRoe.length;i++){
  const roe=decimal(input.normalizedRoe[i]),growth=decimal(input.bookGrowth[i]);check(!growth.negative&&growth.units<=roe.units,'RETAINED_GROWTH_CANNOT_EXCEED_EARNINGS_WITHOUT_CAPITAL_RAISE');
  const earnings=book.proportional(roe,one),retained=book.proportional(growth,one),residual=earnings.sub(book.proportional(cost,one));
  residuals.push(residual.toString());years.push({year:i+1,openingBook:book.toString(),earnings:earnings.toString(),retained:retained.toString(),dividends:earnings.sub(retained).toString(),residual:residual.toString()});book=book.add(retained);
 }
 const pv=discountedFlows(residuals,input.costOfEquity),last=decimal(residuals.at(-1)!);
 const terminal=last.proportional(one.add(g),one).div(cost.sub(g));
 return deepFreeze({model:'RESIDUAL_INCOME',unit:'VND',equityValue:opening.add(decimal(pv.value)).add(terminal.div(decimal(pv.discountFactor))).toString(),years,terminalValue:terminal.toString(),productionScoringAuthorized:false});
}
export function projectRnav(input:{sector:Sector;projects:readonly {id:string;afterTaxCashflows:readonly string[];discountRate:string;equityFraction:string;realizationFactor:string;legalAndCostEvidenceRefs:readonly string[]}[];corporateNetAdjustments:string;corporateAdjustmentsQualified:boolean}){
 check(input.sector==='REAL_ESTATE','SECTOR_PRIMARY_MODEL_MISMATCH');check(input.projects.length>0&&new Set(input.projects.map(p=>p.id)).size===input.projects.length,'UNIQUE_PROJECT_CASHFLOWS_REQUIRED');
 check(input.corporateAdjustmentsQualified,'CORPORATE_DEBT_NCI_AND_LEAKAGE_RECONCILIATION_REQUIRED');let sum=decimal(input.corporateNetAdjustments);const projects=[];
 for(const p of input.projects){
  const fraction=decimal(p.equityFraction),realization=decimal(p.realizationFactor);check(fraction.positive&&fraction.units<=one.units&&!realization.negative&&realization.units<=one.units&&p.legalAndCostEvidenceRefs.length>0,'PROJECT_OWNERSHIP_REALIZABILITY_AND_EVIDENCE_REQUIRED');
  const pv=discountedFlows(p.afterTaxCashflows,p.discountRate),net=product(product(pv.value,p.equityFraction),p.realizationFactor);sum=sum.add(decimal(net));projects.push({id:p.id,grossPresentValue:pv.value,attributableValue:net});
 }
 return deepFreeze({model:'PROJECT_RNAV',unit:'VND',equityValue:sum.toString(),projects,productionScoringAuthorized:false});
}
/** Diagnostic only: capitalizes reported annual common profit. Never labels it normalized intrinsic value. */
export function reportedEarningsSensitivity(commonProfit:string,requiredReturn:string){
 const e=decimal(commonProfit),r=decimal(requiredReturn);check(e.positive&&r.positive,'POSITIVE_EARNINGS_AND_HURDLE_REQUIRED');
 return deepFreeze({model:'REPORTED_EARNINGS_NO_GROWTH_CAPITALIZATION',classification:'ASSUMPTION' as const,unit:'VND',referenceEquityValue:e.div(r).toString(),requiredReturn,sustainableEarningsProven:false,fairValuePerShare:null,primaryValuationQualified:false,productionScoringAuthorized:false});
}
export function perShareReview(value:string,shares:{value:string;kind:'OUTSTANDING_COMMON'|'WEIGHTED_AVERAGE'|'LISTED';actionBridgeVerified:boolean;validThrough:string},asOf:string){
 instant(asOf);instant(shares.validThrough);check(shares.kind==='OUTSTANDING_COMMON'&&shares.actionBridgeVerified&&shares.validThrough>=asOf,'CURRENT_COMMON_SHARE_ACTION_BRIDGE_REQUIRED');
 check(decimal(shares.value).positive&&decimal(shares.value).integer,'POSITIVE_INTEGER_COMMON_SHARES_REQUIRED');return decimal(value).div(decimal(shares.value)).toString();
}
export interface AIReviewEvidence {readonly id:string;readonly knownAt:string;readonly sourceRefs:readonly string[];readonly checked:boolean;readonly supportedTopics:readonly string[];readonly qualification:'SCORING_SUPPORT'|'CONTEXT_ONLY';readonly family:string}
export interface AIReviewAssessment {readonly subcategory:string;readonly source:'AI';readonly actor:'CHATGPT';readonly points:number|null;readonly band:string|null;readonly rationale:string;readonly economicChannel:string;readonly topics:readonly {topic:string;refs:readonly string[]}[];readonly counterEvidenceRefs:readonly string[];readonly missing:readonly string[];readonly strongerEvidence:boolean;readonly maximumPrerequisitesMet:boolean}
export function evaluateAIReview(input:{contract:'owner-authorized-ai-score-review-v1';scope:'REVIEW_CANDIDATE';ticker:string;knownAt:string;ownerAuthorizationReference:string;assessments:readonly AIReviewAssessment[];evidence:readonly AIReviewEvidence[];normalizationQualified:boolean;valuationQualified:boolean;marketQualified:boolean;gatesQualified:boolean;expectedReturn:string|null}){
 check(input.contract==='owner-authorized-ai-score-review-v1'&&input.scope==='REVIEW_CANDIDATE'&&input.ownerAuthorizationReference.trim().length>0,'EXPLICIT_OWNER_AI_REVIEW_SCOPE_REQUIRED');instant(input.knownAt);
 check(input.assessments.length===RUBRICS.length&&new Set(input.assessments.map(a=>a.subcategory)).size===RUBRICS.length,'EXACT_23_UNIQUE_RUBRICS_REQUIRED');
 check(new Set(input.evidence.map(e=>e.id)).size===input.evidence.length,'UNIQUE_REVIEW_EVIDENCE_REQUIRED');
 for(const e of input.evidence){instant(e.knownAt);check(e.knownAt<=input.knownAt&&e.sourceRefs.length>0,'REVIEW_EVIDENCE_NOT_YET_KNOWN_OR_UNSOURCED');}
 const rows=input.assessments.map(a=>{
  const r=RUBRICS.find(r=>r.id===a.subcategory);check(r&&a.source==='AI'&&a.actor==='CHATGPT','EXPLICIT_AI_PROVENANCE_REQUIRED');check(a.rationale.trim().length>0&&a.economicChannel.trim().length>0,'EXPLICIT_AI_REASON_AND_CHANNEL_REQUIRED');
  if(a.points===null){check(a.band===null&&a.missing.length>0,'N_R_NEEDS_EXPLICIT_MISSING_REASON');return {id:r.id,category:r.category,points:null,max:r.max,status:'N/R',missing:a.missing};}
  const band=r.bands.find(b=>b.label===a.band);check(band&&Number.isInteger(a.points)&&a.points>=band.min&&a.points<=band.max&&a.missing.length===0,'SUPPORTED_RUBRIC_BAND_REQUIRED');
  check(new Set(a.topics.map(t=>t.topic)).size===a.topics.length&&a.topics.every(t=>r.topics.includes(t.topic)),'UNIQUE_APPROVED_EVIDENCE_TOPICS_REQUIRED');
  for(const topic of r.topics){const t=a.topics.find(t=>t.topic===topic);check(t&&t.refs.length>0&&t.refs.every(id=>input.evidence.some(e=>e.id===id&&e.checked&&e.qualification==='SCORING_SUPPORT'&&e.supportedTopics.includes(topic))),'CHECKED_TOPIC_SPECIFIC_SUPPORT_REQUIRED');}
  check(a.counterEvidenceRefs.every(id=>input.evidence.some(e=>e.id===id&&e.checked)),'CHECKED_COUNTEREVIDENCE_REQUIRED');
  if(a.points===r.max)check(a.maximumPrerequisitesMet&&a.counterEvidenceRefs.length>0,'MAXIMUM_PREREQUISITES_REQUIRED');
  if(band.max>band.min&&a.points===band.max)check(a.strongerEvidence,'UPPER_POINT_SUPPORT_REQUIRED');
  if(r.category==='VAL')check(input.valuationQualified&&input.marketQualified,'VALUATION_AND_MARKET_QUALIFICATION_REQUIRED');
  if(r.id==='VAL-RET'){check(input.expectedReturn!==null,'EXPECTED_RETURN_REQUIRED');const ret=decimal(input.expectedReturn!);const idx=ret.units>=decimal('0.22').units?5:ret.units>=decimal('0.18').units?4:ret.units>=decimal('0.15').units?3:ret.units>=decimal('0.12').units?2:ret.units>=decimal('0.08').units?1:0;check(a.band===r.bands[idx].label,'RETURN_BAND_MISMATCH');}
  return {id:r.id,category:r.category,points:a.points,max:r.max,status:'SCORED_REVIEW',missing:[]};
 });
 for(let i=0;i<input.assessments.length;i++)for(let j=i+1;j<input.assessments.length;j++){
  const a=input.assessments[i],b=input.assessments[j];if(a.points===null||b.points===null)continue;
  const families=(x:AIReviewAssessment)=>x.topics.flatMap(t=>t.refs).map(id=>input.evidence.find(e=>e.id===id)!.family);
  if(families(a).some(f=>families(b).includes(f)))check(a.economicChannel!==b.economicChannel,'DOUBLE_COUNTED_ECONOMIC_CHANNEL');
 }
 const categories=Object.entries(CATEGORY_MAXIMA).map(([category,max])=>{const rs=rows.filter(r=>r.category===category);return {category,max,points:rs.some(r=>r.points===null)?null:rs.reduce((n,r)=>n+r.points!,0)};});
 const complete=rows.every(r=>r.points!==null)&&input.normalizationQualified&&input.valuationQualified&&input.marketQualified&&input.gatesQualified;
 return deepFreeze({contract:input.contract,ticker:input.ticker,scope:input.scope,reviewer:'CHATGPT',reviewMode:'OWNER_AUTHORIZED_AI_SELF_REVIEW',independentHumanReviewClaimed:false,rows,categories,scoredSubtotal:rows.reduce((n,r)=>n+(r.points??0),0),coveredMaximum:rows.filter(r=>r.points!==null).reduce((n,r)=>n+r.max,0),totalScore:complete?rows.reduce((n,r)=>n+r.points!,0):null,status:complete?'AI_REVIEW_COMPLETE_NOT_FORMAL_ACCEPTANCE':'NOT_RELIABLY_SCORABLE',productionScoringAuthorized:false});
}
export interface CommonEarningsReading {
 readonly ticker:string;readonly period:{readonly start:string;readonly end:string};readonly sourceScope:'STANDALONE'|'CONSOLIDATED';readonly currency:'VND';readonly currencyMultiplier:string;
 readonly sourcePreDeductionProfit:string|null;readonly signedExplicitDeductions:readonly string[]|null;readonly reportedCommonProfit:string;readonly reportedCommonProfitVnd:string;
 readonly weightedAverageShares:string;readonly weightedSharesAreCurrentOutstanding:false;readonly weightedSharePrecision:'INTEGER_AS_REPORTED'|'ROUNDED_MILLION';readonly reportedBasicEps:string|null;
 readonly fundStatus:string;readonly exhaustiveOneOffReviewComplete:boolean;readonly source:{readonly pdfPath:string;readonly sha256:string;readonly page:number};readonly review:{readonly fullPageImageInspected:boolean};
}
export function normalizeCommonEarningsReading(f:CommonEarningsReading){
 check(f.currency==='VND'&&['1','1000000'].includes(f.currencyMultiplier)&&f.period.start==='2025-01-01'&&f.period.end==='2025-12-31','EXPLICIT_REVIEW_PERIOD_UNIT_REQUIRED');
 check(['STANDALONE','CONSOLIDATED'].includes(f.sourceScope)&&f.review.fullPageImageInspected&&f.source.page>0&&/^[a-f0-9]{64}$/.test(f.source.sha256),'CHECKED_SOURCE_SCOPE_REQUIRED');
 check(!f.weightedSharesAreCurrentOutstanding&&decimal(f.weightedAverageShares).positive&&decimal(f.weightedAverageShares).integer,'WEIGHTED_SHARES_NOT_CURRENT_DENOMINATOR');
 const reported=product(f.reportedCommonProfit,f.currencyMultiplier);check(reported===f.reportedCommonProfitVnd,'DECLARED_COMMON_EARNINGS_UNIT_REPLAY');
 let computed:string|null=null;
 if(f.sourcePreDeductionProfit!==null&&f.signedExplicitDeductions!==null){computed=f.signedExplicitDeductions.reduce((sum,a)=>sum.add(decimal(a)),decimal(f.sourcePreDeductionProfit)).toString();}
 const flags:string[]=[];
 if(computed!==null&&!decimal(computed).eq(decimal(f.reportedCommonProfit)))flags.push('SOURCE_COMMON_EARNINGS_ARITHMETIC_CONFLICT');
 const eps=decimal(reported).div(decimal(f.weightedAverageShares));
 if(f.reportedBasicEps!==null&&f.weightedSharePrecision==='INTEGER_AS_REPORTED'){
  const difference=eps.sub(decimal(f.reportedBasicEps));if((difference.negative?difference.neg():difference).units>one.units)flags.push('SOURCE_EPS_RECONCILIATION_CONFLICT');
 }
 if(f.fundStatus==='ISSUER_UNESTIMATED')flags.push('NON_SHAREHOLDER_FUNDS_NOT_ESTIMATED_BY_ISSUER');
 if(f.fundStatus==='TABLE_DEDUCTION_WITH_UNESTIMATED_FOOTNOTE')flags.push('FUND_TABLE_AND_FOOTNOTE_REQUIRE_RECONCILIATION');
 if(f.fundStatus==='ISSUER_ESTIMATED_DEDUCTION')flags.push('FUND_AMOUNT_IS_ISSUER_ESTIMATE');
 if(!f.exhaustiveOneOffReviewComplete)flags.push('ECONOMIC_ONE_OFF_AND_CYCLE_NORMALIZATION_NOT_COMPLETE');
 const conflict=flags.some(f=>f.endsWith('_CONFLICT'));
 return deepFreeze({ticker:f.ticker,period:f.period,sourceScope:f.sourceScope,reportedCommonProfitVnd:reported,computedCommonProfitInSourceUnits:computed,accountingCommonProfitVnd:conflict?null:reported,computedHistoricalWeightedEps:conflict?null:eps.toString(),currentOutstandingShares:null,normalizedCommonProfitVnd:null,flags,status:conflict?'BLOCKED_SOURCE_RECONCILIATION':'ACCOUNTING_COMMON_REVIEWED_ECONOMIC_NORMALIZATION_PENDING',productionScoringAuthorized:false});
}
