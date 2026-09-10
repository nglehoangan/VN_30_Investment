# BUY_RULES.md

**Status:** Approved Baseline v1.0

# VN30 Value Investing OS — Buy Rules

**Document:** `04_DECISION_ENGINE/BUY_RULES.md`  
**Milestone:** 4 — Buy / Hold / Sell Decision Engine  
**Version:** 1.0
**Date:** 2026-09-06  

**Primary Parent:**
- `04_DECISION_ENGINE/DECISION_ENGINE.md` v1.0 — Approved Baseline

**Other Governing Documents:**
- `INVESTMENT_POLICY.md` v1.1 — Approved
- `RISK_POLICY.md` v1.0 — Approved
- `DECISION_FRAMEWORK.md` v1.0 — Approved
- `SCORING_MODEL.md` v1.0 — Approved
- `03_SCORING/SCORING_ENGINE.md` — Approved
- `03_SCORING/RANKING_RULES.md` v1.0 — Approved
- Milestone 2 portfolio/accounting data model and data rules — Approved

---

# 1. Purpose

This document defines the detailed rules for deploying incremental capital into VN30 securities.

It owns the operational logic for:

- `STRONG BUY` initiation;
- `BUY` initiation;
- `ACCUMULATE` additions to existing positions;
- averaging down as a controlled subset of ACCUMULATE;
- minimum evidence required before any purchase;
- initiation versus add differentiation;
- post-trade position and sector checks;
- lot-size and cash-feasibility handling at the buy layer;
- execution staging rules that remain subordinate to fundamentals;
- mandatory no-buy conditions;
- buy-decision audit requirements.

This file does **not** redefine the seven Decision States or their top-level precedence. If any rule conflicts with `DECISION_ENGINE.md` v1.0, the approved Decision Engine prevails.

---

# 2. Scope Boundary

## 2.1 This file owns

Detailed purchase authorization for:

1. new positions;
2. additions to existing positions;
3. averaging down;
4. averaging up;
5. re-entry after a prior exit;
6. buying after a prior HOLD/AVOID state;
7. temporary cash/lot constraints on otherwise valid buy merit;
8. pre-trade and post-trade buy checks;
9. buy-specific audit fields.

## 2.2 This file does not own

The following remain in later M4 files:

- monthly contribution prioritization → `DCA_RULES.md`;
- exact target weight formulas and tranche percentages → `POSITION_SIZING.md`;
- calibrated cross-security utility/switch scoring → `OPPORTUNITY_COST.md`;
- REDUCE/SELL mechanics → `SELL_RULES.md`;
- presentation schema → `DECISION_TEMPLATE.md`;
- synthetic/historical boundary testing → `VALIDATION_CASES.md`.

Where this document needs those interfaces before their files exist, it defines only minimum safe contracts and explicitly labels them provisional.

---

# 3. Core Buy Principle

A **positive allocation decision** is supported only when all of the following are true:

> **Good business / acceptable financial health + valid thesis + attractive forward return + acceptable risk + sufficient confidence + portfolio capacity + acceptable opportunity cost.**

A **trade is authorized for execution** only when the positive allocation decision also passes cash, lot-size, portfolio, operational, and approval requirements. Therefore, `BUY`, `ACCUMULATE`, or `STRONG BUY` may remain the Decision State while execution is `REQUIRES CASH ACCUMULATION`, `STAGED`, `TEMPORARILY DEFERRED`, or `BLOCKED — PORTFOLIO/RISK`.

A falling price is not a buy signal.

A high score is not a buy signal.

A high ranking is not a buy signal.

Available monthly cash is not a buy signal.

Technical strength is not a buy signal.

Prior ownership is not a reason to add.

---

# 4. Buy Action Taxonomy

Every purchase candidate must be classified into exactly one Buy Action Type before execution.

- `INITIATE` — establish a new position from zero shares.
- `ADD` — increase an existing position.
- `AVERAGE DOWN` — ADD when current execution price is below a relevant prior purchase/reference price.
- `AVERAGE UP` — ADD when current execution price is above a relevant prior purchase/reference price.
- `RE-ENTER` — establish a new position after prior full exit.

The classification is descriptive only. It does not override the final Decision State.

