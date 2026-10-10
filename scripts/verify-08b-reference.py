"""Revalidate dated HOSE bytes/table with two distinct PDF parsers; no governance approval."""
import pathlib,json,re,hashlib,datetime
from pypdf import PdfReader
import pdfplumber
B=pathlib.Path('data/initialization-08b-universe-evidence-01');W=pathlib.Path('data/initialization-08b-final-work')
pdf=B/'hsx-july-constituents.pdf';digest=hashlib.sha256(pdf.read_bytes()).hexdigest()
assert digest=='441799b3afbc4f29f8b53ce6ef3b500b9121a4d032ca4cfeb1d4aa6e14407879'
reader=PdfReader(pdf);a=reader.pages[0].extract_text()
with pdfplumber.open(pdf) as other:b=other.pages[0].extract_text()
def rows(text):return [(int(i),ticker) for i,ticker in re.findall(r'^\s*(\d{1,2})\s+([A-Z]{3})\s',text,re.M)]
a_rows,b_rows=rows(a),rows(b);assert a_rows==b_rows and len(a_rows)==35
assert [i for i,_ in a_rows[:30]]==list(range(1,31));assert [i for i,_ in a_rows[30:]]==list(range(1,6))
expected='ACB BID BSR CTG FPT GAS GVR HDB HPG LPB MBB MCH MSN MWG SAB SHB SSB SSI STB TCB TCX VCB VHM VIB VIC VJC VNM VPB VPL VRE'.split()
assert [t for _,t in a_rows[:30]]==expected
notice=json.loads((B/'hsx-july-notice.json').read_text())['data'];assert notice['id']==2479382 and '03/08/2026' in notice['summary']
assert datetime.datetime.fromtimestamp(notice['postedDate'],datetime.timezone.utc).date().isoformat()=='2026-07-15'
identity=json.load(open('docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json'))['identities'];assert len(identity)==30 and len({i['securityId'] for i in identity})==30 and sorted(i['ticker'] for i in identity)==expected
isins=[i['isin'] for i in identity if i.get('isin')];assert len(set(isins))==len(isins)
result={'status':'PASS','source':'HOSE_DATED_NOTICE_2479382','pdfSha256':digest,'pdfPages':len(reader.pages),'independentParsers':['pypdf-6.20.0','pdfplumber-0.11.10'],'mainRows':a_rows[:30],'reserveRowsExcluded':a_rows[30:],'noticeDate':'2026-07-15','effectiveFrom':'2026-08-03','stableSecurityIds':30,'knownUniqueIsins':len(isins),'researchBasketIsNotAuthority':True,'approvalReference':None}
(W/'reference-revalidation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':'PASS','main':30,'reservesExcluded':5,'uniqueIsins':len(isins)}))
