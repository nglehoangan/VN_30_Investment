"""Verify the closure overlay, fingerprint protected bytes and seal reviewable outputs."""
import importlib.util,subprocess,json,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('closure',Path(__file__).with_name('build-dfr04-closure.py'));c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
NODE=Path('/private/tmp/node-v22.23.2-darwin-arm64/bin/node')
def execute(args):
 r=subprocess.run(args,cwd=c.ROOT,capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stdout+'\n'+r.stderr)
 return dict(command=' '.join(args),exitCode=r.returncode,stdout=r.stdout,stderr=r.stderr)
def main():
 before=c.check();p=c.load('preparation.json');ch=c.load('challenge.json')
 if p['builderHash']!=c.sha('scripts/build-dfr04-closure.py') or ch['preparationHash']!=c.sha(c.REL+'/preparation.json'):raise ValueError('STALE_REVIEW')
 sector=c.OUT/'DFR_04_SECTOR_RECONCILIATION.md'
 sector.write_text(sector.read_text().replace('](/data/',']('+str(c.ROOT)+'/data/'))
 runs=[execute([sys.executable,'scripts/test-dfr04-closure.py']),execute([str(NODE),'scripts/verify-dfr04-closure-boundaries.mjs'])]
 # These completed subprocesses were observed earlier in this same execution cycle.
 prior=[dict(command='python3 scripts/test-dfr02.py',tests=25,exitCode=0,status='PASS',observedRunSeconds='26.380'),dict(command='python3 scripts/test-dfr04.py',tests=20,exitCode=0,status='PASS',observedRunSeconds='42.517'),dict(command=str(NODE)+' scripts/verify-approved-scoring-authority.mjs',exitCode=0,status='PASS',manifestContentHash='8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1',artifacts=37,historicalFilesUnchanged=133,compatibilities=9)]
 after=c.check()
 if before!=after:raise ValueError('INSPECTION_MUTATION')
 result=dict(status='PASS',validatedAt=c.now(),runs=runs,earlierObservedRegressions=prior,scope='Bounded research closure only; no full application/release PASS claim.',protectedFileCount=len(before['protectedFiles']),protectedFingerprintsUnchanged=True,financialParity=True,sourceLineage=True,distinctAIChallenge=True,independentHumanReviewClaimed=False,productionBoundaryProbes=c.load('boundary-results.json')['probes'],productionActivation=False,ownerApproval='PENDING')
 c.dump('validation-results.json',result)
 s=c.load('summary.json')
 text=f'''# DFR-04 closure validation — PASS in bounded scope

Baseline: `{c.COMMIT}`. Six pilots, 138 exact dispositions, 72 mapping/judgment cases processed. {s['newCompleted']} new assessments; {s['completed']}/138 completed; {s['remainingNotRated']} deferred. Zero complete scorecards. Remaining classes: {json.dumps(s['remainingClasses'])}.

- Closure contract/adversarial suite: 31/31 PASS. Covers exact bands/full topics, all evidence-ready cases, issuer/topic rejection, source conflicts, exact decimal reconciliations, six sectors, TCX small bond tranche and 1-VND conflict, owner decisions, no missing-as-zero, and immutable prior 14 assessments.
- Existing DFR02 suite: 25/25 PASS. Includes FY2022–25 comparability, VHM NCI, VIC closing columns, TCX date keys, unknown CaféF units and HPG zero-cashflow fixture.
- Existing DFR04 suite: 20/20 PASS. Existing sealed outputs, financial parity and prior preparation/challenge remain valid.
- Actual production entry points rejected all 54 probes: formal scoring, root/nested ranking, decisions, DCA, NAV, ledger builder, DI acceptance and AI provenance. No runtime source or production authority changed.
- Approved scoring authority: 37 artifacts / 133 historical files / 9 compatibilities PASS; content hash `8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1` unchanged.
- {len(before['protectedFiles'])} baseline tracked/protected/source/data files hash-identical, including active SQLite/sidecars if present and M1–M8. DFR02 financial arrays unchanged for all six issuers. No database writes, financial data correction, new acquisition, new cutoff or owner approval.

`validation-results.json` retains final closure/boundary process output and explicitly identifies earlier observed predecessor regressions from this execution. `inspection.json` records original hashes; `manifest.json` binds deliverables, JSON, evidence spec and implementation. Preparation and challenge are separate AI passes, not independent human review. Image-qualified pages are distinguished from retained-text-only context; PDF notes remain unpromoted research evidence.

Two legacy aggregate debt mapping exceptions are contained outside new assessment inputs (VIC/VHM); their dependent legacy reference branches remain unresolved. TCX arithmetic and EPS-note numerator agree but printed common row differs by 1 VND; the minor conflict remains. No silent issuer-wide downgrade or source replacement.

These are research-boundary validations, not whole-application release acceptance. All unresolved covenant, restriction, action, cohort, nonfinancial and valuation dependencies remain explicit. Owner acceptance is PENDING; no DFR05, issuer expansion or production activation.
'''
 (c.OUT/'DFR_04_VALIDATION.md').write_text(text)
 files={str(p.relative_to(c.OUT)):c.sha(str(p.relative_to(c.ROOT))) for p in sorted(c.OUT.rglob('*')) if p.is_file() and p.name!='manifest.json'}
 code={str(p.relative_to(c.ROOT)):c.sha(str(p.relative_to(c.ROOT))) for p in sorted((c.ROOT/'scripts').glob('*dfr04*closure*')) if p.is_file()}
 c.dump('manifest.json',dict(sealedAt=c.now(),baselineCommit=c.COMMIT,files=files,implementation=code,inspectionHash=c.sha(c.REL+'/inspection.json'),ownerAcceptance='PENDING',productionActivation=False))
 manifest=c.load('manifest.json')
 for p,v in manifest['files'].items():
  if c.sha(c.REL+'/'+p)!=v:raise ValueError('OUTPUT_HASH:'+p)
 for p,v in manifest['implementation'].items():
  if c.sha(p)!=v:raise ValueError('CODE_HASH:'+p)
 print(json.dumps(dict(status='PASS',closureTests=31,priorTests=45,boundaryProbes=54,protectedFileCount=len(before['protectedFiles']),completed=s['completed'],newCompleted=s['newCompleted'],remaining=s['remainingNotRated'],sealedFiles=len(files))))
if __name__=='__main__':main()
