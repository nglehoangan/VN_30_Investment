"""Actual VIC report-to-RNAV source bridge and guarded proposal, no production writes."""
import hashlib,json
from pathlib import Path
from lib.vic_claim_bridge import number,text
from lib.vic_rnav import held_stake_revaluation,common_rnav_preview,REQUIRED_GROUPS
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-03/vic-rnav-v1'

def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(n,v):(OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')

def build():
    doc=load(OUT/'checked-evidence.json');r={}
    for row in doc['rows']:
        s=row['source'];path=ROOT/s['pdfPath']
        allowed={'data/manual-download/VIC/VIC_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf',
                 'data/manual-download/VIC/2026-11-03-rnav/540899.pdf',
                 'data/manual-download/VIC/2026-11-03-rnav/521784.pdf'}
        if s['pdfPath'] not in allowed:raise ValueError('VIC_SOURCE_SCOPE_REQUIRED')
        page_count=126 if s['pdfPath'].endswith('VIC_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf') else 168 if s['pdfPath'].endswith('540899.pdf') else 2
        if not isinstance(s['physicalPage'],int) or not 1<=s['physicalPage']<=page_count:
            raise ValueError('VALID_PHYSICAL_PAGE_REQUIRED')
        if row['id'] in r:raise ValueError('DUPLICATE_READING')
        if sha(path)!=s['sha256'] or not row['review']['fullPageImageInspected']:raise ValueError('VERIFIED_SOURCE_AND_PAGE_REQUIRED')
        if row['issuer']!='VIC' or row['economicAsOf']!='2025-12-31' or row['productionAdmissible']:
            raise ValueError('VIC_DATED_RESEARCH_ONLY')
        unit='MILLION_VND'
        if row['id'] in ('VIC-RNAV-CASH','VIC-RNAV-DEPOSITS','VIC-RNAV-INVENTORY','VIC-RNAV-IP','VIC-RNAV-CIP','VIC-RNAV-HALONG'):unit='MIXED_DECLARED'
        if row['id'] in ('VIC-RNAV-OTHER-FAIR-CONTEXT','VIC-RNAV-CLAIM-CONTEXT'):unit='NARRATIVE'
        if row['id'] in ('VIC-RNAV-COMMIT-1','VIC-RNAV-COMMIT-2'):unit='BILLION_VND'
        if row['id'].startswith('VIC-RNAV-AR-'):unit='BILLION_VND_ROUNDED'
        if row['unit']!=unit:raise ValueError('EXACT_DECLARED_UNIT_REQUIRED')
        r[row['id']]=row
    v=lambda key:r[key]['values']
    assets=v('VIC-RNAV-BS-ASSETS');debt=v('VIC-RNAV-DEBT');equity=v('VIC-RNAV-EQUITY')
    if number(assets['totalAssets'])-number(debt['totalLiabilities'])!=number(equity['groupEquity']):raise ValueError('ASSET_LIABILITY_EQUITY_IDENTITY_REQUIRED')
    parent=number(equity['groupEquity'])-number(equity['nciBook'])
    vre=v('VIC-RNAV-ASSOCIATES')
    vreDelta=held_stake_revaluation(vre['vreBook'],vre['vreHeldStakeFair'],value_role='FAIR_VALUE_OF_HELD_STAKE')
    cash=v('VIC-RNAV-CASH');deposit=v('VIC-RNAV-DEPOSITS')
    grossCash=sum(number(cash[k]) for k in ['cashMillion'])+number(deposit['shortDepositMillion'])+number(deposit['longDepositMillion'])
    knownRestricted=1000*(number(cash['restrictedCashBillion'])+number(deposit['pledgedShortBillion'])+number(deposit['pledgedLongBillion']))
    cip=v('VIC-RNAV-CIP');namedCip=sum(number(cip[k]) for k in ['universityUrbanProjectMillion','electricVehicleProjectsMillion','vinhomesCityRoyalMillion'])
    adjustments=[dict(group=g,coverageKeys=[g],commonDeltaVnd=None,evidenceIds=[],commonAttributionQualified=False) for g in sorted(REQUIRED_GROUPS)]
    proposal=common_rnav_preview(text(parent*1000000),adjustments,all_coverage_reconciled=False)
    d=dict(contract='vic-rnav-source-closure-v1',ticker='VIC',valuationAsOf='2025-12-31',analysisMode='AS_REVISED_CURRENT_RESEARCH',sourcePolicy='VIC_ISSUED_REPORTS_ONLY_VIETSTOCK_MIRROR',
      bookBridge=dict(groupEquityVnd=text(number(equity['groupEquity'])*1000000),nciBookVnd=text(number(equity['nciBook'])*1000000),parentBookEquityVnd=text(parent*1000000),preferredBookVnd=text(number(equity['preferredBook'])*1000000),treasuryAlreadyDeducted=True,bookNciEqualsEconomicNci=False),
      supportedRevaluations=[dict(asset='VINCOM_RETAIL_HELD_STAKE',source='VIC-RNAV-ASSOCIATES',bookMillion=vre['vreBook'],reportedFairMillion=vre['vreHeldStakeFair'],grossDeltaMillion=vreDelta,afterTaxCommonDeltaVnd=None,ownershipAppliedTwice=False),dict(asset='NOVATECH_PREFERENCE_HELD_STAKE',source='VIC-RNAV-CASH',bookMillion=cash['reportedNovatechPreferredCostMillion'],reportedFairMillion=cash['reportedNovatechPreferredFairMillion'],grossDeltaMillion='0',afterTaxCommonDeltaVnd=None,sourceReportedFairIsIndependentAppraisal=False)],
      partialGroupFairBridgeBeforeUnknownAdjustmentsVnd=text((number(equity['groupEquity'])+number(vreDelta))*1000000),partialGroupFairBridgeIsAcceptedRnav=False,
      bookExposureWithExplicitMissingFairValueVnd=text((number(assets['investmentProperty'])+number(vre['totalBook'])-number(vre['vreBook'])+number(assets['otherInvestmentGross'])-number(assets['otherInvestmentProvision']))*1000000),
      liquidity=dict(grossCashAndDepositsVnd=text(grossCash*1000000),knownRoundedRestrictionsNominalVnd=text(knownRestricted*1000000),nominalRemainderBeforeUnknownMaintenanceVnd=text((grossCash-knownRestricted)*1000000),qualifiedUnrestrictedCashVnd=None,strictBoundClaimed=False,incrementalRnavDeductionInferred=False),
      debtAndObligations=dict(reportedLoansLeasesAndExchangeBondsVnd=text(sum(number(debt[k]) for k in ['shortLoansLeases','longLoansLeases','longExchangeBonds'])*1000000),recognizedProvisionsAlreadyWithinLiabilitiesVnd=text((number(debt['shortProvisions'])+number(debt['longProvisions']))*1000000),incrementalUnbookedObligationVnd=None,commitmentsMechanicallyAddedToDebt=False,guaranteesAssumedZero=False),
      projects=dict(cipBookVnd=text(number(cip['carryingMillion'])*1000000),namedCipBookVnd=text(namedCip*1000000),otherCipBookVnd=text((number(cip['carryingMillion'])-namedCip)*1000000),fullProjectPopulationDisclosed=False,haLongInvestmentBudgetVnd=text(number(v('VIC-RNAV-HALONG')['totalInvestmentBillion'])*1000000000),haLongBudgetIsFairValue=False,qualifiedProjectNpvCount=0,projectCashflowScheduleMissing=True),
      candidateAdjustments=adjustments,proposal=proposal,
      sourceLimitations=['Investment-property fair value explicitly unavailable','Other financial holdings partly lack fair values; VRE is a supported exception','Project costs/areas/budgets and sales backlog do not provide project net cashflow schedules','Maintenance cash, guarantee exposure and overlap with existing liabilities/forecasts unresolved','NCI and preferred economic allocation of valuation changes unresolved','Per-share/current-price valuation needs dated claim and capital-event bridge'],
      acceptedRnavVnd=None,acceptedCommonEquityValueVnd=None,acceptedValuePerShareVnd=None,financialAcceptance='BLOCKED_MATERIAL_ECONOMIC_INPUTS',externalVinFastReportRequired=False,criteriaOrWeightsChanged=False,productionAuthority=False,navAuthority=False,tradingAuthority=False)
    write('decision.json',d)
    pins=[OUT/n for n in ['checked-evidence.json','acquisition-manifest.json','decision.json','REPORT.md','closure-matrix.json','validation.json','vic-input-request.json'] if (OUT/n).exists()]
    pins += [Path(__file__).resolve(),ROOT/'scripts/lib/vic_rnav.py']
    discovery=ROOT/'data/manual-extracted-api/vietstock-documents-v1/20261103-vic-rnav'
    pins+=sorted(discovery.glob('*.json'))
    write('manifest.json',dict(contract='vic-rnav-manifest-v1',pins={str(p.relative_to(ROOT)):sha(p) for p in pins},sourcePins={x['source']['pdfPath']:x['source']['sha256'] for x in r.values()}))
    return d
if __name__=='__main__':build()
