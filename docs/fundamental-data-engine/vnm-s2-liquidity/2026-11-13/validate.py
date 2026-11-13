from pathlib import Path
import sys,json,hashlib,subprocess,os,unittest,ast
sys.dont_write_bytecode=True
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
subprocess.run(['python3',str(O/'build.py')],cwd=R,check=True)
c=read(O/'S2_LIQUIDITY_CALCULATIONS.json');a=read(O/'S2_ACCEPTANCE.json');pins=read(O/'SOURCE_PINS.json');checks=[]
def check(name,ok):
 if not ok:raise AssertionError(name)
 checks.append(name)
check('all sources protected source bytes and scripts pinned',all(sha(R/x['path'])==x['sha256'] for group in pins.values() if isinstance(group,list) for x in group))
# Exact native numbers/captions/columns remain independently inspectable, not invented mappings.
check('17 selected Q3 values retain direct PDF geometry',len(c['selectedFieldBindings'])==17 and all(x['nativeMatches'] and x['source']['pdfSha256'] for x in c['selectedFieldBindings']))
for x in c['selectedFieldBindings']:
 src=read(R/x['source']['path']);pg=src['pages'][int(x['source']['jsonPointer'].split('/')[-1])]
 for m in x['nativeMatches']:assert pg['lines'][m['lineIndex']]['text']==m['text']
check('all selected native line references replay',True)
q=read(O/'Q3_LIQUIDITY_SELECTED_PAGES.json');check('original Q3 source matches original receipt',sha(R/q['pdfPath'])==q['pdfSha256']==c['assets'][-1]['source']['originalReceipt']['record']['sha256'])
v=read(R/'docs/fundamental-data-engine/vnm-s4-skills/2026-11-11/OFFICIAL_HTML_TEXT.json')[2]
check('retained official dividend receipt and terms unchanged',sha(R/v['source']['path'])==v['source']['sha256'] and all(t in v['text'] for t in ['26/11/2026','12/11/2026','2.500','29/10/2026']))
notes=read(R/'data/manual-extracted-pdf/notes/VNM.json')
for amt,di,page in [('234.534.487',1,27),('1.133.258.842',6,34),('311.507.363.285',6,12),('274.593.598.630',1,11)]:assert amt in notes['documents'][di]['pages'][page-1]['text']
check('historical cash and interest input matches retained notes',True)
check('historical ladder and funding sensitivity preserved',c['retainedLadder']['count']==15 and c['retainedFundingSensitivity']['count']==16 and not c['retainedLadder']['overwritten'])
check('S1 remains closed and only S2 successor finding changes',a['S1Status']=='CLOSED_UNCHANGED' and read(R/'docs/fundamental-data-engine/vnm-s1-closure/2026-11-13/S1_ACCEPTANCE.json')['status']=='CLOSED')
check('test success is not economic closure',a['status']==c['status']=='BLOCKING' and len(a['blockers'])==2 and not c['actualInsolvencyConcluded'])
check('source approval score and portfolio authority unchanged',not a['formalAdmission'] and not a['VNM17Promoted'] and not a['scoresWritten'] and c['productionActivation']=='NOT_AUTHORIZED')
for p in O.glob('*.py'):ast.parse(p.read_text())
suite=unittest.defaultTestLoader.discover(str(O),pattern='test_liquidity.py');result=unittest.TextTestRunner().run(suite);check('24 focused liquidity boundary and real data tests',result.wasSuccessful() and result.testsRun==24)
outputs=['S2_LIQUIDITY_RESOLUTION.md','S2_LIQUIDITY_CALCULATIONS.json','S2_ACCEPTANCE.json','CURRENT_BLOCKER_REGISTER.md','SOURCE_PINS.json'];before={f:sha(O/f) for f in outputs}
subprocess.run(['python3',str(O/'build.py')],cwd=R,check=True)
check('deterministic replay',before=={f:sha(O/f) for f in outputs})
env={**os.environ,'PATH':'/private/tmp/node-v22.23.2-darwin-arm64/bin:'+os.environ['PATH']}
testpath=Path('/private/tmp/vnm-s2-m3-tests.json')
subprocess.run(['pnpm','exec','vitest','run','--config',str(O.relative_to(R)/'vitest.config.mjs'),'--reporter=json','--outputFile='+str(testpath)],cwd=R,env=env,check=True,stdout=subprocess.DEVNULL)
t=read(testpath);check('104 existing M3 scoring and normalization tests',t['numPassedTests']==104 and t['numFailedTests']==0)
check('database accounts and scoring bytes unchanged after tests',all(sha(R/x['path'])==x['sha256'] for x in pins['protected']))
report={'contract':'vnm-s2-validation-v1','result':'PASS','S2':'BLOCKING','meaning':'Calculation/source/guard validation passes, conservative economic closure conditions do not. No full suite or production readiness claim.','checks':checks,'checkCount':len(checks),'pythonTests':{'passed':24,'failed':0},'typeScriptTests':{'passed':104,'failed':0},'deterministicReplay':{'status':'PASS','outputHashes':before},'protectedBytes':'UNCHANGED','selectedPdfPages':6,'originalSources':'UNCHANGED','networkRetrievals':0,'formalAdmissions':0,'scoresWritten':0,'productionActivation':'NOT_AUTHORIZED'}
(O/'VALIDATION.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n');print(json.dumps(report,indent=2))
