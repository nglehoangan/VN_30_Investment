#!/usr/bin/env python3
"""Reuse retained source, admitted history and closed research. No acquisition/research rebuild."""
import json,hashlib,sqlite3,datetime
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/fundamental-data-engine/vnm-f2-coverage-closure/2026-11-16'
read=lambda p:json.loads((R/p).read_text());sha=lambda p:hashlib.sha256((R/p).read_bytes()).hexdigest();pin=lambda p:{'path':p,'sha256':sha(p)}
def save(name,d):
 p=O/name;body=json.dumps(d,ensure_ascii=False,indent=2)+'\n'
 if p.exists() and p.read_text()!=body:raise ValueError('IMMUTABLE_PREPARED_EVIDENCE_CHANGED:'+str(p))
 p.write_text(body)
O.mkdir(parents=True,exist_ok=True)
reviewPath=O/'DEBT_SOURCE_REVIEW.json'
if not reviewPath.exists():
 pagesPath='docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/Q3_SELECTED_PAGES.json';pages=read(pagesPath)
 selected={p['page']:p for p in pages['pages'] if p['page'] in [10,52,53,55]}
 checks={10:['Nợ ngắn hạn','Vay ngắn hạn','Nợ dài hạn','Vay dài hạn','8.384.686.375.137','97.387.500.260'],52:['15. Vay','8.384.686.375.137'],53:['(b) Vay dài hạn','97.387.500.260','2030','2027'],55:['18. Phải trả khác','124.306.352.739']}
 for p,tokens in checks.items():
  for t in tokens:assert t in selected[p]['text'],(p,t)
 save('DEBT_SOURCE_REVIEW.json',{'contract':'retained-reported-borrowing-source-review-v1','ticker':'VNM','scope':'CONSOLIDATED','periodEnd':'2026-09-30','reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'raw':pin(pages['pdfPath']),'reviewedPages':{**pin(pagesPath),'physicalPages':[10,52,53,55]},'sourceRole':'REVIEWED_PDF','reportedShort':'8384686375137','reportedNoncurrentLong':'97387500260','currentPortion':None,'currentPortionPresentation':'INCLUDED_IN_SHORT_NOT_SEPARATELY_DISCLOSED','shortLocator':'Physical p10: current liabilities310 / short borrowing321; note15(a) physical p52 closing column30/9/2026.','longLocator':'Physical p10: noncurrent liabilities330 / noncurrent borrowing339; note15(b) physical p53 closing column30/9/2026.','inclusionLocator':'Reviewed current/noncurrent BS classification p10; short note15(a) separately reconciles to current borrowing balance. Undisclosed current component is kept inside current bucket, never added again.','exclusionLocator':'Long borrowing is under noncurrent liabilities330 on p10; note15(b) p53 separately reconciles its noncurrent total. No current portion is added/subtracted without a disclosed amount.','reportedSurveyScope':'Balance sheet borrowing population reconciled to note15(a)/(b). No identified financing addition omitted within reviewed scope; no exhaustive financing certification.','knownFinancingItems':[],'uncertainty':{'components':[{'id':'other-payables-financing-character','caption':'Other payables note18: financing character not exhaustively classified','amount':'124306352739','interestBearing':'UNKNOWN','evidenceReference':str(reviewPath.relative_to(R))}],'unclassifiedLiabilityAmount':'124306352739','unclassifiedLiabilityRatioToBorrowings':{'numerator':'124306352739','denominator':'8482073875397'},'materialityAssessment':'UNASSESSED','materialityEvidenceReference':None},'comprehensivePopulationStatus':'COMPREHENSIVE_UNVERIFIED','exhaustiveCertification':False,'currentPortionNumericZeroInferred':False,'factOrScoreOwnerApprovalClaimed':False})
# Genuine previous canonical admission, read-only DB. Preserve raw body for independent hash replay.
runid='reviewed-vn30-20261019-VNM';c=sqlite3.connect('file:'+str(R/'data/vn30.sqlite')+'?mode=ro',uri=True)
row=c.execute('SELECT body,body_hash,content_hash FROM fundamental_admission_run WHERE id=?',[runid]).fetchone();c.close();assert row
body,bodyHash,contentHash=row;assert hashlib.sha256(body.encode()).hexdigest()==bodyHash
snapshot=json.loads(body);assert len(snapshot['canonicalFacts'])==65
save('RETAINED_ADMITTED_HISTORY.json',{'contract':'retained-admitted-financial-history-v1','ticker':'VNM','sourceDatabase':{'path':'data/vn30.sqlite','sha256':sha('data/vn30.sqlite'),'access':'READ_ONLY'},'admissionId':runid,'body':body,'bodyHash':bodyHash,'contentHash':contentHash,'historicalPITGrantedByThisAdoption':False,'factsRequalified':False})
# Only references to accepted/superseding evidence; old statuses/values are not rewritten.
files={
 'S1Acceptance':'docs/fundamental-data-engine/vnm-s1-closure/2026-11-13/S1_ACCEPTANCE.json',
 'S2Acceptance':'docs/fundamental-data-engine/vnm-s2-public-disclosure/2026-11-13/S2_CLOSURE_ACCEPTANCE.json',
 'S5Acceptance':'docs/fundamental-data-engine/vnm-s5-closure/2026-11-13/S5_ACCEPTANCE.json',
 'S1Inputs':'docs/fundamental-data-engine/vnm-s1-economic-returns/2026-11-13/S1_INPUTS.json',
 'S1Annual':'docs/fundamental-data-engine/vnm-s1-economic-returns/2026-11-13/S1_ECONOMIC_RETURNS.json',
 'S1Current':'docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/WACC_ROIC_Q3_ASSESSMENT.json',
 'Shared':'docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/evidence-products.json',
 'S2Results':'docs/fundamental-data-engine/vnm-s2-public-disclosure/2026-11-13/FINAL_S2_CALCULATIONS.json',
 'S5Inputs':'docs/fundamental-data-engine/vnm-s5-closure/2026-11-13/S5_VALUATION_INPUTS.json',
 'S5Scenarios':'docs/fundamental-data-engine/vnm-s5-closure/2026-11-13/S5_SCENARIOS.json',
 'S5Returns':'docs/fundamental-data-engine/vnm-s5-closure/2026-11-13/S5_EXPECTED_RETURN.json',
 'MetricMatrix':'docs/fundamental-data-engine/f2-full-coverage-assessment/2026-11-13/F2_REQUIRED_METRIC_MATRIX.json'}
for k in ['S1Acceptance','S2Acceptance','S5Acceptance']:assert read(files[k])['status']=='CLOSED'
save('RESEARCH_ADOPTION_CATALOG.json',{'contract':'closed-research-current-adoption-v1','ticker':'VNM','economicCutoff':'2026-10-30','files':{k:pin(p) for k,p in files.items()},'requiredMetricDispositionSource':{'path':files['MetricMatrix'],'pointer':'/executableMetricRows[ticker=VNM]'},'doNotReopenAcceptedResearch':True,'estimatesBecomeFacts':False,'adoptsFormalRubricPoints':False})
print(json.dumps({'retainedCanonicalFacts':65,'retainedDerivedMetricRows':len(snapshot['derivedMetrics']),'debtSourceReviewPrepared':True,'researchRebuilt':False}))
