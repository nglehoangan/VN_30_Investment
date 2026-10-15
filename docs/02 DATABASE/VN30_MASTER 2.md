# VN30 Value Investing OS — VN30 Master

**Document:** `02_DATABASE/VN30_MASTER.md`  
**Milestone:** 2 — Portfolio Data Model & Database  
**Version:** 1.2  
**Status:** PRODUCTION-READY — RE-REVIEWED; AWAITING USER APPROVAL  
**Depends on:** `DATA_MODEL.md` v1.2 (approved), `PORTFOLIO.md` v1.1 (approved), `TRANSACTIONS.md` v1.2 (approved)

---

# 1. Purpose

This document defines the authoritative logical model and operating rules for the VN30 investable universe and its history.

It must answer, deterministically and for any supported date:

1. What security does a ticker refer to?
2. Was that security a VN30 constituent on a given date?
3. When did it enter or leave VN30?
4. Has it left and later re-entered the index?
5. Which holdings are current VN30 members versus Legacy Holdings?
6. Was a BUY eligible under the VN30-only policy on its effective trade date?
7. Can the historical VN30 constituent set be reconstructed without relying on today's membership list?
8. Is the source data complete enough to assert that an as-of constituent set contains exactly 30 securities?

This document does **not** define portfolio accounting, transaction posting, benchmark return methodology, scoring metrics, or sector taxonomy rules except where required for reference integrity.

---

# 2. Design Principles

1. **Stable security identity with effective-dated identifiers.** `security_id` is durable; ticker/company-name identifiers must remain resolvable as-of historical dates.
2. **Effective-dated membership.** VN30 membership is represented as non-overlapping time intervals.
3. **No mutable `current_member` truth.** Current membership is always derived from effective dates.
4. **Announcement date is not effective date.** Eligibility changes only on the official effective date.
5. **Historical membership is never rewritten to match today's index.**
6. **Re-entry creates a new membership period.** It never reopens or edits the previous period.
7. **Incomplete market/reference data must be flagged, not guessed.**
8. **Portfolio ownership and index eligibility are independent states.** Leaving VN30 does not delete a holding or transaction history.
9. **Sector is canonical reference data, not duplicated into membership rows.** Effective-dated security→sector history is owned by `SECTOR_MASTER.md`; any current `SecurityMaster.sector_id` is convenience only.
10. **Market-source provenance is retained sufficiently to audit constituent changes.**
11. **Absence is not evidence.** A missing membership row may be interpreted as non-membership only when authoritative coverage for that date is confirmed.
12. **Entry and exit evidence are distinct.** Membership boundaries must be traceable to their own authoritative index events/revisions.

---

# 3. Scope and Ownership Boundaries

## 3.1 Owned by this document

- `SecurityMaster` contract relevant to VN30 securities;
- `VN30Membership` effective-dated history;
- constituent set reconstruction;
- entry/exit/re-entry semantics;
- VN30 eligibility lookup;
- Legacy Holding classification contract;
- constituent-source provenance and completeness controls;
- validation rules for index membership history.

## 3.2 Owned elsewhere

| Concern | Owner |
|---|---|
| Transaction accounting and BUY effective time | `TRANSACTIONS.md` |
| Portfolio Position and Legacy Holding exposure | `PORTFOLIO.md` |
| Sector taxonomy and mappings | `SECTOR_MASTER.md` |
| VN30 index levels / portfolio benchmark returns | `BENCHMARK.md` |
| Cross-entity logical architecture | `DATA_MODEL.md` |

No rule in this file may create a second accounting or sector source of truth.

---

# 4. Logical Entity Relationship

```text
SectorMaster
    1
    |
    | current canonical sector reference
    v
SecurityMaster
    1
    +----------------------< SecurityIdentifierHistory
    |
    +----------------------< VN30Membership >--------------------1 IndexReviewEvent
    |                                                           entry/exit evidence
    +----------------------< Transaction / Position (elsewhere)

VN30CoveragePeriod / ConstituentSnapshot
    |
    +--> proves whether membership absence can be interpreted as FALSE

VN30Membership(as_of_date)
    |
    +--> current VN30 eligibility
    +--> entry/exit history
    +--> Legacy Holding classification when joined to Position
```

`VN30Membership` references `SecurityMaster` by `security_id`, never by ticker alone.

---

# 5. Source-of-Truth Model

## 5.1 Security identity

**Authoritative logical identity:** `SecurityMaster.security_id`.

Ticker, company name and sector are not allowed to replace `security_id` in historical accounting joins.

Reason:

- ticker can change;
- company name can change;
- sector classification can change;
- a durable identifier prevents historical transactions from breaking when display/reference attributes change.

## 5.2 VN30 membership

**Authoritative membership truth:** effective-dated rows in `VN30Membership`.

The following are **calculated convenience values**, never independently maintained facts:

- `current_member`;
- `current_member_of_vn30`;
- `entry_event`;
- `exit_event`;
- `legacy_holding`;
- current constituent count.

## 5.3 Coverage/completeness truth

**Authoritative coverage truth:** effective-dated `VN30CoveragePeriod` and/or validated complete `ConstituentSnapshot` records.

