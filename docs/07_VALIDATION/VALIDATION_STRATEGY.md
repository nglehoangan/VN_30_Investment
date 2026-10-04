# VN30 Value Investing OS — Validation Strategy

**Document:** `07_VALIDATION/VALIDATION_STRATEGY.md`  
**Milestone:** 7 — System Validation & Investment Logic Verification  
**Sub-milestone:** M7.1 — Baseline Integrity Audit  
**Status:** Draft for Approval  
**Version:** 0.1  
**Date:** 2026-10-04  

---

## 1. Purpose

This document defines the independent validation strategy for VN30 Value Investing OS before it may be relied upon as a practical investment decision-support system.

M7 is a **correctness, policy-conformance, auditability, temporal-integrity, and model-risk validation milestone**. It is not a return-optimization exercise and does not attempt to prove that the strategy will achieve the 15–20% annual investment objective.

The central validation question is:

> **Does the executable system reproducibly implement the approved investment system, using only information legitimately available to it, while preserving accounting truth, risk controls, decision discipline, and auditability?**

The validator must be able to answer **NO**. A validation process that can only confirm the implementation is not independent enough for M7.

---

## 2. Validation Principles

1. **Falsification before confirmation.** Tests must actively seek counterexamples, boundary failures, contradictory states, temporal leakage, and undocumented behavior.
2. **Baseline before code.** Code is an implementation under test, not the authority for intended investment rules.
3. **Deterministic validation before performance validation.** M7.1–M7.5 must pass before M7.6 historical point-in-time validation begins.
4. **No silent baseline modification.** A discovered weakness creates an issue/change proposal; M7 must not silently tune M1–M6 rules.
5. **No outcome-driven tuning.** Weights, thresholds, risk limits, periods, fixtures, and decision rules must not be changed merely to improve historical returns.
6. **Independent oracle where material.** Critical accounting and decision expectations must be derived independently of the production implementation.
7. **Evidence over assertion.** A PASS requires reproducible evidence tied to a frozen baseline and implementation revision.
8. **Missing evidence is not PASS.** Absence of evidence is `PARTIAL`, `FAIL`, or `NOT IMPLEMENTED` depending on materiality and scope.
9. **Point-in-time truth.** Historical decisions may use only information available by the decision timestamp.
10. **Auditability is a functional requirement.** If a material recommendation cannot be reconstructed, the relevant gate cannot pass.
11. **Cash/no-action are legitimate outcomes.** Validation must not reward unnecessary deployment or turnover.
12. **Tests are not self-validating.** Existing M6 tests are prior evidence, not independent proof of M7 correctness.

---

## 3. Scope and Non-Goals

### 3.1 In scope

M7 validates:

- approved M1–M5 rules against M6 executable implementation;
- portfolio accounting and reconciliation;
- data integrity and effective dating;
- scoring, normalization, ranking, confidence, and missing-data behavior;
- Buy/Hold/Sell state routing and precedence;
- DCA, position sizing, opportunity cost, concentration, drawdown, and risk behavior;
- workflow triggers, review states, journaling, and decision audit records;
- point-in-time historical reconstruction and anti-look-ahead controls;
- paper/forward validation design;
- material documentation-to-code divergence;
- failure behavior, blocking behavior, and edge cases.

### 3.2 Out of scope

M7 does not:

- guarantee 15–20% annual returns;
- optimize the strategy for CAGR, Sharpe ratio, or benchmark outperformance;
- add M8 features;
- authorize automated trading;
- relax controls to improve backtest results;
- rewrite approved M1–M5 policy inside validation;
- treat favorable outcomes as proof of good decisions.

---

## 4. Frozen Validation Baseline and Inventory

### 4.1 Baseline identity requirement

Before formal traceability begins, M7 shall create a **Baseline Manifest** identifying every authoritative document and executable revision used for validation.

Each baseline entry must contain, where available:

- milestone and document path;
- approved version;
- approval status/evidence;
- repository path;
- file hash or Git blob SHA;
- governing/owning concept;
- superseded-by relationship if any;
- implementation revision/commit SHA under test.

A filename, folder location, or embedded `Status:` field alone is insufficient proof of approval. Where repository metadata and approval history disagree, the discrepancy must be recorded and resolved before the affected requirement can receive `PASS`.

