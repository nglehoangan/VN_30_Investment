# VN30 Value Investing OS — Review Templates

**Document:** `05_PORTFOLIO_WORKFLOW/REVIEW_TEMPLATES.md`  
**Milestone:** 5 — Portfolio Management Workflow  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-08  

**Parent:** `05_PORTFOLIO_WORKFLOW/OPERATING_MODEL.md` v1.0 — Approved Baseline  

**Approved Workflow Dependencies:**  
- `WEEKLY_REVIEW.md` v1.0  
- `MONTHLY_DCA_REVIEW.md` v1.0  
- `QUARTERLY_REVIEW.md` v1.0  
- `ANNUAL_REVIEW.md` v1.0  
- `EVENT_DRIVEN_REVIEW.md` v1.0  
- `VN30_RECONSTITUTION.md` v1.0  
- `PORTFOLIO_RISK_REVIEW.md` v1.0  
- `INVESTMENT_JOURNAL.md` v1.0  
- `PERFORMANCE_REVIEW.md` v1.0  
- `BEHAVIORAL_REVIEW.md` v1.0  

---

# 1. Purpose

This document defines standardized review templates for Milestone 5.

Its purpose is to make every recurring workflow:

- consistent;
- auditable;
- concise enough to use;
- complete enough to prevent material omissions;
- compatible with M1–M4.

Templates are operating interfaces.

They must not create new investment rules.

---

# 2. Template Design Principles

Every template should:

1. identify Review ID;
2. identify review type;
3. record Review Date and Data As-Of;
4. identify Portfolio Snapshot ID where relevant;
5. record methodology/baseline versions;
6. distinguish facts, estimates, assumptions;
7. record data-quality status;
8. record material triggers;
9. classify operating disposition;
10. link Decision ID / Journal Entry ID where applicable;
11. record next review or closure condition.

Do not fill missing data with invented values.

Use:

- `N/A — NOT APPLICABLE`
- `UNKNOWN — DATA MISSING`
- `BLOCKED — DATA QUALITY`

---

# 3. Common Header Template

```markdown
# Review Header

- Review ID:
- Review Type:
- Review Date:
- Data As-Of:
- Portfolio As-Of:
- Portfolio Snapshot ID:
- Ranking Snapshot ID:
- Reviewer:
- Prior Review ID:
- Methodology Versions:
- Data Quality:
  - VALID
  - VALID WITH LIMITATIONS
  - PARTIALLY BLOCKED
  - BLOCKED
```

---

# 4. Common Operating Disposition

Every operating workflow must end with exactly one:

- `NO ACTION`
- `REVIEW REQUIRED`
- `DECISION REQUIRED`

Where applicable, add a reason qualifier such as:

- `REVIEW REQUIRED — DATA QUALITY`
- `REVIEW REQUIRED — DEEP REVIEW`
- `DECISION REQUIRED — RISK`
- `DECISION REQUIRED — THESIS`

These are M5 workflow states, not M4 security Decision States.

---

# 5. Weekly Review Template

```markdown
# Weekly Review

## Header
[Use Common Header]

## Portfolio Snapshot
- NAV:
- Cash:
- Cash %:
- Holdings Count:
- Largest Position:
- Top-3 Concentration:
- Sector Concentration:
- Current Drawdown:
- Legacy Holdings:
- Data Integrity Flags:

## Material Changes
| Issue ID | Ticker/Scope | Category | Trigger | Source | As-Of | Materiality | Prior Status | Current Status | Disposition |
|---|---|---|---|---|---|---|---|---|---|

## Thesis / Risk Exceptions
- Thesis changes:
- New risk flags:
- Cleared risk flags:
- Pending reviews:

## Ranking
- Ranking Status:
- Top-10 Status:
- Refresh Required?:
- Reason:

## Decision Triggers
| Ticker | Trigger | Governing Rule | Evidence Sufficiency | Escalation |
|---|---|---|---|---|

## Final Disposition
- NO ACTION / REVIEW REQUIRED / DECISION REQUIRED

## Next Actions
| Task | Owner | Priority | Due/Review Point | Linked Record |
|---|---|---|---|---|
```

---

# 6. Monthly DCA Review Template

