from copy import deepcopy
import json
import subprocess
import unittest
from tools.scoring import vn30_fh_bounded_closure as closure

COMMAND = ['python3', '-B', 'tools/scoring/vn30_fh_bounded_closure.py', '--ticker', 'FPT',
           '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115']


class FinancialHealthBoundedClosure(unittest.TestCase):
    def test_exact_end_to_end_public_projection_and_legacy_receipts(self):
        bindings = closure.wp2.wp1.read(closure.DIR / 'BINDINGS.json')
        workflow = json.loads(closure.wp2.wp1.pinned(closure.ROOT, bindings['workflow']))
        evaluated = json.loads(closure.wp2.wp1.pinned(closure.ROOT, bindings['evaluation']))
        actual = subprocess.check_output(COMMAND, cwd=closure.ROOT)
        self.assertEqual(actual, (closure.DIR / 'FPT_WP2_BOUNDED_WORKFLOW_RESULT.json').read_bytes())
        stages = {row['stage']: row['result'] for row in json.loads(actual)['workflow']['evidence']}
        a = stages['SCORING']['aggregation']
        self.assertEqual(a['coverage']['genuineNR'], {'count': 2, 'weight': 9})
        self.assertEqual(a['coverage']['outsideRollout'], {'count': 16, 'weight': 60})
        self.assertEqual(a['coverage']['unratedTotal'], {'count': 18, 'weight': 69})
        self.assertEqual(stages['SCORING']['investmentDecisionInput']['coverage'], a['coverage'])
        self.assertEqual(stages['SCORING']['researchRanking'][0]['coverage'], a['coverage'])
        self.assertIn('2 rubrics, 9/100 weight', stages['RESEARCH_SCORECARD']['html'])
        self.assertIn('16 rubrics, 60/100 weight', stages['RESEARCH_SCORECARD']['html'])
        self.assertEqual(a['effectiveScores'], evaluated['aggregation']['effectiveScores'])
        self.assertIsNone(a['provisionalInvestmentScore'])
        self.assertEqual(a['assessedPoints'], 17)
        self.assertEqual(a['ratedWeight'], 31)
        self.assertFalse(any(json.loads(actual)['workflow']['permissions'].values()))
        self.assertEqual(closure.project(workflow, evaluated), json.loads(actual)['workflow'])
        self.assertEqual(evaluated['aggregation']['coverage']['genuineNR'], {'count': 18, 'weight': 69})

    def test_scope_mismatch_is_rejected(self):
        bindings = closure.wp2.wp1.read(closure.DIR / 'BINDINGS.json')
        evaluated = json.loads(closure.wp2.wp1.pinned(closure.ROOT, bindings['evaluation']))
        aggregation = deepcopy(evaluated['aggregation'])
        aggregation['genuineNrInScope'].append(aggregation['outsideRollout'][0])
        with self.assertRaisesRegex(ValueError, 'FH_COVERAGE_SCOPE_INCONSISTENT'):
            closure.corrected_coverage(aggregation, evaluated)

    def test_no_publication_mode(self):
        self.assertNotEqual(subprocess.run(COMMAND + ['--publish'], cwd=closure.ROOT, capture_output=True).returncode, 0)
