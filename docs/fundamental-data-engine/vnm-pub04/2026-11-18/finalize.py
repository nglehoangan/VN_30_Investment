import collections,hashlib,json,sqlite3,subprocess
from pathlib import Path
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[3]
def sha(b):return hashlib.sha256(b).hexdigest()
def h(v):return sha(json.dumps(v,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode())
def read(n):return json.loads((OUT/n).read_text())
def write(n,v):(OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def rows(c,t):return collections.Counter(json.dumps(v,ensure_ascii=False,default=lambda b:{'hex':b.hex()},separators=(',',':')) for v in c.execute('SELECT * FROM "'+t.replace('"','""')+'"'))
def tables(c):
 result={}
 for(t,) in c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
  values=rows(c,t);encoded=sorted(values.elements());result[t]={'count':len(encoded),'sha256':sha('\n'.join(encoded).encode())}
 return result
before=read('PROTECTED_BEFORE.json');backup=read('BACKUP_AND_RECOVERY_VALIDATION.json');ctx=read('CONTEXT.json');publication=read('PRODUCTION_PUBLICATION.json');readback=read('GOVERNED_READBACK.json');authority=read('PUB04_SERVER_REGISTRATION.json');http=read('PUB04_DASHBOARD_READBACK.json');revocation=read('HTTP_REVOCATION_VALIDATION.json');rehearsal=read('REHEARSAL.json');build=read('BUILD_VALIDATION.json')
assert publication['status']==readback['status']==http['status']==revocation['status']==rehearsal['status']==build['status']=='PASS'
assert readback['postReadbackQueryOnly'] and readback['postCommitIdempotentRetry']
assert publication['first']['duplicate'] is False and publication['second']['duplicate'] is True
assert sha((ROOT/backup['backupPath']).read_bytes())==backup['backupSha256']
old=sqlite3.connect((ROOT/backup['backupPath']).resolve().as_uri()+'?mode=ro',uri=True);current=sqlite3.connect(Path(ctx['target']).as_uri()+'?mode=ro',uri=True)
assert tables(old)==before['tables']
assert current.execute('PRAGMA integrity_check').fetchall()==[('ok',)] and not current.execute('PRAGMA foreign_key_check').fetchall()
now=tables(current);assert set(now)==set(before['tables'])
changed=[t for t in now if now[t]!=before['tables'][t]];assert changed==['analytical_artifact']
for t in now:assert not(rows(old,t)-rows(current,t)),t
assert now['analytical_artifact']['count']==before['tables']['analytical_artifact']['count']+1
assert current.execute('SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name').fetchall()==old.execute('SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name').fetchall()
pubs=[(i,b,d) for i,b,d in current.execute('SELECT id,body,body_hash FROM analytical_artifact') if json.loads(b).get('contract')=='current-read-only-publication-v1'];assert len(pubs)==1
i,body,digest=pubs[0];p=json.loads(body);assert i==authority['subject']['scorecardId'] and h(p)==digest==publication['publicationHash']
for k,v in authority['subject'].items():assert p[k]==v
assert p['authorityHash']==authority['contentHash'] and p['tradingAuthorized'] is False and p['historicalPitGranted'] is False
card=json.loads(current.execute('SELECT body FROM current_score_artifact WHERE id=?',(i,)).fetchone()[0])['card'];assert h(card)==authority['subject']['scorecardHash'];assert current.execute('SELECT count(*) FROM current_score_artifact').fetchone()[0]==1
assert card['operationalAuthorizationGranted'] is False and card['totalScore']=='43' and card['confidence']=='LOW' and card['validity']=='VALID — NON-ACTIONABLE'
assert now['source_admission_event']==before['tables']['source_admission_event']
assert sha((ROOT/'docs/fundamental-data-engine/vnm-pub04/2026-11-18/PUB04_SERVER_REGISTRATION.json').read_bytes())=='a8cefa3008056ca8ca5b4d56ed2224577954eff18e700b9c90d1f1b9f07e82d6'
runtime='skills/vn30-market-price-corporate-actions/scripts/runtime.mjs';assert (ROOT/runtime).read_bytes()==subprocess.check_output(['git','show','d1c7eb5e3d1261c76ac9ade85d2ca8ed2f00f23a:'+runtime],cwd=ROOT)
after={'fileSha256':sha(Path(ctx['target']).read_bytes()),'tables':now};write('PROTECTED_AFTER.json',after);old.close();current.close()
tests=read('TEST_RESULTS.json');types=read('SCOPED_TYPECHECK.json');lint=read('LINT.json');assert tests['numFailedTests']==0 and types['status']=='PASS' and lint['errors']==lint['warnings']==0
registrationFiles=['src/infrastructure/source-admission/pub04-registration.ts','src/infrastructure/source-admission/registered-current-reader.ts','app/server/dashboard.ts','src/ui/dashboard.tsx']
write('PUB04_PUBLICATION_RECEIPT.json',{'status':'PUBLISHED_EXISTING_SCORE_READ_ONLY','publicationId':i,'publicationHash':digest,'subject':authority['subject'],'authorityReference':authority['id'],'authorityHash':authority['contentHash'],'authorityFileSha256':sha((OUT/'PUB04_SERVER_REGISTRATION.json').read_bytes()),'purpose':'CURRENT_FORMAL_VALUATION','metadata':publication['metadata'],'idempotentInsidePublicationTransaction':True,'postCommitDuplicateRetriesUnderQueryOnly':True,'existingCurrentScoreCount':1,'newScoreGenerated':False,'existingScorecardBytesUnchanged':True,'noLegacyFormalPitArtifact':True,'analyticalCatalogKind':'SCORECARD','explicitEnvelopeContract':p['contract'],'serverRegistration':{'path':'PUB04_SERVER_REGISTRATION.json','identity':authority['id'],'files':[{ 'path':path,'sha256':sha((ROOT/path).read_bytes())} for path in registrationFiles]},'productionTarget':ctx['target']})
write('PUB04_REVOCATION_AND_SAFETY_VALIDATION.json',{'status':'PASS','isolatedNegativeChecks':rehearsal['checks'],'actualNextProductionHttpRevocation':revocation,'liveAuthorityRevokedOrChanged':False,'latestSelection':'PASS_LATEST_AUTHORIZED_SUBJECT; unauthorized newer revision blocks without fallback','clientSelectedAuthority':'IGNORED_BY_ACTUAL_ROUTE; exact metadata unchanged for forged authority/score/PIT query','sourceReader':'Only governed find() exposed; missing receipt writes are forbidden','tradingAuthorized':False,'noFinancialAdmissionOrScoreInvocation':True})
write('PUB04_PRODUCTION_SAFETY_VALIDATION.json',{'status':'PASS','originalDatabaseSha256':before['fileSha256'],'finalDatabaseSha256':after['fileSha256'],'onlyChangedTable':'analytical_artifact','onlyAuthorizedChange':'One immutable current-purpose reference envelope appended','schemaUnchanged':True,'everyPreexistingRowPreserved':True,'otherTablesUnchanged':len(now)-1,'currentScoreDatasetFinancialFactsAssessmentsMethodologyUnchanged':True,'portfolioNavLedgerTransactionsUnchanged':True,'historicalScorecardsUnchanged':True,'noOtherTickerPublished':True,'sourceAdmissionRevocationTableUnchanged':True,'noTradeBuyDcaPermission':True,'noHistoricalPitPromotion':True,'backupRecovery':'PASS_BACKUP_RETAINED','noProductionRestoreOrReplacement':True})
write('PUB04_VALIDATION.json',{'status':'PASS','actualProductionPublicationAndNextStartHttp':True,'scopedTests':{'passed':tests['numPassedTests'],'failed':tests['numFailedTests']},'strictScopedTypecheck':types,'lint':{'errors':0,'warnings':0},'fullNextProductionBuild':build,'governedReadbackAndPostCommitQueryOnlyIdempotency':'PASS','actualHttpMetadataAndForgedClientAuthority':'PASS','actualHttpRevokedVisibilityOnDisposableDatabase':'PASS','productionDataSafety':'PASS_ALL_OTHER_TABLES_UNCHANGED','historicalEvidenceUnchanged':True,'fullRepositoryTestSuiteClaimed':False,'buildRepair':'Declaration only for retained S4 ESM runtime; exact Next dependency resolution prevents mixed framework instances. No ignored type errors, disabled guards or modified scoring bytes.','httpHarnessCorrection':'The initial HTML selector inspected the streamed loading shell. Final verification selects the completed main#main production route content.'})
write('PUB04_FINAL_DECISION.json',{'status':'PUBLICATION_COMPLETE','approvedBaselineCommit':'d1c7eb5e3d1261c76ac9ade85d2ca8ed2f00f23a','publicationId':i,'publicationHash':digest,'serverRegistrationId':authority['id'],'serverRegistrationHash':authority['contentHash'],'productionTarget':ctx['target'],'originalDatabaseFingerprint':before['fileSha256'],'finalDatabaseFingerprint':after['fileSha256'],'score':'43','confidence':'LOW','validity':'VALID — NON-ACTIONABLE','economicCutoff':'2026-10-30','purpose':'CURRENT_FORMAL_VALUATION','exactlyOneAuthorizedVnmPublication':True,'actualProductionHttpVerified':True,'remainingPub04Blockers':[],'tradingPortfolioChangesRescoringOtherTickers':'NOT_AUTHORIZED_NOT_EXECUTED','historicalPit':'NOT_QUALIFIED','CIOReview':'STOP'})
(OUT/'PUB04_BLOCKER_REGISTER.md').write_text('''# PUB-04 blocker register

No unresolved PUB-04 blocker. The exact owner-authorized VNM score is published once through the governed reference envelope, registered in trusted server code, and verified through actual Next production HTTP.

LOW / VALID — NON-ACTIONABLE remains unchanged. No trading, portfolio change, rescoring, other-ticker publication or historical PIT promotion is authorized. Stop for CIO review.
''')
(OUT/'PUB04_PUBLICATION_EXECUTION.md').write_text('''# PUB-04 VNM read-only publication

**PUBLICATION_COMPLETE.** Actual production publication and Next production HTTP readback passed.

Approved baseline: `d1c7eb5e3d1261c76ac9ade85d2ca8ed2f00f23a`. The quoted owner authorization `approval PUB-04` is retained in OWNER_REQUEST.txt and bound to the exact subject in PUB04_SERVER_REGISTRATION.json. No broader approval is inferred.

Publication ID: `'''+i+'''`.

Publication envelope hash: `'''+digest+'''`.

Original scorecard hash: `'''+authority['subject']['scorecardHash']+'''`, unchanged. Dataset, methodology and review hashes match the exact approved subject. Server registration: `'''+authority['id']+'''`, contentHash `'''+authority['contentHash']+'''`.

Production database: `'''+ctx['target']+'''`.

Before SHA-256: `'''+before['fileSha256']+'''`.

After SHA-256: `'''+after['fileSha256']+'''`.

The approved CurrentScorePublications implementation is unchanged. One immutable `current-read-only-publication-v1` reference envelope was appended to the existing analytical catalog. Its SCORECARD catalog kind is decoded only through the explicit current-purpose contract; it is not a legacy FORMAL/PIT scorecard. Publish retries inside the transaction and after commit under SQLite query_only create no duplicates. No score() call, new score, financial admission, methodology change or assessment change occurred. Governed find() retains its required integrity/authority replay; that verification does not persist or change a score.

The dashboard loader imports a fixed server registration. Browser parameters cannot select authority, review or source. The dashboard receives only find/latest capabilities, not publish or trading. The source reader composes the existing F1/F2 admission consumers and exact prior current registration, and refuses a write if a required acceptance receipt is missing. Original timestamps and CURRENT_FORMAL_VALUATION semantics remain intact.

The actual optimized Next 16.3.4 build and next start HTTP route `/scoring/VNM-current-remediation-unadopted` show VNM, **43/100, LOW, VALID — NON-ACTIONABLE**, cutoff `2026-10-30T23:59:59.999Z`, knownAt and calculatedAt `2026-11-18T00:52:58.768Z`, and CURRENT-PURPOSE / READ ONLY / NOT HISTORICAL PIT / No trading authorization. The listing also contains VNM. Forged authority/score/PIT query parameters do not alter metadata. Details and response hashes are in PUB04_DASHBOARD_READBACK.json.

The same production build served a disposable production copy with a revoked authority. HTTP visibility correctly became BLOCKED with no score metrics. Additional isolated tests cover publication/data revocation, changed authority bytes, another subject, forbidden materialization permission and an unauthorized newer revision with no fallback. Live authority and live revocation records were never changed. Verification HTTP servers were shut down after checks; persisted publication and trusted application registration remain in place.

Backup used SQLite online backup and was restored/verified in a disposable database. The private backup is retained at `'''+backup['backupPath']+'''`; no production restore or database replacement occurred. Publication ran atomically under an exclusive SQLite lock with complete logical-baseline comparison and a blocked second-writer probe.

Independent post-check: only analytical_artifact gained one row. Every prior row and all other table fingerprints, schema, source/financial facts, current score, dataset, assessments, methodology, historical scorecards, portfolio, ledger, NAV and transactions are unchanged. No other security was published. VNM17 remains untouched; historical PIT remains NOT_QUALIFIED.

Validation: '''+str(tests['numPassedTests'])+''' scoped tests PASS; strict scoped TypeScript PASS; lint 0 errors/0 warnings; full Next compile/typecheck/prerender/build PASS; actual production HTTP PASS. Full-repository test PASS is not claimed. A missing S4 ESM declaration was added without changing runtime.mjs bytes. Verification resolves one byte-checked locked Next installation to avoid duplicate framework async-context instances; no Next upgrade, source substitution, skipped typecheck or disabled integrity control was used. The initial HTTP harness was corrected to inspect final streamed main#main rather than the loading boundary. Attempt history is retained.

All nine required PUB-04 outputs are present. The final evidence commit is reported in the final response, avoiding a self-referential SHA. No unresolved PUB-04 blocker. **STOP for CIO review; no other ticker or milestone.**
''')
print(json.dumps({'status':'PUBLICATION_COMPLETE','publicationHash':digest,'before':before['fileSha256'],'after':after['fileSha256'],'changedTables':changed,'tests':tests['numPassedTests']}))
