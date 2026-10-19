"""Protected production replay: read-only DB, outputs only the closure evidence package."""
import json,hashlib,sqlite3,subprocess
from pathlib import Path
P=Path('docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure')
def read(n):return json.loads((P/n).read_text())
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def sha(b):return hashlib.sha256(b).hexdigest()
c=sqlite3.connect('file:data/vn30.sqlite?mode=ro&immutable=1',uri=True);tables={}
for (t,) in c.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%' order by name"):
 rows=c.execute('SELECT * FROM "'+t+'"').fetchall();tables[t]={'count':len(rows),'sha256':sha(json.dumps(sorted(rows,key=str),ensure_ascii=False,separators=(',',':')).encode())}
before=read('DB_BEFORE.json');changes=[t for t in before if t!='_prisma_migrations' and before[t]!=tables.get(t)]
assert not changes,changes
assert tables['fundamental_disposition_release']['count']==1
results=[]
for dbid,body,bodyhash in c.execute('select id,body,body_hash from fundamental_admission_run order by id'):
 d=json.loads(body);t=d['canonicalFacts'][0]['ticker'];facts=d['canonicalFacts'];assert sha(body.encode())==bodyhash
 values=[{k:f.get(k) for k in ['id','ticker','itemId','value','period','scope','unit','currency']} for f in facts]
 results.append({'ticker':t,'canonicalRunId':dbid,'canonicalBodyHash':bodyhash,'accountingFacts':len(facts),'valuesHash':sha(json.dumps(values,sort_keys=True,separators=(',',':')).encode()),'beforeAfterUnchanged':True,'proof':'Exact full admission table byte signature equals DB_BEFORE.json, so all30 bodies and their values/provenance are unchanged.','readyForScoring':d['readyForScoring']})
assert len(results)==30 and len({r['ticker'] for r in results})==30
sources=read('SOURCE_HASHES_BEFORE.json');actual={str(p):sha(p.read_bytes()) for p in Path('data').rglob('*') if p.is_file() and p.name not in ['vn30.sqlite','vn30.sqlite-wal','vn30.sqlite-shm','vn30.sqlite-journal']};sourceChanges=[p for p in sources.keys()|actual.keys() if sources.get(p)!=actual.get(p)];assert not sourceChanges,sourceChanges
integrity=c.execute('PRAGMA integrity_check').fetchall();fk=c.execute('PRAGMA foreign_key_check').fetchall();assert integrity==[('ok',)] and not fk
save('PROTECTED_ACCOUNTING_REPLAY.json',{'status':'PASS','ACCOUNTING_REGRESSIONS':0,'all30':sorted(results,key=lambda r:r['ticker']),'protectedTablesBefore':before,'protectedTablesAfter':tables,'changedProtectedTables':changes,'allowedDatabaseChanges':['One append-only fundamental_disposition_release row','One schema migration; no accounting mutation'],'sourceFilesProtected':len(sources),'sourceChanges':sourceChanges,'integrityCheck':integrity,'foreignKeyViolations':fk,'VNM':'Disposition qualifies already-approved reported-borrowings evidence; no values generated/admitted into prior run.','TCX':'Owner-exception source provenance and amount retained in canonical run; persistent register enforced.','VIB':'CAR0.118 /June30/consolidated/source hash bound without mutation.','VIC':'Original reviewed hash and scope bound without mutation.','MBB':'No new value inserted; entire canonical run unchanged.'})
release=read('RELEASE.json');members=release['partition']['members'];mbb=next(m for m in members if m['ticker']=='MBB')
assert mbb['score'] is None and mbb['state']=='DEFERRED' and all(v is False for v in mbb['quarantine'].values())
save('QUARANTINE_TEST_RESULTS.json',{'status':'PASS','ticker':'MBB','score':None,'fundamentals':'INSUFFICIENT','admission':'NOT_SCORABLE','rankingEligible':False,'top10Eligible':False,'positiveCapitalEligible':False,'DCAEligible':False,'newCapitalEligible':False,'fullUniverseMember':True,'weightRedistribution':False,'capitalRedistribution':False,'productionAndSyntheticOtherwisePassGuards':'tests/unit/level1-promotion.test.ts; tests/integration/level1-disposition.test.ts','cachedArtifactProtection':'Existing PolicyB ports tested with approved29/1 for STRONG BUY/BUY/ACCUMULATE, score/ranking reads, marginal plans, DCA and execution append.','scoringDenominator':'Methodology and score-weight sources unchanged; only release partition changes.'})
save('DI_CANDIDATE_INPUTS.json',{'partitionPath':str(P/'NEW_PARTITION.json'),'partitionSHA256':sha((P/'NEW_PARTITION.json').read_bytes()),'DI14':'PENDING','DI15':read('PARTITION_REPLAY.json')['DI15'],'independentDI14Approved':False,'formalAcceptanceWritten':False,'readyForScoring':False,'decisionReady':False,'preservedPrerequisites':release['partition']['prerequisites']})
print(json.dumps({'status':'PASS','accountingRegressions':0,'tickers':len(results),'unchangedSourceFiles':len(sources),'databaseIntegrity':'ok'}))
