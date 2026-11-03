"""Replay the owner PDF and VIC cross-checks; stop explicitly at external evidence gaps."""
import hashlib
import json
from pathlib import Path
from lib.vic_claim_bridge import number,text
from lib.vic_owner_report import license_claims,donor_bridge,tax_gap,closing_common,replay_eps,segment_bridge
from lib.vic_event_admission import validate_event
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-03'
OUT=BASE/'vic-owner-report-closure-v1'

def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')

def checked():
    doc=load(OUT/'checked-evidence.json');rows={}
    for row in doc['rows']:
        if row['id'] in rows:raise ValueError('DUPLICATE_EVIDENCE_ID')
        s=row['source'];p=ROOT/s['pdfPath']
        if sha(p)!=s['sha256'] or not p.read_bytes().startswith(b'%PDF-'):raise ValueError('SOURCE_BYTES_CHANGED')
        if not isinstance(s['physicalPage'],int) or s['physicalPage']<1 or not row['review']['fullPageImageInspected']:
            raise ValueError('CHECKED_FULL_PAGE_REQUIRED')
        if row['framework']!='VAS' or row['productionAdmissible']:raise ValueError('NATIVE_RESEARCH_SCOPE_REQUIRED')
        prefix=row['id'].split('-')[0]
        expected_scope='VINFAST_JSC_STANDALONE' if prefix=='VF25' else 'VIC_CONSOLIDATED'
        expected_period={'VF25':'FY2025','VIC25':'FY2025','VIC24':'FY2024_COMPARATIVE_IN_FY2025','VIC26':'H1_2026'}[prefix]
        if row['scope']!=expected_scope or row['period']!=expected_period:
            raise ValueError('EXACT_ISSUER_SCOPE_PERIOD_REQUIRED')
        unit='MILLION_VND'
        if row['id'] in ('VF25-AUDIT','VIC25-ANTIDILUTION','VIC25-SEGMENT-POLICY','VIC26-EPS-CONTEXT'):unit='NARRATIVE'
        if row['id'] in ('VF25-NOVATECH','VF25-TAX'):unit='BILLION_VND'
        if row['id'] in ('VF25-SHARES','VF25-PREF','VIC25-SHARES'):unit='SHARES'
        if row['id'] in ('VF25-TAX-DTA','VIC25-EPS'):unit='MIXED_DECLARED'
        if row['unit']!=unit:raise ValueError('EXACT_DECLARED_UNIT_REQUIRED')
        expected_path='data/manual-download/VIC/2026-11-03-owner-vinfast/VinFast_JSC_FY2025_Audited_Standalone.pdf'
        if prefix in ('VIC25','VIC24'):expected_path='data/manual-download/VIC/VIC_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf'
        if prefix=='VIC26':expected_path='data/manual-download/VIC/VIC_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.pdf'
        if s['pdfPath']!=expected_path:raise ValueError('EXACT_LEGAL_ENTITY_SOURCE_REQUIRED')
        rows[row['id']]=row
    receipt=load(OUT/'source-receipt.json')
    if sha(ROOT/receipt['retainedPath'])!=receipt['sha256']:raise ValueError('OWNER_RECEIPT_PIN_REQUIRED')
    return rows

