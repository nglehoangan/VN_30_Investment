# VN30 Value Investing OS — Data Rules

**Document:** `02_DATABASE/DATA_RULES.md`  
**Milestone:** 2 — Portfolio Data Model & Database  
**Version:** 1.2  
**Status:** PRODUCTION-READY — RE-REVIEWED; AWAITING USER APPROVAL  
**Depends on approved documents:** `DATA_MODEL.md`, `PORTFOLIO.md`, `TRANSACTIONS.md`, `VN30_MASTER.md`, `SECTOR_MASTER.md`, `BENCHMARK.md`

---

# 1. Purpose

`DATA_RULES.md` is the cross-cutting operating contract for all data in VN30 Value Investing OS.

It does **not** introduce a second data model and does **not** own business facts already owned by another approved document. Its purpose is to make implementation deterministic by defining:

- source-of-truth precedence;
- raw vs calculated data rules;
- transaction immutability;
- effective-dating semantics;
- reconstruction rules;
- cash, quantity, cost-basis, NAV and performance reconciliation;
- double-counting controls;
- corporate-action boundaries;
- missing-data and data-quality behavior;
- correction/versioning rules;
- audit lineage requirements;
- validation gates that must pass before data may be treated as production-ready.

The governing principle is:

> **A fact must have exactly one authoritative owner. A calculated state must be reproducible from authoritative facts. Missing or conflicting facts must be surfaced, never guessed.**

---

# 2. Scope and Non-Goals

## 2.1 In scope

These rules apply to:

- portfolio identity and configuration;
- transaction/event ledger;
- transaction legs/postings;
- cash and settlement state;
- position reconstruction;
- cost basis and realized/unrealized P&L;
- dividends;
- corporate actions;
- VN30 security identity and membership history;
- sector taxonomy and historical sector assignment;
- market prices;
- benchmark observations and benchmark methodology;
- portfolio performance observations;
- DCA planning and contribution attribution;
- persisted analytical snapshots/caches;
- reconciliation observations;
- historical corrections and version lineage.

## 2.2 Out of scope

This document does not define:

- physical database technology;
- SQL schema;
- APIs;
- dashboard UI;
- scoring-engine logic;
- Buy/Hold/Sell decision rules;
- brokerage-specific automation;
- exact tax law assumptions beyond recorded transaction facts;
- live market-data provider integration.

Those belong to later implementation milestones.

---

# 3. Rule Precedence

When two documents appear to conflict, implementation must use the following precedence.

## 3.1 Ownership precedence

The document that owns the entity/business concept is authoritative for that concept:

| Concept | Authoritative document |
|---|---|
| Cross-entity logical architecture | `DATA_MODEL.md` |
| Portfolio state, NAV, position, P&L | `PORTFOLIO.md` |
| Economic events, postings, settlement, reversal | `TRANSACTIONS.md` |
| Security identity and VN30 membership | `VN30_MASTER.md` |
| Sector taxonomy and effective classification | `SECTOR_MASTER.md` |
| Benchmark and portfolio-performance comparison | `BENCHMARK.md` |
| Cross-cutting validation/integrity rules | `DATA_RULES.md` |

`DATA_RULES.md` may strengthen a validation gate, but it must not silently redefine the accounting or ownership semantics of an approved owner document.

## 3.2 Specific-over-general and hard-invariant rule

If a general cross-cutting rule and a concept-specific rule differ, the **owning concept document wins**. Section 20 hard invariants are consolidation checks derived from the approved owner contracts; they are **not an independent authority that may silently override or redefine an owner document**.

If a hard invariant appears to conflict with an owning document, that is a design conflict and must be resolved through the procedure in Section 3.3 before implementation proceeds.

## 3.3 No silent precedence

Any implementation-time conflict that cannot be resolved by Sections 3.1–3.2 must be treated as a **schema/rule conflict**, not guessed.

Required action:

1. flag the conflict;
2. stop affected calculation/posting;
3. document the conflicting rules;
4. amend the owning design document before implementation proceeds.

---

# 4. Data Classification

Every persisted field must belong to one of the following classes.

## 4.1 User-entered authoritative facts

Examples:

- portfolio name;
- inception/support start date;
- manually entered transaction facts supported by broker evidence;
- DCA planned contribution;
- notes.

Rules:

- user-entered does not mean automatically trusted;
- monetary/security facts must pass validation and reconciliation;
- absence of evidence must not be replaced with estimated values unless the field is explicitly marked as an assumption.

## 4.2 Economic ledger facts

Examples:

- BUY/SELL execution facts;
- cash deposits/withdrawals;
- settlement postings;
- dividends;
- fees/taxes;
- corporate-action postings;
- reversals/corrections.

These are immutable after posting and are the authoritative accounting history.

## 4.3 Reference/master data

Examples:

- security identity;
- ticker history;
- VN30 membership;
- sector taxonomy;
- security-sector assignment.

Reference data may change historically only through controlled correction/version mechanisms. It must never post accounting balances.

## 4.4 Market/benchmark observations

Examples:

- security price observations;
- VN30 index observations.

Each observation requires an `as_of_date` or timestamp and source lineage. It must not be interpreted as timeless current truth.

## 4.5 Calculated state

Examples:

- current cash;
- position quantity;
- average cost;
- total open cost;
- market value;
- NAV;
- realized/unrealized P&L;
- portfolio/sector weights;
- cumulative return;
- drawdown;
- Legacy Holding status.

Calculated state must not become an independent mutable truth.

## 4.6 Persisted derived snapshots/cache

A derived value may be persisted for performance, reporting, reproducibility or audit only when all of the following are retained:

- `as_of` timestamp/date;
- input/version lineage sufficient for reproduction;
- calculation/method version where applicable;
- data-quality status;
- creation/calculation timestamp.

A cache/snapshot must be disposable: deleting it must not destroy the ability to reconstruct authoritative portfolio state.

---

# 5. Global Source-of-Truth Matrix

