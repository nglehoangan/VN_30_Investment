# VN30 Value Investing OS — Portfolio Data Model

**Document:** `DATA_MODEL.md`  
**Milestone:** 2 — Portfolio Data Model & Database  
**Status:** Production-Ready — Reviewed for Ledger Reconstruction  
**Version:** 1.2  
**Date:** 2026-09-04  
**Governing Documents:**
- `INVESTMENT_POLICY.md` v1.1
- `RISK_POLICY.md` v1.0
- `DECISION_FRAMEWORK.md` v1.0
- `SCORING_MODEL.md` v1.0
- `SYSTEM_PROMPT.md` v1.0

---

# 1. Purpose

This document defines the logical data model for the VN30 Value Investing OS.

The model is intended to support, without redesigning the accounting foundation:

- current portfolio state;
- cash management;
- immutable transaction history;
- cost basis;
- realized and unrealized P&L;
- dividends;
- DCA planning and deployment;
- portfolio and sector allocation;
- VN30 constituent history;
- benchmark comparison;
- cash-flow-adjusted NAV and drawdown;
- future scoring, Buy/Hold/Sell, risk, dashboard, journal, and performance analytics workflows.

This document defines **logical structure and data ownership only**. It does not prescribe a physical database engine, API, dashboard, ORM, or implementation language.

---

# 2. Requirement Analysis

## 2.1 Core requirements

The data model must be able to answer, deterministically:

1. What securities are currently owned?
2. How many shares of each security are owned?
3. What is the cost basis of each open position?
4. What cash is currently available?
5. What is total portfolio NAV at a defined valuation timestamp?
6. What realized P&L has been generated?
7. What unrealized P&L exists at current or historical market prices?
8. How much dividend income has been received?
9. How much external capital has been contributed or withdrawn?
10. How much of each monthly DCA plan was actually contributed and deployed?
11. What percentage of NAV is invested in each ticker and sector?
12. Was a ticker a VN30 member on a given date?
13. Which tickers entered or left VN30 and when?
14. How did the portfolio perform relative to VN30 after adjusting for external cash flows?
15. Can portfolio state be reconstructed from authoritative historical records?

## 2.2 Governing investment constraints that affect data design

The model must preserve the ability to enforce:

- VN30-only eligibility for new capital;
- Legacy Holding treatment after a constituent leaves VN30;
- no leverage / no margin;
- minimum executable board-lot constraints;
- selective rather than forced DCA deployment;
- portfolio and sector concentration checks;
- cash-flow-adjusted NAV and drawdown calculations;
- auditability of each add / reduce / sell decision;
- explicit market-data freshness.

## 2.3 Non-goals for this document

This version intentionally does not define:

- stock-scoring tables;
- valuation model inputs;
- financial-statement schemas;
- technical indicators;
- decision-state records;
- journal schema;
- broker reconciliation implementation;
- tax-lot optimization;
- database indexes or SQL DDL.

Those may depend on this data model but should not be mixed into the portfolio accounting source of truth.

---

# 3. Design Principles

## 3.1 Single source of truth

Every economic event must have one authoritative home.

The **Transaction Ledger** is the authoritative source for portfolio-changing economic events.

Examples:

- BUY;
- SELL;
- cash contribution;
- withdrawal;
- dividend receipt;
- fee;
- tax;
- security/cash effects of corporate actions.

Current holdings, current cash, cost basis, P&L, weights, and NAV are derived from those events plus dated market prices.

## 3.2 Immutable transaction history

Posted economic events are logically immutable.

A historical error must not be silently edited or deleted. It must be corrected through:

- reversal; and/or
- replacement / correcting transaction;

with explicit references to the original record.

## 3.3 Store facts; calculate states

If a value can be reconstructed reliably from authoritative facts, it should normally not be stored as independent mutable truth.

Examples of calculated values:

- current cash;
- quantity held;
- average cost;
- total cost;
- market value;
- realized P&L;
- unrealized P&L;
- portfolio weight;
- sector weight;
- NAV;
- cumulative return;
- DCA deployed amount;
- DCA carry-forward.

Snapshots or materialized outputs may later be stored for performance and audit purposes, but they must remain reproducible from source data and explicitly labeled as derived.

## 3.4 Separate data classes

Every field or entity should be understood as one of:

- **USER_ENTERED_RAW** — manually supplied portfolio facts or plans;
- **BROKER_RAW** — broker/exchange execution or cash facts;
- **MARKET_RAW** — prices, VN30 levels, constituent data;
- **REFERENCE_RAW** — ticker/company/sector master data;
- **CALCULATED** — deterministic result from raw data;
- **SNAPSHOT_DERIVED** — persisted calculated state as of a defined timestamp.

## 3.5 Time-aware market and reference data

Market and constituent data must never be treated as timeless.

Every market observation must carry an `as_of_timestamp` or `date` appropriate to its frequency.

VN30 membership must be represented as effective-dated history, not a mutable boolean alone.

## 3.6 Money units

All portfolio monetary amounts are denominated in VND unless explicitly stated otherwise.

Every monetary field in the physical schema must either:

- be named with `_vnd`; or
- be governed by an explicit `currency` field where multi-currency support is intentionally introduced.

For the current mandate, `base_currency = VND`.

## 3.7 Precision

Financial arithmetic must use fixed-precision decimal semantics, never binary floating-point as the accounting source of truth.

Share quantities are integers for ordinary listed shares in the current operating model, while the logical model should permit decimal quantities if a future corporate action produces fractional entitlements pending settlement.

---

# 4. Logical Architecture

The model is organized into six logical layers.

## Layer A — Reference Master

- `SecurityMaster`
- `SectorMaster`
- `VN30Membership`

## Layer B — Portfolio Identity and Planning

- `Portfolio`
- `DCAPlanPeriod`

## Layer C — Economic Ledger

- `Transaction` — immutable economic-event header
- `TransactionLeg` — immutable signed postings; authoritative for cash/security movements
- optional `TransactionLink` — semantic relation between related events

## Layer D — Market Data

- `SecurityPriceObservation`
- `BenchmarkObservation`

## Layer E — Derived Portfolio State

- `Position` — calculated view
- `CashBalance` — calculated view
- `PortfolioValuationSnapshot` — derived snapshot
- `SectorAllocation` — calculated view
- `PerformanceSeries` — calculated / derived analytics

## Layer F — Reconciliation / Event Detail

- `DividendEvent` — optional declaration/entitlement metadata
- `CorporateActionEvent` — required terms for non-trivial corporate actions
- `ReconciliationObservation` — optional broker statement/control observation

Economic cash/security impact always flows through `TransactionLeg`. Event-detail entities describe terms; they never directly mutate portfolio state. Reconciliation observations are evidence only and never overwrite ledger truth.

---

# 5. Logical Entity Relationship

```text
SectorMaster
    1 ───────< SecurityMaster
                  1 ───────< VN30Membership
                  1 ───────< SecurityPriceObservation
                  1 ───────< TransactionLeg >─────── 1 Transaction >─────── 1 Portfolio
                                      |                    |
                                      |                    +────── 0..1 CorporateActionEvent
                                      |                    +────── 0..1 DividendEvent
                                      |
                                      | derives
                                      v
                                  Position / CashBalance

Portfolio
    1 ───────< DCAPlanPeriod
    1 ───────< Transaction
    1 ───────< PortfolioValuationSnapshot
    1 ───────< ReconciliationObservation

BenchmarkObservation (VN30)
    + PortfolioValuationSnapshot
              |
              v
       PerformanceSeries / Benchmark Comparison
```

### Relationship rule

`Transaction` describes **what economic event happened**. `TransactionLeg` describes **what that event changed**. This separation removes the ambiguity of treating one row as both event and posting.

A calculated entity must not become a second authoritative accounting ledger. `Position`, `CashBalance`, `SectorAllocation`, unsettled-trade balances, and performance outputs are projections of immutable ledger/event facts plus market/reference data.

### Reconstruction boundary

For any as-of timestamp, holdings, settled cash, unsettled trade amounts, cost basis, realized P&L, and external flows must be reconstructable from:

1. posted `Transaction` headers;
2. posted `TransactionLeg` rows;
3. linked `CorporateActionEvent` terms where applicable; and
4. the versioned accounting/cost-basis policy.

Market prices are **not** needed to reconstruct accounting state; they are needed only to mark positions to market and compute NAV/unrealized P&L. Reference masters provide identity/classification, not accounting balances.

### Inception / migration rule

Reconstruction is only complete if the ledger starts from a known zero state or contains an explicit, auditable opening-state migration. If the portfolio existed before the system inception date, opening cash, quantity, and cost basis must be imported as dedicated `OPENING_BALANCE` transaction events with source evidence and migration method/version. Existing holdings require both a SECURITY_QUANTITY leg and a COST_BASIS_ADJUSTMENT leg for their verified opening open cost; opening cash requires a CASH leg. A manually typed Position snapshot is not an acceptable substitute.

