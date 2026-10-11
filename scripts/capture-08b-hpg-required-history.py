"""Finite own HTML GET form year selections serving frozen HPG history only."""
import argparse,datetime,hashlib,json,pathlib,re,subprocess
B=pathlib.Path('data/initialization-08b-remediation-work/targeted-indexes')
root=B/'HPG.body';receipt=json.loads(root.with_suffix('.json').read_text())
assert hashlib.sha256(root.read_bytes()).hexdigest()==receipt['bodySha256'] and int(receipt['httpStatus'])==200
text=root.read_text();assert '<select name="sort_year"' in text and 'id="form-sort-year"' in text
parser=argparse.ArgumentParser();parser.add_argument('--years',nargs='+',choices=['2022','2023','2024','2025'],default=['2022','2023','2024']);args=parser.parse_args()
for year in args.years:
 assert re.search(r'<option\s+value="'+year+'">'+year+'</option>',text)
 file=B/('HPG-required-history-'+year+'.body')
 if file.exists():raise ValueError('RETAINED_RECEIPT_MUST_NOT_BE_OVERWRITTEN')
 url='https://www.hoaphat.com.vn/quan-he-co-dong/bao-cao-tai-chinh?sort_year='+year
 started=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
 r=subprocess.run(['curl','--cacert','/etc/ssl/cert.pem','--max-time','30','-sS','-o',str(file),'-w','%{http_code}',url],capture_output=True,text=True)
 file.with_suffix('.json').write_text(json.dumps({'url':url,'method':'OBSERVED_ISSUER_HTML_GET_FORM_YEAR_SELECTION','observedFrom':str(root),'observedFromSha256':receipt['bodySha256'],'httpStatus':r.stdout,'curlExit':r.returncode,'startedAt':started,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'bodySha256':hashlib.sha256(file.read_bytes()).hexdigest() if file.exists() else None,'stderr':r.stderr},indent=2)+'\n')
 print(json.dumps({'year':year,'httpStatus':r.stdout,'curlExit':r.returncode}),flush=True)
