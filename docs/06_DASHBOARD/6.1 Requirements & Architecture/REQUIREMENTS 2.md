# VN30 Value Investing OS — Dashboard Requirements

**Document:** `06_DASHBOARD/REQUIREMENTS.md`  
**Milestone:** 6 — Dashboard & Automation  
**Sub-milestone:** M6.1 — Requirements & Architecture  
**Status:** Draft for Approval  
**Version:** 0.1  
**Date:** 2026-09-08  

## Governing Baselines

This document operationalizes, but does not redefine, the approved baselines from:

### M1 — System
- `INVESTMENT_POLICY.md`
- `DECISION_FRAMEWORK.md`
- `RISK_POLICY.md`
- `SCORING_MODEL.md`
- `SYSTEM_PROMPT.md`

### M2 — Database
- `DATA_MODEL.md`
- `TRANSACTIONS.md`
- `PORTFOLIO.md`
- `VN30_MASTER.md`
- `SECTOR_MASTER.md`
- `BENCHMARK.md`
- `DATA_RULES.md`

### M3 — Scoring
- `SCORING_ENGINE.md`
- `METRIC_DEFINITIONS.md`
- `SECTOR_NORMALIZATION.md`
- `SCORECARD_TEMPLATE.md`
- `RANKING_RULES.md`
- `VALIDATION_CASES.md`

### M4 — Decision Engine
- `DECISION_ENGINE.md`
- `BUY_RULES.md`
- `SELL_RULES.md`
- `DCA_RULES.md`
- `POSITION_SIZING.md`
- `OPPORTUNITY_COST.md`
- `DECISION_TEMPLATE.md`
- `VALIDATION_CASES.md`

### M5 — Portfolio Workflow
All approved baselines under `05_PORTFOLIO_WORKFLOW/`.

---

# 1. Purpose

M6 converts the approved VN30 Value Investing OS rules and data contracts into an operational local-first application.

The application must make the system usable in practice for:

- portfolio accounting and monitoring;
- transaction capture and immutable-ledger reconstruction;
- cash and DCA management;
- scoring and ranking;
- Buy / Hold / Sell decision support;
- portfolio risk monitoring;
- weekly, monthly, quarterly, annual, and event-driven reviews;
- investment journal and decision audit;
- performance measurement and VN30 benchmark comparison;
- manual market/fundamental data import;
- future replaceable market-data and AI integrations.

M6 is an implementation milestone. It must not silently change M1–M5 rules.

When an implementation requirement conflicts with or exposes a missing upstream rule:

1. record the issue;
2. identify the owning baseline document;
3. do not invent a new investment rule;
4. block or degrade affected functionality when necessary;
5. raise a separate Change Request.

---

# 2. Product Principles

The M6 product shall prioritize, in order:

1. correctness;
2. data integrity;
3. traceability;
4. simplicity;
5. maintainability;
6. testability;
7. usability;
8. replaceability of external providers;
9. performance sufficient for a single-user VN30 application.

The application shall remain local-first for its first production-capable version.

The design shall not require microservices, Kubernetes, Redis, message queues, event streaming, distributed databases, or real-time broker integration.

---

# 3. Source-of-Truth Requirements

## 3.1 Accounting truth

The immutable transaction ledger defined by M2 is the authoritative source of portfolio-changing economic events.

The application shall derive, rather than independently authoritatively store, portfolio accounting state such as:

- holdings;
- settled cash;
- receivables/payables where applicable;
- average cost / open cost;
- realized P&L;
- unrealized P&L;
- dividends;
- NAV;
- portfolio weights.

Materialized snapshots or caches may exist only as reproducible derived artifacts.

Deleting or rebuilding a derived projection must not destroy the ability to reconstruct authoritative portfolio state.

## 3.2 Analytical truth

Scoring, ranking, risk views, review outputs, recommendations, and journal records are analytical artifacts.

They must preserve lineage to the data and methodology used at calculation time.

No analytical artifact may overwrite accounting truth.

## 3.3 Reference truth

VN30 membership, sector classification, benchmark observations, market prices, and corporate-action references must remain effective-dated and source-attributed according to M2/M3 data rules.

---

# 4. Functional Requirements

## FR-1 Portfolio Dashboard

The system shall display, for a selected valid as-of date where supported:

- Total NAV;
- settled cash;
- executable cash where different;
- market value of securities;
- total contributed capital;
- withdrawals;
- realized P&L;
- unrealized P&L;
- dividend income;
- total return;
- XIRR;
- CAGR where mathematically applicable;
- current drawdown;
- maximum drawdown;
- portfolio-versus-VN30 benchmark comparison;
- data freshness / reconciliation status.

The dashboard must distinguish investment performance from external capital contributions.

