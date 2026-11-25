import contextlib
import io
import json
from argparse import Namespace
from pathlib import Path
from unittest import TestCase
from unittest.mock import patch

from tools.scoring import vn30_prepare_evaluation as cli
from tools.scoring.evaluation_gaps import evaluate
from tools.scoring.vn30_score import ROOT, scope

VERSION = 'vn30-20260803-reviewed-20261115'
CUTOFF = '2026-10-30'
AUDIT = ROOT / 'docs/fundamental-data-engine/structural-evaluation-gaps/2026-11-23'


def args(ticker):
    return Namespace(ticker=ticker, cutoff=CUTOFF, universe_version=VERSION, mode='prepare',
                     candidate=None, previous_proposal=None,
                     evaluation_feasibility=AUDIT / f'{ticker}_EVALUATION_FEASIBILITY.json')


def fixture(ticker):
    request = args(ticker)
    return scope(request)[2], json.loads(request.evaluation_feasibility.read_text())


class EvaluationGapTests(TestCase):
    def test_retained_cases_and_no_operational_fields(self):
        for ticker, valuation in [('VNM', 'PASS WITH LIMITATIONS'), ('ACB', 'BLOCKED'),
                                  ('TCB', 'PASS WITH LIMITATIONS')]:
            with self.subTest(ticker=ticker):
                report = evaluate(*fixture(ticker))
                self.assertEqual(report['componentVerdicts'], {
                    'M1_PREPARE': 'PASS WITH LIMITATIONS', 'VALUATION': valuation,
                    'INVESTMENT_DECISION': 'BLOCKED',
                })
                self.assertEqual(report['authorityEffect'], 'NONE')
                for field in ('totalScore', 'intrinsicValue', 'decisionState', 'tradeAuthorization'):
                    self.assertNotIn(field, report)

    def test_native_prepare_is_unchanged_with_or_without_diagnostic(self):
        for native in (
            {'status': 'BLOCKED', 'blockers': ['CURRENT_SCORE_M1_UNRESOLVED']},
            {'status': 'READY_FOR_CIO', 'approvalHash': 'exact', 'preflightHash': 'bound',
             'limitedCoverage': {'fullOfficialScore': None, 'eligibleForRanking': False}},
        ):
            with patch.object(cli, 'execute', return_value=native) as prepare:
                request = args('ACB')
                report = cli.prepare_with_evaluation(request)
                prepare.assert_called_once_with(request)
                self.assertEqual({k: v for k, v in report.items() if k != 'evaluationFeasibility'}, native)
                request.evaluation_feasibility = Path('/nonexistent/evaluation.json')
                blocked = cli.prepare_with_evaluation(request)
                self.assertEqual(blocked['status'], native['status'])
                self.assertEqual(blocked['evaluationFeasibility']['status'], 'BLOCKED')

    def test_wrong_subject_and_tampered_evidence_are_rejected(self):
        job, packet = fixture('TCB')
        _, acb = fixture('ACB')
        with self.assertRaisesRegex(ValueError, 'EVALUATION_SUBJECT_MISMATCH'):
            evaluate(job, acb)
        packet['evidence']['market']['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'RETAINED_SOURCE_HASH_MISMATCH'):
            evaluate(job, packet)

    def test_incomplete_scope_and_false_certainty_are_rejected(self):
        job, packet = fixture('VNM')
        packet['tradeAuthorization'] = 'AUTHORIZED'
        with self.assertRaisesRegex(ValueError, 'INVALID_EVALUATION_PACKET_FIELDS'):
            evaluate(job, packet)
        del packet['tradeAuthorization']
        packet['checks']['VALUATION']['CONFIDENCE']['status'] = 'PASS'
        with self.assertRaisesRegex(ValueError, 'LIMITATION_REQUIRES_ESCALATION'):
            evaluate(job, packet)
        del packet['checks']['VALUATION']['CONFIDENCE']
        with self.assertRaisesRegex(ValueError, 'INCOMPLETE_EVALUATION_CHECKS'):
            evaluate(job, packet)

    def test_one_pass_and_new_trigger_and_change_request_are_required(self):
        job, packet = fixture('ACB')
        packet['reviewCounts']['evidenceImprovement'] = 2
        with self.assertRaisesRegex(ValueError, 'UNBOUNDED_OR_INCOMPLETE'):
            evaluate(job, packet)
        packet['reviewCounts']['evidenceImprovement'] = 1
        gap = next(row for row in packet['gaps'] if row['baselineChange'])
        change = gap.pop('changeRequest')
        with self.assertRaisesRegex(ValueError, 'BASELINE_CHANGE_REQUIRES_CHANGE_REQUEST'):
            evaluate(job, packet)
        gap['changeRequest'] = change
        gap['futureDataTest']['result'] = 'NO'
        gap['nextTrigger'] = 'SAME_FORMAT_ANNUAL_REPORT'
        with self.assertRaisesRegex(ValueError, 'STRUCTURAL_ESCALATION_REQUIRED'):
            evaluate(job, packet)

    def test_wrapper_accepts_no_scoring_mode_and_rejects_repeated_ticker(self):
        prefix = ['--ticker', 'VNM', '--universe-version', VERSION, '--cutoff', CUTOFF,
                  '--evaluation-feasibility', str(args('VNM').evaluation_feasibility)]
        for suffix in (['--mode', 'score'], ['--ticker', 'VNM']):
            with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as error:
                cli.main(prefix + suffix)
            self.assertEqual(error.exception.code, 2)

    def test_resolved_mapping_requires_raw_replay_evidence(self):
        job, packet = fixture('VNM')
        gap = packet['gaps'][0]
        gap.update(primaryCause='DATA_MAPPING_GAP', outcome='RESOLVED')
        packet['checks'][gap['component']][gap['dependency']]['status'] = 'PASS'
        with self.assertRaisesRegex(ValueError, 'MAPPING_RESOLUTION_REQUIRES_RAW_REPLAY'):
            evaluate(job, packet)


class RubricCompletionTests(TestCase):
    def test_completion_preserves_native_and_lists_exact_nr(self):
        request = args('ACB')
        request.evaluation_feasibility = None
        request.rubric_completion = AUDIT.parent.parent / 'structural-nr-remediation/2026-11-23/ACB_DIAGNOSTIC.json'
        native = {'status': 'BLOCKED', 'blockers': ['test']}
        with patch.object(cli, 'execute', return_value=native):
            result = cli.prepare_with_evaluation(request)
        completion = result.pop('rubricCompletion')
        self.assertEqual(result, native)
        self.assertEqual(completion['status'], 'PASS WITH LIMITATIONS')
        self.assertEqual(len(completion['remainingNr']), 9)
        self.assertEqual(completion['authorityEffect'], 'NONE')
