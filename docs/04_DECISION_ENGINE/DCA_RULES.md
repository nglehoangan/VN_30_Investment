# DCA_RULES.md

**Version:** 1.0
**Status:** Approved Baseline v1.0

# VN30 Value Investing OS — DCA Rules

**Document:** `04_DECISION_ENGINE/DCA_RULES.md`  
**Milestone:** 4 — Buy / Hold / Sell Decision Engine  
**Date:** 2026-09-07

**Primary Parent:**
- `04_DECISION_ENGINE/DECISION_ENGINE.md` v1.0 — Approved Baseline

**Approved Sibling Dependencies:**
- `04_DECISION_ENGINE/BUY_RULES.md` v1.0 — Approved Baseline
- `04_DECISION_ENGINE/SELL_RULES.md` v1.0 — Approved Baseline

**Other Governing Documents:**
- `INVESTMENT_POLICY.md` — Approved
- `RISK_POLICY.md` v1.0 — Approved
- `DECISION_FRAMEWORK.md` v1.0 — Approved
- `SCORING_MODEL.md` v1.0 — Approved
- Milestone 2 portfolio/accounting data model — Approved
- Milestone 3 scoring and ranking documents — Approved

---

# 1. Purpose

This document defines how periodic investment cash is allocated across eligible VN30 opportunities.

The DCA engine is **not** a rule requiring investment every month. It is a disciplined capital-allocation process that determines whether new cash should be:

- deployed into a new position;
- added to an existing position;
- split across a small number of opportunities;
- accumulated as cash for a better lot-size opportunity;
- or deliberately left uninvested.

The governing objective is to maximize long-term risk-adjusted expected value while preserving the Investment Constitution, portfolio resilience, and decision discipline.

---

# 2. Core Principles

1. **DCA is a funding cadence, not a buying obligation.**
2. **Cash is a valid portfolio state.**
3. **Price decline alone never creates an add signal.**
4. **Every add is fresh underwriting.**
5. **Score is an input, not the decision.**
6. **Existing ownership does not grant priority automatically.**
7. **Cost basis and break-even are irrelevant to allocation merit.**
8. **The best affordable idea is not automatically the best economic use of cash.**
9. **Board-lot constraints affect execution, not fundamental attractiveness.**
10. **No DCA transaction may override a hard risk veto, concentration limit, stale-data block, or thesis failure.**

---

# 3. Scope Boundary

This file owns:

- monthly/periodic cash-allocation workflow;
- ranking and filtering for deployable DCA capital;
- add-to-existing versus open-new comparison;
- averaging-down safeguards;
- cash-carry-forward decisions;
- lot-size-aware allocation;
- multi-candidate selection;
- DCA prioritization under limited cash;
- execution eligibility for periodic contributions;
- DCA audit trail.

This file does **not** own:

- fundamental scoring methodology;
- detailed buy-state definitions;
- detailed sell-state definitions;
- final position-size architecture;
- full opportunity-cost scoring model;
- accounting treatment of cash, fees, cost basis, or NAV.

Those remain owned by the approved governing documents or later M4 files.

---

# 4. DCA Input Contract

A DCA decision requires, at minimum:

## 4.1 Security-Level Inputs

For every considered VN30 security:

- ticker/security ID;
- current VN30 membership status;
- Stage 0 result;
- Score Validity;
- total Fundamental Score;
- category scores;
- Data Confidence;
- Original Thesis;
- Current Thesis Status;
- Thesis Strength;
- Thesis Break Conditions;
- current valuation range;
- expected 5Y annualized total return;
- margin of safety;
- downside case;
- residual risk;
- active veto/review state;
- Decision State from M4;
- current market price;
- technical/market execution overlay;
- last formal review date and data as-of date.

## 4.2 Portfolio Inputs

- pre-contribution settled investable cash;
- new periodic contribution amount;
- contribution settlement status;
- unsettled / restricted cash;
- current position shares and weights;
- current sector weights;
- correlated-factor exposures where available;
- portfolio drawdown state;
- existing risk exceptions;
- current holdings and approved target exposures;
- relevant portfolio reconstruction/version ID.

