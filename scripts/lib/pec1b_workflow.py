"""PEC-1B non-authoritative preparation only. No identity provider, DB or runtime writer.

Preparation timestamps describe this local preparation operation, never formal events.
Even a structurally complete claim cannot establish authenticated knowledge here.
"""
import datetime
import hashlib
import json
import os
import re
from pathlib import Path
from lib.pec1_authority import digest
from lib.pec2_admission_v2 import evaluate as pec2_evaluate

ROLES={
    'SOURCE_ACQUIRED':'Data Evidence Reviewer',
    'SOURCE_VERIFIED':'Data Evidence Reviewer',
    'FORMAL_INGESTION_COMPLETED':'Data Evidence Reviewer',
    'FINANCIAL_MAPPING_ACCEPTED':'Data Quality Owner',
    'METHODOLOGY_APPROVED':'Methodology Owner',
    'REGISTRY_VERSION_APPROVED':'Registry Owner',
    'SOURCE_CONTRACT_APPROVED':'Investment System Owner',
    'IDENTITY_METHOD_APPROVED':'Methodology Owner',
    'SOURCE_METHOD_APPROVED':'Methodology Owner',
    'IDENTITY_BINDING_APPROVED':'Data Evidence Reviewer',
    'INDEPENDENT_VALIDATION_ACCEPTED':'Independent Validator',
    'DATASET_CUTOFF_APPROVED':'Dataset Owner',
}
BOUNDARIES={
    'ingestedAt':'FORMAL_INGESTION_COMPLETED',
    'mappingKnownAt':'FINANCIAL_MAPPING_ACCEPTED',
    'methodologyKnownAt':'METHODOLOGY_APPROVED',
    'registryKnownAt':'REGISTRY_VERSION_APPROVED',
    'sourceContractKnownAt':'SOURCE_CONTRACT_APPROVED',
    'identityMethodKnownAt':'IDENTITY_METHOD_APPROVED',
    'sourceMethodKnownAt':'SOURCE_METHOD_APPROVED',
    'identityBindingKnownAt':'IDENTITY_BINDING_APPROVED',
    'policyKnownAt':'METHODOLOGY_APPROVED',
}
INTENT_FIELDS=set('submissionId eventType subjectId subjectVersion sourceEvidenceHash actorId actorRole authenticationReference producerIds scopeHash predecessorEventHashes evidenceHash'.split())
EVENT_FIELDS=set('eventId eventType subjectId subjectVersion sourceEvidenceHash actorId actorRole authenticationReference occurredAt recordedAt effectiveAt knownAt evidenceReference evidenceHash previousEventHash eventHash validationStatus'.split())
ACCEPTANCE_FIELDS=set('requestId candidateId sourceEvidenceHash financialMappingHashes methodologyVersion registryVersion knowledgeChainHash datasetVersion datasetContentHash cutoffReceiptHash producerIds assignedReviewerId result revoked revalidationRequired'.split())
DATASET_FIELDS=set('datasetId datasetVersion sourceEvidenceReferences financialMappingReferences methodologyVersion registryVersion sourceAuthorityReferences effectiveKnownAt systemKnownAt decisionAsOf creationEventId approvalEventId datasetContentHash immutableAuditReference'.split())


def require(value,reason):
    if not value:raise ValueError(reason)
def nonempty(v):return isinstance(v,str) and bool(v.strip()) and v==v.strip() and not re.search(r'[\x00-\x1f]',v)
def hash_ok(v):return isinstance(v,str) and re.fullmatch('[a-f0-9]{64}',v) is not None
def utc_now():return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='microseconds').replace('+00:00','Z')
def instant(v):
    require(isinstance(v,str) and v.endswith('Z'),'UTC_INSTANT_REQUIRED')
    d=datetime.datetime.fromisoformat(v[:-1]+'+00:00');return d

def canonical_bytes(v):return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode()
def exclusive(path,payload):
    fd=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o444)
    with os.fdopen(fd,'wb') as f:f.write(payload);f.flush();os.fsync(f.fileno())

