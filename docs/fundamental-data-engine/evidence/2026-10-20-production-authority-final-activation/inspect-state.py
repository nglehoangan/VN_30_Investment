"""Read-only exact logical database inventory; no private row contents exported."""
import hashlib,json,pathlib,sqlite3,sys
P=pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-20-production-authority-final-activation')
def sha(b):return hashlib.sha256(b).hexdigest()
def canonical(x):return json.dumps(x,ensure_ascii=False,separators=(',',':'),default=lambda b:{'bytes':b.hex()})
def inspect(path):
 db=sqlite3.connect('file:'+str(path.resolve())+'?mode=ro',uri=True);tables={};objects={}
 try:
  schema=db.execute("select type,name,tbl_name,sql from sqlite_master where name not like 'sqlite_%' order by type,name").fetchall()
  for typ,name,table,sql in schema:objects[typ+':'+name]=sha(canonical([table,sql]).encode())
  for t, in db.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%' order by name"):
   cols=db.execute('pragma table_info("'+t+'")').fetchall();pk=[c[0] for c in sorted(cols,key=lambda c:c[5]) if c[5]>0];rows=db.execute('select * from "'+t+'"').fetchall();encoded=sorted(canonical(r) for r in rows)
   keyed={sha(canonical([r[i] for i in pk]).encode()):sha(canonical(r).encode()) for r in rows};assert len(keyed)==len(rows),(t,'non-unique identity')
   tables[t]={'rows':len(rows),'sha256':sha('\n'.join(encoded).encode()),'rowHashes':keyed}
  assert db.execute('pragma integrity_check').fetchall()==[('ok',)] and db.execute('pragma foreign_key_check').fetchall()==[]
  head=db.execute("select id,body_hash,updated_at from market_boundary_dependency_head order by id").fetchall() if 'market_boundary_dependency_head' in tables else []
  return {'path':str(path),'sha256':sha(path.read_bytes()),'schemaSHA256':sha(canonical(schema).encode()),'schemaObjects':objects,'tables':tables,'dependencyHeads':[dict(zip(['id','hash','updatedAt'],r)) for r in head],'integrity':'ok','foreignKeyViolations':0,'migrations':[r[0] for r in db.execute('select migration_name from _prisma_migrations where finished_at is not null order by migration_name')]}
 finally:db.close()
if __name__=='__main__':
 label=sys.argv[1];path=pathlib.Path(sys.argv[2]) if len(sys.argv)>2 else pathlib.Path('data/vn30.sqlite');out=inspect(path);(P/label).write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'output':label,'sha256':out['sha256'],'tables':len(out['tables']),'migrations':len(out['migrations'])}))
