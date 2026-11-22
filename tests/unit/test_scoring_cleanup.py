import json
from contextlib import closing
from pathlib import Path
import sqlite3
import subprocess
import tempfile
import unittest

from tools.maintenance.common import canonical_json, digest_json, sha256_file
from tools.maintenance.scoring_cleanup import apply, plan, restore


class ScoringCleanupTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name).resolve() / "repo"
        self.root.mkdir()
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        self.scope = self.root / "ACB-reports"
        self.scope.mkdir()
        self.scratch = self.scope / "assessment-draft.json"
        self.scratch.write_text('{"scratch":true}')
        self.approval = self.scope / "owner-approval-draft.json"
        self.approval.write_text("unique owner decision")
        self.db = self.root / "fixture.sqlite"
        self.request = dict(ticker="ACB", scope="ACB-reports", allowlist={
            p.relative_to(self.root).as_posix(): sha256_file(p) for p in (self.scratch, self.approval)
        })
        self.archive = self.root.parent / "archive"
        card = dict(id="acb-fixture", ticker="ACB", asOf="2026-10-30T23:59:59Z")
        auth = dict(reference={"bindingId": "bank-binding"}, dataAcceptanceId="acceptance")
        bundle = dict(card=card, authorization=auth)
        publication = dict(contract="current-read-only-publication-v1", scorecardId=card["id"],
                           scorecardHash=digest_json(card), authorityHash="authority-hash", authorityReference="authority")
        self.receipt = self.scope / "website-readback.json"
        self.receipt.write_text(json.dumps(dict(ticker="ACB", status="PASS", scorecardId=card["id"],
                                                cutoff="2026-10-30", publicationHash=digest_json(publication),
                                                http=dict(status=200, url="https://example.test/scoring/acb-fixture",
                                                          htmlSha256="a" * 64))))
        self.readback = dict(path="ACB-reports/website-readback.json", sha256=sha256_file(self.receipt))
        with closing(sqlite3.connect(self.db)) as conn, conn:
            conn.executescript("""
                CREATE TABLE analytical_artifact(id,kind,body,body_hash);
                CREATE TABLE current_score_artifact(id,body,body_hash);
                CREATE TABLE source_admission_event(target_id);
            """)
            conn.execute("INSERT INTO analytical_artifact VALUES (?,?,?,?)",
                         (card["id"], "SCORECARD", canonical_json(publication), digest_json(publication)))
            conn.execute("INSERT INTO current_score_artifact VALUES (?,?,?)",
                         (card["id"], canonical_json(bundle), digest_json(bundle)))

    def test_no_cleanup_before_verified_readback_and_single_ticker(self):
        with self.assertRaises(ValueError):
            plan(self.root, "ACB,VNM", self.request, self.db)
        with self.assertRaises(ValueError):
            plan(self.root, "VNM", self.request, self.db)
        report = plan(self.root, "ACB", self.request, self.db)
        self.assertEqual(report["blocker"], "VERIFIED_WEBSITE_READBACK_REQUIRED")
        self.assertEqual(report["eligible"], [])
        self.assertEqual(len(report["pendingReadback"]), 1)
        with self.assertRaises(ValueError):
            apply(self.root, self.archive, report, digest_json(report))
        self.assertTrue(self.scratch.is_file())

    def test_referenced_drafts_immutable_results_and_real_rollback(self):
        self.request["websiteReadback"] = self.readback
        reference = self.scope / "lineage.md"
        reference.write_text(f"Source sha {sha256_file(self.scratch)}")
        report = plan(self.root, "ACB", self.request, self.db)
        self.assertEqual(report["eligible"], [])
        reference.unlink()
        before = self.db.read_bytes()
        report = plan(self.root, "ACB", self.request, self.db)
        self.assertEqual(len(report["eligible"]), 1)
        self.assertNotIn("owner-approval-draft.json", [Path(r["path"]).name for r in report["eligible"]])
        self.assertTrue(self.scratch.is_file())
        with self.assertRaises(ValueError):
            apply(self.root, self.archive, report, "bad")
        apply(self.root, self.archive, report, digest_json(report))
        self.assertFalse(self.scratch.exists())
        self.assertEqual(self.db.read_bytes(), before)
        self.assertTrue(self.approval.is_file())
        restore(self.root, self.archive, report)
        restore(self.root, self.archive, report)
        self.assertEqual(sha256_file(self.scratch), report["eligible"][0]["sha256"])
        apply(self.root, self.archive, report, digest_json(report))
        restore(self.root, self.archive, report)
        self.assertTrue(self.scratch.is_file())

    def test_revocation_blocks_even_with_receipt(self):
        self.request["websiteReadback"] = self.readback
        with closing(sqlite3.connect(self.db)) as conn, conn:
            conn.execute("INSERT INTO source_admission_event VALUES ('bank-binding')")
        report = plan(self.root, "ACB", self.request, self.db)
        self.assertEqual(report["blocker"], "PUBLICATION_OR_LINEAGE_REVOKED")
        self.assertFalse(report["eligible"])
