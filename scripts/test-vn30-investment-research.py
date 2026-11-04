import importlib.util
import unittest
from pathlib import Path
from decimal import Decimal
spec=importlib.util.spec_from_file_location('r',Path(__file__).with_name('build-vn30-investment-research.py'))
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)

class ResearchTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.s=r.load(r.OUT/'snapshot.json');cls.p={x['ticker']:x for x in cls.s['issuers']}
 def test_all_30_and_11_revalued(self):
  self.assertEqual(len(self.p),30)
  self.assertEqual({t for t,x in self.p.items() if x['modelScenarios']},set(r.MODELED))
 def test_latest_earnings_binding_for_every_scenario(self):
  v4={x['ticker']:x for x in r.load(r.V4/'snapshot.json')['issuers']}
  for t,p in self.p.items():
   self.assertEqual(p['earnings']['workingCaseVnd'],v4[t]['prudentialWorkingCaseVnd'])
   for s in p['modelScenarios']:
    self.assertEqual(s['earningsInputVnd'],v4[t]['prudentialWorkingCaseVnd']);self.assertTrue(s['oldTaxNciFundCycleSettingsNotReapplied'])
 def test_no_unsupported_numeric_values_for_19(self):
  for t,p in self.p.items():
   if t not in r.MODELED:self.assertIsNone(p['equityScenarioRange'])
 def test_all_pins_and_outputs(self):
  m=r.load(r.OUT/'manifest.json')
  for path,h in {**m['inputPins'],**m['outputs']}.items():r.verify(path,h)
  self.assertEqual(r.sha(r.ROOT/'data/vn30.sqlite'),m['databaseReadOnlyHash'])
 def test_recomputed_dcf_and_rim_actual_cases(self):
  for t in ['FPT','GAS','HPG','MWG','VRE','MBB','TCB','VCB','SSI']:
   p=self.p[t]
   for s in p['modelScenarios']:
    a=s['valuationAssumptions'];e=s['earningsInputVnd']
    if p['commonBookReferenceVnd'] is not None:
     v=r.residual_income(p['commonBookReferenceVnd'],e,a['growth'],a['discount'],a['terminalGrowth'])
    else:v=r.owner_cash(e,a['cashConversion'],a['growth'],a['incrementalReturn'],a['discount'],a['terminalGrowth'])
    self.assertEqual(v['equityValue'],s['equityValueVnd'])
 def test_ssi_known_fund_not_deducted_twice(self):
  p=self.p['SSI'];self.assertEqual(p['earnings']['workingCaseVnd'],'3762407399230')
  self.assertTrue(all(s['earningsInputVnd']=='3762407399230' for s in p['modelScenarios']))
 def test_vnm_no_fund_reestimate_or_double_subsidiary(self):
  p=self.p['VNM'];self.assertEqual(p['scope'],'STANDALONE');self.assertEqual(p['earnings']['workingCaseVnd'],'8369595220974')
  for s in p['modelScenarios']:
   self.assertFalse(s['valuation']['subsidiaryValuesAddedSeparately'])
   for y in s['valuation']['years']:
    self.assertEqual(Decimal(y['reinvestment']),max(Decimal(y['growthFunding']),Decimal(y['standingReserve'])))
 def test_acb_capital_clean_surplus(self):
  for s in self.p['ACB']['modelScenarios']:
   v=s['valuation'];self.assertLess(abs(Decimal(v['equityValue'])-Decimal(v['ddmCrosscheck'])),Decimal('.000001'))
 def test_no_trade_signal_from_dated_unqualified_price(self):
  for p in self.p.values():
   self.assertEqual(p['currentSignal'],'UNDETERMINED_NOT_BUY_HOLD_OR_SELL')
   self.assertFalse(p['actionBridgeComplete']);self.assertIsNone(p['acceptedValuePerShare'])
   for k in ['financialRulesOrWeightsChanged','sourceAdmissionGranted','productionScoringAuthorized','navAuthorized','tradingAuthorized']:self.assertFalse(p[k])
   if p['marketReference']:self.assertEqual(p['marketReference']['use'],'DATED_RESEARCH_REFERENCE_NOT_CURRENT_QUOTE')
 def test_share_dates_and_provisional_counts_remain_separate(self):
  p=self.p['TCB'];self.assertIsNone(p['shareAnchor']['outstandingCommonShares'])
  self.assertTrue(all(not x['denominatorQualified'] for x in p['providerShareReferences']))
  p=self.p['MBB'];refs={x['kind']:x['shares'] for x in p['providerShareReferences']};self.assertNotEqual(refs['listed'],refs['outstanding'])
 def test_no_growth_rim_crosscheck_and_rejection(self):
  v=r.capital_model('100','15',['0']*5,'.15','0');self.assertEqual(Decimal(v['equityValue']),Decimal('100'))
  with self.assertRaises(ValueError):r.capital_model('100','5',['.1']*5,'.15','0')
 def test_price_corruption_rejected_without_db_write(self):
  class Cursor:
   def fetchone(self):return ('id','{}','0'*64)
  class Conn:
   def execute(self,*args):return Cursor()
  with self.assertRaisesRegex(ValueError,'MARKET_BODY_HASH'):r.market_reference(Conn(),'FPT')
 def test_every_issuer_has_three_research_conditions(self):
  for p in self.p.values():self.assertTrue(all(p['researchConditions'][x] for x in ['buy','hold','sell','issuerFalsification']))

if __name__=='__main__':unittest.main()
