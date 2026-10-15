# VN30 Value Investing OS — Sector Master

**Document:** `02_DATABASE/SECTOR_MASTER.md`  
**Milestone:** 2 — Portfolio Data Model & Database  
**Version:** 1.2  
**Status:** PRODUCTION-READY — RE-REVIEWED; AWAITING USER APPROVAL  
**Depends on:** `DATA_MODEL.md` v1.2 (approved), `PORTFOLIO.md` v1.1 (approved), `TRANSACTIONS.md` v1.2 (approved), `VN30_MASTER.md` v1.2 (approved)

---

# 1. Purpose

This document defines the authoritative sector taxonomy and historical security-to-sector classification model for VN30 Value Investing OS.

It must support, deterministically and for any supported as-of date:

1. the canonical sector taxonomy used by the project;
2. the sector assigned to each security;
3. historical sector reclassification without rewriting the past;
4. portfolio sector allocation and concentration analysis;
5. sector-level ranking and scoring inputs;
6. historical portfolio reconstruction using the sector classification valid at the relevant date;
7. current-vs-historical sector comparisons;
8. Legacy Holding sector exposure after a security leaves VN30;
9. taxonomy evolution without silently changing historical analytics.

This document does **not** define portfolio accounting, transaction posting, VN30 membership, market prices, benchmark calculation, or the business rules of the future scoring engine except where required to preserve reference integrity.

---

# 2. Core Design Decision

The project must distinguish three concepts that are often incorrectly collapsed into one field:

```text
Sector definition
    !=
Security-to-sector assignment
    !=
Portfolio sector exposure
```

Therefore:

- `SectorMaster` owns the taxonomy/category definitions.
- `SecuritySectorAssignment` owns effective-dated security classification.
- `SectorTaxonomyMapping` owns any explicit cross-taxonomy mapping used for restated analytics.
- `SectorAllocation` is a calculated portfolio view.

`SecurityMaster.sector_id` may exist only as a current convenience/cache value and must never become the authoritative source for historical sector analysis.

---

# 3. Design Principles

1. **One canonical taxonomy per analytical context.** Sector allocation must not mix incompatible taxonomies or versions inside one comparison.
2. **Stable sector identity.** Internal `sector_id` is a durable key; display names may change without breaking historical references.
3. **Effective-dated security classification.** A security may change sector over time without rewriting prior periods.
4. **No sector free text in accounting entities.** Transactions, positions and ledger postings reference `security_id`, not copied sector names.
5. **No accounting authority.** Sector reference data cannot change cash, quantity, cost basis, NAV or P&L.
6. **No historical backfill from current classification.** Current sector cannot be assumed to have applied before its supported effective date.
7. **Absence is not evidence.** Missing classification is `UNKNOWN`, not automatically `Other`.
8. **Taxonomy changes are explicit.** A taxonomy version or mapping change must never silently reclassify historical observations.
9. **Sector reclassification is not a corporate action.** It changes analytical classification, not economic ownership or accounting balances.
10. **Legacy Holdings retain sector exposure.** Leaving VN30 does not remove a security from portfolio sector concentration analysis.
11. **Reconstruction must be deterministic.** Given an as-of date, taxonomy context and effective-dated assignments, sector exposure must be reproducible.
12. **No forced completeness by guessing.** Unknown sector data must remain visible as unknown exposure until resolved.

---

# 4. Scope and Ownership Boundaries

## 4.1 Owned by this document

- `SectorTaxonomy`;
- `SectorMaster`;
- sector hierarchy;
- `SecuritySectorAssignment`;
- `SectorTaxonomyMapping` for explicit restatement/crosswalks;
- effective-dated sector history;
- sector classification provenance;
- taxonomy/version controls;
- sector allocation calculation contract;
- sector concentration data-quality rules;
- current-sector convenience synchronization rules.

## 4.2 Owned elsewhere

| Concern | Owner |
|---|---|
| Security identity and ticker history | `VN30_MASTER.md` |
| VN30 membership history | `VN30_MASTER.md` |
| Transactions, cost basis and realized P&L | `TRANSACTIONS.md` |
| Portfolio positions, NAV and weights | `PORTFOLIO.md` |
| Cross-entity logical architecture | `DATA_MODEL.md` |
| Benchmark data | `BENCHMARK.md` |
| Future sector scoring methodology | Milestone 3 scoring engine |

No rule in this file may create a second source of truth for security identity, membership, position quantity, market value, NAV or P&L.

---

# 5. Logical Entity Relationship

```text
SectorTaxonomy
    1
    |
    +----------------------< SectorTaxonomyMapping >----------------------1 SectorTaxonomy
    |
    +----------------------< SectorMaster
                                 |
                                 | parent_sector_id (optional hierarchy)
                                 |
SecurityMaster                  |
    1                            |
    +----------------------< SecuritySectorAssignment >----1 SectorMaster
    |
    +----------------------< VN30Membership      (elsewhere)
    +----------------------< Transaction         (elsewhere)
    +----------------------< Position            (derived elsewhere)

Position(as_of)
    + SecuritySectorAssignment(as_of, taxonomy)
    + SectorMaster
    |
    +--> SectorAllocation (CALCULATED)
    +--> concentration metrics (CALCULATED)
```

---

# 6. Source-of-Truth Model

## 6.1 Taxonomy source of truth

**Authoritative taxonomy identity:** `SectorTaxonomy.taxonomy_id` + its controlled version/effective metadata.

A taxonomy defines the classification system under which sector entities exist.

Examples of what must be prevented:

- one security classified under one provider's sector taxonomy while another security is classified under a different provider taxonomy in the same sector-allocation calculation;
- display-name changes being mistaken for an economic reclassification;
- taxonomy revisions silently rewriting historical sector exposure.

## 6.2 Sector-definition source of truth

