"""Post-NPAT fund-plan previews, independent of financial/source admission.

Amounts are decimal VND strings. Restoring an issuer estimate requires a
matching, explicitly replaced deduction, never a generic addback of all funds.
"""
from decimal import Decimal


def amount(value):
    if not isinstance(value, str):
        raise ValueError('DECIMAL_STRING_REQUIRED')
    n = Decimal(value)
    if not n.is_finite():
        raise ValueError('FINITE_AMOUNT_REQUIRED')
    return n


def decimal_text(n):
    return format(n, 'f')


def fund_plan_preview(common, *, restore, deductions, evidence_ids):
    value = amount(common)
    seen = set()
    for row, sign in [(r, 1) for r in restore] + [(r, -1) for r in deductions]:
        # Identity is the source-bound economic component, not a caller label.
        identity = (row['evidenceId'], row['componentKey'], row['economicPeriod'])
        if row['id'] in seen or identity in seen:
            raise ValueError('DUPLICATE_FUND_COMPONENT')
        seen.add(row['id'])
        seen.add(identity)
        if row['evidenceId'] not in evidence_ids:
            raise ValueError('EXACT_EVIDENCE_BINDING_REQUIRED')
        if row['economicPeriod'] != 'FY2025':
            raise ValueError('EXACT_ECONOMIC_PERIOD_REQUIRED')
        if row['classification'] != 'COMMON_NON_OWNER_FUND':
            raise ValueError('NO_RESERVE_DIVIDEND_NCI_OR_UNCLASSIFIED_DEDUCTION')
        if row['attribution'] != 'IDENTIFIED_PARENT_OR_COMMON':
            raise ValueError('COMMON_ATTRIBUTION_REQUIRED')
        if sign == 1 and row.get('existingTreatment') != 'DEDUCTED_ESTIMATE_REPLACED_IN_FULL':
            raise ValueError('EXISTING_DEDUCTION_REPLACEMENT_REQUIRED')
        if sign == -1 and row.get('existingTreatment') != 'NOT_DEDUCTED_IN_INPUT':
            raise ValueError('NO_DUPLICATE_OR_PNL_DEDUCTION')
        n = amount(row['amountVnd'])
        if n < 0:
            raise ValueError('NONNEGATIVE_FUND_REQUIRED')
        value += sign * n
    return dict(commonBridgePreviewVnd=decimal_text(value),
                changeFromInputVnd=decimal_text(value - amount(common)),
                financialNormalizationAccepted=False,
                productionAuthorized=False)


def rebase_scenario(scenario, delta):
    """Only the fund base changes; no tax discount or new cycle multiplier."""
    d = amount(delta)
    return dict(name=scenario['name'],
                minimumVnd=decimal_text(amount(scenario['commonEarningsIncidenceMinimumVnd']) + d),
                maximumVnd=decimal_text(amount(scenario['commonEarningsIncidenceMaximumVnd']) + d),
                selectedNormalizedEarningsVnd=None,
                unreviewedFundsAndOneOffsBounded=False)
