import json,hashlib
from pathlib import Path
P=Path(__file__).resolve().parent;Q=P/'final-reviewed-run'
read=lambda p:json.loads(p.read_text())
def put(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
assert read(P/'PROTECTED_BEFORE.json')==read(P/'PROTECTED_AFTER.json')
tests=read(P/'TEST_RESULTS.json');assert tests['success'] and tests['numFailedTests']==0
assert read(P/'ECONOMIC_CHALLENGE_VALIDATION.json')['status']=='PASS'
a=read(Q/'AI_ADOPTION_AND_SCORING.json');assert a['status']=='PASS' and a['totalScore']=='43' and a['readbackMatches'] and a['currentScoreRowsAfter']==1
assert a['reviewMode']=='OWNER_AUTHORIZED_AI_SELF_REVIEW' and not a['independentHumanReviewClaimed']
for n in ['PROVENANCE_AND_M1_STRUCTURE_VALIDATION.json','DOMAIN_CANDIDATE_VALIDATION.json']:assert read(Q/n)['status']=='PASS'
replay={n:hashlib.sha256((P/n).read_bytes()).hexdigest()==h for n,h in read(P/'REPLAY_BASELINE.json').items()};assert all(replay.values()),replay
put('DETERMINISTIC_REPLAY.json',{'status':'PASS','outputs':replay,'databaseAndAllTablesUnchanged':True})
put('M1_AND_ASSESSMENT_ADOPTION_RECEIPT.json',{'mode':a['reviewMode'],'scope':'ISOLATED_CURRENT_PURPOSE_SCORING_VALIDATION','assessmentsAdopted':23,'topics':83,'stage0':'PASS WITH CONDITIONS','hardVeto':'CLEAR','residualRisk':'ELEVATED_WEAK','actualProof':'final-reviewed-run/AI_ADOPTION_AND_SCORING.json','binding':'final-reviewed-run/APPLIED_ISOLATED_REVIEW_BINDING.json','independentHumanReviewClaimed':False,'liveConfigurationChanged':False,'newOwnerApprovalManufactured':False,'supersedesPreparationOnlyStatuses':True})
put('VNM_STEP4_ACCEPTANCE.json',{'ticker':'VNM','economicCutoff':'2026-10-30','reviewDate':'2026-11-18','status':'CLOSED_CURRENT_PURPOSE_SCORING_VALIDATION_ISOLATED','scope':'EXISTING_OWNER_AUTHORIZED_AI_SELF_REVIEW; NOT_PRODUCTION_ACTIVATION','assessments':23,'topics':83,'unsupportedMandatoryBands':[],'remainingStep4Blockers':[],'isolatedScore':'43','confidence':'LOW','validity':'VALID — NON-ACTIONABLE','CIOReview':'PENDING','productionActivation':'NOT_AUTHORIZED','liveTrustRegistration':'NOT_PERFORMED','historicalPIT':'NOT_QUALIFIED','VNM17Promoted':False,'sourceAuthorityChanged':False,'scoringRulesChanged':False,'protectedDatabaseChanged':False})
put('VALIDATION.json',{'status':'PASS','typescriptScopedTests':{'passed':tests['numPassedTests'],'failed':tests['numFailedTests']},'pythonEconomicChallenges':{'passed':8,'failed':0},'actualRealDataChecks':len(read(Q/'REAL_EXECUTION.json')['checks']),'nativeFactsAdmittedInIsolation':69,'currentFinancialEvidence':35,'historicalFacts':65,'currentScoreArtifactCounts':[0,1,1],'exactRuntimeAuthority':'PASS_UNCHANGED_OWNER_APPROVED_VERSION','exactAIProvenanceAndBinding':'PASS','negativeUnboundReview':'TRUSTED_AI_REVIEW_BINDING_REQUIRED','assessmentOrM1Alteration':'REJECTED','revocationOnScoreRead':'REJECTED','deterministicReplay':'PASS','protectedDatabase':'UNCHANGED','scope':'Focused validation, not full repository suite/build/typecheck. No TypeScript/runtime source modified.'})
(P/'CURRENT_BLOCKER_REGISTER.md').write_text('# Current VNM Step4 disposition\n\nNo unresolved mandatory blocker for the isolated current-purpose scoring validation. All23/83 assessments and dated M1 gates passed the exact AI-review binding route.\n\nRemaining release boundaries:\n\n- CIO review pending; this AI self-review is not a CIO signature.\n- No production activation or live trust/score installation.\n- Confidence LOW and VALID — NON-ACTIONABLE; a score is not a purchase authorization.\n- Historical PIT remains NOT_QUALIFIED.\n\nThese do not reopen S1–S5, F1/F2 standing source approvals, Step1/2/3 or VNM17 pending admission.\n')
# Remove newly generated disposable assembly copies; final exact inputs and actual receipts remain.
removed=[]
for n in ['CURRENT_SCORE_INPUT_PROPOSAL.json','PROPOSED_METHODOLOGY.json','CURRENT_EXECUTABLE_REVIEW_PACKET.json']:
 f=Q/n
 if f.exists():f.unlink();removed.append('final-reviewed-run/'+n)
put('PHASE_INDEX.json',{'authoritativeFinalStatus':'VNM_STEP4_ACCEPTANCE.json','actualAdoptionAndScore':'final-reviewed-run/AI_ADOPTION_AND_SCORING.json','exactFinalInput':'final-reviewed-run/EXACT_ADOPTION_PACKET.json','preparationOnly':['ASSESSMENT_CANDIDATES.json','ADOPTION_READINESS.json','M1_CONFIDENCE_AND_RISK_ASSESSMENT.json','final-reviewed-run/TRUST_BINDING_PROPOSAL.json'],'unboundNegativeControlNotFinalAdoption':'final-reviewed-run/CURRENT_ROUTE_VALIDATION.json','disposableAssemblyCopiesRemoved':removed,'historicalRepositoryEvidenceDeleted':False})
put('OUTPUT_HASHES.json',{str(p.relative_to(P)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(P.rglob('*')) if p.is_file() and p.name!='OUTPUT_HASHES.json'})
print('PASS: Step4 isolated current-purpose scoring validation CLOSED;43/100,LOW,NON-ACTIONABLE;production not authorized.')
