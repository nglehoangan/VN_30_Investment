# M6.3 — Pre-Implementation Audit

Date: 2026-09-16. Status: preparation complete; implementation not started.

This handoff covers the user's current Steps 1–3: audit, baseline-aligned slice plan, and a narrow Slice 1 implementation prompt. It does not execute that prompt, approve a slice, or declare M6.3 complete. M1–M6.2 approval follows the user's explicit confirmation; older document headers do not reopen approval.

## 1. Sources and precedence

Paths are relative to the repository root. Use `docs/06_DASHBOARD/`, not the duplicate `docs/06_DASHBOARD copy/` tree.

| Source reviewed | Governing contract for this work |
| --- | --- |
| `docs/02 DATABASE/DATA_MODEL.md` v1.2, §§3–6, 9 | Ledger ownership; logical entities; opening migration; exact numbers; MWAC |
| `docs/02 DATABASE/TRANSACTIONS.md` v1.2, §§2–19 | Exact header/leg names, twelve event types, posting contracts, settlement, corrections, replay order |
| `docs/02 DATABASE/PORTFOLIO.md` v1.1, §§4–9, 12–17 | Derived portfolio state, cost/P&L, NAV including obligations, historical state and snapshots |
| `docs/02 DATABASE/VN30_MASTER.md` v1.2, §§2–7 | Durable security identity, identifier history, effective membership and coverage |
| `docs/02 DATABASE/SECTOR_MASTER.md` v1.2, §§2–4 | Effective sector assignments; current sector is convenience only |
| `docs/02 DATABASE/BENCHMARK.md` v1.2, §§2–3 | External-flow-adjusted performance; benchmark never changes accounting balances |
| `docs/02 DATABASE/DATA_RULES.md` v1.2, §§3, 6–13, 26–31 | Owner-document precedence, exact precision, immutable history, reconciliation and provenance |
| `docs/06_DASHBOARD/6.1 Requirements & Architecture/REQUIREMENTS.md`, §§3, FR-3–5, DR/AR | Authoritative ledger; deterministic reconstruction and audit |
| Same directory: `ARCHITECTURE_v1.0.md`, AP-7/8, §§8–10 | Atomic event commit, exact arithmetic, immutable methodology and watermark |
| Same directory: `DOMAIN_MODEL_v1.0.md`, §§5–12, 27 | Value objects, aggregates, source identity and snapshots |
| Same directory: `DATA_FLOW_v1.0.md`, §§4–6, 12–13, 33–35 | Validation before commit, failure behavior, concurrency, read-model lineage |
| Same directory: `SECURITY_v1.0.md`, §§5–10, 14–17 | Server validation, TOCTOU/idempotency, private local DB and safe diagnostics |
| Same directory: `TEST_STRATEGY_v1.0.md`, §§2, 5–12 | Deterministic domain, real persistence, replay, watermark and precision tests |
| Same directory: `IMPLEMENTATION_PLAN_v1.0.md`, §§4, 10–12 | Mandatory M6.3 order, four vertical proofs, prompt/review/validation contract |
| Same directory: `VALIDATION_CASES_v1.0.md`, VC-L01–08, VC-RC01–04, VC-SEC02–04 | Deposit, buy/sell, duplicates, reversal, cache failures, stale writes and leakage |
| `docs/adr/0001-module-boundaries.md`, `0002-validation-errors-config-logging.md`, `0003-sqlite-prisma-persistence.md` | Actual M6.2 boundary, error, numeric transport and persistence decisions |
| `docs/06_DASHBOARD/6.2 Project Foundation/M6_2_FINAL_REVIEW.md` | Approved foundation scope and historical validation evidence |

M1 policy governs investment constraints; M2 owner documents govern accounting. M6.1 organizes implementation without redefining either. The generic examples in the request do not replace approved M2 contracts. No internet financial rules, current fee rates, or provider data are needed for this repository-contract audit.

## 2. Current implementation and database

