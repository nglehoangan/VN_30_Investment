#!/usr/bin/env python3
"""Replay the retained FPT WP2 route and correct coverage on its research outputs."""
import argparse
from copy import deepcopy
import json
from pathlib import Path
import subprocess
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from tools.scoring import vn30_fh_successor as wp2  # noqa: E402

DIR = ROOT / 'docs/fundamental-data-engine/fpt-financial-health/bounded-closure-v1'
IMPLEMENTATION = 'wp2-bounded-fh-research-coverage-v1'


def corrected_coverage(aggregation, evaluated):
    """Keep legacy arithmetic while distinguishing economic N/R from rollout policy."""
    current = aggregation['coverage']
    legacy_unrated = current['genuineNR']
    scope_nr = aggregation['genuineNrInScope']
    outside = aggregation['outsideRollout']
    rows = aggregation['effectiveScores']
    ids = {row['id'] for row in rows}
    in_scope = [row['id'] for row in rows if row['points'] is None]
    weights = {row['current']['rubricId']: row['current']['maxPoints'] for row in evaluated['fh']}
    wp2.wp1.require(len(ids) == len(rows) and in_scope == scope_nr and len(set(outside)) == len(outside) and
                    not ids.intersection(outside) and all(rubric in weights for rubric in scope_nr) and
                    len(scope_nr) + len(outside) == legacy_unrated['count'] and
                    current['effective']['count'] + len(scope_nr) == len(rows) and
                    current['effective']['weight'] + legacy_unrated['weight'] == aggregation['theoreticalMaximum'],
                    'FH_COVERAGE_SCOPE_INCONSISTENT')
    reviewed_weight = sum(weights[rubric] for rubric in scope_nr)
    outside_weight = legacy_unrated['weight'] - reviewed_weight
    wp2.wp1.require(outside_weight >= 0, 'FH_COVERAGE_WEIGHT_INCONSISTENT')
    return {**current, 'genuineNR': {'count': len(scope_nr), 'weight': reviewed_weight},
            'outsideRollout': {'count': len(outside), 'weight': outside_weight},
            'unratedTotal': deepcopy(legacy_unrated)}


def project(workflow, evaluated):
    result = deepcopy(workflow)
    stages = {row['stage']: row['result'] for row in result['evidence']}
    scoring = stages['SCORING']
    aggregation = scoring['aggregation']
    wp2.wp1.require(workflow['status'] == 'COMPLETED' and not any(workflow['permissions'].values()) and
                    aggregation == evaluated['aggregation'] and
                    scoring['investmentDecisionInput']['coverage'] == aggregation['coverage'] and
                    scoring['researchRanking'] == evaluated['researchRanking'],
                    'FH_COVERAGE_WORKFLOW_BINDING_MISMATCH')
    coverage = corrected_coverage(aggregation, evaluated)
    aggregation['coverage'] = coverage
    scoring['investmentDecisionInput']['coverage'] = deepcopy(coverage)
    for row in scoring['researchRanking']:
        row['coverage'] = deepcopy(coverage)
    scorecard = stages['RESEARCH_SCORECARD']
    wp2.wp1.require(scorecard['html'].count('</html>') == 1, 'FH_RESEARCH_HTML_BOUNDARY')
    genuine = coverage['genuineNR']
    outside = coverage['outsideRollout']
    summary = (f'<p>Economic N/R within reviewed scope: {genuine["count"]} rubrics, {genuine["weight"]}/100 weight. '
               f'Outside completed rollout: {outside["count"]} rubrics, {outside["weight"]}/100 weight.</p>')
    scorecard['html'] = scorecard['html'].replace('</html>', summary + '</html>')
    return result


def execute(args):
    candidate = wp2.wp1.read(DIR / 'BINDINGS.json')
    wp2.wp1.pinned(ROOT, candidate['owner'])
    wp2.wp1.pinned(ROOT, candidate['implementation'])
    reference = wp2.wp1.pinned(ROOT, candidate['workflow'])
    evaluator = json.loads(wp2.wp1.pinned(ROOT, candidate['evaluation']))
    command = ['python3', '-B', 'tools/scoring/vn30_fh_successor.py',
               '--ticker', args.ticker, '--cutoff', args.cutoff, '--universe-version', args.universe_version]
    call = subprocess.run(command, cwd=ROOT, capture_output=True)
    wp2.wp1.require(call.returncode == 0 and call.stdout == reference, 'EXACT_WP2_WORKFLOW_REPLAY_REQUIRED')
    workflow = json.loads(call.stdout)
    return {'implementation': IMPLEMENTATION, 'sourceWorkflow': candidate['workflow'],
            'sourceEvaluation': candidate['evaluation'], 'workflow': project(workflow, evaluator)}


def main():
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    for name in ('ticker', 'cutoff', 'universe-version'):
        parser.add_argument('--' + name, action=wp2.wp1.Once, required=True)
    args = parser.parse_args()
    try:
        result = execute(args)
    except (ValueError, KeyError, OSError) as error:
        print(json.dumps({'status': 'BLOCKED', 'blockers': [str(error)]}))
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
