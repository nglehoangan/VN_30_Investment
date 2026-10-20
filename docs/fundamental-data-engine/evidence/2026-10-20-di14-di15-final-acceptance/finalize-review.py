"""Seal review overlay after exact baseline comparison. No production writes or approval."""
import hashlib,json,pathlib,re,subprocess
R=pathlib.Path.cwd();P=R/'docs/fundamental-data-engine/evidence/2026-10-20-di14-di15-final-acceptance'
def load(p):return json.loads(pathlib.Path(p).read_text())
def save(n,o):(P/n).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def cases(x):
 out={}
 for t in x['testResults']:
  f=str(pathlib.Path(t['name']).relative_to(R));f=f[6:] if f.startswith('tests/') else f
  for a in t['assertionResults']:out[f+'::'+a['fullName']]={'status':a['status'],'failure':a.get('failureMessages',[])}
 return out
base=load(P/'BASELINE_IDENTITY.json');full=load('/private/tmp/di14-di15-full.json');focused=load('/private/tmp/di14-di15-focused.json');current=cases(full);focus=cases(focused)
previous_path=R/'docs/fundamental-data-engine/evidence/2026-10-20-tcbs-market-pipeline/validation/full-final-cases.json';previous=load(previous_path)['cases']
old={k for k,v in previous.items() if v['status']=='failed'};failed={k for k,v in current.items() if v['status']=='failed'};new=sorted(failed-old);assert not new,new;assert failed==old;assert full['numFailedTests']==18 and focused['numFailedTests']==0
save('validation/full-case-statuses.json',{k:v['status'] for k,v in current.items()});save('validation/focused-case-statuses.json',{k:v['status'] for k,v in focus.items()})
save('REGRESSION_RESULTS.json',{'status':'PASS_NO_NEW_REGRESSION','NEW_REGRESSIONS':len(new),'baseline':{'path':str(previous_path.relative_to(R)),'sha256':sha(previous_path)},'passed':full['numPassedTests'],'failed':full['numFailedTests'],'preExisting':18,'newFailures':new,'resolvedBaselineFailures':sorted(old-failed),'exactFailedSetUnchanged':True,'failures':[{'case':k,'classification':'PRE_EXISTING','failure':current[k]['failure']} for k in sorted(failed)],'expectedNegativeTests':'Passing rejection assertions; not hidden failures','wholeSuiteGreen':False})
rules={
 'unknown_market_source':r'unapproved source/schema|unknown schema',
 'wrong_source_hash':r'raw hash mismatch|raw bytes rehash',
 'schema_drift':r'unknown schema|unknown candidate version',
 'wrong_ticker_security_identity':r'wrong identity|wrong ticker',
 'wrong_venue':r'wrong venue',
 'unknown_currency':r'unknown currency|unit/adjustment/session.*currency',
 'unknown_unit':r'unknown unit|unit/adjustment/session.*unit',
 'missing_price':r'missing close never becomes zero',
 'duplicate_conflicting_price':r'duplicate observation|conflicting board',
 'stale_observation':r'retrieval timestamp never makes old session fresh|expiry never invalidates',
 'future_observation':r'future observation blocks',
 'unfinished_session':r'incomplete day',
 'unknown_calendar':r'unknown calendar blocks',
 'unsupported_calendar_year':r'unknown calendar year blocks',
 'retrieval_date_replaces_trading_date':r'retrieval date cannot replace',
 'market_provider_universe_mismatch':r'provider universe .*cannot redefine',
 'MBB_accidentally_scored':r'deferred cannot enter SCORING|vNext rejects MBB placeholder',
 'MBB_accidentally_ranked':r'deferred cannot enter RANKING|vNext rejects MBB placeholder',
 'MBB_receives_new_capital':r'MBB price can support held NAV|deferred cannot enter NEW_CAPITAL',
 'TCX_exception_missing':r'TCX exception omission',
 'stale_dependency_head':r'changed head or seal failure|changed dependency fail',
 'decision_persistence_failure':r'atomic decision insert\+seal rolls back|persistence failure exposes nothing',
 'dependency_changes_during_publication':r'dependency change between authorization and publication',
 'old_market_reused_after_expiry':r'expired freshness prevent|Oct25 analysis blocks',
}
negative=[]
for requirement,pattern in rules.items():
 hits=[k for k,v in focus.items() if re.search(pattern,k,re.I) and v['status']=='passed'];assert hits,(requirement,pattern)
 negative.append({'requirement':requirement,'status':'PASS_FAIL_CLOSED','classification':'EXPECTED_NEGATIVE_TEST','testCases':hits})
