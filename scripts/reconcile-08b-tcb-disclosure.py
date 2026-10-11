"""Exact public TCB CASA operands with the issuer's stated consolidated CASA definition."""
import runpy,pathlib,json,hashlib,os,datetime,re,decimal
os.environ['VN30_EVIDENCE_WORK']='data/initialization-08b-remediation-work'
R=runpy.run_path('scripts/reconcile-08b-extraction.py');B=R['B'];d=json.load(open(B/'tcb-special-selection.json'))[0]
pages={n:json.load(open(B/'ocr'/f'{d["bodyHash"]}-p{n}.json')) for n in [1,4,11,12]}
texts={key:{n:R['fold'](R['full_text'](p,key)) for n,p in pages.items()} for key in ['passA','passB']}
values=[];ratios={}
for key in texts:
 assert 'vietnam technological and commercial joint stock bank' in texts[key][1]
 assert 'six months ended 30 june 2026' in texts[key][1]
 assert 'all numbers are consolidated, unless otherwise noted' in texts[key][12]
 assert 'casa balance and ratio include auto-earning' in texts[key][12]
 assert 'in the “savings account” component computation' in texts[key][12]
 assert 'casa – current account savings account' in texts[key][11]
 assert 'nim ltm based on daily interest earning assets in the reporting period' in texts[key][12]
 deposit=re.search(r'customer deposits stood at vnd (\d+\.\d+) trillion',texts[key][4]);casa=re.search(r'casa \(including auto-earning\) accounted for (\d+\.\d+)% of total customer deposits, with balances increasing (\d+\.\d+)% yoy to vnd (\d+\.\d+) trillion',texts[key][4])
 assert deposit and casa
 values.append((deposit.group(1),casa.group(3),casa.group(1)))
