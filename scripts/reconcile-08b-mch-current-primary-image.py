"""Exact MCH reviewed current-column rows inspected on the retained source images."""
import copy, datetime, hashlib, json, pathlib, runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='4974b488d0511d3d80619912a8e2e9ad06bcb3bb4b416876bfcd4800ae2c1082'
ROWS={
 'REVENUE':(10,'15.637.265.320.503','13.764.499.589.986','Doanh thu thuần bán hàng và cung cấp dịch vụ','10','Doanh thu thuần bán hàng và cung cấp',.31,.34),
 'GROSS_PROFIT':(10,'7.149.487.477.422','6.268.843.186.669','Lợi nhuận gộp về bán hàng và cung cấp dịch vụ','20','Lợi nhuận gộp về bán hàng và cung cấp',.38,.40),
 'NET_INCOME':(10,'3.284.402.974.537','2.961.478.567.260','Lợi nhuận sau thuế TNDN','60','Lợi nhuận sau thuế TNDN',.74,.77),
}

def validate(c,p,r):
 try:
  spec=ROWS[c['itemId']];n,lex,prior,caption,code,raw,lo,hi=spec;d=c['sourceImageColumnDefinition'];stock=c['itemId'] in ['CURRENT_ASSETS','RECEIVABLES','INVENTORY','TOTAL_ASSETS']
  if (c['bodyHash']!=BODY or p['bodyHash']!=BODY or c['page']!=n or p['page']!=n or c['ticker']!='MCH'
      or c['lexicalValue']!=lex or c['verificationLexicalValue']!=lex or c['sourceCaption']!=caption or c['sourceRowCode']!=code
      or c['unit']!='CURRENCY' or c['currency']!='VND' or c['scope']!='CONSOLIDATED'
      or c['periodType']!=('INSTANT' if stock else 'YTD') or c['period']['start']!=('2026-06-30' if stock else '2026-01-01') or c['period']['end']!='2026-06-30'
      or c['extractionMethod']!=p['engineA'] or p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR'
      or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING' or c['independentHumanApproval'] is not None
      or d!={'layout':'MCH_EXACT_CURRENT_PRIMARY_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalCaptionWords':raw,'rowTopLower':lo,'rowTopUpper':hi,'originalSourceWordText':lex+' '+prior if c['itemId'] in ['REVENUE'] else lex}):return False
  current=[w for w in p['passA'] if w['text']==d['originalSourceWordText'] and .58<w['x']<.67 and lo<w['y']<hi and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(current)!=1:return False
  if stock and not any(w['text']==prior and .75<w['x']<.84 and lo<w['y']<hi for w in p['passA']):return False
  if not any(w['text']==code and .48<w['x']<.52 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
  if not any(w['text']==raw and w['x']<.48 and abs(w['y']+w['height']/2-c['rowY'])<.04 for w in p['passA']):return False
  text=r['compact'](r['full_text'](p,'passA'))
  if not all(r['compact'](x) in text for x in ['Công ty Cổ phần Hàng tiêu dùng Masan','hợp nhất','30 tháng 6 năm 2026','VND']):return False
  if not all(r['compact'](x) in text for x in (['Số cuối kỳ','Số đầu kỳ'] if stock else ['30/6/2026','30/6/2025','sáu tháng'])):return False
  return r['numeric_value'](lex)==c['verifiedCanonicalInteger']
 except (KeyError,TypeError,ValueError):return False

def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='VAS' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[];negative=0
 for item,spec in ROWS.items():
  n,lex,prior,caption,code,raw,lo,hi=spec;stock=item in ['CURRENT_ASSETS','RECEIVABLES','INVENTORY','TOTAL_ASSETS'];f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256'];region=lex+' '+prior if item in ['REVENUE'] else lex
  w=next(w for w in p['passA'] if w['text']==region and .58<w['x']<.67 and lo<w['y']<hi)
  period={**q['period'],'start':'2026-06-30' if stock else '2026-01-01','type':'INSTANT' if stock else 'YTD'}
  d={'layout':'MCH_EXACT_CURRENT_PRIMARY_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalCaptionWords':raw,'rowTopLower':lo,'rowTopUpper':hi,'originalSourceWordText':region}
  c={'ticker':'MCH','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':r['numeric_value'](lex),'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':period['type'],'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,r),item
  for key,value in [('lexicalValue',prior),('sourceRowCode','141' if stock else '01'),('scope','SEPARATE_STANDALONE'),('unit','MILLION_CURRENCY'),('columnX',.74),('verifiedCanonicalInteger','0')]:
   bad=copy.deepcopy(c);bad[key]=value;assert not validate(bad,p,r);negative+=1
  cells.append(c);rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lex,'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','periodType':period['type'],'periodStart':period['start'],'periodEnd':period['end'],'renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d})
 proof=B/'mch-current-primary-source-image-reader-proof.json';proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Source images actually inspected. Net revenue is code 10, not gross revenue code 01. Total net profit is code 60 and includes NCI; it is not aliased to common profit. Reclassified prior columns are retained only as column anchors. Grouped original OCR regions retain their actual coordinates; no artificial per-number boxes. No comparative values, common profit/equity, unrestricted cash or normalized operands inferred.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[c for c in old if not(c['bodyHash']==BODY and c['itemId'] in ROWS)];out.write_text(json.dumps(old+cells,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'ticker':'MCH','sourceImageCells':len(cells),'negativeControls':negative}))
if __name__=='__main__':main()
