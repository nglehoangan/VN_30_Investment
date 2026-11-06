"""Read-only retained evidence -> exactly four provisional BANK dossiers."""
import json
import subprocess
from pathlib import Path
from collections import Counter
from lib.dfr05_bank_v3 import *

OUT=ROOT/REL
PREDECESSORS=[acb.P1,'docs/fundamental-data-engine/dfr-05/p2-0-bd3a8b4b','docs/fundamental-data-engine/dfr-05/p2-1-653d67f7',acb.REL]
ACB_CORE='5c1accb54b0373ba8beaf097d3fc4d9d8b758104054b259d1dfc3c69c599f09f'
prior=p1.module('bank_prior_builder','scripts/build-dfr05-acb.py')


def read(p):return json.loads(Path(p).read_text())
def write(name,value):
    path=OUT/name;path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')


def predecessor_parity():
    for directory in PREDECESSORS:
        m=read(ROOT/directory/'manifest.json')
        if 'canonicalHashSemantics' in m and p1.digest({k:v for k,v in m.items() if k!='contentHash'})!=m['contentHash']:raise ValueError('PREDECESSOR_CANONICAL_MANIFEST')
        for path,h in m['files'].items():
            if p1.sha(ROOT/directory/path)!=h:raise ValueError('SEALED_PREDECESSOR_OUTPUT_CHANGED:'+directory+'/'+path)
        prior.check(m.get('implementation',{}))
    core={k:read(ROOT/acb.REL/f) for k,f in [('dossier','ACB.json'),('sourceInventory','source-inventory.json'),('sourceProjection','source-projection.json'),('dependencyGraph','dependency-graph.json'),('gapRegister','gap-register.json')]}
    d=core['dossier'];counts=Counter(m['status'] for m in d['metrics'])
    if p1.digest(core)!=ACB_CORE or len(d['metrics'])!=92 or counts!={'SUPPORTED':85,'MISSING':7} or len(d['rubrics'])!=23 or any(r['points'] is not None or r['band'] is not None for r in d['rubrics']):raise ValueError('GLOBAL_ACB_PARITY_FAILURE')
    acb.validate_dossier(d)
    prior.check(read(ROOT/acb.P1/'input-pins.json'));prior.check(read(ROOT/acb.REL/'input-pins.json'))
    return dict(status='PASS',p1=prior.parity(),acb=dict(metricCount=92,supported=85,missing=7,deferred=23,canonicalCoreHash=ACB_CORE,dossierHash=p1.sha(ROOT/acb.REL/'ACB.json'),allSourceCodeOutputSealsUnchanged=True))


def baseline():
    if subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()!=BASELINE:raise ValueError('APPROVED_HEAD_REQUIRED')
    if subprocess.check_output(['git','diff','HEAD','--name-only'],cwd=ROOT,text=True).strip():raise ValueError('TRACKED_BASELINE_CHANGED_GLOBAL_STOP')
    path=OUT/'protected-before.json'
    if path.exists():pins=read(path)
    else:
        paths={p for p in subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0') if p and (ROOT/p).is_file()}
        paths.update(str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file())
        pins={p:p1.sha(ROOT/p) for p in sorted(paths)}
        initial=Path('/private/tmp/dfr05-b1-bank/before.json')
        if initial.exists() and read(initial)!=pins:raise ValueError('PRE_IMPLEMENTATION_SNAPSHOT_MISMATCH')
        write('protected-before.json',pins)
    prior.check(pins,exact_data_inventory=True)
    parity=predecessor_parity();write('parity-results.json',parity)
    return pins


def build():
    protected=baseline();summaries={}
    pins={**read(ROOT/acb.P1/'input-pins.json'),**read(ROOT/acb.REL/'input-pins.json')}
    for identity in IDENTITIES:
        store=p1.Store(expected=pins);result=replay(store,identity);t=identity.ticker
        for name,key in [('issuers','dossier'),('source-inventory','sourceInventory'),('source-projection','sourceProjection'),('dependency-graphs','dependencyGraph'),('gaps','gapRegister'),('conflicts','conflictRegister'),('input-pins','inputPins')]:write(f'{name}/{t}.json',result[key])
        core={k:v for k,v in result.items() if k!='inputPins'};d=result['dossier'];counts=Counter(m['status'] for m in d['metrics'])
        summary=dict(ticker=t,securityId=identity.securityId,totalMetrics=len(d['metrics']),supported=counts['SUPPORTED'],missing=counts['MISSING'],conflict=counts['CONFLICT'],referenceOnly=counts['REFERENCE_ONLY'],readyForReview=counts['READY_FOR_REVIEW'],rubricsReady=0,rubricsDeferred=23,newScores=0,byKind=dict(Counter(m['kind'] for m in d['metrics'])),byRubricDisposition=dict(Counter(r['eligibility'] for r in d['rubrics'])),canonicalCoreHash=p1.digest(core),graphNodes=len(result['dependencyGraph']['nodes']),graphEdges=len(result['dependencyGraph']['edges']))
        write(f'coverage/{t}.json',summary);summaries[t]=summary
        print(json.dumps(summary),flush=True)
    prior.check(protected,exact_data_inventory=True)
    write('pipeline-summary.json',summaries)
    return summaries


if __name__=='__main__':build()
