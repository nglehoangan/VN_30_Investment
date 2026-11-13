from pathlib import Path
import sys,json,hashlib,subprocess,unittest,copy
sys.dont_write_bytecode=True
from acceptance import decide
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
A=R/'docs/fundamental-data-engine/vnm-s1-economic-returns/2026-11-13'
B=R/'docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13'
# Actual source/arithmetic and unchanged M3 suites, no network or database writes.
for p in [A,B]:subprocess.run(['python3',str(p/'validate.py')],cwd=R,check=True)
subprocess.run(['python3',str(O/'build.py')],cwd=R,check=True)
c=read(O/'S1_ACCEPTANCE.json'); rows=c['requirements']
class AcceptanceTests(unittest.TestCase):
 def test_supported_acceptance(self):self.assertEqual(decide(rows,validation_passed=True),'CLOSED')
 def test_missing_capital_cost(self):self.assertEqual(decide([r for r in rows if r['id']!='CAPITAL_COST'],validation_passed=True),'BLOCKING')
 def test_missing_current_review(self):self.assertEqual(decide([r for r in rows if r['id']!='CURRENT_UPDATE'],validation_passed=True),'BLOCKING')
 def test_unverified_validation(self):self.assertEqual(decide(rows,validation_passed=False),'BLOCKING')
 def test_contradiction(self):self.assertEqual(decide(rows,validation_passed=True,material_contradiction=True),'BLOCKING')
 def test_optional_incremental_nr(self):self.assertEqual(next(r for r in rows if r['id']=='INCREMENTAL_COMPARABILITY')['result'],'N_R_PERMITTED')
 def test_nr_not_allowed_for_missing_wacc(self):
  bad=copy.deepcopy(rows);next(r for r in bad if r['id']=='CAPITAL_COST')['result']='N_R_PERMITTED';self.assertEqual(decide(bad,validation_passed=True),'BLOCKING')
 def test_no_authority_or_score_promotion(self):
  self.assertFalse(c['formalSourceAdmissionGranted'] or c['VNM17Promoted'] or c['fullVNMScoringReady']);self.assertTrue(all(x is None for x in c['rubricScores'].values()))
 def test_duplicate(self):self.assertEqual(decide(rows+[rows[0]],validation_passed=True),'BLOCKING')
 def test_no_evidence(self):
  bad=copy.deepcopy(rows);bad[0]['evidence']=None;self.assertEqual(decide(bad,validation_passed=True),'BLOCKING')
suite=unittest.defaultTestLoader.loadTestsFromTestCase(AcceptanceTests); result=unittest.TextTestRunner().run(suite)
assert result.wasSuccessful()
assert c['status']==decide(rows,validation_passed=True)=='CLOSED'
p=read(O/'SOURCE_PINS.json')
assert all(sha(R/x['path'])==x['sha256'] for group in p.values() for x in group)
outputs=['S1_ACCEPTANCE.json','S1_CLOSURE.md','S1_S5_CURRENT_RECONCILIATION.md','CURRENT_BLOCKER_REGISTER.md','SOURCE_PINS.json']
before={n:sha(O/n) for n in outputs}
subprocess.run(['python3',str(O/'build.py')],cwd=R,check=True)
assert before=={n:sha(O/n) for n in outputs}
assert '| S1 | CLOSED |' in (O/'S1_S5_CURRENT_RECONCILIATION.md').read_text()
assert '## ECONOMICS' not in (O/'CURRENT_BLOCKER_REGISTER.md').read_text()
assert (O/'CURRENT_BLOCKER_REGISTER.md').read_text().count('## ')==6 # five groups plus observed execution
assert all(sha(R/x['path'])==x['sha256'] for x in p['protected'])
report={'result':'PASS','S1':'CLOSED','acceptanceTests':result.testsRun,'upstreamValidation':[{'path':str(x.relative_to(R)/'VALIDATION.json'),'sha256':sha(x/'VALIDATION.json'),'result':read(x/'VALIDATION.json')['result']} for x in [A,B]],'deterministicReplay':'PASS','outputHashes':before,'sourcePolicyScriptIntegrity':'PASS','protectedDatabaseAccountAndScoringBytes':'UNCHANGED','scoreWritten':False,'formalAdmissionGranted':False,'productionActivation':'NOT_AUTHORIZED'}
(O/'VALIDATION.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n')
print(json.dumps(report,indent=2))
