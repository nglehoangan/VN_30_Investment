"""Provider-neutral authenticated capture boundary. No production composition exists.

Only trusted server composition may supply identity authority and operation executor.
No HTTP route, provider implementation, production DB installer or activation writer.
"""
import datetime
import hashlib
import json
import re
import sqlite3
import time
import threading
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol
from lib.pec1_authority import digest
from lib.pec1b_workflow import BOUNDARIES, EVENT_FIELDS, ROLES as ROLE_LABELS

PERMISSIONS={
 'SOURCE_ACQUIRED':'DATA_EVIDENCE_REVIEWER',
 'SOURCE_VERIFIED':'DATA_EVIDENCE_REVIEWER',
 'FORMAL_INGESTION_COMPLETED':'DATA_EVIDENCE_REVIEWER',
 'FINANCIAL_MAPPING_ACCEPTED':'DATA_QUALITY_OWNER',
 'METHODOLOGY_APPROVED':'METHODOLOGY_OWNER',
 'REGISTRY_VERSION_APPROVED':'REGISTRY_OWNER',
 'SOURCE_CONTRACT_APPROVED':'INVESTMENT_SYSTEM_OWNER',
 'IDENTITY_METHOD_APPROVED':'METHODOLOGY_OWNER',
 'SOURCE_METHOD_APPROVED':'METHODOLOGY_OWNER',
 'IDENTITY_BINDING_APPROVED':'DATA_EVIDENCE_REVIEWER',
 'INDEPENDENT_VALIDATION_ACCEPTED':'INDEPENDENT_VALIDATOR',
 'DATASET_CUTOFF_APPROVED':'DATASET_OWNER',
}
REQUEST_FIELDS=set('eventId eventType subjectId subjectVersion sourceEvidenceHash scopeHash expectedPreviousEventHash operationReference'.split())

def require(ok,why):
 if not ok:raise ValueError(why)
def text(x):return isinstance(x,str) and bool(x.strip()) and x.strip()==x and len(x)<4001 and not any(ord(ch)<32 for ch in x)
def hashed(x):return isinstance(x,str) and len(x)==64 and all(c in '0123456789abcdef' for c in x)
def stamp(t):return t.astimezone(datetime.timezone.utc).isoformat(timespec='microseconds').replace('+00:00','Z')
def instant(s):
 require(isinstance(s,str) and s.endswith('Z'),'UTC_REQUIRED');t=datetime.datetime.fromisoformat(s[:-1]+'+00:00')
 require(stamp(t)==s,'CANONICAL_UTC_REQUIRED');return t
def encode(x):return json.dumps(x,sort_keys=True,ensure_ascii=False,separators=(',',':'),allow_nan=False)
def bytes_hash(x):return hashlib.sha256(x).hexdigest()
def stream(request):return digest({k:request[k] for k in ['subjectId','subjectVersion','sourceEvidenceHash','scopeHash']})
def validate_request(r):
 require(isinstance(r,dict) and set(r)==REQUEST_FIELDS,'REQUEST_FIELDS_CALLER_IDENTITY_AND_TIMESTAMPS_FORBIDDEN')
 require(r['eventType'] in PERMISSIONS,'UNAUTHORIZED_OPERATION')
 require(isinstance(r['eventId'],str) and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._:-]{0,199}',r['eventId']) is not None,'EVENT_ID_FORMAT')
 require(all(text(r[k]) for k in ['eventId','subjectId','subjectVersion','operationReference']),'REQUEST_IDENTITY')
 require(all(hashed(r[k]) for k in ['scopeHash','sourceEvidenceHash']),'REQUEST_HASH')
 require(r['expectedPreviousEventHash'] is None or hashed(r['expectedPreviousEventHash']),'CHAIN_HASH')
 require(not r['eventId'].startswith('pec1b-preparation-'),'PREPARATION_CANNOT_BECOME_FORMAL_EVENT')

@dataclass(frozen=True)
class VerifiedSession:
 subject:str
 session_reference:str
 issuer:str
 audience:str
 authenticated_at:str
 expires_at:str
 audit_reference:str

class IdentityAuthority(Protocol):
 """Server-injected real provider adapter; never constructed from request claims.

 resolve verifies provider signature/introspection, issuer/audience/session provenance.
 authorize verifies *current* session AND operation-specific role/scope revocation,
 and returns immutable provider audit evidence. authorize_saved rechecks current
 invalidation for a persisted exact authorization, including expired original sessions.
 """
 def resolve(self,credential:str)->VerifiedSession:...
 def authorize(self,session:VerifiedSession,request:dict,at:str)->dict:...
 def authorize_saved(self,authorization:dict,request:dict,at:str)->None:...

