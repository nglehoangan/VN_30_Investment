import copy,importlib.util,json,unittest
from pathlib import Path
from unittest.mock import patch
from lib.vic_rnav import held_stake_revaluation,incremental_obligation,project_npv,common_rnav_preview,REQUIRED_GROUPS
s=importlib.util.spec_from_file_location('b',Path(__file__).with_name('build-vic-rnav.py'))
b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
class Rnav(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.d=b.build()
    def test_actual_book_to_parent(self):
        x=self.d['bookBridge'];self.assertEqual(x['parentBookEquityVnd'],'147566342000000')
        self.assertEqual(int(x['groupEquityVnd'])-int(x['nciBookVnd']),int(x['parentBookEquityVnd']))
        self.assertTrue(x['treasuryAlreadyDeducted']);self.assertFalse(x['bookNciEqualsEconomicNci'])
    def test_actual_vre_revaluation(self):
        self.assertEqual(held_stake_revaluation('9094520000000','14392613000000',value_role='FAIR_VALUE_OF_HELD_STAKE'),'5298093000000')
        self.assertEqual(self.d['partialGroupFairBridgeBeforeUnknownAdjustmentsVnd'],'156787028000000')
        self.assertFalse(self.d['partialGroupFairBridgeIsAcceptedRnav'])
    def test_no_second_stake_multiplier(self):
        with self.assertRaises(ValueError):held_stake_revaluation('9','14',value_role='FAIR_VALUE_OF_HELD_STAKE',apply_ownership_again=True)
    def test_budget_not_fair_value(self):
        for role in ['TOTAL_PROJECT_INVESTMENT','CHARTER_CAPITAL','CARRYING_VALUE','UNBILLED_SALES']:
            with self.assertRaises(ValueError):held_stake_revaluation('1','456639',value_role=role)
    def test_no_provision_or_forecast_double_deduction(self):
        for a,f in [(True,False),(False,True),(None,False)]:
            with self.assertRaises(ValueError):incremental_obligation('100',already_in_book=a,already_in_forecast=f,incremental_evidence='fixture')
    def test_unknown_incremental_exposure_not_zero(self):
        with self.assertRaises(ValueError):incremental_obligation('0',already_in_book=False,already_in_forecast=False,incremental_evidence=None)
        self.assertIsNone(self.d['debtAndObligations']['incrementalUnbookedObligationVnd'])
    def test_explicit_incremental_preview_only(self):
        self.assertEqual(incremental_obligation('100',already_in_book=False,already_in_forecast=False,incremental_evidence='synthetic-fixture'),'100')
    def flows(self):return [dict(year=2027,receipts='121',remainingConstruction='0',land='0',selling='0',projectTax='0')]
    def test_synthetic_npv_has_no_authority(self):
        x=project_npv(self.flows(),'.1',valuation_year=2025,rate_basis='EXPLICIT_PROJECT_DISCOUNT_ASSUMPTION')
        self.assertEqual(x['scenarioProjectNpvVnd'],'100')
        self.assertFalse(x['financialAssumptionsAccepted']);self.assertFalse(x['productionAuthority'])
    def test_capitalization_rate_cannot_be_wacc(self):
        with self.assertRaises(ValueError):project_npv(self.flows(),'.1146',valuation_year=2025,rate_basis='BORROWING_CAPITALIZATION_RATE')
    def test_missing_or_repeated_cashflow_schedule_rejected(self):
        for flows in [[],self.flows()*2,[dict(self.flows()[0],year=2025)]]:
            with self.assertRaises(ValueError):project_npv(flows,'.1',valuation_year=2025,rate_basis='EXPLICIT_PROJECT_DISCOUNT_ASSUMPTION')
    def test_actual_project_budgets_not_admitted(self):
        self.assertEqual(self.d['projects']['haLongInvestmentBudgetVnd'],'456639000000000')
        self.assertFalse(self.d['projects']['haLongBudgetIsFairValue'])
        self.assertEqual(self.d['projects']['qualifiedProjectNpvCount'],0)
    def test_cip_population_gap_retained(self):
        p=self.d['projects'];self.assertEqual(p['namedCipBookVnd'],'54375723000000')
        self.assertEqual(p['otherCipBookVnd'],'77399258000000')
        self.assertFalse(p['fullProjectPopulationDisclosed'])
    def test_cash_restrictions_not_full_qualified_cash(self):
        x=self.d['liquidity'];self.assertEqual(x['grossCashAndDepositsVnd'],'82165222000000')
        self.assertEqual(x['knownRoundedRestrictionsNominalVnd'],'7036000000000')
        self.assertEqual(x['nominalRemainderBeforeUnknownMaintenanceVnd'],'75129222000000')
        self.assertIsNone(x['qualifiedUnrestrictedCashVnd']);self.assertFalse(x['strictBoundClaimed'])
    def test_debt_and_provisions_separate(self):
        x=self.d['debtAndObligations'];self.assertEqual(x['reportedLoansLeasesAndExchangeBondsVnd'],'338501032000000')
        self.assertEqual(x['recognizedProvisionsAlreadyWithinLiabilitiesVnd'],'30674334000000')
        self.assertFalse(x['commitmentsMechanicallyAddedToDebt']);self.assertFalse(x['guaranteesAssumedZero'])
    def test_actual_common_rnav_blocked(self):
        self.assertIsNone(self.d['proposal']['proposedCommonRnavVnd'])
        self.assertEqual(len(self.d['proposal']['blockers']),7)
        for k in ['acceptedRnavVnd','acceptedCommonEquityValueVnd','acceptedValuePerShareVnd']:self.assertIsNone(self.d[k])
    def fixture(self):
        return [dict(group=g,coverageKeys=[g],commonDeltaVnd='0',evidenceIds=['synthetic'],commonAttributionQualified=True) for g in sorted(REQUIRED_GROUPS)]
    def test_complete_synthetic_bridge_still_only_preview(self):
        x=common_rnav_preview('100',self.fixture(),all_coverage_reconciled=True)
        self.assertTrue(x['readyForFinancialReview']);self.assertEqual(x['proposedCommonRnavVnd'],'100')
        for k in ['financialAcceptanceGranted','productionAuthority','navAuthority','tradingAuthority']:self.assertFalse(x[k])
    def test_missing_group_is_not_zero(self):
        x=common_rnav_preview('100',self.fixture()[:-1],all_coverage_reconciled=True)
        self.assertFalse(x['readyForFinancialReview']);self.assertIsNone(x['proposedCommonRnavVnd'])
    def test_subsidiary_and_asset_overlap_blocks(self):
        rows=self.fixture();rows[0]['coverageKeys']=['VHM_PROJECT'];rows[1]['coverageKeys']=['VHM_PROJECT']
        with self.assertRaises(ValueError):common_rnav_preview('100',rows,all_coverage_reconciled=True)
    def test_known_fair_zero_is_sourced_not_default(self):
        r=self.d['supportedRevaluations'][1];self.assertEqual(r['grossDeltaMillion'],'0')
        self.assertTrue(r['source']);self.assertIsNone(r['afterTaxCommonDeltaVnd'])
    def test_original_sources_and_discovery_pins(self):
        rows=b.load(b.OUT/'checked-evidence.json')['rows']
        self.assertEqual(len(rows),20)
        for r in rows:self.assertEqual(b.sha(b.ROOT/r['source']['pdfPath']),r['source']['sha256'])
        a=b.load(b.OUT/'acquisition-manifest.json')['rows']
        self.assertEqual(len(a),2)
        for r in a:
            self.assertEqual(r['httpStatus'],'200');self.assertEqual(b.sha(b.ROOT/r['discoveryPath']),r['discoverySha256'])
            original=b.load(b.ROOT/r['discoveryPath'])[int(r['discoveryPointer'][1:])]
            self.assertEqual(original['FileInfoID'],r['documentId'])
    def test_missing_fair_book_exposure_is_material_and_not_an_adjustment(self):
        self.assertEqual(self.d['bookExposureWithExplicitMissingFairValueVnd'],'47878800000000')
        self.assertTrue(all(r['commonDeltaVnd'] is None for r in self.d['candidateAdjustments']))
    def test_caption_variants_not_mapped_by_amount(self):
        r={x['id']:x for x in b.load(b.OUT/'checked-evidence.json')['rows']}
        self.assertEqual(r['VIC-RNAV-AR-CAPTION']['values']['vinhomesMetric'],'183100')
        self.assertIn('caption',r['VIC-RNAV-AR-CAPTION']['values'])
        self.assertNotIn('vinhomesMetric',self.d['projects'])
    def test_source_scope_date_unit_block(self):
        original=b.load
        for key,value in [('issuer','VFS'),('economicAsOf','2026-09-30'),('unit','BILLION_VND')]:
            def fake(path):
                x=original(path)
                if path.name=='checked-evidence.json':x['rows'][0][key]=value
                return x
            with patch.object(b,'load',side_effect=fake),self.assertRaises(ValueError):b.build()
if __name__=='__main__':unittest.main()
