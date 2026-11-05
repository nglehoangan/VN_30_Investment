"""Owner-authorized six-issuer research slice. Existing source files are read only."""
from collections import Counter
from datetime import datetime, timezone
from decimal import Decimal, localcontext
import hashlib
import json
from pathlib import Path
import re
import sys
from lib.dfr02 import (PILOT, SECTORS, VERSION, Graph, build_metrics, number, text,
                       pointer, esc, page_numbers, match_pdf_candidates, disposition, provider_disposition)
from lib.research19 import capital_bridge

ROOT=Path(__file__).resolve().parents[1]
BASE='docs/fundamental-data-engine/scoring-dataset-acceptance'
DFR1='docs/fundamental-data-engine/dfr-01/2026-11-04'
OUT=ROOT/'docs/fundamental-data-engine/dfr-02/2026-11-04'
NATIVE=f'{BASE}/2026-10-30/b6-comparability-r2'
V2=f'{BASE}/2026-11-04/investment-research-v2'
V4=f'{BASE}/2026-11-04/earnings-normalization-v4'
CONTRACT='dfr02-financial-research-v1'

def load(p): return json.loads((ROOT/p).read_text())
def sha(p): return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
def encode(x): return json.dumps(x,ensure_ascii=False,indent=2)+'\n'
def dump(p,x): p.parent.mkdir(parents=True,exist_ok=True);p.write_text(encode(x))
def rubrics(): return json.loads((ROOT/'src/domain/scoring/methodology.ts').read_text().split('deepFreeze(',1)[1].rsplit(');',1)[0])

class Inputs:
    def __init__(self): self.pins={};self.json={}
    def pin(self,p,ptr=''):
        if p not in self.pins:self.pins[p]=sha(p)
        return dict(path=p,sha256=self.pins[p],jsonPointer=ptr)
    def read(self,p):
        self.pin(p)
        if p not in self.json:self.json[p]=load(p)
        return self.json[p]
    def validate(self):
        for p,h in self.pins.items():
            if sha(p)!=h:raise ValueError('INPUT_HASH_CHANGED:'+p)

def protected():
    files={}
    for base in ['src','app','prisma','config','docs']:
        if not (ROOT/base).exists():continue
        for p in sorted((ROOT/base).rglob('*')):
            if not p.is_file() or 'dfr-02' in p.parts:continue
            rel=str(p.relative_to(ROOT));files[rel]=sha(rel)
    for p in sorted((ROOT/'data').glob('vn30.sqlite*')):
        if p.is_file():files[str(p.relative_to(ROOT))]=sha(str(p.relative_to(ROOT)))
    return files

def pdf_index(d,p):
    out=[]
    for report,r in d['reports'].items():
        for period,x in r['periods'].items():
            for vi,v in enumerate(x['variants']):
                source=v['source'];h=source.get('rawPayloadHash') or source.get('payloadHash')
                for gi,g in enumerate(v['groups']):
                    for ri,row in enumerate(g['rows']):
                        page=row.get('pdfEvidence',{}).get('page') or row.get('pdfEvidence',{}).get('sourcePage') or row.get('sourcePage') or g.get('sourcePage')
                        out.append(dict(path=p,jsonPointer=f'/reports/{esc(report)}/periods/{esc(period)}/variants/{vi}/groups/{gi}/rows/{ri}',report=report,periodKey=period,periodType=v.get('periodType'),year=v.get('year'),scope=v.get('reportingScope'),pdfHash=h,page=page,label=row.get('label') or '',code=row.get('code'),value=row.get('value'),lexicalValue=row.get('lexicalValue'),unit=g.get('unitEvidence'),evidence=row.get('pdfEvidence') or {'pdfPath':source.get('pdfPath'),'page':page},status=row.get('status')))
    return out

