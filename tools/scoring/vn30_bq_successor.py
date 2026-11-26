#!/usr/bin/env python3
"""Governed single-ticker Prepare → Scoring successor for isolated BQ validation."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from tools.scoring.vn30_score import (  # noqa: E402
    Once, PERMISSIONS, Rollout, Worker, digest, pinned, prepare, read, require_input_identity, scope,
)

MANIFEST = ROOT / 'docs/fundamental-data-engine/fpt-business-quality/prepare-scoring-v1/CANDIDATE.json'
IMPLEMENTATION = 'vn30-bq-prepare-scoring-research-successor-v1'
VALIDATION_SCOPE = 'ISOLATED_BQ_VALIDATION_ONLY'
BQ = {'BQ-EQ': 8, 'BQ-MOAT': 6, 'BQ-CASH': 6, 'BQ-RES': 5}
REPLAY = 'tools/scoring/validate_fpt_business_quality.mjs'


def require(condition, code):
    if not condition:
        raise ValueError(code)


def construct_candidate(args):
    universe, formal_request, formal_context, _ = scope(args)
    subject = formal_context['request']
    manifest = read(MANIFEST)
    expected = dict(ticker=subject['ticker'], securityId=subject['securityId'],
                    exchange=subject['exchange'], sector=subject['sector'],
                    universeVersion=args.universe_version, universeHash=universe.pin['registryEntryHash'],
                    cutoff=args.cutoff, purpose='RETROSPECTIVE_RESEARCH')
    require(manifest['implementation'] == IMPLEMENTATION and manifest['subject'] == expected and
            manifest['scope'] == VALIDATION_SCOPE and manifest['rubrics'] == list(BQ),
            'SUCCESSOR_CANDIDATE_SCOPE_MISMATCH')
    for role in ('ownerDirection', 'assessment', 'methodology', 'acceptedResult', 'adapter', 'implementationPin', 'orchestrator'):
        pinned(ROOT, manifest[role])
    require(manifest['adapter']['path'] == REPLAY and
            manifest['implementationPin']['path'] == str(Path(__file__).relative_to(ROOT)),
            'SUCCESSOR_ADAPTER_IDENTITY_MISMATCH')
    identity = digest(manifest)
    request = dict(ticker=subject['ticker'], skill=formal_request['skill'], sector=subject['sector'],
                   exchange=subject['exchange'], purpose=expected['purpose'], referenceDate=expected['cutoff'],
                   parameters={'researchCandidateHash': identity},
                   bindings=[dict(kind='ASSESSMENT', subjectTicker=subject['ticker'],
                                  reference=manifest['assessment']['path'], sha256=manifest['assessment']['sha256'])])
    return universe, request, manifest


def replay(context, candidate, fd, *, html=False):
    require(context['permissions'] == PERMISSIONS and context['request']['purpose'] == 'RETROSPECTIVE_RESEARCH',
            'ISOLATED_RESEARCH_CONTEXT_REQUIRED')
    require(context['request']['parameters']['researchCandidateHash'] == digest(candidate), 'RESEARCH_CANDIDATE_CHANGED')
    adapter = pinned(ROOT, candidate['adapter'])
    require(adapter and candidate['adapter']['path'] == REPLAY, 'SUCCESSOR_ADAPTER_IDENTITY_MISMATCH')
    argv = ['node', REPLAY, '--ticker', context['request']['ticker']]
    if html:
        argv.append('--html')
    child = subprocess.run(argv, cwd=ROOT, capture_output=True, pass_fds=(fd,))
    require(child.returncode == 0, 'APPROVED_BQ_EVALUATOR_FAILED')
    if html:
        return child.stdout.decode('utf8')
    require(child.stdout == pinned(ROOT, candidate['acceptedResult']), 'ACCEPTED_BQ_REPLAY_MISMATCH')
    result = json.loads(child.stdout)
    require_input_identity(context, result)
    require(result['scope'] == 'REAL_ISSUER_RESEARCH' and result['input'] == candidate['assessment'] and
            result['methodology'] == candidate['methodology'] and result['decisionEligible'] is False and
            result['publicationAuthorized'] is False, 'SUCCESSOR_RESULT_IDENTITY_MISMATCH')
    return result


def prepare_assessment(result, cutoff):
    """Consume the approved evaluator's eligibility decision and preserve per-rubric diagnostics."""
    rows = result['aggregation']['effectiveScores']
    require([row['id'] for row in rows] == list(BQ) and all(row['reviewCutoff'] == cutoff for row in rows),
            'SUCCESSOR_RUBRIC_OR_CUTOFF_MISMATCH')
    blocked = []
    for row in rows:
        points = row['points']
        if points is None:
            blocked.append({'rubric': row['id'], 'reason': 'NO_ELIGIBLE_APPROVED_EFFECTIVE_SCORE',
                            'certificationGaps': row['certificationGaps']})
            continue
        require(type(points) is int and 0 <= points <= BQ[row['id']] and
                row['validity'] in ('CONFIRMED_CURRENT', 'PROVISIONAL') and bool(row['basis']),
                'INVALID_EFFECTIVE_SCORE')
        if row['validity'] == 'PROVISIONAL':
            require(row['latestValidPoints'] == points and row['currentConfirmedPoints'] is None and
                    row['basis'] == 'LATEST_VALID_HISTORICAL_ASSESSMENT' and
                    row['updateStatus'] in ('UPDATE_PENDING', 'MATERIAL_REVIEW_PENDING') and
                    not {'VALID_BASELINE_REQUIRED', 'NEW_ANNUAL_REASSESSMENT_REQUIRED'}.intersection(row['certificationGaps']),
                    'INVALID_PROVISIONAL_FOUNDATION')
    return {'status': 'BLOCKED' if blocked else 'PREPARED', 'rubricBlockers': blocked,
            'validation': 'APPROVED_BQ_EVIDENCE_SUFFICIENCY_AND_EFFECTIVE_SCORE',
            'assessedRubrics': rows, 'outsideScopeCount': 19, 'fullFormalReadiness': False}


