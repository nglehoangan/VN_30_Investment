"""Final bounded acceptance validation and deterministic real-input replay; never writes live DB."""
from pathlib import Path
import json,hashlib,subprocess,os,ast
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
load=lambda n:json.loads((O/n).read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
checks=[]
def check(name,ok):
 if not ok:raise AssertionError(name)
 checks.append(name)
i=load('VNM_SCORING_INPUTS.json');e=load('VNM_SCORING_EXECUTION.json');pins=load('SOURCE_PINS.json')
check('six required final outputs exist',all((O/n).is_file() for n in ['S1_S5_FINAL_RECONCILIATION.md','VNM_SCORING_INPUTS.json','VNM_SCORING_EXECUTION.json','VNM_FINAL_SCORECARD.md','FINAL_BLOCKER_REGISTER.md','FINAL_CIO_ACCEPTANCE.md']))
check('exact original S1-S5 and S4 successor scopes reconciled',all(any(r['id']==s or r['id'].startswith(s+'-') for r in i['S1S5IssueRegister']) for s in ['S1','S2','S3','S4','S5']))
check('dispositions use only closed/blocking/nonblocking',all(r['status'] in ['CLOSED','BLOCKING','NON-BLOCKING'] for r in i['S1S5IssueRegister']))
check('R1 R4 stay closed',all(next(r for r in i['S1S5IssueRegister'] if r['id']==s)['status']=='CLOSED' for s in ['S4-R1','S4-R4']))
check('no invented component or total scores',e['totalScore'] is None and all(v is None for v in e['componentScores'].values()))
check('no accepted valuation or expected-return fabrication',e['acceptedFairValue'] is None and e['expectedReturn'] is None)
check('actual existing application engine rejected without artifact writes',e['workflow']['attempt']['reason']=='FORMAL_SCORING_DATASET_REQUIRED' and e['workflow']['artifactWrites']==0)
check('application attempt replay deterministic',e['workflow']['attempt']==e['workflow']['replay'])
check('source authority valid and no per material receipt demand',i['sourceAuthority']['U1']=='CLOSED_NOT_REOPENED' and i['sourceAuthority']['perMaterialReceiptsRequired'] is False)
check('current evidence validates under current purpose only',e['currentPurposeValidation']['status']=='PASS' and 'CURRENT_ONLY_NOT_PIT' in e['implicitScoringEvidenceValidation']['reason'])
check('membership gap remains explicit without new discovery','VN30_MEMBERSHIP_OUTSIDE_VERIFIED_INTERVAL' in e['cutoffMarketValidation']['reason'])
check('exact executable verifier result retained','SCORING_EXECUTABLE_HASH_MISMATCH:' in e['executableAuthorityValidation']['reason'])
check('VNM17 not promoted',e['VNM17Promoted'] is False and i['sourceAuthority']['VNM17']=='PENDING_EXPLICIT_OWNER_APPROVAL_NOT_PROMOTED')
check('65 canonical facts reused verbatim',len(i['qualifiedFinancialFacts']['canonicalFacts'])==65 and all(f.get('qualified') is True for f in i['qualifiedFinancialFacts']['canonicalFacts']))
check('15 historical cash components kept separate',len(i['historicalCashDividendComponents']['facts'])==15)
check('raw close unit and share selection exact',i['price']['sourceField']=='GiaDongCua' and i['price']['adjustedFieldEligible'] is False and i['price']['valueVndPerShare']=='56900' and i['shares']['value']=='2089955445')
check('14 unselected research bands remain explicit',sum(r['researchProposedPoints'] is None for r in i['researchRubricConclusions'])==14)
check('all blockers reference exact evidence and contracts',len(i['unresolvedCurrentBlockers'])==6 and all(b['evidence'] and b['contract'] for b in i['unresolvedCurrentBlockers']))
check('no claim that another user file is required for outcome B',i['newUserSuppliedInformationRequiredForFinalAssessment'] is False)
check('production not activated',e['productionReady'] is False and e['productionActivation']=='NOT_AUTHORIZED')
check('protected retained bytes and source contracts unchanged',all(sha(R/p['path'])==p['sha256'] for p in pins['files']))
check('live database byte hash unchanged',sha(R/'data/vn30.sqlite')==i['databaseReadOnlyState']['sha256']==e['databaseSha256Before']==e['databaseSha256After'])
for p in O.glob('*.py'):ast.parse(p.read_text())
check('Python helpers parse',True)
# Capture final byte outputs, rebuild inputs, replay real application/predicates, rerender documents.
outputs=['S1_S5_FINAL_RECONCILIATION.md','VNM_SCORING_INPUTS.json','VNM_SCORING_EXECUTION.json','VNM_FINAL_SCORECARD.md','FINAL_BLOCKER_REGISTER.md','FINAL_CIO_ACCEPTANCE.md','SOURCE_PINS.json']
before={p:sha(O/p) for p in outputs}
subprocess.run(['python3',str(O/'assemble.py')],cwd=R,check=True,stdout=subprocess.DEVNULL)
env={**os.environ,'PATH':'/private/tmp/node-v22.23.2-darwin-arm64/bin:'+os.environ['PATH']}
command=['pnpm','exec','vitest','run','--config',str(O.relative_to(R)/'vitest.config.mjs'),'execution.test.ts','--reporter=json','--outputFile=/private/tmp/vnm-final-s1-s5-replay.json']
subprocess.run(command,cwd=R,env=env,check=True,stdout=subprocess.DEVNULL)
subprocess.run(['python3',str(O/'finalize.py')],cwd=R,check=True,stdout=subprocess.DEVNULL)
check('all six outputs and source pins byte-identical on deterministic replay',before=={p:sha(O/p) for p in outputs})
check('live DB unchanged after replay',sha(R/'data/vn30.sqlite')==i['databaseReadOnlyState']['sha256'])
full=json.loads(Path('/private/tmp/vnm-final-s1-s5-tests-final.json').read_text());focused=json.loads(Path('/private/tmp/vnm-final-s1-s5-execution-final.json').read_text());replay=json.loads(Path('/private/tmp/vnm-final-s1-s5-replay.json').read_text())
check('scoped final tests all pass',full['numPassedTests']==173 and full['numFailedTests']==0)
check('final real VNM focused run and deterministic replay pass',focused['numPassedTests']==1 and focused['numFailedTests']==0 and replay['numPassedTests']==1 and replay['numFailedTests']==0)
initial=json.loads(Path('/private/tmp/vnm-final-s1-s5-tests.json').read_text())
report={'contract':'final-vnm-reconciliation-validation-v1','result':'PASS','checks':checks,'checkCount':len(checks),'scopedTests':{'passed':173,'failed':0,'files':[{'path':str(Path(t['name']).relative_to(R)),'status':t['status'],'tests':len(t['assertionResults'])} for t in full['testResults']]},'focusedFinalRealRun':{'passed':1,'failed':0},'deterministicReplay':{'passed':1,'failed':0,'outputHashes':before},'interimAttempt':{'passed':initial['numPassedTests'],'failed':initial['numFailedTests'],'reason':'30s timeout while redundantly requalifying an already admitted native source through the full standing verifier. Reused the existing exact admission record and replayed the native planner/current Evidence predicates; no timeout or domain policy relaxed. Final focused and full scoped runs pass.','directNodeCliDiagnostic':'Existing ts-runtime CLI cannot load a JSON policy import without an import attribute; the actual verifier was executed through the repository Vite/Vitest resolver and reported the exact executable hash mismatch.'},'protectedDatabaseSha256':sha(R/'data/vn30.sqlite'),'sourceHashesRechecked':len(pins['files']),'newFinancialSourceQualifications':0,'newAdmissions':0,'productionScoresWritten':0,'livePortfolioMutated':False,'financialRulesChanged':False,'U1Reopened':False,'VNM17Promoted':False,'productionActivation':'NOT_AUTHORIZED','coverage':'Scoped scoring/golden/evidence-time/readiness/AI-provenance/raw-close/economic-normalization regressions plus actual retained-VNM entry/purpose gates. Not a full repository-suite or production-readiness PASS claim.'}
(O/'VALIDATION.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n')
print(json.dumps({'result':'PASS','checks':len(checks),'scopedTests':173,'liveDatabaseChanged':False}))
