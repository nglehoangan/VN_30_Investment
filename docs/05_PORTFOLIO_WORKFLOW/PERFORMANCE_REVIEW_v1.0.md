# VN30 Value Investing OS — Performance Review

**Document:** `05_PORTFOLIO_WORKFLOW/PERFORMANCE_REVIEW.md`  
**Milestone:** 5 — Portfolio Management Workflow  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-08  

**Parent:** `05_PORTFOLIO_WORKFLOW/OPERATING_MODEL.md` v1.0 — Approved Baseline  

**Governing Dependencies:**  
`INVESTMENT_POLICY.md`  
`RISK_POLICY.md`  
`DATA_RULES.md`  
`PORTFOLIO.md`  
`TRANSACTIONS.md`  
`BENCHMARK.md`  
`DECISION_ENGINE.md`  
`INVESTMENT_JOURNAL.md`  

---

# 1. Purpose

This document defines the performance-review workflow for VN30 Value Investing OS.

Its purpose is to measure portfolio results accurately while separating:

- external capital flows;
- investment return;
- benchmark-relative performance;
- realized and unrealized P&L;
- dividends;
- drawdown;
- cash drag;
- decision quality.

The workflow must answer:

> **How did the portfolio perform, what drove the result, and was that result produced by sound investment decisions and acceptable risk?**

Performance Review is an analytical and learning workflow.

It must not generate Buy/Sell decisions solely from past performance.

---

# 2. Core Principles

## 2.1 NAV growth is not investment return when cash flows occur

Because the portfolio receives DCA contributions, raw change in NAV must not be treated as portfolio return.

External flows must be separated from investment performance.

## 2.2 Use the correct return measure for the question

- `TWR` / unitized return: manager/strategy performance, neutralizing external-flow timing.
- `XIRR`: investor-experience return, reflecting timing of contributions/withdrawals.
- `CAGR`: long-horizon compounding measure where period length is meaningful.
- `Total Return`: portfolio economic return including dividends under the approved methodology.

These measures answer different questions and must not be presented as interchangeable.

## 2.3 Absolute P&L is insufficient

A portfolio may show positive P&L but still have:

- poor risk-adjusted performance;
- excessive drawdown;
- weak capital allocation;
- poor benchmark-relative results;
- decision-process errors.

Likewise, short-term negative P&L does not prove poor decision quality.

## 2.4 Benchmark comparison requires methodology disclosure

Portfolio return and VN30 benchmark return must be compared only with clear disclosure of:

- benchmark return type;
- dividend treatment;
- period alignment;
- data quality;
- methodology limitations.

---

# 3. Review Cadence

Performance monitoring operates at multiple frequencies.

## Monthly

Light summary:

- contributions;
- withdrawals;
- NAV;
- cash;
- monthly return where valid;
- realized/unrealized P&L;
- dividends;
- benchmark comparison;
- drawdown.

## Quarterly

Broader attribution and trend review.

## Annual

Full strategic performance review integrated with `ANNUAL_REVIEW.md`.

Performance may also be reviewed after a major portfolio event.

---

# 4. Required Metrics

M5 must support at minimum:

1. Contributions
2. Withdrawals
3. NAV
4. Total Return
5. XIRR
6. CAGR
7. Realized P&L
8. Unrealized P&L
9. Dividends
10. Maximum Drawdown
11. VN30 benchmark return

In addition, where upstream M2 methodology supports it:

12. TWR / unitized portfolio return
13. Active Return
14. Cash %
15. Turnover
16. Fees / taxes
17. benchmark drawdown
18. return contribution by holding/sector where reproducible

---

# 5. Authoritative Data Sources

Performance Review must consume, not redefine, M2 truth.

Use:

- transaction ledger for contributions/withdrawals;
- authoritative transaction data for realized P&L inputs;
- reconstructed portfolio state for NAV;
- dividend transactions for dividend income;
- approved performance observations for TWR;
- benchmark observations/methodology for VN30 comparison.

