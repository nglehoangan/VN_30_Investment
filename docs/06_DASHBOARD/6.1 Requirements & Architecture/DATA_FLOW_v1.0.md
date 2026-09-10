# VN30 Value Investing OS — Dashboard Data Flow

**Document:** `06_DASHBOARD/DATA_FLOW.md`  
**Milestone:** 6 — Dashboard & Automation  
**Sub-milestone:** M6.1 — Requirements & Architecture  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-09  

## Governing Baselines

This document operationalizes:

- `06_DASHBOARD/REQUIREMENTS.md` — Approved Baseline v1.0
- `06_DASHBOARD/ARCHITECTURE.md` — Approved Baseline v1.0
- `06_DASHBOARD/DOMAIN_MODEL.md` — Approved Baseline v1.0
- all approved M1–M5 documents

This document defines how data moves through the M6 application.

It does **not** redefine:

- accounting rules;
- scoring rules;
- ranking rules;
- Decision States;
- DCA eligibility;
- risk thresholds;
- review semantics.

---

# 1. Purpose

The purpose of this document is to define deterministic, auditable data movement across:

- user input;
- file imports;
- authoritative ledger writes;
- market/reference data ingestion;
- portfolio reconstruction;
- scoring;
- ranking;
- decision;
- DCA;
- risk;
- performance;
- reviews;
- journal;
- exports/backups;
- AI-assisted workflows.

The core design objective is:

> **Every material output must be traceable backward to its authoritative inputs and methodology, while no derived output may silently become authoritative input for accounting truth.**

---

# 2. Data Flow Principles

## DF-P1 — Authoritative-first

Economic facts enter authoritative storage before any derived portfolio state is treated as current.

## DF-P2 — Validate before commit

All untrusted inputs pass through:

1. structural validation;
2. domain validation;
3. duplicate/conflict checks;
4. preview where user-entered/imported;
5. explicit commit for authoritative writes.

## DF-P3 — Derived after source

Derived outputs may only be calculated from authoritative facts plus approved methodology and dated observations.

## DF-P4 — Watermark every portfolio-aware flow

Any derived portfolio-aware result must be tied to a ledger watermark or equivalent authoritative-state identifier.

## DF-P5 — Staleness is explicit

If source data changes, dependent derived data must be:

- invalidated;
- marked stale;
- rebuilt;
- or blocked from actionability.

## DF-P6 — No silent fallback

If a required source is missing/conflicted/stale beyond approved policy:

- show the condition;
- degrade confidence/actionability;
- do not invent values.

---

# 3. High-Level Data Flow

```text
                    +----------------------+
                    | User / Manual Input  |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    | Validation / Staging |
                    +----------+-----------+
                               |
                +--------------+--------------+
                |                             |
                v                             v
      +-------------------+         +----------------------+
      | Authoritative     |         | Analytical Evidence  |
      | Ledger / Ref Data |         | / Market Observations|
      +---------+---------+         +----------+-----------+
                |                              |
                +--------------+---------------+
                               |
                               v
                    +----------------------+
                    | Domain Calculations  |
                    +----------+-----------+
                               |
        +----------------------+----------------------+
        |          |           |          |           |
        v          v           v          v           v
   Portfolio    Scoring      Ranking    Risk     Performance
        |          |           |          |           |
        +----------+-----------+----------+-----------+
                               |
                               v
                    +----------------------+
                    | Decision / DCA /     |
                    | Review Workflows     |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    | Journal / Audit      |
                    +----------+-----------+
                               |
                  +------------+------------+
                  |                         |
                  v                         v
            User Explicit             Export / Backup
             Execution
                  |
                  v
             Transaction
```

---

# 4. Transaction Entry Flow

## 4.1 Manual transaction input

```text
Transaction Form
   |
   v
Zod structural validation
   |
   v
Application use case
   |
   v
Domain validation
   |
   +--> duplicate/source check
   +--> cash/quantity rules
   +--> oversell check
   +--> settlement/event checks
   |
   v
Preview
   |
User explicit confirm
   |
   v
Atomic ledger commit
   |
   +--> Transaction
   +--> TransactionLeg(s)
   +--> audit metadata
   +--> watermark advance/invalidation
   |
   v
Portfolio rebuild
   |
   v
Reconciliation
   |
   v
New PortfolioSnapshot
```

## 4.2 Failure behavior

If validation fails:

- no authoritative write occurs.

If ledger commit succeeds but projection rebuild fails:

- transaction remains authoritative;
- old projections become stale/blocked;
- actionability is blocked;
- reconciliation issue is surfaced.

