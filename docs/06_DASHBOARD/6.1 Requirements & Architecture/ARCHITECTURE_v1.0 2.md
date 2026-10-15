# VN30 Value Investing OS — Dashboard Architecture

**Document:** `06_DASHBOARD/ARCHITECTURE.md`  
**Milestone:** 6 — Dashboard & Automation  
**Sub-milestone:** M6.1 — Requirements & Architecture  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-09  

## Governing Baselines

This architecture implements:

- `06_DASHBOARD/REQUIREMENTS.md` — Approved Baseline v1.0;
- all approved M1–M5 baselines.

It must not redefine investment, scoring, ranking, risk, accounting, DCA, or decision rules.

---

# 1. Architecture Decision Summary

## 1.1 Recommended architecture

Use a **local-first modular monolith**:

```text
Browser
  |
  v
Next.js Application
  |
  +-- Presentation / Workflow Layer
  |
  +-- Application / Use-Case Layer
  |
  +-- Domain Layer
  |
  +-- Ports / Interfaces
        |
        +-- Persistence Adapter
        +-- Market Data Adapter
        +-- File Import Adapter
        +-- AI Adapter
        +-- Export / Backup Adapter
  |
  v
SQLite (MVP)
```

Recommended implementation stack:

- **Next.js**
- **React**
- **TypeScript**
- **SQLite** for the first local production-capable version
- **Prisma ORM**
- **Zod**
- **React Hook Form**
- **TanStack Query only where client-side cache/mutation behavior materially helps**
- **Recharts** or equivalent lightweight React charting library
- **Vitest**
- **React Testing Library**
- **Playwright** for critical E2E workflows
- **Decimal arithmetic library** for non-integer financial calculations

The application shall be one deployable unit during M6.

No microservices.

---

# 2. Why Modular Monolith

The product has multiple business domains:

- transaction ledger;
- portfolio accounting;
- reconciliation;
- VN30 reference data;
- market data;
- scoring;
- ranking;
- decision engine;
- DCA;
- risk;
- review workflows;
- journal;
- performance;
- audit.

These domains are logically distinct but operationally tightly coupled.

A modular monolith is preferred because it provides:

- simple local deployment;
- a single transaction boundary;
- easier deterministic replay;
- easier audit tracing;
- lower operational complexity;
- straightforward testing;
- low cost;
- clear module ownership without distributed-system overhead.

Microservices would create unnecessary problems:

- distributed transactions;
- event consistency;
- network failure modes;
- service version drift;
- deployment overhead;
- harder local backup;
- harder end-to-end audit reconstruction.

There is no current requirement that justifies those costs.

---

# 3. Architecture Principles

## AP-1 — One authoritative owner per fact

The architecture shall preserve M2 ownership rules.

Examples:

- transaction/event facts → ledger;
- portfolio state → derived from ledger;
- VN30 membership → effective-dated reference data;
- sector → effective-dated reference data;
- price → dated market observation;
- score → derived analytical artifact;
- decision → M4 result;
- executed transaction → explicit ledger event.

No UI table may become a shadow source of truth.

## AP-2 — Domain rules do not live in React components

React components may:

- display;
- collect input;
- show validation errors;
- invoke application use cases;
- render domain results.

React components may not own:

- average-cost formulas;
- realized P&L logic;
- ranking rules;
- BUY/SELL mapping;
- DCA eligibility;
- concentration rules;
- risk-state rules.

## AP-3 — Domain must be infrastructure-independent

Core business logic must not know:

- Prisma;
- SQLite;
- HTTP;
- CSV;
- Excel;
- React;
- OpenAI;
- a specific market-data vendor.

The domain consumes typed inputs and interfaces.

## AP-4 — Reconstructability over convenience

Where convenience conflicts with historical reconstruction, reconstruction wins.

## AP-5 — Explicit uncertainty

Missing, stale, estimated, assumed, blocked, provisional, and not-applicable states remain explicit.

## AP-6 — Recommendation is not execution

The architecture shall preserve:

```text
Analysis
  -> Recommendation
  -> Actionability / Authorization
  -> Explicit User Action
  -> Executed Transaction
```

No layer may collapse those stages.


## AP-7 — Read-your-writes consistency

After an authoritative ledger commit, the application must not present a derived portfolio projection as current unless that projection is known to include the committed ledger state.

Every persisted derived projection/cache shall carry a ledger watermark or equivalent source-version marker.

A write flow must therefore either:

1. calculate the required derived state from the just-committed authoritative ledger before returning it as current; or
2. mark affected projections stale/invalid and rebuild them before they are used for portfolio-aware decisions.

The UI must not display an old portfolio snapshot as if it includes a newly posted transaction.

## AP-8 — Methodology identity is immutable

A version label such as `1.0` is necessary but not sufficient for historical reproducibility.

Every production calculation methodology used by a persisted analytical result shall be identifiable through an immutable methodology record containing, at minimum:

- methodology family/type;
- semantic version;
- approval/baseline identity;
- effective date;
- configuration/parameter snapshot or immutable reference;
- implementation/build identifier or content hash where practical.

