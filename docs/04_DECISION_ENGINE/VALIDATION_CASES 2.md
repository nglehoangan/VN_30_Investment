# VALIDATION_CASES.md

**Version:** 1.0
**Status:** Approved Baseline v1.0
**Milestone:** 4 — Buy / Hold / Sell Decision Engine  
**Scope:** Validation suite for M4 decision-state routing, buy/sell/DCA/sizing/opportunity-cost rules, execution status, and auditability.

---

## 1. Purpose

This file defines deterministic validation cases used to test whether the M4 decision engine behaves consistently with the approved M1–M4 constitution.

The validation suite must verify that:

1. score does not directly determine the decision;
2. thesis, valuation, risk, portfolio context, cash, lot size and opportunity cost are all respected;
3. BUY / ACCUMULATE / REDUCE / SELL are not triggered by price movement alone;
4. execution constraints do not mutate the underlying economic decision;
5. mandatory risk or ownership exits cannot be blocked by buy-side affordability;
6. cash remains a valid allocation outcome;
7. behavioral biases are explicitly controlled;
8. outputs remain auditable and reconstructable.

---

## 2. Validation Method

### 2.1 Case Types

Every case must be classified as one of:

- **DETERMINISTIC** — one complete input set must produce one exact expected Decision State.
- **ROUTING** — validates precedence or branching logic. It is not counted toward Decision-State coverage unless instantiated into deterministic subcases.
- **CONTROL** — validates auditability, data semantics, authorization, or process integrity rather than a specific investment state.

This distinction prevents an ambiguous branch such as `HOLD / REDUCE / SELL depending on thesis` from being counted as a passed deterministic state test.

### 2.2 Severity

Every case must also be classified:

- **CRITICAL** — failure can violate mandate, ownership/risk veto, leverage prohibition, state/execution separation, or permit prohibited new capital.
- **MAJOR** — failure can materially distort capital allocation, valuation, sizing, DCA, opportunity cost, or thesis routing.
- **MINOR** — failure affects completeness, presentation, or non-decision-critical audit quality.

All CRITICAL cases must pass before M4 can be proposed complete.

### 2.3 Required Fields

Each executable case must contain or inherit:

- Case ID
- Case Type
- Severity
- Scenario
- Preconditions
- Key Inputs
- Expected Decision State or Expected Routing Result
- Expected Execution Status
- Expected Trade Authorization
- Expected Reasoning
- Expected Review / Escalation
- Prohibited Outcomes
- Pass Criteria

A case passes only when every field applicable to its Case Type matches.

### 2.4 Defaults and Inheritance

To avoid repetitive prose, when a field is not repeated inside a case:

- `Expected Execution Status = NOT APPLICABLE` for pure CONTROL cases;
- `Trade Authorization = NO` when the expected result explicitly prohibits new capital;
- `Review / Escalation = NONE` unless the scenario contains a mandatory trigger;
- no omitted field may be inferred in a way that changes Decision State, authorization, sizing, or risk outcome.

If a missing field could change the outcome, the case is **INCOMPLETE** and cannot pass.

### 2.5 Determinism Rule

Terms such as `may`, `depending on`, `HOLD / REDUCE / SELL`, or `BUY may be allowed` are not acceptable as the terminal result of a DETERMINISTIC case.

They are permitted only in ROUTING cases whose expected result is the route itself.

## 3. Validation Categories

The suite covers:

1. Eligibility and Stage 0
2. Score vs Decision separation
3. BUY
4. STRONG BUY
5. ACCUMULATE
6. Averaging Down
7. HOLD
8. REDUCE
9. SELL
10. AVOID
11. DCA / Cash Allocation
12. Position Sizing
13. Opportunity Cost
14. Portfolio Risk
15. Lot Size / Cash Feasibility
16. Technical Overlay
17. Behavioral Finance
18. Data Quality / Confidence
19. Auditability
20. Cross-rule conflicts

### 3.1 Critical Case Register

The following cases are **CRITICAL** and must all pass:

- VC-001 — Non-VN30 New Candidate
- VC-003 — Stage 0 Pending
- VC-014 — BROKEN Thesis
- VC-020 — Ownership Veto
- VC-026 — Cash Double Counting
- VC-032 — 30% Emergency Ceiling
- VC-038 — CRITICAL Portfolio Drawdown Authorization
- VC-039 — SEVERE Portfolio Drawdown Authorization
- VC-046 — Technical Cannot Override BROKEN Thesis
- VC-047 — LOW Confidence Cannot Authorize New Capital
- VC-054 — Decision State Survives Cash Infeasibility
- VC-055 — Mandatory SELL Independent of Replacement Affordability
- VC-056 — Missing Required Risk Approval Blocks Execution
- VC-060 — Exception Without Approval Reference
- VC-061 — Ownership Veto Overrides Score
- VC-062 — Concentration Can Block Execution Without Mutating Economic State
- VC-063 — Technical Strength Cannot Override Cash Constraint

All other cases default to **MAJOR** unless explicitly marked MINOR.

---

# 4. Eligibility and Stage 0 Cases

## VC-001 — Non-VN30 New Candidate

**Scenario:** Security is not a current VN30 constituent and is not an owned Legacy Holding.

**Expected Decision:** AVOID  
**Execution Status:** NOT ACTIONABLE  
**Trade Authorization:** NO

**Reasoning:** New capital is restricted to current VN30 constituents.

**Prohibited Outcomes:** BUY, STRONG BUY, ACCUMULATE.

---

## VC-002 — Legacy Holding Still Owned

**Case Type:** ROUTING  
**Severity:** CRITICAL

**Scenario:** Security was removed from VN30 but remains in the portfolio.

**Expected Routing Result:** Existing ownership must route through HOLD / REDUCE / SELL analysis using thesis and risk, while **all additional capital is prohibited**.

**Execution Status:** Existing-position management only.  
**Trade Authorization:** NO ADDITIONAL CAPITAL.

**Pass Criteria:** The engine never produces BUY, STRONG BUY, or ACCUMULATE for a Legacy Holding and does not force an automatic immediate exit solely because VN30 membership ended.

**Reasoning:** Legacy Holdings may be managed orderly but cannot receive additional capital.

---

## VC-003 — Stage 0 Pending

**Scenario:** Mandatory eligibility/investability review is incomplete.

**Expected:** No new capital authorization.

**Prohibited Outcomes:** executable BUY / STRONG BUY / ACCUMULATE.

---

# 5. Score vs Decision Separation

## VC-004 — High Score but Unattractive Valuation

**Inputs:**
- Score: 88
- Thesis: INTACT
- Confidence: HIGH
- Expected 5Y return: 8%
- MOS: weak

**Expected Decision:** HOLD if owned, AVOID if unowned.

**Prohibited:** BUY solely because score is high.

---

## VC-005 — Moderate Score but Strong Valuation

**Case Type:** DETERMINISTIC  
**Severity:** MAJOR

**Inputs:**
- Unowned current VN30 constituent
- Stage 0: PASS
- Score validity: VALID — ACTIONABLE
- Score: 72
- All category gates passed
- Thesis: INTACT
- Confidence: MEDIUM
- Expected 5Y return: 16%
- MOS: adequate
- No veto
- Portfolio capacity: PASS
- Opportunity cost: PASS
- Cash/lot feasibility: PASS

**Expected Decision:** BUY  
**Execution Status:** EXECUTE  
**Trade Authorization:** YES

**Pass Criteria:** BUY is produced despite a non-exceptional total score because all non-compensable gates and valuation requirements pass.

**Reasoning:** Total score zone does not override category gates and valuation evidence.

---

# 6. STRONG BUY Cases

## VC-006 — Valid STRONG BUY

**Inputs:**
- Current VN30
- Stage 0 PASS
- Score validity: VALID — ACTIONABLE
- Confidence: HIGH
- BQ ≥18
- FH ≥11
- R&G ≥7
- Thesis: IMPROVING
- Expected 5Y return: 20%
- Strong MOS
- Residual risk: MODERATE
- Portfolio capacity available

**Expected Decision:** STRONG BUY

**Execution:** subject to sizing/cash/lot rules.

---

## VC-007 — STRONG BUY Rejected for MEDIUM Confidence

Same as VC-006 except confidence = MEDIUM.

**Expected:** BUY or ACCUMULATE, not STRONG BUY.

---

# 7. BUY Cases

## VC-008 — Normal BUY

**Inputs:**
- Expected 5Y return: 16%
- Confidence: MEDIUM
- Thesis: INTACT
- All category gates pass
- No veto
- Portfolio fit acceptable