The system must never create a compensating fake transaction just because a cache/projection update failed.

---

# 5. Transaction Correction Flow

```text
Original Transaction
   |
   v
User selects correction/reversal
   |
   v
System loads original immutable event
   |
   v
Create linked reversal/correction event
   |
   v
Validate
   |
   v
Explicit user confirm
   |
   v
Atomic commit
   |
   v
Replay / rebuild
   |
   v
Reconciliation
```

No edit-in-place path exists for posted transactions.

---

# 6. Cash Contribution Flow

```text
CASH_DEPOSIT
   |
   v
Ledger
   |
   v
CashState / PortfolioState
   |
   v
Monthly DCA context
```

Important:

- planned contribution is not accounting truth;
- actual contribution comes only from committed cash-deposit transactions;
- contribution does not imply purchase.

---

# 7. Market Price Import Flow

```text
CSV / Excel / future provider
   |
   v
Parser
   |
   v
Structural validation
   |
   v
Normalize to MarketPriceObservation
   |
   +--> source
   +--> security identity
   +--> as-of
   +--> imported_at
   +--> revision
   |
   v
Duplicate/conflict detection
   |
   v
Preview / commit
   |
   v
Persist observation
   |
   +--> invalidate affected valuations
   +--> invalidate affected performance
   +--> flag valuation-sensitive score inputs
   |
   v
Selective recalculation
```

A new price does **not** automatically refresh unrelated fundamental score categories.

---

# 8. Fundamental Data Import Flow

```text
Source file/provider
   |
   v
Normalize evidence/metric observations
   |
   v
Validate:
- security
- period
- source
- FACT/ESTIMATE/ASSUMPTION
- units
- freshness
   |
   v
Persist evidence
   |
   v
Determine affected metrics
   |
   v
Selective score invalidation/recalculation
```

No global full-VN30 rescore is required unless materially affected by approved rules.

---

# 9. VN30 Membership Flow

```text
Authoritative VN30 source
   |
   v
Import / validate effective-dated membership
   |
   v
Persist VN30Membership
   |
   +--> identify entrants
   +--> identify exits
   +--> derive Legacy Holdings
   |
   v
Trigger M5 VN30 Reconstitution Review
```

No automatic BUY for entrant.

No automatic SELL for exit.

---

# 10. Sector Assignment Flow

```text
Sector source/taxonomy
   |
   v
Validate taxonomy + effective period
   |
   v
Persist SecuritySectorAssignment
   |
   v
Invalidate affected:
- sector exposure
- sector ranking context
- sector normalization context where applicable
```

Historical sector views continue to use historical effective assignments.

---

# 11. Corporate Action Flow

```text
Corporate action reference
   |
   v
CorporateActionEvent
   |
   +--> validate terms/effective dates
   |
   v
Await accounting-effective stage
   |
   v
User/system-assisted creation of linked transaction(s)
   |
   v
Explicit commit
   |
   v
Ledger replay
   |
   v
Portfolio rebuild
```

The reference event itself never mutates holdings/cash.

---

# 12. Portfolio Reconstruction Flow

Inputs:

- ledger watermark;
- authoritative transactions/legs;
- reconstruction methodology;
- dated prices;
- reference data.

Flow:

```text
Ledger replay
   |
   +--> quantity
   +--> cash
   +--> cost basis
   +--> realized P&L
   +--> dividend income
   |
   v
Apply market observations
   |
   +--> market value
   +--> unrealized P&L
   +--> NAV
   |
   v
Apply reference data
   |
   +--> VN30 status
   +--> Legacy status
   +--> sector
   |
   v
PortfolioState
   |
   v
PortfolioSnapshot
```

Every persisted snapshot must store:

- ledger watermark;
- valuation as-of;
- reconstruction methodology;
- relevant market/reference versions;
- trust/reconciliation status.

---

# 13. Reconciliation Flow

```text
Reconstructed PortfolioState
        |
        +----------------------+
        |                      |
        v                      v
Broker/reference snapshot   Internal expected balances
        |                      |
        +----------+-----------+
                   |
                   v
          ReconciliationService
                   |
         +---------+----------+
         |                    |
         v                    v
      PASS                Discrepancy
                              |
                              v
                     ReconciliationIssue
```

Discrepancy behavior:

- warn;
- block affected actionability where material;
- require explicit correction workflow;
- never silently patch ledger.

---

# 14. Scoring Flow

