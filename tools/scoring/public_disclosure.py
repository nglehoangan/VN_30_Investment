"""Public-data rubric experiments. This module cannot issue scoring authority."""

from decimal import Decimal

from tools.scoring.annual_reassessment import _rubrics, RUBRIC_DEPENDENCIES
from tools.scoring.structural_nr import require


VERSION = 'vn30-public-disclosure-research-v1'
METHODS = {
    'FH-STRESS': ('cash', 'deposits', 'debt', 'minimum_fcf'),
    'GQ-INC': ('ebit', 'equity', 'borrowings', 'short_investments'),
    'VAL-PRIMARY': ('close', 'shares', 'earnings_after_funds', 'value_cfo', 'value_capex'),
    'CA-REINV': ('cfo', 'capex', 'goodwill_increase'),
    'CA-DIL': ('issued', 'outstanding_before', 'issue_price', 'proceeds'),
}


def rubric_contract(registry):
    """Join existing anchors and topics with the existing dependency routing."""
    return {
        rid: {'principle': rule['name'], 'topics': rule['topics'], 'anchors': rule['bands'],
              'maxPoints': rule['max'], 'dependencies': RUBRIC_DEPENDENCIES[rid],
              'maximumPrerequisite': rule['maximumPrerequisite'],
              'experimentalPublicFields': METHODS.get(rid, ())}
        for rid, rule in _rubrics(registry).items()
    }


def decimal(value):
    result = Decimal(str(value))
    require(result.is_finite(), 'NONFINITE_PUBLIC_METRIC')
    return result


def stable_band(anchors, supported_labels, *, counter_reviewed, conservative=False):
    """Return proposed points only for one band that survives every tested case."""
    if not counter_reviewed or not supported_labels or len(set(supported_labels)) != 1:
        return None
    matches = [band for band in anchors if band['label'] == supported_labels[0]]
    require(len(matches) == 1, 'UNKNOWN_APPROVED_ANCHOR')
    return matches[0]['min'] if conservative or matches[0]['min'] == matches[0]['max'] else None


def stress(values):
    cash, deposits, debt, fcf = map(decimal, (values[k] for k in METHODS['FH-STRESS']))
    require(min(cash, deposits, debt) >= 0 and debt > 0 and fcf >= 0, 'INVALID_STRESS_OPERANDS')
    return {'coverageGapsVnd': [
        {'depositFraction': str(fraction), 'inYearFcfFraction': str(collection),
         'gap': str(cash + fraction * deposits + fcf * collection - debt)}
        for fraction in (Decimal(0), Decimal('.25'), Decimal('.5'))
        for collection in (Decimal(0), Decimal(1))
    ]}, 'EARLIEST_OBLIGATION_COVERAGE_NOT_BOUNDED'


def incremental(values):
    columns = {key: {int(year): decimal(v) for year, v in values[key].items()}
               for key in METHODS['GQ-INC']}
    years = sorted(columns['ebit'])
    require(len(years) >= 3 and all(set(col) == set(years) for col in columns.values()), 'UNMATCHED_ANNUAL_PERIODS')
    samples = []
    for start in (years[0], years[-2]):
        for fraction in (Decimal(0), Decimal('.5'), Decimal(1)):
            def capital(year):
                return columns['equity'][year] + columns['borrowings'][year] - fraction * columns['short_investments'][year]
            change = capital(years[-1]) - capital(start)
            # Reject a denominator smaller than one percent of opening/closing capital.
            floor = max(abs(capital(start)), abs(capital(years[-1]))) / 100
            result = (Decimal('.8') * (columns['ebit'][years[-1]] - columns['ebit'][start]) / change
                      if change > floor else None)
            samples.append({'start': start, 'end': years[-1], 'excludedDeposits': str(fraction),
                            'incrementalCapitalVnd': str(change), 'return': str(result) if result is not None else None})
    blocker = ('UNSTABLE_INCREMENTAL_CAPITAL_DENOMINATOR' if any(x['return'] is None for x in samples)
               else 'M_AND_A_AND_OPERATING_CAPITAL_SCOPE_UNRESOLVED')
    profit = columns['ebit']
    return {'assumedTax': '0.20', 'cases': samples,
            'operatingProfitPersistence': {str(y): str(profit[y]) for y in years},
            'testedCapitalTreatments': ['0', '0.5', '1']}, blocker


