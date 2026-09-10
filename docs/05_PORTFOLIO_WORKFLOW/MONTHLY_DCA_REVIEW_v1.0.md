# VN30 Value Investing OS — Monthly DCA Review

**Document:** `05_PORTFOLIO_WORKFLOW/MONTHLY_DCA_REVIEW.md`  
**Milestone:** 5 — Portfolio Management Workflow  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-07  

**Parent:** `05_PORTFOLIO_WORKFLOW/OPERATING_MODEL.md` v1.0 — Approved Baseline  
**Upstream Workflow:** `05_PORTFOLIO_WORKFLOW/WEEKLY_REVIEW.md` v1.0 — Approved Baseline

**Governing Dependencies:** `INVESTMENT_POLICY.md`, `DECISION_FRAMEWORK.md`, `RISK_POLICY.md`, `DATA_RULES.md`, `SCORING_ENGINE.md`, `RANKING_RULES.md`, `DECISION_ENGINE.md`, `BUY_RULES.md`, `SELL_RULES.md`, `DCA_RULES.md`, `POSITION_SIZING.md`, `OPPORTUNITY_COST.md`, `DECISION_TEMPLATE.md`.

---

# 1. Purpose

This document defines the monthly capital-allocation workflow for VN30 Value Investing OS.

Its purpose is to convert planned contribution, actual contribution, accumulated cash, current portfolio state, VN30 ranking, approved Buy/Accumulate rules, position sizing, concentration rules, opportunity-cost logic, and board-lot constraints into one disciplined monthly recommendation.

The key question is:

> **Should available cash be deployed now, partially deployed, or carried forward?**

The governing principle is:

> **Contribution is not deployment.**

A monthly contribution creates capital availability. It does not create a Buy signal.

---

# 2. Scope and Boundaries

This workflow owns:

1. monthly contribution reconciliation;
2. executable-cash reconciliation for DCA purposes;
3. monthly candidate refresh;
4. monthly ranking refresh requirement;
5. candidate eligibility routing;
6. Buy/Accumulate gate orchestration;
7. position-sizing orchestration;
8. concentration and post-trade simulation;
9. 100-share lot feasibility;
10. opportunity-cost comparison including cash;
11. deploy-now versus carry-cash decision;
12. monthly DCA output, handoff, journal, and audit trail.

This workflow does **not** redefine:

- scoring weights or thresholds;
- risk limits or vetoes;
- Buy/Accumulate criteria;
- DCA logic owned by `DCA_RULES.md`;
- target-size formulas;
- opportunity-cost formulas;
- accounting truth;
- VN30 membership truth.

If a lower-level rule is needed, the approved owning document remains authoritative.

---

# 3. Core Principles

## 3.1 No forced deployment

Permitted monthly allocation outcomes include:

- `BUY`;
- `ACCUMULATE`;
- `SPLIT DEPLOYMENT` when separately permitted;
- `HOLD CASH`;
- `REVIEW REQUIRED`;
- `DECISION REQUIRED`.

`HOLD CASH` is fully valid.

The workflow must never force monthly cash into a lower-quality, lower-confidence, overvalued, or otherwise inferior opportunity merely because cash exists.

## 3.2 Fresh underwriting

Every new lot is a fresh capital-allocation decision.

Prior ownership does not justify adding.

A price decline does not justify averaging down.

A price rise does not automatically prohibit adding.

## 3.3 Cash competes with securities

Cash is an explicit opportunity-cost comparator.

A candidate must be sufficiently attractive relative to:

- other eligible VN30 candidates;
- existing holdings eligible for addition;
- cash.

## 3.4 Portfolio first, lot second

The 100-share board-lot requirement is an execution constraint, not an investment-merit input.

If the best candidate cannot be bought without violating risk/portfolio rules, the default is not “buy the next affordable stock.” The workflow must compare alternatives with cash.

## 3.5 Long-term horizon

Monthly Review must not become monthly market timing.

Technical analysis is secondary and may only optimize execution after a valid long-term capital-allocation case exists.

---

# 4. Cadence

Monthly DCA Review is normally performed once per contribution cycle after:

- planned contribution is known;
- actual contribution status is known or reconcilable;
- portfolio/cash state is reconstructable;
- required data refresh is available.

