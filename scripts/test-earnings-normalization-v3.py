#!/usr/bin/env python3
import unittest,json,hashlib,subprocess,importlib.util
from unittest.mock import patch
from pathlib import Path
from decimal import Decimal
from lib.earnings_normalization import tax_profile,allocation_proxy,incidence_envelope,total_credit_proxy,deduct_funds,adjusted_earnings,bsr_resolution,earnings_envelope
P=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/earnings-normalization-v3')
def read(t):return json.loads((P/'issuers'/f'{t}.json').read_text())
class Arithmetic(unittest.TestCase):
 def test_tax_identity_not_marginal_rate(self):
  d=tax_profile('100','80');self.assertEqual(d['reportedTaxVnd'],'20');self.assertFalse(d['marginalTaxQualified'])
 def test_deferred_benefit_not_clamped_to_zero(self):
  self.assertEqual(tax_profile('100','110')['reportedEffectiveRate'],'-0.1')
 def test_zero_pbt_stays_unknown(self):self.assertIsNone(tax_profile('0','10')['reportedEffectiveRate'])
 def test_group_profit_ratio_above_one_not_ownership(self):self.assertIsNone(allocation_proxy('110','100'))
 def test_lossy_or_nonfinite_inputs_rejected(self):
  for value in [0.2,float('nan'),'NaN','Infinity',True]:
   with self.subTest(value=value),self.assertRaises((ValueError,TypeError)):tax_profile(value,'1')
 def test_marginal_incidence_bounds(self):
  d=incidence_envelope('-100',['0','.2'],['0','1']);self.assertEqual(d['minAfterTaxCommonDelta'],'-100');self.assertEqual(d['maxAfterTaxCommonDelta'],'0')
 def test_independent_incidence_not_falsely_cancelled(self):
  d=earnings_envelope('100',[dict(id='gain',pretaxVnd='100'),dict(id='loss',pretaxVnd='-100')],['0','.2'],['0','1'])
  self.assertEqual((d['minimumVnd'],d['maximumVnd']),('0','200'))
 def test_negative_earnings_not_zero_floored(self):self.assertEqual(adjusted_earnings('10',[dict(id='a',pretaxVnd='-20')],tax='0',common_weight='1'),Decimal('-10'))
 def test_duplicate_adjustments_block(self):
  with self.assertRaises(ValueError):adjusted_earnings('100',[dict(id='x',pretaxVnd='1')]*2,tax='.2',common_weight='1')
 def test_unknown_tax_and_ownership_not_defaults(self):
  for tax,weight in [(None,'1'),('.2',None),('-.1','1'),('.2','1.1')]:
   with self.subTest(tax=tax,weight=weight),self.assertRaises((ValueError,TypeError)):adjusted_earnings('100',[dict(id='a',pretaxVnd='1')],tax=tax,common_weight=weight)
 def test_fund_once_after_tax_not_tax_deductible_again(self):
  c=dict(id='fund',period='FY2025',classification='PARENT_NON_SHAREHOLDER_LEAKAGE',alreadyDeducted=False,value='20')
  self.assertEqual(deduct_funds('100',[c]),Decimal('80'))
  with self.assertRaises(ValueError):deduct_funds('100',[c,c])
 def test_nci_reinvestment_and_pnl_not_common_fund_deductions(self):
  for classification in ['NCI','COMMON_REINVESTMENT','ALREADY_PNL_EXPENSE']:
   with self.subTest(classification=classification),self.assertRaises(ValueError):deduct_funds('100',[dict(id='x',period='FY2025',classification=classification,alreadyDeducted=False,value='20')])
 def test_wrong_year_or_already_deducted_fund_rejected(self):
  for period,already in [('FY2026',False),('FY2025',True)]:
   with self.subTest(period=period,already=already),self.assertRaises(ValueError):deduct_funds('100',[dict(id='x',period=period,classification='PARENT_NON_SHAREHOLDER_LEAKAGE',alreadyDeducted=already,value='20')])
 def test_total_credit_population_and_exposure_weighting(self):
  rows=[dict(year=y,openingAssets='100',closingAssets='100',totalCreditExpense=c) for y,c in zip([2023,2024,2025],['1','2','3'])]
  rate,charge=total_credit_proxy(rows,'200','1.25');self.assertEqual(rate,Decimal('.02'));self.assertEqual(charge,Decimal('5'))
  with self.assertRaises(ValueError):total_credit_proxy(rows[:2],'200','1')
 def test_negative_total_credit_target_rejected(self):
  rows=[dict(year=y,openingAssets='100',closingAssets='100',totalCreditExpense='1') for y in [2023,2024,2025]]
  with self.assertRaises(ValueError):total_credit_proxy(rows,'-100','1')
 def test_duplicate_adjustment_cannot_hide_in_independent_envelope(self):
  with self.assertRaises(ValueError):earnings_envelope('100',[dict(id='a',pretaxVnd='1')]*2,['.2'],['1'])
 def test_bsr_exact_branch_and_one_vnd_variant(self):
  d=bsr_resolution('5213612063223','4061012360','374103026199','376701162230','2598136032')
  self.assertEqual(d['selectedCommonNumeratorVnd'],'4835448024664');self.assertEqual(d['sourceVariantDifferenceVnd'],'1');self.assertFalse(d['issuerSubtotalCorrected'])
