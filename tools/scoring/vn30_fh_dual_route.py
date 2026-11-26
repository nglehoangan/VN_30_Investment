#!/usr/bin/env python3
"""Execute the WP2 dual-route candidate in the existing serial research queue."""
import argparse
from html import escape
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from tools.scoring import vn30_fh_successor as wp2  # noqa: E402

DIR = ROOT / 'docs/fundamental-data-engine/fpt-financial-health/dual-route-v1.1'
IMPLEMENTATION = 'vn30-fh-dual-route-research-successor-v1'
EVALUATOR = 'tools/scoring/validate_fpt_fh_dual_route.mjs'


def replay(candidate, fd=None):
    expected = wp2.wp1.pinned(ROOT, candidate['result'])
    wp2.wp1.pinned(ROOT, candidate['evaluator'])
    call = subprocess.run(['node', EVALUATOR, '--ticker', candidate['subject']['ticker']], cwd=ROOT,
                          capture_output=True, pass_fds=() if fd is None else (fd,))
    wp2.wp1.require(call.returncode == 0 and call.stdout == expected, 'DUAL_ROUTE_EVALUATION_REPLAY_MISMATCH')
    return json.loads(call.stdout)


def prepare_assessment(result, wp1_rows, cutoff):
    prepared = wp2.prepare_assessment(result, wp1_rows, cutoff)
    prepared['routeQualifiers'] = [
        {'id': row['effectiveScore']['id'], 'annual': row['baseline']['routes'], 'current': row['current']['routes'],
         'selectedCurrent': row['current']['assessmentMethod'], 'reason': row['current']['routeSelectionReason']}
        for row in result['fh'][1:]
    ]
    return prepared


def render(scoring):
    aggregation = scoring['aggregation']
    coverage = aggregation['coverage']
    lines = [f"{row['id']}: {row['points'] if row['points'] is not None else 'N/R'} · {row['validity']}"
             for row in aggregation['effectiveScores']]
    lines += [f"{row['id']}: {row['reason']}" for row in scoring['routeQualifiers']]
    nr, outside = coverage['genuineNR'], coverage['outsideRollout']
    return ('<!doctype html><html lang="en"><meta charset="utf-8"><title>FPT FH dual-route research</title>'
            '<h1>FPT dual-route Financial Health research</h1><ul>' +
            ''.join('<li>' + escape(line) + '</li>' for line in lines) + '</ul>' +
            f'<p>Genuine N/R: {nr["count"]}, {nr["weight"]}/100 weight. '
            f'Outside completed rollout: {outside["count"]}, {outside["weight"]}/100 weight.</p></html>\n')


