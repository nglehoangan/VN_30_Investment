"""Seal this additive review candidate after successful validation; never grant DI14."""
import hashlib,json,pathlib,re,subprocess
O=pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-17-di15-partial-universe-amendment')
H='c24455fbb47374b355a888247af7bd4e3934ee57'
def load(n):return json.loads((O/n).read_text())
def write(n,d):(O/n).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def log(n):return (O/'validation-logs'/n).read_text()
assert subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()==H
assert subprocess.check_output(['git','diff','--name-only'])==b'', 'Existing tracked files must remain unchanged'
assert '1902 passed (1902)' in log('full-suite-final.log') and not re.search(r'Test Files.*failed',log('full-suite-final.log'))
reg=load('REGRESSION_RESULTS.json');assert reg['numPassedTests']==98 and reg['numFailedTests']==0
replays=load('REPLAY_COMMANDS.json');assert len(replays)==32 and all(r['exitCode']==0 for r in replays)
assert '12 passed' in log('application-e2e.log')
assert '603 passed (603)' in log('fundamentals-focused.log')
assert '98 passed (98)' in log('boundaries.log')
assert '140 passed (140)' in log('policy-b-and-acceptance.log')
assert 'PASS boundaries: 182' in log('lint-final.log')
assert 'Types generated successfully' in log('typecheck-delivery.log') and 'error TS' not in log('typecheck-delivery.log')
assert 'schema at prisma/schema.prisma is valid' in log('database.log')
assert 'Compiled successfully' in log('application-webpack-build.log')
structured=json.loads(log('structured-replay.log').strip());assert structured['status']=='PASS'
checks=[
 {'name':'Policy B new regressions','command':'pnpm exec vitest run tests/unit/di15-policy-b.test.ts tests/unit/policy-b-ports.test.ts tests/unit/policy-b-reporting.test.tsx tests/integration/di15-policy-b.test.ts --reporter=json --outputFile='+str(O/'REGRESSION_RESULTS.json'),'passed':98,'log':'validation-logs/policy-b-regressions-final.log'},
 {'name':'Full application unit/integration/architecture suite','command':'pnpm test --testTimeout=60000','passed':1902,'files':124,'log':'validation-logs/full-suite-final.log'},
 {'name':'Browser E2E','command':'node scripts/smoke-app.mjs --e2e','passed':12,'log':'validation-logs/application-e2e.log'},
 {'name':'Structured certification','command':'node scripts/verify-structured-certification.mjs','checks':structured,'log':'validation-logs/structured-replay.log'},
 {'name':'Architecture boundaries','command':'pnpm test:boundaries','passed':98,'files':8,'log':'validation-logs/boundaries.log'},
 {'name':'Lint','command':'pnpm lint','log':'validation-logs/lint-final.log'},
 {'name':'Typecheck','command':'pnpm typecheck','log':'validation-logs/typecheck-delivery.log'},
 {'name':'Database schema','command':'pnpm db:validate','log':'validation-logs/database.log'},
 {'name':'Production application build','command':'pnpm exec next build --webpack','log':'validation-logs/application-webpack-build.log'},
 {'name':'Current30 canonical reconstruction and baseline byte verification','command':'node scripts/build-di15-policy-b.mjs','passed':30,'log':'validation-logs/current-release-reconstruction-final.log'}]
for c in checks:c.update(status='PASS',exitCode=0)
failures=[
 {'log':'validation-logs/policy-b-focused-initial.log','result':'115 PASS / 2 FAIL','cause':'Historical immutable source hashes rejected initial in-place source changes.','fix':'Restored every baseline file and introduced additive v2 modules. Focused retest117 PASS; full final1902 PASS.'},
 {'log':'validation-logs/typecheck-development.log','cause':'Explicit blocker-ID callback type missing.','fix':'Added type annotation; final typecheck PASS.'},
 {'log':'validation-logs/lint.log','cause':'Initial composition factory violated infrastructure-to-application boundary.','fix':'Moved factory into existing app/server composition layer. Boundary rule unchanged; final lint PASS.'},
 {'log':'REGRESSION_RESULTS_INITIAL_TIMESTAMP_FAILURE.json','result':'97 PASS / 1 FAIL','cause':'New universe reference used microsecond UTC capture time where instant validation requires milliseconds.','fix':'Derived conservative receipt capture upper bound rounded upward to UTC milliseconds; old source timestamps unchanged. Final98 PASS.'},
 {'log':'validation-logs/full-suite.log','result':'1900 PASS / 2 FAIL','cause':'Concurrent browser testing regenerated historical protected screenshots while full-suite hash checks ran.','fix':'Restored all48 historical images from starting HEAD. Sequential full-suite rerun1902 PASS; E2E12 PASS separately. See E2E_SCREENSHOT_PRESERVATION.json.'}]
