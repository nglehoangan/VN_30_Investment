import copy,json,unittest
from decimal import Decimal as D
from pathlib import Path
from returns import annual_return,invested_capital,incremental_efficiency,compare_capital_cost
O=Path(__file__).resolve().parent
class EconomicReturnsTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.i=json.loads((O/'S1_INPUTS.json').read_text());cls.r=json.loads((O/'S1_ECONOMIC_RETURNS.json').read_text())
 def annual(self,y=2025,**changes):
  args={'flow':self.i['flows'][str(y)],'opening':self.i['stocks'][str(y-1)],'closing':self.i['stocks'][str(y)],'tax_rate':'0.20','cash_exclusion':0,'residual_fraction':0,'known_cost_case':False};args.update(changes);return annual_return(**args)
 def test_normalized_nopat_uses_group_operating_earnings_and_one_fund_charge(self):
  f=self.i['flows']['2025'];r=self.annual();expected=(D(f['grossProfit'])-D(f['selling'])-D(f['admin']))*D('.8')-D(f['fundAppropriation'])
  self.assertEqual(D(r['nopatEstimate']),expected);self.assertEqual(f['fundAppropriation'],'1003615673134');self.assertNotEqual(f['fundAppropriation'],'935934963563')
 def test_ebit_tax_fund_formula_reconciles(self):
  for s in self.r['scenarios']:
   for a in s['annual']:self.assertLess(abs(D(a['normalizedEbitEstimate'])*(1-D(a['taxRate']))-D(a['nopatEstimate'])),D('0.000000001'))
 def test_average_instead_of_ending_capital(self):
  r=self.annual();self.assertEqual(D(r['averageInvestedCapital']),(D(r['openingCapital']['value'])+D(r['closingCapital']['value']))/2);self.assertNotEqual(r['averageInvestedCapital'],r['closingCapital']['value'])
 def test_financing_identity_at_full_residual_operating_endpoint(self):
  for s in self.i['stocks'].values():
   for cash in [0,1]:
    r=invested_capital(s,cash,1);expected=D(s['totalEquity'])+D(s['shortDebt'])+D(s['longDebt'])-D(s['shortFinancialAssets'])-D(s['longFinancialAssets'])-cash*D(s['cash']);self.assertEqual(D(r['value']),expected)
 def test_reject_parent_earnings_group_capital_mix(self):
  f={**self.i['flows']['2025'],'scope':'STANDALONE'}
  with self.assertRaisesRegex(ValueError,'DIMENSION_MISMATCH'):self.annual(flow=f)
 def test_reject_currency_and_opening_period_mismatch(self):
  with self.assertRaisesRegex(ValueError,'DIMENSION_MISMATCH'):self.annual(closing={**self.i['stocks']['2025'],'currency':'USD'})
  with self.assertRaisesRegex(ValueError,'PERIOD_MISMATCH'):self.annual(opening=self.i['stocks']['2023'])
 def test_missing_indispensable_amount_never_zero(self):
  with self.assertRaisesRegex(ValueError,'MISSING_REQUIRED'):self.annual(flow={**self.i['flows']['2025'],'grossProfit':None})
 def test_arbitrary_cash_or_residual_allocation_rejected(self):
  with self.assertRaisesRegex(ValueError,'ALLOCATION'):self.annual(cash_exclusion='1.1')
  with self.assertRaisesRegex(ValueError,'ALLOCATION'):self.annual(residual_fraction='-1')
 def test_invalid_tax_and_nonpositive_capital_rejected(self):
  with self.assertRaisesRegex(ValueError,'TAX_RATE'):self.annual(tax_rate=1)
  s=copy.deepcopy(self.i['stocks']['2025']);s['assets']='1'
  with self.assertRaisesRegex(ValueError,'NONPOSITIVE'):invested_capital(s,0,0)
 def test_scenario_range_uses_complete_paired_rows(self):
  for row in self.r['historicalAnnualSummary']:
   annual=[s['annual'][row['year']-2022] for s in self.r['scenarios']]
   self.assertEqual([D(x) for x in row['roicSensitivityRange']],[min(D(a['roicEstimate']) for a in annual),max(D(a['roicEstimate']) for a in annual)])
 def test_no_factory_schedule_required(self):
  r=self.annual();self.assertGreater(D(r['roicEstimate']),0);self.assertFalse(self.i['projectOrFactoryAttributionRequired']);self.assertNotIn('project',self.i['flows']['2025'])
 def test_unknown_capital_cost_is_nr_without_default(self):
  r=compare_capital_cost(['.3'],None);self.assertEqual(r['status'],'N_R');self.assertIsNone(r['value']);self.assertFalse(r['defaultUsed'])
 def test_unqualified_or_mismatched_capital_cost_rejected(self):
  for q in [{'low':'.12','high':'.18','supported':False,'evidenceRefs':['unreviewed']},{'low':'.12','high':'.18','supported':True,'evidenceRefs':['test'],'currency':'USD','scope':'CONSOLIDATED','basis':'NOMINAL_UNLEVERED_COMPATIBLE'}]:
   with self.assertRaisesRegex(ValueError,'CAPITAL_COST_RANGE'):compare_capital_cost(['.3'],q)
 def test_supported_range_comparison_only_test_fixture_no_scoring_points(self):
  q={'low':'.1','high':'.15','supported':True,'evidenceRefs':['SYNTHETIC_ARITHMETIC_TEST_NOT_VNM_EVIDENCE'],'currency':'VND','scope':'CONSOLIDATED','basis':'NOMINAL_UNLEVERED_COMPATIBLE'}
  r=compare_capital_cost(['.25','.3'],q);self.assertEqual(D(r['minimumSpread']),D('.1'));self.assertNotIn('score',r)
 def test_incremental_requires_comparable_material_capital_changes(self):
  a,b=self.annual(2024),self.annual(2025);r=incremental_efficiency(a,b);self.assertIsNone(r['value']);self.assertIn('COMPARABILITY',r['status'])
  q=incremental_efficiency(a,b,True,True);self.assertEqual(D(q['value']),D(q['deltaNopat'])/D(q['deltaYearEndCapital']))
 def test_negative_or_zero_incremental_denominator_never_value_destructive_score(self):
  a,b=self.annual(2024),self.annual(2025);b=copy.deepcopy(b);b['closingCapital']['value']=a['closingCapital']['value'];r=incremental_efficiency(a,b,True,True);self.assertIsNone(r['value']);self.assertIn('NONPOSITIVE',r['status']);self.assertNotIn('points',r)
 def test_incremental_different_basis_rejected(self):
  a=self.annual(2024);b=self.annual(2025,cash_exclusion=1)
  with self.assertRaisesRegex(ValueError,'BASIS'):incremental_efficiency(a,b)
 def test_s1_not_closed_by_arithmetic_or_optional_missing_detail(self):
  self.assertFalse(self.r['S1Closed']);self.assertIsNone(self.r['formalRubricPoints']);self.assertEqual([b['id'] for b in self.r['indispensableBlockers']],['S1_CAPITAL_COST_RANGE']);self.assertFalse(self.r['sourceAuthorityChanged'])
if __name__=='__main__':unittest.main()
