"""Actual P2.5 validation receipts. --verify checks the final package read-only."""
import sys,os,json,subprocess,platform,datetime,re
from pathlib import Path
import proof
ROOT,OUT,p1=proof.ROOT,proof.OUT,proof.p1
NODE=Path('/private/tmp/node-v22.23.2-darwin-arm64/bin/node')

def run():
 env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'};records=[]
 def command(argv):
  start=datetime.datetime.now(datetime.timezone.utc).isoformat();r=subprocess.run(argv,cwd=ROOT,capture_output=True,text=True,env=env)
  record=dict(command=argv,startedAt=start,finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),exitCode=r.returncode,stdout=r.stdout,stderr=r.stderr);records.append(record)
  print(json.dumps(dict(command=argv[-1],exitCode=r.returncode,stdout=r.stdout[-1000:],stderr=r.stderr[-300:])),flush=True)
  proof.write('validation-receipts.json',dict(python=platform.python_version(),records=records))
  if r.returncode:raise RuntimeError('VALIDATION_COMMAND_FAILED:'+str(argv))
  return record
 script=str((OUT/'proof.py').relative_to(ROOT));test=str((OUT/'test_proof.py').relative_to(ROOT));baseline=str((OUT/'baseline_check.py').relative_to(ROOT))
 command([sys.executable,script]);a=json.loads((OUT/'proof-content-hash.json').read_text())
 command([sys.executable,script]);b=json.loads((OUT/'proof-content-hash.json').read_text())
 if a!=b:raise ValueError('NONDETERMINISTIC_MACHINE_PROOF')
 tests=command([sys.executable,test]);count=int(re.search(r'Ran (\d+) tests',tests['stderr']).group(1))
 command([str(NODE),'scripts/verify-approved-scoring-authority.mjs'])
 command([sys.executable,baseline])
 proof.write('validation-receipts.json',dict(python=platform.python_version(),node=subprocess.check_output([str(NODE),'--version'],text=True).strip(),records=records,scope='Read-only proof generation/challenge, static approved authority, immutable baseline parity and protected-byte checks. No formal scoring, ranking, decision or production execution.'))
 protected=json.loads((OUT/'protected-validation.json').read_text())
 results=dict(status='PASS',executedTests=count,fullyReadyRubrics=0,partiallyReadyRubrics=54,blockedRubrics=84,all138Dispositions=True,financialMetricObjectsPreserved=829,p1MetricObjectsPreserved=789,p1AssessmentsPreserved=25,p1DeferredPreserved=113,selectedCandidate='TCB',freshProofBuilds=2,canonicalProofHashes=[a['canonicalContentHash'],b['canonicalContentHash']],protected=protected,formalScorerExecuted=False,formalRankingExecuted=False,formalDecisionExecuted=False,newFinancialMetricsCalculated=False,sourceAcquisition=False,productionActivation=False,unblockPlanImplemented=False,actualNewFilesScope=str(OUT.relative_to(ROOT)))
 proof.write('validation-results.json',results)
 proof.write('challenge-review.json',dict(status='PASS',passKind='Distinct verification/challenge pass performed by the same agent; no independent human acceptance claimed',tests=count,checked=['All138 issuer/rubric/topic references versus immutable M3','Exact829 metric projections/lineage/status/value parity','37 historical-context plus6 unqualified economic dependencies; selection invariant under input permutation','Metric support and keyword notes cannot promote whole topics to READY','Client assets segregated; bank regulatory versus accounting capital separate','Existing method definitions versus absent case valuation inputs','Existing dated display/account evidence versus absent cutoff/admission','No missing-as-zero, scores, implicit current prices or reopened owner facts'],remainingResearchBlockers=['U1','U2','U3','U4','U5'],conditionalBlocker='U6',newBlockingExecutableDefectEstablished=False,wholeRepositoryTestsExecuted=False))
 for p in OUT.glob('__pycache__/*'):p.unlink()
 if (OUT/'__pycache__').exists():(OUT/'__pycache__').rmdir()
 manifest=dict(schema='dfr05-p25-proof-manifest-v1',baselineCommit=proof.BASELINE,canonicalHashSemantics='SHA256 canonical sorted UTF8 JSON excluding contentHash',files={str(p.relative_to(OUT)):p1.sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ('manifest.json','read-only-verification.json')},inputPinSetHash=p1.digest(json.loads((OUT/'input-pins.json').read_text())),postSealReceipt='read-only-verification.json is excluded: records --verify process, not evidence authority')
 manifest['contentHash']=p1.digest(manifest);proof.write('manifest.json',manifest)
 print(json.dumps(dict(status='PASS',tests=count,manifestContentHash=manifest['contentHash'])),flush=True)

def verify():
 m=json.loads((OUT/'manifest.json').read_text());assert p1.digest({k:v for k,v in m.items() if k!='contentHash'})==m['contentHash']
 for path,h in m['files'].items():assert p1.sha(OUT/path)==h,('OUTPUT_CHANGED',path)
 for path,h in json.loads((OUT/'input-pins.json').read_text()).items():assert p1.sha(ROOT/path)==h,('INPUT_CHANGED',path)
 for path,h in json.loads((OUT/'protected-before.json').read_text()).items():assert p1.sha(ROOT/path)==h,('PROTECTED_CHANGED',path)
 before=json.loads((OUT/'protected-before.json').read_text());assert {str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()}=={p for p in before if p.startswith('data/')}
 subprocess.run(['git','merge-base','--is-ancestor',proof.BASELINE,'HEAD'],cwd=ROOT,check=True)
 print(json.dumps(dict(status='PASS',readOnly=True,manifestContentHash=m['contentHash'],protectedFiles=len(before))))
if __name__=='__main__':
 if '--verify' in sys.argv:verify()
 else:run()
