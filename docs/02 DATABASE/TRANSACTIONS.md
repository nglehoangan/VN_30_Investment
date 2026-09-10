# VN30 Value Investing OS — Transaction Ledger

**Document:** `TRANSACTIONS.md`  
**Milestone:** 2 — Portfolio Data Model & Database  
**Status:** Production-Ready — Final Re-review; Awaiting Approval  
**Version:** 1.2  
**Date:** 2026-09-04  
**Depends on:** `DATA_MODEL.md` v1.2, `PORTFOLIO.md` v1.1  
**Governing documents:** Investment Policy, Decision Framework, Risk Policy, Scoring Model, System Prompt

---

# 1. Purpose

This document defines the authoritative transaction-ledger contract for VN30 Value Investing OS.

It specifies how portfolio-changing economic events must be recorded so that the system can reconstruct, deterministically and without hidden state:

- settled cash;
- unsettled receivables and payables;
- security quantities;
- moving weighted average cost (MWAC);
- realized trading P&L;
- dividend cash income;
- fees and taxes;
- external capital contributions and withdrawals;
- opening migrated state;
- corporate-action effects;
- reversals and corrections;
- historical portfolio state at any supported as-of timestamp.

This file does **not** define a second cash ledger or mutable Position table. `Transaction` + `TransactionLeg` are the authoritative accounting ledger; Portfolio/Cash/Position outputs are derived projections.

---

# 2. Core Accounting Decision

The ledger has two levels:

1. **`Transaction`** — immutable economic-event header: what happened.
2. **`TransactionLeg`** — immutable signed posting: what accounting/security balance changed and when.

Only `TransactionLeg` changes **posted balance accounts** such as settled cash, receivables, payables, security quantity, and explicit opening/corporate-action basis adjustments.

Ordinary BUY/SELL open-cost, MWAC, cost release, and realized trading P&L are **derived accounting state**, not independent posted balances. Their authoritative inputs are the immutable Transaction event facts + matching TransactionLeg postings + the selected versioned accounting policy.

Header values such as execution quantity, execution price, gross trade value, fee, and tax are source/event facts used for validation and derived cost-basis/P&L calculation. They must never be counted as additional cash or quantity movements.

```text
Economic Event
    Transaction
        |
        +---- TransactionLeg 1
        +---- TransactionLeg 2
        +---- TransactionLeg n
```

This separation is mandatory because one economic event can affect different balances on different dates. Example: a stock sale changes quantity and realized P&L on trade date, but settled cash only on settlement date.

---

# 3. Source-of-Truth Rules

## 3.1 Authoritative sources

| Question | Authoritative source |
|---|---|
| What economic event occurred? | `Transaction` header |
| What changed cash? | cash-type `TransactionLeg` |
| What changed quantity? | `SECURITY_QUANTITY` leg |
| What changed opening/transferred cost basis outside ordinary BUY/SELL? | `COST_BASIS_ADJUSTMENT` leg |
| What determines ordinary BUY/SELL open cost and realized P&L? | immutable BUY/SELL header facts + matching quantity leg + versioned accounting policy |
| What classifies owner capital flow? | `Transaction.external_flow_class` |
| What defines complex corporate-action terms? | linked `CorporateActionEvent` |
| What proves broker/source origin? | `source`, `source_reference`, source evidence |
| What is current cash/position/NAV? | derived from ledger + market data |

## 3.2 Forbidden duplicate truth

The following must not exist as an independent authoritative ledger:

- separate editable Cash Ledger;
- manually maintained current holdings table;
- manually maintained average-cost table;
- standalone Dividend cash table that also changes cash;
- corporate-action table that directly changes Position;
- broker statement balance that overwrites ledger state.

Views, reports, reconciliation observations, and snapshots are allowed only as derived/evidence layers.

---

# 4. Transaction Entity

## 4.1 Logical purpose

`Transaction` records one business/economic event and its immutable source facts.

## 4.2 Schema

| Field | Type | Required | Class | Rule |
|---|---|---:|---|---|
| `transaction_id` | UUID/string | Yes | RAW | Globally unique immutable identifier. |
| `portfolio_id` | FK | Yes | RAW | Owning portfolio. |
| `transaction_type` | enum | Yes | RAW | Allowed types in §6. |
| `event_timestamp` | timestamp | Yes | RAW | Business event timestamp; never substitutes for leg effective timestamps. |
| `trade_date` | date | Conditional | RAW | Required for BUY/SELL and market elections where applicable. |
| `settlement_date` | date | Conditional | RAW | Required when settlement is known/applicable. |
| `security_id` | FK | Conditional | RAW | Primary security for simple events. Complex actions may use multiple security IDs in legs. |
| `execution_quantity` | decimal | Conditional | RAW | Positive absolute quantity for BUY/SELL. |
| `execution_price_vnd_per_share` | decimal | Conditional | RAW | Broker execution price. |
| `gross_trade_value_vnd` | decimal | Conditional | RAW | Absolute gross value before fee/tax. |
| `fee_vnd` | decimal | Yes, default 0 | RAW | Event fact attributable to event. |
| `tax_vnd` | decimal | Yes, default 0 | RAW | Event fact attributable to event. |
| `external_flow_class` | enum | Yes | RAW | `NONE`, `CONTRIBUTION`, `WITHDRAWAL`. |
| `posting_representation` | enum | Conditional | RAW | For BUY/SELL settlement: `NET_SETTLEMENT` or `SPLIT_SETTLEMENT`. |
| `source` | enum/string | Yes | RAW | `USER`, `BROKER`, `IMPORT`, `SYSTEM_CORRECTION`, etc. |
| `source_reference` | string | Recommended | RAW | Broker/order/statement/import identifier for dedup/reconciliation. |
| `status` | enum | Yes | RAW | `PENDING`, `POSTED`; once POSTED, immutable. |
| `reverses_transaction_id` | FK | Conditional | RAW | Required for REVERSAL. |
| `settles_transaction_id` | FK | Conditional | RAW | Required for `TRADE_SETTLEMENT`; references originating BUY/SELL. |
| `corporate_action_event_id` | FK | Conditional | RAW | Required when complex action terms are needed. |
| `dividend_event_id` | FK | Optional | RAW | Optional entitlement/announcement linkage. |
| `migration_method_version` | string | Conditional | RAW | Required for OPENING_BALANCE imports. |
| `correction_group_id` | UUID/string | Optional | RAW | Groups multi-event reversal/replacement when one economic correction spans trade + settlement dependencies. |
| `created_at` | timestamp | Yes | SYSTEM | Audit metadata. |
| `entered_by` | string | Optional | SYSTEM | User/system origin. |
| `notes` | text | Optional | RAW | Explain unusual events/corrections; never carries hidden accounting logic. |

