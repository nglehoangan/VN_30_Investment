"""Actual-case fund replacements and evidence-integrity regression checks."""
import copy
import importlib.util
import json
import unittest
from pathlib import Path
from lib.fund_appropriation import fund_plan_preview, rebase_scenario, amount

spec = importlib.util.spec_from_file_location('acceptance_build', Path(__file__).with_name('build-normalization-acceptance-review.py'))
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)


class ActualCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.snapshot = b.read(b.OUT / 'snapshot.json')
        cls.decisions = {r['ticker']: r for r in cls.snapshot['issuers']}
        cls.readings = b.read(b.OUT / 'checked-appropriations.json')['rows']
        cls.acquisition = b.read(b.OUT / 'acquisition-manifest.json')

    def test_exact_seventeen_and_no_financial_acceptance(self):
        self.assertEqual(set(self.decisions), set(b.TICKERS))
        self.assertEqual(self.snapshot['acceptedNormalizedIssuerCount'], 0)
        for r in self.decisions.values():
            self.assertIsNone(r['acceptedNormalizedCommonEarningsVnd'])
            self.assertIsNone(r['acceptedEps'])
            self.assertTrue(r['blockers'])
            for key in ['sourceAdmissionGranted', 'productionScoringAuthorized', 'navAuthorized', 'tradingAuthorized', 'requiresNewPersonalOwnerEvidence']:
                self.assertFalse(r[key])

    def test_actual_four_bridges(self):
        for t, value, delta in [('VPB','23789930000000','-200000000000'),
                                ('VIB','7135430000000','-150000000000'),
                                ('SSB','5234539000000','-109714000000'),
                                ('HDB','16469388000000','-30000000000')]:
            with self.subTest(ticker=t):
                preview = self.decisions[t]['fundPlanPreview']
                self.assertEqual(preview['commonBridgePreviewVnd'], value)
                self.assertEqual(preview['changeFromInputVnd'], delta)

    def test_ssb_replaces_existing_estimate_not_second_full_deduction(self):
        p = self.decisions['SSB']['fundPlanPreview']
        self.assertEqual(p['restore'][0]['amountVnd'], '165286000000')
        self.assertEqual(p['deductions'][0]['amountVnd'], '275000000000')
        self.assertNotEqual(p['commonBridgePreviewVnd'], '5069253000000')
        # Known subsidiary 66m remains unresolved, not silently counted as parent.
        self.assertIn('66', self.decisions['SSB']['exactRemainingWork'])

    def test_hdb_keeps_existing_25bn_and_adds_only_30bn(self):
        p = self.decisions['HDB']['fundPlanPreview']
        self.assertEqual(p['restore'], [])
        self.assertEqual(p['deductions'][0]['amountVnd'], '30000000000')
        self.assertEqual(self.decisions['HDB']['priorCommonBridgeVnd'], '16499388000000')

    def test_scenario_translation_keeps_all_economic_adjustments(self):
        for t in ['VPB','VIB','SSB','HDB']:
            prior = b.read(b.PRIOR / 'issuers' / (t+'.json'))
            p = self.decisions[t]['fundPlanPreview']
            for old, new in zip(prior['scenarios'], p['rebasedScenarios']):
                delta = amount(p['changeFromInputVnd'])
                self.assertEqual(amount(new['minimumVnd']) - amount(old['commonEarningsIncidenceMinimumVnd']), delta)
                self.assertEqual(amount(new['maximumVnd']) - amount(old['commonEarningsIncidenceMaximumVnd']), delta)
                self.assertEqual(amount(new['maximumVnd']) - amount(new['minimumVnd']), amount(old['commonEarningsIncidenceMaximumVnd']) - amount(old['commonEarningsIncidenceMinimumVnd']))
                self.assertIsNone(new['selectedNormalizedEarningsVnd'])

    def test_no_auto_zero_or_rounded_fund_application(self):
        for t in ['BID','CTG','LPB','SAB','MCH','MSN','SHB','STB','TCX','VIC','VJC','BSR','GVR']:
            self.assertIsNone(self.decisions[t]['fundPlanPreview'])
        self.assertIn('3369374', self.decisions['BID']['exactRemainingWork'])
        self.assertIn('3050316', self.decisions['CTG']['exactRemainingWork'])
        self.assertIn('131028135557', self.decisions['SAB']['exactRemainingWork'])

    def test_all_checked_sources_and_zip_members_match_receipts(self):
        for r in self.readings:
            b.validate_reading(r, self.acquisition)
        self.assertEqual(len(self.readings), 14)
        self.assertTrue(any('-member-' in r['source']['pdfPath'] for r in self.readings))

    def test_integrity_pins_and_snapshot(self):
        m = b.read(b.OUT / 'manifest.json')
        for pin in m['inputPins']:
            self.assertEqual(b.sha(b.ROOT / pin['path']), pin['sha256'])
        self.assertEqual(b.sha(b.OUT / 'snapshot.json'), m['snapshotSha256'])

    def test_rebuild_reproduces_snapshot_manifest_and_report(self):
        paths = [b.OUT / n for n in ['snapshot.json','manifest.json','REPORT.md']]
        before = [b.sha(p) for p in paths]
        b.build()
        self.assertEqual([b.sha(p) for p in paths], before)

    def test_bsr_gvr_variants_preserved(self):
        self.assertEqual(self.decisions['BSR']['priorCommonBridgeVnd'], '4835448024664')
        self.assertIn('1-VND', self.decisions['BSR']['exactRemainingWork'])
        self.assertIn('30,13', self.decisions['GVR']['exactRemainingWork'])

    def test_hdb_printed_sum_difference_is_retained_not_balanced(self):
        row = self.decisions['HDB']['sourceArithmeticChecks'][0]
        self.assertEqual(row['componentSumSourceUnits'],'3135552')
        self.assertEqual(row['printedTotalSourceUnits'],'3135553')
        self.assertEqual(row['printedMinusComponentSumVnd'],'1000000')
        self.assertEqual(row['disposition'],'PRESENTATION_DIFFERENCE_UNRESOLVED_NO_BALANCING_ADJUSTMENT')
        self.assertEqual(len(self.decisions['HDB']['fundPlanPreview']['deductions']),1)

    def test_credit_proxy_not_loan_admission(self):
        for t in ['BID','CTG','HDB','LPB','SHB','SSB','STB','VIB','VPB']:
            self.assertIn('TOTAL_CREDIT_ASSET_PROXY_NOT_MATCHED_LOAN_NORMALIZATION', self.decisions[t]['blockers'])

    def test_period_identity_time_unit_and_authority_mutations_block(self):
        for field, value, error in [('documentId',-1,'SOURCE_IDENTITY'), ('retrievedAt','2025-12-31T00:00:00Z','RECEIPT_TIME'), ('sha256','0'*64,'SOURCE_BYTES')]:
            r = copy.deepcopy(self.readings[0]);r['source'][field]=value
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, error):
                b.validate_reading(r, self.acquisition)
        for field, value, error in [('economicPeriod','FY2026','PERIOD'), ('currencyMultiplier','1','UNIT'), ('productionAdmissible',True,'AUTHORITY'), ('financialNormalizationAccepted',True,'AUTHORITY')]:
            r = copy.deepcopy(self.readings[0]);r[field]=value
            with self.subTest(field=field), self.assertRaisesRegex(ValueError,error):
                b.validate_reading(r,self.acquisition)


