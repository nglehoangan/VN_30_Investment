import json
import subprocess
import unittest

from tools.scoring import vn30_val_successor as wp5


COMMAND = [
    'python3', '-B', 'tools/scoring/vn30_val_successor.py', '--ticker', 'FPT', '--cutoff', '2026-11-13',
    '--universe-version', 'vn30-20260803-reviewed-20261115',
]


class ValuationWorkflow(unittest.TestCase):
    def test_replays_predecessors_and_each_valuation_disposition(self):
        raw = subprocess.check_output(COMMAND, cwd=wp5.ROOT)
        self.assertEqual(raw, (wp5.DIR / 'FPT_VALUATION_WORKFLOW.json').read_bytes())
        receipt = json.loads(raw)
        self.assertFalse(any(receipt['permissions'].values()))
        stages = {row['stage']: row['result'] for row in receipt['evidence']}
        self.assertEqual(list(stages), ['CANDIDATE', 'PREPARE', 'ASSESSMENT_ADOPTION', 'PREFLIGHT',
                                       'SCORING', 'RESEARCH_SCORECARD'])
        prepared, scoring = stages['PREPARE'], stages['SCORING']
        agg = scoring['aggregation']
        self.assertEqual(prepared['effectiveScores'], agg['effectiveScores'])
        self.assertEqual(prepared['effectiveRouteQualifications'], agg['routeQualifications'])
        self.assertEqual(prepared['routeQualifiers'], scoring['routeQualifiers'])
        self.assertEqual(agg['coverage']['genuineNR'], {'count': 3, 'weight': 20})
        self.assertEqual(agg['coverage']['outsideRollout'], {'count': 7, 'weight': 15})
        self.assertIsNone(agg['formalScore'])
        self.assertIsNone(scoring['researchRanking'][0]['rank'])
        self.assertEqual(scoring['investmentDecisionInput']['gates']['valuation'], 'NOT_ASSESSED')
        self.assertIn('VAL-PRIMARY: N/R', stages['RESEARCH_SCORECARD']['html'])

    def test_rejects_synthetic_price_at_prepare_and_publication(self):
        result = json.loads((wp5.DIR / 'FPT_VALUATION_RESULT.json').read_bytes())
        accepted = result['aggregation']['effectiveScores'][:13]
        with self.assertRaisesRegex(ValueError, 'VALUATION_PREPARE_SCOPE_MISMATCH'):
            wp5.prepare_assessment(result, accepted[:-1], '2026-11-13')
        for row in [result['aggregation']['effectiveScores'][13], result['valuation']['current'][0]]:
            row['routeQualification']['synthetic'] = True
        with self.assertRaisesRegex(ValueError, 'VALUATION_INELIGIBLE_EFFECTIVE_SCORE'):
            wp5.prepare_assessment(result, accepted, '2026-11-13')
        self.assertNotEqual(subprocess.run(COMMAND + ['--publish'], cwd=wp5.ROOT, capture_output=True).returncode, 0)

    def test_six_scoring_skills_link_current_research_baseline(self):
        for name in ('equity-s1-s5-assessment', 'vn30-evidence-coverage-closure', 'vn30-incremental-scoring',
                     'vn30-rollout-orchestrator', 'vn30-structural-nr-remediation', 'vn30-scoring-publication-hygiene'):
            p = wp5.ROOT / 'skills' / name
            guidance = (p / 'SKILL.md').read_text().split('### Approved Valuation & Forward Return research routes')[-1]
            self.assertIn('WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.0.json', guidance)
            self.assertTrue((p / '../../docs/03 SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.0.json').is_file())