A membership lookup is tri-state:

```text
TRUE    = an active VN30Membership interval exists
FALSE   = no active interval exists AND authoritative coverage for the date is COMPLETE_CONFIRMED
UNKNOWN = no active interval exists AND authoritative coverage is absent/incomplete/unsupported
```

This rule is mandatory. A bare absence of `VN30Membership` rows must never be converted directly to `false`.

## 5.4 Index-event provenance truth

Entry and exit boundaries are evidenced by distinct immutable/versioned `IndexReviewEvent` records (or equivalent source revisions). `VN30Membership` may summarize the effective interval, but the event/revision record is the authoritative provenance for why each boundary exists.

## 5.5 Official source hierarchy

Implementation should prefer constituent membership information in this order:

1. authoritative index/exchange publication;
2. official constituent/review notice or machine-readable official source;
3. trusted secondary market-data source only when official data is temporarily unavailable.

If a secondary source is used, it must be identifiable through provenance metadata and should later be reconciled against authoritative data.

The model must never invent an entry/exit date from price behavior, news headlines or today's constituent list.

---

# 6. SecurityMaster

## 6.1 Purpose

Canonical identity for securities that are, were, or may become relevant to VN30 portfolio history.

A security must remain in `SecurityMaster` after it leaves VN30 if historical membership, transactions, dividends, corporate actions or holdings refer to it.

## 6.2 Logical schema

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `security_id` | UUID/string | REFERENCE_RAW | Yes | Stable internal identity; immutable after creation. |
| `ticker` | string | REFERENCE_RAW | Yes | Current canonical exchange ticker for display/search. |
| `company_name` | string | REFERENCE_RAW | Yes | Current canonical company name. |
| `exchange` | string | REFERENCE_RAW | Yes | Normally `HOSE` for VN30 scope. |
| `security_type` | enum | REFERENCE_RAW | Yes | Normally `COMMON_STOCK`. |
| `sector_id` | FK | REFERENCE_DERIVED/CACHE | No | Current convenience sector reference only. Historical/current authoritative security→sector assignment is owned by effective-dated mapping in `SECTOR_MASTER.md`; this field must not drive historical allocation. |
| `active_from` | date | REFERENCE_RAW | No | First known active/reference date if available. |
| `active_to` | date | REFERENCE_RAW | No | Null while active; not a VN30 membership end date. |
| `notes` | text | REFERENCE_RAW | No | Non-authoritative notes. |

## 6.3 Identity invariants

1. `security_id` is unique and immutable.
2. Historical transactions and membership rows reference `security_id`, not ticker as their durable key.
3. A security leaving VN30 does not set `active_to` unless the security itself is no longer active/relevant for the reason defined by the security master policy.
4. `active_to` must not be confused with `VN30Membership.member_to`.
5. `company_name` and `ticker` changes must not create a new security merely for presentation changes when economic identity is unchanged.
6. A merger into a genuinely different surviving/new security may require a separate `security_id`; accounting transformation belongs to corporate-action logic in `TRANSACTIONS.md`.

## 6.4 SecurityIdentifierHistory

Historical identifier resolution is required, not optional, because ticker/company identifiers may change or be reused.

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `identifier_history_id` | UUID/string | REFERENCE_RAW | Yes | Unique row. |
| `security_id` | FK | REFERENCE_RAW | Yes | Durable economic identity. |
| `identifier_type` | enum | REFERENCE_RAW | Yes | `TICKER`, `COMPANY_NAME`, exchange code or later supported identifier type. |
| `identifier_value` | string | REFERENCE_RAW | Yes | Historical value. |
| `valid_from` | date | REFERENCE_RAW | Yes | Inclusive date. |
| `valid_to` | date | REFERENCE_RAW | No | Exclusive date; null while current. |
| `source_event_id` | FK | REFERENCE_RAW | No | Provenance when available. |

Mandatory rules:

1. Transaction/accounting storage still uses `security_id`; identifier history is for ingestion, display and audit resolution.
2. For the same exchange + identifier type/value, overlapping validity intervals across two different securities are prohibited unless the source explicitly permits ambiguity and the record is flagged unresolved.
3. Ticker-only historical inputs must be resolved using the transaction/effective date. If resolution is ambiguous, ingestion must stop for manual reconciliation; never guess the `security_id`.
4. A rename does not by itself create a new `security_id`; a true economic successor/new listed security may.
5. `SecurityMaster.ticker` and `company_name` are current convenience attributes and must be derivable from the open identifier-history records.

---

# 7. VN30Membership

## 7.1 Purpose

Stores each continuous period during which one security is an official VN30 constituent.

A security that exits and later re-enters must have multiple membership rows.

## 7.2 Date convention

Membership uses a half-open interval:

```text
[member_from, member_to)
```

Meaning:

- `member_from` is **inclusive**;
- `member_to` is **exclusive**;
- `member_to = NULL` means membership continues after `member_from` until an authoritative exit becomes effective.

Therefore:

```text
is_member(security, as_of_date)
=
member_from <= as_of_date
AND (member_to IS NULL OR as_of_date < member_to)
```

This convention is mandatory across all later implementations.