class InvalidFundTreatment(unittest.TestCase):
    def setUp(self):
        self.row = dict(id='fund', componentKey='/values/fund', amountVnd='200', evidenceId='source', economicPeriod='FY2025',
                        classification='COMMON_NON_OWNER_FUND', attribution='IDENTIFIED_PARENT_OR_COMMON', existingTreatment='NOT_DEDUCTED_IN_INPUT')

    def preview(self, rows=None, restore=None):
        return fund_plan_preview('1000', restore=restore or [], deductions=rows if rows is not None else [self.row], evidence_ids=['source'])

    def test_duplicate_application_rejected(self):
        with self.assertRaisesRegex(ValueError,'DUPLICATE'):
            self.preview([self.row,self.row])

    def test_renaming_same_source_component_does_not_bypass_duplicate_guard(self):
        with self.assertRaisesRegex(ValueError,'DUPLICATE'):
            self.preview([self.row,dict(self.row,id='renamed')])

    def test_reserves_dividends_nci_and_unclassified_funds_rejected(self):
        for classification in ['CHARTER_RESERVE','DEVELOPMENT_FUND','FINANCIAL_RESERVE','DIVIDEND','NCI','UNCLASSIFIED']:
            row = dict(self.row, classification=classification)
            with self.subTest(classification=classification), self.assertRaisesRegex(ValueError,'NO_RESERVE'):
                self.preview([row])

    def test_deducted_or_pnl_fund_cannot_be_deducted_again(self):
        for treatment in ['ALREADY_DEDUCTED','P_AND_L_EXPENSE','UNKNOWN']:
            with self.subTest(treatment=treatment), self.assertRaisesRegex(ValueError,'NO_DUPLICATE'):
                self.preview([dict(self.row,existingTreatment=treatment)])

    def test_cannot_restore_unproven_existing_deduction(self):
        with self.assertRaisesRegex(ValueError,'REPLACEMENT'):
            self.preview([],restore=[self.row])

    def test_source_period_and_common_attribution_required(self):
        for key,value,error in [('evidenceId','other','BINDING'),('economicPeriod','FY2024','PERIOD'),('attribution','GROUP_PROFIT_RATIO','ATTRIBUTION')]:
            with self.subTest(key=key), self.assertRaisesRegex(ValueError,error):
                self.preview([dict(self.row,**{key:value})])

    def test_post_tax_fund_is_not_tax_discounted(self):
        self.assertEqual(self.preview()['commonBridgePreviewVnd'],'800')

    def test_negative_earnings_not_clipped(self):
        self.assertEqual(self.preview([dict(self.row,amountVnd='1200')])['commonBridgePreviewVnd'],'-200')

    def test_nan_float_and_negative_fund_rejected(self):
        for value in ['NaN','Infinity',200,'-1']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.preview([dict(self.row,amountVnd=value)])


if __name__ == '__main__':
    unittest.main()
