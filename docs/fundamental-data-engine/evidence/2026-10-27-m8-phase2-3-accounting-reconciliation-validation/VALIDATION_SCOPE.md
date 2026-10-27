# Validation scope and exact baseline

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 2.3 validation/reporting only. No production implementation, posting, migration or Phase 3 authorization.

Validated source commit: **`3cc3e51ca7f6113365f1d85e039003111cd757f3`**. Owner's current task declares Architecture, Phase 1, Phase 2.1 and Phase 2.2 v1.0 approved. This authorizes validation only; it does not authenticate broker sources, approve operational identities or authorize production posting.

BASELINE_IDENTITY.json pins schema-source SHA256, exact actual SQLite file/schema digests, all migration-source hashes and all19 applied migration checksums. Actual database has **19 applied migrations**, all matching retained source. The two prepared27/10 migrations are **unapplied**. Repository Prisma schema describes these future tables; it is not the applied production schema. Nodev22.23.2, Prisma7.10.0, Vitest5.0.0.

Accounting implementation: `m63-mwac-decimal12-half-even-v1`; reconciliation: `m63-exact-reconciliation-v1`; new event: `dividend-receivable-settlement-v1`; intake: `forward-event-intake-v1`. Actual opening uses methodology record `m63-tcbs-opening-local-v1`, whose registry governanceStatus is **PROPOSED**, intendedUse PRODUCTION, effective08/10. The mathematical specification/implementation approval does not upgrade this registry record. No approval or registry mutation performed.

Scope: exact opening replay; synthetic integrated accounting and failure cases; source-referenced dated cash/securities/basis reconciliation; completeness and independent-review preparation. No broad source rediscovery, new provider calls, historical imports, code fixes, NAV implementation or milestone advancement. Only this new evidence directory is added; all pre-existing code/tests/schema/evidence/policies/data remain byte-identical. Validation helpers and tests are evidence artifacts, not production code.
