"""Versioned M3 public-evidence overlay used by Research and successor EBCS."""
from tools.scoring.public_disclosure import decimal
from tools.scoring.public_disclosure_v2 import productivity, valuation, dilution
from tools.scoring.public_disclosure_v3 import FINANCIALS, resilience, reinvestment
from tools.scoring.structural_nr import require

VERSION = 'vn30-m3-public-successor-v1-PROPOSED'
PATH = 'src/domain/scoring/m3-public-successor-v1.json'


def evaluate(rubric, policy, anchors, sector, values, evidence):
    result = {'rubricId': rubric, 'methodologyVersion': VERSION, 'authority': 'NONE',
              'status': 'JUSTIFIED_N_R', 'score': None, 'anchor': None,
              'requiredPublicFields': policy['requiredPublicFields'], 'removedPredicates': policy['removed']}
    if sector in FINANCIALS and rubric != 'CA-DIL':
        return {**result, 'reason': 'SUCCESSOR_SECTOR_EQUIVALENT_REQUIRED'}
    required = policy['requiredPublicFields']
    missing = [k for k in required if k not in values or not evidence.get(k)]
    if missing:
        return {**result, 'reason': 'SUCCESSOR_REQUIRED_PUBLIC_FIELDS_MISSING', 'missingFields': missing}
    metrics, risks = {}, []
    if rubric == 'FH-STRESS':
        points, reason, metrics, risks = resilience(values)
    elif rubric == 'CA-REINV':
        points, reason, metrics, risks = reinvestment(values)
    elif rubric == 'GQ-INC':
        points, reason = productivity({
            'return_low': values['public_productivity_low'], 'return_high': values['public_productivity_high'],
            'capital_cost': values['public_capital_cost'], 'scope_reconciled': values['scope_bounds_review'] == 'SUPPORTED',
            'persistent_productivity': values['persistence_review'] == 'SUPPORTED',
        })
    elif rubric == 'VAL-PRIMARY':
        shares = decimal(values['cutoff_shares'])
        require(shares > 0 and decimal(values['normalized_earning_power']) > 0, 'SUCCESSOR_EARNINGS_BASIS_INVALID')
        metrics['normalizedEps'] = str(decimal(values['normalized_earning_power']) / shares)
        points, reason = valuation({
            'price': values['cutoff_price'], 'bear': values['bear_value'], 'base': values['base_value'],
            'bull': values['bull_value'], 'conservative_value': values['conservative_value'],
            'cross_check': values['independent_value'],
            'normalized_same_scope': values['normalization_scope_review'] == 'SUPPORTED',
        })
    elif rubric == 'CA-DIL':
        issued, before, issue_price, proceeds = (decimal(values[k]) for k in required[:4])
        require(issued > 0 and before > 0 and issue_price >= 0 and proceeds == issued*issue_price,
                'SUCCESSOR_ESOP_TERMS_MISMATCH')
        metrics['mechanicalDilution'] = str(issued/(before+issued))
        points, reason = dilution({
            'event_effects': values['esop_event_economics'],
            'all_material_events_reviewed': values['material_event_review'] == 'SUPPORTED',
            'minority_protection': values['shareholder_protection_review'] == 'SUPPORTED',
        })
    else:
        raise ValueError('UNKNOWN_SUCCESSOR_RUBRIC')
    require(points is None or 0 <= points <= policy['maxPoints'], 'SUCCESSOR_POINTS_OUTSIDE_REGISTRY')
    anchor = next((b['label'] for b in anchors if points is not None and b['min'] <= points <= b['max']), None)
    return {**result, 'score': points, 'anchor': reason if rubric in {'FH-STRESS','CA-REINV'} and points is not None else anchor,
            'historicalAnchorAtSamePoints': anchor,
            'status': 'PROPOSED_RESEARCH_SCORE' if points is not None else 'JUSTIFIED_N_R',
            'reason': reason, 'metrics': metrics, 'separateRiskWarnings': risks,
            'nonCompensableRiskReview': ('OPEN' if 'REFINANCING_CAPACITY_UNVERIFIED' in risks
                                           else 'NO_CHANGE_TO_EXISTING_GATES'),
            'confidence': 'CONSERVATIVE' if points is not None else 'LOW'}
