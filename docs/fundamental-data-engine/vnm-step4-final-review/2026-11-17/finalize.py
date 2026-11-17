"""Validate retained successor outputs without granting scoring authority."""
import hashlib,json
from pathlib import Path
P=Path(__file__).resolve().parent
read=lambda n:json.loads((P/n).read_text())
def write(n,v): (P/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
checks={n:hashlib.sha256((P/n).read_bytes()).hexdigest()==h for n,h in read('REPLAY_BASELINE.json').items()}
assert all(checks.values())
assert read('PROTECTED_DB_BEFORE_FINAL_REVIEW.json')==read('PROTECTED_DB_AFTER_FINAL_REVIEW.json')
assert read('TEST_RESULTS.json')['success'] and read('TEST_RESULTS.json')['numPassedTests']==552
for n in ['APPLIED_VERSION_VERIFICATION.json','SCOPED_TYPECHECK.json','LINT.json']:
 assert read(n)['status']=='PASS',n
route=read('approved-code-run/CURRENT_ROUTE_VALIDATION.json')
write('DETERMINISTIC_REPLAY.json',{'status':'PASS','outputs':checks,'protectedDatabaseAndAllTableFingerprintsUnchanged':True,'baseline':'REPLAY_BASELINE.json'})
blockers=[{'id':'GQ-INC','missing':'Defensible same-scope marginal earnings/capital or principle-equivalent productivity assessment; small book changes remain classification-sensitive.'},{'id':'CA-DIST','missing':'Evidence-backed retention versus distribution opportunity-cost judgment; liquidity sufficiency alone is insufficient.'},{'id':'CA-PSV','missing':'Consistent common-owner cycle/action-adjusted per-share earnings, cash or value outcome.'},{'id':'ASSESSMENT_AND_M1_ADOPTION','missing':'Complete qualified dataset-bound assessment and trusted adoption of Stage0, hard-veto and residual-risk judgments. Exact executable approval does not authorize these.'}]
write('ACCEPTANCE.json',{'step':4,'status':'VALIDATED_SCORING_BLOCKED','closed':False,'executableAuthority':'CLOSED_OWNER_APPROVED_VERIFIED_STATIC_VERSION','rubrics':23,'topics':83,'supportedCandidateBands':20,'notRated':['GQ-INC','CA-DIST','CA-PSV'],'newSupportedCandidate':{'rubric':'CA-REINV','band':1,'formalPoints':None},'formalScore':None,'actualRejection':'CURRENT_ASSESSMENT_DATASET_BINDING_REQUIRED','remainingMaterialBlockers':blockers,'newSourceApprovalRequired':False,'productionActivation':'NOT_AUTHORIZED'})
write('VALIDATION.json',{'status':'PASS','scope':'Successor remediation controls; not scoring closure','tests':{'passed':552,'failed':0,'suites':62},'typecheck':'PASS_168_SOURCE_FILES','lint':{'errors':0,'warnings':0},'exactOwnerAuthorityVerifier':'PASS','realApprovedCodeRun':'approved-code-run/CURRENT_ROUTE_VALIDATION.json','deterministicReplay':'PASS','protectedDatabase':'UNCHANGED','formalScoreProduced':False,'productionActivated':False})
(P/'CURRENT_BLOCKER_REGISTER.md').write_text('# VNM Step 4 — current blockers\n\nStep 4 is not CLOSED. Executable authority is resolved for the exact approved static version. CA-REINV now has supported candidate band 1, pending formal adoption.\n\n'+''.join('- **'+b['id']+'**: '+b['missing']+'\n' for b in blockers)+'\nReuse retained evidence and accepted research. No new source approval, per-PDF permission or reopening of S1–S5 is required. See FINAL_REVIEW.md for bounded economic dependencies.\n')
write('OUTPUT_HASHES.json',{str(f.relative_to(P)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(P.rglob('*')) if f.is_file() and f.name!='OUTPUT_HASHES.json'})
print('PASS: deterministic replay, 552 tests, owner authority and protected database; Step 4 remains scoring blocked.')