| Area | Evidence and result |
| --- | --- |
| Domain/application/ports | Only methodology lookup/registry and controlled Clock/IdGenerator contracts exist. No ledger, portfolio, cash, holdings, valuation or reconciliation implementation. This is expected M6.2 scope. |
| Identity/time | `src/shared/ids.ts` has MethodologyId only. `src/shared/time.ts` distinguishes valid calendar dates and canonical UTC millisecond instants. Reuse; do not substitute created/import time for effective time. |
| Validation/errors | Zod at trust boundaries; pure core cannot import it, including transitively. Six safe error categories, fixed public messages, allowlisted logging. `decimal-string.ts` validates transport syntax only, not money signs, units, scale or accounting. |
| Persistence | `prisma/schema.prisma` contains only MethodologyRecord. One migration creates its table/index and immutable update/delete triggers. No production financial columns or relationships exist. |
| Connections/composition | `src/infrastructure/db/client.ts` enables FK/recursive triggers, busy timeout and DELETE journaling. `app/server/persistence.ts` exposes registry and close, not raw Prisma. No automatic migration or DB opening by page render. |
| Precision | `exact-decimal.ts` + `tests/integration/numeric.test.ts` prove TEXT round-trip, even beyond safe integers. They do not implement Money, MWAC division, rounding or financial range validation. |
| Tests | Vitest unit/integration/architecture suites; nominal type contracts; private temporary real SQLite fixtures; controlled time/IDs; Playwright shell smoke. M6.2 reports 80 unit + 36 integration + 33 architecture tests and one browser test. Those counts are historical, not a new M6.3 test result. |
| Test coupling to change | `tests/integration/registry.test.ts` asserts the exact existing table list; it must be updated when the new migration adds tables, while retaining registry assertions. |
| Dependency checker | `scripts/check-boundaries.mjs` permits Zod in narrowly named locations. New infrastructure validators need a precise allowlist entry plus positive/negative boundary tests, or shared boundary schemas. Do not weaken pure-core restrictions. |
| Runtime | Current shell reports Node 22.12.0, pnpm 10.34.5; package requires Node >=22.23.2 <23. Installed NVM directory inspected contains 22.12.0. Select the pinned runtime before implementation quality gates; do not change the system runtime. |
| Repository | Current HEAD is `af6c106 Initialize resource`. README, M6.2 final review and PROGRESS already had user changes at audit start. Historical text claiming this checkout has no HEAD is stale metadata; preserve historical reports and record current evidence here. |

No architecture redesign conflict was found in the inspected M6.2 code. Missing financial facilities are planned M6.3 work, not defects in the approved foundation. The real user database was not opened or migrated.

## 3. Accounting invariants

1. Only signed legs change posted cash/security/obligation balances. Header execution/gross/fee/tax facts drive validation and derived BUY/SELL accounting; never sum them again as cash.
2. Use exactly `BUY`, `SELL`, `TRADE_SETTLEMENT`, `DIVIDEND_CASH`, `CASH_DEPOSIT`, `CASH_WITHDRAWAL`, `FEE`, `TAX`, `CORPORATE_ACTION`, `CASH_ADJUSTMENT`, `OPENING_BALANCE`, `REVERSAL`. Do not add `DIVIDEND`, split or bonus as new type names.
3. POSTED headers and their complete leg sets are immutable: no update, delete, replacement, late leg insertion, reparenting, or change to REVERSED. Pending records have no accounting effect.
4. BUY at trade time creates quantity and positive PAYABLE; SELL creates negative quantity and positive RECEIVABLE. Later TRADE_SETTLEMENT changes cash and clears its particular obligation, never quantity/basis/P&L a second time. Liability-positive PAYABLE is subtracted in NAV.
5. Every settlement identifies its originating posted trade and obligation. Reject wrong portfolio, wrong account, unmatched or excessive clearing. Partial clearing needs source evidence.
6. MWAC is keyed by portfolio + security. BUY adds gross + attributable capitalized fees/taxes; SELL releases pre-sale MWAC cost and realizes net proceeds minus released cost. Full exit leaves exactly zero supported open cost; re-entry starts a new cycle and preserves realized history.
7. No short selling. Validate every relevant historical transition, including downstream effects of a backdated insertion, not merely final current quantity. Cash funding/availability rules must distinguish settlement obligations from settled cash; do not invent a broker buying-power formula.
8. Cash is the sum of effective posted CASH/FEE_CASH/TAX_CASH/OTHER_CASH legs. Receivable/payable accounts remain separate. Net and split cash representation are mutually exclusive; each charge affects economics once.
9. DIVIDEND_CASH recognizes actual receipt, not declaration/ex-date alone. Store net dividend cash and known gross/withholding facts; unknown gross/tax stays unavailable. Dividend metadata never posts balances and dividend income is separate from trading P&L.
10. Deposit/withdrawal classifications are CONTRIBUTION/WITHDRAWAL; all other event headers are NONE. A linked reversal of owner capital derives the opposite external flow despite its NONE header. Contributions are not investment gains.
11. Reconstruct from zero or evidenced OPENING_BALANCE (cash, quantity and verified opening basis, migration version). Imported opening assets are neither fabricated contributions nor post-inception gains. Historical/lifetime labels respect supported inception.
12. Cut off by each leg's effective timestamp and parent POSTED status. Sort by effective timestamp → parent event timestamp → transaction ID → leg sequence. Ingestion order, DB order and a watermark counter must not replace this order.
13. Reversal has opposite legs plus the exact inverse of original versioned derived accounting effects. Original history remains visible before reversal. Correcting settled trades includes dependent settlement reversals and replacement events in an atomic correction group.
14. NAV = settled cash + securities market value + unsettled receivables − unsettled payables + other recognized assets − other recognized liabilities. Do not invent additional asset accounts. Missing/stale prices block or degrade valuation explicitly; accounting remains reconstructable without prices.
15. Corporate actions require documented terms and stage linkage, preserve basis where applicable, and never infer BUY/SELL from leg signs. Missing rules return unsupported/review-required. BUY/SELL TRADE_SETTLEMENT must not be reused as generic corporate-action settlement.
16. Security IDs are durable; historical ticker resolution, effective sector classification, membership and confirmed coverage are reference truth. No membership row with incomplete coverage means UNKNOWN, not FALSE. Legacy holdings remain accounted for.
17. Atomic commit includes header, all legs, provenance/idempotency and source watermark. Rebuild failures retain the committed event and invalidate stale results, without synthetic compensating events.
18. Reconciliation compares evidence with authoritative reconstruction; it never repairs the ledger automatically. Reports retain expected/observed/difference, as-of times, source, contributing IDs, methodology and watermark.