Changing executable logic without changing the pinned methodology identity is prohibited.

## AP-9 — Local-first means loopback-first

The MVP application shall listen only on the local loopback interface by default.

It must not intentionally expose the application to the LAN or public network unless remote access is separately designed and approved.

A future change from loopback-only to remote access triggers the cloud/remote security review defined later in this document.

---

# 4. Logical Layering

## 4.1 Presentation Layer

Responsibilities:

- routes/pages;
- tables;
- charts;
- forms;
- dialogs;
- workflow navigation;
- visual freshness/risk warnings;
- confirmation UI;
- sorting/filtering;
- import preview;
- review/journal screens.

Forbidden:

- authoritative financial calculations;
- direct ORM access;
- direct market-provider access;
- direct AI-to-ledger path;
- investment rules embedded in UI conditions.

## 4.2 Application Layer

The application layer coordinates use cases.

Examples:

- `RecordTransaction`
- `ReverseTransaction`
- `ImportTransactions`
- `RebuildPortfolio`
- `ReconcilePortfolio`
- `CalculatePerformance`
- `RunScoring`
- `RunRanking`
- `RunDecision`
- `RunDcaReview`
- `RunRiskReview`
- `RunWeeklyReview`
- `SaveJournalEntry`
- `ExportPortfolioSnapshot`

Responsibilities:

- transaction boundaries;
- authorization/confirmation state;
- orchestration;
- repository calls;
- domain-service invocation;
- audit metadata;
- error mapping;
- idempotency coordination;
- projection invalidation/rebuild coordination;
- ledger-watermark propagation for read-your-writes consistency.

It must not redefine domain formulas.

## 4.3 Domain Layer

The domain layer owns approved M1–M5 business behavior as executable logic.

Recommended domain modules:

```text
domain/
├── ledger/
├── portfolio/
├── reconciliation/
├── reference/
├── market-data/
├── scoring/
├── ranking/
├── decision/
├── dca/
├── risk/
├── performance/
├── reviews/
├── journal/
└── audit/
```

Each module shall expose clear domain types and services.

## 4.4 Infrastructure Layer

Responsibilities:

- Prisma repositories;
- SQLite persistence;
- CSV/Excel parsing;
- filesystem backup/export;
- concrete market-data providers;
- AI provider clients;
- clock/ID implementations where needed.

Infrastructure may satisfy domain/application interfaces but cannot change domain semantics.

---

# 5. Recommended Technology Stack

# 5.1 Next.js + React + TypeScript

## Decision

Use Next.js as the application shell and server-capable full-stack framework.

## Why

- one local application;
- React UI;
- server-side application/use-case execution;
- simple routing;
- no separate backend deployment required initially;
- easy future deployment if cloud access is later needed;
- strong TypeScript ecosystem.

## Alternative — Vite React + separate API

Pros:

- simpler pure SPA mental model;
- very explicit frontend/backend split.

Cons:

- requires separate server/API architecture;
- increases deployment and local-start complexity;
- little value for this single-user local-first system.

## Alternative — Electron/Tauri desktop app immediately

Pros:

- native desktop packaging;
- local filesystem integration.

Cons:

- adds packaging/runtime complexity too early;
- creates another platform layer before product workflow is validated.

### Decision

Do not start with Electron/Tauri.

If a desktop package becomes useful later, wrap or adapt the stable local web application after M6 workflow validation.

---

# 5.2 SQLite First

## Decision

Use SQLite for the first production-capable local version.

## Why

- zero database server administration;
- single-user workload;
- easy backup;
- transactional;
- mature;
- more than sufficient for VN30 and personal portfolio scale;
- ideal local-first fit.

## Alternative — PostgreSQL immediately

Advantages:

- stronger concurrent/multi-user capabilities;
- native numeric/data features;
- closer to future cloud deployment.

Disadvantages for MVP:

- local service administration;
- credentials/configuration;
- backup complexity;
- unnecessary operational overhead for one user.

## Migration path

Architecture must avoid SQLite-specific domain logic.

Later migration:

```text
SQLite
  -> schema migration review
  -> PostgreSQL
  -> same domain/application interfaces
```

PostgreSQL becomes preferable when one or more are true:

- remote/cloud deployment;
- multiple users;
- concurrent writers;
- larger automation workload;
- stronger server-side operational requirements.

---

# 5.3 Prisma ORM

## Decision

Use Prisma as persistence mapping and migration tooling.

## Why

- strong TypeScript integration;
- explicit schema;
- migration tooling;
- SQLite + PostgreSQL support;
- readable repository implementation;
- productive for a small application team/Codex workflow.

## Important boundary

Prisma types are infrastructure types.

They must not become the canonical domain model.

The architecture does not depend on Prisma-specific runtime objects surviving outside repository adapters. This includes Prisma-specific Decimal, JSON, enum, and transaction-client types.

Repository adapters map:

```text
Prisma Record
    <->
Domain Entity / Value Object
```

## Alternative — Drizzle

