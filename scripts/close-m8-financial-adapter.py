"""Current-layout research closure. Verify actual immutable inputs; no data or DB writes."""
import datetime,importlib.util,json,subprocess
from pathlib import Path
from collections import Counter
from lib.pe4_evidence import sha,verify_seal
from lib.pec1b_workflow import pec2_preparation_boundary
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/fundamental-data-engine/evidence';OUT=E/'2026-10-24-m8-financial-current-layout-adapter'
def read(p):return json.loads(p.read_text())
def save(n,x):(OUT/n).write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
def md(n,x):(OUT/n).write_text(x.strip()+'\n')
def require(x,message):
 if not x:raise ValueError(message)
def main():
 spec=importlib.util.spec_from_file_location('h',ROOT/'scripts/prepare-pec1b-evidence.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
 before=read(OUT/'DATABASE_BASELINE.json');after=h.database();require(before==after,'DATABASE_CHANGED')
 allowed={'app/[screen]/[id]/page.tsx','app/server/dashboard.ts','src/application/dashboard/model.ts','src/ui/dashboard.tsx','src/ui/navigation.ts','tests/unit/data-freshness-ui.test.tsx','tests/unit/dashboard-screens.test.ts'}
 baseline=read(OUT/'PROTECTED_INPUT_HASHES.json');changed={p for p,v in baseline.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=v};require(changed==allowed,'UNEXPECTED_CHANGE:'+str(changed))
 require({p for p in baseline if p.startswith('data/')}=={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()},'DATA_NAMESPACE_CHANGED')
 previous=E/'2026-10-24-m8-ledger-compatibility-remediation';packages=[ROOT/r['package'] for r in read(previous/'PRIOR_SEAL_VERIFICATION.json')]+[previous];seals=[verify_seal(ROOT,p) for p in packages];save('PRIOR_SEAL_VERIFICATION.json',seals)
 now=datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z');p=E/'2026-10-23-production-evidence-closure-pec2';records=read(p/'ADMISSION_CANDIDATES.json')['records'];bundles=read(p/'EVIDENCE_BUNDLES.json')['bundles'];evaluations=[]
 for r in records:
  b=next(b for b in bundles if b['core']['pec1Candidate']['candidateId']==r['candidateId']);v=pec2_preparation_boundary(r,b['core'],b['receipts'],records,now,root=ROOT)
  require(v['PEC2Result']['effectiveAdmissionState']=='DEFERRED' and all(v[k] is False for k in ['productionUseAuthorized','runtimeActivationAuthorized','scoringAuthorized']),'AUTHORITY_GATE_CHANGED');evaluations.append(v)
 require(len(evaluations)==8,'CANDIDATE_COUNT')
 ledger=read(OUT/'LEDGER_REPLAY_RESULTS.json');require(ledger['status']=='PASS' and ledger['transactionsReplayedExactly']==12 and ledger['holdings']==11,'LEDGER_REGRESSION')
 oldstate=read(previous/'ACTUAL_DATA_RECONSTRUCTION.json')['summaries'][0]['reconstructionHash'];require(ledger['stateHash']==oldstate,'LEDGER_STATE_CHANGED')
 coverage=read(OUT/'ACTUAL_DATA_COVERAGE.json');require(coverage['status']=='PASS' and coverage['catalogTickers']==30,'COVERAGE_FAILED')
 live=read(OUT/'LIVE_RUNTIME_RESULTS.json');require(not live['fixturesInjected'] and live['productionWritesPerformed']==0 and not live['pageErrors'],'LIVE_FAILURE');require(all(c['exactValuesAndLineageMatched'] for c in live['comparisons']),'LIVE_VALUE_FAILURE')
 require(live['navigationWorked'] and live['quarantineVisible'] and live['invalidVariantFailsClosed'],'LIVE_BOUNDARY_FAILURE')
 require(all(live['readinessApi']['body'][k] is False for k in ['readyForScoring','marketCurrent','analysisReady','decisionReady']),'READINESS_GATE_CHANGED')
 unit=read(OUT/'validation/unit-regressions.json');adapter=read(OUT/'validation/adapter-tests.json');pec=read(OUT/'validation/pec2-regressions.json');require(all(d['success'] for d in [unit,adapter,pec]),'TEST_FAILURE')
 require('PASS boundaries:' in (OUT/'validation/architecture-boundaries.log').read_text(),'BOUNDARY_FAILURE')
 require('Finalizing page optimization' in (OUT/'validation/next-build.log').read_text(),'BUILD_FAILURE')
 listener=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:38417','-sTCP:LISTEN'],capture_output=True,text=True);require(listener.returncode==1 and not listener.stdout.strip(),'SERVER_NOT_STOPPED')
 require(not (ROOT/'data/manual-current').exists() and not (ROOT/'data/manual-fundamentals').exists(),'LEGACY_DIRECTORY_RESTORED')
 safety={'status':'PASS','verifiedAt':now,'databaseBytesUnchanged':True,'databaseSha256Before':before['sha256'],'databaseSha256After':after['sha256'],'logicalDumpSchemaTableCountsMethodologiesUnchanged':True,'originalFinancialFilesUnchanged':sum(p.startswith('data/') for p in baseline),'ledgerTransactionsReplayedExactly':12,'ledgerLegsReplayedExactly':24,'holdingsUnchanged':11,'ledgerStateHash':ledger['stateHash'],'otherProtectedFilesUnchanged':len(baseline)-len(allowed),'authorizedExistingFileChanges':{p:{'before':baseline[p],'after':sha(ROOT/p)} for p in sorted(allowed)},'priorSealsVerified':len(seals),'frozenPoliciesUnchanged':True,'sourceApprovalsCreated':0,'independentAcceptancesCreated':0,'effectiveAdmissionsCreated':0,'candidateStates':{'DEFERRED':8},'D2Activated':False,'scoringActivated':False,'databaseMigrationsExecuted':0,'authenticationImplemented':False,'legacyDirectoriesRestored':False,'marketDataRemediationStarted':False,'nextMilestoneStarted':False,'reviewServerStopped':True,'candidateEvaluations':evaluations};save('SAFETY_VERIFICATION.json',safety)
 node='/private/tmp/node-v22.23.2-darwin-arm64/bin/node';base=str(OUT.relative_to(ROOT));commands=[{'command':node+' --import ./scripts/lib/ts-runtime.mjs scripts/'+s,'result':'PASS','classification':c} for s,c in [('validate-m8-financial-research.mjs','ACTUAL_RETAINED_FILES'),('validate-m8-financial-ledger.mjs','ACTUAL_SQLITE_PRISMA_REPLAY'),('validate-m8-financial-live.mjs','ACTUAL_BROWSER_GET_ONLY')]]
 tests=' '.join('tests/unit/'+s for s in ['retained-financial-research.test.tsx','opening-receivable-compatibility.test.ts','portfolio-accounting.test.ts','portfolio-read-models.test.ts','dashboard-ui.test.tsx','dashboard-screens.test.ts','manual-fundamentals-ui.test.tsx','data-freshness-ui.test.tsx','runtime-readiness.test.ts','runtime-dataset-acceptance.test.ts'])
 commands += [{'command':node+' node_modules/vitest/vitest.mjs run '+tests+' --reporter=json --outputFile='+base+'/validation/unit-regressions.json','result':'PASS','passed':unit['numPassedTests'],'failed':unit['numFailedTests'],'classification':'SYNTHETIC_UNIT_TESTS_NOT_LIVE_ACCEPTANCE'},{'command':node+' node_modules/vitest/vitest.mjs run tests/unit/retained-financial-research.test.tsx --reporter=json --outputFile='+base+'/validation/adapter-tests.json','result':'PASS','passed':adapter['numPassedTests'],'note':'Rerun after final accessibility wrapper correction.'},{'command':'PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec2-final-review.py --json '+base+'/validation/pec2-regressions.json','result':'PASS','passed':pec['testsRun']},{'command':node+' scripts/check-boundaries.mjs','result':'PASS'},{'command':'NEXT_TELEMETRY_DISABLED=1 '+node+' node_modules/next/dist/bin/next build','result':'PASS','note':'Fresh production build and TypeScript; existing DB filesystem tracing/experimental SQLite warnings.'},{'command':"NEXT_TELEMETRY_DISABLED=1 DATABASE_URL='file:"+str(ROOT/'data/vn30.sqlite')+"' "+node+' node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 38417','result':'PASS_STOPPED_AFTER_REVIEW'},{'command':'PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=scripts python3 scripts/close-m8-financial-adapter.py','result':'PASS'}]
 resolved=[{'check':'Initial actual-data parser probe','failure':'Null asOf rejected although retained schema explicitly permits unknown boundaries.','resolution':'Accepted explicit null without filling it; unknown-period values withheld.'},{'check':'Initial architecture check','failure':'Zod import outside approved schema/configuration layer.','resolution':'Moved parsing schemas to infrastructure/config; boundary checker unchanged.'},{'check':'Initial broad regression run','failure':'181 passed, 2 failed: route catalog still expected no VN30 detail; data eyebrow expected sealed-only wording.','resolution':'Added explicit research-detail route test and updated the presentation label expectation; gate assertions retained. Final expanded suite passes.'},{'check':'First live browser run','failure':'Duplicate accessible research region from nested outer section and Panel.','resolution':'Changed outer wrapper to div; rebuilt, reran targeted UI/adapter tests and actual browser acceptance.'},{'check':'Browser navigation timing','failure':'URL changed before streamed research rows completed (0 observed versus 73 expected).','resolution':'Browser assertions now wait for the expected server-rendered row count; final exact comparisons pass.'},{'check':'Optional supplemental screenshot clip','failure':'Additional top-of-panel clip fell outside the viewport after completed live acceptance.','resolution':'Existing successful full-panel desktop/mobile screenshots retained for visual QA; no application or acceptance failure.'}]
 save('VALIDATION_RESULTS.json',{'status':'PASS','commands':commands,'unitPassed':unit['numPassedTests'],'unitFailed':unit['numFailedTests'],'adapterTestsPassed':adapter['numPassedTests'],'PEC2TestsPassed':pec['testsRun'],'actualTickerFilesParsed':30,'actualRetainedDefaultPagesChecked':30,'actualTransactionsReplayedExactly':12,'actualHoldingsUnchanged':11,'liveComparisons':len(live['comparisons']),'liveRoutes':len(live['routes']),'resolvedDuringImplementation':resolved,'remainingTestFailures':[],'validationLimits':['Full consumed schema and combined hash checked for all 30 ticker files. Source/value lineage checked for displayed pages and representative live variants, not every retained corpus cell.','Extraction/OCR and caption/period/scope/unit correctness are not independently accepted.','Publication timestamps are unqualified; no historical AS_KNOWN analysis enabled.','No market-data freshness threshold invented; current NAV and scoring readiness stay blocked.','Prisma/runtime connection performs existing connection PRAGMAs; database bytes and logical state remain identical.']})
 counts=Counter();scopes=Counter()
 for r in coverage['records']:counts.update(r['retainedSelectionCounts']);scopes.update(r['scopes'])
 md('CURRENT_LAYOUT_ANALYSIS.md','''# Current retained-layout analysis

Owner explicitly approved the prior ledger remediation and authorized this adapter in the current session; see OWNER_APPROVAL.json. That decision has no source/admission authority scope.

Active research structure is `data/combine/manifest.json` (`vn30-combine-v1`) and thirty manifest-hash-bound `<TICKER>.json` files with the same schema, policy `report-display-source-priority-v2`, status UNREVIEWED_PRESENTATION and productionAdmissible=false. Hierarchy is reports → report key → periods → period key → variants → groups → rows. All sources/variants remain distinct. Annual, quarterly, YTD, instant and unresolved periods are not merged. Total retained selection counts are descriptive presentation counts, not qualified metrics.

Lineage inputs are `data/manual-download/manifest.json` (vn30-vietstock-download-v1), `data/manual-extracted-pdf/manifest.json` (manual-display-raw-v1), `data/manual-extracted-pdf/display-manifest.json` (manual-display-v1), and `data/manual-extracted-api/manifest.json` (cafef-display-v1) plus `requests.json`. PDFs are directly retained under manual-download. Per-ticker PDF/API extracted JSON supplies exact row pointers. API raw responses remain under manual-extracted-api/raw/cafef. API schema failures are in the API manifest, with ticker, endpoint, mode, raw path and error. Notes and combined review directories remain retained but are not promoted to metrics or an admitted snapshot by this adapter.

Before this change, `app/server/dashboard.ts` called `readManualCurrentSnapshot`, which expects the removed `data/manual-current/current-analysis.json` and manual-fundamentals PDF directory. No active loader now imports that legacy reader. Its source remains historical, but no legacy directory, link or transformed replacement snapshot was recreated.

Existing CurrentAnalysisSnapshot includes canonical accounting/readiness semantics and is consumed by a scoring bridge. It is unsuitable for unreviewed combined presentation values. A new, deliberately separate RetainedResearch DTO represents only read-only research, with no canonicalFacts, accepted snapshot or scoring input.

Source hashes identify exact retained bytes, not publisher authority. Retrieval dates are not publication times. Actual publication times remain null/unqualified. Explicit CONSOLIDATED/STANDALONE scope survives; unknown scope remains UNKNOWN, including some files whose names suggest parent statements. No filename-derived authority or scope qualification is invented.
''')
 md('FINANCIAL_ADAPTER_CONTRACT.md','''# Retained financial research adapter v1

DTO contract: `retained-financial-research-v1`; classification RETAINED_RESEARCH_DATA. Production-admissible=false, scoringAuthorized=false, historicalAsKnownSupported=false are fixed properties. This DTO cannot substitute for PRODUCTION_ADMITTED_FINANCIAL_DATA or CurrentAnalysisSnapshot.

Read only exact manifest paths under the real data root. Validate schema versions, ticker identity, policy, unreviewed status and explicit productionAdmissible=false. Manifest paths must match ticker filenames; combined bytes must match the manifest hash. Reject unsupported versions, unsafe paths, duplicate tickers, invalid selection/page input and binary floating-point financial values. Reads are bounded to 170MB/file, 10,000 variants and 100 rows per page; realpath checks prevent symlink/path escape. Per-request caches avoid stale cross-request data promotion.

Preserve stable variant identity, report key/period distinction, source path/hash, exact decimal strings, native units/currency/scale, stored scope, review reasons, row JSON Pointer and PDF physical page or raw API locator. Validate displayed source bytes, extracted-file manifest hashes, original row pointer/value, caption/code, reporting metadata and source variant hash/path. PDF bytes must be a PDF and bind to download/extraction manifests. API source must bind to a successful exact request inventory record; quarantined paths are excluded. Unknown metadata remains explicit. No EPS scaling, derived ratios, aggregation, equal-value mapping, duplicate removal or accounting qualification is created.

Default is the first retained PDF variant with a nonfuture resolved reporting boundary when present, otherwise retained index 0. This is a navigation starting point, not a latest/best/approved statement selection. All variants remain selectable; source-priority selections within their rows are unchanged. Pagination is explicit and deterministic. No cross-scope merge occurs.

Reporting boundaries are separate from retrieval and publication. Dates must be valid; annual and quarter/YTD boundaries are derived only from explicit period metadata. Unknown period or retrieval time, future reporting boundary/capture, quarantine, bad source/value lineage or invalid decimal text withholds the numeric value with a reason. Missing/unresolved rows stay null, never zero. Unknown publication remains null; current retained research is permitted with an explicit unqualified-publication warning, but no historical AS_KNOWN or production cutoff acceptance is inferred. The server supplies viewedAt; route queries accept only variant/page, never a user knowledge-clock override.

Optional research errors show a local unavailable alert and do not weaken or replace the separate ledger reader, production financial admission, independent acceptance or scoring activation gates. UI exposes no financial mutation or acceptance operation. All forms use GET.
''')
 md('IMPLEMENTATION_REPORT.md',f'''# Implementation report

New contracts/parser/reader/view: `src/domain/fundamentals/retained-research.ts`, `src/infrastructure/config/retained-research.ts`, `src/infrastructure/fundamentals/retained-research.ts`, `src/ui/retained-research.tsx`. DashboardModel gains an optional presentation-only DTO. Server composition now reads current-layout research for Data Freshness, VN30 and Scorecards. VN30 ticker details accept bounded variant/page queries. Existing data acceptance parameters and production readers are unchanged. The data-page eyebrow now accurately labels financial data status rather than claiming every displayed record is sealed.

UI includes thirty ticker links, report/period/scope variant selector, exact native-unit values, missing/withheld warnings, capture/publication distinction, provenance details and all eight quarantine entries. Explicit scope and unknown scope are kept apart. Large statements paginate by 100 rows; numeric values remain on one line within scrollable tables. Research access creates no financial write, admission or scoring operation.

Validation: {unit['numPassedTests']} unit tests; {adapter['numPassedTests']} targeted adapter/UI tests rerun after the final accessibility fix; {pec['testsRun']} PEC-2 gate tests. Actual reads parse all thirty files, inspect default pages and representative VNM consolidated/parent-labelled/API variants. Actual ledger replay still reproduces twelve transactions/24 legs and eleven holdings. Fresh build, architecture checks and live browser comparisons pass. Existing tests changed only for the explicit new VN30 research-detail route and accurate data-page wording; frozen contracts and gate checks remain intact.

No dependencies installed, original financial JSON changed, legacy directories restored, database migration or market-data remediation started. Known implementation-time test/harness failures and resolutions are recorded in VALIDATION_RESULTS.json.
''')
 table='\n'.join('|'+ '|'.join(str(x) for x in [r['ticker'],r['variants'],','.join(r['scopes']),r['displayedRows'],r['numericRows'],r['withheldRows']])+'|' for r in coverage['records'])
 md('DATA_COVERAGE_REPORT.md',f'''# Retained research coverage

Thirty ticker files pass consumed-schema validation and combined manifest hashing. Retained selection totals: PDF_REPORTED {counts['PDF_REPORTED']:,}; CAFEF_REFERENCE {counts['CAFEF_REFERENCE']:,}; MISSING {counts['MISSING']:,}; UNRESOLVED_MAPPING {counts['UNRESOLVED_MAPPING']:,}. These are unreviewed presentation counts, not accepted facts.

Eight API schema quarantines persist: CTG four and VCB four. None is repaired or admitted. Manifest records and live UI show exact paths/errors. Quarantine is not a zero value or proof the ticker has no financial data.

|Ticker|Variants|Stored scopes|Default page rows|Numeric candidates|Withheld rows|
|---|---:|---|---:|---:|---:|
{table}

All thirty catalogs contain unknown scopes. Twenty-nine contain explicit consolidated variants; fifteen contain STANDALONE variants. Actual parent-labelled VNM file probe retains UNKNOWN where the source JSON does not qualify its scope. Synthetic tests separately verify explicit PARENT/CONSOLIDATED preservation. This does not certify all thirty issuers' parent/consolidated coverage.

Default pages are bounded samples, not full-corpus semantic acceptance. Some rows are withheld for source/value-pointer mismatches or unresolved periods; see ACTUAL_DATA_COVERAGE.json for per-ticker reasons. They were not silently repaired. Representative VNM consolidated PDF, parent-labelled PDF and CafeF probes preserve exact values/pointers. The live browser additionally checks unknown/future-period variants when present and pagination against the reader.

Publication-qualified variants: zero. Retrieval times describe retained captures, not issuer publication or certified financial freshness. Current NAV and accepted financial/scoring data remain unavailable. No financial metrics were fabricated, no source images re-reviewed and no OCR correctness claim made.
''')
 md('CLOSURE_REPORT.md',f'''# M8 financial current-layout adapter closure

Final status: **READY_FOR_OWNER_REVIEW**. Not approved automatically.

`M8_RESEARCH_CURRENT_LAYOUT_INTEGRATION` is resolved for read-only retained research. The active dashboard no longer calls the removed-layout reader. Current combined files are exposed through a versioned, separate presentation DTO and VN30 ticker/variant pages, with source lineage, native decimal values, statement scopes, capture metadata, unknown publication and missing/quarantine warnings.

Actual validation parses all thirty files and checks displayed pages against retained evidence. Live browser GET navigation compares exact values and lineage for representative variants, shows quarantine, verifies fail-closed invalid selection and checks mobile rendering. These are actual retained files, distinct from synthetic unit fixtures. {unit['numPassedTests']} regression tests and {pec['testsRun']} PEC-2 tests pass, plus final targeted UI tests, build/typechecking and architecture checks.

Twelve ledger transactions and 24 legs replay exactly; eleven holdings, cash, receivables and cost basis match the approved ledger closure. Actual SQLite bytes/logical state, original financial JSON/PDF/API files, original ledger records and frozen policies are unchanged. All prior seals verify. Eight source candidates remain DEFERRED; no authenticated source approval, independent acceptance, effective admission, D2 or production scoring activation occurred.

Limitations remain explicit: research is UNREVIEWED_PRESENTATION; unknown scope/period/publication and some lineage discrepancies require separate evidence review. Displayed data is not accounting/scoring authority. Full-corpus semantic validation and historical AS_KNOWN acceptance are not claimed. Current market-data and NAV readiness remain blocked; no market remediation was started.

All eight requested deliverables are in this directory, with additional coverage, approval, ledger replay and hash evidence. Review server is stopped. Stop after adapter remediation and await owner review; no next milestone is started.
''')
 pins=sorted(allowed|{str(p.relative_to(ROOT)) for p in [ROOT/'src/domain/fundamentals/retained-research.ts',ROOT/'src/infrastructure/config/retained-research.ts',ROOT/'src/infrastructure/fundamentals/retained-research.ts',ROOT/'src/ui/retained-research.tsx',ROOT/'tests/unit/retained-financial-research.test.tsx',ROOT/'scripts/validate-m8-financial-research.mjs',ROOT/'scripts/validate-m8-financial-ledger.mjs',ROOT/'scripts/validate-m8-financial-live.mjs',Path(__file__).resolve()]})
 save('ARTIFACT_HASHES.json',{'files':{str(p.relative_to(OUT)):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ['ARTIFACT_HASHES.json','EVIDENCE_SEAL.json']},'implementationPins':{p:sha(ROOT/p) for p in pins}})
 save('EVIDENCE_SEAL.json',{'schemaVersion':'m8-current-layout-adapter-evidence-v1','artifactHashesSha256':sha(OUT/'ARTIFACT_HASHES.json'),'meaning':'Content integrity only. Not owner/source approval, independent acceptance, admission or scoring authority.'});verify_seal(ROOT,OUT)
 print(json.dumps({'status':'READY_FOR_OWNER_REVIEW','unitTests':unit['numPassedTests'],'PEC2Tests':pec['testsRun'],'actualTickers':30,'databaseUnchanged':True,'priorSeals':len(seals)}))
if __name__=='__main__':main()
