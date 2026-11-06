"""P2.3: four-owner-identity BANK contract composed over immutable ACB/P1 kernels.

No network, database, master, scorer or portfolio repository imports.
"""
import json
import re
from pathlib import Path
from copy import deepcopy
from decimal import Decimal
from collections import Counter
from lib import dfr05_acb_v2 as acb

p1,d2,ROOT=acb.p1,acb.d2,acb.ROOT
BASELINE='07b94a51c8fd31bf50745f24fe021d8ba1372551'
REL='docs/fundamental-data-engine/dfr-05/p2-3-b1-bank-07b94a51'
IDENTITIES=tuple(acb.Identity(s,t,'BANK','BANK','CONSOLIDATED') for t,s in [
 ('CTG','067f7626-9e44-4cb5-8602-3f88ec58a3c9'),('MBB','ff699c86-8eaf-4178-af14-0b38fd5b1255'),
 ('TCB','2a3c69b1-08aa-473c-bbd5-92d096a0d23a'),('VCB','32002fe9-b6cd-4760-91ba-8b7a59d4758e')])
ALLOWLIST=frozenset(IDENTITIES)
TICKERS=tuple(i.ticker for i in IDENTITIES)
NATIVE='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-comparability-r2'
BINDINGS='scripts/lib/dfr05_bank_bindings_v3.json'
EVIDENCE='docs/fundamental-data-engine/evidence'
EXTRA_CONCEPTS=('BANK_INTERBANK_ASSETS_REPORTED','BANK_INTERBANK_FUNDING_REPORTED','BANK_ISSUED_FUNDING_INSTRUMENTS','BANK_INTEREST_INCOME','BANK_INTEREST_EXPENSE','BANK_CREDIT_PROVISION_EXPENSE')


def authorize(identity):
    if not isinstance(identity,acb.Identity) or identity not in ALLOWLIST:raise ValueError('FOUR_BANK_STABLE_IDENTITY_NOT_AUTHORIZED')
    return identity


def verify_identity(store,identity):
    authorize(identity)
    u=store.read(acb.UNIVERSE)
    if p1.digest({k:v for k,v in u.items() if k!='contentHash'})!=acb.UHASH or u['contentHash']!=acb.UHASH or u['version']!='2026-11-05-v1' or u['researchReferenceDate']!='2026-11-05':raise ValueError('APPROVED_UNIVERSE_DATE_HASH')
    matches=[r for r in u['constituents'] if r['securityId']==identity.securityId]
    if len(matches)!=1 or matches[0]['ticker']!=identity.ticker or matches[0]['existingSector']!=identity.m3Sector:raise ValueError('APPROVED_STABLE_IDENTITY_BINDING')
    plan=store.read(acb.PLAN);routes=[r for r in plan['rows'] if r['securityId']==identity.securityId]
    if len(routes)!=1 or routes[0]['existingM3Sector']!='BANK' or routes[0]['proposedResearchSubtype']!='BANK' or routes[0]['routeQualificationStatus']!='READY':raise ValueError('APPROVED_BANK_ROUTE')
    return matches[0]


class RetainedAdapter:
    records=acb.RetainedAdapter.records
    def __init__(self,store,kind,identity):
        verify_identity(store,identity)
        if kind not in p1.PRIMARY:raise ValueError('ADAPTER_KIND')
        self.store,self.kind,self.ticker=store,kind,identity.ticker
        self.path=p1.PRIMARY[kind].format(ticker=identity.ticker)


