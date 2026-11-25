#!/usr/bin/env python3
"""Attach a structural feasibility audit to the native single-ticker scoring Prepare."""
import argparse
import json
from pathlib import Path
import sqlite3
import sys

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from tools.scoring.vn30_score import Once, execute, read, scope  # noqa: E402
from tools.scoring.evaluation_gaps import evaluate  # noqa: E402
from tools.scoring.annual_reassessment import evaluate_annual  # noqa: E402
from tools.scoring.research_scoring_bridge import reconcile  # noqa: E402
from tools.scoring.structural_nr import SKILL, Universe, diagnose, digest, prepare  # noqa: E402


def prepare_with_evaluation(args):
    # The native result, route and hashes remain authoritative and byte-compatible.
    report = execute(args)
    result = dict(report)
    annual_input = diagnosis = None
    feasibility_packet = getattr(args, 'evaluation_feasibility', None)
    if feasibility_packet:
        try:
            _, _, job, _ = scope(args)
            feasibility = evaluate(job, read(feasibility_packet))
        except (ValueError, OSError, KeyError, IndexError, TypeError, AttributeError) as error:
            feasibility = {'status': 'BLOCKED', 'reason': str(error), 'authorityEffect': 'NONE'}
        result['evaluationFeasibility'] = feasibility
    annual_packet = getattr(args, 'annual_reassessment', None)
    if annual_packet:
        try:
            _, _, job, _ = scope(args)
            annual_input = read(annual_packet)
            result['annualReassessment'] = evaluate_annual(job, annual_input)
        except (ValueError, OSError, KeyError, IndexError, TypeError, AttributeError) as error:
            result['annualReassessment'] = {'status': 'BLOCKED', 'reason': str(error), 'authorityEffect': 'NONE'}
    completion_packet = getattr(args, 'rubric_completion', None)
    if completion_packet:
        try:
            packet = read(completion_packet)
            _, _, job, _ = scope(args)
            req = job['request']
            context = prepare({
                'skill': SKILL, 'ticker': req['ticker'], 'sector': req['sector'],
                'referenceDate': req['referenceDate'], 'purpose': 'RETROSPECTIVE_RESEARCH',
                'parameters': {'packetDigest': digest(packet)},
            }, Universe(args.universe_version))
            report = diagnosis = diagnose(context, packet)
            unresolved = [row['rubricId'] for row in report['rows'] if row['status'] == 'ESCALATED']
            result['rubricCompletion'] = {
                'status': 'PASS WITH LIMITATIONS' if unresolved else 'PASS',
                'baselineNrCount': report['baselineNrCount'],
                'resolvedResearch': [row['rubricId'] for row in report['rows'] if row['status'] == 'RESOLVED'],
                'remainingNr': unresolved, 'packetHash': digest(packet), 'authorityEffect': 'NONE',
            }
        except (ValueError, OSError, KeyError, IndexError, TypeError, AttributeError) as error:
            result['rubricCompletion'] = {'status': 'BLOCKED', 'reason': str(error), 'authorityEffect': 'NONE'}
    if annual_packet and completion_packet and getattr(args, 'research_bridge', False):
        try:
            annual = result['annualReassessment']
            if diagnosis is None or annual['status'] == 'BLOCKED':
                raise ValueError('VALID_ANNUAL_AND_DIAGNOSTIC_REVIEW_REQUIRED')
            result['researchScoringBridge'] = reconcile(result, annual, diagnosis, annual_input)
        except (ValueError, OSError, KeyError, IndexError, TypeError, AttributeError) as error:
            result['researchScoringBridge'] = {'status': 'BLOCKED', 'reason': str(error), 'authorityEffect': 'NONE'}
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.set_defaults(mode='prepare')
    parser.add_argument('--ticker', action=Once, required=True)
    parser.add_argument('--universe-version', action=Once, required=True)
    parser.add_argument('--cutoff', '--reference-date', action=Once, required=True)
    parser.add_argument('--candidate', action=Once, type=Path)
    parser.add_argument('--previous-proposal', action=Once, type=Path)
    parser.add_argument('--evaluation-feasibility', action=Once, type=Path)
    parser.add_argument('--annual-reassessment', action=Once, type=Path)
    parser.add_argument('--rubric-completion', action=Once, type=Path)
    parser.add_argument('--research-bridge', action='store_true')
    args = parser.parse_args(argv)
    if args.research_bridge and not (args.annual_reassessment and args.rubric_completion):
        parser.error('--research-bridge requires both annual reassessment and rubric completion packets')
    if not (args.evaluation_feasibility or args.annual_reassessment or args.rubric_completion):
        parser.error('supply --evaluation-feasibility or --annual-reassessment or --rubric-completion')
    try:
        report = prepare_with_evaluation(args)
    except (ValueError, OSError, KeyError, sqlite3.Error) as error:
        print(json.dumps({'status': 'ERROR', 'reason': str(error)}))
        return 2
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return int(report['status'] != 'READY_FOR_CIO' or any(
        report.get(key, {}).get('status') == 'BLOCKED' for key in ('evaluationFeasibility', 'annualReassessment', 'rubricCompletion', 'researchScoringBridge')))


if __name__ == '__main__':
    sys.exit(main())
