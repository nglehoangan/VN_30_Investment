"""Read-only financial coverage assessment. Writes only this package; no admission or fetching."""
from pathlib import Path
import collections as C
import hashlib, json, re, sqlite3

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
BASELINE = '285857e2500bf131e876142de255028858f8efbd'
AUDIT = 'docs/fundamental-data-engine/scoring-usability-audit/v1-ad81bdce/'
AUTH = 'docs/fundamental-data-engine/standing-authority-version/2026-11-12/'
PINS = {}

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda: f.read(1024*1024), b''): h.update(b)
    return h.hexdigest()

def load(path):
    PINS[path] = sha(ROOT/path)
    return json.loads((ROOT/path).read_text())

def pin(path):
    if path not in PINS: PINS[path] = sha(ROOT/path)
    return {'path': path, 'sha256': PINS[path]}

def write(name, value):
    (OUT/name).write_text(json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2)+'\n')

def md(name, value): (OUT/name).write_text(value.strip()+'\n')
def table(headers, rows):
    return '| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(str(v).replace('|','/') for v in row)+' |' for row in rows)
def count(rows, field='classification'): return dict(sorted(C.Counter(r[field] for r in rows).items()))
def ptr(v): return str(v).replace('~','~0').replace('/','~1')

policies = [
 'docs/01 SYSTEM/SCORING_MODEL_v1.0.md', 'docs/03 SCORING/METRIC_DEFINITIONS.md',
 'docs/03 SCORING/SECTOR_NORMALIZATION.md', 'docs/02 DATABASE/DATA_RULES.md',
 'docs/08_CONTINUOUS_IMPROVEMENT/MANUAL_FUNDAMENTALS_ARCHITECTURE.md',
 'src/domain/fundamentals/contracts.ts','src/domain/fundamentals/normalization.ts',
 'src/domain/fundamentals/hybrid-admission.ts','src/domain/fundamentals/hybrid-sufficiency.ts',
 'src/domain/fundamentals/sector-requirements.ts','src/domain/fundamentals/debt-contract.ts',
 'src/domain/fundamentals/current-qualification.ts','src/domain/fundamentals/runtime-provenance.ts',
 'src/domain/fundamentals/scoring-bridge.ts','src/infrastructure/fundamentals/runtime-evidence.ts',
 'src/infrastructure/source-admission/versioned-authority.ts','src/infrastructure/source-admission/financial.ts',
 'src/infrastructure/repositories/unified-admission.ts','app/server/unified-admission-services.ts',
 'src/domain/scoring/scorecard.ts','src/domain/scoring/evidence.ts','src/domain/scoring/metrics.ts',
 'src/domain/scoring/methodology.ts', 'skills/read-pdf-json-first/SKILL.md',
 'docs/fundamental-data-engine/evidence/2026-10-24-m8-financial-current-layout-adapter/FINANCIAL_ADAPTER_CONTRACT.md']
for p in policies: pin(p)
requirements = load('src/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json')
debt = load('src/domain/fundamentals/debt-contract-v2.json')
head = load('docs/fundamental-data-engine/evidence/2026-10-29-approved-authority-activation/HEAD_SCORING_MODEL.json')
registry = load(AUTH+'VERSIONED_SOURCE_REGISTRY.json')
catalog = load(AUTH+'TRUSTED_SOURCE_INPUTS.json')
coverage = load(AUDIT+'FINANCIAL_COVERAGE.json')
ledger = load(AUDIT+'FINANCIAL_EVIDENCE_LEDGER.json')
master = load(AUDIT+'CONFIGURED_MASTER_RECEIPT.json')
normalization = load(AUDIT+'NORMALIZATION_LIMITATIONS.json')
rubric_inventory = load(AUDIT+'VN30_ISSUER_RUBRIC_MATRIX.json')
sectors = {r['ticker']:r['sector'] for r in master['referenceData']['content']['sectors']}
assert len(sectors) == 30
manifest = load('data/manual-download/manifest.json')
api_receipts = load('data/manual-extracted-api/requests.json')
# Reuse recorded exact hashes and retained paths. Do not rehydrate/re-read the PDF corpus for an assessment. Actual ingestion must verify bytes. Failed receipts remain visible.
raw_by_hash = C.defaultdict(list)
receipt_summary = []
for r in manifest['requests']:
    p, h = r.get('path'), r.get('sha256')
    valid = bool(p and h and (ROOT/p).is_file() and (ROOT/p).stat().st_size > 0)
    receipt_summary.append({'ticker':r['ticker'],'path':p,'sha256':h,'retainedHashBound':valid,'byteVerification':'NOT_REHASHED; reuse original receipt and existing qualification, not recertification','status':r.get('status'),'retrievedAt':r.get('retrievedAt'),'url':r.get('url')})
    if valid:
        raw_by_hash[h].append({'path':p,'sha256':h,'ticker':r['ticker'],'receipt':'data/manual-download/manifest.json','retrievedAt':r.get('retrievedAt'),'url':r.get('url')})
for r in api_receipts:
    p,h = r.get('rawPayloadLocation'),r.get('payloadHash')
    if p and h and (ROOT/p).is_file():
        raw_by_hash[h].append({'path':p,'sha256':h,'ticker':r.get('symbol'),'receipt':'data/manual-extracted-api/requests.json','retrievedAt':r.get('retrievedAt'),'url':r.get('url')})

