"""Deterministic read-only replay; this command never creates acceptance/authority rows."""
import argparse,json,sqlite3
from pathlib import Path
from lib.pe2_evidence import load,file_hash,content_hash,verify_receipt
ROOT=Path(__file__).resolve().parents[1]
def replay(package):
 base=load(package/'BASELINE_IDENTITY.json');pe1=ROOT/'docs/fundamental-data-engine/evidence/2026-10-21-primary-publication-evidence-pe1'
 assert file_hash(pe1/'ARTIFACT_HASHES.json')==load(pe1/'EVIDENCE_SEAL.json')['artifactHashesSha256']
 for p,h in load(pe1/'ARTIFACT_HASHES.json')['files'].items():assert file_hash(pe1/p)==h,p
 policy=load(ROOT/'src/domain/fundamentals/d2-policy-candidate-v1.json');assert content_hash(policy)=='1738c2b0f46dfb618fe51aceaa002bd2bc55db182837dc72ee0d6b1b346eafad'
 manifest=load(ROOT/'docs/fundamental-data-engine/evidence/2026-10-21-d2-date-only-policy-implementation/D2_IMPLEMENTATION_MANIFEST.json');assert content_hash({k:v for k,v in manifest.items() if k!='contentHash'})==manifest['contentHash']=='7405b633a7cea0777e180588469a444de6a61c4382118c02d4b02e04ee827f97'
 for p in manifest['artifacts']:assert file_hash(ROOT/p['path'])==p['sha256']
 for p,h in base['currentSourcePolicyPins'].items():assert file_hash(ROOT/p)==h
 receipts=load(package/'SOURCE_BINDING_CANDIDATES.json')['candidates'];expected=load(package/'EXPECTED_BINDINGS.json')['bindings'];assert len(receipts)==len(expected)==8
 results=[verify_receipt(ROOT,r,e) for r,e in zip(receipts,expected)]
 c=sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro',uri=True);runs={i:json.loads(b) for i,b in c.execute('select id,body from fundamental_admission_run')}
 for row in load(package/'OBLIGATION_QUALIFICATION.json')['rows']:
  run,p=row['canonicalPointer'].split('#');fact=runs[run]['canonicalFacts'][int(p.split('/')[-1])];assert content_hash(fact)==row['canonicalFactHash'] and fact['unit']==row['unit'] and fact['sourceHash']==row['sourceDocumentSha256']
 assert file_hash(ROOT/'data/vn30.sqlite')==base['databaseSha256'];c.close()
 if (package/'ARTIFACT_HASHES.json').exists():
  hashes=load(package/'ARTIFACT_HASHES.json')
  for p,h in hashes['files'].items():assert file_hash(package/p)==h,p
  for p,h in hashes['implementationPins'].items():assert file_hash(ROOT/p)==h,p
  assert load(package/'EVIDENCE_SEAL.json')['artifactHashesSha256']==file_hash(package/'ARTIFACT_HASHES.json')
 return {'status':'PASS','candidateCount':8,'deterministicResultSha256':content_hash(results),'results':results,'approvedAcceptanceCreated':False,'productionMutation':False}
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--package',type=Path,default=ROOT/'docs/fundamental-data-engine/evidence/2026-10-22-primary-publication-evidence-pe2');args=parser.parse_args();print(json.dumps(replay(args.package),ensure_ascii=False,sort_keys=True,separators=(',',':')))