## 4. Schema and migration requirements

Slice 1 requires a new additive migration; never edit the already-applied methodology migration. Logical names stay M2 names, with camelCase TypeScript → snake_case physical mapping documented.

| Slice 1 addition | Requirements |
| --- | --- |
| Portfolio | Identity/name, VND base currency, inception/status/created metadata; no cash/NAV/holdings columns |
| SecurityMaster + identifier history minimum | Stable security identity; owning VN30_MASTER §6 takes precedence over generic DATA_MODEL's optional-history wording. No current membership/sector truth shortcuts. No live seed required. |
| Transaction | M2 §4 header facts, exact TEXT numbers, dates/instants, source/reference, status, linkage. Add immutable accounting-method reference and commit watermark metadata as physical implementation details; no new economic type. |
| TransactionLeg | M2 §5 signed amount/quantity exclusivity, security FK, unique parent/sequence, effective timestamp and obligation reference when supported |
| Commit/version metadata | Portfolio-scoped monotonic revision and event association for stale-write checks, advanced only on successful authoritative commit. This is source versioning, not a balance or replay sort key. |
| Constraints/indexes | IDs and source dedup uniqueness; restrictive FK deletion; portfolio and security references; deterministic leg-sequence uniqueness; status/type constraints; lookup indexes for portfolio history, effective legs and parent/linkage |

Do not create dangling corporate/dividend FKs to nonexistent entities. Reserved fields must reject non-null values until their owning entities are introduced; those real FK migrations belong to the supporting slice. Likewise, defining a future event type is not permission to post it before all its invariants can be checked.

A safe append implementation may insert a PENDING header, attach all validated legs and finalize POSTED inside one database transaction. Pending intermediate state must not escape. DB triggers must permit that construction but reject subsequent additions to a POSTED leg set as well as edits/deletes/REPLACE. Do not expose a generic pending-to-posted bypass.

Test fresh migration, upgrade from populated M6.2 schema, repeat deploy/status, private permissions, foreign-key failures, actual SQLite TEXT representation, reconnect, rollback and indexes. Numeric semantic checks belong to exact domain validation; SQL REAL casts/SUM must not become monetary arithmetic.

Later additive migrations cover event details, reconciliation observations and derived snapshots as their behavior becomes supported. Snapshots must be rebuildable and include ledger watermark, as-of, methodology, market/reference versions, trust and reconciliation state.

## 5. Issues, conflicts and disposition

Severity describes the risk if ignored, not a claim that unimplemented M6.3 is already broken.

