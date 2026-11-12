"""Apply only absent reviewed migrations to a private byte-copy, never active SQLite."""
import sqlite3,pathlib,tempfile,shutil,hashlib,json
root=pathlib.Path(__file__).resolve().parents[4];src=root/'data/vn30.sqlite'
files=[p for p in [src,pathlib.Path(str(src)+'-wal'),pathlib.Path(str(src)+'-shm')] if p.exists()]
h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();before={str(p.relative_to(root)):h(p) for p in files}
with tempfile.TemporaryDirectory(prefix='vn30-active-copy-migration-') as td:
 target=pathlib.Path(td)/'copy.sqlite'
 for p in files:shutil.copyfile(p,str(target)+str(p)[len(str(src)):])
 db=sqlite3.connect(str(target));tables={r[0] for r in db.execute("select name from sqlite_master where type='table'")};applied=[];existing=[]
 for folder,marker in [('202610190002_market_boundary','market_boundary_record'),('202611120001_market_ingest','market_boundary_ingest_link'),('202611120002_unified_admission','source_admission_event')]:
  if marker in tables:existing.append(folder);continue
  path=root/'prisma/migrations'/folder/'migration.sql';db.executescript(path.read_text());applied.append({'path':str(path.relative_to(root)),'sha256':h(path)})
 assert db.execute('pragma integrity_check').fetchone()[0]=='ok'
 foreign=db.execute('pragma foreign_key_check').fetchall();assert not foreign,foreign[:3]
 db.close()
assert before=={str(p.relative_to(root)):h(p) for p in files},'ACTIVE_SOURCE_CHANGED'
print(json.dumps({'status':'PASS','mode':'SCHEMA_MIGRATION_ON_TEMPORARY_BYTE_COPY_OF_ACTIVE_SQLITE_AND_PRESENT_SIDECARS','applied':applied,'alreadyPresent':existing,'integrityCheck':'ok','foreignKeyViolations':0,'sourceFingerprints':before,'activeFilesChanged':False,'portfolioTransactionsApplied':False},indent=2))