| Data item | Authoritative source | Forbidden duplicate truth |
|---|---|---|
| Portfolio identity/config | `Portfolio` | dashboard config copies as authoritative state |
| Economic event facts | `Transaction` | position/cash rows manually carrying event truth |
| Posted balance effects | `TransactionLeg` | mutable cash/position balance fields |
| Settled cash | replayed CASH legs | `Portfolio.current_cash` as mutable truth |
| Receivables/payables | replayed RECEIVABLE/PAYABLE legs | broker balance overwrite |
| Security quantity | replayed SECURITY_QUANTITY legs | mutable Position quantity |
| Ordinary BUY/SELL cost basis | transaction facts + authoritative legs + accounting-policy version | manually edited average cost |
| Corporate-action basis transfer | explicit authoritative corporate-action/basis postings | inferred price adjustment |
| Realized trading P&L | replay of SELL accounting effects | broker P&L copied as truth |
| Dividend cash/income | dividend transaction/event facts and legs | separate manually maintained dividend total |
| Security identity | `SecurityMaster` | ticker as identity |
| Historical ticker | `SecurityIdentifierHistory` | current ticker backfilled historically |
| VN30 membership | `VN30Membership` + coverage/provenance entities | current constituent list extrapolated backward |
| Sector classification | `SecuritySectorAssignment` | `SecurityMaster.sector_id` as historical truth |
| Sector taxonomy | `SectorTaxonomy` + `SectorMaster` | free-text sector names |
| Security price | `SecurityPriceObservation` | manually overwritten Position.current_price |
| VN30 index level | `BenchmarkObservation` | portfolio-comparison table as source |
| Portfolio NAV | reconstructed portfolio state + market data | BenchmarkObservation |
| Portfolio TWR/unitized performance | versioned derived performance series | raw NAV change |
| DCA plan | `DCAPlanPeriod` | cash ledger earmark |
| Actual contribution | transaction ledger external-flow event | DCA plan actual manually overriding ledger |
| Broker statement | reconciliation evidence | ledger replacement |

---

# 6. Identifier Rules

## 6.1 Stable identifiers

Every persisted authoritative entity must have an immutable unique identifier.

Examples:

- `portfolio_id`;
- `transaction_id`;
- `transaction_leg_id`;
- `security_id`;
- membership/event IDs;
- taxonomy/sector IDs;
- benchmark IDs;
- method-version IDs.

## 6.2 Ticker is not an identity

Ticker is a time-varying identifier.

All long-lived relationships must use `security_id`.

Historical ticker resolution must use effective-dated identifier history, not the current ticker value.

## 6.3 No ID reuse

A deleted/superseded business record's ID must never be reused for a different economic/reference fact.

---

# 7. Time and Effective-Dating Rules

## 7.1 Timestamp classes

The system must distinguish where relevant:

- event/execution timestamp;
- posting/effective timestamp;
- settlement timestamp/date;
- market-data observation timestamp;
- announcement date;
- effective-from/effective-to period;
- ingestion timestamp;
- calculation timestamp.

These concepts are not interchangeable.

## 7.2 Historical queries

An `as_of` query may use only facts/effects effective at or before the requested cutoff according to the owning document's effective-time rule.

Later corrections/reversals must not retroactively disappear from an **as-known/as-calculated** historical view.

## 7.3 Half-open intervals

Effective-dated master/reference ranges should use:

```text
[start, end)
```

unless the owning document explicitly defines another convention.

This prevents same-day entry/exit overlap.

## 7.4 No overlapping authoritative periods

For the same logical subject and classification dimension, two `CURRENT + CONFIRMED` effective records must not overlap where the model requires a single authoritative result.

Examples:

- VN30 membership periods for one security;
- sector assignment at the designated reporting level;
- historical identifiers of the same identifier type where uniqueness is required.

## 7.5 Missing effective date

If a fact requires an effective date to determine historical state and the date is unknown, the system must return an unknown/blocked quality state. It must not infer the date from ingestion time.

---

# 8. Monetary and Numeric Rules

## 8.1 Currency

All portfolio accounting monetary fields in Milestone 2 are denominated explicitly in **VND** unless a later approved design introduces multi-currency accounting.

Fields should use the `_vnd` suffix when ambiguity is possible.

## 8.2 Precision

Implementation must use decimal/fixed-precision arithmetic for:

- money;
- prices;
- quantities when corporate actions can create fractional entitlements;
- rates/percentages used in accounting calculations.

Binary floating point must not be the authoritative accounting representation.

## 8.3 Rounding

Rounding must occur only at a defined accounting/reporting boundary.

Intermediate calculations should preserve sufficient precision to prevent reconciliation drift.

The implementation must document:

- price precision;
- monetary rounding unit;
- percentage precision;
- treatment of fractional corporate-action entitlements.

## 8.4 No implicit sign semantics across leg types

Signs must follow the contract for each `TransactionLeg` type. Implementations must not infer event type solely from positive/negative numbers.

---

# 9. Ledger Immutability Rules

## 9.1 POSTED means immutable

After a transaction and its legs are `POSTED`:

- economic facts must not be edited in place;
- posting amounts must not be edited in place;
- effective timestamps must not be edited in place;
- identifiers must not be replaced.

## 9.2 Correction by new event

Errors are corrected by:

1. an immutable reversal/correction transaction;
2. exact reversal/accounting negation where required;
3. a new corrected event if needed.

For an ordinary BUY/SELL reversal, exact negation includes the **derived accounting transition**, not merely opposite balance legs. The replay engine must reverse the original acquisition/released cost and realized P&L using the original event facts, the original accounting-method version, and the original pre-event state required by that method. No manual P&L or cost-basis plug is permitted.

If the original trade has already settled, the trade cannot be corrected in isolation: linked settlement event(s) must be reversed/corrected as part of an auditable correction group so cash, receivable/payable, quantity, basis and realized P&L reconcile together.

## 9.3 Original history remains visible

A reversed transaction remains part of the audit history.

`is_reversed`, `reversal_transaction_id`, or similar state is derived from linkage; the original `POSTED` record is not rewritten into a historical non-event.

## 9.4 Draft records

Draft/unposted records may be edited, but they must not affect portfolio reconstruction, NAV, P&L, cash or performance.

---

# 10. Transaction Header vs Posting Rules

## 10.1 Header role

`Transaction` owns immutable event facts such as:

- event type;
- security;
- execution quantity/price where applicable;
- event-level gross/net facts;
- trade date;
- external-flow classification;
- accounting-policy version linkage;
- source evidence.

## 10.2 Leg role

`TransactionLeg` is the only authoritative mechanism for posted balance-account changes such as:

- cash;
- receivable;
- payable;
- security quantity;
- explicit corporate-action/opening cost-basis adjustment.

## 10.3 Derived accounting state

Ordinary BUY/SELL cost basis and realized P&L are derived from:

```text
immutable Transaction facts
+ matching authoritative TransactionLegs
+ the versioned accounting policy applicable to the original event
```

They are not arbitrary manual postings.

## 10.4 Header-leg reconciliation

For ordinary trades, execution quantity and the authoritative security-quantity leg must reconcile exactly under the transaction contract.

A mismatch is a posting error and blocks production reconstruction.

---

# 11. Double-Counting Prevention Rules

## 11.1 One economic effect, one accounting path

The same fee, tax, dividend, cash movement, quantity movement, receivable/payable or cost-basis effect must not be recorded through two authoritative mechanisms.

## 11.2 Trade settlement representation

For a given trade, the implementation must use the approved settlement representation consistently:

- net settlement; **or**
- gross settlement with explicit fee/tax legs.

It must not book both the net amount and the same fee/tax separately.

## 11.3 Settlement does not create a second trade

`TRADE_SETTLEMENT` may clear receivable/payable and move settled cash.

It must not:

- change security quantity again;
- recognize BUY cost again;
- release SELL cost again;
- recognize realized P&L again.

## 11.4 Dividend

A dividend may use a simple cash-recognition lifecycle or an approved accrual lifecycle. The two must not both recognize the same dividend income twice.

## 11.5 Sector hierarchy

A security is classified once at the designated reporting level. Parent sector exposure is a derived roll-up, not a second direct allocation.

## 11.6 NAV components

`other_receivables_vnd` and `other_liabilities_vnd` must exclude unsettled trade receivables/payables already represented separately.

## 11.7 Benchmark/performance

Portfolio return and benchmark return are separate derived series. Neither may be included as an additional NAV/P&L component.

---

# 12. Cost Basis Rules

## 12.1 Baseline method

Ordinary BUY/SELL positions use the approved **Moving Weighted Average Cost (MWAC)** method unless a future policy revision explicitly versions and changes the method.

## 12.2 BUY

An ordinary BUY increases:

- quantity;
- open cost according to the approved attributable-cost policy.

Average cost is calculated from reconstructed open cost / open quantity; it is not manually set.

## 12.3 SELL

A SELL:

- reduces quantity;
- releases cost according to MWAC;
- recognizes realized P&L exactly once.

Settlement does not repeat these effects.

## 12.4 Full exit

After a valid full exit:

- open quantity = 0;
- open cost = 0 subject only to defined rounding tolerance;
- no stale average cost may remain as authoritative current state.

## 12.5 Re-entry

A later BUY after full exit starts a new open-position cost cycle while lifetime transaction history remains intact.

## 12.6 Opening migration

Imported holdings require authoritative opening quantity **and verified opening basis** if current P&L/cost basis is expected to be reconstructable.

The system must not infer opening basis from current market price.

## 12.7 Corporate actions

Corporate-action basis effects must follow explicit event-specific rules.

Examples:

- split/bonus quantity change with basis conservation unless terms dictate otherwise;
- rights subscription adds explicit basis exactly once;
- merger/spinoff transfers/reallocates basis through explicit authoritative basis effects;
- cash-in-lieu removes the basis associated with the realized fraction exactly once.

## 12.8 Basis conservation

For a non-taxable/non-realizing corporate action whose terms only transform holdings, total basis across source + destination holdings must reconcile before and after the event, subject to documented rounding and any explicit cash-realization component.

---

# 13. Cash and Settlement Rules

## 13.1 Cash buckets

At minimum distinguish:

- settled cash;
- unsettled trade receivables;
- unsettled trade payables;
- other receivables;
- other liabilities.

Do not collapse all of these into one mutable `current_cash` balance.

## 13.2 Trade date

At trade date, the economic trade affects quantity/cost accounting and establishes the appropriate receivable/payable state according to the approved trade contract.

## 13.3 Settlement date

At settlement, the settlement transaction:

- moves settled cash;
- clears the matching trade receivable/payable;
- does not repeat trade accounting.

## 13.4 Settlement matching

A BUY/SELL `TRADE_SETTLEMENT` must carry the authoritative linkage to the originating posted trade (`settles_transaction_id` or the exact approved equivalent) and must reconcile to the specific obligation it clears. Corporate-action settlement uses its own documented event linkage and must not masquerade as BUY/SELL `TRADE_SETTLEMENT`.

The following are errors:

- unmatched settlement;
- over-clear;
- duplicate clear;
- settlement before the receivable/payable exists unless explicitly supported by a valid lifecycle.

## 13.5 Broker cash

Broker statements are reconciliation evidence, not accounting truth.

A mismatch creates a reconciliation exception. The system must not silently edit ledger-derived cash to match the broker.

## 13.6 Available-to-trade cash

If implemented later, `available_to_trade_cash_vnd` is broker/rule-dependent derived state and must remain distinct from settled accounting cash.

---

# 14. NAV and P&L Rules

## 14.1 NAV

Official portfolio NAV is derived from reconstructed accounting state plus valid as-of market prices.

At a minimum it must reconcile:

```text
securities market value
+ settled cash
+ unsettled trade receivables
+ other receivables
- unsettled trade payables
- other liabilities
= portfolio NAV
```

subject to the exact approved `PORTFOLIO.md` formulation.

## 14.2 Market value

Security market value uses reconstructed quantity × the valid as-of price observation.

Missing/stale price behavior must follow the approved data-quality rule and must not silently use an invented price.

## 14.3 Unrealized P&L

Unrealized P&L is derived from market value and reconstructed open cost.

It is not persisted as mutable truth.

## 14.4 Realized P&L

Realized P&L comes from replay of realizing events under the applicable accounting-policy version.

## 14.5 Dividend income

Dividend income is separate from trading realized P&L unless a reporting view explicitly defines a combined economic-return measure.

## 14.6 Expenses

Fees/taxes must be included exactly once according to their transaction/accounting representation.

## 14.7 Opening baseline

For an imported non-zero portfolio, lifetime P&L before the supported inception date is **unknown**, not reconstructed from current/opening NAV.

Performance and P&L reconciliations must use the approved supported-inception baseline.

---

# 15. External Flows, DCA and Performance Rules

## 15.1 External flow owner

For ordinary owner-capital events, external capital classification is owned by the `Transaction.external_flow_class` defined in `TRANSACTIONS.md`; it must not be duplicated independently on legs.

**Reversal exception:** a `REVERSAL` transaction always carries `external_flow_class = NONE`. When it reverses a posted `CASH_DEPOSIT` classified `CONTRIBUTION` or a posted `CASH_WITHDRAWAL` classified `WITHDRAWAL`, the reconstruction engine derives the equal-and-opposite external-flow effect from the immutable `reverses_transaction_id` linkage plus the authoritative reversed cash posting. This inverse flow is derived behavior, not a second manually stored classification.

Therefore, external-flow reconstruction must use both:

1. direct owner-capital classifications on qualifying deposit/withdrawal headers; and
2. inverse derived effects of valid linked reversals.

Ignoring the reversal linkage would corrupt TWR, net-contributed-capital and supported-inception reconciliation.

## 15.2 External flows

Examples:

- cash contribution/deposit from the owner;
- cash withdrawal to the owner.

They affect NAV but are not investment performance.

## 15.3 Internal portfolio events

BUY, SELL, settlement, dividends received inside the portfolio, fees and taxes are not owner external flows for TWR purposes.

## 15.4 DCA plan vs actual cash

`DCAPlanPeriod.planned_contribution_vnd` is planning data.

