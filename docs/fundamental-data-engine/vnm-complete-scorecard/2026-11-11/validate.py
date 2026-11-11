"""Run from repository root. Validates research artifacts, never formal approval."""
import json, pathlib,hashlib,re
from decimal import Decimal as D
R=pathlib.Path.cwd();O=pathlib.Path(__file__).resolve().parent
j=json.loads((O/'VNM_23_RUBRIC_SCORECARD.json').read_text()); errors=[];checked=0
cache={}
def check(ok,msg):
 global checked
 checked+=1
 if not ok:errors.append(msg)
def binding(b):
 p=R/b['path'];check(p.is_file(),'missing '+str(p))
 if not p.is_file():return
 check(hashlib.sha256(p.read_bytes()).hexdigest()==b['sha256'],'hash '+str(p))
 ptr=b.get('jsonPointer','')
 if ptr:
  if str(p) not in cache:cache[str(p)]=json.loads(p.read_text())
  x=cache[str(p)]
  try:
   for k in ptr.lstrip('/').split('/'):
    k=k.replace('~1','/').replace('~0','~');x=x[int(k)] if isinstance(x,list) else x[k]
   check(True,'pointer')
  except (KeyError,ValueError,IndexError,TypeError):check(False,'pointer '+str(p)+ptr)
# Compare executable M3 definitions, not just the copied pilot matrix.
s=(R/'src/domain/scoring/methodology.ts').read_text();rubrics=json.loads(s[s.index('['):s.rindex(']')+1]);by={r['id']:r for r in rubrics}
check(len(j['rows'])==23 and len({r['rubricId'] for r in j['rows']})==23,'23 unique rows')
check(sum(r['maxPoints'] for r in j['rows'])==100,'M3 maximum 100')
for row in j['rows']:
 m=by[row['rubricId']];check(row['maxPoints']==m['max'] and row['requiredTopics']==m['topics'] and row['approvedBands']==m['bands'],'M3 contract '+row['rubricId'])
 p=row['researchProposedPoints'];b=row['scoringBand']
 check((p is None and b is None) or any(x['label']==b and x['min']<=p<=x['max'] for x in m['bands']),'band '+row['rubricId'])
 check(row['formalApprovedPoints'] is None and row['humanApproval'] is None and row['provenance']=='AI_RESEARCH','no formal fabrication')
 check(bool(row['unresolvedConditions']) and bool(row['counterevidence']) and bool(row['invalidationConditions']),'bounded '+row['rubricId'])
 for x in row['additionalSourceBindings']:binding(x)
 for ref in row['evidenceReferences']:
  if ref['ledger'] not in cache:cache[ref['ledger']]=json.loads((R/ref['ledger']).read_text())
  check(ref['key'] in cache[ref['ledger']],'ledger key '+ref['key'])
for b in json.loads((O/'SOURCE_PINS.json').read_text()):binding(b)
for m in j['derivedMetrics'].values():
 for b in m['sourceBindings']:binding(b)
v=j['valuation']
for c in v['cases']:
 cf=list(map(D,c['commonCashPerYearVnd']));a=c['assumptions'];r=D(a['discount']);g=D(a['terminal']);tv=cf[-1]*(1+g)/(r-g);pv=sum(x/(1+r)**(i+1) for i,x in enumerate(cf))+tv/(1+r)**5
 check(abs(pv-D(c['equityValueVnd']))<D('.001'),'DCF replay '+c['name'])
 irr=D(c['conditionalFiveYearIrr']);npv=sum(x/(1+irr)**(i+1) for i,x in enumerate(cf))+tv/(1+irr)**5-D('56900')*D('2089955445')
 check(abs(npv)<1,'IRR replay '+c['name'])
 binding(c['sourceBinding'])
check(j['summary']['researchProposedPointsCount']==14 and j['summary']['formalApprovedPointsCount']==0,'counts')
check(j['summary']['totalScore'] is None and v['expectedFiveYearReturn'] is None and v['formalPoints'] is None,'no synthetic totals/return')
for f in ['VNM_COMPLETE_FUNDAMENTAL_ANALYSIS.md','VNM_23_RUBRIC_SCORECARD.json','VNM_VALUATION_MODEL.md','VNM_FINAL_REVIEW.md']:check((O/f).is_file(),'deliverable '+f)
report={'checks':checked,'failures':errors,'scope':'Research band/lineage/arithmetic validation only; no formal engine PASS claimed.'}
(O/'validation-results.json').write_text(json.dumps(report,indent=2)+'\n')
(O/'VNM_SCORE_VALIDATION.md').write_text('# VNM Score Validation\n\n'+str(checked)+' checks; '+str(len(errors))+' failures. Run `python3 '+str(O.relative_to(R))+'/validate.py` from repository root.\n\nChecks compare 23 IDs, weights, mandatory topics and band ranges with executable M3, resolve all linked ledger keys and additional JSON Pointers, verify pinned source hashes, and independently replay DCF/IRR arithmetic. 14 research-proposed rows, 0 formal rows, null total and null accepted expected return are enforced. No source=HUMAN fabricated.\n\nThis is research-artifact validation, not formal `calculateScorecard` acceptance. The package intentionally is not a formal ScoreInput; required human provenance, topic source/time qualification, gates and action/price bindings remain unresolved. No app code changed, so no build/UI/full-suite claims are made.\n\n'+'\n'.join(errors))
print(json.dumps(report));raise SystemExit(bool(errors))
