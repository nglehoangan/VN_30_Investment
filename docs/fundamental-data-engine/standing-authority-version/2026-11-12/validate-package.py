"""Read-only current-version/source preservation checks; legacy trial hashes stay historical."""
import json,pathlib,hashlib
root=pathlib.Path(__file__).resolve().parents[4];d=pathlib.Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
checks=[]
def check(name,value):
 assert value,name
 checks.append(name)
def pins(x):
 if isinstance(x,dict):
  if isinstance(x.get('path'),str) and isinstance(x.get('sha256'),str):yield x
  for v in x.values():yield from pins(v)
 elif isinstance(x,list):
  for v in x:yield from pins(v)
for p in load(d/'PRESERVATION.json')['files']:check('unchanged:'+p['path'],sha(root/p['path'])==p['sha256'])
r=load(d/'VERSIONED_SOURCE_REGISTRY.json');check('owner model approval not independent material approval',r['contract']=='standing-source-authority-per-version-v1' and r['notAnIndependentMaterialApproval'] and not r['productionActivation'])
for p in pins(r):check('current version pin:'+p['path'],sha(root/p['path'])==p['sha256'])
for p in pins(load(d/'TRUSTED_SOURCE_INPUTS.json')):check('trusted evidence pin:'+p['path'],sha(root/p['path'])==p['sha256'])
check('two approved version scopes',len(r['authorities'])==2 and all(a['status']=='APPROVED' and a['version']=='4' for a in r['authorities']))
q=load(d/'REAL_FINANCIAL_REQUEST.json');check('explicit version binding',q['material']['standingAuthority']=={'id':'approved-financial-source-roles','version':'4','registry':{'path':str((d/'VERSIONED_SOURCE_REGISTRY.json').relative_to(root)),'sha256':sha(d/'VERSIONED_SOURCE_REGISTRY.json')}})
for p in pins(q):check('actual financial input pin:'+p['path'],sha(root/p['path'])==p['sha256'])
v=load(d/'F1_F2_REAL_ADMISSION_VALIDATION.json');check('real accepted and consumed',v['mode']=='REAL_RETAINED_SOURCES_ISOLATED_SQLITE' and v['F1']['status']=='ADMITTED_AND_CONSUMED' and v['F2']['status']=='ADMITTED_AND_CONSUMED_SELECTED_FACT')
check('real counts and idempotence',v['counts']['marketBoundaryRecords']==2 and v['counts']['financialAdmissionRuns']==1 and v['counts']['financialRawCaptures']==8 and len(v['F1']['duplicate'])==1 and v['F2']['duplicate'])
check('source trust approved only after verification',v['F1']['sourceTrust']==v['F2']['sourceTrust']=='APPROVED_STANDING_SOURCE')
check('no independent material receipts',not v['independentMaterialReceiptsRequired'] and v['independentMaterialReceiptsCreated']==0)
check('U2 not bypassed',v['F1']['date']=='2026-10-16' and v['F1']['requestedCutoff']=='2026-10-30' and v['F1']['requestedCutoffStatus']=='BLOCKED_U2' and 'MEMBERSHIP_OUTSIDE_VERIFIED_INTERVAL' in v['F1']['cutoffReason'])
check('PIT/production/accounting preserved',v['historicalPIT']=='NOT_QUALIFIED' and 'CURRENT_ONLY_NOT_PIT' in v['F2']['PITRejected'] and v['productionActivation']=='NOT_AUTHORIZED' and not v['activeDatabaseChanged'] and not v['VNM17Promoted'])
proof=v['F2']['automatedVerification'];check('source receipt audit proof',proof['sourceTrust']=='APPROVED_STANDING_SOURCE' and len(proof['facts'])==1 and proof['facts'][0]['receipt']['sourceReceiptPointer'].startswith('/requests/'))
for p in pins(proof):check('automated verification source pin:'+p['path'],sha(root/p['path'])==p['sha256'])
old=load(root/'docs/fundamental-data-engine/vnm-s4-source-admission/2026-11-12/ADMISSION_DECISIONS.json');check('VNM17 pending unchanged',len(old['facts'])==17 and old['ownerApproval'] is None and not old['sourceAuthorityGranted'])
check('R1 R4 remain closed',v['R1']=='CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY' and v['R4']=='CLOSED_BY_SCOPE_EXCLUSION')
print(json.dumps({'status':'PASS','checks':len(checks),'activeDatabaseChanged':False,'independentApprovalManufactured':False,'sourceEvidenceChanged':False},indent=2))