def import_facts(inp,g,source,caps,contexts,index):
    path=f'{NATIVE}/native-inputs/{g.ticker}.json';d=inp.read(path)
    for oi,o in enumerate(d['observations']):
        year=o.get('fiscalYear')
        if not year or not 2022<=year<=2025 or o['periodEnd']!=f'{year}-12-31':continue
        scope={'SEPARATE_STANDALONE':'STANDALONE'}.get(o['reportingScope'],o['reportingScope'])
        ci,c=caps[o['rawCaptureId']];payload=json.loads(c['payload']);f=payload.get('originalCanonicalRecord') or {}
        ct=payload.get('checkedTranscription');ctx=contexts[o['id']]
        source_path=payload['sourcePdfPath'];source_hash=payload['sourcePdfSha256']
        if inp.pin(source_path)['sha256']!=source_hash or source_hash!=ctx['sourceHash']:raise ValueError('SOURCE_HASH_BINDING:'+o['id'])
        if number(o['normalized']['value'])!=number(str(f['value'])):raise ValueError('REVIEWED_VALUE_BINDING:'+o['id'])
        if number(o['raw']['lexicalValue'])*number(o['raw']['multiplier'])!=number(o['normalized']['value']):raise ValueError('RAW_UNIT_REPLAY:'+o['id'])
        pages=page_numbers(f,ct)
        full_period=o['periodType']=='INSTANT' or (o['periodType']=='ANNUAL' and o['periodStart']==f'{year}-01-01')
        verified=f.get('qualified') is True and f.get('valueVerified') is True and f.get('definitionVerified') is True and f.get('classification')=='PDF_VERIFIED'
        verified=verified and f.get('sourceHash',source_hash)==source_hash and f.get('itemId')==o['itemId'] and bool(pages)
        original_scope={'SEPARATE_STANDALONE':'STANDALONE'}.get(f.get('scope'),f.get('scope'))
        verified=verified and original_scope==scope and f.get('period',{}).get('end')==o['periodEnd']
        if o['periodType']=='ANNUAL':verified=verified and f.get('period',{}).get('start')==o['periodStart']
        verified=verified and o.get('revisionKind')=='ORIGINAL'
        if number(o['normalized']['value'])==0:verified=verified and f.get('zeroVerified') is True
        status='SUPPORTED' if verified and full_period else 'READY_FOR_REVIEW'
        if not full_period:status='REFERENCE_ONLY'
        codes=re.findall(r'row code\s+(\d+)',f.get('evidenceLocator') or '',re.I)
        candidates=match_pdf_candidates(index,o['itemId'],year,source_hash,pages,codes[0] if len(codes)==1 else None)
        n=dict(id=f'{g.ticker}:{scope}:{o["itemId"]}:{year}',concept=o['itemId'],year=year,scope=scope,kind='REPORTED_FACT',value=o['normalized']['value'],originalValue=f['value'],raw=o['raw'],unit=o['normalized']['unit'],currency=o['normalized'].get('currency'),scale='1',periodType=o['periodType'],periodStart=o['periodStart'],periodEnd=o['periodEnd'],revisionBasis='ORIGINAL_REVIEWED_VINTAGE',originalRevision=o.get('revisionKind'),auditStatus=o.get('auditStatus'),publicationAt=None,retrievedAt=o.get('retrievedAt'),status=status,dependencyIds=[],mappingVersion=VERSION,observationBinding=inp.pin(path,f'/observations/{oi}'),reviewPayloadBinding={**inp.pin(source,f'/rawReferenceCaptures/{ci}/payload'),'payloadJsonPointer':'/originalCanonicalRecord'},pdfEvidence=dict(path=source_path,sha256=source_hash,pages=pages,locators=f.get('evidenceLocator'),hrefs=[source_path+f'#page={p}' for p in pages]),extractionCandidates=candidates,selectionBasis='REUSE_EXACT_VERIFIED_PDF_RECORD_DEFINITION_VALUE_SCOPE_PERIOD_AND_HASH; original extraction retained',priorImageReviewReused=True,newImageReviewClaimed=False,reasons=[] if status=='SUPPORTED' else ['EXACT_REVIEW_OR_WINDOW_INCOMPLETE'],bankCapitalEvidence=f.get('bankCapitalEvidence'))
        # Distinct unresolved extraction candidates remain in provenance; no equal-value mapping.
        g.add(n)


