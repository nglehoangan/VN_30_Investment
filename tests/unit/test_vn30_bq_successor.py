"""Successor orchestration and formal-authority isolation."""
from argparse import Namespace
from copy import deepcopy
import json
from pathlib import Path
import subprocess
import tempfile
from unittest import TestCase
from unittest.mock import patch

from tools.scoring import vn30_bq_successor as successor
from tools.scoring import vn30_score as official

ARGS = Namespace(ticker='FPT', cutoff='2026-11-13', universe_version='vn30-20260803-reviewed-20261115')
COMMAND = ['python3', '-B', 'tools/scoring/vn30_bq_successor.py', '--ticker', ARGS.ticker,
           '--cutoff', ARGS.cutoff, '--universe-version', ARGS.universe_version]


class BusinessQualitySuccessor(TestCase):
    def setUp(self):
        self.manifest = successor.read(successor.MANIFEST)
        self.accepted = json.loads(successor.pinned(successor.ROOT, self.manifest['acceptedResult']))

    def test_prepare_accepts_exact_qualified_rows_and_legitimately_missing_supporting_detail(self):
        packet = json.loads(successor.pinned(successor.ROOT, self.manifest['assessment']))
        capex = packet['cash']['baseline']['assessment']['capex']
        self.assertFalse(capex['splitAvailable'])
        self.assertFalse(capex['material'])
        prepared = successor.prepare_assessment(self.accepted, ARGS.cutoff)
        self.assertEqual(prepared['status'], 'PREPARED')
        self.assertEqual([x['points'] for x in prepared['assessedRubrics']], [5, 3, 3, 3])
        self.assertEqual(prepared['outsideScopeCount'], 19)
        self.assertFalse(prepared['fullFormalReadiness'])

    def test_prepare_blocks_missing_core_expired_or_invalidated_when_resolver_has_no_eligible_score(self):
        for status in ('NOT_RATED', 'MATERIAL_REVIEW_PENDING', 'INVALIDATED'):
            with self.subTest(status=status):
                result = deepcopy(self.accepted)
                row = result['aggregation']['effectiveScores'][2]
                row.update(points=None, validity='N/R', updateStatus=status, basis=None,
                           certificationGaps=['VALID_BASELINE_REQUIRED'])
                prepared = successor.prepare_assessment(result, ARGS.cutoff)
                self.assertEqual(prepared['status'], 'BLOCKED')
                self.assertEqual(prepared['rubricBlockers'][0]['rubric'], 'BQ-CASH')
                self.assertEqual(prepared['rubricBlockers'][0]['reason'], 'NO_ELIGIBLE_APPROVED_EFFECTIVE_SCORE')

    def test_rejects_unauthorized_provisional_projection_and_adoption_drift(self):
        universe, request, candidate = successor.construct_candidate(ARGS)
        context = successor.prepare(request, universe)
        prepared = successor.prepare_assessment(self.accepted, ARGS.cutoff)
        adoption = successor.adopt_candidate(context, candidate, prepared)
        changed = {**adoption, 'prepareHash': 'different'}
        with self.assertRaisesRegex(ValueError, 'RESEARCH_ADOPTION_BINDING_MISMATCH'):
            successor.preflight_candidate(context, candidate, prepared, changed)
        for gap in ('VALID_BASELINE_REQUIRED', 'NEW_ANNUAL_REASSESSMENT_REQUIRED'):
            result = deepcopy(self.accepted)
            result['aggregation']['effectiveScores'][2]['certificationGaps'].append(gap)
            with self.assertRaisesRegex(ValueError, 'INVALID_PROVISIONAL_FOUNDATION'):
                successor.prepare_assessment(result, ARGS.cutoff)

    def test_isolated_existing_queue_runs_all_stages_and_reproduces_retained_receipt(self):
        with tempfile.TemporaryDirectory() as scratch, patch.object(official, 'database_inventory',
                                                                     side_effect=AssertionError('live DB access')):
            result = successor.execute(ARGS, Path(scratch))
            store = Path(scratch)
            self.assertEqual(result['status'], 'COMPLETED')
            self.assertEqual(len(list(store.glob('executions/FPT/*/attempt-0001/checkpoint-*.json'))), 6)
            self.assertEqual(successor.execute(ARGS, store), result)
        expected = successor.MANIFEST.with_name('FPT_BQ_SUCCESSOR_WORKFLOW_RESULT.json')
        self.assertEqual(result, successor.read(expected))
        stages = {row['stage']: row['result'] for row in result['evidence']}
        prepared = stages['PREPARE']
        scoring = stages['SCORING']
        aggregation = scoring['aggregation']
        self.assertEqual(aggregation['effectiveScores'], prepared['assessedRubrics'])
        self.assertEqual([(r['id'], r['points']) for r in aggregation['effectiveScores']], list(zip(successor.BQ, [5, 3, 3, 3])))
        self.assertTrue(all(row['materialDependencies'] for row in aggregation['effectiveScores'] if row['validity'] == 'PROVISIONAL'))
        self.assertEqual(aggregation['businessQuality']['points'], 14)
        self.assertEqual(aggregation['businessQuality']['validity'], 'PROVISIONAL')
        self.assertIsNone(aggregation['provisionalInvestmentScore'])
        self.assertEqual(aggregation['coverage']['genuineNR']['count'], 19)
        self.assertIsNone(scoring['researchRanking'][0]['rank'])
        self.assertFalse(scoring['investmentDecisionInput']['formalDecisionAuthorized'])
        self.assertIn('Business Quality 14/25', stages['RESEARCH_SCORECARD']['html'])
        self.assertFalse(any(result['permissions'].values()))

    def test_rejects_formal_score_publication_and_ineligible_ticker(self):
        for extra in (['--publish'], ['--mode', 'score'], ['--ticker', 'FPT']):
            response = subprocess.run(COMMAND + extra, cwd=successor.ROOT, capture_output=True)
            self.assertNotEqual(response.returncode, 0)
        with self.assertRaisesRegex(ValueError, 'SUCCESSOR_CANDIDATE_SCOPE_MISMATCH'):
            successor.construct_candidate(Namespace(**{**vars(ARGS), 'ticker': 'ACB'}))
