"""Actual issuer decisions, attribution risks and invariant governance checks."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from lib.base_assumptions import choose_adjustments, earnings, independent_envelope, number

spec=importlib.util.spec_from_file_location('base_builder',Path(__file__).with_name('build-base-assumption-decisions.py'))
b=importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)


class ActualChoices(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows={t:b.load(b.OUT/'issuers'/f'{t}.json') for t in b.TICKERS}

    def test_all_seventeen_decided_and_sixteen_working_points(self):
        summary=b.load(b.OUT/'summary.json')
        self.assertEqual(summary['documentedChoices'],17)
        self.assertEqual(summary['selectedPrudentialPointCount'],16)
        self.assertEqual(summary['rejectedUnidentifiedPointCount'],1)
        self.assertEqual(summary['acceptedFinancialNormalizationCount'],0)
        for r in self.rows.values():
            self.assertTrue(r['defense']['support'])
            self.assertTrue(r['defense']['counterevidence'])
            self.assertTrue(r['defense']['falsificationAndRemainingWork'])

    def test_exact_selected_actual_cases(self):
        expected={
            'BID':'19745234433005.576071','BSR':'2046163084859.557664',
            'CTG':'24138347212671.496771','GVR':'4188615308997',
            'HDB':'16338683500000','LPB':'9758023957772.674306',
            'MCH':'6667152294616','MSN':'3996046000000','SAB':'4136871679378',
            'SHB':'8993365980209.836587','SSB':'2390350000000','STB':'5291715000000',
            'TCX':'5185288351135.5','VIB':'5390408084076.224102',
            'VJC':'-2859457335112','VPB':'17254629532510.164139'}
        for t,v in expected.items():
            with self.subTest(ticker=t):
                self.assertEqual(number(self.rows[t]['selectedAnalystBaseVnd']),number(v))

    def test_stb_positive_provision_addback_rejected_against_counterevidence(self):
        r=self.rows['STB']
        a=next(a for a in r['selectedAdjustments'] if a['id'].endswith('total-credit-proxy'))
        self.assertEqual(a['pretaxVnd'],'0')
        self.assertEqual(a['priorBasePretaxVnd'],'4864326959141.561068')
        self.assertEqual(r['changeFromPriorBaseAtSameIncidenceVnd'],'-4864326959141.561068')

    def test_hdb_and_ssb_no_unsupported_positive_credit_or_recovery_addbacks(self):
        for t in ['HDB','SSB']:
            for a in self.rows[t]['selectedAdjustments']:
                self.assertLessEqual(number(a['pretaxVnd']),0)
        self.assertEqual(self.rows['HDB']['sourceCommonBridgeVnd'],'16469388000000')
        self.assertEqual(self.rows['SSB']['sourceCommonBridgeVnd'],'5234539000000')

    def test_mch_keeps_accrued_interest_but_full_collection_stress_is_visible(self):
        r=self.rows['MCH']
        self.assertEqual(r['selectedAdjustments'][0]['pretaxVnd'],'0')
        self.assertEqual(r['combinedNamedAxesSensitivity']['widthVnd'],'418642409859')
        self.assertEqual(r['changeFromPriorBaseAtSameIncidenceVnd'],'209321204929.5')

    def test_sab_full_reversal_removed_instead_of_arbitrary_half(self):
        a=next(a for a in self.rows['SAB']['selectedAdjustments'] if a['id'].endswith('investment-reversal'))
        self.assertEqual(a['pretaxVnd'],'-18688997322')
        self.assertEqual(self.rows['SAB']['changeFromPriorBaseAtSameIncidenceVnd'],'-9344498661')

    def test_vic_refuses_point_and_profit_ratio_allocation(self):
        r=self.rows['VIC']
        self.assertIsNone(r['selectedAnalystBaseVnd'])
        self.assertEqual(r['workingCaseCalculationVnd'],'-12368966000000')
        self.assertEqual(r['financialAcceptanceDecision'],'REJECT_UNIDENTIFIED_COMMON_POINT')
        self.assertTrue(r['combinedNamedAxesSensitivity']['signChangesAcrossKnownCases'])
        self.assertIsNone(b.load(b.PRIOR/'issuers/VIC.json')['commonAttributionProxy'])

    def test_vjc_core_airline_negative_and_fleet_finance_countercase_retained(self):
        r=self.rows['VJC']
        self.assertLess(number(r['selectedAnalystBaseVnd']),0)
        self.assertTrue(r['combinedNamedAxesSensitivity']['signChangesAcrossKnownCases'])
        self.assertTrue(any(number(a['valueAtSelectedIncidenceVnd'])>0 for a in r['disputedOperatingAlternatives']))
        self.assertEqual(next(a['pretaxVnd'] for a in r['selectedAdjustments'] if a['id'].endswith('aircraft-margin')),'-3525586899294')

    def test_known_fund_uncertainty_is_not_global_fund_bound(self):
        for r in self.rows.values():
            f=r['missingFundImpact']
            self.assertIsNone(f['additionalUnidentifiedFundVnd'])
            self.assertTrue(f['unboundedMissingFund'])
            self.assertEqual(f['commonEarningsDeltaPerAdditionalUndeductedCommonFundVnd'],'-1')
            for case in f['namedCounterfactuals']:
                self.assertEqual(number(case['resultingCaseVnd']),number(r['workingCaseCalculationVnd'])+number(case['changeFromSelectedCaseVnd']))
        self.assertEqual(self.rows['SSB']['missingFundImpact']['namedCounterfactuals'][0]['changeFromSelectedCaseVnd'],'-66000000')
        self.assertEqual(self.rows['HDB']['missingFundImpact']['namedCounterfactuals'][0]['changeFromSelectedCaseVnd'],'-104354000000')

    def test_bsr_gvr_rounding_and_bids_noncomparable_difference_not_corrections(self):
        self.assertEqual(self.rows['BSR']['missingFundImpact']['namedCounterfactuals'][0]['changeFromSelectedCaseVnd'],'1')
        f=self.rows['GVR']['missingFundImpact']
        self.assertEqual(f['displayResolutionVndNotRoundingErrorBound'],'10000000')
        f=self.rows['BID']['missingFundImpact']
        self.assertEqual(f['nonComparableParentVsExistingGroupDeductionDifferenceVnd'],'77088000000')
        self.assertFalse(f['differenceIsCorrection'])

    def test_sensitivity_contains_case_and_tax_attribution_not_summed(self):
        for r in self.rows.values():
            lo,hi=map(number,(r['combinedNamedAxesSensitivity']['minimumVnd'],r['combinedNamedAxesSensitivity']['maximumVnd']))
            self.assertLessEqual(lo,number(r['workingCaseCalculationVnd']))
            self.assertGreaterEqual(hi,number(r['workingCaseCalculationVnd']))
            self.assertFalse(r['combinedNamedAxesSensitivity']['coversUnknownFundsOrAllFutureCycles'])
            self.assertFalse(r['selectedOperatingCaseIncidenceEnvelope']['completeEconomicOrFundBound'])

    def test_rejected_bank_addbacks_not_reintroduced_into_selected_policy_stress(self):
        for r in self.rows.values():
            if r['ticker'] not in ['BID','CTG','HDB','LPB','SHB','SSB','STB','VIB','VPB']:
                continue
            for stress in r['operatingStressesWithinSelectedPolicy']:
                for a in stress['adjustments']:
                    if a['id'].endswith('total-credit-proxy') or a['id'].endswith('recoveries-mean'):
                        self.assertLessEqual(number(a['pretaxVnd']),0)
        self.assertLessEqual(number(self.rows['STB']['combinedNamedAxesSensitivity']['maximumVnd']),number('5939111000000'))

    def test_source_operands_and_period_scope_are_visible(self):
        for r in self.rows.values():
            for a in r['selectedAdjustments']:
                self.assertTrue(a['readingIds'] or a['additionalOperandReadingIds'] or a['id'].endswith('total-credit-proxy'))
                self.assertNotIn('incidenceEnvelope',a)
                self.assertEqual(number(a['selectedAfterTaxCommonDeltaVnd']),number(a['pretaxVnd']))
                lo,hi=map(number,(a['selectedDeltaIncidenceEnvelope']['minimumVnd'],a['selectedDeltaIncidenceEnvelope']['maximumVnd']))
                self.assertLessEqual(lo,number(a['selectedAfterTaxCommonDeltaVnd']))
                self.assertGreaterEqual(hi,number(a['selectedAfterTaxCommonDeltaVnd']))
            for ref in r['sourceReadingRefs']:
                self.assertTrue(ref['id'].startswith(r['ticker']+'-'))
                b.verify_pin(b.ROOT/ref['pdfPath'],ref['sha256'])
                self.assertIn(ref['economicPeriod'],['FY2025','FY2024'])

    def test_prior_source_model_hashes_and_current_output_pins(self):
        m=b.load(b.OUT/'manifest.json')
        for path,h in m['inputPins'].items():
            b.verify_pin(b.ROOT/path,h)
        for member in m['outputs']:
            b.verify_pin(b.OUT/member['path'],member['sha256'])

    def test_rebuild_deterministic(self):
        paths=[b.OUT/n for n in ['summary.json','manifest.json','REPORT.md']]
        hashes=[b.sha(p) for p in paths]
        b.build()
        self.assertEqual([b.sha(p) for p in paths],hashes)

    def test_no_acceptance_authority_or_criteria_changes(self):
        for r in self.rows.values():
            self.assertIsNone(r['acceptedNormalizedCommonEarningsVnd'])
            self.assertIsNone(r['acceptedEps'])
            for field in ['financialCriteriaOrWeightsChanged','newMaterialityToleranceIntroduced','sourceAdmissionGranted',
                          'productionScoringAuthorized','navAuthorized','tradingAuthorized','requiresNewPersonalOwnerEvidence']:
                self.assertFalse(r[field])
            self.assertNotIn('NO_QUALIFIED_SELECTED_ESTIMATE',r['blockers'])


class MathAndGuards(unittest.TestCase):
    def test_independent_attribution_prevents_offsetting_positive_and_negative(self):
        aa=[dict(id='gain',pretaxVnd='100'),dict(id='loss',pretaxVnd='-100')]
        e=independent_envelope('1000',aa,max_tax='.2',standalone=False)
        self.assertEqual(e['minimumVnd'],'900')
        self.assertEqual(e['maximumVnd'],'1100')

    def test_standalone_no_nci_uncertainty(self):
        e=independent_envelope('1000',[dict(id='a',pretaxVnd='-100')],max_tax='0',standalone=True)
        self.assertEqual(e['minimumVnd'],e['maximumVnd'])

    def test_duplicate_and_nonfinite_inputs_block(self):
        a=dict(id='same',pretaxVnd='-10')
        with self.assertRaisesRegex(ValueError,'DUPLICATE'):
            earnings('100',[a,a],tax='0',common_weight='1')
        for value in ['NaN','Infinity',123]:
            with self.assertRaises(ValueError):
                number(value)

    def test_invalid_tax_and_ownership_block(self):
        for t,w in [('-1','1'),('1.1','1'),('0','1.1')]:
            with self.assertRaises(ValueError):
                earnings('1',[],tax=t,common_weight=w)
        with self.assertRaises(ValueError):
            earnings('1',[dict(id='bad-owner',pretaxVnd='1',provenCommonWeight='2')],tax='0',common_weight='1')

    def test_hash_corruption_blocks(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'source';p.write_bytes(b'original');h=b.sha(p);p.write_bytes(b'changed')
            with self.assertRaisesRegex(ValueError,'PINNED_INPUT_OR_SOURCE_CHANGED'):
                b.verify_pin(p,h)


if __name__=='__main__':
    unittest.main()