```text
Metric/Evidence observations
        |
        v
Freshness + quality validation
        |
        v
Metric normalization
        |
        v
Sector-specific approved treatment
        |
        v
Subcategory score
        |
        v
Category score
        |
        v
Total score
        |
        +--> validity
        +--> confidence
        +--> missing-data status
        +--> evidence lineage
        |
        v
Scorecard
```

Scorecard data may reference portfolio context, but accounting values remain snapshots from PortfolioState.

---

# 15. Ranking Flow

```text
Scorecards
 + VN30 membership
 + confidence
 + validity
 + valuation / forward return
 + approved portfolio-aware context
        |
        v
RankingService
        |
        +--> research ranking
        +--> actionable ranking
        +--> Top 10
```

If portfolio reconciliation is blocked:

- research ranking may remain available;
- actionable ranking must be blocked or clearly non-actionable according to M3/M4 rules.

---

# 16. Decision Flow

```text
Eligibility
+ Investability
+ Scorecard
+ Ranking
+ Thesis
+ Valuation
+ Risk
+ PortfolioSnapshot
+ Cash
+ Lot feasibility
+ Opportunity cost
+ Market/technical context
        |
        v
DecisionService
        |
        +--> Decision State
        +--> Decision Qualifier
        +--> Execution Status
        +--> Sizing
        +--> Invalidation
        +--> Review triggers
        |
        v
DecisionRecord
```

DecisionRecord is analytical truth of what was decided.

It does not modify cash or shares.

---

# 17. DCA Flow

```text
DCAPlan
+ Actual contribution from ledger
+ Existing cash
+ PortfolioSnapshot
+ Ranking
+ Current prices
        |
        v
DCA orchestration
        |
        +--> candidate filtering
        +--> lot feasibility
        +--> risk impact
        +--> sector impact
        +--> opportunity cost
        |
        v
DCAReviewResult
        |
        +--> BUY candidate
        +--> ACCUMULATE candidate
        +--> HOLD CASH
```

If user chooses execution:

```text
DCAReviewResult
   |
   v
Formal DecisionRecord where required
   |
   v
Explicit user transaction action
   |
   v
Ledger
```

---

# 18. Risk Flow

```text
PortfolioSnapshot
+ sector exposure
+ thesis/decision status
+ confidence
+ drawdown/performance
+ reconciliation/data quality
        |
        v
RiskAssessmentService
        |
        +--> metrics
        +--> flags
        +--> GREEN/WATCH/WARNING/BREACH
        |
        v
RiskSnapshot
```

RiskSnapshot cannot repair or mutate source data.

---

# 19. Performance Flow

```text
Portfolio valuations
+ external flows
+ dividends
+ performance methodology
        |
        v
PerformanceService
        |
        +--> unitized/TWR
        +--> XIRR
        +--> CAGR
        +--> drawdown
        |
        v
PortfolioPerformanceObservation
```

Benchmark:

```text
BenchmarkObservation(s)
        |
        v
Benchmark alignment/methodology compatibility
        |
        v
BenchmarkComparison
```

If benchmark methodology is only partially comparable:

- disclose limitation;
- do not present false precision.

---

# 20. Weekly Review Flow

```text
Latest valid PortfolioSnapshot
+ new material evidence
+ risk status
+ data quality
+ unresolved prior actions
        |
        v
Weekly Review evaluator
        |
        +--> NO ACTION
        +--> REVIEW REQUIRED
        +--> DECISION REQUIRED
```

A week passing does not itself cause:

- full rescore;
- rerank;
- trade.

---

# 21. Monthly DCA Review Flow

```text
Portfolio integrity gate
   |
   v
Actual/planned contribution
   |
   v
Selective market/scoring refresh
   |
   v
Ranking
   |
   v
DCA Planner
   |
   v
Opportunity Cost
   |
   +--> BUY
   +--> ACCUMULATE
   +--> HOLD CASH
```

All capital deployment remains explicit and user-confirmed.

---

# 22. Quarterly Review Flow

```text
Fresh fundamental evidence
        |
        v
Thesis review
        |
        v
Scoring refresh where required
        |
        v
Valuation/risk update
        |
        v
Ranking refresh
        |
        v
Portfolio review
        |
        v
Decision escalation if needed
```

Historical decisions remain untouched.

---

# 23. Event-Driven Review Flow

```text
Material event detected
   |
   v
Evidence validation
   |
   v
Materiality assessment
   |
   +--> no material impact -> record/no action
   |
   +--> material impact
            |
            v
        deep review
            |
            v
      DecisionService if required
```

Headline alone never becomes direct Buy/Sell authority.

---

# 24. Journal Flow

