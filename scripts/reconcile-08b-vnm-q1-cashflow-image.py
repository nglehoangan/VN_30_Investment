"""Five inspected VNM Q1 financial-flow rows, retaining original OCR exceptions."""
import copy,datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work');BODY='aa9e9d9a18fbbf05cc23c35b71a5dbae7a0a858a81727ff2e0d1c8ad047cb451'
ROWS={
 'REVENUE':(11,'16.148.657.871.623','12.957.547.985.266','Doanh thu thuần về bán hàng và cung cấp dịch vụ','10','Doanh thu thuần về bán hàng và cung',.33,.35),
 'CFO':(13,'269.326.997.516','(124.187.023.735)','Lưu chuyển tiền thuần từ hoạt động kinh doanh','20','Lưu chuyển tiền thuần từ hoạt động',.65,.665),
 'CFI_SUPPORTING':(14,'(880.995.904.749)','541.946.181.123','Lưu chuyển tiền thuần từ hoạt động đầu tư','30','Lưu chuyển tiền thuần từ hoạt động',.46,.475),
 'CFF_SUPPORTING':(14,'895.708.334.480','(106.233.904.950)','Lưu chuyển tiền thuần từ hoạt động tài chính','40','Lưa chuyển tiền thuần từ hoạt động',.59,.61),
 'NET_CASH_CHANGE_SUPPORTING':(15,'284.039.427.247','311.525.252.438','Lưu chuyển tiền thuần trong kỳ','50','Lưu chuyển tiền thuần trong kỳ',.26,.28),
}
def validate(c,p,r):
 try:
  n,lex,prior,caption,code,raw,lo,hi=ROWS[c['itemId']];region=lex+' '+prior if c['itemId']=='CURRENT_ASSETS' else lex
  d={'layout':'VNM_EXACT_Q1_CASHFLOW_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalSourceWordText':region,'originalCaptionWords':raw}
  if c['ticker']!='VNM' or c['bodyHash']!=BODY or p['bodyHash']!=BODY or c['page']!=n or p['page']!=n or c['lexicalValue']!=lex or c['verificationLexicalValue']!=lex or c['sourceRowCode']!=code or c['sourceCaption']!=caption or c['sourceImageColumnDefinition']!=d or c['unit']!='CURRENCY' or c['currency']!='VND' or c['scope']!='CONSOLIDATED' or c['periodType']!='QUARTER' or c['period']['start']!='2026-01-01' or c['period']['end']!='2026-03-31' or c['comparativeColumn'] is not False or c['independentHumanApproval'] is not None or c['extractionMethod']!=p['engineA'] or p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR' or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING':return False
  ws=[w for w in p['passA'] if w['text']==region and .58<w['x']<.63 and lo<w['y']<hi and w['confidence']>=.8 and abs(c['columnX']-w['x'])<.001 and abs(c['rowY']-w['y']-w['height']/2)<.001]
  if len(ws)!=1:return False
  if not any(w['text']==raw and w['x']<.45 and abs(w['y']+w['height']/2-c['rowY'])<.035 for w in p['passA']):return False
  if c['itemId'] in ['CFO','CFI_SUPPORTING','CFF_SUPPORTING']:
   tail={'CFO':'kinh doanh','CFI_SUPPORTING':'đầu tư','CFF_SUPPORTING':'tài chính'}[c['itemId']]
   if not any(w['text']==tail and w['x']<.45 and abs(w['y']+w['height']/2-c['rowY'])<.03 for w in p['passA']):return False
  if not any(w['text']==prior and .74<w['x']<.81 and lo-.01<w['y']<hi+.01 for w in p['passA']):return False
  if c['itemId']!='CFO':
   if not any(w['text']==('10 VI.1' if c['itemId']=='REVENUE' else code) and .45<w['x']<.50 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
   if not any(w['text']==prior and .74<w['x']<.81 and lo-.01<w['y']<hi+.01 for w in p['passA']):return False
  text=r['compact'](r['full_text'](p,'passA'))
  return all(r['compact'](a) in text for a in ['Công ty Cổ phần Sữa Việt Nam','hợp nhất','31/3/2026','31/3/2025','ba tháng','VND']) and r['numeric_value'](lex)==c['verifiedCanonicalInteger']
 except (KeyError,TypeError,ValueError):return False

def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest();q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='VAS' and q['period']['end']=='2026-03-31' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[]
 for item,spec in ROWS.items():
  n,lex,prior,caption,code,raw,lo,hi=spec;f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256'];region=lex+' '+prior if item=='CURRENT_ASSETS' else lex;w=next(w for w in p['passA'] if w['text']==region);period={**q['period'],'start':'2026-01-01','type':'QUARTER'};d={'layout':'VNM_EXACT_Q1_CASHFLOW_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeOriginalOcrLexical':prior,'originalSourceWordText':region,'originalCaptionWords':raw}
  c={'ticker':'VNM','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':r['numeric_value'](lex),'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':'QUARTER','columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)};assert validate(c,p,r),item
  for key,value in [('lexicalValue',prior),('unit','MILLION_CURRENCY'),('scope','SEPARATE_STANDALONE'),('columnX',.76),('sourceRowCode','999'),('period',{**period,'end':'2026-06-30'})]:
   bad=copy.deepcopy(c);bad[key]=value;assert not validate(bad,p,r),key
  cells.append(c);rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lex,'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','periodType':'QUARTER','periodStart':'2026-01-01','periodEnd':'2026-03-31','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d})
 proof=B/'vnm-q1-cashflow-source-image-reader-proof.json';proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Pages 11, 13, 14 and 15 actually inspected. Net revenue is the explicit code 10 row, not gross revenue code 01. Code 10 and note VI.1 were grouped into one original OCR region, retained literally. Final CFO code 20 is selected after working-capital and tax adjustments, not the code 08 subtotal. Original Vision omitted code 20; this missing-token exception remains explicit. Both split caption lines occur in the source image. Financing caption OCR typo Lưa is retained verbatim. Prior reclassified values are only column anchors. No numbers repaired using cash-flow arithmetic; no fixed-asset cash payments aliased to qualifying CAPEX.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[c for c in old if not(c['bodyHash']==BODY and c['itemId'] in ROWS)];out.write_text(json.dumps(old+cells,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'ticker':'VNM','q1CashflowCells':len(cells),'negativeControls':30}))
if __name__=='__main__':main()
