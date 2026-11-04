"""Actual-case regressions and immutable source checks for the 30-issuer bridge."""
import importlib.util
import unittest
from copy import deepcopy
from decimal import Decimal
from pathlib import Path

spec=importlib.util.spec_from_file_location('v4',Path(__file__).with_name('build-earnings-normalization-v4.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class EarningsV4Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.snapshot=m.load(m.OUT/'snapshot.json')
        cls.p={p['ticker']:p for p in cls.snapshot['issuers']}
    def test_exact_retained_universe(self):
        self.assertEqual(set(self.p),set(m.TICKERS));self.assertEqual(len(self.p),30)
    def test_source_pins_and_output_hashes(self):
        manifest=m.load(m.OUT/'manifest.json')
        for path,h in manifest['inputPins'].items():
            with self.subTest(path=path):m.verify(path,h)
        for path,h in manifest['outputs'].items():
            self.assertEqual(m.sha(m.OUT/path),h,path)
    def test_all_29_bridges_recalculate_without_float_or_clamp(self):
        for t,p in self.p.items():
            if t!='VIC':
                self.assertEqual(p['prudentialWorkingCaseVnd'],m.txt(m.calculate(p['sourceCommonBridgeVnd'],p['selectedPretaxAdjustments'])),t)
    def test_no_authority_or_false_acceptance(self):
        for p in self.p.values():
            for k in ['sourceAdmissionGranted','productionScoringAuthorized','navAuthorized','tradingAuthorized','financialCriteriaOrWeightsChanged']:
                self.assertFalse(p[k])
            self.assertIsNone(p['acceptedNormalizedCommonEarningsVnd'])
            self.assertIsNone(p['acceptedEps'])
            self.assertIsNone(p['unknownAdditionalFundVnd'])
            self.assertFalse(p['valuationOrRnavRequiredForThisBridge'])
    def test_bank_positive_proxy_not_added_back(self):
        for t in ['ACB','MBB','TCB','VCB']:
            self.assertTrue(all(m.number(a['pretaxVnd'])<=0 for a in self.p[t]['selectedPretaxAdjustments']))
        self.assertEqual(self.p['ACB']['prudentialWorkingCaseVnd'],'15524699000000')
    def test_ssi_fund_and_paired_gains(self):
        p=self.p['SSI']
        self.assertEqual(p['sourceCommonBridgeVnd'],'3861272256382')
        self.assertEqual(p['prudentialWorkingCaseVnd'],'3762407399230')
        refs={r for a in p['selectedPretaxAdjustments'] for r in a['readingIds']}
        self.assertTrue(any('warrant' in r.lower() for r in refs))
    def test_prior_16_cases_preserved_with_fund_plan_separate(self):
        for t,p in self.p.items():
            path=m.DECISIONS/'issuers'/f'{t}.json'
            if path.exists() and t!='VIC':
                prior=m.load(path)
                self.assertEqual(p['prudentialWorkingCaseVnd'],prior['selectedAnalystBaseVnd'],t)
                self.assertEqual(p['fundBridgeIsConditionalPlan'],prior['fundBridgeIsConditionalPlan'],t)
        self.assertTrue(self.p['HDB']['fundBridgeIsConditionalPlan'])
        self.assertEqual(self.p['HDB']['fundBridgeApplication'],'ALREADY_IN_SOURCE_COMMON_BRIDGE_DO_NOT_SUBTRACT_AGAIN')
    def test_vnm_scope_and_fixed_fund(self):
        p=self.p['VNM'];self.assertEqual(p['scope'],'STANDALONE')
        self.assertEqual(p['sourceCommonBridgeVnd'],'8423414672066')
        self.assertEqual(p['standaloneFundAccruedDeductedOnceVnd'],'935934963563')
        self.assertEqual(p['prudentialWorkingCaseVnd'],'8369595220974')
        self.assertTrue(p['consolidatedReferenceIsNotModelInput'])
    def test_vhm_full_transfer_core_case(self):
        self.assertEqual(self.p['VHM']['prudentialWorkingCaseVnd'],'33019724000000')
    def test_vpl_no_cost_addback_separate_tax_stress(self):
        p=self.p['VPL'];self.assertEqual(p['prudentialWorkingCaseVnd'],'1101566000000')
        self.assertEqual(p['separatePostTaxStress']['resultVnd'],'1016705000000')
        self.assertFalse(p['separatePostTaxStress']['applySecondTaxDiscount'])
    def test_vic_no_fabricated_common_point(self):
        p=self.p['VIC'];self.assertIsNone(p['prudentialWorkingCaseVnd'])
        self.assertEqual(len(p['namedComponents']),3)
        self.assertEqual(p['groupPretaxDiagnosticVnd'],'-32776782000000')
        self.assertEqual(p['namedAdjustmentIncidenceEnvelope']['minimumVnd'],'-48528966000000')
        self.assertTrue(p['licenseSettlementIsNotAdditionalFullPnlDeduction'])
    def test_negative_result_preserved(self):
        self.assertEqual(m.calculate('10',[dict(id='x',pretaxVnd='-20')]),Decimal('-10'))
    def test_duplicate_and_nonfinite_rejected(self):
        for s in ['NaN','Infinity','-Infinity']:
            with self.assertRaises(ValueError):m.number(s)
        with self.assertRaises(ValueError):m.number(2.0)
        with self.assertRaises(ValueError):m.calculate('10',[dict(id='x',pretaxVnd='1')]*2)
        with self.assertRaises(ValueError):m.calculate('10',[],tax='1.1')
    def test_source_identity_mismatch_blocks(self):
        with self.assertRaisesRegex(ValueError,'SOURCE_PIN_MISMATCH'):
            m.verify(str((m.PRIOR/'issuers/BSR.json').relative_to(m.ROOT)),'0'*64)
    def test_wrong_issuer_period_and_units_rejected(self):
        r=deepcopy(next(iter(m.load(m.BASE/'2026-11-02/held-normalization-v1/checked-inputs.json')['readings'])))
        with self.assertRaisesRegex(ValueError,'CROSS_ISSUER'):m.validate_reading(r,'OTHER')
        for key,value,error in [('fiscalYear',2026,'PERIOD'),('currencyMultiplier','1000','UNIT'),('columnBinding','UNKNOWN','COLUMN'),('review','OCR_ONLY','UNCHECKED')]:
            bad=deepcopy(r);bad[key]=value
            with self.subTest(key=key):
                with self.assertRaisesRegex(ValueError,error):m.validate_reading(bad,r['ticker'])

    def test_mixed_adjustments_independent_not_net_ratio(self):
        x=m.envelope('100',[dict(id='a',pretaxVnd='-80'),dict(id='b',pretaxVnd='50')],False)
        self.assertEqual(x['minimumVnd'],'20');self.assertEqual(x['maximumVnd'],'150')
        self.assertFalse(x['completeEconomicBound'])

if __name__=='__main__':unittest.main()
