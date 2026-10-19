"""Replace disposable OCR-reader references with direct PDF page/box evidence."""
import hashlib,json,pathlib,shutil
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE=ROOT/'data/manual-extracted-pdf'
CONTROL=ROOT/'docs/fundamental-data-engine/rebuild-2026-10-19'
def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,v):
 tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');tmp.replace(p)
def evidence(path,page,boxes=None):
 value={'path':path,'page':page,'href':path+'#page='+str(page),'pageNumbering':'PHYSICAL_ONE_BASED','coordinateSystem':'NORMALIZED_TOP_LEFT'}
 if boxes is not None:value['boxes']=boxes
 return value

def main():
 manifest=load(BASE/'manifest.json')
 if manifest.get('evidenceMode')=='DIRECT_PDF':
  assert not (BASE/'documents').exists() and not (BASE/'readers').exists()
  print('Already linked directly to PDF; no raw reader folders remain.');return
 display_manifest=load(BASE/'display-manifest.json');notes_manifest=load(BASE/'notes/manifest.json')
 protected={r['path']:r['sha256'] for r in load(ROOT/'data/manual-download/manifest.json')['requests'] if r['status']=='DOWNLOADED'}
 db_sha=sha(ROOT/'data/vn30.sqlite');fingerprints=[];cells=pages=0
 paths={d['sourceHash']:d['retainedPaths'][0] for d in manifest['documents']}
 for item in display_manifest['files']:
  path=BASE/item['file'];data=load(path)
  for doc in data['documents']:
   pdf=paths[doc['sourceHash']];doc['pdfPath']=pdf;doc['evidenceMode']='DIRECT_PDF'
   for key in ['rawDocumentPath','rawDocumentHash']:doc.pop(key,None)
   for page in doc['pages']:
    for key in ['readerPath','rawLocator']:page.pop(key,None)
    page['pdfEvidence']=evidence(pdf,page['page'])
  for rk,report in data['reports'].items():
   for pk,period in report['periods'].items():
    for vi,variant in enumerate(period['variants']):
     src=variant['source'];pdf=paths[src['payloadHash']]
     src['pdfPath']=pdf;src['rawPayloadLocation']=pdf;src['rawPayloadHash']=src['payloadHash'];src['evidenceMode']='DIRECT_PDF'
     variant['id']=f"{pathlib.Path(pdf).name}:{rk}:{pk}:variant-{vi}"
     for group in variant['groups']:
      group['pdfEvidence']=evidence(pdf,group['sourcePage'])
      for row in group['rows']:
       fingerprints.append([data['ticker'],rk,pk,vi,group['id'],row['id'],row['value'],row['status'],row['label']])
       row['cellEvidence']=evidence(pdf,row['sourcePage'],row.get('boxes',[]))
       row['captionEvidence']=evidence(pdf,row['sourcePage'],row.get('captionBoxes',[]))
       row['pdfEvidence']=evidence(pdf,row['sourcePage'])
       for key in ['readerPath','readerHash','readerPass','rawLocator','readerWordIndices','captionWordIndices','codeWordIndices']:row.pop(key,None)
       cells+=1
  data['evidenceMode']='DIRECT_PDF';write(path,data);item['sha256']=sha(path)
  np=BASE/'notes'/item['file'];notes=load(np)
  for doc in notes['documents']:
   pdf=paths[doc['sourceHash']];doc['pdfPath']=pdf
   for page in doc['pages']:
    page.pop('textEvidence',None);page.pop('geometryEvidence',None)
    page['pdfEvidence']=evidence(pdf,page['page']);page['geometryRetention']='TABLE_CELL_BOXES_IN_REPORT_JSON';pages+=1
  notes['evidenceMode']='DIRECT_PDF';write(np,notes)
  ni=next(n for n in notes_manifest['files'] if n['ticker']==data['ticker']);ni['sha256']=sha(np)
 for collection in [manifest['documents'],display_manifest['documents']]:
  for doc in collection:
   doc['pdfPath']=paths[doc['sourceHash']]
   doc.pop('rawDocumentPath',None);doc.pop('rawDocumentHash',None)
 manifest['evidenceMode']=display_manifest['evidenceMode']='DIRECT_PDF'
 notes_manifest['evidenceMode']='DIRECT_PDF'
 write(BASE/'manifest.json',manifest);write(BASE/'display-manifest.json',display_manifest);write(BASE/'notes/manifest.json',notes_manifest)
 # Prove values/captions/status/order stayed unchanged before deleting raw readers.
 after=[]
 for item in display_manifest['files']:
  data=load(BASE/item['file'])
  for rk,report in data['reports'].items():
   for pk,period in report['periods'].items():
    for vi,v in enumerate(period['variants']):
     for g in v['groups']:
      for r in g['rows']:after.append([data['ticker'],rk,pk,vi,g['id'],r['id'],r['value'],r['status'],r['label']])
 assert after==fingerprints
 for path,expected in protected.items():assert sha(ROOT/path)==expected
 assert sha(ROOT/'data/vn30.sqlite')==db_sha
 removed=[]
 for name in ['documents','readers']:
  directory=BASE/name
  removed.append({'path':str(directory.relative_to(ROOT)),'files':sum(p.is_file() for p in directory.rglob('*')),'bytes':sum(p.stat().st_size for p in directory.rglob('*') if p.is_file())})
  shutil.rmtree(directory)
 previous=load(BASE/'verification.json');write(CONTROL/'lexical-verification-before-reader-removal.json',previous)
 write(BASE/'verification.json',{'status':'PASS_DIRECT_PDF_REFERENCE_AND_COVERAGE','physicalPdfs':len(protected),'uniquePdfs':manifest['uniquePdfCount'],'tickers':len(display_manifest['files']),'verifiedCells':cells,'pages':pages,'previousLexicalVerification':str((CONTROL/'lexical-verification-before-reader-removal.json').relative_to(ROOT)),'lexicalReplayAvailable':False,'semanticReview':'NOT_PERFORMED'})
 receipt={'evidenceMode':'DIRECT_PDF','cellsUnchanged':cells,'notePagesRetained':pages,'databaseUnchanged':True,'pdfSourcesUnchanged':True,'removed':removed,'removedBytes':sum(i['bytes'] for i in removed),'wordLevelOcrRawRetained':False,'tableCellBoxesRetained':True}
 write(CONTROL/'direct-pdf-migration.json',receipt);print(json.dumps(receipt))
if __name__=='__main__':main()
