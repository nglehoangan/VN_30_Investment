"""Package validation, frozen baseline integrity and separate financial challenge receipts."""
import os,sys,json,subprocess,platform,datetime
from pathlib import Path
from decimal import Decimal
from qualify import ROOT,OUT,P26,OWNER,BASE,RESEARCH,sha,digest,ptr
D=Decimal
def load(p):return json.loads(Path(p).read_text())
def write(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def verify():
 m=load(OUT/'manifest.json');assert digest({k:v for k,v in m.items() if k!='contentHash'})==m['contentHash']
 for p,h in m['files'].items():assert sha(OUT/p)==h,('PACKAGE_DRIFT',p)
 for p,h in load(OUT/'protected-before.json').items():assert sha(ROOT/p)==h,('BASELINE_DRIFT',p)
 for p,h in load(OUT/'input-pins.json').items():assert sha(ROOT/p)==h,('INPUT_DRIFT',p)
 print(json.dumps(dict(status='PASS',readOnly=True,manifestContentHash=m['contentHash'])))
def run():
 records=[];checks=[];env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'};rel=str(OUT.relative_to(ROOT))
 def command(args):
  started=now();r=subprocess.run(args,cwd=ROOT,env=env,capture_output=True,text=True);records.append(dict(command=args,startedAt=started,finishedAt=now(),exitCode=r.returncode,stdout=r.stdout,stderr=r.stderr));write('validation-receipts.json',dict(python=platform.python_version(),records=records));print(json.dumps(dict(command=args[-1],exitCode=r.returncode,stdout=r.stdout[-600:],stderr=r.stderr[-400:])),flush=True)
  if r.returncode:raise RuntimeError('FAILED_VALIDATION_COMMAND')
  return r.stdout
 def check(name,condition):
  if not condition:raise AssertionError(name)
  checks.append(dict(check=name,status='PASS'))
 command([sys.executable,rel+'/qualify.py'])
 command([sys.executable,rel+'/financial_challenge.py'])
 command([sys.executable,OWNER+'/validate.py','--verify'])
 head=command(['git','rev-parse','HEAD']).strip();check('Execution HEAD equals approved owner baseline',head==BASE)
 command(['git','merge-base','--is-ancestor',RESEARCH,'HEAD'])
 auth=load(OUT/'owner-authorization.json');a=load(OUT/'assumption-register.json');ev=load(OUT/'evidence-register.json');facts=ev['facts'];price=load(OUT/'price-action-register.json');summary=load(OUT/'qualification-summary.json');challenge=load(OUT/'financial-challenge.json')
 expected=['2025-12-31T23:59:59+07:00','RETROSPECTIVE_FY2025_AUDITED_RESEARCH','RETAINED_TCBS_EXACT_DATE_ONLY_IF_UNIT_AND_ADJUSTMENT_QUALIFIED','FY2025_CLOSING_ORDINARY_SHARES_FOR_PER_SHARE_VALUE','NULL_AND_BLOCK_DEPENDENT_OUTPUT','RESEARCH_PROVISIONAL_DRAFT_ONLY']
 check('All D1-D6 exactly persisted APPROVED',len(auth['decisions'])==6 and [d['approvedChoice'] for d in auth['decisions']]==expected and all(d['status']=='APPROVED' and d['issuer']=='TCB' and d['ownerApprovalAt'] is None and d['approvalSource'] for d in auth['decisions']))
 check('Owner approval time not invented',auth['ownerApprovalAt'] is None)
 check('No economic assumption auto-approved',not auth['numericalEconomicAssumptionsApproved'] and a['numericalEconomicAssumptionsApproved']==0)
 check('All27cells explicitly proposed/pending',sum(len(s['cells']) for s in a['scenarios'])==27 and all(c['analystStatus']=='PROPOSED' and c['ownerStatus']=='PENDING' for s in a['scenarios'] for c in s['cells']))
 check('Exact supported/blocked counts',sum(c['axis']=='creditCost' and c['value'] is not None for s in a['scenarios'] for c in s['cells'])==3 and sum(c['axis']=='issuanceDilution' and c['value'] is not None for s in a['scenarios'] for c in s['cells'])==3 and sum(c['value'] is None for s in a['scenarios'] for c in s['cells'])==21)
 check('No numerical values on other7unsupported axes',all(c['value'] is None for s in a['scenarios'] for c in s['cells'] if c['axis'] not in ['creditCost','issuanceDilution']))
 check('All assumptions have rationale/formula/confidence/sensitivity/downside',all(all(c[k] for k in ['rationale','formula','confidence','sensitivity','downsideImplication']) for s in a['scenarios'] for c in s['cells']))
 check('Supported credit estimates resolve evidence IDs',all(c['evidenceIds'] and all(i in facts for i in c['evidenceIds']) for s in a['scenarios'] for c in s['cells'] if c['value'] is not None))
 check('Every derived operand exists',all(all(i in facts for i in x.get('operandIds',[])) for x in facts.values()))
 check('Reported native amounts/units preserved',all(x['value'] is None or D(x['value'])==D(x['nativeValue'])*D(x['multiplier']) for x in facts.values() if x.get('factNature')=='REPORTED_READING'))
 check('Reported20percent native unit is explicit',facts['REPORTED_BANK_TAX_RATE_2025']['nativeValue']=='20' and facts['REPORTED_BANK_TAX_RATE_2025']['nativeUnit']=='PERCENT' and facts['REPORTED_BANK_TAX_RATE_2025']['value']=='0.20')
 check('Zero and dash distinct',all(x['value'] is None for k,x in facts.items() if k.endswith('_DASH')) and all(c['value']=={'newShares':'0','netNewCommonCash':'0'} for s in a['scenarios'] for c in s['cells'] if c['axis']=='issuanceDilution'))
 bindings=[]
 def collect(x):
  if isinstance(x,dict):
   if {'path','sha256','jsonPointer','objectHash'}<=set(x):bindings.append(x)
   for v in x.values():collect(v)
  elif isinstance(x,list):
   for v in x:collect(v)
 collect(ev);collect(auth);collect(price);collect(load(OUT/'normalized-earnings-register.json'))
 cache={}
 for b in bindings:
  path=ROOT/b['path']
  if b['path'] not in cache:cache[b['path']]=load(path)
  assert sha(path)==b['sha256'] and digest(ptr(cache[b['path']],b['jsonPointer']))==b['objectHash'],b
 check('All exact source/ledger object pointers verified',len(bindings)>50)
 check('Every selected PDF source/page hash retained',all(sha(ROOT/x['source']['path'])==x['source']['sha256'] and x['source']['physicalPage']>0 for x in facts.values() if 'source' in x))
 check('Separate financial challenge executed on final prepared inputs',len(challenge['findings'])==14 and all(x['status']=='PASS' for x in challenge['findings']) and all(sha(OUT/p)==h for p,h in challenge['preparedInputHashes'].items()))
 check('No TCE or normalized earnings promotion',load(OUT/'common-equity-bridge.json')['TCE'] is None and load(OUT/'normalized-earnings-register.json')['normalizedCommonEarnings'] is None)
 check('Price eligibility conditional and selectedPrice null',price['ownerD3ChoiceApproved'] and price['selectedPrice'] is None and not price['corporateActionBridgeQualified'] and price['rawCandidate']['nativeUnit'] is None)
 check('No ke numerical calibration or source authority expansion',all(v is None for v in load(OUT/'cost-of-equity-framework.json')['inputs'].values()) and not load(OUT/'cost-of-equity-framework.json')['automaticAcquisition'])
 check('No formal or valuation output generated',all(summary[k] is None for k in ['formalM3Points','formalM3Total','ranking','M4Decision','draftValuation','approvedValuation','selectedPrice']))
 check('TCB only and execution not authorized',ev['ticker']=='TCB' and all(x['ticker']=='TCB' for x in facts.values()) and summary['gates']['DRAFT_VALUATION_EXECUTION']=='NOT_AUTHORIZED_IN_THIS_STEP' and summary['gates']['FORMAL_M3_M4_PRODUCTION']=='NOT_AUTHORIZED' and not summary['otherIssuerProcessing'] and not summary['newRemediationRound'])
 pins=load(OUT/'input-pins.json');check('All new input byte pins unchanged',all(sha(ROOT/p)==h for p,h in pins.items()))
 sealed=[]
 for folder in [P26,OWNER]:
  m=load(ROOT/folder/'manifest.json');check(folder+' canonical manifest intact',digest({k:v for k,v in m.items() if k!='contentHash'})==m['contentHash']);check(folder+' sealed output bytes unchanged',all(sha(ROOT/folder/p)==h for p,h in m['files'].items()));sealed.append(dict(path=folder,files=len(m['files']),contentHash=m['contentHash']))
 before=load(OUT/'protected-before.json');changed=[p for p,h in before.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h]
 check('All baseline records/code/data preserved',not changed)
 data={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()};check('Data file inventory unchanged',data=={p for p in before if p.startswith('data/')})
 status=command(['git','status','--porcelain']);check('Only authorized new package added',all(line[3:].startswith(rel+'/') for line in status.splitlines()))
 integrity=dict(status='PASS',executionHead=head,approvedResearchBaseline=RESEARCH,approvedOwnerBaseline=BASE,protectedFiles=len(before),protectedPinSetHash=digest(before),databaseHashes={p:h for p,h in before.items() if p.startswith('data/vn30.sqlite')},dataFileCount=len(data),dataInventoryUnchanged=True,sealedPackages=sealed,financialRecordsChanged=False,methodologyAuthorityCodeChanged=False,sourceDiscovery=False,productionDatabasePortfolioMutation=False)
 write('baseline-integrity.json',integrity)
 results=dict(status='PASS',technicalChecks=len(checks),checks=checks,financialChallengeChecks=14,financialChallengeStatus=challenge['status'],sourcePointerBindings=len(bindings),protectedFiles=len(before),scenarioValuationExecuted=False,formalEngineExecuted=False,productionAdmissionTestExecuted=False,wholeRepositoryTestsExecuted=False,scope='Retained-source research qualification technical and financial challenge only; no full-release or formal acceptance claim',gates=summary['gates'])
 write('validation-results.json',results)
 (OUT/'VALIDATION.md').write_text(f'''# TCB assumption qualification validation

Technical **{len(checks)}/{len(checks)}PASS**; separate financial challenge **14checks PASS with explicit limitations**. Scenario valuation execution is NOT_AUTHORIZED_IN_THIS_STEP and was not performed. The separate passes are by the same agent, not independent human acceptance.

{len(before)} protected files and the exact {len(data)}-file data inventory remain byte-identical, including database/sidecars, financial records, policy/weights, masters, code and portfolio data. Both predecessor manifests, their sealed files and source pins pass; the owner-decision package verifies read-only on the current approved HEAD. No historical receipt is rewritten.

D1–D6APPROVED exactly; no approval timestamp invented.3credit sensitivity cells+3explicit issuance-restriction cells proposed/PENDING,21economic cells null. All{len(bindings)} exact source/ledger pointers and hashes resolve. Historical units, source period/current/comparative distinction and dash/null versus explicit scenario zero are preserved.

Common accounting book is qualified for the specified ordinary parent non-tangible scope. TCE, sustainable earnings/ROE, ke and selected price stay null. Complete scenarios=0. Full tail stress, regulatory feasibility and independent crosscheck are not certified by arithmetic tests. No source-policy expansion or external acquisition, no other issuer, no formal scoring/ranking/M4/model execution, no production/database/portfolio mutation.

Exact UTC command receipts: `validation-receipts.json`. Separate finance findings: `financial-challenge.json` and `FINANCIAL_CHALLENGE.md`. Whole-repository release tests/build/browser and live production-admission tests were not run; no application behavior changed. Baseline byte preservation and null/false research outputs evidence the protected boundary, not a new runtime acceptance claim.

**STOP. Owner review only; no scenario execution.**
''')
 final=OUT/'TCB_ASSUMPTION_QUALIFICATION_FINAL_REVIEW.md';final.write_text(final.read_text()+f'\nValidation: **{len(checks)}/{len(checks)} technical checks PASS;14financial challenge checks PASS with limitations;{len(before)} protected files unchanged**. See [validation](VALIDATION.md) and machine receipts. Changes are uncommitted.\n')
 m=dict(schema='tcb-assumption-qualification-package-v1',approvedBaseline=BASE,canonicalHashSemantics='SHA256 canonical sorted UTF8 JSON excluding contentHash',files={str(p.relative_to(OUT)):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ['manifest.json','read-only-verification.json'] and '__pycache__' not in p.parts})
 m['contentHash']=digest(m);write('manifest.json',m);print(json.dumps(dict(status='PASS',technicalChecks=len(checks),financialChallenge=14,protectedFiles=len(before),manifestContentHash=m['contentHash'])),flush=True)
if __name__=='__main__':verify() if '--verify' in sys.argv else run()
