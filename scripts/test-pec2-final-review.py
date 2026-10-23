"""Independent review regressions using existing synthetic fixture factory.
PEC2_REVIEW_ENGINE=v1 reproduces defects at cceffa3; default v2 tests fixes.
No real approval, source or admission is created.
"""
import copy
import importlib.util
import json
import os
import unittest
from pathlib import Path
from lib.pec1_authority import digest

ROOT=Path(__file__).resolve().parents[1]
engine_name=os.environ.get('PEC2_REVIEW_ENGINE','v2')
if engine_name=='v1':
    from lib import pec2_admission as engine
else:
    from lib import pec2_admission_v2 as engine
spec=importlib.util.spec_from_file_location('pec2_original_fixtures',ROOT/'scripts/test-pec2-admission.py')
fixtures=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixtures)
fixtures.evaluate=engine.evaluate;fixtures.check_consumption=engine.check_consumption

class FinalReviewTests(fixtures.AdmissionTests):
    def authenticate(self,admit=False):
        super().authenticate(admit=admit)
        self.trust['admissionHistory']={'asOf':self.now,'validThrough':'2026-10-24T00:00:00Z','records':{
            self.r['admissionId']:{'state':'DEFERRED','evidenceHash':self.r['evidenceHash'],'recordedAt':'2026-10-20T00:00:00Z'}}}
    def test_mandatory_source_bytes_cannot_be_omitted_from_optional_pin_tree(self):
        self.core['evidencePins']={'candidate':self.core['pec1Candidate']['evidencePins']['candidate']}
        self.authenticate(admit=True)
        (self.root/'source.html').write_text('CHANGED ARCHIVED PUBLICATION')
        self.assert_blocked('EVIDENCE_BYTES_CHANGED')
    def test_other_required_clock_requires_immutable_proof(self):
        self.core['knowledge']['otherRequiredContractBoundaries']=[{'id':'extra-source-method','at':'2026-10-21T00:00:00Z','evidenceReference':'missing-event.json#/at'}]
        self.authenticate(admit=True);self.assert_blocked('KNOWLEDGE_EVENT')
    def test_inventory_member_cannot_alias_another_candidate(self):
        self.authenticate(admit=True);alias=copy.deepcopy(self.r);alias['candidateId']='ANOTHER_CANDIDATE';alias['datasetScope']['ticker']='HPG'
        r=self.run_eval(inventory=[alias]);self.assertNotIn(r['effectiveAdmissionState'],('ELIGIBLE','ADMITTED','RESTRICTED'),r)
    def test_whole_report_authority_conflicts_with_component_statement(self):
        self.authenticate(admit=True);other=copy.deepcopy(self.r);other['admissionId']='different-authority';other['candidateId']='different-source';other['datasetScope']['statementType']='FINANCIAL_STATEMENTS'
        r=self.run_eval(inventory=[self.r,other]);self.assertTrue(any('CONFLICTING_AUTHORITY' in b for b in r['blockers']),r)
    def test_revoked_history_cannot_reactivate_from_later_snapshot_omission(self):
        self.authenticate(admit=True);self.trust['admissionHistory']['records'][self.r['admissionId']]['state']='REVOKED'
        r=self.run_eval();self.assertEqual(r['effectiveAdmissionState'],'REVOKED',r)
    def test_rejected_history_requires_new_review_version(self):
        self.authenticate(admit=True);self.trust['admissionHistory']['records'][self.r['admissionId']]['state']='REJECTED'
        self.assert_blocked('TERMINAL_HISTORY')
    def test_active_admission_requires_authenticated_history(self):
        self.authenticate(admit=True);del self.trust['admissionHistory'];self.assert_blocked('ADMISSION_HISTORY_REQUIRED')
    def test_instant_period_cannot_span_a_year(self):
        self.s['frame']='INSTANT';self.authenticate(admit=True);self.assert_blocked('INSTANT_PERIOD')
    def test_negative_array_index_is_not_json_pointer(self):
        self.authenticate(admit=True);(self.root/'alias.json').write_text(json.dumps({'cores':[{},self.core]}));self.r['evidenceBundleReference']='alias.json#/cores/-1'
        self.assert_blocked('JSON_POINTER_ARRAY_INDEX')
    def test_positive_proven_other_boundary(self):
        (self.root/'extra.json').write_text(json.dumps({'at':'2026-10-21T00:00:00Z'}))
        import hashlib
        proof={'path':'extra.json','sha256':hashlib.sha256((self.root/'extra.json').read_bytes()).hexdigest(),'pointer':'/at'}
        self.core['knowledge']['otherRequiredContractBoundaries']=[{'id':'extra-source-method','at':'2026-10-21T00:00:00Z','evidenceReference':'extra.json#/at','evidencePin':proof}]
        self.authenticate(admit=True)
        self.assertEqual(self.run_eval()['effectiveAdmissionState'],'ADMITTED',self.run_eval())
    def test_revoked_snapshot_still_dominates_eligible_history(self):
        self.authenticate(admit=True);self.trust['revocationSnapshot']['revokedCandidateIds']=[self.r['candidateId']]
        self.assertEqual(self.run_eval()['effectiveAdmissionState'],'REVOKED')
    def test_restricted_history_cannot_expand_to_unrestricted(self):
        self.authenticate(admit=True);self.trust['admissionHistory']['records'][self.r['admissionId']]['state']='RESTRICTED'
        self.assert_blocked('RESTRICTED_HISTORY_CANNOT_EXPAND')
    def test_revoked_result_cannot_report_validation_pass(self):
        self.authenticate(admit=True);self.r['revocationStatus']='REVOKED'
        r=self.run_eval();self.assertEqual(r['effectiveAdmissionState'],'REVOKED');self.assertEqual(r['validationResult'],'FAIL')
    def test_state_transition_matrix(self):
        for prior in engine.STATES:
            for admitted in (False,True):
                for restricted in (False,True):
                    with self.subTest(prior=prior,event=admitted,restricted=restricted):
                        self.r['admissionRestrictions']=['SYNTHETIC RESTRICTION'] if restricted else []
                        self.authenticate(admit=admitted)
                        self.trust['admissionHistory']['records'][self.r['admissionId']]['state']=prior
                        if prior in ('REVOKED','REJECTED'):expected=prior
                        elif prior=='RESTRICTED' and (not restricted or not admitted):expected='DEFERRED'
                        elif prior=='ADMITTED' and not admitted:expected='DEFERRED'
                        else:expected=('RESTRICTED' if restricted else 'ADMITTED') if admitted else 'ELIGIBLE'
                        r=self.run_eval();self.assertEqual(r['effectiveAdmissionState'],expected,r);self.assertFalse(r['productionUseAuthorized'])
    def test_stale_history_blocks(self):
        self.authenticate(admit=True);self.trust['admissionHistory']['validThrough']='2026-10-22T00:00:00Z';self.assert_blocked('ADMISSION_HISTORY_STALE')

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--json',type=Path)
    args=parser.parse_args()
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(FinalReviewTests))
    if args.json:
        args.json.write_text(json.dumps({'engine':engine_name,'testsRun':result.testsRun,'failureAssertions':len(result.failures),'errors':len(result.errors),'success':result.wasSuccessful(),'failures':[{'test':t.id(),'traceback':trace} for t,trace in result.failures],'errorDetails':[{'test':t.id(),'traceback':trace} for t,trace in result.errors]},indent=2)+'\n')
    raise SystemExit(0 if result.wasSuccessful() else 1)
