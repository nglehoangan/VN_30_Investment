from pathlib import Path
import json,hashlib,sqlite3,subprocess,datetime
P=Path(__file__).resolve().parent;R=Path.cwd();H=lambda b:hashlib.sha256(b).hexdigest()
def load(p):return json.loads(Path(p).read_text())
b=load(P/'BASELINE_IDENTITY.json');s=load(P/'FINAL_STATUS.json');d=load(P/'OFFICIAL_DISCLOSURE_DISCOVERY.json');inv=load(P/'SOURCE_DOCUMENT_INVENTORY.json');c=load(P/'MINIMUM_DATASET_SOURCE_COVERAGE.json');m=load(P/'DOCUMENT_IDENTITY_MATCHES.json');v=load(P/'VHM_16_LEADS_REVIEW.json');a=load(P/'PRODUCTION_MUTATION_AUDIT.json');e=load(P/'ESCALATION_UPDATE.json')
required=['BASELINE_IDENTITY.json','SOURCE_DOCUMENT_INVENTORY.json','OFFICIAL_DISCLOSURE_DISCOVERY.json','DOCUMENT_IDENTITY_MATCHES.json','VHM_16_LEADS_REVIEW.json','MINIMUM_DATASET_SOURCE_COVERAGE.json','D2_DATE_ONLY_CANDIDATES.json','ESCALATION_UPDATE.json','TEST_RESULTS.json','PRODUCTION_MUTATION_AUDIT.json','ISSUES.json','FINAL_REVIEW.md','FINAL_STATUS.json']
assert all((P/n).is_file() for n in required)
assert len(inv['documents'])==353 and len({x['sha256'] for x in inv['documents']})==353
assert sum(len(x['retainedPaths']) for x in inv['documents'])==337
for r in load(P/'HTTP_REQUEST_INVENTORY.json'):
 if r.get('bodyPath'):assert H(Path(r['bodyPath']).read_bytes())==r['bodySha256']
for r in d['records']:
 assert H(Path(r['documentCapturePath']).read_bytes())==r['documentSha256']
 if r['publicationDate']:
  pe=r['publicationEvidence'];raw=Path(pe['rawPath']).read_bytes();assert H(raw)==pe['sha256'];t=raw.decode('utf-8');loc=pe['locator'];assert pe['dateLiteral'] in t[loc['start']:loc['endExclusive']];assert r['publishedAt'] is None
for x in m['matches']:
 for r in x['retainedMatches']:
  assert Path(x['officialPDFPath']).read_bytes()==Path(r['path']).read_bytes() and H(Path(r['path']).read_bytes())==x['officialSha256']
 assert x['status']!='EXACT_BYTE_MATCH' or x['retainedMatches']
covered={i for r in d['records'] for i in r['verifiedObligationIndices']};assert len(covered)==45 and len(c['remainingIndices'])==171 and not covered.intersection(c['remainingIndices']) and len(c['obligations'])==216
for r in load(P/'D2_DATE_ONLY_CANDIDATES.json')['candidates']:
 local=datetime.datetime.fromisoformat(r['conservativePublicationBoundaryLocal']);assert local.date()==datetime.date.fromisoformat(r['publicationDate'])+datetime.timedelta(days=1) and local.hour==0 and local.utcoffset()==datetime.timedelta(hours=7);assert r['publishedAt'] is None and r['effectiveKnownAt'] is None and not r['D2Activated']
assert v['totalLeads']==16 and v['documentIdentityVerified']==16 and v['historicalPublicationDateVerified']==0
for path,h in b['protectedDataFiles'].items():assert H(Path(path).read_bytes())==h
assert H(Path('data/vn30.sqlite').read_bytes())==b['databaseSha256'];db=sqlite3.connect('file:data/vn30.sqlite?mode=ro',uri=True);assert H('\n'.join(db.iterdump()).encode())==b['logicalSha256'];assert db.execute('pragma integrity_check').fetchone()[0]=='ok';db.close()
reg=load(e['path']);assert H(Path(e['path']).read_bytes())==e['afterSha256'];assert next(i for i in reg['issues'] if i['issueId']=='PRIMARY_PUBLICATION_EVIDENCE')==e['updatedIssue']
old=json.loads(subprocess.check_output(['git','show','HEAD:'+e['path']]));assert H(subprocess.check_output(['git','show','HEAD:'+e['path']]))==e['beforeSha256'];assert all(x==y for x,y in zip(old['issues'],reg['issues']) if x['issueId']!='PRIMARY_PUBLICATION_EVIDENCE');assert {k:v for k,v in old.items() if k!='issues'}=={k:v for k,v in reg.items() if k!='issues'}
assert subprocess.check_output(['git','diff','--name-only'],text=True).splitlines()==[e['path']]
assert load(P/'TEST_RESULTS.json')['numPassedTests']==201
assert s['summary']['formallyAdmitted']==0 and not s['PE2Executed'] and not s['D2Activated']
if (P/'ARTIFACT_HASHES.json').exists():
 hashes=load(P/'ARTIFACT_HASHES.json')['files']
 for n,h in hashes.items():assert H((P/n).read_bytes())==h,n
 actual={str(x.relative_to(P)) for x in P.rglob('*') if x.is_file() and x.name not in ['ARTIFACT_HASHES.json','EVIDENCE_SEAL.json']};assert actual==set(hashes)
 seal=load(P/'EVIDENCE_SEAL.json');assert seal['artifactHashesSha256']==H((P/'ARTIFACT_HASHES.json').read_bytes())
print(json.dumps({'status':'PASS','requiredArtifacts':len(required),'inventoryUniqueDocuments':353,'physicalBaselinePDFs':337,'verifiedObligations':45,'unresolvedObligations':171,'D2Candidates':8,'exactByteMatches':7,'independentlyVerifiedIdentities':9,'testPasses':201,'protectedDataFiles':len(b['protectedDataFiles']),'historicalTrackedEvidenceUnchanged':True,'registerDeltaOnlyAuthorizedIssue':True,'databaseIntegrity':'PASS','sealVerified':(P/'ARTIFACT_HASHES.json').exists()}))
