# VN30 Value Investing OS — Dashboard Domain Model

**Document:** `06_DASHBOARD/DOMAIN_MODEL.md`  
**Milestone:** 6 — Dashboard & Automation  
**Sub-milestone:** M6.1 — Requirements & Architecture  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-09  

## Governing Baselines

This document operationalizes:

- `06_DASHBOARD/REQUIREMENTS.md` — Approved Baseline v1.0
- `06_DASHBOARD/ARCHITECTURE.md` — Approved Baseline v1.0
- all approved M1–M5 source documents

This document defines M6 executable domain boundaries and invariants.

It does **not** redefine upstream investment/accounting rules.

---

# 1. Purpose

The purpose of this document is to define the business-domain model that the M6 application will implement.

It translates approved M1–M5 concepts into:

- entities;
- value objects;
- aggregates;
- derived projections;
- domain services;
- repositories/ports;
- IDs and lineage;
- lifecycle rules;
- invariants;
- cross-domain references.

The domain model must ensure that:

1. accounting truth remains owned by M2;
2. analytical state cannot become shadow accounting truth;
3. M3 scoring/ranking semantics remain reproducible;
4. M4 Decision States remain authoritative;
5. M5 review/journal workflows remain auditable;
6. implementation can use SQLite/Prisma without making them domain concepts.

---

# 2. Domain Modeling Principles

## DP-1 — Source-of-truth ownership is preserved

Every business fact has exactly one authoritative owner.

Examples:

- transaction event → Transaction aggregate;
- transaction posting → TransactionLeg;
- VN30 membership → VN30Membership;
- sector assignment → SecuritySectorAssignment;
- benchmark observation → BenchmarkObservation;
- score → Scorecard/ScoringRun derived artifact;
- decision → DecisionRecord;
- executed economic event → Transaction.

## DP-2 — Derived state is not an aggregate root of truth

The following are derived projections:

- PortfolioState;
- Position;
- CashState;
- PortfolioValuationSnapshot;
- RiskSnapshot;
- RankingResult;
- BenchmarkComparisonView.

They may be persisted for performance/audit, but cannot be edited to correct economic history.

## DP-3 — Aggregate boundaries follow invariant boundaries

An aggregate shall contain only data that must be transactionally consistent together.

Do not create a giant “Portfolio aggregate” containing transactions, holdings, decisions, reviews, and scorecards.

## DP-4 — Domain objects do not depend on persistence

No domain type shall depend on:

- Prisma;
- SQL;
- SQLite;
- HTTP;
- React;
- Next.js;
- AI SDKs.

## DP-5 — Historical reproducibility is first-class

Persisted analytical artifacts must pin:

- input as-of;
- source identity;
- ledger watermark where relevant;
- methodology identity;
- calculation/run identity.

---

# 3. Domain Map

Recommended bounded modules:

```text
Ledger
Reference
Market Data
Portfolio
Reconciliation
Scoring
Ranking
Decision
DCA
Risk
Performance
Reviews
Journal
Audit & Methodology
Import
```

Dependency direction:

```text
Reference / Market / Ledger
          |
          v
      Portfolio
          |
     +----+----+
     |         |
     v         v
  Scoring    Performance
     |
     v
  Ranking
     |
     +------+
     |      |
     v      v
 Decision  Risk
     |
     v
    DCA

Reviews / Journal / Audit
consume approved outputs from all above,
but do not redefine them.
```

---

# 4. Identity Strategy

Every authoritative or persisted auditable artifact shall have an immutable stable ID.

Recommended logical ID types:

- `PortfolioId`
- `SecurityId`
- `TransactionId`
- `TransactionLegId`
- `CorporateActionEventId`
- `VN30MembershipId`
- `SectorId`
- `SectorAssignmentId`
- `MarketObservationId`
- `BenchmarkObservationId`
- `ImportBatchId`
- `EvidenceId`
- `ScorecardId`
- `ScoringRunId`
- `RankingRunId`
- `DecisionId`
- `ReviewId`
- `JournalEntryId`
- `PortfolioSnapshotId`
- `PerformanceRunId`
- `ReconciliationRunId`
- `MethodologyId`

