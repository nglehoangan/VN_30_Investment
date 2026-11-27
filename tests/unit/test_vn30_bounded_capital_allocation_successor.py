"""Replay WP7 v1.1 through the existing isolated queue."""
import json
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = ROOT / 'docs/fundamental-data-engine/fpt-capital-allocation/v1.1'
RUN = ['python3', 'tools/scoring/vn30_bounded_capital_allocation_successor.py', '--ticker', 'FPT',
       '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115']


class BoundedCapitalAllocation(unittest.TestCase):
    def test_full_handoff_and_provisional_origin(self):
        run = subprocess.run(RUN, cwd=ROOT, capture_output=True, check=True, text=True)
        receipt = json.loads(run.stdout)
        self.assertEqual(receipt, json.loads((ARTIFACTS / 'FPT_CAPITAL_ALLOCATION_WORKFLOW.json').read_text()))
        steps = {row['stage']: row['result'] for row in receipt['evidence']}
        self.assertEqual(list(steps)[-5:], ['PREPARE', 'ASSESSMENT_ADOPTION', 'PREFLIGHT', 'SCORING', 'RESEARCH_SCORECARD'])
        self.assertFalse(any(steps['PREFLIGHT']['permissions'].values()))
        self.assertEqual(steps['PREPARE']['applicability']['CA-DIST']['origin'], '2026-06-30')
        self.assertIsNone(steps['PREPARE']['applicability']['CA-DIST']['direct'])
        self.assertIn('45/97 rated', steps['RESEARCH_SCORECARD']['html'])

    def test_publication_argument_refused(self):
        self.assertNotEqual(subprocess.run(RUN + ['--publish'], cwd=ROOT, capture_output=True).returncode, 0)