## 4.3 Transaction immutability

A `POSTED` Transaction:

- represents an authoritative event/stage supported by source evidence; speculative announced-but-not-effective portfolio changes remain `PENDING` or reference metadata and must not be inserted as authoritative future balance legs;
- cannot be edited;
- cannot be deleted;
- cannot be changed to `REVERSED`;
- cannot have posted legs modified or removed.

A correction requires:

1. a new `REVERSAL` transaction referencing the original;
2. exact opposite authoritative legs at the correction effective time;
3. a new replacement transaction if corrected data must be posted.

The original remains `POSTED` forever. Whether it has later been reversed is a **derived** property.

---

# 5. TransactionLeg Entity

## 5.1 Purpose

A `TransactionLeg` is the only object permitted to change a **posted balance account**. Ordinary BUY/SELL MWAC/open-cost and realized P&L remain deterministic derived state transitions from the parent event facts and matching legs; they are not separately editable balances.

## 5.2 Schema

| Field | Type | Required | Class | Rule |
|---|---|---:|---|---|
| `transaction_leg_id` | UUID/string | Yes | RAW | Unique immutable posting ID. |
| `transaction_id` | FK | Yes | RAW | Parent Transaction. |
| `leg_sequence` | integer | Yes | RAW | Stable ordering within parent event. |
| `leg_type` | enum | Yes | RAW | Defined in §5.3. |
| `effective_timestamp` | timestamp | Yes | RAW | Time this posting affects accounting state. |
| `security_id` | FK | Conditional | RAW | Required for security/basis legs. |
| `quantity_delta` | decimal | Conditional | RAW | Signed; only for `SECURITY_QUANTITY`. |
| `amount_vnd` | decimal | Conditional | RAW | Signed VND amount under leg semantics. |
| `settlement_reference` | string/UUID | Conditional | RAW | Links settlement clearing to originating receivable/payable where physical schema supports it. |
| `notes` | text | Optional | RAW | Posting explanation only. |

## 5.3 Allowed leg types

### `SECURITY_QUANTITY`

Changes owned share quantity.

- `quantity_delta > 0` increases quantity.
- `quantity_delta < 0` decreases quantity.
- `amount_vnd = NULL`.
- `security_id` required.

### `COST_BASIS_ADJUSTMENT`

Changes open cost without changing cash or quantity.

Allowed only for:

- verified opening-state migration;
- documented corporate-action cost-basis transfer/reallocation;
- reversal of one of the above.

It is forbidden for normal BUY/SELL bookkeeping or arbitrary average-cost corrections.

### `CASH`

Changes settled cash.

- positive = cash asset increases;
- negative = cash asset decreases.

### `RECEIVABLE`

Represents unsettled asset due to the portfolio.

- positive = receivable created/increased;
- negative = receivable cleared/decreased.

### `PAYABLE`

Represents unsettled liability owed by the portfolio.

To avoid sign ambiguity, the ledger uses **liability-balance semantics**:

- positive = payable liability created/increased;
- negative = payable liability cleared/decreased.

NAV subtracts the positive payable balance.

### `FEE_CASH`, `TAX_CASH`, `OTHER_CASH`

Optional categorized settled-cash legs used only under split-settlement or standalone charge representation.

These are cash-type legs and therefore affect settled cash directly.

## 5.4 Value exclusivity

- `SECURITY_QUANTITY`: `quantity_delta` required, `amount_vnd = NULL`.
- all money/basis legs: `amount_vnd` required, `quantity_delta = NULL`.
- one leg cannot change both quantity and money.

---

# 6. Allowed Transaction Types

Minimum production set:

| Type | Purpose | External flow allowed? |
|---|---|---|
| `BUY` | Purchase listed security | No |
| `SELL` | Sell listed security | No |
| `TRADE_SETTLEMENT` | Settle the cash receivable/payable of one posted BUY/SELL | No |
| `DIVIDEND_CASH` | Receive dividend cash | No |
| `CASH_DEPOSIT` | Owner contributes cash | `CONTRIBUTION` only |
| `CASH_WITHDRAWAL` | Owner withdraws cash | `WITHDRAWAL` only |
| `FEE` | Standalone fee not attributable to BUY/SELL | No |
| `TAX` | Standalone tax not attributable to BUY/SELL | No |
| `CORPORATE_ACTION` | Security/cash/basis event based on documented action terms | No |
| `CASH_ADJUSTMENT` | Rare reconciliation correction with evidence | No |
| `OPENING_BALANCE` | Auditable system-inception migration | No |
| `REVERSAL` | Negates one prior posted event | No |

`CORPORATE_ACTION` subtypes are stored in `CorporateActionEvent`, not invented as additional transaction-type strings.

---

# 7. BUY Posting Contract

## 7.1 Required event facts

For a normal BUY:

- `transaction_type = BUY`;
- `security_id` required;
- `trade_date` required;
- `execution_quantity > 0`;
- `execution_price_vnd_per_share > 0`;
- `gross_trade_value_vnd > 0`;
- `external_flow_class = NONE`;
- `posting_representation` required.

Validation:

```text
gross_trade_value_vnd
≈ execution_quantity × execution_price_vnd_per_share
```

The BUY must contain exactly one authoritative net `SECURITY_QUANTITY` increase for the purchased security and:

```text
net BUY quantity_delta = +execution_quantity
```

subject only to defined rounding/tolerance. Header execution quantity and ledger quantity may not silently disagree.

## 7.2 Cost basis

At trade-date recognition:

```text
acquisition_cost_vnd
= gross_trade_value_vnd
+ capitalized_attributable_buy_fee_vnd
+ capitalized_attributable_buy_tax_vnd

new_open_cost_vnd
= prior_open_cost_vnd + acquisition_cost_vnd
```

The BUY event facts drive this MWAC calculation. A normal BUY must not add a `COST_BASIS_ADJUSTMENT` leg.

## 7.3 Trade-date legs

The posted BUY event contains only trade-date accounting effects:

1. `SECURITY_QUANTITY +execution_quantity` effective at trade-date accounting timestamp.
2. `PAYABLE +net_purchase_obligation_vnd` effective at the same trade-date accounting timestamp.

The payable ensures economic NAV is not overstated before cash settlement. The BUY does **not** reserve a future settlement leg that would later need to be edited.

## 7.4 Settlement event

Actual settlement is a separate immutable `TRADE_SETTLEMENT` transaction with `settles_transaction_id = originating BUY transaction_id`. On settlement date it contains:

1. cash leg(s) reducing settled cash;
2. `PAYABLE -settled_amount_vnd` clearing the linked open obligation.

For a full settlement, `settled_amount_vnd = outstanding payable`. Partial settlement is permitted only with source evidence and leaves the residual payable open.

The settlement event must not contain `SECURITY_QUANTITY` or ordinary cost-basis changes and must not realize P&L.

## 7.5 Net-settlement representation — preferred

```text
net_purchase_obligation_vnd
= gross_trade_value_vnd
+ attributable fee_vnd
+ attributable tax_vnd
```

The linked `TRADE_SETTLEMENT` event posts:

- `CASH -net_purchase_obligation_vnd`;
- `PAYABLE -net_purchase_obligation_vnd`.

Header `fee_vnd` and `tax_vnd` are event facts only and are not posted again as cash.

## 7.6 Split-settlement representation

If source data explicitly requires gross + categorized charges:

- gross purchase cash leg;
- fee cash leg;
- tax cash leg where applicable;
- payable clearing must equal the total cash obligation exactly.

A fee/tax charge must never be embedded in a net cash amount **and** posted again as fee/tax cash.

---

# 8. SELL Posting Contract

## 8.1 Required event facts

For normal SELL:

- `transaction_type = SELL`;
- `security_id` required;
- `trade_date` required;
- `execution_quantity > 0`;
- `execution_quantity <= quantity held immediately before sell posting`;
- `execution_price_vnd_per_share > 0`;
- `gross_trade_value_vnd > 0`;
- `external_flow_class = NONE`.

The SELL must contain exactly one authoritative net `SECURITY_QUANTITY` decrease for the sold security and:

```text
net SELL quantity_delta = -execution_quantity
```

A mismatch between header execution quantity and posted quantity is a blocking reconciliation error.

## 8.2 Trade-date cost release and realized P&L

```text
cost_released_vnd
= execution_quantity × MWAC_before_sale

net_sale_proceeds_vnd
= gross_trade_value_vnd
- attributable_sell_fee_vnd
- attributable_sell_tax_vnd

realized_trading_pnl_vnd
= net_sale_proceeds_vnd - cost_released_vnd
```

Realized trading P&L is recognized exactly once at trade-date reconstruction.

## 8.3 Trade-date legs

1. `SECURITY_QUANTITY -execution_quantity`.
2. `RECEIVABLE +net_sale_proceeds_vnd`.

## 8.4 Settlement event

Actual settlement is a separate immutable `TRADE_SETTLEMENT` transaction with `settles_transaction_id = originating SELL transaction_id`. It posts:

1. settled cash receipt leg(s);
2. `RECEIVABLE -settled_amount_vnd` clearing the linked originating receivable.

For full settlement, the settled amount equals the outstanding receivable. Partial settlement requires source evidence and leaves the remainder open. Settlement does not realize P&L again.

## 8.5 Full exit

If SELL reduces quantity to zero:

- reconstructed `open_cost_vnd` must become zero within tolerance;
- no residual average cost remains;
- lifetime realized P&L history is retained;
- later BUY starts a new position cycle.

---

# 9. Cash Contribution and Withdrawal

## 9.1 CASH_DEPOSIT

Required:

- one positive settled `CASH` leg;
- `external_flow_class = CONTRIBUTION`;
- no security quantity leg;
- amount must represent owner capital, not sale proceeds/dividend/internal transfer.

## 9.2 CASH_WITHDRAWAL

Required:

- one negative settled `CASH` leg;
- `external_flow_class = WITHDRAWAL`;
- no security quantity leg.

A withdrawal cannot be used to classify fees, taxes, or purchases as external capital flows.

## 9.3 DCA relationship

Monthly DCA plans are planning records, not transactions.

A DCA period's `actual_contribution_vnd` derives from qualifying `CASH_DEPOSIT` transactions attributed to that period. Undeployed cash remains normal portfolio cash; it is not earmarked into a second cash balance.

---

# 10. Dividend Contract

## 10.1 Baseline accounting

Dividend income is recorded as `DIVIDEND_CASH`.

Baseline cash-basis posting:

- one positive cash leg on actual receipt/payment date under net representation, **or** gross cash plus explicit tax/charge cash legs under split representation;
- the two representations are mutually exclusive;
- withholding tax or other identifiable dividend charge must reconcile to net received cash.

For reconstructable dividend analytics, `DIVIDEND_CASH` must carry authoritative event facts sufficient to distinguish income from cash mechanics. Minimum logical facts are:

- `gross_dividend_vnd` when known;
- `withholding_tax_vnd` when applicable/known;
- `net_dividend_cash_vnd`;
- `dividend_event_id` or equivalent source evidence when available.

These facts may be implemented as typed fields in the physical schema or a versioned dividend-detail payload, but they must not be inferred from current market data. If only net cash is known, report net dividend cash and mark gross/tax analytics unavailable rather than inventing them.

## 10.2 Gross vs net dividend reporting

Where broker/source evidence contains both gross dividend and withholding tax:

```text
gross_dividend_income_vnd
net_dividend_cash_vnd
withholding_tax_vnd
```

must reconcile without recognizing cash twice.

A `DividendEvent` may store declaration/ex-date/record-date/payment-date/entitlement metadata, but it never independently changes cash.

## 10.3 Optional accrual lifecycle

If later reporting requires dividend receivable accounting, it may add a `RECEIVABLE` on entitlement recognition and clear it on payment. That policy must be versioned and applied consistently; cash-basis and accrual treatment must not both recognize the same income independently.

---

# 11. Fee and Tax Contract

## 11.1 Attributable trade charges

A fee/tax directly attributable to a BUY/SELL belongs to that trade event's header facts.

For accounting:

- BUY-attributable charge follows the approved acquisition-cost capitalization policy;
- SELL-attributable charge reduces net sale proceeds;
- settlement cash representation follows exactly one method: net or split.

## 11.2 Standalone FEE/TAX transaction

Use `FEE` or `TAX` only when the charge cannot correctly be attributed to a specific trade/event.

A standalone charge normally contains one negative settled cash-type leg.

It must not duplicate an amount already included in a BUY/SELL's event facts and settlement obligation.

---

# 12. Trade Date and Settlement Date

## 12.1 Accounting principle

The portfolio must distinguish economic ownership from settled cash.

For BUY:

```text
BUY event at trade date:                    quantity +, payable +
linked TRADE_SETTLEMENT at settlement date: cash -, payable -
```

For SELL:

```text
SELL event at trade date:                   quantity -, receivable +
linked TRADE_SETTLEMENT at settlement date: cash +, receivable -
```

