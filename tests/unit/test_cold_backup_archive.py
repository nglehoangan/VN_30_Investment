"""Lossless backup compaction, failure safety and explicit recovery."""
from pathlib import Path
import tempfile
import unittest

from tools.maintenance.archive_backups import archive_cold_json, restore, verify


class ColdArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.name = 'backups/old/presentation-before/data/combine/VNM.json'
        self.path = self.root/self.name
        self.path.parent.mkdir(parents=True)
        self.original = b'{"decimal":"13618200000000.00","zero":0,"unknown":null}\n'
        self.path.write_bytes(self.original)
        self.archive = self.root/'backups/cold.zip'

    def test_lossless_roundtrip_preserves_exact_original_bytes(self):
        receipt = archive_cold_json(self.root, [self.name], self.archive)
        self.assertFalse(self.path.exists())
        verify(self.archive, receipt)
        self.assertEqual(restore(self.root, self.archive), 1)
        self.assertEqual(self.path.read_bytes(), self.original)

    def test_replay_is_idempotent_and_removes_no_unlisted_files(self):
        first = archive_cold_json(self.root, [self.name], self.archive)
        other = self.path.parent/'unlisted.json'
        other.write_bytes(b'keep')
        self.assertEqual(archive_cold_json(self.root, [], self.archive), first)
        self.assertEqual(other.read_bytes(), b'keep')

    def test_live_data_sqlite_and_path_escape_are_rejected(self):
        for name in ('data/combine/VNM.json', 'backups/old/vn30.sqlite',
                     'backups/old/presentation-before/../unsafe.json'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                archive_cold_json(self.root, [name], self.archive)
        self.assertTrue(self.path.exists())

    def test_restore_never_overwrites_changed_file(self):
        archive_cold_json(self.root, [self.name], self.archive)
        self.path.write_bytes(b'newer original')
        with self.assertRaisesRegex(ValueError, 'OVERWRITE'):
            restore(self.root, self.archive)
        self.assertEqual(self.path.read_bytes(), b'newer original')

    def test_tampered_archive_does_not_remove_original(self):
        archive_cold_json(self.root, [self.name], self.archive)
        self.path.write_bytes(self.original)
        self.archive.write_bytes(b'tampered')
        with self.assertRaisesRegex(ValueError, 'HASH_MISMATCH'):
            archive_cold_json(self.root, [self.name], self.archive)
        self.assertEqual(self.path.read_bytes(), self.original)

    def test_unknown_existing_archive_is_not_overwritten(self):
        self.archive.write_bytes(b'unknown archive')
        with self.assertRaisesRegex(ValueError, 'RECEIPT'):
            archive_cold_json(self.root, [self.name], self.archive)
        self.assertEqual(self.path.read_bytes(), self.original)

    def test_metadata_drift_does_not_replace_byte_verification(self):
        import os
        from unittest.mock import patch
        import tools.maintenance.archive_backups as module
        original_stream = module.stream_hash

        def changing_metadata(source, output=None):
            result = original_stream(source, output)
            if output is not None:
                os.utime(self.path, ns=(1_700_000_000_000_000_000, 1_700_000_000_000_000_000))
            return result

        with patch.object(module, 'stream_hash', side_effect=changing_metadata):
            receipt = archive_cold_json(self.root, [self.name], self.archive)
        self.assertNotEqual(receipt['files'][0]['mtimeNs'], receipt['files'][0]['afterReadMtimeNs'])
        restore(self.root, self.archive)
        self.assertEqual(self.path.read_bytes(), self.original)

    def test_same_size_content_change_during_copy_keeps_original(self):
        from unittest.mock import patch
        import tools.maintenance.archive_backups as module
        original_stream = module.stream_hash
        changed = b'x'*len(self.original)

        def changing_content(source, output=None):
            result = original_stream(source, output)
            if output is not None:
                self.path.write_bytes(changed)
            return result

        with patch.object(module, 'stream_hash', side_effect=changing_content):
            with self.assertRaisesRegex(ValueError, 'CHANGED_KEEP_BOTH'):
                archive_cold_json(self.root, [self.name], self.archive)
        self.assertEqual(self.path.read_bytes(), changed)
        self.assertTrue(self.archive.exists())

    def test_changed_source_keeps_both_versions(self):
        archive_cold_json(self.root, [self.name], self.archive)
        self.path.write_bytes(b'changed source')
        with self.assertRaisesRegex(ValueError, 'CHANGED_KEEP_BOTH'):
            archive_cold_json(self.root, [self.name], self.archive)
        self.assertTrue(self.archive.exists())
        self.assertEqual(self.path.read_bytes(), b'changed source')


if __name__ == '__main__':
    unittest.main()
