"""Synthetic corruption/cutoff tests against actual pinned PE2 candidate structure; no source writes."""
import copy,json,unittest,tempfile
from pathlib import Path
from lib.pe2_evidence import load,verify_receipt,content_hash,knowledge_assessment,REQUIRED_CLOCKS
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'docs/fundamental-data-engine/evidence/2026-10-22-primary-publication-evidence-pe2'
class ReplayTest(unittest.TestCase):
 def setUp(self):
  self.receipt=copy.deepcopy(load(P/'SOURCE_BINDING_CANDIDATES.json')['candidates'][0]);self.expected=copy.deepcopy(load(P/'EXPECTED_BINDINGS.json')['bindings'][0])
 def seal(self):
  self.receipt['contentHash']=content_hash(self.receipt['body']);self.receipt['receiptId']='pe2-source-binding-sha256:'+self.receipt['contentHash']
 def rejected(self,field,value):
  self.receipt['body'][field]=value;self.seal()
  with self.assertRaises(ValueError):verify_receipt(ROOT,self.receipt,self.expected)
 def test_repeated_replay_deterministic(self):
  self.assertEqual(verify_receipt(ROOT,self.receipt,self.expected),verify_receipt(ROOT,self.receipt,self.expected))
 def test_document_replacement(self):
  with tempfile.TemporaryDirectory() as d:
   path=Path(d)/'replacement.pdf';path.write_bytes(b'%PDF-replaced');self.receipt['body']['documentPath']=str(path);self.expected['documentPath']=str(path);self.seal()
   with self.assertRaisesRegex(ValueError,'DOCUMENT_REPLACEMENT'):verify_receipt(ROOT,self.receipt,self.expected)
 def test_metadata_replacement(self):
  with tempfile.TemporaryDirectory() as d:
   path=Path(d)/'replacement.html';path.write_text('<html>replaced</html>');self.receipt['body']['sourcePath']=str(path);self.expected['sourcePath']=str(path);self.seal()
   with self.assertRaisesRegex(ValueError,'METADATA_REPLACEMENT'):verify_receipt(ROOT,self.receipt,self.expected)
 def test_publication_date_conflict(self):self.rejected('publicationDate','2026-08-27')
 def test_source_url_substitution(self):self.rejected('sourceURL','https://evil.example/report')
 def test_document_url_substitution(self):self.rejected('documentURL','https://evil.example/report.pdf')
 def test_retained_pdf_mismatch(self):
  with tempfile.TemporaryDirectory() as d:
   path=Path(d)/'retained.pdf';path.write_bytes(b'%PDF-different');pairs=[{'path':str(path),'sha256':self.expected['documentSha256']}];self.receipt['body']['retainedPDFs']=pairs;self.expected['retainedPDFs']=pairs;self.seal()
   with self.assertRaisesRegex(ValueError,'RETAINED_PDF_MISMATCH'):verify_receipt(ROOT,self.receipt,self.expected)
 def test_missing_required_clocks_block(self):
  for key in REQUIRED_CLOCKS:
   r=copy.deepcopy(self.receipt);r['body']['knowledge'][key]=None;r['contentHash']=content_hash(r['body']);r['receiptId']='pe2-source-binding-sha256:'+r['contentHash'];out=verify_receipt(ROOT,r,self.expected);self.assertFalse(out['knowledge']['asKnownEligible']);self.assertIsNone(out['knowledge']['effectiveKnownAt']);self.assertIn(key,out['knowledge']['missing'])
 def test_incorrect_issuer(self):self.rejected('issuerLegalName','Other issuer')
 def test_incorrect_ticker(self):self.rejected('ticker','VHM')
 def test_incorrect_period(self):self.rejected('period',{'start':'2025-01-01','end':'2025-12-31'})
 def test_incorrect_scope(self):self.rejected('scope','SEPARATE')
 def test_incorrect_units(self):
  rows=copy.deepcopy(self.receipt['body']['obligationBindings']);rows[0]['unit']='PERCENT';self.rejected('obligationBindings',rows)
 def test_invalid_authority_identity(self):self.rejected('sourceContractIdentity',{'governanceStatus':'APPROVED','approvalReference':'invented'})
 def test_fabricated_missing_clock_rejected(self):
  k=copy.deepcopy(self.receipt['body']['knowledge']);k['ingestedAt']='2026-01-01T00:00:00Z';self.rejected('knowledge',k)
 def test_fabricated_authority_approval_rejected(self):
  a=copy.deepcopy(self.receipt['body']['authorities']);a['sourceContract']['governanceStatus']='APPROVED';a['sourceContract']['approvalReference']='invented';self.rejected('authorities',a)
 def test_no_fabricated_retained_pair(self):
  rs=load(P/'SOURCE_BINDING_CANDIDATES.json')['candidates'];self.assertEqual(sum(r['body']['identityClass']=='VERIFIED_DOCUMENT_IDENTITY' and not r['body']['retainedPDFs'] for r in rs),2)
 def test_no_silent_receipt_rehash(self):
  self.receipt['body']['ticker']='VHM'
  with self.assertRaisesRegex(ValueError,'RECEIPT_HASH_MISMATCH'):verify_receipt(ROOT,self.receipt,self.expected)
 def fixtures(self):
  clocks={k:'2026-10-22T00:00:00Z' for k in REQUIRED_CLOCKS};clocks['otherRequiredContractBoundaries']=[];authority={k:{'governanceStatus':'APPROVED','approvalReference':'SYNTHETIC_TEST_ONLY','knownAt':'2026-10-21T00:00:00Z','effectiveFrom':'2026-10-21T00:00:00Z','effectiveThrough':None} for k in ['sourceContract','sourceMethod','identityMethod','registryMapping']};cutoff={'systemKnownAt':'2026-10-22T01:00:00Z','decisionAsOf':'2026-10-22T02:00:00Z','assessedAt':'2026-10-22T03:00:00Z'};return clocks,authority,cutoff
 def test_historical_cutoff_before_knownat(self):
  clocks,a,c=self.fixtures();c['systemKnownAt']='2026-10-21T00:00:00Z';self.assertFalse(knowledge_assessment(clocks,c,'2026-06-30',a)['asKnownEligible'])
 def test_synthetic_complete_clocks_positive_control(self):
  clocks,a,c=self.fixtures();self.assertTrue(knowledge_assessment(clocks,c,'2026-06-30',a)['asKnownEligible'])
 def test_economic_period_after_cutoff(self):
  clocks,a,c=self.fixtures();self.assertFalse(knowledge_assessment(clocks,c,'2026-12-31',a)['asKnownEligible'])
 def test_future_authority_effective_from(self):
  clocks,a,c=self.fixtures();a['sourceContract']['effectiveFrom']='2026-10-23T00:00:00Z';self.assertFalse(knowledge_assessment(clocks,c,'2026-06-30',a)['asKnownEligible'])
 def test_authority_expired(self):
  clocks,a,c=self.fixtures();a['sourceContract']['effectiveThrough']='2026-10-22T00:00:00Z';self.assertFalse(knowledge_assessment(clocks,c,'2026-06-30',a)['asKnownEligible'])
 def test_authority_expires_before_assessment(self):
  clocks,a,c=self.fixtures();a['sourceContract']['effectiveThrough']='2026-10-22T02:30:00Z';self.assertFalse(knowledge_assessment(clocks,c,'2026-06-30',a)['asKnownEligible'])
 def test_cutoff_order(self):
  clocks,a,c=self.fixtures();c['decisionAsOf']='2026-10-22T00:00:00Z';self.assertFalse(knowledge_assessment(clocks,c,'2026-06-30',a)['asKnownEligible'])
if __name__=='__main__':unittest.main()