### 4.2 M1 — Investment Constitution inventory

At minimum:

- `INVESTMENT_POLICY.md` — approved constitutional baseline;
- `RISK_POLICY.md`;
- `DECISION_FRAMEWORK.md`;
- `SCORING_MODEL.md`;
- `SYSTEM_PROMPT.md`;
- `README.md` where it contains governing architecture/workflow statements.

### 4.3 M2 — Portfolio Data Model & Database inventory

At minimum:

- `DATA_MODEL.md`;
- `PORTFOLIO.md`;
- `TRANSACTIONS.md`;
- `VN30_MASTER.md`;
- `SECTOR_MASTER.md`;
- `BENCHMARK.md`;
- `DATA_RULES.md`.

### 4.4 M3 — VN30 Scoring Engine inventory

At minimum:

- `SCORING_ENGINE.md`;
- `METRIC_DEFINITIONS.md`;
- `SECTOR_NORMALIZATION.md`;
- `SCORECARD_TEMPLATE.md`;
- `RANKING_RULES.md`;
- `VALIDATION_CASES.md`.

### 4.5 M4 — Buy / Hold / Sell Decision Engine inventory

At minimum:

- `DECISION_ENGINE.md`;
- `BUY_RULES.md`;
- `SELL_RULES.md`;
- `DCA_RULES.md`;
- `POSITION_SIZING.md`;
- `OPPORTUNITY_COST.md`;
- `DECISION_TEMPLATE.md`;
- `VALIDATION_CASES.md`;
- approved governance clarifications/change records that formally resolve rule ownership without silently replacing M1–M5.

### 4.6 M5 — Portfolio Management Workflow inventory

At minimum:

- `OPERATING_MODEL.md`;
- `WEEKLY_REVIEW.md`;
- `MONTHLY_DCA_REVIEW.md`;
- `QUARTERLY_REVIEW.md`;
- `ANNUAL_REVIEW.md`;
- `EVENT_DRIVEN_REVIEW.md`;
- `VN30_RECONSTITUTION.md`;
- `PORTFOLIO_RISK_REVIEW.md`;
- `INVESTMENT_JOURNAL.md`;
- `PERFORMANCE_REVIEW.md`;
- `BEHAVIORAL_REVIEW.md`;
- `REVIEW_TEMPLATES.md`;
- `VALIDATION_CASES.md`.

### 4.7 M6 — Dashboard & Automation / executable implementation inventory

M7 shall inventory both design artifacts and executable surfaces, including:

- M6.1 requirements, architecture, domain model, data flow, security, integration, market-data adapter, test strategy, implementation plan, and validation cases;
- M6.2 project foundation and repository audit;
- M6.3 portfolio/transaction implementation and verification evidence;
- M6.4 scoring/ranking implementation and evidence;
- M6.5 decision-engine implementation, rule-ownership/governance records, and evidence;
- M6.6 DCA/workflow implementation and evidence;
- M6.6.1 marginal-allocation remediation where part of the approved executable baseline;
- M6.7 dashboard UI implementation and evidence;
- M6.8 integration/validation evidence;
- database schema/migrations;
- production domain/application/infrastructure code;
- test suites and fixtures;
- methodology registry/version records;
- audit/evidence persistence paths.

M6 validation artifacts are inputs to M7 evidence review but do not automatically satisfy M7 gates.

---

## 5. Source-of-Truth and Conflict Resolution

For every requirement, M7 must identify:

1. **Intended rule** — from the approved owning baseline;
2. **Implemented rule** — observed in executable code/config/schema;
3. **Tested rule** — what automated/manual tests actually assert;
4. **Observed behavior** — runtime result under controlled input;
5. **Divergence** — if any;
6. **Severity**;
7. **Affected outputs/decisions**;
8. **Remediation owner and required action**.

Conflict resolution follows approved rule ownership and policy hierarchy. Code, tests, UI labels, migration defaults, or historical outputs cannot silently redefine an investment rule.

If intent is genuinely ambiguous across approved sources, validation status is not `PASS`; record a governance ambiguity and block the affected release gate at the appropriate severity until resolved or explicitly accepted.

---

## 6. Validation Objectives

M7 must establish sufficient evidence that:

