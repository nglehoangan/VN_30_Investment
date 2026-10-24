"""PEC-1D decision-gate diagnostics. No real provider, network or production writes."""
import argparse
import importlib.util
import json
import sqlite3
import unittest
from pathlib import Path
from lib.pec1c_capture import production_capture
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('pec1c_isolated_fixtures',ROOT/'scripts/test-pec1c-capture.py')
fixtures=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixtures)

class DecisionBoundaryTests(unittest.TestCase):
 def setUp(self):
  self.fixture=fixtures.CaptureTests('test_01_valid_authenticated_actor_fixture_only');self.fixture.setUp()
 def tearDown(self):self.fixture.tearDown()
 def test_default_boundary_never_accepts_broker_or_unverified_credentials(self):
  for credential in ['', 'SYNTHETIC-BROKER-JWT', 'SYNTHETIC-INVALID-SIGNATURE', 'SYNTHETIC-OWNER-CLAIM']:
   with self.subTest(credential=credential),self.assertRaisesRegex(ValueError,'NOT_CONFIGURED'):
    production_capture(self.fixture.db).capture(credential,self.fixture.request())
  self.assertEqual(self.fixture.count('formal_knowledge_audit'),0);self.assertEqual(self.fixture.executor.calls,0)
 def test_no_provider_means_no_formal_boundary_or_replay(self):
  service=production_capture(self.fixture.db)
  with self.assertRaisesRegex(ValueError,'NOT_CONFIGURED'):service.replay()
  with self.assertRaisesRegex(ValueError,'NOT_CONFIGURED'):
   service.formal_boundary('SYNTHETIC','ingestedAt',subject_id='SYNTHETIC',subject_version='SYNTHETIC',scope_hash='0'*64,source_hash='0'*64)
 def test_restore_of_valid_prefix_exposes_external_anchor_dependency(self):
  # This EXPECTED LIMITATION is not a successful rollback-attack prevention test.
  f=self.fixture;first=f.run_capture();backup=f.db.parent/'synthetic-prefix.sqlite'
  with sqlite3.connect(f.db) as source,sqlite3.connect(backup) as target:source.backup(target)
  second=f.run_capture(f.request('SYNTHETIC-VERIFY','SOURCE_VERIFIED',first['event']['eventHash']))
  self.assertEqual(len(f.capture.replay()),2)
  f.db.write_bytes(backup.read_bytes())
  replay=f.capture.replay();self.assertEqual(len(replay),1);self.assertNotEqual(replay[-1]['event']['eventHash'],second['event']['eventHash'])
  # Provider fixture authentication + valid SQLite hashes/triggers ALONE do not detect truncation.
  # The actual public factory still denies qualification; operational deployment is blocked.
  with self.assertRaisesRegex(ValueError,'NOT_CONFIGURED'):production_capture(f.db).replay()

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--json',type=Path);args=parser.parse_args()
 result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(DecisionBoundaryTests))
 if args.json:args.json.write_text(json.dumps({'testsRun':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'success':result.wasSuccessful(),'classification':'ISOLATED_DECISION_GATE_DIAGNOSTICS_NOT_REAL_PROVIDER_INTEGRATION','restoreAttackPrevention':'BLOCKED_EXTERNAL_ANCHOR_REQUIRED; valid-prefix rollback limitation reproduced, not fixed or claimed prevented','realProviderIntegration':'NOT_RUN_NO_APPROVED_CONFIGURED_PROVIDER','invalidSignatureIssuerAudienceValidation':'NOT_RUN_NO_PROVIDER_ADAPTER_OR_APPROVED_ISSUER','failureDetails':[{'test':t.id(),'traceback':trace} for t,trace in result.failures+result.errors]},indent=2)+'\n')
 raise SystemExit(0 if result.wasSuccessful() else 1)
