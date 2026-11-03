"""Bounded owner-authorized VIC reported-data decision and misuse regressions."""
import copy,importlib.util,json,unittest
from pathlib import Path
from unittest.mock import patch
s=importlib.util.spec_from_file_location('b',Path(__file__).with_name('build-vic-reported-data-acceptance.py'))
b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
class Acceptance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.d=b.build()
    def test_actual_counts_and_scope(self):
        self.assertEqual(len(self.d['records']),67)
        self.assertEqual(self.d['counts'],dict(ACCEPTED_REPORTED_READING=61,ACCEPTED_MANAGEMENT_DISCLOSURE_READING=5,PENDING_CAPTION_RECONCILIATION=1))
        self.assertFalse(self.d['fullVicDatasetAccepted'])
    def test_primary_reported_use_allowed(self):
        r=b.require_use(self.d,'VIC-G25-PNL','ANALYZE_REPORTED_FINANCIALS',period='FY2025',scope='CONSOLIDATED')
        self.assertEqual(r['values']['pbt'],'26437375')
    def test_standalone_not_consolidated(self):
        with self.assertRaises(ValueError):b.require_use(self.d,'VIC-P25-PNL','ANALYZE_REPORTED_FINANCIALS',period='FY2025',scope='CONSOLIDATED')
    def test_comparative_not_current_year(self):
        with self.assertRaises(ValueError):b.require_use(self.d,'VIC-FY2025-assetDisposalWriteoffLoss2024','ANALYZE_REPORTED_FINANCIALS',period='FY2025',scope='CONSOLIDATED')
    def test_caption_conflict_is_quarantined(self):
        r=next(r for r in self.d['records'] if r['id']=='VIC-RNAV-AR-CAPTION')
        with self.assertRaises(ValueError):b.require_use(self.d,r['id'],'READ_REPORTED_FINANCIAL_DATA',period=r['economicPeriod'],scope=r['sourceScope'])
        self.assertEqual(r['permittedUse'],[])
    def test_outside_purposes_not_granted(self):
        for purpose in self.d['excludedPurposes']:
            with self.assertRaises(ValueError):b.require_use(self.d,'VIC-G25-PNL',purpose,period='FY2025',scope='CONSOLIDATED')
    def test_unregistered_id_not_accepted(self):
        with self.assertRaises(ValueError):b.require_use(self.d,'VIC-ALL-FY2022-CASHFLOW','READ_REPORTED_FINANCIAL_DATA',period='FY2022',scope='CONSOLIDATED')
    def test_unknown_fair_value_not_zero(self):
        r=next(r for r in self.d['records'] if r['id']=='VIC-RNAV-IP')
        self.assertIsNone(r['values']['fairValue']);self.assertIn('fairValue',r['unknownValueFields'])
        self.assertFalse(r['unknownValuesConvertedToZero'])
    def test_non_vic_sources_excluded(self):
        for r in self.d['records']:
            self.assertNotIn('owner-vinfast',r['source']['pdfPath']);self.assertNotIn('sec.gov',r['source']['pdfPath'])
    def test_source_pdf_drift_blocks_reuse(self):
        sha=b.sha
        def changed(path):return '0'*64 if str(path).endswith('VIC_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf') else sha(path)
        with patch.object(b,'sha',side_effect=changed),self.assertRaises(ValueError):b.require_use(self.d,'VIC-G25-PNL','READ_REPORTED_FINANCIAL_DATA',period='FY2025',scope='CONSOLIDATED')
    def test_retained_review_artifact_drift_blocks_build(self):
        sha=b.sha
        def changed(path):return '0'*64 if str(path).endswith('vic-parent-bridge-v1/checked-evidence.json') else sha(path)
        with patch.object(b,'sha',side_effect=changed),self.assertRaisesRegex(ValueError,'PIN'):b.collect()
    def test_page_inspection_required(self):
        path=b.BASE/b.SOURCES[1][0];r=copy.deepcopy(b.load(path)['rows'][0]);r['review']['fullPageImageInspected']=False
        with self.assertRaises(ValueError):b.normalize(r,path,'rows',0)
    def test_reported_bridges_not_normalized_metrics(self):
        x=self.d['reportedArithmeticBridges']
        self.assertEqual(x['reportedEpsReplay']['replayedBasicEpsVnd'],'1432')
        self.assertEqual(x['closingExternalCommonShares'],'7498740060')
        self.assertEqual(x['reportedBorrowingsMillionVnd'],'338501032')
        self.assertTrue(x['allBridgesAreReportedArithmeticNotIntrinsicValuation'])
    def test_coverage_does_not_claim_full_document(self):
        docs=b.load(b.OUT/'document-coverage.json')['documents']
        self.assertEqual(len(docs),15)
        self.assertTrue(all(not d['completeReportAccepted'] for d in docs))
        self.assertTrue(any(d['documentStatus']=='NO_READINGS_ACCEPTED_IN_THIS_DECISION' for d in docs))
    def test_unified_anchor_matches_snapshot(self):
        a=b.load(b.GOV/'VIC_FINANCIAL_ANALYSIS_ACCEPTANCE.json')
        self.assertEqual(a['acceptanceId'],self.d['acceptanceId'])
        self.assertEqual(a['snapshotSha256'],b.sha(b.OUT/'decision.json'))
        for k in ['productionAuthority','navAuthority','tradingAuthority','valuationAccepted','normalizedCommonEarningsAccepted']:self.assertFalse(a[k])
if __name__=='__main__':unittest.main()
