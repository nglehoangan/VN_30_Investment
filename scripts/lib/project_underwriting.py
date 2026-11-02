"""Project/SOTP research arithmetic. No production admission or scoring authority."""
from decimal import Decimal, localcontext
from datetime import date
from .held_normalization import number, text


def project_rnav(project):
    required=['id','asOf','scope','ownership','discount','cashFlows','debt','interestIncluded','legalEvidence','sourceReferences']
    if any(project.get(k) is None for k in required): raise ValueError('PROJECT_INPUTS_INCOMPLETE')
    date.fromisoformat(project['asOf'])
    if project['scope']!='PROJECT_100_PERCENT' or not project['legalEvidence'] or not project['sourceReferences']:
        raise ValueError('PROJECT_SCOPE_LEGAL_SOURCE_REQUIRED')
    own, rate, debt=map(number,(project['ownership'],project['discount'],project['debt']))
    if not 0<own<=1 or rate<=0 or debt<0 or project['interestIncluded'] is not False:
        raise ValueError('UNLEVERED_PROJECT_OWNERSHIP_DISCOUNT_DEBT_REQUIRED')
    if not project['cashFlows']:raise ValueError('PROJECT_CASH_SCHEDULE_REQUIRED')
    seen=set();pv=Decimal(0)
    with localcontext() as ctx:
        ctx.prec=50
        for c in project['cashFlows']:
            if c['id'] in seen:raise ValueError('DUPLICATE_PROJECT_CASH_FLOW')
            seen.add(c['id'])
            if type(c['year']) is not int or c['year']<1 or c['afterTaxUnlevered'] is not True:
                raise ValueError('DATED_AFTER_TAX_UNLEVERED_CASH_REQUIRED')
            # Signed future net cash; sunk inventory cost is not deducted again.
            pv+=number(c['value'])/(1+rate)**c['year']
        return dict(projectEnterpriseValue=text(pv),attributableEquityValue=text((pv-debt)*own),productionAdmissible=False)


def segment_reconcile(segments,unallocated,total):
    if len({s['id'] for s in segments})!=len(segments):raise ValueError('DUPLICATE_SEGMENT')
    for s in segments:
        if s['asOf']!=total['asOf'] or s['scope']!=total['scope']:raise ValueError('SEGMENT_PERIOD_SCOPE_MISMATCH')
    if unallocated['asOf']!=total['asOf'] or unallocated['scope']!=total['scope']:
        raise ValueError('UNALLOCATED_PERIOD_SCOPE_MISMATCH')
    results={}
    for k in ('revenue','reportedSegmentProfit','assets','liabilities'):
        values=[s.get(k) for s in segments]+[unallocated.get(k),total.get(k)]
        if any(v is None for v in values):results[k]=None;continue
        delta=sum((number(s[k]) for s in segments),Decimal(0))+number(unallocated[k])-number(total[k])
        if delta!=0:raise ValueError('SEGMENT_RECONCILIATION_MISMATCH:'+k)
        results[k]=text(delta)
    return dict(differences=results,hotelEbitda=None,acceptedSotp=None,productionAdmissible=False)


def sotp(components,corporate_claims):
    if not components or len({c['id'] for c in components})!=len(components):raise ValueError('UNIQUE_SOTP_COMPONENTS_REQUIRED')
    as_of=components[0].get('asOf')
    if as_of is None:raise ValueError('COMMON_SOTP_CUTOFF_REQUIRED')
    date.fromisoformat(as_of)
    if any(c.get('asOf')!=as_of for c in components+corporate_claims):raise ValueError('SOTP_CUTOFF_MISMATCH')
    keys=set();value=Decimal(0)
    for c in components:
        if c['basis']!='ATTRIBUTABLE_COMMON_EQUITY' or c['value'] is None or not c['sourceReferences']:
            raise ValueError('ATTRIBUTABLE_COMPONENT_EQUITY_REQUIRED')
        value+=number(c['value'])
        for key in c['consumedClaimIds']:
            if key in keys:raise ValueError('DUPLICATE_CLAIM')
            keys.add(key)
    for c in corporate_claims:
        if c['id'] in keys:raise ValueError('DEBT_OR_NCI_ALREADY_INCLUDED_IN_COMPONENT')
        if c['value'] is None or not c['sourceReferences']:raise ValueError('UNALLOCATED_CLAIM_UNQUALIFIED')
        keys.add(c['id']);value+=number(c['value'])
    return dict(conditionalEquityValue=text(value),acceptedValuePerShare=None,productionAdmissible=False)
