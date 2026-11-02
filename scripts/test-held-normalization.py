#!/usr/bin/env python3
"""Financial identities, failure cases and actual retained 11-issuer integration."""
import importlib.util
import json
import unittest
from decimal import Decimal, getcontext
from pathlib import Path
from unittest.mock import patch
from lib.held_normalization import number, owner_cash, present_value, residual_income, loan_charge

getcontext().prec=50
D=Decimal
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/held-normalization-v1'
spec=importlib.util.spec_from_file_location('builder',ROOT/'scripts/build-held-normalization.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)


class Arithmetic(unittest.TestCase):
    def test_decimal_rejects_lossy_unknown_and_nonfinite(self):
        for x in [None, True, 0.1, 'NaN','Infinity']:
            with self.subTest(value=x),self.assertRaises(ValueError):number(x)

    def test_zero_growth_owner_cash_matches_perpetuity(self):
        m=owner_cash('100','.8','0','.2','.15','0')
        self.assertLess(abs(number(m['equityValue'])-D(80)/D('.15')),D('.000001'))

    def test_growth_investment_is_not_free(self):
        funded=owner_cash('100','.8','.05','.2','.15','.02')
        for y in funded['years']:
            self.assertLessEqual(abs(number(y['growthFunding'])-number(y['earnings'])*D('.25')),D('.000001'))
            self.assertLessEqual(abs(number(y['commonCash'])-number(y['earnings'])*D('.55')),D('.000001'))
        self.assertEqual(funded['cashDebtAdjustment'],'0')

    def test_invalid_owner_cash_blocks(self):
        cases=[('-1','.8','.05','.2','.15','.02'),('100','1.1','.05','.2','.15','.02'),('100','.8','.2','.2','.15','.02'),('100','.8','.05','.2','.02','.02'),('100','.8','.01','.2','.15','.02'),('100','.1','.05','.2','.15','.02')]
        for c in cases:
            with self.subTest(case=c),self.assertRaises(ValueError):owner_cash(*c)

    def test_fair_return_rim_equals_book(self):
        m=residual_income('1000','150','.05','.15','.02')
        self.assertEqual(number(m['equityValue']),D(1000))
        self.assertEqual(number(m['ddmCrosscheck']),D(1000))

    def test_no_growth_rim_equals_earnings_perpetuity(self):
        m=residual_income('1000','200','0','.15','0')
        self.assertLess(abs(number(m['equityValue'])-D(200)/D('.15')),D('.000001'))

    def test_rim_cannot_distribute_unfunded_growth(self):
        for growth in ['.2','-.01']:
            with self.assertRaises(ValueError):residual_income('1000','100',growth,'.15','.02')

    def test_residual_income_negative_spread_and_clean_surplus(self):
        m=residual_income('1000','80','.02','.15','.01')
        self.assertLess(number(m['equityValue']),D(1000))
        for y in m['years']:
            self.assertEqual(number(y['earnings']),number(y['retained'])+number(y['dividends']))
        self.assertEqual(m['equityValue'],m['ddmCrosscheck'])

    def test_loan_rate_uses_exposure_weight_not_arithmetic_rates(self):
        rows=[dict(year=2023,opening='100',closing='100',charge='1'),dict(year=2024,opening='100',closing='300',charge='4'),dict(year=2025,opening='300',closing='500',charge='12')]
        rate,target=loan_charge(rows,'400','1')
        self.assertEqual(rate,D(17)/D(700));self.assertEqual(target,rate*400)

    def test_loan_missing_or_discontinuous_history_blocks(self):
        rows=[dict(year=2023,opening='100',closing='100',charge='1'),dict(year=2024,opening='101',closing='300',charge='4'),dict(year=2025,opening='300',closing='500',charge='12')]
        for xs in [rows,rows[:2]]:
            with self.assertRaises(ValueError):loan_charge(xs,'400','1')

    def test_discounted_loss_is_not_dropped(self):
        self.assertEqual(present_value(['-110','121'],'.1'),D(0))


class RetainedCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.outputs=builder.build()
        cls.issuers={t:json.loads(cls.outputs[f'issuers/{t}.json']) for t in ['FPT','GAS','HPG','MBB','MWG','SSI','TCB','VCB','VHM','VPL','VRE']}

    def test_exact_reproducible_actual_package(self):
        for name,content in self.outputs.items():
            with self.subTest(file=name):self.assertEqual((OUT/name).read_text(),content)

    def test_source_hash_mismatch_rejects_application(self):
        original=builder.digest
        def wrong_source(path):
            return '0'*64 if str(path).endswith('.pdf') else original(path)
        with patch.object(builder,'digest',side_effect=wrong_source),self.assertRaisesRegex(ValueError,'SOURCE_HASH_MISMATCH'):builder.build()

    def test_unsupported_source_period_unit_review_date_and_duplicates_block(self):
        original_loads=json.loads
        cases=[('sourcePdf','data/manual-download/VHM/VHM_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf','EXACT_READING_ISSUER_SOURCE_BINDING_REQUIRED'),('fiscalYear',2027,'SUPPORTED_ISSUER_AND_PERIOD_REQUIRED'),('currencyMultiplier','1000000','READING_UNIT_REPLAY_MISMATCH'),('reviewedOn','2027-01-01','EXPLICIT_REVIEW_DATE_BINDING_REQUIRED'),('duplicate',None,'UNIQUE_READING_IDS_REQUIRED')]
        for key,value,error in cases:
            def tamper(raw,*args,**kwargs):
                data=original_loads(raw,*args,**kwargs)
                if isinstance(data,dict) and data.get('contract')=='held-normalization-inputs-v1':
                    if key=='duplicate':data['readings'].append(dict(data['readings'][0]))
                    else:data['readings'][0][key]=value
                return data
            with self.subTest(mutation=key),patch.object(builder.json,'loads',side_effect=tamper),self.assertRaisesRegex(ValueError,error):builder.build()

    def test_all_production_and_formal_admission_remain_false(self):
        for t,i in self.issuers.items():
            with self.subTest(ticker=t):
                self.assertFalse(any(i['acceptance'].values()))
                self.assertFalse(i['historicalAsKnownReconstruction'])
                for s in i['scenarios']:
                    self.assertFalse(s['buySellAuthority']);self.assertIsNone(s['acceptedFairValuePerShare'])

    def test_all_actual_scenarios_are_ordered_and_sourced(self):
        for t,i in self.issuers.items():
            with self.subTest(ticker=t):
                profits=[number(s['normalization']['scenarioCommonProfit']) for s in i['scenarios']]
                self.assertEqual(profits,sorted(profits))
                ids={r['id'] for r in i['checkedNoteReadings']}
                for s in i['scenarios']:
                    for a in s['normalization']['adjustments']:
                        self.assertTrue(set(a['sourceReadingIds'])<=ids)
                if t!='VHM':
                    vals=[number(s['valuation']['equityValue']) for s in i['scenarios']]
                    self.assertEqual(vals,sorted(vals))

    def test_common_profit_is_not_group_npat(self):
        f=self.issuers['FPT']['groupToCommonBridge']
        self.assertEqual(number(f['groupProfit'])-number(f['reportedCommonProfit']),D('2366379528902'))
        for i in self.issuers.values():
            self.assertFalse(i['groupToCommonBridge']['proxyIsOwnershipProof'])

    def test_bank_nci_deducted_once_and_funding_not_subtracted(self):
        for t,expected in [('MBB','136136030000000'),('TCB','170044504000000'),('VCB','224487205000000'),('SSI','31936133616052')]:
            with self.subTest(ticker=t):
                i=self.issuers[t];self.assertEqual(i['commonBook'],expected)
                for s in i['scenarios']:
                    self.assertEqual(s['valuation']['fundingDebtAdjustment'],'0')
                    self.assertEqual(s['valuation']['crosscheckDifference'],'0')

    def test_vcb_preserves_nonloan_risk_and_removes_interbank_benefit_once(self):
        i=self.issuers['VCB'];c=i['bankCreditNormalization']
        self.assertEqual(c['retainedOtherCreditExpense'],'2115523000000')
        deltas=i['scenarios'][1]['normalization']['adjustments']
        self.assertEqual(len(deltas),3)
        self.assertEqual(deltas[2]['pretaxVnd'],'-1000000000000')
        self.assertEqual(c['history'][0]['charge'],'9665574000000')

    def test_tcb_margin_is_not_silently_loan_charge(self):
        i=self.issuers['TCB'];c=i['bankCreditNormalization']
        self.assertEqual(c['history'][0]['charge'],'4208730000000')
        self.assertEqual(c['history'][2]['charge'],'4475370000000')
        self.assertFalse(c['populationQualified'])

    def test_ssi_hedge_legs_net_and_unknown_fund_separate(self):
        s=self.issuers['SSI']['scenarios'][1]['normalization']
        self.assertEqual(s['adjustments'][0]['pretaxVnd'],'-94667248007')
        self.assertGreater(number(s['additionalUnestimatedFundAssumption']),0)

    def test_vre_capital_transfer_removed_not_rental_revenue(self):
        i=self.issuers['VRE'];s=i['scenarios'][1]['normalization']
        self.assertEqual(s['adjustments'][0]['pretaxVnd'],'-1891049000000')
        source=i['checkedNoteReadings'][0]
        self.assertIn('dinh_chinh',source['sourcePdf']);self.assertEqual(source['physicalPage'],43)

    def test_vpl_bond_addback_is_sensitivity_not_full_base(self):
        ss=self.issuers['VPL']['scenarios']
        self.assertEqual([s['normalization']['adjustments'][0]['pretaxVnd'] for s in ss],['0','929171000000','1858342000000'])
        history=self.issuers['VPL']['cashHistory']
        self.assertLess(number(next(x for x in history if x['year']==2025)['cfo']),0)

    def test_vhm_project_rnav_missing_not_backfilled_by_book(self):
        for s in self.issuers['VHM']['scenarios']:
            self.assertIsNone(s['valuation']['equityValue'])
            self.assertFalse(s['crosscheck']['debtSubtractedAgain'])
        self.assertEqual(self.issuers['VHM']['commonBook'],'238079067000000')

    def test_missing_cash_history_not_zero(self):
        row=next(x for x in self.issuers['VRE']['cashHistory'] if x['year']==2023)
        self.assertIsNone(row['reportedPostAcquisitionCash'])

    def test_debt_diagnostics_never_splice_vintages_or_grant_net_debt(self):
        for i in self.issuers.values():
            d=i['debtReview'];self.assertIsNone(d['qualifiedNetDebt']);self.assertIsNone(d['unrestrictedCash'])
            for s in d['observedSnapshots']:
                self.assertFalse(s['diagnosticIsQualifiedNetDebt'])
                if not s['sameSourceVintage']:self.assertIsNone(s['diagnosticBorrowingsMinusReportedCash'])
            for r in d['repaymentSensitivity']:self.assertFalse(r['actualMaturityEvidence'])

    def test_weighted_listed_and_pending_rights_not_promoted(self):
        for i in self.issuers.values():
            self.assertFalse(i['weightedSharesAreCurrentOutstanding'])
            self.assertFalse(i['currentShareReferences']['denominatorAccepted'])
            for s in i['scenarios']:
                for r in s['shareReferences']:self.assertFalse(r['actionBridgeVerified'])
        tcb=self.issuers['TCB']['currentShareReferences']
        self.assertNotEqual(tcb['listed']['value'],tcb['outstanding']['value'])

    def test_nine_cell_sensitivity_holds_base_other_inputs(self):
        for t,i in self.issuers.items():
            grid=i['independentInputSensitivity']
            if t=='VHM':
                self.assertEqual(grid,[])
            else:
                self.assertEqual(len(grid),9)
                self.assertEqual(grid[4]['equityValue'],i['scenarios'][1]['valuation']['equityValue'])

    def test_actual_cash_dcf_matches_long_explicit_cash_series(self):
        for t,i in self.issuers.items():
            for s in i['scenarios']:
                m=s['valuation']
                if m['model']!='CONDITIONAL_COMMON_CASH_DCF':continue
                r=number(s['assumptions']['discount']);g=number(s['assumptions']['terminalGrowth'])
                # Numerically sum 1000 terminal cash payments, without using a terminal-value formula.
                pv=sum((number(y['commonCash'])/(1+r)**y['year'] for y in m['years']),D(0))
                cash=number(m['terminalCash'])
                for year in range(6,1006):
                    pv+=cash/(1+r)**year;cash*=1+g
                with self.subTest(ticker=t,scenario=s['name']):
                    self.assertLess(abs(pv-number(m['equityValue'])),D('.0001'))

    def test_vhm_cross_vintage_debt_cash_difference_stays_null(self):
        snap=self.issuers['VHM']['debtReview']['observedSnapshots'][0]
        self.assertFalse(snap['sameSourceVintage'])
        self.assertIsNone(snap['diagnosticBorrowingsMinusReportedCash'])

    def test_source_currency_units_replay(self):
        cfg=json.loads((OUT/'checked-inputs.json').read_text())
        for r in cfg['readings']:
            with self.subTest(id=r['id']):self.assertEqual(number(r['sourceLexicalValue'])*number(r['currencyMultiplier']),number(r['valueVnd']))


if __name__=='__main__':unittest.main(verbosity=2)
