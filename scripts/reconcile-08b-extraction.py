"""Exact caption/geometry candidate reconciliation. No fuzzy captions or source winner."""
import json,pathlib,re,unicodedata,hashlib,decimal,datetime
B=pathlib.Path('data/initialization-08b-final-work')
def fold(s):return re.sub(r'\s+',' ',''.join(c for c in unicodedata.normalize('NFD',s).lower() if unicodedata.category(c)!='Mn').replace('đ','d')).strip()
def compact(s):return re.sub('[^a-z0-9]','',fold(s))
def lines(words):
 groups=[]
 for w in sorted(words,key=lambda w:w['y']+w['height']/2):
  cy=w['y']+w['height']/2;g=next((g for g in groups if abs(g['cy']-cy)<0.0065),None)
  if g is None:g={'cy':cy,'words':[]};groups.append(g)
  g['words'].append(w)
 for g in groups:g['words'].sort(key=lambda w:w['x']);g['text']=' '.join(w['text'] for w in g['words'])
 return groups
# Exact approved caption alternatives; spelling/diacritics normalization only, no fuzzy matching.
CAPTIONS={
 'TOTAL_LIABILITIES_SUPPORTING':['no phai tra','total liabilities'],
 'CFI_SUPPORTING':['luu chuyen tien thuan tu hoat dong dau tu','net cash flows from investing activities'],
 'CFF_SUPPORTING':['luu chuyen tien thuan tu hoat dong tai chinh','net cash flows from financing activities'],
 'NET_CASH_CHANGE_SUPPORTING':['luu chuyen tien thuan trong ky','net cash flows during the period'],
 'BANK_NONPERFORMING_LOANS':['tong no xau','non-performing loans','total non-performing loans'],
 'BANK_LOAN_LOSS_RESERVES':['du phong rui ro cho vay khach hang','provision for losses on loans to customers'],
 'BANK_CURRENT_AND_SAVINGS_DEPOSITS':['current and savings deposits','current and savings accounts'],
 'REVENUE':['doanh thu thuan ve ban hang va cung cap dich vu','doanh thu thuan','net revenue','net sales'],
 'NET_INCOME':['loi nhuan sau thue thu nhap doanh nghiep','loi nhuan sau thue','profit after tax','net profit after tax','loi nhuan sau thue tndn'],
 'NET_INCOME_ATTRIBUTABLE_PARENT':['loi nhuan sau thue cua cong ty me','loi nhuan sau thue thuoc ve co dong cua cong ty me','co dong cua cong ty me','profit attributable to owners of the parent','attributable to shareholders of the parent company','owners of the parent'],
 'TOTAL_ASSETS':['tong cong tai san','tong tai san','total assets'],
 'TOTAL_EQUITY':['von chu so huu','total equity','equity'],
 'GROSS_PROFIT':['loi nhuan gop ve ban hang va cung cap dich vu','loi nhuan gop','gross profit'],
 'CFO':['luu chuyen tien thuan tu hoat dong kinh doanh','net cash flows from operating activities','net cash from operating activities','net cash generated from operating activities'],
 'CAPEX':['tien chi de mua sam xay dung tscd va cac tai san dai han khac','tien chi de mua sam, xay dung tscd va cac tai san dai han khac','purchases and construction of fixed assets and other long-term assets','payments for acquisition and construction of fixed assets and other long-term assets'],
 'CURRENT_ASSETS':['tai san ngan han','current assets'], 'CURRENT_LIABILITIES':['no ngan han','current liabilities'],
 'INVENTORY':['hang ton kho','inventories'], 'RECEIVABLES':['cac khoan phai thu ngan han','short-term receivables'],
 'BANK_GROSS_CUSTOMER_LOANS':['cho vay khach hang','loans to customers','gross loans to customers'], 'BANK_CUSTOMER_DEPOSITS':['tien gui cua khach hang','tien gui khach hang','deposits from customers','customer deposits'],
 'BANK_NET_INTEREST_INCOME':['thu nhap lai thuan','net interest income'], 'BANK_NET_FEE_INCOME':['lai thuan tu hoat dong dich vu','net fee and commission income'],
 'BANK_OPERATING_EXPENSES':['chi phi hoat dong','operating expenses'], 'BANK_OPERATING_INCOME':['tong thu nhap hoat dong','total operating income']}
