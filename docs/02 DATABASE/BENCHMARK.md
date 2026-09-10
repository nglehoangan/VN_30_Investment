# VN30 Value Investing OS — Benchmark Model

**Document:** `BENCHMARK.md`  
**Milestone:** 2 — Portfolio Data Model & Database  
**Status:** Re-reviewed Production-Ready Draft — Awaiting User Approval  
**Version:** 1.2  
**Date:** 2026-09-05  
**Depends on:**
- `DATA_MODEL.md` v1.2
- `PORTFOLIO.md` v1.1
- `TRANSACTIONS.md` v1.2
- `VN30_MASTER.md` v1.2
- `SECTOR_MASTER.md` v1.2

---

# 1. Purpose

This document defines the benchmark and performance-comparison model for VN30 Value Investing OS.

Its purpose is to support reliable comparison between the managed portfolio and VN30 without creating a second accounting source of truth or distorting performance because of:

- monthly DCA contributions;
- withdrawals;
- dividend treatment differences;
- stale or missing benchmark observations;
- mismatched valuation dates;
- price-return versus total-return benchmark differences;
- historical corrections to market data;
- portfolio migration from a non-zero opening balance.

This document defines the logical model only. It does not define a market-data vendor, API, SQL schema, dashboard implementation, or benchmark-rebalancing engine.

---

# 2. Scope

## 2.1 In scope

This file owns the logical definitions of:

- `BenchmarkMaster`;
- `BenchmarkObservation`;
- benchmark return calculation;
- portfolio TWR / unitized performance comparison;
- benchmark baseline selection;
- active return;
- benchmark drawdown;
- portfolio-versus-benchmark drawdown comparison;
- benchmark data quality and freshness;
- price-return versus total-return methodology compatibility;
- historical correction/version rules;
- performance-series reconstruction rules;
- benchmark comparison acceptance tests.

## 2.2 Out of scope

The following remain owned elsewhere:

- portfolio cash, NAV, positions and P&L → `PORTFOLIO.md`;
- external cash-flow classification → `TRANSACTIONS.md`;
- VN30 constituent history → `VN30_MASTER.md`;
- security sector history → `SECTOR_MASTER.md`;
- cross-cutting data validation → `DATA_RULES.md`;
- scoring, Buy/Hold/Sell decisions and risk limits → later milestone documents.

---

# 3. Design Principles

## 3.1 Benchmark data must not become portfolio accounting truth

Raw VN30 market data and portfolio accounting data have different owners.

Therefore:

- `BenchmarkObservation` owns raw benchmark levels;
- `PortfolioValuationSnapshot` owns derived portfolio valuation/NAV state;
- `PortfolioPerformanceObservation` owns the reproducible derived unitized/TWR series;
- `BenchmarkComparisonView` owns calculated comparative analytics.

No benchmark record may modify:

- cash;
- security quantity;
- cost basis;
- realized P&L;
- unrealized P&L;
- dividend cash;
- portfolio NAV.

## 3.2 Portfolio performance must be cash-flow adjusted

Because the portfolio receives irregular external DCA contributions and may hold undeployed cash, simple NAV growth is not a valid measure of investment performance.

Official portfolio performance for manager-versus-VN30 comparison must use:

> **Time-Weighted Return (TWR), represented through a unitized NAV series.**

External contributions and withdrawals must not create investment return.

## 3.3 Comparison methodology must be disclosed

A portfolio return that includes dividends is not methodologically identical to a price-only VN30 index return.

Every comparison must therefore disclose:

- benchmark return type;
- portfolio return method;
- base date;
- observation alignment policy;
- data-quality state;
- whether the comparison is fully comparable or methodologically limited.

## 3.4 Missing data must remain missing

The system must not invent:

- VN30 index levels;
- total-return index values;
- benchmark observations for non-trading dates;
- stale closing levels as if they were current;
- historical benchmark values before supported coverage.

---

# 4. Source-of-Truth Model

The benchmark subsystem uses four distinct source classes.

| Data class | Source of truth | Examples |
|---|---|---|
| Benchmark identity/configuration | `BenchmarkMaster` | VN30, return type, currency |
| Benchmark methodology version | `BenchmarkMethodVersion` | Effective methodology/dividend/tax convention |
| Portfolio performance methodology | `PerformanceMethodVersion` | Unitization/TWR timing and linking rules |
| Raw benchmark market data | `BenchmarkObservation` | VN30 close level on a date |
| Portfolio accounting inputs | Ledger + `PortfolioValuationSnapshot` | NAV and valuation components; external-flow facts remain ledger-owned |
| Portfolio performance series | Derived `PortfolioPerformanceObservation` | Unitized index/TWR derived from NAV snapshots + ledger external flows |
| Comparative analytics | Derived view only | active return, relative drawdown |

## 4.1 Prohibited duplicate truth

The following must **not** be independently stored as mutable authoritative data:

- portfolio cumulative return inside `BenchmarkObservation`;
- benchmark cumulative return as raw market truth;
- active return as user-entered data;
- benchmark drawdown as manually maintained state;
- portfolio NAV inside benchmark raw-data tables.

They may be cached in reproducible snapshots or reporting materializations, but must always be derivable from authoritative inputs.

---

# 5. BenchmarkMaster

## 5.1 Purpose

`BenchmarkMaster` identifies a benchmark series and defines the methodology required to interpret its observations.

For current project scope, the primary benchmark is VN30.

## 5.2 Logical schema

