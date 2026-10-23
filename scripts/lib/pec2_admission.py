"""PEC-2 offline preparation and replay. Never writes authority or activates runtime.
Trust is supplied only by an independently authenticated composition, not records.
The repository's real PEC-2 preparation uses an empty trust configuration.
"""
import datetime
import hashlib
import json
import re
from pathlib import Path
from zoneinfo import ZoneInfo
from lib.pec1_authority import digest, instant, evaluate as pec1_evaluate

STATES = ('ELIGIBLE', 'ADMITTED', 'RESTRICTED', 'DEFERRED', 'REJECTED', 'REVOKED')
# Retained research basket; not a claim of current exchange membership certification.
TICKERS = frozenset('ACB BID BSR CTG FPT GAS GVR HDB HPG LPB MBB MCH MSN MWG SAB SHB SSB SSI STB TCB TCX VCB VHM VIB VIC VJC VNM VPB VPL VRE'.split())
CLOCKS = ('publicationBoundary', 'sourceRetrievedAt', 'documentRetrievedAt', 'sourceVerifiedAt',
          'documentVerifiedAt', 'ingestedAt', 'mappingKnownAt', 'methodologyKnownAt', 'registryKnownAt',
          'sourceContractKnownAt', 'identityMethodKnownAt', 'sourceMethodKnownAt', 'identityBindingKnownAt', 'policyKnownAt')
RECORD_FIELDS = frozenset('contract admissionId candidateId ownerApprovalReference evidenceBundleReference evidenceHash publisherIdentity sourceIdentity documentIdentity datasetScope tickerCoverage reportingPeriods statementType financialMetricCoverage publicationTimestamp knowledgeCutoff admissionRestrictions admissionStatus validationResult admissionTimestamp revocationStatus auditReferences'.split())
SCOPE_FIELDS = frozenset('ticker period frame statementType consolidation metrics sourceVersion'.split())
CORE_FIELDS = frozenset('contract pec1Candidate publisherIdentity sourceIdentity documentIdentity datasetScope publication knowledge financialMappings evidencePins'.split())

def require(ok, reason):
    if not ok:
        raise ValueError(reason)

def exact(x, keys, code):
    require(isinstance(x, dict) and set(x) == set(keys), code)

def text(x):
    return isinstance(x, str) and bool(x.strip()) and x == x.strip() and len(x) <= 4000 and not re.search(r'[\x00-\x1f]', x)

def sha256(x):
    return isinstance(x, str) and bool(re.fullmatch('[a-f0-9]{64}', x))

def unique_strings(x, allow_empty=False):
    return isinstance(x, list) and (allow_empty or bool(x)) and all(text(v) for v in x) and len(set(x)) == len(x)

def period(p):
    exact(p, ('start', 'end'), 'PERIOD_SCHEMA')
    for v in p.values():
        require(isinstance(v,str) and datetime.date.fromisoformat(v).isoformat() == v, 'PERIOD_DATE')
    require(p['start'] <= p['end'], 'PERIOD_ORDER')

def scope(s):
    exact(s, SCOPE_FIELDS, 'SCOPE_SCHEMA')
    require(s['ticker'] in TICKERS, 'UNSUPPORTED_TICKER')
    require(s['ticker'] != 'MBB', 'MBB_DEFERRED')
    period(s['period'])
    require(s['frame'] in ('ANNUAL', 'QUARTER', 'YTD', 'INSTANT'), 'UNSUPPORTED_PERIOD_FRAME')
    require(s['statementType'] in ('BALANCE_SHEET', 'INCOME_STATEMENT', 'CASH_FLOW', 'NOTES', 'FINANCIAL_STATEMENTS'), 'STATEMENT_TYPE')
    require(s['consolidation'] in ('CONSOLIDATED', 'STANDALONE'), 'CONSOLIDATION_SCOPE')
    require(unique_strings(s['metrics'],allow_empty=True) and s['metrics'] == sorted(s['metrics']), 'METRIC_SCOPE_REQUIRED_SORTED_UNIQUE')
    require(text(s['sourceVersion']), 'SOURCE_VERSION_REQUIRED')

