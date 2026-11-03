"""Actual VIC parent/group, transaction and anti-double-count regressions."""
import copy
import importlib.util
import unittest
from pathlib import Path
from lib.vic_claim_bridge import number, claim_bases, scenario_weight, exclusions
spec=importlib.util.spec_from_file_location('vic_builder',Path(__file__).with_name('build-vic-parent-bridge.py'))
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)


class RetainedCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d=b.load(b.OUT/'decision.json')
        cls.r={r['id']:r for r in b.load(b.OUT/'checked-evidence.json')['rows']}

    def test_parent_standalone_not_group_parent_attribution(self):
        self.assertEqual(self.d['standaloneParentNpatVnd'],'944059000000')
        self.assertEqual(self.d['claims']['economicCommonProfitVnd'],'11349934000000')
        self.assertNotEqual(self.d['standaloneParentNpatVnd'],self.d['claims']['economicCommonProfitVnd'])
        self.assertEqual(number(self.d['groupNetIncomeVnd']),number(self.d['claims']['economicCommonProfitVnd'])+number(self.d['groupNciResultVnd']))

    def test_restriction_deducted_once_and_not_employee_leakage(self):
        c=self.d['claims']
        self.assertEqual(c['restrictedReinvestmentVnd'],'664743000000')
        self.assertEqual(c['distributableNumeratorVnd'],'10685191000000')
        self.assertFalse(c['restrictedIncomeIsNonOwnerLeakage'])
        for r in self.d['conditionalCases']:
            self.assertEqual(number(r['economicCommonCaseBeforeReinvestmentRestrictionVnd'])-number(r['grantAndNovatechDistributableCaseVnd']),number(c['restrictedReinvestmentVnd']))

    def test_new_novatech_and_movian_partial_group_pbt(self):
        self.assertEqual(self.d['partialGroupPbtAfterGrantAndNovatechVnd'],'-31011782000000')
        self.assertEqual(self.d['partialGroupPbtAfterAlsoMovianVnd'],'-32776782000000')
        self.assertFalse(self.d['partialPbtIsAcceptedNormalizedCommonEarnings'])

    def test_closing_reference_nominal_cases(self):
        cases={r['taxAssumption']:r for r in self.d['conditionalCases'] if r['referenceSnapshot']=='AT_2025-12-31'}
        self.assertEqual(number(cases['0']['grantAndNovatechDistributableCaseVnd']),number('-18384082442000'))
        self.assertEqual(number(cases['.2']['grantAndNovatechDistributableCaseVnd']),number('-12570227753600'))
        self.assertEqual(number(cases['0']['incrementalNovatechImpactVnd']),number('-17403870000000'))
        self.assertEqual(number(cases['0']['grantOnlyDistributableCaseVnd']),number('-980212442000'))

    def test_opening_closing_snapshots_do_not_prove_yearlong_allocation(self):
        self.assertEqual([r['scenarioWeight'] for r in self.d['ownerReferenceSnapshots']],['0.5062','0.506'])
        for s in self.d['ownerReferenceSnapshots']:
            self.assertFalse(s['exactEventDateWeightProven'])
            self.assertFalse(s['printedPercentageIsExactUnrounded'])
        self.assertTrue(self.d['unconditionalNamedComponentsEnvelope']['conditionalOwnershipReferencesCannotNarrowThisEnvelope'])

    def test_incomplete_old_model_not_admitted(self):
        self.assertEqual(self.d['predecessorVICModelStatus'],'GRANT_ONLY_MODEL_REJECTED_AS_INCOMPLETE_FOR_NORMALIZATION')
        self.assertIsNone(self.d['selectedAcceptedNormalizedCommonEarningsVnd'])
        self.assertIsNone(self.d['selectedAcceptedEps'])
        for r in self.d['conditionalCases']:
            self.assertFalse(r['financiallyAccepted'])
            self.assertFalse(r['exactVndEstimateClaimed'])

    def test_financial_gain_remaining_not_zeroed_or_called_recurring(self):
        self.assertEqual(self.d['unexcludedDisposalGainRemainderNominalVnd'],'3563679000000')
        self.assertFalse(self.d['remainingFinanceGainsAreQualifiedRecurring'])

    def test_donor_amount_difference_not_matching_proof(self):
        self.assertEqual(self.d['relatedPartyGrantVsPnlDifferenceVnd'],'54157000000')
        self.assertFalse(self.d['differenceIsProvenUnallocatedGrant'])
        self.assertEqual(self.r['VIC-G26-SPONSOR']['economicPeriod'],'H1_2026_AND_RESTATED_H1_2025')

    def test_owner_reserve_not_non_owner_leakage_and_no_historical_doublecount(self):
        r=self.d['reserveDisposition']
        self.assertEqual(r['parentPlanReserveVnd'],'5000000000')
        self.assertEqual(r['commonEarningsDeductionVnd'],'0')
        self.assertEqual(r['planParentNonOwnerAllocationVnd'],'0')
        self.assertIsNone(r['fullGroupNonOwnerLeakageVnd'])
        self.assertTrue(r['fy2025And2026MovementsAreSeparate'])
        self.assertFalse(r['uniqueEventMatchingProven'])

    def test_actual_named_envelope_is_not_complete_cycle_or_fund_bound(self):
        r=self.d['unconditionalNamedComponentsEnvelope']
        self.assertEqual(r['minimumVnd'],'-48528966000000')
        self.assertEqual(r['maximumVnd'],'10685191000000')
        self.assertFalse(r['completeFundOrCycleBound'])

    def test_scope_period_and_unit_misbindings_block(self):
        for scope,period,unit in [('STANDALONE_PARENT','FY2025','MILLION_VND'),('CONSOLIDATED','H1_2025','MILLION_VND'),('CONSOLIDATED','FY2025','VND')]:
            with self.subTest(scope=scope,period=period,unit=unit),self.assertRaisesRegex(ValueError,'SCOPE_PERIOD_UNIT'):
                b.quantity(self.r,'VIC-G25-PNL','pbt',scope=scope,period=period,unit=unit)

    def test_record_source_corruption_blocks(self):
        inventory=b.retained_source_inventory()
        r=copy.deepcopy(self.r['VIC-P25-PNL']);r['source']['sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'SOURCE_IDENTITY'):
            b.validate_reading(r,inventory)
        r=copy.deepcopy(self.r['VIC-P25-PNL']);r['multiplier']='1'
        with self.assertRaisesRegex(ValueError,'NATIVE_UNIT'):
            b.validate_reading(r,inventory)
        r=copy.deepcopy(self.r['VIC-H125-SUBSEQUENT']);r['source']['retrievedAt']='2025-06-30T00:00:00Z'
        with self.assertRaisesRegex(ValueError,'RECEIPT_TIME'):
            b.validate_reading(r,inventory)
        r=copy.deepcopy(self.r['VIC-P25-PNL']);r['source']['originalPublicationAt']='2025-12-31T00:00:00Z'
        with self.assertRaisesRegex(ValueError,'UNSUPPORTED_ORIGINAL'):
            b.validate_reading(r,inventory)

    def test_all_sources_and_code_output_hashes(self):
        m=b.load(b.OUT/'manifest.json')
        self.assertEqual(m['checkedRecordCount'],23)
        for p,h in m['inputPins'].items():self.assertEqual(b.sha(b.ROOT/p),h)
        for p,h in m['outputs'].items():self.assertEqual(b.sha(b.OUT/p),h)

    def test_deterministic_build_preserves_historical_artifacts(self):
        paths=[b.OUT/n for n in ['decision.json','REPORT.md','manifest.json']]
        before=[b.sha(p) for p in paths]
        prior=b.sha(b.PRIOR/'issuers/VIC.json')
        b.build()
        self.assertEqual([b.sha(p) for p in paths],before)
        self.assertEqual(b.sha(b.PRIOR/'issuers/VIC.json'),prior)

    def test_no_new_authority_or_owner_reconfirmation(self):
        for k in ['newPersonalOwnerEvidenceRequired','additionalParentReportRequiredForThisScope','sourceAuthorityPromoted','productionScoringAuthorized','navAuthorized','tradingAuthorized','ledgerPostingExecuted','criteriaOrWeightsChanged']:
            self.assertFalse(self.d[k])
        self.assertEqual(len(self.d['closureMatrix']),7)

    def test_license_cash_offset_and_rounding_variant_not_full_cash_or_pnl(self):
        r=self.d['licenseSettlementBridge']
        self.assertEqual(r['contractOriginatedPayableVnd'],'25198912000000')
        self.assertEqual(r['debtOffsetVnd'],'23400314000000')
        self.assertEqual(r['cashSettlementVnd'],'1798598000000')
        self.assertEqual(r['wholeBillionHeadlineMinusDetailedTransactionVnd'],'88000000')
        for key in ['totalFeeIsFullCashOutflow','totalFeeIsFullPnlExpense','closingOtherPayablesInferredZero']:
            self.assertFalse(r[key])

    def test_novatech_preference_asset_not_extra_earnings_or_market_value(self):
        r=self.d['novatechPreferenceClaim']
        self.assertEqual(r['demergerEffectiveDate'],'2025-08-22')
        self.assertEqual(r['standaloneTradingInvestmentCostVnd'],'1583614000000')
        self.assertIsNone(r['acceptedMarketValueVnd'])
        self.assertFalse(r['transactionProfitWaterfallProven'])


class EconomicGuards(unittest.TestCase):
    def row(self,**kw):
        r=dict(eventId='VIC-NOVATECH',amountVnd='100',scope='CONSOLIDATED',economicPeriod='FY2025',
               role='IDENTIFIED_PNL_INCOME_OR_GAIN',aggregateGroup='DISPOSAL_GAINS',aggregationLevel='COMPONENT')
        r.update(kw);return r

    def test_duplicate_same_economic_event_rejected(self):
        with self.assertRaisesRegex(ValueError,'DUPLICATE'):
            exclusions('1000',[self.row(),self.row()])

    def test_aggregate_and_component_rejected_in_both_orders(self):
        total=self.row(eventId='ALL-DISPOSALS',aggregationLevel='AGGREGATE')
        for rows in [[total,self.row()],[self.row(),total]]:
            with self.assertRaisesRegex(ValueError,'AGGREGATE_COMPONENT'):
                exclusions('1000',rows)

    def test_licensing_proceeds_reserve_and_restricted_claim_not_pnl_deductions(self):
        for role in ['LICENSE_SETTLEMENT_NOT_FULL_PNL','GROSS_SALE_CONSIDERATION','OWNER_RESERVE_TRANSFER','REINVESTMENT_RESTRICTION']:
            with self.subTest(role=role),self.assertRaisesRegex(ValueError,'NO_LICENSE'):
                exclusions('1000',[self.row(role=role)])

    def test_parent_scope_or_halfyear_cannot_be_substituted(self):
        for row in [self.row(scope='STANDALONE_PARENT'),self.row(economicPeriod='H1_2025')]:
            with self.assertRaisesRegex(ValueError,'SCOPE_AND_PERIOD'):
                exclusions('1000',[row])

    def test_holding_company_or_snapshot_cannot_become_event_fact(self):
        with self.assertRaisesRegex(ValueError,'EXACT_RECIPIENT'):
            scenario_weight(entity='VINFAST_AUTO',expected_entity='VINFAST_JSC',percent='50.65',effective_period='AT_2025-12-31',mode='CONDITIONAL_SCENARIO_NOT_PROVEN_ATTRIBUTION')
        with self.assertRaisesRegex(ValueError,'CANNOT_ADMIT'):
            scenario_weight(entity='VINFAST_JSC',expected_entity='VINFAST_JSC',percent='50.60',effective_period='AT_2025-12-31',mode='ADMITTED')

    def test_restriction_identity_and_negative_earnings_preserved(self):
        with self.assertRaisesRegex(ValueError,'EPS_IDENTITY'):
            claim_bases('100','10','80')
        self.assertEqual(exclusions('50',[self.row()]),'-50')

    def test_invalid_incidence_and_amounts_block(self):
        for tax,weight in [('1.1','1'),('0','1.1')]:
            with self.assertRaises(ValueError):exclusions('100',[self.row()],tax=tax,common_weight=weight)
        for value in [1,'NaN','Infinity']:
            with self.assertRaises(ValueError):number(value)


if __name__=='__main__':unittest.main()
