"""Finite issuer metadata recovery for the already observed ACB H1/2026 CAR filing."""
import datetime,hashlib,json,pathlib,subprocess,urllib.parse
B=pathlib.Path('data/initialization-08b-remediation-work');T=B/'targeted-indexes'
app=T/'ACB-required-history-app.js';text=app.read_text()
assert '"/categories"' in text and '"search[parent_id:is]"' in text and 'getPostByParams' in text
def capture(name,endpoint,params):
 url='https://acb.com.vn/api/front/v1/'+endpoint+'?'+urllib.parse.urlencode(params)
 body=T/(name+'.body')
 assert not body.exists(), 'Immutable capture already exists'
 clock=datetime.datetime.now(datetime.timezone.utc).isoformat()
 result=subprocess.run(['curl','--cacert','/etc/ssl/cert.pem','--fail-with-body','--max-time','45','--max-filesize','1000000','--silent','--show-error','--output',str(body),'--write-out','%{http_code}',url],capture_output=True,text=True,timeout=50)
 assert result.returncode==0 and result.stdout=='200'
 receipt={'url':url,'httpStatus':200,'curlExit':result.returncode,'retrievedAt':clock,'receivedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bodyFile':str(body),'bodySha256':hashlib.sha256(body.read_bytes()).hexdigest(),'sourceFile':str(T/'ACB-required-current-bank-disclosures.body'),'contractFile':str(app),'contractSha256':hashlib.sha256(app.read_bytes()).hexdigest(),'method':'OWN_PUBLIC_ISSUER_CATEGORY_AND_POST_FRONTEND_CONTRACT'}
 (T/(name+'.json')).write_text(json.dumps(receipt,indent=2)+'\n')
 return json.loads(body.read_text())
if __name__=='__main__':
 categories=capture('ACB-required-capital-disclosure-categories','categories',{'limit':'all','search[parent_id:is]':'656'})
 for row in categories['data']:print(json.dumps({k:row.get(k) for k in ['id','parent_id','slug','name','title']},ensure_ascii=False))
