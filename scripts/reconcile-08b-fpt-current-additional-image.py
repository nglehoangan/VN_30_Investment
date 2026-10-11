"""Exact FPT reviewed current-column rows inspected on the retained source images."""
import copy, datetime, hashlib, json, pathlib, runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='45636554f28c7e6c2f38458b9a22410ed1f67e80627d672b827019a67f299df8'
ROWS={
 'CURRENT_ASSETS':(8,'45.603.129.033.273','58.137.438.254.908','TÀI SẢN NGẮN HẠN','100','A: TÃI SẢN NGẮN HẠN',.20,.22),
 'RECEIVABLES':(8,'13.337.195.685.489','14.008.456.702.890','Các khoản phải thu ngắn hạn','130','1II. Các khoản phải thu ngắn hạn',.34,.36),
 'INVENTORY':(8,'1.255.307.762.494','2.193.769.802.339','Hàng tồn kho','140','IV. Hàng tồn kho',.45,.47),
 'REVENUE':(12,'26.268.500.667.974','32.682.853.982.527','Doanh thu thuần về bán hàng và cung cấp dịch vụ','10','3 Doanh thu thuân về bản hàng và cung cấp dịch vụ',.23,.25),
 'GROSS_PROFIT':(12,'8.524.634.170.902','12.322.387.947.241','Lợi nhuận gộp về bán hàng và cung cấp dịch vụ','20','5 Lợi nhuặn gộp vẽ bán hãng và cung cấp dịch vụ',.26,.28),
 'NET_INCOME':(12,'5.047.128.933.102','5.335.828.880.987','Lợi nhuận sau thuế thu nhập doanh nghiệp','60','18 Lợi nhuận sau thuế thu nhập doanh nghiệp',.46,.48),
 'BASIC_EPS':(12,'2.967','2.613','Lãi cơ bản trên cổ phiếu','70','19 Lãi cơ bản trên có phiếu',.50,.515),
}

def validate(c,p,r):
 try:
  spec=ROWS[c['itemId']];n,lex,prior,caption,code,raw,lo,hi=spec;d=c['sourceImageColumnDefinition'];stock=c['itemId'] in ['CURRENT_ASSETS','RECEIVABLES','INVENTORY','TOTAL_ASSETS']
  if (c['bodyHash']!=BODY or p['bodyHash']!=BODY or c['page']!=n or p['page']!=n or c['ticker']!='FPT'
      or c['lexicalValue']!=lex or c['verificationLexicalValue']!=lex or c['sourceCaption']!=caption or c['sourceRowCode']!=code
      or c['unit']!=('CURRENCY_PER_SHARE' if c['itemId']=='BASIC_EPS' else 'CURRENCY') or c['currency']!='VND' or c['scope']!='CONSOLIDATED'
      or c['periodType']!=('INSTANT' if stock else 'YTD') or c['period']['start']!=('2026-06-30' if stock else '2026-01-01') or c['period']['end']!='2026-06-30'
      or c['extractionMethod']!=p['engineA'] or p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR'
      or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING' or c['independentHumanApproval'] is not None
      or d!={'layout':'FPT_EXACT_CURRENT_ADDITIONAL_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalCaptionWords':raw,'rowTopLower':lo,'rowTopUpper':hi,'originalSourceWordText':lex}):return False
  current=[w for w in p['passA'] if w['text']==d['originalSourceWordText'] and .60<w['x']<.74 and lo<w['y']<hi and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(current)!=1:return False
  if not any(w['text']==prior and .76<w['x']<.90 and lo<w['y']<hi for w in p['passA']):return False
  if not any(w['text']==code and .48<w['x']<.53 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
  if not any(w['text']==raw and w['x']<.48 and abs(w['y']+w['height']/2-c['rowY'])<.04 for w in p['passA']):return False
  text=r['compact'](r['full_text'](p,'passA'))
  if not all(r['compact'](x) in text for x in ['CÔNG TY CỔ PHẦN FPT','HỢP NHẤT','30 tháng 06 năm 2026','VND']):return False
  if not all(r['compact'](x) in text for x in (['30/06/2026','31/12/2025'] if stock else ['01/01/2026','30/06/2026','01/01/2025','30/06/2025'])):return False
  return r['numeric_value'](lex)==c['verifiedCanonicalInteger']
 except (KeyError,TypeError,ValueError):return False

def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='VAS' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[];negative=0
 for item,spec in ROWS.items():
  n,lex,prior,caption,code,raw,lo,hi=spec;stock=item in ['CURRENT_ASSETS','RECEIVABLES','INVENTORY','TOTAL_ASSETS'];f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256'];region=lex
  w=next(w for w in p['passA'] if w['text']==region and .60<w['x']<.74 and lo<w['y']<hi)
  period={**q['period'],'start':'2026-06-30' if stock else '2026-01-01','type':'INSTANT' if stock else 'YTD'}
  d={'layout':'FPT_EXACT_CURRENT_ADDITIONAL_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalCaptionWords':raw,'rowTopLower':lo,'rowTopUpper':hi,'originalSourceWordText':region}
  c={'ticker':'FPT','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':r['numeric_value'](lex),'unit':'CURRENCY_PER_SHARE' if item=='BASIC_EPS' else 'CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':period['type'],'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,r),item
  for key,value in [('lexicalValue',prior),('sourceRowCode','141' if stock else '01'),('scope','SEPARATE_STANDALONE'),('unit','MILLION_CURRENCY'),('columnX',.74),('verifiedCanonicalInteger','0')]:
   bad=copy.deepcopy(c);bad[key]=value;assert not validate(bad,p,r);negative+=1
  cells.append(c);rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lex,'unit':'CURRENCY_PER_SHARE' if item=='BASIC_EPS' else 'CURRENCY','currency':'VND','scope':'CONSOLIDATED','periodType':period['type'],'periodStart':period['start'],'periodEnd':period['end'],'renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d})
 proof=B/'fpt-current-additional-source-image-reader-proof.json';proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Source images actually inspected. Net revenue is code 10, not gross revenue code 01. Inventory is net carrying amount code 140, not gross code 141. Receivables are the reported short-term aggregate code 130; composition remains required rubric context. Original literal OCR caption errors remain in the proof. Current 2026 figures retain the FTEL consolidation-perimeter break; prior figures are not asserted as constant-perimeter comparables or used for a naive TTM join. EPS is source row 70, not diluted row 71. No comparative values, common profit/equity, unrestricted cash or normalized operands inferred.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[c for c in old if not(c['bodyHash']==BODY and c['itemId'] in ROWS)];out.write_text(json.dumps(old+cells,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'ticker':'FPT','sourceImageCells':len(cells),'negativeControls':negative}))
if __name__=='__main__':main()
