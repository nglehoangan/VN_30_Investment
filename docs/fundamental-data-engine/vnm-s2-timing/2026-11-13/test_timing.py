import unittest,json,sys
from decimal import Decimal as D
from pathlib import Path
sys.dont_write_bytecode=True
from timing import bridge,observed_quarter,dated_cfo,can_upgrade_deposit,envelope
O=Path(__file__).resolve().parent
class TimingTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.j=json.loads((O/'S2_PRIMARY_STATEMENT_RECONCILIATION.json').read_text())
 def test_exact_bridge(self):self.assertEqual(bridge('8382960340','3901449812250','3901207226290','8625546300'),'8625546300')
 def test_conflicting_bridge_blocked(self):
  with self.assertRaisesRegex(ValueError,'CONFLICT'):bridge('8','3','2','10')
 def test_h1_q3_actual_split(self):self.assertEqual(observed_quarter('7745821607312','3473788102329','GROUP','GROUP'),'4272033504983')
 def test_parent_group_not_mixed(self):
  with self.assertRaisesRegex(ValueError,'SCOPE'):observed_quarter('10','5','GROUP','PARENT')
 def test_historical_cfo_never_guaranteed(self):self.assertIsNone(dated_cfo('9406164848570','2026-11-26','HISTORICAL_CFO'))
 def test_missing_future_date_not_filled(self):self.assertIsNone(dated_cfo('10',None,'VERIFIED_FUTURE_COMMITTED_RECEIPT'))
 def test_real_future_receipt_requires_own_date(self):self.assertEqual(dated_cfo('10','2026-11-26','VERIFIED_FUTURE_COMMITTED_RECEIPT'),'10')
 def test_identity_alone_not_deposit_access(self):self.assertFalse(can_upgrade_deposit(identity_verified=True,maturity_verified=False,free_use_verified=False,debtor_access_verified=False))
 def test_maturity_alone_not_access(self):self.assertFalse(can_upgrade_deposit(identity_verified=True,maturity_verified=True,free_use_verified=False,debtor_access_verified=True))
 def test_verified_subset_can_upgrade(self):self.assertTrue(can_upgrade_deposit(identity_verified=True,maturity_verified=True,free_use_verified=True,debtor_access_verified=True))
 def test_dividend_not_due_on_record_date(self):self.assertEqual(envelope('2026-11-12','2026-11-26','100','200','2027-09-30')['knownFixedDueVnd'],'0')
 def test_all_short_debt_not_assigned_to_dividend_day(self):
  e=envelope('2026-11-26','2026-11-26','100','200','2027-09-30');self.assertEqual(e['knownFixedDueVnd'],'100');self.assertEqual(e['currentDebtDueLowerVnd'],'0');self.assertEqual(e['currentDebtDueUpperVnd'],'200')
 def test_envelope_end_is_not_contract_date(self):self.assertFalse(next(x for x in self.j['obligations'] if x['id']=='CURRENT_BORROWINGS')['classificationEndIsContractDate'])
 def test_paid_dividend_not_readded(self):
  x=self.j['dividendLifecycleBridge'];self.assertFalse(x['historicalPaidDividendsAddedToNovember']);self.assertEqual(D(x['payableJune30Vnd'])-D(x['cashPaidQ3Vnd']),D(x['payableSep30Vnd']))
 def test_no_future_monthly_spread(self):self.assertFalse(self.j['operatingCashTimeSplit']['futureByDate']['equalMonthlyAllocationApplied']);self.assertIsNone(self.j['operatingCashTimeSplit']['futureByDate']['2026-11-26'])
 def test_commitment_rollforward_unknown_not_zero(self):self.assertIsNone(self.j['leaseAndCommitmentReview']['rollforward']['currentRemaining']);self.assertIsNone(self.j['leaseAndCommitmentReview']['rollforward']['remainingLeaseSchedule'])
 def test_capex_not_deducted_from_opening_commitments(self):self.assertFalse(self.j['leaseAndCommitmentReview']['subtractAllCashCapexFromOldCommitments'])
 def test_reported_cash_not_only_physical_cash(self):self.assertEqual(next(x for x in self.j['reportedValues'] if x['id']=='cash_and_equivalents')['valueVnd'],'3611993886527')
 def test_no_unknown_term_deposit_promotion(self):self.assertEqual(self.j['fourRequestedResults']['depositNewlyConfirmedAvailableCount'],0)
 def test_no_closure_or_score_from_accounting_ratio(self):self.assertGreater(D(self.j['reportedRatios']['currentRatio']),2);self.assertEqual(self.j['S2'],'BLOCKING');self.assertFalse(self.j['scoresWritten'] or self.j['databaseMutation'] or self.j['VNM17Promoted'])
if __name__=='__main__':unittest.main()
