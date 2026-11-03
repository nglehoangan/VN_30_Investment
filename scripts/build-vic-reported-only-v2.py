"""VIC-only alternative method disposition; not a financial acceptance waiver."""
import hashlib
import json
from pathlib import Path
from lib.vic_claim_bridge import number,text
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-03/vic-reported-only-v2'
PDF='data/manual-download/VIC/VIC_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf'
HASH='5ed3c75eb96aa1292f9b15a34419d658de13cc93300fcd878edaeb93bd347217'

def calculate(doc):
    rows={r['id']:r for r in doc['rows']}
    if len(rows)!=len(doc['rows']):raise ValueError('DUPLICATE_SOURCE_READING')
    if hashlib.sha256((ROOT/PDF).read_bytes()).hexdigest()!=HASH:raise ValueError('VIC_SOURCE_BYTES_CHANGED')
    for r in rows.values():
        if r['source']['pdfPath']!=PDF or r['source']['sha256']!=HASH or not r['review']['fullPageImageInspected']:
            raise ValueError('ONLY_CHECKED_VIC_REPORT_REQUIRED')
        expected='BILLION_VND' if r['id'] in ('VIC-G25-NOVATECH','VIC-G25-OTHER-SALES') else 'SHARES' if r['id']=='VIC25-SHARES' else 'MIXED_DECLARED' if r['id']=='VIC25-EPS' else 'NARRATIVE' if r['id']=='VIC25-SEGMENT-POLICY' else 'MILLION_VND'
        if r['unit']!=expected:raise ValueError('EXACT_SOURCE_UNIT_REQUIRED')
    v=lambda id:rows[id]['values']
    book=v('VIC25-SEGMENT-BOOK');groups=['property','hotel','health','education','manufacturing','other']
    assets=sum(number(book[g+'Assets']) for g in groups)+number(book['assetElimination'])
    liabilities=sum(number(book[g+'Liabilities']) for g in groups)+number(book['liabilityElimination'])
    if assets!=number(book['allocatedAssets']) or liabilities!=number(book['allocatedLiabilities']):raise ValueError('SEGMENT_BOOK_IDENTITY_REQUIRED')
    total_assets=assets+number(book['unallocatedAssets']);total_liabilities=liabilities+number(book['unallocatedLiabilities'])
    pbt=number(v('VIC-G25-PNL')['pbt'])*1000000
    excluded=number(v('VIC-G25-SPONSOR')['sponsorIncome'])*1000000+number(v('VIC-G25-NOVATECH')['pnlGain'])*1000000000
    return dict(contract='vic-reported-only-method-disposition-v2',ticker='VIC',period='FY2025',
      scope='VIC_CONSOLIDATED',sourcePolicy='ONLY_VIC_REPORTS',
      ownerDirection='Do not require additional VinFast reports; use VIC disclosures and assess alternative methods',
      reportedEvidenceReview='PASS_RECONCILED_AS_REPORTED_ONLY',
      earningsMethod=dict(disposition='EXCLUDE_PE_AND_EPS_BASED_VALUATION',
        reason='Reported earnings include identified large gains; no reliable normalized common numerator from VIC-only disclosures. Exclusion is a model choice, not proof of zero profit.',
        assumedNormalizedProfitVnd=None,assumedTaxRate=None,assumedNciWeight=None,
        reportedGroupPbtVnd=text(pbt),diagnosticAfterSponsorNovatechVnd=text(pbt-excluded),
        diagnosticIsNormalizedCommonEarnings=False),
      alternativeMethod=dict(name='SEGMENT_REPORTED_BOOK_CROSSCHECK',
        groupAssetsVnd=text(total_assets*1000000),groupLiabilitiesVnd=text(total_liabilities*1000000),
        groupBookNetAssetsVnd=text((total_assets-total_liabilities)*1000000),
        segmentBookNetAssetsVnd={g:text((number(book[g+'Assets'])-number(book[g+'Liabilities']))*1000000) for g in groups},
        centralBookNetAssetsVnd=text((number(book['unallocatedAssets'])-number(book['unallocatedLiabilities']))*1000000),
        includesNci=True,includesPreferredClaims=True,bookValuesAreFairValues=False,
        acceptedRnavVnd=None,acceptedCommonEquityValueVnd=None,acceptedValuePerShareVnd=None,
        remainingRequirements=['VIC-disclosed asset/project valuation inputs and value adjustments','Qualified cash, debt, contingent and intercompany obligations','Common/preferred/NCI claim allocation at valuation date','Capital-event and price-date bridge before per-share valuation']),
      externalVinFastDocumentRequestPending=False,priorExternalRequestDisposition='SUPERSEDED_BY_OWNER_VIC_ONLY_SCOPE',
      criteriaAndWeightsChanged=False,financialAcceptance='NOT_GRANTED',
      acceptedNormalizedCommonEarningsVnd=None,acceptedNormalizedEps=None,
      productionAuthority=False,navAuthority=False,tradingAuthority=False,
      result='VIC_ONLY_REPORTED_ANALYSIS_COMPLETED_EARNINGS_MULTIPLE_EXCLUDED_VALUATION_NOT_ACCEPTED')

def build():
    d=calculate(json.loads((OUT/'inputs.json').read_text()))
    (OUT/'decision.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
    paths=[OUT/'inputs.json',OUT/'decision.json',Path(__file__).resolve()]+[OUT/p for p in ['REPORT.md','validation.json'] if (OUT/p).exists()]
    (OUT/'manifest.json').write_text(json.dumps(dict(contract='vic-reported-only-manifest-v2',pins={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths},sourcePins={PDF:HASH}),indent=2)+'\n')
    return d
if __name__=='__main__':build()