```text
Decision / Review / Transaction context
        |
        v
JournalEntry
        |
        +--> thesis
        +--> rationale
        +--> risks
        +--> invalidation
        +--> behavioral notes
```

Later 3/6/12-month audit:

```text
Historical Decision
   |
   v
New DecisionAudit Review
```

No hindsight mutation of original record.

---

# 25. AI-Assisted Flow

Allowed:

```text
Evidence / Review context
   |
   v
AI adapter
   |
   v
Structured draft
   |
   v
Schema validation
   |
   v
Human/domain review
   |
   v
Analytical artifact
```

Forbidden:

```text
AI
 -> TransactionRepository
 -> Ledger commit
```

AI output that cannot be validated must remain non-authoritative draft data.

---

# 26. Import Batch Flow

```text
File
 |
 v
ImportBatch(STAGED)
 |
 v
Parse
 |
 v
Validate rows
 |
 +--> accepted
 +--> rejected
 +--> duplicate/conflict
 |
 v
Preview
 |
User confirm
 |
 v
ImportBatch(COMMITTING)
 |
 v
Application use cases
 |
 v
Authoritative writes / observations
 |
 v
ImportBatch(COMMITTED)
```

Import audit must preserve:

- source file metadata/hash;
- schema version;
- accepted/rejected counts;
- row-level errors;
- commit references.

---

# 27. Export Flow

```text
Canonical / derived records
   |
   v
Export service
   |
   +--> CSV
   +--> portfolio snapshot
   +--> journal/review export
```

Export does not mutate source records.

Spreadsheet-safe output must prevent formula injection where applicable.

---

# 28. Backup Flow

```text
Application state
   |
   v
Quiesce/consistent SQLite backup mechanism
   |
   +--> DB snapshot
   +--> schema/app version
   +--> ledger watermark
   +--> methodology registry version
   +--> manifest/checksum
   |
   v
Backup artifact
```

Restore:

```text
Backup
   |
   v
Restore DB
   |
   v
Schema/version validation
   |
   v
Rebuild derived projections
   |
   v
Reconciliation
```

Backup is not considered valid merely because a file exists.

---

# 29. Invalidation Matrix

Minimum invalidation behavior:

| Source change | Affected derived outputs |
|---|---|
| Transaction commit | Portfolio, reconciliation, risk, performance, portfolio-aware ranking/decision |
| Transaction reversal | Same as transaction commit |
| New price | Valuation, unrealized P&L, NAV, performance, valuation-sensitive score/decision inputs |
| Fundamental evidence | Affected scorecard, ranking, decision/review as material |
| VN30 membership | Eligibility, Legacy status, ranking/actionability, reconstitution review |
| Sector assignment | Sector exposure, sector ranking context, risk |
| Benchmark observation | Benchmark comparison/performance comparison |
| Methodology update | New calculations only under new method version; historical outputs preserved |
| Reconciliation failure | Portfolio-aware actionability blocked |
| Corporate action accounting stage | Portfolio, reconciliation, performance, affected score comparability |

---

# 30. Recalculation Policy

The application shall prefer **targeted recalculation**.

Do not:

- rebuild all scorecards for a price update;
- rerun all reviews after unrelated data changes;
- rerank when no ranking-relevant input changed.

Do:

- use dependency-aware invalidation;
- preserve old valid historical outputs;
- create a new calculation run when needed.

---

# 31. Error Propagation

Example:

```text
Missing/stale price
   |
   v
Valuation unavailable/provisional
   |
   v
PortfolioSnapshot trust reduced
   |
   v
Risk/Decision actionability reduced or blocked
```

Example:

```text
Reconciliation breach
   |
   v
Portfolio-aware calculations flagged
   |
   v
Actionable ranking/Decision blocked
```

Errors must propagate semantically.

They must not be swallowed by UI fallback values.

---

# 32. Data Freshness Propagation

Every material analytical flow shall preserve:

```text
source
as_of
imported_at
freshness_state
```

An output may have a recent calculation timestamp while still being stale because its source data is old.

UI must show source freshness, not just “last calculated”.

---

# 33. Audit Lineage Flow

Canonical audit chain:

```text
Source
 -> ImportBatch / Observation
 -> Evidence
 -> PortfolioSnapshot
 -> Scorecard
 -> RankingRun
 -> Review
 -> DecisionRecord
 -> User Execution
 -> Transaction
 -> Later DecisionAudit
```

Not every workflow uses every node.

But any existing link must be durable and queryable.

---

# 34. Concurrency Model

MVP is single-user, but writes still require deterministic consistency.

Rules:

- authoritative writes use database transactions;
- duplicate/idempotency checks must be transaction-safe;
- two browser tabs must not silently overwrite immutable records;
- stale form submissions should fail or revalidate if source state changed materially.

No distributed locking architecture is required.

---

# 35. Read Model Flow

Read models may be optimized for:

- dashboard;
- holdings table;
- ranking table;
- risk dashboard.

But each read model must expose enough lineage to know:

- as-of;
- source watermark;
- freshness/trust state.

A read model cannot be used as hidden authoritative input if its source has changed.

---

# 36. Security Data Flow Controls

## 36.1 Browser to server

- same-origin;
- loopback MVP;
- validated mutations;
- no generic DB mutation endpoint.

## 36.2 File input

- untrusted;
- bounded parsing;
- no macro execution;
- no path traversal;
- explicit schema.

## 36.3 AI

- analytical-only;
- structured validation;
- no ledger write path.

## 36.4 Secrets

Provider secrets, if ever added:

```text
environment/config
 -> provider adapter only
```

Never:

```text
browser
 -> raw secret
```

---

# 37. Data Flow Acceptance Criteria

`DATA_FLOW.md` is acceptable only if:

1. every authoritative economic write passes validation and explicit commit;
2. posted transaction correction uses reversal/supersession;
3. derived portfolio state is watermarked;
4. stale projections cannot masquerade as current;
5. transaction commit and projection failure behavior is deterministic;
6. price/fundamental updates trigger targeted recalculation;
7. VN30 changes trigger review, not trades;
8. corporate-action references do not directly mutate portfolio state;
9. reconciliation never silently repairs ledger;
10. scoring flow preserves M3 lineage/freshness;
11. ranking flow preserves research vs actionable distinction;
12. decision flow preserves M4 authority;
13. DCA flow permits HOLD CASH;
14. risk flow consumes authoritative/derived inputs without becoming source truth;
15. performance flow separates external flows;
16. reviews do not imply trades;
17. AI cannot write authoritative ledger state;
18. import batch preserves preview/errors/audit;
19. backup/restore rebuilds and reconciles derived state;
20. methodology updates preserve historical outputs;
21. error/freshness states propagate into actionability;
22. no M1–M5 business rule is altered.

---

# 38. Initial Multi-Role Review

## Product Manager

### Critical
0 unresolved.

### Major resolved
- User-facing workflows now have explicit source-to-output paths.
- Recommendation/execution remains separated.
- HOLD CASH and NO ACTION remain first-class.

**Result:** PASS.

## Software Architect

### Critical
0 unresolved.

### Major resolved
- Added invalidation/recalculation matrix.
- Made projection watermark mandatory.
- Avoided event-stream architecture.
- Defined deterministic failure after authoritative commit.

**Result:** PASS.

## Portfolio Manager

### Critical
0 unresolved.

### Major resolved
- Stale/reconciliation-broken states block actionability.
- Review cadence does not trigger trades.
- VN30 changes trigger workflow rather than automatic transaction.

**Result:** PASS.

## Data Engineer

### Critical
0 unresolved.

### Major resolved
- Import lineage is explicit.
- Data freshness propagates.
- Backup/restore includes rebuild/reconciliation.
- Source changes trigger targeted invalidation.

**Result:** PASS.

## Security Reviewer

### Critical
0 unresolved.

### Major resolved
- AI remains read/analyze only.
- Browser mutation boundary remains constrained.
- File imports remain untrusted.
- Secrets remain provider-side only.

### Minor
- Detailed AI prompt-injection defenses remain in `AI_INTEGRATION.md`.
- Detailed local-data protection remains in `SECURITY.md`.

**Result:** PASS.

---

# 39. Issue Register

## Critical unresolved

**0**

## Major unresolved

**0**

## Minor / Deferred

1. exact watermark physical representation;
2. exact invalidation implementation mechanism;
3. exact import schemas;
4. exact retry semantics for external providers;
5. exact read-model persistence strategy;
6. exact UI refresh behavior after recalculation;
7. exact backup scheduling;
8. exact file-retention policy.

These belong to later M6 files and implementation.

---

# 40. Approval Gate

Current state:

> **APPROVED BASELINE v1.0**

If approved:

1. promote `06_DASHBOARD/DATA_FLOW.md` to **Approved Baseline v1.0**;
2. create/update its approved baseline artifact;
3. continue automatically to:
   **`06_DASHBOARD/UI_INFORMATION_ARCHITECTURE.md`**;
4. do not move beyond `UI_INFORMATION_ARCHITECTURE.md` until reviewed and approved.
