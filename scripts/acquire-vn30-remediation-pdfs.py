"""Acquire selected public source documents; validate each redirect via owner source policy."""
import concurrent.futures,datetime,hashlib,json,re,zipfile
from pathlib import Path
from urllib.parse import quote,urlsplit
from lib.vietstock_source_policy import download_vietstock,require_vietstock_url
RAW=Path('data/manual-extracted-api/vietstock-documents-v1/20261102-remediation')
OUT=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/vn30-underwriting-v2')
def plan():
 rows={}
 for p in sorted(RAW.glob('*page-*.json')):
  for i,r in enumerate(json.loads(p.read_text())):rows[(p.name.split('-')[0],r['FileInfoID'])]=(r,str(p),i)
 selected=[]
 for (t,ident),(r,path,index) in sorted(rows.items()):
  title=r['Title'].lower();url=r['Url'];scope='STANDALONE' if t in ['LPB','TCX'] else 'CONSOLIDATED'
  quarter='quý 3' in title and 'bctc' in title and (('hợp nhất' in title) if scope=='CONSOLIDATED' else ('hợp nhất' not in title))
  if t=='VJC' and 'quý 3' in title and 'bctc' in title and 'công ty mẹ' in title:quarter=True;scope='STANDALONE_SCOPE_VARIANT'
  capital=any(w in title for w in ['cổ phiếu','vốn điều lệ sau','thay đổi vốn điều lệ']) and not any(w in title for w in ['sở hữu từ 1%','trái phiếu'])
  safety=any(w in title for w in ['an toàn vốn','vốn khả dụng','an toàn tài chính'])
  agm=t in ['BSR','GVR'] and 'nghị quyết đại hội đồng cổ đông thường niên' in title
  if not (quarter or capital or agm or safety) or not any(ext in url.lower() for ext in ['.pdf','.zip']):continue
  selected.append(dict(ticker=t,documentId=ident,title=r['Title'],purpose='Q3_2026' if quarter else 'CAPITAL_ACTION' if capital else 'CAPITAL_ADEQUACY' if safety else 'FY2025_FINAL_ALLOCATION',sourceUrl=quote(require_vietstock_url(url),safe=':/?%=&'),discoveryPath=path,discoveryPointer=f'/{index}',listingLastUpdate=r['LastUpdate'],scopeCandidate=scope if quarter else None))
 return selected
def acquire(r):
 folder=Path('data/manual-download')/r['ticker']/'2026-11-02-remediation';folder.mkdir(parents=True,exist_ok=True)
 ext='.zip' if '.zip' in r['sourceUrl'].lower() else '.pdf';name=f"{r['documentId']}-{r['purpose']}{ext}";target=folder/name
 if target.exists():
  old=PREVIOUS.get(r['sourceUrl'],{})
  actual=hashlib.sha256(target.read_bytes()).hexdigest()
  if old.get('sha256') and old['sha256']!=actual:raise ValueError('RETAINED_SOURCE_HASH_MISMATCH')
  return dict(old or r,status='RETAINED',pdfPath=str(target),sha256=actual)
 part=target.with_suffix('.part');result=download_vietstock(r['sourceUrl'],part)
 if result.returncode or result.stdout!='200' or not part.exists() or not part.read_bytes().startswith(b'PK' if ext=='.zip' else b'%PDF-'):
  part.unlink(missing_ok=True);return dict(r,status='FAILED',httpStatus=result.stdout,error=result.stderr[:160])
 part.replace(target)
 children=[]
 if ext=='.zip':
  with zipfile.ZipFile(target) as archive:
   entries=[i for i in archive.infolist() if i.filename.lower().endswith('.pdf')]
   if sum(i.file_size for i in entries)>200000000:raise ValueError('ARCHIVE_SIZE_LIMIT')
   for i,entry in enumerate(entries):
    body=archive.read(entry)
    if not body.startswith(b'%PDF-'):raise ValueError('ARCHIVE_NON_PDF')
    child=folder/f"{r['documentId']}-document-{i+1}.pdf";child.write_bytes(body);children.append(dict(pdfPath=str(child),sha256=hashlib.sha256(body).hexdigest(),archiveMember=entry.filename))
 return dict(r,extractedPdfs=children,status='CAPTURED',pdfPath=str(target),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceRole='VIETSTOCK_MIRROR_NOT_ORIGINAL_PUBLICATION',productionAdmissible=False)
def main():
 global PREVIOUS
 mp=OUT/'acquisition-manifest.json'
 PREVIOUS={r['sourceUrl']:r for r in json.loads(mp.read_text())['rows']} if mp.exists() else {}
 specs=plan();OUT.mkdir(parents=True,exist_ok=True)
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(acquire,specs))
 (OUT/'acquisition-manifest.json').write_text(json.dumps({'contract':'vn30-remediation-document-acquisition-v1','rows':rows,'productionAdmissible':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'selected':len(rows),'captured':sum(r['status'] in ['CAPTURED','RETAINED'] for r in rows),'failed':[(r['ticker'],r['documentId']) for r in rows if r['status']=='FAILED']}))
if __name__=='__main__':main()