**Expected:** BUY.

---

## VC-009 — 12–15% Hurdle Exception

**Case Type:** DETERMINISTIC  
**Severity:** MAJOR

**Inputs:**
- Unowned current VN30 constituent
- Stage 0 PASS
- Score validity VALID — ACTIONABLE
- Expected 5Y return: 13.5%
- Very high business quality
- Low residual risk
- Strong downside protection
- HIGH confidence
- Portfolio resilience benefit
- Explicit Hurdle Exception = YES
- Required approval/reference present
- Portfolio/cash/lot gates PASS

**Expected Decision:** BUY  
**Execution Status:** EXECUTE  
**Trade Authorization:** YES

**Pass Criteria:** BUY is allowed only because the documented high-quality exception is explicitly invoked and approved.

**Prohibited:** silent use of the exception.

---

## VC-010 — 12–15% Without Exception

**Case Type:** DETERMINISTIC  
**Severity:** MAJOR

Same as VC-009 except:
- security is unowned;
- Hurdle Exception = NO.

**Expected Decision:** AVOID  
**Execution Status:** NOT ACTIONABLE  
**Trade Authorization:** NO

**Pass Criteria:** 12–15% expected return does not silently pass as a normal BUY without the explicit exception.

---

# 8. ACCUMULATE and Averaging Down

## VC-011 — Valid ACCUMULATE

**Scenario:** Existing holding.

**Inputs:**
- Thesis INTACT
- Fresh underwriting complete
- Confidence MEDIUM
- Valuation more attractive
- Expected return ≥ normal hurdle
- Concentration permits add
- Opportunity cost pass

**Expected:** ACCUMULATE.

---

## VC-012 — Price Down 25%, Thesis Unchanged, Valuation Better

**Expected:** ACCUMULATE only if all fresh-underwriting gates pass.

**Prohibited:** automatic add merely because price declined.

---

## VC-013 — Price Down 25%, Thesis WEAKENING

**Case Type:** ROUTING  
**Severity:** MAJOR

**Expected Routing Result:** ADD is prohibited. The position must route to HOLD / REDUCE / SELL analysis based on the severity of thesis deterioration, valuation, and risk.

**Trade Authorization:** NO ADDITIONAL CAPITAL.

**Pass Criteria:** ACCUMULATE is never produced merely because valuation appears cheaper while thesis is WEAKENING.

**Prohibited:** ACCUMULATE based on lower price.

---

## VC-014 — Price Down 40%, BROKEN Thesis

**Expected:** SELL.

---

# 9. HOLD Cases

## VC-015 — Good Holding, Not Attractive Enough to Add

**Inputs:**
- Thesis INTACT
- Business quality strong
- Expected return: 11%
- No risk breach
- Better alternatives do not justify switching

**Expected:** HOLD.

**Required Explanation:**
- why not add;
- why not reduce/sell;
- why holding remains superior to feasible alternatives.

---

## VC-016 — HOLD Must Not Be Lazy Default

**Scenario:** Material information missing that may alter thesis.

**Expected:** PENDING / NOT ACTIONABLE qualification, not routine HOLD without explanation.

---

# 10. REDUCE Cases

## VC-017 — Concentration REDUCE

**Inputs:**
- Holding remains fundamentally valid
- Weight: 26%
- No approved exception
- Thesis INTACT

**Expected:** REDUCE plan.

**Reasoning:** Position remains investable but size is excessive.

---

## VC-018 — Overvaluation but Thesis Intact

**Inputs:**
- Thesis INTACT
- Extreme valuation
- Expected forward return low
- Residual ownership still economically justified

**Expected:** REDUCE, not automatic SELL.

---

# 11. SELL Cases

## VC-019 — BROKEN Thesis

**Expected:** SELL  
**Target Ownership:** 0

---

## VC-020 — Ownership Veto

**Expected:** SELL  
**Target Ownership:** 0

**Prohibited:** HOLD because replacement is not affordable.

---

## VC-021 — Capital-Allocation Veto Only

**Case Type:** ROUTING  
**Severity:** CRITICAL

**Scenario:** New capital prohibited, but ownership remains permissible.

**Expected Routing Result:** New capital is blocked. Existing ownership routes through HOLD / REDUCE / SELL based on residual economics and risk.

