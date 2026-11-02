"""Lossless read-only underwriting checks. Results never confer financial authority."""
from datetime import date
from decimal import Decimal
from .held_normalization import number, text


def fund_bridge(parent_profit, interim, additional, *, additional_period, attribution):
    if additional_period != 'FY2025' or attribution != 'PARENT_COMMON':
        raise ValueError('EXPLICIT_PERIOD_AND_COMMON_ATTRIBUTION_REQUIRED')
    p, i, a = map(number, (parent_profit, interim, additional))
    if i < 0 or a < 0:
        raise ValueError('SIGNED_FUND_DEDUCTION_MUST_BE_EXPLICIT')
    return dict(totalDeductionVnd=text(i+a), commonProfitVnd=text(p-i-a))


def share_anchor(issued, outstanding, *, restricted=None, potential=None, dilution_complete=False):
    i = number(issued)
    if i <= 0 or i != i.to_integral_value():
        raise ValueError('POSITIVE_INTEGER_ORDINARY_ISSUED_REQUIRED')
    o = number(outstanding) if outstanding is not None else None
    if o is not None and (o <= 0 or o > i or o != o.to_integral_value()):
        raise ValueError('OUTSTANDING_MUST_NOT_EXCEED_ISSUED')
    if restricted is not None and not 0 <= number(restricted) <= i:
        raise ValueError('RESTRICTED_SHARES_ARE_SUBSET_OF_ISSUED')
    if potential is not None and (number(potential) < 0 or number(potential) != number(potential).to_integral_value()):
        raise ValueError('NONNEGATIVE_INTEGER_POTENTIAL_REQUIRED')
    return dict(treasuryShares=None if o is None else text(i-o),
                restrictedAlreadyIncluded=True,
                potentialCommonEquivalentShares=potential,
                knownInstrumentAsConvertedShares=None if o is None or potential is None else text(o+number(potential)),
                fullyDilutedShares=None if o is None or potential is None or dilution_complete is not True else text(o+number(potential)))


def qualify_dated_denominator(anchor_date, price_date, *, action_coverage, price_basis, source_bound):
    a, p = date.fromisoformat(anchor_date), date.fromisoformat(price_date)
    failures = []
    if a > p: failures.append('LOOKAHEAD_SHARE_ANCHOR')
    if not action_coverage: failures.append('ISSUANCE_TREASURY_RIGHTS_BRIDGE_INCOMPLETE')
    if price_basis not in ('UNADJUSTED_EXECUTION', 'DOCUMENTED_SAME_SHARE_BASIS'):
        failures.append('PRICE_ADJUSTMENT_BASIS_UNDECLARED')
    if not source_bound: failures.append('SOURCE_BINDING_UNVERIFIED')
    return dict(status='BLOCKED' if failures else 'RESEARCH_REFERENCE_ONLY', reasons=failures,
                productionAdmissible=False, navAuthority=False, tradingAuthority=False)


def capex_partition(total_cash, components):
    total = number(total_cash)
    if total < 0: raise ValueError('NONNEGATIVE_CASH_CAPEX_REQUIRED')
    seen, sums = set(), {'MAINTENANCE': Decimal(0), 'EXPANSION': Decimal(0)}
    for c in components:
        if c['id'] in seen: raise ValueError('DUPLICATE_CASH_COMPONENT')
        seen.add(c['id'])
        if c['semantic'] != 'CASH_FLOW' or c['matchedPeriodScope'] is not True:
            raise ValueError('CIP_STOCK_DA_OR_UNMATCHED_PERIOD_NOT_CASH_CAPEX')
        if c['classification'] not in sums or number(c['value']) < 0:
            raise ValueError('SUPPORTED_NONNEGATIVE_COMPONENT_REQUIRED')
        sums[c['classification']] += number(c['value'])
    allocated = sum(sums.values())
    if allocated > total: raise ValueError('CAPEX_COMPONENTS_EXCEED_CASH_TOTAL')
    return dict(knownMaintenanceVnd=text(sums['MAINTENANCE']), knownExpansionVnd=text(sums['EXPANSION']),
                unallocatedVnd=text(total-allocated),
                complete=allocated == total,
                maintenanceEstimateVnd=text(sums['MAINTENANCE']) if allocated == total else None)


def restricted_pool(gross, restricted, *, pool, restricted_pool_name):
    if pool != restricted_pool_name: raise ValueError('RESTRICTION_POOL_MISMATCH')
    g = number(gross)
    if restricted is None: return None
    r = number(restricted)
    if not 0 <= r <= g: raise ValueError('INVALID_RESTRICTED_AMOUNT')
    return text(g-r)


def debt_bridge(opening, draws, principal_paid, closing):
    o, d, p, c = map(number, (opening, draws, principal_paid, closing))
    if min(o,d,p,c) < 0: raise ValueError('NONNEGATIVE_DEBT_CASH_OPERANDS_REQUIRED')
    return dict(cashImpliedClosingVnd=text(o+d-p), unexplainedNoncashOrScopeResidualVnd=text(c-o-d+p),
                balancingEntryAuthorized=False)


def loan_quality(gross, groups, reserve, *, same_population_date):
    if same_population_date is not True: raise ValueError('MATCHED_LOAN_POPULATION_AND_DATE_REQUIRED')
    g, r = number(gross), number(reserve)
    if set(groups) != {'3','4','5'}: raise ValueError('ALL_THREE_NPL_GROUPS_REQUIRED')
    vals = [number(v) for v in groups.values()]
    if g <= 0 or min(vals+[r]) < 0 or sum(vals) > g: raise ValueError('INVALID_LOAN_AMOUNTS')
    n = sum(vals)
    return dict(nplRatio=text(n/g), coverageRatio=None if n == 0 else text(r/n))