def execute(args, store):
    shared = wp2.wp1
    universe, request, wp1_candidate = shared.construct_candidate(args)
    candidate = shared.read(DIR / 'CANDIDATE.json')
    shared.require(candidate['implementation'] == IMPLEMENTATION and candidate['subject'] == wp1_candidate['subject'] and
                   candidate['scope'] == 'ISOLATED_BQ_FH_DUAL_ROUTE_VALIDATION_ONLY' and
                   candidate['evaluator']['path'] == EVALUATOR, 'DUAL_ROUTE_CANDIDATE_SCOPE_MISMATCH')
    for name in ('methodology', 'host', 'evaluator', 'result'):
        shared.pinned(ROOT, candidate[name])
    config = json.loads(shared.pinned(ROOT, candidate['methodology']))
    direction = shared.pinned(ROOT, config['owner']).decode()
    shared.require(config['status'] == 'APPROVED_BASELINE' and 'This task authorizes isolated research implementation' in direction
                   and not config['productionScoringAuthorized'] and not config['publicationAuthorized'],
                   'DUAL_ROUTE_RESEARCH_AUTHORITY_REQUIRED')

    prior = wp2.execute(args, store)
    shared.require(prior == json.loads(shared.pinned(ROOT, config['legacyWorkflow'])), 'LEGACY_WP2_WORKFLOW_CHANGED')
    prior_rows = next(row['result']['aggregation']['effectiveScores'] for row in prior['evidence'] if row['stage'] == 'SCORING')
    initial = replay(candidate)
    shared.require(initial['scope'] == 'REAL_ISSUER_RESEARCH' and initial['methodology'] == candidate['methodology'] and
                   initial['aggregation']['effectiveScores'][:5] == prior_rows[:5], 'ACCEPTED_BQ_OR_BS_CHANGED')
    request['parameters'] = {'category': 'FH', 'methodologyVersion': config['methodology'],
                             'priorAcceptedCategories': ['BQ'], 'executionScope': candidate['scope'],
                             'researchCandidateHash': shared.digest(candidate)}
    request['bindings'] = [{'kind': 'ASSESSMENT', 'subjectTicker': request['ticker'],
                            'reference': config['input']['path'], 'sha256': config['input']['sha256']}]
    context = shared.prepare(request, universe)
    rollout = shared.Rollout(store, universe)
    queue = rollout.plan([request])

    def work(job, checkpoint):
        steps = []
        def record(stage, payload):
            checkpoint(stage, payload)
            steps.append({'subjectTicker': job['request']['ticker'], 'stage': stage, 'result': payload})
        digest = shared.digest
        shared.require_input_identity(job, initial)
        shared.require(job['permissions'] == shared.PERMISSIONS and not any(job['permissions'].values()) and
                       job['request']['parameters']['researchCandidateHash'] == digest(candidate), 'DUAL_ROUTE_ISOLATION_REQUIRED')
        record('CANDIDATE', {'candidateHash': digest(candidate), 'route': candidate})
        prepared = prepare_assessment(initial, prior_rows[:4], args.cutoff)
        record('PREPARE', prepared)
        adoption = {'status': 'ADOPTED_FOR_ISOLATED_VALIDATION', 'executionId': job['executionId'],
                    'candidateHash': digest(candidate), 'prepareHash': digest(prepared), 'owner': config['owner'],
                    'formalAssessmentAdoptionGranted': False}
        record('ASSESSMENT_ADOPTION', adoption)
        for name in ('methodology', 'evaluator', 'result'):
            shared.pinned(ROOT, candidate[name])
        preflight = {'status': 'AUTHORIZED_FOR_ISOLATED_VALIDATION', 'adoptionHash': digest(adoption),
                     'evaluation': candidate['result'], 'permissions': shared.PERMISSIONS.copy()}
        record('PREFLIGHT', preflight)
        result = replay(candidate, fd=rollout.lock_fd)
        agg = result['aggregation']
        shared.require(prepare_assessment(result, prior_rows[:4], args.cutoff) == prepared and
                       not result['decisionEligible'] and not result['publicationAuthorized'] and
                       not result['investmentDecisionInput']['formalDecisionAuthorized'] and
                       all(agg[key] is None for key in ('formalScore','provisionalInvestmentScore',
                                                       'confirmedCurrentInvestmentScore')), 'DUAL_ROUTE_SCORE_PREFLIGHT_MISMATCH')
        scored = {'status': 'SCORED_RESEARCH_ONLY', 'preflightHash': digest(preflight),
                  **{key: result[key] for key in ('aggregation', 'researchRanking', 'investmentDecisionInput')},
                  'routeQualifiers': prepared['routeQualifiers']}
        record('SCORING', scored)
        record('RESEARCH_SCORECARD', {'format': 'text/html', 'html': render(scored)})
        return {'ticker': job['request']['ticker'], 'executionId': job['executionId'], 'status': 'COMPLETED',
                'blockers': [], 'evidence': steps}

    result = rollout.run_next(queue, shared.Worker(request['skill'], work, 'IDEMPOTENT'),
                              retry_ticker=context['request']['ticker'])
    shared.require(result is not None, 'DUAL_ROUTE_EXECUTION_RECEIPT_REQUIRED')
    return {'implementation': IMPLEMENTATION, 'queueId': queue, 'legacyExecutionId': prior['executionId'], **result}


def main():
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    for flag in ('ticker', 'cutoff', 'universe-version'):
        parser.add_argument('--' + flag, action=wp2.wp1.Once, required=True)
    args = parser.parse_args()
    try:
        with TemporaryDirectory(prefix='vn30-fh-dual-route-') as scratch:
            result = execute(args, Path(scratch))
    except (ValueError, KeyError, OSError) as error:
        result = {'status': 'BLOCKED', 'blockers': [str(error)]}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['status'] == 'COMPLETED' else 1


if __name__ == '__main__':
    sys.exit(main())