## 7.3 Logical schema

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `membership_id` | UUID/string | MARKET/REFERENCE_RAW | Yes | Unique membership period. |
| `security_id` | FK | MARKET/REFERENCE_RAW | Yes | References `SecurityMaster`. |
| `index_code` | string | MARKET/REFERENCE_RAW | Yes | `VN30` in current project scope. |
| `member_from` | date | MARKET/REFERENCE_RAW | Yes | Inclusive official effective date. |
| `member_to` | date | MARKET/REFERENCE_RAW | No | Exclusive official exit effective date; null while open. |
| `entry_event_id` | FK | MARKET/REFERENCE_RAW | Yes | References authoritative/versioned `IndexReviewEvent` supporting `member_from`. |
| `exit_event_id` | FK | MARKET/REFERENCE_RAW | No | References authoritative/versioned `IndexReviewEvent` supporting `member_to`; null while open. |
| `recorded_at` | timestamp | SYSTEM_METADATA | Yes | When this interval version entered the OS. |
| `superseded_at` | timestamp | SYSTEM_METADATA | No | Set only when a corrected interval version supersedes this version. |
| `notes` | text | MARKET/REFERENCE_RAW | No | Non-authoritative context. |

Every effective boundary requires provenance. Historical data lacking sufficient evidence remains `UNVERIFIED/UNKNOWN`; it must not silently become authoritative eligibility truth.

## 7.4 Why `current_member` is not stored

A mutable boolean creates three failure modes:

1. it can disagree with membership dates;
2. updating it can erase knowledge of historical eligibility;
3. old portfolio decisions can be evaluated against today's membership instead of the membership effective on the trade date.

Therefore current state is always a query over dated rows.

---

# 8. IndexReviewEvent and Boundary Provenance

## 8.1 Purpose

`IndexReviewEvent` records the authoritative announcement/review evidence that introduces, removes, corrects or confirms constituent membership boundaries. It separates source evidence from the effective membership interval itself.

## 8.2 Logical schema

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `index_event_id` | UUID/string | MARKET/REFERENCE_RAW | Yes | Stable event/revision identity. |
| `index_code` | string | MARKET/REFERENCE_RAW | Yes | `VN30`. |
| `event_type` | enum | MARKET/REFERENCE_RAW | Yes | `REVIEW`, `AD_HOC_CHANGE`, `CORRECTION`, `INITIAL_SNAPSHOT`, `OTHER_OFFICIAL`. |
| `announcement_date` | date | MARKET/REFERENCE_RAW | No | Publication date when known. |
| `effective_date` | date | MARKET/REFERENCE_RAW | Yes | Date on which the event changes/confirms membership. |
| `source_type` | enum | MARKET/REFERENCE_RAW | Yes | `OFFICIAL`, `SECONDARY_VERIFIED`. |
| `source_reference` | string | MARKET/REFERENCE_RAW | Yes* | Document/URL/source identifier. |
| `source_revision` | string | MARKET/REFERENCE_RAW | No | Source revision/version where available. |
| `recorded_at` | timestamp | SYSTEM_METADATA | Yes | Ingestion timestamp. |
| `supersedes_event_id` | FK | SYSTEM_METADATA | No | Links a correction to prior event without deleting it. |

`*` If legacy history lacks a retrievable reference, the event must be explicitly marked unverified and cannot by itself upgrade coverage to `COMPLETE_CONFIRMED`.

## 8.3 Event immutability

Once accepted, an index event is not silently overwritten. A later authoritative correction creates a new event/revision linked by `supersedes_event_id`; derived membership intervals are rebuilt from the latest accepted event chain.

---

# 9. Announcement vs Effective Membership

Index review publications often announce constituent changes before those changes become effective.

The model explicitly separates:

- `announcement_date` — when the market learns the change;
- `member_from` / `member_to` — when index membership actually changes.

## Mandatory eligibility rule

For a proposed BUY at effective trade date `D`:

```text
eligible_for_new_capital(D)
=
is_member_of_vn30(D)
```

Not:

```text
announcement_date <= D
```

Therefore a security announced for future inclusion is **not yet eligible** until `member_from`.

A security announced for future removal remains a member until its `member_to` becomes effective, subject to any separate investment policy decision; membership data itself must not anticipate the exit.

---

# 10. Constituent Entry, Exit and Re-entry

## 10.1 Entry

A constituent entry is represented by the start of a membership period.

```text
member_from = official effective inclusion date
```

## 10.2 Exit

An exit is represented by setting the previous continuous period's exclusive `member_to` to the official effective removal date.

The historical row remains queryable permanently.

## 10.3 Re-entry

If a security leaves and later returns:

```text
period 1: [A, B)
period 2: [C, NULL)
where C >= B
```

A re-entry must **not**:

- reopen period 1;
- erase the prior exit;
- merge separated periods;
- alter historical eligibility between `B` and `C`.

## 10.4 Same-day boundary

Under half-open intervals, a same-day replacement is unambiguous:

- outgoing member: `member_to = D` → not a member on `D`;
- incoming member: `member_from = D` → member on `D`.

This keeps constituent-count reconstruction deterministic.

---