IDs shall not encode mutable business meaning such as ticker, sector name, or decision state.

Human-readable identifiers may coexist with internal immutable IDs.

---

# 5. Core Value Objects

## 5.1 Money

Logical structure:

```text
Money
- amount
- currency
```

For M6 MVP:

- currency is normally `VND`;
- amount must use exact integer/decimal semantics defined by architecture;
- no binary floating-point authority.

Operations:

- add;
- subtract;
- compare;
- allocate/round only through explicit policy.

## 5.2 ShareQuantity

Represents economic security quantity.

Requirements:

- exact value;
- normally integer shares;
- fractional quantity permitted only if an approved corporate-action rule requires it;
- cannot silently round.

## 5.3 Price

Contains:

- amount;
- currency;
- as-of/effective timestamp where used as an observation.

A `Price` without observation lineage is not sufficient as authoritative market data.

## 5.4 Percentage / Ratio

Exact decimal semantic value.

Used for:

- weights;
- returns;
- rates;
- concentration;
- valuation ratios.

## 5.5 Date/Time Semantics

Use distinct logical types where helpful:

- `EventTime`
- `EffectiveTime`
- `AsOfTime`
- `ImportedAt`
- `PublishedAt`
- `TradeTime`
- `SettlementTime`

Do not collapse all into generic “date”.

## 5.6 SourceReference

Represents provenance:

```text
SourceReference
- sourceType
- sourceName
- sourceReference
- sourceVersion/revision optional
- retrieved/imported timestamp
```

## 5.7 DataQualityStatus

Conceptual values may include:

- CURRENT
- STALE
- PROVISIONAL
- MISSING
- CONFLICTED
- BLOCKED
- NOT_APPLICABLE

Exact allowed status values must follow owning M2/M3 semantics.

## 5.8 EvidenceClassification

Exactly:

- FACT
- ESTIMATE
- ASSUMPTION

where required by M3/M4/M5.

## 5.9 LedgerWatermark

Represents the authoritative ledger state included in a derived result.

It may be implemented using:

- deterministic sequence;
- latest applied transaction/posting sequence;
- immutable replay checkpoint identity.

The exact physical implementation belongs later.

A watermark must support the question:

> “Does this derived portfolio state include transaction X?”

---

# 6. Ledger Domain

## 6.1 Transaction Aggregate Root

`Transaction` is an authoritative aggregate root for one immutable economic event.

Core logical fields include:

- `transactionId`
- `portfolioId`
- `transactionType`
- event/trade/effective timestamps as required
- settlement semantics
- `securityId` where applicable
- execution quantity/price where applicable
- gross amount where applicable
- fee/tax event facts where applicable
- external flow classification
- source/source reference
- corporate action reference where applicable
- correction/reversal reference where applicable
- lifecycle status
- created/posted metadata
- methodology/accounting-policy reference where required

A posted transaction must not be destructively edited.

## 6.2 TransactionLeg

`TransactionLeg` is an immutable posting owned by the transaction event.

Conceptual leg types follow M2, including:

- settled cash;
- receivable/payable;
- security quantity;
- cost-basis adjustment where explicitly authorized;
- other approved M2 posting classes.

TransactionLeg does not independently redefine header event facts.

## 6.3 Transaction Invariants

At minimum:

1. unique immutable TransactionId;
2. posted events are immutable;
3. all legs belong to exactly one transaction;
4. signed legs reconcile according to M2 event rules;
5. SELL cannot create negative long-only quantity;
6. source duplicate rules are enforced;
7. correction uses reversal/supersession rules, not edit-in-place;
8. ordinary BUY/SELL cost basis/P&L remains derived according to M2;
9. trade and settlement effects are not double-counted;
10. AI cannot construct and commit a posted transaction autonomously.

---

# 7. Corporate Action Domain

## 7.1 CorporateActionEvent

Represents authoritative corporate-action terms/reference.

Examples may include M2-approved:

- split/reverse split;
- bonus/stock dividend;
- rights;
- cash dividend;
- merger/reorganization;
- other supported actions.

The event itself does not mutate portfolio balances.

## 7.2 Accounting effects

Portfolio effects occur only through linked immutable transaction/posting events.

This preserves:

