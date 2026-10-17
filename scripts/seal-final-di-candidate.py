"""Seal exact producer evidence without independent signoff or production writes."""
import pathlib,json,hashlib,subprocess,re,sqlite3
O=pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-17-data-initialization-final-acceptance');H='68aa87f9ae4478714ec6ca676e5a3b2addf0d77f'
def read(p):return json.loads(pathlib.Path(p).read_text())
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def write(n,d):(O/n).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
def proof(p):return {'path':str(p),'sha256':sha(p)}
assert subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()==H
assert subprocess.check_output(['git','diff','--name-only'])==b''
commands=[]
for f in ['static-commands.json','static-retest-commands.json','browser-initial-commands.json','browser-retest-commands.json','full-commands.json','protected-commands.json']:
 for r in read(O/f):
  # Failed first invocation logs were retained under explicit names.
  if f=='static-commands.json' and r['name']=='fundamental':r['log']=str(O/'validation-logs/fundamental-initial-browser-screenshot-conflict.log')
  if f=='browser-initial-commands.json' and r['name']=='browser':r['log']=str(O/'validation-logs/browser-sandbox-denial.log')
  assert sha(r['log'])==r['logSHA256'],r['log']
  t=pathlib.Path(r['log']).read_text();m=re.search(r'Tests\s+(?:(\d+) failed\s*\|\s*)?(\d+) passed',t)
  if m:r.update(testsPassed=int(m[2]),testsFailed=int(m[1] or 0))
  if r['name']=='browser' and r['exitCode']==0:assert '12 passed' in t;r.update(testsPassed=12,testsFailed=0)
  r['commandLedger']=f;commands.append(r)
final=[r for r in commands if r['commandLedger'] not in ['static-commands.json','browser-initial-commands.json'] or r['name'] in ['focused','production-build']]
assert all(r['exitCode']==0 for r in final)
full=next(r for r in final if r['name']=='full-suite');assert full['testsPassed']==1902 and full['testsFailed']==0
focused=next(r for r in final if r['name']=='focused');assert focused['testsPassed']==140
replays=[r for r in final if r['name'].startswith('replay-')];assert len(replays)==32
assert next(r for r in final if r['name']=='fundamental')['testsPassed']==603
assert next(r for r in final if r['name']=='boundaries')['testsPassed']==98
for n in ['market-audit','reconstruction','universe-replay','di15-evaluation']:
 t=(O/'validation-logs'/(n+'.log')).read_text();assert 'PASS' in t,n
 commands.append({'name':n,'command':{'market-audit':'python3 scripts/audit-final-di-candidate-market.py','reconstruction':'node scripts/reconstruct-final-di-candidate.mjs','universe-replay':'python3 scripts/replay-final-di-universe.py','di15-evaluation':'node scripts/evaluate-final-di-candidate.mjs'}[n],'exitCode':0,'log':str(O/'validation-logs'/(n+'.log')),'logSHA256':sha(O/'validation-logs'/(n+'.log'))})
