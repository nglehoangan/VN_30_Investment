"""Read-only PEC-1C safety/integrity verification, no human approval."""
import argparse
import ast
import datetime
import json
import sqlite3
from pathlib import Path
from lib.pe4_evidence import sha, digest, replay_package, verify_seal
from lib.pec1b_workflow import pec2_preparation_boundary, EVENT_FIELDS, ROLES
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/fundamental-data-engine/evidence';OUT=E/'2026-10-23-pec1c-authenticated-trusted-capture'

def read(p):return json.loads(p.read_text())
def require(ok,message):
    if not ok:raise ValueError(message)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--require-seal',action='store_true');args=parser.parse_args()
    baseline=read(OUT/'PROTECTED_INPUT_HASHES.json')
    for path,expected in baseline.items():require(sha(ROOT/path)==expected,'PREEXISTING_INPUT_CHANGED:'+path)
    baseline_data={p for p in baseline if p.startswith('data/')}
    require(baseline_data=={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file() and '__pycache__' not in p.parts},'NEW_OR_MISSING_DATA_FILE')
    old_evidence={p for p in baseline if p.startswith('docs/fundamental-data-engine/evidence/')}
    require(old_evidence=={str(p.relative_to(ROOT)) for p in E.rglob('*') if p.is_file() and OUT not in p.parents and '__pycache__' not in p.parts},'PREEXISTING_EVIDENCE_NAMESPACE_CHANGED')
    db=read(OUT/'DATABASE_BASELINE.json');require(sha(ROOT/'data/vn30.sqlite')==db['sha256'],'DB_BYTES_CHANGED')
    con=sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro',uri=True);con.row_factory=sqlite3.Row
    require(digest(list(con.iterdump()))==db['logicalHash'],'DB_LOGICAL_CHANGE')
    counts={n:con.execute('select count(*) from "'+n+'"').fetchone()[0] for n in db['tableCounts']}
    require(counts==db['tableCounts'],'DB_COUNTS_CHANGED')
    methods=[dict(r) for r in con.execute('select * from methodology_record')];require(methods==db['methodologyRows'],'OWNER_OR_METHODOLOGY_APPROVALS_CHANGED')
    require(not con.execute("select 1 from methodology_record where configuration_reference like 'source-publication-authority-sha256:%' or configuration_reference like 'd2-source-identity-sha256:%'").fetchall(),'SOURCE_AUTHORITY_CREATED');con.close()
    prior=read(OUT/'PRIOR_EVIDENCE_VERIFICATION.json');seals=[verify_seal(ROOT,ROOT/s['package']) for s in prior['seals']]
    require(seals==prior['seals'],'PRIOR_SEALS_CHANGED');replay=replay_package(ROOT);require(replay==prior['PE4Replay'],'PRIOR_EVIDENCE_REPLAY_CHANGED')
    for pin in read(OUT/'INSPECTION_INPUTS.json')['files']:require(sha(ROOT/pin['path'])==pin['sha256'],'ARCHITECTURE_INPUT_CHANGED')
    pec2=E/'2026-10-23-production-evidence-closure-pec2';records=read(pec2/'ADMISSION_CANDIDATES.json')['records'];bundles=read(pec2/'EVIDENCE_BUNDLES.json')['bundles']
    now=datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z');evaluations=[]
    for record in records:
        bundle=next(b for b in bundles if b['core']['pec1Candidate']['candidateId']==record['candidateId'])
        r=pec2_preparation_boundary(record,bundle['core'],bundle['receipts'],records,now,root=ROOT)
        require(r['PEC2Result']['effectiveAdmissionState']=='DEFERRED','CANDIDATE_NOT_DEFERRED')
        require(all(r[k] is False for k in ['qualifiedEvidenceExported','productionUseAuthorized','runtimeActivationAuthorized','scoringAuthorized']),'ACTIVATION_ENABLED');evaluations.append({'candidateId':record['candidateId'],**r})
    require(len(evaluations)==8,'CANDIDATE_COUNT')
    a=read(E/'2026-10-23-pec1a-authenticated-source-authority-decision/CANDIDATE_DECISION_MATRIX.json')
    require(all(c['authenticatedOwnerDecision'] is None and c['effectiveProductionAdmission'] is False for c in a['candidates']),'PEC1A_OWNER_OR_ADMISSION_CHANGED')
    schema=read(E/'2026-10-23-pec1b-prospective-evidence-workflow/FORMAL_KNOWLEDGE_EVENT.schema.json');require(set(schema['required'])==EVENT_FIELDS and set(schema['properties'])==EVENT_FIELDS,'FORMAL_EVENT_FIELDS')
    require(set(schema['properties']['eventType']['enum'])==set(ROLES),'EVENT_TYPES')
    test=read(OUT/'validation/security-tests.json');compat=read(OUT/'validation/pec2-regressions.json');prep=read(OUT/'validation/pec1b-regressions.json')
    require(test['testsRun']==31 and test['success'] and test['failures']==test['errors']==0,'PEC1C_SECURITY_TEST_FAILURE')
    require(compat['testsRun']==62 and compat['success'] and compat['failureAssertions']==compat['errors']==0,'PEC2_REGRESSION')
    require(prep['testsRun']==25 and prep['success'] and prep['failures']==prep['errors']==0,'PEC1B_REGRESSION')
    require('PASS boundaries:' in (OUT/'validation/architecture-boundaries.log').read_text(),'ARCHITECTURE_BOUNDARY_FAILURE')
    code=(ROOT/'scripts/lib/pec1c_capture.py').read_text();tree=ast.parse(code)
    require(not any(isinstance(n,ast.Import) and any(a.name in ['subprocess','socket','requests'] for a in n.names) for n in ast.walk(tree)),'UNEXPECTED_PRODUCTION_OR_NETWORK_IO')
    require(not any(p.name.endswith('.bin') for p in OUT.rglob('*')),'REAL_OR_SYNTHETIC_EVENT_EVIDENCE_WRITTEN_IN_PACKAGE')
    require(not any(x['name']=='formal_knowledge_audit' for x in db['schemaObjects']),'UNEXPECTED_PRODUCTION_AUDIT_INSTALLATION')
    for name in ['pec1c_capture.py']:
        require('test-pec1c' not in (ROOT/'scripts/lib'/name).read_text(),'FIXTURE_IMPORTED_BY_IMPLEMENTATION')
    if args.require_seal:verify_seal(ROOT,OUT)
    result={'status':'PASS_TECHNICAL_SAFETY_NOT_HUMAN_ACCEPTANCE','command':'PYTHONDONTWRITEBYTECODE=1 python3 scripts/verify-pec1c-capture.py'+(' --require-seal' if args.require_seal else ''),'verifiedAt':now,'protectedFilesUnchanged':len(baseline),'priorSealsVerified':len(seals),'databaseBytesLogicalDumpCountsUnchanged':True,'ownerApprovalsUnchanged':True,'frozenPoliciesUnchanged':True,'candidateStates':{'DEFERRED':8},'effectiveSourceAdmissions':0,'qualifiedEventsCreated':0,'realCandidatePreparationsCreated':0,'productionScoringExecuted':False,'D2Activated':False,'newSourceAcquisitions':0,'PEC3Started':False,'PEC2Evaluations':evaluations,'tests':{'PEC1C':test['testsRun'],'PEC1B':prep['testsRun'],'PEC2V2':compat['testsRun'],'total':test['testsRun']+compat['testsRun']+prep['testsRun']},'authenticationReadiness':'BLOCKED_NO_CONFIGURED_REAL_PROVIDER','auditSchemaInstalledInProduction':False,'PEC1DStarted':False,'formalDatasetReadiness':'BLOCKED','independentAcceptanceReadiness':'BLOCKED','packetSealChecked':args.require_seal}
    (OUT/'validation/safety-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='PEC2Evaluations'},indent=2))

if __name__=='__main__':main()