---

# 6. Entity Definitions

# 6.1 Portfolio

## Purpose

Identifies a portfolio and stores only stable configuration / metadata.

## Source-of-truth fields

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `portfolio_id` | UUID/string | USER_ENTERED_RAW | Yes | Stable unique identifier. |
| `portfolio_name` | string | USER_ENTERED_RAW | Yes | Human-readable name. |
| `base_currency` | enum/string | USER_ENTERED_RAW | Yes | Must be `VND` under current policy. |
| `inception_date` | date | USER_ENTERED_RAW | Yes | Date portfolio accounting begins. |
| `status` | enum | USER_ENTERED_RAW | Yes | `ACTIVE`, `CLOSED`, `ARCHIVED`. |
| `created_at` | timestamp | SYSTEM_METADATA | Yes | Audit metadata. |
| `notes` | text | USER_ENTERED_RAW | No | Non-accounting notes only. |

## Requested fields that should be calculated

| Requested field | Store as source of truth? | Calculation |
|---|---:|---|
| `current_cash` | No | `settled_cash_vnd` derived from posted cash-type TransactionLegs through the as-of timestamp. |
| `total_invested_capital` | No | Net external capital contributed, with definition explicitly chosen; see §10. |
| `NAV` | No | Settled cash + securities market value + recognized receivables − recognized payables/liabilities. |
| `market_value` | No | Sum of position market values. |
| `realized_pnl` | No | Sum of realized security P&L less transaction expenses according to accounting rules. |
| `unrealized_pnl` | No | Current market value − open-position cost basis. |
| `dividend_income` | No | Sum of qualifying posted `DIVIDEND_CASH` events and linked cash/tax effects, with gross/net views explicitly defined. |

### Decision

The `Portfolio` entity is identity/configuration, **not a mutable summary row**.

A dashboard may expose the requested summary fields, but they are derived.

---

# 6.2 SecurityMaster

## Purpose

Canonical identity for listed securities. This prevents ticker/company/sector duplication across transactions, positions, and VN30 history.

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `security_id` | UUID/string | REFERENCE_RAW | Yes | Internal stable ID. |
| `ticker` | string | REFERENCE_RAW | Yes | Exchange ticker for display/search. |
| `company_name` | string | REFERENCE_RAW | Yes | Current canonical company name. |
| `exchange` | string | REFERENCE_RAW | Yes | Expected `HOSE` for VN30 universe. |
| `security_type` | enum | REFERENCE_RAW | Yes | Current scope normally `COMMON_STOCK`. |
| `sector_id` | FK | REFERENCE_RAW | Yes | Links to canonical sector. |
| `active_from` | date | REFERENCE_RAW | No | First effective date in master if known. |
| `active_to` | date | REFERENCE_RAW | No | Null while active. |
| `notes` | text | REFERENCE_RAW | No | Reference notes. |

### Ticker changes

`security_id`, not `ticker`, should be the durable identity.

If a company changes ticker, a future physical design may use a `SecurityIdentifierHistory` table. The portfolio ledger must not be broken by ticker renaming.

---

# 6.3 Position — Calculated View

## Purpose

Represents current or as-of ownership of one security in one portfolio.

It is **not manually edited** and is **not a source-of-truth entity**.

| Field | Class | Derivation |
|---|---|---|
| `portfolio_id` | CALCULATED key | Group transaction ledger by portfolio. |
| `security_id` | CALCULATED key | Group security-affecting transactions. |
| `ticker` | REFERENCE | Join `SecurityMaster`. |
| `company_name` | REFERENCE | Join `SecurityMaster`. |
| `sector` | REFERENCE | Join `SectorMaster` through effective/current mapping. |
| `quantity` | CALCULATED | Sum quantity deltas from posted transactions. |
| `average_cost_vnd_per_share` | CALCULATED | Moving weighted-average open cost basis under §9. |
| `total_cost_vnd` | CALCULATED | Remaining open cost basis. |
| `current_price_vnd` | MARKET_RAW reference | Latest acceptable observation at requested as-of timestamp. |
| `price_as_of_timestamp` | MARKET_RAW | Timestamp of price used. |
| `market_value_vnd` | CALCULATED | Quantity × current price. |
| `unrealized_pnl_vnd` | CALCULATED | Market value − total open cost. |
| `unrealized_pnl_pct` | CALCULATED | Unrealized P&L / open cost, when open cost > 0. |
| `portfolio_weight_pct` | CALCULATED | Position market value / portfolio NAV. |
| `first_purchase_date` | CALCULATED | Earliest BUY that contributes to ownership history; reporting definition must state whether reset after full exit. |
| `last_transaction_date` | CALCULATED | Latest security-affecting transaction. |
| `ownership_status` | CALCULATED | `OPEN`, `CLOSED`; may additionally expose `LEGACY_HOLDING` from membership logic. |
| `vn30_eligibility_status` | CALCULATED | Current membership derived from `VN30Membership`. |

### Zero positions

A fully sold security remains in transaction history but does not appear in the default `OpenPosition` view.

Historical position views must remain reproducible as of any supported date.

---

# 6.4 Transaction + TransactionLeg — Authoritative Economic Ledger

## 6.4.1 Design decision

The v1.0 design allowed a `Transaction` row to mean either an economic event or an accounting leg. That is unsafe because the same BUY/SELL, fee/tax, or corporate action can be represented twice.

Version 1.1 therefore uses two levels:

- `Transaction` = immutable event header;
- `TransactionLeg` = immutable signed posting generated/entered for that event.

**Only `TransactionLeg` changes portfolio balances.** Header summary fields must never independently change cash, quantity, or cost basis.

## 6.4.2 Transaction header

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `transaction_id` | UUID/string | RAW | Yes | Globally unique, immutable event ID. |
| `portfolio_id` | FK | RAW | Yes | Owning portfolio. |
| `transaction_type` | enum | RAW | Yes | Economic-event classification. |
| `trade_date` | date | RAW | Conditional | Required for BUY/SELL and market elections. |
| `settlement_date` | date | RAW | Conditional | Required when settlement is known/applicable. |
| `event_timestamp` | timestamp | RAW | Yes | Business-event timestamp; not a substitute for each leg's effective timestamp. |
| `security_id` | FK | RAW | Conditional | Primary security for simple events; complex events may use multiple securities in legs. |
| `execution_quantity` | decimal | RAW | Conditional | Positive absolute execution quantity for BUY/SELL; informational event fact. |
| `execution_price_vnd_per_share` | decimal | RAW | Conditional | Broker execution price. |
| `gross_trade_value_vnd` | decimal | RAW | Conditional | Absolute gross trade value before fees/taxes; must reconcile to quantity × price within tolerance. |
| `fee_vnd` | decimal | RAW | Yes default 0 | Event fact when attributable to this event. |
| `tax_vnd` | decimal | RAW | Yes default 0 | Event fact when attributable to this event. |
| `external_flow_class` | enum | RAW | Yes | `NONE`, `CONTRIBUTION`, `WITHDRAWAL`. |
| `source` | enum/string | RAW | Yes | USER/BROKER/IMPORT/SYSTEM_CORRECTION etc. |
| `source_reference` | string | RAW | No | Broker statement/order/import identifier; used for dedup/reconciliation. |
| `status` | enum | RAW | Yes | `PENDING`, `POSTED`. Once POSTED, the row is immutable and never changed to REVERSED. |
| `reverses_transaction_id` | FK | RAW | No | Correction linkage; reversal must negate original authoritative legs. |
| `corporate_action_event_id` | FK | RAW | Conditional | Required for non-trivial corporate-action events. |
| `dividend_event_id` | FK | RAW | No | Optional entitlement/announcement linkage. |
| `created_at` | timestamp | SYSTEM_METADATA | Yes | Audit metadata. |
| `entered_by` | string | SYSTEM_METADATA | No | Audit origin. |
| `notes` | text | RAW | No | Explain unusual entries/corrections. |

Header fields such as gross value, fee and tax are event facts used to validate postings and compute cost basis. They are **not additional cash postings**.

A posted original event remains `POSTED` forever. If it is reversed, that fact is derived from a later `REVERSAL` transaction whose `reverses_transaction_id` points to the original; the original row is not mutated.

## 6.4.3 TransactionLeg

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `transaction_leg_id` | UUID/string | RAW | Yes | Unique immutable posting ID. |
| `transaction_id` | FK | RAW | Yes | Parent event. |
| `leg_sequence` | integer | RAW | Yes | Stable deterministic ordering within event. |
| `leg_type` | enum | RAW | Yes | `SECURITY_QUANTITY`, `COST_BASIS_ADJUSTMENT`, `CASH`, `RECEIVABLE`, `PAYABLE`, `FEE_CASH`, `TAX_CASH`, `OTHER_CASH`. |
| `effective_timestamp` | timestamp | RAW | Yes | Timestamp at which this posting affects its balance. |
| `security_id` | FK | RAW | Conditional | Required for SECURITY_QUANTITY and COST_BASIS_ADJUSTMENT legs. |
| `quantity_delta` | decimal | RAW | Conditional | Signed; only for SECURITY_QUANTITY. |
| `amount_vnd` | decimal | RAW | Conditional | Signed asset/cash amount; positive increases cash/receivable, negative decreases. For PAYABLE use positive amount to represent a liability balance, with explicit account semantics. |
| `notes` | text | RAW | No | Posting explanation. |

