import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CURRENT_PORTION_PRESENTATION_POLICY,DEBT_CONTRACT,evaluateDebtReceipt,validDebtMetadata,type DebtDimensionedFact,type DebtMetadata,type DebtPopulationReceipt,type DebtValidationContext,type IncludedCurrentPortionEvidence} from '@/domain/fundamentals/debt-contract';
import {financialHash} from '@/infrastructure/fundamentals/hybrid-input';

const seal=<T extends object>(x:T):T=>({...x,bodyHash:financialHash(Object.fromEntries(Object.entries(x).filter(([key])=>key!=='bodyHash')))});
function fixture(){
 const sourceHash='1'.repeat(64),evidenceHash='2'.repeat(64),sourcePath='synthetic/source.pdf',evidenceReference='synthetic/presentation-review.json';
 const context:DebtValidationContext={analysisAt:'2026-10-19T04:00:00.000Z',systemKnownAt:'2026-10-19T04:00:00.000Z',sourceBindings:[{path:sourcePath,sha256:sourceHash},{path:evidenceReference,sha256:evidenceHash}],statements:[{ticker:'TEST',reportingScope:'CONSOLIDATED',reportingPeriod:{end:'2025-12-31'},SHA256:sourceHash,verifiedHash:sourceHash,reviewStatus:'QUALIFIED'}]};
 const fact=(id:string,itemId:string,value:string):DebtDimensionedFact=>({id,itemId,value,ticker:'TEST',sourceHash,period:{start:'2025-12-31',end:'2025-12-31'},scope:'CONSOLIDATED',unit:'CURRENCY',currency:'VND'});
 const facts=[fact('short','SHORT_TERM_FINANCIAL_BORROWINGS','100'),fact('long','LONG_TERM_FINANCIAL_BORROWINGS','50')];
 const metadata:DebtMetadata=seal({contractVersion:DEBT_CONTRACT.version,ticker:'TEST',periodEnd:'2025-12-31',scope:'CONSOLIDATED',unit:'CURRENCY',currency:'VND',measurementBasis:'ISSUER_REPORTED_CARRYING_AMOUNT',leasePolicyVersion:DEBT_CONTRACT.leasePolicyVersion,reportedPopulationStatus:'REPORTED_COMPLETE',comprehensivePopulationStatus:'COMPREHENSIVE_UNVERIFIED',knownFinancingOmission:false,sourceHashes:[sourceHash],evidenceReference,evidenceHash,reviewedAt:'2026-10-19T03:10:00.000Z',uncertainty:{components:[],unclassifiedLiabilityAmount:'0',unclassifiedLiabilityRatioToBorrowings:{numerator:'0',denominator:'150'},materialityAssessment:'UNASSESSED',materialityEvidenceReference:null},exhaustiveEvidenceReference:null,bodyHash:''});
 const proof:IncludedCurrentPortionEvidence=seal({version:'current-portion-presentation-v1',status:'INCLUDED_IN_SHORT_NOT_SEPARATELY_DISCLOSED',ticker:'TEST',periodEnd:'2025-12-31',scope:'CONSOLIDATED',currency:'VND',unit:'CURRENCY',shortCanonicalId:'short',longCanonicalId:'long',shortValue:'100',longValue:'50',shortPresentationVerified:true,noncurrentLongPresentationVerified:true,sourcePath,sourceHash,shortLocator:'balance sheet short closing column',longLocator:'balance sheet noncurrent closing column',inclusionLocator:'note15(a) aggregated short presentation',exclusionLocator:'note15(b) noncurrent long presentation',evidenceReference,evidenceHash,reviewedAt:'2026-10-19T03:10:00.000Z',bodyHash:''});
 const receipt:DebtPopulationReceipt=seal({id:'receipt',ticker:'TEST',sector:'RETAIL',periodEnd:'2025-12-31',shortCanonicalId:'short',longCanonicalId:'long',shortValue:'100',longValue:'50',currentPortion:null,currentPortionPresentation:proof,shortIncludesCurrentPortion:true,longIncludesCurrentPortion:false,knownFinancingItems:[],reportedSurveyVerified:true,currentPortionVerified:true,metadata,bodyHash:''});
 return {receipt,facts,context,proof};
}
it('accepts source-bound included-but-undisclosed presentation without inventing zero or adding current twice',()=>{
 const {receipt,facts,context}=fixture(),before=structuredClone(receipt);
 expect(evaluateDebtReceipt(receipt,facts,context,financialHash)?.value).toBe('150');
 expect(receipt.currentPortion).toBeNull();expect(receipt).toEqual(before);
});
it.each([false,true])('null amount is rejected if short inclusion is false or long includes current (%s)',longIncludes=>{
 const {receipt,facts,context}=fixture();
 const bad=longIncludes?{...receipt,longIncludesCurrentPortion:true}:{...receipt,shortIncludesCurrentPortion:false};
 expect(evaluateDebtReceipt(seal(bad),facts,context,financialHash)).toBeNull();
});
it('does not equate null with zero or an in-year reclassification amount',()=>{
 const {receipt,facts,context}=fixture();
 for(const currentPortion of ['0','20'])expect(evaluateDebtReceipt(seal({...receipt,currentPortion}),facts,context,financialHash)).toBeNull();
 const absent={...receipt};delete absent.currentPortionPresentation;
 expect(evaluateDebtReceipt(seal(absent),facts,context,financialHash)).toBeNull();
});
it.each(['ticker','periodEnd','scope','currency','unit','shortCanonicalId','longCanonicalId','shortValue','longValue'] as const)('rejects evidence bound to a different %s',field=>{
 const {receipt,facts,context,proof}=fixture();
 const value=field==='periodEnd'?'2024-12-31':'OTHER';
 const changed=seal({...proof,[field]:value}) as IncludedCurrentPortionEvidence;
 expect(evaluateDebtReceipt(seal({...receipt,currentPortionPresentation:changed}),facts,context,financialHash)).toBeNull();
});
it.each(['shortLocator','longLocator','inclusionLocator','exclusionLocator'] as const)('requires %s',field=>{
 const {receipt,facts,context,proof}=fixture();
 expect(evaluateDebtReceipt(seal({...receipt,currentPortionPresentation:seal({...proof,[field]:' '})}),facts,context,financialHash)).toBeNull();
});
it('rejects unbound source/review, tampered hashes, unverified scope and future/backdated reviews',()=>{
 const {receipt,facts,context,proof}=fixture();
 const badProofs=[{...proof,bodyHash:'0'.repeat(64)},seal({...proof,evidenceHash:'0'.repeat(64)}),seal({...proof,sourcePath:'other.pdf'}),seal({...proof,sourceHash:'0'.repeat(64)}),seal({...proof,shortPresentationVerified:false}),seal({...proof,noncurrentLongPresentationVerified:false}),seal({...proof,reviewedAt:'2026-10-20T00:00:00.000Z'}),seal({...proof,reviewedAt:'2026-10-18T00:00:00.000Z'})];
 for(const p of badProofs)expect(evaluateDebtReceipt(seal({...receipt,currentPortionPresentation:p as IncludedCurrentPortionEvidence}),facts,context,financialHash)).toBeNull();
 expect(evaluateDebtReceipt({...receipt,bodyHash:'0'.repeat(64)},facts,context,financialHash)).toBeNull();
 expect(evaluateDebtReceipt(receipt,facts,{...context,statements:context.statements.map(s=>({...s,reviewStatus:'UNREVIEWED'}))},financialHash)).toBeNull();
});
it('rejects a proof source that is outside the debt metadata sources',()=>{
 const {receipt,facts,context,proof}=fixture(),otherHash='3'.repeat(64);
 const p=seal({...proof,sourceHash:otherHash,sourcePath:'other-qualified.pdf'});
 const c={...context,sourceBindings:[...context.sourceBindings,{path:p.sourcePath,sha256:otherHash}],statements:[...context.statements,{...context.statements[0],SHA256:otherHash,verifiedHash:otherHash}]};
 expect(evaluateDebtReceipt(seal({...receipt,currentPortionPresentation:p}),facts,c,financialHash)).toBeNull();
});
it('keeps pre-approval analysis/knowledge contexts closed to the new presentation',()=>{
 const {receipt,facts,context}=fixture();
 for(const c of [{...context,analysisAt:'2026-10-18T23:59:59.000Z'},{...context,systemKnownAt:'2026-10-18T23:59:59.000Z'}])expect(evaluateDebtReceipt(receipt,facts,c,financialHash)).toBeNull();
 expect(CURRENT_PORTION_PRESENTATION_POLICY.automaticCanonicalUpdateOrPromotion).toBe(false);
});
it('preserves numeric presentation and existing overlap corrections',()=>{
 const {receipt,facts,context}=fixture();
 const numericInput={...receipt,currentPortion:'10'};delete numericInput.currentPortionPresentation;
 const numeric=seal(numericInput);
 expect(evaluateDebtReceipt(numeric,facts,context,financialHash)?.value).toBe('150');
 // Both captions contain the same identified 10: remove it once.
 const longValue='60',adjusted=facts.map(f=>f.id==='long'?{...f,value:longValue}:f);
 expect(evaluateDebtReceipt(seal({...numeric,longValue,longIncludesCurrentPortion:true}),adjusted,context,financialHash)?.value).toBe('150');
 expect(evaluateDebtReceipt(seal({...numeric,currentPortion:'101'}),facts,context,financialHash)).toBeNull();
});
it('does not bypass known-financing omission checks or certify comprehensive debt',()=>{
 const {receipt,facts,context}=fixture();
 const item={id:'bond',kind:'BOND' as const,amount:null,applicable:true,verified:false,alreadyIncludedIn:null,inclusionEvidenceVerified:false,evidenceReference:'unreviewed'};
 expect(evaluateDebtReceipt(seal({...receipt,knownFinancingItems:[item]}),facts,context,financialHash)).toBeNull();
 const value={...facts[0],itemId:'COMPREHENSIVE_FINANCIAL_DEBT',value:'150'};
 expect(validDebtMetadata(receipt.metadata,'COMPREHENSIVE_FINANCIAL_DEBT',value,context,financialHash)).toBe(false);
});
it('keeps unknown unrelated financing uncertainty visible rather than zero',()=>{
 const {receipt,facts,context}=fixture();
 const metadata=seal({...receipt.metadata,uncertainty:{components:[{id:'opaque',caption:'Other payable',amount:null,interestBearing:'UNKNOWN' as const,evidenceReference:'source note18'}],unclassifiedLiabilityAmount:null,unclassifiedLiabilityRatioToBorrowings:null,materialityAssessment:'UNASSESSED' as const,materialityEvidenceReference:null}});
 expect(evaluateDebtReceipt(seal({...receipt,metadata}),facts,context,financialHash)?.metadata.uncertainty.unclassifiedLiabilityAmount).toBeNull();
});

