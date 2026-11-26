import json
import subprocess
import unittest

from tools.scoring import vn30_fh_analyst_risk as risk


COMMAND = [
    'python3', '-B', 'tools/scoring/vn30_fh_analyst_risk.py', '--ticker', 'FPT',
    '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115',
]


class FhAnalystRiskWorkflow(unittest.TestCase):
    def test_exact_workflow_propagates_research_route_and_preserves_formal_gates(self):
        raw = subprocess.check_output(COMMAND, cwd=risk.ROOT)
        self.assertEqual(raw, (risk.DIR / 'FPT_FH_ANALYST_RISK_WORKFLOW_RESULT.json').read_bytes())
        result = json.loads(raw)
        self.assertFalse(any(result['permissions'].values()))
        stages = {step['stage']: step['result'] for step in result['evidence']}
        self.assertEqual(list(stages), [
            'CANDIDATE', 'PREPARE', 'ASSESSMENT_ADOPTION', 'PREFLIGHT', 'SCORING', 'RESEARCH_SCORECARD',
        ])
        prepared, scored = stages['PREPARE'], stages['SCORING']
        self.assertEqual(prepared['routeQualifiers'], scored['routeQualifiers'])
        agg = scored['aggregation']
        self.assertEqual(prepared['effectiveScores'], agg['effectiveScores'])
        self.assertEqual(scored['investmentDecisionInput']['routeQualifications'], agg['routeQualifications'])
        self.assertEqual(scored['researchRanking'][0]['routeQualifications'], agg['routeQualifications'])
        self.assertEqual(agg['coverage']['genuineNR'], {'count': 0, 'weight': 0})
        self.assertEqual(agg['coverage']['outsideRollout'], {'count': 16, 'weight': 60})
        self.assertIsNone(agg['formalScore'])
        self.assertEqual(scored['investmentDecisionInput']['gates']['financialHealth'], 'NOT_ASSESSED')
        self.assertFalse(scored['investmentDecisionInput']['formalDecisionAuthorized'])
        self.assertIn('A_ANALYST_RISK', stages['RESEARCH_SCORECARD']['html'])

    def test_publication_flag_is_outside_command_contract(self):
        rejected = subprocess.run(COMMAND + ['--publish'], cwd=risk.ROOT, capture_output=True)
        self.assertNotEqual(rejected.returncode, 0)
        self.assertIn(b'unrecognized arguments: --publish', rejected.stderr)