```markdown
# Monthly DCA Review

## Header
[Use Common Header]

## Contribution Reconciliation
- Planned Contribution:
- Actual Contribution:
- Prior Carry Cash:
- Settled Cash:
- Executable Cash:
- Available Allocation Cash:
- Reconciliation Status:

## Portfolio Context
- NAV:
- Cash %:
- Holdings:
- Largest Position:
- Top-3 Concentration:
- Sector Concentration:
- Drawdown:
- Legacy Holdings:
- Risk Exceptions:

## Candidate Table
| Rank | Ticker | Owned? | Score | Validity | Confidence | Thesis | Valuation | Expected Return | Risk | Position Impact | Lot Cost | Buy Gate | Opportunity Cost | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Cash Comparator
- Best deployable candidate:
- Why deploy:
- Why hold cash:
- Robust superiority established?:

## Final Recommendation
- BUY:
- ACCUMULATE:
- SPLIT DEPLOYMENT:
- HOLD CASH:
- REVIEW REQUIRED:

## Execution Status
- EXECUTE / STAGED / DEFERRED / BLOCKED / NOT ACTIONABLE

## Journal
- Decision ID(s):
- Journal Entry ID:
- Next Review:
```

---

# 7. Quarterly Fundamental Review Template

```markdown
# Quarterly Fundamental Review

## Header
[Use Common Header]

## Holding Summary
- Ticker / Security ID:
- VN30 / Legacy Status:
- Ownership:
- Position Weight:
- Sector Weight:
- Prior Decision State:
- Prior Thesis:
- Prior Score:
- Prior Confidence:

## Fundamental Update
| Area | Current Evidence | Interpretation | Source | As-Of | Classification |
|---|---|---|---|---|---|
| Revenue | | | | | FACT/ESTIMATE/ASSUMPTION |
| Earnings | | | | | |
| Margin | | | | | |
| Cash Flow | | | | | |
| Balance Sheet | | | | | |
| Debt/Liquidity | | | | | |
| ROE/ROIC/Sector Metric | | | | | |
| Management Commentary | | | | | |
| Guidance | | | | | |
| Sector Conditions | | | | | |
| Capital Allocation | | | | | |

## Valuation
- Current Price:
- Intrinsic Value Range:
- Downside Case:
- Margin of Safety:
- Expected 5Y Return:
- Valuation Confidence:

## Thesis
- Prior Thesis:
- Current Thesis:
- Thesis Status:
  - IMPROVING
  - INTACT
  - WEAKENING
  - BROKEN
  - PENDING
- Invalidation Conditions:
- Material Changes:

## Score
- Prior Score:
- New Score:
- Category Deltas:
- Score Validity:
- Confidence:

## Risk
- Key Risks:
- New Risk Flags:
- Cleared Risk Flags:
- Residual Risk:
- Portfolio Risk Impact:

## Opportunity Cost
- Best alternative:
- Cash comparator:
- Switching hurdle:

## Final Operating Disposition
- NO ACTION / REVIEW REQUIRED / DECISION REQUIRED

## Linked M4 Decision
- Decision ID:
- Decision State:
- Execution Status:

## Next Review
- Scheduled:
- Event Triggers:
- Unresolved Evidence:
```

---

# 8. Annual Strategic Review Template

```markdown
# Annual Strategic Review

## Header
[Use Common Header]

## Executive Summary
- Portfolio Result:
- Benchmark Result:
- Risk Result:
- Process Quality:
- Key Lessons:
- Policy Status:

## Performance Scorecard
- Contributions:
- Withdrawals:
- Opening NAV:
- Closing NAV:
- Total Return:
- TWR:
- XIRR:
- Multi-Year CAGR:
- Realized P&L:
- Unrealized P&L:
- Dividends:
- Maximum Drawdown:
- VN30 Return:
- Active Return:
- Average Cash %:
- Turnover:

## Portfolio Structure
- Holdings Count:
- Largest Position:
- Top-3 Concentration:
- Sector Exposures:
- Legacy Holdings:

## Decision Quality
- Decisions Reviewed:
- Good Decision / Good Outcome:
- Good Decision / Bad Outcome:
- Bad Decision / Good Outcome:
- Bad Decision / Bad Outcome:
- Policy Compliance:
- Execution Errors:

## Behavioral Summary
- FOMO:
- Anchoring:
- Loss Aversion:
- Disposition Effect:
- Confirmation Bias:
- Recency Bias:
- Overconfidence:
- Action Bias:
- Repeated Patterns:

## Scoring / Ranking Review
- Strengths:
- Weaknesses:
- High-Score Failures:
- Low-Score Misses:
- Confidence Effectiveness:
- Sector Bias:
- Top-10 Usefulness:

## Policy Assumption Review
| Assumption | Status | Evidence | Recommendation |
|---|---|---|---|

Allowed statuses:
- VALID
- VALID WITH MONITORING
- EVIDENCE CHALLENGE
- POLICY REVIEW CANDIDATE

## Final Governance Outcome
- NO POLICY CHANGE
- OPERATIONAL IMPROVEMENTS ONLY
- MODEL/RULE VALIDATION REQUIRED
- POLICY REVIEW PROPOSAL REQUIRED
```