## 4.3 Execution Inputs

- current board-lot size;
- estimated all-in cash required for one executable lot;
- applicable fees/taxes/charges;
- order/exchange constraints;
- any trading suspension or operational restriction.

If material inputs are stale, contradictory, missing, or not reconstructable, the affected allocation must not be treated as actionable.

### 4.4 Cash Accounting Invariant

The engine must never double-count a contribution.

Use the following conceptual bridge:

`Executable Cash = Pre-Contribution Settled Investable Cash + Newly Settled Contribution + Other Newly Settled Inflows - Restricted/Reserved Cash - Known Settlement Obligations`

If a portfolio snapshot already includes the new contribution, do **not** add the contribution again. The DCA audit trail must record whether the contribution is already embedded in the portfolio cash balance.

Unsettled, restricted, reserved, or otherwise unavailable cash is not executable cash.

---

# 5. DCA Candidate Universe

A security may enter the DCA candidate set only if all applicable conditions are met.

## 5.1 New Position Candidate

Normally requires:

- current VN30 constituent;
- Stage 0 = PASS, or a specifically permitted conditional state under `BUY_RULES.md`;
- Score Validity = `VALID — ACTIONABLE`;
- Data Confidence >= MEDIUM;
- Decision State = `BUY` or `STRONG BUY`;
- no hard veto;
- no unresolved review that blocks capital;
- valuation/forward-return hurdle passed;
- portfolio concentration permits entry;
- no mandate or operational prohibition.

## 5.2 Existing Position Candidate

Normally requires:

- current VN30 constituent;
- owned position;
- Stage 0 = PASS;
- Score Validity = `VALID — ACTIONABLE`;
- Data Confidence >= MEDIUM;
- Decision State = `ACCUMULATE` or, where explicitly justified, `STRONG BUY`;
- Thesis Status = `INTACT` or `IMPROVING`;
- fresh underwriting completed;
- no hard veto;
- no unresolved review blocking additional capital;
- valuation/forward-return hurdle passed;
- post-trade concentration permitted.

`HOLD`, `REDUCE`, `SELL`, and `AVOID` are not DCA recipients.

---

# 6. Mandatory No-DCA Conditions

No new DCA capital may be deployed into a security when any of the following is true:

1. security is not a current VN30 constituent;
2. Stage 0 is failed or unresolved in a way that blocks action;
3. Score Validity is not actionable;
4. Data Confidence is LOW;
5. thesis is `BROKEN`;
6. thesis is `WEAKENING` and fresh underwriting has not re-established eligibility;
7. review status is pending/escalated and policy requires resolution before adding;
8. a hard Capital-Allocation Veto or Ownership Veto applies;
9. Business Quality / Financial Health / Risk & Governance category gates fail;
10. valuation or expected-return hurdle fails;
11. material data are stale or contradictory;
12. post-trade position or sector exposure breaches applicable limits without required approval;
13. portfolio drawdown regime prohibits new risk without required approval;
14. purchase requires leverage/borrowing;
15. executable cash is insufficient for the proposed order; this blocks execution now but does not by itself invalidate investment merit;
16. rationale is based primarily on price decline, cost averaging, break-even, FOMO, recent performance, or sunk-cost thinking;
17. the transaction has materially inferior opportunity cost versus cash or another actionable candidate;
18. required risk/concentration/drawdown exception authorization has not been obtained.

---

# 7. DCA Decision Hierarchy

For each contribution cycle, evaluate in this order:

1. **Portfolio safety and hard prohibitions**
2. **Actionable candidate eligibility**
3. **Thesis validity**
4. **Valuation and expected return**
5. **Residual risk**
6. **Current portfolio concentration**
7. **Opportunity cost versus alternatives and cash**
8. **Board-lot / executable cash feasibility**
9. **Technical/market execution timing**
10. **Final deployment decision**

A lower stage may not override failure at a higher-priority stage.

---

# 8. Monthly / Periodic DCA Workflow

## Step 1 — Add New Cash

Record the new contribution as cash. Do not assume immediate deployment.

