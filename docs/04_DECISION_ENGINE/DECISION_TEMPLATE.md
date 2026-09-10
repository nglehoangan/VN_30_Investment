# DECISION_TEMPLATE.md

**Version:** 1.0
**Status:** Approved Baseline v1.0
**Milestone:** 4 — Buy / Hold / Sell Decision Engine  
**Scope:** Standardized decision output and audit schema for VN30 Value Investing OS

---

## 1. Purpose

This file defines the mandatory decision template used whenever the system issues one of the seven allowed portfolio states:

- STRONG BUY
- BUY
- ACCUMULATE
- HOLD
- REDUCE
- SELL
- AVOID

The template must make every decision:

1. reconstructable,
2. reviewable,
3. comparable across time,
4. resistant to behavioral bias,
5. consistent with M1–M4 policies,
6. auditable against the data available at the decision time.

The template does not create new decision rules. It operationalizes approved rules from:

- INVESTMENT_POLICY.md
- DECISION_FRAMEWORK.md
- RISK_POLICY.md
- SCORING_MODEL.md
- DECISION_ENGINE.md
- BUY_RULES.md
- SELL_RULES.md
- DCA_RULES.md
- POSITION_SIZING.md
- OPPORTUNITY_COST.md

---

## 2. Mandatory Decision Header

Every formal decision must include:

| Field | Requirement |
|---|---|
| Decision ID | Unique and immutable |
| Decision Date | Required |
| Data As-Of Date | Required |
| Portfolio As-Of Date | Required |
| Ticker | Required |
| Security ID | Required where available |
| VN30 Membership Status | CURRENT / LEGACY / NON-ELIGIBLE |
| Ownership Status | UNOWNED / OWNED |
| Review Type | INITIAL / SCHEDULED / TRIGGERED / DCA / REBALANCE / EXIT / OTHER |
| Prior Decision ID | Required when available |
| Methodology Version | Required |
| Portfolio Snapshot ID | Required where reconstructable |
| Stage 0 Status | PASS / PASS WITH CONDITIONS / PENDING / FAIL |
| Review Status | FINAL / PENDING / ESCALATED |
| Eligibility Status | ELIGIBLE / LEGACY / NON-ELIGIBLE |

---

## 2.1 Data Completeness and Field Semantics

Every mandatory field must contain one of:

- a valid value,
- `N/A — NOT APPLICABLE`, or
- `UNKNOWN — DATA MISSING`.

`N/A` and `UNKNOWN` are not interchangeable.

If a missing or stale field could materially change thesis, valuation, risk, eligibility, or portfolio constraints, the record must be marked `Review Status = PENDING` or `ESCALATED` and new capital must not be authorized.

Every material fact, estimate, or assumption used in the decision should carry:

- source/reference,
- as-of date,
- classification: FACT / ESTIMATE / ASSUMPTION.

The template must never fill an unavailable value with an inferred number merely to complete the form.

---

## 3. Executive Decision Block

### 3.1 Final Recommendation

**Decision State:**  
STRONG BUY / BUY / ACCUMULATE / HOLD / REDUCE / SELL / AVOID

**Decision Qualifier:**  
Optional short qualifier that explains context without creating an eighth state.

Examples:
- HOLD — valuation no longer attractive enough to add
- BUY — requires cash accumulation
- REDUCE — concentration normalization
- SELL — thesis broken
- AVOID — data confidence insufficient

### 3.2 Execution Status

One of:

- EXECUTE
- STAGED
- TEMPORARILY DEFERRED
- REQUIRES CASH ACCUMULATION
- BLOCKED — PORTFOLIO/RISK
- NOT ACTIONABLE
- NO EXECUTION — CASH/SETTLEMENT INSUFFICIENT

Execution Status must never silently overwrite the Decision State.

Also record:

- **Trade Authorization:** AUTHORIZED / NOT AUTHORIZED / APPROVAL REQUIRED / N/A
- **Required Approval:** NONE / CIO / RISK / CIO+RISK / USER / OTHER
- **Approval Reference:** required when an exception or escalation is approved.

---

## 4. Mandatory Score and Confidence Block

Include:

| Field | Required |
|---|---|
| Total Fundamental Score /100 | Yes |
| Business Quality /25 | Yes |
| Financial Health /15 | Yes |
| Growth Quality /15 | Yes |
| Industry & Competitive Position /10 | Yes |
| Valuation & Forward Return /20 | Yes |
| Risk & Governance /10 | Yes |
| Capital Allocation Quality /5 | Yes |
| Score Validity | Yes |
| Data Confidence | HIGH / MEDIUM / LOW |
| Hurdle Exception | YES / NO / N/A |
| Exception Rationale | Required when Hurdle Exception = YES |

