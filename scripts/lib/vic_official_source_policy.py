"""Owner's VIC-only research exception. Historical Vietstock policy is unchanged."""
from urllib.parse import urlsplit, urljoin
import subprocess

HOSTS=frozenset({'www.sec.gov','sec.gov','ir.vinfastauto.us','vinfastauto.us','vinfastauto.com','static-cms-prod.vinfastauto.com'})


def require_official_vic_url(url):
    p=urlsplit(url)
    if p.scheme!='https' or p.hostname not in HOSTS or p.username or p.password or p.port not in (None,443) or p.fragment:
        raise ValueError('VIC_OFFICIAL_RESEARCH_SCOPE_ONLY')
    if p.hostname in ['www.sec.gov','sec.gov'] and (not p.path.startswith('/Archives/edgar/data/1913510/') or '%' in p.path or '..' in p.path.split('/') or p.query):
        raise ValueError('VINFAST_EDGAR_CIK_BINDING_REQUIRED')
    return url


def download(url,path):
    redirects=[]
    for _ in range(4):
        require_official_vic_url(url)
        r=subprocess.run(['curl','--silent','--show-error','--proto','=https','--max-time','55',
            '--max-filesize','100000000','--user-agent','VN30-VIC-research/1.0',
            '--output',str(path),'--write-out','%{http_code}\n%{redirect_url}',url],capture_output=True,text=True,timeout=60)
        status,_,target=r.stdout.partition('\n')
        if not status.startswith('3'):
            return dict(httpStatus=status,returncode=r.returncode,finalUrl=url,redirects=redirects,error=r.stderr)
        if not target:raise ValueError('REDIRECT_LOCATION_REQUIRED')
        following=require_official_vic_url(urljoin(url,target.strip()))
        redirects.append(dict(fromUrl=url,toUrl=following,httpStatus=status));url=following
    raise ValueError('OFFICIAL_REDIRECT_LIMIT')
