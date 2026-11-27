"""Verify the FPT WP6 handoff and its research-only scorecard."""
import json
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = ROOT / 'docs/fundamental-data-engine/fpt-risk-governance/v1.0'
RUN = ['python3', 'tools/scoring/vn30_risk_governance_successor.py', '--ticker', 'FPT',
       '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115']


class RiskGovernanceWorkflow(unittest.TestCase):
    def test_replay_adoption_preflight_and_scorecard(self):
        completed = subprocess.run(RUN, cwd=ROOT, capture_output=True, check=True, text=True)
        receipt = json.loads(completed.stdout)
        self.assertEqual(receipt, json.loads((ARTIFACTS / 'FPT_RISK_GOVERNANCE_WORKFLOW.json').read_text()))
        steps = {step['stage']: step['result'] for step in receipt['evidence']}
        self.assertEqual(list(steps)[-6:], ['EFFECTIVE_SCORE', 'PREPARE', 'ASSESSMENT_ADOPTION',
                                           'PREFLIGHT', 'SCORING', 'RESEARCH_SCORECARD'])
        self.assertFalse(any(steps['PREFLIGHT']['permissions'].values()))
        scoring = steps['SCORING']
        scores = scoring['aggregation']
        self.assertEqual([row['points'] for row in scores['effectiveScores'][16:]], [3, 1, 0])
        self.assertEqual((scores['assessedPoints'], scores['ratedWeight']), (43, 95))
        self.assertIsNone(scores['formalScore'])
        self.assertEqual(scoring['investmentDecisionInput']['gates']['hardVeto'], 'PENDING')
        self.assertEqual(scoring['investmentDecisionInput']['gates']['residualRisk'], 'NOT_RATED')
        self.assertIn('<td>RG-UNC</td><td>A</td><td>0</td>', steps['RESEARCH_SCORECARD']['html'])

    def test_unauthorized_cli_arguments_are_rejected(self):
        for extra in (['--ticker', 'FPT'], ['--publish']):
            with self.subTest(extra=extra):
                self.assertNotEqual(subprocess.run(RUN + extra, cwd=ROOT, capture_output=True).returncode, 0)


if __name__ == '__main__':
    unittest.main()
