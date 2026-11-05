"""Six-issuer research metric graph. No production DTOs, persistence or binary floats."""
from decimal import Decimal, localcontext, ROUND_HALF_EVEN
import re
import unicodedata

PILOT = ('FPT', 'VNM', 'BID', 'TCX', 'VIC', 'VHM')
SECTORS = dict(FPT='TECHNOLOGY', VNM='CONSUMER_DAIRY', BID='BANK', TCX='SECURITIES', VIC='COMPLEX_GROUP', VHM='DEVELOPER')
STATUSES = ('READY_FOR_REVIEW', 'SUPPORTED', 'REFERENCE_ONLY', 'CONFLICT', 'MISSING', 'NOT_RATED')
VERSION = 'dfr02-sector-metric-mapping-v1'


def number(x):
    if not isinstance(x, str) or not re.fullmatch(r'-?(0|[1-9]\d*)(\.\d+)?', x):
        raise ValueError('LOSSLESS_DECIMAL_STRING_REQUIRED')
    d = Decimal(x)
    if not d.is_finite(): raise ValueError('FINITE_DECIMAL_REQUIRED')
    return d


def text(d):
    s = format(d, 'f')
    return s.rstrip('0').rstrip('.') if '.' in s else s


def ratio(a, b):
    if number(b) <= 0: raise ValueError('POSITIVE_DENOMINATOR_REQUIRED')
    with localcontext() as c:
        c.prec = 70
        return text((number(a) / number(b)).quantize(Decimal('.000000000001'), rounding=ROUND_HALF_EVEN))


def normalize(s):
    return re.sub(r'[^a-z0-9]+', ' ', ''.join(c for c in unicodedata.normalize('NFD', s.lower().replace('đ', 'd')) if unicodedata.category(c) != 'Mn')).strip()


def pointer(value, p):
    if p == '': return value
    if not p.startswith('/'): raise ValueError('INVALID_POINTER')
    for token in p[1:].split('/'):
        token = token.replace('~1', '/').replace('~0', '~')
        if token in ('__proto__', 'constructor', 'prototype'): raise ValueError('UNSAFE_POINTER')
        value = value[int(token)] if isinstance(value, list) else value[token]
    return value


def esc(s): return s.replace('~', '~0').replace('/', '~1')


def disposition(deps):
    if any(d['status'] == 'CONFLICT' for d in deps): return 'CONFLICT'
    if not deps or any(d['status'] in ('MISSING', 'NOT_RATED') for d in deps): return 'MISSING'
    if all(d['status'] == 'SUPPORTED' for d in deps): return 'SUPPORTED'
    if any(d['status'] == 'REFERENCE_ONLY' for d in deps): return 'REFERENCE_ONLY'
    return 'READY_FOR_REVIEW'


def provider_disposition(unit, mode_mismatch, values):
    valid=[number(v) for v in values if v is not None]
    if len(valid)>=5 and all(v==0 for v in valid):return 'REFERENCE_ONLY','SUSPICIOUS_CLUSTERED_ZEROS_REQUIRE_REVIEW'
    if unit is None:return 'REFERENCE_ONLY','PROVIDER_UNIT_UNDECLARED'
    if mode_mismatch:return 'REFERENCE_ONLY','PROVIDER_MODE_MISMATCH'
    return 'READY_FOR_REVIEW','SCOPE_TEMPLATE_AND_QUALITY_REVIEW_REQUIRED'


def rubric_disposition(rubric, metric_states):
    deps=[metric_states[k] for k in rubric['dependencyIds'] if k in metric_states]
    if 'CONFLICT' in deps:return dict(status='CONFLICT',points=None)
    if any(x in ('MISSING','REFERENCE_ONLY','READY_FOR_REVIEW') for x in deps):return dict(status='NOT_RATED',points=None)
    return dict(status=rubric['status'],points=rubric['points'])


