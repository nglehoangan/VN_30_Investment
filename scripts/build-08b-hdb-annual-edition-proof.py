"""Identify the exact retained FY2024 issuer auditor edition of a provider copy."""
import datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work');R=runpy.run_path('scripts/reconcile-08b-extraction.py')
ISSUER='1b746daebd012956adb009d20321ce0383c14c3c11fdd4a24b9a38e7e9767cff';PROVIDER='4ab3fd0fe12612fea3893a798db9b589783f9c6761a4dcac3d9212cf02801cfd'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();sources=[]
def source(p):
 row={'file':str(p),'sha256':sha(p)}
 if row not in sources:sources.append(row)
 return row
def page(body,n):
 p=B/('hdb-issuer-support/ocr' if body==ISSUER else 'ocr')/f'{body}-p{n}.json';v=json.loads(p.read_text());source(p);source(p.with_suffix('.png'));assert sha(p.with_suffix('.png'))==v['renderSha256'] and v['bodyHash']==body and v['page']==n and v['engineA']!=v['engineB'];return v
exception=B/'hdb-annual-four-large-binary-exception.json';e=json.loads(exception.read_text());source(exception);source(pathlib.Path(e['completeBinaryFile']));assert e['bodyHash']==ISSUER and sha(pathlib.Path(e['completeBinaryFile']))==ISSUER and e['rawDocumentAdmitted'] is False
source(B/(PROVIDER+'.pdf'));assert sha(B/(PROVIDER+'.pdf'))==PROVIDER
markers=['HCM16978','0849-2023-006-1','4166-2022-006-1','31 tháng 12 năm 2024','31 tháng 3 năm 2025','PwC','hợp nhất','Chuẩn mực Kế toán Việt Nam']
for body in [ISSUER,PROVIDER]:
 p=page(body,6)
 for key in ['passA','passB']:
  text=R['compact'](R['full_text'](p,key));assert all(R['compact'](m) in text for m in markers)
 p=page(body,5)
 for key in ['passA','passB']:
  text=R['compact'](R['full_text'](p,key));assert all(R['compact'](m) in text for m in ['NGÂN HÀNG THƯƠNG MẠI','PHÁT TRIỂN','THÀNH PHỐ HỒ CHÍ MINH','báo cáo tài chính hợp nhất','31 tháng 12 năm 2024'])
checkpoints=[]
for item in ['BANK_NET_INTEREST_INCOME','BANK_OPERATING_EXPENSES','NET_INCOME_ATTRIBUTABLE_COMMON','CFO','CFI_SUPPORTING','CFF_SUPPORTING','NET_CASH_CHANGE_SUPPORTING']:
 n,lex,*_=runpy.run_path('scripts/reconcile-08b-hdb-annual-primary-image.py')['ROWS'][item];p=page(ISSUER,n);proofs=[]
 for key in ['passA','passB']:
  words=[w for w in p[key] if .69<w['x']<.81 and R['numeric_value'](w['text'])==R['numeric_value'](lex) and w['confidence']>=.8];assert len(words)==1,(item,key);proofs.append({'method':p['engineA'] if key=='passA' else p['engineB'],'lexicalValue':words[0]['text'],'confidence':words[0]['confidence']})
 checkpoints.append({'itemId':item,'issuerPage':n,'providerPage':n,'value':R['numeric_value'](lex),'issuerReaders':proofs})
proof={'status':'EXACT_AUDITOR_EDITION_CORRESPONDENCE_REVIEW_CANDIDATE','ticker':'HDB','periodStart':'2024-01-01','periodEnd':'2024-12-31','scope':'CONSOLIDATED','auditReportNumber':'HCM16978','issuerBodyHash':ISSUER,'providerBodyHash':PROVIDER,'issuerAttachmentUrl':e['url'],'sourceProofs':sources,'exactAuditMarkersInBothDocumentsAndReaders':markers,'currentColumnCheckpoints':checkpoints,'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'oversizedIssuerDocumentAdmitted':False,'historicalPublicationTimestampAsserted':False,'limitations':['Edition identity establishes only the exact auditor report advertised in issuer inventory; it is not generic source ranking or economic-fact conflict resolution. Provider copy has its own retained raw response. No original issuer retrieval timestamp is inferred from the exception. Every admitted provider cell still requires its own page proof.']}
(B/'hdb-annual-2024-edition-correspondence.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':proof['status'],'checkpoints':len(checkpoints),'auditReportNumber':proof['auditReportNumber']}))
