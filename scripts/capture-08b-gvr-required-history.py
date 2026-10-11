"""Two observed primary issuer financial-year archive URLs; no inferred routes."""
import datetime,hashlib,json,pathlib,subprocess
B=pathlib.Path('data/initialization-08b-remediation-work/targeted-indexes')
for year,url in [('2024','https://vrg.vn/quan-he-co-dong/bao-cao-tai-chinh/2024-bao-cao-tai-chinh/'),('2025','https://vrg.vn/quan-he-co-dong/bao-cao-tai-chinh/2025-bao-cao-tai-chinh/')]:
 file=B/('GVR-required-history-'+year+'.body');assert not file.exists(),'RETAINED_RECEIPT_MUST_NOT_BE_OVERWRITTEN'
 r=subprocess.run(['curl','--cacert','/etc/ssl/cert.pem','--max-time','30','-sS','-o',str(file),'-w','%{http_code}',url],capture_output=True,text=True)
 file.with_suffix('.json').write_text(json.dumps({'url':url,'method':'OBSERVED_PRIMARY_ISSUER_YEAR_ARCHIVE','observedFrom':'WEB_PRIMARY_SEARCH_2026_10_10_EXACT_FY2023_FY2024_QUERIES','httpStatus':r.stdout,'curlExit':r.returncode,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'bodySha256':hashlib.sha256(file.read_bytes()).hexdigest() if file.exists() else None,'stderr':r.stderr},indent=2)+'\n');print(json.dumps({'year':year,'httpStatus':r.stdout}),flush=True)
