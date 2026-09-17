# M6.3 — implementation and validation report

> **Current implementation status — 2026-09-17:** See [completion report](COMPLETION_REPORT_2026-09-17.md) for fixes, current validation and closed findings. This document and its verification erratum below describe earlier states.

> **Verification erratum — 2026-09-17:** M6.3 is NOT complete. The [independent verification audit](VERIFICATION_AUDIT_2026-09-17.md) found 1 unresolved Critical and 3 unresolved Major issues. Any readiness or zero-Critical/Major conclusion below is superseded. Historical command results remain historical evidence, not proof of completeness.

Date: 2026-09-16. Status: implemented supported M6.3 contracts; ready for architectural/CIO review. This report is not user approval or a claim to implement unsupported upstream policy.

## A. Implementation summary

The immutable transaction ledger now supports identity-only portfolio setup; exact decimal financial value objects; explicit posting; deposits/withdrawals; BUY/SELL MWAC; separate net/split trade settlement; dividends with known or unavailable gross/tax facts; standalone fees/taxes; evidenced opening state and exceptional cash adjustments; linked reversals and atomic settled-trade corrections; supported corporate-action stages; historical reconstruction, including earlier ledger watermarks; normalized valuation/NAV/weights; effective reference lookup; reconciliation; and derived snapshots/cache invalidation.

All required VC-L01–08, VC-RC01–04, VC-MD03 and VC-SEC02–03 scenarios are executable. There is no editable Position, CashBalance, NAV or P&L truth. No production UI or live provider was added.

## B. Files created and modified by this implementation

Created:

- `app/server/portfolio.ts`
- `src/application/portfolio/engine.ts`
- `src/application/portfolio/initialize.ts`
- `src/domain/portfolio/values.ts`
- `src/domain/portfolio/transaction.ts`
- `src/domain/portfolio/reconstruct.ts`
- `src/domain/portfolio/valuation.ts`
- `src/domain/portfolio/reconciliation.ts`
- `src/domain/portfolio/reference.ts`
- `src/ports/portfolio.ts`
- `src/infrastructure/repositories/portfolio-command-schema.ts`
- `src/infrastructure/repositories/portfolio-ledger.ts`
- `prisma/migrations/202609160001_portfolio_ledger/migration.sql`
- `tests/fixtures/portfolio/history.ts`
- `tests/unit/portfolio-accounting.test.ts`
- `tests/unit/portfolio-read-models.test.ts`
- `tests/unit/portfolio-command.test.ts`
- `tests/integration/portfolio.test.ts`
- `tests/integration/portfolio-migration.test.ts`
- `docs/adr/0004-portfolio-ledger-and-accounting.md`
- `docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/CHANGE_REQUESTS.md`
- `docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/IMPLEMENTATION_REPORT.md`

Modified:

- `app/server/persistence.ts` — composition exposes ledger, projection and identity-only setup adapters.
- `prisma/schema.prisma` — additive ledger and reference/cache models.
- `scripts/check-boundaries.mjs` — exact additional Zod-schema allowlist entry; no broad core dependency exception.
- `package.json` — adds `test:portfolio`; dependency versions/lockfile unchanged.
- `tests/fixtures/database.ts` — isolated populated-M6.2 upgrade fixture.
- `tests/integration/registry.test.ts` — expected table inventory updated; all original methodology assertions retained.

The pre-existing README, M6.2 final-review, PROGRESS and M6.3 preparation changes were preserved and are not claimed as implementation changes. Generated Prisma artifacts are ignored build products, not hand-authored domain types.

## C. Database changes

New additive migration: `202609160001_portfolio_ledger`. Tables: `portfolio`, `security`, `corporate_action_reference`, `ledger_transaction`, `ledger_leg`, `portfolio_projection`. Existing `methodology_record` rows and migration are retained.

Constraints include primary/foreign keys, portfolio/idempotency and portfolio/source/reference uniqueness, unique reversal target, unique leg sequence, leg value exclusivity, known type/status checks, required lineage, finalized leg-count validation and immutable posted headers/closed leg sets. Corporate-action reference terms are immutable. Monetary legs use SQLite TEXT; event facts retain exact strings in validated JSON.