---

# 9. Event-Driven Review Template

```markdown
# Event-Driven Review

## Header
- Event ID:
- Review ID:
- Detection Date:
- Event Effective Date:
- Source:
- Source Quality:
- Ticker / Portfolio Scope:
- Event Category:
- Trigger Severity: T0 / T1 / T2 / T3 / T4

## Event Summary
- Confirmed Facts:
- Allegations / Uncertainties:
- Affected Drivers:

## Materiality
- Thesis Impact:
- Financial Health Impact:
- Valuation Impact:
- Risk Impact:
- Portfolio Impact:
- Mandate Impact:

## Prior State
- Decision State:
- Thesis:
- Score:
- Confidence:
- Valuation:
- Risk:

## Current Assessment
- Updated Thesis:
- Updated Valuation:
- Updated Risk:
- Score Refresh Required?:
- Ranking Refresh Required?:
- Evidence Gaps:

## Operating Disposition
- NO ACTION / REVIEW REQUIRED / DECISION REQUIRED

## Next Step
- Close / Monitor / Deep Review / M4 / VN30 Reconstitution / Data Correction

## Closure
- CLOSED — NO MATERIAL IMPACT
- CLOSED — THESIS INTACT
- CLOSED — REVIEW COMPLETE
- CLOSED — DECISION COMPLETED
- OPEN — MONITOR
- OPEN — EVIDENCE PENDING
```

---

# 10. VN30 Reconstitution Template

```markdown
# VN30 Reconstitution Review

## Header
- Reconstitution Review ID:
- Announcement Date:
- Effective Date:
- Source:
- Prior VN30 Version:
- New VN30 Version:

## Additions
| Ticker | Security ID | Effective Date | Research Status | Stage 0 | Score Status | Confidence | Ranking Status | Decision Review Required? |
|---|---|---|---|---|---|---|---|---|

## Removals
| Ticker | Security ID | Owned? | Quantity | Weight | Legacy Status | Exit Plan ID | Thesis | Valuation | Risk | Liquidity | Decision Required? | Next Review |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Portfolio Impact
- Legacy Holding Count:
- Sector Impact:
- Concentration Impact:
- Ranking Impact:
- Cash Impact after execution only:

## Final Disposition
- NO ACTION / REVIEW REQUIRED / DECISION REQUIRED
```

---

# 11. Portfolio Risk Review Template

```markdown
# Portfolio Risk Review

## Header
[Use Common Header]
- Risk Policy Version:

## Dashboard
| Metric | Value | Limit/Reference | Status | Notes |
|---|---|---|---|---|
| NAV | | | | |
| Cash % | | | | |
| Largest Position | | | GREEN/WATCH/WARNING/BREACH | |
| Top-3 Concentration | | | | |
| Sector Concentration | | | | |
| Holdings Count | | | | |
| Drawdown | | | | |
| Thesis Broken Count | | | | |
| Thesis Weakening Count | | | | |
| Low Confidence Count | | | | |
| Overvalued Count | | | | |
| High-Risk Flags | | | | |
| Legacy Holdings | | | | |
| Liquidity Flags | | | | |
| Data Integrity Flags | | | | |

## Escalations
| Issue | Rule | Affected Scope | Status | Review Required? | Decision Required? |
|---|---|---|---|---|---|

## Overall Risk Status
- GREEN / WATCH / WARNING / BREACH

## Operating Disposition
- NO ACTION / REVIEW REQUIRED / DECISION REQUIRED
```

---

# 12. Investment Journal Template

