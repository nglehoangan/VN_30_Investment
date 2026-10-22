"""Adversarial validation of PE3 source, normalization and anti-lookahead boundaries."""
from pathlib import Path
from copy import deepcopy
import unittest,datetime
from lib.pe2_evidence import load,boundary,knowledge_assessment,REQUIRED_CLOCKS
from lib.pe3_evidence import replay,validate_mapping
R=Path(__file__).resolve().parents[1];P=R/'docs/fundamental-data-engine/evidence/2026-10-22-primary-publication-evidence-pe3'
M=load(P/'SOURCE_CELL_MAPPING_REVIEW.json')['mappings'];F=load(P/'CANONICAL_OBLIGATION_INPUTS.json');C=load(P/'SOURCE_CELL_TRANSCRIPTION.json')['obligationCells'];B=load(P.parent/'2026-10-22-primary-publication-evidence-pe2/SOURCE_BINDING_CANDIDATES.json')['candidates']
class Validation(unittest.TestCase):
 def context(self,i=140):
  m=deepcopy(next(x for x in M if x['obligationIndex']==i));f=deepcopy(next(x for x in F if x['obligationIndex']==i));c=deepcopy([x for x in C if x['obligationIndex']==i]);b=deepcopy(next(x['body'] for x in B if x['body']['disclosureId']==m['disclosureId']));return m,f,c,b
 def test_full_replay(self):self.assertEqual(replay(R,P)['mappingReceipts'],45)
 def test_all_45_arithmetic_and_source_bindings(self):
  for m in M:
   with self.subTest(obligation=m['obligationIndex']):self.assertTrue(validate_mapping(*self.context(m['obligationIndex'])))
 def rejects(self,mutate,i=140):
  m,f,c,b=self.context(i);mutate(m,f,c,b)
  with self.assertRaises(ValueError):validate_mapping(m,f,c,b)
 def test_canonical_value_replacement(self):self.rejects(lambda m,f,c,b:m.update(canonicalValuePreserved='0'))
 def test_canonical_concept_replacement(self):self.rejects(lambda m,f,c,b:m.update(canonicalConcept='TOTAL_EQUITY'))
 def test_period_shift(self):self.rejects(lambda m,f,c,b:m['period'].update(end='2025-06-30'))
 def test_scope_shift(self):self.rejects(lambda m,f,c,b:m.update(scope='SEPARATE'))
 def test_document_replacement(self):self.rejects(lambda m,f,c,b:m['sourceCells'][0].update(documentSha256='0'*64))
 def test_wrong_column(self):self.rejects(lambda m,f,c,b:m['sourceCells'][0].update(column='PRIOR'))
 def test_wrong_unit(self):self.rejects(lambda m,f,c,b:m['sourceCells'][0].update(nativeUnit='VND'))
 def test_wrong_factor(self):self.rejects(lambda m,f,c,b:m['normalization'].update(factor='1'))
 def test_wrong_sign(self):self.rejects(lambda m,f,c,b:m['normalization'].update(signConvention='PRESERVE'),99)
 def test_capex_positive_reported_amount(self):
  def change(m,f,c,b):
   for x in [m['sourceCells'][0],c[0]]:x['reportedValue']=x['reportedValue'].lstrip('-')
  self.rejects(change,99)
 def test_duplicate_occurrence_identity(self):
  def change(m,f,c,b):
   m['sourceCells'][1]['cellId']=m['sourceCells'][0]['cellId'];c[1]['cellId']=c[0]['cellId']
  self.rejects(change,97)
 def test_unresolved_digit_cannot_promote(self):self.rejects(lambda m,f,c,b:m.update(classification='VERIFIED_WITH_LIMITATIONS'),105)
 def test_unreproducible_cannot_verify(self):self.rejects(lambda m,f,c,b:m.update(classification='VERIFIED'),100)
 def test_vnm_h1_column_not_q2(self):
  m,f,c,b=self.context(183);self.assertEqual(c[0]['columnOccurrence'],3)
 def test_vjc_four_occurrence_operands(self):
  m,f,c,b=self.context(97);self.assertEqual([(x['rowCode'],x['occurrence']) for x in c],[('321',1),('321',2),('339',1),('339',2)])
 def test_ssb_reserve_is_positive_closing_stock(self):
  m,f,c,b=self.context(47);self.assertEqual(c[0]['physicalPage'],40);self.assertEqual(c[0]['reportedValue'],'3797033');self.assertEqual(m['normalization']['factor'],'1000000')
 def test_d2_calendar_boundaries(self):
  for day,want in [('2024-02-28','2024-02-28T17:00:00.000Z'),('2024-02-29','2024-02-29T17:00:00.000Z'),('2026-12-31','2026-12-31T17:00:00.000Z')]:self.assertEqual(boundary(day),want)
 def fixture(self):
  clock='2026-10-22T09:00:00Z';clocks={k:clock for k in REQUIRED_CLOCKS};clocks['otherRequiredContractBoundaries']=[];cut={'systemKnownAt':clock,'decisionAsOf':clock,'assessedAt':clock};a={k:{'governanceStatus':'APPROVED','approvalReference':'SYNTHETIC_TEST_ONLY','knownAt':clock,'effectiveFrom':clock,'effectiveThrough':None} for k in ['sourceContract','sourceMethod','identityMethod','registryMapping']};return clocks,cut,a
 def test_all_missing_required_clocks_block(self):
  for field in REQUIRED_CLOCKS:
   with self.subTest(field=field):
    k,c,a=self.fixture();k[field]=None;r=knowledge_assessment(k,c,'2026-06-30',a);self.assertFalse(r['asKnownEligible']);self.assertIsNone(r['effectiveKnownAt'])
 def test_future_verification_blocks(self):
  k,c,a=self.fixture();k['documentVerifiedAt']='2026-10-22T10:00:00Z';self.assertFalse(knowledge_assessment(k,c,'2026-06-30',a)['asKnownEligible'])
 def test_late_mapping_blocks(self):
  k,c,a=self.fixture();k['mappingKnownAt']='2026-10-23T09:00:00Z';self.assertFalse(knowledge_assessment(k,c,'2026-06-30',a)['asKnownEligible'])
 def test_other_boundaries_take_maximum(self):
  k,c,a=self.fixture();k['otherRequiredContractBoundaries']=[{'at':'2026-10-22T10:00:00Z'}];r=knowledge_assessment(k,c,'2026-06-30',a);self.assertFalse(r['asKnownEligible']);self.assertIn('10:00:00',r['effectiveKnownAt'])
 def test_proposal_is_not_approved(self):
  k,c,a=self.fixture();a['sourceContract']['governanceStatus']='PROPOSED';self.assertFalse(knowledge_assessment(k,c,'2026-06-30',a)['asKnownEligible'])
 def test_unavailable_actual_cutoff_is_not_inferred(self):
  k,c,a=self.fixture();c['systemKnownAt']=None
  with self.assertRaises(ValueError):knowledge_assessment(k,c,'2026-06-30',a)
 def test_knowledge_max_includes_retrieval(self):
  k,c,a=self.fixture();k['documentRetrievedAt']='2026-10-22T10:00:00Z';r=knowledge_assessment(k,c,'2026-06-30',a);self.assertIn('10:00:00',r['effectiveKnownAt']);self.assertFalse(r['asKnownEligible'])
 def test_no_actual_candidate_is_accepted(self):
  for r in load(P/'IMMUTABLE_MAPPING_RECEIPTS.json')['receipts']:self.assertFalse(r['body']['independentlyAccepted']);self.assertFalse(r['body']['formallyAdmitted'])
if __name__=='__main__':unittest.main(verbosity=2)
