"""One-shot owner-authorized deployment; exact two migrations, consistent baseline backup and row preservation."""
import hashlib,json,os,pathlib,sqlite3,subprocess,time
ROOT=pathlib.Path.cwd(); OUT=ROOT/'docs/fundamental-data-engine/evidence/2026-10-29-live-account-migrations'; DB=ROOT/'data/vn30.sqlite'
EXPECTED=['202610270001_dividend_settlement','202610270002_forward_intake']
BACK=ROOT/'backups/2026-10-29-pre-account-migrations'
if (OUT/'DEPLOYMENT.json').exists() or BACK.exists(): raise RuntimeError('ONE_SHOT_ALREADY_STARTED_REVIEW_RECEIPTS')
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def save(name,data): (OUT/name).write_text(json.dumps(data,indent=2)+'\n')
def inventory(file):
 c=sqlite3.connect('file:'+str(file)+'?mode=ro',uri=True)
 try:
  schema=c.execute("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").fetchall()
  tables=[r[1] for r in schema if r[0]=='table'];rows={}
  for t in tables:
   assert t.replace('_','').isalnum()
   items=c.execute('SELECT * FROM "'+t+'" ORDER BY rowid').fetchall()
   raw=json.dumps(items,separators=(',',':'),ensure_ascii=False,default=lambda b:{'bytes':b.hex()})
   rows[t]={'count':len(items),'sha256':hashlib.sha256(raw.encode()).hexdigest()}
  migrations=c.execute('SELECT migration_name,checksum,finished_at,rolled_back_at FROM _prisma_migrations ORDER BY migration_name').fetchall()
  return {'schema':schema,'tables':rows,'migrations':migrations,'integrity':c.execute('PRAGMA integrity_check').fetchall(),'foreignKeys':c.execute('PRAGMA foreign_key_check').fetchall()}
 finally:c.close()
def snapshot(source,target):
 s=sqlite3.connect('file:'+str(source)+'?mode=ro',uri=True);d=sqlite3.connect(str(target))
 try:s.backup(d)
 finally:d.close();s.close()
 os.chmod(target,0o600)
 with target.open('rb') as f:os.fsync(f.fileno())
def no_handles():
 p=subprocess.run(['/usr/sbin/lsof','-nP',str(DB)],capture_output=True,text=True,timeout=10)
 if p.returncode!=1 or p.stdout.strip():raise RuntimeError('DATABASE_OPEN_HANDLES_OR_UNCONFIRMED_QUIESCENCE')
no_handles();before=inventory(DB)
assert before['integrity']==[('ok',)] and not before['foreignKeys']
applied={r[0] for r in before['migrations']};expected={p.parent.name:p for p in (ROOT/'prisma/migrations').glob('*/migration.sql')}
assert sorted(expected.keys()-applied)==EXPECTED
assert all(finished is not None and rolled is None and sha(expected[name])==checksum for name,checksum,finished,rolled in before['migrations'])
BACK.mkdir(parents=True,mode=0o700);os.chmod(BACK.parent,0o700);os.chmod(BACK,0o700)
backup=BACK/'baseline-19.sqlite';restored=BACK/'baseline-restore-check.sqlite'
source_hash=sha(DB);snapshot(DB,backup);snapshot(backup,restored)
assert inventory(backup)==before==inventory(restored)
assert sha(DB)==source_hash
save('BASELINE_BACKUP.json',{'status':'PASS','format':'consistent-sqlite-baseline-19-v1','backupPath':str(backup.relative_to(ROOT)),'backupSha256':sha(backup),'sourceSha256':source_hash,'restoredLogicalRowsAndSchemaEqual':True,'inventory':before})
restored.unlink();no_handles();assert sha(DB)==source_hash
save('OWNER_AUTHORIZATION.json',{'statement':'vậy cập nhật db đi','scope':'Apply the two rehearsed 20261027 migrations to actual local DB; preserve all existing data.','migrationPins':[{'name':n,'sha256':sha(expected[n])}for n in EXPECTED],'historicalSealsModified':False})
env=dict(os.environ,DATABASE_URL='file:'+str(DB))
p=subprocess.run(['node','scripts/database.mjs','migrate','--no-env-file'],env=env,capture_output=True,text=True,timeout=75)
(OUT/'migration.log').write_text(p.stdout+p.stderr)
after=inventory(DB);save('POST_MIGRATION_INVENTORY.json',after)
preserved=all(after['tables'].get(t)==v for t,v in before['tables'].items() if t!='_prisma_migrations')
result={'status':'PASS' if p.returncode==0 and preserved and after['integrity']==[('ok',)] and not after['foreignKeys'] and len(after['migrations'])==len(expected) else 'REQUIRES_REVIEW','exitCode':p.returncode,'appliedBefore':len(applied),'appliedAfter':len(after['migrations']),'required':len(expected),'allPreviousApplicationRowsPreserved':preserved,'newTables':sorted(after['tables'].keys()-before['tables'].keys()),'integrity':after['integrity'],'foreignKeyViolations':after['foreignKeys'],'baselineBackup':str(backup.relative_to(ROOT)),'sourceBeforeSha256':source_hash,'sourceAfterSha256':sha(DB),'automaticRollbackPerformed':False}
save('DEPLOYMENT.json',result)
print(json.dumps(result));assert result['status']=='PASS'
