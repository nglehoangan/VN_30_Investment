"""Exact registered issuer indexes for missing required historical windows, no recursive crawl."""
import json,pathlib,hashlib,subprocess,datetime,concurrent.futures,re,urllib.parse
B=pathlib.Path('data/initialization-08b-remediation-work');O=B/'targeted-indexes';O.mkdir(exist_ok=True,mode=0o700)
backlog=json.loads((B/'required-data-backlog.json').read_text());catalog=json.load(open('docs/fundamental-data-engine/issuer-sources.json'))['sources'];tickers={r['ticker'] for r in backlog['deduplicatedFinancialWindows']};sources={r['ticker']:r for r in catalog if r['ticker'] in tickers}
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def run(ticker):
 receipt=O/(ticker+'.json')
 if receipt.exists():return json.loads(receipt.read_text())
 source=sources[ticker];url=source['discoveryUrl'];file=O/(ticker+'.body');started=now()
 r=subprocess.run(['curl','--location','--silent','--show-error','--max-time','40','--max-filesize','8000000','--output',str(file),'--write-out','%{http_code}',url],capture_output=True,timeout=45)
 status=int(r.stdout.decode() or '0');raw=file.read_bytes() if file.exists() else b'';text=raw.decode(errors='replace');links=[]
 if r.returncode==0 and 200<=status<300:
  for href,label in re.findall(r'<a[^>]*href=[\"\x27]([^\"\x27]+)[\"\x27][^>]*>(.*?)</a>',text,re.S|re.I):
   joined=urllib.parse.urljoin(url,href.replace('&amp;','&'));caption=re.sub('<[^>]+>',' ',label);candidate=urllib.parse.unquote(joined)+' '+caption
   if re.search('202[234]',candidate) and re.search(r'\.pdf(?:\?|$)|báo cáo|bao.cao|financial|annual',candidate,re.I):links.append({'url':joined,'indexCaption':caption[:600],'purpose':'EXACT_REQUIRED_HISTORY_CANDIDATE_CONTENT_QUALIFICATION_REQUIRED'})
 result={'ticker':ticker,'url':url,'startedAt':started,'retrievedAt':now(),'httpStatus':status,'curlExit':r.returncode,'bodySha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'requiredMissingPeriods':sorted({row['periodEnd'] for row in backlog['deduplicatedFinancialWindows'] if row['ticker']==ticker and row['periodEnd']<'2025-01-01'}),'links':links,'status':'TARGETED_PUBLIC_INDEX_CAPTURED' if r.returncode==0 and 200<=status<300 else 'PUBLIC_INDEX_FETCH_EXCEPTION','doesNotProveExhaustiveAvailability':True}
 receipt.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n');return result
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for result in pool.map(run,sorted(tickers)):print(json.dumps({'ticker':result['ticker'],'status':result['status'],'historyLinks':len(result['links'])}),flush=True)
