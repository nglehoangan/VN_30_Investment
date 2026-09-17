# Codex implementation prompt — M6.3 Slice 1: Transaction Ledger

Status: prepared 2026-09-16, not executed. Use the following scope for one implementation turn, then stop for review.

## Objective

Implement a trustworthy immutable ledger foundation over the approved M6.2 SQLite/Prisma architecture. Deliver exact domain values, minimal identities/reference persistence, Transaction + TransactionLeg, structural/domain validation, append-only persistence, atomic idempotency/version checks and deterministic history reads. Demonstrate real persistence through CASH_DEPOSIT only. Do not implement Slice 2 or declare the portfolio engine complete.

## Sources to read first

Repository root `AGENTS.md`; before any application code, relevant bundled Next guides in `node_modules/next/dist/docs/` (especially server/client boundaries if changing composition).

Approved sources (actual paths; do not use the duplicate copy tree):

- `docs/02 DATABASE/DATA_MODEL.md`
- `docs/02 DATABASE/PORTFOLIO.md`
- `docs/02 DATABASE/TRANSACTIONS.md`
- `docs/02 DATABASE/VN30_MASTER.md`
- `docs/02 DATABASE/SECTOR_MASTER.md`
- `docs/02 DATABASE/BENCHMARK.md`
- `docs/02 DATABASE/DATA_RULES.md`
- `docs/06_DASHBOARD/6.1 Requirements & Architecture/REQUIREMENTS.md`
- `docs/06_DASHBOARD/6.1 Requirements & Architecture/ARCHITECTURE_v1.0.md`
- `docs/06_DASHBOARD/6.1 Requirements & Architecture/DOMAIN_MODEL_v1.0.md`
- `docs/06_DASHBOARD/6.1 Requirements & Architecture/DATA_FLOW_v1.0.md`
- `docs/06_DASHBOARD/6.1 Requirements & Architecture/SECURITY_v1.0.md`
- `docs/06_DASHBOARD/6.1 Requirements & Architecture/TEST_STRATEGY_v1.0.md`
- `docs/06_DASHBOARD/6.1 Requirements & Architecture/IMPLEMENTATION_PLAN_v1.0.md`
- `docs/06_DASHBOARD/6.1 Requirements & Architecture/VALIDATION_CASES_v1.0.md`
- `docs/adr/0001-module-boundaries.md`, `0002-validation-errors-config-logging.md`, `0003-sqlite-prisma-persistence.md`
- `docs/06_DASHBOARD/6.2 Project Foundation/M6_2_FINAL_REVIEW.md`
- This directory's `PRE_IMPLEMENTATION_AUDIT.md` and `IMPLEMENTATION_SLICE_PLAN.md`.

M1–M6.2 are approved per user confirmation. Report any actual conflict with source, severity and proposed resolution; do not silently redesign or reopen stale document approval headers.

## Before edits

Inspect `git status`, current schema/migration, domain/ports/application, error/validation primitives, DB adapter/repository, tests and boundary checker. Preserve existing user changes. List exact files to change, invariants and independent test expectations. Select Node 22.23.2 and pnpm 10.34.5 without replacing system Node. If unavailable, report the concrete gate failure; never claim unsupported-runtime checks PASS.

## Allowed changes

New files within these narrow directories:

- `src/domain/ledger/`, `src/domain/portfolio/` (identity/config only), `src/domain/reference/` (security/identifier minimum), `src/domain/values/`;
- `src/application/transactions/` (deposit append/history orchestration only);
- `src/ports/ledger.ts`, `src/ports/portfolio.ts`, `src/ports/security-reference.ts`;
- `src/infrastructure/repositories/ledger*.ts`, `portfolio*.ts`, `security*.ts`;
- `src/shared/validation/ledger*.ts` if needed for structural boundary schemas;
- `tests/unit/ledger*.test.ts`, `financial-values*.test.ts`, `reference*.test.ts`, `tests/integration/ledger*.test.ts`, `tests/fixtures/ledger.ts`;
- one new `prisma/migrations/<timestamp>_transaction_ledger/migration.sql`;
- `docs/adr/0004-transaction-ledger.md` and this M6.3 directory's Slice 1 review/precision/mapping documentation.

Existing files permitted only as directly needed: `prisma/schema.prisma`, `src/shared/ids.ts`, `src/shared/errors/index.ts`, `src/infrastructure/db/client.ts`, `app/server/persistence.ts`, `scripts/check-boundaries.mjs`, `tests/architecture/*`, `tests/fixtures/database.ts`, `tests/integration/registry.test.ts`, relevant error/logging tests, `docs/PROGRESS.md`, `README.md`.