def adopt_candidate(context, candidate, prepared):
    require(prepared['status'] == 'PREPARED' and not prepared['rubricBlockers'], 'QUALIFIED_PREPARE_REQUIRED')
    # The retained owner request limits this receipt to validation of one exact research candidate.
    direction = pinned(ROOT, candidate['ownerDirection']).decode('utf8')
    require('Isolated authorized-for-validation scoring execution' in direction and
            'No production database writes, publication or activation are authorized by this task.' in direction,
            'EXACT_RESEARCH_OWNER_DIRECTION_REQUIRED')
    return {'status': 'ADOPTED_FOR_ISOLATED_VALIDATION', 'scope': VALIDATION_SCOPE,
            'executionId': context['executionId'], 'subject': candidate['subject'],
            'candidateHash': digest(candidate), 'prepareHash': digest(prepared),
            'assessment': candidate['assessment'], 'ownerDirection': candidate['ownerDirection'],
            'formalAssessmentAdoptionGranted': False}


def preflight_candidate(context, candidate, prepared, adoption):
    require(adoption == adopt_candidate(context, candidate, prepared), 'RESEARCH_ADOPTION_BINDING_MISMATCH')
    require(context['permissions'] == PERMISSIONS and all(not value for value in PERMISSIONS.values()),
            'SUCCESSOR_PRODUCTION_PERMISSION_FORBIDDEN')
    for role in ('assessment', 'methodology', 'acceptedResult', 'adapter', 'implementationPin', 'orchestrator'):
        pinned(ROOT, candidate[role])
    return {'status': 'AUTHORIZED_FOR_ISOLATED_VALIDATION', 'scope': VALIDATION_SCOPE,
            'adoptionHash': digest(adoption), 'candidateHash': digest(candidate),
            'retainedResult': candidate['acceptedResult'], 'permissions': PERMISSIONS.copy()}