Benchmark comparison must use the approved M2 benchmark/performance methodology and must disclose methodology compatibility limitations.

## FR-2 Holdings

The system shall provide a holdings table with, at minimum:

- ticker;
- company;
- sector;
- quantity;
- average cost;
- current/reference price;
- price as-of date;
- market value;
- unrealized P&L;
- unrealized P&L %;
- portfolio weight;
- current score;
- rank;
- thesis status;
- recommendation;
- recommendation actionability/execution status where applicable;
- data confidence;
- data freshness.

The table shall support sorting and filtering.

Portfolio/accounting values displayed in holdings must come from M2 reconstruction, not user-editable duplicated fields.

## FR-3 Transaction Ledger

The system shall support the transaction/event types required by the approved M2 baseline, including as applicable:

- BUY;
- SELL;
- DIVIDEND;
- CASH_DEPOSIT;
- CASH_WITHDRAWAL;
- FEE;
- TAX;
- CORPORATE_ACTION and its approved staged effects;
- reversal/correction events required by M2.

Transaction capture shall enforce:

- unique immutable transaction identity;
- schema validation;
- deterministic replay ordering;
- duplicate detection;
- quantity/cash validation;
- oversell prevention;
- no negative long-only holdings;
- valid correction/reversal mechanism;
- source/source-reference capture;
- trade-date versus settlement-date semantics where applicable.

The UI shall not allow arbitrary destructive editing of posted ledger history.

Corrections shall preserve audit lineage.

## FR-4 Portfolio Reconstruction & Reconciliation

The system shall reconstruct portfolio state from the authoritative ledger and relevant dated reference/market inputs.

It shall provide reconciliation views for at least:

- expected versus recorded/reconstructed cash;
- expected versus recorded/reconstructed holdings;
- unresolved transactions;
- missing settlement effects;
- unresolved corporate actions;
- source/broker snapshot differences when such a reference snapshot is supplied.

Discrepancies shall be visible and shall never be silently fixed.

A material reconciliation failure must be able to block portfolio-aware recommendations.

## FR-5 Cash Management

The system shall show:

- settled cash;
- executable cash;
- pending receivables/payables where supported;
- external contributions;
- withdrawals;
- planned monthly DCA contribution;
- actual monthly contribution;
- deployed DCA cash;
- undeployed/carry-forward cash.

Cash must be derived from the M2 ledger and settlement rules.

## FR-6 VN30 Universe

The system shall display:

- current VN30 members;
- historical membership;
- membership effective dates;
- Legacy Holding status;
- sector;
- score;
- rank;
- data confidence;
- investability;
- owned/not owned status;
- current recommendation where valid.

A VN30 reconstitution shall trigger the M5 workflow.

It shall not automatically generate an executed BUY or SELL.

## FR-7 Scoring Dashboard

The scoring UI shall expose sufficient decomposition to answer:

> “Why did this company receive this score?”

At minimum it shall display the approved M3 category decomposition, metric evidence, relevant normalization, confidence, freshness, and material missing-data status.

The implementation shall preserve:

- approved M3 weights;
- metric definitions;
- sector-normalization rules;
- missing-data rules;
- double-count controls;
- FACT / ESTIMATE / ASSUMPTION classification;
- methodology version.

A total score shall not be shown as production-valid when M3 score-validity requirements fail.

## FR-8 Ranking & Top 10

The system shall show:

- overall VN30 rank;
- sector rank where defined;
- valuation-oriented comparison;
- quality-oriented comparison;
- confidence filters;
- score validity/actionability;
- Top 10 opportunities.

The Top 10 shall be produced using the approved `RANKING_RULES.md`, not a blind descending sort of Total Score.

The UI shall distinguish research ranking from actionable allocation ranking when portfolio or data-integrity state prevents actionability.

## FR-9 Decision Center

For a selected ticker, the Decision Center shall display the approved decision inputs, including at minimum:

- eligibility / VN30 status;
- ownership status;
- Stage 0 status;
- score and validity;
- rank;
- thesis status;
- valuation / expected forward return;
- risk / veto status;
- decision confidence;
- current position;
- post-trade portfolio impact;
- sector exposure;
- cash and board-lot feasibility;
- lot cost;
- opportunity cost;
- final Decision State;
- execution/actionability status;
- reasons;
- risks;
- invalidation conditions;
- review triggers.

Only the approved M4 Decision Engine may assign:

- STRONG BUY;
- BUY;
- ACCUMULATE;
- HOLD;
- REDUCE;
- SELL;
- AVOID.

The UI shall not create independent score-threshold-to-decision mappings.

## FR-10 DCA Planner

Inputs shall include:

- planned contribution;
- actual contribution;
- existing cash;
- current positions;
- current actionable ranking;
- current valid prices;
- lot-size requirement;
- portfolio constraints;
- sector constraints;
- opportunity-cost inputs.

Outputs shall include:

- eligible candidates;
- excluded candidates with reasons;
- required cash for an executable lot;
- projected position weight;
- projected sector exposure;
- risk impact;
- opportunity-cost comparison;
- carry-forward cash impact;
- decision/reference IDs when a formal decision exists.

The planner must permit no-deployment outcomes.

Expected operational outcomes include, subject to M4 semantics:

- BUY 100;
- ACCUMULATE 100;
- HOLD CASH.

The planner shall not substitute a cheaper but inferior security merely because the highest-ranked valid candidate is unaffordable.

## FR-11 Risk Dashboard

The system shall display risk views required by M1/M5, including at minimum:

- cash %;
- largest position;
- Top 3 concentration;
- sector exposure;
- drawdown;
- thesis-broken holdings;
- weakening-thesis holdings where applicable;
- low-confidence holdings;
- overvaluation flags;
- Legacy Holdings;
- reconciliation/data-integrity warnings;
- policy/risk flags.

Status labels shall follow approved M5 semantics, including:

- GREEN;
- WATCH;
- WARNING;
- BREACH.

Risk status shall be computed in the domain/service layer, not inferred by UI styling.

## FR-12 Investment Journal

The system shall create and preserve auditable decision/journal records with, at minimum:

- Decision ID;
- date;
- data as-of date;
- ticker/security ID;
- recommendation;
- execution status;
- shares/target exposure where applicable;
- price/reference price;
- score;
- score/rule version;
- thesis;
- valuation;
- portfolio context;
- reason;
- risks;
- invalidation;
- review trigger;
- confidence;
- source/evidence references;
- portfolio snapshot ID where reconstructable.

Journal records shall distinguish:

- recommendation;
- authorization/actionability;
- executed transaction.

The system shall support later decision review around 3, 6, and 12 months where meaningful.

Decision-quality review must be separated from price outcome.

## FR-13 Review Center

The system shall support workflow execution and persistence for:

- Weekly Review;
- Monthly DCA Review;
- Quarterly Fundamental Review;
- Annual Review;
- Event-Driven Review;
- VN30 Reconstitution Review;
- Portfolio Risk Review;
- Performance Review;
- Behavioral Review.

A scheduled review shall not imply a transaction.

`NO ACTION`, `HOLD CASH`, `REVIEW REQUIRED`, and `DECISION REQUIRED` must remain valid workflow outcomes where defined by M5.

Each review must support status, findings, unresolved actions, escalation, and links to resulting decisions/transactions.

## FR-14 Performance

The system shall calculate and/or expose the approved portfolio performance measures, including:

- contributions;
- withdrawals;
- NAV;
- total return;
- TWR/unitized return where required by M2;
- XIRR;
- CAGR where applicable;
- realized P&L;
- unrealized P&L;
- dividends;
- current drawdown;
- maximum drawdown;
- VN30 benchmark return;
- active/comparative return where methodologically valid.

The application must not use raw NAV growth as a substitute for investment return when external cash flows exist.

## FR-15 Data Freshness

Every material market/fundamental/reference dataset used for a score, ranking, recommendation, risk status, or performance output shall preserve:

- `as_of_date` or equivalent effective timestamp;
- source;
- imported/retrieved timestamp;
- version/revision where applicable;
- freshness status.

The UI shall visibly warn for stale or outdated material data.

Material stale/missing data must reduce confidence, mark outputs provisional, or block action according to governing M2–M4 rules.

The system shall never present stale data as current merely because it was imported recently.

## FR-16 Manual Data Import

The first production-capable version shall support manual import for selected datasets, prioritizing:

- transactions;
- VN30 membership/reference data;
- sector/reference data where needed;
- market prices;
- benchmark observations;
- scorecard/scoring inputs;
- financial/fundamental data.

Supported initial formats should include CSV and may include Excel where justified.

Each import flow shall provide:

1. file/schema detection;
2. validation;
3. preview;
4. row-level error reporting;
5. duplicate detection;
6. source attribution;
7. as-of/effective-date checks;
8. explicit commit;
9. import batch ID;
10. import audit log.

Bad records shall not be silently dropped.

Partial imports must follow an explicit policy and report exactly what was accepted/rejected.

## FR-17 Market Data Provider Boundary

The domain shall consume market/fundamental information through a provider abstraction rather than a vendor-specific API.

The abstraction must allow future providers for:

- latest/reference prices;
- historical prices;
- VN30/index values;
- fundamental metrics/data;
- corporate/reference information.