### Mutually exclusive value rule

- `SECURITY_QUANTITY` leg: `quantity_delta` required, `amount_vnd = NULL`.
- `COST_BASIS_ADJUSTMENT` leg: `amount_vnd` required, `quantity_delta = NULL`; changes open cost only and has **no cash effect**.
- cash/receivable/payable/fee/tax money leg: `amount_vnd` required, `quantity_delta = NULL`.

No event may encode the same economic cash/quantity effect both in a header field and as multiple equivalent legs.

`COST_BASIS_ADJUSTMENT` is restricted to events where basis cannot be reconstructed from normal BUY/SELL event facts alone, principally `OPENING_BALANCE` migration and documented corporate-action basis reallocation. It must not be used to manually "fix" average cost or realized P&L.

## 6.4.4 Trade-date vs settlement-date accounting

To prevent cash/NAV distortion around settlement:

- security quantity and cost-basis recognition use the **trade-date effective timestamp**;
- settled cash changes on the **settlement-date effective timestamp**;
- between trade and settlement, the event must expose an unsettled `RECEIVABLE` (SELL) or `PAYABLE` (BUY) amount so NAV remains economically correct;
- on settlement, receivable/payable is reversed and settled cash is posted.

Therefore the model can report separately:

- `settled_cash_vnd`;
- `unsettled_receivables_vnd`;
- `unsettled_payables_vnd`;
- `available_to_trade_cash_vnd` when broker-specific availability rules are later introduced.

`current_cash_vnd` in portfolio UI should mean **settled cash** unless another label is explicitly shown.

## 6.4.5 Example posting patterns

**BUY**

- trade date: SECURITY_QUANTITY `+q`; PAYABLE `+net_purchase_obligation`;
- settlement date: CASH `-net_purchase_obligation`; PAYABLE `-net_purchase_obligation`.

**SELL**

- trade date: SECURITY_QUANTITY `-q`; RECEIVABLE `+net_sale_receivable`;
- settlement date: CASH `+net_sale_receivable`; RECEIVABLE `-net_sale_receivable`.

**CASH_DEPOSIT / WITHDRAWAL**

- one CASH leg; external-flow classification comes only from the parent `Transaction.external_flow_class`.

**DIVIDEND_CASH**

- baseline cash-basis model: one CASH leg on payment/receipt date; optional receivable lifecycle can be added through DividendEvent if accrual reporting is required.

### Trade fee/tax posting representation

For a BUY/SELL event choose exactly one posting representation:

- **net-settlement representation (recommended):** one settlement CASH leg already net of attributable fee/tax; header `fee_vnd`/`tax_vnd` are validation and cost-basis/P&L facts only; **or**
- **split-settlement representation:** gross trade CASH leg plus separate fee/tax cash legs whose sum equals the same net settlement amount.

The two representations are mutually exclusive for the same economic charge. A fee/tax amount may never be present as both a netted cash effect and an additional fee/tax posting.

## 6.4.6 Allowed transaction types

Minimum production set:

- `BUY`
- `SELL`
- `DIVIDEND_CASH`
- `CASH_DEPOSIT`
- `CASH_WITHDRAWAL`
- `FEE`
- `TAX`
- `CORPORATE_ACTION`
- `CASH_ADJUSTMENT`
- `OPENING_BALANCE` — migration/inception only, with evidence and explicit method version
- `REVERSAL`

Corporate-action subtype belongs in `CorporateActionEvent`, not in ad-hoc transaction names.

## 6.4.7 Deterministic ordering

If multiple effective postings share the same timestamp, official reconstruction order is:

1. `effective_timestamp`;
2. parent `event_timestamp`;
3. `transaction_id`;
4. `leg_sequence`.

The physical design should ideally assign an explicit monotonic `posting_sequence` for imported broker history. This prevents cost-basis results from depending on database row order.

---

# 6.5 Cash Ledger — Derived View, Not Separate Source of Truth

## Decision

A separate authoritative Cash Ledger is **not required** for current scope.

Creating a second cash ledger in parallel with Transactions would introduce reconciliation risk and violate single-source-of-truth design.

Instead define:

> `CashLedgerView = all POSTED TransactionLeg rows whose leg_type is CASH/FEE_CASH/TAX_CASH/OTHER_CASH`

This view naturally contains:

- DCA contributions;
- deposits;
- withdrawals;
- purchases;
- sale proceeds;
- dividends;
- fees;
- taxes;
- corporate-action cash effects.

## Calculated current cash

```text
settled_cash_vnd(as_of)
= SUM(amount_vnd)
  for all POSTED cash-type TransactionLegs
  with effective_timestamp <= as_of
```

Also derive `unsettled_receivables_vnd` and `unsettled_payables_vnd` from their respective posted legs. `available_to_trade_cash_vnd` is a broker/execution concept and may differ from settled cash; it must be separately named and never inferred without an explicit broker rule.

---

# 6.6 SectorMaster

## Purpose

Provides one controlled taxonomy for sector concentration, sector ranking, and allocation.

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `sector_id` | UUID/string | REFERENCE_RAW | Yes | Stable internal key. |
| `sector_code` | string | REFERENCE_RAW | Yes | Stable short code. |
| `sector_name` | string | REFERENCE_RAW | Yes | Canonical display name. |
| `taxonomy_name` | string | REFERENCE_RAW | Yes | E.g. project-defined VN30 taxonomy or selected standard. |
| `taxonomy_version` | string/date | REFERENCE_RAW | Yes | Prevent silent category drift. |
| `parent_sector_id` | FK | REFERENCE_RAW | No | Allows hierarchical grouping later without redesign. |
| `active_from` | date | REFERENCE_RAW | No | Effective-dating support. |
| `active_to` | date | REFERENCE_RAW | No | Null while active. |
| `notes` | text | REFERENCE_RAW | No | Mapping rationale/exceptions. |

## Key rule

A sector name must not be duplicated as free text inside Transactions or Position source data.

Sector exposure is calculated by joining Security → Sector and aggregating market value.

---

# 6.7 VN30Membership

## Purpose

Stores effective-dated VN30 constituent history.

This entity replaces the proposed design where `current_member` is an independently edited truth.

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `membership_id` | UUID/string | MARKET/REFERENCE_RAW | Yes | Unique membership period. |
| `security_id` | FK | MARKET/REFERENCE_RAW | Yes | Member security. |
| `index_code` | string | MARKET/REFERENCE_RAW | Yes | `VN30`. |
| `member_from` | date | MARKET/REFERENCE_RAW | Yes | Inclusive effective date. |
| `member_to` | date | MARKET/REFERENCE_RAW | No | Exclusive or inclusive convention must be fixed; this model recommends **exclusive**. Null while current. |
| `announcement_date` | date | MARKET/REFERENCE_RAW | No | Useful to distinguish announcement vs effective membership. |
| `source_reference` | string | MARKET/REFERENCE_RAW | No | Official source identifier/URL reference in implementation. |
| `recorded_at` | timestamp | SYSTEM_METADATA | Yes | Audit timestamp. |
| `notes` | text | MARKET/REFERENCE_RAW | No | Index event notes. |

## Calculated convenience fields

- `current_member = member_from <= as_of AND (member_to IS NULL OR as_of < member_to)`
- `entry_event = first/current membership start`
- `exit_event = member_to`

## Invariants

For the same `security_id` + `index_code`:

- membership periods must not overlap;
- membership date ranges must be valid;
- the current VN30 member set at a given effective date should contain 30 constituents when authoritative data is complete;
- if data is known incomplete, completeness must be flagged rather than fabricating members.

## Legacy Holding status

A security is a Legacy Holding when:

```text
position.quantity > 0
AND current VN30 membership = false
```

This status is derived and should not be manually toggled.

---

# 6.8 SecurityPriceObservation

## Purpose

Dated raw market prices for securities.

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `security_id` | FK | MARKET_RAW | Yes | Security identity. |
| `as_of_timestamp` | timestamp | MARKET_RAW | Yes | Market-time timestamp. |
| `price_type` | enum | MARKET_RAW | Yes | e.g. `CLOSE`, `LAST`, `ADJUSTED_CLOSE` if supported. |
| `price_vnd` | decimal | MARKET_RAW | Yes | Price in VND/share. |
| `source` | string | MARKET_RAW | Yes | Data provenance. |
| `received_at` | timestamp | SYSTEM_METADATA | Yes | When system acquired it. |
| `quality_status` | enum | MARKET_RAW | Yes | `VALID`, `STALE`, `SUSPECT`, `MISSING_REPLACEMENT`, etc. |

