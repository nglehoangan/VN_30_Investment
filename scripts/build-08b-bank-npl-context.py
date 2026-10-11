"""Retained financial-note NPL context; no new accounting item or formula."""
import datetime,hashlib,json,pathlib,runpy,re
B=pathlib.Path('data/initialization-08b-remediation-work')
R=runpy.run_path('scripts/reconcile-08b-extraction.py')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
qual=json.loads((B/'qualifications.json').read_text())
matrix=json.loads(pathlib.Path('data/initialization-08b-final-review-candidate/review-candidate.json').read_text())['requirementsMatrix']
out=[]
for ticker,body,page,lexical in [('LPB','2d4527bc19aba72b712521d0f2b9b680bff93a5143513da04a83cb97f76b12bf',61,'1,85%'),('VIB','77c0e4cf7c4f5d75899e68f84aa307ad56c817109a5da8a79d7afd1afd1dba6c',63,'2,10%')]:
 q=next(q for q in qual if q['ticker']==ticker and q['bodyHash']==body)
 f=B/'ocr'/f'{body}-p{page}.json';p=json.loads(f.read_text())
 anchors=['30 tháng 6 năm 2026','tỷ lệ nợ xấu theo tình trạng nợ của khách hàng tại Ngân hàng',lexical,'31/12/2025' if ticker=='VIB' else '31 tháng 12 năm 2025']
 for key in ['passA','passB']:
  text=R['compact'](R['full_text'](p,key))
  assert all(R['compact'](a) in text for a in anchors)
  assert any(lexical in re.findall(r'\d+[,.]\d+%',w['text']) and w['confidence']>=.8 for w in p[key])
 proof={'documentId':q['documentId'],'bodyHash':body,'page':page,'sourcePageFile':str(f),'sourcePageSha256':sha(f),'renderSha256':p['renderSha256'],'extractionMethod':p['engineA'],'verificationMethod':p['engineB'],'exactAnchorsInBothReaders':anchors}
 for metric in ['FH-BS-BANK-02','BQ-CASH-BANK']:
  authority=next(m['authority'] for m in matrix['metrics'] if m['metricId']==metric)
  out.append({'id':f'slice08b-{ticker}-{metric}-reviewed-npl-note','ticker':ticker,'securityId':q['securityId'],'metricId':metric,'sourceAsOf':'2026-06-30','reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'CODEX_DATA_PRODUCER_MACHINE_REVIEW','rubricAuthority':authority,'evidence':[proof],'sourceClaims':[{'sourceCaption':'NPL ratio by customer debt status at the bank','lexicalValue':lexical,'valueKind':'REPORTED_NOTE_CONTEXT_NOT_NEW_CANONICAL_ACCOUNTING_FACT'}],'reviewerRationale':'Both independent retained page readers verify the dated issuer NPL ratio. This provides asset-quality and recognition context, but does not establish that its numerator/perimeter equals frozen gross-customer-loan operands. No NPL amount is fabricated by multiplying the ratio. Provision adequacy and off-balance-sheet risk remain separate required reviews.','confidence':'MEDIUM','coverageStatus':'PARTIAL_RUBRIC_EVIDENCE','remainingRequiredContext':['EXACT_NPL_NUMERATOR_AND_PERIMETER','RECOGNITION_AND_RESTRUCTURING_PRACTICES','PROVISIONING_AND_CREDIT_COST_ADEQUACY','ACCRUED_INTEREST_AND_OFF_BALANCE_SHEET_RISK'],'canonicalOperandIds':[],'derivedAssessmentId':None,'score':None,'governanceStatus':'REVIEW_CANDIDATE','approvalReference':None})
(B/'bank-npl-note-context-evidence.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'partialContextPackages':len(out),'newCanonicalFacts':0,'scoringExecuted':False}))
