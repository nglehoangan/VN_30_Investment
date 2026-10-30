import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {evaluateDebtReceipt, DEBT_CONTRACT} = await import('../src/domain/fundamentals/debt-contract.ts');
const {snapshotHash} = await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const {decimal} = await import('../src/domain/portfolio/values.ts');
const base = 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1';
const old = 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/b6-integration-r1';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const at = new Date().toISOString();
const sources = read(old + '/native-review-sources.json');
const originalFacts = sources.rawReferenceCaptures.map(c => JSON.parse(c.payload).originalCanonicalRecord).filter(f => f.ticker === 'VNM');
const notes = read('data/manual-extracted-pdf/notes/VNM.json');
const checked = [
  {end:'2024-12-31', needle:'20250228_', short:'9115435107250', long:'157903902450', balance:9, shortPage:47, longPage:48, opaquePage:50, otherPayables:'82293267804', otherAccruals:'433295443090', reclassification:'183157263872'},
  {end:'2025-12-31', needle:'20260227_', short:'9393736731992', long:'62907826150', balance:9, shortPage:47, longPage:48, opaquePage:50, otherPayables:'81170549316', otherAccruals:'238889479354', reclassification:'20750493750'},
  {end:'2026-06-30', needle:'20260730_', short:'8323441876837', long:'131430000000', balance:10, shortPage:52, longPage:53, opaquePage:55, otherPayables:'76949919753', otherAccruals:'290557676861', reclassification:'10401978750'},
];
const review = {contract:'vnm-direct-pdf-reported-borrowing-survey-v1', reviewedAt:at, reviewer:'CHATGPT_OWNER_AUTHORIZED',
  sourceImagesInspected:true, currency:'VND', scope:'CONSOLIDATED', measurement:DEBT_CONTRACT.defaultMeasurementBasis,
  population:'REPORTED_BORROWINGS_ONLY', comprehensiveFinancingProven:false,
  survey:'Consolidated statement financing captions reconciled to all Note15(a)/(b) lender closing totals. Current reclassification is already inside short closing and removed from noncurrent long; movement is not a closing current portion. No separate bond/finance-lease financing caption identified in these statements/Note15. Ordinary operating rentals are not capitalized. Unknown miscellaneous liabilities remain explicit; this is not an exhaustive financing certificate.',
  periods:checked.map(p => {
    const doc = notes.documents.find(d => d.pdfPaths[0].includes(p.needle)); assert(doc);
    const path = doc.pdfPaths[0]; assert.equal(sha(path), doc.sourceHash);
    const short = originalFacts.find(f=>f.itemId==='SHORT_TERM_FINANCIAL_BORROWINGS'&&f.period.end===p.end);
    const long = originalFacts.find(f=>f.itemId==='LONG_TERM_FINANCIAL_BORROWINGS'&&f.period.end===p.end);
    assert.equal(short.value,p.short);assert.equal(long.value,p.long);
    assert.equal(short.sourceHash,doc.sourceHash);assert.equal(long.sourceHash,doc.sourceHash);
    return {...p,pdfPath:path,sourceHash:doc.sourceHash,shortCanonicalId:short.id,longCanonicalId:long.id,
      currentPortion:null,currentPortionStatus:'INCLUDED_IN_SHORT_NOT_SEPARATELY_DISCLOSED',
      reportedSum:decimal(p.short).add(decimal(p.long)).toString(),
      directEvidence:[p.balance,p.shortPage,p.longPage,p.opaquePage].map(page=>path+'#page='+page)};
  })};
