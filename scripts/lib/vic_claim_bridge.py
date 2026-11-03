"""VIC source-bound analytical exclusions, never a production ledger bridge."""
from decimal import Decimal, localcontext


def number(value):
    if not isinstance(value,str):
        raise ValueError('DECIMAL_STRING_REQUIRED')
    n=Decimal(value)
    if not n.is_finite():
        raise ValueError('FINITE_DECIMAL_REQUIRED')
    return n


def text(n):
    return format(n,'f')


def claim_bases(parent_npat,restricted_income,eps_numerator):
    p,r,e=map(number,(parent_npat,restricted_income,eps_numerator))
    if r<0 or p-r!=e:
        raise ValueError('PARENT_RESTRICTION_EPS_IDENTITY_REQUIRED')
    return dict(economicCommonProfitVnd=text(p),restrictedReinvestmentVnd=text(r),
                distributableNumeratorVnd=text(e),restrictionDeductedExactlyOnce=True,
                restrictedIncomeIsNonOwnerLeakage=False)


def scenario_weight(*,entity,expected_entity,percent,effective_period,mode):
    if entity!=expected_entity:
        raise ValueError('EXACT_RECIPIENT_ENTITY_REQUIRED')
    if mode!='CONDITIONAL_SCENARIO_NOT_PROVEN_ATTRIBUTION':
        raise ValueError('SNAPSHOT_CANNOT_ADMIT_TRANSACTION_ATTRIBUTION')
    if effective_period not in ['AT_2024-12-31','AT_2025-12-31']:
        raise ValueError('EXACT_SNAPSHOT_PERIOD_REQUIRED')
    n=number(percent)/100
    if not 0<=n<=1:
        raise ValueError('OWNERSHIP_RANGE_REQUIRED')
    return text(n)


def exclusions(base,rows,*,tax='0',common_weight='1',required_scope='CONSOLIDATED'):
    t,w=number(tax),number(common_weight)
    if not 0<=t<=1 or not 0<=w<=1:
        raise ValueError('BOUNDED_SCENARIO_INCIDENCE_REQUIRED')
    seen=set();groups={}
    with localcontext() as ctx:
        ctx.prec=60
        value=number(base)
        for r in rows:
            if r['eventId'] in seen:
                raise ValueError('DUPLICATE_ECONOMIC_COMPONENT')
            seen.add(r['eventId'])
            if r['scope']!=required_scope or r['economicPeriod']!='FY2025':
                raise ValueError('SOURCE_SCOPE_AND_PERIOD_BINDING_REQUIRED')
            if r['role']!='IDENTIFIED_PNL_INCOME_OR_GAIN':
                raise ValueError('NO_LICENSE_PROCEEDS_RESERVE_OR_RESTRICTED_INCOME_DEDUCTION')
            group=r.get('aggregateGroup')
            if group:
                levels=groups.setdefault(group,[]);levels.append(r['aggregationLevel'])
                if 'AGGREGATE' in levels and len(levels)>1:
                    raise ValueError('AGGREGATE_COMPONENT_DOUBLE_COUNT')
            amount=number(r['amountVnd'])
            if amount<0:
                raise ValueError('NONNEGATIVE_EXCLUSION_REQUIRED')
            value-=amount*(1-t)*w
        return text(value)