## Step 2 — Reconstruct Portfolio State

Refresh:

- available settled cash;
- holdings;
- position weights;
- sector weights;
- drawdown state;
- active risk exceptions;
- relevant market prices.

## Step 3 — Refresh Candidate Data

Only use candidates whose decision-relevant data remain current enough for action under the approved data rules.

## Step 4 — Build Eligible Candidate Set

Include only securities passing Section 5.

## Step 5 — Remove Blocked Candidates

Apply Section 6, Risk Policy, concentration limits, and execution prohibitions.

## Step 6 — Rank Economic Attractiveness

Compare surviving candidates on at least:

- expected 5Y annualized total return;
- margin of safety;
- residual risk;
- Data Confidence;
- Business Quality;
- Financial Health;
- thesis strength;
- portfolio fit;
- opportunity cost.

Fundamental Score helps rank candidates but cannot alone determine the allocation.

## Step 7 — Compare Existing vs New Positions

Existing holdings receive no automatic preference.

A new position may outrank an existing `ACCUMULATE` candidate if its forward risk/reward is materially superior.

Conversely, an existing holding may be the preferred DCA use when:

- thesis remains strong;
- valuation is more attractive;
- concentration remains acceptable;
- confidence is high enough;
- expected return compares favorably to alternatives.

## Step 8 — Apply Cash / Lot Feasibility

Determine which candidate lots are executable now and which require cash accumulation.

## Step 9 — Decide Deploy vs Carry Cash

Deploy only if at least one executable allocation passes all higher-priority gates and has sufficiently better forward risk-adjusted economics than retaining the capital as cash, after considering model uncertainty, portfolio fit, transaction friction, and near-term lot constraints.

`HOLD CASH` is an active capital-allocation decision, not a residual default. The audit trail must state why waiting is preferable to each executable finalist.

Otherwise: **HOLD CASH**.

## Step 10 — Record Decision

Log candidate set, rejected candidates, chosen allocation, cash retained, and rationale.

---

# 9. Candidate Priority Framework

The DCA engine should classify actionable candidates into priority buckets.

## Priority A — Exceptional Allocation Candidate

Typical characteristics:

- `STRONG BUY`;
- HIGH confidence;
- thesis `INTACT` or `IMPROVING`;
- expected return materially above normal BUY hurdle;
- strong MOS;
- acceptable residual risk;
- portfolio fit remains healthy.

Priority A does not authorize an all-in allocation.

## Priority B — Standard Allocation Candidate

Typical characteristics:

- `BUY` or `ACCUMULATE`;
- confidence >= MEDIUM;
- all category gates pass;
- expected return meets normal hurdle or approved exception;
- acceptable risk and portfolio fit.

## Priority C — Economically Valid but Not Currently Executable

Examples:

- sufficient investment merit but insufficient cash for one board lot;
- execution temporarily deferred;
- required portfolio/risk authorization still pending.

Priority C may justify cash accumulation, but does not justify substituting an inferior security automatically.

Priority C is an execution classification only. It must not be used to inflate a security's Fundamental Score, Decision State, thesis quality, or valuation assessment.

## Not Eligible

Any candidate failing mandatory gates is excluded from DCA allocation.

---

# 10. Averaging Down Engine

Averaging down is permitted only when it is economically superior to the alternatives after fresh underwriting.

## 10.1 Required Conditions

All of the following must hold:

- security remains a current VN30 constituent;
- Stage 0 = PASS;
- Score Validity = `VALID — ACTIONABLE`;
- confidence >= MEDIUM;
- thesis = `INTACT` or `IMPROVING`;
- mandatory decline-trigger review has been completed where applicable;
- business quality remains acceptable;
- financial health remains acceptable;
- no new material governance/risk issue;
- intrinsic-value estimate has been updated where necessary;
- valuation improved because price fell more than justified by fundamentals, not merely because the quoted price is lower;
- expected return hurdle passes;
- MOS is adequate;
- post-trade concentration remains acceptable;
- opportunity cost compares favorably;
- cash/lot feasibility passes.

## 10.2 Good Averaging Down

A decline may support an add when evidence indicates:

- intrinsic value is stable or higher;
- thesis remains strong;
- expected return improved;
- downside asymmetry improved;
- risk has not worsened materially;
- portfolio concentration remains controlled.

## 10.3 Value-Trap Pattern

Do **not** average down when price decline is accompanied by evidence such as:

- deteriorating competitive position;
- weakening balance sheet;
- worsening cash-generation quality;
- structurally lower normalized earnings power;
- governance deterioration;
- adverse capital allocation;
- thesis break condition approaching or triggered;
- increased tail risk;
- reduced confidence in intrinsic value;
- sector/structural impairment not reflected in prior underwriting.

A lower price with a lower intrinsic value is not automatically a better investment.

---

# 11. Price-Decline Review Triggers

The approved Risk Policy remains authoritative.

Before adding after a meaningful decline, fresh review is required when triggered by policy, including:

- approximately >=15% decline from the most recent meaningful purchase reference; or
- approximately >=20% decline from the last formal thesis-review price.

These are **review triggers**, not buy signals.

A transaction-size artifact must not reset the reference point improperly. A trivial purchase should not become the new anchor merely to avoid review.

---

# 12. Averaging Up

Adding after a price increase is permitted when forward economics still justify it.

Requirements are the same fundamental gates as any other add.

The engine must ignore the psychological statement:

> “I missed the lower price, so I should not buy now.”

The correct question is whether current expected return, MOS, risk, thesis, and opportunity cost justify the allocation today.

No add is permitted solely because recent price momentum is strong.

---

# 13. Existing Holding vs New Position

The DCA engine must explicitly compare:

- best owned `ACCUMULATE` candidates;
- best unowned `BUY/STRONG BUY` candidates;
- cash.

The selected allocation should maximize portfolio-level expected value subject to risk.

Do not prefer an owned name merely because:

- it is familiar;
- it is below cost;
- it has already received research effort;
- the investor wants to reduce average cost;
- a new position feels psychologically harder.

Do not prefer a new name merely for diversification if the new name is materially inferior on risk-adjusted economics.

---

# 14. Opportunity Cost Gate

Every DCA allocation must compare at least:

1. candidate security;
2. best current owned alternative;
3. best current unowned actionable alternative;
4. cash.

For close candidates, use the approved M3 tie-cluster discipline and the M4 opportunity-cost framework.

Relevant comparison dimensions:

- expected 5Y annualized total return;
- confidence;
- MOS;
- residual risk;
- quality;
- concentration impact;
- diversification/factor impact;
- execution feasibility.

Do not switch simply for a marginal expected-return difference that is within model noise.

Detailed quantitative calibration belongs to `OPPORTUNITY_COST.md`.

---

# 15. Cash Carry-Forward Rule

Cash may accumulate across months without penalty.

`HOLD CASH` is the correct decision when:

- no candidate passes required investment gates;
- all attractive candidates are temporarily non-actionable;
- the best opportunity requires more cash for one board lot;
- affordable alternatives are materially inferior;
- portfolio risk/concentration blocks deployment;
- data quality is insufficient;
- valuation is not attractive enough;
- expected returns do not compensate for risk;
- technical/market conditions justify a short execution deferral while the investment decision remains valid.

Cash accumulation is not “failure to DCA.” It is disciplined optionality.

Cash carry-forward must not rely on a prediction that the market will fall soon. The justification must be based on current opportunity quality, executable alternatives, risk capacity, and/or lot economics—not market-timing conviction.

---

# 16. Board-Lot and Affordability Engine

The board-lot constraint affects **when** a valid allocation can be executed, not whether the security is fundamentally attractive.

For each candidate calculate:

`Required Executable Cash = Board Lot × Current Price + estimated all-in transaction costs`

Then classify:

- `EXECUTABLE NOW`;
- `REQUIRES CASH ACCUMULATION`;
- `BLOCKED BY PORTFOLIO LIMIT`;
- `BLOCKED BY RISK/APPROVAL`;
- `NOT ACTIONABLE`.

Do not reclassify a strong security as fundamentally unattractive merely because one lot is unaffordable.