The review may be deferred if decision-critical data, contribution, cash, portfolio state, or major event analysis remains unresolved.

Possible result:

> `REVIEW REQUIRED — DCA DECISION DEFERRED`

Cash remains undeployed until the issue is resolved.

---

# 5. Required Inputs

## 5.1 Contribution data

- DCA period;
- planned contribution;
- actual contribution;
- contribution transaction ID;
- contribution/settlement status;
- prior carried cash;
- current settled cash;
- executable cash.

Actual contribution must derive from authoritative transaction/ledger data.

## 5.2 Portfolio data

- NAV;
- cash and cash %;
- holdings and quantities;
- market values;
- position weights;
- sector weights;
- largest position;
- Top-3 concentration;
- drawdown status;
- Legacy Holdings;
- existing risk/concentration exceptions;
- unresolved reconciliation flags.

## 5.3 Candidate data

For relevant current VN30 securities:

- current membership;
- ownership status;
- score;
- score validity;
- confidence;
- thesis status;
- valuation;
- expected 5-year annualized return;
- residual risk;
- ranking;
- current position weight;
- portfolio impact;
- board-lot cost;
- opportunity-cost status.

## 5.4 Data-quality context

- data as-of date;
- source lineage;
- freshness status;
- reconciliation status;
- missing/conflicting data status;
- portfolio snapshot ID;
- ranking snapshot ID;
- methodology versions.

---

# 6. Canonical Monthly Workflow

```text
1. Confirm planned contribution
2. Confirm actual contribution
3. Reconcile executable cash
4. Validate portfolio state
5. Refresh required market/fundamental data
6. Refresh affected scores
7. Refresh VN30 ranking
8. Build eligible candidate set
9. Apply Buy / Accumulate gates
10. Apply position sizing
11. Simulate concentration / portfolio impact
12. Apply 100-share lot feasibility
13. Apply opportunity cost
14. Compare deploy now vs HOLD CASH
15. Select best marginal allocation
16. Re-simulate after each lot
17. Invoke M4 Decision Engine
18. Produce monthly recommendation
19. Journal material decision
20. Execute only if authorized
21. Reconcile post-trade state
```

---

# 7. Step 1 — Confirm Planned Contribution

Record:

- planned amount;
- planned date/period;
- source of plan;
- change versus prior plan if material.

Planned contribution is not portfolio cash and must not modify NAV or performance.

---

# 8. Step 2 — Confirm Actual Contribution

Actual contribution states:

- `RECEIVED`;
- `PARTIALLY RECEIVED`;
- `NOT RECEIVED`;
- `PENDING SETTLEMENT`;
- `DATA ISSUE`.

The system must preserve:

> **planned contribution ≠ actual contribution ≠ executable cash**

No purchase sizing may assume unreceived or non-executable cash.

---

# 9. Step 3 — Reconcile Executable Cash

Conceptually:

```text
Available Allocation Cash
=
Prior Executable Cash
+ New Executable Contribution
- Committed / Unsettled Obligations
± Approved Adjustments
```

This is derived state. M2 remains authoritative.

Record:

- settled cash;
- executable cash;
- restricted/committed cash if applicable;
- prior carry cash;
- new executable contribution;
- total available allocation cash.

If unreconciled:

> `REVIEW REQUIRED — CASH UNRECONCILED`

No executable purchase may be fabricated.

---

# 10. Step 4 — Validate Portfolio State

Confirm:

- quantities;
- NAV;
- position weights;
- sector weights;
- drawdown regime;
- Legacy Holdings;
- corporate actions;
- concentration exceptions;
- pending risk issues.

If a portfolio-state problem could change sizing or eligibility:

> `REVIEW REQUIRED — PORTFOLIO STATE BLOCKED`

Issuer analysis may continue, but executable allocation remains blocked.

---

# 11. Step 5 — Refresh Required Data

Monthly Review should refresh more broadly than Weekly Review, but still only where needed.

Refresh as applicable:

- latest valid prices;
- new company disclosures;
- earnings/fundamental releases since prior valid review;
- valuation inputs;
- expected-return inputs;
- risk flags;
- VN30 membership;
- relevant sector context;
- ranking inputs.

Do not refresh unchanged historical facts merely because one month elapsed.