def add_overlay(inp,g,reading,index):
    if reading is None:return
    cp=f'{V2}/checked-capital-readings.json';readings=inp.read(cp)['readings'];i=next(i for i,x in enumerate(readings) if x['ticker']==g.ticker)
    if inp.pin(reading['source']['pdfPath'])['sha256']!=reading['source']['sha256']:raise ValueError('CAPITAL_SOURCE_HASH')
    bridge=capital_bridge(reading);scope=reading['sourceScope']
    nodes={}
    for concept,value in [('CHECKED_TOTAL_EQUITY',text(number(reading['selectedEquitySubtotalNative'])*number(reading['multiplier']))),('CHECKED_NCI',None if reading['nciNative'] is None else text(number(reading['nciNative'])*number(reading['multiplier'])))]:
        nodes[concept]=g.add(dict(id=f'{g.ticker}:{scope}:{concept}:2025',concept=concept,year=2025,scope=scope,kind='REPORTED_FACT',value=value,status='SUPPORTED' if value is not None else 'REFERENCE_ONLY',unit='CURRENCY',currency='VND',scale='1',periodStart='2025-12-31',periodEnd='2025-12-31',periodType='INSTANT',revisionBasis='ORIGINAL_REVIEWED_VINTAGE',dependencyIds=[],nativeOperands=reading,formula=bridge['basis'],binding=inp.pin(cp,f'/readings/{i}'),pdfEvidence=reading['source'],nciInapplicable=scope=='STANDALONE' and value is None,reasons=['ACCOUNTING_CAPITAL_NOT_FAIR_VALUE_OR_DISTRIBUTABLE_CAPITAL']))
    deps=[nodes['CHECKED_TOTAL_EQUITY']]+([] if scope=='STANDALONE' else [nodes['CHECKED_NCI']])
    parent=g.derive('PARENT_ACCOUNTING_CAPITAL',2025,deps,'sum' if scope=='STANDALONE' else 'subtract','Checked standalone equity, or checked total less checked NCI; no preference economic value assumed zero',scope)
    if parent['value']!=bridge['parentCapitalReferenceVnd']:raise ValueError('CAPITAL_BRIDGE_REPLAY')
    parent.update(periodType='INSTANT',periodStart='2025-12-31',nativeOperands=reading,pdfEvidence=reading['source'],existingDfr01Metric=True)


def add_economic_readings(inp,g,normal):
    path=f'{V4}/issuers/{g.ticker}.json'
    for i,r in enumerate(normal['sourceReadings']):
        native=r.get('nativeValue') or r.get('sourceLexicalValue');multiplier=r.get('multiplier') or r.get('currencyMultiplier')
        if native is None or multiplier is None:continue
        year=int((r.get('economicPeriod') or str(r.get('fiscalYear','2025'))).replace('FY',''))
        p=r.get('pdfPath') or r.get('sourcePdf');h=r.get('sha256') or r.get('sourceHash')
        if p is None:continue
        if inp.pin(p)['sha256']!=h:raise ValueError('READING_PDF_HASH')
        value=text(number(native)*number(multiplier));concept='NOTE_'+(r.get('key') or r['id'].split('-')[-1])
        g.add(dict(id=f'{g.ticker}:note:{i}:{year}',concept=concept,year=year,scope=normal['scope'],kind='REPORTED_FACT',value=value,status='SUPPORTED',unit='CURRENCY',currency='VND',scale='1',periodStart=f'{year}-01-01',periodEnd=f'{year}-12-31',periodType='ANNUAL',revisionBasis='ORIGINAL_REVIEWED_VINTAGE',dependencyIds=[],nativeValue=native,multiplier=multiplier,binding=inp.pin(path,f'/sourceReadings/{i}'),pdfEvidence=dict(path=p,sha256=h,page=r.get('physicalPage'),caption=r.get('caption')),reasons=['SOURCE_NOTE_VALUE_NOT_AUTOMATIC_RECURRING_EARNINGS']))
    if g.ticker=='TCX':
        ns=[g.nodes[f'TCX:note:{i}:2025'] for i in range(4)]
        a=g.derive('NET_ASSET_REVALUATION',2025,ns[:2],'subtract','Paired asset revaluation gain less loss; not realized trading turnover','STANDALONE')
        b=g.derive('NET_WARRANT_REVALUATION',2025,ns[2:],'subtract','Paired warrant revaluation gain less loss','STANDALONE')
        net=g.derive('NET_PAIRED_REVALUATION',2025,[a,b],'sum','Net paired asset+warrant revaluation; adjustment removes once','STANDALONE')
        adj=next(x for x in normal['selectedPretaxAdjustments'] if x['id']=='TCX-paired-unrealized')
        if number(net['value'])!=-number(adj['pretaxVnd']):raise ValueError('TCX_PAIRED_ADJUSTMENT_REPLAY')


