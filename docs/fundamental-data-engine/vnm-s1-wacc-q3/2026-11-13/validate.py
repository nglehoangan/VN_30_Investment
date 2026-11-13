from pathlib import Path
import sys,json,hashlib,unittest,subprocess,os,ast,re
from decimal import Decimal as D,localcontext
sys.dont_write_bytecode=True
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
read=lambda n:json.loads((O/n).read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
checks=[]
def check(name,ok):
 if not ok:raise AssertionError(name)
 checks.append(name)
i=read('WACC_Q3_INPUTS.json');r=read('WACC_ROIC_Q3_ASSESSMENT.json');p=read('SOURCE_PINS.json')
check('four requested actions have explicit results',all(k in r for k in ['wacc','annualRoicComparison','q3CurrentPeriod','incrementalComparability']))
check('65 selected Q3 cells have direct source and native locators',len(i['selectedFields'])==65 and all(f['source']['pdfSha256']==i['q3Source']['sha256'] and f['source']['lineBox'] for f in i['selectedFields']))
check('Q3 source bytes and original receipt hash match',sha(R/i['q3Source']['path'])==i['q3Source']['sha256']==i['q3Source']['retrievalEvidence']['record']['sha256'])
check('no known source receipts altered or unverified TLS substituted',all(not re.search(r'(^|\s)(-k|--insecure)(\s|$)',x.get('transport','')) for x in i['sourceReceipts'] if x.get('status')==200) and len([x for x in i['sourceReceipts'] if x.get('status')==200])==4)
check('country and tax risk not double counted',all(x['countryRiskCount']==1 for x in r['wacc']['scenarios']) and r['wacc']['classification'].startswith('TRACEABLE_ANALYST_ESTIMATE'))
check('WACC estimate replaces unavailable input without source approval',r['S1Disposition']['capitalCostInput']=='RESOLVED_WITH_SUPPORTED_ESTIMATE_AND_EXPLICIT_LIMITATIONS' and not i['formalSourceAdmissionGranted'])
check('S1 old source and formal closure are not silently rewritten',not r['S1Disposition']['S1FormalClosureGranted'] and read('S1_CURRENT_DISPOSITION.json')['supersedesFinding']['finding']=='S1_CAPITAL_COST_RANGE_UNAVAILABLE')
check('all four annual ranges positive versus conservative estimate',len(r['annualRoicComparison'])==4 and all(x['robustAcrossTestedCases'] for x in r['annualRoicComparison']))
with localcontext() as ctx:
 ctx.prec=45
 expected_charge=[str(D(r['wacc'][k])*D('.75')) for k in ['low','high']]
check('current nine month comparison uses a nine month capital charge',r['q3CurrentPeriod']['capitalChargeNineMonthsRange']==expected_charge)
check('TTM ROIC and incremental ratios not invented',r['q3CurrentPeriod']['TTM']['roic'] is None and r['incrementalComparability']['numericalIncrementalRoic'] is None)
check('presentation reclassification is not an economic flow',i['restatementBridge']['allInOperatingEbitDelta']=='0' and i['restatementBridge']['pretaxProfitDelta']=='0')
check('cost stress is labeled separate from estimated WACC',all(x['classification'].startswith('ROBUSTNESS_STRESS_ONLY') for x in r['additionalCostStressHurdles']))
check('raw close field and pending VNM17 preserved',i['macroAndWaccInputs']['marketValueReferences']['noVnm17PromotionOrAdjustedFallback'] and not read('S1_CURRENT_DISPOSITION.json')['VNM17Promoted'])
check('no scoring source or production mutation',r['totalScore'] is None and r['newAdmissions']==0 and not r['M3Changes'] and not r['portfolioChanges'] and r['productionActivation']=='NOT_AUTHORIZED')
check('all source and helper pins match current retained bytes',all(sha(R/x['path'])==x['sha256'] for x in p['files']+p['scripts']))
protected=[p['protectedDatabase'],*p['protectedAccountFiles']]
previous=json.loads((R/'docs/fundamental-data-engine/vnm-s1-economic-returns/2026-11-13/SOURCE_PINS.json').read_text())
check('database matches pre-existing S1 baseline',p['protectedDatabase']['sha256']==previous['protectedDatabase']['sha256'])
check('database and owner account bytes unchanged',all(sha(R/x['path'])==x['sha256'] for x in protected))
for x in O.glob('*.py'):ast.parse(x.read_text())
check('Python helpers parse',True)
test_suite=unittest.defaultTestLoader.discover(str(O),pattern='test_model.py');test_result=unittest.TextTestRunner().run(test_suite)
check('18 focused WACC current-period tests pass',test_result.wasSuccessful() and test_result.testsRun==18)
outputs=['WACC_Q3_INPUTS.json','WACC_ROIC_Q3_ASSESSMENT.json','S1_CURRENT_DISPOSITION.json','FINAL_REVIEW.md','SOURCE_PINS.json']
before={f:sha(O/f) for f in outputs};subprocess.run(['python3',str(O/'build.py')],cwd=R,check=True,stdout=subprocess.DEVNULL)
check('deterministic rebuild of all outputs',before=={f:sha(O/f) for f in outputs})
env={**os.environ,'PATH':'/private/tmp/node-v22.23.2-darwin-arm64/bin:'+os.environ['PATH']}
subprocess.run(['pnpm','exec','vitest','run','--config',str(O.relative_to(R)/'vitest.config.mjs'),'--reporter=json','--outputFile=/private/tmp/vnm-s1-wacc-q3-final-tests.json'],cwd=R,env=env,check=True,stdout=subprocess.DEVNULL)
tests=json.loads(Path('/private/tmp/vnm-s1-wacc-q3-final-tests.json').read_text())
check('105 scoped M3 and normalization tests pass',tests['numPassedTests']==105 and tests['numFailedTests']==0)
metric=read('METRIC_REPLAY.json');check('current-period arithmetic replays unchanged M3 without annualization',metric['status']=='PASS' and metric['notAnnualized'] and not metric['formalAdmission'])
check('protected source and portfolio bytes unchanged after replay',all(sha(R/x['path'])==x['sha256'] for x in protected))
report={'contract':'vnm-s1-wacc-q3-validation-v1','result':'PASS','checks':checks,'checkCount':len(checks),'pythonTests':{'passed':18,'failed':0},'typeScriptTests':{'passed':105,'failed':0,'files':[{'path':str(Path(t['name']).relative_to(R)),'tests':len(t['assertionResults']),'status':t['status']} for t in tests['testResults']]},'deterministicReplay':{'status':'PASS','outputHashes':before},'protectedBytes':protected,'sourceEvidenceAcquisition':'Four bounded public macro/method HTML captures; existing VNM Q3 PDF reused with selected local extraction, no financial-corpus redownload. Failed Python/HNX TLS attempt preserved; successful curl verified TLS, never disabled certificates.','visualReview':'Primary Q3 statement columns, fund note and tax/reclassification rows inspected in rendered source pages; selected native line geometry and full page text retained. Disposable images/readers are not output dependencies.','interimFailureAndFix':'One focused test exposed use of caller Decimal precision in period_return; local45-digit context fixed it without changing source values or investment rules. Final tests and deterministic replay pass.','scope':'Arithmetic, source identity, period/scope/reclassification, economic-risk nonduplication and protected bytes. Not formal financial/score admission, an independently observed WACC, full-suite validation or production approval.','productionScoresWritten':0,'newFormalAdmissions':0,'pendingVNM17Promoted':False,'productionActivation':'NOT_AUTHORIZED'}
(O/'VALIDATION.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n')
print(json.dumps({'result':'PASS','checks':len(checks),'pythonTests':18,'typeScriptTests':105,'databaseChanged':False}))
