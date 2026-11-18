import hashlib,json,os,sqlite3,subprocess,tempfile
from pathlib import Path
OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[3]
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

assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()=='d1c7eb5e3d1261c76ac9ade85d2ca8ed2f00f23a'
assert not os.environ.get('DATABASE_URL')
db=ROOT/'data/vn30.sqlite';expected='be719ed0fdd855e64daf3fba662a1860610271d3580303a8dae4e2287fee88bf'
assert sha(db.read_bytes())==expected
c=sqlite3.connect(db.resolve().as_uri()+'?mode=ro',uri=True);original=inspect(c)
for n,s,f,r in c.execute('select migration_name,checksum,finished_at,rolled_back_at from _prisma_migrations'):
 assert f is not None and r is None and sha((ROOT/'prisma/migrations'/n/'migration.sql').read_bytes())==s
assert c.execute('select count(*) from current_score_artifact').fetchone()[0]==1
assert c.execute("select count(*) from analytical_artifact where json_extract(body,'$.contract')='current-read-only-publication-v1'").fetchone()[0]==0
backup_dir=ROOT/'data/deployment-backups/vnm-pub04-20261118';backup_dir.mkdir(parents=True,mode=0o700,exist_ok=False);os.chmod(backup_dir,0o700)
backup=backup_dir/'before.sqlite';b=sqlite3.connect(backup);c.backup(b);assert inspect(b)==original;b.close();os.chmod(backup,0o600)
temp=Path(tempfile.mkdtemp(prefix='vnm-pub04-'));clone=temp/'rehearsal.sqlite';dest=sqlite3.connect(clone);saved=sqlite3.connect(backup.resolve().as_uri()+'?mode=ro',uri=True);saved.backup(dest);assert inspect(dest)==original;dest.close();saved.close();os.chmod(clone,0o600);c.close();assert sha(db.read_bytes())==expected
with backup.open('rb') as f:os.fsync(f.fileno())
write('PROTECTED_BEFORE.json',{'fileSha256':expected,**original})
write('BACKUP_AND_RECOVERY_VALIDATION.json',{'status':'PASS','method':'SQLite online backup API; includes committed WAL state','backupPath':str(backup.relative_to(ROOT)),'backupSha256':sha(backup.read_bytes()),'permissions':'0600','sourceOpenedReadOnly':True,'restoredToDisposableDatabase':str(clone),'schemaAndAllTablesMatch':True,'integrityAndForeignKeys':'PASS','productionRestoredOrReplaced':False,'sidecarsAtPreflight':[p.name for p in db.parent.glob('vn30.sqlite-*')]})
write('CONTEXT.json',{'target':str(db.resolve()),'originalSha256':expected,'backup':str(backup),'clone':str(clone.resolve())})
print(json.dumps({'backupRecovery':'PASS','productionUnchanged':True,'clone':str(clone.resolve())}))
