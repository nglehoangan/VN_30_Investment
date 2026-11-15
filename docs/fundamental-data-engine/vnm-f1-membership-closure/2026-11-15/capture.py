"""Targeted official HOSE publication metadata, no financial-report downloads."""
from pathlib import Path
from datetime import datetime,timezone
import subprocess,json,hashlib,urllib.parse,concurrent.futures,re
O=Path(__file__).resolve().parent;S=O/'sources';S.mkdir(exist_ok=True)
def now():return datetime.now(timezone.utc).isoformat()
def fetch(page):
 url='https://api.hsx.vn/n/api/v1/1/news?'+urllib.parse.urlencode({'startDate':'2026-10-17','endDate':'2026-11-15','pageIndex':page,'pageSize':1000})
 p=S/f'official-history-page{page}.json'
 if p.exists():raise RuntimeError('IMMUTABLE_CAPTURE_EXISTS:'+str(p))
 at=now();subprocess.run(['curl','--silent','--show-error','--fail','--max-time','45',url,'--output',str(p)],check=True)
 x=json.loads(p.read_text());assert x['success'] is True
 return {'url':url,'path':str(p.relative_to(Path.cwd())),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'retrievedAt':at,'completedAt':now(),'httpStatus':200,'paging':x['data']['paging']}
first=fetch(1);n=first['paging']['totalPages']
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:receipts=[first]+list(pool.map(fetch,range(2,n+1)))
receipts.sort(key=lambda r:r['paging']['pageIndex']);records=[]
for receipt in receipts:
 x=json.loads((Path.cwd()/receipt['path']).read_text());assert x['data']['paging']['totalCount']==first['paging']['totalCount'];records+=x['data']['list']
assert len(records)==len({r['id'] for r in records})==first['paging']['totalCount']
candidates=[r for r in records if re.search(r'chỉ số|thành phần|VN30|HOSE.Index',r.get('title',''),re.I) and (r['title'].startswith('HOSE') or re.search('thành phần.*chỉ số|thay đổi.*chỉ số|chỉ số.*thay đổi',r['title'],re.I))]
(S/'CAPTURE_RECEIPTS.json').write_text(json.dumps({'intervalQuery':['2026-10-17','2026-11-15'],'receipts':receipts,'completePaging':True,'records':len(records),'uniqueIds':len({r['id'] for r in records}),'createdDateRangeRawEpoch':[min(r['createdDate'] for r in records),max(r['createdDate'] for r in records)],'timestampMeaning':'Official query date filter; raw createdDate epochs are not asserted historical availability/publication timestamps.'},ensure_ascii=False,indent=2)+'\n')
(O/'NOTICE_CANDIDATES.json').write_text(json.dumps(candidates,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'records':len(records),'pages':n,'candidates':[{'id':r['id'],'title':r['title']} for r in candidates]},ensure_ascii=False))
