"""Exact caption/geometry candidate reconciliation. No fuzzy captions or source winner."""
import json,pathlib,re,unicodedata,hashlib,decimal,datetime,os
B=pathlib.Path(os.environ.get('VN30_EVIDENCE_WORK','data/initialization-08b-final-work'))
def fold(s):return re.sub(r'\s+',' ',''.join(c for c in unicodedata.normalize('NFD',s).lower() if unicodedata.category(c)!='Mn').replace('đ','d')).strip()
def compact(s):return re.sub('[^a-z0-9]','',fold(s))
def affirmative_vas_preparation(text):
 t=fold(text)
 current_declarations=[
  ('tuyen bo ve tuan thu','bao cao tai chinh hop nhat nay duoc lap theo cac chuan muc ke toan viet nam, che do ke toan doanh nghiep viet nam'),
  ('tuyen bo tuan thu','bao cao tai chinh hop nhat giua nien do duoc lap theo cac chuan muc ke toan viet nam, che do ke toan viet nam ap dung cho cac to chuc tin dung'),
  ('tuyen bo tuan thu','ban tong giam doc ngan hang khang dinh bao cao tai chinh hop nhat dinh kem duoc lap phu hop voi cac chuan muc ke toan viet nam, he thong ke toan cac to chuc tin dung viet nam'),
  ('statement on compliance with vietnamese accounting standards and systems','management confirms that the company has complied with vietnamese accounting standards and vietnamese enterprise accounting systems'),
 ]
 if any(heading in t and declaration in t for heading,declaration in current_declarations):return True
 explicit_compliance=('tuyen bo ve viec tuan thu chuan muc va che do ke toan' in t and 'tap doan da ap dung cac chuan muc ke toan viet nam' in t and 'cac bao cao tai chinh duoc lap va trinh bay theo dung moi quy dinh cua tung chuan muc' in t)
 enterprise_basis=any(('co so lap bao cao tai chinh hop nhat'+suffix in t and any('bao cao tai chinh hop nhat'+suffix+' kem theo duoc trinh bay bang dong viet nam (vnd), theo nguyen tac gia goc va phu hop voi '+declaration in t for declaration in ['chuan muc ke toan, che do ke toan doanh nghiep viet nam','cac chuan muc ke toan viet nam, che do ke toan doanh nghiep viet nam hien hanh'])) for suffix in ['', ' giua nien do'])
 return explicit_compliance or enterprise_basis or ('co so lap bao cao tai chinh' in t and 'da duoc lap theo cac chuan muc ke toan viet nam' in t) or 'viec lap bao cao tai chinh giua nien do tuan thu theo cac chuan muc ke toan viet nam' in t or ('tom tat cac chinh sach ke toan chu yeu' in t and 'viec lap bao cao tai chinh hop nhat tuan thu theo cac chuan muc ke toan, che do ke toan ap dung cho cac to chuc tin dung tai viet nam' in t) or ('co so lap bao cao tai chinh hop nhat giua nien do' in t and 'bao cao tai chinh hop nhat giua nien do kem theo duoc trinh bay bang dong viet nam (vnd), theo nguyen tac gia goc va phu hop voi chuan muc ke toan, che do ke toan ap dung cho cac to chuc tin dung tai viet nam' in t)
def affirmative_consolidated_audit(text,issuer_cores):
 t=fold(text);clause='chung toi da kiem toan bao cao tai chinh hop nhat dinh kem'
 if clause not in t:return False
 context=t[t.index(clause):].split('trach nhiem cua ban giam doc')[0][:650]
 return ('bao cao kiem toan' in t and 'trach nhiem cua kiem toan vien' in t and 'chung toi tin rang cac bang chung kiem toan ma chung toi thu duoc' in t and any(len(core)>=6 and core in compact(context) for core in issuer_cores))
def lines(words):
 groups=[]
 for w in sorted(words,key=lambda w:w['y']+w['height']/2):
  cy=w['y']+w['height']/2;g=groups[-1] if groups and abs(groups[-1]['cy']-cy)<0.0065 else None
  if g is None:g={'cy':cy,'words':[]};groups.append(g)
  g['words'].append(w)
 for g in groups:g['words'].sort(key=lambda w:w['x']);g['text']=' '.join(w['text'] for w in g['words'])
 return groups
# Exact approved caption alternatives; spelling/diacritics normalization only, no fuzzy matching.
CAPTIONS={
 'BASIC_EPS':['lai co ban tren co phieu (vnd/co phieu)','lai co ban tren co phieu (vnd/co phieu) (dieu chinh lai)','basic earnings per share (vnd/share)','basic earnings per share (vnd per share)'],
 'TOTAL_LIABILITIES_SUPPORTING':['tong no phai tra','no phai tra','total liabilities'],
 'CFI_SUPPORTING':['luu chuyen tien thuan tu hoat dong dau tu','net cash flows from investing activities'],
 'CFF_SUPPORTING':['luu chuyen tien thuan tu hoat dong tai chinh','net cash flows from financing activities'],
 'NET_CASH_CHANGE_SUPPORTING':['luu chuyen tien thuan trong ky','luu chuyen tien thuan trong nam','net cash flows during the period'],
 'BANK_NONPERFORMING_LOANS':['tong no xau','non-performing loans','total non-performing loans'],
 'BANK_LOAN_LOSS_RESERVES':['du phong rui ro cho vay khach hang','provision for losses on loans to customers'],
 'BANK_CURRENT_AND_SAVINGS_DEPOSITS':['current and savings deposits','current and savings accounts'],
 'REVENUE':['doanh thu thuan ve ban hang va cung cap dich vu','doanh thu thuan','net revenue','net sales'],
 'NET_INCOME':['loi nhuan sau thue thu nhap doanh nghiep','loi nhuan sau thue','profit after tax','net profit after tax','loi nhuan sau thue tndn','loi nhuan ke toan sau thue tndn'],
 'NET_INCOME_ATTRIBUTABLE_PARENT':['loi nhuan sau thue cua co dong cong ty me','loi nhuan sau thue cua cong ty me','loi nhuan sau thue thuoc ve co dong cua cong ty me','co dong cua cong ty me','profit attributable to owners of the parent','attributable to shareholders of the parent company','owners of the parent'],
 'NET_INCOME_ATTRIBUTABLE_COMMON':['cac co dong so huu co phieu pho thong cua ngan hang','co dong so huu co phieu pho thong cua ngan hang','profit attributable to common shareholders','profit attributable to ordinary shareholders','loi nhuan phan bo cho co dong so huu co phieu pho thong','loi nhuan thuoc ve co dong so huu co phieu pho thong','loi nhuan thuan thuoc ve co dong pho thong','loi nhuan trong ky phan bo cho cac co dong so huu co phieu pho thong (vnd)','loi nhuan thuan sau thue phan bo cho cac co dong so huu co phieu pho thong (trieu dong)'],
 'COMMON_EQUITY':['von chu so huu thuoc ve co dong pho thong','von chu so huu cua co dong pho thong','equity attributable to ordinary shareholders','common shareholders equity'],
 'TOTAL_ASSETS':['tong cong tai san','tong tai san','tong tai san co','total assets'],
 'TOTAL_EQUITY':['tong von chu so huu','von chu so huu','total equity','equity'],
 'GROSS_PROFIT':['loi nhuan gop ve ban hang va cung cap dich vu','loi nhuan gop','gross profit'],
 'CFO':['luu chuyen tien thuan tu/(su dung vao) hoat dong kinh doanh','luu chuyen tien thuan tu hoat dong kinh doanh','net cash flows from operating activities','net cash from operating activities','net cash generated from operating activities'],
 'CAPEX':['tien chi mua sam, xay dung tai san co dinh va cac tai san dai han khac','tien chi de mua sam xay dung tscd va cac tai san dai han khac','tien chi de mua sam, xay dung tscd va cac tai san dai han khac','purchases and construction of fixed assets and other long-term assets','payments for acquisition and construction of fixed assets and other long-term assets'],
 'CURRENT_ASSETS':['tai san ngan han','current assets'], 'CURRENT_LIABILITIES':['no ngan han','current liabilities'],
 'INVENTORY':['hang ton kho','inventories'], 'RECEIVABLES':['cac khoan phai thu ngan han','short-term receivables'],
 'BANK_GROSS_CUSTOMER_LOANS':['cho vay khach hang','loans to customers','gross loans to customers'], 'BANK_CUSTOMER_DEPOSITS':['tien gui cua khach hang','tien gui khach hang','deposits from customers','customer deposits'],
 'BANK_NET_INTEREST_INCOME':['thu nhap lai thuan','net interest income'], 'BANK_NET_FEE_INCOME':['lai thuan tu hoat dong dich vu','net fee and commission income'],
 'BANK_OPERATING_EXPENSES':['chi phi hoat dong','operating expenses'], 'BANK_OPERATING_INCOME':['tong thu nhap hoat dong','total operating income']}
