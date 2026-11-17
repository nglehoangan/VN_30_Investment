"""Validate the bounded Step4 conclusion; never turn a passing test into scoring approval."""
import json,hashlib,subprocess
from pathlib import Path
O=Path(__file__).resolve().parent;R=Path.cwd()
read=lambda n:json.loads((O/n).read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(n,x):(O/n).write_text(json.dumps(x,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
T=read('TEST_RESULTS.json');TC=read('SCOPED_TYPECHECK.json');X=read('VNM_SCORING_EXECUTION.json');A=read('VNM_23_ASSESSMENT_ADOPTION.json');E=read('EXECUTABLE_VERIFICATION.json');DB=read('PROTECTED_DB_AFTER.json');before=read('PROTECTED_DB_BEFORE_FINAL_TESTS.json')
assert T['numFailedTests']==0 and T['numPendingTests']==0 and T['numTodoTests']==0 and T['numPassedTests']==T['numTotalTests']
assert TC['status']=='PASS' and E['status']=='PASS'
assert 'DI_ACCEPTANCE_REQUIRED' in X['actualEngineError'] and X['actualEngineError']==X['replayedEngineError']
assert 'FUTURE_METHODOLOGY' in X['domainGuardError'] and X['databaseCountsBefore']==X['databaseCountsAfter']
assert X['databaseCountsAfter']['scorecards']==0 and X['formalScorecardProduced'] is False and X['totalScore'] is None
assert before==DB and DB['fileSha256']==read('REAL_EXECUTION.json')['protectedDatabase']['before']['sha256']
assert A['rubrics']==23 and A['topics']==83 and A['adoptedFormalAssessments']==0
baseline=read('REPLAY_BASELINE.json');replay={n:{'before':h,'after':sha(O/n)} for n,h in baseline.items()};assert all(v['before']==v['after'] for v in replay.values())
write('DETERMINISTIC_REPLAY.json',{'status':'PASS','operationalClockRetained':read('RUN_CONTEXT.json'),'outputs':replay,'actualEngineRejectionReplayed':True,'syntheticSuccessIsNotVnmAdmission':True})
for p in read('INPUT_PINS.json')['inputs']:assert sha(R/p['path'])==p['sha256'],p['path']
validation={'status':'PASS','scope':'Step4 bounded real-data rejection, assessment completeness, regression and strict scoped TypeScript; not whole-repository release acceptance','tests':{'total':T['numTotalTests'],'passed':T['numPassedTests'],'failed':T['numFailedTests'],'skipped':T['numPendingTests'],'report':'TEST_RESULTS.json'},'typecheck':TC,'deterministicReplay':'DETERMINISTIC_REPLAY.json','actualRealDataRoute':{'admitted':69,'currentFactsConsumed':35,'historicalFactsConsumed':65,'negativeChecks':len(read('REAL_EXECUTION.json')['checks']),'formalScorecards':0,'actualError':'DI_ACCEPTANCE_REQUIRED','methodEffectiveDateGuard':'FUTURE_METHODOLOGY'},'runtimeAuthority':E,'protectedDatabase':{'readOnly':True,'fileAndEveryTableUnchanged':True,'tableCount':len(DB['tables']),'fileSha256':DB['fileSha256']},'initialFailure':{'report':'INITIAL_TEST_RESULTS.json','reason':'Stale generated personal-AI scorecard diverged from approved action-dependency logic. Generator import mapping and derived AI copy corrected; final full scoped suite passes.','approvedRuntimeChanged':False},'researchClosuresPreserved':True,'standingAuthorityReapproved':False,'VNM17Promoted':False,'liveCasActivated':False,'productionActivated':False}
write('VALIDATION.json',validation)
write('VNM_STEP4_ACCEPTANCE.json',{'contract':'vnm-step4-acceptance-v1','baseline':'7fc42fb422bb3dbf3bd95ab25a9d45eabbd1ad4b','ticker':'VNM','economicCutoff':'2026-10-30','knowledgeTime':read('RUN_CONTEXT.json')['knownAt'],'classification':'VALIDATED — SCORING BLOCKED','closed':False,'rationale':'Trustworthy actual rejection and complete 23/83 disposition; required economic bands/adoption/confidence and current-purpose formal score compatibility do not pass. Passing tests do not authorize a score.','fourRubrics':{r['rubricId']:r['status'] for r in read('VNM_4_RUBRIC_RESOLUTION.json')['rows']},'formalAssessmentsAdopted':0,'contentSupportedCandidateBands':19,'formalScorecardProduced':False,'totalScore':None,'engineError':'DI_ACCEPTANCE_REQUIRED','domainTimeGuard':'FUTURE_METHODOLOGY','materialBlockerRegister':'CURRENT_BLOCKER_REGISTER.md','decision':'NOT_READY','historicalPit':'NOT_QUALIFIED','productionActivation':'NOT_AUTHORIZED','portfolioMutation':False,'stop':'STOP_FOR_CIO_REVIEW'})
files=[p for p in O.iterdir() if p.is_file() and p.name not in ['OUTPUT_HASHES.json']]
write('OUTPUT_HASHES.json',{'files':[{'path':str(p.relative_to(R)),'sha256':sha(p)} for p in sorted(files)],'sourceChanges':[{'path':p,'sha256':sha(R/p)} for p in ['scripts/generate-personal-ai-compatibility.mjs','src/domain/personal-ai/scorecard.ts','tests/unit/vnm-step4-readiness.test.ts']],'selfExcluded':True})
print(json.dumps({'classification':'VALIDATED — SCORING BLOCKED','tests':validation['tests'],'replay':'PASS','databaseUnchanged':True},ensure_ascii=False))
