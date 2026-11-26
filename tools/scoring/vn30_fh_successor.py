#!/usr/bin/env python3
"""WP2 extension of the WP1 single-ticker research scoring route."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from tools.scoring import vn30_bq_successor as wp1  # noqa: E402

DIR = ROOT / 'docs/fundamental-data-engine/fpt-financial-health/v1.0'
PATH = DIR / 'CANDIDATE.json'
IMPLEMENTATION = 'vn30-bq-fh-prepare-scoring-research-successor-v1'
EVALUATOR = 'tools/scoring/validate_fpt_financial_health.mjs'
CONFIG = 'docs/03 SCORING/WP2_FINANCIAL_HEALTH_AMENDMENT_v1.0.json'
SCOPE = ('FH-BS', 'FH-LIQ', 'FH-STRESS')


def verify_pins(candidate):
    for name in ('methodology', 'result', 'executable', 'controller', 'wp1Controller'):
        wp1.pinned(ROOT, candidate[name])


def replay(candidate, *, html=False, fd=None):
    verify_pins(candidate)
    args = ['node', EVALUATOR, '--ticker', 'FPT'] + (['--html'] if html else [])
    call = subprocess.run(args, cwd=ROOT, capture_output=True, pass_fds=() if fd is None else (fd,))
    wp1.require(call.returncode == 0, 'FH_EVALUATOR_FAILED')
    if html:
        return call.stdout.decode()
    wp1.require(call.stdout == wp1.pinned(ROOT, candidate['result']), 'FH_ACCEPTED_REPLAY_MISMATCH')
    return json.loads(call.stdout)


def prepare_assessment(evaluated, wp1_rows, cutoff):
    agg = evaluated['aggregation']
    rows = agg['effectiveScores']
    wp1.require(rows[:4] == wp1_rows and tuple(row['id'] for row in rows[4:]) == SCOPE and
                all(row['reviewCutoff'] == cutoff for row in rows) and len(agg['outsideRollout']) == 16,
                'FH_PREPARE_SCOPE_MISMATCH')
    dispositions = []
    for row, lifecycle in zip(rows[4:], evaluated['fh'], strict=True):
        wp1.require(row == lifecycle['effectiveScore'], 'FH_EFFECTIVE_SCORE_BINDING_MISMATCH')
        if row['points'] is None:
            wp1.require(row['validity'] == 'N/R' and
                        (lifecycle['current']['reassessmentGaps'] or lifecycle['freshness']['reason']),
                        'FH_UNEXPLAINED_N_R')
        else:
            wp1.require(row['validity'] in ('CONFIRMED_CURRENT', 'PROVISIONAL') and row['basis'] and
                        not (row['validity'] == 'PROVISIONAL' and
                             (lifecycle['freshness']['expired'] or lifecycle['freshness']['fundingRisk'])),
                        'FH_EFFECTIVE_SCORE_NOT_ELIGIBLE')
        dispositions.append({'id': row['id'], 'points': row['points'], 'status': row['updateStatus'],
                             'gaps': lifecycle['current']['reassessmentGaps'], 'freshness': lifecycle['freshness']})
    return {'status': 'PREPARED_BQ_FH', 'effectiveScores': rows,
            'financialHealthDispositions': dispositions, 'outsideScopeCount': 16,
            'economicNrInScope': agg['genuineNrInScope'], 'formalScoringAuthorized': False}


def execute(args, store):
    universe, request, prior_candidate = wp1.construct_candidate(args)
    candidate = wp1.read(PATH)
    verify_pins(candidate)
    wp1.require(candidate['implementation'] == IMPLEMENTATION and candidate['category'] == 'FH' and
                candidate['scope'] == 'ISOLATED_BQ_FH_VALIDATION_ONLY' and
                candidate['subject'] == prior_candidate['subject'] and candidate['acceptedCategories'] == ['BQ'] and
                candidate['executable']['path'] == EVALUATOR and candidate['methodology']['path'] == CONFIG,
                'FH_CANDIDATE_SCOPE_MISMATCH')
    config = json.loads(wp1.pinned(ROOT, candidate['methodology']))
    direction = wp1.pinned(ROOT, config['owner']).decode()
    wp1.require('FH13 — Reuse the accepted WP1' in direction and 'isolated real-issuer research validation' in direction and
                not config['productionScoringAuthorized'] and not config['publicationAuthorized'],
                'FH_RESEARCH_DIRECTION_REQUIRED')

    # Execute WP1 in the same store and release its lease before scheduling WP2.
    prior = wp1.execute(args, store)
    wp1.require(prior == json.loads(wp1.pinned(ROOT, config['acceptedWp1']['result'])), 'WP1_WORKFLOW_REPLAY_MISMATCH')
    prior_rows = next(row['result']['aggregation']['effectiveScores'] for row in prior['evidence'] if row['stage'] == 'SCORING')
    assessed = replay(candidate)
    wp1.require(assessed['scope'] == 'REAL_ISSUER_RESEARCH' and assessed['acceptedWp1'] == config['acceptedWp1']['result'],
                'FH_ASSESSMENT_IDENTITY_MISMATCH')
    request['parameters'] = {'category': 'FH', 'methodologyVersion': config['methodology'],
                             'priorAcceptedCategories': ['BQ'], 'executionScope': candidate['scope'],
                             'researchCandidateHash': wp1.digest(candidate)}
    request['bindings'] = [dict(kind='ASSESSMENT', subjectTicker=request['ticker'],
                               reference=config['input']['path'], sha256=config['input']['sha256'])]
    context = wp1.prepare(request, universe)
    rollout = wp1.Rollout(store, universe)
    queue_id = rollout.plan([request])

    def work(job, checkpoint):
        stages = []
        def record(stage, payload):
            checkpoint(stage, payload)
            stages.append({'subjectTicker': job['request']['ticker'], 'stage': stage, 'result': payload})

        wp1.require_input_identity(job, assessed)
        digest = wp1.digest
        wp1.require(job['permissions'] == wp1.PERMISSIONS and not any(job['permissions'].values()) and
                    job['request']['parameters']['researchCandidateHash'] == digest(candidate), 'FH_ISOLATION_REQUIRED')
        record('CANDIDATE', {'candidateHash': digest(candidate), 'route': candidate,
                             'validatedAnnualAndIncrementalReplay': candidate['result']})
        prepared = prepare_assessment(assessed, prior_rows, args.cutoff)
        record('PREPARE', prepared)
        adoption = {'status': 'ADOPTED_FOR_ISOLATED_VALIDATION', 'executionId': job['executionId'],
                    'candidateHash': digest(candidate), 'prepareHash': digest(prepared), 'owner': config['owner'],
                    'assessment': config['input'], 'formalAssessmentAdoptionGranted': False}
        record('ASSESSMENT_ADOPTION', adoption)
        verify_pins(candidate)
        preflight = {'status': 'AUTHORIZED_FOR_ISOLATED_VALIDATION', 'adoptionHash': digest(adoption),
                     'prepareHash': digest(prepared), 'replay': candidate['result'], 'permissions': wp1.PERMISSIONS.copy()}
        record('PREFLIGHT', preflight)
        scored = replay(candidate, fd=rollout.lock_fd)
        wp1.require_input_identity(job, scored)
        agg = scored['aggregation']
        wp1.require(prepare_assessment(scored, prior_rows, args.cutoff) == prepared and
                    all(agg[field] is None for field in ('formalScore', 'confirmedCurrentInvestmentScore',
                                                        'provisionalInvestmentScore')) and
                    not scored['decisionEligible'] and not scored['publicationAuthorized'] and
                    not scored['investmentDecisionInput']['formalDecisionAuthorized'],
                    'FH_SCORE_PREFLIGHT_MISMATCH')
        record('SCORING', {'status': 'SCORED_RESEARCH_ONLY', 'preflightHash': digest(preflight),
                           'aggregation': agg, 'researchRanking': scored['researchRanking'],
                           'investmentDecisionInput': scored['investmentDecisionInput']})
        html = replay(candidate, html=True, fd=rollout.lock_fd)
        wp1.require('<!doctype html>' in html and 'Financial Health' in html, 'FH_HTML_RENDER_FAILED')
        record('RESEARCH_SCORECARD', {'format': 'text/html', 'html': html})
        return {'ticker': job['request']['ticker'], 'executionId': job['executionId'], 'status': 'COMPLETED',
                'evidence': stages, 'blockers': []}

    result = rollout.run_next(queue_id, wp1.Worker(request['skill'], work, 'IDEMPOTENT'),
                              retry_ticker=context['request']['ticker'])
    wp1.require(result is not None, 'FH_EXECUTION_RECEIPT_REQUIRED')
    return {'implementation': IMPLEMENTATION, 'queueId': queue_id, **result}


def main():
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    for name in ('ticker', 'cutoff', 'universe-version'):
        parser.add_argument('--' + name, action=wp1.Once, required=True)
    args = parser.parse_args()
    try:
        with TemporaryDirectory(prefix='vn30-fh-successor-') as scratch:
            result = execute(args, Path(scratch))
    except (ValueError, OSError, KeyError) as error:
        result = {'status': 'BLOCKED', 'blockers': [str(error)]}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['status'] == 'COMPLETED' else 1


if __name__ == '__main__':
    sys.exit(main())