Actual contribution is reconstructed from qualifying external-flow transactions.

A plan must not create fictitious cash, reserve cash, NAV or invested capital.

## 15.5 Carry-forward

Undeployed planned cash may be analytically tracked as carry-forward only through the approved DCA calculation. It must not become a separate accounting cash bucket unless actual cash was contributed.

## 15.6 TWR timing

Time-weighted return must follow the approved `PerformanceMethodVersion`, including deterministic same-day external-flow timing.

Implementations must not choose different timing conventions ad hoc.

## 15.7 Drawdown

Portfolio drawdown must use cash-flow-adjusted/unitized performance rather than raw NAV when assessing investment drawdown.

---

# 16. VN30 Membership Rules

## 16.1 Membership is time-aware

Eligibility is determined at the relevant trade/evaluation date, not by today's constituent list.

## 16.2 Tri-state result

Historical membership lookup must return one of:

- `MEMBER`;
- `NON_MEMBER_CONFIRMED`;
- `UNKNOWN_OR_UNSUPPORTED`.

No membership row alone is insufficient to conclude non-membership unless coverage is confirmed complete.

## 16.3 Coverage is mandatory

Coverage/completeness metadata is required to distinguish historical non-membership from missing data.

## 16.4 Announcement vs effective date

An announced future entry/removal does not alter membership before the official effective date.

## 16.5 Legacy Holding

A positive holding whose security was validly acquired while eligible but is no longer a current VN30 member may be classified as `LEGACY_HOLDING` according to policy.

A holding with unknown membership coverage must **not** be automatically classified as Legacy Holding; it requires an unknown/blocked membership state.

## 16.6 Membership has no accounting postings

Entering or leaving VN30 must never by itself modify:

- cash;
- quantity;
- cost basis;
- P&L;
- NAV.

Any portfolio action resulting from an index change is a separate investment/transaction decision.

---

# 17. Sector Data Rules

## 17.1 Historical source

Historical sector classification must come from effective-dated `SecuritySectorAssignment`.

`SecurityMaster.sector_id` is at most a current convenience/cache field.

## 17.2 Classification result

The model must distinguish:

- confirmed assigned sector;
- explicit unclassified status;
- unknown/missing classification.

These states must not be collapsed.

## 17.3 Sector validity

An assignment must reference a sector/taxonomy valid for the assignment period.

## 17.4 Corrections

Historical corrections use supersession/version lineage. Production lookup uses the current confirmed authoritative record.

## 17.5 Reclassification

A sector reclassification changes analytical grouping from its effective date. It does not change the transaction ledger or cost basis.

## 17.6 Taxonomy restatement

Cross-taxonomy restatement requires an explicit confirmed `SectorTaxonomyMapping`.

Never map sectors by display-name similarity or AI inference in production accounting/risk analytics.

## 17.7 Allocation reconciliation

At a chosen reporting level:

```text
sum(known sector market values)
+ unknown/unclassified exposure as defined by the view
= total securities market value
```

within documented rounding tolerance.

---

# 18. Benchmark and Performance Data Rules

## 18.1 Benchmark observation is raw market/reference data

Official VN30 index levels come from `BenchmarkObservation` and its source/version lineage.

Portfolio NAV must never be stored as a benchmark observation.

## 18.2 Price vs total return

Price-return and total-return indices are distinct benchmark identities/methodologies.

They must not be silently substituted.

## 18.3 No synthetic benchmark without approval

If an authoritative VN30 total-return series is unavailable, the system must not fabricate one from constituent data unless a future approved methodology explicitly defines a synthetic benchmark.

## 18.4 Comparison compatibility

A comparison must disclose whether dividend, withholding-tax, fee and reinvestment methodology is fully compatible, partially comparable or limited.

## 18.5 Non-trading dates

Do not create fake benchmark observations on non-trading days merely to align with portfolio dates.

Alignment must follow the approved comparable-date policy.

## 18.6 Version pinning

A persisted benchmark comparison/performance result must retain sufficient lineage to reproduce:

- the exact portfolio state/snapshot or ledger watermark;
- benchmark observation/version;
- benchmark method version;
- performance method version;
- calculation run/version where materialized.

## 18.7 Latest truth vs as-calculated truth

The system must distinguish:

- recomputation using latest corrected authoritative data;
- reproduction of the historical result exactly as calculated at that time.

Neither should silently replace the other.

---

# 19. Corporate Action Rules

## 19.1 Reference event vs accounting effects

A corporate-action reference/event record describes the corporate event and terms.

Actual portfolio accounting effects require explicit transaction/posting events.

## 19.2 No inference from price alone

A large price change must never automatically create a split, dividend or merger event.

## 19.3 Multi-stage actions

Where an action has stages such as entitlement, election/exercise, allocation and cash/security settlement, each accounting-effective stage must be represented by its own immutable event when required and linked to the same authoritative corporate-action reference/event.

Do not append later effects to an already POSTED event. Do not post speculative future cash, quantity or basis merely because an action was announced. A later confirmed stage is a new immutable transaction.

Where a stage creates a payable/receivable before cash settlement, the later corporate-action settlement clears that specific obligation through corporate-action linkage; `TRADE_SETTLEMENT` remains reserved for BUY/SELL settlement.

## 19.4 Split / reverse split

Must preserve economic basis according to the approved event terms, with quantity and per-share cost changing consistently.

## 19.5 Stock dividend / bonus shares

Quantity increase must not automatically be treated as an ordinary BUY.

Cost-basis treatment follows the explicit event rule.

## 19.6 Rights subscription

Subscription quantity and subscription cost basis must be recognized exactly once. Cash settlement must not add basis again.

## 19.7 Merger / spinoff

Security identity changes and basis transfer/reallocation must be explicit. Historical source security records must remain auditable.

## 19.8 Cash in lieu

Cash realization and associated basis removal must occur exactly once; realized P&L is derived from the realized consideration less removed basis.

## 19.9 Index/sector boundaries

Corporate actions may affect security identity or classification/membership records, but reference-master changes do not replace required accounting postings.

---

# 20. Hard Invariants

These invariants are **non-negotiable**. A violation blocks production use of the affected data.

## 20.1 Source-of-truth invariants

1. Every authoritative fact has one owner.
2. Derived state cannot override raw authoritative facts.
3. A reconciliation source cannot overwrite the ledger/master source it checks.
4. Ticker is never the durable security primary key.
5. Current convenience/cache fields are never historical truth.

## 20.2 Ledger invariants

