"""Meaningful mathematical, stress/capital and classification rejection tests; hypothetical only."""
import unittest,copy,json
from decimal import Decimal,getcontext,localcontext
from pathlib import Path
import model
D=Decimal;OUT=Path(__file__).resolve().parent
class SandboxTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.c=json.loads((OUT/'scenario-inputs.json').read_text());cls.a=json.loads((OUT/'anchors.json').read_text());cls.result=model.run(cls.c,cls.a)
 def cfg(self):return copy.deepcopy(self.c)
 def alter(self,k,v):
  c=self.cfg();c['scenarios'][1]['inputs'][k]['value']=v
  if k=='ke':c['scenarios'][1]['inputs']['terminalKe']['value']=v
  return c
 def test_01_exact_closed_form(self):
  with localcontext() as c:
   c.prec=70
   for s,want in zip(self.result['scenarios'],[D(3)/7,D(49)/44,D(14)/5]):self.assertEqual(D(s['hypotheticalPB']),want)
 def test_02_monetary_decimal_identity(self):
  with localcontext() as c:
   c.prec=70
   for s in self.result['scenarios']:self.assertEqual(D(s['hypotheticalEquityValue']),D(self.a['commonBook']['value'])*D(s['hypotheticalPB']));self.assertEqual(D(s['hypotheticalPerShareModelValue']),D(s['hypotheticalEquityValue'])/D(self.a['closingShares']['value']))
 def test_03_precision_independent(self):
  old=getcontext().prec
  try:getcontext().prec=6;self.assertEqual(model.run(self.c,self.a),self.result)
  finally:getcontext().prec=old
 def test_04_determinism(self):self.assertEqual(model.run(self.c,self.a),model.run(self.c,self.a))
 def test_05_inputs_not_mutated(self):
  c=self.cfg();before=copy.deepcopy(c);model.run(c,self.a);self.assertEqual(c,before)
 def test_06_ri_pb_consistency(self):
  for s in self.result['scenarios']:self.assertLess(abs(D(s['constantStateRiCheck']['hypotheticalEquityValue'])-D(s['hypotheticalEquityValue'])),D('1e-45'))
 def test_07_horizon_invariant_value(self):
  c=self.cfg();c['scenarios'][1]['inputs']['transitionHorizon']['value']='20';r=model.run(c,self.a)['scenarios'][1];self.assertEqual(r['hypotheticalPB'],self.result['scenarios'][1]['hypotheticalPB']);self.assertEqual(len(r['capitalFeasibility']['rows']),20)
 def test_08_book_unit(self):
  a=copy.deepcopy(self.a);a['commonBook']['unit']='MILLION_VND'
  with self.assertRaisesRegex(ValueError,'CURRENCY_UNIT'):model.run(self.c,a)
 def test_09_closing_not_weighted_shares(self):
  a=copy.deepcopy(self.a);a['closingShares']['originalRecord']['key']='WEIGHTED_BASIC_SHARES'
  with self.assertRaisesRegex(ValueError,'CLOSING_COMMON'):model.run(self.c,a)
 def test_10_assumptions_not_facts(self):
  c=self.cfg();c['scenarios'][0]['inputs']['roe']['classification']='FACT'
  with self.assertRaisesRegex(ValueError,'CLASSIFICATION'):model.run(c,self.a)
 def test_11_roe_unit_not_percent(self):
  c=self.cfg();c['scenarios'][0]['inputs']['roe']['unit']='PERCENT'
  with self.assertRaisesRegex(ValueError,'UNIT'):model.run(c,self.a)
 def test_12_float_rejected(self):
  with self.assertRaisesRegex(ValueError,'STRING'):model.run(self.alter('taxRate',0.2),self.a)
 def test_13_nonfinite_rejected(self):
  for value in ['NaN','Infinity','-Infinity']:
   with self.assertRaisesRegex(ValueError,'FINITE'):model.run(self.alter('taxRate',value),self.a)
 def test_14_negative_rate_rejected(self):
  for k in ['ke','roe','growth','taxRate','fundingSpreadShock','rwaGrowth']:
   with self.assertRaises(ValueError):model.run(self.alter(k,'-0.1'),self.a)
 def test_15_ke_zero_rejected(self):
  with self.assertRaisesRegex(ValueError,'KE_POSITIVE'):model.run(self.alter('ke','0'),self.a)
 def test_16_ke_equals_growth(self):
  with self.assertRaisesRegex(ValueError,'KE_POSITIVE'):model.run(self.alter('ke','0.042'),self.a)
 def test_17_roe_growth_payout_inconsistent(self):
  c=self.alter('growth','0.04');c['scenarios'][1]['inputs']['terminalGrowth']['value']='0.04'
  with self.assertRaisesRegex(ValueError,'INCONSISTENT'):model.run(c,self.a)
 def test_18_invalid_payout(self):
  for p in ['-0.1','1.1']:
   with self.assertRaises(ValueError):model.run(self.alter('payout',p),self.a)
 def test_19_invalid_terminal(self):
  with self.assertRaisesRegex(ValueError,'TERMINAL'):model.run(self.alter('terminalRoe','0.25'),self.a)
 def test_20_invalid_horizon(self):
  for h in ['0','-1','2.5','51']:
   with self.assertRaisesRegex(ValueError,'HORIZON'):model.run(self.alter('transitionHorizon',h),self.a)
 def test_21_nonzero_issuance_rejected(self):
  for key in ['newShares','netNewCommonCash']:
   with self.assertRaisesRegex(ValueError,'ISSUANCE'):model.run(self.alter(key,'1'),self.a)
 def test_22_bear_infeasible_not_admissible(self):
  s=self.result['scenarios'][0];self.assertEqual(s['capitalFeasibility']['status'],'CAPITAL_INFEASIBLE');self.assertEqual(s['economicAdmissibility'],'REJECTED_CAPITAL_INFEASIBLE');self.assertTrue(s['capitalFeasibility']['failingYears'])
 def test_23_base_bull_capital_hypothesis(self):
  for s in self.result['scenarios'][1:]:self.assertEqual(s['capitalFeasibility']['status'],'HYPOTHETICALLY_CAPITAL_FEASIBLE');self.assertFalse(s['capitalFeasibility']['empiricallyQualified'])
 def test_24_target_and_buffer_add(self):self.assertEqual(D(self.result['scenarios'][1]['capitalFeasibility']['targetWithBuffer']),D('0.12'))
 def test_25_loss_double_count_rejected(self):
  with self.assertRaisesRegex(ValueError,'DOUBLECOUNT'):model.run(self.alter('capitalLosses','1'),self.a)
 def test_26_funding_added_to_ke_rejected(self):
  c=self.cfg();c['scenarios'][0]['fundingRiskAddedToKe']=True
  with self.assertRaisesRegex(ValueError,'DOUBLE_COUNT'):model.run(c,self.a)
 def test_27_credit_subtracted_twice_rejected(self):
  c=self.cfg();c['scenarios'][0]['stressAccounting']='SUBTRACT_AGAIN'
  with self.assertRaisesRegex(ValueError,'DOUBLE_COUNT'):model.run(c,self.a)
 def test_28_stress_reconciles_once(self):
  with localcontext() as c:
   c.prec=70;b=D(self.a['commonBook']['value'])
   for s in self.result['scenarios']:
    x=s['stressReconciliation'];net=D(x['reconciledHypotheticalPreStressRoe'])*b-D(x['hypotheticalCommonCreditDelta'])-D(x['hypotheticalCommonFundingDelta']);self.assertLess(abs(net-D(s['hypotheticalCommonEarnings'])),D('1e-45'));self.assertFalse(x['stressSubtractedAgain'])
 def test_29_near_zero_denominator_flagged(self):
  s=model.run(self.alter('ke','0.0421'),self.a)['scenarios'][1];self.assertIn('UNSTABLE_KE_MINUS_G',s['flags']);self.assertIn('EXTREME_HYPOTHETICAL_PB',s['flags'])
 def test_30_scenario_ordering(self):self.assertLess(D(self.result['scenarios'][0]['hypotheticalPB']),D(self.result['scenarios'][1]['hypotheticalPB']));self.assertLess(D(self.result['scenarios'][1]['hypotheticalPB']),D(self.result['scenarios'][2]['hypotheticalPB']))
 def test_31_all_five_sensitivity_tables(self):self.assertEqual(set(self.result['sensitivities']['tables']),{'roeVsKe','growthVsKe','payoutVsRoe','creditVsCommonEarnings','capitalTargetVsRwaGrowth'})
 def test_32_invalid_sensitivity_cells_null(self):
  rows=self.result['sensitivities']['tables']['growthVsKe'];bad=[r for r in rows if r['status']=='INVALID_ECONOMIC_COMBINATION'];self.assertTrue(bad);self.assertTrue(all(r['hypotheticalPB'] is None for r in bad))
 def test_33_credit_earnings_monotonic(self):
  rows=self.result['sensitivities']['tables']['creditVsCommonEarnings'];self.assertTrue(all(D(a['hypotheticalCommonEarnings'])>D(b['hypotheticalCommonEarnings']) for a,b in zip(rows,rows[1:])));self.assertEqual(rows[-1]['status'],'HYPOTHETICAL_COMMON_LOSS')
 def test_34_misleading_approved_intrinsic_rejected(self):
  c=self.cfg();c['labels'][2]='APPROVED_INTRINSIC_VALUE'
  with self.assertRaisesRegex(ValueError,'MISLEADING'):model.run(c,self.a)
 def test_35_formal_buy_label_rejected(self):
  c=self.cfg();c['labels'].append('FORMAL_BUY')
  with self.assertRaisesRegex(ValueError,'MISLEADING'):model.run(c,self.a)
 def test_36_market_price_rejected(self):
  c=self.cfg();c['marketPrice']='22789.00'
  with self.assertRaisesRegex(ValueError,'MARKET_PRICE'):model.run(c,self.a)
 def test_37_other_issuer_rejected(self):
  c=self.cfg();c['ticker']='OTHER'
  with self.assertRaisesRegex(ValueError,'TCB_ONLY'):model.run(c,self.a)
 def test_38_no_formal_fields(self):
  for s in [self.result]+self.result['scenarios']:
   for k in ['approvedIntrinsicValue','formalM3Points','formalM3Total','ranking','M4Decision','selectedPrice','marginOfSafety','expectedReturn']:self.assertIsNone(s[k])
   self.assertFalse(s['productionAdmissible']);self.assertEqual(s['labels'],model.LABELS)
 def test_39_missing_assumption_not_zero(self):
  with self.assertRaisesRegex(ValueError,'STRING'):model.run(self.alter('fundingSpreadShock',None),self.a)
 def test_40_fake_numerical_approval_rejected(self):
  c=self.cfg();c['scenarios'][0]['inputs']['ke']['ownerApprovalStatus']='APPROVED_NUMERICAL_FORECAST'
  with self.assertRaisesRegex(ValueError,'FALSE_NUMERICAL'):model.run(c,self.a)
 def test_41_zero_roe_grid_rejected(self):
  c=self.cfg();c['sensitivityGrids']['roe']['value']=['0']
  with self.assertRaisesRegex(ValueError,'GRID_DOMAIN'):model.run(c,self.a)
 def test_42_no_selected_historical_price_in_lineage(self):self.assertNotIn('TCBS',json.dumps(self.a));self.assertNotIn('22789',json.dumps(self.a))
 def test_43_common_accounting_capital_target(self):
  s=model.run(self.alter('commonBookRwaTarget','0.20'),self.a)['scenarios'][1];self.assertEqual(s['capitalFeasibility']['status'],'CAPITAL_INFEASIBLE')
 def test_44_grid_false_numerical_approval_rejected(self):
  c=self.cfg();c['sensitivityGrids']['ke']['ownerApprovalStatus']='APPROVED_NUMERICAL_FORECAST'
  with self.assertRaisesRegex(ValueError,'FALSE_NUMERICAL'):model.run(c,self.a)
 def test_45_each_scenario_sensitivity_lineage(self):
  for s in self.result['scenarios']:self.assertEqual(len(s['sensitivityResults']['localOneAtATime']),4);self.assertEqual(s['sensitivityResults']['classification'],'HYPOTHETICAL')
 def test_46_warning_controls_apply_locally(self):
  c=self.cfg();c['controls']['unstableDenominator']['value']='0.5';r=model.run(c,self.a)
  self.assertTrue(all('UNSTABLE_KE_MINUS_G' in x['flags'] for s in r['scenarios'] for x in s['sensitivityResults']['localOneAtATime']))
if __name__=='__main__':unittest.main(verbosity=2)
