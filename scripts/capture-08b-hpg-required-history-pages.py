"""Follow only the observed second/final issuer year pages, no broad crawl."""
import argparse,datetime,hashlib,html,json,pathlib,re,subprocess
B=pathlib.Path('data/initialization-08b-remediation-work/targeted-indexes')
parser=argparse.ArgumentParser();parser.add_argument('--years',nargs='+',choices=['2022','2023','2024','2025'],default=['2022','2023','2024']);args=parser.parse_args()
for year in args.years:
 parent=B/('HPG-required-history-'+year+'.body');receipt=json.loads(parent.with_suffix('.json').read_text());assert hashlib.sha256(parent.read_bytes()).hexdigest()==receipt['bodySha256'] and receipt['httpStatus']=='200'
 links=set(html.unescape(u) for u in re.findall(r'href="([^"]+)"',parent.read_text()) if 'page=' in u)
 expected='https://www.hoaphat.com.vn/quan-he-co-dong/bao-cao-tai-chinh?sort_year='+year+'&page=2'
 assert links=={expected},'ONLY_OBSERVED_TWO_PAGE_CATEGORY_ALLOWED'
 file=B/('HPG-required-history-'+year+'-page2.body');assert not file.exists()
 r=subprocess.run(['curl','--cacert','/etc/ssl/cert.pem','--max-time','30','-sS','-o',str(file),'-w','%{http_code}',expected],capture_output=True,text=True)
 file.with_suffix('.json').write_text(json.dumps({'url':expected,'method':'OBSERVED_ISSUER_YEAR_CATEGORY_PAGINATION','observedFrom':str(parent),'observedFromSha256':receipt['bodySha256'],'httpStatus':r.stdout,'curlExit':r.returncode,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'bodySha256':hashlib.sha256(file.read_bytes()).hexdigest() if file.exists() else None,'stderr':r.stderr},indent=2)+'\n');print(json.dumps({'year':year,'httpStatus':r.stdout}),flush=True)