CODES={'REVENUE':{'10'},'NET_INCOME':{'60'},'NET_INCOME_ATTRIBUTABLE_PARENT':{'61'},'TOTAL_ASSETS':{'270'},'GROSS_PROFIT':{'20'},'CFO':{'20'},'CAPEX':{'21'},'CURRENT_ASSETS':{'100'},'CURRENT_LIABILITIES':{'310'},'INVENTORY':{'140'},'RECEIVABLES':{'130'},'TOTAL_EQUITY':{'400'}}
CF={'CFO','CAPEX','CFI_SUPPORTING','CFF_SUPPORTING','NET_CASH_CHANGE_SUPPORTING'};STOCK={'BANK_NONPERFORMING_LOANS','BANK_LOAN_LOSS_RESERVES','BANK_CURRENT_AND_SAVINGS_DEPOSITS','TOTAL_LIABILITIES_SUPPORTING','TOTAL_ASSETS','TOTAL_EQUITY','COMMON_EQUITY','CURRENT_ASSETS','CURRENT_LIABILITIES','INVENTORY','RECEIVABLES','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS'}
def name_cores(identity):
 out=[]
 names=[identity['securityName'],identity.get('alternativeNameFromUndatedEndpoint') or '']
 aliasFile=B/'issuer-name-alias-source-results.json'
 if aliasFile.exists():
  names.extend(a['exactName'] for a in json.load(open(aliasFile))['aliases'] if a['ticker']==identity['ticker'] and a['sourceEvidenceStatus']=='RETAINED_PUBLIC_PRIMARY_BYTES' and a['sourceReceipt']['exactNameInPublicBody'] and a['sourceReceipt']['tickerInPublicBody'])
 documentAliases=B/'issuer-document-alias-evidence.json'
 if documentAliases.exists():
  for alias in json.load(open(documentAliases))['aliases']:
   if alias['ticker']!=identity['ticker']:continue
   proofFile=pathlib.Path(alias['sourcePageFile']);proof=json.loads(proofFile.read_text())
   assert alias['securityId']==identity['securityId'] and alias['relationship']=='EXPLICIT_FORMER_ISSUER_LEGAL_NAME' and alias['securityIdentityRegenerated'] is False
   assert hashlib.sha256(proofFile.read_bytes()).hexdigest()==alias['sourcePageSha256'] and proof['bodyHash']==alias['bodyHash'] and proof['page']==alias['page']
   assert proof['engineA']!=proof['engineB'] and all(compact(alias['sourceMarker']) in compact(full_text(proof,key)) for key in ['passA','passB'])
   assert hashlib.sha256((B/(alias['bodyHash']+'.pdf')).read_bytes()).hexdigest()==alias['bodyHash']
   names.append(alias['exactName'])
 for name in names:
  n=fold(name).replace('ctcp','cong ty co phan').replace('tmcp','thuong mai co phan').replace('tp.hcm','thanh pho ho chi minh')
  for pre in ['tong cong ty co phan ','cong ty co phan ','ngan hang thuong mai co phan ','tong cong ty ']:
   if n.startswith(pre):n=n[len(pre):]
  n=re.sub(r'\s*-?\s*cong ty co phan$','',n).strip();
  if n.startswith('tap doan '):out.append(compact(n))
  n=n.replace('tap doan ','')
  if n:out.append(compact(n))
 return sorted(set(out))
def get_period(s):
 s=fold(s)
 # Literal beginning/end reporting range establishes the source window before
 # governance appointments, legal dates or comparative columns are considered.
 date=r'(\d{1,2})(?:\s+thang\s+|[/.-])(\d{1,2})(?:\s+nam\s+|[/.-])(202[2-6])'
 stated=re.search(r'(?:cho (?:ky|giai doan)(?: ke toan| tai chinh)? tu ngay|cho giai doan tu ngay|cho ky ke toan tu ngay)\s*'+date+r'\s*(?:den ngay|den)\s*'+date,s)
 if stated:
  day1,month1,year1,day2,month2,year2=map(int,stated.groups())
  if year1==year2 and day1==month1==1 and (month2,day2) in [(3,31),(6,30),(9,30),(12,31)]:
   quarter=month2//3;kind='ANNUAL' if quarter==4 else 'QUARTER' if quarter==1 else 'YTD'
   return {'start':f'{year1}-01-01','end':f'{year2}-{month2:02d}-{day2:02d}','type':kind,'fiscalYear':year2,'fiscalQuarter':None if kind=='ANNUAL' else quarter,'calendarReference':'SOURCE_EXPLICIT_YEAR_END' if kind=='ANNUAL' else 'SOURCE_EXPLICIT_CALENDAR_WINDOW'}
 # A stated reporting window outranks board appointment/legal narrative dates.
 explicitAnnual=re.search(r'(?:cho nam tai chinh ket thuc ngay|for (?:the )?(?:financial )?year ended)\s+(?:31\s+thang\s+12\s+nam|31\s+december|december\s+31,?)\s+(202[2-6])',s)
 explicitInterim=re.search(r'(?:cho ky hoat dong (?:6|sau) thang ket thuc ngay|for (?:the )?(?:6|six)[ -]month period ended)\s+(?:30\s+thang\s+0?6\s+nam|30\s+june|june\s+30,?)\s+(202[2-6])',s)
 if explicitInterim and (not explicitAnnual or explicitInterim.start()<explicitAnnual.start()):
  year=int(explicitInterim.group(1));return {'start':f'{year}-01-01','end':f'{year}-06-30','type':'YTD','fiscalYear':year,'fiscalQuarter':2,'calendarReference':'SOURCE_EXPLICIT_CALENDAR_WINDOW'}
 if explicitAnnual:
  year=int(explicitAnnual.group(1));return {'start':f'{year}-01-01','end':f'{year}-12-31','type':'ANNUAL','fiscalYear':year,'fiscalQuarter':None,'calendarReference':'SOURCE_EXPLICIT_YEAR_END'}
 for year in [2026,2025,2024,2023,2022]:
  # Recognize newer Q1/Q3 explicitly so a prior year-end balance comparison
  # cannot turn a quarterly filing into a fictitious annual report.
  for quarter,month,day,english in [(1,3,31,'march'),(3,9,30,'september')]:
   roman='i' if quarter==1 else 'iii'
   if not re.search(fr'quy\s*(?:{roman}|{quarter})(?:\b|\s)|(?:first|third|1st|3rd) quarter|three.month|nine.month|ba thang|chin thang|9 thang',s):continue
   if re.search(fr'({day}\s*[/.-]\s*0?{month}\s*[/.-]\s*{year}|{day}\s+thang\s+0?{month}\s+nam\s+{year}|{day}\s+{english}\s+{year}|{english}\s+{day},?\s+{year})',s):
    return {'start':f'{year}-01-01','end':f'{year}-{month:02d}-{day}','type':'YTD' if quarter==3 else 'QUARTER','fiscalYear':year,'fiscalQuarter':quarter,'calendarReference':'SOURCE_EXPLICIT_CALENDAR_WINDOW'}
  if re.search(fr'(30\s*[/.-]\s*0?6\s*(?:[/.-]|\s)\s*{year}|30\s+thang\s+0?6\s+nam\s+{year}|30\s+june\s+{year}|june\s+30,?\s+{year})',s):
   six=any(x in s for x in ['sau thang','6 thang','six month','six-month','6-month','6 month','luy ke','year-to-date'])
   quarter=bool(re.search(r'quy\s*(ii|2)|second quarter|2nd quarter|quarter\s*(?:ii|2)\b',s))
   if not six and not quarter:return None
   return {'start':f'{year}-01-01' if six else f'{year}-04-01','end':f'{year}-06-30','type':'YTD' if six else 'QUARTER','fiscalYear':year,'fiscalQuarter':2,'calendarReference':'SOURCE_EXPLICIT_CALENDAR_WINDOW'}
  if re.search(fr'(31\s*[/.-]\s*12\s*[/.-]\s*{year}|31\s+thang\s+12\s+nam\s+{year}|31\s+december\s+{year}|december\s+31,?\s+{year})',s):return {'start':f'{year}-01-01','end':f'{year}-12-31','type':'ANNUAL','fiscalYear':year,'fiscalQuarter':None,'calendarReference':'SOURCE_EXPLICIT_YEAR_END'}
 return None
def agreed_primary_interim_window(balance_a,balance_b,flow_a,flow_b):
 if not all(isinstance(t,str) and t.strip() for t in [balance_a,balance_b,flow_a,flow_b]):return None
 a,b=get_period(balance_a+' '+flow_a),get_period(balance_b+' '+flow_b)
 return a if a is not None and a==b and a['type'] in ['QUARTER','YTD'] else None
