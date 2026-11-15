"""Read-only live-state/source audit. No database writes or source acquisition."""
from pathlib import Path
import json,hashlib,sqlite3,sys
O=Path(__file__).resolve().parent;R=O.parents[3];D=R/'docs/fundamental-data-engine'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(n,x):(O/n).write_text(json.dumps(x,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
def active():
 p=R/'data/vn30.sqlite';c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True);c.execute('pragma query_only=ON')
 tables=[r[0] for r in c.execute("select name from sqlite_master where type='table' order by name")]
 selected=[n for n in tables if any(s in n for s in ['fundamental_admission','snapshot','initialization','dataset','market_boundary','source_admission','analytical_artifact'])]
 counts={n:c.execute('select count(*) from "'+n+'"').fetchone()[0] for n in selected};c.close()
 return {'path':'data/vn30.sqlite','access':'SQLite mode=ro + query_only=ON','sha256':sha(p),'sidecars':{p.name:sha(p) for p in sorted((R/'data').glob('vn30.sqlite-*')) if p.is_file()},'counts':counts}
if sys.argv[1]=='before':
 write('ACTIVE_STATE_BEFORE.json',active())
 paths=[D/'evidence/2026-10-16-di-governance-closure/OFFICIAL_VN30_UNIVERSE_REVIEW.json',D/'evidence/2026-10-16-di-governance-closure/UNIVERSE_CHANGE_HISTORY.json',D/'evidence/2026-10-17-data-initialization-final-acceptance/official-universe-replay/OFFICIAL_VN30_UNIVERSE_REVIEW.json',D/'evidence/2026-10-17-data-initialization-final-acceptance/official-universe-replay/UNIVERSE_CHANGE_HISTORY.json',D/'evidence/2026-10-16-vn30-data-initialization-final-closure/VN30_UNIVERSE_RECONCILIATION.json',D/'unified-final-acceptance/2026-11-12/MARKET_PROFILE.json',D/'standing-authority-version/2026-11-12/REAL_MARKET_PROFILE.json']
 inspected=[]
 for p in paths:
  x=read(p);inspected.append({'path':str(p.relative_to(R)),'sha256':sha(p),'certifiedInterval':x.get('interval',x.get('membership',{})) if 'interval' in x else {k:x[k] for k in ['asOf','announcementDate','effectiveDate','status'] if k in x},'scope':'Retained official history/profile/reconciliation; review time not effective coverage.'})
 old=read(D/'unified-final-acceptance/2026-11-12/U2_MEMBERSHIP_COVERAGE.json')
 write('VNM_F1_MEMBERSHIP_RESOLUTION.json',{'status':'BLOCKING','ticker':'VNM','requestedCutoff':'2026-10-30','certifiedInterval':old['certifiedHistoryInterval'],'missingInterval':old['missingInterval'],'retainedEvidenceReviewed':inspected,'qualifiedTimelineExtendingThroughCutoffFound':False,'searchScope':'Retained official-universe reviews/history, reconciliation, Master and both standing market profiles. No claim of exhaustive universe of documents. No new acquisition.','excludedAlternatives':['TCBS market/benchmark captures are not qualified official constituent-change history; price presence is not membership.','A null effectiveTo or17Oct review date cannot extend16Oct coverage.'],'rule':'VN30_MASTER §5.4/§11/§12; cafef-standing.ts assertProfile VN30_MEMBERSHIP_OUTSIDE_VERIFIED_INTERVAL','authority':'VN30 reference-data steward under existing reference-data evidence rules; no renewed CaféF/F2 source approval','smallestRemainingAction':'Retain and qualify official constituent/change coverage for17–30Oct or an already qualified dated event timeline proving coverage through30Oct. Do not infer continuity or change cutoff.'})
 print('Recorded read-only before counts and bounded membership review')
else:
 after=active();before=read(O/'ACTIVE_STATE_BEFORE.json');assert before==after,'LIVE_STATE_CHANGED';write('ACTIVE_STATE_AFTER.json',after);print('Live database/counts/sidecars unchanged')
