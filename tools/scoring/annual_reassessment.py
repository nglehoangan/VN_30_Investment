"""Read-only SEGM v1.2 planning over pinned, reviewed evidence indexes."""

from decimal import Decimal, InvalidOperation
import json
from zoneinfo import ZoneInfo

from tools.scoring.structural_nr import METHODOLOGY, artifact, day, digest, require, source, timestamp

# Dependency routing only. The approved rubric registry supplies the anchors and weights.
RUBRIC_DEPENDENCIES = {
    'BQ-EQ': ('returns', 'earnings', 'financial_leverage'),
    'BQ-MOAT': ('competitive_position',),
    'BQ-CASH': ('cash_flow', 'earnings'),
    'BQ-RES': ('competitive_position', 'industry', 'earnings', 'stress'),
    'FH-BS': ('financial_leverage', 'funding', 'asset_quality'),
    'FH-LIQ': ('funding', 'cash_flow'),
    'FH-STRESS': ('stress', 'funding', 'financial_leverage', 'cash_flow', 'growth'),
    'GQ-HIST': ('growth', 'per_share_history', 'corporate_actions'),
    'GQ-FWD': ('growth', 'capital_allocation', 'funding'),
    'GQ-INC': ('returns', 'growth', 'capital_allocation'),
    'IC-IND': ('industry',),
    'IC-POS': ('competitive_position', 'industry'),
    'IC-CYCLE': ('industry', 'growth', 'stress'),
    'VAL-PRIMARY': ('earnings', 'cash_flow', 'financial_leverage', 'shares', 'corporate_actions', 'price', 'growth', 'discount', 'terminal', 'scenario'),
    'VAL-RET': ('earnings', 'cash_flow', 'financial_leverage', 'shares', 'corporate_actions', 'price', 'growth', 'discount', 'terminal', 'distributions', 'scenario'),
    'VAL-MOS': ('earnings', 'cash_flow', 'financial_leverage', 'shares', 'corporate_actions', 'price', 'growth', 'discount', 'terminal', 'scenario'),
    'RG-GOV': ('governance',),
    'RG-RISK': ('governance', 'stress', 'funding', 'financial_leverage', 'industry'),
    'RG-UNC': ('earnings', 'cash_flow', 'growth', 'discount', 'terminal', 'scenario', 'price', 'shares', 'corporate_actions', 'financial_leverage'),
    'CA-REINV': ('capital_allocation', 'returns'),
    'CA-DIST': ('distributions', 'cash_flow', 'funding'),
    'CA-DIL': ('shares', 'corporate_actions', 'capital_allocation'),
    'CA-PSV': ('per_share_history', 'shares', 'corporate_actions', 'capital_allocation', 'earnings', 'cash_flow'),
}
VALUATION = {key for name in ('VAL-PRIMARY', 'VAL-RET', 'VAL-MOS', 'RG-UNC') for key in RUBRIC_DEPENDENCIES[name]}
DECISION_INPUTS = {'thesis', 'risk', 'portfolio', 'opportunity_cost', 'stage0', 'veto', 'authorization'}
KEYS = {key for keys in RUBRIC_DEPENDENCIES.values() for key in keys} | DECISION_INPUTS
FY_REQUIRED = {'BQ-EQ', 'BQ-CASH', 'FH-BS', 'FH-LIQ', 'FH-STRESS', 'GQ-HIST', 'GQ-INC',
               'VAL-PRIMARY', 'VAL-RET', 'VAL-MOS', 'CA-REINV', 'CA-DIST', 'CA-PSV'}
LOCAL = ZoneInfo('Asia/Ho_Chi_Minh')


def _rubrics(pin):
    require(pin['path'] == METHODOLOGY, 'APPROVED_RUBRIC_REGISTRY_REQUIRED')
    text = source(pin).read_text().split('export const RUBRICS = deepFreeze(', 1)[1]
    definitions, _ = json.JSONDecoder().raw_decode(text)
    rubric_map = {row['id']: row for row in definitions}
    require(rubric_map.keys() == RUBRIC_DEPENDENCIES.keys(), 'RUBRIC_DEPENDENCY_MAP_INCOMPLETE')
    return rubric_map