supp=load(P/'SUPPLEMENTAL_NEGATIVE_RESULTS.json');assert supp['status']=='PASS'
negative.append({'requirement':'analysis_snapshot_missing_market_freshness','status':'PASS_FAIL_CLOSED','classification':'EXPECTED_NEGATIVE_TEST','evidence':'SUPPLEMENTAL_NEGATIVE_RESULTS.json#results/0'})
save('NEGATIVE_TEST_RESULTS.json',{'status':'PASS','requiredCoverage':negative,'supplemental':supp,'focusedPassed':focused['numPassedTests'],'focusedFailed':0,'noInvestmentOutputs':'Synthetic tests only; no production scoring/ranking/actionable decisions'})
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();assert head==base['startingHEAD'];assert sha(R/'data/vn30.sqlite')==base['database']['sha256']
pipeline=load(P/'MARKET_CAPABILITY_ACCEPTANCE.json');digest=pipeline['independentAcceptanceCandidateHash'];candidate=load(load(R/'data/market-boundary/active-candidate.json')['path']);assert all(sha(R/p['path'])==p['sha256'] for p in candidate['sourcePins'])
assert load(P/'MIGRATION_REVIEW.json')['status']=='PASS'
for name,marker in [('lint.log','PASS boundaries'),('final-eslint.log',None),('boundaries.log','PASS boundaries'),('typecheck.log','Types generated successfully'),('db-validate.log','is valid'),('build.log','Route (app)'),('e2e.log','13 passed')]:
 text=(P/'validation'/name).read_text();assert marker is None or marker in text,(name,marker)
save('TEST_RESULTS.json',{'lint':'PASS','typecheck':'PASS','dbSchemaValidation':'PASS','architecture':'PASS','productionBuild':'PASS','focused':{'passed':focused['numPassedTests'],'failed':0},'supplementalNegativeProbes':{'passed':len(supp['results']),'failed':0},'fullSuite':{'passed':full['numPassedTests'],'failed':18,'preExisting':18,'newRegressions':0,'exactFailedCasesMatchBaseline':True},'browserE2E':{'passed':13,'failed':0,'database':'ISOLATED_TEMPORARY'},'migration':'PASS_FRESH_AND_POPULATED_COPY','accountingReplay':'PASS_ALL30_BODY_CONTENT_AND_DERIVED_ARITHMETIC','environmentalFailure':'Temporary fixture0644 rejected; tightened to0600; details VALIDATION_ENVIRONMENT_NOTES.json','productionMutation':False,'realScoringRun':False,'realRankingRun':False,'investmentDecisionCreated':False,'readyForScoring':False,'decisionReady':False})
issues=[{'id':'ACTUAL_INDEPENDENT_DI14_APPROVAL_PENDING','classification':'GLOBAL','severity':'GOVERNANCE_APPROVAL_BOUNDARY','status':'OPEN','blocks':['DI15_FINAL_RELEASE','PRODUCTION_ACTIVATION'],'notAccountingIntegrityRegression':True,'required':'Independent reviewer binds exact retained candidate hash and sealed gate overlay; owner governance step follows. No self-approval.'},{'id':'MBB_CAPITAL_ADEQUACY_SOURCE_UNAVAILABLE','classification':'TICKER_ISOLATED','severity':'MAJOR','status':'OPEN','disposition':'DEFERRED','blocks':['MBB_SCORING','MBB_RANKING','MBB_TOP10','MBB_NEW_CAPITAL','MBB_DCA'],'evidenceFetched':False},{'id':'AUTHORITATIVE_DEPENDENCY_HEAD_MAINTENANCE_NOT_CONFIGURED','classification':'ANALYSIS_TIME','status':'OPEN','blocks':['FUTURE_ACTIONABLE_DECISION_ACTIVATION'],'blocksInitialization':False,'productionGuard':'FAIL_CLOSED'},{'id':'LEGACY_REPLAY_BASELINE_FAILURES','classification':'HISTORICAL_ONLY','status':'PRESERVED','count':18,'newRegressions':0},{'id':'EOD_SCOPE_2026_CALENDAR_LIMIT','classification':'NON_BLOCKING','status':'EXPLICIT_SCOPE_LIMIT','unsupported':['intraday execution','volume/liquidity/moneyflow','adjusted history/total return','calendar outside2026']}]
save('OPEN_ISSUES.json',{'DI14_CANDIDATE':'PASS_CANDIDATE','DI15_CANDIDATE':'BLOCKED','issues':issues,'noSecondRemediationRound':True,'noNewCriticalMajorDataIntegrityFinding':True})
m=load(P/'VNEXT_GATE_MATRIX.json');m['pendingRegressionValidation']=False;m['regressionStatus']='PASS_NO_NEW_REGRESSION';m['endingHEAD']=head
for g in m['gates']:
 for e in g['evidence']:
  file=R/e['path'];assert file.is_file();e['sha256']=sha(file);e.pop('seal',None)
 if g['gate']=='DI1':
  f='docs/fundamental-data-engine/evidence/2026-10-17-data-initialization-final-acceptance/official-universe-replay/OFFICIAL_VN30_UNIVERSE_REVIEW.json';g['evidence'].append({'path':f,'sha256':sha(R/f),'purpose':'Retained official certification, not fresh membership acquisition'})
