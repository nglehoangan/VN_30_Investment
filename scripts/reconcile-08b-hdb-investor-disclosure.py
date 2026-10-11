"""Exact HDB own consolidated June 2026 ratios, with source-image chart binding."""
import copy, decimal, hashlib, json, pathlib, re, runpy
B = pathlib.Path('data/initialization-08b-remediation-work')
BODY = '7ce00d54ce06d4e094baf8ca9c8e5c7a276a1510b5f942859682e225851b48c6'
RULES = {
 'BANK_REPORTED_CREDIT_GROWTH': (16, '18.9%', (.15,.25,.23,.27), 'Credit Growth(1)(2) YTD', 'Reported consolidated year-to-date credit growth at June 2026. Credit includes customer lending and corporate bonds excluding VAMC; not customer-loan-only growth.'),
 'BANK_REPORTED_CAR': (16, '14.3%', (.17,.25,.59,.64), 'CAR(1) (Basel II)', 'Reported consolidated Basel II total CAR at June 2026; not Tier 1, CET1 or a future Basel III ratio.'),
 'BANK_REPORTED_NIM': (17, '4.1%', (.08,.13,.69,.74), 'Consolidated NIM (1H2026) — HDB', 'Reported consolidated first-half 2026 NIM; not LTM NIM or a peer-bank ratio.'),
}
def token(page,key,rule):
 _,lex,(xmin,xmax,ymin,ymax),_,_=rule
 matches=[w for w in page[key] if (w['text']==lex or (lex=='18.9%' and key=='passA' and w['text']=='4 18.9% YTD')) and xmin<w['x']<xmax and ymin<w['y']<ymax and w['confidence']>=.8]
 return matches[0] if len(matches)==1 else None

def validate(cell,page,reader):
 try:
  rule=RULES[cell['itemId']];n,lex,_,caption,basis=rule
  if (cell['bodyHash']!=BODY or page['bodyHash']!=BODY or cell['page']!=n or page['page']!=n
      or cell['ticker']!='HDB' or cell['scope']!='CONSOLIDATED' or cell['unit']!='PERCENT' or cell['currency'] is not None
      or cell['periodType']!='INSTANT' or cell['period']['start']!='2026-06-30' or cell['period']['end']!='2026-06-30'
      or cell['lexicalValue']!=lex or cell['verificationLexicalValue']!=lex or cell['verifiedCanonicalInteger']!=str(decimal.Decimal(lex[:-1]))
      or cell['sourceCaption']!=caption or cell['reportedMetricBasis']!=basis
      or cell['extractionMethod']!=page['engineA'] or cell['verificationMethod']!=page['engineB']
      or page['engineA']!='APPLE_VISION_ACCURATE_IMAGE_OCR' or page['engineB']!='TESSERACT_5.5.3_VIE_ENG_PSM6_IMAGE_OCR'):
   return False
  for key in ['passA','passB']:
   t=token(page,key,rule)
   if t is None or cell['sourceLexicalTokens'][key]!=t['text']:return False
   if re.findall(r'\d+[.]\d+%',t['text'])!=[lex]:return False
   text=reader['compact'](reader['full_text'](page,key))
   if reader['compact']('2Q2026') not in text:return False
   if n==16 and reader['compact']('Consolidated figures') not in text:return False
   if n==17:
    if reader['compact']('Consolidated NIM (1H2026)') not in text:return False
    if not any(w['text']=='HDB' and .08<w['x']<.13 and .88<w['y']<.92 and w['confidence']>=.8 for w in page[key]):return False
  if cell['itemId']=='BANK_REPORTED_CREDIT_GROWTH':
   for key in ['passA','passB']:
    text=reader['compact'](reader['full_text'](page,key))
    if reader['compact']('Credit balance includes lending to customers and corporate bonds (excluding VAMC)') not in text:return False
  if n==16 and not any(w['text']=='CAR(1)' and w['x']<.13 and .59<w['y']<.64 for w in page['passA']):return False
  a=token(page,'passA',rule)
  return abs(a['x']-cell['columnX'])<.00001 and abs(a['y']+a['height']/2-cell['rowY'])<.00001
 except (KeyError,TypeError,ValueError):return False

def main():
 r=runpy.run_path('scripts/reconcile-08b-extraction.py')
 d=next(d for d in json.loads((B/'hdb-required-current-results-recovery.json').read_text())['documents'] if d['bodyHash']==BODY)
 assert hashlib.sha256((B/d['file']).read_bytes()).hexdigest()==BODY
 identity=next(i for i in json.loads(pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json').read_text())['identities'] if i['ticker']=='HDB')
 period={'start':'2026-06-30','end':'2026-06-30','type':'INSTANT','fiscalYear':2026,'fiscalQuarter':None,'calendarReference':'SOURCE_EXPLICIT_ISSUER_Q2_END_DATE'}
 q={**d,'securityId':identity['securityId'],'status':'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE','documentType':'FINANCIAL_DISCLOSURE','scope':'CONSOLIDATED','period':period,'accountingBasis':'UNKNOWN','auditStatus':'UNKNOWN','evidencePages':[1,16,17,23],'contentEvidencePages':{'ISSUER_IDENTITY':[1,16,17],'DOCUMENT_TYPE':[1],'REPORTING_PERIOD':[1,16,17,23],'REPORTING_SCOPE':[16,17]}}
 cells=[]
 for item,rule in RULES.items():
  p=json.loads((B/'ocr'/f'{BODY}-p{rule[0]}.json').read_text())
  assert hashlib.sha256((B/'ocr'/f'{BODY}-p{rule[0]}.png').read_bytes()).hexdigest()==p['renderSha256']
  a=token(p,'passA',rule);assert a is not None
  c={'ticker':'HDB','securityId':identity['securityId'],'documentId':d['documentId'],'bodyHash':BODY,'page':rule[0],'itemId':item,'sourceCaption':rule[3],'captionAlternative':'EXACT_HDB_OWN_CONSOLIDATED_IMAGE_DISCLOSURE','lexicalValue':rule[1],'verificationLexicalValue':rule[1],'verifiedCanonicalInteger':str(decimal.Decimal(rule[1][:-1])),'unit':'PERCENT','currency':None,'scope':'CONSOLIDATED','period':period,'periodType':'INSTANT','columnX':a['x'],'rowY':a['y']+a['height']/2,'extractionMethod':p['engineA'],'verificationMethod':p['engineB'],'renderSha256':p['renderSha256'],'sourcePageEvidenceHashes':[hashlib.sha256(json.dumps(p[k],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']],'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'reportedMetricBasis':rule[4],'exactHdbInvestorDisclosureProof':True,'sourceLexicalTokens':{k:token(p,k,rule)['text'] for k in ['passA','passB']},'independentHumanApproval':None}
  assert validate(c,p,r);cells.append(c)
  for field,value in [('scope','SEPARATE_STANDALONE'),('itemId','BANK_REPORTED_CET1'),('verifiedCanonicalInteger','9.1'),('unit','VND'),('page',23),('reportedMetricBasis','LTM'),('lexicalValue','5.2%')]:
   bad=copy.deepcopy(c);bad[field]=value;assert not validate(bad,p,r)
 for name,rows in [('hdb-investor-disclosure-qualifications.json',[q]),('hdb-investor-disclosure-cells.json',cells)]:
  (B/name).write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'issuer':'HDB','verifiedReportedRatios':len(cells),'negativeControls':7*len(cells),'independentHumanApproval':None}))
if __name__=='__main__':main()
