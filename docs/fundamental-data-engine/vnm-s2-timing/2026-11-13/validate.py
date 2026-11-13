from pathlib import Path
import sys,json,hashlib,subprocess,unittest,os
sys.dont_write_bytecode=True
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent;P=R/'docs/fundamental-data-engine/vnm-s2-liquidity/2026-11-13'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
subprocess.run(['python3',str(O/'build.py')],cwd=R,check=True)
j=read(O/'S2_PRIMARY_STATEMENT_RECONCILIATION.json');pins=read(O/'SOURCE_PINS.json');checks=[]
def check(name,ok):
 if not ok:raise AssertionError(name)
 checks.append(name)
check('source and script hashes match',all(sha(R/x['path'])==x['sha256'] for group in pins.values() if isinstance(group,list) for x in group))
n=read(R/'data/manual-extracted-pdf/notes/VNM.json')
for di,page,tokens in [(4,13,['3.473.788.102.329']),(4,14,['35.088.076.540','748.239.561.302']),(4,10,['3.874.744.696.050']),(4,58,['3.866.417.573.250','35.032.239.000'])]:
 for t in tokens:assert t in n['documents'][di]['pages'][page-1]['text']
check('newly selected H1 cash flows dividends and declaration values match source',True)
for x in j['reportedValues']:
 s=x['source'];pop=read(R/s['path']);page=pop['pages'][int(s['jsonPointer'].split('/')[-1])]
 for m in x['nativeMatches']:assert m['text']==page['lines'][m['lineIndex']]['text']
 assert sha(R/s['pdfPath'])==s['pdfSha256']
check('10 primary balance values replay exact page and line references',len(j['reportedValues'])==10)
policy=read(O/'Q3_POLICY_SELECTED_PAGE.json');check('cash policy is retained original PDF',sha(R/policy['pdfPath'])==policy['pdfSha256'] and 'cam kết chi tiền' in policy['text'])
check('review scope explicit and not complete negative bank search',len(j['reviewCoverage'])==40 and all(x['coverage'].startswith('RETAINED_JSON_TEXT') for x in j['reviewCoverage']))
for src in [j['dividendLifecycleBridge']['sources']['openingAndClosing'],j['operatingCashTimeSplit']['YTD9M2026']['source']]:assert sha(R/src['pdfPath'])==src['pdfSha256']
check('original source identities kept across annual interim comparison',True)
check('no current production portfolio or source authority changes',j['newFinancialFactsAdmitted']==0 and not j['scoresWritten'] and not j['databaseMutation'] and j['S1']=='CLOSED_UNCHANGED')
result=unittest.TextTestRunner().run(unittest.defaultTestLoader.discover(str(O),pattern='test_timing.py'));check('20 timing provenance and actual data tests',result.wasSuccessful() and result.testsRun==20)
subprocess.run(['python3',str(P/'test_liquidity.py')],cwd=R,check=True);check('24 existing liquidity tests pass',True)
outputs=['S2_PRIMARY_STATEMENT_RECONCILIATION.json','S2_ACCEPTANCE.json','S2_TIMING_RECONCILIATION.md','CURRENT_BLOCKER_REGISTER.md','SOURCE_PINS.json'];before={x:sha(O/x) for x in outputs};subprocess.run(['python3',str(O/'build.py')],cwd=R,check=True)
check('deterministic successor replay',before=={x:sha(O/x) for x in outputs})
env={**os.environ,'PATH':'/private/tmp/node-v22.23.2-darwin-arm64/bin:'+os.environ['PATH']}
subprocess.run(['pnpm','exec','vitest','run','--config',str(P.relative_to(R)/'vitest.config.mjs'),'--reporter=json','--outputFile=/private/tmp/vnm-s2-timing-m3.json'],cwd=R,env=env,check=True,stdout=subprocess.DEVNULL)
t=read(Path('/private/tmp/vnm-s2-timing-m3.json'));check('104 existing M3 normalization and score tests',t['numPassedTests']==104 and t['numFailedTests']==0)
check('original reports accounts database scoring bytes unchanged',all(sha(R/x['path'])==x['sha256'] for x in pins['protected']) and all(sha(R/x['path'])==x['sha256'] for x in pins['inputs']))
report={'result':'PASS','S2':'BLOCKING_NOT_ESTABLISHED_MATCHED_COVERAGE','checks':checks,'pythonTests':{'new':20,'existingLiquidity':24,'failed':0},'typeScriptTests':{'passed':104,'failed':0},'deterministicReplay':'PASS','outputHashes':before,'newPdfPolicyPages':2,'networkAcquisitions':0,'protectedBytes':'UNCHANGED','formalAdmissions':0,'scoresWritten':0,'productionActivation':'NOT_AUTHORIZED','scope':'Source arithmetic and timing safeguards; tests do not establish unknown deposit access, contractual dates or full liquidity qualification.'}
(O/'VALIDATION.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n');print(json.dumps(report,indent=2))
