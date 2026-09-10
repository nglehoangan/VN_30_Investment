# VN30 Value Investing OS — Portfolio Model

**Document:** `PORTFOLIO.md`  
**Milestone:** 2 — Portfolio Data Model & Database  
**Status:** Production-Ready — Re-reviewed; Awaiting Approval  
**Version:** 1.1  
**Date:** 2026-09-04  
**Depends on:** `DATA_MODEL.md` v1.2  
**Governing documents:** Investment Policy, Decision Framework, Risk Policy, Scoring Model, System Prompt

---

# 1. Purpose

This document defines the logical portfolio state model for VN30 Value Investing OS.

It specifies how the system must derive and present:

- portfolio identity;
- settled and unsettled cash;
- open and closed positions;
- cost basis;
- realized and unrealized P&L;
- dividend income;
- NAV;
- portfolio and sector weights;
- external contributed capital;
- DCA-related portfolio context;
- VN30 eligibility and Legacy Holding status;
- reconciliation controls;
- historical portfolio state as of any supported timestamp.

This document does **not** create a second accounting ledger. All accounting state defined here is derived from the immutable `Transaction` + `TransactionLeg` model in `DATA_MODEL.md`.

---

# 2. Scope and Design Boundary

## 2.1 In scope

This file owns the definitions of:

- `Portfolio` identity/configuration;
- `PortfolioState` calculated view;
- `Position` calculated view;
- `ClosedPositionHistory` calculated view;
- cash state;
- NAV composition;
- cost-basis presentation;
- P&L presentation;
- allocation metrics;
- portfolio-level risk inputs;
- portfolio reconstruction and reconciliation rules.

## 2.2 Out of scope

The following are defined elsewhere:

- transaction event/posting schema → `TRANSACTIONS.md`;
- VN30 constituent history → `VN30_MASTER.md`;
- sector taxonomy → `SECTOR_MASTER.md`;
- benchmark observations/performance comparison → `BENCHMARK.md`;
- cross-cutting validation/data-quality rules → `DATA_RULES.md`;
- scoring, Buy/Hold/Sell decisions, journal and dashboard implementation → later milestones.

## 2.3 Core rule

> `PortfolioState` and `Position` are projections, not source-of-truth records.

No user, import process, dashboard, or future database job may directly edit calculated portfolio balances to “make them match”. Any economic correction must enter through the authoritative ledger.

---

# 3. Portfolio Source of Truth

Portfolio state at time `t` must be reconstructed from four source classes only:

1. **Ledger facts** — posted `Transaction` headers and `TransactionLeg` postings;
2. **Market facts** — dated security prices used for valuation;
3. **Reference facts** — Security, Sector and VN30 membership history;
4. **Versioned calculation policy** — cost-basis, valuation and performance methods.

Broker statements and dashboard snapshots are reconciliation evidence or cached outputs. They do not replace ledger truth.

---

# 4. Portfolio Entity

## 4.1 Purpose

`Portfolio` identifies one managed investment account/portfolio and stores stable configuration only.

## 4.2 Authoritative fields

| Field | Type | Required | Source | Rule |
|---|---|---:|---|---|
| `portfolio_id` | UUID/string | Yes | USER_ENTERED_RAW | Stable unique identifier. |
| `portfolio_name` | string | Yes | USER_ENTERED_RAW | Human-readable name. |
| `base_currency` | enum/string | Yes | USER_ENTERED_RAW | Must be `VND` in current mandate. |
| `inception_date` | date | Yes | USER_ENTERED_RAW | Beginning of supported accounting history. |
| `status` | enum | Yes | USER_ENTERED_RAW | `ACTIVE`, `CLOSED`, `ARCHIVED`. |
| `created_at` | timestamp | Yes | SYSTEM_METADATA | Audit field. |
| `notes` | text | No | USER_ENTERED_RAW | Non-accounting notes only. |

## 4.3 Fields that must not be stored as mutable Portfolio truth

The following requested fields are derived and must **not** be independently editable:

- `current_cash_vnd`;
- `total_invested_capital_vnd`;
- `nav_vnd`;
- `market_value_vnd`;
- `realized_pnl_vnd`;
- `unrealized_pnl_vnd`;
- `dividend_income_vnd`;
- `stock_weight_pct`;
- `sector_weight_pct`.

They may appear in `PortfolioState` or persisted snapshots, but the ledger/market/reference inputs remain authoritative.

---

# 5. PortfolioState — Calculated View

## 5.1 Purpose

`PortfolioState` is the canonical derived portfolio summary as of one explicit valuation timestamp.

## 5.2 Required fields