def validate_intent(intent):
    require(isinstance(intent,dict) and set(intent)==INTENT_FIELDS,'INTENT_SCHEMA_CALLER_TIMESTAMPS_FORBIDDEN')
    require(nonempty(intent['submissionId']) and len(intent['submissionId'])<=200,'SUBMISSION_ID')
    require(intent['eventType'] in ROLES,'EVENT_TYPE')
    require(all(nonempty(intent[k]) for k in ['subjectId','subjectVersion']),'SUBJECT_VERSION')
    require(all(hash_ok(intent[k]) for k in ['sourceEvidenceHash','evidenceHash','scopeHash']),'INTENT_HASH')
    require(intent['actorRole']==ROLES[intent['eventType']],'UNAUTHORIZED_ROLE_CLAIM')
    require(intent['actorId'] is None or nonempty(intent['actorId']),'ACTOR_CLAIM')
    require(intent['authenticationReference'] is None or nonempty(intent['authenticationReference']),'AUTHENTICATION_CLAIM')
    producers=intent['producerIds'];require(isinstance(producers,list) and producers and all(nonempty(v) for v in producers) and producers==sorted(set(producers)),'PRODUCER_IDENTITIES')
    require(intent['actorId'] not in ['Codex','AI Portfolio Manager'],'AUTOMATION_CANNOT_IMPERSONATE_OWNER')
    if intent['eventType'] in ['FINANCIAL_MAPPING_ACCEPTED','INDEPENDENT_VALIDATION_ACCEPTED']:
        require(intent['actorId'] is None or intent['actorId'] not in producers,'PRODUCER_SELF_APPROVAL')
    refs=intent['predecessorEventHashes'];require(isinstance(refs,list) and refs==sorted(set(refs)) and all(hash_ok(x) for x in refs),'PREDECESSOR_HASHES')
    return intent


def preparation_event_hash(event,intent_hash):
    return digest({'event':{k:v for k,v in event.items() if k!='eventHash'},'intentHash':intent_hash})


def validate_preparation(record,workspace):
    require(isinstance(record,dict) and set(record)=={'contract','intent','intentHash','event','authoritative','productionUseAuthorized'},'PREPARATION_SCHEMA')
    require(record['contract']=='pec1b-preparation-v1' and record['authoritative'] is False and record['productionUseAuthorized'] is False,'PREPARATION_AUTHORITY_FORBIDDEN')
    intent=validate_intent(record['intent']);e=record['event']
    require(record['intentHash']==digest(intent),'INTENT_MODIFIED')
    require(set(e)==EVENT_FIELDS and e['eventHash']==preparation_event_hash(e,record['intentHash']),'EVENT_MODIFIED')
    require(e['eventId']=='pec1b-preparation-sha256:'+digest({'submissionId':intent['submissionId']}),'EVENT_ID')
    for k in ['eventType','subjectId','subjectVersion','sourceEvidenceHash','actorId','actorRole','authenticationReference','evidenceHash']:require(e[k]==intent[k],'EVENT_INTENT_BINDING')
    require(e['validationStatus']=='PREPARED_NON_AUTHORITATIVE','UNAUTHENTICATED_EVENT_CANNOT_BE_FORMAL')
    require(all(e[k] is None for k in ['occurredAt','effectiveAt','knownAt']),'PREPARATION_CANNOT_CREATE_FORMAL_CLOCK')
    instant(e['recordedAt'])
    rel=Path(e['evidenceReference']);require(not rel.is_absolute() and '..' not in rel.parts and str(rel)=='evidence/'+e['evidenceHash']+'.bin','EVIDENCE_REFERENCE')
    p=Path(workspace)/rel;require(not p.is_symlink() and hashlib.sha256(p.read_bytes()).hexdigest()==e['evidenceHash'],'EVIDENCE_MODIFIED')
    return e