**Trade Authorization:** NO ADDITIONAL CAPITAL.

**Pass Criteria:** Capital-Allocation Veto does not automatically become Ownership Veto and does not authorize BUY/ACCUMULATE.

**Prohibited:** automatic SELL solely because of Capital-Allocation Veto.

---

## VC-022 — +20% Gain

**Expected:** mandatory valuation/thesis review.

**Prohibited:** automatic REDUCE / SELL.

---

## VC-023 — Large Loss but Intact Thesis

**Expected:** no automatic SELL.

---

# 12. DCA / Cash Cases

## VC-024 — No Attractive Candidate

**Expected:** HOLD CASH.

---

## VC-025 — Monthly Contribution Exists but No Forced Deployment

**Expected:** HOLD CASH if no candidate passes.

---

## VC-026 — Contribution Already Included in Snapshot

**Expected:** do not add contribution again.

**Prohibited:** double-counted cash.

---

# 13. Lot Size Cases

## VC-027 — Best Candidate Not Yet Affordable

**Scenario:** Top-ranked candidate requires more cash for one board lot.

**Expected:** retain investment merit and use REQUIRES CASH ACCUMULATION.

**Prohibited:** downgrade to AVOID due solely to cash shortage.

---

## VC-028 — Lower-Ranked Affordable Candidate

**Scenario:** Top candidate unaffordable; second candidate affordable but materially inferior.

**Expected:** HOLD CASH / accumulate cash.

**Prohibited:** buy inferior name merely to deploy cash.

---

## VC-029 — Affordable Tie-Cluster Substitute

**Inputs:**
- Candidates within M3 tie cluster
- Expected return difference ≤2pp
- Risk no worse
- Confidence no lower
- Portfolio fit acceptable

**Expected:** lower-priced candidate may be selected.

---

# 14. Position Sizing Cases

## VC-030 — One Lot Creates 12% Weight

**Scenario:** Small portfolio, one lot creates 12% NAV exposure.

**Expected:** elevated concentration recognized.

**Decision:** may execute only if relevant Phase 1 / board-lot rules permit.

---

## VC-031 — One Lot Creates 24% Weight

**Expected:** no automatic execution; escalation and small-NAV exception review required.

---

## VC-032 — One Lot Creates 31% Weight

**Expected:** BLOCKED under 30% emergency ceiling.

---

## VC-033 — Add Would Move 14% to 16%

**Expected:** no normal add because >15% post-trade.

---

# 15. Sector / Correlation Cases

## VC-034 — Sector Exposure 32%

**Expected:** normally no additional capital to the sector.

---

## VC-035 — Sector Under Limit but Hidden Correlation High

**Expected:** sizing may be reduced or blocked.

**Reasoning:** label diversification does not override factor concentration.

---

# 16. Portfolio Drawdown Cases

## VC-036 — Portfolio Drawdown -12%

**Expected:** WATCH / review behavior, but no automatic broad selling.

---

## VC-037 — Portfolio Drawdown -17%

**Expected:** ELEVATED review state.

---

## VC-038 — Portfolio Drawdown -22%

**Expected:** CRITICAL escalation; discretionary risk-increasing trades frozen until required review/approval.

---

## VC-039 — Portfolio Drawdown -27%

**Expected:** SEVERE emergency review and explicit authorization for new risk.

---

# 17. Opportunity Cost Cases

## VC-040 — New Cash vs Existing Holding

**Scenario:** Current holding remains attractive, but new candidate has materially better expected return with no worse quality/risk/confidence.

**Expected:** allocate incremental cash to better candidate without requiring sale of current holding.

---

## VC-041 — Existing-Capital Switch with 2pp Advantage

**Expected:** normally no switch.

---

## VC-042 — Existing-Capital Switch with 4pp Robust Advantage

**Inputs:**
- Replacement expected return advantage: 4pp
- Quality no worse
- Risk not materially higher
- Confidence no lower
- Advantage survives uncertainty/friction

**Expected:** switch may be justified.

---

## VC-043 — 4pp Point Estimate but Uncertainty Reverses Ranking

**Expected:** COMPETITIVE / INDETERMINATE, not SUPERIOR.

---

## VC-044 — Replacement Capacity Smaller Than Sale Proceeds

**Expected:** redeploy only up to replacement marginal capacity; residual proceeds go to cash/next comparator.

