"""Owner-bounded v2 dispatch; composes sealed P1 contracts without changing them.

No network, database or formal scoring imports. New execution authority is an
exact stable-identity/sector/subtype/scope tuple, not a ticker switch.
"""
from dataclasses import dataclass
from copy import deepcopy
from decimal import Decimal
from collections import Counter
from lib import dfr05_p1 as p1
from lib import dfr02 as d2

ROOT = p1.ROOT
BASELINE = '264c7120462d2b638ec32900afb22fd56e74cd1a'
REL = 'docs/fundamental-data-engine/dfr-05/p2-2-acb-01-264c7120'
P1 = 'docs/fundamental-data-engine/dfr-05/p1-a46da9a8'
UNIVERSE = 'docs/fundamental-data-engine/dfr-05/p2-0-bd3a8b4b/proposed-vn30-universe.json'
PLAN = 'docs/fundamental-data-engine/dfr-05/p2-1-653d67f7/DFR_05_P2_1_ROUTE_QUALIFICATION_MATRIX.json'
UHASH = '931e8355854bccc45918b38f2c5061bfda0786bf4bb8779fbe213be8e5107d56'
CAPITAL = 'docs/fundamental-data-engine/evidence/2026-10-16-ticker-closure-ACB/ACB_CAPITAL_QUALIFICATION.json'
# Direct page readings, original current-year columns, independently checked
# against the PDF images during ACB-01. These are not inferred by dividing a
# canonical amount, nor selected by matching a provider's numerical value.
BOOK_READINGS = {
 2022: ('607875185','58438663','13688193','23533529','413706244','413952789'),
 2023: ('718794589','70955961','16044733','24959570','487601852','482702731'),
 2024: ('864005703','83461678','16789768','27794702','580686248','537304578'),
 2025: ('1025850127','94519719','15624699','26905695','686777352','585180175')
}
BOOK_CONCEPTS = ('TOTAL_ASSETS','TOTAL_EQUITY','NET_INCOME','BANK_NET_INTEREST_INCOME','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS')
BOOK_CAPTIONS = ('TỔNG TÀI SẢN','VIII Vốn chủ sở hữu','XIII Lợi nhuận sau thuế','I Thu nhập lãi thuần','1 Cho vay khách hàng, before provision','III Tiền gửi của khách hàng')
BOOK_PAGES = (7,8,10,10,7,8)
BOOK_HASHES = {
 2022:'5adb13afc54dbdab5a6be3f0115010374f74ee809cf54daf8e693ab96db8a22d',
 2023:'76237feb17def2f188340f591a2b13a5894db746f19875f02c91493116a65236',
 2024:'5742d55acd4094db6a82d37340137db23ae2b18fc7399eef303c92ac3f003ada',
 2025:'2f79c3db9e362eee72fcdfca330359e9d9cbf510fd5fe6cdeb98dcf39deae35b'
}


@dataclass(frozen=True)
class Identity:
    securityId: str
    ticker: str
    m3Sector: str
    researchSubtype: str
    reportingScope: str


ACB = Identity('658fafbe-65b3-4176-999f-d4d32e1bd838', 'ACB', 'BANK', 'BANK', 'CONSOLIDATED')
NEW_ISSUER_ALLOWLIST = frozenset({ACB})


def authorize(identity):
    if not isinstance(identity, Identity) or identity not in NEW_ISSUER_ALLOWLIST:
        raise ValueError('NEW_ISSUER_IDENTITY_SECTOR_SUBTYPE_SCOPE_NOT_AUTHORIZED')
    return identity