class FinancialGraph(acb.FinancialGraph):
    # Reuse ACB framework guard and DFR02 arithmetic, not ACB identity or data.
    def __init__(self,identity):
        authorize(identity);self.identity=identity
        self.ticker,self.nodes,self.by_key=identity.ticker,{},{}

    def leaf_pdf_hashes(self,node):
        hashes=set()
        if node.get('pdfEvidence'):hashes.add(node['pdfEvidence']['sha256'])
        for dep in node.get('dependencyIds',[]):hashes.update(self.leaf_pdf_hashes(self.nodes[dep]))
        return hashes

    def derive(self,name,year,deps,op,definition,scope='CONSOLIDATED',across_years=False):
        # A source's ORIGINAL input flag never overrides a reviewed RESTATED
        # record. Explicit columns in ONE PDF can nevertheless form a coherent
        # comparative cohort. This new typed numeric view is calculation-only;
        # original source metadata/IDs/values remain unchanged in graph nodes.
        known={'ORIGINAL_REVIEWED_VINTAGE','RESTATED_REVIEWED_VINTAGE','COMPARATIVE_REVIEWED_VINTAGE','COHERENT_REVIEWED_DOCUMENT_VINTAGE'}
        nonoriginal=any(d.get('revisionBasis')!='ORIGINAL_REVIEWED_VINTAGE' for d in deps)
        hashes=set().union(*(self.leaf_pdf_hashes(d) for d in deps)) if deps else set()
        coherent=nonoriginal and bool(deps) and all(d['status']=='SUPPORTED' and d.get('revisionBasis') in known and self.leaf_pdf_hashes(d) for d in deps) and len(hashes)==1
        view=[{**d,'revisionBasis':'ORIGINAL_REVIEWED_VINTAGE'} for d in deps] if coherent else deps
        coherent=coherent and d2.compatible(view,across_years)
        node=acb.FinancialGraph.derive(self,name,year,view if coherent else deps,op,definition,scope,across_years)
        if coherent:
            node.update(revisionBasis='COHERENT_REVIEWED_DOCUMENT_VINTAGE',compatibilityEvidence=dict(rule='EXPLICIT_YEAR_SCOPE_UNIT_COLUMNS_IN_ONE_HASH_PINNED_REVIEWED_PDF',sourcePdfSha256=next(iter(hashes)),operandRevisionBases=[d['revisionBasis'] for d in deps],calculationOnlyProjection=True,originalSourceMetadataUnchanged=True))
        return node


class DependencyGraph(acb.DependencyGraph):
    def __init__(self,identity):
        authorize(identity);self.identity,self.nodes,self.edges=identity,{},set()
    def add(self,id,kind,ticker=None,status='REFERENCE_ONLY',**meta):
        authorize(self.identity)
        if ticker!=self.identity.ticker:raise ValueError('STABLE_ISSUER_GRAPH_SCOPE')
        node=dict(id=id,kind=kind,ticker=ticker,status=status,securityId=self.identity.securityId,**meta)
        if id in self.nodes and self.nodes[id]!=node:raise ValueError('DUPLICATE_GRAPH_ID')
        self.nodes[id]=node;return id


def review_path(t,kind):
    day='2026-10-15' if t=='VCB' else '2026-10-16'
    return f'{EVIDENCE}/{day}-ticker-closure-{t}/{t}_{kind}.json'


def note_binding(store,t,pdf_hash,page):
    path=p1.PRIMARY['NOTES'].format(ticker=t)
    docs=store.read(path)['documents']
    matches=[(di,pi) for di,doc in enumerate(docs) if doc['sourceHash']==pdf_hash for pi,p in enumerate(doc['pages']) if p['page']==page]
    if len(matches)!=1:return None
    di,pi=matches[0]
    return store.bind(path,f'/documents/{di}/pages/{pi}')


def source_by_hash(store,t,h):
    # Only this authorized issuer's retained source folder is searched.
    found=[]
    for p in sorted((ROOT/'data/manual-download'/t).rglob('*')):
        if p.is_file() and p.suffix.lower()=='.pdf' and p1.sha(p)==h:found.append(str(p.relative_to(ROOT)))
    if not found:raise ValueError('RETAINED_ISSUER_PDF_HASH_UNAVAILABLE:'+t+':'+h)
    path=found[0];store.pin(path)
    return path


def add_review_fact(g,store,concept,year,value,binding,pdf_path,pdf_hash,pages,revision='ORIGINAL_REVIEWED_VINTAGE',**meta):
    if not Path(pdf_path).is_relative_to(Path('data/manual-download')/g.ticker):raise ValueError('FOREIGN_ISSUER_PDF_BINDING')
    if store.pin(pdf_path)['sha256']!=pdf_hash:raise ValueError('REVIEW_PDF_HASH')
    native_value=None if value is None else d2.text(d2.number(value)/Decimal(1000000))
    node=dict(id=f'{g.ticker}:CONSOLIDATED:{concept}:{year}',concept=concept,year=year,scope='CONSOLIDATED',kind='REPORTED_FACT',value=value,status='MISSING' if value is None else 'SUPPORTED',valueState='MISSING' if value is None else 'ZERO' if d2.number(value)==0 else 'NUMERIC',currency='VND',unit='CURRENCY',scale='1',periodType='INSTANT',periodStart=f'{year}-12-31',periodEnd=f'{year}-12-31',revisionBasis=revision,dependencyIds=[],publicationAt=None,binding=binding,pdfEvidence=dict(path=pdf_path,sha256=pdf_hash,pages=pages),nativeSourceValue=native_value,nativeSourceUnit='MILLION_CURRENCY',nativeSourceMultiplier='1000000',nativeValueBasis='REEXPRESSED_VERIFIED_CANONICAL_WITH_REVIEW_DECLARED_MILLION_UNIT; printed lexical not invented',nativePrintedLexicalValue=None,**meta)
    if pages:node['noteBinding']=note_binding(store,g.ticker,pdf_hash,pages[0])
    return g.add(node)