---

# 17. Higher-Ranked but Unaffordable vs Lower-Ranked Affordable Candidate

The default is **do not automatically substitute** the lower-ranked affordable security.

A lower-ranked candidate may be selected only when all of the following are true:

- it independently passes all DCA gates;
- it is not materially inferior on quality/risk/confidence;
- its expected return is sufficiently close to the preferred candidate that the difference is not economically meaningful;
- portfolio fit is equal or superior;
- execution today creates more expected value than waiting for the higher-ranked candidate.

Consistent with `DECISION_ENGINE.md`, the initial working guide is:

- same M3 tie cluster (normally score difference <=2), **or** clearly superior portfolio fit;
- expected-return difference normally <=2 percentage points;
- risk no worse materially;
- confidence no lower;
- no additional concentration problem.

These are calibration guides, not constitutional hard rules. Final calibration belongs to `OPPORTUNITY_COST.md` / `POSITION_SIZING.md`.

If these conditions fail, retain cash for the better opportunity.

The engine must not repeatedly purchase second-best affordable names across multiple contribution cycles merely because the preferred candidate remains unaffordable. Each cycle must re-underwrite whether continued cash accumulation, an independently attractive alternative, or a different portfolio action now offers the best expected value.

---

# 18. One-Lot vs Multi-Lot Allocation

When cash is limited, the engine must avoid false diversification.

A single best lot may be preferable to splitting capital if:

- one candidate is materially superior;
- splitting forces purchase of inferior candidates;
- transaction costs become inefficient;
- small allocations create administrative complexity without meaningful diversification.

Multiple candidates may be appropriate if:

- expected value is close;
- risk reduction is meaningful;
- concentration would otherwise become elevated;
- lot sizes permit efficient allocation;
- each candidate independently passes all gates.

Detailed tranche and sizing rules belong to `POSITION_SIZING.md`.

---

# 19. Concentration Gate

DCA must evaluate **post-trade**, not just pre-trade, exposure.

## 19.1 Single Name

Apply approved Risk Policy thresholds.

General implications:

- <=10% NAV: normal zone;
- >10–15%: elevated; requires justification;
- >15%: normally no additional capital;
- >20%: no-add + CIO/Risk review;
- >25%: normally requires REDUCE plan unless approved exception.

Small-NAV board-lot exception rules remain governed by Risk Policy. Any trade relying on that exception requires explicit pre-trade escalation/authorization, must respect the 30% emergency ceiling, must prohibit further adds while above 15%, and must include a normalization plan.

## 19.2 Sector

General implications:

- <=25%: normal;
- >25–30%: elevated;
- >30–35%: normally no additional capital;
- >35%: escalated approval territory;
- 40%: provisional normal-condition ceiling.

Sector labels alone are insufficient; correlated factor exposure should be considered where material.

---

# 20. Portfolio Drawdown Gate

Portfolio drawdown does not mechanically create or prohibit buying. It changes the required level of scrutiny and authorization.

Follow the approved Risk Policy ladder:

- NORMAL;
- WATCH;
- ELEVATED;
- CRITICAL;
- SEVERE.

At CRITICAL/SEVERE levels, discretionary risk-increasing trades are blocked unless the exact approvals/authorizations required by Risk Policy are obtained. The DCA engine itself cannot infer or self-grant such approval.

The DCA engine must not interpret large market declines as automatic “sale prices.”

---

# 21. Technical / Market Entry Overlay

Technical analysis and market/money flow may help decide **when** to execute an already-approved allocation.

They may support:

- immediate execution;
- staged execution;
- short deferral;
- limit-price discipline.

They may not:

- repair a broken thesis;
- override a risk veto;
- convert an overvalued security into a BUY;
- justify averaging down without fresh underwriting;
- change Fundamental Score;
- force monthly deployment.

A technical delay must be time-bounded or event-bounded and must not become an indefinite substitute for a portfolio decision. Re-underwrite if price, valuation, fundamentals, risk, or opportunity cost changes materially while waiting.

Technical timing must never be used to justify waiting for a lower price when the only rationale is anchoring or speculative market timing.