def load_reference(root, reference):
    require(text(reference) and '#' in reference,'BUNDLE_REFERENCE_REQUIRED')
    path,pointer=reference.split('#',1)
    relative=Path(path);target=(Path(root)/relative).resolve()
    require(not relative.is_absolute() and '..' not in relative.parts and target.is_relative_to(Path(root).resolve()),'BUNDLE_REFERENCE_ESCAPE')
    require(pointer.startswith('/'),'BUNDLE_JSON_POINTER')
    node=json.loads(target.read_text())
    for key in pointer[1:].split('/'):
        key=key.replace('~1','/').replace('~0','~');node=node[int(key)] if isinstance(node,list) else node[key]
    return node

def admission_id(core):
    return 'pec2-admission-sha256:' + digest({'candidateId':core['pec1Candidate']['candidateId'], 'evidenceHash':digest(core), 'datasetScope':core['datasetScope']})

def decision_binding(record):
    """Immutable admission event target; excludes result/status/timestamps and event refs."""
    return digest({k:record[k] for k in ('admissionId','candidateId','evidenceHash','datasetScope','admissionRestrictions','ownerApprovalReference')})

def verify_file_pins(root, value):
    """Rehash exact local bytes and resolve exact JSON Pointers. No source network IO."""
    count = 0
    if isinstance(value, dict):
        if 'path' in value and 'sha256' in value:
            require(isinstance(value['path'],str), 'EVIDENCE_PATH')
            relative=Path(value['path'])
            require(not relative.is_absolute() and '..' not in relative.parts, 'EVIDENCE_PATH_ESCAPE')
            target=(Path(root)/relative).resolve()
            require(target.is_relative_to(Path(root).resolve()), 'EVIDENCE_PATH_ESCAPE')
            require(sha256(value['sha256']) and hashlib.sha256(target.read_bytes()).hexdigest()==value['sha256'], 'EVIDENCE_BYTES_CHANGED:'+value['path'])
            if value.get('pointer'):
                require(value['pointer'].startswith('/'), 'JSON_POINTER')
                node=json.loads(target.read_text())
                for key in value['pointer'][1:].split('/'):
                    key=key.replace('~1','/').replace('~0','~')
                    node=node[int(key)] if isinstance(node,list) else node[key]
            count += 1
        else:
            for v in value.values(): count += verify_file_pins(root,v)
    elif isinstance(value,list):
        for v in value: count += verify_file_pins(root,v)
    return count