def compatible(deps, years=False):
    if len({(x['scope'], x.get('currency')) for x in deps}) != 1: return False
    if len({(x.get('unit'),x.get('scale')) for x in deps})!=1:return False
    if any(x.get('scale')!='1' or x.get('unit') not in ('CURRENCY','RATIO','VND_PER_SHARE','SHARES') for x in deps):return False
    if any(x.get('revisionBasis') != 'ORIGINAL_REVIEWED_VINTAGE' for x in deps): return False
    for x in deps:
        if x.get('periodType') not in ('ANNUAL', 'INSTANT', 'MULTI_YEAR'): return False
        y = str(x['year'])
        if x['periodEnd'] != y+'-12-31': return False
        if x['periodType'] == 'ANNUAL' and x.get('periodStart') != y+'-01-01': return False
    multi=[x for x in deps if x.get('periodType')=='MULTI_YEAR']
    if multi and (len(multi)!=len(deps) or len({x['periodStart'] for x in multi})!=1): return False
    return years or len({x['year'] for x in deps}) == 1


# These are exact captions, NOT fuzzy or amount-based matches. Source-page/period
# identity and the predecessor's verified definition are mandatory in the builder.
CAPTIONS = {
 'REVENUE':['Doanh thu thuần về bán hàng và cung cấp dịch vụ','Doanh thu thuần','Doanh thu thuần bán hàng và cung cấp dịch vụ'],
 'NET_INCOME':['Lợi nhuận sau thuế thu nhập doanh nghiệp','Lợi nhuận sau thuế','Tổng lợi nhuận sau thuế','Tổng lợi nhuận kế toán sau thuế'],
 'NET_INCOME_ATTRIBUTABLE_PARENT':['Lợi nhuận sau thuế của cổ đông công ty mẹ','Lợi nhuận sau thuế thuộc về cổ đông của công ty mẹ','Lợi nhuận sau thuế của công ty mẹ','Lợi nhuận sau thuế của chủ sở hữu công ty mẹ'],
 'TOTAL_ASSETS':['Tổng cộng tài sản','Tổng tài sản'],
 'TOTAL_EQUITY':['Vốn chủ sở hữu','D. Vốn chủ sở hữu','B. Vốn chủ sở hữu'],
 'CFO':['Lưu chuyển tiền thuần từ hoạt động kinh doanh','Lưu chuyển tiền từ hoạt động kinh doanh'],
 'CASH_CAPEX_REPORTED':['Tiền chi để mua sắm, xây dựng TSCĐ và các tài sản dài hạn khác','Tiền chi mua sắm, xây dựng TSCĐ và các tài sản dài hạn khác'],
 'CASH_AND_EQUIVALENTS':['Tiền và các khoản tương đương tiền'],
 'CURRENT_ASSETS':['Tài sản ngắn hạn','A. Tài sản ngắn hạn'],
 'CURRENT_LIABILITIES':['Nợ ngắn hạn','I. Nợ ngắn hạn'],
 'INVENTORY':['Hàng tồn kho'], 'RECEIVABLES':['Các khoản phải thu ngắn hạn','Phải thu ngắn hạn'],
 'GROSS_PROFIT':['Lợi nhuận gộp về bán hàng và cung cấp dịch vụ','Lợi nhuận gộp'],
 'OPERATING_PROFIT':['Lợi nhuận thuần từ hoạt động kinh doanh'],
 'BANK_GROSS_CUSTOMER_LOANS':['Cho vay khách hàng'], 'BANK_CUSTOMER_DEPOSITS':['Tiền gửi của khách hàng','Tiền gửi khách hàng'],
 'BANK_NET_INTEREST_INCOME':['Thu nhập lãi thuần'], 'BANK_LOAN_LOSS_RESERVES':['Dự phòng rủi ro cho vay khách hàng'],
 'SECURITIES_MARGIN_LOANS':['Các khoản cho vay giao dịch ký quỹ','Cho vay giao dịch ký quỹ','Cho vay hoạt động ký quỹ'],
}