**Authoritative category definition:** `SectorMaster`.

`sector_name`, `sector_code`, hierarchy and taxonomy relation are reference data only.

## 6.3 Security classification source of truth

**Authoritative security-to-sector truth:** `SecuritySectorAssignment`.

The current convenience field `SecurityMaster.sector_id`, if implemented, is non-authoritative and must be derivable from the open effective-dated assignment for the configured current taxonomy.

## 6.4 Portfolio sector exposure source of truth

There is **no independently stored authoritative sector allocation balance**.

Sector allocation is calculated from:

```text
reconstructed Position quantity
+ market price as_of
+ effective SecuritySectorAssignment as_of
+ portfolio NAV as_of
```

Therefore `SectorAllocation` is a calculated projection, not raw source data.

## 6.5 Accounting isolation

Sector data cannot post or modify:

- cash;
- receivables/payables;
- quantity;
- acquisition cost;
- average cost;
- realized P&L;
- unrealized P&L;
- dividend income;
- NAV.

This prevents double counting and ensures portfolio accounting remains fully reconstructible from `Transaction` + `TransactionLeg` under the approved accounting policy.

---

# 7. SectorTaxonomy

## 7.1 Purpose

Represents the controlled classification system under which sector definitions and security assignments are interpreted.

This entity prevents silent analytical drift when a provider changes its classification methodology or when the project intentionally adopts a new taxonomy.

## 7.2 Logical schema

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `taxonomy_id` | UUID/string | REFERENCE_RAW | Yes | Stable internal identity. |
| `taxonomy_name` | string | REFERENCE_RAW | Yes | Human-readable taxonomy name. |
| `taxonomy_version` | string/date | REFERENCE_RAW | Yes | Explicit version identifier. |
| `provider_name` | string | REFERENCE_RAW | No | External source/provider if applicable. |
| `effective_from` | date | REFERENCE_RAW | Yes | Inclusive project-supported effective date. |
| `effective_to` | date | REFERENCE_RAW | No | Exclusive; null while currently active. |
| `is_primary_for_project` | boolean | REFERENCE_DERIVED/CONFIG | Yes | Convenience/config flag; must not substitute for effective-date logic. |
| `source_reference` | string | REFERENCE_RAW | No | Source/version documentation identifier. |
| `recorded_at` | timestamp | SYSTEM_METADATA | Yes | Audit timestamp. |
| `notes` | text | REFERENCE_RAW | No | Methodology/version notes. |

## 7.3 Taxonomy invariants

1. `taxonomy_id` is immutable.
2. `(taxonomy_name, taxonomy_version)` must identify one logical taxonomy version.
3. Effective periods for project-primary taxonomy versions must not overlap unless the system explicitly supports a comparison mode and the analytical query selects one version.
4. A historical calculation must state or deterministically resolve the taxonomy version used.
5. Changing `is_primary_for_project` must not rewrite historical sector assignments.
6. Taxonomy version adoption is a reference-data event, not an accounting event.

---

# 8. SectorMaster

## 8.1 Purpose

Defines canonical sector categories within a taxonomy/version.

## 8.2 Logical schema

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `sector_id` | UUID/string | REFERENCE_RAW | Yes | Stable internal category identity. |
| `taxonomy_id` | FK | REFERENCE_RAW | Yes | Owning taxonomy/version. |
| `sector_code` | string | REFERENCE_RAW | Yes | Stable short code within taxonomy. |
| `sector_name` | string | REFERENCE_RAW | Yes | Canonical display name. |
| `parent_sector_id` | FK | REFERENCE_RAW | No | Optional hierarchy; must reference same taxonomy. |
| `classification_level` | string/enum | REFERENCE_RAW | No | E.g. `SECTOR`; allows future hierarchy without redesign. |
| `active_from` | date | REFERENCE_RAW | Yes | Inclusive validity date for category definition. |
| `active_to` | date | REFERENCE_RAW | No | Exclusive; null while active. |
| `source_reference` | string | REFERENCE_RAW | No | Classification documentation/source. |
| `recorded_at` | timestamp | SYSTEM_METADATA | Yes | Audit timestamp. |
| `notes` | text | REFERENCE_RAW | No | Mapping rationale/exceptions. |

## 8.3 Sector invariants

1. `sector_id` is immutable.
2. `sector_code` must be unique within the relevant taxonomy/version and validity context.
3. `parent_sector_id` must not create hierarchy cycles.
4. Parent and child must belong to the same taxonomy.
5. A rename that preserves category meaning should not automatically create a new economic sector classification for historical holdings.
6. A material taxonomy/category-definition change must be represented through explicit taxonomy/version lineage rather than silently editing old records.
7. `active_to` is sector-definition validity, not security-assignment end date.
8. Each taxonomy version must identify one **assignable reporting level** for portfolio concentration (normally sector-level leaf categories for this project).
9. A `SecuritySectorAssignment` used in portfolio concentration must reference a category at that assignable reporting level; parent rollups are derived only.
10. A taxonomy category used only as a parent/rollup must not receive direct portfolio assignment unless that taxonomy explicitly defines it as the assignable reporting level.

---

# 9. SecuritySectorAssignment

## 9.1 Purpose

Stores effective-dated classification of a security into a sector under a specific taxonomy.

This entity is mandatory for historical sector reconstruction.