class ActualCase(unittest.TestCase):
 def test_all17_candidates_have_three_distinct_cycle_or_credit_cases(self):
  s=json.loads((P/'summary.json').read_text());rows=[r for r in s['issuers'] if r['newModel']];self.assertEqual(len(rows),17)
  for row in rows:
   d=read(row['ticker']);self.assertEqual([s['name'] for s in d['scenarios']],['BEAR','BASE','BULL'])
   effects=[tuple(a['pretaxVnd'] for a in s['adjustments']) for s in d['scenarios']]
   self.assertEqual(len(set(effects)),3,row['ticker'])
 def test_all13_prior_models_have_specific_challenge(self):
  s=json.loads((P/'summary.json').read_text());rows=[r for r in s['issuers'] if not r['newModel']];self.assertEqual(len(rows),13)
  for row in rows:self.assertEqual(len(read(row['ticker'])['modelChallenges']),3)
 def test_banks_total_risk_not_loan_only(self):
  d=read('BID');self.assertFalse(d['creditNormalization']['loanOnlyClaimed']);self.assertEqual(len(d['creditNormalization']['history']),3)
 def test_bsr_original_subtotal_not_used_as_corrected_common(self):
  d=read('BSR');self.assertEqual(d['originalReportedCommonVnd'],'5230686242758');self.assertEqual(d['sourceCommonBridgeVnd'],'4835448024664')
 def test_gvr_interim_replaced_not_added_to_final(self):
  d=read('GVR');self.assertEqual(d['sourceCommonBridgeVnd'],'4681801218538');self.assertIsNone(d['accountingConflictDisposition']['parentFinalExactVnd']);self.assertFalse(d['accountingConflictDisposition']['fullFinalFundCompletenessProven'])
 def test_ssi_confirmed_fund_replaces_heuristic(self):
  d=read('SSI');self.assertEqual(d['additionalKnownFundDeductions'][0]['value'],'244818160367')
  self.assertEqual(Decimal(d['originalReportedCommonVnd'])-Decimal(d['sourceCommonBridgeVnd']),Decimal('244818160367'))
  self.assertTrue(all(not c['fundHaircutCanReplaceKnownAllocation'] for c in d['modelChallenges']))
 def test_hdb_known_parent_fund_once(self):
  d=read('HDB');self.assertEqual(Decimal(d['originalReportedCommonVnd'])-Decimal(d['sourceCommonBridgeVnd']),Decimal('25000000000'))
 def test_vic_no_fake_nci_weight_or_welfare_fund(self):
  d=read('VIC');self.assertGreater(Decimal(d['parentToReportedScopeProfitRatio']),1);self.assertIsNone(d['commonAttributionProxy'])
  self.assertEqual(d['restrictedReinvestmentClaimVnd'],'664743000000');self.assertTrue(all(s['diagnosticAt20PercentTaxAndProfitRatioVnd'] is None for s in d['scenarios']))
 def test_vpl_negative_group_etr_never_used_as_marginal(self):
  d=read('VPL');self.assertTrue(d['taxProfile']['negativeTaxBenefit']);self.assertFalse(d['taxProfile']['marginalTaxQualified'])
  self.assertTrue(all(c.get('diagnosticAtReportedScopeEffectiveTaxVnd') is None for c in d['modelChallenges']))
 def test_vnm_standalone_not_group_tax_or_reestimated_historical_fund(self):
  d=read('VNM');self.assertEqual(d['modelScope'],'STANDALONE_PARENT');self.assertFalse(d['consolidatedTaxProfileApplicableToParentModel'])
  self.assertTrue(all(not c['historicalFundReestimated'] and not c['consolidatedGroupEtrApplied'] for c in d['standaloneTaxFundChallenge']))
 def test_vjc_sale_margin_paired_and_core_loss_visible(self):
  d=read('VJC');self.assertLess(Decimal(d['scenarios'][0]['diagnosticAt20PercentTaxAndProfitRatioVnd']),0)
  self.assertEqual(d['scenarios'][0]['adjustments'][0]['pretaxVnd'],'-3525586899294')
 def test_ctg_and_vpb_disposal_categories_net_not_gross(self):
  for t,value in [('CTG','-18406000000'),('VPB','-7148000000')]:
   self.assertEqual(next(a for a in read(t)['basePretaxAdjustments'] if a['id']==t+'-category-net-disposal')['pretaxVnd'],value)
 def test_ssb_specific_ptf_gain_direct_parent(self):
  a=next(a for a in read('SSB')['basePretaxAdjustments'] if a['id']=='SSB-ptf-sale');self.assertEqual(a['provenCommonWeight'],'1');self.assertEqual(a['pretaxVnd'],'-2607318000000')
 def test_standalone_lpb_has_no_invented_nci_uncertainty(self):
  d=read('LPB');self.assertEqual(d['scope'],'STANDALONE');self.assertEqual(d['nciIncidence'],'NOT_APPLICABLE_STANDALONE')
 def test_scope_pbt_derivation_explicit(self):
  self.assertEqual(read('GVR')['pbtBasis'],'DERIVED_FROM_SCOPE_NI_AND_CHECKED_TAX')
 def test_current_and_comparative_reading_periods_explicit(self):
  rows=json.loads((P/'checked-readings.json').read_text())['readings']
  for r in rows:
   self.assertEqual(r['documentPeriod'],'FY2025')
   self.assertEqual(r['period'],'FY2024' if r['key'].endswith('2024') else 'FY2025')
 def test_tcx_one_vnd_printed_common_variant_visible(self):
  self.assertEqual(read('TCX')['additionalSourceDifferences'][0]['differenceVnd'],'1')
 def test_foreign_tax_rates_replay_percent_units(self):
  rows=json.loads((P/'checked-readings.json').read_text())['readings'];r=next(r for r in rows if r['key']=='reportedForeignRateIreland')
  self.assertEqual(r['unit'],'PERCENT');self.assertEqual(r['lexicalValue'],'25');self.assertEqual(Decimal(r['lexicalValue'])*Decimal(r['multiplier']),Decimal('.25'))
  self.assertIn('0.25',read('VJC')['assumedMarginalTaxRates'])
 def test_no_accepted_values_scores_or_nav(self):
  for p in (P/'issuers').glob('*.json'):
   d=json.loads(p.read_text());self.assertIsNone(d['acceptedNormalizedCommonEarningsVnd']);self.assertIsNone(d['acceptedEps']);self.assertFalse(d['productionScoringAuthorized']);self.assertFalse(d['navAuthorized'])
 def test_manifest_all_source_and_member_bytes(self):
  d=json.loads((P/'manifest.json').read_text())
  for name,key in [('summary.json','summarySha256'),('checked-readings.json','checkedReadingsSha256'),('BSR-GVR-disposition.json','fundDispositionSha256')]:self.assertEqual(hashlib.sha256((P/name).read_bytes()).hexdigest(),d[key])
  self.assertEqual(hashlib.sha256(Path('scripts/build-earnings-normalization-v3.py').read_bytes()).hexdigest(),d['buildImplementationSha256'])
  self.assertEqual(hashlib.sha256(Path('scripts/lib/earnings_normalization.py').read_bytes()).hexdigest(),d['mathImplementationSha256'])
  for path,h in d['sourcePins'].items():self.assertEqual(hashlib.sha256(Path(path).read_bytes()).hexdigest(),h)
  for m in d['members']:self.assertEqual(hashlib.sha256((P/m['path']).read_bytes()).hexdigest(),m['sha256'])
 def test_builder_rejects_changed_source_bytes_without_writing(self):
  spec=importlib.util.spec_from_file_location('normalization_builder','scripts/build-earnings-normalization-v3.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
  original=m.sha
  with patch.object(m,'sha',side_effect=lambda p:'0'*64 if p.suffix.lower()=='.pdf' else original(p)):
   with self.assertRaisesRegex(ValueError,'SOURCE_BYTES_MISMATCH'):m.build()
 def test_builder_rejects_comparative_period_relabelled_current(self):
  spec=importlib.util.spec_from_file_location('normalization_builder','scripts/build-earnings-normalization-v3.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
  target=m.OUT/'checked-readings.json';raw=json.loads(target.read_text());row=next(r for r in raw['readings'] if r['period']=='FY2024');row['period']='FY2025'
  original=Path.read_text
  with patch.object(Path,'read_text',lambda p,*a,**kw:json.dumps(raw) if p==target else original(p,*a,**kw)):
   with self.assertRaisesRegex(ValueError,'EXACT_READING_PERIOD_COLUMN_OR_ID_REQUIRED'):m.build()
 def test_reproducible_rebuild(self):
  before={str(p):p.read_bytes() for p in P.rglob('*.json')}
  subprocess.run(['python3','scripts/build-earnings-normalization-v3.py'],check=True,capture_output=True)
  for p,b in before.items():self.assertEqual(Path(p).read_bytes(),b)
if __name__=='__main__':unittest.main()
