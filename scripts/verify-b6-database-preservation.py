"""Verify the authorized API refresh only appended broker observations, read-only."""
import collections,datetime,hashlib,json,sqlite3
from pathlib import Path
ROOT=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-economics-r3')
baseline=json.loads((ROOT/'database-before.json').read_text());backup=Path(baseline['backupPath'])
assert hashlib.sha256(backup.read_bytes()).hexdigest()==baseline['backupSha256'],'BACKUP_HASH_MISMATCH'
a=sqlite3.connect('file:'+str(backup)+'?mode=ro',uri=True);b=sqlite3.connect('file:data/vn30.sqlite?mode=ro',uri=True)
try:
 tables=lambda c:{r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'")}
 assert tables(a)==tables(b),'TABLE_SET_CHANGED'
 schema='SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name'
 assert a.execute(schema).fetchall()==b.execute(schema).fetchall(),'SCHEMA_CHANGED'
 changes=[]
 for t in sorted(tables(a)):
  q='SELECT * FROM "'+t.replace('"','""')+'"';old=collections.Counter(a.execute(q).fetchall());new=collections.Counter(b.execute(q).fetchall())
  assert not old-new,('OLD_ROWS_CHANGED_OR_REMOVED',t)
  added=new-old;assert t=='broker_observation' or not added,('UNEXPECTED_TABLE_WRITE',t)
  if added:changes.append(dict(table=t,added=sum(added.values()),oldRowsPreserved=sum(old.values())))
 result=dict(contract='b6-database-preservation-check-v1',checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),backupPath=str(backup),backupHashVerified=True,tablesChecked=len(tables(a)),state='PASS_APPEND_ONLY_BROKER_OBSERVATIONS',changes=changes,ledgerAndScoringUnchanged=True,schemaUnchanged=True)
 (ROOT/'database-preservation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
finally:a.close();b.close()