def page_numbers(record, checked=None):
    if checked and checked.get('page'): return [checked['page']]
    p = record.get('physicalPage') or record.get('page')
    if p: return [p]
    s = (record.get('evidenceLocator') or '')+' '+(record.get('evidenceReference') or '')
    return sorted({int(x) for x in re.findall(r'(?:PDF[- ]page[= :]*|PDF\s+p|Original PDF p|page:|page\s+)(\d+)', s, re.I)})


def match_pdf_candidates(index, item, year, pdf_hash, pages, code=None):
    captions = {normalize(x) for x in CAPTIONS.get(item, [])}
    result = []
    for c in index:
        if c['pdfHash'] != pdf_hash or c['page'] not in pages: continue
        if c['year'] != year or c['periodType'] not in ('ANNUAL','INSTANT'): continue
        label = normalize(c['label'])
        label = re.sub(r'^\d+ ', '', label)
        if label in captions or (code is not None and c['code'] == code): result.append(c)
    return result


class Graph:
    def __init__(self, ticker):
        if ticker not in PILOT: raise ValueError('SIX_ISSUER_SCOPE_ONLY')
        self.ticker, self.nodes, self.by_key = ticker, {}, {}

    def add(self, n):
        if n['id'] in self.nodes: raise ValueError('DUPLICATE_NODE')
        if n['status'] not in STATUSES: raise ValueError('INVALID_STATUS')
        if n.get('value') is not None: number(n['value'])
        self.nodes[n['id']] = n
        if n.get('concept') and n.get('year'): self.by_key[(n['concept'],n['year'],n.get('scope','CONSOLIDATED'))] = n['id']
        return n

    def fact(self, concept, year, scope='CONSOLIDATED'):
        key=(concept,year,scope)
        if key not in self.by_key:
            self.add(dict(id=f'{self.ticker}:{scope}:{concept}:{year}',concept=concept,year=year,scope=scope,periodStart=None,periodEnd=f'{year}-12-31',periodType='INSTANT',currency='VND',unit='CURRENCY',scale='1',revisionBasis='ORIGINAL_REVIEWED_VINTAGE',value=None,status='MISSING',kind='REPORTED_FACT',dependencyIds=[],reasons=['NO_QUALIFIED_SOURCE_OPERAND']))
        return self.nodes[self.by_key[key]]

    def derive(self, name, year, deps, op, definition, scope='CONSOLIDATED', across_years=False):
        status=disposition(deps);value=None;why=[];exact=None
        if status=='SUPPORTED' and not compatible(deps,across_years): status='CONFLICT';why=['PERIOD_SCOPE_OR_REVISION_MISMATCH']
        if status=='SUPPORTED':
            v=[number(x['value']) for x in deps]
            with localcontext() as c:
                c.prec=70
                if op=='sum': value=text(sum(v,Decimal(0)))
                elif op=='subtract': value=text(v[0]-v[1])
                else:
                    a,b=(v[0],v[1]) if op in ('ratio','growth') else (v[0],(v[1]+v[2])/2)
                    if b<=0: status='MISSING';why=['NONPOSITIVE_DENOMINATOR_NOT_MEANINGFUL']
                    else:
                        if op=='growth': a-=b
                        value=ratio(text(a),text(b));exact=dict(numerator=text(a),denominator=text(b))
        if status!='SUPPORTED': why+=['DEPENDENCY_NOT_QUALIFIED']
        multi=(op=='sum' and len({x['year'] for x in deps})>1) or all(x['periodType']=='MULTI_YEAR' for x in deps)
        start=min(x['periodStart'] for x in deps) if multi else f'{year}-01-01'
        return self.add(dict(id=f'{self.ticker}:{scope}:{name}:{year}',concept=name,year=year,scope=scope,periodStart=start,periodEnd=f'{year}-12-31',periodType='MULTI_YEAR' if multi else 'ANNUAL',currency='VND' if op in ('sum','subtract') else None,unit='CURRENCY' if op in ('sum','subtract') else 'RATIO',scale='1',revisionBasis='ORIGINAL_REVIEWED_VINTAGE',kind='DERIVED_METRIC',value=value,status=status,dependencyIds=[x['id'] for x in deps],formula=op,definition=definition,exactFraction=exact,rounding='12dp HALF_EVEN for ratios; exact decimal add/subtract',reasons=why))

    def recalculate_dispositions(self, changes):
        """Return status-only replay for adversarial source changes; no global issuer veto."""
        states={k:changes.get(k,n['status']) for k,n in self.nodes.items()}
        for k,n in self.nodes.items():
            if n['kind']=='DERIVED_METRIC' and n['dependencyIds']:
                inherited=disposition([{'status':states[i]} for i in n['dependencyIds']])
                states[k]=n['status'] if inherited=='SUPPORTED' else inherited
        return states