Permitted Decision-State combinations:

| Buy Action Type | Normal Decision State |
|---|---|
| INITIATE | BUY / STRONG BUY |
| ADD | ACCUMULATE / STRONG BUY |
| AVERAGE DOWN | ACCUMULATE only, except rare owned-position STRONG BUY when full STRONG BUY standard independently passes |
| AVERAGE UP | ACCUMULATE / STRONG BUY |
| RE-ENTER | BUY / STRONG BUY |

---

# 5. Universal Pre-Buy Gates

No purchase may proceed unless all universal gates pass.

## B0 — Mandate

Required:

- current VN30 constituent at the decision effective date;
- not a Legacy Holding for purposes of new capital;
- no margin, borrowing, or disguised leverage;
- transaction operationally permitted.

Failure → `DO NOT BUY`.

## B1 — Stage 0

- STRONG BUY → `PASS` required.
- ACCUMULATE → `PASS` required.
- BUY → normally `PASS`.
- `PASS WITH CONDITIONS` may support BUY only under the narrow exception already defined in `DECISION_ENGINE.md` v1.0.

`PASS WITH CONDITIONS` may not support:

- STRONG BUY;
- averaging down;
- unresolved veto risk;
- any purchase where the condition itself materially affects valuation, solvency, governance, or thesis validity.

## B2 — Score validity

Normal requirement for a positive allocation decision:

> `VALID — ACTIONABLE`

M4 must **not rewrite or reinterpret M3 score validity merely because cash or board-lot execution is constrained**. Cash insufficiency, lot affordability, or temporary execution timing belongs to the M4 Execution Sub-Status layer, not to score validity.

If an approved M3 record is already `VALID — NON-ACTIONABLE`, the reason must be inspected. Positive allocation merit may be retained only when the non-actionable cause is explicitly documented as non-fundamental and the parent `DECISION_ENGINE.md` permits separation of merit from execution. Otherwise, treat it as no new-capital authorization until the M3 blocker is resolved.

`RESEARCH ONLY` or `NOT RELIABLY SCORABLE` → no buy.

## B3 — Confidence

- STRONG BUY → `HIGH` only.
- BUY → `MEDIUM` or `HIGH`.
- ACCUMULATE → `MEDIUM` or `HIGH`.
- LOW → `DO NOT BUY`.

## B4 — Minimum category gates

Normal positive capital allocation requires at least:

- Business Quality ≥13/25;
- Financial Health ≥8/15;
- Risk & Governance ≥5/10;
- Valuation & Forward Return ≥10/20.

Normal STRONG BUY requires at least:

- Business Quality ≥18/25;
- Financial Health ≥11/15;
- Risk & Governance ≥7/10;
- exceptional valuation/risk-reward support.

No category failure may be compensated by excess points elsewhere.

## B5 — Thesis

Positive purchase states require:

- `INTACT`; or
- `IMPROVING`.

`WEAKENING` → no new capital by default.

`BROKEN` → no buy, no add, no averaging down.

`PENDING` → no buy until the pending item is resolved.

## B6 — Risk

No purchase if any of the following is active:

- ownership veto;
- capital-allocation veto;
- unresolved possible veto;
- unresolved mandatory risk review;
- unacceptable residual risk;
- portfolio drawdown escalation that requires approval not yet granted;
- prohibited concentration outcome.

## B7 — Valuation and forward return

Normal new capital:

> expected 5-year annualized total return ≥15%.

Exceptional 12% to <15% BUY requires all approved high-quality-exception conditions and explicit `Hurdle Exception = YES`.

Expected return <12% → no normal buy.

STRONG BUY should normally require:

> expected 5-year annualized total return ≥18%

plus significant MOS and favorable downside asymmetry.

## B8 — Portfolio impact

Purchase requires one of:

- `IMPROVES PORTFOLIO`;
- `NEUTRAL / ACCEPTABLE`;
- `CONSTRAINED — SMALLER SIZE REQUIRED` with a compliant trade size.

`NEGATIVE — DO NOT ADD` → purchase prohibited.

## B9 — Opportunity cost

Before purchase, compare the candidate with:

- cash;
- other actionable VN30 candidates;
- existing holdings eligible for additional capital.