### Rule

A portfolio valuation must record which market-price timestamp or valuation policy it used.

No undated `current_price` field should be treated as durable data.

---

# 6.9 BenchmarkObservation

## Purpose

Stores raw VN30 benchmark levels independently from portfolio calculations.

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `benchmark_code` | string | MARKET_RAW | Yes | `VN30`. |
| `date` | date | MARKET_RAW | Yes | Observation date. |
| `index_level` | decimal | MARKET_RAW | Yes | Official/selected VN30 level. |
| `observation_type` | enum | MARKET_RAW | Yes | Normally `CLOSE`. |
| `source` | string | MARKET_RAW | Yes | Provenance. |
| `received_at` | timestamp | SYSTEM_METADATA | Yes | Audit freshness. |
| `quality_status` | enum | MARKET_RAW | Yes | Data-quality marker. |

## Why portfolio NAV does not belong here

The originally proposed Benchmark structure mixed:

- raw benchmark market data;
- portfolio derived data;
- calculated performance.

These have different owners and update cycles.

Therefore:

- VN30 index levels live in `BenchmarkObservation`;
- portfolio NAV lives in `PortfolioValuationSnapshot`;
- comparative cumulative returns live in a calculated `PerformanceSeries` / benchmark-comparison view.

---

# 6.10 PortfolioValuationSnapshot — Derived Snapshot

## Purpose

Stores a reproducible portfolio valuation as of a defined timestamp for reporting, drawdown, analytics, and audit.

This is derived data, not a second transaction source of truth.

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `snapshot_id` | UUID/string | SNAPSHOT_DERIVED | Yes | Unique snapshot. |
| `portfolio_id` | FK | SNAPSHOT_DERIVED | Yes | Portfolio. |
| `as_of_timestamp` | timestamp | SNAPSHOT_DERIVED | Yes | Valuation time. |
| `settled_cash_vnd` | decimal | SNAPSHOT_DERIVED | Yes | Derived settled cash from cash legs. |
| `unsettled_receivables_vnd` | decimal | SNAPSHOT_DERIVED | Yes default 0 | Derived posted trade receivables. |
| `unsettled_payables_vnd` | decimal | SNAPSHOT_DERIVED | Yes default 0 | Derived posted trade payables. |
| `securities_market_value_vnd` | decimal | SNAPSHOT_DERIVED | Yes | Sum of position market values. |
| `other_receivables_vnd` | decimal | SNAPSHOT_DERIVED | Yes default 0 | Non-trade receivables only; must exclude `unsettled_receivables_vnd`. |
| `other_liabilities_vnd` | decimal | SNAPSHOT_DERIVED | Yes default 0 | Non-trade liabilities only; must exclude `unsettled_payables_vnd`. |
| `nav_vnd` | decimal | SNAPSHOT_DERIVED | Yes | Settled cash + MV + unsettled receivables − unsettled payables + other receivables − other liabilities. |
| `net_external_flow_vnd_since_prior` | decimal | SNAPSHOT_DERIVED | Yes | Contributions less withdrawals between snapshots. |
| `unitized_nav_index` | decimal | SNAPSHOT_DERIVED | Recommended | Flow-adjusted performance index. |
| `high_water_mark_index` | decimal | SNAPSHOT_DERIVED | Recommended | Prior max of unitized index. |
| `drawdown_pct` | decimal | SNAPSHOT_DERIVED | Recommended | Flow-adjusted drawdown. |
| `valuation_method_version` | string | SNAPSHOT_DERIVED | Yes | Ensures reproducibility when rules evolve. |
| `calculated_at` | timestamp | SYSTEM_METADATA | Yes | Audit time. |
| `data_quality_status` | enum | SNAPSHOT_DERIVED | Yes | Complete/provisional/stale etc. |

## Snapshot policy

Snapshots are allowed because long-horizon performance analytics should not require re-running every historical valuation on every dashboard load.

However every snapshot must be reproducible from:

- Transaction + TransactionLeg ledger;
- linked CorporateActionEvent terms when required;
- reference data;
- market prices;
- valuation-method version.

---

# 6.11 Dividend

## Decision

**Dividend cash receipt is a Transaction.**

A separate mandatory Dividend accounting ledger is not needed.

Use `DIVIDEND_CASH` transactions for authoritative received income.

## Optional DividendEvent entity

A separate `DividendEvent` is justified only when the system later needs to track lifecycle metadata such as:

- ex-dividend date;
- record date;
- payment date;
- declared dividend per share;
- entitlement quantity;
- expected gross dividend;
- received gross/net amount;
- withholding/tax;
- reconciliation status.

This entity is informational/accrual metadata. The actual cash effect remains in `TransactionLeg` postings.

## Dividend income definition

The system must distinguish:

- `gross_dividend_income_vnd`;
- `dividend_tax_vnd` if separately identifiable;
- `net_dividend_cash_received_vnd`.

Do not use one ambiguous `dividend_income` field without defining gross vs net.

---

# 6.12 DCAPlanPeriod

## Purpose

Tracks monthly capital-planning intent separately from actual economic transactions.

A plan is not a transaction.

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `dca_plan_period_id` | UUID/string | USER_ENTERED_RAW | Yes | Unique month plan. |
| `portfolio_id` | FK | USER_ENTERED_RAW | Yes | Portfolio. |
| `period_month` | YYYY-MM/date | USER_ENTERED_RAW | Yes | Unique per portfolio/month under default policy. |
| `planned_contribution_vnd` | decimal | USER_ENTERED_RAW | Yes | Current policy default may be ~5,000,000 VND but should not be hard-coded into accounting logic. |
| `plan_status` | enum | USER_ENTERED_RAW | Yes | `PLANNED`, `PARTIAL`, `COMPLETED`, `SKIPPED`, `CLOSED`. |
| `notes` | text | USER_ENTERED_RAW | No | Rationale for deviations. |
| `created_at` | timestamp | SYSTEM_METADATA | Yes | Audit metadata. |

## Calculated DCA fields

| Requested field | Source | Calculation |
|---|---|---|
| `actual_contribution_vnd` | Transactions | Sum qualifying external `CASH_DEPOSIT` transactions assigned to period. |
| `deployed_amount_vnd` | Transactions | Capital deployed into BUY transactions under chosen deployment attribution policy. |
| `remaining_cash_vnd` | Portfolio ledger | Current/period ending cash; do not pretend all cash belongs uniquely to one DCA month unless allocation method exists. |
| `carry_forward_vnd` | Calculation | Undeployed cumulative planned/actual contribution according to explicit carry-forward definition. |

## Important modeling rule: avoid fake cash buckets

Cash is fungible.

The core accounting ledger should not tag every VND of current cash as belonging to a specific DCA month.

For planning analytics, define a virtual measure such as:

```text
cumulative_undeployed_contributions_vnd
= cumulative actual external contributions
  - cumulative net capital deployed into securities
  ± explicitly defined adjustments
```

If precise month-to-purchase attribution is later required for behavioral analysis, add a separate analytical allocation table rather than modifying the accounting truth.

## Minimum 100-share lot

The 100-share rule is an **execution constraint**, not a DCA accounting field.

It should be enforced later by the Buy/Hold/Sell/Execution layer using:

- available cash;
- proposed execution price;
- lot-size rule;
- concentration limits.

The data model must retain enough cash and price information to evaluate it.

---

# 7. Source-of-Truth Matrix

| Business question | Authoritative source | Derived output |
|---|---|---|
| What cash flows occurred? | `TransactionLeg` cash postings + parent `Transaction` classification | Cash Ledger View |
| Current settled cash? | `TransactionLeg` cash postings | `CashBalance` |
| Shares owned? | `TransactionLeg[SECURITY_QUANTITY]` | `Position.quantity` |
| Cost basis? | `Transaction` event facts + SECURITY_QUANTITY/COST_BASIS_ADJUSTMENT legs + CorporateAction terms + cost-basis policy | Position cost fields |
| Realized P&L? | `Transaction` event facts + security legs + cost-basis policy | Realized P&L view |
| Current security price? | `SecurityPriceObservation` | latest valid price selection |
| Position market value? | Position quantity + price | Position MV |
| Portfolio NAV? | Ledger + market prices | Valuation Snapshot |
| Sector mapping? | `SecurityMaster` → `SectorMaster` | Sector exposure |
| VN30 membership? | `VN30Membership` | current/historical eligibility |
| VN30 level? | `BenchmarkObservation` | benchmark return |
| Monthly DCA intent? | `DCAPlanPeriod` | plan variance |
| Actual contribution? | `Transaction[CASH_DEPOSIT]` + external cash leg | DCA actual |
| Dividend received? | `Transaction[DIVIDEND_CASH]` + cash leg | dividend analytics |
| Historical drawdown? | Valuation snapshots / unitized NAV | drawdown series |

---

# 8. Raw vs Calculated Field Policy

