"""Regression coverage for the read-only SEGM research-to-scoring bridge."""

from argparse import Namespace
from copy import deepcopy
import json
from pathlib import Path
from unittest import TestCase
from unittest.mock import patch

from tools.scoring import annual_reassessment as annual
from tools.scoring import vn30_prepare_evaluation as cli
from tools.scoring.research_scoring_bridge import reconcile

PACKET = next(Path('docs/fundamental-data-engine/fpt-scoring-readiness').rglob('FPT_SEGM_V13_PACKET.json'))
DIAGNOSIS = PACKET.with_name('FPT_SEGM_V11_DIAGNOSTIC.json')


class ResearchBridgeTests(TestCase):
    def setUp(self):
        self.args = Namespace(ticker='FPT', cutoff='2026-11-13', universe_version='vn30-20260803-reviewed-20261115',
                              mode='prepare', candidate=None, previous_proposal=None, research_bridge=True,
                              annual_reassessment=PACKET, rubric_completion=DIAGNOSIS)
        self.packet = json.loads(PACKET.read_text())
        self.diagnosis = json.loads(DIAGNOSIS.read_text())
        baseline = annual.artifact(self.diagnosis['baseline'])
        self.native = {'status': 'READY_FOR_CIO', 'preflightHash': 'retained',
                       'inventory': {'current_score_artifact': [{'id': baseline['id'], 'sha256': baseline['bodyHash']}]}}
        self.job = cli.scope(self.args)[2]

    def test_retained_packet_preserves_official_and_marks_research(self):
        with patch.object(cli, 'execute', return_value=self.native):
            result = cli.prepare_with_evaluation(self.args)
        self.assertEqual({k: result[k] for k in self.native}, self.native)
        bridge = result['researchScoringBridge']
        self.assertFalse(bridge['officialEligibleForChange'])
        self.assertEqual(len(bridge['rows']), 23)
        rows = {row['rubricId']: row for row in bridge['rows']}
        self.assertEqual(rows['BQ-MOAT']['officialPoints'], 3)
        self.assertIsNone(rows['FH-STRESS']['candidate'])
        self.assertIsNone(rows['RG-UNC']['officialPoints'])
        self.assertEqual(rows['RG-UNC']['candidate']['points'], 0)
        self.assertEqual(rows['RG-UNC']['candidate']['state'], 'CONSERVATIVE')
        self.assertEqual(rows['RG-UNC']['candidate']['status'], 'RESEARCH_CANDIDATE')

    def test_reconciled_scope_and_shared_metric(self):
        result = annual.evaluate_annual(self.job, self.packet)
        self.assertEqual(result['annualBaseline']['report']['fiscalYear'], 2025)
        self.assertEqual(result['annualBaseline']['report']['eligibility'], 'CURRENT_ONLY')
        fcf = result['sharedMetrics']['reportedFcf']
        self.assertEqual(fcf['value'], '-2482149243519')
        self.assertTrue({'BQ-CASH', 'RG-UNC', 'VAL-PRIMARY'} <= set(fcf['consumers']))
        self.assertEqual(result['valuation']['missingInputs'], ['normalized_earnings_or_cash_flow'])
        self.assertEqual(result['decision']['status'], 'BLOCKED')

    def test_invalid_cashflow_mapping_cannot_supply_valuation(self):
        self.packet['reportedFcf']['CFO']['pointer'] = '/cells/6'
        result = annual.evaluate_annual(self.job, self.packet)
        self.assertEqual(result['sharedMetrics']['reportedFcf']['reason'], 'FCF_OPERAND_LINEAGE_MISMATCH')
        self.assertEqual(result['valuation']['status'], 'BLOCKED')

    def test_publication_metadata_cannot_grant_historical_pit(self):
        self.packet['purpose'] = 'HISTORICAL_PIT'
        with self.assertRaisesRegex(ValueError, 'PIT_CUTOFF_MISMATCH'):
            annual.evaluate_annual(self.job, self.packet)

    def test_bridge_requires_exact_stored_baseline(self):
        self.native['inventory']['current_score_artifact'][0]['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'EXACT_OFFICIAL_BASELINE_READBACK_REQUIRED'):
            reconcile(self.native, annual.evaluate_annual(self.job, self.packet), self.diagnosis, self.packet)

    def test_assessment_candidate_conflict_is_blocked(self):
        result = annual.evaluate_annual(self.job, self.packet)
        review = deepcopy(result['rubrics']['BQ-MOAT']['assessment'])
        result['rubrics']['RG-UNC']['assessment'] = review
        with self.assertRaisesRegex(ValueError, 'CONFLICTING_RESEARCH_DISPOSITIONS'):
            reconcile(self.native, result, self.diagnosis, self.packet)

    def test_eligible_annual_assessment_is_a_successor_candidate_only(self):
        result = annual.evaluate_annual(self.job, self.packet)
        # Simulate the annual validator returning the same candidate after topic review.
        row = next(row for row in self.diagnosis['rows'] if row['rubricId'] == 'RG-UNC')
        result['rubrics']['RG-UNC']['assessment'] = row['disposition']
        bridge = reconcile(self.native, result, self.diagnosis, self.packet)
        row = next(row for row in bridge['rows'] if row['rubricId'] == 'RG-UNC')
        self.assertEqual(row['candidate']['status'], 'ASSESSMENT_CANDIDATE')
        self.assertTrue(row['requiresSuccessorApproval'])
        self.assertIsNone(row['officialPoints'])
        self.assertFalse(bridge['officialEligibleForChange'])

    def test_current_research_published_after_cutoff_is_not_a_candidate(self):
        row = next(row for row in self.diagnosis['rows'] if row['rubricId'] == 'RG-UNC')
        row['disposition']['scoreEvidence'][0]['publicationDate'] = '2026-11-14'
        with self.assertRaisesRegex(ValueError, 'BRIDGE_RESEARCH_PUBLISHED_AFTER_CUTOFF'):
            reconcile(self.native, annual.evaluate_annual(self.job, self.packet), self.diagnosis, self.packet)
