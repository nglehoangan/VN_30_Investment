from datetime import date
from pathlib import Path
import json
import sqlite3
import unittest

from tools.scoring.acb_future_evidence import digest, record

MIGRATION = Path("prisma/migrations/202611220001_acb_future_evidence/migration.sql")


class FutureEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.addCleanup(self.db.close)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript(MIGRATION.read_text())
        self.source = b"Synthetic evidence for tests"
        self.event = dict(reportId="fy-governance", status="CAPTURED", ticker="ACB", issuer="ACB",
                          reportingPeriod="FY2026", actualPublicationDate="2027-01-15",
                          sourceUrl="https://example.org/synthetic", sourceHash=digest(self.source))

    def capture(self, **updates):
        from unittest.mock import patch
        from datetime import datetime
        with patch("tools.scoring.acb_future_evidence.datetime") as clock, self.db:
            clock.now.return_value = datetime(2027, 2, 1)
            return record(self.db, {**self.event, **updates}, self.source)

    def test_closure_is_immutable_and_complete(self):
        body, sha = self.db.execute("SELECT body,body_hash FROM acb_research_closure").fetchone()
        self.assertEqual(digest(body.encode()), sha)
        closure = json.loads(body)
        rubrics = closure["rubrics"]
        self.assertEqual(len({r["rubric"] for r in rubrics}), 23)
        rated = [r for r in rubrics if r["points"] is not None]
        self.assertEqual((len(rated), sum(r["points"] for r in rated), sum(r["maximum"] for r in rated)), (14, 18, 58))
        self.assertEqual(sum(r["maximum"] for r in rubrics if r["points"] is None), 42)
        self.assertEqual((closure["passCount"], closure["researchStatus"], closure["scoreUpperBound"]), (1, "CLOSED", 60))
        self.assertIsNone(closure["fullOfficialScore"])
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("DELETE FROM acb_research_closure")

    def test_capture_persists_and_deduplicates(self):
        self.assertEqual(self.db.execute("SELECT count(*) FROM acb_future_evidence").fetchone()[0], 7)
        self.capture()
        self.capture()
        self.assertEqual(self.db.execute("SELECT count(*) FROM acb_future_evidence_event").fetchone()[0], 1)
        self.assertEqual(self.db.execute("SELECT bytes FROM acb_future_evidence_source").fetchone()[0], self.source)
        with self.assertRaisesRegex(ValueError, "Conflicting duplicate"):
            self.capture(sourceUrl="https://example.org/conflict")

    def test_issuer_hash_and_historical_cutoff_are_protected(self):
        with self.assertRaisesRegex(ValueError, "issuer"):
            self.capture(issuer="VNM")
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            self.capture(sourceHash="bad")
        self.capture()
        with self.assertRaisesRegex(ValueError, "eligible new cutoff"):
            self.capture(status="VALIDATED", reassessmentCutoff="2026-10-30", identityBasis="Issuer masthead",
                         fields={"transactionAmounts": {"value": "42", "locator": "Note 1"}})

    def test_only_affected_rubric_gets_reassessment(self):
        self.capture()
        validated = dict(status="VALIDATED", reassessmentCutoff="2027-01-31", identityBasis="Issuer masthead",
                         fields={"transactionAmounts": {"value": "42", "locator": "Note 1"}})
        candidate = self.capture(**validated)
        self.assertEqual(candidate, self.capture(**validated))
        stored, = self.db.execute("SELECT body FROM acb_reassessment_candidate WHERE id=?", (candidate,)).fetchone()
        self.assertEqual(json.loads(stored)["rubrics"], ["RG-RISK"])
        self.assertEqual(json.loads(stored)["priorConfirmedScore"], 18)
        self.db.execute("CREATE TABLE current_financial_admission(id,ticker,economic_cutoff,body,body_hash,security_id)")
        with self.assertRaisesRegex(ValueError, "governed BANK admission receipt"):
            self.capture(status="ADMITTED", admissionId="nonexistent")


if __name__ == "__main__":
    unittest.main()
