#!/usr/bin/env python3
"""Build a successor research supplement; never updates runtime/accepted snapshots."""
import hashlib
import json
from pathlib import Path
from decimal import Decimal
from datetime import datetime, timezone
from lib.held_normalization import number, text
from lib.underwriting_remediation import fund_bridge, share_anchor, qualify_dated_denominator, debt_bridge, capex_partition, restricted_pool

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30'
OUT = ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/vn30-underwriting-v2'

def read(p): return json.loads(p.read_text())
def write(p,d):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def source(path,page):
    p=ROOT/path
    return dict(pdfPath=path,sha256=digest(p),physicalPage=page,href=path+'#page='+str(page),productionAdmissible=False)

def build():
    facts=read(OLD/'b6-economics-r3/checked-common-earnings.json')['facts']
    shares={x['ticker']:x for x in read(OUT/'share-anchor-readings.json')}
    acquisition=read(OUT/'acquisition-manifest.json')
    for row in acquisition['rows']:
        if digest(ROOT/row['pdfPath']) != row['sha256']: raise ValueError('ACQUISITION_HASH_MISMATCH')
        for p in row.get('extractedPdfs',[]):
            if digest(ROOT/p['pdfPath']) != p['sha256']: raise ValueError('EXTRACTED_PDF_HASH_MISMATCH')
    for row in shares.values():
        if digest(ROOT/row['pdfPath']) != row['pdfSha256']: raise ValueError('SHARE_SOURCE_HASH_MISMATCH')
        if not row['fullPageImageInspected']: raise ValueError('UNREVIEWED_SHARE_ANCHOR')
    corrections={
      'BSR':dict(status='DERIVED_RESEARCH_BRANCH_SOURCE_CONFLICT_PRESERVED',
        sourceReadings=dict(parentProfitVnd='5213612063223',interimDeductionVnd='4061012360',printedCommonVnd='5230686242758',
          correctedH1ParentCompanyFundVnd='372170100000',h1CommonFundMovementVnd='376701162230',h1Current2026FundVnd='2598136032',
          q3ExplicitAdditionalFY2025CommonFundVnd='374103026199'),
        derived=fund_bridge('5213612063223','4061012360','374103026199',additional_period='FY2025',attribution='PARENT_COMMON'),
        printedSubtotalMinusOwnOperandsVnd='21135191895',q3MinusH1SplitVnd='1',
        supersedes='vn30-lineage-v1 BSR partial fund bridge only; predecessor retained unchanged',
        erratum='Prior parent-company fund 371770100000 was a reading error; source reads 372170100000. No issuer EPS correction inferred.',
        sources=[source('data/manual-download/BSR/BSR_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf',41),source('data/manual-download/BSR/BSR_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.pdf',38),source('data/manual-download/BSR/BSR_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.pdf',44),source('data/manual-download/BSR/2026-11-02-remediation/565592-Q3_2026.pdf',31)]),
      'GVR':dict(status='PUBLISHED_SUBSIDIARY_ALLOCATION_NOT_FULL_GROUP_FINALITY',
        parentBeforeFundVnd='5318551565051',reportedInterimCommonFundVnd='317726455843',
        publishedFY2025SubsidiaryAllocationAttributableParentVnd='606620346513',
        commonAfterPublishedAllocationVnd='4711931218538',incrementalVersusInterimVnd='288893890670',
        parentCompanyFinalAllocationVnd=None,parentPrintedCell='H1_DASH_NOT_ZERO',
        parentCompanyAGMRewardWelfareAllocation=dict(printedValue='30.13',unit='BILLION_VND',displayResolutionVnd='10000000',nominalVnd='30130000000',exactVnd=None,
          scope='PARENT_COMPANY_DISTRIBUTION_PLAN',approvedDate='2026-06-17',fullGroupCompletenessProven=False,
          source=source('data/manual-download/GVR/2026-11-02-remediation/550470-FY2025_FINAL_ALLOCATION.pdf',12)),
        nominalCommonAfterSubsidiaryAndParentPlanVnd='4681801218538',
        nominalBranchQualification='ROUNDED_PARENT_PLAN_NOT_EXACT_IMPLEMENTED_FULL_GROUP_FINALITY',
        q3PriorPeriodCommonFundMovementVnd='445479943882',q3MovementYear='PRIOR_PERIOD_NOT_EXCLUSIVELY_FY2025',
        noDeductionOfGroupNciFromCommon=True,
        sources=[source('data/manual-download/GVR/GVR_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf',90),source('data/manual-download/GVR/GVR_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.pdf',81),source('data/manual-download/GVR/2026-11-02-remediation/565767-Q3_2026.pdf',81)])}
    write(OUT/'fund-bridge-successor.json',dict(contract='vn30-fund-bridge-successor-v1',issuers=corrections,productionAdmissible=False))
    cash_rows=[]
    for t,draw,paid,page in [('HPG','149548990395471','140337963743432',12),('VPL','5628150000000','9230064000000',13)]:
        n=read(OLD/f'b6-comparability-r2/native-inputs/{t}.json')['observations']
        def exact(item,end):
            matches=[o for o in n if o['itemId']==item and o['periodEnd']==end]
            values={o['normalized']['value'] for o in matches}
            if len(values)!=1: raise ValueError('AMBIGUOUS_CASH_DEBT_OPERAND')
            return dict(value=values.pop(),observationIds=[o['id'] for o in matches])
        opening=exact('REPORTED_BORROWINGS','2024-12-31');closing=exact('REPORTED_BORROWINGS','2025-12-31')
        capex=exact('CASH_CAPEX_REPORTED','2025-12-31')
        cash_rows.append(dict(ticker=t,period='FY2025',scope='CONSOLIDATED',currency='VND',
            openingDebt=opening,closingDebt=closing,cashDrawsVnd=draw,cashPrincipalPaidVnd=paid,
            debtBridge=debt_bridge(opening['value'],draw,paid,closing['value']),
            cashCapex=capex,capexPartition=capex_partition(capex['value'],[]),
            financeCashSource=source(f'data/manual-download/{t}/{t}_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf',page),
            workingCapitalNormalizationComplete=False,productionAdmissible=False))
    cash_rows[0]['pledgedTermInvestments']=dict(valueVnd='6809000000000',sourcePrecision='BILLION_VND_AS_PRINTED',pool='HELD_TO_MATURITY_TERM_DEPOSITS',
        totalPoolVnd='21732412761405',unpledgedPoolArithmeticVnd=restricted_pool('21732412761405','6809000000000',pool='TERM_DEPOSITS',restricted_pool_name='TERM_DEPOSITS'),
        unrestrictedCashEquivalentVnd=None,source=source('data/manual-download/HPG/HPG_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf',28),
        caveat='Unpledged is not proof of fully unrestricted liquidity; do not deduct this restriction again from cash equivalents.')
    cash_rows[1]['bondRepurchaseExpense']=dict(valueVnd='1858342000000',cashOrNoncash='UNRESOLVED',automaticAddbackAuthorized=False,
        source=source('data/manual-download/VPL/VPL_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf',47))
    write(OUT/'cash-debt-review.json',dict(contract='vn30-cash-debt-review-v1',issuers=cash_rows,productionAdmissible=False))
    rows=[]
    for fact in sorted(facts,key=lambda x:x['ticker']):
        t=fact['ticker'];native=read(OLD/f'b6-comparability-r2/native-inputs/{t}.json')
        anchor=shares.get(t)
        bridge=None if anchor is None else share_anchor(anchor['issuedCommonShares'],anchor['outstandingCommonShares'],restricted=anchor['restrictedCommonShares'],potential=anchor['potentialDilutionShares'])
        histories=[]
        # Descriptive history only: never substitutes for reviewed common-owner normalization.
        for year in range(2022,2026):
            matches={}
            for item in ('REVENUE','NET_INCOME'):
                candidates=[o for o in native['observations'] if o['itemId']==item and o['periodStart']==f'{year}-01-01' and o['periodEnd']==f'{year}-12-31' and o['reportingScope']=='CONSOLIDATED']
                values={o['normalized']['value'] for o in candidates}
                if len(values)==1:
                    matches[item]=dict(value=values.pop(),observationIds=[o['id'] for o in candidates])
            margin=None
            if len(matches)==2 and number(matches['REVENUE']['value'])>0:
                margin=text(number(matches['NET_INCOME']['value'])/number(matches['REVENUE']['value']))
            histories.append(dict(year=year,operands=matches,reportedGroupNetMargin=margin))
        old_model=ROOT/f'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/held-normalization-v1/issuers/{t}.json'
        prior_model=old_model if old_model.exists() else OLD/f'b6-underwriting-r4/issuers/{t}.json'
        result=dict(contract='vn30-underwriting-supplement-v2',ticker=t,sector=fact['sector'],artifactScope='REVIEW_CANDIDATE',
            sourceCommonEarnings=fact,reportedGroupHistory=histories,
            nativeInputPath=str((OLD/f'b6-comparability-r2/native-inputs/{t}.json').relative_to(ROOT)),nativeInputSha256=digest(OLD/f'b6-comparability-r2/native-inputs/{t}.json'),
            historyQualification='REPORTED_GROUP_NOT_COMMON_OWNER_NOT_NORMALIZED_NO_CYCLE_PROXY_PROMOTED',
            priorEconomicModelReference=str(prior_model.relative_to(ROOT)),priorEconomicModelSha256=digest(prior_model),
            shareAnchor=anchor,shareArithmetic=bridge,
            datedDenominator=qualify_dated_denominator(anchor['asOf'] if anchor else '2026-09-30','2026-10-30',action_coverage=False,price_basis='UNDECLARED',source_bound=anchor is not None),
            successorFundBridge=corrections.get(t),
            acceptedNormalizedCommonEarningsVnd=None,acceptedValuePerShareVnd=None,
            productionAdmissible=False,navAuthority=False,tradingAuthority=False)
        write(OUT/f'issuers/{t}.json',result)
        rows.append(dict(ticker=t,shareAnchorChecked=anchor is not None,ordinaryOutstandingKnown=bool(anchor and anchor['outstandingCommonShares']),
            financialAcceptance='BLOCKED',issuerPath=f'issuers/{t}.json',sha256=digest(OUT/f'issuers/{t}.json')))
    manifest=dict(contract='vn30-underwriting-supplement-manifest-v2',issuerCount=len(rows),shareAnchorsChecked=len(shares),
        retainedAcquisitionDocuments=len(acquisition['rows']),issuers=rows,
        predecessor='vn30-lineage-v1',predecessorSnapshotContentHash='bbb77e64cc4911b0e8809094150db31932b618b7c5c0ae7bfce4cec4f7f9b04c',
        approvedCriteriaOrWeightsChanged=False,productionAdmissible=False,
        components=[dict(path=f,sha256=digest(OUT/f)) for f in ['fund-bridge-successor.json','cash-debt-review.json','share-anchor-readings.json','acquisition-manifest.json']])
    write(OUT/'manifest.json',manifest)
    return manifest

if __name__=='__main__':
    m=build();print(json.dumps({k:m[k] for k in ('issuerCount','shareAnchorsChecked','retainedAcquisitionDocuments')}))
