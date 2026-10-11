"""Inspected MWG ordinary-share and declared-distribution source rows."""
import copy,datetime,hashlib,json,pathlib,runpy,re
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='41350653181ec9248619dcc8ec090f97a988ed9413aa313cb08c1f0a161b4450'
ROWS={
 'ORDINARY_SHARES_OUTSTANDING':(45,'1.468.423.529','SHARES','24.3','Cổ phiếu đang lưu hành — Cổ phiếu phổ thông','1.468.423.529',.59,.64,.35,.38,['Cổ phiếu đang lưu hành','Cổ phiếu phổ thông','Số cuối kỳ','Số đầu kỳ']),
 'BASIC_EPS':(11,'4.098','CURRENCY_PER_SHARE','70','Lãi cơ bản trên cổ phiếu','4.098',.64,.69,.24,.26,['21. Lãi cơ bản trên cổ phiếu','Kỳ này','Kỳ trước']),
 'CASH_DIVIDENDS_DECLARED':(44,'2.936.913.526.000','CURRENCY','24.2','Cổ tức đã công bố','2.936.913.526.000',.54,.60,.79,.82,['Cổ tức đã công bố','Cổ tức đã chi trả bằng tiền','Kỳ này','Kỳ trước']),
 'SHARE_REPURCHASES':(44,'332.340.000','CURRENCY','24.1(i)','Mua lại cổ phiếu ESOP trong kỳ','mua là 332.340.000 VND.',.22,.27,.23,.26,['ngày 23 tháng 1 năm 2026','mua lại 33.234 cổ phiếu','mua là 332.340.000 VND.']),
}
def validate(c,p,r):
 try:
  n,lex,unit,code,caption,raw,xmin,xmax,ymin,ymax,anchors=ROWS[c['itemId']];stock=c['itemId']=='ORDINARY_SHARES_OUTSTANDING';d=c['sourceImageColumnDefinition']
  if (c['ticker']!='MWG' or c['bodyHash']!=BODY or p['bodyHash']!=BODY or c['page']!=n or p['page']!=n
      or c['lexicalValue']!=lex or c['verificationLexicalValue']!=lex or c['unit']!=unit or c['currency']!=(None if stock else 'VND')
      or c['sourceRowCode']!=code or c['sourceCaption']!=caption or c['scope']!='CONSOLIDATED'
      or c['periodType']!=('INSTANT' if stock else 'YTD') or c['period']['start']!=('2026-06-30' if stock else '2026-01-01') or c['period']['end']!='2026-06-30'
      or c['extractionMethod']!=p['engineA'] or p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR'
      or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING' or c['independentHumanApproval'] is not None
      or d!={'layout':'MWG_EXACT_ORDINARY_DISTRIBUTION_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'originalSourceWordText':raw,'sourceRowCode':code}):return False
  ws=[w for w in p['passA'] if w['text']==raw and xmin<w['x']<xmax and ymin<w['y']<ymax and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(ws)!=1 or re.findall(r'\d+(?:\.\d{3})+',raw)!=[lex]:return False
  text=r['compact'](r['full_text'](p,'passA'))
  if not all(r['compact'](a) in text for a in anchors+['Công ty Cổ phần Đầu tư Thế Giới Di Động','HỢP NHẤT','30 tháng 6 năm 2026','sáu tháng']):return False
  if stock:
   if not any(w['text']=='1.468.456.763' and .75<w['x']<.81 and ymin<w['y']<ymax for w in p['passA']):return False
  elif c['itemId']=='BASIC_EPS':
   if not any(w['text']=='2.175' and .80<w['x']<.86 and ymin<w['y']<ymax for w in p['passA']):return False
  elif c['itemId']=='CASH_DIVIDENDS_DECLARED':
   if not any(w['text']=='1.478.456.763.000' and .71<w['x']<.78 and ymin<w['y']<ymax for w in p['passA']):return False
  return r['numeric_value'](lex)==c['verifiedCanonicalInteger']
 except (KeyError,TypeError,ValueError):return False

def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest();q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='VAS' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[];controls=0
 for item,spec in ROWS.items():
  n,lex,unit,code,caption,raw,xmin,xmax,ymin,ymax,_=spec;stock=item=='ORDINARY_SHARES_OUTSTANDING';f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256']
  w=next(w for w in p['passA'] if w['text']==raw and xmin<w['x']<xmax and ymin<w['y']<ymax)
  period={**q['period'],'start':'2026-06-30' if stock else '2026-01-01','type':'INSTANT' if stock else 'YTD'};d={'layout':'MWG_EXACT_ORDINARY_DISTRIBUTION_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'originalSourceWordText':raw,'sourceRowCode':code}
  c={'ticker':'MWG','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':r['numeric_value'](lex),'unit':unit,'currency':None if stock else 'VND','scope':'CONSOLIDATED','period':period,'periodType':period['type'],'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,r),item
  for key,value in [('lexicalValue','1.469.693.177'),('sourceRowCode','71'),('scope','SEPARATE_STANDALONE'),('unit','MILLION_CURRENCY'),('rowY',.275),('period',{**period,'end':'2026-07-17'}),('verifiedCanonicalInteger','0')]:
   bad=copy.deepcopy(c);bad[key]=value;assert not validate(bad,p,r);controls+=1
  cells.append(c);rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lex,'unit':unit,'currency':c['currency'],'scope':'CONSOLIDATED','periodType':period['type'],'periodStart':period['start'],'periodEnd':period['end'],'renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d})
 proof=B/'mwg-ordinary-distribution-source-image-reader-proof.json';proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Exact source images inspected. Closing ordinary shares exclude treasury shares and the July subsequent ESOP event. Basic EPS binds to row 70, although diluted EPS row 71 happens to have the same value. Dividends are declared in H1 2026, not the dash-valued cash-paid row. Repurchase is the expressly reported January 2026 positive VND payment amount in note 24.1(i); not inferred from treasury-share stock or an automatic sign reversal. No common-equity or normalized-profit alias.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[c for c in old if not(c['bodyHash']==BODY and c['itemId'] in ROWS)];out.write_text(json.dumps(old+cells,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'ticker':'MWG','ordinaryDistributionCells':len(cells),'negativeControls':controls}))
if __name__=='__main__':main()
