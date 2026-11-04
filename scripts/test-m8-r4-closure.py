import importlib.util
from pathlib import Path
import unittest
from copy import deepcopy
from decimal import Decimal
from lib.r4_rubric_completion import decimal_string,canonical_hash,validate_partial_assessment,challenge_decision,eligibility_reason

spec=importlib.util.spec_from_file_location('r4',Path(__file__).with_name('build-m8-r4-closure.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class R4CompletionTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.cover=m.load(m.OUT/'rubric-coverage.json');cls.rows=cls.cover['rows'];cls.ds=m.load(m.OUT/'dataset-snapshot.json')
  cls.prep=m.load(m.OUT/'reviews/preparation.json');cls.challenge=m.load(m.OUT/'reviews/challenge.json')
  cls.rule=next(r for r in m.rubrics() if r['id']=='RG-UNC')
 def test_exact_690_2490_all_30_23(self):
  self.assertEqual(len(self.rows),690);self.assertEqual(len({r['id'] for r in self.rows}),690)
  self.assertEqual(len(self.cover['topics']),2490)
  for t in {r['ticker'] for r in self.rows}:self.assertEqual(sum(r['ticker']==t for r in self.rows),23)
 def test_actual_four_assessments_686_not_rated(self):
  a=[r for r in self.rows if r['currentAssessment'] is not None]
  self.assertEqual({r['ticker'] for r in a},set(m.ELIGIBLE));self.assertEqual(len(a),4)
  self.assertEqual(sum(r['status']=='NOT_RATED' for r in self.rows),686)
  self.assertTrue(all(r['rubricId']=='RG-UNC' and r['currentPoints']==0 for r in a))
 def test_original_688_and_two_historical_not_renewed(self):
  state=m.load(m.OUT/'current-state.json');self.assertEqual(state['historicalUnrated'],688)
  for r in self.rows:
   if r['ticker'] in ('ACB','VNM') and r['rubricId']=='RG-UNC':
    self.assertEqual(r['historicalAssessment']['points'],0);self.assertIsNone(r['currentPoints']);self.assertFalse(r['historicalAssessment']['acceptedForChangedDataset'])
 def test_all_unrated_have_precise_topic_prerequisites(self):
  for r in self.rows:
   if r['status']=='NOT_RATED':
    self.assertIsNone(r['currentPoints']);self.assertIsNone(r['currentAssessment'])
    self.assertEqual({x['topic'] for x in r['missingOrConflictingEvidence']},set(r['topics']))
    self.assertTrue(all(r['ticker']+'/'+r['rubricId']+'/'+x['topic'] in x['prerequisite'] for x in r['missingOrConflictingEvidence']))
 def test_approved_band_and_topics_unchanged(self):
  for p in self.prep['proposals']:self.assertTrue(validate_partial_assessment(p['assessment'],self.rule))
  a=deepcopy(self.prep['proposals'][0]['assessment']);a['selectedPoints']=1
  with self.assertRaisesRegex(ValueError,'BAND'):validate_partial_assessment(a,self.rule)
  a=deepcopy(self.prep['proposals'][0]['assessment']);a['evidence'].pop()
  with self.assertRaisesRegex(ValueError,'TOPICS'):validate_partial_assessment(a,self.rule)
 def test_source_must_be_ai_not_human(self):
  a=deepcopy(self.prep['proposals'][0]['assessment']);a['source']='HUMAN'
  with self.assertRaisesRegex(ValueError,'AI_ORIGIN'):validate_partial_assessment(a,self.rule)
 def test_missing_files_or_grid_alone_cannot_generate_zero(self):
  a=self.prep['proposals'][0]['assessment']
  with self.assertRaises(ValueError):challenge_decision('FPT',{},a,self.rule)
  f=deepcopy(self.prep['proposals'][0]['economicFindings']);f['grossMarginSourceOperandsVerified']=False
  with self.assertRaisesRegex(ValueError,'ECONOMIC'):challenge_decision('BSR',f,a,self.rule)
 def test_loss_profit_signs_and_segment_parity(self):
  ps={p['ticker']:p['economicFindings'] for p in self.prep['proposals']}
  self.assertLess(Decimal(ps['BSR']['operatingLowVnd']),0);self.assertGreater(Decimal(ps['BSR']['operatingHighVnd']),0)
  self.assertLess(Decimal(ps['VIC']['namedCommonLowVnd']),0);self.assertGreater(Decimal(ps['VIC']['namedCommonHighVnd']),0)
  self.assertGreater(Decimal(ps['VJC']['reportedCommonVnd']),0);self.assertLess(Decimal(ps['VJC']['coreCaseVnd']),0)
  self.assertTrue(ps['VPL']['segmentBridgeMatches']);self.assertGreater(abs(Decimal(ps['VPL']['unallocatedProfitMillion'])),abs(Decimal(ps['VPL']['groupPbtMillion'])))
 def test_challenge_recomputed_and_bound(self):
  self.assertNotEqual(m.sha(m.OUT/'reviews/preparation.json'),m.sha(m.OUT/'reviews/challenge.json'))
  self.assertEqual(self.challenge['preparation']['sha256'],m.sha(m.OUT/'reviews/preparation.json'))
  for p,c in zip(self.prep['proposals'],self.challenge['decisions']):
   self.assertEqual(c['assessmentHash'],canonical_hash(p['assessment']))
   self.assertTrue(all(x['expected']==x['actual'] for x in c['freshEconomicChecks']))
   self.assertFalse(c['decision']['hypotheticalGridWidthAloneUsedAsEvidence'])
 def test_no_fabricated_model_session_or_independence(self):
  for a in [self.prep,self.challenge]:
   self.assertIsNone(a['identity']['preciseRuntimeModelId']);self.assertIsNone(a['identity']['authenticatedSessionId'])
   self.assertFalse(a['identity']['independentHumanReviewClaimed']);self.assertFalse(a['productionScoringAuthorized'])
  p=m.load(m.OUT/'provenance-verification.json');self.assertEqual(p['formalProvenanceVerdict'],'BLOCKED');self.assertFalse(p['trustedServerBindingsAvailable'])
 def test_review_times_do_not_backdate_publication(self):
  for r in self.rows:
   self.assertIsNone(r['publicationIdentity']['publicationAt']);self.assertFalse(r['publicationIdentity']['publicationVerified'])
   if r['currentAssessment']:self.assertLessEqual(r['currentAssessment']['assessedAt'],r['reviewKnownAt'])
 def test_no_formal_or_issuer_acceptance(self):
  self.assertEqual(self.ds['verdict'],'BLOCKED');self.assertEqual(self.ds['counts']['acceptedFullIssuers'],[])
  self.assertEqual(len(self.ds['counts']['deferredFullIssuers']),30)
  self.assertTrue(all(not r['productionScoringReady'] for r in self.rows))
  for key in ['productionScoringAuthorized','sourcePromotion','navAuthorized','tradingAuthorized']:self.assertFalse(self.ds[key])
 def test_all_fifteen_di_gates_remain_honest(self):
  d=m.load(m.OUT/'di-gate-checks.json');self.assertEqual({x['gate'] for x in d['gates']},{'DI'+str(i) for i in range(1,16)})
  self.assertFalse(d['allRequiredGatesAccepted']);self.assertTrue(all(not x['historicalPassCarriedForward'] for x in d['gates']))
 def test_dataset_identity(self):
  d=deepcopy(self.ds);expected=d.pop('contentHash');self.assertEqual(canonical_hash(d),expected)
 def test_manifest_sources_outputs_and_database_unchanged(self):
  manifest=m.load(m.OUT/'manifest.json')
  for path,h in {**manifest['sourcePins'],**manifest['outputs']}.items():self.assertEqual(m.sha(m.ROOT/path),h,path)
  self.assertEqual(m.sha(m.ROOT/'data/vn30.sqlite'),manifest['protectedDatabaseSha256'])
 def test_escalation_has_three_actual_prior_package_evidence(self):
  d=m.load(m.OUT/'blockers.json')
  self.assertEqual(d['actualImplementationDefectsConfirmed'],0)
  for i in d['issues']:
   self.assertEqual(i['status']=='ESCALATED',i['priorReviewCycles']>2)
   self.assertTrue(i['oneConcreteResolutionOrDecision'])
   for p in i['evidence']:self.assertEqual(m.sha(m.ROOT/p['path']),p['sha256'])
 def test_financial_context_is_not_topic_sufficiency(self):
  for r in self.rows:
   self.assertFalse(r['financialEvidenceAvailable']['candidateEvidenceIsTopicQualified'])
   self.assertFalse(r['oldBindingsRenewed'])
   if r['currentAssessment']:self.assertTrue(r['financialEvidenceAvailable']['qualifiedCurrentResearchRefs'])
 def test_finite_lossless_and_no_future_score_inference(self):
  for x in ['NaN','Infinity','-Infinity']:
   with self.assertRaises(ValueError):decimal_string(x)
  with self.assertRaises(ValueError):decimal_string(1.2)
  self.assertTrue(all(r['currentPoints'] is None for r in self.rows if r['rubricId'].startswith('VAL-')))

if __name__=='__main__':unittest.main()
