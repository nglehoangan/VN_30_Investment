"""Exact two-reader reconciliation of the required CTG consolidated CAR disclosure."""
import runpy,pathlib,json,re,hashlib,datetime,os,decimal
os.environ['VN30_EVIDENCE_WORK']='data/initialization-08b-remediation-work'
R=runpy.run_path('scripts/reconcile-08b-extraction.py');B=pathlib.Path(os.environ['VN30_EVIDENCE_WORK']);d=json.load(open(B/'bank-disclosure-selection.json'))[0]
pages={n:json.load(open(B/'ocr'/f'{d["bodyHash"]}-p{n}.json')) for n in [1,3,4]}
texts={key:{n:R['fold'](R['full_text'](p,key)) for n,p in pages.items()} for key in ['passA','passB']}
for key in texts:
 assert 'nganhangcongthuongvietnamvietinbank' in R['compact'](texts[key][3])
 assert re.search(r'30\s+thang\s+0?6\s+nam\s+2026',texts[key][1])
 assert 'thong tu 41/2016/tt-nhnn' in texts[key][4]
 assert 'don vi: trieu dong, %' in texts[key][4]
verified=[]
for key in ['passA','passB']:
 groups=R['lines'](pages[4][key]);matches=[]
 for g in groups:
  caption=R['fold'](' '.join(w['text'] for w in g['words'] if w['x']<0.5));caption=re.sub(r'^2\.?\s*','',caption)
  if caption!='ty le an toan von':continue
  nums=[w for w in g['words'] if re.fullmatch(r'\d{1,2}[.,]\d{1,3}%',w['text'])]
  assert len(nums)==2 and all(w['confidence']>=0.8 for w in nums)
  headers=[h for h in groups if h['cy']<g['cy'] and 'rieng le hop nhat' in R['fold'](h['text'])]
  header=max(headers,key=lambda h:h['cy']);scopeWords=[w for w in header['words'] if 'hop' in R['fold'](w['text'])]
  assert len(scopeWords)==1 and abs(nums[1]['x']-scopeWords[0]['x'])<0.07
  matches.append((g,nums[1]))
 assert len(matches)==1;verified.append(matches[0])
assert decimal.Decimal(verified[0][1]['text'].strip('%').replace(',','.'))==decimal.Decimal(verified[1][1]['text'].strip('%').replace(',','.'))
identity=next(i for i in json.load(open('docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json'))['identities'] if i['ticker']=='CTG')
period={'start':'2026-06-30','end':'2026-06-30','type':'INSTANT','fiscalYear':2026,'fiscalQuarter':None,'calendarReference':'SOURCE_EXPLICIT_REGULATORY_AS_OF_DATE'}
qualification={**d,'status':'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE','documentType':'FINANCIAL_DISCLOSURE','securityId':identity['securityId'],'scope':'CONSOLIDATED','period':period,'accountingBasis':'UNKNOWN','auditStatus':'UNKNOWN','qualificationMethod':'TWO_INDEPENDENT_REGULATORY_SOURCE_PAGE_READERS','evidencePages':[1,3,4],'contentEvidencePages':{'ISSUER_IDENTITY':[1,3],'DOCUMENT_TYPE':[1,4],'REPORTING_PERIOD':[1,4],'REPORTING_SCOPE':[4]}}
a,b=verified;page=pages[4];cell={'ticker':'CTG','securityId':identity['securityId'],'documentId':d['documentId'],'bodyHash':d['bodyHash'],'page':4,'itemId':'BANK_REPORTED_CAR','sourceCaption':a[0]['text'],'captionAlternative':'ty le an toan von','lexicalValue':a[1]['text'],'verifiedCanonicalInteger':str(decimal.Decimal(a[1]['text'].strip('%').replace(',','.'))),'verificationLexicalValue':b[1]['text'],'unit':'PERCENT','currency':None,'scope':'CONSOLIDATED','period':period,'periodType':'INSTANT','columnX':a[1]['x'],'rowY':a[0]['cy'],'extractionMethod':page['engineA'],'verificationMethod':page['engineB'],'renderSha256':page['renderSha256'],'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','sourcePageEvidenceHashes':[hashlib.sha256(json.dumps(page[k],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']],'comparativeColumn':False,'definitionEvidence':'Reported total CAR under TT41/2016/TT-NHNN; consolidated column. Tier-one CAR is not relabelled CET1.'}
for name,rows in [('bank-disclosure-qualifications.json',[qualification]),('bank-disclosure-cells.json',[cell])]: (B/name).write_text(json.dumps(rows,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'qualifiedDisclosures':1,'verifiedCells':1,'item':'BANK_REPORTED_CAR','lexical':cell['lexicalValue'],'scope':'CONSOLIDATED'}))
