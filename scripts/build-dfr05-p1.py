"""DFR05 P1 export only. Explicit owner authorization is recorded, never production approval."""
from pathlib import Path
import json,subprocess,sys
from datetime import datetime,timezone
from collections import Counter
from lib.dfr05_p1 import ROOT,D2,D4,PILOT,CONTRACT,Store,Foundation,digest,sha,canonical
BASELINE='a46da9a8ca4ba6171287fb98410e366ae05e82ec'
REL='docs/fundamental-data-engine/dfr-05/p1-a46da9a8';OUT=ROOT/REL
IMPLEMENTATION=['scripts/lib/dfr05_p1.py','scripts/build-dfr05-p1.py','scripts/test-dfr05-p1.py','scripts/verify-dfr05-p1-boundaries.mjs','scripts/finalize-dfr05-p1.py']
def now():return datetime.now(timezone.utc).isoformat()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
def load(p):return json.loads((ROOT/p).read_text())
def dump(n,x):
 p=OUT/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def baseline():
 if git('rev-parse','HEAD')!=BASELINE or git('diff','--name-only','HEAD'):raise ValueError('BASELINE_OR_TRACKED_BYTES_CHANGED')
 paths=set(git('ls-files').splitlines())|{str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()}
 # Includes older untracked protected files, without restoring any historical artifact.
 prior=load(D4+'/inspection.json')['protectedFiles']
 for p,h in prior.items():
  if sha(ROOT/p)!=h:raise ValueError('PROTECTED_SOURCE_CHANGED:'+p)
 paths.update(prior)
 return {p:sha(ROOT/p) for p in sorted(paths)}
def check(pins):
 if git('rev-parse','HEAD')!=BASELINE:raise ValueError('BASELINE_HEAD_CHANGED')
 for p,h in pins.items():
  if sha(ROOT/p)!=h:raise ValueError('PROTECTED_CHANGED:'+p)
 if git('diff','--name-only','HEAD'):raise ValueError('PROTECTED_TRACKED_DIFF')
def build():
 pins=baseline();expected=load(D2+'/input-snapshot.json')['pins']
 for p,h in load(D4+'/manifest.json')['files'].items():
  if sha(ROOT/D4/p)!=h:raise ValueError('CLOSURE_MANIFEST:'+p)
 for p,h in load(D4+'/manifest.json')['implementation'].items():
  if sha(ROOT/p)!=h:raise ValueError('PREDECESSOR_CODE:'+p)
 store=Store(expected=expected);foundation=Foundation(store);parity={};dossiers=[];adapterCounts={};artifacts={}
 for t in PILOT:
  dossier,cells=foundation.replay(t);dossiers.append(dossier)
  old=store.read(D4+f'/issuers/{t}.json');d2=store.read(D2+f'/issuers/{t}.json')
  if dossier['providerCrosschecks']!=d2['providerCrosschecks']:raise ValueError('PROVIDER_CROSSCHECK_PARITY')
  parity[t]=dict(metricsEqual=dossier['metrics']==d2['metrics'],metricCount=len(dossier['metrics']),metricHash=digest(dossier['metrics']),rubricsEqual=dossier['rubrics']==old['rubrics'],rubricHash=digest(dossier['rubrics']),completed=sum(r['status']=='COMPLETED_RESEARCH' for r in old['rubrics']),deferred=sum(r['status']=='NOT_RATED' for r in old['rubrics']))
  adapterCounts[t]=dict(Counter(c['id'].split(':')[2] for c in cells));artifacts[f'issuers/{t}.json']=dossier;artifacts[f'sources/{t}.json']=cells
 graph=foundation.graph.export();store.validate();check(pins)
 completed=sum(p['completed'] for p in parity.values());deferred=sum(p['deferred'] for p in parity.values())
 if (completed,deferred)!=(25,113):raise ValueError('EXACT_25_113_REQUIRED')
 dump('baseline-snapshot.json',dict(baselineCommit=BASELINE,protectedFiles=pins,closureManifestHash=sha(ROOT/D4/'manifest.json')))
 dump('owner-authorization.json',dict(package='DFR-05 P1',status='EXPLICIT_OWNER_APPROVAL_RECORDED',ownerMessage='Tôi approve hãy start',context='Direct response to the P1-only approval question in this conversation.',baselineCommit=BASELINE,recordedAt=now(),approvalMessageTimestamp=None,pilotIssuers=list(PILOT),allowed='P1 contract, retained adapters, graph, exact six-pilot replay and boundary validation only.',p2Authorized=False,newExternalSourcesAuthorized=False,productionAuthorized=False,existingAssessmentAcceptance='UNCHANGED_PENDING_SEPARATE_OWNER_DECISION',valuationCutoff=None,economicAssumptions=None))
 for n,x in artifacts.items():dump(n,x)
 dump('dependency-graph.json',graph);dump('qualification-replay.json',foundation.row_qualifications);dump('retained-source-inventory.json',foundation.adapter_inventory)
 dump('input-pins.json',store.pins)
 dump('parity-results.json',dict(status='PASS',issuers=parity,completedBefore=25,completedAfter=completed,deferredBefore=113,deferredAfter=deferred,newAssessments=0,originalSourceAndAssessmentBytesUnchanged=True))
 dump('pipeline-summary.json',dict(contract=CONTRACT,classification='RESEARCH_PROVISIONAL',issuers=list(PILOT),adapterCounts=adapterCounts,metrics=sum(x['metricCount'] for x in parity.values()),graphNodes=len(graph['nodes']),graphEdges=len(graph['edges']),completed=completed,deferred=deferred,completeScorecards=0,legacySchemaRows=[r['id'] for r in foundation.row_qualifications if r['validation'].startswith('SEALED_LEGACY')],deterministicPayloadHash=digest(dict(artifacts=artifacts,graph=graph,qualifications=foundation.row_qualifications)),p2Started=False,productionActivated=False))
 dump('implementation-pins.json',{p:sha(ROOT/p) for p in IMPLEMENTATION if (ROOT/p).exists()})
 print(json.dumps(dict(status='PASS',issuers=6,metrics=sum(x['metricCount'] for x in parity.values()),graphNodes=len(graph['nodes']),completed=completed,deferred=deferred)))
if __name__=='__main__':build()