const reviewRoot='docs/fundamental-data-engine/evidence/2026-10-19-included-current-portion';
const vnmProofs=JSON.parse(readFileSync(`${reviewRoot}/VNM_CURRENT_PORTION_PRESENTATIONS.json`,'utf8')).witnesses as IncludedCurrentPortionEvidence[];
const vnmFacts=JSON.parse(readFileSync('docs/fundamental-data-engine/evidence/2026-10-15-consumer-targeted-fix/VNM/CANONICAL_FACTS.json','utf8')).canonicalFacts as DebtDimensionedFact[];
it.each(vnmProofs)('VNM $periodEnd reviewed witness removes only the presentation prerequisite when other receipt conditions are satisfied',proof=>{
 const digest=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
 expect(proof.bodyHash).toBe(financialHash(Object.fromEntries(Object.entries(proof).filter(([key])=>key!=='bodyHash'))));
 expect(digest(proof.evidenceReference)).toBe(proof.evidenceHash);
 for(const id of [proof.shortCanonicalId,proof.longCanonicalId])expect(vnmFacts.find(f=>f.id===id)?.sourceHash).toBe(proof.sourceHash);
 const value=(BigInt(proof.shortValue)+BigInt(proof.longValue)).toString();
 // Conditional arithmetic test only: no real full-survey approval or admission is written.
 const metadata:DebtMetadata=seal({contractVersion:DEBT_CONTRACT.version,ticker:'VNM',periodEnd:proof.periodEnd,scope:'CONSOLIDATED',unit:'CURRENCY',currency:'VND',measurementBasis:'ISSUER_REPORTED_CARRYING_AMOUNT',leasePolicyVersion:DEBT_CONTRACT.leasePolicyVersion,reportedPopulationStatus:'REPORTED_COMPLETE',comprehensivePopulationStatus:'COMPREHENSIVE_UNVERIFIED',knownFinancingOmission:false,sourceHashes:[proof.sourceHash],evidenceReference:proof.evidenceReference,evidenceHash:proof.evidenceHash,reviewedAt:proof.reviewedAt,uncertainty:{components:[],unclassifiedLiabilityAmount:'0',unclassifiedLiabilityRatioToBorrowings:{numerator:'0',denominator:value},materialityAssessment:'UNASSESSED',materialityEvidenceReference:null},exhaustiveEvidenceReference:null,bodyHash:''});
 const context:DebtValidationContext={analysisAt:proof.reviewedAt,systemKnownAt:proof.reviewedAt,sourceBindings:[{path:proof.sourcePath,sha256:proof.sourceHash},{path:proof.evidenceReference,sha256:proof.evidenceHash}],statements:[{ticker:'VNM',reportingScope:'CONSOLIDATED',reportingPeriod:{end:proof.periodEnd},SHA256:proof.sourceHash,verifiedHash:proof.sourceHash,reviewStatus:'QUALIFIED'}]};
 const receipt:DebtPopulationReceipt=seal({id:'conditional-presentation-test',ticker:'VNM',sector:'RETAIL',periodEnd:proof.periodEnd,shortCanonicalId:proof.shortCanonicalId,longCanonicalId:proof.longCanonicalId,shortValue:proof.shortValue,longValue:proof.longValue,currentPortion:null,currentPortionPresentation:proof,shortIncludesCurrentPortion:true,longIncludesCurrentPortion:false,knownFinancingItems:[],reportedSurveyVerified:true,currentPortionVerified:true,metadata,bodyHash:''});
 expect(evaluateDebtReceipt(receipt,vnmFacts,context,financialHash)?.value).toBe(value);
 expect(evaluateDebtReceipt(seal({...receipt,longIncludesCurrentPortion:true}),vnmFacts,context,financialHash)).toBeNull();
});