## 8.1 Raw fields should describe events, observations, or stable reference facts

Examples:

- execution quantity;
- execution price;
- fee;
- tax;
- cash deposit amount;
- dividend receipt;
- benchmark index level;
- market closing price;
- membership effective date;
- planned DCA contribution.

## 8.2 Calculated fields should describe current or analytical state

Examples:

- current_cash;
- total_invested_capital;
- quantity held;
- average cost;
- market value;
- realized P&L;
- unrealized P&L;
- portfolio weight;
- sector weight;
- NAV;
- cumulative returns;
- drawdown;
- DCA deployed / remaining / carry-forward.

## 8.3 Permitted persistence of calculated fields

Calculated fields may be persisted only as:

- cache;
- materialized view;
- reproducible daily/monthly snapshot;
- audit record tied to method/version and as-of timestamp.

They must not be independently editable as authoritative truth.

---

# 9. Cost Basis and Realized P&L Policy

## 9.1 Required deterministic method

The baseline method is **Moving Weighted Average Cost (MWAC)** per `portfolio_id + security_id`.

Cost basis is calculated from immutable event facts/postings and the versioned cost-basis policy. `average_cost`, `open_cost`, `cost_released`, and realized P&L are never manually entered ledger balances.

## 9.2 Capitalization policy

To prevent fee/tax double counting, each charge has exactly one accounting treatment.

For a normal BUY:

```text
acquisition_cost_vnd
= gross_trade_value_vnd
+ capitalized_buy_fee_vnd
+ capitalized_buy_tax_vnd
```

For a normal SELL:

```text
net_sale_proceeds_vnd
= gross_trade_value_vnd
- sell_fee_vnd
- sell_tax_vnd
```

The same fee/tax amount must not also be recognized as a second standalone expense if it is already embedded in these event facts and the corresponding cash obligation/receipt. Standalone FEE/TAX transactions are reserved for charges that cannot be attributed to a specific BUY/SELL event.

## 9.3 BUY

At the BUY trade-date posting:

```text
new_open_cost = prior_open_cost + acquisition_cost_vnd
new_quantity  = prior_quantity + bought_quantity
new_average_cost = new_open_cost / new_quantity
```

Settlement-date cash postings do not change cost basis again.

## 9.4 SELL

For sold quantity `q` at the SELL trade-date posting:

```text
cost_released_vnd = q × average_cost_before_sale
realized_pnl_vnd  = net_sale_proceeds_vnd - cost_released_vnd
remaining_open_cost = prior_open_cost - cost_released_vnd
```

The average cost of remaining shares is unchanged by a normal partial SELL. Settlement later changes settled cash/receivable only; it must not realize P&L a second time.

## 9.5 Full exit and re-entry

When quantity becomes zero:

- open cost becomes exactly zero within monetary tolerance;
- no residual average cost remains;
- cumulative realized P&L remains reportable;
- a later BUY starts a new open-position cycle, while lifetime transaction history remains continuous.

`first_purchase_date` should therefore have two explicit reporting variants if needed: `lifetime_first_purchase_date` and `current_cycle_first_purchase_date`.

## 9.6 Corporate-action cost-basis policy

A corporate action may alter quantity without cash, alter cash without quantity, or move cost basis between securities. It must never be implemented by editing Position fields. When basis must be transferred/reallocated and cannot be derived solely from ordinary trade facts, use explicit `COST_BASIS_ADJUSTMENT` legs linked to the corporate-action event.

`CorporateActionEvent` is **required** whenever deterministic reconstruction needs terms beyond simple signed legs. Minimum fields should support:

- `corporate_action_event_id`;
- `action_type` (`SPLIT`, `REVERSE_SPLIT`, `STOCK_DIVIDEND`, `RIGHTS_ISSUE`, `RIGHTS_SUBSCRIPTION`, `MERGER`, `SPINOFF`, `TENDER`, `CASH_IN_LIEU`, `OTHER`);
- `effective_date`;
- source security and, when relevant, destination security;
- ratio numerator/denominator or entitlement ratio;
- cash subscription/consideration per share when applicable;
- explicit cost-basis allocation rule/percentage when basis moves across securities;
- official source/provenance;
- method/version and notes.

Baseline treatment examples:

- **Split/reverse split:** quantity changes by documented ratio; total open cost unchanged; average cost adjusts inversely.
- **Stock dividend/bonus shares:** credited quantity follows official entitlement. Cost-basis treatment must follow the project's documented accounting/tax policy; do not assume zero-cost or proportional reallocation without that policy.
- **Rights subscription:** newly acquired shares add subscription cash plus attributable fees to open cost. Rights not exercised do not create fictitious shares/cost.
- **Merger/spinoff:** quantity and basis can move from one `security_id` to another only through documented allocation terms; basis transfer is represented by offsetting COST_BASIS_ADJUSTMENT legs so total transferred basis reconciles.
- **Cash in lieu/fractional settlement:** explicit cash leg plus documented reduction/realization rule.

If required corporate-action terms are missing, cost basis becomes `RECONCILIATION_ERROR` / `MISSING_CORPORATE_ACTION_TERMS`; the system must not guess.

## 9.7 Corrections and reversal

A reversal transaction must negate the original authoritative postings and reference the original event. The original event remains `POSTED`; a derived `is_reversed` view may indicate that a valid reversal exists. A correcting replacement is then posted as a new event. Cost-basis reconstruction processes reversal/replacement in deterministic effective order; historical rows are never overwritten.

---

# 10. Capital, NAV, and Performance Definitions

Ambiguous portfolio terms must be defined before implementation.

## 10.1 External capital contributed

```text
cumulative_contributions_vnd
= SUM(positive external CASH_DEPOSIT flows)
```

## 10.2 External capital withdrawn

```text
cumulative_withdrawals_vnd
= ABS(SUM(negative external CASH_WITHDRAWAL flows))
```

## 10.3 Net contributed capital

```text
net_contributed_capital_vnd
= cumulative_contributions_vnd
- cumulative_withdrawals_vnd
```

This is the recommended meaning of the requested `total_invested_capital` if that label is retained in UI.

For clarity, the data model should expose `net_contributed_capital_vnd` instead of an ambiguous stored `total_invested_capital` field.

## 10.4 Portfolio NAV

At time `t`:

```text
NAV_vnd(t)
= settled_cash_vnd(t)
+ Σ position_market_value_vnd(t)
+ unsettled_receivables_vnd(t)
- unsettled_payables_vnd(t)
+ other_recognized_assets_vnd(t)
- other_recognized_liabilities_vnd(t)
```

No margin borrowing is allowed by policy, but the formula remains explicit so accounting adjustments cannot be mistaken for equity value.

## 10.5 Unrealized P&L

```text
unrealized_pnl_vnd(t)
= Σ [position_market_value_vnd(t) - open_cost_vnd(t)]
```

## 10.6 Realized P&L

Realized P&L must be computed from closed/reduced quantities under §9.

It must not be inferred from cash balance.

## 10.7 Dividend income

Dividend income is reported separately from realized trading P&L while also contributing to total return.

## 10.8 Total economic P&L reconciliation

At a compatible valuation time, a reconciliation should be possible conceptually:

```text
NAV
- net_contributed_capital
≈ cumulative realized trading P&L
+ unrealized P&L
+ net dividend income
- non-capitalized fees/taxes/other expenses
+ other corporate-action economics
```

Exact presentation depends on fee/corporate-action classification, but the system must be reconcilable.

## 10.9 Portfolio return

Simple NAV change is invalid when external DCA flows exist.

Official performance and drawdown must use a cash-flow-adjusted methodology, preferably **unitized NAV / Time-Weighted Return (TWR)** for portfolio-management evaluation.

Money-Weighted Return / XIRR may later be added as an investor-experience metric, but it must not replace TWR for comparing portfolio management versus VN30.

---

# 11. Benchmark Comparison Model

## 11.1 Raw benchmark return

For comparable dates:

```text
VN30_cumulative_return(t)
= VN30_level(t) / VN30_level(base_date) - 1
```

If total-return benchmark data becomes available, the system should clearly distinguish:

- price index return; and
- total return including dividends.

Comparing a dividend-inclusive portfolio total return against a price-only VN30 index creates benchmark bias and must be flagged.

## 11.2 Portfolio cumulative return

Portfolio cumulative return must be derived from the unitized/TWR series, not from:

```text
current_NAV / initial_NAV - 1
```

when external contributions or withdrawals occurred.

## 11.3 Comparison output

A future benchmark-comparison view may expose:

| Field | Source |
|---|---|
| `date` | common valuation date |
| `portfolio_nav_vnd` | snapshot |
| `portfolio_unitized_index` | snapshot/calculation |
| `portfolio_cumulative_return_pct` | calculated |
| `vn30_index_level` | benchmark raw |
| `vn30_cumulative_return_pct` | calculated |
| `active_return_pct` | portfolio return − comparable benchmark return |
| `data_quality_status` | calculated from both series |

