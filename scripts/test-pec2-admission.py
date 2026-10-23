"""Synthetic temporary fixtures only. No real approval/authority is created."""
import copy
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from lib.pec1_authority import digest, GATES
from lib.pec2_admission import evaluate, admission_id, decision_binding, check_consumption, CLOCKS

class AdmissionTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
        (self.root/'source.html').write_text('SYNTHETIC PUBLICATION FIXTURE')
        (self.root/'source.pdf').write_bytes(b'SYNTHETIC DOCUMENT FIXTURE, NOT A FINANCIAL PDF')
        pins=[{'path':p,'sha256':hashlib.sha256((self.root/p).read_bytes()).hexdigest()} for p in ['source.html','source.pdf']]
        self.s={'ticker':'VNM','period':{'start':'2025-01-01','end':'2025-12-31'},'frame':'ANNUAL','statementType':'INCOME_STATEMENT','consolidation':'CONSOLIDATED','metrics':['REVENUE'],'sourceVersion':'synthetic-source-v1'}
        c={'candidateId':'synthetic-authority','candidateSha256':'a'*64,'authorityKey':'synthetic-key','publisherIdentity':'Synthetic Test Issuer','ticker':'VNM','period':self.s['period'],
           'sourceName':'https://example.invalid/source','evidencePins':{'provenance':pins},'evidenceBundleHash':digest({'provenance':pins}),
           'preparedAt':'2026-10-20T00:00:00Z','evidenceValidThrough':'2026-11-01T00:00:00Z','ownerReceipt':None,'gates':{g:{'state':'PASS'} for g in GATES},'productionAdmissionRequested':False}
        self.core={'contract':'pec2-evidence-core-v1','pec1Candidate':c,'publisherIdentity':'Synthetic Test Issuer',
            'sourceIdentity':{'sourceURL':c['sourceName'],'sourceHash':pins[0]['sha256'],'sourceVersion':self.s['sourceVersion']},
            'documentIdentity':{'path':'source.pdf','sha256':pins[1]['sha256'],'publisherIdentity':c['publisherIdentity'],'ticker':'VNM','period':self.s['period'],'consolidation':'CONSOLIDATED','reportType':'AUDITED_ANNUAL'},
            'datasetScope':self.s,'publication':{'status':'VERIFIED','precision':'DATE_ONLY','date':'2026-10-20','publishedAt':None,'timezone':'Asia/Ho_Chi_Minh','boundary':'2026-10-20T17:00:00Z'},
            'knowledge':{'boundaries':{k:'2026-10-21T00:00:00Z' for k in CLOCKS},'otherRequiredContractBoundaries':[],'systemKnownAt':'2026-10-22T00:00:00Z','decisionAsOf':'2026-10-23T00:00:00Z'},
            'financialMappings':[{'metric':'REVENUE','mappingId':'synthetic-map','mappingHash':'b'*64,'sourceVersion':self.s['sourceVersion'],'documentHash':pins[1]['sha256'],'ticker':'VNM','period':self.s['period'],'consolidation':'CONSOLIDATED','statementType':'INCOME_STATEMENT'}],
            'evidencePins':{'provenance':pins}}
        self.core['knowledge']['boundaries']['publicationBoundary']=self.core['publication']['boundary']
        self.mapping={'canonicalConcept':'REVENUE','period':copy.deepcopy(self.s['period']),'scope':'CONSOLIDATED','sourceCells':[{'documentSha256':pins[1]['sha256']}]}
        (self.root/'mapping.json').write_text(json.dumps(self.mapping))
        self.core['financialMappings'][0].update(mappingHash=digest(self.mapping),evidenceReference={'path':'mapping.json','sha256':hashlib.sha256((self.root/'mapping.json').read_bytes()).hexdigest(),'pointer':''})
        original_body={'issuer':c['publisherIdentity'],'ticker':'VNM','source':{'sourceURL':c['sourceName'],'sourceSha256':pins[0]['sha256'],'documentPath':'source.pdf','documentSha256':pins[1]['sha256']},'sourceContract':{'economicPeriod':copy.deepcopy(self.s['period']),'reportingScope':'CONSOLIDATED','allowedDocumentTypes':['AUDITED_ANNUAL']}}
        original_body['publicationMethod']={'expectedDate':'2026-10-20','precision':'DATE_ONLY','publishedAt':None,'timezone':'Asia/Ho_Chi_Minh'}
        c['candidateSha256']=digest(original_body)
        (self.root/'original.json').write_text(json.dumps({'candidate':{'candidateId':c['candidateId'],'sha256':digest(original_body),'body':original_body}}))
        c['evidencePins']['candidate']={'path':'original.json','sha256':hashlib.sha256((self.root/'original.json').read_bytes()).hexdigest(),'pointer':'/candidate'}
        c['evidenceBundleHash']=digest(c['evidencePins'])
        self.receipts={'ownerApproval':None,'mappingAcceptance':None,'independentAcceptance':None,'admissionEvent':None}
        self.now='2026-10-23T01:00:00Z'
        self.r={'contract':'pec2-source-admission-v1','admissionId':admission_id(self.core),'candidateId':c['candidateId'],'ownerApprovalReference':'synthetic-owner-evidence',
            'evidenceBundleReference':'synthetic-core.json#/core','evidenceHash':digest(self.core),'publisherIdentity':self.core['publisherIdentity'],'sourceIdentity':self.core['sourceIdentity'],'documentIdentity':self.core['documentIdentity'],
            'datasetScope':self.s,'tickerCoverage':['VNM'],'reportingPeriods':[self.s['period']],'statementType':self.s['statementType'],'financialMetricCoverage':self.s['metrics'],'publicationTimestamp':None,
            'knowledgeCutoff':self.core['knowledge']['systemKnownAt'],'admissionRestrictions':[],'admissionStatus':'DEFERRED','validationResult':'PENDING_EVALUATION','admissionTimestamp':None,'revocationStatus':'UNKNOWN','auditReferences':['synthetic-fixture-only']}
        self.trust={}
        self.authenticate()
    def authenticate(self,admit=False):
        """Simulates OUTSIDE authentication in tests; never called by real preparation."""
        (self.root/'clock-evidence.json').write_text(json.dumps(self.core['knowledge']['boundaries']))
        clock_hash=hashlib.sha256((self.root/'clock-evidence.json').read_bytes()).hexdigest()
        self.core['knowledge']['clockEvidence']={field:{'path':'clock-evidence.json','sha256':clock_hash,'pointer':'/'+field} for field in CLOCKS}
        c=self.core['pec1Candidate']; h=digest(self.core)
        (self.root/'synthetic-core.json').write_text(json.dumps({'core':self.core}))
        self.r.update(admissionId=admission_id(self.core),evidenceHash=h)
        owner={'candidateId':c['candidateId'],'evidenceBundleHash':c['evidenceBundleHash'],'admissionEvidenceHash':h,'approvedScope':copy.deepcopy(self.s),'sourceVersion':self.s['sourceVersion'],
          'role':'Investment System Owner','ownerIdentity':'SYNTHETIC OWNER','approvalEvidenceReference':'synthetic-owner-evidence','decision':'APPROVED_WITH_RESTRICTIONS' if self.r['admissionRestrictions'] else 'APPROVED','restrictions':self.r['admissionRestrictions'],
          'decisionAt':'2026-10-21T00:00:00Z','effectiveFrom':'2026-10-21T00:00:00Z','effectiveThrough':'2026-11-01T00:00:00Z'}
        self.receipts['ownerApproval']=owner
        self.trust={'ownerReceipts':{c['candidateId']:digest(owner)},'revocationSnapshot':{'asOf':self.now,'validThrough':'2026-10-24T00:00:00Z','revokedCandidateIds':[],'revokedAdmissionIds':[],'revokedApprovalHashes':[]}}
        for kind,role in [('mappingAcceptance','Data Quality Owner'),('independentAcceptance','Independent Validator')]:
            rec={'candidateId':c['candidateId'],'evidenceHash':h,'scope':copy.deepcopy(self.s),'result':'PASS','reviewerIdentity':'SYNTHETIC '+role,'producerIdentity':'SYNTHETIC PRODUCER','role':role,'acceptedAt':'2026-10-21T01:00:00Z','reference':'synthetic-only'}
            self.receipts[kind]=rec;self.trust[kind]={c['candidateId']:digest(rec)}
        self.receipts['admissionEvent']=None
        if admit:
            event={'admissionId':self.r['admissionId'],'decisionBindingHash':decision_binding(self.r),'actorIdentity':'SYNTHETIC OWNER','role':'Investment System Owner','at':'2026-10-23T00:30:00Z','reference':'synthetic-explicit-admission'}
            self.receipts['admissionEvent']=event;self.trust['admissionEvents']={self.r['admissionId']:digest(event)}
    def run_eval(self,inventory=None,trust=None):
        return evaluate(self.r,self.core,self.receipts,inventory or [self.r],self.now,trust=self.trust if trust is None else trust,root=self.root)
    def assert_blocked(self,needle):
        r=self.run_eval();self.assertNotIn(r['effectiveAdmissionState'],('ELIGIBLE','ADMITTED','RESTRICTED'),r);self.assertTrue(any(needle in x for x in r['blockers']),r)
    def request(self):
        return {k:copy.deepcopy(self.s[k]) for k in ['ticker','period','frame','statementType','consolidation','sourceVersion']} | {'metric':'REVENUE','publicationDate':self.core['publication']['date'],'systemKnownAt':self.core['knowledge']['systemKnownAt'],'action':'FUNDAMENTAL_EVIDENCE_REVIEW'}
    def consume(self,request):
        return check_consumption(self.r,self.core,self.receipts,[self.r],request,self.now,trust=self.trust,root=self.root)
    def test_valid_approved_source_eligible_only(self):
        self.assertEqual(self.run_eval()['effectiveAdmissionState'],'ELIGIBLE');self.assertFalse(self.consume(self.request())['withinOfflineAdmissionScope'])
    def test_explicit_admission_simulation(self):
        self.authenticate(admit=True);r=self.run_eval();self.assertEqual(r['effectiveAdmissionState'],'ADMITTED',r);self.assertTrue(self.consume(self.request())['withinOfflineAdmissionScope']);self.assertFalse(r['productionUseAuthorized'])
    def test_missing_approval(self):
        self.receipts['ownerApproval']=None;self.assert_blocked('PEC1_OWNER')
    def test_default_trust_cannot_approve(self):
        self.assertEqual(self.run_eval(trust={})['effectiveAdmissionState'],'DEFERRED')
    def test_revoked_approval(self):
        self.trust['revocationSnapshot']['revokedApprovalHashes']=[digest(self.receipts['ownerApproval'])];self.assertEqual(self.run_eval()['effectiveAdmissionState'],'REVOKED')
    def test_revoked_admission_after_use(self):
        self.authenticate(admit=True);self.assertTrue(self.consume(self.request())['withinOfflineAdmissionScope']);self.trust['revocationSnapshot']['revokedAdmissionIds']=[self.r['admissionId']];self.assertFalse(self.consume(self.request())['withinOfflineAdmissionScope'])
    def test_expired_approval(self):
        self.receipts['ownerApproval']['effectiveThrough']='2026-10-22T00:00:00Z';self.trust['ownerReceipts']['synthetic-authority']=digest(self.receipts['ownerApproval']);self.assert_blocked('PEC1_OWNER')
    def test_modified_evidence(self):
        self.core['publisherIdentity']='changed';self.assert_blocked('EVIDENCE_HASH_CHANGED')
    def test_modified_source_bytes(self):
        (self.root/'source.pdf').write_text('CHANGED');self.assert_blocked('EVIDENCE_BYTES_CHANGED')
    def test_invalid_publisher(self):
        self.r['publisherIdentity']='other';self.assert_blocked('INVALID_PUBLISHER_IDENTITY')
    def test_unverified_publication(self):
        self.core['publication']['status']='UNVERIFIED';self.authenticate();self.assert_blocked('UNVERIFIED_PUBLICATION')
    def test_conflicting_financial_mapping(self):
        self.core['financialMappings'][0]['metric']='OTHER';self.authenticate();self.assert_blocked('FINANCIAL_MAPPING_MISMATCH')
    def test_future_publication(self):
        self.core['publication'].update(date='2026-10-24',boundary='2026-10-24T17:00:00Z');self.authenticate();self.assert_blocked('FUTURE_PUBLICATION')
    def test_knowledge_cutoff_violation(self):
        self.core['knowledge']['boundaries']['mappingKnownAt']='2026-10-24T00:00:00Z';self.authenticate();self.assert_blocked('KNOWLEDGE_CUTOFF_VIOLATION')
    def test_missing_knowledge(self):
        self.core['knowledge']['boundaries']['ingestedAt']=None;self.authenticate();self.assert_blocked('PUBLICATION_KNOWLEDGE')
    def test_missing_independent_acceptance(self):
        self.receipts['independentAcceptance']=None;self.assert_blocked('INDEPENDENT_ACCEPTANCE')
    def test_failed_independent_acceptance(self):
        r=self.receipts['independentAcceptance'];r['result']='FAIL';self.trust['independentAcceptance']['synthetic-authority']=digest(r);self.assert_blocked('ACCEPTANCE_FAILED')
    def test_restricted_scope(self):
        self.r['admissionRestrictions']=['REVENUE ONLY'];self.authenticate(admit=True);self.assertEqual(self.run_eval()['effectiveAdmissionState'],'RESTRICTED');q=self.request();q['metric']='NET_INCOME';self.assertIn('SCOPE_EXPANSION',self.consume(q)['blockers'])
    def test_scope_dimensions(self):
        self.authenticate(admit=True)
        for key,value in [('ticker','HPG'),('period',{'start':'2024-01-01','end':'2024-12-31'}),('frame','YTD'),('statementType','BALANCE_SHEET'),('consolidation','STANDALONE'),('sourceVersion','v2')]:
            with self.subTest(key=key):
                q=self.request();q[key]=value;self.assertFalse(self.consume(q)['withinOfflineAdmissionScope'])
    def test_unsupported_ticker(self):
        self.s['ticker']='XYZ';self.authenticate();self.assert_blocked('UNSUPPORTED_TICKER')
    def test_mbb_quarantine(self):
        self.s['ticker']='MBB';self.authenticate();self.assert_blocked('MBB_DEFERRED')
    def test_unsupported_reporting_period(self):
        self.s['period']={'start':'2024-01-01','end':'2024-12-31'};self.assert_blocked('RECORD_BINDING')
    def test_duplicate_admission(self):
        self.assertTrue(any('DUPLICATE_ADMISSION' in b for b in self.run_eval(inventory=[self.r,self.r])['blockers']))
    def test_conflicting_authority(self):
        other=copy.deepcopy(self.r);other['admissionId']='other';other['candidateId']='other-source';self.assertTrue(any('CONFLICTING_AUTHORITY' in b for b in self.run_eval(inventory=[self.r,other])['blockers']))
    def test_attempted_unauthorized_activation(self):
        self.authenticate(admit=True)
        for action in ['SCORING','RANKING','TOP10','D2_ACTIVATION','INVESTMENT_DECISION']:
            q=self.request();q['action']=action;self.assertIn('UNAUTHORIZED_ACTIVATION',self.consume(q)['blockers'])
    def test_self_asserted_admitted_state(self):
        self.r['admissionStatus']='ADMITTED';self.assertEqual(self.run_eval()['effectiveAdmissionState'],'ELIGIBLE')
    def test_untrusted_admission_event(self):
        self.authenticate(admit=True);self.trust['admissionEvents']={};self.assert_blocked('EXPLICIT_AUTHENTICATED_ADMISSION_REQUIRED')
    def test_stale_revocation(self):
        self.trust['revocationSnapshot']['validThrough']='2026-10-22T00:00:00Z';self.assert_blocked('REVOCATION_CHECK_STALE')
    def test_malformed_input(self):
        for value in [None,{},[],{'contract':'unexpected'}]:
            r=evaluate(value,{},None,[],self.now,root=self.root);self.assertEqual(r['effectiveAdmissionState'],'REJECTED');self.assertFalse(r['productionUseAuthorized'])
    def test_date_only_never_becomes_timestamp(self):
        self.assertIsNone(self.r['publicationTimestamp']);self.core['publication']['publishedAt']='2026-10-20T01:00:00Z';self.authenticate();self.assert_blocked('DATE_ONLY_PRECISION')
    def test_cannot_drop_mandatory_pec1_gate(self):
        self.core['pec1Candidate']['gates']['G7']['state']='PENDING';self.authenticate();self.assert_blocked('PEC1_NOT_APPROVED')
    def test_reference_substitution(self):
        (self.root/'other.json').write_text('{"core":{}}');self.r['evidenceBundleReference']='other.json#/core';self.assert_blocked('EVIDENCE_BUNDLE_REFERENCE_SUBSTITUTION')
    def test_reference_path_escape(self):
        self.r['evidenceBundleReference']='../outside.json#/core';self.assert_blocked('BUNDLE_REFERENCE_ESCAPE')
    def test_mapping_bytes_changed(self):
        (self.root/'mapping.json').write_text('{"metric":"OTHER"}');self.assert_blocked('EVIDENCE_BYTES_CHANGED')
    def test_mapping_acceptance_missing(self):
        self.receipts['mappingAcceptance']=None;self.assert_blocked('FINANCIAL_MAPPING')
    def test_unknown_other_knowledge_not_empty(self):
        self.core['knowledge']['otherRequiredContractBoundaries']=None;self.authenticate();self.assert_blocked('REQUIRED_OTHER_KNOWLEDGE_UNKNOWN')
    def test_unapproved_scope_change_even_resubmitted_hash(self):
        self.s['metrics']=['NET_INCOME'];self.r.update(evidenceHash=digest(self.core),admissionId=admission_id(self.core));(self.root/'synthetic-core.json').write_text(json.dumps({'core':self.core}));self.assert_blocked('OWNER_EVIDENCE_BINDING')
    def test_claimed_timestamp_cannot_admit(self):
        self.r['admissionTimestamp']=self.now;self.assert_blocked('CALLER_ADMISSION_TIMESTAMP_FORBIDDEN')
    def test_owner_backdating(self):
        a=self.receipts['ownerApproval'];a['effectiveFrom']='2026-10-19T00:00:00Z';self.trust['ownerReceipts']['synthetic-authority']=digest(a);self.assert_blocked('PEC1_OWNER')
    def test_malformed_clock(self):
        self.now='not-a-time';self.assert_blocked('MALFORMED_INPUT')
    def test_falsified_publisher_even_with_resigned_fixture(self):
        self.core['publisherIdentity']='WRONG ISSUER';self.core['pec1Candidate']['publisherIdentity']='WRONG ISSUER';self.core['documentIdentity']['publisherIdentity']='WRONG ISSUER';self.r['publisherIdentity']='WRONG ISSUER';self.authenticate();self.assert_blocked('ORIGINAL_PUBLISHER_SOURCE_DOCUMENT_IDENTITY')
    def test_mapping_semantics_cannot_be_relabelled(self):
        self.core['financialMappings'][0]['period']={'start':'2024-01-01','end':'2024-12-31'};self.authenticate();self.assert_blocked('SOURCE_MAPPING_SEMANTICS_MISMATCH')
    def test_knowledge_evidence_cannot_be_substituted(self):
        (self.root/'clock-evidence.json').write_text('{}');self.assert_blocked('EVIDENCE_BYTES_CHANGED')
    def test_publication_identity_cannot_be_resigned(self):
        self.core['publication'].update(date='2026-10-19',boundary='2026-10-19T17:00:00Z');self.core['knowledge']['boundaries']['publicationBoundary']='2026-10-19T17:00:00Z';self.authenticate();self.assert_blocked('ORIGINAL_PUBLICATION_IDENTITY')
    def test_admission_event_cannot_predate_acceptance(self):
        self.authenticate(admit=True);e=self.receipts['admissionEvent'];e['at']='2026-10-21T00:30:00Z';self.trust['admissionEvents'][self.r['admissionId']]=digest(e);self.assert_blocked('ADMISSION_EVENT_CLOCK')
    def test_owner_approval_cannot_postdate_source_knowledge(self):
        a=self.receipts['ownerApproval'];a['decisionAt']='2026-10-22T01:00:00Z';a['effectiveFrom']=a['decisionAt'];self.trust['ownerReceipts']['synthetic-authority']=digest(a);self.assert_blocked('OWNER_APPROVAL_AFTER_KNOWLEDGE_CUTOFF')
    def test_deterministic(self):
        self.assertEqual(self.run_eval(),self.run_eval())

if __name__=='__main__':unittest.main(verbosity=2)
