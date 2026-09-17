# M6.3 — Completion report, 2026-09-17

**Triển khai và verification M6.3 đã hoàn tất trong phạm vi accounting được hỗ trợ.** Cả bốn finding của audit đã đóng bằng code và regression evidence. Critical chưa xử lý: **0**; Major chưa xử lý: **0** trong phạm vi đã kiểm chứng. Không tự ghi nhận milestone approval và không triển khai M6.4+.

## A. Implementation summary / đóng findings

| Finding | Sửa đổi | Evidence |
|---|---|---|
| C01 — duplicate corporate action | Unique active EFFECTIVE stage được enforce trong economic replay; reversal chỉ giải phóng stage khi replay đến đúng effective time. | Duplicate trước reversal bị reject, DB vẫn 4 events/watermark 4/100 shares. Replacement sau reversal và atomic same-time correction hợp lệ; lịch sử gốc vẫn 200 shares. Permutation/cutoff invariant cũng pass. |
| M01 — reference lệch ngày | Dùng vietnamBusinessDate chung cho snapshot reference, trade/settlement và methodology effective date. | OLD trước 17:00 UTC; NEW từ đúng 17:00 UTC, qua UTC midnight. Sector/identifier được kiểm tra. |
| M02 — pre-inception VALID | LedgerRead mang inceptionAt; application reconstruct/snapshot enforce BEFORE_SUPPORTED_INCEPTION. | Reject snapshot/reconstruct trước inception, kể cả explicit watermark; chính inception vẫn được hỗ trợ. |
| M03 — thiếu opening NAV | Derived inception valuation từ opening ledger + normalized inception prices/references; provenance và freshness tách khỏi valuation hiện tại. | Opening cash 500 + 100 shares × 20 = 2,500; current NAV 3,600; contribution 100; economic gain 1,000. Cost basis 1,000 không bị dùng làm NAV. Reload tái tạo cùng kết quả; sửa price version cho baseline 3,000/gain 500 không đổi ledger. |

Thiếu/stale/future/conflicting inception price hoặc thiếu sector/membership làm imported snapshot BLOCKED, economicPnl null. NAV hiện tại nếu định giá được vẫn hiển thị riêng. Zero inception không cần market baseline và giữ baseline 0. Imported snapshots kiểm tra cả inception price/reference versions trước khi tái sử dụng.

Ngoài bốn fixes, đã bổ sung SELL net/split settlement, spinoff basis/reversal, unknown-method reversal và permutation invariant để kiểm tra các đường accounting liên quan.

## B. Files changed

