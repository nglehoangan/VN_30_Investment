from pathlib import Path
from datetime import datetime,timezone
import json,subprocess,hashlib,concurrent.futures
O=Path(__file__).resolve().parent;S=O/'sources';rows=json.loads((O/'NOTICE_CANDIDATES.json').read_text())
def get(r):
 p=S/f'notice-{r["id"]}.json';url=f'https://api.hsx.vn/n/api/v1/1/news/{r["id"]}';at=datetime.now(timezone.utc).isoformat()
 if p.exists():raise RuntimeError('RECEIPT_ALREADY_EXISTS')
 subprocess.run(['curl','--silent','--show-error','--fail','--max-time','45',url,'--output',str(p)],check=True);x=json.loads(p.read_text());assert x['success']
 return {'url':url,'path':str(p.relative_to(Path.cwd())),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'retrievedAt':at,'httpStatus':200}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:receipts=list(pool.map(get,rows))
(S/'DETAIL_RECEIPTS.json').write_text(json.dumps(receipts,ensure_ascii=False,indent=2)+'\n')
for r in rows:
 x=json.loads((S/f'notice-{r["id"]}.json').read_text());print(r['id'],str(x.get('data'))[:1200])