## 9.2 Logical schema

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `assignment_id` | UUID/string | REFERENCE_RAW | Yes | Unique assignment period. |
| `security_id` | FK | REFERENCE_RAW | Yes | Durable security identity from `SecurityMaster`. |
| `sector_id` | FK | REFERENCE_RAW | Conditional | Required only when `assignment_state = ASSIGNED`; null for an explicit `UNCLASSIFIED` period. |
| `taxonomy_id` | FK | REFERENCE_RAW | Yes | Must match `sector_id` taxonomy. |
| `effective_from` | date | REFERENCE_RAW | Yes | Inclusive classification start. |
| `effective_to` | date | REFERENCE_RAW | No | Exclusive; null while active. |
| `assignment_state` | enum | REFERENCE_RAW | Yes | `ASSIGNED` or `UNCLASSIFIED`; represents valid-time classification state, not confidence. |
| `confidence_status` | enum | REFERENCE_RAW | Yes | `CONFIRMED` or `PROVISIONAL`; only `CONFIRMED` participates in authoritative production analytics. |
| `record_status` | enum | SYSTEM_METADATA | Yes | `CURRENT` or `SUPERSEDED`; correction/version lineage only. |
| `source_reference` | string | REFERENCE_RAW | No | Source/provenance. |
| `source_effective_date` | date | REFERENCE_RAW | No | External effective date when separately known. |
| `supersedes_assignment_id` | FK | SYSTEM_METADATA | No | Correction lineage; does not imply accounting reversal. |
| `recorded_at` | timestamp | SYSTEM_METADATA | Yes | Audit timestamp. |
| `notes` | text | REFERENCE_RAW | No | Rationale/exceptions. |

## 9.3 Interval convention

All assignments use half-open intervals:

```text
[effective_from, effective_to)
```

Example:

```text
Sector A: [2025-01-01, 2026-07-01)
Sector B: [2026-07-01, null)
```

The security belongs to Sector A through 2026-06-30 and Sector B beginning 2026-07-01.

Sector classification in Milestone 2 is day-granular. If a future provider supplies intraday-effective classifications, the schema may upgrade valid-time fields to timestamps without changing ownership semantics.

## 9.4 Assignment invariants

For the same `security_id` + `taxonomy_id`:

1. only `CURRENT + CONFIRMED` records participate in authoritative production lookup;
2. `CURRENT + CONFIRMED` valid-time periods must not overlap;
3. `effective_to > effective_from` when `effective_to` exists;
4. at most one authoritative assignment state may be active for an as-of date at the configured assignable classification level;
5. when `assignment_state = ASSIGNED`, `sector_id` is required and `sector_id.taxonomy_id == assignment.taxonomy_id`;
6. when `assignment_state = UNCLASSIFIED`, `sector_id` must be null; this is an explicit supported fact and differs from missing coverage;
7. assignment periods must never be rewritten merely to make today's sector appear historically consistent;
8. a new valid-time classification starts a new assignment period;
9. a factual correction creates replacement record(s), marks the prior record(s) `SUPERSEDED`, and links them through `supersedes_assignment_id`; posted/reference history is not destructively deleted;
10. an `ASSIGNED` period must fall within a period where the referenced `SectorMaster` category is valid; assignment may not point to a sector before `active_from` or on/after `active_to`;
11. unresolved overlap or ambiguity must block a confident historical sector assertion.

---

# 10. Classification Lookup Semantics

## 10.1 Tri-state result

A sector lookup must not return a fabricated category when data is unavailable.

Recommended result model:

```text
CONFIRMED_SECTOR(sector_id)
UNKNOWN_CLASSIFICATION
AMBIGUOUS_CLASSIFICATION
```

`Other`/`Miscellaneous` may be a legitimate taxonomy sector only if the taxonomy itself defines it. It must never be used as a generic bucket for missing data.

## 10.2 Lookup algorithm

For `(security_id, as_of_date, taxonomy_id)`:

1. find records with `record_status = CURRENT` and `confidence_status = CONFIRMED` where:

```text
effective_from <= as_of_date
AND
(effective_to IS NULL OR as_of_date < effective_to)
```

2. validate that any `ASSIGNED` record references a `SectorMaster` category active on `as_of_date`; otherwise return a reference-integrity error;
3. if exactly one valid `ASSIGNED` record exists → return its confirmed sector;
4. if exactly one `UNCLASSIFIED` record exists → return `UNKNOWN_CLASSIFICATION` with reason `EXPLICIT_UNCLASSIFIED`;
5. if no current confirmed record exists → return `UNKNOWN_CLASSIFICATION` with reason `NO_SUPPORTED_ASSIGNMENT`;
6. if more than one current confirmed record exists → data integrity error / `AMBIGUOUS_CLASSIFICATION`;
7. provisional records may be shown for research but cannot silently substitute for authoritative production classification;
8. never infer historical sector from the current convenience `SecurityMaster.sector_id`.

---

# 11. SectorTaxonomyMapping

## 11.1 Purpose

`SectorTaxonomyMapping` is required **only** when the system produces restated analytics across taxonomy versions. It is the source of truth for explicit cross-taxonomy mappings and prevents heuristic remapping.

## 11.2 Logical schema

| Field | Type | Class | Required | Rule |
|---|---|---|---|---|
| `mapping_id` | UUID/string | REFERENCE_RAW | Yes | Unique mapping record. |
| `from_taxonomy_id` | FK | REFERENCE_RAW | Yes | Source taxonomy/version. |
| `from_sector_id` | FK | REFERENCE_RAW | Yes | Source category. |
| `to_taxonomy_id` | FK | REFERENCE_RAW | Yes | Target taxonomy/version. |
| `to_sector_id` | FK | REFERENCE_RAW | Conditional | Required for deterministic one-to-one mapping; null when mapping is explicitly unsupported/ambiguous. |
| `mapping_status` | enum | REFERENCE_RAW | Yes | `CONFIRMED`, `AMBIGUOUS`, `UNSUPPORTED`. |
| `effective_from` | date | REFERENCE_RAW | No | Optional mapping validity start. |
| `effective_to` | date | REFERENCE_RAW | No | Optional exclusive end. |
| `source_reference` | string | REFERENCE_RAW | No | Provider/project mapping provenance. |
| `recorded_at` | timestamp | SYSTEM_METADATA | Yes | Audit timestamp. |
| `notes` | text | REFERENCE_RAW | No | Mapping rationale. |