```text
CorporateActionEvent = terms/reference
Transaction(s)       = actual investor accounting effects
```

Multi-stage actions may produce multiple linked transactions.

---

# 8. Reference Domain

# 8.1 Security

Stable security identity.

Core fields:

- `securityId`
- ticker/display symbol
- company identity/display name
- exchange/market identity where applicable
- active/reference status

Ticker is not the primary stable key.

## 8.2 VN30Membership

Effective-dated entity.

Fields conceptually:

- `membershipId`
- `securityId`
- effective start
- effective end
- source
- version/correction lineage

Invariant:

For a supported date and authoritative dataset version, membership lookup must be deterministic.

## 8.3 Legacy Holding

Legacy Holding should preferably remain a **derived portfolio eligibility state**, not an independently editable entity:

```text
open position exists
AND
security is no longer current VN30 member
=> LEGACY HOLDING
```

Do not store a manually toggleable `isLegacy` as authoritative truth.

## 8.4 Sector

Stable taxonomy identity.

Fields:

- `sectorId`
- taxonomy ID/version
- code/name
- hierarchy where approved

## 8.5 SecuritySectorAssignment

Effective-dated assignment.

Invariant:

- current sector assignment never rewrites historical classification;
- missing classification remains explicit unknown/unclassified according to M2.

---

# 9. Market Data Domain

## 9.1 MarketPriceObservation

Authoritative normalized observation.

Fields:

- `observationId`
- `securityId`
- price
- as-of timestamp/trading date
- source
- imported/retrieved timestamp
- revision/version
- quality/freshness

A newly imported price does not retroactively replace a historical version without correction lineage.

## 9.2 FundamentalObservation / Evidence

M6 should not force all company fundamentals into one giant universal table.

Use normalized evidence/metric observations capable of preserving:

- security;
- metric identity;
- period;
- raw value/text;
- source;
- evidence classification;
- revision;
- as-of/publication time.

Sector-specific scoring rules remain owned by M3.

## 9.3 BenchmarkObservation

Owns raw VN30 benchmark/index observation.

Must preserve:

- benchmark identity/method;
- observation timestamp;
- value;
- source/revision;
- quality/freshness.

It cannot modify portfolio accounting.

---

# 10. Portfolio Domain

## 10.1 Portfolio

`Portfolio` is an authoritative identity/configuration aggregate, not a bag of mutable balances.

Fields may include:

- `portfolioId`
- display name
- base currency
- inception/opening configuration references
- active status
- non-investment UI preferences where appropriate

It must not store editable:

- current cash;
- current NAV;
- current holdings;
- realized P&L.

## 10.2 PortfolioState

Derived immutable-at-as-of projection.

Inputs:

- ledger watermark;
- valuation as-of;
- relevant market observations;
- reference data;
- reconstruction method.

Outputs:

- settled cash;
- executable cash;
- unsettled obligations/receivables;
- positions;
- realized P&L;
- dividend income;
- market value;
- unrealized P&L;
- NAV;
- weights;
- external capital flows;
- reconstruction status.

`PortfolioState` may be transient or persisted as a snapshot.

## 10.3 Position

Derived value/projection per security.

Fields include:

- securityId;
- quantity;
- open cost;
- average cost;
- current/reference price;
- market value;
- unrealized P&L;
- position weight;
- VN30/Legacy status;
- sector context.

No direct user edit is permitted.

## 10.4 CashState

Derived projection of relevant cash/settlement ledger legs.

Do not create an independent cash ledger aggregate.

---

# 11. Portfolio Snapshot Domain

## 11.1 PortfolioValuationSnapshot

Persisted auditable derived artifact.

Required lineage:

- `portfolioSnapshotId`
- `portfolioId`
- ledger watermark
- valuation as-of
- reconstruction methodology ID
- market observation set/run identity
- reference-data versions where material
- reconciliation status
- created/calculated timestamp

Snapshot data is immutable after creation.

If source data is corrected, create a new snapshot/recalculation rather than mutate historical as-calculated output.

## 11.2 Trust State

A snapshot should expose a trust/actionability state such as:

- VALID
- PROVISIONAL
- STALE
- BLOCKED

Exact semantics follow upstream data/reconciliation policy.

