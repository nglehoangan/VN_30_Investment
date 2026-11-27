"""Replay the two-rubric update and verify formal authorization is still disabled."""
import json
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / 'docs/fundamental-data-engine/fpt-capital-allocation/targeted-evidence-update-2026-11-27'
COMMAND = ['python3', 'tools/scoring/vn30_fpt_targeted_capital_evidence.py', '--ticker', 'FPT',
           '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115']


class TargetedCapitalEvidence(unittest.TestCase):
    def test_exact_targeted_replay(self):
        run = subprocess.run(COMMAND, cwd=ROOT, capture_output=True, text=True, check=True)
        receipt = json.loads(run.stdout)
        self.assertEqual(receipt, json.loads((DIR / 'FPT_TARGETED_WORKFLOW.json').read_text()))
        stages = {row['stage']: row['result'] for row in receipt['evidence']}
        self.assertEqual([row['id'] for row in stages['EFFECTIVE_SCORE']['scores']], ['CA-REINV', 'CA-DIL'])
        self.assertFalse(any(stages['PREFLIGHT']['permissions'].values()))
        self.assertIn('45/97 rated', stages['RESEARCH_SCORECARD']['html'])

    def test_publication_option_rejected(self):
        run = subprocess.run(COMMAND + ['--publish'], cwd=ROOT, capture_output=True)
        self.assertNotEqual(run.returncode, 0)