Strengths:

- closer to SQL;
- lightweight;
- strong type inference;
- good SQLite support.

Trade-off:

- more database-specific decisions leak into implementation;
- less useful if the priority is straightforward repository abstraction and future database swap.

Drizzle remains acceptable if implementation evidence later shows Prisma creates material constraints.

Changing ORM would not justify changing domain semantics.

---

# 5.4 Zod

Use Zod at trust boundaries:

- forms;
- route/API inputs;
- CSV/Excel row schemas;
- provider payloads;
- environment/configuration;
- AI structured output;
- export/import manifests.

Zod validation is not a replacement for domain invariants.

Example:

```text
Zod:
"Is this structurally valid?"

Domain:
"Is this economically/legal-by-system valid?"
```

---

# 5.5 React Hook Form

Use for complex user-input flows:

- transaction entry;
- correction/reversal;
- import mapping;
- DCA review inputs;
- journal/review forms.

Do not use form state as persisted business state.

---

# 5.6 TanStack Query

## Decision

Use selectively, not as a mandatory global architecture.

Use where client-side interaction benefits from:

- mutation pending state;
- cache invalidation;
- refetch;
- paginated/filterable data;
- import/reconciliation workflow refresh.

Do not introduce it merely to wrap every server-rendered read.

For many dashboard pages, server-side reads or simple route-level fetches may be sufficient.

---

# 5.7 Charting

Recommended initial choice: **Recharts**.

Reasons:

- React-native mental model;
- sufficient for NAV, drawdown, benchmark, allocation, score decomposition;
- simpler than institutional-grade charting systems.

Charts are presentation only.

Any value displayed on a chart must come from tested domain/application calculations.

---

# 5.8 Testing

Recommended:

- **Vitest** — unit/domain tests;
- **React Testing Library** — component behavior;
- **Playwright** — critical end-to-end workflows.

Jest is acceptable but not preferred if Vitest integrates more simply with the selected project tooling.

---

# 6. Proposed Codebase Structure

```text
/
├── app/
│   ├── dashboard/
│   ├── holdings/
│   ├── transactions/
│   ├── vn30/
│   ├── scoring/
│   ├── ranking/
│   ├── decisions/
│   ├── dca/
│   ├── risk/
│   ├── journal/
│   ├── reviews/
│   ├── performance/
│   ├── imports/
│   └── settings/
│
├── src/
│   ├── domain/
│   │   ├── ledger/
│   │   ├── portfolio/
│   │   ├── reconciliation/
│   │   ├── reference/
│   │   ├── scoring/
│   │   ├── ranking/
│   │   ├── decision/
│   │   ├── dca/
│   │   ├── risk/
│   │   ├── performance/
│   │   ├── reviews/
│   │   ├── journal/
│   │   └── audit/
│   │
│   ├── application/
│   │   ├── transactions/
│   │   ├── portfolio/
│   │   ├── scoring/
│   │   ├── decisions/
│   │   ├── reviews/
│   │   ├── imports/
│   │   └── exports/
│   │
│   ├── ports/
│   │   ├── repositories/
│   │   ├── market-data/
│   │   ├── ai/
│   │   ├── import/
│   │   └── backup/
│   │
│   ├── infrastructure/
│   │   ├── db/
│   │   ├── repositories/
│   │   ├── market-data/
│   │   ├── import/
│   │   ├── ai/
│   │   └── backup/
│   │
│   ├── ui/
│   │   ├── components/
│   │   ├── tables/
│   │   ├── charts/
│   │   └── forms/
│   │
│   └── shared/
│       ├── errors/
│       ├── ids/
│       ├── time/
│       └── validation/
│
├── prisma/
├── tests/
└── 06_DASHBOARD/
```

Exact directory names may be adjusted during implementation without changing layer boundaries.

---

# 7. Dependency Rules

Allowed dependencies:

```text
UI
 -> Application
 -> Domain

Infrastructure
 -> Ports / Domain Types

Application
 -> Ports
 -> Domain
```

Forbidden:

```text
Domain -> Prisma
Domain -> React
Domain -> Next.js
Domain -> filesystem
Domain -> market vendor SDK
Domain -> AI SDK

UI -> Prisma
UI -> raw SQL
UI -> market vendor SDK
UI -> Decision State shortcut rules
```

A dependency-direction test or lint convention should be introduced if practical.

---

# 8. Transaction Architecture

## 8.1 Authoritative ledger

Transaction write flow:

```text
User Form
  -> Zod structural validation
  -> Application Use Case
  -> Domain validation
  -> DB transaction
       -> Transaction
       -> TransactionLeg(s)
       -> Audit metadata
       -> projection invalidation / ledger watermark update
  -> Commit
  -> rebuild/read derived portfolio state from committed watermark
  -> Reconciliation
  -> Return a state explicitly identified by watermark/as-of
```

The authoritative event commit must be atomic at the application-defined event boundary.

Persisted projections are not required to be updated inside the same database transaction, but they must be invalidated or watermark-advanced atomically enough that stale projections cannot be mistaken for current state.

