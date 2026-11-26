from copy import deepcopy
from pathlib import Path
import json
import subprocess
import unittest

from tools.scoring import vn30_fh_successor as wp2

COMMAND = ['python3', '-B', 'tools/scoring/vn30_fh_successor.py', '--ticker', 'FPT',
           '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115']


class FinancialHealthWorkflow(unittest.TestCase):
    def test_complete_queue_and_deterministic_exact_replay(self):
        output = subprocess.check_output(COMMAND, cwd=wp2.ROOT)
        self.assertEqual(output, (wp2.DIR / 'FPT_WP2_WORKFLOW_RESULT.json').read_bytes())
        result = json.loads(output)
        self.assertFalse(any(result['permissions'].values()))
        steps = {row['stage']: row['result'] for row in result['evidence']}
        self.assertEqual(list(steps), ['CANDIDATE', 'PREPARE', 'ASSESSMENT_ADOPTION', 'PREFLIGHT', 'SCORING', 'RESEARCH_SCORECARD'])
        scorer = steps['SCORING']
        self.assertEqual(steps['PREPARE']['effectiveScores'], scorer['aggregation']['effectiveScores'])
        self.assertEqual(scorer['investmentDecisionInput']['effectiveScores'], scorer['aggregation']['effectiveScores'])
        self.assertIsNone(scorer['researchRanking'][0]['rank'])
        self.assertIn('FH-LIQ: N/R', steps['RESEARCH_SCORECARD']['html'])

    def test_prepare_does_not_certify_expired_provisional_or_modified_bq(self):
        result = json.loads((wp2.DIR / 'FPT_FH_RESULT.json').read_bytes())
        rows = deepcopy(result['aggregation']['effectiveScores'])
        self.assertEqual(wp2.prepare_assessment(result, rows[:4], '2026-11-13')['status'], 'PREPARED_BQ_FH')
        result['aggregation']['effectiveScores'][0]['points'] = 6
        with self.assertRaisesRegex(ValueError, 'FH_PREPARE_SCOPE_MISMATCH'):
            wp2.prepare_assessment(result, rows[:4], '2026-11-13')
        result['aggregation']['effectiveScores'][0]['points'] = 5
        result['aggregation']['effectiveScores'][4]['validity'] = 'PROVISIONAL'
        result['fh'][0]['effectiveScore']['validity'] = 'PROVISIONAL'
        result['fh'][0]['freshness']['expired'] = True
        with self.assertRaisesRegex(ValueError, 'FH_EFFECTIVE_SCORE_NOT_ELIGIBLE'):
            wp2.prepare_assessment(result, rows[:4], '2026-11-13')

    def test_category_skill_references_and_read_only_scope(self):
        names = ('equity-s1-s5-assessment', 'vn30-evidence-coverage-closure', 'vn30-incremental-scoring',
                 'vn30-rollout-orchestrator', 'vn30-structural-nr-remediation', 'vn30-scoring-publication-hygiene')
        for name in names:
            path = wp2.ROOT / 'skills' / name / 'SKILL.md'
            section = path.read_text().split('## Governed category rollout')[-1]
            self.assertTrue(all(param in section for param in ('ticker', 'category', 'cutoff', 'methodologyVersion',
                                                               'priorAcceptedCategories', 'executionScope')))
            self.assertTrue((path.parent / '../../docs/03 SCORING/WP2_FINANCIAL_HEALTH_AMENDMENT_v1.0.json').is_file())
            self.assertNotIn('FPT', section)
        state = subprocess.run(COMMAND + ['--publish'], cwd=wp2.ROOT, capture_output=True)
        self.assertNotEqual(state.returncode, 0)
