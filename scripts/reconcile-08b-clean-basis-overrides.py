"""Exact two-reader accounting-basis recovery; retains original qualifications."""
import copy,datetime,hashlib,json,pathlib,runpy,sys
B=pathlib.Path('data/initialization-08b-remediation-work')
TARGETS=[('MCH','f2641372',19),('TCB','7040941f',13),('VPB','ed2ace4b',13),('SSI','cd325409',27)]
sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
R=runpy.run_path('scripts/reconcile-08b-extraction.py')
def expected():
 originals=json.loads((B/'qualifications.json').read_text());out=[];proofs=[]
 for ticker,prefix,page in TARGETS:
  q=next(q for q in originals if q['bodyHash'].startswith(prefix));body=q['bodyHash'];f=B/'ocr'/f'{body}-p{page}.json';p=json.loads(f.read_text())
  assert q['ticker']==ticker and q['accountingBasis']=='UNKNOWN'
  assert p['bodyHash']==body and p['page']==page and p['engineA']!=p['engineB']
  assert sha(B/(body+'.pdf'))==body and sha(f.with_suffix('.png'))==p['renderSha256']
  assert all(R['affirmative_vas_preparation'](' '.join(w['text'] for w in p[k])) for k in ['passA','passB'])
  proof={'ticker':ticker,'bodyHash':body,'page':page,'dimension':'ACCOUNTING_BASIS','value':'VAS','sourceOcrProofFile':str(f),'sourceOcrProofSha256':sha(f),'renderSha256':p['renderSha256'],'extractionMethod':p['engineA'],'verificationMethod':p['engineB'],'originalReaderText':{k:' '.join(w['text'] for w in p[k]) for k in ['passA','passB']},'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'crossDocumentComparabilityEstablished':False}
  proofs.append(proof);new=copy.deepcopy(q);new['accountingBasis']='VAS';new['contentEvidencePages']['ACCOUNTING_BASIS']=[page];out.append(new)
 return out,proofs
def main():
 out,proofs=expected();pf=B/'clean-accounting-basis-reader-proof.json';of=B/'clean-accounting-basis-qualification-overrides.json'
 if '--validate' not in sys.argv:
  assert not pf.exists() and not of.exists(),'RETAIN_EXISTING_ATTEMPT'
  pf.write_text(json.dumps({'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'proofs':proofs},ensure_ascii=False,indent=2)+'\n')
 for q in out:q['accountingBasisTwoReaderProof']={'file':str(pf),'sha256':sha(pf)}
 if '--validate' not in sys.argv:of.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 assert json.loads(pf.read_text())['proofs']==proofs and json.loads(of.read_text())==out,'BASIS_OVERRIDE_OR_SOURCE_CHANGED'
 print(json.dumps({'status':'PASS','qualificationOverrides':len(out),'financialValuesChanged':False,'originalQualificationsChanged':False}))
if __name__=='__main__':main()