| Field | Class | Definition |
|---|---|---|
| `portfolio_id` | KEY | Portfolio being valued. |
| `as_of_timestamp` | KEY | Exact accounting/valuation cutoff. |
| `valuation_date` | CALCULATED | Local reporting date derived from timestamp. |
| `base_currency` | REFERENCE | `VND`. |
| `settled_cash_vnd` | CALCULATED | Sum of posted settled cash-type legs effective by cutoff. |
| `unsettled_receivables_vnd` | CALCULATED | Open receivable balance from posted legs. |
| `unsettled_payables_vnd` | CALCULATED | Open payable balance from posted legs. |
| `other_recognized_assets_vnd` | CALCULATED | Recognized non-trade assets explicitly supported by ledger policy. |
| `other_recognized_liabilities_vnd` | CALCULATED | Recognized non-trade liabilities explicitly supported by ledger policy. |
| `securities_market_value_vnd` | CALCULATED | Sum of valued open positions. |
| `nav_vnd` | CALCULATED | Defined in §8. |
| `net_contributed_capital_vnd` | CALCULATED | Contributions minus withdrawals **within supported ledger history**; opening migration is not silently treated as a contribution. |
| `supported_inception_nav_vnd` | SNAPSHOT_DERIVED | Opening NAV baseline when history begins from an imported non-zero portfolio; null/zero for a verified zero-state inception. Reproducible from opening ledger state + inception valuation inputs. |
| `cumulative_realized_trading_pnl_vnd` | CALCULATED | Realized trading P&L through cutoff. |
| `unrealized_pnl_vnd` | CALCULATED | Sum of open-position unrealized P&L. |
| `cumulative_gross_dividend_income_vnd` | CALCULATED | Gross dividend income when available. |
| `cumulative_net_dividend_cash_vnd` | CALCULATED | Dividend cash actually received net of withholding/charges where identifiable. |
| `cumulative_noncapitalized_expenses_vnd` | CALCULATED | Fees/taxes/expenses not already capitalized or netted into trading P&L. |
| `open_position_count` | CALCULATED | Number of securities with quantity > 0. |
| `cash_weight_pct` | CALCULATED | Defined in §10. |
| `invested_weight_pct` | CALCULATED | Securities market value / NAV. |
| `data_quality_status` | CALCULATED | `OK`, `STALE_MARKET_DATA`, `RECONCILIATION_ERROR`, `INCOMPLETE`, etc. |
| `calculation_method_version` | SYSTEM | Version of accounting/valuation rules used. |

## 5.3 Naming rule

`current_cash` is ambiguous. The system must use explicit names:

- `settled_cash_vnd`;
- future `available_to_trade_cash_vnd` if broker-specific rules are implemented;
- `unsettled_receivables_vnd`;
- `unsettled_payables_vnd`.

The UI must never label unsettled economic assets as “cash”.

---

# 6. Position — Calculated View

## 6.1 Purpose

`Position` represents one security currently owned by one portfolio at a defined timestamp.

## 6.2 Logical key

```text
portfolio_id + security_id + as_of_timestamp
```

For a current-state materialized view, `as_of_timestamp` may be implicit in the snapshot object, but every persisted historical position snapshot must retain it.

## 6.3 Position fields

| Field | Class | Definition / Rule |
|---|---|---|
| `portfolio_id` | KEY | Owning portfolio. |
| `security_id` | KEY | Durable security identity. |
| `ticker` | REFERENCE | Current/effective ticker from Security Master. |
| `company_name` | REFERENCE | Effective canonical name. |
| `sector_id` | REFERENCE | Effective sector mapping. |
| `quantity` | CALCULATED | Sum posted `SECURITY_QUANTITY` legs through cutoff. |
| `open_cost_vnd` | CALCULATED | Remaining MWAC cost basis. |
| `average_cost_vnd_per_share` | CALCULATED | `open_cost_vnd / quantity` when quantity > 0. |
| `current_price_vnd` | MARKET_REFERENCE | Valuation price selected under market-data rules. |
| `price_as_of_timestamp` | MARKET_REFERENCE | Timestamp of selected price. |
| `market_value_vnd` | CALCULATED | Quantity × price. |
| `unrealized_pnl_vnd` | CALCULATED | Market value − open cost. |
| `unrealized_pnl_pct` | CALCULATED | Unrealized P&L / open cost when open cost > 0. |
| `portfolio_weight_pct` | CALCULATED | Position market value / portfolio NAV. |
| `invested_assets_weight_pct` | CALCULATED | Position market value / total securities market value. |
| `lifetime_first_purchase_date` | CALCULATED | Earliest qualifying BUY in complete available lifetime history; `UNKNOWN`/null for migrated opening holdings when pre-inception evidence is unavailable. |
| `current_cycle_first_purchase_date` | CALCULATED | First BUY after most recent zero-quantity state. |
| `last_security_transaction_date` | CALCULATED | Latest security-affecting posted event. |
| `current_member_of_vn30` | CALCULATED | Effective-dated membership lookup. |
| `holding_status` | CALCULATED | `OPEN_ELIGIBLE`, `LEGACY_HOLDING`, `CLOSED`. |
| `data_quality_status` | CALCULATED | Position-specific quality state. |

## 6.4 Position status rules

### `OPEN_ELIGIBLE`

```text
quantity > 0
AND security is a VN30 member at as_of date
```

### `LEGACY_HOLDING`

```text
quantity > 0
AND security is not a VN30 member at as_of date
```

Legacy Holding status does not imply automatic SELL. It means the security is no longer eligible for new capital unless later policy explicitly allows an exception.