If projection rebuilding fails after the ledger commit:

- the ledger event remains authoritative;
- affected derived views are marked stale/blocked;
- portfolio-aware recommendations remain non-actionable until a valid rebuild/reconciliation completes;
- the system must not roll back or fabricate an opposite economic event merely to repair a projection-cache failure.

## 8.2 Corrections

No destructive edit.

```text
Original Transaction
    |
    +--> Reversal / Correction Transaction
```

Lineage must be explicit.

## 8.3 Idempotency

Imports and external source records should use stable source references/import keys.

Duplicate detection must occur before authoritative commit.

---

# 9. Portfolio Reconstruction Architecture

The system must support deterministic replay.

Conceptual pipeline:

```text
Ledger Facts
    |
    v
Replay / Accounting Policy
    |
    +--> Cash State
    +--> Security Quantity
    +--> Cost Basis
    +--> Realized P&L
    +--> Dividend Income
    |
Market Observations
    |
    v
Valuation
    |
    +--> Market Value
    +--> Unrealized P&L
    +--> NAV
    +--> Weights
    |
Reference Data
    |
    +--> VN30 Status
    +--> Sector Exposure
    |
    v
Portfolio Snapshot / View
```

Persisted snapshots are caches/audit artifacts, not independent truth.

---

# 10. Financial Numeric Architecture

JavaScript binary floating-point must not be used as authoritative storage or calculation state for money, cost basis, P&L, valuation inputs, or rates that require deterministic reconstruction.

## Recommended approach

- whole-VND monetary facts: integer representation where economically valid;
- share quantities: integer shares unless an approved corporate-action rule requires fractional handling;
- non-integer prices, ratios, rates, valuation outputs, and fractional entitlements: explicit decimal value objects;
- calculations: decimal arithmetic library or exact scaled-integer arithmetic;
- rounding: explicit versioned domain policy at defined boundaries only.

## Persistence rule

The database representation must round-trip every authoritative numeric value without a material or unexplained precision change.

Do not assume a database/ORM type is safe merely because its name is `Decimal`.

Before production use, numeric persistence tests must cover:

- maximum expected VND amounts;
- non-integer price cases;
- fee/tax rates;
- MWAC/cost-release calculations;
- XIRR/TWR intermediate values where persisted;
- serialize → persist → read → recalculate equivalence.

`REAL`, JavaScript `number`, or implicit conversion may be used for disposable chart coordinates only after authoritative domain values have already been calculated.

No implicit `Number.toFixed()` shall define accounting policy.

Exact scale/storage choices belong in `DOMAIN_MODEL.md` and implementation schema.

---

# 11. Scoring Architecture

Scoring pipeline:

```text
Evidence / Metric Inputs
    |
    v
Validation + Freshness
    |
    v
Sector-aware Metric Normalization
    |
    v
Subcategory Scoring
    |
    v
Category Scoring
    |
    v
Total Score
    |
    +--> Score Validity
    +--> Confidence
    +--> Evidence Lineage
```

Each calculation run shall preserve:

- methodology version;
- source evidence IDs;
- data as-of;
- normalization version;
- missing-data treatment;
- confidence result.

The score UI consumes scoring results; it does not calculate score independently.

---

# 12. Ranking Architecture

Ranking is a separate domain service.

```text
Valid Scorecards
  + Valuation/Forward Return
  + Confidence
  + Risk/Actionability
  + Portfolio Context where allowed
        |
        v
Ranking Service
        |
        +--> Research Ranking
        +--> Actionable Ranking
        +--> Top 10
```

The service shall implement M3 rules exactly.

Sorting by score in a UI table is only a presentation sort and must not be labeled official ranking unless it is the official ranking output.

---

# 13. Decision Architecture

Decision pipeline:

```text
Eligibility
+ Investability
+ Score/Validity
+ Thesis
+ Valuation
+ Risk
+ Confidence
+ Portfolio State
+ Cash
+ Lot Feasibility
+ Opportunity Cost
+ Technical/Market Context
       |
       v
M4 Decision Engine
       |
       +--> Decision State
       +--> Decision Qualifier
       +--> Execution Status
       +--> Sizing Result
       +--> Invalidation / Review Triggers
```

The seven Decision States remain fixed by M4.

No alternative decision mapper may exist in UI, import, AI, or reporting modules.

---

# 14. DCA Architecture

DCA is an orchestrated application workflow over existing approved domains.

```text
Contribution / Cash
     |
Portfolio State
     |
Official Ranking
     |
Candidate Decision Inputs
     |
Risk + Position Sizing
     |
Opportunity Cost
     |
     v
DCA Application Service
     |
     +--> BUY candidate
     +--> ACCUMULATE candidate
     +--> HOLD CASH
```

DCA must reuse M3/M4 services.

It must not duplicate:

- ranking;
- valuation gates;
- risk gates;
- lot rules;
- position sizing;
- opportunity-cost rules.

---

# 15. Risk Architecture

Risk is calculated from authoritative/derived inputs:

```text
Portfolio State
+ Sector Mapping
+ Thesis/Decision State
+ Confidence
+ Drawdown/Performance
+ Data Integrity
       |
       v
Risk Domain Service
       |
       +--> Risk Metrics
       +--> Flags
       +--> GREEN/WATCH/WARNING/BREACH
```

UI colors are downstream of the risk state.

The UI must not derive risk state from numeric display thresholds independently.

---

# 16. Review Workflow Architecture

Reviews use a reusable workflow engine/pattern, not one giant generic rule engine.

Common review envelope:

```text
Review ID
Review Type
Trigger
Review Date
Data As-Of
Portfolio Snapshot
Data Quality
Evidence
Findings
Risk Status
Operating Outcome
Decision Link
Transaction Link
Follow-Up
```

Individual review modules remain responsible for M5-specific semantics.

Do not over-generalize review logic until duplication is demonstrated.

---

# 17. Journal and Audit Architecture

## 17.1 Append-oriented history

Decision/journal/review audit records should be append-oriented.

Historical analytical records are not silently mutated to reflect later methodology.

## 17.2 Baseline and methodology registry

The application shall maintain a canonical registry of approved methodology/baseline identities used by executable M6 logic.

This registry exists to solve a known M5 governance risk: file headers or stored snapshots may lag an explicitly approved project baseline.

A production analytical result must pin the registry identity actually used rather than infer the historical version from the current contents of a Markdown file.

The registry must not create or approve policy. It only records approved identities and implementation lineage.

## 17.3 Canonical lineage

Required conceptual chain:

```text
Source Evidence
  -> Import / Observation
  -> Portfolio Snapshot
  -> Scorecard
  -> Ranking Run
  -> Review
  -> Decision
  -> Explicit Execution
  -> Transaction
  -> Later Decision Audit
```

Not every node is mandatory in every workflow, but available links must be persisted.

---

# 18. Data Import Architecture

Use a staged import pipeline:

```text
File
  |
  v
Parser
  |
  v
Raw Staging Rows
  |
  v
Schema Validation
  |
  v
Domain Validation
  |
  v
Duplicate / Conflict Detection
  |
  v
Preview
  |
User Commit
  |
  v
Atomic Import Batch
  |
  v
Audit Report
```

No imported row becomes authoritative before explicit commit.

## 18.1 Import adapters

Recommended interfaces:

```text
TransactionImporter
PriceImporter
BenchmarkImporter
VN30MembershipImporter
SectorImporter
ScoreInputImporter
FundamentalDataImporter
```

CSV is the baseline.

Excel may be supported through an adapter without changing domain interfaces.

---

# 19. Market Data Adapter Architecture

Use capability-oriented provider ports rather than one mandatory “god interface”.

Conceptually:

```text
PriceProvider
HistoricalPriceProvider
BenchmarkProvider
FundamentalDataProvider
CorporateReferenceProvider
```

A concrete external provider may implement several capabilities, while the manual-import subsystem may satisfy them from persisted normalized observations.

This avoids forcing every provider to support unrelated datasets and allows one source to be replaced without coupling all data domains.

The exact interfaces and capability contracts belong in `MARKET_DATA_ADAPTER.md`.

Initial providers may be:

- Manual CSV;
- Manual Excel;
- future HTTP API provider.

Provider payloads must be normalized before entering the domain.

No domain rule may inspect vendor-specific field names.

---

# 20. AI Architecture

AI is an optional adapter, not a domain authority.

```text
Application
  -> AI Port
       -> AI Provider
```

AI use cases:

- summarize evidence;
- draft review;
- draft thesis changes;
- draft journal explanation;
- flag missing evidence;
- propose structured analytical output.

AI output must pass:

- schema validation;
- source/reference validation where required;
- human review for material recommendations;
- domain rules.

Forbidden architecture:

```text
AI
 -> TransactionRepository
```

There shall be no direct path from AI provider to authoritative ledger writes.

---

# 21. Read/Write Architecture

## 21.1 Writes

Authoritative writes shall pass through application use cases.

Examples:

- transaction posting;
- transaction reversal;
- approved imports;
- review record creation;
- decision record creation.

A browser/client must not receive a generic persistence endpoint capable of arbitrary entity mutation.

## 21.2 Reads

Reads may use optimized query/read models provided they are:

- derived;
- reproducible;
- clearly non-authoritative;
- tagged with source as-of / ledger watermark where accounting state is involved.

If a read model lags its source, the lag must be detectable. A stale read model must not feed an actionable portfolio decision as if current.

CQRS infrastructure is not required.

Simple read projections are enough.

---

# 22. API / Server Boundary

For the local-first monolith, use the simplest boundary per workflow:

- server-side application functions where practical;
- route handlers for explicit API/file-upload boundaries;
- client calls only where interactive UX requires them.

Do not create a REST API for every internal method.

A formal public API is not an MVP requirement.

Future API exposure can wrap stable application use cases.

---

# 23. Error Architecture

Errors should be typed into broad categories:

- Validation Error;
- Domain Invariant Error;
- Data Quality Error;
- Reconciliation Error;
- Conflict/Duplicate Error;
- Provider Error;
- Infrastructure Error;
- Authorization/Confirmation Error.

User-visible messages must preserve useful context without exposing stack traces or secrets.

Material data-quality errors may degrade or block actionability rather than crash the whole dashboard.

---

# 24. Data Freshness Architecture

Freshness is not a UI-only field.

Every material observation should preserve:

```text
source
as_of
effective_date where applicable
imported_at / retrieved_at
version / revision
freshness_state
```

Freshness evaluation belongs in domain/application policy using approved upstream rules.

UI displays the result.

If upstream has no approved numeric stale threshold for a required dataset, M6 must not invent one silently.

Raise a Change Request if the missing threshold blocks implementation.

---

# 25. Security Architecture

## MVP security posture

- local single-user;
- loopback-only network binding by default;
- no broker integration;
- no broker credentials;
- no automated trading;
- minimal network dependencies;
- input validation on imports;
- protected local financial data;
- no secrets in source control;
- no generic client-accessible database mutation API.

## Local write protection

Even for a loopback-only application, state-changing requests shall use framework-supported origin/CSRF protections or equivalent same-origin controls appropriate to the chosen Next.js write mechanism.

If a deployment option weakens those protections or exposes the app beyond loopback, it is not the approved MVP posture.

## Untrusted import protections

Import adapters shall treat CSV/Excel files as untrusted input.

At minimum they must support:

- file size limits;
- permitted file-type checks;
- bounded row/cell processing;
- safe temporary-file handling;
- no execution of spreadsheet formulas/macros;
- path traversal prevention;
- explicit parsing errors rather than parser fallback guesses.

When exporting CSV/Excel-compatible data, fields capable of spreadsheet formula injection must be escaped or otherwise rendered inert.

## Application secrets

If a future external API requires a secret:

- environment/configuration only;
- never committed;
- least privilege;
- separate provider configuration.

## Future cloud deployment

Requires separate review for:

- authentication;
- authorization;
- TLS;
- secret management;
- backup encryption;
- remote database;
- audit access;
- threat model.

Do not prematurely design all of this into the local MVP.

---

# 26. Backup Architecture

SQLite MVP enables simple backup but consistency matters.

Backup flow should:

1. ensure a transactionally consistent database snapshot using a SQLite-safe backup/checkpoint mechanism appropriate to the configured journaling mode;
2. record application/schema version;
3. record the current ledger watermark and methodology-registry version;
4. optionally include export manifest/checksums;
5. verify restore in testing;
6. rebuild and reconcile derived projections after restore.

A raw database-file copy performed while writes or WAL state may be active must not be assumed valid.

Exact mechanism belongs in later implementation planning.

---

# 27. Observability

Keep observability simple.

Required:

- structured application logs for failures;
- import batch logs;
- audit records;
- calculation run IDs;
- reconciliation status;
- test/validation evidence.

Not required:

- distributed tracing;
- metrics cluster;
- log aggregation platform.

---

# 28. Performance Strategy

Expected scale is small:

- 30-current-member universe;
- historical VN30 membership;
- personal portfolio transaction ledger;
- periodic market/fundamental observations;
- multi-year reviews.

Therefore prioritize correctness over premature optimization.

Allowed optimizations:

- database indexes;
- cached derived snapshots;
- batch calculations;
- selective recomputation.

All caches must be invalidatable/rebuildable.

---

# 29. Recalculation Strategy

Do not recompute everything on every page render.

Use explicit recalculation boundaries.

Examples:

- transaction commit → affected portfolio reconstruction;
- new prices → valuation/performance refresh;
- new fundamentals → affected score refresh;
- ranking-relevant score changes → ranking refresh;
- material event → relevant review/decision workflow.

The system shall preserve M5's rule that elapsed time alone does not imply unnecessary rescoring or trading.

---

# 30. Versioning Architecture

Introduce a canonical methodology registry or equivalent storage concept.

At minimum, calculations should be able to pin:

- investment policy version;
- accounting/reconstruction version;
- scoring version;
- metric/normalization version;
- ranking version;
- decision-engine version;
- risk version;
- performance method version.

Each pinned production method identity should also retain an immutable configuration snapshot/reference and an implementation/build identity or content hash where practical.

Do not infer methodology version from current source files after the fact.

Do not permit executable logic to change materially while continuing to emit the same methodology identity.

Historical records must preserve the exact version actually used.

---

# 31. Deployment Architecture

## MVP

```text
Single local machine
  |
  +-- Browser -> http://127.0.0.1:<local-port>
  +-- Next.js app bound to loopback only
  +-- SQLite database
  +-- local import files
  +-- local backup/export
```

No cloud dependency is required for core operation.

LAN/public binding is not part of the approved MVP deployment.

## Future optional deployment

```text
Next.js app
    |
PostgreSQL
    |
Provider APIs
```

Potential hosted deployment must preserve the same domain/application boundaries.

---

