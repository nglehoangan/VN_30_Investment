"""Synthetic PIT replays. No writes or authority changes."""
from pathlib import Path
import hashlib
from unittest import TestCase
from unittest.mock import patch

from tools.scoring import annual_reassessment as engine
from tools.scoring.structural_nr import digest

SUBJECT = {'ticker': 'FPT', 'securityId': 'security-fpt', 'sector': 'TECHNOLOGY'}
METHOD = {'path': 'method', 'sha256': 'a' * 64}
PIN = {'path': 'evidence', 'sha256': 'b' * 64}


def fixture_row(id, dep, date='2025-12-31', release='2026-03-19', value='1'):
    return {**SUBJECT, 'id': id, 'dependency': dep, 'periodEnd': date, 'publishedAt': release + 'T02:00:00Z',
            'knownAt': release + 'T03:00:00Z', 'eligibility': 'HISTORICAL_PIT', 'admitted': True, 'revoked': False,
            'source': PIN, 'admission': PIN, 'value': value, 'unit': 'VND', 'scope': 'CONSOLIDATED',
            'normalization': 'comparable'}


def report(year=2025, release='2026-03-19'):
    return {**fixture_row('annual-' + release, 'earnings', f'{year}-12-31', release),
            'periodType': 'FY', 'fiscalYear': year, 'statementVersion': release, 'status': 'AUDITED_FINAL', 'metricVersions': ['m1'],
            'corporateActionComparability': 'reviewed'}


def snap(date):
    return {**SUBJECT, 'cutoff': date, 'knownAt': date + 'T15:00:00Z', 'methodology': METHOD,
            'annualReports': [report()], 'observations': [fixture_row('customer', 'competitive_position'),
                                                         fixture_row('income', 'earnings')],
            'assessments': {}}