def api_crosschecks(inp,ticker):
    path=f'data/manual-extracted-api/{ticker}.json';d=inp.read(path);records=[];rawcache={}
    from lib.dfr02 import CAPTIONS,normalize
    captions={normalize(c):k for k,cs in CAPTIONS.items() for c in cs}
    for report,r in d['reports'].items():
        for period,x in r['periods'].items():
            if period not in ('2022','2023','2024','2025'):continue
            for vi,v in enumerate(x['variants']):
                src=v['source'];p=src['rawPayloadLocation']
                for gi,group in enumerate(v['groups']):
                    for ri,row in enumerate(group['rows']):
                        concept=captions.get(normalize(row.get('label') or ''))
                        if not concept or row.get('value') is None:continue
                        if p not in rawcache:
                            if inp.pin(p)['sha256']!=src['payloadHash']:raise ValueError('API_SOURCE_HASH')
                            rawcache[p]=json.loads((ROOT/p).read_text(),parse_float=Decimal,parse_int=Decimal)
                        val=pointer(rawcache[p],row['rawLocator'])
                        if number(str(val))!=number(row['value']):raise ValueError('API_RAW_VALUE')
                        status,reason=provider_disposition(src.get('providerUnit'),v.get('modeMismatch'),[r.get('value') for group in v['groups'] for r in group['rows']])
                        records.append(dict(concept=concept,year=int(period),value=row['value'],status=status,provider='CAFEF',unit=src.get('providerUnit'),modeMismatch=v.get('modeMismatch'),requestMode=v.get('requestMode'),source=src,binding=inp.pin(path,f'/reports/{esc(report)}/periods/{esc(period)}/variants/{vi}/groups/{gi}/rows/{ri}'),rawBinding=inp.pin(p,row['rawLocator']),reason=reason+'; no inferred factor from numerical agreement'))
    return records


