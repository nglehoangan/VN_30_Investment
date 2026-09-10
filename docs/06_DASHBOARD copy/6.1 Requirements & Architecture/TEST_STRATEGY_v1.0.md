# VN30 Value Investing OS — Test Strategy

**Document:** `06_DASHBOARD/TEST_STRATEGY.md`  
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
- `06_DASHBOARD/DATA_FLOW.md` — Approved Baseline v1.0
- `06_DASHBOARD/UI_INFORMATION_ARCHITECTURE.md` — Approved Baseline v1.0
- `06_DASHBOARD/MARKET_DATA_ADAPTER.md` — Approved Baseline v1.0
- `06_DASHBOARD/AI_INTEGRATION.md` — Approved Baseline v1.0
- `06_DASHBOARD/SECURITY.md` — Approved Baseline v1.0
- all approved M1–M5 baselines

This document defines how M6 implementation will be validated.

It does **not** redefine investment/accounting rules.

---

# 1. Purpose

The test strategy must prove that M6 is not merely a dashboard that renders data, but a reliable portfolio-management system that:

1. reconstructs portfolio state deterministically;
2. preserves source-of-truth boundaries;
3. implements M3 scoring/ranking correctly;
4. implements M4 decision logic correctly;
5. implements M5 workflows without forcing action;
6. survives stale/missing/conflicting data safely;
7. preserves audit lineage;
8. prevents unauthorized or accidental ledger mutation;
9. remains provider/AI replaceable;
10. can be backed up and restored without losing integrity.

---

# 2. Testing Principles

## TP-1 — Domain behavior before UI snapshots

Core investment/accounting logic must be tested directly at domain/application level.

UI tests are not a substitute for domain tests.

## TP-2 — Deterministic fixtures

Tests must use deterministic fixtures.

No core test may depend on:

- live market APIs;
- current internet state;
- real AI response;
- current wall-clock time without controlled clock abstraction.

## TP-3 — Source-of-truth invariants first

The most important tests protect:

- immutable ledger;
- deterministic reconstruction;
- no negative long-only holdings;
- no duplicate transaction effects;
- reconciliation integrity;
- methodology/version lineage.

## TP-4 — Failure states are first-class

Tests must cover:

- stale;
- missing;
- blocked;
- conflicted;
- invalid;
- duplicate;
- provider unavailable;
- projection rebuild failure.

## TP-5 — Historical reproducibility

Given the same:

- authoritative ledger;
- observations;
- methodology;
- as-of;
- configuration;

the system must reproduce the same relevant historical result.

## TP-6 — No hidden action bias

Tests must verify valid outcomes such as:

- HOLD;
- HOLD CASH;
- NO ACTION;
- REVIEW REQUIRED.

---

# 3. Test Pyramid

Recommended distribution:

```text
             E2E / Workflow
            /              \
       Integration Tests
      /                  \
 Domain / Application Unit Tests
```

Priority order:

1. Domain unit tests
2. Application/integration tests
3. Critical workflow E2E
4. UI component tests
5. Visual/manual review where appropriate

Do not over-invest in brittle UI snapshots.

---

# 4. Test Categories

Required categories:

- Domain Unit
- Application Service
- Persistence Integration
- Reconstruction
- Reconciliation
- Scoring
- Ranking
- Decision Engine
- DCA
- Risk
- Performance
- Review Workflows
- Journal/Audit
- Import
- Market Data Adapters
- AI Integration
- Security
- Backup/Restore
- UI Behavior
- E2E
- Regression

---

# 5. Domain Unit Tests

Recommended framework:

- Vitest

Domain unit tests should avoid:

- Prisma;
- Next.js runtime;
- real filesystem;
- real network;
- real AI.

Test pure or mostly-pure services with explicit inputs.

Examples:

- Money arithmetic;
- ShareQuantity rules;
- effective-date lookup;
- cost basis;
- portfolio valuation;
- ranking;
- decision precedence;
- DCA candidate selection;
- risk aggregation;
- performance calculations.

