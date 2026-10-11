"""Follow only the own frontend's Vietnamese 2026 financial-report category."""
import datetime,hashlib,json,pathlib,subprocess,urllib.parse
B=pathlib.Path('data/initialization-08b-remediation-work/targeted-indexes')
def capture(name,endpoint,params,parent):
 file=B/(name+'.body')
 if file.exists():raise ValueError('RETAINED_RECEIPT_MUST_NOT_BE_OVERWRITTEN')
 url='https://api.mwgshop.vn/gw/ir-api/api/'+endpoint+'?'+urllib.parse.urlencode(params)
 r=subprocess.run(['curl','--cacert','/etc/ssl/cert.pem','--max-time','30','-sS','-H','accept: text/plain','-o',str(file),'-w','%{http_code}',url],capture_output=True,text=True)
 file.with_suffix('.json').write_text(json.dumps({'url':url,'contractSource':'MWG-public-report-dependency-8.js modules23202/56488; dependency7 modules18346/21794/92331','observedParametersFrom':parent,'httpStatus':r.stdout,'curlExit':r.returncode,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bodySha256':hashlib.sha256(file.read_bytes()).hexdigest()},indent=2)+'\n')
 if r.returncode or r.stdout!='200':raise ValueError('PUBLIC_GET_EXCEPTION')
 data=json.loads(file.read_text());assert data['code']==0
 return data['data']
rootfile=B/'MWG-public-report-year-categories.body'
receipt=json.loads(rootfile.with_suffix('.json').read_text())
assert hashlib.sha256(rootfile.read_bytes()).hexdigest()==receipt['bodySha256'] and receipt['httpStatus']=='200'
root=json.loads(rootfile.read_text())['data']
for yearname in ['2022']:
 year=next(c for c in root if c['isActived'] and c['categoryName']==yearname)
 children=capture('MWG-public-report-'+yearname+'-categories','CategoryAPI',{'langID':'vi-VN','parentID':year['categoryID'],'pageIndex':1,'pageSize':50},rootfile.name)
 financial=next(c for c in children if c['isActived'] and c['categoryName']=='Báo cáo tài chính, quản trị, thường niên')
 reports=capture('MWG-public-financial-category-'+yearname,'PostAPI',{'langID':'vi-VN','categoryID':financial['categoryID'],'pageIndex':1,'pageSize':50,'condition':-1},'MWG-public-report-'+yearname+'-categories.body')
 print(json.dumps({'year':yearname,'reports':len(reports),'titles':[r['title'] for r in reports if r['isActived'] and not r['isDeleted']]},ensure_ascii=False))