def verify_identity(store, identity):
    authorize(identity)
    u = store.read(UNIVERSE)
    if p1.digest({k:v for k,v in u.items() if k != 'contentHash'}) != UHASH or u['contentHash'] != UHASH:
        raise ValueError('APPROVED_UNIVERSE_HASH')
    if u['researchReferenceDate'] != '2026-11-05' or u['version'] != '2026-11-05-v1':
        raise ValueError('APPROVED_UNIVERSE_DATE_VERSION')
    rows = [r for r in u['constituents'] if r['securityId'] == identity.securityId]
    if len(rows) != 1 or rows[0]['ticker'] != identity.ticker or rows[0]['existingSector'] != identity.m3Sector:
        raise ValueError('APPROVED_IDENTITY_BINDING')
    plan = store.read(PLAN)
    route = next(r for r in plan['rows'] if r['securityId'] == identity.securityId)
    if route['existingM3Sector'] != identity.m3Sector or route['proposedResearchSubtype'] != identity.researchSubtype or route['routeQualificationStatus'] != 'READY':
        raise ValueError('APPROVED_RESEARCH_ROUTE')
    return rows[0]


class RetainedAdapter:
    # Delegate original traversal, schema, Decimal/raw and PDF hash validation.
    records = p1.Adapter.records

    def __init__(self, store, kind, identity):
        verify_identity(store, identity)
        if kind not in p1.PRIMARY: raise ValueError('ADAPTER_KIND')
        self.store, self.kind, self.ticker = store, kind, identity.ticker
        self.path = p1.PRIMARY[kind].format(ticker=self.ticker)


class FinancialGraph:
    add = d2.Graph.add
    fact = d2.Graph.fact
    recalculate_dispositions = d2.Graph.recalculate_dispositions

    def derive(self, name, year, deps, op, definition, scope='CONSOLIDATED', across_years=False):
        # DFR02's accounting compatibility contract predates this regulatory
        # framework distinction. Add the guard, then reuse its arithmetic.
        regulatory=[d for d in deps if d.get('scope')=='REGULATORY_CONSOLIDATED']
        if regulatory:
            frameworks={d.get('regulatoryFramework') for d in regulatory}
            if len(regulatory)!=len(deps) or len(frameworks)!=1 or None in frameworks or scope!='REGULATORY_CONSOLIDATED':
                raise ValueError('REGULATORY_SCOPE_OR_FRAMEWORK_NOT_COMPARABLE')
        return d2.Graph.derive(self,name,year,deps,op,definition,scope,across_years)

    def __init__(self, identity):
        authorize(identity)
        self.identity = identity
        self.ticker, self.nodes, self.by_key = identity.ticker, {}, {}


class DependencyGraph:
    edge = p1.DependencyGraph.edge
    validate = p1.DependencyGraph.validate
    affected = p1.DependencyGraph.affected
    export = p1.DependencyGraph.export

    def __init__(self, identity):
        authorize(identity)
        self.identity, self.nodes, self.edges = identity, {}, set()

    def add(self, id, kind, ticker=None, status='REFERENCE_ONLY', **meta):
        authorize(self.identity)
        if ticker != self.identity.ticker: raise ValueError('STABLE_ISSUER_GRAPH_SCOPE')
        node = dict(id=id, kind=kind, ticker=ticker, status=status, securityId=self.identity.securityId, **meta)
        if id in self.nodes and self.nodes[id] != node: raise ValueError('DUPLICATE_GRAPH_ID')
        self.nodes[id] = node
        return id


