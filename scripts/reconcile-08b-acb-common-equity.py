"""ACB-only positive ordinary capital and fully owned consolidation classification."""
import datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work');H='639ecab36c0d6444e80db53bd9043552bcfcfa2df9a7b52be35fdae18fbe6701';sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
ROWS=[(64,'COMMON_EQUITY','2026-06-30','99.314.518','Tại ngày 30 tháng 6 năm 2026',.839),(64,'COMMON_EQUITY','2025-12-31','94.519.719','Tại ngày 31 tháng 12 năm 2025',.654),(65,'ORDINARY_SHARES_OUTSTANDING','2026-06-30','5.804.421.957','Cổ phiếu phổ thông đang lưu hành',.449),(65,'ORDINARY_SHARES_OUTSTANDING','2025-12-31','5.136.656.599','Cổ phiếu phổ thông đang lưu hành',.449)]
def validate_classification(c,R):
 try:
  f=B/'acb-ordinary-capital-classification-proof.json'
  if c.get('ordinaryEquityClassificationProofFile')!=str(f) or c.get('ordinaryEquityClassificationProofSha256')!=sha(f):return False
  e=json.loads(f.read_text())
  if c['bodyHash']!=H or c['ticker']!='ACB' or c['scope']!='CONSOLIDATED' or c['period']['end'] not in ['2026-06-30','2025-12-31'] or e['bodyHash']!=H or e['genericAliasAllowed'] is not False or e['independentHumanApproval'] is not None or e['actualInspectedPages']!=[14,64,65] or [s['page'] for s in e['sources']]!=[14,64,65] or e['governanceStatus']!='REVIEW_CANDIDATE':return False
  for s in e['sources']:
   f=B/'ocr'/f"{H}-p{s['page']}.json"
   if s['file']!=str(f) or s['sha256']!=sha(f) or s['renderSha256']!=sha(f.with_suffix('.png')):return False
   p=json.loads(f.read_text())
   if p['bodyHash']!=H or p['page']!=s['page'] or p['renderSha256']!=s['renderSha256'] or p['engineA']!='PYMUPDF_NATIVE_GLYPH_COORDINATES' or p['engineB']!='PDFPLUMBER_NATIVE_WORD_COORDINATES':return False
   for k in ['passA','passB']:
    text=R['compact'](R['full_text'](p,k))
    if not all(R['compact'](a) in text for a in s['anchors']):return False
    if s['page']==14:
     ownership=[w for w in p[k] if .74<w['x']<.9 and .35<w['y']<.48 and '%' in w['text']]
     if len(ownership)!=8 or any(w['text']!='100%' or w['confidence']<.8 for w in ownership):return False
    if s['page']==65:
     for value,x in [('5.804.421.957',.48),('5.136.656.599',.697)]:
      words=[w for w in p[k] if w['text']==value and abs(w['x']-x)<.01 and .42<w['y']<.46 and w['confidence']>=.8]
      if len(words)!=2:return False
  return True
 except (OSError,KeyError,ValueError):return False
def validate(c,p,R):
 row=next((r for r in ROWS if (r[0],r[1],r[2])==(c.get('page'),c.get('itemId'),c['period']['end'])),None)
 if not row or not validate_classification(c,R):return False
 n,item,end,lex,caption,y=row;stock=item=='COMMON_EQUITY';unit='MILLION_CURRENCY' if stock else 'SHARES';currency='VND' if stock else None
 if c['sourceRowCode']!=('NOTE_21_1' if stock else 'NOTE_21_2') or c['lexicalValue']!=lex or c['sourceCaption']!=caption or c['unit']!=unit or c['currency']!=currency or c['periodType']!='INSTANT' or c['period']['start']!=end or abs(c['rowY']-y)>.008:return False
 for k in ['passA','passB']:
  words=[w for w in p[k] if w['text']==lex and w['confidence']>=.8 and abs(w['y']+w['height']/2-c['rowY'])<.008 and abs(w['x']-c['columnX'])<.01]
  near=' '.join(w['text'] for w in p[k] if w['x']<.45 and abs(w['y']+w['height']/2-c['rowY'])<.012)
  if len(words)!=1 or R['compact'](caption) not in R['compact'](near):return False
 return c['columnX']>.88 if stock else (.47<c['columnX']<.59 if end=='2026-06-30' else .69<c['columnX']<.8)