### `CLOSED`

```text
quantity = 0
AND open_cost_vnd = 0 within tolerance
```

Closed positions are excluded from the default open-position list but remain available in historical reporting. “Lifetime” labels are permitted only when complete lifetime source history exists.

---

# 7. Cost Basis Model

## 7.1 Method

The portfolio uses **Moving Weighted Average Cost (MWAC)** by:

```text
portfolio_id + security_id
```

This is the only baseline cost-basis method for ordinary BUY/SELL reconstruction unless a future policy version explicitly changes it.

## 7.2 BUY

```text
acquisition_cost_vnd
= gross_trade_value_vnd
+ attributable capitalized buy fees/taxes

new_open_cost_vnd
= prior_open_cost_vnd + acquisition_cost_vnd

new_quantity
= prior_quantity + bought_quantity

new_average_cost_vnd_per_share
= new_open_cost_vnd / new_quantity
```

Settlement cash movement does not change cost basis again.

## 7.3 Partial SELL

```text
cost_released_vnd
= sold_quantity × average_cost_before_sale

remaining_open_cost_vnd
= prior_open_cost_vnd - cost_released_vnd
```

Normal partial selling does **not** alter average cost of remaining shares except for rounding tolerance.

## 7.4 Full exit

If quantity reaches zero:

- `open_cost_vnd = 0` within tolerance;
- average cost becomes null/not applicable;
- cumulative realized P&L remains in history;
- subsequent BUY begins a new position cycle.

## 7.5 Event-aware cost-basis dispatch

A `SECURITY_QUANTITY` posting does **not** by itself imply a BUY or SELL for cost-basis purposes. Cost-basis logic must dispatch using the parent economic event and documented terms:

| Parent event | Quantity effect | Cost-basis effect | Rule |
|---|---:|---:|---|
| `BUY` | + | increase | Add acquisition cost under MWAC. |
| `SELL` | - | release | Release pre-sale MWAC cost; realize P&L once. |
| `OPENING_BALANCE` | + | explicit | Quantity plus verified `COST_BASIS_ADJUSTMENT`; do not treat as a BUY return event. |
| split/reverse split | +/- | normally unchanged total basis | Change quantity per official ratio; recompute per-share average from unchanged reconciled total basis. |
| stock dividend/bonus share | + | policy/terms driven | Do not automatically add BUY acquisition cost; apply documented Vietnam-specific basis rule when codified. |
| rights subscription exercised | + | increase where cash subscription creates acquisition cost | Must link quantity, cash obligation/settlement, and documented subscription terms. |
| merger/spinoff/basis transfer | +/- | transfer/reallocate | Use documented offsetting `COST_BASIS_ADJUSTMENT` legs and action terms. |
| reversal/correction | opposite | opposite/recomputed | Reverse the original economic treatment from reversal effective time; never infer from quantity sign alone. |

This dispatch rule prevents corporate-action quantity changes from being misclassified as ordinary purchases or sales.

## 7.6 Corporate actions

Corporate actions may affect quantity and/or basis only via authoritative ledger legs linked to documented `CorporateActionEvent` terms.

Position rows must never be manually edited for:

- splits;
- reverse splits;
- stock dividends/bonus shares;
- rights subscriptions;
- mergers;
- spinoffs;
- cash-in-lieu;
- other basis-transfer events.

If deterministic cost basis cannot be reconstructed because required terms are missing, the position must be flagged `RECONCILIATION_ERROR` or `MISSING_CORPORATE_ACTION_TERMS`. The system must not infer a “reasonable” average cost.

For basis-transfer actions (merger, spinoff, conversion), the action-level reconciliation must satisfy:

```text
source_basis_released
= destination_basis_assigned
+ basis_explicitly_realized_or_removed
± documented_rounding_tolerance
```

No corporate action may silently create or destroy aggregate open cost. Any cash-in-lieu, taxable realization, or legally required zero-basis treatment must be represented explicitly and supported by the action terms/accounting policy.

---

# 8. NAV Definition

## 8.1 Official portfolio NAV

At timestamp `t`:

```text
NAV_vnd(t)
= settled_cash_vnd(t)
+ securities_market_value_vnd(t)
+ unsettled_receivables_vnd(t)
- unsettled_payables_vnd(t)
+ other_recognized_assets_vnd(t)
- other_recognized_liabilities_vnd(t)
```

## 8.2 Securities market value

```text
securities_market_value_vnd(t)
= Σ [position_quantity(t) × selected_price_vnd(t)]
```

All positions in one official NAV calculation must use a consistent valuation policy and compatible timestamp/date convention.

## 8.3 Price staleness

If an open position lacks an acceptable price:

- NAV must not silently substitute an unverified value;
- the selected fallback rule, if any, must be explicit and versioned;
- `data_quality_status` must surface the issue.

## 8.4 Negative NAV components

Current investment policy prohibits margin. Therefore:

- unsettled BUY payables may temporarily create liabilities before settlement;
- these must not be misclassified as margin debt;
- persistent negative settled cash outside documented timing/reconciliation exceptions is a risk/control exception.