## 11.3 Mapping invariants

1. Restated analytics must not infer a crosswalk from names or hierarchy labels.
2. Only `CONFIRMED` mappings may be used automatically.
3. `AMBIGUOUS` or `UNSUPPORTED` mapping makes the affected exposure `UNKNOWN_RESTATED_CLASSIFICATION`; it must not be forced into a target sector.
4. Crosswalks are analytical reference data only and cannot alter authoritative historical `SecuritySectorAssignment` records.
5. If no `SectorTaxonomyMapping` exists, **restated/current-taxonomy analytics are unsupported**, while as-classified historical analytics remain fully supported.

---

# 12. Current Sector Convenience Field

`SecurityMaster.sector_id` may be retained for current UI/search convenience, but its rules are strict:

1. it is **not authoritative**;
2. it must be derivable from the currently active confirmed `SecuritySectorAssignment` under the configured primary taxonomy;
3. if no confirmed current assignment exists, it must be null/unknown rather than stale;
4. it must never be used for historical sector allocation;
5. cache mismatch with the effective-dated assignment is a reconciliation/data-quality error;
6. cache refresh may modify the convenience value without modifying historical assignment records.

---

# 13. Sector Reclassification

## 12.1 Definition

A sector reclassification occurs when an authoritative classification source changes the sector assigned to an economically continuous security.

It does **not** by itself imply:

- a trade;
- a corporate action;
- a change in quantity;
- a change in cost basis;
- realized P&L;
- a cash movement;
- a VN30 entry/exit.

## 12.2 Required handling

Suppose security `S` moves from Sector A to Sector B effective date `D`.

Store:

```text
A assignment: [old_start, D)
B assignment: [D, null)
```

Do not rewrite the old assignment to Sector B.

## 12.3 Historical analytics consequence

Portfolio sector allocation as-of `D-1` uses Sector A.

Portfolio sector allocation as-of `D` uses Sector B.

This is an analytical reclassification only. Portfolio NAV remains unchanged solely because of the sector classification event.

---

# 14. Corporate Actions Boundary

Corporate actions and sector assignments can occur near one another, but they are separate concepts.

## 13.1 Same economic security

A rename, ticker change, stock split, bonus share or similar corporate action generally does not create a new sector assignment unless the authoritative classification changes.

Accounting effects remain owned by `TRANSACTIONS.md`.

## 13.2 New/successor security

A merger, spin-off or restructuring may create a new `security_id` under `VN30_MASTER.md`.

Sector handling then follows security identity:

- old security retains historical assignments through its relevant period;
- new security receives its own assignment history;
- no sector reference row transfers cost basis;
- basis transfer/reallocation, quantity and cash effects remain corporate-action postings in `TRANSACTIONS.md`.

## 13.3 Hard invariant

```text
Sector reclassification
must never create or modify TransactionLeg postings.
```

Therefore sector data cannot double count corporate-action accounting effects.

---

# 15. Portfolio Sector Allocation

## 14.1 Current/as-of sector market value

For sector `k`:

```text
sector_market_value_vnd(k, as_of)
= SUM(position_market_value_vnd)
  for positions whose effective sector as_of = k
```

Position market value remains defined by `PORTFOLIO.md`.

## 14.2 Sector portfolio weight

```text
sector_portfolio_weight_pct(k, as_of)
= sector_market_value_vnd(k, as_of)
  / portfolio_NAV_vnd(as_of)
```

This denominator includes cash and other recognized NAV components, consistent with portfolio stock weights.

## 14.3 Sector invested-assets weight

For stock-only concentration analysis:

```text
sector_invested_assets_weight_pct(k, as_of)
= sector_market_value_vnd(k, as_of)
  / securities_market_value_vnd(as_of)
```

The system must label this separately from NAV-based sector portfolio weight.

## 14.4 Unknown-sector exposure

If a held security has no confirmed classification for the as-of date:

```text
unknown_sector_market_value_vnd
= SUM(market value of unclassified positions)
```

and:

```text
unknown_sector_weight_pct
= unknown_sector_market_value_vnd / NAV_vnd
```

The system must expose this amount explicitly.

It must **not** redistribute unknown exposure pro-rata among known sectors and must not assign it to an invented `Other` sector.

## 14.5 Reconciliation invariant

Within rounding tolerance:

```text
SUM(known sector market values)
+ unknown sector market value
= securities_market_value_vnd
```

and:

```text
SUM(known sector portfolio weights)
+ unknown sector portfolio weight
= securities_market_value_vnd / NAV_vnd
```

This is a key control against dropped positions or double-counted sector exposure.

---

# 16. Sector Concentration Analysis

Sector concentration is a calculated risk view, not stored accounting state.

Minimum outputs should support:

- sector market value in VND;
- sector portfolio weight % of NAV;
- sector invested-assets weight %;
- number of held securities in sector;
- largest position contribution to sector exposure;
- unknown-sector exposure;
- current vs historical sector allocation;
- comparison against risk-policy thresholds in future workflow.

The risk engine must use the sector assignment valid at the risk measurement date.

A current reclassification must not retroactively change historical concentration reports unless the report intentionally requests a restated/current-taxonomy analytical view.

---

# 17. Historical vs Restated Analytics

Two analytical questions are valid but must never be confused.

## 16.1 As-reported/as-classified historical view

Uses the taxonomy/version and security assignment effective at the historical date.

Purpose:

- reconstruct actual historical concentration;
- evaluate past decisions using information/classification available then;
- avoid look-ahead bias.

## 17.2 Restated/current-taxonomy view

Optionally maps historical holdings into a selected later/current taxonomy for cross-period comparability **only when a confirmed `SectorTaxonomyMapping` path exists**.

Purpose:

- longitudinal business/industry comparison under a common modern taxonomy.

This is an analytical transformation only and must be labeled clearly, e.g.:

```text
classification_basis = AS_OF_HISTORICAL
```

or

```text
classification_basis = RESTATED_TO_TAXONOMY_VERSION_X
```

Restated analytics must never overwrite authoritative historical assignments. If a required mapping is ambiguous, unsupported or absent, the affected exposure remains explicitly unknown in the restated view.

---

# 18. Integration with VN30 Membership

Sector and index membership are independent effective-dated dimensions.

For a security on date `D`:

```text
VN30 status      = VN30Membership lookup(D)
Sector status    = SecuritySectorAssignment lookup(D, taxonomy)
Portfolio status = Position reconstruction(D)
```

Possible valid combinations include:

- current VN30 member + held + known sector;
- current VN30 member + not held + known sector;
- Legacy Holding + known sector;
- Legacy Holding + unknown sector classification;
- historical VN30 member + sector A in past + sector B today.

Leaving VN30 must not close or delete a sector assignment automatically.

Entering VN30 must not fabricate a sector assignment if classification data is missing.

---

# 19. Integration with Transaction Reconstruction

Portfolio reconstruction follows this order conceptually:

```text
1. Replay authoritative transaction/accounting history
   -> quantity, cash, cost basis, P&L

2. Apply market price observations as_of
   -> position market value / NAV

3. Resolve SecuritySectorAssignment as_of
   -> sector classification

4. Aggregate position market values
   -> sector exposure and concentration
```

The sector layer is downstream from accounting reconstruction.

Therefore a failure in sector reference data may make sector analytics incomplete, but it must **not** corrupt reconstructed portfolio accounting balances.

---

# 20. Double-Counting Controls

The following are prohibited:

1. storing `sector_market_value_vnd` as independently editable authoritative data;
2. copying sector names into Transaction or TransactionLeg and later aggregating from those copied values;
3. counting one position in both old and new sectors on the reclassification effective date;
4. treating parent-sector and child-sector totals as additive when the parent already includes child exposure;
5. counting unknown exposure again inside an `Other` bucket;
6. calculating sector weight from cached Position sector and also joining effective-dated assignment;
7. mixing historical and restated classification in one total without explicit labeling.

## 19.1 Hierarchy aggregation rule

If hierarchy is used:

- leaf-level exposure is assigned once;
- parent exposure is calculated as aggregation of descendants;
- parent and child values are different views of the same exposure and must not be summed together to produce total portfolio market value.

---

# 21. Data Quality and Provenance

## 20.1 Required provenance level

Every confirmed classification should be traceable to a source or controlled project decision when practical.

Recommended priority:

1. authoritative/recognized classification source selected by the project;
2. official issuer/exchange industry classification if consistent with project taxonomy;
3. documented project mapping when no direct mapping exists.

A project mapping must be explicitly marked as such and must not masquerade as external fact.

## 20.2 No guessing

When classification cannot be supported:

```text
classification = UNKNOWN
```

Do not infer a sector solely from:

- company name;
- ticker;
- short-term revenue narrative;
- current market behavior;
- analyst intuition.

Such interpretation may later inform research, but it is not reference-data truth.

## 20.3 Corrections

If historical reference data was wrong:

- preserve audit lineage;
- create corrected replacement record(s) with the correct valid-time interval;
- mark prior incorrect record(s) `SUPERSEDED` and link via `supersedes_assignment_id`;
- authoritative lookup uses only `CURRENT + CONFIRMED` records;
- never destructively overwrite or delete the prior audit record;
- do not create accounting reversal transactions;
- rerun affected derived historical sector analytics as a reference-data correction/restatement.

If the system later needs **as-known-at-the-time** decision reconstruction, query must additionally apply a knowledge cutoff using `recorded_at`; this is distinct from ordinary corrected as-of analytics.

---

# 22. Reconciliation Rules

## 21.1 Current-sector cache reconciliation

If `SecurityMaster.sector_id` is implemented:

```text
SecurityMaster.sector_id
== current confirmed SecuritySectorAssignment.sector_id
```

for the configured primary taxonomy.

Mismatch = reference-data reconciliation error.

## 21.2 Position-to-sector reconciliation

Every non-zero held security must result in exactly one of:

```text
KNOWN_SECTOR
UNKNOWN_CLASSIFICATION
AMBIGUOUS_CLASSIFICATION_ERROR
```

No position may silently disappear from sector totals.

## 21.3 Sector-market-value reconciliation

```text
SUM(sector leaf market values)
+ unknown_sector_market_value_vnd
== securities_market_value_vnd
```

within rounding tolerance.

## 21.4 No accounting reconciliation dependency

A sector reconciliation failure must not modify cash, quantity, cost basis or P&L to force totals to match.

---

# 23. Reconstruction Acceptance Scenarios

Implementation must pass at least the following scenarios.

## Scenario 1 — Stable sector

Security remains in Sector A throughout holding period.

Expected:

- historical and current lookup return Sector A;
- entire position market value is allocated once to Sector A.

## Scenario 2 — Sector reclassification while held

Security moves A → B effective `D`.

Expected:

- `D-1`: exposure belongs to A;
- `D`: exposure belongs to B;
- quantity/cost basis/P&L unchanged solely from reclassification.

## Scenario 3 — Reclassification while not held

Security changes sector when portfolio owns zero shares.

Expected:

- no portfolio accounting effect;
- later purchase uses sector valid at later measurement date.

## Scenario 4 — Security exits VN30 but remains held

Expected:

- becomes Legacy Holding under VN30 logic;
- sector exposure remains included;
- membership exit does not close sector assignment.

## Scenario 5 — Security re-enters VN30

Expected:

- membership period changes independently;
- sector history remains based solely on classification events.

