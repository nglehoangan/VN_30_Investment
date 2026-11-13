from pathlib import Path
import json,hashlib,sys,subprocess,unittest,os
sys.dont_write_bytecode=True
O=Path(__file__).resolve().parent;R=O.parents[3];read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def build():subprocess.run([sys.executable,'-B',str(O/'build.py')],check=True,capture_output=True)
build();pins=read(O/'SOURCE_PINS.json')
def pincheck():
 for k in ['inputs','protected','scripts']:
  for p in pins[k]:assert sha(R/p['path'])==p['sha256'],p['path']
pincheck();c=read(O/'VNM_ASSESSMENT_CANDIDATES.json')
for e in c['evidenceRegistry'].values():
 p=R/e['path'];assert sha(p)==e['sha256']
 if e['jsonPointer']:
  value=read(p)
  for token in e['jsonPointer'].strip('/').split('/'):
   t=token.replace('~1','/').replace('~0','~');value=value[int(t)] if isinstance(value,list) else value[t]
from assessment_validation import validate_candidate
rubrics=json.loads((R/'src/domain/scoring/methodology.ts').read_text().split('deepFreeze(')[1].split(');')[0]);validate_candidate(c,rubrics)
suite=unittest.defaultTestLoader.discover(str(O),pattern='test_readiness.py');res=unittest.TextTestRunner().run(suite);assert res.wasSuccessful()
outputs=['VNM_23_RUBRIC_READINESS.md','VNM_ASSESSMENT_CANDIDATES.json','VNM_CONFIDENCE_AND_RISK_GATES.json','VNM_STEP1_ACCEPTANCE.json','CURRENT_BLOCKER_REGISTER.md','SOURCE_PINS.json'];before={n:sha(O/n) for n in outputs};build();assert before=={n:sha(O/n) for n in outputs};pincheck()
node='/private/tmp/node-v22.23.2-darwin-arm64/bin';report=Path('/private/tmp/vnm-step1-tests.json');env={**os.environ,'PATH':node+':'+os.environ['PATH']}
subprocess.run([node+'/node','node_modules/vitest/vitest.mjs','run','--config',str(O/'vitest.config.mjs'),'--reporter=json','--outputFile='+str(report)],cwd=R,env=env,check=True)
ts=read(report);assert ts['numFailedTests']==0 and ts['numPassedTests']>0;pincheck()
v={'contract':'vnm-step1-validation-v1','result':'PASS','scope':'Readiness artifact/evidence consistency, not formal score engine execution on VNM','pythonTests':{'passed':res.testsRun,'failed':len(res.failures)+len(res.errors)},'typescriptRegressionTests':{'passed':ts['numPassedTests'],'failed':ts['numFailedTests'],'files':[x['name'].replace(str(R)+'/','') for x in ts['testResults']]},'sourceAndProtectedPins':'UNCHANGED','evidenceReferencesResolved':len(c['evidenceRegistry']),'deterministicReplay':{'status':'PASS','hashes':before},'checks':['23rubrics/83topics present with explicit supported or material N/R disposition','Original154source bindings verified in builder; current evidence paths/hashes/JSON Pointers resolve','Fake HUMAN/approval/trust and missing-as-zero rejected by local readiness consistency checks','Runtime HUMAN/AI provenance and scoring bands exercised by existing regression suites','Actual5confidence dimensions and proposed unadoptedM1gates recorded','No formal VNM ScoreInput/scorecard built or persisted','No source approval/executable authority/portfolio/DB changes'],'newNetworkAcquisitions':0,'formalScoreEngineExecutedOnVNM':False,'totalScore':None,'productionActivation':'NOT_AUTHORIZED','step2Executed':False}
(O/'VALIDATION.json').write_text(json.dumps(v,sort_keys=True,indent=2)+'\n');print(json.dumps({'result':'PASS','python':res.testsRun,'typescript':ts['numPassedTests']}))
