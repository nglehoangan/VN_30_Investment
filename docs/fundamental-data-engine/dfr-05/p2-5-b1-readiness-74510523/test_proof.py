"""Second-pass challenge of feasibility assertions; never invokes a formal engine."""
import unittest,json,random,hashlib
from pathlib import Path
from copy import deepcopy
import proof

class ReadinessChallenge(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.d,cls.metrics,cls.rows,cls.leads,cls.inventory=proof.collect();cls.selection=proof.select(cls.d,cls.rows);cls.market=proof.market_inventory()
 def test_exact_six_issuer_138_instances(self):
  self.assertEqual(len(self.rows),138);self.assertEqual({r['ticker'] for r in self.rows},set(proof.TICKERS));self.assertEqual(len({(r['ticker'],r['rubric']) for r in self.rows}),138)
 def test_all_approved_topics_categories_unchanged(self):
  specs={s['id']:s for s in proof.specs()}
  for r in self.rows:self.assertEqual(r['requiredTopics'],specs[r['rubric']]['topics']);self.assertEqual(r['category'],specs[r['rubric']]['category'])
 def test_no_fake_readiness(self):
  self.assertEqual(sum(r['status']=='READY' for r in self.rows),0)
  self.assertTrue(all(not r['canScoreNow'] for r in self.rows));self.assertTrue(all(not t['fullTopicQualified'] for r in self.rows for t in r['topicEvidence']))
 def test_partial_metric_cannot_grant_ready(self):
  self.assertNotEqual(proof.readiness(['returns','cost_of_capital'],{'returns':'PARTIAL_FINANCIAL_CONTEXT','cost_of_capital':'NOT_QUALIFIED'},False,100,True,True,True),'READY')
 def test_source_leads_never_full_qualification(self):
  self.assertTrue(all(x['status']=='CANDIDATE_ONLY_NOT_QUALIFIED_TOPIC' for v in self.leads.values() for x in v));self.assertGreater(sum(len(v) for v in self.leads.values()),0)
 def test_each_row_has_every_blocking_dimension(self):
  for r in self.rows:
   for k in ('qualifiedReportedFacts','supportedMetrics','missingMetrics','conflicts','qualitativeEvidenceRequirements','analystAssumptions','valuationDependencies','historicalAvailabilityLimitations','exactBlockingDependencies','priorRubricBinding'):self.assertIn(k,r)
 def test_exact_metric_projection_parity(self):
  self.assertEqual(len(self.metrics),829)
  for m in self.metrics.values():
   b=m['sourceBinding'];source=proof.read(b['path']);original=proof.p1.pointer(source,b['jsonPointer']);self.assertEqual(proof.p1.digest(original),b['objectHash'])
   for k in ('id','scope','year','value','status','dependencyIds'):self.assertEqual(m[k],original[k])
 def test_metric_values_decimal_strings_missing_not_zero(self):
  for m in self.metrics.values():
   if m['status'] in ('MISSING','CONFLICT'):self.assertIsNone(m['value'])
   elif m['value'] is not None:self.assertIsInstance(m['value'],str);proof.Decimal(m['value'])
 def test_every_metric_dependency_same_issuer(self):
  for m in self.metrics.values():
   for dep in m['dependencyIds']:self.assertIn(dep,self.metrics);self.assertEqual(self.metrics[dep]['ticker'],m['ticker'])
 def test_local_conflicts_retained(self):
  self.assertEqual(sum(m['status']=='CONFLICT' for m in self.metrics.values() if m['ticker']=='CTG'),8);self.assertEqual(sum(m['status']=='CONFLICT' for m in self.metrics.values() if m['ticker']=='VCB'),10)
  self.assertTrue(all(self.metrics[i]['status']=='CONFLICT' for r in self.rows for i in r['conflicts']))
 def test_context_refs_not_invented(self):
  for r in self.rows:
   for key,status in [('qualifiedReportedFacts','SUPPORTED'),('supportedMetrics','SUPPORTED'),('missingMetrics','MISSING')]:
    for ident in r[key]:self.assertEqual(self.metrics[ident]['status'],status);self.assertEqual(self.metrics[ident]['ticker'],r['ticker'])
 def test_null_scores_and_prior_dispositions(self):
  for r in self.rows:
   self.assertTrue(all(r[k] is None for k in ('points','band','assessment','categoryScore')));b=r['priorRubricBinding'];original=proof.p1.pointer(proof.read(b['path']),b['jsonPointer']);self.assertEqual(proof.p1.digest(original),b['objectHash']);self.assertEqual(original['status'],r['priorDisposition']);self.assertIsNone(original['points']);self.assertIsNone(original['band'])
 def test_selection_fixed_slots_not_metric_volume(self):
  self.assertEqual(self.selection['selected'],'TCB');self.assertEqual(self.selection['proofType'],'BLOCKED_FEASIBILITY_PROOF');self.assertFalse(self.selection['isInvestmentRanking'])
  self.assertEqual({r['ticker']:r['financialDependenciesSupported'] for r in self.selection['comparison']},{'ACB':31,'CTG':37,'MBB':35,'TCB':37,'VCB':37,'SSI':29});self.assertTrue(all(len(r['slots'])==43 for r in self.selection['comparison']))
 def test_selection_order_invariant(self):
  reverse=dict(reversed(list(self.d.items())));self.assertEqual(proof.select(reverse,list(reversed(self.rows)))['selected'],'TCB')
 def test_historical_context_not_forecast(self):
  self.assertTrue(all(m['historicalAvailability']=='UNKNOWN_NO_HISTORICAL_AS_KNOWN_CLAIM' for m in self.metrics.values()));self.assertTrue(all(r['historicalAvailabilityLimitations'] for r in self.rows))
 def test_client_cash_not_corporate_context(self):
  client='SSI:CONSOLIDATED:CUSTOMER_CASH_OFF_BALANCE:2025';self.assertEqual(self.metrics[client]['value'],'8393795223327')
  for m in self.metrics.values():
   if m['ticker']=='SSI' and m['kind']=='DERIVED_METRIC':self.assertNotIn(client,m['dependencyIds'])
 def test_regulatory_capital_not_equity(self):
  car=next(m for m in self.metrics.values() if m['ticker']=='TCB' and m['year']==2025 and m['concept']=='BANK_REPORTED_CAR');equity=next(m for m in self.metrics.values() if m['ticker']=='TCB' and m['year']==2025 and m['concept']=='TOTAL_EQUITY');self.assertEqual(car['scope'],'REGULATORY_CONSOLIDATED');self.assertEqual(equity['scope'],'CONSOLIDATED')
 def test_tcb_claim_values_grounded(self):
  expected={'NET_INCOME':'25954472000000','NET_INCOME_ATTRIBUTABLE_PARENT':'25290230000000','BANK_REPORTED_CAR':'0.1461','BANK_TOTAL_LOAN_CONTRA_REPORTED':'-10498378000000','LOAN_DEPOSIT':'1.240269546762'}
  for concept,value in expected.items():self.assertEqual(next(m['value'] for m in self.d['TCB']['metrics'] if m['concept']==concept and m['year']==2025),value)
 def test_claims_classified_and_supported(self):
  claims=proof.analysis_claims('TCB',self.d['TCB'],self.metrics,self.leads,self.market)
  self.assertEqual(len({c['section'] for c in claims}),12)
  for c in claims:
   self.assertIn(c['classification'],('FACT','ESTIMATE','ASSUMPTION','UNQUALIFIED'))
   for ident in c['metricIds']:self.assertEqual(self.metrics[ident]['status'],'SUPPORTED')
   if c['classification']=='FACT':self.assertTrue(c['metricIds'] or c['policyReferences'] or c['extraEvidence'])
 def test_valuation_method_exists_but_inputs_incomplete(self):
  v=proof.valuation('TCB',self.d['TCB'],self.market);self.assertEqual(v['status'],'BLOCKED');self.assertTrue(all(v[k] is None for k in ('intrinsicValue','marginOfSafety','selectedPrice','selectedShares','approvedEconomicInputs')));states={x['dependency']:x['status'] for x in v['dependencies']};self.assertEqual(states['MARGIN_OF_SAFETY_METHODOLOGY'],'AVAILABLE');self.assertEqual(states['VALUATION_CUTOFF'],'REQUIRES_APPROVAL');self.assertEqual(states['SUSTAINABLE_EARNINGS'],'MISSING')
 def test_existing_prices_not_declared_absent_or_current(self):
  self.assertTrue(all(r['tradingDate']=='2026-10-30' and r['adjustment']=='PROVIDER_UNDECLARED' and not r['qualifiedForValuation'] for r in self.market['latestRetainedDisplayPrices'].values()));self.assertIsNone(self.market['valuationCutoff'])
 def test_database_readonly_and_no_admission(self):
  self.assertTrue(self.market['database']['queryOnly']);self.assertEqual(self.market['database']['counts']['scoring_dataset_binding'],0);self.assertEqual(self.market['database']['counts']['corporate_action_reference'],0);self.assertEqual(self.market['database']['uriMode'],'ro&immutable=1')
 def test_settled_owner_facts_not_reopened(self):
  self.assertTrue(self.market['portfolio']['knownFactsNotReopened']);self.assertEqual(self.market['portfolio']['personalSnapshotDate'],'2026-10-28');d=proof.decision('TCB',self.market);self.assertEqual(d['status'],'DECISION_NOT_AUTHORIZED');self.assertIsNone(d['investmentDecision']);self.assertFalse(d['decisionEngineExecuted']);self.assertFalse(d['scorerExecuted'])
 def test_all_blockers_have_resolution_and_stop(self):
  b=proof.blockers(self.rows,self.leads);ids={x['id'] for x in b['items']}
  for r in self.rows:self.assertTrue(set(r['blockingRegisterIds'])<=ids)
  for x in b['items']:
   self.assertIn(x['classification'],tuple('ABCDEFG'));self.assertTrue(all(x[k] for k in ('affectedIssuers','affectedRubrics','requiredEvidenceOrDecision','responsibleRole','estimatedEffortCategory','blockingScope','canResolveWithoutExternalAcquisition','acceptanceTest','stopCondition')));self.assertEqual(x['closureResult'],'NOT_IMPLEMENTED; owner review only')
 def test_no_formal_engine_invocations_in_proof(self):
  source=Path(proof.__file__).read_text();self.assertNotIn('calculateScorecard(',source);self.assertNotIn('rankScorecards(',source);self.assertNotIn('decide(',source);self.assertNotIn('requests.',source)
 def test_reproducible_machine_content(self):
  d,l,r,leads,inventory=proof.collect();self.assertEqual(self.rows,r);self.assertEqual(self.metrics,l);self.assertEqual(proof.select(d,r),self.selection)

if __name__=='__main__':unittest.main(verbosity=2)
