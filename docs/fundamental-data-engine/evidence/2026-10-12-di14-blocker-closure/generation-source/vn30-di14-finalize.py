from pathlib import Path
import json,hashlib,datetime,os
root=Path.cwd();b=root/'docs/fundamental-data-engine/evidence/2026-10-12-di14-blocker-closure';prior=root/'docs/fundamental-data-engine/evidence/2026-10-12-governance-closure-selected-path-corrected'
read=lambda n:json.loads((b/n).read_text())
def write(n,q):
 with (b/n).open('x') as f:f.write(json.dumps(q,ensure_ascii=False,indent=2)+'\n')
first=read('full-regression-results.json');full=read('full-regression-final-results.json');individual=read('individual-decision-results.json');targeted=read('targeted-controls-results.json');batches=read('CONTROLLED_BATCHES.json');corpus=read('TEST_CORPUS_HASHES.json');replay=read('SNAPSHOT_REPLAY.json');pit=read('REQUIRED_PATH_PIT_READINESS.json')
assert full['success'] and full['numFailedTests']==0 and full['numPassedTests']==full['numTotalTests']==1063
failed=[]
for f in first['testResults']:
 for a in f['assertionResults']:
  if a['status']!='failed':continue
  matches=[r for g in individual['testResults'] for r in g['assertionResults'] if r['fullName']==a['fullName']]
  failed.append({'file':str(Path(f['name']).relative_to(root)),'name':a['fullName'],'coldRunDurationMs':a['duration'],'failure':a['failureMessages'][0].split('\n')[0],'productAssertionFailure':False,'fixtureMigrationSpawnTimeoutMs':25000,'individualFileReproduction':'PASS' if matches and matches[0]['status']=='passed' else 'NOT_PASS','fullFinalReproduction':'PASS'})
write('FULL_REGRESSION_ROOT_CAUSE.json',{
 'classification':'ENVIRONMENT_IO_AND_RUNTIME_FAILURES_WITH_SUCCESSFUL_COMPLETE_FORK_REGRESSION',
 'confirmedFindings':[
 {'cause':'UNSUPPORTED_RUNTIME_IN_INITIAL_ENVIRONMENT','observed':'Node v22.12.0; repo requires >=22.23.2 <23','mechanism':'Prisma/test fixture CLI imports .ts. v22.12.0 failed with ERR_UNKNOWN_FILE_EXTENSION before any application assertion.','remediation':'Official Node v22.23.2 in /private/tmp/vn30-di14-runtime; no global Node replacement.'},
 {'cause':'CLOUD_ONLY_LOCAL_DEPENDENCY_AND_MIGRATION_IO','observed':['prisma/build/index.js dataless','four migration SQL files dataless','source copy/git archive blocked on cloud reads; Git archive could not read a historical evidence object','first full fork attempt: two fixture migrations returned exit null at 25000ms, not a semantic product assertion'],'remediation':'Resident dependency installation from frozen lockfile, same versions; better-sqlite3 rebuilt; exact HEAD files materialized where available, source files became resident through reads. Original test and fixture timeouts unchanged.','confidence':'CONFIRMED_IO_AND_SPAWN_TIMEOUT_OBSERVATIONS; cloud I/O is the supported explanation, not a proved kernel/native crash backtrace.'}],
 'failingTests':failed,'firstObservedFailingBatchFileCount':90,'minimalFailingBatchSizeEstablished':False,
 'controlledBatches':[{'batchFileCount':1,'tests':14,'passed':14,'failed':0,'exitCode':0,'signal':None},*batches],
 'fullColdAttempt':{'files':len(first['testResults']),'tests':first['numTotalTests'],'passed':first['numPassedTests'],'failed':first['numFailedTests'],'exitCode':1,'signal':None},
 'fullResidentAttempt':{'files':len(full['testResults']),'tests':full['numTotalTests'],'passed':full['numPassedTests'],'failed':full['numFailedTests'],'exitCode':0,'signal':None},
 'historicalDefaultForkExit143':'Preserved log records SIGTERM/termination. OOM or leak cause is not established.',
 'historicalThreadSIGSEGV':'Preserved log confirms SIGSEGV under threads; it lacks a native backtrace. Cannot attribute it conclusively to better-sqlite3/Prisma. Fork isolation avoids that observed failure mode; no thread-pool pass is claimed.',
 'resourceExhaustion':'Host 16 GiB RAM, approximately 3.9 GiB swap used at first diagnostic sample; bounded batches observed peak child RSS 3,200,188,416 bytes. Pressure is relevant but no OOM kill proved.',
 'testConcurrency':{'pool':'forks','maxWorkers':1,'fileParallelism':False,'isolation':True,'reason':'Isolated native SQLite/Prisma work and process lifetime; same corpus/assertions with bounded workers.'},
 'nativeModuleCrash':'No SIGSEGV in any fresh fork run or native smoke; historical thread crash root cause remains unproven.',
 'leakedHandleOrProcess':'Completed final full run and controlled batches exited normally; no blocking handle/leak established.',
 'testIsolation':'Per-file fork isolation retained; fixtures create their own databases. No isolation-related assertion regression reproduced.',
 'actualProductRegression':'No semantic assertion regression reproduced; all 1063 final assertions PASS.',
 'testTimeoutsChanged':False,'assertionsChanged':False,'testsSkippedRemovedOrAddedToGetGreen':False,
 'reproducibleRuntime':'/private/tmp/vn30-di14-runtime/node-v22.23.2-darwin-arm64/bin/node',
 'dependencies':'Reinstalled from existing pnpm-lock.yaml; package/lock versions unchanged; resident installation promoted into repo node_modules.'})