Authoritative posting claims a portfolio revision and writes/finalizes all headers/legs within one Prisma database transaction. A failing leg insertion rolls back every row and the revision. Projection writes are separate and cannot compensate for or erase committed transactions.

Only isolated test databases were migrated. The user's workspace database was not opened, reset or migrated.

## D. Domain decisions

See [ADR 0004](../../adr/0004-portfolio-ledger-and-accounting.md) for source ownership, exact arithmetic, replay ordering, conservative funding, lifecycle, settlement, correction groups, references and trust behavior.

- Aggregate: immutable source facts plus canonical signed legs; PENDING construction is private to an atomic commit.
- Replay: per-leg effective cutoff, then effective timestamp/event timestamp/transaction ID/sequence ordering. All affected later transitions are validated for backdated writes.
- MWAC: BUY gross + attributable charges; partial release uses one 12-decimal half-even proportional division; full exit releases all residual cost. Settlement never repeats basis/P&L.
- Watermark: monotonic portfolio revision, compare-and-set before validation; historical reads can select an earlier revision's complete input set.
- Snapshot: derived state with method, input, timestamp and source-version metadata; old revisions and changed price/reference versions are detectable. Failed/late rebuilds cannot be presented as current.
- Reconciliation: exact cash/quantity/cost/obligation comparison with external-minus-internal differences and approved statuses; missing/stale/unresolved evidence blocks. It never writes accounting corrections.
- Numbers: exact BigInt scaled-integer arithmetic and decimal-string persistence, VND only; no authoritative binary floating-point arithmetic.

## E. Validation evidence

Runtime: Node **22.23.2**, pnpm **10.34.5**. Commands ran against the unchanged locked dependencies in `/private/tmp/vn30-m63-validation`, an isolated copy of the implementation source. Existing workspace dependency reads stalled in the OS; fresh locked installation resolved that environmental failure. No dependency version changes were needed. SHA-256 comparison confirmed all 76 source/configuration files match the tested copy (generated files and OS metadata excluded).

| Command | Exit | Result | Relevant count/evidence |
| --- | ---: | --- | --- |
| `pnpm lint` | 0 | PASS | ESLint and 37-module boundary graph |
| `pnpm typecheck` | 0 | PASS | Prisma generation, Next type generation, TypeScript |
| `pnpm test --reporter=default --reporter=json --outputFile=/private/tmp/vn30-m63-tests.json` | 0 | PASS | 237 tests / 16 files |
| `pnpm test:portfolio` | 0 | PASS | 88 M6.3 tests / 5 files |
| `pnpm test:integration` | 0 | PASS | 55 tests / 6 files; real isolated SQLite |
| `pnpm build` | 0 | PASS | Production compilation, TypeScript, static generation |
| `pnpm test:e2e` | 0 | PASS | 1 Chromium test; owned loopback server, HTTP 200, startup hook |
| `pnpm prisma validate` | 0 | PASS | Schema valid |
| `pnpm db:migrate` | 0 | PASS | Both migrations on a new temporary database |
| `pnpm prisma migrate status` | 0 | PASS | Two migrations, up to date in temporary database |
| `git diff --check` | 0 | PASS | Workspace tracked diff; final new-file whitespace audit also performed |

Earlier attempts are not counted as passes: the default Node 22.12.0 `db:generate` failed with exit 1; workspace Prisma-generation/typecheck attempts timed out with exit 1; a workspace Vitest worker timed out without executing tests. The first clean typecheck found a nominal-ID conversion issue (fixed with constructors); the first upgrade fixture failed to prepare its SQLite file (fixed). Subsequent final runs above pass; no test assertion was weakened.

## F. Test matrix

Counts by test file (disjoint): accounting/value objects **49**, read models/reference/reconciliation **19**, command boundary **1**, ledger/application SQLite **18**, populated upgrade **1**. Total M6.3 **88**. Existing foundation/architecture tests **149** also pass.

