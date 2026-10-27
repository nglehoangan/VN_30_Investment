from pathlib import Path
import sqlite3,json,hashlib,tempfile,shutil,subprocess,os
R=Path.cwd();T=Path('/private/tmp/m8-phase22'); sha=lambda b:hashlib.sha256(b).hexdigest()
def out(n,x):(T/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
source=sqlite3.connect('file:'+str(R/'data/vn30.sqlite')+'?mode=ro',uri=True)
# Exact source-body verification and financial-only extraction; private customer fields never exported.
cash=[];fpt=[]
for kind,api,received,body,h in source.execute('SELECT kind,api_id,received_at,body,body_hash FROM broker_observation'):
 assert sha(body.encode())==h
 x=json.loads(body); data=x.get('data',{})
 if api=='4.15' and isinstance(data,dict) and isinstance(data.get('data'),list)and data['data']:
  row=data['data'][0];cash.append({'reference':'sqlite:data/vn30.sqlite#broker_observation/body_hash/'+h,'sha256':h,'receivedAt':received,'pointer':'/data/data/0','fields':{k:str(row[k])for k in ['cashBalance','cashDevident','avlWithdraw','depoFee','adused','mrused','bankAvlBalance','pp0','balance']if k in row}})
 if api=='4.14'and isinstance(data,dict):
  for i,row in enumerate(data.get('stock',[])):
   if row.get('symbol')=='FPT':fpt.append({'reference':'sqlite:data/vn30.sqlite#broker_observation/body_hash/'+h,'sha256':h,'receivedAt':received,'pointer':f'/data/stock/{i}','fields':{k:str(row[k])for k in ['symbol','totalQtty','availableTrading','stockDividend','costPrice']if k in row}})
rawroot=R/'data/market-source/tcbs/2026-10-21T02-45-03.359Z-unified';manifest=json.loads((rawroot/'capture.json').read_text());raws=[]
for api in ['4.14','4.15']:
 p=rawroot/(api+'.raw.json');raw=p.read_bytes();x=json.loads(raw);entry=next(r for r in manifest['requests']if r['apiId']==api);assert entry['sha256']==sha(raw)
 if api=='4.15':fields={k:str(x['data'][0][k])for k in ['cashBalance','cashDevident','avlWithdraw','depoFee','adused','mrused','bankAvlBalance','balance']};pointer='/data/0'
 else:fields={'pendingByIssuer':{row['symbol']:str(row['cashDividend'])for row in x['stock']if row.get('cashDividend')},'FPT':[{k:str(row[k])for k in ['totalQtty','availableTrading','stockDividend','costPrice']}for row in x['stock']if row['symbol']=='FPT']};pointer='/stock'
 raws.append({'reference':str(p.relative_to(R)),'sha256':sha(raw),'retrievedAt':entry['retrievedAt'],'pointer':pointer,'fields':fields})
out('CASH_SOURCE_TRACE.json',{'sqlCashObservations':sorted(cash,key=lambda x:x['receivedAt']),'rawCurrentObservations':raws,'finding105':'depoFee=105 and cashBalance-avlWithdraw=105 on08Oct, no adused/mrused; PDF liability linkage still requires broker explanation, not amount-only acceptance','findingPending':'21Oct cash4.15 cashDevident475000 versus stock4.14 GAS475000+MWG95000; endpoint conflict, not accepted settlement linkage','residual500000':'UNKNOWN exact category; no fabricated classification'})
out('FPT_STATUS_TRACE.json',{'observations':sorted(fpt,key=lambda x:x['receivedAt']),'latestRetainedAccountRaw':raws[0],'conversionDate':'UNKNOWN','currentStatusAsOf27Oct':'NOT_VERIFIED','scope':'Observations prove200available20pending at retained times only; not an accepted continuity interval or eventual conversion date'})
dossier=R/'docs/fundamental-data-engine/evidence/2026-10-26-m8-identity-bridge-evidence-preparation/IDENTITY_BRIDGE_CANDIDATES.json';x=json.loads(dossier.read_text());ident=[]
for d in x['evidenceDossiers']:
 m=d['market'];ident.append({'ledgerSecurityId':d['ledgerSecurityId'],'quantity':d['ledgerQuantity'],'marketUUID':m['marketUUID'],'code':m['providerInstrumentCode'],'isin':m['isin'],'venue':m['exchange'],'class':m['securityClass'],'marketEvidence':m['masterEvidence'],'originalLedgerEvidence':d['ledgerTransactions'],'accountSpecificStableIdentity':False,'gaps':d['missingEvidence'],'status':'EXTERNAL_EVIDENCE_REQUIRED'})
assert len(ident)==11;out('SOURCE_IDENTITY_GAP_MATRIX.json',{'source':str(dossier.relative_to(R)),'sourceHash':sha(dossier.read_bytes()),'holdings':ident,'acceptedMappingsCreated':0})
# Consistent SQLite backup: disposable private copy only, never mutate source.
os.umask(0o077);work=Path(tempfile.mkdtemp(prefix='vn30-phase22-migration-',dir='/private/tmp'));(work/'data').mkdir();backup=work/'backup.sqlite';target=work/'data/vn30.sqlite'
def snapshot(c):
 tables={}
 for(name,)in c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"):
  rows=c.execute('SELECT * FROM "'+name.replace('"','""')+'"').fetchall(); encoded=sorted(json.dumps(row,ensure_ascii=False,default=lambda b:b.hex(),separators=(',',':'))for row in rows);tables[name]={'count':len(rows),'sha256':sha(('\n'.join(encoded)).encode())}
 objects={name:sha(sql.encode())for name,sql in c.execute("SELECT name,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'")}
 return {'tables':tables,'objects':objects}
try:
 originalHash=sha((R/'data/vn30.sqlite').read_bytes());before=snapshot(source)
 b=sqlite3.connect(backup);source.backup(b);b.close();c=sqlite3.connect(target);b=sqlite3.connect('file:'+str(backup)+'?mode=ro',uri=True);b.backup(c);b.close();assert snapshot(c)==before
 migrations=[R/'prisma/migrations'/n/'migration.sql'for n in ['202610270001_dividend_settlement','202610270002_forward_intake']]
 # Force a failure during the table rebuild, then verify transactional recovery.
 try:c.executescript(migrations[0].read_text().replace('COMMIT;','SELECT definitely_missing_rollback_probe();\nCOMMIT;'))
 except sqlite3.Error:c.rollback()
 else:raise AssertionError('rollback fault not injected')
 assert snapshot(c)==before
 c.executescript(migrations[0].read_text());stage21=snapshot(c)
 try:c.executescript(migrations[1].read_text().replace('COMMIT;','SELECT definitely_missing_phase22_probe();\nCOMMIT;'))
 except sqlite3.Error:c.rollback()
 else:raise AssertionError('phase22 rollback fault not injected')
 assert snapshot(c)==stage21
 c.executescript(migrations[1].read_text());after=snapshot(c)
 assert all(after['tables'][k]==v for k,v in before['tables'].items())
 changedObjects=[n for n,h in before['objects'].items()if after['objects'].get(n)!=h];assert changedObjects==['ledger_transaction'] or set(changedObjects)=={'ledger_transaction'},changedObjects
 assert not c.execute('PRAGMA foreign_key_check').fetchall();assert c.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
 assert after['tables']['ledger_transaction']['count']==12 and after['tables']['ledger_leg']['count']==24
 c.close()
 # Current domain constructor + original ordered legs and portfolio projection on migrated copy.
 replay=subprocess.run(['/private/tmp/node-v22.23.2-darwin-arm64/bin/node','--loader','/private/tmp/m8-accounting-ro-loader.mjs','/private/tmp/m8-accounting-ro.mjs'],cwd=work,capture_output=True,text=True);assert replay.returncode==0,replay.stderr
 shutil.copyfile('/private/tmp/m8-accounting-ro-results.json',T/'migrated-copy-ledger-replay.json')
 # Restore verified backup to a separate fresh target and compare original schema+all rows.
 restore=sqlite3.connect(work/'restore.sqlite');b=sqlite3.connect('file:'+str(backup)+'?mode=ro',uri=True);b.backup(restore);b.close();assert snapshot(restore)==before;restore.close()
 assert sha((R/'data/vn30.sqlite').read_bytes())==originalHash
 out('MIGRATION_REHEARSAL_RESULTS.json',{'status':'PASS_DISPOSABLE_ACTUAL_COPY_ONLY','productionRecommendation':'NO_GO_PENDING_SEPARATE_AUTHORIZATION_AND_OPERATIONAL_ACCEPTANCE','productionDatabaseSha256':originalHash,'backupIntegrity':'PASS_ALL_TABLE_AND_SCHEMA_HASHES','restoreIntegrity':'PASS_ALL_TABLE_AND_SCHEMA_HASHES','injectedMigrationFailureRollback':'PASS_PHASE21_ORIGINAL_SCHEMA_AND_CONTENT_RESTORED','phase22InjectedFailureRollback':'PASS_PHASE21_STATE_AND_ALL_ORIGINAL_DATA_RESTORED','originalTransactions':12,'originalLegs':24,'allOriginalTableContentsUnchanged':True,'originalTableHashes':before['tables'],'changedOriginalSchemaObjects':changedObjects,'oldIndexesAndTriggersUnchanged':True,'foreignKeyViolations':0,'sqliteIntegrity':'ok','legacyReplayOnMigratedActualCopy':'PASS','migrations':[{'path':str(p.relative_to(R)),'sha256':sha(p.read_bytes())}for p in migrations],'productionMigrationExecuted':False,'rawBackupCommitted':False,'privateDisposableFilesRemoved':True})
finally:
 source.close();shutil.rmtree(work)
print('PASS: exact financial source traces,11identity gaps; disposable actual-copy backup/migration/fault rollback/restore/legacy replay; source database unchanged')