1. portfolio quantities, cash, cost basis, P&L, dividends, fees/taxes, NAV, contributions, withdrawals, and reconciliation are correct;
2. external cash flows do not become investment return;
3. authoritative data ownership and effective dating are respected;
4. scoring is reconstructable from evidence through transformation, normalization, weights, category scores, and total score;
5. sector normalization does not create prohibited structural bias;
6. missing/stale/low-confidence data is handled according to baseline rather than silently imputed into certainty;
7. ranking and Top-10 logic follow M3 and do not become score-only portfolio decisions;
8. the Decision Engine enforces eligibility, thesis, valuation, confidence, risk, portfolio, cash, lot-size, opportunity-cost, and execution gates in approved precedence;
9. DCA is a funding cadence, not a mandatory purchase cadence;
10. concentration, drawdown, thesis break, stale data, and risk vetoes cannot be bypassed through another layer;
11. workflows trigger review without creating unnecessary trades;
12. each material decision can be reconstructed from immutable/versioned evidence;
13. historical validation is free of material look-ahead and survivorship leakage, or limitations are explicitly disclosed;
14. no validation or simulation creates trades solely to improve backtest performance;
15. release decisions remain possible even when results are unfavorable — including a final `FAIL`.

---

## 7. Validation Layers

Validation shall proceed in layers. A later layer cannot cure a failure in an earlier deterministic layer.

| Layer | Purpose | Primary methods | Entry dependency |
|---|---|---|---|
| L0 Baseline Integrity | Freeze intended rules and implementation revision | manifest, ownership mapping, diff/review | none |
| L1 Static Conformance | Map requirements to code/schema/config/tests | traceability, code inspection, schema inspection | L0 |
| L2 Deterministic Unit/Oracle | Verify formulas, gates, boundaries | independent calculations, golden fixtures, boundary tests | L0 |
| L3 Invariant/Metamorphic | Search for logically impossible behavior | property/invariant tests, monotonicity, mutation | L2 relevant domain |
| L4 Integration/Reconstruction | Verify cross-layer state and auditability | clean DB, ledger replay, persisted artifact replay | L1–L3 |
| L5 Adversarial/Failure Injection | Force stale, missing, conflicting, malformed, edge states | negative tests, fault injection, corrupted copies | L1–L4 |
| L6 Point-in-Time Historical | Ask what system knew at T | as-of datasets, availability timestamps, membership history | M7.1–M7.5 pass |
| L7 Forward/Paper | Validate live process without future knowledge | immutable timestamped paper records | historical plan ready |
| L8 Independent Final Review | Attempt to reject release | red-team review, issue closure audit | prior layers |

### 7.1 Required testing styles

M7 must combine:

- example-based tests;
- manual independent calculations;
- boundary tests around actual baseline thresholds;
- invariant/metamorphic tests;
- negative/failure tests;
- deterministic replay tests;
- cross-layer integration tests;
- temporal/as-of tests;
- audit reconstruction tests;
- mutation testing or equivalent targeted rule perturbation for critical rules where practical.

A test suite that only repeats examples already used during implementation is insufficient.

---

## 8. Independence Requirements

### 8.1 Independent Model Validator mandate

The Independent Model Validator shall assume the system may be wrong and seek evidence that would invalidate release.

The validator must not:

- infer expected outputs from production outputs;
- copy production formulas into the oracle and call that independent validation;
- treat existing passing tests as proof without reviewing their oracle;
- waive a failure because historical performance looks attractive;
- change baseline rules during the same validation step to make a failed test pass.

### 8.2 Separation of implementation and oracle

For material accounting/scoring/decision cases:

- expected values must be manually derived or produced by a deliberately separate validation implementation;
- validation data must include cases not used to develop the production code;
- production helper functions must not calculate both `Expected` and `Actual`;
- independent calculations must show formula, inputs, rounding/tolerance, and result.

### 8.3 Challenge requirement

Each material domain must include at least one **challenge case designed to fail an incorrect but superficially plausible implementation**.

Examples include:

- contribution increases NAV but must not create return;
- high score with unacceptable valuation must not become BUY;
- broken thesis plus falling price must not increase averaging-down aggressiveness;
- stale evidence must not be silently promoted to current;
- current VN30 membership must not leak backward into historical eligibility;
- a 100-share lot constraint must block impossible execution without changing fundamental attractiveness.

