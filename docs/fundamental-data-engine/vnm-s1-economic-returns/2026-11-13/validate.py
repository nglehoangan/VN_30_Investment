from pathlib import Path
import json,hashlib,subprocess,os,unittest,ast
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
load=lambda n:json.loads((O/n).read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
checks=[]
def check(name,ok):
 if not ok:raise AssertionError(name)
 checks.append(name)
i=load('S1_INPUTS.json');r=load('S1_ECONOMIC_RETURNS.json');pins=load('SOURCE_PINS.json')
check('all selected native amounts traceable',len(i['nativeTextChecks'])==109 and all(x['source']['scope']=='CONSOLIDATED' and x['source']['physicalPage'] for x in i['nativeTextChecks']))
check('29 exact existing canonical quantity matches',len(i['canonicalCrosschecks'])==29 and not i['canonicalFactsRequalified'])
check('all annual income statements and balance identities reconcile',len(i['reportedStatementReconciliations'])==4 and all(x['reportedPbt']==x['reconstructedPbt'] for x in i['reportedStatementReconciliations']))
check('four annual years and opening 2021 stock retained',len(r['historicalAnnualSummary'])==4 and set(i['stocks'])=={'2021','2022','2023','2024','2025'})
check('all normalization scenarios use matched earnings capital scope',len(r['scenarios'])==16 and all(a['scope']=='CONSOLIDATED' and a['currency']=='VND' for s in r['scenarios'] for a in s['annual']))
check('missing capital cost produces NR and no fabricated spread',r['costOfCapitalComparison']['status']=='N_R' and r['costOfCapitalComparison']['value'] is None and not r['costOfCapitalComparison']['defaultUsed'])
check('exact indispensable blocker is supported benchmark not factory detail',[b['id'] for b in r['indispensableBlockers']]==['S1_CAPITAL_COST_RANGE'] and not i['projectOrFactoryAttributionRequired'])
check('unknown incremental comparability not coerced into ratio or score',all(a['value'] is None for s in r['scenarios'] for a in s['incremental']))
check('no premature closure or scores',r['S1Closed'] is False and r['formalRubricPoints'] is None and r['fullVnmScore'] is None)
check('M3 source authority and production unchanged',not r['M3WeightsChanged'] and not r['sourceAuthorityChanged'] and r['productionActivation']=='NOT_AUTHORIZED')
for p in O.glob('*.py'):ast.parse(p.read_text())
check('Python helpers parse',True)
check('retained evidence contracts and analytical helpers hash valid',all(sha(R/p['path'])==p['sha256'] for p in pins['files']+pins['scriptFiles']))
protected=[pins['protectedDatabase'],*pins['protectedPersonalAccountFiles']]
check('live database and owner account bytes unchanged',all(sha(R/p['path'])==p['sha256'] for p in protected))
suite=unittest.defaultTestLoader.discover(str(O),pattern='test_returns.py');test_result=unittest.TextTestRunner().run(suite)
check('18 targeted Python tests pass',test_result.wasSuccessful() and test_result.testsRun==18)
outputs=['S1_INPUTS.json','S1_ECONOMIC_RETURNS.json','S1_RESOLUTION.md','SOURCE_PINS.json']
before={p:sha(O/p) for p in outputs}
subprocess.run(['python3',str(O/'build.py')],cwd=R,check=True,stdout=subprocess.DEVNULL)
check('all analysis outputs deterministic on retained evidence',before=={p:sha(O/p) for p in outputs})
env={**os.environ,'PATH':'/private/tmp/node-v22.23.2-darwin-arm64/bin:'+os.environ['PATH']}
command=['pnpm','exec','vitest','run','--config',str(O.relative_to(R)/'vitest.config.mjs'),'--reporter=json','--outputFile=/private/tmp/vnm-s1-returns-tests-final.json']
subprocess.run(command,cwd=R,env=env,check=True,stdout=subprocess.DEVNULL)
tests=json.loads(Path('/private/tmp/vnm-s1-returns-tests-final.json').read_text())
check('105 existing/scoped TypeScript tests pass',tests['numPassedTests']==105 and tests['numFailedTests']==0)
engine=load('METRIC_REPLAY.json');check('unchanged M3 calculator matches four real historical arithmetic cases',engine['status']=='PASS' and len(engine['rows'])==4 and not engine['formalAdmission'])
check('protected bytes remain unchanged after all tests',all(sha(R/p['path'])==p['sha256'] for p in protected))
report={'contract':'vnm-s1-resolution-validation-v1','result':'PASS','checks':checks,'checkCount':len(checks),'pythonTests':{'passed':18,'failed':0},'typeScriptTests':{'passed':105,'failed':0,'files':[{'path':str(Path(t['name']).relative_to(R)),'tests':len(t['assertionResults']),'status':t['status']} for t in tests['testResults']]},'deterministicReplay':{'status':'PASS','outputHashes':before},'existingMetricArithmeticRows':4,'sourceTextChecks':109,'canonicalExactMatches':29,'canonicalFactsRequalified':False,'financialStatementReconciliations':4,'protectedBytes':protected,'noLiveWrites':True,'weightsChanged':False,'sourceAuthorityChanged':False,'S1ClosureGranted':False,'productionActivation':'NOT_AUTHORIZED','scope':'Analytical method/source mapping/normalization and capital consistency, N/R guards, unchanged metric arithmetic and protected bytes; not economic-cost qualification, formal Evidence admission or a production score.','retainedPdfInspection':'Known Q3 PDF has no native text in inspected initial12pages; no OCR/download or current-period numerical substitution performed. Annual JSON evidence suffices for this historical study; no current-quarter/TTM completeness claim.'}
(O/'VALIDATION.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n')
print(json.dumps({'result':'PASS','checks':len(checks),'pythonTests':18,'typeScriptTests':105,'status':'S1_BLOCKING_COST_OF_CAPITAL_COMPARATOR'}))
