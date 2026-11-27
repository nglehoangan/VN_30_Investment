import json
import subprocess
import unittest

from tools.scoring import vn30_bounded_return_successor as wp

COMMAND = ['python3', '-B', 'tools/scoring/vn30_bounded_return_successor.py', '--ticker', 'FPT',
           '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115']


class BoundedValuationWorkflow(unittest.TestCase):
    def test_exact_workflow_and_unchanged_authority(self):
        raw = subprocess.check_output(COMMAND, cwd=wp.ROOT)
        self.assertEqual(raw, (wp.DIR / 'FPT_VALUATION_WORKFLOW.json').read_bytes())
        receipt = json.loads(raw)
        self.assertFalse(any(receipt['permissions'].values()))
        stages = {row['stage']: row['result'] for row in receipt['evidence']}
        self.assertEqual(stages['PREPARE']['effectiveScores'], stages['SCORING']['aggregation']['effectiveScores'])
        self.assertEqual(stages['PREPARE']['routeQualifiers'], stages['SCORING']['routeQualifiers'])
        self.assertEqual(stages['SCORING']['investmentDecisionInput']['gates']['valuation'], 'NOT_ASSESSED')
        self.assertIsNone(stages['SCORING']['aggregation']['formalScore'])
        self.assertIn('VAL-RET: N/R', stages['RESEARCH_SCORECARD']['html'])

    def test_prepare_distinguishes_numeric_zero_from_missing(self):
        data = json.loads((wp.DIR / 'FPT_VALUATION_RESULT.json').read_bytes())
        before = wp.prepare_assessment(data, data['aggregation']['effectiveScores'][:13], '2026-11-13')
        self.assertIsNone(before['effectiveScores'][14]['points'])
        for row in (data['valuation']['current'][1], data['aggregation']['effectiveScores'][14]):
            row.update(points=0, basis='RECALCULATED_AT_CUTOFF', validity='CONFIRMED_CURRENT')
            row['routeQualification']['route'] = 'A'
        after = wp.prepare_assessment(data, data['aggregation']['effectiveScores'][:13], '2026-11-13')
        self.assertEqual(after['effectiveScores'][14]['points'], 0)
        self.assertNotEqual(subprocess.run(COMMAND + ['--publish'], cwd=wp.ROOT, capture_output=True).returncode, 0)

    def test_seven_scoring_skills_reference_v12(self):
        for name in ('equity-s1-s5-assessment', 'vn30-evidence-coverage-closure', 'vn30-incremental-scoring',
                     'vn30-rollout-orchestrator', 'vn30-structural-nr-remediation', 'vn30-scoring-publication-hygiene',
                     'vn30-external-research-evidence'):
            skill = wp.ROOT / 'skills' / name
            self.assertIn('WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.2.json', (skill / 'SKILL.md').read_text())
            self.assertTrue((skill / '../../docs/03 SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.2.json').is_file())