This view must not become a raw-data table.

---

# 12. Important Invariants

The following invariants are mandatory implementation rules.

## 12.1 Ledger invariants

1. Every posted event has a unique immutable `transaction_id`; every posting has a unique immutable `transaction_leg_id`.
2. Posted events/legs are never silently modified or deleted. Corrections use reversal + replacement.
3. **Only TransactionLeg postings change accounting balances.** Header amounts are validation/event facts, not additional postings.
4. Only legs belonging to a POSTED parent event enter official state; legs do not own an independent lifecycle status.
5. Each economic effect is represented exactly once: no duplicated cash, quantity, fee, tax, dividend, or corporate-action posting.
6. Quantity and money fields on a leg are mutually exclusive according to leg type.
7. Security quantity must never become negative in official long-only reconstruction; a SELL cannot exceed holdings effective immediately before that leg.
8. BUY/SELL execution quantity × execution price must reconcile to gross trade value within defined decimal tolerance.
9. Net trade cash obligation/receivable must reconcile to gross value ± attributable fee/tax according to the documented capitalization/expense policy.
10. A trade must use either net-settlement cash posting or split gross+fee/tax postings, never both for the same charge.
11. `Transaction.external_flow_class` is the single authoritative external-flow classification. Only CASH_DEPOSIT/CASH_WITHDRAWAL owner-capital events may be CONTRIBUTION/WITHDRAWAL; BUY, SELL, dividend, fee, tax, and corporate actions must be NONE.
12. Trade-date security postings and settlement-date cash postings must not cause duplicate P&L recognition.
13. Posted receivable/payable balances must reverse to zero when the linked trade settles, except an explicitly unresolved settlement exception.
14. Events with identical timestamps must have deterministic reconstruction order; database row order is never an accounting rule.
15. A REVERSAL transaction must exactly negate the authoritative postings of the original event it references; the original event remains immutable and POSTED.
16. Reconstruction must begin from zero state or auditable OPENING_BALANCE events; derived Position/Cash snapshots cannot serve as hidden opening truth.
17. COST_BASIS_ADJUSTMENT legs are prohibited for normal BUY/SELL bookkeeping and may only represent verified opening basis or documented corporate-action basis changes.
18. For basis-transfer corporate actions, source and destination basis adjustments must reconcile to the documented total transferred basis, subject only to explicit realized/cash-in-lieu treatment.

## 12.2 Portfolio invariants

1. `base_currency = VND` under current policy.
2. Official settled cash is derived only from posted cash-type TransactionLeg amounts.
3. Official position quantity is derived only from posted SECURITY_QUANTITY legs.
4. Open cost basis cannot be negative.
5. Quantity = 0 implies open cost = 0 after reconciliation tolerance.
6. NAV must reconcile to settled cash + marked securities + unsettled/other receivables − unsettled/other payables/liabilities.
7. Position weights must use the same NAV timestamp as position market values.
8. Sector weights must be calculated from position market values using one taxonomy/version.
9. Total open-position weight + settled cash weight + net unsettled/other NAV components should reconcile to 100% within rounding tolerance.

## 12.3 Market-data invariants

1. Every price used for valuation has an explicit `as_of_timestamp` and source.
2. No stale/suspect price may be silently presented as current.
3. Benchmark observations require explicit date/source.
4. Portfolio/benchmark comparison must use compatible dates and disclosed return definitions.

## 12.4 VN30 invariants

1. VN30 membership periods for the same security cannot overlap.
2. Current membership is derived from effective dates, not independently edited.
3. New purchases require current VN30 eligibility; the model must expose this state.
4. A held security removed from VN30 remains in portfolio history and is derivable as `LEGACY_HOLDING`.
5. Historical constituent changes must never rewrite old membership periods.

## 12.5 DCA invariants

1. Planned contribution is not treated as cash until an actual `CASH_DEPOSIT` posts.
2. DCA non-deployment is valid and must not create a data exception.
3. Cash carried forward is calculated, not fabricated as a broker cash event.
4. The accounting model does not force one-to-one attribution of fungible cash to a DCA month.

## 12.6 Risk/performance invariants

1. External contributions and withdrawals are excluded from investment return and drawdown performance effects.
2. Drawdown uses cash-flow-adjusted/unitized performance, not raw NAV high-water marks.
3. Realized P&L, unrealized P&L, dividend income, fees, and external flows remain distinguishable.
4. Historical values are always tied to an `as_of` date/timestamp and method version when calculated.

# 12.7 Cash and broker reconciliation controls

`ReconciliationObservation` may store broker-reported controls such as settled cash, holdings, or statement NAV at a statement timestamp. It is **not** an accounting source of truth and must never overwrite ledger-derived balances.

Minimum fields:

- `reconciliation_observation_id`;
- `portfolio_id`;
- `as_of_timestamp`;
- `observation_type` (`BROKER_SETTLED_CASH`, `BROKER_SECURITY_QUANTITY`, `BROKER_NAV`, etc.);
- optional `security_id`;
- observed amount/quantity;
- source/reference;
- received_at;
- reconciliation_status.

Reconciliation rule:

```text
difference = broker_observed_value - ledger_derived_value
```

A non-zero difference creates a reconciliation exception. Resolution requires locating missing/duplicate/incorrect source events and posting a reversal/correction/adjustment transaction with provenance. **Never force the calculated cash balance to equal the broker statement by editing a snapshot.**

Daily or statement-period controls should also verify:

- opening settled cash + posted cash legs = closing settled cash;
- prior quantity + posted quantity legs = closing quantity per security;
- no stale unmatched receivable/payable remains beyond expected settlement;
- every source_reference expected to be unique is not duplicated.

---

# 13. Data Quality and Missing Data Rules

## 13.1 Never infer missing raw facts

If any of the following is unknown, store it as unknown/null with a quality flag where applicable:

- exact price;
- fee;
- tax;
- transaction date;
- settlement date;
- VN30 effective date;
- sector mapping;
- benchmark level.

Do not substitute guessed values merely to make calculations complete.

## 13.2 Calculation readiness

Derived outputs should expose status, for example:

- `VALID`
- `PROVISIONAL`
- `STALE_MARKET_DATA`
- `MISSING_TRANSACTION_DATA`
- `MISSING_PRICE`
- `RECONCILIATION_ERROR`

## 13.3 As-of discipline

A calculated state is invalid unless the system can identify:

- portfolio `as_of_timestamp`;
- market-price timestamps;
- transaction cut-off;
- method/version where material.

---

# 14. Design Risks and Mitigations

## Risk 0A — Event/posting ambiguity and double counting

**Problem:** Treating a Transaction row as both event and posting allows the same BUY/SELL, fee/tax, or corporate action to hit balances more than once.

**Mitigation:** Transaction header + authoritative TransactionLeg postings. Only legs mutate balances.

**Severity if ignored:** Critical.

## Risk 0B — Trade/settlement timing distorts cash and NAV

**Problem:** Applying both security and cash effects on one generic effective date can over/understate NAV and available cash between trade and settlement.

**Mitigation:** per-leg effective timestamps plus unsettled receivable/payable representation.

**Severity if ignored:** Critical.

## Risk 0C — Broker reconciliation becomes a second truth

**Problem:** Overwriting ledger cash/holdings to match a statement hides missing or duplicated transactions.

**Mitigation:** ReconciliationObservation is evidence only; differences are fixed through ledger corrections.

**Severity if ignored:** Major.

## Risk 1 — Duplicating current portfolio summary fields

**Problem:** Storing `current_cash`, `NAV`, `average_cost`, `market_value`, and P&L as manually updated columns creates drift from transactions.

**Mitigation:** Treat them as calculated views/snapshots only.

**Severity if ignored:** Critical.

## Risk 2 — Two independent cash ledgers

**Problem:** Separate Transaction and Cash Ledger sources can disagree.

**Mitigation:** Transaction is source of truth; Cash Ledger is a filtered projection.

**Severity if ignored:** Critical.

## Risk 3 — Mixing benchmark and portfolio facts

**Problem:** A Benchmark table containing VN30 levels plus portfolio NAV/cumulative returns mixes raw external data and internal derived data.

**Mitigation:** Separate `BenchmarkObservation`, `PortfolioValuationSnapshot`, and comparison view.

**Severity if ignored:** Major.

## Risk 4 — Mutable `current_member` flag without history

**Problem:** Cannot correctly know eligibility or Legacy Holding status at historical dates.

**Mitigation:** Effective-dated `VN30Membership`; derive current status.

**Severity if ignored:** Critical.

## Risk 5 — Ticker as primary identity

**Problem:** Ticker/company changes can break historical joins.

**Mitigation:** Stable `security_id`; ticker is an identifier attribute.

**Severity if ignored:** Major.

## Risk 6 — Ambiguous `total_invested_capital`

**Problem:** Could mean gross deposits, net deposits, cost of current holdings, or cumulative purchase value.