This separation is required by immutability: a posted trade is never reopened later merely to append an actual settlement posting.

## 12.2 Settlement reconciliation

Every settlement clearing leg must reconcile to an open obligation/receivable from the originating trade.

Invalid states include:

- `TRADE_SETTLEMENT` without a valid `settles_transaction_id` pointing to a posted BUY/SELL;
- settlement without a matching open receivable/payable;
- clearing more than the outstanding amount;
- clearing the wrong trade obligation;
- leaving an unexplained residual after a fully settled trade.

If partial settlement occurs, residual balances are allowed only when supported by source evidence.

## 12.3 Historical replay

Historical state at timestamp `t` includes only legs with:

```text
parent Transaction.status = POSTED
AND TransactionLeg.effective_timestamp <= t
```

A transaction's later settlement leg must not appear in a historical state before its settlement effective timestamp.

Replay eligibility is evaluated **per leg**, not by assuming all legs of one parent share one effective date. Parent `event_timestamp` is only a deterministic tie-breaker after `TransactionLeg.effective_timestamp`; it does not accelerate a later-effective posting into an earlier historical state.

---

# 13. Corporate Actions

## 13.1 General rule

Corporate actions must never be implemented by directly editing Position quantity or average cost.

All accounting/security effects are posted as legs, linked to `CorporateActionEvent` when deterministic reconstruction requires action terms.

## 13.2 Required CorporateActionEvent cases

A linked event is required for actions including:

- split;
- reverse split;
- stock dividend / bonus shares;
- rights issue / rights subscription;
- merger;
- spinoff;
- tender/exchange;
- cash in lieu/fractional settlement;
- any action requiring basis transfer/reallocation.

## 13.3 Split / reverse split

Expected treatment:

- quantity changes via `SECURITY_QUANTITY` leg(s);
- total open cost remains unchanged;
- per-share average cost recomputes from unchanged total basis;
- no BUY/SELL realized P&L is created solely by the split.

## 13.4 Stock dividend / bonus share

- credited quantity uses official entitlement terms;
- do not infer ordinary BUY acquisition cost from positive quantity;
- basis treatment must follow documented project accounting/tax policy;
- if policy/official data are insufficient, flag `MISSING_CORPORATE_ACTION_TERMS` rather than guessing.

## 13.5 Rights subscription

If rights are exercised, the accounting treatment must be explicit and reconstructable:

- acquired security quantity is posted through `SECURITY_QUANTITY`;
- the subscription amount that becomes part of the acquired shares' cost basis is posted through a positive `COST_BASIS_ADJUSTMENT` linked to the same `CorporateActionEvent`;
- any subscription obligation created before payment is posted through `PAYABLE`;
- actual payment is posted later through `CASH` plus the offsetting payable-clearing leg, without changing basis a second time;
- the basis amount must reconcile to documented subscription consideration plus only those attributable charges that the approved accounting policy capitalizes;
- unexercised rights do not create fictitious shares, cash obligations, or cost basis.

A rights subscription must not be replayed as an ordinary `BUY` merely because quantity and cash both change. Its basis transition is governed by the corporate-action terms and the explicit basis-adjustment posting.

## 13.6 Merger / spinoff / basis transfer

When cost basis moves across securities:

- source-security basis reduction uses explicit negative `COST_BASIS_ADJUSTMENT`;
- destination-security basis increase uses explicit positive `COST_BASIS_ADJUSTMENT`;
- transferred basis must reconcile to documented allocation, subject only to explicitly realized cash-in-lieu or other recognized consideration;
- all source/destination quantity changes are posted independently through `SECURITY_QUANTITY` legs and must reconcile to official exchange ratios.

If a corporate action realizes cash consideration or cash-in-lieu, the event must provide authoritative consideration terms and the ledger must post the corresponding receivable/cash lifecycle. Any realized P&L is derived exactly once as:

```text
corporate_action_realized_pnl_vnd
= realized_cash_consideration_vnd
- basis_explicitly_removed_for_realized_fraction_vnd
```

The realized fraction's basis must be removed through an explicit negative `COST_BASIS_ADJUSTMENT`. The same basis may not also remain allocated to the continuing/destination security. If the required allocation or realization terms are unavailable, authoritative P&L/cost basis is blocked with `MISSING_CORPORATE_ACTION_TERMS`; no plug value is permitted.

## 13.7 Corporate-action lifecycle and immutable stages

A single `CorporateActionEvent` may describe the underlying issuer action, but each portfolio-changing stage must be represented by one or more immutable `CORPORATE_ACTION` transactions when that stage becomes authoritative. Examples include entitlement recognition, rights exercise, share credit, cash consideration, and cash-in-lieu settlement.

Rules:

- do not post speculative future cash/quantity legs merely because an announcement exists;
- do not reopen an already `POSTED` corporate-action transaction to append later settlement effects;
- later confirmed stages are new transactions linked to the same `CorporateActionEvent`;
- if an earlier stage was wrong, use reversal + corrected replacement;
- a rights subscription that creates an obligation before cash payment may create a `PAYABLE`, followed by a later corporate-action settlement transaction that posts `CASH` and clears that payable; `TRADE_SETTLEMENT` remains reserved for BUY/SELL settlement only;
- stage-level transactions must collectively reconcile to the official action terms and basis-allocation policy.

This preserves immutable history while allowing multi-date corporate actions to reconstruct correctly.

## 13.8 Basis-conservation invariant

For non-realizing basis-transfer corporate actions:

```text
sum(source basis removed)
≈ sum(destination basis added)
```

Any difference requires explicit documented realization/rounding treatment.

---

# 14. Opening Balance / Migration

## 14.1 Purpose

`OPENING_BALANCE` is allowed only when the system begins after the real portfolio already exists.

It is not a shortcut for normal operations.

## 14.2 Opening cash

Opening settled cash requires:

- `OPENING_BALANCE` Transaction;
- positive/negative `CASH` leg as appropriate;
- source evidence;
- `migration_method_version`.

## 14.3 Opening holdings

Each imported open holding requires enough authoritative state to reconstruct future MWAC:

- `SECURITY_QUANTITY +opening_quantity`;
- `COST_BASIS_ADJUSTMENT +verified_open_cost_vnd`;
- source evidence;
- migration method/version.

A typed Position row is not acceptable opening truth.

## 14.4 Historical limitations

If pre-inception transactions are unavailable, the system must not pretend to know:

- lifetime first purchase date;
- lifetime realized P&L before inception;
- lifetime dividend income before inception;
- true lifetime TWR before inception.

Such metrics are reported only from the supported inception boundary.

---

# 14A. Cash Adjustment Control