def financials(store,identity):
    verify_identity(store,identity);t=identity.ticker
    reuse=p1.module('bank_v3_d2_reuse','scripts/build-dfr02.py')
    source=NATIVE+'/native-review-sources.json';refs=store.read(source)
    caps={v['id']:(i,v) for i,v in enumerate(refs['rawReferenceCaptures'])};contexts={v['observationId']:v for v in refs['contexts']}
    native_path=NATIVE+f'/native-inputs/{t}.json';native=store.read(native_path)
    if native['ticker']!=t or native['securityId']!=identity.securityId or native['sector']!='BANK' or any(o['securityId']!=identity.securityId or o['ticker']!=t for o in native['observations']):raise ValueError('NATIVE_IDENTITY')
    pdf_path=p1.PRIMARY['PDF'].format(ticker=t);index=reuse.pdf_index(store.read(pdf_path),pdf_path)
    g=FinancialGraph(identity);reuse.import_facts(store,g,source,caps,contexts,index)
    allowed=set(d2.COMMON+d2.BANK+('NET_INCOME_ATTRIBUTABLE_PARENT',))
    original_captures={o['itemId']+':'+str(o['fiscalYear']):json.loads(caps[o['rawCaptureId']][1]['payload']) for o in native['observations'] if o.get('fiscalYear') in range(2022,2026) and o['periodEnd']==f'{o["fiscalYear"]}-12-31'}
    conflicts=[]
    for m in list(g.nodes.values()):
        if m['concept'] not in allowed:
            del g.nodes[m['id']];del g.by_key[m['concept'],m['year'],m['scope']];continue
        if m['scope']!=identity.reportingScope:raise ValueError('QUALIFIED_FINANCIAL_SCOPE')
        payload=original_captures[m['concept']+':'+str(m['year'])];f=payload['originalCanonicalRecord']
        m.update(canonicalRevision=f.get('revisionStatus'),inputRevision=m.get('originalRevision'),valueState='ZERO' if d2.number(m['value'])==0 else 'NUMERIC',nativePrintedLexicalValue=None)
        if f.get('revisionStatus')=='RESTATED':
            m['revisionBasis']='RESTATED_REVIEWED_VINTAGE'
            m['reasons']+=['NATIVE_ORIGINAL_FLAG_DIFFERS_FROM_REVIEWED_CANONICAL_RESTATED; ORIGINAL_SOURCE_RECORD_UNCHANGED']
            conflicts.append(dict(kind='REVISION_METADATA_DISAGREEMENT',metricId=m['id'],materiality='MAJOR_COMPARABILITY',dependency='Explicit compatible original/restated cohort bridge; no latest-wins or relabelling as original.'))
        if m['concept']=='BANK_REPORTED_CAR':
            capital=f.get('bankCapitalEvidence') or {}
            verified=all(f.get(k) is True for k in ['qualified','valueVerified','definitionVerified','provenanceVerified']) and f.get('classification') in ('PDF_VERIFIED','ISSUER_VERIFIED')
            if capital.get('framework') is None or capital.get('method')!='REPORTED':verified=False
            old=m['id'];del g.nodes[old];del g.by_key[m['concept'],m['year'],m['scope']]
            m.update(id=f'{t}:REGULATORY_CONSOLIDATED:BANK_REPORTED_CAR:{m["year"]}',scope='REGULATORY_CONSOLIDATED',inputScope='CONSOLIDATED',retainedObservationMetricId=old,regulatoryFramework=capital.get('framework'),regulatoryScopeBoundary='Issuer regulatory consolidation, distinct from financial statement group consolidation; reported exclusions require separate qualification.',status='SUPPORTED' if verified and m['pdfEvidence']['pages'] else 'REFERENCE_ONLY',nativeSourceValue=d2.text(d2.number(m['value'])*100),nativeSourceUnit='PERCENT',nativeSourceMultiplier='0.01',definition='Explicitly reported regulatory CAR; never computed from book equity.')
            if t!='VCB':
                cp=review_path(t,'CAPITAL_QUALIFICATION');rows=store.read(cp)['periods'];ci=next(i for i,c in enumerate(rows) if c['end']==f'{m["year"]}-12-31');r=rows[ci]
                if r['CAR']!=m['value'] or r['source']['SHA256']!=m['pdfEvidence']['sha256'] or r['framework']!=m['regulatoryFramework']:raise ValueError('CAPITAL_REVIEW_BINDING')
                m['capitalReviewBinding']=store.bind(cp,f'/periods/{ci}')
            g.add(m);continue
        # Current retained native values already passed exact original-PDF/hash,
        # definition, fiscal scope and review flags in the reused input selector.
        # Preserve unknown lexical strings; never turn inverse normalization into
        # a claim to have transcribed the printed cell.
        m.update(nativeSourceValue=d2.text(d2.number(m['value'])/Decimal(1000000)),nativeSourceUnit='MILLION_CURRENCY',nativeSourceMultiplier='1000000',nativeValueBasis='REEXPRESSED_VERIFIED_CANONICAL; native million-unit checked in retained review/page context')
        if m['pdfEvidence']['pages']:m['noteBinding']=note_binding(store,t,m['pdfEvidence']['sha256'],m['pdfEvidence']['pages'][0])
        if m.get('noteBinding'):
            nb=m['noteBinding'];page=d2.pointer(store.read(nb['path']),nb['jsonPointer']);unit_text=d2.normalize(page['text'])
            if not ('trieu' in unit_text and ('vnd' in unit_text or 'dong' in unit_text)):raise ValueError('NATIVE_MILLION_UNIT_NOT_ESTABLISHED:'+m['id'])
            m['nativeUnitEvidenceBinding']=nb
        if t!='VCB':
            qp=review_path(t,'ACCOUNTING_QUALIFICATION');qual=store.read(qp)
            cells=[(ri,ci,c) for ri,r in enumerate(qual['periods']) if r['end']==f'{m["year"]}-12-31' and r['source']['SHA256']==m['pdfEvidence']['sha256'] for ci,c in enumerate(r['cells']) if c['metric']==m['concept']]
            if len(cells)==1:
                ri,ci,c=cells[0]
                if d2.number(c['valueMillion'])*Decimal(1000000)!=d2.number(m['value']):raise ValueError('PRIOR_QUALIFIED_NATIVE_UNIT_VALUE')
                m.update(nativeSourceValue=c['valueMillion'],nativeValueBasis='EXACT_RETAINED_CHECKED_TRANSCRIPTION',qualificationBinding=store.bind(qp,f'/periods/{ri}/cells/{ci}'))
    # Retained bank-specific customer-loan provision/NPL reconciliation, not
    # numerical matching to an unrelated loan or securities population.
    if t!='VCB':
        rp=review_path(t,'LLR_RECONCILIATION');rows=store.read(rp)['periods']
        for ri,r in enumerate(rows):
            y=int(r['end'][:4])
            if y not in range(2022,2026) or r['end']!=f'{y}-12-31':continue
            if r['scope']!='CONSOLIDATED' or r['status']!='AVAILABLE' or r['population']!='CUSTOMER_LOANS':raise ValueError('CUSTOMER_LOAN_RECONCILIATION_SCOPE')
            reserve=g.fact('BANK_LOAN_LOSS_RESERVES',y)
            if r['sourceHash']!=reserve['pdfEvidence']['sha256'] or d2.number(r['general'])+d2.number(r['specific'])!=d2.number(reserve['value']):raise ValueError('RESERVE_COMPONENT_OPERANDS')
            rev=reserve['revisionBasis'];fact_path=reserve['pdfEvidence']['path'];component_ids=[]
            for c,k in [('BANK_GENERAL_LOAN_RESERVE','general'),('BANK_SPECIFIC_LOAN_RESERVE','specific')]:
                node=add_review_fact(g,store,c,y,r[k],store.bind(rp,f'/periods/{ri}/{k}'),fact_path,r['sourceHash'],r['sourcePages'],rev,definition='Customer-loan allowance component; excludes interbank/securities/off-balance provisions',priorReviewReused=True)
                component_ids.append(node['id'])
            if d2.number(r['qualifiedAllowance'])+d2.number(r['separatelyExcluded'])!=d2.number(r['balanceSheetAllowance']):raise ValueError('TOTAL_CONTRA_POPULATION_RECONCILIATION')
            reserve.update(kind='DERIVED_METRIC',retainedRecordKind='REPORTED_FACT_AGGREGATE',formula='sum',dependencyIds=component_ids,definition='Qualified specific + general customer-loan allowance; other populations excluded',reconciliationBinding=store.bind(rp,f'/periods/{ri}'),componentReconciliation={k:r[k] for k in ('general','specific','qualifiedAllowance','balanceSheetAllowance','separatelyExcluded','excludedPopulation')})
            groups=[]
            for oi,o in enumerate(r['operands']):
                if o['concept'] not in ('GROUP_3','GROUP_4','GROUP_5'):continue
                if o['scope']!='CONSOLIDATED' or o['population']!='CUSTOMER_LOANS' or o['end']!=r['end']:raise ValueError('NPL_GROUP_SCOPE_OR_PERIOD')
                pages=[int(x) for x in re.findall(r'(?:PDF page |page:)(\d+)',o['locator'])]
                group_path=fact_path if o['sourceHash']==r['sourceHash'] else source_by_hash(store,t,o['sourceHash'])
                group_revision='RESTATED_REVIEWED_VINTAGE' if 'revised' in o['locator'].lower() else rev
                groups.append(add_review_fact(g,store,'BANK_CUSTOMER_LOAN_'+o['concept'],y,o['value'],store.bind(rp,f'/periods/{ri}/operands/{oi}'),group_path,o['sourceHash'],pages,group_revision,population='CUSTOMER_LOANS',sourceLocator=o['locator'],definition='Reported customer loans in '+o['concept']))
            npl=g.derive('BANK_CUSTOMER_LOAN_NPL',y,groups,'sum','Customer loan groups3+4+5 only; no securities/interbank NPL')
            npl.update(periodType='INSTANT',periodStart=f'{y}-12-31')
            if npl['value'] is not None and npl['value']!=r['NPL']:raise ValueError('NPL_SUM_REPLAY')
            g.derive('BANK_CUSTOMER_LOAN_NPL_RATIO',y,[npl,g.fact('BANK_GROSS_CUSTOMER_LOANS',y)],'ratio','Customer-loan NPL / same-scope gross customer loans')
            g.derive('BANK_CUSTOMER_LOAN_NPL_COVERAGE',y,[reserve,npl],'ratio','Qualified general+specific customer-loan allowance / customer-loan NPL; not reserve/gross-loan proxy')
    # New direct checks are bounded to issuer-specific reviewed PDF bindings.
    config=store.read(BINDINGS)['issuers'][t]
    if config['securityId']!=identity.securityId:raise ValueError('REVIEW_CONFIG_STABLE_IDENTITY')
    for ci,c in enumerate(config['directReadings']):
        if c['scope']!=identity.reportingScope or c['year'] not in range(2022,2026) or c['nativeUnit']!='MILLION_CURRENCY' or c['multiplier']!='1000000' or c['periodType'] not in ('ANNUAL','INSTANT'):raise ValueError('QUALIFIED_REVIEW_DIMENSIONS')
        y=c['year'];value=d2.text(d2.number(c['nativeValue'])*Decimal(1000000))
        existing=g.by_key.get((c['concept'],y,'CONSOLIDATED'))
        if existing:
            if g.nodes[existing]['value']!=value:raise ValueError('DIRECT_REVIEW_DIFFERS_FROM_RETAINED_VALUE')
            continue
        node=add_review_fact(g,store,c['concept'],y,value,store.bind(BINDINGS,f'/issuers/{t}/directReadings/{ci}'),c['pdfPath'],c['pdfHash'],[c['page']],c['revision'],sourceCaption=c['caption'],directImageReview=True,independentHumanReviewClaimed=False)
        node.update(nativeSourceValue=c['nativeValue'],nativeValueBasis='DIRECT_ORIGINAL_PDF_PAGE_REVIEW',nativeUnitLabel=c.get('nativeUnitLabel'),nativePrintedLexicalValue=c.get('printedLexicalValue'),periodType=c['periodType'],periodStart=f'{y}-01-01' if c['periodType']=='ANNUAL' else f'{y}-12-31')
        if c.get('jsonPointer'):
            binding=store.bind(pdf_path,c['jsonPointer']);row=d2.pointer(store.read(pdf_path),c['jsonPointer'])
            if row.get('value')!=c['nativeValue']:raise ValueError('REVIEWED_EXTRACTION_CELL_VALUE')
            node['selectedExtractionBinding']=binding
    for ci,alternative in enumerate(config.get('sourceAlternatives',[])):
        if not Path(alternative['pdfPath']).is_relative_to(Path('data/manual-download')/t) or store.pin(alternative['pdfPath'])['sha256']!=alternative['pdfHash']:raise ValueError('REVISION_ALTERNATIVE_SOURCE_IDENTITY')
        conflicts.append(dict(kind='DISTINCT_REPORTED_REVISION_VARIANT',metricId=f'{t}:CONSOLIDATED:{alternative["concept"]}:{alternative["year"]}',disposition='PRESERVED_UNSELECTED_ORIGINAL_VINTAGE; selected restated document cohort explicitly qualified, not latest-wins',alternative=alternative,binding=store.bind(BINDINGS,f'/issuers/{t}/sourceAlternatives/{ci}'),resolution='Do not equate original/restated variants or use the original as a comparable growth operand without a bridge.'))
    if t=='VCB':
        components=[g.fact(k,2025) for k in ('BANK_GENERAL_LOAN_RESERVE','BANK_SPECIFIC_LOAN_RESERVE')]
        total=g.derive('BANK_CUSTOMER_LOAN_RESERVE_COMPONENT_SUM',2025,components,'sum','Explicitly reported general + specific customer-loan allowance')
        total.update(periodType='INSTANT',periodStart='2025-12-31')
        if total['value']!=g.fact('BANK_LOAN_LOSS_RESERVES',2025)['value']:raise ValueError('VCB_DIRECT_RESERVE_RECONCILIATION')
        npl=g.derive('BANK_CUSTOMER_LOAN_NPL',2025,[g.fact('BANK_CUSTOMER_LOAN_GROUP_'+k,2025) for k in ('3','4','5')],'sum','Customer-loan groups3+4+5 only')
        npl.update(periodType='INSTANT',periodStart='2025-12-31')
        g.derive('BANK_CUSTOMER_LOAN_NPL_RATIO',2025,[npl,g.fact('BANK_GROSS_CUSTOMER_LOANS',2025)],'ratio','Customer-loan NPL / same-scope gross customer loans')
        g.derive('BANK_CUSTOMER_LOAN_NPL_COVERAGE',2025,[total,npl],'ratio','General+specific customer-loan reserves / customer-loan NPL; not reserve/gross proxy')
    nii=g.derive('BANK_NII_COMPONENT_RECONCILIATION',2025,[g.fact('BANK_INTEREST_INCOME',2025),g.fact('BANK_INTEREST_EXPENSE',2025)],'sum','Reported interest income + signed interest expense')
    if nii['value']!=g.fact('BANK_NET_INTEREST_INCOME',2025)['value']:raise ValueError('NII_SIGNED_COMPONENT_REPLAY')
    acb.bank_recipe(g)
    for y in range(2022,2026):
        parent=g.fact('NET_INCOME_ATTRIBUTABLE_PARENT',y)
        if parent['value'] is None:parent.update(periodType='ANNUAL',periodStart=f'{y}-01-01',valueState='MISSING',reasons=['PARENT_NPAT_NOT_YET_INDEPENDENTLY_QUALIFIED; DO_NOT_SUBSTITUTE_GROUP_NPAT'])
        for concept in EXTRA_CONCEPTS+('BANK_GENERAL_LOAN_RESERVE','BANK_SPECIFIC_LOAN_RESERVE'):
            node=g.fact(concept,y)
            if node['status']=='MISSING':
                node.update(valueState='MISSING',reasons=['RETAINED_SOURCE_TOPIC_MAPPING_OR_PAGE_REVIEW_REQUIRED; NOT_PROVEN_ABSENT'])
                if concept in ('BANK_INTEREST_INCOME','BANK_INTEREST_EXPENSE','BANK_CREDIT_PROVISION_EXPENSE'):node.update(periodType='ANNUAL',periodStart=f'{y}-01-01')
        g.add(dict(id=f'{t}:REGULATORY_CONSOLIDATED:BANK_REPORTED_CET1:{y}',concept='BANK_REPORTED_CET1',year=y,scope='REGULATORY_CONSOLIDATED',kind='REPORTED_FACT',value=None,valueState='MISSING',status='MISSING',unit='RATIO',currency=None,scale='1',periodType='INSTANT',periodStart=f'{y}-12-31',periodEnd=f'{y}-12-31',revisionBasis='ORIGINAL_REVIEWED_VINTAGE',dependencyIds=[],reasons=['NO_EXPLICIT_FY2022_25_CET1_QUALIFIED; TIER1_OR_BOOK_EQUITY_NOT_A_SUBSTITUTE']))
    for m in g.nodes.values():
        if m['concept']=='RESERVES_GROSS_LOANS':m['definition']='Qualified customer-loan reserves / gross customer loans; NOT NPL coverage'
        if m['status']=='CONFLICT':conflicts.append(dict(kind='DERIVED_COMPATIBILITY_DEFERRAL',metricId=m['id'],materiality='MAJOR_COMPARABILITY',reasons=m['reasons'],dependency='Reconcile same-scope/source revision cohorts before arithmetic; no changed historical source or zero substitute.'))
    return list(g.nodes.values()),reuse.api_crosschecks(store,t),conflicts


