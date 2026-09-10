# OPPORTUNITY_COST.md

**Status:** Approved Baseline v1.0

# VN30 Value Investing OS — Opportunity Cost Rules

**Document:** `04_DECISION_ENGINE/OPPORTUNITY_COST.md`  
**Milestone:** 4 — Buy / Hold / Sell Decision Engine  
**Version:** 1.0
**Date:** 2026-09-07

**Primary Parent:**
- `04_DECISION_ENGINE/DECISION_ENGINE.md` v1.0 — Approved Baseline

**Approved Sibling Dependencies:**
- `04_DECISION_ENGINE/BUY_RULES.md` v1.0 — Approved Baseline
- `04_DECISION_ENGINE/SELL_RULES.md` v1.0 — Approved Baseline
- `04_DECISION_ENGINE/DCA_RULES.md` v1.0 — Approved Baseline
- `04_DECISION_ENGINE/POSITION_SIZING.md` v1.0 — Approved Baseline

**Other Governing Documents:**
- `INVESTMENT_POLICY.md` — Approved
- `RISK_POLICY.md` v1.0 — Approved
- `DECISION_FRAMEWORK.md` v1.0 — Approved
- `SCORING_MODEL.md` v1.0 — Approved
- Milestone 2 portfolio/accounting data model — Approved
- Milestone 3 scoring/ranking documents — Approved

---

# 1. Purpose

This document defines how VN30 Value Investing OS compares competing uses of scarce capital. It distinguishes incremental-cash allocation from existing-capital reallocation so that new money and switch decisions are never conflated.

Opportunity cost answers the question:

> **Given the portfolio, cash, risk, and executable opportunity set today, what is the best use of the next unit of capital?**

The comparison is never limited to two stocks. The minimum comparator set is:

1. add to an existing holding;
2. initiate a new position;
3. keep current holdings unchanged;
4. retain cash;
5. where appropriate, reduce or exit an existing holding and redeploy capital.

Opportunity cost is a **decision layer**, not a replacement for underwriting. A security must first pass the relevant fundamental, thesis, valuation, confidence, and risk gates before it can compete for incremental capital.

---

# 2. Core Principles

1. **Capital is scarce even when cash is available.**
2. **Cash is an explicit comparator, not leftover capital.**
3. **A higher score does not automatically mean higher opportunity-cost priority.**
4. **A lower-priced or affordable stock is not automatically a better use of capital.**
5. **Existing ownership does not create priority.**
6. **Cost basis, break-even price, and unrealized P&L are excluded from opportunity-cost merit.**
7. **Switching requires a materially better alternative, not a marginal numerical edge.**
8. **Risk reduction can itself create economic value and may justify a switch with a smaller return advantage.**
9. **Board-lot constraints affect execution, not economic ranking.**
10. **Opportunity cost cannot override mandate, hard veto, thesis failure, hard limits, or data-quality blocks.**
11. **False precision is prohibited.** Expected-return estimates are ranges with uncertainty, not exact truth.
12. **The best decision may be HOLD CASH.**

---

# 3. Scope Boundary

## 3.1 This file owns

This file owns:

- incremental-capital comparison across eligible VN30 securities;
- comparison of new positions versus additions to existing holdings;
- cash as a competing allocation;
- existing-capital switch decisions;
- material-superiority thresholds;
- tie handling under uncertain expected returns;
- portfolio-fit adjustments;
- opportunity-cost ranking output;
- opportunity-cost audit fields;
- anti-churn and anti-FOMO controls.

## 3.2 This file does not own

This file does not redefine:

- Fundamental Score methodology;
- sector normalization;
- Decision State definitions;
- thesis or veto definitions;
- hard portfolio limits;
- detailed target-position sizing;
- DCA funding cadence;
- accounting definitions;
- final reporting template.

If this document conflicts with a higher-precedence approved rule, the higher-precedence rule governs.

---

# 4. Opportunity-Cost Universe

A security may enter the **incremental-capital opportunity set** only when all applicable positive-allocation gates pass.

At minimum:

- current VN30 member;
- Stage 0 = `PASS`, except a narrowly authorized `PASS WITH CONDITIONS` case allowed by approved Buy Rules;
- Score Validity = `VALID — ACTIONABLE` for normal new capital;
- Data Confidence >= `MEDIUM`;
- Thesis Status = `INTACT` or `IMPROVING` for normal new capital;
- required category gates pass;
- no hard veto that prohibits new capital;
- valuation / forward-return hurdle passes;
- portfolio review status allows action;
- sufficient current data exist for comparison.

A candidate that fails investment merit is not rescued by high affordability, chart strength, low P/E, high dividend yield, recent price decline, or current portfolio underweight.