A buy must not be executed merely because it is affordable if a materially better use of capital exists or cash retention has better risk-adjusted expected value.

## B10 — Cash and lot feasibility

The trade must not require leverage.

If executable cash is below one required board lot:

- preserve valid BUY/STRONG BUY merit if all higher gates pass;
- Execution Sub-Status = `REQUIRES CASH ACCUMULATION`;
- Action = `DO NOT TRADE NOW`;
- compare with other qualified affordable alternatives;
- do not downgrade the business to AVOID solely due to cash insufficiency.

---

# 6. New Position — BUY Rules

BUY is the normal state for initiating a new position.

## 6.1 Required conditions

All must pass:

1. ownership = UNOWNED;
2. B0–B10 applicable gates pass;
3. thesis = INTACT or IMPROVING;
4. confidence ≥MEDIUM;
5. normal category gates pass;
6. expected 5Y annualized return ≥15%, unless approved exception;
7. valuation is normally `ATTRACTIVE` or better;
8. no hard veto or unresolved mandatory review;
9. residual risk acceptable;
10. post-trade single-name and sector exposure remain policy-compliant or explicitly approved under a permitted small-NAV exception;
11. candidate is not materially inferior to the best available capital-allocation alternatives;
12. trade can be funded from settled/executable cash without leverage, or is explicitly deferred for cash accumulation.

## 6.2 BUY is not authorized when

Any one of the following is sufficient to block immediate initiation:

- thesis WEAKENING, BROKEN, or PENDING;
- LOW confidence;
- category gate failure;
- valuation below hurdle;
- unresolved governance, solvency, legal, or accounting concern;
- risk veto;
- required portfolio data unreconciled;
- post-trade concentration breach without approved exception;
- alternative opportunity materially dominates;
- purchase rationale depends mainly on recent price fall;
- purchase rationale depends mainly on recent price rise/FOMO;
- user monthly cash availability is the principal reason to buy.

## 6.3 BUY with 12–15% expected return exception

This is permitted only when all are true:

- Business Quality is very high;
- balance sheet / financial resilience is strong;
- residual risk is low;
- confidence = HIGH;
- downside protection is strong;
- portfolio resilience meaningfully improves;
- no materially better qualified opportunity exists;
- the exception is explicitly recorded.

Required audit field:

> `Hurdle Exception = YES — rationale: ...`

This path must remain uncommon.

---

# 7. STRONG BUY Rules

STRONG BUY is rare and represents exceptional incremental-capital merit, not permission to concentrate irresponsibly.

## 7.1 Universal STRONG BUY requirements

All must pass:

1. current VN30 constituent;
2. Stage 0 = PASS;
3. Score Validity supports positive allocation merit;
4. confidence = HIGH;
5. thesis = INTACT or IMPROVING;
6. Business Quality ≥18/25;
7. Financial Health ≥11/15;
8. Risk & Governance ≥7/10;
9. residual risk LOW or MODERATE;
10. no hard or unresolved veto;
11. valuation is exceptionally favorable on the approved valuation framework, with strong downside/upside asymmetry;
12. expected 5Y annualized return normally ≥18%;
13. significant Margin of Safety supported by an explicit intrinsic-value range and downside case;
14. downside case is acceptable relative to upside;
15. valuation is not dependent primarily on speculative multiple expansion;
16. opportunity cost is top-tier;
17. proposed size remains within portfolio/risk constraints;
18. allocation can be funded without leverage, or execution is deferred for cash accumulation.

## 7.2 STRONG BUY for a new position

Action must state:

> `INITIATE`

Execution still follows position-sizing rules and may be staged.

STRONG BUY never means:

- all-in;
- maximum position immediately;
- bypass diversification;
- bypass concentration controls;
- consume emergency liquidity;
- override drawdown escalation controls.

## 7.3 STRONG BUY for an owned position

This is intentionally harder to justify than ordinary ACCUMULATE.

In addition to the universal STRONG BUY requirements:

- the incremental lot itself must have exceptional expected value;
- the post-trade position must remain policy-compliant;
- the current position must not already be in a no-add concentration zone;
- no unresolved decline-review trigger may remain;
- the add must beat relevant alternatives on opportunity cost.