class OperationExecutor(Protocol):
 """Trusted composition executes/validates the exact authorized operation using SAME tx.

 Must discover producers from authoritative provenance, never the caller. Evidence
 bytes and exact binding must describe actual new execution, not an old preparation.
 Must not commit/rollback independently, perform unaudited irreversible IO, or write
 production authority outside the caller's transaction. Not implemented for real data.
 """
 def execute(self,connection:sqlite3.Connection,request:dict)->dict:...

class CheckedClock:
 """UTC plus monotonic drift checks; not evidence of historical availability/NTP trust."""
 def __init__(self):self._last=None;self._lock=threading.Lock()
 def sample(self):
  with self._lock:return self._sample()
 def _sample(self):
  wall=datetime.datetime.now(datetime.timezone.utc);mono=time.monotonic_ns()
  if self._last:
   prior,pm=self._last;delta=(wall-prior).total_seconds();elapsed=(mono-pm)/1e9
   require(delta>=0 and elapsed>=0 and abs(delta-elapsed)<=2,'CLOCK_ANOMALY_ROLLBACK_OR_DRIFT')
  self._last=(wall,mono);return stamp(wall)

def session_check(session,at):
 require(isinstance(session,VerifiedSession),'AUTHENTICATED_SESSION_REQUIRED')
 require(all(text(v) for v in [session.subject,session.session_reference,session.issuer,session.audience,session.audit_reference]),'IDENTITY_PROVENANCE_REQUIRED')
 require(session.subject not in ['Codex','AI Portfolio Manager'],'AUTOMATION_CANNOT_IMPERSONATE_OWNER')
 require(instant(session.authenticated_at)<=instant(at)<instant(session.expires_at),'SESSION_EXPIRED_OR_NOT_YET_VALID')

def authorization_check(a,session,r,at):
 require(isinstance(a,dict) and set(a)==set('subject sessionReference issuer audience permission requestBinding grantedAt validThrough authenticationReference auditReference'.split()),'AUTHORIZATION_PROOF_SCHEMA')
 require((a['subject'],a['sessionReference'],a['issuer'],a['audience'])==(session.subject,session.session_reference,session.issuer,session.audience),'AUTHORIZATION_IDENTITY_BINDING')
 require(a['permission']==PERMISSIONS[r['eventType']] and a['requestBinding']==digest(r),'UNAUTHORIZED_OPERATION_OR_SCOPE')
 require(text(a['authenticationReference']) and text(a['auditReference']),'AUTHENTICATION_AUDIT_REQUIRED')
 require(instant(a['grantedAt'])<=instant(at)<instant(a['validThrough'])<=instant(session.expires_at),'AUTHORIZATION_EXPIRED')

def schema_objects(connection):
 return {r[0]:r[1] for r in connection.execute("SELECT name,sql FROM sqlite_master WHERE name LIKE 'formal_knowledge_audit%' ORDER BY name")}

def expected_schema():
 c=sqlite3.connect(':memory:')
 try:
  c.executescript((Path(__file__).resolve().parents[1]/'contracts/pec1c-audit.sql').read_text());return schema_objects(c)
 finally:c.close()

def row_digest(event,authorization,operation,evidence,transaction_reference,request_hash):
 return digest({'event':event,'authorization':authorization,'operation':operation,'evidenceBytesHash':bytes_hash(evidence),'transactionReference':transaction_reference,'requestHash':request_hash})