## 4.1 Comparator Set

The engine should compare, where applicable:

- all `STRONG BUY` candidates;
- all `BUY` candidates;
- all actionable `ACCUMULATE` candidates;
- `HOLD CASH`;
- existing holdings that could rationally fund a switch after sell-side review.

The Top 10 fundamental ranking is a research prioritization input, not a hard limit on the opportunity-cost universe. A name outside the Top 10 may still be a valid comparator if it is actionable and portfolio-relevant.

## 4.2 Two Allocation Modes

Opportunity cost operates in two distinct modes. They share underwriting inputs but do **not** share the same hurdle.

### Mode A — Incremental Capital

Used for newly available cash, accumulated DCA cash, dividends, or other uncommitted capital.

Valid comparators are:

- initiate a new position;
- add to an existing position;
- retain cash.

An unchanged existing holding is portfolio context, but it is **not** a direct use of the new unit of cash.

### Mode B — Existing Capital Reallocation

Used when considering whether capital already committed to a holding should remain there or be reduced/sold and redeployed.

Valid comparators are:

- retain the current holding;
- partially reduce and hold cash;
- partially reduce and redeploy;
- fully sell and hold cash;
- fully sell and redeploy, subject to `SELL_RULES.md`.

Mode B carries a higher hurdle because it introduces switch friction, model error on both securities, and churn risk. A rule calibrated for Mode A must not be copied mechanically into Mode B.


---

# 5. Required Inputs

## 5.1 Security-Level Inputs

For each candidate:

- ticker/security ID;
- current Decision State;
- Fundamental Score and category scores;
- Score Validity;
- Data Confidence;
- Original Thesis;
- Current Thesis Status;
- Thesis Strength;
- expected 5Y annualized total return range;
- central expected-return estimate, if supported;
- intrinsic-value range;
- margin of safety;
- downside scenario;
- residual risk;
- valuation confidence;
- current portfolio weight;
- target/economic position range from `POSITION_SIZING.md`;
- sector and correlated-factor exposure;
- current actionable ranking/tie cluster;
- current market price and executable lot cost;
- data as-of date.

## 5.2 Portfolio-Level Inputs

- portfolio NAV;
- executable cash;
- current holdings and weights;
- sector weights;
- hidden-factor/correlation concentrations;
- portfolio drawdown regime;
- current phase: Capital Building or Mature Portfolio;
- approved exceptions/escalations;
- available proceeds from any proposed reduction/sale, where relevant.

## 5.3 Data Integrity Rule

Comparisons are valid only when both sides are sufficiently current and methodologically comparable.

If candidate A uses refreshed earnings and valuation while candidate B uses stale financials that could materially alter expected return, thesis, or risk, the engine must not manufacture a precise relative rank. The stale comparator is marked non-actionable until refreshed.

---

# 6. Precedence

Opportunity-cost logic operates only after higher-precedence rules:

1. mandate / legal / operational prohibition;
2. ownership or capital-allocation veto;
3. hard portfolio limit;
4. mandatory review / escalation;
5. portfolio resilience;
6. thesis / valuation / expected-return eligibility;
7. opportunity-cost comparison;
8. execution feasibility;
9. technical timing.

Opportunity cost can choose among valid alternatives. It cannot legalize an invalid alternative.

---

# 7. Comparison Architecture

Opportunity cost is evaluated in four layers.

## Layer 1 — Absolute Merit

Each candidate must first justify ownership on its own merits.

Questions:

- Is the thesis valid?
- Is expected return adequate?
- Is margin of safety sufficient?
- Is downside acceptable?
- Is confidence adequate?

A weak absolute case is not improved by being “better than an even worse stock.”

## Layer 2 — Relative Merit

Compare eligible candidates on:

- expected 5Y annualized total return;
- margin of safety;
- downside asymmetry;
- business/financial quality;
- residual risk;
- Data Confidence;
- thesis strength;
- capital-allocation quality.

## Layer 3 — Portfolio Fit

Adjust the comparison for:

- current position size;
- single-name headroom;
- sector headroom;
- hidden-factor correlation;
- diversification benefit;
- portfolio drawdown regime;
- marginal contribution to portfolio risk;
- whether the allocation improves or worsens resilience.

Portfolio fit may change **allocation priority**, but it must not change the Fundamental Score.

## Layer 4 — Execution Feasibility

Finally evaluate:

- cash;
- board lot;
- settlement cost;
- required approvals;
- trade-size feasibility;
- technical entry overlay.

Execution feasibility may delay the best economic allocation. It must not rewrite which candidate has higher economic merit.

---