### 8.4 Validator override

A prior M6 `PASS`, implementation report, approval note, or dashboard display cannot override contrary M7 evidence.

---

## 9. Evidence Requirements

Every material validation result must be reproducible and attributable.

### 9.1 Minimum evidence package

For each test or validation case, record as applicable:

- validation case ID;
- requirement/rule ID;
- baseline source and exact version/hash;
- implementation commit SHA;
- methodology/config/schema version;
- test-data fixture version/hash;
- decision/as-of timestamp;
- input values and source/availability timestamps;
- expected result and independent derivation;
- actual result;
- difference;
- tolerance and rationale;
- execution command/test identifier;
- output/log/artifact reference;
- PASS/FAIL status;
- issue ID for any divergence;
- reviewer and review timestamp.

### 9.2 Evidence quality levels

- **E3 — Reproducible primary evidence:** frozen input + independent oracle + actual output + version/hash + rerunnable procedure.
- **E2 — Reproducible supporting evidence:** automated test/log with clear assertion and frozen revision, but not an independent oracle by itself.
- **E1 — Documentary evidence:** implementation report, screenshot, review note, or narrative claim.
- **E0 — Assertion only:** no reproducible evidence.

Critical release gates require E3 evidence for material correctness claims. E1/E0 cannot independently support a PASS.

### 9.3 Evidence immutability

Historical and paper validation evidence must be append-only or otherwise tamper-evident. Corrections must preserve prior versions and record reason, author, timestamp, and superseding record.

---

## 10. Status Model and Pass/Fail Criteria

### 10.1 Requirement-level status

Use exactly:

- `PASS`
- `PARTIAL`
- `FAIL`
- `NOT IMPLEMENTED`
- `NOT APPLICABLE`

Definitions:

**PASS** — intended rule is unambiguous, implemented, exercised by adequate evidence, and no material divergence is observed.

**PARTIAL** — some required behavior/evidence exists, but coverage, auditability, temporal integrity, or implementation completeness is insufficient for full PASS.

**FAIL** — implemented or observed behavior contradicts the approved rule, produces materially incorrect output, violates an invariant, or cannot satisfy a required control.

**NOT IMPLEMENTED** — approved in-scope requirement has no executable implementation. This is not equivalent to N/A and may block release according to severity.

**NOT APPLICABLE** — requirement legitimately does not apply to the implementation/release scope, with documented rationale and reviewer approval.

### 10.2 No averaging of failures

Statuses are not numeric scores. Ten PASS results do not offset one Critical FAIL.

### 10.3 Gate-level PASS

A gate may pass only when:

- all Critical requirements are `PASS`;
- no Major issue remains unresolved unless the gate explicitly permits documented limitation and the user explicitly accepts it;
- required evidence quality is met;
- required negative/boundary cases have been executed;
- unresolved Minor issues are documented with no material correctness impact.

`PARTIAL` on a Critical requirement blocks the gate.

---

## 11. Severity Model

Severity is determined by **potential impact**, not by how easy the defect is to fix or whether a favorable historical outcome masked it.

### 11.1 Critical

A defect is Critical if it can reasonably:

- materially misstate cash, quantity, NAV, cost basis, realized/unrealized P&L, or performance;
- create or suppress a materially wrong BUY/ACCUMULATE/REDUCE/SELL action;
- violate Investment Policy or a hard Risk Policy veto;
- introduce look-ahead bias, material data leakage, or future membership leakage;
- destroy decision/audit reconstruction for material recommendations;
- permit leverage/out-of-universe purchase/prohibited averaging down;
- cause silent corruption or silent repair of authoritative production data;
- make validation results non-independent or non-reproducible in a way that invalidates a release gate.

**Disposition:** release blocker. No acceptance-by-default.

### 11.2 Major

A defect is Major if it can materially affect recommendation quality, allocation, risk, score/rank, workflow escalation, temporal correctness, or performance reporting without necessarily corrupting the entire system.

**Disposition:** resolve before release unless explicitly accepted by the user under a documented exception that does not violate a non-waivable policy control. Gate 8 still requires no unresolved Major issues.

### 11.3 Minor

