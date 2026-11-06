"""Actual deterministic/read-only SSI engineering checks; no source mutation."""
import unittest,json
from dataclasses import replace
from copy import deepcopy
from lib.dfr05_ssi_v4 import *

class SSIContractTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.result=replay(p1.Store());cls.d=cls.result['dossier'];cls.metrics={m['id']:m for m in cls.d['metrics']}
 def test_authorized_identity(self):self.assertEqual(authorize(SSI),SSI)
 def test_every_other_universe_issuer_rejected(self):
  for r in p1.Store().read(acb.UNIVERSE)['constituents']:
   if r['ticker']!='SSI':
    with self.subTest(ticker=r['ticker']),self.assertRaises(ValueError):authorize(replace(SSI,ticker=r['ticker'],securityId=r['securityId']))
 def test_every_tuple_field_rejected(self):
  for k in ('securityId','ticker','m3Sector','researchSubtype','reportingScope'):
   with self.subTest(field=k),self.assertRaises(ValueError):Adapter(p1.Store(),'PDF',replace(SSI,**{k:'UNAUTHORIZED'}))
 def test_wrong_universe_rejected(self):
  s=p1.Store();s.cache[acb.UNIVERSE]=deepcopy(s.read(acb.UNIVERSE));s.cache[acb.UNIVERSE]['contentHash']='wrong'
  with self.assertRaises(ValueError):verify_identity(s,SSI)
 def test_scope_gate(self):
  self.assertEqual(self.result['scopeQualification']['scope'],'CONSOLIDATED');self.assertEqual({s['fiscalYear'] for s in self.result['scopeQualification']['qualifiedStatements']},{2022,2023,2024,2025})
 def test_no_tcX_or_bank_data(self):
  self.assertTrue(all(m['id'].startswith('SSI:CONSOLIDATED:') for m in self.d['metrics']));self.assertFalse(any('BANK_' in m['concept'] or 'FCF' in m['concept'] for m in self.d['metrics']))
 def test_financial_graph_foreign_identity_scope_rejected(self):
  for scope,ticker in [('STANDALONE','SSI'),('CONSOLIDATED','TCX')]:
   n=deepcopy(self.metrics['SSI:CONSOLIDATED:TOTAL_ASSETS:2025']);n.update(scope=scope,id=f'{ticker}:{scope}:TOTAL_ASSETS:2025')
   with self.assertRaises(ValueError):FinancialGraph(SSI).add(n)
 def test_raw_native_decimal(self):
  for m in self.d['metrics']:
   if m.get('raw'):
    self.assertEqual(d2.number(m['raw']['lexicalValue'])*d2.number(m['raw']['multiplier']),d2.number(m['value']));self.assertEqual(m['raw']['multiplier'],'1')
 def test_source_bindings(self):
  s=p1.Store(expected=self.result['inputPins'])
  for m in self.d['metrics']:
   if m.get('observationBinding'):
    b=m['observationBinding'];self.assertEqual(s.bind(b['path'],b['jsonPointer']),b);self.assertEqual(s.pin(m['pdfEvidence']['path'])['sha256'],m['pdfEvidence']['sha256'])
 def test_periods(self):
  for m in self.d['metrics']:
   if m['status']=='SUPPORTED':self.assertEqual(m['periodEnd'],f"{m['year']}-12-31")
 def test_exact_ratio(self):
  m=self.metrics['SSI:CONSOLIDATED:MARGIN_EQUITY:2025'];self.assertEqual(m['value'],d2.ratio('38616232016646','32066318460762'));self.assertEqual(m['exactFraction'],{'numerator':'38616232016646','denominator':'32066318460762'})
 def test_client_segregation(self):
  for m in self.d['metrics']:
   if m['kind']=='DERIVED_METRIC' and m['status']=='SUPPORTED':self.assertFalse(any('CUSTOMER_' in dep for dep in m['dependencyIds']))
  for c in ('CUSTOMER_CUSTODY_ASSETS_OFF_BALANCE','UNRESTRICTED_CORPORATE_LIQUIDITY'):
   self.assertEqual(self.metrics[f'SSI:CONSOLIDATED:{c}:2025']['status'],'MISSING')
  self.assertEqual(self.metrics['SSI:CONSOLIDATED:CUSTOMER_CASH_OFF_BALANCE:2025']['value'],'8393795223327')
  self.assertEqual(self.metrics['SSI:CONSOLIDATED:CUSTOMER_CASH_OFF_BALANCE:2025']['economicOwnership'],'CLIENT_OFF_BALANCE')
 def test_client_cash_cannot_be_derived_as_corporate_liquidity(self):
  g=FinancialGraph(SSI);a=self.metrics['SSI:CONSOLIDATED:CASH_AND_EQUIVALENTS:2025'];b=self.metrics['SSI:CONSOLIDATED:CUSTOMER_CASH_OFF_BALANCE:2025']
  with self.assertRaises(ValueError):g.derive('FALSE_CORPORATE_CASH',2025,[a,b],'sum','forbidden mixed ownership')
 def test_margin_definition(self):self.assertEqual(self.metrics['SSI:CONSOLIDATED:SECURITIES_MARGIN_LOANS:2025']['value'],'38616232016646')
 def test_restatement_preserved(self):
  self.assertEqual(self.metrics['SSI:CONSOLIDATED:NET_INCOME_ATTRIBUTABLE_PARENT:2024']['revisionBasis'],'RESTATED_REVIEWED_VINTAGE');self.assertEqual(self.metrics['SSI:CONSOLIDATED:NET_INCOME_ATTRIBUTABLE_PARENT_YOY:2025']['status'],'SUPPORTED');self.assertEqual(self.metrics['SSI:CONSOLIDATED:NET_INCOME_ATTRIBUTABLE_PARENT_YOY:2025']['value'],d2.ratio('1401869047697','2704221369052'))
 def test_same_pdf_not_revision_authority(self):
  a=deepcopy(self.metrics['SSI:CONSOLIDATED:TOTAL_ASSETS:2025']);b=deepcopy(self.metrics['SSI:CONSOLIDATED:TOTAL_EQUITY:2025']);b['revisionBasis']='RESTATED_REVIEWED_VINTAGE';a['columnCohort']='BEFORE';b['columnCohort']='AFTER';b['pdfEvidence']=a['pdfEvidence']
  self.assertFalse(d2.compatible([a,b]));g=FinancialGraph(SSI);self.assertEqual(g.derive('TEST',2025,[a,b],'ratio','negative source-column fixture')['status'],'CONFLICT')
 def test_explicit_cohort_bridge_rejects_wrong_column_operand(self):
  g=FinancialGraph(SSI);g.revision_bridges=p1.Store().read(BINDINGS)['revisionBridges'];a=deepcopy(self.metrics['SSI:CONSOLIDATED:NET_INCOME_ATTRIBUTABLE_PARENT:2025']);b=deepcopy(self.metrics['SSI:CONSOLIDATED:NET_INCOME_ATTRIBUTABLE_PARENT:2024']);b['value']='2704221369053'
  with self.assertRaises(ValueError):g.derive('NET_INCOME_ATTRIBUTABLE_PARENT_YOY',2025,[a,b],'growth','negative bridge',across_years=True)
 def test_scope_mismatch(self):
  a=deepcopy(self.metrics['SSI:CONSOLIDATED:TOTAL_ASSETS:2025']);b=deepcopy(a);b['scope']='STANDALONE';self.assertFalse(d2.compatible([a,b]))
 def test_period_mismatch(self):
  a=deepcopy(self.metrics['SSI:CONSOLIDATED:NET_INCOME:2025']);a['periodStart']='2025-04-01';self.assertFalse(d2.compatible([a]))
 def test_null_missing_zero_distinct(self):
  self.assertEqual(p1.value_state({}),'MISSING');self.assertEqual(p1.value_state({'value':None}),'EXPLICIT_NULL');self.assertEqual(p1.value_state({'value':'0'}),'ZERO')
 def test_missing_never_zero(self):
  for m in self.d['metrics']:
   if m['status'] in ('MISSING','CONFLICT'):self.assertIsNone(m['value'])
 def test_no_industrial_fcf(self):self.assertFalse(any(m['concept'] in ('FCF','CASH_CAPEX_REPORTED','CFO_NPAT') for m in self.d['metrics']))
 def test_rubrics_unchanged_topics_no_scores(self):
  specs=p1.module('ssi_test_specs','scripts/build-dfr02.py').rubrics();self.assertEqual(len(self.d['rubrics']),23)
  for r,s in zip(self.d['rubrics'],specs):
   self.assertEqual(r['requiredTopics'],s['topics']);self.assertEqual(r['rubric'],s['id']);self.assertTrue(all(r[k] is None for k in ('points','band','assessment')))
 def test_research_only(self):
  self.assertEqual(self.d['classification'],'RESEARCH_PROVISIONAL');self.assertFalse(self.d['productionAdmissible']);self.assertFalse(self.d['scoringAuthorized']);self.assertTrue(all(self.d[k] is None for k in ('categoryScores','totalScore','ranking','currentSignal','valuationPerShare')))
 def test_graph_acyclic(self):self.graph().validate()
 def graph(self):
  g=DependencyGraph()
  for n in self.result['dependencyGraph']['nodes']:g.nodes[n['id']]=n
  for e in self.result['dependencyGraph']['edges']:g.edge(e['source'],e['target'],e['role'],e['propagates'])
  return g
 def test_dangling_rejected(self):
  with self.assertRaises(ValueError):self.graph().edge('does-not-exist','also-missing')
 def test_cycle_rejected(self):
  g=self.graph();e=next(iter(g.edges));g.edge(e[1],e[0]);
  with self.assertRaises(ValueError):g.validate()
 def test_conflict_injections_exact_locality(self):
  graph=self.graph();receipts=[]
  for c in ('SECURITIES_MARGIN_LOANS','FINANCIAL_DEBT','CUSTOMER_CASH_OFF_BALANCE','NET_INCOME_ATTRIBUTABLE_PARENT'):
   changed='SSI:CONSOLIDATED:'+c+':2025';affected=graph.affected([changed]);states={k:v['status'] for k,v in affected.items()}
   # Independent fixed-point transitive closure, not graph.affected implementation.
   expected={changed}
   while True:
    expanded=expected|{e['target'] for e in self.result['dependencyGraph']['edges'] if e['source'] in expected and e['propagates']}
    if expanded==expected:break
    expected=expanded
   self.assertEqual(set(affected),expected);unrelated='SSI:CONSOLIDATED:GROUP_ROA_AVG:2025';self.assertNotIn(unrelated,affected)
   for mid in affected:
    if mid in self.metrics and self.metrics[mid]['kind']=='DERIVED_METRIC':self.assertIn(states[mid],('CONFLICT','MATERIAL_CONFLICT'))
   overlay=deepcopy(self.result)
   for m in overlay['dossier']['metrics']:
    if m['id'] in affected:m.update(status='CONFLICT',value=None)
   self.assertEqual(self.d,self.result['dossier'])
   receipts.append(dict(changedNode=changed,originalStatus=self.metrics[changed]['status'],affected=sorted(affected),unaffected=sorted(set(graph.nodes)-set(affected)),overlayHash=p1.digest(overlay['dossier']),sourceMutation=False))
  self.__class__.injections=receipts
 def test_provider_unknown_units_never_support(self):
  for c in self.result['reconciliation']:
   if c['unit'] is None:self.assertEqual(c['status'],'REFERENCE_ONLY')
 def test_predecessor_full_parity(self):self.assertEqual(p1.module('ssi_test_builder','scripts/build-dfr05-ssi.py').parity()['status'],'PASS')
 def test_fresh_replay(self):self.assertEqual(self.result,replay(p1.Store()))

if __name__=='__main__':
 suite=unittest.defaultTestLoader.loadTestsFromTestCase(SSIContractTests);result=unittest.TextTestRunner(verbosity=2).run(suite)
 # Only a new SSI validation artifact, never predecessor evidence.
 if result.wasSuccessful():
  out=ROOT/REL/'conflict-injection-results.json';out.write_text(json.dumps(dict(status='PASS',records=SSIContractTests.injections),indent=2)+'\n')
 raise SystemExit(0 if result.wasSuccessful() else 1)