## Scenario 6 — Missing historical sector assignment

Portfolio held security at date with no supported classification.

Expected:

- position remains in NAV/accounting;
- market value appears in `unknown_sector_market_value_vnd`;
- system does not assign current sector retroactively.

## Scenario 7 — Ambiguous overlapping assignments

Two confirmed sector assignments overlap for same security/taxonomy/date.

Expected:

- validation failure;
- sector analytics blocked or marked invalid;
- accounting portfolio reconstruction remains intact.

## Scenario 8 — Taxonomy version change

Project adopts taxonomy v2 after taxonomy v1.

Expected:

- historical v1 analytics remain reproducible;
- v2 does not silently overwrite v1;
- restated analytics require explicit basis selection.

## Scenario 9 — Sector display-name rename

Category name changes but meaning/identity remains controlled.

Expected:

- stable sector identity or explicit taxonomy lineage prevents broken historical joins;
- no accounting effect.

## Scenario 10 — Parent/child hierarchy

Security maps to leaf sector/subsector and reports aggregate parent exposure.

Expected:

- position counted once at leaf;
- parent aggregation is derived;
- total portfolio is not computed by adding parent + child totals.

## Scenario 11 — Corporate action creating successor security

Old security converts into a new security.

Expected:

- accounting transfer handled only by corporate-action transactions;
- old/new security each have independent classification history;
- sector master does not transfer basis.

## Scenario 12 — Stock split

Quantity changes due to split.

Expected:

- sector classification unchanged unless separate classification event exists;
- sector market value derives from reconstructed position and price;
- sector layer creates no quantity posting.

## Scenario 13 — Current cache mismatch

`SecurityMaster.sector_id` differs from current effective assignment.

Expected:

- reconciliation error;
- effective-dated assignment remains authoritative.

## Scenario 14 — Unknown current classification

Held security has no confirmed current sector.

Expected:

- cache is null/unknown;
- exposure is shown as unknown;
- concentration report discloses incomplete classification.

## Scenario 15 — Historical portfolio reconstruction

Rebuild positions from transaction history at historical date `D` and aggregate by sector.

Expected:

- accounting state derives from ledger;
- sector lookup uses assignment valid at `D`;
- current sector data cannot alter historical quantity/cost/P&L.

## Scenario 16 — Historical correction

Source later proves historical sector assignment was wrong.

Expected:

- reference-data correction is auditable;
- affected derived sector reports may be restated;
- no transaction reversal or accounting change is generated.

## Scenario 17 — Unknown exposure reconciliation

Two positions classified, one unknown.

Expected:

```text
known sector MV + unknown sector MV = securities MV
```

exactly within rounding tolerance.

## Scenario 18 — Position closes before reclassification

Security sold completely before later sector change.

Expected:

- historical sector concentration before sale remains reconstructible;
- later reclassification has no historical accounting effect.

## Scenario 19 — Explicit unclassified period

An authoritative source confirms that a security is unclassified under the selected taxonomy for period `[A, B)`.

Expected:

- store `assignment_state = UNCLASSIFIED`, `sector_id = null`;
- lookup returns unknown with reason `EXPLICIT_UNCLASSIFIED`;
- this remains distinguishable from missing/unsupported assignment data;
- portfolio market value remains fully included in unknown-sector exposure.

## Scenario 20 — Assignment references inactive sector

An assignment points to a sector before that sector's `active_from` or on/after its `active_to`.

Expected:

- reference-integrity validation failure;
- sector analytics are blocked/marked invalid for the affected exposure;
- accounting reconstruction remains unchanged.

## Scenario 21 — Historical correction with supersession

A previously confirmed A assignment is later proven incorrect and should have been B for the same valid-time period.

Expected:

- old record is retained as `SUPERSEDED`;
- replacement B record is `CURRENT + CONFIRMED`;
- corrected as-of analytics use B;
- an optional as-known-at cutoff before the correction can still recover the earlier recorded A assertion;
- no accounting transaction is generated.

## Scenario 22 — Restatement with confirmed crosswalk

Historical Sector A under taxonomy v1 maps deterministically to Sector X under taxonomy v2.

Expected:

- as-classified view remains A under v1;
- explicitly requested restated view may classify exposure as X using `SectorTaxonomyMapping`;
- authoritative historical assignment is unchanged.

## Scenario 23 — Restatement mapping ambiguous or absent

A v1 sector has no confirmed deterministic mapping into selected v2 taxonomy.

Expected:

- restated exposure is `UNKNOWN_RESTATED_CLASSIFICATION`;
- system does not guess from sector names or business descriptions;
- totals still reconcile through explicit unknown-restated exposure.

## Scenario 24 — Parent category used as direct assignment incorrectly

Taxonomy designates leaf sector categories as the portfolio assignable reporting level, but an assignment points directly to a parent rollup category.

Expected:

- validation failure;
- parent exposure remains derived from valid descendant assignments only;
- no duplicate exposure is introduced.

---

# 24. Mandatory Invariants

