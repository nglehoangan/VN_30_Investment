from pathlib import Path
from decimal import Decimal as D
import sys,json,hashlib,subprocess,unittest,os
sys.dont_write_bytecode=True
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
read=lambda n:json.loads((O/n).read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
subprocess.run(['python3',str(O/'finalize.py')],cwd=R,check=True)
j=read('FINAL_S2_CALCULATIONS.json');a=read('S2_FINAL_ACCEPTANCE.json');m=read('S2_M3_CONTRACT_REVIEW.json');pins=read('FINAL_SOURCE_PINS.json')
class FinalTests(unittest.TestCase):
 def test_anchored_deposit_buffer(self):self.assertEqual(j['rangeSelection']['termDepositBuffer']['amountVnd'],'2180000000000')
 def test_commitments_not_certified_by_model(self):self.assertIsNone(j['rangeSelection']['actualRemainingContracts']);self.assertIsNone(j['rangeSelection']['actualRestrictionAmount'])
 def test_no_75_percent_gate(self):self.assertFalse(any('0.75'==x.get('termInvestmentAccessFractionAssumed') for x in j['scenarios']))
 def test_no_2x_commitment_as_fact(self):self.assertNotIn('assumedAllowanceMultiple',j['scenarios'][0]);self.assertIn('not proof',j['rangeSelection']['investmentBudget']['role'])
 def test_all_current_cash_preserved_endpoint(self):self.assertEqual(j['rangeSelection']['cashBuffer']['rangeVnd'],['0','2286769972647'])
 def test_actual_minimum_cash_not_invented(self):self.assertIsNone(j['sensitivityBoundary']['actualRequiredOperatingCashBuffer'])
 def test_all24_cases_retained(self):self.assertEqual(len(j['scenarios']),24)
 def test_future_positive_cfo_never_guaranteed(self):self.assertTrue(all(x['positiveFutureCfoCreditVnd']=='0' for x in j['scenarios']))
 def test_negative_cfo_need_kept(self):self.assertGreater(D(j['worstOriginalCutoff']['negativeOperatingCashNeedVnd']),0)
 def test_q3_worst_passes(self):self.assertGreater(D(j['worstQ3']['surplusVnd']),0)
 def test_original_cutoff_not_shifted(self):self.assertEqual(a['originalCutoff'],'2026-10-30');self.assertEqual(a['status'],'BLOCKING');self.assertTrue(a['q3OnlyAssessment']['notSubstitutedForOriginalCutoff'])
 def test_dividend_overlay_exact_once(self):self.assertEqual(D(j['worstQ3']['surplusVnd'])-D(j['worstOriginalCutoff']['surplusVnd']),D('5224888612500'))
 def test_accrued_interest_not_omitted(self):self.assertEqual(j['worstOriginalCutoff']['existingBorrowingAccrualVnd'],'109677386717')
 def test_cash_release_boundary(self):self.assertEqual(D(j['sensitivityBoundary']['extraAccessibleFundingOrCashReleaseNeededVnd']),-D(j['worstOriginalCutoff']['surplusVnd']))
 def test_worst_is_min_not_selected_case(self):
  xs=[D(x['surplusVnd']) for x in j['scenarios'] if x['asOfPurpose']=='2026_10_30_DECLARED_DIVIDEND_OVERLAY'];self.assertEqual(D(j['worstOriginalCutoff']['surplusVnd']),min(xs))
 def test_only_one_economic_blocker(self):self.assertEqual(len(a['economicBlockers']),1);self.assertEqual(a['economicBlockers'][0]['id'],'S2_POST_DECLARATION_CASH_BUFFER_DEPENDENCE')
 def test_no_private_data_request(self):self.assertEqual(a['mandatoryPrivateDocumentRequests'],[]);self.assertFalse(a['newUserDocumentsRequired'])
 def test_all_mandatory_contract_sections(self):self.assertEqual(len(m['rows']),7);self.assertFalse(m['policyChanged'])
 def test_optional_nr_not_separate_blockers(self):self.assertEqual(sum(bool(x['blocksS2Alone']) for x in m['rows']),1)
 def test_no_points_or_fact_promotion(self):self.assertTrue(all(x is None for x in m['rubricPoints'].values()));self.assertFalse(a['formalFactAdmission'] or a['VNM17Promoted'] or a['fullVnmScoringReady'])
 def test_s1_stays_closed(self):self.assertEqual(a['S1'],'CLOSED_UNCHANGED')
r=unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(FinalTests));assert r.wasSuccessful()
assert all(sha(R/x['path'])==x['sha256'] for group in pins.values() for x in group)
acc=read('PARENT_Q3_ACCRUAL_SELECTED.json');assert '109.677.386.717' in acc['text'];assert sha(R/acc['pdfPath'])==acc['pdfSha256']
# Verify newly used budget cash amount, captions/year/source identities reused without reacquisition.
f=read('PARENT_Q3_SELECTED_FLOWS.json');pg=next(x for x in f['pages'] if x['physicalPage']==12);assert '804.486.060.805' in pg['text'];assert sha(R/f['pdfPath'])==f['pdfSha256']
notes=json.loads((R/'data/manual-extracted-pdf/notes/VNM.json').read_text());assert all(t in notes['documents'][1]['pages'][27]['text'] for t in ['18.560.000.000.000','16.380.000.000.000']);assert '1.029.529.085.769' in notes['documents'][1]['pages'][10]['text'];assert '135.806.785.351' in notes['documents'][1]['pages'][43]['text']
outputs=['FINAL_S2_CALCULATIONS.json','S2_M3_CONTRACT_REVIEW.json','S2_FINAL_ACCEPTANCE.json','FINAL_S2_REVIEW.md','CURRENT_BLOCKER_REGISTER_FINAL.md','FINAL_SOURCE_PINS.json'];before={x:sha(O/x) for x in outputs};subprocess.run(['python3',str(O/'finalize.py')],cwd=R,check=True);assert before=={x:sha(O/x) for x in outputs}
env={**os.environ,'PATH':'/private/tmp/node-v22.23.2-darwin-arm64/bin:'+os.environ['PATH']}
config='docs/fundamental-data-engine/vnm-s2-liquidity/2026-11-13/vitest.config.mjs'
subprocess.run([str(R/'node_modules/.bin/vitest'),'run','--config',config,'--reporter=json','--outputFile=/private/tmp/vnm-s2-final-m3.json'],cwd=R,env=env,check=True,stdout=subprocess.DEVNULL)
t=json.loads(Path('/private/tmp/vnm-s2-final-m3.json').read_text());assert t['numPassedTests']==104 and t['numFailedTests']==0
assert all(sha(R/x['path'])==x['sha256'] for group in pins.values() for x in group)
report={'result':'PASS','S2AtOriginalCutoff':a['status'],'pythonTests':{'passed':r.testsRun,'failed':0},'typeScriptTests':{'passed':104,'failed':0},'sourceIdentityAndNativeValues':'PASS','deterministicReplay':'PASS','outputHashes':before,'protectedSourceDatabaseAccountScoringBytes':'UNCHANGED','newDataAcquisitions':0,'formalFactAdmissions':0,'productionActivation':'NOT_AUTHORIZED','meaning':'Tests validate model/source/acceptance discipline. They do not turn scenario allowances into contractual bounds or close a failing original-cutoff range.'}
(O/'FINAL_VALIDATION.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n');print(json.dumps(report,indent=2))