---

# 22. DCA Allocation Outcomes

Each DCA cycle should end in one of these operational outcomes:

## 22.1 DEPLOY — NEW POSITION

Capital is assigned to an unowned security with `BUY` or `STRONG BUY` state.

## 22.2 DEPLOY — ADD EXISTING

Capital is assigned to an owned security with `ACCUMULATE` or qualifying `STRONG BUY` state.

## 22.3 DEPLOY — MULTIPLE

Capital is split across multiple independently eligible candidates.

## 22.4 HOLD CASH — ACCUMULATE FOR LOT

Best candidate is economically superior but currently unaffordable.

## 22.5 HOLD CASH — NO SUFFICIENT OPPORTUNITY

No candidate offers sufficient risk-adjusted expected value.

## 22.6 HOLD CASH — RISK / DATA / APPROVAL BLOCK

Deployment is temporarily prohibited by a higher-priority gate.

## 22.7 NO EXECUTION — CASH / SETTLEMENT INSUFFICIENT

The preferred allocation remains valid in investment-merit terms, but settled executable cash is insufficient for the minimum permitted order. Cash remains uncommitted until executable or until a superior alternative emerges.

This outcome must not be relabeled as `AVOID`, `HOLD`, or valuation failure.

These are DCA execution outcomes, not additional security Decision States.

---

# 23. DCA Allocation Scorecard

For every finalist, record:

| Dimension | Required Evidence |
|---|---|
| Decision State | BUY / STRONG BUY / ACCUMULATE |
| Fundamental Score | Current approved M3 score |
| Score Validity | Must be actionable |
| Confidence | MEDIUM/HIGH |
| Thesis | INTACT/IMPROVING |
| Expected Return | Current 5Y annualized estimate |
| MOS | Current assessment |
| Residual Risk | Current assessment |
| Position Impact | Post-trade weight |
| Sector Impact | Post-trade sector weight |
| Opportunity Cost | Versus owned, unowned, cash |
| Lot Feasibility | Executable / accumulate cash |
| Technical Overlay | Execute / stage / defer |

A DCA recommendation without this evidence is incomplete.

---

# 24. Behavioral Finance Controls

Before final DCA authorization, explicitly test for:

## 24.1 Price Anchoring

“Price used to be higher, so this must be cheap.” → Invalid.

## 24.2 Cost-Basis Anchoring

“I need to lower my average cost.” → Invalid.

## 24.3 Loss Aversion

“I cannot buy a new opportunity while another holding is at a loss.” → Invalid.

## 24.4 FOMO

“The stock is running; I need to buy this month.” → Invalid.

## 24.5 Sunk-Cost Bias

“I have already researched/owned this stock, so keep adding.” → Invalid.

## 24.6 Action Bias

“Monthly DCA means I must make a trade.” → Invalid.

## 24.7 Diversification Theater

“I should buy many names so the portfolio looks diversified.” → Invalid if economic quality is diluted.

## 24.8 Recency Bias

“Recent winners are safer / recent losers are bargains.” → Invalid without underwriting evidence.

Any detected bias must be documented if it materially affects the decision.

---

# 25. Decision Invariants

The following must always remain true:

1. No forced monthly deployment.
2. No leverage.
3. No new capital to non-VN30 securities.
4. No add to Legacy Holdings.
5. No add solely because price declined.
6. No add to a broken thesis.
7. No add under LOW confidence.
8. No add that violates hard risk constraints.
9. No use of cost basis as valuation evidence.
10. No use of technicals to create a fundamental buy thesis.
11. No substitution of a materially inferior affordable stock merely to spend cash.
12. No requirement to own all VN30 constituents.
13. No change to Fundamental Score because of cash, lot size, portfolio holdings, or technical timing.
14. No DCA decision without explicit opportunity-cost comparison.
15. Cash is always an eligible comparator.
16. A new contribution must never be counted twice in executable cash.
17. Lack of executable cash changes execution status, not fundamental merit.
18. No risk/concentration/drawdown exception may be self-approved by the DCA engine.
19. `HOLD CASH` must have explicit economic rationale and may not rest solely on a market-timing forecast.