# 32. Migration Path

## Phase A — Local MVP

- Next.js;
- SQLite;
- manual imports;
- local backups;
- single user.

## Phase B — Data Automation

- add market/fundamental API adapter;
- scheduled import/retrieval;
- retain manual fallback.

## Phase C — Remote Access if needed

- PostgreSQL;
- authentication;
- secure deployment;
- encrypted backups.

## Phase D — Broker integration only if separately approved

- dedicated security architecture;
- explicit authorization model;
- no reuse of AI recommendation as order authority.

Each phase is optional.

---

# 33. Architecture Decision Records

Significant M6 implementation decisions should be recorded as ADR-style entries, at minimum:

- decision;
- context;
- alternatives;
- rationale;
- consequences;
- migration/reversal path.

Recommended ADR topics:

1. Next.js modular monolith;
2. SQLite-first;
3. Prisma;
4. Decimal money strategy;
5. domain/infrastructure separation;
6. provider adapter pattern;
7. immutable ledger write path;
8. AI no-ledger authority.

ADRs document implementation choices.

They may not override M1–M5 policy.

---

# 34. Quality Gates for Foundation and Later Implementation

Once source code exists, relevant milestones should run:

```text
lint
typecheck
unit tests
integration tests
build
database/schema validation
git diff --check
```

Critical workflow E2E tests should be added by the time the corresponding feature is considered production-capable.

No milestone is DONE merely because pages render.

---

# 35. Architecture Acceptance Criteria

`ARCHITECTURE.md` is acceptable only if:

1. M2 ledger remains authoritative.
2. Portfolio state remains derived.
3. Derived state cannot appear current when its ledger watermark is stale.
4. UI cannot own investment rules.
5. Domain is independent from framework/ORM/provider.
6. M3 scoring and ranking have dedicated domain services.
7. M4 Decision Engine is the only source of Decision States.
8. DCA reuses M3/M4 rather than duplicating them.
9. Risk status is domain-derived.
10. Review workflows preserve M5 semantics.
11. Recommendation and execution are separate.
12. AI cannot write transactions.
13. Market/fundamental provider capabilities are replaceable independently.
14. manual import works without external APIs.
15. SQLite local-first path is simple and backup-capable.
16. PostgreSQL migration is possible without rewriting business logic.
17. authoritative financial calculations/storage avoid binary floating-point authority.
18. numeric persistence round-trip behavior is tested.
19. audit lineage is first-class.
20. methodology identities are reproducible and cannot drift silently from executable logic.
21. approved MVP deployment is loopback-only by default.
22. untrusted import files cannot execute formulas/macros or bypass bounded validation.
23. no microservices/distributed infrastructure is required.
24. no M1–M5 rule is silently changed.

---

# 36. Multi-Role Architecture Review — v0.2

## 36.1 Product Manager

### Critical
**0 unresolved.**

### Major issues found and resolved

**PM-M1 — “Local-first” could still accidentally become a network-exposed application.**  
Impact: a product intended as a private personal portfolio system could gain remote attack surface without an explicit product decision.  
Resolution: approved MVP deployment is now loopback-only by default; LAN/cloud exposure requires a separate review.

**PM-M2 — Portfolio state immediately after transaction entry lacked an explicit consistency promise.**  
Impact: the user could post a transaction and still see stale holdings/cash, reducing trust in the dashboard.  
Resolution: read-your-writes semantics and ledger-watermark handling are now mandatory.

**PM-M3 — Architecture did not explicitly prevent methodology labels from drifting from actual implementation.**  
Impact: historical decision audit could claim “v1.0” while executable logic had silently changed.  
Resolution: methodology identity now includes immutable configuration plus implementation/build identity or content hash where practical.

### Minor
- Desktop packaging remains correctly deferred.
- Notification/automation UX remains correctly deferred.

**Assessment:** **9.9/10 — PASS.**

---

## 36.2 Software Architect

### Critical
**0 unresolved.**

### Major issues found and resolved

**SA-M1 — Persisted projection consistency boundary was underspecified.**  
Resolution: ledger commit, projection invalidation/watermark, rebuild failure behavior, and actionable-state blocking are now explicit.

**SA-M2 — One broad `MarketDataProvider` risked becoming a god interface.**  
Resolution: architecture now uses capability-oriented ports such as price, benchmark, fundamental, and corporate-reference providers.

**SA-M3 — Version numbers alone were insufficient for reproducible executable architecture.**  
Resolution: canonical baseline/methodology registry plus implementation identity is required.

**SA-M4 — Client write surface was not explicitly constrained.**  
Resolution: authoritative writes must go through application use cases; no generic entity-mutation endpoint is permitted.

### Minor
- Exact dependency-boundary enforcement tooling can be selected in M6.2.
- Exact server action vs route-handler split remains an implementation decision.

**Assessment:** **9.9/10 — PASS.**

---

## 36.3 Portfolio Manager

### Critical
**0 unresolved.**

### Major issues found and resolved

