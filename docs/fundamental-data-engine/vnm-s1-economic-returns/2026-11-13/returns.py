"""Assessment-only M3 arithmetic. No source admission, source defaults or point assignment."""
from decimal import Decimal as D, localcontext

def amount(value):
    if value is None: raise ValueError('MISSING_REQUIRED_VALUE')
    x=D(str(value))
    if not x.is_finite():raise ValueError('NON_FINITE_VALUE')
    return x

def invested_capital(stock,cash_exclusion,residual_operating_liability_fraction):
    if stock['scope']!='CONSOLIDATED' or stock['currency']!='VND':raise ValueError('CAPITAL_SCOPE_OR_CURRENCY_MISMATCH')
    cash,liab=amount(cash_exclusion),amount(residual_operating_liability_fraction)
    if not (0<=cash<=1 and 0<=liab<=1):raise ValueError('UNSUPPORTED_ALLOCATION_FRACTION')
    known_op=sum(amount(stock[k]) for k in ['tradePayables','customerAdvances','payrollPayables'])
    debt=amount(stock['shortDebt'])+amount(stock['longDebt'])
    residual=amount(stock['totalLiabilities'])-debt-known_op
    if residual<0:raise ValueError('NEGATIVE_RESIDUAL_LIABILITY_POPULATION')
    operating_assets=amount(stock['assets'])-amount(stock['shortFinancialAssets'])-amount(stock['longFinancialAssets'])-cash*amount(stock['cash'])
    capital=operating_assets-known_op-liab*residual
    if capital<=0:raise ValueError('NONPOSITIVE_INVESTED_CAPITAL')
    return {'value':str(capital),'operatingAssets':str(operating_assets),'explicitOperatingLiabilities':str(known_op),'residualNonInterestLiabilities':str(residual),'residualOperatingDeduction':str(liab*residual),'cashExcluded':str(cash*amount(stock['cash'])),'debt':str(debt),'scope':'CONSOLIDATED','currency':'VND','basis':'VAS_BOOK_CAPITAL_OPERATING_LEASE_EXPENSED; goodwill retained'}

def annual_return(flow,opening,closing,tax_rate,cash_exclusion,residual_fraction,known_cost_case):
    if not(flow['scope']==opening['scope']==closing['scope']=='CONSOLIDATED') or not(flow['currency']==opening['currency']==closing['currency']=='VND'):raise ValueError('EARNINGS_CAPITAL_DIMENSION_MISMATCH')
    year=flow['year']
    if opening['date']!=f'{year-1}-12-31' or closing['date']!=f'{year}-12-31':raise ValueError('AVERAGE_CAPITAL_PERIOD_MISMATCH')
    t=amount(tax_rate)
    if not 0<=t<1:raise ValueError('INVALID_TAX_RATE')
    with localcontext() as ctx:
        ctx.prec=45
        core=amount(flow['grossProfit'])-amount(flow['selling'])-amount(flow['admin'])
        # A conservative sensitivity charges the explicitly identified other/noninterest costs.
        # It is not an exhaustive bound on unknown recurring items or a claim all other costs recur.
        costs=amount(flow['otherExpense'])+max(D(0),amount(flow['financeExpense'])-amount(flow['interestExpense']))+amount(flow.get('identifiedFinanceCredit',0)) if known_cost_case else D(0)
        before_fund_ebit=core-costs
        fund=amount(flow['fundAppropriation'])
        normalized_ebit=before_fund_ebit-fund/(1-t)
        nopat=normalized_ebit*(1-t)
        op=invested_capital(opening,cash_exclusion,residual_fraction);cl=invested_capital(closing,cash_exclusion,residual_fraction)
        avg=(amount(op['value'])+amount(cl['value']))/2
        return {'year':year,'scope':'CONSOLIDATED','currency':'VND','taxRate':str(t),'cashExclusionFraction':str(cash_exclusion),'residualLiabilityOperatingFraction':str(residual_fraction),'knownCostCase':bool(known_cost_case),'coreEbit':str(core),'identifiedOtherAndNonInterestCostSensitivity':str(costs),'postTaxFundEconomicCost':str(fund),'pretaxEquivalentFundCost':str(fund/(1-t)),'normalizedEbitEstimate':str(normalized_ebit),'nopatEstimate':str(nopat),'openingCapital':op,'closingCapital':cl,'averageInvestedCapital':str(avg),'roicEstimate':str(nopat/avg),'classification':'EVIDENCE_ANCHORED_ANALYTICAL_ESTIMATE_NOT_FORMALLY_ADMITTED','limits':'Sensitivity envelope, not exhaustive hard bounds; no arbitrary one-off addbacks or factory attribution. Group NCI remains in earnings/capital; post-tax fund charged once, not cash use plus accrual.'}

def incremental_efficiency(previous,current,comparable=False,denominator_material=False):
    dimensions=['scope','currency','taxRate','cashExclusionFraction','residualLiabilityOperatingFraction','knownCostCase']
    if any(previous[k]!=current[k] for k in dimensions) or current['year']!=previous['year']+1:raise ValueError('INCREMENTAL_BASIS_OR_PERIOD_MISMATCH')
    dn=amount(current['nopatEstimate'])-amount(previous['nopatEstimate'])
    dc=amount(current['closingCapital']['value'])-amount(previous['closingCapital']['value'])
    usable=dc>0 and comparable and denominator_material
    status='SUPPORTED_AGGREGATE_INCREMENTAL_RETURN' if usable else 'N_R_NONPOSITIVE_INCREMENTAL_CAPITAL' if dc<=0 else 'N_R_CAPITAL_CHANGE_COMPARABILITY_OR_MATERIALITY_UNRESOLVED'
    return {'from':previous['year'],'to':current['year'],'deltaNopat':str(dn),'deltaYearEndCapital':str(dc),'value':str(dn/dc) if usable else None,'status':status,'notProjectReturn':True,'limits':'Book-capital changes include FX, acquisitions, depreciation and financing/population effects. Ratio is not a causal factory return or incremental-ROIC score.'}

def compare_capital_cost(roic_values,cost_range):
    if cost_range is None:return {'status':'N_R','value':None,'reason':'S1_CAPITAL_COST_RANGE_UNAVAILABLE','defaultUsed':False}
    if cost_range.get('supported') is not True or not cost_range.get('evidenceRefs') or cost_range.get('currency')!='VND' or cost_range.get('scope')!='CONSOLIDATED' or cost_range.get('basis')!='NOMINAL_UNLEVERED_COMPATIBLE':raise ValueError('UNSUPPORTED_OR_MISMATCHED_CAPITAL_COST_RANGE')
    lo,hi=amount(cost_range['low']),amount(cost_range['high'])
    if not 0<=lo<=hi<1:raise ValueError('INVALID_CAPITAL_COST_RANGE')
    rr=[amount(x) for x in roic_values]
    return {'status':'SUPPORTED_COMPARISON','minimumSpread':str(min(rr)-hi),'maximumSpread':str(max(rr)-lo),'allScenariosAboveCost':min(rr)>hi,'doesNotAssignRubricPoints':True}