def flow_window(text,document_period,explicit_ytd_column=False):
 s=fold(text)
 if document_period['type']=='ANNUAL':
  # A December balance-sheet date does not make every income column annual.
  # Mixed literal quarter/year ranges need an exact per-column window proof.
  # Do not label the first quarter column with the document's annual window.
  year=document_period['fiscalYear']
  if re.search(fr'(?<!\d)0?1[/.-](?:0?[47]|10)[/.-]{year}(?!\d)',s):return None
  return dict(document_period)
 quarter=document_period['fiscalQuarter'];year=document_period['fiscalYear']
 if quarter not in [1,2,3]:return None
 # A literal reporting range is stronger than an ambiguous quarter/YTD label.
 stated=get_period(s)
 if stated is not None and stated['end']==document_period['end'] and re.search(r'cho (?:ky|giai doan).*tu ngay',s):
  return {**document_period,'start':stated['start'],'type':stated['type']}
 cumulative=any(x in s for x in ['luy ke','year-to-date','accumulated'])
 month_words={1:['ba thang','3 thang','three month','three-month'],2:['sau thang','6 thang','six month','six-month','6-month','6 month'],3:['chin thang','9 thang','nine month','nine-month','9-month']}[quarter]
 cumulative=cumulative or any(x in s for x in month_words)
 roman={1:'i',2:'ii',3:'iii'}[quarter];english={1:'first',2:'second',3:'third'}[quarter]
 quarterly=bool(re.search(fr'quy\s*(?:{roman}|{quarter})\b|{english} quarter|quarter\s*(?:{roman}|{quarter})\b',s))
 explicit_start=re.search(fr'(?<!\d)0?1[/.-]0?1[/.-]{year}(?!\d)',s)
 if explicit_start:cumulative=True
 if quarter==1:
  if not cumulative and not quarterly:return None
  return {**document_period,'start':f'{year}-01-01','type':'QUARTER'}
 if cumulative and quarterly and not explicit_ytd_column and not explicit_start:return None
 if not cumulative and not quarterly:return None
 ytd=cumulative and (not quarterly or explicit_ytd_column or explicit_start is not None)
 return {**document_period,'start':f'{year}-01-01' if ytd else f'{year}-{(quarter-1)*3+1:02d}-01','type':'YTD' if ytd else 'QUARTER'}

def annual_document_heading_period(page,key):
 # Scanned binding bars/underscores can attract the final year into the
 # previous OCR line. Read only the printed financial-document heading;
 # retain every original word in the source proof and do not edit its text.
 words=[w for w in page.get(key,[]) if w['y']<.22 and re.search(r'[A-Za-zÀ-ỹ0-9]',w['text'])]
 text=fold(' '.join(g['text'] for g in lines(words)))
 if 'bao cao tai chinh hop nhat' not in text or 'cho nam tai chinh ket thuc ngay' not in text:return None
 dates=re.findall(r'31\s+thang\s+12\s+nam\s+(20\d{2})',text)
 if len(set(dates))!=1:return None
 result=get_period(text)
 return result if result and result['end']==dates[0]+'-12-31' else None

def full_text(p,key):
 cache='_text_'+key
 if cache not in p:p[cache]=' '.join(g['text'] for g in lines(p.get(key,[])))
 return p[cache]
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

CAPTION_LOOKUP={}
for item,alternatives in CAPTIONS.items():
 for alternative in alternatives:CAPTION_LOOKUP.setdefault(compact(alternative),[]).append((item,alternative))
def identify(group):
 # Printed note references such as 16(a) are separate table metadata, not
 # part of the accounting caption. Preserve the original source row for proof.
 group={**group,'words':[w for w in group['words'] if not re.fullmatch(r'[0-9]+\([a-z]\)',w['text'])]}
 text=fold(group['text']);amountXs=[w['x'] for w in group['words'] if w['x']>0.43 and re.fullmatch(r'\(?-?\d[\d.,]*\)?',w['text']) and len(re.sub(r'\D','',w['text']))>=4];captionEnd=min(amountXs) if amountXs else 0.85;caption=' '.join(w['text'] for w in group['words'] if w['x']<captionEnd);caption=re.sub(r'\([^)]*[0-9][^)]*\)','',caption);caption=re.sub(r'(?:\s+\(?-?\d[\d.,]*\)?)+$','',caption);
 for _ in range(3):caption=re.sub(r'^(?:[IVX]+|[0-9]+|[A-Z])\.?\s+(?:\|\s*)?','',caption)
 caption=re.sub(r'\b(?:[IVX]+\.[0-9]+(?:\([a-z]\))?|[IVX]+\([0-9]+\))\b','',caption);caption=re.sub(r'\s+[0-9.,]+$','',caption);caption=re.sub(r'(?<![A-Za-z])\b[0-9]+(?:[.,][0-9]+)*\b','',caption);caption=compact(caption)
 for item,a in CAPTION_LOOKUP.get(caption,[]):
    # Exact captions remain mandatory; a code only distinguishes aggregate/subrow.
    codes={w['text'] for w in group['words'] if w['x']<captionEnd and re.fullmatch(r'[1-4]\d{2}',w['text'])}
    if item=='INVENTORY' and codes and '140' not in codes:continue
    if item=='TOTAL_EQUITY' and codes and '400' not in codes:continue
    if item=='CURRENT_LIABILITIES' and codes and '310' not in codes:continue
    if item=='NET_INCOME' and any(x in caption for x in ['congtyme','codong','attributable']):continue
    if item=='REVENUE' and 'giamtru' in caption:continue
    if item=='BANK_GROSS_CUSTOMER_LOANS' and 'gross' not in text and not re.match(r'^1\.?\s',group['text']):continue
    return item,a
 return None

def identify_ordinary_profit_note(group,texts):
 # Contextual source definition, never a global shareholder/parent alias.
 if not all('lai co ban tren co phieu' in t and 'thuyet minh bao cao' in t and any(s in compact(t) for s in ['codongsohuucophieuphothong','codongphothong']) for t in texts):return None
 amount_x=[w['x'] for w in group['words'] if w['x']>.43 and re.fullmatch(r'\(?-?\d[\d.,]*\)?',w['text']) and len(re.sub(r'\D','',w['text']))>=4]
 caption_end=min(amount_x) if amount_x else .85
 caption=fold(' '.join(w['text'] for w in group['words'] if w['x']<caption_end))
 for suffix in ['(trieu vnd)','(trieu dong)','(vnd)']:
  if caption.endswith(suffix):caption=caption[:-len(suffix)].strip();break
 return ('NET_INCOME_ATTRIBUTABLE_COMMON',caption) if compact(caption)=='loinhuanthuanphanbochocaccodong' else None

def statement_rows(groups,caption_right_limit=.53):
 # Join only exact-caption continuations adjacent to one numeric statement row.
 # Both readers apply this independently; source words and numeric geometry survive.
 result=[]
 for index,group in enumerate(groups):
  # A bank's pre-working-capital subtotal can wrap after an otherwise exact
  # CFO caption. Preserve its following qualifier before any caption match.
  following=groups[index+1] if index+1<len(groups) else None
  match=identify(group)
  qualifiers={'truocnhungthaydoivetaisanvavonluudong','truocnhungthaydoivevonluudong','beforechangesinworkingcapital'}
  qualifier_words=[w for w in following['words'] if w['x']<caption_right_limit] if following else []
  # Match the printed caption column only; marginal stamps are not captions.
  if match and match[0]=='CFO' and numbers(group) and following and compact(' '.join(w['text'] for w in qualifier_words)) in qualifiers and not numbers(following) and .0<following['cy']-group['cy']<.025:
   result.append({**group,'words':group['words']+following['words'],'text':group['text']+' '+following['text'],'captionSourceRows':[group['cy'],following['cy']]})
   continue
  # A wrapped subrow can end in an otherwise exact aggregate caption.
  # Carry its printed preceding code/caption before matching (e.g. 149
  # provision for inventory, followed by "inventory" and its amount).
  previous=groups[index-1] if index else None
  own_codes={w['text'] for w in group['words'] if w['x']<caption_right_limit and re.fullmatch(r'[1-4]\d{2}',w['text'])}
  prior_codes={w['text'] for w in previous['words'] if w['x']<caption_right_limit and re.fullmatch(r'[1-4]\d{2}',w['text'])} if previous else set()
  if identify(group) and numbers(group) and not own_codes and prior_codes and not numbers(previous) and group['cy']-previous['cy']<.025 and all(w['x']<caption_right_limit for w in previous['words']):
   result.append({**group,'words':previous['words']+group['words'],'text':previous['text']+' '+group['text'],'captionSourceRows':[previous['cy'],group['cy']]})
   continue
  if identify(group) or not numbers(group):result.append(group);continue
  alternatives=[]
  for before,after in [(1,0),(0,1),(1,1),(2,0),(0,2)]:
   lo,hi=index-before,index+after
   if lo<0 or hi>=len(groups):continue
   nearby=groups[lo:hi+1]
   if any(nearby[n+1]['cy']-nearby[n]['cy']>.025 for n in range(len(nearby)-1)):continue
   other=[g for j,g in enumerate(nearby,lo) if j!=index]
   if any(numbers(g) or any(w['x']>caption_right_limit for w in g['words']) for g in other):continue
   # A complete caption between two amount rows belongs only to the uniquely
   # nearest amount row. Otherwise a preceding dividend can acquire the next
   # financing subtotal caption in both readers and falsely agree.
   complete=[g for g in other if identify(g)]
   if any(any(numbers(candidate) and abs(candidate['cy']-caption['cy'])<=abs(group['cy']-caption['cy']) for candidate in groups if candidate is not group) for caption in complete):continue
   words=[w for g in nearby for w in g['words']]
   merged={**group,'words':words,'text':' '.join(g['text'] for g in nearby),'captionSourceRows':[g['cy'] for g in nearby]}
   if identify(merged):alternatives.append(merged)
  unique={identify(g)[0]:g for g in alternatives}
  result.append(next(iter(unique.values())) if len(unique)==1 else group)
 return result

