"""Checked issuer bridges; source columns and original vintages remain distinct."""
from pathlib import Path
from decimal import Decimal
import json,hashlib,datetime
BASE=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30')
R=BASE/'b6-comparability-r2';R.mkdir(exist_ok=True)
def load(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def save(name,value):(R/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
at=datetime.datetime.now(datetime.timezone.utc).isoformat()
prior=load(BASE/'b6-close-inputs-r1/native-review-sources.json')
save('analysis-scope-policy.json',dict(version='owner-analysis-scope-20261030-v2',ownerInstruction='VPL: hãy phân tích từ năm2023',scopeByTicker={'VPL':dict(firstPeriodStart='2023-01-01',firstAnnualYear=2023,priorComparatives='RETAIN_FOR_AUDIT_NOT_REQUIRED_OR_USED_IN_ANALYSIS')},listingDateAsserted=False,sourceDeletionAuthorized=False,scoringAdmissionChanged=False))
# VHM Note41 physical112. Only non-overlapping net captions are summed; gross/accumulated detail is excluded.
vhm_changes=[('cash',-107430),('cash-equivalents',-769034),('short-held-to-maturity',14133024),('other-short-investments',1957290),('short-trade-receivables',-532068),('short-loan-receivables',-4404937),('other-short-receivables',-9355914),('other-current-assets',876464),('long-loan-receivables',-6001345),('other-long-receivables',-24890210),('tangible-fixed-assets-net',-8304255),('investment-property-net',8684105),('other-equity-investments',29442768),('long-held-to-maturity',6017472),('long-prepaid-costs',101114)]
vhm_liab=[('dividends-payable',6222),('employee-payables',639646),('short-accruals',-639647),('other-short-payables',2824307)]
vhm_map=dict(vhm_changes)
bridges=[]
def bridge(t,item,original,restated,adjustments,unit,annual_page,opening_page,note_page,explanation):
    annual=f'data/manual-download/{t}/{t}_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf'
    interim=f'data/manual-download/{t}/{t}_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.pdf'
    total=sum(Decimal(str(v)) for _,v in adjustments);assert Decimal(original)+total==Decimal(restated),(t,item)
    scale='1000000' if unit=='MILLION_CURRENCY' else '1'
    prior_rows=[o for o in prior['observations'] if o['ticker']==t and o['itemId']==item and o['periodEnd']=='2025-12-31'];assert prior_rows
    assert all(Decimal(o['normalized']['value'])==Decimal(restated)*Decimal(scale) for o in prior_rows)
    p=dict(id=f'issuer-bridge-{t}-{item}-FY2025',ticker=t,itemId=item,periodEnd='2025-12-31',scope='CONSOLIDATED',currency='VND',declaredUnit=unit,multiplier=scale,originalValue=original,restatedValue=restated,
     adjustmentOperands=[dict(captionKey=k,signedValue=str(v)) for k,v in adjustments],adjustmentTotal=str(total),
     originalEvidence=dict(pdfPath=annual,sourceHash=sha(annual),page=annual_page,column='FY2025_ORIGINAL_CLOSING_31_12_2025'),
     restatedEvidence=dict(pdfPath=interim,sourceHash=sha(interim),page=opening_page,column='H12026_RECLASSIFIED_OPENING' if t!='FPT' else 'EXPLICIT_31_12_2025_RESTATED'),
     bridgeEvidence=dict(pdfPath=interim,sourceHash=sha(interim),page=note_page,method='CHATGPT_FULL_PAGE_IMAGE_REVIEW',reviewedAt=at),
     periodBinding=dict(originalClosingDate='2025-12-31',sourceOpeningDate='2026-01-01' if t!='FPT' else None,sourceDocumentPeriodStart='2026-01-01',sourceDocumentPeriodEnd='2026-06-30',basis='Issuer corresponding-figures reconciliation to FY2025 audited closing; annual fiscal year Jan1-Dec31; source opening and original closing stay separate linked variants',evidencePages=[15,16] if t=='BSR' else [24,26,112] if t=='VHM' else [18,60],verified=True),
     explanation=explanation,priorObservationIds=[o['id'] for o in prior_rows],preserveOriginal=True,amountEqualityUsedToCreateMapping=False,productionAdmissible=False)
    bridges.append(p)
bridge('BSR','CASH_AND_EQUIVALENTS','7625822768599','7663008773244',[('cash-equivalents-reclassification',37186004645)],'CURRENCY',9,9,16,'Note15/16 explicitly relates corresponding financial-position data to audited FY2025; add disclosed reclassification37186004645. No source opening date overwritten.')
bridge('BSR','RECEIVABLES','13539339764397','13270042757120',[('other-short-receivables-reclassification',-269297007277)],'CURRENCY',9,9,16,'Net short receivables caption; Note16 total/caption/adjustment checked, not mapped by matching amount.')
bridge('VHM','CASH_AND_EQUIVALENTS','49961891','49085427',vhm_changes[:2],'MILLION_CURRENCY',14,14,112,'Sum cash and cash-equivalent adjustments only; no investment/deposit substitution.')
bridge('VHM','RECEIVABLES','219949950','205657031',[(k,vhm_map[k]) for k in ['short-trade-receivables','short-loan-receivables','other-short-receivables']],'MILLION_CURRENCY',14,14,112,'Net short receivable total; advance-to-supplier/provision unchanged; loan moved to investment caption.')
bridge('VHM','CURRENT_ASSETS','496890087','498687482',vhm_changes[:8],'MILLION_CURRENCY',14,14,112,'Sum each non-overlapping changed current-asset caption once.')
bridge('VHM','TOTAL_ASSETS','787857267','794704311',vhm_changes,'MILLION_CURRENCY',15,15,112,'Sum non-overlapping net captions; never sum gross fixed-assets/accumulated depreciation again. Million rounding preserved as printed.')
bridge('VHM','CURRENT_LIABILITIES','343090159','345920687',vhm_liab,'MILLION_CURRENCY',16,16,112,'Note41 adjustments include employee639646 and accrual-639647 as printed; retain one-million rounding difference instead of silently cancelling.')
bridge('FPT','RECEIVABLES','14402017450105','14008456702890',[('short-loan-receivables',-9195910819),('other-short-receivables',-386961959844),('allowance-contra-reclassification',2597123448)],'CURRENCY',8,8,60,'Note39 gives original/restated31Dec2025 and adjustment. Allowance reduction increases net receivables; signed contra effect positive. This classification bridge is distinct from FTEL scope change.')
save('issuer-comparability-bridges.json',dict(contract='checked-issuer-comparability-bridges-v1',reviewedAt=at,reviewer='CHATGPT_OWNER_AUTHORIZED',bridges=bridges,productionAdmissible=False))
facts=[]
for b in bridges:
    if b['ticker']=='FPT':continue # already source-bound previously; expose its accounting bridge without replacing that observation.
    ev=b['restatedEvidence'];value=format(Decimal(b['restatedValue'])*Decimal(b['multiplier']),'f')
    facts.append(dict(id='checked-'+b['id'],ticker=b['ticker'],itemId=b['itemId'],value=value,rawValue=b['restatedValue'],rawUnit=b['declaredUnit'],multiplier=b['multiplier'],unit='CURRENCY',currency='VND',period=dict(start=b['periodEnd'],end=b['periodEnd']),reportingScope='CONSOLIDATED',sourcePdfPath=ev['pdfPath'],sourceHash=ev['sourceHash'],page=ev['page'],captionAndColumn=ev['column']+'; explicit reconciliation to FY2025 audited closing; original and opening variants retained',method='DIRECT_IMAGE_AND_CHECKED_ISSUER_PERIOD_BRIDGE',reviewedAt=at,priorObservationIds=b['priorObservationIds'],comparison='MATCH',periodBridgeId=b['id'],periodBridgeReference=str(R/'issuer-comparability-bridges.json'),periodBridgeHash=sha(R/'issuer-comparability-bridges.json'),productionAdmissible=False))
save('checked-period-bridge-sources.json',dict(facts=facts))
# FPT p18 is an issuer-provided same-accounting-method comparison, not our estimate of FTEL removal.
interim='data/manual-download/FPT/FPT_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.pdf'
rows=[('REVENUE','32682853982527','23325685794923','26268500667974','CURRENCY'),('NET_INCOME','5335828880987','4427462420799','5047128933102','CURRENCY'),('NET_INCOME_ATTRIBUTABLE_PARENT','4431763974648','4431763974648','5054958601533','CURRENCY'),('BASIC_EPS','2613','2613','2967','CURRENCY_PER_SHARE')]
comparatives=[]
for item,original,comparable,current,unit in rows:
    comps=[o for o in prior['observations'] if o['ticker']=='FPT' and o['itemId']==item and o['periodEnd']=='2026-06-30'];assert len(comps)==1 and comps[0]['normalized']['value']==current
    comparatives.append(dict(id='FPT-H12025-SAME-METHOD-'+item,ticker='FPT',itemId=item,value=comparable,rawValue=comparable,rawUnit=unit,multiplier='1',unit=unit,currency='VND',period=dict(start='2025-01-01',end='2025-06-30'),reportingScope='CONSOLIDATED',sourcePdfPath=interim,sourceHash=sha(interim),page=18,captionAndColumn='H12025 no FTEL subsidiary full consolidation; issuer-presented same equity-accounting method asH12026',method='ISSUER_EXPLICIT_COMPARABLE_COLUMN_FULL_IMAGE_REVIEW',reviewedAt=at,previousOriginalComparative=original,currentValue=current,currentObservationId=comps[0]['id'],scopeBasis='FTEL_EQUITY_METHOD_BOTH_PERIODS',organicGrowthAsserted=False,annualTTMComparable=False,productionAdmissible=False))
save('fpt-same-method-comparatives.json',dict(contract='fpt-issuer-same-method-comparatives-v1',facts=comparatives,sourcePages=[12,17,18,60],fullYear2025SameMethodProvided=False,cashflowSameMethodProvided=False,ttmAvailable=False,scopeChangeResolvedFor='H12026_VS_H12025_FOUR_ISSUER_REPORTED_ITEMS_ONLY',fiscal2025ReceivablesBridge='issuer-bridge-FPT-RECEIVABLES-FY2025'))
print(json.dumps(dict(issuerBridges=len(bridges),oldSourceGapsBridged=len(facts),fptAdditionalComparatives=len(comparatives))))