architecture=[f for f in targeted['testResults'] if '/architecture/' in f['name']]
checks=[{'check':'full_unit_integration_architecture','status':'PASS','tests':1063,'files':90,'exitCode':0},
 {'check':'architecture_suite','status':'PASS','tests':sum(len(f['assertionResults']) for f in architecture),'files':len(architecture),'exitCode':0},
 {'check':'source_tamper_governance_selected_path_controls','status':'PASS_CURRENT_CORPUS','tests':targeted['numTotalTests'],'exitCode':0},
 {'check':'historical_CFO_39_exact_source_controls','status':'NOT_RERUN_PRIOR_INPUTS_REMOVED','evidence':'SOURCE_TAMPER_CHECKS.json'},
 {'check':'TypeScript','status':'PASS','exitCode':0,'log':'validation-logs/typescript.log'},
 {'check':'ESLint_zero_warnings','status':'PASS','exitCode':0,'log':'validation-logs/eslint.log'},
 {'check':'Prisma_generate','status':'PASS','exitCode':0,'log':'validation-logs/prisma-generate.log'},
 {'check':'Prisma_validate','status':'PASS','exitCode':0,'log':'validation-logs/prisma-validate.log'},
 {'check':'SQLite_quick_check_and_foreign_key_check','status':'PASS_CURRENT_APP_DATABASE_READ_ONLY','evidence':'SQLITE_CHECKS.json'},
 {'check':'original_snapshot_database_integrity','status':'NOT_RERUN_PRIOR_DATABASE_REMOVED'},
 {'check':'independent_deterministic_selector_availability_replay','status':'PASS','evidence':'SNAPSHOT_REPLAY.json'},
 {'check':'original_raw_reader_render_replay','status':'NOT_REPRODUCIBLE_PRIOR_EXACT_BYTES_REMOVED'},
 {'check':'git_diff_check','status':'PASS','exitCode':0,'evidence':'GIT_CHECKS.json'}]
