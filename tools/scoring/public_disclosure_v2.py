"""Executable proposed band mappings. No path from this module to score adoption."""
from decimal import Decimal

from tools.scoring.public_disclosure import decimal
from tools.scoring.structural_nr import require

VERSION = 'vn30-public-disclosure-v2.0-PROPOSED'
VALUE_BOUNDARIES = ('0.65', '0.80', '0.90', '0.95', '1.05', '1.15', '1.25', '1.40')
MATERIAL_DILUTION = Decimal('.01')
REQUIRED = {
    'FH-STRESS': ('base_gap', 'downside_gap', 'severe_gap', 'funding_response'),
    'GQ-INC': ('return_low', 'return_high', 'capital_cost', 'scope_reconciled', 'persistent_productivity'),
    'VAL-PRIMARY': ('price', 'bear', 'base', 'bull', 'conservative_value', 'cross_check', 'normalized_same_scope'),
    'CA-REINV': ('reviewed_decisions', 'accretive_outcomes', 'destructive_outcomes', 'follow_up'),
    'CA-DIL': ('event_effects', 'all_material_events_reviewed', 'minority_protection'),
}
SECTOR_BLOCK = {'BANK', 'SECURITIES', 'INSURANCE'}


def stress(x):
    base, downside, severe = (decimal(x[k]) for k in REQUIRED['FH-STRESS'][:3])
    require(severe <= downside <= base, 'STRESS_CASES_NOT_ORDERED')
    response = x['funding_response']
    require(response in {'FAILED', 'DISTRESSED', 'MATERIAL_CONSTRAINTS', 'MANAGEABLE', 'NO_EMERGENCY'},
            'STRESS_RESPONSE_UNREVIEWED')
    if response == 'FAILED':
        return (0, 'SUPPORTED_FAILURE') if downside < 0 else (None, 'FAILURE_CONTRADICTS_COVERAGE')
    if response == 'DISTRESSED':
        return (1, 'DISTRESSED_FINANCING') if downside < 0 else (None, 'DISTRESS_CONTRADICTS_COVERAGE')
    if base < 0:
        return None, 'BASE_GAP_UNEXPLAINED'
    if downside < 0:
        return 2, 'DOWNSIDE_DEFICIT'
    if response == 'MATERIAL_CONSTRAINTS' or severe < 0:
        return 3, 'MATERIAL_DOWNSIDE_CONSTRAINTS'
    return (5, 'SEVERE_SURVIVAL_WITHOUT_EMERGENCY') if response == 'NO_EMERGENCY' else (4, 'MANAGEABLE_CONSTRAINTS')


def productivity(x):
    low, high, cost = (decimal(x[k]) for k in REQUIRED['GQ-INC'][:3])
    require(low <= high and cost > 0, 'INVALID_PRODUCTIVITY_RANGE')
    if x['scope_reconciled'] is not True:
        return None, 'ACQUISITION_OR_CAPITAL_SCOPE_UNRECONCILED'
    def band(value):
        if value < 0:
            return 0
        return 1 + sum(value >= cost*decimal(boundary) for boundary in ('.5', '1', '1.25', '1.5'))
    first, last = band(low), band(high)
    if first != last:
        return None, 'PRODUCTIVITY_BAND_CHANGES_ACROSS_CASES'
    if first >= 4 and x['persistent_productivity'] is not True:
        return None, 'HIGH_RETURN_PERSISTENCE_UNSUPPORTED'
    return first, 'STABLE_INCREMENTAL_RETURN_CLASS'


