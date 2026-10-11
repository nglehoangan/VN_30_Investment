"""FPT-only ordinary attribution from the inspected closed capital partition.

Read the reported parent section of note 25; never subtract NCI or alias a
retained total/parent observation. Original OCR and punctuation stay retained.
"""
import datetime,hashlib,json,pathlib,re,runpy
B=pathlib.Path('data/initialization-08b-remediation-work');H='45636554f28c7e6c2f38458b9a22410ed1f67e80627d672b827019a67f299df8'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
ROWS={'COMMON_EQUITY':('39.851.463.524.930','Số dư tại ngày 30/06/2026',.663),'NET_INCOME_ATTRIBUTABLE_COMMON':('5.054.958.601.533','Lợi nhuận thuần trong kỳ',.544)}
def validate_classification(c,R):
 try:
  f=B/'fpt-ordinary-capital-classification-proof.json'
  if c.get('ordinaryAttributionProofFile')!=str(f) or c.get('ordinaryAttributionProofSha256')!=sha(f):return False
  e=json.loads(f.read_text())
  if c['itemId'] not in ROWS or c['bodyHash']!=H or c['scope']!='CONSOLIDATED' or c['period']['end']!='2026-06-30':return False
  if e['bodyHash']!=H or e['scope']!='CONSOLIDATED' or e['asOf']!='2026-06-30' or e['governanceStatus']!='REVIEW_CANDIDATE' or e['independentHumanApproval'] is not None or e['genericAliasAllowed'] is not False or e['sourceImageReadingMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING' or e['actualInspectedPages']!=[50,51,52] or [x['page'] for x in e['sources']]!=[50,51,52]:return False
  for s in e['sources']:
   pth=B/'ocr'/f"{H}-p{s['page']}.json"
   if s['file']!=str(pth) or s['sha256']!=sha(pth) or s['renderSha256']!=sha(pth.with_suffix('.png')):return False
   p=json.loads(pth.read_text())
   if p['bodyHash']!=H or p['page']!=s['page'] or p['renderSha256']!=s['renderSha256'] or p['engineA']==p['engineB']:return False
   for key in ['passA','passB']:
    text=R['compact'](R['full_text'](p,key))
    if not all(R['compact'](a) in text for a in s['anchors']):return False
   if s['page']==51:
    # Positive total-issued and ordinary-issued rows, not a search for an
    # absent preferred label. Narrative "ưu đãi" concerns restricted shares;
    # equal residual rights and the closed partition govern the definition.
    for key in ['passA']:
     for y in [.447,.462]:
      words=[w for w in p[key] if abs(w['y']-y)<.006 and w['text']=='1.703.507.121' and w['x']>.6 and w['confidence']>=.8]
      if len(words)!=2:return False
   if s['page']==52:
    # Actual image confirms ordinary capital == total capital on the
    # 30/06/2026 closing row. Reader B has low confidence on its slash
    # punctuation and does NOT count as a verified numeric reading here.
    # Original reader A + the separately recorded actual image reading apply.
    for key in ['passA']:
     words=[w for w in p[key] if .46<w['y']<.478 and w['x']>.63 and re.sub(r'\D','',w['text'])=='17035071210000' and w['confidence']>=.8]
     if len(words)!=2:return False
  return True
 except (KeyError,OSError,ValueError):return False
def validate(c,p,R):
 d=c.get('sourceImageColumnDefinition') or {};r=ROWS.get(c.get('itemId'))
 if not r or not validate_classification(c,R):return False
 lex,caption,y=r;stock=c['itemId']=='COMMON_EQUITY';text=R['compact'](R['full_text'](p,'passA'))
 return (c['bodyHash']==H and c['page']==50 and c['scope']=='CONSOLIDATED' and c['sourceRowCode']=='NOTE_25_A_PARENT_ORDINARY_SECTION' and c['sourceCaption']==caption
  and c['lexicalValue']==d.get('currentLexical')==lex and c['unit']=='CURRENCY' and c['currency']=='VND'
  and c['periodType']==('INSTANT' if stock else 'YTD') and c['period']['start']==('2026-06-30' if stock else '2026-01-01') and c['period']['end']=='2026-06-30'
  and d.get('reportedPartition')=='PARENT_SECTION_BEFORE_NONCONTROLLING_INTEREST_SECTION' and d.get('arithmeticPerformed') is False
  and .88<c['columnX']<.97 and abs(c['rowY']-y)<.02
  and any(w['text']==lex and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001 for w in p['passA'])
  and all(R['compact'](s) in text for s in [caption,'VND','30/06/2026','Lợi ích cổ đông không kiểm soát','Tổng cộng','1.144.217.283.327','40.995.680.808.257','36.482.943.944.772']))
def main():
 R=runpy.run_path('scripts/reconcile-08b-extraction.py');q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==H);assert q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED'
 sources=[]
 for n,anchors in [(50,['VỐN CHỦ SỞ HỮU','30/06/2026','Lợi ích cổ đông không kiểm soát','Tổng cộng','40.995.680.808.257','1.144.217.283.327']),(51,['Số cổ phiếu đang lưu hành','30/06/2026','31/12/2025','Cổ phiếu đã phát hành','Cổ phiếu phổ thông','1.703.507.121']),(52,['Chi tiết vốn góp của chủ sở hữu','phổ thông','Tổng cộng','17.035.071.210.000','31 tháng 12 năm 2025'])]:
  f=B/'ocr'/f'{H}-p{n}.json';p=json.loads(f.read_text());assert p['renderSha256']==sha(f.with_suffix('.png'));sources.append({'page':n,'file':str(f),'sha256':sha(f),'renderSha256':p['renderSha256'],'anchors':anchors})
 cls=B/'fpt-ordinary-capital-classification-proof.json';cls.write_text(json.dumps({'bodyHash':H,'scope':'CONSOLIDATED','asOf':'2026-06-30','governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'genericAliasAllowed':False,'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':sources,'sourceImageReadingMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','actualInspectedPages':[50,51,52],'classification':'POSITIVE_CLOSED_PARENT_ORDINARY_CAPITAL_PARTITION_WITH_SEPARATE_NONCONTROLLING_SECTION','rationale':'Note 25(b) positively shows total issued and issued ordinary shares both 1,703,507,121. Note 25(c–d) explicitly shows all ownership shares ordinary and closing ordinary capital and total capital both 17,035,071,210,000 VND. The note states equal residual priority for ordinary shares; a later restriction paragraph calls restricted employee shares ưu đãi, without a separate preferred capital partition or different residual rights. Note 25(a) directly reports parent-section closing equity 39,851,463,524,930 VND and parent-section period profit 5,054,958,601,533 VND before the separate NCI section. Read these reported amounts, without subtraction or a global total/parent alias. Profit is not declared economically normalized; FTEL perimeter change remains a comparability issue.','ocrDisagreementsRetained':'Page 50 reader B appends a dot to parent closing equity. Page 52 reader B uses slash separators in the current ordinary/total capital amounts; raw words remain unchanged. Actual image reading establishes the printed punctuation and closed capital partition.'},ensure_ascii=False,indent=2)+'\n')
 f=B/'ocr'/f'{H}-p50.json';p=json.loads(f.read_text());cells=[];rows=[]
 for item,(lex,caption,_) in ROWS.items():
  w=next(w for w in p['passA'] if w['text']==lex and w['x']>.88);stock=item=='COMMON_EQUITY';start='2026-06-30' if stock else '2026-01-01';typ='INSTANT' if stock else 'YTD';d={'layout':'FPT_REVIEWED_ORDINARY_CAPITAL_NOTE_25','currentLexical':lex,'reportedPartition':'PARENT_SECTION_BEFORE_NONCONTROLLING_INTEREST_SECTION','arithmeticPerformed':False}
  c={'ticker':'FPT','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':H,'page':50,'itemId':item,'sourceCaption':caption,'captionAlternative':R['fold'](caption),'sourceRowCode':'NOTE_25_A_PARENT_ORDINARY_SECTION','lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':R['numeric_value'](lex),'unit':'CURRENCY','currency':'VND','scope':q['scope'],'period':{**q['period'],'start':start,'end':'2026-06-30','type':typ},'periodType':typ,'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f),'ordinaryAttributionProofFile':str(cls),'ordinaryAttributionProofSha256':sha(cls)};assert validate(c,p,R),item;cells.append(c)
  rows.append({'bodyHash':H,'page':50,'itemId':item,'caption':caption,'rowCode':c['sourceRowCode'],'currentLexical':lex,'unit':'CURRENCY','currency':'VND','scope':q['scope'],'periodType':typ,'periodStart':start,'periodEnd':'2026-06-30','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d})
 proof=B/'fpt-ordinary-capital-source-image-reader-proof.json';proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'classificationProofFile':str(cls),'classificationProofSha256':sha(cls),'sourceRisk':'Document-specific positive ordinary attribution; no global alias, subtraction or normalized-earnings claim.'},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(f),sha(proof),sha(cls)])
 out=B/'source-image-verified-cells.json';existing=json.loads(out.read_text());existing=[c for c in existing if not(c['bodyHash']==H and c['itemId'] in ROWS)]+cells;out.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'sourceImageCells':len(existing),'newFptOrdinaryCells':len(cells)}))
if __name__=='__main__':main()