CODES={'REVENUE':{'10'},'NET_INCOME':{'60'},'NET_INCOME_ATTRIBUTABLE_PARENT':{'61'},'TOTAL_ASSETS':{'270'},'GROSS_PROFIT':{'20'},'CFO':{'20'},'CAPEX':{'21'},'CURRENT_ASSETS':{'100'},'CURRENT_LIABILITIES':{'310'},'INVENTORY':{'140'},'RECEIVABLES':{'130'},'TOTAL_EQUITY':{'400'}}
CF={'CFO','CAPEX','CFI_SUPPORTING','CFF_SUPPORTING','NET_CASH_CHANGE_SUPPORTING'};STOCK={'BANK_NONPERFORMING_LOANS','BANK_LOAN_LOSS_RESERVES','BANK_CURRENT_AND_SAVINGS_DEPOSITS','TOTAL_LIABILITIES_SUPPORTING','TOTAL_ASSETS','TOTAL_EQUITY','CURRENT_ASSETS','CURRENT_LIABILITIES','INVENTORY','RECEIVABLES','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS'}
def name_cores(identity):
 out=[]
 for name in [identity['securityName'],identity.get('alternativeNameFromUndatedEndpoint') or '']:
  n=fold(name).replace('ctcp','cong ty co phan').replace('tmcp','thuong mai co phan').replace('tp.hcm','thanh pho ho chi minh')
  for pre in ['tong cong ty co phan ','cong ty co phan ','ngan hang thuong mai co phan ','tong cong ty ']:
   if n.startswith(pre):n=n[len(pre):]
  n=re.sub(r'\s*-?\s*cong ty co phan$','',n).strip();n=n.replace('tap doan ','')
  if n:out.append(compact(n))
 return sorted(set(out))
def get_period(s):
 s=fold(s)
 for year in [2026,2025]:
  if re.search(fr'(30\s*[/.-]\s*0?6\s*[/.-]\s*{year}|30\s+thang\s+0?6\s+nam\s+{year}|30\s+june\s+{year}|june\s+30,?\s+{year})',s):
   six=any(x in s for x in ['sau thang','6 thang','six month','six-month','luy ke','year-to-date'])
   quarter=bool(re.search(r'quy\s*(ii|2)|second quarter|2nd quarter',s))
   if not six and not quarter:return None
   return {'start':f'{year}-01-01' if six else f'{year}-04-01','end':f'{year}-06-30','type':'YTD' if six else 'QUARTER','fiscalYear':year,'fiscalQuarter':2,'calendarReference':'SOURCE_EXPLICIT_CALENDAR_WINDOW'}
  if re.search(fr'(31\s*[/.-]\s*12\s*[/.-]\s*{year}|31\s+thang\s+12\s+nam\s+{year}|31\s+december\s+{year}|december\s+31,?\s+{year})',s):return {'start':f'{year}-01-01','end':f'{year}-12-31','type':'ANNUAL','fiscalYear':year,'fiscalQuarter':None,'calendarReference':'SOURCE_EXPLICIT_YEAR_END'}
 return None
