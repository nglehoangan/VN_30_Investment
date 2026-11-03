"""Owner-directed VIC-only analytical route; no subsidiary source dependency."""
import hashlib
import json
from pathlib import Path
from lib.vic_claim_bridge import exclusions, number, text
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-03'
OUT=BASE/'vic-only-normalization-v1'
PRIOR=BASE/'vic-parent-bridge-v1'

def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def calculate(d,readings):
    rows={r['id']:r for r in readings['rows']}
    required=['VIC-G25-PNL','VIC-G25-SPONSOR','VIC-G25-NOVATECH','VIC-G25-OTHER-SALES']
    for key in required:
        r=rows[key]
        if r['ticker']!='VIC' or r['sourceScope']!='CONSOLIDATED' or r['economicPeriod']!='FY2025':
            raise ValueError('VIC_FY2025_CONSOLIDATED_REQUIRED')
        p=ROOT/r['source']['pdfPath']
        if not str(p.relative_to(ROOT)).startswith('data/manual-download/VIC/') or sha(p)!=r['source']['sha256']:
            raise ValueError('VIC_SOURCE_PIN_REQUIRED')
    pbt=text(number(rows['VIC-G25-PNL']['values']['pbt'])*1000000)
    components=d['components']
    expected=[('VIC-SPONSOR-FY2025','VIC-G25-SPONSOR','sponsorIncome'),
              ('VIC-NOVATECH-GAIN-FY2025','VIC-G25-NOVATECH','pnlGain'),
              ('VIC-MOVIAN-GAIN-FY2025','VIC-G25-OTHER-SALES','movianGain')]
    if len(components)!=len(expected):raise ValueError('EXACT_COMPONENT_SET_REQUIRED')
    for c,(event,eid,key) in zip(components,expected):
        r=rows[eid]
        if (c['eventId']!=event or c['evidenceId']!=eid or c['sourceHash']!=r['source']['sha256']
                or number(c['amountVnd'])!=number(r['values'][key])*number(r['multiplier'])):
            raise ValueError('COMPONENT_SOURCE_VALUE_BINDING_REQUIRED')
    result=exclusions(pbt,components[:2])
    extra=exclusions(pbt,components)
    return dict(contract='vic-only-normalization-research-v1',ticker='VIC',period='FY2025',
      ownerDirection='Use VIC reports only; no further VinFast report request for this research route',
      externalResearchEvidenceRetainedAsHistory=True,externalFindingsUsedInCalculation=False,
      sourceIds=required,sourcePins={rows[k]['source']['pdfPath']:rows[k]['source']['sha256'] for k in required},
      reportedGroupPbtVnd=pbt,excludedComponents=components,
      primaryDiagnostic=dict(valueVnd=result,metric='CONSOLIDATED_PRETAX_PROFIT_AFTER_NAMED_EXCLUSIONS',
        selectionReason='Remove identified sponsor and Novatech gains without estimating tax or parent/NCI. Preserve reported expenses; no unsupported positive addback.',
        acceptedAsNormalizedCommonEarnings=False,completeRecurringProfit=False),
      additionalMovianExclusionDiagnosticVnd=extra,
      unexcludedDisposalGainRemainderNominalVnd=d['unexcludedDisposalGainRemainderNominalVnd'],
      remainingDisposalGainIsProvenRecurring=False,
      parentCommonSensitivity=d['conditionalCases'],
      parentCommonSensitivityIsBaseEstimate=False,
      openTaxAndAttributionTreatment='Unknown; not zero, not automatically 20%, not waived. No further external-report dependency for group pretax diagnostic.',
      selectedAcceptedNormalizedCommonEarningsVnd=None,selectedAcceptedEps=None,
      researchRouteStatus='COMPLETED_VIC_ONLY_DIAGNOSTIC',financialAcceptance='NOT_GRANTED',
      financialAcceptanceDependencies=['VIC-disclosed event tax and common/NCI attribution, or a defensible quantified uncertainty sufficient for acceptance',
        'Remaining disposal recurrence, subsidiary fund completeness, cycle and share denominator review'],
      ownerEvidenceRequestPending=False,requiresNewVinFastReportToRunThisRoute=False,
      valuationRoute='Prefer VIC-disclosed asset/segment cash-flow and debt evidence for subsequent NAV/RNAV research; no automatic valuation from this pretax diagnostic',
      productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False,ledgerPostingExecuted=False,criteriaOrWeightsChanged=False)

def build():
    OUT.mkdir(exist_ok=True)
    d=calculate(load(PRIOR/'decision.json'),load(PRIOR/'checked-evidence.json'))
    (OUT/'decision.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
    pins=[PRIOR/'decision.json',PRIOR/'checked-evidence.json',Path(__file__).resolve()]
    (OUT/'manifest.json').write_text(json.dumps(dict(contract='vic-only-normalization-pins-v1',pins={str(p.relative_to(ROOT)):sha(p) for p in pins},decisionSha256=sha(OUT/'decision.json')),indent=2)+'\n')
    return d
if __name__=='__main__':build()
