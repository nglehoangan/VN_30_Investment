"""Three clean numeric cells independently read from retained GVR source images.

Original OCR caption errors remain literal evidence. No fuzzy caption matching,
numeric OCR repairs, NCI/common-equity inference or comparative facts.
"""
import datetime, hashlib, json, pathlib, runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='f7a61f44c9747b3386bdb3f17ce0e0af895cb6ecc7d4592ab5592916b6271d48'
ROWS={
 'REVENUE':(11,'15.927.731.603.375','11.566.969,346.250','Doanh thu thuần bán hàng và cung cấp dịch vụ','10','10 3. Doanh tha thuần bàn hãng vả cung cắp dịch vụ'),
 'GROSS_PROFIT':(11,'4.506.657.950.004','3.445.050.684.105','Lợi nhuận gộp về bán hàng và cung cấp dịch vụ','20','20 5. Lợi nhuận gộp về bản hỏng và cung cấp dịch vụ'),
 'NET_CASH_CHANGE_SUPPORTING':(13,'(312.736.883.907)','(471.351.035.503)','Lưu chuyển tiền thuần trong kỳ','50','50 Lau chuyễn tiền thuần trong kỳ'),
}

def validate(c,p,R):
 try:
  expected=ROWS.get(c['itemId']);d=c['sourceImageColumnDefinition']
  if not expected or (c['page'],c['lexicalValue'],d['comparativeLexical'],c['sourceCaption'],c['sourceRowCode'],d['originalOcrCaptionText'])!=expected:return False
  if (c['ticker']!='GVR' or c['bodyHash']!=BODY or p['bodyHash']!=BODY or p['page']!=c['page']
      or c['scope']!='CONSOLIDATED' or c['unit']!='CURRENCY' or c['currency']!='VND'
      or c['periodType']!='YTD' or c['period']['start']!='2026-01-01' or c['period']['end']!='2026-06-30'
      or c['comparativeColumn'] or c['independentHumanApproval'] is not None
      or d['layout']!='GVR_EXACT_CURRENT_PRIMARY' or d['currentColumnOrdinal']!=0
      or d['currentLexical']!=c['lexicalValue'] or d['currentHeader']!='06 tháng đầu năm 2026'
      or d['comparativeHeader']!='06 tháng đầu năm 2025'):return False
  if p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR' or c['extractionMethod']!=p['engineA'] or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING':return False
  current=[w for w in p['passA'] if w['text']==c['lexicalValue'] and .60<w['x']<.75 and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(current)!=1 or not any(w['text']==expected[2] and .77<w['x']<.91 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']):return False
  caption=[w for w in p['passA'] if w['text']==expected[5] and .12<w['x']<.16 and abs(w['y']+w['height']/2-c['rowY'])<.015]
  if len(caption)!=1 or not caption[0]['text'].startswith(c['sourceRowCode']+' '):return False
  text=R['full_text'](p,'passA')
  # The original top-of-page period is explicit even where the display
  # heading has OCR errors. Source-image reading independently verifies both
  # year-column headings; no repaired heading replaces the OCR stream.
  if '01/01/2026' not in text or '30/06/2026' not in text:return False
  if not any(w['text']=='VND' and .68<w['x']<.75 and .19<w['y']<.24 for w in p['passA']):return False
  if not any('2025' in w['text'] and .8<w['x']<.95 and .17<w['y']<.23 for w in p['passA']):return False
  return R['numeric_value'](c['lexicalValue'])==c['verifiedCanonicalInteger']
 except (KeyError,ValueError,TypeError):return False

def main():
 R=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' and q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='UNKNOWN' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[]
 for item,(n,lex,prior,caption,code,original_caption) in ROWS.items():
  f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256']
  w=next(w for w in p['passA'] if w['text']==lex and .6<w['x']<.75)
  definition={'layout':'GVR_EXACT_CURRENT_PRIMARY','currentColumnOrdinal':0,'currentHeader':'06 tháng đầu năm 2026','comparativeHeader':'06 tháng đầu năm 2025','currentLexical':lex,'comparativeLexical':prior,'originalOcrCaptionText':original_caption}
  c={'ticker':'GVR','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':R['fold'](caption),'sourceRowCode':code,'lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':R['numeric_value'](lex),'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':{**q['period'],'start':'2026-01-01','end':'2026-06-30','type':'YTD'},'periodType':'YTD','columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':definition,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,R),item
  rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lex,'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','periodType':'YTD','periodStart':'2026-01-01','periodEnd':'2026-06-30','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':definition});cells.append(c)
 proof=B/'gvr-current-primary-source-image-reader-proof.json'
 proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Actually inspected current and prior image columns. Exact original OCR caption errors and mixed prior-number punctuation are retained, not repaired. Only current values with clean original Vision numeric agreement are admitted. CFO/CFI/CFF original numeric OCR disagreements remain exceptions; no value is fabricated by balancing. Accounting-basis qualification remains UNKNOWN; this cell reading does not establish or change it. No parent/common or normalized-earnings alias.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(c['sourceOcrProofFile']),sha(proof)])
 f=B/'source-image-verified-cells.json';existing=json.loads(f.read_text());existing=[c for c in existing if not(c['bodyHash']==BODY and c['itemId'] in ROWS)]
 f.write_text(json.dumps(existing+cells,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'issuer':'GVR','newSourceImageCells':len(cells),'humanApprovalAsserted':False}))

if __name__=='__main__':main()
