// @vitest-environment node
import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {RUBRICS} from '@/domain/scoring/methodology';
import {discountedFlows,ownerEarningsDcf,residualIncomeValue,projectRnav,reportedEarningsSensitivity,perShareReview,evaluateAIReview,normalizeCommonEarningsReading,type AIReviewAssessment,type AIReviewEvidence,type CommonEarningsReading} from '@/domain/scoring/review-analysis';
const at='2026-10-30T10:00:00.000Z';
const readings=JSON.parse(readFileSync('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-economics-r3/checked-common-earnings.json','utf8')).facts as CommonEarningsReading[];
function fixture(){
 const evidence:AIReviewEvidence[]=RUBRICS.map(r=>({id:r.id,knownAt:at,sourceRefs:['synthetic-test-only:'+r.id],checked:true,supportedTopics:r.topics,qualification:'SCORING_SUPPORT',family:r.id}));
 const assessments:AIReviewAssessment[]=RUBRICS.map(r=>({subcategory:r.id,source:'AI',actor:'CHATGPT',points:0,band:r.bands[0].label,rationale:'Synthetic negative-economics case; not a real issuer assessment',economicChannel:r.id,topics:r.topics.map(topic=>({topic,refs:[r.id]})),counterEvidenceRefs:[],missing:[],strongerEvidence:false,maximumPrerequisitesMet:false}));
 return {contract:'owner-authorized-ai-score-review-v1' as const,scope:'REVIEW_CANDIDATE' as const,ticker:'TEST',knownAt:at,ownerAuthorizationReference:'SYNTHETIC_TEST_OWNER_POLICY',assessments,evidence,normalizationQualified:true,valuationQualified:true,marketQualified:true,gatesQualified:true,expectedReturn:'0.05'};
}
describe('valuation arithmetic and sector qualification',()=>{
 it('discounts a known two-year cashflow without floating point',()=>{expect(discountedFlows(['110','121'],'0.1').value).toBe('200');});
 it('gives1000 for sustainable100FCFE at10percent no growth',()=>{const r=ownerEarningsDcf({sector:'TECHNOLOGY',basis:'NORMALIZED_FCFE',qualified:true,normalizationRefs:['synthetic'],cashflows:['100'],discountRate:'0.1',terminalGrowth:'0'});expect(r.equityValue).toBe('1000');expect(r.productionScoringAuthorized).toBe(false);});
 it('rejects unqualified cashflow, bank DCF and unstable terminal growth',()=>{
 const x={sector:'TECHNOLOGY' as const,basis:'NORMALIZED_FCFE' as const,qualified:true,normalizationRefs:['synthetic'],cashflows:['100'],discountRate:'0.1',terminalGrowth:'0'};
 expect(()=>ownerEarningsDcf({...x,qualified:false})).toThrow();expect(()=>ownerEarningsDcf({...x,sector:'BANK'})).toThrow();expect(()=>ownerEarningsDcf({...x,terminalGrowth:'0.1'})).toThrow();
 });
 it('residual income equals book value whenROE equals cost of equity',()=>{expect(residualIncomeValue({sector:'BANK',commonEquity:'1000',commonEquityQualified:true,normalizedRoe:['0.1'],roeQualified:true,bookGrowth:['0.02'],costOfEquity:'0.1',terminalResidualGrowth:'0',sourceRefs:['synthetic']}).equityValue).toBe('1000');});
 it('does not treat total book or rawROE as qualified common-capital return',()=>{const x={sector:'BANK' as const,commonEquity:'1000',commonEquityQualified:true,normalizedRoe:['0.1'],roeQualified:true,bookGrowth:['0.02'],costOfEquity:'0.1',terminalResidualGrowth:'0',sourceRefs:['synthetic']};expect(()=>residualIncomeValue({...x,commonEquityQualified:false})).toThrow();expect(()=>residualIncomeValue({...x,roeQualified:false})).toThrow();expect(()=>residualIncomeValue({...x,bookGrowth:['0.2']})).toThrow();});
 it('RNAV applies ownership/realizability once and net corporate debt once',()=>{const x={sector:'REAL_ESTATE' as const,projects:[{id:'p',afterTaxCashflows:['110'],discountRate:'0.1',equityFraction:'0.5',realizationFactor:'0.8',legalAndCostEvidenceRefs:['synthetic']}],corporateNetAdjustments:'-10',corporateAdjustmentsQualified:true};expect(projectRnav(x).equityValue).toBe('30');expect(()=>projectRnav({...x,projects:[...x.projects,...x.projects]})).toThrow();expect(()=>projectRnav({...x,corporateAdjustmentsQualified:false})).toThrow();});
 it('keeps reported earnings sensitivity distinct from fair value',()=>{const r=reportedEarningsSensitivity('150','0.15');expect(r.referenceEquityValue).toBe('1000');expect(r.primaryValuationQualified).toBe(false);expect(r.fairValuePerShare).toBeNull();});
 it('refuses weighted/listed/stale/unbridged shares as current denominator',()=>{
 const x={value:'100',kind:'OUTSTANDING_COMMON' as const,actionBridgeVerified:true,validThrough:at};expect(perShareReview('1000',x,at)).toBe('10');for(const kind of ['WEIGHTED_AVERAGE','LISTED'] as const)expect(()=>perShareReview('1000',{...x,kind},at)).toThrow();expect(()=>perShareReview('1000',{...x,actionBridgeVerified:false},at)).toThrow();expect(()=>perShareReview('1000',{...x,validThrough:'2025-01-01T00:00:00.000Z'},at)).toThrow();
 });
});
describe('actual common-earnings normalization',()=>{
 it('deducts the source fund amount instead of using total NPAT forVNM',()=>{const f=readings.find(r=>r.ticker==='VNM')!,r=normalizeCommonEarningsReading(f);expect(r.accountingCommonProfitVnd).toBe('8417384067829');expect(r.normalizedCommonProfitVnd).toBeNull();expect(r.currentOutstandingShares).toBeNull();});
 it('preserves and blocks the literalBSR source discrepancy, not corrected to make tests green',()=>{const f=readings.find(r=>r.ticker==='BSR')!,r=normalizeCommonEarningsReading(f);expect(r.reportedCommonProfitVnd).toBe('5230686242758');expect(r.computedCommonProfitInSourceUnits).toBe('5209551050863');expect(r.accountingCommonProfitVnd).toBeNull();expect(r.flags).toContain('SOURCE_COMMON_EARNINGS_ARITHMETIC_CONFLICT');});
 it('keeps unestimated funds unknown and retains standalone issuer scope',()=>{const f=readings.find(r=>r.ticker==='LPB')!,r=normalizeCommonEarningsReading(f);expect(f.signedExplicitDeductions).toBeNull();expect(r.sourceScope).toBe('STANDALONE');expect(r.flags).toContain('NON_SHAREHOLDER_FUNDS_NOT_ESTIMATED_BY_ISSUER');expect(r.normalizedCommonProfitVnd).toBeNull();});
 it('detects changed unit/multiplier and rejects treating weighted shares as outstanding',()=>{const f=readings.find(r=>r.ticker==='VNM')!;expect(()=>normalizeCommonEarningsReading({...f,currencyMultiplier:'1000000'})).toThrow();expect(()=>normalizeCommonEarningsReading({...f,weightedSharesAreCurrentOutstanding:true} as unknown as CommonEarningsReading)).toThrow();});
});
describe('owner-authorized AI review without legacy impersonation',()=>{
 it('calculates a complete synthetic negative-economics case as0 while never authorizing production',()=>{const r=evaluateAIReview(fixture());expect(r.totalScore).toBe(0);expect(r.coveredMaximum).toBe(100);expect(r.independentHumanReviewClaimed).toBe(false);expect(r.productionScoringAuthorized).toBe(false);});
 it('returnsN/R total, not zero or reweighted100, when a rubric is missing',()=>{const x=fixture();x.assessments[0]={...x.assessments[0],points:null,band:null,missing:['SYNTHETIC_GAP']};const r=evaluateAIReview(x);expect(r.totalScore).toBeNull();expect(r.coveredMaximum).toBe(92);expect(r.categories.find(c=>c.category==='BQ')!.points).toBeNull();});
 it('requires all23 rubrics, exactAI actor, actual bands and topic-specific checked evidence',()=>{
 const x=fixture();expect(()=>evaluateAIReview({...x,assessments:x.assessments.slice(1)})).toThrow();
 expect(()=>evaluateAIReview({...x,assessments:[{...x.assessments[0],source:'HUMAN'} as unknown as AIReviewAssessment,...x.assessments.slice(1)]})).toThrow();
 expect(()=>evaluateAIReview({...x,evidence:[{...x.evidence[0],qualification:'CONTEXT_ONLY'},...x.evidence.slice(1)]})).toThrow();
 expect(()=>evaluateAIReview({...x,evidence:[{...x.evidence[0],supportedTopics:[]},...x.evidence.slice(1)]})).toThrow();
 expect(()=>evaluateAIReview({...x,assessments:[{...x.assessments[0],points:99},...x.assessments.slice(1)]})).toThrow();
 });
 it('does not pass future knowledge or stale valuation qualification into points',()=>{const x=fixture();expect(()=>evaluateAIReview({...x,evidence:[{...x.evidence[0],knownAt:'2027-01-01T00:00:00.000Z'},...x.evidence.slice(1)]})).toThrow();expect(()=>evaluateAIReview({...x,marketQualified:false})).toThrow();});
});