Manual/CSV import shall be a valid first provider.

Business logic shall not depend directly on a specific external API.

## FR-18 AI Integration Boundary

AI may:

- analyze;
- summarize;
- draft reviews;
- draft score rationale;
- propose recommendations;
- identify missing data;
- identify possible behavioral bias.

AI shall not:

- directly mutate the authoritative transaction ledger;
- silently post a correction;
- execute a real broker trade;
- bypass user confirmation for asset-changing events;
- overwrite approved M1–M5 rules.

Any AI-generated analytical output used operationally must be labeled and traceable to its inputs/version.

An executed transaction requires explicit user action.

## FR-19 Export & Backup

The application shall provide a design path for:

- CSV export of user-owned data;
- transaction export;
- holdings/portfolio snapshot export;
- journal/review export;
- database backup;
- database restore validation.

The user shall not be locked into a proprietary-only data format.

PDF/report rendering is not required for the MVP.

## FR-20 Audit Trail

Every material recommendation shall be reconstructable from:

- recommendation/decision ID;
- decision date;
- data as-of date;
- portfolio snapshot or ledger watermark;
- source evidence;
- scoring model/version;
- metric/ranking version;
- decision engine version;
- investment-policy version where applicable;
- input values/assumptions;
- output;
- review trigger;
- subsequent execution transaction ID if any.

Historical analytical outputs shall not be overwritten when methodology changes.

The system shall preserve both, where required:

- historical “as-calculated” output;
- later recomputation using corrected/latest data.

---

# 5. User Workflows

## WF-1 Record a Cash Contribution

1. User creates CASH_DEPOSIT.
2. System validates amount/date/source reference.
3. User previews impact.
4. User explicitly commits.
5. Ledger event becomes immutable.
6. Cash projection is rebuilt.
7. Reconciliation status updates.
8. Monthly DCA state reflects actual contribution without assuming deployment.

## WF-2 Record a BUY

1. User selects/enters BUY event.
2. System validates VN30/Legacy status where applicable, quantity, price, fees, dates, available cash/settlement semantics, and duplicate reference.
3. System shows preview.
4. User explicitly commits.
5. Ledger is updated immutably.
6. Holdings/cash/cost basis are reconstructed.
7. Related Decision ID may be linked but does not replace transaction truth.
8. Reconciliation is re-run.

## WF-3 Correct an Incorrect Transaction

1. User locates original immutable event.
2. System forbids destructive history rewrite.
3. User creates approved reversal/correction event.
4. System links correction to original.
5. Replay produces corrected state.
6. Audit history retains both original and correction.

## WF-4 Monthly DCA Review

1. Validate portfolio/reconciliation state.
2. Confirm planned and actual contribution.
3. Refresh required market/reference/scoring inputs according to baseline freshness rules.
4. Generate eligible opportunity set.
5. Apply M3 ranking and M4 DCA/opportunity-cost rules.
6. Check lot affordability and portfolio/sector impact.
7. Produce candidate actions or HOLD CASH.
8. User reviews.
9. Formal M4 decision is created where required.
10. Only explicit user action creates any transaction.

## WF-5 Weekly Review

1. Run data-integrity gate.
2. Inspect portfolio/risk exceptions and new material information.
3. Avoid unnecessary full rescoring when no material driver changed.
4. Resolve to NO ACTION, REVIEW REQUIRED, or DECISION REQUIRED as defined by M5.
5. Escalated decisions use M4.
6. Persist review and links.

## WF-6 Quarterly Review

1. Validate authoritative data.
2. Refresh fundamental evidence.
3. Reassess thesis and relevant scores.
4. Reassess valuation/risk.
5. Re-run ranking where required.
6. Review each material holding/candidate according to M5.
7. Persist review and any formal M4 decisions.

## WF-7 VN30 Reconstitution

1. Import/confirm new effective-dated membership.
2. Identify entrants, exits, current holdings affected.
3. Mark exiting owned names as Legacy Holdings according to baseline.
4. Prohibit new capital to ineligible Legacy Holdings.
5. Trigger M5 reconstitution workflow.
6. Do not auto-buy entrants or auto-sell exits.
7. Persist review/decision trail.

## WF-8 Decision Audit

1. Select historical Decision ID.
2. Reconstruct data/methodology available at decision time.
3. Compare process to then-current baseline.
4. Review 3/6/12-month outcome where meaningful.
5. Classify decision quality separately from outcome.
6. Record behavioral/process lessons without rewriting history.

---

# 6. Data Requirements

## DR-1 Identity & Effective Dating

Core records must use stable IDs rather than mutable display names.

Effective-dated entities must preserve historical validity, including at minimum:

- VN30 membership;
- sector assignment;
- market/benchmark observations;
- corporate-action/reference data where applicable.