---

# 9. P&L Definitions

## 9.1 Realized trading P&L

For each SELL:

```text
realized_trading_pnl_vnd
= net_sale_proceeds_vnd
- cost_released_vnd
```

Realized P&L occurs on the trade-date accounting event under the selected policy. Settlement does not realize it again.

## 9.2 Unrealized P&L

For each open position:

```text
unrealized_pnl_vnd
= market_value_vnd - open_cost_vnd
```

Portfolio unrealized P&L is the sum across open positions.

## 9.3 Dividend income

Dividend income must remain analytically separate from realized trading P&L.

At minimum expose:

- `gross_dividend_income_vnd` when gross entitlement is known;
- `dividend_tax_withheld_vnd` when identifiable;
- `net_dividend_cash_vnd` actually received.

Do not count the same dividend both as trading P&L and dividend income.

## 9.4 Expenses

Fees/taxes must follow one and only one accounting treatment:

- capitalized into BUY cost;
- netted from SELL proceeds; or
- separately recognized non-capitalized expense.

No fee/tax may appear in more than one bucket.

## 9.5 Economic P&L reconciliation

The reconciliation formula depends on how supported history begins.

### Zero-state inception

If the ledger begins from verified zero assets/liabilities:

```text
NAV_vnd
- net_contributed_capital_vnd
≈ realized_trading_pnl_vnd
+ unrealized_pnl_vnd
+ net_dividend_economics_vnd
- noncapitalized_expenses_vnd
+ other_explicit_corporate_action_economics_vnd
```

### Imported non-zero inception

If the portfolio is migrated using `OPENING_BALANCE`, opening assets are **not** automatically owner contributions and must not be reported as investment profit. Performance/economic-change reconciliation must use an explicit supported-inception baseline:

```text
NAV_vnd(t)
- supported_inception_nav_vnd
- net_external_flow_since_inception_vnd
≈ economic_change_since_supported_inception_vnd
```

Trading P&L, dividend income and expenses can only be labeled **lifetime** when the ledger actually contains the complete lifetime history. Otherwise they must be labeled `since_supported_inception` (or equivalent). Pre-inception gains/losses embedded in imported holdings are part of the opening baseline, not post-inception performance.

Any unexplained residual outside tolerance is a reconciliation exception.

---

# 10. Portfolio Allocation

## 10.1 Position weight

Official portfolio position weight:

```text
portfolio_weight_pct
= position_market_value_vnd / NAV_vnd
```

This denominator intentionally includes cash and recognized unsettled components.

## 10.2 Invested-assets weight

For stock-only comparison:

```text
invested_assets_weight_pct
= position_market_value_vnd / securities_market_value_vnd
```

The system must not confuse this with portfolio weight.

## 10.3 Cash weight

```text
cash_weight_pct
= settled_cash_vnd / NAV_vnd
```

If unsettled assets/payables are material, the dashboard should expose them separately rather than embedding them invisibly inside cash weight.

## 10.4 Sector weight

```text
sector_weight_pct
= Σ market_value_vnd of positions in sector / NAV_vnd
```

Sector classification must use one effective taxonomy/version for all positions in the same comparison.

## 10.5 Reconciliation of weights

Within rounding tolerance:

```text
Σ stock portfolio weights
+ settled cash weight
+ net unsettled/other NAV component weights
= 100%
```

A dashboard may show only stocks + cash for simplicity, but if omitted unsettled/other components are non-zero it must disclose that the displayed components do not sum exactly to 100%.

---

# 11. Capital Contributions and DCA Context

## 11.1 External capital

```text
cumulative_contributions_vnd
= Σ posted owner-capital contributions

cumulative_withdrawals_vnd
= absolute Σ posted owner-capital withdrawals

net_contributed_capital_vnd
= cumulative_contributions_vnd
- cumulative_withdrawals_vnd
```

Do not infer contributed capital from BUY transactions.

## 11.2 DCA plan versus portfolio cash

A monthly DCA plan is a planning object, not portfolio cash.

Therefore:

- `planned_contribution_vnd` does not affect cash;
- `actual_contribution_vnd` becomes economic reality only when a contribution transaction posts;
- non-deployed contribution remains ordinary fungible portfolio cash;
- the accounting layer must not pretend a particular VND currently in cash still “belongs” to a specific DCA month.

## 11.3 DCA deployed amount

Period-level DCA deployment may be calculated for analytics from qualifying BUYs during the plan period under an explicit attribution method.

It must **not** become an accounting source of truth and must never change position cost basis or cash independently.

---

# 12. Historical Portfolio Reconstruction

## 12.1 Required capability

For any supported `as_of_timestamp`, the system must reconstruct without reading mutable current-state fields:

- settled cash;
- unsettled receivables/payables;
- quantity per security;
- open cost basis;
- realized trading P&L;
- cumulative dividend income;
- cumulative external contributions/withdrawals;
- Legacy Holding status;
- NAV, once market prices are supplied.

## 12.2 Reconstruction sequence

