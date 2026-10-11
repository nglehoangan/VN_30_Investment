"""Three actually inspected TCX current primary cells, without consolidated fallback."""
import datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='6c781b57b01326ac7dc6c347ef7c5d79b403536c089ddb4956a8aaaa68ba5b37'
ROWS={
 'TOTAL_ASSETS':(8,'100.592.059.821.282','80.632.256.999.009','TỔNG CỘNG TÀI SẢN (270 = 100 + 200)','270'),
 'CFF_SUPPORTING':(15,'17.164.732.877.510','9.781.877.970.105','Lưu chuyển tiền thuần từ hoạt động tài chính','80'),
 'NET_CASH_CHANGE_SUPPORTING':(15,'3.046.427.024.247','133.001.141.426','TĂNG TIỀN THUẦN TRONG KỲ (90 = 60 + 70 + 80)','90'),
}
def validate(c,p,r):
 try:
  expected=ROWS.get(c['itemId']);d=c['sourceImageColumnDefinition'];stock=c['itemId']=='TOTAL_ASSETS'
  if not expected or (c['page'],c['lexicalValue'],d['comparativeLexical'],c['sourceCaption'],c['sourceRowCode'])!=expected:return False
  if c['bodyHash']!=BODY or p['bodyHash']!=BODY or p['page']!=c['page'] or c['ticker']!='TCX' or c['scope']!='SEPARATE_STANDALONE' or c['unit']!='CURRENCY' or c['currency']!='VND':return False
  if c['periodType']!=('INSTANT' if stock else 'YTD') or c['period']['start']!=('2026-06-30' if stock else '2026-01-01') or c['period']['end']!='2026-06-30':return False
  if p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR' or c['extractionMethod']!=p['engineA'] or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING':return False
  if d['layout']!='TCX_EXACT_STANDALONE_CURRENT_PRIMARY' or d['currentColumnOrdinal']!=0 or d['currentHeader']!='30/06/2026' or d['comparativeHeader']!=('31/12/2025' if stock else '30/06/2025'):return False
  current=[w for w in p['passA'] if w['text']==c['lexicalValue'] and .55<w['x']<.74 and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(current)!=1 or not any(w['text']==expected[2] and w['x']>.72 and w['x']+w['width']/2>.79 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
  if not any(w['text']==expected[4] and .42<w['x']<.52 and abs(w['y']+w['height']/2-c['rowY'])<.025 for w in p['passA']):return False
  text=r['compact'](r['full_text'](p,'passA'))
  if not all(r['compact'](t) in text for t in ['Công ty Cổ phần Chứng khoán Kỹ Thương','giữa niên độ','30/06/2026',d['comparativeHeader'],'VND']):return False
  if not stock and r['compact']('Cho kỳ sáu tháng kết thúc ngày 30 tháng 6 năm 2026') not in text:return False
  return r['numeric_value'](c['lexicalValue'])==c['verifiedCanonicalInteger'] and d['currentLexical']==c['lexicalValue']
 except (KeyError,TypeError,ValueError):return False
def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' and q['scope']=='SEPARATE_STANDALONE' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='VAS' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[]
 for item,(n,lexical,prior,caption,code) in ROWS.items():
  f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256']
  w=next(w for w in p['passA'] if w['text']==lexical and .55<w['x']<.74)
  stock=n==8;period={**q['period'],'start':'2026-06-30' if stock else '2026-01-01','type':'INSTANT' if stock else 'YTD'}
  definition={'layout':'TCX_EXACT_STANDALONE_CURRENT_PRIMARY','currentColumnOrdinal':0,'currentHeader':'30/06/2026','comparativeHeader':'31/12/2025' if stock else '30/06/2025','currentLexical':lexical,'comparativeLexical':prior}
  c={'ticker':'TCX','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lexical,'verificationLexicalValue':lexical,'verifiedCanonicalInteger':r['numeric_value'](lexical),'unit':'CURRENCY','currency':'VND','scope':'SEPARATE_STANDALONE','period':period,'periodType':period['type'],'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':definition,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,r),item
  rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lexical,'unit':'CURRENCY','currency':'VND','scope':c['scope'],'periodType':period['type'],'periodStart':period['start'],'periodEnd':period['end'],'renderSha256':p['renderSha256'],'sourceImageColumnDefinition':definition});cells.append(c)
 proof=B/'tcx-current-primary-source-image-reader-proof.json'
 proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Qualified standalone scope is preserved. No absence-of-subsidiaries assertion or consolidated-input fallback is established. Printed 90=60+70+80 is the cash-flow subtotal, not the ending cash amount. Source OCR remains unchanged.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';existing=json.loads(out.read_text());existing=[c for c in existing if not(c['bodyHash']==BODY and c['itemId'] in ROWS)]
 out.write_text(json.dumps(existing+cells,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'issuer':'TCX','newSourceImageCells':len(cells),'scope':'SEPARATE_STANDALONE'}))
if __name__=='__main__':main()
