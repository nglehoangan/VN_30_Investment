"""Read-only public corpus text inventory. No filename-based qualification."""
import pathlib,json,hashlib,unicodedata,re,concurrent.futures
import pymupdf
B=pathlib.Path('data/initialization-08b-final-work')
def fold(s):return ''.join(c for c in unicodedata.normalize('NFD',s).lower() if unicodedata.category(c)!='Mn').replace('đ','d')
def inspect(file):
 out=B/(file[:-4]+'.text.json')
 if out.exists():return json.loads(out.read_text())['summary']
 try:
  doc=pymupdf.open(B/file);pages=[p.get_text('text',sort=True) for p in doc];head=fold('\n'.join(pages[:7]));summary={'file':file,'pages':len(pages),'textCharacters':sum(map(len,pages)),'h1_2026':bool(re.search(r'(30[ ./-]+0?6[ ./-]+2026|30\s*thang\s*6\s*nam\s*2026|six.month.*2026|sau thang.*2026|6 thang.*2026)',head)),'annual2025':bool(re.search(r'(31[ ./-]+12[ ./-]+2025|31\s*thang\s*12\s*nam\s*2025|year ended.*2025)',head)),'consolidated':bool(re.search(r'hop nhat|consolidated',head)),'financial':bool(re.search(r'bao cao tai chinh|financial statements',head)),'head': '\n'.join(pages[:3])[:4500]}
  out.write_text(json.dumps({'summary':summary,'pages':pages,'parser':'PyMuPDF-1.28.2','bodyHash':file[:-4]},ensure_ascii=False));return summary
 except Exception as e:return {'file':file,'error':type(e).__name__}
if __name__=='__main__':
 corpus=json.loads((B/'corpus.json').read_text());files=sorted({d['file'] for d in corpus['documents']})
 with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:summaries=list(pool.map(inspect,files))
 (B/'text-inventory.json').write_text(json.dumps(summaries,ensure_ascii=False,indent=2));print(json.dumps({'bodies':len(summaries),'textBodies':sum(s.get('textCharacters',0)>1000 for s in summaries),'h1_2026':sum(s.get('h1_2026',False) for s in summaries),'annual2025':sum(s.get('annual2025',False) for s in summaries)}))
