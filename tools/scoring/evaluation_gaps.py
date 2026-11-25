"""Read-only evaluation feasibility register for the existing single-ticker Prepare."""

from tools.scoring.structural_nr import artifact, digest, require, source

CHECKS = {
    'M1_PREPARE': (
        'HISTORICAL_EVIDENCE', 'FINANCIAL_MAPPING', 'METRIC_COMPUTABILITY',
        'PIT_ADMISSIBILITY', 'RUBRIC_FEASIBILITY', 'VALUATION_READINESS', 'DECISION_DEPENDENCIES',
    ),
    'VALUATION': (
        'FINANCIAL_METRICS', 'SHARE_DENOMINATOR', 'ACTION_COMPARABILITY', 'CASH_FLOW_NORMALIZATION',
        'SECTOR_METHOD', 'ASSUMPTIONS', 'SCENARIOS_SENSITIVITY', 'DISCOUNT_AND_RETURN',
        'PIT_INTEGRITY', 'CONFIDENCE',
    ),
    'INVESTMENT_DECISION': (
        'SCORECARD_VALIDITY_CONFIDENCE', 'STAGE0_VETO', 'THESIS', 'VALUATION_FORWARD_RETURN',
        'RESIDUAL_RISK_HURDLE', 'OWNERSHIP_CONCENTRATION', 'OPPORTUNITY_COST',
        'TECHNICAL_OVERLAY', 'CASH_BOARD_LOT', 'DECISION_AUTHORIZATION',
    ),
}
CAUSES = {
    'DATA_MISSING', 'DATA_MAPPING_GAP', 'EVIDENCE_QUALIFICATION_GAP', 'METHODOLOGY_GAP',
    'INTERPRETATION_GAP', 'STRUCTURAL_DESIGN_GAP', 'LEGITIMATE_UNCERTAINTY',
}
CONSTRAINTS = {'EVIDENCE', 'MAPPING', 'RULE', 'HUMAN_JUDGMENT', 'ECONOMIC_UNCERTAINTY', 'GOVERNANCE'}
STATUSES = {'PASS', 'PASS WITH LIMITATIONS', 'BLOCKED'}
FUTURE = {'YES', 'NO', 'UNKNOWN'}
PACKET_FIELDS = {'contract', 'subject', 'reviewCounts', 'evidence', 'checks', 'gaps'}


def note(value):
    return isinstance(value, str) and bool(value.strip())


def evidence_ids(values, evidence):
    require(isinstance(values, list) and len(set(values)) == len(values)
            and set(values) <= evidence.keys(), 'UNKNOWN_OR_DUPLICATE_EVIDENCE_REFERENCE')


def review_annotations(gap):
    require(gap['primaryCause'] in CAUSES
            and set(gap['supportingCauses']) <= CAUSES - {gap['primaryCause']}
            and len(set(gap['supportingCauses'])) == len(gap['supportingCauses']), 'INVALID_GAP_CAUSE')
    require(gap['constraint'] in CONSTRAINTS and gap['outcome'] in ('RESOLVED', 'ESCALATED'),
            'INVALID_GAP_DISPOSITION')
    for field in ('requiredEvidence', 'missingEvidence', 'resolution', 'impact', 'owner', 'approval'):
        require(note(gap[field]), 'MISSING_GAP_' + field.upper())
    future = gap['futureDataTest']
    require(future['result'] in FUTURE and note(future['rationale']), 'FUTURE_DATA_TEST_REQUIRED')
    if future['result'] == 'NO' and gap['outcome'] == 'ESCALATED':
        require(gap['nextTrigger'] != 'SAME_FORMAT_ANNUAL_REPORT', 'STRUCTURAL_ESCALATION_REQUIRED')
    require(note(gap['nextTrigger']), 'REOPENING_TRIGGER_REQUIRED')
    require(type(gap['baselineChange']) is bool, 'BASELINE_IMPACT_FLAG_REQUIRED')
    if gap['baselineChange']:
        require(note(gap.get('changeRequest')) and gap['outcome'] == 'ESCALATED',
                'BASELINE_CHANGE_REQUIRES_CHANGE_REQUEST')
    if gap['component'] == 'VALUATION':
        answers = gap['valuationReview']
        require(set(answers) == {'existingEvidenceResolves', 'mappingOrTransformMissing',
                                 'approvedMethodAvailable', 'assumptionInherentlyUncertain'}
                and all(item['result'] in FUTURE and note(item['rationale'])
                        for item in answers.values()), 'VALUATION_REVIEW_REQUIRED')


