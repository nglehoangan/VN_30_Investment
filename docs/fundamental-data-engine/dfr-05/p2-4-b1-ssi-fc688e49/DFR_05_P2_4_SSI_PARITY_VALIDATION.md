# SSI predecessor parity
Baseline `fc688e49fd4a6ad06d0333967ce24c9f7e8adbc8`. Implementation: **uncommitted**. SSI only; RESEARCH_PROVISIONAL, productionAdmissible=false, scoringAuthorized=false. All 23 rubrics have null points/band/assessment; categoryScores/totalScore/ranking/valuation remain null. No external acquisition or production mutation.

PASS: exact P1 full metric/provider/rubric objects and sealed bytes preserve 789 metrics, 25 completed assessments and 113 deferred dispositions. ACB preserves all 92 metrics, 85 supported, 7 missing and 23 deferred; canonical core `5c1accb54b0373ba8beaf097d3fc4d9d8b758104054b259d1dfc3c69c599f09f`.

P2.3 full canonical dossier/inventory/projection/graph/gap/conflict cores match all four approved hashes. CTG 145/115/22/8; MBB 145/121/24/0; TCB 145/123/22/0; VCB 128/90/28/10 (total/supported/missing/conflict). All retain 23 deferred rubrics and zero new scores. See `parity-results.json` for per-issuer hashes.

Every predecessor manifest file and implementation pin and source pin is checked. Protected full-file fingerprints and exact data inventory pass. Approved M1–M8, masters, database and authority files are included; no baseline repair or resealing occurred. Two fresh SSI replay core hashes and identical source-pin-set hashes are in `determinism.json`.