Blocked snapshots cannot support actionable portfolio-aware recommendations.

---

# 12. Reconciliation Domain

## 12.1 ReconciliationRun

A persisted analytical/audit artifact.

Fields:

- `reconciliationRunId`
- portfolio
- as-of
- ledger watermark
- reference snapshot/source
- checks performed
- discrepancies
- overall status
- created timestamp

## 12.2 ReconciliationIssue

Structured discrepancy:

- issue type;
- expected value;
- observed/reference value;
- difference;
- severity;
- source;
- status;
- resolution link.

## 12.3 Rule

Reconciliation detects differences.

It does not repair ledger truth automatically.

Resolution requires an approved authoritative event/correction.

---

# 13. DCA Planning Domain

## 13.1 DCAPlan

A planning entity, not accounting truth.

Conceptual fields:

- period/month;
- planned contribution;
- optional user note/status.

## 13.2 Actual contribution

Actual contribution comes only from authoritative cash-deposit transaction events.

Do not manually store “actual contribution” as a second economic truth.

## 13.3 DCAReviewResult

Derived workflow artifact referencing:

- current cash;
- contribution state;
- eligible candidates;
- lot costs;
- ranking;
- portfolio impact;
- opportunity cost;
- result such as BUY/ACCUMULATE candidate or HOLD CASH;
- rule/methodology versions.

A DCA review result is not an executed transaction.

---

# 14. Scoring Domain

## 14.1 MetricDefinition

Versioned methodology object/reference.

Defines approved M3 metric semantics.

Should include:

- metric ID;
- category/subcategory;
- economic principle;
- formula/rubric;
- unit;
- period;
- normalization rule;
- source hierarchy;
- missing-data rule;
- confidence sensitivity;
- method version.

Do not allow UI users to casually edit production methodology.

## 14.2 MetricObservation

Evidence input tied to a security and period/as-of.

## 14.3 ScoringRun

Represents one reproducible scoring calculation context.

Fields:

- `scoringRunId`
- methodology IDs
- data as-of
- input/evidence set
- calculation timestamp
- result status

## 14.4 Scorecard

Persisted derived analytical artifact per security/run.

Contains:

- category/subcategory scores;
- total score;
- validity;
- confidence;
- evidence lineage;
- normalization;
- missing-data treatment;
- valuation/forward-return data where required by M3;
- optional portfolio context with explicit snapshot reference.

A Scorecard cannot mutate portfolio accounting.

---

# 15. Ranking Domain

## 15.1 RankingRun

A persisted derived calculation over eligible scorecards.

Fields:

- `rankingRunId`
- universe/membership as-of
- scoring run/input scorecards
- ranking methodology ID
- portfolio snapshot ID where portfolio-aware
- run timestamp

## 15.2 RankingEntry

Contains:

- security;
- rank;
- score;
- confidence;
- validity/actionability;
- tie cluster/context;
- exclusion reason where applicable.

## 15.3 Ranking views

Domain should distinguish where M3 requires:

- research ranking;
- actionable allocation ranking;
- Top 10.

A UI sort is not a RankingRun.

---

# 16. Decision Domain

## 16.1 DecisionRecord

Immutable formal analytical record produced by M4.

Required fields follow approved `DECISION_TEMPLATE.md`, including:

- DecisionId;
- decision date;
- data as-of;
- portfolio as-of/snapshot;
- security;
- membership/eligibility;
- ownership;
- Stage 0;
- score/rank references;
- thesis;
- valuation/expected return;
- risk/veto;
- confidence;
- portfolio context;
- opportunity cost;
- Decision State;
- Decision Qualifier;
- Execution Status;
- sizing result;
- reasons;
- risks;
- invalidation;
- review triggers;
- methodology lineage;
- prior DecisionId where applicable.

## 16.2 Decision State

Exactly one of:

- STRONG BUY
- BUY
- ACCUMULATE
- HOLD
- REDUCE
- SELL
- AVOID

No eighth state.

## 16.3 Execution status

Separate domain value from Decision State.

It must never mutate the semantic Decision State.

## 16.4 Decision immutability

After finalization, a formal decision record is immutable.

A changed view requires a new decision referencing the prior one.

---

