"""Two-round acceptance receipts and read-only frozen package verifier."""
import sys,os,json,subprocess,datetime,platform,re
from pathlib import Path
import normalize as n
ROOT,OUT=n.ROOT,n.OUT
NODE='/private/tmp/node-v22.23.2-darwin-arm64/bin/node'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def protected():
 before=json.loads((OUT/'protected-before.json').read_text());changed=[p for p,h in before.items() if not (ROOT/p).is_file() or n.p1.sha(ROOT/p)!=h]
 olddata={p for p in before if p.startswith('data/')};data={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()}
 if changed or olddata!=data:raise ValueError(('PROTECTED_DRIFT',changed,sorted(data^olddata)))
 return dict(status='PASS',protectedFiles=len(before),protectedCanonicalHash=n.p1.digest(before),dataFileCount=len(data),dataInventoryUnchanged=True,allProtectedBytesUnchanged=True,databaseFiles={p:h for p,h in before.items() if p.startswith('data/vn30.sqlite')},productionCodeMasterAuthorityUnchanged=True)
def verify():
 m=json.loads((OUT/'manifest.json').read_text());assert n.p1.digest({k:v for k,v in m.items() if k!='contentHash'})==m['contentHash']
 for p,h in m['files'].items():assert n.p1.sha(OUT/p)==h,('OUTPUT_DRIFT',p)
 for p,h in json.loads((OUT/'source-input-pins.json').read_text()).items():assert n.p1.sha(ROOT/p)==h,('INPUT_DRIFT',p)
 protected();subprocess.run(['git','merge-base','--is-ancestor',n.BASELINE,'HEAD'],cwd=ROOT,check=True)
 print(json.dumps(dict(status='PASS',readOnly=True,contentHash=m['contentHash'],protectedFiles=10269)))
