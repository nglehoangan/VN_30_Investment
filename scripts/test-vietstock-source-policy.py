import unittest
from unittest.mock import patch
import subprocess
from lib.vietstock_source_policy import require_vietstock_url, download_vietstock

class PolicyTest(unittest.TestCase):
    def test_reject_other_sources(self):
        for url in ['https://vinhomes.vn/r.pdf', 'https://staticfile.hsx.vn/r.pdf', 'https://static2.vietstock.vn.evil.example/r.pdf', 'https://user@static2.vietstock.vn/r.pdf', 'http://static2.vietstock.vn/r.pdf', 'https://static2.vietstock.vn:8443/r.pdf']:
            with self.subTest(url=url), self.assertRaises(ValueError):
                require_vietstock_url(url)
    @patch('lib.vietstock_source_policy.subprocess.run')
    def test_block_external_redirect_before_request(self, run):
        run.return_value = subprocess.CompletedProcess([], 0, '302\nhttps://vinhomes.vn/r.pdf', '')
        with self.assertRaisesRegex(ValueError, 'VIETSTOCK_ONLY_SOURCE_POLICY'):
            download_vietstock('https://static2.vietstock.vn/r.pdf', '/tmp/unused')
        self.assertEqual(run.call_count, 1)
        self.assertNotIn('--location', run.call_args.args[0])
    @patch('lib.vietstock_source_policy.subprocess.run')
    def test_allow_provider_redirect(self, run):
        run.side_effect = [subprocess.CompletedProcess([], 0, '302\nhttps://static2.vietstock.vn/r.pdf', ''), subprocess.CompletedProcess([], 0, '200\n', '')]
        self.assertEqual(download_vietstock('https://finance.vietstock.vn/r.pdf', '/tmp/unused').stdout, '200')
        self.assertEqual(run.call_count, 2)

if __name__ == '__main__':
    unittest.main()