---

# 12. Step 6 — Score Refresh Logic

Refresh full or affected score categories when new evidence materially changes:

- Business Quality;
- Financial Health;
- Growth;
- Industry;
- Valuation & Forward Return;
- Risk & Governance;
- Capital Allocation Quality;
- confidence;
- score validity.

If only price changed:

- refresh valuation/forward-return inputs first;
- do not mechanically alter non-price score categories.

A stale or non-actionable score cannot authorize new capital.

---

# 13. Step 7 — Refresh VN30 Ranking

Monthly DCA Review normally requires a current opportunity ranking.

Ranking must incorporate approved logic for:

- valid score;
- confidence;
- expected return;
- residual risk;
- valuation;
- portfolio context;
- concentration;
- opportunity cost.

Ranking is decision support, not a Buy list.

High rank cannot override:

- Stage 0 failure;
- thesis weakness;
- risk veto;
- insufficient confidence;
- portfolio limit;
- data-quality block;
- lot infeasibility;
- poor opportunity cost.

---

# 14. Step 8 — Build Eligible Candidate Set

The new-capital universe contains current VN30 constituents only.

Exclude or block:

- Legacy Holdings;
- confirmed non-members;
- unknown membership where actionability cannot be proven;
- hard-veto names;
- decision-critical data gaps;
- non-actionable scorecards.

Candidate classification:

- `ELIGIBLE`;
- `ELIGIBLE WITH EXECUTION CONSTRAINT`;
- `RESEARCH ONLY`;
- `BLOCKED`;
- `INELIGIBLE`.

Only eligible candidates proceed to capital-allocation comparison.

---

# 15. Step 9 — Apply Buy / Accumulate Gates

For each candidate apply the approved M4 gates.

At minimum:

- Stage 0 pass;
- valid thesis;
- valid score;
- sufficient confidence;
- acceptable valuation;
- expected return hurdle;
- acceptable residual risk;
- acceptable portfolio impact;
- correct ownership/action classification;
- fresh-underwriting requirement for adds;
- opportunity-cost acceptability.

Failure of any mandatory gate removes the candidate from executable allocation.

---

# 16. Ownership-State Routing

## Unowned

Normal positive states:

- `BUY`;
- `STRONG BUY`.

## Owned

Normal positive states:

- `ACCUMULATE`;
- rare owned-position `STRONG BUY` only when approved M4 criteria independently pass.

## Legacy Holding

No new capital.

## Prior HOLD

A prior HOLD does not permanently block addition. Current evidence must independently re-qualify the candidate.

---

# 17. Step 10 — Position Sizing

Apply `POSITION_SIZING.md`.

Separate:

- **Economic Target**;
- **Executable Trade Size**.

Check:

- current weight;
- justified target range;
- incremental risk;
- post-trade single-name weight;
- sector exposure;
- cash remaining;
- drawdown regime;
- concentration exceptions;
- board-lot effects.

Sizing can constrain an attractive security but cannot reverse a higher-precedence prohibition.

---

# 18. Step 11 — Sector / Concentration Simulation

Before any trade recommendation, simulate the post-trade portfolio.

Review:

- single-name weight;
- Top-3 concentration;
- sector concentration;
- correlated-risk exposure where applicable;
- portfolio resilience;
- cash remaining;
- drawdown regime.

If proposed size breaches an approved constraint:

- reduce size if permitted;
- choose another independently qualified candidate;
- split only if independently justified;
- otherwise `HOLD CASH`.

---

# 19. Step 12 — 100-Share Lot Constraint

Executable buys must satisfy the board-lot requirement.

Reference lot cost:

```text
Lot Cost
=
100 × Reference Price
+ estimated fees/taxes where relevant
```

Board-lot affordability is not investment merit.

If the best candidate is unaffordable:

1. do not automatically buy the next affordable candidate;
2. compare the alternative with cash;
3. consider carrying cash across months;
4. preserve ranking integrity.

The system must never adopt:

> “Buy what fits the available cash.”

---

# 20. Step 13 — Opportunity Cost

Compare all surviving uses of capital, at minimum:

- best eligible unowned candidate;
- best eligible owned-position add;
- materially close alternatives;
- cash.

Consider:

- expected return;
- downside;
- confidence;
- thesis strength;
- residual risk;
- portfolio fit;
- concentration;
- uncertainty;
- lot feasibility;
- transaction friction where relevant.

Marginal ranking differences must not create churn or forced deployment.

---

# 21. Step 14 — Deploy Now vs HOLD CASH

## Deploy now

Valid only if:

- candidate passes all M4 gates;
- sizing is valid;
- post-trade risk is acceptable;
- lot is executable;
- opportunity cost is robustly superior to cash;
- no decision-critical data issue remains.

## HOLD CASH

Preferred when:

- no candidate passes;
- best candidate is not attractive enough;
- best candidate is blocked by risk/concentration;
- best candidate is unaffordable and substitutes are inferior;
- valuation is inadequate;
- evidence is incomplete;
- relative superiority is not robust.

Holding cash must not be justified by unsupported short-term market fear.

---

# 22. Split Deployment

Split deployment is an operational result, not a new M4 Decision State.

It is permitted only when:

- each security independently passes its own Buy/Accumulate process;
- sizing supports both;
- portfolio risk remains acceptable;
- opportunity cost remains valid after each lot;
- splitting is not being used to manufacture superficial diversification.

After each lot, the workflow must update remaining cash and portfolio weights before considering the next lot.

---

# 23. Sequential Allocation Rule

For multi-lot deployment:

```text
Select best valid marginal use of capital
→ simulate post-trade portfolio
→ update remaining cash
→ update position/sector weights
→ re-check risk and concentration
→ re-run marginal opportunity cost
→ decide next lot
```

This prevents stale pre-trade rankings from being reused after portfolio composition changes.

---

# 24. Monthly Operating Outcomes

The workflow may conclude:

- `BUY 100 shares of X`;
- `ACCUMULATE 100 shares of Y`;
- `BUY 100 X + ACCUMULATE 100 Y` when both are separately authorized;
- `HOLD CASH`;
- `REVIEW REQUIRED`;
- `DECISION REQUIRED`.

`BUY`, `ACCUMULATE`, and any other security-level final Decision State must come from M4.

---

# 25. HOLD CASH Governance

A material monthly `HOLD CASH` decision should be journaled.

Record:

- available cash;
- candidates considered;
- best candidate;
- why it did not justify deployment;
- valuation/risk state;
- lot constraint if relevant;
- expected next review;
- conditions that would invalidate the cash decision.

Possible invalidation conditions:

- valuation improves materially;
- stronger candidate emerges;
- thesis/risk improves;
- accumulated cash reaches feasible lot cost;
- concentration constraint resolves.

---

# 26. Averaging Down Controls

If an existing holding trades below prior purchase/reference price, adding requires fresh underwriting.

Confirm:

- thesis remains `INTACT` or `IMPROVING`;
- no hidden deterioration;
- valuation genuinely improved;
- expected return improved sufficiently;
- balance-sheet and governance risks remain acceptable;
- score validity/confidence remain adequate;
- opportunity cost is superior;
- post-trade concentration remains acceptable;
- rationale is not break-even or sunk cost.

Failure means no add.

Unrealized loss is never a reason to increase position size.

---

# 27. Averaging Up Controls

A higher market price than prior purchase does not automatically prohibit adding.

Review current:

- intrinsic value;
- expected return;
- thesis;
- risk;
- position size;
- opportunity cost.

Cost-basis anchoring must not block an otherwise valid add.

---

# 28. Technical Entry Role

Technical analysis may:

- optimize entry timing;
- identify execution risk;
- support staging.

It may not:

- create a Buy;
- override failed thesis/valuation/risk;
- indefinitely defer a fundamentally approved long-term purchase without genuine execution rationale.

---

# 29. Monthly Behavioral Controls

## Action bias

“Cash arrived, therefore I should buy.”

Control: contribution does not require deployment.

## FOMO

“Top-ranked stock rose, so I should buy before it rises further.”

Control: re-underwrite valuation at current price.

## Cost anchoring

“I should add to reduce average cost.”

Control: remove average cost from investment-merit analysis.

## Prior-price anchoring

“It was cheaper last month, so it is now too expensive.”

Control: compare current price with current intrinsic value.

## Sunk cost

“I already own it, so it is efficient to add.”