# 17. Risk Domain

## 17.1 RiskAssessment / RiskSnapshot

Derived artifact consuming:

- PortfolioState/Snapshot;
- sector assignments;
- thesis/decision status;
- confidence;
- drawdown/performance;
- data/reconciliation state.

Outputs:

- risk metrics;
- flags;
- overall statuses required by M5:
  - GREEN
  - WATCH
  - WARNING
  - BREACH

## 17.2 Rule ownership

Risk domain applies approved policy.

Risk thresholds/rules must not be user-configurable in ordinary dashboard settings unless an upstream approved policy explicitly permits configuration.

---

# 18. Performance Domain

## 18.1 PerformanceMethodology

Versioned methodology identity for:

- TWR/unitized calculation;
- XIRR where applicable;
- CAGR;
- drawdown;
- benchmark comparison.

## 18.2 PortfolioPerformanceObservation

Derived, reproducible observation.

Inputs:

- ledger/external flows;
- portfolio valuations;
- performance method.

Outputs may include:

- unit value;
- period return;
- cumulative TWR;
- high-water mark;
- drawdown.

## 18.3 BenchmarkComparison

Derived comparison artifact.

Must preserve:

- portfolio performance method;
- benchmark identity/method;
- aligned observation periods;
- compatibility/limitation status.

Do not compare unlike methodologies without disclosure.

---

# 19. Review Domain

## 19.1 ReviewRecord

Common persisted envelope.

Fields:

- `reviewId`
- review type
- trigger
- review date
- data as-of
- portfolio snapshot
- evidence/reference set
- data quality
- findings
- risk status
- operating outcome
- linked decisions
- linked transactions
- unresolved actions
- next review/follow-up

## 19.2 Review types

At minimum:

- WEEKLY
- MONTHLY_DCA
- QUARTERLY
- ANNUAL
- EVENT_DRIVEN
- VN30_RECONSTITUTION
- PORTFOLIO_RISK
- PERFORMANCE
- BEHAVIORAL
- DECISION_AUDIT

## 19.3 Operating outcome

Review outcome must remain distinct from Decision State.

Examples from M5 include:

- NO ACTION
- HOLD CASH
- REVIEW REQUIRED
- DECISION REQUIRED

Do not force every ReviewRecord to contain a DecisionId.

---

# 20. Journal Domain

## 20.1 JournalEntry

Append-oriented analytical record.

May link:

- DecisionId;
- ReviewId;
- SecurityId;
- PortfolioSnapshotId;
- TransactionId where executed;
- Evidence references.

It should capture:

- thesis/reason;
- risks;
- valuation;
- portfolio context;
- invalidation;
- behavioral observations;
- later lessons.

## 20.2 Historical decision review

3/6/12-month review should create a new linked audit/review artifact.

Do not modify the historical original decision to add hindsight.

---

# 21. Evidence Domain

## 21.1 EvidenceRecord

Common reference for material analytical evidence.

Fields:

- EvidenceId;
- security/subject;
- classification: FACT / ESTIMATE / ASSUMPTION;
- source;
- source publication date;
- data as-of/effective period;
- normalized value/text;
- confidence/data-quality;
- import/reference lineage.

Evidence must not be used to carry authoritative portfolio balances.

---

# 22. Methodology & Baseline Registry

## 22.1 MethodologyRecord

Immutable identity.

Fields:

- `methodologyId`
- family/type
- semantic version
- status/approval identity
- effective date
- configuration snapshot/reference
- implementation/build identity or content hash
- governing document reference

Families may include:

- INVESTMENT_POLICY
- ACCOUNTING_RECONSTRUCTION
- SCORING
- METRIC_DEFINITION
- NORMALIZATION
- RANKING
- DECISION_ENGINE
- RISK
- PERFORMANCE
- IMPORT_SCHEMA where versioned behavior matters

## 22.2 Baseline approval

The registry records approval.

It does not grant approval.

Approval remains a project governance action.

---

# 23. Import Domain

## 23.1 ImportBatch

Represents one staged/committed file import.

Fields:

- ImportBatchId;
- import type;
- file metadata/hash;
- source;
- started/completed timestamps;
- schema version;
- status;
- accepted/rejected counts;
- commit identity.

