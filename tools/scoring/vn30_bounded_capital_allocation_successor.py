#!/usr/bin/env python3
"""Execute the WP7 v1.1 bounded Capital Allocation candidate in the existing serial research queue."""
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
from tools.scoring import vn30_capital_allocation_successor as wp7  # noqa: E402

shared = wp7.shared

DIR = ROOT / 'docs/fundamental-data-engine/fpt-capital-allocation/v1.1'
IMPLEMENTATION = 'vn30-capital-allocation-successor-v1.1'
EVALUATOR = 'tools/scoring/validate_fpt_bounded_capital_allocation.mjs'


def replay(candidate, fd=None):
    expected = shared.pinned(ROOT, candidate['result'])
    shared.pinned(ROOT, candidate['evaluator'])
    call = subprocess.run(['node', EVALUATOR, '--ticker', candidate['subject']['ticker']], cwd=ROOT,
                          capture_output=True, pass_fds=() if fd is None else (fd,))
    shared.require(call.returncode == 0 and call.stdout == expected, 'VALUATION_EVALUATION_REPLAY_MISMATCH')
    return json.loads(call.stdout)


def prepare_assessment(result, prior_rows, cutoff):
    prepared = wp7.prepare_assessment(result, prior_rows, cutoff)
    prepared['applicability'] = {
        row['id']: {'status': row['updateStatus'], 'origin': row['underlyingAssessmentCutoff'],
                    'direct': row['currentReassessmentPoints'], 'effective': row['points']}
        for row in result['aggregation']['effectiveScores'][19:]
    }
    return prepared


def execute(args, store):
    universe, request, wp1_candidate = shared.construct_candidate(args)
    candidate = shared.read(DIR / 'CANDIDATE.json')
    shared.require(candidate['implementation'] == IMPLEMENTATION and candidate['subject'] == wp1_candidate['subject'] and
                   candidate['scope'] == 'ISOLATED_BQ_FH_GQ_IC_VAL_RG_CA_VALIDATION_ONLY' and
                   candidate['evaluator']['path'] == EVALUATOR, 'VALUATION_CANDIDATE_SCOPE_MISMATCH')
    for name in ('methodology', 'host', 'evaluator', 'result'):
        shared.pinned(ROOT, candidate[name])
    config = json.loads(shared.pinned(ROOT, candidate['methodology']))
    direction = shared.pinned(ROOT, config['owner']).decode()
    shared.require(config['status'] == 'APPROVED_BASELINE' and 'only after owner approval of CA25–CA34' in direction
                   and 'Owner reply, verbatim: có' in shared.pinned(ROOT, config['approval']).decode()
                   and not config['productionScoringAuthorized'] and not config['publicationAuthorized'],
                   'VALUATION_RESEARCH_AUTHORITY_REQUIRED')

    predecessor = json.loads(shared.pinned(ROOT, config['predecessor']))
    prior = wp7.execute(args, store)
    shared.require(prior == json.loads(shared.pinned(ROOT, predecessor['workflow'])), 'ACCEPTED_WP7_V10_WORKFLOW_CHANGED')
    retained_rows = next(row['result']['aggregation']['effectiveScores'] for row in prior['evidence'] if row['stage'] == 'SCORING')
    prior_rows = retained_rows[:19]
    initial = replay(candidate)
    shared.require(initial['scope'] == 'REAL_ISSUER_RESEARCH' and initial['methodology'] == candidate['methodology'] and
                   initial['aggregation']['effectiveScores'][:19] == prior_rows, 'ACCEPTED_BQ_FH_GQ_IC_VAL_CHANGED')
    request['parameters'] = {'category': 'CA', 'methodologyVersion': config['methodology'],
                             'priorAcceptedCategories': ['BQ', 'FH', 'GQ', 'IC', 'VAL', 'RG'], 'executionScope': candidate['scope'],
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
        prepared = prepare_assessment(initial, prior_rows, args.cutoff)
        record('EFFECTIVE_SCORE', {'scores': initial['aggregation']['effectiveScores'][19:]})
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
                       agg['formalScore'] is None and
                       (agg['completeResearchScore'] is None if agg['coverage']['effective']['count'] < 23 else
                        agg['completeResearchScore'] == agg['assessedPoints']), 'VALUATION_SCORE_PREFLIGHT_MISMATCH')
        scored = {'status': 'SCORED_RESEARCH_ONLY', 'preflightHash': digest(preflight),
                  **{key: result[key] for key in ('aggregation', 'researchRanking', 'investmentDecisionInput', 'scorecard')},
                  'routeQualifiers': prepared['routeQualifiers']}
        record('SCORING', scored)
        def th(values):
            return '<tr>' + ''.join(f'<th>{escape(str(cell))}</th>' for cell in values) + '</tr>'
        def tr(values):
            return '<tr>' + ''.join(f'<td>{escape(str(cell))}</td>' for cell in values) + '</tr>'
        def display(value):
            return 'N/R' if value is None else str(value)
        headings = ['Rubric','Weight','Effective','Current reassessment','Validity','Route','Confidence','Historical','Cutoff','Basis / limitations']
        table = [th(headings)]
        for row in result['scorecard']:
            confidence = row['confidence']
            total = confidence.get('total', confidence.get('score')) if isinstance(confidence,dict) else confidence
            table.append(tr([row['id'],row['weight'],display(row['points']),
                display(row.get('currentAssessmentPoints', row['points'])),row['validity'],row['route'] or '—',
                display(total),display(row['historicalPoints']),row['currentCutoff'],
                row['nrReason'] or row['provisionalOrigin'] or row['limitations'] or '—']))
        cats = [th(['Category','Points','Rated weight','Canonical weight'])]
        cats.extend(tr([r['id'],r['assessedPoints'],r['ratedWeight'],r['max']]) for r in agg['categories'])
        wp5 = result['products']['current']['wp5CommonMultiple']['current']
        html = ('<!doctype html><html lang="en"><meta charset="utf-8"><title>FPT research scorecard</title>'
                '<h1>FPT research scorecard — 13 November 2026</h1>'
                f'<p>{agg["assessedPoints"]}/{agg["ratedWeight"]} rated. Complete research total '
                f'{display(agg["completeResearchScore"])}. Formal investment score N/R.</p>'
                f'<p>Research residual risk {escape(result["researchResidualRisk"])}. '
                f'Formal residual risk {escape(result["formalResidualRisk"])}. Stage 0 UNKNOWN. Hard Veto PENDING.</p>'
                f'<p>FPT WP5 representative value {wp5["acceptedRepresentativeValue"]:,.2f} VND/share.</p>'
                '<table>' + ''.join(cats) + '</table><table>' + ''.join(table) + '</table></html>\n')
        record('RESEARCH_SCORECARD', {'format': 'text/html', 'html': html})
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
        with TemporaryDirectory(prefix='vn30-wp7-v11-') as scratch:
            result = execute(args, Path(scratch))
    except (ValueError, KeyError, OSError) as error:
        result = {'status': 'BLOCKED', 'blockers': [str(error)]}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['status'] == 'COMPLETED' else 1


if __name__ == '__main__':
    sys.exit(main())
