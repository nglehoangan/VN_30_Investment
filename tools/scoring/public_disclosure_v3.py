"""Proposed public-disclosure structural amendment, isolated from official scoring."""
from decimal import Decimal

from tools.scoring.public_disclosure import decimal
from tools.scoring.public_disclosure_v2 import evaluate_proposed
from tools.scoring.structural_nr import require

VERSION = 'vn30-public-disclosure-structural-v3.0-PROPOSED'
FINANCIALS = {'BANK', 'INSURANCE', 'SECURITIES'}
MANDATORY = {
    'FH-STRESS': ('cash', 'debt', 'total_debt', 'equity_at_close', 'current_assets', 'current_liabilities',
                  'ebit_at_close', 'interest_expense', 'cfo', 'capex', 'latest_cfo', 'latest_capex'),
    'CA-REINV': ('cfo', 'capex', 'goodwill_increase', 'allocation_disclosure'),
}
LABELS = {0:'Observed failure of public financial support',1:'Weak public financial support',
          2:'Public operating buffers with material weakness',3:'Adequate public operating buffers',
          4:'Strong public funding and operating buffers',5:'Robust verified public downside buffers'}


def matched_history(values):
    cfo = {year: decimal(value) for year, value in values['cfo'].items()}
    capex = {year: decimal(value) for year, value in values['capex'].items()}
    require(cfo.keys() == capex.keys() and len(cfo) >= 3
            and all(value >= 0 for value in capex.values()), 'PUBLIC_HISTORY_NOT_COMPARABLE')
    return cfo, capex, {year: cfo[year]-capex[year] for year in sorted(cfo)}


def resilience(values):
    cash, short, debt, equity, assets, liabilities, ebit, interest = (
        decimal(values[k]) for k in MANDATORY['FH-STRESS'][:8])
    require(min(cash, short, debt, assets, interest) >= 0 and short <= debt and liabilities > 0,
            'INVALID_PUBLIC_BALANCE_SHEET')
    cfo, _, fcf = matched_history(values)
    latest_cfo, latest_capex = (decimal(values[k]) for k in ('latest_cfo', 'latest_capex'))
    require(latest_capex >= 0, 'INVALID_LATEST_CAPEX')
    surplus = latest_cfo - latest_capex
    funding = cash-short
    metrics = {'debtToEquity': str(debt/equity) if equity > 0 else None,
               'netDebtExcludingDeposits': str(debt-cash), 'cashMinusShortDebt': str(funding),
               'currentRatio': str(assets/liabilities), 'interestCoverage': str(ebit/interest) if interest else None,
               'lowestHistoricalFcf': str(min(fcf.values())), 'latestReportedFcf': str(surplus)}
    flags = ['REFINANCING_CAPACITY_UNVERIFIED'] if funding < 0 else []
    interest_covered = ebit >= interest
    liquid_current_assets = assets >= liabilities
    operating_support = all(v > 0 for v in cfo.values()) and latest_cfo > 0
    if equity <= 0 and not interest_covered and latest_cfo <= 0:
        points = 0
    elif not interest_covered or not operating_support:
        points = 1
    elif not (liquid_current_assets and min(fcf.values()) > 0 and surplus >= 0):
        points = 2
    elif funding < 0:
        points = 3
    else:
        points = 4
    # A positive book surplus is not proof of severe stress survival. 5 stays unavailable
    # until an approved severe scenario and documented response are added to the contract.
    return points, LABELS[points], metrics, flags


def reinvestment(values):
    _, capex, fcf = matched_history(values)
    last, previous = sorted(fcf)[-1], sorted(fcf)[-2]
    metrics = {'cashAfterInvestment': {y: str(x) for y, x in fcf.items()},
               'latestCapexVnd': str(capex[last]),
               'latestGoodwillIncreaseVnd': str(decimal(values['goodwill_increase']))}
    if min(fcf.values()) > 0 and capex[last] > capex[previous] and fcf[last] < fcf[previous]:
        return 1, 'Mixed company-level investment outcomes', metrics, ['POSITIVE_CASH_WITH_DECLINING_CONVERSION']
    # Aggregate financial outcomes alone cannot substantiate attribution of either extreme.
    return None, 'COMPANY_LEVEL_EVIDENCE_DOES_NOT_DISTINGUISH_ANCHORS', metrics, []


def evaluate_structural(rubric, anchors, sector, values, lineage, reviewed_values=None, reviewed_evidence=None):
    base = {'rubricId': rubric, 'methodologyVersion': VERSION, 'authority': 'NONE',
            'status': 'JUSTIFIED_N_R', 'score': None, 'anchor': None}
    if sector in FINANCIALS and rubric != 'CA-DIL':
        return {**base, 'reason': 'PUBLIC_FINANCIAL_SECTOR_EQUIVALENT_NOT_APPROVED'}
    if rubric not in MANDATORY:
        result = evaluate_proposed(rubric, anchors, sector, reviewed_values or {}, reviewed_evidence or {})
        return {**result, 'methodologyVersion': VERSION}
    missing = [field for field in MANDATORY[rubric] if field not in values or not lineage.get(field)]
    if missing:
        return {**base, 'reason': 'PUBLIC_COMPOSITE_INPUT_MISSING', 'missingFields': missing}
    points, reason, metrics, flags = (resilience if rubric == 'FH-STRESS' else reinvestment)(values)
    return {**base, 'score': points, 'status': 'PROPOSED_RESEARCH_SCORE' if points is not None else 'JUSTIFIED_N_R',
            'anchor': reason if points is not None else None, 'reason': reason,
            'metrics': metrics, 'separateRiskWarnings': flags,
            'nonCompensableRiskReview': 'OPEN' if 'REFINANCING_CAPACITY_UNVERIFIED' in flags else 'NO_CHANGE_TO_EXISTING_GATES',
            'confidence': 'CONSERVATIVE' if points is not None else 'LOW'}