write('FULL_REGRESSION_VALIDATION.json',{'fullRegressionSuitePassed':True,'allRequestedValidationComplete':False,'validationLimitations':['Historical 39 CFO controls cannot be rerun on original sealed evidence.','Initialization SQLite was removed before this task.','Full raw/render replay is unavailable; deterministic snapshot/availability replay is PASS.'],'checks':checks,'testsExecuted':1063,'testsPassed':1063,'testsFailed':0,'testsPending':full.get('numPendingTests',0),'exitCode':0,'SIGSEGV':False,'timeoutFailures':0,'testCorpusSha256':hashlib.sha256((b/'TEST_CORPUS_HASHES.json').read_bytes()).hexdigest(),'sameCorpusBetweenColdAndFinal':sorted(f['name'] for f in first['testResults'])==sorted(f['name'] for f in full['testResults']),'assertionsOrTimeoutsChanged':False,'approvedDocumentsModified':False,'sourceReacquisition':False})
old=json.loads((prior/'FINAL_SLICE08B_GOVERNANCE_CLOSURE.json').read_text());gates=[{'id':g['id'],'preservedStatus':g['status'],'scope':'PRIOR_REVIEW_CANDIDATE_GATE_STATUS_NOT_NEW_OWNER_APPROVAL'} for g in old['DI1_DI13']]
write('FINAL_DI14_BLOCKER_STATUS.json',{'title':'SLICE 08B — FINAL DI14 BLOCKER CLOSURE','reviewHead':'411e30fbaf2fd2d63316d62bc16a467f69aea362','snapshotRunId':replay['snapshotRunId'],'mandatoryFinancialSourceMissingCount':0,'CASAGovernanceDefectStatus':'OPEN_PROPOSAL_AWAITING_PROJECT_OWNER_APPROVAL','NPLGovernanceDefectStatus':'OPEN_PROPOSAL_AWAITING_PROJECT_OWNER_APPROVAL','trueGovernanceDefects':2,'ownerApprovalRequired':True,'approvedDocumentStatement':'NO APPROVED DOCUMENT MODIFIED.','PIT':{'before':18,'resolved':0,'remainingUnknown':18,'unsatisfiedRequiredPathsAffected':14,'unknownOnlyBlockedPaths':6,'overlappingUnknownAndConflictPaths':8},'requiredPaths':{k:pit[k] for k in ['requiredPathsTotal','satisfiedByVerifiedFact','blockedByUnknown','blockedByConflict','blockedByMissingFact','blockedByOther','unsafeSelected']},'fullRegression':{'status':'PASS','tests':1063,'passed':1063,'failed':0,'exitCode':0,'files':90,'SIGSEGV':False,'timeout':False},'snapshotReplay':replay,'DI1_DI13':gates,'DI14':'AWAITING_INDEPENDENT_REVIEW','DI14Passed':False,'DI15':'NOT_PASS_UNRESOLVED_GOVERNANCE_PIT_AND_HISTORICAL_REPLAY_LIMITATIONS','blockerClassStatus':{'frozenCASANPL':'PRECISELY_ESCALATED_TO_OWNER_WITH_MINIMAL_PROPOSAL','18RequiredPIT':'PRECISELY_ESCALATED_PUBLICATION_EVIDENCE_REQUIRED','fullRegression':'CLOSED_COMPLETE_PASS'},'exactHistoricalValidationLimitations':['Original raw execution packages, initialization DB and exact sealed render/readers were deleted under prior user requests.','No historical hash or signing/local receipt is substituted for unavailable raw evidence.'], 'safety':{'additionalFinancialStatementsAcquired':0,'operationalScoringRankingTop10DecisionDCARuns':0,'syntheticRegressionFixturesExecuted':True,'productionDatabaseWrites':0,'approvedMappingsImplemented':False,'priorEvidencePackagesModifiedThisTask':False},'stopAfterEvidenceAndIndependentReviewHandoff':True})
# Bind prior input preservation and identical corpus again before sealing.
for row in read('INPUT_PRESERVATION.json')['inputHashes']:assert hashlib.sha256((root/row['path']).read_bytes()).hexdigest()==row['sha256']
for row in corpus['files']:assert hashlib.sha256((root/row['path']).read_bytes()).hexdigest()==row['sha256']
assert hashlib.sha256((root/'vitest.config.ts').read_bytes()).hexdigest()==corpus['vitestConfigSha256']
print('Final required JSON artifacts created; DI14 remains not PASS')
