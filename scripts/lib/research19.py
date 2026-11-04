"""Signed research sensitivities. No admission, cash distributability or price targets."""
from decimal import Decimal
from .held_normalization import number, text, present_value

D=Decimal


def capital_bridge(r):
    if r['periodEnd']!='2025-12-31' or r['sourceColumn']!='FY2025_CLOSING':
        raise ValueError('EXACT_FY2025_CLOSING_REQUIRED')
    if r['reviewMode']!='FULL_SOURCE_PAGE_IMAGE_INSPECTED_BY_CHATGPT':
        raise ValueError('SOURCE_IMAGE_REVIEW_REQUIRED')
    m=number(r['multiplier']);total=number(r['selectedEquitySubtotalNative'])
    if m not in (D(1),D(1000000)) or total<=0 or r['nativeUnit']!=('VND' if m==1 else 'MILLION_VND'):raise ValueError('UNSUPPORTED_CAPITAL_UNIT')
    if r.get('sourceConflict'):
        conflict=r['sourceConflict']
        if not total==number(conflict['printed400Native'])==number(conflict['componentSumIncludingNciNative']):raise ValueError('BSR_CONFLICT_BRANCH_MISMATCH')
    if r.get('printed400IncludingFundingNative') is not None and total+number(r['excludedOtherFundingNative'])!=number(r['printed400IncludingFundingNative']):raise ValueError('GVR_FUNDING_BRIDGE_MISMATCH')
    if r['nciNative'] is not None:
        nci=number(r['nciNative'])
        if nci>total:raise ValueError('NCI_EXCEEDS_EQUITY')
        parent=total-nci;basis='SELECTED_EQUITY_SUBTOTAL_MINUS_PRINTED_NCI'
    elif r['sourceScope']=='STANDALONE':
        parent=total;basis='STANDALONE_EQUITY_NCI_NOT_APPLICABLE'
    elif r['parentComponentsNative']:
        parent=sum(map(number,r['parentComponentsNative']),D(0))
        if parent!=total:raise ValueError('COMPONENT_EQUITY_MISMATCH')
        basis='COMPONENT_SUM_PROXY_NCI_NOT_SEPARATELY_PRINTED'
    else:raise ValueError('NO_PARENT_CAPITAL_BRIDGE')
    return dict(parentCapitalReferenceVnd=text(parent*m),basis=basis,
        nciReportedVnd=None if r['nciNative'] is None else text(number(r['nciNative'])*m),
        preferredClaimMarketValueVnd=None,allCommonClaimsQualified=False,
        groupFundingExcludedVnd=text(number(r.get('excludedOtherFundingNative','0'))*m),
        capitalIsMarketOrRecoverableValue=False)


def signed_return_value(book,earnings,cost,horizon,policy):
    """Constant book; distributions may be negative capital injections, not dividends."""
    b,e,r=map(number,(book,earnings,cost))
    if b<=0 or r<=0 or type(horizon) is not int or not 1<=horizon<=10:
        raise ValueError('INVALID_CAPITAL_PARAMETERS')
    if policy not in ('FADE_TO_COST','PERSIST_CURRENT_RETURN'):
        raise ValueError('UNKNOWN_RETURN_POLICY')
    years=[];flows=[];residuals=[]
    for i in range(1,horizon+1):
        weight=D(1)-D(i-1)/horizon if policy=='FADE_TO_COST' else D(1)
        profit=b*r+(e-b*r)*weight
        residual=profit-b*r
        flows.append(profit);residuals.append(residual)
        years.append(dict(year=i,parentEarningsAssumptionVnd=text(profit),excessReturnVnd=text(residual),
            hypotheticalNetDistributionVnd=text(profit),capitalInjectionRequiredIfNegativeVnd=text(max(-profit,D(0)))))
    terminal_equity=b if policy=='FADE_TO_COST' else e/r
    terminal_residual=D(0) if policy=='FADE_TO_COST' else (e-b*r)/r
    rim=b+present_value(residuals,r)+terminal_residual/(1+r)**horizon
    ddm=present_value(flows,r)+terminal_equity/(1+r)**horizon
    if abs(rim-ddm)>D('.000001'):raise ValueError('SIGNED_CLEAN_SURPLUS_IDENTITY')
    return dict(model='SIGNED_PARENT_EQUITY_RETURN_SENSITIVITY',equityValueVnd=text(rim),
        signedDistributionCrosscheckVnd=text(ddm),crosscheckIsIndependentValuation=False,
        currentReturnOnCapital=text(e/b),costOfEquityAssumption=text(r),growthAssumption='0',
        horizonYears=horizon,returnPolicy=policy,years=years,terminalEquityAssumptionVnd=text(terminal_equity),
        negativeValueIsNotNegativeSharePrice=rim<0,unmodeledClaimsDeducted=False,
        actualDividendOrRegulatoryHeadroomProven=False,terminalBookRecoveryProven=False,
        cashOrDebtAddedAgain=False,productionScoringAuthorized=False)
