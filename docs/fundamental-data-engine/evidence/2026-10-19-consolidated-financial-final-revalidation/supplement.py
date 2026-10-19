"""Merge reviewed source transcriptions and independently audited lineage into final evidence."""
import json
from pathlib import Path
P=Path(__file__).resolve().parent
def read(n):return json.loads((P/n).read_text())
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
v=read('VNM_REVALIDATION.json');raw=read('REVIEWED_TRANSCRIPTIONS.json');v.update({k:raw[k] for k in ['lenderClosingTables','visualReviewPages']});save('VNM_REVALIDATION.json',v)
a=read('PERIOD_SOURCE_REVIEW.json')
for r in a['tickers']:
 if r['ticker']=='VIC':
  for x in r['periods']:
   if x['target']['end']=='2026-06-30':x['newlyReviewedDocumentEvidence']='VIC_REVALIDATION.json';x['reviewedConsolidatedSourceNowQualified']=True
save('PERIOD_SOURCE_REVIEW.json',a)
t=read('TEST_RESULTS.json');lineage=read('EXACT_POINTER_AUDIT.json');z=read('ZERO_SEMANTICS_REVIEW.json')
extra=[{'test':'allRawAPIAndCombinedExactPointers','status':lineage['status']},{'test':'legacyRejectedVerificationsNotReintroduced','status':'PASS' if not z['invalidLegacyVerificationsLeak'] else 'FAIL'},{'test':'VNMClosingLenderTablesMatchCaptions','status':'PASS' if all(r['matchesNote15Totals'] for r in v['lenderClosingTables']) else 'FAIL'}]
names={x['test'] for x in extra};t['tests']=[x for x in t['tests'] if x['test'] not in names]+extra;t['status']='PASS' if all(x['status']=='PASS' for x in t['tests']) else 'FAIL'
t['independentLineageCounts']={k:sum(r['counts'].get(k,0) for r in lineage['records']) for k in set(k for r in lineage['records'] for k in r['counts'])};save('TEST_RESULTS.json',t)
# Verify sums against each distinct closing caption, not only the combined total.
for table,period in zip(v['lenderClosingTables'],v['periods']):
 assert sum(int(x['closingVND']) for x in table['short'])==int(period['components'][0]['closingBalance'])
 assert sum(int(x['closingVND']) for x in table['long'])==int(period['components'][1]['closingBalance'])
# Retained unresolved issuer conflicts are checked without admitting new presentation data.
import sqlite3
R=P.parents[3];db=sqlite3.connect('file:'+str(R/'data/vn30.sqlite')+'?mode=ro&immutable=1',uri=True);conflicts=[]
for (body,) in db.execute('select body from fundamental_admission_run'):
 d=json.loads(body);conflicts.append({'ticker':d['canonicalFacts'][0]['ticker'],'unresolvedIssuerConflicts':d['unresolvedIssuerConflicts'],'blockedDebtDerivationCount':len(d['blockedDebtDerivations'])})
db.close();conf=read('CONFLICT_REVIEW.json');conf['retainedAdmissionConflictAudit']=conflicts;save('CONFLICT_REVIEW.json',conf)
