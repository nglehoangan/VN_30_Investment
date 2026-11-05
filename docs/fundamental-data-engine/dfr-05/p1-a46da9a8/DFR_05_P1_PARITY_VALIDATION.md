# P1 financial and research parity — PASS

| Issuer | Metric count | All metric objects / provider crosschecks | Completed | Deferred | All23 rubric objects |
|---|---:|---|---:|---:|---|
|FPT|145|Exact match|3|20|Exact match|
|VNM|175|Exact match|6|17|Exact match|
|BID|82|Exact match|4|19|Exact match|
|TCX|87|Exact match|4|19|Exact match|
|VIC|150|Exact match|4|19|Exact match|
|VHM|150|Exact match|4|19|Exact match|

Total: **789 metrics;25 completed provisional assessments;113 deferred;0 new assessments;0 complete issuer scorecards**. Full objects, not only displayed values, match DFR02/DFR04. Deferred classes, topic gaps, resolution paths, points null and bands null are unchanged. Original25 assessment objects are unchanged, including the four explicit legacy-schema rows.

Two fresh same-code pipeline executions produce identical core payload hash `f41c77e988fbde450aba5b5977e5a33fa94a01cb3d58ad76753d30dc831c9f73`. Source projection, metrics, provider crosschecks, graph and qualification replay are included. Only explicitly volatile authorization-record time and receipts are outside this core hash.

Actual tests: P1 27/27; DFR02 25/25; closure 31/31, all PASS. Tests cover exact M3 bands/topics, native dimensions, null/zero/missing, Decimal precision, source hashes/pointers, scope/period fixtures, graph locality, unknown provider units, HPG zero-cashflow fixture and six-sector distinctions.

10096 baseline/protected/source/data file fingerprints remain unchanged, including M1–M8, existing research/seals, database/sidecars and active scoring authority. input-pins.json binds source bytes; baseline-snapshot.json binds protected bytes.

## Retained exceptions
VIC legacy borrowings342485743 vs identified closing338501032 million VND (difference3984711 million), and VHM148994462 vs146322754 million (difference2671708 million), remain isolated graph exception nodes. Legacy aggregate dependencies do not enter the qualified FH-BS path. No DFR02 correction was made.
TCX printed common numerator differs by1VND; original CONFLICT node/value null is preserved. Unreviewed extraction references do not revoke the separately verified VHM NCI/capital overlay.

See parity-results.json, determinism-results.json, qualification-replay.json and validation-results.json for exact hashes and process receipts.
