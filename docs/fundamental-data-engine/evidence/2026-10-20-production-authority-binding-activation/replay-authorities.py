"""Independent Python exact-byte/Git-object/canonical receipt replay. Read-only production DB."""
import hashlib,json,pathlib,sqlite3,subprocess
R=pathlib.Path.cwd();P=R/'docs/fundamental-data-engine/evidence/2026-10-20-production-authority-binding-activation'
def load(p):return json.loads(pathlib.Path(p).read_text())
def digest(b):return hashlib.sha256(b).hexdigest()
def canonical(x):return json.dumps(x,sort_keys=True,ensure_ascii=False,separators=(',',':'))
def save(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
receipts=load(P/'AUTHORITY_RECEIPTS.json')['receipts'];results=[];pins={}
for entry in receipts:
 b=(R/entry['path']).read_bytes();assert digest(b)==entry['byteSha256'];r=json.loads(b)
 checksum=r.pop('receiptSha256');assert digest(canonical(r).encode())==checksum==entry['receiptSha256']
 assert r['activationMode']=='STAGED_NOT_ACTIVATED'
 for p in r['artifacts']+[e['artifact'] for e in r['approvalEvidence']]:
  data=(R/p['path']).read_bytes();historical=subprocess.check_output(['git','show',p['sourceCommit']+':'+p['path']])
  assert len(data)==p['size'] and digest(data)==p['sha256']==digest(historical)
  pins[p['path']]=p['sha256']
 for e in r['approvalEvidence']:assert e['exactStatement'] in (R/e['artifact']['path']).read_text()
 results.append({'type':r['authorityType'],'scope':r['scope'],'receiptSha256':checksum,'exactByteHash':digest(b),'status':'PASS'})
assert results[2]['scope']=='DOCUMENT_BASELINE'
before=load(P/'PRODUCTION_DB_PRE_ACTIVATION.json');db=sqlite3.connect('file:data/vn30.sqlite?mode=ro',uri=True)
def table(t):
 rows=db.execute('select * from "'+t+'"').fetchall()
 encoded=sorted(json.dumps(r,default=lambda b:{'bytes':b.hex()},ensure_ascii=False,separators=(',',':')) for r in rows)
 return {'rows':len(rows),'sha256':digest('\n'.join(encoded).encode())}
tables=[r[0] for r in db.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%' order by name")]
after={t:table(t) for t in tables};assert before['tables']==after
schema=db.execute("select type,name,tbl_name,sql from sqlite_master where name not like 'sqlite_%' order by type,name").fetchall();assert digest(json.dumps(schema,separators=(',',':')).encode())==before['schemaSHA256']
assert db.execute('pragma integrity_check').fetchall()==[('ok',)] and db.execute('pragma foreign_key_check').fetchall()==[];db.close()
assert digest((R/'data/vn30.sqlite').read_bytes())==before['sha256']
save('INDEPENDENT_AUTHORITY_REPLAY.json',{'status':'PASS_SCOPED_RECEIPTS_NOT_ACTIVATION','implementation':'Independent Python canonical JSON/SHA256 + exact git objects; does not import JS verifier','receipts':results,'artifactFiles':len(pins),'productionTableRowsAndHashesUnchanged':True,'productionSchemaUnchanged':True,'productionDatabaseSHA256':before['sha256'],'scoringExecutableApproved':False,'activationAuthorized':False})
post=load(P/'PRODUCTION_DB_POST_ACTIVATION.json');post.update({'tables':after,'schemaSHA256':before['schemaSHA256'],'productionIntegrity':'ok','foreignKeyViolations':0,'independentlyVerified':True});save('PRODUCTION_DB_POST_ACTIVATION.json',post)
print(json.dumps({'independentReceiptReplay':'PASS','artifactFiles':len(pins),'tablesUnchanged':len(after),'productionMutation':False,'activation':'BLOCKED'}))