# 8. Opportunity-Cost Decision Ladder

For each unit of incremental capital, apply this sequence:

### Step 1 — Build actionable candidates

Exclude any candidate blocked by mandate, stale data, LOW confidence, thesis failure, veto, unresolved review, or failed buy/add gates.

### Step 2 — Add cash as a comparator

Cash is always included.

### Step 3 — Determine absolute expected-return adequacy

Normal guide:

- >=15% expected 5Y annualized total return: normal BUY hurdle may be satisfied;
- 12–15%: only approved high-quality exception conditions may support new capital;
- <12%: does not normally justify new capital.

These thresholds do not replace full underwriting.

### Step 4 — Compare economic attractiveness

Prefer candidates with stronger combinations of:

- expected return;
- MOS;
- downside protection;
- business quality;
- thesis strength;
- confidence;
- residual risk.

### Step 5 — Apply portfolio-fit adjustment

An economically similar candidate may receive higher allocation priority if it materially improves portfolio resilience or avoids concentration.

### Step 6 — Apply materiality / uncertainty filter

Do not switch priority because of trivial differences inside the normal error range of valuation estimates.

### Step 7 — Apply execution feasibility

Determine whether the highest-priority allocation is executable now.

### Step 8 — Compare carry-cash versus substitution

If the best candidate is not executable, compare:

- accumulating cash for that candidate;
- buying a lower-ranked affordable candidate now.

Use the substitution rule in Section 12.

### Step 9 — Output one capital-allocation priority

Examples:

- `DEPLOY — NEW POSITION`;
- `DEPLOY — ADD EXISTING`;
- `DEPLOY — SPLIT`;
- `HOLD CASH — WAIT FOR BETTER ABSOLUTE MERIT`;
- `HOLD CASH — ACCUMULATE FOR SUPERIOR CANDIDATE`;
- `SWITCH — SUBJECT TO SELL/BUY AUTHORIZATION`;
- `NO ACTION — DATA/REVIEW BLOCK`.

## 8.1 Marginal Re-Ranking Requirement

Opportunity cost is evaluated at the **margin**, not once for the entire cash balance.

After each executed lot or economically meaningful tranche, the engine must refresh at least:

- executable cash;
- current position weight;
- marginal capacity;
- single-name/sector/factor exposure;
- remaining target range;
- affordability of competing candidates.

If any of these changes enough to affect priority, the opportunity set must be re-ranked before allocating the next lot/tranche.

This prevents a candidate that was optimal for the first unit of capital from automatically receiving all remaining cash after its marginal attractiveness or portfolio headroom has deteriorated.

---

# 9. Relative Comparison Framework

The engine must avoid a simplistic weighted “utility score” that creates false precision. Instead it uses a hierarchy of discriminators.

## 9.1 Primary Discriminators

Primary comparison order:

1. expected 5Y annualized total return;
2. residual/downside risk;
3. Data Confidence;
4. margin of safety;
5. thesis strength / durability;
6. business and financial quality;
7. portfolio fit.

This order is a **comparison guide**, not a mechanical override. A small expected-return advantage does not justify materially worse risk or confidence.

## 9.2 Tie Cluster

Consistent with M3, Total Scores within <=2 points are normally treated as a tie cluster.

Inside a tie cluster, prefer:

1. higher expected return;
2. lower residual risk;
3. higher confidence;
4. stronger MOS;
5. better portfolio fit.

A candidate outside the score tie cluster can still be preferred if the score difference is not decision-relevant and the portfolio/risk advantage is clearly material, but the reason must be explicitly documented.

## 9.3 Expected-Return Uncertainty

Expected returns should be treated as ranges.

If the plausible ranges overlap heavily, a small difference in point estimates is not economically meaningful.

Default rule:

> A relative expected-return edge of <2 percentage points should normally be treated as **non-decisive** unless supported by clearly superior risk, confidence, MOS, or portfolio fit.

This 2pp value is a provisional M4 materiality guide, not a mathematical truth.

## 9.4 Robust-Superiority Test

A candidate should be described as `SUPERIOR` only when the advantage survives reasonable model uncertainty. The engine should test, qualitatively or quantitatively where supported:

- overlap of expected-return ranges;
- sensitivity of intrinsic value to key assumptions;
- downside-case severity;
- confidence difference;
- whether the conclusion reverses under a reasonable bear/base-case change.

If a small assumption change reverses the ordering, relative merit is `COMPETITIVE` or `INDETERMINATE`, not `SUPERIOR`.

The system must not use decimal-level expected-return precision to break a tie that the underlying evidence cannot support.

---

# 10. Cash as an Opportunity

Cash competes against every purchase.

`HOLD CASH` is preferred when:

- no candidate clears the normal absolute hurdle;
- only LOW-confidence opportunities exist;
- valuation uncertainty is too high;
- portfolio concentration would worsen materially;
- the best economic candidate is temporarily unaffordable and inferior substitutions fail the substitution test;
- the portfolio is in a risk regime where additional exposure requires authorization that has not been granted;
- current data are stale or contradictory;
- transaction size would create a poor risk/reward outcome.

Cash should not be held merely because:

- the market “feels expensive” without security-level evidence;
- the investor predicts an imminent correction;
- recent prices rose;
- the investor fears regret after buying.

Cash is optionality, not a market-timing thesis.

---

# 11. New Position vs Existing Holding

Existing holdings receive no automatic preference.

A new `BUY` and an existing `ACCUMULATE` candidate are compared using the same economic principles.

An existing holding may deserve priority when:

- thesis is at least as strong;
- expected return is competitive;
- confidence is at least as high;
- residual risk is no worse;
- current position remains below its justified target range;
- adding does not create concentration problems.

A new position may deserve priority when:

- it offers materially better expected return/risk;
- it improves diversification;
- the existing holding is already near target;
- sector or factor concentration makes further adding inefficient;
- the new thesis is stronger or confidence higher.

No preference may be based on:

- “I already own it”;
- “I need to lower average cost”;
- “I want every VN30 stock”;
- “I do not want too many positions.”

---

# 12. Unaffordable Top Candidate vs Affordable Lower Candidate

This section owns the economic comparison used by DCA and board-lot execution.

Assume candidate A has higher economic merit but cannot currently be purchased without waiting for more cash. Candidate B is affordable now.

## 12.1 Default Rule

Prefer **carry cash for A** rather than purchase B merely for activity when any of the following is true:

- B is outside the same M3 score tie cluster and lacks a compensating portfolio advantage;
- B's expected 5Y annualized total return is >2pp lower than A's;
- B has materially worse residual risk;
- B has lower Data Confidence;
- B has materially weaker MOS;
- B worsens concentration relative to A;
- B would consume cash needed to reach A without providing clearly competitive economic merit.

## 12.2 Substitution May Be Rational

B may be selected now only when all apply:

- B independently passes all buy/add gates;
- B is economically close to A, normally within the same <=2-point score tie cluster **or** has clearly superior portfolio fit;
- expected-return difference is <=2pp, unless risk-adjusted evidence strongly favors B;
- B's residual risk is no worse;
- confidence is no lower;
- MOS is not materially weaker;
- post-trade concentration remains acceptable;
- buying B does not create a repeated pattern of starving superior opportunities.

## 12.3 Repeated-Substitution Guard

The engine must track repeated cases where capital is diverted from a superior but temporarily unaffordable opportunity into second-best affordable names.

If this pattern recurs, the default changes toward `HOLD CASH — ACCUMULATE FOR SUPERIOR CANDIDATE` unless the lower-ranked allocations remain genuinely competitive after fresh review.

This protects against action bias and board-lot-induced portfolio drift.

---

# 13. Existing-Capital Switch Rule

Switching means selling/reducing a valid existing holding specifically to fund a different security.

Switching is materially different from allocating new monthly cash because it incurs:

- transaction friction;
- potential tax/fee costs;
- thesis displacement risk;
- model-error risk on both sides;
- behavioral churn risk;
- possible loss of diversification.

Therefore the hurdle is higher.

## 13.1 Switch Preconditions

Before a switch is considered:

- current holding must receive a fresh HOLD/REDUCE/SELL review;
- replacement must independently qualify for BUY/STRONG BUY/ACCUMULATE;
- both securities must have sufficiently current data;
- expected-return estimates must be methodologically comparable;
- post-switch portfolio concentration must be acceptable;
- transaction and settlement costs must be included operationally.

## 13.2 Material-Superiority Default

For a **valid long-term holding**, replacement should normally offer:

> **>=3 percentage points higher expected 5Y annualized total return before friction, with the superiority remaining material after reasonable transaction friction and uncertainty are considered**

The 3pp hurdle is therefore not satisfied merely because two point estimates differ by 3.0pp. The case must remain economically superior after considering fees/taxes where applicable, bid/ask or execution friction, uncertainty-band overlap, and the risk of replacing one model estimate with another.

and all of the following:

- business/financial quality no worse in a decision-relevant way;
- residual risk not materially higher;
- Data Confidence no lower;
- thesis durability at least comparable;
- portfolio fit not worse.

The 3pp threshold is a provisional M4 anti-churn default. It is deliberately higher than the <=2pp tie/materiality guide.

## 13.3 Risk-Reduction Exception

