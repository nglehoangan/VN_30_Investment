import copy
import unittest
from lib.pec1_authority import digest, evaluate, GATES

class OwnerDecisionTests(unittest.TestCase):
    def setUp(self):
        self.c = {'candidateId':'test', 'authorityKey':'issuer:period:scope',
                  'gates':{g:{'state':'PASS'} for g in GATES}, 'evidencePins':{'test':'abc'},
                  'preparedAt':'2026-10-22T00:00:00Z', 'evidenceValidThrough':'2026-11-01T00:00:00Z'}
        self.c['evidenceBundleHash'] = digest(self.c['evidencePins'])
        self.c['ownerReceipt'] = {'candidateId':'test','evidenceBundleHash':self.c['evidenceBundleHash'],
            'role':'Investment System Owner','ownerIdentity':'synthetic test owner',
            'approvalEvidenceReference':'synthetic fixture only','decision':'APPROVED_WITH_RESTRICTIONS',
            'restrictions':['archived exact bytes only'],'decisionAt':'2026-10-22T01:00:00Z',
            'effectiveFrom':'2026-10-22T01:00:00Z','effectiveThrough':'2026-11-01T00:00:00Z'}
        self.trust = {'test':digest(self.c['ownerReceipt'])}
    def run_case(self, c=None, inventory=None, trust=True):
        c = c or self.c
        return evaluate(c, inventory or [c], '2026-10-22T02:00:00Z', self.trust if trust else {})
    def blocked(self):
        self.assertEqual(self.run_case()['effectiveState'],'PENDING_REQUIRED_EVIDENCE')
    def test_missing_owner(self):
        self.assertIn('G8:AUTHENTICATED_OWNER_APPROVAL_MISSING',self.run_case(trust=False)['blockers'])
    def test_incomplete_provenance(self):
        self.c['gates']['G4']['state']='PENDING'; self.blocked()
    def test_missing_publication(self):
        self.c['gates']['G2']['state']='FAIL'; self.blocked()
    def test_failed_independent(self):
        self.c['gates']['G7']['state']='FAIL'; self.blocked()
    def test_restricted_approval(self):
        r=self.run_case(); self.assertEqual(r['effectiveState'],'APPROVED_WITH_RESTRICTIONS'); self.assertFalse(r['productionAccess'])
    def test_changed_hash(self):
        self.c['evidencePins']['test']='changed'; self.blocked()
    def test_expired(self):
        self.c['evidenceValidThrough']='2026-10-21T00:00:00Z'; self.blocked()
    def test_duplicate(self):
        self.assertIn('DUPLICATE_CANDIDATE',self.run_case(inventory=[self.c,self.c])['blockers'])
    def test_conflict(self):
        other=copy.deepcopy(self.c); other['candidateId']='conflict'
        self.assertIn('CONFLICTING_SOURCE_AUTHORITY',self.run_case(inventory=[self.c,other])['blockers'])
    def test_auto_admission(self):
        self.c['productionAdmissionRequested']=True; self.blocked()
    def test_na_cannot_bypass(self):
        self.c['gates']['G5']={'state':'NOT_APPLICABLE','justification':'test'}; self.blocked()
    def test_impersonation(self):
        self.c['ownerReceipt']['ownerIdentity']='Codex'; self.blocked()
    def test_backdating(self):
        self.c['ownerReceipt']['effectiveFrom']='2026-10-21T00:00:00Z'
        self.trust={'test':digest(self.c['ownerReceipt'])}; self.blocked()

if __name__ == '__main__': unittest.main()
