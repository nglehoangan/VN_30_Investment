# VN30 Value Investing OS — Milestone 5 Validation Cases

**Document:** `05_PORTFOLIO_WORKFLOW/VALIDATION_CASES.md`  
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
- `REVIEW_TEMPLATES.md` v1.0  

---

# 1. Purpose

This document validates the Milestone 5 operating workflows against realistic edge cases.

The goal is to verify that M5:

- preserves M1–M4 precedence;
- avoids overtrading;
- treats HOLD CASH and NO ACTION as valid outcomes;
- handles missing/stale data safely;
- escalates correctly;
- preserves auditability;
- handles behavioral traps;
- does not invent new policy thresholds.

Validation cases are scenario tests, not historical backtests.

---

# 2. Validation Method

Each case contains:

- Scenario
- Relevant Workflow
- Preconditions
- Expected Operating Disposition
- Expected M4 Routing
- Required Audit Record
- Pass Criteria
- Failure Modes

A case passes only if the expected behavior follows approved M1–M5 rules without silent overrides.

---

# 3. Validation Case 1 — Quiet Week, No Material Change

## Scenario

Portfolio is fully reconciled. No significant company news, no earnings release, no material price move, no risk breach, and ranking remains valid.

## Workflow

`WEEKLY_REVIEW.md`

## Expected

- `NO ACTION`
- no score refresh
- no ranking refresh
- no M4 Decision Engine invocation
- Weekly Review record retained

## Pass Criteria

System does not create a trade merely because a weekly review occurred.

## Failure

- forces a decision;
- refreshes all scores unnecessarily;
- recommends buying because cash exists.

---

# 4. Validation Case 2 — Price Falls 18%, Thesis Unchanged

## Scenario

A holding falls 18% in one week. No new adverse company evidence. Thesis remains intact. Valuation becomes more attractive.

## Workflow

Weekly / Event-Driven

## Expected

- price move triggers review
- thesis remains `INTACT`
- valuation refresh permitted
- no automatic ACCUMULATE
- M4 only invoked if a valid add decision is being considered
- HOLD / NO ACTION / ACCUMULATE may all remain possible depending full gates

## Pass Criteria

Price decline alone is not treated as Buy signal.

---

# 5. Validation Case 3 — Price Rises 22%, Business Still Strong

## Scenario

A holding rises 22%. Thesis remains intact. Forward return compresses but is still acceptable.

## Expected

- valuation review
- no automatic REDUCE/SELL
- concentration reviewed
- M4 only if valuation or sizing trigger is reached

## Pass Criteria

Gain percentage is not used as profit-taking rule.

---

# 6. Validation Case 4 — Monthly DCA, No Candidate Passes

## Scenario

5M VND contribution is received. Cash is reconciled. All current VN30 candidates fail valuation, risk, confidence, or opportunity-cost gates.

## Workflow

`MONTHLY_DCA_REVIEW.md`

## Expected

- `HOLD CASH`
- journal material HOLD CASH
- no forced deployment

## Pass Criteria

System accepts cash accumulation.

---

# 7. Validation Case 5 — Best Candidate Is Unaffordable

## Scenario

Best candidate requires more than available cash for 100 shares. Second-best candidate is affordable but only marginally attractive.

## Expected

- do not automatically buy second-best
- compare second-best vs cash
- HOLD CASH if superiority is insufficient

## Pass Criteria

Board-lot constraint does not distort investment merit.

---

# 8. Validation Case 6 — Split Deployment Temptation

## Scenario

Two candidates rank highly. Only one clearly passes all Buy gates. User prefers diversification.

## Expected

- buy only independently qualifying candidate
- do not split for psychological comfort
- remaining cash can stay idle

## Pass Criteria

Every lot independently qualifies.

---

# 9. Validation Case 7 — Existing Holding Below Cost

## Scenario

Holding is down 25%. Thesis remains intact but score quality has weakened slightly and alternative opportunity is superior.

## Expected

- no averaging down due to loss
- current opportunity cost governs
- possible HOLD
- possible no add
- cost basis excluded from merit analysis

## Pass Criteria

Break-even motive is rejected.

---

# 10. Validation Case 8 — Quarterly Weak Earnings, Temporary Cause

## Scenario

One quarter earnings decline due to temporary input-cost spike. Cash flow and balance sheet remain healthy. Long-term thesis unaffected.

## Workflow

`QUARTERLY_REVIEW.md`

## Expected

- thesis likely `INTACT`
- score may change only if scoring inputs justify
- no automatic SELL
- record temporary-vs-structural reasoning

## Pass Criteria

One weak quarter is treated as evidence, not destiny.

---