1. `SectorMaster` cannot post accounting effects.
2. `SecuritySectorAssignment` cannot post accounting effects.
3. Sector allocation is derived, never authoritative accounting state.
4. `security_id` is the durable join key.
5. Sector names must not be copied as accounting truth into transactions.
6. Historical sector assignment is effective-dated.
7. Confirmed assignments for same security/taxonomy/classification level cannot overlap.
8. Current sector cache is non-authoritative.
9. Missing classification remains unknown.
10. `Other` cannot be used as an automatic missing-data bucket.
11. Sector reclassification does not modify quantity.
12. Sector reclassification does not modify cost basis.
13. Sector reclassification does not create realized P&L.
14. Sector reclassification does not modify cash.
15. VN30 membership change does not automatically modify sector classification.
16. Corporate action accounting does not occur in sector entities.
17. Corporate-action successor securities receive their own classification history.
18. Historical analytics must specify/deterministically resolve taxonomy version.
19. Restated taxonomy analytics must be labeled and cannot overwrite as-of historical assignments.
20. Leaf sector exposures plus unknown exposure must reconcile to total securities market value.
21. Parent and child hierarchy exposures cannot be double counted in portfolio totals.
22. Every held position must map to known, unknown or explicit classification error state.
23. Reference-data errors must not be repaired by changing accounting records.
24. Sector corrections require audit lineage/provenance.
25. Classification data must never be guessed merely to force a complete sector allocation.
26. `ASSIGNED` records must reference a sector valid for the assignment date.
27. `UNCLASSIFIED` is an explicit supported state and must remain distinguishable from missing coverage.
28. Only `CURRENT + CONFIRMED` assignment records are authoritative for production lookup.
29. Superseded assignment records remain immutable audit history and cannot coexist as authoritative current truth.
30. Portfolio assignment must use the taxonomy-designated assignable reporting level; parent rollups are derived.
31. Restated analytics require explicit confirmed `SectorTaxonomyMapping`; absent/ambiguous mapping remains unknown.
32. Cross-taxonomy mappings cannot alter accounting records or authoritative historical assignments.

---

# 25. Risks and Mitigations

## Risk 1 — Current-sector look-ahead bias

**Failure:** today’s sector is applied to all historical periods.

**Impact:** historical concentration, decision review and sector attribution become false.

**Mitigation:** mandatory effective-dated `SecuritySectorAssignment`.

**Severity if ignored:** Major.

## Risk 2 — Taxonomy drift

**Failure:** taxonomy provider changes categories and the system silently remaps history.

**Impact:** historical comparisons cease to be reproducible.

**Mitigation:** explicit `SectorTaxonomy` version/effective dates and labeled restatement mode.

**Severity if ignored:** Major.

## Risk 3 — Double counting hierarchy

**Failure:** parent sector and child/subsector values are added together.

**Impact:** sector market value exceeds portfolio securities market value.

**Mitigation:** leaf assignment once; parents are derived rollups only.

**Severity if ignored:** Major.

## Risk 4 — Unknown exposure hidden as Other

**Failure:** missing classifications are pushed into `Other`.

**Impact:** data quality weakness is hidden and concentration may be understated.

**Mitigation:** explicit unknown exposure bucket separate from taxonomy categories.

**Severity if ignored:** Major.

## Risk 5 — Sector cache becomes source of truth

**Failure:** `SecurityMaster.sector_id` is used for historical analysis.

**Impact:** reclassifications rewrite historical exposure logically.

**Mitigation:** cache is derived/reconciled only; historical lookup must use assignment table.

**Severity if ignored:** Major.

## Risk 6 — Sector events mutate accounting

**Failure:** classification change adjusts positions or basis.

**Impact:** portfolio reconstruction no longer matches transaction history.

**Mitigation:** hard accounting isolation invariant.

**Severity if ignored:** Critical.

## Risk 7 — Mixed taxonomy denominator/comparison

**Failure:** securities in one report use incompatible taxonomy versions.

**Impact:** sector concentration totals become semantically inconsistent.

**Mitigation:** one selected taxonomy context per analytical calculation.

**Severity if ignored:** Major.

## Risk 8 — Stale classification source

**Failure:** source changes but project continues using stale current mapping without disclosure.

**Impact:** current concentration analysis is misleading.

**Mitigation:** provenance, effective dates, data-quality status and future freshness controls.

**Severity if ignored:** Major depending on materiality.

## Risk 9 — Correction lineage ambiguity

**Failure:** both original and corrected assignment records remain eligible for authoritative lookup.

**Impact:** historical sector reconstruction becomes non-deterministic or double classified.

**Mitigation:** `record_status` with `CURRENT` vs `SUPERSEDED`; authoritative lookup uses only `CURRENT + CONFIRMED`.

**Severity if ignored:** Major.

## Risk 10 — Heuristic taxonomy restatement

**Failure:** historical sectors are mapped into a new taxonomy by matching names or analyst intuition.

**Impact:** restated sector concentration is irreproducible and may hide or manufacture concentration.

**Mitigation:** explicit `SectorTaxonomyMapping`; ambiguous/absent mappings remain unknown.

**Severity if ignored:** Major.

## Risk 11 — Assignment outside sector validity

**Failure:** a security assignment references a category before it exists or after it is retired.

**Impact:** historical sector analytics become internally inconsistent.

**Mitigation:** assignment validity must be contained within referenced sector-definition validity.

**Severity if ignored:** Major.

---

# 26. Final Proposed Schema

## 25.1 Authoritative reference entities

### `SectorTaxonomy`
Controls taxonomy identity/version and effective project usage.

### `SectorMaster`
Canonical sector/category definitions.

### `SecuritySectorAssignment`
Effective-dated security-to-sector classification and provenance.

### `SectorTaxonomyMapping`
Explicit cross-taxonomy mapping used only for supported restated analytics.

## 25.2 Non-authoritative convenience field

### `SecurityMaster.sector_id`
Optional current cache only; derived from the current confirmed assignment.

## 25.3 Calculated views

### `SectorAllocation`
Per-sector portfolio market value and NAV/invested-assets weights.

### `UnknownSectorExposure`
Market value and weight of held positions lacking confirmed classification.

### `SectorConcentration`
Derived risk analytics over sector allocation.

None of these calculated views can become a second accounting ledger.

---

# 27. Review — Portfolio Manager

## Questions reviewed

- Can current and historical sector exposure be reconstructed correctly?
- Are Legacy Holdings still represented in concentration analysis?
- Can unknown classification hide risk?
- Does sector reclassification distort historical performance or P&L?
- Can later scoring/ranking use a controlled sector taxonomy?

## Findings

### Critical