def _evaluate(record, core, receipts, inventory, now, trust, root):
    failures=[]
    def gate(code, fn):
        try: fn()
        except (ValueError, TypeError, KeyError, IndexError, AttributeError, OSError, OverflowError) as e:
            failures.append(code+':'+str(e))
    at=instant(now)
    gate('CONTRACT',lambda:exact(record,RECORD_FIELDS,'RECORD_EXACT_FIELDS'))
    exact(core,CORE_FIELDS,'EVIDENCE_CORE_SCHEMA')
    require(core['contract']=='pec2-evidence-core-v1','CORE_CONTRACT')
    c=core['pec1Candidate']
    s=core['datasetScope']
    def contract():
        require(record['contract']=='pec2-source-admission-v1','RECORD_CONTRACT')
        require(record['evidenceHash']==digest(core),'EVIDENCE_HASH_CHANGED')
        require(record['admissionId']==admission_id(core),'ADMISSION_ID_BINDING')
        require(record['candidateId']==c['candidateId'],'CANDIDATE_SUBSTITUTION')
        require(load_reference(root,record['evidenceBundleReference'])==core,'EVIDENCE_BUNDLE_REFERENCE_SUBSTITUTION')
        require(record['evidenceHash']==digest(core),'EVIDENCE_HASH_CHANGED')
        require(text(record['evidenceBundleReference']) and unique_strings(record['auditReferences']),'AUDIT_REFERENCE_REQUIRED')
        require(record['admissionStatus'] in STATES,'STATUS_ENUM')
        require(record['revocationStatus'] in ('UNKNOWN','NOT_REVOKED','REVOKED'),'REVOCATION_ENUM')
        require(record['admissionTimestamp'] is None,'CALLER_ADMISSION_TIMESTAMP_FORBIDDEN')
        require(record['validationResult']=='PENDING_EVALUATION','CALLER_VALIDATION_CANNOT_GRANT_AUTHORITY')
        require(unique_strings(record['admissionRestrictions'],allow_empty=True),'RESTRICTIONS_SCHEMA')
        require(record['publisherIdentity']==core['publisherIdentity'] and text(core['publisherIdentity']),'INVALID_PUBLISHER_IDENTITY')
        require(record['sourceIdentity']==core['sourceIdentity'] and record['documentIdentity']==core['documentIdentity'],'IDENTITY_SUBSTITUTION')
        require(record['datasetScope']==s and record['tickerCoverage']==[s['ticker']] and record['reportingPeriods']==[s['period']] and record['statementType']==s['statementType'] and record['financialMetricCoverage']==s['metrics'],'DATASET_SCOPE_SUBSTITUTION')
        require(record['publicationTimestamp']==core['publication']['publishedAt'] and record['knowledgeCutoff']==core['knowledge']['systemKnownAt'],'CLOCK_SUBSTITUTION')
    gate('RECORD_BINDING',contract)
    gate('SCOPE',lambda:scope(s))
    def identities():
        src=core['sourceIdentity'];doc=core['documentIdentity']
        exact(src,('sourceURL','sourceHash','sourceVersion'),'SOURCE_IDENTITY_SCHEMA')
        require(text(src['sourceURL']) and src['sourceURL'].startswith('https://') and sha256(src['sourceHash']) and src['sourceVersion']==s['sourceVersion'],'SOURCE_IDENTITY')
        exact(doc,('path','sha256','publisherIdentity','ticker','period','consolidation','reportType'),'DOCUMENT_IDENTITY_SCHEMA')
        period(doc['period'])
        require(sha256(doc['sha256']) and text(doc['path']) and doc['publisherIdentity']==core['publisherIdentity'] and doc['ticker']==s['ticker'] and doc['period']['start']<=s['period']['start'] and s['period']['end']<=doc['period']['end'] and doc['consolidation']==s['consolidation'] and text(doc['reportType']),'DOCUMENT_IDENTITY')
        original_ref=c['evidencePins']['candidate'];verify_file_pins(root,original_ref)
        original=load_reference(root,original_ref['path']+'#'+original_ref['pointer'])
        body=original['body']
        require(original['candidateId']==c['candidateId'] and original['sha256']==c['candidateSha256']==digest(body),'ORIGINAL_CANDIDATE_HASH')
        require(body['issuer']==core['publisherIdentity'] and body['ticker']==s['ticker'] and body['source']['sourceURL']==src['sourceURL'] and body['source']['sourceSha256']==src['sourceHash'] and body['source']['documentPath']==doc['path'] and body['source']['documentSha256']==doc['sha256'] and body['sourceContract']['economicPeriod']==doc['period'] and body['sourceContract']['reportingScope']==doc['consolidation'] and doc['reportType'] in body['sourceContract']['allowedDocumentTypes'],'ORIGINAL_PUBLISHER_SOURCE_DOCUMENT_IDENTITY')
        pub=core['publication'];method=body['publicationMethod']
        require(pub['date']==method['expectedDate'] and pub['precision']==method['precision'] and pub['publishedAt']==method['publishedAt'] and pub['timezone']==method['timezone'],'ORIGINAL_PUBLICATION_IDENTITY')
        require(c['ticker']==s['ticker'] and c['period']==doc['period'] and c['publisherIdentity']==core['publisherIdentity'],'PEC1_IDENTITY_SCOPE')
        require(bool(core['evidencePins']),'EVIDENCE_PINS_REQUIRED')
        require(verify_file_pins(root,core['evidencePins'])>0,'PROVENANCE_REQUIRED')
        document_path=(Path(root)/doc['path']).resolve()
        require(not Path(doc['path']).is_absolute() and '..' not in Path(doc['path']).parts and document_path.is_relative_to(Path(root).resolve()),'DOCUMENT_PATH_ESCAPE')
        require(hashlib.sha256(document_path.read_bytes()).hexdigest()==doc['sha256'],'DOCUMENT_BYTES_CHANGED')
        # The exact document pin must occur in provenance; no replacement document.
        require(any(p.get('path')==doc['path'] and p.get('sha256')==doc['sha256'] for p in c['evidencePins']['provenance']),'DOCUMENT_NOT_BOUND_TO_PEC1')
        require(src['sourceURL']==c['sourceName'] and any(p.get('sha256')==src['sourceHash'] for p in c['evidencePins']['provenance']),'SOURCE_NOT_BOUND_TO_PEC1')
    gate('IDENTITY_PROVENANCE',identities)
    def pec1():
        require(c['ownerReceipt'] is None,'IMMUTABLE_CANDIDATE_CANNOT_CONTAIN_APPROVAL')
        approved_candidate=dict(c,ownerReceipt=receipts['ownerApproval'])
        result=pec1_evaluate(approved_candidate,[approved_candidate],now,trust.get('ownerReceipts',{}))
        require(result['effectiveState'] in ('APPROVED','APPROVED_WITH_RESTRICTIONS'),'PEC1_NOT_APPROVED:'+','.join(result['blockers']))
        a=receipts['ownerApproval']
        require(a['admissionEvidenceHash']==digest(core),'OWNER_EVIDENCE_BINDING')
        require(a['approvedScope']==s,'OWNER_SCOPE_EXPANSION')
        require(a['sourceVersion']==s['sourceVersion'],'OWNER_SOURCE_VERSION')
        require(instant(a['decisionAt'])<=instant(core['knowledge']['boundaries']['sourceContractKnownAt']) and instant(a['effectiveFrom'])<=instant(core['knowledge']['systemKnownAt']),'OWNER_APPROVAL_AFTER_KNOWLEDGE_CUTOFF')
        require(a['restrictions']==record['admissionRestrictions'],'OWNER_RESTRICTIONS_SUBSTITUTION')
        require(record['ownerApprovalReference']==a['approvalEvidenceReference'],'OWNER_REFERENCE')
    gate('PEC1_OWNER',pec1)
    def publication_and_knowledge():
        pub=core['publication'];k=core['knowledge']
        exact(pub,('status','precision','date','publishedAt','timezone','boundary'),'PUBLICATION_SCHEMA')
        require(pub['status']=='VERIFIED','UNVERIFIED_PUBLICATION')
        day=datetime.date.fromisoformat(pub['date'])
        if pub['precision']=='DATE_ONLY':
            require(pub['publishedAt'] is None and pub['timezone']=='Asia/Ho_Chi_Minh','DATE_ONLY_PRECISION')
            boundary=datetime.datetime.combine(day+datetime.timedelta(days=1),datetime.time(),ZoneInfo(pub['timezone']))
        else:
            require(pub['precision']=='TIMESTAMP','PUBLICATION_PRECISION')
            boundary=instant(pub['publishedAt'])
            require(boundary.astimezone(ZoneInfo(pub['timezone'])).date()==day,'PUBLICATION_LOCAL_DATE')
        require(boundary==instant(pub['boundary']),'PUBLICATION_BOUNDARY')
        require(boundary<=at,'FUTURE_PUBLICATION')
        exact(k,('boundaries','clockEvidence','otherRequiredContractBoundaries','systemKnownAt','decisionAsOf'),'KNOWLEDGE_SCHEMA')
        exact(k['boundaries'],CLOCKS,'ALL_KNOWLEDGE_BOUNDARIES_REQUIRED')
        require(instant(k['boundaries']['publicationBoundary'])==boundary,'KNOWLEDGE_PUBLICATION_BINDING')
        require(isinstance(k['otherRequiredContractBoundaries'],list),'REQUIRED_OTHER_KNOWLEDGE_UNKNOWN')
        exact(k['clockEvidence'],CLOCKS,'KNOWLEDGE_EVIDENCE_REQUIRED')
        for field in CLOCKS:
            proof=k['clockEvidence'][field];verify_file_pins(root,proof)
            require(load_reference(root,proof['path']+'#'+proof['pointer'])==k['boundaries'][field],'KNOWLEDGE_EVIDENCE_SUBSTITUTION')
        clocks=[instant(v) for v in k['boundaries'].values()]
        for event in k['otherRequiredContractBoundaries']:
            exact(event,('id','at','evidenceReference'),'KNOWLEDGE_EVENT_SCHEMA')
            require(text(event['id']) and text(event['evidenceReference']),'KNOWLEDGE_EVENT_REFERENCE')
            clocks.append(instant(event['at']))
        require(len({e['id'] for e in k['otherRequiredContractBoundaries']})==len(k['otherRequiredContractBoundaries']),'DUPLICATE_KNOWLEDGE_EVENT')
        require(max(clocks)<=instant(k['systemKnownAt'])<=instant(k['decisionAsOf'])<=at,'KNOWLEDGE_CUTOFF_VIOLATION')
        require(datetime.date.fromisoformat(s['period']['end'])<=instant(k['decisionAsOf']).astimezone(ZoneInfo('Asia/Ho_Chi_Minh')).date(),'FUTURE_ECONOMIC_PERIOD')
    gate('PUBLICATION_KNOWLEDGE',publication_and_knowledge)
    def acceptance(kind,role):
        r=receipts[kind]
        require(r is not None and trust.get(kind,{}).get(c['candidateId'])==digest(r),'AUTHENTICATED_ACCEPTANCE_MISSING')
        exact(r,('candidateId','evidenceHash','scope','result','reviewerIdentity','producerIdentity','role','acceptedAt','reference'),'ACCEPTANCE_SCHEMA')
        require(r['candidateId']==c['candidateId'] and r['evidenceHash']==digest(core) and r['scope']==s,'ACCEPTANCE_SCOPE_OR_HASH')
        require(r['result']=='PASS' and r['role']==role,'ACCEPTANCE_FAILED')
        require(text(r['reviewerIdentity']) and text(r['producerIdentity']) and r['reviewerIdentity']!=r['producerIdentity'] and r['reviewerIdentity'] not in ('Codex','AI Portfolio Manager') and text(r['reference']),'INDEPENDENT_REVIEWER_REQUIRED')
        require(instant(r['acceptedAt'])<=instant(core['knowledge']['systemKnownAt']),'ACCEPTANCE_AFTER_KNOWLEDGE_CUTOFF')
    def mappings():
        require(bool(s['metrics']),'FINANCIAL_METRIC_COVERAGE_MISSING')
        acceptance('mappingAcceptance','Data Quality Owner')
        rows=core['financialMappings']
        require(isinstance(rows,list) and len(rows)==len(s['metrics']),'MAPPING_COVERAGE')
        require(sorted(r['metric'] for r in rows)==s['metrics'],'FINANCIAL_MAPPING_MISMATCH')
        for row in rows:
            exact(row,('metric','mappingId','mappingHash','sourceVersion','documentHash','ticker','period','consolidation','statementType','evidenceReference'),'MAPPING_SCHEMA')
            verify_file_pins(root,row['evidenceReference'])
            evidence=row['evidenceReference'];node=json.loads((Path(root)/evidence['path']).read_text())
            for key in (evidence['pointer'][1:].split('/') if evidence['pointer'] else []):
                key=key.replace('~1','/').replace('~0','~');node=node[int(key)] if isinstance(node,list) else node[key]
            require(digest(node)==row['mappingHash'],'MAPPING_BYTES_CHANGED')
            require(node['canonicalConcept']==row['metric'] and node['period']==row['period'] and node['scope']==row['consolidation'] and bool(node['sourceCells']) and all(cell['documentSha256']==row['documentHash'] for cell in node['sourceCells']),'SOURCE_MAPPING_SEMANTICS_MISMATCH')
            require(text(row['mappingId']) and sha256(row['mappingHash']) and row['sourceVersion']==s['sourceVersion'] and row['documentHash']==core['documentIdentity']['sha256'] and row['ticker']==s['ticker'] and row['period']==s['period'] and row['consolidation']==s['consolidation'] and row['statementType']==s['statementType'],'FINANCIAL_MAPPING_IDENTITY')
    gate('FINANCIAL_MAPPING',mappings)
    gate('INDEPENDENT_ACCEPTANCE',lambda:acceptance('independentAcceptance','Independent Validator'))
    def conflicts():
        require(isinstance(inventory,list) and all(isinstance(r,dict) and set(('admissionId','candidateId','datasetScope'))<=set(r) for r in inventory),'INVENTORY_SCHEMA')
        require(sum(r['admissionId']==record['admissionId'] for r in inventory)==1,'DUPLICATE_ADMISSION')
        for other in inventory:
            if other['admissionId']==record['admissionId']:continue
            os=other['datasetScope']
            if (os['ticker'],os['statementType'],os['consolidation'])==(s['ticker'],s['statementType'],s['consolidation']) and os['period']['start']<=s['period']['end'] and s['period']['start']<=os['period']['end'] and set(os['metrics'])&set(s['metrics']):
                raise ValueError('CONFLICTING_AUTHORITY_NO_LATEST_WINS')
    gate('INVENTORY',conflicts)
    revoked=False
    def revocation():
        nonlocal revoked
        rev=trust.get('revocationSnapshot')
        require(rev is not None,'REVOCATION_STATUS_UNKNOWN')
        exact(rev,('asOf','validThrough','revokedCandidateIds','revokedAdmissionIds','revokedApprovalHashes'),'REVOCATION_SCHEMA')
        require(instant(rev['asOf'])<=at<instant(rev['validThrough']),'REVOCATION_CHECK_STALE')
        for field in ('revokedCandidateIds','revokedAdmissionIds','revokedApprovalHashes'):
            require(unique_strings(rev[field],allow_empty=True),'REVOCATION_LIST')
        revoked=(c['candidateId'] in rev['revokedCandidateIds'] or record['admissionId'] in rev['revokedAdmissionIds'] or digest(receipts.get('ownerApproval')) in rev['revokedApprovalHashes'])
        require(not revoked,'AUTHORITY_REVOKED')
    gate('REVOCATION',revocation)
    if record.get('revocationStatus')=='REVOKED':revoked=True
    state='DEFERRED'
    admitted_at=None
    if revoked:state='REVOKED'
    elif failures:state='REJECTED' if any(f.startswith(('RECORD_BINDING:','CONTRACT:','SCOPE:','IDENTITY_PROVENANCE:','INVENTORY:')) for f in failures) else 'DEFERRED'
    else:
        state='ELIGIBLE'
        event=receipts.get('admissionEvent')
        if event is not None:
            def admission():
                nonlocal state,admitted_at
                require(trust.get('admissionEvents',{}).get(record['admissionId'])==digest(event),'EXPLICIT_AUTHENTICATED_ADMISSION_REQUIRED')
                exact(event,('admissionId','decisionBindingHash','actorIdentity','role','at','reference'),'ADMISSION_EVENT_SCHEMA')
                require(event['admissionId']==record['admissionId'] and event['decisionBindingHash']==decision_binding(record) and text(event['actorIdentity']) and event['actorIdentity'] not in ('Codex','AI Portfolio Manager') and event['role']=='Investment System Owner' and text(event['reference']),'ADMISSION_EVENT_SCOPE')
                ready_at=max(instant(receipts['ownerApproval']['decisionAt']),instant(receipts['ownerApproval']['effectiveFrom']),instant(receipts['mappingAcceptance']['acceptedAt']),instant(receipts['independentAcceptance']['acceptedAt']),*[instant(v) for v in core['knowledge']['boundaries'].values()],*[instant(e['at']) for e in core['knowledge']['otherRequiredContractBoundaries']])
                require(ready_at<=instant(event['at'])<=at,'ADMISSION_EVENT_CLOCK')
                state='RESTRICTED' if record['admissionRestrictions'] else 'ADMITTED';admitted_at=event['at']
            gate('ADMISSION_EVENT',admission)
            if failures:state='DEFERRED';admitted_at=None
    return {'recommendedAdmissionState':'REVOKED' if revoked else 'DEFERRED' if failures else 'ELIGIBLE',
            'effectiveAdmissionState':state,'validationResult':'FAIL' if failures else 'PASS',
            'blockers':sorted(set(failures)),'admissionTimestamp':admitted_at,'revocationStatus':'REVOKED' if revoked else 'UNKNOWN' if any(f.startswith('REVOCATION:') for f in failures) else 'NOT_REVOKED',
            'productionUseAuthorized':False,'runtimeActivationAuthorized':False,'scoringAuthorized':False}

