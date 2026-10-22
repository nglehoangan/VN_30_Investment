from pathlib import Path
import json,hashlib,sys,importlib.util,sqlite3
P=Path(__file__).resolve().parent;R=P.parents[3];H=lambda b:hashlib.sha256(b).hexdigest()
def load(p):return json.loads(Path(p).read_text())
sys.path.insert(0,str(R/'scripts'))
spec=importlib.util.spec_from_file_location('coverage_replay',R/'scripts/recalculate-vietstock-coverage.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
a=load(P/'MINIMUM_DATASET_SOURCE_COVERAGE.json');b=module.recalculate();assert a['summary']==b['summary'] and a['obligations']==b['obligations'] and a['byIssuer']==b['byIssuer']
base=load(P/'BASELINE.json');assert {str(f.relative_to(R)):H(f.read_bytes()) for f in (R/'data').rglob('*') if f.is_file()}==base['protectedDataFiles']
for p,h in base['priorPE1Files'].items():assert H((R/p).read_bytes())==h
for name in ['issuer-sources.json','issuer-document-routes.json']:
 text=(R/'docs/fundamental-data-engine'/name).read_text();assert all(k not in text for k in ['issuerDiscoveryUrl','officialDiscoveryUrl','issuerSourceVerification'])
 def walk(x):
  if isinstance(x,dict):
   for v in x.values():walk(v)
  elif isinstance(x,list):
   for v in x:walk(v)
  elif isinstance(x,str) and x.startswith(('https://','http://')):module.require_vietstock_url(x)
 walk(json.loads(text))
update=load(P/'ESCALATION_UPDATE.json');assert H((R/update['path']).read_bytes())==update['afterSha256'];reg=load(R/update['path']);assert next(i for i in reg['issues'] if i['issueId']=='PRIMARY_PUBLICATION_EVIDENCE')==update['updatedIssue']
c=sqlite3.connect('file:'+str(R/'data/vn30.sqlite')+'?mode=ro',uri=True);assert H('\n'.join(c.iterdump()).encode())==base['logicalSha256'];assert c.execute('pragma integrity_check').fetchone()[0]=='ok';c.close()
if (P/'ARTIFACT_HASHES.json').exists():
 hashes=load(P/'ARTIFACT_HASHES.json')
 for name,h in hashes['files'].items():assert H((P/name).read_bytes())==h,name
 for name,h in hashes['implementationPins'].items():assert H((R/name).read_bytes())==h,name
 assert load(P/'EVIDENCE_SEAL.json')['artifactHashesSha256']==H((P/'ARTIFACT_HASHES.json').read_bytes())
print(json.dumps({'status':'PASS','coverageReplayed':a['summary'],'allCurrentURLsVietstockOnly':True,'priorPE1Untouched':True,'dataFilesUnchanged':len(base['protectedDataFiles']),'databaseIntegrity':'PASS','sealed':(P/'ARTIFACT_HASHES.json').exists()}))
