from pathlib import Path
import json,hashlib,re,sqlite3,datetime,subprocess
from decimal import Decimal
P=Path(__file__).resolve().parent; R=Path.cwd(); OLD=R/'docs/fundamental-data-engine/evidence/2026-10-21-runtime-authority-source-closure'
assert not (P/'ARTIFACT_HASHES.json').exists()
def load(p):return json.loads(Path(p).read_text())
def save(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(b):return hashlib.sha256(b).hexdigest()
def canon(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
def pin(p):return {'path':str(p),'sha256':sha(Path(p).read_bytes())}
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
seal=load(OLD/'ARTIFACT_HASHES.json')
for f,h in seal['files'].items():assert sha(Path(f).read_bytes())==h,f
base=load(P/'BASELINE_IDENTITY.json');base.update(reviewedAt=now,priorSealFilesVerified=len(seal['files']),approvedDocumentPins=[pin(p) for p in ['docs/01 SYSTEM/INVESTMENT_POLICY.md','docs/01 SYSTEM/SCORING_MODEL_v1.0.md','docs/03 SCORING/METRIC_DEFINITIONS.md','docs/03 SCORING/SECTOR_NORMALIZATION.md','docs/06_DASHBOARD/6.4 Scoring & Ranking/METHODOLOGY_CLARIFICATION.md']]);save('BASELINE_IDENTITY.json',base)
registry=load('src/infrastructure/fundamentals/canonical-items-v1.json');cross=load(OLD/'authority/derivation-crosswalk.json');sectors=load(OLD/'SECTOR_COVERAGE_REPORT.json')
metricpath='docs/03 SCORING/METRIC_DEFINITIONS.md'; text=Path(metricpath).read_text(); lines=text.splitlines();sections=[]
heads=[i for i,l in enumerate(lines) if l.startswith('### ')]
for n,i in enumerate(heads):
 end=heads[n+1] if n+1<len(heads) else len(lines); body='\n'.join(lines[i:end]); title=lines[i][4:]
 if not re.match(r'(BQ-|FH-|GQ-|IC-|VAL-|RG-|CA-|Bank substitute|Property substitute)',title):continue
 sections.append({'concept':title,'metricId':title.split(' — ')[0],'authoritativeDefinition':{'path':metricpath,'line':i+1,'verbatimSection':body},'sectorApplicability':'See explicit applicability and sector overlay; not universal','sourceMapping':'UNRESOLVED_PER_ISSUER_UNLESS_EXACT_CANONICAL_MAPPING_QUALIFIED','reportingScope':'Exact required issuer scope; no implicit bridge','periodSemantics':'As defined in source section; annual/TTM/YTD/stock remain distinct','unit':'As defined; ratios dimensionless, currency/per-share require native unit proof','normalizationRequirements':'Explicit normalization/action/cycle review per source section; no automatic HUMAN normalization','derivationDependencies':'See executable operand matrix and approved section','implementationCoverage':'DEFINITION_EXISTS; formal source/topic/operand completeness unproven','missingSpecification':'Exact sector route/model/source selection and normalized input evidence','gapClass':['IMPLEMENTATION_GAP','MISSING_SOURCE_MAPPING']})
src=Path('src/domain/scoring/metrics.ts').read_text(); fragment=src.split('export const METRICS = {')[1].split('} as const')[0];metrics=re.findall(r'(\w+): \["([^"]+)", "([^"]+)"\]',fragment)
operands=[]
for metric,a,b in metrics:
 mappings=[r for r in cross['routes'] if r['metric']==metric]
 for position,concept in enumerate([a,b]):
  matches=[{'itemId':it['itemId'],'mapping':m} for it in registry['items'] for m in it.get('operandMappings',[]) if m['metricId']==metric and m['position']==position]
  operands.append({'requiredFinancialConcept':concept,'metricId':metric,'position':position,'authoritativeDefinition':pin('src/domain/scoring/metrics.ts'),'sectorApplicability':sorted(set(r['sector'] for r in mappings)),'sourceMapping':matches,'reportingScope':'Same ticker and exact approved scope; no consolidated/standalone mixing','periodSemantics':'Compatible economic windows; average endpoints require both boundary stocks, growth requires action-adjusted endpoints and 3/5-year span','unit':'Matching currency/per-share units; result ratio except FCF and NET_DEBT currency','normalizationRequirements':'Approved normalized/action/cycle evidence when required; not raw aliases','derivationDependencies':[a,b],'currentImplementationCoverage':'NATIVE_CROSSWALK_ROUTE' if mappings else 'ARITHMETIC_ONLY_NO_FORMAL_CROSSWALK','missingSpecification':[] if matches else ['Canonical operand/topic definitions and exact source mapping'],'gapClass':['MISSING_SOURCE_MAPPING']+([] if mappings else ['IMPLEMENTATION_GAP'])})
save('REGISTRY_COVERAGE_MATRIX.json',{'status':'INCOMPLETE','definitionSections':sections,'executableOperands':operands,'baseItems':registry['items'],'baseItemCount':8,'separateApprovedDebtItems':load('src/infrastructure/fundamentals/debt-canonical-items-v2.json'),'approvedSourceDefinitions':load('src/infrastructure/fundamentals/casa-npl-source-contract-v1.json'),'noSilentAliases':['TOTAL_EQUITY != COMMON_EQUITY','NET_INCOME != normalized_common_profit','CASH_AND_EQUIVALENTS != unrestricted_cash','BANK_NPL_AMOUNT clarification requires approved source contract; no generic net-loan proxy'],'amendments':'REGISTRY_AMENDMENT_SPEC.json; definition-only extraction, not native approved registry'})
# Only prospective source-definition extraction; never promote source contract into runtime registry approval.
casa=load('src/infrastructure/fundamentals/casa-npl-source-contract-v1.json');am=[]
for ci,fields in [(0,[('BANK_CURRENT_AND_SAVINGS_DEPOSITS','numerator'),('BANK_CUSTOMER_DEPOSITS','denominator')]),(1,[('BANK_NONPERFORMING_LOANS','grossNPLNumerator'),('BANK_GROSS_CUSTOMER_LOANS','grossCustomerLoanDenominator')])]:
 for item,key in fields:
  am.append({'itemId':item,'definition':casa['contracts'][ci]['proposedContract'][key],'authority':{'path':'src/infrastructure/fundamentals/casa-npl-source-contract-v1.json','pointer':f'/contracts/{ci}/proposedContract/{key}'},'sector':'BANK','measurementSemantic':'STOCK','period':'Identical explicit as-of date','unit':'Matching currency with approved scale; never percentages as balances','scope':'Exact owner-approved issuer scope','issuerMappings':[],'status':'DEFINITION_SUPPORTED_SOURCE_MAPPING_MISSING','runtimeRegistryAdmission':False})
save('REGISTRY_AMENDMENT_SPEC.json',{'version':'source-defined-bank-items-review-v1','status':'PROPOSED_SPECIFICATION_ONLY','items':am,'nativeCandidateProduced':False,'reason':'Approved contract explicitly excludes registry promotion; global schema topic/operand/effectivity binding and bank-specific mappings remain unresolved','approved':False})
sectorText=Path('docs/03 SCORING/SECTOR_NORMALIZATION.md').read_text();blocks={};hm=list(re.finditer(r'^# (\d+)\. (.+)$',sectorText,re.M))
for i,h in enumerate(hm):blocks[int(h.group(1))]=sectorText[h.start():hm[i+1].start() if i+1<len(hm) else len(sectorText)]
nums={'BANK':5,'REAL_ESTATE':6,'TECHNOLOGY':7,'RETAIL':8,'INDUSTRIAL':9,'MATERIALS':10,'UTILITIES':11,'ENERGY':12,'SECURITIES':13}
for row in sectors['sectors']:
 b=blocks[nums[row['sector']]]
 if row['sector']=='SECURITIES':b=b.split('## 13.2')[0]
 row.update(approvedSectorSpecification=b,normalizationReference=pin('docs/03 SCORING/SECTOR_NORMALIZATION.md'),anyOfPreserved=True,preferencePreserved=True,modelSelectionStatus='OWNER_MUST_FREEZE_ALLOWED_ROUTE_AND_INPUTS_PER_SECTOR; no change to approved alternatives',ownerDecisionIds=['OD-01','OD-02','OD-03'])
save('SECTOR_READINESS_MATRIX.json',sectors)
review=[]
for r in cross['routes']:
 missing=[o['itemId'] for o in r['operands'] if o['itemId'] not in {x['itemId'] for x in registry['items']}]
 review.append({**r,'formulaAuthority':'src/domain/scoring/metrics.ts:METRICS + approved Metric Definitions','orderedOperandMatch':next(([a,b]==[o['role'] for o in r['operands']] for m,a,b in metrics if m==r['metric']),False),'units':'Same approved native currency/scale; ratio output except FCF','periodCompatibility':'FCF matched flow windows; ROE normalized common flow / compatible average boundary stocks; CASA/NPL identical stock date','scope':'Same issuer and required scope; no implicit bridge','knownAt':'max(operand availability, source/mapping/normalization/formula/method knowledge); all <= AS_KNOWN cutoff','missingRegistryItems':missing,'status':'BLOCKED_REGISTRY_AND_SOURCE_MAPPING' if missing else 'DEFINITION_SUPPORTED_PENDING_APPROVAL_AND_QUALIFIED_INPUTS','executableNow':False})
save('DERIVATION_CROSSWALK_REVIEW.json',{'routes':review,'reviewedRoutes':len(review),'allExecutableMetrics':[m for m,a,b in metrics],'missingFormalMetricRoutes':[m for m,a,b in metrics if not any(r['metric']==m for r in review)],'SECURITIES':'Approved through-cycle ROE applicability exists; no native crosswalk or qualified source/normalization route. Do not borrow BANK CASA/NPL or industrial FCF/debt.','finalCandidateHash':None,'reason':'Incomplete registry and source mappings; no final executable hash issued'})
# Independent raw replay, separate implementation with Decimal (not JS normalizer).
binding=load(OLD/'MARKET_BINDING_CANDIDATE.json'); cf=binding['candidateFile'];assert sha(Path(cf['path']).read_bytes())==cf['sha256'];c=load(cf['path']);assert sha(canon(c))==cf['contentHash']
for f in c['sourcePins']:assert sha(Path(f['path']).read_bytes())==f['sha256'],f['path']
folder=Path(c['input']['captureFolder']);manifest=load(folder/'manifest.json');assert len(manifest['requests'])==61
for r in manifest['requests']:assert r['httpStatus']==200 and sha((folder/r['rawPath']).read_bytes())==r['sha256']
board=json.loads((folder/'5.3.raw.json').read_text(),parse_float=Decimal); assert board['tradingDate']=='21/10/2026';boardrows={r['symbol']:Decimal(str(r['matchPrice'])) for r in board['data']};obs=c['market']['body']['observations'];assert len(obs)==len(boardrows)==30
checks=[]
for o in obs:
 r=next(r for r in manifest['requests'] if r['apiId']=='5.13' and r['ticker']==o['ticker']);raw=json.loads((folder/r['rawPath']).read_text(),parse_float=Decimal);bar=raw['data'][1]
 assert raw['ticker']==o['ticker'] and bar['tradingDate']=='2026-10-21T00:00:00.000Z';assert Decimal(o['value'])==bar['close']==boardrows[o['ticker']]
 assert bar['low']<=bar['close']<=bar['high'] and bar['volume']>=0
 assert o['pointer']=='/data/1/close' and o['unit']=='VND_PER_SHARE' and o['adjustment']=='RAW' and o['currency']=='VND'
 assert r['retrievedAt']>='2026-10-21T08:00:00.000Z' and r['retrievedAt']<=c['input']['builtAt']
 identity=json.loads((folder/('5.11-'+o['ticker']+'.raw.json')).read_text())['content'];assert len(identity)==1
 identity=identity[0];qualified=next(x for x in c['profile']['identities'] if x['ticker']==o['ticker']);assert identity['symbol']==qualified['ticker'] and identity['isinCode']==qualified['isin'] and identity['codeId']==qualified['codeId'] and identity['tradePlace']=='001' and identity['status']=='Y' and identity['halt']=='N' and qualified['securityId']==o['securityId']
 checks.append({'ticker':o['ticker'],'rawPath':str(folder/r['rawPath']),'rawSha256':r['sha256'],'pointer':o['pointer'],'close':o['value'],'boardMatch':True,'completedBar':True,'retrievedAt':r['retrievedAt']})
for k in ['market','capability','initialization']:
 assert sha(canon({k2:v for k2,v in c[k].items() if k2!='contentHash'}))==c[k]['contentHash']
assert datetime.date(2026,10,21).weekday()==2 and '2026-10-21' not in c['calendarBody']['holidays']
win=c['policy']['windows'][0]; fresh=win['from']<=now.replace('+00:00','Z')<=win['through']
db=sqlite3.connect('file:data/vn30.sqlite?mode=ro',uri=True);releases=db.execute('select id,body,body_hash from dependency_release').fetchall();assert len(releases)==1;rid,body,rhash=releases[0];release=json.loads(body);assert {'id':rid,'hash':rhash}==binding['expectedPriorRelease'];assert not any(h['type']=='MARKET' for h in release['heads'])
for h in binding['expectedPriorHeads']:assert next(x['pin'] for x in release['heads'] if x['type']==h['type'])==h['pin']
dumpHash=sha('\n'.join(db.iterdump()).encode()); db.close();save('BASELINE_LOGICAL_DB.json',{'dumpSha256':dumpHash})
save('MARKET_INDEPENDENT_REVIEW.json',{'recommendation':'ACCEPTABLE_FOR_OWNER_APPROVAL' if fresh else 'REJECTED_WITH_REASONS','reviewedAt':now,'reasons':[] if fresh else ['SESSION_WINDOW_EXPIRED_RECAPTURE_AND_REVIEW_REQUIRED'],'reviewType':'Independent Python raw-source/Decimal/hash implementation; not a signed external acceptance','candidate':cf,'sourcePinsVerified':len(c['sourcePins']),'RESTRequestsVerified':61,'observations':checks,'session':'2026-10-21 HOSE completed daily; Wednesday, not in pinned holidays','cutoff':'15:00 VN conservative session boundary, not quote-event timestamp','qualificationProfile':c['profile']['contractVersion'],'profileScope':'Current knowledge latest RAW completed EOD CLOSE matched against REST board, multiplier1; no historical adjusted/total-return qualification','freshnessAtReview':fresh,'validThrough':win['through'],'WSS':'0 frames: no streaming qualification. REST-only EOD profile does not require WSS','calendarApproval':'Technical pinned policy candidate requires Owner acceptance; source URLs are not a new approved authority','expectedPriorRelease':binding['expectedPriorRelease'],'approvalGranted':False,'acceptanceReceiptCreated':False,'CASExecuted':False,'rerunBeforeExecution':['wall-clock freshness','exact source pins','expected release/projection','independent authorized approval binding']})
binding.update(status='PROPOSED_NOT_EXECUTED',approvalGranted=False,operation={'service':'ProductionDependencies.activate','expected':binding['expectedPriorRelease'],'reason':'Owner-authorized exact TCBS 2026-10-21 EOD market/session activation (authorization not yet supplied)'},catalogRequirements={'trustedAcceptedOnly':True,'replaceHeads':['INITIALIZATION','MARKET_CAPABILITY','SESSION_POLICY'],'addHead':'MARKET','preserveOtherHeads':True,'candidateCannotBePassedAsAcceptedHead':True},rollbackRecovery={'beforeActivation':'Retain current immutable release plus accepted catalog/binding configuration; verify read-only replay','atomicity':'CAS projection from exact expected release; mismatch aborts, no force update','afterFailure':'Re-read active projection. If unchanged, leave baseline. If advanced, stop publication, inspect exact committed release and audit; never blindly retry','recovery':'Owner-authorized compensating release against then-current head restoring prior accepted bindings only when current validity permits. Old expired session is audit-only, not valid valuation authority. No SQL overwrite/deletion or time backdating','postActivation':'Replay full release, verify all preserved heads and MBB, resolve VALUATION using current clock; remain blocked if other authorities missing'},executionAuthorization='REQUIRED_SEPARATELY',expiresAt=win['through']);save('MARKET_CAS_PROPOSAL.json',binding)
# VHM current facts exact document hash, no inferred public timestamp.
vhash='f2068861297d3aa4efb4be9542855b5ba58bf82e9c78a0176e4c52f71639cc62';db=sqlite3.connect('file:data/vn30.sqlite?mode=ro',uri=True);facts=[]
for rid,body in db.execute('select id,body from fundamental_admission_run'):
 for i,f in enumerate(json.loads(body)['canonicalFacts']):
  if f.get('sourceHash')==vhash:facts.append({'runId':rid,'pointer':f'/canonicalFacts/{i}','fact':f})
db.close();assert len(facts)==16
pdfs=[pin(p) for p in Path('data/manual-download').rglob('*.pdf') if sha(p.read_bytes())==vhash]
source=P/'sources';source.mkdir(exist_ok=True)
if Path('/private/tmp/vhm-disclosure.html').exists():(source/'vinhomes-403.html').write_bytes(Path('/private/tmp/vhm-disclosure.html').read_bytes())
save('PUBLICATION_EVIDENCE_REVIEW.json',{'reviewedAt':now,'issuer':'VHM','documentHash':vhash,'retainedMatchingPDFs':pdfs,'applicableFacts':facts,'leadDate':'2026-03-23','precision':'DATE_ONLY','publishedAt':None,'officialSearchCorroboration':{'url':'https://vinhomes.vn/vi/taxonomy/term/820','title':'Báo cáo Hợp nhất đã kiểm toán năm 2025','displayDate':'23/03/2026','status':'SEARCH_INDEX_ONLY_NOT_ORIGINAL_CAPTURE'},'accessAttempts':[{'url':u,'method':m,'result':'HTTP_403'} for u,m in [('https://vinhomes.vn/vi/taxonomy/term/820','web open'),('https://vinhomes.vn/vi/bao-cao-tai-chinh','web open'),('https://vinhomes.vn/vi/taxonomy/term/820','curl direct authorized network')]],'originalDisclosureVerified':False,'issuerPDFLinkAndByteIdentityVerified':False,'sourceAuthority':'Issuer domain identified; exact original page-to-PDF binding unverified','status':'PROVABLE_WITH_ADDITIONAL_SOURCE','productionProvenFacts':0,'otherUnprovenFacts':1738,'knownAtTreatment':'No intraday timestamp manufactured; existing timestamp-only candidate does not admit DATE_ONLY. Owner must approve defensible conservative policy before such conversion; acquisition/verification/mapping knowledge must still be <= pinned current cutoff','historicalAdmissionGranted':False})
candidates=load(OLD/'AUTHORITY_CANDIDATES_FINAL.json')
for a in candidates['candidates']:
 payload=load(a['payloadPath']); assert sha(canon(payload))==a['contentHash'];a.update(reviewPayloadHash=a['contentHash'],payloadChanged=False,finalExecutableCandidateHash=None,finalHashWithheldReason='Material specifications unresolved; existing hash identifies reviewed unchanged proposal only',activationEligible=False,ownerDecisionIds=['OD-01','OD-02','OD-03','OD-04','OD-05','OD-06','OD-07'])
save('AUTHORITY_CANDIDATE_REVIEW.json',candidates)
print(json.dumps({'registrySections':len(sections),'operandRows':len(operands),'routesReviewed':len(review),'marketFresh':fresh,'VHMLeads':len(facts),'sealedPriorFiles':len(seal['files'])}))