6. POSTED transactions/legs are immutable.
7. Corrections are append-only through reversal/correction events. A BUY/SELL reversal must invert both posted legs and the original versioned derived cost-basis/P&L transition; a settled trade correction must include affected settlement dependencies.
8. Draft events have zero accounting effect.
9. Every balance-account change is represented by an authoritative leg.
10. Ordinary BUY/SELL derived cost/P&L uses immutable event facts + matching legs + pinned accounting method.
11. Trade execution quantity reconciles to authoritative security quantity posting.
12. Settlement cannot repeat trade quantity/cost/P&L effects.
13. A receivable/payable cannot be cleared more than its outstanding amount, and each settlement clear must resolve to the specific originating obligation through authoritative linkage.
14. The same fee/tax cannot be included both net and separately.

## 20.3 Position/cost invariants

15. Position quantity is reconstructable from security-quantity legs.
16. Open cost is reconstructable under the approved accounting method.
17. Full exit leaves zero open quantity and zero open cost within tolerance.
18. Average cost is derived, not manually authoritative.
19. A corporate-action quantity change is not automatically classified as BUY/SELL.
20. Non-realizing basis-transfer actions conserve basis subject to explicit terms/rounding.

## 20.4 Cash/NAV invariants

21. Settled cash is reconstructable from cash legs.
22. Unsettled receivables/payables reconcile to unmatched trade obligations.
23. Broker cash cannot silently replace ledger cash.
24. NAV reconciles to its approved component formula.
25. Trade receivable/payable cannot also be included inside generic other receivable/liability fields.
26. Missing required market price prevents a clean authoritative valuation unless an explicit stale-price policy applies.

## 20.5 Reference-data invariants

27. VN30 membership intervals do not overlap for the same security where a single state is required.
28. Historical `NON_MEMBER_CONFIRMED` requires confirmed complete coverage.
29. Sector assignment uses a valid taxonomy/sector and a unique authoritative assignment at the reporting level.
30. Unknown and explicit unclassified states remain distinguishable.
31. Membership/sector records cannot directly modify portfolio accounting balances.

## 20.6 Performance invariants

32. External contributions/withdrawals do not become investment return; a valid reversal of such an owner-capital event contributes the equal-and-opposite **derived** external flow through reversal linkage.
33. BUY/SELL/dividend/fee/tax internal events do not become owner external flows.
34. Portfolio drawdown uses the approved cash-flow-adjusted performance series.
35. Benchmark price and total-return methodologies remain distinct.
36. Persisted performance/comparison results pin the method/input versions required for reproduction.

## 20.7 Reconstruction invariants

37. Current authoritative portfolio state must be reconstructable from approved inception facts + posted ledger + required reference/market data.
38. Historical state at cutoff `t` must not depend on events effective after `t`, except in an explicitly requested latest-restated/corrected view.
39. A later reversal must not erase the original transaction from an earlier historical cutoff.
40. Imported portfolios cannot claim unsupported pre-inception lifetime history.

---

# 21. Reconstruction Contract

## 21.1 Minimum reconstruction inputs

To reconstruct a portfolio at time `t`, the system needs:

1. Portfolio identity/configuration.
2. Supported inception/opening facts if migration did not start from zero.
3. All relevant POSTED transaction legs with `effective_timestamp <= t`.
4. Matching transaction header facts, reversal/settlement/correction linkages, and accounting-policy versions.
5. Corporate-action terms/events required to interpret specialized postings.
6. Security identity history.
7. Effective VN30 membership/coverage when eligibility or Legacy Holding status is requested.
8. Effective sector assignment when sector exposure is requested.
9. Valid as-of security prices when market value/NAV is requested.
10. Benchmark data/method versions when comparative performance is requested.

## 21.2 Reconstruction sequence

The canonical logical sequence is:

```text
1. Select portfolio and supported inception baseline.
2. Select authoritative POSTED legs effective through cutoff.
3. Join immutable transaction facts and pinned accounting-policy versions.
4. Replay cash / receivable / payable / quantity balances deterministically, including exact obligation linkage for settlement clears.
5. Replay ordinary BUY/SELL cost basis and realized P&L, including exact inverse derived accounting transitions for effective reversals under the original method version.
6. Apply explicit corporate-action basis transformations and stage linkages.
7. Validate quantity, cost and settlement invariants.
8. Resolve security identity/ticker as-of date.
9. Attach valid market prices and compute market values/NAV.
10. Resolve VN30 membership state if required.
11. Resolve effective sector assignments and aggregate exposure if required.
12. Derive P&L, allocation and risk inputs.
13. Derive cash-flow-adjusted performance under pinned method version.
14. Align benchmark observations under pinned benchmark method.
15. Assign final data-quality status and reconciliation result.
```

## 21.3 Deterministic ordering

Within the same effective time, replay order must follow the authoritative ordering contract defined in the approved data/transaction model.

Implementation must not invent a different local tie-breaker that changes accounting results.

## 21.4 Reconstruction failure

If required facts are absent or contradictory, reconstruction must return a degraded/blocked result identifying the missing/conflicting dependency.

It must not fill gaps by guessing.

---

# 22. Reconciliation Framework

Reconciliation compares authoritative internally reconstructed state with independent evidence or mathematical identities.

## 22.1 Cash reconciliation

Compare ledger-derived settled cash with broker cash evidence as of a comparable timestamp/date.

Outcome:

- `MATCH`;
- `MATCH_WITHIN_TOLERANCE`;
- `MISMATCH`;
- `NOT_COMPARABLE`;
- `MISSING_EVIDENCE`.

A mismatch creates an exception; it does not trigger automatic balance editing.

## 22.2 Settlement reconciliation

For each trade obligation:

```text
original receivable/payable
- valid settlement clears
- valid reversal/correction effects
= outstanding balance
```

Outstanding amounts must reconcile to portfolio unsettled totals.

## 22.3 Quantity reconciliation

Ledger-derived quantity should be reconcilable to broker position evidence when available.

Broker quantity is verification evidence, not the source of truth.

## 22.4 Cost-basis reconciliation

For every open security:

- reconstructed open cost;
- reconstructed quantity;
- derived average cost;
- accumulated realized cost release;

must satisfy the accounting method's identities.

Any broker cost basis comparison must first confirm methodology compatibility.

## 22.5 NAV reconciliation

NAV component identity in Section 14 must hold within defined rounding tolerance.

## 22.6 Sector reconciliation

Sector exposure aggregation must reconcile to total securities market value after including the explicit unknown/unclassified bucket according to the selected view.

## 22.7 Performance reconciliation

Performance series must reconcile to:

- pinned starting state;
- owner external flows;
- ending valuation;
- approved performance method.

Raw NAV change must not be used as a substitute when external flows occurred.

## 22.8 Benchmark reconciliation

Benchmark observations must reconcile to their authoritative source/version evidence when such source evidence is available.

---

# 23. Data Quality Model

## 23.1 General quality states

The implementation should support at least these logical states:

- `VALID`;
- `PROVISIONAL`;
- `STALE`;
- `MISSING_REQUIRED_DATA`;
- `CONFLICTING_DATA`;
- `RECONCILIATION_MISMATCH`;
- `UNSUPPORTED_HISTORY`;
- `BLOCKED`.

Owner documents may define more specific states.

## 23.2 Quality propagation

A derived result cannot have higher reliability than a critical input required for that result.

Examples:

- missing security price → NAV/market-value result degraded or blocked;
- unknown membership coverage → eligibility result blocked/unknown;
- ambiguous sector mapping → restated sector exposure degraded/blocked;
- missing performance-method version → historical TWR reproduction blocked.

## 23.3 No false zero

Missing data must not be represented as numeric zero unless zero is an actual observed/derived fact.

Examples:

- missing dividend ≠ 0 dividend;
- unknown quantity evidence ≠ zero quantity;
- unknown sector exposure ≠ zero exposure;
- unavailable benchmark level ≠ 0.

## 23.4 No false precision

If input evidence is approximate or provisional, downstream reports must preserve that quality state rather than presenting exact-looking authoritative numbers.

---

# 24. Correction and Versioning Rules

## 24.1 Economic ledger

Corrections are append-only via reversal/correction transactions.

## 24.2 Reference/market data

Where historical records can be corrected, use version/supersession lineage rather than silent destructive overwrite when reproduction/audit matters.

At minimum distinguish:

- authoritative current/latest record;
- superseded historical record;
- source reference;
- correction/ingestion timestamp.

## 24.3 Calculation methodology

Material changes to accounting/performance/benchmark methodology require a new immutable method version.

Historical events/results must retain the original version linkage required for exact replay/reproduction.

## 24.4 Latest truth vs historical reproduction

The system must support the conceptual distinction between:

- **latest-restated truth**: recompute using latest authoritative corrected inputs;
- **as-calculated truth**: reproduce exactly what was calculated using the versions known/pinned at that time.

Reports must state which mode they use when the distinction is material.

---

# 25. Data Ingestion Rules

## 25.1 Validate before promotion

Imported data should pass through a logical lifecycle such as:

```text
INGESTED
→ VALIDATED
→ RECONCILED / QUALITY-ASSESSED
→ AUTHORITATIVE/CURRENT
```

The exact storage mechanism is implementation-specific.

## 25.2 Never infer missing critical facts during ingestion

Examples of prohibited inference:

- guessing a missing BUY price from nearby market close;
- guessing an index effective date from article publication date;
- assigning sector by company name;
- deriving opening basis from current price;
- treating a missing constituent row as confirmed non-membership.

## 25.3 Duplicate detection

Ingestion must detect likely duplicate:

- transactions;
- transaction legs;
- benchmark observations;
- price observations;
- membership periods;
- sector assignments;
- corporate-action events.

Duplicate detection must use stable IDs/source IDs and business uniqueness constraints, not ticker/name alone.

## 25.4 Idempotency

Re-importing the same source file/API payload must not create duplicate economic/accounting effects.

---

# 26. Snapshot and Cache Rules

## 26.1 Snapshots are non-authoritative

Persisted portfolio/position/performance snapshots are optimization and reporting artifacts.

## 26.2 Required lineage

A snapshot must retain enough metadata to answer:

- what `as_of` time it represents;
- which ledger watermark/input set it used;
- which market/reference versions were used when material;
- which method version calculated it;
- its quality/reconciliation status.

## 26.3 Rebuild requirement

The system must be able to delete and rebuild snapshots without changing authoritative state.

## 26.4 Stale snapshot

If any authoritative upstream event/input relevant to the snapshot is corrected or superseded, the snapshot must be marked stale/invalidated or recomputed according to implementation policy.

---

# 27. Audit and Provenance Rules

Every authoritative or materially versioned record should retain sufficient provenance such as:

- source system/provider;
- source record/reference ID where available;
- source document/date;
- ingestion timestamp;
- created-by/import mechanism;
- correction/supersession linkage;
- notes for exceptional manual adjustments.

For user-entered exceptional records such as opening migration or cash adjustment, evidence/notes are mandatory enough to permit later review.

No unexplained manual balancing entry should be accepted merely to make reconciliation pass.

---

# 28. Safety Rules for Manual Adjustments

## 28.1 Manual adjustments are exceptional

`CASH_ADJUSTMENT`, opening basis adjustments or similar control entries are not normal transaction shortcuts.

## 28.2 Required controls

Each exceptional manual adjustment must include:

- reason code;
- source/evidence reference;
- user/operator note;
- effective date;
- approval/review status if implemented later.

## 28.3 Prohibited use

Manual adjustments must not be used to:

- force broker reconciliation without finding the root cause;
- manipulate realized/unrealized P&L;
- change average cost arbitrarily;
- hide missing corporate actions;
- correct a posted trade without reversal/correction lineage.

---

# 29. Minimum Production Validation Gates

Before a dataset/state is considered production-ready for portfolio decisions, the applicable gates must pass.

## Gate A — Ledger integrity

- no duplicate authoritative transaction IDs;
- no orphan transaction legs;
- no posted leg attached to an invalid/unposted parent;
- no mutable overwrite of posted history;
- no header/leg quantity mismatch for ordinary trades.

## Gate B — Cash integrity

- cash replay succeeds;
- settlement obligations reconcile;
- no unexplained negative/over-cleared receivable/payable;
- broker mismatch, if present, is surfaced.

## Gate C — Position/cost integrity

- quantity replay succeeds;
- open cost replay succeeds;
- no negative position unless explicitly supported by future policy;
- full exits close basis correctly;
- corporate-action basis rules reconcile.

## Gate D — Reference integrity

- security IDs resolve;
- no invalid ticker-only joins;
- membership lookup returns a valid tri-state result;
- sector assignment state is valid for the taxonomy/effective date.

## Gate E — Valuation integrity

- required prices exist and satisfy freshness policy;
- NAV formula reconciles;
- position/sector weights reconcile.

## Gate F — Performance integrity

- external-flow classification is complete;
- performance method version is pinned;
- unitized/TWR series reconstructs;
- benchmark comparison uses a valid compatible/aligned benchmark observation.

A gate that is not applicable may be marked `NOT_APPLICABLE`; it must not be silently treated as `PASS`.

---

# 30. Cross-Document Acceptance Scenarios

These scenarios validate that the six approved model documents work together under one rule set.

## Scenario 1 — Cash contribution, no trade

Expected:

- settled cash increases;
- NAV increases by contribution;
- TWR investment return remains unchanged from the contribution itself;
- DCA actual contribution may reflect the transaction;
- no position created.

## Scenario 2 — BUY before settlement

Expected:

- quantity and open cost recognized according to trade-date contract;
- payable exists;
- settled cash is not incorrectly reduced twice;
- NAV includes all components exactly once.

