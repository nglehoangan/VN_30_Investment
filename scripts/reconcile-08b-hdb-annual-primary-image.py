"""Exact FY2024 HDB source-image cells with unmodified independent OCR output."""
import datetime, hashlib, json, pathlib, runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='4ab3fd0fe12612fea3893a798db9b589783f9c6761a4dcac3d9212cf02801cfd'
# Source codes are read from the actual page image. The original OCR caption
# is retained separately when the engine omits a code or misreads a letter.
ROWS={
 'BANK_GROSS_CUSTOMER_LOANS':(7,'442.484.841','343.404.295','Cho vay khách hàng','1',['Cho vay khách hàng']),
 'TOTAL_LIABILITIES_SUPPORTING':(8,'640.709.197','555.914.537','TỔNG NỢ PHẢI TRẢ',None,['TÔNG NỢ PHẢI TRẢ']),
 'BANK_NET_INTEREST_INCOME':(10,'30.857.076','22.183.974','Thu nhập lãi thuần','I',['Thu nhập lãi thuần']),
 'BANK_OPERATING_EXPENSES':(10,'(11.980.755)','(9.129.202)','Chi phí hoạt động','VIII',['VIII Chi phí hoạt động']),
 'NET_INCOME_ATTRIBUTABLE_COMMON':(10,'12.762.953','10,070.898','Các cổ đông sở hữu cổ phần phổ thông của Ngân hàng',None,['Các cổ đông sở hữu cổ phần phố thông của Ngân hàng']),
 'CFO':(11,'8.742.393','80.657.045','LƯU CHUYỂN TIỀN THUẦN TỪ HOẠT ĐỘNG KINH DOANH','I',['LƯU CHUYỂN TIỀN THUÂN TỪ HOẠT ĐỘNG','KINH DOANH']),
 'CFI_SUPPORTING':(12,'(1.180.084)','263.84','LƯU CHUYỂN TIỀN THUẦN TỪ HOẠT ĐỘNG ĐẦU TƯ','II',['LƯU CHUYỄN TIỀN THUÂN TỪ HOẠT ĐỘNG ĐẦU TƯ']),
 'CFF_SUPPORTING':(12,'(2.712.550)','(2.515.261)','LƯU CHUYỂN TIỀN THUẦN TỪ HOẠT ĐỘNG TÀI CHÍNH','III',['LƯU CHUYÊN TIÊN THUẢN TỪ HOẠT ĐỘNG','TÀI CHÍNH']),
 'NET_CASH_CHANGE_SUPPORTING':(12,'4.849.759','77.877.941','LƯU CHUYỂN TIỀN THUẦN TRONG NĂM','IV',['IV LƯU CHUYỀN TIỀN THUẢN TRONG NĂM'])}
def validate(c,p,r):
 try:
  expected=ROWS.get(c['itemId']);d=c['sourceImageColumnDefinition']
  if not expected or (c['page'],c['lexicalValue'],d['comparativeOriginalOcrLexical'],c['sourceCaption'],c['sourceRowCode'],d['originalCaptionWords'])!=expected:return False
  stock=c['page'] in [7,8]
  if c['ticker']!='HDB' or c['bodyHash']!=BODY or p['bodyHash']!=BODY or p['page']!=c['page'] or c['scope']!='CONSOLIDATED' or c['unit']!='MILLION_CURRENCY' or c['currency']!='VND':return False
  if c['periodType']!=('INSTANT' if stock else 'ANNUAL') or c['period']['start']!=('2024-12-31' if stock else '2024-01-01') or c['period']['end']!='2024-12-31':return False
  if p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR' or c['extractionMethod']!=p['engineA'] or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING':return False
  if d['layout']!='HDB_EXACT_AUDITED_ANNUAL_PRIMARY' or d['currentColumnOrdinal']!=0 or d['currentHeader']!='2024' or d['comparativeHeader']!='2023' or d['currentLexical']!=c['lexicalValue']:return False
  if c['independentHumanApproval'] is not None or c['comparativeColumn'] is not False:return False
  current=[w for w in p['passA'] if w['text']==c['lexicalValue'] and .69<w['x']<.81 and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(current)!=1:return False
  if not any(w['text']==expected[2] and w['x']>.82 and abs(w['y']+w['height']/2-c['rowY'])<.025 for w in p['passA']):return False
  for caption in expected[5]:
   if not any(w['text']==caption and w['x']<.65 and abs(w['y']+w['height']/2-c['rowY'])<.04 for w in p['passA']):return False
  top=r['compact'](' '.join(w['text'] for w in p['passA'] if w['y']<.2))
  if not all(r['compact'](s) in top for s in ['NGÂN HÀNG THƯƠNG MẠI','THÀNH','MINH','HỢP NHẤT','Triệu đồng']):return False
  if stock:
   if not all(r['compact'](s) in top for s in ['31.12.2024','31.12.2023']):return False
  elif not all(r['compact'](s) in top for s in ['ngày 31 tháng 12 năm','2024','2023']):return False
  return r['numeric_value'](c['lexicalValue'])==c['verifiedCanonicalInteger']
 except (KeyError,TypeError,ValueError):return False
def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' and q['scope']=='CONSOLIDATED' and q['auditStatus']=='AUDITED' and q['accountingBasis']=='VAS' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[]
 for item,(n,lexical,prior,caption,code,rawcaptions) in ROWS.items():
  f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256']
  w=next(w for w in p['passA'] if w['text']==lexical and .69<w['x']<.81)
  stock=n in [7,8];period={**q['period'],'start':'2024-12-31' if stock else '2024-01-01','type':'INSTANT' if stock else 'ANNUAL'}
  d={'layout':'HDB_EXACT_AUDITED_ANNUAL_PRIMARY','currentColumnOrdinal':0,'currentHeader':'2024','comparativeHeader':'2023','currentLexical':lexical,'comparativeOriginalOcrLexical':prior,'originalCaptionWords':rawcaptions}
  c={'ticker':'HDB','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lexical,'verificationLexicalValue':lexical,'verifiedCanonicalInteger':r['numeric_value'](lexical),'unit':'MILLION_CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':period['type'],'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,r),item
  rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lexical,'unit':c['unit'],'currency':'VND','scope':'CONSOLIDATED','periodType':period['type'],'periodStart':period['start'],'periodEnd':period['end'],'renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d});cells.append(c)
 proof=B/'hdb-annual-primary-source-image-reader-proof.json'
 proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Actual page images were inspected; numeric source OCR is unmodified. Only FY2024 values are admitted. Incorrect comparative OCR tokens are retained verbatim as positioning evidence, never corrected into comparative facts. Common profit is explicitly allocated to ordinary shareholders on page 10; total equity includes NCI and is not common equity. Provider copy is public provenance, not a trusted historical publication timestamp.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';existing=json.loads(out.read_text());existing=[c for c in existing if not(c['bodyHash']==BODY and c['itemId'] in ROWS)]
 out.write_text(json.dumps(existing+cells,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'issuer':'HDB','sourceImageCells':len(cells),'independentHumanApproval':None}))
if __name__=='__main__':main()