| ID / severity | Source and conflict/risk | Proposed resolution / gate |
| --- | --- | --- |
| A01 / Critical, resolved in plan | Request examples suggest immediate cash BUY/SELL and cash + market-value NAV; M2 TRANSACTIONS §§7–12 and PORTFOLIO §8 require trade/settlement obligations. | Follow M2 event contracts and full NAV. No baseline change. |
| A02 / Major, resolved in plan | Six suggested slices omit explicit mandatory snapshots/watermarks, complete corrections and supported corporate actions from Implementation Plan §4. | Expand to eight slices below; preserve approved order and four end-to-end proofs. |
| A03 / Critical, gated | A generic Slice 1 POSTED writer accepting SELL/withdrawal/reversal before replay could violate holdings/cash/basis invariants. | Slice 1 posts CASH_DEPOSIT only. Other known types return explicit UNSUPPORTED before any write. Their staged enablement is mandatory later, not removal from M6.3. |
| A04 / Major, implementation prerequisite | Foundation proves exact storage only; no calculation/rounding policy. | Introduce exact value semantics in Slice 1; record field precision/bounds. No rounding at storage. Version division/rounding before MWAC/valuation activation. |
| A05 / Major, implementation risk | SQLite busy timeout is not proof of atomic stale-state validation or concurrency safety. | Conditional revision claim + validation/write in one DB transaction; independent-connection race tests. Bounded lock failure is safe, blind retry is not. |
| A06 / Major, implementation risk | Update/delete triggers alone permit late inserts into posted leg sets. | Finalization/append guards and adversarial raw-SQL tests on supported connections. |
| A07 / Major, bounded deferral | Broker available-to-trade formulas and complex corporate-action local basis rules are explicitly deferred in M2. | No universal assumptions. Document supported funding policy before trades; reject unsupported actions with evidence. Does not block deposit-only Slice 1. |
| A08 / Minor, owner precedence resolved | DATA_MODEL generic security schema calls sector required/history optional; VN30_MASTER §6 and SECTOR_MASTER own current-cache/history semantics. | Use durable identity + identifier history; optional current sector cache, authoritative effective assignment later. Record mapping; no baseline rewrite. |
| A09 / Major, validation prerequisite | Current shell Node is below package minimum; old test PASS does not certify this runtime. | Select Node 22.23.2 for implementation gates. No unsupported-runtime PASS claim. |
| A10 / Minor, metadata | Duplicate docs tree, stale approval/checkout headers. | Use canonical tree and user approval; record actual HEAD here, preserve unrelated edits. |

No unresolved baseline conflict requires silently changing architecture. A04–A07/A09 are explicit implementation gates and limitations; this preparation is not production certification.

## 6. Test strategy and evidence boundary

Write behavioral tests before implementation, following the companion plan and prompt. Keep financial expected values independent of production helpers. Inject time/IDs; use private fixture DBs and no live prices. Tests must compare exact values, not `toBeCloseTo` for monetary results.

Full M6.3 matrix: deposit/withdrawal; trade versus settlement cash; net/split charges; dividend receipt and unavailable gross; first/repeated BUY; partial/full disposal and repurchase; gains/losses; fees and rational/decimal edge cases; oversell/insufficient funds; duplicate/stale concurrent writes; backdated history; opening-state limits; exact reversal and settled-trade correction; supported/unsupported corporate actions; missing/stale prices; NAV/external-flow separation; exact/cash/quantity/multiple reconciliation mismatches; stale observations; snapshot watermark/invalidation/rebuild failure; migration upgrade/constraints/immutability/precision.

The golden fixture must include explicit settlements in addition to the user's economic-event outline. For example choose fixed deposits, two A purchases, one B purchase, dividend receipt, partial A sale, attributable and standalone charges, then fixed prices. Publish hand-auditable expected cash, obligations, quantities, basis, realized/unrealized P&L and NAV at trade and settlement cutoffs. Reuse it in M6.4–M6.8; no fixture production seed.

Preparation changes Markdown only. Lint/typecheck/unit/integration/build/schema gates are required after Slice 1 implementation, not reported as passed in this audit. Current validation observations and documentation checks are recorded in PROGRESS. M6.2's historical results remain separately attributed above.

## 7. Preparation self-review

| Perspective | Assessment |
| --- | --- |
| Software Architect | Plan preserves modular monolith, pure-core boundaries, authoritative event atomicity and approved milestone order. |
| Senior TypeScript Engineer | Exact numeric transport is distinguished from value objects; boundary checker and error mapper constraints are explicit. |
| Financial Systems Engineer | MWAC, settlement NAV, charge treatment, owner flows and exact reversal semantics are preserved; unsafe event types cannot post early. |
| Data Engineer | Additive upgrade, ownership precedence, frozen leg sets, source dedup and watermark association have explicit acceptance tests. |
| QA Engineer | Future gates and historical evidence are distinguished; no M6.3 PASS or slice approval claimed before implementation. |
| Security Reviewer | No endpoint/provider/AI/broker scope; private fixture DBs, safe diagnostics and no raw payload logs. |

These are one agent's review perspectives, not independent reviewers. Proceed using [the slice plan](IMPLEMENTATION_SLICE_PLAN.md) and [Slice 1 prompt](SLICE_1_CODEX_PROMPT.md); stop after Slice 1 implementation for review. Do not start Slice 2 or M6.4 automatically.
