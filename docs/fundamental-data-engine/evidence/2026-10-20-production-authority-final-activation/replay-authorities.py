"""Independent Python hashes/Git object replay. Never runs scoring or writes production."""
import hashlib,json,pathlib,subprocess,sqlite3
R=pathlib.Path.cwd();P=R/'docs/fundamental-data-engine/evidence/2026-10-20-production-authority-final-activation'
def load(p):return json.loads(pathlib.Path(p).read_text())
def digest(b):return hashlib.sha256(b).hexdigest()
def canonical(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def save(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def pin(p):
 f=(R/p['path']).resolve();assert f.is_relative_to(R);b=f.read_bytes();assert digest(b)==p['sha256'],p['path'];return b
seen=set()
def verify(filePin):
 if filePin['path'] in seen:return load(R/filePin['path'])
 data=pin(filePin);r=json.loads(data);seen.add(filePin['path'])
 if 'contentHash' in r:
  body={k:v for k,v in r.items() if k!='contentHash'};assert digest(canonical(body).encode())==r['contentHash'],filePin['path']
 if 'receiptSha256' in r:
  body={k:v for k,v in r.items() if k!='receiptSha256'};assert digest(canonical(body).encode())==r['receiptSha256']
 def walk(v):
  if isinstance(v,dict):
   if 'path' in v and 'sha256' in v:
    b=pin(v)
    if 'sourceCommit' in v:
     assert digest(subprocess.check_output(['git','show',v['sourceCommit']+':'+v['path']]))==v['sha256']
    if v['path'].endswith('.json'):verify(v)
   for x in v.values():walk(x)
  elif isinstance(v,list):
   for x in v:walk(x)
 walk(r);return r
config=load(R/'src/infrastructure/dependencies/active-authorities.json');bundle=verify(config['authorityBundle']);manifest=load(P/'SCORING_EXECUTABLE_MANIFEST.json');owner=load(P/'OWNER_APPROVAL_RECEIPT.json');executable=load(P/'SCORING_EXECUTABLE_AUTHORITY.json')
assert owner['approvalMode']=='OWNER_GOVERNANCE_APPROVAL' and owner['approvalScope']=='SCORING_EXECUTABLE_PRODUCTION' and owner['statement']=='Approve m64-clarification-1 v1.0.0 for Production'
assert owner['statement'] in pin(owner['source']).decode() and owner['manifest']=={'id':manifest['id'],'hash':manifest['contentHash']}
assert executable['status']=='APPROVED_PRODUCTION' and manifest['implementationId']=='m64-clarification-1' and manifest['version']=='1.0.0'
for a in manifest['artifacts']:
 assert digest(subprocess.check_output(['git','show',manifest['reviewedCommit']+':'+a['path']]))==a['sha256'],'SCORING_EXECUTABLE_CHANGED_AFTER_APPROVAL'
assert manifest['categoryMaxima']=={'BQ':25,'FH':15,'GQ':15,'IC':10,'VAL':20,'RG':10,'CA':5}
assert all(verify(p)['result']=='COMPATIBLE' for p in bundle['compatibilities'])
for binding in config['bindings']:pin(binding)
base=load(P/'BASELINE_IDENTITY.json');old=load(R/'docs/fundamental-data-engine/evidence/2026-10-20-di14-di15-final-acceptance/PROTECTED_ACCOUNTING_REPLAY.json');db=sqlite3.connect('file:data/vn30.sqlite?mode=ro',uri=True);canonicalRuns=[]
for row in db.execute('select id,body,body_hash from fundamental_admission_run order by id'):
 before=next(r for r in old['all30CanonicalRuns'] if r['runId']==row[0]);d=json.loads(row[1]);assert digest(row[1].encode())==row[2]==before['bodySHA256'];assert digest(canonical({k:v for k,v in d.items() if k!='contentHash'}).encode())==d['contentHash']
 for field,key in [('canonicalFacts','factsHash'),('derivedMetrics','derivedHash'),('sourceBindings','sourceBindingsHash')]:assert digest(canonical(d[field]).encode())==before[key]
 canonicalRuns.append({'ticker':d['canonicalFacts'][0]['ticker'],'id':row[0],'bodyHash':row[2],'contentHash':d['contentHash'],'factsHash':before['factsHash'],'derivedHash':before['derivedHash']})
assert len(canonicalRuns)==30;assert db.execute('pragma integrity_check').fetchall()==[('ok',)] and db.execute('pragma foreign_key_check').fetchall()==[]
row=db.execute("select name from sqlite_master where name='dependency_release'").fetchone();releaseInfo=None
if row:
 rows=db.execute('select id,body,body_hash from dependency_release').fetchall()
 for rid,body,bhash in rows:
  d=json.loads(body);assert digest(canonical({k:v for k,v in d.items() if k!='contentHash'}).encode())==d['contentHash']==bhash;assert rid=='dependency-release-'+digest(canonical({k:v for k,v in d.items() if k not in ['id','contentHash']}).encode())
  for binding in config['bindings']:
   configured=json.loads(pin(binding));assert configured==next(h for h in d['heads'] if h['type']==configured['type'])
  for h in d['heads']:
   content=h['content']
   if h['scheme']=='JSON':assert digest(canonical(content).encode())==h['pin']['hash']
   elif h['scheme']=='BOUNDARY':assert digest(canonical({k:v for k,v in content.items() if k!='contentHash'}).encode())==content['contentHash']==h['pin']['hash']
   elif h['scheme']=='SESSION':assert digest(canonical({k:v for k,v in content.items() if k not in ['id','hash']}).encode())==h['pin']['hash']
  projection=db.execute("select body_hash from market_boundary_dependency_head where id='production-dependencies-v1'").fetchone();assert projection and projection[0]==bhash
  m=next(h for h in d['heads'] if h['type']=='SCORING_MODEL')['content'];assert m['authorityBundle']=={'id':bundle['id'],'hash':bundle['contentHash']} and m['executableAuthority']=={'id':executable['id'],'hash':executable['contentHash']}
  releaseInfo={'id':rid,'hash':bhash,'headCount':len(d['heads']),'projectionHash':projection[0],'status':'PASS'}
db.close();save('INDEPENDENT_AUTHORITY_REPLAY.json',{'status':'PASS','implementation':'Independent Python canonical JSON/SHA256 + exact Git objects; no JS verifier imported','filesReplayed':len(seen),'manifestId':manifest['id'],'manifestHash':manifest['contentHash'],'executableArtifacts':len(manifest['artifacts']),'drift':'NONE','ownerApprovalHash':owner['contentHash'],'executableAuthorityHash':executable['contentHash'],'bundleId':bundle['id'],'bundleHash':bundle['contentHash'],'activeRelease':releaseInfo,'accountingRegressions':0})
save('PROTECTED_ACCOUNTING_REPLAY.json',{'status':'PASS','ACCOUNTING_REGRESSIONS':0,'canonicalRuns':canonicalRuns,'initializationAccepted':True,'noTickerClosureReopened':True,'productionDBMayContainGovernanceOnlyChanges':True,'VNM':'UNCHANGED_REPORTED_BORROWINGS_SCOPE','VIB':'UNCHANGED_CAR_SUPPORTING_NPL_SCOPE','VIC':'UNCHANGED_REVIEWED6M2026','TCX':'UNCHANGED_OWNER_ANALYTICAL_EXCEPTION','MBB':'UNCHANGED_DEFERRED'})
print(json.dumps({'independentReplay':'PASS','sealedJSONFilesReplayed':len(seen),'canonicalRuns':30,'accountingRegressions':0,'activeRelease':releaseInfo}))
