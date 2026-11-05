"""Research contract and adversarial regressions, using the generated six dossiers."""
import importlib.util,json,unittest
from copy import deepcopy
from decimal import Decimal
from pathlib import Path
spec=importlib.util.spec_from_file_location('closure',Path(__file__).with_name('build-dfr04-closure.py'));c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
class Closure(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.m=c.load('completion-matrix.json');cls.s=c.load('summary.json');cls.a=c.load('preparation.json')['assessments'];cls.schedules=c.load('sector-reconciliation.json');cls.e=c.load('evidence-map.json')
 def test_exact_138(self):
  self.assertEqual(len(self.m),138);self.assertEqual(len({r['id'] for r in self.m}),138)
  for t in c.PILOT:self.assertEqual(sum(r['ticker']==t for r in self.m),23)
 def test_72_batch_scope(self):
  rows=[r for r in self.m if r['mappingProcessed']];self.assertEqual(len(rows),72);self.assertEqual(sum(r['priorEligibility']=='EXISTS_MAPPING_INCOMPLETE' for r in rows),66);self.assertEqual(sum(r['priorEligibility']=='EXISTS_ANALYST_JUDGMENT' for r in rows),6)
 def test_every_fully_bound_pending_rubric_completed(self):
  for r in self.m:
   if not r['mappingProcessed']:continue
   topics={topic for e in self.e if e['ticker']==r['ticker'] for topic in e['rubricTopics'].get(r['rubric'],[])}
   if r['rubric']=='FH-BS':topics.add('capital')
   if set(r['requiredTopics'])<=topics:self.assertEqual(r['status'],'COMPLETED_RESEARCH',r['id'])
 def test_exact_reconciliation_schedules(self):
  for s in self.schedules:
   self.assertTrue(s['debtMaturitiesCovenantsFunds']['maturityEntries'])
   for eq in s['exactReconciliations']:self.assertEqual(eq['residualVnd'],'0');self.assertEqual(eq['computedVnd'],eq['closingVnd'])
  bid=next(s for s in self.schedules if s['ticker']=='BID');self.assertEqual(bid['assetQualityRegulatoryCapital']['groups3to5Vnd'],'34976819000000')
 def test_conflicted_metric_rejected(self):
  a=deepcopy(next(a for a in self.a if a['id']=='TCX:FH-BS'));a['evidence'][0]['refs']=['METRIC:TCX:STANDALONE:PRINTED_COMMON_EPS_NUMERATOR:2025'];self.assertRaises(ValueError,c.validate,a)
 def test_all_ready_assessed(self):
  for r in self.m:
   if r['eligibility']=='READY_FOR_ASSESSMENT':self.assertEqual(r['status'],'COMPLETED_RESEARCH')
  self.assertEqual(self.s['newCompleted'],11);self.assertEqual(self.s['completed'],25);self.assertEqual(self.s['remainingNotRated'],113);self.assertEqual(self.s['netBlockerReduction'],11);self.assertEqual(sum(r['newCompleted'] for r in self.m),11);self.assertEqual(sum(r['baselineCompleted'] for r in self.m),14)
 def test_prior_14_unchanged(self):
  old={r['id']:r for r in c.read(c.OLD+'/completion-matrix.json')}
  for r in self.m:
   if old[r['id']]['status']=='COMPLETED_RESEARCH':
    self.assertEqual(r['assessment'],old[r['id']]['assessment']);self.assertEqual(r['points'],old[r['id']]['points'])
 def test_issuer_specific_invalidation(self):
  self.assertEqual(len({tuple(a['invalidationConditions']) for a in self.a}),11)
  for a in self.a:self.assertEqual(a['invalidationConditions'],c.INVALIDATION[a['id']]);self.assertTrue(a['confidenceReason'])
 def test_every_new_full_band_topics(self):
  for a in self.a:self.assertTrue(c.validate(a))
 def test_invalid_band_rejected(self):
  a=deepcopy(self.a[0]);a['assessment']='invented adequate';self.assertRaises(ValueError,c.validate,a)
 def test_invalid_points_rejected(self):
  a=deepcopy(self.a[0]);a['selectedPoints']=99;self.assertRaises(ValueError,c.validate,a)
 def test_missing_topic_rejected(self):
  a=deepcopy(self.a[0]);a['evidence'].pop();self.assertRaises(ValueError,c.validate,a)
 def test_wrong_topic_rejected(self):
  a=deepcopy(self.a[0]);a['evidence'][0]['refs']=['C:FPT:40'];self.assertRaises(ValueError,c.validate,a)
 def test_wrong_issuer_rejected(self):
  a=deepcopy(self.a[0]);a['evidence'][0]['refs']=['C:BID:CAR6'];self.assertRaises(ValueError,c.validate,a)
 def test_candidate_unknown_unit_and_conflict_rejected(self):
  # Resolver only admits explicit reviewed notes or source-bound supported metrics, never arbitrary provider cells.
  a=deepcopy(self.a[0]);a['evidence'][0]['refs']=['CANDIDATE:CAFef:UNKNOWN_UNIT'];self.assertRaises(ValueError,c.validate,a)
  a['evidence'][0]['refs']=['METRIC:TCX:STANDALONE:DOES_NOT_EXIST:2025'];self.assertRaises(StopIteration,c.validate,a)
 def test_no_missing_zero_or_NA(self):
  for r in self.m:
   if r['status']=='NOT_RATED':self.assertIsNone(r['points']);self.assertIsNone(r['band']);self.assertTrue(r['exactMissingFields']);self.assertTrue(r['resolutionPath'])
   self.assertNotEqual(r['eligibility'],'NOT_APPLICABLE')
 def test_no_synthetic_total(self):
  for t in c.PILOT:
   d=c.load(f'issuers/{t}.json');self.assertEqual(d['classification'],'RESEARCH_PROVISIONAL')
   for k in ['totalScore','ranking','currentSignal','valuationPerShare']:self.assertIsNone(d[k])
   self.assertFalse(d['productionAdmissible']);self.assertFalse(d['scoringAuthorized'])
 def test_decimal_native_observations(self):
  for e in self.e:
   for o in e['observations']:self.assertIsInstance(o['value'],str);self.assertTrue(Decimal(o['value']).is_finite());self.assertTrue(o['originalValue']);self.assertFalse(o['formalFactAdmission'])
 def test_source_pointer_and_pdf_hash(self):
  for e in self.e:
   self.assertEqual(c.sha(e['path']),e['sha256']);self.assertEqual(c.h(c.pointer(c.read(e['path']),e['jsonPointer'])),e['boundObjectHash']);self.assertEqual(c.sha(e['pdfPath']),e['pdfHash']);self.assertIsNone(e['publicationAt'])
  md=(c.OUT/'DFR_04_SECTOR_RECONCILIATION.md').read_text()
  for e in self.e:self.assertIn(str(c.ROOT/e['pdfPath'])+'#page='+str(e['page']),md)
 def test_financial_parity(self):
  for t,h in c.load('inspection.json')['financialParity'].items():self.assertEqual(c.h(c.read(c.D2+f'/issuers/{t}.json')['metrics']),h)
 def test_separate_preparation_challenge(self):
  p=c.load('preparation.json');ch=c.load('challenge.json');self.assertLess(p['preparedAt'],ch['challengedAt']);self.assertEqual(ch['preparationHash'],c.sha(c.REL+'/preparation.json'));self.assertFalse(ch['independentHumanReviewClaimed'])
  for a in self.a:self.assertEqual(next(x for x in ch['results'] if x['id']==a['id'])['assessmentHash'],c.h(a))
 def test_local_conflict_propagation(self):
  ref='C:VHM:70';states=c.propagate(self.a,{ref})
  self.assertEqual({k for k,v in states.items() if v['status']=='MATERIAL_CONFLICT'},{'VHM:FH-BS','VHM:RG-RISK'})
  self.assertTrue(all(v['points'] is None for v in states.values() if v['status']=='MATERIAL_CONFLICT'))
 def test_legacy_aggregate_isolated(self):
  ss={s['ticker']:s for s in self.schedules}
  for t,total,gap in [('VIC','338501032000000','3984711000000'),('VHM','146322754000000','2671708000000')]:
   b=ss[t]['debtMaturitiesCovenantsFunds'];self.assertEqual(b['identifiedDebtVnd'],total);self.assertEqual(b['legacyMinusIdentifiedVnd'],gap)
   for a in self.a:
    if a['ticker']==t:self.assertFalse(any('REPORTED_BORROWINGS' in ref for e in a['evidence'] for ref in e['refs']))
 def test_TCX_one_vnd_retained(self):
  s=next(x for x in self.schedules if x['ticker']=='TCX');v=s['commonNumeratorConflict'];self.assertEqual(v['differenceVnd'],'1');self.assertEqual(v['arithmeticVnd'],v['note38Vnd']);self.assertIn('RETAINED',v['status'])
 def test_TCX_bond_small_tranche(self):
  s=next(x for x in self.schedules if x['ticker']=='TCX');b=s['bondReconciliation'];self.assertEqual(Decimal(b['shortPrincipalVnd'])+Decimal(b['premiumVnd']),Decimal(b['shortCarryingVnd']));self.assertTrue(b['unknownLongTrancheDates'])
  self.assertEqual(next(o['value'] for o in s['observations'] if o['key']=='BONDS_20260616'),'692000000')
 def test_no_unrestricted_or_covenant_invention(self):
  for s in self.schedules:
   b=s['debtMaturitiesCovenantsFunds'];self.assertIsNone(b['unrestrictedFunds']);self.assertIsNone(b['covenantHeadroom']);self.assertFalse(b['completeContractualLadder'])
 def test_actions_returns_not_invented(self):
  for s in self.schedules:
   self.assertIsNone(s['corporateActionAdjustedGrowth']['adjustedGrowth']);self.assertFalse(s['corporateActionAdjustedGrowth']['fullFY2022FY2025Comparability']);self.assertIsNone(s['commonOwnerSustainableReturns']['sustainableReturn']);self.assertIsNone(s['investmentOutcomes']['completeCohortReturns'])
 def test_no_public_source_expansion(self):
  s=c.load('research-source-scope.json');self.assertEqual(len(s['missingRubrics']),22);self.assertFalse(s['approved']);self.assertFalse(s['acquisitionPerformed']);self.assertFalse(s['sourceAuthorityExpanded']);self.assertEqual(s['ceiling']['maxNewDocuments'],20)
 def test_valuation_30_deferred_no_defaults(self):
  v=c.load('valuation-decision-sheet.json');self.assertEqual(len(v['remainingRubrics']),30)
  for k in ['cutoff','marketSourcePolicy','shareActionPolicy','economicAssumptions','approvalReceipt']:self.assertIsNone(v[k])
  self.assertTrue(all(r['status']=='NOT_RATED' for r in self.m if r['id'] in v['remainingRubrics']))
 def test_bank_not_industrial_cash(self):
  a=next(a for a in self.a if a['id']=='BID:BQ-CASH');self.assertIn('banking intermediation',a['rationale']);self.assertIn('not distributable owner cash',a['counterevidence'][0]['rationale'])
 def test_all_six_sectors(self):
  self.assertEqual({s['ticker'] for s in self.schedules},set(c.PILOT));self.assertEqual(next(s for s in self.schedules if s['ticker']=='TCX')['scope'],'STANDALONE');self.assertTrue(next(s for s in self.schedules if s['ticker']=='BID')['assetQualityRegulatoryCapital']['reportedRegulatoryCapitalOnly'])
if __name__=='__main__':unittest.main(verbosity=2)