def valuation(values):
    price, shares, earnings, cfo, capex = map(decimal, (values[k] for k in METHODS['VAL-PRIMARY']))
    require(price > 0 and shares > 0 and capex >= 0, 'INVALID_VALUATION_OPERANDS')
    scenarios = {}
    for name, case in values.get('scenarios', {}).items():
        growth, discount, terminal, conversion = map(decimal, case)
        require(discount > terminal > -1 and growth > -1 and 0 <= conversion <= 1,
                'INVALID_VALUATION_SENSITIVITY_ASSUMPTION')
        flows = [earnings/shares * conversion * (1+growth)**year for year in range(1, 6)]
        endpoint = flows[-1]*(1+terminal)/(discount-terminal)
        present = sum(flow/(1+discount)**year for year, flow in enumerate(flows, 1)) + endpoint/(1+discount)**5
        scenarios[name] = str(present)
    return {'historicalPe': str(price * shares / earnings) if earnings > 0 else None,
            'reportedFcfVnd': str(cfo-capex), 'illustrativeValueVndPerShare': scenarios,
            'scenarioTreatment': 'ASSUMPTION_CONTROLLED'}, 'NORMALIZED_DENOMINATOR_AND_INDEPENDENT_VALUE_RANGE_UNRESOLVED'


def reinvestment(values):
    cfo, capex, goodwill = (values[k] for k in METHODS['CA-REINV'])
    require(cfo.keys() == capex.keys() and len(cfo) >= 3, 'UNMATCHED_REINVESTMENT_WINDOWS')
    return {'reportedFcfVnd': {year: str(decimal(cfo[year]) - decimal(capex[year])) for year in sorted(cfo)},
            'goodwillIncreaseVnd': str(decimal(goodwill))}, 'PUBLIC_DECISION_TO_OUTCOME_BRIDGE_UNRESOLVED'


def dilution(values):
    issued, before, price, proceeds = map(decimal, (values[k] for k in METHODS['CA-DIL']))
    require(issued > 0 and before > 0 and price >= 0 and proceeds == issued * price,
            'ESOP_TERMS_PROCEEDS_MISMATCH')
    return ({'newSharesFraction': str(issued/(before+issued)),
            'preBenefitsScenarios': {str(r): str(issued/(before+issued)*(1-r))
                                     for r in (Decimal(0), Decimal('.5'), Decimal(1))}},
            'ISSUE_DATE_VALUE_BASIS_AND_MATERIALITY_RULE_UNRESOLVED')


CALCULATORS = {'FH-STRESS': stress, 'GQ-INC': incremental, 'VAL-PRIMARY': valuation,
               'CA-REINV': reinvestment, 'CA-DIL': dilution}


def evaluate(rubric, fields, sector, evidence):
    """Evaluate a disclosed-field packet, preserving all five rubrics as nullable."""
    require(rubric in METHODS, 'PUBLIC_METHOD_UNREGISTERED')
    base = {'contract': VERSION, 'rubricId': rubric, 'scope': 'RESEARCH_ONLY',
            'acceptedScore': None, 'productionAuthority': False, 'evidence': evidence}
    if sector == 'BANK' and rubric in {'FH-STRESS', 'GQ-INC', 'VAL-PRIMARY', 'CA-REINV'}:
        return {**base, 'state': 'METHODOLOGY_APPROVAL_REQUIRED',
                'reason': 'USE_BANK_LIQUIDITY_REGULATORY_CAPITAL_AND_BANK_VALUATION_METHOD'}
    missing = [key for key in METHODS[rubric] if key not in fields or not evidence.get(key)]
    if missing:
        return {**base, 'state': 'JUSTIFIED_N_R', 'reason': 'PUBLIC_FIELDS_NOT_ESTABLISHED', 'missingFields': missing}
    metrics, reason = CALCULATORS[rubric](fields)
    return {**base, 'state': 'JUSTIFIED_N_R', 'reason': reason, 'metrics': metrics,
            'confidence': 'LOW_FOR_BAND', 'evidenceTreatment': 'DIAGNOSTIC_ONLY'}

