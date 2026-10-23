"""Isolated synthetic preparation tests. No production authority stores are opened."""
import argparse
import copy
import datetime
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from lib import pec1b_workflow as w
from lib.pec1_authority import digest

class ProspectivePreparationTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='pec1b-synthetic-');self.root=Path(self.temp.name);self.workspace=self.root/'preparations'
        self.payload=b'SYNTHETIC FINANCIAL SOURCE; NO AUTHORITY';self.source=hashlib.sha256(self.payload).hexdigest()
    def tearDown(self):self.temp.cleanup()
    def intent(self,kind='SOURCE_ACQUIRED',submission='synthetic-1',previous=None):
        return {'submissionId':submission,'eventType':kind,'subjectId':'SYNTHETIC-CANDIDATE','subjectVersion':'synthetic-v1','sourceEvidenceHash':self.source,'actorId':'synthetic-reviewer','actorRole':w.ROLES[kind],'authenticationReference':None,'producerIds':['synthetic-producer'],'scopeHash':digest({'candidate':'SYNTHETIC-CANDIDATE','dataset':'synthetic-v1'}),'predecessorEventHashes':previous or [],'evidenceHash':self.source}
    def append(self,kind='SOURCE_ACQUIRED',submission='synthetic-1',previous=None):return w.append_preparation(self.workspace,self.intent(kind,submission,previous),self.payload)
    def dataset(self):
        at='2026-10-23T00:00:00Z';d={'datasetId':'SYNTHETIC-DATASET','datasetVersion':None,'sourceEvidenceReferences':[{'id':'synthetic-source','hash':self.source}],'financialMappingReferences':[{'id':'synthetic-mapping','hash':self.source}],'methodologyVersion':'synthetic-method','registryVersion':'synthetic-registry','sourceAuthorityReferences':[{'id':'synthetic-pending-authority','hash':self.source}],'effectiveKnownAt':at,'systemKnownAt':at,'decisionAsOf':at,'creationEventId':'synthetic-creation-event','approvalEventId':None,'datasetContentHash':None,'immutableAuditReference':None};d['datasetContentHash']=w.dataset_hash(d);d['datasetVersion']='sha256:'+d['datasetContentHash'];return d
    def request(self):
        scope={'candidateId':'SYNTHETIC-CANDIDATE','sourceEvidenceHash':self.source,'financialMappingHashes':[self.source],'methodologyVersion':'synthetic-method','registryVersion':'synthetic-registry','knowledgeChainHash':self.source,'datasetVersion':'synthetic-v1','datasetContentHash':self.source,'cutoffReceiptHash':self.source,'producerIds':['synthetic-producer']}
        return dict(scope,requestId='synthetic-validation',assignedReviewerId='synthetic-independent',result='PENDING',revoked=False,revalidationRequired=False),scope
    def test_01_valid_prospective_ingestion_preparation_only(self):
        before=datetime.datetime.now(datetime.timezone.utc);a=self.append();b=self.append('SOURCE_VERIFIED','synthetic-2',[a['event']['eventHash']]);c=self.append('FORMAL_INGESTION_COMPLETED','synthetic-3',[b['event']['eventHash']]);after=datetime.datetime.now(datetime.timezone.utc)
        self.assertEqual(len(w.read_workspace(self.workspace)),3)
        self.assertTrue(before<=w.instant(c['event']['recordedAt'])<=after)
        self.assertEqual(c['event']['validationStatus'],'PREPARED_NON_AUTHORITATIVE')
        self.assertIsNone(c['event']['knownAt']);self.assertIsNone(c['event']['occurredAt']);self.assertFalse(c['authoritative'])
    def test_02_missing_authentication_blocks_formal_capture(self):
        draft=self.append();self.assertIsNone(draft['event']['authenticationReference'])
        with self.assertRaisesRegex(ValueError,'BLOCKED_AUTHENTICATED'):w.capture_formal_event(draft)
    def test_03_unauthorized_actor_role(self):
        intent=self.intent();intent['actorRole']='Investment System Owner'
        with self.assertRaisesRegex(ValueError,'UNAUTHORIZED_ROLE'):w.append_preparation(self.workspace,intent,self.payload)
    def test_04_producer_self_approval(self):
        intent=self.intent('INDEPENDENT_VALIDATION_ACCEPTED');intent['actorId']='synthetic-producer'
        with self.assertRaisesRegex(ValueError,'SELF_APPROVAL'):w.append_preparation(self.workspace,intent,self.payload)
        r,s=self.request();r['assignedReviewerId']='synthetic-producer'
        with self.assertRaisesRegex(ValueError,'SELF_APPROVAL'):w.assess_independent_request(r,s)
    def test_05_duplicate_event_is_idempotent_and_mutated_retry_fails(self):
        a=self.append();self.assertEqual(self.append(),a);self.assertEqual(len(w.read_workspace(self.workspace)),1)
        intent=self.intent();intent['subjectVersion']='different-version'
        with self.assertRaisesRegex(ValueError,'DUPLICATE_SUBMISSION_MODIFIED'):w.append_preparation(self.workspace,intent,self.payload)
    def test_06_modified_evidence(self):
        a=self.append();p=self.workspace/a['event']['evidenceReference'];p.chmod(0o644);p.write_bytes(b'CHANGED')
        with self.assertRaisesRegex(ValueError,'EVIDENCE_MODIFIED'):w.read_workspace(self.workspace)
    def test_07_backdated_recorded_at(self):
        intent=self.intent();intent['recordedAt']='2000-01-01T00:00:00Z'
        with self.assertRaisesRegex(ValueError,'CALLER_TIMESTAMPS_FORBIDDEN'):w.append_preparation(self.workspace,intent,self.payload)
    def test_08_missing_formal_boundary(self):
        k=w.assess_knowledge({},None,self.source);self.assertEqual(k['knowledgeChainStatus'],'INCOMPLETE');self.assertIn('ingestedAt',k['missing']);self.assertIsNone(k['effectiveKnownAt']);self.assertFalse(k['asKnownEligible'])
    def test_09_invalid_order(self):
        with self.assertRaisesRegex(ValueError,'INVALID_EVENT_ORDER'):self.append('FORMAL_INGESTION_COMPLETED')
        with self.assertRaisesRegex(ValueError,'PREDECESSOR_MISSING'):self.append(previous=['a'*64])
    def test_10_future_knowledge_leakage(self):
        d=self.dataset();d['effectiveKnownAt']='2026-10-24T00:00:00Z';d['datasetContentHash']=w.dataset_hash(d);d['datasetVersion']='sha256:'+d['datasetContentHash']
        r=w.assess_dataset(d,{'effectiveKnownAt':d['effectiveKnownAt']},evaluation_at='2026-10-23T00:00:00Z');self.assertIn('FUTURE_KNOWLEDGE_LEAKAGE',r['structuralFailures']);self.assertFalse(r['asKnownEligible'])
    def test_11_missing_dataset_cutoff(self):
        d=self.dataset();d['systemKnownAt']=None;d['datasetContentHash']=w.dataset_hash(d);d['datasetVersion']='sha256:'+d['datasetContentHash']
        r=w.assess_dataset(d,{},evaluation_at='2026-10-23T00:00:00Z');self.assertIn('MISSING_DATASET_CUTOFF',r['structuralFailures'])
    def test_12_invalid_dataset_version(self):
        d=self.dataset();d['datasetVersion']='latest';r=w.assess_dataset(d,{},evaluation_at='2026-10-23T00:00:00Z');self.assertIn('INVALID_DATASET_VERSION',r['structuralFailures'])
    def test_13_revoked_independent_acceptance(self):
        r,s=self.request();r['result']='ACCEPT';r['revoked']=True;result=w.assess_independent_request(r,s);self.assertFalse(result['accepted']);self.assertIn('INDEPENDENT_ACCEPTANCE_REVOKED',result['blockers'])
    def test_14_changed_source_evidence(self):
        r,s=self.request();r['sourceEvidenceHash']='0'*64
        with self.assertRaisesRegex(ValueError,'SCOPE_CHANGED'):w.assess_independent_request(r,s)
        d=self.dataset();d['sourceEvidenceReferences'][0]['hash']='0'*64;self.assertIn('INVALID_DATASET_VERSION',w.assess_dataset(d,{},evaluation_at='2026-10-23T00:00:00Z')['structuralFailures'])
    def test_15_invalid_pec2_admission(self):
        r=w.pec2_preparation_boundary({}, {}, {}, [], '2026-10-23T00:00:00Z',root=self.root)
        self.assertFalse(r['qualifiedEvidenceExported']);self.assertFalse(r['productionUseAuthorized']);self.assertNotIn(r['PEC2Result']['effectiveAdmissionState'],['ELIGIBLE','ADMITTED','RESTRICTED'])
    def test_16_unauthorized_production_activation(self):
        with self.assertRaisesRegex(ValueError,'UNAUTHORIZED_PRODUCTION'):w.request_production_activation()
    def test_17_modified_event_rejected(self):
        self.append();p=next(self.workspace.glob('*.json'));v=json.loads(p.read_text());v['event']['actorId']='forged';p.chmod(0o644);p.write_text(json.dumps(v))
        with self.assertRaisesRegex(ValueError,'EVENT_MODIFIED'):w.read_workspace(self.workspace)
    def test_18_authentication_reference_is_not_authentication(self):
        intent=self.intent();intent['authenticationReference']='synthetic-unverified-reference';draft=w.append_preparation(self.workspace,intent,self.payload)
        with self.assertRaisesRegex(ValueError,'BLOCKED_AUTHENTICATED'):w.capture_formal_event(draft,authenticated=True)
        k=w.assess_knowledge({'ingestedAt':draft},[],intent['scopeHash']);self.assertFalse(k['asKnownEligible']);self.assertTrue(k['invalid'])
    def test_19_structurally_valid_dataset_still_blocked(self):
        d=self.dataset();k={'effectiveKnownAt':d['effectiveKnownAt'],'knowledgeChainStatus':'COMPLETE'}
        r=w.assess_dataset(d,k,evaluation_at='2026-10-23T00:00:00Z');self.assertEqual(r['structuralFailures'],[]);self.assertFalse(r['productionUseAuthorized']);self.assertEqual(r['status'],'BLOCKED')
    def test_20_independent_assignment_is_only_preparation(self):
        r,s=self.request();out=w.assess_independent_request(r,s);self.assertEqual(out['scopeHash'],digest(s));self.assertFalse(out['accepted'])
    def test_21_method_and_dataset_scope_changes_require_revalidation(self):
        for key in ['datasetVersion','methodologyVersion','registryVersion','knowledgeChainHash','cutoffReceiptHash']:
            r,s=self.request();r[key]='CHANGED'
            with self.subTest(key=key),self.assertRaisesRegex(ValueError,'SCOPE_CHANGED'):w.assess_independent_request(r,s)
    def test_22_clock_fields_cannot_be_filled_to_promote_preparation(self):
        a=self.append();a['event']['knownAt']=a['event']['recordedAt'];a['event']['eventHash']=w.preparation_event_hash(a['event'],a['intentHash'])
        with self.assertRaisesRegex(ValueError,'CANNOT_CREATE_FORMAL_CLOCK'):w.validate_preparation(a,self.workspace)
    def test_23_two_subjects_cannot_share_ingestion_predecessor(self):
        a=self.append();intent=self.intent('SOURCE_VERIFIED','other',[a['event']['eventHash']]);intent['subjectId']='OTHER'
        with self.assertRaisesRegex(ValueError,'INVALID_EVENT_ORDER'):w.append_preparation(self.workspace,intent,self.payload)
    def test_25_scope_and_producer_claims_bound_into_preparation_event_hash(self):
        a=self.append();a['intent']['scopeHash']='0'*64;a['intentHash']=digest(a['intent'])
        with self.assertRaisesRegex(ValueError,'EVENT_MODIFIED'):w.validate_preparation(a,self.workspace)
    def test_24_event_field_contract(self):
        a=self.append();self.assertEqual(set(a['event']),w.EVENT_FIELDS)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--json',type=Path);args=parser.parse_args()
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(ProspectivePreparationTests))
    if args.json:args.json.write_text(json.dumps({'testsRun':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'success':result.wasSuccessful(),'syntheticFixtures':'TemporaryDirectory only; no production stores','testIds':[x for x in dir(ProspectivePreparationTests) if x.startswith('test_')],'failureDetails':[{'test':t.id(),'traceback':trace} for t,trace in result.failures+result.errors]},indent=2)+'\n')
    raise SystemExit(0 if result.wasSuccessful() else 1)
