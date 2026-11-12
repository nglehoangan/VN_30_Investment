"""Read-only evidence checks; deterministic workbench writes package outputs only."""
import hashlib,json,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[4]
D=pathlib.Path(__file__).resolve().parent
h=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text())
def pins(x):
    if isinstance(x,dict):
        if isinstance(x.get('path'),str) and isinstance(x.get('sha256'),str): yield x
        for v in x.values(): yield from pins(v)
    elif isinstance(x,list):
        for v in x:yield from pins(v)
checks=[]
def check(name,condition):
    assert condition,name
    checks.append(name)
preserve=load(D/'PRESERVATION.json')
for p in preserve['files']:check('unchanged:'+p['path'],h((ROOT/p['path']).read_bytes())==p['sha256'])
a=load(D/'SOURCE_POLICY_AUTHORIZATION.json')
check('owner principle only',a['authorizedPrinciple'] and not a['codeAcceptanceGranted'] and not a['productionActivationGranted'] and a['F2']=='OPEN')
check('owner exact quote',a['ownerStatement'] in (D/'OWNER_REQUEST.txt').read_text())
check('owner request exact attachment',h((D/'OWNER_REQUEST.txt').read_bytes())==h(pathlib.Path('/Users/nglehoangan/.codex/attachments/855c1c67-4bea-43fd-ab70-3e1e83db08ce/Pasted text.txt').read_bytes()))
material=load(D/'MATERIAL_REVIEW_PROPOSAL.json')
for p in list(pins(material))+list(pins(a)):check('current pin:'+p['path'],h((ROOT/p['path']).read_bytes())==p['sha256'])
old=load(ROOT/preserve['files'][3]['path'])
drift=[]
for p in pins(old):
    current=h((ROOT/p['path']).read_bytes())
    if current!=p['sha256']:
        check('sole historical code drift',p['path']=='src/infrastructure/market-boundary-authority.ts')
        baseline=subprocess.check_output(['git','show','e08ec2d05dbb3dfb3afe55b9857c0d46c75139a2:'+p['path']],cwd=ROOT)
        check('original historical code pin valid',h(baseline)==p['sha256'])
        drift.append({'path':p['path'],'historicalHash':p['sha256'],'currentHash':current,'status':'REQUALIFICATION_PENDING_NO_HISTORICAL_RESEAL'})
    else:check('retained historical pin:'+p['path'],True)
check('17 facts not self-approved',len(old['facts'])==17 and old['ownerApproval'] is None and not old['sourceAuthorityGranted'])
m=load(D/'MARKET_MIGRATION_REPORT.json');p=load(D/'MULTI_TICKER_PILOT.json')
check('migration reconciliation',m['retainedRows']==1197 and len(m['normalized'])==52 and m['quarantined']==1145 and m['acceptedCommitted']==0)
check('actual replay and block',all(r['replay']=='PASS' and not r['accepted'] and 'INDEPENDENT_MATERIAL_ACCEPTANCE_REQUIRED' in r['admissionReason'] for r in m['normalized']))
check('no additional real ticker fabricated',all(not r['realRetainedCafefEvidenceAvailable'] and r['acceptedCommitted']==0 for r in p['pilots'] if r['ticker']!='VNM'))
v=p['pilots'][0]['reusableSkillReplay']
check('VNM unchanged regression',v['price']=='56900' and v['reviewedCashComponents']==15 and v['shares']=='2089955445' and not v['formalAdmissionGranted'])
files=['MATERIAL_REVIEW_PROPOSAL.json','MARKET_MIGRATION_REPORT.json','MULTI_TICKER_PILOT.json']
before={f:h((D/f).read_bytes()) for f in files}
subprocess.run(['node','scripts/cafef-standing.mjs','--package',str(D.relative_to(ROOT))],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
check('deterministic package replay',all(h((D/f).read_bytes())==before[f] for f in files))
for pin in preserve['files']:check('post replay unchanged:'+pin['path'],h((ROOT/pin['path']).read_bytes())==pin['sha256'])
print(json.dumps({'status':'PASS','checks':len(checks),'historicalCodeDrift':drift,'deterministicOutputHashes':before,'productionActivated':False},indent=2))