def build():
    r=checked();v=lambda k:r[k]['values']
    old=load(BASE/'vic-parent-bridge-v1/decision.json')
    oldr=load(BASE/'vic-parent-bridge-v1/checked-evidence.json')
    groupgrant=next(x for x in oldr['rows'] if x['id']=='VIC-G25-SPONSOR')
    if sha(ROOT/groupgrant['source']['pdfPath'])!=groupgrant['source']['sha256']:raise ValueError('PRIOR_GROUP_SOURCE_DRIFT')
    vf=v('VF25-PNL');grant=v('VF25-SPONSOR');donor=v('VF25-DONOR');cash=v('VF25-SETTLEMENT')
    eps=replay_eps(v('VIC25-EPS'));external=closing_common(v('VIC25-SHARES'))
    h=v('VIC26-EPS')
    if number(h['parentNpat'])-sum(number(h[k]) for k in ['cumulativePreferredDeduction','restrictedIncome','preferredRepurchaseExcess'])!=number(h['basicNumerator']):raise ValueError('H126_COMMON_CLAIM_IDENTITY_REQUIRED')
    if number(h['basicNumerator'])-number(h['dilutionNumeratorAdjustment'])!=number(h['dilutedNumerator']):raise ValueError('H126_DILUTION_NUMERATOR_REQUIRED')
    components=[]
    for src in load(BASE/'vic-official-closure-v1/decision.json')['events']:
        row=src['proposal'].copy()
        row['timeBindingKind']='ANNUAL_COMPONENT_AGGREGATE'
        row['attributionBasis']='DIRECT_REPORTED_COMMON_NCI_AMOUNTS'
        if row['eventId']=='VIC-NOVATECH-GAIN-FY2025':
            row['legalEntity']='VINFAST_AUTO_LTD_SINGAPORE'
        # Sponsor amount remains group total, not a single JSC event: do not forge entity/date.
        components.append(dict(proposal=row,validation=validate_event(row,{})))
    result=dict(contract='vic-owner-pdf-acceptance-progress-v1',ticker='VIC',period='FY2025',
      analysisMode='AS_REVISED_CURRENT_RESEARCH_NOT_HISTORICAL_AS_KNOWN',
      grantBridge=donor_bridge(grant['sponsorIncome'],donor['chairmanCashSponsor'],cash['otherRelatedSponsor'],groupgrant['values']['sponsorIncome']),
      licenseBridge=license_claims(cash),taxReading=tax_gap(vf['pbt'],vf['npat'],vf['currentTaxRaw']),
      equityReplayMillionVnd=text(number(v('VF25-EQUITY')['openEquity'])+number(v('VF25-EQUITY')['capitalIncrease'])+number(v('VF25-EQUITY')['demergerEquityChange'])+number(v('VF25-EQUITY')['loss'])),
      preferenceShareCountReplay=text(sum(number(v('VF25-PREF')['series'+str(i)]) for i in range(1,6))),
      restrictedCash=dict(asOf='2025-12-31',blockedBankCashMillionVnd=v('VF25-RESTRICTED-CASH')['blockedBankCash'],pledgedTermDepositMillionVnd=v('VF25-RESTRICTED-CASH')['pledgedTermDeposit'],sourceScope='VINFAST_JSC_STANDALONE',incrementalDeductionFromVicCashPermitted=False),
      shareAndEps=dict(asOf='2025-12-31',externalCommonShares=external,preferredShares=v('VIC25-SHARES')['preferred'],**eps,currentValuationAsOf=None,currentPriceBinding=None,currentPricePerShareAcceptance=False),
      segmentReplay=segment_bridge(v('VIC25-SEGMENTS')),
      h126CommonClaims=dict(basicNumeratorMillionVnd=h['basicNumerator'],dilutedNumeratorMillionVnd=h['dilutedNumerator'],annualizedOrBackdated=False,claimsAssignedToVinFast=False),
      priorSharedJscWeightScenariosStatus='HISTORICAL_STRESS_ONLY_NOT_VALID_ENTITY_MATCHED_BASE',
      reason='Novatech seller identified as Singapore. JSC year-end 50.60% cannot be bound to Singapore disposal or prove event allocation.',
      actualEventProposals=components,
      namedComponentSensitivity=old['unconditionalNamedComponentsEnvelope'],
      sensitivityIsCompleteFinancialBound=False,
      primaryVICOnlyDiagnostic=load(BASE/'vic-only-normalization-v1/decision.json')['primaryDiagnostic'],
      productionAuthorized=False,navAuthorized=False,tradingAuthorized=False,ledgerPostingExecuted=False,
      criteriaOrWeightsChanged=False,selectedAcceptedNormalizedCommonEarningsVnd=None,selectedAcceptedEps=None,
      finalDecision='BLOCKED_EXTERNAL_EVENT_CONSOLIDATION_AND_CLAIM_EVIDENCE',
      ownerDocumentRequestPending=True)
    result['namedComponentSensitivity']=dict(result['namedComponentSensitivity'],notAnUnconditionalAcceptedEconomicBound=True)
    if result['equityReplayMillionVnd']!=v('VF25-EQUITY')['closeEquity'] or result['preferenceShareCountReplay']!=v('VF25-PREF')['total']:
        raise ValueError('ACTUAL_OWNER_EQUITY_PREFERENCE_REPLAY_REQUIRED')
    write(OUT/'decision.json',result)
    evidenceInputs=[OUT/'checked-evidence.json',OUT/'source-receipt.json',BASE/'vic-parent-bridge-v1/decision.json',BASE/'vic-parent-bridge-v1/checked-evidence.json',BASE/'vic-official-closure-v1/decision.json',BASE/'vic-only-normalization-v1/decision.json',Path(__file__).resolve(),ROOT/'scripts/lib/vic_owner_report.py',ROOT/'scripts/lib/vic_event_admission.py',ROOT/'scripts/lib/vic_claim_bridge.py']
    outputs=[OUT/'decision.json']+[OUT/n for n in ['REPORT.md','issue-register.json','external-document-request.json','validation.json','source-search-inventory.json'] if (OUT/n).exists()]
    write(OUT/'manifest.json',dict(contract='vic-owner-report-closure-pins-v1',pins={str(p.relative_to(ROOT)):sha(p) for p in evidenceInputs+outputs},sourcePins={x['source']['pdfPath']:x['source']['sha256'] for x in r.values()},financialValueAccepted=False))
    return result
if __name__=='__main__':build()
