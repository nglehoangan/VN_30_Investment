import json,hashlib,subprocess,sys,unittest
from pathlib import Path
from decimal import Decimal as D
sys.dont_write_bytecode=True
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda n:json.loads((O/n).read_text())
subprocess.run(['python3',str(O/'build.py')],cwd=R,check=True)
j=read('S2_PUBLIC_DISCLOSURE_CALCULATIONS.json');a=read('S2_ACCEPTANCE_SUCCESSOR.json')
class PublicDisclosureTests(unittest.TestCase):
 def test_private_data_not_required(self):self.assertFalse(j['privateContractDataMandatory']);self.assertEqual(a['mandatoryPrivateDataRequests'],[])
 def test_parent_only(self):self.assertEqual(j['scope'],'STANDALONE');self.assertEqual(j['reportedInputsVnd']['shortDebt'],'8258858000000')
 def test_cfo_not_group(self):self.assertEqual(D(j['historicalCfoTTMVnd']),D('7690701645261')+D('6403516361118')-D('6008806696051'))
 def test_latest_cash(self):self.assertEqual(j['reportedInputsVnd']['cash'],'2286769972647')
 def test_disclosed_investments_not_certified_unrestricted(self):self.assertFalse(j['staticReportedIndicators']['unrestrictedCoverageCertified']);self.assertTrue(all(not x['actualDepositAccessVerified'] for x in j['scenarios']))
 def test_current_commitments_not_invented(self):self.assertIsNone(j['referenceAllowance']['actualRemainingCurrentVnd']);self.assertTrue(all(not x['actualCommitmentRemainingVerified'] for x in j['scenarios']))
 def test_full_access_not_automatic_closure(self):
  h=j['headlineStressWithAllowance2x'];self.assertTrue(next(x for x in h if x['termInvestmentAccessFractionAssumed']=='1')['coversUnderAssumptions']);self.assertFalse(j['formalS2ClosureGranted'])
 def test_reduced_access_failure_retained(self):self.assertFalse(next(x for x in j['headlineStressWithAllowance2x'] if x['termInvestmentAccessFractionAssumed']=='0.75')['coversUnderAssumptions'])
 def test_reserve_higher_reduces_surplus(self):
  z=[x for x in j['scenarios'] if x['case']=='STRESS_25' and x['termInvestmentAccessFractionAssumed']=='1'];self.assertGreater(D(z[0]['surplusVnd']),D(z[-1]['surplusVnd']))
 def test_all_matrix_cases(self):self.assertEqual(len(j['scenarios']),36)
 def test_no_dividend_backdate(self):self.assertFalse(j['separateDividendOverlay']['includedInSep30Liabilities'])
 def test_no_score_or_authority_change(self):self.assertIsNone(j['fullScore']);self.assertFalse(j['VNM17Promoted']);self.assertEqual(j['S1'],'CLOSED_UNCHANGED')
r=unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(PublicDisclosureTests));assert r.wasSuccessful()
pins=read('SOURCE_PINS.json');assert all(sha(R/x['path'])==x['sha256'] for group in pins.values() for x in group)
for x in j['newFlowNativeLocators']:
 pages=read('PARENT_Q3_SELECTED_FLOWS.json')['pages'];pg=next(p for p in pages if p['physicalPage']==x['physicalPage'])
 for m in x['matches']:assert pg['lines'][m['lineIndex']]['text']==m['text']
outputs=['S2_PUBLIC_DISCLOSURE_CALCULATIONS.json','S2_ACCEPTANCE_SUCCESSOR.json','PUBLIC_DISCLOSURE_METHOD.md','CURRENT_BLOCKER_REGISTER.md','SOURCE_PINS.json'];before={n:sha(O/n) for n in outputs};subprocess.run(['python3',str(O/'build.py')],cwd=R,check=True);assert before=={n:sha(O/n) for n in outputs};assert all(sha(R/x['path'])==x['sha256'] for x in pins['protected'])
report={'result':'PASS','tests':{'passed':r.testsRun,'failed':0},'sourceAndNativeLocatorIntegrity':'PASS','deterministicReplay':'PASS','outputHashes':before,'protectedDatabaseAccountScoringBytes':'UNCHANGED','formalS2ClosureGranted':False,'privateDataMandatory':False,'newSourceAuthority':False,'productionActivation':'NOT_AUTHORIZED','scope':'Method/source arithmetic guards. Passing tests do not establish actual deposit access or current commitments.'};(O/'VALIDATION.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n');print(json.dumps(report,indent=2))