save('VNEXT_GATE_MATRIX.json',m)
fields={'STARTING_HEAD':base['startingHEAD'],'ENDING_HEAD':head,'FULL_UNIVERSE':30,'LEVEL1_CLOSED':29,'DEFERRED':1,'DEFERRED_LIST':'MBB','ACCOUNTING_REGRESSIONS':0,'NEW_REGRESSIONS':0,'DI4_vNEXT':'PASS_CANDIDATE','DI8A_vNEXT':'PASS_CANDIDATE','DI8B_RUNTIME':'ANALYSIS_TIME_GATE / NOT_REQUIRED_FOR_INITIALIZATION','DI12A_vNEXT':'PASS_CANDIDATE','DI12B_CONTRACT':'CONTRACT_QUALIFIED / RUNTIME_NOT_REQUIRED_FOR_INITIALIZATION','DI12C_CONTRACT':'CONTRACT_QUALIFIED / RUNTIME_NOT_REQUIRED_FOR_INITIALIZATION','MARKET_CAPABILITY':'PASS_CANDIDATE / LATEST_COMPLETED_HOSE_EOD_VALUATION_ONLY','CURRENT_MARKET_REQUIRED_FOR_INITIALIZATION':False,'POLICY_B':'PASS','MBB_QUARANTINE':'PASS','TCX_EXCEPTION':'ACTIVE / OWNER_APPROVED_ANALYTICAL_EXCEPTION / 5284485167173 VND','DEPENDENCY_HEAD':'FUTURE_DECISION_ACTIVATION_BLOCKED; NOT_INITIALIZATION_REQUIREMENT','LEGACY_REPLAY':'18 PRE_EXISTING FAILURES PRESERVED; CURRENT_VNEXT_REPLAY PASS','DI14_CANDIDATE':'PASS_CANDIDATE','DI15_CANDIDATE':'BLOCKED — actual independent DI14 PASS not issued','readyForScoring':False,'decisionReady':False,'PRODUCTION_MUTATION_PERFORMED':False,'SCORING_RUN_PERFORMED':False,'RANKING_RUN_PERFORMED':False,'INVESTMENT_DECISION_CREATED':False,'independentAcceptanceCandidateHash':digest}
lines=['# DI14 / DI15 final acceptance closure','', 'DI14 is PASS_CANDIDATE. DI15 is BLOCKED by the existing Policy-B requirement for actual independent DI14 PASS. Technical prerequisites are reviewable; this implementation run cannot issue the missing approval or replace the exact production release binding.','', '| Field | Result |','| --- | --- |']
for k,v in fields.items():lines.append('| '+k+' | '+str(v).lower() if isinstance(v,bool) else '| '+k+' | '+str(v)+' |')
# Ensure boolean table rows also close correctly.
lines=[line+' |' if line.startswith('| ') and not line.endswith('|') else line for line in lines]
lines+=['','DI4-vNext, DI8A and DI12A use the unchanged retained candidate and111 exact source/code pins. An isolated lifecycle test initialized its durable manifest at2026-10-25 without storing a market snapshot; consumption of the expired EOD quote was rejected. No quote fetch or new candidate was manufactured. The15:00 boundary is conservative policy behavior, not an exchange event timestamp. Calendar qualification remains2026 only.','',f'Validation: {full["numPassedTests"]} passed /18 failed in the full suite; every failed case exactly matches the accepted baseline. Focused185 passed; supplemental rejection4 passed; E2E13 passed. Lint/typecheck/schema/boundaries/build pass. Fresh/populated-copy migrations preserve legacy rows/schema/FKs and prove immutable rejection/rollback. See TEST_RESULTS.json, NEGATIVE_TEST_RESULTS.json and REGRESSION_RESULTS.json.','', 'All30 canonical bodies and content hashes match the starting retained pins; derived arithmetic replays exactly. MBB remains in the certified30, deferred with null score and no action/redistribution. TCX remains an Owner analytical exception, not issuer-proven conventional debt. VNM reported-borrowings scope, VIB consolidated CAR11.8% and supporting NPL uncertainty, and VIC reviewed consolidated6M2026 remain unchanged.','', 'Dependency-head maintenance is not configured for production activation. The transaction guard is implemented and tested, but does not prove automatic invalidation of all mutable heads. This blocks future Decision activation; initialization reads exact durable pins and does not consume that mechanism. Production FORMAL paths remain hard-denied and this EOD contract has no execution/new-capital authority.','', 'The production partition retains historical DI4/DI8/DI12 FAIL prerequisites and DI14 PENDING. The new vNext matrix is separate; no historical status is overwritten. Independent review must bind the vNext matrix and exact candidate before a final release is accepted. No deleted historical sources are claimed restored. Existing financial-source absence and stale historical hash expectations remain visible as baseline failures.','', 'Ending HEAD is unchanged. This evidence/test overlay is not a new commit or approved registry entry; ARTIFACT_HASHES.json pins its exact files and the added verification test. Synthetic fixtures used to test rejection/atomicity are not actual VN30 scoring, ranking or investment decisions.','', 'Stop condition reached: review package complete, no second remediation round or M3 activation.','', 'Awaiting independent review: Review DI14 / DI15 Final Acceptance Closure','']
(P/'FINAL_REVIEW.md').write_text('\n'.join(lines))
# Overlay excludes production source modifications; only the new closure test is external to package.
ledger={str(f.relative_to(R)):sha(f) for f in sorted(P.rglob('*')) if f.is_file() and f.name!='ARTIFACT_HASHES.json'}
test=R/'tests/integration/di14-di15-final-closure.test.ts';ledger[str(test.relative_to(R))]=sha(test)
save('ARTIFACT_HASHES.json',{'algorithm':'SHA256','implementationHEAD':head,'overlayFiles':ledger,'sealIsApproval':False})
assert all(sha(R/f)==h for f,h in ledger.items());assert sha(R/'data/vn30.sqlite')==base['database']['sha256']
print(json.dumps({'endingHEAD':head,'DI14':'PASS_CANDIDATE','DI15':'BLOCKED_ACTUAL_DI14_PASS_REQUIRED','passed':full['numPassedTests'],'preExistingFailures':18,'newRegressions':0,'accountingRegressions':0,'independentAcceptanceCandidateHash':digest,'sealedFiles':len(ledger)}))
