"""Public profile share references; provisional-rights warning is preserved, not admitted as issued common shares."""
import concurrent.futures,datetime,hashlib,html,json,re,sys
from pathlib import Path
from lib.vietstock_source_policy import download_vietstock,require_vietstock_url
BASE=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4');BASE.mkdir(exist_ok=True)
TICKERS=[r['ticker'] for r in json.loads(Path('docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json').read_text())['partition']['members']]
AT=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
OUT=Path('data/manual-extracted-api/vietstock-profile-v1')/AT;OUT.mkdir(parents=True,exist_ok=False)
def fetch(ticker):
 listing_url=require_vietstock_url('https://finance.vietstock.vn/'+ticker.lower()+'/tai-tai-lieu.htm?doctype=1')
 listing=OUT/(ticker+'-discovery.html');result=download_vietstock(listing_url,listing)
 if result.returncode or result.stdout!='200':return dict(ticker=ticker,url=listing_url,status='FAILED_DISCOVERY',httpStatus=result.stdout)
 candidates=list(dict.fromkeys(re.findall(r'(?:https://finance.vietstock.vn)?/'+ticker+r'-[^\s"<>]+',listing.read_text())))
 if len(candidates)!=1:return dict(ticker=ticker,url=listing_url,status='AMBIGUOUS_PROFILE_ROUTE',candidateCount=len(candidates))
 url=require_vietstock_url(candidates[0] if candidates[0].startswith('https:') else 'https://finance.vietstock.vn'+candidates[0]);target=OUT/(ticker+'.html');part=target.with_suffix('.part')
 r=download_vietstock(url,part);receipt=dict(ticker=ticker,url=url,retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),httpStatus=r.stdout,status='FAILED')
 if r.returncode or r.stdout!='200':
  receipt['error']=r.stderr[:200];part.unlink(missing_ok=True);return receipt
 part.replace(target);raw=target.read_bytes();s=html.unescape(raw.decode('utf8'));receipt.update(status='CAPTURED',rawPath=str(target),sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw))
 fields=[]
 for box in re.findall(r'<div class=overview-profile__listing-box>(.*?)</div>',s,re.S):
  label=re.search(r'<span class=overview-profile__listing-label>(.*?)</span>',box,re.S);value=re.search(r'<span class=overview-profile__listing-value>(.*?)</span>',box,re.S)
  if not label or not value:continue
  clean=lambda x:re.sub(r'\s+',' ',re.sub('<[^>]+>',' ',x)).strip()
  l,v=clean(label[1]),clean(value[1]);warning=re.findall(r'data-tippy-content="([^"]+)"',label[1]);fields.append(dict(label=l,lexicalValue=v,value=v.replace(',','') if re.fullmatch(r'\d{1,3}(?:,\d{3})*|\d+',v) else None,notes=warning))
 receipt['discovery']={'url':listing_url,'rawPath':str(listing),'sha256':hashlib.sha256(listing.read_bytes()).hexdigest()};receipt['fields']=fields;receipt['qualification']='PUBLIC_PROFILE_REFERENCE_NOT_ISSUER_CONFIRMED_ACTION_BRIDGE';receipt['productionScoringAuthorized']=False
 return receipt
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(fetch,TICKERS))
manifest=dict(contract='vietstock-public-profile-capture-v1',retrievedAt=AT,rows=rows,warning='Outstanding includes provisional shares from corporate rights according to provider tooltip. Never treat listingQtty, weighted averages and this reference as interchangeable.',productionScoringAuthorized=False)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(BASE/'profile-capture-reference.json').write_text(json.dumps(dict(path=str(OUT/'manifest.json'),sha256=hashlib.sha256((OUT/'manifest.json').read_bytes()).hexdigest()),indent=2)+'\n')
print(json.dumps(dict(manifest=str(OUT/'manifest.json'),captured=sum(r['status']=='CAPTURED' for r in rows),failed=[r['ticker'] for r in rows if r['status']!='CAPTURED'])))
