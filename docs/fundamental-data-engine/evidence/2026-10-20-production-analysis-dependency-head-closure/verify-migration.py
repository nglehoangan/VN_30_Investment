"""Verify additive deployment only on owned disposable databases. Never migrates production."""
import hashlib,json,os,pathlib,shutil,sqlite3,subprocess,tempfile
R=pathlib.Path.cwd();P=R/'docs/fundamental-data-engine/evidence/2026-10-20-production-analysis-dependency-head-closure'
NODE='/private/tmp/node-v22.23.2-darwin-arm64/bin/node'
def sha(b):return hashlib.sha256(b).hexdigest()
def signature(c):
 return {t:{'count':len(rows),'sha256':sha(json.dumps(sorted(rows,key=str),ensure_ascii=False,separators=(',',':'),default=str).encode())} for (t,) in c.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%'") for rows in [c.execute('select * from "'+t+'"').fetchall()]}
def schema(c):return dict(c.execute("select name,sql from sqlite_master where name not like 'sqlite_%'"))
base=json.loads((P/'BASELINE_IDENTITY.json').read_text());before=sha((R/'data/vn30.sqlite').read_bytes());assert before==base['databaseSHA256']
directory=pathlib.Path(tempfile.mkdtemp(prefix='di14-di15-migration-'));results={}
try:
 production=sqlite3.connect('file:data/vn30.sqlite?mode=ro&immutable=1',uri=True)
 copy=directory/'populated.sqlite';destination=sqlite3.connect(copy);production.backup(destination);destination.close();production.close()
 for label,target in [('fresh',directory/'fresh.sqlite'),('populated',copy)]:
  c=sqlite3.connect(target);old=signature(c);old_schema=schema(c);c.close();target.chmod(0o600)
  log=[]
  for command in ['migrate','status','migrate','status']:
   result=subprocess.run([NODE,'scripts/database.mjs',command,'--no-env-file'],cwd=R,env={**os.environ,'DATABASE_URL':'file:'+str(target)},capture_output=True,text=True,timeout=70)
   log.append(result.stdout+result.stderr);(P/'validation'/('migration-'+label+'.log')).write_text('\n'.join(log));assert result.returncode==0,(label,command,result.returncode)
  (P/'validation'/('migration-'+label+'.log')).write_text('\n'.join(log))
  c=sqlite3.connect(target);c.execute('pragma foreign_keys=ON');new=signature(c);new_schema=schema(c)
  assert all(name in new_schema for name in ['dependency_release_no_update','dependency_release_no_delete','dependency_publication_no_update','dependency_publication_no_delete','dependency_identity_no_update','dependency_identity_no_delete'])
  changed=[t for t in old if t!='_prisma_migrations' and old[t]!=new.get(t)];schema_changes=[n for n,v in old_schema.items() if n!='_prisma_migrations' and new_schema.get(n)!=v]
  assert not changed and not schema_changes,(changed,schema_changes)
  assert c.execute('pragma integrity_check').fetchall()==[('ok',)] and not c.execute('pragma foreign_key_check').fetchall()
  immutable=[]
  if label=='fresh':
   c.execute("insert into market_boundary_record values ('synthetic-migration-only','CAPABILITY','test-only','2026-10-20T00:00:00Z','{}','fixture')");c.commit()
   for sql in ["update market_boundary_record set body='{}' where id='synthetic-migration-only'","delete from market_boundary_record where id='synthetic-migration-only'"]:
    try:c.execute(sql);raise AssertionError('Mutation allowed')
    except sqlite3.IntegrityError:immutable.append('REJECTED');c.rollback()
   c.execute("CREATE TRIGGER closure_injected_failure BEFORE INSERT ON market_boundary_decision_seal BEGIN SELECT RAISE(ABORT,'injected failure'); END");c.commit()
   try:
    c.execute('begin');c.execute("insert into market_boundary_record values ('synthetic-failed-decision','DECISION','test-only','2026-10-20T00:00:00Z','{}','fixture')")
    c.execute("insert into market_boundary_decision_seal values ('test-decision','synthetic-failed-decision','missing-head','fixture')");raise AssertionError('Failure not injected')
   except sqlite3.IntegrityError:c.rollback()
   assert c.execute("select count(*) from market_boundary_record where id='synthetic-failed-decision'").fetchone()[0]==0
  results[label]={'status':'PASS','legacyTableChanges':changed,'legacySchemaChanges':schema_changes,'before':old,'afterBeforeSyntheticChecks':new,'addedObjects':sorted(set(new_schema)-set(old_schema)),'FKViolations':c.execute('pragma foreign_key_check').fetchall(),'integrity':'ok','immutableMutationAttempts':immutable,'repeatDeployAndStatus':'PASS','syntheticRollbackTest':'PASS' if label=='fresh' else 'COVERED_ON_FRESH_AND_FOCUSED_TESTS'};c.close()
 assert sha((R/'data/vn30.sqlite').read_bytes())==before
 result={'status':'PASS','migration':'202610200001_dependency_release','productionMutationPerformed':False,'productionSHA256Unchanged':before,'targets':results,'temporaryDatabasesRetained':False,'noDestructiveDownMigration':'Dormant activation; recover using verified DB backup if needed. Accepted immutable evidence is never deleted.'}
 (P/'MIGRATION_REVIEW.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS: fresh and populated-copy additive/repeat/immutability/rollback checks; production unchanged')
finally:shutil.rmtree(directory)
