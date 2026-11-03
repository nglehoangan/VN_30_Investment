"""Read-only VIC RNAV proposals; source facts, economic judgments and authority remain distinct."""
from decimal import localcontext
from lib.vic_claim_bridge import number,text


def held_stake_revaluation(book,fair,*,value_role,apply_ownership_again=False):
    if value_role!='FAIR_VALUE_OF_HELD_STAKE' or apply_ownership_again:
        raise ValueError('HELD_STAKE_FAIR_VALUE_NO_SECOND_OWNERSHIP_MULTIPLIER')
    b,f=map(number,(book,fair))
    if min(b,f)<0:raise ValueError('NONNEGATIVE_HELD_VALUE_REQUIRED')
    return text(f-b)


def incremental_obligation(amount,*,already_in_book,already_in_forecast,incremental_evidence):
    if already_in_book is not False or already_in_forecast is not False:
        raise ValueError('NO_BOOK_OR_FORECAST_OBLIGATION_DOUBLE_DEDUCTION')
    if not incremental_evidence:raise ValueError('INCREMENTAL_OBLIGATION_EVIDENCE_REQUIRED')
    value=number(amount)
    if value<0:raise ValueError('NONNEGATIVE_OBLIGATION_REQUIRED')
    return text(value)


def project_npv(cashflows,rate,*,valuation_year,rate_basis):
    # Explicit forecast scenarios only. The result does not validate economic assumptions.
    if rate_basis!='EXPLICIT_PROJECT_DISCOUNT_ASSUMPTION':
        raise ValueError('BORROWING_CAPITALIZATION_RATE_IS_NOT_PROJECT_WACC')
    r=number(rate)
    if r<0 or r>=1 or not cashflows:raise ValueError('SUPPORTED_RATE_AND_CASHFLOW_SCHEDULE_REQUIRED')
    years=[];total=number('0')
    with localcontext() as ctx:
        ctx.prec=60
        for row in cashflows:
            year=row['year']
            if not isinstance(year,int) or year<=valuation_year or year in years:
                raise ValueError('DISTINCT_FUTURE_CASHFLOW_PERIODS_REQUIRED')
            years.append(year)
            components=[number(row[k]) for k in ('receipts','remainingConstruction','land','selling','projectTax')]
            if min(components)<0:raise ValueError('NONNEGATIVE_FLOW_COMPONENTS_REQUIRED')
            net=components[0]-sum(components[1:])
            total+=net/(1+r)**(year-valuation_year)
        return dict(scenarioProjectNpvVnd=text(total),netCashBasis='UNLEVERED_AFTER_PROJECT_TAX',
                    financialAssumptionsAccepted=False,productionAuthority=False)


REQUIRED_GROUPS=frozenset({'OPERATING_ASSETS','FINANCIAL_HOLDINGS','QUALIFIED_CASH',
                         'INCREMENTAL_OBLIGATIONS','REVALUATION_TAX','PREFERRED_COMMON_CLAIMS'})

def common_rnav_preview(parent_book,adjustments,*,all_coverage_reconciled):
    groups=set();coverage=set();errors=[];total=number(parent_book)
    for row in adjustments:
        group=row['group']
        if group in groups or group not in REQUIRED_GROUPS:raise ValueError('EXACT_UNIQUE_REVALUATION_GROUP_REQUIRED')
        groups.add(group)
        keys=row.get('coverageKeys',[])
        if len(keys)!=len(set(keys)) or coverage.intersection(keys):
            raise ValueError('NO_SUBSIDIARY_AND_UNDERLYING_ASSET_DOUBLE_COUNT')
        coverage.update(keys)
        # A delta must already include its evidenced common claim and tax treatment.
        if row.get('commonDeltaVnd') is None or not row.get('evidenceIds') or row.get('commonAttributionQualified') is not True:
            errors.append(group+':COMMON_DELTA_OR_SOURCE_UNRESOLVED');continue
        total+=number(row['commonDeltaVnd'])
    errors += [g+':COVERAGE_MISSING' for g in sorted(REQUIRED_GROUPS-groups)]
    if all_coverage_reconciled is not True:errors.append('FULL_ASSET_OBLIGATION_AND_CLAIM_COVERAGE_UNRESOLVED')
    return dict(contract='vic-common-rnav-preview-v1',blockers=errors,
      proposedCommonRnavVnd=text(total) if not errors else None,
      readyForFinancialReview=not errors,financialAcceptanceGranted=False,
      productionAuthority=False,navAuthority=False,tradingAuthority=False)
