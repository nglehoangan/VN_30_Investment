"""Two independent OCR engines; retains page geometry and exact lexical output."""
import pathlib,json,subprocess,concurrent.futures,hashlib,os,csv,io
import pymupdf
import pdfplumber
B=pathlib.Path(os.environ.get('VN30_EVIDENCE_WORK','data/manual-extracted/current'));T=B/'ocr';T.mkdir(exist_ok=True);os.chmod(T,0o700)
LANG=pathlib.Path('/private/tmp/vn30-tessdata');LANG.mkdir(exist_ok=True)
for src,name in [('/private/tmp/vn30-vie.traineddata','vie.traineddata'),('/opt/homebrew/share/tessdata/eng.traineddata','eng.traineddata')]:
 target=LANG/name
 if not target.exists():target.symlink_to(src)
def process(task):
 file,n=task;target=T/(file[:-4]+f'-p{n+1}.json');dpi=int(os.environ.get('VN30_RENDER_DPI','180'))
 rotation=int(os.environ.get('VN30_PDF_RENDER_ROTATION','0'))
 if rotation not in [0,90,180,270]:raise ValueError('UNSUPPORTED_PDF_RENDER_ROTATION')
 if dpi not in [180,300,400]:raise ValueError('UNSUPPORTED_RENDER_DPI')
 assert hashlib.sha256((B/file).read_bytes()).hexdigest()==file[:-4], 'MANUAL_PDF_HASH_MISMATCH'
 doc=pymupdf.open(B/file);page=doc[n];area=page.rect.width*page.rect.height
 majorRaster=any(r.width*r.height/area>0.5 for img in page.get_images() for r in page.get_image_rects(img[0]))
 forceImage=os.environ.get('VN30_FORCE_IMAGE_OCR')=='1'
 scan=len(page.get_text().strip())<100 or majorRaster or forceImage
 psm=os.environ.get('VN30_OCR_PSM','6');expectedB='TESSERACT_5.5.3_VIE_ENG_PSM'+psm+'_IMAGE_OCR'
 if not scan and os.environ.get('VN30_NATIVE_VERIFY')=='1':expectedB='PDFPLUMBER_NATIVE_WORD_COORDINATES'
 expectedA='APPLE_VISION_ACCURATE_IMAGE_OCR' if scan else 'PYMUPDF_NATIVE_GLYPH_COORDINATES'
 cached=json.loads(target.read_text()) if target.exists() else {}
 if cached.get('renderDpi')==dpi and cached.get('sourceRenderRotation',0)==rotation and cached.get('engineA')==expectedA and cached.get('engineB')==expectedB and cached.get('passA') and cached.get('passB') and not any('\t' in w['text'] or '\n' in w['text'] for w in cached['passB']):return {'file':file,'page':n+1,'cached':True}
 if target.exists():raise RuntimeError('IMMUTABLE_READER_ATTEMPT_MISMATCH_USE_SEPARATE_EVIDENCE_WORK')
 try:
  doc=pymupdf.open(B/file);page=doc[n];png=T/(file[:-4]+f'-p{n+1}.png');
  if png.is_symlink():png.unlink()
  if rotation:
   if not scan:raise ValueError('ROTATION_OVERRIDE_REQUIRES_RASTER_SOURCE_PAGE')
   page.get_pixmap(matrix=pymupdf.Matrix(dpi/72,dpi/72).prerotate(rotation)).save(png)
  else:page.get_pixmap(dpi=dpi).save(png)
  native=page.get_text('words',sort=True);native_words=[{'text':w[4],'x':w[0]/page.rect.width,'y':w[1]/page.rect.height,'width':(w[2]-w[0])/page.rect.width,'height':(w[3]-w[1])/page.rect.height,'confidence':1} for w in native]
  if scan:
   r=subprocess.run(['/private/tmp/vn30-vision-ocr',str(png)],capture_output=True,timeout=60)
   if r.returncode:raise RuntimeError('VISION_FAILED')
   a=json.loads(r.stdout);methodA='APPLE_VISION_ACCURATE_IMAGE_OCR'
  else:a=native_words;methodA='PYMUPDF_NATIVE_GLYPH_COORDINATES'
  if expectedB=='PDFPLUMBER_NATIVE_WORD_COORDINATES':
   with pdfplumber.open(B/file) as independent:
    ip=independent.pages[n];b=[{'text':w['text'],'confidence':1,'x':w['x0']/ip.width,'y':w['top']/ip.height,'width':(w['x1']-w['x0'])/ip.width,'height':(w['bottom']-w['top'])/ip.height} for w in ip.extract_words()]
   result={'bodyHash':file[:-4],'page':n+1,'renderSha256':hashlib.sha256(png.read_bytes()).hexdigest(),'renderDpi':dpi,'renderPolicy':'EXPLICIT_SOURCE_RENDERED_IMAGE_OCR_V1' if forceImage else 'NATIVE_TEXT_UNLESS_MAJOR_RASTER_OR_NO_TEXT_V2','engineA':methodA,'engineB':expectedB,'passA':a,'passB':b,'status':'EXTRACTION_CANDIDATE_NOT_APPROVED'}
   if target.is_symlink():target.unlink()
   target.write_text(json.dumps(result,ensure_ascii=False));return {'file':file,'page':n+1,'a':len(a),'b':len(b),'nativeIndependent':True}
  env={**os.environ,'OMP_THREAD_LIMIT':'1'}
  r=subprocess.run(['/opt/homebrew/bin/tesseract',str(png),'stdout','--tessdata-dir',str(LANG),'-l','vie+eng','--psm',psm,'-c','tessedit_create_tsv=1'],capture_output=True,timeout=90,env=env)
  if r.returncode:raise RuntimeError('TESSERACT_FAILED')
  pix=pymupdf.Pixmap(str(png));b=[]
  for w in csv.DictReader(io.StringIO(r.stdout.decode()),delimiter='\t',quoting=csv.QUOTE_NONE):
   if w.get('text','').strip():b.append({'text':w['text'],'confidence':float(w['conf'])/100,'x':int(w['left'])/pix.width,'y':int(w['top'])/pix.height,'width':int(w['width'])/pix.width,'height':int(w['height'])/pix.height})
  result={'bodyHash':file[:-4],'page':n+1,'renderSha256':hashlib.sha256(png.read_bytes()).hexdigest(),'renderDpi':dpi,'renderPolicy':'EXPLICIT_SOURCE_RENDERED_IMAGE_OCR_V1' if forceImage else 'NATIVE_TEXT_UNLESS_MAJOR_RASTER_OR_NO_TEXT_V2','engineA':methodA,'engineB':expectedB,'passA':a,'passB':b,'status':'EXTRACTION_CANDIDATE_NOT_APPROVED'}

  if rotation:result['sourceRenderRotation']=rotation;result['renderPolicy']='EXPLICIT_RASTER_SOURCE_PDF_PAGE_ORIENTATION_BOTH_ENGINES_V1'
  if target.is_symlink():target.unlink()
  target.write_text(json.dumps(result,ensure_ascii=False));return {'file':file,'page':n+1,'a':len(a),'b':len(b)}
 except Exception as e:
  result={'file':file,'page':n+1,'error':type(e).__name__,'status':'EXCEPTION_REVIEW_REQUIRED'};
  if target.is_symlink():target.unlink()
  target.write_text(json.dumps(result));return result