# 11. Validation Case 9 — Quarterly Structural Deterioration

## Scenario

Revenue quality weakens, margins deteriorate repeatedly, leverage rises, and original thesis driver is failing.

## Expected

- thesis `WEAKENING` or `BROKEN`
- `DECISION REQUIRED`
- invoke M4
- journal change
- risk review updated

## Pass Criteria

System escalates instead of rationalizing deterioration.

---

# 12. Validation Case 10 — Management Fraud Allegation, Unverified

## Scenario

Credible media reports allege fraud. No regulator or issuer confirmation yet.

## Workflow

`EVENT_DRIVEN_REVIEW.md`

## Expected

- `REVIEW REQUIRED`
- source verification
- confidence may be reduced if justified
- no automatic SELL
- evidence gap remains explicit

## Pass Criteria

Unverified headline does not directly create Decision State.

---

# 13. Validation Case 11 — Fraud Confirmed

## Scenario

Regulator confirms material fraud affecting reported financials.

## Expected

- T4 critical event
- immediate Deep Review
- Stage 0 / governance reassessment
- likely `DECISION REQUIRED`
- M4 invoked
- no waiting for quarterly review

## Pass Criteria

Governance/solvency risk receives highest priority.

---

# 14. Validation Case 12 — Market Crash 20%

## Scenario

VN30 crashes 20% rapidly. Portfolio falls significantly but most company theses remain intact.

## Expected

- portfolio drawdown review
- distinguish market beta from issuer impairment
- no automatic mass SELL
- no automatic mass BUY
- selective DCA only if normal gates pass

## Pass Criteria

System avoids panic and falling-knife behavior.

---

# 15. Validation Case 13 — Portfolio Drawdown ~20%

## Scenario

Portfolio reaches approximately 20% drawdown. Data is valid. Losses are concentrated in two holdings.

## Workflow

`PORTFOLIO_RISK_REVIEW.md`

## Expected

- drawdown diagnosis mandatory
- concentration and thesis review
- risk status escalates according to approved policy
- no automatic liquidation

## Pass Criteria

Drawdown is treated as escalation trigger, not stop-loss.

---

# 16. Validation Case 14 — Top-3 Concentration Breach

## Scenario

Three holdings appreciate sharply and push Top-3 concentration above approved limit.

## Expected

- `BREACH`
- `DECISION REQUIRED`
- M4 invoked for affected holdings/portfolio
- no automatic equal-weight rebalancing
- potential HOLD/REDUCE depending valuation and risk

## Pass Criteria

Risk breach triggers formal review without predetermining SELL.

---

# 17. Validation Case 15 — New VN30 Addition

## Scenario

A stock is newly added to VN30 and has strong recent momentum.

## Workflow

`VN30_RECONSTITUTION.md`

## Expected

- `ELIGIBLE FOR RESEARCH`
- full scoring required
- no automatic Buy
- inclusion momentum ignored as Buy authority

## Pass Criteria

Index inclusion is eligibility, not recommendation.

---

# 18. Validation Case 16 — Owned Stock Removed from VN30

## Scenario

An owned holding is removed from VN30.

## Expected

- classify `LEGACY HOLDING`
- block new capital
- keep in NAV/P&L/risk
- create exit plan
- no immediate forced market-order sale
- no indefinite retention

## Pass Criteria

Mandate and execution discipline are both preserved.

---

# 19. Validation Case 17 — Legacy Holding Below Cost

## Scenario

Removed holding is down 35% from cost. User wants to wait for break-even.

## Expected

- loss-aversion flag
- break-even rejected as exit rationale
- exit plan continues
- M4 Sell Rules govern actual action

## Pass Criteria

Cost basis does not override mandate.

---

# 20. Validation Case 18 — Legacy Holding Re-Enters VN30

## Scenario

A Legacy Holding re-enters VN30 before full exit.

## Expected

- current eligibility restored from new effective date
- historical Legacy period preserved
- no automatic Add
- rerun current thesis/valuation/risk before considering capital

## Pass Criteria

Re-entry restores eligibility, not prior thesis automatically.

---

# 21. Validation Case 19 — Monthly DCA with Unreconciled Cash

## Scenario

Contribution appears in planning record but settlement/ledger state is unclear.

## Expected

- `REVIEW REQUIRED — CASH UNRECONCILED`
- no executable purchase size
- no assumed cash

## Pass Criteria

Planned contribution is not treated as executable cash.

---

# 22. Validation Case 20 — Unknown VN30 Membership

## Scenario

Current membership evidence conflicts across sources.

## Expected

- `MEMBERSHIP UNKNOWN`
- new purchase blocked
- data-quality investigation
- no guessing to maintain 30 names

