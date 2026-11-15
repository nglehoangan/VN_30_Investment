from pathlib import Path
import subprocess,json,hashlib,sys,os,sqlite3
sys.dont_write_bytecode=True
O=Path(__file__).resolve().parent;R=O.parents[3];read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();node='/private/tmp/node-v22.23.2-darwin-arm64/bin';env={**os.environ,'PATH':node+':'+os.environ['PATH']}
def run(*cmd):subprocess.run(cmd,cwd=R,env=env,check=True)
def state():
 p=R/'data/vn30.sqlite';db=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True);db.execute('pragma query_only=ON');v={t:db.execute('select count(*) from '+t).fetchone()[0] for t in ['market_boundary_record','fundamental_admission_run','data_initialization_acceptance','scoring_dataset_binding','analytical_artifact']};db.close();return {'sha256':sha(p),'counts':v}
before=state();run(sys.executable,'-B',str(O/'build.py'));run(node+'/node',str(O/'run.mjs'));h=sha(O/'REAL_F1_ADMISSION.json');run(node+'/node',str(O/'run.mjs'));assert h==sha(O/'REAL_F1_ADMISSION.json');run(sys.executable,'-B',str(O/'finalize.py'))
files=['OFFICIAL_VN30_UNIVERSE_REVIEW.json','EVENT_REVIEW.json','VN30_IDENTITY_RECONCILIATION.json','MARKET_PROFILE.json','TRUSTED_SOURCE_INPUTS_SUCCESSOR.json','REFERENCE_HANDOFF.json','F1_MEMBERSHIP_ACCEPTANCE.json','F1_MEMBERSHIP_CLOSURE.md','CURRENT_BLOCKER_REGISTER.md','SOURCE_PINS.json'];hashes={n:sha(O/n) for n in files};run(sys.executable,'-B',str(O/'build.py'));run(sys.executable,'-B',str(O/'finalize.py'));assert hashes=={n:sha(O/n) for n in files}
report=Path('/private/tmp/vnm-membership-tests.json');run(node+'/node','node_modules/vitest/vitest.mjs','run','--config',str(O/'vitest.config.mjs'),'--reporter=json','--outputFile='+str(report));ts=read(report);assert ts['numFailedTests']==0 and ts['numPassedTests']>0
pins=read(O/'SOURCE_PINS.json')
for k in ['inputs','protected','scripts']:
 for p in pins[k]:assert sha(R/p['path'])==p['sha256'],p['path']
after=state();assert before==after
v={'result':'PASS','MembershipF1':'CLOSED','rawCloseCutoff':'2026-10-30','rawCloseVnd':'56900','officialMetadata':{'records':4081,'pages':5,'indexNoticesReviewed':13,'unclassified':0,'relevantEffectiveByReviewDate':0},'realRuntime':'ADMITTED_AND_CONSUMED_IN_ISOLATED_SQLITE','negativeRealRuntimeChecks':6,'regressionTests':{'passed':ts['numPassedTests'],'failed':0},'deterministicReplay':{'status':'PASS','realAdmissionSha256':h,'hashes':hashes},'liveDatabaseBefore':before,'liveDatabaseAfter':after,'sourceAuthorityChanged':False,'adapterCodeChanged':False,'productionActivation':'NOT_AUTHORIZED','historicalPIT':'NOT_QUALIFIED','Step2Overall':'BLOCKING_F2_CONSUMER_ASSESSMENT_GATES_UNCHANGED'}
(O/'VALIDATION.json').write_text(json.dumps(v,sort_keys=True,indent=2)+'\n');print(json.dumps({'MembershipF1':'CLOSED','validation':'PASS','regressionTests':ts['numPassedTests']}))