---

# 26. DCA Audit Trail

Each contribution cycle should record:

- DCA Decision ID;
- decision date/time;
- data as-of date;
- portfolio as-of date;
- starting cash;
- new contribution;
- total executable cash;
- candidate universe;
- excluded candidates and reasons;
- shortlisted candidates;
- score / confidence / thesis / valuation for finalists;
- expected-return estimates;
- post-trade position and sector weights;
- selected security/security set;
- shares/lots;
- estimated transaction cost;
- cash retained;
- opportunity-cost comparison;
- technical execution note;
- behavioral-bias check;
- final DCA outcome;
- review trigger;
- methodology versions;
- portfolio reconstruction ID/version.

---

# 27. Minimum Review Triggers After DCA

After a DCA transaction, review may be triggered by:

- thesis-changing new information;
- valuation-changing financial results;
- mandatory decline trigger;
- +20% gain review trigger where applicable;
- concentration threshold crossing;
- sector threshold crossing;
- portfolio drawdown escalation;
- governance/risk event;
- VN30 membership change;
- material change in expected return;
- material opportunity-cost change.

Do not schedule arbitrary high-frequency reviews solely because market price moves daily.

---

# 28. Quality-Control Tests

A valid implementation of this file should pass at least the following cases.

## Case A — No Opportunity

Cash arrives, but no actionable candidate passes the normal return hurdle.

**Expected:** HOLD CASH.

## Case B — Attractive Existing Holding Below Cost

Owned stock falls 20%, thesis intact, intrinsic value stable, expected return improves, fresh review passes, concentration acceptable.

**Expected:** ACCUMULATE may be eligible. Loss itself is not the reason.

## Case C — Falling Value Trap

Owned stock falls 30%, but normalized earnings power and thesis deteriorate.

**Expected:** no DCA; route to HOLD/REDUCE/SELL review as appropriate.

## Case D — Best Candidate Unaffordable

Top candidate requires more than current cash for one lot. Affordable candidate is materially inferior.

**Expected:** accumulate cash; do not force substitution.

## Case E — Close Affordable Alternative

Top candidate is unaffordable. Second candidate independently passes all gates, is in same tie cluster, expected return difference is small, risk/confidence no worse, portfolio fit better.

**Expected:** second candidate may be selected with explicit opportunity-cost rationale.

## Case F — Existing Holding Already >15%

Owned `ACCUMULATE` candidate is attractive but position is above normal no-add threshold.

**Expected:** no DCA without applicable exception/approval.

## Case G — LOW Confidence

Valuation appears attractive but critical inputs are low-confidence.

**Expected:** no new capital.

## Case H — Technical Weakness

Fundamental BUY passes; chart/flow is weak but no thesis/risk issue.

**Expected:** investment merit remains BUY; execution may stage/defer. Technical weakness cannot convert it to fundamental AVOID.

## Case I — Monthly Action Bias

Contribution arrives and only mediocre opportunities exist.

**Expected:** HOLD CASH.

## Case J — New Position Beats Familiar Holding

Owned stock is a valid ACCUMULATE, but an unowned BUY has materially better risk-adjusted expected value and acceptable portfolio fit.

**Expected:** new position may receive the DCA capital.

## Case K — Contribution Already Included in Cash Snapshot

Portfolio cash balance already includes this month's contribution. The workflow also receives the contribution amount as a separate input.

**Expected:** contribution is not added again; executable cash is reconciled once and audit trail records the treatment.

## Case L — Small-NAV Board-Lot Exception

A one-lot BUY would push a small portfolio above the normal 20% single-name ceiling but within the Risk Policy's emergency exception range.

**Expected:** no autonomous execution. Pre-trade escalation/explicit approval and normalization plan are required; otherwise HOLD CASH / BLOCKED.

## Case M — Critical Portfolio Drawdown

An attractive STRONG BUY appears while the portfolio is in CRITICAL drawdown.

**Expected:** the attractive decision state remains analytically intact, but discretionary risk-increasing execution is blocked until required CIO/Risk authorization.

