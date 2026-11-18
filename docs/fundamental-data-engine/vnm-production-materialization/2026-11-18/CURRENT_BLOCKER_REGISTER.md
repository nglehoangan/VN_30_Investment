# Current blocker register

## MANIFEST_MISSING_REQUIRED_F1_SCHEMA — BLOCKING PREWRITE

Production has not applied `prisma/migrations/202611120001_market_ingest/migration.sql`; all five `market_boundary_ingest_*` tables are absent. The approved deployment manifest does not include this prerequisite. The real F1 repository queries those tables. Applying exactly the approved SQL in memory reproduces `no such table: market_boundary_ingest_raw`.

The prior isolated fixture applies all retained migrations, explaining its success. Its schema prerequisite list was incomplete for production; no financial-source defect or source approval gap is established.

Owner contract: mandatory preflight failure means STOP before writing; only schema prerequisites in the exact approved manifest may execute. Do not silently extend the approved manifest.

Minimal action — Owner/CIO: approve `PROPOSED_DEPLOYMENT_MANIFEST.json` by exact contentHash `95d1b994e1b0d04b0bd3f2ddd583b98526ab6a75600517930f841dd95925b6fa`. It adds the unchanged market-ingest migration and binds the explicit production path. Request/economic identities and protected baseline remain unchanged. No publication permission is requested.

After approval: rerun preflight including executable/methodology/AI binding, dependency/source lineage, backup/restore and full deployment safety checks. These deferred checks are not claimed passed or additional established blockers.