---

# 6. Ledger Tests

Critical scenarios:

## 6.1 BUY

Verify:

- quantity increases;
- cash/payable effects are correct;
- fees/taxes handled according to M2;
- cost basis derived correctly;
- no double counting.

## 6.2 SELL

Verify:

- quantity decreases;
- oversell rejected;
- realized P&L correct;
- settlement cash timing correct.

## 6.3 Dividend

Verify:

- dividend income;
- cash timing;
- no impact on quantity unless corporate-action rule explicitly says otherwise.

## 6.4 Cash deposit/withdrawal

Verify:

- external flow classification;
- performance treatment;
- no fake investment return.

## 6.5 Fees/taxes

Verify:

- event/posting semantics;
- no duplication between header facts and legs.

## 6.6 Correction/Reversal

Verify:

- original remains immutable;
- reversal links correctly;
- reconstructed state reflects correction;
- original audit preserved.

## 6.7 Duplicate

Verify:

- same source/idempotency key cannot create duplicate economic event.

---

# 7. Reconstruction Tests

Given transaction history, verify exact reconstruction of:

- settled cash;
- unsettled cash;
- quantity;
- MWAC/open cost;
- realized P&L;
- dividends;
- NAV;
- sector weights.

Required cases:

1. empty portfolio;
2. single BUY;
3. multiple BUYs;
4. partial SELL;
5. full SELL;
6. BUY after partial SELL;
7. fees/taxes;
8. deposit/withdrawal;
9. dividend;
10. transaction reversal;
11. corporate action;
12. historical as-of before/after settlement;
13. same history replayed twice produces same result.

---

# 8. Ledger Watermark Tests

Verify:

1. new transaction advances/changes authoritative watermark;
2. old PortfolioSnapshot is detectable as stale;
3. stale snapshot cannot be used for actionable decision;
4. successful rebuild produces matching watermark;
5. projection rebuild failure blocks actionability;
6. ledger transaction remains committed after projection failure.

---

# 9. Reconciliation Tests

Required cases:

- exact match;
- cash mismatch;
- quantity mismatch;
- cost-basis mismatch;
- missing source evidence;
- stale broker/reference snapshot;
- resolved discrepancy;
- unresolved material discrepancy blocks actionability.

Important:

Reconciliation tests must prove the system never silently repairs authoritative data.

---

# 10. Corporate Action Tests

At minimum for supported M2 cases:

- stock split;
- reverse split;
- cash dividend;
- stock dividend/bonus;
- rights/corporate entitlement where supported;
- multi-stage action;
- reversal/correction.

Verify reference event is distinct from accounting transaction effects.

---

# 11. Effective-Dating Tests

Required for:

- VN30 membership;
- sector assignment;
- methodology version;
- market/reference observations.

Test:

- before effective date;
- on effective date;
- after end date;
- correction/supersession;
- overlap conflict;
- unknown gap.

Current assignment must never overwrite historical lookup.

---

# 12. Numeric Precision Tests

Must verify:

- whole-VND values;
- very large VND values;
- non-integer price;
- tax/fee percentages;
- MWAC;
- partial cost release;
- TWR/XIRR relevant intermediate values;
- serialization round-trip.

Prohibited pass condition:

> “Looks close enough” due to floating-point rounding.

Expected tolerances, where mathematical methods require tolerance, must be explicit.

---

# 13. Scoring Engine Tests

M3 implementation must test:

## 13.1 Metric scoring

- valid input;
- boundary values;
- missing input;
- invalid input;
- stale input;
- FACT/ESTIMATE/ASSUMPTION handling.

## 13.2 Sector normalization

At minimum test representative sector-specific paths from approved M3 validation cases.

## 13.3 Score aggregation

Verify:

- subcategory score;
- category score;
- total score;
- confidence;
- validity.

## 13.4 Missing data

Verify missing decision-critical data does not silently receive neutral score.

## 13.5 Traceability