1. Start from zero state at inception, or explicit `OPENING_BALANCE` events.
2. Select all immutable `TransactionLeg` postings whose parent Transaction is `POSTED` **and whose own `effective_timestamp <= as_of_timestamp`**. Parent `event_timestamp`, settlement date, broker import time, or a derived `is_reversed` flag must never be used to exclude an otherwise effective posting.
3. Replay selected legs in the deterministic ordering contract from `DATA_MODEL.md`: `effective_timestamp` → parent `event_timestamp` → `transaction_id` → `leg_sequence` (or future explicit monotonic posting sequence). Parent Transaction facts are joined only when required to interpret the selected posting, for example BUY/SELL gross value, fee/tax validation, external-flow classification, or corporate-action linkage.
4. Apply versioned MWAC/corporate-action basis rules. A later reversal is itself a new effective event: it negates the original only from the reversal posting's effective timestamp forward and must **not** retroactively remove the original event from earlier historical states.
5. Derive accounting state before market valuation.
6. Join effective Security/Sector/VN30 reference data.
7. Select valid market prices for valuation timestamp.
8. Calculate market value, unrealized P&L, weights and NAV.
9. Run reconciliation and invariant checks.

## 12.3 Historical cutoff and reversal semantics

Historical reconstruction is **effective-time based**, not current-status based.

Rules:

- a posting affects state only when `effective_timestamp <= as_of_timestamp`;
- a parent Transaction being currently linked to a later reversal does not make the original disappear from earlier history;
- a reversal/correction contributes its own opposite/replacement postings at their own effective timestamps;
- `recorded_at`, import timestamp, dashboard generation time, broker statement date, and current derived `is_reversed` status are audit metadata and must not be substituted for economic effective time;
- a back-dated correction legitimately changes reconstructed historical state from its stated effective timestamp and must be traceable through provenance/versioning.

This rule is required for reproducible month-end NAV, P&L and performance series.

## 12.4 Opening migration

If the investment portfolio predates system inception, each opening holding requires auditable opening facts:

- opening quantity;
- opening verified cost basis;
- source evidence;
- migration method/version.

Opening cash requires a dedicated opening cash posting.

For an imported non-zero portfolio, the system must also create/reproduce a `supported_inception_nav_vnd` valuation baseline from the opening ledger state plus valid inception market/reference data. This baseline is derived evidence, not an editable accounting balance.

If pre-inception transaction history is unavailable:

- `lifetime_first_purchase_date` must be `UNKNOWN`/null for an opening holding unless independently evidenced; the system must not substitute `inception_date`;
- lifetime realized P&L/dividend totals must not be claimed; only metrics since supported inception are valid;
- imported cost basis may support future SELL P&L, but it does not reconstruct pre-inception realized history.

A manually entered `Position` or `PortfolioState` snapshot is not sufficient to reconstruct history.

---

# 13. Cash and Portfolio Reconciliation

## 13.1 Ledger-derived state is authoritative

Broker observations are used only to test whether the ledger appears complete.

They must never overwrite:

- settled cash;
- quantities;
- cost basis;
- realized P&L;
- NAV.

## 13.2 Ledger cash-state derivation

At cutoff `t`, balances are derived independently by leg type and leg effective time:

```text
settled_cash_vnd(t)
= Σ signed amount_vnd of POSTED CASH/FEE_CASH/TAX_CASH/OTHER_CASH legs
  where effective_timestamp <= t

unsettled_receivables_vnd(t)
= Σ signed amount_vnd of POSTED RECEIVABLE legs
  where effective_timestamp <= t

unsettled_payables_vnd(t)
= Σ signed liability amount_vnd of POSTED PAYABLE legs
  where effective_timestamp <= t
```

A trade settlement must be linked to the originating obligation/receivable and must clear it exactly within documented tolerance. A settlement cash leg must not create or release security quantity, cost basis or realized P&L.

For each fully settled ordinary trade, residual trade receivable/payable should be zero. Negative residual receivable/payable balances, over-clearing, or an unmatched settlement are reconciliation errors unless explicitly supported by another documented event.

## 13.3 Cash reconciliation

For broker statement time `t`:

```text
cash_difference_vnd
= broker_reported_settled_cash_vnd(t)
- ledger_derived_settled_cash_vnd(t)
```

Difference outside tolerance requires investigation, not direct balance editing.

Potential causes include:

- missing transaction;
- duplicate import;
- wrong settlement date;
- missing fee/tax;
- unrecorded dividend;
- corporate-action cash effect;
- timing mismatch;
- broker-specific “available cash” reported instead of settled cash.

## 13.4 Quantity reconciliation

```text
quantity_difference
= broker_reported_quantity
- ledger_derived_quantity
```

Any non-zero unexplained quantity difference is at least a Major data-quality issue because it compromises cost basis and NAV.

## 13.5 NAV reconciliation

Broker NAV may differ because of:

- price source/timestamp differences;
- broker treatment of unsettled balances;
- accrued dividend treatment;
- fee accruals;
- rounding.

Therefore broker NAV is not expected to equal system NAV exactly unless valuation conventions are aligned.

---

# 14. Portfolio Risk Inputs