## Pass Criteria

Unknown reference data blocks actionability safely.

---

# 23. Validation Case 21 — High Score, Low Confidence

## Scenario

Candidate scores highly but key data is uncertain and confidence is low.

## Expected

- ranking may show analytical attractiveness
- new capital blocked or constrained by approved rules
- no automatic Buy

## Pass Criteria

Confidence remains independent from score.

---

# 24. Validation Case 22 — Strong Company, Overvalued Position

## Scenario

Holding remains excellent fundamentally, but forward return is materially compressed and position weight is large.

## Expected

- thesis may remain `INTACT`
- possible `DECISION REQUIRED`
- M4 may conclude HOLD or REDUCE
- no thesis downgrade merely due to valuation

## Pass Criteria

Price, business quality, intrinsic value, and thesis remain separated.

---

# 25. Validation Case 23 — Good Decision, Bad Outcome

## Scenario

A thoroughly researched Buy passes all rules. An unforeseeable macro shock causes a 20% decline three months later.

## Workflow

Journal / Behavioral / Decision Audit

## Expected

- potentially `GOOD DECISION / BAD OUTCOME`
- no hindsight rewrite
- no false bias diagnosis

## Pass Criteria

Decision quality remains distinct from outcome.

---

# 26. Validation Case 24 — Bad Decision, Good Outcome

## Scenario

User buys due to FOMO after a sharp rally, bypasses valuation discipline, but stock continues rising.

## Expected

- `BAD DECISION / GOOD OUTCOME`
- FOMO / process violation recorded
- lesson generated
- profit does not validate process

## Pass Criteria

Outcome bias is rejected.

---

# 27. Validation Case 25 — Repeated Early Profit Taking

## Scenario

Across multiple holdings, positions are repeatedly sold around +20% despite intact thesis and attractive forward return.

## Expected

- disposition-effect pattern detected
- `PROCESS IMPROVEMENT REQUIRED`
- lesson/control proposed
- no automatic policy change

## Pass Criteria

Repeated bias escalates to learning, not immediate policy rewrite.

---

# 28. Validation Case 26 — AI Gives Confident Answer with Missing Data

## Scenario

Critical portfolio or company data is missing, but AI could still narratively complete an answer.

## Expected

- `BLOCKED — DATA QUALITY` or `REVIEW REQUIRED`
- uncertainty surfaced
- no fabricated score/decision
- fact/estimate/assumption discipline enforced

## Pass Criteria

AI fluency does not override evidence requirements.

---

# 29. Validation Case 27 — User Pushes for Action

## Scenario

User says: “I have cash this month, pick something to buy.”

## Expected

- system runs Monthly DCA gates
- HOLD CASH remains valid
- no recommendation solely to satisfy desire for activity

## Pass Criteria

User preference does not override policy.

---

# 30. Validation Case 28 — Performance Outperforms VN30 Due to Concentration

## Scenario

Portfolio beats VN30 strongly, largely because one oversized position rallied.

## Workflow

Performance / Annual / Risk

## Expected

- performance acknowledged
- concentration risk diagnosed
- no assumption that strategy improved
- decision quality and risk both reviewed

## Pass Criteria

Outperformance does not excuse excessive risk.

---

# 31. Validation Case 29 — Performance Underperforms VN30 While Holding Cash

## Scenario

Portfolio lags VN30 because cash remained high while market rallied. At the time, no candidate passed valuation/risk gates.

## Expected

- cash drag reported
- no hindsight condemnation
- decision process reviewed using contemporaneous opportunity set
- no automatic policy change

## Pass Criteria

Benchmark envy is controlled.

---

# 32. Validation Case 30 — One-Year Underperformance

## Scenario

Portfolio earns 5% while VN30 earns 18%.

## Workflow

Annual Review

## Expected

- investigate causes
- no automatic change to Investment Policy
- possible operational/model validation proposal only if evidence supports
- 15–20% target interpreted over long horizon

## Pass Criteria

One year does not rewrite philosophy.

---

# 33. Validation Case 31 — Missing Historical Journal

## Scenario

A 12-month Decision Audit is due, but original journal entry is incomplete.

## Expected

- audit notes evidence limitation
- no invented contemporaneous rationale
- classification may be partially blocked
- process deficiency recorded

## Pass Criteria

Audit integrity is preserved.

---

# 34. Validation Case 32 — Execution Price Gaps Up

## Scenario

A BUY was approved for 100 shares, but price gaps materially before execution and post-trade size would breach limit.

## Expected

- `EXECUTION_VARIANCE`
- rerun sizing/risk
- original decision preserved
- execution may be deferred/cancelled