| Field | Type | Required | Class | Rule |
|---|---|---:|---|---|
| `benchmark_id` | UUID/string | Yes | REFERENCE_RAW | Stable internal identity. |
| `benchmark_code` | string | Yes | REFERENCE_RAW | Normally `VN30`; not necessarily the primary key. |
| `benchmark_name` | string | Yes | REFERENCE_RAW | Human-readable name. |
| `currency` | string | Yes | REFERENCE_RAW | `VND`. |
| `market` | string | Yes | REFERENCE_RAW | Vietnamese equity market context. |
| `return_type` | enum | Yes | REFERENCE_RAW | `PRICE_RETURN`, `TOTAL_RETURN`, or another explicitly defined official series. |
| `calculation_convention` | string | Yes | REFERENCE_RAW | Methodology identifier/version; must be known for official comparison. |
| `dividend_treatment` | enum | Yes | REFERENCE_RAW | `NONE`, `GROSS_REINVESTED`, `NET_REINVESTED`, or explicitly documented equivalent. |
| `tax_treatment` | string | No | REFERENCE_RAW | Tax/withholding convention relevant to total-return methodology. |
| `fee_treatment` | string | No | REFERENCE_RAW | Whether index return assumes zero fees or another explicit convention. |
| `calendar_id` | string | No | REFERENCE_RAW | Trading-calendar reference when implemented. |
| `coverage_from` | date | Yes | REFERENCE_RAW | Earliest supported date for this series. |
| `coverage_to` | date/null | No | REFERENCE_RAW | End of supported coverage if discontinued. |
| `source_name` | string | Yes | REFERENCE_RAW | Data provenance. |
| `source_series_identifier` | string | No | REFERENCE_RAW | Vendor/official series ID if available. |
| `status` | enum | Yes | REFERENCE_RAW | `ACTIVE`, `INACTIVE`, `DISCONTINUED`. |
| `created_at` | timestamp | Yes | SYSTEM_METADATA | Audit field. |
| `notes` | text | No | REFERENCE_RAW | Methodology limitations only. |

## 5.3 Invariant

Two benchmark series with different return methodologies must have different `benchmark_id` values even if both are commonly described as “VN30”.

Example:

- VN30 Price Return;
- VN30 Total Return.

They are not interchangeable observations of one series.

## 5.4 BenchmarkMethodVersion

A benchmark series may change documented calculation methodology without changing its economic identity. Historical reconstruction therefore requires an immutable/effective-dated methodology record rather than relying on mutable text in `BenchmarkMaster`.

Minimum logical fields:

| Field | Class | Rule |
|---|---|---|
| `benchmark_method_version_id` | KEY | Stable immutable version identity. |
| `benchmark_id` | REFERENCE_RAW | Parent benchmark series. |
| `effective_from` | REFERENCE_RAW | First session/date governed by this version. |
| `effective_to` | REFERENCE_RAW | Exclusive end; null only for current open-ended version. |
| `calculation_convention` | REFERENCE_RAW | Official/vendor methodology identifier. |
| `dividend_treatment` | REFERENCE_RAW | `NONE`, `GROSS_REINVESTED`, `NET_REINVESTED`, or documented equivalent. |
| `tax_treatment` | REFERENCE_RAW | Tax/withholding assumptions. |
| `fee_treatment` | REFERENCE_RAW | Fee assumptions. |
| `source_reference` | REFERENCE_RAW | Methodology provenance. |
| `record_status` | REFERENCE_RAW | `CURRENT` or `SUPERSEDED` for correction lineage. |
| `supersedes_method_version_id` | REFERENCE_RAW | Correction lineage if methodology metadata itself is corrected. |

Rules:

- exactly one authoritative method version may govern a benchmark observation date;
- overlapping authoritative effective periods for the same benchmark are invalid;
- historical observations must resolve to the methodology version effective for their observation date;
- correcting methodology metadata does not rewrite observation values silently; affected analytics must be invalidated/recomputed;
- the descriptive methodology fields retained on `BenchmarkMaster` are current convenience metadata only when this entity is implemented.

---

# 6. BenchmarkObservation

## 6.1 Purpose

`BenchmarkObservation` stores raw dated benchmark levels.

It is the sole raw-data source of truth for benchmark levels used in performance calculations.

## 6.2 Logical schema

| Field | Type | Required | Class | Rule |
|---|---|---:|---|---|
| `benchmark_observation_id` | UUID/string | Yes | MARKET_RAW | Stable observation identity. |
| `benchmark_id` | FK | Yes | MARKET_RAW | References `BenchmarkMaster`. |
| `benchmark_method_version_id` | FK | Yes | MARKET_RAW | Exact effective methodology version governing this observation. |
| `observation_date` | date | Yes | MARKET_RAW | Trading/session date represented by the observation. |
| `observation_timestamp` | timestamp/null | No | MARKET_RAW | Exact market timestamp if available. |
| `observation_type` | enum | Yes | MARKET_RAW | Normally `CLOSE`; other types require explicit policy. |
| `index_level` | decimal | Yes | MARKET_RAW | Positive benchmark index level. |
| `source_name` | string | Yes | MARKET_RAW | Provenance. |
| `source_observation_id` | string/null | No | MARKET_RAW | Vendor/official identifier when available. |
| `received_at` | timestamp | Yes | SYSTEM_METADATA | When system acquired the observation. |
| `quality_status` | enum | Yes | MARKET_RAW | See Section 12. |
| `record_status` | enum | Yes | MARKET_RAW | `CURRENT` or `SUPERSEDED`. |
| `supersedes_observation_id` | FK/null | No | MARKET_RAW | Historical correction lineage. |
| `correction_reason` | text/null | No | MARKET_RAW | Required when superseding. |

## 6.3 Uniqueness rule

For one benchmark series and one observation date/type, there may be multiple historical versions due to corrections, but there must be **at most one authoritative `CURRENT` observation**.

Logical uniqueness for active calculation:

```text
(benchmark_id, observation_date, observation_type, record_status = CURRENT)
```

## 6.4 Correction rule

Raw market observations must not be silently overwritten.

If a source corrects a historical index level:

1. old observation remains stored;
2. old record becomes logically superseded through lineage;
3. corrected record becomes the single authoritative `CURRENT` observation;
4. affected derived performance snapshots are invalidated/recalculated.

The system must retain the original value for auditability.

---

# 7. Benchmark Return Calculation

## 7.1 Single-period return

For two comparable authoritative observations:

```text
benchmark_return(t0, t1)
= benchmark_level(t1) / benchmark_level(t0) - 1
```

## 7.2 Cumulative return from a base date

```text
benchmark_cumulative_return(t)
= benchmark_level(t) / benchmark_level(base_date) - 1
```

This is calculated data, not raw market data.

## 7.3 Baseline rules

The comparison base date must satisfy all of the following:

1. portfolio accounting history is supported at or before the base date;
2. a valid portfolio valuation exists for that date/policy;
3. a comparable benchmark observation exists under the alignment policy;
4. benchmark coverage is supported;
5. return methodology is declared.

The base benchmark index may be normalized for reporting:

```text
normalized_benchmark_index(base_date) = 100
```

and:

```text
normalized_benchmark_index(t)
= 100 × benchmark_level(t) / benchmark_level(base_date)
```

Normalization is presentation only; it does not replace raw benchmark levels.

---

# 8. Portfolio Performance Series

## 8.1 Official comparison method

Official manager performance must use TWR/unitized NAV.

The return series must be derived from:

- authoritative portfolio valuation snapshots;
- external cash-flow classification and cash amounts from the transaction ledger;
- each external flow's authoritative effective timestamp;
- a versioned performance methodology.

`PortfolioValuationSnapshot` must not be retrofitted into a second owner of performance state. Unitized/TWR values belong to a separate rebuildable derived performance series.

## 8.2 External flows

External portfolio flows include events classified by the transaction ledger as capital contributed to or withdrawn from the portfolio.

Examples:

- `CASH_DEPOSIT` from the investor → external inflow;
- `CASH_WITHDRAWAL` to the investor → external outflow.

The following are **not** external capital flows:

- BUY settlement;
- SELL settlement;
- dividend receipt;
- brokerage fee;
- tax;
- corporate-action proceeds generated by owned securities.

Those are internal investment economics and must affect return appropriately.

## 8.3 Unitization convention

The exact unitization algorithm must be versioned in `PerformanceMethodVersion` and referenced by `performance_method_version_id`.

At minimum, the algorithm must ensure:

> External inflows/outflows change the number/value of portfolio units but do not create investment return at the instant of contribution/withdrawal.

The system must not reconstruct TWR by simply computing:

```text
NAV(t) / NAV(base) - 1
```

when external flows occurred.

## 8.4 Migrated opening portfolio

If the portfolio starts with a non-zero `OPENING_BALANCE`, post-inception performance begins from the supported opening NAV baseline.

The system must not infer or fabricate performance before supported inception.

Required metadata:

- supported inception date/timestamp;
- supported inception NAV;
- initial unitized index, normally 100;
- methodology version.

## 8.5 PerformanceMethodVersion

`PerformanceMethodVersion` is the source of truth for how portfolio TWR/unitization is calculated. It must be immutable once used by a published/materialized performance point.

Minimum logical fields:

| Field | Class | Rule |
|---|---|---|
| `performance_method_version_id` | KEY | Stable version identity. |
| `method_name` | REFERENCE_RAW | Human-readable methodology. |
| `valuation_frequency` | REFERENCE_RAW | Daily/EOD or explicitly supported alternative. |
| `external_flow_timing_convention` | REFERENCE_RAW | Exact pre-flow/post-flow or approved BOP/EOP convention. |
| `linking_convention` | REFERENCE_RAW | How subperiod returns are geometrically linked. |
| `day_boundary_timezone` | REFERENCE_RAW | `Asia/Ho_Chi_Minh` unless explicitly configured otherwise. |
| `effective_from` | REFERENCE_RAW | First supported calculation timestamp/date for this version. |
| `effective_to` | REFERENCE_RAW | Exclusive end; null for current version. |
| `status` | REFERENCE_RAW | `ACTIVE`, `INACTIVE`, `SUPERSEDED`. |
| `notes/source_reference` | REFERENCE_RAW | Rationale/provenance. |

A method change creates a new version. Historical performance points retain the old version reference; they must not be silently recalculated under a new timing convention unless the reporting mode explicitly requests restatement.

## 8.6 PortfolioPerformanceObservation

`PortfolioPerformanceObservation` is the canonical derived performance point used for benchmark comparison. It is rebuildable and is not accounting truth.

Minimum logical fields:

| Field | Class | Rule |
|---|---|---|
| `portfolio_id` | KEY | Portfolio identity. |
| `performance_timestamp` | KEY | Timestamp/session represented. |
| `portfolio_snapshot_id` | DERIVED_REF | Exact valuation snapshot used. |
| `unitized_index` | DERIVED | Flow-adjusted portfolio wealth index. |
| `period_twr` | DERIVED | Return since previous canonical performance point. |
| `cumulative_twr` | DERIVED | Linked return from supported baseline. |
| `external_flow_vnd` | DERIVED | Net authoritative external flow applied at this point. |
| `performance_method_version_id` | DERIVED_REF | Exact `PerformanceMethodVersion` used. |
| `source_ledger_watermark` | DERIVED_REF | Ledger replay boundary/hash/version when implemented. |
| `generated_at` | SYSTEM_METADATA | Materialization time if persisted. |

Persisted performance observations are caches/audit materializations only. They must be regenerated after upstream ledger, valuation, market-data or methodology corrections.

## 8.7 External-flow timing invariant

TWR is not deterministic unless the timing convention for capital flows is explicit. The implementation must therefore use a versioned rule based on `TransactionLeg.effective_timestamp` / authoritative external-flow effective time.

For every external flow, the performance engine must have either:

1. a valid valuation immediately before the flow and a valid valuation after subsequent investment performance; or
2. an approved daily approximation convention that explicitly defines whether the flow is treated as beginning-of-period or end-of-period.

The engine must never infer timing from transaction creation time, report date, bank statement date or DCA month. Two flows on the same date with different effective timestamps must remain distinguishable when the methodology requires intraday precision.

If required pre/post-flow valuation evidence is unavailable under the selected method, the affected performance point must be `PROVISIONAL`/`UNSUPPORTED`, not silently approximated by another convention.