Inventory nền M6.3 (tạo/sửa ledger, migration, adapters, tests) được giữ trong [implementation report gốc, mục B](IMPLEMENTATION_REPORT.md#b-files-created-and-modified-by-this-implementation). Lần closure này tạo/sửa đầy đủ các file sau:

- `src/shared/time.ts`
- `src/domain/portfolio/transaction.ts`
- `src/domain/portfolio/reconstruct.ts`
- `src/domain/portfolio/valuation.ts`
- `src/domain/portfolio/inception.ts` — mới
- `src/ports/portfolio.ts`
- `src/infrastructure/repositories/portfolio-ledger.ts`
- `src/application/portfolio/engine.ts`
- `tests/integration/portfolio-regressions.test.ts` — mới, suite duy trì chính thức
- `tests/unit/portfolio-accounting.test.ts`
- `package.json` — thêm regression suite vào test:portfolio; không đổi dependency/lockfile
- `README.md`, `docs/PROGRESS.md`
- `docs/adr/0004-portfolio-ledger-and-accounting.md`
- Trong thư mục report này: `IMPLEMENTATION_REPORT.md`, `VERIFICATION_AUDIT_2026-09-17.md`, `COMPLETION_REPORT_2026-09-17.md` (mới).
- `verification-evidence/README.md`; archive đổi từ `m63-verification-audit.test.ts` sang `.ts.txt` để không bị compiler coi là source với relative fixture imports sai chỗ.
- `verification-evidence/closure-results.json`, `closure-source-sha256.json` — mới.

Các chỉnh sửa người dùng từ trước được giữ. Không sửa M1–M5 baseline, không commit/push.

## C. Database changes

Closure không thêm/sửa schema hoặc migration. M6.3 vẫn dùng additive migration `202609160001_portfolio_ledger` và các constraint immutability/FK/uniqueness/atomic finalization đã có. inceptionAt vốn có trên Portfolio nay được đưa qua read port. Baseline NAV là derived evidence, không phải cột balance nhập tay.

Mọi deploy/status/test migration chạy trên private temporary SQLite. Không mở, reset hoặc migrate DB người dùng. Full suite kiểm tra cả clean migration, populated M6.2 upgrade, repeat deploy, reload và conservation of existing records.

## D. Domain decisions

- Aggregate: immutable facts + canonical signed legs; idempotency/source identity và lineage có kiểm soát.
- Replay: effectiveAt → eventAt → transactionId → legSequence; full-history validation trước atomic commit, stage activity theo economic time.
- MWAC: exact open cost; fee/tax supplied được vốn hóa; proportional release làm tròn half-even 12 decimals một lần; full exit giải phóng residual.
- Watermark: revision độc lập economic time; stale commands/rebuilds không ghi đè revision mới.
- Snapshot: replay + current valuation + inception valuation + reconciliation + effective references; chặn trước supported inception hoặc thiếu input cần thiết.
- Reconciliation: so evidence, không auto-fix cash/holdings; matched numbers không xóa unresolved discrepancy.
- Numeric: decimal string/BigInt, không binary floating-point cho tiền; VND/whole-share capability được pin.
- Inception: chỉ opening assets cấu thành imported capital; cùng-instant contribution là external flow; economicPnl có phạm vi since supported inception. ADR 0004 ghi rõ lineage và safe states.

## E. Validation evidence — chạy lại sau sửa

Node 22.23.2, pnpm 10.34.5; isolated checkout `/private/tmp/vn30-m63-validation`. SHA-256 đối chiếu **79 source/config/schema/script/test files**, không có mismatch với workspace; không gồm generated/vendor/OS files. Workspace dependency reads vẫn stall nên dùng locked installation trong checkout này. Archive `.ts.txt` không là TypeScript source; regression maintained nằm trong tests và được chạy thật.

| Command | Exit | Kết quả |
|---|---:|---|
| `pnpm test --reporter=default --reporter=json --outputFile=/private/tmp/m63-closure-tests.json` | 0 | **262/262**, 17 files |
| `pnpm lint` | 0 | ESLint + 38-module boundary graph |
| `pnpm typecheck` | 0 | Prisma/Next type generation + tsc |
| `pnpm test:portfolio` | 0 | **113/113**, 6 files |
| `pnpm test:integration` | 0 | **75/75**, 7 files, real SQLite |
| `pnpm prisma validate` | 0 | Schema valid |
| `pnpm db:migrate` | 0 | 2 migrations applied to fresh private DB |
| `pnpm prisma migrate status` | 0 | Up to date |
| `pnpm build` | 0 | Production compilation/typecheck/static generation |
| `pnpm test:e2e` | 0 | Rebuild + owned loopback smoke + Chromium e2e |
| `git diff --check` | 0 | Workspace tracked whitespace check; additional new-file check |

Các lệnh được chạy tuần tự để tránh Prisma generation race. Lần regression đầu sau sửa có 4 assertion fail vì test tìm reason trong public message thay vì ValidationError.issues; đã sửa sang assert exact code/reason, không bỏ invariant. E2e lần đầu bị sandbox chặn listen 127.0.0.1 (EPERM); rerun với quyền mở owned loopback listener pass: HTTP 200 và 1 Chromium test. Final runs bên trên pass.

[Machine-readable closure evidence](verification-evidence/closure-results.json), [source hashes](verification-evidence/closure-source-sha256.json). Raw logs lưu dưới `/private/tmp/m63-closure-check-*.log`; full test JSON ở path nêu trong lệnh. Audit fail ban đầu vẫn được giữ làm lịch sử, không đổi thành pass hồi tố.

## F. Test matrix

| Domain | Coverage pass |
|---|---|
| Ledger | Immutable header/legs; atomic rollback; duplicate source/key; concurrent revision claims; temporal corporate-stage duplicates; VC-L01/05, VC-SEC02/03 |
| Cash | Empty/zero inception, deposits/withdrawals, settlement, insufficient funds, standalone fee/tax, opening cash, evidenced adjustment |
| BUY | Single/multiple acquisitions, supplied fee/tax, MWAC, funding, partial/full payment; VC-L02 |
| SELL | Partial/full exit, rebuy, realized P&L, oversell, net/split cash settlement once; VC-L03/04 |
| Dividend | Gross/withholding/net, missing gross/tax availability, no quantity effects |
| Reversal | Immutable lineage; BUY/SELL/settlement correction; split replacement before/at/after reversal; merger/spinoff/opening reversal; unsupported method; VC-L06 |
| Reconstruction | Repeated/shuffled replay, corporate temporal invariant permutations, historical cutoff, prior watermark, pre-inception rejection |
| Watermark/projection | Stale drafts/snapshots, failed projection preserving commit, stale rebuild rejection, price/reference/inception version changes; VC-L07/08 |
| Valuation | Current NAV/weights, missing/stale/conflicting/future prices, multiple holdings, priced imported baseline with independent expected values; VC-MD03 |
| Reconciliation | Exact/cash/quantity/cost/obligation mismatches, stale/missing evidence, unresolved discrepancy without auto-fix; VC-RC01–04 |
| References/actions | UTC+7 midnight boundaries, identifier/sector effective intervals, membership coverage, overlap rejection, split/reverse split/rights/merger/spinoff |
| Migration/numeric | Fresh/populated upgrade/reopen; exact large decimal TEXT and rounding/residual invariants |

Disjoint M6.3 counts: accounting **54**, read models **19**, command boundary **1**, ledger/application integration **18**, migration **1**, closure regressions **20** = **113**. Foundation/architecture **149**; total **262**.

## G. Known issues / limits

- Critical: 0 unresolved in verified supported scope; C01 closed.
- Major: 0 unresolved in verified supported scope; M01/M02/M03 closed.
- Minor/environment: root dependency reads stall; pinned-runtime identical-source checkout used. Existing browser color-environment warning is nonblocking.
- Deferred: CR-gated fractional/tax-specific actions, bonus basis, partial categorized split settlements; broker funding exceptions outside conservative capability; market/reference ingestion/live providers. Priced imported-inception baseline is **no longer deferred**.

This is implementation/test completion, not formal approval by the user or a guarantee against every possible defect. No scaling claim beyond local-first replay scope.

## H. Change requests

[CHANGE_REQUESTS.md](CHANGE_REQUESTS.md): CR-M63-01 bonus/stock dividend basis, CR-M63-02 fractional/cash-in-lieu/tax policy, CR-M63-03 partial split-payment charge allocation. These remain safely rejected pending upstream policy, as authorized by brief §15. No new ambiguity or CR introduced; no accounting policy guessed.

## I. Scope confirmation

**M6.4+ features implemented: NO.** No ranking, decision/DCA, live-provider/broker integration, trading, workflow/journal or production portfolio UI. Work stops at M6.3.

## Full requirement closure — 46 sections

The pre-fix [46/30 audit](VERIFICATION_AUDIT_2026-09-17.md) is historical. The following records current disposition, including process evidence rather than claiming to prove the historical order of every implementation step.

| § | Current disposition / evidence |
|---|---|
| 1 | Repository audit/approved contracts: original pre-implementation audit + independent verification + this closure. |
| 2 | PASS — Ledger authoritative; derived balances and NAV. |
| 3 | PASS — Architecture tests and 38-module lint graph. |
| 4 | PASS — Supported M6.3 objective; all four blockers closed. |
| 5 | PASS — Non-goals respected. |
| 6 | PASS — Required dependency layers/value→ledger→replay→snapshot implemented; historical execution order is not independently asserted. |
| 7 | PASS — Immutable transaction aggregate. |
| 8 | PASS within supported capability — required transaction types; unsupported policy cases reject via CR. |
| 9 | PASS — Lifecycle/finalization. |
| 10 | PASS — Economic dedup including temporal C01 regressions. |
| 11 | PASS — BUY and charges. |
| 12 | PASS — SELL/MWAC/realized/oversell. |
| 13 | PASS — Derived cash and settlement. |
| 14 | PASS — Dividend gross/tax/net availability. |
| 15 | PASS within supported capability — C01 closed; corporate stages tested; CR exceptions remain blocked as permitted. |
| 16 | PASS — Reversal/correction preserves effective-time history. |
| 17 | PASS — Deterministic replay/invariants. |
| 18 | PASS — Historical cutoff/watermark and inception guard. |
| 19 | PASS — Monotonic source watermark. |
| 20 | PASS — Projection failure cannot undo commit. |
| 21 | PASS — Normalized market input boundary. |
| 22 | PASS — Current NAV/weights and priced supported-inception baseline. |
| 23 | PASS — Reconciliation without auto-fix. |
| 24 | PASS — Reconciliation states/blocking. |
| 25 | PASS — Snapshot safe states and inception lineage. |
| 26 | PASS — Vietnam business-date effective references. |
| 27 | PASS — Persistence constraints. |
| 28 | PASS — Atomic rollback/commit. |
| 29 | PASS — Exact decimal handling. |
| 30 | PASS — Required domain scenarios plus regressions. |
| 31 | PASS — Named golden cases executable. |
| 32 | PASS — 75 real SQLite integration tests. |
| 33 | PASS — Clean and populated upgrade migration tests. |
| 34 | PASS — Long-only/cost and corporate-stage permutation invariants. |
| 35 | PASS — Commands validate invariants before commit. |
| 36 | PASS — Stale/concurrent command guards. |
| 37 | PASS — Existing security/error boundaries preserved; no new endpoint. |
| 38 | PASS — Minimal validated server composition. |
| 39 | PASS — Current docs, ADR and audit closure updated. |
| 40 | PASS — Required configured commands rerun successfully. |
| 41 | PASS — Command exits/counts/domain evidence and source manifest. |
| 42 | PASS — Completion report A–I and inventory. |
| 43 | PASS — No known unresolved Critical/Major in verified supported scope. |
| 44 | PASS — No policy guess; CR conditions fail closed; approved M03 now implemented. |
| 45 | PASS — All 30 DoD checks below. |
| 46 | PASS — Stop at M6.3; no M6.4+. |

## Definition of Done — 30 checks

| # | Điều kiện | Kết quả |
|---|---|---|
| 1 | Immutable ledger | PASS |
| 2 | Atomic persistence | PASS |
| 3 | Prevent duplicate economic events (C01) | PASS |
| 4 | Reject oversell | PASS |
| 5 | Derived cash | PASS |
| 6 | Correct derived holdings | PASS |
| 7 | Deterministic MWAC/open cost | PASS |
| 8 | Deterministic realized P&L | PASS |
| 9 | Dividend accounting | PASS |
| 10 | History-preserving corrections/reversals | PASS |
| 11 | Historical asOf including inception boundary | PASS |
| 12 | Ledger watermark | PASS |
| 13 | Detect stale snapshots | PASS |
| 14 | Projection failure safety | PASS |
| 15 | Missing/stale price safe states | PASS |
| 16 | NAV/weights and supported-inception baseline | PASS |
| 17 | Reconcile without auto-fix | PASS |
| 18 | Historical effective references (UTC+7) | PASS |
| 19 | SQLite migrations | PASS |
| 20 | Numeric precision tests | PASS |
| 21 | M2/M6 golden cases | PASS |
| 22 | Lint | PASS |
| 23 | Typecheck | PASS |
| 24 | Tests: 262/262 | PASS |
| 25 | Production build | PASS |
| 26 | git diff --check | PASS |
| 27 | Critical unresolved = 0 | PASS |
| 28 | Major unresolved = 0 | PASS |
| 29 | Documentation updated | PASS |
| 30 | No M6.4+ | PASS |