If these conditions do not all hold, use `ACCUMULATE`, `HOLD`, or another appropriate state instead.

---

# 8. ACCUMULATE Rules

ACCUMULATE is the normal positive state for an owned position receiving additional capital.

## 8.1 Required conditions

All must pass:

1. ownership = OWNED;
2. Stage 0 = PASS;
3. Score Validity supports positive capital allocation;
4. confidence ≥MEDIUM;
5. thesis = INTACT or IMPROVING;
6. normal category gates pass;
7. valuation / forward-return hurdle passes;
8. no active capital-allocation or ownership veto;
9. no unresolved mandatory thesis/risk review;
10. current facts do not indicate material business-quality, balance-sheet, governance, or risk deterioration that invalidates the add;
11. post-trade position weight is permitted;
12. post-trade sector exposure is permitted;
13. portfolio impact is acceptable;
14. the proposed add passes opportunity cost;
15. trade uses executable cash without leverage, or is deferred for cash accumulation;
16. the reason for adding is based on forward expected value, not historical cost basis.

## 8.2 Required incremental-thesis statement

Every ACCUMULATE decision must answer:

> **Why is the next lot attractive today, independently of the fact that the portfolio already owns the stock?**

Required content:

- what changed since the previous formal decision;
- whether intrinsic value changed;
- whether expected return changed;
- whether risk changed;
- whether thesis confidence changed;
- why another VN30 candidate or cash is not clearly superior.

If this cannot be answered → no ACCUMULATE.

## 8.3 Maximum exposure interface

ACCUMULATE must obey the approved Risk Policy:

- >10–15% single-name = elevated, explicit justification;
- >15% = normally no additional capital;
- >20% = no-add + CIO/Risk review;
- >25% = normally REDUCE plan unless approved exception.

Small-NAV board-lot exception remains exceptional and cannot become a target allocation.

Sector rules likewise remain binding.

Detailed target/tranche formulas are deferred to `POSITION_SIZING.md`.

---

# 9. Averaging Down Rules

Averaging down is a special-case ACCUMULATE decision with additional safeguards.

## 9.1 Mandatory fresh underwriting

A lower price never preserves the prior buy authorization automatically.

Before averaging down, refresh at minimum:

- latest material operating performance;
- balance sheet / liquidity / leverage;
- industry conditions;
- governance/regulatory facts;
- thesis status;
- intrinsic-value range;
- expected 5Y annualized total return;
- downside case;
- residual risk;
- portfolio concentration;
- opportunity cost.

## 9.2 Good averaging-down pattern

May qualify only when:

- price declined;
- thesis remains INTACT or IMPROVING;
- business quality is stable or stronger;
- financial health is stable or stronger, or any deterioration remains clearly acceptable and non-thesis-breaking;
- intrinsic value is stable or higher, or has fallen materially less than market price with adequate MOS still present;
- expected forward return improved;
- downside asymmetry is more favorable;
- residual risk has not become unacceptable;
- all ACCUMULATE gates pass.

## 9.3 Value-trap block

Presumptive `DO NOT ADD` if price decline is accompanied by any material combination of:

- deteriorating normalized earnings power;
- deteriorating cash generation;
- balance-sheet weakening;
- leverage/refinancing stress;
- governance deterioration;
- durable competitive-position erosion;
- adverse structural industry change;
- intrinsic-value reduction close to or greater than the market-price decline;
- thesis WEAKENING/BROKEN/PENDING;
- risk rising faster than expected return.

Final state may be HOLD, REDUCE, or SELL depending on severity.

## 9.4 Mandatory decline-review triggers

Before another purchase, fresh review is mandatory when:

- price is ≥15% below the most recent **meaningful purchase reference**; or
- price is ≥20% below the last formal thesis-review price.

For this rule, `meaningful purchase reference` means the execution price of the latest purchase that materially changed the position or was explicitly designated in the audit trail as the current decline-review anchor. Tiny cleanup trades, dividend reinvestment, or non-economic bookkeeping entries must not reset the anchor.

If multiple anchors could apply, use the more conservative valid trigger and record the chosen reference.

Until completed:

> `NO ADD — MANDATORY REVIEW OUTSTANDING`

