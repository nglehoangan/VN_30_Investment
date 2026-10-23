"""Read-only final review verifier; legacy target bytes and seals remain intact."""
import importlib.util
import json
import os
import subprocess
from pathlib import Path
from lib.pe4_evidence import sha, replay_package
from lib.pec1_authority import digest
from lib.pec2_admission_v2 import evaluate, verify_file_pins, EVALUATOR_VERSION

ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'docs/fundamental-data-engine/evidence'
P=E/'2026-10-23-pec2-final-implementation-review'
OLD=E/'2026-10-23-production-evidence-closure-pec2'
TARGET='cceffa32439b2acdb448f2175520178fd8d87d46'
spec=importlib.util.spec_from_file_location('legacy_pec2_prepare',ROOT/'scripts/prepare-pec2-evidence.py')
legacy=importlib.util.module_from_spec(spec);spec.loader.exec_module(legacy)
def read(p):return json.loads(p.read_text())
def require(ok,why):
    if not ok:raise ValueError(why)
def snapshot():
    pins=legacy.protected_snapshot()
    for p in OLD.rglob('*'):
        if p.is_file():pins[str(p.relative_to(ROOT))]=sha(p)
    prefix=str(P.relative_to(ROOT))+'/'
    return {p:h for p,h in pins.items() if not p.startswith(prefix)}
def original_seal():
    require(sha(OLD/'ARTIFACT_HASHES.json')==read(OLD/'EVIDENCE_SEAL.json')['artifactHashesSha256'],'ORIGINAL_PEC2_INVENTORY_CHANGED')
    inv=read(OLD/'ARTIFACT_HASHES.json')
    for f,h in inv['files'].items():require(sha(OLD/f)==h,'ORIGINAL_PEC2_ARTIFACT_CHANGED:'+f)
    for f,h in inv['implementationPins'].items():require(sha(ROOT/f)==h,'ORIGINAL_IMPLEMENTATION_CHANGED:'+f)

def main():
    seal=read(P/'EVIDENCE_SEAL.json')
    require(sha(P/'ARTIFACT_HASHES.json')==seal['artifactHashesSha256'],'FINAL_REVIEW_INVENTORY_CHANGED')
    inventory=read(P/'ARTIFACT_HASHES.json')
    for f,h in inventory['files'].items():require(sha(P/f)==h,'FINAL_REVIEW_FILE_CHANGED:'+f)
    for f,h in inventory['implementationPins'].items():require(sha(ROOT/f)==h,'REVIEW_IMPLEMENTATION_CHANGED:'+f)
    commit=read(P/'COMMIT_INVENTORY.json')
    require(commit['targetCommit']==TARGET,'TARGET_SUBSTITUTED')
    require(subprocess.check_output(['git','rev-parse',TARGET+'^'],cwd=ROOT,text=True).strip()==commit['parentCommit'],'PARENT_SUBSTITUTED')
    for f in commit['files']:
        original=subprocess.check_output(['git','show',TARGET+':'+f['path']],cwd=ROOT)
        import hashlib
        require(hashlib.sha256(original).hexdigest()==f['sha256']==sha(ROOT/f['path']),'TARGET_BYTES_CHANGED:'+f['path'])
    escalation=read(P/'REPEATED_BLOCKER_ESCALATION.json')['existingGlobalRegister']
    require(sha(ROOT/escalation['path'])==escalation['sha256'],'GLOBAL_ESCALATION_REGISTER_CHANGED')
    original_seal()
    current_snapshot=snapshot()
    require(current_snapshot==read(P/'BASELINE_PINS.json'),'PREEXISTING_INPUTS_CHANGED_OR_UNEXPECTED_ADDITIONS')
    require(legacy.database_snapshot()==read(P/'DATABASE_BASELINE.json'),'DATABASE_CHANGED')
    require(replay_package(ROOT)==read(OLD/'PE4_CURRENT_REPLAY.json'),'PE4_CURRENT_REPLAY_CHANGED')
    original=read(OLD/'ADMISSION_CANDIDATES.json');bundles=read(OLD/'EVIDENCE_BUNDLES.json')['bundles']
    now=read(P/'REVIEW_BASELINE.json')['evaluatedAt'];outcomes=[]
    for r,b in zip(original['records'],bundles):
        verify_file_pins(ROOT,b['core']['evidencePins'])
        result=evaluate(r,b['core'],b['receipts'],original['records'],now,trust={},root=ROOT)
        require(result['effectiveAdmissionState']=='DEFERRED' and not result['productionUseAuthorized'],'UNAUTHORIZED_EFFECTIVE_ADMISSION')
        outcomes.append({'admissionId':r['admissionId'],'evaluation':result})
    require(outcomes==read(P/'CURRENT_CANDIDATE_RESULTS.json')['records'],'V2_EVALUATION_CHANGED')
    require(read(P/'validation/v2-results.json')['success'],'V2_REGRESSIONS_NOT_PASSING')
    native={r['name']:r for r in read(P/'NATIVE_TEST_RESULTS.json')['commands']}
    require(all(native[n]['exitCode']==0 for n in ('typecheck','build','boundaries')),'NATIVE_REQUIRED_CHECK_FAILED')
    def failures(result):
        return {(r['name'].split('/VN_30_Investment/')[-1],t.get('fullName','')) for r in result['testResults'] for t in r.get('assertionResults',[]) if t['status']=='failed'}
    previous=read(E/'2026-10-22-primary-publication-evidence-pe4/validation/full-results.json')
    current=read(P/'validation/full-results.json')
    require(failures(current)==failures(previous) and len(failures(current))==18,'UNEXPLAINED_FULL_SUITE_REGRESSION')
    require(native['lint']['exitCode']==1 and '1 problem (0 errors, 1 warning)' in (P/'validation/lint.log').read_text() and 'verify-engineering.mjs' in (P/'validation/lint.log').read_text(),'LINT_BASELINE_CHANGED')
    require(read(P/'FINAL_STATUS.json')['status']=='IMPLEMENTATION_READY_DEPENDENCY_BLOCKED','UNSUPPORTED_FINAL_STATUS')
    print(json.dumps({'status':'PASS','targetCommit':TARGET,'targetFilesVerified':len(commit['files']),'preexistingProtectedFilesVerified':len(current_snapshot),'evaluator':EVALUATOR_VERSION,'effectiveAdmissions':0,'PEC1Dependency':'BLOCKED','databaseUnchanged':True,'originalPEC2SealAndImplementationUnchanged':True,'productionUseAuthorized':False},indent=2))
if __name__=='__main__':main()
