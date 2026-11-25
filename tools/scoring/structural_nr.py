#!/usr/bin/env python3
"""Validate one final Structural N/R research packet and emit a read-only diagnostic."""
import argparse
from datetime import datetime
import json
from pathlib import Path
from zoneinfo import ZoneInfo
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'skills/vn30-rollout-orchestrator/scripts'))
from control import Universe, day, digest, prepare  # noqa: E402
from tools.maintenance.common import sha256_file  # noqa: E402

MARKET_ZONE = ZoneInfo('Asia/Ho_Chi_Minh')
SKILL = 'vn30-structural-nr-remediation'
CAUSES = {'DATA_MISSING', 'DATA_MAPPING_GAP', 'RUBRIC_DESIGN_GAP', 'EVIDENCE_INTERPRETATION_GAP'}
ACTIONS = {'RETAIN_NR', 'STRUCTURAL_ESCALATION', 'PROPOSE_INTERPRETATION',
           'PROPOSE_DESIGN', 'APPLY_APPROVED_ANCHORS', 'REPAIR_MAPPING'}
METHODOLOGY = 'src/domain/scoring/methodology.ts'


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def source(pin):
    path = (ROOT / pin['path']).resolve()
    require(path.is_relative_to(ROOT) and path.is_file(), 'INVALID_RETAINED_SOURCE_PATH')
    require(sha256_file(path) == pin['sha256'], 'RETAINED_SOURCE_HASH_MISMATCH')
    return path


def pointer(document, location):
    if location == '':
        return document
    require(location.startswith('/') and not re.search(r'~(?![01])', location), 'INVALID_JSON_POINTER')
    for token in location[1:].split('/'):
        token = token.replace('~1', '/').replace('~0', '~')
        if isinstance(document, list):
            require(re.fullmatch(r'0|[1-9][0-9]*', token), 'INVALID_ARRAY_INDEX')
            document = document[int(token)]
        else:
            require(isinstance(document, dict), 'INVALID_POINTER_TARGET')
            document = document[token]
    return document


def artifact(pin):
    return pointer(json.loads(source(pin).read_text()), pin.get('pointer', ''))


def baseline_gaps(baseline, request):
    record = artifact(baseline)
    require(record['ticker'] == request['ticker'], 'BASELINE_TICKER_MISMATCH')
    if 'subcategories' in record:
        require(record['securityId'] == request['securityId'], 'BASELINE_SECURITY_MISMATCH')
        cutoff = record['asOf'][:10]
        rows = [(r['id'], r['status'] == 'N/R', r['points']) for r in record['subcategories']]
    else:
        cutoff = record['cutoff']
        coverage = record['limitedCoverage']
        rows = [(r['rubricId'], r['state'] == 'NOT_RATED', r['points']) for r in coverage['dispositions']]
        require(set(coverage['unratedRubrics']) == {r[0] for r in rows if r[1]}
                and coverage['totalRubricCount'] - coverage['ratedRubricCount'] == len(rows)
                and coverage['fullOfficialScore'] is None, 'LIMITED_COVERAGE_MISMATCH')
    require(cutoff == request['referenceDate'], 'BASELINE_CUTOFF_MISMATCH')
    require(len({r[0] for r in rows}) == len(rows), 'DUPLICATE_BASELINE_RUBRIC')
    require(all(unrated == (points is None) for _, unrated, points in rows), 'BASELINE_NULL_MISMATCH')
    return {rubric for rubric, unrated, _ in rows if unrated}


def timestamp(value):
    instant = datetime.fromisoformat(value.replace('Z', '+00:00'))
    require(instant.tzinfo is not None and 'T' in value, 'ZONED_TIMESTAMP_REQUIRED')
    return instant


