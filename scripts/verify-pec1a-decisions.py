"""Read-only PEC-1A packet integrity/qualification checks; never human acceptance."""
import datetime
import hashlib
import json
import sqlite3
from pathlib import Path
from lib.pe4_evidence import digest, sha, next_day, verify_seal, replay_package

ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'docs/fundamental-data-engine/evidence'
OUT=E/'2026-10-23-pec1a-authenticated-source-authority-decision'

def read(p):return json.loads(p.read_text())
def require(ok,message):
    if not ok:raise ValueError(message)
def pointer(node,p):
    for token in p.split('/')[1:]:
        token=token.replace('~1','/').replace('~0','~')
        node=node[int(token)] if isinstance(node,list) else node[token]
    return node

def main():
    matrix=read(OUT/'CANDIDATE_DECISION_MATRIX.json');cases=matrix['candidates'];gaps=read(OUT/'EVIDENCE_GAP_RESOLUTION.json')
    counts={'fileReferenceChecks':0,'jsonPointerChecks':0,'mappingReceipts':0,'sourceOperands':0,'recoveredLeads':0}
    cache={};json_cache={}
    def check_references(node):
        if isinstance(node,dict):
            if isinstance(node.get('path'),str) and 'sha256' in node:
                p=(ROOT/node['path']).resolve();require(p.is_relative_to(ROOT),'REFERENCE_OUTSIDE_REPOSITORY')
                if p not in cache:cache[p]=sha(p)
                require(cache[p]==node['sha256'],'REFERENCE_HASH:'+str(p));counts['fileReferenceChecks']+=1
                if 'nodeSha256' in node:
                    if p not in json_cache:json_cache[p]=read(p)
                    require(digest(pointer(json_cache[p],node['pointer']))==node['nodeSha256'],'NODE_HASH:'+str(p)+node['pointer']);counts['jsonPointerChecks']+=1
            for value in node.values():check_references(value)
        elif isinstance(node,list):
            for value in node:check_references(value)
    for p in OUT.glob('*.json'):
        if p.name not in ['ARTIFACT_HASHES.json','EVIDENCE_SEAL.json']:check_references(read(p))
    require(len(cases)==len({c['candidateId'] for c in cases})==8,'EIGHT_CANDIDATES')
    require(matrix['status']=='PARTIALLY_READY' and matrix['recommendationsAreNotOwnerDecisions'],'STATUS_OR_DECISION_CONFLATION')
    for c in cases:
        require(c['recommendedDecision']=='DEFER','UNSUPPORTED_AUTHORITY_RECOMMENDATION')
        require(all(c[k] is None for k in ['authenticatedOwnerDecision','ownerIdentity','decisionTimestamp']),'SYNTHETIC_OWNER_DECISION')
        require(c['effectiveProductionAdmission'] is False and c['independentAcceptance']['currentlySatisfies'] is False,'UNSUPPORTED_ACCEPTANCE_OR_ADMISSION')
        source=pointer(read(ROOT/c['references']['candidate']['path']),c['references']['candidate']['pointer'])
        require(digest(source['body'])==source['sha256']==c['candidateHash'],'CANDIDATE_BODY')
        body=source['body'];scope=c['exactApprovalScope'];s=body['source']
        require((scope['ticker'],scope['issuer'],scope['documentPeriod'],scope['consolidation'],scope['documentHash'],scope['sourceCaptureHash'])==(body['ticker'],body['issuer'],body['sourceContract']['economicPeriod'],body['sourceContract']['reportingScope'],s['documentSha256'],s['sourceSha256']),'SCOPE_EXPANSION')
        for name,component in scope['sourceComponents'].items():require(component['proposalContentHash']==digest(body[name]) and component['approvalState']=='PENDING','COMPONENT_APPROVAL')
        pub=c['publicationEvidence'];loc=pub['locator'];text=(ROOT/s['sourcePath']).read_text();snippet=text[loc['start']:loc['endExclusive']]
        require(hashlib.sha256(snippet.encode()).hexdigest()==pub['exactLocatorTextSha256'] and pub['dateLiteral'] in snippet,'PUBLICATION_LOCATOR')
        require(pub['precision']=='DATE_ONLY' and pub['publishedAt'] is None and pub['conservativeBoundary']==next_day(pub['date']),'INVENTED_PUBLICATION_CLOCK')
        knowledge=pointer(read(ROOT/c['references']['knowledge']['path']),c['references']['knowledge']['pointer'])
        require(c['knowledgeEvidence']['boundaries']==knowledge['boundaries'] and c['knowledgeEvidence']['actualCutoffs']==knowledge['actualDatasetCutoffs'],'KNOWLEDGE_SUBSTITUTION')
        require(c['knowledgeEvidence']['complete'] is False,'UNSUPPORTED_KNOWLEDGE')
        for gate,v in c['gateQualification'].items():require(v['state']==('PASS' if gate in ['G1','G2','G4'] else 'PENDING'),'GATE_PROMOTION')
        require(len(c['decisionTypes'])==7 and {a['decisionType'] for a in c['decisionTypes']}==set(range(1,8)),'DECISIONS_COMBINED')
        facts=c['financialMappingCoverage']['facts'];require(len(facts)==len(scope['financialFactScopes'])==c['financialMappingCoverage']['mappedObligations'],'FACT_SCOPE')
        for m,sc in zip(facts,scope['financialFactScopes']):
            r=m['reference'];original=pointer(read(ROOT/r['path']),r['pointer'])
            require(m['receiptHash']==digest(original),'MAPPING_RECEIPT')
            require((m['metric'],m['canonicalValue'],m['period'],m['scope'],m['normalization'])==(original['canonicalConcept'],original['canonicalValue'],original['period'],original['scope'],original['normalization']),'FINANCIAL_MUTATION')
            require(sc['receiptHash']==m['receiptHash'] and sc['period']==m['period'] and sc['scope']==m['scope'] and sc['metric']==m['metric'],'FACT_APPROVAL_SCOPE')
            require(m['humanAccepted'] is False,'SYNTHETIC_MAPPING_ACCEPTANCE');counts['mappingReceipts']+=1
            for cell,old in zip(m['sourceCells'],original['sourceCells']):
                require(all(cell[k]==old[k] for k in ['cellId','reportedValue','nativeUnit','physicalPage','box','pdfPath']),'SOURCE_CELL_MUTATION');counts['sourceOperands']+=1
        for lead in c['recoveredRetainedEvidenceLeads']:
            n=lead['retainedRecord'];require(n['sourceHash']==s['documentSha256'],'RECOVERED_SOURCE_MISMATCH')
            require(digest(n)==lead['reference']['nodeSha256'],'RECOVERED_LEAD_MUTATION');counts['recoveredLeads']+=1
        require(not c['financialMappingCoverage']['independentlyHumanAccepted'],'SYNTHETIC_HUMAN_ACCEPTANCE')
    require((counts['mappingReceipts'],counts['sourceOperands'])==(45,51),'MAPPING_COUNTS')
    lead_counts={c['caseId']:len(c['recoveredRetainedEvidenceLeads']) for c in cases}
    require(lead_counts['HPG-2025-12-31']==7 and lead_counts['VJC-2025-12-31']==16 and lead_counts['SSB-2026-06-30']==2,'RECOVERED_COUNTS')
    queue=gaps['outsideScopeWorkQueue'];require(len(queue)==len({x['obligationIndex'] for x in queue})==171,'OUTSIDE_QUEUE')
    require(sum(x['exactVietstockBytesAlreadyRetained'] for x in queue)==73,'RETAINED_QUEUE')
    require(len(gaps['records'])==56,'MISSING_DECISION_GAPS')
    require(all(x['closesExactSourceAuthorityGap'] is False for x in read(OUT/'RELATED_APPROVALS_SCOPE_CHECK.json')['records']),'RELATED_APPROVAL_EXPANDED')
    protected=read(OUT/'PROTECTED_INPUT_HASHES.json')
    for path,expected in protected.items():require(sha(ROOT/path)==expected,'PREEXISTING_INPUT_CHANGED:'+path)
    actual={str(p.relative_to(ROOT)) for folder in [ROOT/'data',ROOT/'src',E] for p in folder.rglob('*') if p.is_file() and OUT not in p.parents and '__pycache__' not in p.parts}
    require(actual.issubset(set(protected)),'UNEXPECTED_PROTECTED_TREE_FILE')
    db=read(OUT/'DATABASE_LOOKUP.json');require(sha(ROOT/'data/vn30.sqlite')==db['databaseSha256'],'DATABASE_BYTES_CHANGED')
    con=sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro',uri=True)
    require(digest(list(con.iterdump()))==db['logicalDumpSha256'],'DATABASE_LOGICAL_CHANGE');con.close()
    seals=[verify_seal(ROOT,ROOT/x['package']) for x in read(OUT/'PRIOR_SEAL_VERIFICATION.json')]
    replay=replay_package(ROOT);require(replay==read(OUT/'PE4_EVIDENCE_REPLAY.json'),'PE4_REPLAY_CHANGED')
    validations=read(OUT/'VALIDATION_RESULTS.json')
    require(all(x['effectiveAdmissionState']=='DEFERRED' and not x['productionUseAuthorized'] for x in validations['PEC2EvidenceOnlyEvaluations']),'EFFECTIVE_ADMISSION')
    require(validations['productionScoringExecuted'] is False,'SCORING_EXECUTED')
    seal=verify_seal(ROOT,OUT)
    result={'status':'PASS_TECHNICAL_VERIFICATION_NOT_INDEPENDENT_HUMAN_ACCEPTANCE','verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'command':'PYTHONDONTWRITEBYTECODE=1 python3 scripts/verify-pec1a-decisions.py','checks':counts,'recoveredLeadCounts':lead_counts,'candidateRecommendations':{'DEFER':8},'ownerDecisions':0,'effectiveAdmissions':0,'priorSeals':len(seals),'protectedFilesUnchanged':len(protected),'packetSeal':seal,'productionScoringExecuted':False,'PEC3Started':False}
    target=OUT/'validation';target.mkdir(exist_ok=True);(target/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