if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser();parser.add_argument('--pages',type=int,default=12);parser.add_argument('--bank-notes',action='store_true');parser.add_argument('--refresh-primary',action='store_true');args=parser.parse_args()
 docs=json.loads((B/os.environ.get('VN30_DOCUMENT_SELECTION','selected-documents.json')).read_text());tasks=[]
 banks={s['ticker'] for s in json.loads((B/'sector-business-evidence.json').read_text()) if s['projectSector']=='BANK'}
 notePlan=[]
 for d in docs:
  with pymupdf.open(B/d['file']) as p:
   if 'targetPages' in d:
    tasks.extend((d['file'],page-1) for page in d['targetPages']);continue
   if args.refresh_primary:tasks.extend((d['file'],n) for n in range(min(len(p),args.pages)))
   if args.bank_notes:
    if d['ticker'] not in banks:continue
    indices=[]
    if sum(len(page.get_text()) for page in p)>20000:
     import unicodedata
     for n,page in enumerate(p):
      text=''.join(c for c in unicodedata.normalize('NFD',page.get_text()).lower() if unicodedata.category(c)!='Mn').replace('đ','d')
      if any(cue in text for cue in ['non-performing','no xau','khong ky han','current and savings','capital adequacy','nim','tien gui cua khach hang','loans to customers']):indices.append(n)
    else:indices=list(range(24,min(len(p),40)))+list(range(max(40,len(p)-10),len(p)))
    notePlan.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'pages':[n+1 for n in indices],'method':'EXACT_NATIVE_NOTE_CUES_OR_BOUNDED_SCAN_NOTES_25_40_AND_FINAL_10','requiredMetrics':['NPL','CASA','CAR','NIM','LDR','CREDIT_GROWTH'],'noSourceUnavailableClaim':True})
    tasks.extend((d['file'],n) for n in sorted(set(indices)))
   else:tasks.extend((d['file'],n) for n in range(min(len(p),args.pages)))
 if args.bank_notes:(B/'special-sector-note-search.json').write_text(json.dumps(notePlan,indent=2)+'\n')
 tasks=list(dict.fromkeys(tasks))
 with concurrent.futures.ProcessPoolExecutor(max_workers=max(1,min(8,int(os.environ.get('VN30_OCR_WORKERS','3'))))) as pool:
  for i,result in enumerate(pool.map(process,tasks)):
   with (B/'ocr-progress.jsonl').open('a') as out:out.write(json.dumps(result)+'\n')
   if i%30==0:print(json.dumps({'completed':i+1,'total':len(tasks)}),flush=True)
 print(json.dumps({'completed':len(tasks),'total':len(tasks)}),flush=True)