def bank_recipe(g):
    """BANK economic route. All arithmetic and compatibility checks are DFR02's."""
    if g.identity.m3Sector != 'BANK' or g.identity.researchSubtype != 'BANK': raise ValueError('BANK_ROUTE_REQUIRED')
    for y in range(2022, 2026):
        f = lambda k, yy=y: g.fact(k, yy)
        derive = lambda name, deps, op, meaning, across=False: g.derive(name, y, deps, op, meaning, across_years=across)
        for k in d2.COMMON + d2.BANK[:-1] + ('NET_INCOME_ATTRIBUTABLE_PARENT',): f(k)
        derive('GROUP_EQUITY_ASSETS', [f('TOTAL_EQUITY'),f('TOTAL_ASSETS')], 'ratio', 'Group book equity/assets; not regulatory CAR or common-owner NAV')
        if y > 2022:
            derive('GROUP_ROA_AVG',[f('NET_INCOME'), f('TOTAL_ASSETS',y-1),f('TOTAL_ASSETS')],'average_ratio','Annual group NPAT/average original-vintage group assets; not normalized return',True)
            derive('GROUP_ROE_AVG',[f('NET_INCOME'), f('TOTAL_EQUITY',y-1),f('TOTAL_EQUITY')],'average_ratio','Annual group NPAT/average total group equity; not common-owner ROE',True)
        for name,a,b,meaning in [
            ('LOAN_DEPOSIT','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS','Gross customer loans/customer deposits; NOT regulatory LDR'),
            ('RESERVES_GROSS_LOANS','BANK_LOAN_LOSS_RESERVES','BANK_GROSS_CUSTOMER_LOANS','Specific+general loan reserves excluding separately disclosed margin-lending reserve/gross customer loans; NOT NPL coverage'),
            ('NII_ASSETS_CLOSING','BANK_NET_INTEREST_INCOME','TOTAL_ASSETS','NII/closing assets; NOT NIM')]:
            derive(name,[f(a),f(b)],'ratio',meaning)
        if y > 2022:
            for k in d2.COMMON + ('BANK_NET_INTEREST_INCOME','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS'):
                derive(k+'_YOY',[f(k),f(k,y-1)],'growth','Same-scope full-year/closing-balance reported change; not action-adjusted per-share growth',True)
    for k in d2.COMMON + ('BANK_GROSS_CUSTOMER_LOANS',):
        g.derive(k+'_FY22_25_CHANGE',2025,[g.fact(k,2025),g.fact(k,2022)],'growth','FY22 to FY25 cumulative reported change; NOT CAGR',across_years=True)


