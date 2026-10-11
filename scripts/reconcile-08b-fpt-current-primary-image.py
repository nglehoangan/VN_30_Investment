"""Actual inspected current FPT reviewed primary-statement cells, no derived values."""
import datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work');R=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
h='45636554f28c7e6c2f38458b9a22410ed1f67e80627d672b827019a67f299df8';q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==h)
assert q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['period']['end']=='2026-06-30'
rows=[];cells=[]
for n,item,lexical,prior,caption,code in [
 (9,'TOTAL_ASSETS','73.563.105.859.500','88.141.991.634.625','TỔNG CỘNG TÀI SẢN','280'),
 (10,'TOTAL_LIABILITIES_SUPPORTING','32.567.425.051.243','44.393.950.887.086','NỢ PHẢI TRẢ','300'),
 (13,'CFO','(1.145.666.005.788)','1.683.573.278.329','Lưu chuyển tiền thuần từ/(sử dụng vào) hoạt động kinh doanh','20'),
 (13,'CFI_SUPPORTING','(3.771.904.822.508)','(7.233.991.769.335)','Lưu chuyển tiền thuần từ/(sử dụng vào) hoạt động đầu tư','30'),
 (13,'CASH_CAPEX_REPORTED','(1.336.483.237.731)','(3.295.258.865.719)','Tiền chi mua sắm, xây dựng tài sản cố định và các tài sản dài hạn khác','21'),
 (14,'CFF_SUPPORTING','3.280.653.657.460','6.254.833.006.729','Lưu chuyển tiền thuần từ/(sử dụng vào) hoạt động tài chính','40'),
 (14,'NET_CASH_CHANGE_SUPPORTING','(1.636.917.170.836)','704.414.515.723','Lưu chuyển tiền và tương đương tiền thuần trong kỳ','50')]:
 f=B/'ocr'/f'{h}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256']
 raw='73.563.105 859 500' if item=='TOTAL_ASSETS' else lexical
 word=next(w for w in p['passA'] if w['text']==raw);assert word['confidence']>=.8
 stock=n in [9,10];start='2026-06-30' if stock else '2026-01-01';type='INSTANT' if stock else 'YTD'
 definition={'layout':'FPT_CURRENT_REVIEWED_PRIMARY','currentColumnOrdinal':0,'currentHeader':'30/06/2026' if stock else '01/01/2026–30/06/2026','comparativeHeader':'31/12/2025' if stock else '01/01/2025–30/06/2025','currentLexical':lexical,'comparativeLexical':prior,'originalSourceWordText':raw,'statementRowCode':code}
 rows.append({'bodyHash':h,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lexical,'unit':'CURRENCY','currency':'VND','scope':q['scope'],'periodType':type,'periodStart':start,'periodEnd':'2026-06-30','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':definition})
 cells.append({'ticker':'FPT','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':h,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':R['fold'](caption),'sourceRowCode':code,'lexicalValue':lexical,'verificationLexicalValue':lexical,'verifiedCanonicalInteger':R['numeric_value'](lexical),'unit':'CURRENCY','currency':'VND','scope':q['scope'],'period':{**q['period'],'start':start,'end':'2026-06-30','type':type},'periodType':type,'columnX':word['x'],'rowY':word['y']+word['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':definition,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)})
f=B/'fpt-current-primary-source-image-reader-proof.json';f.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'sourceRisk':'Actual current reviewed June 2026 consolidated statement columns. Original OCR disagreements/spacing preserved. Negative CFO and CFI are reported amounts. Fixed asset/long-term-asset payments are not automatically qualifying maintenance/growth CAPEX. FTEL consolidation perimeter changed; no naive history/TTM normalization.'},ensure_ascii=False,indent=2)+'\n')
for c in cells:c.update(sourceImageProofFile=str(f),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(f)])
out=B/'source-image-verified-cells.json';existing=json.loads(out.read_text());existing=[c for c in existing if not(c['bodyHash']==h and c['itemId'] in [r['itemId'] for r in rows])];existing.extend(cells);out.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'sourceImageCells':len(existing),'newFptCells':len(cells)}))
