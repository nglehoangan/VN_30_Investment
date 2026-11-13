from pathlib import Path
from decimal import Decimal as D
import sys,json,hashlib,subprocess,unittest,copy,os
sys.dont_write_bytecode=True
from close_s2 import decide
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
read=lambda n:json.loads((O/n).read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
subprocess.run(['python3',str(O/'close_s2.py')],cwd=R,check=True)
a=read('S2_CLOSURE_ACCEPTANCE.json');core=a['coreScenarios'];old=read('FINAL_S2_CALCULATIONS.json')
class ClosureTests(unittest.TestCase):
 def test_supported_core_closes(self):self.assertEqual(decide(core,sources_verified=True,contract_review_complete=True),'CLOSED')
 def test_any_core_failure_blocks(self):
  x=copy.deepcopy(core);x[0]['surplusVnd']='-1';self.assertEqual(decide(x,sources_verified=True,contract_review_complete=True),'BLOCKING')
 def test_missing_core_cases_blocks(self):self.assertEqual(decide(core[:-1],sources_verified=True,contract_review_complete=True),'BLOCKING')
 def test_source_mismatch_blocks(self):self.assertEqual(decide(core,sources_verified=False,contract_review_complete=True),'BLOCKING')
 def test_incomplete_policy_review_blocks(self):self.assertEqual(decide(core,sources_verified=True,contract_review_complete=False),'BLOCKING')
 def test_actual_contradiction_blocks(self):self.assertEqual(decide(core,sources_verified=True,contract_review_complete=True,material_contradiction=True),'BLOCKING')
 def test_verified_cash_floor_not_ignored(self):self.assertEqual(decide(core,sources_verified=True,contract_review_complete=True,verified_minimum_cash='2286769972647'),'BLOCKING')
 def test_cutoff_not_shifted(self):
  x=copy.deepcopy(core);x[0]['asOfPurpose']='2026_09_30_Q3_STANDALONE';self.assertEqual(decide(x,sources_verified=True,contract_review_complete=True),'BLOCKING')
 def test_extra_failure_preserved(self):self.assertLess(min(D(x['surplusVnd']) for x in a['additionalSensitivities']),0)
 def test_all_old_cases_preserved(self):
  oldcurrent=[x for x in old['scenarios'] if x['asOfPurpose']=='2026_10_30_DECLARED_DIVIDEND_OVERLAY'];self.assertEqual(len(a['coreScenarios'])+len(a['additionalSensitivities']),len(oldcurrent));self.assertTrue(all(x in oldcurrent for x in a['coreScenarios']+a['additionalSensitivities']))
 def test_operating_cash_need_not_removed(self):self.assertGreater(max(D(x['negativeOperatingCashNeedVnd']) for x in core),0);self.assertTrue(all(x['positiveFutureCfoCreditVnd']=='0' for x in core))
 def test_dividend_and_accrual_kept(self):self.assertTrue(all(x['declaredNewDividendIncluded'] and x['existingBorrowingAccrualVnd']=='109677386717' for x in core))
 def test_no_cash_minimum_fabricated(self):self.assertIsNone(a['verifiedMinimumOperatingCashVnd'])
 def test_no_score_or_authority_promotion(self):self.assertTrue(all(x is None for x in a['rubricPoints'].values()));self.assertFalse(a['formalFactAdmission'] or a['VNM17Promoted'] or a['fullVNMScoringReady'] or a['sourceAccessClassificationChanged'])
 def test_no_s1_reopening_or_data_request(self):self.assertEqual(a['S1'],'CLOSED_UNCHANGED');self.assertEqual(a['unresolvedMaterialS2Blockers'],[]);self.assertFalse(a['newUserInformationRequired'])
r=unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(ClosureTests));assert r.wasSuccessful()
pins=read('S2_CLOSURE_SOURCE_PINS.json');assert all(sha(R/x['path'])==x['sha256'] for group in pins.values() for x in group)
outputs=['S2_CLOSURE_ACCEPTANCE.json','S2_CLOSURE.md','S2_CLOSED_ISSUE_REGISTER.md','S2_CLOSURE_SOURCE_PINS.json'];before={n:sha(O/n) for n in outputs};subprocess.run(['python3',str(O/'close_s2.py')],cwd=R,check=True);assert before=={n:sha(O/n) for n in outputs}
env={**os.environ,'PATH':'/private/tmp/node-v22.23.2-darwin-arm64/bin:'+os.environ['PATH']}
subprocess.run([str(R/'node_modules/.bin/vitest'),'run','--config','docs/fundamental-data-engine/vnm-s2-liquidity/2026-11-13/vitest.config.mjs','--reporter=json','--outputFile=/private/tmp/vnm-s2-closure-m3.json'],cwd=R,env=env,check=True,stdout=subprocess.DEVNULL)
t=json.loads(Path('/private/tmp/vnm-s2-closure-m3.json').read_text());assert t['numPassedTests']==104 and t['numFailedTests']==0
assert all(sha(R/x['path'])==x['sha256'] for group in pins.values() for x in group)
report={'result':'PASS','S2':'CLOSED','scope':'Bounded public-disclosure12month research issue acceptance; not formal financial admission/full rubric score','pythonTests':{'passed':r.testsRun,'failed':0},'typeScriptTests':{'passed':104,'failed':0},'deterministicReplay':'PASS','outputHashes':before,'oldEvidenceAndProtectedDatabaseAccountScoringBytes':'UNCHANGED','negativeAdditionalSensitivity':'PRESERVED','newDataAcquisitions':0,'productionActivation':'NOT_AUTHORIZED'}
(O/'S2_CLOSURE_VALIDATION.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n');print(json.dumps(report,indent=2))
