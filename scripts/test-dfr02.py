"""Research arithmetic, source identity, six sector cases and dependency isolation."""
from copy import deepcopy
from decimal import Decimal
from pathlib import Path
import hashlib
import json
import unittest
from lib.dfr02 import (Graph,PILOT,number,ratio,compatible,provider_disposition,
                       rubric_disposition,match_pdf_candidates,pointer)

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/fundamental-data-engine/dfr-02/2026-11-04'
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()


class DFR02(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.d={t:read(OUT/'issuers'/f'{t}.json') for t in PILOT}
  cls.rules=json.loads((ROOT/'src/domain/scoring/methodology.ts').read_text().split('deepFreeze(',1)[1].rsplit(');',1)[0])
 def metric(self,t,k,y=2025,scope=None):
  scope=scope or ('STANDALONE' if t=='TCX' else 'CONSOLIDATED')
  return next(n for n in self.d[t]['metrics'] if n['concept']==k and n['year']==y and n['scope']==scope)
 def test_six_issuers_only(self):
  self.assertEqual({p.stem for p in (OUT/'issuers').glob('*.json')},set(PILOT))
  with self.assertRaisesRegex(ValueError,'SIX_ISSUER'):Graph('HPG')
 def test_fpt_technology_cash_and_revenue(self):
  self.assertEqual(self.metric('FPT','REVENUE')['value'],'70112825100710')
  self.assertEqual(self.metric('FPT','POST_ACQUISITION_CASH')['value'],'5038124566055')
  self.assertEqual(self.metric('FPT','CUMULATIVE_CFO_REPORTED_NPAT')['value'],'1.042118745495')
  self.assertEqual(self.metric('FPT','CURRENT_RATIO')['status'],'READY_FOR_REVIEW')
 def test_vnm_consumer_scope_and_actual_cash_bridge(self):
  self.assertEqual(self.metric('VNM','CFO')['value'],'8668137048520')
  self.assertEqual(self.metric('VNM','CFO',scope='STANDALONE')['value'],'7690701645261')
  self.assertEqual(self.metric('VNM','SIGNED_WC_CASH_CHANGE',scope='STANDALONE')['value'],'-1414952025062')
  self.assertEqual(self.metric('VNM','TAX_EXPENSE_LESS_CASH_PAID',scope='STANDALONE')['value'],'775375113368')
  self.assertEqual(self.metric('VNM','STANDALONE_POST_ACQUISITION_CASH',scope='STANDALONE')['value'],'6661172559492')
 def test_bid_bank_not_industrial_substitutes(self):
  self.assertEqual(self.metric('BID','LOAN_DEPOSIT')['value'],'1.067460193782')
  self.assertEqual(self.metric('BID','RESERVES_GROSS_LOANS')['value'],'0.014726596969')
  self.assertEqual(self.metric('BID','BANK_REPORTED_CAR')['bankCapitalEvidence']['framework'],'TT41_2016_BASEL_II')
  self.assertFalse(any(n['concept'] in ('CFO_REPORTED_NPAT','DISCLOSED_BORROWINGS_EQUITY','NIM','NPL_COVERAGE') for n in self.d['BID']['metrics']))
 def test_tcx_securities_date_keys_and_standalone_capital(self):
  self.assertEqual(self.metric('TCX','PARENT_ACCOUNTING_CAPITAL')['value'],'44099580183375')
  self.assertEqual(self.metric('TCX','MARGIN_LOANS_EQUITY')['value'],'0.978756138754')
  comp=read(ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-04/investment-research-v2/source-comparisons/TCX.json')
  self.assertTrue(any(x['originalPeriodKey']=='2025-12-31' for x in comp['pdfExtractedCandidates']))
  self.assertFalse(any(n['concept']=='CFO_REPORTED_NPAT' for n in self.d['TCX']['metrics']))
 def test_vic_closing_column_is_exact_page_overlay(self):
  m=self.metric('VIC','PARENT_ACCOUNTING_CAPITAL')
  self.assertEqual(m['value'],'147566342000000')
  self.assertEqual(m['nativeOperands']['sourceColumn'],'FY2025_CLOSING')
  self.assertEqual(m['nativeOperands']['source']['physicalPage'],12)
  self.assertEqual(self.metric('VIC','POST_ACQUISITION_CASH')['value'],'-6912183000000')
 def test_vhm_nci_preserves_both_values_and_limits_propagation(self):
  c=next(x for x in read(OUT/'source-conflicts.json')['items'] if x['id']=='VHM:NCI_OCR')
  self.assertEqual(c['extractedNative'],'11137.640');self.assertEqual(c['verifiedNative'],'11137640')
  self.assertEqual(self.metric('VHM','CHECKED_NCI')['value'],'11137640000000')
  self.assertEqual(self.metric('VHM','PARENT_ACCOUNTING_CAPITAL')['value'],'238079067000000')
  self.assertEqual(self.metric('VHM','CUMULATIVE_CFO_REPORTED_NPAT')['value'],'0.367299531159')
 def test_decimal_beyond_binary_precision_and_irrational_free_trends(self):
  self.assertEqual(ratio('9007199254740993','3'),'3002399751580331')
  for bad in [1.25,None,True,'1e3','NaN','01']:
   with self.subTest(bad=bad):
    with self.assertRaises(ValueError):number(bad)
  self.assertFalse(any('CAGR' in n['concept'] for d in self.d.values() for n in d['metrics']))
 def test_tcx_paired_gains_and_specific_minor_common_numerator_conflict(self):
  self.assertEqual(self.metric('TCX','NET_PAIRED_REVALUATION')['value'],'3231414097')
  self.assertEqual(self.metric('TCX','PRINTED_COMMON_EPS_NUMERATOR')['status'],'CONFLICT')
  self.assertEqual(self.metric('TCX','NET_INCOME')['status'],'SUPPORTED')
  self.assertEqual(self.d['TCX']['estimates']['status'],'CONFLICT')
  self.assertEqual(next(r for r in self.d['TCX']['rubrics'] if r['rubric']=='RG-UNC')['status'],'CONFLICT')
  self.assertEqual(self.metric('TCX','GROUP_ROE_AVG')['status'],'SUPPORTED')
 def test_zero_denominator_and_negative_growth_base_never_zero_score(self):
  with self.assertRaises(ValueError):ratio('1','0')
  g=Graph('FPT');a=deepcopy(self.metric('FPT','REVENUE'));b=deepcopy(a);a.update(id='a',concept='a');b.update(id='b',concept='b',value='-1');g.add(a);g.add(b)
  n=g.derive('bad',2025,[a,b],'growth','test')
  self.assertEqual(n['status'],'MISSING');self.assertIsNone(n['value'])
 def test_full_fy2022_2025_comparability(self):
  for t in PILOT:
   for k in ['NET_INCOME','TOTAL_EQUITY']:
    nodes=[self.metric(t,k,y) for y in range(2022,2026)]
    self.assertEqual([n['year'] for n in nodes],[2022,2023,2024,2025]);self.assertTrue(compatible(nodes,True))
   for n in self.d[t]['metrics']:
    if n['status']=='SUPPORTED' and n['kind']=='REPORTED_FACT':
     self.assertIn(n['periodType'],('ANNUAL','INSTANT'))
     self.assertEqual(n['periodEnd'],f'{n["year"]}-12-31')
     if n['periodType']=='ANNUAL':self.assertEqual(n['periodStart'],f'{n["year"]}-01-01')
 def test_ytd_quarter_scope_restated_and_wrong_date_rejected(self):
  a=self.metric('FPT','REVENUE')
  for delta in [{'periodType':'YTD'},{'periodType':'QUARTERLY'},{'periodStart':'2025-07-01'},{'periodEnd':'2025-06-30'},{'scope':'STANDALONE'},{'revisionBasis':'RESTATED'},{'unit':None},{'unit':'RATIO'},{'scale':'1000000'},{'currency':None}]:
   with self.subTest(delta=delta):self.assertFalse(compatible([a,{**a,**delta}]))
 def test_multiyear_windows_not_mislabeled_annual(self):
  n=self.metric('VHM','CUMULATIVE_CFO_REPORTED_NPAT')
  self.assertEqual(n['periodType'],'MULTI_YEAR');self.assertEqual(n['periodStart'],'2022-01-01')
 def test_unknown_cafef_units_and_modes_stay_references(self):
  self.assertEqual(provider_disposition(None,False,['123'])[0],'REFERENCE_ONLY')
  self.assertEqual(provider_disposition('VND',True,['123'])[0],'REFERENCE_ONLY')
  for d in self.d.values():
   self.assertTrue(d['providerCrosschecks'])
   self.assertTrue(all(x['status']=='REFERENCE_ONLY' for x in d['providerCrosschecks']))
 def test_hpg_zero_cashflow_fixture_does_not_fill_cash_operand(self):
  self.assertEqual(provider_disposition('VND',False,['0']*12),('REFERENCE_ONLY','SUSPICIOUS_CLUSTERED_ZEROS_REQUIRE_REVIEW'))
  self.assertNotEqual(provider_disposition('VND',False,['0','1'])[1],'SUSPICIOUS_CLUSTERED_ZEROS_REQUIRE_REVIEW')
  fixture=read(ROOT/'docs/fundamental-data-engine/dfr-01/2026-11-04/exception-probes.json')['hpg']
  self.assertTrue(fixture['zeroClusters']);self.assertFalse((OUT/'issuers/HPG.json').exists())
 def test_caption_code_identity_not_equal_value_mapping(self):
  c=dict(pdfHash='h',page=1,year=2025,periodType='ANNUAL',label='Unrelated caption',code='999',value='100')
  self.assertEqual(match_pdf_candidates([c],'REVENUE',2025,'h',[1]),[])
  self.assertTrue(match_pdf_candidates([{**c,'label':'Doanh thu thuần'}],'REVENUE',2025,'h',[1]))
  self.assertEqual(match_pdf_candidates([{**c,'label':'Doanh thu thuần'}],'REVENUE',2024,'h',[1]),[])
 def test_conflict_propagates_only_dependent_metrics_and_rubrics(self):
  d=self.d['VHM'];g=Graph('VHM')
  for n in d['metrics']:g.add(deepcopy(n))
  changed=self.metric('VHM','CFO')['id'];states=g.recalculate_dispositions({changed:'CONFLICT'})
  self.assertEqual(states[self.metric('VHM','CUMULATIVE_CFO_REPORTED_NPAT')['id']],'CONFLICT')
  self.assertEqual(states[self.metric('VHM','REVENUE')['id']],'SUPPORTED')
  self.assertEqual(states[self.metric('VHM','GROUP_ROE_AVG')['id']],'SUPPORTED')
  rubric=next(r for r in d['rubrics'] if r['rubric']=='RG-UNC')
  self.assertEqual(rubric_disposition(rubric,states),dict(status='CONFLICT',points=None))
  independent=next(r for r in self.d['VNM']['rubrics'] if r['rubric']=='BQ-CASH')
  self.assertEqual(rubric_disposition(independent,states)['status'],'SUPPORTED')
 def test_raw_nci_conflict_does_not_revoke_exact_reviewed_overlay(self):
  g=Graph('VHM')
  for n in self.d['VHM']['metrics']:g.add(deepcopy(n))
  states=g.recalculate_dispositions({'RAW_EXTRACTION:VHM:NCI':'CONFLICT'})
  self.assertEqual(states[self.metric('VHM','PARENT_ACCOUNTING_CAPITAL')['id']],'SUPPORTED')
  qualified=g.recalculate_dispositions({self.metric('VHM','CHECKED_NCI')['id']:'CONFLICT'})
  self.assertEqual(qualified[self.metric('VHM','PARENT_ACCOUNTING_CAPITAL')['id']],'CONFLICT')
  self.assertEqual(qualified[self.metric('VHM','CFO')['id']],'SUPPORTED')
 def test_capex_outflow_sign_is_not_double_negated(self):
  m=self.metric('FPT','CASH_CAPEX_REPORTED',2024)
  self.assertEqual(m['value'],'3275312325702')
  self.assertTrue(any(c.get('value')=='-3275312325702' for c in m['extractionCandidates']))
  self.assertEqual(self.metric('FPT','POST_ACQUISITION_CASH',2024)['value'],'8428464863166')
 def test_complete_band_topics_and_distinct_counterevidence(self):
  rm={r['id']:r for r in self.rules};completed=[]
  for d in self.d.values():
   self.assertEqual(len(d['rubrics']),23)
   for r in d['rubrics']:
    if r['status']=='SUPPORTED':
     a=r['assessment'];rule=rm[r['rubric']];band=next(x for x in rule['bands'] if x['label']==r['band'])
     self.assertTrue(band['min']<=r['points']<=band['max']);self.assertEqual({e['topic'] for e in a['evidence']},set(rule['topics']));self.assertTrue(a['disconfirmingEvidence']);completed.append(r)
    else:self.assertIsNone(r['points'])
   for k in ['totalScore','ranking','currentSignal','valuationPerShare','marginOfSafety']:self.assertIsNone(d[k])
  self.assertEqual(len(completed),4);self.assertEqual(sum(r['newCompleted'] for r in completed),3)
 def test_inherited_valuation_variants_preserve_id_name_assumptions_and_values(self):
  for t in PILOT:
   prior=read(ROOT/f'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-04/investment-research-v2/issuers/{t}.json')
   cases=self.d[t]['estimates']['conditionalValuationCases']
   self.assertEqual(len(cases),len(prior['modelScenarios']))
   for c,p in zip(cases,prior['modelScenarios']):
    self.assertEqual(c['name'],p.get('name') or p['id']);self.assertEqual(c['equityValueVnd'],p['equityValueVnd']);self.assertEqual(c['earningsInputVnd'],p['earningsInputVnd']);self.assertFalse(c['newValuationAcceptance'])
    self.assertTrue(c['invalidatedBy'])
 def test_source_pointers_original_values_and_hashes(self):
  cache={}
  for d in self.d.values():
   for n in d['metrics']:
    if n['kind']!='REPORTED_FACT' or n['status']!='SUPPORTED' or not n.get('observationBinding'):continue
    b=n['observationBinding'];p=b['path']
    if p not in cache:cache[p]=read(ROOT/p)
    obs=pointer(cache[p],b['jsonPointer']);self.assertEqual(obs['normalized']['value'],n['value']);self.assertEqual(obs['raw'],n['raw'])
    self.assertEqual(sha(ROOT/n['pdfEvidence']['path']),n['pdfEvidence']['sha256'])
 def test_output_and_input_pins(self):
  for p,h in read(OUT/'manifest.json')['outputs'].items():self.assertEqual(sha(OUT/p),h,p)
  for p,h in read(OUT/'input-snapshot.json')['pins'].items():self.assertEqual(sha(ROOT/p),h,p)
 def test_m1_m8_baseline_database_and_dfr01_unchanged(self):
  b=read(OUT/'protected-fingerprints.json');self.assertEqual(b['before'],b['after'])
  for p,h in b['before'].items():self.assertEqual(sha(ROOT/p),h,p)
 def test_no_production_import_or_database_write_paths(self):
  for folder in ['src','app']:
   for p in (ROOT/folder).rglob('*'):
    if p.suffix in ('.ts','.tsx','.json'):
     s=p.read_text();self.assertNotIn('dfr-02',s);self.assertNotIn('dfr02',s)
  code=(ROOT/'scripts/build-dfr02.py').read_text()
  self.assertNotIn('sqlite3.connect',code);self.assertNotIn('UPDATE ',code);self.assertNotIn('INSERT ',code)

if __name__=='__main__':unittest.main(verbosity=2)