def flow_window(text,document_period,explicit_ytd_column=False):
 s=fold(text)
 if document_period['type']=='ANNUAL':return dict(document_period)
 six=any(x in s for x in ['sau thang','6 thang','six month','six-month','luy ke','year-to-date'])
 quarter=bool(re.search(r'quy\s*(ii|2)|second quarter|2nd quarter',s))
 start=re.search(fr'01[/.-]0?1[/.-]{document_period["fiscalYear"]}',s)
 if start:six=True
 if six and quarter and not explicit_ytd_column and not start:return None
 if not six and not quarter:return None
 ytd=six and (not quarter or explicit_ytd_column or start is not None)
 return {**document_period,'start':f'{document_period["fiscalYear"]}-01-01' if ytd else f'{document_period["fiscalYear"]}-04-01','type':'YTD' if ytd else 'QUARTER'}

def full_text(p,key):return ' '.join(g['text'] for g in lines(p.get(key,[])))
def numbers(group):
 out=[]
 for w in group['words']:
  merged=w['width']>0.30 and bool(re.search(r'[0-9][.,][0-9]{3}',w['text']))
  if merged:
   for index,t in enumerate(w['text'].split()):
    if re.fullmatch(r'\(?-?\d[\d.,]*\)?',t) and (len(re.sub(r'\D','',t))>=4 or t=='0'):out.append({**w,'lexical':t,'tokenIndexWithinRegion':index,'geometryPrecision':'REGION_ONLY'})
   continue
  if w['x']<0.43:continue
  # A Vision region can contain several columns; such merged regions require exception review.
  t=w['text'].replace('−','-').replace('–','-').strip()
  if re.fullmatch(r'\(?-?\d[\d.,]*\)?',t):
   if len(re.sub(r'\D','',t))>=4 or t=='0':out.append({**w,'lexical':t})
 return out

def numeric_value(s):
 negative=s.startswith('(') or s.startswith('-');s=s.strip('()-')
 if re.fullmatch(r'\d{1,3}(?:\.\d{3})+',s) or re.fullmatch(r'\d{1,3}(?:,\d{3})+',s):value=s.replace('.','').replace(',','')
 elif re.fullmatch(r'\d+',s):value=s
 else:return None
 return ('-' if negative else '')+value

def identify(group):
 text=fold(group['text']);caption=' '.join(w['text'] for w in group['words'] if w['x']<0.62 and not re.fullmatch(r'\(?-?\d[\d.,]*\)?',w['text']));caption=re.sub(r'(?:\s+\(?-?\d[\d.,]*\)?)+$','',caption);caption=re.sub(r'\([^)]*[0-9][^)]*\)','',caption);caption=re.sub(r'^(?:[IVX]+|[0-9]+|[A-Z])\.?\s+','',caption);caption=re.sub(r'\s+[0-9.,]+$','',caption);caption=compact(caption)
 for item,alternatives in CAPTIONS.items():
  for a in alternatives:
   if compact(a)==caption:
    # Prevent shorter total-profit caption admitting parent profit or tax expense.
    if item=='NET_INCOME' and any(compact(x) in caption for x in ['cong ty me','co dong','attributable']):continue
    if item=='REVENUE' and 'giamtru' in caption:continue
    if item=='BANK_GROSS_CUSTOMER_LOANS' and 'gross' not in text and not re.match(r'^1\s',group['text']):continue
    return item,a
 return None

