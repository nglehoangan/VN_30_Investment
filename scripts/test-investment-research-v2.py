import importlib.util
import unittest
from copy import deepcopy
from decimal import Decimal
from pathlib import Path
spec=importlib.util.spec_from_file_location('v2',Path(__file__).with_name('build-investment-research-v2.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
from lib.research19 import capital_bridge,signed_return_value

class Research19Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.d=m.load(m.OUT/'snapshot.json');cls.p={r['ticker']:r for r in cls.d['issuers']}
  cls.caps={r['ticker']:r for r in m.load(m.OUT/'checked-capital-readings.json')['readings']}
 def test_30_retained_19_processed(self):
  self.assertEqual(len(self.p),30);self.assertEqual(set(self.caps),set(m.TARGET))
  self.assertTrue(all(self.p[t]['modelScenarios'] for t in m.TARGET))
 def test_previous_11_byte_identical(self):
  for t in set(self.p)-set(m.TARGET):
   for ext in ('json','md'):self.assertEqual((m.OUT/'issuers'/f'{t}.{ext}').read_bytes(),(m.PRIOR/'issuers'/f'{t}.{ext}').read_bytes())
 def test_source_and_output_pins(self):
  manifest=m.load(m.OUT/'manifest.json')
  for path,h in {**manifest['inputPins'],**manifest['outputs']}.items():self.assertEqual(m.sha(m.ROOT/path),h,path)
  self.assertEqual(m.sha(m.ROOT/'data/vn30.sqlite'),manifest['previousDatabaseHash'])
  idx=manifest['currentResearchIndex'];self.assertEqual(m.sha(m.ROOT/idx['path']),idx['sha256'])
 def test_actual_nci_not_group_book(self):
  self.assertEqual(self.p['BID']['commonBookReferenceVnd'],'167988959000000')
  self.assertEqual(self.p['VPB']['commonBookReferenceVnd'],'167903343000000')
  self.assertEqual(self.p['VHM']['commonBookReferenceVnd'],'238079067000000')
 def test_bsr_printed_conflict_preserved(self):
  r=self.p['BSR'];self.assertEqual(r['capitalReading']['sourceConflict']['printed410Native'],'60534220825760')
  self.assertEqual(r['commonBookReferenceVnd'],'60480974877012')
  self.assertFalse(r['capitalReading']['sourceConflict']['issuerCorrectionClaimed'])
  bad=deepcopy(self.caps['BSR']);bad['selectedEquitySubtotalNative']='60534220825760'
  with self.assertRaisesRegex(ValueError,'BSR_CONFLICT'):capital_bridge(bad)
 def test_gvr_other_funding_not_common_capital(self):
  r=self.p['GVR'];self.assertEqual(r['commonBookReferenceVnd'],'56308869720189')
  self.assertEqual(r['capitalBridge']['groupFundingExcludedVnd'],'47876188726')
  bad=deepcopy(self.caps['GVR']);bad['excludedOtherFundingNative']='1'
  with self.assertRaisesRegex(ValueError,'GVR_FUNDING'):capital_bridge(bad)
 def test_missing_nci_not_zero(self):
  for t in ['SHB','SSB','STB','VIB']:
   self.assertIsNone(self.caps[t]['nciNative']);self.assertIn('PROXY',self.p[t]['capitalBridge']['basis'])
  for t in ['LPB','TCX']:self.assertIn('NOT_APPLICABLE',self.p[t]['capitalBridge']['basis'])
 def test_capital_dimensions_and_components_rejected(self):
  for key,value,error in [('periodEnd','2026-06-30','CLOSING'),('multiplier','1000','UNIT'),('nativeUnit','VND','UNIT'),('reviewMode','OCR_ONLY','REVIEW')]:
   bad=deepcopy(self.caps['BID']);bad[key]=value
   with self.subTest(key=key):
    with self.assertRaisesRegex(ValueError,error):capital_bridge(bad)
  bad=deepcopy(self.caps['SHB']);bad['parentComponentsNative'][0]='1'
  with self.assertRaisesRegex(ValueError,'COMPONENT'):capital_bridge(bad)
 def test_all_scenarios_replay_and_signed_identity(self):
  for t in m.TARGET:
   p=self.p[t]
   for s in p['modelScenarios']:
    v=s['model'];calc=signed_return_value(p['commonBookReferenceVnd'],s['earningsInputVnd'],v['costOfEquityAssumption'],v['horizonYears'],v['returnPolicy'])
    self.assertEqual(calc['equityValueVnd'],s['equityValueVnd'])
    self.assertLess(abs(Decimal(calc['equityValueVnd'])-Decimal(calc['signedDistributionCrosscheckVnd'])),Decimal('.000001'))
 def test_loss_not_clamped_or_assumed_recovered(self):
  self.assertLess(Decimal(self.p['VJC']['earnings']['workingCaseVnd']),0)
  self.assertIsNone(self.p['VJC']['equityScenarioRange']['baseVnd'])
  self.assertTrue(any(Decimal(s['equityValueVnd'])<0 for s in self.p['VJC']['modelScenarios']))
  self.assertTrue(any(s['model']['returnPolicy']=='PERSIST_CURRENT_RETURN' for s in self.p['VJC']['modelScenarios']))
  v=signed_return_value('100','-20','.15',5,'PERSIST_CURRENT_RETURN')
  self.assertTrue(v['negativeValueIsNotNegativeSharePrice']);self.assertEqual(v['years'][0]['capitalInjectionRequiredIfNegativeVnd'],'20')
 def test_vic_no_invented_base_or_midpoint(self):
  p=self.p['VIC'];self.assertIsNone(p['equityScenarioRange']['baseVnd'])
  self.assertFalse(p['selectedCommonEarningsPointIdentified'])
  self.assertEqual({x['name'] for x in p['incomeCases']},{'NAMED_INCIDENCE_LOW','NAMED_INCIDENCE_HIGH'})
 def test_msn_preference_make_whole_not_zero(self):
  p=self.p['MSN'];self.assertTrue(p['capitalIncludesUnallocatedPreferenceClaims'])
  self.assertIsNone(p['capitalReading']['preferenceReview']['contingentMakeWholeClaimValueVnd'])
  self.assertEqual(p['capitalReading']['preferenceReview']['asConvertedShares'],'1520491927')
 def test_no_rnav_from_book(self):
  for t in ['VHM','VPL','MSN']:
   self.assertIn('NOT_RNAV_OR_SOTP',self.p[t]['researchModelFamily']);self.assertFalse(self.p[t]['primaryValuationAccepted'])
 def test_no_current_signal_share_target_or_authority(self):
  for t in m.TARGET:
   p=self.p[t]
   self.assertEqual(p['currentSignal'],'UNDETERMINED_NOT_BUY_HOLD_OR_SELL');self.assertIsNone(p['acceptedValuePerShare'])
   for ref in p['providerShareReferences']:self.assertIsNone(ref['basePerShareVnd'])
   for k in ['productionScoringAuthorized','sourceAdmissionGranted','navAuthorized','tradingAuthorized','criterionOrWeightChange']:self.assertFalse(p[k])
 def test_cafef_raw_replay_and_no_unit_guess(self):
  for t in m.TARGET:
   c=m.load(m.OUT/'source-comparisons'/f'{t}.json')
   self.assertTrue(c['pdfFirst']);self.assertTrue(c['providerUnitOrScopeNotGuessed'])
   for r in c['cafefCandidates']:
    self.assertFalse(r['pdfOverwritten']);self.assertEqual(r['comparisonStatus'],'REFERENCE_ONLY_UNIT_SCOPE_UNDECLARED')
    raw=m.load(m.ROOT/r['source']['rawPayloadLocation']);v=m.resolve(raw,r['rawPointer'])
    if v is not None and r['value'] is not None:self.assertEqual(Decimal(str(v)),Decimal(r['value']))
 def test_exact_page_period_overlays_and_vhm_extraction_exception(self):
  for t in ['LPB','VHM','VIC']:
   c=m.load(m.OUT/'source-comparisons'/f'{t}.json')
   self.assertTrue(any(x['originalPeriodKey']=='UNRESOLVED-YEAR-C1' for x in c['pdfExtractedCandidates']))
   self.assertTrue(all(x['reviewedPeriodEnd']=='2025-12-31' and x['originalPeriodKey']!='UNRESOLVED-YEAR-C2' for x in c['pdfExtractedCandidates']))
  c=m.load(m.OUT/'source-comparisons/VHM.json')
  self.assertTrue(any(x.get('numericExtractionMatchesManual') is False for x in c['pdfExtractedCandidates']))
  self.assertEqual(self.p['VHM']['capitalReading']['nciNative'],'11137640')
  c=m.load(m.OUT/'source-comparisons/TCX.json');self.assertFalse(c['missingDisplayDocumentHandledByRetainedPdf'])
  self.assertTrue(any(x['originalPeriodKey']=='2025-12-31' and x['sourcePageBindingLevel']=='ROW_PDF_EVIDENCE' for x in c['pdfExtractedCandidates']))
 def test_numeric_conflict_does_not_overwrite_pdf_or_admit_units(self):
  c=m.load(m.OUT/'source-comparisons/BID.json')
  self.assertTrue(any(x['relation']=='DIFFERENT_NUMERIC_MAGNITUDE_UNQUALIFIED' for x in c['numericDiagnostics']))
  self.assertEqual(self.p['BID']['capitalReading']['selectedEquitySubtotalNative'],'173552902')
  self.assertTrue(all(x['providerUnitAndScopeStillUnknown'] for x in c['numericDiagnostics']))
 def test_zero_excess_return_equals_book_and_persistence_equals_capitalization(self):
  self.assertEqual(Decimal(signed_return_value('100','15','.15',5,'FADE_TO_COST')['equityValueVnd']),Decimal(100))
  self.assertEqual(Decimal(signed_return_value('100','30','.15',5,'PERSIST_CURRENT_RETURN')['equityValueVnd']),Decimal(200))
  with self.assertRaises(ValueError):signed_return_value('0','1','.15',5,'FADE_TO_COST')
  with self.assertRaises(ValueError):signed_return_value('100','1','.15',True,'FADE_TO_COST')

if __name__=='__main__':unittest.main()
