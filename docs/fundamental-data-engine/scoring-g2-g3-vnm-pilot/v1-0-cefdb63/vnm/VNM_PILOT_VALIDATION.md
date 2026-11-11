# VNM pilot validation

Run `python3 scripts/build-vnm-scorecard-pilot.py` then `python3 scripts/validate-vnm-scorecard-pilot.py` from the repository root. The builder reads retained VNM JSON/notes and prior research; it does not download sources, write the database, compute formal scores or invoke M4.

Current source/scorecard checks: 233/233 PASS (validation-results.json). Exact source SHA-256 and JSON pointers resolve; selected financial records match the immutable DFR02 layer; all six prior assessment objects are equal; 23 unique M3 rows and mandatory topics are retained; no human adoption is invented; all formal points/bands/total/ranking/M4Decision are null; all three valuation research bands remain null. Current note text is context unless separately reviewed in prior qualified evidence; no new source-image review is claimed.

Counts: 6 retained challenged research assessments, 0 new full-topic assessments, 17 additional research NOT_RATED, 0 formal eligible, 23 formal blocked. This is a first substantive issuer scorecard dossier, not a complete /100 score. A new revenue CAGR replay supplies an exact arithmetic diagnostic; it cannot complete historical growth quality by itself.

The configured SQLite byte hash stays `47d1dd391afb895e70d942f96f148e16d9982646998f9c59ca2cb65`. Read-only counts remain analytical_artifact=0 and scoring_dataset_binding=0. The protected snapshot changes only the two authorized pre-existing scoring-engine files; new helper/tests/scripts/output files are separately listed by Git and the final manifest.

Engine execution results and any timeouts/failures are reported separately in ../engineering/REGRESSION_RESULTS.md. Source validation does not claim a full-repository test or production-release PASS.
