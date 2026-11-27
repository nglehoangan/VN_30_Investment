"""Replay the isolated, complete FPT research scorecard."""
import json
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = ROOT / 'docs/fundamental-data-engine/fpt-capital-allocation/v1.0'
RUN = ['python3', 'tools/scoring/vn30_capital_allocation_successor.py', '--ticker', 'FPT',
       '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115']


class CapitalAllocationWorkflow(unittest.TestCase):
    def test_replays_scorecard_and_authority(self):
        run = subprocess.run(RUN, cwd=ROOT, capture_output=True, check=True, text=True)
        receipt = json.loads(run.stdout)
        self.assertEqual(receipt, json.loads((ARTIFACTS / 'FPT_CAPITAL_ALLOCATION_WORKFLOW.json').read_text()))
        steps = {row['stage']: row['result'] for row in receipt['evidence']}
        self.assertEqual(list(steps)[-6:], ['EFFECTIVE_SCORE', 'PREPARE', 'ASSESSMENT_ADOPTION',
                                           'PREFLIGHT', 'SCORING', 'RESEARCH_SCORECARD'])
        scores = steps['SCORING']
        self.assertEqual(len(scores['scorecard']), 23)
        self.assertEqual([row['points'] for row in scores['scorecard'][-4:]], [None] * 4)
        self.assertIsNone(scores['aggregation']['formalScore'])
        self.assertFalse(any(steps['PREFLIGHT']['permissions'].values()))
        self.assertIn('43/95 rated', steps['RESEARCH_SCORECARD']['html'])

    def test_external_switches_rejected(self):
        for extra in (['--publish'], ['--ticker', 'FPT']):
            self.assertNotEqual(subprocess.run(RUN + extra, cwd=ROOT, capture_output=True).returncode, 0)
