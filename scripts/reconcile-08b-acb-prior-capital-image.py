"""Exact inspected ACB H1/2025 capital classification; no global equity alias."""
import pathlib,json,hashlib,datetime,runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
H='94cbe09e3533cc2354055253811f33df40a6c56461cfe131b12e75cea7a36366'
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
ROWS=[(64,'COMMON_EQUITY','2025-06-30','87.210.629',.8837,.8967,'Tại ngày 30 tháng 6 năm 2025'),
      (64,'COMMON_EQUITY','2024-12-31','83.461.678',.6750,.8982,'Tại ngày 31 tháng 12 năm 2024'),
      (65,'ORDINARY_SHARES_OUTSTANDING','2025-06-30','5.136.656.599',.4658,.4750,'Cổ phiếu phổ thông đang lưu hành'),
      (65,'ORDINARY_SHARES_OUTSTANDING','2024-12-31','4.466.657.912',.6453,.6898,'Tại ngày 31 tháng 12 năm 2024')]
def validate(c,p,R):
 try:
  row=next((r for r in ROWS if (r[0],r[1],r[2])==(c['page'],c['itemId'],c['period']['end'])),None)
  if not row or c['bodyHash']!=H or c['ticker']!='ACB' or c['scope']!='CONSOLIDATED' or c['periodType']!='INSTANT' or c['period']['start']!=row[2] or c['lexicalValue']!=row[3] or c['sourceCaption']!=row[6] or abs(c['rowY']-row[4])>.001 or abs(c['columnX']-row[5])>.001:return False
  stock=c['itemId']=='COMMON_EQUITY'
  if c['unit']!=('MILLION_CURRENCY' if stock else 'SHARES') or c['currency']!=('VND' if stock else None) or c['sourceRowCode']!=('NOTE_21_1' if stock else 'NOTE_21_2'):return False
  proof=B/'acb-prior-ordinary-capital-classification-proof.json'
  if c.get('ordinaryEquityClassificationProofFile')!=str(proof) or c.get('ordinaryEquityClassificationProofSha256')!=sha(proof):return False
  e=json.loads(proof.read_text())
  if e['bodyHash']!=H or e['actualInspectedPages']!=[14,64,65] or e['genericAliasAllowed'] is not False or e['independentHumanApproval'] is not None or e['governanceStatus']!='REVIEW_CANDIDATE' or [s['page'] for s in e['sources']]!=[14,64,65]:return False
  for s in e['sources']:
   f=B/'ocr'/f"{H}-p{s['page']}.json";page=json.loads(f.read_text())
   if s['file']!=str(f) or s['sha256']!=sha(f) or s['renderSha256']!=sha(f.with_suffix('.png')) or page['renderSha256']!=s['renderSha256'] or page['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR':return False
   text=R['compact'](R['full_text'](page,'passA'))
   if not all(R['compact'](a) in text for a in s['anchors']):return False
   if s['page']==14:
    ownership=[w for w in page['passA'] if .74<w['x']<.94 and .28<w['y']<.44 and '%' in w['text']]
    if len(ownership)!=8 or any(w['text']!='100%' or w['confidence']<.8 for w in ownership):return False
   if s['page']==65:
    for value in ['5.136.656.599','4.466.657.912']:
     if len([w for w in page['passA'] if value in w['text'].split() and .42<w['y']<.48 and w['confidence']>=.8])!=2:return False
  text=R['compact'](R['full_text'](p,'passA'))
  if not all(R['compact'](a) in text for a in ['hợp nhất','kỳ sáu tháng kết thúc','30 tháng 6 năm 2025','Triệu VND']):return False
  values=[w for w in p['passA'] if w['text']==row[3] and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  return len(values)==1
 except (KeyError,ValueError,OSError):return False
def main():
 R=runpy.run_path('scripts/reconcile-08b-extraction.py');assert sha(B/(H+'.pdf'))==H
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==H)
 assert q['scope']=='CONSOLIDATED' and q['period']['end']=='2025-06-30'
 anchors={14:['Cấu trúc Tập đoàn','30.6.2025','31.12.2024','ACBS','ACBA','ACBL','ACBC','Tỷ lệ sở hữu và','quyền biểu quyết'],64:['VỐN CHỦ SỞ HỮU','Tổng cộng','Triệu VND','87.210.629','83.461.678'],65:['Vốn cổ phần được duyệt đã phát hành','Cổ phiếu phổ thông đang lưu hành','30.6.2025','31.12.2024','Tất cả cổ phiếu phổ thông đều có','thứ tự ưu tiên như nhau đối với tài sản còn lại']}
 sources=[]
 for n in [14,64,65]:
  f=B/'ocr'/f'{H}-p{n}.json';p=json.loads(f.read_text());sources.append({'page':n,'file':str(f),'sha256':sha(f),'renderSha256':p['renderSha256'],'anchors':anchors[n]})
 proof=B/'acb-prior-ordinary-capital-classification-proof.json'
 proof.write_text(json.dumps({'bodyHash':H,'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'actualInspectedPages':[14,64,65],'genericAliasAllowed':False,'sources':sources,'classification':'EXACT_JUNE2025_DECEMBER2024_ALL_SUBSIDIARIES_100_PERCENT_AND_ALL_ISSUED_SHARES_ORDINARY','rationale':'Actual source images positively close all four subsidiaries, including the indirect subsidiary, to 100% ownership at both exact dates. The issued-share partition closes to ordinary shares with equal residual rights. Note 21.1 directly reports closing equity, and Note 21.2 reports outstanding shares. No subtraction, weighted-average substitution, generic total-to-common alias, or other date classification is inferred.'},ensure_ascii=False,indent=2)+'\n')
 cells=[]
 for n,item,end,lex,y,x,caption in ROWS:
  f=B/'ocr'/f'{H}-p{n}.json';p=json.loads(f.read_text());w=next(w for w in p['passA'] if w['text']==lex and abs(w['x']-x)<.001 and abs(w['y']+w['height']/2-y)<.001);stock=item=='COMMON_EQUITY';current=end=='2025-06-30'
  c={'ticker':'ACB','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':H,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':R['fold'](caption),'sourceRowCode':'NOTE_21_1' if stock else 'NOTE_21_2','lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':R['numeric_value'](lex),'unit':'MILLION_CURRENCY' if stock else 'SHARES','currency':'VND' if stock else None,'scope':'CONSOLIDATED','period':{'start':end,'end':end,'type':'INSTANT','fiscalYear':int(end[:4]),'fiscalQuarter':2 if current else None,'calendarReference':'SOURCE_EXPLICIT_CALENDAR_WINDOW' if current else 'SOURCE_EXPLICIT_YEAR_END'},'periodType':'INSTANT','columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':{'layout':'ACB_EXACT_PRIOR_ORDINARY_CAPITAL','currentLexical':lex,'currentColumnOrdinal':0},'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':not current,'independentHumanApproval':None,'sourceOcrProofFile':str(f),'ordinaryEquityClassificationProofFile':str(proof),'ordinaryEquityClassificationProofSha256':sha(proof)}
  assert validate(c,p,R),(item,end);cells.append(c)
 imageProof=B/'acb-prior-ordinary-capital-source-image-reader-proof.json'
 imageProof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'actualInspectedPages':[14,64,65],'rows':[{**c,'periodStart':c['period']['start'],'periodEnd':c['period']['end'],'currentLexical':c['lexicalValue'],'rowCode':c['sourceRowCode'],'caption':c['sourceCaption']} for c in cells]},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(imageProof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(imageProof),sha(proof)])
 out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[c for c in old if not(c['bodyHash']==H and c['itemId'] in {'COMMON_EQUITY','ORDINARY_SHARES_OUTSTANDING'})]+cells;out.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n');print({'newCells':len(cells)})
if __name__=='__main__':main()
