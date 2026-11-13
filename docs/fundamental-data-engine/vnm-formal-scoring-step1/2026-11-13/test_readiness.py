from pathlib import Path
import json,copy,unittest
from decimal import Decimal
from assessment_validation import validate_candidate
O=Path(__file__).parent;R=O.resolve().parents[3]
read=lambda p:json.loads(p.read_text())
C=read(O/'VNM_ASSESSMENT_CANDIDATES.json');G=read(O/'VNM_CONFIDENCE_AND_RISK_GATES.json');A=read(O/'VNM_STEP1_ACCEPTANCE.json')
RUBRICS=json.loads((R/'src/domain/scoring/methodology.ts').read_text().split('deepFreeze(')[1].split(');')[0])
class Readiness(unittest.TestCase):
 def reject(self,mutate):
  x=copy.deepcopy(C);mutate(x)
  with self.assertRaises(ValueError):validate_candidate(x,RUBRICS)
 def test_actual_coverage(self):self.assertEqual(validate_candidate(C,RUBRICS),{'rubrics':23,'topics':83,'supported':19})
 def test_missing_rubric(self):self.reject(lambda x:x['rows'].pop())
 def test_duplicate_rubric(self):self.reject(lambda x:x['rows'].__setitem__(1,copy.deepcopy(x['rows'][0])))
 def test_missing_topic(self):self.reject(lambda x:x['rows'][0]['topicAssessments'].pop())
 def test_unknown_evidence(self):self.reject(lambda x:x['rows'][0]['topicAssessments'][0].update(evidenceRefs=['fake']))
 def test_missing_not_zero(self):
  def change(x):
   a=next(a for a in x['rows'] if a['rubricId']=='GQ-INC');a['candidatePoints']=0
  self.reject(change)
 def test_fake_human(self):self.reject(lambda x:x['rows'][0].update(humanAnalyst='Invented analyst'))
 def test_fake_approval(self):self.reject(lambda x:x['rows'][0].update(humanApprovalReference='fake'))
 def test_fake_trust(self):self.reject(lambda x:x['rows'][0].update(trustedAiProductionReviewBinding='fake'))
 def test_unapproved_point(self):self.reject(lambda x:x['rows'][0].update(formalSelectedPoints=5))
 def test_bad_band(self):self.reject(lambda x:x['rows'][0]['candidateBand'].update(label='Made up'))
 def test_wrong_points(self):self.reject(lambda x:x['rows'][0].update(candidatePoints=8))
 def test_cross_ticker(self):self.reject(lambda x:x.update(ticker='FPT'))
 def test_shared_channel(self):self.reject(lambda x:x['rows'][1].update(economicChannel=x['rows'][0]['economicChannel']))
 def test_no_total(self):self.reject(lambda x:x.update(totalScore=50))
 def test_max_requires_justification(self):
  def change(x):next(a for a in x['rows'] if a['rubricId']=='CA-DIL')['exceptionalJustification']=None
  self.reject(change)
 def test_five_actual_dimensions(self):self.assertEqual([d['dimension'] for d in G['confidenceReview']],['Freshness','Completeness','Source reliability','Estimate dependence','Model / cycle uncertainty'])
 def test_low_not_haircut(self):self.assertEqual(G['overallCandidateConfidence'],'LOW');self.assertIsNone(A['totalScore'])
 def test_new_band_reconciliation(self):self.assertEqual(A['previouslyUnselectedBands'],14);self.assertEqual(len(A['newSupportedBandProposals']),10);self.assertEqual(len(A['remainingMaterialEvidenceBlockedRubrics']),4)
 def test_return_band_matches_model(self):
  r=Decimal(read(R/'docs/fundamental-data-engine/vnm-s5-closure/2026-11-13/S5_EXPECTED_RETURN.json')['selectedConservativeBaseReturn']);self.assertLess(r,Decimal('.08'));self.assertEqual(next(a for a in C['rows'] if a['rubricId']=='VAL-RET')['candidateBand']['label'],'Below 8%')
 def test_mos_nr_not_numeric_fallback(self):self.assertIsNone(read(R/'docs/fundamental-data-engine/vnm-s5-closure/2026-11-13/S5_EXPECTED_RETURN.json')['decisionGradePointMarginOfSafety'])
 def test_external_gates_not_adopted(self):self.assertIsNone(G['stage0']['formalAdoptedOutcome']);self.assertIsNone(G['hardVeto']['formalAdoptedStatus']);self.assertIsNone(G['residualRisk']['formalAdoptedStatus'])
 def test_no_step2(self):self.assertFalse(A['step2Executed']);self.assertFalse(A['datasetBindingPerformed']);self.assertFalse(A['productionScoringExecuted'])
 def test_all_authorization_pending(self):self.assertTrue(all('AUTHORIZATION_PENDING' in a['readinessStates'] for a in C['rows']))
if __name__=='__main__':unittest.main()