# 11. Current Constituent Set Reconstruction

For any `as_of_date = D`:

```text
VN30_set(D)
=
all SecurityMaster rows
joined to VN30Membership
where index_code = 'VN30'
and member_from <= D
and (member_to IS NULL or D < member_to)
```

This set is authoritative only when coverage for `D` is `COMPLETE_CONFIRMED`. If coverage is incomplete or unsupported, the query must return the observed set together with a non-complete coverage status; it must not claim that the observed set is the full VN30 universe.

No current constituent table is required as a second source of truth. A dashboard may materialize/cache this set for performance, but the cache is disposable and must be reproducible from membership history + accepted reference-data revisions.

---

# 12. Completeness and Constituent-Count Control

VN30 is expected to contain 30 constituents when authoritative data for an effective date is complete.

However, the system must distinguish:

```text
observed_count != 30 because data is incomplete
```

from:

```text
actual authoritative constituent set is known to be different
```

The system must never fabricate a missing member merely to force the count to 30.

## 12.1 VN30CoveragePeriod

Coverage evidence is mandatory because membership absence is meaningful only inside a date range known to be complete.

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `coverage_id` | UUID/string | MARKET/REFERENCE_RAW | Yes | Unique coverage assertion/version. |
| `index_code` | string | MARKET/REFERENCE_RAW | Yes | `VN30`. |
| `coverage_from` | date | MARKET/REFERENCE_RAW | Yes | Inclusive supported date. |
| `coverage_to` | date | MARKET/REFERENCE_RAW | No | Exclusive end; null if coverage continues. |
| `coverage_status` | enum | MARKET/REFERENCE_RAW | Yes | `COMPLETE_CONFIRMED`, `INCOMPLETE_SOURCE_DATA`, `COUNT_MISMATCH_REQUIRES_RECONCILIATION`, `UNSUPPORTED`. |
| `source_event_id` | FK | MARKET/REFERENCE_RAW | Yes* | Evidence supporting the coverage assertion. |
| `recorded_at` | timestamp | SYSTEM_METADATA | Yes | Ingestion timestamp. |
| `superseded_at` | timestamp | SYSTEM_METADATA | No | Used when authoritative correction replaces the assertion. |

`*` Legacy unsupported periods may reference a designated provenance record rather than a fabricated document.

Coverage intervals for the same index must not overlap with contradictory active statuses. Corrections create a superseding version; they do not silently overwrite audit history.

## 12.2 ConstituentSnapshot / ingestion evidence

A complete official constituent list may be recorded as a `ConstituentSnapshot` or equivalent audited ingestion batch. Suggested fields:

- `snapshot_id`;
- `index_code`;
- source document/reference;
- published/announcement date;
- effective date;
- ingestion timestamp;
- expected constituent count;
- observed constituent count;
- validation result;
- source revision;
- `supersedes_snapshot_id` where corrected.

A validated snapshot may support a `COMPLETE_CONFIRMED` coverage assertion. It is evidence for membership reconstruction, not a second editable constituent truth. Membership intervals remain the normalized as-of query model.

## 12.3 Mandatory query result

For date `D`, membership lookup must return one of:

```text
MEMBER
NON_MEMBER_CONFIRMED
UNKNOWN_OR_UNSUPPORTED
```

`NON_MEMBER_CONFIRMED` is legal only when coverage at `D` is `COMPLETE_CONFIRMED` and no active membership interval exists.

The following calculated validation states are supported:

- `COMPLETE_CONFIRMED` — authoritative constituent set is complete and reconstructed count = 30;
- `INCOMPLETE_SOURCE_DATA` — one or more facts are missing/unverified;
- `COUNT_MISMATCH_REQUIRES_RECONCILIATION` — data claims completeness but reconstructed count != 30;
- `HISTORICAL_COVERAGE_NOT_SUPPORTED` — date is outside trusted coverage.

The system must never fabricate a constituent merely to force observed count to 30.

---

# 13. Legacy Holdings

Membership and ownership are independent.

For portfolio `P`, security `S`, date `D`:

```text
holding_membership_status(P,S,D) =
    CURRENT_MEMBER      if quantity > 0 and membership = MEMBER
    LEGACY_HOLDING      if quantity > 0 and membership = NON_MEMBER_CONFIRMED
    MEMBERSHIP_UNKNOWN  if quantity > 0 and membership = UNKNOWN_OR_UNSUPPORTED
```

## Rules

1. Leaving VN30 does not delete the Position.
2. Leaving VN30 does not alter quantity, cost basis, NAV or P&L.
3. Legacy Holdings remain included in:
   - portfolio NAV;
   - stock allocation;
   - sector allocation;
   - concentration risk;
   - realized/unrealized P&L history.
4. `LEGACY_HOLDING` is a calculated status, never manually toggled. It may be assigned only from `NON_MEMBER_CONFIRMED`, never from unknown coverage.
5. A positive holding with unknown/unsupported membership must be classified `MEMBERSHIP_UNKNOWN` and must trigger a data-quality/risk flag; it must not be silently treated as Legacy or current member.
6. New-capital eligibility is evaluated separately under investment policy.
7. If the security later re-enters VN30, current membership becomes true from the new `member_from`; historical Legacy Holding periods remain reconstructable.