MONTH_NAMES={'january':'01','february':'02','march':'03','april':'04','may':'05','june':'06','july':'07','august':'08','september':'09','october':'10','november':'11','december':'12'}
def stock_date_columns(groups,row_y,end):
 candidates=[]
 expression=r'(?P<day>\d{1,2})\s*(?:[/.-]\s*(?P<month>\d{1,2})\s*[/.-]|thang\s*(?P<vm>\d{1,2})\s*nam|(?P<em>'+ '|'.join(MONTH_NAMES)+r'))\s*(?P<year>20\d{2})'
 for group in groups:
  if group['cy']>=row_y:continue
  words=[w for w in group['words'] if w['x']>0.43];tokens=[fold(w['text']) for w in words];text=' '.join(tokens);matches=list(re.finditer(expression,text))
  if len(matches)<2:continue
  remainder=re.sub(expression,'',text)
  remainder=re.sub(r'vnd|dong|as at|tai ngay|ngay|date|thuyet minh|thuyet|minh|ma so|ma|so|notes|note|code|chi tieu|\W','',remainder)
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
 # VAS forms may use an explicit 'closing balance' label under a dated heading.
 # Only admit the closing column when the source page itself states the exact date.
 top=' '.join(g['text'] for g in groups if g['cy']<row_y)
 date_patterns=[f"{int(end[8:])}[/.-]0?{int(end[5:7])}[/.-]{end[:4]}",f"{int(end[8:])}\\s+thang\\s+0?{int(end[5:7])}\\s+nam\\s+{end[:4]}",f"{int(end[8:])}\\s+{next(name for name,value in MONTH_NAMES.items() if int(value)==int(end[5:7]))}\\s+{end[:4]}"]
 if any(re.search(pattern,fold(top)) for pattern in date_patterns):
  for group in groups:
   if group['cy']>=row_y:continue
   ws=[w for w in group['words'] if w['x']>0.43]
   for count in [4,3,2,1]:
    for index in range(len(ws)-count+1):
     part=ws[index:index+count]
     if fold(' '.join(w['text'] for w in part)).strip(' |!') in ['so cuoi ky','so cuoi nam','cuoi ky','cuoi nam','closing balance']:
      pos=(min(w['x'] for w in part)+max(w['x']+w['width'] for w in part))/2
      candidates.append((group['cy'],{'positions':[pos],'dates':[end],'headerY':group['cy']}))
 # Some audited tables print an explicit shared day/month and separate year columns.
 # Bind each visible year to that shared date; neither filename nor document year supplies it.
 for group in groups:
  if group['cy']>=row_y:continue
  shared=re.search(r'(?:tai ngay|as at)\s+(?P<day>\d{1,2})\s+(?:thang\s+(?P<vm>\d{1,2})\s+nam|(?P<em>'+ '|'.join(MONTH_NAMES)+r'))(?:\s|$)',fold(group['text']))
  if not shared:continue
  month=shared.group('vm') or MONTH_NAMES[shared.group('em')]
  for years in groups:
   if not group['cy']<years['cy']<min(row_y,group['cy']+0.08):continue
   words=[w for w in years['words'] if w['x']>0.43 and re.fullmatch(r'20\d{2}',w['text'])]
   if len(words)!=2:continue
   dates=[f"{w['text']}-{int(month):02d}-{int(shared.group('day')):02d}" for w in words]
   positions=[w['x']+w['width']/2 for w,date in zip(words,dates) if date==end]
   if positions:candidates.append((years['cy'],{'positions':positions,'dates':dates,'headerY':years['cy']}))
 # Independently isolated literal date tokens may occupy adjacent header rows.
 # Their source geometry, not a narrative date or the document filename,
 # establishes the columns. Reject merged text/date tokens and wide regions.
 isolated=[]
 for group in groups:
  if group['cy']>=row_y:continue
  for word in group['words']:
   if word['x']<=.43 or word['width']>=.24:continue
   match=re.fullmatch(expression,fold(word['text']))
   if match:
    month=match.group('month') or match.group('vm') or MONTH_NAMES[match.group('em')]
    date=f'{match.group("year")}-{int(month):02d}-{int(match.group("day")):02d}'
    try:datetime.date.fromisoformat(date)
    except ValueError:continue
    isolated.append((group['cy'],word['x']+word['width']/2,date))
 for y,x,date in isolated:
  nearby=[v for v in isolated if abs(v[0]-y)<=.035]
  if len(nearby)!=2 or abs(nearby[0][1]-nearby[1][1])<.13:continue
  nearby.sort(key=lambda v:v[1]);dates=[v[2] for v in nearby]
  positions=[v[1] for v in nearby if v[2]==end]
  if positions and len(set(dates))==2:candidates.append((max(v[0] for v in nearby),{'positions':positions,'dates':dates,'headerY':max(v[0] for v in nearby),'method':'TWO_ISOLATED_LITERAL_DATE_COLUMN_TOKENS'}))
 return max(candidates,key=lambda c:c[0])[1] if candidates else None

def explicit_current_flow_columns(groups,row_y,period,allow_following_note_period=False):
 # An EPS note can explain its dated six-month window below the table.
 # Its exact current-period column remains above the row; ordinary primary
 # statements continue to require the period heading before the value.
 top=fold(' '.join(g['text'] for g in groups if allow_following_note_period or g['cy']<row_y))
 end=period['end'];day,month=int(end[8:]),int(end[5:7]);year=end[:4]
 if not re.search(fr'{day}(?:[/.-]0?{month}[/.-]|\s+thang\s+0?{month}\s+nam\s+){year}',top):return []
 if flow_window(top,period,True) is None:return []
 candidates=[]
 for group in groups:
  if group['cy']>=row_y:continue
  words=[w for w in group['words'] if w['x']>0.43]
  for count in [3,2,1]:
   for index in range(len(words)-count+1):
    part=words[index:index+count]
    if fold(' '.join(w['text'] for w in part)) in ['ky nay','nam nay','current period','current year']:
     candidates.append((group['cy'],(min(w['x'] for w in part)+max(w['x']+w['width'] for w in part))/2))
 if not candidates:return []
 latest=max(v[0] for v in candidates)
 return sorted(set(v[1] for v in candidates if v[0]==latest))

def ytd_column_numbers(groups,row_y,candidates,allow_current_and_comparative_note_columns=False):
 # An exact cumulative header is read independently in each engine. Select the
 # unique year column closest to its header band, with a separation margin.
 anchors=[]
 for group in groups:
  if group['cy']>=row_y:continue
  words=[w for w in group['words'] if w['x']>.43]
  for count in range(1,8):
   for index in range(len(words)-count+1):
    part=words[index:index+count];text=fold(' '.join(w['text'] for w in part))
    if text in ['ky 6 thang ket thuc','ky sau thang ket thuc'] or any(text.startswith(v) for v in ['luy ke','giai doan sau thang','sau thang ket thuc','six-month','six month','6-month','year-to-date','accumulated from']):
     anchors.append((group['cy'],(min(w['x'] for w in part)+max(w['x']+w['width'] for w in part))/2))
 if not anchors:return []
 latest=max(a[0] for a in anchors);anchors=[a[1] for a in anchors if a[0]==latest]
 selected=[]
 for anchor in anchors:
  distances=sorted((abs(n['x']+n['width']/2-anchor),index) for index,n in enumerate(candidates))
  if distances and distances[0][0]<.16 and (len(distances)==1 or distances[1][0]-distances[0][0]>.07):selected.append(candidates[distances[0][1]])
 indices={id(n):n for n in selected}
 return list(indices.values()) if len(indices)==1 or allow_current_and_comparative_note_columns else []

def ordered_flow_years(groups,row_y):
 candidates=[]
 for group in groups:
  if group['cy']>=row_y:continue
  text=' '.join(w['text'] for w in group['words'] if w['x']>.43)
  years=re.findall(r'(?<![0-9])(202[2-6])(?![0-9])',text)
  if len(years) in [2,4]:candidates.append((group['cy'],years))
 return max(candidates,key=lambda c:c[0])[1] if candidates else []

