"""Finite public VPBank VAS reporting-cycle list via the issuer's own GET contract."""
import datetime,hashlib,json,pathlib,subprocess,urllib.parse
B=pathlib.Path('data/initialization-08b-remediation-work/targeted-indexes')
def capture(name,endpoint,params,parent):
 url='https://www.vpbank.com.vn/uiux-api/api/'+endpoint+'?'+urllib.parse.urlencode(params)
 file=B/(name+'.body')
 if file.exists():raise ValueError('RETAINED_RECEIPT_MUST_NOT_BE_OVERWRITTEN')
 result=subprocess.run(['curl','--cacert','/etc/ssl/cert.pem','--max-time','30','-sS','-o',str(file),'-w','%{http_code}',url],capture_output=True,text=True)
 receipt={'url':url,'contractSource':'VPB-public-document-dependency-8.js module73835 x/w; client2 module17761; dependency7 baseURL /','observedParametersFrom':parent,'httpStatus':result.stdout,'curlExit':result.returncode,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bodySha256':hashlib.sha256(file.read_bytes()).hexdigest()}
 file.with_suffix('.json').write_text(json.dumps(receipt,indent=2)+'\n')
 if result.returncode or result.stdout!='200':raise ValueError('PUBLIC_GET_EXCEPTION')
 return json.loads(file.read_text())
root=json.loads((B/'VPB-public-category-root.body').read_text())
vas=next(c for c in root if c['title']=='VAS')
years=capture('VPB-public-category-vas','category/children',{'lang':'vi','path':vas['path']},'VPB-public-category-root.body')
year=next(c for c in years if c['title']=='2026')
reports=capture('VPB-public-financial-2026','document',{'lang':'vi','categoryPath':year['path'],'pageSize':4,'pageIndex':1},'VPB-public-category-vas.body')
print(json.dumps({'years':len(years),'totalReports':reports.get('total'),'firstPage':reports},ensure_ascii=False)[:6000])
