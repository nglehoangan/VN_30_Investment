"""Read-only source/scorecard validation. Never opens SQLite for writing."""
from pathlib import Path
import hashlib,json,sqlite3
R=Path(__file__).resolve().parents[1];O=R/'docs/fundamental-data-engine/scoring-g2-g3-vnm-pilot/v1-0-cefdb63';V=O/'vnm';checks=[]
def load(p):return json.loads(p.read_text())
def ck(name,result,detail=None):
 checks.append({'name':name,'pass':bool(result),'detail':detail})
p=load(V/'VNM_23_RUBRIC_MATRIX.json');ledger=load(V/'VNM_EVIDENCE_LEDGER.json');pins=load(V/'VNM_SOURCE_PINS.json');g=load(V/'VNM_GROWTH_REPLAY.json')
for path,h in pins.items():ck('source hash '+path,hashlib.sha256((R/path).read_bytes()).hexdigest()==h)
rows=p['rows'];ck('23 unique VNM rubric IDs',len(rows)==23 and len({x['rubricId'] for x in rows})==23 and all(x['ticker']=='VNM' for x in rows))
ck('no formal scores or synthetic total',p['totalScore'] is None and p['ranking'] is None and p['M4Decision'] is None and all(x['points'] is None and x['scoreBand'] is None and not x['formalScoreEligible'] for x in rows))
prior=load(R/'docs/fundamental-data-engine/dfr-04/closure-37e12f2/issuers/VNM.json');pr={x['rubric']:x for x in prior['rubrics']};ck('six prior assessments unchanged',sum(x['priorAssessment'] is not None for x in rows)==6 and all(x['priorAssessment']==pr[x['rubricId']]['assessment'] for x in rows))
ck('17 unrated research rubrics',sum(x['assessmentStatus']=='NOT_RATED' for x in rows)==17)
ck('valuation remains unrated',all(x['researchBand'] is None and x['points'] is None for x in rows if x['rubricId'].startswith('VAL-')))
for x in rows:
 ck(x['rubricId']+' topics individually retained',[t['topic'] for t in x['topicAssessment']]==x['requiredTopics'] and all(t['required'] and not t['fullTopicFormallyQualified'] for t in x['topicAssessment']))
 ck(x['rubricId']+' substantive support/challenge/action',all(x[k] for k in ['supportingFacts','counterevidence','risks','nextAction','exactUnresolvedDependencies','confidenceBasis']))
 ck(x['rubricId']+' no human/assumption invention',x['humanApproval'] is None and not x['newEconomicAssumptions'] and not x['sourceAbsenceProven'])
 ck(x['rubricId']+' selected references resolve',all(ref in ledger for ref in x['financialEvidenceRefs']+x['qualitativeEvidenceRefs']))
 if x['priorAssessment']:
  ck(x['rubricId']+' prior topic refs resolve',all(ref in ledger for t in x['priorAssessment']['evidence'] for ref in t['refs']))
  a=x['priorAssessment'];ck(x['rubricId']+' unchanged approved band',any(b['label']==a['assessment'] and b['min']<=a['selectedPoints']<=b['max'] for b in x['approvedBands']))
cache={}
def resolve(b):
 path=b['path']
 if path not in cache:cache[path]=load(R/path)
 v=cache[path]
 for part in b['jsonPointer'].split('/')[1:]:
  part=part.replace('~1','/').replace('~0','~');v=v[int(part)] if isinstance(v,list) else v[part]
 return v
for key,entry in ledger.items():
 if 'financialRecord' in entry:ck('financial parity '+key,resolve(entry)==entry['financialRecord'])
 elif 'excerpt' in entry:ck('retained note pointer '+key,resolve(entry)['text']==entry['excerpt'])
 if 'currentBinding' in entry:ck('current context pointer '+key,isinstance(resolve(entry['currentBinding']),dict))
ck('growth annual/source/scope dimensions',all(x['scope']=='CONSOLIDATED' and x['periodType']=='ANNUAL' and x['revisionBasis']=='ORIGINAL_REVIEWED_VINTAGE' and x['periodStart']==str(x['year'])+'-01-01' and x['periodEnd']==str(x['year'])+'-12-31' for x in g['operandRecords']))
ck('growth source PDF identities retained',all(x.get('pdfEvidence',{}).get('sha256') in s for x,s in zip(g['operandRecords'],g['sourceReferences'])))
ck('growth no publication invention',all(x['publicationAt'] is None for x in g['operandRecords']) and not g['formalAdmission'])
protected=load(O/'engineering/protected-before.json');changed=[]
for path,h in protected.items():
 actual=hashlib.sha256((R/path).read_bytes()).hexdigest()
 if actual!=h:changed.append(path)
ck('only approved existing engine files differ within protected snapshot',set(changed)=={'src/domain/scoring/metrics.ts','src/domain/scoring/scorecard.ts'},changed)
ck('configured database byte parity',hashlib.sha256((R/'data/vn30.sqlite').read_bytes()).hexdigest()==protected['data/vn30.sqlite'])
with sqlite3.connect('file:'+str(R/'data/vn30.sqlite')+'?mode=ro',uri=True) as db:
 counts={t:db.execute('select count(*) from '+t).fetchone()[0] for t in ['analytical_artifact','scoring_dataset_binding']}
ck('no research admission',counts=={'analytical_artifact':0,'scoring_dataset_binding':0},counts)
result={'pass':all(x['pass'] for x in checks),'checks':checks,'summary':p['summary'],'sourcePins':len(pins),'protectedSnapshotCount':len(protected),'databaseReadOnlyCounts':counts,'productionActivated':False}
(V/'validation-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pass':result['pass'],'checks':len(checks),'failed':[x for x in checks if not x['pass']]},ensure_ascii=False));raise SystemExit(0 if result['pass'] else 1)
