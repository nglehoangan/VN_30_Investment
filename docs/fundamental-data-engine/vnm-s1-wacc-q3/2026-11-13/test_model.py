import unittest,json,copy
from pathlib import Path
from decimal import Decimal as D
from model import wacc,period_return,incremental_result,ttm_flow
O=Path(__file__).resolve().parent
class WaccQ3Tests(unittest.TestCase):
 @classmethod
 def setUpClass(c):c.i=json.loads((O/'WACC_Q3_INPUTS.json').read_text());c.r=json.loads((O/'WACC_ROIC_Q3_ASSESSMENT.json').read_text())
 def args(self):return ['.0443','.0256','.0423','.56','.039','.05','.2','10','100']
 def test_country_risk_and_default_adjustment_counted_once(self):
  args=self.args();args[-2]='0';r=wacc(*args);self.assertEqual(D(r['value']),D('.081388'));self.assertEqual(r['countryRiskCount'],1);self.assertEqual(D(r['riskFreeEstimate']),D('.0187'))
 def test_market_weights_sum_and_relevering(self):
  r=wacc(*self.args());self.assertLess(abs(D(r['debtWeight'])+D(r['equityWeight'])-1),D('1e-40'));self.assertEqual(D(r['leveredBetaProxy']),D('.6048'))
 def test_invalid_risk_rate_missing_value_and_capital_rejected(self):
  for pos,val in [(0,None),(1,'.06'),(2,'NaN'),(3,'-1'),(6,'1'),(8,'0')]:
   args=self.args();args[pos]=val
   with self.assertRaises(ValueError):wacc(*args)
 def test_complete_coherent_wacc_scenario_envelope(self):
  cases=self.r['wacc']['scenarios'];self.assertEqual(len(cases),72);self.assertEqual([min(D(c['value']) for c in cases),max(D(c['value']) for c in cases)],[D(self.r['wacc'][k]) for k in ['low','high']])
 def test_annual_and_current_spreads_remain_positive_in_tested_cases(self):
  self.assertTrue(all(x['robustAcrossTestedCases'] for x in self.r['annualRoicComparison']));self.assertGreater(D(self.r['q3CurrentPeriod']['conservativeSpreadNineMonths']),0)
 def test_funding_cost_is_proxy_not_quoted_or_below_sovereign_floor(self):
  f=self.i['macroAndWaccInputs']['funding'];self.assertGreaterEqual(D(f['estimatedDebtCostRange'][0]),D('.0443'));self.assertIn('not a quoted',f['limitations'])
 def test_current_source_group_npats_and_fund_scope(self):
  y=self.i['flows']['2026'];self.assertEqual(y['months'],9);self.assertEqual(y['netProfit'],'8604835000871');self.assertNotEqual(y['netProfit'],'8559925918638');self.assertEqual(y['fundAppropriation'],'870909645011')
 def test_actual_report_income_arithmetic_both_ytds(self):
  for y in self.i['flows'].values():
   self.assertEqual(D(y['revenue'])-D(y['costOfSales']),D(y['grossProfit']));self.assertEqual(D(y['allInOperatingEbit'])+D(y['financeIncome'])-D(y['financeExpense'])+D(y['associateResult']),D(y['pretaxProfit']));self.assertEqual(D(y['pretaxProfit'])-D(y['currentTax'])-D(y['deferredTax']),D(y['netProfit']))
 def test_restated_earnings_bridge_invariance(self):
  b=self.i['restatementBridge'];self.assertEqual(D(b['coreEbitReclassificationDelta']),D('-49840474127'));self.assertEqual(D(b['coreEbitReclassificationDelta'])+D(b['otherNetReclassificationDelta']),0)
 def test_capital_reclassification_does_not_become_new_investment(self):
  self.assertEqual(D(self.i['restatementBridge']['openingFinancialAssetClassificationDelta']),D('538144503272'));cases=self.r['incrementalComparability']['matchedHistoricalChanges'];self.assertTrue(any(D(x['deltaCapital'])>0 and D(x['mixedVintageCapitalDeltaIfNew2025ClassificationWereMisapplied'])<0 for x in cases))
 def test_ttm_quarter_never_substitutes_for_nine_months(self):
  a={'year':2025,'scope':'CONSOLIDATED','currency':'VND'};c=copy.deepcopy(self.i['flows']['2026']);c['months']=3
  with self.assertRaisesRegex(ValueError,'YTD_PERIOD'):ttm_flow(a,c,self.i['flows']['2025'])
 def test_ttm_scope_rejection(self):
  a={'year':2025,'scope':'STANDALONE','currency':'VND'}
  with self.assertRaisesRegex(ValueError,'SCOPE_CURRENCY'):ttm_flow(a,self.i['flows']['2026'],self.i['flows']['2025'])
 def test_nine_month_measure_not_annualized_and_ttm_roic_not_faked(self):
  current=self.r['q3CurrentPeriod'];c=current['scenarios'][0];self.assertEqual(period_return(c['nopatNineMonths'],c['openingCapital']['value'],c['closingCapital']['value']),D(c['returnNineMonthsNotAnnualized']));self.assertIsNone(current['TTM']['roic']);self.assertIn('2025-09-30',current['TTM']['exactMissing'])
 def test_incremental_comparability_materiality_and_denominator_guard(self):
  for n,d,c,m in [('100','0',True,True),('100','-1',True,True),('100','100',False,True),('100','100',True,False)]:self.assertIsNone(incremental_result(n,d,c,m)['value'])
  self.assertEqual(D(incremental_result('10','100',True,True)['value']),D('.1'))
 def test_all_selected_current_amounts_have_native_geometry_and_columns(self):
  fs=self.i['selectedFields'];self.assertEqual(len(fs),65);self.assertTrue(all(f['source']['lineBox'] and f['source']['href'].endswith('#page='+str(f['page'])) for f in fs));self.assertTrue(all(f['source']['lineBox']['x']>=.68 for f in fs if f['column'].startswith('YTD') and f['page'] in [11,12]))
 def test_pit_authority_and_production_not_promoted(self):
  self.assertFalse(self.i['formalSourceAdmissionGranted']);self.assertFalse(self.r['S1Disposition']['S1FormalClosureGranted']);self.assertIsNone(self.r['totalScore']);self.assertEqual(self.r['newAdmissions'],0)
 def test_macro_reference_time_and_basis_are_preserved(self):
  g=self.i['macroAndWaccInputs']['governmentYield'];self.assertEqual(g['publicationDate'],'2026-11-06');self.assertIn('NOT_DAILY_SECONDARY',g['type']);self.assertIn('not a verified',self.i['macroAndWaccInputs']['defaultSpreadLimitation'])
 def test_primary_evidence_all_equity_stress_not_reported_zero_debt(self):
  q=[c for c in self.r['wacc']['scenarios'] if D(c['grossDebtProxy'])==0];self.assertTrue(q);self.assertTrue(all(c['capitalWeightCase']=='ALL_EQUITY_OPERATING_COST_STRESS_NOT_REPORTED_ZERO_DEBT' for c in q));self.assertGreater(D(self.i['macroAndWaccInputs']['funding']['q3Debt']),0)
if __name__=='__main__':unittest.main()
