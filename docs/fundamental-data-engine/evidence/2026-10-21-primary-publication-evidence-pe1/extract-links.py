from pathlib import Path
import json,re,html,urllib.parse
from html.parser import HTMLParser
P=Path(__file__).resolve().parent;assert not (P/'ARTIFACT_HASHES.json').exists()
class Links(HTMLParser):
 def __init__(self,raw):super().__init__();self.raw=raw;self.rows=[];self.current=None;self.offsets=[0]+[m.end() for m in re.finditer('\n',raw)]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='a' and a.get('href'):
   self.current={'href':a['href'],'text':'','htmlOffset':self.offsets[self.getpos()[0]-1]+self.getpos()[1],'attributes':a}
 def handle_data(self,data):
  if self.current:self.current['text']+=data+' '
 def handle_endtag(self,tag):
  if tag=='a' and self.current:self.rows.append(self.current);self.current=None
rows=[]
for req in json.loads((P/'HTTP_REQUEST_INVENTORY.json').read_text()):
 if req.get('httpStatus')!=200 or not req.get('bodyPath','').endswith('.html'):continue
 raw=Path(req['bodyPath']).read_text(errors='replace');parser=Links(raw);parser.feed(raw)
 for r in parser.rows:
  r.update(ticker=req['ticker'],parentURL=req.get('finalURL') or req['requestedURL'],parentCapturePath=req['bodyPath'],parentCaptureSha256=req['bodySha256'],url=urllib.parse.urljoin(req.get('finalURL') or req['requestedURL'],html.unescape(r['href'])),context=re.sub('<[^>]+>',' ',html.unescape(raw[max(0,r['htmlOffset']-700):r['htmlOffset']+1300])))
  r['text']=' '.join(r['text'].split());rows.append(r)
(P/'CAPTURED_LINKS.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
for ticker in sorted({r['ticker'] for r in rows}):
 selected=[r for r in rows if r['ticker']==ticker and any(w in (r['url']+' '+r['text']).lower() for w in ['.pdf','2026','2025','báo cáo tài chính','bctc'])]
 print(ticker,len(selected))
 for r in selected[:25]:print(' ',r['text'][:140],r['url'][:220])
