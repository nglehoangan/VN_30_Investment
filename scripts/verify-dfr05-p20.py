"""Read-only P2.0 dated-universe verification. No issuer pipeline, acquisition or DB writes."""
from pathlib import Path
from copy import deepcopy
import hashlib,json,sys,subprocess
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/fundamental-data-engine/dfr-05/p2-0-bd3a8b4b'
BASELINE='bd3a8b4bc5490f379918c6c75c09a06f378e4e1a'
PILOTS={'FPT','VNM','BID','TCX','VIC','VHM'}
def read(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def content_hash(p):return hashlib.sha256(json.dumps({k:v for k,v in p.items() if k!='contentHash'},ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def can_process(p):return p['ownerApproval']['status']=='APPROVED' and p['processingAuthorization']['p2IssuerProcessing'] is True

def validate(p):
 if p['baselineCommit']!=BASELINE or p['researchReferenceDate']!='2026-11-05':raise ValueError('DATED_BASELINE_REQUIRED')
 if p['classification']!='RESEARCH_UNIVERSE_APPROVAL_PROPOSAL':raise ValueError('PROPOSAL_ONLY')
 if content_hash(p)!=p['contentHash']:raise ValueError('CANONICAL_CONTENT_HASH')
 rows=p['constituents']
 if len(rows)!=30 or len({r['ticker'] for r in rows})!=30 or len({r['securityId'] for r in rows})!=30 or len({r['isin'] for r in rows})!=30:raise ValueError('EXACT_30_UNIQUE_IDENTITIES')
 if p['verifiedConstituents']!=30 or p['verificationStatus']!='VERIFIED_OFFICIAL_AS_RETRIEVED':raise ValueError('UNVERIFIED_UNIVERSE')
 if p['ownerApproval']!={'status':'PENDING','approvalReference':None,'approvedAt':None} or any(p['processingAuthorization'].values()) or can_process(p):raise ValueError('NO_PROCESSING_OR_SELF_APPROVAL')
 if {r['ticker'] for r in rows if r['pilotClassification']=='PILOT'}!=PILOTS:raise ValueError('EXACT_SIX_PILOTS')
 for r in rows:
  if r['exchange']!='HOSE' or r['verificationStatus']!='VERIFIED_OFFICIAL_AS_RETRIEVED' or r['membershipStatus'] is not True:raise ValueError('MEMBERSHIP_SOURCE_REQUIRED')
  if not r['membershipEffectiveFrom']<=p['researchReferenceDate']<=r['verifiedThroughDate']:raise ValueError('FUTURE_OR_UNCOVERED_MEMBERSHIP')
  if r['firstEverEntryDate'] is not None or r['publicationTimestampCertified'] is not None or r['financialProcessingAuthorized']:raise ValueError('NO_INVENTED_DATES_OR_PROCESSING')
  if r['existingMasterMapping']['status']!='MATCHED' or r['existingMasterMapping']['securityId']!=r['securityId']:raise ValueError('MASTER_IDENTITY_CONFLICT')
  if r['researchRouteStatus']=='P1_ROUTE_PRESERVED':
   if r['ticker'] not in PILOTS or not r['researchSectorRoute']:raise ValueError('PILOT_ROUTE_ONLY')
  elif r['researchRouteStatus']=='SECTOR_ROUTE_PENDING':
   if r['ticker'] in PILOTS or r['researchSectorRoute'] is not None:raise ValueError('EXPLICIT_ROUTE_DEFERRAL')
  else:raise ValueError('ROUTE_DISPOSITION')
 if len(p['reconciliation']['sectorRoutePending'])!=24:raise ValueError('EXACT_ROUTE_DEFERRALS')
 if any(p['reconciliation'][k] for k in ['added','removed','identityConflicts','sourceVerificationPending','pilotMembershipDiscrepancies']):raise ValueError('UNRESOLVED_CHANGE_NEEDS_NEW_PROPOSAL')
 return True

def verify():
 if subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()!=BASELINE:raise ValueError('HEAD_DRIFT')
 p=read(OUT/'proposed-vn30-universe.json');validate(p)
 for path,h in read(OUT/'baseline-snapshot.json')['files'].items():
  if sha(ROOT/path)!=h:raise ValueError('PROTECTED_BYTES_CHANGED:'+path)
 for file,h in p['sourceEvidence']['artifactHashes'].items():
  if sha(OUT/file)!=h:raise ValueError('PROPOSAL_EVIDENCE_HASH:'+file)
 receipts=read(OUT/'official-source-receipts.json')
 for s in receipts['captures']:
  if sha(ROOT/s['path'])!=s['sha256']:raise ValueError('OFFICIAL_CAPTURE_CHANGED')
  from urllib.parse import urlparse
  if urlparse(s['url']).scheme!='https' or urlparse(s['url']).hostname not in ('api.hsx.vn','staticfile.hsx.vn'):raise ValueError('UNAPPROVED_INDEX_SOURCE')
 rows=[]
 for i in (1,2,3):
  x=read(OUT/f'official-sources/history-page{i}.json');pg=x['data']['paging']
  if (pg['pageIndex'],pg['pageSize'],pg['totalCount'],pg['totalPages'])!=(i,1000,2948,3):raise ValueError('PAGINATION_INCOMPLETE')
  rows+=x['data']['list']
 if len(rows)!=2948 or len({r['id'] for r in rows})!=2948:raise ValueError('HISTORY_DUPLICATE_OR_GAP')
 if read(OUT/'official-sources/history-recheck-page1.json')['data']!=read(OUT/'official-sources/history-page1.json')['data']:raise ValueError('HISTORY_CHANGED_DURING_CAPTURE')
 prior=read(ROOT/'docs/fundamental-data-engine/evidence/2026-10-16-di-governance-closure/UNIVERSE_CHANGE_HISTORY.json')
 for s in prior['reviewedSourcePages']:
  if sha(ROOT/s['path'])!=s['sha256']:raise ValueError('PRIOR_HISTORY_CHANGED')
  rows+=read(ROOT/s['path'])['data']['list']
 if len(rows)!=14732 or len({r['id'] for r in rows})!=14732:raise ValueError('NONCONTIGUOUS_OR_OVERLAPPING_HISTORY')
 candidates=read(OUT/'history-verification.json')['reviewedCandidates']
 if len(candidates)!=13 or any(c['effectiveDate']<='2026-11-05' or '16/11/2026' not in c['summary'] for c in candidates):raise ValueError('NOTICE_NOT_FULLY_CLASSIFIED')
 for c in candidates:
  raw=read(OUT/f'official-sources/notice-{c["id"]}.json')['data']
  if raw['summary']!=c['summary'] or raw['title']!=c['title']:raise ValueError('NOTICE_REVIEW_DRIFT')
 runtime=read(OUT/'existing-master-snapshot.json');master={x['ticker']:x['securityId'] for x in runtime['UNIVERSE']['content']['identities']};sectors={x['ticker']:x['sector'] for x in runtime['REFERENCE_DATA']['content']['sectors']}
 for r in p['constituents']:
  if master.get(r['ticker'])!=r['securityId'] or sectors.get(r['ticker'])!=r['existingSector']:raise ValueError('MASTER_OR_SECTOR_MAPPING')
  if r['officialDocumentReference']['documentSha256']!=sha(OUT/'official-sources/july-composition.pdf'):raise ValueError('OFFICIAL_PDF_BINDING')
 p1=ROOT/'docs/fundamental-data-engine/dfr-05/p1-a46da9a8';m=read(p1/'manifest.json')
 for file,h in m['files'].items():
  if sha(p1/file)!=h:raise ValueError('P1_BASELINE_CHANGED')
 for file,h in m['implementation'].items():
  if sha(ROOT/file)!=h:raise ValueError('P1_CODE_CHANGED')
 complete=deferred=metrics=0
 for t in PILOTS:
  d=read(p1/f'issuers/{t}.json');metrics+=len(d['metrics']);complete+=sum(x['status']=='COMPLETED_RESEARCH' for x in d['rubrics']);deferred+=sum(x['status']=='NOT_RATED' for x in d['rubrics'])
 if (complete,deferred,metrics)!=(25,113,789):raise ValueError('P1_COUNTS_CHANGED')
 return dict(status='PASS',verifiedConstituents=30,pilotsVerified=6,canonicalContentHash=p['contentHash'],sourceRowsVerified=14732,protectedFilesVerified=len(read(OUT/'baseline-snapshot.json')['files']),p1Untouched=True,newIssuerFinancialProcessing=0,newAssessments=0,processingGate='CLOSED_PENDING_EXPLICIT_OWNER_AUTHORITY')

def self_test():
 p=read(OUT/'proposed-vn30-universe.json');count=0
 def rejected(mutator):
  nonlocal count
  q=deepcopy(p);mutator(q);q['contentHash']=content_hash(q)
  try:validate(q)
  except ValueError:count+=1;return
  raise AssertionError('INVALID_PROPOSAL_ACCEPTED')
 rejected(lambda q:q['constituents'].pop())
 rejected(lambda q:q['constituents'][1].update(ticker=q['constituents'][0]['ticker']))
 rejected(lambda q:q['constituents'][1].update(securityId=q['constituents'][0]['securityId']))
 rejected(lambda q:q['constituents'][0].update(membershipEffectiveFrom='2026-11-16'))
 rejected(lambda q:q['constituents'][0].update(verificationStatus='SOURCE_VERIFICATION_PENDING'))
 rejected(lambda q:q['processingAuthorization'].update(p2IssuerProcessing=True))
 rejected(lambda q:q['ownerApproval'].update(status='APPROVED'))
 rejected(lambda q:q['constituents'][0].update(financialProcessingAuthorized=True))
 rejected(lambda q:q.update(researchReferenceDate='2026-11-16'))
 q=deepcopy(p);q['contentHash']='0'*64
 try:validate(q)
 except ValueError:count+=1
 else:raise AssertionError('BAD_HASH_ACCEPTED')
 q=deepcopy(p);q['ownerApproval']['status']='APPROVED'
 if can_process(q):raise AssertionError('UNIVERSE_APPROVAL_IS_NOT_PROCESSING_AUTHORITY')
 count+=1
 return dict(status='PASS',adversarialChecks=count)
if __name__=='__main__':print(json.dumps(dict(verification=verify(),adversarial=self_test()),ensure_ascii=False,indent=2))