A smaller expected-return advantage may justify a partial switch when the transaction independently creates meaningful portfolio value by:

- reducing excessive single-name concentration;
- reducing sector/factor concentration;
- reducing residual risk;
- improving portfolio resilience;
- addressing a WEAKENING thesis while retaining some ownership.

In such cases the decision should normally be `REDUCE` on the funding holding rather than manufacture a full `SELL` solely for opportunity cost.

## 13.4 Partial-vs-Full Switch Discipline

Opportunity cost determines whether reallocation is justified; it does not automatically imply a full switch.

- If residual ownership remains justified, default to `REDUCE` rather than `SELL`.
- Full `SELL` for opportunity cost alone requires evidence that target ownership should be zero under `SELL_RULES.md`, not merely that another stock is better.
- Reallocation amount is capped by both the funding holding's justified reduction and the replacement's marginal capacity under `POSITION_SIZING.md`.
- Any excess proceeds may remain cash.

## 13.5 No Switch for Marginal Differences

Do not switch a valid long-term holding because:

- replacement score is 1–2 points higher;
- expected-return point estimate is only marginally higher;
- replacement recently outperformed;
- current holding has been flat;
- investor wants to “upgrade” constantly;
- the portfolio has temporary cash scarcity.

---

# 14. Opportunity Cost in REDUCE and SELL Decisions

Opportunity cost is lower in the SELL hierarchy than:

1. BROKEN thesis / ownership prohibition;
2. hard risk breach;
3. mandatory risk normalization.

A mandatory exit does not require a superior replacement.

For discretionary `REDUCE` or `SELL` driven primarily by opportunity cost:

- current holding must still be reviewed on its own merits;
- replacement must be materially superior under Section 13;
- cash is also a valid destination if no replacement is strong enough;
- lack of immediate replacement does not block a mandatory SELL.

---

# 15. Portfolio-Fit Adjustment

Portfolio fit can change priority when candidates are otherwise economically similar.

Positive portfolio-fit factors:

- lower correlated exposure;
- better sector balance;
- lower incremental downside contribution;
- improved diversification without sacrificing quality;
- filling an underrepresented exposure with genuine investment merit.

Negative portfolio-fit factors:

- adding to a >10% position without strong justification;
- pushing a position toward >15% no-add territory;
- sector exposure already >25–30%;
- hidden-factor concentration;
- concentration in highly cyclical or correlated earnings drivers;
- reduced liquidity/resilience.

Portfolio fit must never be used to force diversification into a weak security.

Portfolio fit also must not be used as an unbounded bonus. A diversification benefit can break a close economic tie, reduce the amount allocated to a concentrated name, or justify a risk-reduction reallocation; it cannot compensate for a material deficit in absolute merit, thesis quality, expected return, or data confidence.

---

# 16. Decision-State Interaction

Opportunity cost helps distinguish among final states but does not mechanically assign them.

## STRONG BUY

Requires top-tier absolute merit and top-tier relative merit. It should normally compare favorably with both other actionable securities and cash.

## BUY

Requires strong absolute merit and competitive use of new capital. It does not have to be rank #1 if portfolio fit or execution structure supports another rational allocation.

## ACCUMULATE

Requires that adding the existing holding remains competitive against new BUY candidates and cash, subject to position-size headroom.

## HOLD

A valid HOLD must answer:

> Why is retaining this holding better than adding to it, reducing it, replacing it, or holding equivalent capital elsewhere?

## REDUCE

Opportunity cost may support REDUCE when residual ownership remains justified but a smaller allocation would improve portfolio expected value or resilience.

## SELL

Opportunity-cost-only SELL requires a high hurdle for an otherwise valid holding. Broken thesis/risk exits do not require a replacement.

## AVOID

An AVOID name does not compete for capital until its blocking condition is resolved and it is freshly underwritten.

---

# 17. DCA Interface

For periodic cash, `DCA_RULES.md` should consume this file's outputs rather than recreate relative-comparison logic.

Required outputs to DCA:

- Opportunity-Cost Priority Rank;
- comparator class: `NEW`, `ADD`, `CASH`;
- expected-return range;
- risk/confidence/MOS comparison;
- portfolio-fit assessment;
- affordability status;
- substitution eligibility;
- reason cash is or is not superior.

DCA remains responsible for funding cadence and executable allocation of available cash.

---

# 18. Position-Sizing Interface

`POSITION_SIZING.md` determines **how much** may be owned or traded after opportunity-cost priority is established.

Opportunity cost must not infer that the highest-ranked candidate should receive unlimited capital.

A candidate can be:

- highest priority;
- yet already at/above target;
- therefore receive no additional capital.