def read_workspace(workspace):
    workspace=Path(workspace);records=[]
    if not workspace.exists():return records
    files=list(workspace.glob('*.json'));require(len(files)==len({p.name for p in files}),'DUPLICATE_EVENT')
    by_hash={};ids=set();submissions=set()
    for p in files:
        require(not p.is_symlink(),'SYMLINK_PREPARATION')
        r=json.loads(p.read_text());e=validate_preparation(r,workspace)
        require(p.name==digest({'submissionId':r['intent']['submissionId']})+'.json','SUBMISSION_PATH')
        require(e['eventHash'] not in by_hash and e['eventId'] not in ids and r['intent']['submissionId'] not in submissions,'DUPLICATE_EVENT')
        by_hash[e['eventHash']]=r;ids.add(e['eventId']);submissions.add(r['intent']['submissionId'])
    previous=None
    while len(records)<len(files):
        next_records=[r for r in by_hash.values() if r['event']['previousEventHash']==previous]
        require(len(next_records)==1,'INVALID_EVENT_ORDER_OR_FORK')
        r=next_records[0];e=r['event'];past={x['event']['eventHash'] for x in records}
        require(set(r['intent']['predecessorEventHashes'])<=past,'PREDECESSOR_MISSING_OR_FUTURE')
        if records:require(instant(records[-1]['event']['recordedAt'])<=instant(e['recordedAt']),'RECORDED_TIME_REVERSED')
        records.append(r);previous=e['eventHash'];del by_hash[previous]
    return records


def append_preparation(workspace,intent,evidence_bytes):
    """Append a NON-AUTHORITATIVE proposal artifact. Never captures a formal event.

    No clock/authentication arguments, DB writer or configurable formal mode exists.
    Workspace must be a new review evidence directory, not a runtime authority store.
    Replays rehash the full prefix; identical retries return the original artifact.
    """
    validate_intent(intent);require(isinstance(evidence_bytes,bytes),'EVIDENCE_BYTES_REQUIRED')
    require(hashlib.sha256(evidence_bytes).hexdigest()==intent['evidenceHash'],'EVIDENCE_HASH_MISMATCH')
    workspace=Path(workspace);workspace.mkdir(parents=True,exist_ok=True)
    require(not workspace.is_symlink(),'SYMLINK_WORKSPACE')
    lock=workspace/'.pec1b-preparation.lock'
    fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600);os.close(fd)
    try:
        records=read_workspace(workspace)
        prior=next((r for r in records if r['intent']['submissionId']==intent['submissionId']),None)
        if prior:
            require(prior['intent']==intent,'DUPLICATE_SUBMISSION_MODIFIED');return prior
        past={r['event']['eventHash'] for r in records}
        require(set(intent['predecessorEventHashes'])<=past,'PREDECESSOR_MISSING_OR_FUTURE')
        prerequisite={'SOURCE_VERIFIED':'SOURCE_ACQUIRED','FORMAL_INGESTION_COMPLETED':'SOURCE_VERIFIED','FINANCIAL_MAPPING_ACCEPTED':'FORMAL_INGESTION_COMPLETED'}.get(intent['eventType'])
        if prerequisite:
            require(any(r['event']['eventType']==prerequisite and r['event']['subjectId']==intent['subjectId'] and r['event']['subjectVersion']==intent['subjectVersion'] and r['event']['sourceEvidenceHash']==intent['sourceEvidenceHash'] and r['intent']['scopeHash']==intent['scopeHash'] and r['event']['eventHash'] in intent['predecessorEventHashes'] for r in records),'INVALID_EVENT_ORDER')
        at=utc_now()
        if records:require(instant(at)>=instant(records[-1]['event']['recordedAt']),'CAPTURE_CLOCK_REVERSED')
        folder=workspace/'evidence';folder.mkdir(exist_ok=True);require(not folder.is_symlink(),'SYMLINK_EVIDENCE_DIRECTORY')
        file=folder/(intent['evidenceHash']+'.bin')
        if file.exists():require(not file.is_symlink() and file.read_bytes()==evidence_bytes,'EVIDENCE_MODIFIED')
        else:exclusive(file,evidence_bytes)
        event={k:intent[k] for k in ['eventType','subjectId','subjectVersion','sourceEvidenceHash','actorId','actorRole','authenticationReference','evidenceHash']}
        event.update(eventId='pec1b-preparation-sha256:'+digest({'submissionId':intent['submissionId']}),occurredAt=None,recordedAt=at,effectiveAt=None,knownAt=None,evidenceReference='evidence/'+intent['evidenceHash']+'.bin',previousEventHash=records[-1]['event']['eventHash'] if records else None,validationStatus='PREPARED_NON_AUTHORITATIVE')
        event['eventHash']=preparation_event_hash(event,digest(intent))
        result={'contract':'pec1b-preparation-v1','intent':json.loads(json.dumps(intent)),'intentHash':digest(intent),'event':event,'authoritative':False,'productionUseAuthorized':False}
        exclusive(workspace/(digest({'submissionId':intent['submissionId']})+'.json'),canonical_bytes(result))
        return result
    finally:lock.unlink()