A defect is Minor when it does not materially affect correctness, policy compliance, risk, temporal integrity, or auditability.

**Disposition:** may be backlogged if documented with owner and rationale.

### 11.4 Severity escalation rules

Escalate severity when a defect is:

- silent rather than fail-closed;
- systematic across many securities/dates;
- capable of changing a Decision State;
- capable of bypassing a veto;
- difficult to detect from normal UI;
- capable of contaminating historical validation.

---

## 12. Test-Data Strategy

### 12.1 Test-data classes

M7 shall use four distinct data classes:

1. **Golden deterministic fixtures** — small, hand-calculable portfolios and issuer cases with exact expected outputs.
2. **Synthetic adversarial fixtures** — deliberately constructed boundary, contradiction, missing-data, stale-data, concentration, thesis, valuation, and lot-size cases.
3. **Historical point-in-time datasets** — effective/availability-dated data frozen to a decision timestamp.
4. **Forward paper data** — current information captured prospectively and never rewritten after outcome is known.

### 12.2 Golden Portfolio Fixture

The M6 Golden Portfolio Fixture may be reused as an input fixture only after M7 independently verifies its assumptions and expected outputs. M7 must not assume the M6 expected results are correct merely because M6 tests passed.

For accounting cases, M7 must manually calculate `Expected vs Actual vs Difference` with explicit tolerance.

### 12.3 Fixture isolation

Fixtures used to develop production logic should be labeled `development-known`. M7 must add independent `validator-created` cases for material rules.

### 12.4 Edge-case coverage

Test data must include, where applicable:

- zero and near-zero values;
- threshold ± epsilon;
- exact threshold;
- large VND values;
- non-integer prices/fees where allowed;
- same-day ordering and settlement boundaries;
- duplicate IDs/events;
- missing and stale observations;
- invalid dates and future-dated evidence;
- impossible quantities/prices;
- ticker/security identity mismatch;
- VN30 entry/removal boundaries;
- sector remapping boundaries;
- insufficient cash for one 100-share lot;
- carry-forward cash across months;
- concentration just below/at/above limits;
- score/confidence contradictions;
- valuation deterioration/improvement with unchanged fundamentals;
- thesis `INTACT`, `WEAKENING`, `BROKEN`, and `PENDING` where baseline permits;
- legacy holding behavior;
- no-attractive-opportunity / `HOLD CASH`.

### 12.5 No production-data repair during validation

Invalid production-like data must be rejected, quarantined, or surfaced according to baseline. M7 must not modify source facts merely to make validation proceed.

---

## 13. Numeric Tolerances and Determinism

Tolerance must be explicit per metric and derived from approved numeric/rounding policy.

Default principle:

- authoritative integer quantities/cash postings that are defined as exact must match exactly;
- persisted decimal accounting values must match at the approved scale/rounding convention;
- derived ratios/returns may use a documented numeric tolerance only where exact decimal equality is not the approved contract;
- a tolerance must never hide a wrong formula, sign, transaction classification, or cash-flow timing error.

M7 must test repeatability: identical frozen inputs + identical methodology/config version must produce identical material outputs.

---

## 14. Point-in-Time Requirements

### 14.1 Three-date minimum model

Historical evidence must distinguish at minimum:

- `reporting_period` — period the fact describes;
- `publication_or_availability_timestamp` — when the information became legitimately knowable;
- `decision_timestamp` — when the system made the recommendation.

A fact is eligible only if its approved availability rule is satisfied by the decision timestamp.

### 14.2 Effective-dated reference data

Historical validation must use effective-dated:

- VN30 membership;
- sector mapping where historically variable;
- prices;
- benchmark observations;
- methodology/config versions;
- corporate actions and transaction state.

### 14.3 Prohibited leakage

Historical recommendation inputs must not use:

- future earnings or later filings;
- later restatements unless testing a separately identified corrected-history scenario;
- future VN30 membership;
- future corporate events;
- future prices/returns;
- outcome-derived labels;
- current portfolio state substituted for historical portfolio state;
- current methodology substituted for historical methodology without explicit restatement labeling.

### 14.4 Temporal fail-closed behavior

If availability timing is unknown for a material input, the case cannot be represented as clean point-in-time evidence. It must be excluded, conservatively delayed, or marked with a documented limitation; it must not be silently assumed available.

