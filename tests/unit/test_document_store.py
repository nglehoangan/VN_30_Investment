"""Storage invariants using disposable files; no network or production writes."""
import json
from pathlib import Path
import tempfile
import unittest

from tools.maintenance.documents import cached_by_url, deduplicate, persist_pdf, standard_name
from scripts.lib.vietstock_source_policy import require_vietstock_url


class DocumentStoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.pdf = b'%PDF-1.7\nretained fixture'

    def store(self, ticker='VNM', **overrides):
        args = dict(document_type='FINANCIAL', period='2026Q3', scope='CONSOLIDATED',
                    receipt={'requestedUrl': 'https://static2.vietstock.vn/a.pdf', 'retrievedAt': 'original'})
        args.update(overrides)
        return persist_pdf(self.root, ticker, self.pdf, **args)

    def test_retry_deduplicates_bytes_and_receipt(self):
        first = self.store()
        second = self.store()
        self.assertEqual(first['path'], second['path'])
        catalog = json.loads((self.root/'VNM/document-catalog.json').read_text())
        self.assertEqual(len(catalog['observations']), 1)
        cached = cached_by_url(self.root, 'VNM', first['receipt']['requestedUrl'])
        self.assertFalse(cached['fetchPerformed'])
        self.assertEqual(cached['receipt']['retrievedAt'], 'original')

    def test_same_bytes_different_scope_preserves_observations(self):
        first = self.store()
        second = self.store(scope='STANDALONE')
        self.assertEqual(first['path'], second['path'])
        rows = json.loads((self.root/'VNM/document-catalog.json').read_text())['observations']
        self.assertEqual(len(rows), 2)
        self.assertEqual({r['metadata']['scope'] for r in rows}, {'STANDALONE', 'CONSOLIDATED'})

    def test_cross_ticker_isolation(self):
        self.assertNotEqual(self.store()['path'], self.store('FPT')['path'])

    def test_tampered_cache_is_not_reused(self):
        row = self.store()
        Path(row['path']).write_bytes(b'changed')
        self.assertIsNone(cached_by_url(self.root, 'VNM', row['receipt']['requestedUrl']))

    def test_batch_and_path_escape_rejected(self):
        for ticker in ('ALL', '*', 'VNM,FPT', '../VNM', ['VNM', 'FPT']):
            with self.subTest(ticker=ticker), self.assertRaises(ValueError):
                self.store(ticker)
        with self.assertRaises(ValueError):
            self.store(period='../2026')

    def test_non_pdf_rejected(self):
        self.pdf = b'<html>not a PDF</html>'
        with self.assertRaises(ValueError):
            self.store()

    def test_changed_content_creates_distinct_revision(self):
        first = self.store()
        self.pdf += b' revised'
        second = self.store()
        self.assertNotEqual(first['path'], second['path'])
        self.assertTrue(Path(first['path']).exists())

    def test_multiple_revisions_at_same_url_cannot_silently_select_one(self):
        first = self.store()
        self.pdf += b' changed revision'
        self.store()
        with self.assertRaisesRegex(ValueError, 'CONFLICTING_RETAINED_URL_REVISIONS'):
            cached_by_url(self.root, 'VNM', first['receipt']['requestedUrl'])

    def test_hardlink_cleanup_preserves_paths_and_is_idempotent(self):
        row = self.store()
        original = Path(row['path'])
        duplicate = original.parent/'legacy.pdf'
        duplicate.write_bytes(self.pdf)
        actions = deduplicate(self.root, 'VNM')
        self.assertEqual(len(actions), 1)
        self.assertEqual(original.stat().st_ino, duplicate.stat().st_ino)
        self.assertEqual(original.read_bytes(), self.pdf)
        self.assertEqual(deduplicate(self.root, 'VNM'), [])

    def test_proven_unused_alias_can_be_removed(self):
        row = self.store()
        original = Path(row['path'])
        duplicate = original.parent/'unused.pdf'
        duplicate.write_bytes(self.pdf)
        actions = deduplicate(self.root, 'VNM', keep_paths=[original])
        self.assertFalse(duplicate.exists())
        self.assertEqual(actions[0]['operation'], 'REMOVED_UNREFERENCED_DUPLICATE')

    def test_symlink_ticker_folder_rejected(self):
        outside = self.root/'outside'
        outside.mkdir()
        (self.root/'VNM').symlink_to(outside, target_is_directory=True)
        with self.assertRaises(ValueError):
            self.store()

    def test_name_includes_identity_and_content(self):
        self.assertEqual(standard_name('VNM', 'FINANCIAL', 'FY2025', 'UNKNOWN', 'a'*64),
                         'VNM__FINANCIAL__FY2025__UNKNOWN__aaaaaaaaaaaa.pdf')

    def test_receipt_hash_mismatch_rejected_before_write(self):
        with self.assertRaises(ValueError):
            self.store(receipt={'sha256': '0'*64})
        self.assertFalse((self.root/'VNM').exists())

    def test_catalog_cannot_read_another_ticker_file(self):
        row = self.store('FPT')
        folder = self.root/'VNM'
        folder.mkdir()
        (folder/'document-catalog.json').write_text(json.dumps({
            'contract': 'ticker-document-catalog-v1', 'ticker': 'VNM', 'observations': [row]}))
        self.assertIsNone(cached_by_url(self.root, 'VNM', row['receipt']['requestedUrl']))

    def test_source_host_spoofing_is_rejected(self):
        for url in ('https://static2.vietstock.vn.evil.example/a.pdf',
                    'https://evil.example/a.pdf',
                    'https://static2.vietstock.vn@evil.example/a.pdf',
                    'https://static2.vietstock.vn:444/a.pdf',
                    'http://static2.vietstock.vn/a.pdf'):
            with self.subTest(url=url), self.assertRaises(ValueError):
                require_vietstock_url(url)

    def test_catalog_cli_rejects_repeated_tickers_before_writes(self):
        import subprocess
        import sys
        root = Path(__file__).resolve().parents[2]
        result = subprocess.run([sys.executable, '-B', str(root/'tools/maintenance/catalog.py'),
                                 '--ticker', 'VNM', '--ticker', 'FPT'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertIn('EXACTLY_ONE_TICKER_REQUIRED', result.stderr)

    def test_catalog_build_preserves_original_receipt_and_replays(self):
        import tools.maintenance.catalog as catalog
        from unittest.mock import patch
        root = self.root/'manual-download'
        folder = root/'VNM'
        folder.mkdir(parents=True)
        (folder/'legacy.pdf').write_bytes(self.pdf)
        receipt = {'path': 'manual-download/VNM/legacy.pdf', 'url': 'original-url',
                   'retrievedAt': 'original-time', 'sha256': 'a'*64}
        (root/'manifest.json').write_text(json.dumps({'requests': [receipt]}))
        with patch.object(catalog, 'ROOT', self.root.resolve()):
            first = catalog.build(root, 'VNM')
            before = (folder/'document-catalog.json').read_bytes()
            self.assertEqual(catalog.build(root, 'VNM'), first)
        self.assertEqual(before, (folder/'document-catalog.json').read_bytes())
        row = json.loads(before)['observations'][0]
        self.assertEqual(row['receipt'], receipt)
        self.assertEqual(row['originalReceiptReference']['pointer'], '/requests/0')
        self.assertIn('CLAIM', row['hashStatus'])


if __name__ == '__main__':
    unittest.main()