---

# 14. Eligibility Contract with Transactions

The VN30-only investment policy requires the transaction layer to be able to validate BUY eligibility without changing membership data.

For an ordinary BUY:

```text
trade_date = transaction accounting/effective trade date defined in TRANSACTIONS.md
```

Then:

```text
BUY eligibility result =
    ELIGIBLE              if membership = MEMBER
    INELIGIBLE_CONFIRMED  if membership = NON_MEMBER_CONFIRMED
    BLOCKED_UNKNOWN       if membership = UNKNOWN_OR_UNSUPPORTED
```

## Important separation

Membership validation answers:

> “Was this security in VN30 on the BUY date?”

It does **not** determine:

- whether valuation justified the BUY;
- whether portfolio concentration permitted the BUY;
- whether DCA should be deployed;
- whether a Legacy Holding should be sold.

Those belong to later decision/risk engines and M1 policy.

## Historical audit

A historical BUY must not be declared policy-invalid solely because reference coverage is unknown. `BLOCKED_UNKNOWN` means evidence is insufficient; it is not equivalent to confirmed non-membership.



When reviewing an old transaction, always query membership **as of that transaction's trade date**, never today's membership.

---

# 15. Security Name, Ticker and Sector Duplication Rules

The originally requested VN30 master display fields include:

- ticker;
- company name;
- sector;
- membership dates;
- current status.

Logical storage must avoid duplication:

| Requested field | Authoritative source |
|---|---|
| `ticker` | `SecurityMaster.ticker` |
| `company_name` | `SecurityMaster.company_name` |
| `sector` | As-of security→sector mapping owned by `SECTOR_MASTER.md` (current convenience may surface through `SecurityMaster.sector_id`) |
| `index_member_from` | `VN30Membership.member_from` |
| `index_member_to` | `VN30Membership.member_to` |
| `current_member` | Calculated from membership interval |
| `notes` | Appropriate reference/membership notes field |

A convenient `VN30MasterView` may join these fields for dashboard/export use, but that view is not authoritative storage.

---

# 16. Corporate Actions and Security Identity Boundary

Corporate actions must not be modeled by editing VN30 membership or portfolio history unless the index provider actually changes index membership.

Examples:

## 15.1 Stock split / bonus shares

- Security identity normally remains the same.
- Membership interval normally remains unchanged.
- Quantity and cost basis effects belong to `TRANSACTIONS.md`.

## 15.2 Cash dividend

- No membership change.
- Dividend accounting belongs to `TRANSACTIONS.md`.

## 15.3 Ticker/company rename

- Economic security identity may remain the same.
- Do not create a fake VN30 exit/re-entry merely because ticker/name changes.
- Stable `security_id` preserves continuity.

## 15.4 Merger / replacement security

If the old security ceases and a different security becomes the relevant listed instrument:

- separate security identities may be required;
- portfolio transformation belongs to corporate-action transaction rules;
- index membership must follow official index effective dates for each security;
- do not infer index membership continuity from the portfolio corporate action.

This separation prevents corporate-action accounting from silently rewriting index history.

---

# 17. Corrections and Data Governance

Reference/market data can contain source or ingestion errors. Corrections must preserve auditability.

## 16.1 Historical source correction

If an existing membership row is proven wrong:

- accept a new authoritative `IndexReviewEvent`/source revision;
- supersede the affected membership interval version rather than silently overwriting it;
- retain both valid-time (`member_from/member_to`) and system-time audit metadata (`recorded_at/superseded_at`);
- rerun historical constituent-count, coverage and BUY-eligibility validation for affected dates;
- never alter transaction history solely to conform to corrected reference data.

Logical supersession/versioning is mandatory for corrected membership facts. A full event-sourced reference-data implementation is not required, but destructive correction without audit lineage is prohibited.

## 16.2 Late-arriving data

If authoritative historical data arrives late:

- add/correct the true effective membership period;
- mark previously unsupported/incomplete dates as reconciled where appropriate;
- recompute derived historical eligibility flags;
- never change historical transactions themselves solely because reference data arrived later.

---

# 18. Mandatory Invariants

## 18.1 Security invariants

1. `security_id` is unique and durable.
2. VN30 history references `security_id`, not ticker as the durable key.
3. A ticker/name change must not break historical joins.
4. `SecurityMaster.active_to` is not a proxy for VN30 exit.
5. `SecurityMaster.sector_id` must not be treated as authoritative historical sector assignment; historical allocation requires the as-of mapping owned by `SECTOR_MASTER.md`.

## 18.2 Membership invariants

6. For a given `security_id + index_code`, membership periods cannot overlap.
7. `member_from` must be present.
8. When non-null, `member_to > member_from`.
9. Membership uses `[member_from, member_to)` consistently.
10. Current membership is derived; no independently editable current-member truth is permitted.
11. `IndexReviewEvent.announcement_date` never changes effective membership eligibility.
12. Exit/re-entry requires distinct historical periods.
13. Historical membership rows cannot be collapsed across a non-member gap.
14. Constituent history must not be overwritten to mirror today's VN30 list.
15. A held security leaving VN30 remains valid historical reference data.