def financials(store, identity):
    verify_identity(store,identity)
    reuse = p1.module('dfr05_acb_d2_reuse','scripts/build-dfr02.py')
    path = p1.PRIMARY['PDF'].format(ticker=identity.ticker)
    index = reuse.pdf_index(store.read(path),path)
    native = store.read(reuse.NATIVE+'/native-inputs/'+identity.ticker+'.json')
    if native['securityId'] != identity.securityId or native['sector'] != identity.m3Sector: raise ValueError('NATIVE_IDENTITY')
    if any(o['securityId'] != identity.securityId or o['ticker'] != identity.ticker for o in native['observations']): raise ValueError('OBSERVATION_IDENTITY')
    source = reuse.NATIVE+'/native-review-sources.json'
    refs = store.read(source)
    caps = {v['id']:(i,v) for i,v in enumerate(refs['rawReferenceCaptures'])}
    contexts = {v['observationId']:v for v in refs['contexts']}
    g = FinancialGraph(identity)
    reuse.import_facts(store,g,source,caps,contexts,index)
    capital = store.read(CAPITAL)
    # These operands were checked directly against all four original note tables.
    reserve_operands = {2022:('1662513','3071021','116202','4849736',50),2023:('1657154','3592322','117476','5366952',50),2024:('2383004','4239076','117476','6739556',52),2025:('2525003','4982250','117476','7624729',51)}
    notes_path = p1.PRIMARY['NOTES'].format(ticker=identity.ticker)
    notes = store.read(notes_path)
    for m in list(g.nodes.values()):
        if m['scope'] != identity.reportingScope: raise ValueError('QUALIFIED_SCOPE_REQUIRED')
        if m['concept'] in ('BANK_REPORTED_CAR','BANK_REPORTED_CET1'):
            y=m['year']; i=next(i for i,r in enumerate(capital['periods']) if r['end']==f'{y}-12-31'); c=capital['periods'][i]
            field='CAR' if m['concept']=='BANK_REPORTED_CAR' else 'CET1'
            if c[field] != m['value'] or c['source']['SHA256'] != m['pdfEvidence']['sha256']: raise ValueError('REGULATORY_REVIEW_BINDING')
            # Keep input scope and original ID in audit; qualify the distinct economic scope.
            original_id=m['id'];old_key=(m['concept'],y,m['scope'])
            m.update(id=f'ACB:REGULATORY_CONSOLIDATED:{m["concept"]}:{y}',retainedObservationMetricId=original_id,inputScope=m['scope'],scope='REGULATORY_CONSOLIDATED',regulatoryFramework=c['framework'],regulatoryScopeBoundary=c['scopeBoundary'],capitalReviewBinding=store.bind(CAPITAL,f'/periods/{i}'),nativeSourceValue=c['reportedPercent'][field],nativeSourceUnit='PERCENT',nativeSourceMultiplier='0.01',definition=c['ratioIdentity'],valueState='NUMERIC')
            del g.nodes[original_id];del g.by_key[old_key]
            g.add(m)
            continue
        if m['concept']=='BANK_LOAN_LOSS_RESERVES':
            a,b,margin,total,page=reserve_operands[m['year']]
            if (d2.number(a)+d2.number(b))*Decimal(1000000) != d2.number(m['value']) or d2.number(a)+d2.number(b)+d2.number(margin) != d2.number(total): raise ValueError('RESERVE_COMPONENT_RECONCILIATION')
            di,doc=next((i,v) for i,v in enumerate(notes['documents']) if m['pdfEvidence']['path'] in v['pdfPaths'])
            pi=next(i for i,p in enumerate(doc['pages']) if p['page']==page)
            components=[]
            for concept,amount,caption in [('BANK_SPECIFIC_LOAN_RESERVE',a,'Dự phòng cụ thể'),('BANK_GENERAL_LOAN_RESERVE',b,'Dự phòng chung')]:
                node=g.add(dict(id=f'ACB:CONSOLIDATED:{concept}:{m["year"]}',concept=concept,year=m['year'],scope='CONSOLIDATED',kind='REPORTED_FACT',value=d2.text(d2.number(amount)*Decimal(1000000)),nativeSourceValue=amount,nativeSourceUnit='MILLION_CURRENCY',nativeSourceMultiplier='1000000',status='SUPPORTED',valueState='NUMERIC',currency='VND',unit='CURRENCY',scale='1',periodType='INSTANT',periodStart=f'{m["year"]}-12-31',periodEnd=f'{m["year"]}-12-31',revisionBasis='ORIGINAL_REVIEWED_VINTAGE',originalRevision='ORIGINAL',dependencyIds=[],publicationAt=None,pdfEvidence=deepcopy(m['pdfEvidence']),noteBinding=store.bind(notes_path,f'/documents/{di}/pages/{pi}'),sourceCaption=caption,column=f'Closing {m["year"]}-12-31',newImageReviewClaimed=True,reasons=['DIRECT_ORIGINAL_PDF_COMPONENT_REVIEW_NOT_INDEPENDENT_HUMAN']))
                components.append(node['id'])
            m.update(kind='DERIVED_METRIC',retainedRecordKind='REPORTED_FACT_AGGREGATE',formula='sum',dependencyIds=components,valueState='NUMERIC',newImageReviewClaimed=True,definition='Specific plus general loan reserves; excludes separately disclosed margin-lending provision. Not total balance-sheet contra and not NPL coverage.',nativeSourceValue=d2.text(d2.number(a)+d2.number(b)),nativeSourceUnit='MILLION_CURRENCY',nativeSourceMultiplier='1000000',noteBinding=store.bind(notes_path,f'/documents/{di}/pages/{pi}'),componentReconciliation=dict(specific=a,general=b,excludedMarginLending=margin,totalContra=total,unit='MILLION_VND',physicalPage=page,review='DIRECT_ORIGINAL_PDF_PAGE_VISUAL_REVIEW',reviewer='IMPLEMENTING_AGENT_NOT_INDEPENDENT_HUMAN',sourceHash=m['pdfEvidence']['sha256']))
            continue
        # Use caption + document hash + physical page + original year/scope, never amount to select a caption.
        candidates=[c for c in m['extractionCandidates'] if c['scope']=='CONSOLIDATED' and c['unit'] and c['unit'].get('unit')=='MILLION_CURRENCY' and c['unit'].get('scale')=='1000000']
        # Heading 'VI Cho vay...' is net; exact caption matching excludes that heading.
        ki=BOOK_CONCEPTS.index(m['concept']);y=m['year'];native_value=BOOK_READINGS[y][ki];page=BOOK_PAGES[ki]
        if m['pdfEvidence']['sha256']!=BOOK_HASHES[y] or page not in m['pdfEvidence']['pages'] or d2.number(native_value)*Decimal(1000000)!=d2.number(m['value']): raise ValueError('DIRECT_BOOK_READING_DISAGREES_WITH_RETAINED_REVIEW')
        di,doc=next((i,v) for i,v in enumerate(notes['documents']) if m['pdfEvidence']['path'] in v['pdfPaths'])
        pi=next(i for i,p in enumerate(doc['pages']) if p['page']==page)
        m.update(valueState='NUMERIC',newImageReviewClaimed=True,nativeSourceValue=native_value,nativeSourceUnit='MILLION_CURRENCY',nativeSourceMultiplier='1000000',noteBinding=store.bind(notes_path,f'/documents/{di}/pages/{pi}'),directPageReview=dict(physicalPage=page,caption=BOOK_CAPTIONS[ki],column=f'{y} original current-year column',scope='CONSOLIDATED',unit='MILLION_VND',sourceHash=BOOK_HASHES[y],reviewer='IMPLEMENTING_AGENT_NOT_INDEPENDENT_HUMAN',reason='Retained display omits page-8 balances/selected total rows or retains Roman-numeral captions; reuse native review and check original PDF, not amount-based caption matching.'))
        if len(candidates)==1:
            c=candidates[0]
            if c['value'] is None or d2.number(c['value'])*Decimal(1000000)!=d2.number(m['value']): raise ValueError('EXTRACTION_AND_VERIFIED_NATIVE_DISAGREE')
            m.update(nativeSourceLexicalValue=c['lexicalValue'],selectedExtractionBinding=store.bind(c['path'],c['jsonPointer']),nativeUnitEvidence=c['unit'])
    bank_recipe(g)
    for y in range(2022,2026):
        g.fact('NET_INCOME_ATTRIBUTABLE_PARENT',y).update(periodType='ANNUAL',periodStart=f'{y}-01-01',valueState='MISSING',reasons=['NO_SEPARATE_PARENT_NPAT_OPERAND_QUALIFIED; GROUP_NPAT_OR_EPS_NOT_A_SUBSTITUTE'])
    for y in range(2022,2025):
        ci=next(i for i,c in enumerate(capital['periods']) if c['end']==f'{y}-12-31')
        g.add(dict(id=f'ACB:REGULATORY_CONSOLIDATED:BANK_REPORTED_CET1:{y}',concept='BANK_REPORTED_CET1',year=y,scope='REGULATORY_CONSOLIDATED',kind='REPORTED_FACT',value=None,valueState='MISSING',retainedReviewValueState='EXPLICIT_NULL',status='MISSING',periodType='INSTANT',periodStart=f'{y}-12-31',periodEnd=f'{y}-12-31',currency=None,unit='RATIO',scale='1',revisionBasis='ORIGINAL_REVIEWED_VINTAGE',capitalReviewBinding=store.bind(CAPITAL,f'/periods/{ci}'),dependencyIds=[],reasons=['NO_EXPLICIT_CET1; TIER1_IS_NOT_CET1']))
    return list(g.nodes.values()),reuse.api_crosschecks(store,identity.ticker)


