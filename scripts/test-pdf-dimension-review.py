"""Boundary checks for evidence extraction; no assumptions about OCR correctness."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('review', Path(__file__).with_name('review-retained-pdf-dimensions.py'))
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


class DimensionReviewTests(unittest.TestCase):
    def test_scope_is_statement_specific(self):
        self.assertEqual(review.scope('BÁO CÁO TÀI CHÍNH HỢP NHẤT'), 'CONSOLIDATED')
        self.assertEqual(review.scope('BÁO CÁO TÀI CHÍNH RIÊNG'), 'SEPARATE_STANDALONE')

    def test_mixed_cover_is_ambiguous(self):
        self.assertEqual(review.scope('BÁO CÁO TÀI CHÍNH RIÊNG\nBÁO CÁO TÀI CHÍNH HỢP NHẤT'), 'AMBIGUOUS')

    def test_never_guess_missing_units(self):
        self.assertEqual(review.unit('Tổng tài sản 1000000')['status'], 'UNKNOWN')

    def test_scales_are_not_interchangeable(self):
        for text, expected in [('Đơn vị tính: VND', '1'), ('Đơn vị: nghìn đồng', '1000'),
                               ('Đơn vị tính: triệu đồng', '1000000')]:
            self.assertEqual(review.unit(text)['scale'], expected)

    def test_conflicting_declarations_stay_ambiguous(self):
        self.assertEqual(review.unit('Đơn vị: triệu đồng\n\nĐơn vị: nghìn đồng')['status'], 'AMBIGUOUS')

    def test_column_unit_without_don_vi_label(self):
        self.assertEqual(review.unit('30/06/2026\nTriệu VND\n31/12/2025\nTriệu VND')['scale'], '1000000')

    def test_reporting_entity_narrative_is_not_unit_declaration(self):
        self.assertEqual(review.unit('ĐƠN VỊ BÁO CÁO\nVốn điều lệ 1000000 VND')['status'], 'UNKNOWN')

    def test_signature_date_is_not_publication(self):
        self.assertEqual(review.publication('Ký ngày 21/08/2026. Báo cáo cho kỳ 30/06/2026'), [])

    def test_publication_declaration_is_only_a_candidate(self):
        values = review.publication('Thông tin này đã được công bố trên website ngày 21/08/2026')
        self.assertEqual(values[0]['dates'], ['2026-08-21'])
        self.assertEqual(values[0]['kind'], 'ISSUER_PUBLICATION_DECLARATION_CANDIDATE')

    def test_invalid_date_is_not_repaired(self):
        self.assertEqual(review.publication('Information was published on 31/02/2026')[0]['dates'], [])


if __name__ == '__main__':
    unittest.main()