failures=[{'log':'validation-logs/browser-sandbox-denial.log','cause':'Sandbox blocked localhost listen with EPERM.','correction':'Explicit loopback escalation approved; same browser command passed12/12.'},{'log':'validation-logs/fundamental-initial-browser-screenshot-conflict.log','result':'602 PASS /1 FAIL','cause':'Concurrent browser visual test regenerated a protected historical PNG.','correction':'Restored48 exact images from starting commit, then ran fundamental603/603 and full1902/1902 after browser completion. No hash/assertion changed.'},{'log':'validation-logs/reconstruction-initial-private-source-assumption.log','cause':'New review script initially assumed private retained PDFs were git objects.','correction':'Tracked files checked against starting commit; private originals checked against exact source SHA256 in starting-commit-pinned inputs. No source bytes changed.'},{'log':'validation-logs/reconstruction-initial-optional-flag-assumption.log','cause':'New review script asserted an optional decisionReady field was literally false in canonical JSON where absent.','correction':'Require it never be true; candidate flags remain explicitly false. No runtime contract or facts changed.'}]
write('TEST_RESULTS.json',{'status':'PASS','runtime':'Node22.23.2 / pnpm10.34.5','implementationCommit':H,'baseline':1902,'finalPassed':1902,'finalFailed':0,'newRuntimeTests':0,'focusedAcceptanceAndPolicyB':140,'newPolicyBRegressionsWithinBaseline':98,'fundamentalFocused':603,'architecture':98,'browser':12,'protectedReplayCommands':32,'commands':commands,'initialFailuresRetained':failures,'testAssertionsWeakened':False,'runtimePolicyChanged':False,'timeout':'Command-level60000ms for unchanged full-suite assertions; repository config unchanged.','scope':'Synthetic application score/decision fixtures only; no current-release scoring/ranking/capital action.'})
a=read(O/'ACCOUNTING_RECONSTRUCTION.json');write('PROTECTED_REPLAY_RESULTS.json',{'status':'PASS','implementationCommit':H,'fullUniverseReplay':a['rows'],'uniqueSourceHashCount':len(a['sourceHashes']),'sourceBindings':a['sourceHashes'],'canonicalSetUnchanged':True,'all32IndependentProducerCommands':replays,'aggregateCommand':next(r for r in final if r['name']=='aggregate'),'officialUniverseCommand':commands[-2],'quarantineAndGlobalChecks':proof(O/'QUARANTINE_AND_GLOBAL_CHECKS.json'),'policyB92SealedArtifactsPreserved':True,'currentMarketReplay':'FAIL; preserved separately, not hidden by PASS for accounting/ticker replay'})
db=read(O/'DATABASE_INVENTORY.json');dbpath=pathlib.Path('data')/db['databaseBasename'];assert sha(dbpath)==db['databaseSHA256Before'];db['databaseSHA256After']=sha(dbpath);db['unchanged']=True;write('DATABASE_INVENTORY.json',db)
# DI12 evidence includes the DB inventory hash. Refresh that one hash after append-only before/after proof.
d12=read(O/'DI12_REVIEW.json')
for e in d12['exactEvidence']:
 if e['path']==str(O/'DATABASE_INVENTORY.json'):e['sha256']=sha(O/'DATABASE_INVENTORY.json')
write('DI12_REVIEW.json',d12)
binding=read(O/'RELEASE_BINDING.json');partition=read(O/'UNIVERSE_PARTITION.json');di15=read(O/'DI15_REVIEW.json');assert di15['status']=='FAIL'
ready=[]
for r in a['rows']:
 ready.append({'ticker':r['ticker'],'securityId':r['securityId'],'admissionState':r['state'],'universe':'PASS','fundamentals':'LEVEL1_PASS' if r['state']=='SCORABLE' else 'INSUFFICIENT_NOT_SCORABLE','market':'BLOCKED_UNREPLAYABLE_SOURCE','valuation':'NOT_ACCEPTED','flowTechnical':'NOT_APPLICABLE_PERMANENT_M3','confidence':'NOT_COMPLETED_FOR_SCORING','exactBlockerIds':r['exactBlockerIds'],'score':None,'rankingEligible':False,'top10Eligible':False,'positiveCapitalEligible':False,'dcaEligible':False,'readyForScoring':False,'decisionReady':False})