This file does not define the Risk Engine, but PortfolioState must expose reliable inputs for it.

Minimum risk inputs include:

- `nav_vnd`;
- `settled_cash_vnd`;
- `cash_weight_pct`;
- per-position market value and portfolio weight;
- per-sector market value and portfolio weight;
- open-position count;
- Legacy Holding count and weight;
- largest position weight;
- top-N concentration metrics derivable from positions;
- stale/missing price flags;
- negative-cash/reconciliation exceptions;
- cash-flow-adjusted performance series reference for drawdown.

Risk rules must use portfolio weights based on the same valuation timestamp as NAV.

---

# 15. Required Invariants

## 15.1 Portfolio invariants

1. `base_currency = VND` under the current mandate.
2. `Portfolio` contains no mutable accounting balance fields.
3. Every official `PortfolioState` has an explicit `as_of_timestamp` and calculation-method version.
4. Official state uses only posted ledger events.
5. Settled cash is derived exclusively from authoritative cash postings.
6. Security quantity is derived exclusively from authoritative security-quantity postings.
7. Quantity may not be negative in official long-only state.
8. Open cost may not be negative.
9. Quantity = 0 implies open cost = 0 within tolerance.
10. A position with quantity > 0 must have a determinable security identity.
11. A position with quantity > 0 and missing required corporate-action terms must not present a guessed average cost.
12. Market value and position weight require an acceptable valuation price and timestamp.
13. Position weights and NAV must use compatible valuation timestamps.
14. Sector allocations must use one taxonomy/version per calculation.
15. Legacy Holdings remain in NAV and risk calculations even when no longer eligible for new capital.

## 15.2 P&L invariants

1. Realized trading P&L is not derived from cash balance.
2. SELL settlement cannot realize P&L a second time.
3. Dividend income is not included in realized trading P&L.
4. The same fee/tax cannot be capitalized/netted and separately expensed.
5. Full exit leaves no residual open cost.
6. Corporate-action basis transfers must reconcile before affected P&L is considered reliable.
7. A quantity-sign alone must never select BUY/SELL cost-basis logic; parent event type and documented terms are required.
8. Basis-transfer corporate actions must conserve aggregate basis except for explicitly documented realized/removed basis and rounding.

## 15.3 Cash/NAV invariants

1. Settled cash and unsettled receivables/payables are distinct concepts.
2. Trade settlement must clear the specifically associated receivable/payable balance exactly within tolerance; unmatched settlement and over-clearing are errors.
3. NAV must reconcile to its explicit component formula.
4. Persistent unexplained negative settled cash is a control exception under the no-margin policy.
5. External contributions/withdrawals change NAV but do not constitute investment return.

## 15.4 Reconstruction invariants

1. Current positions can be deleted/rebuilt from source data without economic information loss.
2. Current cash can be deleted/rebuilt from source data without economic information loss.
3. Portfolio summary snapshots can be deleted/rebuilt from source data and market observations.
4. Broker reconciliation observations cannot be used as hidden opening balances.
5. Corrections use ledger reversal/replacement rather than editing derived state.

---

# 16. Data Quality States

Recommended portfolio/position quality status hierarchy:

| Status | Meaning | Official valuation allowed? |
|---|---|---|
| `OK` | Required accounting/reference/market data valid. | Yes |
| `STALE_MARKET_DATA` | Accounting valid; market price exceeds freshness rule. | Conditional, clearly flagged |
| `MISSING_MARKET_DATA` | Open position lacks acceptable price. | No complete official NAV |
| `RECONCILIATION_WARNING` | Difference within review threshold or timing explanation pending. | Conditional |
| `RECONCILIATION_ERROR` | Accounting/broker facts materially disagree. | No unqualified official output |
| `MISSING_CORPORATE_ACTION_TERMS` | Quantity/basis cannot be deterministically reconstructed. | No reliable cost/P&L for affected position |
| `INCOMPLETE_HISTORY` | Ledger does not begin from zero or verified opening state. | No reliable lifetime metrics |

A lower-quality status must not be hidden merely because the dashboard can numerically calculate a value.

---

# 17. Persisted Snapshots

Persisting `PortfolioValuationSnapshot` is allowed for performance, audit and dashboard speed, provided the snapshot is explicitly derived.

Minimum snapshot metadata:

- `portfolio_id`;
- `as_of_timestamp`;
- `nav_vnd`;
- NAV components;
- `market_data_cutoff_timestamp`;
- `calculation_method_version`;
- `data_quality_status`;
- `generated_at`;
- optional source-data watermark/hash in implementation.

Snapshots must never be independently edited to correct portfolio accounting. Corrections must originate upstream and snapshots regenerated.

---

# 18. Portfolio Acceptance Scenarios

A production implementation must pass at least the following scenarios.

## Scenario 1 — Cash contribution only

- Deposit 5,000,000 VND.
- No trades.
- Settled cash = 5,000,000.
- NAV = 5,000,000.
- Net contributed capital = 5,000,000.
- Investment return = 0 before expenses.

## Scenario 2 — BUY before settlement

