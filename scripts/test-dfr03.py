from copy import deepcopy
from pathlib import Path
import hashlib
import json
import unittest
from lib.dfr03 import eligibility,validate_review,propagate,propagate_from_metrics,CLASSES
from lib.dfr02 import PILOT
from importlib.util import spec_from_file_location,module_from_spec

ROOT=Path(__file__).resolve().parents[1]
spec=spec_from_file_location('dfr03_builder',ROOT/'scripts/build-dfr03.py');b=module_from_spec(spec);spec.loader.exec_module(b)
OUT=b.OUT
def read(name):return json.loads((OUT/name).read_text())

class DFR03(unittest.TestCase):
 @classmethod
 def setUpClass(c):c.rows=read('eligibility.json');c.new=[r['assessment'] for r in c.rows if r['newCompleted']];c.rules={r['id']:r for r in b.rules()};c.resolve=b.resolver(b.dossiers())
 def test_exact_six_and_138_dispositions(self):
  self.assertEqual(len(self.rows),138);self.assertEqual(len({r['id'] for r in self.rows}),138)
  self.assertEqual({r['ticker'] for r in self.rows},set(PILOT))
  for t in PILOT:self.assertEqual(sum(r['ticker']==t for r in self.rows),23)
  self.assertTrue(all(r['eligibility'] in CLASSES for r in self.rows))
 def test_qualified_completion_not_document_or_metric_growth(self):
  s=read('summary.json');self.assertEqual(s['completed'],7);self.assertEqual(s['newCompleted'],3);self.assertEqual(s['remainingUnscored'],131);self.assertEqual(s['financialMetricChanges'],0)
  self.assertEqual(s['remainingClasses'],{'DATA_MISSING':127,'ANALYST_REVIEW_PENDING':4})
 def test_each_issuer_financial_parity(self):
  parity=read('financial-parity.json')['issuers']
  for t in PILOT:
   d=b.read(f'{b.D2}/issuers/{t}.json');self.assertEqual(b.h(d['metrics']),parity[t]['metricsSha256']);self.assertEqual(b.h(d['estimates']),parity[t]['estimatesSha256']);self.assertEqual(b.h(d['providerCrosschecks']),parity[t]['providerReferencesSha256'])
   self.assertEqual(b.sha(f'{b.D2}/issuers/{t}.json'),parity[t]['dfr02FileSha256'])
 def test_real_distinct_passes_bound_to_exact_preparation(self):
  p=read('preparation.json');c=read('challenge.json');i=read('inspection.json')
  self.assertLess(i['inspectedAt'],p['preparedAt']);self.assertLess(p['preparedAt'],c['challengedAt'])
  self.assertEqual(c['preparationFileSha256'],b.sha(str((OUT/'preparation.json').relative_to(ROOT))))
  self.assertEqual({r['id'] for r in c['records']},{a['id'] for a in p['assessments']})
  for r in c['records']:self.assertEqual(r['preparationHash'],b.h(next(a for a in p['assessments'] if a['id']==r['id'])))
 def test_supported_exact_bands_topics_confidence_assumptions_invalidation(self):
  for a in self.new:self.assertTrue(validate_review(a,self.rules[a['subcategory']],type(self).resolve));self.assertTrue(a['confidence']);self.assertTrue(a['invalidationConditions'])
 def test_unsupported_band_and_missing_topic_rejected(self):
  a=deepcopy(self.new[0]);a['assessment']='Invented band'
  with self.assertRaisesRegex(ValueError,'APPROVED_BAND'):validate_review(a,self.rules[a['subcategory']],type(self).resolve)
  a=deepcopy(self.new[0]);a['evidence'].pop()
  with self.assertRaisesRegex(ValueError,'ALL_EXACT_TOPICS'):validate_review(a,self.rules[a['subcategory']],type(self).resolve)
 def test_conflict_reference_and_unknown_fact_cannot_be_scored(self):
  a=deepcopy(self.new[0]);a['evidence'][0]['refs']=['METRIC:TCX:STANDALONE:PRINTED_COMMON_EPS_NUMERATOR:2025']
  with self.assertRaisesRegex(ValueError,'UNSUPPORTED_TOPIC'):validate_review(a,self.rules[a['subcategory']],type(self).resolve)
  a['evidence'][0]['refs']=['INVENTED_SHARE_OR_MOAT']
  with self.assertRaisesRegex(ValueError,'UNKNOWN_EVIDENCE'):validate_review(a,self.rules[a['subcategory']],type(self).resolve)
 def test_missing_cannot_be_zero_or_na(self):
  self.assertEqual(eligibility(['DATA_MISSING']),'DATA_MISSING')
  with self.assertRaisesRegex(ValueError,'NA_NOT_AUTHORIZED'):eligibility([],applicable=False)
  a=deepcopy(next(a for a in self.new if a['selectedPoints']==0));a['economicAdversityBasis']=False
  with self.assertRaisesRegex(ValueError,'ZERO_CANNOT'):validate_review(a,self.rules[a['subcategory']],type(self).resolve)
  for r in self.rows:
   if r['status']=='NOT_RATED':self.assertIsNone(r['points']);self.assertIsNone(r['band'])
 def test_fpt_targeted_review_and_challenge(self):
  a=next(a for a in self.new if a['id']=='FPT:BQ-CASH');self.assertEqual(a['selectedPoints'],3)
  p=next(a for a in read('preparation.json')['assessments'] if a['id']=='FPT:BQ-CASH');self.assertEqual(p['selectedPoints'],4)
  ex=read('FPT-exception-review.json');self.assertEqual([p['physicalPage'] for p in ex['pages']],[12,13,29,30,31,32]);self.assertEqual(b.sha(ex['pdfPath']),ex['sha256'])
 def test_tcx_minor_conflict_contained_not_erased_or_material_by_default(self):
  a=next(a for a in self.new if a['id']=='TCX:RG-UNC');self.assertEqual(a['selectedPoints'],0)
  refs={r for e in a['evidence']+a['counterevidence'] for r in e['refs']};self.assertNotIn('CONTEXT:TCX',refs);self.assertFalse(any('PRINTED_COMMON_EPS_NUMERATOR' in r for r in refs))
  self.assertEqual(b.dossiers()['TCX']['estimates']['status'],'CONFLICT')
  self.assertEqual(eligibility(['SUFFICIENT']),'READY_FOR_ASSESSMENT')
 def test_vnm_uncertainty_distinct_from_cash_quality(self):
  a=next(a for a in self.new if a['id']=='VNM:RG-UNC');self.assertEqual(a['selectedPoints'],1);self.assertIn('NOT_DUPLICATE_CASH',a['economicChannel'])
  old=next(r for r in self.rows if r['id']=='VNM:BQ-CASH');self.assertTrue(old['baselineCompleted']);self.assertEqual(old['points'],3)
 def test_conflicts_propagate_only_along_explicit_dependencies(self):
  key='METRIC:FPT:CONSOLIDATED:CFO_REPORTED_NPAT:2025';states=propagate(self.new,{key})
  self.assertEqual(states['FPT:BQ-CASH']['status'],'MATERIAL_CONFLICT');self.assertIsNone(states['FPT:BQ-CASH']['points']);self.assertEqual(states['TCX:RG-UNC']['status'],'SUPPORTED');self.assertEqual(states['VNM:RG-UNC']['status'],'SUPPORTED')
 def test_source_conflict_transits_metric_graph_to_rubric_only(self):
  states=propagate_from_metrics(self.new,b.dossiers(),{'FPT:CONSOLIDATED:CFO:2025':'CONFLICT'})
  self.assertEqual(states['metricStates']['FPT:CONSOLIDATED:CFO_REPORTED_NPAT:2025'],'CONFLICT')
  self.assertEqual(states['assessmentStates']['FPT:BQ-CASH']['status'],'MATERIAL_CONFLICT')
  self.assertEqual(states['assessmentStates']['TCX:RG-UNC']['status'],'SUPPORTED')
  self.assertEqual(states['assessmentStates']['VNM:RG-UNC']['status'],'SUPPORTED')
  self.assertEqual(states['metricStates']['FPT:CONSOLIDATED:REVENUE:2025'],'SUPPORTED')
 def test_prior_judgments_preserved_exactly(self):
  ds=b.dossiers()
  for r in self.rows:
   if r['baselineCompleted']:
    old=next(x for x in ds[r['ticker']]['rubrics'] if x['rubric']==r['rubric']);self.assertEqual(r['points'],old['points']);self.assertEqual(r['band'],old['band']);self.assertEqual(r['assessment']['evidence'],old['assessment']['evidence'])
 def test_manifest_and_input_dependency_integrity(self):
  for p,v in read('manifest.json')['outputs'].items():self.assertEqual(hashlib.sha256((OUT/p).read_bytes()).hexdigest(),v,p)
  b.pins_check(read('inspection.json')['pins'])
 def test_protected_production_and_database_unchanged(self):self.assertEqual(b.protected(),read('inspection.json')['protectedBefore'])
 def test_no_partial_totals_or_production_route(self):
  for t in PILOT:
   d=read(f'issuers/{t}.json')
   for k in ['totalScore','ranking','currentSignal','valuationPerShare']:self.assertIsNone(d[k])
   self.assertFalse(d['productionAdmissible']);self.assertFalse(d['scoringAuthorized'])
  for folder in ['src','app']:
   for p in (ROOT/folder).rglob('*.ts*'):self.assertNotIn('dfr-03',p.read_text())

if __name__=='__main__':unittest.main(verbosity=2)