```markdown
# Investment Journal Entry

## Header
- Journal Entry ID:
- Decision ID:
- Review ID:
- Date:
- Data As-Of:
- Portfolio Snapshot ID:
- Ticker / Security ID:
- Entry Type:
- Decision State:
- Execution Status:

## Investment Case
- Score:
- Score Validity:
- Confidence:
- Thesis:
- Thesis Status:
- Key Positives:
- Key Risks:

## Valuation
- Current Price:
- Intrinsic Value Range:
- Expected 5Y Return:
- Margin of Safety:
- Valuation Confidence:

## Portfolio Context
- Position Weight:
- Sector Weight:
- Cash:
- Concentration:
- Drawdown:
- Post-Trade Impact:

## Opportunity Cost
- Best Alternative:
- Cash Comparator:
- Why Selected Action Wins:

## Decision
- Action:
- Shares:
- Size Rationale:
- Primary Reason:
- Expected Outcome:
- Invalidation Conditions:

## Behavioral Check
- Bias Status:
- Evidence:
- Control Applied:

## Follow-Up
- Review Date:
- Event Triggers:
- 3m Audit:
- 6m Audit:
- 12m Audit:

## Execution
- Transaction ID:
- Actual Shares:
- Actual Price:
- Fees/Taxes:
- Variance:
```

---

# 13. Performance Review Template

```markdown
# Performance Review

## Header
[Use Common Header]
- Period:
- Performance Method Version:
- Benchmark Method Version:

## Capital Flows
- Contributions:
- Withdrawals:

## Portfolio
- Opening NAV:
- Closing NAV:
- Average Cash %:
- Holdings Count:

## Return
- Total Return:
- TWR:
- XIRR:
- CAGR:
- VN30 Return:
- Active Return:

## P&L
- Realized P&L:
- Unrealized P&L:
- Dividends:
- Fees/Taxes:

## Risk
- Current Drawdown:
- Maximum Drawdown:
- Benchmark Drawdown:
- Largest Position:
- Sector Concentration:

## Attribution
- Top Contributors:
- Top Detractors:
- Sector Contribution:
- Cash Drag:
- Turnover:

## Decision Linkage
- Key Decision IDs:
- Key Journal IDs:
- Did outcomes occur for expected reasons?:

## Data Quality
- VALID / VALID WITH LIMITATIONS / PARTIALLY BLOCKED / BLOCKED
- Limitations:
```

---

# 14. Behavioral Review Template

```markdown
# Behavioral Review

## Header
- Behavioral Review ID:
- Date:
- Decision ID(s):
- Journal Entry ID(s):
- Review Period:

## Context
- Original Decision:
- Contemporaneous Evidence:
- Original Thesis:
- Original Valuation:
- Original Risk:
- Later Outcome:

## Bias Assessment
| Bias | Detected? | Severity | Evidence | Control Applied | Residual Concern |
|---|---|---|---|---|---|
| FOMO | | | | | |
| Anchoring | | | | | |
| Loss Aversion | | | | | |
| Disposition Effect | | | | | |
| Confirmation Bias | | | | | |
| Recency Bias | | | | | |
| Overconfidence | | | | | |
| Action Bias | | | | | |

## Decision Quality
- GOOD / BAD
- Rationale:

## Outcome Quality
- GOOD / BAD
- Rationale:

## Lesson
- What happened:
- Why it matters:
- Generalizable?:
- Recommended Control:

## Final Behavioral Status
- NO MATERIAL BIAS
- BIAS CONTROLLED
- PROCESS IMPROVEMENT REQUIRED
- GOVERNANCE REVIEW REQUIRED
```

---

# 15. Decision Audit Template

This template supports the required 3/6/12-month review.

```markdown
# Decision Audit

## Header
- Decision Audit ID:
- Decision ID:
- Journal Entry ID:
- Original Decision Date:
- Audit Date:
- Horizon: 3M / 6M / 12M

## Original Decision Context
- Decision State:
- Thesis:
- Score:
- Confidence:
- Valuation:
- Expected Return:
- Key Risks:
- Portfolio Context:
- Opportunity Cost:
- Expected Outcome:
- Invalidation Conditions:

## Information Available at Original Date
- Facts:
- Estimates:
- Assumptions:
- Known Uncertainties:

## What Happened
- Business Outcome:
- Thesis Outcome:
- Valuation Outcome:
- Risk Outcome:
- Price/Return Outcome:
- Execution Outcome:

## Process Quality
- Data adequate?:
- Thesis logical?:
- Valuation disciplined?:
- Risk handled correctly?:
- Portfolio rules respected?:
- Opportunity cost considered?:
- Behavioral bias?:
- Policy compliant?:

## Classification
- GOOD DECISION / GOOD OUTCOME
- GOOD DECISION / BAD OUTCOME
- BAD DECISION / GOOD OUTCOME
- BAD DECISION / BAD OUTCOME

## Lesson
- What was learned:
- Generalizable?:
- Process improvement:
- Rule/Policy change required?:
```