| Domain | Passing scenarios |
| --- | --- |
| Ledger | Immutable headers/legs; atomic commit/rollback; duplicate source/key; distinct same-value events; strict input; concurrency; stale command; VC-L01/05, VC-SEC02/03 |
| Cash | Empty, contribution versus return, withdrawal, insufficient funds, standalone fee/tax, evidenced adjustment, opening cash |
| BUY | Single/multiple BUY; supplied fees/taxes; exact capitalized cost; MWAC; payable before settlement; funded-cash validation; VC-L02 |
| SELL | Partial/full exit, retained realized P&L, rebuy, BUY after partial SELL, oversell, long-only property loop over 100 quantities; VC-L03/04 |
| Dividend | Net/split receipt, gross/withholding reconciliation, no quantity change, unavailable gross/tax instead of invented zero |
| Reversal | Owner-flow inverse; BUY/SELL derived transition inverse; double-reversal rejection; settled-trade atomic correction; original historical queryability; opening/merger reversal; VC-L06 |
| Reconstruction | Shuffled/repeated replay equality; historical cutoff; backdated downstream rejection; earlier source-watermark reproduction |
| Watermark/projection | New event invalidation; failed rebuild retains ledger; old rebuild cannot overwrite newer revision; snapshot price/reference version checks; VC-L07/08 |
| Valuation | Multiple holdings, independently expected NAV/P&L/weights, payable-aware NAV, missing/stale/future/conflicting observations, contribution separation, imported-baseline limitation; VC-MD03 |
| Reconciliation | Exact cash/quantity/cost/obligation match, mismatches, missing/stale evidence, unresolved discrepancy and no ledger modification; VC-RC01–04 |
| References/actions | Historical identifiers/sectors; membership unknown vs complete 30-member absence; overlap rejection; split/reverse split; staged rights accounting and immutable reference; merger basis conservation/reversal; unsupported bonus rejection |
| Numeric precision | Large VND beyond safe integer, exact decimal price/charges, SQLite TEXT/JSON round-trip, signed half-even ties, repeating division, range/syntax/currency/share restrictions |
| Migration | Clean DB on every fixture; populated M6.2 upgrade without record loss; repeat deployment; FK/immutability constraints; reopened golden reconstruction |

Hand-audited golden case at January 12: cash **8,270**, A quantity **90** / cost **966**, B quantity **20** / cost **1,000**, realized P&L **246**, net dividend **95**, standalone expense **5**, net contributions **9,900**. At A price 15 and B price 60: market value **2,550**, unrealized P&L **584**, NAV **10,820**, economic gain **920**. Trade and settlement cutoffs are separately asserted.

## G. Known issues and limits

- **Critical:** none known in accepted supported contracts.
- **Major:** none known in accepted supported contracts; unsupported-policy cases fail before posting.
- **Minor:** the existing workspace dependency files stall on reads; validation uses a clean identical-source checkout. The shell's default Node is older than `.nvmrc`; commands require the pinned runtime. Browser run emits an existing harmless color-environment warning.
- **Deferred / explicitly blocked:** fractional and tax-specific corporate-action cases, bonus basis, partial categorized split settlements (see CRs); broker-specific funding/timing exceptions; market/reference ingestion and live providers; priced imported-inception performance baseline. Normalized inputs are supplied by the caller; no production governance, price or reference data is fabricated.

Reconstruction validates the entire history on each post; projection persistence is an optional optimization. No scaling/performance claim beyond the current local-first scope is made. SQLite controls are application-integrity measures, not protection against an OS owner deliberately disabling triggers or editing the database file.

## H. Change requests

[CHANGE_REQUESTS.md](CHANGE_REQUESTS.md): CR-M63-01 bonus/stock-dividend basis; CR-M63-02 fractional/cash-in-lieu/tax realization; CR-M63-03 explicit partial split-payment source detail. Each records owning baseline, missing rule, risk, impact, safe behavior and requested resolution. None changes approved investment rules silently.

## I. Scope confirmation

**M6.4+ features implemented: NO.**

No scoring/ranking/Top 10, decision/DCA/risk recommendation, workflow/journal, AI, live data provider, broker integration, order placement, margin, automatic trading or production dashboard feature was implemented. Work stops at M6.3 and is submitted for architectural/CIO review.
