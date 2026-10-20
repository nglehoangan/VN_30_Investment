"""Fresh/populated disposable migration + actual approved bundle CAS replay; production remains read-only."""
import importlib.util,json,os,pathlib,sqlite3,subprocess,tempfile,shutil
R=pathlib.Path.cwd();P=R/'docs/fundamental-data-engine/evidence/2026-10-20-production-authority-final-activation';NODE='/private/tmp/node-v22.23.2-darwin-arm64/bin/node'
spec=importlib.util.spec_from_file_location('state',P/'inspect-state.py');state=importlib.util.module_from_spec(spec);spec.loader.exec_module(state)
baseline=json.loads((P/'BASELINE_IDENTITY.json').read_text());assert state.sha((R/'data/vn30.sqlite').read_bytes())==baseline['databaseSHA256']
directory=pathlib.Path(tempfile.mkdtemp(prefix='final-authority-migration-'));results={}
try:
 populated=directory/'populated.sqlite';src=sqlite3.connect('file:data/vn30.sqlite?mode=ro',uri=True);dst=sqlite3.connect(populated);src.backup(dst);dst.close();src.close();populated.chmod(0o600)
 for label,target in [('fresh',directory/'fresh.sqlite'),('populated',populated)]:
  before=state.inspect(target) if target.exists() else None;logs=[]
  for command in ['migrate','status','migrate','status']:
   r=subprocess.run([NODE,'scripts/database.mjs',command,'--no-env-file'],cwd=R,env={**os.environ,'DATABASE_URL':'file:'+str(target)},capture_output=True,text=True,timeout=75);logs.append(r.stdout+r.stderr);assert r.returncode==0,(label,command,r.returncode)
  migrated=state.inspect(target)
  if before:
   assert all(v==migrated['tables'][k] for k,v in before['tables'].items() if k!='_prisma_migrations');assert all(v==migrated['schemaObjects'][k] for k,v in before['schemaObjects'].items())
  r=subprocess.run([NODE,str(P/'activate-authority.mjs'),str(target),'--disposable'],cwd=R,capture_output=True,text=True,timeout=75);logs.append(r.stdout+r.stderr);assert r.returncode==0,(label,r.stdout,r.stderr)
  after=state.inspect(target);allowed={'methodology_record','market_boundary_record','market_boundary_dependency_head','dependency_object_identity','dependency_release'};changed=[k for k,v in migrated['tables'].items() if v!=after['tables'][k]];assert set(changed)<=allowed
  (P/'validation'/('migration-'+label+'.log')).write_text('\n'.join(logs).rstrip()+'\n');results[label]={'status':'PASS','migrations':migrated['migrations'],'legacyRowsPreserved':True,'legacySchemaPreserved':True,'repeatDeployAndStatus':'PASS','approvedBundleActivationResolution':'PASS','changedByActivation':changed,'countsAfter':{k:v['rows'] for k,v in after['tables'].items()},'temporaryCopyRetained':False}
 assert state.sha((R/'data/vn30.sqlite').read_bytes())==baseline['databaseSHA256'];(P/'MIGRATION_REVIEW.json').write_text(json.dumps({'status':'PASS','newMigrationAdded':False,'pendingApprovedMigrations':['202610190002_market_boundary','202610200001_dependency_release'],'targets':results,'productionMutated':False,'productionSHA256Unchanged':baseline['databaseSHA256']},indent=2)+'\n');print('PASS fresh/populated migration + actual authority CAS/resolution; production unchanged')
finally:shutil.rmtree(directory)
