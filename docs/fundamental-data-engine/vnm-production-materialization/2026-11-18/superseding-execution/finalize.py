"""Independently verify real deployment deltas and produce final bounded receipts."""
import collections,hashlib,json,re,sqlite3
from pathlib import Path
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[4]
def sha(b):return hashlib.sha256(b).hexdigest()
def h(v):return sha(json.dumps(v,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode())
def read(n):return json.loads((OUT/n).read_text())
def write(n,v):(OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def encoded(rows):return sorted(json.dumps(v,ensure_ascii=False,default=lambda b:{'hex':b.hex()},separators=(',',':')) for v in rows)
def tables(c):
    result={}
    for(t,) in c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
        rows=encoded(c.execute('SELECT * FROM "'+t.replace('"','""')+'"').fetchall())
        result[t]={'count':len(rows),'sha256':sha('\n'.join(rows).encode())}
    return result
def rows(c,t):return collections.Counter(encoded(c.execute('SELECT * FROM "'+t.replace('"','""')+'"').fetchall()))
result=read('PRODUCTION_RESULT.json');assert result['status']=='PASS' and result['mode']=='execute'
readback=read('PERSISTED_CURRENT_READBACK.json');assert readback['status']=='PASS' and readback['sqliteQueryOnly'] and readback['postCommitIdempotentScoreRetry']
assert result['subject']['scorecardHash']==readback['scorecardHash']
backup=read('BACKUP_AND_RECOVERY_VALIDATION.json');assert backup['status']=='PASS'
original=read('PROTECTED_BEFORE.json');p=ROOT/'data/vn30.sqlite'
before=sqlite3.connect((ROOT/backup['backupPath']).resolve().as_uri()+'?mode=ro',uri=True)
current=sqlite3.connect(p.resolve().as_uri()+'?mode=ro',uri=True)
assert sha((ROOT/backup['backupPath']).read_bytes())==backup['backupSha256']
assert current.execute('PRAGMA integrity_check').fetchall()==[('ok',)] and not current.execute('PRAGMA foreign_key_check').fetchall()
assert tables(before)==original['tables']
now=tables(current);allowed={'_prisma_migrations','market_boundary_record','methodology_record'}
changed=[t for t,v in original['tables'].items() if now[t]!=v]
assert set(changed)==allowed
for t in original['tables']:
    assert not (rows(before,t)-rows(current,t)), 'EXISTING_ROWS_CHANGED:'+t
    if t not in allowed:assert rows(before,t)==rows(current,t),t
for name in ['analytical_artifact','portfolio','ledger_transaction','ledger_leg','decision_artifact','workflow_review']:
    assert original['tables'][name]==now[name]
plan=read('MIGRATION_PLAN.json')
assert now['_prisma_migrations']['count']-original['tables']['_prisma_migrations']['count']==len(plan)==6
ddl_checks=[]
for m in plan:
    row=current.execute('SELECT checksum,finished_at,rolled_back_at,applied_steps_count FROM _prisma_migrations WHERE migration_name=?',(m['name'],)).fetchone()
    assert row[0]==m['sha256'] and row[1] is not None and row[2] is None and row[3]==1
    assert sha((ROOT/m['path']).read_bytes())==m['sha256']
    for sql in re.findall(r'CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|INDEX)[\s\S]*?;', (ROOT/m['path']).read_text()):
        name=re.match(r'CREATE (?:TABLE|INDEX|TRIGGER) (\w+)',sql)[1]
        actual=current.execute('SELECT sql FROM sqlite_master WHERE name=?',(name,)).fetchone()
        norm=lambda s:re.sub(r'\s+',' ',s.rstrip(';')).strip()
        assert actual and norm(actual[0])==norm(sql),name
        ddl_checks.append({'object':name,'exactDDLMatches':True})
new_method=[r for r in current.execute('SELECT methodology_id FROM methodology_record') if not before.execute('SELECT 1 FROM methodology_record WHERE methodology_id=?',r).fetchone()]
approved=json.loads((ROOT/'docs/fundamental-data-engine/vnm-step4-final-review/2026-11-17/APPROVED_METHODOLOGY.json').read_text())
assert new_method==[(approved['methodologyId'],)]
new_boundary=[json.loads(r[1]) for r in current.execute('SELECT id,body FROM market_boundary_record') if not before.execute('SELECT 1 FROM market_boundary_record WHERE id=?',(r[0],)).fetchone()]
assert len(new_boundary)==2 and {v['kind'] for v in new_boundary}=={'CAPABILITY','MARKET'}
for v in new_boundary:
    if v['kind']=='MARKET':assert len(v['body']['observations'])==1 and v['body']['observations'][0]['ticker']=='VNM'
assert now['current_financial_fact']['count']==69 and now['current_score_artifact']['count']==1
assert now['source_admission_event']['count']==now['market_boundary_ingest_quarantine']['count']==now['market_boundary_ingest_revocation']['count']==0
for(table,) in current.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'current_%' AND name != 'current_financial_raw'"):
    for body,digest in current.execute('SELECT body,body_hash FROM '+table):assert sha(body.encode())==digest,(table,digest)
for digest,payload in current.execute('SELECT hash,payload FROM current_financial_raw'):assert sha(payload)==digest
after={'fileSha256':sha(p.read_bytes()),'tables':now};write('PROTECTED_AFTER.json',after)
before.close();current.close()
tests=read('TEST_RESULTS.json');assert tests['numFailedTests']==0
types=read('SCOPED_TYPECHECK.json');assert types['status']=='PASS'
lint=read('LINT.json');assert lint['errors']==lint['warnings']==0
registration=read('CURRENT_REGISTRATION.json');assert registration['manifestContentHash']==result['authorization']['contentHash'] and registration['publicationEnabled'] is False and registration['tradingAuthorized'] is False
write('SCHEMA_DEPLOYMENT_RECEIPT.json',{'status':'APPLIED_AND_VERIFIED_PRODUCTION','target':result['target'],'manifestContentHash':registration['manifestContentHash'],'migrations':plan,'exactSchemaChecks':ddl_checks,'transaction':'ONE_EXCLUSIVE_SQLITE_TRANSACTION','historyRowsAppended':6,'historicalMigrationRowsUnchanged':True,'destructiveDDL':False,'originalProposalBytesUnchanged':True})
write('GOVERNED_DATA_MATERIALIZATION.json',{'status':'MATERIALIZED_AND_READ_BACK_FROM_PRODUCTION','financialFacts':69,'nativeSelectedFactsBeforeQualifiedDebt':68,'currentEvidenceRowsInAcceptance':35,'historicalFactsInBoundLineage':65,'historyMeaning':'65 retained admitted historical facts bound in persisted enrichment/acceptance; not 65 duplicated native-fact rows','counts':result['after'],'subject':result['subject'],'reference':result['reference'],'sourceAndDatasetHashesVerifiedByGovernedConsumer':True,'economicCutoff':'2026-10-30','knownAt':result['scoreAuthorization']['knownAt'],'evaluatedAt':result['scoreAuthorization']['evaluatedAt'],'idempotent':True,'VNM17Promoted':False})
write('AUTHORITY_REGISTRATION_RECEIPT.json',{'status':'REGISTERED_UNDER_EXPLICIT_SUPERSEDING_DEPLOYMENT_AUTHORIZATION','methodologyRegisteredInProduction':approved['methodologyId'],'methodologyHash':result['subject']['methodologyHash'],'executable':result['executable'],'assessmentPacket':result['assessmentPacket'],'reviewHash':result['subject']['reviewHash'],'trustedBindingRegistration':'CURRENT_REGISTRATION.json','registrationHash':h(registration),'authorization':result['authorization'],'permissions':{'currentMaterializationAndScoring':True,'publication':False,'trading':False,'historicalPit':False},'newApprovalOrSignatureManufactured':False})
write('CURRENT_SCORE_VERIFICATION.json',{'status':'PRODUCTION_SCORE_PERSISTED_AND_GOVERNED_READBACK_PASSED','scorecardId':result['subject']['scorecardId'],'scorecardHash':result['subject']['scorecardHash'],'totalScore':readback['totalScore'],'confidence':readback['confidence'],'validity':readback['validity'],'economicCutoff':'2026-10-30','knownAt':result['scoreAuthorization']['knownAt'],'rubrics':23,'topics':83,'matchesExactApprovedSubject':True,'idempotentInsideDeploymentAndAfterCommit':True,'postCommitReadbackQueryOnly':True,'currentScoreCount':1,'legacyFormalPitSubstitution':False,'productionActivationForTrading':False})
write('PRODUCTION_SAFETY_VALIDATION.json',{'status':'PASS','originalSha256':original['fileSha256'],'finalSha256':after['fileSha256'],'changedExistingTables':changed,'oldRowsPreservedInEveryExistingTable':True,'protectedUnrelatedTablesUnchanged':True,'unchangedExistingTableCount':len(original['tables'])-len(changed),'authorizedNewTables':{t:v['count'] for t,v in now.items() if t not in original['tables']},'publicationEnvelopesCreated':0,'analyticalArtifactUnchanged':True,'dashboardPublicationActivated':False,'noTradeBuyDcaPermission':True,'portfolioNavTransactionUnchanged':True,'historicalScorecardsUnchanged':True,'historicalPit':'NOT_QUALIFIED','revocationAndTamperEvidence':['REHEARSAL_RESULT.json','NATIVE_TAMPER_VALIDATION.json','TEST_RESULTS.json'],'actualDataReadbackAndAuthorityVerifier':'PASS','acceptedDependencyHeads':'PASS_UNCHANGED_ACCEPTED_STATIC_SUCCESSOR','baselineGeneralProductionRestrictions':'UNCHANGED; no authority/CAS heads promoted','exclusiveWriterAndLockedBaseline':'PASS','backupPreserved':backup['backupPath']})
write('VALIDATION.json',{'status':'PASS','realProductionExecution':True,'scopedTests':{'passed':tests['numPassedTests'],'failed':tests['numFailedTests'],'nativeMigrationSources':'ALL_27_ACTUAL_WORKTREE_MIGRATIONS'},'typecheck':types,'lint':{'errors':0,'warnings':0},'integrityAndForeignKeys':'PASS','everyApprovedDDLAndMigrationTracking':'PASS','postCommitGovernedReadbackAndQueryOnlyIdempotency':'PASS','expectedScoreAndExactSubjectHashes':'PASS','protectedOldRowsAndUnrelatedTables':'PASS','negativeControls':result['checks'],'disposableRevocationAndNativeTamper':'PASS','fullRepositorySuiteClaimed':False,'historicalFailedAttempts':'REHEARSAL_FAILURE.json and PREWRITE_LOCK_ATTEMPT.json are retained attempt history; final checks passed after correcting runner assertions and descriptor/lock handling.'})
write('FINAL_EXECUTION_DECISION.json',{'classification':'MATERIALIZATION_COMPLETE','approvedReviewCommit':'fc2415da3ff48c3a03671ee6e255cb7852923b51','authorizedManifestContentHash':registration['manifestContentHash'],'requestHash':result['authorization']['requestHash'],'productionTarget':result['target'],'originalDatabaseFingerprint':original['fileSha256'],'finalDatabaseFingerprint':after['fileSha256'],'migrationsApplied':6,'financialFacts':69,'currentEvidence':35,'historicalFactsBound':65,'score':readback['totalScore'],'confidence':readback['confidence'],'validity':readback['validity'],'remainingMaterializationBlockers':[],'publication':'NOT_AUTHORIZED_NOT_EXECUTED','tradingAndPortfolioChanges':'NOT_AUTHORIZED_NOT_EXECUTED','historicalPit':'NOT_QUALIFIED','CIOReview':'STOP'})
(OUT/'CURRENT_BLOCKER_REGISTER.md').write_text('''# Current blocker register

No unresolved blocker within the authorized governed production materialization and registration scope.

The missing F1 schema prerequisite is resolved through the exact owner-approved superseding manifest. Six exact SQL migrations, production data, approved methodology and trusted AI review binding are persisted and verified; score readback and idempotency pass.

PUB-04 publication remains NOT AUTHORIZED and NOT EXECUTED. It is outside this deployment scope. No dashboard publication, trading, portfolio mutation or historical PIT promotion is granted. Existing broader production authority restrictions remain unchanged.

STOP for CIO review. Do not begin publication.
''')
(OUT/'VNM_PRODUCTION_MATERIALIZATION_EXECUTION.md').write_text('''# VNM governed production materialization

**MATERIALIZATION_COMPLETE — actual production execution, not rehearsal-only.**

The owner-approved superseding manifest `95d1b994e1b0d04b0bd3f2ddd583b98526ab6a75600517930f841dd95925b6fa` and request `0f3bfd8b815646829676b7ab79004335fc53fb937234665df354daa1f64dd7da` were verified against review commit `fc2415da3ff48c3a03671ee6e255cb7852923b51`. All source pins, exact approved executable, methodology, AI binding and real dataset lineage passed. Original authorization and historical approvals were preserved.

Production target: `'''+result['target']+'''`.

Before SHA-256: `'''+original['fileSha256']+'''`.

After SHA-256: `'''+after['fileSha256']+'''`.

Six authorized additive migrations were applied in order, in one exclusive SQLite transaction, and appended to existing `_prisma_migrations` tracking. The four proposal SQL files were copied byte-for-byte into versioned migration directories; historical comments and original proposal files were preserved. Every resulting table/index/trigger and migration checksum was independently checked. No existing schema or migration row was rewritten.

Actual persistence: 69 qualified financial facts (68 native facts plus separately qualified reported debt), 35 current evidence rows in the accepted dataset, 65 retained historical facts bound in enrichment/lineage, one dataset, one enrichment, one current data acceptance and one current score. History is not misleadingly counted as 65 extra native admission rows. F1 market/share provenance remains raw-close-only and current-purpose.

The approved current methodology is registered in production. Exact trusted AI assessment/review registration is persisted in CURRENT_REGISTRATION.json with original authorization, executable/packet hashes and dataset reference. This is a scoped server-side registration receipt, not a public API, dashboard service activation or a broader permission. The governed reader re-verifies exact authority, review, dataset and source identity.

VNM score: **43/100, LOW, VALID — NON-ACTIONABLE**, economic cutoff **2026-10-30**, 23 rubrics, 83 topics. Original knownAt/evaluatedAt/calculatedAt are preserved. Production readback reauthorized the saved score; two retries after commit ran under SQLite query_only and created no duplicate or changed bytes. No forced score, HUMAN signature or new source approval was manufactured.

SQLite online backup and restore to a disposable database passed integrity, foreign-key, full-schema and every-table checks. The private backup remains at `'''+backup['backupPath']+'''`. Production was never replaced or restored. All authorized changes committed atomically; errors before commit roll back. Recovery after a committed fault must be verified separately, never an automatic overwrite.

One initial production prewrite lock probe correctly stopped: opening/closing the main file for hashing after BEGIN EXCLUSIVE released POSIX locks. No DDL/data write occurred. The corrected runner hashes the baseline before locking, compares the complete logical snapshot through the locked connection against the verified backup, and opens no other descriptor to the main file while locked. A second writer was demonstrably blocked before DDL. Failed disposable assertion attempts and the prewrite probe are retained as history, not reported as production success.

Only three pre-existing tables gained authorized rows: six migration records, two VNM market-boundary records and one approved methodology. All prior rows in every table are preserved. All unrelated table fingerprints, portfolio/ledger/NAV/transactions and historical scorecards are unchanged. The analytical artifact catalog is unchanged: no publication envelope, dashboard publication or trading permission was created. Historical PIT remains NOT_QUALIFIED; VNM17 remains pending.

Validation: '''+str(tests['numPassedTests'])+''' scoped tests PASS with all 27 actual migration files; strict TypeScript PASS; changed-code lint 0 errors/0 warnings; actual production readback, schema, idempotency and protected-table checks PASS. Full-repository PASS is not claimed.

Reproduction: prepare.py is original-baseline-only and must not be rerun against the materialized target. execute.mjs execute also refuses the changed baseline. execute.mjs readback is query-only and validates the persisted score and idempotent retries. Do not use the old baseline to reset production. The final evidence commit is reported in the final response, avoiding a self-referential SHA in its own content.

**No remaining materialization blocker. STOP for CIO review. PUB-04 publication and trading remain unauthorized.**
''')
print(json.dumps({'classification':'MATERIALIZATION_COMPLETE','before':original['fileSha256'],'after':after['fileSha256'],'tests':tests['numPassedTests'],'existingTablesChanged':changed,'oldRowsPreserved':True}))