- BUY posts on trade date.
- Quantity and open cost appear immediately under policy.
- BUY payable appears.
- Settled cash has not yet changed.
- NAV does not double count cash plus security value because payable offsets obligation.

## Scenario 3 — BUY settlement

- Settlement cash decreases.
- BUY payable clears.
- Quantity/open cost do not change a second time.

## Scenario 4 — Partial SELL before settlement

- Quantity decreases.
- Cost released under MWAC.
- Realized P&L recognized once.
- Sale receivable appears.
- Settled cash unchanged until settlement.

## Scenario 5 — SELL settlement

- Receivable clears.
- Settled cash increases.
- No second realized P&L entry.

## Scenario 6 — Full exit

- Quantity = 0.
- Open cost = 0.
- Position disappears from open-position view.
- Lifetime realized P&L remains available.

## Scenario 7 — Re-entry

- Later BUY creates a new current position cycle.
- `current_cycle_first_purchase_date` resets.
- `lifetime_first_purchase_date` does not reset.

## Scenario 8 — Dividend

- Dividend cash increases settled cash on receipt date.
- Dividend income increases.
- Trading realized P&L does not change.

## Scenario 9 — DCA plan without contribution

- Planned 5,000,000 VND exists.
- No cash transaction posts.
- Portfolio cash/NAV do not change.

## Scenario 10 — Contribution not deployed

- Actual DCA contribution posts.
- Cash rises.
- No security position changes.
- Carrying cash is valid, not an exception.

## Scenario 11 — Constituent removed from VN30

- Existing holding remains in quantity, NAV and risk calculations.
- Status becomes `LEGACY_HOLDING` on effective removal date.
- Historical periods before removal still show valid VN30 membership.

## Scenario 12 — Stock split

- Quantity changes by official ratio.
- Total open cost remains reconciled according to documented policy.
- Average cost adjusts deterministically.
- No manual Position update occurs.

## Scenario 13 — Missing corporate-action terms

- Quantity/basis cannot be fully reconstructed.
- Position receives error quality status.
- System refuses to silently guess average cost or P&L.

## Scenario 14 — Broker cash mismatch

- Broker statement differs from ledger-derived settled cash.
- Ledger remains unchanged.
- Reconciliation exception is raised.

## Scenario 15 — Missing market price

- Accounting quantity/cost state remains reconstructable.
- Complete official NAV is not presented without an explicit valid fallback rule.

## Scenario 16 — Reversal and replacement

- Original posted transaction remains immutable.
- Reversal negates original ledger effects only from the reversal effective timestamp forward.
- A historical state before the reversal still contains the original event.
- Replacement posts corrected facts.
- Rebuilt portfolio equals the economically correct state without editing Position or cash fields.

## Scenario 17 — Imported non-zero portfolio

- Opening cash, quantity and verified basis are imported through `OPENING_BALANCE`.
- Opening NAV baseline is derived using valid inception valuation inputs.
- Opening NAV is not classified as current-period investment profit or arbitrary owner contribution.
- Post-inception return starts from the supported-inception NAV baseline.
- Unknown pre-inception purchase dates/history remain unknown rather than invented.

---

# 19. Review Findings and Resolutions

## 19.1 Portfolio Manager review

### Finding PM-1 — Ambiguous portfolio weight denominator
**Severity before fix:** Major  
**Risk:** Position weights could be calculated against stock market value rather than NAV, hiding cash allocation and concentration.  
**Resolution:** Defined both `portfolio_weight_pct` and `invested_assets_weight_pct` with different denominators. Risk management must use NAV-based weight unless explicitly stated otherwise.

### Finding PM-2 — Legacy Holding could disappear from allocation logic
**Severity before fix:** Major  
**Risk:** A removed VN30 constituent might be excluded from risk calculations despite still being economically owned.  
**Resolution:** Legacy Holdings remain fully included in NAV, P&L and concentration; eligibility status is separate from ownership state.

### Finding PM-3 — DCA cash attribution could create fictitious earmarked balances
**Severity before fix:** Major  
**Resolution:** Cash remains fungible; DCA deployment is analytics/planning, not accounting ownership of cash.

## 19.2 Data Architect review

### Finding DA-1 — Portfolio summary fields could become a second source of truth
**Severity before fix:** Critical  
**Resolution:** `Portfolio` restricted to identity/configuration; all balances moved to derived `PortfolioState`.

### Finding DA-2 — Current Position row could conceal reconstruction failure
**Severity before fix:** Critical  
**Resolution:** Position explicitly defined as rebuildable calculated view; snapshots cannot act as hidden opening state.

### Finding DA-3 — Cash naming could mix settled and available/unsettled cash
**Severity before fix:** Major  
**Resolution:** Explicit cash categories and naming rules added.

### Finding DA-4 — Historical position timing was underspecified
**Severity before fix:** Major  
**Resolution:** Every historical portfolio/position state is tied to `as_of_timestamp`; deterministic replay remains upstream contract.

## 19.3 Risk Manager review

### Finding RM-1 — Missing-price positions could understate NAV/concentration
**Severity before fix:** Critical  
**Resolution:** Missing acceptable market price blocks an unqualified complete official NAV; quality status must surface failure.