---

# 9. Comparable-Date Alignment

Portfolio and benchmark observations may not share identical timestamps.

Therefore comparison requires an explicit alignment policy.

## 9.1 Default policy

For daily end-of-day reporting:

- portfolio valuation should use market data representing the same trading session close or a declared end-of-day valuation policy;
- benchmark should use the authoritative VN30 close for the same session date;
- non-trading days should not create synthetic benchmark returns.

## 9.2 Non-trading dates

If a requested report date is not a benchmark trading date:

- the system may display the most recent prior benchmark observation for valuation context;
- it must **not** label that carried-forward level as a new benchmark observation;
- benchmark return for the non-trading date must not be treated as newly realized return;
- UI/reporting must identify the actual benchmark observation date.

## 9.3 Stale alignment

If portfolio price data and benchmark data represent materially different sessions, comparison status must become `MISALIGNED` or equivalent.

A benchmark must not be silently forward-filled across unsupported or suspicious gaps for official performance evaluation.

---

# 10. Price Return vs Total Return

## 10.1 Core problem

The portfolio economic return naturally includes:

- capital gains/losses;
- dividends received;
- fees and taxes;
- corporate-action economics.

A standard price-only index excludes constituent cash dividends from index return.

Therefore:

```text
portfolio total economic return
vs
VN30 price return
```

is not a fully like-for-like comparison.

## 10.2 Compatibility states

Every benchmark comparison must expose `comparison_method_status`:

- `FULLY_COMPARABLE` — portfolio and benchmark use sufficiently aligned return economics **including verified dividend methodology and disclosed tax/fee treatment**;
- `PRICE_INDEX_LIMITATION` — portfolio total economic return compared with price-only benchmark;
- `METHODOLOGY_MISMATCH` — another material return-definition mismatch exists;
- `INSUFFICIENT_METADATA` — return methodology cannot be verified;
- `DIVIDEND_TAX_FEE_MISMATCH` — benchmark total-return mechanics differ materially from portfolio dividend/tax/fee economics.

## 10.3 Default project policy

Until a reliable VN30 total-return series is available and documented:

- VN30 price index may be used;
- the system must explicitly label the comparison as `PRICE_INDEX_LIMITATION`;
- active return must not be presented as if it were perfectly like-for-like;
- no synthetic dividend adjustment may be invented without an approved methodology and authoritative data.

## 10.4 Future total-return benchmark

If a valid VN30 total-return series is added later:

- create a distinct `BenchmarkMaster` record;
- verify and record whether dividends are gross or net, what withholding/tax assumptions apply, and whether fees are excluded;
- do not overwrite historical VN30 price-index observations;
- allow both series to coexist;
- identify one explicitly as the preferred official comparison benchmark through configuration, not data mutation.

---

# 11. BenchmarkComparisonView

## 11.1 Purpose

`BenchmarkComparisonView` is a derived analytical projection joining the portfolio performance series to a compatible benchmark series.

It is **not** a raw table and must not become a second source of truth.

## 11.2 Logical fields

| Field | Class | Definition |
|---|---|---|
| `portfolio_id` | KEY | Portfolio. |
| `benchmark_id` | KEY | Benchmark series used. |
| `comparison_date` | KEY | Common reporting date. |
| `portfolio_snapshot_id` | DERIVED_REF | Exact portfolio valuation snapshot/version used. |
| `portfolio_snapshot_timestamp` | DERIVED_REF | Portfolio valuation timestamp used. |
| `benchmark_observation_id` | DERIVED_REF | Exact authoritative benchmark observation/version used. |
| `benchmark_observation_date` | DERIVED_REF | Actual benchmark observation date used. |
| `portfolio_nav_vnd` | DERIVED | Portfolio NAV from snapshot. |
| `portfolio_unitized_index` | DERIVED | Flow-adjusted portfolio index. |
| `portfolio_period_return_pct` | DERIVED | TWR-linked return for period. |
| `portfolio_cumulative_return_pct` | DERIVED | Return from common base. |
| `benchmark_raw_level` | DERIVED_REF | Raw authoritative index level. |
| `benchmark_normalized_index` | DERIVED | Normalized series, e.g. base=100. |
| `benchmark_period_return_pct` | DERIVED | Benchmark return for period. |
| `benchmark_cumulative_return_pct` | DERIVED | Return from common base. |
| `active_return_pct` | DERIVED | Portfolio cumulative return − comparable benchmark cumulative return. |
| `portfolio_drawdown_pct` | DERIVED | Drawdown of unitized portfolio index. |
| `benchmark_drawdown_pct` | DERIVED | Drawdown of benchmark normalized index. |
| `relative_drawdown_gap_pct` | DERIVED | Portfolio drawdown − benchmark drawdown, clearly signed by policy. |
| `comparison_method_status` | DERIVED | Compatibility state from Section 10. |
| `data_quality_status` | DERIVED | Combined quality of portfolio and benchmark inputs. |
| `performance_method_version_id` | DERIVED_REF | Exact portfolio performance methodology version. |
| `benchmark_method_version_id` | DERIVED_REF | Exact `BenchmarkMethodVersion` used. |
| `source_ledger_watermark` | DERIVED_REF | Ledger replay boundary/hash/version used for portfolio performance. |
| `calculation_run_id` | DERIVED_REF | Optional immutable calculation lineage identifier when materialized. |

## 11.3 Active return

For a common base date:

```text
active_return_pct(t)
= portfolio_cumulative_return_pct(t)
- benchmark_cumulative_return_pct(t)
```

This is an arithmetic performance gap for reporting.

It must not be confused with:

- alpha from a factor model;
- annualized information ratio;
- excess return over a risk-free rate.

Those are separate future analytics.

---

# 12. Data Quality Model

## 12.1 BenchmarkObservation quality statuses

Minimum supported statuses:

- `VALID`
- `PROVISIONAL`
- `STALE`
- `SUSPECT`
- `SUPERSEDED`
- `MISSING`