### 14.5 Temporal leakage tests

M7 must include negative controls that deliberately inject future-dated information and verify that the system rejects or excludes it from the historical decision path.

---

## 15. Historical Validation Limitations

Historical validation is constrained by Vietnamese market data availability, historical VN30 membership records, publication timestamps, corporate-action histories, survivorship-free fundamentals, benchmark methodology, and vendor revision policies.

Therefore:

1. historical performance is secondary to point-in-time decision correctness;
2. incomplete historical membership data must be disclosed rather than replaced with today's VN30 list;
3. uncertain publication timestamps must reduce usable sample size or create a limitation;
4. revised vendor data must not masquerade as originally available data;
5. transaction fees/taxes, board-lot constraints, cash availability, and no-margin rules must be represented according to the frozen simulation specification;
6. no fractional-share assumption may bypass the 100-share lot constraint;
7. regime selection must be pre-specified or justified without reference to strategy outcomes;
8. model changes after observing historical results require a new version and a new unseen validation period where feasible;
9. small samples, incomplete regimes, or imperfect benchmark comparability must be stated explicitly;
10. a favorable backtest cannot override deterministic or policy failures.

Gate 7 may be `PASS WITH DOCUMENTED LIMITATIONS` only when limitations do not invalidate the core point-in-time conclusions and are explicitly enumerated in `MODEL_LIMITATIONS.md` / final report.

---

## 16. Historical Validation Entry Gate

M7.6 must not begin until M7.1–M7.5 deterministic validation has passed its required gates.

Specifically, historical performance simulation is blocked if any unresolved Critical/Major issue can affect:

- accounting/performance;
- data timing;
- scoring/ranking;
- decision state;
- DCA/position sizing/opportunity cost;
- risk controls;
- audit reconstruction.

This prevents a known-wrong engine from generating persuasive but invalid backtest statistics.

---

## 17. Release Gates

| Gate | Domain | Required disposition |
|---|---|---|
| Gate 1 | Baseline Integrity | `PASS` |
| Gate 2 | Accounting | `PASS` |
| Gate 3 | Data Integrity | `PASS` |
| Gate 4 | Scoring | `PASS` |
| Gate 5 | Decision Engine | `PASS` |
| Gate 6 | Portfolio / DCA / Risk | `PASS` |
| Gate 7 | Historical Validation | `PASS` or `PASS WITH DOCUMENTED LIMITATIONS` |
| Gate 8 | Independent Review | No unresolved Critical or Major |

### 17.1 Gate sequencing

- Gates 1–6 are deterministic release prerequisites.
- Gate 7 cannot compensate for Gates 1–6.
- Gate 8 independently reviews both the model and the validation process.
- Paper Portfolio / Forward Validation may begin after its prerequisites are met, but M7 completion still requires the defined final review evidence.

### 17.2 Release states

M7 final release recommendation shall be one of:

- `RELEASE — VALIDATED FOR DECISION SUPPORT`;
- `RELEASE WITH DOCUMENTED LIMITATIONS` — only where permitted and no Critical/Major remains unresolved;
- `DO NOT RELEASE`.

Release does not authorize automated trading and does not guarantee investment returns.

---

## 18. M7 Deliverable Map

The planned structure is retained:

```text
07_VALIDATION/
├── VALIDATION_STRATEGY.md
├── TRACEABILITY_MATRIX.md
├── ACCOUNTING_VALIDATION.md
├── DATA_VALIDATION.md
├── SCORING_VALIDATION.md
├── DECISION_ENGINE_VALIDATION.md
├── PORTFOLIO_DCA_VALIDATION.md
├── RISK_VALIDATION.md
├── HISTORICAL_VALIDATION_PLAN.md
├── HISTORICAL_RESULTS.md
├── PAPER_PORTFOLIO_PLAN.md
├── MODEL_LIMITATIONS.md
└── FINAL_VALIDATION_REPORT.md
```

Additional machine-readable evidence/manifests may be stored under a validation evidence subdirectory without changing document ownership.

Recommended supporting artifacts:

- `BASELINE_MANIFEST.json` or equivalent;
- test fixture manifests;
- expected/actual comparison outputs;
- command logs;
- source/hash manifests;
- issue register;
- point-in-time dataset manifest.

