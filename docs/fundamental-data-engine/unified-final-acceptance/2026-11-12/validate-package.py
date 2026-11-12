"""Scoped immutable-source, exact-material and real-data gate checks. No active DB writes."""
import hashlib,json,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parents[4];d=pathlib.Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
checks=[]
def check(name,ok):
 assert ok,name
 checks.append(name)
for p in load(d/'PRESERVATION.json')['files']:check('preserved:'+p['path'],sha(root/p['path'])==p['sha256'])
def pins(x):
 if isinstance(x,dict):
  if isinstance(x.get('path'),str) and isinstance(x.get('sha256'),str):yield x
  for v in x.values():yield from pins(v)
 elif isinstance(x,list):
  for v in x:yield from pins(v)
for name in ['U1_MATERIAL_ACCEPTANCE.json','U2_MEMBERSHIP_COVERAGE.json','U3_SELECTED_FINANCIAL_FACTS.json','FINANCIAL_REQUEST.json']:
 for p in pins(load(d/name)):check('exact material/source:'+p['path'],sha(root/p['path'])==p['sha256'])
u1=load(d/'U1_MATERIAL_ACCEPTANCE.json');u2=load(d/'U2_MEMBERSHIP_COVERAGE.json');u3=load(d/'U3_SELECTED_FINANCIAL_FACTS.json');real=load(d/'REAL_ADMISSION_VALIDATION.json')
check('no independent self-approval',u1['status']=='PENDING_INDEPENDENT_MATERIAL_ACCEPTANCE' and all(p['decision']=='PENDING_INDEPENDENT_REVIEW' and p['reviewer'] is None and p['knownAt'] is None for p in u1['proposedDecisions']))
registry=load(d/'TRUSTED_REGISTRY_PENDING.json');check('real host has no manufactured material/capture approval',registry['materials']==[] and registry['captures']==[])
check('membership effective and coverage dates distinct',u2['effectiveDate']=='2026-08-03' and u2['certifiedHistoryInterval']['end']=='2026-10-16' and u2['missingInterval']=={'from':'2026-10-17','through':'2026-10-30'})
check('one selected supported fact',u3['selectedCount']==1 and u3['fact']['itemId']=='TOTAL_ASSETS' and u3['fact']['value']=='57451803693875' and u3['quarantine']==[])
q=load(d/'SELECTED_INPUT.json');check('minimum issuer-only actual input',len(q['verifications'])==1 and len(q['statements'])==1 and q['candidates']==[])
check('actual gate only',u3['trustedGate']=='Error: INDEPENDENT_SOURCE_MATERIAL_ACCEPTANCE_REQUIRED' and not u3['formalAccepted'])
check('current validated and PIT refused',real['F2']['actualEvidenceValidation']=='PASS_CURRENT_ONLY' and real['F2']['PITRejected'] and real['F2']['preKnowledgeCutoffRejected'])
check('real raw evidence with zero formal records',real['F1']['acceptedRecords']==real['F2']['acceptedRecords']==0 and real['F1']['actualIngestResult']['status']=='QUARANTINED' and not real['activeDatabaseChanged'])
check('pending VNM17 untouched',not u3['VNM17Promoted'])
review=load(d/'NATIVE_CELL_REVIEW.json')['cell'];check('native witness not independent authority',not review['independentAdmissionApprovalGranted'] and review['page']==9 and review['printedPage']==8 and review['reviewedAt']==load(d/'RUN_CONTEXT.json')['recordedAt'])
# Original 17-fact source and policy pins remain historical. Only deliberate code edits may drift.
oldpath=root/'docs/fundamental-data-engine/vnm-s4-source-admission/2026-11-12/ADMISSION_DECISIONS.json';old=load(oldpath)
for p in pins(old):
 if sha(root/p['path'])==p['sha256']:check('historical source/policy:'+p['path'],True)
 else:
  check('historical code-only drift',p['path'] in ['src/infrastructure/market-boundary-authority.ts','src/domain/scoring/evidence.ts'])
  b=subprocess.check_output(['git','show','e08ec2d05dbb3dfb3afe55b9857c0d46c75139a2:'+p['path']],cwd=root)
  check('historical original code seal',hashlib.sha256(b).hexdigest()==p['sha256'])
check('no proposal promotion',len(old['facts'])==17 and old['ownerApproval'] is None and not old['sourceAuthorityGranted'])
print(json.dumps({'status':'PASS','checks':len(checks),'activeDatabaseChanged':False,'originalEvidenceChanged':False,'selfApprovalGranted':False},indent=2))