**PMGR-M1 — A stale portfolio projection could feed DCA/Decision Center after a new transaction.**  
Resolution: stale projection detection now blocks portfolio-aware actionability until rebuild/reconciliation succeeds.

**PMGR-M2 — Historical decision reproduction could be contaminated by later methodology drift.**  
Resolution: exact pinned methodology/configuration/implementation lineage is required.

**PMGR-M3 — Backup restoration could restore ledger data while leaving inconsistent cached holdings/risk views.**  
Resolution: restore architecture now requires derived projection rebuild and reconciliation.

### Minor
- Advanced attribution remains appropriately outside MVP.
- Exact operational freshness thresholds remain owned upstream or require Change Request.

**Assessment:** **9.9/10 — PASS.**

---

## 36.4 Data Engineer

### Critical
**0 unresolved.**

### Major issues found and resolved

**DE-M1 — “Use Decimal” was too implementation-assumptive for SQLite persistence.**  
Resolution: architecture now defines a round-trip correctness contract rather than trusting a type name; integer/scaled/decimal physical choices move to `DOMAIN_MODEL.md`.

**DE-M2 — Projection caches had no mandatory source watermark.**  
Resolution: all accounting-derived persisted projections must carry source ledger watermark/as-of identity.

**DE-M3 — Backup architecture did not explicitly address SQLite journaling/WAL consistency.**  
Resolution: backup must use a SQLite-safe consistent snapshot/checkpoint strategy and restore validation.

**DE-M4 — Import security/integrity boundary lacked bounded-resource requirements.**  
Resolution: file size, row/cell bounds, parser errors, path safety, and no formula/macro execution are now mandatory.

### Minor
- Exact decimal scale/storage representation belongs in `DOMAIN_MODEL.md`.
- Exact SQLite journal mode belongs in implementation after benchmark/testing.

**Assessment:** **9.9/10 — PASS.**

---

## 36.5 Security Reviewer

### Critical
**0 unresolved.**

### Major issues found and resolved

**SEC-M1 — “Local” did not guarantee loopback-only exposure.**  
Resolution: default bind is explicitly loopback-only; network exposure requires a new security review.

**SEC-M2 — Local state-changing requests lacked an explicit origin/CSRF control requirement.**  
Resolution: framework-appropriate same-origin/CSRF protection is now required even for MVP.

**SEC-M3 — Spreadsheet/file imports were treated primarily as data-quality risk, not security input.**  
Resolution: imports are explicitly untrusted; macro/formula execution, path traversal, unbounded parsing, and CSV formula injection are addressed architecturally.

**SEC-M4 — A generic persistence API could bypass business-use-case controls.**  
Resolution: generic client-accessible database mutation is prohibited.

### Minor
- At-rest encryption remains deployment/device dependent and belongs in `SECURITY.md`.
- AI prompt-injection/evidence-trust controls should be detailed in `AI_INTEGRATION.md`.

**Assessment:** **9.9/10 — PASS.**

---

# 37. Consolidated Issue Register — Post Review

## Critical unresolved

**0**

## Major unresolved

**0**

## Major issues resolved in v0.2

1. read-your-writes / projection-watermark consistency;
2. stale projection blocking for actionable portfolio decisions;
3. immutable methodology identity beyond a version label;
4. canonical approved-baseline registry;
5. loopback-only local deployment posture;
6. origin/CSRF protection for writes;
7. untrusted spreadsheet/file import security;
8. capability-oriented provider ports;
9. SQLite-safe backup/restore consistency;
10. numeric persistence round-trip contract;
11. prohibition of generic client-accessible persistence mutation.

## Minor / Deferred

1. exact decimal physical DB representation;
2. exact Next.js rendering/write primitive per route;
3. final chart library confirmation;
4. exact import column schemas;
5. exact SQLite journal mode;
6. whether application-level local database encryption is required beyond OS/device protection;
7. exact dependency-enforcement tool;
8. exact provider method signatures;
9. UI information architecture;
10. AI prompt-injection/evidence-trust controls.

These items belong to later approved M6 documents and do not justify changing M1–M5 rules.

# 38. Final Recommendation

Adopt:

> **Next.js + TypeScript modular monolith, SQLite-first, Prisma persistence, strict domain/application/infrastructure separation, replaceable providers, append-oriented audit history, and explicit transaction-ledger authority.**

This architecture is recommended because it best balances:

- correctness;
- simplicity;
- auditability;
- local-first operation;
- future migration;
- testability;
- low operational cost.

It avoids premature distributed architecture while preserving a credible path to PostgreSQL, external market-data APIs, remote deployment, and later broker integration if separately approved.

---

# 39. Approval Gate

Current state:

> **APPROVED BASELINE v1.0**

If approved:

1. promote `06_DASHBOARD/ARCHITECTURE.md` to **Approved Baseline v1.0**;
2. create/update the baseline artifact;
3. proceed automatically to the next M6.1 file:
   **`06_DASHBOARD/DOMAIN_MODEL.md`**;
4. do not move beyond `DOMAIN_MODEL.md` until it has been reviewed and approved.