These are evidence artifacts, not new investment-policy owners.

---

## 19. M7.1 Baseline Integrity Audit Contract

After this strategy is approved, `TRACEABILITY_MATRIX.md` shall be the next M7 artifact.

It must map at minimum:

| Requirement | Source | Implementation | Test/Evidence | Status |
|---|---|---|---|---|

The matrix must cover at least:

- Investment Policy;
- Risk Policy;
- Data Rules;
- accounting ownership/invariants;
- scoring rules;
- sector normalization;
- ranking rules;
- Buy rules;
- Sell rules;
- DCA rules;
- position sizing;
- opportunity cost;
- portfolio workflows;
- audit/journal requirements;
- temporal/as-of controls relevant to M6 implementation.

Undocumented implementation behavior that changes an investment decision, score, ranking, risk state, accounting state, or workflow state is not an acceptable investment rule. It must be removed, documented as non-investment plumbing, or submitted as an explicit change proposal to the proper owner.

---

## 20. Required Invariants to Seed Later Validation

The exact invariant catalog will be traced to baseline sources, but M7 strategy requires at least the following classes:

### Accounting invariants

- external contribution changes capital/NAV but does not create investment return;
- ledger reconstruction and persisted derived state reconcile;
- no transaction is double-counted;
- reversal/correction preserves audit history;
- cash cannot be invented by a derived view.

### Scoring invariants

- unchanged non-price fundamentals must not change Business Quality solely because market price changes;
- total score must equal approved component aggregation;
- missing data follows baseline missing-data/confidence behavior;
- sector normalization cannot use a structurally inappropriate metric as if sectors were economically identical.

### Decision invariants

- high score alone cannot authorize purchase;
- worsening valuation with all else equal cannot improve purchase attractiveness;
- `INTACT → BROKEN` thesis cannot make averaging down more aggressive;
- +20% profit cannot alone force SELL;
- hard risk veto cannot be overridden by ranking, technical signals, or DCA cadence;
- insufficient executable cash/lot feasibility cannot create an executable BUY;
- no eligible opportunity permits `HOLD CASH`.

### Temporal invariants

- future-dated evidence cannot alter an earlier decision;
- later VN30 membership cannot create earlier eligibility;
- later methodology cannot silently rewrite an as-calculated historical decision.

These examples are mandatory only where consistent with the exact approved baseline; the traceability phase must replace any generic wording with the owning rule's precise semantics.

---

## 21. Validation Change Control

When validation identifies a weakness:

1. open an issue with severity and affected gates;
2. identify whether the defect is implementation, documentation ambiguity, data, test/oracle, or model-design weakness;
3. do not silently modify approved baseline;
4. if implementation is wrong, remediate implementation and rerun affected validation plus regression scope;
5. if baseline is ambiguous/weak, create a separately approved change proposal;
6. if the model changes, increment methodology/version as required;
7. preserve pre-change evidence;
8. where historical results informed the change, treat the modified model as exposed to that history and prefer a new unseen period for subsequent validation.

---

## 22. Anti-Backtest-Gaming Controls

M7 explicitly prohibits:

- changing score weights because historical returns disappoint;
- reducing risk limits to increase CAGR;
- choosing only favorable periods or securities;
- deleting failed cases;
- retroactively changing old recommendations after outcomes are known;
- selecting trades using future return rankings;
- forcing monthly deployment;
- optimizing transaction timing with unavailable future prices;
- repeatedly tuning on the same historical window without versioning and out-of-sample discipline.

Any such behavior is a validation-process defect and may itself be Major or Critical depending on impact.

---

## 23. Review Findings and Remediation — Draft v0.1

### 23.1 CIO review

**Finding:** Historical return could become an implicit success criterion and pressure model tuning.  
**Severity before fix:** Major.  
**Fix:** Explicitly subordinated performance to deterministic correctness and prohibited outcome-driven tuning. Historical results cannot compensate for Gates 1–6.  
**Status:** Resolved.

**Finding:** `HOLD CASH` and `NO ACTION` could be misclassified as validation failure because no trade occurred.  
**Severity before fix:** Major.  
**Fix:** Defined cash/no-action as legitimate expected outcomes and required DCA/workflow validation to preserve them.  
**Status:** Resolved.

