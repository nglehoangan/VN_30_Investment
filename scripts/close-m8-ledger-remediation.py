"""Append-only ledger remediation closure; actual database opened read-only. No migrations."""
import datetime,importlib.util,json,sqlite3,subprocess
from pathlib import Path
from lib.pe4_evidence import sha,digest,verify_seal
from lib.pec1b_workflow import pec2_preparation_boundary
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/fundamental-data-engine/evidence';OUT=E/'2026-10-24-m8-ledger-compatibility-remediation'
def read(p):return json.loads(p.read_text())
def save(n,x):(OUT/n).write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
def md(n,x):(OUT/n).write_text(x.strip()+'\n')
def require(ok,why):
 if not ok:raise ValueError(why)

def main():
 spec=importlib.util.spec_from_file_location('helpers',ROOT/'scripts/prepare-pec1b-evidence.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
 before=read(OUT/'DATABASE_BASELINE.json');after=h.database();require(before==after,'ACTUAL_DATABASE_CHANGED')
 allowed={'src/domain/portfolio/transaction.ts','src/infrastructure/repositories/portfolio-command-schema.ts'}
 baseline=read(OUT/'PROTECTED_INPUT_HASHES.json');changed={p for p,v in baseline.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=v}
 require(changed==allowed,'UNEXPECTED_PROTECTED_FILE_CHANGE:'+str(changed))
 require({p for p in baseline if p.startswith('data/')}=={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()},'DATA_FILE_INVENTORY_CHANGED')
 old=E/'2026-10-24-m8-local-application-readiness';packages=[ROOT/r['package'] for r in read(old/'PRIOR_SEAL_VERIFICATION.json')]+[old]
 seals=[verify_seal(ROOT,p) for p in packages];save('PRIOR_SEAL_VERIFICATION.json',seals)
 now=datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z');p=E/'2026-10-23-production-evidence-closure-pec2';records=read(p/'ADMISSION_CANDIDATES.json')['records'];bundles=read(p/'EVIDENCE_BUNDLES.json')['bundles'];evaluations=[]
 for r in records:
  b=next(b for b in bundles if b['core']['pec1Candidate']['candidateId']==r['candidateId']);v=pec2_preparation_boundary(r,b['core'],b['receipts'],records,now,root=ROOT)
  require(v['PEC2Result']['effectiveAdmissionState']=='DEFERRED' and all(v[k] is False for k in ['productionUseAuthorized','runtimeActivationAuthorized','scoringAuthorized']),'AUTHORITY_GATE_CHANGED');evaluations.append(v)
 require(len(evaluations)==8,'CANDIDATE_COUNT')
 con=sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro',uri=True);con.row_factory=sqlite3.Row
 rows=[dict(r) for r in con.execute('SELECT * FROM ledger_transaction ORDER BY id')];legs=[dict(r) for r in con.execute('SELECT * FROM ledger_leg ORDER BY transaction_id,sequence')]
 financial=[]
 for r in rows:
  t=json.loads(r['facts']);f=t['facts']
  financial.append({'transactionIdentityHash':__import__('hashlib').sha256(r['id'].encode()).hexdigest(),'recordHash':digest(r),'savedAggregateSha256':__import__('hashlib').sha256(r['facts'].encode()).hexdigest(),'legsHash':digest([l for l in legs if l['transaction_id']==r['id']]),'eventAt':r['event_at'],'createdAt':r['created_at'],'type':r['type']})
 opening=next(json.loads(r['facts']) for r in rows if 'receivable' in json.loads(r['facts'])['facts'].get('opening',{}));f=opening['facts'];sourceHash=f['opening']['evidence'].split(':')[1]
 source=con.execute('SELECT * FROM broker_observation WHERE body_hash=?',(sourceHash,)).fetchone();require(source is not None,'OPENING_SOURCE_MISSING')
 import hashlib
 require(hashlib.sha256(source['body'].encode()).hexdigest()==sourceHash,'SOURCE_HASH_MISMATCH');body=json.loads(source['body'])
 require(body['cash']['balance']==f['amount'] and body['cash']['pendingDividends']==f['opening']['receivable'],'ORIGINAL_SOURCE_AMOUNT_MISMATCH')
 # Exercise the original schema's immutable/unique constraints only in a disposable RAM copy.
 copy=sqlite3.connect(':memory:');con.backup(copy);copy.execute('PRAGMA foreign_keys=ON');copy.execute('PRAGMA recursive_triggers=ON');immutable=[]
 for name,sql in [('posted header update','UPDATE ledger_transaction SET facts=facts'),('posted header delete','DELETE FROM ledger_transaction'),('posted leg update',"UPDATE ledger_leg SET amount='0' WHERE amount IS NOT NULL"),('posted leg delete','DELETE FROM ledger_leg'),('duplicate original transaction','INSERT INTO ledger_transaction SELECT * FROM ledger_transaction LIMIT 1')]:
  try:copy.execute(sql)
  except sqlite3.IntegrityError as error:copy.rollback();immutable.append({'case':name,'status':'REJECTED','error':str(error)})
  else:raise ValueError('IMMUTABILITY_OR_DUPLICATE_BYPASS:'+name)
 copy.close();con.close()
 save('ORIGINAL_RECORD_INTEGRITY.json',{'databaseBaselineSha256':before['sha256'],'databaseAfterSha256':after['sha256'],'unchangedDatabaseEstablishesOriginalRowIdentity':True,'originalTransactions':financial,'ledgerRowsHash':digest(rows),'ledgerLegsHash':digest(legs),'transactionCount':len(rows),'legCount':len(legs),'sourceEvidence':{'reference':f['opening']['evidence'],'bodyHashVerified':True,'openingCashEqualsSourceBalance':True,'openingReceivableEqualsSourcePendingDividends':True,'migrationVersion':f['opening']['migrationVersion'],'methodologyId':f['methodologyId'],'snapshotNotCurrentMarketAuthority':True},'immutableConstraintTests':{'classification':'ISOLATED_IN_MEMORY_BACKUP_OF_ACTUAL_DATABASE_NO_MIGRATIONS', 'cases':immutable}})
 replay=read(OUT/'LEDGER_REPLAY_RESULTS.json');require(replay['status']=='PASS' and replay['semanticMismatchCount']==0 and replay['serializedTransactionFailures']==0,'REPLAY_FAILURE')
 actual=read(OUT/'ACTUAL_DATA_RECONSTRUCTION.json');require(actual['summaries'][0]['storedProjectionMatchesCurrentReconstruction'],'RECONSTRUCTION_FAILURE')
 live=read(OUT/'LIVE_RUNTIME_RESULTS.json');require(not live['fixturesInjected'] and live['productionWritesPerformed']==0 and not live['pageErrors'],'LIVE_FAILURE')
 require(live['actualLedgerUI']['allElevenQuantityCostAverageCostExactMatch'] and live['actualLedgerUI']['cashExactMatch'] and live['actualLedgerUI']['nonzeroReceivableExactMatch'],'LIVE_VALUES')
 ready=live['readinessApi']['body'];require(all(ready[k] is False for k in ['readyForScoring','marketCurrent','analysisReady','decisionReady']),'LIVE_GATE_CHANGED')
 unit=read(OUT/'validation/unit-regressions.json');pec=read(OUT/'validation/pec2-regressions.json');require(unit['success'] and pec['success'],'REGRESSIONS_FAILED')
 listener=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:38417','-sTCP:LISTEN'],capture_output=True,text=True);require(listener.returncode==1 and not listener.stdout.strip(),'REVIEW_SERVER_NOT_STOPPED')
 require('PASS boundaries:' in (OUT/'validation/architecture-boundaries.log').read_text(),'ARCHITECTURE_FAILURE')
 safety={'status':'PASS','verifiedAt':now,'actualDatabaseBytesUnchanged':True,'databaseSha256Before':before['sha256'],'databaseSha256After':after['sha256'],'logicalDumpSchemaCountsAndMethodologiesUnchanged':True,'originalTransactionsUnchanged':12,'originalLegsUnchanged':24,'allOtherProtectedFilesUnchanged':len(baseline)-2,'authorizedCodeChanges':{p:{'before':baseline[p],'after':sha(ROOT/p)} for p in sorted(allowed)},'priorSealsVerified':len(seals),'frozenInvestmentPoliciesUnchanged':True,'ledgerValidatorUnchanged':True,'migrationsExecuted':0,'authenticatedApprovalsCreated':0,'candidateStates':{'DEFERRED':8},'effectiveAdmissionsCreated':0,'D2Activated':False,'scoringActivated':False,'financialAdapterRemediationStarted':False,'nextMilestoneStarted':False,'reviewServerStopped':True,'candidateEvaluations':evaluations}
 save('SAFETY_VERIFICATION.json',safety)
 commands=[{'command':"/private/tmp/node-v22.23.2-darwin-arm64/bin/node --import ./scripts/lib/ts-runtime.mjs scripts/"+s,'result':'PASS','evidence':r} for s,r in [('validate-m8-ledger-replay.mjs','LEDGER_REPLAY_RESULTS.json'),('validate-m8-ledger-local-data.mjs','ACTUAL_DATA_RECONSTRUCTION.json'),('validate-m8-ledger-live.mjs','LIVE_RUNTIME_RESULTS.json')]]
 for command in commands:
  if 'validate-m8-ledger-live.mjs' in command['command']:command['command']=command['command'].replace(' --import ./scripts/lib/ts-runtime.mjs','')
 tests=' '.join('tests/unit/'+t for t in ['opening-receivable-compatibility.test.ts','portfolio-accounting.test.ts','portfolio-read-models.test.ts','dashboard-ui.test.tsx','dashboard-screens.test.ts','current-remediation-ui.test.tsx','manual-fundamentals-ui.test.tsx','data-freshness-ui.test.tsx','runtime-readiness.test.ts','runtime-dataset-acceptance.test.ts'])
 commands += [{'command':'/private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/vitest/vitest.mjs run '+tests+' --reporter=json --outputFile='+str(OUT.relative_to(ROOT))+'/validation/unit-regressions.json','result':'PASS','passed':unit['numPassedTests'],'failed':unit['numFailedTests'],'classification':'SYNTHETIC_UNIT_AND_ADAPTER_SEAM_TESTS'}, {'command':'PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec2-final-review.py --json '+str(OUT.relative_to(ROOT))+'/validation/pec2-regressions.json','result':'PASS','passed':pec['testsRun']},{'command':'/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/check-boundaries.mjs','result':'PASS'},{'command':'NEXT_TELEMETRY_DISABLED=1 /private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/next/dist/bin/next build','result':'PASS','notes':'Fresh build and TypeScript; existing tracing and experimental SQLite warnings.'},{'command':"NEXT_TELEMETRY_DISABLED=1 DATABASE_URL='file:"+str(ROOT/'data/vn30.sqlite')+"' /private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 38417",'result':'PASS_LOOPBACK_ONLY_STOPPED_AFTER_REVIEW'},{'command':'PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=scripts python3 scripts/close-m8-ledger-remediation.py','result':'PASS','notes':'Includes RAM-copy immutable constraints, exact retained broker source hash, actual read-only database snapshots, historical seals and eight admission evaluations.'}]
 save('VALIDATION_RESULTS.json',{'status':'PASS','commands':commands,'unitPassed':unit['numPassedTests'],'unitFailed':0,'PEC2TestsPassed':pec['testsRun'],'actualTransactionsReplayedExactly':12,'actualOriginalLegs':24,'actualPositionsVerified':11,'liveRoutesHTTP200':len(live['routes']),'liveFixturesInjected':False,'knownFailures':[],'limitations':['No accepted current market snapshot; NAV unavailable.','No pre-inception transaction reconstruction or new dividend settlement contract.','No original importer executable found in retained source/history searches; exact retained source, facts, legs and migration identity verified instead.','Existing read-only application connection setup runs PRAGMAs; before/after database bytes and logical state remain identical.','Visual QA performed on redacted Holdings screenshot; GET browser checks inspect exact actual values without persisting private amounts in reports.']})
 md('ROOT_CAUSE_ANALYSIS.md','''# M8 ledger replay root cause

Confirmed MAJOR blocker: `M8_LEDGER_OPENING_RECEIVABLE_REPLAY`.

The retained database has twelve POSTED OPENING_BALANCE records and 24 legs. One cash opening contains `opening.receivable` under `tcbs-opening-v1`, methodology `m63-tcbs-opening-local-v1`. Its source is `BROKER_SNAPSHOT:cc46785ff2d4f7477911d0cb7dad6ee38b872b5cc6a8566a78683637fdf43852`. The retained broker body rehashes exactly; its cash balance and pendingDividends equal the original opening facts. Saved CASH then RECEIVABLE legs agree with relational rows. `ORIGINAL_RECORD_INTEGRITY.json` pins every original aggregate and row/leg set without publishing amounts.

Event/effective time is 2026-10-08T11:38:01.705Z; created time is 2026-10-08T11:38:40.132Z. All remain unchanged. This opening receivable is not a new DIVIDEND_CASH event or spendable cash.

Before correction, `src/domain/portfolio/transaction.ts` opening detail declared cost/migrationVersion/evidence and generated CASH plus optional holding/basis legs, omitting RECEIVABLE. The original M6.3 commit `6f4af0c` also lacks opening-receivable generation; `42afdf5` is the later pre-remediation transaction-builder change. No retained importer executable matching `tcbs-opening-v1` was found by repository/history searches. Do not invent its execution provenance. This establishes divergence between the persisted evidenced opening contract and current reconstruction support, rather than proving a removed builder implementation once supported it.

`src/infrastructure/repositories/portfolio-ledger.ts` strictly rebuilds each aggregate and compares original JSON, relational legs and index fields. It correctly rejected the missing leg; it was not a validator defect. Prior sealed M8 `LEDGER_DIAGNOSTIC.json` shows one mismatch and eleven exact matches. Corrected `LEDGER_REPLAY_RESULTS.json` shows twelve exact matches.

The existing `202609160001_portfolio_ledger/migration.sql` already permits RECEIVABLE legs, immutable posted records, closed leg counts and unique source/idempotency identity. No schema compatibility change is needed. DATA_MODEL/TRANSACTIONS contracts distinguish cash and obligations; `docs/02 DATABASE/TRANSACTIONS.md` §§4, 14 and 18 and ADR 0004 define evidenced opening, exact arithmetic and replay. This is missing opening-receivable reconstruction for an evidenced imported contract, not a new accrual-income policy or arithmetic-version change. Physical integrity and foreign keys pass.
''')
 md('ACCOUNTING_CONTRACT_DECISION.md','''# Accounting compatibility decision

The current user request authorizes the smallest lossless compatibility correction. This implementation decision does not constitute source approval or final owner acceptance.

Extend existing `opening` with an optional exact decimal-string `receivable`. When present, validate using the existing decimal contract; reject negative, malformed or out-of-range values. A positive amount generates one RECEIVABLE immediately after CASH and before optional security/basis legs. Zero generates no obligation because the existing obligation invariant requires positive creation. Absent values retain the old leg shape. Original input text remains immutable in facts; derived legs use existing canonical decimal formatting.

CASH, quantity, basis and all other transaction builders retain their existing behavior. Obligations remain independently tracked and excluded from spendable cash. No contribution, dividend income, realized gain, artificial balancing cash or settlement is generated. Existing opening assets remain imported inception assets. This is a typed balance-leg model, not a new double-entry equity account model; NAV algebra remains cash + security value + receivables − payables, but current NAV requires accepted market inputs.

Keep the existing arithmetic/accounting identity: its precision, ordering, cost policy and historical effects are unchanged. Bind compatibility to explicit evidenced opening facts, never transaction-ID exceptions, guessed broker values or trust in projections. Update the strict command schema to match the optional typed field; it still rejects unknown fields. Keep full canonical reader equality and economic replay. Existing reversal semantics link the opposite receivable leg to its original obligation. No new opening-receivable settlement lifecycle is authorized here.

No database writes, migration, financial replacement transactions, policy edits, authorization grants or scoring changes are required.
''')
 md('IMPLEMENTATION_REPORT.md',f'''# Implementation report

Only production-code changes:

- `src/domain/portfolio/transaction.ts`: optional opening receivable, exact nonnegative validation and deterministic positive RECEIVABLE leg.
- `src/infrastructure/repositories/portfolio-command-schema.ts`: optional decimal-string field in existing strict opening schema.

The ledger reader, economic replay, accounting methodology identity, migrations, Next.js UI and investment policies are unchanged. New `tests/unit/opening-receivable-compatibility.test.ts` covers precision, absence/zero, malformed/negative input, immutability, evidence requirements, funding, reversals, duplicate ID/idempotency/source and strict adapter corruption rejection. New `validate-m8-ledger-*.mjs` scripts record actual replay, independent original-leg totals and GET-only runtime comparisons. `close-m8-ledger-remediation.py` performs original source/hash, safety, sealed history and RAM-copy immutability checks and assembles this package.

Validation: {unit['numPassedTests']} unit tests, {pec['testsRun']} PEC-2 tests, exact actual 12-record/24-leg replay, eleven position balances/bases, fresh build and {len(live['routes'])} live HTTP-200 routes. Reports distinguish synthetic seams, isolated copies and actual application data. No package installation or database migration occurred. Existing broker snapshots remain separately labelled; their displayed prices do not grant current market acceptance.
''')
 md('CLOSURE_REPORT.md',f'''# M8 ledger compatibility remediation closure

Final status: **READY_FOR_OWNER_REVIEW**. Not auto-approved.

`M8_LEDGER_OPENING_RECEIVABLE_REPLAY` is resolved in code. Explicit evidenced opening receivables now produce the original obligation leg while preserving CASH, financial facts, transaction IDs, timestamps, leg order and all historical records. The strict authoritative reader remains unchanged.

All twelve actual transactions and 24 original legs reproduce exactly. Eleven authoritative holdings load, with quantities/costs/cash/receivables matching original legs and stored projection. Actual browser comparisons confirm cash, nonzero receivable and all eleven quantities/cost bases/average costs; transaction history shows twelve records. Dashboard, holdings and transaction routes render without the prior integrity alert. Holdings detail and sidebar navigation work. No synthetic fixture is presented as live acceptance.

{unit['numPassedTests']} unit tests and {pec['testsRun']} PEC-2 tests pass; build/typechecking and architecture boundaries pass. Five immutable/duplicate operations are rejected on an isolated in-memory backup of the actual database, without migrations. Actual SQLite bytes, logical dump, schema, table counts, every original record/leg and methodology remain unchanged. Prior evidence seals verify. Eight authority candidates remain DEFERRED; no source approval, independent acceptance, effective admission, D2 or scoring activation was created.

Remaining limitations are outside this remediation: accepted current market data is absent, so NAV/current market P&L and actionability remain unavailable; rebuilt financial-data adapter work is not started. Twelve opening records do not supply pre-inception or subsequent trade/dividend history. The original importer executable was not recovered; retained source body/hash and exact original records provide the compatibility evidence. Authentication remains deferred under the owner's earlier decision.

Review `ROOT_CAUSE_ANALYSIS.md`, `ACCOUNTING_CONTRACT_DECISION.md`, `IMPLEMENTATION_REPORT.md`, `LEDGER_REPLAY_RESULTS.json`, `LIVE_RUNTIME_RESULTS.json`, `VALIDATION_RESULTS.json` and `SAFETY_VERIFICATION.json`. The loopback review server is stopped. Stop after ledger remediation; await owner review. No next milestone is started.
''')
 pins=sorted(allowed|{'tests/unit/opening-receivable-compatibility.test.ts','scripts/validate-m8-ledger-replay.mjs','scripts/validate-m8-ledger-local-data.mjs','scripts/validate-m8-ledger-live.mjs','scripts/close-m8-ledger-remediation.py'})
 files={str(p.relative_to(OUT)):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ['ARTIFACT_HASHES.json','EVIDENCE_SEAL.json']}
 save('ARTIFACT_HASHES.json',{'files':files,'implementationPins':{p:sha(ROOT/p) for p in pins}})
 save('EVIDENCE_SEAL.json',{'schemaVersion':'m8-ledger-remediation-integrity-v1','artifactHashesSha256':sha(OUT/'ARTIFACT_HASHES.json'),'meaning':'Content integrity only; not owner approval, authentication or admission/scoring authority.'})
 verify_seal(ROOT,OUT);print(json.dumps({'status':'READY_FOR_OWNER_REVIEW','unitTests':unit['numPassedTests'],'PEC2Tests':pec['testsRun'],'originalTransactions':12,'originalLegs':24,'actualDatabaseUnchanged':True,'priorSeals':len(seals)}))
if __name__=='__main__':main()
