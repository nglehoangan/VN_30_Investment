import unittest,json,sys
from copy import deepcopy
from decimal import Decimal
from pathlib import Path
import importlib.util
spec=importlib.util.spec_from_file_location('d4',Path(__file__).with_name('build-dfr04.py'));d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d)
from lib.dfr03 import propagate,propagate_from_metrics
class RecoveryTests(unittest.TestCase):
 def test_01_all_six_138(self):
  rows=d.load('completion-matrix.json');self.assertEqual(len(rows),138)
  for t in d.PILOT:self.assertEqual(sum(x['ticker']==t for x in rows),23)
 def test_02_old_seven_unchanged(self):
  old=d.read(d.D3+'/eligibility.json');new={x['id']:x for x in d.load('completion-matrix.json')}
  for x in old:
   if x['status']=='COMPLETED_RESEARCH':
    for k in ['assessment','band','points']:self.assertEqual(x[k],new[x['id']][k])
 def test_03_four_pending_completed_first(self):
  pending=[x['id'] for x in d.read(d.D3+'/eligibility.json') if x['eligibility']=='ANALYST_REVIEW_PENDING'];a=d.load('preparation.json')['assessments']
  self.assertEqual(set(pending),{x['id'] for x in a[:4]});self.assertEqual(d.load('summary.json')['fourPendingResolved'],4)
 def test_04_parity_and_protected(self):d.check()
 def test_05_all_new_topic_bound(self):
  rm={x['id']:x for x in d.rules()}
  for a in d.load('preparation.json')['assessments']:self.assertTrue(d.validate(a,rm[a['subcategory']]))
 def test_06_unsupported_band_rejected(self):
  a=deepcopy(d.load('preparation.json')['assessments'][0]);a['assessment']='invented'
  with self.assertRaises(ValueError):d.validate(a,next(x for x in d.rules() if x['id']==a['subcategory']))
 def test_07_unrelated_topic_rejected(self):
  a=deepcopy(d.load('preparation.json')['assessments'][1]);a['evidence'][-1]['refs']=['NOTE:TCX:14']
  with self.assertRaises(ValueError):d.validate(a,next(x for x in d.rules() if x['id']==a['subcategory']))
 def test_08_candidate_rejected(self):
  with self.assertRaises((ValueError,StopIteration)):d.resolve('NOTE:UNREVIEWED:1')
 def test_09_conflict_locality(self):
  aa=d.load('preparation.json')['assessments'];r=propagate(aa,{'NOTE:VIC:86'})
  self.assertEqual([k for k,v in r.items() if v['status']=='MATERIAL_CONFLICT'],['VIC:BQ-CASH']);self.assertEqual(r['VIC:RG-RISK']['status'],'SUPPORTED')
 def test_10_no_missing_zero(self):
  for x in d.load('completion-matrix.json'):
   if x['status']=='NOT_RATED':self.assertIsNone(x['points']);self.assertIsNone(x['assessment'])
  for a in d.load('preparation.json')['assessments']:
   if a['selectedPoints']==0:self.assertTrue(a['economicAdversityBasis']);self.assertTrue(a['evidence'])
 def test_11_all_deferred_exact_path(self):
  for x in d.load('completion-matrix.json'):
   if x['status']=='NOT_RATED':
    z=x['deferred'];self.assertIn(z['resolutionPath'],['E1','E2','E3','E4']);self.assertTrue(z['exactDependency']);self.assertEqual({y['topic'] for y in z['topicDependencies']},set(x['requiredTopics']));self.assertFalse(z['qualifiedTopicCompleteness'])
 def test_12_distinct_passes(self):
  s=d.load('inspection.json');p=d.load('preparation.json');c=d.load('challenge.json');self.assertLess(s['inspectedAt'],p['preparedAt']);self.assertLess(p['preparedAt'],c['challengedAt']);self.assertEqual(c['preparationHash'],d.sha(d.REL+'/preparation.json'))
 def test_13_source_lineage(self):
  for e in d.load('evidence-map.json')['qualified']:
   self.assertEqual(d.h(d.pointer(d.read(e['path']),e['jsonPointer'])),e['boundObjectHash'])
   if e.get('pdfPath'):self.assertEqual(d.sha(e['pdfPath']),e['pdfHash'])
 def test_14_decimal_native_units(self):
  for e in d.load('evidence-map.json')['qualified']:
   for v in e.get('reportedObservations',[]):self.assertIsInstance(v['decimalValue'],str);self.assertTrue(Decimal(v['decimalValue']).is_finite());self.assertTrue(v['originalValue']);self.assertIn(v['declaredUnit'],['VND','MILLION_VND'])
 def test_15_ocr_column_exceptions(self):
  es={e['id']:e for e in d.load('evidence-map.json')['qualified']};self.assertEqual(es['NOTE:VIC:86']['reportedObservations'][1]['decimalValue'],'2994348');self.assertEqual(es['NOTE:VHM:20']['reportedObservations'][-1]['decimalValue'],'-28111513')
 def test_16_no_production_or_totals(self):
  for t in d.PILOT:
   x=d.load(f'issuers/{t}.json');self.assertEqual(x['classification'],'RESEARCH_PROVISIONAL');self.assertFalse(x['scoringAuthorized']);self.assertFalse(x['productionAdmissible'])
   for k in ['totalScore','ranking','valuationPerShare','currentSignal']:self.assertIsNone(x[k])
 def test_17_all_candidates_unqualified(self):
  self.assertTrue(all(x['status']=='CANDIDATE_ONLY' for x in d.load('candidate-index.json')))
 def test_18_no_automatic_next_phase(self):
  self.assertFalse(d.load('summary.json')['productionActivated']);self.assertEqual(d.load('summary.json')['ownerApproval'],'PENDING')
 def test_19_tcX_conflict_not_issuerwide(self):
  rows={x['id']:x for x in d.load('completion-matrix.json')};self.assertEqual(rows['TCX:VAL-PRIMARY']['eligibility'],'VALUATION_MARKET_DEPENDENCY');self.assertEqual(rows['TCX:VAL-PRIMARY']['deferred']['sourceConflict']['severity'],'MINOR');self.assertEqual(rows['TCX:BQ-CASH']['status'],'COMPLETED_RESEARCH');self.assertEqual(rows['TCX:RG-UNC']['status'],'COMPLETED_RESEARCH')
 def test_20_recovered_annual_report_and_all_ready_assessed(self):
  rows={x['id']:x for x in d.load('completion-matrix.json')};es=d.load('evidence-map.json')['qualified']
  self.assertEqual(rows['VNM:IC-IND']['points'],2);self.assertEqual(rows['VNM:RG-RISK']['points'],1)
  self.assertEqual(rows['VNM:IC-CYCLE']['eligibility'],'EXISTS_MAPPING_INCOMPLETE')
  for t in d.PILOT:
   topics={topic for e in es if e['ticker']==t for topic in e['qualifiedTopics']}
   for r in d.rules():
    if set(r['topics']).issubset(topics):self.assertEqual(rows[t+':'+r['id']]['status'],'COMPLETED_RESEARCH')
if __name__=='__main__':unittest.main()