# Exact dependencies are specific to banking and partial financial evidence only.
GAPS = {
 'BQ-EQ':('RESEARCH_MAPPING','Normalize group and parent earnings, average economic capital and margins; qualify cost of capital. Group ROE alone is insufficient.'),
 'BQ-MOAT':('TOPIC_EVIDENCE_UNQUALIFIED','Qualify ACB-specific customer advantage, pricing behavior and persistence; statements do not establish a moat.'),
 'BQ-CASH':('RESEARCH_MAPPING','Reconcile accrued interest, interest collected, restructured loans, provisions and exceptional income; bank CFO/NPAT is prohibited as cash-quality substitute.'),
 'BQ-RES':('TOPIC_EVIDENCE_UNQUALIFIED','Qualify ACB deposit/borrower concentration, pricing response and cycle/stress evidence beyond reported balances.'),
 'FH-BS':('RESEARCH_MAPPING','Qualify loan-group migrations, NPL and restructured exposures, reserve denominator, deposit concentration and regulatory framework exclusions. Reported CAR is not full-topic acceptance.'),
 'FH-LIQ':('RESEARCH_MAPPING','Map ACB contractual maturity gaps, callable/unrestricted liquidity, funding concentration, covenants and contingent obligations.'),
 'FH-STRESS':('ANALYST_ASSUMPTIONS_REQUIRED','Specify deposit runoff, credit-loss and capital/funding response scenarios and qualify resulting constraints; no invented stress assumptions.'),
 'GQ-HIST':('RESEARCH_MAPPING','Reconcile corporate actions, dilution, acquisitions/base effects and normalized parent earnings before per-share growth assessment.'),
 'GQ-FWD':('TOPIC_EVIDENCE_UNQUALIFIED','Qualify lending/deposit runway, reinvestment, capital constraints and execution; historical loan growth is not a forecast.'),
 'GQ-INC':('RESEARCH_MAPPING','Identify incremental capital and recurring parent profit with a compatible lag/denominator and unit economics.'),
 'IC-IND':('TOPIC_EVIDENCE_UNQUALIFIED','Qualify banking entry barriers, competition, demand and digital/regulatory disruption under approved source authority.'),
 'IC-POS':('TOPIC_EVIDENCE_UNQUALIFIED','Qualify ACB market share, funding cost position and distribution economics; no market-share inference from balance-sheet size.'),
 'IC-CYCLE':('TOPIC_EVIDENCE_UNQUALIFIED','Qualify dated banking cycle evidence, forward loss/funding asymmetry and ACB survivability.'),
 'VAL-PRIMARY':('VALUATION_DEPENDENCY','Owner-approved valuation cutoff/source policy, action-adjusted shares/price, normalized common-owner earnings/book capital, economic assumptions and independent crosscheck.'),
 'VAL-RET':('VALUATION_DEPENDENCY','Approved starting price/value, dilution/action history, distributions, exit value, growth and scenario assumptions.'),
 'VAL-MOS':('VALUATION_DEPENDENCY','Approved conservative intrinsic value and downside stress with compatible price/share cutoff and loss/capital evidence.'),
 'RG-GOV':('TOPIC_EVIDENCE_UNQUALIFIED','Qualify ACB disclosure quality, related-party terms, minority protections and auditor findings; audited status alone is insufficient.'),
 'RG-RISK':('RESEARCH_MAPPING','Qualify residual credit/funding/operational channels and mitigations, with explicit overlap control; ratio proxies alone cannot rate risk.'),
 'RG-UNC':('ANALYST_ASSUMPTIONS_REQUIRED','Qualify common-earnings forecast ranges, sensitivity and regulatory/source dependencies before judging uncertainty.'),
 'CA-REINV':('RESEARCH_MAPPING','Map ACB investment/acquisition/divestment decisions and subsequent economic outcomes; industrial capex proxy is inapplicable.'),
 'CA-DIST':('VALUATION_DEPENDENCY','Qualify retention/distribution/buyback decisions against capital resilience and contemporaneous valuation; no assumed buyback value.'),
 'CA-DIL':('RESEARCH_MAPPING','Qualify actual issue terms, proceeds deployment and adjusted per-share outcomes across all corporate actions.'),
 'CA-PSV':('RESEARCH_MAPPING','Reconstruct action-adjusted common-owner per-share value over a cycle; no shares inferred from EPS or group NPAT.')
}

