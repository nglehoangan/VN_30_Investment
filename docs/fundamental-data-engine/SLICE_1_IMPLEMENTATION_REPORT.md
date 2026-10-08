# Slice 01 implementation review — 2026-10-08

Status: implementation prepared for owner review; **acceptance remains pending exact registry/crosswalk approval**. This report does not approve a taxonomy or promote any DI gate.

## Delivered scope

Pure foundational contracts/validation, an immutable versioned registry release, a narrow append/read port and Prisma repository, and four additive tables. Existing Security, Sector, MetricId, exact-decimal, time, error and methodology ownership are reused. Existing scoring Evidence, formulas and portfolio logic are unchanged.

Observation bodies retain fiscal periods and FLOW/STOCK identity; separate/consolidated scope; report signing versus timestamp/date-only/unknown publication; provider/local receipt and ingestion; raw lexical values, unit/scale/currency; exact normalized decimal TEXT or null; mapping provenance; quality/applicability; and immutable original/restatement/provider/mapping correction lineage. No normalization calculation is implemented. Recognized declared unit/scale metadata is checked for normalized values; invalid raw inputs may remain without a normalized value. Currency relabeling/FX is rejected. Formal scope fallback is blocked because no approved route evaluator exists in this slice; synthetic fixtures can represent its metadata and quality limitation.

All derived availability remains null/UNKNOWN. There is no fetching, PIT selector, availability evaluator, derived engine, snapshot builder, readiness/DI integration or UI. July 10/25 leakage and content/run identity tests remain Slice 5 requirements, not claims from these tests.

## Registry review gate

`src/infrastructure/fundamentals/canonical-items-v1.json` is **PROPOSED**, version/crosswalk `1.0.0`, methodology identity `fundamentals-items-v1`.

Exact proposed release SHA-256:

`80804db9834eef4ce6f3e56b844e2a1bcccd6ce5cfae801c8c7e50cd1210970e`

Eight limited proposed items: REVENUE, EBIT, NET_INCOME, NET_INCOME_ATTRIBUTABLE_COMMON, TOTAL_ASSETS, COMMON_EQUITY, CFO and CAPEX. Entries include authority and existing rubric-topic mappings. Only CFO/CAPEX map directly to the existing FCF operands; other earnings/equity items do not invent average-balance or adjusted operands. Unresolved sector formulas remain absent.

Formal writes and reads require an APPROVED release, exact hash/crosswalk/methodology/approval binding and a matching approved production MethodologyRecord with `configurationReference = registry-sha256:<hash>`. Code checks metadata consistency; it does not authenticate an external approval. No approval is seeded. Approval changes release content/hash, so the final approved release must also be externally reviewed and bound exactly.

## Exact files changed

- `prisma/schema.prisma`
- `prisma/migrations/202610080002_fundamental_foundation/migration.sql`
- `src/domain/fundamentals/contracts.ts`
- `src/domain/fundamentals/validation.ts`
- `src/ports/fundamentals.ts`
- `src/infrastructure/fundamentals/canonical-items-v1.json`
- `src/infrastructure/fundamentals/canonical-registry.ts`
- `src/infrastructure/repositories/fundamentals.ts`
- `tests/fixtures/database.ts`
- `tests/fixtures/fundamentals.ts`
- `tests/unit/fundamentals-contracts.test.ts`
- `tests/integration/fundamentals-repository.test.ts`
- `tests/integration/fundamentals-migration.test.ts`
- `tests/integration/registry.test.ts` (current additive table inventory assertion; also restores the existing broker table to that stale inventory)
- `docs/fundamental-data-engine/SLICE_1_IMPLEMENTATION_REPORT.md`

## Migration review and recovery

SQL/schema were reviewed before isolated application: four new source-version/import-batch/raw-capture/observation tables, indexes, restrictive foreign keys, exact TEXT decimals, body/payload hashes, and UPDATE/DELETE/REPLACE guards. No existing table alteration, backfill, approval seed or destructive statement is included. Reprocessing uniqueness is per capture/item/registry/scope/period/field/mapping, preserving distinct receipts and conflicting/revised facts. Batch/capture insertion is atomic. Reads validate immutable bodies against hashes and indexed metadata.

Tests use owned private temporary databases with explicit absolute URLs and `--no-env-file`. A populated latest baseline upgrade compares every existing table's rows and schema/index/trigger definitions, verifies deterministic portfolio replay and foreign keys, repeats deployment and checks new storage. Fixtures populate portfolio/ledger, methodology, analytical artifact and broker evidence; other baseline tables are compared even when empty. Fresh/reopen/immutability tests cover all four tables.

No production migration was executed. Any future deployment still needs a verified private pre-upgrade backup and recovery manifest; prefer forward repair. Restore only after stopping writers and preserving/reconciling authoritative events created since backup. No down migration/reset was added.

## Verification

Node 22.23.2 and existing locked dependencies were used. Prisma validation/generation used the database wrapper's `--no-env-file` with an explicit disposable URL. Commands below bypass default wrappers that load personal environment files.

- Prisma schema validate and client generate: passed.
- Focused contracts/repository/migration suite: **3 files, 17 tests passed**, including null/zero/exact decimals, publication distinctions, registry/semantic rejection, all correction kinds, conflicts, FK and mutation guards, tamper checks and populated migration preservation.
- `node scripts/check-boundaries.mjs`: passed, 113 source modules.
- `pnpm exec eslint . --max-warnings=0`: passed; changed-file lint repeated after final validator changes.
- `next typegen` then `tsc --noEmit`: passed in an owned source copy without personal env/data. This avoids stale original `.next` route declarations and preserves the running developer output.
- Full unit/integration/architecture regression suite: 47 files / 787 tests; 786 passed, one stale registry table inventory assertion failed. Updated its expectation for the already-existing broker table and four new tables; rerun of that complete registry file passed all 10 tests. All remaining 46 files passed, including portfolio/scoring regressions. Final foundation rerun passed all 17 tests after validator and SQL guard hardening.
- `git diff --check`: passed.

No production/private database or personal env file was accessed for checks; no financial API/provider fetch, live scoring/ranking/Top 10/decision, commit or push was performed. Synthetic regression calculations are test fixtures only. No DI1–DI15 status changes. Slice 2 has not started.