class AnnualReassessmentTests(TestCase):
    def setUp(self):
        path = Path(engine.METHODOLOGY)
        self.rubrics = engine._rubrics({'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
        self.old = snap('2026-04-01')
        self.new = snap('2026-04-30')
        for id in self.rubrics:
            self.assess(self.old, id)
        self.assess(self.old, 'BQ-MOAT', 3)
        self.assess(self.old, 'BQ-EQ', 3)

    def assess(self, snapshot, id, points=None):
        with patch.object(engine, 'artifact', return_value=snapshot), patch.object(engine, 'source'):
            _, annual, active, _ = engine._snapshot({}, SUBJECT, METHOD, 'HISTORICAL_PIT')
        basis = engine.assessment_basis(id, annual, active, METHOD, snapshot.get('valuationAssumptions'))
        topics = {}
        band = None
        if points is not None:
            rubric = self.rubrics[id]
            band = next(row['label'] for row in rubric['bands'] if row['min'] <= points <= row['max'])
            refs = [key for dep in engine.RUBRIC_DEPENDENCIES[id] for key in active.get(dep, {})]
            assert refs
            topics = dict.fromkeys(rubric['topics'], refs)
        snapshot['assessments'][id] = {'state': 'N/R' if points is None else 'VERIFIED',
            'points': points, 'band': band, 'rootCause': 'insufficient' if points is None else None,
            'rationale': 'fixture', 'bandReview': 'fixture', 'topics': topics, 'review': PIN,
            'snapshotHash': basis, 'reviewedAt': snapshot['knownAt'], 'validThrough': '2027-12-31'}

    def run_packet(self, prior=True):
        subject = {**SUBJECT, 'cutoff': self.new['cutoff'], 'universeVersion': 'test'}
        req = {**SUBJECT, 'referenceDate': self.new['cutoff'], 'universe': {'version': 'test'}}
        packet = {'contract': 'segm-annual-reassessment-v1', 'subject': subject, 'purpose': 'HISTORICAL_PIT',
                  'methodology': METHOD, 'rubrics': {}, 'current': 'new', 'prior': 'old' if prior else None}
        with patch.object(engine, 'artifact', side_effect={'new': self.new, 'old': self.old}.get),              patch.object(engine, 'source'), patch.object(engine, '_rubrics', return_value=self.rubrics):
            return engine.evaluate_annual({'request': req}, packet)

    def test_a_fy2025_available_at_april_1_without_future_filing(self):
        self.new = snap('2026-04-01')
        self.new['annualReports'].append(report(2025, '2026-05-01'))
        result = self.run_packet(prior=False)
        self.assertEqual(result['annualBaseline']['report']['statementVersion'], '2026-03-19')
        self.assertEqual(len(result['rubrics']), 23)

    def test_b_irrelevant_quarterly_release(self):
        # The Q1 report arrived but the admitted normalized inputs did not change.
        q1 = fixture_row('q1', 'earnings', '2026-03-31', '2026-04-29')
        q1['admitted'] = False
        self.new['observations'].append(q1)
        result = self.run_packet()
        self.assertEqual(result['rubrics']['BQ-EQ']['outcome'], 'KEEP')
        self.assertFalse(result['annualBaselineChanged'])

    def test_c_one_reviewed_band_changes(self):
        self.new['cutoff'], self.new['knownAt'] = '2026-08-01', '2026-08-01T15:00:00Z'
        self.new['observations'].append(fixture_row('q2', 'returns', '2026-06-30', '2026-07-25'))
        self.assess(self.new, 'BQ-EQ', 5)
        result = self.run_packet()
        self.assertEqual(result['rubrics']['BQ-EQ']['outcome'], 'UPGRADE')
        self.assertTrue(all(r['outcome'] != 'UPGRADE' for id,r in result['rubrics'].items() if id != 'BQ-EQ'))

    def test_d_nr_to_rated_requires_review(self):
        self.new['observations'].append(fixture_row('industry', 'industry'))
        self.assertEqual(self.run_packet()['rubrics']['IC-IND']['outcome'], 'REVIEW_REQUIRED')
        self.assess(self.new, 'IC-IND', 2)
        self.assertEqual(self.run_packet()['rubrics']['IC-IND']['outcome'], 'N/R_TO_RATED')

    def test_e_invalidation_and_explicit_nr(self):
        self.new['observations'][0]['revoked'] = True
        self.assertIsNone(self.run_packet()['rubrics']['BQ-MOAT']['assessment'])
        self.assess(self.new, 'BQ-MOAT')
        self.assertEqual(self.run_packet()['rubrics']['BQ-MOAT']['outcome'], 'RATED_TO_N/R')

    def test_f_corporate_action_invalidates_per_share(self):
        self.new['observations'].append(fixture_row('split', 'corporate_actions', '2026-04-20', '2026-04-20'))
        result = self.run_packet()
        self.assertTrue(result['valuation']['reassess'])
        self.assertTrue(result['rubrics']['CA-PSV']['impacted'])
        self.assertEqual(result['rubrics']['BQ-MOAT']['outcome'], 'KEEP')

    def test_g_successor_fy(self):
        self.new = snap('2027-04-01')
        self.new['annualReports'].append(report(2026, '2027-03-19'))
        self.assertEqual(self.run_packet()['annualBaseline']['report']['fiscalYear'], 2026)
        self.new['annualReports'][1]['admitted'] = False
        self.assertEqual(self.run_packet()['annualBaseline']['report']['fiscalYear'], 2025)

    def test_h_restatement_does_not_rewrite_old_snapshot(self):
        original = digest(self.old)
        self.new['annualReports'].append(report(2025, '2026-04-20'))
        result = self.run_packet()
        self.assertTrue(result['annualBaselineChanged'])
        self.assertEqual(result['rubrics']['BQ-EQ']['outcome'], 'REVIEW_REQUIRED')
        self.assertEqual(digest(self.old), original)
        self.assertEqual(self.run_packet(), result)

    def test_i_market_price_only(self):
        self.new['observations'].append(fixture_row('close', 'price', '2026-04-30', '2026-04-30', '50000'))
        result = self.run_packet()
        self.assertTrue(result['valuation']['reassess'])
        self.assertEqual(result['rubrics']['BQ-EQ']['outcome'], 'KEEP')
        self.assertEqual(result['rubrics']['VAL-MOS']['outcome'], 'REVIEW_REQUIRED')

    def test_j_missing_critical_does_not_stop_independent_review(self):
        self.new['annualReports'] = []
        result = self.run_packet()
        self.assertEqual(result['decision']['status'], 'BLOCKED')
        self.assertEqual(result['valuation']['status'], 'BLOCKED')
        self.assertEqual(result['rubrics']['BQ-MOAT']['outcome'], 'KEEP')
        self.assertEqual(result['authorityEffect'], 'NONE')

    def test_current_only_and_expired_evidence_are_not_pit(self):
        self.new['observations'][0]['eligibility'] = 'CURRENT_ONLY'
        self.new['observations'][1]['validThrough'] = '2026-04-25'
        result = self.run_packet()
        for id in ('BQ-MOAT','BQ-EQ'):
            self.assertEqual(result['rubrics'][id]['outcome'], 'REVIEW_REQUIRED')

    def test_forged_prior_basis_cannot_keep(self):
        self.old['assessments']['BQ-MOAT']['snapshotHash'] = 'x'
        self.assertEqual(self.run_packet()['rubrics']['BQ-MOAT']['outcome'], 'REVIEW_REQUIRED')

    def test_final_published_after_cutoff_excluded_even_for_current_purpose(self):
        self.new['annualReports'].append(report(2025, '2026-05-01'))
        self.new['knownAt'] = '2026-05-02T00:00:00Z'
        with patch.object(engine, 'artifact', return_value=self.new), patch.object(engine, 'source'):
            _, baseline, _, _ = engine._snapshot({}, SUBJECT, METHOD, 'CURRENT_FORMAL_VALUATION')
        self.assertEqual(baseline['report']['statementVersion'], '2026-03-19')

    def test_reject_unsupported_proxy(self):
        self.assess(self.new, 'BQ-MOAT', 3)
        self.new['assessments']['BQ-MOAT']['proxy'] = 'invented'
        with self.assertRaisesRegex(ValueError, 'PROXY_REQUIRES_GOVERNED_CONSUMER'):
            self.run_packet()

    def test_report_coverage_without_normalizing_missing_weight(self):
        result = self.run_packet()['diagnosticCoverage']
        self.assertEqual(result['totalRubrics'], 23)
        self.assertEqual(result['ratedPoints'], 6)
        self.assertEqual(result['ratedWeight'], 14)
        self.assertEqual(result['states']['N/R'], 21)
        self.assertEqual(result['totalWeight'], 100)
