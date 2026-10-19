import json,pathlib,subprocess,hashlib,shutil
R=pathlib.Path.cwd();P=R/'docs/fundamental-data-engine/evidence/2026-10-19-di-market-data-boundary-amendment';V=P/'validation';V.mkdir(exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
def save(n,o):(P/n).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def load(p):return json.loads(pathlib.Path(p).read_text())
start='9bc65ca19e8c20990d866f83bc49151306b265f9';assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==start
request=pathlib.Path('/Users/nglehoangan/.codex/attachments/e9fa5dcc-5ba0-4b1c-9da3-385cc2ad2afe/Pasted text.txt').read_bytes();(P/'OWNER_REQUEST.txt').write_bytes(request)
base=load('/private/tmp/di-boundary-baseline-tests.json');final=load('/private/tmp/di-boundary-final-tests.json');focused=load('/private/tmp/di-focused.json');remediation=load('/private/tmp/di-remediation-tests.json')
def tests(j):return {s['name'].split('/tests/')[-1]+'::'+a['fullName']:{'status':a['status'],'failure':a.get('failureMessages',[])[:1]} for s in j['testResults'] for a in s['assertionResults']}
b,f=tests(base),tests(final);old=[k for k in b if b[k]['status']=='failed'];new=[k for k in f if f[k]['status']=='failed' and k not in old];fixed=[k for k in old if k in f and f[k]['status']!='failed']
assert not new,new;assert focused['numFailedTests']==0 and remediation['numFailedTests']==0
for name,j in [('baseline',base),('final',final),('focused',focused),('remediation',remediation)]:
 summary={'passed':j['numPassedTests'],'failed':j['numFailedTests'],'testFiles':len(j['testResults']),'suiteLoadErrors':[{'file':s['name'].split('/tests/')[-1],'message':s.get('message')} for s in j['testResults'] if s['status']=='failed' and not s['assertionResults']],'cases':tests(j)}
 (V/(name+'-vitest.json')).write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');assert not summary['suiteLoadErrors']
for name in ['lint','typecheck','build','dbvalidate','e2e','migration']:
 shutil.copyfile('/private/tmp/di-'+name+'.log',V/(name+'.log'))
sourcePaths=[]
for root in ['src','app','prisma','tests']:
 for fpath in pathlib.Path(root).rglob('*'):
  if fpath.is_file() and ('market-boundary' in str(fpath) or str(fpath) in ['src/domain/ranking/rank.ts','prisma/schema.prisma','tests/fixtures/historical-current-services.ts'] or str(fpath).startswith('prisma/migrations/202610190002')):sourcePaths.append(str(fpath))
changed=subprocess.check_output(['git','diff','--name-only',start],text=True).splitlines();sourcePaths=sorted(set(sourcePaths+changed+['app/api/readiness/route.ts','docs/08_CONTINUOUS_IMPROVEMENT/DI_MARKET_DATA_BOUNDARY_AMENDMENT.md']));hashes={n:sha(pathlib.Path(n).read_bytes()) for n in sourcePaths}
save('AMENDMENT_AUTHORITY.json',{'authority':'Owner explicit implementation authorization; independent architecture approved; amendment acceptance not self-granted','request':'OWNER_REQUEST.txt','requestSHA256':sha(request),'review':'../2026-10-19-di-market-data-boundary-review/FINAL_REVIEW.md','reviewSHA256':sha((P.parent/'2026-10-19-di-market-data-boundary-review/FINAL_REVIEW.md').read_bytes()),'amendment':'docs/08_CONTINUOUS_IMPROVEMENT/DI_MARKET_DATA_BOUNDARY_AMENDMENT.md','version':'di-market-boundary-v1','DI14':'PENDING_INDEPENDENT_APPROVAL','DI15':'PENDING under vNext; historical FAIL preserved'})
save('BASELINE_IDENTITY.json',{'startingHEAD':start,'startingTree':subprocess.check_output(['git','rev-parse',start+'^{tree}'],text=True).strip(),'initialWorktree':'CLEAN','endingHEAD':{'kind':'SELF_COMMIT','resolve':'git log -1 --format=%H -- docs/fundamental-data-engine/evidence/2026-10-19-di-market-data-boundary-amendment/BASELINE_IDENTITY.json','reason':'A commit cannot contain its own literal SHA without a cryptographic self-reference. Resolve the containing scoped commit; literal hash is reported in delivery.'},'node':'22.23.2','baselineExecution':'Independent git archive of startingHEAD + generated Prisma client + shared immutable installed dependencies; no implementation code copied into baseline','protectedDataManifest':'PROTECTED_DATA_HASHES.json'})
versions={'InitializationManifest':'initialization-manifest-v1','MarketDataCapability':'market-data-capability-v1','MarketSnapshot':'market-snapshot-v1','AnalysisSnapshot':'analysis-snapshot-v1','PortfolioSnapshotBinding':'portfolio-snapshot-binding-v1','DecisionSnapshot':'decision-snapshot-v1','PolicyBRankingEnvelope':'policy-b-ranking-envelope-v1','PolicyBRankingPublication':'policy-b-ranking-publication-v1'}
save('CONTRACT_VERSION_MATRIX.json',{'amendment':'di-market-boundary-v1','versions':versions,'versionDispatch':'readSealed / findRanking; unknown version fails closed','legacy':'Original fundamental, portfolio, score, decision and workflow readers remain unchanged. Frozen starting-HEAD current composition retained only in disposable test fixture.','newStore':'market_boundary_record + atomic decision seal + ranking publication; legacy tables untouched'})
save('IMPLEMENTATION_MANIFEST.json',{'status':'PASS','sourceFiles':hashes,'migrationIds':['202610190002_market_boundary'],'contractVersions':versions,'productionActivation':'BLOCKED; no source, approved session policy or independent initialization acceptance configured','boundary':'Trusted vNext BoundaryLifecycle and PolicyBRankingEngine; existing production FORMAL factories/action routes fail closed until accepted composition is wired','intentionalTestUpdates':['Exact additive table inventory extended by four tables; old schema/trigger/row preservation assertions unchanged','Original three production-composition expectations now exercise frozen starting-HEAD test-only composition; new test asserts actual production denies unqualified normalized market source'],'notPerformed':['real investment scoring/ranking/Top10','investment output','MBB evidence fetch','production schema migration','legacy evidence rewrite']})
shared={'implementation':'PASS','productionAcceptance':'BLOCKED','tests':'validation/focused-vitest.json','candidateOnly':True,'readyForScoring':False,'decisionReady':False}
save('INITIALIZATION_MANIFEST_REVIEW.json',{**shared,'bindings':['certified full30 universe','security/company master','sector master','canonical fundamentals','qualifications','Level1 dispositions','PolicyB29/1','active TCX exception','source/provenance contract','software/schema','MarketDataCapability','durable dataClassPolicy'],'marketPricesRequired':False,'candidate':'BLOCKED missing independently qualified capability and durable/session policy qualification','doesNotClaim':['AnalysisReady','DecisionReady']})
source={'MARKET_DATA_CAPABILITY':'BLOCKED','realMarketSourceUsed':'none','rawSourceReplay':'NOT_AVAILABLE','reason':'No repository-supported approved real-market raw-source adapter/corpus or approved session/calendar policy is configured. LocalCurrentSource accepts normalized manual rows and free-text references, not retained provider raw replay. Financial report adapters are not approved market observation authorities.','sourceScan':['src/infrastructure/current-source.ts','src/ports/current.ts','docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md §source stack','../2026-10-19-di-market-data-boundary-review/MARKET_DATA_READINESS_PROPOSAL.md'],'networkFetchAttempted':False,'authenticationBypassed':False,'mocksCountAsCapabilityAuthority':False,'testCorpus':'Synthetic temp raw payload verifies mechanisms only; never copied into production capability evidence.','retention':'Actual accepted market raw/request/hash/known-at/schema/parser dependencies must be retained separately from disposable financial OCR.'}
save('MARKET_SOURCE_REAL_EVIDENCE.json',source);save('MARKET_DATA_CAPABILITY_REVIEW.json',{**shared,**source,'qualifiedContractCovers':['approved source/request identity','raw path/hash/retention','retrieval/provider/trading times','schema and normalizer','durable security identity/venue intervals','currency/unit/field/basis','corporate actions','missing/duplicate/conflict','freshness/calendar','negative cases','deterministic raw replay'],'productionCapabilityCertificateWritten':False})
for n,parts in [('DI04',['DI4A capability qualification at initialization: BLOCKED','DI4B actual observations at consumption: BLOCKED']),('DI08',['DI8A durable reporting-cycle/reference policy and market evaluator qualification: BLOCKED','DI8B approved market session freshness at consumption: BLOCKED']),('DI12',['DI12A runtime initialization manifest reproducible: BLOCKED pending real capability','DI12B immutable analysis snapshot: implemented, not production accepted','DI12C atomic decision snapshot: implemented, not production accepted'])]:save(n+'_VNEXT_REVIEW.json',{**shared,'gate':'BLOCKED','parts':parts,'historicalStatus':'FAIL unchanged','reviewBundleHashIsNotRuntimeAcceptance':True})
save('MARKET_FRESHNESS_GATE_REVIEW.json',{**shared,'status':'PASS_IMPLEMENTATION_BLOCKED_PRODUCTION','gate':'MARKET_DATA_FRESHNESS_GATE','policy':'Explicit approved purpose/session/calendar windows; no invented universal day threshold','trustedTime':'Live cutoff is derived from injected trusted clock; caller past-asOf cannot authorize stale reuse. Freshness recomputed again at decision/publication, then expiry checked inside transaction.','unknown':'BLOCKED','noMarketPurpose':'FUNDAMENTAL_DESCRIPTION only, no investment output','cache':'Exact dependencies plus revalidation; no older fallback, missing-to-zero or retrieval-as-trading-date','staleRegression':'Oct19 initialization preserved; old snapshot remains evidence; Oct25 request blocked using test-only approved-window fixture','productionPolicy':'NOT_AVAILABLE'})
save('ANALYSIS_SNAPSHOT_REVIEW.json',{**shared,'status':'PASS','immutable':True,'bindings':['initialization/fundamental/universe','exact market raw source hashes','input artifact hashes','29/1 partition','TCX exception','freshness proof','prerequisites','policy/model/engine'],'liveFreshnessRecomputed':True,'descriptivePurposeCannotMasqueradeAsRanking':True})
save('DECISION_SNAPSHOT_REVIEW.json',{**shared,'status':'PASS','sequence':['private candidate','accepted analysis/portfolio/input dependencies','quarantine + exceptions + qualitative/valuation/risk prerequisite proof','freshness at trusted consumption','current dependency hash','transaction: verify head/dependencies/expiry and append record+seal','return only after commit'],'persistenceFailure':'Throws, rollback, no actionable result','dependencyHead':'No production head writer/accepted activation configured. Before activation every relevant universe/fundamental/disposition/exception/policy/model/source/ledger mutation must transactionally maintain this authoritative head. No caller-selected current pins.','replay':'Frozen versions preserved; new live use revalidates, replay does not refresh history'})
save('POLICY_B_RANKING_REVIEW.json',{**shared,'status':'PASS','FULL_UNIVERSE_COUNT':30,'ELIGIBLE_COUNT':29,'DEFERRED_COUNT':1,'excluded':['MBB'],'scoreForDeferred':None,'label':'Top ranked among currently scorable VN30 constituents.','weightRedistribution':False,'capitalRedistribution':False,'arithmetic':'Shared unchanged M3 math/gates; only explicitly deferred missing coverage is allowed in new envelope. Legacy all30 route unchanged.','publication':'PolicyBRankingEngine binds accepted analysis, persisted FORMAL input hashes, revalidates freshness, transactionally persists separate versioned publication. Not written through legacy Ranking reader.','productionRankingRun':False,'syntheticTestsOnly':True})
save('PIT_REPLAY.json',{**shared,'status':'PASS','tests':['future fundamentals','future universe','future exception','future market availability','later corporate-action knowledge','live past-asOf bypass'],'historical':'Original effective/knownAt policies, source availability and exceptions required; no current fetch/restatement repairs old knowledge. Immutable legacy inputs unchanged.','actualBacktestRun':False})
save('LEGACY_REPLAY_REVIEW.json',{'status':'PASS','scope':'Reader/contract backward compatibility and retained dependencies; does not claim deleted historical raw files have reappeared','legacyReadersChanged':False,'oldStrictMARKETReferenceRequired':True,'oldProduction30Accounting':'Exact original DB bytes and canonical body hashes verified in PROTECTED_ACCOUNTING_REPLAY.json','legacyDecisionPortfolioWorkflowTests':'Existing integration tests and frozen startingHEAD test fixture pass','preExistingMissingSourceTests':len(old),'missingHistoricalSourceReplayRemainsUnavailable':True})
save('REGRESSION_RESULTS.json',{'status':'PASS_NO_NEW_REGRESSIONS','STARTING_HEAD':start,'baselinePassed':base['numPassedTests'],'baselineFailed':base['numFailedTests'],'finalPassed':final['numPassedTests'],'finalFailed':final['numFailedTests'],'NEW_REGRESSIONS':len(new),'ACCOUNTING_REGRESSIONS':0,'PRE_EXISTING':[{'case':k,'baseline':b[k],'final':f.get(k)} for k in old],'resolvedBaselineCases':fixed,'suiteGreen':False,'firstRunNewFailures':9,'firstRunResolution':'Six migration-inventory expectations updated additively; three old composition tests preserved under frozen test-only legacy composition plus new production-denial test. Exact old assertions retained.','focusedLatestSourcePassed':focused['numPassedTests'],'remediationPassed':remediation['numPassedTests']})
save('NEGATIVE_TEST_RESULTS.json',{'status':'PASS','source':'validation/focused-vitest.json','negativeCases':[{ 'case':k,'status':v['status']} for k,v in tests(focused).items()],'syntheticOnly':True,'productionSourceCertification':False})
logs={n:sha((V/(n+'.log')).read_bytes()) for n in ['lint','typecheck','build','dbvalidate','e2e','migration']}
save('TEST_RESULTS.json',{'lint':'PASS','typecheck':'PASS','productionBuild':'PASS','dbValidation':'PASS','architecture':'PASS (lint includes dependency graph; focused includes new boundary tests)','migration':'PASS isolated fresh databases and populated production-copy; repeat deploy/status','unitIntegrationFullSuite':{'passed':final['numPassedTests'],'failed':final['numFailedTests'],'preExisting':len(old),'newRegressions':len(new)},'focused':{'passed':focused['numPassedTests'],'failed':0},'browserE2E':'PASS13 tests including no-store distinct readiness API','protectedAccounting':'PASS all30 unchanged','logsSHA256':logs,'notClaimed':'Whole suite green or real-market capability certified'})
issues=[{'id':'MARKET_CAPABILITY_REPLAY_NOT_QUALIFIED','parent':'RELEASE-MARKET-SOURCE-REPLAY-UNAVAILABLE','status':'OPEN','severity':'MAJOR','owner':'INITIALIZATION','blocks':'vNext initialization capability','reason':source['reason']},{'id':'CURRENT_MARKET_SNAPSHOT_NOT_AVAILABLE','parent':'RELEASE-MARKET-SOURCE-REPLAY-UNAVAILABLE','status':'OPEN','severity':'MAJOR','owner':'ANALYSIS_TIME','blocks':'Market-dependent analysis/decision'},{'id':'APPROVED_SESSION_POLICY_NOT_AVAILABLE','status':'OPEN','severity':'MAJOR','blocks':'Freshness qualification','reason':'No calendar/session/timezone/purpose policy is independently pinned; test fixture is not production authority'},{'id':'INDEPENDENT_AMENDMENT_DI14_DI15_ACCEPTANCE','status':'PENDING','blocks':'Production activation','reason':'Independent review required. Production FORMAL entrypoints remain denied. Dependency-head maintenance/source/session authority must be wired and independently qualified before activation.'},{'id':'LEGACY_SOURCE_REPLAY_BASELINE_FAILURES','status':'OPEN_PRE_EXISTING','count':len(old),'blocks':'Historic source replay where source deleted','reason':'18 failures independently reproduced at startingHEAD; no weakening or silent source recreation'},{'id':'MBB_CONSOLIDATED_CAR_20260630','status':'OPEN_UNCHANGED','blocks':'MBB fundamental eligibility/new capital','reason':'No new MBB evidence requested or acquired'}]
save('OPEN_ISSUES.json',{'historicalParentIssuePreserved':True,'issues':issues,'severityDowngraded':False,'historicalDI4DI8DI12':'FAIL unchanged','historicalDI14':'PENDING unchanged','historicalDI15':'FAIL unchanged','vNextDI14':'PENDING_INDEPENDENT_APPROVAL','vNextDI15':'PENDING'})
text='''DI MARKET-DATA BOUNDARY AMENDMENT
=================================

IMPLEMENTATION:
PASS

NEW_REGRESSIONS:
0

ACCOUNTING_REGRESSIONS:
0

LEGACY_REPLAY:
PASS

FULL_UNIVERSE:
30

FUNDAMENTALLY_SCORABLE:
29

DEFERRED:
MBB

TCX_EXCEPTION:
ACTIVE

INITIALIZATION_vNEXT:
BLOCKED

MARKET_CAPABLE:
false

MARKET_CURRENT:
false

ANALYSIS_READY:
false

DECISION_READY:
false

DI4_vNEXT:
BLOCKED

DI8_vNEXT:
BLOCKED

DI12_vNEXT:
BLOCKED

DI14:
PENDING_INDEPENDENT_APPROVAL

DI15:
PENDING

readyForScoring:
false

decisionReady:
false

REAL MARKET SOURCE USED FOR CAPABILITY:
none

RAW SOURCE REPLAY:
NOT_AVAILABLE

POLICY-B RANKING ENVELOPE:
PASS

MBB QUARANTINE:
PASS

TCX EXCEPTION PROPAGATION:
PASS

HISTORICAL PIT:
PASS

The prospective infrastructure is implemented; this is not independent production acceptance. No approved real-market adapter/raw corpus or approved session-calendar policy is configured, so capability and vNext initialization remain blocked. No fetch was made to turn a gate green. Synthetic raw fixtures validate mechanisms, not production source authority.

Versioned amendment extends/supersedes prospectively the market clauses of DI4/8/12. Approved M1–M7 documents, historic DI outcomes, old readers and the original strict snapshot contract remain unchanged. New immutable initialization/market/analysis/portfolio/decision records use additive storage. The old all30 ranking reader stays strict; the new Policy-B envelope preserves30 identities/29 eligible/excluded MBB and uses the same M3 math with no placeholder or redistribution.

Initialization binds approved durable inputs, reporting-cycle policy and real capability without a current quote. Analysis recomputes freshness using approved session windows and the trusted current cutoff; unknown calendar, source, identity, semantics, conflict or adjustment blocks. A historic snapshot can remain immutable while a later live request is blocked. FUNDAMENTAL_DESCRIPTION is purpose-specific and cannot authorize investment output.

Decisions require exact accepted analysis and current portfolio, prerequisite/risk/eligibility evidence, active exceptions, raw/policy/model/version pins and current dependency state. Publication returns only after transactionally saving the envelope and seal; failures roll back. Ranking publication uses a separate versioned path bound to accepted analysis and persisted FORMAL input hashes. Production factories/actions remain denied until independently accepted vNext composition is wired. Dependency-head maintenance for every relevant state mutation is a required activation prerequisite, not a caller-supplied hash.

Validation: FULL_COUNTS. Lint, typecheck, DB validation, boundary checks, production build,FOCUSED_COUNT focused tests and13 browser/E2E tests pass. Eighteen source-evidence baseline failures were independently reproduced at startingHEAD; the full suite is not green. See REGRESSION_RESULTS.json for exact cases. Initial implementation-only test failures were fixed without dropping preservation/corruption assertions: exact additive table lists were extended, old composition tests retain their original assertions under a frozen test-only startingHEAD fixture, and a new test verifies production denial.

Protected replay verifies unchanged bytes for every retained data file, the active SQLite database,30 canonical admission bodies,29/1 partition and TCX exception. Populated-copy migration preserves all old rows/schema/triggers; production DB is not migrated or promoted. LEGACY_REPLAY PASS means compatibility for retained dependencies; missing historic raw remains unavailable and accounts for the pre-existing failures. Historical PIT tests are synthetic enforcement tests, not a backtest performance claim.

VNM stays CLOSED / reported borrowings scope; VIB stays CLOSED / consolidated CAR11.8% at2026-06-30, supporting NPL NOT_PROVEN; VIC stays CLOSED with reviewed6M2026 provenance. TCX5,284,485,167,173 VND remains an Owner analytical exception, not issuer-proven conventional financial debt. MBB remains INSUFFICIENT/NOT_SCORABLE; held-position NAV is separate. No MBB evidence or investment outputs were produced.

Historical RELEASE-MARKET-SOURCE-REPLAY-UNAVAILABLE is preserved. Its prospective capability/replay and current-observation children remain OPEN. DI14 is not approved; historical DI15 FAIL is preserved and vNext DI15 is PENDING. No runtime initialization/market/analysis/decision snapshot or scoring acceptance was created.

Starting HEAD:9bc65ca19e8c20990d866f83bc49151306b265f9. Ending HEAD is the containing scoped commit, resolved exactly by BASELINE_IDENTITY.json (avoids commit self-reference). Migration:202610190002_market_boundary. Exact changed files, source hashes, contracts and test results are in IMPLEMENTATION_MANIFEST.json, CONTRACT_VERSION_MATRIX.json and TEST_RESULTS.json.

STOP. Await independent review: Review DI Market-Data Boundary Amendment.
'''.replace('FOCUSED_COUNT',str(focused['numPassedTests'])).replace('FULL_COUNTS',str(final['numPassedTests'])+' tests passed /'+str(final['numFailedTests'])+' failed, all18 PRE_EXISTING; zero new regressions')
(P/'FINAL_REVIEW.md').write_text(text)
(P/'README.md').write_text('''# DI Market Data Boundary Amendment — implementation candidate

Start with [FINAL_REVIEW.md](FINAL_REVIEW.md). No independent acceptance or live source qualification is claimed. Production readiness remains false; historical evidence is preserved.

- Versioned governance: docs/08_CONTINUOUS_IMPROVEMENT/DI_MARKET_DATA_BOUNDARY_AMENDMENT.md.
- Contracts/runtime: src/domain/market-boundary, src/application/market-boundary, src/infrastructure/market-boundary-authority.ts, repositories/market-boundary.ts.
- Additive migration validated on disposable fresh DBs and production copy only. No production schema/data write.
- Protected replay: build-protected-review.py uses retained baseline hashes and a disposable /private/tmp/di-market-migration/production-copy.sqlite created via SQLite read-only backup, then migrated with the project-supported Node22.23.2; it writes only this package.
- Validation commands: pnpm lint; pnpm typecheck; pnpm db:validate; pnpm build; node node_modules/vitest/vitest.mjs run; node scripts/smoke-app.mjs --e2e. Baseline suite executed from a clean git archive of startingHEAD with its own generated client. New fixtures are synthetic and cannot qualify a production source.
- Scope: candidate contracts, fail-closed production boundary, additive persistence and tests. No source scraping, automatic price refresh, MBB evidence or actual investment scoring/ranking/Top10.
- Exact baseline/final/focused/remediation case results and gate logs are under validation/. The suite remains red for18 independently reproduced pre-existing missing-source evidence cases.
- Review bundle hashes are not runtime snapshot acceptance. No DI14/15 approval is granted.
''')
# Every package artifact except the seal itself is immutable under this checksum ledger.
files={str(p.relative_to(P)):sha(p.read_bytes()) for p in P.rglob('*') if p.is_file() and p.name!='ARTIFACT_HASHES.json'}
save('ARTIFACT_HASHES.json',{'algorithm':'SHA256','startingHEAD':start,'files':files,'sourceFiles':hashes,'endingHEAD':'Resolve the scoped containing commit as specified by BASELINE_IDENTITY.json'})
print(json.dumps({'implementation':'PASS','fullPassed':final['numPassedTests'],'preExistingFailures':len(old),'newRegressions':len(new),'focusedPassed':focused['numPassedTests'],'sealedFiles':len(files),'productionCapability':False}))