def check_rating(row, packet, rubric):
    result = row['disposition']
    state, points = result['state'], result['points']
    if state == 'N/R':
        require(points is None and not result.get('supportedBands'), 'NR_MUST_BE_NULL')
        require(row['status'] == 'ESCALATED' and row['blocker'].strip(), 'ESCALATION_REQUIRED')
        return

    require(state in ('VERIFIED', 'CONSERVATIVE') and row['status'] == 'RESOLVED'
            and not row['blocker'] and row['futureDataTest']['result'] != 'NO'
            and row['action'] in ('APPLY_APPROVED_ANCHORS', 'REPAIR_MAPPING')
            and 'RUBRIC_DESIGN_GAP' not in row['causes'], 'INVALID_RESEARCH_RESOLUTION')
    require(type(points) is int and result['supportedBands'], 'SUPPORTED_BAND_REQUIRED')
    bands = {band['label']: band for band in rubric['bands']}
    supported = [bands[label] for label in result['supportedBands']]
    require(len(set(result['supportedBands'])) == len(supported), 'DUPLICATE_BAND')
    if state == 'VERIFIED':
        require(len(supported) == 1 and supported[0]['min'] <= points <= supported[0]['max'],
                'VERIFIED_BAND_MISMATCH')
    else:
        require(points == min(band['min'] for band in supported), 'CONSERVATIVE_MUST_USE_LOWEST_BAND')

    # These are reviewed input claims, not a replacement for governed admission.
    review = result['review']
    source(review)
    require(review['locator'].strip() and result['bandRationale'].strip(), 'REVIEW_AND_BAND_RATIONALE_REQUIRED')
    require(result['scoreEvidence'], 'SCORE_EVIDENCE_REQUIRED')
    knowledge_cutoff = timestamp(packet['knowledgeCutoff'])
    knowledge_day = knowledge_cutoff.astimezone(MARKET_ZONE).date().isoformat()
    for fact in result['scoreEvidence']:
        source(fact)
        require(fact['ticker'] == packet['ticker'] and fact['locator'].strip()
                and fact['scope'].strip() and fact['unit'].strip()
                and day(fact['periodEnd']) <= day(packet['cutoff'])
                and timestamp(fact['knownAt']) <= knowledge_cutoff
                and day(fact['publicationDate']) <= knowledge_day,
                'EVIDENCE_IDENTITY_OR_TIME_MISMATCH')
        if packet['evidencePurpose'] == 'HISTORICAL_PIT':
            require(fact['eligibility'] == 'HISTORICAL_PIT'
                    and day(fact['publicationDate']) <= packet['cutoff'],
                    'HISTORICAL_PIT_EVIDENCE_REQUIRED')
        else:
            require(fact['eligibility'] in ('CURRENT_ONLY', 'HISTORICAL_PIT'),
                    'PROVISIONAL_EVIDENCE_INELIGIBLE')
    if 'DATA_MAPPING_GAP' in row['causes'] or row['action'] == 'REPAIR_MAPPING':
        require(row['action'] == 'REPAIR_MAPPING' and result.get('mappingChecks'), 'RAW_MAPPING_CHECK_REQUIRED')
        evidence_locations = {(fact['path'], fact['sha256'], fact['locator'])
                              for fact in result['scoreEvidence']}
        for check in result['mappingChecks']:
            raw, mapped = check['raw'], check['mapped']
            require((raw['path'], raw['sha256'], raw['pointer']) in evidence_locations
                    and raw['pointer'] and mapped['pointer'] and raw != mapped
                    and check['identityAndTransformReview'].strip()
                    and digest(artifact(raw)) == digest(artifact(mapped)),
                    'RAW_MAPPING_VALUE_OR_LINEAGE_MISMATCH')