def _identity(row, subject):
    require(all(row[k] == subject[k] for k in ('ticker', 'securityId')), 'FY_EVIDENCE_IDENTITY_MISMATCH')


def _clock(row, cutoff, knowledge, purpose, market=False):
    known = timestamp(row['knownAt'])
    published = timestamp(row['publishedAt']) if row['publishedAt'] else None
    require(published is None or published <= known, 'PUBLICATION_AFTER_KNOWLEDGE')
    require(row['eligibility'] in ('CURRENT_ONLY', 'HISTORICAL_PIT'), 'UNKNOWN_SOURCE_ELIGIBILITY')
    # A governed current assessment is later review metadata, rather than a financial release.
    current_review = (purpose == 'CURRENT_FORMAL_VALUATION' and row['eligibility'] == 'CURRENT_ONLY'
                      and row.get('normalization') == 'GOVERNED_ASSESSMENT_EVIDENCE'
                      and row.get('unit') == 'TEXT' and row.get('source') == row.get('admission'))
    return (day(row['periodEnd']) <= cutoff and known <= knowledge
            and (current_review or published is None or published.astimezone(LOCAL).date().isoformat() <= cutoff)
            and (purpose != 'HISTORICAL_PIT' or (row['eligibility'] == 'HISTORICAL_PIT' and published is not None
                 and known.astimezone(LOCAL).date().isoformat() <= cutoff))
            and (not market or day(row['periodEnd']) == cutoff))


def _snapshot(ref, subject, methodology, purpose, publication_proof=None):
    snap = artifact(ref)
    _identity(snap, subject)
    require(snap['sector'] == subject['sector'] and snap['methodology'] == methodology, 'FY_SNAPSHOT_SCOPE')
    cutoff, knowledge = day(snap['cutoff']), timestamp(snap['knownAt'])
    require(knowledge.astimezone(LOCAL).date().isoformat() >= cutoff, 'KNOWLEDGE_BEFORE_ECONOMIC_CUTOFF')
    if purpose == 'HISTORICAL_PIT':
        require(knowledge.astimezone(LOCAL).date().isoformat() == cutoff, 'PIT_CUTOFF_MISMATCH')
    eligible_fy = []
    proof = artifact(publication_proof) if publication_proof else None
    if proof:
        _identity(proof, subject)
        require(purpose == 'CURRENT_FORMAL_VALUATION' and proof['issuerUrl'].startswith('https://')
                and proof['documentTitle'].strip(), 'CURRENT_FY_PUBLICATION_PROOF_REQUIRED')
        targets = [row for row in snap['annualReports'] if row['statementVersion'] == proof['statementVersion']]
        require(len(targets) == 1 and targets[0]['source'] == proof['statementSource']
                and not targets[0]['publishedAt'] and targets[0]['eligibility'] == 'CURRENT_ONLY',
                'FY_PUBLICATION_PROOF_SCOPE_MISMATCH')
    for report in snap['annualReports']:
        if proof and report['statementVersion'] == proof['statementVersion']:
            report = {**report, 'publicationDateProof': publication_proof,
                      'publishedAt': day(proof['publicationDate']) + 'T23:59:59+07:00',
                      'publicationPrecision': 'DATE_ONLY_UPPER_BOUND'}
        _identity(report, subject)
        require(report['periodType'] == 'FY' and type(report['fiscalYear']) is int and int(day(report['periodEnd'])[:4]) == report['fiscalYear']
                and report['status'] in ('AUDITED_FINAL', 'FINAL', 'PROVISIONAL')
                and type(report['admitted']) is bool and type(report['revoked']) is bool
                and all(report[k] for k in ('statementVersion', 'metricVersions', 'normalization', 'corporateActionComparability')),
                'INVALID_FY_REPORT')
        if (report['publishedAt'] and timestamp(report['publishedAt']).astimezone(LOCAL).date().isoformat() <= cutoff
                and _clock(report, cutoff, knowledge, purpose) and report['admitted'] and not report['revoked']):
            source(report['source'])
            source(report['admission'])
            eligible_fy.append(report)
    annual = None
    final = [row for row in eligible_fy if row['status'] != 'PROVISIONAL']
    if final:
        ordering = lambda row: (row['fiscalYear'], timestamp(row['publishedAt']))
        best = max(final, key=ordering)
        peers = {digest(row) for row in final if ordering(row) == ordering(best)}
        require(len(peers) == 1, 'CONFLICTING_FINAL_FY_REVISION')
        annual = {'report': best, 'baselineHash': digest({'report': best, 'methodology': methodology})}
    evidence = {}
    seen = set()
    for row in snap['observations']:
        _identity(row, subject)
        key = row['dependency']
        require(key in KEYS and row['id'] not in seen and type(row['admitted']) is bool
                and type(row['revoked']) is bool and row['unit'] and row['scope'], 'INVALID_DEPENDENCY_OBSERVATION')
        seen.add(row['id'])
        if (_clock(row, cutoff, knowledge, purpose, key == 'price') and row['admitted']
                and not row['revoked'] and (not row.get('validThrough') or cutoff <= day(row['validThrough']))):
            source(row['source'])
            source(row['admission'])
            evidence.setdefault(key, {})[row['id']] = row
    return snap, annual, evidence, [r['statementVersion'] for r in eligible_fy if r['status'] == 'PROVISIONAL']


