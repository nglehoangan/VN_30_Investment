"""Six inspected VNM Q1 stock rows, retaining original OCR caption exceptions."""
import copy,datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work');BODY='aa9e9d9a18fbbf05cc23c35b71a5dbae7a0a858a81727ff2e0d1c8ad047cb451'
ROWS={
 'CURRENT_ASSETS':(7,'38.757.016.956.726','36.249.794.729.810','Tài sản ngắn hạn','100','Tai = 10 + 20 +130 +240+ 150 - 160 100',.26,.28),
 'RECEIVABLES':(7,'5.591.443.574.678','5.489.574.577.332','Các khoản phải thu ngắn hạn','130','Các khoản phải thu ngắn hạn',.44,.46),
 'INVENTORY':(7,'7.399.150.703.886','6.529.979.921.580','Hàng tồn kho','140','Hàng tồn kho',.53,.55),
 'TOTAL_ASSETS':(9,'55.429.011.127.169','53.312.370.717.301','Tổng tài sản','280','TỔNG TÀI SẢN (280 = 100 + 200)',.42,.44),
 'CURRENT_LIABILITIES':(10,'18.456.942.372.620','18.520.286.019.795','Nợ ngắn hạn','310','Nợ ngắn hạn',.26,.28),
 'TOTAL_EQUITY':(10,'36.688.079.277.039','34.483.015.286.107','Vốn chủ sở hữu','400','VÓN CHỦ SỞ HỮU',.53,.55),
}
def validate(c,p,r):
 try:
  n,lex,prior,caption,code,raw,lo,hi=ROWS[c['itemId']];region=lex+' '+prior if c['itemId']=='CURRENT_ASSETS' else lex
  d={'layout':'VNM_EXACT_Q1_STOCK_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalSourceWordText':region,'originalCaptionWords':raw}
  if c['ticker']!='VNM' or c['bodyHash']!=BODY or p['bodyHash']!=BODY or c['page']!=n or p['page']!=n or c['lexicalValue']!=lex or c['verificationLexicalValue']!=lex or c['sourceRowCode']!=code or c['sourceCaption']!=caption or c['sourceImageColumnDefinition']!=d or c['unit']!='CURRENCY' or c['currency']!='VND' or c['scope']!='CONSOLIDATED' or c['periodType']!='INSTANT' or c['period']['start']!='2026-03-31' or c['period']['end']!='2026-03-31' or c['comparativeColumn'] is not False or c['independentHumanApproval'] is not None or c['extractionMethod']!=p['engineA'] or p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR' or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING':return False
  ws=[w for w in p['passA'] if w['text']==region and .58<w['x']<.63 and lo<w['y']<hi and w['confidence']>=.8 and abs(c['columnX']-w['x'])<.001 and abs(c['rowY']-w['y']-w['height']/2)<.001]
  if len(ws)!=1:return False
  if not any(w['text']==raw and w['x']<.45 and abs(w['y']+w['height']/2-c['rowY'])<.035 for w in p['passA']):return False
  if c['itemId']!='CURRENT_ASSETS':
   if not any(w['text']==code and .45<w['x']<.50 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
   if not any(w['text']==prior and .74<w['x']<.81 and lo-.01<w['y']<hi+.01 for w in p['passA']):return False
  text=r['compact'](r['full_text'](p,'passA'))
  return all(r['compact'](a) in text for a in ['Công ty Cổ phần Sữa Việt Nam','hợp nhất','31/3/2026','1/1/2026','VND']) and r['numeric_value'](lex)==c['verifiedCanonicalInteger']
 except (KeyError,TypeError,ValueError):return False

def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest();q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='VAS' and q['period']['end']=='2026-03-31' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[]
 for item,spec in ROWS.items():
  n,lex,prior,caption,code,raw,lo,hi=spec;f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256'];region=lex+' '+prior if item=='CURRENT_ASSETS' else lex;w=next(w for w in p['passA'] if w['text']==region);period={**q['period'],'start':'2026-03-31','type':'INSTANT'};d={'layout':'VNM_EXACT_Q1_STOCK_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalSourceWordText':region,'originalCaptionWords':raw}
  c={'ticker':'VNM','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':r['numeric_value'](lex),'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':'INSTANT','columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)};assert validate(c,p,r),item
  for key,value in [('lexicalValue',prior),('unit','MILLION_CURRENCY'),('scope','SEPARATE_STANDALONE'),('columnX',.76),('sourceRowCode','999'),('period',{**period,'end':'2026-06-30'})]:
   bad=copy.deepcopy(c);bad[key]=value;assert not validate(bad,p,r),key
  cells.append(c);rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lex,'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','periodType':'INSTANT','periodStart':'2026-03-31','periodEnd':'2026-03-31','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d})
 proof=B/'vnm-q1-stock-source-image-reader-proof.json';proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Pages 7, 9 and 10 actually inspected. Current-asset caption was corrupted and merged with code 100 by OCR; that literal is preserved. The grouped current/prior numeric region retains its actual coordinates. Receivables are the short-term aggregate; inventory is net carrying value code 140. Total equity includes NCI and is not common equity. Prior figures are reclassified column anchors, not separate admitted observations. No values repaired from accounting identities.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[c for c in old if not(c['bodyHash']==BODY and c['itemId'] in ROWS)];out.write_text(json.dumps(old+cells,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'ticker':'VNM','q1StockCells':len(cells),'negativeControls':36}))
if __name__=='__main__':main()