def add_vnm_standalone(inp,g):
    p=f'{BASE}/2026-10-30/b6-underwriting-r4/vnm-parent-owner-cash-input.json';v=inp.read(p)
    if inp.pin(v['source']['pdfPath'])['sha256']!=v['source']['sha256']:raise ValueError('VNM_PARENT_PDF_HASH')
    if v['sourceScope']!='STANDALONE' or v['currencyMultiplier']!='1' or v['source']['review']['fullPageImagesInspected'] is not True:raise ValueError('VNM_STANDALONE_REVIEW_REQUIRED')
    fields={'npat':'NET_INCOME','cfo':'CFO','cashAcquisitionSpending':'CASH_CAPEX_REPORTED','currentTaxExpense':'CURRENT_TAX','cashTaxPaid':'CASH_TAX_PAID','cashInterestAndDividendsReceived':'CASH_INTEREST_DIVIDENDS','fundAccrued':'FUND_ACCRUED','fundUsed':'FUND_USED','depreciationAmortization':'DA'}
    for yy,values in v['valuesByYear'].items():
        year=int(yy)
        for field,concept in fields.items():
            if values.get(field) is None:continue
            g.add(dict(id=f'VNM:STANDALONE:{concept}:{year}',concept=concept,year=year,scope='STANDALONE',kind='REPORTED_FACT',value=values[field],status='SUPPORTED',unit='CURRENCY',currency='VND',scale='1',periodStart=f'{year}-01-01',periodEnd=f'{year}-12-31',periodType='ANNUAL',revisionBasis='ORIGINAL_REVIEWED_VINTAGE',dependencyIds=[],binding=inp.pin(p,f'/valuesByYear/{yy}/{field}'),pdfEvidence=v['source'],specificFieldPage=None,reasons=['REUSED_REVIEWED_STANDALONE_INPUT; PDF page bundle retained, per-field page not separately qualified']))
        wc=[]
        for i,x in enumerate(values['signedWorkingCapitalFlows']):
            wc.append(g.add(dict(id=f'VNM:STANDALONE:WC_FLOW_{i}:{year}',concept=f'WC_FLOW_{i}',year=year,scope='STANDALONE',kind='REPORTED_FACT',value=x,status='SUPPORTED',unit='CURRENCY',currency='VND',scale='1',periodStart=f'{year}-01-01',periodEnd=f'{year}-12-31',periodType='ANNUAL',revisionBasis='ORIGINAL_REVIEWED_VINTAGE',dependencyIds=[],binding=inp.pin(p,f'/valuesByYear/{yy}/signedWorkingCapitalFlows/{i}'),pdfEvidence=v['source'])))
        g.derive('SIGNED_WC_CASH_CHANGE',year,wc,'sum','Sum disclosed signed working-capital cash adjustments, not asset-balance changes','STANDALONE')
        f=lambda k:g.fact(k,year,'STANDALONE')
        for name,a,b,op,definition in [('STANDALONE_CFO_REPORTED_NPAT','CFO','NET_INCOME','ratio','Standalone reported cash realization; denominator not normalized'),('STANDALONE_POST_ACQUISITION_CASH','CFO','CASH_CAPEX_REPORTED','subtract','Standalone CFO less cash acquisitions, not maintenance FCFE'),('TAX_EXPENSE_LESS_CASH_PAID','CURRENT_TAX','CASH_TAX_PAID','subtract','Current tax expense less actual tax paid; timing diagnostic not sustainable tax rate')]:
            g.derive(name,year,[f(a),f(b)],op,definition,'STANDALONE')