Mandatory principle:

> Score is evidence input, not the final decision.

If score and Decision State appear inconsistent, the decision record must explicitly explain the conflict.

---

## 5. Investment Thesis Block

### 5.1 Original Thesis

Summarize the original long-term investment thesis in concise form.

### 5.2 Current Thesis Status

Canonical M4 status:

- INTACT
- IMPROVING
- WEAKENING
- BROKEN
- PENDING

### 5.3 Thesis Strength

- HIGH
- MEDIUM
- LOW

### 5.4 Thesis Evidence

Required:
- key supporting evidence with source and as-of date,
- what changed since prior review,
- which assumptions remain valid,
- which assumptions weakened or strengthened.

### 5.5 Thesis Break Conditions

List explicit conditions that would invalidate the thesis.

These must be observable enough to support future review.

---

## 6. Key Positives

List the most material positive factors only.

Each positive should indicate:

- FACT / ESTIMATE / ASSUMPTION,
- source/reference,
- as-of date,
- materiality to thesis or valuation.

Avoid generic statements such as “good company” or “strong business” without evidence.

---

## 7. Key Risks

For each key risk include:

| Field | Description |
|---|---|
| Risk | Specific risk |
| Probability | LOW / MEDIUM / HIGH |
| Impact | LOW / MEDIUM / HIGH |
| Monitoring Indicator | Observable evidence |
| Thesis Relevance | Supporting / weakening / break-risk |
| Status | OPEN / MITIGATED / WORSENING / RESOLVED |

Hard veto or unresolved mandatory review must be called out separately.

---

## 8. Valuation Assessment

Mandatory fields:

- Current market price
- Valuation as-of date
- Primary valuation method
- Intrinsic value range
- Base-case intrinsic value
- Margin of Safety
- Expected 5Y annualized total return
- Downside case
- Upside case
- Key valuation assumptions
- Sensitivity / uncertainty note
- Valuation confidence
- Normal/exceptional return hurdle used
- Whether hurdle passed
- Hurdle exception flag and rationale where applicable

Required conclusion:

**Valuation Assessment:**  
DEEP / ATTRACTIVE / FAIR / EXPENSIVE / EXTREME OVERVALUATION / INDETERMINATE

The label is descriptive only. It cannot replace the expected-return and downside analysis.

---

## 9. Risk and Governance Assessment

Include:

- Stage 0 eligibility/investability result,
- review status,
- residual risk level,
- governance status,
- hard veto status,
- mandatory review status,
- material balance-sheet risk,
- regulatory or operational risk,
- concentration implications,
- hidden-factor/correlation risk where relevant.

### Veto Status

- NONE
- CAPITAL-ALLOCATION VETO
- OWNERSHIP VETO
- POSSIBLE / UNRESOLVED VETO

If possible or unresolved veto exists, new capital is not actionable.

---

## 10. Portfolio Context

Mandatory when portfolio data is available:

| Field | Requirement |
|---|---|
| Current shares | Yes |
| Current position value | Yes |
| Current portfolio weight | Yes |
| Post-trade proposed weight | Yes |
| Sector | Yes |
| Current sector exposure | Yes |
| Post-trade sector exposure | Yes |
| Hidden-factor concentration | Where material |
| Cash available | Yes |
| Full-settlement trade cash required | Yes |
| Board-lot feasibility | Yes |
| Portfolio drawdown regime | Yes |
| Small-NAV exception | If applicable |
| Binding portfolio constraint | Required for allocation decisions |
| Marginal capacity after proposed trade | Required for BUY/ACCUMULATE/STRONG BUY |

Cost basis and unrealized P&L may be displayed for accounting context but may not determine intrinsic value or thesis validity.

---

## 11. Opportunity-Cost Block

Every allocation decision must compare the recommendation with relevant alternatives.

### For New Capital

Compare against:

1. best eligible new position,
2. best eligible current holding to add,
3. cash.

### For Existing Capital Reallocation

Compare against:

1. continuing to hold,
2. partial reduction,
3. full exit if sell rules permit,
4. replacement candidate,
5. cash.

Mandatory fields:

- allocation mode: INCREMENTAL CAPITAL / EXISTING CAPITAL REALLOCATION,
- comparator set,
- comparator data freshness/actionability,
- expected return comparison,
- quality comparison,
- residual-risk comparison,
- confidence comparison,
- portfolio-fit comparison,
- uncertainty/materiality conclusion.

**Opportunity-Cost Conclusion:**
- SUPERIOR
- COMPETITIVE
- INFERIOR
- INDETERMINATE

---

## 12. Position Sizing / Action Block

### For STRONG BUY / BUY / ACCUMULATE

Include:

- economic target weight,
- risk-adjusted target weight,
- binding constraint,
- current weight,
- proposed post-trade weight,
- executable shares/lots,
- current tranche size,
- remaining target capacity,
- next marginal re-ranking trigger,
- trade authorization / required approval.

### For HOLD

Must explicitly state:

1. why not add,
2. why not reduce or sell,
3. why HOLD is superior to cash or switching.

### For REDUCE

Include:

- current weight,
- target weight/range,
- reduction shares/lots,
- reason partial ownership remains justified,
- normalization plan if concentration driven.

### For SELL

Include:

- target ownership = 0,
- execution plan,
- whether execution is staged,
- why residual ownership is not justified.

### For AVOID

Include:

- reason category:
  - structural,
  - risk veto,
  - valuation,
  - data/confidence,
  - temporary portfolio constraint,
  - temporary cash/lot constraint.

Temporary cash/lot infeasibility alone must not convert an otherwise valid BUY into a fundamental AVOID.

---

## 13. Market / Money Flow / Technical Entry

This section is secondary.

Include only if relevant:

- market regime,
- money-flow observations,
- technical entry condition,
- preferred execution zone,
- execution invalidation,
- time/event limit for technical deferral.

Technical analysis may affect execution timing only. It cannot override fundamental, thesis, valuation, risk, or portfolio rules.

---

## 14. Final Decision Rationale

Provide the 3–5 most important reasons supporting the decision.

The rationale must follow the approved decision sequence:

Business Quality  
→ Financial Health  
→ Growth  
→ Industry  
→ Valuation  
→ Risks  
→ Market / Money Flow  
→ Technical Entry  
→ Existing Portfolio  
→ Opportunity Cost  
→ Final Decision

No single metric may determine the recommendation.

---

## 15. Invalidation Conditions

Every decision must explicitly state what would invalidate the recommendation.

Examples:

- thesis break,
- material deterioration in financial health,
- governance failure,
- valuation no longer supporting hurdle,
- concentration limit reached,
- replacement opportunity becomes materially superior,
- data confidence falls below actionable threshold.

Invalidation conditions should be forward-looking and observable. Each condition should identify the monitoring indicator and whether breaching it triggers REVIEW, NO-ADD, REDUCE, or SELL assessment.

---

## 16. Review Trigger and Next Review

Include:

### Mandatory Review Triggers

At minimum evaluate:

- +20% gain from purchase cost,
- price decline ≥15% from most recent meaningful purchase reference,
- price decline ≥20% from last formal thesis-review price,
- single-name weight >15%,
- sector exposure >30%,
- portfolio drawdown escalation,
- major business/financial/governance event,
- VN30 membership change,
- thesis evidence change,
- material valuation change,
- data-quality deterioration.

### Next Review

Specify:

- scheduled date, or
- event-driven trigger, or
- both.

---

## 17. Behavioral Finance Check

Mandatory checklist:

- FOMO
- loss aversion
- anchoring to cost basis
- disposition effect / premature profit-taking
- sunk-cost fallacy
- recency bias
- action bias
- endowment effect
- confirmation bias
- averaging-down reflex

For any detected bias:

- describe the bias,
- explain how the decision was corrected,
- record whether the final decision changed.

---

## 18. Decision Audit Trail

Every formal decision should preserve:

- Decision ID
- timestamps
- prior Decision ID
- data sources and as-of dates
- portfolio reconstruction version
- methodology versions
- assumptions changed since prior review
- score changed since prior review
- thesis status changed since prior review
- valuation changed since prior review
- position/exposure changed since prior review
- final recommendation
- execution status
- reviewer notes
- approval/escalation where required
- hurdle exception and authorization reference
- binding constraint and execution-feasibility outcome
- source/as-of references for material evidence

The audit trail must be sufficient to reconstruct what the system knew at the time.

---

## 19. Compact Decision Template

Use the following structure for normal operating output:

```text
Ticker:
Decision ID:
Decision Date:
Data As-Of:
Portfolio As-Of:
Stage 0 Status:
Review Status:
Eligibility Status:
VN30 Membership Status:
Ownership Status:
Methodology Version:
Prior Decision ID:

DECISION STATE:
DECISION QUALIFIER:
EXECUTION STATUS:
TRADE AUTHORIZATION:
REQUIRED APPROVAL:
APPROVAL REFERENCE:

Fundamental Score:
Score Validity:
Data Confidence:
Hurdle Exception:
Exception Rationale:

Original Thesis:
Thesis Status:
Thesis Strength:
Investment Thesis:
Thesis Break Conditions:
1.
2.
3.

What Changed Since Prior Review:

Key Positives:
1. [FACT/ESTIMATE/ASSUMPTION] [Source] [As-Of]
2. [FACT/ESTIMATE/ASSUMPTION] [Source] [As-Of]
3. [FACT/ESTIMATE/ASSUMPTION] [Source] [As-Of]

Key Risks:
1. [Probability] [Impact] [Indicator] [Status]
2. [Probability] [Impact] [Indicator] [Status]
3. [Probability] [Impact] [Indicator] [Status]

Valuation:
- Price:
- Intrinsic Value Range:
- Margin of Safety:
- Expected 5Y Annualized Total Return:
- Downside Case:
- Valuation Confidence:
- Return Hurdle Used:
- Hurdle Passed:

Risk:
- Residual Risk:
- Veto Status:
- Mandatory Review Status:
- Stage 0 Result:
- Review Status:

Portfolio:
- Current Weight:
- Proposed Weight:
- Current Sector Exposure:
- Proposed Sector Exposure:
- Binding Constraint:
- Marginal Capacity:
- Cash Available:
- Full-Settlement Cash Required:
- Lot Feasibility:
- Drawdown Regime:

Opportunity Cost:
- Allocation Mode:
- Comparator Set:
- Best Comparator:
- Conclusion:
- Materiality:

Suggested Action:
- Shares/Lots:
- Target Weight:
- Execution Plan:
- Trade Authorization:
- Required Approval:

Why This Decision:
1.
2.
3.

Invalidation Conditions:
1. [Indicator] [Trigger Outcome]
2. [Indicator] [Trigger Outcome]
3. [Indicator] [Trigger Outcome]

Next Review:
Mandatory Review Trigger(s):
Behavioral Bias Check:
Material Evidence Sources / As-Of:
```

---

## 20. Extended Review Template

For quarterly review, material thesis change, REDUCE, SELL, or STRONG BUY, the compact template is insufficient by itself.

The extended version must additionally include:

- full scorecard,
- thesis change log,
- valuation scenario table,
- risk matrix,
- portfolio concentration analysis,
- opportunity-cost comparator table,
- sizing waterfall,
- behavioral review,
- audit history,
- exception/approval log,
- source and data-freshness register.

---

## 21. Decision-State Minimum Evidence Matrix

| State | Minimum Evidence |
|---|---|
| STRONG BUY | Stage 0 PASS; VALID — ACTIONABLE; HIGH confidence; INTACT/IMPROVING thesis; BQ/FH/R&G strong-buy gates; strong MOS/expected return; LOW/MODERATE residual risk; no veto; portfolio capacity; opportunity-cost pass; authorization pass |
| BUY | Stage 0 PASS (or narrowly permitted PASS WITH CONDITIONS); VALID — ACTIONABLE; ≥MEDIUM confidence; thesis pass; category gates; valuation hurdle pass or documented exception; no veto; acceptable portfolio fit; authorization pass |
| ACCUMULATE | Existing holding; fresh underwriting; Stage 0 PASS; VALID — ACTIONABLE; ≥MEDIUM confidence; INTACT/IMPROVING thesis; valuation hurdle; concentration/risk/opportunity-cost pass; authorization pass |
| HOLD | Owned position; explicit reasons not to add and not to reduce/sell; thesis/risk state supports continued ownership; holding remains superior to feasible alternatives after switching friction |
| REDUCE | Smaller position clearly preferable; target weight/range; binding reason; residual ownership still justified; authorization/execution plan recorded |
| SELL | Target ownership = 0 justified by precedence hierarchy; residual ownership not justified; mandatory exits cannot be blocked by replacement affordability; execution/authorization recorded |
| AVOID | Unowned/no-new-capital conclusion with reason category; must distinguish structural/fundamental AVOID from temporary execution infeasibility |

---

## 22. Quality-Control Invariants

The template must never allow:

1. score alone to determine the decision;
2. low P/E alone to imply cheapness;
3. price decline alone to trigger BUY;
4. price increase alone to trigger SELL;
5. +20% gain to trigger automatic profit-taking;
6. cost basis to substitute for intrinsic value;
7. technical analysis to create or destroy a long-term thesis;
8. insufficient cash to become fundamental AVOID;
9. a mandatory SELL to be blocked by replacement affordability;
10. execution status to silently overwrite Decision State;
11. stale or contradictory critical data to be presented as current fact;
12. LOW confidence to authorize new capital;
13. a comparator with materially worse risk/confidence to win solely on point-estimate return;
14. temporary operational constraints to mutate the economic recommendation;
15. `UNKNOWN` data to be represented as `N/A`;
16. a Stage 0 FAIL/PENDING or unresolved ownership/capital-allocation veto to be hidden inside narrative text;
17. an exception threshold to be used without an explicit exception flag and rationale;
18. approved concentration/drawdown exceptions to be executed without an approval reference;
19. a decision record to omit material source/as-of evidence needed for reconstruction.

---

## 23. Template Validation Tests

Before a decision record is considered complete, verify at minimum:

1. **Seven-state test** — exactly one allowed Decision State is present.
2. **State/execution separation test** — execution infeasibility has not mutated the economic Decision State.
3. **Stage 0 test** — Stage 0 and Review Status are explicit.
4. **Confidence test** — LOW confidence cannot authorize new capital.
5. **Veto visibility test** — hard or unresolved veto is explicit and routed correctly.
6. **Data semantics test** — missing values use `UNKNOWN`, not fabricated values or `N/A`.
7. **Evidence dating test** — material evidence carries source/as-of information.
8. **Valuation hurdle test** — hurdle used, pass/fail, and any exception are explicit.
9. **Portfolio reconstruction test** — current/post-trade weights and binding constraint are reconstructable when portfolio data exists.
10. **Opportunity-cost mode test** — incremental cash and existing-capital reallocation are not mixed.
11. **Authorization test** — required escalation/exception approval is referenced.
12. **SELL independence test** — mandatory SELL is not blocked because replacement is unaffordable.
13. **HOLD completeness test** — HOLD explains why neither add nor exit is superior.
14. **REDUCE residual-ownership test** — REDUCE explains why non-zero ownership remains justified.
15. **Behavioral-bias test** — cost basis, FOMO, loss aversion, disposition effect, and averaging-down reflex are checked.
16. **Audit reconstruction test** — a later reviewer can reconstruct what data, rules, assumptions, and portfolio state produced the decision.

A failed validation test makes the record incomplete even if the recommendation itself may be correct.

---

## 24. Versioning and Governance

This file becomes binding only after explicit approval.

After approval:

- promote to Approved Baseline v1.0;
- future changes require explicit version increment unless the user specifies another versioning rule;
- later templates or application interfaces must preserve the semantic separation between:
  - Decision State,
  - Decision Qualifier,
  - Execution Status,
  - Position Sizing,
  - Opportunity Cost,
  - Review Status.

---

## 24.1 Five-Role Review Summary — v0.2

### CIO

**Assessment:** 9.9/10. The template now separates economic recommendation, execution, authorization, and exceptions while preserving the seven-state architecture.

### Portfolio Manager

**Assessment:** 9.9/10. Current/post-trade exposure, marginal capacity, binding constraints, and allocation mode are explicit enough for portfolio-level use.

### Equity Research Analyst

**Assessment:** 9.9/10. Thesis change, break conditions, evidence classification, source/as-of dating, valuation assumptions, and uncertainty are sufficiently reconstructable.

### Risk Manager

**Assessment:** 9.9/10. Stage 0, review status, veto visibility, approval references, portfolio constraints, and mandatory-exit independence are explicit.

### Behavioral Finance Reviewer

**Assessment:** 9.9/10. The template materially reduces anchoring, action bias, disposition effect, averaging-down reflex, and false precision caused by missing data.

### Issue Status

- Critical unresolved: **0**
- Major unresolved: **0**
- Minor/deferred: presentation-layer formatting and machine-readable schema may be defined during implementation; they do not change decision semantics.

---

## 25. Approval Gate

Current status: **Approved Baseline v1.0**

Before approval, perform five-role review:

- CIO
- Portfolio Manager
- Equity Research Analyst
- Risk Manager
- Behavioral Finance Reviewer

Do not proceed to `VALIDATION_CASES.md` until this file is explicitly approved.