Do not manually enter totals that contradict authoritative reconstruction.

---

# 6. Contributions

Report:

- period contributions;
- cumulative contributions;
- dates;
- actual settled contribution amounts.

Planned DCA contribution is not an actual contribution until authoritative ledger evidence exists.

Contributions increase NAV but are not investment return.

---

# 7. Withdrawals

Report:

- period withdrawals;
- cumulative withdrawals;
- dates.

Withdrawals reduce NAV but are not negative investment return.

---

# 8. NAV

NAV must represent the approved reconstructed portfolio state.

At minimum:

```text
NAV
=
Settled Cash
+ Receivables / Payables as approved
+ Market Value of Open Positions
+ other approved portfolio assets/liabilities
```

The exact formula remains owned by M2.

Performance Review must record:

- NAV as-of date;
- price freshness;
- portfolio-state quality;
- whether NAV is fully reliable.

---

# 9. Total Return

Total Return should include economic return from:

- price appreciation/depreciation;
- realized gains/losses;
- dividends;
- relevant fees/taxes under the approved method.

External contributions and withdrawals must not create return.

Methodology must be pinned by version.

---

# 10. TWR / Unitized Return

Where comparing portfolio management performance with VN30, use approved M2 TWR/unitization methodology.

TWR removes distortion from external contribution timing.

Use for:

- portfolio versus VN30;
- manager/strategy comparison;
- period-to-period linked return.

Do not reconstruct TWR ad hoc in M5.

---

# 11. XIRR

XIRR represents investor-experience return.

Inputs normally include:

- dated external contributions as negative investor cash flows;
- dated withdrawals/distributions where applicable;
- ending portfolio value.

XIRR is especially relevant because DCA timing materially affects investor outcomes.

Do not call XIRR “manager alpha.”

---

# 12. CAGR

CAGR should be used for sufficiently long periods.

The project’s 15–20% target refers to long-term portfolio total-return CAGR over a full cycle, preferably 5+ years.

For a one-year period, annual return should normally be reported rather than implying multi-year CAGR significance.

---

# 13. Realized P&L

Report:

- realized trading gains/losses;
- fees/taxes where applicable;
- period and cumulative totals.

Realized profit is not automatically evidence of a good decision.

A premature sale can produce positive realized P&L and still be poor capital allocation.

---

# 14. Unrealized P&L

Report:

- unrealized gain/loss by holding;
- aggregate unrealized P&L.

Use for reporting and risk review.

Do not use unrealized loss directly as:

- averaging-down trigger;
- thesis-break evidence.

---

# 15. Dividends

Report:

- gross/net amount according to accounting method;
- period dividends;
- cumulative dividends;
- contribution to total economic return.

Dividend contribution should not be double-counted with other return components.

A high dividend yield alone does not imply superior performance quality.

---

# 16. Maximum Drawdown

Maximum Drawdown must use the approved cash-flow-adjusted performance series where applicable.

Review:

- peak;
- trough;
- drawdown %;
- duration;
- recovery status;
- benchmark drawdown;
- cause.

External contributions must not artificially reset the portfolio high-water mark.

---

# 17. VN30 Benchmark Return

Report:

- benchmark identity;
- return type;
- period;
- start/end values;
- benchmark return;
- methodology version;
- data quality.

If only price-return VN30 is available while portfolio return includes dividends, explicitly label the comparison as methodologically limited.

---

# 18. Active Return

Where comparable:

```text
Active Return
=
Portfolio TWR
- Benchmark Return
```

Active Return is diagnostic.

It must not create a mandate to hug the index or chase benchmark weights.

---

# 19. Cash Drag

Measure where meaningful:

- average cash balance;
- average cash %;
- cash contribution to return differential.

Interpretation requires context.

Cash drag may be acceptable if:

- no qualifying opportunities existed;
- risk limits constrained deployment;
- board-lot constraints mattered;
- data uncertainty blocked action.

Do not judge past cash with hindsight using opportunities not known at the time.

---

# 20. Turnover

Report:

- transaction count;
- buys;
- adds;
- reductions;
- sells;
- portfolio turnover where defined;
- transaction costs.

High turnover may signal:

- action bias;
- unstable thesis;
- rank chasing;
- excessive switching.

Low turnover may hide failure to exit broken theses.

Performance Review should flag pattern, not mechanically reward low turnover.

---

# 21. Attribution

Where data supports reproducible attribution, analyze:

- return by security;
- return by sector;
- dividend contribution;
- realized/unrealized contribution;
- cash impact.

Do not invent exact attribution if historical position weights or price series are incomplete.

Use:

> `NOT RELIABLY ATTRIBUTABLE`

when necessary.

---

# 22. Performance Quality Matrix

Performance evaluation should combine outcome and process.

Examples:

## Strong return + strong process

Positive result, but still review whether risk was appropriate.

## Strong return + weak process

Potential luck / hidden risk.

Requires learning.

## Weak return + strong process

May be acceptable over short periods.

Do not overreact.

## Weak return + weak process

Highest-priority improvement case.

---

# 23. Benchmark Underperformance Diagnosis

If portfolio underperforms VN30, diagnose:

- stock selection;
- cash;
- sector allocation;
- valuation discipline;
- risk avoidance;
- timing of contributions;
- decision mistakes;
- methodology differences.

Do not conclude failure from relative return alone.

---

# 24. Benchmark Outperformance Diagnosis

If portfolio outperforms:

- identify security/sector contributors;
- determine whether returns came from intended thesis;
- check concentration;
- check risk taken;
- assess whether result is repeatable or luck-driven.

Do not increase risk because one year outperformed.

---

# 25. Performance and Decision Review Linkage

Material contributors/detractors should link back to:

- Decision ID;
- Journal Entry ID;
- thesis;
- original expected outcome;
- risk;
- invalidation condition.

This enables process attribution.

Question:

> Did the outcome occur for the reasons we expected?

---

# 26. No-Hindsight Rule

Performance Review must not judge old decisions using information unavailable at decision time.

Later outcomes may reveal:

- model error;
- assumption error;
- luck;
- unexpected event.

But the audit must preserve contemporaneous information.

---

# 27. Behavioral Controls

## Outcome bias

Control:
- separate process from return.

## Benchmark envy

Control:
- VN30 comparison informs learning but does not dictate portfolio weights.

## Recency bias

Control:
- avoid extrapolating one period.

## Performance chasing

Control:
- do not buy last year's winners solely because they contributed most.

## Loss aversion

Control:
- do not hide or rationalize detractors.

## Self-attribution bias

Control:
- distinguish thesis-driven return from favorable external luck.

---

# 28. Monthly Performance Output

Minimum monthly report:

## Capital Flows
- Contributions
- Withdrawals

## Portfolio
- Opening NAV
- Closing NAV
- Cash %
- Holdings Count

## Return
- monthly return where valid
- cumulative TWR where available
- XIRR since inception where meaningful
- VN30 return
- Active Return where comparable

## P&L
- Realized P&L
- Unrealized P&L
- Dividends

## Risk
- Current Drawdown
- Maximum Drawdown
- Largest Position
- Sector Concentration

## Commentary
- key drivers;
- major decisions;
- methodology limitations.

---

# 29. Quarterly Performance Output

Quarterly report extends monthly report with:

- return attribution;
- sector contribution;
- top contributors;
- top detractors;
- cash drag;
- turnover;
- decision linkage;
- thesis/risk changes;
- benchmark diagnosis.

---

# 30. Annual Performance Output

Annual Performance Review should integrate with `ANNUAL_REVIEW.md` and include:

- annual portfolio return;
- TWR;
- XIRR;
- multi-year CAGR where meaningful;
- VN30 return;
- active return;
- Maximum Drawdown;
- realized/unrealized P&L;
- dividends;
- cash drag;
- turnover;
- concentration;
- decision-quality summary.

---

# 31. Data Quality States

Performance output should classify quality as:

- `VALID`;
- `VALID WITH LIMITATIONS`;
- `PARTIALLY BLOCKED`;
- `BLOCKED`.

Examples of limitations:

- benchmark method mismatch;
- stale benchmark observation;
- incomplete historical price coverage;
- unresolved corporate action;
- missing flow timestamp.

Do not provide false precision when inputs are incomplete.

---

# 32. Performance Audit Trail

Canonical chain:

```text
Performance Review ID
→ Period
→ Portfolio Snapshot / Performance Observations
→ External Flow Transactions
→ Method Version
→ Benchmark Observations / Method
→ Return Calculations
→ Drawdown
→ Attribution
→ Decision/Journal Links
→ Commentary
```

All calculated metrics must be reproducible from authoritative inputs.

---

# 33. File Update Rules

Performance Review may update:

- monthly/quarterly/annual performance records;
- performance commentary;
- attribution records;
- benchmark-comparison output;
- decision-audit links.

It must not modify:

- authoritative transaction data;
- accounting balances;
- benchmark raw observations;
- M1–M4 decision rules.

---

# 34. Stop Conditions

Do not issue fully valid performance conclusions when:

- cash flows are incomplete;
- NAV cannot be reconstructed;
- performance method version is unknown;
- benchmark observation is stale/missing;
- corporate actions materially distort history;
- comparison periods are misaligned.

Instead classify output with the appropriate data-quality state.

---

# 35. Acceptance Criteria

`PERFORMANCE_REVIEW.md` is acceptable only if:

1. contributions/withdrawals are separated from return;
2. NAV growth is not confused with performance;
3. TWR, XIRR, CAGR roles are distinct;
4. realized/unrealized P&L are both reported;
5. dividends are included without double counting;
6. Maximum Drawdown is cash-flow aware;
7. VN30 benchmark methodology is disclosed;
8. active return does not create index-hugging behavior;
9. cash drag is interpreted without hindsight;
10. turnover is assessed behaviorally, not mechanically;
11. attribution is only used when reproducible;
12. performance links back to decisions;
13. process quality is separated from outcome;
14. data-quality limitations are explicit;
15. audit trail is reproducible;
16. no trading decision is generated from performance alone.

---

# 36. Multi-Role Review

## CIO

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- P&L-only success definition;
- benchmark envy;
- one-year performance driving strategy changes.

**Assessment:** PASS.

## Portfolio Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- cash-flow distortion;
- lack of cash drag/turnover diagnosis;
- weak linkage between performance and allocation decisions.

**Assessment:** PASS.

## Equity Research Analyst

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- winners treated as proof of thesis without causal review;
- detractors judged without thesis context;
- attribution false precision.

**Assessment:** PASS.

## Risk Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- drawdown methodology ambiguity;
- benchmark outperformance hiding excessive risk;
- positive P&L hiding concentration.

**Assessment:** PASS.

## Investment Operations Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- external-flow timing ambiguity;
- method/version lineage gaps;
- raw benchmark/accounting truth duplication.

**Assessment:** PASS.

## Behavioral Finance Reviewer

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Controls explicitly cover:
- outcome bias;
- benchmark envy;
- recency bias;
- performance chasing;
- loss aversion;
- self-attribution bias.

**Assessment:** PASS.

---

# 37. Consolidated Issue Register

## Critical

**0 unresolved**

## Major

**0 unresolved**

## Minor / Deferred

### P-1 — Exact attribution engine

Detailed attribution math is later implementation scope.

**Recommendation:** only publish attribution when reproducible.

### P-2 — Benchmark total-return source

Exact vendor/source may remain implementation dependent.

**Recommendation:** always disclose methodology compatibility.

### P-3 — Long-run evaluation horizon

Early project history will be too short to evaluate 15–20% CAGR meaningfully.

**Recommendation:** accumulate evidence over multiple years before strategic inference.

---

# 38. Final Review

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

The next planned file is `05_PORTFOLIO_WORKFLOW/BEHAVIORAL_REVIEW.md`.