def capture_formal_event(*args,**kwargs):
    raise ValueError('BLOCKED_AUTHENTICATED_IDENTITY_AND_TRUSTED_CAPTURE_UNAVAILABLE')


def assess_knowledge(boundaries,other_required_contract_boundaries,expected_scope_hash):
    """Inspect proposals, never turn an auth-reference string into authenticated knowledge."""
    require(hash_ok(expected_scope_hash),'EXPECTED_SCOPE_HASH')
    missing=sorted(set(BOUNDARIES)-set(boundaries));invalid=[]
    for name,proposal in boundaries.items():
        if name not in BOUNDARIES:invalid.append(name+':UNDECLARED_BOUNDARY');continue
        if not isinstance(proposal,dict):invalid.append(name+':INVALID_BOUNDARY');continue
        e=proposal.get('event',{});intent=proposal.get('intent',{})
        if e.get('eventType')!=BOUNDARIES[name] or intent.get('scopeHash')!=expected_scope_hash:invalid.append(name+':EVENT_TYPE_OR_SCOPE')
        invalid.append(name+':AUTHENTICATED_IMMUTABLE_EVENT_UNAVAILABLE')
    if other_required_contract_boundaries is None:missing.append('otherRequiredContractBoundaries')
    elif not isinstance(other_required_contract_boundaries,list):invalid.append('OTHER_BOUNDARIES_SCHEMA')
    elif other_required_contract_boundaries:invalid.append('OTHER_BOUNDARIES_NOT_AUTHENTICATED')
    return {'knowledgeChainStatus':'INCOMPLETE','missing':missing,'invalid':invalid,'effectiveKnownAt':None,'asKnownEligible':False,'effectiveProductionAdmission':False,'reason':'AUTHENTICATED_EVENT_RESOLVER_NOT_CONFIGURED'}


def dataset_hash(dataset):
    """Approval references attach to content, preventing an approval/hash cycle."""
    return digest({k:v for k,v in dataset.items() if k not in ['datasetVersion','datasetContentHash','approvalEventId','immutableAuditReference']})

def assess_dataset(dataset,knowledge,*,evaluation_at):
    failures=[]
    try:
        require(isinstance(dataset,dict) and set(dataset)==DATASET_FIELDS,'DATASET_SCHEMA')
        require(nonempty(dataset['datasetId']) and all(nonempty(dataset[k]) for k in ['methodologyVersion','registryVersion','creationEventId']),'DATASET_IDENTITY')
        for k in ['sourceEvidenceReferences','financialMappingReferences','sourceAuthorityReferences']:
            refs=dataset[k];require(isinstance(refs,list) and refs and all(isinstance(r,dict) and set(r)=={'id','hash'} and nonempty(r['id']) and hash_ok(r['hash']) for r in refs),'DATASET_REFERENCES')
            require(refs==sorted(refs,key=lambda r:r['id']) and len({r['id'] for r in refs})==len(refs),'DATASET_REFERENCE_ORDER')
        require(dataset['datasetContentHash']==dataset_hash(dataset) and dataset['datasetVersion']=='sha256:'+dataset['datasetContentHash'],'INVALID_DATASET_VERSION')
        require(all(dataset[k] is not None for k in ['effectiveKnownAt','systemKnownAt','decisionAsOf']),'MISSING_DATASET_CUTOFF')
        require(instant(dataset['effectiveKnownAt'])<=instant(dataset['systemKnownAt'])<=instant(dataset['decisionAsOf'])<=instant(evaluation_at),'FUTURE_KNOWLEDGE_LEAKAGE')
        require(knowledge.get('effectiveKnownAt')==dataset['effectiveKnownAt'],'KNOWLEDGE_CHAIN_HASH_OR_CUTOFF_MISMATCH')
    except (ValueError,TypeError,KeyError) as e:failures.append(str(e))
    failures.append('AUTHENTICATED_DATASET_APPROVAL_AND_CREATION_UNAVAILABLE')
    if knowledge.get('knowledgeChainStatus')!='COMPLETE':failures.append('KNOWLEDGE_CHAIN_INCOMPLETE')
    return {'status':'BLOCKED','structuralFailures':[x for x in failures if x not in ['AUTHENTICATED_DATASET_APPROVAL_AND_CREATION_UNAVAILABLE','KNOWLEDGE_CHAIN_INCOMPLETE']],'blockers':failures,'asKnownEligible':False,'productionUseAuthorized':False}