## 9.5 Score deterioration diagnostic

A material score decline is a review signal, not an independent buy/sell rule.

Provisional M4 diagnostic trigger:

> Total Investment Score decline of approximately ≥5 points since the prior formal decision.

When triggered:

- attribute the decline by category;
- separate fundamental/risk deterioration from valuation-driven movement;
- determine whether any category gate or thesis/risk rule has failed;
- do not average down when deterioration is primarily Business Quality, Financial Health, Risk & Governance, or thesis-related unless the deterioration is fully explained and **all governing gates independently still pass**.

The ≥5-point level is a diagnostic escalation threshold only and may be recalibrated in `VALIDATION_CASES.md`; it never overrides category gates, thesis status, or Risk Policy.

A lower score caused primarily by worsened fundamentals is a warning, not a reason to buy more because valuation appears cheaper.

## 9.6 Cost-basis firewall

The following rationales are prohibited:

- “average cost will decrease”;
- “easier to get back to break-even”;
- “already down a lot”;
- “need to recover the loss.”

The required rationale is forward-looking expected value only.

---

# 10. Averaging Up Rules

Buying above the investor's prior purchase price is not inherently bad.

An AVERAGE UP may be rational when:

- intrinsic value increased faster than price;
- thesis strengthened;
- business quality or financial health improved;
- expected 5Y annualized return still meets hurdle;
- portfolio concentration remains acceptable;
- opportunity cost remains favorable.

Do not reject a good incremental purchase merely because the new price exceeds historical cost basis.

Historical cost is not a valuation anchor.

---

# 11. Re-Entry Rules

A fully exited security may later become BUY/STRONG BUY again.

Re-entry requires fresh underwriting as if the investor had never owned it.

The prior exit price, prior realized gain/loss, and desire to “buy back cheaper” must not control the decision.

Required:

- current VN30 eligibility;
- current thesis;
- current score validity;
- current valuation;
- current risk;
- current portfolio context;
- current opportunity cost.

Any prior SELL caused by thesis break or ownership veto requires explicit evidence that the break/veto has genuinely resolved before re-entry can be considered.

---

# 12. Portfolio-Constrained Buy Rules

## 12.1 Single-name constraint

If the intended add would push exposure into a prohibited zone:

- do not execute the add;
- preserve fundamental attractiveness separately;
- route execution to `BLOCKED — PORTFOLIO/RISK`;
- final Decision State follows parent-engine rules.

A high score or deep valuation cannot override a hard concentration limit.

## 12.2 Sector constraint

Before every purchase, calculate post-trade sector exposure.

If sector concentration is already in a no-add zone, new capital in the sector is blocked unless a permitted explicit exception is approved under Risk Policy.

## 12.3 Hidden-factor concentration

A purchase may be blocked or reduced even when formal sector limits pass if it materially increases correlated exposure to the same economic driver, such as:

- property cycle;
- bank-credit cycle;
- commodity price;
- FX sensitivity;
- interest-rate sensitivity;
- state/regulatory exposure;
- consumer leverage;
- common controlling shareholder/governance risk.

This is a portfolio-risk judgment, not a score adjustment.

---

# 13. Cash and Board-Lot Rules

## 13.1 Executable cash

Use authoritative M2 cash state.

Executable cash must be sufficient for the full expected settlement obligation, including the lot purchase and any fees, taxes, or other transaction costs represented by the approved M2 rules.

Do not treat expected future contribution, unsettled proceeds, dividends not yet received, or borrowed funds as executable cash unless M2 rules explicitly classify them as such.

The ~5% operating-liquidity guideline in Risk Policy is not a mandatory minimum cash floor; however, the trade must not create an operational cash shortfall.

## 13.2 Minimum lot

Current operating assumption:

> minimum trade size = 100 shares.

This remains an operational parameter and should be updated if market rules change.

## 13.3 Unaffordable best candidate

If the best qualified candidate cannot be bought with current executable cash:

1. do not borrow;
2. preserve valid allocation merit;
3. classify `REQUIRES CASH ACCUMULATION`;
4. compare carrying cash against qualified affordable alternatives;
5. do not buy a meaningfully inferior stock merely to stay invested.

