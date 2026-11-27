import hashlib
import json
import subprocess
import unittest

from tools.scoring import vn30_val_v11_successor as successor

COMMAND = [
    'python3', '-B', 'tools/scoring/vn30_val_v11_successor.py', '--ticker', 'FPT',
    '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115',
]


class IndependentValuationWorkflow(unittest.TestCase):
    def test_source_bytes_and_scope(self):
        manifest = json.loads((successor.DIR / 'EXTERNAL_RESEARCH_EVIDENCE.json').read_bytes())
        self.assertEqual(set(manifest['reports']), {f'ERE{i:02d}' for i in range(1, 7)})
        for row in manifest['reports'].values():
            raw = (successor.ROOT / row['path']).read_bytes()
            self.assertTrue(raw.startswith(b'%PDF'))
            self.assertEqual(hashlib.sha256(raw).hexdigest(), row['sha256'])
        self.assertEqual(manifest['reports']['ERE06']['admission'], 'METHOD_ONLY')
        self.assertEqual({manifest['reports'][key]['family'] for key in ('ERE01', 'ERE02', 'ERE03')},
                         {'TCBS Research'})

    def test_exact_cumulative_replay_and_authority(self):
        raw = subprocess.check_output(COMMAND, cwd=successor.ROOT)
        self.assertEqual(raw, (successor.DIR / 'FPT_VALUATION_WORKFLOW.json').read_bytes())
        workflow = json.loads(raw)
        self.assertFalse(any(workflow['permissions'].values()))
        stages = {row['stage']: row['result'] for row in workflow['evidence']}
        self.assertEqual(stages['PREPARE']['effectiveScores'], stages['SCORING']['aggregation']['effectiveScores'])
        self.assertEqual(stages['SCORING']['investmentDecisionInput']['gates']['valuation'], 'NOT_ASSESSED')
        self.assertIsNone(stages['SCORING']['aggregation']['formalScore'])
        self.assertNotEqual(subprocess.run(COMMAND + ['--publish'], cwd=successor.ROOT, capture_output=True).returncode, 0)