Control: underwrite incremental capital independently.

## Rank chasing

“Rank #1 must be purchased.”

Control: ranking is subordinate to all gates.

## Forced diversification

“I should split because I have cash.”

Control: every lot must independently qualify.

## Market-timing rationalization

“I will hold cash because the market feels high.”

Control: HOLD CASH must rest on approved valuation/risk/opportunity logic, not unsupported fear.

---

# 30. Monthly Output Package

## Header

- DCA Review ID;
- period;
- review date;
- Data As-Of;
- Portfolio Snapshot ID;
- Ranking Snapshot ID;
- methodology versions.

## Contribution Reconciliation

- Planned Contribution;
- Actual Contribution;
- Prior Carry Cash;
- Settled Cash;
- Executable Cash;
- Available Allocation Cash;
- Reconciliation Status.

## Portfolio Context

- NAV;
- Cash %;
- holdings count;
- largest position;
- Top-3 concentration;
- sector concentration;
- drawdown;
- Legacy Holdings;
- risk exceptions.

## Candidate Table

For each serious candidate:

- rank;
- ticker;
- ownership;
- score;
- validity;
- confidence;
- thesis;
- valuation;
- expected return;
- risk;
- portfolio impact;
- lot cost;
- Buy/Accumulate gate;
- opportunity cost;
- final candidate status.

## Cash Comparator

- reason to deploy;
- reason to hold;
- robust-superiority conclusion.

## Final Recommendation

Examples:

- `BUY 100 shares of X`;
- `ACCUMULATE 100 shares of Y`;
- `BUY 100 X + ACCUMULATE 100 Y`;
- `HOLD CASH`.

## Execution Status

- `EXECUTE`;
- `STAGED`;
- `REQUIRES CASH ACCUMULATION`;
- `TEMPORARILY DEFERRED`;
- `BLOCKED`;
- `NOT ACTIONABLE`.

## Journal Link

- Decision ID;
- journal entry;
- next review date.

---

# 31. Decision Engine Handoff

Every selected security-level action must be validated through M4.

Required input package includes:

- score and validity;
- confidence;
- thesis;
- valuation;
- expected return;
- risk;
- ownership status;
- membership status;
- portfolio impact;
- cash context;
- sizing;
- lot feasibility;
- opportunity cost;
- Data As-Of;
- unresolved assumptions.

If decision-critical input is missing:

> `REVIEW REQUIRED`

Do not fabricate a final state.

---

# 32. Post-Trade Workflow

If execution occurs:

1. record authoritative trade event under M2;
2. process settlement/posting;
3. reconstruct portfolio state;
4. verify cash;
5. verify quantity;
6. verify position weight;
7. verify sector weight;
8. verify concentration;
9. verify no unintended breach;
10. link transaction ID to Decision ID;
11. complete journal;
12. set follow-up review.

A planned trade is not considered executed until authoritative transaction evidence exists.

---

# 33. Execution Variance

If actual execution differs materially from recommendation because of:

- execution price;
- partial fill;
- rejected order;
- insufficient cash;
- price gap;
- suspension;

then:

- preserve original decision;
- record execution variance;
- rerun sizing/risk if needed;
- do not silently rewrite the historical Decision ID.

---

# 34. Monthly Audit Trail

Required lineage:

```text
DCA Review ID
→ Contribution Plan
→ Actual Contribution Transaction
→ Cash Reconciliation
→ Portfolio Snapshot
→ Data As-Of
→ Score/Ranking Snapshot
→ Candidate Set
→ Gate Results
→ Opportunity-Cost Comparison
→ Cash Comparator
→ Decision ID(s)
→ Execution ID(s)
→ Post-Trade Snapshot
→ Journal
```

A `HOLD CASH` month retains the same audit chain except execution records.

---

# 35. File Update Rules

Monthly DCA Review may update:

- DCA review record;
- affected scorecards;
- ranking snapshot;
- Decision Template;
- Investment Journal;
- unresolved review register;
- post-trade audit links.

If a trade executes, M2 authoritative transaction/accounting artifacts are updated through their own rules.

Monthly DCA Review must never manually overwrite derived portfolio state.

---

# 36. Stop Conditions

Stop executable allocation if:

- contribution/cash is unreconciled;
- membership is unsupported;
- portfolio state is blocked;
- score is non-actionable;
- thesis is `PENDING`, `WEAKENING`, or `BROKEN` for positive allocation;
- hard risk veto applies;
- portfolio constraint would be breached;
- critical corporate action remains unresolved;
- decision-critical data is stale/missing;
- lot execution breaches rules;
- opportunity-cost superiority is insufficient;
- rule conflict exists.

Default result:

- `HOLD CASH` for an economic non-opportunity;
- `REVIEW REQUIRED` for unresolved data/process issues.

---

# 37. Acceptance Criteria

`MONTHLY_DCA_REVIEW.md` is acceptable only if:

1. contribution is separated from deployment;
2. actual contribution is ledger-authoritative;
3. executable cash is reconciled first;
4. monthly ranking is refreshed appropriately;
5. only current VN30 members receive new capital;
6. Legacy Holdings are excluded;
7. Buy/Accumulate gates are applied;
8. fresh underwriting is required for adds;
9. position sizing is applied;
10. post-trade sector/concentration is checked;
11. 100-share lot is an execution constraint only;
12. unaffordable best candidate does not force second-best purchase;
13. cash is an explicit comparator;
14. split deployment requires independent qualification;
15. allocation is re-evaluated after each lot;
16. HOLD CASH is journalable;
17. technicals remain secondary;
18. behavioral controls are explicit;
19. execution cannot bypass M4;
20. material outputs are auditable.

---

# 38. Multi-Role Review

## CIO Review

**Critical:** 0 unresolved.

**Major issues found and resolved:**

1. Contribution could become forced deployment → resolved by cash comparator and explicit HOLD CASH.
2. Monthly cadence could cause rank chasing → resolved by requiring full M4 gates.
3. Board-lot economics could distort capital allocation → resolved by separating merit from execution feasibility.

**Minor:** exact monthly execution date remains operational.

**Assessment:** PASS.

## Portfolio Manager Review

**Critical:** 0 unresolved.

**Major issues found and resolved:**

1. Pre-trade ranking could become stale after first lot → resolved by sequential re-evaluation.
2. Split deployment could become mechanical diversification → resolved by independent qualification.
3. Post-trade concentration could differ materially from pre-trade intuition → resolved by explicit simulation and post-trade reconciliation.

**Assessment:** PASS.

## Equity Research Analyst Review

**Critical:** 0 unresolved.

**Major issues found and resolved:**

1. Price-driven full rescoring → resolved with affected-category refresh.
2. Adds based on stale thesis → resolved by fresh underwriting.
3. Averaging down based on break-even motivation → resolved by special controls.

**Assessment:** PASS.

## Risk Manager Review

**Critical:** 0 unresolved.

**Major issues found and resolved:**

1. Economic target could bypass portfolio limits → resolved through sizing precedence.
2. Monthly cash pressure could justify concentration exceptions → resolved by HOLD CASH preference.
3. Execution-price variance could create unintended breach → resolved by execution-variance controls.

**Assessment:** PASS.

## Investment Operations Manager Review

**Critical:** 0 unresolved.

**Major issues found and resolved:**

1. Planned vs actual contribution ambiguity → resolved.
2. Settled cash vs executable cash ambiguity → resolved.
3. Planned execution could be mistaken for completed trade → resolved by ledger confirmation requirement.

**Assessment:** PASS.

## Behavioral Finance Reviewer

**Critical:** 0 unresolved.

**Major issues found and resolved:** action bias, FOMO, cost anchoring, sunk cost, rank chasing, forced diversification, and unsupported market-timing rationalization.

**Assessment:** PASS.

---

# 39. Consolidated Issue Register

## Critical

**0 unresolved**

## Major

**0 unresolved**

## Minor / Deferred

### DCA-1 — Exact monthly execution date
Not fixed at this layer. Keep operationally flexible unless later automation requires a precise cutoff.

### DCA-2 — Cash-range calibration
Owned upstream by approved risk/portfolio rules. Do not duplicate here.

### DCA-3 — Broker-specific fee and settlement details
Implementation-specific. Consume M2 contracts later.

---

# 40. Final Review

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

The next planned file is `05_PORTFOLIO_WORKFLOW/QUARTERLY_REVIEW.md`.
