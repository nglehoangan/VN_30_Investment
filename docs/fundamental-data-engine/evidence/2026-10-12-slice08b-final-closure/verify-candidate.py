"""Independent deterministic audit replay; writes only temporary results."""
import hashlib,json,pathlib,shutil,subprocess,tempfile
BASE=pathlib.Path(__file__).resolve().parent;ROOT=BASE.parents[3]
node=shutil.which('node');version=subprocess.check_output([node,'--version'],text=True).strip();numbers=tuple(map(int,version[1:].split('.')))
assert (22,23,2)<=numbers<(23,0,0),'Supported Node 22 runtime required'
read=lambda p:json.loads(pathlib.Path(p).read_text())
for r in read(BASE/'FINAL_SLICE8_REPLAY.json')['inputs']:
 assert hashlib.sha256((ROOT/r['path']).read_bytes()).hexdigest()==r['sha256'],r['path']
if (BASE/'ARTIFACT_HASHES.json').exists():
 for r in read(BASE/'ARTIFACT_HASHES.json')['artifacts']:
  assert hashlib.sha256((BASE/r['file']).read_bytes()).hexdigest()==r['sha256'],r['file']
with tempfile.TemporaryDirectory(prefix='vn30-final-independent-',dir='/private/tmp') as work:
 out=pathlib.Path(work)
 subprocess.run([node,str(BASE/'replay-snapshot.mjs'),str(out/'snapshot.json')],cwd=ROOT,check=True)
 subprocess.run(['python3',str(BASE/'build-candidate.py'),'--reverse','--output',str(out)],cwd=ROOT,check=True)
 replay=read(out/'snapshot.json');expected=read(BASE/'SNAPSHOT_REPLAY.json')
 assert replay==expected
 for name in ['FINAL_READINESS_MATRIX.json','FINAL_DI_GATE_MATRIX.json','FINAL_SLICE8_EXIT_GATE.json','SLICE8_REQUIREMENT_BOUNDARY.json','FINAL_REQUIRED_PATH_PIT_CLOSURE.json','FINAL_CONFLICT_CLOSURE.json','FINAL_MISSING_FACT_AUDIT.json','FINAL_FRESHNESS_AUDIT.json','FINAL_DERIVATION_READINESS.json','BANK_SPECIFIC_CASA_NPL_MAPPING.json']:
  assert read(out/name)==read(BASE/name),name
 pit=read(BASE/'FINAL_REQUIRED_PATH_PIT_CLOSURE.json');assert pit['unsafeSelected']==0
 rows=read(BASE/'FINAL_READINESS_MATRIX.json')['rows'];assert len(rows)==30 and len({r['securityId'] for r in rows})==30
 paths=read(BASE/'SLICE8_REQUIREMENT_BOUNDARY.json')['paths'];assert len(paths)==1401 and len({r['requirementId'] for r in paths})==1401
 assert read(BASE/'FINAL_SLICE8_EXIT_GATE.json')['slice8ClosureRecommendation'] in ['NOT_READY','READY_FOR_INDEPENDENT_DI14_REVIEW']
 print('PASS: exact snapshot identity, selected facts, numeric artifact, reversed-input boundary/readiness/DI/exit audits; unsafeSelected=0')