const reviewPath=base+'/vnm-borrowing-source-review.json';
writeFileSync(reviewPath,JSON.stringify(review,null,2)+'\n');
const reviewHash=sha(reviewPath),receipts=[],facts=[];
const seal=o=>({...o,bodyHash:snapshotHash(o)});
for(const p of review.periods){
  const short=originalFacts.find(f=>f.id===p.shortCanonicalId),long=originalFacts.find(f=>f.id===p.longCanonicalId);
  const evidence={evidenceReference:reviewPath,evidenceHash:reviewHash,reviewedAt:at};
  const components=[{id:'other-payables',caption:'Phải trả khác — Note18',amount:p.otherPayables},
    {id:'other-accruals',caption:'Chi phí phải trả khác — Note17',amount:p.otherAccruals},
    {id:'undisclosed-financing-qualification',caption:'No exhaustive financing proof: unquantified financing character remains unknown',amount:null}]
    .map(c=>({...c,interestBearing:'UNKNOWN',evidenceReference:p.pdfPath+'#page='+p.opaquePage}));
  const metadata=seal({contractVersion:DEBT_CONTRACT.version,ticker:'VNM',periodEnd:p.end,scope:'CONSOLIDATED',unit:'CURRENCY',currency:'VND',
    measurementBasis:DEBT_CONTRACT.defaultMeasurementBasis,leasePolicyVersion:DEBT_CONTRACT.leasePolicyVersion,
    reportedPopulationStatus:'REPORTED_COMPLETE',comprehensivePopulationStatus:'COMPREHENSIVE_UNVERIFIED',knownFinancingOmission:false,
    sourceHashes:[p.sourceHash],...evidence,uncertainty:{components,unclassifiedLiabilityAmount:null,unclassifiedLiabilityRatioToBorrowings:null,
      materialityAssessment:'UNASSESSED',materialityEvidenceReference:null},exhaustiveEvidenceReference:null});
  const current=seal({version:'current-portion-presentation-v1',status:p.currentPortionStatus,ticker:'VNM',periodEnd:p.end,scope:'CONSOLIDATED',currency:'VND',unit:'CURRENCY',
    shortCanonicalId:short.id,longCanonicalId:long.id,shortValue:short.value,longValue:long.value,
    shortPresentationVerified:true,noncurrentLongPresentationVerified:true,sourcePath:p.pdfPath,sourceHash:p.sourceHash,
    shortLocator:p.pdfPath+'#page='+p.shortPage,longLocator:p.pdfPath+'#page='+p.longPage,
    inclusionLocator:reviewPath+'#/periods/'+review.periods.indexOf(p)+'/short',exclusionLocator:reviewPath+'#/periods/'+review.periods.indexOf(p)+'/long',...evidence});
  const receipt=seal({id:'vnm-b6-reported-'+p.end,ticker:'VNM',sector:'RETAIL',periodEnd:p.end,
    shortCanonicalId:short.id,longCanonicalId:long.id,shortValue:short.value,longValue:long.value,
    currentPortion:null,currentPortionPresentation:current,shortIncludesCurrentPortion:true,longIncludesCurrentPortion:false,
    knownFinancingItems:[],reportedSurveyVerified:true,currentPortionVerified:true,metadata});
  const context={analysisAt:at,systemKnownAt:at,sourceBindings:[{path:reviewPath,sha256:reviewHash},{path:p.pdfPath,sha256:p.sourceHash}],
    statements:[{ticker:'VNM',reportingScope:'CONSOLIDATED',reportingPeriod:{end:p.end},SHA256:p.sourceHash,verifiedHash:p.sourceHash,reviewStatus:'QUALIFIED'}]};
  const result=evaluateDebtReceipt(receipt,[short,long],context,snapshotHash);assert(result,'VNM_REPORTED_RECEIPT_REJECTED');assert.equal(result.value,p.reportedSum);
  const invalid=seal({...Object.fromEntries(Object.entries(receipt).filter(([k])=>k!=='bodyHash')),longIncludesCurrentPortion:true});
  assert.equal(evaluateDebtReceipt(invalid,[short,long],context,snapshotHash),null,'UNDISCLOSED_CURRENT_PORTION_MUST_NOT_BE_DOUBLE_COUNTED');
  receipts.push({receipt,context,result});
  facts.push({id:'checked-vnm-reported-'+p.end,ticker:'VNM',itemId:'REPORTED_BORROWINGS',value:result.value,
    rawValue:null,rawUnit:'CURRENCY',multiplier:'1',unit:'CURRENCY',currency:'VND',period:{start:p.end,end:p.end},reportingScope:'CONSOLIDATED',
    sourcePdfPath:p.pdfPath,sourceHash:p.sourceHash,page:p.balance,captionAndColumn:'Vay ngắn hạn + vay dài hạn không hiện hành; Note15; không cộng lại phần chuyển loại',
    method:'DOMAIN_VALIDATED_REPORTED_BORROWING_RECEIPT',reviewedAt:at,debtMetadata:metadata,receiptId:receipt.id,
    scopeBasis:'CONSOLIDATED_STATEMENTS_AND_NOTE15',productionAdmissible:false});
}
writeFileSync(base+'/vnm-qualified-borrowings.json',JSON.stringify({status:'PASS_3_REPORTED_DEBT_GROUPS_WITH_UNASSESSED_UNCERTAINTY',facts,receipts,
  comprehensiveDebtQualified:false,netDebtQualified:false,decisionGradeReady:false},null,2)+'\n');
console.log(JSON.stringify({reportedDebtGroupsQualified:facts.length,uncertainty:'UNASSESSED_NOT_ZERO',productionAdmission:false}));