def evaluate(job, packet):
    request = job['request']
    subject = {
        'ticker': request['ticker'], 'securityId': request['securityId'], 'sector': request['sector'],
        'cutoff': request['referenceDate'], 'universeVersion': request['universe']['version'],
        'purpose': request['purpose'],
    }
    require(isinstance(packet, dict) and set(packet) == PACKET_FIELDS, 'INVALID_EVALUATION_PACKET_FIELDS')
    require(packet['contract'] == 'structural-evaluation-gaps-v1' and packet['subject'] == subject,
            'EVALUATION_SUBJECT_MISMATCH')
    require(packet['reviewCounts'] == {'evidenceImprovement': 1, 'resolutionValidation': 1}
            and all(type(count) is int for count in packet['reviewCounts'].values()),
            'UNBOUNDED_OR_INCOMPLETE_EVALUATION_REVIEW')
    evidence = packet['evidence']
    for entry in evidence.values():
        require(entry['subjectTicker'] == subject['ticker'] and note(entry['locator']),
                'EVALUATION_EVIDENCE_IDENTITY_REQUIRED')
        if 'pointer' in entry:
            artifact(entry)
        else:
            source(entry)

    gaps = {}
    for gap in packet['gaps']:
        component, dependency = gap['component'], gap['dependency']
        expected_id = f"{subject['ticker']}:{subject['cutoff']}:{component}:{dependency}:{gap['key']}"
        require(component in CHECKS and dependency in CHECKS[component]
                and gap['id'] == expected_id and expected_id not in gaps, 'INVALID_OR_DUPLICATE_GAP_ID')
        require(gap['ticker'] == subject['ticker'] and note(gap['key']), 'GAP_TICKER_MISMATCH')
        review_annotations(gap)
        evidence_ids(gap['availableEvidence'], evidence)
        if gap['outcome'] == 'RESOLVED' and 'DATA_MAPPING_GAP' in (
                gap['primaryCause'], *gap['supportingCauses']):
            replay = gap.get('mappingReplay')
            require(replay and replay['rawEvidence'] in gap['availableEvidence']
                    and replay['mappedEvidence'] in gap['availableEvidence']
                    and replay['rawEvidence'] != replay['mappedEvidence']
                    and note(replay['validation']), 'MAPPING_RESOLUTION_REQUIRES_RAW_REPLAY')
        gaps[expected_id] = gap

    components = {}
    referenced = set()
    for component, dependencies in CHECKS.items():
        checks = packet['checks'][component]
        require(set(checks) == set(dependencies), 'INCOMPLETE_EVALUATION_CHECKS')
        statuses = set()
        for dependency, check in checks.items():
            status, links = check['status'], check['gaps']
            require(status in STATUSES and note(check['finding']), 'INVALID_EVALUATION_CHECK')
            evidence_ids(check['evidence'], evidence)
            require(check['evidence'], 'EVALUATION_CHECK_EVIDENCE_REQUIRED')
            require(len(set(links)) == len(links), 'DUPLICATE_GAP_LINK')
            for gap_id in links:
                gap = gaps[gap_id]
                require((gap['component'], gap['dependency']) == (component, dependency), 'MISPLACED_GAP')
                referenced.add(gap_id)
            unresolved = any(gaps[gap_id]['outcome'] == 'ESCALATED' for gap_id in links)
            require(unresolved == (status != 'PASS'), 'LIMITATION_REQUIRES_ESCALATION')
            statuses.add(status)
        components[component] = ('BLOCKED' if 'BLOCKED' in statuses else
                                 'PASS WITH LIMITATIONS' if 'PASS WITH LIMITATIONS' in statuses else 'PASS')
    require(set(packet['checks']) == set(CHECKS) and referenced == gaps.keys(), 'UNLINKED_EVALUATION_GAP')
    return {
        **packet, 'packetDigest': digest(packet), 'componentVerdicts': components,
        'authorityEffect': 'NONE', 'nativePrepareGatesApply': True,
    }
