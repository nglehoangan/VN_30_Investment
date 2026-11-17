import sqlite3,json,hashlib,sys
from pathlib import Path
O=Path(__file__).resolve().parent
p=Path('data/vn30.sqlite');c=sqlite3.connect('file:'+str(p.resolve())+'?mode=ro',uri=True)
rows={}
for (table,) in c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
 vals=c.execute('SELECT * FROM "'+table.replace('"','""')+'"').fetchall()
 enc=sorted(json.dumps(v,ensure_ascii=False,default=lambda b:{'hex':b.hex()},separators=(',',':')) for v in vals)
 rows[table]={'count':len(vals),'sha256':hashlib.sha256('\n'.join(enc).encode()).hexdigest()}
c.close()
d={'readOnly':True,'fileSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'tables':rows}
(O/sys.argv[1]).write_text(json.dumps(d,sort_keys=True,indent=2)+'\n')
