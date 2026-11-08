"""Bounded research tests. Synthetic valuation economics are never TCB inputs."""
import unittest,json
from decimal import Decimal,localcontext
from copy import deepcopy
import normalize as n,underwrite as u,valuation_model as v,package as p
D=Decimal
class ResearchTests(unittest.TestCase):
 @classmethod
 def setUpClass(c):
  c.e=n.financials();c.f=c.e['financials'];c.r=u.build(c.e)
 def x(self,k,y=2025):return self.f[k+':'+str(y)]
 def val(self,k,y=2025):return D(self.x(k,y)['value'])
 def case(self):
  c={k:True for k in v.REQUIRED};c.update(issuer='SYNTHETIC_TEST',valuationCutoff='SYNTHETIC',researchBasis='SYNTHETIC',approvalReferences=['SYNTHETIC_NOT_OWNER_APPROVAL'],commonBook='100',commonShares='10',normalizedRoe='0.15',costOfEquity='0.10',terminalGrowth='0.03',payout='0.8',newShares='0',netNewCommonCash='0');return c
 def test_01_counts(self):
  self.assertEqual(sum(x['classification']=='REPORTED_FACT' for x in self.f.values()),127);self.assertEqual(sum(x['classification']=='DERIVED_METRIC' for x in self.f.values()),43);self.assertEqual(len(self.e['missing']),12)
 def test_02_native_units(self):
  for x in self.f.values():
   if x['classification']=='REPORTED_FACT':self.assertEqual(D(x['value']),D(x['nativeValue'])*D(x['multiplier']))
  self.assertEqual(self.val('TIER1'),D('170177000000000'));self.assertEqual(self.val('GROUP_EQUITY'),D('179501442000000'))
 def test_03_source_bindings(self):
  for x in self.f.values():
   if 'source' in x:
    self.assertEqual(n.p1.sha(n.ROOT/x['source']['path']),x['source']['sha256']);self.assertGreater(x['source']['physicalPage'],0)
    for k in ('binding','notesBinding'):
     b=x[k];self.assertEqual(n.p1.digest(n.d2.pointer(n.read(b['path']),b['jsonPointer'])),b['objectHash'])
 def test_04_period_vintage(self):
  for x in self.f.values():
   if x['classification']=='REPORTED_FACT':
    self.assertIn(x['year'],(2024,2025));self.assertEqual(x['periodEnd'],str(x['year'])+'-12-31');self.assertIn(str(x['year']),x['source']['column']);self.assertIsNone(x['publicationAt'])
    if x['year']==2024:self.assertIn('COMPARATIVE',x['revision'])
 def test_05_prior_metric_parity(self):
  old=n.read(n.PRIOR)['metrics'];self.assertEqual(len(old),145)
  for x,m in zip(self.e['priorMetrics'],old):self.assertEqual(x['value'],m['value']);self.assertEqual(x['binding']['objectHash'],n.p1.digest(m))
  self.assertEqual({x['year'] for x in old},{2022,2023,2024,2025})
 def test_06_eps_common_bridge(self):
  for y,num in ((2025,'25254851000000'),(2024,'21486928000000')):self.assertEqual(self.val('COMMON_NUMERATOR_BRIDGE',y),D(num));self.assertEqual(self.val('COMMON_NUMERATOR_BRIDGE',y),self.val('COMMON_EPS_NUMERATOR',y))
 def test_07_parent_nci(self):
  self.assertEqual(self.val('PARENT_EQUITY'),D('170044504000000'));self.assertEqual(self.val('GROUP_EQUITY')-self.val('NCI_EQUITY'),self.val('PARENT_EQUITY'))
 def test_08_capital_transaction_not_earnings(self):
  self.assertEqual(self.val('PARENT_BOOK_ROLLFORWARD'),self.val('PARENT_EQUITY'));self.assertEqual(self.val('PARENT_RETAINED_CAPITAL_TRANSACTION'),D('6244850000000'));self.assertNotIn('PARENT_RETAINED_CAPITAL_TRANSACTION',str(self.x('COMMON_NUMERATOR_BRIDGE')['operandIds']))
 def test_09_common_capital_missing(self):
  for k in ('COMMON_EQUITY_FOR_VALUATION','TANGIBLE_COMMON_EQUITY','SUSTAINABLE_COMMON_EARNINGS','SUSTAINABLE_ROE'):self.assertIsNone(self.f[k]['value'])
  self.assertEqual(self.x('EPS_NUMERATOR_PARENT_BOOK_RETURN_PROXY')['status'],'REFERENCE_ONLY')
 def test_10_shares(self):
  self.assertEqual(self.val('CLOSING_SHARES'),D('7086240414'));self.assertEqual(self.val('WEIGHTED_BASIC_SHARES'),D('7069481069'))
  for y in (2024,2025):self.assertEqual(self.val('SHARE_MOVEMENT',y),self.val('CLOSING_SHARES',y));self.assertLess(abs(self.val('COMMON_EPS_NUMERATOR',y)/self.val('WEIGHTED_BASIC_SHARES',y)-self.val('REPORTED_BASIC_EPS',y)),D('0.5'))
 def test_11_loan_populations(self):
  self.assertEqual(self.val('BANK_CORE_LOANS')+self.val('MARGIN_ADVANCE_LOANS'),self.val('GROUP_GROSS_LOANS'));self.assertEqual(self.val('NPL_BANK_CORE_RATIO'),D('0.011327518080'));self.assertNotEqual(self.val('NPL_BANK_CORE_RATIO'),D('0.010680291893'))
 def test_12_reserve_population(self):
  self.assertEqual(self.val('BANK_RESERVE'),D('10485620000000'));self.assertEqual(self.val('NPL_COVERAGE_BANK_CORE'),D('1.278987604251'))
 def test_13_reported_credit_cost(self):
  self.assertEqual(self.val('CUSTOMER_PROVISION_FLOW'),D('4475370000000'));self.assertEqual(self.val('CUSTOMER_CREDIT_COST_REPORTED'),D('0.006732050583'));self.assertIsNone(self.f['NORMALIZED_CREDIT_COST']['value'])
 def test_14_expense_column(self):
  self.assertEqual(self.val('BORROWING_INTEREST_EXPENSE'),D('3203209000000'));self.assertEqual(self.val('BORROWING_INTEREST_EXPENSE',2024),D('5677639000000'))
  for y in (2024,2025):self.assertEqual(self.val('INTEREST_EXPENSE_RECONCILIATION',y),self.val('INTEREST_EXPENSE',y))
  self.assertNotEqual(self.val('INTEREST_EXPENSE_RECONCILIATION')-self.val('BORROWING_INTEREST_EXPENSE')+self.val('BORROWING_INTEREST_EXPENSE',2024),self.val('INTEREST_EXPENSE'))
 def test_15_interest_not_cash_or_nim(self):
  self.assertEqual(self.val('NII'),D('38155091000000'));self.assertNotEqual(self.val('NII'),self.val('NET_CASH_INTEREST'));self.assertIsNone(self.f['REPORTED_OR_NORMALIZED_NIM']['value'])
 def test_16_deposits(self):
  self.assertEqual(self.val('DEMAND_DEPOSIT_SHARE'),D('0.344823238753'))
  for y in (2024,2025):self.assertEqual(self.val('DEPOSIT_COMPONENT_RECONCILIATION',y),self.val('CUSTOMER_DEPOSITS',y))
  for k in ('APPROVED_CASA','CUSTOMER_ONLY_FUNDING_COST'):self.assertIsNone(self.f[k]['value'])
 def test_17_regulatory_not_cet1(self):
  self.assertEqual(self.val('REG_CAPITAL_RECONCILIATION'),self.val('REGULATORY_CAPITAL'));self.assertEqual(self.val('REPORTED_FLOOR_CAR_BUFFER'),D('0.0661'));self.assertIsNone(self.f['CET1']['value']);self.assertNotEqual(self.x('TIER1')['scope'],self.x('GROUP_EQUITY')['scope'])
 def test_18_liquidity_missing(self):
  self.assertIsNone(self.f['UNRESTRICTED_LIQUIDITY_COVENANT_COVERAGE']['value']);self.assertIn('behaviourally',next(x['claim'] for x in self.e['narratives'] if x['id'].endswith('MATURITY_ASSUMPTIONS')))
 def test_19_dash_not_zero(self):self.assertIsNone(self.f['SECURITIES_INTEREST_UNCOLLECTED_2025']['value'])
 def test_20_all_rubrics_topics(self):
  specs=n.p1.module('p26_testspec','scripts/build-dfr02.py').rubrics();self.assertEqual(len(self.r),23);self.assertEqual({r['rubric'] for r in self.r},{s['id'] for s in specs})
  for r,s in zip(self.r,specs):self.assertEqual(r['requiredTopics'],s['topics']);self.assertTrue(r['businessAssessment']);self.assertTrue(r['riskFactors']);self.assertTrue(r['assumptionDependencies']);self.assertTrue(r['invalidationConditions'])
 def test_21_full_historical_topic_mapping(self):
  eligible=[r for r in self.r if r['allMandatoryTopicsQualified']];self.assertEqual(len(eligible),1);r=eligible[0];self.assertEqual(r['rubric'],'FH-BS');self.assertEqual(set(r['topicQualification']),set(r['requiredTopics']));self.assertTrue(all(r['topicQualification'].values()));self.assertEqual(r['proposedQualitativeBand'],'Adequate');self.assertFalse(r['maximumPrerequisitesMet']);self.assertIn('Strong',r['maximumBandRejected'])
 def test_22_provenance_all_ids(self):
  ids={x['id'] for x in self.f.values()}|{x['id'] for x in self.e['narratives']}
  for r in self.r:
   for i in r['supportingEvidence']+r['contradictoryEvidence']+r['reportedDisclosureEvidence']:self.assertIn(i,ids)
 def test_23_no_formal_score(self):
  for r in self.r:
   for k in ('points','band','assessment','totalScore'):self.assertIsNone(r[k])
   self.assertFalse(r['productionAdmissible']);self.assertFalse(r['scoringAuthorized']);self.assertEqual(r['classification'],'DRAFT_RESEARCH_ASSESSMENT')
 def test_24_deferred_exact_dependencies(self):
  blocked=[r for r in self.r if r['status']=='BLOCKED_FOR_COMPLETE_ASSESSMENT'];self.assertEqual(len(blocked),22)
  for r in blocked:self.assertTrue(r['missingEvidence']);self.assertIsNone(r['proposedQualitativeBand'])
 def test_25_empty_case_blocked(self):
  m=v.specification();self.assertEqual(m['evaluation']['status'],'BLOCKED_INPUTS_OR_APPROVAL');self.assertIsNone(m['evaluation']['intrinsicRange']);self.assertTrue(all(a['value'] is None for a in m['assumptions']));self.assertTrue(all(s['intrinsicValue'] is None for s in m['scenarios']))
 def test_26_synthetic_model_consistency(self):
  with localcontext() as c:
   c.prec=70
   for horizon in (1,5,20):self.assertLess(abs(v.residual_income('100','0.15','0.10','0.03',horizon)-100*v.justified_pb('0.15','0.10','0.03')),D('1e-60'))
 def test_27_ke_domain(self):
  for roe,ke,g in [('0.15','0.03','0.03'),('0.15','-0.01','-0.03'),('0.02','0.10','0.03')]:
   with self.assertRaises(ValueError):v.justified_pb(roe,ke,g)
 def test_28_hurdle_rejected(self):
  c=self.case();c['costOfEquityBasis']='POLICY_FORWARD_RETURN_HURDLE'
  with self.assertRaisesRegex(ValueError,'RETURN_HURDLE'):v.evaluate_case(c)
 def test_29_growth_payout_consistency(self):
  c=self.case();c['payout']='0.4'
  with self.assertRaisesRegex(ValueError,'CLEAN_SURPLUS'):v.evaluate_case(c)
 def test_30_share_price_compatibility(self):
  c=self.case();c.update(price='10',priceCutoff='OTHER',adjustmentStatus='UNKNOWN')
  with self.assertRaisesRegex(ValueError,'INCOMPATIBLE'):v.evaluate_case(c)
 def test_31_no_implicit_zero_actions(self):
  c=self.case();del c['newShares'];self.assertEqual(v.evaluate_case(c)['status'],'BLOCKED_INPUTS_OR_APPROVAL');c=self.case();c['netNewCommonCash']=None;self.assertEqual(v.evaluate_case(c)['status'],'BLOCKED_INPUTS_OR_APPROVAL')
 def test_32_nonzero_issuance_rejected(self):
  for key in ('newShares','netNewCommonCash'):
   c=self.case();c[key]='10';c['dilutionTermsQualified']=True
   with self.assertRaisesRegex(ValueError,'POST_ISSUANCE'):v.evaluate_case(c)
 def test_33_explicit_synthetic_zero_actions(self):self.assertEqual(v.evaluate_case(self.case())['status'],'CONDITIONAL_RESEARCH_CASE_ONLY');self.assertFalse(v.evaluate_case(self.case())['productionAdmissible'])
 def test_34_tcb_only(self):
  with self.assertRaisesRegex(ValueError,'TCB_ONLY'):n.authorize('OTHER')
  c=self.case();c['issuer']='OTHER'
  with self.assertRaisesRegex(ValueError,'TCB_ONLY'):v.evaluate_case(c)
 def test_35_decisions_not_assumed(self):
  c=p.choices();self.assertEqual(len(c['items']),6);self.assertIsNone(c['selectedCutoff']);self.assertIsNone(c['approvalReceipt']);self.assertTrue(all(x['ownerApproval'] is None for x in c['items']))
 def test_36_escalation_and_round_guard(self):
  self.assertEqual(p.closure(2)['status'],'ESCALATED');self.assertEqual(len(p.closure(2)['items']),5);self.assertTrue(all(x['escalated'] for x in p.closure(2)['items']))
  with self.assertRaisesRegex(ValueError,'MAXIMUM_TWO'):p.build(3)
  with self.assertRaisesRegex(ValueError,'ALREADY_SEALED'):p.build(1)
 def test_37_round1_immutable(self):
  m=json.loads((n.OUT/'round1/manifest.json').read_text());self.assertEqual(n.p1.digest(m['files']),m['contentHash'])
  for path,h in m['files'].items():self.assertEqual(n.p1.sha(n.OUT/'round1'/path),h)
 def test_38_deterministic_overlay(self):self.assertEqual(n.p1.digest(n.financials()),n.p1.digest(n.financials()));self.assertEqual(n.p1.digest(u.build(self.e)),n.p1.digest(u.build(self.e)))
class BandTests(unittest.TestCase):
 def test_39_unsupported_band_rejected(self):
  spec=next(x for x in n.p1.module('p26_bandtest','scripts/build-dfr02.py').rubrics() if x['id']=='FH-BS')
  u.validate_proposed_band(spec,'Adequate')
  with self.assertRaisesRegex(ValueError,'UNSUPPORTED_M3_BAND'):u.validate_proposed_band(spec,'Invented neutral')

if __name__=='__main__':unittest.main(verbosity=2)