COMMON = ('TOTAL_ASSETS','TOTAL_EQUITY','NET_INCOME')
CORPORATE = ('REVENUE','NET_INCOME_ATTRIBUTABLE_PARENT','CASH_AND_EQUIVALENTS','CFO','CURRENT_ASSETS','CURRENT_LIABILITIES','RECEIVABLES','INVENTORY','GROSS_PROFIT','OPERATING_PROFIT','SHORT_TERM_FINANCIAL_BORROWINGS','LONG_TERM_FINANCIAL_BORROWINGS')
BANK = ('BANK_NET_INTEREST_INCOME','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS','BANK_LOAN_LOSS_RESERVES','BANK_REPORTED_CAR')
SECURITIES = ('CASH_AND_EQUIVALENTS','SECURITIES_MARGIN_LOANS','FINANCIAL_DEBT','CURRENT_ASSETS','CURRENT_LIABILITIES')


def build_metrics(g):
    bank=g.ticker=='BID'; sec=g.ticker=='TCX'
    for y in range(2022,2026):
        f=lambda k,yy=y:g.fact(k,yy,'STANDALONE' if sec else 'CONSOLIDATED')
        scope='STANDALONE' if sec else 'CONSOLIDATED'
        d=lambda name,dep,op,definition,across=False:g.derive(name,y,dep,op,definition,scope,across)
        for k in COMMON+(BANK if bank else SECURITIES if sec else CORPORATE): f(k)
        d('GROUP_EQUITY_ASSETS',[f('TOTAL_EQUITY'),f('TOTAL_ASSETS')],'ratio','Reported equity incl NCI / assets; not regulatory CAR or ordinary-share NAV')
        if y>2022:
            d('GROUP_ROA_AVG',[f('NET_INCOME'),f('TOTAL_ASSETS',y-1),f('TOTAL_ASSETS')],'average_ratio','Reported group NPAT / average group assets; not normalized return',True)
            d('GROUP_ROE_AVG',[f('NET_INCOME'),f('TOTAL_EQUITY',y-1),f('TOTAL_EQUITY')],'average_ratio','Reported group NPAT / average total equity, both include NCI where consolidated; not common normalized ROE',True)
        if bank:
            for name,a,b,meaning in [('LOAN_DEPOSIT','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS','Customer gross loans / customer deposits; not regulatory LDR'),('RESERVES_GROSS_LOANS','BANK_LOAN_LOSS_RESERVES','BANK_GROSS_CUSTOMER_LOANS','Loan-loss reserves / gross loans; NOT NPL coverage'),('NII_ASSETS_CLOSING','BANK_NET_INTEREST_INCOME','TOTAL_ASSETS','NII / closing total assets; NOT NIM')]:d(name,[f(a),f(b)],'ratio',meaning)
        elif sec:
            for name,a,b,meaning in [('MARGIN_LOANS_EQUITY','SECURITIES_MARGIN_LOANS','TOTAL_EQUITY','Margin financing / own standalone equity; not industrial receivables'),('FINANCIAL_DEBT_EQUITY','FINANCIAL_DEBT','TOTAL_EQUITY','Securities financing liabilities / standalone equity'),('CASH_FINANCIAL_DEBT','CASH_AND_EQUIVALENTS','FINANCIAL_DEBT','Cash / reported financing debt; not segregated client-money liquidity qualification')]:d(name,[f(a),f(b)],'ratio',meaning)
        else:
            debt=d('DISCLOSED_BORROWINGS',[f('SHORT_TERM_FINANCIAL_BORROWINGS'),f('LONG_TERM_FINANCIAL_BORROWINGS')],'sum','Disclosed short + long financial borrowings; not full M3 debt, leases, convertibles or guarantees')
            for name,a,b,meaning in [('REPORTED_NET_MARGIN','NET_INCOME','REVENUE','Group NPAT / revenue; not normalized margin'),('GROSS_MARGIN','GROSS_PROFIT','REVENUE','Reported gross profit / net revenue'),('CURRENT_RATIO','CURRENT_ASSETS','CURRENT_LIABILITIES','Current assets / current liabilities; inventory/customer advances require separate review'),('CFO_REPORTED_NPAT','CFO','NET_INCOME','Diagnostic reported CFO / reported group NPAT; NOT M3 normalized cash conversion'),('RECEIVABLES_REVENUE','RECEIVABLES','REVENUE','Closing disclosed receivables / annual revenue; NOT turnover days or impairment allowance')]:d(name,[f(a),f(b)],'ratio',meaning)
            d('DISCLOSED_BORROWINGS_EQUITY',[debt,f('TOTAL_EQUITY')],'ratio','Disclosed borrowings / total equity; does not qualify full debt contract')
            capex=f('CASH_CAPEX_REPORTED')
            d('POST_ACQUISITION_CASH',[f('CFO'),capex],'subtract','CFO minus reported cash acquisition spending; not maintenance-normalized owner FCF, nor project RNAV')
        trend_keys=('TOTAL_ASSETS','TOTAL_EQUITY','NET_INCOME')+(('BANK_NET_INTEREST_INCOME','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS') if bank else ('SECURITIES_MARGIN_LOANS',) if sec else ('REVENUE','NET_INCOME_ATTRIBUTABLE_PARENT','CFO','RECEIVABLES','INVENTORY'))
        if y>2022:
            for k in trend_keys:d(k+'_YOY',[f(k),f(k,y-1)],'growth','Same-scope calendar-year reported change / positive previous-year base; not normalized per-share growth',True)
    scope='STANDALONE' if sec else 'CONSOLIDATED'
    for k in ('NET_INCOME','TOTAL_ASSETS','TOTAL_EQUITY')+(('BANK_GROSS_CUSTOMER_LOANS',) if bank else ('SECURITIES_MARGIN_LOANS',) if sec else ('REVENUE',)):
        g.derive(k+'_FY22_25_CHANGE',2025,[g.fact(k,2025,scope),g.fact(k,2022,scope)],'growth','FY2022 to FY2025 cumulative reported change, NOT CAGR',scope,True)
    if not bank and not sec:
        cf=g.derive('CUMULATIVE_CFO',2025,[g.fact('CFO',y) for y in range(2022,2026)],'sum','Sum four full original-vintage consolidated annual CFO observations',across_years=True)
        ni=g.derive('CUMULATIVE_REPORTED_NPAT',2025,[g.fact('NET_INCOME',y) for y in range(2022,2026)],'sum','Sum four full original-vintage annual group NPAT observations',across_years=True)
        g.derive('CUMULATIVE_CFO_REPORTED_NPAT',2025,[cf,ni],'ratio','Four-year group cash realization diagnostic, NOT normalized cash ratio')
    return g