## Scenario 3 — BUY settlement

Expected:

- payable clears;
- settled cash changes;
- quantity/open cost do not change a second time.

## Scenario 4 — Partial SELL then settlement

Expected:

- quantity decreases at trade event;
- MWAC basis released exactly once;
- realized P&L recognized exactly once;
- receivable established then cleared by settlement;
- no second P&L at settlement.

## Scenario 5 — Full exit and re-entry

Expected:

- first cycle ends with zero open cost/quantity;
- lifetime realized history remains;
- later BUY starts new open basis cycle.

## Scenario 6 — Reversal after original trade

Expected:

- earlier historical cutoff still contains original trade;
- cutoff after reversal contains the appropriate accounting negation;
- reversal negates quantity/cash/obligation and the exact original derived cost/P&L transition using the original accounting-method version;
- no manual P&L or basis plug is used.

## Scenario 7 — Imported opening portfolio

Expected:

- opening cash/quantity/basis are explicit supported-inception facts;
- current state reconstructs;
- pre-inception lifetime P&L is not fabricated.

## Scenario 8 — Stock split while holding

Expected:

- quantity changes via corporate-action posting;
- action is not treated as BUY;
- total basis conserves under event terms;
- sector/VN30 membership does not change unless separately documented.

## Scenario 9 — Rights subscription

Expected:

- new quantity and basis are recorded exactly once;
- later settlement changes cash/payable only;
- basis is not added again.

## Scenario 10 — Merger into successor security

Expected:

- source/destination security identities remain distinct/auditable;
- quantity and basis transfer follows explicit action terms;
- security membership/sector classification resolves independently by effective date.

## Scenario 11 — Security removed from VN30 while held

Expected:

- no accounting posting occurs from removal alone;
- position remains in NAV and risk calculations;
- valid historical membership permits Legacy Holding classification;
- future eligibility uses policy + effective membership state.

## Scenario 12 — Membership data incomplete

Expected:

- lookup returns `UNKNOWN_OR_UNSUPPORTED`;
- system does not assert confirmed non-membership;
- eligibility-sensitive decision state is blocked/flagged.

## Scenario 13 — Sector reclassification while held

Expected:

- transaction history and cost basis unchanged;
- historical as-classified exposure changes only from effective date;
- restated view requires explicit taxonomy mapping.

## Scenario 14 — Missing historical sector assignment

Expected:

- position remains in NAV;
- exposure appears in unknown/unclassified bucket as appropriate;
- total securities market value still reconciles.

## Scenario 15 — DCA plan not contributed

Expected:

- planned contribution exists;
- actual contribution = 0 from ledger;
- no fictitious cash/NAV is created;
- carry-forward is planning analytics only.

## Scenario 16 — External contribution during rising market

Expected:

- raw NAV rises from both market and contribution;
- TWR removes contribution distortion;
- drawdown/performance use unitized series.

## Scenario 17 — Dividend receipt

Expected:

- dividend cash/income recognized once;
- not classified as owner external flow;
- portfolio economic performance captures effect appropriately;
- comparison warns if benchmark methodology is price-only.

## Scenario 18 — Fee/tax represented in net settlement

Expected:

- fee/tax not additionally posted separately for the same effect;
- NAV/P&L expense effect occurs exactly once.

## Scenario 19 — Broker cash mismatch

Expected:

- ledger-derived cash remains authoritative;
- mismatch is recorded as reconciliation exception;
- no automatic cash adjustment is created.

## Scenario 20 — Corrected benchmark observation

Expected:

- latest-truth report may recompute using corrected observation;
- prior materialized report can still reproduce as-calculated result using pinned input version.

## Scenario 21 — Same-day multiple external flows

Expected:

- deterministic performance result under pinned timing method;
- same input produces same TWR across implementations.

## Scenario 22 — Missing current price

Expected:

- quantity/cost/accounting state remains reconstructable;
- market value/NAV quality degrades or blocks according to pricing policy;
- no guessed price.

## Scenario 23 — Ticker changed historically

Expected:

- old transaction resolves through `security_id` / historical identifier;
- current ticker rename does not rewrite historical identity.

## Scenario 24 — Cash-in-lieu from corporate action

Expected:

- cash consideration recorded once;
- relevant basis removed once;
- realized P&L derived once;
- no residual fractional basis inconsistent with action terms.

## Scenario 25 — Snapshot invalidated by late correction

Expected:

- authoritative ledger/master history remains intact;
- affected cached snapshot is marked stale/rebuilt;
- no cache overwrites authoritative history.

## Scenario 26 — Reversal of owner capital flow

Expected:

- original contribution/withdrawal remains visible before reversal effective time;
- reversal header remains `external_flow_class = NONE`;
- performance reconstruction derives the equal-and-opposite external flow from reversal linkage + reversed cash posting;
- net contributed capital and TWR remain correct without duplicating classification on legs.

## Scenario 27 — Correcting an already settled trade

Expected:

- original trade is not reversed while old settlement remains economically active;
- affected settlement event(s), trade event and corrected replacement are linked in an auditable correction group;
- final cash, receivable/payable, quantity, cost basis and realized P&L reconcile as a whole;
- historical cutoffs before the correction retain the original economic history.

## Scenario 28 — Multi-stage corporate action with obligation then settlement

Expected:

- announcement alone creates no speculative accounting posting;
- exercise/allocation stage creates only confirmed quantity/basis/obligation effects;
- later corporate-action settlement clears the specific obligation without adding basis again;
- BUY/SELL `TRADE_SETTLEMENT` is not reused for the corporate-action settlement lifecycle.

---

# 31. Anti-Patterns — Explicitly Forbidden

The following implementation patterns are forbidden:

1. Storing `Portfolio.current_cash` as a manually maintained balance.
2. Storing `Position.average_cost` as editable truth.
3. Reconstructing trades from current Position rows instead of ledger history.
4. Using ticker as a durable foreign key.
5. Backfilling current VN30 membership to historical dates.
6. Treating no membership record as confirmed non-membership without coverage evidence.
7. Using current sector for all historical allocation reports.
8. Treating a stock split quantity increase as a BUY.
9. Recomputing an old reversed trade as if it never existed at earlier cutoffs.
10. Posting trade accounting again at settlement.
11. Booking net settlement plus the same fee/tax again.
12. Editing posted trade price/quantity to fix a mistake.
13. Editing ledger cash to match a broker statement.
14. Guessing opening basis from market price.
15. Treating DCA planned amount as contributed cash.
16. Measuring performance from raw NAV when owner flows exist.
17. Calling a price-only VN30 comparison fully total-return comparable without disclosure.
18. Fabricating missing market/benchmark data as zero.
19. Silently overwriting corrected historical benchmark/reference data when exact historical reproduction is required.
20. Using generic manual adjustments to force reconciliation to pass.
21. Treating a reversal of owner contribution/withdrawal as having zero external-flow effect merely because the REVERSAL header is `NONE`.
22. Reversing a settled BUY/SELL while leaving its prior settlement event economically active.
23. Using BUY/SELL `TRADE_SETTLEMENT` as a generic settlement event for corporate actions.