`SUPERSEDED` may be represented through `record_status`; implementation may keep quality and record lifecycle separate, but semantics must remain distinct.

## 12.2 Comparison-level quality statuses

Minimum comparison states:

- `COMPLETE`
- `PROVISIONAL`
- `STALE_INPUT`
- `MISALIGNED`
- `BENCHMARK_MISSING`
- `PORTFOLIO_VALUATION_INCOMPLETE`
- `METHODOLOGY_LIMITED`
- `UNSUPPORTED_PERIOD`

## 12.3 Quality propagation

A comparison may never have a higher confidence state than its weakest required authoritative input.

Examples:

- valid benchmark + stale portfolio prices → comparison is stale/incomplete;
- complete portfolio + missing benchmark → benchmark comparison unavailable;
- valid price index + total-return portfolio → calculation may be numerically available but methodology status remains limited.

---

# 13. Drawdown Model

## 13.1 Portfolio drawdown

Portfolio drawdown must use the cash-flow-adjusted unitized portfolio index, not raw NAV.

```text
portfolio_high_water_mark(t)
= max(portfolio_unitized_index(s)) for s <= t

portfolio_drawdown_pct(t)
= portfolio_unitized_index(t)
  / portfolio_high_water_mark(t)
  - 1
```

An external contribution must not mechanically eliminate a drawdown.

## 13.2 Benchmark drawdown

Benchmark drawdown uses the normalized benchmark index:

```text
benchmark_high_water_mark(t)
= max(normalized_benchmark_index(s)) for s <= t

benchmark_drawdown_pct(t)
= normalized_benchmark_index(t)
  / benchmark_high_water_mark(t)
  - 1
```

## 13.3 Relative drawdown use

Portfolio-versus-benchmark drawdown is a risk-comparison diagnostic only.

It does not override the portfolio's absolute drawdown risk policy.

Example:

- portfolio drawdown = -18%;
- VN30 drawdown = -25%.

The portfolio may be outperforming the benchmark while still approaching its own risk limit.

---

# 14. Annualization Rules

## 14.1 Cumulative return first

The canonical stored/derived series is cumulative return or unitized index.

Annualized return is derived only when the period is sufficiently defined.

## 14.2 CAGR

For a period of `years > 0`:

```text
CAGR
= (ending_index / beginning_index)^(1 / years) - 1
```

The same annualization convention must be used for portfolio and benchmark when comparing CAGR.

## 14.3 Short periods

Very short periods should not automatically be annualized because the result can be misleading.

The reporting layer must define a minimum period or clearly label annualized figures for sub-year periods.

---

# 15. Reconstructability Contract

A benchmark comparison as of date `t` must be reproducible from authoritative data.

## 15.1 Portfolio side

Reconstruct from:

1. immutable `Transaction` + `TransactionLeg` history;
2. authoritative corporate-action terms where required;
3. market prices used by `PortfolioValuationSnapshot`;
4. exact `PerformanceMethodVersion` plus versioned valuation policy;
5. supported inception baseline if portfolio history was migrated.

## 15.2 Benchmark side

Reconstruct from:

1. `BenchmarkMaster` identity plus exact `BenchmarkMethodVersion`;
2. the exact authoritative `BenchmarkObservation` IDs/versions selected for the calculation;
3. benchmark observation alignment policy;
4. selected common base date.

## 15.3 Comparison side

Then derive:

```text
portfolio unitized/TWR series
+
benchmark normalized return series
→
active return / relative drawdown / comparison analytics
```

No manually entered cumulative-return field is required for reconstruction.

Two reproducibility modes must be distinguished:

- **latest-truth recomputation** — uses the currently authoritative corrected inputs;
- **as-calculated reproduction** — uses the exact portfolio snapshot, ledger watermark, benchmark observation IDs and methodology versions recorded by the materialized comparison.

A historical source correction may legitimately change latest-truth analytics, but it must not make the provenance of an earlier published calculation unknowable.

---

# 16. Interaction with Transaction History

## 16.1 External cash flows

Transaction history determines which flows are external capital flows.

Benchmark logic must never reclassify a transaction independently.

This prevents two modules from disagreeing over whether a cash event should be excluded from TWR.

## 16.2 Dividends

Dividend transactions remain investment economics.

They increase portfolio economic return through cash/NAV and are not removed as external contributions.

## 16.3 Fees and taxes

Fees and taxes borne by the portfolio remain portfolio economics and reduce portfolio return according to ledger/accounting policy.

Benchmark data must not generate matching synthetic fees/taxes unless the benchmark methodology itself explicitly includes them.

## 16.4 Corporate actions

Corporate actions may affect portfolio NAV and return through authoritative ledger postings and market value changes.

They must **not** create or modify benchmark observations.

If the official VN30 methodology adjusts its index divisor/level for constituent corporate actions, that adjustment is already reflected in the authoritative index level supplied by the benchmark source. The portfolio system must not independently “correct” the VN30 index for the portfolio's corporate actions.

---

# 17. Benchmark and VN30 Membership Boundary

`VN30_MASTER.md` answers:

> Which securities were constituents of VN30 at a given effective date?

`BENCHMARK.md` answers:

> What was the value/return of the VN30 benchmark series on a given supported date?

These are related but separate data domains.

The system must not attempt to recreate official VN30 index levels merely by summing constituent portfolio prices unless a future approved index-replication methodology explicitly requires it.

Official benchmark observations remain their own market-data source of truth.

---

# 18. Reconciliation Rules

## 18.1 Raw benchmark reconciliation

Where multiple trusted data sources are available, differences should create a reconciliation exception rather than silent averaging.

The authoritative source policy must select one value or mark the date unresolved.

## 18.2 Portfolio-versus-benchmark reconciliation

The following checks are required before publishing official comparison metrics:

1. common base date exists;
2. portfolio performance series is valid;
3. external-flow treatment is complete;
4. benchmark observation is authoritative/current;
5. dates/sessions are aligned;
6. benchmark return methodology is known;
7. comparison limitation is disclosed if price-return vs total-return mismatch exists;
8. no unsupported historical gap is silently filled.

## 18.3 Snapshot reconciliation

If cached `BenchmarkComparisonView` or performance snapshots are persisted, recalculation using the same input versions must reproduce them within defined numeric tolerance.

A mismatch must be treated as data-quality/recalculation failure, not manually patched.

---

# 19. Mandatory Invariants

1. `BenchmarkObservation` never owns portfolio NAV or P&L.
2. Portfolio performance never owns raw benchmark levels.
3. Only one authoritative `CURRENT` observation may exist per benchmark/date/type.
4. Corrected market data is superseded, not silently overwritten.
5. Benchmark cumulative return is calculated from raw levels, not manually entered.
6. Portfolio cumulative return for official comparison uses TWR/unitization when external flows exist.
7. CASH_DEPOSIT and CASH_WITHDRAWAL external-flow classification comes only from transaction policy.
8. BUY/SELL settlement is not an external capital flow.
9. Dividends are not external investor contributions.
10. Fees and taxes are not external investor withdrawals unless explicitly posted as such under transaction policy.
11. Benchmark and portfolio comparison must use a common supported base date.
12. Carried-forward non-trading-day benchmark context is never written as a new raw observation.
13. Stale/misaligned benchmark data cannot be presented as fully current.
14. Price-return and total-return series must be distinct benchmark identities.
15. A price-index comparison against portfolio total economic return must be flagged.
16. Synthetic total-return data must not be invented.
17. Portfolio drawdown uses unitized NAV, not raw NAV.
18. Benchmark drawdown uses normalized benchmark index levels.
19. External contributions must not reset portfolio drawdown.
20. Benchmark outperformance does not override absolute portfolio drawdown limits.
21. Portfolio history before supported inception must not be fabricated.
22. A migrated opening portfolio starts performance from its supported inception NAV baseline.
23. Benchmark coverage before `coverage_from` is unsupported, not zero.
24. Missing benchmark observations remain missing unless an explicit alignment policy uses a prior observation for context.
25. Corporate actions in the portfolio cannot modify raw benchmark observations.
26. VN30 constituent history cannot substitute for official benchmark index levels.
27. Active return is derived, never raw data.
28. Cached comparison outputs must be reproducible from authoritative inputs and methodology versions.
29. All benchmark observations require provenance and acquisition metadata.
30. No comparison metric may claim higher data quality than its weakest required input.
31. Unitized/TWR state is not owned by `PortfolioValuationSnapshot`; it belongs to a separate rebuildable performance series.
32. External-flow timing for TWR must use authoritative effective time and a versioned timing convention.
33. A persisted comparison must reference exact portfolio and benchmark input versions sufficient for as-calculated reproduction.
34. `FULLY_COMPARABLE` requires verified dividend methodology plus disclosed tax/fee treatment; “total return” naming alone is insufficient.
35. Every benchmark observation must resolve to exactly one authoritative `BenchmarkMethodVersion`.
36. Every official portfolio performance point must reference exactly one immutable `PerformanceMethodVersion`.
37. Methodology changes create new versions; they do not silently rewrite the method attached to historical published calculations.

---

# 20. Acceptance / Reconstruction Scenarios

Implementation must later pass at least the following logical scenarios.

## Scenario 1 — No external flows

Portfolio NAV rises from 100 to 110; VN30 rises 5%.

Expected:

- portfolio return = 10%;
- benchmark return = 5%;
- active return = +5 percentage points.

## Scenario 2 — DCA contribution with no market movement

Portfolio has NAV 100. Investor contributes 50. Immediately after contribution assets are worth 150 with no investment gain.

Expected:

- raw NAV rises 50%;
- unitized/TWR return remains 0%;
- contribution is not alpha.

## Scenario 3 — Contribution followed by gain

External cash enters, then portfolio assets appreciate.

Expected:

- TWR reflects only investment gain;
- benchmark comparison excludes contribution effect.

## Scenario 4 — Withdrawal

Investor withdraws cash without market movement.

Expected:

- NAV falls;
- unitized return does not show an investment loss solely because of withdrawal.

## Scenario 5 — Dividend receipt

Portfolio receives dividend cash.

Expected:

- dividend contributes to portfolio economic return;
- it is not classified as external DCA flow.

## Scenario 6 — Price-only VN30 benchmark

Portfolio return includes dividend economics; benchmark is VN30 price index.

Expected:

- numeric comparison may be calculated;
- `comparison_method_status = PRICE_INDEX_LIMITATION`.

## Scenario 7 — Total-return benchmark becomes available

Add VN30 total-return series later.

Expected:

- new benchmark identity;
- price-index history remains unchanged;
- comparison can select preferred series explicitly.

## Scenario 8 — Non-trading report date

Report requested on Sunday.

Expected:

- most recent Friday VN30 close may be displayed as context;
- no Sunday raw benchmark observation is created;
- actual observation date remains Friday.

## Scenario 9 — Missing benchmark date

A required trading-day observation is missing.

Expected:

- official comparison for that point is unavailable/provisional;
- system does not interpolate silently.

## Scenario 10 — Corrected historical index level

Vendor corrects a historical VN30 close.

Expected:

- original observation retained;
- corrected observation supersedes it;
- dependent comparison outputs are recalculated.

## Scenario 11 — Duplicate current observation

Two `CURRENT` VN30 close records exist for same date.

Expected:

- validation failure;
- official calculation blocked until resolved.

## Scenario 12 — Migrated opening portfolio

Portfolio enters system with non-zero opening NAV and no complete earlier history.

Expected:

- performance baseline starts at supported inception;
- no pre-inception return is fabricated.

## Scenario 13 — Raw NAV drawdown distorted by contribution

Portfolio falls from unitized 100 to 85, then investor makes a large contribution causing raw NAV to reach a new high.

Expected:

- portfolio drawdown remains based on unitized index;
- contribution does not reset high-water mark.

## Scenario 14 — Benchmark falls more than portfolio

Portfolio drawdown = -18%, VN30 drawdown = -25%.

Expected:

- relative result shows portfolio resilience;
- absolute portfolio risk policy still evaluates -18% independently.

## Scenario 15 — Misaligned market sessions

Portfolio valuation uses Monday prices while benchmark observation is Friday without a non-trading-day reason.

Expected:

- comparison marked `MISALIGNED`;
- not reported as fully comparable.

## Scenario 16 — Stale benchmark

Benchmark source has not updated for several supported trading sessions.

Expected:

- stale quality propagates to comparison;
- stale level not presented as current.

## Scenario 17 — Corporate action in portfolio

Owned security executes a split/dividend/merger.

Expected:

- portfolio ledger and NAV reflect authoritative portfolio accounting;
- raw VN30 benchmark series remains independent.

## Scenario 18 — VN30 membership changes

Constituent enters/leaves VN30.

Expected:

- `VN30Membership` changes historical eligibility/reference state;
- no synthetic benchmark-level calculation is generated from membership table.

## Scenario 19 — Fee/tax event

Portfolio incurs brokerage fee or tax.

Expected:

- portfolio performance reflects economic cost;
- event is not external flow;
- benchmark remains unaffected.

## Scenario 20 — Reversal of external contribution

An erroneous cash contribution is reversed according to transaction policy.

Expected:

- TWR external-flow series reflects authoritative corrected ledger history;
- benchmark subsystem does not independently adjust flow classification.

## Scenario 21 — Comparison cache reproducibility

Persisted comparison snapshot is recalculated with identical input versions.

Expected:

- output matches within numeric tolerance.

## Scenario 22 — Unsupported benchmark history

Portfolio supported inception predates benchmark coverage.

Expected:

- comparison begins only at first common supported baseline;
- earlier benchmark return is not inferred.


## Scenario 23 — Two same-day external flows

Contribution occurs in the morning and withdrawal occurs after market movement later the same day.

Expected:

- effective timestamps remain distinct;
- selected performance methodology determines pre/post-flow valuation treatment;
- implementation cannot collapse both events to one date-level net flow if that changes TWR.

## Scenario 24 — Historical benchmark correction after report publication

A previously used VN30 close is later corrected.

Expected:

- latest-truth comparison recalculates using corrected observation;
- prior published calculation remains reproducible from its recorded observation ID/input lineage;
- no silent loss of provenance.

## Scenario 25 — Total-return series with gross dividends

Benchmark reinvests gross dividends while portfolio receives net cash after withholding/tax and incurs fees.

Expected:

- benchmark is not automatically classified `FULLY_COMPARABLE`;
- dividend/tax/fee methodology is disclosed;
- compatibility becomes `DIVIDEND_TAX_FEE_MISMATCH` or another approved limited state if material.

## Scenario 26 — Valuation unavailable around external flow

External contribution occurs, but the selected TWR method requires a pre-flow valuation that is missing.

Expected:

- performance point is provisional/unsupported;
- engine does not silently switch timing convention.


## Scenario 27 — Portfolio performance methodology changes

The project changes from one approved external-flow timing convention to another.

Expected:

- a new `PerformanceMethodVersion` is created;
- historical published points keep their original method-version reference;
- a restated series, if desired, is explicitly labeled and separately reproducible.

## Scenario 28 — Benchmark methodology changes

The benchmark provider changes documented dividend/tax methodology from a future effective date.

Expected:

- new `BenchmarkMethodVersion` effective period;
- old observations remain linked to old version;
- no overlapping authoritative method periods;
- comparison compatibility is evaluated using the method version actually governing each observation.

---

# 21. Portfolio Manager Review

## Strengths

- Manager performance is not inflated by monthly DCA contributions.
- Cash held while waiting for opportunities remains part of portfolio performance rather than being excluded artificially.
- Dividends remain part of economic return.
- Active return is available without confusing it with alpha.
- Absolute drawdown discipline remains separate from relative benchmark performance.

## Risks addressed

### PM-1 — Forced deployment bias

Holding cash can cause underperformance during strong markets, but this is a real portfolio-allocation outcome and should remain visible in TWR.

**Resolution:** cash remains inside NAV/performance; only external flows are neutralized.

### PM-2 — Dividend benchmark bias

Portfolio total return compared against price-only VN30 may overstate apparent active performance.

**Resolution:** explicit methodology compatibility status; prefer total-return benchmark when authoritative data exists.

### PM-3 — DCA distortion

Raw NAV growth can look strong merely because investor capital was added.

**Resolution:** official manager return is TWR/unitized.

### PM-4 — Relative success masking absolute risk

Portfolio can outperform VN30 while still breaching risk tolerance.

**Resolution:** benchmark comparison never overrides absolute portfolio drawdown policy.

### PM-5 — False like-for-like total-return comparison

**Risk:** a benchmark labeled total return may use gross dividend reinvestment while the portfolio bears withholding taxes and fees.

**Resolution:** compatibility requires explicit dividend/tax/fee methodology, not merely `return_type = TOTAL_RETURN`.

**Portfolio Manager unresolved Critical/Major issues: 0.**

---

# 22. Data Architect Review

## Strengths

- Raw benchmark data, portfolio state and comparative analytics are separated.
- Benchmark methodology is explicitly versioned/identified.
- Historical corrections preserve lineage.
- Return-type identities prevent price and total-return series from being mixed.
- Derived comparison outputs are reconstructible.

## Risks addressed

### DA-1 — Mixed raw/derived benchmark table

**Risk:** storing VN30 level, NAV and cumulative returns together creates duplicate truth.

**Resolution:** separate `BenchmarkObservation`, `PortfolioValuationSnapshot`, and derived comparison view.

### DA-2 — Silent historical overwrite

**Risk:** corrected market data changes historical analytics without audit trail.

**Resolution:** supersession lineage and recalculation requirement.

