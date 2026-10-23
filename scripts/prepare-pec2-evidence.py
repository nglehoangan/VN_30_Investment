"""PEC-2 non-production previews. No source acquisition, DB writes or approval intake."""
import datetime
import json
import os
import sqlite3
import subprocess
from pathlib import Path
from lib.pe4_evidence import sha, replay_package
from lib.pec1_authority import digest, evaluate as pec1_evaluate
from lib.pec2_admission import evaluate, admission_id, CLOCKS, verify_file_pins, RECORD_FIELDS, STATES

ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'docs/fundamental-data-engine/evidence'
P1=E/'2026-10-22-production-evidence-closure-pec1'
P3=E/'2026-10-22-primary-publication-evidence-pe3'
P4=E/'2026-10-22-primary-publication-evidence-pe4'
OUT=E/'2026-10-23-production-evidence-closure-pec2'
IMPLEMENTATIONS=['scripts/lib/pec2_admission.py','scripts/prepare-pec2-evidence.py','scripts/test-pec2-admission.py','scripts/verify-pec2-evidence.py']
def read(p):return json.loads(p.read_text())
def write(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def ref(p,pointer=''):return {'path':str(p.relative_to(ROOT)),'sha256':sha(p),'pointer':pointer}
def protected_snapshot():
    paths=list((ROOT/'data').rglob('*'))+list((ROOT/'src').rglob('*'))+list(E.rglob('*'))
    paths += [ROOT/'AGENTS.md',ROOT/'package.json',ROOT/'pnpm-lock.yaml',ROOT/'docs/fundamental-data-engine/issuer-sources.json',ROOT/'docs/fundamental-data-engine/issuer-document-routes.json',ROOT/'docs/fundamental-data-engine/VIETSTOCK_ONLY_SOURCE_POLICY.md']
    return {str(p.relative_to(ROOT)):sha(p) for p in paths if p.is_file() and OUT not in p.parents and '__pycache__' not in p.parts}
def database_snapshot():
    c=sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro',uri=True);c.row_factory=sqlite3.Row
    tables=[r[0] for r in c.execute("select name from sqlite_master where type='table' order by name")]
    result={'sha256':sha(ROOT/'data/vn30.sqlite'),'logicalHash':digest(list(c.iterdump())),
       'counts':{t:c.execute('select count(*) from "'+t+'"').fetchone()[0] for t in tables},
       'methodologyRecords':[dict(r) for r in c.execute('select * from methodology_record')],
       'exactSourceAuthorityRecords':[dict(r) for r in c.execute("select * from methodology_record where configuration_reference like 'source-publication-authority-sha256:%' or configuration_reference like 'd2-source-identity-sha256:%'")]}
    c.close();return result

def main():
    if (OUT/'ADMISSION_CANDIDATES.json').exists():raise SystemExit('Refuse overwrite of existing PEC-2 packet; append a separately reviewed version.')
    OUT.mkdir(parents=True,exist_ok=True);(OUT/'validation').mkdir(exist_ok=True)
    now=datetime.datetime.now(datetime.timezone.utc).isoformat()
    write('BASELINE_PINS.json',protected_snapshot());write('DATABASE_BASELINE.json',database_snapshot())
    env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1')
    r=subprocess.run(['python3','scripts/verify-pec1-evidence.py'],cwd=ROOT,env=env,capture_output=True,text=True)
    write('PEC1_VERIFICATION.json',{'command':'PYTHONDONTWRITEBYTECODE=1 python3 scripts/verify-pec1-evidence.py','exitCode':r.returncode,'stdout':r.stdout,'stderr':r.stderr})
    if r.returncode:raise SystemExit('PEC-1 integrity verification failed; blocked before preparation.')
    write('PE4_CURRENT_REPLAY.json',replay_package(ROOT))
    candidates=read(P1/'OWNER_DECISION_REGISTER.json')['records']
    approval=read(P3/'AUTHORITY_APPROVAL_CANDIDATES.json')['candidates']
    knowledge=read(P4/'KNOWLEDGE_CLOSURE.json')['records']
    cells=read(P4/'SOURCE_CELL_INDEPENDENT_REVIEW.json')['reviews']
    write('DEPENDENCY_STATUS.json',{'status':'BLOCKED','PEC1Status':read(P1/'FINAL_STATUS.json')['status'],
       'PEC1Register':ref(P1/'OWNER_DECISION_REGISTER.json'),'PEC1Seal':ref(P1/'EVIDENCE_SEAL.json'),
       'authenticatedOwnerApprovals':0,'authenticatedAdmissionInstructions':0,'effectiveSourceAdmissions':0,
       'reason':'All eight PEC-1 recommendations are DEFERRED; owner approval fields remain null. Implementing PEC-2 is not approval of PEC-1.',
       'evaluations':[{'candidateId':c['candidateId'],'evaluation':pec1_evaluate(c,candidates,now)} for c in candidates],
       'currentIndependentHumanAcceptance':0,'preparationOnly':True})
    bundles=[];records=[]
    for index,c in enumerate(candidates):
        a=next(a['body'] for a in approval if a['candidateId']==c['candidateId'])
        k=next(k for k in knowledge if k['disclosureId']==c['disclosureId'])
        selected=[(j,r) for j,r in enumerate(cells) if r['body']['obligationIndex'] in c['mappedObligationIndices']]
        report_type=a['sourceContract']['allowedDocumentTypes'][0]
        frame='ANNUAL' if report_type=='AUDITED_CONSOLIDATED_ANNUAL_FINANCIAL_STATEMENTS' else 'YTD'
        # Explicit report-level proposal, not financial approval. Keep per-mapping periods unchanged.
        s={'ticker':c['ticker'],'period':c['period'],'frame':frame,'statementType':'FINANCIAL_STATEMENTS',
           'consolidation':a['sourceContract']['reportingScope'],'metrics':sorted({r['body']['canonicalConcept'] for _,r in selected}),'sourceVersion':c['candidateId']}
        mapping=[]
        for j,r in selected:
            b=r['body'];mapping.append({'metric':b['canonicalConcept'],'mappingId':r['reviewId'],'mappingHash':r['sha256'],
              'sourceVersion':s['sourceVersion'],'documentHash':a['source']['documentSha256'],'ticker':c['ticker'],
              'period':b['period'],'consolidation':b['scope'],'statementType':'FINANCIAL_STATEMENTS',
              'evidenceReference':ref(P4/'SOURCE_CELL_INDEPENDENT_REVIEW.json',f'/reviews/{j}/body')})
        pub=k['boundaries']['publicationBoundary']
        core={'contract':'pec2-evidence-core-v1','pec1Candidate':c,'publisherIdentity':c['publisherIdentity'],
           'sourceIdentity':{'sourceURL':a['source']['sourceURL'],'sourceHash':a['source']['sourceSha256'],'sourceVersion':s['sourceVersion']},
           'documentIdentity':{'path':a['source']['documentPath'],'sha256':a['source']['documentSha256'],'publisherIdentity':c['publisherIdentity'],'ticker':c['ticker'],'period':c['period'],'consolidation':s['consolidation'],'reportType':report_type},
           'datasetScope':s,'publication':{'status':'VERIFIED','precision':a['publicationMethod']['precision'],'date':a['publicationMethod']['expectedDate'],'publishedAt':a['publicationMethod']['publishedAt'],'timezone':a['publicationMethod']['timezone'],'boundary':pub},
           'knowledge':{'boundaries':{name:k['boundaries'][name] for name in CLOCKS},'clockEvidence':{name:ref(P4/'KNOWLEDGE_CLOSURE.json',f'/records/{knowledge.index(k)}/boundaries/{name}') for name in CLOCKS},'otherRequiredContractBoundaries':k['boundaries']['otherRequiredContractBoundaries'],'systemKnownAt':k['actualDatasetCutoffs']['systemKnownAt'],'decisionAsOf':k['actualDatasetCutoffs']['decisionAsOf']},
           'financialMappings':mapping,'evidencePins':{'pec1Register':ref(P1/'OWNER_DECISION_REGISTER.json',f'/records/{index}'),'pec1Evidence':c['evidencePins'],'knowledge':ref(P4/'KNOWLEDGE_CLOSURE.json',f'/records/{knowledge.index(k)}'),
                 'implementationPolicy':ref(ROOT/'src/domain/fundamentals/d2-policy-candidate-v1.json')}}
        receipts={'ownerApproval':None,'mappingAcceptance':None,'independentAcceptance':None,'admissionEvent':None}
        record={'contract':'pec2-source-admission-v1','admissionId':admission_id(core),'candidateId':c['candidateId'],
           'ownerApprovalReference':None,'evidenceBundleReference':str((OUT/'EVIDENCE_BUNDLES.json').relative_to(ROOT))+f'#/bundles/{index}/core',
           'evidenceHash':digest(core),'publisherIdentity':core['publisherIdentity'],'sourceIdentity':core['sourceIdentity'],'documentIdentity':core['documentIdentity'],'datasetScope':s,
           'tickerCoverage':[c['ticker']],'reportingPeriods':[s['period']],'statementType':s['statementType'],'financialMetricCoverage':s['metrics'],
           'publicationTimestamp':core['publication']['publishedAt'],'knowledgeCutoff':core['knowledge']['systemKnownAt'],
           'admissionRestrictions':c['restrictions'],'admissionStatus':'DEFERRED','validationResult':'PENDING_EVALUATION','admissionTimestamp':None,'revocationStatus':'UNKNOWN',
           'auditReferences':[str((P1/'OWNER_DECISION_REGISTER.json').relative_to(ROOT))+f'#/records/{index}',str((OUT/'DEPENDENCY_STATUS.json').relative_to(ROOT))]}
        assert set(record)==RECORD_FIELDS
        bundles.append({'bundleId':'pec2-evidence-sha256:'+digest(core),'core':core,'receipts':receipts})
        records.append(record)
    write('EVIDENCE_BUNDLES.json',{'schemaVersion':'pec2-bundle-set-v1','bundles':bundles})
    evaluations=[evaluate(r,b['core'],b['receipts'],records,now,trust={},root=ROOT) for r,b in zip(records,bundles)]
    assert all(e['effectiveAdmissionState']=='DEFERRED' and not e['productionUseAuthorized'] for e in evaluations),evaluations
    write('EVIDENCE_BUNDLES.json',{'schemaVersion':'pec2-bundle-set-v1','bundles':bundles})
    write('ADMISSION_CANDIDATES.json',{'schemaVersion':'pec2-admission-preview-set-v1','evaluatedAt':now,'records':records,'evaluations':evaluations})
    write('EVIDENCE_BINDING_RESULTS.json',{'status':'INTEGRITY_VERIFIED_NOT_ACCEPTED','candidates':len(records),
       'bindings':[{'candidateId':r['candidateId'],'admissionId':r['admissionId'],'evidenceHash':r['evidenceHash'],'verifiedFileReferenceOccurrences':verify_file_pins(ROOT,b['core']['evidencePins']),
         'proposedMetricCount':len(r['financialMetricCoverage']),'mappingPeriodsPreserved':True,'approvedMappings':0} for r,b in zip(records,bundles)],'immutablePriorAmountsChanged':False})
    write('TRUST_BOUNDARY.json',{'realTrustConfiguration':{},'productionAdapterInstalled':False,'authorityWriteEndpointInstalled':False,
       'externalAuthenticationRequired':['Exact PEC-1 owner receipt digest per candidate','Data Quality Owner acceptance digest','Independent Validator acceptance digest','Fresh authoritative revocation snapshot','Separate owner admission event digest per admission ID'],
       'authentication':'Trust is independently authenticated composition, never a request field, local PASS boolean or hash derived from submitted evidence. Empty trust is the only real configuration in this packet.',
       'testFixtures':'Synthetic sources, identities, receipts and trust exist only in temporary test directories. They are never stored in data/ or authority registries.'})
    write('FINAL_STATUS.json',{'status':'IMPLEMENTATION_READY_DEPENDENCY_BLOCKED','PEC1Dependency':'BLOCKED','recommendedDeferred':8,'effectiveDeferred':8,'effectiveSourceAdmissions':0,'ownerApproved':False,'productionUseAuthorized':False,'productionScoring':'BLOCKED_NOT_EXECUTED','D2Activated':False,'nextStep':'Owner review and authenticated PEC-1 evidence required. Stop after PEC-2; PEC-3 not authorized.'})

if __name__=='__main__':main()
