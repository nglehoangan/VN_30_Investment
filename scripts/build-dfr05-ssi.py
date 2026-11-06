"""Deterministic SSI builder; --verify is read-only and accepts descendant commits."""
import json,sys,subprocess
from pathlib import Path
from collections import Counter
from lib.dfr05_ssi_v4 import *
OUT=ROOT/REL
bank=p1.module('ssi_predecessor_builder','scripts/build-dfr05-bank.py')
BANK_CORES={'CTG':'338a104f44f9ceb1365781986a7c693433f9a00ad90decdc54cfb344a9fcc114','MBB':'c9b4a6cb33a96d51443526b02890f5763f5d7cd880192b5c24f6acd8b9ac59d1','TCB':'3576c2f65ddb97ee4212cca5da3bb76c5ce24394e038192edb193b856219e75b','VCB':'0d2c4bf6ab519c095cf4b12111af81553c4c2a593961a941c40ec3540e335aa0'}
def read(p):return json.loads(Path(p).read_text())
def write(name,value):
 p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def parity():
 r=bank.predecessor_parity();base=ROOT/bank.REL;m=read(base/'manifest.json')
 if p1.digest({k:v for k,v in m.items() if k!='contentHash'})!=m['contentHash']:raise ValueError('BANK_MANIFEST')
 for p,h in m['files'].items():
  if p1.sha(base/p)!=h:raise ValueError('BANK_OUTPUT_CHANGED:'+p)
 bank.prior.check(m.get('implementation',{}));banks={}
 for t,h in BANK_CORES.items():
  core={k:read(base/f'{folder}/{t}.json') for k,folder in [('dossier','issuers'),('sourceInventory','source-inventory'),('sourceProjection','source-projection'),('dependencyGraph','dependency-graphs'),('gapRegister','gaps'),('conflictRegister','conflicts')]}
  if p1.digest(core)!=h:raise ValueError('BANK_CANONICAL_CORE:'+t)
  bank.prior.check(read(base/f'input-pins/{t}.json'));banks[t]={'canonicalCoreHash':h,'metricCount':len(core['dossier']['metrics']),'states':dict(Counter(n['status'] for n in core['dossier']['metrics']))}
 r['banks']=banks;return r

def protected(pins):
 bank.prior.check(pins,exact_data_inventory=True)
 subprocess.run(['git','merge-base','--is-ancestor',BASELINE,'HEAD'],cwd=ROOT,check=True)

def run(verify=False):
 before=read(OUT/'protected-before.json') if (OUT/'protected-before.json').exists() else read('/private/tmp/dfr05-ssi/before.json');protected(before)
 pr=parity();a=replay(p1.Store());b=replay(p1.Store());core=lambda x:{k:v for k,v in x.items() if k!='inputPins'}
 if core(a)!=core(b) or a['inputPins']!=b['inputPins']:raise ValueError('NONDETERMINISTIC')
 if verify:
  manifest=read(OUT/'manifest.json')
  if p1.digest({k:v for k,v in manifest.items() if k!='contentHash'})!=manifest['contentHash']:raise ValueError('MANIFEST_HASH')
  bank.prior.check(manifest['implementation'])
  for p,h in manifest['files'].items():
   if p1.sha(OUT/p)!=h:raise ValueError('OUTPUT_CHANGED:'+p)
  for k,v in a.items():
   if read(OUT/(k+'.json'))!=v:raise ValueError('REPLAY_MISMATCH:'+k)
 else:
  write('protected-before.json',before)
  for k,v in a.items():write(k+'.json',v)
  write('parity-results.json',pr);write('determinism.json',dict(status='PASS',freshReplays=2,canonicalCoreHashes=[p1.digest(core(a)),p1.digest(core(b))],inputPinHashes=[p1.digest(a['inputPins']),p1.digest(b['inputPins'])]))
 protected(before)
 d=a['dossier'];print(json.dumps(dict(status='PASS',readOnly=verify,canonicalCoreHash=p1.digest(core(a)),metrics=len(d['metrics']),states=dict(Counter(m['status'] for m in d['metrics'])),supportedKinds=dict(Counter(m['kind'] for m in d['metrics'] if m['status']=='SUPPORTED')),rubrics=len(d['rubrics']),scored=0)))
 return a
if __name__=='__main__':run('--verify' in sys.argv)