def evaluate(record, core, receipts, inventory, now, *, trust=None, root):
    """Total fail-closed boundary for untrusted/malformed inputs; no production effects."""
    try:
        return _evaluate(record,core,receipts,inventory,now,trust or {},root)
    except (ValueError,TypeError,KeyError,IndexError,AttributeError,OSError,OverflowError) as e:
        return {'recommendedAdmissionState':'DEFERRED','effectiveAdmissionState':'REJECTED','validationResult':'FAIL','blockers':['MALFORMED_INPUT:'+str(e)],'admissionTimestamp':None,'revocationStatus':'UNKNOWN','productionUseAuthorized':False,'runtimeActivationAuthorized':False,'scoringAuthorized':False}

def check_consumption(record, core, receipts, inventory, request, now, *, trust=None, root):
    """Offline proposed adapter boundary. Every use re-evaluates revocation/evidence.
    Allowed means only within this specification; production authorization stays false.
    """
    result=evaluate(record,core,receipts,inventory,now,trust=trust,root=root)
    reasons=list(result['blockers'])
    try:
        exact(request,('ticker','period','frame','statementType','consolidation','metric','sourceVersion','publicationDate','systemKnownAt','action'),'CONSUMPTION_SCHEMA')
        s=core['datasetScope']
        require(result['effectiveAdmissionState'] in ('ADMITTED','RESTRICTED'),'EFFECTIVE_ADMISSION_REQUIRED')
        require(request['action']=='FUNDAMENTAL_EVIDENCE_REVIEW','UNAUTHORIZED_ACTIVATION')
        require(all(request[k]==s[k] for k in ('ticker','period','frame','statementType','consolidation','sourceVersion')) and request['metric'] in s['metrics'],'SCOPE_EXPANSION')
        require(request['publicationDate']==core['publication']['date'] and request['systemKnownAt']==core['knowledge']['systemKnownAt'],'CONSUMPTION_CUTOFF_SUBSTITUTION')
    except (ValueError,TypeError,KeyError) as e:reasons.append(str(e))
    return {'withinOfflineAdmissionScope':not reasons,'blockers':sorted(set(reasons)), 'productionUseAuthorized':False,'runtimeActivationAuthorized':False,'scoringAuthorized':False}