# Later retained acquisition receipts are additive evidence, not replacements for the original manifest.
supplemental_receipts=[]
receipt_paths=[
 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/annual-download-r1/download-manifest.json',
 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/document-retry-r1/download-manifest.json',
 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/vn30-underwriting-v2/acquisition-manifest.json',
 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-03/normalization-acceptance-v1/acquisition-manifest.json',
 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-03/vic-rnav-v1/acquisition-manifest.json',
 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-03/vic-official-closure-v1/acquisition-manifest.json']
def receipt_walk(obj,path,pointer='',context=None):
    if isinstance(obj,list):
        for i,v in enumerate(obj):receipt_walk(v,path,pointer+'/'+str(i),context)
    elif isinstance(obj,dict):
        ctx={**(context or {}),**{k:v for k,v in obj.items() if k in ['ticker','retrievedAt','sourceUrl','url','purpose','sourceRole']}}
        native=obj.get('pdfPath') or obj.get('path');h=obj.get('sha256') or obj.get('pdfSha256')
        if native and h and ctx.get('ticker') in sectors:
            present=(ROOT/native).is_file()
            item={'ticker':ctx['ticker'],'path':native,'sha256':h,'retainedHashBound':present,'byteVerification':'ORIGINAL_RECEIPT_HASH_REUSED_NOT_REHASHED','status':obj.get('status'),'retrievedAt':ctx.get('retrievedAt'),'url':ctx.get('sourceUrl') or ctx.get('url'),'purpose':ctx.get('purpose'),'receipt':path,'jsonPointer':pointer,'sourceRole':ctx.get('sourceRole')}
            supplemental_receipts.append(item);receipt_summary.append(item)
            if present:raw_by_hash[h].append({k:v for k,v in item.items() if k in ['ticker','path','sha256','retrievedAt','url','receipt','jsonPointer']})
        for k,v in obj.items():
            if isinstance(v,(list,dict)):receipt_walk(v,path,pointer+'/'+ptr(k),ctx)
for p in receipt_paths:
    receipt_walk(load(p),p)
# Retain checked economic readings as additional review evidence, not new canonical facts.
checked_reading_bindings=[]
for p in ['docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/earnings-normalization-v3/checked-readings.json','docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/held-normalization-v1/checked-inputs.json','docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-04/investment-research-v2/checked-capital-readings.json']:
    d=load(p);checked_reading_bindings.append({'path':p,'sha256':PINS[p],'contract':d.get('contract'),'interpretation':'Existing checked native/economic evidence; preserve definitions and prior acceptance restrictions.'})
# SQLite is evidence only. No connection capable of writes, no hydration/migrations/runtime calls.
db_hash = sha(ROOT/'data/vn30.sqlite')
conn = sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro&immutable=1',uri=True)
db_counts = {t:conn.execute('select count(*) from '+t).fetchone()[0] for t in ['fundamental_admission_run','fundamental_observation','fundamental_snapshot_run']}
runs = {}
for run_id, body_hash, body in conn.execute('select id,body_hash,body from fundamental_admission_run order by id'):
    d=json.loads(body)
    ticker=run_id.rsplit('-',1)[-1]
    assert ticker in sectors and ticker not in runs
    runs[ticker]={'id':run_id,'bodyHash':body_hash,'body':d}
conn.close()

# Exact concept evidence, with historical declared qualification kept distinct from this assessment.
evidence = C.defaultdict(list)
for ident,r in ledger.items():
    b=r.get('binding') or {}
    if b.get('path') and (ROOT/b['path']).exists(): pin(b['path'])
    evidence[(r['ticker'],r['concept'],r.get('periodEnd'))].append({'kind':'RETAINED_REVIEW_OR_DOSSIER','ledgerId':ident,'binding':b,'value':r.get('value'),'scope':r.get('scope'),'periodStart':r.get('periodStart'),'periodType':r.get('periodType'),'unit':r.get('unit'),'currency':r.get('currency'),'declaredStatus':r.get('evidenceStatus'),'accountingQualified':False})
for ticker,run in runs.items():
    for i,f in enumerate(run['body']['canonicalFacts']):
        h=f.get('sourceHash'); aliases=[r for r in raw_by_hash.get(h,[]) if r['ticker']==ticker]
        evidence[(ticker,f['itemId'],f['period']['end'])].append({
          'kind':'EXISTING_CANONICAL','binding':{'path':'data/vn30.sqlite','sha256':db_hash,'table':'fundamental_admission_run','id':run['id'],'bodyHash':run['bodyHash'],'jsonPointer':'/canonicalFacts/'+str(i)},
          'factId':f['id'],'value':f.get('value'),'scope':f.get('scope'),'periodStart':f['period']['start'],'periodType':f.get('reportPeriodType'),
          'unit':f.get('unit'),'currency':f.get('currency'),'sourceHash':h,'retainedSourceAliases':aliases,
          'declaredQualified':f.get('qualified',False),'quality':f.get('quality'),'classification':f.get('classification'), 'retainedVerificationFlags':{k:f.get(k) for k in ['definitionVerified','valueVerified','provenanceVerified']},
          'accountingQualified': bool(f.get('qualified') is True and f.get('quality')=='VALID' and f.get('definitionVerified') and f.get('valueVerified') and f.get('provenanceVerified') and aliases and f.get('scope')=='CONSOLIDATED'),
          'publicationTime':f.get('publishedAt'),'reviewTime':f.get('reviewedAt'),'historicalPitEligible':f.get('historicalPitEligible'),
          'note':'Existing accounting qualification only; not new v4 admission or normalized economic eligibility.'})

# Reuse the retained parsed corpus inventory; do not repeat whole-corpus extraction or rehydrate PDFs.
surfaces=[]
period_documents=C.defaultdict(list)
for t in sorted(sectors):
    c=next(r for r in coverage if r['ticker']==t)
    for surface in c['rawSurfaces']:
        p=surface['binding']['path']
        surfaces.append({'ticker':t,**surface,'retainedPathExists':(ROOT/p).is_file(),'hashValidation':'PRIOR_RECORDED_PIN_NOT_REHASHED_IN_THIS_ASSESSMENT','authority':'PRESENTATION_ONLY; combined view is not independent evidence'})
    for end in sorted({d for dates in c['historicalPeriodsByConcept'].values() for d in dates}):
        period_documents[(t,end)].append({'coverageBinding':{'path':AUDIT+'FINANCIAL_COVERAGE.json','jsonPointer':'/'+str(coverage.index(c))+'/historicalPeriodsByConcept'},'identityVerified':False,'interpretation':'Existing concept/end-date inventory, not a newly verified report or numeric cell'})
    np=f'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-comparability-r2/native-inputs/{t}.json'
    pin(np)

# 60-day operational requirement at assessment date: H1 2026. Not statutory filing advice.
periods=[{'id':f'FY{y}','end':f'{y}-12-31','flowStart':f'{y}-01-01','flowType':'ANNUAL','track':'LONG_TERM_BASELINE'} for y in range(2022,2026)]
periods += [{'id':'H1_2026','end':'2026-06-30','flowStart':'2026-01-01','flowType':'YTD','track':'CURRENT_TRAJECTORY'}]
periods += [{'id':'Q3_YTD_2026','end':'2026-09-30','flowStart':'2026-01-01','flowType':'YTD','track':'KNOWN_NEWER_DISCLOSURE_REVIEW','interpretation':'Retained Q3 report leads exist; verify nine-month flow columns separately from quarter-only columns; newer known disclosure cannot be ignored.'}]
flows={'NET_INCOME','REVENUE','CFO','NET_INCOME_ATTRIBUTABLE_COMMON','NET_INCOME_ATTRIBUTABLE_PARENT','BASIC_EPS','OPERATING_PROFIT','GROSS_PROFIT','CASH_CAPEX_REPORTED','BANK_NET_INTEREST_INCOME','INSURANCE_UNDERWRITING_RESULT','SEGMENT_OPERATING_PROFIT'}
ratios={'BANK_REPORTED_CAR','BANK_REPORTED_CET1','BANK_REPORTED_NIM','BANK_REPORTED_NPL','BANK_REPORTED_CREDIT_GROWTH','CASA','ROIC','ROA','MARGIN_STABILITY','INSURANCE_SOLVENCY_RATIO'}
all_concepts=sorted(set(x for s in requirements['sectors'].values() for level,groups in s.items() if level in ['CORE','SECTOR_CORE','SUPPORTING','OPTIONAL'] for x in ([v for g in groups for v in g['anyOf']] if level in ['CORE','SECTOR_CORE'] else groups)))
raw_rows=[];groups=[]
for t,sector in sorted(sectors.items()):
    spec=requirements['sectors'][sector]; active={}
    for level in ['CORE','SECTOR_CORE']:
        for g in spec[level]:
            for concept in g['anyOf']: active.setdefault(concept,[]).append({'level':level,'group':g['id'],'anyOf':g['anyOf']})
    for level in ['SUPPORTING','OPTIONAL']:
        for concept in spec[level]:active.setdefault(concept,[]).append({'level':level})
    for concept in all_concepts:
        if concept not in active:
            raw_rows.append({'id':f'{t}:{concept}:N/A','ticker':t,'sector':sector,'metric':concept,'classification':'NOT_APPLICABLE','mandatory':False,'reason':'NOT_REQUESTED_BY_THIS_SECTOR_REQUIREMENT_CONTRACT; not a claim that the financial quantity cannot exist.'})
            continue
        for period in periods:
            refs=evidence.get((t,concept,period['end']),[])
            dimensioned=[]
            for r in refs:
                # A quarter is never substituted for YTD; unknown starts/scopes stay review candidates.
                good=(r.get('scope')=='CONSOLIDATED' and r.get('value') is not None and r.get('unit') not in [None,'UNKNOWN'])
                if concept in flows: good=good and r.get('periodStart')==period['flowStart'] and r.get('periodType') in [period['flowType'],'DURATION']
                elif concept not in ratios: good=good and r.get('periodStart')==period['end']
                if good: dimensioned.append(r)
            qualified=[r for r in dimensioned if r.get('accountingQualified')]
            values={(r['value'],r.get('unit'),r.get('currency')) for r in qualified}
            conflict=len(values)>1
            mapping=concept in ['REPORTED_BORROWINGS','COMPREHENSIVE_FINANCIAL_DEBT'] and bool(evidence.get((t,'FINANCIAL_DEBT',period['end'])))
            docs=period_documents.get((t,period['end']),[])
            if conflict: status='AVAILABLE_NEEDS_VERIFICATION';reason='CONFLICTING_QUALIFIED_VALUES_NO_LATEST_WINS'
            elif qualified: status='AVAILABLE_AND_QUALIFIED';reason='EXISTING_ACCOUNTING_QUALIFICATION_WITH_RECEIPT_BOUND_RETAINED_SOURCE_HASH; not standing admission'
            elif refs: status='AVAILABLE_NEEDS_VERIFICATION';reason='EXACT_CONCEPT_CANDIDATE_REQUIRES_DIMENSION_OR_SOURCE_OR_DEFINITION_VERIFICATION'
            elif mapping:status='AVAILABLE_NEEDS_MAPPING';reason='LEGACY_FINANCIAL_DEBT_PRESENT_NOT_EQUIVALENT_TO_DEBT_V2_WITHOUT_COMPONENT_AND_POPULATION_BRIDGE'
            elif docs:status='AVAILABLE_NEEDS_VERIFICATION';reason='RETAINED_PERIOD_SURFACE; VALUE_UNCONFIRMED_TARGETED_REVIEW_REQUIRED'
            else:status='AVAILABLE_NEEDS_VERIFICATION';reason='RETAINED_TICKER_REPORTS_EXIST_BUT_EXACT_PERIOD_AND_VALUE_NOT_ESTABLISHED; no exhaustive absence proof'
            v4='WITHIN_METRIC_SCOPE_NEEDS_EXACT_NATIVE_PLAN_VALIDATION' if concept=='TOTAL_ASSETS' and t=='VNM' else 'METRIC_OUTSIDE_VALIDATED_V4_ADAPTER_SCOPE' if concept!='TOTAL_ASSETS' else 'TRUSTED_TICKER_EXTRACTION_AND_SEMANTIC_CATALOG_BINDING_NOT_CONFIGURED'
            receipt_refs=[{'path':rr.get('receipt','data/manual-download/manifest.json'),'jsonPointer':rr.get('jsonPointer'),'rawPath':rr['path'],'sha256':rr['sha256'],'identityStatus':'RETAINED_Q3_REPORT_LEAD_NOT_YTD_CELL_CERTIFICATION'} for rr in receipt_summary if rr['ticker']==t and period['id']=='Q3_YTD_2026' and re.search(r'Q3_2026',rr.get('path') or '',re.I)]
            row={'id':f'{t}:{concept}:{period["id"]}','ticker':t,'sector':sector,'metric':concept,'period':period,'requirements':active[concept],
              'mandatory':any(x['level'] in ['CORE','SECTOR_CORE'] for x in active[concept]),'classification':status,'reason':reason,
              'valueAvailability':'EXACT_CONCEPT_VALUE_RETAINED' if refs else 'LEGACY_OPERANDS_RETAINED' if mapping else 'UNCONFIRMED',
              'sourceReceiptRefs':receipt_refs,'evidenceRefs':[r.get('ledgerId') or r.get('factId') for r in refs],
              'qualifiedFactRefs':[r['factId'] for r in qualified], 'periodSurfaceCount':len(docs),'retainedNewerReportLeads':len(receipt_refs),
              'canonicalValidation':'EXISTING_ACCOUNTING_QUALIFIED' if qualified and not conflict else 'REQUIRES_VERIFICATION_OR_MAPPING',
              'governedAdmission':v4,'consumerReadiness':'NOT_DEMONSTRATED_CURRENT_PURPOSE_BRIDGE_REQUIRED',
              'historicalPIT':'NOT_ESTABLISHED_BY_THIS_ASSESSMENT','conflictingQualifiedValues':conflict}
            gaps=['MISSING_CURRENT_PURPOSE_CONSUMER_INTEGRATION']
            if concept!='TOTAL_ASSETS':gaps.append('UNSUPPORTED_V4_SOURCE_NATIVE_METRIC_ADAPTER')
            if t!='VNM':gaps.append('TRUSTED_TICKER_EXTRACTION_AND_SEMANTIC_BINDING_GAP')
            if not qualified:
                if mapping:gaps.append('LEGACY_DEBT_V2_MAPPING_OR_DERIVATION_REQUIRED')
                if refs:gaps.append('CANONICAL_OR_DIMENSION_VERIFICATION_REQUIRED')
                else:gaps.append('EXACT_VALUE_OR_PERIOD_NOT_VERIFIED_IN_RETAINED_REPORTS')
                if any(r.get('sourceHash') and not r.get('retainedSourceAliases') for r in refs):gaps.append('RECORDED_CANONICAL_SOURCE_HASH_ALIAS_UNRESOLVED')
            if conflict:gaps.append('CONFLICTING_FINANCIAL_FACTS')
            if not dimensioned:gaps.append('EXACT_PERIOD_SCOPE_UNIT_NOT_VERIFIED')
            row['gapTypes']=gaps
            raw_rows.append(row)
    by={(r['metric'],r['period']['id']):r for r in raw_rows if r['ticker']==t and 'period' in r}
    for period in periods:
        for level in ['CORE','SECTOR_CORE']:
            for g in spec[level]:
                candidates=[by[(m,period['id'])] for m in g['anyOf']]
                priority=['AVAILABLE_AND_QUALIFIED','AVAILABLE_NEEDS_MAPPING','AVAILABLE_NEEDS_VERIFICATION','MISSING_SOURCE_DATA']
                groups.append({'ticker':t,'sector':sector,'period':period['id'],'level':level,'group':g['id'],'anyOf':g['anyOf'],'candidateRows':[r['id'] for r in candidates],'classification':min((r['classification'] for r in candidates),key=priority.index),'counting':'ONE_OR_GROUP_NOT_ALL_ALTERNATIVES_REQUIRED'})

# Inventory executable metric recipes, not a new decision that every metric is mandatory.
text=(ROOT/'src/domain/scoring/metrics.ts').read_text().split('export const METRICS = {',1)[1].split('} as const;',1)[0]
recipes={m:json.loads(v) for m,v in re.findall(r'(\w+):\s*(\[[^\]]+\])',text)}
assert len(recipes)==19
operand_concepts={'CFO':['CFO'],'cumulative_CFO':['CFO'],'gross_loans':['BANK_GROSS_CUSTOMER_LOANS'],'loan_loss_reserves':['BANK_LOAN_LOSS_RESERVES'],'current_and_savings':['BANK_CURRENT_AND_SAVINGS_DEPOSITS'],'deposits':['BANK_CUSTOMER_DEPOSITS'],'revenue_end':['REVENUE'],'revenue_start':['REVENUE']}
normalized_operands={'NOPAT','average_invested_capital','normalized_common_profit','average_common_equity','cumulative_normalized_NPAT','issuer_capex','interest_bearing_debt','unrestricted_cash','normalized_EBIT','net_interest','normalized_FCFE','normalized_EPS','sustainable_DPS','BVPS','EV','conservative_value','adjusted_EPS_end','adjusted_EPS_start','change_normalized_NOPAT','change_invested_capital','net_debt','normalized_EBITDA','NPL'}
bank_excluded={'CFO_CONVERSION','FCF','NET_DEBT_EBITDA','INTEREST_COVERAGE','ROIC','INCREMENTAL_ROIC'}
metric_rows=[]
for t,sector in sorted(sectors.items()):
    for m,operands in recipes.items():
        na=(sector=='BANK' and m in bank_excluded) or (sector!='BANK' and m in ['NPL','COVERAGE','CASA'])
        refs=[r['id'] for r in raw_rows if r['ticker']==t and r.get('period') and r['metric'] in {x for op in operands for x in operand_concepts.get(op,[])}]
        metric_rows.append({'ticker':t,'sector':sector,'metric':m,'orderedOperands':operands,'classification':'NOT_APPLICABLE' if na else 'AVAILABLE_NEEDS_VERIFICATION',
          'applicability':'PROHIBITED_BANK_SUBSTITUTION' if sector=='BANK' and m in bank_excluded else 'BANK_SPECIFIC' if m in ['NPL','COVERAGE','CASA'] else 'PRIMARY_RETURN' if m=='ROE' and sector in ['BANK','SECURITIES','INSURANCE'] else 'CONDITIONAL_OR_CROSS_CHECK; select under approved sector rubric',
          'rawInputRows':refs,'normalizationOrAnalyticalOperands':[x for x in operands if x in normalized_operands],
          'reason':'SECTOR_INAPPLICABLE' if na else 'RECIPE_EXISTS; complete exact ordered, comparable and economically qualified operands not demonstrated by scalar availability',
          'timeRequirements':'FY2022-FY2025 for 3-year CAGR; 5-year preferred requires earlier endpoint; TTM FY2025 + H1_2026 - H1_2025; averages require opening stocks; no annualization',
          'boundaryInputs':[x for x in operands if x in ['price','market_cap','EV','conservative_value','sustainable_DPS']],
          'governedAdmission':'DERIVED_OUTPUT_NOT_AUTOMATICALLY_ADMITTED','consumerReadiness':'NO_NEW_SCORE_OR_VALUATION_AUTHORITY'})

# Preserve every sector-document evidence bullet verbatim with its qualifier/heading.
sector_text=(ROOT/'docs/03 SCORING/SECTOR_NORMALIZATION.md').read_text().splitlines()
sections={'BANK':'5.','REAL_ESTATE':'6.','TECHNOLOGY':'7.','RETAIL':'8.','INDUSTRIAL':'9.','MATERIALS':'10.','UTILITIES':'11.','ENERGY':'12.','SECURITIES':'13.1','INSURANCE':'13.2','CONGLOMERATE':'14.'}
sector_templates={}
for sector,prefix in sections.items():
    lines=[];capture=False;heading='';qualifier=''
    for n,line in enumerate(sector_text,1):
        if line.startswith('# ') or (prefix.startswith('13.') and line.startswith('## 13.')):
            capture=line.startswith(('# '+prefix,'## '+prefix))
        if not capture:continue
        if line.startswith('#'):heading=line;qualifier=''
        elif line.endswith(':') and line.strip():qualifier=line
        elif line.startswith('- '):lines.append({'line':n,'heading':heading,'qualifier':qualifier,'evidenceRequirement':line[2:],'classification':'AVAILABLE_NEEDS_VERIFICATION','interpretation':'REQUIREMENT_OR_CONTEXT_AS_WRITTEN; not every bullet a mandatory additive metric; topic qualification not inferred from raw values'})
    sector_templates[sector]={'requirements':requirements['sectors'][sector],'documentRequirements':lines,'tickers':[t for t in sorted(sectors) if sectors[t]==sector]}
# The minimum principle-equivalent families also include non-statement/topic evidence.
principle_rows=[]
for t,sector in sorted(sectors.items()):
    for item in sector_templates[sector]['documentRequirements']:
        forbidden=('Prohibited' in item['heading'] or 'Prohibited' in item['qualifier'] or item['qualifier'].startswith('Do not use'))
        principle_rows.append({'ticker':t,'sector':sector,'metric':'SECTOR_EVIDENCE_LINE_'+str(item['line']),**item,
          'classification':'NOT_APPLICABLE' if forbidden else 'AVAILABLE_NEEDS_VERIFICATION',
          'valueAvailability':'UNCONFIRMED_TOPIC_OR_ANALYTICAL_REQUIREMENT',
          'sourceContract':'docs/03 SCORING/SECTOR_NORMALIZATION.md','sourceLine':item['line'],
          'evidenceReuse':'See exact per-ticker rubric/topic inventory and retained notes; no exhaustive negative search or new qualification.',
          'governedAdmission':'NOT_PROVEN_BY_STATEMENT_SCALAR','consumerReadiness':'ANALYST_AND_ECONOMIC_REQUIREMENTS_REMAIN'})
# Record the minimum families explicitly as well as the final sector-normalization matrix.
metric_definition_lines=(ROOT/'docs/03 SCORING/METRIC_DEFINITIONS.md').read_text().splitlines()
minimum_families=[]
inside=False;heading='';qualifier=''
for n,line in enumerate(metric_definition_lines,1):
    if line.startswith('# '):inside=line.startswith('# 11.')
    if not inside:continue
    if line.startswith('## '):heading=line;qualifier=''
    elif line.startswith('**'):qualifier=line
    elif line.startswith('- '):minimum_families.append({'line':n,'heading':heading,'qualifier':qualifier,'requirement':line[2:]})
# Bounded future validation candidates, exact existing values and original evidence refs, not executed plans.
real_fixtures=[]
for t in ['VNM','ACB','HPG','SSI','VHM','FPT','BSR','GAS','VJC']:
    selected=[r for r in raw_rows if r['ticker']==t and r.get('period',{}).get('id') in ['FY2025','H1_2026','Q3_YTD_2026'] and r.get('mandatory')]
    real_fixtures.append({'ticker':t,'sector':sectors[t],'candidateRowIds':[r['id'] for r in selected],'canonicalExpectedValues':[{'factId':f,'value':next(e['value'] for ee in evidence.values() for e in ee if e.get('factId')==f)} for r in selected for f in r.get('qualifiedFactRefs',[])],'status':'DESIGN_ONLY; resolve exact native cells and blockers before execution'})
# Full 23-rubric inventory remains separate from financial ingestion requirements.
rubric_rows=rubric_inventory['rows']
assert len(rubric_rows)==690
summary={'byTicker':{},'bySector':{},'byMetric':{}}
for dimension,key in [('byTicker','ticker'),('bySector','sector'),('byMetric','metric')]:
    for value in sorted(set(r[key] for r in raw_rows)):
        rows=[r for r in raw_rows if r[key]==value]
        summary[dimension][value]={'conceptPeriodSlots':count(rows),'mandatoryCandidateSlots':count([r for r in rows if r.get('mandatory')]),'distinctTickers':len(set(r['ticker'] for r in rows))}
summary['sectorPrincipleEvidenceByTicker']={t:count([r for r in principle_rows if r['ticker']==t]) for t in sorted(sectors)}
summary['sectorPrincipleEvidenceBySector']={v:count([r for r in principle_rows if r['sector']==v]) for v in sorted(set(sectors.values()))}
summary['gapCounts']={}
for dimension,key in [('byTicker','ticker'),('bySector','sector'),('byMetric','metric')]:
    summary['gapCounts'][dimension]={v:dict(sorted(C.Counter(g for r in raw_rows if r[key]==v for g in r.get('gapTypes',[])).items())) for v in sorted({r[key] for r in raw_rows})}
summary['gapCounts']['interpretation']='Overlapping applicable concept/period gap flags; not mutually exclusive missing-data totals. Missing metric/PDF native verification is distinct from missing physical source.'
summary['declaredQualifiedFactsWithoutRetainedHashAlias']=sum(r.get('declaredQualified',False) and not r.get('retainedSourceAliases') for v in evidence.values() for r in v)
summary['declaredQualifiedFactsWithHashAliasButIncompleteScreen']=sum(r.get('declaredQualified',False) and bool(r.get('retainedSourceAliases')) and not r.get('accountingQualified') for v in evidence.values() for r in v)
summary['mandatoryOrGroups']=count(groups)
summary['executableMetricInstances']=count(metric_rows)
summary['rawConceptPeriodSlots']=count(raw_rows)
summary['receiptBoundRawHashes']=len(raw_by_hash)
summary['canonicalFacts']=sum(len(v['body']['canonicalFacts']) for v in runs.values())
summary['canonicalFactsDeclaredQualified']=sum(f.get('qualified') is True for v in runs.values() for f in v['body']['canonicalFacts'])
summary['canonicalFactsAccountingQualifiedAndHashLinked']=sum(r.get('accountingQualified',False) for rows in evidence.values() for r in rows)
summary['qualifiedValueConflicts']=sum(r.get('conflictingQualifiedValues',False) for r in raw_rows)
summary['sourceAbsenceEstablished']=0
summary['sourceAbsenceInterpretation']='No exhaustive absence claim; UNCONFIRMED values/periods remain explicit. Zero proven missing is not complete coverage.'
summary['sourceInventoryByTicker']={t:{'downloadedHashBound':sum(r['ticker']==t and r['retainedHashBound'] for r in receipt_summary),'apiReceipts':sum(r.get('symbol')==t for r in api_receipts),'nativeObservationCount':next(r['nativeObservationCount'] for r in coverage if r['ticker']==t),'dossierMetricCount':next(r['dossierMetricCount'] for r in coverage if r['ticker']==t),'legacyCanonicalCount':len(runs[t]['body']['canonicalFacts']),'unresolvedIssuerConflicts':len(runs[t]['body'].get('unresolvedIssuerConflicts',[])),'retainedQ3_2026Paths':[r['path'] for r in receipt_summary if r['ticker']==t and r['retainedHashBound'] and re.search(r'Q3_2026',r['path'] or '',re.I)]} for t in sorted(sectors)}

matrix={'contract':'f2-coverage-assessment-v1','baseline':BASELINE,'assessmentDate':'2026-11-13','purpose':'ASSESSMENT_AND_IMPLEMENTATION_PLANNING_ONLY','standingAuthority':'owner-standing-authority-v4; U1 CLOSED; U2 unchanged',
 'interpretation':{'AVAILABLE_AND_QUALIFIED':'Existing canonical accounting qualification, receipt-bound recorded source hash and dimensions; not new formal v4 admission, normalized investment input or PIT.', 'AVAILABLE_NEEDS_MAPPING':'Specific retained legacy concept requires a non-equivalent mapping/derivation; not missing source.', 'AVAILABLE_NEEDS_VERIFICATION':'Exact value candidate OR explicitly UNCONFIRMED value in retained reports; follow valueAvailability and reason. Not a completeness assertion.', 'MISSING_SOURCE_DATA':'Use only after targeted absence evidence; no such exhaustive absence established here.', 'NOT_APPLICABLE':'Not requested by sector requirement contract or prohibited sector substitution; no required coverage denominator.'},
 'periodPolicy':{'mandatoryOperationalTargets':[p for p in periods if p['track']!='KNOWN_NEWER_DISCLOSURE_REVIEW'],'newerKnownDisclosureTargets':[p for p in periods if p['track']=='KNOWN_NEWER_DISCLOSURE_REVIEW'],'quarterlyGraceDays':60,'q3_2026GraceEnd':'2026-11-29','separateLatestKnownDisclosureRule':'METRIC_DEFINITIONS §14: known newer disclosures can make old data stale/provisional even within operational grace.', 'supplementalDependencies':['H1_2025 for TTM to H1_2026','FY2021 or corresponding prior interim stock for period averages','verified share and corporate-action history for per-share comparability','through-cycle evidence when cyclical','earlier endpoints for preferred 5-year CAGR'],'noQuarterForYtd':True},
 'sectorTemplates':sector_templates,'sectorPrincipleRows':principle_rows,'minimumPrincipleFamilies':minimum_families,'plannedRealFixtures':real_fixtures,'rawMetricRows':raw_rows,'mandatoryGroups':groups,'executableMetricRecipes':recipes,'executableMetricRows':metric_rows,
 'rubricCoverage':{'path':AUDIT+'VN30_ISSUER_RUBRIC_MATRIX.json','sha256':PINS[AUDIT+'VN30_ISSUER_RUBRIC_MATRIX.json'],'rows':690,'rubricsPerTicker':23,'interpretation':'Exact existing per-ticker analyst/topic gaps retained; do not classify qualitative judgments, forward assumptions, moats or risk acceptance as missing statement data.'},
 'evidenceIndex':[{'ticker':k[0],'metric':k[1],'periodEnd':k[2],'observations':v} for k,v in sorted(evidence.items(),key=lambda x:str(x[0]))],
 'surfaceInventory':surfaces,'receiptInventory':receipt_summary,'supplementalReceiptPaths':receipt_paths,'checkedReadingBindings':checked_reading_bindings,'normalization':normalization,'summary':summary,
 'activeDatabase':{'path':'data/vn30.sqlite','sha256':db_hash,'method':'mode=ro&immutable=1','counts':db_counts,'admissionRuns':[{'ticker':t,'id':r['id'],'bodyHash':r['bodyHash'],'analysisAt':r['body'].get('analysisAt'),'sourcePolicy':r['body'].get('sourcePolicy'),'readyForScoring':r['body'].get('readyForScoring')} for t,r in sorted(runs.items())],'interpretation':'Existing legacy runs are not v4 admissions; zero observation/snapshot rows does not mean zero retained financial facts.'},
 'governance':{'U1':'CLOSED_NOT_REOPENED','U2':'UNCHANGED_NOT_REASSESSED','VNM17':'PENDING_ADMISSION_UNCHANGED','R1':'CLOSED_UNCHANGED','R4':'CLOSED_UNCHANGED','productionActivation':'NOT_AUTHORIZED','newAdmissionExecuted':False},
 'limitations':['No new cell-by-cell PDF interpretation, source acquisition or ingestion executed. Retained JSON first.','Existing canonical qualifications and original binary source hashes are reused as recorded, not rehashed or recertified under v4. Receipt-bound aliases are not a new binary integrity attestation.','Raw report period keys can include OCR errors; they are leads, not issuer-period certification.','Reported earnings, EPS, cash and debt do not automatically satisfy normalized common earnings, sustainable DPS, unrestricted cash or debt-v2 population definitions.','No current formal consumer or historical PIT readiness inferred from a supported scalar.']}
write('F2_REQUIRED_METRIC_MATRIX.json',matrix)
write('SOURCE_PINS.json',{'baseline':BASELINE,'files':[{'path':p,'sha256':h} for p,h in sorted(PINS.items())],'database':matrix['activeDatabase']})
# Read-only invariant checked again after all scans.
assert sha(ROOT/'data/vn30.sqlite')==db_hash

rows=[]
for t in sorted(sectors):
    s=summary['byTicker'][t]['mandatoryCandidateSlots']; inv=summary['sourceInventoryByTicker'][t]
    rows.append([t,sectors[t],inv['downloadedHashBound'],inv['legacyCanonicalCount'],s.get('AVAILABLE_AND_QUALIFIED',0),s.get('AVAILABLE_NEEDS_MAPPING',0),s.get('AVAILABLE_NEEDS_VERIFICATION',0)])
md('F2_FINANCIAL_DATA_INVENTORY.md',f'''# F2 financial data inventory — 2026-11-13

Assessment baseline `{BASELINE}`. U1 Standing Authority v4 remains CLOSED; U2 is unchanged. No source retrieval, admission, production write or scoring change was performed.

The retained corpus contains financial data for all 30 configured tickers. The immediate F2 constraint is not an established corpus-wide source shortage: it combines bounded native adapters, catalog/semantic bindings, economic normalization and current-purpose consumer integration. Some values and exact periods remain unconfirmed; source presence is not full metric qualification. Later supplemental receipts, including retained Q3 2026 PDFs/archives, are included separately from the original acquisition manifest.

## Authority and inventory contract

Pinned approved SCORING_MODEL, METRIC_DEFINITIONS (§§2, 3, 11–14), SECTOR_NORMALIZATION (§§5–14, 16, 18), DATA_RULES and Financial Data contracts are in SOURCE_PINS.json. The accepted executable head is the 2026-10-29 HEAD_SCORING_MODEL; its three-item intersection is not the entire sector requirement. The matrix imports requirements-v2 verbatim for all 11 sector templates; 30 tickers occupy {len(set(sectors.values()))} sectors. Empty sector templates require no invented ticker research.

Counts are concept/period candidate slots, not companies completed, scores, or progress percentages. CORE/SECTOR_CORE anyOf groups count once in `mandatoryGroups`; a valid reported-borrowings alternative does not require comprehensive debt as well. SUPPORTING and OPTIONAL are separate. The sector evidence bullets retain their primary/cross-check/prohibition qualifiers and have ticker-scoped principle rows; they are not all mandatory statement quantities. The 19 executable metric recipes and 690 existing rubric assessments are separately indexed; formula availability does not establish normalized operands or full scoring readiness.

## Retained data and qualification

{summary['canonicalFacts']} legacy canonical facts in {db_counts['fundamental_admission_run']} SQLite admission-run bodies; {summary['canonicalFactsDeclaredQualified']} declare qualified, and {summary['canonicalFactsAccountingQualifiedAndHashLinked']} also satisfy this assessment's conservative qualification/dimension/hash-link screen. {summary['declaredQualifiedFactsWithoutRetainedHashAlias']} declared-qualified facts lack an exact recorded-hash alias in the current receipt inventories; {summary['declaredQualifiedFactsWithHashAliasButIncompleteScreen']} have an alias but do not satisfy every explicit metadata/consolidated-scope check of this screen. Those counts describe reusable-proof/metadata work, not rejection of their historical qualification or proof that source values are missing. Database observation and snapshot tables contain {db_counts['fundamental_observation']} and {db_counts['fundamental_snapshot_run']} rows. Legacy runs, review fixtures and presentation JSON are distinct from standing-v4 formal admissions. No database write was made.

{table(['Ticker','Sector','Receipt-bound retained PDFs','Legacy canonical facts','Mandatory qualified slots','Needs mapping','Needs verification'],rows)}

No `MISSING_SOURCE_DATA` claim is established by this assessment. This is not a claim of complete data: `valueAvailability=UNCONFIRMED` rows explicitly require targeted retained-document/period review. Review candidates and unknown dimensions do not become qualified through admission labels. The previously parsed 90 presentation surfaces are reused with their recorded hashes; their large files and PDF bytes are not rehashed or recertified here. All per-metric/per-sector counts, exact source aliases, original receipts, source hashes, SQL run IDs/body hashes, JSON Pointers, scopes, periods and candidate references are in the matrix.

## Periods and conflicts

Operational baseline FY2022–2025 plus H1 2026 follows `hybrid-sufficiency.ts::financialTargets` and the existing 60-day grace. Q3 grace ends 2026-11-29; this is not a statutory deadline. Q3 2026 report/archival leads are already retained for the universe, so the matrix adds Q3_YTD_2026 review slots separately from those operational targets. Known newer disclosure is a separate freshness check under METRIC_DEFINITIONS §14; retained Q3 document leads are listed per ticker and must be reconciled before a current admission is called fresh. A Q3 quarter cannot replace nine-month YTD.

TTM requires FY2025 + H1 2026 − H1 2025; period averages need opening balances; 2022→2025 supports three-year, not five-year CAGR. These supplemental dependencies are not silently treated as proven merely because the baseline endpoints exist. Unknown OCR periods/scope remain review leads. {summary['qualifiedValueConflicts']} applicable candidate rows have conflicting qualified value tuples under the exact concept/end/dimension screen; other revision, definition and source conflicts still require existing conflict validators. No latest-wins selection was made.

Existing earnings-normalization results are linked per ticker: conditional working cases and reported NPAT remain separate from accepted normalized common earnings. Notes search is not an exhaustive negative search or qualitative rubric qualification.
''')
md('F2_ADMISSION_CAPABILITY_GAPS.md','''# F2 admission capability gaps

## Finding

Financial quantities, admission capability and investment-input readiness are separate layers. Full F2 closure is NOT ESTABLISHED. U1 is CLOSED; no new independent material-acceptance gate is proposed.

| Gap | Exact evidence/contract | Impact and smallest action |
| --- | --- | --- |
| Native adapter breadth | VERSIONED_SOURCE_REGISTRY.json `/authorities/1/validatedAdapterScope`: DIRECT_PDF, TOTAL_ASSETS only; `versioned-authority.ts::verifyFinancialPlan` caption allowlist contains TOTAL_ASSETS | Other concepts can exist and be accounting-qualified yet cannot pass this adapter. Add versioned source-native semantic rules by statement family; test issuer-specific meaning, not equal amounts or generic provider codes. |
| Trusted ticker coverage | TRUSTED_SOURCE_INPUTS.json `/catalogs/pdfExtractions` and `/catalogs/financialSemantics`: VNM only; receipts cover more tickers | Bind existing hash-verified extraction/semantic inputs for selected tickers. Evidence catalog additions are not source authority or new per-fact approval. |
| Structured API native path | Registry says SOURCE_ELIGIBLE_OBSERVATION_ADAPTER_NOT_QUALIFIED; verifier requires DIRECT_PDF | Separate exact raw JSON Pointer/namespace/code-occurrence/request-variant adapter is needed if API fallback is used. Do not relabel an API value as PDF. Not required when retained qualified PDF suffices. |
| Definitions and normalization | METRIC_DEFINITIONS §§2–3, debt-contract-v2, current-qualification.ts; per-ticker normalization outputs | Reported earnings are not normalized common profit; parent/common attribution, funds/one-offs, unrestricted cash, debt population, leases, capex and normalized EBITDA need exact operand proofs. Reuse existing qualified evidence and arithmetic. |
| Period/identity uncertainty | Matrix rows with UNCONFIRMED values and periodSurfaceCount; extraction variants with unknown scope; requirements-v2 freshness | Target only unresolved periods/captions/units/issuer identity and latest-known disclosures. No whole-corpus reacquisition. Supplemental TTM/opening/through-cycle dependencies remain explicit. |
| Conflict resolution | Matrix conflictingQualifiedValues, legacy unresolvedIssuerConflicts, source variants and revision identity | Retain all candidates; quarantine conflicting values or definitions. A zero narrow-screen conflict count is not a proof of no disagreements in the corpus. |
| Consumer purpose integration | scorecard.ts calls validateEvidence without current-purpose argument; sector-requirements.ts requires FORMAL/AS_KNOWN; runtime-provenance.ts requires publication proof and knownAt ≤ asOf | Add a separate current-formal bridge after approved implementation, preserving strict PIT and scoring rules. Current operational knowledge must never be relabeled historical availability. |
| Existing UI DTO | 2026-10-24 FINANCIAL_ADAPTER_CONTRACT.md: read-only research presentation | Visible numeric data is not formal consumption. Test isolated persistence → governed reader → intended current consumer, with full lineage and revocation. |

## Count interpretation

F2_REQUIRED_METRIC_MATRIX.json `summary.byTicker`, `bySector`, `byMetric` provides exact classification counts; `mandatoryOrGroups` avoids counting both debt/capital alternatives as mandatory. `summary.gapCounts` gives overlapping capability/verification/integration counts by ticker, sector and metric; `sourceInventoryByTicker` includes retained PDF receipts, API requests, native/dossier/legacy facts and unresolved issuer conflicts. `executableMetricInstances` counts analytical recipes separately. Adapter/canonical/consumer states are independent on each raw row. No generic “not admitted = missing data” classification was used.

The exact metric/end-date screen identifies values for reuse, not a new universal mapping. `AVAILABLE_NEEDS_MAPPING` identifies existing legacy FINANCIAL_DEBT evidence requiring debt-v2 interpretation. `AVAILABLE_NEEDS_VERIFICATION` includes known concept candidates and explicitly unconfirmed values/periods; targeted review may later establish genuine source absence. Sector-document evidence bullets, their primary/cross-check/prohibition qualifiers and source lines are retained in `sectorTemplates`; they must not become an additive universal checklist of ratios.

## Remaining boundaries

Raw stores, hashes, receipt trust classification, idempotence, transaction/conflict handling and revocation already exist in unified-admission.ts and standing-v4 contracts. Reuse them. Financial-data-source approval is valid; no per-PDF/fact owner or independent material approval is required. New adapters/material semantic-policy changes still follow version governance. VNM17 pending proposal, R1/R4 closures and investment rules stay unchanged. No U1/U2 remediation belongs in this plan.
''')
md('F2_IMPLEMENTATION_PLAN.md','''# F2 implementation plan — proposed, not executed

CIO review is required before implementation. Standing-v4 authority remains in force. Order work by a bounded real-data vertical slice, then reusable statement-family coverage; do not reacquire the corpus or create a second admission pipeline.

1. **Bind retained evidence.** Resolve historical paths using exact SHA-256 and original issuer receipts. For each chosen fact attach issuer/security, report/document identity, economic period/type, scope, native unit/scale, source role, original capture receipt, publication evidence or explicit absence, extraction/review time and immutable native locator. Use matrix evidenceIndex and receiptInventory; never infer authorization from a user path or URL. Add validated ticker extraction/semantic catalogs under the existing standing source policy. No per-fact/PDF approval.
2. **Expand native PDF semantics.** Reuse normalization.ts, buildHybridAdmission, financial.ts and Evidence validators. Add versioned rules for nonbank balance sheet/income/cashflow, bank balance sheet/income/credit/capital disclosures and securities statements. Bind concept to actual caption/definition and page/box/value/unit, not matching amounts, provider code alone or VNM-only captions. Handle negatives, decimal/percent units, dash/null/missing, dimensions, restatements and repeated captions explicitly. Unknowns stay quarantined. Add a structured API JSON-Pointer adapter only where needed, preserving endpoint, sector namespace, report mode, code occurrence and original response hash. Do not copy PDF claims onto API evidence.
3. **Reuse normalization and derivation contracts.** Resolve only matrix gaps. Keep reported accounting facts separate from normalized/common earnings, unrestricted cash, comprehensive debt versus reported borrowings, lease basis, maintenance/growth capex and cycle/downside EBITDA. Preserve existing normalization adjustment ledgers and witness semantics; v4 supersedes per-material authority, not economic proof. Build TTM and opening-average operands only from compatible period/scope/revision inputs. Use existing calculateMetrics; never substitute parent profit or total cash automatically. Bank CAR/CET1 anyOf, NPL population/coverage/NIM/CASA/credit cost and securities margin-loan/liquidity semantics need sector rules; industrial ratios cannot substitute for bank health.
4. **Current-purpose consumption.** Reuse governed persistence, dedupe, conflicts and revocation. Introduce a purpose-explicit current-formal projection/bridge through the existing consumer boundary, rather than relaxing legacy AS_KNOWN or scorecard defaults. Operational knownAt can follow economic cutoff only in the current contract. Validate Evidence with the intended purpose; retain exact original publication status. Return N/R/blocked on missing normalized/qualitative inputs; data admission alone must not emit a score or production valuation.
5. **Expand by verified statement family.** Start VNM nonbank and ACB bank; then HPG debt/cycle, SSI securities, VHM real-estate realization, FPT services/capex, BSR energy and GAS utilities to cover all nine configured sectors, adding VJC for industrial cash reinvestment. Use the exact retained docs and candidate IDs in this package. Resolve new source absence only with targeted evidence; never broad-download by default. Material adapter/policy versions follow existing governance without reopening U1 or requesting standing-source approval again.

Deliver implementation as separately reviewable changes: catalog/native bindings, sector extraction semantics, analytical operand qualification, current consumer bridge, then isolated acceptance witnesses. Each stage must pin code/schema/policy hashes, quarantine lists and replay results. Do not update active DB, M3/M4 rules, scores, portfolio transactions or production activation during this proposed work without the appropriate implementation scope.
''')
md('F2_CLOSURE_CRITERIA.md','''# F2 closure criteria and validation design

These are future implementation acceptance tests, not tests executed by this assessment. Existing v4 success is retained; synthetic fixtures alone cannot establish multi-sector real-data closure.

## Representative real-data paths

Select actual native cells using the matrix's canonical fact IDs / ledger references, then build exact plans from retained documents. Assert native lexical value and declared units normalize to the retained expected amount, not a copied expected scalar disconnected from source.

| Fixture | Minimum bounded facts/periods | Required proof |
| --- | --- | --- |
| VNM / RETAIL | Total assets/equity, revenue, earnings, CFO, inventory, qualifying debt alternative and cash; FY2025 + H1 2026, then retained Q3/YTD current columns | Source aliases by SHA, original receipts, exact consolidated native cells, cashflow period, no automatic normalized/common-profit/cash inference; do not promote pending VNM17 proposal. |
| ACB / BANK | Assets/equity/earnings, loans, deposits, loan-loss reserves and CAR or CET1; FY2025 + H1 2026, then retained Q3/YTD current columns | Exact loan/reserve populations, bank report definitions/units, capital disclosure identity and current Q3/YTD freshness;  bank-specific NPL/coverage/CASA mappings only where evidence supports them. |
| HPG / MATERIALS | Core quantities plus gross/operating margin and debt components | Existing debt-v2 population/lease/unknown-liability proofs; cyclical normalized/downside output only when independently supported economically. |
| SSI / SECURITIES | Assets/equity/earnings, liquidity, debt and margin loans | Sector definitions, no nonfinancial debt-v2 assumption or bank-population reuse. |
| VHM, FPT, BSR, GAS, VJC | Corresponding real-estate inventory/realization, services reinvestment, energy margin and utility cash-capex core | One exact real witness per distinct native statement family and each configured sector, including VJC industrial reinvestment; preserve heterogeneous captions and scope. |

Use a newly created isolated temporary SQLite database with migrations and a fixed clock; the active database remains untouched. For each fixture run the actual financial ingest planner, lexical normalization, hybrid/canonical validators, standing trust verifier, Evidence validation with CURRENT_FORMAL_VALUATION, persistence and governed consumption. Check raw bytes/hash, original receipt/review/publication identities, source role, issuer, schema/adapter/policy version, exact dimensions and all observation/fact lineage. Replay deterministically; inspect persisted rows and consumed evidence, not merely planner success. Preserve an immutable validation report with input/policy/code/output hashes.

## Required positive and negative cases

- Approved-source real PDF admission and readback for banking and nonbanking; structured API path only after its native adapter is qualified.
- Original source/hash/issuer/report-period/scope/unit/cell locator matches, including scale and negative financial values. Dash/null/missing never converted to zero.
- Reject untrusted URLs, spoofed domain/issuer, changed raw bytes/hash/schema/caption, altered receipt/review time, arbitrary supplied review JSON and unsupported adapter/version. No per-material approval requirement.
- Quarantine conflicting equal-dimension financial facts, incompatible periods/revisions and unsupported normalization. Preserve dissenting raw observations; no latest-wins.
- Repeated input is idempotent; no duplicate observations/facts/raw multipart payloads. Cross-ticker fact/capture/semantic catalogs cannot leak.
- Revoked/superseded standing version or admitted record cannot be consumed. A material adapter change cannot reuse stale code authorization hashes.
- Later operational knowledge may pass CURRENT_FORMAL_VALUATION when all controls pass; the same fact must fail historical PIT without independently established publication/availability. DATE_ONLY publication is not an invented timestamp.
- Known newer disclosure triggers existing freshness treatment; quarter and YTD remain distinct. Missing H1 comparative/opening stock blocks only dependent TTM/average/metric, not an unrelated valid scalar.
- Bank industrial-ratio substitutions fail. Reported profit/cash/debt cannot masquerade as normalized common profit/unrestricted cash/comprehensive debt.
- Current consumer explicitly receives intended purpose and governed data; legacy strict AS_KNOWN and scoring/analyst completeness gates remain unchanged. Successful ingestion cannot auto-produce a score, portfolio action or production activation.

## Closure decision contract

Full financial coverage requires all applicable CORE/SECTOR_CORE OR-groups and required periods to be economically/dimensionally verified, or a policy-permitted explicit blocked/N/R treatment; supporting/optional and five-year-preferred gaps remain disclosed without invented mandatory gates. The approved 23-rubric model still requires analyst/topic/forward/normalization evidence; F2 raw ingestion is not full score readiness.

F2 admission expansion is accepted only after representative real-data source-to-fact persistence AND consumption pass in isolation, with deterministic replay and negative cases above; then quantify remaining ticker/metric/period exceptions against this inventory. No unsupported “all VN30 ready” claim from representative tests. Historical PIT remains NOT_QUALIFIED unless separately established. Production activation remains NOT_AUTHORIZED. CIO implementation approval is the next gate for this package, not renewed source approval.
''')
md('CIO_REVIEW.md',f'''# CIO review — F2 coverage assessment

Baseline `{BASELINE}`; assessment only. U1 CLOSED, U2 unchanged. Standing F1/F2 approvals remain valid; no renewed or per-fact source approval requested.

## Decision requested

Review the proposed retained-evidence/catalog, source-native adapter, normalization and purpose-explicit consumer expansion in F2_IMPLEMENTATION_PLAN.md before implementation. This package does not execute that plan or assert formal F2 closure.

- [ ] Accept the five-way inventory interpretation, including explicitly unconfirmed values instead of presumed source absence.
- [ ] Confirm bounded VNM + ACB real-data vertical slices, followed by distinct sector/native statement families.
- [ ] Approve implementation scope for reusable adapters/catalog bindings and current-formal consumer integration under version governance.
- [ ] Retain economic qualification, exact source lineage, quarantine, idempotence, revocation and current/PIT separation.
- [ ] Require isolated real-data persistence/consumption and negative tests in F2_CLOSURE_CRITERIA.md before broader closure claims.

## Assessment outcome

Source data exists for all 30 tickers; {summary['canonicalFacts']} legacy canonical facts are retained. Mandatory candidate-slot counts: {json.dumps(count([r for r in raw_rows if r.get('mandatory')]),sort_keys=True)}. Candidate slots include OR-alternatives; use `mandatoryGroups` for requirements. No exhaustive source absence established. Existing accounting qualification is not standing-v4 admission or normalized score eligibility.

F2 full coverage/admission/consumer closure: NOT_ESTABLISHED. Main residual work: broaden native adapter beyond TOTAL_ASSETS, bind other retained ticker semantics/extractions, resolve exact dimensions/normalization/period dependencies and add a governed current-purpose consumer path. These are capability/verification/integration gaps, not a generic request to rediscover sources.

Historical PIT: NOT_QUALIFIED by this assessment. Production Activation: NOT_AUTHORIZED. VNM17 remains pending; R1/R4 remain closed. Active database read-only; no portfolio, investment rule or source authority changes. STOP for CIO review before implementation.

## Files and verification

Six requested deliverables plus a deterministic read-only builder and SOURCE_PINS.json. VALIDATION.json records executed assessment checks only; it must not be interpreted as new financial admission validation. Rebuild from repository root with `python3 docs/fundamental-data-engine/f2-full-coverage-assessment/2026-11-13/build_assessment.py`, then run `validate_assessment.py`.
''')
print(json.dumps({'canonicalFacts':summary['canonicalFacts'],'mandatoryGroups':summary['mandatoryOrGroups'],'rawSlots':summary['rawConceptPeriodSlots'],'output':str(OUT)},ensure_ascii=False))
