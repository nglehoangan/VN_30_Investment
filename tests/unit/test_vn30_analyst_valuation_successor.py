"""Replay the FPT WP5 v2.0 research handoff and preserve restricted authority."""
import json
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = ROOT / 'docs/fundamental-data-engine/fpt-valuation-forward-return/v2.0'
COMMAND = ['python3', 'tools/scoring/vn30_analyst_valuation_successor.py', '--ticker', 'FPT',
           '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115']


class AnalystValuationWorkflow(unittest.TestCase):
    def test_exact_research_replay_and_authority(self):
        run = subprocess.run(COMMAND, cwd=ROOT, capture_output=True, text=True, check=True)
        workflow = json.loads(run.stdout)
        self.assertEqual(workflow, json.loads((ARTIFACTS / 'FPT_VALUATION_WORKFLOW.json').read_text()))
        self.assertEqual(workflow['legacyExecutionId'], 'exec-b49c62e59ae2c95c831ec516')
        steps = {receipt['stage']: receipt['result'] for receipt in workflow['evidence']}
        self.assertEqual(list(steps), ['CANDIDATE', 'DATA_FREEZE', 'ANALYST_PROPOSAL',
                         'INITIAL_REASONABLENESS_REVIEW', 'ANALYST_REVISION', 'FINAL_REASONABLENESS_REVIEW',
                         'EXECUTABLE_VALIDATION', 'PREPARE', 'ASSESSMENT_ADOPTION', 'PREFLIGHT', 'SCORING',
                         'RESEARCH_SCORECARD'])
        scores = steps['SCORING']['aggregation']
        self.assertEqual([row['points'] for row in scores['effectiveScores'][-3:]], [4, 0, 1])
        self.assertEqual((scores['assessedPoints'], scores['ratedWeight']), (39, 85))
        self.assertIsNone(scores['formalScore'])
        self.assertFalse(any(steps['PREFLIGHT']['permissions'].values()))
        self.assertFalse(steps['SCORING']['investmentDecisionInput']['formalDecisionAuthorized'])
        self.assertIn('<td>VAL-RET</td><td>A</td><td>0</td>', steps['RESEARCH_SCORECARD']['html'])

    def test_cli_has_exactly_one_ticker_and_no_publication(self):
        for extra in (['--publish'], ['--ticker', 'FPT']):
            with self.subTest(extra=extra):
                run = subprocess.run(COMMAND + extra, cwd=ROOT, capture_output=True)
                self.assertNotEqual(run.returncode, 0)


if __name__ == '__main__':
    unittest.main()