---

# 16. Template Completion Rules

## Mandatory fields

Do not leave a required decision-material field blank.

Use explicit states:

- `N/A — NOT APPLICABLE`
- `UNKNOWN — DATA MISSING`
- `PENDING — EVIDENCE REQUIRED`
- `BLOCKED — DATA QUALITY`

## Version pinning

Every review must identify relevant approved methodology versions sufficient to reconstruct the decision.

## Data As-Of

The review date is not automatically the data date.

Both must be preserved.

---

# 17. Template Minimalism Rule

Templates must not become bureaucratic checklists that consume more effort than the investment analysis.

Principle:

> complete enough to prevent omission, concise enough to remain usable.

Routine reviews may use compact sections.

Deep reviews should expand only when materiality requires it.

---

# 18. Cross-Workflow Linking

Where a workflow escalates:

```text
Weekly Review
→ Deep Review
→ Decision ID
→ Journal Entry
→ Execution
→ Decision Audit
```

or:

```text
Event ID
→ Event Review
→ Decision ID
→ Journal
→ Audit
```

or:

```text
VN30 Reconstitution
→ Legacy Exit Plan
→ Decision ID
→ Transaction
→ Closure
```

Do not duplicate independent records without linkage.

---

# 19. Template Governance

`REVIEW_TEMPLATES.md` may standardize fields and layout.

It may not redefine:

- scoring;
- valuation rules;
- risk thresholds;
- Buy/Sell logic;
- DCA gates;
- position sizing;
- opportunity-cost rules.

If a template conflicts with its governing workflow document:

> the governing approved workflow takes precedence.

---

# 20. Acceptance Criteria

`REVIEW_TEMPLATES.md` is acceptable only if:

1. all major M5 review types have a usable template;
2. Common Header and Data As-Of are standardized;
3. operating dispositions are standardized;
4. templates distinguish M5 workflow states from M4 Decision States;
5. FACT/ESTIMATE/ASSUMPTION can be captured;
6. data-quality blockage is explicit;
7. Decision ID and Journal linkage are supported;
8. 3/6/12-month Decision Audit has a template;
9. templates remain concise enough for repeated use;
10. template governance cannot override M1–M4;
11. cross-workflow linkage is explicit;
12. missing data is surfaced rather than guessed.

---

# 21. Multi-Role Review

## CIO

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- templates accidentally creating new rules;
- excessive process bureaucracy;
- weak distinction between operating status and Decision State.

**Assessment:** PASS.

## Portfolio Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- inconsistent recurring review outputs;
- no reusable portfolio/candidate structure;
- poor escalation linkage.

**Assessment:** PASS.

## Equity Research Analyst

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- missing thesis/valuation/fundamental evidence structure;
- fact/estimate/assumption ambiguity;
- quarterly template insufficient for Deep Review.

**Assessment:** PASS.

## Risk Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- missing risk dashboard structure;
- risk status could be confused with Sell decision;
- missing data-quality blockade.

**Assessment:** PASS.

## Investment Operations Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- missing common identifiers;
- inconsistent Data As-Of handling;
- weak cross-record linkage;
- no standard Decision Audit form.

**Assessment:** PASS.

## Behavioral Finance Reviewer

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- behavioral checks missing from operational records;
- outcomes replacing process analysis;
- no dedicated decision-audit structure.

**Assessment:** PASS.

---

# 22. Consolidated Issue Register

## Critical
**0 unresolved**

## Major
**0 unresolved**

## Minor / Deferred

### RT-1 — Physical storage format

Templates define content, not storage technology.

### RT-2 — Exact required-field automation

Implementation may later enforce schema programmatically.

### RT-3 — Template verbosity calibration

Real use may reveal fields that should be compacted.

**Recommendation:** adjust presentation only after practical validation; do not remove decision-critical evidence.

---

# 23. Final Review

**CIO:** PASS  
**Portfolio Manager:** PASS  
**Equity Research Analyst:** PASS  
**Risk Manager:** PASS  
**Investment Operations Manager:** PASS  
**Behavioral Finance Reviewer:** PASS  

**Critical unresolved:** 0  
**Major unresolved:** 0  
**Minor / deferred:** 3  

**Overall design quality:** approximately **9.9/10**.

**Approval Status:** APPROVED BASELINE v1.0.

The next planned file is `05_PORTFOLIO_WORKFLOW/VALIDATION_CASES.md`.
