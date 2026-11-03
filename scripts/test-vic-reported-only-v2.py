import copy
import importlib.util
import json
from pathlib import Path
import unittest
s=importlib.util.spec_from_file_location('b',Path(__file__).with_name('build-vic-reported-only-v2.py'))
b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
class VicOnly(unittest.TestCase):
    def setUp(self):self.x=json.loads((b.OUT/'inputs.json').read_text())
    def test_actual_book_bridge(self):
        d=b.calculate(self.x);a=d['alternativeMethod']
        self.assertEqual(a['groupAssetsVnd'],'1118622625000000')
        self.assertEqual(a['groupLiabilitiesVnd'],'967133690000000')
        self.assertEqual(a['groupBookNetAssetsVnd'],'151488935000000')
        self.assertEqual(sum(map(int,a['segmentBookNetAssetsVnd'].values()))+int(a['centralBookNetAssetsVnd']),int(a['groupBookNetAssetsVnd']))
    def test_earnings_route_excluded_without_fabricated_zero(self):
        d=b.calculate(self.x);e=d['earningsMethod']
        self.assertEqual(e['diagnosticAfterSponsorNovatechVnd'],'-31011782000000')
        for k in ['assumedNormalizedProfitVnd','assumedTaxRate','assumedNciWeight']:self.assertIsNone(e[k])
        self.assertFalse(e['diagnosticIsNormalizedCommonEarnings'])
        self.assertEqual(e['disposition'],'EXCLUDE_PE_AND_EPS_BASED_VALUATION')
    def test_book_is_not_accepted_common_value(self):
        a=b.calculate(self.x)['alternativeMethod']
        self.assertTrue(a['includesNci']);self.assertTrue(a['includesPreferredClaims'])
        self.assertFalse(a['bookValuesAreFairValues'])
        for k in ['acceptedRnavVnd','acceptedCommonEquityValueVnd','acceptedValuePerShareVnd']:self.assertIsNone(a[k])
    def test_non_vic_pdf_cannot_enter(self):
        self.x['rows'][0]['source']['pdfPath']='data/manual-download/VIC/2026-11-03-owner-vinfast/VinFast_JSC_FY2025_Audited_Standalone.pdf'
        with self.assertRaises(ValueError):b.calculate(self.x)
    def test_wrong_units_and_hash_block(self):
        for key,value in [('unit','VND'),('hash','0'*64)]:
            x=copy.deepcopy(self.x)
            if key=='unit':x['rows'][0]['unit']=value
            else:x['rows'][0]['source']['sha256']=value
            with self.assertRaises(ValueError):b.calculate(x)
    def test_gross_segment_sum_without_elimination_blocks(self):
        v=next(r for r in self.x['rows'] if r['id']=='VIC25-SEGMENT-BOOK')['values'];v['assetElimination']='0'
        with self.assertRaises(ValueError):b.calculate(self.x)
    def test_no_repeated_external_request_or_authority(self):
        d=b.calculate(self.x)
        self.assertFalse(d['externalVinFastDocumentRequestPending'])
        for k in ['criteriaAndWeightsChanged','productionAuthority','navAuthority','tradingAuthority']:self.assertFalse(d[k])
        self.assertEqual(d['financialAcceptance'],'NOT_GRANTED')
    def test_duplicate_evidence_blocks(self):
        self.x['rows'].append(self.x['rows'][0])
        with self.assertRaises(ValueError):b.calculate(self.x)
if __name__=='__main__':unittest.main()