## 13.4 Lower-ranked substitution safeguard

Until `OPPORTUNITY_COST.md` calibrates the model, retain the approved provisional guide from Decision Engine v1.0.

A lower-ranked affordable candidate should normally **not** replace an unaffordable higher-ranked candidate when any of these is true:

- it is outside the same M3 tie cluster and lacks a clearly superior portfolio-fit reason;
- expected 5Y annualized return is more than ~2 percentage points lower;
- residual risk is materially worse;
- confidence is lower;
- MOS is materially weaker.

A substitution may be considered when both candidates pass all gates and:

- scores are within the M3 ≤2-point tie cluster, or portfolio fit is clearly superior;
- expected-return difference is ≤~2 percentage points;
- risk is no worse;
- confidence is no lower;
- concentration remains acceptable.

This is a provisional execution guide, not a permanent valuation formula.

---

# 14. Technical Entry Rules

Technical analysis is only an execution overlay.

## 14.1 Permitted use

Technical conditions may influence:

- immediate execution versus staging;
- tranche timing;
- avoidance of obvious short-term liquidity/gap risk;
- limit-price discipline;
- sequence between several otherwise similar opportunities.

## 14.2 Prohibited use

Technicals may not:

- make an unqualified security BUY;
- override valuation hurdle;
- override thesis deterioration;
- override risk veto;
- override concentration limits;
- justify indefinite waiting when fundamental expected value is already exceptional without a concrete execution-risk reason.

## 14.3 Unfavorable technical status

If fundamentals support purchase but technical status is unfavorable:

- Decision State may remain BUY/ACCUMULATE/STRONG BUY;
- Execution Sub-Status may become `STAGED` or `TEMPORARILY DEFERRED`;
- the reason must identify a concrete execution risk, not vague chart discomfort.

---

# 15. Mandatory No-Buy Conditions

The system must output `DO NOT BUY / DO NOT ADD` whenever any applicable condition below is present:

1. non-VN30 for new capital;
2. Legacy Holding add request;
3. Stage 0 FAIL or unresolved PENDING;
4. possible or confirmed veto inconsistent with purchase;
5. LOW confidence;
6. `RESEARCH ONLY` / `NOT RELIABLY SCORABLE`;
7. thesis WEAKENING, BROKEN, or PENDING;
8. mandatory thesis/risk review incomplete;
9. minimum category gate failure;
10. expected return below purchase hurdle without valid exception;
11. unacceptable residual risk;
12. portfolio impact `NEGATIVE — DO NOT ADD`;
13. concentration rule blocks add;
14. critical/severe portfolio drawdown approval required but absent;
15. necessary portfolio state unreconciled;
16. leverage/borrowing required;
17. value-trap averaging-down pattern;
18. material business/risk deterioration unresolved;
19. opportunity cost materially inferior;
20. rationale primarily based on break-even, sunk cost, FOMO, or recent price action.

---

# 16. Behavioral Finance Controls for Buys

Every purchase review must actively test for the following biases.

## 16.1 FOMO

Warning signs:

- price rose sharply and urgency increased without new intrinsic-value evidence;
- user fears “missing the move”;
- thesis/valuation work is being compressed to justify immediate action.

Control:

> rerun valuation and expected-return hurdle using current price before authorizing purchase.

## 16.2 Anchoring to prior low price

A stock trading above a previously observed price is not automatically expensive.

Control:

> compare current price with current intrinsic value, not with remembered price.

## 16.3 Anchoring to cost basis

Existing ownership does not make the next lot more attractive.

Control:

> underwrite the incremental lot independently.

## 16.4 Sunk-cost averaging

A larger unrealized loss must not increase willingness to add.

Control:

> remove P&L from the investment-merit section of the add decision.

## 16.5 Action bias from monthly DCA

Receiving new monthly cash can create pressure to trade.

Control:

> default outcome may be HOLD CASH when no candidate passes the full hurdle.

## 16.6 Rank chasing

Top-ranked does not mean automatically buyable.

Control:

> ranking is considered only after eligibility, thesis, valuation, risk, portfolio, confidence, and opportunity-cost gates.

---

# 17. Buy Decision Workflow

Use this order for every contemplated purchase.

