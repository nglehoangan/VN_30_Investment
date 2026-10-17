"""Replay the pinned official universe into a new review folder; old bytes stay frozen."""
import pathlib,sys,json,hashlib
O=pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-17-data-initialization-final-acceptance/official-universe-replay');O.mkdir(exist_ok=True)
sys.path.insert(0,str(pathlib.Path('scripts').resolve()))
s=pathlib.Path('scripts/review-di-official-universe.py').read_text()
s=s.replace("def write(n,d):(O/(n+'.json')).write_text", "def write(n,d):(REPLAY_OUT/(n+'.json')).write_text")
exec(compile(s,'scripts/review-di-official-universe.py','exec'),{'REPLAY_OUT':O,'__name__':'__main__'})
f=json.loads((O/'OFFICIAL_VN30_UNIVERSE_REVIEW.json').read_text());assert f['status']=='CERTIFIED' and f['uniqueCount']==30 and not f['researchUniverseDifference']['entering'] and not f['researchUniverseDifference']['exiting']
print('PASS pinned official universe certification replay; no live date extension or production write')