## 23.2 ImportRowResult

Contains:

- source row;
- parsed/normalized data;
- validation errors;
- duplicate/conflict status;
- accepted/rejected status.

## 23.3 Import lifecycle

Conceptually:

```text
STAGED
 -> VALIDATED
 -> READY_TO_COMMIT
 -> COMMITTED

or

STAGED/VALIDATED
 -> REJECTED/CANCELLED
```

Committed accounting imports create authoritative ledger records through application use cases.

ImportBatch itself does not bypass ledger invariants.

---

# 24. Domain Status vs UI Status

UI badges are representations of domain values.

Examples:

```text
RiskStatus.BREACH
DataQuality.STALE
DecisionState.BUY
ExecutionStatus.REQUIRES_CASH_ACCUMULATION
```

The UI must not reverse-engineer domain states from:

- colors;
- score thresholds;
- P&L sign;
- arbitrary age checks.

---

# 25. Aggregate Boundaries

Recommended aggregate roots:

| Aggregate Root | Owns |
|---|---|
| Portfolio | stable portfolio identity/config |
| Transaction | event header + immutable legs |
| CorporateActionEvent | authoritative action reference/terms |
| Security | stable security identity |
| VN30Membership | effective membership record |
| Sector / Taxonomy | sector identity/taxonomy |
| SecuritySectorAssignment | effective assignment |
| MarketPriceObservation | raw normalized price observation |
| BenchmarkObservation | raw benchmark observation |
| ImportBatch | staged import/audit lifecycle |
| MethodologyRecord | immutable method identity |
| ReviewRecord | persisted review workflow record |
| DecisionRecord | final formal decision record |
| JournalEntry | append-oriented journal record |

Persisted derived artifacts such as Scorecard, RankingRun, PortfolioSnapshot, RiskSnapshot, PerformanceRun, ReconciliationRun may also have durable IDs, but they are **derived records**, not economic source-of-truth aggregates.

---

# 26. Cross-Aggregate Consistency

Do not rely on giant database transactions spanning unrelated analytical artifacts.

Use these principles:

## 26.1 Authoritative economic event

Transaction + its required postings must commit atomically.

## 26.2 Derived artifacts

After commit:

- affected projections become stale by watermark;
- rebuild/recalculation creates new derived artifacts;
- failures block actionability but do not corrupt authoritative ledger.

## 26.3 Decision creation

A DecisionRecord references an existing valid portfolio snapshot/ranking/scorecard rather than copying them as new authoritative data.

Relevant snapshot values may be copied for audit readability only if marked as snapshot data.

---

# 27. Numeric Storage Contract

This document does not yet choose exact Prisma/SQLite column types.

The domain contract is:

1. exact round-trip for authoritative values;
2. no unexplained precision loss;
3. explicit scale;
4. explicit rounding boundaries;
5. no binary-float authority.

Candidate physical strategies for later implementation:

- integer scaled units;
- decimal serialized representation;
- ORM-supported decimal where round-trip tests prove correctness.

`DOMAIN_MODEL.md` approves the semantic contract, not a storage shortcut.

---

# 28. Effective-Dating Contract

Effective-dated entities must support deterministic lookup as of time `T`.

Rules:

1. no overlapping authoritative effective ranges for the same logical dimension unless explicitly modeled;
2. corrections use version/supersession lineage;
3. current convenience fields cannot replace historical lookup;
4. unknown periods remain unknown rather than inferred from nearest current value.

Applies at minimum to:

- VN30 membership;
- sector assignment;
- market observations by date;
- benchmark observations;
- methodology effective periods where relevant.

---

# 29. Deletion Policy

## Authoritative records

Normally not hard-deleted after production commit:

- posted transactions;
- transaction legs;
- finalized decisions;
- finalized reviews/journal audit records;
- committed import audit metadata required for provenance;
- approved methodology records.

Correction uses:

- reversal;
- supersession;
- replacement version;
- deactivation where conceptually valid.

## Derived caches

May be safely deleted/rebuilt if authoritative history and lineage remain intact.

---

# 30. Domain Services

Recommended pure or mostly-pure services:

- `LedgerReplayService`
- `CostBasisService`
- `PortfolioValuationService`
- `ReconciliationService`
- `PerformanceService`
- `ScoringService`
- `RankingService`
- `DecisionService`
- `PositionSizingService`
- `OpportunityCostService`
- `DcaPlannerService`
- `RiskAssessmentService`
- review-specific evaluators

Services should take explicit inputs.

Avoid services that silently query global current state.

---

# 31. Repository Ports

Repository interfaces should align with aggregate/source ownership.

Examples:

- TransactionRepository
- CorporateActionRepository
- SecurityRepository
- VN30MembershipRepository
- SectorRepository
- MarketObservationRepository
- BenchmarkRepository
- MethodologyRepository
- ReviewRepository
- DecisionRepository
- JournalRepository
- ImportBatchRepository

Derived read stores may have separate query ports:

- PortfolioSnapshotQuery
- RankingQuery
- RiskQuery
- PerformanceQuery

Do not create a generic `Repository<T>` if it obscures business-specific invariant needs.

---

# 32. Domain Events

A distributed event bus is not required.

Internal application/domain events may be used where they simplify orchestration.

Examples:

- `TransactionPosted`
- `TransactionReversed`
- `PriceImported`
- `FundamentalEvidenceUpdated`
- `VN30MembershipChanged`

Their purpose is local orchestration/invalidation.

They must not become another authoritative source of economic truth.

---

# 33. Example: BUY Lifecycle

```text
User submits BUY
  |
  v
RecordTransaction use case
  |
  +-- validate structure
  +-- validate domain invariants
  +-- create Transaction + TransactionLegs
  |
  v
atomic ledger commit
  |
  +-- advance/invalidate ledger watermark-dependent views
  |
  v
rebuild PortfolioState
  |
  v
reconciliation
  |
  v
new PortfolioSnapshot
```

Any earlier BUY recommendation is linked through DecisionId.

The DecisionRecord did not itself change cash or shares.

---

# 34. Example: Monthly DCA Lifecycle

```text
Cash deposit transaction(s)
      |
      v
PortfolioSnapshot
      |
Scorecards / Ranking
      |
Decision / Risk / Opportunity Cost
      |
      v
DCAReviewResult
      |
  +---+---+
  |       |
BUY/ADD  HOLD CASH
  |
explicit user execution
  |
Transaction
```

This flow preserves:

- no forced monthly deployment;
- no AI/autonomous execution;
- no duplicate DCA accounting.

---

# 35. Example: Historical Decision Audit

```text
DecisionId
   |
   +--> pinned MethodologyIds
   +--> ScorecardId / RankingRunId
   +--> PortfolioSnapshotId
   +--> Data As-Of
   +--> EvidenceIds
   +--> ReviewId
   +--> TransactionId if executed
```

A later audit can reproduce the decision context without replacing the original result with current data.

---

# 36. Data Ownership Matrix

| Concept | Type | Authoritative? | Owner |
|---|---|---:|---|
| Transaction | Entity/Aggregate | Yes | Ledger |
| TransactionLeg | Entity within transaction | Yes | Ledger |
| Current cash | Derived projection | No | Portfolio |
| Position quantity view | Derived projection | No | Portfolio |
| Cost basis view | Derived | No | Portfolio/replay |
| VN30 membership | Effective entity | Yes | Reference |
| Sector assignment | Effective entity | Yes | Reference |
| Market price observation | Observation | Yes for source dataset | Market |
| Scorecard | Derived analytical artifact | No | Scoring |
| Ranking | Derived analytical artifact | No | Ranking |
| DecisionRecord | Formal analytical record | Yes as historical decision fact | Decision |
| ReviewRecord | Workflow/audit record | Yes as historical review fact | Reviews |
| Executed BUY/SELL | Economic fact | Yes | Ledger |
| RiskSnapshot | Derived analytical artifact | No | Risk |
| NAV | Derived | No | Portfolio |
| Benchmark observation | Observation | Yes for benchmark dataset | Performance/Reference |
| TWR/XIRR result | Derived | No | Performance |

“Authoritative” for DecisionRecord/ReviewRecord means authoritative history of what the system decided/reviewed, **not** authority over accounting balances.

---

