"""Qualify a successor reference-data release, never alter old receipts/authority."""
from pathlib import Path
import json,hashlib,re,sys
from datetime import datetime,timezone
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent;D=R/'docs/fundamental-data-engine';S=O/'sources';read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();rel=lambda p:str(p.relative_to(R))
def pin(p):return {'path':rel(p),'sha256':sha(p)}
def write(n,x):(O/n).write_text(json.dumps(x,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
base=D/'standing-authority-version/2026-11-12';old=D/'evidence/2026-10-16-di-governance-closure';oldreview=read(old/'OFFICIAL_VN30_UNIVERSE_REVIEW.json');oldhist=read(old/'UNIVERSE_CHANGE_HISTORY.json');receipt=read(S/'CAPTURE_RECEIPTS.json');pages=receipt['receipts']
assert oldreview['status']=='CERTIFIED' and oldreview['historyComplete'] and oldhist['complete'] and oldhist['interval']['end']=='2026-10-16'
assert len(pages)==pages[0]['paging']['totalPages'] and [p['paging']['pageIndex'] for p in pages]==list(range(1,len(pages)+1))
rows=[]
for p in pages:
 f=R/p['path'];assert sha(f)==p['sha256'] and p['httpStatus']==200
 x=read(f)['data'];assert x['paging']==p['paging'];rows.extend(x['list'])
assert len(rows)==len({r['id'] for r in rows})==receipt['records']==pages[0]['paging']['totalCount']
alias=read(S/'alias-crosscheck.json')['data'];assert alias['paging']['totalCount']==len(rows) and [r['id'] for r in alias['list']]==[r['id'] for r in rows[:10]]
expected=[r for r in rows if re.search(r'chỉ số|thành phần|VN30|HOSE.Index',r.get('title',''),re.I) and (r['title'].startswith('HOSE') or re.search('thành phần.*chỉ số|thay đổi.*chỉ số|chỉ số.*thay đổi',r['title'],re.I))]
candidates=read(O/'NOTICE_CANDIDATES.json');assert {r['id'] for r in candidates}=={r['id'] for r in expected}
detailreceipts=read(S/'DETAIL_RECEIPTS.json');reviews=[]
for r in candidates:
 p=S/f'notice-{r["id"]}.json';rp=next(x for x in detailreceipts if x['path']==rel(p));assert sha(p)==rp['sha256']
 q=read(p)['data'];assert q['id']==r['id'] and q['title']==r['title'];text=q['summary'];assert '16/11/2026' in text
 reviews.append({'id':r['id'],'title':r['title'],'detail':pin(p),'summaryPointer':'/data/summary','effectiveDate':'2026-11-16','assessment':'FUTURE_EFFECTIVE_NO_CHANGE_BY_REVIEW_CUTOFF','reason':'Official notice explicitly effective16Nov, not30Oct or15Nov. Other indices not confused with VN30; possible scale-family update not applied early.'})
extra=[r for r in rows if r['id'] not in {x['id'] for x in candidates} and r['title'].startswith('HOSE') and re.search('VN30|chỉ số|thành phần',r['title']+' '+str(r.get('summary','')),re.I)]
assert all('Điểm tin giao dịch' in r['title'] for r in extra)
# Fail closed on a new unclassified official index/summary candidate, not a convenient title whitelist.
write('EVENT_REVIEW.json',{'newOfficialQueryInterval':['2026-10-17','2026-11-15'],'pagingComplete':True,'records':len(rows),'uniqueRecords':len({r['id'] for r in rows}),'pages':len(pages),'receipt':pin(S/'CAPTURE_RECEIPTS.json'),'sameOfficialAliasQueryVerified':pin(S/'alias-crosscheck.json'),'noticeReviews':reviews,'additionalOfficialSummaryMatches':[{'id':r['id'],'title':r['title'],'classification':'DAILY_TRADING_STATISTICS_NOT_CONSTITUENT_DIRECTIVE'} for r in extra],'unclassifiedCandidates':[],'confirmedChangesEffectiveThroughReviewDate':[],'priorReview':pin(old/'OFFICIAL_VN30_UNIVERSE_REVIEW.json'),'priorHistory':pin(old/'UNIVERSE_CHANGE_HISTORY.json'),'combinedCoverage':['2026-08-03','2026-11-15'],'meaning':'Complete visible official publication query plus prior certified history and original main30 table. Not a guarantee against future retroactive publication; no historical PIT availability asserted.'})
review={**oldreview,'asOf':'2026-11-15','authority':'ORIGINAL_HOSE_COMPOSITION_PLUS_RECONCILED_DATED_OFFICIAL_HISTORY_SUCCESSOR','subsequentHistory':rel(O/'EVENT_REVIEW.json'),'priorCertifiedReference':pin(old/'OFFICIAL_VN30_UNIVERSE_REVIEW.json'),'reviewedAtSource':'RUN_CONTEXT.json','postEffectiveConstituentChangeFound':False,'historyComplete':True,'unclassifiedNotices':[],'limitations':['Coverage ends15Nov;16Nov notices not applied early. Later retrospective source knowledge is current-purpose only, not historical PIT.'],'productionRegistryChanged':False,'DI14Approved':False,'readyForScoring':False,'decisionReady':False}
write('OFFICIAL_VN30_UNIVERSE_REVIEW.json',review)
oldprofile=read(base/'REAL_MARKET_PROFILE.json');oldidentity=read(R/oldprofile['membership']['identitySource']['path']);assert len(oldidentity['effectiveMembers'])==30
identity={**oldidentity,'asOf':'2026-11-15','predecessor':oldprofile['membership']['identitySource'],'membershipCoverageEvidence':pin(O/'OFFICIAL_VN30_UNIVERSE_REVIEW.json'),'scope':'Existing immutable security identities reused; no security remapping or economic boundary invented.'}
write('VN30_IDENTITY_RECONCILIATION.json',identity)
if not (O/'RUN_CONTEXT.json').exists():write('RUN_CONTEXT.json',{'knownAt':datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'economicCutoff':'2026-10-30','reviewCoverageEnd':'2026-11-15','meaning':'Actual review operational time frozen for replay; no original-publication timestamp invented.'})
at=read(O/'RUN_CONTEXT.json')['knownAt']
profile=oldprofile;profile['knownAt']=at;profile['membership']={**profile['membership'],**pin(O/'OFFICIAL_VN30_UNIVERSE_REVIEW.json'),'identitySource':pin(O/'VN30_IDENTITY_RECONCILIATION.json'),'through':'2026-11-15','knownAt':at};profile['calendar']['evidence']={**profile['calendar']['evidence'],'knownAt':at,'effectiveAt':at}
assert {m['ticker'] for m in profile['membership']['members']}==set(review['composition'])
write('MARKET_PROFILE.json',profile)
bindings=read(base/'TRUSTED_SOURCE_INPUTS.json');bindings['marketReferences']={**bindings['marketReferences'],'membership':pin(O/'OFFICIAL_VN30_UNIVERSE_REVIEW.json'),'identities':pin(O/'VN30_IDENTITY_RECONCILIATION.json')}
write('TRUSTED_SOURCE_INPUTS_SUCCESSOR.json',bindings)
write('REFERENCE_HANDOFF.json',{'kind':'CONTROLLED_REFERENCE_DATA_UPDATE_NOT_SOURCE_AUTHORITY_CHANGE','requestScope':'Owner instruction to verify and complete MembershipF1','predecessorTrustedReferences':pin(base/'TRUSTED_SOURCE_INPUTS.json'),'newMembership':pin(O/'OFFICIAL_VN30_UNIVERSE_REVIEW.json'),'newIdentityReconciliation':pin(O/'VN30_IDENTITY_RECONCILIATION.json'),'standingAuthorityUnchanged':pin(base/'VERSIONED_SOURCE_REGISTRY.json'),'adapterCodeChanged':False,'perMaterialReceiptCreated':False,'liveHostActivated':False,'meaning':'Trusted host composition may use these verified reference pins; request JSON cannot enroll arbitrary references. No provider-policy expansion or production activation.'})
print('Qualified successor reference coverage03Aug–15Nov; no authority/code changes')
