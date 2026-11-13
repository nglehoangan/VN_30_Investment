import unittest,json,copy,sys
from pathlib import Path
from decimal import Decimal as D
sys.dont_write_bytecode=True
from liquidity import cash_available,coverage,stress_cfo,current_gate
O=Path(__file__).resolve().parent
read=lambda p:json.loads((O/p).read_text())
class LiquidityTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.c=read('S2_LIQUIDITY_CALCULATIONS.json');cls.a=read('S2_ACCEPTANCE.json')
 def current_assets(self):return [x for x in self.c['assets'] if x['scope']=='GROUP' and x['asOf']=='2026-09-30']
 def test_unknown_excluded_not_restricted(self):
  a=self.current_assets();self.assertEqual(cash_available(a,'GROUP','2026-09-30'),D('3191249998'));self.assertEqual(next(x for x in a if x['id']=='GROUP_Q3_term_deposits_current')['classification'],'UNKNOWN')
 def test_posted_collateral_excluded(self):self.assertTrue(all(x['eligibleForStressVnd']=='0' for x in self.c['assets'] if x['classification']=='RESTRICTED'))
 def test_duplicate_asset_rejected(self):
  a=self.current_assets()
  with self.assertRaisesRegex(ValueError,'DUPLICATE'):cash_available(a+[a[0]],'GROUP','2026-09-30')
 def test_parent_group_isolation(self):
  with self.assertRaisesRegex(ValueError,'SCOPE_DATE'):cash_available(self.current_assets(),'PARENT','2026-09-30')
 def test_dates_not_merged(self):
  with self.assertRaisesRegex(ValueError,'SCOPE_DATE'):cash_available(self.current_assets(),'GROUP','2025-12-31')
 def test_bad_status_rejected(self):
  a=copy.deepcopy(self.current_assets());a[0]['classification']='ASSUMED_AVAILABLE'
  with self.assertRaisesRegex(ValueError,'INVALID_CLASSIFICATION'):cash_available(a,'GROUP','2026-09-30')
 def test_no_cash_subtotal_double_count(self):
  a=self.current_assets();parts=sum(D(x['amountVnd']) for x in a if x['id'] in ['GROUP_Q3_cash_on_hand','GROUP_Q3_bank_cash','GROUP_Q3_cash_in_transit','GROUP_Q3_cash_equivalents']);self.assertEqual(parts,D('3611993886527'))
 def test_interest_paid_added_back_once(self):
  z=stress_cfo(cfo='100',interest_paid='7',revenue='200',gross_profit='90',inventory='30',decline='0',margin_compression='0',inventory_lock='0');self.assertEqual(D(z['preFutureInterestCfoVnd']),D(107));self.assertEqual(coverage(z['preFutureInterestCfoVnd'],'17')['surplusVnd'],'90')
 def test_shock_cash_waterfall(self):
  z=stress_cfo(cfo='100',interest_paid='7',revenue='200',gross_profit='90',inventory='30',decline='.25',margin_compression='.03',inventory_lock='.20');self.assertEqual(D(z['preFutureInterestCfoVnd']),D(74));self.assertEqual(z['taxRelief'],'0')
 def test_invalid_shock(self):
  with self.assertRaisesRegex(ValueError,'INVALID_SHOCK'):stress_cfo(cfo='1',interest_paid='0',revenue='1',gross_profit='1',inventory='0',decline='1.1',margin_compression='0',inventory_lock='0')
 def test_declared_dividend_distinct_from_paid(self):
  o=next(x for x in self.c['obligationSchedule'] if x['id']=='GROUP_oct28_declared_2026_interim');self.assertEqual(D(o['amountVnd']),D(2500)*D('2089955445'));self.assertEqual(o['latestPaymentDate'],'2026-11-26');self.assertFalse(any(D(x['amountVnd'] or 0)==D('3901207226290') for x in self.c['obligationSchedule']))
 def test_current_tail_not_zero(self):
  for x in self.c['obligationSchedule']:
   if x['id'] in ['Q3_leases','Q3_signed_commitments']:self.assertIsNone(x['amountVnd'])
 def test_long_maturity_not_short(self):
  self.assertEqual(next(x for x in self.c['obligationSchedule'] if x['id']=='GROUP_Q3_long_debt')['bucket'],'DUE_2030')
 def test_no_discretionary_obligation(self):self.assertFalse(any(x['kind']=='DISCRETIONARY_CAPEX' for x in self.c['obligationSchedule']))
 def test_negative_cfo_not_lost(self):
  x=next(x for x in self.c['scenarios'] if x['id']=='GROUP_TTM_2026_09_STRESS_25');self.assertGreater(D(x['negativeOperatingCashNeedVnd']),0);self.assertEqual(D(x['calculation']['resourcesVnd']),0)
 def test_no_unknown_deposits_in_base_or_stress(self):self.assertTrue(all(not x['assumptions']['unknownDepositsIncluded'] for x in self.c['scenarios']))
 def test_generous_diagnostic_fails(self):
  z=self.c['generousDiagnostic']['calculation'];self.assertLess(D(z['coverage']),1);self.assertLess(D(z['surplusVnd']),0)
 def test_sensitivity_not_authorization(self):self.assertTrue(all(not x['admissibleConservativeCase'] for x in self.c['depositSensitivity']))
 def test_passed_tests_do_not_close(self):self.assertEqual(current_gate(stress_covers=False,complete_obligations=True,timing_verified=True,availability_verified=True,validation_passed=True),'BLOCKING')
 def test_missing_tail_cannot_close(self):self.assertEqual(current_gate(stress_covers=True,complete_obligations=False,timing_verified=True,availability_verified=True,validation_passed=True),'BLOCKING')
 def test_full_supported_case_can_close(self):self.assertEqual(current_gate(stress_covers=True,complete_obligations=True,timing_verified=True,availability_verified=True,validation_passed=True),'CLOSED')
 def test_new_status_not_owner_approval(self):
  self.assertEqual(self.a['status'],'BLOCKING');self.assertEqual(self.a['S1Status'],'CLOSED_UNCHANGED');self.assertFalse(self.a['formalAdmission'] or self.a['VNM17Promoted'] or self.a['scoresWritten'])
 def test_no_scores_from_ratio(self):self.assertTrue(all(x is None for x in self.c['scores'].values()))
 def test_ttm_cfo_replay(self):self.assertEqual(D(self.c['flows']['GROUP_TTM_2026_09']['cfo']),D('8668137048520')+D('7745821607312')-D('7007793807262'))
if __name__=='__main__':unittest.main()
