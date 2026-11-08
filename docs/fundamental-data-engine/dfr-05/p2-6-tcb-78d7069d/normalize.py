"""TCB-only P2.6 research overlay; immutable approved dossiers are never rewritten."""
import json,sys,hashlib
from pathlib import Path
from decimal import Decimal,localcontext
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'scripts'))
from lib import dfr02 as d2
from lib import dfr05_p1 as p1
BASELINE='78d7069d02f17ac1ec9dc63a2ba0c2b89812a085'
PRIOR='docs/fundamental-data-engine/dfr-05/p2-3-b1-bank-07b94a51/issuers/TCB.json'
NOTES='data/manual-extracted-pdf/notes/TCB.json'
PINS={};CACHE={}
def read(p):
 if p not in CACHE:PINS[p]=p1.sha(ROOT/p);CACHE[p]=json.loads((ROOT/p).read_text())
 return CACHE[p]
def bind(p,ptr=''):
 return dict(path=p,sha256=PINS.setdefault(p,p1.sha(ROOT/p)),jsonPointer=ptr,objectHash=p1.digest(d2.pointer(read(p),ptr)))
def write(name,x):
 p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def authorize(t):
 if t!='TCB':raise ValueError('TCB_ONLY')

def financials(t='TCB'):
 authorize(t);configpath=str((OUT/'reviewed-bindings.json').relative_to(ROOT));c=read(configpath);notes=read(NOTES);prior=read(PRIOR);ledger={}
 for i,f in enumerate(c['facts']):
  doc=c['documents'][f['document']];path=doc['path'];h=p1.sha(ROOT/path);PINS[path]=h
  if h!=doc['sha256'] or notes['documents'][doc['notesDocumentIndex']]['sourceHash']!=h:raise ValueError('SOURCE_IDENTITY_DRIFT')
  page=f['physicalPage'];p=notes['documents'][doc['notesDocumentIndex']]['pages'][page-1]
  if p['page']!=page:raise ValueError('PHYSICAL_PAGE')
  native=d2.number(f['nativeValue']);value=d2.text(native*d2.number(f['multiplier']));key=f["key"]+':'+str(f['year']);scope=doc['scope'];year=f['year']
  if key in ledger:raise ValueError('DUPLICATE')
  ledger[key]=dict(id='TCB:P26:'+key,key=f['key'],ticker='TCB',securityId=prior['securityId'],year=year,value=value,status='SUPPORTED_RESEARCH_FACT',classification='REPORTED_FACT',scope=scope,population=f['population'],currency='VND' if f['nativeUnit'] in ('MILLION_VND','BILLION_VND') else None,unit='VND' if f['nativeUnit'] in ('MILLION_VND','BILLION_VND') else 'RATIO' if f['nativeUnit']=='PERCENT' else f['nativeUnit'],nativeValue=f['nativeValue'],nativeUnit=f['nativeUnit'],multiplier=f['multiplier'],periodType=f['periodType'],periodStart=f'{year}-01-01' if f['periodType']=='ANNUAL' else f'{year}-12-31',periodEnd=f'{year}-12-31',revision=f['revision'],sourceCohort=f['document']+':EXPLICIT_CURRENT_AND_COMPARATIVE_COLUMNS',binding=bind(configpath,f'/facts/{i}'),notesBinding=bind(NOTES,f'/documents/{doc["notesDocumentIndex"]}/pages/{page-1}'),source=dict(path=path,sha256=h,physicalPage=page,href=path+f'#page={page}',caption=f['caption'],column=f['column']),formula='reported nativeValue × declared multiplier',operandIds=[],confidence='HIGH_FOR_TRANSCRIPTION; not forecast or investment confidence',limitations='Research qualification only; original publication time unknown. '+('FY2024 is a comparative in FY2025 filing, not silently substituted into an older original vintage.' if year==2024 else 'Current fiscal-year column.'),publicationAt=None,productionAdmissible=False)
 def get(k,y=2025):return ledger[k+':'+str(y)]
 def derive(name,deps,op,definition,year=2025,status='SUPPORTED_RESEARCH_DIAGNOSTIC',population=None):
  ns=[get(k,y) for k,y in deps]
  if not all(n['value'] is not None and n['status'].startswith('SUPPORTED') for n in ns):raise ValueError('UNQUALIFIED_OPERAND')
  if len({n['scope'] for n in ns})!=1 or len({n['sourceCohort'] for n in ns})!=1:raise ValueError('SCOPE_COHORT_COMPATIBILITY')
  vals=[d2.number(n['value']) for n in ns];exact=None
  with localcontext() as ctx:
   ctx.prec=70
   if op=='sum':v=sum(vals,Decimal(0))
   elif op=='subtract':v=vals[0]-vals[1]
   elif op=='ratio':exact=dict(numerator=d2.text(vals[0]),denominator=d2.text(vals[1]));v=d2.number(d2.ratio(**dict(a=exact['numerator'],b=exact['denominator'])))
   elif op=='average_ratio':exact=dict(numerator=d2.text(vals[0]),denominator=d2.text((vals[1]+vals[2])/2));v=d2.number(d2.ratio(exact['numerator'],exact['denominator']))
   elif op=='growth':exact=dict(numerator=d2.text(vals[0]-vals[1]),denominator=d2.text(vals[1]));v=d2.number(d2.ratio(exact['numerator'],exact['denominator']))
   else:raise ValueError('FORMULA')
  unit=ns[0]['unit'] if op in ('sum','subtract') else 'RATIO'
  result=dict(id='TCB:P26:'+name+':'+str(year),key=name,ticker='TCB',year=year,classification='DERIVED_METRIC',value=d2.text(v),status=status,unit=unit,currency='VND' if unit=='VND' else None,scope=ns[0]['scope'],sourceCohort=ns[0]['sourceCohort'],population=population or ns[0]['population'],periodType='ANNUAL_DIAGNOSTIC',periodStart=f'{year}-01-01',periodEnd=f'{year}-12-31',revision='EXPLICIT_FY2025_CURRENT_COMPARATIVE_RESEARCH_COHORT',formula=op,definition=definition,operandIds=[n['id'] for n in ns],sourceHashes=sorted({n['source']['sha256'] for n in ns if 'source' in n}|{h for n in ns for h in n.get('sourceHashes',[])}),exactFraction=exact,rounding='12dp HALF_EVEN ratios;70-digit Decimal working precision;exact addition/subtraction',confidence='HIGH_ARITHMETIC; MEDIUM_ECONOMIC_CONTEXT',limitations=definition,productionAdmissible=False)
  ledger[name+':'+str(year)]=result;return result
 for y in [2024,2025]:
  derive('PARENT_EQUITY',[('GROUP_EQUITY',y),('NCI_EQUITY',y)],'subtract','Reported parent-attributable equity; common/TCE allocation not automatically qualified.',y,population='PARENT_ATTRIBUTABLE_BOOK')
  derive('COMMON_NUMERATOR_BRIDGE',[('PARENT_NPAT',y),('WELFARE_ADJUSTMENT',y)],'sum','Matches reported ordinary EPS numerator; not sustainable earnings.',y,population='ORDINARY_EPS_NUMERATOR_NOT_SUSTAINABLE')
  derive('NPL_BANK_CORE',[('LOAN_GROUP3',y),('LOAN_GROUP4',y),('LOAN_GROUP5',y)],'sum','Groups3–5 of classified banking loans, excluding margin/advances.',y,population='BANK_CUSTOMER_CLASSIFIED_LOANS_EX_MARGIN')
  derive('BANK_RESERVE',[('GENERAL_RESERVE',y),('SPECIFIC_RESERVE',y)],'sum','Customer classified bank-loan allowance, excluding margin allowance.',y,population='BANK_CUSTOMER_CLASSIFIED_LOANS_EX_MARGIN')
  derive('NPL_BANK_CORE_RATIO',[('NPL_BANK_CORE',y),('BANK_CORE_LOANS',y)],'ratio','Population-compatible banking NPL ratio. Not group NPL divided by gross loans including securities margin.',y)
  derive('NPL_COVERAGE_BANK_CORE',[('BANK_RESERVE',y),('NPL_BANK_CORE',y)],'ratio','Bank classified reserve / bank classified groups3–5.',y)
  derive('GROUP2_BANK_CORE_RATIO',[('LOAN_GROUP2',y),('BANK_CORE_LOANS',y)],'ratio','Special mention / same classified banking-loan population.',y)
  derive('REAL_ESTATE_BUSINESS_SHARE',[('REAL_ESTATE_BUSINESS_LOANS',y),('BANK_CORE_LOANS',y)],'ratio','Narrow industry business-real-estate exposure; excludes unallocated mortgages/other correlated channels.',y)
  derive('DEMAND_DEPOSIT_SHARE',[('CUSTOMER_DEMAND',y),('CUSTOMER_DEPOSITS',y)],'ratio','Reported demand-deposit proportion, not automatically approved CASA definition or franchise advantage.',y)
  derive('DEPOSIT_COMPONENT_RECONCILIATION',[('CUSTOMER_DEMAND',y),('CUSTOMER_TERM',y),('CUSTOMER_MARGIN_DEPOSIT',y)],'sum','Demand+term+margin deposits; no interbank deposits included.',y)
  derive('INTEREST_EXPENSE_RECONCILIATION',[(k,y) for k in ['DEPOSIT_INTEREST_EXPENSE','BORROWING_INTEREST_EXPENSE','INSTRUMENT_INTEREST_EXPENSE','OTHER_CREDIT_INTEREST_EXPENSE']],'sum','Reported P&L components; current/prior columns image-checked.',y)
  derive('NII',[('INTEREST_INCOME',y),('INTEREST_EXPENSE',y)],'subtract','Recognized group NII, not NIM or cash receipt.',y)
  derive('NET_CASH_INTEREST',[('CASH_INTEREST_RECEIVED',y),('CASH_INTEREST_PAID_SIGNED',y)],'sum','Cash interest received less paid; not industrial CFO/free cash flow.',y)
  derive('INTEREST_RECEIPT_RECOGNITION_GAP',[('INTEREST_INCOME',y),('CASH_INTEREST_RECEIVED',y)],'subtract','Accrual income minus receipts; not forced to equal movement in all accrued-interest/fee balances.',y)
  derive('CUSTOMER_PROVISION_FLOW',[('CUSTOMER_GENERAL_PROVISION_FLOW',y),('CUSTOMER_SPECIFIC_PROVISION_FLOW',y)],'sum','Bank-customer provisioning flow; excludes margin/other reversals; not normalized credit cost.',y,population='BANK_CUSTOMER_CLASSIFIED_LOANS_EX_MARGIN')
  derive('SHARE_MOVEMENT',[('OPENING_SHARES',y),('ISSUED_SHARES',y)],'sum','Exact disclosed ordinary share movement; not a completed issue-term/return audit.',y)
 derive('CUSTOMER_CREDIT_COST_REPORTED',[('CUSTOMER_PROVISION_FLOW',2025),('BANK_CORE_LOANS',2024),('BANK_CORE_LOANS',2025)],'average_ratio','Reported bank-customer provision charge / simple average classified core loans; not through-cycle expected credit loss.')
 derive('EPS_NUMERATOR_PARENT_BOOK_RETURN_PROXY',[('COMMON_EPS_NUMERATOR',2025),('PARENT_EQUITY',2024),('PARENT_EQUITY',2025)],'average_ratio','Diagnostic only: common EPS numerator over parent book proxy; other-equity/intangible/NCI allocation unresolved, so not sustainable ROE or ROTE.',status='REFERENCE_ONLY')
 for k in ['COMMON_EPS_NUMERATOR','REPORTED_BASIC_EPS','CLOSING_SHARES','BANK_CORE_LOANS','FEE_NET']:
  derive(k+'_GROWTH',[ (k,2025),(k,2024)],'growth','FY2025 versus explicitly qualified FY2024 comparative; no wider action/cycle/forecast inference.')
 derive('PARENT_BOOK_ROLLFORWARD',[('PARENT_EQUITY',2024)]+[(k,2025) for k in ['PARENT_NPAT','PARENT_SHARE_CAPITAL_MOVEMENT','PARENT_SHARE_PREMIUM_MOVEMENT','PARENT_RETAINED_CAPITAL_TRANSACTION','WELFARE_ADJUSTMENT','PARENT_FUND_USE','PARENT_DIVIDEND_MOVEMENT']],'sum','Exact parent-equity rollforward including direct retained-capital transaction separately from P&L earnings.',population='PARENT_ATTRIBUTABLE_BOOK')
 derive('REG_CAPITAL_SUM',[('TIER1',2025),('TIER2',2025)],'sum','Reported regulatory capital components, not accounting/common capital.')
 derive('REG_CAPITAL_RECONCILIATION',[('REG_CAPITAL_SUM',2025),('CAPITAL_DEDUCTIONS',2025)],'subtract','Tier1+Tier2 minus stated total deductions; TT41 regulatory scope.')
 derive('REPORTED_FLOOR_CAR_BUFFER',[('REPORTED_CAR',2025),('REPORTED_MIN_CAR',2025)],'subtract','CAR above issuer-stated8% floor; excludes unqualified Pillar2/other requirements and is not a stress buffer certificate.')
 missing={
 'SUSTAINABLE_COMMON_EARNINGS':'Credit-cycle/fee/one-off and common-owner adjustment assumptions not qualified/approved.',
 'COMMON_EQUITY_FOR_VALUATION':'Parent book equity known, but treatment of other equity7,764,086 million and common-owner restrictions requires qualification.',
 'TANGIBLE_COMMON_EQUITY':'Intangibles known at group scope; no qualified goodwill/allocation/NCI/common-capital bridge. No automatic group-intangibles subtraction.',
 'SUSTAINABLE_ROE':'Needs qualified common capital and normalized earnings; historical group/proxy ROE is not substitute.',
 'REPORTED_OR_NORMALIZED_NIM':'No qualified complete average interest-earning asset denominator/population. Total assets are not earning assets.',
 'NORMALIZED_CREDIT_COST':'Two current/comparative reported charges do not establish expected through-cycle or stress loss.',
 'APPROVED_CASA':'Demand-deposit mix mapped; current/savings population semantics not promoted into an approved CASA definition.',
 'CUSTOMER_ONLY_FUNDING_COST':'Reported deposit expense includes populations beyond customer deposits; daily weighted balances and expense allocation missing.',
 'UNRESTRICTED_LIQUIDITY_COVENANT_COVERAGE':'Maturity table is gross with behavioural assumptions and includes required reserves; complete unrestricted funds/covenant schedule not qualified.',
 'CET1':'Tier1 is disclosed, not an automatic CET1 substitute.',
 'VALUATION_CUTOFF_COMPATIBLE_SHARES':'FY2025 closing and weighted shares qualified; later2026 rights/actions and owner valuation basis remain unapproved.',
 'SECURITIES_INTEREST_UNCOLLECTED_2025':'PDF dash on page79 is not a verified zero.'}
 for key,reason in missing.items():ledger[key]=dict(id='TCB:P26:MISSING:'+key,key=key,ticker='TCB',classification='UNQUALIFIED_DEPENDENCY',value=None,status='MISSING',unit=None,scope='UNQUALIFIED',year=None,formula=None,operandIds=[],sourceHashes=[],confidence='NOT_ASSESSED',limitations=reason,productionAdmissible=False)
 # Prior data retained by exact pointer rather than copied/relabelled as new facts.
 historical=[dict(id=m['id'],status=m['status'],value=m['value'],concept=m['concept'],year=m['year'],scope=m['scope'],binding=bind(PRIOR,f'/metrics/{i}')) for i,m in enumerate(prior['metrics'])]
 narratives=[]
 statements={
 10:('AUDIT_OPINION','EY opinion is unmodified on the FY2025 consolidated VAS statements; dated16March2026. Opinion date is not original publication time or a governance quality guarantee.'),
 17:('BUSINESS_MODEL','Deposit taking, lending, payments, treasury, investments and FX are stated activities;302branches/offices and5subsidiaries/1associate as reported. This does not establish moat or market share.'),
 70:('ALLOCATION_EVENTS','Equity statement distinguishes parent/common, NCI and other equity. It reports welfare allocation, dividends and June2025 increase in Techcom Non-Life Insurance stake11%→68%; later investment returns not established.'),
 71:('SHARE_RIGHTS','Reported share capital is ordinary, one vote per share, equal residual priority. This is a stated ordinary-share right, not proof of complete minority safeguards or identification of other capital instruments.'),
 80:('RELATED_PARTY_DEFINITION','Related parties include control/influence, key managers and connected entities; definitions/disclosure exist but arm\'s-length economics and complete beneficial ownership not established.'),
 89:('RELATED_PARTY_RELATIONS','Disclosed relationships include overlapping boards/management and connected groups. Presence of disclosure is not either proof of wrongdoing or favorable shareholder treatment.'),
 90:('RISK_GOVERNANCE','Board and Risk Committee oversight and credit/liquidity/market risk policies are described by the issuer; effectiveness and stress execution are not independently proven.'),
 92:('INTEREST_SENSITIVITY','Repricing gaps depend on fixed/floating periods and behavioural treatment for demand balances; not a qualified earnings-at-risk forecast.'),
 97:('MATURITY_ASSUMPTIONS','Demand-deposit maturity is modelled behaviourally; NHNN balances include required reserves. Do not call the page98 ladder wholly contractual or its gross gap spendable cash.')}
 for page,(key,text) in statements.items():narratives.append(dict(id='TCB:N:'+key,ticker='TCB',classification='QUALIFIED_REPORTED_DISCLOSURE_CONTEXT',claim=text,confidence='HIGH_FOR_REPORTED_CONTENT; not independent effectiveness assurance',notesBinding=bind(NOTES,f'/documents/2/pages/{page-1}'),source=dict(path=c['documents']['FY25']['path'],sha256=c['documents']['FY25']['sha256'],physicalPage=page),newImageReview=True,publicationAt=None))
 inventory=[]
 for p in sorted((ROOT/'data/manual-download/TCB').rglob('*.pdf')):
  rel=str(p.relative_to(ROOT));h=p1.sha(p);PINS[rel]=h;matches=[i for i,d in enumerate(notes['documents']) if d['sourceHash']==h]
  inventory.append(dict(path=rel,sha256=h,notesDocumentIndices=matches,status='RETAINED_IDENTIFIED_PREDECESSOR_SOURCE' if matches else 'RETAINED_NOT_SELECTED_NEW_SOURCE_QUALIFICATION_NOT_ASSUMED'))
 return dict(ticker='TCB',classification='RESEARCH_PROVISIONAL',productionAdmissible=False,financials=ledger,narratives=narratives,priorMetrics=historical,inventory=inventory,missing=missing,inputPins=PINS)

if __name__=='__main__':
 x=financials();write('evidence-ledger.json',x);print(json.dumps(dict(facts=sum(n['classification']=='REPORTED_FACT' for n in x['financials'].values()),derived=sum(n['classification']=='DERIVED_METRIC' for n in x['financials'].values()),missing=len(x['missing']))))
