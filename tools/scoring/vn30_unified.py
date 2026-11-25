#!/usr/bin/env python3
"""Validate and persist a single-ticker research candidate using existing engines."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from tools.scoring.annual_reassessment import FY_REQUIRED, RUBRIC_DEPENDENCIES, _rubrics, _snapshot
from tools.scoring.structural_nr import artifact, digest, require, source, timestamp
from tools.scoring.vn30_prepare_evaluation import prepare_with_evaluation
from tools.scoring.vn30_score import Once, ROOT, execute, read, scope

REJECTIONS = {
    'INVALID_SOURCE', 'PIT_CONFLICT', 'FINANCIAL_SCOPE_CONFLICT', 'MAPPING_DEFECT',
    'METRIC_RECONSTRUCTION_DEFECT', 'UNAPPROVED_METHODOLOGY', 'UNSUPPORTED_SCORING_BAND',
    'INSUFFICIENT_ESSENTIAL_EVIDENCE', 'MATERIAL_COUNTER_EVIDENCE',
}


def persist(directory, payload):
    """Create an immutable content-addressed record, or verify an exact replay."""
    directory.mkdir(parents=True, exist_ok=True)
    payload_hash = digest(payload)
    destination = directory / (payload_hash + '.json')
    body = (json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=2) + '\n').encode()
    with tempfile.NamedTemporaryFile(dir=directory) as scratch:
        scratch.write(body)
        scratch.flush()
        try:
            os.link(scratch.name, destination)
        except FileExistsError:
            require(destination.read_bytes() == body, 'CANDIDATE_STORE_INTEGRITY_FAILURE')
    return destination, payload_hash


def classify(research, finding, scored, official, disposition):
    if scored is not None:
        require(scored == official or finding and scored == finding['points'],
                'EBCS_SCORE_WITHOUT_MATCHING_REVIEW')
        require(research is None or research == scored, 'REJECT_UNRECONCILED_RESEARCH_SCORE_CHANGE')
        return 'VALIDATED_CANDIDATE'
    require(disposition.get('reason') in REJECTIONS and disposition.get('detail', '').strip(),
            'SPECIFIC_REJECTION_REQUIRED')
    return ('METHODOLOGY_APPROVAL_REQUIRED' if disposition['reason'] == 'UNAPPROVED_METHODOLOGY'
            else 'REJECTED_WITH_SPECIFIC_REASON' if research is not None else 'JUSTIFIED_N_R')


def authorization_eligibility(route, candidate):
    """The native worker remains the verifier of authority and preflight."""
    if not route or not route.get('authorization') or not route.get('assessment'):
        return 'EXACT_CANDIDATE_AUTHORITY_REQUIRED'
    formal = artifact(route['assessment'])
    if formal['datasetHash'] != candidate['datasetHash'] or formal['input'] != candidate['input']:
        return 'EXACT_CANDIDATE_AUTHORITY_REQUIRED'
    return 'NATIVE_PREFLIGHT_REQUIRED'


def authority_requirements(route, candidate):
    if authorization_eligibility(route, candidate) == 'NATIVE_PREFLIGHT_REQUIRED':
        return []
    return ['EXACT_SUCCESSOR_LIMITED_SCOPE', 'ACCEPTED_EXACT_ASSESSMENT_AND_DATASET',
            'PINNED_PREPARATION_REVIEW', 'PINNED_CHALLENGE_REVIEW',
            'APPROVED_EXECUTABLE_FOR_SUCCESSOR', 'OWNER_APPROVAL_FOR_EXACT_PREFLIGHT']


def incremental_basis(config, args):
    """Diff the same-cutoff admitted indexes of a sealed candidate and its revision."""
    prior = config.get('incrementalFrom')
    if not prior:
        return None, None
    key = prior['candidateHash']
    require(len(key) == 64 and all(c in '0123456789abcdef' for c in key), 'INVALID_PREDECESSOR_HASH')
    baseline = read(args.store / (key + '.json'))
    require(digest(baseline) == key and baseline['subject'] == config['subject'], 'INCREMENTAL_PREDECESSOR_MISMATCH')
    previous_config = artifact(prior['input'])
    require(digest(previous_config) == baseline['packetHash'], 'INCREMENTAL_PREDECESSOR_INPUT_MISMATCH')
    before, after = (artifact(c['annual']) for c in (previous_config, config))
    require(all(before[field] == after[field] for field in ('subject', 'purpose', 'methodology', 'rubrics')),
            'INCREMENTAL_BASIS_CHANGED')
    indexes = [_snapshot(p['current'], p['subject'], p['methodology'], p['purpose'],
                         p.get('currentPublicationProof')) for p in (before, after)]
    (old, old_fy, old_data, _), (new, new_fy, new_data, _) = indexes
    require(old['cutoff'] == new['cutoff'] == config['subject']['referenceDate']
            and timestamp(old['knownAt']) <= timestamp(new['knownAt']), 'INCREMENTAL_CLOCK_MISMATCH')
    changed = {dep for dep in old_data.keys() | new_data.keys()
               if digest(old_data.get(dep, {})) != digest(new_data.get(dep, {}))}
    affected = {rid for rid, deps in RUBRIC_DEPENDENCIES.items() if changed.intersection(deps)}
    if old_fy != new_fy:
        affected.update(FY_REQUIRED)
    if old.get('valuationAssumptions') != new.get('valuationAssumptions'):
        affected.update(rid for rid in RUBRIC_DEPENDENCIES if rid.startswith('VAL-') or rid == 'RG-UNC')
    require(affected, 'NO_ELIGIBLE_INCREMENTAL_CHANGE')
    prior_candidate = artifact(baseline['sourceCandidate'])
    return baseline, {
        'predecessorHash': key, 'changedDependencies': sorted(changed), 'affectedRubrics': sorted(affected),
        'basisHash': digest({'observations': new_data, 'annual': new_fy, 'scenarios': new.get('valuationAssumptions')}),
        'observationChanges': {
            dep: {'previousHash': digest(old_data.get(dep, {})), 'currentHash': digest(new_data.get(dep, {}))}
            for dep in sorted(changed)
        },
        'affectedMetrics': ['reportedFcf'] if 'cash_flow' in changed and after.get('reportedFcf') else [],
        'priorAssessmentHashes': {a['subcategory']: digest(a) for a in prior_candidate['input']['assessments']},
    }


def reconcile(args):
    _, _, job, route = scope(args)
    request = job['request']
    config = read(args.packet)
    require(config['contract'] == 'vn30-unified-scoring-input-v1'
            and config['subject'] == {k: request[k] for k in ('ticker', 'securityId', 'sector', 'referenceDate')},
            'UNIFIED_SUBJECT_MISMATCH')
    predecessor, incremental = incremental_basis(config, args)
    args.annual_reassessment = source(config['annual'])
    args.rubric_completion = source(config['diagnosis'])
    args.research_bridge = True
    prep = prepare_with_evaluation(args)
    bridge = prep['researchScoringBridge']
    require(bridge['status'] != 'BLOCKED', bridge.get('reason', 'UNIFIED_BRIDGE_BLOCKED'))
    annual = prep['annualReassessment']
    require(annual['annualBaseline'] is not None, 'ELIGIBLE_FY_BASELINE_REQUIRED')
    registry = artifact(config['annual'])['rubrics']
    definitions = _rubrics(registry)
    handoff = artifact(config['handoff'])
    require(all(handoff['context'][key] == request[key] for key in ('ticker', 'securityId'))
            and handoff['context']['economicCutoff'] == args.cutoff, 'RESEARCH_HANDOFF_SCOPE_MISMATCH')
    research = {row['rubricId']: row for row in handoff['rubrics']}
    require(len(handoff['rubrics']) == len(definitions) and research.keys() == definitions.keys(),
            'RESEARCH_RUBRIC_INVENTORY_MISMATCH')
    candidate_path = source(config['candidate'])
    candidate_bytes = candidate_path.read_bytes()
    candidate = json.loads(candidate_bytes)
    require(candidate.get('authority') == 'CANDIDATE_VALIDATION_ONLY' and not candidate['historicalPitGranted']
            and candidate['baseline']['id'] == bridge['baselineId']
            and candidate['baseline']['bodyHash'] == bridge['baselineHash']
            and candidate['input']['securityId'] == request['securityId']
            and candidate['input']['normalization']['sector'] == request['sector'], 'CANDIDATE_SCOPE_MISMATCH')
    result = subprocess.run(['node', str(ROOT / 'tools/scoring/vn30_ebcs_preview.mjs'),
                             '--ticker', args.ticker, '--cutoff', args.cutoff, '--input', str(candidate_path)],
                            cwd=ROOT, capture_output=True, text=True)
    require(result.returncode == 0, result.stderr.strip() or 'EBCS_EXECUTION_FAILED')
    preview = json.loads(result.stdout)
    require(preview['packetSha256'] == config['candidate']['sha256'] == hashlib.sha256(candidate_bytes).hexdigest()
            and preview['status'] == 'RESEARCH_ONLY' and preview['fullOfficialScore'] is None,
            'EBCS_PREVIEW_AUTHORITY_OR_HASH_MISMATCH')
    scores = {row['rubricId']: row for row in preview['rubrics']}
    rows = []
    report = annual['annualBaseline']['report']
    assessments = {a['subcategory']: a for a in candidate['input']['assessments']}
    evidence = {e['id']: e for e in candidate['input']['evidence']}
    for finding in bridge['rows']:
        rid = finding['rubricId']
        row = research[rid]
        require(row['requiredFormalTopics'] == definitions[rid]['topics'], 'RESEARCH_ANCHOR_MISMATCH')
        for ref in row['researchEvidence']:
            pinned = source(ref)
            if ref.get('locator'):
                require(ref['locator'] in pinned.read_text(), 'RESEARCH_LOCATOR_MISMATCH')
        scored = scores[rid]['points']
        official = finding['officialPoints']
        proposed = finding['candidate']
        fy = row['researchFY2025']['points']
        interim = row['researchUpdate9M2026']['points']
        disposition = config['dispositions'].get(rid, {})
        status = classify(fy, proposed, scored, official, disposition)
        assessment = assessments.get(rid, {})
        refs = {ref for topic in assessment.get('evidence', []) for ref in topic['refs']}
        counters = assessment.get('disconfirmingEvidence', [])
        clocks = [evidence[ref] for ref in sorted(refs | set(counters))]
        rows.append({
            'contract': 'vn30-unified-rubric-evidence-v1', 'ticker': args.ticker,
            'analysisCutoff': args.cutoff, 'rubricId': rid, 'researchScore': fy, 'interimResearchScore': interim,
            'proposedScore': assessment.get('selectedPoints'), 'acceptedScore': scored, 'officialScore': official,
            'anchorVersion': registry['sha256'], 'methodologyVersion': preview['methodology'],
            'sourceIdentifiers': row['researchEvidence'], 'assessmentSources': clocks,
            'reportingPeriods': [dict(start='2025-01-01', end=report['periodEnd'])],
            'publishedAt': report['publishedAt'], 'knownAt': report['knownAt'],
            'financialScope': report['normalization'], 'ftelComparability': disposition.get('comparability', 'REVIEWED_FOR_SELECTED_TOPIC'),
            'normalizedMetrics': [], 'reportedMetrics': {k: v for k, v in annual['sharedMetrics'].items()
                                                       if rid in v.get('consumers', [])},
            'evidenceAdmissionState': 'VALIDATED_PREVIEW_ONLY' if scored is not None else 'NOT_ACCEPTED_FOR_SCORE',
            'counterEvidence': counters, 'segmFeasibilityState': status, 'segmRootCause': finding['cause'],
            'segmEvidence': finding['evidence'], 'approvedAlternativeMethod': None,
            'confidence': candidate['input']['confidence']['level'], 'validationOutcome': scores[rid]['state'],
            'authorizationState': 'EXISTING_OFFICIAL' if official is not None else 'NO_SUCCESSOR_AUTHORITY',
            'disposition': disposition, 'dependencies': list(RUBRIC_DEPENDENCIES[rid]),
            'interimOutcome': ('N/R_TO_RATED' if fy is None and scored is not None else
                               'KEEP' if scored is not None or fy is None else
                               'RATED_TO_N/R' if interim is None else 'REVIEW_REQUIRED'),
        })
    payload = {'contract': 'vn30-unified-scoring-candidate-v1', 'subject': config['subject'],
               'packetHash': digest(config), 'inputHash': preview['inputHash'], 'datasetHash': candidate['datasetHash'],
               'sourceCandidate': config['candidate'], 'baselineId': bridge['baselineId'], 'baselineHash': bridge['baselineHash'],
               'annualBaseline': annual['annualBaseline'], 'segmReuse': {'packetHash': prep['rubricCompletion']['packetHash'],
                 'discoveryCalls': 0, 'targetedDependencyMap': RUBRIC_DEPENDENCIES},
               'valuation': annual['valuation'], 'decision': annual['decision'], 'rows': rows,
               'coverage': {k: preview[k] for k in ('confirmedScore', 'ratedMaxPoints', 'ratedRubricCount', 'unratedRubrics')},
               'fullOfficialScore': None, 'publicationAuthorization': 'SEPARATE_REQUIRED'}
    if incremental:
        prior_hashes = incremental.pop('priorAssessmentHashes')
        affected = set(incremental['affectedRubrics'])
        prior_rows = {r['rubricId']: r for r in predecessor['rows']}
        for row in rows:
            rid = row['rubricId']
            old = prior_rows[rid]
            if rid not in affected:
                require(row == old, 'UNAFFECTED_RUBRIC_CHANGED:' + rid)
            elif row['acceptedScore'] is not None:
                require(incremental['basisHash'] == config.get('reviewedIncrementalBasis')
                        and digest(assessments[rid]) != prior_hashes.get(rid)
                        and annual['rubrics'][rid]['assessment'] is not None,
                        'AFFECTED_RUBRIC_REVIEW_REQUIRED:' + rid)
        payload['incremental'] = incremental
    path, key = persist(args.store, payload)
    eligibility = authorization_eligibility(route, candidate)
    receipt = {'status': 'VALIDATED_CANDIDATE', 'candidateHash': key, 'path': str(path),
               'officialEligibility': eligibility, 'publication': 'SEPARATE_AUTHORITY_REQUIRED'}
    if eligibility != 'NATIVE_PREFLIGHT_REQUIRED':
        receipt['missingRequirements'] = authority_requirements(route, candidate)
    if args.execute_official:
        if eligibility != 'NATIVE_PREFLIGHT_REQUIRED':
            return {**receipt, 'status': 'BLOCKED', 'reason': eligibility}
        args.mode = 'check'
        check = execute(args)
        require(check['request']['parameters']['routeHash'] == digest(route), 'SCORING_ROUTE_CHANGED')
        require(check['status'] == 'READY', 'NATIVE_PREFLIGHT_BLOCKED:' + ','.join(check['blockers']))
        # The sealed controller owns official execution. Do not dispatch another
        # route implicitly if its registry changes after this candidate check.
        receipt['officialEligibility'] = 'READY_FOR_EXPLICIT_NATIVE_SCORING'
    return receipt


def main():
    p = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    for flag in ('ticker', 'cutoff', 'universe-version'):
        p.add_argument('--' + flag, required=True, action=Once)
    for flag in ('packet', 'store'):
        p.add_argument('--' + flag, required=True, type=Path, action=Once)
    p.add_argument('--execute-official', action='store_true')
    p.set_defaults(mode='prepare', candidate=None, previous_proposal=None)
    try:
        result = reconcile(p.parse_args())
        print(json.dumps(result, ensure_ascii=False))
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(json.dumps({'status': 'BLOCKED', 'reason': str(error)}))
        return 1
    return int(result['status'] == 'BLOCKED')


if __name__ == '__main__':
    sys.exit(main())
