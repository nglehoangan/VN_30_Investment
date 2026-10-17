"""Recheck the recorded raw-market proofs directly; never trusts a prior PASS status."""
import pathlib,json,hashlib
O=pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-17-data-initialization-final-acceptance')
p=pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-12-governance-closure-selected-path-corrected/DI_GATE_SCOPE_RECHECK.json')
x=json.loads(p.read_text());found=[]
def walk(v):
 if isinstance(v,dict):
  if v.get('id')=='DI4' and 'measurement' in v:found.extend(v['measurement']['sourceProofs'])
  else:
   for item in v.values():walk(item)
 elif isinstance(v,list):
  for item in v:walk(item)
walk(x);rows=[]
for r in {r['path']:r for r in found}.values():
 f=pathlib.Path(r['path']);rows.append({**r,'exists':f.exists(),'hashMatches':f.exists() and hashlib.sha256(f.read_bytes()).hexdigest()==r['sha256']})
assert len(rows)==30 and len({r['path'] for r in rows})==30
(O/'MARKET_SOURCE_RECHECK.json').write_text(json.dumps({'sourceManifest':str(p),'sourceManifestSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'proofs':rows,'verifiedCount':sum(r['hashMatches'] for r in rows)},indent=2)+'\n')
print(json.dumps({'auditExecuted':'PASS','rawMarketSourcesReproducible':all(r['hashMatches'] for r in rows),'verified':sum(r['hashMatches'] for r in rows),'required':30}))
