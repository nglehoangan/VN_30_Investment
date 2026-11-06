"""Bounded ACB research export. Never writes data/, production or P1 artifacts."""
import json
import subprocess
from pathlib import Path
from collections import Counter
from lib.dfr05_acb_v2 import *

OUT=ROOT/REL


def read(path): return json.loads(Path(path).read_text())
def write(name,value):
    path=OUT/name
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')


def check(pins, exact_data_inventory=False):
    for path,expected in pins.items():
        if not (ROOT/path).is_file() or p1.sha(ROOT/path)!=expected: raise ValueError('PROTECTED_BYTES_CHANGED:'+path)
    expected_data={p for p in pins if p.startswith('data/')}
    if exact_data_inventory:
        actual_data={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()}
        if actual_data!=expected_data:raise ValueError('DATA_FILE_OR_DATABASE_SIDECAR_INVENTORY_CHANGED')


def baseline():
    if subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()!=BASELINE: raise ValueError('APPROVED_BASELINE_HEAD_REQUIRED')
    receipt=OUT/'protected-before.json'
    if receipt.exists(): pins=read(receipt)
    else:
        paths=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
        paths=set(p for p in paths if p and (ROOT/p).is_file())
        paths.update(str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file())
        pins={p:p1.sha(ROOT/p) for p in sorted(paths)}
        # A new execution cannot bless modified tracked baseline files.
        if subprocess.check_output(['git','diff','HEAD','--name-only'],cwd=ROOT,text=True).strip():raise ValueError('TRACKED_BASELINE_DIRTY')
        write('protected-before.json',pins)
    check(pins,exact_data_inventory=True)
    for directory in [P1,'docs/fundamental-data-engine/dfr-05/p2-0-bd3a8b4b','docs/fundamental-data-engine/dfr-05/p2-1-653d67f7']:
        m=read(ROOT/directory/'manifest.json')
        for p,h in m['files'].items():
            if p1.sha(ROOT/directory/p)!=h:raise ValueError('PREDECESSOR_SEAL_CHANGED:'+p)
        for p,h in m.get('implementation',{}).items():
            if p1.sha(ROOT/p)!=h:raise ValueError('SEALED_CODE_CHANGED:'+p)
    check(read(ROOT/P1/'input-pins.json'))
    return pins


def parity():
    rows=[]
    for ticker in p1.PILOT:
        d=read(ROOT/P1/f'issuers/{ticker}.json')
        prior=read(ROOT/p1.D2/f'issuers/{ticker}.json')
        judgments=read(ROOT/p1.D4/f'issuers/{ticker}.json')
        if d['ticker']!=ticker or d['metrics']!=prior['metrics'] or d['providerCrosschecks']!=prior['providerCrosschecks'] or d['rubrics']!=judgments['rubrics']: raise ValueError('GLOBAL_P1_PARITY_FAILURE:'+ticker)
        p1.validate_dossier(d,judgments)
        completed=sum(r['status']=='COMPLETED_RESEARCH' for r in d['rubrics'])
        rows.append(dict(ticker=ticker,metricCount=len(d['metrics']),completed=completed,deferred=23-completed,metricObjectHash=p1.digest(d['metrics']),rubricObjectHash=p1.digest(d['rubrics']),providerCrosscheckHash=p1.digest(d['providerCrosschecks']),sourceProjectionHash=p1.sha(ROOT/P1/f'sources/{ticker}.json'),dossierHash=p1.sha(ROOT/P1/f'issuers/{ticker}.json')))
    if (sum(r['metricCount'] for r in rows),sum(r['completed'] for r in rows),sum(r['deferred'] for r in rows))!=(789,25,113):raise ValueError('EXACT_P1_COUNTS_REQUIRED')
    return dict(status='PASS',mode='EXACT_FULL_OBJECT_AND_SEALED_BYTE_COMPARISON; no historical resealing',issuers=rows,metrics=789,completed=25,deferred=113)


def build():
    pins=baseline()
    store=p1.Store(expected=read(ROOT/P1/'input-pins.json'))
    result=replay(store)
    d=result['dossier']; graph=result['dependencyGraph']
    core={k:v for k,v in result.items() if k!='inputPins'}
    for name,key in [('ACB.json','dossier'),('source-inventory.json','sourceInventory'),('source-projection.json','sourceProjection'),('dependency-graph.json','dependencyGraph'),('gap-register.json','gapRegister'),('input-pins.json','inputPins')]:write(name,result[key])
    write('parity-results.json',parity())
    summary=dict(classification='RESEARCH_PROVISIONAL',baselineCommit=BASELINE,securityId=ACB.securityId,ticker='ACB',metricCount=len(d['metrics']),metricsByStatus=dict(Counter(m['status'] for m in d['metrics'])),metricsByKind=dict(Counter(m['kind'] for m in d['metrics'])),rubricReadiness=dict(Counter(r['eligibility'] for r in d['rubrics'])),newAssessments=0,graphNodes=len(graph['nodes']),graphEdges=len(graph['edges']),deterministicPayloadHash=p1.digest(core),sourceFilesPinned=len(store.pins),productionAdmissible=False)
    write('pipeline-summary.json',summary)
    check(pins,exact_data_inventory=True);store.validate()
    return summary


if __name__=='__main__':print(json.dumps(build()))