def rubric_rows(store,identity,metrics,config):
    store.pin('src/domain/scoring/methodology.ts')
    specs=p1.module('bank_v3_m3','scripts/build-dfr02.py').rubrics();rows=[]
    neutral={
      'BQ-MOAT':'Qualify issuer-specific customer advantage, pricing behavior and persistence.',
      'BQ-RES':'Qualify borrower/deposit concentration, pricing response and stress behavior.',
      'FH-LIQ':'Reconcile contractual maturity gaps, unrestricted liquidity, contingent obligations and covenants.',
      'IC-POS':'Qualify share, funding-cost position and distribution economics; bank size is not market share.',
      'IC-CYCLE':'Qualify dated banking cycle, forward credit/funding asymmetry and survivability.',
      'RG-GOV':'Qualify related-party terms, disclosure, minority protection and auditor findings.',
      'CA-REINV':'Qualify issuer investment/acquisition/divestment decisions and subsequent economic outcomes.'}
    for s in specs:
        rid=s['id'];cls,text=acb.GAPS[rid]
        text=neutral.get(rid,text)
        if 'ACB' in text:raise ValueError('ISSUER_SPECIFIC_TEMPLATE_NOT_GENERALIZED')
        deps=[m['id'] for m in metrics if m['concept'] in {k for topic in s['topics'] for k in acb.TOPIC_METRICS.get(topic,())}]
        rows.append(dict(id=f'{identity.ticker}:{rid}',ticker=identity.ticker,rubric=rid,category=s['category'],requiredTopics=s['topics'],status='NOT_RATED',eligibility=cls,readiness='DEFERRED',points=None,band=None,assessment=None,productionScoringReady=False,metricContextIds=deps,deferred=dict(classification=cls,exactDependency=text,issuerSpecificContext=config['researchContext'],resolutionPath='Qualify the named retained topic evidence/revision bridge and obtain separate owner assessment authorization. No new source acquisition or scoring in B1-BANK.',owner='Bank research analyst; owner for assumptions/source authority',stopCondition='No full-topic qualification or new scoring authorization.')))
    return rows


