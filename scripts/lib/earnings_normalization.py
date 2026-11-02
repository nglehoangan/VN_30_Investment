"""Source-bound common earnings research; unknown incidence is never silently factual."""
from decimal import Decimal, localcontext
from itertools import product
from .held_normalization import number, text


def tax_profile(pbt,net_income):
    p,n=map(number,(pbt,net_income))
    if p==0:return dict(reportedTaxVnd=text(p-n),reportedEffectiveRate=None,marginalTaxQualified=False)
    rate=(p-n)/p
    return dict(reportedTaxVnd=text(p-n),reportedEffectiveRate=format(rate,'f'),
                marginalTaxQualified=False,negativeTaxBenefit=rate<0,rateOutsideZeroOne=not 0<=rate<=1)


def attributed_delta(pretax,tax,common_weight):
    d,t,w=map(number,(pretax,tax,common_weight))
    if not 0<=t<=1 or not 0<=w<=1:raise ValueError('SUPPORTED_MARGINAL_TAX_AND_COMMON_WEIGHT_REQUIRED')
    return d*(1-t)*w


def allocation_proxy(parent,group):
    p,g=map(number,(parent,group))
    if g==0 or not 0<=p/g<=1:return None
    return p/g


def incidence_envelope(pretax,taxes,weights):
    if not taxes or not weights:raise ValueError('EXPLICIT_INCIDENCE_SCENARIOS_REQUIRED')
    values=[attributed_delta(pretax,t,w) for t,w in product(taxes,weights)]
    return dict(minAfterTaxCommonDelta=text(min(values)),maxAfterTaxCommonDelta=text(max(values)),
                taxIncidenceProven=False,nciIncidenceProven=False)


def total_credit_proxy(rows,target_average_assets,multiplier):
    if len(rows)!=3 or [x['year'] for x in rows]!=[2023,2024,2025]:raise ValueError('EXACT_THREE_YEAR_TOTAL_CREDIT_HISTORY_REQUIRED')
    with localcontext() as ctx:
        ctx.prec=50
        target,m=map(number,(target_average_assets,multiplier))
        if min(target,m)<=0:raise ValueError('POSITIVE_TARGET_EXPOSURE_AND_MULTIPLIER_REQUIRED')
        total,exposure=Decimal(0),Decimal(0)
        for row in rows:
            a,b,c=map(number,(row['openingAssets'],row['closingAssets'],row['totalCreditExpense']))
            if min(a,b)<=0 or c<0:raise ValueError('POSITIVE_TOTAL_ASSET_POPULATION_REQUIRED')
            total+=c;exposure+=(a+b)/2
        rate=total/exposure
        return rate,rate*target*m


def deduct_funds(common,components):
    seen=set();value=number(common)
    for c in components:
        if c['id'] in seen:raise ValueError('DUPLICATE_FUND_COMPONENT')
        seen.add(c['id'])
        if c['classification']!='PARENT_NON_SHAREHOLDER_LEAKAGE' or c['period']!='FY2025' or c['alreadyDeducted'] is not False:
            raise ValueError('NO_NCI_REINVESTMENT_PNL_OR_DUPLICATE_COMMON_DEDUCTION')
        if number(c['value'])<0:raise ValueError('NONNEGATIVE_FUND_REQUIRED')
        value-=number(c['value'])
    return value


def adjusted_earnings(common,adjustments,*,tax,common_weight):
    ids=[a['id'] for a in adjustments]
    if len(set(ids))!=len(ids):raise ValueError('DUPLICATE_EARNINGS_ADJUSTMENT')
    return number(common)+sum((attributed_delta(a['pretaxVnd'],tax,a.get('provenCommonWeight',common_weight)) for a in adjustments),Decimal(0))


def bsr_resolution(parent,interim,q3_additional,h1_movement,h1_current):
    p,i,q,h,c=map(number,(parent,interim,q3_additional,h1_movement,h1_current))
    if min(i,q,h,c)<0 or h<c:raise ValueError('NONNEGATIVE_SEPARATE_CURRENT_AND_PRIOR_FUND_COMPONENTS_REQUIRED')
    return dict(selectedCommonNumeratorVnd=text(p-i-q),alternativeH1SplitVnd=text(p-i-(h-c)),
                sourceVariantDifferenceVnd=text(q-(h-c)),selection='EXPLICIT_Q3_FY2025_CAPTION_OVER_MIXED_H1_MOVEMENT',
                issuerSubtotalCorrected=False,sourceBytesChanged=False,financialAccepted=False)


def earnings_envelope(common,adjustments,taxes,weights):
    if len({a['id'] for a in adjustments})!=len(adjustments):raise ValueError('DUPLICATE_EARNINGS_ADJUSTMENT')
    low=high=number(common)
    for a in adjustments:
        e=incidence_envelope(a['pretaxVnd'],taxes,[a['provenCommonWeight']] if 'provenCommonWeight' in a else weights)
        low+=number(e['minAfterTaxCommonDelta']);high+=number(e['maxAfterTaxCommonDelta'])
    return dict(minimumVnd=text(low),maximumVnd=text(high),
                independentIncidenceByAdjustment=True,unreviewedFundsAndOneOffsBounded=False)
