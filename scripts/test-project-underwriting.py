#!/usr/bin/env python3
import unittest,json,hashlib
from pathlib import Path
from lib.project_underwriting import project_rnav,segment_reconcile,sotp
P=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/acceptance-remediation-v1')
def fixture():return dict(id='synthetic',asOf='2025-12-31',scope='PROJECT_100_PERCENT',ownership='.5',discount='.1',cashFlows=[dict(id='sale',year=1,value='110',afterTaxUnlevered=True)],debt='20',interestIncluded=False,legalEvidence=['synthetic-legal'],sourceReferences=['synthetic-source'])
class Models(unittest.TestCase):
 def test_rnav_unlevered_debt_then_ownership(self):self.assertEqual(project_rnav(fixture())['attributableEquityValue'],'40')
 def test_negative_equity_not_zero_floored(self):
  p=fixture();p['debt']='120';self.assertEqual(project_rnav(p)['attributableEquityValue'],'-10')
 def test_missing_project_inputs_block(self):
  for k in ['ownership','cashFlows','legalEvidence','debt']:
   p=fixture();p[k]=None
   with self.subTest(k=k),self.assertRaises(ValueError):project_rnav(p)
 def test_interest_and_debt_not_twice(self):
  p=fixture();p['interestIncluded']=True
  with self.assertRaises(ValueError):project_rnav(p)
 def test_duplicate_cashflow(self):
  p=fixture();p['cashFlows']*=2
  with self.assertRaises(ValueError):project_rnav(p)
 def test_fractional_year_or_untaxed_cash_blocks(self):
  for key,value in [('year',1.5),('afterTaxUnlevered',False)]:
   p=fixture();p['cashFlows'][0][key]=value
   with self.subTest(key=key),self.assertRaises(ValueError):project_rnav(p)
 def test_sotp_common_equity_and_corporate_claim(self):
  c=dict(id='hotel',asOf='2025-12-31',basis='ATTRIBUTABLE_COMMON_EQUITY',value='100',sourceReferences=['synthetic'],consumedClaimIds=['hotel-debt'])
  self.assertEqual(sotp([c],[dict(id='corporate',asOf='2025-12-31',value='-20',sourceReferences=['synthetic'])])['conditionalEquityValue'],'80')
  with self.assertRaises(ValueError):sotp([c],[dict(id='hotel-debt',asOf='2025-12-31',value='-20',sourceReferences=['synthetic'])])
 def test_sotp_mixed_cutoff_blocks(self):
  c=dict(id='hotel',asOf='2025-12-31',basis='ATTRIBUTABLE_COMMON_EQUITY',value='100',sourceReferences=['synthetic'],consumedClaimIds=[])
  with self.assertRaises(ValueError):sotp([c],[dict(id='corporate',asOf='2026-06-30',value='-20',sourceReferences=['synthetic'])])
 def test_enterprise_component_cannot_masquerade_as_equity(self):
  with self.assertRaises(ValueError):sotp([dict(id='a',basis='ENTERPRISE',value='100',sourceReferences=['synthetic'],consumedClaimIds=[])],[])
 def test_vpl_actual_segments_reconcile(self):
  d=json.loads((P/'VPL-segment-inputs.json').read_text());r=segment_reconcile(d['segments'],d['unallocated'],d['consolidated'])
  self.assertEqual(set(r['differences'].values()),{'0'});self.assertIsNone(r['hotelEbitda']);self.assertIsNone(r['acceptedSotp'])
 def test_vpl_mismatch_blocks(self):
  d=json.loads((P/'VPL-segment-inputs.json').read_text());d['segments'][0]['assets']='44022374'
  with self.assertRaises(ValueError):segment_reconcile(d['segments'],d['unallocated'],d['consolidated'])
 def test_segment_cutoff_mismatch_blocks(self):
  d=json.loads((P/'VPL-segment-inputs.json').read_text());d['segments'][0]['asOf']='2026-09-30'
  with self.assertRaises(ValueError):segment_reconcile(d['segments'],d['unallocated'],d['consolidated'])
 def test_vhm_project_pool_not_invented_allocations(self):
  d=json.loads((P/'VHM-rnav-inputs.json').read_text());self.assertEqual(len(d['projects']),8);self.assertFalse(d['projectUniverseComplete'])
  self.assertTrue(all(p['projectRnav'] is None and p['projectOwnership'] is None for p in d['projects']));self.assertIsNone(d['acceptedEquityValue'])
 def test_all_rubrics_topics_without_automatic_score(self):
  d=json.loads((P/'topic-review-worklist.json').read_text());self.assertEqual(len(d['rubrics']),690);self.assertEqual(len(d['topics']),2490)
  self.assertEqual(sum(r['retainedHistoricalPoints'] is None for r in d['rubrics']),688)
  self.assertTrue(all(not r['currentReadyForScoring'] for r in d['rubrics']))
 def test_checked_topic_findings_link_actual_components(self):
  d=json.loads((P/'reviewed-topic-findings.json').read_text());self.assertEqual(len(d['findings']),8)
  work=json.loads((P/'topic-review-worklist.json').read_text())
  for f in d['findings']:
   b=(P/f['evidenceComponent']).read_bytes();self.assertEqual(hashlib.sha256(b).hexdigest(),f['evidenceComponentSha256'])
   target=json.loads(b)
   for key in f['pointer'].split('/')[1:]:target=target[int(key)] if isinstance(target,list) else target[key]
   self.assertFalse(f['acceptedTopicEvidence']);self.assertTrue(f['counterArgument'])
   self.assertEqual(sum(f['id'] in t['checkedFindingIds'] for t in work['topics']),1)
 def test_stale_bindings_excluded_not_renewed(self):
  d=json.loads((P/'binding-dispositions.json').read_text());self.assertEqual(len(d['bindings']),1780)
  self.assertTrue(all(b['replacementBinding'] is None and not b['renewalAuthorized'] for b in d['bindings']))
 def test_inputs_and_sources_pinned(self):
  d=json.loads((P/'manifest.json').read_text())
  for c in d['components']:self.assertEqual(hashlib.sha256((P/c['path']).read_bytes()).hexdigest(),c['sha256'])
  for p,h in d['sourcePins'].items():self.assertEqual(hashlib.sha256(Path(p).read_bytes()).hexdigest(),h)
 def test_challenge_rejects_pooled_vpl_and_missing_rnav(self):
  d=json.loads((P/'model-challenge.json').read_text());r={x['ticker']:x for x in d['models']};self.assertEqual(len(r),13)
  self.assertEqual(r['VHM']['verdict'],'PRIMARY_MODEL_BLOCKED');self.assertEqual(r['VPL']['verdict'],'POOLED_MODEL_REJECTED_FOR_ACCEPTANCE')
 def test_all15_di_gates_preserved_without_pass_claims(self):
  d=json.loads((P/'di-provenance-readiness.json').read_text());self.assertEqual(d['requiredDiGates'],['DI'+str(i) for i in range(1,16)])
  self.assertTrue(all(g['acceptedEvidenceReference'] is None and g['status']!='PASS' for g in d['gateDispositions']))
 def test_di_hash_is_not_session_authority(self):
  d=json.loads((P/'di-provenance-readiness.json').read_text());self.assertFalse(d['contentHashIsSessionAuthentication']);self.assertIsNone(d['trustedPreparationArtifact']);self.assertFalse(d['productionScoringAuthorized'])
if __name__=='__main__':unittest.main()
