"""P1 actual six-pilot replay plus bounded adversarial contract checks."""
import json,unittest,tempfile
from pathlib import Path
from copy import deepcopy
from lib.dfr05_p1 import ROOT,D2,D4,PILOT,Store,Adapter,DependencyGraph,Foundation,value_state,digest,replay_metrics,number,validate_dossier
OUT=ROOT/'docs/fundamental-data-engine/dfr-05/p1-a46da9a8'
class P1(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.ds={t:json.loads((OUT/f'issuers/{t}.json').read_text()) for t in PILOT};cls.payload=json.loads((OUT/'dependency-graph.json').read_text());cls.graph=DependencyGraph();cls.graph.nodes={n['id']:n for n in cls.payload['nodes']};cls.graph.edges={(e['source'],e['target'],e['role'],e['propagates']) for e in cls.payload['edges']}
 def test_exact_six_and_138(self):
  self.assertEqual(set(self.ds),set(PILOT));self.assertEqual(sum(len(d['rubrics']) for d in self.ds.values()),138)
 def test_all_metric_objects_and_provider_crosschecks_equal(self):
  for t,d in self.ds.items():
   old=json.loads((ROOT/D2/f'issuers/{t}.json').read_text());self.assertEqual(d['metrics'],old['metrics']);self.assertEqual(d['providerCrosschecks'],old['providerCrosschecks'])
 def test_all_25_assessments_and_113_deferred_exact(self):
  complete=deferred=0
  for t,d in self.ds.items():
   old=json.loads((ROOT/D4/f'issuers/{t}.json').read_text());self.assertEqual(d['rubrics'],old['rubrics'])
   for r in d['rubrics']:
    if r['status']=='COMPLETED_RESEARCH':complete+=1
    else:deferred+=1;self.assertIsNone(r['points']);self.assertIsNone(r['band'])
  self.assertEqual((complete,deferred),(25,113))
 def test_decimal_values_not_binary(self):
  self.assertEqual(number('9007199254740993.000001')-number('9007199254740993'),number('0.000001'))
  for d in self.ds.values():
   for m in d['metrics']:
    if m['value'] is not None:self.assertIsInstance(m['value'],str);number(m['value'])
 def test_zero_null_missing_distinct(self):
  self.assertEqual([value_state(x) for x in [{},{'value':None},{'value':'0'},{'value':'-1.25'}]],['MISSING','EXPLICIT_NULL','ZERO','NUMERIC'])
  self.assertRaises(ValueError,value_state,{'value':0});self.assertRaises(ValueError,value_state,{'value':'-'})
 def test_no_synthetic_totals_or_production_authority(self):
  for d in self.ds.values():
   self.assertEqual(d['classification'],'RESEARCH_PROVISIONAL');self.assertFalse(d['productionAdmissible']);self.assertFalse(d['scoringAuthorized'])
   for k in ['totalScore','ranking','currentSignal','valuationPerShare']:self.assertIsNone(d[k])
 def test_every_metric_topic_rubric_has_no_dangling_edges(self):
  self.graph.validate();kinds={n['kind'] for n in self.graph.nodes.values()};self.assertTrue({'METRIC','TOPIC','RUBRIC','QUALIFIED_EVIDENCE','SOURCE_CELL','NOTE_PAGE'}<=kinds)
  self.assertEqual(sum(n['kind']=='RUBRIC' for n in self.graph.nodes.values()),138)
 def test_topic_nodes_exact_m3(self):
  for d in self.ds.values():
   for r in d['rubrics']:
    for topic in r['requiredTopics']:self.assertIn('TOPIC:'+r['id']+':'+topic,self.graph.nodes)
 def test_conflict_local_source_to_topic_to_rubric(self):
  states=self.graph.affected({'C:VHM:70'});affected={k for k in states if k.startswith('RUBRIC:')};self.assertEqual(affected,{'RUBRIC:VHM:FH-BS','RUBRIC:VHM:RG-RISK'});self.assertTrue(all(v['points'] is None for v in states.values()))
  self.assertFalse(any(k.startswith('RUBRIC:FPT:') for k in states))
 def test_metric_conflict_propagates_to_transitive_calcs(self):
  affected=self.graph.affected({'METRIC:FPT:CONSOLIDATED:CFO:2025'});self.assertIn('METRIC:FPT:CONSOLIDATED:POST_ACQUISITION_CASH:2025',affected);self.assertIn('RUBRIC:FPT:BQ-CASH',affected);self.assertNotIn('RUBRIC:FPT:FH-BS',affected)
 def test_legacy_debt_exceptions_not_issuer_wide(self):
  for t,gap in [('VIC','3984711000000'),('VHM','2671708000000')]:
   id='LEGACY_DEBT_EXCEPTION:'+t;self.assertEqual(self.graph.nodes[id]['differenceVnd'],gap)
   changed=self.graph.affected({f'METRIC:{t}:CONSOLIDATED:REPORTED_BORROWINGS:2025'});self.assertIn(id,changed);self.assertNotIn('RUBRIC:'+t+':FH-BS',changed)
 def test_tcx_minor_conflict_is_preserved(self):
  n=next(m for m in self.ds['TCX']['metrics'] if m['concept']=='PRINTED_COMMON_EPS_NUMERATOR');self.assertEqual(n['status'],'CONFLICT');self.assertIsNone(n['value']);self.assertEqual(str(n['conflict']['differenceVnd']),'1')
  self.assertNotIn('RUBRIC:TCX:FH-BS',self.graph.affected({'METRIC:'+n['id']}))
 def test_unreviewed_candidate_reference_does_not_revoke_overlay(self):
  pairs=[e for e in self.payload['edges'] if e['role']=='UNREVIEWED_CANDIDATE_REFERENCE'];self.assertTrue(pairs)
  for e in pairs[:10]:self.assertFalse(e['propagates']);self.assertNotIn(e['target'],self.graph.affected({e['source']}))
 def test_graph_cycles_dangling_cross_issuer_rejected(self):
  g=DependencyGraph();g.add('a','METRIC','FPT');g.add('b','METRIC','VNM');self.assertRaises(ValueError,g.edge,'a','b');self.assertRaises(ValueError,g.edge,'a','missing');g.add('c','TOPIC','FPT');g.edge('a','c');g.edge('c','a');self.assertRaises(ValueError,g.validate)
 def test_new_issuer_rejected_every_entry(self):
  self.assertRaises(ValueError,Adapter,Store(),'PDF','HPG');self.assertRaises(ValueError,replay_metrics,Store(),'HPG');self.assertRaises(ValueError,DependencyGraph().add,'a','METRIC','HPG')
 def test_path_escape_and_source_hash_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'a.json';p.write_text('{"value":"1"}');s=Store(tmp,{'a.json':'0'*64});self.assertRaises(ValueError,s.read,'a.json');self.assertRaises(ValueError,s.read,'../a.json');self.assertRaises(ValueError,s.read,str(p))
 def test_source_changed_during_replay_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'a.json';p.write_text('{"value":"1"}');s=Store(tmp);s.read('a.json');p.write_text('{"value":"2"}');self.assertRaises(ValueError,s.validate)
 def test_unsupported_kind_and_schema_rejected(self):
  self.assertRaises(ValueError,Adapter,Store(),'NEW_PROVIDER','FPT')
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'data/manual-extracted-pdf/FPT.json';p.parent.mkdir(parents=True);p.write_text('{"ticker":"VNM","schemaVersion":"manual-display-v1","productionAdmissible":false}');self.assertRaises(ValueError,list,Adapter(Store(tmp),'PDF','FPT').records())
 def test_four_legacy_schemas_are_explicit_not_fabricated(self):
  x=json.loads((OUT/'qualification-replay.json').read_text());ids={r['id'] for r in x if r['validation'].startswith('SEALED_LEGACY')};self.assertEqual(ids,{'VNM:BQ-CASH','BID:RG-UNC','VIC:RG-UNC','VHM:RG-UNC'})
 def test_sector_differences_and_no_formal_route_promotion(self):
  self.assertEqual(len({d['sectorRouting']['researchSubtype'] for d in self.ds.values()}),6)
  for d in self.ds.values():self.assertFalse(d['sectorRouting']['formalSectorAdmission'])
  self.assertIn('no industrial',self.ds['BID']['sectorRouting']['rule']);self.assertIn('NCI',self.ds['VHM']['sectorRouting']['rule'])
 def test_all_source_dimensions_and_pointers_preserved(self):
  for t in PILOT:
   cells=json.loads((OUT/f'sources/{t}.json').read_text());self.assertEqual({c['id'].split(':')[2] for c in cells},{'PDF','NOTES','CAFEF','COMBINED'})
   self.assertEqual(len(cells),len({c['id'] for c in cells}))
   for c in cells:
    self.assertTrue(c['binding']['sha256']);self.assertTrue(c['binding']['jsonPointer']);self.assertIsNone(c['publicationAt']);self.assertNotEqual(c['status'],'SUPPORTED')
    if c['kind']=='SOURCE_CELL':self.assertIn('revision',c);self.assertIn('unit',c);self.assertIn('scope',c);self.assertIn('period',c)
 def test_adapter_determinism_and_no_unit_inference(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'data/manual-extracted-api/FPT.json';p.parent.mkdir(parents=True);p.write_text(json.dumps(dict(schemaVersion='cafef-display-v1',ticker='FPT',productionAdmissible=False,reports={'r':{'periods':{'2025':{'variants':[{'year':2025,'periodType':'ANNUAL','groups':[{'rows':[{'code':'x','value':'0'},{'code':'x','value':None},{}]}]}]}}}})))
   s=Store(tmp);a=list(Adapter(s,'CAFEF','FPT').records());self.assertEqual(a,list(Adapter(s,'CAFEF','FPT').records()));self.assertEqual([r['valueState'] for r in a],['ZERO','EXPLICIT_NULL','MISSING']);self.assertIsNone(a[0]['unit']);self.assertEqual(a[0]['status'],'REFERENCE_ONLY')
 def test_raw_decimal_source_replay_and_rejection(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'raw.json';p.write_text('{"value":9007199254740993.000001,"zero":0,"null":null}')
   import hashlib
   h=hashlib.sha256(p.read_bytes()).hexdigest();s=Store(tmp);b=s.raw_binding('raw.json','/value',h,'9007199254740993.000001','NUMERIC');self.assertEqual(b['rawDecimal'],'9007199254740993.000001')
   self.assertEqual(s.raw_binding('raw.json','/zero',h,'0','ZERO')['rawDecimal'],'0');self.assertIsNone(s.raw_binding('raw.json','/null',h,None,'EXPLICIT_NULL')['rawDecimal'])
   self.assertRaises(ValueError,s.raw_binding,'raw.json','/value',h,'9007199254740993','NUMERIC');self.assertRaises(ValueError,s.raw_binding,'raw.json','/zero','0'*64,'0','ZERO')
 def test_dossier_contract_rejects_zero_missing_and_formal_flags(self):
  d=deepcopy(self.ds['FPT']);self.assertTrue(validate_dossier(d));d['totalScore']=0;self.assertRaises(ValueError,validate_dossier,d)
  d=deepcopy(self.ds['FPT']);d['productionAdmissible']=True;self.assertRaises(ValueError,validate_dossier,d)
  d=deepcopy(self.ds['FPT']);next(r for r in d['rubrics'] if r['status']=='NOT_RATED')['points']=0;self.assertRaises(ValueError,validate_dossier,d)
 def test_unsupported_band_or_missing_topic_rejected(self):
  d=deepcopy(self.ds['FPT']);a=next(r['assessment'] for r in d['rubrics'] if r['status']=='COMPLETED_RESEARCH');a['assessment']='Invented';self.assertRaises(ValueError,validate_dossier,d)
  d=deepcopy(self.ds['FPT']);next(r['assessment'] for r in d['rubrics'] if r['status']=='COMPLETED_RESEARCH')['evidence'].pop();self.assertRaises(ValueError,validate_dossier,d)
 def test_inventory_is_pinned_without_copying_unrelated_rows(self):
  inv=json.loads((OUT/'retained-source-inventory.json').read_text());self.assertEqual(len(inv),24)
  for i in inv:self.assertGreaterEqual(i['availableRows'],i['materializedRows']);self.assertTrue(i['binding']['sha256'])
  self.assertGreater(sum(i['availableRows'] for i in inv),sum(i['materializedRows'] for i in inv))
 def test_approved_methodology_and_database_fingerprints(self):
  import hashlib
  pins=json.loads((OUT/'baseline-snapshot.json').read_text())['protectedFiles']
  selected=[p for p in pins if p=='src/domain/scoring/methodology.ts' or p.startswith('data/vn30.sqlite') or p=='src/infrastructure/dependencies/active-authorities.json']
  self.assertGreaterEqual(len(selected),3)
  for p in selected:self.assertEqual(hashlib.sha256((ROOT/p).read_bytes()).hexdigest(),pins[p])
if __name__=='__main__':unittest.main(verbosity=2)