def verify_ordered_flow_column(groups,row_y,values,index,year,explicit_ytd):
 years=ordered_flow_years(groups,row_y)
 if len(years)!=len(values) or index>=len(years) or years[index]!=str(year):return False
 if explicit_ytd:
  # Four columns must independently show quarter then cumulative heading.
  top=fold(' '.join(g['text'] for g in groups if g['cy']<row_y))
  quarter=re.search(r'quy\s*(?:i{1,3}|iv|[1-4])\b|quarter',top)
  cumulative=re.search(r'luy ke|giai doan sau thang|six.month|year-to-date|accumulated',top)
  if len(values)!=4 or not quarter or not cumulative or quarter.start()>=cumulative.start() or index<2:return False
 return True

UNIT_MARKERS=[('trieu vnd','MILLION_CURRENCY'),('trieu dong','MILLION_CURRENCY'),('vnd million','MILLION_CURRENCY'),('million vnd','MILLION_CURRENCY'),('ty dong','BILLION_CURRENCY'),('ty vnd','BILLION_CURRENCY'),('billion vnd','BILLION_CURRENCY'),('vnd billion','BILLION_CURRENCY'),("vnd'000",'THOUSAND_CURRENCY'),('vnd’000','THOUSAND_CURRENCY'),('000 vnd','THOUSAND_CURRENCY'),('nghin dong','THOUSAND_CURRENCY'),('ngan dong','THOUSAND_CURRENCY'),('nghin vnd','THOUSAND_CURRENCY'),('1.000 dong','THOUSAND_CURRENCY'),('1,000 dong','THOUSAND_CURRENCY')]
UNIT_TOKEN_KEYS={compact(marker) for marker,_ in UNIT_MARKERS}|{'vnd','dong'}
def explicit_unit_text(text):
 # Vietnamese "động" (activity) folds to the same ASCII token as "đồng"
 # (currency). A cropped statement section caption must never change scale.
 if re.search(r'\bđộng\b',text,re.I):return None
 s=re.sub(r'^[\s\]\[|0-9]+','',fold(text));s=re.sub(r'^(?:thuyet minh|thuyet|minh|ma so|notes|note|code|chi tieu)\s+','',s);c=compact(s)
 header=bool(re.match(r'^(don vi(?: tinh)?|dvt|units?|currency)(?:[:.\s(]|$)',s))
 clean=re.sub(r'[\s():.]','',s)
 isolated=bool(re.fullmatch(r'(?:vnd){1,8}',clean)) or clean in ['dong','vietnamdong','vietnamesedong'] or any(c.startswith(compact(marker)) for marker,_ in UNIT_MARKERS)
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
  text=' '.join(w['text'] for w in g['words'] if w['x']>0.43);normalized=re.sub(r'^(?:(?:ma|so|thuyet|minh|notes|note)\s+)+','',fold(text));c=compact(normalized)
  residual=c
  for marker,_ in sorted(UNIT_MARKERS,key=lambda m:len(compact(m[0])),reverse=True):residual=residual.replace(compact(marker),'')
  residual=residual.replace('vnd','').replace('dong','')
  if c and not residual:found.append((g['cy'],explicit_unit_text(text)))
  # Independently read exact unit tokens in the table's top header. The display
  # prefix can be split across OCR words; it never supplies the scale itself.
  if g['cy']<0.25 and not any(currency in compact(g['text']) for currency in ['usd','eur','jpy']):
   ws=[w for w in g['words'] if w['x']>0.43]
   for count in [3,2,1]:
    for index in range(len(ws)-count+1):
     fragment=' '.join(w['text'] for w in ws[index:index+count])
     if compact(fragment) in UNIT_TOKEN_KEYS:
      found.append((g['cy'],explicit_unit_text(fragment)))

 found=[f for f in found if f[1] is not None]
 if not found:return None
 latest=max(f[0] for f in found);atLatest=[f for f in found if f[0]==latest]
 # Currency subtoken of an explicit scaled unit must not override that scale.
 scaled=[f for f in atLatest if f[1]!='CURRENCY']
 if len({f[1] for f in scaled})>1:return None
 return scaled[0] if scaled else atLatest[0]

PRIMARY_TITLES={
 'BALANCE':['baocaotinhhinhtaichinh','bangcandoiketoan','baocaocandoiketoan','balancesheet','statementoffinancialposition'],
 'INCOME':['baocaoketquahoatdong','baocaoketquakinhdoanh','incomestatement','statementofincome','statementofprofitorloss'],
 'CASH_FLOW':['baocaoluuchuyentiente','cashflowstatement','statementofcashflows','statementofcashflow']}
def primary_kinds_uncached(page,key):
 # A restatement/segment reconciliation printed inside the notes is not a primary statement.
 top=[compact(g['text']) for g in lines([w for w in page[key] if w['y']<0.22])]
 if any(any(marker in t for marker in ('thuyetminhbaocaotaichinh','notestothefinancialstatements','notestotheconsolidatedfinancialstatements')) for t in top):return set()
 found=set()
 # Actual inspected GVR Q4/2023 pages 10–11 print "BÁO CÁO KẾT
 # LƯU CHUYỂN TIỀN TỆ". Preserve that source title, with no global fuzzy
 # correction. Both readers must read the exact title and annual date range;
 # this establishes only the cash-flow family, never income/YTD columns.
 if page.get('bodyHash')=='707a36cbbc34429142fff4cb9d9c7622f9ad0af6526e73fec4232d678faf23f6' and page.get('page') in [10,11]:
  if any(t.startswith('baocaoketluuchuyentientehopnhat') for t in top):
   source=compact(full_text(page,key))
   if all(s in source for s in ['01012023','31122023','01012022','31122022']):found.add('CASH_FLOW')
 # Positive printed sector-specific forms identify only statement families.
 # They never establish consolidated scope or interchangeable field definitions.
 for text in top:
  for kind,code in [('BALANCE','01'),('INCOME','02'),('CASH_FLOW','03')]:
   if re.search(r'(?:mau)?b'+code+r'a?dnhn(?:$|[^a-z])',text):found.add(kind)
  for suffix,codes in [('tctd',[('BALANCE','02'),('INCOME','03'),('CASH_FLOW','04')]),('ctck',[('BALANCE','01'),('INCOME','02'),('CASH_FLOW','03')])]:
   for kind,code in codes:
    if re.search(r'(?:mau)?b'+code+r'a?'+suffix+r'(?:hn)?(?:$|[^a-z])',text):found.add(kind)
 for g in lines([w for w in page[key] if w['y']<0.5]):
  title=re.sub(r'^[0-9]+','',compact(g['text']))
  for prefix in ['condensedconsolidatedinterim','condensedconsolidated','consolidatedinterim','interimconsolidated','consolidated','interim']:
   if title.startswith(prefix):title=title[len(prefix):];break
  for kind,heads in PRIMARY_TITLES.items():
   if any(title.startswith(head) for head in heads):found.add(kind)
 tableLines=lines(page[key])
 if not any(identify(g) and len(numbers(g))>=2 for g in tableLines) and sum(len(numbers(g))>=2 for g in tableLines)<3:return set()
 return found

def primary_kinds(page,key):
 cache='_primary_'+key
 if cache not in page:page[cache]=primary_kinds_uncached(page,key)
 return page[cache]