def build():
    inp=Inputs();before=protected()
    for p,h in load(f'{DFR1}/boundary-verification.json')['protectedBefore'].items():
        if sha(p)!=h:raise ValueError('DFR01_PROTECTED_BASELINE_CHANGED:'+p)
    for p,h in load(f'{DFR1}/input-snapshot.json')['pins'].items():
        if sha(p)!=h:raise ValueError('DFR01_INPUT_CHANGED:'+p)
        inp.pins[p]=h
    for p,h in load(f'{DFR1}/manifest.json')['outputs'].items():
        full=f'{DFR1}/{p}'
        if sha(full)!=h:raise ValueError('DFR01_OUTPUT_CHANGED:'+p)
        inp.pin(full)
    for p in [f'{DFR1}/manifest.json','scripts/lib/dfr02.py','scripts/lib/dfr02_reports.py','scripts/build-dfr02.py']:
        inp.pin(p)
    for p in ['scripts/dfr02-assessments.json','scripts/test-dfr02.py','scripts/verify-dfr02-boundaries.mjs']:
        if (ROOT/p).exists():inp.pin(p)
    source=f'{NATIVE}/native-review-sources.json';s=inp.read(source)
    caps={c['id']:(i,c) for i,c in enumerate(s['rawReferenceCaptures'])};contexts={c['observationId']:c for c in s['contexts']}
    readings=inp.read(f'{V2}/checked-capital-readings.json')['readings']
    dossiers=[];conflicts=[]
    common=dict(contract=CONTRACT,classification='RESEARCH_PROVISIONAL',mode='AS_REVISED',researchDate='2026-11-04',cutoff='2026-11-04T16:59:59.999Z',productionAdmissible=False,scoringAuthorized=False,totalScore=None,ranking=None,currentSignal=None,valuationPerShare=None,marginOfSafety=None)
    for ticker in PILOT:
        print('DFR-02:',ticker,flush=True)
        pdf_path=f'data/manual-extracted-pdf/{ticker}.json';index=pdf_index(inp.read(pdf_path),pdf_path)
        g=Graph(ticker);import_facts(inp,g,source,caps,contexts,index)
        normal=inp.read(f'{V4}/issuers/{ticker}.json');prior=inp.read(f'{V2}/issuers/{ticker}.json')
        add_overlay(inp,g,next((r for r in readings if r['ticker']==ticker),None),index)
        add_economic_readings(inp,g,normal);build_metrics(g)
        if ticker=='VNM':add_vnm_standalone(inp,g)
        if ticker=='TCX':
            vp=normal['sourceProfile']['path'];v3=inp.read(vp)
            for di,difference in enumerate(v3['additionalSourceDifferences']):
                conflict=dict(id='TCX:PRINTED_COMMON_NUMERATOR',ticker='TCX',severity='Minor',status='CONFLICT',concept='PRINTED_COMMON_EPS_NUMERATOR',printedVnd=difference['printedVnd'],retainedVnd=difference['retainedCommonVnd'],differenceVnd=difference['differenceVnd'],binding=inp.pin(vp,f'/additionalSourceDifferences/{di}'),propagation='Printed common EPS numerator and its estimates only; retained total standalone NPAT and accounting capital are separate verified concepts.')
                conflicts.append(conflict)
                g.add(dict(id='TCX:STANDALONE:PRINTED_COMMON_EPS_NUMERATOR:2025',concept='PRINTED_COMMON_EPS_NUMERATOR',year=2025,scope='STANDALONE',kind='REPORTED_FACT',value=None,status='CONFLICT',unit='CURRENCY',currency='VND',scale='1',periodStart='2025-01-01',periodEnd='2025-12-31',periodType='ANNUAL',revisionBasis='ORIGINAL_REVIEWED_VINTAGE',dependencyIds=[],conflict=conflict))
        api=api_crosschecks(inp,ticker)
        comp=None
        if ticker in ('BID','TCX','VIC','VHM'):
            cp=f'{V2}/source-comparisons/{ticker}.json';comp=inp.read(cp)
            for ci,c in enumerate(comp['pdfExtractedCandidates']):
                if c.get('numericExtractionMatchesManual') is False:
                    actual=pointer(inp.read(pdf_path),c['extractionPointer'])
                    if actual['value']!=c['nativeValue']:raise ValueError('EXTRACTION_EXCEPTION_CHANGED')
                    conflicts.append(dict(id=f'{ticker}:NCI_OCR',ticker=ticker,severity='Major',status='CONFLICT',selectedOverlayStatus='SUPPORTED',concept='CHECKED_NCI',extractedNative=c['nativeValue'],verifiedNative=c['manualNciNative'],extractionBinding=inp.pin(pdf_path,c['extractionPointer']),reviewBinding=inp.pin(cp,f'/pdfExtractedCandidates/{ci}'),propagation='Only uncorrected NCI and dependent parent-capital paths; exact predecessor overlay qualifies separate corrected path.'))
        # All forecast cases remain explicit estimates; no point-estimate manufacture.
        estimates=dict(status='CONFLICT' if ticker=='TCX' else 'REFERENCE_ONLY',sourceConflictIds=['TCX:PRINTED_COMMON_NUMERATOR'] if ticker=='TCX' else [],kind='ESTIMATE',normalizationBinding=inp.pin(f'{V4}/issuers/{ticker}.json'),reportedCommon=normal['reportedCommonReferenceVnd'],reportedScope=normal['referenceScope'],workingCommon=normal['prudentialWorkingCaseVnd'],workingScope=normal['scope'],operatingAlternatives=normal['operatingAlternatives'],assumptions=dict(tax=normal['taxAssumption'],commonIncidence=normal['commonIncidenceAssumption']),limitations=normal['counterevidenceAndRemainingWork'],scenarioBinding=inp.pin(f'{V2}/issuers/{ticker}.json'),conditionalEquityRange=prior['equityScenarioRange'],model=prior.get('researchModelFamily','PRIOR_11_CONDITIONAL_MODEL'),valuationLimitations=prior['blockingBeforeDatedTradeConclusion'],noNewShareDenominator=True)
        estimates['conditionalValuationCases']=[dict(name=c.get('name') or c['id'],kind='ESTIMATE',status=estimates['status'],equityValueVnd=c['equityValueVnd'],earningsInputVnd=c['earningsInputVnd'],assumptions=c.get('valuationAssumptions') or {k:c.get('model',{}).get(k) for k in ['costOfEquityAssumption','horizonYears','returnPolicy','growthAssumption']},binding=inp.pin(f'{V2}/issuers/{ticker}.json',f'/modelScenarios/{i}'),invalidatedBy=['Changed source pins or common-earnings bridge','Unqualified common claims or capital distribution','Unsupported reinvestment/return persistence','Incompatible share/action/price cutoff'],newValuationAcceptance=False) for i,c in enumerate(prior['modelScenarios'])]
        dossier={**common,'ticker':ticker,'sector':SECTORS[ticker],'metrics':list(g.nodes.values()),'providerCrosschecks':api,'estimates':estimates,'comparability':dict(basis='Original reviewed FY2022–FY2025 source vintages, AS_REVISED research; no claim of latest-restated series or historical AS_KNOWN.',restatementBridges=inp.read(f'{NATIVE}/native-inputs/{ticker}.json')['comparability'],allUnqualifiedQuarterYtdUnresolvedCandidatesExcluded=True),'dfr01Binding':inp.pin(f'{DFR1}/issuers/{ticker}.json')}
        dossiers.append(dossier)
        # Release large per-ticker extraction objects before reading the next issuer.
        inp.json.pop(pdf_path,None)
    inp.validate()
    after=protected()
    if before!=after:raise ValueError('PROTECTED_BASELINE_CHANGED')
    OUT.mkdir(parents=True,exist_ok=True)
    for d in dossiers:dump(OUT/'issuers'/f'{d["ticker"]}.json',d)
    dump(OUT/'source-conflicts.json',dict(items=conflicts))
    dump(OUT/'protected-fingerprints.json',dict(before=before,after=after,unchanged=True))
    dump(OUT/'input-snapshot.json',dict(contract=CONTRACT,pins=inp.pins))
    dump(OUT/'metric-progress.json',dict(byIssuer={d['ticker']:dict(Counter(n['status'] for n in d['metrics'])) for d in dossiers},supportedFacts=sum(n['kind']=='REPORTED_FACT' and n['status']=='SUPPORTED' for d in dossiers for n in d['metrics']),supportedDerived=sum(n['kind']=='DERIVED_METRIC' and n['status']=='SUPPORTED' for d in dossiers for n in d['metrics']),dfr01SupportedMetrics=4))
    from lib.dfr02_reports import publish_reports
    publish_reports(ROOT,OUT,dossiers,conflicts,rubrics(),inp)
    inp.validate()
    dump(OUT/'input-snapshot.json',dict(contract=CONTRACT,pins=inp.pins))
    files={str(p.relative_to(OUT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(OUT.rglob('*')) if p.is_file() and not p.name.startswith('invalidated-manifest-') and p.name not in ('manifest.json','EXECUTION.json','validation-results.json','boundary-results.json','replay-validation.json','final-review-manifest.json','DFR_02_VALIDATION.md','DFR_02_FINAL_REVIEW.md')}
    dump(OUT/'manifest.json',dict(contract=CONTRACT,classification='RESEARCH_PROVISIONAL',outputs=files))
    dump(OUT/'EXECUTION.json',dict(completedAt=datetime.now(timezone.utc).isoformat(),actor='CHATGPT',independentHumanReviewClaimed=False,authenticatedModelSessionId=None,manifestSha256=hashlib.sha256((OUT/'manifest.json').read_bytes()).hexdigest()))
    print(encode(load(str((OUT/'metric-progress.json').relative_to(ROOT)))))

if __name__=='__main__':
    try:build()
    except Exception:
        # Existing reports remain audit history; a failed build cannot carry a valid publication marker.
        marker=OUT/'manifest.json'
        if marker.exists():marker.rename(OUT/f'invalidated-manifest-{datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")}.json')
        raise