Do not edit prior migrations, approved M1–M6.1 source documents, historical M6.2 reviews, UI/routes/actions, providers or unrelated code. No dependency changes are expected: exact scaled BigInt arithmetic fits this slice. If a new dependency or additional path is necessary, explain its purpose and scope before expanding the plan; do not weaken boundary enforcement.

## Exact implementation scope

### 1. Value and identity contracts

Add nominal PortfolioId/SecurityId/TransactionId/TransactionLegId and source/watermark contracts; reuse DateOnly, Instant, Clock and IdGenerator. Pure core has no Prisma, Next, Zod, IO or uncontrolled time.

Money is VND with exact decimal semantics; share quantity is integral for ordinary shares; price/ratio preserve exact supplied decimals. Implement only necessary exact parse/add/subtract/compare/multiply operations; no MWAC or rounding division yet. Keep serialization exact TEXT and avoid Number/parseFloat/toFixed/SQL REAL arithmetic. Document accepted size/scale limits and reject overflow/excess precision rather than truncate. Storage performs no rounding; no display rounding code is needed without UI. Later division policy must be versioned before use.

### 2. Minimal reference and portfolio records

Portfolio stores only M2 identity/configuration. SecurityMaster uses durable IDs and the owning VN30_MASTER §6 contract; include minimal effective identifier history and reject ambiguous/overlapping ticker resolution. Current sector cache is optional; no guessed sector/member seed. Expose no claim of current VN30 eligibility from missing data. Test reference identity persistence independently; posting deposits needs no security.

### 3. Ledger model and supported-operation boundary

Model the exact twelve M2 transaction types and eight leg types, not generic names from examples. Retain M2 header/leg field names via documented camelCase mapping. Model signed amount/quantity exclusivity, date/source/status/linkage and exact fee/tax facts. Policy references must resolve to immutable methodology metadata, not an invented approval seed.

Only CASH_DEPOSIT may be committed POSTED in this slice: one strictly positive CASH leg; CONTRIBUTION classification; zero fee/tax; no execution/security/settlement/corporate/dividend/reversal fields; valid owning active VND portfolio and supported inception/effective time. The application creates canonical legs from validated input rather than trusting arbitrary caller postings. Reject speculative future-effective deposits using the injected clock.

All other recognized event types return explicit UNSUPPORTED before persistence. Unknown strings are invalid. Do not accept structurally valid SELL/withdrawal/reversal as POSTED without replay/state validation. Do not expose a generic writer that bypasses the supported-operation gate. Model PENDING status but do not build a user draft workflow or persist unsupported drafts in this slice.

Reserved optional complex-event fields must reject non-null values until supported, rather than referencing nonexistent tables or opaque unchecked detail blobs. Do not fake implementation of dividends/corporate actions with placeholder rows.

### 4. Atomic append and immutable history

One database transaction must commit header + complete legs + audit/source identity + portfolio revision/event association. To construct a closed aggregate, use internal PENDING insertion → leg insertion → validated POSTED finalization in that same transaction, or a demonstrably equivalent atomic design. No intermediate state may commit through the supported API.

Use restrictive FKs/unique constraints and triggers to block POSTED header update/delete/REPLACE, posted-leg update/delete/REPLACE, late insertion and reparenting. Finalization must validate aggregate completeness. Test raw-SQL attacks through supported connections as well as repository API restrictions. Do not claim defense against an OS owner disabling triggers or rewriting the file.

No update/delete/upsert endpoint. Correction semantics are append-only REVERSAL with exact original linkage, later implemented in Slice 6. This slice must reject a correction request explicitly; it must never simulate reversal by mutating original status or deleting legs.

### 5. Idempotency, concurrency and watermark

Require stable transaction identity across retries and preserve source/reference. Use portfolio + source + non-null source_reference as the source dedup namespace, documented as a per-event reference (not an entire statement ID); import adapters must later derive unique stable per-row/event keys. Nullable absent references remain permitted; retry protection then requires reuse of transaction ID. Do not guess duplicate identity from equal amounts/dates.

Duplicate ID or source key returns ConflictError with no second event; changed payload under the same key is also conflict, never replacement. Two distinct legitimate deposits without source references remain possible.

Require expected ledger revision. Claim/update that revision conditionally inside the same transaction as validation and append; stale revision fails. Return immutable commit receipt (transaction ID + committed watermark), not a CashState. Revisions are scoped to portfolio, associated with committed events, and never advance on rollback. They are not the economic replay sort key. Independent connections must prove race safety. Lock contention may return a safe conflict; any bounded retry must reread/revalidate, never reuse stale state.