## Step 1 — Classify ownership and action type

Determine:

- UNOWNED / OWNED;
- INITIATE / ADD / AVERAGE DOWN / AVERAGE UP / RE-ENTER.

## Step 2 — Confirm mandate and Stage 0

If fail → stop.

## Step 3 — Validate evidence quality

Confirm score validity, data freshness, source quality, and confidence.

A materially stale or internally contradictory input that could change thesis, valuation, risk, or portfolio eligibility makes the decision non-actionable until refreshed or reconciled.

If insufficient → no buy.

## Step 4 — Re-underwrite thesis

Classify thesis as IMPROVING / INTACT / WEAKENING / BROKEN / PENDING.

Only first two proceed.

## Step 5 — Apply category gates

Failure → stop positive allocation.

## Step 6 — Recalculate valuation

Update:

- intrinsic-value range;
- MOS;
- expected 5Y annualized total return;
- downside case;
- valuation confidence.

## Step 7 — Apply risk gates

Check vetoes, residual risk, review triggers, drawdown state.

## Step 8 — Apply averaging-down special controls if relevant

Complete mandatory decline review and value-trap test.

## Step 9 — Reconstruct post-trade portfolio

Check:

- single-name weight;
- sector weight;
- correlated-factor exposure;
- cash remaining;
- liquidity/operational feasibility.

## Step 10 — Compare opportunity cost

Compare with cash, existing add candidates, and other actionable VN30 names.

## Step 11 — Check execution feasibility

Validate board lot, executable cash, settlement costs, operational permission, and any required risk approval.

If unaffordable but otherwise valid → preserve merit and use `REQUIRES CASH ACCUMULATION`.

If a portfolio/risk approval is required but absent → preserve fundamental merit where appropriate, but use `BLOCKED — PORTFOLIO/RISK` and do not trade.

## Step 12 — Apply technical execution overlay

Use only for timing/staging.

## Step 13 — Produce exactly one Decision State

- STRONG BUY;
- BUY;
- ACCUMULATE;
- or a non-buy state if gates fail.

## Step 14 — Record audit evidence

No purchase decision is complete without reconstructable evidence.

---

# 18. Required Buy Output

Every positive buy recommendation must contain at least:

## Recommendation

- Decision State;
- Decision Qualifier if applicable;
- Buy Action Type;
- Execution Sub-Status.

## Evidence

- Total Score and relevant category scores;
- Score Validity;
- Confidence;
- Thesis Status and Strength;
- current price and valuation as-of date;
- intrinsic-value range;
- expected 5Y annualized total return;
- MOS;
- residual risk;
- veto/review status.

## Portfolio context

- current shares;
- current position weight;
- proposed post-trade weight;
- current and proposed sector weight;
- current executable cash;
- minimum lot cost;
- portfolio impact result;
- opportunity-cost comparison.

## Action

- INITIATE / ADD / AVERAGE DOWN / AVERAGE UP / RE-ENTER;
- number of shares or sizing placeholder owned by `POSITION_SIZING.md`;
- execute / staged / deferred / cash accumulation;
- no leverage.

## Reasons

At least:

- why buy now;
- why valuation is sufficient;
- why risk is acceptable;
- why this use of capital beats reasonable alternatives.

## Invalidation

- thesis-break conditions;
- risk triggers;
- valuation/price conditions requiring review;
- portfolio-limit conditions.

## Next review

Use event-based triggers and dates as required by the parent Decision Engine.

---

# 19. Buy Audit Trail

Minimum buy-specific audit fields:

- Decision ID;
- Decision Date/Time;
- Data As-Of;
- Portfolio As-Of;
- Ticker / Security ID;
- VN30 membership status;
- Ownership state;
- Buy Action Type;
- Decision State;
- Execution Sub-Status;
- Score / category scores;
- Score Validity;
- Confidence;
- Original Thesis;
- Current Thesis;
- Thesis Status;
- Material Changes Since Prior Decision;
- valuation method;
- intrinsic-value range;
- expected 5Y annualized total return;
- MOS;
- downside case;
- residual risk;
- veto status;
- mandatory-review status;
- current shares;
- current weight;
- proposed shares;
- proposed post-trade weight;
- sector pre/post weights;
- executable cash;
- lot cost;
- opportunity-cost comparison;
- technical execution status;
- Hurdle Exception flag if used;
- Small-NAV Exception flag if used;
- averaging-down review result if relevant;
- reasons;
- invalidation conditions;
- next review trigger;
- prior Decision ID;
- methodology version references.