`CASH_ADJUSTMENT` is an exceptional correction event, not a routine reconciliation tool. It may be posted only when:

- there is source evidence for a real cash difference that cannot be represented by a more specific transaction type;
- the reason is documented;
- `external_flow_class = NONE`;
- it does not overwrite or mask an unresolved trade settlement, fee, tax, dividend, deposit, withdrawal, or corporate action;
- reconciliation remains auditable before and after the adjustment.

A broker statement difference alone is not permission to force ledger cash to match. Unknown differences remain reconciliation exceptions until explained.

---

# 15. Reversal and Correction

## 15.1 Reversal rules

A `REVERSAL` transaction:

- references exactly one prior posted transaction through `reverses_transaction_id`;
- uses opposite authoritative legs for all leg-posted effects being reversed;
- instructs the reconstruction engine to apply the **exact inverse of every derived accounting effect** of the referenced transaction from the reversal effective timestamp forward, including MWAC/open-cost changes and realized trading P&L that were derived from BUY/SELL header facts rather than stored as balance legs;
- is effective at the correction/reversal timestamp, not retroactively hidden from prior history;
- always stores `external_flow_class = NONE`.

A reversal is therefore not complete merely because cash/quantity/receivable/payable legs net to zero. For a BUY/SELL, the replay engine must also reverse the original transaction's versioned cost-basis/P&L state transition using the original event facts and the original pre-event state. No manually entered P&L or cost-basis "plug" is permitted.

### Owner-capital reversal rule

Because `external_flow_class` is reserved for actual `CASH_DEPOSIT` / `CASH_WITHDRAWAL` events, a REVERSAL does not duplicate that classification. Instead, external-flow reconstruction has one explicit semantic rule:

```text
if REVERSAL references CASH_DEPOSIT classified CONTRIBUTION:
    derived external flow at reversal effective time = equal WITHDRAWAL effect

if REVERSAL references CASH_WITHDRAWAL classified WITHDRAWAL:
    derived external flow at reversal effective time = equal CONTRIBUTION effect
```

The amount is derived from the authoritative reversed cash posting, not manually entered on the reversal header. This preserves both single-source classification and correct TWR/net-contributed-capital history. The original capital event remains visible before the reversal timestamp.

## 15.2 Exact-negation requirement

For ordinary reversal:

- original quantity leg `+q` → reversal `-q`;
- original cash `-x` → reversal `+x`;
- original receivable/payable changes are negated under the same account semantics;
- original basis-adjustment amount is negated.

For BUY/SELL, exact negation additionally requires inverse application of the original derived accounting transition:

- reversing a BUY removes the acquisition quantity and the acquisition cost that original BUY added;
- reversing a SELL restores the quantity and the exact cost released by the original SELL and negates that SELL's realized trading P&L;
- the reversal must use the accounting-rule version that governed the original event, not whatever rule happens to be current at reversal time.

If the correction is not a pure reversal, post a full reversal first, then a separate corrected replacement event.

## 15.3 Settled-trade correction dependency

If the event being corrected is a BUY/SELL that already has one or more posted `TRADE_SETTLEMENT` events, the trade must not be reversed in isolation. The correction must account for all dependent settlement events.

Baseline rule:

1. identify all posted `TRADE_SETTLEMENT` transactions linked to the trade;
2. reverse the affected settlement event(s);
3. reverse the originating BUY/SELL;
4. post corrected replacement trade;
5. post corrected settlement event(s) if the corrected trade should already be settled;
6. group the sequence with `correction_group_id` or equivalent `TransactionLink`.

The resulting correction group must reconcile cash, receivable/payable, quantity, cost basis, and realized P&L as a whole. A settled trade cannot be considered correctly reversed while its old settlement remains economically active.

Where intermediate legs in a same-timestamp correction would temporarily violate a balance invariant, validation may operate atomically at the documented correction-group boundary, but the final group result must satisfy all long-only and reconciliation invariants. This exception cannot be used for ordinary transactions.

## 15.4 Historical truth

A query for a time before the reversal effective timestamp must still show the original event's effect.

A query after the reversal must show original + reversal net result.

The system must never implement reversal by filtering the original event out of all historical replay.

---

# 16. Deterministic Reconstruction Order

Official replay order must remain identical to the approved `DATA_MODEL.md` v1.2 contract:

1. `TransactionLeg.effective_timestamp`;
2. parent `Transaction.event_timestamp`;
3. `Transaction.transaction_id`;
4. `TransactionLeg.leg_sequence`.

Database row order is never valid accounting order. `TRANSACTIONS.md` must not silently introduce a different authoritative tie-breaker. A future physical schema may add a monotonic import/posting sequence, but making it part of official replay requires a coordinated versioned change to `DATA_MODEL.md` and all dependent reconstruction logic.

---

# 17. Reconciliation Rules

## 17.1 Cash reconciliation

At any supported timestamp:

```text
settled_cash_vnd
= Σ all effective posted CASH/FEE_CASH/TAX_CASH/OTHER_CASH leg amounts
```

Broker cash statement balances are evidence only. Difference creates reconciliation status; it does not overwrite the ledger.

## 17.2 Quantity reconciliation

```text
position_quantity(security)
= Σ effective posted SECURITY_QUANTITY quantity_delta
```

Negative official quantity is prohibited for the long-only mandate.

## 17.3 Trade reconciliation

For each BUY/SELL:

- execution quantity × price ≈ gross trade value;
- gross value ± attributable fee/tax reconciles to trade obligation/receivable;
- settlement cash equals obligation/receivable cleared;
- fee/tax is represented once only.

## 17.4 Cost-basis reconciliation

For each security:

- ordinary BUY adds acquisition cost once;
- SELL releases MWAC cost once;
- settlement never changes basis;
- quantity zero implies open cost zero within tolerance;
- basis adjustment exists only for opening migration or documented corporate action/reversal.

## 17.5 Corporate-action reconciliation

- quantity change matches official terms;
- positive/negative basis adjustments reconcile to the documented acquisition, transfer, allocation, or realized fraction;
- non-realizing basis transfer conserves documented basis;
- rights subscription basis is added exactly once and does not change again at later cash settlement;
- cash-in-lieu/other realized consideration removes the corresponding basis exactly once and derives realized P&L exactly once;
- all receivable/payable/cash consideration stages reconcile across immutable stage transactions;
- missing action terms blocks authoritative cost-basis/P&L result.

---

# 18. Double-Counting Prevention Matrix