**Mitigation:** Use explicit metrics: `cumulative_contributions`, `cumulative_withdrawals`, `net_contributed_capital`, `open_cost_basis`.

**Severity if ignored:** Major.

## Risk 7 — Dividend double counting

**Problem:** Dividend entity plus transaction may independently affect cash/income.

**Mitigation:** DividendEvent is metadata only; cash receipt is authoritative Transaction.

**Severity if ignored:** Major.

## Risk 8 — Corporate actions corrupt cost basis

**Problem:** Manual changes to quantity/average cost destroy auditability.

**Mitigation:** Event metadata + explicit ledger legs + deterministic cost-basis rules.

**Severity if ignored:** Major.

## Risk 9 — Raw NAV used for drawdown after DCA

**Problem:** External contributions can falsely reset high-water marks or appear as investment performance.

**Mitigation:** Unitized/TWR performance series and flow-adjusted drawdown.

**Severity if ignored:** Critical because it can mis-trigger Risk Policy.

## Risk 10 — Benchmark mismatch

**Problem:** Portfolio total return including dividends may be compared with VN30 price return excluding dividends.

**Mitigation:** Label benchmark methodology; prefer total-return benchmark when available; flag mismatches.

**Severity if ignored:** Major.

## Risk 11 — Over-modeling tax lots too early

**Problem:** Lot-level accounting increases complexity without current requirement.

**Mitigation:** MWAC baseline; preserve transaction-level detail so tax-lot model can be introduced later if genuinely needed.

**Severity if ignored:** Minor to Major depending on implementation.

## Risk 12 — DCA cash attribution illusion

**Problem:** Treating each month's carry-forward as a separate physical cash bucket creates false precision.

**Mitigation:** Separate plan analytics from fungible accounting cash.

**Severity if ignored:** Major for planning analytics.

---

# 15. Final Proposed Schema

The production-ready logical schema for Milestone 2 is:

## 15.1 Authoritative / raw entities

### `Portfolio`
Stable portfolio identity and configuration.

### `SecurityMaster`
Stable security identity, ticker, company, exchange, sector relation.

### `SectorMaster`
Canonical sector taxonomy.

### `VN30Membership`
Effective-dated constituent history.

### `Transaction`
Immutable economic-event header and classification/provenance source.

### `TransactionLeg`
Immutable signed postings and the sole authoritative source for cash/security balance changes.

### `SecurityPriceObservation`
Timestamped security market prices.

### `BenchmarkObservation`
Dated VN30 levels.

### `DCAPlanPeriod`
Monthly capital-planning intent.

## 15.2 Optional event metadata entities

### `DividendEvent`
Optional declaration/entitlement/reconciliation metadata; not cash truth.

### `CorporateActionEvent`
Required authoritative terms for non-trivial corporate actions; actual cash/security effects recorded through TransactionLeg postings.

### `ReconciliationObservation`
Optional broker/control evidence used to detect differences; never a balance source of truth.

## 15.3 Derived views / snapshots

### `Position`
Current or historical holdings, cost basis, market value, P&L, weight.

### `CashLedgerView`
Filtered transaction projection for all cash movements.

### `CashBalance`
Derived as-of cash.

### `SectorAllocation`
Derived sector market value and weight.

### `PortfolioValuationSnapshot`
Reproducible as-of NAV/unitized NAV/drawdown snapshot.

### `PerformanceSeries`
Portfolio cumulative TWR/unitized return, VN30 cumulative return, active return.

### `DCAAnalytics`
Planned vs actual contribution, deployment, and carry-forward analytics.

---

# 16. Mapping to Requested Deliverables

The proposed `02_DATABASE/` structure remains good, with one refinement: keep `DATA_MODEL.md` as the parent contract and put detailed entity rules in focused child documents.

```text
02_DATABASE/
├── DATA_MODEL.md          # logical architecture, ownership, invariants, ER model
├── PORTFOLIO.md           # portfolio, positions, NAV, cost basis, P&L, snapshots
├── TRANSACTIONS.md        # immutable ledger, signs, event types, corrections
├── VN30_MASTER.md         # SecurityMaster + VN30Membership lifecycle
├── SECTOR_MASTER.md       # taxonomy and sector mapping governance
├── BENCHMARK.md           # VN30 observations, TWR comparison, benchmark methodology
└── DATA_RULES.md          # validation, precision, data quality, reconciliation
```

### Why no separate `CASH_LEDGER.md` by default?

Because the cash ledger is a projection of `TransactionLeg` cash postings. A separate source would duplicate truth.

Cash-specific presentation and reconciliation rules can live in `TRANSACTIONS.md` and `PORTFOLIO.md`.

### Why no mandatory `DIVIDEND.md` by default?

Because cash dividends are transaction events whose cash impact is posted through `TransactionLeg`. A standalone DividendEvent becomes necessary only when declaration/entitlement/accrual tracking is implemented.

### Why no standalone `DCA_PLAN.md` yet?

DCA is important but small enough to define in `PORTFOLIO.md` initially. Split it later only if planning workflows become complex.

---

# 17. Future Compatibility

This model is intentionally minimal but preserves extension points for later milestones.

## VN30 Scoring Engine

Uses:

- `SecurityMaster`;
- `SectorMaster`;
- `VN30Membership`;
- market as-of conventions.

Fundamental/scoring inputs can be added independently without contaminating portfolio accounting.

## Buy / Hold / Sell Engine

Uses:

- current VN30 eligibility;
- current position;
- available cash;
- NAV;
- concentration;
- transaction history;
- market price timestamp;
- DCA plan context.

## Portfolio Review / Risk Management

Uses:

- valuation snapshots;
- drawdown;
- position/sector weights;
- cash;
- Legacy Holding status;
- historical transactions.

## Dashboard

Consumes derived views/snapshots rather than mutating ledger summaries.

## Investment Journal

Can later reference:

- `transaction_id`;
- `security_id`;
- portfolio snapshot;
- decision record;
- market-data as-of timestamp.

## Performance Analytics

Can calculate:

- TWR;
- XIRR/MWR;
- realized/unrealized return;
- income contribution;
- active return vs VN30;
- drawdown;
- turnover;
- capital deployment efficiency.

---

# 18. Review — Portfolio Manager

## Findings

### PM-1 — Critical: raw NAV would violate DCA-adjusted performance logic

**Resolution:** NAV is derived; official performance uses unitized/TWR methodology. External contributions are explicitly flagged.

**Status:** Resolved.

### PM-2 — Major: `total_invested_capital` was ambiguous

**Resolution:** replaced operationally by explicit contribution/withdrawal/net-capital metrics.

**Status:** Resolved.

### PM-3 — Major: DCA plan could accidentally force deployment accounting

**Resolution:** plan and actual economic flows are separated. Undeployed cash is valid.

**Status:** Resolved.

### PM-4 — Major: benchmark comparison could be biased by external cash flow and dividends

**Resolution:** use TWR/unitized portfolio returns and disclose price-index vs total-return benchmark basis.

**Status:** Resolved.

### PM-5 — Major: Legacy Holding state must survive VN30 removal

**Resolution:** effective-dated membership plus current open position derives Legacy Holding state.

**Status:** Resolved.

**Portfolio Manager verdict:** No unresolved Critical or Major issues.

---

# 19. Review — Data Architect

## Findings

### DA-1 — Critical: duplicate source of truth between Transactions and Cash Ledger

**Resolution:** Cash Ledger is a view only.

**Status:** Resolved.

### DA-2 — Critical: mutable portfolio summary fields would drift

**Resolution:** summary state becomes derived projections/snapshots.

**Status:** Resolved.

### DA-3 — Major: ticker is not safe as durable primary key

**Resolution:** introduced `security_id`.

**Status:** Resolved.

### DA-4 — Major: raw, reference, market, and derived data were mixed

**Resolution:** explicit six-layer architecture and source-of-truth matrix.

**Status:** Resolved.

### DA-5 — Major: transaction correction semantics were unspecified

**Resolution:** logical immutability, status, reversal linkage, and no silent edits.

**Status:** Resolved.

### DA-6 — Major: calculated historical values lacked reproducibility metadata

**Resolution:** valuation snapshot includes as-of, method version, calculation time, quality status.

**Status:** Resolved.

### DA-7 — Minor: future ticker-history requirement not fully normalized

**Resolution:** stable `security_id` prevents current architectural lock-in; dedicated identifier history is deferred until needed.

**Status:** Accepted deferred extension; no production blocker.

**Data Architect verdict:** No unresolved Critical or Major issues.

---

# 20. Review — Risk Manager

## Findings

### RM-1 — Critical: raw NAV drawdown would conflict with Risk Policy

**Resolution:** external-flow-adjusted unitized NAV and drawdown are explicit requirements.

**Status:** Resolved.

### RM-2 — Critical: stale market prices could produce incorrect concentration/drawdown states

**Resolution:** all price inputs are timestamped and quality-statused; snapshots carry data-quality status.

**Status:** Resolved.

