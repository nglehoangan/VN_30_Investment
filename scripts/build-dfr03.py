"""Inspect -> prepare -> challenge -> finalize. Separate real invocations, no DB writes."""
import hashlib
import json
from pathlib import Path
from datetime import datetime,timezone
import sys
from copy import deepcopy
from collections import Counter
from lib.dfr02 import PILOT,pointer
from lib.dfr02_reports import TOPIC_GAPS
from lib.dfr03 import eligibility,validate_review

ROOT=Path(__file__).resolve().parents[1]
D2='docs/fundamental-data-engine/dfr-02/2026-11-04'
OUT=ROOT/'docs/fundamental-data-engine/dfr-03/2026-11-05'
SELF='scripts/build-dfr03.py'
def read(p):return json.loads((ROOT/p).read_text())
def sha(p):return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
def h(x):return hashlib.sha256(json.dumps(x,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def now():return datetime.now(timezone.utc).isoformat()
def dump(name,x):(OUT/name).parent.mkdir(parents=True,exist_ok=True);(OUT/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def load(name):return json.loads((OUT/name).read_text())
def rules():return json.loads((ROOT/'src/domain/scoring/methodology.ts').read_text().split('deepFreeze(',1)[1].rsplit(');',1)[0])
def pins_check(pins):
 for p,v in pins.items():
  if sha(p)!=v:raise ValueError('PIN_CHANGED:'+p)
def protected():
 files={}
 for base in ['src','app','prisma','config','docs']:
  if not (ROOT/base).exists():continue
  for p in sorted((ROOT/base).rglob('*')):
   if p.is_file() and 'dfr-03' not in p.parts:files[str(p.relative_to(ROOT))]=sha(str(p.relative_to(ROOT)))
 for p in sorted((ROOT/'data').glob('vn30.sqlite*')):
  if p.is_file():files[str(p.relative_to(ROOT))]=sha(str(p.relative_to(ROOT)))
 return files
def dossiers():return {t:read(f'{D2}/issuers/{t}.json') for t in PILOT}
def check_state():
 s=load('inspection.json');pins_check(s['pins'])
 if protected()!=s['protectedBefore']:raise ValueError('PROTECTED_STATE_CHANGED')
 return s
def resolver(ds):
 def get(ref):
  if ref.startswith('METRIC:'):
   ident=ref[7:];t=ident.split(':')[0];d=ds[t]
   for i,n in enumerate(d['metrics']):
    if n['id']==ident:return dict(status=n['status'],value=n.get('value'),path=f'{D2}/issuers/{t}.json',sha256=sha(f'{D2}/issuers/{t}.json'),jsonPointer=f'/metrics/{i}',kind=n['kind'])
   raise ValueError('UNKNOWN_METRIC:'+ref)
  if ref=='PDF:FPT:EXCEPTION':return dict(status='QUALIFIED_CONTEXT',path=str((OUT/'FPT-exception-review.json').relative_to(ROOT)),sha256=sha(str((OUT/'FPT-exception-review.json').relative_to(ROOT))),jsonPointer='',kind='TARGETED_SOURCE_REVIEW')
  if ref.startswith('CONTEXT:'):
   t=ref.split(':')[1]
   if t=='TCX':raise ValueError('TCX_CONFLICTED_COMMON_ESTIMATE_NOT_ELIGIBLE')
   return dict(status='QUALIFIED_CONTEXT',path=f'{D2}/issuers/{t}.json',sha256=sha(f'{D2}/issuers/{t}.json'),jsonPointer='/estimates',kind='CONDITIONAL_ESTIMATE_NOT_FACT')
  raise ValueError('UNKNOWN_EVIDENCE:'+ref)
 return get

def inspect():
 before=protected();pins=read(f'{D2}/input-snapshot.json')['pins'];pins_check(pins)
 for manifest,group in [(f'{D2}/manifest.json','outputs'),(f'{D2}/final-review-manifest.json','files')]:
  for p,v in read(manifest)[group].items():
   full=f'{D2}/{p}'
   if sha(full)!=v:raise ValueError('DFR02_EXPORT_CHANGED:'+full)
   pins[full]=v
  pins[manifest]=sha(manifest)
 for p,v in read(f'{D2}/protected-fingerprints.json')['before'].items():
  if sha(p)!=v:raise ValueError('DFR02_BASELINE_CHANGED:'+p)
 for p in [SELF,'scripts/lib/dfr03.py','scripts/lib/dfr03_reports.py','scripts/dfr03-preparation.json','scripts/test-dfr03.py','scripts/verify-dfr03-boundaries.mjs',str((OUT/'FPT-exception-review.json').relative_to(ROOT))]:pins[p]=sha(p)
 ds=dossiers();parity={t:dict(dfr02FileSha256=sha(f'{D2}/issuers/{t}.json'),metricsSha256=h(d['metrics']),metricCount=len(d['metrics']),providerReferencesSha256=h(d['providerCrosschecks']),estimatesSha256=h(d['estimates'])) for t,d in ds.items()}
 review=load('FPT-exception-review.json')
 if sha(review['pdfPath'])!=review['sha256']:raise ValueError('FPT_SOURCE_CHANGED')
 for p in review['pages']:
  if not p['fullPageImageInspected']:raise ValueError('SOURCE_IMAGE_REVIEW_INCOMPLETE')
  pointer(read(review['notesBinding']['path']),p['notesJsonPointer'])
 dump('inspection.json',dict(contract='dfr03-inspection-v1',inspectedAt=now(),pins=pins,protectedBefore=before,financialParity=parity,baselineCompleted=4,baselineUnscored=134,sourceMode='AS_REVISED_FY2025_FY22_25_CONTEXT_UNCHANGED',newFinancialMetrics=0))

def prepare():
 s=check_state();ds=dossiers();resolve=resolver(ds);proposals=read('scripts/dfr03-preparation.json')['assessments'];rm={r['id']:r for r in rules()}
 for a in proposals:
  validate_review(a,rm[a['subcategory']],resolve)
  a['bindings']={r:resolve(r) for e in a['evidence']+a['counterevidence'] for r in e['refs']}
 dump('preparation.json',dict(contract='dfr03-preparation-v1',preparedAt=now(),actor='CHATGPT',independentHumanReviewClaimed=False,authenticatedSessionId=None,inputInspectionSha256=sha(str((OUT/'inspection.json').relative_to(ROOT))),assessments=proposals,batches=[dict(id='B1',items=['FPT:BQ-CASH'],purpose='Resolve recognition/WC challenge'),dict(id='B2',items=['TCX:RG-UNC','VNM:RG-UNC'],purpose='Economic uncertainty, source-conflict containment')]))

def challenge():
 check_state();p=load('preparation.json');cs=read('scripts/dfr03-challenge.json');records=[];rm={r['id']:r for r in rules()};resolve=resolver(dossiers())
 for a in p['assessments']:
  c=next(c for c in cs['challenges'] if c['id']==a['id'])
  final=deepcopy(a);final.update(assessment=c['band'],selectedPoints=c['points'],challengeDisposition=c)
  validate_review(final,rm[a['subcategory']],resolve)
  if not c['rationale'] or len(c['counterTests'])<3:raise ValueError('SUBSTANTIVE_CHALLENGE_REQUIRED')
  records.append(dict(id=a['id'],preparationHash=h(a),disposition='ACCEPT_WITH_QUALIFICATIONS',finalAssessment=final))
 dump('challenge.json',dict(contract='dfr03-challenge-v1',challengedAt=now(),actor='CHATGPT',reviewMode='SEPARATE_SELF_CHALLENGE_PASS_NOT_INDEPENDENT_HUMAN',authenticatedSessionId=None,preparationFileSha256=sha(str((OUT/'preparation.json').relative_to(ROOT))),challengeSpecificationSha256=sha('scripts/dfr03-challenge.json'),records=records))

def finalize():
 s=check_state();p=load('preparation.json');c=load('challenge.json')
 if c['preparationFileSha256']!=sha(str((OUT/'preparation.json').relative_to(ROOT))):raise ValueError('PREPARATION_CHANGED')
 if c['challengeSpecificationSha256']!=sha('scripts/dfr03-challenge.json'):raise ValueError('CHALLENGE_CHANGED')
 if not s['inspectedAt']<p['preparedAt']<c['challengedAt']:raise ValueError('DISTINCT_PASS_ORDER_REQUIRED')
 ds=dossiers();rm={r['id']:r for r in rules()};resolve=resolver(ds);new={x['id']:x['finalAssessment'] for x in c['records']};rows=[];complete=[]
 if set(new)!={a['id'] for a in p['assessments']}:raise ValueError('CHALLENGE_COVERAGE_MISMATCH')
 for t,d in ds.items():
  for old in d['rubrics']:
   ident=t+':'+old['rubric'];r=rm[old['rubric']];gap=TOPIC_GAPS[old['rubric']][-1]
   inherited=old['status']=='SUPPORTED';a=new.get(ident)
   if a:
    validate_review(a,r,resolve);cl='READY_FOR_ASSESSMENT';status='COMPLETED_RESEARCH';points=a['selectedPoints'];band=a['assessment'];reason='All exact topics, counterevidence and distinct challenge completed in this run.'
   elif inherited:
    a=deepcopy(old['assessment']);a.update(id=ident,confidence='MEDIUM',assumptions=['Exact DFR-02 scope and conditional economic assumptions retained.'],invalidationConditions=['Changed source pins/period/scope or contradicted economic channel.'])
    cl='READY_FOR_ASSESSMENT';status='COMPLETED_RESEARCH';points=old['points'];band=old['band'];reason='Revalidated exact DFR-02 partial judgment; no new rating.'
   else:
    review_pending=old['rubric']=='RG-UNC' or (old['rubric']=='BQ-CASH' and t!='BID')
    cl=eligibility(['REVIEW_PENDING' if review_pending else 'DATA_MISSING']*len(r['topics']));status='NOT_RATED';points=None;band=None
    reason=gap
    if old['rubric']=='FH-STRESS':reason+=' Existing model scenarios are economic sensitivities, not a funding/capital stress response.'
    if old['rubric'].startswith('IC-'):reason+=' No market share, moat, competition or governance evidence is manufactured from financial scale.'
   row=dict(id=ident,ticker=t,rubric=r['id'],category=r['category'],eligibility=cl,status=status,points=points,band=band,maxPoints=r['max'],requiredTopics=r['topics'],newCompleted=ident in new,baselineCompleted=inherited,reason=reason,topicBlockers=[] if status=='COMPLETED_RESEARCH' else [dict(topic=x,classification=cl,reason=reason,candidateMetricIds=old['availableMetricIds']) for x in r['topics']],assessment=a,productionScoringReady=False)
   rows.append(row)
   if a:complete.append(row)
  own=[r for r in rows if r['ticker']==t]
  dump(f'issuers/{t}.json',dict(contract='dfr03-partial-research-v1',classification='RESEARCH_PROVISIONAL',ticker=t,reviewDate='2026-11-05',financialPeriod='FY2025_WITH_UNCHANGED_DFR02_HISTORY',financialLayerReference=dict(path=f'{D2}/issuers/{t}.json',sha256=sha(f'{D2}/issuers/{t}.json'),metricsSha256=h(d['metrics'])),rubrics=own,totalScore=None,ranking=None,currentSignal=None,valuationPerShare=None,productionAdmissible=False,scoringAuthorized=False))
 if len(rows)!=138 or len({r['id'] for r in rows})!=138:raise ValueError('EXACT_138_SCOPE')
 dump('eligibility.json',rows);dump('assessment-results.json',complete)
 summary=dict(baselineCompleted=4,completed=len(complete),newCompleted=sum(r['newCompleted'] for r in rows),remainingUnscored=sum(r['status']=='NOT_RATED' for r in rows),eligibilityCounts=dict(Counter(r['eligibility'] for r in rows)),remainingClasses=dict(Counter(r['eligibility'] for r in rows if r['status']=='NOT_RATED')),financialMetricChanges=0,formalIssuerAcceptance=0)
 dump('summary.json',summary)
 from lib.dfr03_reports import reports
 reports(OUT,rows,summary)
 if protected()!=s['protectedBefore']:raise ValueError('PROTECTED_STATE_CHANGED')
 dump('financial-parity.json',dict(status='PASS',issuers=s['financialParity'],metricChanges=0,df02OutputsUnchanged=True))
 dump('phase-bindings.json',dict(inspection=sha(str((OUT/'inspection.json').relative_to(ROOT))),preparation=sha(str((OUT/'preparation.json').relative_to(ROOT))),challenge=sha(str((OUT/'challenge.json').relative_to(ROOT))),selfReviewNotIndependentAcceptance=True))
 files={str(f.relative_to(OUT)):sha(str(f.relative_to(ROOT))) for f in sorted(OUT.rglob('*')) if f.is_file() and f.name not in ('manifest.json','validation-results.json','boundary-results.json','DFR_03_VALIDATION.md','DFR_03_FINAL_REVIEW.md','final-review-manifest.json')}
 dump('manifest.json',dict(contract='dfr03-owner-review-candidate-v1',status='PENDING_OWNER_APPROVAL',outputs=files));print(json.dumps(summary))

if __name__=='__main__':
 phase=sys.argv[1] if len(sys.argv)==2 else ''
 if phase not in ('inspect','prepare','challenge','finalize'):raise SystemExit('inspect | prepare | challenge | finalize')
 globals()[phase]()