| Risk | Forbidden pattern | Correct pattern |
|---|---|---|
| BUY fee counted twice | net cash includes fee + separate FEE_CASH | choose net OR split representation |
| SELL tax counted twice | net proceeds reduced by tax + standalone TAX event | attributable tax stays in SELL event; no duplicate standalone tax |
| Dividend counted twice | DividendEvent changes income/cash + DIVIDEND_CASH changes cash | DividendEvent metadata only; transaction carries economic posting |
| Settlement P&L twice | realize on trade date and settlement | realize only at SELL trade-date reconstruction |
| BUY basis twice | acquisition cost from header + COST_BASIS_ADJUSTMENT | ordinary BUY uses event facts only |
| Corporate action treated as BUY | positive quantity automatically adds cost | dispatch by corporate-action terms |
| Cash Ledger divergence | manual cash balance edited separately | derived CashLedgerView only |
| Reversal rewrites history | original filtered from all dates | original remains; later reversal offsets prospectively |
| Opening NAV treated as contribution | opening migration classified CONTRIBUTION | OPENING_BALANCE external flow = NONE |

---

# 19. Mandatory Invariants

## 19.1 Ledger integrity

1. Every posted event has unique immutable `transaction_id`.
2. Every leg has unique immutable `transaction_leg_id`.
3. Only legs of a `POSTED` parent enter official state.
4. Posted Transaction/Leg records are never edited or deleted.
5. Each economic effect is represented exactly once.
6. Leg quantity and amount fields obey mutual exclusivity.
7. Long-only quantity may never become negative.
8. Normal BUY/SELL may not contain `COST_BASIS_ADJUSTMENT`.
9. BUY/SELL must use one settlement representation only.
10. External capital classification belongs only to owner deposit/withdrawal events; a REVERSAL of such an event contributes an inverse **derived** external flow through its reversal linkage.
11. Trade settlement is a separate `TRADE_SETTLEMENT` event linked to exactly one originating BUY/SELL and cannot realize P&L or cost basis again.
12. Settlement clearing cannot exceed or mismatch the linked open obligation/receivable.
13. Every reversal references a valid prior posted event.
14. Pure reversal legs exactly negate original authoritative legs under the same account semantics.
15. A settled BUY/SELL cannot be reversed in isolation from affected linked settlement events; the correction group must reconcile all dependencies.
16. Historical replay never removes an original event retroactively because it was later reversed.
17. A reversal of BUY/SELL must invert the original derived MWAC/open-cost/realized-P&L transition in addition to negating posted legs.
18. Posted portfolio-changing legs must represent authoritative effective stages; issuer announcements alone cannot create speculative future balances.
19. BUY/SELL header `execution_quantity` must equal the net matching `SECURITY_QUANTITY` posting for that event under the required sign convention.

## 19.2 Accounting reconstruction

20. Position quantity derives only from effective `SECURITY_QUANTITY` legs.
21. Settled cash derives only from effective cash-type legs.
22. Unsettled receivable/payable derives only from their corresponding legs.
23. Ordinary BUY/SELL MWAC/open-cost/cost-release/realized-P&L derive only from immutable event facts + matching postings + versioned accounting policy.
24. Cost basis must never become negative.
25. Quantity = 0 implies open cost = 0 within tolerance.
26. Realized SELL P&L is recognized once only.
27. Opening imported holdings require both quantity and verified open-cost evidence.
28. Corporate-action basis acquisition/transfer/realization requires explicit `COST_BASIS_ADJUSTMENT` postings where basis cannot be derived from ordinary BUY/SELL facts, with documented allocation and conservation/realization terms.
29. Rights-subscription basis may enter open cost once only; later obligation settlement cannot add basis again.
30. Cash-in-lieu or other realized corporate-action consideration must remove the corresponding realized fraction basis exactly once and derive realized P&L exactly once.
31. Missing required corporate-action terms causes a data-quality/reconciliation error; no guessing.

## 19.3 Auditability

32. Imported/broker-origin events should carry stable `source_reference` where available.
33. Duplicate source references for the same portfolio/source/event identity must be rejected or explicitly reviewed.
34. Corrections use reversal/replacement, never destructive edits.
35. Accounting/cost-basis calculation rules must carry a version in derived outputs.
36. All monetary accounting uses fixed-precision decimals in VND.

---

# 20. Reconstruction Acceptance Scenarios

An implementation is not accepted unless replay can correctly handle at least the following scenarios.

| # | Scenario | Expected result |
|---:|---|---|
| 1 | Cash deposit | settled cash increases; contribution increases; no P&L |
| 2 | BUY before settlement | quantity/open cost increase; payable exists; settled cash unchanged |
| 3 | Linked BUY `TRADE_SETTLEMENT` | cash decreases; payable clears; quantity/cost unchanged |
| 4 | Second BUY same security | MWAC recalculates correctly |
| 5 | Partial SELL before settlement | quantity/open cost decrease; realized P&L once; receivable exists |
| 6 | Linked SELL `TRADE_SETTLEMENT` | cash increases; receivable clears; no second P&L |
| 7 | Full exit | quantity = 0 and open cost = 0 |
| 8 | Re-entry after full exit | new position cycle; old realized P&L retained |
| 9 | Dividend receipt | cash/dividend income reconcile; no security basis change |
| 10 | Standalone fee | cash decreases once; no duplicate trade charge |
| 11 | Cash withdrawal | cash and net contributed capital decrease appropriately |
| 12 | Stock split | quantity changes; total basis unchanged |
| 13 | Rights subscription | quantity + explicit basis adjustment + obligation/cash settlement reconcile; basis added once |
| 14 | Merger/spinoff basis transfer | source/destination quantity and basis reconcile to action terms |
| 15 | Cash in lieu | realized-fraction basis is explicitly removed; cash consideration and realized P&L reconcile exactly once |
| 16 | Opening migrated cash | reconstructs inception settled cash without treating it as contribution |
| 17 | Opening migrated holding | quantity + verified open basis reconstruct correctly |
| 18 | Pure reversal | original remains historically visible; later state is neutralized |
| 19 | Reversal + corrected replacement | corrected post-reversal state reconstructs deterministically |
| 20 | Partial/unresolved settlement | residual receivable/payable remains visible and reconcilable |
| 21 | Duplicate broker import | duplicate source event is blocked/reviewed, not double posted |
| 22 | Missing corporate-action terms | state flags reconciliation/data-quality error instead of guessing basis |
| 23 | Reverse unsettled BUY | quantity and original acquisition cost are reversed; payable is negated; no cost-basis plug |
| 24 | Reverse SELL | sold quantity and exact released cost are restored; original realized P&L is negated from reversal time |
| 25 | Reverse SELL under newer accounting-rule version | reversal uses original transaction's rule version and exactly inverts original derived state transition |
| 26 | Multi-stage rights/corporate action | each confirmed stage posts separately; no mutation of prior event; payable/cash/quantity/basis reconcile across stages |
| 27 | Dividend with only net cash evidence | net cash/income remains reconstructable; gross/tax analytics are unavailable rather than guessed |