## DR-2 Timestamps

The system must distinguish where relevant:

- event date;
- source publication date;
- data as-of date;
- effective date;
- import/retrieval timestamp;
- review date;
- decision date;
- trade date;
- settlement date;
- valuation timestamp.

## DR-3 Provenance

Material imported or calculated records must preserve:

- source;
- source reference;
- import batch/calculation run;
- source version/revision where applicable;
- method version;
- user/system actor where relevant.

## DR-4 Data Classification

Material research/scoring/decision inputs must support:

- FACT;
- ESTIMATE;
- ASSUMPTION.

Missing, unavailable, unknown, not-applicable, provisional, and stale states must not be collapsed into a single null-like meaning when the governing baseline distinguishes them.

## DR-5 Versioning

The system must support immutable or historically reproducible version identifiers for at least:

- investment policy;
- scoring model;
- metric definitions / normalization where material;
- ranking methodology;
- decision engine;
- risk methodology/status logic;
- recommendation/decision record;
- portfolio/accounting reconstruction method;
- performance/benchmark method.

## DR-6 Derived Snapshots

A derived snapshot may improve UX/performance, but it must retain enough lineage to be rebuilt.

A snapshot must never become a second independently editable accounting truth.

---

# 7. Non-Functional Requirements

## NFR-1 Correctness

Portfolio accounting and decision-rule behavior must be deterministic for identical inputs and versions.

Money calculations shall avoid binary floating-point errors.

Rounding rules must be explicit and tested.

## NFR-2 Data Integrity

The system must enforce database/application constraints sufficient to prevent invalid authoritative ledger state.

Material import and transaction operations must be atomic at the defined transaction/batch boundary.

## NFR-3 Traceability

A reviewer must be able to trace:

source data  
→ validated input  
→ derived metric  
→ score/rank  
→ portfolio/risk context  
→ decision  
→ execution transaction.

## NFR-4 Testability

Business logic must be separated from presentation logic so that portfolio math, scoring, ranking, decision, DCA, risk, and reconciliation can be unit/integration tested without rendering UI.

## NFR-5 Maintainability

Business rules must live in domain/service modules with clear ownership.

The UI must not duplicate investment rule logic.

## NFR-6 Local-First Operation

The MVP shall run without cloud infrastructure and without mandatory external APIs.

Core workflows must remain available with manual imports.

## NFR-7 Backup & Recoverability

A documented backup/restore path must exist before the system is considered production-capable for real portfolio records.

Restore must be verifiable rather than assumed.

## NFR-8 Security

The MVP shall minimize stored secrets and network exposure.

No broker credentials, OTP, broker password, or trading secret shall be stored.

If application authentication is unnecessary for a local single-user build, it shall not be added merely for architectural fashion.

## NFR-9 Performance

The product shall remain responsive for:

- the full VN30 universe;
- multi-year personal transaction history;
- historical daily/periodic price data needed by approved analytics;
- review/journal history.

The design need not optimize for institutional-scale multi-tenant workloads.

## NFR-10 Explainability

Every score, ranking exclusion, risk status, and recommendation shall expose an understandable reason.

The application must not present opaque “AI says BUY” output.

## NFR-11 Accessibility & UX Safety

Critical warnings, BREACH states, stale-data indicators, and confirmation steps must not rely on color alone.

Destructive or asset-changing actions must require explicit confirmation.

## NFR-12 Portability

User-owned data must be exportable.

External provider adapters must be replaceable without rewriting core domain rules.

---

# 8. Integration Boundaries

## IB-1 Market/Fundamental Providers

External market/fundamental sources terminate at an adapter/import boundary.

They may supply observations and evidence but do not own portfolio decisions.

## IB-2 File Import

CSV/Excel parsers terminate at a validation/staging boundary.

Imported records do not become authoritative until validation and explicit commit.

## IB-3 AI

AI terminates at an analytical/proposal boundary.

AI cannot directly commit ledger transactions.

## IB-4 Broker

Real broker execution and broker credential storage are out of scope.

A future broker integration must be a separate security/architecture change.

## IB-5 Export/Backup

Export and backup operate on user-owned canonical/derived records but must not mutate them.

---

# 9. Security Constraints

1. No broker username/password storage.
2. No OTP storage.
3. No broker API secret storage in source control.
4. No hard-coded application secrets.
5. No autonomous order execution.
6. AI cannot post ledger entries.
7. Import files are untrusted input and require validation.
8. File paths/names must not be trusted as schema or source identity.
9. Database backup may contain sensitive financial data and must be handled as private data.
10. Logs must avoid leaking unnecessary financial/source secrets.
11. Any future remote/cloud deployment requires a separate threat review.
12. Any future broker integration requires a separate security design and approval.

