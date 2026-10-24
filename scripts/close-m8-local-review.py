"""M8 readiness evidence closure. Read-only verification; no financial/runtime fixes."""
import argparse
import datetime
import importlib.util
import json
import subprocess
from pathlib import Path
from lib.pe4_evidence import sha, verify_seal, replay_package
from lib.pec1b_workflow import pec2_preparation_boundary
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/fundamental-data-engine/evidence';OUT=E/'2026-10-24-m8-local-application-readiness'

def read(p):return json.loads(p.read_text())
def save(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def md(n,t):(OUT/n).write_text(t.strip()+'\n')
def require(ok,why):
 if not ok:raise ValueError(why)
def refs():
 sources={'ledgerReplay':('src/infrastructure/repositories/portfolio-ledger.ts','const rebuilt = buildTransaction'), 'openingContract':('src/domain/portfolio/transaction.ts','case "OPENING_BALANCE"'), 'dashboardFailure':('app/server/dashboard.ts','catch (error) { return'), 'legacyResearchReader':('src/infrastructure/fundamentals/manual-current.ts','data/manual-current/current-analysis.json'), 'marketGate':('app/server/market-boundary.ts',"throw new Error('MARKET_BOUNDARY_NOT_INDEPENDENTLY_ACCEPTED')"), 'currentValuationGate':('app/server/current.ts','marketBoundaryStatus().marketCurrent'), 'performanceUI':('src/ui/dashboard.tsx','screen === "performance"'), 'membershipUI':('src/ui/dashboard.tsx','complete current universe query'), 'readinessGET':('app/api/readiness/route.ts','export function GET'), 'loopback':('package.json','"start":'), 'prisma':('src/infrastructure/db/client.ts','new PrismaClient')}
 result={}
 for key,(path,needle) in sources.items():
  p=ROOT/path;lines=p.read_text().splitlines();line=next(i+1 for i,s in enumerate(lines) if needle in s);result[key]={'path':path,'sha256':sha(p),'line':line}
 return result

def verify(sealed=False):
 baseline=read(OUT/'PROTECTED_INPUT_HASHES.json')
 for path,h in baseline.items():require(sha(ROOT/path)==h,'PROTECTED_INPUT_CHANGED:'+path)
 require({p for p in baseline if p.startswith('data/')}=={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file() and '__pycache__' not in p.parts},'DATA_NAMESPACE_CHANGED')
 require({p for p in baseline if p.startswith('prisma/')}=={str(p.relative_to(ROOT)) for p in (ROOT/'prisma').rglob('*') if p.is_file() and p.name!='.DS_Store'},'SCHEMA_OR_MIGRATION_CHANGED')
 spec=importlib.util.spec_from_file_location('readonly_helpers',ROOT/'scripts/prepare-pec1b-evidence.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
 require(m.database()==read(OUT/'DATABASE_BASELINE.json'),'DATABASE_CHANGED')
 amendment=E/'2026-10-24-pec1d-authentication-deferral-amendment';packages=[ROOT/r['package'] for r in read(amendment/'PRIOR_SEAL_VERIFICATION.json')]+[amendment]
 seals=[verify_seal(ROOT,p) for p in packages]
 now=datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z');p=E/'2026-10-23-production-evidence-closure-pec2';records=read(p/'ADMISSION_CANDIDATES.json')['records'];bundles=read(p/'EVIDENCE_BUNDLES.json')['bundles'];evaluations=[]
 for r in records:
  b=next(b for b in bundles if b['core']['pec1Candidate']['candidateId']==r['candidateId']);v=pec2_preparation_boundary(r,b['core'],b['receipts'],records,now,root=ROOT)
  require(v['PEC2Result']['effectiveAdmissionState']=='DEFERRED' and all(v[k] is False for k in ['productionUseAuthorized','runtimeActivationAuthorized','scoringAuthorized']),'ADMISSION_GATE_CHANGED');evaluations.append(v)
 require(len(evaluations)==8,'CANDIDATE_COUNT')
 live=read(OUT/'LIVE_RUNTIME_RESULTS.json');ready=live['readinessApi']['body']
 require(not live['fixturesInjected'] and live['productionWritesPerformed']==0,'LIVE_TEST_MUTATION_OR_FIXTURES')
 require(all(r['httpStatus']==200 and not r['redirectedToLogin'] for r in live['routes']),'ROUTE_FAILURE')
 require(ready['readyForScoring'] is False and ready['marketCurrent'] is False and ready['analysisReady'] is False and ready['decisionReady'] is False,'LIVE_GATES_NOT_BLOCKED')
 require(not live['pageErrors'],'BROWSER_JS_ERROR')
 require(read(OUT/'PREREQUISITE_APPROVAL.json')['decision']=='EXPLICIT_OWNER_APPROVAL_RECEIVED','OWNER_PREREQUISITE')
 unit=read(OUT/'validation/unit-regressions.json');require(unit['success'] and unit['numFailedTests']==0,'UNIT_REGRESSION')
 for f,n in [('pec1b-regressions.json',25),('pec2-regressions.json',62)]:require(read(OUT/'validation'/f)['success'] and read(OUT/'validation'/f)['testsRun']==n,'PEC_REGRESSION')
 listener=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:38417','-sTCP:LISTEN'],capture_output=True,text=True);require(listener.returncode==1 and not listener.stdout.strip(),'REVIEW_SERVER_NOT_STOPPED')
 require('PASS boundaries:' in (OUT/'validation/architecture-boundaries.log').read_text(),'ARCHITECTURE_BOUNDARIES')
 if sealed:verify_seal(ROOT,OUT)
 result={'status':'PASS_REVIEW_SAFETY_NOT_FEATURE_READINESS','verifiedAt':now,'protectedFilesUnchanged':len(baseline),'priorSealsVerified':len(seals),'databaseBytesLogicalDumpCountsUnchanged':True,'applicationAndFrozenPolicyCodeUnchanged':True,'candidateStates':{'DEFERRED':8},'sourceApprovalsCreated':0,'effectiveAdmissions':0,'D2Activated':False,'scoringActivated':False,'identityOrSessionCreated':False,'databaseMigrationsExecuted':0,'newMilestoneStarted':False,'reviewServerStopped':True,'liveRoutes':len(live['routes']),'unitTests':unit['numPassedTests'],'PEC1BTests':25,'PEC2Tests':62,'packetSealChecked':sealed,'evaluations':evaluations}
 save('validation/safety-verification.json',result)
 if (OUT/'PRIOR_SEAL_VERIFICATION.json').exists():require(read(OUT/'PRIOR_SEAL_VERIFICATION.json')==seals,'PRIOR_SEAL_INVENTORY_CHANGED')
 else:save('PRIOR_SEAL_VERIFICATION.json',seals)
 return result

def report():
 require(not (OUT/'CLOSURE_REPORT.md').exists(),'REFUSE_REPORT_OVERWRITE')
 safety=verify();live=read(OUT/'LIVE_RUNTIME_RESULTS.json');data=read(OUT/'ACTUAL_DATA_RECONSTRUCTION.json');diag=read(OUT/'LEDGER_DIAGNOSTIC.json');summary=read(OUT/'LOCAL_DATA_SUMMARY.json');unit=read(OUT/'validation/unit-regressions.json')
 save('SOURCE_REFERENCES.json',refs())
 failed=[r for r in diag['rows'] if not r['canonicalContentEqual']];require(len(failed)==1 and all(r['storedLegsMatchPersistedRows'] for r in diag['rows']),'DIAGNOSTIC_SCOPE_CHANGED')
 cases=[
 ('1','Local Next.js startup/runtime','WORKING_WITH_LIMITATIONS','Fresh production build and actual loopback server started successfully; 18 read-only browser routes HTTP 200. Existing four Turbopack tracing warnings and Node experimental SQLite notices.','LIVE_RUNTIME_RESULTS.json; validation/next-build.log'),
 ('2','SQLite and Prisma connectivity','WORKING','Actual retained DB: integrity_check=ok, zero FK violations; Prisma SELECT 1 and portfolio count succeed. This does not establish ledger semantic compatibility.','ACTUAL_DATA_RECONSTRUCTION.json'),
 ('3','Holdings and cash reconstruction','BLOCKED','Authoritative PrismaPortfolioLedger.read rejects the opening receivable contract mismatch; live holdings/cash withheld. No bypass using raw rows or stale projection.','LEDGER_DIAGNOSTIC.json; LIVE_RUNTIME_RESULTS.json /holdings'),
 ('4','Transaction history','BLOCKED','12 POSTED opening entries physically exist but current live reader rejects one. No post-inception trade/deposit/dividend history is present. UI incorrectly also shows an empty-history message under the integrity alert.','LOCAL_DATA_SUMMARY.json; LIVE_RUNTIME_RESULTS.json /transactions'),
 ('5a','Cost basis','BLOCKED','11 security opening records exist; portfolio-level authoritative reconstruction is blocked. Synthetic cost-basis tests do not validate current live balances.','DATABASE_BASELINE.json; LEDGER_DIAGNOSTIC.json'),
 ('5b','Dividend posting/settlement','NOT_TESTED','No live dividend events; no posting/settlement/receivable repair attempted. Stored nonzero opening RECEIVABLE is not a DIVIDEND_CASH event. Domain synthetic tests cover implemented accounting logic only.','LOCAL_DATA_SUMMARY.json; validation/unit-regressions.json'),
 ('6a','Current NAV and unrealized performance','BLOCKED','No accepted current market snapshot; current source is withheld and ledger replay is blocked. /api/readiness marketCurrent=false; live NAV unavailable.','LIVE_RUNTIME_RESULTS.json; app/server/current.ts'),
 ('6b','NAV history, benchmark, TWR/XIRR/CAGR','NOT_IMPLEMENTED','Current performance UI explicitly has no compatible approved benchmark/time-series query and renders unavailable placeholders. This is not fixed by login deferral or unit NAV bridge calculations.','src/ui/dashboard.tsx; LIVE_RUNTIME_RESULTS.json /performance'),
 ('7a','Current VN30 master/membership acceptance','BLOCKED','Retained research universe/candidate count 30 is not authenticated current exchange membership. DB security table has 11 instruments; current accepted reference/market context absent.','DATABASE_BASELINE.json; LIVE_RUNTIME_RESULTS.json /api/readiness'),
 ('7b','Complete current membership dashboard query','NOT_IMPLEMENTED','UI explicitly says a complete current universe query is unavailable; historical scorecard membership table currently empty.','src/ui/dashboard.tsx; LIVE_RUNTIME_RESULTS.json /vn30'),
 ('8a','Retained fundamental files','WORKING_WITH_LIMITATIONS','Manifests describe 337 PDF captures/330 unique, 248 API raw captures with 8 schema quarantines; current combined files retained. Inventory availability only, not new source-image or semantic validation.','ACTUAL_DATA_RECONSTRUCTION.json; DATA_AVAILABILITY_REPORT.md'),
 ('8b','Admitted financial snapshot/coverage','BLOCKED','Formal observation/import/snapshot/independent acceptance tables are empty. Live /data reports EMPTY and review UNAVAILABLE, not score-ready.','DATABASE_BASELINE.json; LIVE_RUNTIME_RESULTS.json /data'),
 ('9','Dashboard shell/rendering/navigation','WORKING_WITH_LIMITATIONS','Actual browser: 18 routes rendered, no page JS errors/login redirects, Holdings navigation click works; desktop visual review and 390px data page show usable shell. Most portfolio content is integrity-blocked. No populated holdings detail link available.','LIVE_RUNTIME_RESULTS.json; validation/*-redacted.png'),
 ('10','Missing-data/freshness warnings','WORKING_WITH_LIMITATIONS','Actual integrity alerts, UNKNOWN/Unavailable values and empty snapshot state appear; readiness API reports unaccepted/ambiguous-session market candidate. Blocked views also misleadingly say no portfolio/transactions exist. No false score-ready/zero financial fallback observed.','LIVE_RUNTIME_RESULTS.json'),
 ('11a','Research dashboard integration','BLOCKED','readManualCurrentSnapshot still reads removed data/manual-current/current-analysis.json and old manual-fundamentals layout; retained rebuilt JSON is not connected through that reader. Do not recreate deleted historical folders/symlinks.','src/infrastructure/fundamentals/manual-current.ts; ACTUAL_DATA_RECONSTRUCTION.json'),
 ('11b','Populated historical artifact analysis','NOT_TESTED','No analytical/decision/workflow artifacts or formal snapshots exist in actual DB. Empty routes render; populated artifact acceptance is only synthetic in this review.','DATABASE_BASELINE.json; LIVE_RUNTIME_RESULTS.json'),
 ('12','Production scoring/admission protection','WORKING_WITH_LIMITATIONS','Expected denial observed: live readyForScoring/analysisReady/decisionReady=false; eight original candidates DEFERRED, no accepted source/DI rows or score artifacts. No live mutation/activation endpoint was invoked; revocation/provider acceptance remain unconfigured.','validation/safety-verification.json; SECURITY_BOUNDARY_REVIEW.md')]
 save('FEATURE_READINESS_MATRIX.json',{'allowedStatuses':['WORKING','WORKING_WITH_LIMITATIONS','BLOCKED','NOT_IMPLEMENTED','NOT_TESTED'],'overallLocalPortfolioReadiness':'BLOCKED','liveRuntimeReviewPerformed':True,'features':[dict(zip(['scope','feature','status','finding','evidence'],r)) for r in cases]})
 md('FEATURE_READINESS_MATRIX.md','# M8 feature readiness matrix\n\n**Overall: BLOCKED for reliable live portfolio accounting/analysis. The application shell can be opened locally without login.** HTTP 200 and passing synthetic tests are not populated-feature acceptance.\n\n| Scope | Feature | Status | Actual evidence/finding |\n|---|---|---|---|\n'+'\n'.join('| '+i+' | '+f+' | '+s+' | '+why+' Evidence: '+e+' |' for i,f,s,why,e in cases)+'\n\nDividend posting, settlement, correction/reversal, broker/source refresh, source approval and capital/scoring actions were deliberately not executed. Mobile check covered the data screen only; populated mobile financial tables and multi-device/network deployment remain NOT_TESTED.')
 md('LOCAL_RUNTIME_INVENTORY.md','''# M8 actual local runtime inventory

Prerequisite satisfied by the user's explicit “Approve” reply to the amendment approval question; recorded in PREREQUISITE_APPROVAL.json. This approves authentication deferral and beginning this review only, not source authority or scoring.

Next.js 16.3.4 / React 19.3.0 / Prisma 7.10.0 with SQLite; supported Node v22.23.2 was used explicitly. A fresh `next build` completed, including TypeScript, without installing dependencies or running migrations. Existing build emitted four Turbopack dynamic-filesystem tracing warnings from db/files.ts and experimental Node SQLite notices. These are limitations for later build/deployment cleanup, not a claimed safe-to-deploy package certification.

Started `next start --hostname 127.0.0.1 --port 38417` against explicit `file:/Users/nglehoangan/Documents/Working/VN_30_Investment/data/vn30.sqlite`. It used the existing local configuration and freshly built app; no synthetic DB, market enablement override or fixture data was injected. lsof verified an exclusively 127.0.0.1 listener. Actual startup hook logged application.started. Browser ran headless Chromium over the real local server, with only same-origin GET/HEAD allowed; no transaction/review form submission or external fetch was made.

Eighteen routes including dashboard, holdings, transactions, performance, VN30, data, scoring/ranking, decisions, reviews/journal, audit/DCA, risk, settings/imports and new-entry/preview screens returned HTTP 200. Browser recorded actual headings, alerts, table/metric availability and button states; no client page errors, login redirects or session cookies were observed. Sidebar navigation worked. The 390px data page had document width equal to viewport; this is not full populated/mobile acceptance. Redacted desktop screenshots were visually inspected; financial values, table cells and portfolio header were masked.

Crucially, many HTTP-200 pages show BLOCKED integrity and no financial values. Readiness is classified by actual content, not status code. The /data empty-snapshot view renders independently. Holdings detail navigation is NOT_TESTED because the blocked page offers no populated position links. New transaction/review writes are NOT_TESTED and were not attempted.

The sandbox initially denied local listening and Chromium process launch. Authorized loopback/GET-only review was rerun with execution permission; this was an execution-environment constraint, not an application authentication failure. The review server was stopped after inspection; it is not left running or published. No authentication implementation, production migration or investment policy change was made.
''')
 md('DATA_AVAILABILITY_REPORT.md','''# Actual retained data availability

## SQLite

Actual read-only inspection: integrity_check=ok; foreign_key_check has zero violations. One portfolio, 11 security rows, 12 POSTED OPENING_BALANCE transactions, 24 ledger legs and one projection are retained. Portfolio supported inception is 2026-10-08T11:38:01.705Z, revision 1. There are no subsequent trade, settlement, cash-deposit or DIVIDEND_CASH records. A stored projection is not used as a bypass when authoritative ledger replay fails.

Prisma connection/SELECT succeeds, but PrismaPortfolioLedger.read returns DATA_INTEGRITY_ERROR. Diagnostics rebuild all 12 original transactions using current code without changing data. Eleven transactions match; one opening cash record stores CASH plus a nonzero RECEIVABLE, bound to an extra `opening.receivable` field. Current TransactionInput.opening declares only cost/migrationVersion/evidence, and the OPENING_BALANCE builder regenerates CASH only for that record. Saved legs match the persisted relational rows; the failure is current replay-contract incompatibility, not proof of physical SQLite corruption or mere JSON-key ordering. Exact transaction identity is hashed in LEDGER_DIAGNOSTIC.json.

The current validator correctly withholds the aggregate instead of dropping the receivable, treating it as settled cash or trusting an old projection. The record must be reconciled through a separately reviewed compatible contract/correction plan; do not remove the leg or weaken replay to make the page green. This review performs no repair or migration. Holdings, cash, cost basis and dividend/performance data are therefore not accepted as working live features.

450 retained broker observations include 436 API responses and 12 broker snapshots, plus opening/reconciliation records; latest DB capture is 2026-10-11. Separate market-source files include later retained captures, but file presence does not automatically refresh the DB or qualify current market data. No broker login/network acquisition was performed.

No analytical scorecards/rankings, decision artifacts, formal financial observation/import/snapshot rows or independent dataset acceptance exist. Thirty fundamental_admission_run rows are CURRENT_ANALYSIS candidate history, not admitted formal facts or a complete AS_KNOWN chain.

## Fundamentals and references

Current retained layout includes manual-download/, manual-extracted-pdf/, manual-extracted-api/ and combine/. Manifest inventory: 337 physical PDF captures, 330 unique PDFs, 248 raw API captures and 8 schema quarantines; 30-ticker retained research coverage. Combined presentation manifest explicitly has productionAdmissible=false. Existing corpus verification reports are historical evidence and were not regenerated or relabeled as new semantic/source-image acceptance in M8.

The actual dashboard research adapter still expects removed data/manual-current/current-analysis.json and manual-fundamentals/. Both are absent after owner-authorized rebuild/cleanup. Consequently retained PDF/API/comparison JSON is available on disk but not exposed through that legacy research reader. The correct future remedy is a versioned read-only adapter for the current layout, preserving review/provenance/units/source-priority and non-admission status. Do not recreate old folders, restore old extracted data or use symlinks as a shortcut.

The VN30 UI uses historical scorecard membership and explicitly lacks a complete current-universe query. Eleven security rows do not constitute a 30-member exchange master. /api/readiness declares a retained 30-name technical candidate with MBB deferred; this is not independent current membership certification. Current market acceptance is PENDING and marketCurrent=false. Its candidate as-of is 2026-10-19 with UNKNOWN_OR_AMBIGUOUS_SESSION; no current NAV may be inferred.

Actual /data reports EMPTY snapshot integrity and UNAVAILABLE DI review. Missing/unreviewed data is not zero and no formal score is generated. Full historical NAV series, approved benchmark comparison and TWR/XIRR/CAGR query are explicitly absent in the current performance UI.
''')
 md('SECURITY_BOUNDARY_REVIEW.md','''# Security and governance boundary review

The explicit owner approval satisfies this M8 review's authentication-deferral prerequisite only. Google OIDC/authentication remain DEFERRED_BY_OWNER. No identity, role, session, provider or login implementation is created; the approval metadata is not an authenticated financial source-authority receipt.

Actual local application access required no login. The review listener was loopback-only and was stopped afterwards. This fits the owner-approved personal-Mac scope, not an assertion that HTTP loopback authenticates users or is safe against hostile local processes, OS administrators, remote tunnels or a future public deployment. Such deployment/access scenarios were NOT_TESTED.

No write/activation endpoint was exercised. GET-only browser routing blocked external/non-GET traffic; none was requested. The local app's financial model remained integrity-blocked rather than bypassing its ledger validation. Live /api/readiness returned initialized=false, marketCurrent=false, analysisReady=false, decisionReady=false, readyForScoring=false and pending independent approval. app/server/market-boundary.ts::requireAcceptedMarketBoundary always throws; production policy-B composition does not auto-activate from local access.

Existing PEC-1B/PEC-2 regressions and actual empty-trust evaluation keep all eight source candidates DEFERRED. Existing owner methodology/approval records, zero data_initialization_acceptance and zero scoring_dataset_binding/score artifacts are unchanged. PEC-1C contracts remain pinned. Local JSON, OS username, broker token, Codex output and unsigned approvals do not populate trust or replace independent acceptance. Clock/anchor/restore limitations remain unresolved formal-workflow prerequisites, not a reason to implement deferred login now.

Database bytes/logical rows/counts, original policies/source contracts/schema and every prior seal are checked after actual runtime access. No source authority approval, financial admission, formal event, D2/scoring activation, source acquisition or production migration occurs. Synthetic tests explicitly remain synthetic; no positive fixture is written into actual authority stores.

One UI concern is misleading empty-state text: dashboard says no portfolio initialized and transactions say no records while a portfolio/12 entries exist but are withheld. The prominent integrity alert is correct; empty copy must not be interpreted as permission to initialize/import again. Current ledger and accepted-market failures must be addressed under separately reviewed remediation, not by disabling safety gates.
''')
 blockers=[
 {'id':'M8_LEDGER_OPENING_RECEIVABLE_REPLAY','severity':'MAJOR','status':'BLOCKED','impact':'Authoritative cash/holdings/history/cost basis cannot load','evidence':'LEDGER_DIAGNOSTIC.json; src/infrastructure/repositories/portfolio-ledger.ts; src/domain/portfolio/transaction.ts','requiredAction':'Separately review original opening-receivable evidence, current accounting contract and lossless compatible correction/replay plan; preserve nonzero receivable and original records. Do not drop leg or relax gate.'},
 {'id':'M8_RESEARCH_CURRENT_LAYOUT_INTEGRATION','severity':'MAJOR','status':'BLOCKED','impact':'Retained research JSON not connected to dashboard legacy reader','evidence':'src/infrastructure/fundamentals/manual-current.ts; ACTUAL_DATA_RECONSTRUCTION.json','requiredAction':'Review a versioned read-only current-layout adapter without restoring removed legacy paths or granting accounting/scoring admission.'},
 {'id':'M8_CURRENT_ACCEPTED_MARKET_NAV','severity':'MAJOR','status':'BLOCKED','impact':'No current accepted valuation/NAV or actionable current analysis','evidence':'LIVE_RUNTIME_RESULTS.json readinessApi','requiredAction':'Keep current-value gate; any future market source/current acceptance workflow requires exact evidence and independent acceptance. Do not infer current prices from old broker/file captures.'},
 {'id':'M8_CURRENT_MEMBERSHIP_QUERY','severity':'LIMITATION','status':'NOT_IMPLEMENTED','impact':'No complete accepted current universe query in dashboard','requiredAction':'Future separately reviewed exact-time reference integration; retained basket is not current exchange certification.'},
 {'id':'M8_HISTORICAL_PERFORMANCE_QUERY','severity':'LIMITATION','status':'NOT_IMPLEMENTED','impact':'NAV history, benchmark, TWR/XIRR/CAGR not available','requiredAction':'Do not fabricate series/returns or infer them from opening-only ledger. Needs separate approved scope and actual time-series.'},
 {'id':'M8_MISLEADING_EMPTY_STATES','severity':'MINOR','status':'WORKING_WITH_LIMITATIONS','impact':'Integrity failure also displays no-portfolio/no-transactions copy','requiredAction':'Separately review clear unavailable-due-to-integrity wording without hiding the error or inventing data.'},
 {'id':'M8_BUILD_TRACING_WARNINGS','severity':'MINOR','status':'WORKING_WITH_LIMITATIONS','impact':'Four existing filesystem tracing/over-bundling warnings','requiredAction':'Future bounded build-trace cleanup if authorized; no deployment confidentiality certification from this local review.'},
 {'id':'INHERITED_FORMAL_SOURCE_ACCEPTANCE_ADMISSION','severity':'GOVERNANCE_GATE','status':'BLOCKED','impact':'Source approvals, independent acceptance, formal knowledge/cutoffs and scoring remain unavailable','requiredAction':'Retain all gates; authentication deferred, no substitution by local records. No request to implement login in this review.'}]
 save('BLOCKER_STATUS.json',{'reviewStatus':'COMPLETE_AWAITING_OWNER_REVIEW','overallLocalPortfolioReadiness':'BLOCKED','localShellAvailability':'WORKING_WITH_LIMITATIONS','authentication':'DEFERRED_BY_OWNER_NOT_THE_CAUSE_OF_DATA_FAILURE','blockers':blockers,'repairsPerformed':False,'sourceApprovalsCreated':0,'effectiveAdmissions':0,'D2Activated':False,'scoringActivated':False,'databaseMigrationsExecuted':0,'newMilestoneStarted':False})
 failures=[{'operation':'Initial baseline helper invocation','result':'FAILED_MODULE_IMPORT','cause':'PYTHONPATH=scripts omitted from inline helper invocation','resolution':'Reran with PYTHONPATH=scripts; baseline captured before runtime operations.'},{'operation':'Initial local server/browser invocation in sandbox','result':'ENVIRONMENT_PERMISSION_DENIED','cause':'Loopback listen EPERM / Chromium macOS Mach permission denial','resolution':'Authorized GET-only review ran with execution permission; not an application login failure.'},{'operation':'Authoritative actual ledger read','result':'BLOCKED_DATA_INTEGRITY_ERROR','cause':'Stored nonzero opening receivable not regenerated by current contract','resolution':'NOT_FIXED; recorded as M8 blocker, gate preserved.'},{'operation':'Initial diagnostic JSON serialization','result':'HARNESS_FAILURE_BIGINT','cause':'Prisma raw SELECT 1 returns BigInt, unsupported by plain JSON.stringify','resolution':'Diagnostic serializes BigInt losslessly as strings; no application or data change.'}]
 unit_command='/private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/vitest/vitest.mjs run tests/unit/portfolio-accounting.test.ts tests/unit/portfolio-read-models.test.ts tests/unit/dashboard-ui.test.tsx tests/unit/dashboard-screens.test.ts tests/unit/current-remediation-ui.test.tsx tests/unit/manual-fundamentals-ui.test.tsx tests/unit/data-freshness-ui.test.tsx tests/unit/runtime-readiness.test.ts tests/unit/runtime-dataset-acceptance.test.ts --reporter=json --outputFile='+str(OUT.relative_to(ROOT)/'validation/unit-regressions.json')
 commands=[{'command':'NEXT_TELEMETRY_DISABLED=1 /private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/next/dist/bin/next build','exitCode':0,'result':'PASS_WITH_4_EXISTING_TRACING_WARNINGS','log':'validation/next-build.log'}, {'command':"NEXT_TELEMETRY_DISABLED=1 DATABASE_URL='file:/Users/nglehoangan/Documents/Working/VN_30_Investment/data/vn30.sqlite' /private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 38417",'result':'LIVE_STARTED_LOOPBACK_THEN_STOPPED','log':'validation/next-runtime.log'}, {'command':'/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/review-m8-live.mjs','exitCode':0,'result':'18_HTTP_200_PAGES_WITH_BLOCKED_CONTENT_OBSERVED','evidence':'LIVE_RUNTIME_RESULTS.json'}, {'command':'/private/tmp/node-v22.23.2-darwin-arm64/bin/node --import ./scripts/lib/ts-runtime.mjs scripts/review-m8-local-data.mjs','exitCode':0,'result':'DIAGNOSTIC_COMPLETED_PRISMA_CONNECTS_LEDGER_RECONSTRUCTION_BLOCKED','evidence':'ACTUAL_DATA_RECONSTRUCTION.json'}, {'command':'/private/tmp/node-v22.23.2-darwin-arm64/bin/node --import ./scripts/lib/ts-runtime.mjs scripts/diagnose-m8-ledger.mjs','exitCode':0,'result':'ONE_PERSISTED_OPENING_CONTRACT_MISMATCH_FOUND','evidence':'LEDGER_DIAGNOSTIC.json'}, {'command':unit_command,'exitCode':0,'testsPassed':unit['numPassedTests'],'classification':'SYNTHETIC_UNIT_REGRESSIONS_NOT_LIVE_FEATURE_ACCEPTANCE','evidence':'validation/unit-regressions.json'}, {'command':'PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec1b-workflow.py --json '+str((OUT/'validation/pec1b-regressions.json').relative_to(ROOT)),'exitCode':0,'testsPassed':25}, {'command':'PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec2-final-review.py --json '+str((OUT/'validation/pec2-regressions.json').relative_to(ROOT)),'exitCode':0,'testsPassed':62}, {'command':'/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/check-boundaries.mjs','exitCode':0,'log':'validation/architecture-boundaries.log'}, {'command':'PYTHONDONTWRITEBYTECODE=1 python3 scripts/close-m8-local-review.py --verify --require-seal','resultReference':'validation/safety-verification.json'}]
 save('VALIDATION_RESULTS.json',{'reviewStatus':'COMPLETED_WITH_CONFIRMED_READINESS_BLOCKERS','overallFeatureReadiness':'BLOCKED','liveEvidence':{'actualRetainedDatabaseUsed':True,'freshProductionBuild':True,'browserRoutes':len(live['routes']),'httpErrors':0,'javascriptPageErrors':len(live['pageErrors']),'navigationClickWorked':live['navigationClickWorked'],'ledgerReconstruction':'BLOCKED','fixturesInjected':False,'reviewServerStopped':True},'syntheticRegressions':{'passed':unit['numPassedTests']+87,'failed':0,'unitUIAccountingAndRuntime':unit['numPassedTests'],'PEC1B':25,'PEC2':62,'notProductionScoringOrLiveAcceptance':True},'commands':commands,'failuresAndLimitations':failures,'safetySummary':{k:v for k,v in safety.items() if k not in ['evaluations','verifiedAt','packetSealChecked']},'notTestedLive':['Transaction posting, settlement, dividends, reversal or correction','Independent/source owner acceptance or D2/scoring activation','Populated historical artifacts, current membership query and benchmark return series','Populated holdings detail/mobile financial data after successful ledger read','Remote/public deployment or hostile local-OS access'],'noDatabaseMigrations':True,'noInvestmentPolicyChanges':True,'noAuthenticationImplementation':True,'noNewMilestone':True,'sealMeaning':'Integrity only; not owner approval or independent acceptance. safety-verification.json excluded from its own seal.'})
 md('CLOSURE_REPORT.md','''# M8 local application readiness closure

**Review complete; reliable local portfolio/analysis readiness: BLOCKED. Await owner review.** The application can start and display its shell without login, but the retained portfolio is not currently usable through authoritative live views.

## Prerequisite

The user's explicit “Approve” reply approved the PEC-1D Authentication Deferral Amendment before M8 began. PREREQUISITE_APPROVAL.json records that scoped instruction. Google OIDC/authentication remain DEFERRED_BY_OWNER. This is not a source-authority, independent-validation, migration or scoring approval.

## Actual outcome

A fresh production build passed and the app ran exclusively on 127.0.0.1 against the actual retained SQLite database. Eighteen real browser routes returned HTTP 200 without login/session/JS errors, navigation worked and redacted desktop screenshots were visually checked. SQLite integrity/FKs and Prisma connectivity pass. These observations establish local runtime/shell availability, not working portfolio data.

The current ledger validator rejects one of twelve retained opening transactions: the saved cash record includes a nonzero RECEIVABLE from opening.receivable, whereas the current builder regenerates CASH only. Saved facts/relational legs agree, and eleven other records replay identically. The aggregate therefore correctly fails closed. Cash/holdings/cost basis/history are withheld; the UI also misleadingly shows empty-portfolio/history copy. No validation bypass, receivable removal or data repair was made.

Retained rebuilt financial JSON/PDF/API data exists, but the dashboard research adapter still targets the intentionally removed legacy layout. Formal financial snapshots/independent acceptance are absent. Current accepted market/reference data is unavailable, so current NAV/actionability is blocked. Complete current membership query and performance time-series/benchmark/TWR/XIRR/CAGR are not implemented in the current UI. No subsequent trade/dividend ledger history is available to validate those live workflows.

## Tests versus readiness

135 synthetic unit/UI/accounting/runtime tests and 87 PEC-1B/PEC-2 regressions passed (222 total). They are explicitly not live runtime acceptance of missing/blocked features. Actual runtime evidence found blockers despite those green tests. Build completed with four existing filesystem tracing warnings. Sandbox launch denials were resolved through authorized review execution permissions; diagnostic BigInt serialization was corrected losslessly. The financial contract mismatch remains unresolved.

## Safety and recommendation

The review only performed build/read-only GET/browser/Prisma/SQLite diagnostics and synthetic tests. Production policies, source/approval/admission/activation contracts and actual database contents remain unchanged; twelve prior seals are verified. Eight original source candidates stay DEFERRED; no source approval, effective admission, D2 or scoring activation is created. The review server was stopped. No migrations, authentication implementation or new milestone work occurred.

Use the local UI only to inspect its blocked/empty states and retained evidence limitations. Do not rely on withheld balances/NAV or treat empty copy as proof no portfolio exists. Owner should review the specific ledger-compatibility, rebuilt-data adapter and accepted-market/reference gaps before authorizing a separately scoped remediation. Do not weaken gates, remove the receivable, restore deleted legacy folders or activate scoring to obtain a working-looking screen. Stop after this M8 review and await owner approval.

## Deliverables

- [Local runtime inventory](LOCAL_RUNTIME_INVENTORY.md)
- [Feature readiness matrix](FEATURE_READINESS_MATRIX.md)
- [Data availability report](DATA_AVAILABILITY_REPORT.md)
- [Security boundary review](SECURITY_BOUNDARY_REVIEW.md)
- [Validation results](VALIDATION_RESULTS.json)
- [Blockers](BLOCKER_STATUS.json)

Live evidence is LIVE_RUNTIME_RESULTS.json, ACTUAL_DATA_RECONSTRUCTION.json, LEDGER_DIAGNOSTIC.json and redacted screenshots under validation/. Final sealed safety receipt is validation/safety-verification.json; it must have packetSealChecked=true. A SHA-256 seal proves integrity only, not readiness/approval.
''')
 pointer=ROOT/'docs/fundamental-data-engine/M8_LOCAL_READINESS_CURRENT.md';require(not pointer.exists(),'CURRENT_POINTER_ALREADY_EXISTS');pointer.write_text('''# Current M8 local readiness review\n\nThe owner explicitly approved the PEC-1D authentication-deferral amendment on 2026-10-24 before M8 began; this supersedes the earlier pending-review statement without rewriting its sealed evidence. Authentication remains DEFERRED_BY_OWNER.\n\nM8 review completed: **BLOCKED for reliable live portfolio use**. Actual local startup/browser rendering works, but an opening-receivable replay mismatch blocks portfolio views; research integration/current market and several historical queries remain unavailable. No financial data repair, migrations, source approval, admission or scoring activation was performed.\n\n[Closure](evidence/2026-10-24-m8-local-application-readiness/CLOSURE_REPORT.md) · [Feature matrix](evidence/2026-10-24-m8-local-application-readiness/FEATURE_READINESS_MATRIX.md) · [Blockers](evidence/2026-10-24-m8-local-application-readiness/BLOCKER_STATUS.json). Await owner review; no next milestone starts.\n''')
 print('M8 complete: live runtime reviewed, substantive feature readiness BLOCKED; no financial fixes or activation.')

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--verify',action='store_true');p.add_argument('--require-seal',action='store_true');a=p.parse_args()
 if a.verify:print(json.dumps({k:v for k,v in verify(a.require_seal).items() if k!='evaluations'},indent=2))
 else:report()
