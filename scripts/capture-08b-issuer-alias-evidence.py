"""Retain exact public primary-source alias bytes; failed access never grants identity authority."""
import json,pathlib,subprocess,hashlib,datetime,concurrent.futures,re,unicodedata
B=pathlib.Path('data/initialization-08b-remediation-work');O=B/'identity-alias-source';O.mkdir(exist_ok=True,mode=0o700);p=json.loads((B/'issuer-name-alias-evidence.json').read_text())
def fold(s):return re.sub('[^a-z0-9]','', ''.join(c for c in unicodedata.normalize('NFD',s).lower() if unicodedata.category(c)!='Mn').replace('đ','d'))
def capture(a):
 key=hashlib.sha256(a['source'].encode()).hexdigest()[:16];f=O/(key+'.body');r=subprocess.run(['curl','--location','--silent','--show-error','--max-time','30','--max-filesize','64000000','--output',str(f),'--write-out','%{http_code}',a['source']],capture_output=True,timeout=35);body=f.read_bytes() if f.exists() else b'';code=int(r.stdout.decode() or '0');text=body.decode(errors='replace')
 if body.startswith(b'%PDF-'):
  try:
   import pymupdf;text=' '.join(page.get_text() for page in pymupdf.open(f))
  except Exception:text=''
 return {**a,'sourceReceipt':{'httpStatus':code,'curlExit':r.returncode,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bodySha256':hashlib.sha256(body).hexdigest(),'file':str(f),'bytes':len(body),'exactNameInPublicBody':fold(a['exactName']) in fold(text),'tickerInPublicBody':a['ticker'].lower() in text.lower()},'sourceEvidenceStatus':'RETAINED_PUBLIC_PRIMARY_BYTES' if r.returncode==0 and 200<=code<300 and fold(a['exactName']) in fold(text) else 'EXCEPTION_PUBLIC_BYTES_OR_EXACT_ALIAS_UNVERIFIED'}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(capture,p['aliases']))
p['aliases']=rows;(B/'issuer-name-alias-source-results.json').write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n');print(json.dumps([(a['ticker'],a['sourceEvidenceStatus']) for a in rows]))