---

# 10. Audit Requirements

## AR-1 Ledger Audit

For each authoritative transaction, retain:

- immutable transaction ID;
- event type;
- dates;
- source/source reference;
- original payload/facts needed for reconstruction;
- posting effects;
- correction/reversal lineage;
- import batch/user action lineage.

## AR-2 Calculation Audit

For materialized portfolio/performance/scoring/ranking results, retain enough lineage to identify:

- input watermark/snapshot;
- data as-of;
- method version;
- calculation run;
- freshness/confidence state.

## AR-3 Decision Audit

For every formal recommendation, retain:

- decision ID;
- prior decision reference where applicable;
- rule versions;
- scoring/ranking versions;
- portfolio snapshot/watermark;
- source evidence;
- assumptions;
- output state;
- execution status;
- review trigger;
- later transaction ID if executed.

## AR-4 Review Audit

Every material review must preserve:

- review ID;
- type;
- trigger/cadence;
- review date;
- data as-of;
- reconciliation/data-quality status;
- findings;
- escalations;
- linked decisions;
- linked transactions;
- unresolved follow-ups.

## AR-5 No Silent Historical Rewrite

Changing a methodology or correcting source data must not silently overwrite prior historical analytical output.

The system shall distinguish historical as-calculated records from recomputed/restated analytics where required.

---

# 11. MVP Scope

The M6 MVP is the smallest version capable of operating the approved investment system safely and audibly.

## Included in MVP

1. Local single-user application.
2. Authoritative transaction ledger and correction/reversal workflow.
3. Portfolio reconstruction.
4. Cash/holdings/NAV/P&L/dividend calculations.
5. Reconciliation.
6. Manual CSV import for core datasets.
7. VN30 universe and effective-dated membership.
8. Scoring decomposition using M3.
9. Ranking and Top 10 using M3.
10. Decision Center using M4.
11. Monthly DCA Planner.
12. Core risk dashboard.
13. Investment Journal.
14. Weekly/Monthly/Quarterly review workflows.
15. Event-driven review record.
16. Performance and VN30 benchmark comparison.
17. Freshness/confidence warnings.
18. Audit/version lineage.
19. CSV export and database backup path.
20. Automated tests for core financial/business logic.

## Deferred but architecture-compatible

- real-time data APIs;
- scheduled automated market-data ingestion;
- cloud deployment;
- multi-user accounts;
- broker integration;
- automated real trading;
- mobile-native application;
- PDF report generation;
- advanced notification system;
- advanced AI agents;
- institutional-scale analytics.

---

# 12. Out of Scope

The following are explicitly out of scope for the first M6 implementation unless separately approved:

1. changing M1 Investment Policy;
2. changing M3 scoring weights/thresholds;
3. changing M4 Decision Engine rules;
4. creating new investment rules because UI needs a shortcut;
5. non-VN30 stock research for new capital;
6. automatic order placement;
7. broker credential storage;
8. margin/leverage;
9. intraday trading system;
10. high-frequency data;
11. microservices;
12. Kubernetes;
13. Redis;
14. event streaming infrastructure;
15. distributed database;
16. multi-tenant SaaS;
17. social/community features;
18. tax optimization beyond approved accounting rules;
19. portfolio optimization algorithms not approved by M1–M5;
20. autonomous AI portfolio control.

---

# 13. Testing Requirements

## 13.1 Portfolio Math

Tests shall cover at minimum:

- average cost / approved cost-basis method;
- partial sell;
- full sell;
- realized P&L;
- unrealized P&L;
- NAV;
- dividends;
- deposits;
- withdrawals;
- fees;
- taxes;
- trade/settlement timing where applicable;
- historical reconstruction.

## 13.2 Transactions

Tests shall cover:

- valid BUY;
- valid SELL;
- invalid quantity;
- oversell;
- duplicate source/reference;
- reversal/correction;
- fee/tax treatment;
- corporate-action paths required by M2;
- deterministic same-time replay order.

## 13.3 Scoring & Ranking

Tests shall cover:

- score calculation;
- missing data;
- confidence effects;
- sector normalization;
- sector-specific behavior;
- score validity;
- tied/near-tied ranking;
- Top 10 eligibility;
- blocked actionable ranking when portfolio integrity fails.

## 13.4 Decision Engine

Tests shall cover all seven Decision States:

- STRONG BUY;
- BUY;
- ACCUMULATE;
- HOLD;
- REDUCE;
- SELL;
- AVOID.

Tests shall prove that a high score alone cannot generate BUY.

## 13.5 DCA

Tests shall cover:

- sufficient cash;
- insufficient cash;
- carry-forward cash;
- top candidate unaffordable;
- next candidate valid;
- cheaper candidate economically inferior;
- concentration block;
- no eligible opportunity;
- HOLD CASH.

## 13.6 Risk

Tests shall cover:

- position concentration;
- sector concentration;
- drawdown escalation;
- thesis broken;
- low-confidence state;
- reconciliation/data-integrity block;
- GREEN/WATCH/WARNING/BREACH mapping according to baseline.

## 13.7 Audit

Tests shall prove that a historical recommendation can be traced to:

- data as-of;
- rule versions;
- score/rank input;
- portfolio state;
- resulting decision;
- execution transaction if one occurred.

---

# 14. Acceptance Criteria for M6 Product

M6 product acceptance requires all of the following:

1. Portfolio state can be deterministically reconstructed from authoritative transaction history plus approved reference/market data.
2. Cash reconciles under M2 rules.
3. Holdings reconcile under M2 rules.
4. NAV and P&L pass approved test cases.
5. Dividends, fees, taxes, contributions, and withdrawals are not double-counted.
6. VN30 membership history is effective-dated.
7. Legacy Holdings are handled without automatic BUY/SELL.
8. M3 score decomposition is reproducible.
9. Top 10 follows M3 ranking rules.
10. M4 Decision States are generated only by the decision domain logic.
11. DCA may validly result in HOLD CASH.
12. Portfolio/risk constraints can block action.
13. Data freshness is visible.
14. Stale/insufficient material data cannot masquerade as a current actionable recommendation.
15. Weekly/Monthly/Quarterly workflows are persistable and auditable.
16. Recommendation is distinct from execution.
17. AI cannot directly mutate authoritative ledger state.
18. Every formal recommendation retains methodology/input lineage.
19. Reconciliation discrepancies are visible and never silently repaired.
20. Core user data can be exported.
21. Database backup/restore strategy is documented and testable.
22. Core automated tests pass.
23. No Critical or Major unresolved issue remains.
24. Documentation reflects implemented behavior.
25. M1–M5 baseline semantics are not silently changed.

---

# 15. M6.1 Requirements Acceptance Criteria

`06_DASHBOARD/REQUIREMENTS.md` may be approved when:

1. functional scope is complete enough to drive architecture;
2. source-of-truth boundaries from M2 are preserved;
3. M3 scoring/ranking semantics are not simplified by UI requirements;
4. M4 decision semantics are preserved;
5. M5 review workflows can be represented without forcing trades;
6. MVP and out-of-scope are explicit;
7. data freshness and confidence are explicit;
8. reconciliation is first-class;
9. audit/version requirements are explicit;
10. AI/broker boundaries are safe;
11. implementation is not prematurely tied to a specific API/vendor;
12. no new investment rule has been invented;
13. no Critical/Major review issue remains unresolved;
14. user explicitly approves this document before `ARCHITECTURE.md` begins.

---

# 16. Cross-Baseline Traceability Matrix

| Requirement Area | Governing Source |
|---|---|
| Investment mandate, DCA philosophy, long-term behavior | M1 Investment Policy |
| Analysis/decision sequencing and confidence | M1 Decision Framework |
| Risk vetoes/concentration/drawdown | M1 Risk Policy |
| 100-point model | M1 Scoring Model |
| AI operating boundaries | M1 System Prompt + M6 requirement |
| Ledger/accounting source of truth | M2 Data Model / Transactions |
| Portfolio math and performance state | M2 Portfolio |
| VN30 membership / Legacy status | M2 VN30 Master |
| Sector history | M2 Sector Master |
| Benchmark methodology | M2 Benchmark |
| Validation/freshness/corrections | M2 Data Rules |
| Metric/scoring decomposition | M3 Scoring Engine / Metric Definitions |
| Sector scoring normalization | M3 Sector Normalization |
| Scorecard explainability | M3 Scorecard Template |
| Rank / Top 10 | M3 Ranking Rules |
| Decision State assignment | M4 Decision Engine |
| Buy/Add | M4 Buy Rules |
| Reduce/Sell | M4 Sell Rules |
| DCA | M4 DCA Rules |
| Position impact | M4 Position Sizing |
| Capital comparison | M4 Opportunity Cost |
| Decision audit schema | M4 Decision Template |
| Review cadence and escalation | M5 Operating Model + review files |
| Journal / performance / behavior | M5 corresponding workflow files |

---

# 17. Multi-Role Review

## 17.1 Product Manager Review

### Critical
- None unresolved.

### Major issues found and resolved
**PM-M1 — MVP boundary was too broad without explicit sequencing.**  
Resolution: MVP is defined as capability scope, while implementation remains split into M6.2–M6.8. Not every MVP feature is built simultaneously.

