"""Public Vietstock listing requests only; temporary anonymous cookies never persisted."""
import argparse,concurrent.futures,datetime,hashlib,json,re,subprocess,tempfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode
from lib.vietstock_source_policy import require_vietstock_url
OUT=Path('data/manual-extracted-api/vietstock-documents-v1/20261102-remediation')
class Token(HTMLParser):
 def __init__(self):super().__init__();self.value=None
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='input' and a.get('name')=='__RequestVerificationToken' and self.value is None:self.value=a.get('value')
def capture(ticker):
 OUT.mkdir(parents=True,exist_ok=True);records=[]
 url=require_vietstock_url(f'https://finance.vietstock.vn/{ticker.lower()}/tai-tai-lieu.htm')
 with tempfile.TemporaryDirectory(prefix='vn30-public-document-session-') as temp:
  jar=str(Path(temp)/'cookies');base=['curl','--silent','--show-error','--fail','--max-time','35','--proto','=https','-A','Mozilla/5.0']
  page=subprocess.run(base+['-c',jar,url],capture_output=True,text=True,timeout=40)
  if page.returncode:return dict(ticker=ticker,status='DISCOVERY_FAILED',error=page.stderr[:160])
  parser=Token();parser.feed(page.stdout)
  for pn in range(1,21):
   params={'code':ticker,'year':'2026','page':str(pn)}
   if parser.value:params['__RequestVerificationToken']=parser.value
   endpoint=require_vietstock_url('https://finance.vietstock.vn/data/getdocument')
   response=subprocess.run(base+['-b',jar,'-e',url,'-H','X-Requested-With: XMLHttpRequest','--data',urlencode(params),endpoint],capture_output=True,text=True,timeout=40)
   try:body=json.loads(response.stdout)
   except json.JSONDecodeError:records.append(dict(page=pn,status='FAILED_NOT_JSON',curlStatus=response.returncode));break
   path=OUT/f'{ticker}-2026-page-{pn}.json';encoded=json.dumps(body,ensure_ascii=False,indent=2)+'\n'
   if path.exists() and path.read_text()!=encoded:path=path.with_name(path.stem+'-'+hashlib.sha256(encoded.encode()).hexdigest()[:12]+'.json')
   path.write_text(encoded)
   records.append(dict(page=pn,status='CAPTURED',path=str(path),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),request={'url':endpoint,'code':ticker,'year':'2026','page':pn},rowCount=len(body) if isinstance(body,list) else None))
   if isinstance(body,list) and (len(body)<20 or (body and pn*20>=body[0].get('TotalRow',400))):break
 return dict(ticker=ticker,status='CAPTURED',requests=records)
def main():
 p=argparse.ArgumentParser();p.add_argument('tickers',nargs='+');args=p.parse_args()
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(capture,args.tickers))
 manifest=OUT/('manifest-'+('-'.join(args.tickers) if len(args.tickers)<4 else 'universe')+'.json');manifest.write_text(json.dumps({'contract':'vietstock-public-document-discovery-v1','rows':rows,'productionAdmissible':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'manifest':str(manifest),'tickers':len(rows),'captured':sum(x['status']=='CAPTURED' for x in rows)}))
if __name__=='__main__':main()
