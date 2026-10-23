"""Read-only replay of the PEC-1 register and protected inputs."""
import json
from pathlib import Path
from lib.pe4_evidence import replay_package, sha
from lib.pec1_authority import digest, evaluate
ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1'
def read(n): return json.loads((P/n).read_text())
def check(ok,reason):
    if not ok: raise ValueError(reason)
def pins(x):
    if isinstance(x,dict):
        if 'path' in x and 'sha256' in x:
            p=(ROOT/x['path']).resolve();check(p.is_relative_to(ROOT),'PATH_ESCAPE')
            check(sha(p)==x['sha256'],'EVIDENCE_CHANGED:'+x['path'])
            if x.get('pointer'):
                v=json.loads(p.read_text())
                for key in x['pointer'].strip('/').split('/'):
                    key=key.replace('~1','/').replace('~0','~');v=v[int(key)] if isinstance(v,list) else v[key]
        else:
            for v in x.values(): pins(v)
    elif isinstance(x,list):
        for v in x:pins(v)
def main():
    for path,h in read('BASELINE_PINS.json').items():check(sha(ROOT/path)==h,'PROTECTED_INPUT_CHANGED:'+path)
    check(replay_package(ROOT)==read('PE4_CURRENT_REPLAY.json'),'PE4_CHANGED')
    register=read('OWNER_DECISION_REGISTER.json'); records=register['records']
    source=json.loads((ROOT/'docs/fundamental-data-engine/evidence/2026-10-22-primary-publication-evidence-pe3/AUTHORITY_APPROVAL_CANDIDATES.json').read_text())['candidates']
    check(len(records)==len(source)==8,'CANDIDATE_COUNT')
    for r,c in zip(records,source):
        check(r['candidateId']==c['candidateId'] and r['candidateSha256']==digest(c['body'])==c['sha256'],'CANDIDATE_BINDING')
        pins(r['evidencePins']); check(digest(r['evidencePins'])==r['evidenceBundleHash'],'BUNDLE_HASH')
        check(all(r[k] is None for k in ['ownerDecision','ownerIdentity','decisionTimestamp','ownerReceipt']),'UNAUTHENTICATED_OWNER_FIELDS')
        check(r['recommendedState']==r['proposedDecision']=='DEFERRED','UNSUPPORTED_RECOMMENDATION')
        check(evaluate(r,records,register['preparedAt'])==r['evaluation'],'EVALUATION_CHANGED')
        check(not r['evaluation']['productionAccess'],'PRODUCTION_ACCESS')
    check(sha(P/'ARTIFACT_HASHES.json')==read('EVIDENCE_SEAL.json')['artifactHashesSha256'],'PEC1_INVENTORY_CHANGED')
    for filename,h in read('ARTIFACT_HASHES.json')['implementationPins'].items():check(sha(ROOT/filename)==h,'IMPLEMENTATION_CHANGED:'+filename)
    for filename,h in read('ARTIFACT_HASHES.json')['files'].items():check(sha(P/filename)==h,'PEC1_FILE_CHANGED:'+filename)
    print(json.dumps({'status':'PASS','candidates':8,'effectiveApprovals':0,'protectedInputFilesVerified':len(read('BASELINE_PINS.json')),'PE4Replayed':True,'ownerAuthentication':'NONE_SUPPLIED','productionAccess':False},indent=2))
if __name__=='__main__':main()