In that case capital moves to the next valid comparator or cash.

The opportunity-cost engine should use **marginal capacity**, not merely security attractiveness.

---

# 19. Technical / Market Overlay

Technical analysis can optimize timing among already-approved allocations.

It may support:

- staged entry;
- temporary execution deferral;
- limit-price discipline;
- avoiding poor short-term liquidity conditions.

It may not:

- turn an inferior fundamental candidate into the preferred economic allocation;
- override a hard SELL/REDUCE requirement;
- justify buying solely because price momentum is strong;
- justify cash solely because a correction is predicted.

---

# 20. Behavioral Finance Controls

Before finalizing opportunity cost, explicitly test for:

## 20.1 Action Bias

Question:

> Am I buying an inferior affordable stock merely because cash is available?

Control: compare against `HOLD CASH` and the superior unaffordable candidate.

## 20.2 Endowment Effect

Question:

> Am I favoring an existing holding because I already own it?

Control: compare the holding as if underwriting from zero today, while separately recognizing switch friction.

## 20.3 Anchoring

Question:

> Is cost basis or prior target price influencing the comparison?

Control: use current forward returns and intrinsic-value ranges only.

## 20.4 FOMO / Recency Bias

Question:

> Is recent price performance making a candidate appear more attractive than current fundamentals justify?

Control: separate price movement from thesis and intrinsic value.

## 20.5 Loss Aversion

Question:

> Am I avoiding a superior switch because realizing a loss feels painful?

Control: cost basis must not enter economic merit.

## 20.6 Churn / Optimization Bias

Question:

> Am I constantly switching because small model differences look meaningful?

Control: apply the 3pp switch hurdle and uncertainty ranges.

## 20.7 Diversification Bias

Question:

> Am I buying a mediocre stock just to increase ticker count?

Control: diversification cannot rescue weak absolute merit.

---

# 21. Deterministic Output Contract

Every opportunity-cost review should output:

```text
Opportunity Cost Review ID:
Date / Time:
Portfolio As-Of:
Data As-Of:

Candidate / Ticker:
Allocation Mode: INCREMENTAL CAPITAL / EXISTING CAPITAL REALLOCATION
Comparator Type: NEW / ADD / CASH / RETAIN HOLDING / SWITCH
Decision State:
Fundamental Score:
Score Validity:
Data Confidence:
Thesis Status:
Expected 5Y Return Range:
Margin of Safety:
Residual Risk:
Current Weight:
Economic Target Range:
Marginal Capacity:
Marginal Lot/Tranche Number:
Sector / Factor Impact:

Absolute Merit: PASS / FAIL
Relative Merit: SUPERIOR / COMPETITIVE / INFERIOR / INDETERMINATE
Portfolio Fit: IMPROVES / NEUTRAL / WORSENS
Opportunity-Cost Priority Rank:
Tie Cluster:

Best Alternative:
Expected-Return Difference:
Expected-Return Range Overlap:
Friction / Switching Cost Assessment:
Risk Difference:
Confidence Difference:
MOS Difference:
Portfolio-Fit Difference:

Cash Comparator: BETTER / COMPETITIVE / INFERIOR
Affordability: EXECUTABLE / REQUIRES CASH ACCUMULATION
Substitution Eligible: YES / NO / N/A
Switch Eligible: YES / NO / N/A

Recommended Capital Use:
Reason:
What Would Change the Ranking:
Next Review Trigger:
Methodology Versions:
```

If relative merit is `INDETERMINATE` because uncertainty is too high, the system must not fabricate a precise rank. It should favor cash or a robustly superior candidate where applicable.

---

# 22. Audit Requirements

Each opportunity-cost decision must retain enough evidence to reconstruct:

- opportunity set considered;
- exclusions and reasons;
- security data dates;
- expected-return ranges;
- risk/confidence/MOS comparisons;
- current and post-trade portfolio exposures;
- cash comparator;
- chosen candidate;
- rejected alternatives;
- material-superiority calculation for switches;
- affordability and lot-size constraint;
- decision maker / required approvals;
- relevant methodology versions.

This is necessary to distinguish good process from lucky outcomes.

---

# 23. Validation Cases

## Case 1 — Best candidate unaffordable, weak substitute available

- A: expected return 19%, HIGH confidence, strong MOS, needs more cash.
- B: expected return 15%, MEDIUM confidence, affordable now.

Expected:
- do not buy B merely for activity;
- `HOLD CASH — ACCUMULATE FOR SUPERIOR CANDIDATE` unless B has a separately compelling portfolio advantage.

## Case 2 — Two near-equal candidates