## 18.3 Completeness invariants

16. If a constituent set is declared complete for a supported effective date, reconstructed VN30 count must equal 30; otherwise raise a reconciliation error.
17. If source data is incomplete, the system must flag incompleteness rather than invent constituent rows.
18. Unknown historical coverage must be represented as unknown/unsupported, not false membership.
19. Missing provenance must never be filled with fabricated references.
20. Membership absence is `NON_MEMBER_CONFIRMED` only inside `COMPLETE_CONFIRMED` coverage.
21. Unknown/unsupported coverage must never be collapsed into confirmed non-membership.
22. Entry and exit boundaries must each reference their own accepted source event/revision.
23. Corrected membership/coverage facts must preserve supersession lineage.

## 18.4 Portfolio/transaction integration invariants

24. Historical BUY eligibility is tested against membership on the BUY trade date.
25. Today’s membership must never be used retroactively to invalidate or validate a historical trade.
26. Membership changes do not alter cash, quantity, cost basis, realized P&L or unrealized P&L.
27. Legacy Holding is derived from positive position quantity plus non-membership as of the same date.
28. A Legacy Holding remains included in NAV and risk calculations.
29. Corporate actions change membership only when authoritative index membership itself changes.

---

# 19. Reconstruction Acceptance Scenarios

A future implementation is not accepted unless it passes at least the following scenarios.

## Scenario 1 — Current member

Given membership `[2026-01-01, NULL)`, queries on and after `2026-01-01` return member=true.

## Scenario 2 — Before entry

Given `[2026-01-01, NULL)`, query on `2025-12-31` returns member=false, assuming historical coverage for that date is supported.

## Scenario 3 — Exit boundary

Given `[2025-01-01, 2026-07-01)`, query on `2026-06-30` returns true and on `2026-07-01` returns false.

## Scenario 4 — Future announced entry

Announcement on `2026-06-20`, effective inclusion `2026-07-01`.

A BUY on `2026-06-25` must not be treated as eligible merely because the inclusion was announced.

## Scenario 5 — Future announced removal

Removal announced before effective date.

Membership remains true until the exclusive `member_to` effective date.

## Scenario 6 — Re-entry

Security has `[2024-01-01, 2025-07-01)` and `[2026-07-01, NULL)`.

Queries during the gap return false; earlier and later member periods remain intact.

## Scenario 7 — Legacy Holding after exit

Position quantity remains positive after `member_to`.

Portfolio reconstruction shows the position unchanged economically and classifies it as Legacy Holding.

## Scenario 8 — Re-entry of Legacy Holding

A held Legacy security later re-enters VN30.

Current eligibility becomes true from the new effective date without deleting the historical Legacy interval.

## Scenario 9 — Ticker rename

Ticker changes while economic security identity stays the same.

Historical transactions and membership remain joined through the same `security_id`; no fake exit/re-entry is created.

## Scenario 10 — Split while remaining member

A stock split changes portfolio quantity/cost basis but does not create a VN30 membership event unless official index data says otherwise.

## Scenario 11 — Merger into different security

Corporate action converts holding A into B.

Accounting follows `TRANSACTIONS.md`; index membership for A and B follows each security's authoritative membership periods independently.

## Scenario 12 — Incomplete source set

Only 29 constituents are ingested for a date known to require 30.

System marks the set incomplete/reconciliation-required and does not fabricate the 30th constituent.

## Scenario 13 — Historical unsupported date

Membership coverage starts later than query date.

System returns coverage status unknown/unsupported rather than claiming all securities were non-members.

## Scenario 14 — Overlapping periods attempted

Rows `[A,C)` and `[B,D)` for same security/index with `B < C` are rejected.

## Scenario 15 — Same-day replacement

Outgoing member has `member_to=D`; incoming member has `member_from=D`.

Reconstruction on D excludes outgoing and includes incoming without ambiguity.

## Scenario 16 — Historical BUY audit

Security is not in VN30 today but was a member on historical BUY trade date.

Historical eligibility audit returns eligible for that trade date.

## Scenario 17 — Current member was not member historically

Security is in VN30 today but entered after an old BUY date.

Historical audit must not use today's membership to mark that old date eligible.

## Scenario 18 — Source correction

Authoritative evidence corrects an earlier effective date.

Membership history is corrected with audit provenance and all affected historical eligibility/count validations are recomputed; transactions remain immutable.

## Scenario 19 — Positive holding with unknown membership coverage

Position quantity is positive but coverage for date D is unsupported. System returns `MEMBERSHIP_UNKNOWN`, not `LEGACY_HOLDING`, and raises a data-quality/risk flag.

## Scenario 20 — Ticker reused by a different security

Historical ticker X belongs to security A during `[A1,A2)` and later to security B during `[B1,NULL)`. A historical transaction dated inside A's interval resolves to A; an ambiguous date is rejected rather than guessed.

## Scenario 21 — Separate entry and exit evidence

Entry is supported by review event E1 and later removal by review event E2. The membership interval references both boundaries independently; changing E2 cannot rewrite the provenance of E1.

## Scenario 22 — Reference-data correction with supersession