def reconcile():
 (B/'mapping-caption-dictionary.json').write_text(json.dumps({'version':'exact-source-caption-v1','captions':CAPTIONS,'codes':{k:sorted(v) for k,v in CODES.items()},'policy':'EXACT_ALTERNATIVES_ONLY_NO_FUZZY_DEFINITION_OR_CODE_INFERENCE'},ensure_ascii=False,indent=2)+'\n')
 identities=json.load(open('docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json'))['identities'];ids={i['ticker']:i for i in identities};selected=json.load(open(B/'selected-documents.json'));results=[];exceptions=[];cells=[];sectors=[]
 existingSectors={s['ticker']:s for s in json.load(open('docs/fundamental-data-engine/evidence/2026-10-10-di123-sectors.json'))['assignments']}
 for d in selected:
  pages=[];primaryPeriodJoinPages=[]
  for f in sorted((B/'ocr').glob(d['bodyHash']+'-p*.json')):
   if not re.fullmatch(re.escape(d['bodyHash'])+r'-p[0-9]+\.json',f.name):continue
   p=json.load(open(f))
   if 'error' not in p:
    if p.get('engineA','').startswith('APPLE_VISION'):
     p={**p,'passA':p['passB'],'passB':p['passA'],'engineA':p['engineB'],'engineB':p['engineA']}
    if d['bodyHash'] in {'041c5a2ac49f0e8f4a29f2b1fdb82aea00608579ad33c0606adf9ad06dd8da40','930d0d8de3a286afab2fb4fb6fcd9caf7aa0731fda86f092f03150a796a38020','5d9260dace57a7a3e5928e9d247c878d7667786fffeb2d7ace87aa7a9bca082f'}:
     p={**p,'originalSourcePageEvidenceHashes':[hashlib.sha256(json.dumps(p[k],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']], 'passA':[w for w in p['passA'] if w['x']>=0.20], 'passB':[w for w in p['passB'] if w['x']>=0.20], 'regionPolicy':'FPT_AUDITED_ANNUAL_STATEMENT_EXCLUDE_LEFT_NAVIGATION_X_BELOW_0_20'}
    if d['bodyHash'] in {'416a104007cb0ed20ca43f9771a698f789b812866f7937617ec42be85e0c852c','0d7f9ab03feb69bd5cb64310308782731ec6b45569a502c5ab0ba0a4922d693a'} and p['page']==48:
     # Pinned note 33: the printed table ends before x=.90. The scanned
     # right binding edge lies beyond .93 and is not statement content.
     # Keep hashes of both complete reader outputs, never rewrite their bytes.
     p={**p,'originalSourcePageEvidenceHashes':[hashlib.sha256(json.dumps(p[k],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']], 'passA':[w for w in p['passA'] if w['x']<.93], 'passB':[w for w in p['passB'] if w['x']<.93], 'regionPolicy':'VIB_PINNED_NOTE_33_EXCLUDE_RIGHT_BINDING_EDGE_X_AT_OR_ABOVE_0_93'}
    pages.append(p)
  pages.sort(key=lambda x:x['page']);a=' '.join(full_text(p,'passA') for p in pages[:12]);b=' '.join(full_text(p,'passB') for p in pages[:12]);fa,fb=fold(a),fold(b);pa,pb=get_period(a),get_period(b)
  cores=name_cores(ids[d['ticker']]);nameA=' '.join(w['text'] for p in pages for w in p['passA'] if p['page']<=3 or w['y']<0.2);nameB=' '.join(w['text'] for p in pages for w in p['passB'] if p['page']<=3 or w['y']<0.2);issuer=any(c in compact(nameA) and c in compact(nameB) for c in cores)
  statementKinds=set();primaryScope=False;primaryIssuer=False;balanceHeaderA=None;balanceHeaderB=None;balancePage=None;identityPages=[];scopePages=[];typePages=[]
  for page in pages:
   sa,sb=fold(full_text(page,'passA')),fold(full_text(page,'passB'))
   for kind,markers in [('BALANCE',['tinh hinh tai chinh','can doi ke toan','financial position','balance sheet']),('INCOME',['ket qua hoat dong','income statement','statement of income','profit or loss']),('CASH_FLOW',['luu chuyen tien te','cash flow'])]:
    if kind in primary_kinds(page,'passA') and kind in primary_kinds(page,'passB'):
     statementKinds.add(kind);typePages.append(page['page'])
     if kind=='BALANCE' and balanceHeaderA is None:balanceHeaderA=full_text(page,'passA');balanceHeaderB=full_text(page,'passB');balancePage=page['page']
     def header_identity(key):
      header=lines([w for w in page[key] if w['y']<0.22])
      joined=' '.join(g['text'] for g in header)
      header=header+[{'text':joined}]
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
  if pa is None or pb is None:
   # The balance heading supplies the date; income/cash-flow headings supply the flow window.
   primaryPages=[p for p in pages if primary_kinds(p,'passA') and primary_kinds(p,'passB')]
   altA=get_period(' '.join(full_text(p,'passA') for p in primaryPages));altB=get_period(' '.join(full_text(p,'passB') for p in primaryPages))
   if altA is not None and altA==altB:pa=pb=altA
  # Explicit flow-statement headings have reporting-window authority over
  # unrelated legal/governance dates on early pages. Read both independently.
  flowPrimary=[p for p in pages if (primary_kinds(p,'passA')&primary_kinds(p,'passB'))&{'INCOME','CASH_FLOW'}]
  headerA=' '.join(g['text'] for p in flowPrimary for g in lines(p['passA']) if g['cy']<.30)
  headerB=' '.join(g['text'] for p in flowPrimary for g in lines(p['passB']) if g['cy']<.30)
  # If early-page narrative selects different periods, combine only the
  # independently dated primary balance header with primary flow headings.
  # Both readers must establish the identical complete window; no title repair.
  if pa!=pb and balanceHeaderA is not None and balanceHeaderB is not None:
   joined=agreed_primary_interim_window(balanceHeaderA,balanceHeaderB,headerA,headerB)
   if joined is not None:
    pa=pb=joined
    primaryPeriodJoinPages=[p['page'] for p in flowPrimary]+[balancePage]
  statedA,statedB=get_period(headerA),get_period(headerB)
  if statedA is not None and statedA==statedB:
   pa=pb=statedA
   balancePage=flowPrimary[0]['page']
  if pa is None or pb is None:
   for sourcePage in pages[:4]:
    headingA=annual_document_heading_period(sourcePage,'passA');headingB=annual_document_heading_period(sourcePage,'passB')
    if headingA is not None and headingA==headingB:
     pa=pb=headingA;balancePage=sourcePage['page'];break
  if pa is not None and pa==pb and pa['type']=='QUARTER' and pa['end'].endswith('-06-30'):
   # A quarterly cover can bind a wider six-month cash-flow statement. Retain
   # the widest explicitly reported source window; row columns still decide
   # whether each admitted flow is the quarter or year-to-date amount.
   for sourcePage in flowPrimary:
    headers=[' '.join(g['text'] for g in lines(sourcePage[key]) if g['cy']<.30) for key in ['passA','passB']]
    if all(re.search(r'(?:ky|giai doan)\s+(?:0?6|sau)\s+thang|luy ke|year-to-date|six.month',fold(header)) and str(pa['fiscalYear']) in header for header in headers):
     pa=pb={**pa,'start':pa['end'][:4]+'-01-01','type':'YTD'};balancePage=sourcePage['page'];break
  # Embedded FPT audited statements are bound by the auditor's exact legal-entity
  # introduction and printed statement-page range, rather than annual report decoration.
  fptAudit={'041c5a2ac49f0e8f4a29f2b1fdb82aea00608579ad33c0606adf9ad06dd8da40':(144,146,207,2024), '930d0d8de3a286afab2fb4fb6fcd9caf7aa0731fda86f092f03150a796a38020':(141,143,203,2023),'5d9260dace57a7a3e5928e9d247c878d7667786fffeb2d7ace87aa7a9bca082f':(163,165,226,2025)}
  if d['ticker']=='FPT' and d['bodyHash'] in fptAudit:
   auditPage,first,last,year=fptAudit[d['bodyHash']];audit=next((p for p in pages if p['page']==auditPage),None)
   if audit:
    texts=[fold(' '.join(g['text'] for g in lines([w for w in audit[k] if (0.20<=w['x']<(0.61 if year==2023 else 0.66)) if year!=2025]))) for k in ['passA','passB']] if year!=2025 else [fold(full_text(audit,k)) for k in ['passA','passB']]
    # 2023 printed page numbers are one lower than physical PDF page numbers.
    printedFirst,printedLast=(first,last) if year==2024 else (first-1,last-1)
    markers=['gui cac co dong cua cong ty co phan fpt','chung toi da kiem toan bao cao tai chinh hop nhat',f'tu trang {printedFirst} den trang {printedLast}']
    bound=all(all(marker in text for marker in markers) and get_period(text) is not None and get_period(text)['fiscalYear']==year for text in texts)
    if bound and len(statementKinds)>=2 and all(first<=page<=last for page in typePages):
     issuer=True;primaryIssuer=True;identityPages.append(auditPage);scopePages.append(auditPage)
     pa=pb=get_period(texts[0]);balancePage=auditPage
     # Additional rubric/governance pages can precede the financial section.
     # Its exact auditor introduction, not the first twelve decorative pages,
     # establishes financial document type, audit status and accounting basis.
     fa+=' '+texts[0];fb+=' '+texts[1]
  issuer=issuer and primaryIssuer;scope=primaryScope;reportingScope='CONSOLIDATED' if primaryScope else None
  # A securities standalone form can be captured as standalone. This does not
  # establish absence of subsidiaries or authorize a consolidated-input fallback.
  if not scope and d['ticker'] in {'SSI','TCX'}:
   standalonePages=[]
   for page in pages:
    if not (primary_kinds(page,'passA') and primary_kinds(page,'passB')):continue
    headers=[fold(' '.join(w['text'] for w in page[key] if w['y']<.22)) for key in ['passA','passB']]
    if all(re.search(r'\bb0[1-3]a?\s*[-/]\s*ctck\b',h) and not re.search(r'ctck\s*[-/]\s*hn\b',h) for h in headers):standalonePages.append(page['page'])
   if len(standalonePages)>=2:scope=True;reportingScope='SEPARATE_STANDALONE';scopePages.extend(standalonePages)
  overrideFile=B/'lpb-current-standalone-scope-evidence.json'
  if not scope and overrideFile.exists():
   override=json.load(open(overrideFile))
   if d['ticker']==override['ticker'] and d['bodyHash']==override['financialDocumentBodyHash'] and pa==pb and pa is not None and pa['end']==override['periodEnd']:
    formPages=[p['page'] for p in pages if any(compact(form) in compact(full_text(p,'passA')) and compact(form) in compact(full_text(p,'passB')) for form in override['requiredSourceStatementForms']) and primary_kinds(p,'passA') and primary_kinds(p,'passB')]
    if len(formPages)>=2:scope=True;reportingScope='SEPARATE_STANDALONE';scopePages.extend(formPages)
  financial=len(statementKinds)>=2 and any(x in fa and x in fb for x in ['bao cao tai chinh','financial statements']);period=pa if pa==pb else None
  result={**d,'status':'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' if issuer and scope and financial and period else 'EXCEPTION_REVIEW_REQUIRED','issuerAgreement':issuer,'financialAgreement':financial,'scope':reportingScope,'period':period,'primaryStatementKinds':sorted(statementKinds),'qualificationMethod':'TWO_INDEPENDENT_SOURCE_PAGE_READERS_EXACT_NAME_CORE_SCOPE_PERIOD_TWO_PRIMARY_STATEMENTS','evidencePages':[p['page'] for p in pages[:12]],'contentEvidencePages':{'ISSUER_IDENTITY':sorted(set(identityPages)),'DOCUMENT_TYPE':sorted(set(typePages)),'REPORTING_SCOPE':sorted(set(scopePages)),'REPORTING_PERIOD':sorted(set([p['page'] for p in pages[:4]]+([balancePage] if balancePage else [])+primaryPeriodJoinPages))},'securityId':ids[d['ticker']]['securityId'],'auditStatus':'REVIEWED' if any(x in fa and x in fb for x in ['bao cao soat xet','review report','report on review']) else 'AUDITED' if any(x in fa and x in fb for x in ['bao cao kiem toan doc lap','independent auditor']) else 'UNKNOWN','accountingBasis':'VAS' if any(x in fa and x in fb for x in ['chuan muc ke toan viet nam','vietnamese accounting standards']) else 'UNKNOWN'}
  # An explicit preparation assertion in the report's notes can occur after
  # the first twelve pages. Require the same positive assertion from both
  # readers on one page; a bare mention of VAS cannot establish the basis.
  basisPages=[]
  for p in pages:
   texts=[fold(full_text(p,k)) for k in ['passA','passB']]
   if all(affirmative_vas_preparation(t) for t in texts):basisPages.append(p['page'])
  if basisPages:
   result['accountingBasis']='VAS'
   result['contentEvidencePages']['ACCOUNTING_BASIS']=basisPages
  if result['auditStatus']=='UNKNOWN':
   auditPages=[p['page'] for p in pages if all(affirmative_consolidated_audit(full_text(p,k),cores) for k in ['passA','passB'])]
   if auditPages:
    result['auditStatus']='AUDITED'
    result['contentEvidencePages']['AUDIT_STATUS']=auditPages
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
  if period['end'] not in {'2026-06-30','2025-12-31','2025-06-30','2024-12-31','2023-12-31','2022-12-31','2025-09-30','2026-03-31'}:continue
  extractionPages=list(pages)
  for pairFile in sorted((B/'ocr-independent-reader-pairs').glob(d['bodyHash']+'-p*.json')):
   pair=json.load(open(pairFile));originalFile=pathlib.Path(pair['sourceOriginalOcrProofFile']);thirdFile=pathlib.Path(pair['sourceThirdReaderProofFile'])
   assert originalFile.resolve().parent==(B/'ocr').resolve() and thirdFile.resolve().parent==(B/'ocr-third-reader').resolve()
   assert hashlib.sha256(originalFile.read_bytes()).hexdigest()==pair['sourceOriginalOcrProofSha256'] and hashlib.sha256(thirdFile.read_bytes()).hexdigest()==pair['sourceThirdReaderProofSha256']
   original=json.load(open(originalFile));third=json.load(open(thirdFile))
   assert pair['bodyHash']==original['bodyHash']==third['bodyHash']==d['bodyHash'] and pair['page']==original['page']==third['page']
   assert pair['renderSha256']==original['renderSha256']==third['renderSha256']
   assert pair['engineA']==third['engine'] and pair['engineB']==original['engineA'] and pair['passA']==third['words'] and pair['passB']==original['passA']
   extractionPages.append({**pair,'sourceIndependentPairProofFile':str(pairFile)})
  for p in extractionPages:
   cellDocumentPeriod=period
   comparative=os.environ.get('VN30_COMPARATIVE')=='1'
   if comparative:
    year=period['fiscalYear']-1;cellDocumentPeriod={**period,'start':str(year)+period['start'][4:],'end':str(year)+period['end'][4:],'fiscalYear':year}
   caption_right_limit=.60 if p.get('regionPolicy')=='VIB_PINNED_NOTE_33_EXCLUDE_RIGHT_BINDING_EDGE_X_AT_OR_ABOVE_0_93' else .53
   if d['bodyHash']=='6c781b57b01326ac7dc6c347ef7c5d79b403536c089ddb4956a8aaaa68ba5b37' and p['page']==13:caption_right_limit=.66
   la,lb=statement_rows(lines(p['passA']),caption_right_limit),statement_rows(lines(p['passB']),caption_right_limit);ta,tb=fold(full_text(p,'passA')),fold(full_text(p,'passB'))
   if result['scope']=='CONSOLIDATED' and not any(x in ta and x in tb for x in ['hop nhat','consolidated']):continue
   # Never use a note table merely because a caption resembles a primary statement row.
   kinds=primary_kinds(p,'passA')&primary_kinds(p,'passB');iscf='CASH_FLOW' in kinds;isincome='INCOME' in kinds;isbalance='BALANCE' in kinds
   for ga in la:
    match=identify(ga)
    # A generic shareholder caption is not a global common-profit alias.
    # The EPS note must independently define its ordinary-shareholder basis
    # in both readers before this exact note-table caption can be mapped.
    if not match:match=identify_ordinary_profit_note(ga,[ta,tb])
    if not match:continue
    item,caption=match
    banknote=item.startswith('BANK_') and item in STOCK and any(x in ta and x in tb for x in ['thuyet minh bao cao','notes to the financial'])
    commonProfitNote=item=='NET_INCOME_ATTRIBUTABLE_COMMON' and all('lai co ban tren co phieu' in t and 'thuyet minh bao cao' in t for t in [ta,tb])
    basicEpsNote=item=='BASIC_EPS' and all('lai co ban tren co phieu' in t and 'thuyet minh bao cao' in t for t in [ta,tb])
    if not (banknote or commonProfitNote or basicEpsNote or (item in CF and iscf) or(item in STOCK and isbalance) or(item not in STOCK|CF and isincome)):continue
    if item.startswith('BANK_') and existingSectors[d['ticker']]['sourceSector']!='Tài chính':continue
    if commonProfitNote and any(s in fold(ga['text']) for s in ['(trieu dong)','(trieu vnd)','(vnd)']):
     def common_profit_unit(groups):
      rows=[g for g in groups if abs(g['cy']-ga['cy'])<.013 and compact('loi nhuan') in compact(g['text']) and any(s in fold(g['text']) for s in ['(trieu dong)','(trieu vnd)','(vnd)'])]
      if len(rows)!=1:return None
      return (rows[0]['cy'],'MILLION_CURRENCY' if any(s in fold(rows[0]['text']) for s in ['(trieu dong)','(trieu vnd)']) else 'CURRENCY')
     ua,ub=common_profit_unit(la),common_profit_unit(lb)
    elif item=='BASIC_EPS':
     def eps_unit(groups):
      rows=[g for g in groups if abs(g['cy']-ga['cy'])<.013 and identify(g) and identify(g)[0]=='BASIC_EPS' and re.search(r'vnd\s*/\s*(?:co phieu|share)|vnd per share',fold(g['text']))]
      return (rows[0]['cy'],'CURRENCY_PER_SHARE') if len(rows)==1 else None
     ua,ub=eps_unit(la),eps_unit(lb)
    else:ua,ub=declared_unit(la,ga['cy']),declared_unit(lb,ga['cy'])
    if ua is None or ub is None or ua[1]!=ub[1]:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'UNIT_SCALE_NOT_INDEPENDENTLY_ESTABLISHED'});continue
    unit=ua[1]
    na=numbers(ga)
    if not na:continue
    candidates=[g for g in lb if abs(g['cy']-ga['cy'])<0.013 and (identify(g) or identify_ordinary_profit_note(g,[ta,tb])) and (identify(g) or identify_ordinary_profit_note(g,[ta,tb]))[0]==item and numbers(g)]
    if len(candidates)!=1:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'CAPTION_OR_ROW_GEOMETRY_DISAGREEMENT'});continue
    gb=candidates[0];nb=numbers(gb)
    if not nb:continue
    # Current balance first column. Flow requires explicit year/YTD header near column; quarter+YTD must be distinguished.
    columns=na;explicitYtdColumn=False;cellPeriod=cellDocumentPeriod
    if item in STOCK:
     stockEnd=(str(period['fiscalYear']-1)+'-12-31') if comparative else period['end'];cellPeriod={**cellDocumentPeriod,'end':stockEnd,'fiscalQuarter':None} if comparative else cellDocumentPeriod
     headerA=stock_date_columns(la,ga['cy'],stockEnd);headerB=stock_date_columns(lb,ga['cy'],stockEnd)
     positions=headerA['positions'] if headerA is not None and headerB is not None and headerA['dates']==headerB['dates'] else []
     if not positions:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'STOCK_DATE_COLUMN_HEADER_NOT_ESTABLISHED'});continue
     columns=[n for n in na if min(abs(n['x']+n['width']/2-h) for h in positions)<0.075]
     if len(columns)!=1:continue
    if item not in STOCK:
     header=[g for g in la if g['cy']<ga['cy'] and re.search(str(cellDocumentPeriod['fiscalYear']),g['text']) and g['cy']>0.08]
     positions=[]
     if header:
      last=max(g['cy'] for g in header);header=[g for g in header if abs(g['cy']-last)<0.014]
     for g in header:
      for w in g['words']:
       if re.search(str(cellDocumentPeriod['fiscalYear']),w['text']) and w['x']>0.43:positions.append(w['x']+w['width']/2)
     headerB=[g for g in lb if g['cy']<gb['cy'] and re.search(str(cellDocumentPeriod['fiscalYear']),g['text']) and g['cy']>0.08]
     if headerB:
      lastB=max(g['cy'] for g in headerB);headerB=[g for g in headerB if abs(g['cy']-lastB)<0.014]
     positionsB=[w['x']+w['width']/2 for g in headerB for w in g['words'] if re.search(str(cellDocumentPeriod['fiscalYear']),w['text']) and w['x']>0.43]
     if not comparative:
      # A table's explicit "current period" column outranks a year token
      # in the spanning statement title. Both readers independently verify
      # its source date/window before this helper accepts a header.
      positions=explicit_current_flow_columns(la,ga['cy'],cellDocumentPeriod,commonProfitNote or basicEpsNote) or positions
      positionsB=explicit_current_flow_columns(lb,gb['cy'],cellDocumentPeriod,commonProfitNote or basicEpsNote) or positionsB
     if not positions or not positionsB:continue
     possible=[n for n in na if min(abs((n['x']+n['width']/2)-h) for h in positions)<0.075]
     if len(possible)>1:
      possible=ytd_column_numbers(la,ga['cy'],possible)
      if len(possible)!=1:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'QUARTER_VS_YTD_COLUMN_UNRESOLVED'});continue
      explicitYtdColumn=True
     if len(possible)!=1:continue
     columns=possible
     if commonProfitNote or basicEpsNote:
      noteA=ytd_column_numbers(la,ga['cy'],na,True);noteB=ytd_column_numbers(lb,gb['cy'],nb,True)
      currentNoteB=[n for n in noteB if min(abs(n['x']+n['width']/2-h) for h in positionsB)<.075]
      if columns[0] in noteA and len(currentNoteB)==1:explicitYtdColumn=True
     wa,wb=flow_window(ta,cellDocumentPeriod,explicitYtdColumn),flow_window(tb,cellDocumentPeriod,explicitYtdColumn)
     if wa is None or wa!=wb:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'FLOW_WINDOW_NOT_INDEPENDENTLY_ESTABLISHED'});continue
     cellPeriod=wa
    n=columns[0]
    if any(v.get('geometryPrecision')=='REGION_ONLY' for v in nb):
     if len(na)==len(nb) and [numeric_value(v['lexical']) for v in na]==[numeric_value(v['lexical']) for v in nb]:matched=[nb[na.index(n)]]
     else:matched=[]
    else:matched=[v for v in nb if abs(v['x']-n['x'])<0.05 or abs(v['x']+v['width']-n['x']-n['width'])<0.04]
    if len(matched)!=1:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'NUMERIC_COLUMN_GEOMETRY_DISAGREEMENT'});continue
    m=matched[0]
    orderedFlowVerified=item not in STOCK and m.get('geometryPrecision')=='REGION_ONLY' and len(na)==len(nb) and [numeric_value(v['lexical']) for v in na]==[numeric_value(v['lexical']) for v in nb] and verify_ordered_flow_column(lb,gb['cy'],nb,na.index(n),cellDocumentPeriod['fiscalYear'],explicitYtdColumn)
    if item not in STOCK and explicitYtdColumn and not orderedFlowVerified:
     possibleB=[v for v in nb if min(abs(v['x']+v['width']/2-h) for h in positionsB)<.075]
     verifiedYtd=ytd_column_numbers(lb,gb['cy'],possibleB)
     if len(verifiedYtd)!=1 or verifiedYtd[0] is not m:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'INDEPENDENT_YTD_HEADER_GEOMETRY_DISAGREEMENT'});continue
    if item not in STOCK and not orderedFlowVerified and min(abs(m['x']+m['width']/2-h) for h in positionsB)>=0.075:exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'INDEPENDENT_FLOW_YEAR_COLUMN_DISAGREEMENT'});continue
    v1,v2=numeric_value(n['lexical']),numeric_value(m['lexical'])
    if v1 is None or v1!=v2 or min(n['confidence'],m['confidence'])<0.80:
     exceptions.append({'ticker':d['ticker'],'bodyHash':d['bodyHash'],'page':p['page'],'item':item,'type':'TWO_ENGINE_CELL_DISAGREEMENT_OR_LOW_CONFIDENCE','lexicalA':n['lexical'],'lexicalB':m['lexical']});continue
    if p.get('sourceIndependentPairProofFile') and any(c['bodyHash']==d['bodyHash'] and c['page']==p['page'] and c['itemId']==('CASH_CAPEX_REPORTED' if item=='CAPEX' else item) and c['period']==cellPeriod and c['verifiedCanonicalInteger']==v1 for c in cells):continue
    cells.append({'ticker':d['ticker'],'securityId':result['securityId'],'documentId':d['documentId'],'bodyHash':d['bodyHash'],'page':p['page'],'itemId':'CASH_CAPEX_REPORTED' if item=='CAPEX' else item,'sourceCaption':ga['text'],'captionAlternative':caption,'lexicalValue':n['lexical'],'verifiedCanonicalInteger':v1,'verificationLexicalValue':m['lexical'],'unit':unit,'unitHeaderYA':ua[0],'unitHeaderYB':ub[0],'currency':'VND','scope':result['scope'],'period':cellPeriod,'periodType':'INSTANT' if item in STOCK else cellPeriod['type'],'columnX':n['x'],'rowY':ga['cy'],'verificationGeometry':m.get('geometryPrecision','WORD_OR_REGION'),'independentColumnVerification':'EXACT_NUMERIC_SEQUENCE_AND_ORDERED_EXPLICIT_YEAR_AND_CUMULATIVE_HEADERS' if orderedFlowVerified else 'SOURCE_WORD_OR_REGION_GEOMETRY','verificationTokenIndex':m.get('tokenIndexWithinRegion'),'extractionMethod':p['engineA'],'verificationMethod':p['engineB'],'renderSha256':p['renderSha256'],'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','sourcePageEvidenceHashes':p.get('originalSourcePageEvidenceHashes') or [hashlib.sha256(json.dumps(p[k],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']],'comparativeColumn':comparative,'revisionStatus':'ORIGINAL_OR_RESTATEMENT_RELATIONSHIP_REQUIRES_COMPARABLE_CHECK',**({'sourceIndependentPairProofFile':p['sourceIndependentPairProofFile']} if p.get('sourceIndependentPairProofFile') else {})})
 if os.environ.get('VN30_COMPARATIVE')=='1':
  (B/'comparative-verified-cells.json').write_text(json.dumps(cells,ensure_ascii=False,indent=2)+'\n');(B/'comparative-exceptions.json').write_text(json.dumps(exceptions,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'comparativeVerifiedCells':len(cells),'exceptions':len(exceptions)}));return
 (B/'qualifications.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n');(B/'verified-cells.json').write_text(json.dumps(cells,ensure_ascii=False,indent=2)+'\n');(B/'extraction-exceptions.json').write_text(json.dumps(exceptions,ensure_ascii=False,indent=2)+'\n');(B/'sector-business-evidence.json').write_text(json.dumps(sectors,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'qualified':sum(x['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' for x in results),'verifiedCells':len(cells),'exceptions':len(exceptions),'financialSectorClassifications':len({x['ticker'] for x in sectors})}))
if __name__=='__main__':reconcile()
