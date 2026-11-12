import copy
import hashlib
import json
import unittest
from pathlib import Path
from lib.share_count_carry_forward import assess_share_count, CARRIED, CLOSED


class CarryForwardTests(unittest.TestCase):
    def setUp(self):
        self.anchor = dict(ticker='VNM', asOf='2026-09-30', shares='2089955445',
                           eligibleForOwnerReference=True, sourceReference='statement#page=59')
        self.review = dict(ticker='VNM', **{'from': '2026-10-01'}, through='2026-10-30',
                           reviewedAt='2026-11-12T08:00:00+00:00', inventoryReviewed=True,
                           unreviewedRelevantDocuments=[], completeNegativeSearch=True,
                           limitations=[], events=[])

    def event(self, **kwargs):
        return dict(ticker='VNM', sourceReference='disclosure#page=1',
                    **dict(affectsOutstanding=True, effectiveDate='2026-10-15',
                           announcementDate='2026-09-15', status='CONFIRMED') | kwargs)

    def test_no_change(self):
        r = assess_share_count(self.anchor, '2026-10-30', self.review)
        self.assertEqual((r['status'], r['acceptance'], r['shares']), (CARRIED, CLOSED, '2089955445'))
        self.assertFalse(r['verifiedZeroMovement'])
        self.assertFalse(r['sourceAdmission'])

    def test_confirmed_change_blocks_even_if_announced_before_interval(self):
        self.review['events'] = [self.event()]
        self.assertEqual(assess_share_count(self.anchor, '2026-10-30', self.review)['reason'],
                         'CONFIRMED_EFFECTIVE_SHARE_COUNT_CHANGE')

    def test_future_effective_change_not_applied_at_announcement(self):
        self.review['events'] = [self.event(effectiveDate='2026-11-12', announcementDate='2026-10-28')]
        self.assertEqual(assess_share_count(self.anchor, '2026-10-30', self.review)['status'], CARRIED)

    def test_conflicting_evidence_blocks(self):
        self.review['events'] = [self.event(status='CONFLICTING')]
        r = assess_share_count(self.anchor, '2026-10-30', self.review)
        self.assertEqual(r['reason'], 'CONFLICTING_SHARE_COUNT_EVIDENCE')
        self.assertIsNone(r['shares'])

    def test_incomplete_external_coverage_is_explicit_bounded_carry(self):
        self.review.update(completeNegativeSearch=False, limitations=['Tab1 excludes other disclosure categories'])
        r = assess_share_count(self.anchor, '2026-10-30', self.review)
        self.assertEqual(r['status'], CARRIED)
        self.assertFalse(r['completeNegativeSearch'])
        self.assertEqual(r['limitations'], self.review['limitations'])
        self.review['limitations'] = []
        self.assertEqual(assess_share_count(self.anchor, '2026-10-30', self.review)['status'], 'NOT_QUALIFIED')

    def test_unreviewed_relevant_document_blocks(self):
        self.review['unreviewedRelevantDocuments'] = ['treasury-transaction.pdf']
        self.assertEqual(assess_share_count(self.anchor, '2026-10-30', self.review)['status'], 'NOT_QUALIFIED')

    def test_unknown_effective_date_never_inferred_from_announcement(self):
        self.review['events'] = [self.event(effectiveDate=None)]
        self.assertEqual(assess_share_count(self.anchor, '2026-10-30', self.review)['status'], 'NOT_QUALIFIED')

    def test_cash_distribution_separate_and_input_immutable(self):
        self.review['events'] = [self.event(affectsOutstanding=False, effectiveDate=None)]
        before = copy.deepcopy(self.review)
        self.assertEqual(assess_share_count(self.anchor, '2026-10-30', self.review)['shares'], '2089955445')
        self.assertEqual(before, self.review)

    def test_retained_source_bytes_unchanged(self):
        p = Path('docs/fundamental-data-engine/vnm-s4-share-carry-forward/2026-11-12/PRESERVATION.json')
        for item in json.loads(p.read_text())['files']:
            with self.subTest(path=item['path']):
                self.assertEqual(hashlib.sha256(Path(item['path']).read_bytes()).hexdigest(), item['beforeSha256'])

    def test_retained_vnm_review(self):
        p = Path('docs/fundamental-data-engine/vnm-s4-share-carry-forward/2026-11-12/REVIEW.json')
        j = json.loads(p.read_text())
        self.assertEqual(assess_share_count(j['anchor'], j['cutoff'], j['review']), j['decision'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