# Financial-context edges, not a claim that all required rubric topics are met.
TOPIC_METRICS = {
 'returns':('GROUP_ROE_AVG','GROUP_ROA_AVG'), 'persistence':('NET_INCOME_YOY',),
 'margins':('BANK_NET_INTEREST_INCOME','NII_ASSETS_CLOSING'),
 'capital':('BANK_REPORTED_CAR','BANK_REPORTED_CET1','TOTAL_EQUITY'),
 'asset_quality':('BANK_LOAN_LOSS_RESERVES','RESERVES_GROSS_LOANS'),
 'funding':('BANK_CUSTOMER_DEPOSITS','LOAN_DEPOSIT'),
 'leverage_context':('GROUP_EQUITY_ASSETS',), 'trend':('NET_INCOME_YOY','BANK_GROSS_CUSTOMER_LOANS_YOY'),
 'dependencies':('BANK_REPORTED_CAR','BANK_LOAN_LOSS_RESERVES'),
 'balance_sheet':('TOTAL_EQUITY','BANK_LOAN_LOSS_RESERVES'),
 'residual_risks':('LOAN_DEPOSIT','RESERVES_GROSS_LOANS')
}


def validate_dossier(d):
    authorize(Identity(d['securityId'],d['ticker'],d['sectorRouting']['approvedM3Sector'],d['sectorRouting']['researchSubtype'],d['sectorRouting']['qualifiedReportingScope']))
    if d['classification']!='RESEARCH_PROVISIONAL' or d['productionAdmissible'] is not False or d['scoringAuthorized'] is not False: raise ValueError('RESEARCH_ONLY')
    for k in ('totalScore','ranking','currentSignal','valuationPerShare','categoryScores'):
        if d[k] is not None: raise ValueError('NO_NEW_SCORE_OR_VALUATION')
    if len(d['rubrics'])!=23 or {r['rubric'] for r in d['rubrics']}!=set(GAPS): raise ValueError('EXACT_23_RUBRICS')
    specs={s['id']:s for s in p1.module('acb_contract_m3','scripts/build-dfr02.py').rubrics()}
    for r in d['rubrics']:
        if any(r[k] is not None for k in ('points','band','assessment')) or r['status']!='NOT_RATED' or r['productionScoringReady'] is not False: raise ValueError('NEW_ASSESSMENT_NOT_AUTHORIZED')
        if r['requiredTopics']!=specs[r['rubric']]['topics'] or r['category']!=specs[r['rubric']]['category'] or r['eligibility']!=GAPS[r['rubric']][0]: raise ValueError('UNCHANGED_M3_TOPIC_AND_DEFERRED_CONTRACT_REQUIRED')
    return True


