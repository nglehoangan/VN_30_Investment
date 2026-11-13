"""Validate this assessment, not new financial admission or implementation."""
from pathlib import Path
import hashlib,json,collections,subprocess,sys
O=Path(__file__).resolve().parent
R=O.parents[3]
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def read(n):return json.loads((O/n).read_text())
checks=[]
def check(name,condition):
 if not condition:raise AssertionError(name)
 checks.append(name)
m=read('F2_REQUIRED_METRIC_MATRIX.json');p=read('SOURCE_PINS.json')
check('all five classification states documented',set(m['interpretation'])=={'AVAILABLE_AND_QUALIFIED','AVAILABLE_NEEDS_MAPPING','AVAILABLE_NEEDS_VERIFICATION','MISSING_SOURCE_DATA','NOT_APPLICABLE'})
rows=m['rawMetricRows'];groups=m['mandatoryGroups'];ids={r['id']:r for r in rows}
check('unique raw row IDs',len(ids)==len(rows))
check('30 tickers, 11 sector templates',len({r['ticker'] for r in rows})==30 and len(m['sectorTemplates'])==11)
check('no invented source absence',not any(r['classification']=='MISSING_SOURCE_DATA' for r in rows))
check('all applicable slots cover five operational targets plus known-newer Q3 review',all(len([q for q in rows if q['ticker']==r['ticker'] and q['metric']==r['metric']])==6 for r in rows if r['classification']!='NOT_APPLICABLE'))
check('OR alternatives preserved',all(g['candidateRows']==[g['ticker']+':'+c+':'+g['period'] for c in g['anyOf']] for g in groups))
check('OR group membership resolves',all(all(i in ids and ids[i]['mandatory'] for i in g['candidateRows']) for g in groups))
check('no source-availability/admission conflation',all(r['governedAdmission']!='APPROVED' and r['consumerReadiness'].startswith('NOT_') for r in rows if r.get('period')))
evidence={r.get('factId') or r.get('ledgerId'):r for group in m['evidenceIndex'] for r in group['observations']}
check('all classified qualified slots have exact qualified facts',all(r['qualifiedFactRefs'] and all(evidence[f]['accountingQualified'] and evidence[f]['retainedSourceAliases'] for f in r['qualifiedFactRefs']) for r in rows if r['classification']=='AVAILABLE_AND_QUALIFIED'))
check('source-to-fact cross-ticker isolation',all(all(a['ticker']==group['ticker'] for a in r.get('retainedSourceAliases',[])) for group in m['evidenceIndex'] for r in group['observations']))
check('all candidate references resolve',all(all(e in evidence for e in r.get('evidenceRefs',[])) for r in rows))
check('19 recipes, 570 ticker instances, 690 rubrics',len(m['executableMetricRecipes'])==19 and len(m['executableMetricRows'])==570 and m['rubricCoverage']['rows']==690)
check('bank prohibited metric treatment',all(r['classification']=='NOT_APPLICABLE' for r in m['executableMetricRows'] if r['sector']=='BANK' and r['metric'] in ['CFO_CONVERSION','FCF','NET_DEBT_EBITDA','INTEREST_COVERAGE','ROIC','INCREMENTAL_ROIC']))
check('counts reconcile by ticker sector metric',all(sum(sum(v['conceptPeriodSlots'].values()) for v in m['summary'][key].values())==len(rows) for key in ['byTicker','bySector','byMetric']))
check('retained Q3 evidence for all tickers is explicit',all(v['retainedQ3_2026Paths'] for v in m['summary']['sourceInventoryByTicker'].values()))
check('Q3 rows have source receipt leads without invented cell certification',all(r['sourceReceiptRefs'] and r['classification']!='AVAILABLE_AND_QUALIFIED' for r in rows if r.get('period',{}).get('id')=='Q3_YTD_2026'))
check('U1 U2 preserved and no admissions executed',m['governance']['U1']=='CLOSED_NOT_REOPENED' and m['governance']['U2']=='UNCHANGED_NOT_REASSESSED' and not m['governance']['newAdmissionExecuted'])
check('active database unchanged',digest(R/'data/vn30.sqlite')==m['activeDatabase']['sha256'])
check('all retained source and contract hashes match',all((R/r['path']).is_file() and digest(R/r['path'])==r['sha256'] for r in p['files']))
check('all deliverables exist',all((O/n).is_file() for n in ['F2_FINANCIAL_DATA_INVENTORY.md','F2_REQUIRED_METRIC_MATRIX.json','F2_ADMISSION_CAPABILITY_GAPS.md','F2_IMPLEMENTATION_PLAN.md','F2_CLOSURE_CRITERIA.md','CIO_REVIEW.md']))
# Compare two executions on identical retained inputs, including read-only database evidence.
outputs=[n for n in O.iterdir() if n.suffix in ['.md','.json'] and n.name!='VALIDATION.json']
before={n.name:digest(n) for n in outputs}
subprocess.run([sys.executable,str(O/'build_assessment.py')],cwd=R,check=True,stdout=subprocess.DEVNULL)
check('deterministic replay all assessment outputs',before=={n.name:digest(n) for n in outputs})
check('active database unchanged after replay',digest(R/'data/vn30.sqlite')==m['activeDatabase']['sha256'])
report={'contract':'f2-assessment-validation-v1','assessmentDate':'2026-11-13','result':'PASS','checks':checks,'checkCount':len(checks),'databaseSha256BeforeAndAfter':m['activeDatabase']['sha256'],'notFinancialAdmissionTests':True,'newLiveOrIsolatedAdmissionExecuted':False,'scope':'Assessment referential integrity, retained bytes, count reconciliation and deterministic replay only. TypeScript/Prisma/runtime suites not rerun because no application or schema implementation was changed.','outputs':before}
(O/'VALIDATION.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n')
print(json.dumps({'result':'PASS','checks':len(checks),'output':str(O/'VALIDATION.json')}))
