"""Exact inspected FY2023 balance sheet rows, retaining every original OCR region."""
import copy,datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='7cdcebe4a0be8875288460d094b7c708b1d92a1de04e19d3949c0e4ab6c60cb1'
# Page, item, code, current/prior lexical, printed caption, original caption, numeric row y.
ROWS=[
 (7,'CURRENT_ASSETS','100','35.935.879.621.477','31.560.382.174.201','Tài sản ngắn hạn','Tài sản ngắn hạn',.265),
 (7,'RECEIVABLES','130','6.529.705.184.034','6.100.402.870.854','Các khoản phải thu ngắn hạn','Các khoản phải thu ngăn hạn',.446),
 (8,'TOTAL_ASSETS','270','52.673.371.104.460','48.482.664.236.220','Tổng tài sản','TỔNG TÀI SẢN (270 = 100 + 200)',.772),
 (9,'TOTAL_LIABILITIES_SUPPORTING','300','17.647.627.338.990','15.666.145.881.135','Nợ phải trả','NỢ PHẢI TRẢ (300 = 310 + 330)',.265),
 (9,'CURRENT_LIABILITIES','310','17.138.689.974.862','15.308.423.081.524','Nợ ngắn hạn','Nợ ngắn hạn',.294),
 (9,'TOTAL_EQUITY','400','35.025.743.765.470','32.816.518.355.085','Vốn chủ sở hữu','VỐN CHỦ SỞ HỮU (400 = 410)',.547),
]
STOCK={'CURRENT_ASSETS','RECEIVABLES','TOTAL_ASSETS','TOTAL_LIABILITIES_SUPPORTING','CURRENT_LIABILITIES','TOTAL_EQUITY'}
def validate(c,p,r):
 try:
  row=next(x for x in ROWS if x[1]==c['itemId']);n,item,code,lex,prior,caption,raw,y=row
  stock=item in STOCK;kind='INSTANT' if stock else 'ANNUAL';start='2023-12-31' if stock else '2023-01-01'
  if c['ticker']!='VNM' or c['bodyHash']!=BODY or p['bodyHash']!=BODY or c['page']!=n or p['page']!=n or c['sourceRowCode']!=code or c['sourceCaption']!=caption or c['lexicalValue']!=lex or c['verificationLexicalValue']!=lex or c['periodType']!=kind or c['period']['start']!=start or c['period']['end']!='2023-12-31' or c['unit']!='CURRENCY' or c['currency']!='VND' or c['scope']!='CONSOLIDATED' or c['comparativeColumn'] is not False or c['independentHumanApproval'] is not None or c['extractionMethod']!=p['engineA'] or p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR' or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING':return False
  ws=[w for w in p['passA'] if lex in w['text'].split() and (w['text'].split()[0]==lex or item=='REVENUE' and w['text'].split()[0]==code) and .47<w['x']<.65 and abs(w['y']-y)<.006 and w['confidence']>=.8]
  if len(ws)!=1:return False
  w=ws[0];cy=w['y']+w['height']/2
  d={'layout':'VNM_EXACT_FY23_STOCK_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalSourceWordText':w['text'],'originalCaptionWords':raw}
  if c['sourceImageColumnDefinition']!=d or abs(c['columnX']-w['x'])>=.001 or abs(c['rowY']-cy)>=.001 or r['numeric_value'](lex)!=c['verifiedCanonicalInteger']:return False
  if not any((a['text'].split()[0]==code and .44<a['x']<.51 or item=='NET_INCOME' and a['text']==raw and .11<a['x']<.13) and abs(a['y']+a['height']/2-cy)<.016 and a['confidence']>=.8 for a in p['passA']):return False
  caption_tolerance=.04 if item=='CURRENT_ASSETS' else .027
  if not any(a['text']==raw and a['x']<.45 and abs(a['y']+a['height']/2-cy)<caption_tolerance and a['confidence']>=.8 for a in p['passA']):return False
  if prior not in w['text'].split() and not any(a['text']==prior and .72<a['x']<.83 and abs(a['y']+a['height']/2-cy)<.012 and a['confidence']>=.8 for a in p['passA']):return False
  suffix={'CFO':'kinh doanh','CFI_SUPPORTING':'đầu tư','CFF_SUPPORTING':'tài chính'}.get(item)
  if suffix and not any(a['text']==suffix and a['x']<.45 and abs(a['y']+a['height']/2-cy)<.027 for a in p['passA']):return False
  text=r['compact'](r['full_text'](p,'passA'))
  return all(r['compact'](a) in text for a in (['31/12/2023','1/1/2023','VND','hợp nhất'] if stock else ['2023','2022','VND']))
 except (KeyError,TypeError,ValueError,StopIteration):return False
def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert sha(B/(BODY+'.pdf'))==BODY and q['accountingBasis']=='VAS' and q['auditStatus']=='AUDITED' and q['scope']=='CONSOLIDATED' and q['period']['end']=='2023-12-31'
 cells=[];proof_rows=[]
 for n,item,code,lex,prior,caption,raw,y in ROWS:
  f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256'];w=next(w for w in p['passA'] if lex in w['text'].split() and abs(w['y']-y)<.006)
  stock=item in STOCK;period={**q['period'],'start':'2023-12-31' if stock else '2023-01-01','type':'INSTANT' if stock else 'ANNUAL'}
  d={'layout':'VNM_EXACT_FY23_STOCK_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalSourceWordText':w['text'],'originalCaptionWords':raw}
  c={'ticker':'VNM','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':r['numeric_value'](lex),'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':period['type'],'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,r),item
  for key,value in [('lexicalValue',prior),('sourceRowCode','999'),('scope','SEPARATE_STANDALONE'),('unit','MILLION_CURRENCY'),('columnX',.8),('period',{**period,'end':'2026-06-30'})]:
   bad=copy.deepcopy(c);bad[key]=value;assert not validate(bad,p,r),key
  cells.append(c);proof_rows.append({**c,'periodStart':period['start'],'periodEnd':period['end'],'currentLexical':lex,'rowCode':code,'caption':caption})
 proof=B/'vnm-fy23-stock-source-image-reader-proof.json'
 proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'actualInspectedPages':[7,8,9],'rows':proof_rows,'limitations':['Actual FY2023 balance sheet pages 7/8/9 inspected. Original grouped revenue/code and net-income caption/code retained. Total equity includes NCI; net income is total profit, neither is common-attributable. Cash capex and paid dividends are not qualifying CAPEX or declared dividends. No arithmetic repairs or cross-period comparability inferred.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[c for c in old if not(c['bodyHash']==BODY and c['itemId'] in {x[1] for x in ROWS})];out.write_text(json.dumps(old+cells,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'ticker':'VNM','fy23SourceImageCells':len(cells),'negativeControls':36}))
if __name__=='__main__':main()
