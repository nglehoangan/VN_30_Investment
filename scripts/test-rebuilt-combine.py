"""Exercise source priority and audit behavior on independent small fixtures."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('rebuilt_combine', Path(__file__).with_name('combine-vn30-rebuilt.py'))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class RebuiltCombineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.old_root = builder.ROOT
        builder.ROOT = Path(self.temp.name)
        self.addCleanup(setattr, builder, 'ROOT', self.old_root)

    def write(self, relative, value):
        path = builder.ROOT / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value))

    def row(self, key, label, value, status='VALUE'):
        return {'id': key, 'code': key, 'label': label, 'value': value, 'status': status,
                'order': 0, 'unit': 'CURRENCY', 'currency': 'VND', 'scale': '1',
                'sourcePage': 1, 'lexicalValue': value, 'rawLocator': '/fixture'}

    def build(self, mode_mismatch=False, direct_pdf=False):
        pdf_rows = [self.row('cash', 'Tiền', '0', 'ZERO'),
                    self.row('loan', 'Vay ngắn hạn', None, 'DASH'),
                    self.row('other', 'Tài sản khác', '35'),
                    self.row('conflict', 'Nợ dài hạn', '40')]
        api_rows = [self.row('cash', 'Tiền', '999'),
                    self.row('loan', 'Vay ngắn hạn', '12'),
                    self.row('shift', 'Nhãn khác', '35'),
                    self.row('zero', 'Chỉ tiêu chỉ có ở API', '0', 'ZERO'),
                    self.row('null', 'Chưa công bố', None, 'NULL')]
        variants = []
        for index, amount in enumerate(['40', '41']):
            copied = json.loads(json.dumps(pdf_rows))
            copied[-1]['value'] = amount
            if direct_pdf:
                for row in copied:
                    row['pdfEvidence'] = {'path': 'data/manual-download/VNM/source.pdf', 'page': 1, 'href': 'data/manual-download/VNM/source.pdf#page=1'}
            variants.append({'id': 'pdf' + str(index), 'periodKey': '2025',
                             'year': 2025, 'quarter': None, 'periodType': 'ANNUAL',
                             'reportingScope': 'CONSOLIDATED', 'source': {},
                             'groups': [{'id': 'page-1', 'sourcePage': 1, 'rows': copied}]})
        api_variant = {'id': 'api1', 'periodKey': '2025', 'year': 2025, 'quarter': None,
                       'periodType': 'ANNUAL', 'source': {'providerUnit': None},
                       'modeMismatch': mode_mismatch, 'groups': [{'id': 'TN', 'rows': api_rows}]}
        report = lambda vs: {'reports': {'can-doi-ke-toan': {'label': 'Cân đối', 'periods': {
            '2025': {'year': 2025, 'quarter': None, 'periodType': 'ANNUAL', 'variants': vs}}}}}
        self.write('docs/fundamental-data-engine/rebuild-2026-10-19/source-plan.json', {'tickers': ['VNM']})
        self.write('data/manual-extracted-pdf/VNM.json', report(variants))
        self.write('data/manual-extracted-api/VNM.json', report([api_variant]))
        self.write('data/manual-extracted-pdf/notes/VNM.json', {'documents': []})
        with contextlib.redirect_stdout(io.StringIO()):
            builder.main()
        result = json.loads((builder.ROOT / 'data/combine/VNM.json').read_text())
        review = json.loads((builder.ROOT / 'data/combine/review/VNM.json').read_text())
        return result['reports']['can-doi-ke-toan']['periods']['2025'], review

    def test_pdf_zero_wins_and_dash_falls_back_without_inventing_dimensions(self):
        period, review = self.build()
        self.assertTrue(any('PDF_CAFEF_VALUE_DIFFERENCE' in item['reasons'] for item in review['issues']))
        for variant in period['variants'][:2]:
            rows = {r['code']: r for r in variant['groups'][0]['rows']}
            self.assertEqual((rows['cash']['source'], rows['cash']['value']), ('PDF_REPORTED', '0'))
            self.assertIn('PDF_CAFEF_VALUE_DIFFERENCE', rows['cash']['reviewReasons'])
            self.assertEqual((rows['loan']['source'], rows['loan']['value']), ('CAFEF_REFERENCE', '12'))
            self.assertEqual(rows['loan']['pdfStatus'], 'DASH')
            self.assertEqual(rows['loan']['status'], 'VALUE')
            self.assertIsNone(rows['loan']['unit'])
            self.assertIsNone(rows['loan']['currency'])
            self.assertIsNone(rows['loan']['reportingScope'])

    def test_preserves_conflicting_pdf_variants_and_flags_conflict(self):
        period, _ = self.build()
        self.assertEqual(len(period['variants']), 3)
        self.assertEqual(period['conflicts'][0]['values'], ['40', '41'])

    def test_nonzero_fallback_duplicate_excluded_but_zero_and_null_preserved(self):
        period, review = self.build()
        self.assertEqual(len(review['excludedCafeFFallbacks']), 1)
        excluded = review['excludedCafeFFallbacks'][0]
        self.assertEqual(excluded['value'], '35')
        self.assertFalse(excluded['provenProviderError'])
        references = {r['code']: r for g in period['variants'][-1]['groups'] for r in g['rows']}
        self.assertNotIn('shift', references)
        self.assertEqual(references['zero']['value'], '0')
        self.assertIsNone(references['null']['value'])
        self.assertEqual(references['null']['status'], 'NULL')
        self.assertEqual(references['null']['source'], 'MISSING')

    def test_provider_mode_mismatch_stays_unresolved(self):
        period, _ = self.build(mode_mismatch=True)
        pdf = {r['code']: r for r in period['variants'][0]['groups'][0]['rows']}
        self.assertEqual(pdf['cash']['value'], '0')
        self.assertEqual(pdf['loan']['source'], 'MISSING')
        references = [r for g in period['variants'][-1]['groups'] for r in g['rows']]
        self.assertTrue(references)
        self.assertTrue(all(r['source'] == 'UNRESOLVED_MAPPING' and r['value'] is None for r in references))

    def test_direct_pdf_links_and_boxes_are_available_without_readers(self):
        period, _ = self.build(direct_pdf=True)
        row = period['variants'][0]['groups'][0]['rows'][0]
        self.assertEqual(row['pdfEvidence']['pdfPath'], 'data/manual-download/VNM/source.pdf')
        self.assertEqual(row['pdfEvidence']['href'], 'data/manual-download/VNM/source.pdf#page=1')
        self.assertEqual(row['value'], '0')


if __name__ == '__main__':
    unittest.main()
