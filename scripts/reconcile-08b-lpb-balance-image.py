"""Append four actually inspected current LPB balance cells; retain all OCR attempts."""
import datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work');R=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
h='2d4527bc19aba72b712521d0f2b9b680bff93a5143513da04a83cb97f76b12bf';q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==h)
assert q['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' and q['scope']=='SEPARATE_STANDALONE' and q['period']['end']=='2026-06-30' and sha(B/(h+'.pdf'))==h
rows=[];cells=[]
for n,item,lexical,prior,caption,code in [
 (7,'BANK_GROSS_CUSTOMER_LOANS','429.464.738','391.746.491','Cho vay khách hàng','1.'),
 (8,'BANK_CUSTOMER_DEPOSITS','353.513.314','337.583.366','Tiền gửi của khách hàng','III.'),
 (8,'TOTAL_LIABILITIES_SUPPORTING','572.471.987','558.392.040','TỔNG NỢ PHẢI TRẢ',None),
 (8,'TOTAL_EQUITY','43.030.481','47.192.474','TỔNG VỐN CHỦ SỞ HỮU',None)]:
 f=B/'ocr'/f'{h}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256']
 word=next(w for w in p['passA'] if w['text']==lexical);assert word['confidence']>=.8
 definition={'layout':'LPB_CURRENT_CLOSING_BALANCE','currentColumnOrdinal':0,'currentHeader':'Số cuối kỳ','comparativeHeader':'Số đầu kỳ','currentDate':'2026-06-30','currentLexical':lexical,'comparativeLexical':prior,'scopeEvidence':'Qualified standalone issuer report; no consolidation alias.'}
 rows.append({'bodyHash':h,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lexical,'unit':'MILLION_CURRENCY','currency':'VND','scope':q['scope'],'periodType':'INSTANT','periodStart':'2026-06-30','periodEnd':'2026-06-30','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':definition})
 cells.append({'ticker':'LPB','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':h,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':R['fold'](caption),'sourceRowCode':code,'lexicalValue':lexical,'verificationLexicalValue':lexical,'verifiedCanonicalInteger':R['numeric_value'](lexical),'unit':'MILLION_CURRENCY','currency':'VND','scope':q['scope'],'period':{**q['period'],'start':'2026-06-30','end':'2026-06-30','type':'INSTANT'},'periodType':'INSTANT','columnX':word['x'],'rowY':word['y']+word['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':definition,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)})
f=B/'lpb-current-balance-source-image-reader-proof.json';proof={'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'sourceRisk':'Closing equity is 43,030,481 million VND; 47,192,474 belongs to the opening column. Total equity is not mapped to common equity. Gross loans exclude the separately reported allowance and are not the 424,148,666 net subtotal.'};f.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
for c in cells:c.update(sourceImageProofFile=str(f),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(f)])
out=B/'source-image-verified-cells.json';existing=json.loads(out.read_text());existing=[c for c in existing if not(c['bodyHash']==h and c['itemId'] in [r['itemId'] for r in rows])];existing.extend(cells);out.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'verifiedSourceImageCells':len(existing),'newLpbBalanceCells':len(cells),'humanApprovalAsserted':False}))
