# PUB-04 VNM read-only publication

**PUBLICATION_COMPLETE.** Actual production publication and Next production HTTP readback passed.

Approved baseline: `d1c7eb5e3d1261c76ac9ade85d2ca8ed2f00f23a`. The quoted owner authorization `approval PUB-04` is retained in OWNER_REQUEST.txt and bound to the exact subject in PUB04_SERVER_REGISTRATION.json. No broader approval is inferred.

Publication ID: `VNM-current-remediation-unadopted`.

Publication envelope hash: `ce74558f300b61e33dc0ecf849ec5085dc2320ce7f1b875c1630c4afefc6a463`.

Original scorecard hash: `03c84b1511b51b7d70b89a1aa7ef2f86078ce568541065eae4be67b1f5b77c8f`, unchanged. Dataset, methodology and review hashes match the exact approved subject. Server registration: `PUB04_VNM_READ_ONLY_20261118`, contentHash `d29151753766451214581107d752b2d56cd74cd43fd64c66b573e6b01f2616cc`.

Production database: `/Users/nglehoangan/Documents/Working/VN_30_Investment/data/vn30.sqlite`.

Before SHA-256: `be719ed0fdd855e64daf3fba662a1860610271d3580303a8dae4e2287fee88bf`.

After SHA-256: `0876f70a76b8d89efe1d33559ff2d68b4f8b50bdccb2e510562fd4dc748d8e51`.

The approved CurrentScorePublications implementation is unchanged. One immutable `current-read-only-publication-v1` reference envelope was appended to the existing analytical catalog. Its SCORECARD catalog kind is decoded only through the explicit current-purpose contract; it is not a legacy FORMAL/PIT scorecard. Publish retries inside the transaction and after commit under SQLite query_only create no duplicates. No score() call, new score, financial admission, methodology change or assessment change occurred. Governed find() retains its required integrity/authority replay; that verification does not persist or change a score.

The dashboard loader imports a fixed server registration. Browser parameters cannot select authority, review or source. The dashboard receives only find/latest capabilities, not publish or trading. The source reader composes the existing F1/F2 admission consumers and exact prior current registration, and refuses a write if a required acceptance receipt is missing. Original timestamps and CURRENT_FORMAL_VALUATION semantics remain intact.

The actual optimized Next 16.3.4 build and next start HTTP route `/scoring/VNM-current-remediation-unadopted` show VNM, **43/100, LOW, VALID — NON-ACTIONABLE**, cutoff `2026-10-30T23:59:59.999Z`, knownAt and calculatedAt `2026-11-18T00:52:58.768Z`, and CURRENT-PURPOSE / READ ONLY / NOT HISTORICAL PIT / No trading authorization. The listing also contains VNM. Forged authority/score/PIT query parameters do not alter metadata. Details and response hashes are in PUB04_DASHBOARD_READBACK.json.

The same production build served a disposable production copy with a revoked authority. HTTP visibility correctly became BLOCKED with no score metrics. Additional isolated tests cover publication/data revocation, changed authority bytes, another subject, forbidden materialization permission and an unauthorized newer revision with no fallback. Live authority and live revocation records were never changed. Verification HTTP servers were shut down after checks; persisted publication and trusted application registration remain in place.

Backup used SQLite online backup and was restored/verified in a disposable database. The private backup is retained at `data/deployment-backups/vnm-pub04-20261118/before.sqlite`; no production restore or database replacement occurred. Publication ran atomically under an exclusive SQLite lock with complete logical-baseline comparison and a blocked second-writer probe.

Independent post-check: only analytical_artifact gained one row. Every prior row and all other table fingerprints, schema, source/financial facts, current score, dataset, assessments, methodology, historical scorecards, portfolio, ledger, NAV and transactions are unchanged. No other security was published. VNM17 remains untouched; historical PIT remains NOT_QUALIFIED.

Validation: 236 scoped tests PASS; strict scoped TypeScript PASS; lint 0 errors/0 warnings; full Next compile/typecheck/prerender/build PASS; actual production HTTP PASS. Full-repository test PASS is not claimed. A missing S4 ESM declaration was added without changing runtime.mjs bytes. Verification resolves one byte-checked locked Next installation to avoid duplicate framework async-context instances; no Next upgrade, source substitution, skipped typecheck or disabled integrity control was used. The initial HTTP harness was corrected to inspect final streamed main#main rather than the loading boundary. Attempt history is retained.

All nine required PUB-04 outputs are present. The final evidence commit is reported in the final response, avoiding a self-referential SHA. No unresolved PUB-04 blocker. **STOP for CIO review; no other ticker or milestone.**
