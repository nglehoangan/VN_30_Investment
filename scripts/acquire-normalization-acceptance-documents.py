"""Public Vietstock AGM evidence; no source promotion or accounting writes."""
import json,hashlib,datetime,zipfile,concurrent.futures
from pathlib import Path
from urllib.parse import quote
from lib.vietstock_source_policy import require_vietstock_url,download_vietstock
OUT=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-03/normalization-acceptance-v1')
T=set('BID BSR CTG GVR HDB LPB MCH MSN SAB SHB SSB STB TCX VIB VIC VJC VPB'.split())
def plan():
 rows={}
 for p in sorted(Path('data/manual-extracted-api/vietstock-documents-v1/20261102-remediation').glob('*page-*.json')):
  t=p.name.split('-')[0]
  if t not in T:continue
  for i,r in enumerate(json.loads(p.read_text())):
   if any(w in r['Title'].lower() for w in ['nghị quyết đại hội đồng cổ đông thường niên','nghị quyết đhđcđ thường niên','phân phối lợi nhuận','trích lập quỹ']):
    rows[t,r['FileInfoID']]=dict(ticker=t,documentId=r['FileInfoID'],title=r['Title'],sourceUrl=quote(require_vietstock_url(r['Url']),safe=':/?%=&'),discoveryPath=str(p),discoverySha256=hashlib.sha256(p.read_bytes()).hexdigest(),discoveryPointer='/'+str(i),listingLastUpdate=r['LastUpdate'])
 return list(rows.values())
def acquire(r):
 old=OLD.get(r['sourceUrl'])
 if old:
  p=Path(old['pdfPath'])
  if hashlib.sha256(p.read_bytes()).hexdigest()!=old['sha256']:raise ValueError('RETAINED_DOCUMENT_HASH_MISMATCH')
  return dict(r,status='RETAINED',pdfPath=str(p),sha256=old['sha256'],retrievedAt=old.get('retrievedAt'),extractedPdfs=old.get('extractedPdfs',[]),sourceRole='VIETSTOCK_MIRROR_NOT_ORIGINAL_PUBLICATION',productionAdmissible=False)
 folder=Path('data/manual-download')/r['ticker']/'2026-11-03-normalization';folder.mkdir(parents=True,exist_ok=True)
 ext='.zip' if '.zip' in r['sourceUrl'].lower() else '.pdf';p=folder/(str(r['documentId'])+'-AGM2026'+ext)
 part=p.with_suffix('.part');result=download_vietstock(r['sourceUrl'],part)
 if result.returncode or result.stdout!='200' or not part.exists():
  part.unlink(missing_ok=True);return dict(r,status='FAILED',httpStatus=result.stdout)
 body=part.read_bytes()
 if not body.startswith(b'PK' if ext=='.zip' else b'%PDF-'):part.unlink();return dict(r,status='FAILED_SIGNATURE')
 part.replace(p);children=[]
 if ext=='.zip':
  with zipfile.ZipFile(p) as z:
   members=[m for m in z.infolist() if m.filename.lower().endswith('.pdf')]
   if sum(m.file_size for m in members)>200000000:raise ValueError('ZIP_SIZE_LIMIT')
   for i,m in enumerate(members):
    b=z.read(m)
    if not b.startswith(b'%PDF-'):raise ValueError('ZIP_PDF_SIGNATURE_REQUIRED')
    child=folder/(str(r['documentId'])+'-member-'+str(i+1)+'.pdf');child.write_bytes(b)
    children.append(dict(pdfPath=str(child),sha256=hashlib.sha256(b).hexdigest(),archiveMember=m.filename))
 return dict(r,status='CAPTURED',pdfPath=str(p),sha256=hashlib.sha256(body).hexdigest(),extractedPdfs=children,retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceRole='VIETSTOCK_MIRROR_NOT_ORIGINAL_PUBLICATION',productionAdmissible=False)
def main():
 global OLD
 old=json.loads(Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/vn30-underwriting-v2/acquisition-manifest.json').read_text())['rows'];mp=OUT/'acquisition-manifest.json'
 if mp.exists():old+=json.loads(mp.read_text())['rows']
 OLD={r['sourceUrl']:r for r in old if r.get('sha256')}
 specs=plan();OUT.mkdir(parents=True,exist_ok=True)
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(acquire,specs))
 mp.write_text(json.dumps(dict(contract='normalization-acceptance-document-acquisition-v1',rows=rows,productionAdmissible=False),ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(dict(selected=len(specs),captured=sum(r['status'] in ['CAPTURED','RETAINED'] for r in rows),failed=[r['ticker'] for r in rows if r['status'] not in ['CAPTURED','RETAINED']])))
if __name__=='__main__':main()