def replay(store, identity=ACB):
    verify_identity(store,identity)
    metrics,crosschecks=financials(store,identity)
    required={(b['path'],b['jsonPointer']) for m in metrics for k in ('selectedExtractionBinding','noteBinding') if (b:=m.get(k))}
    required.update((c['path'],c['jsonPointer']) for m in metrics for c in m.get('extractionCandidates',[]))
    required.update((r['binding']['path'],r['binding']['jsonPointer']) for r in crosschecks)
    records=[];inventory=[]
    for kind in p1.PRIMARY:
        adapter=RetainedAdapter(store,kind,identity)
        cells=list(adapter.records())
        selected=[];witness=set()
        for c in cells:
            dims=p1.canonical([c.get(k) for k in ('report','period','scope','unit','valueState','requestMode')])
            if (c['binding']['path'],c['binding']['jsonPointer']) in required or (kind!='NOTES' and dims not in witness): selected.append(c)
            witness.add(dims)
        inventory.append(dict(kind=kind,binding=store.bind(adapter.path),rowsOrPages=len(cells),materializedRowsOrPages=len(selected),qualifiedByPresence=False,states=dict(Counter(r['valueState'] for r in cells)),dimensions=dict(Counter(p1.canonical([c.get('period'),c.get('scope'),c.get('unit')]) for c in cells))))
        records.extend(selected)
    graph=DependencyGraph(identity)
    def add(id,kind,status='REFERENCE_ONLY',**meta): return graph.add(id,kind,identity.ticker,status,**meta)
    def source(binding):
        id='SOURCE:ACB:'+binding['path']+'#'+binding['jsonPointer']
        add(id,'SOURCE_BINDING',binding=binding)
        return id
    for c in records:
        add(c['id'],c['kind'],c['status'],binding=c['binding'])
        graph.edge(source(c['binding']),c['id'],'UNREVIEWED_PRESENTATION_REFERENCE',False)
        if c.get('rawBinding') and c['rawBinding'].get('path'):
            graph.edge(source(c['rawBinding']),c['id'],'PROVIDER_RAW_LINEAGE',False)
    for m in metrics: add('METRIC:'+m['id'],'METRIC',m['status'],concept=m['concept'])
    for m in metrics:
        target='METRIC:'+m['id']
        for k in ('observationBinding','reviewPayloadBinding','selectedExtractionBinding','capitalReviewBinding','noteBinding'):
            if m.get(k): graph.edge(source(store.bind(m[k]['path'],m[k]['jsonPointer'])),target,'QUALIFIED_OPERAND')
        if m.get('pdfEvidence'):graph.edge(source(store.bind(m['pdfEvidence']['path'])),target,'ORIGINAL_PDF_HASH')
        for dep in m['dependencyIds']:graph.edge('METRIC:'+dep,target,'CALCULATION')
    # Topic schema comes directly from unchanged M3; no legacy BID identity replay.
    store.pin('src/domain/scoring/methodology.ts')
    methodology=p1.module('dfr05_acb_m3','scripts/build-dfr02.py').rubrics()
    rubrics=[]
    for spec in methodology:
        rid=spec['id']; cls,dependency=GAPS[rid]
        # M3 required topics are the unchanged sealed full-topic contract.
        topics=spec['topics']
        row=dict(id='ACB:'+rid,ticker='ACB',rubric=rid,category=rid.split('-')[0],requiredTopics=topics,status='NOT_RATED',eligibility=cls,points=None,band=None,assessment=None,productionScoringReady=False,deferred=dict(classification=cls,exactDependency=dependency,resolutionPath='Qualify the named retained evidence and obtain separate assessment authorization; acquire no new source without owner approval.',owner='Research analyst; owner for assumptions/source expansion',stopCondition='No new points/bands or production admission in ACB-01.'))
        rubrics.append(row); rnode=add('RUBRIC:ACB:'+rid,'RUBRIC','NOT_RATED',points=None)
        for topic in topics:
            tn=add('TOPIC:ACB:'+rid+':'+topic,'TOPIC','NOT_RATED',fullTopicQualified=False)
            graph.edge(tn,rnode,'REQUIRED_TOPIC')
            for m in metrics:
                if m['concept'] in TOPIC_METRICS.get(topic,()): graph.edge('METRIC:'+m['id'],tn,'PARTIAL_FINANCIAL_CONTEXT')
    dossier=dict(contract='dfr05-p2-2-research-v2',classification='RESEARCH_PROVISIONAL',securityId=identity.securityId,ticker=identity.ticker,reviewDate='2026-11-06',researchReferenceDate='2026-11-05',universeVersion='2026-11-05-v1',approvedUniverseContentHash=UHASH,financialPeriod='FY2022-FY2025',sectorRouting=dict(approvedM3Sector=identity.m3Sector,researchSubtype=identity.researchSubtype,qualifiedReportingScope=identity.reportingScope,formalSectorAdmission=False,rule=p1.ROUTE_RULES['BANK']),metrics=metrics,providerCrosschecks=crosschecks,rubrics=rubrics,categoryScores=None,totalScore=None,ranking=None,currentSignal=None,valuationPerShare=None,productionAdmissible=False,scoringAuthorized=False)
    validate_dossier(dossier);store.validate()
    return dict(dossier=dossier,sourceInventory=inventory,sourceProjection=records,dependencyGraph=graph.export(),gapRegister=[dict(rubric=r['rubric'],**r['deferred']) for r in rubrics],inputPins=dict(sorted(store.pins.items())))