None unresolved.

### Major

Resolved in v1.2:

1. Separated valid-time assignment state from confidence and correction record status.
2. Added explicit cross-taxonomy mapping ownership for restated analytics.
3. Enforced taxonomy assignable reporting level to prevent parent/child semantic double counting.
4. Added sector-definition validity containment for assignments.
5. Defined explicit `UNCLASSIFIED` vs missing-data semantics.
6. Made correction supersession deterministic for authoritative lookup.

**Unresolved Major: 0.**

### Minor / deferred

1. Exact project taxonomy/provider is intentionally not selected in this file; that decision can be made with data-source implementation without changing the logical model.
2. Sector-specific risk limits belong in `RISK_POLICY.md` / future portfolio workflow, not in reference data.
3. Sector return attribution methodology belongs in later Performance Analytics.

## Portfolio Manager conclusion

**PASS.** The model preserves historical sector exposure, prevents unknown exposure from disappearing and keeps sector classification independent from accounting and index membership.

---

# 28. Review — Data Architect

## Questions reviewed

- Is there one source of truth for sector definition and security classification?
- Can taxonomy evolution be represented without destructive updates?
- Is effective dating unambiguous?
- Are current convenience fields prevented from becoming historical truth?
- Can hierarchy be supported without double counting?

## Findings

### Critical

None unresolved.

### Major

Resolved in v1.2:

1. Assignment state no longer encodes unknown records with a required `sector_id`.
2. `CURRENT/SUPERSEDED` lineage makes correction lookup deterministic.
3. Sector assignment is constrained to sector-definition validity and taxonomy reporting level.
4. `SectorTaxonomyMapping` supplies an explicit source of truth for optional restatement.

**Unresolved Major: 0.**

### Minor / deferred

1. Physical database constraints/indexes will be selected during implementation.
2. If a future provider exposes more granular industry/sub-industry levels, the hierarchy can extend via `classification_level`/`parent_sector_id` without redesign.
3. Bitemporal valid-time + system-time history may be added later if audit requirements exceed current needs; current supersession/provenance contract is sufficient for Milestone 2.

## Data Architect conclusion

**PASS.** Logical ownership is normalized: taxonomy, categories, assignments and calculated allocations are distinct, with deterministic historical lookup.

---

# 29. Review — Risk Manager

## Questions reviewed

- Can sector concentration be understated through missing data?
- Can the same exposure be counted twice?
- Can historical reclassification create look-ahead bias?
- Can sector/reference changes corrupt NAV, cost basis or transaction reconstruction?
- Are incomplete classifications visible to risk reporting?

## Findings

### Critical

None unresolved.

### Major

Resolved in v1.2:

1. Unknown exposure cannot be hidden through `UNCLASSIFIED`, missing-data or ambiguous crosswalk cases.
2. Parent categories cannot receive direct assignments when they are rollups, preventing hierarchy double counting.
3. Corrections cannot leave two authoritative classifications active for the same exposure.

**Unresolved Major: 0.**

### Minor / deferred

1. A future data-quality policy should define freshness SLA for current classifications.
2. Dashboard severity thresholds for unknown-sector exposure should be defined later.
3. Risk limits by sector remain policy/workflow concerns rather than master-data concerns.

## Risk Manager conclusion

**PASS.** Unknown exposure remains explicit, sector totals reconcile to securities market value, and reference-data changes cannot alter accounting balances.

---

# 30. Production-Readiness Gate

| Control | Result |
|---|---|
| Single source of truth for taxonomy | PASS |
| Single source of truth for security-sector assignment | PASS |
| Historical effective dating | PASS |
| Current cache isolation | PASS |
| Taxonomy version control | PASS |
| Assignment state/confidence/version separation | PASS |
| Assignment-to-sector validity containment | PASS |
| Explicit taxonomy crosswalk for restatement | PASS |
| Correction supersession determinism | PASS |
| Unknown classification handling | PASS |
| Sector allocation reconciliation | PASS |
| Hierarchy double-counting protection | PASS |
| VN30 membership boundary | PASS |
| Corporate-action boundary | PASS |
| Cost-basis isolation | PASS |
| Cash reconciliation isolation | PASS |
| Portfolio reconstruction compatibility | PASS |
| Historical reconstruction | PASS |
| Critical unresolved | **0** |
| Major unresolved | **0** |

**Final status:** `PRODUCTION-READY — RE-REVIEWED; AWAITING USER APPROVAL`

---


# 31. v1.2 Focused Audit Changelog

The focused Portfolio Manager / Data Architect / Risk Manager review identified and closed the following Major design defects from v1.0/v1.1:

1. **Assignment-state ambiguity:** unknown/unclassified semantics were mixed with rows requiring a `sector_id`. Fixed by separating `assignment_state`, `confidence_status`, and `record_status`.
2. **Hierarchy assignment ambiguity:** schema allowed direct assignment to parent rollups, creating semantic double-count risk. Fixed with taxonomy-designated assignable reporting level.
3. **Correction ambiguity:** superseded and corrected records lacked authoritative lookup semantics. Fixed with `CURRENT` vs `SUPERSEDED` and immutable correction lineage.
4. **Restatement without source of truth:** current-taxonomy restatement was described without an explicit crosswalk entity. Fixed with `SectorTaxonomyMapping`; missing/ambiguous mapping remains unknown.
5. **Sector-validity mismatch:** assignments could point to inactive categories. Fixed with validity-containment invariant.
6. **Explicit-unclassified provenance gap:** confirmed unclassified periods were indistinguishable from missing coverage. Fixed with explicit `UNCLASSIFIED` state and reasoned lookup results.

Final focused audit result: **0 Critical unresolved / 0 Major unresolved**.

---

# 32. Approval Gate

Do not proceed to `BENCHMARK.md` until this file has been explicitly reviewed and approved.