def validate_dossier(d):
    authorize(acb.Identity(d['securityId'],d['ticker'],d['sectorRouting']['approvedM3Sector'],d['sectorRouting']['researchSubtype'],d['sectorRouting']['qualifiedReportingScope']))
    if d['classification']!='RESEARCH_PROVISIONAL' or d['productionAdmissible'] is not False or d['scoringAuthorized'] is not False:raise ValueError('RESEARCH_ONLY')
    if any(d[k] is not None for k in ('categoryScores','totalScore','ranking','currentSignal','valuationPerShare')):raise ValueError('NO_NEW_SCORE_VALUATION_OR_SIGNAL')
    specs=p1.module('bank_v3_validate_m3','scripts/build-dfr02.py').rubrics()
    if len(d['rubrics'])!=23 or [r['rubric'] for r in d['rubrics']]!=[s['id'] for s in specs]:raise ValueError('EXACT_23_RUBRICS')
    for r,s in zip(d['rubrics'],specs):
        if r['requiredTopics']!=s['topics'] or r['category']!=s['category'] or r['status']!='NOT_RATED' or any(r[k] is not None for k in ('points','band','assessment')) or r['productionScoringReady'] is not False:raise ValueError('UNCHANGED_TOPICS_AND_NULL_SCORE_CONTRACT')
    for m in d['metrics']:
        if not m['id'].startswith(d['ticker']+':') or m['status'] not in d2.STATUSES:raise ValueError('METRIC_ISSUER_OR_STATUS')
        if m['value'] is not None:d2.number(m['value'])
        if m['status'] in ('MISSING','CONFLICT') and m['value'] is not None:raise ValueError('UNQUALIFIED_METRIC_HAS_NUMERIC_VALUE')
    return True


