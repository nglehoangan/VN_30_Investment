from pathlib import Path
import json,urllib.parse,hashlib
P=Path(__file__).resolve().parent;assert not (P/'ARTIFACT_HASHES.json').exists();rows=json.loads((P/'HTTP_REQUEST_INVENTORY.json').read_text());mapping={}
for r in rows:
 if not r.get('bodyPath'):continue
 old=Path(r['bodyPath']);host=urllib.parse.urlsplit(r.get('finalURL') or r['requestedURL']).hostname;new=P/'captures'/host/r['ticker']/old.name
 if old.resolve()!=new.resolve():
  new.parent.mkdir(parents=True,exist_ok=True)
  if old.exists():assert hashlib.sha256(old.read_bytes()).hexdigest()==r['bodySha256'];old.rename(new)
  mapping[str(old)]=str(new.relative_to(Path.cwd()))
def walk(v):
 if isinstance(v,str):return mapping.get(v,v)
 if isinstance(v,list):return [walk(x) for x in v]
 if isinstance(v,dict):return {mapping.get(k,k):walk(x) for k,x in v.items()}
 return v
for p in P.glob('*.json'):p.write_text(json.dumps(walk(json.loads(p.read_text())),ensure_ascii=False,indent=2)+'\n')
for p in sorted((P/'captures').rglob('*'),reverse=True):
 if p.is_dir() and not any(p.iterdir()):p.rmdir()
print(json.dumps({'movedRawFilesWithoutChangingBytes':len(mapping),'namespace':'actual response hostname / ticker'}))
