"""Read-only preservation/governance checks for the successor package."""
import json,pathlib,hashlib,subprocess,re
root=pathlib.Path(__file__).resolve().parents[4];d=pathlib.Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
checks=[]
def check(name,condition):
 assert condition,name
 checks.append(name)
prior=root/'docs/fundamental-data-engine/cafef-standing-source/2026-11-12'
for p in load(prior/'PRESERVATION.json')['files']:check('preserved:'+p['path'],sha(root/p['path'])==p['sha256'])
a=load(d/'SOURCE_POLICY_AUTHORIZATIONS.json');check('policy scope',a['marketPrincipleAuthorized'] and a['currentFinancialPrincipleAuthorized'] and a['historicalPitPublicationRequired'] and not a['productionActivationGranted'] and not a['pendingVnm17FactsApproved'])
check('owner source',sha(root/a['source']['path'])==a['source']['sha256'])
check('exact owner request',sha(d/'OWNER_REQUEST.txt')==sha(pathlib.Path('/Users/nglehoangan/.codex/attachments/530a5d44-fcd9-4303-8abf-be5268277606/Pasted text.txt')))
def pins(x):
 if isinstance(x,dict):
  if isinstance(x.get('path'),str) and isinstance(x.get('sha256'),str):yield x
  for v in x.values():yield from pins(v)
 elif isinstance(x,list):
  for v in x:yield from pins(v)
for p in pins(load(d/'MATERIAL_REVIEW_PROPOSAL.json')):check('proposal pin:'+p['path'],sha(root/p['path'])==p['sha256'])
old=load(root/'docs/fundamental-data-engine/vnm-s4-source-admission/2026-11-12/ADMISSION_DECISIONS.json');drift=[]
for p in pins(old):
 if sha(root/p['path'])==p['sha256']:check('old pin:'+p['path'],True)
 else:
  check('bounded code amendment',p['path'] in ['src/infrastructure/market-boundary-authority.ts','src/domain/scoring/evidence.ts'])
  b=subprocess.check_output(['git','show','e08ec2d05dbb3dfb3afe55b9857c0d46c75139a2:'+p['path']],cwd=root)
  check('historical baseline pin',hashlib.sha256(b).hexdigest()==p['sha256']);drift.append(p['path'])
check('17 selected facts unchanged and pending',len(old['facts'])==17 and old['ownerApproval'] is None and not old['sourceAuthorityGranted'])
r=load(d/'DATA_MIGRATION_REPORT.json');check('no activation',not r['activeDatabaseChanged'] and not r['portfolioChanged'] and not r['originalReceiptsRewritten'])
m=r['market'];check('market reconciliation',m['retained']==1197 and len(m['normalized'])==52 and len(m['quarantine'])==1145 and m['acceptedCommitted']==0)
for f in r['financial']:
 check('real validator replay:'+f['ticker'],f['replay']=='PASS' and f['acceptedCommitted']==0 and f['currentFormalAdmission']=='NOT_GRANTED')
 for p in f['sourceBindings']:
  if p['status']=='MATCH':check('original source:'+p['path'],sha(root/p['path'])==p['sha256'])
  if p['status']=='RETAINED_SAME_HASH_ALTERNATIVE':check('same hash alias:'+p['path'],any(sha(root/path)==p['sha256'] for path in p['retainedAlternatives']))
for name in ['skills/vn30-market-price-corporate-actions/SKILL.md','skills/vn30-market-price-corporate-actions/references/unified-admission.md']:
 text=(root/name).read_text()
 if name.endswith('SKILL.md'):check('skill frontmatter',text.startswith('---\nname: vn30-market-price-corporate-actions\ndescription:'))
 for target in re.findall(r'\]\((references/[^)]+)\)',text):check('skill link:'+target,(root/name).parent.joinpath(target).is_file())
print(json.dumps({'status':'PASS','checks':len(checks),'historicalCodeChanges':drift,'historicalRecordsResealed':False},indent=2))
