"""Independent read-back challenge of prepared economics, without authority creation."""
import json,hashlib,unittest
from pathlib import Path
from decimal import Decimal as D
O=Path(__file__).resolve().parent
read=lambda n:json.loads((O/n).read_text())
class EconomicsChallenge(unittest.TestCase):
 def test_all_topics_and_bands(self):
  c=read('ASSESSMENT_CANDIDATES.json');self.assertEqual(len(c['rows']),23);self.assertEqual(sum(len(r['topicAssessments']) for r in c['rows']),83)
  self.assertTrue(all(r['candidateBand'] is not None for r in c['rows']));self.assertTrue(all(r['formalSelectedPoints'] is None and r['humanApprovalReference'] is None for r in c['rows']))
 def test_new_bands_are_explicit_and_below_maximum(self):
  rows={r['rubricId']:r for r in read('ASSESSMENT_CANDIDATES.json')['rows']}
  self.assertEqual([rows[k]['candidatePoints'] for k in ['GQ-INC','CA-DIST','CA-PSV']],[4,0,0]);self.assertFalse(rows['GQ-INC']['maximumPrerequisitesMet'])
 def test_actual_multi_year_capital_and_nopat(self):
  x=read('ECONOMIC_BRIDGES.json')['incrementalBookDiagnostics'];self.assertEqual(len(x),16)
  for r in x:
   self.assertGreater(D(r['deltaBookOperatingCapital']),0);self.assertGreater(D(r['deltaNopat']),0)
   self.assertEqual(sum(map(D,r['capitalComponentDeltaBridge'].values())),D(r['deltaBookOperatingCapital']));self.assertIsNone(r['qualifiedMarginalRoic'])
  self.assertGreater(min(D(r['arithmeticRatioNotCertifiedMarginalRoic']) for r in x),D('.20'))
 def test_ppe_bridge_not_capex_or_incremental_return(self):
  p=read('ECONOMIC_BRIDGES.json')['ppeBridgeFY2025'];self.assertEqual(D(p['netMovement']),D('97917994477'))
  self.assertFalse(p['cwipTransfersAddedToGroupCashCapex']);self.assertFalse(p['intercompanyInjectionAddedToGroupCapex'])
 def test_common_eps_not_group_cash_or_dividend_sum(self):
  x=read('ECONOMIC_BRIDGES.json');eps=x['perShareSeries'];self.assertEqual([r['weightedShares'] for r in eps],['2089955445']*4)
  for r in eps:self.assertLess(abs(D(r['reportedCommonEps'])-D(r['commonAfterFundsVnd'])/D(r['weightedShares'])),D('.000000001'))
  self.assertTrue(all(r['scope']=='CONSOLIDATED_GROUP_NOT_COMMON_FCFE' for r in x['cashDiagnostics']))
 def test_adverse_sensitivities_not_deleted(self):
  x=read('ECONOMIC_BRIDGES.json')['perShareCycleSensitivity'];self.assertEqual(len(x),12)
  self.assertTrue(all(D(r['endpointGrowth'])>0 for r in x if not r['netFinanceAtFY2022Level']))
  self.assertTrue(all(D(r['endpointGrowth'])<0 for r in x if r['netFinanceAtFY2022Level']))
 def test_source_bytes_unchanged(self):
  for p in read('ECONOMIC_BRIDGES.json')['sourcePins']:self.assertEqual(hashlib.sha256(Path(p['path']).read_bytes()).hexdigest(),p['sha256'])
 def test_no_authority_or_membership_fabrication(self):
  x=read('M1_CONFIDENCE_AND_RISK_ASSESSMENT.json');self.assertIsNone(x['stage0']['formalAdoptedOutcome']);self.assertEqual(x['hardVeto']['candidateEngineStatus'],'CLEAR')
  self.assertIn('03Aug',x['stage0']['components'][0]['finding']);self.assertFalse(read('ADOPTION_READINESS.json')['productionActivation'])
if __name__=='__main__':
 suite=unittest.defaultTestLoader.loadTestsFromTestCase(EconomicsChallenge);result=unittest.TextTestRunner(verbosity=2).run(suite)
 (O/'ECONOMIC_CHALLENGE_VALIDATION.json').write_text(json.dumps({'recordedAt':__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'testsRun':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'status':'PASS' if result.wasSuccessful() else 'FAIL','actualAiSessionId':__import__('os').environ.get('CODEX_SESSION_ID'),'independentHumanReviewClaimed':False},indent=2)+'\n')
 raise SystemExit(0 if result.wasSuccessful() else 1)
