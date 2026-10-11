"""Inspect exact HDB current gross-loan, final-CFO and common-profit rows."""
import datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='e0f1e5e3ef5d3658643ea7a67754b51b3e97481e9efdd4b90c142bb5e141742a'
ROWS={
 'BANK_GROSS_CUSTOMER_LOANS':(7,'659.000.255','546.370.779','Cho vay khách hàng','1',['1. Cho vay khách hàng'],.43,.45),
 'CFO':(11,'(21.572.391)','(1,700,518)','Lưu chuyển tiền thuần từ hoạt động kinh doanh','I',['Lưu chuyển tiền thuần từ hoạt động kinh doanh'],.73,.76),
 'NET_INCOME_ATTRIBUTABLE_COMMON':(51,'10.322.018','7.749.614','Lợi nhuận sau thuế phân bổ cho cổ đông sở hữu cổ phiếu phổ thông','38',['Lợi nhuận sau thuế phân bổ cho cổ đông sở hữu','cô phiếu phố thông'],.775,.8)}
def validate(c,p,r):
 try:
  spec=ROWS.get(c['itemId']);d=c['sourceImageColumnDefinition']
  if not spec or (c['page'],c['lexicalValue'],d['comparativeOriginalOcrLexical'],c['sourceCaption'],c['sourceRowCode'],d['originalCaptionWords'],d['rowTopLower'],d['rowTopUpper'])!=spec:return False
  stock=c['itemId']=='BANK_GROSS_CUSTOMER_LOANS'
  if c['ticker']!='HDB' or c['bodyHash']!=BODY or p['bodyHash']!=BODY or p['page']!=c['page'] or c['scope']!='CONSOLIDATED' or c['unit']!='MILLION_CURRENCY' or c['currency']!='VND':return False
  if c['periodType']!=('INSTANT' if stock else 'YTD') or c['period']['start']!=('2026-06-30' if stock else '2026-01-01') or c['period']['end']!='2026-06-30':return False
  if p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR' or c['extractionMethod']!=p['engineA'] or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING' or c['independentHumanApproval'] is not None:return False
  if d['layout']!='HDB_EXACT_CURRENT_PRIMARY_AND_COMMON_NOTE' or d['currentColumnOrdinal']!=0 or d['currentLexical']!=c['lexicalValue'] or c['comparativeColumn'] is not False:return False
  current=[w for w in p['passA'] if w['text']==c['lexicalValue'] and .64<w['x']<.76 and spec[6]<w['y']<spec[7] and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(current)!=1:return False
  if not any(w['text']==spec[2] and w['x']>.8 and spec[6]<w['y']<spec[7] for w in p['passA']):return False
  if not all(any(w['text']==a and w['x']<.62 and abs(w['y']+w['height']/2-c['rowY'])<.028 for w in p['passA']) for a in spec[5]):return False
  text=r['compact'](r['full_text'](p,'passA'));top=r['compact'](' '.join(w['text'] for w in p['passA'] if w['y']<.2))
  if not all(r['compact'](a) in top for a in ['NGÂN HÀNG THƯƠNG MẠI','PHÁT TRIỂN','THÀNH PHỐ HỒ CHÍ MINH','HỢP NHẤT']):return False
  if c['page'] in [7,11] and r['compact']('30 tháng 6 năm 2026') not in top:return False
  if stock:
   if not all(r['compact'](a) in text for a in ['Số cuối kỳ','Số đầu kỳ','Triệu VND']):return False
   if not any(w['text']=='11' and .55<w['x']<.6 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
  else:
   if not all(r['compact'](a) in text for a in ['Kỳ này','Kỳ trước','Triệu VND']):return False
   if c['page']==51 and not all(r['compact'](a) in text for a in ['38','LÃI CƠ BẢN TRÊN CỔ PHIẾU','cổ phiếu phổ thông của Ngân hàng','trái phiếu chuyển đổi']):return False
   if c['page']==11 and not any(w['text']=='I.' and w['x']<.17 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
  return r['numeric_value'](c['lexicalValue'])==c['verifiedCanonicalInteger']
 except (KeyError,TypeError,ValueError):return False
def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' and q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='VAS' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[]
 for item,(n,lex,prior,caption,code,raw,low,high) in ROWS.items():
  f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256'];w=next(w for w in p['passA'] if w['text']==lex and .64<w['x']<.76 and low<w['y']<high)
  stock=item=='BANK_GROSS_CUSTOMER_LOANS';period={**q['period'],'start':'2026-06-30' if stock else '2026-01-01','type':'INSTANT' if stock else 'YTD'};d={'layout':'HDB_EXACT_CURRENT_PRIMARY_AND_COMMON_NOTE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalCaptionWords':raw,'rowTopLower':low,'rowTopUpper':high}
  c={'ticker':'HDB','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':r['numeric_value'](lex),'unit':'MILLION_CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':period['type'],'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)};assert validate(c,p,r),item
  rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lex,'unit':c['unit'],'currency':'VND','scope':'CONSOLIDATED','periodType':period['type'],'periodStart':period['start'],'periodEnd':period['end'],'renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d});cells.append(c)
 proof=B/'hdb-current-primary-source-image-reader-proof.json';proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Exact source images were inspected. Gross loans are the 659,000,255-million row before reserves, not the 649,803,170-million net row. CFO is the final subtotal after working-capital movements, not the 14,378,607-million pre-change subtotal. Common profit is the explicit ordinary-shareholder allocation on note 38, distinct from the diluted numerator and total profit including NCI. Reported common profit is not normalized profit. No comparative facts, common equity, end-of-period shares or zero fund allocation are inferred.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[c for c in old if not(c['bodyHash']==BODY and c['itemId'] in ROWS)];out.write_text(json.dumps(old+cells,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'ticker':'HDB','sourceImageCells':len(cells)}))
if __name__=='__main__':main()