def assess_independent_request(request,expected_scope):
    require(isinstance(request,dict) and set(request)==ACCEPTANCE_FIELDS,'INDEPENDENT_REQUEST_SCHEMA')
    require(set(expected_scope)==ACCEPTANCE_FIELDS-set('requestId assignedReviewerId result revoked revalidationRequired'.split()),'EXPECTED_VALIDATION_SCOPE')
    require(all(request[k]==v for k,v in expected_scope.items()),'INDEPENDENT_SCOPE_CHANGED')
    require(all(nonempty(request[k]) for k in ['requestId','candidateId','methodologyVersion','registryVersion','datasetVersion']),'VALIDATION_IDENTITIES')
    require(all(hash_ok(request[k]) for k in ['sourceEvidenceHash','knowledgeChainHash','datasetContentHash','cutoffReceiptHash']),'VALIDATION_HASHES')
    hashes=request['financialMappingHashes'];require(isinstance(hashes,list) and hashes and hashes==sorted(set(hashes)) and all(hash_ok(h) for h in hashes),'VALIDATION_MAPPING_HASHES')
    producers=request['producerIds'];require(isinstance(producers,list) and producers and producers==sorted(set(producers)) and all(nonempty(p) for p in producers),'VALIDATION_PRODUCERS')
    require(nonempty(request['assignedReviewerId']) and request['assignedReviewerId'] not in request['producerIds'] and request['assignedReviewerId'] not in ['Codex','AI Portfolio Manager'],'PRODUCER_SELF_APPROVAL')
    require(request['result'] in ['PENDING','ACCEPT','REJECT'],'VALIDATION_RESULT')
    require(isinstance(request['revoked'],bool) and isinstance(request['revalidationRequired'],bool),'VALIDATION_REVOCATION_SCHEMA')
    reasons=['AUTHENTICATED_INDEPENDENT_ACCEPTANCE_UNAVAILABLE']
    if request['revoked']:reasons.append('INDEPENDENT_ACCEPTANCE_REVOKED')
    if request['revalidationRequired']:reasons.append('REVALIDATION_REQUIRED')
    if request['result']=='REJECT':reasons.append('INDEPENDENT_REJECTION')
    return {'status':'BLOCKED','accepted':False,'scopeHash':digest(expected_scope),'blockers':reasons,'productionUseAuthorized':False}


def pec2_preparation_boundary(record,core,receipts,inventory,now,*,root):
    """No trust argument/export, no receipt synthesis and no production writer."""
    result=pec2_evaluate(record,core,receipts,inventory,now,trust={},root=root)
    require(result['effectiveAdmissionState'] not in ['ADMITTED','RESTRICTED','ELIGIBLE'],'UNAPPROVED_PEC2_ADMISSION')
    return {'contract':'pec1b-pec2-preparation-v1','PEC2Result':result,'qualifiedEvidenceExported':False,'productionUseAuthorized':False,'runtimeActivationAuthorized':False,'scoringAuthorized':False}


def request_production_activation(*args,**kwargs):
    raise ValueError('UNAUTHORIZED_PRODUCTION_ACTIVATION')
