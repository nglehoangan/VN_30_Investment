"""Six exact cells read from retained BID current statement images, pages 8/9/11."""
import datetime, hashlib, json, pathlib, runpy

B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='3c3f6c39c9ca9f737c3d8d52893d7320be29dbb1a4bcecfdf062fad2b45106d2'
ROWS={
 'BANK_GROSS_CUSTOMER_LOANS':(8,'2.501.807.043','2.372.955.074','Cho vay khách hàng','1.'),
 'BANK_CUSTOMER_DEPOSITS':(9,'2.261.489.130','2.222.991.628','Tiền gửi của khách hàng','III.'),
 'BANK_NET_INTEREST_INCOME':(11,'33.537.974','28.937.315','Thu nhập lãi thuần','I.'),
 'BANK_NET_FEE_INCOME':(11,'3.583.997','3.425.590','Lãi thuần từ hoạt động dịch vụ','II.'),
 'BANK_OPERATING_EXPENSES':(11,'(14.111.906)','(13.272.410)','Tổng chi phí hoạt động','VIII.'),
 'BASIC_EPS':(11,'2.081','1.787','Lãi cơ bản trên mỗi cổ phiếu (VND/cổ phiếu)',None),
}

def validate(c,p,r):
 try:
  expected=ROWS.get(c['itemId'])
  if not expected or (c['page'],c['lexicalValue'],c['sourceImageColumnDefinition']['comparativeLexical'],c['sourceCaption'],c['sourceRowCode'])!=expected:return False
  if c['bodyHash']!=BODY or p['bodyHash']!=BODY or p['page']!=c['page'] or c['ticker']!='BID' or c['scope']!='CONSOLIDATED' or c['currency']!='VND':return False
  stock=c['page'] in [8,9];unit='CURRENCY_PER_SHARE' if c['itemId']=='BASIC_EPS' else 'MILLION_CURRENCY'
  if c['unit']!=unit or c['periodType']!=('INSTANT' if stock else 'YTD') or c['period']['start']!=('2026-06-30' if stock else '2026-01-01') or c['period']['end']!='2026-06-30':return False
  if c['extractionMethod']!=p['engineA'] or p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR' or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING':return False
  definition=c['sourceImageColumnDefinition']
  if definition['layout']!='BID_EXACT_CURRENT_PRIMARY' or definition['currentColumnOrdinal']!=0 or definition['currentHeader']!=('Số cuối kỳ' if stock else 'Kỳ này') or definition['comparativeHeader']!=('Số đầu kỳ' if stock else 'Kỳ trước'):return False
  text=r['compact'](r['full_text'](p,'passA'))
  if not all(r['compact'](s) in text for s in ['hợp nhất','30 tháng 6 năm 2026','Đơn vị: Triệu VND',definition['currentHeader'],definition['comparativeHeader']]):return False
  current=[w for w in p['passA'] if w['text']==c['lexicalValue'] and .65<w['x']<.76 and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(current)!=1 or not any(w['text']==expected[2] and .8<w['x']<.92 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
  nearby=[w for w in p['passA'] if .20<w['x']<.54 and abs(w['y']+w['height']/2-c['rowY'])<.014]
  if r['compact'](c['sourceCaption']) not in r['compact'](' '.join(w['text'] for w in nearby)):return False
  if stock:
   h=r['stock_date_columns'](r['lines'](p['passA']),c['rowY'],'2026-06-30')
   if not h or min(abs(current[0]['x']+current[0]['width']/2-x) for x in h['positions'])>=.075:return False
  else:
   if r['compact']('Cho kỳ hoạt động 6 tháng kết thúc ngày 30 tháng 6 năm 2026') not in text:return False
  if c['itemId']=='BANK_GROSS_CUSTOMER_LOANS':
   if not any(w['text']=='1.' and w['x']<.2 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
   if not all(s in text for s in [r['compact']('2.467.112.319'),r['compact']('(34.694.724)')]):return False
  return r['numeric_value'](c['lexicalValue'])==c['verifiedCanonicalInteger']
 except (KeyError,TypeError,ValueError):return False

def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='VAS' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[]
 for item,(n,lexical,prior,caption,code) in ROWS.items():
  f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256']
  w=next(w for w in p['passA'] if w['text']==lexical and .65<w['x']<.76)
  stock=n in [8,9];period={**q['period'],'start':'2026-06-30' if stock else '2026-01-01','type':'INSTANT' if stock else 'YTD'}
  definition={'layout':'BID_EXACT_CURRENT_PRIMARY','currentColumnOrdinal':0,'currentHeader':'Số cuối kỳ' if stock else 'Kỳ này','comparativeHeader':'Số đầu kỳ' if stock else 'Kỳ trước','currentLexical':lexical,'comparativeLexical':prior}
  c={'ticker':'BID','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lexical,'verificationLexicalValue':lexical,'verifiedCanonicalInteger':r['numeric_value'](lexical),'unit':'CURRENCY_PER_SHARE' if item=='BASIC_EPS' else 'MILLION_CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':period['type'],'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':definition,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,r),item
  rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lexical,'unit':c['unit'],'currency':'VND','scope':'CONSOLIDATED','periodType':period['type'],'periodStart':period['start'],'periodEnd':period['end'],'renderSha256':p['renderSha256'],'sourceImageColumnDefinition':definition})
  cells.append(c)
 proof=B/'bid-current-primary-source-image-reader-proof.json'
 proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['All original OCR errors retained. Printed loan subrow 1 is gross; section VI is net of allowance. Operating expense keeps its reported negative sign. Parent profit and total equity are not common-shareholder aliases. EPS is reported six-month EPS, not annualized.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';existing=json.loads(out.read_text());existing=[c for c in existing if not(c['bodyHash']==BODY and c['itemId'] in ROWS)]
 out.write_text(json.dumps(existing+cells,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'issuer':'BID','newSourceImageCells':len(cells),'independentHumanApproval':None}))

if __name__=='__main__':main()