class TrustedCapture:
 def __init__(self,database,*,identity=None,executor=None,clock=None):
  self.database=Path(database);self.identity=identity;self.executor=executor;self.clock=clock or CheckedClock()
 def configured(self):require(self.identity is not None and self.executor is not None,'BLOCKED_TRUSTED_PROVIDER_AND_EXECUTOR_NOT_CONFIGURED')
 def connection(self):
  require(self.database.is_file(),'AUDIT_SCHEMA_NOT_INSTALLED')
  c=sqlite3.connect('file:'+str(self.database.resolve())+'?mode=rw',uri=True,isolation_level=None,timeout=5)
  c.row_factory=sqlite3.Row;c.execute('PRAGMA foreign_keys=ON');c.execute('PRAGMA synchronous=FULL')
  try:require(schema_objects(c)==expected_schema(),'AUDIT_IMMUTABILITY_SCHEMA_MISSING_OR_CHANGED')
  except BaseException:c.close();raise
  return c
 def capture(self,credential,request):
  self.configured();require(isinstance(request,dict),'REQUEST_SCHEMA');request=dict(request);validate_request(request);require(text(credential),'MISSING_AUTHENTICATION')
  at=self.clock.sample();session=self.identity.resolve(credential);session_check(session,at)
  authorization=self.identity.authorize(session,request,at);authorization_check(authorization,session,request,at)
  c=self.connection()
  try:
   c.execute('BEGIN IMMEDIATE')
   at=self.clock.sample();session_check(session,at)
   authorization=self.identity.authorize(session,request,at);authorization_check(authorization,session,request,at)
   # Verify ALL persisted prefixes before extending or returning a duplicate.
   rows=self._replay(c,at)
   duplicate=next((x for x in rows if x['event']['eventId']==request['eventId']),None)
   if duplicate:
    require(duplicate['requestHash']==digest(request),'DUPLICATE_EVENT_MODIFIED')
    require(duplicate['event']['actorId']==session.subject,'DUPLICATE_EVENT_ACTOR_MISMATCH')
    self.identity.authorize_saved(duplicate['authorization'],request,at)
    c.commit();return duplicate
   chain=[x for x in rows if x['streamId']==stream(request)];head=chain[-1]['event'] if chain else None
   require(request['expectedPreviousEventHash']==(head['eventHash'] if head else None),'INVALID_EVENT_CHAIN_OR_CONCURRENT_HEAD')
   prerequisite={'SOURCE_VERIFIED':'SOURCE_ACQUIRED','FORMAL_INGESTION_COMPLETED':'SOURCE_VERIFIED','FINANCIAL_MAPPING_ACCEPTED':'FORMAL_INGESTION_COMPLETED'}.get(request['eventType'])
   if prerequisite:require(any(x['event']['eventType']==prerequisite for x in chain),'OPERATION_PREDECESSOR_MISSING')
   before=self.clock.sample();session_check(session,before)
   result=self.executor.execute(c,dict(request))
   require(isinstance(result,dict) and set(result)=={'requestBinding','evidenceBytes','producerIds','executionReference'},'OPERATION_RECEIPT_SCHEMA')
   require(result['requestBinding']==digest(request) and text(result['executionReference']),'EXECUTION_SCOPE_BINDING')
   evidence=result['evidenceBytes'];require(isinstance(evidence,bytes) and bytes_hash(evidence)==request['sourceEvidenceHash'],'MODIFIED_EVIDENCE')
   producers=result['producerIds'];require(isinstance(producers,list) and producers and producers==sorted(set(producers)) and all(text(x) for x in producers),'AUTHORITATIVE_PRODUCERS_REQUIRED')
   # Approval/acceptance/verification is distinct from producing its subject evidence.
   if request['eventType']!='SOURCE_ACQUIRED':require(session.subject not in producers,'PRODUCER_SELF_APPROVAL')
   occurred=self.clock.sample();recorded=self.clock.sample()
   require(instant(before)<=instant(occurred)<=instant(recorded),'CLOCK_ROLLBACK')
   if rows:require(instant(recorded)>=max(instant(x['event']['recordedAt']) for x in rows),'PERSISTED_CLOCK_ROLLBACK')
   session_check(session,recorded)
   authorization=self.identity.authorize(session,request,recorded);authorization_check(authorization,session,request,recorded)
   operation={'request':dict(request),'producerIds':producers,'executionReference':result['executionReference'],'sourceBytesHash':bytes_hash(evidence),'authorizationHash':digest(authorization)}
   event={k:request[k] for k in ['eventId','eventType','subjectId','subjectVersion','sourceEvidenceHash']}
   event.update(actorId=session.subject,actorRole=ROLE_LABELS[request['eventType']],authenticationReference=authorization['authenticationReference'],occurredAt=occurred,recordedAt=recorded,effectiveAt=occurred,knownAt=recorded,evidenceReference='sqlite:formal_knowledge_audit:'+request['eventId']+'#/operation',evidenceHash=digest(operation),previousEventHash=request['expectedPreviousEventHash'],validationStatus='AUTHENTICATED_VALIDATED')
   event['eventHash']=digest(event);require(set(event)==EVENT_FIELDS,'PEC1B_EVENT_SCHEMA')
   tx='sqlite-audit-transaction:'+str(uuid.uuid4());rh=row_digest(event,authorization,operation,evidence,tx,digest(request))
   c.execute('INSERT INTO formal_knowledge_audit VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',(request['eventId'],event['eventHash'],stream(request),digest(request),request['expectedPreviousEventHash'],recorded,tx,encode(event),encode(authorization),encode(operation),evidence,rh))
   c.commit();return {'event':event,'authorization':authorization,'operation':operation,'transactionReference':tx,'requestHash':digest(request),'streamId':stream(request),'rowHash':rh,'productionUseAuthorized':False}
  except BaseException:
   if c.in_transaction:c.rollback()
   raise
  finally:c.close()
 def _replay(self,c,at):
  result=[];heads={}
  rows=c.execute('SELECT * FROM formal_knowledge_audit ORDER BY rowid').fetchall()
  for row in rows:
   event=json.loads(row['event_body']);a=json.loads(row['authorization_body']);op=json.loads(row['operation_body']);r=op['request'];validate_request(r)
   require(set(event)==EVENT_FIELDS and event['validationStatus']=='AUTHENTICATED_VALIDATED','EVENT_SCHEMA_OR_PREPARATION_FORBIDDEN')
   require(event['eventHash']==digest({k:v for k,v in event.items() if k!='eventHash'}),'EVENT_TAMPERED')
   require(row['row_hash']==row_digest(event,a,op,bytes(row['evidence']),row['transaction_reference'],row['request_hash']),'ROW_TAMPERED')
   require(bytes_hash(bytes(row['evidence']))==event['sourceEvidenceHash']==r['sourceEvidenceHash']==op['sourceBytesHash'],'EVIDENCE_TAMPERED')
   require(event['evidenceHash']==digest(op) and op['authorizationHash']==digest(a),'AUTHORIZATION_OR_OPERATION_TAMPERED')
   require(all(event[k]==r[k] for k in ['eventId','eventType','subjectId','subjectVersion','sourceEvidenceHash']),'REQUEST_EVENT_BINDING')
   require(row['event_id']==event['eventId'] and row['event_hash']==event['eventHash'] and row['stream_id']==stream(r) and row['request_hash']==digest(r) and row['recorded_at']==event['recordedAt'] and row['previous_event_hash']==event['previousEventHash']==r['expectedPreviousEventHash'],'ROW_INDEX_BINDING')
   require(event['previousEventHash']==heads.get(row['stream_id']),'INVALID_EVENT_CHAIN')
   if result:require(instant(result[-1]['event']['recordedAt'])<=instant(event['recordedAt']),'PERSISTED_CLOCK_ROLLBACK')
   require(instant(a['grantedAt'])<=instant(event['recordedAt'])<instant(a['validThrough']),'ORIGINAL_AUTHORIZATION_TIME_BINDING')
   require(instant(event['recordedAt'])<=instant(at),'CLOCK_ROLLBACK')
   require(instant(event['occurredAt'])<=instant(event['recordedAt'])==instant(event['knownAt']) and event['effectiveAt']==event['occurredAt'],'EVENT_CLOCK_BINDING')
   require(event['actorId']==a['subject'] and event['actorRole']==ROLE_LABELS[event['eventType']] and a['permission']==PERMISSIONS[event['eventType']] and a['requestBinding']==digest(r) and event['authenticationReference']==a['authenticationReference'],'AUTHORIZATION_EVENT_BINDING')
   if event['eventType']!='SOURCE_ACQUIRED':require(event['actorId'] not in op['producerIds'],'PRODUCER_SELF_APPROVAL')
   self.identity.authorize_saved(a,r,at)
   heads[row['stream_id']]=event['eventHash'];result.append({'event':event,'authorization':a,'operation':op,'transactionReference':row['transaction_reference'],'requestHash':row['request_hash'],'streamId':row['stream_id'],'rowHash':row['row_hash'],'productionUseAuthorized':False})
  return result
 def replay(self):
  self.configured();c=self.connection()
  try:
   c.execute('BEGIN');r=self._replay(c,self.clock.sample());c.commit();return r
  finally:c.close()
 def formal_boundary(self,event_id,field,*,subject_id,subject_version,scope_hash,source_hash):
  require(field in BOUNDARIES,'UNDECLARED_FORMAL_BOUNDARY')
  rows=self.replay();row=next((x for x in rows if x['event']['eventId']==event_id),None);require(row is not None,'FORMAL_EVENT_MISSING')
  e=row['event'];r=row['operation']['request']
  require((e['eventType'],e['subjectId'],e['subjectVersion'],r['scopeHash'],e['sourceEvidenceHash'])==(BOUNDARIES[field],subject_id,subject_version,scope_hash,source_hash),'FORMAL_BOUNDARY_SCOPE_OR_SUBJECT')
  return {'boundary':field,'at':e['knownAt'],'eventId':event_id,'eventHash':e['eventHash'],'rowHash':row['rowHash'],'auditReference':row['transactionReference'],'productionUseAuthorized':False}

def production_capture(database):
 """Public default: no implicit environment credentials, owner or provider."""
 return TrustedCapture(database)