### DA-3 — Duplicate observation authority

**Risk:** two values for same benchmark/date can produce nondeterministic returns.

**Resolution:** at most one authoritative CURRENT observation.

### DA-4 — Synthetic non-trading data

**Risk:** forward-filled values become indistinguishable from real observations.

**Resolution:** carry-forward allowed only in presentation context; actual source date remains explicit.

### DA-5 — Benchmark identity ambiguity

**Risk:** price-return and total-return data accidentally mixed in one series.

**Resolution:** different `benchmark_id` per methodology.

### DA-6 — Performance ownership ambiguity

**Risk:** storing unitized performance inside portfolio valuation snapshots creates duplicate ownership and conflicts with approved portfolio snapshot contract.

**Resolution:** introduce rebuildable `PortfolioPerformanceObservation` sourced from exact valuation snapshots + authoritative ledger flows.

### DA-7 — Historical input lineage loss

**Risk:** after a benchmark correction, a cached historical comparison cannot reproduce the value originally published if it stores only date/raw level.

**Resolution:** persist exact observation/snapshot IDs, ledger watermark and methodology versions for materialized calculations.

### DA-8 — Version field without source entity

**Risk:** storing a method-version string in output without an authoritative version record does not make historical calculations reproducible.

**Resolution:** define `BenchmarkMethodVersion` and `PerformanceMethodVersion` as explicit versioned source entities and pin every observation/performance point to them.

**Data Architect unresolved Critical/Major issues: 0.**

---

# 23. Risk Manager Review

## Strengths

- Drawdown is cash-flow adjusted.
- Benchmark stale/misaligned states propagate to risk reporting.
- Relative benchmark strength cannot hide absolute drawdown.
- Unsupported periods and methodology mismatches are explicit.

## Risks addressed

### RM-1 — Contribution resets drawdown

**Risk:** raw NAV high-water marks make drawdown look artificially repaired after cash injection.

**Resolution:** unitized high-water mark only.

### RM-2 — False active return precision

**Risk:** price-only benchmark comparison treated as fully comparable despite portfolio dividends.

**Resolution:** mandatory methodology limitation flag.

### RM-3 — Stale benchmark masking stress

**Risk:** old VN30 observation compared against current portfolio valuation.

**Resolution:** alignment/freshness quality state blocks fully valid comparison.

### RM-4 — Benchmark reconstruction from constituents

**Risk:** home-built index replication diverges from official VN30 methodology and divisor adjustments.

**Resolution:** official/selected benchmark observations remain authoritative; constituent history is separate reference data.

### RM-5 — Nondeterministic TWR around cash flows

**Risk:** date-only treatment of external flows allows different implementations to produce different return/drawdown series.

**Resolution:** authoritative effective timestamps plus versioned pre/post-flow timing convention are mandatory.

**Risk Manager unresolved Critical/Major issues: 0.**

---

# 24. Known Minor / Deferred Items

The following are intentionally deferred and are not blockers for the logical model:

1. exact vendor/source for VN30 price and total-return series;
2. exact stale-data threshold in trading days;
3. market-calendar implementation;
4. XIRR/MWR as investor-experience analytics;
5. information ratio, tracking error, beta and factor alpha;
6. physical storage/materialization policy for daily comparison snapshots;
7. intraday benchmark support.

These belong in implementation/data rules or later analytics milestones.

---

# 24A. Re-review Findings — v1.2

Focused audit against source of truth, double counting, cost basis, cash reconciliation, corporate actions and transaction-history reconstruction found and resolved the following Major issues:

1. **Performance ownership ambiguity** — unitized/TWR state was incorrectly implied to belong to `PortfolioValuationSnapshot`. Resolved by explicit rebuildable `PortfolioPerformanceObservation`.
2. **External-flow timing ambiguity** — date-level flow treatment could produce nondeterministic TWR. Resolved with authoritative effective timestamps plus versioned timing convention.
3. **Historical input-lineage gap** — comparison outputs did not pin exact benchmark observation/snapshot versions. Resolved with exact IDs, ledger watermark and calculation lineage.
4. **False total-return comparability** — `TOTAL_RETURN` label alone did not capture gross/net dividend, tax and fee assumptions. Resolved with explicit methodology compatibility fields/states.
5. **Missing benchmark-method source entity** — `benchmark_method_version` was referenced without authoritative version ownership. Resolved with `BenchmarkMethodVersion`.
6. **Missing portfolio-performance-method source entity** — TWR method version was referenced but not modeled. Resolved with immutable `PerformanceMethodVersion`.

No accounting posting path was introduced by benchmark/reference data; therefore cost basis and cash remain exclusively owned by the approved ledger/portfolio contracts.

**Re-review result:** Critical unresolved = **0**; Major unresolved = **0**.

---

# 25. Final Production-Readiness Assessment

| Area | Result |
|---|---|
| Raw benchmark source of truth | PASS |
| Portfolio/benchmark separation | PASS |
| External-flow handling | PASS |
| TWR/unitized performance | PASS |
| DCA distortion prevention | PASS |
| Dividend methodology disclosure | PASS |
| Price vs total-return separation | PASS |
| Historical correction lineage | PASS |
| Comparable-date alignment | PASS |
| Drawdown methodology | PASS |
| Reconstructability | PASS |
| As-calculated lineage reproducibility | PASS |
| External-flow timing determinism | PASS |
| Benchmark methodology versioning | PASS |
| Portfolio performance methodology versioning | PASS |
| Dividend/tax/fee methodology compatibility | PASS |
| Corporate-action isolation | PASS |
| VN30 membership boundary | PASS |
| Data-quality propagation | PASS |
| Critical unresolved | **0** |
| Major unresolved | **0** |

**Document status:** `PRODUCTION-READY — RE-REVIEWED; AWAITING USER APPROVAL`

---

# 26. Approval Gate

Do not proceed to the next Milestone 2 document until this file is reviewed and approved.

After approval, continue with the next remaining Milestone 2 document according to the project sequence.
