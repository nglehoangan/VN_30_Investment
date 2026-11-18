# VNM governed production materialization

**MATERIALIZATION_COMPLETE — actual production execution, not rehearsal-only.**

The owner-approved superseding manifest `95d1b994e1b0d04b0bd3f2ddd583b98526ab6a75600517930f841dd95925b6fa` and request `0f3bfd8b815646829676b7ab79004335fc53fb937234665df354daa1f64dd7da` were verified against review commit `fc2415da3ff48c3a03671ee6e255cb7852923b51`. All source pins, exact approved executable, methodology, AI binding and real dataset lineage passed. Original authorization and historical approvals were preserved.

Production target: `/Users/nglehoangan/Documents/Working/VN_30_Investment/data/vn30.sqlite`.

Before SHA-256: `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`.

After SHA-256: `be719ed0fdd855e64daf3fba662a1860610271d3580303a8dae4e2287fee88bf`.

Six authorized additive migrations were applied in order, in one exclusive SQLite transaction, and appended to existing `_prisma_migrations` tracking. The four proposal SQL files were copied byte-for-byte into versioned migration directories; historical comments and original proposal files were preserved. Every resulting table/index/trigger and migration checksum was independently checked. No existing schema or migration row was rewritten.

Actual persistence: 69 qualified financial facts (68 native facts plus separately qualified reported debt), 35 current evidence rows in the accepted dataset, 65 retained historical facts bound in enrichment/lineage, one dataset, one enrichment, one current data acceptance and one current score. History is not misleadingly counted as 65 extra native admission rows. F1 market/share provenance remains raw-close-only and current-purpose.

The approved current methodology is registered in production. Exact trusted AI assessment/review registration is persisted in CURRENT_REGISTRATION.json with original authorization, executable/packet hashes and dataset reference. This is a scoped server-side registration receipt, not a public API, dashboard service activation or a broader permission. The governed reader re-verifies exact authority, review, dataset and source identity.

VNM score: **43/100, LOW, VALID — NON-ACTIONABLE**, economic cutoff **2026-10-30**, 23 rubrics, 83 topics. Original knownAt/evaluatedAt/calculatedAt are preserved. Production readback reauthorized the saved score; two retries after commit ran under SQLite query_only and created no duplicate or changed bytes. No forced score, HUMAN signature or new source approval was manufactured.

SQLite online backup and restore to a disposable database passed integrity, foreign-key, full-schema and every-table checks. The private backup remains at `data/deployment-backups/vnm-20261118-superseding/before.sqlite`. Production was never replaced or restored. All authorized changes committed atomically; errors before commit roll back. Recovery after a committed fault must be verified separately, never an automatic overwrite.

One initial production prewrite lock probe correctly stopped: opening/closing the main file for hashing after BEGIN EXCLUSIVE released POSIX locks. No DDL/data write occurred. The corrected runner hashes the baseline before locking, compares the complete logical snapshot through the locked connection against the verified backup, and opens no other descriptor to the main file while locked. A second writer was demonstrably blocked before DDL. Failed disposable assertion attempts and the prewrite probe are retained as history, not reported as production success.

Only three pre-existing tables gained authorized rows: six migration records, two VNM market-boundary records and one approved methodology. All prior rows in every table are preserved. All unrelated table fingerprints, portfolio/ledger/NAV/transactions and historical scorecards are unchanged. The analytical artifact catalog is unchanged: no publication envelope, dashboard publication or trading permission was created. Historical PIT remains NOT_QUALIFIED; VNM17 remains pending.

Validation: 236 scoped tests PASS with all 27 actual migration files; strict TypeScript PASS; changed-code lint 0 errors/0 warnings; actual production readback, schema, idempotency and protected-table checks PASS. Full-repository PASS is not claimed.

Reproduction: prepare.py is original-baseline-only and must not be rerun against the materialized target. execute.mjs execute also refuses the changed baseline. execute.mjs readback is query-only and validates the persisted score and idempotent retries. Do not use the old baseline to reset production. The final evidence commit is reported in the final response, avoiding a self-referential SHA in its own content.

**No remaining materialization blocker. STOP for CIO review. PUB-04 publication and trading remain unauthorized.**