MONTH_NAMES={'january':'01','february':'02','march':'03','april':'04','may':'05','june':'06','july':'07','august':'08','september':'09','october':'10','november':'11','december':'12'}
def stock_date_columns(groups,row_y,end):
 candidates=[]
 expression=r'(?P<day>\d{1,2})\s*(?:[/.-]\s*(?P<month>\d{1,2})\s*[/.-]|thang\s*(?P<vm>\d{1,2})\s*nam|(?P<em>'+ '|'.join(MONTH_NAMES)+r'))\s*(?P<year>20\d{2})'
 for group in groups:
  if group['cy']>=row_y:continue
  words=[w for w in group['words'] if w['x']>0.43];tokens=[fold(w['text']) for w in words];text=' '.join(tokens);matches=list(re.finditer(expression,text))
  if len(matches)<2:continue
  remainder=re.sub(expression,'',text)
  remainder=re.sub(r'vnd|dong|as at|tai ngay|ngay|date|thuyet minh|thuyet|minh|ma so|notes|note|code|chi tieu|\W','',remainder)
  if remainder:continue
  offsets=[];offset=0
  for token in tokens:offsets.append((offset,offset+len(token)));offset+=len(token)+1
  columns=[];date_order=[]
  for match in matches:
   month=match.group('month') or match.group('vm') or MONTH_NAMES[match.group('em')]
   date=f'{match.group("year")}-{int(month):02d}-{int(match.group("day")):02d}';date_order.append(date)
   selected=[w for w,(start,finish) in zip(words,offsets) if start<match.end() and finish>match.start()]
   if date==end and selected:columns.append((min(w['x'] for w in selected)+max(w['x']+w['width'] for w in selected))/2)
  if columns:candidates.append((group['cy'],{'positions':columns,'dates':date_order,'headerY':group['cy']}))
 return max(candidates,key=lambda c:c[0])[1] if candidates else None

UNIT_MARKERS=[('trieu vnd','MILLION_CURRENCY'),('trieu dong','MILLION_CURRENCY'),('vnd million','MILLION_CURRENCY'),('million vnd','MILLION_CURRENCY'),('ty dong','BILLION_CURRENCY'),('ty vnd','BILLION_CURRENCY'),('billion vnd','BILLION_CURRENCY'),('vnd billion','BILLION_CURRENCY'),("vnd'000",'THOUSAND_CURRENCY'),('vnd’000','THOUSAND_CURRENCY'),('000 vnd','THOUSAND_CURRENCY'),('nghin dong','THOUSAND_CURRENCY'),('ngan dong','THOUSAND_CURRENCY'),('nghin vnd','THOUSAND_CURRENCY'),('1.000 dong','THOUSAND_CURRENCY'),('1,000 dong','THOUSAND_CURRENCY')]
def explicit_unit_text(text):
 s=fold(text);s=re.sub(r'^(?:thuyet minh|thuyet|minh|ma so|notes|note|code|chi tieu)\s+','',s);c=compact(s)
 header=bool(re.match(r'^(don vi(?: tinh)?|dvt|units?|currency)(?:[:.\s(]|$)',s))
 clean=re.sub(r'[\s():.]','',s)
 isolated=clean in ['vnd','vndvnd','vndvndvnd','dong','vietnamdong','vietnamesedong'] or any(c.startswith(compact(marker)) for marker,_ in UNIT_MARKERS)
 if not header and not isolated:return None
 if any(currency in c for currency in ['usd','eur','jpy']) or 'million' in c and 'billion' in c:return None
 found={unit for marker,unit in UNIT_MARKERS if compact(marker) in c}
 if len(found)>1:return None
 if found:return next(iter(found))
 if any(scale in c for scale in ['000','million','billion','trieu','nghin','ngan']):return None
 if 'vnd' in c or 'dong' in c:
  if any(currency in c for currency in ['usd','eur','jpy']):return None
  return 'CURRENCY'
 return None
def declared_unit(groups,row_y):
 found=[(g['cy'],explicit_unit_text(g['text'])) for g in groups if g['cy']<row_y and len(g['text'])<160]
 # Unit words under current/comparative date columns may share a row with the Notes label.
 for g in groups:
  if g['cy']>=row_y:continue
  text=' '.join(w['text'] for w in g['words'] if w['x']>0.55);c=compact(text)
  residual=c
  for marker,_ in sorted(UNIT_MARKERS,key=lambda m:len(compact(m[0])),reverse=True):residual=residual.replace(compact(marker),'')
  residual=residual.replace('vnd','').replace('dong','')
  if c and not residual:found.append((g['cy'],explicit_unit_text(text)))
 found=[f for f in found if f[1] is not None]
 return max(found,key=lambda f:f[0]) if found else None