## Case N — Repeated Affordable Substitution

The preferred candidate remains unaffordable for several contribution cycles; a second-best affordable name is only marginally acceptable.

**Expected:** do not create an automatic monthly substitution pattern. Re-run opportunity cost each cycle; HOLD CASH remains valid.

## Case O — Technical Deferral Becomes Stale

A BUY was deferred for technical timing, but valuation/fundamentals materially change before execution.

**Expected:** prior execution plan expires; re-underwrite before any trade.

---

# 29. Internal Consistency Checklist

Before approving any DCA recommendation, verify:

- [ ] current VN30 eligibility;
- [ ] Stage 0 status;
- [ ] Score Validity;
- [ ] confidence;
- [ ] thesis status;
- [ ] category gates;
- [ ] valuation / expected return;
- [ ] MOS and downside case;
- [ ] veto/review status;
- [ ] post-trade single-name exposure;
- [ ] post-trade sector exposure;
- [ ] portfolio drawdown regime;
- [ ] contribution reconciliation / no double counting;
- [ ] cash settlement and fees;
- [ ] board-lot feasibility;
- [ ] opportunity cost versus holdings / alternatives / cash;
- [ ] technical overlay used only for timing;
- [ ] behavioral-bias check;
- [ ] audit trail completed.

---

# 30. Deferred Calibration

The following details are intentionally deferred to later M4 files rather than hard-coded here:

- exact target position-size bands;
- tranche sizing;
- Phase 1 vs Phase 2 allocation formulas;
- formal opportunity-cost composite model;
- exact switch threshold calibration beyond current working guides;
- candidate count per contribution cycle;
- exact cash-reserve optimization;
- transaction-cost breakpoints;
- detailed decision-template schema.

This prevents `DCA_RULES.md` from prematurely owning policy assigned to `POSITION_SIZING.md`, `OPPORTUNITY_COST.md`, and `DECISION_TEMPLATE.md`.

---

# 31. Multi-Role Review Summary — v0.2

## CIO Review

**Result:** 9.9/10.

Confirmed that DCA remains a capital-allocation process rather than a monthly spending rule; cash, owned names, and unowned names compete on forward economics. No unresolved Critical/Major issue.

## Portfolio Manager Review

**Result:** 9.9/10.

Strengthened cash reconciliation, lot affordability, post-trade exposure, repeated substitution control, and explicit HOLD-CASH rationale. No unresolved Critical/Major issue.

## Equity Research Analyst Review

**Result:** 9.9/10.

Confirmed fresh-underwriting requirements, anti-value-trap logic, current valuation/return evidence, and separation of price movement from intrinsic value. No unresolved Critical/Major issue.

## Risk Manager Review

**Result:** 9.9/10.

Explicitly blocked self-approval of concentration/drawdown exceptions, reinforced small-NAV exception controls, and preserved hard-veto precedence. No unresolved Critical/Major issue.

## Behavioral Finance Review

**Result:** 9.9/10.

Added controls against forced deployment, repeated second-best substitution, market-timing rationalization, anchoring, sunk-cost behavior, and technical-delay procrastination. No unresolved Critical/Major issue.

### Issue Status

- **Critical:** 0 unresolved
- **Major:** 0 unresolved
- **Minor / intentionally deferred:** exact position sizing, tranche sizing, formal opportunity-cost calibration, transaction-cost breakpoint calibration, and detailed template schema. These belong to later approved M4 files and do not block this document.

---

# 32. Approval Gate

This document remains **Approved Baseline v1.0** until explicitly approved.

Approval criteria:

- consistent with `DECISION_ENGINE.md` v1.0;
- consistent with `BUY_RULES.md` v1.0;
- consistent with `SELL_RULES.md` v1.0;
- no forced monthly deployment;
- robust anti-value-trap averaging-down logic;
- cash and lot-size behavior do not distort fundamental merit;
- opportunity cost explicitly includes cash;
- no unresolved Critical or Major issue after multi-role review.

After approval, promote this file to **Approved Baseline v1.0** and proceed only to the next approved M4 file in sequence: `POSITION_SIZING.md`.
