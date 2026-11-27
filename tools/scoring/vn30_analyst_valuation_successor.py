#!/usr/bin/env python3
"""Execute the WP5 v2.0 analyst valuation candidate in the existing serial research queue."""
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
from tools.scoring import vn30_bounded_return_successor as wp512  # noqa: E402

shared = wp512.wp511.wp5.wp4.wp3.wp2.wp2.wp1

DIR = ROOT / 'docs/fundamental-data-engine/fpt-valuation-forward-return/v2.0'
IMPLEMENTATION = 'vn30-val-research-successor-v2.0'
EVALUATOR = 'tools/scoring/validate_fpt_analyst_valuation.mjs'


def replay(candidate, fd=None):
    expected = shared.pinned(ROOT, candidate['result'])
    shared.pinned(ROOT, candidate['evaluator'])
    call = subprocess.run(['node', EVALUATOR, '--ticker', candidate['subject']['ticker']], cwd=ROOT,
                          capture_output=True, pass_fds=() if fd is None else (fd,))
    shared.require(call.returncode == 0 and call.stdout == expected, 'VALUATION_EVALUATION_REPLAY_MISMATCH')
    return json.loads(call.stdout)


def execute(args, store):
    universe, request, wp1_candidate = shared.construct_candidate(args)
    candidate = shared.read(DIR / 'CANDIDATE.json')
    shared.require(candidate['implementation'] == IMPLEMENTATION and candidate['subject'] == wp1_candidate['subject'] and
                   candidate['scope'] == 'ISOLATED_BQ_FH_GQ_IC_VAL_VALIDATION_ONLY' and
                   candidate['evaluator']['path'] == EVALUATOR, 'VALUATION_CANDIDATE_SCOPE_MISMATCH')
    for name in ('methodology', 'host', 'evaluator', 'result'):
        shared.pinned(ROOT, candidate[name])
    config = json.loads(shared.pinned(ROOT, candidate['methodology']))
    direction = shared.pinned(ROOT, config['owner']).decode()
    shared.require(config['status'] == 'APPROVED_BASELINE' and 'owner approves the transition' in direction
                   and not config['productionScoringAuthorized'] and not config['publicationAuthorized'],
                   'VALUATION_RESEARCH_AUTHORITY_REQUIRED')

    prior = wp512.execute(args, store)
    shared.require(prior == json.loads(shared.pinned(ROOT, config['legacyWorkflow'])), 'LEGACY_WP5_V12_WORKFLOW_CHANGED')
    retained_rows = next(row['result']['aggregation']['effectiveScores'] for row in prior['evidence'] if row['stage'] == 'SCORING')
    prior_rows = retained_rows[:13]
    initial = replay(candidate)
    shared.require(initial['scope'] == 'REAL_ISSUER_RESEARCH' and initial['methodology'] == candidate['methodology'] and
                   initial['aggregation']['effectiveScores'][:13] == prior_rows, 'ACCEPTED_BQ_FH_GQ_IC_CHANGED')
    request['parameters'] = {'category': 'VAL', 'methodologyVersion': config['methodology'],
                             'priorAcceptedCategories': ['BQ', 'FH', 'GQ', 'IC'], 'executionScope': candidate['scope'],
                             'researchCandidateHash': shared.digest(candidate)}
    request['bindings'] = [{'kind': 'ASSESSMENT', 'subjectTicker': request['ticker'],
                            'reference': candidate['methodology']['path'], 'sha256': candidate['methodology']['sha256']}]
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
                       job['request']['parameters']['researchCandidateHash'] == digest(candidate), 'VALUATION_ISOLATION_REQUIRED')
        record('CANDIDATE', {'candidateHash': digest(candidate), 'route': candidate})
        record('DATA_FREEZE', {key: item['pins']['freeze'] for key, item in initial['products'].items()})
        record('ANALYST_PROPOSAL', {key: item['pins']['initial'] for key, item in initial['products'].items()})
        record('INITIAL_REASONABLENESS_REVIEW', {key: item['pins']['initialReview'] for key, item in initial['products'].items()})
        record('ANALYST_REVISION', {key: item['pins']['revision'] for key, item in initial['products'].items()
                                    if 'revision' in item['pins']})
        record('FINAL_REASONABLENESS_REVIEW', {key: item['pins']['finalReview'] for key, item in initial['products'].items()})
        record('EXECUTABLE_VALIDATION', {'result': candidate['result'], 'products': initial['products']})
        prepared = wp512.prepare_assessment(initial, prior_rows, args.cutoff)
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
        shared.require(wp512.prepare_assessment(result, prior_rows, args.cutoff) == prepared and
                       not result['decisionEligible'] and not result['publicationAuthorized'] and
                       not result['investmentDecisionInput']['formalDecisionAuthorized'] and
                       all(agg[key] is None for key in ('formalScore','provisionalInvestmentScore',
                                                       'confirmedCurrentInvestmentScore')), 'VALUATION_SCORE_PREFLIGHT_MISMATCH')
        scored = {'status': 'SCORED_RESEARCH_ONLY', 'preflightHash': digest(preflight),
                  **{key: result[key] for key in ('aggregation', 'researchRanking', 'investmentDecisionInput')},
                  'routeQualifiers': prepared['routeQualifiers']}
        record('SCORING', scored)
        scorecard = wp512.render(scored).rstrip().removesuffix('</html>')
        table = ['<h2>Valuation by assessment period</h2><table><thead><tr><th>Period</th>'
                 '<th>Rubric</th><th>Method</th><th>Points</th><th>Review</th></tr></thead><tbody>']
        for period, rows in result['valuation'].items():
            for row in rows:
                route = row['routeQualification']
                points = row['points'] if row['points'] is not None else 'N/R'
                cells = [period, row['id'], route['route'] or 'N/R', points, route['disposition'] or 'N/R']
                table.append('<tr>' + ''.join(f'<td>{escape(str(cell))}</td>' for cell in cells) + '</tr>')
        table.append('</tbody></table></html>\n')
        record('RESEARCH_SCORECARD', {'format': 'text/html', 'html': scorecard + ''.join(table)})
        return {'ticker': job['request']['ticker'], 'executionId': job['executionId'], 'status': 'COMPLETED',
                'blockers': [], 'evidence': steps}

    result = rollout.run_next(queue, shared.Worker(request['skill'], work, 'IDEMPOTENT'),
                              retry_ticker=context['request']['ticker'])
    shared.require(result is not None, 'VALUATION_EXECUTION_RECEIPT_REQUIRED')
    return {'implementation': IMPLEMENTATION, 'queueId': queue, 'legacyExecutionId': prior['executionId'], **result}


def main():
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    for flag in ('ticker', 'cutoff', 'universe-version'):
        parser.add_argument('--' + flag, action=shared.Once, required=True)
    args = parser.parse_args()
    try:
        with TemporaryDirectory(prefix='vn30-wp5-v20-') as scratch:
            result = execute(args, Path(scratch))
    except (ValueError, KeyError, OSError) as error:
        result = {'status': 'BLOCKED', 'blockers': [str(error)]}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['status'] == 'COMPLETED' else 1


if __name__ == '__main__':
    sys.exit(main())