### 6. Reads, validation and errors

Provide immutable transaction/history reads with provenance. Effective-posting reads filter POSTED parents and each leg's own cutoff, ordered by effective timestamp → event timestamp → transaction ID → leg sequence. Read records and revision from a consistent database snapshot. Return no invented balances or projection freshness claims.

Use strict boundary schemas without coercing financial numbers. Domain rules remain pure. Missing references, invalid data, duplicate/stale submissions and corrupted persisted rows map to appropriate existing typed errors. For unsupported operations expose a fixed safe reason such as UNSUPPORTED_TRANSACTION_TYPE, without leaking payloads. If a new error category is necessary, update the closed public/log mapping and its tests together. Logs never contain complete transaction payloads, notes, financial amounts, source references, raw SQL or causes.

## Required tests and acceptance criteria

1. Exact numbers: integers beyond 2^53, fractional price/rate transport, signed leg representation, zero/negative deposit rejection, NaN/Infinity/number/exponent/locale text/oversize rejection; storage round-trip and exact comparison. No approximate monetary assertions.
2. Identity/time/currency: invalid/unknown ticker resolution, historical rename/ambiguous intervals, missing FKs, invalid calendar/instant/currency, pending non-effect, invalid type and unsupported known types.
3. Deposit: canonical one-CASH-leg event, correct CONTRIBUTION facts, provenance and immutable receipt; no holdings/current_cash/NAV stored. An invalid extra field/leg cannot sneak into the aggregate.
4. Model structure: leg value exclusivity, security requirements, duplicate sequences/leg IDs, wrong parent/portfolio linkage; known correction/settlement fields cannot be abused on deposit.
5. Persistence: clean migration and upgrade from populated M6.2 migration preserve registry records; repeat deploy/status, FK/index constraints, exact TEXT storage, reconnect and immutable reads.
6. Atomicity: fail during leg insertion/finalization/revision advancement and prove zero partial header/legs/version changes. Verify finalized leg set cannot gain extra legs even via direct supported-connection SQL.
7. Duplicates: same ID, same source reference with new ID, changed payload, missing-reference legitimate events, cross-portfolio namespaces. Two-connection concurrent duplicates produce one event only.
8. Stale/concurrency: independent connections submitting same expected revision, distinct keys; at most one succeeds; loser can reread and resubmit correctly. Safe lock failure cannot partially advance state.
9. History: deterministic ordering independent of insertion order; per-leg cutoff; revision is not the replay tie-breaker. Unsupported trade examples are pure structural fixtures only, never committed through a bypass.
10. Immutability/security: reject UPDATE/DELETE/REPLACE on posted headers/legs, late insertion/reparenting; no generic mutation API, no raw Prisma in ports, safe error/log canaries and unchanged foundation boundary guarantees.

Use temporary databases only. Extend the existing fixture to test an actual prior-schema upgrade, not just two fresh final-schema migrations. Update the registry's exact table-list test deliberately while preserving all original registry behavior assertions. Test SQL/schema guards and repository/domain guards separately. No live market data, production ledger seed or real methodology approval seed.

## Validation commands

After implementation with the pinned runtime:

```sh
node --version
pnpm --version
pnpm db:validate
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:boundaries
pnpm build
git diff --check
```

Migration deploy/status/upgrade/reopen must run against private disposable fixture DBs with explicit DATABASE_URL and `--no-env-file` through `scripts/database.mjs`. Do not run migrate/reset/db push on the user's default database. If schema and generated clients are used in parallel gates, generate once first and avoid concurrent writers. Build/typegen must not collide with the user's dev server; use an isolated source copy/frozen dependencies as documented by M6.2 if needed. Run existing shell E2E when composition behavior changes. Dependency audit is required if dependency files change. Report each exit/result honestly, including blocked gates.

## Explicit exclusions and stop condition

No cash/position reconstruction, MWAC release, realized/unrealized P&L service, NAV, prices/provider integration, snapshot/reconciliation implementation, executable reversal or corporate action, cash withdrawals/BUY/SELL posting, imports/UI/API routes, scoring/decision/DCA/AI, broker credentials/execution, or unrelated refactors. Those are later slices; do not implement Slice 2.

Review the actual diff from all six perspectives named in the plan. Classify findings Critical/Major/Minor, fix unresolved Critical/Major and rerun relevant gates. Return summary, files changed, design decisions with source references, test evidence, known issues and review status. Record precision/physical mapping decisions and progress without claiming user approval. Stop after Slice 1 for review; do not advance automatically.
