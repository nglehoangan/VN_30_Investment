"""Exact inspected FY2024 VNM image cells; untouched OCR is the independent reader."""
import datetime, hashlib, json, pathlib, runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='a70f448abc8aa61f0b6d25a281a1af4bf0d46d7309083d18556129cc53620450'
# Page, canonical item, printed code, current/prior lexical values, actual image caption.
ROWS=[
 (10,'REVENUE','10','61.782.609.528.445','60.368.915.511.505','Doanh thu thuần về bán hàng và cung cấp dịch vụ'),
 (10,'GROSS_PROFIT','20','25.590.176.323.124','24.544.731.615.410','Lợi nhuận gộp về bán hàng và cung cấp dịch vụ'),
 (13,'CFI_SUPPORTING','30','(3.739.092.638.543)','(2.988.548.510.501)','Lưu chuyển tiền thuần từ hoạt động đầu tư'),
 (13,'CFF_SUPPORTING','40','(6.641.260.238.228)','(4.292.773.661.270)','Lưu chuyển tiền thuần từ hoạt động tài chính'),
 (14,'NET_CASH_CHANGE_SUPPORTING','50','(694.415.337.425)','606.101.390.592','Lưu chuyển tiền thuần trong năm')]
def validate(c,p,R):
 row=next((r for r in ROWS if (r[0],r[1])==(c.get('page'),c.get('itemId'))),None)
 d=c.get('sourceImageColumnDefinition',{})
 if not row or (c.get('sourceRowCode'),c.get('lexicalValue'),d.get('comparativeLexical'),c.get('sourceCaption'))!=row[2:]:return False
 if not(c.get('bodyHash')==BODY and c.get('ticker')=='VNM' and c.get('scope')=='CONSOLIDATED' and c.get('unit')=='CURRENCY' and c.get('currency')=='VND' and c.get('periodType')=='ANNUAL' and c.get('period',{}).get('start')=='2024-01-01' and c['period'].get('end')=='2024-12-31' and d.get('currentColumnOrdinal')==0 and d.get('currentLexical')==row[3] and .56<c.get('columnX',0)<.63):return False
 text=R['compact'](R['full_text'](p,'passB'))
 if not all(R['compact'](s) in text for s in ['hợp nhất','năm kết thúc ngày 31 tháng 12 năm 2024','2024','2023','VND']):return False
 values=[w for w in p['passA'] if row[3] in w['text'].split() and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
 if len(values)!=1 or values[0]['text'].split()[0]!=row[3]:return False
 if not any(w['text'].split()[0]==row[2] and .44<w['x']<.49 and abs(w['y']+w['height']/2-c['rowY'])<.02 for w in p['passA']):return False
 if row[4] not in values[0]['text'] and not any(row[4] in w['text'] and w['x']>.72 and abs(w['y']+w['height']/2-c['rowY'])<.02 for w in p['passA']):return False
 return True
def main():
 R=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
 assert sha(B/(BODY+'.pdf'))==BODY
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['accountingBasis']=='VAS' and q['auditStatus']=='AUDITED' and q['period']['end']=='2024-12-31'
 cells=[]
 for page,item,code,lex,prior,caption in ROWS:
  f=B/'ocr'/f'{BODY}-p{page}.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256']
  w=next(w for w in p['passA'] if lex in w['text'].split())
  c={'ticker':'VNM','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':page,'itemId':item,'sourceCaption':caption,'captionAlternative':R['fold'](caption),'sourceRowCode':code,'lexicalValue':lex,'verificationLexicalValue':lex,'verifiedCanonicalInteger':R['numeric_value'](lex),'unit':'CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':q['period'],'periodType':'ANNUAL','columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':{'layout':'VNM_EXACT_ANNUAL_STATEMENT_IMAGE','currentColumnOrdinal':0,'currentLexical':lex,'comparativeLexical':prior},'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
  assert validate(c,p,R),item;cells.append(c)
 proof=B/'vnm-annual-statement-source-image-reader-proof.json'
 proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'actualInspectedPages':[10,13,14],'rows':[{**c,'periodStart':c['period']['start'],'periodEnd':c['period']['end'],'currentLexical':c['lexicalValue'],'rowCode':c['sourceRowCode'],'caption':c['sourceCaption']} for c in cells],'limitations':'No normalization, CAPEX classification, historical publication timestamp or production approval inferred.'},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[c for c in old if not(c['bodyHash']==BODY and c['itemId'] in {r[1] for r in ROWS})]+cells;out.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n');print({'newCells':len(cells)})
if __name__=='__main__':main()