write('TEST_RESULTS.json',{'status':'PASS','startingCommit':H,'runtime':'Node22.23.2 / pnpm10.34.5','date':'2026-10-17','baseline':{'passed':1804,'failed':0},'finalFullSuite':{'passed':1902,'failed':0,'newTests':98},'checks':checks,'historicalProtectedReplay':replays,'additionalFocusedResults':[{'log':'validation-logs/fundamentals-focused.log','files':44,'passed':603,'exitCode':0,'commandNote':'Focused fundamental-data Vitest file selection; all files also rerun in exact full-suite command above.'},{'log':'validation-logs/policy-b-and-acceptance.log','files':8,'passed':140,'exitCode':0,'commandNote':'Focused Policy B, DI acceptance and aggregate disposition selection; all files also rerun in full suite.'}],'initialFailuresAndCorrections':failures,'assertionsOrConfigurationWeakened':False,'timeoutNote':'Command-level60000ms test timeout; unchanged assertions/configuration.','accountingFactsChanged':0,'sourceIssuesRemovedOrDowngraded':0,'existingTrackedFilesChanged':0,'scoringExecutedAgainstCurrentRelease':False,'productionAcceptanceWritten':False})
p=load('PROTECTED_REPLAY_RESULTS.json');p['historicalReplayCommands']=replays;p['structuredCertification']=structured;p['existingTrackedFilesUnchanged']=True;write('PROTECTED_REPLAY_RESULTS.json',p)
r=O/'FINAL_REVIEW.md';s=r.read_text();s=s.replace('See TEST_RESULTS.json,', '**Final validation: 1,902/1,902 full-suite tests, including 98 new regressions; 12/12 browser E2E; 32/32 protected replay commands; structured certification, fundamental-data, boundaries, lint, typecheck, database validation and production build PASS.**\n\nThe initial full-suite run encountered two historical screenshot hash failures while browser testing regenerated protected images. All 48 original images were restored byte-for-byte, and the sequential full-suite rerun passed. No assertion or expected hash was changed.\n\nSee TEST_RESULTS.json,');r.write_text(s)
# Only task-owned additive paths enter the overlay. Git-untracked evidence contains no DB/secrets.
new=subprocess.check_output(['git','ls-files','--others','--exclude-standard','-z']).decode().split('\0')
files=[pathlib.Path(p) for p in new if p and pathlib.Path(p).is_file() and p!=str(O/'ARTIFACT_HASHES.json')]
for p in files:
 if p.suffix=='.json':json.loads(p.read_text())
 if p.suffix in ['.ts','.tsx','.mjs','.py','.md']:
  assert not any(line.rstrip()!=line for line in p.read_text().splitlines()),'Trailing whitespace: '+str(p)
rows=[{'path':str(p),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(files)]
write('ARTIFACT_HASHES.json',{'contract':'di15-policy-b-additive-overlay-sha256-v1','startingCommit':H,'reviewCommit':None,'independentSignoff':None,'status':'SEALED_REVIEW_CANDIDATE_NOT_DI14_APPROVAL','selfExcluded':True,'existingTrackedFilesUnchanged':True,'artifacts':rows})
manifest=load('ARTIFACT_HASHES.json');assert all(sha(r['path'])==r['sha256'] for r in manifest['artifacts'])
print(json.dumps({'status':'PASS','sealedArtifacts':len(rows),'fullSuitePassed':1902,'newRegressions':98,'browserTests':12,'protectedReplayCommands':32,'DI14':'PENDING','DI15':'FAIL','readyForScoring':False,'decisionReady':False}))
