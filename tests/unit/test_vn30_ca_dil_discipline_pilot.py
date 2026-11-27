"""Replay the fixed FPT research-only discipline pilot and its authority boundary."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PILOT = ROOT / "docs/fundamental-data-engine/fpt-capital-allocation/ca-dil-discipline-pilot-v1.0"
COMMAND = ["node", "tools/scoring/run_fpt_ca_dil_discipline_pilot.mjs"]


class DisciplinePilotReplay(unittest.TestCase):
    def test_actual_replay(self):
        actual = subprocess.check_output(COMMAND + ["--ticker", "FPT"], cwd=ROOT)
        self.assertEqual(actual, (PILOT / "PILOT_RESULT.json").read_bytes())
        result = json.loads(actual)
        self.assertIsNone(result["periods"]["annual"]["currentIssue"])
        self.assertIsNone(result["effective"]["points"])
        self.assertEqual(result["cumulative"]["assessed"], {"count": 21, "weight": 97, "points": 45})
        self.assertFalse(any(result["permissions"].values()))

    def test_rejects_non_pilot_and_formal_requests(self):
        for arguments in (["--ticker", "ACB"], ["--ticker", "FPT", "--formal"],
                          ["--ticker", "FPT", "--ticker", "FPT"]):
            result = subprocess.run(COMMAND + arguments, cwd=ROOT, capture_output=True, check=False)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn(b"FPT_RESEARCH_ONLY", result.stderr)
