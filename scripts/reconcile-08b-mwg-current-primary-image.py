"""Exact MWG reviewed current-column rows inspected on the retained source images."""
import copy, datetime, hashlib, json, pathlib, runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='41350653181ec9248619dcc8ec090f97a988ed9413aa313cb08c1f0a161b4450'
ROWS={
 'TOTAL_ASSETS':(8,'104.914.963.643.071','83.945.619.612.034','TỔNG CỘNG TÀI SẢN','280','TỔNG CỘNG TÀI SẢN',.59,.61),
 'CFI_SUPPORTING':(12,'(3.054.891.746.801)','(7.254.715.193.537)','Lưu chuyển tiền thuần từ hoạt động đầu tư','30','Lưu chuyển tiền thuần từ',.87,.89),
 'CURRENT_ASSETS':(7,'97.732.971.951.408','77.201.650.782.966','TÀI SẢN NGẮN HẠN','100','A. TÀI SẢN NGÂN HẠN',.20,.23),
 'RECEIVABLES':(7,'2.434.312.355.641','2.172.981.816.979','Các khoản phải thu ngắn hạn','130','III. Các khoản phải thu ngắn hạn',.35,.375),
 'INVENTORY':(7,'30.874.909.197.649','27.266.851.974.258','Hàng tồn kho','140','IV. Hàng tồn kho',.45,.47),
 'REVENUE':(10,'95.213.235.578.730','73.754.927.078.179','Doanh thu thuần về bán hàng và cung cấp dịch vụ','10','* on t nhn ự bán hng vsa',.29,.32),
 'GROSS_PROFIT':(10,'20.519.311.511.427','14.769.111.275.361','Lợi nhuận gộp về bán hàng và cung cấp dịch vụ','20','5. Lợi nhuận gộp về bán hàng và',.38,.40),
}
def validate(c,p,r):
 try:
  spec=ROWS[c['itemId']];n,lex,prior,caption,code,raw,lo,hi=spec;d=c['sourceImageColumnDefinition'];stock=c['itemId'] in ['CURRENT_ASSETS','RECEIVABLES','INVENTORY','TOTAL_ASSETS']
  if (c['bodyHash']!=BODY or p['bodyHash']!=BODY or c['page']!=n or p['page']!=n or c['ticker']!='MWG'
      or c['lexicalValue']!=lex or c['verificationLexicalValue']!=lex or c['sourceCaption']!=caption or c['sourceRowCode']!=code
      or c['unit']!='CURRENCY' or c['currency']!='VND' or c['scope']!='CONSOLIDATED'
      or c['periodType']!=('INSTANT' if stock else 'YTD') or c['period']['start']!=('2026-06-30' if stock else '2026-01-01') or c['period']['end']!='2026-06-30'
      or c['extractionMethod']!=p['engineA'] or p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR'
      or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING' or c['independentHumanApproval'] is not None
      or d!={'layout':'MWG_EXACT_CURRENT_PRIMARY_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalCaptionWords':raw,'rowTopLower':lo,'rowTopUpper':hi,'originalSourceWordText':lex+' '+prior if c['itemId'] in ['REVENUE','GROSS_PROFIT'] else lex}):return False
  current=[w for w in p['passA'] if w['text']==d['originalSourceWordText'] and .53<w['x']<.61 and lo<w['y']<hi and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(current)!=1:return False
  if stock and not any(w['text']==prior and .70<w['x']<.79 and lo<w['y']<hi for w in p['passA']):return False
  if not any(w['text']==code and .42<w['x']<.47 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
  if not any(w['text']==raw and w['x']<.42 and abs(w['y']+w['height']/2-c['rowY'])<.04 for w in p['passA']):return False
  text=r['compact'](r['full_text'](p,'passA'))
  if not all(r['compact'](x) in text for x in ['Công ty Cổ phần Đầu tư Thế Giới Di Động','HỢP NHẤT','30 tháng 6 năm 2026','VND']):return False
  if not all(r['compact'](x) in text for x in (['Số cuối kỳ','Số đầu kỳ'] if stock else ['Kỳ này','Kỳ trước','sáu tháng'])):return False
  return r['numeric_value'](lex)==c['verifiedCanonicalInteger']
 except (KeyError,TypeError,ValueError):return False

def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='VAS' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[];negative=0
 for item,spec in ROWS.items():
  n,lex,prior,caption,code,raw,lo,hi=spec;stock=item in ['CURRENT_ASSETS','RECEIVABLES','INVENTORY','TOTAL_ASSETS'];f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256'];region=lex+' '+prior if item in ['REVENUE','GROSS_PROFIT'] else lex
  w=next(w for w in p['passA'] if w['text']==region and .53<w['x']<.61 and lo<w['y']<hi)
  period={**q['period'],'start':'2026-06-30' if stock else '2026-01-01','type':'INSTANT' if stock else 'YTD'}
  d={'layout':'MWG_EXACT_CURRENT_PRIMARY_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalCaptionWords':raw,'rowTopLower':lo,'rowTopUpper':hi,'originalSourceWordText':region}
  c={'ticker':'MWG','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':r['numeric_value'](lex),'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':period['type'],'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,r),item
  for key,value in [('lexicalValue',prior),('sourceRowCode','141' if stock else '01'),('scope','SEPARATE_STANDALONE'),('unit','MILLION_CURRENCY'),('columnX',.74),('verifiedCanonicalInteger','0')]:
   bad=copy.deepcopy(c);bad[key]=value;assert not validate(bad,p,r);negative+=1
  cells.append(c);rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lex,'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','periodType':period['type'],'periodStart':period['start'],'periodEnd':period['end'],'renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d})
 proof=B/'mwg-current-primary-source-image-reader-proof.json';proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Source images actually inspected. Net revenue is code 10, not gross revenue code 01. Inventory is net carrying amount code 140, not gross code 141. Receivables are the reported short-term aggregate code 130; composition remains required rubric context. Grouped original OCR regions retain their actual coordinates; no artificial per-number boxes. No comparative values, common profit/equity, unrestricted cash or normalized operands inferred.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[c for c in old if not(c['bodyHash']==BODY and c['itemId'] in ROWS)];out.write_text(json.dumps(old+cells,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'ticker':'MWG','sourceImageCells':len(cells),'negativeControls':negative}))
if __name__=='__main__':main()
