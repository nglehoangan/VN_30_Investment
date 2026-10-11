"""Reconcile the exact inspected TCX note 35 cells; retain original OCR exceptions."""
import hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
R=runpy.run_path('scripts/reconcile-08b-extraction.py')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
proofFile=B/'tcx-source-image-reader-proof.json'
proof=json.loads(proofFile.read_text())
assert proof['method']=='CODEX_ASSISTANT_SOURCE_IMAGE_READING'
assert proof['governanceStatus']=='REVIEW_CANDIDATE' and proof['independentHumanApproval'] is None
qs=json.loads((B/'qualifications.json').read_text())
cells=[]
for row in proof['rows']:
 q=next(q for q in qs if q['bodyHash']==row['bodyHash'])
 assert q['ticker']=='TCX' and q['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE'
 assert q['scope']==row['scope'] and q['period']['end']==row['periodEnd']
 assert sha(B/(row['bodyHash']+'.pdf'))==row['bodyHash']
 file=B/'ocr'/f"{row['bodyHash']}-p{row['page']}.json"
 p=json.loads(file.read_text());assert p['engineA']=='APPLE_VISION_ACCURATE_IMAGE_OCR'
 assert p['renderSha256']==row['renderSha256']==sha(pathlib.Path(row['renderFile']))
 text=R['compact'](R['full_text'](p,'passA'))
 assert R['compact'](row['caption']) in text
 assert 'laicobantrencophieu' in text and 'thuyetminhbaocaotaichinh' in text
 numeric=next(w for w in p['passA'] if w['text']==row['currentLexical'])
 assert numeric['confidence']>=.8 and abs(numeric['y']-row['numericTop'])<.001
 headers=[w for w in p['passA'] if w['text']==row['currentHeader'] and row['headerTopMin']<w['y']<row['headerTopMax']]
 assert len(headers)==1 and abs(headers[0]['x']+headers[0]['width']-numeric['x']-numeric['width'])<.01
 if row['itemId']=='BASIC_EPS':assert R['compact']('VND/cổ phiếu') in text
 else:assert any(w['text']=='VND' and .245<w['y']<.27 for w in p['passA'])
 cells.append({'ticker':q['ticker'],'securityId':q['securityId'],'documentId':q['documentId'],
  'bodyHash':row['bodyHash'],'page':row['page'],'itemId':row['itemId'],
  'sourceCaption':row['caption'],'captionAlternative':R['fold'](row['caption']),
  'sourceRowCode':row['rowCode'],'lexicalValue':row['currentLexical'],'verificationLexicalValue':row['currentLexical'],
  'verifiedCanonicalInteger':R['numeric_value'](row['currentLexical']),'unit':row['unit'],'currency':row['currency'],'scope':row['scope'],
  'period':{**q['period'],'start':row['periodStart'],'end':row['periodEnd']},'periodType':row['periodType'],
  'columnX':numeric['x'],'rowY':numeric['y']+numeric['height']/2,
  'extractionMethod':p['engineA'],'verificationMethod':proof['method'],
  'verificationGeometry':'EXACT_NOTE_35_SUBTABLE_CURRENT_DATE_COLUMN_SOURCE_IMAGE_READING',
  'renderSha256':row['renderSha256'],'sourcePageEvidenceHashes':[sha(file),sha(proofFile)],
  'sourceImageProofFile':str(proofFile),'sourceOcrProofFile':str(file),
  'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None})
existing=json.loads((B/'source-image-verified-cells.json').read_text())
existing=[c for c in existing if c['ticker']!='TCX']
(B/'source-image-verified-cells.json').write_text(json.dumps(existing+cells,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'tcxExactInspectedCells':len(cells),'humanApprovalAsserted':False}))
