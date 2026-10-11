"""Exact reclassified H1 2025 financing subtotal in MCH's reviewed H1 2026 report."""
import copy,datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='4974b488d0511d3d80619912a8e2e9ad06bcb3bb4b416876bfcd4800ae2c1082'
LEX='1.674.362.932.728'
def validate(c,p,r):
 try:
  if (c['ticker']!='MCH' or c['bodyHash']!=BODY or p['bodyHash']!=BODY or c['page']!=13 or p['page']!=13
      or c['itemId']!='CFF_SUPPORTING' or c['lexicalValue']!=LEX or c['verificationLexicalValue']!=LEX
      or c['sourceRowCode']!='40' or c['sourceCaption']!='Lưu chuyển tiền thuần từ các hoạt động tài chính'
      or c['unit']!='CURRENCY' or c['currency']!='VND' or c['scope']!='CONSOLIDATED' or c['periodType']!='YTD'
      or c['period']['start']!='2025-01-01' or c['period']['end']!='2025-06-30' or c['comparativeColumn'] is not True
      or c['extractionMethod']!=p['engineA'] or p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR'
      or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING' or c['independentHumanApproval'] is not None
      or c['sourceImageColumnDefinition']!={'layout':'MCH_EXACT_PRIOR_FINANCING_IMAGE','currentColumnOrdinal':1,'currentLexical':LEX,'oppositeCurrentLexical':'(3.287.091.196.759)','comparativeClassification':'SOURCE_EXPLICIT_RECLASSIFIED','sourceFrameEnd':'2026-06-30'}):return False
  text=r['compact'](r['full_text'](p,'passA'))
  if not all(r['compact'](a) in text for a in ['Công ty Cổ phần Hàng tiêu dùng Masan','hợp nhất','sáu tháng','30/6/2026','30/6/2025','Phân loại lại','VND']):return False
  ws=[w for w in p['passA'] if w['text']==LEX and .76<w['x']<.82 and .35<w['y']<.37 and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(ws)!=1:return False
  if not any(w['text']=='(3.287.091.196.759)' and .58<w['x']<.65 and .35<w['y']<.37 for w in p['passA']):return False
  if not any(w['text']=='40' and .54<w['x']<.58 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
  near=' '.join(w['text'] for w in p['passA'] if w['x']<.54 and abs(w['y']+w['height']/2-c['rowY'])<.02)
  return r['compact'](c['sourceCaption']) in r['compact'](near) and r['numeric_value'](LEX)==c['verifiedCanonicalInteger']
 except (KeyError,TypeError,ValueError):return False

def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest();q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='VAS' and sha(B/(BODY+'.pdf'))==BODY
 f=B/'ocr'/f'{BODY}-p13.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256'];w=next(w for w in p['passA'] if w['text']==LEX)
 period={'start':'2025-01-01','end':'2025-06-30','type':'YTD','fiscalYear':2025,'fiscalQuarter':2,'calendarReference':'SOURCE_EXPLICIT_COMPARATIVE_SIX_MONTH_WINDOW'}
 d={'layout':'MCH_EXACT_PRIOR_FINANCING_IMAGE','currentColumnOrdinal':1,'currentLexical':LEX,'oppositeCurrentLexical':'(3.287.091.196.759)','comparativeClassification':'SOURCE_EXPLICIT_RECLASSIFIED','sourceFrameEnd':'2026-06-30'}
 c={'ticker':'MCH','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':13,'itemId':'CFF_SUPPORTING','sourceCaption':'Lưu chuyển tiền thuần từ các hoạt động tài chính','captionAlternative':r['fold']('Lưu chuyển tiền thuần từ các hoạt động tài chính'),'sourceRowCode':'40','lexicalValue':LEX,'verificationLexicalValue':LEX,'verifiedCanonicalInteger':r['numeric_value'](LEX),'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':'YTD','columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':True,'independentHumanApproval':None,'sourceOcrProofFile':str(f)};assert validate(c,p,r)
 for key,value in [('lexicalValue','(3.287.091.196.759)'),('scope','SEPARATE_STANDALONE'),('period',{**period,'end':'2026-06-30'}),('comparativeColumn',False),('unit','MILLION_CURRENCY'),('columnX',.59),('sourceRowCode','50')]:
  bad=copy.deepcopy(c);bad[key]=value;assert not validate(bad,p,r)
 proof=B/'mch-prior-financing-source-image-reader-proof.json';row={'bodyHash':BODY,'page':13,'itemId':c['itemId'],'caption':c['sourceCaption'],'rowCode':'40','currentLexical':LEX,'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','periodType':'YTD','periodStart':period['start'],'periodEnd':period['end'],'renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d}
 proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':[row],'limitations':['Actual right-hand comparative column and reclassification label inspected. Source edition is the reviewed 2026 report; this does not reconstruct what was known during 2025 or assert a historical publication boundary. Separate current column remains negative and is not replaced.']},ensure_ascii=False,indent=2)+'\n')
 c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(f),sha(proof)]);out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[x for x in old if not(x['bodyHash']==BODY and x['itemId']==c['itemId'] and x['period']['end']=='2025-06-30')];out.write_text(json.dumps(old+[c],ensure_ascii=False,indent=2)+'\n');print(json.dumps({'ticker':'MCH','priorFinancingCells':1,'negativeControls':7}))
if __name__=='__main__':main()