def reported_fcf(active, operands):
    """Reconstruct an as-reported metric from two matched, admitted observations."""
    cash = active.get('cash_flow', {})
    inputs = []
    for concept in ('CFO', 'ASSET_PURCHASE_CASH_OUTFLOW'):
        ref = operands[concept]
        observation = cash.get(ref['observationId'])
        require(observation is not None, 'FCF_OPERAND_NOT_ELIGIBLE')
        cell = artifact({**observation['source'], 'pointer': ref['pointer']})
        require(cell['concept'] == concept and cell['period']['end'] == observation['periodEnd']
                and all(cell[k] == observation[k] for k in ('ticker', 'unit', 'scope', 'value')),
                'FCF_OPERAND_LINEAGE_MISMATCH')
        inputs.append((observation, cell))
    (cfo, a), (capex, b) = inputs
    require(a['period'] == b['period'] and a['scope'] == b['scope'] and a['unit'] == b['unit'] == 'VND'
            and a['sourceHash'] == b['sourceHash'], 'FCF_OPERAND_BASIS_MISMATCH')
    operating, spending = Decimal(cfo['value']), Decimal(capex['value'])
    require(operating.is_finite() and spending.is_finite() and spending >= 0, 'INVALID_FCF_OPERAND')
    return {'value': str(operating - spending), 'unit': a['unit'], 'scope': a['scope'],
            'period': a['period'], 'normalization': 'AS_REPORTED_NOT_NORMALIZED',
            'inputs': operands, 'consumers': ['BQ-CASH', 'FH-STRESS', 'VAL-PRIMARY', 'VAL-RET', 'VAL-MOS', 'RG-UNC']}


def _assessment(row, rubric, active, cutoff, knowledge):
    if row is None:
        return False
    require(row['state'] in ('VERIFIED', 'CONSERVATIVE', 'N/R'), 'UNKNOWN_RUBRIC_DISPOSITION')
    require(row['rationale'] and row['bandReview'], 'RUBRIC_REVIEW_REQUIRED')
    # Substitutions need an existing authorized consumer; the diagnostic cannot approve a new proxy.
    require(not row.get('proxy') and not row.get('proxies'), 'PROXY_REQUIRES_GOVERNED_CONSUMER')
    source(row['review'])
    if row['state'] == 'N/R':
        require(row['points'] is None and row['band'] is None and row['rootCause'], 'NR_DISPOSITION_REQUIRED')
    else:
        bands = [b for b in rubric['bands'] if b['label'] == row['band']]
        require(len(bands) == 1 and type(row['points']) is int
                and bands[0]['min'] <= row['points'] <= bands[0]['max']
                and (row['state'] != 'CONSERVATIVE' or row['points'] == bands[0]['min']), 'UNSUPPORTED_SCORING_BAND')
        require(set(row['topics']) == set(rubric['topics']) and all(row['topics'].values()), 'REQUIRED_RUBRIC_TOPICS')
    ids = {id for refs in row['topics'].values() for id in refs}
    return ((bool(ids) or row['state'] == 'N/R') and ids <= active and cutoff <= day(row['validThrough'])
            and timestamp(row['reviewedAt']) <= timestamp(knowledge))


