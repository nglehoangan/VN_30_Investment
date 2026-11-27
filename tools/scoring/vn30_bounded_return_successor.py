#!/usr/bin/env python3
"""Execute the WP5 v1.2 bounded return candidate in the existing serial research queue."""
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
from tools.scoring import vn30_val_v11_successor as wp511  # noqa: E402

DIR = ROOT / 'docs/fundamental-data-engine/fpt-valuation-forward-return/v1.2'
IMPLEMENTATION = 'vn30-val-research-successor-v1.2'
EVALUATOR = 'tools/scoring/validate_fpt_bounded_return.mjs'


def replay(candidate, fd=None):
    expected = wp511.wp5.wp4.wp3.wp2.wp2.wp1.pinned(ROOT, candidate['result'])
    wp511.wp5.wp4.wp3.wp2.wp2.wp1.pinned(ROOT, candidate['evaluator'])
    call = subprocess.run(['node', EVALUATOR, '--ticker', candidate['subject']['ticker']], cwd=ROOT,
                          capture_output=True, pass_fds=() if fd is None else (fd,))
    wp511.wp5.wp4.wp3.wp2.wp2.wp1.require(call.returncode == 0 and call.stdout == expected, 'VALUATION_EVALUATION_REPLAY_MISMATCH')
    return json.loads(call.stdout)


def prepare_assessment(result, accepted, cutoff):
    shared = wp511.wp5.wp4.wp3.wp2.wp2.wp1
    agg = result['aggregation']
    rows = agg['effectiveScores']
    current = result['valuation']['current']
    annual = result['valuation']['annual']
    shared.require(rows[:13] == accepted and rows[13:] == current and
                   tuple(row['id'] for row in current) == ('VAL-PRIMARY', 'VAL-RET', 'VAL-MOS') and
                   all(row['reviewCutoff'] == cutoff for row in rows) and len(agg['outsideRollout']) == 7,
                   'VALUATION_PREPARE_SCOPE_MISMATCH')
    for row in current:
        qualification = row['routeQualification']
        shared.require(qualification['marketDate'] == cutoff and not qualification['synthetic'] and
                       (row['points'] is None and row['validity'] == 'N/R' and
                        all(route['gaps'] for route in row['routes'].values()) or
                        row['points'] is not None and row['basis'] == 'RECALCULATED_AT_CUTOFF' and
                        row['validity'] == 'CONFIRMED_CURRENT'), 'VALUATION_INELIGIBLE_EFFECTIVE_SCORE')
    return {'status': 'PREPARED_BQ_FH_GQ_IC_VAL', 'effectiveScores': rows, 'coverage': agg['coverage'],
            'routeQualifiers': [
                {'id': row['id'], 'annual': historic['routes'], 'current': row['routes'],
                 'selectedCurrent': row['routeQualification']['route'], 'reason': row['validity']}
                for historic, row in zip(annual, current, strict=True)
            ], 'effectiveRouteQualifications': agg['routeQualifications']}

def render(scoring):
    aggregation = scoring['aggregation']
    coverage = aggregation['coverage']
    lines = [f"{row['id']}: {row['points'] if row['points'] is not None else 'N/R'} · {row['validity']}"
             for row in aggregation['effectiveScores']]
    lines += [f"{row['id']}: {row['selectedCurrent']} · {row['reason']}" for row in scoring['routeQualifiers']]
    nr, outside = coverage['genuineNR'], coverage['outsideRollout']
    return ('<!doctype html><html lang="en"><meta charset="utf-8"><title>FPT BQ FH GQ IC VAL research</title>'
            '<h1>FPT cumulative BQ, FH, GQ, IC and VAL research</h1><ul>' +
            ''.join('<li>' + escape(line) + '</li>' for line in lines) + '</ul>' +
            f'<p>Genuine N/R: {nr["count"]}, {nr["weight"]}/100 weight. '
            f'Analyst bands describe route-specific profiles. Cross-route cardinal equivalence is unvalidated. '
            f'Outside completed rollout: {outside["count"]}, {outside["weight"]}/100 weight.</p></html>\n')