---

# 32. Focused Re-Review Findings — v1.2

The v1.0 draft was re-audited specifically for source of truth, double counting, cost basis, cash reconciliation, corporate actions and deterministic reconstruction. The following material issues were found and resolved:

1. **Major — precedence ambiguity:** Section 3 allowed a DATA_RULES hard invariant to override an owning approved document, creating a second rule authority. Fixed: owner document remains authoritative; any hard-invariant conflict blocks implementation and requires design correction.
2. **Major — owner-capital reversal/TWR conflict:** v1.0 stated external-flow truth belonged only to transaction-header classification, which would miss the approved inverse derived flow of a REVERSAL whose header is `NONE`. Fixed with explicit reversal-linkage semantics.
3. **Major — incomplete BUY/SELL reversal semantics:** append-only reversal was stated but exact inverse of derived MWAC/realized-P&L state was not a cross-cutting hard requirement. Fixed with original method-version + original transition inversion and no-plug rule.
4. **Major — settled-trade correction dependency:** v1.0 did not globally require reversing/correcting linked settlement events when correcting an already settled trade. Fixed with correction-group reconciliation across trade and settlement dependencies.
5. **Major — settlement linkage under-specified:** cash clearing only needed to “identify/reconcile” the obligation; implementation could clear an aggregate balance without stable provenance. Fixed by requiring authoritative originating-obligation linkage.
6. **Major — corporate-action settlement boundary:** multi-stage corporate actions were immutable but the cross-cutting rules did not explicitly reserve `TRADE_SETTLEMENT` for BUY/SELL or require stage-specific obligation linkage. Fixed to prevent lifecycle ambiguity and basis/cash double counting.

**Re-review result:** 0 Critical unresolved; 0 Major unresolved.

---

# 33. Review — Portfolio Manager

## 33.1 Review focus

- Does the model preserve economically correct portfolio state?
- Can DCA/cash flows distort reported return?
- Can index changes or sector changes accidentally affect accounting?
- Can Legacy Holdings disappear from NAV/risk?
- Can missing data produce false investment signals?

## 33.2 Findings resolved

- External flows are isolated from investment return.
- Legacy Holdings remain accounting positions until actual disposal/corporate action.
- VN30/sector reference changes cannot post portfolio balances.
- Missing eligibility/pricing/classification data is surfaced rather than guessed.
- Broker reconciliation cannot override internally consistent ledger state.
- Drawdown/performance uses cash-flow-adjusted methodology.

## 33.3 Portfolio Manager result

**PASS — 0 Critical, 0 Major unresolved.**

---

# 34. Review — Data Architect

## 34.1 Review focus

- Single source of truth;
- entity ownership;
- duplicate truth;
- historical effective dating;
- deterministic replay;
- correction/version lineage;
- cache/snapshot boundaries.

## 34.2 Findings resolved

- Cross-document ownership precedence is explicit.
- Raw/derived/cache classes are separated.
- Stable IDs are mandatory; ticker is non-authoritative identity.
- effective-dated reference data is non-overlapping and tri-state where needed.
- replay sequence and failure behavior are explicit.
- historical correction and methodology versioning preserve reproducibility.
- snapshots are rebuildable and non-authoritative.

## 34.3 Data Architect result

**PASS — 0 Critical, 0 Major unresolved.**

---

# 35. Review — Risk Manager

## 35.1 Review focus

- accounting integrity;
- reconciliation exceptions;
- corporate-action failure modes;
- missing-data propagation;
- performance/drawdown distortion;
- manual-adjustment abuse.

## 35.2 Findings resolved

- hard invariants block production state on material accounting violations.
- over-cleared/unmatched settlement is invalid.
- cost-basis conservation rules protect corporate-action replay.
- missing market/reference data propagates to downstream quality state.
- manual adjustment controls prevent reconciliation masking.
- raw NAV cannot substitute for cash-flow-adjusted drawdown/performance.

## 35.3 Risk Manager result

**PASS — 0 Critical, 0 Major unresolved.**

---

# 36. Known Minor / Deferred Items

These items are intentionally deferred and are not blockers for the logical model:

1. Exact physical database constraints/index definitions.
2. Broker-specific settlement-calendar and available-to-trade formulas.
3. Exact numeric precision/rounding scale to be selected during implementation.
4. Market-price staleness thresholds by use case.
5. Workflow/approval UI for exceptional manual adjustments.
6. Automated source-provider hierarchy and ingestion retry policy.
7. Multi-currency support, currently outside scope.
8. Corporate-action tax-specific edge cases requiring broker/legal source confirmation.

Each deferred item must be resolved before the corresponding implementation capability is declared production-ready.

---

# 37. Final Milestone-2 Data Contract

The following architecture is now the required mental model for all later implementation:

```text
REFERENCE / MASTER FACTS
Security identity
VN30 membership + coverage
Sector taxonomy + assignments
Benchmark identity/method
        │
        ├───────────────┐
        │               │
ECONOMIC LEDGER         MARKET DATA
Transaction headers     Security prices
Transaction legs        Benchmark observations
Corporate-action terms
        │               │
        └───────┬───────┘
                ▼
      DETERMINISTIC RECONSTRUCTION
      cash / obligations / quantity
      cost basis / realized P&L
                │
                ▼
          PORTFOLIO STATE
      positions / NAV / allocation
                │
        ┌───────┴────────┐
        ▼                ▼
  RISK / SECTOR      PERFORMANCE
  ANALYTICS          TWR / drawdown
                         │
                         ▼
                 BENCHMARK COMPARISON
```

No later milestone may bypass this chain by manually writing calculated portfolio state as authoritative truth.

---

# 38. Approval Gate

`DATA_RULES.md` may be approved only when:

- source-of-truth rules do not conflict with approved owner documents;
- no accounting effect can be legitimately recorded twice;
- cash/quantity/cost basis/NAV can be reconciled;
- corporate actions have explicit accounting boundaries;
- transaction history remains reconstructable after corrections/reversals;
- missing data cannot silently become zero/false/current truth;
- methodology versions can reproduce material historical calculations;
- no Critical or Major issue remains unresolved.

**Current self-review status:**

- Critical issues unresolved: **0**
- Major issues unresolved: **0**
- Minor/deferred items: **8**

**Document status:** `PRODUCTION-READY — RE-REVIEWED; AWAITING USER APPROVAL`