def assessment_basis(id, annual, active, methodology, scenarios):
    return digest({
        'annual': annual if id in FY_REQUIRED else None,
        'evidence': {k: active[k] for k in sorted(set(RUBRIC_DEPENDENCIES[id]) & active.keys())},
        'methodology': methodology,
        'assumptions': scenarios if id.startswith('VAL-') or id == 'RG-UNC' else None,
    })


def _outcome(previous, current):
    if previous is None:
        return 'REVIEW_REQUIRED'
    before, after = previous['points'], current['points']
    if before == after:
        return 'KEEP'
    if before is None:
        return 'N/R_TO_RATED'
    if after is None:
        return 'RATED_TO_N/R'
    return 'UPGRADE' if after > before else 'DOWNGRADE'


def _materiality(before, after):
    if not before or not after:
        return 'ELIGIBILITY_OR_AVAILABILITY_CHANGED'
    def semantics(rows):
        return sorted(digest({k: row[k] for k in ('value', 'unit', 'scope', 'normalization')}) for row in rows.values())
    if semantics(before) == semantics(after):
        return 'LINEAGE_OR_TIME_CHANGED'
    if len(before) == len(after) == 1:
        old, new = next(iter(before.values())), next(iter(after.values()))
        if all(old[k] == new[k] for k in ('unit', 'scope', 'normalization')):
            try:
                delta = Decimal(str(new['value'])) - Decimal(str(old['value']))
                if delta.is_finite():
                    return {'absoluteDelta': str(delta), 'unit': new['unit'], 'bandChange': 'REQUIRES_ASSESSMENT'}
            except (InvalidOperation, ValueError):
                pass
    return 'SEMANTICS_CHANGED'