def execute_candidate(context, candidate, prepared, adoption, preflight, fd):
    require(preflight == preflight_candidate(context, candidate, prepared, adoption), 'RESEARCH_PREFLIGHT_BINDING_MISMATCH')
    result = replay(context, candidate, fd)
    require(prepare_assessment(result, candidate['subject']['cutoff']) == prepared,
            'PREPARE_SCORE_ASSESSMENT_DRIFT')
    aggregation = result['aggregation']
    require(aggregation['effectiveScores'] == prepared['assessedRubrics'] and
            aggregation['ratedRubrics'] == list(BQ) and
            aggregation['coverage']['genuineNR'] == {'count': 19, 'weight': 75} and
            all(aggregation[key] is None for key in ('confirmedCurrentInvestmentScore', 'provisionalInvestmentScore', 'formalScore')) and
            not aggregation['formalRankingEligible'] and not aggregation['investmentActionable'],
            'RESEARCH_PARTIAL_ROLLOUT_INVARIANT')
    return {'status': 'SCORED_RESEARCH_ONLY', 'preflightHash': digest(preflight),
            'sourceReceipt': candidate['acceptedResult'], 'aggregation': aggregation,
            'researchRanking': result['researchRanking'], 'investmentDecisionInput': result['investmentDecisionInput'],
            'decisionEligible': False, 'publicationAuthorized': False}


def execute(args, store):
    universe, request, candidate = construct_candidate(args)
    context = prepare(request, universe)
    rollout = Rollout(store, universe)
    queue = rollout.plan([request])

    def work(job, checkpoint):
        steps = []
        def record(stage, payload):
            checkpoint(stage, payload)
            steps.append({'subjectTicker': job['request']['ticker'], 'stage': stage, 'result': payload})
        def outcome(status, blockers):
            return {'ticker': job['request']['ticker'], 'executionId': job['executionId'],
                    'status': status, 'blockers': blockers, 'evidence': steps}
        try:
            record('CANDIDATE', {'candidateHash': digest(candidate), 'route': candidate})
            prepared = prepare_assessment(replay(job, candidate, rollout.lock_fd), args.cutoff)
            record('PREPARE', prepared)
            if prepared['rubricBlockers']:
                return outcome('BLOCKED', ['NO_ELIGIBLE_APPROVED_EFFECTIVE_SCORE'])
            adoption = adopt_candidate(job, candidate, prepared)
            record('ASSESSMENT_ADOPTION', adoption)
            preflight = preflight_candidate(job, candidate, prepared, adoption)
            record('PREFLIGHT', preflight)
            scored = execute_candidate(job, candidate, prepared, adoption, preflight, rollout.lock_fd)
            record('SCORING', scored)
            html = replay(job, candidate, rollout.lock_fd, html=True)
            require('<!doctype html>' in html and 'Business Quality' in html, 'RESEARCH_SCORECARD_RENDER_FAILED')
            record('RESEARCH_SCORECARD', {'format': 'text/html', 'sha256': hashlib.sha256(html.encode()).hexdigest(),
                                          'scoringHash': digest(scored), 'html': html})
            return outcome('COMPLETED', [])
        except ValueError as error:
            return outcome('BLOCKED', [str(error)])

    result = rollout.run_next(queue, Worker(request['skill'], work, 'IDEMPOTENT'),
                              retry_ticker=context['request']['ticker'])
    require(result is not None, 'SUCCESSOR_EXECUTION_RECEIPT_REQUIRED')
    return {'implementation': IMPLEMENTATION, 'queueId': queue, **result}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument('--ticker', action=Once, required=True)
    parser.add_argument('--cutoff', action=Once, required=True)
    parser.add_argument('--universe-version', action=Once, required=True)
    args = parser.parse_args(argv)
    try:
        # Temporary isolation keeps research checkpoints and scorecard out of live stores.
        with TemporaryDirectory(prefix='vn30-bq-successor-') as scratch:
            result = execute(args, Path(scratch))
    except (ValueError, OSError, KeyError) as error:
        print(json.dumps({'status': 'BLOCKED', 'blockers': [str(error)]}))
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['status'] == 'COMPLETED' else 1


if __name__ == '__main__':
    sys.exit(main())