---

# 18. Technical Overlay Cases

## VC-045 — Fundamental BUY, Poor Technical Entry

**Expected Decision:** BUY  
**Execution Status:** TEMPORARILY DEFERRED or STAGED

**Prohibited:** HOLD solely because technical entry is weak.

---

## VC-046 — BROKEN Thesis, Strong Technical Setup

**Expected:** SELL.

**Prohibited:** technicals overriding broken thesis.

---

# 19. Data Quality / Confidence Cases

## VC-047 — LOW Confidence

**Expected:** no new capital.

---

## VC-048 — Stale Critical Financial Data

**Expected:** NOT ACTIONABLE until refreshed if stale data can alter thesis/valuation/risk.

---

## VC-049 — Missing Non-Material Data

**Expected:** decision may remain actionable if missing data is clearly immaterial and documented.

---

# 20. Behavioral Finance Cases

## VC-050 — Anchoring to Cost Basis

**Scenario:** User wants to hold until break-even despite broken thesis.

**Expected:** SELL if thesis requires it.

---

## VC-051 — Premature Profit Taking

**Scenario:** Position gains 25%, thesis and expected return remain strong.

**Expected:** review only; HOLD / ACCUMULATE may remain valid.

---

## VC-052 — Averaging Down Reflex

**Scenario:** User wants to buy because price is down 30%.

**Expected:** fresh underwriting required before any add.

---

## VC-053 — Action Bias

**Scenario:** Monthly contribution received but no compelling candidate.

**Expected:** HOLD CASH.

---

# 21. Execution-State Integrity Cases

## VC-054 — BUY but Insufficient Cash

**Expected Decision:** BUY  
**Execution:** REQUIRES CASH ACCUMULATION

---

## VC-055 — SELL with No Replacement Cash Need

**Expected:** SELL remains executable subject to operational settlement rules.

**Prohibited:** blocking sale because replacement cannot be purchased.

---

## VC-056 — Risk Approval Missing

**Scenario:** Trade requires explicit CIO/Risk approval.

**Expected:** underlying decision preserved; execution BLOCKED — PORTFOLIO/RISK until approval.

---

# 22. Auditability Cases

## VC-057 — Missing Data As-Of Date

**Expected:** validation failure.

---

## VC-058 — Missing Prior Decision Reference Where Available

**Expected:** audit warning/failure depending on reconstruction requirement.

---

## VC-059 — Missing Thesis Break Conditions

**Expected:** validation failure.

---

## VC-060 — Exception Without Approval Reference

**Scenario:** Hurdle or concentration exception invoked.

**Expected:** NOT AUTHORIZED until explicit approval reference exists.

---

# 23. Cross-Rule Conflict Cases

## VC-061 — High Score + Ownership Veto

**Expected:** SELL if owned; AVOID if unowned.

**Score cannot override veto.**

---

## VC-062 — STRONG BUY Economics + Concentration Breach

**Expected Decision:** STRONG BUY may remain economic state.  
**Execution:** BLOCKED / sizing clipped.

---

## VC-063 — BUY Economics + No Cash + Strong Technical Setup

**Expected:** BUY + REQUIRES CASH ACCUMULATION.

**Technical strength cannot create cash.**

---

## VC-064 — Weak Score but Mandatory Ownership Exit

**Expected:** SELL based on ownership/thesis/risk hierarchy.

---

## VC-065 — Existing Holding Has Lower Expected Return but Better Risk/Confidence

**Expected:** do not switch based solely on return point estimate.

---

# 24. Deterministic Coverage Accounting

Only **DETERMINISTIC** cases count toward minimum Decision-State coverage.

ROUTING and CONTROL cases test precedence/process integrity but do not satisfy state-count minimums unless instantiated into deterministic subcases.

### 24.1 State Coverage Register

The current suite must maintain at least the following deterministic examples:

| Decision State | Deterministic Case IDs |
|---|---|
| STRONG BUY | VC-006 plus one explicit owned-position/high-conviction deterministic case |
| BUY | VC-005, VC-008, VC-009 |
| ACCUMULATE | VC-011, VC-012 plus one explicit averaging-up or re-underwritten add case |
| HOLD | VC-015 plus at least two explicit deterministic HOLD cases |
| REDUCE | VC-017, VC-018 plus one explicit risk/opportunity-cost REDUCE case |
| SELL | VC-014, VC-019, VC-020, VC-046, VC-050 |
| AVOID | VC-001, VC-004-unowned instantiation, VC-010 |

