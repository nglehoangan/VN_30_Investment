"""Hybrid coverage and eligibility rules. Authority remains in the native scorer."""
from decimal import Decimal

from tools.scoring.structural_nr import require

VERSION = 'vn30-hybrid-scoring-policy-v1.0'


def coverage(rows, registry):
    require(len(rows) == len(registry) == 23 and {r['rubricId'] for r in rows} == registry.keys()
            and sum(r['maxPoints'] for r in registry.values()) == 100, 'HYBRID_RUBRIC_SCOPE_MISMATCH')
    rated, missing = [], []
    for row in rows:
        rule = registry[row['rubricId']]
        points = row['points']
        if row['state'] == 'N/R':
            require(points is None, 'HYBRID_UNRATED_POINTS_MUST_BE_NULL')
            missing.append(row['rubricId'])
        else:
            require(row['state'] in ('VERIFIED', 'CONSERVATIVE') and type(points) is int
                    and 0 <= points <= rule['maxPoints'], 'HYBRID_INVALID_RUBRIC_POINTS')
            rated.append((points, rule['maxPoints']))
    points = sum(x for x, _ in rated)
    weight = sum(w for _, w in rated)
    return {'raw_scored_points': points, 'evaluated_weight': weight,
            'rubric_coverage': {'evaluated': len(rated), 'total': len(registry)},
            'weight_coverage': weight, 'weight_coverage_total': 100,
            'covered_score': str(Decimal(points) * 100 / weight) if weight else None,
            'full_official_score': None, 'unrated_rubrics': missing}


def conservative_gap(row, anchors, control):
    if not control:
        return 'HYBRID_CONTROLLED_ASSUMPTIONS_REQUIRED'
    if not all(control.get(key) for key in ('factPins', 'assumptions', 'rationale', 'sensitivity',
                                             'counterEvidence', 'methodologyVersion')):
        return 'HYBRID_CONTROLLED_ASSUMPTIONS_INCOMPLETE'
    if control['methodologyVersion'] != VERSION:
        return 'HYBRID_ASSUMPTION_METHOD_MISMATCH'
    allowed = {b['label']: b for b in anchors}
    cases = control.get('caseBands', [])
    if not cases or not set(cases) <= allowed.keys():
        return 'HYBRID_CASE_BANDS_REQUIRED'
    if len(set(cases)) > 1:
        # No new cross-band rule has approved exact thresholds in this release.
        return 'HYBRID_CROSS_BAND_SELECTION_NOT_APPROVED'
    if row['points'] != allowed[cases[0]]['min']:
        return 'HYBRID_CONSERVATIVE_POINT_MUST_BE_BAND_FLOOR'
    for assumption in control['assumptions']:
        try:
            low, high = (Decimal(str(assumption[k])) for k in ('low', 'high'))
            if not low.is_finite() or not high.is_finite() or low > high or not assumption.get('name'):
                return 'HYBRID_INVALID_ASSUMPTION_RANGE'
        except (KeyError, ArithmeticError, ValueError, TypeError):
            return 'HYBRID_INVALID_ASSUMPTION_RANGE'
    return None


def eligibility(result, *, confidence, coverage_policy=None, same_sector_method=False,
                valuation_comparable=False, financial_risk_valid=False, valuation_valid=False,
                pit_valid=False, methodology_approved=False, portfolio_risk_valid=False,
                ordinary_buy_valid=False):
    ranking = []
    if coverage_policy is None:
        ranking.append('OWNER_MINIMUM_COVERAGE_POLICY_REQUIRED')
    else:
        if (result['rubric_coverage']['evaluated'] < coverage_policy['minimumRubrics']
                or result['evaluated_weight'] < coverage_policy['minimumWeight']):
            ranking.append('MINIMUM_COVERAGE_NOT_MET')
        if confidence not in coverage_policy['acceptedConfidence']:
            ranking.append('CONFIDENCE_NOT_ACCEPTED')
    if not same_sector_method:
        ranking.append('SECTOR_COMPARABILITY_UNVERIFIED')
    if not valuation_comparable:
        ranking.append('VALUATION_BASIS_NOT_COMPARABLE')
    buying = [reason for valid, reason in (
        (financial_risk_valid, 'FINANCIAL_RISK_UNRESOLVED'),
        (valuation_valid, 'VALUATION_UNRESOLVED'),
        (pit_valid, 'PIT_ELIGIBILITY_UNVERIFIED'),
        (methodology_approved, 'SUCCESSOR_METHOD_NOT_ACTIVATED'),
        (portfolio_risk_valid, 'PORTFOLIO_RISK_POLICY_UNVERIFIED'),
        (ordinary_buy_valid, 'ORDINARY_BUY_CRITERIA_NOT_ESTABLISHED'),
    ) if not valid]
    return {'ranking': 'RANKING_BLOCKED' if ranking else 'RANKING_ELIGIBLE', 'rankingReasons': ranking,
            'buy': 'BUY_BLOCKED' if buying else 'BUY_ELIGIBLE', 'buyReasons': buying,
            'defensiveActions': 'EXISTING_DECISION_POLICY'}