---

# 21. Data Quality States

Recommended transaction/reconstruction quality flags:

- `OK`
- `PENDING_SOURCE_CONFIRMATION`
- `DUPLICATE_SOURCE_REFERENCE`
- `TRADE_VALUE_MISMATCH`
- `SETTLEMENT_MISMATCH`
- `UNRESOLVED_RECEIVABLE`
- `UNRESOLVED_PAYABLE`
- `NEGATIVE_POSITION_ERROR`
- `COST_BASIS_RECONCILIATION_ERROR`
- `MISSING_CORPORATE_ACTION_TERMS`
- `CORPORATE_ACTION_BASIS_MISMATCH`
- `OPENING_BALANCE_EVIDENCE_MISSING`
- `REVERSAL_MISMATCH`

A data-quality error must not be hidden by manually editing Position/Cash derived states.

---

# 22. Design Risks and Mitigations

## Risk 1 — Header and legs both treated as the same kind of posting

**Impact:** Critical; cash/P&L/cost can double count.  
**Mitigation:** TransactionLeg exclusively mutates posted balance accounts. Ordinary BUY/SELL cost basis and realized P&L are derived only from immutable header event facts + matching authoritative legs + versioned accounting policy; header monetary/quantity facts are never posted again as extra balances.

## Risk 2 — Fee/tax representation ambiguity

**Impact:** Critical; NAV and realized P&L become incorrect.  
**Mitigation:** explicit `posting_representation`; net and split methods are mutually exclusive.

## Risk 3 — Settlement mutability or second-trade recognition

**Impact:** Critical; either posted trades must be edited later or cost basis/P&L can be recognized twice.  
**Mitigation:** BUY/SELL owns trade-date quantity/cost/P&L; actual settlement is a separate linked immutable `TRADE_SETTLEMENT` that owns cash and receivable/payable clearing only.

## Risk 4 — Corporate action inferred from quantity sign

**Impact:** Major; split/bonus/merger can corrupt MWAC.  
**Mitigation:** event-aware dispatch using CorporateActionEvent terms; no automatic BUY semantics for positive quantity.

## Risk 5 — Reversal destroys historical truth

**Impact:** Major; historical NAV/performance becomes non-auditable.  
**Mitigation:** original remains immutable; reversal offsets only from its own effective timestamp.

## Risk 6 — Broker statement overwrites ledger

**Impact:** Major; no reproducible source of truth.  
**Mitigation:** statements become ReconciliationObservation/evidence only.

## Risk 7 — Imported opening state lacks basis

**Impact:** Major; all later realized/unrealized P&L is unreliable.  
**Mitigation:** opening security quantity plus verified `COST_BASIS_ADJUSTMENT` required.

## Risk 8 — Identical timestamps replay differently

**Impact:** Major for same-security cost-basis events.  
**Mitigation:** use the exact deterministic ordering contract approved in `DATA_MODEL.md`; do not introduce an unversioned alternative tie-breaker in this file.

## Risk 9 — Reversal negates legs but not derived BUY/SELL accounting

**Impact:** Critical; quantity/cash can appear corrected while open cost or realized P&L remains wrong.  
**Mitigation:** reversal engine applies the exact inverse of the referenced transaction's versioned derived accounting transition as well as opposite legs.

## Risk 10 — Multi-stage corporate action mutates a prior event

**Impact:** Major; future settlement/credit can destroy immutability or historical replay.  
**Mitigation:** one reference `CorporateActionEvent`, multiple immutable stage transactions as effects become authoritative.

## Risk 11 — Dividend income cannot be reconstructed from net cash alone

**Impact:** Major for gross-income/tax analytics.  
**Mitigation:** preserve gross/tax/net event facts when known; otherwise expose only supported net analytics and mark unavailable dimensions explicitly.

---

# 23. Review — Portfolio Manager

## Findings resolved in this design

- Trade-date ownership and settlement-date cash are separated, preventing misleading liquidity/NAV state.
- External capital flows are isolated from portfolio trading flows, supporting valid TWR/drawdown analytics.
- Realized P&L cannot be recognized again at settlement.
- DCA contributions remain cash until actual BUY; no forced deployment or fictitious earmarking.
- Legacy/corporate-action holdings remain reconstructable rather than edited manually.

### Portfolio Manager result

**Critical unresolved: 0**  
**Major unresolved: 0**

---

# 24. Review — Data Architect

## Findings resolved in this design

- Transaction header and posting legs have distinct ownership.
- Cash Ledger is a derived projection, not duplicated storage truth.
- Effective timestamps and deterministic sequencing make historical replay reproducible.
- Opening migration and reversals are ledger-native rather than snapshot exceptions.
- Source references support idempotent import/reconciliation controls.

### Data Architect result

**Critical unresolved: 0**  
**Major unresolved: 0**

---

# 25. Review — Risk Manager

## Findings resolved in this design

- Negative holdings are prohibited under the long-only mandate.
- Trade obligations/receivables must reconcile before being considered settled.
- Missing corporate-action terms produce an error rather than guessed basis.
- Double-count controls cover fees, taxes, dividends, cost basis, settlement, and reversal.
- Reconstruction from zero state or auditable opening state is mandatory.

### Risk Manager result

**Critical unresolved: 0**  
**Major unresolved: 0**

---

# 25A. Focused Re-review — v1.1 → v1.2

This review specifically tested source of truth, double counting, cost basis, cash reconciliation, corporate actions, and deterministic reconstruction against the approved `DATA_MODEL.md` v1.2 and `PORTFOLIO.md` v1.1 contracts.

## Critical issue resolved

### TX11-C1 — Reversal did not explicitly invert derived BUY/SELL accounting

**Failure mode:** opposite cash/quantity legs could reconstruct while BUY acquisition cost, SELL cost release, or realized P&L remained active because those values are derived from header facts rather than stored as balance legs.

**Resolution:** a BUY/SELL reversal now must apply the exact inverse of the original versioned derived accounting state transition, in addition to negating posted legs.

**Status:** Resolved.

## Major issues resolved

### TX11-M1 — Replay order conflicted with approved DATA_MODEL

**Failure mode:** this file inserted `posting_sequence` ahead of the approved tie-breakers, allowing two compliant implementations to reconstruct different MWAC/P&L.

**Resolution:** restored the exact `DATA_MODEL.md` v1.2 ordering. Any future monotonic sequence requires coordinated model versioning.