### RM-3 — Major: sector taxonomy drift could invalidate concentration history

**Resolution:** sector taxonomy has version/effective dates.

**Status:** Resolved.

### RM-4 — Major: missing VN30 membership history could allow ineligible adds

**Resolution:** effective-dated constituent history is authoritative; current eligibility derived.

**Status:** Resolved.

### RM-5 — Major: corporate actions could create false losses/concentration

**Resolution:** explicit corporate-action event linkage and ledger effects; no manual position edits.

**Status:** Resolved.

### RM-6 — Major: negative holdings / oversell data could silently corrupt risk measures

**Resolution:** long-only quantity invariants prohibit official negative positions.

**Status:** Resolved.

### RM-7 — Minor: benchmark total-return data availability may be limited

**Resolution:** benchmark method mismatch must be disclosed; price-return benchmark may be used only with explicit limitation until a comparable total-return series exists.

**Status:** Accepted data-availability limitation; no schema blocker.

**Risk Manager verdict:** No unresolved Critical or Major issues.

---

# 20A. Focused v1.1 Audit — Portfolio Manager / Data Architect / Risk Manager

## Critical findings discovered in v1.0

### V11-C1 — Transaction could mean event or leg

**Failure mode:** duplicate BUY/SELL cash, fee/tax, dividend, or corporate-action effects.

**Fix:** split immutable `Transaction` header from authoritative `TransactionLeg`; only legs mutate balances.

**Status:** Resolved.

### V11-C2 — Trade-date vs settlement-date cash was not deterministic

**Failure mode:** cash and NAV could be wrong between execution and settlement, undermining concentration and drawdown controls.

**Fix:** per-leg effective timestamps and explicit unsettled receivable/payable balances.

**Status:** Resolved.

## Major findings discovered in v1.0

### V11-M1 — CorporateActionEvent was optional even when cost basis depended on action terms

**Fix:** event terms are mandatory for non-trivial actions; missing terms invalidate cost-basis reconstruction rather than being guessed.

**Status:** Resolved.

### V11-M2 — Cash reconciliation process was underspecified

**Fix:** added `ReconciliationObservation` as non-authoritative broker evidence and explicit exception/correction workflow.

**Status:** Resolved.

### V11-M3 — Same-timestamp transaction ordering could make MWAC non-deterministic

**Fix:** deterministic ordering rule and recommendation for explicit posting sequence.

**Status:** Resolved.

### V11-M4 — Header cash/gross/fee/tax fields could conflict with posting amounts

**Fix:** header fields are validation/event facts only; posting effects exist only once in legs; reconciliation invariants added.

**Status:** Resolved.

### V11-M5 — Snapshot had generic receivable/liability fields overlapping unsettled trade balances

**Failure mode:** the same unsettled sale/buy amount could be counted twice in NAV.

**Fix:** renamed generic fields to `other_receivables_vnd` / `other_liabilities_vnd` and explicitly exclude unsettled trade balances.

**Status:** Resolved.

### V11-M6 — External-flow classification existed at both event and posting level

**Failure mode:** contribution/withdrawal classification could disagree and corrupt TWR/drawdown.

**Fix:** parent `Transaction.external_flow_class` is the single authoritative classification; legs contain effects only.

**Status:** Resolved.

### V11-M7 — Opening state was not explicitly reconstructable

**Failure mode:** a migrated portfolio could appear reconstructable while secretly depending on a manually entered Position/cash snapshot.

**Fix:** require zero-state inception or auditable `OPENING_BALANCE` events with evidence/method version.

**Status:** Resolved.

### V11-M8 — REVERSED status would mutate posted history

**Failure mode:** changing an original transaction/leg from POSTED to REVERSED violates logical immutability and makes historical audit semantics ambiguous.

**Fix:** original event remains POSTED permanently; reversal is a new REVERSAL event with exact opposite legs and an immutable reference to the original. `is_reversed` is derived.

**Status:** Resolved.

### V11-M9 — Opening/migrated holdings had quantity but no authoritative opening cost basis posting

**Failure mode:** portfolio quantity could reconstruct while average cost/realized P&L secretly depended on a manually seeded Position value.

**Fix:** added restricted `COST_BASIS_ADJUSTMENT` legs for verified OPENING_BALANCE basis and corporate-action basis transfers. Normal BUY/SELL cost remains policy-derived, preventing manual cost-basis edits.

**Status:** Resolved.

## Residual Minor / deferred items

1. Dedicated `SecurityIdentifierHistory` remains deferred; stable `security_id` prevents ledger breakage meanwhile.
2. Historical sector reclassification may eventually justify an effective-dated Security→Sector mapping table; this does not affect accounting reconstruction.
3. Broker-specific `available_to_trade_cash` rules remain implementation-specific and must not be conflated with settled cash.
4. Vietnam-specific tax/accounting treatment for bonus shares and special corporate actions must be codified in `DATA_RULES.md` before those event types are processed automatically.

**Focused audit verdict:** 0 unresolved Critical; 0 unresolved Major.

---

# 20B. Required Reconstruction Acceptance Scenarios

Before physical implementation is considered valid, replay from authoritative history must pass all of the following scenarios without reading mutable Position/Cash summary state:

| Scenario | Required reconstructed result |
|---|---|
| Zero-state + cash deposit | settled cash and net contributed capital reconcile exactly |
| Single BUY before settlement | quantity/open cost recognized; payable outstanding; settled cash unchanged until settlement |
| BUY settlement | payable returns to zero; settled cash decreases once; cost basis unchanged at settlement |
| Multiple BUYs | MWAC/open cost deterministic in posting order |
| Partial SELL before settlement | quantity/open cost reduced; realized P&L recognized once; receivable outstanding |
| SELL settlement | receivable returns to zero; settled cash increases once; no second realized P&L |
| Full exit | quantity = 0 and open cost = 0; cumulative realized P&L preserved |
| Re-entry after full exit | new open-position cycle starts without erasing lifetime history |
| Dividend | dividend income and cash/tax reconcile without affecting security cost basis unless policy explicitly says otherwise |
| Fee/tax | net-settlement vs split-settlement representation produces identical economics and cannot coexist for same charge |
| Reversal + replacement | original remains immutable; reversal neutralizes it; replacement produces corrected state |
| Opening migration | opening cash, quantity, and verified cost basis replay from OPENING_BALANCE legs only |
| Split/reverse split | quantity changes by ratio; total open cost preserved unless documented terms say otherwise |
| Basis-transfer corporate action | source/destination quantity and basis reconcile to documented action terms |
| Cash reconciliation mismatch | broker observation creates exception only; no snapshot/position value is overwritten |
| Same-timestamp events | repeated replay produces identical holdings, cash, cost basis, and realized P&L |

Any implementation failing one of these accounting scenarios is **not production-ready**, even if dashboard totals happen to match at one point in time.

---

# 21. Production-Readiness Assessment

| Dimension | Assessment |
|---|---|
| Single source of truth | PASS |
| Transaction immutability | PASS — header + postings |
| Portfolio reconstruction | PASS — deterministic ledger/event replay |
| Cash reconstruction | PASS — settled + unsettled reconciliation |
| Cost-basis determinism | PASS — MWAC + explicit opening/action basis adjustments |
| Realized/unrealized P&L support | PASS |
| Dividend support | PASS |
| DCA optional-deployment support | PASS |
| VN30 membership history | PASS |
| Legacy Holding support | PASS |
| Sector concentration support | PASS |
| Benchmark support | PASS |
| Flow-adjusted NAV/drawdown | PASS |
| Market-data freshness | PASS |
| Missing-data discipline | PASS |
| Future database migration | PASS |
| Future dashboard compatibility | PASS |
| Unresolved Critical issues | **0** |
| Unresolved Major issues | **0** |

## Final status

> **PRODUCTION-READY LOGICAL DATA MODEL — AWAITING USER APPROVAL**

This approval applies to the logical architecture and data ownership model only. Physical implementation details remain deferred.

---

# 22. Approval Gate

Before approving `DATA_MODEL.md`, confirm:

1. Is `Transaction` + `TransactionLeg` accepted as the single authoritative economic ledger, with only legs changing balances?
2. Is a separate Cash Ledger accepted as a derived view rather than a second source of truth?
3. Is Moving Weighted Average Cost accepted as the baseline cost-basis method?
4. Is `net_contributed_capital_vnd` accepted as the precise replacement for ambiguous `total_invested_capital`?
5. Is effective-dated `VN30Membership` accepted instead of a manually maintained `current_member` truth?
6. Is unitized/TWR performance accepted for official flow-adjusted portfolio return and drawdown?
7. Is Dividend cash accepted as a Transaction, with DividendEvent optional for entitlement metadata?
8. Is trade-date security recognition + settlement-date cash recognition with explicit unsettled receivable/payable accepted?
9. Is the proposed `02_DATABASE/` document structure accepted?

Do **not** start the next Milestone 2 document until this file is approved.
