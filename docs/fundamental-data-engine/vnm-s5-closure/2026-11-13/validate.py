"""Offline research validation; never opens application DB for writing."""
from pathlib import Path
import json,hashlib,subprocess,sys,unittest,os
sys.dont_write_bytecode=True
O=Path(__file__).resolve().parent;R=O.parents[3]
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def build():subprocess.run([sys.executable,str(O/'build.py')],check=True,capture_output=True)
build();pins=read(O/'SOURCE_PINS.json')
def checkpins():
 for category in ['inputs','scripts','protected']:
  for x in pins[category]:assert sha(R/x['path'])==x['sha256'],x['path']
checkpins()
inputs=read(O/'S5_VALUATION_INPUTS.json')
for b in inputs['selectedReportedCellEvidence']:
 doc=read(R/b['path']);pg=next(x for x in doc['pages'] if x.get('physicalPage',x.get('page'))==b['physicalPage'])
 for m in b['nativeMatches']:assert pg['lines'][m['lineIndex']]['text']==m['text']
 if b['pdfPath'] and b['pdfSha256']:assert sha(R/b['pdfPath'])==b['pdfSha256']
# Source roles, historical scope and source authority remain unchanged.
for path in ['vnm-s1-closure/2026-11-13/S1_ACCEPTANCE.json','vnm-s2-public-disclosure/2026-11-13/S2_CLOSURE_ACCEPTANCE.json','vnm-s3-closure/2026-11-13/S3_ACCEPTANCE.json']:
 assert read(R/'docs/fundamental-data-engine'/path)['status']=='CLOSED'
suite=unittest.defaultTestLoader.discover(str(O),pattern='test_model.py');res=unittest.TextTestRunner(verbosity=1).run(suite);assert res.wasSuccessful()
outputs=['S5_VALUATION_RESOLUTION.md','S5_VALUATION_INPUTS.json','S5_SCENARIOS.json','S5_EXPECTED_RETURN.json','S5_ACCEPTANCE.json','CURRENT_BLOCKER_REGISTER.md','SOURCE_PINS.json']
before={n:sha(O/n) for n in outputs};build();assert before=={n:sha(O/n) for n in outputs};checkpins()
a=read(O/'S5_ACCEPTANCE.json');assert all(a['researchContractControls'].values()) and a['status']=='CLOSED'
report=Path('/private/tmp/vnm-s5-m3-tests.json')
node='/private/tmp/node-v22.23.2-darwin-arm64/bin';env={**os.environ,'PATH':node+':'+os.environ['PATH']}
subprocess.run([node+'/node','node_modules/vitest/vitest.mjs','run','--config','docs/fundamental-data-engine/vnm-s2-liquidity/2026-11-13/vitest.config.mjs','--reporter=json','--outputFile='+str(report)],cwd=R,env=env,check=True)
ts=read(report);assert ts['numFailedTests']==0 and ts['numPassedTests']==104
checkpins()
result={'contract':'vnm-s5-validation-v1','result':'PASS','S5':a['status'],'scope':'Bounded research valuation only; not formal scorer/source/production admission','pythonTests':{'passed':res.testsRun,'failed':len(res.failures)+len(res.errors)},'typeScriptTests':{'passed':ts['numPassedTests'],'failed':ts['numFailedTests']},'deterministicReplay':{'status':'PASS','hashes':before},'checks':['Selected retained PDF cell text and source identities','Raw close unit conversion; no adjusted fallback','Parent FCFF and equity bridge; no finance income/asset duplication','Fund tax debt interest and declared distribution charged once','Maintenance working-capital and reinvestment funding; year6 terminal recomputation','Shareholder cash conservation PV and IRR roots','Adverse deposit maintenance dilution and unfunded scenario regressions','Economic contract controls and limited MOS precision','S1/S2/S3 closed records unchanged','Source protected database portfolio and scoring bytes unchanged'],'newNetworkAcquisitions':0,'sourceAuthorityChanged':False,'formalPoints':None,'productionActivation':'NOT_AUTHORIZED','nextMilestoneStarted':False}
(O/'VALIDATION.json').write_text(json.dumps(result,indent=2,sort_keys=True)+'\n');print(json.dumps({'result':'PASS','python':res.testsRun,'typescript':ts['numPassedTests'],'S5':a['status']}))