def valuation(x):
    price, bear, base, bull, conservative, cross = (decimal(x[k]) for k in REQUIRED['VAL-PRIMARY'][:6])
    require(price > 0 and 0 < bear <= conservative <= base <= bull and cross > 0, 'INVALID_NORMALIZED_VALUE_RANGE')
    if x['normalized_same_scope'] is not True:
        return None, 'VALUATION_FINANCIAL_SCOPE_UNRECONCILED'
    def band(value):
        return sum(value / price >= decimal(limit) for limit in VALUE_BOUNDARIES)
    base_band, cross_band, downside_band = band(base), band(cross), band(conservative)
    if abs(base_band - cross_band) > 1:
        return None, 'INDEPENDENT_VALUE_CROSS_CHECK_DIVERGES'
    # A bear result is an uncertainty signal rather than a second base case.
    selected = min(base_band, cross_band)
    if selected >= 5:
        selected = min(selected, max(4, downside_band + 1))
    return selected, 'BASE_CROSS_CHECK_AND_CONSERVATIVE_VALUE'


def allocation(x):
    decisions, positive, adverse = (x[k] for k in REQUIRED['CA-REINV'][:3])
    require(all(type(v) is int and v >= 0 for v in (decisions, positive, adverse))
            and positive + adverse <= decisions, 'INVALID_ALLOCATION_DECISION_COUNTS')
    if decisions < 2 or x['follow_up'] is not True:
        return None, 'COMPANY_LEVEL_DECISION_OUTCOMES_NOT_EVIDENCED'
    if adverse >= 2 and adverse > positive:
        return 0, 'REPEATED_VALUE_DESTRUCTION'
    if positive == decisions:
        return 2, 'CONSISTENTLY_ACCRETIVE_OUTCOMES'
    if positive or adverse:
        return 1, 'OBSERVABLE_MIXED_OUTCOMES'
    return None, 'NO_ATTRIBUTABLE_OUTCOME'


def dilution(x):
    events = x['event_effects']
    if not events or x['all_material_events_reviewed'] is not True:
        return None, 'MATERIAL_ESOP_EVENT_COVERAGE_INCOMPLETE'
    if any(not event.get('id') for event in events) or len({event['id'] for event in events}) != len(events):
        raise ValueError('DUPLICATE_OR_UNNAMED_ESOP_EVENT')
    cumulative = Decimal(1)
    for event in events:
        effect = decimal(event['perShareEffect'])
        require(effect > -1, 'INVALID_EVENT_EFFECT')
        cumulative *= 1 + effect
    if cumulative - 1 <= -MATERIAL_DILUTION:
        return 0, 'MATERIAL_CUMULATIVE_PER_SHARE_LOSS'
    if cumulative >= 1 and x['minority_protection'] is True:
        return 1, 'NEUTRAL_OR_ACCRETIVE_WITH_PROTECTION'
    return None, 'SMALL_LOSS_OR_SHAREHOLDER_PROTECTION_UNRESOLVED'


MAPPERS = {'FH-STRESS': stress, 'GQ-INC': productivity, 'VAL-PRIMARY': valuation,
           'CA-REINV': allocation, 'CA-DIL': dilution}


def evaluate_proposed(rubric, anchors, sector, observations, evidence):
    base = {'rubricId': rubric, 'methodologyVersion': VERSION, 'authority': 'NONE',
            'status': 'JUSTIFIED_N_R', 'score': None, 'anchor': None}
    if sector in SECTOR_BLOCK and rubric != 'CA-DIL':
        return {**base, 'reason': 'SECTOR_EQUIVALENT_REQUIRED'}
    missing = [key for key in REQUIRED[rubric] if key not in observations or not evidence.get(key)]
    if missing:
        return {**base, 'reason': 'PROPOSED_BAND_INPUTS_UNSUPPORTED', 'missingFields': missing}
    score, reason = MAPPERS[rubric](observations)
    if score is None:
        return {**base, 'reason': reason}
    anchor = next(b for b in anchors if b['min'] <= score <= b['max'])
    return {**base, 'status': 'PROPOSED_RESEARCH_SCORE', 'score': score, 'anchor': anchor['label'],
            'reason': reason, 'confidence': 'LIMITED_BY_PROPOSED_CALIBRATION'}
