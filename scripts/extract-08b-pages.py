"""Two independent OCR engines; retains page geometry and exact lexical output."""
import pathlib,json,subprocess,concurrent.futures,hashlib,os,csv,io
import pymupdf
from pypdf import PdfReader
B=pathlib.Path('data/initialization-08b-final-work');T=B/'ocr';T.mkdir(exist_ok=True);os.chmod(T,0o700)
LANG=pathlib.Path('/private/tmp/vn30-tessdata');LANG.mkdir(exist_ok=True)
for src,name in [('/private/tmp/vn30-vie.traineddata','vie.traineddata'),('/opt/homebrew/share/tessdata/eng.traineddata','eng.traineddata')]:
 target=LANG/name
 if not target.exists():target.symlink_to(src)
def process(task):
 file,n=task;target=T/(file[:-4]+f'-p{n+1}.json')
 doc=pymupdf.open(B/file);page=doc[n];area=page.rect.width*page.rect.height
 majorRaster=any(r.width*r.height/area>0.5 for img in page.get_images() for r in page.get_image_rects(img[0]))
 scan=len(page.get_text().strip())<100 or majorRaster
 expectedA='APPLE_VISION_ACCURATE_IMAGE_OCR' if scan else 'PYMUPDF_NATIVE_GLYPH_COORDINATES'
 cached=json.loads(target.read_text()) if target.exists() else {}
 if cached.get('engineA')==expectedA and cached.get('passA') and cached.get('passB') and not any('\t' in w['text'] or '\n' in w['text'] for w in cached['passB']):return {'file':file,'page':n+1,'cached':True}
 try:
  doc=pymupdf.open(B/file);page=doc[n];png=T/(file[:-4]+f'-p{n+1}.png');page.get_pixmap(dpi=180).save(png)
  native=page.get_text('words',sort=True);native_words=[{'text':w[4],'x':w[0]/page.rect.width,'y':w[1]/page.rect.height,'width':(w[2]-w[0])/page.rect.width,'height':(w[3]-w[1])/page.rect.height,'confidence':1} for w in native]
  if scan:
   r=subprocess.run(['/private/tmp/vn30-vision-ocr',str(png)],capture_output=True,timeout=60)
   if r.returncode:raise RuntimeError('VISION_FAILED')
   a=json.loads(r.stdout);methodA='APPLE_VISION_ACCURATE_IMAGE_OCR'
  else:a=native_words;methodA='PYMUPDF_NATIVE_GLYPH_COORDINATES'
  env={**os.environ,'OMP_THREAD_LIMIT':'1'}
  r=subprocess.run(['/opt/homebrew/bin/tesseract',str(png),'stdout','--tessdata-dir',str(LANG),'-l','vie+eng','--psm','6','-c','tessedit_create_tsv=1'],capture_output=True,timeout=90,env=env)
  if r.returncode:raise RuntimeError('TESSERACT_FAILED')
  pix=pymupdf.Pixmap(str(png));b=[]
  for w in csv.DictReader(io.StringIO(r.stdout.decode()),delimiter='\t',quoting=csv.QUOTE_NONE):
   if w.get('text','').strip():b.append({'text':w['text'],'confidence':float(w['conf'])/100,'x':int(w['left'])/pix.width,'y':int(w['top'])/pix.height,'width':int(w['width'])/pix.width,'height':int(w['height'])/pix.height})
  result={'bodyHash':file[:-4],'page':n+1,'renderSha256':hashlib.sha256(png.read_bytes()).hexdigest(),'renderDpi':180,'renderPolicy':'NATIVE_TEXT_UNLESS_MAJOR_RASTER_OR_NO_TEXT_V2','engineA':methodA,'engineB':'TESSERACT_5.5.3_VIE_ENG_PSM6_IMAGE_OCR','passA':a,'passB':b,'status':'EXTRACTION_CANDIDATE_NOT_APPROVED'}
  target.write_text(json.dumps(result,ensure_ascii=False));return {'file':file,'page':n+1,'a':len(a),'b':len(b)}
 except Exception as e:
  result={'file':file,'page':n+1,'error':type(e).__name__,'status':'EXCEPTION_REVIEW_REQUIRED'};target.write_text(json.dumps(result));return result
if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser();parser.add_argument('--pages',type=int,default=12);parser.add_argument('--bank-notes',action='store_true');parser.add_argument('--refresh-primary',action='store_true');args=parser.parse_args()
 docs=json.loads((B/'selected-documents.json').read_text());tasks=[]
 banks={s['ticker'] for s in json.loads((B/'sector-business-evidence.json').read_text()) if s['projectSector']=='BANK'}
 notePlan=[]
 for d in docs:
  with pymupdf.open(B/d['file']) as p:
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
 with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:
  for i,result in enumerate(pool.map(process,tasks)):
   with (B/'ocr-progress.jsonl').open('a') as out:out.write(json.dumps(result)+'\n')
   if i%30==0:print(json.dumps({'completed':i+1,'total':len(tasks)}),flush=True)
 print(json.dumps({'completed':len(tasks),'total':len(tasks)}),flush=True)
