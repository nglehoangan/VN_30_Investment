from pathlib import Path
import json,urllib.request,urllib.error,hashlib,datetime,concurrent.futures,sys,subprocess,re,email.parser
P=Path(__file__).resolve().parent;assert not (P/'ARTIFACT_HASHES.json').exists();targets=json.loads(Path(sys.argv[1]).read_text());inventory=P/'HTTP_REQUEST_INVENTORY.json';prior=json.loads(inventory.read_text()) if inventory.exists() else [];seen={r['requestedURL'] for r in prior if r['state']!='NETWORK_OR_CAPTURE_ERROR'};targets=[r for r in targets if r['url'] not in seen]
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
def get(t):
 url=t['url'];started=now();rid=hashlib.sha256(url.encode()).hexdigest()[:20];row={'requestId':rid,'ticker':t['ticker'],'purpose':t.get('purpose'),'requestedURL':url,'startedAt':started,'method':'GET','authentication':'NONE','sourceAuthorityClaim':t.get('authorityBasis'),'publicationTimestampInferredFromHTTPHeaders':False}
 try:
  folder=P/'captures'/t['ticker'];folder.mkdir(parents=True,exist_ok=True);temporary=folder/(rid+'.part');headers=folder/(rid+'.headers.part')
  result=subprocess.run(['curl','--location','--max-redirs','5','--max-time','30','--max-filesize','100000000','--silent','--show-error','--user-agent','VN30-PE1-public-disclosure-research/1.0','--dump-header',str(headers),'--output',str(temporary),'--write-out','%{json}',urllib.parse.quote(url,safe=':/?=&%+;,@!$()[]#')],capture_output=True,text=True)
  info=json.loads(result.stdout) if result.stdout else {};row['curlExitCode']=result.returncode
  if result.returncode!=0:raise RuntimeError('curl '+str(result.returncode)+': '+result.stderr.strip()[:200])
  status=info.get('http_code');last=re.split(r'HTTP/[^\r\n]+\r?\n',headers.read_text(errors='replace'))[-1];parsed=email.parser.Parser().parsestr(last)
  row.update(httpStatus=status,finalURL=info.get('url_effective'),headers={k:v for k,v in parsed.items() if k.lower() in ['content-type','content-length','date','last-modified','etag','location','content-disposition','cache-control']},tlsVerificationDisabled=False)
  data=temporary.read_bytes();typ=info.get('content_type','') or ''
  ext='.pdf' if data.startswith(b'%PDF-') else '.json' if 'json' in typ else '.html' if 'html' in typ or b'<html' in data[:1000].lower() else '.bin';folder=P/'captures'/t['ticker'];folder.mkdir(parents=True,exist_ok=True);path=folder/(rid+ext);path.write_bytes(data);row.update(retrievedAt=now(),bodyPath=str(path.relative_to(Path.cwd())),bodySha256=hashlib.sha256(data).hexdigest(),bytes=len(data),state='CAPTURED' if status==200 else 'HTTP_ACCESS_RESTRICTED' if status in [401,403] else 'HTTP_ERROR')
 except Exception as e:row.update(retrievedAt=now(),state='NETWORK_OR_CAPTURE_ERROR',error=type(e).__name__+': '+str(e)[:250])
 finally:
  for suffix in ['.part','.headers.part']:
   partial=P/'captures'/t['ticker']/(rid+suffix)
   if partial.exists():partial.unlink()
 return row
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
 for row in ex.map(get,targets):
  prior.append(row);inventory.write_text(json.dumps(prior,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:row.get(k) for k in ['ticker','httpStatus','state','requestedURL','bytes']}),flush=True)
