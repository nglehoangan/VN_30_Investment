"""Independent PE4 technical replay and adversarial evidence tests; no production mutation."""
from pathlib import Path
from copy import deepcopy
from tempfile import TemporaryDirectory
import json,unittest
from lib.pe4_evidence import read,sha,digest,replay,replay_package,next_day,availability,CLOCKS,normalized,validate_cell_review,validate_acceptance,verify_seal
R=Path(__file__).resolve().parents[1];P=R/'docs/fundamental-data-engine/evidence/2026-10-22-primary-publication-evidence-pe4';P3=P.parent/'2026-10-22-primary-publication-evidence-pe3'
DATA=read(P/'PE1_PE2_PE3_REPLAY.json');REV=read(P/'SOURCE_CELL_INDEPENDENT_REVIEW.json')['reviews'];OLD=read(P3/'SOURCE_CELL_MAPPING_REVIEW.json')['mappings']
class IndependentVerification(unittest.TestCase):
 def context(self,i=140):
  return deepcopy(next(x for x in REV if x['body']['obligationIndex']==i)),deepcopy(DATA['canonicalMinimumObligations'][i]),deepcopy(next(x for x in OLD if x['obligationIndex']==i))
 def reject(self,mutate,i=140):
  r,c,o=self.context(i);mutate(r['body']);r['sha256']=digest(r['body']);r['reviewId']='pe4-cell-review-sha256:'+r['sha256']
  with self.assertRaises(ValueError):validate_cell_review(R,r,c,o)
 def test_independent_underlying_replay(self):self.assertEqual(replay(R),DATA)
 def test_independent_package_replay(self):self.assertEqual(replay_package(R)['sourceOperandsVerified'],51)
 def test_all_45_source_mapping_receipts(self):
  for r in REV:
   with self.subTest(obligation=r['body']['obligationIndex']):self.assertTrue(validate_cell_review(R,*self.context(r['body']['obligationIndex'])))
 def test_false_document_hash(self):self.reject(lambda b:b['sourceCells'][0].update(documentSha256='0'*64))
 def test_replaced_pdf_path(self):self.reject(lambda b:b['sourceCells'][0].update(pdfPath='data/vn30.sqlite'))
 def test_wrong_page(self):self.reject(lambda b:b['sourceCells'][0].update(physicalPage=99))
 def test_prior_period_column(self):self.reject(lambda b:b['sourceCells'][0].update(column='PRIOR'))
 def test_q2_instead_of_h1(self):self.reject(lambda b:b['sourceCells'][0].update(columnOccurrence=1),183)
 def test_wrong_statement_caption(self):self.reject(lambda b:b['sourceCells'][0].update(sourceCaption='Giá vốn hàng bán'))
 def test_wrong_period(self):self.reject(lambda b:b['period'].update(end='2025-06-30'))
 def test_wrong_scope(self):self.reject(lambda b:b.update(scope='SEPARATE'))
 def test_wrong_native_unit(self):self.reject(lambda b:b['sourceCells'][0].update(nativeUnit='VND'))
 def test_wrong_multiplier(self):self.reject(lambda b:b['normalization'].update(factor='1'))
 def test_wrong_sign(self):self.reject(lambda b:b['normalization'].update(signConvention='PRESERVE'),99)
 def test_positive_capex_source(self):self.reject(lambda b:b['sourceCells'][0].update(reportedValue='12606911504292'),99)
 def test_canonical_value_replacement(self):self.reject(lambda b:b.update(canonicalValue='0'))
 def test_occurrence_omission(self):self.reject(lambda b:b['sourceCells'].pop(),97)
 def test_duplicate_occurrence_code(self):self.reject(lambda b:b['sourceCells'][1].update(cellId=b['sourceCells'][0]['cellId']),97)
 def test_invalid_locator(self):self.reject(lambda b:b['sourceCells'][0].update(box=[.9,.9,.3,.3]))
 def test_missing_locator(self):self.reject(lambda b:b['sourceCells'][0].update(box=None))
 def test_swapped_norm_contract(self):self.reject(lambda b:b['normalization'].update(methodContract='src/domain/fundamentals/d2-policy-candidate-v1.json'))
 def test_fake_owner_acceptance(self):self.reject(lambda b:b.update(ownerAccepted=True))
 def test_fake_admission(self):self.reject(lambda b:b.update(formallyAdmitted=True))
 def test_ssb_locator_refinement(self):
  r,c,o=self.context(47);s=r['body']['sourceCells'][0];self.assertEqual(s['rowCode'],'NOTE_7.6_CLOSING_30JUN2026');self.assertEqual(s['column'],'Tổng cộng — Triệu đồng');self.assertTrue(validate_cell_review(R,r,c,o))
 def test_wrong_ssb_total_column(self):self.reject(lambda b:b['sourceCells'][0].update(column='Specific reserve only'),47)
 def test_gvr_digit_conflict_evidence(self):
  r,c,o=self.context(105);long=r['body']['sourceCells'][1];self.assertEqual(long['reportedValue'],'1372846806687');reads=long['PE4Evidence']['freshVisualObservation']['ocrReads'];self.assertTrue(all('806' in x['text'] for x in reads))
 def test_wrong_gvr_816_digit(self):self.reject(lambda b:b['sourceCells'][1].update(reportedValue='1372846816687'),105)
 def test_all_pending_seven_resolved_with_source_boxes(self):
  for i in [100,101,102,103,104,105,94]:
   r,c,o=self.context(i);self.assertTrue(all(x['box'] for x in r['body']['sourceCells']));self.assertFalse(r['body']['ownerAccepted'])
 def test_45_actual_acceptance_gates_remain_blocked(self):
  for a in read(P/'OBLIGATION_ACCEPTANCE_ASSESSMENT.json')['records']:self.assertTrue(validate_acceptance(a))
 def test_cannot_fabricate_human_formal_acceptance(self):
  a=deepcopy(read(P/'OBLIGATION_ACCEPTANCE_ASSESSMENT.json')['records'][0]);a['acceptanceState']='FORMALLY_ACCEPTED';a['formallyAccepted']=True
  with self.assertRaises(ValueError):validate_acceptance(a)
 def test_cannot_turn_technical_mapping_into_authority(self):
  a=deepcopy(read(P/'OBLIGATION_ACCEPTANCE_ASSESSMENT.json')['records'][0]);a['gates']['A']['satisfied']=True
  with self.assertRaises(ValueError):validate_acceptance(a)
 def clocks(self):
  k={f:'2026-10-22T09:00:00Z' for f in CLOCKS};k['otherRequiredContractBoundaries']=[];return k
 def test_calendar_boundaries(self):
  for d,v in [('2024-02-28','2024-02-28T17:00:00.000Z'),('2024-02-29','2024-02-29T17:00:00.000Z'),('2026-12-31','2026-12-31T17:00:00.000Z')]:self.assertEqual(next_day(d),v)
 def test_all_missing_required_fields_block(self):
  for f in CLOCKS:
   k=self.clocks();k[f]=None;r=availability(k,None,None,False);self.assertFalse(r['eligible']);self.assertIsNone(r['effectiveKnownAt'])
 def test_actual_cutoff_missing_never_inferred(self):self.assertFalse(availability(self.clocks(),None,None,True)['eligible'])
 def test_retrieval_after_system_cutoff(self):
  k=self.clocks();k['documentRetrievedAt']='2026-10-23T09:00:00Z';self.assertFalse(availability(k,'2026-10-22T10:00:00Z','2026-10-22T11:00:00Z',True)['eligible'])
 def test_mapping_after_system_cutoff(self):
  k=self.clocks();k['mappingKnownAt']='2026-10-23T09:00:00Z';self.assertFalse(availability(k,'2026-10-22T10:00:00Z','2026-10-22T11:00:00Z',True)['eligible'])
 def test_unknown_other_boundaries_not_empty(self):
  k=self.clocks();k['otherRequiredContractBoundaries']=None;self.assertIsNone(availability(k,None,None,False)['effectiveKnownAt'])
 def test_other_required_maximum(self):
  k=self.clocks();k['otherRequiredContractBoundaries']=[{'at':'2026-10-24T11:00:00Z'}];r=availability(k,'2026-10-22T10:00:00Z','2026-10-22T11:00:00Z',True);self.assertIn('24T11',r['effectiveKnownAt']);self.assertFalse(r['eligible'])
 def test_unqualified_clock_rejected(self):
  k=self.clocks();k['ingestedAt']='2026-10-22T09:00:00'
  with self.assertRaises(ValueError):availability(k,None,None,False)
 def test_unapproved_authority_blocks(self):self.assertFalse(availability(self.clocks(),'2026-10-22T10:00:00Z','2026-10-22T11:00:00Z',False)['eligible'])
 def test_synthetic_seal_rejects_source_replacement(self):
  with TemporaryDirectory(prefix='pe4-test-') as d:
   p=Path(d);(p/'source.json').write_text('{}');inventory={'files':{'source.json':sha(p/'source.json')}};(p/'ARTIFACT_HASHES.json').write_text(json.dumps(inventory));(p/'EVIDENCE_SEAL.json').write_text(json.dumps({'artifactHashesSha256':sha(p/'ARTIFACT_HASHES.json')}));verify_seal(p,p);(p/'source.json').write_text('{"replaced":true}')
   with self.assertRaises(ValueError):verify_seal(p,p)
 def test_minimum_dataset_not_double_counted(self):
  x=read(P/'MINIMUM_DATASET_COVERAGE.json');self.assertEqual(len(x['rows']),216);self.assertEqual(sum(r['PE4FinancialMappingTechnicallyVerified'] for r in x['rows']),45);self.assertEqual(sum(r['currentVietstockDocumentMatched'] for r in x['rows']),104);self.assertEqual(x['summary']['remainingUnresolved'],216)
 def test_missing_vnm_candidate_not_zero(self):
  x=read(P/'MINIMUM_DATASET_COVERAGE.json')['rows'][185];self.assertEqual(x['concept'],'COMPREHENSIVE_FINANCIAL_DEBT');self.assertIsNone(x['canonicalPointer']);self.assertFalse(x['canonicalCandidateExists'])
if __name__=='__main__':unittest.main(verbosity=2)
