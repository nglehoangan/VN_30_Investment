"""Executes existing real admission/consumer paths and isolated regression fixtures.
PASS here means correct observed partial admission/rejection, never Step2 CLOSED.
"""
from pathlib import Path
import json,hashlib,subprocess,os,sys
sys.dont_write_bytecode=True
O=Path(__file__).resolve().parent;R=O.parents[3];read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
node='/private/tmp/node-v22.23.2-darwin-arm64/bin';env={**os.environ,'PATH':node+':'+os.environ['PATH']}
def run(*args):subprocess.run(args,cwd=R,env=env,check=True)
# The preserved before-state is a real read-only DB snapshot from initial attempt.
run(sys.executable,'-B',str(O/'audit.py'),'after')
run(node+'/node',str(O/'run.mjs'))
first=sha(O/'REAL_EXECUTION.json');real=read(O/'REAL_EXECUTION.json')
assert real['consumer']['bindingResolved'] is False
for k in ['dataInitializationAcceptances','scoringDatasetBindings','analyticalArtifacts','fundamentalSnapshotRuns']:assert real['counts']['after'][k]==0
assert real['counts']['afterAdmission']==real['counts']['afterDuplicate']
assert real['F2']['evidence'][0]['observation']=='TOTAL_ASSETS' and real['F2']['evidence'][0]['periodEnd']=='2026-06-30'
assert real['F2']['evidence'][0]['value']=='57451803693875' and real['F2']['evidence'][0]['unit']=='VND'
assert real['F1']['rawCloseResearchValidation']['value']=='56900' and real['F1']['positiveControl']['substitutesRequestedCutoff'] is False
assert all(c['status']=='PASS' for c in real['checks'])
run(node+'/node',str(O/'run.mjs'));assert first==sha(O/'REAL_EXECUTION.json'),'ISOLATED_REPLAY_CHANGED'
run(sys.executable,'-B',str(O/'audit.py'),'after');run(sys.executable,'-B',str(O/'build.py'))
pins=read(O/'SOURCE_PINS.json')
def checkpins():
 for kind in ['inputs','protected','scripts']:
  for p in pins[kind]:assert sha(R/p['path'])==p['sha256'],p['path']
checkpins()
outputs=['VNM_STEP2_DATASET_BINDING.md','VNM_F1_MEMBERSHIP_RESOLUTION.json','VNM_F1_MARKET_DATA_VALIDATION.json','VNM_F2_ADMISSION_VALIDATION.json','VNM_DATASET_BINDING_ACCEPTANCE.json','CURRENT_BLOCKER_REGISTER.md','SOURCE_PINS.json']
hashes={n:sha(O/n) for n in outputs};run(sys.executable,'-B',str(O/'build.py'));assert hashes=={n:sha(O/n) for n in outputs}
report=Path('/private/tmp/vnm-step2-tests.json')
run(node+'/node','node_modules/vitest/vitest.mjs','run','--config',str(O/'vitest.config.mjs'),'--reporter=json','--outputFile='+str(report))
ts=read(report);assert ts['numFailedTests']==0 and ts['numPassedTests']>0
checkpins();run(sys.executable,'-B',str(O/'audit.py'),'after')
a=read(O/'VNM_DATASET_BINDING_ACCEPTANCE.json');assert a['step2Status']=='BLOCKING' and not a['scoringDatasetBindingPersisted']
v={'contract':'vnm-step2-validation-v1','result':'PASS_FOR_OBSERVED_PARTIAL_ADMISSION_AND_REJECTION','step2Status':'BLOCKING','realDataMode':real['mode'],'realDataRuntimeChecks':real['checks'],'realIsolatedDatabaseCounts':real['counts'],'liveDatabaseCountsAndHashes':'UNCHANGED_READ_ONLY_VERIFIED','typeScriptRegressionTests':{'passed':ts['numPassedTests'],'failed':ts['numFailedTests'],'files':[x['name'].replace(str(R)+'/','') for x in ts['testResults']]},'fixtureBootstrap':'Exact retained SQL via PythonSQLite in Step2-local disposable testDatabase; unchanged regression assertions/repositories. PrismaCLI attempts stalled/interrupted, not claimed PASS.','regressionFixtureMeaning':'Positive full dataset-binding tests use synthetic isolated fixtures; not evidence of a real VNM binding. Real VNM path remains blocked.','testCoverage':{'validCurrentPurposeAdmission':'REAL_VNM_SELECTED_FACT','missingDatedMembership':'REAL_VNM_30OCT_REJECTED','unsupportedSource':'REAL_VNM_EVIL_URL_REJECTED_AND_SYNTHETIC_REGRESSIONS','wrongPurpose':'REAL_VNM_REJECTED','fakeHistoricalPIT':'REAL_VNM_REJECTED','incompleteFinancialCoverage':'REAL_CURRENT_CONSUMER_READY_FOR_SCORING_FALSE; regression readiness rejects missing required items','invalidAcceptance':'REAL_REPOSITORY_REJECTED_BEFORE_INSERT_AND_REGRESSION_TRUST_CHECKS','staleMismatchedBinding':'EXISTING_SCORING_READINESS_ISOLATED_INTEGRATION_NEGATIVE_TESTS','deterministicReplay':'TWO_FRESH_REAL_SQLITE_RUNS_EXACT_OUTPUT_HASH_MATCH'},'deterministicReplay':{'realExecutionSha256':first,'reportHashes':hashes,'status':'PASS'},'authorityManifestRehashed':False,'formalVNMScoreExecuted':False,'bindingExists':False,'productionActivation':'NOT_AUTHORIZED','step3Executed':False}
(O/'VALIDATION.json').write_text(json.dumps(v,sort_keys=True,indent=2)+'\n');print(json.dumps({'Step2':'BLOCKING','validation':'PASS','realChecks':len(real['checks']),'regressionTests':ts['numPassedTests']}))