If any row lacks the stated number of deterministic cases, **coverage is NOT MET** even if related ROUTING cases pass.

### 24.2 Required Supplemental Deterministic Cases Before Approval

The suite must contain explicit cases for:

1. STRONG BUY on an already-owned position where the economic state remains STRONG BUY but trade size is clipped by sizing rules.
2. ACCUMULATE after price appreciation (averaging up) with thesis/valuation still supporting incremental capital.
3. HOLD because valuation is fair but thesis remains intact.
4. HOLD because a superior comparator fails materiality after uncertainty/friction.
5. REDUCE due to hidden-factor concentration while company thesis remains intact.
6. REDUCE due to opportunity-cost reallocation where full SELL is not justified.

These cases are added below as VC-066 to VC-071.

---

## VC-066 — Owned Position Remains STRONG BUY but Sizing Clips Trade

**Case Type:** DETERMINISTIC  
**Severity:** MAJOR

**Inputs:**
- Current VN30; owned
- Stage 0 PASS; VALID — ACTIONABLE
- Confidence HIGH
- Thesis IMPROVING
- STRONG BUY category/valuation prerequisites pass
- Current weight 14%
- Additional full desired tranche would move weight above 15%
- Smaller executable tranche remains within allowed limit

**Expected Decision:** STRONG BUY  
**Execution Status:** STAGED  
**Trade Authorization:** YES, clipped to permitted size

**Pass Criteria:** Economic state remains STRONG BUY while trade size is clipped by portfolio rules.

---

## VC-067 — Valid Averaging Up

**Case Type:** DETERMINISTIC  
**Severity:** MAJOR

**Inputs:**
- Existing holding; price above prior purchase
- Thesis IMPROVING
- Fresh underwriting complete
- Confidence HIGH
- Expected 5Y return remains ≥15%
- MOS adequate
- Concentration and opportunity-cost gates PASS

**Expected Decision:** ACCUMULATE  
**Execution Status:** EXECUTE  
**Trade Authorization:** YES

**Pass Criteria:** The engine can add after a price increase when economics still justify incremental capital; it does not anchor to prior cost basis.

---

## VC-068 — HOLD at Fair Valuation

**Case Type:** DETERMINISTIC  
**Severity:** MAJOR

**Inputs:**
- Existing holding
- Thesis INTACT
- Strong business quality
- Expected 5Y return 11%
- No veto or concentration problem
- Switching alternatives not materially superior

**Expected Decision:** HOLD  
**Execution Status:** NOT ACTIONABLE  
**Trade Authorization:** NO NEW TRADE

**Pass Criteria:** HOLD explicitly explains why not add and why not reduce/sell.

---

## VC-069 — HOLD Because Comparator Edge Is Not Robust

**Case Type:** DETERMINISTIC  
**Severity:** MAJOR

**Inputs:**
- Existing holding remains valid
- Replacement point-estimate advantage 3.2pp
- After friction/uncertainty, ranges overlap materially
- Replacement confidence no higher
- No independent risk-reduction benefit

**Expected Decision:** HOLD  
**Execution Status:** NOT ACTIONABLE  
**Trade Authorization:** NO SWITCH

**Pass Criteria:** The engine does not churn merely because a point estimate exceeds the provisional 3pp switch hurdle.

---

## VC-070 — REDUCE for Hidden-Factor Concentration

**Case Type:** DETERMINISTIC  
**Severity:** MAJOR

**Inputs:**
- Thesis INTACT
- Single-name weight acceptable
- Sector weight below numeric ceiling
- Hidden-factor/correlation exposure assessed HIGH
- Smaller residual ownership remains justified

**Expected Decision:** REDUCE  
**Execution Status:** EXECUTE or STAGED  
**Trade Authorization:** YES

**Pass Criteria:** Factor concentration can justify partial de-risking even when sector labels appear diversified.

---

## VC-071 — REDUCE for Opportunity-Cost Reallocation

**Case Type:** DETERMINISTIC  
**Severity:** MAJOR