---

# 20. Buy-Specific Consistency Rules

The following invariants must always hold:

1. BUY/ACCUMULATE/STRONG BUY cannot coexist with LOW confidence.
2. ACCUMULATE cannot coexist with Stage 0 PASS WITH CONDITIONS.
3. Averaging down cannot coexist with thesis WEAKENING/BROKEN/PENDING.
4. A capital-allocation veto cannot coexist with positive allocation.
5. A positive buy cannot require leverage.
6. Cost basis cannot justify a purchase.
7. A price decline cannot substitute for improved valuation evidence.
8. A price increase cannot block a purchase if current forward return and all gates still pass.
9. A top ranking cannot bypass category/risk/portfolio gates.
10. Unaffordable lot alone cannot convert a valid BUY into AVOID.
11. Portfolio/risk concentration block cannot be hidden as a technical delay.
12. Technical favorability cannot upgrade failed fundamentals into BUY.
13. STRONG BUY cannot imply all-in sizing.
14. Existing ownership cannot lower the standard for the next lot.
15. Monthly DCA availability cannot force capital deployment.
16. Positive allocation merit and executable trade authorization must be recorded separately.
17. Cash/lot infeasibility cannot be disguised as fundamental ineligibility, and fundamental ineligibility cannot be disguised as a temporary execution delay.
18. A provisional diagnostic threshold (such as a ≥5-point score decline) cannot override thesis, category, valuation, or risk gates.

---

# 21. Interfaces to Later M4 Files

## 21.1 `DCA_RULES.md`

Must consume this file's buy eligibility and may not force deployment into a candidate that fails these rules.

## 21.2 `POSITION_SIZING.md`

Must determine compliant trade size only after buy eligibility is established.

It may reduce size or defer execution; it may not transform an ineligible security into a buy.

## 21.3 `OPPORTUNITY_COST.md`

Must calibrate:

- new-cash comparison;
- affordable-alternative substitution;
- materiality thresholds;
- tie-cluster behavior.

It may reorder eligible opportunities but may not override veto/thesis/category gates.

## 21.4 `DECISION_TEMPLATE.md`

Must expose the fields required in §18–19.

## 21.5 `VALIDATION_CASES.md`

Must test at least:

- high score + poor valuation;
- low score + price crash;
- averaging down after thesis deterioration;
- averaging up after intrinsic-value increase;
- insufficient cash for best candidate;
- affordable but inferior alternative;
- concentration block;
- +20% prior gain followed by still-attractive valuation;
- Stage 0 PASS WITH CONDITIONS BUY exception;
- LOW-confidence attractive valuation;
- technical unfavorable but fundamentally valid BUY;
- DCA month with no qualified opportunity.

---

# 22. Draft Review Checklist

Before this file can become an approved baseline, verify that it:

1. preserves `DECISION_ENGINE.md` v1.0 precedence;
2. does not map score directly to BUY;
3. preserves 15% normal BUY hurdle;
4. preserves 12% exceptional floor;
5. keeps STRONG BUY rare and normally ≥18% forward-return guide;
6. requires fresh underwriting for every add;
7. robustly separates good averaging down from value traps;
8. prevents cost-basis and break-even bias;
9. prevents forced monthly deployment;
10. respects VN30 eligibility and Legacy Holding no-add rule;
11. respects single-name/sector concentration rules;
12. preserves cash accumulation when lot is unaffordable;
13. keeps technicals subordinate;
14. requires opportunity-cost comparison;
15. produces reconstructable audit evidence;
16. leaves exact sizing, DCA allocation, and calibrated opportunity-cost math to their owner files.

---

## Status

> **DRAFT v0.2 — Multi-role reviewed and strengthened against approved `DECISION_ENGINE.md` v1.0 baseline.**

> **Awaiting multi-role review and user approval before starting `SELL_RULES.md`.**
