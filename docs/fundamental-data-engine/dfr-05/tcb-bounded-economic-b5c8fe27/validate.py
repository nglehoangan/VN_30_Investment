"""Offline technical validation and preserved-baseline receipts; never acquires sources."""
import os,sys,json,subprocess,platform,datetime,ast
from pathlib import Path
from decimal import Decimal,localcontext
from calibrate import ROOT,OUT,BASE,PRIOR,OWNER,P26,sha,digest,pointer
D=Decimal
def load(p):return json.loads(Path(p).read_text())
def write(name,x):(OUT/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def verify():
 m=load(OUT/'manifest.json');assert digest({k:v for k,v in m.items() if k!='contentHash'})==m['contentHash']
 for p,h in m['files'].items():assert sha(OUT/p)==h,('PACKAGE_DRIFT',p)
 for p,h in load(OUT/'protected-before.json').items():assert sha(ROOT/p)==h,('BASELINE_DRIFT',p)
 for p,h in load(OUT/'input-pins.json').items():assert sha(ROOT/p)==h,('INPUT_DRIFT',p)
 data={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()};assert data=={p for p in load(OUT/'protected-before.json') if p.startswith('data/')}
 print(json.dumps(dict(status='PASS',readOnly=True,manifestContentHash=m['contentHash'])))
def run():
 rel=str(OUT.relative_to(ROOT));records=[];checks=[];env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'}
 def command(argv):
  start=now();r=subprocess.run(argv,cwd=ROOT,capture_output=True,text=True,env=env);records.append(dict(command=argv,startedAt=start,finishedAt=now(),exitCode=r.returncode,stdout=r.stdout,stderr=r.stderr));write('validation-receipts.json',dict(python=platform.python_version(),records=records));print(json.dumps(dict(command=argv[-1],exitCode=r.returncode,stdout=r.stdout[-600:],stderr=r.stderr[-300:])),flush=True)
  if r.returncode:raise RuntimeError('FAILED_COMMAND:'+repr(argv))
  return r.stdout
 def check(name,test):
  if not test:raise AssertionError(name)
  checks.append(dict(name=name,status='PASS'))
 command([sys.executable,rel+'/calibrate.py']);command([sys.executable,rel+'/financial_challenge.py']);command([sys.executable,PRIOR+'/validate.py','--verify'])
 head=command(['git','rev-parse','HEAD']).strip();check('Exact approved current baseline',head==BASE)
 for ancestor in ['969e36ab241a61f31d89d4371e83ece977db3458','4a2052611cc37002ad0ba7d15a15b8a8c03a3ebf']:command(['git','merge-base','--is-ancestor',ancestor,'HEAD'])
 auth=load(OUT/'owner-decision-register.json');a=load(OUT/'assumption-register.json');ev=load(OUT/'evidence-register.json');f=ev['financials'];summary=load(OUT/'summary.json');sources=load(OUT/'source-qualification.json');acq=load(OUT/'source-acquisition.json');challenge=load(OUT/'financial-challenge.json');est=load(OUT/'credit-sensitivity-estimates.json')['items']
 choices=['2025-12-31T23:59:59+07:00','RETROSPECTIVE_FY2025_AUDITED_RESEARCH','RETAINED_TCBS_EXACT_DATE_ONLY_IF_UNIT_AND_ADJUSTMENT_QUALIFIED','FY2025_CLOSING_ORDINARY_SHARES_FOR_PER_SHARE_VALUE','NULL_AND_BLOCK_DEPENDENT_OUTPUT','RESEARCH_PROVISIONAL_DRAFT_ONLY']
 check('D1-D6 persisted APPROVED exact choices',[d['approvedChoice'] for d in auth['decisions']]==choices and all(d['status']=='APPROVED' for d in auth['decisions']))
 check('No owner approval timestamp invented',auth['ownerApprovalAt'] is None and all(d['ownerApprovalAt'] is None for d in auth['decisions']))
 check('Owner attachment exact hash',sha(OUT/auth['approvalEvidence']['path'])==auth['approvalEvidence']['sha256'])
 check('Three exact anchors approved only conditionally',[x['value'] for x in auth['conditionalAssumptions'][:3]]==['0.009217628484','0.007947018458','0.006732050583'] and all(x['status']=='APPROVED_CONDITIONAL_ASSUMPTION' and 'Historical sensitivity only' in x['conditions'] for x in auth['conditionalAssumptions'][:3]))
 check('No-issuance approval conditional not fact',all(x['value']==dict(newShares='0',netNewCommonCash='0') and 'Capital feasibility must be demonstrated before scenario qualification' in x['conditions'] for x in auth['conditionalAssumptions'][3:]))
 check('All three source scopes approved without numerical ke',len(auth['sourceAuthority'])==3 and all(x['status']=='APPROVED_SCOPE' for x in auth['sourceAuthority']) and not auth['numericalKeApproved'])
 cells=[c for s in a['scenarios'] for c in s['cells']]
 check('Six conditional cells approved21other cells null',len(cells)==27 and sum(c['ownerStatus']=='APPROVED_CONDITIONAL_ASSUMPTION' for c in cells)==6 and sum(c['value'] is None and c['ownerStatus']=='PENDING_NUMERICAL_APPROVAL' for c in cells)==21)
 check('No newly inserted full economic defaults',all(c['value'] is None for c in cells if c['axis'] not in ['creditCost','issuanceDilution']) and a['costOfEquity'] is None)
 check('Exactly bounded3source objects2selected publishers',acq['cycleCount']==1 and acq['providerCount']==2 and len(acq['records'])==3 and acq['ERPInputTables']==1 and acq['ERPMethodDocuments']==1 and acq['otherIssuerSources']==0)
 check('No redirect or alternate-provider fallback',all(not r['redirectsFollowed'] for r in acq['records']) and sources['searchClosed'] and not sources['alternativeProvidersUsed'])
 captured=[r for r in acq['records'] if r['outcome']=='CAPTURED_NOT_YET_QUALIFIED']
 check('Complete captured body URL/hash/time preserved',len(captured)==1 and all(r['url'].startswith('https://pages.stern.nyu.edu/') and r['httpStatus']=='200' and r['curlExitCode']==0 and r['retrievedAt'] and sha(OUT/r['path'])==r['sha256'] for r in captured))
 check('HNXfailed yield is unknown not zero',sources['KE_S1']['status']=='BLOCKED' and sources['KE_S1']['selectedRiskFree'] is None and sources['KE_S1']['sourceAttempt']['curlExitCode']==60 and sources['KE_S1']['sourceAttempt']['sha256'] is None)
 tomb=load(OUT/'source-fragment-removal.json');method=sources['KE_S2']['methodDocument'];check('Partial PDFnot treated as original document',method['curlExitCode']==28 and method['partialBytesNotOriginalPdfHash'] and tomb['originalPdfSha256'] is None and tomb['partialSha256']==method['partialContentHash'] and tomb['removedBytes']>0 and not (OUT/tomb['path']).exists())
 table=sources['KE_S2']['inputTable'];check('Native source percentages preserved without VNDlabel',table['rawCells'][:5]==['Vietnam','Ba2','2.56%','3.90%','8.13%'] and table['nativeUnit']=='PERCENT_DISPLAY' and table['unit']=='RATIO_REFERENCE')
 check('Update/publication/observation/retrieval dates separated',table['lastUpdatedLabel']=='January 5, 2026' and table['publishedAt'] is None and table['observationAt'] is None and table['retrievedAt'] is not None and table['countryRowRevisionAt'] is None and table['mixedVintagePage'] and not table['selectedForFY2025'])
 check('No complete keor beta or extra country number',load(OUT/'cost-of-equity-calibration.json')['nominalVndKe'] is None and load(OUT/'cost-of-equity-calibration.json')['beta'] is None and load(OUT/'cost-of-equity-calibration.json')['bankSpecificSpread'] is None)
 check('Provider derived mature identity not extra independent risk',D(table['values']['totalEquityRiskPremium'])-D(table['values']['countryRiskPremium'])==D(table['derivedMatureERP']['value']) and table['derivedMatureERP']['notIndependentObservation'])
 check('Two new economic estimates pending1rounding reference',sum(x['classification']=='PROPOSED_ECONOMIC_ESTIMATE' and x['ownerStatus']=='PENDING_NUMERICAL_APPROVAL' for x in est)==2 and sum(x['classification']=='REFERENCE_ONLY_ROUNDING_RESIDUE' for x in est)==1)
 check('Every estimate approval pointer resolves',all(pointer(auth,x['ownerDecisionPointer'])['value']==x['rate'] and pointer(auth,x['ownerDecisionPointer'])['status']=='APPROVED_CONDITIONAL_ASSUMPTION' for x in est))
 check('Every estimate operand resolves and common tax unknown',all(all(k in f for k in x['evidenceIds']) and x['marginalTax'] is None and x['commonIncidence'] is None and x['netCommonEarningsDelta'] is None for x in est))
 for x in est:
  with localcontext() as c:c.prec=70;expected=D(x['rate'])*D(x['fixedExposure'])-D(x['actualCharge'])
  assert D(x['value'])==expected,x['id']
 check('Decimal sensitivities exactly reproduce approved anchors',True)
 check('Native billion-VNDreadings scale exactly',all(D(f[k]['value'])==D(f[k]['nativeValue'])*D(f[k]['multiplier']) and f[k]['nativeUnit']=='BILLION_VND' and f[k]['scope']=='REGULATORY_CONSOLIDATED' and f[k]['periodEnd']=='2025-06-30' for k in ['REG_CAPITAL_H1_2025','RWA_H1_2025']))
 check('All four new historical input IDs explicit',summary['newQualifiedHistoricalEconomicInputs']==4 and all(k in f for k in summary['newInputIds']))
 bindings=[]
 def collect(x):
  if isinstance(x,dict):
   if {'path','sha256','jsonPointer','objectHash'}<=set(x):bindings.append(x)
   for v in x.values():collect(v)
  elif isinstance(x,list):
   for v in x:collect(v)
 collect(ev);collect(auth);cache={}
 for b in bindings:
  if b['path'] not in cache:cache[b['path']]=load(ROOT/b['path'])
  assert sha(ROOT/b['path'])==b['sha256'] and digest(pointer(cache[b['path']],b['jsonPointer']))==b['objectHash'],b
 check('All retained exact source and ledger pointers resolve',len(bindings)>20)
 check('Every exact source PDFhash/page retained',all(sha(ROOT/x['source']['path'])==x['source']['sha256'] and x['source']['physicalPage']>0 for x in f.values() if 'source' in x))
 check('Separate finance challenge on final prepared bytes',len(challenge['findings'])==20 and all(x['status']=='PASS' for x in challenge['findings']) and all(sha(OUT/p)==h for p,h in challenge['preparedInputHashes'].items()))
 capital=load(OUT/'capital-feasibility-register.json');check('Capital feasibility explicitly blocked without targetdefault',capital['capitalFeasible'] is None and capital['caseTargetCAR'] is None and capital['historicalFloorNotForwardTarget'] and capital['Tier1NotCET1'])
 price=load(OUT/'price-action-register.json');check('Rawprice candidate unqualified no beta inference',price['selectedPrice'] is None and price['rawCandidate']['rawClose']=='22789.00' and price['rawCandidate']['nativeUnit'] is None and price['issuerSpecificBeta'] is None and not price['newProviderDocumentationAcquired'])
 check('No intrinsic valuation or formal outputs',all(summary[k] is None for k in ['formalM3Points','formalM3Total','ranking','M4Decision','intrinsicValue']) and not summary['nextStepMayRequestDraftValuationAuthorization'] and all(s['draftEquityValue'] is None and s['draftPerShareValue'] is None for s in a['scenarios']))
 check('TCBonly and no model runtime imports',all(x['ticker']=='TCB' for x in f.values()) and auth['issuer']=='TCB' and not auth['newRemediationRound'] and not auth['valuationExecutionAuthorized'])
 # Scan the newly executed scripts for runtime/valuation imports; receipt is scope evidence, not a live boundary test.
 forbidden=['valuation_model','underwrite','sqlite3','scoring','decision.engine','boto3']
 imports=[];calls=[]
 for file in ['calibrate.py','financial_challenge.py']:
  tree=ast.parse((OUT/file).read_text())
  for node in ast.walk(tree):
   if isinstance(node,ast.Import):imports.extend(a.name for a in node.names)
   elif isinstance(node,ast.ImportFrom):imports.append(node.module or '')
   elif isinstance(node,ast.Call):
    if isinstance(node.func,ast.Name):calls.append(node.func.id)
    elif isinstance(node.func,ast.Attribute):calls.append(node.func.attr)
 check('No model, database or formal engine imported/invoked',not any(any(b in name for b in forbidden) for name in imports) and not any(c in ['evaluate_case','justified_pb','residual_income','score','rank','decide'] for c in calls))
 pins=load(OUT/'input-pins.json');check('All input byte pins unchanged',all(sha(ROOT/p)==h for p,h in pins.items()))
 sealed=[]
 for folder in [P26,OWNER,PRIOR]:
  m=load(ROOT/folder/'manifest.json');check(folder+' canonical manifest',digest({k:v for k,v in m.items() if k!='contentHash'})==m['contentHash']);check(folder+' sealed file bytes',all(sha(ROOT/folder/p)==h for p,h in m['files'].items()));sealed.append(dict(path=folder,files=len(m['files']),contentHash=m['contentHash']))
 before=load(OUT/'protected-before.json');changed=[p for p,h in before.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h];check('All current baseline code/source/financial records unchanged',not changed)
 data={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()};check('Exact production/data inventory unchanged',data=={p for p in before if p.startswith('data/')})
 status=command(['git','status','--porcelain']);check('Only authorized new package modified',all(line[3:].startswith(rel+'/') for line in status.splitlines()))
 integrity=dict(status='PASS',baselineCommit=BASE,implementationCommit=None,protectedFiles=len(before),pinSetHash=digest(before),databaseHashes={p:h for p,h in before.items() if p.startswith('data/vn30.sqlite')},dataFileCount=len(data),dataInventoryUnchanged=True,sealedPredecessors=sealed,sourcePointers=len(bindings),approvedFinancialRecordsChanged=False,productionPortfolioMutation=False)
 write('baseline-integrity.json',integrity)
 write('validation-results.json',dict(status='PASS',technicalChecks=len(checks),checks=checks,financialChallengeChecks=20,financialResult=challenge['status'],researchResult='BLOCKED_WITH_EXACT_DEPENDENCIES',completeScenarios=0,valuationExecuted=False,formalM3Executed=False,rankingExecuted=False,M4Executed=False,productionAdmissionTestExecuted=False,wholeReleaseTestsExecuted=False,protectedFiles=len(before),noLookAheadClaim=True,noSourceScopeExpansion=True))
 (OUT/'VALIDATION.md').write_text(f'''# Bounded TCB research validation

Technical **{len(checks)}/{len(checks)}PASS**; separate financial challenge **20checks PASS with financial blockers retained**. Same-agent distinct passes, not independent human acceptance. Financial result remains BLOCKED_WITH_EXACT_DEPENDENCIES;0complete scenarios. No valuation/model, formal scoring/ranking/M4or production engine was run.

{len(before)} existing tracked/data files, the exact{len(data)}-file data inventory, SQLite/sidecars, source bytes, financial records, policies/weights/authorities/masters and portfolio remain unchanged. All3sealed predecessor packages pass exact canonical/output hashes; the approved latest package also verifies read-only. No historical receipt was edited. Changed paths are restricted to this one new folder.

D1–D6exact approvals persisted;3credit anchors and3no-issuance cells remain approved conditionally. Source authority approval is separate from keapproval;21other numerical scenario cells remain null. All{len(bindings)} exact ledger/note pointers resolve. Two new fixed-historical-exposure pretax estimates are pending numerical approval; BULLrounding residue is preserved, not zeroed. Native billion units/regulatory scope and six-month periods remain explicit.

Acquisition is exactly3objects/2selected publishers in1bounded cycle: one complete HTMLtable; HNXTLSfailure; incomplete method PDFremoved with partial-hash tombstone. No failed object gets an invented original hash, unit, publication or observation timestamp. Update label is not first publication time; mixed-vintage live table is not silently aFY2025snapshot. No beta/default premium/price unit or full-scenario economics is inferred. No alternate-provider or additional-dataset fallback collection or peer issuer processing occurred.

Command/UTC receipts: `validation-receipts.json`; source network receipts: `source-acquisition.json`; separate challenge: `financial-challenge.json`; protected/database hashes: `baseline-integrity.json`. Whole-repository release/build/browser and live production-admission tests were not run because no application/runtime behavior changed. Byte preservation and null research outputs are boundary evidence, not new formal acceptance.

**STOP. No valuation execution authorized.**
''')
 final=OUT/'TCB_BOUNDED_RESEARCH_FINAL_REVIEW.md';final.write_text(final.read_text()+f'\nValidation: **{len(checks)}/{len(checks)} technical checks PASS;20financial challenge checks PASS with blockers;{len(before)} protected files unchanged**. See [validation](VALIDATION.md). Baseline HEAD remains `{BASE}`; implementation uncommitted.\n')
 current={str(p.relative_to(ROOT)) for p in OUT.rglob('*') if p.is_file() and '__pycache__' not in p.parts};planned={rel+'/changed-files.json',rel+'/manifest.json',rel+'/read-only-verification.json'}
 write('changed-files.json',dict(baselineCommit=BASE,implementationCommit=None,status='UNCOMMITTED_NEW_PACKAGE_ONLY',paths=sorted(current|planned),excludedDisposableFragments=[load(OUT/'source-fragment-removal.json')['path']]))
 m=dict(schema='tcb-bounded-economic-research-v1',baselineCommit=BASE,hashSemantics='SHA256 canonical sorted UTF8 JSON excluding contentHash; exact file bytes pinned; postseal read-only-verification.json excluded',files={str(p.relative_to(OUT)):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ['manifest.json','read-only-verification.json'] and '__pycache__' not in p.parts})
 m['contentHash']=digest(m);write('manifest.json',m);print(json.dumps(dict(status='PASS',technicalChecks=len(checks),financialChecks=20,protectedFiles=len(before),manifestContentHash=m['contentHash'])),flush=True)
if __name__=='__main__':verify() if '--verify' in sys.argv else run()
