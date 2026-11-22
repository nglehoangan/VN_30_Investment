"""CLI workflow tests. The only scoring callbacks are synthetic."""
import contextlib
import io
import json
from pathlib import Path
import shutil
import sqlite3
import subprocess
import tempfile
import unittest
from argparse import Namespace
from unittest.mock import patch

from tools.scoring import vn30_score as cli

VERSION = 'vn30-20260803-reviewed-20261115'
CUTOFF = '2026-10-30'


class ScoringCLI(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.store = Path(directory.name) / 'store'
        self.database = Path(directory.name) / 'fixture.sqlite'
        with contextlib.closing(sqlite3.connect(self.database)) as db:
            db.executescript('''
                CREATE TABLE portfolio (id TEXT PRIMARY KEY);
                CREATE TABLE nav (amount INTEGER);
                INSERT INTO portfolio VALUES ('protected');
                INSERT INTO nav VALUES (123);
            ''')
        fixture = patch.object(cli, 'DB', self.database)
        fixture.start()
        self.addCleanup(fixture.stop)
        self.protected_before = self.database.read_bytes()

    def tearDown(self):
        self.assertEqual(self.database.read_bytes(), self.protected_before)
        self.assertEqual(sorted(p.name for p in self.database.parent.glob('fixture.sqlite*')),
                         ['fixture.sqlite'])

    def run_mode(self, mode, ticker='ACB'):
        return cli.execute(Namespace(mode=mode, ticker=ticker, universe_version=VERSION,
                                     cutoff=CUTOFF), self.store)

    def test_read_only_modes_and_missing_authority(self):
        registry = self.database.parent / 'routes.json'
        registry.write_text(json.dumps({'contract': 'vn30-current-scoring-routes-v1', 'routes': []}))
        with patch.object(cli, 'REGISTRY', registry), patch.object(cli, 'invoke_adapter') as adapter:
            report = self.run_mode('check')
            self.assertEqual(report['request']['sector'], 'BANK')
            self.assertIn('NO_EXACT_TICKER_SCORING_AUTHORITY', report['blockers'])
            self.assertIn('NO_REGISTERED_TICKER_MAPPING_ADAPTER', report['blockers'])
            self.assertEqual(self.run_mode('status')['status'], 'NOT_STARTED')
            self.assertEqual(self.run_mode('resume')['blockers'], ['NO_EXECUTION_TO_RESUME'])
            self.assertFalse(self.store.exists())
            outcome = self.run_mode('score')
            self.assertEqual(outcome['status'], 'BLOCKED')
            self.assertEqual(self.run_mode('status')['result']['blockers'], outcome['blockers'])
            self.assertEqual(self.run_mode('score')['blockers'], ['USE_EXPLICIT_RESUME'])
            self.assertEqual(self.run_mode('resume')['status'], 'BLOCKED')
            self.assertEqual(self.run_mode('status')['attempt'], 2)
            adapter.assert_not_called()

    def test_registered_preflight_uses_read_only_inventory_and_stops_before_worker(self):
        inv = {'available': True, 'current_financial_admission': [{'id': 'synthetic-admission'}],
               'current_financial_dataset': [{'id': 'synthetic-dataset'}]}
        _, _, job, _ = cli.scope(Namespace(ticker='ACB', universe_version=VERSION, cutoff=CUTOFF))
        with patch.object(cli, 'database_inventory', return_value=inv), patch.object(
                cli, 'invoke_adapter', return_value={'blockers': ['CURRENT_SCORE_M1_UNRESOLVED']}) as bridge:
            report = cli.check(job, {'adapter': {}, 'authorization': {}})
            self.assertIn('NO_EXACT_TICKER_SCORING_AUTHORITY', report['blockers'])
            bridge.assert_not_called()
            report = cli.check(job, {'adapter': {'path': 'synthetic'}, 'authorization': {'path': 'synthetic'}})
            self.assertEqual(report['blockers'], ['CURRENT_SCORE_M1_UNRESOLVED'])
            bridge.assert_called_once_with(job, 'preflight')
        self.assertFalse(self.store.exists())

    def test_database_placeholder_stops_without_opening_sqlite(self):
        with patch.object(cli, 'is_placeholder', return_value=True), patch.object(cli.sqlite3, 'connect') as connect:
            report = self.run_mode('check')
            self.assertIn('SCORING_DATABASE_BYTES_NOT_LOCAL', report['blockers'])
            self.assertNotIn('NO_ADMITTED_CURRENT_DATASET_AT_CUTOFF', report['blockers'])
            connect.assert_not_called()

    def test_duplicate_score_and_completed_resume(self):
        with patch.object(cli, 'check', return_value={'blockers': []}), patch.object(
                cli, 'invoke_adapter', return_value={'blockers': [], 'artifact': {'id': 'synthetic'}}) as engine:
            self.assertEqual(self.run_mode('score')['status'], 'COMPLETED')
            self.assertEqual(self.run_mode('score')['status'], 'COMPLETED')
            self.assertEqual(self.run_mode('resume')['status'], 'COMPLETED')
            engine.assert_called_once()
            self.assertEqual(self.run_mode('status')['attempt'], 1)
            self.assertEqual(self.run_mode('status', 'HPG')['status'], 'NOT_STARTED')

    def test_interruption_retries_same_operation_key(self):
        keys = []

        def score(job, action, *, lock_fd):
            self.assertIsInstance(lock_fd, int)
            self.assertEqual(action, 'score')
            keys.append(job['operationKey'])
            if len(keys) == 1:
                raise KeyboardInterrupt
            self.assertEqual(job['resume']['step'], 'PREREQUISITES')
            return {'blockers': [], 'artifact': {'id': 'synthetic'}}

        with patch.object(cli, 'check', return_value={'blockers': []}), patch.object(
                cli, 'invoke_adapter', side_effect=score):
            with self.assertRaises(KeyboardInterrupt):
                self.run_mode('score')
            self.assertEqual(self.run_mode('status')['status'], 'RUNNING')
            self.assertEqual(self.run_mode('score')['blockers'], ['USE_EXPLICIT_RESUME'])
            self.assertEqual(self.run_mode('resume')['status'], 'COMPLETED')
            self.assertEqual(keys, [keys[0], keys[0]])
            self.assertEqual(self.run_mode('status')['attempt'], 2)

    def test_invalid_or_uncovered_request(self):
        for ticker in ('ALL', '*', 'ACB,HPG', 'ACB HPG', 'ZZZ'):
            with self.subTest(ticker=ticker), self.assertRaises(ValueError):
                self.run_mode('check', ticker)
        for version, cutoff in (('unknown', CUTOFF), (VERSION, '2026-11-19')):
            with self.assertRaises(ValueError):
                cli.execute(Namespace(mode='check', ticker='ACB', universe_version=version,
                                      cutoff=cutoff), self.store)
        self.assertFalse(self.store.exists())

    def test_repeated_ticker_and_required_scope(self):
        with contextlib.redirect_stderr(io.StringIO()):
            for extras in ([], ['--universe-version', VERSION, '--cutoff', CUTOFF, '--ticker', 'ACB']):
                with self.assertRaises(SystemExit) as failure:
                    cli.main(['--ticker', 'ACB', '--mode', 'check', *extras])
                self.assertEqual(failure.exception.code, 2)

    def test_prepare_reports_missing_candidate_without_worker_or_writes(self):
        args = Namespace(mode='prepare', ticker='ACB', universe_version=VERSION,
                         cutoff=CUTOFF, candidate=None, previous_proposal=None)
        with patch.object(cli, 'pinned', side_effect=ValueError('SOURCE_PATH_ESCAPE_OR_MISSING')), \
                patch.object(cli, 'invoke_adapter') as worker:
            report = cli.execute(args, self.store)
        self.assertEqual(report['status'], 'BLOCKED')
        self.assertFalse(report['scoringAuthorized'])
        self.assertTrue({'universeProfile', 'securitySectorReference', 'assessment', 'executable'}
                        <= {blocker['role'] for blocker in report['blockers']})
        worker.assert_not_called()
        self.assertFalse(self.store.exists())

    def test_worker_prepare_rejects_cross_ticker_candidate(self):
        job = {'request': {'ticker': 'ACB', 'universe': {}}}
        process = subprocess.run(
            ['node', str(Path(cli.__file__).with_name('vn30_score_worker.mjs')), 'prepare'],
            input=json.dumps({'job': job, 'candidate': {'subject': {'ticker': 'VNM'}}}),
            capture_output=True, text=True, check=True,
        )
        self.assertEqual(json.loads(process.stdout), {'blockers': ['CANDIDATE_ROUTE_IDENTITY_MISMATCH']})

    def test_direct_worker_cannot_bypass_registration(self):
        _, _, job, _ = cli.scope(Namespace(ticker='ACB', universe_version=VERSION, cutoff=CUTOFF))
        worker = self.database.parent / 'tools' / 'scoring' / 'vn30_score_worker.mjs'
        worker.parent.mkdir(parents=True)
        shutil.copyfile(Path(cli.__file__).with_name(worker.name), worker)
        worker.with_name('vn30-score-routes.json').write_text(
            json.dumps({'contract': 'vn30-current-scoring-routes-v1', 'routes': []})
        )
        process = subprocess.run(['node', str(worker), 'preflight'],
                                 input=json.dumps(job), capture_output=True, text=True, check=True)
        self.assertEqual(json.loads(process.stdout), {'blockers': ['NO_EXACT_TICKER_SCORING_AUTHORITY']})


if __name__ == '__main__':
    unittest.main()