**PM-M2 — Recommendation and execution could be conflated.**  
Resolution: explicit three-way separation added: recommendation → authorization/actionability → executed transaction.

### Minor
- Future notification/automation UX is deferred.
- PDF reporting is deferred.

## 17.2 Software Architect Review

### Critical
- None unresolved.

### Major issues found and resolved
**SA-M1 — Risk of duplicated accounting state.**  
Resolution: authoritative ledger and derived projections are explicitly separated.

**SA-M2 — Risk of vendor lock-in.**  
Resolution: market/fundamental data must enter through replaceable provider/import boundaries.

**SA-M3 — Risk of business rules leaking into UI.**  
Resolution: domain/service ownership is mandatory; UI is presentation/workflow only.

### Minor
- Physical DB/ORM/stack selection intentionally deferred to `ARCHITECTURE.md`.

## 17.3 Portfolio Manager Review

### Critical
- None unresolved.

### Major issues found and resolved
**PMGR-M1 — Monthly contribution could accidentally imply monthly purchase.**  
Resolution: HOLD CASH is an explicit valid DCA outcome.

**PMGR-M2 — Weekly/quarterly workflow could accidentally force trading.**  
Resolution: review outputs remain separate from M4 decision and execution.

**PMGR-M3 — High-ranked but unaffordable candidate could lead to cheap-stock substitution.**  
Resolution: DCA requirements preserve opportunity-cost logic and prohibit affordability-only substitution.

### Minor
- Advanced portfolio attribution can be deferred.

## 17.4 Data Engineer Review

### Critical
- None unresolved.

### Major issues found and resolved
**DE-M1 — `updated_at` alone could falsely imply fresh data.**  
Resolution: as-of/effective dates are separated from import/retrieval timestamps.

**DE-M2 — Historical methodology changes could destroy reproducibility.**  
Resolution: version lineage and as-calculated vs recomputed outputs are required.

**DE-M3 — Bad import rows could disappear silently.**  
Resolution: preview, row errors, duplicate detection, import audit, and explicit commit are required.

### Minor
- Exact import file schemas belong in later M6 data-flow/implementation documents.

## 17.5 Security Reviewer

### Critical
- None unresolved.

### Major issues found and resolved
**SEC-M1 — AI could accidentally become an execution actor.**  
Resolution: AI has no ledger mutation or trade authority.

**SEC-M2 — Broker integration could introduce credential risk prematurely.**  
Resolution: broker credentials and real order execution are explicitly out of scope.

**SEC-M3 — Backup data sensitivity was not initially explicit.**  
Resolution: backup is classified as private financial data and future remote deployment requires separate threat review.

### Minor
- Encryption-at-rest choice is deferred to architecture because the first version is local-first and deployment context is not yet selected.

---

# 18. Issue Register / Change-Request Triggers

No new upstream investment rule is introduced by this requirements document.

The following conditions, if encountered during architecture/implementation, require a separate issue/change request rather than an invented rule:

1. an M1 risk state lacks a machine-operational threshold required by the UI;
2. an M2 accounting edge case is not deterministic;
3. two M2 documents disagree on source-of-truth ownership;
4. an M3 scoring metric cannot be represented without changing economic meaning;
5. M3 ranking/Top-10 rules are ambiguous for a production tie/blocked-data case;
6. M4 Decision State precedence is ambiguous for a production scenario;
7. M4 DCA/position-sizing logic lacks a deterministic executable outcome;
8. M5 review status semantics conflict across review files;
9. a required freshness threshold is unspecified and materially affects actionability;
10. a corporate-action case cannot be reconstructed under the approved ledger rules.

Each issue must record:

- issue ID;
- severity;
- affected feature;
- conflicting/missing requirement;
- source document;
- implementation impact;
- safe temporary behavior;
- proposed Change Request;
- approval status.

---

# 19. Final Review Result

**Critical unresolved:** 0  
**Major unresolved:** 0  

**Minor/deferred:**  
- physical technology stack;
- database engine/ORM choice;
- precise application module boundaries;
- import schemas;
- backup mechanism;
- local authentication choice if any;
- chart library;
- API/provider interface shape;
- UI navigation structure.

These are intentionally deferred to later M6.1 architecture documents and do not require changing investment semantics.

---

# 20. Approval Gate

Current document state:

> **DRAFT v0.1 — READY FOR USER REVIEW**

If approved:

1. promote `06_DASHBOARD/REQUIREMENTS.md` to **Approved Baseline v1.0**;
2. preserve it as the requirements source of truth for M6;
3. proceed only to `06_DASHBOARD/ARCHITECTURE.md`;
4. do not begin implementation/code until the M6.1 architecture set is approved.