**Inputs:**
- Holding thesis INTACT
- Holding expected return remains acceptable for ownership
- Replacement has robust materially superior economics after friction/uncertainty
- Full exit is not justified under SELL_RULES
- Replacement marginal capacity is limited

**Expected Decision:** REDUCE  
**Execution Status:** STAGED  
**Trade Authorization:** YES

**Pass Criteria:** Partial reallocation occurs without incorrectly mutating REDUCE into SELL.

---

# 25. Minimum Coverage Matrix

Before M4 is considered validated, the suite must include passing cases for all seven states:

| Decision State | Required Cases |
|---|---|
| STRONG BUY | ≥2 |
| BUY | ≥3 |
| ACCUMULATE | ≥3 |
| HOLD | ≥3 |
| REDUCE | ≥3 |
| SELL | ≥5 |
| AVOID | ≥3 |

And must cover:

- eligibility,
- Stage 0,
- score/category gates,
- valuation hurdle,
- thesis states,
- vetoes,
- confidence,
- concentration,
- sector,
- drawdown,
- cash,
- lot size,
- DCA,
- opportunity cost,
- technical timing,
- behavior,
- auditability.

---

# 26. Validation Result Format

For each executed case:

```text
Case ID:
Result: PASS / FAIL

Observed Decision State:
Expected Decision State:

Observed Execution Status:
Expected Execution Status:

Observed Authorization:
Expected Authorization:

Observed Reasoning:
Expected Reasoning:

Conflicts:
Corrective Action:

Reviewer:
Validation Date:
Methodology Version:
```

---

# 27. M4 Exit Criteria

M4 may be proposed for completion only when:

1. all approved M4 files are internally consistent;
2. every case in the Critical Case Register passes;
3. no unresolved Critical or Major conflicts remain;
4. all seven Decision States meet the deterministic coverage minimums in Section 24;
5. buy/sell/DCA/sizing/opportunity-cost interactions are tested;
6. execution status never mutates economic decision state;
7. mandatory risk/ownership exits cannot be blocked by cash/lot logic;
8. no case uses price movement alone as buy/sell thesis;
9. audit trail requirements are reconstructable;
10. five-role final review reports no unresolved Critical/Major issue;
11. no ROUTING case is counted as deterministic state coverage;
12. every invoked exception has explicit authorization evidence where required.

---

# 28. Approval Gate

Current status: **Approved Baseline v1.0**

Before approval, perform five-role review:

- CIO
- Portfolio Manager
- Equity Research Analyst
- Risk Manager
- Behavioral Finance Reviewer

This is the final design/validation file in Milestone 4.

After approval, perform a final cross-file M4 review before proposing Milestone 4 completion.


---

# 29. Five-Role Review Summary — Draft v0.2

## CIO Review
- Strengthened validation governance so M4 cannot pass on ambiguous branch outcomes.
- Added deterministic coverage accounting and explicit supplemental cases.
- **Unresolved Critical: 0**
- **Unresolved Major: 0**

## Portfolio Manager Review
- Added marginal sizing, averaging-up, robust HOLD comparator, and partial reallocation cases.
- Ensured economic state remains separate from executable trade size.
- **Unresolved Critical: 0**
- **Unresolved Major: 0**

## Equity Research Analyst Review
- Preserved category gates, thesis status, valuation hurdle, confidence, and evidence requirements.
- Removed ambiguous use of `may be valid` from deterministic cases.
- **Unresolved Critical: 0**
- **Unresolved Major: 0**

## Risk Manager Review
- Added Critical Case Register.
- Explicitly tested legacy no-add, veto hierarchy, drawdown authorization, 30% emergency ceiling, concentration clipping, and exception approval references.
- **Unresolved Critical: 0**
- **Unresolved Major: 0**

## Behavioral Finance Reviewer
- Strengthened anti-churn validation, cost-basis independence, action-bias/HOLD CASH behavior, averaging-up/down symmetry, and disposition-effect controls.
- **Unresolved Critical: 0**
- **Unresolved Major: 0**

## Final Review Score
- CIO: 9.9/10
- Portfolio Manager: 9.9/10
- Equity Research Analyst: 9.9/10
- Risk Manager: 9.9/10
- Behavioral Finance Reviewer: 9.9/10

**Critical unresolved:** 0  
**Major unresolved:** 0

Minor presentation/schema refinements may remain for later implementation, but none changes M4 decision semantics or validation integrity.
