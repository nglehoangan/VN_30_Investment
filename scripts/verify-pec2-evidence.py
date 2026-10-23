"""Read-only current PEC-2 packet, scope, dependency and production integrity replay."""
import json
import os
import subprocess
from pathlib import Path
from lib.pe4_evidence import sha, replay_package
from lib.pec1_authority import digest
from lib.pec2_admission import evaluate, verify_file_pins, admission_id
# Preparation main is guarded; imported helpers perform only read-only snapshots.
import importlib.util
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('pec2_prepare',ROOT/'scripts/prepare-pec2-evidence.py')
prepare=importlib.util.module_from_spec(spec);spec.loader.exec_module(prepare)
P=prepare.OUT

def read(n):return json.loads((P/n).read_text())
def require(ok,why):
    if not ok:raise ValueError(why)

def main():
    require(sha(P/'ARTIFACT_HASHES.json')==read('EVIDENCE_SEAL.json')['artifactHashesSha256'],'INVENTORY_CHANGED')
    inv=read('ARTIFACT_HASHES.json')
    for f,h in inv['files'].items():require(sha(P/f)==h,'PACKET_CHANGED:'+f)
    for f,h in inv['implementationPins'].items():require(sha(ROOT/f)==h,'IMPLEMENTATION_CHANGED:'+f)
    before=read('BASELINE_PINS.json');require(prepare.protected_snapshot()==before,'PROTECTED_INPUTS_CHANGED_OR_ADDED')
    require(prepare.database_snapshot()==read('DATABASE_BASELINE.json'),'DATABASE_CHANGED')
    env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1')
    prior=subprocess.run(['python3','scripts/verify-pec1-evidence.py'],cwd=ROOT,env=env,capture_output=True,text=True)
    require(prior.returncode==0,'PEC1_DEPENDENCY_INTEGRITY_FAILED:'+prior.stderr)
    require(replay_package(ROOT)==read('PE4_CURRENT_REPLAY.json'),'PE4_CURRENT_REPLAY_CHANGED')
    a=read('ADMISSION_CANDIDATES.json');bundles=read('EVIDENCE_BUNDLES.json')['bundles'];records=a['records']
    original=json.loads((prepare.P1/'OWNER_DECISION_REGISTER.json').read_text())['records']
    require(len(records)==len(bundles)==len(original)==8,'CANDIDATE_COUNT')
    require(read('TRUST_BOUNDARY.json')['realTrustConfiguration']=={},'UNAUTHORIZED_TRUST_CONFIGURATION')
    outcomes=[]
    for r,b,c in zip(records,bundles,original):
        core=b['core'];require(core['pec1Candidate']==c,'PEC1_CANDIDATE_CHANGED')
        require(r['candidateId']==c['candidateId'] and r['admissionId']==admission_id(core),'IDENTITY_CHANGED')
        require(b['bundleId']=='pec2-evidence-sha256:'+digest(core)== 'pec2-evidence-sha256:'+r['evidenceHash'],'EVIDENCE_DIGEST')
        require(all(v is None for v in b['receipts'].values()),'UNAUTHENTICATED_RECEIPTS')
        require(r['ownerApprovalReference'] is None and r['admissionTimestamp'] is None,'FALSE_APPROVAL_OR_ADMISSION')
        verify_file_pins(ROOT,core['evidencePins'])
        for m in core['financialMappings']:verify_file_pins(ROOT,m['evidenceReference'])
        result=evaluate(r,core,b['receipts'],records,a['evaluatedAt'],trust={},root=ROOT)
        require(result['effectiveAdmissionState']=='DEFERRED' and not result['productionUseAuthorized'],'EFFECTIVE_ADMISSION_FORBIDDEN')
        outcomes.append(result)
    require(outcomes==a['evaluations'],'EVALUATION_CHANGED')
    require(read('FINAL_STATUS.json')['status']=='IMPLEMENTATION_READY_DEPENDENCY_BLOCKED','STATUS_CHANGED')
    print(json.dumps({'status':'PASS','PEC1Dependency':'BLOCKED','sourceAuthorityCandidates':8,'effectiveAdmissions':0,'productionUseAuthorized':False,'protectedInputFilesVerified':len(before),'evidenceReplayDeterministic':True,'databaseUnchanged':True,'priorPEC1AndPE4Replayed':True},indent=2))
if __name__=='__main__':main()
