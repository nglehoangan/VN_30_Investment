"""Verify the exact LPB June regulatory CAR; Tier 1 CAR is not CET1."""
import decimal,hashlib,json,pathlib,re,runpy
B=pathlib.Path('data/initialization-08b-remediation-work');R=runpy.run_path('scripts/reconcile-08b-extraction.py');d=json.loads((B/'lpb-current-capital-vn-exact-recovery.json').read_text())['documents'][0]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();assert sha(B/d['file'])==d['bodyHash']
pages={n:json.loads((B/'ocr'/f"{d['bodyHash']}-p{n}.json").read_text()) for n in [1,2,4,6]}
for key in ['passA','passB']:
 texts={n:R['fold'](R['full_text'](p,key)) for n,p in pages.items()}
 assert 'fortune vietnam joint stock' in texts[1] and 'broker code: lpb' in texts[1]
 assert 'cong bo thong tin ve ty le an toan von' in texts[2] and 'ky: 30/06/2026' in texts[2]
 assert all(s in texts[4] for s in ['41/2016/tt-nhnn','22/2023/tt-nhnn','30/06/2026','von cap 1','von cap 2'])
 assert '30/06/2026' in texts[6]
for n,p in pages.items():assert sha(B/'ocr'/f"{d['bodyHash']}-p{n}.png")==p['renderSha256']
verified=[]
for key in ['passA','passB']:
 gs=R['lines'](pages[6][key]);rows=[g for g in gs if 'ty le an toan von (car)' in R['fold'](g['text']) and 'cap 1' not in R['fold'](g['text'])];assert len(rows)==1
 row=rows[0];nums=[w for w in row['words'] if re.fullmatch(r'\d{2},\d{2}%',w['text'])];assert len(nums)==2 and all(w['confidence']>=.8 for w in nums)
 headers=[g for g in gs if g['cy']<row['cy'] and 'rieng le' in R['fold'](g['text']) and 'hop nhat' in R['fold'](g['text'])];assert len(headers)==1
 standalone=[w for w in headers[0]['words'] if R['fold'](w['text'])=='rieng' or R['fold'](w['text'])=='rieng le'];assert len(standalone)==1 and abs(nums[0]['x']-standalone[0]['x'])<.08
 verified.append((row,nums[0]))
assert verified[0][1]['text']==verified[1][1]['text']=='11,18%'
identity=next(i for i in json.loads(pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json').read_text())['identities'] if i['ticker']=='LPB')
period={'start':'2026-06-30','end':'2026-06-30','type':'INSTANT','fiscalYear':2026,'fiscalQuarter':None,'calendarReference':'SOURCE_EXPLICIT_REGULATORY_AS_OF_DATE'}
q={**d,'securityId':identity['securityId'],'status':'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE','documentType':'FINANCIAL_DISCLOSURE','scope':'SEPARATE_STANDALONE','period':period,'accountingBasis':'UNKNOWN','auditStatus':'UNKNOWN','qualificationMethod':'TWO_INDEPENDENT_REGULATORY_SOURCE_PAGE_READERS','evidencePages':[1,2,4,6],'contentEvidencePages':{'ISSUER_IDENTITY':[1,4],'DOCUMENT_TYPE':[2,4],'REPORTING_PERIOD':[1,2,4,6],'REPORTING_SCOPE':[4,6]}}
p=pages[6];a,b=verified
c={'ticker':'LPB','securityId':identity['securityId'],'documentId':d['documentId'],'bodyHash':d['bodyHash'],'page':6,'itemId':'BANK_REPORTED_CAR','sourceCaption':a[0]['text'],'captionAlternative':'ty le an toan von (car)','lexicalValue':a[1]['text'],'verificationLexicalValue':b[1]['text'],'verifiedCanonicalInteger':str(decimal.Decimal(a[1]['text'].rstrip('%').replace(',','.'))),'unit':'PERCENT','currency':None,'scope':'SEPARATE_STANDALONE','period':period,'periodType':'INSTANT','columnX':a[1]['x'],'rowY':a[0]['cy'],'extractionMethod':p['engineA'],'verificationMethod':p['engineB'],'renderSha256':p['renderSha256'],'sourcePageEvidenceHashes':[hashlib.sha256(json.dumps(p[k],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']],'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'definitionEvidence':'Reported total CAR under TT41/2016 as amended by TT22/2023; explicit standalone column. 8.35% Tier 1 CAR is not CET1. This ratio is not the earlier unspecified-regime 11.23% article claim, which remains retained separately.'}
(B/'lpb-capital-vn-disclosure-qualifications.json').write_text(json.dumps([q],ensure_ascii=False,indent=2)+'\n');(B/'lpb-capital-vn-disclosure-cells.json').write_text(json.dumps([c],ensure_ascii=False,indent=2)+'\n');print(json.dumps({'qualifiedDisclosures':1,'verifiedCells':1,'item':'BANK_REPORTED_CAR','lexical':c['lexicalValue'],'scope':c['scope']}))
