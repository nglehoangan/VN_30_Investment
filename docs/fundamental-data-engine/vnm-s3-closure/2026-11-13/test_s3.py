from pathlib import Path
import json,copy,unittest,sys
from decimal import Decimal as D
sys.dont_write_bytecode=True
from acceptance import decide
O=Path(__file__).resolve().parent
class S3Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.m=json.loads((O/'S3_EVIDENCE_MATRIX.json').read_text());cls.a=json.loads((O/'S3_IC_POS_ASSESSMENT.json').read_text())
 def call(self,m=None,a=None,**kw):return decide(m or self.m,a or self.a,sources_verified=kw.pop('sources_verified',True),validation_passed=kw.pop('validation_passed',True),**kw)
 def test_supported_research_closes(self):self.assertEqual(self.call(),'CLOSED')
 def test_missing_topic_blocks(self):
  a=copy.deepcopy(self.a);a['mandatoryTopicAssessments'].pop();self.assertEqual(self.call(a=a),'BLOCKING')
 def test_missing_counterevidence_blocks(self):
  a=copy.deepcopy(self.a);a['mandatoryTopicAssessments'][0]['counterEvidence']=[];self.assertEqual(self.call(a=a),'BLOCKING')
 def test_fabricated_ref_blocks(self):
  a=copy.deepcopy(self.a);a['mandatoryTopicAssessments'][1]['positiveEvidence']=['FAKE'];self.assertEqual(self.call(a=a),'BLOCKING')
 def test_changed_source_blocks(self):self.assertEqual(self.call(sources_verified=False),'BLOCKING')
 def test_missing_validation_blocks(self):self.assertEqual(self.call(validation_passed=False),'BLOCKING')
 def test_material_contradiction_blocks(self):self.assertEqual(self.call(unresolved_material_contradiction=True),'BLOCKING')
 def test_household_reach_not_sales_share(self):
  m=copy.deepcopy(self.m);next(x for x in m['evidence'] if x['id']=='E03')['definition']['marketShareEligible']=True;self.assertEqual(self.call(m=m),'BLOCKING')
 def test_industry_change_not_share_gain(self):
  a=copy.deepcopy(self.a);a['mandatoryTopicAssessments'][0]['substitution']['shareGainCalculated']=True;self.assertEqual(self.call(a=a),'BLOCKING')
 def test_no_peer_percentile_invented(self):
  a=copy.deepcopy(self.a);a['mandatoryTopicAssessments'][1]['substitution']['peerPercentile']='0.9';self.assertEqual(self.call(a=a),'BLOCKING')
 def test_no_lowest_cost_inferred(self):
  a=copy.deepcopy(self.a);a['mandatoryTopicAssessments'][1]['substitution']['relativeCompetitorUnitCost']='LOWEST';self.assertEqual(self.call(a=a),'BLOCKING')
 def test_no_formal_points_without_authority(self):
  a=copy.deepcopy(self.a);a['formalPoints']=3;self.assertEqual(self.call(a=a),'BLOCKING')
 def test_no_formal_band_by_research(self):
  a=copy.deepcopy(self.a);a['researchScoringBand']='STRONG_TOP_TIER';self.assertEqual(self.call(a=a),'BLOCKING')
 def test_no_pending_fact_promotion(self):
  a=copy.deepcopy(self.a);a['VNM17Promoted']=True;self.assertEqual(self.call(a=a),'BLOCKING')
 def test_four_epistemic_classes_present(self):self.assertEqual({x['classification'] for x in self.m['evidence']},{'FACT','ESTIMATE','ASSUMPTION','ANALYST_JUDGMENT'})
 def test_narrative_not_independent_panel(self):self.assertIn('issuer',next(x for x in self.m['evidence'] if x['id']=='E03')['claim'].lower());self.assertIn('not independently',next(x for x in self.m['evidence'] if x['id']=='E02')['claim'])
 def test_duplicate_evidence_blocks(self):
  m=copy.deepcopy(self.m);m['evidence'].append(m['evidence'][0]);self.assertEqual(self.call(m=m),'BLOCKING')
 def test_annual_ratios_exact_replay(self):
  for x in self.m['annualMetrics']:self.assertEqual(D(x['grossMargin']).quantize(D('.0000000001')),(D(x['grossProfitVnd'])/D(x['revenueVnd'])).quantize(D('.0000000001')))
 def test_annual_interim_not_spliced(self):self.assertEqual(len(self.m['annualMetrics']),4);self.assertTrue(all(x['months']==9 for x in self.m['interimMetrics']))
 def test_all_five_requested_dimensions(self):self.assertEqual(len(self.m['dimensionCoverage']),5);self.assertTrue(all(self.m['dimensionCoverage'].values()));self.assertEqual(len(self.a['mandatoryContract']['documentCriteriaEvidence']),7)
 def test_invalidation_required(self):
  a=copy.deepcopy(self.a);a['mandatoryTopicAssessments'][2]['invalidation']=[];self.assertEqual(self.call(a=a),'BLOCKING')
if __name__=='__main__':unittest.main()