PRIMARY_TITLES={
 'BALANCE':['baocaotinhhinhtaichinh','bangcandoiketoan','baocaocandoiketoan','balancesheet','statementoffinancialposition'],
 'INCOME':['baocaoketquahoatdong','baocaoketquakinhdoanh','incomestatement','statementofincome','statementofprofitorloss'],
 'CASH_FLOW':['baocaoluuchuyentiente','cashflowstatement','statementofcashflows','statementofcashflow']}
def primary_kinds(page,key):
 found=set()
 for g in lines([w for w in page[key] if w['y']<0.5]):
  title=compact(g['text'])
  for prefix in ['condensedconsolidatedinterim','condensedconsolidated','consolidatedinterim','interimconsolidated','consolidated','interim']:
   if title.startswith(prefix):title=title[len(prefix):];break
  for kind,heads in PRIMARY_TITLES.items():
   if any(title.startswith(head) for head in heads):found.add(kind)
 return found

def reconcile():
 (B/'mapping-caption-dictionary.json').write_text(json.dumps({'version':'exact-source-caption-v1','captions':CAPTIONS,'codes':{k:sorted(v) for k,v in CODES.items()},'policy':'EXACT_ALTERNATIVES_ONLY_NO_FUZZY_DEFINITION_OR_CODE_INFERENCE'},ensure_ascii=False,indent=2)+'\n')
 identities=json.load(open('docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json'))['identities'];ids={i['ticker']:i for i in identities};selected=json.load(open(B/'selected-documents.json'));results=[];exceptions=[];cells=[];sectors=[]
 existingSectors={s['ticker']:s for s in json.load(open('docs/fundamental-data-engine/evidence/2026-10-10-di123-sectors.json'))['assignments']}
 for d in selected:
  pages=[]
  for f in sorted((B/'ocr').glob(d['bodyHash']+'-p*.json')):
   p=json.load(open(f))
   if 'error' not in p:
    if p.get('engineA','').startswith('APPLE_VISION'):
     p={**p,'passA':p['passB'],'passB':p['passA'],'engineA':p['engineB'],'engineB':p['engineA']}
    pages.append(p)
  pages.sort(key=lambda x:x['page']);a=' '.join(full_text(p,'passA') for p in pages[:12]);b=' '.join(full_text(p,'passB') for p in pages[:12]);fa,fb=fold(a),fold(b);pa,pb=get_period(a),get_period(b)
  cores=name_cores(ids[d['ticker']]);nameA=' '.join(w['text'] for p in pages for w in p['passA'] if p['page']<=3 or w['y']<0.2);nameB=' '.join(w['text'] for p in pages for w in p['passB'] if p['page']<=3 or w['y']<0.2);issuer=any(c in compact(nameA) and c in compact(nameB) for c in cores)
  statementKinds=set();primaryScope=False;primaryIssuer=False;balanceHeaderA=None;balanceHeaderB=None;balancePage=None;identityPages=[];scopePages=[];typePages=[]
  for page in pages[:12]:
   sa,sb=fold(full_text(page,'passA')),fold(full_text(page,'passB'))
   for kind,markers in [('BALANCE',['tinh hinh tai chinh','can doi ke toan','financial position','balance sheet']),('INCOME',['ket qua hoat dong','income statement','statement of income','profit or loss']),('CASH_FLOW',['luu chuyen tien te','cash flow'])]:
    if kind in primary_kinds(page,'passA') and kind in primary_kinds(page,'passB'):
     statementKinds.add(kind);typePages.append(page['page'])
     if kind=='BALANCE' and balanceHeaderA is None:balanceHeaderA=full_text(page,'passA');balanceHeaderB=full_text(page,'passB');balancePage=page['page']
     def header_identity(key):
      header=lines([w for w in page[key] if w['y']<0.22])
      for g in header:
       text=compact(g['text'].lower().replace('ctcp','cong ty co phan').replace('tmcp','thuong mai co phan'))
       for core in cores:
        if len(core)>=6 and core in text:return True
        # Short names require an exact legal-name header, not a substring such as FPT Online.
        if text in {prefix+core for prefix in ['congtycophan','nganhangthuongmaicophan']} or d['ticker']=='FPT' and text=='fptcorporation':return True
      return False
     if header_identity('passA') and header_identity('passB'):primaryIssuer=True;identityPages.append(page['page'])
     if any(marker in sa and marker in sb for marker in ['hop nhat','consolidated']):primaryScope=True;scopePages.append(page['page'])
  if balanceHeaderA is not None:
   pa=get_period(' '.join(full_text(p,'passA') for p in pages[:4])+' '+balanceHeaderA);pb=get_period(' '.join(full_text(p,'passB') for p in pages[:4])+' '+balanceHeaderB)
  issuer=issuer and primaryIssuer;scope=primaryScope;financial=len(statementKinds)>=2 and any(x in fa and x in fb for x in ['bao cao tai chinh','financial statements']);period=pa if pa==pb else None
  result={**d,'status':'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' if issuer and scope and financial and period else 'EXCEPTION_REVIEW_REQUIRED','issuerAgreement':issuer,'financialAgreement':financial,'scope':'CONSOLIDATED' if scope else None,'period':period,'primaryStatementKinds':sorted(statementKinds),'qualificationMethod':'TWO_INDEPENDENT_SOURCE_PAGE_READERS_EXACT_NAME_CORE_SCOPE_PERIOD_TWO_PRIMARY_STATEMENTS','evidencePages':[p['page'] for p in pages[:12]],'contentEvidencePages':{'ISSUER_IDENTITY':sorted(set(identityPages)),'DOCUMENT_TYPE':sorted(set(typePages)),'REPORTING_SCOPE':sorted(set(scopePages)),'REPORTING_PERIOD':sorted(set([p['page'] for p in pages[:4]]+([balancePage] if balancePage else [])))},'securityId':ids[d['ticker']]['securityId'],'auditStatus':'REVIEWED' if any(x in fa and x in fb for x in ['bao cao soat xet','review report','report on review']) else 'AUDITED' if any(x in fa and x in fb for x in ['bao cao kiem toan doc lap','independent auditor']) else 'UNKNOWN','accountingBasis':'VAS' if any(x in fa and x in fb for x in ['chuan muc ke toan viet nam','vietnamese accounting standards']) else 'UNKNOWN'}
  results.append(result)
  # Classification requires explicit issuer/regulator business evidence, not financial table structure or name.
  for p in pages:
   ta,tb=fold(full_text(p,'passA')),fold(full_text(p,'passB'))
   source=existingSectors[d['ticker']]['sourceSector'];sector=None;method=None
   if source=='Tài chính':
    ca,cb=compact(ta),compact(tb)
    # A regulator addressed in a cover letter is not the issuer's business classification.
    bankLicense=bool(re.search(r'(?:gpnhnn|nhgp)',ca)) and bool(re.search(r'(?:gpnhnn|nhgp)',cb))
    securitiesLicense=any(x in ca and x in cb for x in ['gpubck','gphdkd','gpdcubck'])
    def primary_license(text,needle):
     for hit in re.finditer(needle,text):
      context=text[max(0,hit.start()-500):hit.end()+100]
      if any(core in context for core in cores):return True
      # Exact issuer heading + explicit general-information section + first parent license.
      # A subsidiary table does not meet this rule; the bank license number is not inferred from a name.
      prefix=text[:hit.start()]
      if hit.start()==next(re.finditer(needle,text)).start() and any(core in prefix for core in cores) and any(marker in prefix for marker in ['thongtinkhaiquat','generalinformation']) and not any(marker in prefix for marker in ['congtycon','subsidiaries','congtylienket']):return True
     return False
    if bankLicense and primary_license(ca,r'gpnhnn|nhgp') and primary_license(cb,r'gpnhnn|nhgp'):
     sector='BANK';method='EXPLICIT_ISSUER_BANKING_LICENSE_CONTEXT'
    elif securitiesLicense and primary_license(ca,r'gpubck|gphdkd|gpdcubck') and primary_license(cb,r'gpubck|gphdkd|gpdcubck'):
     sector='SECURITIES';method='EXPLICIT_ISSUER_SECURITIES_LICENSE_CONTEXT'
   if sector:sectors.append({'ticker':d['ticker'],'securityId':result['securityId'],'projectSector':sector,'bodyHash':d['bodyHash'],'documentId':d['documentId'],'page':p['page'],'method':method,'evidenceTextA':full_text(p,'passA'),'evidenceTextB':full_text(p,'passB'),'confidence':'HIGH','status':'TECHNICALLY_VALIDATED_REVIEW_CANDIDATE'});break
  if result['status']=='EXCEPTION_REVIEW_REQUIRED':exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'type':'DOCUMENT_IDENTITY_SCOPE_OR_PERIOD_EXCEPTION','issuer':issuer,'scope':scope,'financial':financial,'periodA':pa,'periodB':pb});continue
  for p in pages:
   la,lb=lines(p['passA']),lines(p['passB']);ta,tb=fold(full_text(p,'passA')),fold(full_text(p,'passB'))
   if not any(x in ta and x in tb for x in ['hop nhat','consolidated']):continue
   # Never use a note table merely because a caption resembles a primary statement row.
   kinds=primary_kinds(p,'passA')&primary_kinds(p,'passB');iscf='CASH_FLOW' in kinds;isincome='INCOME' in kinds;isbalance='BALANCE' in kinds
   for ga in la:
    match=identify(ga)
    if not match:continue
    item,caption=match
    banknote=item.startswith('BANK_') and any(x in ta and x in tb for x in ['thuyet minh bao cao','notes to the financial'])
    if not (banknote or (item in CF and iscf) or(item in STOCK and isbalance) or(item not in STOCK|CF and isincome)):continue
    if item.startswith('BANK_') and existingSectors[d['ticker']]['sourceSector']!='Tài chính':continue
    ua,ub=declared_unit(la,ga['cy']),declared_unit(lb,ga['cy'])
    if ua is None or ub is None or ua[1]!=ub[1]:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'UNIT_SCALE_NOT_INDEPENDENTLY_ESTABLISHED'});continue
    unit=ua[1]
    na=numbers(ga)
    if not na:continue
    candidates=[g for g in lb if abs(g['cy']-ga['cy'])<0.013 and identify(g) and identify(g)[0]==item]
    if len(candidates)!=1:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'CAPTION_OR_ROW_GEOMETRY_DISAGREEMENT'});continue
    gb=candidates[0];nb=numbers(gb)
    if not nb:continue
    # Current balance first column. Flow requires explicit year/YTD header near column; quarter+YTD must be distinguished.
    columns=na;explicitYtdColumn=False;cellPeriod=period
    if item in STOCK:
     headerA=stock_date_columns(la,ga['cy'],period['end']);headerB=stock_date_columns(lb,ga['cy'],period['end'])
     positions=headerA['positions'] if headerA is not None and headerB is not None and headerA['dates']==headerB['dates'] else []
     if not positions:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'STOCK_DATE_COLUMN_HEADER_NOT_ESTABLISHED'});continue
     columns=[n for n in na if min(abs(n['x']+n['width']/2-h) for h in positions)<0.075]
     if len(columns)!=1:continue
    if item not in STOCK:
     header=[g for g in la if g['cy']<ga['cy'] and re.search(str(period['fiscalYear']),g['text']) and g['cy']>0.08]
     positions=[]
     if header:
      last=max(g['cy'] for g in header);header=[g for g in header if abs(g['cy']-last)<0.014]
     for g in header:
      for w in g['words']:
       if re.search(str(period['fiscalYear']),w['text']) and w['x']>0.43:positions.append(w['x']+w['width']/2)
     if not positions:continue
     possible=[n for n in na if min(abs((n['x']+n['width']/2)-h) for h in positions)<0.075]
     if len(possible)>1:
      # Source header must explicitly identify cumulative/year-to-date/six-month column for YTD documents.
      ytd=[w for g in la if g['cy']<ga['cy'] for w in g['words'] if any(x in fold(w['text']) for x in ['luy','six-month','year-to-date']) and w['x']>0.43]
      if not ytd:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'QUARTER_VS_YTD_COLUMN_UNRESOLVED'});continue
      possible=[n for n in possible if any(abs(n['x']-w['x'])<0.2 for w in ytd)]
      explicitYtdColumn=len(possible)==1
     if len(possible)!=1:continue
     columns=possible
     wa,wb=flow_window(ta,period,explicitYtdColumn),flow_window(tb,period,explicitYtdColumn)
     if wa is None or wa!=wb:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'FLOW_WINDOW_NOT_INDEPENDENTLY_ESTABLISHED'});continue
     cellPeriod=wa
    n=columns[0]
    if any(v.get('geometryPrecision')=='REGION_ONLY' for v in nb):
     if len(na)==len(nb) and [numeric_value(v['lexical']) for v in na]==[numeric_value(v['lexical']) for v in nb]:matched=[nb[na.index(n)]]
     else:matched=[]
    else:matched=[v for v in nb if abs(v['x']-n['x'])<0.05 or abs(v['x']+v['width']-n['x']-n['width'])<0.04]
    if len(matched)!=1:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'NUMERIC_COLUMN_GEOMETRY_DISAGREEMENT'});continue
    m=matched[0];v1,v2=numeric_value(n['lexical']),numeric_value(m['lexical'])
    if v1 is None or v1!=v2 or min(n['confidence'],m['confidence'])<0.80:
     exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'TWO_ENGINE_CELL_DISAGREEMENT_OR_LOW_CONFIDENCE','lexicalA':n['lexical'],'lexicalB':m['lexical']});continue
    cells.append({'ticker':d['ticker'],'securityId':result['securityId'],'documentId':d['documentId'],'bodyHash':d['bodyHash'],'page':p['page'],'itemId':'CASH_CAPEX_REPORTED' if item=='CAPEX' else item,'sourceCaption':ga['text'],'captionAlternative':caption,'lexicalValue':n['lexical'],'verifiedCanonicalInteger':v1,'verificationLexicalValue':m['lexical'],'unit':unit,'unitHeaderYA':ua[0],'unitHeaderYB':ub[0],'currency':'VND','scope':'CONSOLIDATED','period':cellPeriod,'periodType':'INSTANT' if item in STOCK else cellPeriod['type'],'columnX':n['x'],'rowY':ga['cy'],'verificationGeometry':m.get('geometryPrecision','WORD_OR_REGION'),'verificationTokenIndex':m.get('tokenIndexWithinRegion'),'extractionMethod':p['engineA'],'verificationMethod':p['engineB'],'renderSha256':p['renderSha256'],'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','revisionStatus':'ORIGINAL_OR_RESTATEMENT_RELATIONSHIP_REQUIRES_COMPARABLE_CHECK'})
 (B/'qualifications.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n');(B/'verified-cells.json').write_text(json.dumps(cells,ensure_ascii=False,indent=2)+'\n');(B/'extraction-exceptions.json').write_text(json.dumps(exceptions,ensure_ascii=False,indent=2)+'\n');(B/'sector-business-evidence.json').write_text(json.dumps(sectors,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'qualified':sum(x['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' for x in results),'verifiedCells':len(cells),'exceptions':len(exceptions),'financialSectorClassifications':len({x['ticker'] for x in sectors})}))
if __name__=='__main__':reconcile()
