import json
import subprocess
import unittest

from tools.scoring import vn30_gq_successor as wp3


COMMAND = [
    'python3', '-B', 'tools/scoring/vn30_gq_successor.py', '--ticker', 'FPT',
    '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115',
]


class GrowthWorkflow(unittest.TestCase):
    def test_replays_all_stages_and_preserves_qualified_consumers(self):
        raw = subprocess.check_output(COMMAND, cwd=wp3.ROOT)
        self.assertEqual(raw, (wp3.DIR / 'FPT_GROWTH_WORKFLOW.json').read_bytes())
        receipt = json.loads(raw)
        self.assertFalse(any(receipt['permissions'].values()))
        stages = {step['stage']: step['result'] for step in receipt['evidence']}
        self.assertEqual(list(stages), [
            'CANDIDATE', 'PREPARE', 'ASSESSMENT_ADOPTION', 'PREFLIGHT', 'SCORING', 'RESEARCH_SCORECARD',
        ])
        prepared, scored = stages['PREPARE'], stages['SCORING']
        agg = scored['aggregation']
        self.assertEqual(prepared['effectiveScores'], agg['effectiveScores'])
        self.assertEqual(prepared['routeQualifiers'], scored['routeQualifiers'])
        self.assertEqual(prepared['effectiveRouteQualifications'], agg['routeQualifications'])
        self.assertEqual(scored['investmentDecisionInput']['routeQualifications'], agg['routeQualifications'])
        self.assertEqual(scored['researchRanking'][0]['routeQualifications'], agg['routeQualifications'])
        self.assertEqual(agg['coverage']['provisional'], {'count': 4, 'weight': 24})
        self.assertEqual(agg['coverage']['outsideRollout'], {'count': 13, 'weight': 45})
        self.assertIsNone(agg['formalScore'])
        self.assertIn('GQ-INC: 2 · PROVISIONAL', stages['RESEARCH_SCORECARD']['html'])

    def test_prepare_rejects_predecessor_or_qualification_mismatch(self):
        data = json.loads((wp3.DIR / 'FPT_GROWTH_RESULT.json').read_bytes())
        accepted = data['aggregation']['effectiveScores'][:7]
        with self.assertRaisesRegex(ValueError, 'GROWTH_PREPARE_SCOPE_MISMATCH'):
            wp3.prepare_assessment(data, accepted[:-1], '2026-11-13')
        data['growth'][2]['effectiveScore']['routeQualification']['selectedPoints'] = 4
        with self.assertRaisesRegex(ValueError, 'GROWTH_EFFECTIVE_BINDING_MISMATCH'):
            wp3.prepare_assessment(data, accepted, '2026-11-13')

    def test_rejects_publication_and_checks_all_six_skill_links(self):
        self.assertNotEqual(subprocess.run(COMMAND + ['--publish'], cwd=wp3.ROOT, capture_output=True).returncode, 0)
        for skill in ('equity-s1-s5-assessment', 'vn30-evidence-coverage-closure', 'vn30-incremental-scoring',
                      'vn30-rollout-orchestrator', 'vn30-structural-nr-remediation', 'vn30-scoring-publication-hygiene'):
            parent = wp3.ROOT / 'skills' / skill
            guidance = (parent / 'SKILL.md').read_text().split('### Approved Growth Quality research routes')[-1]
            self.assertIn('WP3_GROWTH_QUALITY_AMENDMENT_v1.0.json', guidance)
            self.assertNotIn('FPT', guidance)
            self.assertTrue((parent / '../../docs/03 SCORING/WP3_GROWTH_QUALITY_AMENDMENT_v1.0.json').is_file())
