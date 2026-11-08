"""Verify immutable predecessors and protected workspace bytes; no financial replay."""
import json,subprocess
from pathlib import Path
import proof
p1,ROOT,OUT=proof.p1,proof.ROOT,proof.OUT

def verify():
 subprocess.run(['git','merge-base','--is-ancestor',proof.BASELINE,'HEAD'],cwd=ROOT,check=True)
 b=p1.module('p25_baseline_verify','scripts/build-dfr05-ssi.py');result=b.parity();directory=ROOT/'docs/fundamental-data-engine/dfr-05/p2-4-b1-ssi-fc688e49';m=json.loads((directory/'manifest.json').read_text())
 if p1.digest({k:v for k,v in m.items() if k!='contentHash'})!=m['contentHash']:raise ValueError('SSI_MANIFEST')
 b.bank.prior.check(m['implementation'])
 for path,h in m['files'].items():
  if p1.sha(directory/path)!=h:raise ValueError('SSI_OUTPUT_CHANGED:'+path)
 b.bank.prior.check(json.loads((directory/'inputPins.json').read_text()))
 result['ssi']=dict(status='PASS',manifestContentHash=m['contentHash'],determinism=json.loads((directory/'determinism.json').read_text()),summary=json.loads((directory/'summary.json').read_text()))
 before=json.loads((OUT/'protected-before.json').read_text());after={}
 for path,h in before.items():
  if not (ROOT/path).is_file():raise ValueError('PROTECTED_MISSING:'+path)
  after[path]=p1.sha(ROOT/path)
  if after[path]!=h:raise ValueError('PROTECTED_BYTES_CHANGED:'+path)
 actual_data={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()};expected_data={p for p in before if p.startswith('data/')}
 if actual_data!=expected_data:raise ValueError('DATA_OR_DATABASE_SIDECAR_INVENTORY_CHANGED')
 subprocess.run(['git','diff','--exit-code'],cwd=ROOT,check=True,capture_output=True)
 proof.write('baseline-integrity.json',result)
 proof.write('protected-validation.json',dict(status='PASS',protectedFiles=len(before),beforeFingerprint=p1.digest(before),afterFingerprint=p1.digest(after),changedFiles=[],dataInventoryUnchanged=True,databasePath='data/vn30.sqlite',databaseBefore=before['data/vn30.sqlite'],databaseAfter=after['data/vn30.sqlite'],M1_M8_Masters_Predecessors_RetainedSources_Authorities_Unchanged=True,formalEngineExecuted=False))
 print(json.dumps(dict(status='PASS',protectedFiles=len(before),exactPredecessorParity=True,databaseUnchanged=True)))
if __name__=='__main__':verify()