A later official correction changes an effective exit date. New event/membership versions supersede prior accepted records, historical audit lineage remains visible, and derived eligibility is recomputed without mutating transactions.

---

# 20. Calculated Views Recommended for Later Implementation

These are disposable/queryable views, not additional sources of truth.

## 19.1 `VN30CurrentConstituentView`

Suggested fields:

- `as_of_date`;
- `security_id`;
- `ticker`;
- `company_name`;
- `sector`;
- `member_from`;
- `current_member = true`;
- provenance/completeness status where useful.

## 19.2 `VN30MembershipHistoryView`

Suggested fields:

- `security_id`;
- ticker/company display fields;
- `member_from`;
- `member_to`;
- entry/exit `IndexReviewEvent` announcement/effective metadata;
- entry sequence number;
- calculated duration;
- entry and exit source references/revisions.

## 19.3 `VN30ChangeView`

Derived from interval boundaries:

- effective date;
- added security;
- removed security;
- entry/exit event source references;
- change/review grouping via `IndexReviewEvent`.

Do not store a redundant editable `change_type` row when the same event can be deterministically derived from membership interval boundaries, unless an external source explicitly requires event-level audit metadata.

---

# 21. Design Risks and Mitigations

## Risk 1 — Using today's VN30 list as historical truth

**Severity:** Critical  
**Failure:** Historical BUYs, scores and portfolio reviews become incorrectly eligible/ineligible.  
**Mitigation:** Effective-dated `VN30Membership`; all historical queries require `as_of_date`.

## Risk 2 — Mutable `current_member` boolean

**Severity:** Major  
**Failure:** Boolean and date history diverge.  
**Mitigation:** Derive current membership only.

## Risk 3 — Announcement date mistaken for effective date

**Severity:** Major  
**Failure:** Capital can be deployed into a security before it officially enters VN30.  
**Mitigation:** Eligibility uses `member_from/member_to` only.

## Risk 4 — Re-entry overwrites old period

**Severity:** Major  
**Failure:** Non-member gap disappears and historical eligibility is corrupted.  
**Mitigation:** Separate non-overlapping periods per continuous membership episode.

## Risk 5 — Ticker as primary identity

**Severity:** Major  
**Failure:** Rename breaks transaction/membership joins or creates fake security history.  
**Mitigation:** Stable `security_id`.

## Risk 6 — Membership change accidentally changes accounting

**Severity:** Critical  
**Failure:** VN30 removal could delete/zero a position or alter P&L.  
**Mitigation:** Strict separation between reference membership and transaction/accounting state.

## Risk 7 — Forcing constituent count to 30

**Severity:** Major  
**Failure:** Missing source data is replaced with fabricated facts.  
**Mitigation:** Explicit completeness states; never synthesize constituents.

## Risk 8 — Unknown historical coverage treated as false

**Severity:** Major  
**Failure:** The OS asserts non-membership without evidence.  
**Mitigation:** Distinguish `false` from `unknown/unsupported coverage`.

## Risk 9 — Corporate action conflated with index membership

**Severity:** Major  
**Failure:** Split/rename/merger accounting rewrites index history.  
**Mitigation:** Corporate-action accounting stays in transaction domain; membership changes only from authoritative index data.

## Risk 10 — Sector duplicated into membership history

**Severity:** Major  
**Failure:** Sector allocation and ranking disagree across tables.  
**Mitigation:** Membership references security; sector is joined through canonical sector reference model.

## Risk 11 — Current sector used as historical sector truth

**Severity:** Major  
**Failure:** Historical sector allocation/concentration can be rewritten when a company is reclassified.  
**Mitigation:** VN30 master does not own historical sector assignment; use effective-dated security→sector mapping from `SECTOR_MASTER.md`. `SecurityMaster.sector_id` is current convenience only.

---

# 22. Review — Portfolio Manager

## PM findings addressed

### PM-1 — Historical eligibility must be evaluated as-of trade date

Resolved through mandatory effective-date membership lookup.

### PM-2 — Announcement is useful but must not create investability

Resolved by separating announcement and effective dates.

### PM-3 — Index removal must not force accounting removal

Resolved through independent Legacy Holding state and accounting separation.

### PM-4 — Re-entry must restore current eligibility without erasing old non-member periods

Resolved using multiple membership episodes.

### PM-5 — Incomplete universe must block confident ranking/universe assertions

Resolved through explicit constituent coverage/completeness validation.

### PM-6 — Unknown membership must not be mislabeled Legacy or policy-invalid

Resolved through tri-state membership and `MEMBERSHIP_UNKNOWN/BLOCKED_UNKNOWN` handling.

**Portfolio Manager result:** 0 Critical, 0 Major unresolved.

---

# 23. Review — Data Architect

## DA findings addressed

### DA-1 — Ticker cannot be durable key

Resolved with `security_id`.

### DA-2 — `current_member` duplicates temporal truth

Resolved by deriving current state from half-open intervals.

### DA-3 — Interval boundary ambiguity

Resolved with mandatory `[member_from, member_to)` convention.

### DA-4 — Re-entry can create overlapping or merged history