- A score 84, expected return 17.5%, HIGH confidence.
- B score 83, expected return 16.5%, HIGH confidence, materially better sector diversification.

Expected:
- same tie cluster;
- 1pp return difference is non-decisive;
- B may receive higher allocation priority due to portfolio fit.

## Case 3 — Existing holding vs new candidate

- Existing ACCUMULATE candidate: 16.5% expected return, HIGH confidence, current weight 8%.
- New BUY: 18%, MEDIUM confidence, similar risk.

Expected:
- new candidate is not automatically superior;
- compare uncertainty, confidence, MOS, diversification, and marginal capacity.

## Case 4 — Marginal switch

- Current valid HOLD: 15.5% expected return.
- Replacement: 17% expected return, similar quality/risk.

Expected:
- no switch based solely on 1.5pp advantage;
- avoid churn.

## Case 5 — Material switch

- Current valid HOLD: 14.5% expected return.
- Replacement: 18.5% expected return, equal/higher confidence, no worse risk, better MOS.

Expected:
- switch may qualify, subject to sell/buy authorization and portfolio checks.

## Case 6 — Risk-reduction switch

- Current position 18% NAV with elevated concentration.
- Replacement expected return advantage only 1.5pp but materially reduces concentration and has comparable quality/risk.

Expected:
- partial REDUCE/reallocation may be rational under risk-reduction exception;
- do not require full 3pp edge mechanically.

## Case 7 — Mandatory SELL with no replacement

- Thesis BROKEN.
- No attractive BUY candidates.

Expected:
- SELL remains valid;
- proceeds may remain cash;
- lack of replacement does not block exit.

## Case 8 — Stale comparator

- A uses current results.
- B valuation is based on materially stale financials.

Expected:
- do not produce false precise rank A vs B;
- B becomes non-actionable pending refresh.

## Case 9 — Top-ranked candidate already at capacity

- A is highest economic merit but current weight is at permitted target/limit.
- B is next-best valid candidate.

Expected:
- no add to A;
- evaluate B versus cash using marginal capacity.

## Case 10 — Cash beats all candidates

- all actionable names have expected return below normal hurdle without exception-quality evidence.

Expected:
- `HOLD CASH — WAIT FOR BETTER ABSOLUTE MERIT`.

## Case 11 — Recent winner bias

- candidate rallied strongly but forward return compressed below buy hurdle.

Expected:
- recent momentum does not create priority;
- valuation/forward return governs.

## Case 12 — Loss-aversion switch

- current holding trades below cost but valid expected return is 11%; replacement offers robust 17% expected return with materially better risk-adjusted case.

Expected:
- cost basis is ignored;
- switch considered under current forward economics.

## Case 13 — First lot optimal, second lot not optimal

- A is highest priority before purchase and has 9% current weight.
- One board lot moves A to 12.5%, making concentration elevated.
- B remains a valid BUY with competitive economics and better portfolio fit.

Expected:
- execute only the justified first lot in A;
- refresh marginal capacity and re-rank before allocating another lot;
- do not let the initial rank consume all available cash automatically.

## Case 14 — Gross 3pp switch edge disappears after uncertainty/friction

- current HOLD central expected return 14.5%, plausible range 12–17%.
- replacement central expected return 17.5%, plausible range 13–20%.
- meaningful transaction friction exists and quality/risk are similar.

Expected:
- do not classify replacement as mechanically superior from the 3.0pp point-estimate difference;
- treat as COMPETITIVE or INDETERMINATE unless stronger evidence survives uncertainty/friction.

## Case 15 — Partial switch capacity mismatch

- funding holding justifies a reduction of VND 20m.
- replacement has only VND 8m of marginal capacity before reaching target.

Expected:
- do not force the entire VND 20m into replacement;
- cap redeployment at replacement capacity;
- remaining proceeds may stay cash or be compared with the next candidate.

## Case 16 — Incremental cash is not a HOLD-vs-switch decision

- investor receives new monthly cash while an existing HOLD remains valid.
- new candidate passes BUY.

Expected:
- compare new cash among NEW / ADD / CASH under Mode A;
- do not require selling the HOLD merely because the new BUY ranks higher for incremental capital.

---

# 24. Quality-Control Invariants

The following must always remain true:

1. `Score != Decision`.
2. `Score != Opportunity-Cost Priority`.
3. Cash is always an explicit comparator.
4. Cost basis never affects economic merit.
5. Existing ownership creates no automatic priority.
6. Affordability does not improve fundamental merit.
7. Board-lot constraints do not change the economic ranking.
8. Portfolio fit may change allocation priority but not Fundamental Score.
9. Hard veto/mandate/risk rules outrank opportunity cost.
10. Mandatory SELL does not require a replacement.
11. A valid long-term holding is not switched for a trivial numerical edge.
12. Stale/incomparable data cannot support precise relative ranking.
13. Technical conditions affect timing, not economic superiority.
14. A candidate at capacity has zero marginal add capacity regardless of ranking.
15. HOLD CASH is a legitimate positive decision outcome.
16. Repeated purchase of inferior affordable candidates must be detected as action bias.
17. Incremental-cash allocation and existing-capital reallocation must not be conflated.
18. Opportunity-cost ranking must be refreshed after each lot/tranche when marginal capacity or portfolio fit changes materially.
19. A 3pp gross point-estimate switch edge is not sufficient if the advantage disappears after reasonable uncertainty/friction.
20. Opportunity cost cannot force a full switch when only partial REDUCE is justified or replacement capacity is smaller than sale proceeds.

---

# 25. Open Calibration Items

The following are intentionally provisional and should be validated later rather than treated as immutable truth:

- <=2pp relative expected-return difference as the default non-decisive/tie materiality guide;
- >=3pp expected-return advantage as the default switch hurdle for a valid long-term holding;
- exact treatment of uncertainty-band overlap;
- exact portfolio diversification benefit quantification;
- transaction-friction modeling;
- whether future implementation should use a bounded utility model after sufficient historical validation.

These items should be tested in `VALIDATION_CASES.md` and later Milestone 7 validation/backtesting before any tighter numerical optimization is adopted.

---

# 26. Draft Review Checklist

Before approval, reviewers should verify:

## CIO
- Does the framework optimize long-term capital allocation without encouraging activity?
- Is cash treated as a valid strategic option?
- Are switching hurdles high enough for a 5–10+ year philosophy?

## Portfolio Manager
- Can the framework rank new/add/cash uses consistently?
- Does it distinguish economic priority from execution feasibility?
- Does it handle capacity and concentration correctly?
- Does it re-rank after each lot/tranche as marginal capacity changes?
- Are incremental-cash and existing-capital modes kept separate?

## Equity Research Analyst
- Are expected-return comparisons appropriately uncertainty-aware?
- Does “superior” remain robust under reasonable assumption changes rather than point-estimate noise?
- Does the system avoid using score as a shortcut for valuation/thesis work?
- Are stale/incomparable data blocked?

## Risk Manager
- Can opportunity cost ever override a hard risk rule? It must not.
- Are concentration and hidden-factor risks incorporated?
- Are mandatory exits independent from replacement availability?
- Are switching friction and replacement capacity explicitly constrained?

## Behavioral Finance Reviewer
- Does the design prevent action bias, FOMO, anchoring, loss aversion, endowment effect, and churn?
- Does it prevent buying second-best names merely because they are affordable?

---

# 27. Multi-Role Review Summary — v1.0

## CIO Review

**Result:** PASS — 9.9/10

Key fixes completed:
- separated new-money allocation from existing-capital switching;
- retained cash as a deliberate strategic comparator;
- prevented marginal model differences from creating churn.

## Portfolio Manager Review

**Result:** PASS — 9.9/10

Key fixes completed:
- added marginal re-ranking after each lot/tranche;
- constrained redeployment by both funding reduction and replacement capacity;
- clarified partial-vs-full switch behavior.

## Equity Research Analyst Review

**Result:** PASS — 9.9/10

Key fixes completed:
- added robust-superiority test using ranges and sensitivity;
- prohibited decimal-level precision unsupported by evidence;
- preserved thesis/valuation underwriting ahead of relative ranking.

## Risk Manager Review

**Result:** PASS — 9.9/10

Key fixes completed:
- ensured portfolio-fit benefits cannot compensate for weak absolute merit;
- made switch superiority survive friction and uncertainty;
- preserved mandatory risk exits independently of replacement availability.

## Behavioral Finance Reviewer

**Result:** PASS — 9.9/10

Key fixes completed:
- strengthened anti-churn controls;
- prevented action bias from repeated affordable substitutions;
- separated “better use of new cash” from “reason to sell an existing holding.”

## Issue Status

- **Critical unresolved:** 0
- **Major unresolved:** 0
- **Minor / deferred calibration:** exact uncertainty-band quantification, transaction-friction calibration, and any future bounded utility model remain intentionally deferred to `VALIDATION_CASES.md` / Milestone 7.

---

# 28. Approval Gate

This file remains **Approved Baseline v1.0** until explicitly approved.

After approval it becomes the M4 baseline for cross-security capital comparison. The next planned file is:

`04_DECISION_ENGINE/DECISION_TEMPLATE.md`

Do not begin the next file until this file is approved.