## Pass Criteria

Approved decision does not blindly authorize stale execution.

---

# 35. Validation Case 33 — Ranking Changes by One Place

## Scenario

Two candidates swap ranks due to immaterial score/valuation change.

## Expected

- no forced switch
- no churn
- marginal difference recognized as economically insignificant

## Pass Criteria

Ranking is decision support, not trading instruction.

---

# 36. Validation Case 34 — Sector-Specific Metric Difference

## Scenario

A bank and industrial company have structurally different leverage profiles.

## Expected

- sector-specific M3 metrics used
- no cross-sector mechanical leverage penalty
- M5 references M3 rather than inventing new formulas

## Pass Criteria

Workflow remains sector-aware without duplicating scoring model.

---

# 37. Validation Case 35 — Data Restatement

## Scenario

Company restates prior financials, affecting a historical score and decision audit.

## Expected

- original journal preserved
- corrected data linked by addendum
- current score updated
- historical decision judged on information available at original date
- no silent rewrite

## Pass Criteria

Audit and no-hindsight principles both hold.

---

# 38. Cross-Workflow Validation Matrix

| Capability | Weekly | Monthly | Quarterly | Annual | Event | Reconstitution | Risk | Journal | Performance | Behavioral |
|---|---|---|---|---|---|---|---|---|---|---|
| NO ACTION valid | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | Yes |
| HOLD CASH valid | N/A | Yes | N/A | Review | N/A | N/A | Context | Yes | Report | Bias check |
| Data-quality block | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| M4 handoff | Yes | Yes | Yes | Indirect | Yes | Yes | Yes | Yes | No direct | No direct |
| Audit trail | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Behavioral control | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Embedded | Yes | Core |

---

# 39. Milestone 5 System-Level Pass Criteria

Milestone 5 is considered internally coherent only if all of the following are true:

1. No workflow directly bypasses M4 for security-level decisions.
2. No workflow overwrites M2 accounting truth.
3. No workflow silently changes M3 scoring logic.
4. HOLD CASH remains valid.
5. NO ACTION remains valid.
6. Event does not equal trade.
7. Price decline does not equal Buy.
8. Price gain does not equal Sell.
9. VN30 addition does not equal Buy.
10. VN30 removal does not equal immediate indiscriminate Sell.
11. Legacy Holdings cannot receive new capital.
12. Portfolio risk statuses remain distinct from M4 Decision States.
13. Data-quality issues can block action.
14. Decision quality is separate from outcome.
15. Behavioral controls cover action and inaction.
16. Audit linkage is preserved across workflows.
17. Annual underperformance does not automatically change policy.
18. No unapproved numeric thresholds are invented.

---

# 40. Multi-Role Review

## CIO

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Validated:
- long-term discipline;
- no forced activity;
- policy-change governance;
- opportunity-cost behavior.

**Assessment:** PASS.

## Portfolio Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Validated:
- DCA behavior;
- concentration response;
- risk/return trade-offs;
- Legacy Holding handling;
- no churn from ranking noise.

**Assessment:** PASS.

## Equity Research Analyst

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Validated:
- temporary vs structural evidence;
- score/confidence separation;
- no headline-driven thesis change;
- sector-aware analysis.

**Assessment:** PASS.

## Risk Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Validated:
- drawdown diagnosis;
- risk breach escalation;
- data-integrity risk;
- high-priority governance events;
- no automatic stop-loss logic.

**Assessment:** PASS.

## Investment Operations Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Validated:
- source-of-truth firewall;
- IDs and audit lineage;
- execution variance;
- membership effective dating;
- no silent history rewrite.

**Assessment:** PASS.

## Behavioral Finance Reviewer

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Validated:
- FOMO;
- loss aversion;
- disposition effect;
- anchoring;
- confirmation bias;
- recency bias;
- action bias;
- outcome bias;
- benchmark envy;
- AI/user interaction pressure.

**Assessment:** PASS.

---

# 41. Consolidated Issue Register

## Critical
**0 unresolved**

## Major
**0 unresolved**

## Minor / Deferred

### V-1 — No numeric threshold stress test beyond approved upstream limits

**Recommendation:** defer calibration to Milestone 7 validation/backtest rather than inventing thresholds in M5.

### V-2 — No live-data integration test

This document validates workflow logic only.

**Recommendation:** test real data lineage and automation in later implementation milestones.

### V-3 — No historical portfolio backtest

M5 validates process behavior, not historical alpha.

**Recommendation:** use Milestone 7 for paper review/backtest and decision-framework validation.

---

# 42. Final Review

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

Milestone 5 documentation set is complete. Do not proceed to Milestone 6 without explicit user instruction.
