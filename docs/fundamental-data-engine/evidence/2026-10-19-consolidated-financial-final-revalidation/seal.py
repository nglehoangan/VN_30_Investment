"""Verify candidate partition and source immutability, then seal this review package."""
import ast,hashlib,json
from pathlib import Path
from datetime import datetime,timezone
P=Path(__file__).resolve().parent;R=P.parents[3]
def read(n):return json.loads((P/n).read_text())
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def sha(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
required=['README.md','DATASET_IDENTITY.json','DATASET_SCHEMA_REVIEW.json','PROVENANCE_REVIEW.json','ALL30_LEVEL1_REVALIDATION.json','PREVIOUSLY_CLOSED_REGRESSION_REVIEW.json','VNM_REVALIDATION.json','TCX_REVALIDATION.json','MBB_REVALIDATION.json','VIB_REVALIDATION.json','VIC_REVALIDATION.json','CONFLICT_REVIEW.json','NEW_MATERIAL_GAPS.json','CANDIDATE_PARTITION.json','PROMOTION_CANDIDATES.json','TEST_RESULTS.json','FINAL_REVIEW.md','ARTIFACT_HASHES.json']
t=read('TEST_RESULTS.json');new=[]
def check(n,ok,detail=None):new.append({'test':n,'status':'PASS' if ok else 'FAIL','detail':detail})
check('requestedEvidenceFilesPresent',all((P/n).is_file() for n in required if n!='ARTIFACT_HASHES.json'))
part=read('CANDIDATE_PARTITION.json');obs=read('ALL30_LEVEL1_REVALIDATION.json');check('partitionMatchesEveryMandatoryObservation',all((r['ticker'] in part['LEVEL1_CLOSED_CANDIDATE'])==all(o['status'] in ['QUALIFIED','ZERO_REPORTED','NOT_APPLICABLE'] for o in r['mandatoryObservations']) for r in obs['tickers']))
conf=read('CONFLICT_REVIEW.json');check('noRetainedUnresolvedIssuerConflicts',not any(r['unresolvedIssuerConflicts'] for r in conf['retainedAdmissionConflictAudit']))
for f in P.glob('*.py'):ast.parse(f.read_text())
check('reviewHelpersParse',True)
before=read('PROTECTED_INPUTS.json')['before'];after={str(p.relative_to(R)):sha(p) for p in sorted((R/'data').rglob('*')) if p.is_file()};changes=[p for p in before.keys()|after.keys() if before.get(p)!=after.get(p)]
check('finalDataTreeUnchangedAfterAllAudits',not changes,changes)
readonly=read('READ_ONLY_RESULT.json');readonly['finalAuditChangedPaths']=changes;readonly['finalAuditProtectedFiles']=len(after);readonly['finalAuditAt']=datetime.now(timezone.utc).isoformat();save('READ_ONLY_RESULT.json',readonly)
oldnames={r['test'] for r in new};t['tests']=[r for r in t['tests'] if r['test'] not in oldnames]+new;t['status']='PASS' if all(r['status']=='PASS' for r in t['tests']) else 'FAIL';save('TEST_RESULTS.json',t)
assert t['status']=='PASS', t
files=[{'path':str(p.relative_to(P)),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(P.rglob('*')) if p.is_file() and p.name!='ARTIFACT_HASHES.json']
save('ARTIFACT_HASHES.json',{'schemaVersion':'evidence-sha256-seal-v1','createdAt':datetime.now(timezone.utc).isoformat(),'selfExcluded':True,'requestedArtifacts':required,'files':files,'fileCountExcludingSeal':len(files),'productionChanged':False})
print(json.dumps({'status':t['status'],'tests':len(t['tests']),'protectedFiles':len(after),'changedDataFiles':len(changes),'sealedFiles':len(files),'candidateCounts':[part['LEVEL1_CLOSED_CANDIDATE_COUNT'],part['DEFERRED_CANDIDATE_COUNT']]}))