**Status:** Resolved.

### TX11-M2 — Multi-stage corporate actions lacked an immutable lifecycle

**Failure mode:** rights exercise/share credit/cash settlement could tempt an implementation to append future legs to an already posted event or misuse `TRADE_SETTLEMENT`.

**Resolution:** corporate actions now use one reference event plus separate immutable stage transactions; corporate-action payable settlement uses another `CORPORATE_ACTION` stage transaction, not `TRADE_SETTLEMENT`.

**Status:** Resolved.

### TX11-M3 — Dividend gross/net/tax facts were under-specified

**Failure mode:** net cash was reconstructable but gross dividend income and withholding tax could require guesses or produce double counting.

**Resolution:** require gross/tax/net event facts when known, enforce mutually exclusive net-vs-split cash posting, and mark unsupported gross analytics unavailable when only net evidence exists.

**Status:** Resolved.

### TX11-M4 — Speculative future corporate-action postings could enter official state

**Failure mode:** announced future terms could create authoritative future legs that later require destructive edits.

**Resolution:** posted balance-changing stages require authoritative evidence; announcements remain pending/reference data until an effective stage is confirmed.

**Status:** Resolved.

### TX11-M5 — “Only legs change balances” conflicted with derived cost-basis semantics

**Failure mode:** an implementation could either incorrectly demand a cost-basis posting for ordinary BUY/SELL or ignore header-driven MWAC/P&L because the source-of-truth statement treated every accounting state as a posted balance.

**Resolution:** legs are now exclusive for posted balance accounts; ordinary BUY/SELL cost basis and realized P&L are explicitly derived from immutable header facts + matching postings + versioned policy.

**Status:** Resolved.

### TX11-M6 — Header execution quantity could disagree with quantity posting

**Failure mode:** source facts could say 100 shares while replayed ledger quantity changed by a different amount, corrupting both holdings and MWAC.

**Resolution:** BUY/SELL header quantity must reconcile exactly to the net matching `SECURITY_QUANTITY` leg under the required sign convention.

**Status:** Resolved.

## Final focused audit result

| Area | Result |
|---|---|
| Source of truth | PASS |
| Double-counting protection | PASS |
| BUY/SELL source-fact ↔ quantity-leg reconciliation | PASS |
| BUY/SELL cost basis | PASS |
| Reversal of derived cost/P&L | PASS |
| Cash/receivable/payable reconciliation | PASS |
| Trade settlement | PASS |
| Corporate-action lifecycle | PASS |
| Corporate-action basis conservation | PASS |
| Dividend reconstruction | PASS |
| Deterministic historical replay | PASS |
| Opening migration | PASS |
| Critical unresolved | **0** |
| Major unresolved | **0** |

---

---

# 25B. Final Audit Closure — v1.2

This re-review focused specifically on source of truth, double counting, cost basis, cash reconciliation, corporate actions, and deterministic reconstruction.

## Critical issues closed

1. **Reversal previously guaranteed opposite posted legs but did not fully guarantee inversion of BUY/SELL derived cost-basis and realized-P&L effects.**  
   **Fix:** REVERSAL now explicitly inverts the referenced transaction's versioned derived accounting transition, in addition to negating posted legs. Historical truth remains prospective from the reversal timestamp.

2. **The phrase “only legs change portfolio balances” could be misread as making BUY/SELL cost basis/P&L leg-posted or, conversely, as permitting header facts to be counted as additional postings.**  
   **Fix:** TransactionLeg is exclusive for posted balance accounts; ordinary BUY/SELL open cost, MWAC, cost release, and realized P&L are derived only from immutable event facts + matching authoritative legs + versioned policy. Header facts never create a second cash/quantity posting.

## Major issues closed

1. **Historical replay eligibility was not explicit enough at leg level.**  
   **Fix:** eligibility is evaluated per `TransactionLeg.effective_timestamp`; parent event time is only a later tie-breaker.

2. **This file risked introducing a replay tie-breaker different from the approved DATA_MODEL contract.**  
   **Fix:** official order is locked to `effective_timestamp → event_timestamp → transaction_id → leg_sequence`.

3. **Multi-stage corporate actions could have been implemented by reopening a posted event.**  
   **Fix:** each authoritative stage is a new immutable `CORPORATE_ACTION` transaction linked to the same `CorporateActionEvent`.

4. **Rights subscription did not explicitly identify the authoritative basis posting.**  
   **Fix:** subscription basis enters through explicit `COST_BASIS_ADJUSTMENT` exactly once; later cash settlement clears obligation only.

5. **Cash-in-lieu / realized corporate-action consideration did not fully specify basis removal and realized-P&L ownership.**  
   **Fix:** realized-fraction basis is explicitly removed once and realized P&L is derived once from authoritative consideration less that removed basis.

## Final gate

- Critical unresolved: **0**
- Major unresolved: **0**
- Source-of-truth audit: **PASS**
- Double-counting audit: **PASS**
- Cost-basis audit: **PASS**
- Cash-reconciliation audit: **PASS**
- Corporate-action audit: **PASS**
- Deterministic reconstruction audit: **PASS**

**Final status:** `PRODUCTION-READY — AWAITING USER APPROVAL`

---

# 26. Final Production Gate
`TRANSACTIONS.md` is ready for review/approval only if all statements below remain true:

- Transaction + TransactionLeg are the sole authoritative economic ledger.
- Only legs change posted balance accounts; ordinary BUY/SELL cost/P&L is deterministic derived state from event facts + postings + versioned policy.
- Cash Ledger is derived.
- BUY/SELL trade-date effects and linked immutable `TRADE_SETTLEMENT` events are separate.
- Fee/tax double counting is structurally prohibited.
- MWAC is reconstructable without mutable Position state.
- Corporate actions cannot silently rewrite quantity/basis.
- Reversals preserve historical truth and exactly invert derived BUY/SELL cost-basis/P&L transitions.
- Opening migration contains explicit cash/quantity/open-cost evidence.
- Portfolio can be reconstructed at any supported timestamp from posted events/legs plus versioned policy.

**Current status: PRODUCTION-READY — RE-REVIEWED; AWAITING USER APPROVAL**

---

# 27. Approval Gate

Do not proceed to `VN30_MASTER.md` until this document has been reviewed and explicitly approved.

Recommended next review focus:

1. source of truth and double-counting;
2. BUY/SELL posting math;
3. fee/tax treatment;
4. trade vs settlement timing;
5. cost-basis reconstruction;
6. corporate actions;
7. reversal semantics;
8. opening migration;
9. idempotent broker import and reconciliation.

---
