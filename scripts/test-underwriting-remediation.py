#!/usr/bin/env python3
import unittest
import json
import hashlib
from pathlib import Path
from lib.underwriting_remediation import (fund_bridge,share_anchor,qualify_dated_denominator,capex_partition,restricted_pool,debt_bridge,loan_quality)

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/vn30-underwriting-v2'
class Guards(unittest.TestCase):
    def test_bsr_explicit_fy25_increment_once(self):
        self.assertEqual(fund_bridge('5213612063223','4061012360','374103026199',additional_period='FY2025',attribution='PARENT_COMMON')['commonProfitVnd'],'4835448024664')
    def test_fund_ambiguous_year_blocks(self):
        with self.assertRaises(ValueError):fund_bridge('100','2','3',additional_period='PRIOR_PERIOD',attribution='PARENT_COMMON')
    def test_fund_group_not_common(self):
        with self.assertRaises(ValueError):fund_bridge('100','2','3',additional_period='FY2025',attribution='GROUP_WITH_NCI')
    def test_msn_preference_kept_separate(self):
        r=share_anchor('1460374611','1460374611',potential='74576470')
        self.assertEqual(r['knownInstrumentAsConvertedShares'],'1534951081');self.assertIsNone(r['fullyDilutedShares'])
    def test_vre_treasury(self):
        self.assertEqual(share_anchor('2328818410','2272318410')['treasuryShares'],'56500000')
    def test_ssi_treasury(self):
        self.assertEqual(share_anchor('3003293801','3001302333')['treasuryShares'],'1991468')
    def test_restricted_not_extra_shares(self):
        self.assertEqual(share_anchor('1885727648','1885727648',restricted='36828747')['treasuryShares'],'0')
    def test_unknown_dilution_not_zero(self):
        self.assertIsNone(share_anchor('100','100')['fullyDilutedShares'])
    def test_unknown_outstanding_not_inferred(self):
        self.assertIsNone(share_anchor('100',None)['treasuryShares'])
    def test_invalid_share_counts(self):
        for a,b in [('100','101'),('0','0'),('1.5','1'),('100','1.5')]:
            with self.subTest(a=a,b=b),self.assertRaises(ValueError):share_anchor(a,b)
    def test_price_date_bridge_blocks(self):
        r=qualify_dated_denominator('2026-09-30','2026-10-30',action_coverage=False,price_basis='UNDECLARED',source_bound=True)
        self.assertEqual(len(r['reasons']),2);self.assertFalse(r['tradingAuthority'])
    def test_future_share_anchor_blocks(self):
        r=qualify_dated_denominator('2026-11-01','2026-10-30',action_coverage=True,price_basis='UNADJUSTED_EXECUTION',source_bound=True)
        self.assertIn('LOOKAHEAD_SHARE_ANCHOR',r['reasons'])
    def test_valid_research_never_production(self):
        r=qualify_dated_denominator('2026-09-30','2026-10-30',action_coverage=True,price_basis='DOCUMENTED_SAME_SHARE_BASIS',source_bound=True)
        self.assertEqual(r['status'],'RESEARCH_REFERENCE_ONLY');self.assertFalse(r['productionAdmissible'])
    def test_missing_source_binding(self):
        r=qualify_dated_denominator('2026-09-30','2026-10-30',action_coverage=True,price_basis='DOCUMENTED_SAME_SHARE_BASIS',source_bound=False)
        self.assertIn('SOURCE_BINDING_UNVERIFIED',r['reasons'])
    def test_missing_capex_split_not_zero_maintenance(self):
        r=capex_partition('25748320476719',[])
        self.assertIsNone(r['maintenanceEstimateVnd']);self.assertFalse(r['complete'])
    def test_cip_and_da_not_cash(self):
        for s in ['CIP_STOCK','DEPRECIATION','CAPITALIZED_ADDITION']:
            with self.subTest(s=s),self.assertRaises(ValueError):capex_partition('100',[dict(id='a',semantic=s,matchedPeriodScope=True,classification='EXPANSION',value='50')])
    def test_duplicate_cash_component(self):
        c=dict(id='a',semantic='CASH_FLOW',matchedPeriodScope=True,classification='EXPANSION',value='50')
        with self.assertRaises(ValueError):capex_partition('100',[c,c])
    def test_cash_overallocation(self):
        with self.assertRaises(ValueError):capex_partition('10',[dict(id='a',semantic='CASH_FLOW',matchedPeriodScope=True,classification='EXPANSION',value='50')])
    def test_term_restriction_not_cash_eq(self):
        with self.assertRaises(ValueError):restricted_pool('100','20',pool='CASH_EQ',restricted_pool_name='TERM_DEPOSITS')
    def test_unknown_restrictions_not_zero(self):
        self.assertIsNone(restricted_pool('100',None,pool='CASH',restricted_pool_name='CASH'))
    def test_debt_residual_is_not_balancing_entry(self):
        r=debt_bridge('12873538000000','5628150000000','9230064000000','11592338000000')
        self.assertEqual(r['unexplainedNoncashOrScopeResidualVnd'],'2320714000000');self.assertFalse(r['balancingEntryAuthorized'])
    def test_matched_loan_quality(self):
        self.assertEqual(loan_quality('100',{'3':'1','4':'1','5':'2'},'5',same_population_date=True)['coverageRatio'],'1.25')
    def test_total_credit_charge_not_reserve_population(self):
        with self.assertRaises(ValueError):loan_quality('100',{'3':'1','4':'1','5':'2'},'5',same_population_date=False)
    def test_missing_npl_group(self):
        with self.assertRaises(ValueError):loan_quality('100',{'3':'1','5':'2'},'5',same_population_date=True)
    def test_artifact_replay_all30_and_no_authority(self):
        m=json.loads((OUT/'manifest.json').read_text());self.assertEqual(m['issuerCount'],30)
        for row in m['issuers']:
            p=OUT/row['issuerPath'];self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),row['sha256'])
            d=json.loads(p.read_text());self.assertFalse(d['productionAdmissible']);self.assertIsNone(d['acceptedValuePerShareVnd'])
    def test_bsr_source_variants_preserved(self):
        d=json.loads((OUT/'fund-bridge-successor.json').read_text())['issuers']['BSR']
        self.assertEqual(d['q3MinusH1SplitVnd'],'1');self.assertEqual(d['sourceReadings']['correctedH1ParentCompanyFundVnd'],'372170100000')
    def test_gvr_rounded_parent_plan_not_exact_final(self):
        d=json.loads((OUT/'fund-bridge-successor.json').read_text())['issuers']['GVR']['parentCompanyAGMRewardWelfareAllocation']
        self.assertEqual(d['nominalVnd'],'30130000000');self.assertIsNone(d['exactVnd']);self.assertFalse(d['fullGroupCompletenessProven'])
    def test_gvr_parent_dash_not_zero(self):
        d=json.loads((OUT/'fund-bridge-successor.json').read_text())['issuers']['GVR']
        self.assertIsNone(d['parentCompanyFinalAllocationVnd']);self.assertEqual(d['commonAfterPublishedAllocationVnd'],'4711931218538')

if __name__=='__main__':unittest.main()
