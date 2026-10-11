"""Use MB's public form token exactly as its anonymous financial controller does."""
import datetime,hashlib,html,json,pathlib,re,subprocess,tempfile
B=pathlib.Path('data/initialization-08b-remediation-work/targeted-indexes')
base='https://www.mbbank.com.vn'
with tempfile.TemporaryDirectory(prefix='vn30-mbb-public-session-') as session:
 cookie=pathlib.Path(session)/'anonymous-cookies.txt'
 def capture(name,path,token=None):
  file=B/(name+'.body')
  if file.exists():raise ValueError('RETAINED_RECEIPT_MUST_NOT_BE_OVERWRITTEN')
  args=['curl','--cacert','/etc/ssl/cert.pem','--max-time','30','-sS','-b',str(cookie),'-c',str(cookie)]
  if token:args+=['-H','MB-XSRF-Token-FormOnline: '+token,'-H','Content-Type: application/x-www-form-urlencoded']
  r=subprocess.run(args+['-o',str(file),'-w','%{http_code}',base+path],capture_output=True,text=True)
  body=file.read_bytes() if file.exists() else b''
  file.with_suffix('.json').write_text(json.dumps({'url':base+path,'contractSource':'MBB-public-finance-client.body; global controller subdomain empty','httpStatus':r.stdout,'curlExit':r.returncode,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bodySha256':hashlib.sha256(body).hexdigest(),'anonymousSessionUsed':True,'issuerPublicFormTokenUsed':bool(token),'loginUsed':False,'captchaOrAccessControlBypassed':False},indent=2)+'\n')
  if r.returncode or r.stdout!='200':raise ValueError('PUBLIC_GET_EXCEPTION_NO_CHALLENGE_BYPASS')
  return body.decode('utf-8-sig')
 # The first receipt was retained before a local decoder-name error; preserve it.
 text=capture('MBB-public-financial-session-page-second-read','/Investor/bao-cao-tai-chinh/0/0//documents')
 tag=next(t for t in re.findall(r'<input\b[^>]+>',text) if 'name="__RequestVerificationToken"' in t)
 token=html.unescape(re.search(r'value="([^"]+)"',tag)[1])
 categories=json.loads(capture('MBB-public-financial-session-categories','/api/GetAttachmentCategoryFinal',token))
 print(json.dumps({'categories':categories},ensure_ascii=False)[:2000])
 reports=json.loads(capture('MBB-public-financial-session-list','/api/GetListFinance/0/1/0',token))
 print(json.dumps({'reports':reports},ensure_ascii=False)[:6000])