Resolved by non-overlap invariant and separate membership rows.

### DA-5 — Constituent count validation could fabricate data

Resolved by separating completeness status from observed count.

### DA-6 — Sector/reference attributes risk duplication

Resolved by canonical joins from `SecurityMaster` and `SectorMaster`.

### DA-7 — Market-source corrections need auditability

Resolved with mandatory supersession lineage and valid-time/system-time audit metadata.

### DA-8 — Membership absence could be misread as non-membership

Resolved with mandatory `VN30CoveragePeriod` and tri-state membership semantics.

### DA-9 — One announcement/source field cannot evidence both interval boundaries

Resolved with separate `IndexReviewEvent` provenance for entry and exit.

### DA-10 — Historical ticker resolution can be ambiguous

Resolved with mandatory `SecurityIdentifierHistory` and as-of-date identifier resolution.

### DA-11 — Current sector could overwrite historical allocation meaning

Resolved by making historical security→sector mapping the responsibility of effective-dated `SECTOR_MASTER.md`; current `sector_id` is convenience only.

**Data Architect result:** 0 Critical, 0 Major unresolved.

---

# 24. Review — Risk Manager

## RM findings addressed

### RM-1 — Incorrect membership date can permit policy-invalid BUY

Mitigated by official effective-date validation and source provenance.

### RM-2 — Legacy Holding could disappear from concentration calculations

Mitigated by explicit rule that membership does not affect economic ownership/NAV/risk inclusion.

### RM-3 — Missing constituent data could produce false confidence in VN30-wide scoring

Mitigated through completeness status and count reconciliation.

### RM-4 — Historical unknown could be interpreted as non-member

Mitigated by unsupported/unknown coverage state.

### RM-5 — Corporate actions could unintentionally mutate eligibility history

Mitigated through strict domain separation.

### RM-6 — Missing coverage could create false eligibility/legacy classification

Mitigated by requiring `COMPLETE_CONFIRMED` coverage before asserting confirmed non-membership.

### RM-7 — Reference-data correction could retrospectively erase audit evidence

Mitigated with superseding event/membership versions; destructive overwrite is prohibited.

**Risk Manager result:** 0 Critical, 0 Major unresolved.

---

# 25. Final Production Readiness Assessment

| Area | Result |
|---|---|
| Stable security identity | PASS |
| Historical VN30 membership | PASS |
| Effective-date semantics | PASS |
| Announcement/effective separation | PASS |
| Entry/exit/re-entry reconstruction | PASS |
| Current membership derivation | PASS |
| Historical BUY eligibility | PASS |
| Legacy Holding handling | PASS |
| Constituent count/completeness | PASS |
| Ticker/company changes | PASS |
| Corporate-action boundary | PASS |
| Sector duplication protection | PASS |
| Source provenance | PASS |
| Coverage / tri-state membership | PASS |
| Entry/exit boundary provenance | PASS |
| Historical identifier resolution | PASS |
| Reference-data correction lineage | PASS |
| Historical sector ownership boundary | PASS |
| Critical unresolved | **0** |
| Major unresolved | **0** |

Minor/deferred extensions:

1. Physical implementation details for source-ingestion/versioning tables beyond the mandatory logical supersession contract.
2. Automated reconciliation against multiple index-source providers.
3. Optional richer legal-entity/successor metadata for complex reorganizations.

These do not block the logical M2 VN30 master contract.

---

# 25.1 Focused Re-review Findings — v1.2

The requested Portfolio Manager / Data Architect / Risk Manager audit identified and closed the following production-significant issues:

- **Major:** membership absence lacked mandatory coverage evidence and could be misclassified as non-membership; fixed with `VN30CoveragePeriod` and tri-state membership.
- **Major:** one membership-level announcement/source field could not independently evidence entry and exit boundaries; fixed with `IndexReviewEvent`.
- **Major:** historical ticker resolution was unsafe across ticker changes/reuse; fixed with `SecurityIdentifierHistory`.
- **Major:** positive holdings under unknown coverage could be falsely labeled Legacy; fixed with `MEMBERSHIP_UNKNOWN`.
- **Major:** reference-data corrections could silently rewrite accepted history; fixed with supersession/version lineage.
- **Major:** current `sector_id` could be misused as historical sector truth; fixed by making it convenience-only and reserving effective-dated mapping ownership for `SECTOR_MASTER.md`.

Focused accounting checks also confirm:

- VN30 membership/reference data has **no authority** to post cash, quantity, cost basis, realized P&L or unrealized P&L;
- therefore this document cannot double-count trade cash, fees, taxes or cost basis; those remain exclusively governed by `TRANSACTIONS.md`/`PORTFOLIO.md`;
- corporate actions never infer index membership and never rewrite transaction history;
- portfolio reconstruction from transactions remains independent from membership reconstruction, while eligibility/Legacy classification is joined as-of the same effective date.

**Focused re-review result:** 0 Critical unresolved, 0 Major unresolved.

# 26. Approval Gate

**Status:** `PRODUCTION-READY — RE-REVIEWED; AWAITING USER APPROVAL`

Do not proceed to `SECTOR_MASTER.md` until this file has been reviewed and explicitly approved.