Every score must be traceable:

```text
Source
 -> Metric
 -> Normalization
 -> Rubric
 -> Subcategory
 -> Category
 -> Total
```

---

# 14. Ranking Tests

Required cases:

1. valid 30-stock universe;
2. confidence below allowed level;
3. hard veto;
4. missing decision-critical evidence;
5. blocked portfolio accounting state;
6. tie / near-tie;
7. sector filtering;
8. Top 10;
9. research ranking vs actionable ranking;
10. high score excluded for valid reason.

Important:

A simple descending score sort must fail official Top 10 tests when M3 rules require otherwise.

---

# 15. Decision Engine Tests

Must cover all seven Decision States:

- STRONG BUY
- BUY
- ACCUMULATE
- HOLD
- REDUCE
- SELL
- AVOID

Test dimensions:

- thesis valid/broken;
- valuation attractive/neutral/expensive;
- risk veto;
- confidence;
- current ownership;
- cash;
- board-lot feasibility;
- opportunity cost;
- concentration;
- stale/blocking data;
- legacy holding;
- technical/market input.

Explicit anti-shortcut tests:

- high score alone must not guarantee BUY;
- low PE alone must not guarantee BUY;
- price drop alone must not guarantee ACCUMULATE;
- +20% gain alone must not guarantee REDUCE/SELL.

---

# 16. Decision Precedence Tests

Where multiple signals conflict, verify approved precedence.

Examples:

- strong score + thesis broken;
- attractive valuation + risk veto;
- BUY-quality candidate + insufficient cash;
- owned position + better opportunity elsewhere;
- stale data + otherwise positive case.

If upstream precedence is ambiguous:

- fail safe;
- log Change Request;
- do not invent behavior in test fixture.

---

# 17. Position Sizing Tests

Required cases:

- minimum board lot;
- insufficient cash;
- post-trade concentration limit;
- sector limit;
- residual cash;
- top-ranked candidate unaffordable;
- alternative candidate affordable;
- no acceptable alternative => HOLD CASH.

Do not test affordability as if it determines economic ranking.

---

# 18. DCA Tests

Required scenarios:

1. sufficient cash + valid candidate;
2. insufficient cash;
3. carry cash across months;
4. top candidate unaffordable;
5. second candidate valid;
6. no eligible candidate;
7. existing position violates concentration;
8. thesis broken;
9. stale score/price;
10. HOLD CASH.

Critical invariant:

Monthly contribution must never force a purchase.

---

# 19. Risk Tests

Required:

- largest-position concentration;
- Top 3 concentration;
- sector concentration;
- cash percentage;
- drawdown;
- thesis broken;
- low confidence;
- overvaluation;
- stale/blocking data;
- reconciliation failure;
- Legacy Holding.

Verify status outputs required by M5:

- GREEN
- WATCH
- WARNING
- BREACH

UI color is not tested as risk logic.

---

# 20. Performance Tests

At minimum:

- external contribution does not create investment return;
- withdrawal;
- dividend;
- TWR;
- XIRR where applicable;
- CAGR where applicable;
- unitized drawdown;
- maximum drawdown;
- benchmark comparison;
- price-return vs total-return incompatibility;
- stale benchmark data;
- mismatched date.

---

# 21. Review Workflow Tests

## Weekly

Verify:

- NO ACTION is normal;
- elapsed week does not force score refresh/trade;
- material event escalates.

## Monthly DCA

Verify:

- capital allocation workflow;
- HOLD CASH valid;
- no automatic transaction.

## Quarterly

Verify:

- fundamental refresh;
- thesis review;
- selective rescoring.

## Annual

Verify:

- governance/performance/behavioral learning.

## Event-Driven

Verify:

- event creates review;
- evidence validation occurs before decision escalation.

## VN30 Reconstitution

Verify:

- entrant/exit detection;
- no automatic BUY/SELL.

---

# 22. Journal / Decision Audit Tests

Verify:

- DecisionRecord immutable;
- JournalEntry links correctly;
- 3/6/12-month audit creates new record;
- original context preserved;
- outcome vs process quality separated;
- hindsight does not overwrite original thesis.

---

# 23. Import Tests

Each import type must test:

- valid file;
- invalid schema;
- duplicate;
- partial invalid rows;
- conflict;
- oversized file;
- too many rows;
- formula injection;
- path traversal attempt;
- unexpected column;
- wrong units;
- wrong date format;
- preview;
- commit;
- cancel;
- audit report.

No invalid row may disappear silently.

---

# 24. Market Data Adapter Tests

Use mocks/fixtures.

Test:

- provider mapping;
- as-of;
- retrieved_at;
- stale data;
- revision;
- conflict;
- unit normalization;
- ticker/security mapping;
- partial provider failure;
- schema change;
- timeout;
- rate limit;
- replacement provider compatibility.

No live provider is required for core CI.

---

# 25. AI Integration Tests

Use deterministic mock AI provider.

Required cases:

- valid structured output;
- malformed JSON;
- unknown evidence reference;
- fabricated source ID;
- prompt injection in evidence;
- attempt to force Decision State;
- attempt to post transaction;
- stale data represented as current;
- provider failure;
- timeout;
- model change lineage;
- human-review flag.

Core tests must not depend on stochastic real-model output.

---

# 26. Security Tests

Required minimum:

## Network
- loopback bind in MVP config.

## Request safety
- CSRF/origin rejection where applicable;
- stale form rejection;
- duplicate submit.

## Secret safety
- secrets absent from browser bundle;
- logs redact secrets;
- secrets absent from repo test fixture scans.

## Import safety
- macro/formula/path abuse.

## Authorization boundary
- no generic client DB mutation endpoint.

## AI
- no transaction-write capability.

---

# 27. Backup / Restore Tests

Required:

1. create backup;
2. verify manifest/checksum if implemented;
3. restore to clean environment;
4. schema/version validation;
5. rebuild projections;
6. run reconciliation;
7. compare reconstructed portfolio;
8. compare methodology registry;
9. verify historical decisions/reviews remain linked.

Backup test passes only if restored state is operationally consistent.

---

# 28. Persistence Integration Tests

Run against actual selected test DB technology.

For SQLite MVP test:

- transactions;
- unique constraints;
- foreign keys;
- decimal/numeric round-trip;
- effective-date queries;
- transaction rollback;
- WAL/backup behavior if selected;
- migrations.

Do not mock persistence for all integration tests.

---

# 29. Migration Tests

For each schema migration:

- apply to empty DB;
- apply from previous supported schema;
- preserve data;
- run reconstruction/reconciliation;
- verify methodology/audit history.

No destructive migration may silently drop authoritative history.

---

# 30. UI Component Tests

Use React Testing Library where useful.

Focus on behavior:

- stale warning visible;
- BLOCKED state visible;
- recommendation vs execution separate;
- transaction confirm details;
- import preview;
- error state;
- HOLD CASH;
- NO ACTION.

Avoid excessive snapshot tests.

---

# 31. E2E Workflows

Use Playwright for critical end-to-end flows.

Minimum E2E set by M6 completion:

## E2E-1 — Initial portfolio setup/import

```text
import transactions
 -> commit
 -> reconstruct
 -> reconcile
 -> dashboard
```

## E2E-2 — Record BUY

```text
Decision reference
 -> transaction draft
 -> confirm
 -> ledger
 -> holdings/NAV updated
```

## E2E-3 — Reverse transaction

```text
view transaction
 -> reverse
 -> confirm
 -> rebuild
 -> reconcile
```

## E2E-4 — Monthly DCA HOLD CASH

```text
contribution
 -> ranking
 -> no valid candidate
 -> HOLD CASH
```

## E2E-5 — Monthly DCA candidate

```text
valid candidate
 -> Decision
 -> transaction draft
 -> user confirm
```

## E2E-6 — Stale data block

