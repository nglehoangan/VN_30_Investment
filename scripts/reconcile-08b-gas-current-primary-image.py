"""Exact GAS source-image rows with original missing-caption exception retained."""
import copy, datetime, hashlib, json, pathlib, runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='a90c4b06b6fa67215ee83247c8f2ea7b5cf8bdba8cc968b226e52c55ce568886'
ROWS={
 'CURRENT_LIABILITIES':(9,'27.504.885.450.553','20.573.719.389.418','Nợ ngắn hạn','310',None,.21,.23),
 'NET_INCOME':(10,'9.025.674.760.340','7.571.381.524.975','Lợi nhuận sau thuế thu nhập doanh nghiệp','60',', Lợi nhuận sau thuế thu nhập',.60,.62),
}

def validate(c,p,r):
 try:
  spec=ROWS[c['itemId']];n,lex,prior,caption,code,raw,lo,hi=spec;d=c['sourceImageColumnDefinition'];stock=c['itemId'] in ['CURRENT_LIABILITIES']
  if (c['bodyHash']!=BODY or p['bodyHash']!=BODY or c['page']!=n or p['page']!=n or c['ticker']!='GAS'
      or c['lexicalValue']!=lex or c['verificationLexicalValue']!=lex or c['sourceCaption']!=caption or c['sourceRowCode']!=code
      or c['unit']!='CURRENCY' or c['currency']!='VND' or c['scope']!='CONSOLIDATED'
      or c['periodType']!=('INSTANT' if stock else 'YTD') or c['period']['start']!=('2026-06-30' if stock else '2026-01-01') or c['period']['end']!='2026-06-30'
      or c['extractionMethod']!=p['engineA'] or p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR'
      or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING' or c['independentHumanApproval'] is not None
      or d!={'layout':'GAS_EXACT_CURRENT_PRIMARY_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalCaptionWords':raw,'rowTopLower':lo,'rowTopUpper':hi,'originalSourceWordText':lex+' '+prior if False else lex}):return False
  current=[w for w in p['passA'] if w['text']==d['originalSourceWordText'] and .58<w['x']<.67 and lo<w['y']<hi and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(current)!=1:return False
  if stock and not any(w['text']==prior and .75<w['x']<.84 and lo<w['y']<hi for w in p['passA']):return False
  if not any(w['text']==code and .46<w['x']<.52 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
  if raw is not None and not any(w['text']==raw and w['x']<.48 and abs(w['y']+w['height']/2-c['rowY'])<.04 for w in p['passA']):return False
  text=r['compact'](r['full_text'](p,'passA'))
  if not all(r['compact'](x) in text for x in ['TỔNG CÔNG TY KHÍ VIỆT NAM','HỢP NHẤT','30 tháng 6 năm 2026','VND']):return False
  if not all(r['compact'](x) in text for x in (['Số cuối kỳ','Số đầu kỳ'] if stock else ['Kỳ này','Kỳ trước','6 tháng kết thúc ngày 30 tháng 6 năm 2026'])):return False
  return r['numeric_value'](lex)==c['verifiedCanonicalInteger']
 except (KeyError,TypeError,ValueError):return False

def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='UNKNOWN' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[];negative=0
 for item,spec in ROWS.items():
  n,lex,prior,caption,code,raw,lo,hi=spec;stock=item in ['CURRENT_LIABILITIES'];f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256'];region=lex+' '+prior if False else lex
  w=next(w for w in p['passA'] if w['text']==region and .58<w['x']<.67 and lo<w['y']<hi)
  period={**q['period'],'start':'2026-06-30' if stock else '2026-01-01','type':'INSTANT' if stock else 'YTD'}
  d={'layout':'GAS_EXACT_CURRENT_PRIMARY_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalCaptionWords':raw,'rowTopLower':lo,'rowTopUpper':hi,'originalSourceWordText':region}
  c={'ticker':'GAS','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':r['numeric_value'](lex),'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':period['type'],'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,r),item
  for key,value in [('lexicalValue',prior),('sourceRowCode','141' if stock else '01'),('scope','SEPARATE_STANDALONE'),('unit','MILLION_CURRENCY'),('columnX',.74),('verifiedCanonicalInteger','0')]:
   bad=copy.deepcopy(c);bad[key]=value;assert not validate(bad,p,r);negative+=1
  cells.append(c);rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lex,'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','periodType':period['type'],'periodStart':period['start'],'periodEnd':period['end'],'renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d})
 proof=B/'gas-current-primary-source-image-reader-proof.json';proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Pages 9 and 10 source images actually inspected. Current liabilities is the explicit subtotal code 310; original OCR omitted its caption, which is preserved as null rather than fabricated. Exact code, coordinates, current/prior values and dated stock headers bind this row. Net income is total code 60 including NCI, not ordinary/common attribution. Prior values are anchors only. No common equity, normalized profit or historical availability inferred.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[c for c in old if not(c['bodyHash']==BODY and c['itemId'] in ROWS)];out.write_text(json.dumps(old+cells,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'ticker':'GAS','sourceImageCells':len(cells),'negativeControls':negative}))
if __name__=='__main__':main()
