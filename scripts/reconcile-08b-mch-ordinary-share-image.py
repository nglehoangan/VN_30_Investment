"""Exact MCH closing ordinary shares; grouped original OCR geometry is retained."""
import copy,datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='4974b488d0511d3d80619912a8e2e9ad06bcb3bb4b416876bfcd4800ae2c1082'
RAW='1.294.460.962 12.944.609.620.000 1.056.705.358 10.567.053.580.000'
LEX='1.294.460.962'
def validate(c,p,r):
 try:
  if (c['ticker']!='MCH' or c['bodyHash']!=BODY or p['bodyHash']!=BODY or c['page']!=56 or p['page']!=56 or c['itemId']!='ORDINARY_SHARES_OUTSTANDING' or c['lexicalValue']!=LEX or c['verificationLexicalValue']!=LEX or c['unit']!='SHARES' or c['currency'] is not None or c['scope']!='CONSOLIDATED' or c['sourceRowCode']!='27' or c['sourceCaption']!='Vốn cổ phần hiện đang lưu hành — Cổ phiếu phổ thông' or c['periodType']!='INSTANT' or c['period']['start']!='2026-06-30' or c['period']['end']!='2026-06-30' or c['comparativeColumn'] is not False or c['independentHumanApproval'] is not None or c['extractionMethod']!=p['engineA'] or p['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR' or c['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING'):return False
  d={'layout':'MCH_EXACT_CLOSING_ORDINARY_SHARES_IMAGE','currentColumnOrdinal':0,'currentLexical':LEX,'originalSourceWordText':RAW,'sourceRowCode':'27'}
  if c['sourceImageColumnDefinition']!=d:return False
  ws=[w for w in p['passA'] if w['text']==RAW and .35<w['x']<.37 and .39<w['y']<.41 and w['confidence']>=.8 and abs(c['columnX']-w['x'])<.001 and abs(c['rowY']-w['y']-w['height']/2)<.001]
  if len(ws)!=1:return False
  caption=' '.join(w['text'] for w in p['passA'] if w['x']<.35 and .375<w['y']<.415)
  t=r['compact'](r['full_text'](p,'passA'))
  return (r['compact']('Vốn cổ phần hiện đang lưu hành') in r['compact'](caption) and r['compact']('Cổ phiếu phổ thông') in r['compact'](caption) and all(r['compact'](a) in t for a in ['Công ty Cổ phần Hàng tiêu dùng Masan','hợp nhất','30/6/2026','1/1/2026','Số cổ phiếu','Cổ phiếu mua lại của chính mình']) and c['verifiedCanonicalInteger']=='1294460962')
 except (KeyError,ValueError,TypeError):return False

def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest();q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
 assert q['scope']=='CONSOLIDATED' and q['auditStatus']=='REVIEWED' and q['accountingBasis']=='VAS' and sha(B/(BODY+'.pdf'))==BODY
 f=B/'ocr'/f'{BODY}-p56.json';p=json.loads(f.read_text());assert sha(f.with_suffix('.png'))==p['renderSha256'];w=next(w for w in p['passA'] if w['text']==RAW)
 period={**q['period'],'start':'2026-06-30','type':'INSTANT'};d={'layout':'MCH_EXACT_CLOSING_ORDINARY_SHARES_IMAGE','currentColumnOrdinal':0,'currentLexical':LEX,'originalSourceWordText':RAW,'sourceRowCode':'27'}
 c={'ticker':'MCH','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':BODY,'page':56,'itemId':'ORDINARY_SHARES_OUTSTANDING','sourceCaption':'Vốn cổ phần hiện đang lưu hành — Cổ phiếu phổ thông','captionAlternative':r['fold']('Vốn cổ phần hiện đang lưu hành — Cổ phiếu phổ thông'),'sourceRowCode':'27','lexicalValue':LEX,'verificationLexicalValue':LEX,'verifiedCanonicalInteger':'1294460962','unit':'SHARES','currency':None,'scope':'CONSOLIDATED','period':period,'periodType':'INSTANT','columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)};assert validate(c,p,r)
 for key,value in [('lexicalValue','1.294.493.545'),('unit','CURRENCY'),('currency','VND'),('rowY',.875),('scope','SEPARATE_STANDALONE'),('sourceRowCode','37'),('verifiedCanonicalInteger','0'),('independentHumanApproval','FAKE')]:
  bad=copy.deepcopy(c);bad[key]=value;assert not validate(bad,p,r),key
 proof=B/'mch-closing-ordinary-share-source-image-reader-proof.json';row={'bodyHash':BODY,'page':56,'itemId':c['itemId'],'caption':c['sourceCaption'],'rowCode':'27','currentLexical':LEX,'unit':'SHARES','currency':None,'scope':'CONSOLIDATED','periodType':'INSTANT','periodStart':'2026-06-30','periodEnd':'2026-06-30','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d}
 proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':[row],'limitations':['Page 56 actually inspected. The first count in the grouped current-count/current-VND/prior-count/prior-VND region is selected. The whole original region and actual geometry remain retained. Issued shares 1,294,493,545 and treasury shares 32,583 are separate source rows, not substituted. The identical weighted-average EPS count on page 62 is not the closing-share authority. No arithmetic or common-profit/equity alias.']},ensure_ascii=False,indent=2)+'\n')
 c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(f),sha(proof)]);out=B/'source-image-verified-cells.json';old=json.loads(out.read_text());old=[x for x in old if not(x['bodyHash']==BODY and x['itemId']==c['itemId'])];out.write_text(json.dumps(old+[c],ensure_ascii=False,indent=2)+'\n');print(json.dumps({'ticker':'MCH','closingOrdinaryShareCells':1,'negativeControls':8}))
if __name__=='__main__':main()