def execute(args, store):
    shared = wp511.wp5.wp4.wp3.wp2.wp2.wp1
    universe, request, wp1_candidate = shared.construct_candidate(args)
    candidate = shared.read(DIR / 'CANDIDATE.json')
    shared.require(candidate['implementation'] == IMPLEMENTATION and candidate['subject'] == wp1_candidate['subject'] and
                   candidate['scope'] == 'ISOLATED_BQ_FH_GQ_IC_VAL_VALIDATION_ONLY' and
                   candidate['evaluator']['path'] == EVALUATOR, 'VALUATION_CANDIDATE_SCOPE_MISMATCH')
    for name in ('methodology', 'host', 'evaluator', 'result'):
        shared.pinned(ROOT, candidate[name])
    config = json.loads(shared.pinned(ROOT, candidate['methodology']))
    direction = shared.pinned(ROOT, config['owner']).decode()
    shared.require(config['status'] == 'APPROVED_BASELINE' and 'owner approves a bounded reassessment of VAL-RET' in direction
                   and not config['productionScoringAuthorized'] and not config['publicationAuthorized'],
                   'VALUATION_RESEARCH_AUTHORITY_REQUIRED')

    prior = wp511.execute(args, store)
    shared.require(prior == json.loads(shared.pinned(ROOT, config['legacyWorkflow'])), 'LEGACY_WP5_V11_WORKFLOW_CHANGED')
    retained_rows = next(row['result']['aggregation']['effectiveScores'] for row in prior['evidence'] if row['stage'] == 'SCORING')
    prior_rows = retained_rows[:13]
    initial = replay(candidate)
    shared.require(initial['scope'] == 'REAL_ISSUER_RESEARCH' and initial['methodology'] == candidate['methodology'] and
                   initial['aggregation']['effectiveScores'][:13] == prior_rows and
                   initial['aggregation']['effectiveScores'][13] == retained_rows[13] and
                   initial['aggregation']['effectiveScores'][15] == retained_rows[15], 'ACCEPTED_BQ_FH_GQ_IC_CHANGED')
    request['parameters'] = {'category': 'VAL', 'methodologyVersion': config['methodology'],
                             'priorAcceptedCategories': ['BQ', 'FH', 'GQ', 'IC'], 'executionScope': candidate['scope'],
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
                       job['request']['parameters']['researchCandidateHash'] == digest(candidate), 'VALUATION_ISOLATION_REQUIRED')
        record('CANDIDATE', {'candidateHash': digest(candidate), 'route': candidate})
        prepared = prepare_assessment(initial, prior_rows, args.cutoff)
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
        shared.require(prepare_assessment(result, prior_rows, args.cutoff) == prepared and
                       not result['decisionEligible'] and not result['publicationAuthorized'] and
                       not result['investmentDecisionInput']['formalDecisionAuthorized'] and
                       all(agg[key] is None for key in ('formalScore','provisionalInvestmentScore',
                                                       'confirmedCurrentInvestmentScore')), 'VALUATION_SCORE_PREFLIGHT_MISMATCH')
        scored = {'status': 'SCORED_RESEARCH_ONLY', 'preflightHash': digest(preflight),
                  **{key: result[key] for key in ('aggregation', 'researchRanking', 'investmentDecisionInput')},
                  'routeQualifiers': prepared['routeQualifiers']}
        record('SCORING', scored)
        record('RESEARCH_SCORECARD', {'format': 'text/html', 'html': render(scored)})
        return {'ticker': job['request']['ticker'], 'executionId': job['executionId'], 'status': 'COMPLETED',
                'blockers': [], 'evidence': steps}

    result = rollout.run_next(queue, shared.Worker(request['skill'], work, 'IDEMPOTENT'),
                              retry_ticker=context['request']['ticker'])
    shared.require(result is not None, 'VALUATION_EXECUTION_RECEIPT_REQUIRED')
    return {'implementation': IMPLEMENTATION, 'queueId': queue, 'legacyExecutionId': prior['executionId'], **result}


def main():
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    for flag in ('ticker', 'cutoff', 'universe-version'):
        parser.add_argument('--' + flag, action=wp511.wp5.wp4.wp3.wp2.wp2.wp1.Once, required=True)
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
