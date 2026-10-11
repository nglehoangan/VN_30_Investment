"""Inspected GAS closing ordinary-share row with exact repeated-value geometry."""
import copy,datetime,hashlib,json,pathlib,runpy,re
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='a90c4b06b6fa67215ee83247c8f2ea7b5cf8bdba8cc968b226e52c55ce568886'
ROWS={
 'ORDINARY_SHARES_OUTSTANDING':(53,'2.412.949.756','SHARES','26','Số lượng cổ phiếu đang lưu hành — Cổ phiếu phổ thông','2.412.949.756',.64,.67,.826,.831,['Số lượng cổ phiếu đang lưu hành','Cổ phiếu phổ thông','Số cuối kỳ','Số đầu kỳ']),
 'CASH_DIVIDENDS_DECLARED':(52,'6.032.374.390.000','CURRENCY','26(i)','Cổ tức bằng tiền đã được Đại hội đồng cổ đông thông qua','6.032.374.390.000 VND từ nguồn lợi nhuận sau thuế chưa phân phối năm 2025. Đến',.23,.25,.365,.375,['47/NQ-KVN ngày 22 tháng 5 năm 2026','Tổng Công ty Khí Việt Nam - Công ty Cổ phần','chia cổ tức bằng tiền tương ứng 25% vốn điều lệ cho các cổ đông với số tiền','đang trong quá trình thực hiện các']),
}
def validate(c,p,r):
 try:
  n,lex,unit,code,caption,raw,xmin,xmax,ymin,ymax,anchors=ROWS[c['itemId']];stock=c['itemId']=='ORDINARY_SHARES_OUTSTANDING';d=c['sourceImageColumnDefinition']
  if (c['ticker']!='GAS' or c['bodyHash']!=BODY or p['bodyHash']!=BODY or c['page']!=n or p['page']!=n
      or c['lexicalValue']!=lex or c['verificationLexicalValue']!=lex or c['unit']!=unit or c['currency']!=(None if stock else 'VND')
      or c['sourceRowCode']!=code or c['sourceCaption']!=caption or c['scope']!='CONSOLIDATED'
      or c['periodType']!=('INSTANT' if stock else 'YTD') or c['period']['start']!=('2026-06-30' if stock else '2026-01-01') or c['period']['end']!='2026-06-30'
      or c['extractionMethod']!=p['engineA'] or p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR'
      or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING' or c['independentHumanApproval'] is not None
      or d!={'layout':'GAS_EXACT_ORDINARY_DISTRIBUTION_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'originalSourceWordText':raw,'sourceRowCode':code}):return False
  ws=[w for w in p['passA'] if w['text']==raw and xmin<w['x']<xmax and ymin<w['y']<ymax and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
  if len(ws)!=1 or re.findall(r'\d+(?:\.\d{3})+',raw)!=[lex]:return False
  text=r['compact'](r['full_text'](p,'passA'))
  if not all(r['compact'](a) in text for a in anchors+['TỔNG CÔNG TY KHÍ VIỆT NAM','HỢP NHẤT']+(['ngày 30 tháng 6 năm','2026'] if stock else [])):return False
  if stock:
   if not any(w['text']=='2.412.949.756' and .81<w['x']<.84 and ymin<w['y']<ymax for w in p['passA']):return False
  return r['numeric_value'](lex)==c['verifiedCanonicalInteger']
 except (KeyError,TypeError,ValueError):return False

def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest();q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='UNKNOWN' and sha(B/(BODY+'.pdf'))==BODY
 cells=[];rows=[];controls=0
 for item,spec in ROWS.items():
  n,lex,unit,code,caption,raw,xmin,xmax,ymin,ymax,_=spec;stock=item=='ORDINARY_SHARES_OUTSTANDING';f=B/'ocr'/f'{BODY}-p{n}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256']
  w=next(w for w in p['passA'] if w['text']==raw and xmin<w['x']<xmax and ymin<w['y']<ymax)
  period={**q['period'],'start':'2026-06-30' if stock else '2026-01-01','type':'INSTANT' if stock else 'YTD'};d={'layout':'GAS_EXACT_ORDINARY_DISTRIBUTION_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'originalSourceWordText':raw,'sourceRowCode':code}
  c={'ticker':'GAS','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':r['fold'](caption),'sourceRowCode':code,'lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':r['numeric_value'](lex),'unit':unit,'currency':None if stock else 'VND','scope':'CONSOLIDATED','period':period,'periodType':period['type'],'columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,r),item
  for key,value in [('lexicalValue','1.469.693.177'),('sourceRowCode','71'),('scope','SEPARATE_STANDALONE'),('unit','MILLION_CURRENCY'),('rowY',.794),('period',{**period,'end':'2026-07-17'}),('verifiedCanonicalInteger','0')]:
   bad=copy.deepcopy(c);bad[key]=value;assert not validate(bad,p,r);controls+=1
  cells.append(c);rows.append({'bodyHash':BODY,'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lex,'unit':unit,'currency':c['currency'],'scope':'CONSOLIDATED','periodType':period['type'],'periodStart':period['start'],'periodEnd':period['end'],'renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d})
 proof=B/'gas-ordinary-distribution-source-image-reader-proof.json';proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'limitations':['Pages 52 and 53 source images inspected. The parent issuer cash dividend was expressly approved on 22 May 2026 for its ordinary shareholders. It is a declaration in H1 2026 funded from FY2025 retained earnings; it is not a 2025-period declaration, subsidiary dividend, dividend-payable balance or cash-paid flow. The lower ordinary-share row under explicitly outstanding shares is selected by its actual coordinates; identical issued-share and prior values do not authorize selecting those rows. Stock date is explicitly 30 June 2026 in the accompanying capital paragraph. No weighted-average EPS denominator, inferred capital division, common equity or weighted-average shares are inferred. Original accounting-basis UNKNOWN remains unchanged.']},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[c for c in old if not(c['bodyHash']==BODY and c['itemId'] in ROWS)];out.write_text(json.dumps(old+cells,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'ticker':'GAS','ordinaryDistributionCells':len(cells),'negativeControls':controls}))
if __name__=='__main__':main()
