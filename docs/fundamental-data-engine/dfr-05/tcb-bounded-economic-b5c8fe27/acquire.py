"""One bounded approved-source collection; exact source URLs chosen from official search links."""
import subprocess,json,hashlib,datetime,concurrent.futures
from pathlib import Path
OUT=Path(__file__).resolve().parent
SOURCES=[('KE-S1','hnx-dec2025','https://portal.hnx.vn/vi-vn/chi-tiet-tin-60022163-0.html','html'),('KE-S2','damodaran-jan2026-table','https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/ctryprem.html','html'),('KE-S2','damodaran-countryrisk-method','https://pages.stern.nyu.edu/~adamodar/pdfiles/blog/CountryRisk2025.pdf','pdf')]
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def get(s):
 cls,id,url,ext=s;body=OUT/'sources'/(id+'.'+ext);headers=OUT/'sources'/(id+'.headers.txt');start=now()
 r=subprocess.run(['/usr/bin/curl','--silent','--show-error','--proto','=https','--max-redirs','0','--connect-timeout','10','--max-time','30','--dump-header',str(headers),'--output',str(body),'--write-out','%{http_code}\n%{url_effective}\n%{content_type}',url],capture_output=True,text=True)
 status=r.stdout.splitlines();ok=r.returncode==0 and status and status[0]=='200'
 return dict(sourceClass=cls,id=id,url=url,startedAt=start,retrievedAt=now(),curlExitCode=r.returncode,httpStatus=status[0] if status else None,effectiveUrl=status[1] if len(status)>1 else None,contentType=status[2] if len(status)>2 else None,path=str(body.relative_to(OUT)) if body.exists() else None,sha256=hashlib.sha256(body.read_bytes()).hexdigest() if body.exists() else None,headerPath=str(headers.relative_to(OUT)) if headers.exists() else None,stderr=r.stderr,outcome='CAPTURED_NOT_YET_QUALIFIED' if ok else 'FAILED_STOP_NO_FALLBACK',redirectsFollowed=False,publicationAt=None,observationAt=None,nativeUnit=None)
if __name__=='__main__':
 if (OUT/'source-acquisition.json').exists():raise SystemExit('BOUNDED_ACQUISITION_ALREADY_RECORDED')
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:records=list(pool.map(get,SOURCES))
 result=dict(cycleCount=1,providerCount=2,selectedProviders=['HNX','Aswath Damodaran/NYU Stern'],requestedObjects=3,ERPInputTables=1,ERPMethodDocuments=1,otherIssuerSources=0,records=records,stop='No alternate providers or additional datasets after unavailable/incompatible evidence. No data/financial PDF writes.')
 (OUT/'source-acquisition.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(result))