write('PER_TICKER_READINESS.json',{'FULL_UNIVERSE_COUNT':30,'SCORABLE_UNIVERSE_COUNT':25,'DEFERRED_UNIVERSE_COUNT':5,'rows':ready})
artifactFiles=['RELEASE_BINDING.json','UNIVERSE_RECONCILIATION.json','UNIVERSE_PARTITION.json','EXCEPTION_REGISTER.json','SOURCE_ISSUE_LEDGER.json','MARKET_EVIDENCE_AUDIT.json','MARKET_SOURCE_RECHECK.json','DATABASE_INVENTORY.json','GLOBAL_BLOCKER_REVIEW.json','PROTECTED_REPLAY_RESULTS.json','TEST_RESULTS.json','OPEN_ISSUES.json','DI15_REVIEW.json','PER_TICKER_READINESS.json']+[f'DI{i:02d}_REVIEW.json' for i in range(1,14)]
artifact={'contract':'final-di-independent-review-artifact-v1','releaseId':binding['releaseId'],'implementationCommit':H,'producerIdentity':'Codex candidate producer; not independent reviewer','policyBVersion':binding['policyBinding']['version'],'acceptanceContract':'independent-di-acceptance-v2','universeHash':binding['universeHash'],'partitionHash':binding['partitionHash'],'partitionFileSHA256':sha(O/'UNIVERSE_PARTITION.json'),'exceptionRegisterSHA256':sha(O/'EXCEPTION_REGISTER.json'),'all30CanonicalSnapshotHashes':binding['canonicalSnapshotHashes'],'artifacts':[proof(O/n) for n in artifactFiles],'scripts':[proof(p) for p in sorted(pathlib.Path('scripts').glob('*final-di-candidate*'))],'readyForScoring':False,'decisionReady':False}
write('REVIEW_ARTIFACT.json',artifact)
write('DI14_REVIEW_CANDIDATE.json',{'gateId':'DI14','status':'PENDING_INDEPENDENT_APPROVAL','authoritativeRequirement':'Independent data-quality review PASS; actual trusted authority must bind exact release and artifact.','authority':[proof('docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md'),proof('src/infrastructure/repositories/scoring-datasets-policy-b.ts')],'startingCommit':H,'finalCommit':H,'finalCommitMeaning':'Exact unchanged implementation commit; candidate evidence and scripts pinned by the separate sealed overlay. No new commit claimed.','producerIdentity':'Codex candidate producer; not independent reviewer','independentReviewer':None,'reviewTimestamp':None,'reviewCommit':None,'approvalReference':None,'reviewedArtifactHash':None,'candidateArtifact':str(O/'REVIEW_ARTIFACT.json'),'candidateArtifactHash':sha(O/'REVIEW_ARTIFACT.json'),'releaseBinding':binding,'policyBVersion':binding['policyBinding']['version'],'acceptanceContractVersion':'independent-di-acceptance-v2','universeHash':binding['universeHash'],'partitionHash':binding['partitionHash'],'partitionFileSHA256':sha(O/'UNIVERSE_PARTITION.json'),'exceptionRegisterSHA256':sha(O/'EXCEPTION_REGISTER.json'),'all30CanonicalSnapshotHashes':binding['canonicalSnapshotHashes'],'testBuildResult':proof(O/'TEST_RESULTS.json'),'replayResult':proof(O/'PROTECTED_REPLAY_RESULTS.json'),'globalBlockerResult':proof(O/'GLOBAL_BLOCKER_REVIEW.json'),'failedPrecedingGates':['DI4','DI8','DI12'],'independentReviewMustNotIgnoreFailures':True,'formalAcceptanceWritten':False,'readyForScoring':False,'decisionReady':False})
scorable=', '.join(r['ticker'] for r in a['rows'] if r['state']=='SCORABLE');deferred=', '.join(r['ticker'] for r in a['rows'] if r['state']=='DEFERRED')
gateTable='\n'.join('| DI'+str(i)+' | '+read(O/f'DI{i:02d}_REVIEW.json')['status']+' |' for i in range(1,14))+'\n| DI14 | PENDING_INDEPENDENT_APPROVAL |\n| DI15 | FAIL |'
text=f'''# Data Initialization — Final Independent Acceptance Candidate

**Candidate prepared with blocking findings. It is not awaiting DI14 alone.** The unchanged implementation is pinned to `{H}` and its git tree. The complete producer review artifact SHA256 is `{sha(O/'REVIEW_ARTIFACT.json')}`. All new evidence/scripts are pinned in ARTIFACT_HASHES.json; no uncreated final commit or external signoff is claimed. DI14's actual review fields remain null. A reviewer must pin the eventual evidence commit as well as the exact artifact hash; this package supplies no trusted acceptance capability.

| Gate | Exact release result |
| --- | --- |
{gateTable}

The request's premise that DI3–DI12 were pending only for re-acceptance could not be fully verified. Direct revalidation found a release-wide market-source evidence gap. There are 30 archived diagnostic market rows dated2026-10-09, but **0/30 raw source proofs can be rehashed at the recorded paths**. A historical PASS summary is insufficient. DI4 therefore FAILS. Current market freshness is unaccepted, so DI8 FAILS. The 30 accounting snapshots reproduce, but a complete eligible formal market-plus-fundamentals snapshotRunId/contentHash/manifestDigest is absent under the unchanged v2 contract, so DI12 FAILS. The review-bundle ID does not substitute for that runtime snapshot. The existing default database passes physical integrity and foreign-key checks but lacks the formal fundamental snapshot/acceptance tables. No DB migration, production registry promotion or acceptance insert was performed.

Global system blocker count: **1**, `RELEASE-MARKET-SOURCE-REPLAY-UNAVAILABLE`, an OPEN Major shared source-contract availability issue. This is not an assertion that accounting data is corrupt. No universe mismatch, cross-ticker contamination, unit/mapping/registry/schema corruption affecting admitted accounting facts, canonical divergence or physical database corruption was observed. All12 global fault classes fail closed in isolated tests; acceptance-version bypass is rejected by existing regressions. This shared release issue cannot be placed into a ticker quarantine. It is appended in a new full source issue ledger without editing the six original ticker objects or their provenance.

## Universe and preserved accounting

FULL_UNIVERSE_COUNT=30; SCORABLE_UNIVERSE_COUNT=25 admission candidates; DEFERRED_UNIVERSE_COUNT=5. Certification is pinned as-of2026-10-16, effective2026-08-03; no live2026-10-17 membership extension is claimed.

SCORABLE candidates: {scorable}.

DEFERRED: {deferred}.

All30 complete canonical snapshots replay exactly. All679 unique retained source bindings rehash, and all92 sealed Policy B artifacts remain unchanged. Tracked bytes are compared with the starting commit; private retained originals are verified against hashes in those commit-pinned inputs. The six OPEN Major ticker issues remain byte/semantic-identical: VNM financing population; TCX FY2022 Két Vàng population/classification; MBB current regulatory capital; VIB current regulatory capital and NPL definition; VIC reviewed consolidated6M2026 original. No ticker accounting work was reopened. Exception-register bytes match the approved Policy B package. The original certified universe and partition members remain identical. New prerequsite statuses and the separately evidenced global release issue do not change Policy B semantics.

All50 deferred action attempts are denied in an isolated in-memory fixture where unrelated gates are marked PASS, proving quarantine itself rather than relying only on release failure. That fixture is never stored as release authority. Scores remain null; ranking, Top10, positive capital and DCA eligibility remain false. No missing weight or capital is redistributed. Current and historical admissibility remain distinct; unknown historical publication is not invented.

## Revalidation and review boundary

Full application suite: **1,902 PASS / 0 FAIL**. Focused acceptance/Policy B/aggregate tests:140 PASS; fundamental/ticker suite:603 PASS; architecture:98 PASS; browser E2E:12 PASS; protected producer commands:32 PASS plus the full30 aggregate. Structured certification, lint, typecheck, DB schema validation and webpack production build PASS. TEST_RESULTS.json records commands, exits, hashes and initial failures. Passing synthetic tests does not certify missing real market data.

The first browser invocation was blocked by sandbox localhost restrictions; the approved loopback retest passed. An initial focused fundamental test caught an E2E-regenerated historical screenshot. All48 original images were restored and the sequential retest/full suite passed. The new reconstruction script initially assumed private originals were git objects and an optional output flag was present; both producer-script assumptions were corrected without changing facts or runtime validation. All failed logs are retained. Existing tracked source/evidence/policy files and the local database remain unchanged.

Every DI01–DI13 review quotes its authority and binds exact hashed evidence to the same release ID and implementation commit. DI14 binds the universe/policy/partition/exception register/all30 canonical hashes/tests/build/replay/global blocker result, with independentReviewer, reviewTimestamp, reviewCommit, approvalReference and reviewedArtifactHash null. `candidateArtifactHash` identifies only the producer's proposed review target. No self-signature or production acceptance exists.

To remove the substantive failures, retain/requalify authoritative market source bytes with explicit dates, provenance and accepted freshness, then reproduce and bind the complete eligible formal snapshot. This does not require reopening accounting closures. Independent review remains necessary after those evidence gaps close. The current request is completed as a blocked acceptance candidate; no remediation or investment action is inferred from it.

readyForScoring=false. decisionReady=false. No M3 scoring, ranking, Top10 or investment recommendation was executed against the current release.

**STOP. Await “Review Data Initialization Final Acceptance”.**
'''
text=text.replace('dated2026','dated 2026').replace('as-of2026','as-of 2026').replace('effective2026','effective 2026').replace('live2026','live 2026').replace('all12','all 12').replace('All12','All 12').replace('All30','All 30').replace('All679','All 679').replace('all92','all 92').replace('All50','All 50').replace('All48','All 48').replace('all30','all 30').replace('full30','full 30').replace('consolidated6M2026','consolidated 6M2026').replace('prerequsite','prerequisite').replace(':140',': 140').replace(':603',': 603').replace(':98',': 98').replace(':12',': 12').replace(':32',': 32')
(O/'FINAL_ACCEPTANCE_CANDIDATE.md').write_text(text)
(O/'README.md').write_text('# Final independent Data Initialization acceptance candidate\n\nRead [FINAL_ACCEPTANCE_CANDIDATE.md](FINAL_ACCEPTANCE_CANDIDATE.md), [RELEASE_BINDING.json](RELEASE_BINDING.json), [DI14_REVIEW_CANDIDATE.json](DI14_REVIEW_CANDIDATE.json), and [TEST_RESULTS.json](TEST_RESULTS.json).\n\nDI1–DI13: ten PASS, DI4/DI8/DI12 FAIL. DI14 PENDING_INDEPENDENT_APPROVAL; DI15 FAIL. Full 30 / Scorable candidates 25 / Deferred 5; one release-wide market-source availability blocker. All six original ticker Majors remain OPEN. Runtime flags remain false.\n\nReproduce with Node22.23.2: run audit-final-di-candidate-market.py, reconstruct-final-di-candidate.mjs and replay-final-di-universe.py, the command groups in validate-final-di-candidate.py, build-final-di-candidate.py, evaluate-final-di-candidate.mjs, then seal-final-di-candidate.py. Run browser before protected hash checks/full suite and restore protected images as recorded. Do not rerun prior sealed generators in place. Source market paths are checked directly in MARKET_SOURCE_RECHECK.json; the intentionally failed actual-release gates are separate from passing application regressions. No runtime or Policy B semantic change.\n\nSTOP. Await **Review Data Initialization Final Acceptance**.\n')
files=[p for p in O.rglob('*') if p.is_file() and p.name!='ARTIFACT_HASHES.json']+sorted(pathlib.Path('scripts').glob('*final-di-candidate*'))
for p in files:
 if p.suffix=='.json':read(p)
 if p.suffix in ['.md','.mjs','.py']:assert all(l.rstrip()==l for l in p.read_text().splitlines()),p
write('ARTIFACT_HASHES.json',{'contract':'final-di-candidate-sealed-sha256-v1','implementationCommit':H,'independentApproval':None,'selfExcluded':True,'artifacts':[{**proof(p),'bytes':p.stat().st_size} for p in sorted(files)]})
assert all(sha(r['path'])==r['sha256'] for r in read(O/'ARTIFACT_HASHES.json')['artifacts'])
print(json.dumps({'status':'SEALED_BLOCKED_CANDIDATE','artifacts':len(files),'DI1_DI13_FAILED':['DI4','DI8','DI12'],'DI14':'PENDING_INDEPENDENT_APPROVAL','DI15':'FAIL','partition':[30,25,5],'globalSystemBlockerCount':1,'fullSuitePassed':1902,'readyForScoring':False,'decisionReady':False}))
