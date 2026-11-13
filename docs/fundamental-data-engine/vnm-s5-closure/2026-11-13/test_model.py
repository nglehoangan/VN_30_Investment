import unittest,json,copy
from pathlib import Path
from decimal import Decimal as D,getcontext
from model import value,operating_year,irr
getcontext().prec=45
O=Path(__file__).parent
I=json.loads((O/'S5_VALUATION_INPUTS.json').read_text());S=json.loads((O/'S5_SCENARIOS.json').read_text());E=json.loads((O/'S5_EXPECTED_RETURN.json').read_text());A=json.loads((O/'S5_ACCEPTANCE.json').read_text())
class ValuationControls(unittest.TestCase):
 def base(self,**kw):return value(I,S['cases'][1]['specification'],**kw)
 def test_raw_price_units(self):self.assertEqual(D(I['modelNumbers']['price']),D(56900));self.assertFalse(I['price']['adjustedFallback'])
 def test_revenue_ttm(self):
  x=I['reconciliation'];self.assertEqual(D(x['revenueTTM']),D(x['revenueFY2025'])+D(x['revenue9m2026'])-D(x['revenue9m2025']))
 def test_ebit_ttm(self):
  x=I['reconciliation'];self.assertEqual(D(x['coreEbitTTM']),D(x['coreEbitFY2025'])+D(x['coreEbit9m2026'])-D(x['coreEbit9m2025']))
 def test_operating_identity(self):
  for case in S['cases']:
   for x in case['years']+[case['terminalYear']]:
    d=lambda k:D(x[k]);want=d('economicNopat')+d('depreciation')-d('maintenanceCapex')-d('totalGrowthReinvestment')-d('strategicInvestmentOutsideCoreParent')-d('downsideWorkingCapitalLock')
    self.assertLess(abs(d('fcff')-want),D('.00000001'))
 def test_growth_capital_not_added_twice(self):
  for x in self.base()['years']:
   self.assertEqual(D(x['totalGrowthReinvestment']),D(x['incrementalWorkingCapitalIncludingOperatingCash'])+D(x['assetGrowthCapex'])+D(x['extraGrowthFundingToRespectReturnCeiling']))
 def test_employee_cost_once(self):
  x=self.base()['years'][0];self.assertEqual(D(x['economicNopat']),D(x['afterTaxOperatingEarnings'])-D(x['employeeFundCharge']))
 def test_debt_and_prior_claims_once(self):
  f=I['modelNumbers'];want=sum(D(f[k]) for k in ['debt','accruedInterest','fullYearInterestBudget','oldDividendPayable','openingEmployeeFundLiability','openingIncomeTaxPayable'])
  self.assertEqual(D(self.base()['financialRunoff']['debtAndPriorClaimsPaidOnce']),want)
 def test_interest_not_in_operating_fcff(self):
  other=copy.deepcopy(I);other['modelNumbers']['fullYearInterestBudget']='0';x=value(other,S['cases'][1]['specification']);self.assertEqual(x['years'][0]['fcff'],self.base()['years'][0]['fcff']);self.assertGreater(D(x['intrinsicValuePerShare']),D(self.base()['intrinsicValuePerShare']))
 def test_no_finance_income_or_cash_add(self):
  for x in S['cases']:
   self.assertEqual(x['financialRunoff']['futureFinancialIncomeIncluded'],'0');self.assertEqual(x['financialRunoff']['operatingCashAdded'],'0')
 def test_holdings_excluded_conservative(self):
  for x in S['cases'][:2]:self.assertEqual(D(x['financialRunoff']['unqualifiedHoldingsValueAtExit']),0)
 def test_ledger_conserves_cash(self):
  for case in S['cases']:
   prev=D(0)
   for x in case['years']:
    self.assertLess(abs(prev+D(x['fcff'])+D(x['netFinancialRunoff'])-D(x['shareholderDistribution'])-D(x['retainedCashEnd'])),D('.00000001'));prev=D(x['retainedCashEnd'])
 def test_declared_dividend_inside_cap(self):
  x=self.base();self.assertEqual(D(x['equityCashflowsPerShare'][1]['amountVnd']),2500)
  row=x['years'][0];self.assertEqual(D(row['shareholderDistribution']),D(I['modelNumbers']['shares'])*(D(2500)+D(row['regularPerShareDistribution'])))
 def test_dividend_actual_day(self):self.assertEqual(D(I['modelNumbers']['declaredPaymentYearFraction']),D(27)/365)
 def test_terminal_growth_recomputed(self):
  x=self.base();self.assertLess(D(x['terminalYear']['totalGrowthReinvestment']),D(x['years'][-1]['totalGrowthReinvestment']));self.assertEqual(D(x['terminalOperatingValueAtYear5']),D(x['terminalYear']['fcff'])/(D(x['discountRate'])-D(x['terminalGrowth'])))
 def test_present_value_and_irr(self):
  for x in S['cases']:
   flows=[(D(a['yearFraction']),D(a['amountVnd'])) for a in x['equityCashflowsPerShare']];r=D(x['fiveYearShareholderIRR']);self.assertLess(abs(sum(v/(1+r)**t for t,v in flows)),D('.000001'));self.assertEqual(str(sum(v/(1+D(x['discountRate']))**t for t,v in flows[1:])),x['intrinsicValuePerShare'])
 def test_deposit_haircut(self):self.assertLess(D(self.base(financial_recovery='.9')['intrinsicValuePerShare']),D(self.base()['intrinsicValuePerShare']))
 def test_extra_maintenance(self):self.assertLess(D(self.base(extra_maintenance='500000000000')['intrinsicValuePerShare']),D(self.base()['intrinsicValuePerShare']))
 def test_dilution(self):self.assertLess(D(self.base(dilution='.01')['intrinsicValuePerShare']),D(self.base()['intrinsicValuePerShare']))
 def test_unfunded_blocks_return(self):
  x=self.base(extra_maintenance='100000000000000');self.assertFalse(x['fundedWithoutNewEquityOrBorrowing']);self.assertIsNone(x['fiveYearShareholderIRR'])
 def test_invalid_terminal(self):
  with self.assertRaises(ValueError):self.base(rate='.01',terminal_g='.01')
 def test_invalid_recovery(self):
  with self.assertRaises(ValueError):self.base(financial_recovery='1.1')
 def test_invalid_cashflow(self):
  with self.assertRaises(ValueError):irr([(D(0),D(-1)),(D(1),D(-1))])
 def test_no_probabilities(self):self.assertIsNone(E['scenarioProbabilities']);self.assertIsNone(E['probabilityWeightedReturn'])
 def test_no_false_mos_precision(self):self.assertIsNone(E['decisionGradePointMarginOfSafety']);self.assertIsNone(A['pointMarginOfSafety'])
 def test_no_formal_promotion(self):self.assertIsNone(A['formalScoringPoints']);self.assertIsNone(A['formalApprovedFairValue']);self.assertFalse(A['VNM17Promoted']);self.assertEqual(A['productionActivation'],'NOT_AUTHORIZED')
 def test_unknown_cashflow_not_zero(self):self.assertIsNone(S['crosschecks']['TTMAfterSubsidiaryUseVnd'])
 def test_cashflow_column(self):
  root=O.resolve().parents[3];facts=json.loads((root/'docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/evidence-products.json').read_text())['facts'];self.assertEqual(D(facts['parentReceivedFinanceCash25']['value']),D('1571241822856'))
 def test_strategic_sensitivity_applies_terminal(self):
  x=self.base(strategic_override='0');self.assertEqual(D(x['terminalYear']['strategicInvestmentOutsideCoreParent']),0)
 def test_primary_funding(self):self.assertTrue(all(x['fundedWithoutNewEquityOrBorrowing'] for x in S['cases']))
 def test_exact_replay(self):self.assertEqual(self.base(),S['cases'][1])
if __name__=='__main__':unittest.main()
