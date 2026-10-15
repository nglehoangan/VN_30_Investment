# Slice 08B corrected selected-path governance commit binding

Current immutable evidence package: `e18ea73d7066542ebf3db2be8e8f1a8017e45d63`. The review commit is the commit updating this binding; resolve with `git log -1 --format=%H -- docs/fundamental-data-engine/SLICE_08B_GOVERNANCE_CLOSURE_COMMIT_BINDING.md`.

Numeric execution source: `8d347a9dae3cf58fd61a63b566cec1ed3c31a793`; corrected boundary audit source: `1e3da46`, SHA-256 `33c4df409ccd8a0d3ba882d137b3c1ff3c6f4fc572c080ba53dba8fc72acacee`; independent replay source: `f4937dd1cfbf391683ed5079cec50ff3ec6974df`; report generator: `66c38579c0cc9489f2948956c09bc840cc32a2a5`.

Snapshot: `slice08b-governance-closure-57a002e0c88d030c7157fc36`; hash `515852d8437f3084abdd4aa63bc44ce34170900752795beb36bf49280a2f3f47`. Snapshot and financial facts remain unchanged by the selected-path correction.

Artifact manifest SHA-256: `8691c560c9b84ecfd071552ec91e9f43f73f1796463420ebe37363192a5b1d82`; closure summary SHA-256: `74706ef8dfc8b1ad190189341556a002a51860d042664b0e938c80f93e1955eb`; review report SHA-256: `da6272d63795bd804a4fcd838e65fb1285c92dec1ca30c024b9d7dc16acd19f7`. The package contains 89 artifacts; 88 individually hashed members and the manifest self-hash bound here.

Prior 83-artifact package `30e5df36239e0e974b4ab22a550ea84d32e0bcf5` and prior review `8fbf2a4a8573926479a74366b6f60a9ad2198063` remain preserved. The old PIT count of 23 wrongly included five unselected UNKNOWN candidates on already-satisfied required paths. Correct result: 18 UNKNOWN observations on 14 unsatisfied required paths; those five candidates do not block DI11. The counterexample test passes; no selection, source value, publication time, mapping, formula or approved document was changed.

Independent replay PASS. Engine ready 0/30, scoring ready 0/30, mandatory PDFs missing 0, true frozen mapping-contract gaps 2. Full regression remains **INCOMPLETE_WITH_FAILURES**; five boundary tests, 39 CFO controls, lint/typecheck/boundaries/schema and data replay PASS. Captured raw log EOF blank lines are preserved; whitespace verification disables only blank-at-eof.

Stop for Project Owner governance approval and independent ChatGPT DI14 review. DI15 remains pending. No formal admission or real scoring/ranking/Top10/decisions/DCA/portfolio-account writes.