def evaluate_annual(job, packet):
    req = job['request']
    subject = {k: req[k] for k in ('ticker', 'securityId', 'sector')}
    subject.update(cutoff=req['referenceDate'], universeVersion=req['universe']['version'])
    require(packet['contract'] == 'segm-annual-reassessment-v1' and packet['subject'] == subject, 'FY_PACKET_SUBJECT')
    purpose = packet['purpose']
    require(purpose in ('CURRENT_FORMAL_VALUATION', 'HISTORICAL_PIT'), 'UNKNOWN_FY_PURPOSE')
    methodology = packet['methodology']
    source(methodology)
    rubrics = _rubrics(packet['rubrics'])
    snap, annual, active, provisional = _snapshot(
        packet['current'], subject, methodology, purpose, packet.get('currentPublicationProof'))
    require(snap['cutoff'] == subject['cutoff'], 'FY_PACKET_CUTOFF')
    old, old_fy, old_active = None, None, {}
    if packet.get('prior'):
        old, old_fy, old_active, _ = _snapshot(packet['prior'], subject, methodology, purpose)
        require(day(old['cutoff']) < day(snap['cutoff']) and timestamp(old['knownAt']) <= timestamp(snap['knownAt']),
                'SUCCESSOR_CLOCK_ORDER')
        require(old['assessments'].keys() == rubrics.keys(), 'INCOMPLETE_PRIOR_RUBRIC_INVENTORY')
    require(snap['assessments'].keys() <= rubrics.keys(), 'UNKNOWN_RUBRIC')
    changed = {key for key in KEYS if digest(active.get(key, {})) != digest(old_active.get(key, {}))}
    annual_changed = annual != old_fy
    scenarios, old_scenarios = snap.get('valuationAssumptions'), (old or {}).get('valuationAssumptions')
    for assumptions in (scenarios, old_scenarios):
        if assumptions:
            source(assumptions)
    scenario_changed = scenarios != old_scenarios
    results = {}
    for id, rubric in rubrics.items():
        dependencies = set(RUBRIC_DEPENDENCIES[id])
        before = old['assessments'].get(id) if old else None
        current = snap['assessments'].get(id)
        ids = {id for key in dependencies for id in active.get(key, {})}
        impacted = bool(changed & dependencies) or (annual_changed and id in FY_REQUIRED) or (
            scenario_changed and (id.startswith('VAL-') or id == 'RG-UNC'))
        if before:
            prior_ids = {key for dep in dependencies for key in old_active.get(dep, {})}
            if not (_assessment(before, rubric, prior_ids, day(old['cutoff']), old['knownAt']) and
                    before['snapshotHash'] == assessment_basis(id, old_fy, old_active, methodology, old_scenarios)
                    and (old_fy is not None or id not in FY_REQUIRED)):
                before = None
        eligible = annual is not None or id not in FY_REQUIRED or (current or before or {}).get('state') == 'N/R'
        explicit = _assessment(current, rubric, ids, day(snap['cutoff']), snap['knownAt'])
        if explicit and eligible and current['snapshotHash'] == assessment_basis(id, annual, active, methodology, scenarios):
            outcome, assessment = _outcome(before, current), current
        elif before and not impacted and eligible and _assessment(before, rubric, ids, day(snap['cutoff']), snap['knownAt']):
            outcome, assessment = 'KEEP', before
        else:
            outcome, assessment = 'REVIEW_REQUIRED', None
        results[id] = {'outcome': outcome, 'assessment': assessment, 'impacted': impacted,
                       'changedDependencies': sorted(changed & dependencies)}
    state_counts = dict.fromkeys(('VERIFIED', 'CONSERVATIVE', 'N/R', 'REVIEW_REQUIRED'), 0)
    rated_points = rated_weight = 0
    for id, result in results.items():
        assessment = result['assessment']
        state_counts[assessment['state'] if assessment else 'REVIEW_REQUIRED'] += 1
        if assessment and assessment['points'] is not None:
            rated_points += assessment['points']
            rated_weight += rubrics[id]['max']
    valuation_dirty = bool(changed & VALUATION) or annual_changed or scenario_changed
    missing_valuation = [key for key in ('price', 'shares') if not active.get(key)]
    if not any(row['normalization'] in ('NORMALIZED_EPS', 'NORMALIZED_FCFE', 'NORMALIZED_FCF')
               for key in ('earnings', 'cash_flow') for row in active.get(key, {}).values()):
        missing_valuation.append('normalized_earnings_or_cash_flow')
    if not annual:
        missing_valuation.append('annualBaseline')
    if not scenarios:
        missing_valuation.append('valuationAssumptions')
    derived = {}
    if packet.get('reportedFcf'):
        try:
            derived['reportedFcf'] = reported_fcf(active, packet['reportedFcf'])
        except (ValueError, InvalidOperation, KeyError, OSError, TypeError) as error:
            derived['reportedFcf'] = {'status': 'BLOCKED', 'reason': str(error)}
    return {
        'sharedMetrics': derived,
        'status': 'PASS WITH LIMITATIONS' if not annual or any(r['outcome'] == 'REVIEW_REQUIRED' for r in results.values()) else 'PASS',
        'annualBaseline': annual, 'eligibleProvisionalVersions': provisional,
        'annualBaselineChanged': annual_changed, 'rubrics': results,
        'diagnosticCoverage': {'totalRubrics': len(rubrics), 'states': state_counts,
                               'ratedPoints': rated_points, 'ratedWeight': rated_weight,
                               'totalWeight': sum(r['max'] for r in rubrics.values())},
        'materiality': {key: _materiality(old_active.get(key), active.get(key)) for key in sorted(changed)},
        'valuation': {'reassess': valuation_dirty, 'assumptions': scenarios,
                      'status': 'BLOCKED' if missing_valuation else 'PASS WITH LIMITATIONS',
                      'missingInputs': missing_valuation,
                      'changedInputs': sorted(changed & VALUATION)},
        'decision': {'reassess': valuation_dirty or bool(changed & DECISION_INPUTS) or
                     any(r['impacted'] for r in results.values()), 'status': 'BLOCKED',
                     'changedInputs': sorted(changed & DECISION_INPUTS), 'authorizationRequired': True,
                     'reviewDependencies': sorted(DECISION_INPUTS | {'valuation', 'required_return'}), 'authorityEffect': 'NONE'},
        'authorityEffect': 'NONE', 'packetHash': digest(packet),
    }
