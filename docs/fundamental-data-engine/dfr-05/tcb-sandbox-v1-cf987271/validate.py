"""Offline sandbox tests, deterministic replay and immutable-baseline verification."""
import os,sys,json,subprocess,platform,datetime,ast,re
from prepare import ROOT,OUT,BASE,OLD,P26,QUAL,read,write,sha,digest,pointer

def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def verify():
 m=read(OUT/'manifest.json');assert digest({k:v for k,v in m.items() if k!='contentHash'})==m['contentHash']
 for p,h in m['files'].items():assert sha(OUT/p)==h,('SANDBOX_DRIFT',p)
 for p,h in read(OUT/'protected-before.json').items():assert sha(ROOT/p)==h,('BASELINE_DRIFT',p)
 for p,h in read(OUT/'input-pins.json').items():assert sha(ROOT/p)==h,('INPUT_DRIFT',p)
 assert {str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()}=={p for p in read(OUT/'protected-before.json') if p.startswith('data/')}
 print(json.dumps(dict(status='PASS',readOnly=True,contentHash=m['contentHash'])))
def run():
 rel=str(OUT.relative_to(ROOT));records=[];checks=[];env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'}
 def command(args):
  start=now();r=subprocess.run(args,cwd=ROOT,env=env,capture_output=True,text=True);records.append(dict(command=args,startedAt=start,finishedAt=now(),exitCode=r.returncode,stdout=r.stdout,stderr=r.stderr));write('validation-receipts.json',dict(python=platform.python_version(),records=records));print(json.dumps(dict(command=args[-1],exitCode=r.returncode,stdout=r.stdout[-800:],stderr=r.stderr[-450:])),flush=True)
  if r.returncode:raise RuntimeError('VALIDATION_COMMAND_FAILED')
  return r.stdout,r.stderr
 def check(name,condition):
  if not condition:raise AssertionError(name)
  checks.append(dict(name=name,status='PASS'))
 command([sys.executable,rel+'/prepare.py']);command([sys.executable,rel+'/run.py']);first=digest(read(OUT/'scenario-outputs.json'));command([sys.executable,rel+'/run.py']);second=digest(read(OUT/'scenario-outputs.json'));check('Two exact deterministic sandbox outputs',first==second)
 stdout,stderr=command([sys.executable,rel+'/test_model.py']);tests=int(re.search(r'Ran (\d+) tests',stderr).group(1))
 command([sys.executable,rel+'/report.py']);command([sys.executable,rel+'/financial_challenge.py']);command([sys.executable,OLD+'/validate.py','--verify'])
 head=command(['git','rev-parse','HEAD'])[0].strip();check('Latest verified GitHubmain equals execution HEAD',head==BASE==read(OUT/'github-head-receipt.json')['sha']);command(['git','merge-base','--is-ancestor',BASE,'HEAD'])
 metadata=read(OUT/'metadata-correction.json');check('Successor commit-status overlay exact immutable baseline',metadata['historicalImplementationCommit']==BASE and metadata['executionBaselineCommit']==BASE and metadata['historicalExecutionBaselineCommit']=='b5c8fe27ce9fb2f8786b603463176f6d5437c6f1' and metadata['sandboxImplementationCommit'] is None and not metadata['oldApprovedFilesChanged'])
 output=read(OUT/'scenario-outputs.json');config=read(OUT/'scenario-inputs.json');anchors=read(OUT/'anchors.json');challenge=read(OUT/'financial-challenge.json')
 check('Only hypothetical labels and explicit null formal fields',all(s['labels']==['RESEARCH_ONLY','HYPOTHETICAL','NOT_AN_APPROVED_INTRINSIC_VALUE','NOT_FOR_M3_M4_OR_PRODUCTION'] and all(s[k] is None for k in ['approvedIntrinsicValue','formalM3Points','formalM3Total','ranking','M4Decision','selectedPrice','marginOfSafety','expectedReturn']) and not s['productionAdmissible'] for s in [output]+output['scenarios']))
 check('Every scenario has contract,lineage and local sensitivity',all(all(k in s for k in ['historicalAnchorRefs','hypotheticalAssumptions','formula','hypotheticalPB','hypotheticalEquityValue','hypotheticalPerShareModelValue','sensitivityResults','capitalFeasibility','economicLimitations','validationStatus','lineage']) for s in output['scenarios']))
 check('Inputs are labelled hypotheses not numerical forecasts',all(x['classification']=='HYPOTHETICAL_ASSUMPTION' and x['evidenceStatus']=='ILLUSTRATIVE_NOT_EMPIRICALLY_QUALIFIED_FORECAST' for s in config['scenarios'] for x in s['inputs'].values()))
 check('BEARinfeasibility retained',output['scenarios'][0]['capitalFeasibility']['status']=='CAPITAL_INFEASIBLE' and output['scenarios'][0]['economicAdmissibility']=='REJECTED_CAPITAL_INFEASIBLE')
 check('BASE/BULLcapital passes explicitly hypothetical',all(s['capitalFeasibility']['status']=='HYPOTHETICALLY_CAPITAL_FEASIBLE' and not s['capitalFeasibility']['empiricallyQualified'] for s in output['scenarios'][1:]))
 check('Stress only reconciled once, no extra funding in ke',all(not s['stressReconciliation']['stressSubtractedAgain'] and not s['stressReconciliation']['fundingAddedToKe'] for s in output['scenarios']))
 check('Financial challenge separately executed on final inputs',all(x['status']=='PASS' for x in challenge['checks']) and all(sha(OUT/p)==h for p,h in challenge['inputHashes'].items()))
 check('Output lineage pin hashes match final model/config/anchors',output['lineage']['anchorFileSha256']==sha(OUT/'anchors.json') and output['lineage']['configurationSha256']==sha(OUT/'scenario-inputs.json') and output['lineage']['modelSha256']==sha(OUT/'model.py'))
 bindings=[a['provenance'] for a in anchors.values() if isinstance(a,dict) and 'provenance' in a]+[anchors['commonBook']['qualifiedCommonDefinition']]+[a['provenance'] for a in anchors['historicalCreditAnchors'].values()]
 for b in bindings:assert sha(ROOT/b['path'])==b['sha256'] and digest(pointer(read(ROOT/b['path']),b['jsonPointer']))==b['objectHash'],b
 check('All historical/native source evidence pointers intact',len(bindings)==14)
 check('No unqualified TCBSprice selected or in anchors',config['marketPrice'] is None and '22789' not in json.dumps(anchors) and 'TCBS' not in json.dumps(anchors))
 # Sandbox sources use standard-library local data/arithmetic only. Repository metadata preflight is outside model execution.
 imports=[];calls=[]
 for file in ['model.py','prepare.py','run.py','report.py','financial_challenge.py','test_model.py']:
  tree=ast.parse((OUT/file).read_text())
  for n in ast.walk(tree):
   if isinstance(n,ast.Import):imports.extend(x.name for x in n.names)
   elif isinstance(n,ast.ImportFrom):imports.append(n.module or '')
   elif isinstance(n,ast.Call):
    if isinstance(n.func,ast.Name):calls.append(n.func.id)
    elif isinstance(n.func,ast.Attribute):calls.append(n.func.attr)
 forbidden=['requests','urllib','http','socket','sqlite3','boto','src.','infrastructure','scoring','portfolio','valuation_model']
 check('No network/production imports or valuation-service calls',not any(any(name.startswith(b) for b in forbidden) for name in imports))
 check('No external runtime dependencies',set(imports)<= {'decimal','json','sys','pathlib','hashlib','subprocess','datetime','model','prepare','unittest','copy','fractions'})
 check('No clock/random nondeterminism in model',set(n.module or '' for n in ast.walk(ast.parse((OUT/'model.py').read_text())) if isinstance(n,ast.ImportFrom))=={'decimal'} and 'random' not in (OUT/'model.py').read_text())
 pins=read(OUT/'input-pins.json');check('Input byte pins unchanged',all(sha(ROOT/p)==h for p,h in pins.items()))
 before=read(OUT/'protected-before.json');changed=[p for p,h in before.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h];check('All approved code/financial/source/decision/receipts unchanged',not changed)
 data={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()};check('Production DB/data inventory unchanged',data=={p for p in before if p.startswith('data/')})
 m=read(ROOT/OLD/'manifest.json');check('Prior approved package seal unchanged',digest({k:v for k,v in m.items() if k!='contentHash'})==m['contentHash'] and all(sha(ROOT/OLD/p)==h for p,h in m['files'].items()))
 status=command(['git','status','--porcelain'])[0];check('Only isolated sandbox files changed',all(line[3:].startswith(rel+'/') for line in status.splitlines()))
 rows=output['sensitivities']['tables'];priceRows=rows['roeVsKe']+rows['growthVsKe']+rows['payoutVsRoe'];invalid=sum(x['status']=='INVALID_ECONOMIC_COMBINATION' for x in priceRows);unstable=sum('UNSTABLE_KE_MINUS_G' in x.get('flags',[]) for x in priceRows)
 integrity=dict(status='PASS',executionBaselineCommit=BASE,historicalImplementationCommit=BASE,sandboxImplementationCommit=None,protectedFiles=len(before),protectedPinSetHash=digest(before),dataFileCount=len(data),dataInventoryUnchanged=True,databaseHashes={p:h for p,h in before.items() if p.startswith('data/vn30.sqlite')},priorManifestHash=m['contentHash'],priorApprovedFilesChanged=False)
 write('baseline-integrity.json',integrity)
 result=dict(engineeringAcceptance='PASS',researchSandboxAcceptance='READY_FOR_OWNER_REVIEW_WITH_HYPOTHETICAL_LIMITATIONS',economicForecastValidity='NOT_ESTABLISHED',testsPassed=tests,technicalChecks=checks,financialChallengeChecks=len(challenge['checks']),reproducibleHashes=[first,second],capitalStatuses={s['scenario']:s['capitalFeasibility']['status'] for s in output['scenarios']},sensitivityCells=sum(len(x) for x in rows.values()),invalidPriceSensitivityCells=invalid,unstablePriceSensitivityCells=unstable,engineeringIssues=dict(Critical=0,Major=0,Minor=0),inheritedFormalEvidenceBlockers='Unchanged; hypothetical assumptions do not resolve them',selectedPrice=None,formalScoringExecuted=False,M4Executed=False,portfolioDatabaseWrites=False,networkCallsInSandbox=False,wholeRepositoryReleaseTestsExecuted=False,protectedFiles=len(before))
 write('validation-results.json',result)
 (OUT/'VALIDATION.md').write_text(f'''# Sandbox validation

**{tests}/{tests} model tests PASS**, {len(checks)} separate technical/boundary checks PASS, {len(challenge['checks'])} financial challenge checks PASS with hypothetical limitations. Engineering acceptance PASS; ready for owner sandbox review. Economic forecast validity NOT_ESTABLISHED. Same-agent distinct preparation/challenge passes; not independent human acceptance.

Two actual runner invocations produced identical canonical output hashes `{first}`. Tests cover closed-form rational values/RIparity, exact Decimal identities independent of ambient precision, native VND/shares, configuration classification, clean-surplus/terminal/domain errors, near-zero denominator, capital infeasibility/constant-state limit, credit/funding double counting, zero-issuance restrictions, missing/null/negative/float/NaNinputs, no market price and rejection of APPROVED_INTRINSIC_VALUE/FORMAL_BUYlabels. All five sensitivity tables are deterministic: {sum(len(x) for x in rows.values())} cells, including {invalid} invalid price-surface combinations and {unstable} near-zero-denominator warnings. These flags are retained, not graded as software failures.

All{len(before)} protected files, exact{len(data)}-file data inventory, SQLite/sidecars, source/PDF/JSONrecords, approved decisions/M1–M4/weights/runtime/portfolio/authorities and old validation hashes/timestamps remain unchanged. Prior bounded-research seal verifies read-only. Stale commit-status text is addressed exclusively by a successor metadata record. Metadata preflight used GitHubconnector once outside sandbox computation; the sandbox sources contain no network or production imports.

Actual command/UTC receipts: `validation-receipts.json`. Exact protected/database hashes: `baseline-integrity.json`. Separate financial challenge: `financial-challenge.json`. Engineering issues remaining0Critical/0Major/0Minor. BEARremains capital-infeasible; BASE/BULLcapital passes are only conditional mathematical hypotheses. No complete formal economic forecast, intrinsic value, target price, MOS, expected return, M3/M4or production acceptance is claimed. Whole-application tests/build/browser/live admission were not run because application code/runtime were not changed.

**STOP — owner review only.**
''')
 final=OUT/'TCB_SANDBOX_FINAL_REVIEW.md';final.write_text(final.read_text()+f'\nValidation complete: **{tests}/{tests} model tests, {len(checks)} technical checks and {len(challenge["checks"])} financial challenge checks PASS**. {len(before)} protected files unchanged; {sum(len(x) for x in rows.values())} sensitivity cells exported. See [validation](VALIDATION.md).\n')
 actual={str(p.relative_to(ROOT)) for p in OUT.rglob('*') if p.is_file() and '__pycache__' not in p.parts};planned={rel+'/changed-files.json',rel+'/manifest.json',rel+'/read-only-verification.json'};write('changed-files.json',dict(executionBaselineCommit=BASE,historicalImplementationCommit=BASE,sandboxImplementationCommit=None,workingTreeStatus='NEW_SANDBOX_UNCOMMITTED',paths=sorted(actual|planned)))
 manifest=dict(schema='tcb-analyst-sandbox-v1',executionBaselineCommit=BASE,sandboxImplementationCommit=None,contentHashSemantics='SHA256 canonical sorted UTF8 JSON excluding contentHash; postseal read-only-verification.json excluded',files={str(p.relative_to(OUT)):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ['manifest.json','read-only-verification.json'] and '__pycache__' not in p.parts})
 manifest['contentHash']=digest(manifest);write('manifest.json',manifest);print(json.dumps(dict(status='PASS',tests=tests,technicalChecks=len(checks),financialChecks=len(challenge['checks']),protectedFiles=len(before),sensitivityCells=sum(len(x) for x in rows.values()),manifestContentHash=manifest['contentHash'])),flush=True)
if __name__=='__main__':verify() if '--verify' in sys.argv else run()