assert values[0]==values[1]
identity=next(i for i in json.load(open('docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json'))['identities'] if i['ticker']=='TCB')
period={'start':'2026-06-30','end':'2026-06-30','type':'INSTANT','fiscalYear':2026,'fiscalQuarter':None,'calendarReference':'SOURCE_EXPLICIT_ISSUER_AS_OF_DATE'}
proofs=[{'page':n,'file':str(B/'ocr'/f'{d["bodyHash"]}-p{n}.json'),'fileSha256':hashlib.sha256((B/'ocr'/f'{d["bodyHash"]}-p{n}.json').read_bytes()).hexdigest(),'streamHashes':[hashlib.sha256(json.dumps(pages[n][k],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']]} for n in pages]
record={'status':'REVIEW_CANDIDATE','approvalReference':None,'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'ticker':'TCB','bodyHash':d['bodyHash'],'period':period,'canonicalDefinition':'BANK_CURRENT_AND_SAVINGS_DEPOSITS under reported bank CASA definition; BANK_CUSTOMER_DEPOSITS excludes interbank and must match that definition','reportedDefinition':'CASA balance and ratio include Auto-earning in the Savings Account component; all numbers consolidated unless noted. CASA/customer deposits have no bank-only footnote.','reportedRounding':'Source reports both money operands to 0.1 trillion VND. Preserve that precision; calculated ratio need not equal issuer rounded 38.3%.','scope':'CONSOLIDATED','rationale':'Use the numerator and denominator reported together on page 4 under the same issuer CASA definition stated on pages 11–12. Keep accounting statement deposits as separate source occurrences. Do not mix deposits from a different definition/source or present this rounded disclosure as an exact accounting-statement total.','sourceProofs':proofs,'sourceValues':{'customerDeposits':values[0][0],'casaBalance':values[0][1],'reportedCasaPercent':values[0][2]}}
(B/'tcb-casa-definition-evidence.json').write_text(json.dumps(record,indent=2,ensure_ascii=False)+'\n')
qualification={**d,'status':'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE','documentType':'FINANCIAL_DISCLOSURE','securityId':identity['securityId'],'scope':'CONSOLIDATED','period':period,'accountingBasis':'UNKNOWN','auditStatus':'UNKNOWN','evidencePages':[1,4,11,12],'contentEvidencePages':{'ISSUER_IDENTITY':[1],'DOCUMENT_TYPE':[1,4],'REPORTING_PERIOD':[1,12],'REPORTING_SCOPE':[12]}}
cells=[]
for item,value,caption in [('BANK_CURRENT_AND_SAVINGS_DEPOSITS',values[0][1],'CASA (including Auto-earning) accounted for '+values[0][2]+'% of total customer deposits, with balances increasing '+re.search(r'balances increasing (\d+\.\d+)%',texts['passA'][4]).group(1)+'% YoY to VND '+values[0][1]+' trillion'),('BANK_CUSTOMER_DEPOSITS',values[0][0],'Customer deposits stood at VND '+values[0][0]+' trillion')]:
 cells.append({'ticker':'TCB','securityId':identity['securityId'],'documentId':d['documentId'],'bodyHash':d['bodyHash'],'page':4,'itemId':item,'sourceCaption':caption,'captionAlternative':'EXPLICIT_ISSUER_CASA_NARRATIVE_AND_FOOTNOTE','lexicalValue':value,'verificationLexicalValue':value,'verifiedCanonicalInteger':value,'unit':'TRILLION_CURRENCY','currency':'VND','scope':'CONSOLIDATED','period':period,'periodType':'INSTANT','extractionMethod':pages[4]['engineA'],'verificationMethod':pages[4]['engineB'],'renderSha256':pages[4]['renderSha256'],'sourcePageEvidenceHashes':next(p['streamHashes'] for p in proofs if p['page']==4),'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'definitionEvidenceReference':'tcb-casa-definition-evidence.json'})
for item,label,headerLabel,basis in [('BANK_REPORTED_NIM','nim(ltm)6','6M26','NIM LTM based on daily interest earning assets in the reporting period; trailing twelve-month reported ratio as at 30 June 2026. Not NIM LTM EOP.'),('BANK_REPORTED_CAR','baseliicar','2Q26','Reported Basel II total capital ratio; consolidated per the disclosure note. Not tier-one ratio or CET1.')]:
 verified=[]
 for key in ['passA','passB']:
  groups=R['lines'](pages[12][key]);matches=[g for g in groups if R['compact'](' '.join(w['text'] for w in g['words'] if w['x']<.28))==R['compact'](label)]
  assert len(matches)==1;g=matches[0];headers=[h for h in groups if h['cy']<g['cy'] and any(w['text']==headerLabel for w in h['words'])];header=max(headers,key=lambda h:h['cy']);column=[w for w in header['words'] if w['text']==headerLabel];assert len(column)==1
  x=column[0]['x']+column[0]['width']/2;nums=[w for w in g['words'] if re.fullmatch(r'\d+\.\d+%',w['text']) and abs(w['x']+w['width']/2-x)<.055];assert len(nums)==1 and nums[0]['confidence']>=.8;verified.append((g,nums[0]))
 assert verified[0][1]['text']==verified[1][1]['text']
 g,n=verified[0];cells.append({'ticker':'TCB','securityId':identity['securityId'],'documentId':d['documentId'],'bodyHash':d['bodyHash'],'page':12,'itemId':item,'sourceCaption':g['text'],'captionAlternative':label,'lexicalValue':n['text'],'verificationLexicalValue':verified[1][1]['text'],'verifiedCanonicalInteger':n['text'].strip('%'),'unit':'PERCENT','currency':None,'scope':'CONSOLIDATED','period':period,'periodType':'INSTANT','columnX':n['x'],'rowY':g['cy'],'extractionMethod':pages[12]['engineA'],'verificationMethod':pages[12]['engineB'],'renderSha256':pages[12]['renderSha256'],'sourcePageEvidenceHashes':next(p['streamHashes'] for p in proofs if p['page']==12),'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'definitionEvidenceReference':'tcb-casa-definition-evidence.json','reportedMetricBasis':basis})
 ratios[item]={'lexicalValue':n['text'],'column':headerLabel,'periodBasis':basis,'page':12}
record['reportedRatioEvidence']=ratios
(B/'tcb-casa-definition-evidence.json').write_text(json.dumps(record,indent=2,ensure_ascii=False)+'\n')
for name,rows in [('tcb-disclosure-qualifications.json',[qualification]),('tcb-disclosure-cells.json',cells)]: (B/name).write_text(json.dumps(rows,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'qualifiedDisclosures':1,'verifiedCasaOperands':2,'verifiedReportedRatios':len(ratios),'values':values[0]}))