def diagnose(context, packet):
    request = context['request']
    require(packet['contract'] == 'structural-nr-remediation-v1'
            and packet['ticker'] == request['ticker'] and packet['sector'] == request['sector']
            and packet['cutoff'] == request['referenceDate']
            and request['parameters'] == {'packetDigest': digest(packet)}, 'PACKET_BINDING_MISMATCH')
    knowledge_cutoff = timestamp(packet['knowledgeCutoff'])
    require(packet['evidencePurpose'] in ('CURRENT_FORMAL_VALUATION', 'HISTORICAL_PIT'),
            'INVALID_EVIDENCE_PURPOSE')
    if packet['evidencePurpose'] == 'HISTORICAL_PIT':
        require(knowledge_cutoff.astimezone(MARKET_ZONE).date().isoformat() == packet['cutoff'], 'PIT_CUTOFF_MISMATCH')
    for receipt in packet.get('baselineReceipts', []):
        source(receipt)
    gaps = baseline_gaps(packet['baseline'], request)
    require(packet['reviewCounts'] == {'evidenceImprovement': int(bool(gaps)),
                                      'resolutionValidation': int(bool(gaps))}, 'UNBOUNDED_OR_INCOMPLETE_REVIEW')
    rows = packet['rows']
    require(len(rows) == len(gaps) and {row['rubricId'] for row in rows} == gaps, 'INCOMPLETE_NR_AUDIT')
    require(packet['rubrics']['path'] == METHODOLOGY, 'RUBRIC_REGISTRY_REQUIRED')
    text = source(packet['rubrics']).read_text()
    start = text.index('export const RUBRICS = deepFreeze(') + len('export const RUBRICS = deepFreeze(')
    definitions, _ = json.JSONDecoder().raw_decode(text[start:])
    rubrics = {rubric['id']: rubric for rubric in definitions}
    for row in rows:
        causes = row['causes']
        future = row['futureDataTest']
        require(set(causes) <= CAUSES and len(set(causes)) == len(causes)
                and row['primaryCause'] in causes and row['diagnosis'].strip(), 'INVALID_CAUSE')
        require(future['result'] in ('YES', 'NO', 'UNKNOWN') and future['rationale'].strip()
                and row['evidence'] and row['validation'].strip(), 'FUTURE_DATA_REVIEW_REQUIRED')
        for evidence in row['evidence']:
            require(evidence['subjectTicker'] == packet['ticker'] and evidence['locator'].strip(),
                    'DIAGNOSTIC_EVIDENCE_SCOPE_REQUIRED')
            source(evidence)
        require(row['action'] in ACTIONS and row['plannedAction'].strip(), 'VALID_ACTION_REQUIRED')
        if future['result'] == 'NO':
            require(row['action'] == 'STRUCTURAL_ESCALATION' and row['status'] == 'ESCALATED',
                    'NO_REQUIRES_STRUCTURAL_ESCALATION')
        if row['action'] == 'PROPOSE_INTERPRETATION' or row.get('proposalVersion'):
            require('EVIDENCE_INTERPRETATION_GAP' in causes or 'RUBRIC_DESIGN_GAP' in causes,
                    'PROPOSAL_CAUSE_REQUIRED')
            require(row.get('proposalVersion') and row['approvalRequired']
                    and row['disposition']['state'] == 'N/R', 'VERSIONED_PROPOSAL_ONLY')
        if 'RUBRIC_DESIGN_GAP' in causes or row['action'] == 'PROPOSE_DESIGN':
            require('RUBRIC_DESIGN_GAP' in causes and row.get('proposalVersion') and row['approvalRequired']
                    and row['disposition']['state'] == 'N/R', 'DESIGN_CHANGE_PROPOSAL_ONLY')
        check_rating(row, packet, rubrics[row['rubricId']])
        require(type(row['approvalRequired']) is bool
                and (row['disposition']['state'] == 'N/R' or row['approvalRequired']),
                'BASELINE_CHANGE_REQUIRES_APPROVAL')

    return {**packet, 'executionId': context['executionId'], 'baselineNrCount': len(gaps),
            'permissions': context['permissions']}


def main():
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument('--ticker', action='append', required=True)
    parser.add_argument('--universe-version', required=True)
    parser.add_argument('--packet', type=Path, required=True)
    args = parser.parse_args()
    require(len(args.ticker) == 1, 'EXACTLY_ONE_TICKER_REQUIRED')
    packet = json.loads(args.packet.read_text())
    context = prepare({'skill': SKILL, 'ticker': args.ticker[0], 'sector': packet['sector'],
                       'referenceDate': packet['cutoff'], 'purpose': 'RETROSPECTIVE_RESEARCH',
                       'parameters': {'packetDigest': digest(packet)}}, Universe(args.universe_version))
    print(json.dumps(diagnose(context, packet), indent=2, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, IndexError, AttributeError, OSError, TypeError) as error:
        sys.exit(f'BLOCKED: {error}')