AMENDMENT = 'vn30-five-rubric-amendment-v1.0'
# Evidence requirements for each economic dimension. Scenario diagnostics may use a subset.
DIMENSIONS = {
    'FH-STRESS': {
        'leverage': ('total_debt', 'equity_at_close'),
        'liquidity_coverage': ('cash', 'deposits', 'current_liabilities', 'debt_maturity_buckets', 'usable_deposit_bounds'),
        'interest_service': ('ebit_at_close', 'interest_expense'),
        'cfo_downside': ('minimum_fcf', 'cfo', 'current_assets', 'current_liabilities', 'prior_current_assets', 'prior_current_liabilities'),
        'financial_flexibility': ('public_funding_response', 'public_capital_response'),
    },
    'GQ-INC': {
        'multi_year_efficiency': ('ebit', 'operating_capital_series', 'normalized_tax_series'),
        'profit_persistence': ('ebit',),
        'incremental_productivity': ('operating_capital_series', 'same_scope_incremental_nopat'),
        'stability': ('cash_classification_review', 'acquisition_scope_bridge'),
        'capital_deployment': ('deployment_history',),
    },
    'VAL-PRIMARY': {
        'sustainable_earnings': ('normalized_earnings', 'normalization_bridge', 'value_cfo', 'value_capex'),
        'normalized_eps': ('normalized_earnings', 'shares'),
        'intrinsic_range': ('independent_intrinsic_range',),
        'conservative_range': ('conservative_value_range',),
        'earnings_valuation': ('close', 'normalized_earnings', 'shares', 'historical_valuation_basis'),
        'cross_check': ('independent_cross_check',),
        'sensitivity': ('reviewed_valuation_cases',),
    },
    'CA-REINV': {
        'deployment': ('capex', 'public_deployment_decisions'),
        'financial_outcomes': ('cfo', 'capex', 'public_outcomes_bridge'),
        'accountability': ('public_allocation_follow_up',),
        'adverse_outcomes': ('public_impairment_and_exit_review',),
        'decision_consistency': ('public_deployment_decisions', 'public_outcomes_bridge', 'public_allocation_follow_up'),
    },
    'CA-DIL': {
        'share_change': ('issued', 'outstanding_before', 'esop_effective_event_review'),
        'terms': ('issue_price', 'proceeds', 'esop_restrictions_review'),
        'per_share_impact': ('event_date_comparable_close', 'public_eps_effect_bridge'),
        'shareholder_protection': ('esop_governance_review',),
        'disclosure': ('esop_effective_event_review', 'esop_governance_review'),
    },
}


def assess_amendment(rubric, evidence, anchors, review=None):
    """Use existing M3 anchors and a pinned expert review, never derive a point from an unapproved threshold."""
    missing = {name: [field for field in fields if not evidence.get(field)]
               for name, fields in DIMENSIONS[rubric].items()}
    result = {'methodologyVersion': AMENDMENT, 'mandatoryFieldsByDimension': DIMENSIONS[rubric],
              'missingByDimension': missing, 'proposedBand': None, 'proposedPoints': None,
              'bandStability': 'UNTESTED', 'state': 'JUSTIFIED_N_R'}
    if any(missing.values()) or review is None:
        return result
    require(review['methodologyVersion'] == AMENDMENT, 'AMENDMENT_REVIEW_VERSION_MISMATCH')
    cases = review['scenarioBands']
    require(len(cases) >= 2, 'AMENDMENT_SENSITIVITY_CASES_REQUIRED')
    require(set(cases.values()) <= {band['label'] for band in anchors}, 'UNKNOWN_APPROVED_ANCHOR')
    points = stable_band(anchors, list(cases.values()), counter_reviewed=bool(review['counterEvidence']),
                         conservative=review['conservative'])
    if points == max(band['max'] for band in anchors) and review.get('maximumPrerequisitesMet') is not True:
        return {**result, 'bandStability': 'MAXIMUM_PREREQUISITES_UNVERIFIED'}
    if points is not None:
        return {**result, 'proposedBand': next(iter(cases.values())), 'proposedPoints': points,
                'bandStability': 'STABLE', 'confidence': 'CONSERVATIVE' if review['conservative'] else 'REVIEWED',
                'state': 'RESEARCH_ONLY_CANDIDATE'}
    return {**result, 'bandStability': 'UNSTABLE_OR_UNREVIEWED'}