def replay(store,identity):
    verify_identity(store,identity);t=identity.ticker
    metrics,crosschecks,conflicts=financials(store,identity)
    config=store.read(BINDINGS)['issuers'][t]
    required={(b['path'],b['jsonPointer']) for m in metrics for k in ('selectedExtractionBinding','noteBinding') if (b:=m.get(k))}
    required.update((r['binding']['path'],r['binding']['jsonPointer']) for r in crosschecks)
    records=[];inventory=[]
    for kind in p1.PRIMARY:
        adapter=RetainedAdapter(store,kind,identity);cells=list(adapter.records());selected=[];seen=set()
        for c in cells:
            dims=p1.canonical([c.get(k) for k in ('report','period','scope','unit','valueState','requestMode')])
            if (c['binding']['path'],c['binding']['jsonPointer']) in required or (kind!='NOTES' and dims not in seen):selected.append(c)
            seen.add(dims)
        inventory.append(dict(kind=kind,binding=store.bind(adapter.path),rowsOrPages=len(cells),materializedRowsOrPages=len(selected),qualifiedByPresence=False,states=dict(Counter(c['valueState'] for c in cells)),dimensions=dict(Counter(p1.canonical([c.get('period'),c.get('scope'),c.get('unit')]) for c in cells))))
        records.extend(selected)
    graph=DependencyGraph(identity)
    def add(id,kind,status='REFERENCE_ONLY',**meta):return graph.add(id,kind,t,status,**meta)
    def source(binding):
        sid=f'SOURCE:{t}:'+binding['path']+'#'+binding['jsonPointer'];add(sid,'SOURCE_BINDING',binding=binding);return sid
    for c in records:
        add(c['id'],c['kind'],c['status'],binding=c['binding']);graph.edge(source(c['binding']),c['id'],'UNREVIEWED_PRESENTATION_REFERENCE',False)
        if c.get('rawBinding') and c['rawBinding'].get('path'):graph.edge(source(c['rawBinding']),c['id'],'PROVIDER_RAW_LINEAGE',False)
    for m in metrics:add('METRIC:'+m['id'],'METRIC',m['status'],concept=m['concept'])
    for m in metrics:
        target='METRIC:'+m['id']
        for k in ('observationBinding','reviewPayloadBinding','qualificationBinding','capitalReviewBinding','reconciliationBinding','binding','selectedExtractionBinding','noteBinding'):
            if m.get(k):graph.edge(source(store.bind(m[k]['path'],m[k]['jsonPointer'])),target,'QUALIFIED_OPERAND')
        if m.get('pdfEvidence'):graph.edge(source(store.bind(m['pdfEvidence']['path'])),target,'ORIGINAL_PDF_HASH')
        for dep in m['dependencyIds']:graph.edge('METRIC:'+dep,target,'CALCULATION')
    rubrics=rubric_rows(store,identity,metrics,config)
    for r in rubrics:
        rid=add('RUBRIC:'+r['id'],'RUBRIC','NOT_RATED',points=None)
        for topic in r['requiredTopics']:
            tid=add('TOPIC:'+r['id']+':'+topic,'TOPIC','NOT_RATED',fullTopicQualified=False);graph.edge(tid,rid,'REQUIRED_TOPIC')
            for m in metrics:
                if m['concept'] in acb.TOPIC_METRICS.get(topic,()):graph.edge('METRIC:'+m['id'],tid,'PARTIAL_FINANCIAL_CONTEXT')
    dossier=dict(contract='dfr05-p2-3-bank-research-v3',classification='RESEARCH_PROVISIONAL',ticker=t,securityId=identity.securityId,reviewDate='2026-11-06',researchReferenceDate='2026-11-05',universeVersion='2026-11-05-v1',approvedUniverseContentHash=acb.UHASH,financialPeriod='FY2022-FY2025',sectorRouting=dict(approvedM3Sector='BANK',researchSubtype='BANK',qualifiedReportingScope='CONSOLIDATED',formalSectorAdmission=False,rule=p1.ROUTE_RULES['BANK']),metrics=metrics,providerCrosschecks=crosschecks,rubrics=rubrics,categoryScores=None,totalScore=None,ranking=None,currentSignal=None,valuationPerShare=None,productionAdmissible=False,scoringAuthorized=False)
    validate_dossier(dossier);store.validate()
    gaps=[dict(rubric=r['rubric'],**r['deferred']) for r in rubrics]
    gaps += [dict(metricId=m['id'],classification=m['status'],exactDependency=m.get('reasons'),resolutionPath='Qualify exact native topic/page or compatible revision cohort using retained sources; unknown is not zero.') for m in metrics if m['status']!='SUPPORTED']
    return dict(dossier=dossier,sourceInventory=inventory,sourceProjection=records,dependencyGraph=graph.export(),gapRegister=gaps,conflictRegister=conflicts,inputPins=dict(sorted(store.pins.items())))