### 23.2 Independent Model Validator review

**Finding:** Existing M6 test evidence could create circular validation if reused as the M7 oracle.  
**Severity before fix:** Critical.  
**Fix:** Existing tests are prior evidence only; material M7 cases require independent expected results and validator-created challenge cases.  
**Status:** Resolved.

**Finding:** Approval/status metadata may be inconsistent across stored artifacts, risking validation against the wrong baseline.  
**Severity before fix:** Major.  
**Fix:** Added Baseline Manifest with approval evidence and hashes; embedded status text alone cannot establish authority.  
**Status:** Resolved.

**Finding:** A validator could still “pass” ambiguous rules by choosing a convenient interpretation.  
**Severity before fix:** Major.  
**Fix:** Ambiguous approved intent cannot receive PASS until governance ambiguity is resolved or explicitly accepted at the proper level.  
**Status:** Resolved.

### 23.3 Quantitative Analyst review

**Finding:** Historical validation could leak revised fundamentals or current constituents.  
**Severity before fix:** Critical.  
**Fix:** Added reporting/publication/decision timestamps, effective-dated membership, leakage negative controls, and survivorship limitations.  
**Status:** Resolved.

**Finding:** Threshold and monotonicity defects may evade example tests.  
**Severity before fix:** Major.  
**Fix:** Required threshold ± epsilon, metamorphic/invariant, monotonicity, and targeted mutation/equivalent tests.  
**Status:** Resolved.

### 23.4 Financial Systems Engineer review

**Finding:** Numeric tolerance could hide accounting defects.  
**Severity before fix:** Major.  
**Fix:** Tolerance must derive from approved numeric policy; exact values remain exact where required; tolerance cannot hide formula/sign/timing errors.  
**Status:** Resolved.

**Finding:** Expected and actual values could share production helpers and therefore fail identically.  
**Severity before fix:** Critical.  
**Fix:** Independent oracle separation is mandatory for material accounting/scoring/decision cases.  
**Status:** Resolved.

### 23.5 Risk Manager review

**Finding:** Large numbers of passing tests could obscure a single policy-veto failure.  
**Severity before fix:** Critical.  
**Fix:** No averaging of statuses; one Critical FAIL blocks the gate/release.  
**Status:** Resolved.

**Finding:** Silent failure is more dangerous than fail-closed behavior but was not severity-sensitive.  
**Severity before fix:** Major.  
**Fix:** Added severity escalation for silent/systematic/veto-bypassing defects.  
**Status:** Resolved.

### 23.6 QA Lead review

**Finding:** Test evidence lacked a minimum reproducibility contract.  
**Severity before fix:** Major.  
**Fix:** Added E0–E3 evidence levels and mandatory version/hash/input/oracle/actual/tolerance/log metadata.  
**Status:** Resolved.

**Finding:** Historical testing might start while deterministic defects remain open.  
**Severity before fix:** Critical.  
**Fix:** Added explicit M7.6 entry gate blocking historical validation until M7.1–M7.5 pass.  
**Status:** Resolved.

---

## 24. Review Outcome

After the CIO, Independent Model Validator, Quantitative Analyst, Financial Systems Engineer, Risk Manager, and QA Lead review/fix cycle:

- **Unresolved Critical issues:** 0
- **Unresolved Major issues:** 0
- **Known Minor issues:** none required for strategy approval at this stage
- **Validation independence assessment:** sufficient to reject the model/implementation if material evidence contradicts the approved baseline
- **Recommended status:** **READY FOR USER APPROVAL as M7 Validation Strategy baseline candidate**

This assessment approves only the validation strategy draft for user review. It does **not** pass Gate 1 and does **not** authorize work on `TRACEABILITY_MATRIX.md` before explicit user approval.

---

## 25. Approval Gate

Current state:

> `VALIDATION_STRATEGY.md` v0.1 — Draft for Approval

On explicit user approval, promote this file to:

> `VALIDATION_STRATEGY.md` — Approved Baseline v1.0

Only then proceed to:

> `07_VALIDATION/TRACEABILITY_MATRIX.md`

No M7.2+ validation work and no historical performance validation is authorized by this document alone.
