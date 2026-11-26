from copy import deepcopy
import json
from pathlib import Path
import subprocess
import unittest

from tools.scoring import vn30_fh_dual_route as dual

COMMAND = ['python3', '-B', 'tools/scoring/vn30_fh_dual_route.py', '--ticker', 'FPT',
           '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115']


class FhDualRouteWorkflow(unittest.TestCase):
    def test_exact_queued_execution_and_downstream_bindings(self):
        raw = subprocess.check_output(COMMAND, cwd=dual.ROOT)
        self.assertEqual(raw, (dual.DIR/'FPT_FH_DUAL_ROUTE_WORKFLOW_RESULT.json').read_bytes())
        result = json.loads(raw)
        self.assertFalse(any(result['permissions'].values()))
        stages = {step['stage']: step['result'] for step in result['evidence']}
        self.assertEqual(list(stages), ['CANDIDATE','PREPARE','ASSESSMENT_ADOPTION','PREFLIGHT','SCORING','RESEARCH_SCORECARD'])
        prepared, scored = stages['PREPARE'], stages['SCORING']
        self.assertEqual(prepared['routeQualifiers'], scored['routeQualifiers'])
        self.assertEqual(prepared['effectiveScores'], scored['aggregation']['effectiveScores'])
        self.assertEqual(scored['investmentDecisionInput']['effectiveScores'], prepared['effectiveScores'])
        self.assertIsNone(scored['researchRanking'][0]['rank'])
        self.assertIsNone(scored['aggregation']['provisionalInvestmentScore'])
        self.assertIn('Genuine N/R: 2, 9/100', stages['RESEARCH_SCORECARD']['html'])

    def test_unchanged_scope_rejects_bad_bq_and_publication(self):
        evaluated = json.loads((dual.DIR/'FPT_FH_DUAL_ROUTE_RESULT.json').read_bytes())
        wp1 = deepcopy(evaluated['aggregation']['effectiveScores'][:4])
        prepared = dual.prepare_assessment(evaluated, wp1, '2026-11-13')
        self.assertEqual(prepared['outsideScopeCount'], 16)
        self.assertEqual(prepared['economicNrInScope'], ['FH-LIQ', 'FH-STRESS'])
        wp1[0]['points'] = 6
        with self.assertRaisesRegex(ValueError, 'FH_PREPARE_SCOPE_MISMATCH'):
            dual.prepare_assessment(evaluated, wp1, '2026-11-13')
        self.assertNotEqual(subprocess.run(COMMAND + ['--publish'], cwd=dual.ROOT, capture_output=True).returncode, 0)

    def test_six_skill_links(self):
        names = ('equity-s1-s5-assessment', 'vn30-evidence-coverage-closure', 'vn30-incremental-scoring',
                 'vn30-rollout-orchestrator', 'vn30-structural-nr-remediation', 'vn30-scoring-publication-hygiene')
        expected = Path('../../docs/03 SCORING/WP2_FINANCIAL_HEALTH_DUAL_ROUTE_v1.1.json')
        for name in names:
            skill = dual.ROOT / 'skills' / name
            text = skill.joinpath('SKILL.md').read_text().split('### Approved Financial Health A/B routes')[-1]
            self.assertIn('WP2_FINANCIAL_HEALTH_DUAL_ROUTE_v1.1.json', text)
            self.assertTrue((skill / expected).is_file())
            self.assertNotIn('FPT', text)
