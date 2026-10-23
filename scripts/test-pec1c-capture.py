"""Synthetic provider/executor fixtures ONLY. No production credentials or authority DB."""
import argparse
import concurrent.futures
import copy
import datetime
import json
import sqlite3
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch
from lib import pec1c_capture as c
from lib.pec1b_workflow import request_production_activation,pec2_preparation_boundary

SQL=Path(__file__).resolve().parent/'contracts/pec1c-audit.sql'

class FixtureClock:
 def __init__(self):self.at=datetime.datetime(2026,10,23,0,0,tzinfo=datetime.timezone.utc);self.lock=threading.Lock()
 def sample(self):
  with self.lock:self.at+=datetime.timedelta(microseconds=1);return c.stamp(self.at)

class FixtureIdentity:
 """Intentionally test-only registry. No production identity claims are implied."""
 def __init__(self):self.revoked_session=False;self.revoked_role=False;self.revoked_subject=False;self.allow=True;self.wrong_scope=False;self.issued={};self.subject='SYNTHETIC-REVIEWER';self.expired=False
 def resolve(self,credential):
  if credential!='SYNTHETIC-CREDENTIAL':raise ValueError('MISSING_AUTHENTICATION')
  return c.VerifiedSession(self.subject,'SYNTHETIC-SESSION','SYNTHETIC-ISSUER','SYNTHETIC-AUDIENCE','2026-10-22T00:00:00.000000Z','2026-10-22T12:00:00.000000Z' if self.expired else '2026-10-24T00:00:00.000000Z','SYNTHETIC-AUTH-AUDIT')
 def authorize(self,session,request,at):
  if self.revoked_session:raise ValueError('SESSION_REVOKED')
  if self.revoked_role:raise ValueError('ROLE_REVOKED')
  if self.revoked_subject:raise ValueError('SUBJECT_REVOKED')
  if not self.allow:raise ValueError('UNAUTHORIZED_OPERATION')
  if self.wrong_scope:raise ValueError('UNAUTHORIZED_DATASET_SCOPE')
  result={'subject':session.subject,'sessionReference':session.session_reference,'issuer':session.issuer,'audience':session.audience,'permission':c.PERMISSIONS[request['eventType']],'requestBinding':c.digest(request),'grantedAt':at,'validThrough':session.expires_at,'authenticationReference':'SYNTHETIC-AUTH:'+c.digest(request)+':'+at,'auditReference':'SYNTHETIC-AUDIT:'+at}
  self.issued[result['authenticationReference']]=copy.deepcopy(result);return result
 def authorize_saved(self,authorization,request,at):
  if self.revoked_session or self.revoked_role or self.revoked_subject:raise ValueError('SAVED_AUTHORIZATION_REVOKED')
  if self.issued.get(authorization['authenticationReference'])!=authorization or authorization['requestBinding']!=c.digest(request):raise ValueError('AUTHENTICATION_PROVENANCE_TAMPERED')

class FixtureExecutor:
 def __init__(self,payload):self.payload=payload;self.fail=False;self.producer='SYNTHETIC-PRODUCER';self.calls=0
 def execute(self,db,r):
  self.calls+=1;db.execute('INSERT INTO synthetic_business_operation VALUES (?)',(r['eventId'],))
  if self.fail:raise ValueError('SYNTHETIC_PARTIAL_FAILURE')
  return {'requestBinding':c.digest(r),'evidenceBytes':self.payload,'producerIds':[self.producer],'executionReference':'SYNTHETIC-EXECUTION:'+r['eventId']}

class CaptureTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory(prefix='pec1c-synthetic-');self.db=Path(self.tmp.name)/'synthetic.sqlite';con=sqlite3.connect(self.db);con.executescript(SQL.read_text());con.execute('CREATE TABLE synthetic_business_operation (id TEXT PRIMARY KEY)');con.close()
  self.payload=b'SYNTHETIC EVIDENCE ONLY';self.provider=FixtureIdentity();self.executor=FixtureExecutor(self.payload);self.clock=FixtureClock();self.capture=c.TrustedCapture(self.db,identity=self.provider,executor=self.executor,clock=self.clock)
 def tearDown(self):self.tmp.cleanup()
 def request(self,event_id='SYNTHETIC-EVENT',kind='SOURCE_ACQUIRED',previous=None):return {'eventId':event_id,'eventType':kind,'subjectId':'SYNTHETIC-SUBJECT','subjectVersion':'SYNTHETIC-V1','sourceEvidenceHash':c.bytes_hash(self.payload),'scopeHash':c.digest({'dataset':'SYNTHETIC-DATASET','ticker':'SYNTHETIC','period':'SYNTHETIC'}),'expectedPreviousEventHash':previous,'operationReference':'SYNTHETIC-OPERATION:'+event_id}
 def run_capture(self,r=None):return self.capture.capture('SYNTHETIC-CREDENTIAL',r or self.request())
 def count(self,table):
  with sqlite3.connect(self.db) as db:return db.execute('SELECT count(*) FROM '+table).fetchone()[0]
 def test_01_valid_authenticated_actor_fixture_only(self):
  row=self.run_capture();self.assertEqual(row['event']['actorId'],'SYNTHETIC-REVIEWER');self.assertEqual(row['event']['validationStatus'],'AUTHENTICATED_VALIDATED');self.assertFalse(row['productionUseAuthorized']);self.assertEqual(self.capture.replay()[0]['rowHash'],row['rowHash'])
 def test_02_missing_authentication(self):
  with self.assertRaisesRegex(ValueError,'MISSING_AUTHENTICATION'):self.capture.capture('',self.request())
  with self.assertRaisesRegex(ValueError,'NOT_CONFIGURED'):c.production_capture(self.db).capture('SYNTHETIC-CREDENTIAL',self.request())
  self.assertEqual(self.count('formal_knowledge_audit'),0)
 def test_03_expired_session(self):
  self.provider.expired=True
  with self.assertRaisesRegex(ValueError,'SESSION_EXPIRED'):self.run_capture()
 def test_04_revoked_session(self):
  self.provider.revoked_session=True
  with self.assertRaisesRegex(ValueError,'SESSION_REVOKED'):self.run_capture()
 def test_05_revoked_role(self):
  self.provider.revoked_role=True
  with self.assertRaisesRegex(ValueError,'ROLE_REVOKED'):self.run_capture()
 def test_06_unauthorized_operation(self):
  self.provider.allow=False
  with self.assertRaisesRegex(ValueError,'UNAUTHORIZED_OPERATION'):self.run_capture()
 def test_07_unauthorized_scope(self):
  self.provider.wrong_scope=True
  with self.assertRaisesRegex(ValueError,'UNAUTHORIZED_DATASET_SCOPE'):self.run_capture()
 def test_08_producer_self_approval(self):
  a=self.run_capture();self.executor.producer=self.provider.subject
  with self.assertRaisesRegex(ValueError,'SELF_APPROVAL'):self.run_capture(self.request('SYNTHETIC-VERIFY','SOURCE_VERIFIED',a['event']['eventHash']))
  self.assertEqual(self.count('formal_knowledge_audit'),1);self.assertEqual(self.count('synthetic_business_operation'),1)
 def test_09_caller_timestamp(self):
  for field in ['recordedAt','occurredAt','knownAt','effectiveAt','actorId','role']:
   r=self.request();r[field]='2000-01-01T00:00:00Z'
   with self.subTest(field=field),self.assertRaisesRegex(ValueError,'CALLER_IDENTITY_AND_TIMESTAMPS_FORBIDDEN'):self.run_capture(r)
 def test_10_duplicate_is_safe(self):
  r=self.request();a=self.run_capture(r);b=self.run_capture(r);self.assertEqual(a,b);self.assertEqual(self.executor.calls,1)
  r['operationReference']='CHANGED'
  with self.assertRaisesRegex(ValueError,'DUPLICATE_EVENT_MODIFIED'):self.run_capture(r)
 def test_11_concurrent_identical_submission(self):
  def submit(_):
   instance=c.TrustedCapture(self.db,identity=self.provider,executor=self.executor,clock=self.clock);return instance.capture('SYNTHETIC-CREDENTIAL',self.request())
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:rows=list(pool.map(submit,[1,2]))
  self.assertEqual(rows[0]['event']['eventHash'],rows[1]['event']['eventHash']);self.assertEqual(self.count('formal_knowledge_audit'),1);self.assertEqual(self.executor.calls,1)
 def test_12_modified_evidence_rolls_back(self):
  self.executor.payload=b'CHANGED'
  with self.assertRaisesRegex(ValueError,'MODIFIED_EVIDENCE'):self.run_capture()
  self.assertEqual(self.count('formal_knowledge_audit'),0);self.assertEqual(self.count('synthetic_business_operation'),0)
 def test_13_invalid_chain(self):
  r=self.request();r['expectedPreviousEventHash']='a'*64
  with self.assertRaisesRegex(ValueError,'INVALID_EVENT_CHAIN'):self.run_capture(r)
 def test_14_partial_transaction_failure(self):
  self.executor.fail=True
  with self.assertRaisesRegex(ValueError,'PARTIAL_FAILURE'):self.run_capture()
  self.assertEqual(self.count('synthetic_business_operation'),0);self.assertEqual(self.count('formal_knowledge_audit'),0)
 def test_15_clock_rollback(self):
  self.run_capture();self.clock.at-=datetime.timedelta(days=1)
  with self.assertRaisesRegex(ValueError,'CLOCK_ROLLBACK'):self.run_capture(self.request('SYNTHETIC-SECOND'))
  self.assertEqual(self.count('synthetic_business_operation'),1)
 def test_16_unauthorized_owner_approval(self):
  self.provider.allow=False
  with self.assertRaisesRegex(ValueError,'UNAUTHORIZED_OPERATION'):self.run_capture(self.request(kind='SOURCE_CONTRACT_APPROVED'))
  self.assertEqual(self.count('formal_knowledge_audit'),0)
 def test_17_unauthorized_pec2_admission(self):
  self.run_capture();out=pec2_preparation_boundary({}, {}, {}, [], '2026-10-23T00:00:00Z',root=Path(self.tmp.name));self.assertFalse(out['qualifiedEvidenceExported']);self.assertFalse(out['productionUseAuthorized'])
 def test_18_unauthorized_scoring(self):
  with self.assertRaisesRegex(ValueError,'UNAUTHORIZED_PRODUCTION_ACTIVATION'):request_production_activation()
 def test_19_database_immutability_and_replace(self):
  self.run_capture()
  with sqlite3.connect(self.db) as db:
   for sql in ['UPDATE formal_knowledge_audit SET recorded_at=recorded_at','DELETE FROM formal_knowledge_audit','INSERT OR REPLACE INTO formal_knowledge_audit SELECT * FROM formal_knowledge_audit']:
    with self.subTest(sql=sql),self.assertRaises(sqlite3.IntegrityError):db.execute(sql)
 def test_20_missing_trigger_denies_open(self):
  with sqlite3.connect(self.db) as db:db.execute('DROP TRIGGER formal_knowledge_audit_no_update')
  with self.assertRaisesRegex(ValueError,'IMMUTABILITY_SCHEMA'):self.run_capture()
 def test_21_revoked_prior_acceptance_denies_replay_and_extend(self):
  self.run_capture();self.provider.revoked_role=True
  with self.assertRaisesRegex(ValueError,'REVOKED'):self.capture.replay()
 def test_22_preparation_id_cannot_be_relabelled(self):
  r=self.request();r['eventId']='pec1b-preparation-sha256:'+'a'*64
  with self.assertRaisesRegex(ValueError,'PREPARATION_CANNOT'):self.run_capture(r)
 def test_23_formal_boundary_exact_scope(self):
  a=self.run_capture();b=self.run_capture(self.request('SYNTHETIC-VERIFY','SOURCE_VERIFIED',a['event']['eventHash']));r=self.request('SYNTHETIC-INGEST','FORMAL_INGESTION_COMPLETED',b['event']['eventHash']);e=self.run_capture(r)
  kwargs={'subject_id':r['subjectId'],'subject_version':r['subjectVersion'],'scope_hash':r['scopeHash'],'source_hash':r['sourceEvidenceHash']}
  proof=self.capture.formal_boundary(r['eventId'],'ingestedAt',**kwargs);self.assertEqual(proof['at'],e['event']['knownAt']);self.assertFalse(proof['productionUseAuthorized'])
  kwargs['scope_hash']='0'*64
  with self.assertRaisesRegex(ValueError,'SCOPE_OR_SUBJECT'):self.capture.formal_boundary(r['eventId'],'ingestedAt',**kwargs)
 def test_24_checked_clock_detects_wall_and_monotonic_divergence(self):
  clock=c.CheckedClock();clock.sample();prior,mono=clock._last;clock._last=(prior+datetime.timedelta(seconds=10),mono)
  with self.assertRaisesRegex(ValueError,'CLOCK_ANOMALY'):clock.sample()
 def test_25_grant_cannot_change_operation_scope(self):
  original=self.provider.authorize
  def bad(*args):
   proof=original(*args);proof['requestBinding']='0'*64;return proof
  self.provider.authorize=bad
  with self.assertRaisesRegex(ValueError,'UNAUTHORIZED_OPERATION_OR_SCOPE'):self.run_capture()
 def test_26_session_expires_during_operation_rollback(self):
  original=self.executor.execute
  def slow(*args):
   result=original(*args);self.clock.at+=datetime.timedelta(days=2);return result
  self.executor.execute=slow
  with self.assertRaisesRegex(ValueError,'SESSION_EXPIRED'):self.run_capture()
  self.assertEqual(self.count('synthetic_business_operation'),0)
 def test_28_modified_stored_bytes_detected_after_schema_restored(self):
  self.run_capture()
  with sqlite3.connect(self.db) as db:
   sql=db.execute("SELECT sql FROM sqlite_master WHERE name='formal_knowledge_audit_no_update'").fetchone()[0]
   db.execute('DROP TRIGGER formal_knowledge_audit_no_update');db.execute("UPDATE formal_knowledge_audit SET evidence=?",(b'CORRUPTED',));db.execute(sql)
  with self.assertRaisesRegex(ValueError,'ROW_TAMPERED|EVIDENCE_TAMPERED'):self.capture.replay()
 def test_29_pec1b_contract_roles_and_fields(self):
  row=self.run_capture();self.assertEqual(set(row['event']),c.EVENT_FIELDS);self.assertEqual(row['event']['actorRole'],c.ROLE_LABELS[row['event']['eventType']]);self.assertIn(row['authorization']['permission'],c.PERMISSIONS.values())
 def test_30_subject_revocation(self):
  self.provider.revoked_subject=True
  with self.assertRaisesRegex(ValueError,'SUBJECT_REVOKED'):self.run_capture()
 def test_31_final_authorization_recheck_rolls_back(self):
  original=self.executor.execute
  def revoke(*args):
   result=original(*args);self.provider.revoked_role=True;return result
  self.executor.execute=revoke
  with self.assertRaisesRegex(ValueError,'ROLE_REVOKED'):self.run_capture()
  self.assertEqual(self.count('synthetic_business_operation'),0);self.assertEqual(self.count('formal_knowledge_audit'),0)
 def test_27_concurrent_competing_heads(self):
  first=self.run_capture()
  def submit(i):
   try:return c.TrustedCapture(self.db,identity=self.provider,executor=self.executor,clock=self.clock).capture('SYNTHETIC-CREDENTIAL',self.request('SYNTHETIC-COMPETE-'+str(i),'SOURCE_VERIFIED',first['event']['eventHash']))
   except ValueError as e:return str(e)
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(submit,[1,2]))
  self.assertEqual(sum(isinstance(x,dict) for x in results),1);self.assertEqual(sum(isinstance(x,str) and 'CONCURRENT_HEAD' in x for x in results),1);self.assertEqual(self.count('formal_knowledge_audit'),2)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--json',type=Path);args=parser.parse_args()
 result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(CaptureTests))
 if args.json:args.json.write_text(json.dumps({'testsRun':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'success':result.wasSuccessful(),'isolation':'Synthetic identity/executor and TemporaryDirectory SQLite ONLY; no production provider readiness implied','failureDetails':[{'test':t.id(),'traceback':trace} for t,trace in result.failures+result.errors]},indent=2)+'\n')
 raise SystemExit(0 if result.wasSuccessful() else 1)