```text
stale decision-critical input
 -> warning
 -> actionable decision blocked
```

## E2E-7 — VN30 reconstitution

```text
membership import
 -> detect exit/entrant
 -> review required
 -> no automatic trade
```

## E2E-8 — Backup/restore

```text
backup
 -> restore
 -> rebuild
 -> reconciliation PASS
```

---

# 32. Regression Test Suite

Every fixed Critical/Major defect must add a regression test where practical.

Rule:

> A bug important enough to fix in accounting, scoring, decision, DCA, risk, or audit logic should normally become impossible to reintroduce silently.

---

# 33. Test Fixtures

Maintain curated fixture families:

- ledger histories;
- market observations;
- VN30 membership;
- sectors;
- fundamentals;
- scorecards;
- decisions;
- review histories.

Fixtures should be:

- named by scenario;
- minimal;
- deterministic;
- versioned if methodology-sensitive.

Avoid giant opaque fixture dumps.

---

# 34. Golden Cases

Use approved M3/M4/M5 validation cases as golden behavioral tests.

Where approved Markdown contains expected result:

- encode fixture;
- encode expected output;
- link test to source baseline/version.

A golden case must pin methodology identity.

---

# 35. Property / Invariant Tests

Where useful, test invariants across generated inputs.

Examples:

- replay is deterministic;
- reversing a transaction restores prior supported state;
- SELL cannot produce negative quantity;
- portfolio weight total is coherent;
- transaction order/effective-time rules are deterministic.

Property testing is useful but optional where complexity is not justified.

---

# 36. Time Control

Inject or abstract current time for logic depending on:

- as-of;
- freshness;
- review due;
- import timestamps;
- effective dating.

Tests must not become flaky because calendar date changes.

---

# 37. Mocking Policy

Mock:

- external providers;
- AI;
- clock;
- filesystem where unit-level appropriate.

Do not mock:

- core domain rules;
- all persistence behavior;
- reconstruction logic under test.

Mock at infrastructure boundaries, not business logic boundaries.

---

# 38. Coverage Policy

Coverage is a supporting metric, not the quality target.

Recommended minimum by production-capable M6:

- high coverage for domain/application services;
- meaningful branch coverage for decision/risk/DCA logic;
- critical workflows covered E2E.

Do not game coverage with:

- meaningless snapshot tests;
- exclusion of risky logic;
- trivial getters/setters.

Exact numeric threshold may be set in Implementation Plan if useful.

---

# 39. Quality Gates per Implementation Sub-milestone

Before approval of a code-producing M6 sub-milestone:

```text
lint
typecheck
unit tests
integration tests
build
git diff --check
```

Where relevant:

```text
database migration validation
E2E tests
security checks
backup/restore validation
```

Codex output is not approved solely because code compiles.

---

# 40. Codex Review Workflow

For each implementation sub-milestone:

```text
1. ChatGPT prepares precise Codex prompt
2. Codex implements
3. Run validation commands
4. ChatGPT reviews diff
5. Classify Critical/Major/Minor
6. Fix
7. Re-run validation
8. Update docs
9. User approves
10. Promote baseline / proceed
```

Do not trust Codex-generated business logic without comparing against approved baselines.

---

# 41. Severity Model

## Critical

Examples:

- accounting corruption;
- duplicate economic event;
- incorrect cash/quantity;
- ability for AI/UI to bypass ledger controls;
- wrong Decision State due to violated upstream rule;
- destructive historical mutation;
- backup restore loses authoritative data.

## Major

Examples:

- incorrect ranking;
- stale data shown as actionable;
- incorrect DCA eligibility;
- incomplete reconciliation block;
- material audit lineage missing;
- provider normalization causing wrong score.

## Minor

Examples:

- non-blocking UI issue;
- minor wording;
- low-risk developer ergonomics;
- deferred optimization.

No file/sub-milestone should be approved with unresolved Critical or Major issues.

---

# 42. Test Evidence

For each implementation milestone, retain concise evidence:

- commands run;
- exit status;
- test count;
- failing/fixed cases;
- migration status;
- E2E status;
- known limitations.

Do not claim PASS without evidence.

---

# 43. Production Readiness Exit Criteria

Before M6 as a whole is considered complete:

1. reconstruct portfolio from transaction history;
2. reconcile cash/holdings;
3. NAV/P&L tests pass;
4. all supported transaction types tested;
5. M3 golden cases pass;
6. M4 all seven states tested;
7. DCA HOLD CASH and allocation cases pass;
8. risk triggers pass;
9. reviews pass;
10. journal/audit lineage pass;
11. freshness blocking works;
12. import validation works;
13. provider replacement contract tested;
14. AI safety boundary tested;
15. backup/restore tested;
16. Critical unresolved = 0;
17. Major unresolved = 0.

---

# 44. Test Strategy Acceptance Criteria

`TEST_STRATEGY.md` is acceptable only if:

1. domain tests are primary;
2. live providers are not required for core CI;
3. ledger/reconstruction tests are comprehensive;
4. watermark/stale projection behavior is tested;
5. reconciliation cannot auto-fix silently;
6. numeric precision is tested;
7. M3 golden validation cases are represented;
8. official ranking differs from simple sorting when required;
9. all seven M4 states are tested;
10. score-only Buy shortcut is explicitly rejected;
11. DCA HOLD CASH is tested;
12. risk statuses are tested;
13. review workflows allow NO ACTION;
14. import/security edge cases are tested;
15. AI prompt injection/write attempts are tested;
16. backup/restore is validated end-to-end;
17. regression tests are added for serious bugs;
18. Codex output requires diff review;
19. no Critical/Major unresolved before approval;
20. no M1–M5 rule is changed.

---

# 45. Initial Multi-Role Review

## Product Manager

### Critical
0 unresolved.

### Major resolved
- Test strategy validates actual operating outcomes, not just screens.
- HOLD CASH and NO ACTION receive explicit coverage.
- Production readiness has business acceptance gates.

**Result:** PASS.

## Software Architect

### Critical
0 unresolved.

### Major resolved
- Test pyramid prioritizes domain behavior.
- Provider/AI boundaries are mockable.
- persistence and E2E remain real where needed.
- migration/restore are explicitly tested.

**Result:** PASS.

## Portfolio Manager

### Critical
0 unresolved.

### Major resolved
- anti-shortcut investment tests are explicit.
- all seven Decision States covered.
- DCA/opportunity-cost/risk workflows covered.
- historical audit integrity tested.

**Result:** PASS.

## Data Engineer

### Critical
0 unresolved.

### Major resolved
- reconstruction, reconciliation, effective dating, revision, precision, migration, backup all covered.
- test fixtures/golden cases preserve methodology lineage.

**Result:** PASS.

## Security Reviewer

### Critical
0 unresolved.

### Major resolved
- CSRF/origin, duplicate writes, import attacks, secrets, AI injection, restore integrity covered.

### Minor
- exact dependency scanning command/tool belongs in Implementation Plan.

**Result:** PASS.

---

# 46. Issue Register

## Critical unresolved

**0**

## Major unresolved

**0**

## Minor / Deferred

1. exact coverage percentage;
2. exact CI platform;
3. exact dependency scanning tool;
4. exact property-testing library if used;
5. exact E2E browser matrix;
6. exact performance test thresholds;
7. exact test DB reset strategy;
8. exact fixture factory implementation.

These are implementation-planning details.

---

# 47. Approval Gate

Current state:

> **APPROVED BASELINE v1.0**

If approved:

1. promote `06_DASHBOARD/TEST_STRATEGY.md` to **Approved Baseline v1.0**;
2. create/update its approved baseline artifact;
3. continue automatically to:
   **`06_DASHBOARD/IMPLEMENTATION_PLAN.md`**;
4. do not move beyond `IMPLEMENTATION_PLAN.md` until reviewed and approved.