def main():
 R=runpy.run_path('scripts/reconcile-08b-extraction.py');q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==H);sources=[]
 for n,anchors in [(14,['Cấu trúc Tập đoàn','30.6.2026','31.12.2025','ACBS','ACBA','ACBL','ACBC','Tỷ lệ sở hữu và','quyền biểu quyết']),(64,['VỐN CHỦ SỞ HỮU','Triệu VND','Tổng cộng','99.314.518','94.519.719']),(65,['Vốn cổ phần được duyệt đã phát hành','Cổ phiếu phổ thông đang lưu hành','30.6.2026','31.12.2025','Tất cả cổ phiếu phổ thông đều có thứ tự ưu tiên như nhau'])]:
  f=B/'ocr'/f'{H}-p{n}.json';p=json.loads(f.read_text());sources.append({'page':n,'file':str(f),'sha256':sha(f),'renderSha256':p['renderSha256'],'anchors':anchors})
 proof=B/'acb-ordinary-capital-classification-proof.json';proof.write_text(json.dumps({'bodyHash':H,'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'actualInspectedPages':[14,64,65],'genericAliasAllowed':False,'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':sources,'classification':'POSITIVE_ALL_ISSUED_SHARES_ORDINARY_AND_ALL_CONSOLIDATED_SUBSIDIARIES_100_PERCENT_OWNED_AT_EXACT_TWO_DATES','rationale':'Note 1(d) positively reports all four subsidiaries 100% owned at June 2026 and December 2025, including the indirect subsidiary. Note 21.2 positively closes all issued shares to ordinary outstanding shares at both dates, with equal residual rights. Note 21.1 directly reports equity closing amounts. No subtraction, global total-equity alias, or June 2025 ownership classification is inferred. Registered charter capital differs from issued ordinary capital pending capitalization; share counts are read directly, never inferred from charter capital/par value.'},ensure_ascii=False,indent=2)+'\n');cells=[]
 for n,item,end,lex,caption,y in ROWS:
  f=B/'ocr'/f'{H}-p{n}.json';p=json.loads(f.read_text());words=[w for w in p['passA'] if w['text']==lex and abs(w['y']+w['height']/2-y)<.008];w=next(w for w in words if (w['x']>.88 if item=='COMMON_EQUITY' else .47<w['x']<.59 if end=='2026-06-30' else .69<w['x']<.8));current=end=='2026-06-30';period={**q['period'],'start':end,'end':end,'type':'INSTANT','fiscalYear':int(end[:4]),'fiscalQuarter':2 if current else None,'calendarReference':'SOURCE_EXPLICIT_CALENDAR_WINDOW' if current else 'SOURCE_EXPLICIT_YEAR_END'}
  c={'ticker':'ACB','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':H,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':R['fold'](caption),'sourceRowCode':'NOTE_21_1' if item=='COMMON_EQUITY' else 'NOTE_21_2','lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':R['numeric_value'](lex),'unit':'MILLION_CURRENCY' if item=='COMMON_EQUITY' else 'SHARES','currency':'VND' if item=='COMMON_EQUITY' else None,'scope':'CONSOLIDATED','period':period,'periodType':'INSTANT','columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':p['engineB'],'renderSha256':p['renderSha256'],'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':not current,'ordinaryEquityClassificationProofFile':str(proof),'ordinaryEquityClassificationProofSha256':sha(proof),'definitionEvidenceReference':str(proof),'sourcePageEvidenceHashes':[hashlib.sha256(json.dumps(p[k],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']]+[sha(proof)]};assert validate(c,p,R),(item,end);cells.append(c)
 (B/'acb-ordinary-capital-cells.json').write_text(json.dumps(cells,ensure_ascii=False,indent=2)+'\n');print({'verifiedCells':len(cells)})
if __name__=='__main__':main()
