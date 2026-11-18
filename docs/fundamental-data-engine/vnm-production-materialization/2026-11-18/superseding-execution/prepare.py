"""Verify exact authorization inputs and recoverability, without production writes."""
import hashlib,json,os,sqlite3,subprocess,tempfile
from pathlib import Path
OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[4]
EXPECTED='47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65'
def sha(b): return hashlib.sha256(b).hexdigest()
def h(v): return sha(json.dumps(v,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode())
def write(n,v): (OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def inspect(c):
    assert c.execute('pragma integrity_check').fetchall()==[('ok',)]
    assert not c.execute('pragma foreign_key_check').fetchall()
    tables={}
    for (t,) in c.execute("select name from sqlite_master where type='table' order by name"):
        values=c.execute('select * from "'+t.replace('"','""')+'"').fetchall()
        enc=sorted(json.dumps(v,ensure_ascii=False,default=lambda b:{'hex':b.hex()},separators=(',',':')) for v in values)
        tables[t]={'count':len(values),'sha256':sha('\n'.join(enc).encode())}
    schema=c.execute('select type,name,tbl_name,sql from sqlite_master order by type,name').fetchall()
    return {'tables':tables,'schemaHash':h(schema)}
manifest=json.loads((OUT.parent/'PROPOSED_DEPLOYMENT_MANIFEST.json').read_text())
assert manifest['contentHash']==h({k:v for k,v in manifest.items() if k!='contentHash'})=='95d1b994e1b0d04b0bd3f2ddd583b98526ab6a75600517930f841dd95925b6fa'
assert manifest['requestHash']==h(manifest['request'])=='0f3bfd8b815646829676b7ab79004335fc53fb937234665df354daa1f64dd7da'
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()=='fc2415da3ff48c3a03671ee6e255cb7852923b51'
assert not os.environ.get('DATABASE_URL'),'UNREVIEWED_TARGET_OVERRIDE'
for pin in manifest['request']['sourcePins']+manifest['schemaPrerequisites']:
    assert sha((ROOT/pin['path']).read_bytes())==pin['sha256'],pin['path']
assert manifest['schemaPrerequisites'][0]['sha256']=='f5e51c5677a521828a8a47667b951b20485c35c059ac9a9125e527b6cacc68ad'
db=ROOT/'data/vn30.sqlite';assert str(db.resolve())==manifest['target']
assert sha(db.read_bytes())==EXPECTED
source=sqlite3.connect(db.resolve().as_uri()+'?mode=ro',uri=True)
original=inspect(source);write('PROTECTED_BEFORE.json',{'fileSha256':EXPECTED,**original})
history=list(source.execute('select migration_name,checksum,finished_at,rolled_back_at from _prisma_migrations order by migration_name'))
for name,checksum,finished,rolled in history:
    assert finished is not None and rolled is None
    assert sha((ROOT/'prisma/migrations'/name/'migration.sql').read_bytes())==checksum
applied={r[0] for r in history};pending=sorted(p for p in (ROOT/'prisma/migrations').glob('*/migration.sql') if p.parent.name not in applied)
authorized={p['sha256']:p['path'] for p in manifest['schemaPrerequisites']}
assert len(pending)==6
for p in pending: assert sha(p.read_bytes()) in authorized
write('MIGRATION_PLAN.json',[{'name':p.parent.name,'path':str(p.relative_to(ROOT)),'sha256':sha(p.read_bytes()),'approvedSource':authorized[sha(p.read_bytes())]} for p in pending])
backup_dir=ROOT/'data/deployment-backups/vnm-20261118-superseding';backup_dir.mkdir(parents=True,mode=0o700,exist_ok=False);os.chmod(backup_dir,0o700)
backup=backup_dir/'before.sqlite';destination=sqlite3.connect(backup);source.backup(destination);destination.close();os.chmod(backup,0o600)
saved=sqlite3.connect(backup.resolve().as_uri()+'?mode=ro',uri=True);assert inspect(saved)==original
disposable=Path(tempfile.mkdtemp(prefix='vnm-production-recovery-'));restored=disposable/'restored.sqlite'
recovery=sqlite3.connect(restored);saved.backup(recovery);assert inspect(recovery)==original;recovery.close();os.chmod(restored,0o600)
saved.close();source.close();assert sha(db.read_bytes())==EXPECTED
with backup.open('rb') as f: os.fsync(f.fileno())
write('BACKUP_AND_RECOVERY_VALIDATION.json',{'status':'PASS','sourceOpenedReadOnly':True,'method':'SQLite online backup API; includes committed WAL state','journalMode':'DELETE','sourceSidecars':[{ 'name':p.name,'size':p.stat().st_size} for p in db.parent.glob('vn30.sqlite-*')],'backupPath':str(backup.relative_to(ROOT)),'backupSha256':sha(backup.read_bytes()),'backupPermissions':'0600','logicalSchemaAndEveryTableMatch':True,'restoreToDisposablePath':str(restored),'restoredIntegrityAndForeignKeys':'PASS','productionRestoredOrReplaced':False,'rollbackPlan':'All deployment writes in one SQLite exclusive transaction; failure rolls back. Preserve verified backup; never auto-overwrite production. Any committed recovery requires a separately verified recovery action.'})
write('PREPARED_CONTEXT.json',{'target':str(db.resolve()),'backup':str(backup),'rehearsal':str(restored),'originalSha256':EXPECTED,'manifestContentHash':manifest['contentHash'],'requestHash':manifest['requestHash'],'migrationPlan':'MIGRATION_PLAN.json','runtimeAndLineagePreflight':'PENDING_FULL_GOVERNED_REPLAY_ON_RECOVERED_COPY'})
print(json.dumps({'status':'PREPARED_NO_PRODUCTION_WRITES','backupRecovery':'PASS','pendingAuthorizedMigrations':len(pending),'rehearsal':str(restored)}))