### Finding RM-2 — Unexplained negative settled cash could conceal margin or missing transactions
**Severity before fix:** Major  
**Resolution:** Persistent unexplained negative settled cash is explicitly a control exception under the no-margin mandate.

### Finding RM-3 — Fee/tax treatment could double count P&L impact
**Severity before fix:** Major  
**Resolution:** One-charge/one-treatment invariant restated at portfolio P&L layer.

### Finding RM-4 — Broker state could overwrite system accounting
**Severity before fix:** Major  
**Resolution:** Broker observations are evidence only; mismatches trigger reconciliation, never balance edits.

---

## 19.4 Focused v1.1 reconstruction audit

### Finding V11-DA1 — Historical replay filtered at Transaction level
**Severity before fix:** Major  
**Risk:** A settlement or correction leg could be omitted/included based on parent-event timing rather than its own economic effective time, producing wrong historical cash/NAV.  
**Resolution:** Reconstruction now selects POSTED legs strictly by `TransactionLeg.effective_timestamp <= as_of_timestamp`; parent metadata is joined for interpretation only.

### Finding V11-DA2 — Later reversal could retroactively erase earlier history
**Severity before fix:** Major  
**Risk:** Filtering original rows using a current `is_reversed` state would rewrite prior month-end holdings/P&L.  
**Resolution:** Original postings remain effective historically; reversal postings alter state only from their own effective timestamp forward.

### Finding V11-DA3 — Quantity sign could accidentally drive BUY/SELL cost-basis logic
**Severity before fix:** Major  
**Risk:** Split, bonus-share or merger quantity legs could be treated as purchases/sales and create false open cost or realized P&L.  
**Resolution:** Added event-aware cost-basis dispatch matrix; parent event type and corporate-action terms are mandatory inputs.

### Finding V11-RM1 — Imported opening NAV could be misclassified as profit
**Severity before fix:** Major  
**Risk:** `NAV - net contributed capital` is invalid for a migrated non-zero portfolio and would overstate return.  
**Resolution:** Added reproducible `supported_inception_nav_vnd` baseline and separate zero-start vs imported-inception reconciliation rules.

### Finding V11-RM2 — Pre-inception lifetime metrics could be fabricated
**Severity before fix:** Major  
**Risk:** Opening migration does not reveal true first purchase date or historical realized/dividend totals.  
**Resolution:** Unknown pre-inception facts remain unknown; “lifetime” labels require complete lifetime history.

### Finding V11-RM3 — Settlement clearing contract was insufficiently explicit
**Severity before fix:** Major  
**Risk:** Unmatched or over-cleared receivable/payable could leave cash correct-looking while NAV liabilities/assets remain wrong.  
**Resolution:** Added independent cash/receivable/payable derivation formulas and exact linked-clearing invariant.

### Finding V11-DA4 — Corporate-action basis could be created/destroyed silently
**Severity before fix:** Major  
**Risk:** Merger/spinoff basis adjustments could alter aggregate open cost without a balancing explanation.  
**Resolution:** Added action-level basis-conservation equation and explicit exception treatment for realized/removed basis and cash-in-lieu.

**Focused audit result:** 0 unresolved Critical, 0 unresolved Major.

---

# 20. Final Production-Readiness Review

| Review area | Result |
|---|---|
| Single source of truth | PASS |
| Portfolio summary duplication | PASS |
| Position reconstruction | PASS |
| Cost-basis consistency | PASS |
| Realized/unrealized P&L separation | PASS |
| Dividend double counting protection | PASS |
| Cash reconciliation | PASS |
| Trade-date/settlement treatment | PASS |
| Corporate-action compatibility | PASS |
| VN30 Legacy Holding handling | PASS |
| DCA accounting separation | PASS |
| NAV definition | PASS |
| Concentration/allocation denominator | PASS |
| Missing/stale market-data controls | PASS |
| No-margin cash control | PASS |
| Historical reconstructability | PASS |
| Effective-time replay / reversal semantics | PASS |
| Corporate-action basis conservation | PASS |
| Imported-inception performance baseline | PASS |
| Settlement obligation clearing | PASS |

### Unresolved Critical issues

**0**

### Unresolved Major issues

**0**

### Minor / deferred items

1. Broker-specific `available_to_trade_cash_vnd` rules are intentionally deferred until broker execution requirements are known.
2. Exact price freshness thresholds belong in `DATA_RULES.md` / market-data policy.
3. Physical snapshot storage/indexing is deferred until database technology is selected.
4. Tax-lot accounting is out of scope because MWAC is the approved baseline.

These items do not block the logical portfolio model.

---

# 21. Final Decision

`PORTFOLIO.md` v1.1 is considered **production-ready at the logical-design level** provided it remains subordinate to `DATA_MODEL.md` v1.2 and the immutable Transaction/TransactionLeg ledger.

No portfolio balance, position state, P&L, cash value, NAV, allocation or risk metric defined here may become an independently editable source of truth.

**Approval gate:** Do not proceed to `TRANSACTIONS.md` until this file is approved.
