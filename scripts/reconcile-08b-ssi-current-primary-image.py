"""Retained SSI primary images; exact sector forms and literal current columns."""
import datetime, hashlib, json, pathlib, runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='0d8bdc30a7174068ac9db85a557173225ee6896b40210bb15c6abaafc2a63d03'
ROWS={
 'TOTAL_ASSETS':(11,'96.460.587.873.471','94.049.979.396.183','TỔNG CỘNG TÀI SẢN','270'),
 'TOTAL_LIABILITIES_SUPPORTING':(12,'55.736.629.161.957','61.983.660.935.421','NỢ PHẢI TRẢ','300'),
 'TOTAL_EQUITY':(12,'40.723.958.711.514','32.066.318.460.762','VỐN CHỦ SỞ HỮU','400'),
 'NET_INCOME':(17,'2.509.479.672.227','1.811.592.874.189','LỢI NHUẬN KẾ TOÁN SAU THUẾ TNDN','200'),
 'CFO':(19,'(3.850.605.975.468)','(12.920.530.391.989)','Lưu chuyển tiền thuần sử dụng vào hoạt động kinh doanh','60'),
 'CFI_SUPPORTING':(20,'537.029.302.913','(443.458.896.627)','Lưu chuyển tiền thuần từ/(sử dụng vào) hoạt động đầu tư','70'),
 'CFF_SUPPORTING':(20,'198.605.532.303','15.873.914.416.634','Lưu chuyển tiền thuần từ hoạt động tài chính','80'),
 'NET_CASH_CHANGE_SUPPORTING':(20,'(3.114.971.140.252)','2.509.925.128.018','(GIẢM)/TĂNG TIỀN THUẦN TRONG KỲ','90'),
}
def validate(c,p,r):
 try:
  expected=ROWS.get(c['itemId']);d=c['sourceImageColumnDefinition']
  if not expected or (c['page'],c['lexicalValue'],d['comparativeLexical'],c['sourceCaption'],c['sourceRowCode'])!=expected:return False
  stock=c['page'] in [11,12]
  if c['bodyHash']!=BODY or p['bodyHash']!=BODY or p['page']!=c['page'] or c['ticker']!='SSI' or c['scope']!='CONSOLIDATED' or c['unit']!='CURRENCY' or c['currency']!='VND':return False
  if c['periodType']!=('INSTANT' if stock else 'YTD') or c['period']['start']!=('2026-06-30' if stock else '2026-01-01') or c['period']['end']!='2026-06-30':return False
  if p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR' or c['extractionMethod']!=p['engineA'] or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING':return False
  if d['layout']!='SSI_EXACT_CURRENT_PRIMARY' or d['currentColumnOrdinal']!=0 or d['currentHeader']!='30 tháng 6 năm 2026' or d['comparativeHeader']!=('31 tháng 12 năm 2025' if stock else '30 tháng 6 năm 2025'):return False
  current=[w for w in p['passA'] if w['text']==c['lexicalValue'] and .55<w['x']<.73 and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(current)!=1 or not any(w['text']==expected[2] and w['x']>.72 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
  if not any(w['text']==expected[4] and w['x']<.19 and abs(w['y']+w['height']/2-c['rowY'])<.035 for w in p['passA']):return False
  top=r['compact'](' '.join(w['text'] for w in p['passA'] if w['y']<.22))
  if not all(r['compact'](t) in top for t in ['Công ty Cổ phần Chứng khoán SSI','hợp nhất','ngày 30 tháng 6 năm 2026','VND']):return False
  text=r['compact'](r['full_text'](p,'passA'))
  if stock:
   if not all(r['compact'](s) in text for s in ['Ngày 30 tháng 6','năm 2026','Ngày 31 tháng 12','năm 2025']):return False
  else:
   if not all(r['compact'](s) in text for s in ['giai đoạn tài chính sáu tháng','năm 2026']):return False
   # Page 17's stamp obscures the comparative heading in Vision. Its
   # literal 2025 header is visible in the independently inspected image
   # and in the retained second OCR; no comparative fact is admitted.
   prior_text=r['compact'](r['full_text'](p,'passB')) if c['page']==17 else text
   if r['compact']('năm 2025') not in prior_text:return False
  return r['numeric_value'](c['lexicalValue'])==c['verifiedCanonicalInteger'] and d['currentLexical']==c['lexicalValue']
 except (KeyError,TypeError,ValueError):return False
def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' and q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='VAS' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[]
 for item,(n,lexical,prior,caption,code) in ROWS.items():
  f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256']
  w=min((w for w in p['passA'] if w['text']==lexical and .55<w['x']<.73),key=lambda w:w['y'])
  stock=n in [11,12];period={**q['period'],'start':'2026-06-30' if stock else '2026-01-01','type':'INSTANT' if stock else 'YTD'}
  definition={'layout':'SSI_EXACT_CURRENT_PRIMARY','currentColumnOrdinal':0,'currentHeader':'30 tháng 6 năm 2026','comparativeHeader':'31 tháng 12 năm 2025' if stock else '30 tháng 6 năm 2025','currentLexical':lexical,'comparativeLexical':prior}
  c={'ticker':'SSI','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lexical,'verificationLexicalValue':lexical,'verifiedCanonicalInteger':r['numeric_value'](lexical),'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':period['type'],'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':definition,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,r),item
  rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lexical,'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','periodType':period['type'],'periodStart':period['start'],'periodEnd':period['end'],'renderSha256':p['renderSha256'],'sourceImageColumnDefinition':definition});cells.append(c)
 proof=B/'ssi-current-primary-source-image-reader-proof.json'
 proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Original table-border OCR outputs remain intact. Sector cash-flow codes 60/70/80/90 are read from the exact securities form, not industrial codes. Equity includes non-controlling interest and is not mapped to common equity. Comparative income is explicitly presented again; this extraction admits current cells only. No client brokerage/entrusted cash-flow section is mixed into issuer cash flow.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';existing=json.loads(out.read_text());existing=[c for c in existing if not(c['bodyHash']==BODY and c['itemId'] in ROWS)]
 out.write_text(json.dumps(existing+cells,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'issuer':'SSI','newSourceImageCells':len(cells),'independentHumanApproval':None}))
if __name__=='__main__':main()