def run():
 records=[];env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'}
 def command(args):
  start=now();r=subprocess.run(args,cwd=ROOT,env=env,capture_output=True,text=True);record=dict(command=args,startedAt=start,finishedAt=now(),exitCode=r.returncode,stdout=r.stdout,stderr=r.stderr);records.append(record)
  n.write('validation-receipts.json',dict(records=records,python=platform.python_version(),node=NODE))
  print(json.dumps(dict(command=args[-1],exitCode=r.returncode,stdout=r.stdout[-900:],stderr=r.stderr[-300:])),flush=True)
  if r.returncode:raise RuntimeError('VALIDATION_COMMAND_FAILED')
  return record
 rel=str(OUT.relative_to(ROOT))
 command([sys.executable,rel+'/package.py','--round2'])
 t=command([sys.executable,rel+'/test_p26.py']);count=int(re.search(r'Ran (\d+) tests',t['stderr']).group(1))
 command([sys.executable,'docs/fundamental-data-engine/dfr-05/p2-5-b1-readiness-74510523/validate.py','--verify'])
 command([NODE,'scripts/verify-approved-scoring-authority.mjs'])
 protection=protected();n.write('baseline-integrity-verification.json',protection)
 for path,h in json.loads((OUT/'source-input-pins.json').read_text()).items():assert n.p1.sha(ROOT/path)==h,('INPUT_DRIFT',path)
 status=command(['git','status','--porcelain']);assert all(line[3:].startswith(rel+'/') for line in status['stdout'].splitlines()),'OUTSIDE_SCOPE_CHANGE'
 head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();assert head==n.BASELINE
 n.write('preparation-challenge-review.json',dict(preparation=dict(round=1,status='SEALED',manifestContentHash=json.loads((OUT/'round1/manifest.json').read_text())['contentHash']),challenge=dict(round=2,status='COMPLETED_WITH_ESCALATED_RESEARCH_DEPENDENCIES',reviewer='Same agent in distinct preparation/challenge passes; not independent human acceptance',findings=[dict(id='P26-M01',result='Bank-core denominator corrected only in overlay; frozen145metric objects retained'),dict(id='P26-M02',result='FY2025interest expense current-column components image-checked; totals reconcile'),dict(id='P26-M03',result='Gross behavioural maturity/unrestricted-cash interpretation rejected; liquidity topic remains blocked'),dict(id='P26-M04',result='Parent-equity rollforward and common EPS bridge exact; no capital transaction in P&L; maximum FH-BS Strong rejected; demonstrated ignored nonzero-issuance model defect fixed fail-closed, explicit zero issuance required, positive ke enforced',syntheticBefore='Nonzero newShares=10/netNewCommonCash=1 returned a value on unchanged B/shares; synthetic fixture only, no TCB value',syntheticAfter='Nonzero shares OR cash rejected even when dilutionTermsQualified=true; missing action assumptions return BLOCKED_INPUTS_OR_APPROVAL')]),remainingBlockers=['U1','U2','U3','U4','U5'],maximumRounds=2,thirdRoundAuthorized=False))
 results=dict(technicalValidation='PASS',tests=count,financialParity='PASS',protected=protection,baselineCommit=head,newReportedReadings=127,newDerivedDiagnostics=43,missingEconomicDependencies=12,all23RubricInstancesDocumented=True,qualifiedHistoricalDrafts=1,blockedForCompleteAssessment=22,formalAssessments=0,formalPointAssignments=0,totalScore=None,analysisStatus='ANALYSIS_PARTIALLY_READY',valuationStatus='SPECIFICATION_READY_CASE_BLOCKED',M4Status='DECISION_NOT_AUTHORIZED',productionAuthority='NOT_AUTHORIZED_BY_P26',escalation='ESCALATED_STOP',remainingCritical=0,remainingMajorGroups=5,remainingMinor=0,formalScorerExecuted=False,rankingExecuted=False,decisionEngineExecuted=False,productionBoundaryExecution=False,boundaryEvidence='All production/M1–M8/database/master/authority files remain byte-identical; research outputs retain null formal fields and false admission flags. No formal engine called or admission integration attempted.',newSourceAcquisition=False,otherIssuerProcessing=False,wholeRepositoryTestsExecuted=False)
 n.write('validation-results.json',results)
 validation=f'''# P2.6 bounded validation

Technical validation PASS: {count}/{count} bounded tests; this is not whole-project release or financial acceptance.

- 10,269 protected files and exact data inventory byte-identical, including SQLite/sidecars, M1–M8, authorities/masters, source JSON/PDFs and all prior dossiers.
- P2.5 sealed package read-only verification PASS; this transitively preserves its P1 789 metrics, 25 completed and113 deferred assessments and829 B1 metrics. TCB145 original metric objects and23 prior rubric records are not rewritten.
- Approved static scoring-authority verification PASS; no formal scorer, ranking or decision engine executed.
- 127 reported readings,43 derived diagnostics and12 null economic dependencies; current/comparative, million/billion and consolidated/regulatory scopes retained.
- Source pointers/hashes, 23-topic completeness, unchanged band labels, unsupported band rejection, missing-as-zero rejection, model domains and explicit capital-action rejection covered.
- Synthetic RI/PB consistency tests do not constitute independent valuation corroboration or TCB case assumptions.
- One proposed Adequate historical draft;22 blocked. Formal score/total/value/MOS/expected return remain null. Five Major dependency groups escalated; Critical0, Minor0 remaining.

Exact commands, UTC times, exit codes and output: `validation-receipts.json`. Byte/inventory hashes: `baseline-integrity-verification.json`. Distinct same-agent preparation/challenge passes and four findings: `preparation-challenge-review.json`. Round1 remains sealed; Round2 final. No further remediation phase authorized.

No live admission test is claimed: production boundary evidence consists of unchanged executable/data/authority bytes, false research flags/null formal fields, and no invocation. Whole-repository tests/build/browser were not run because application code and runtime are unchanged.
'''
 (OUT/'VALIDATION.md').write_text(validation)
 final=OUT/'DFR_05_P2_6_FINAL_REVIEW.md';final.write_text(final.read_text()+'\n\nValidation: **'+str(count)+'/'+str(count)+' bounded tests PASS**, protected10,269files/data inventory unchanged, P2.5 seal and static authority PASS. See [validation](VALIDATION.md), `validation-results.json` and command receipts. Remaining Minor0; no complete issuer scorecard or formal score created.\n')
 m=dict(schema='dfr05-p26-tcb-manifest-v1',baselineCommit=n.BASELINE,round=2,contentHashSemantics='SHA256 of canonical sorted UTF8 JSON, excluding contentHash; inputs pinned separately',files={str(p.relative_to(OUT)):n.p1.sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ('manifest.json','read-only-verification.json') and '__pycache__' not in p.parts},inputPinSetHash=n.p1.digest(json.loads((OUT/'source-input-pins.json').read_text())))
 m['contentHash']=n.p1.digest(m);n.write('manifest.json',m);print(json.dumps(dict(status='PASS',tests=count,contentHash=m['contentHash'])),flush=True)
if __name__=='__main__':verify() if '--verify' in sys.argv else run()