# 37. MVP Domain Scope

Must support in first production-capable implementation:

- Portfolio;
- Transaction + TransactionLeg;
- Security;
- VN30Membership;
- Sector + assignment;
- market prices;
- benchmark observations;
- PortfolioState/Snapshot;
- reconciliation;
- DCA planning/review;
- scoring/run/scorecard;
- ranking/run;
- formal decisions;
- risk snapshots;
- review records;
- journal;
- methodology registry;
- import batches;
- performance observations/comparisons.

Advanced provider/vendor-specific schemas remain outside core domain.

---

# 38. Domain Model Acceptance Criteria

`DOMAIN_MODEL.md` is acceptable only if:

1. M2 transaction ledger remains authoritative.
2. No mutable Position/Cash entity becomes accounting truth.
3. Portfolio balances are reconstructable from ledger + approved observations/policy.
4. Ledger watermark semantics prevent stale derived state from masquerading as current.
5. Corporate action terms remain separate from actual portfolio postings.
6. VN30/sector history is effective-dated.
7. Legacy Holding is derived, not manually toggled.
8. scoring/ranking artifacts remain analytical.
9. exactly seven M4 Decision States remain.
10. execution remains separate from recommendation.
11. actual contribution comes from transactions, not DCA planning records.
12. review outcome remains separate from Decision State.
13. methodology identities are immutable/reproducible.
14. finalized decision/review/journal history is append-oriented.
15. numeric semantic contract prohibits binary-float authority.
16. imports cannot bypass domain/ledger invariants.
17. derived caches can be safely rebuilt.
18. repository/domain interfaces do not depend on Prisma.
19. no M1–M5 investment rule is added or altered.
20. unresolved implementation ambiguity is deferred explicitly rather than guessed.

---

# 39. Initial Multi-Role Review

## Product Manager

### Critical
0 unresolved.

### Major resolved
- Separated planning records from executed economic truth.
- Separated review results from investment Decision States.
- Kept MVP domain comprehensive without vendor-specific over-modeling.

**Result:** PASS.

## Software Architect

### Critical
0 unresolved.

### Major resolved
- Avoided giant Portfolio aggregate.
- Defined aggregate vs derived-artifact boundaries.
- Added ledger-watermark consistency.
- Avoided generic repository abstraction where harmful.

**Result:** PASS.

## Portfolio Manager

### Critical
0 unresolved.

### Major resolved
- Legacy Holding derived correctly.
- DCA contribution vs deployment separated.
- Decision/audit chain preserves historical portfolio context.
- Stale/blocked portfolio state cannot support actionable recommendation.

**Result:** PASS.

## Data Engineer

### Critical
0 unresolved.

### Major resolved
- Effective dating is explicit.
- Methodology versioning is persisted.
- Numeric domain contract avoids premature SQLite type assumptions.
- Reconciliation and import lineage are first-class.

**Result:** PASS.

## Security Reviewer

### Critical
0 unresolved.

### Major resolved
- AI remains outside ledger aggregates.
- Imports cannot directly become authoritative accounting without application/domain validation.
- No broker credentials/orders appear in domain model.

### Minor
- Detailed PII/local encryption/access-control design remains owned by `SECURITY.md`.

**Result:** PASS.

---

# 40. Issue Register

## Critical unresolved

**0**

## Major unresolved

**0**

## Minor / Deferred

1. exact SQLite/Prisma numeric column representation;
2. exact ledger-watermark physical implementation;
3. exact score/evidence relational schema;
4. exact table normalization for analytical snapshots;
5. exact import schemas;
6. exact risk snapshot persistence policy;
7. exact cache invalidation mechanism;
8. exact MethodologyRecord content-hash/build format.

These belong to subsequent M6 design/implementation documents and do not require changing upstream rules.

---

# 41. Approval Gate

Current state:

> **APPROVED BASELINE v1.0**

If approved:

1. promote `06_DASHBOARD/DOMAIN_MODEL.md` to **Approved Baseline v1.0**;
2. create/update its approved baseline artifact;
3. continue automatically to:
   **`06_DASHBOARD/DATA_FLOW.md`**;
4. do not move beyond `DATA_FLOW.md` until that file is reviewed and approved.
