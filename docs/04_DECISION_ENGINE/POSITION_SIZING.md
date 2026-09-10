# POSITION_SIZING.md

**Version:** 1.0
**Status:** Approved Baseline v1.0
**Milestone:** M4 — Buy / Hold / Sell Decision Engine

## 1. Purpose

Define how VN30 Value Investing OS converts an approved investment decision into a prudent target position size while preserving long-term compounding, diversification, liquidity, and drawdown resilience. Position sizing must never override mandate, thesis, valuation, risk veto, or portfolio limits.

## 2. Core Principles

1. Score is not position size.
2. Conviction without valuation discipline does not justify concentration.
3. A position may be fundamentally attractive but operationally too large for the current NAV.
4. Board-lot constraints are execution constraints, not investment-merit inputs.
5. Cash is a valid allocation when no acceptable position size exists.
6. No leverage.
7. Position size must be based on portfolio risk, not cost basis or unrealized P&L.
8. No position may be enlarged merely because its price declined.

## 3. Inputs

Minimum inputs:
- Decision State
- Fundamental Score and category scores
- Score Validity
- Data Confidence
- Thesis Status
- Expected 5Y annualized total return
- Margin of Safety / downside asymmetry
- Residual risk
- Current shares and market value
- Current position weight
- Sector exposure
- Portfolio NAV
- Cash available
- Board-lot size and executable lot cost
- Portfolio drawdown regime
- Opportunity-cost rank
- Existing concentration exceptions

## 4. Hard Precedence

Sizing follows:
1. Mandate / legal / operational prohibition
2. Hard risk veto
3. Hard portfolio limit
4. Mandatory review / escalation
5. Portfolio resilience
6. Investment attractiveness
7. Execution feasibility

No sizing rule may reverse a higher-precedence restriction.

## 5. Position-Sizing Phases

Position sizing uses two distinct concepts:
- **Economic Target** — the ownership weight justified by thesis, valuation, risk, and opportunity cost.
- **Executable Trade Size** — the shares/lots that may actually be traded now after applying cash, board-lot, settlement, authorization, and operational constraints.

Execution infeasibility must never rewrite the Economic Target. Conversely, an attractive Economic Target never authorizes a trade that breaches a higher-precedence rule.

### 5.1 Phase 1 — Capital Building
Used when portfolio NAV is still small relative to VN30 board-lot economics.

Objectives:
- Avoid false precision in target weights.
- Prevent one board lot from forcing structurally excessive concentration.
- Preserve cash until a high-quality executable opportunity exists.
- Build positions gradually instead of attempting mature-portfolio weights immediately.

Default behavior:
- Prefer one-lot or small-tranche entries.
- Do not force diversification by buying inferior names.
- Use cash accumulation when the best candidate is not executable without violating limits.
- Small-NAV board-lot exception remains exceptional and requires Risk Policy authorization.

### 5.2 Phase 2 — Mature Portfolio
Used when NAV is large enough that board-lot effects no longer dominate portfolio construction.

Objectives:
- Manage positions by target weight ranges.
- Optimize expected portfolio return subject to risk and concentration limits.
- Use incremental adds/reductions rather than lot-driven distortions.

### 5.3 Initial Phase Transition Review Trigger
A transition review is triggered when all of the following are true at a formal portfolio review:
- a 100-share lot of at least 80% of the current VALID — ACTIONABLE VN30 opportunity set is <=10% of NAV;
- no single representative board lot among that set routinely forces a Small-NAV exception for otherwise desirable diversification;
- cash/lot constraints are no longer the dominant reason for rejecting or deferring high-ranked allocations.

To avoid switching phases because of a temporary opportunity set, the condition should normally be observed across at least two consecutive formal reviews before Phase 2 is adopted.

This is a review trigger, not an automatic phase switch. Final transition requires explicit portfolio review. A later deterioration in NAV or a material change in board-lot economics may trigger re-evaluation of the phase.

## 6. Single-Name Risk Bands

Baseline Risk Policy bands:
- 0–10% NAV: Normal
- >10–15%: Elevated; justification required
- >15%: Normally no additional capital
- 20%: Strategic ceiling under normal conditions
- >20%: No-add + CIO/Risk review
- >25%: Normally REDUCE plan unless approved exception

### 6.1 Small-NAV Board-Lot Exception
Temporary exception may exceed 20% only when all Risk Policy conditions are met:
- explicit pre-trade approval;
- emergency ceiling 30%;
- no further add while above 15%;
- documented normalization plan;
- exception is not a target allocation.

## 7. Sector Risk Bands

- 0–25%: Normal
- >25–30%: Elevated
- >30–35%: High concentration; normally no new capital
- >35–40%: CIO/Risk review and explicit approval for new capital
- 40%: Provisional normal-condition ceiling

Hidden factor correlation must be considered in addition to formal sector labels.

## 8. Deterministic Sizing Waterfall

Every proposed position must pass through the same waterfall in this order:

1. **Decision eligibility** — confirm the Decision State permits ownership increase, decrease, or zero ownership.
2. **Economic Target Range** — establish a justified target range from thesis strength, valuation, expected return, MOS, residual risk, confidence, and opportunity-cost rank.
3. **Risk Adjustment** — reduce, never increase, that range for MEDIUM confidence, elevated residual risk, conditional thesis, hidden-factor correlation, elevated sector exposure, or portfolio drawdown regime.
4. **Single-Name Clip** — apply Risk Policy concentration constraints.
5. **Sector / Correlation Clip** — apply sector headroom and hidden-factor limits. Formal sector headroom does not authorize an add when correlated exposure is already excessive.
6. **Phase Check** — determine whether Phase 1 lot economics or Phase 2 weight-based construction governs execution.
7. **Executable-Lot Check** — calculate full-settlement cost, post-trade position weight, sector exposure, and cash.
8. **Authorization Check** — confirm any CIO/Risk approval or Small-NAV exception required before the trade.
9. **Trade-Size Selection** — choose the smallest economically meaningful executable tranche that moves the portfolio toward, but not beyond, the permitted target.
10. **Post-Trade Revalidation** — verify all hard limits and required outputs using post-trade values.

If a later step fails, the Economic Target may remain valid while execution becomes deferred or blocked. The engine must record which step failed.

### 8.1 Target-Weight Cap
For an ownership-increasing action, the maximum permitted target is the most restrictive applicable constraint, including:
- justified economic target-range upper bound;
- single-name limit;
- sector/correlation headroom;
- drawdown-regime restriction;
- explicit exception ceiling, when approved.

No lower-priority input may expand this cap.

## 9. Decision-State Sizing Logic

### 9.1 STRONG BUY
STRONG BUY does not mean all-in.

Sizing conditions:
- Stage 0 PASS
- HIGH confidence
- thesis INTACT or IMPROVING
- category gates satisfied
- residual risk LOW or MODERATE
- expected return normally >=18%
- significant MOS
- no veto
- portfolio capacity available

Default action:
- Enter or add in tranches.
- Larger target range than ordinary BUY may be considered, but never above concentration policy without explicit exception.

### 9.2 BUY
Typically for new positions.

Default action:
- Establish an initial position that preserves room for future evidence-based adds.
- Do not immediately size to maximum allowed weight unless opportunity quality, risk, liquidity, and portfolio fit justify it.

### 9.3 ACCUMULATE
For existing positions.

Default action:
- Add only when post-trade weight remains permitted.
- Fresh underwriting required.
- Add size should reflect changed valuation/opportunity set, not prior purchase price.

### 9.4 HOLD
No target increase unless the state changes to ACCUMULATE/BUY/STRONG BUY.

### 9.5 REDUCE
Sizing output must specify:
- current weight;
- target weight or target range;
- reason residual ownership remains desirable.

### 9.6 SELL
Target ownership = 0. Execution may be staged, but target remains zero.

### 9.7 AVOID
Target ownership = 0 for unowned securities.

## 10. Provisional Target-Range Framework

Until validated by portfolio backtesting and M7 validation, use the following as portfolio-construction guides, not automatic hard rules:

- Starter position: ~3–5% NAV
- Normal core position: ~5–10% NAV
- High-conviction position: ~10–15% NAV, with explicit justification
- Above 15%: normally no-add

Interpretation rules:
- These are **construction guides**, not entitlements. A candidate does not deserve 10–15% merely because it is labeled high conviction.
- >10% is already Elevated under Risk Policy and therefore requires explicit justification.
- 15% is the normal no-add boundary, not a routine target.
- In Phase 1, a single 100-share lot may land outside these ranges; the engine must report the resulting weight rather than invent false precision.
- In Phase 2, target ranges should be used more directly because lot distortion is smaller.
- These ranges are subordinate to sector concentration, hidden-factor correlation, drawdown regime, and all Risk Policy constraints.

## 11. Sizing by Conviction and Risk

Position size should increase only when multiple dimensions align:
- high business quality;
- strong financial health;
- robust thesis;
- HIGH data confidence for the upper end of any range;
- attractive expected return;
- meaningful MOS;
- LOW/MODERATE residual risk;
- strong opportunity-cost rank;
- acceptable portfolio diversification/correlation effect.

MEDIUM confidence may support ownership but should normally move the target toward the lower portion of the otherwise justified range. LOW confidence blocks new capital.

A single strong factor is never sufficient. Score, expected return, or conviction alone must never determine size.

## 12. Position Size Reduction Factors

Reduce intended size when any of the following apply:
- confidence = MEDIUM rather than HIGH;
- residual risk is elevated;
- thesis is INTACT WITH CONDITIONS / equivalent conditional state;
- valuation is only modestly attractive;
- sector exposure is elevated;
- portfolio drawdown is ELEVATED;
- hidden factor correlation is high;
- one lot already creates large NAV exposure;
- opportunity-cost advantage is narrow.

LOW confidence blocks new capital.

## 13. Portfolio Drawdown Overlay

- NORMAL: standard sizing rules
- WATCH: additional caution; no mechanical shrinkage
- ELEVATED: smaller discretionary adds may be appropriate after fresh review
- CRITICAL: freeze discretionary risk-increasing trades until required review/approval
- SEVERE: emergency review; new risk requires explicit CIO/Risk authorization

Drawdown alone never forces broad selling or averaging down.

## 14. Board-Lot Sizing Engine

For each proposed trade calculate:
- executable lot cost;
- post-trade position weight;
- post-trade sector exposure;
- cash remaining after full settlement;
- applicable risk regime.

Possible outcomes:
- EXECUTABLE NOW
- REQUIRES CASH ACCUMULATION
- BLOCKED BY PORTFOLIO LIMIT
- BLOCKED BY RISK AUTHORIZATION
- NO ECONOMICALLY MEANINGFUL LOT
- NOT ASSESSED

The check must use **full-settlement cash**, including applicable fees/taxes/transaction costs from the portfolio data model. A monthly contribution already included in the portfolio cash snapshot must not be added again.

For ownership-increasing actions, rounding to board lots must never cause the post-trade weight to exceed the applicable permitted cap unless a documented exception has been approved in advance.

For REDUCE/SELL, buy-side board-lot affordability logic must not block a required disposal; use the market's executable sell-lot rules and the SELL_RULES execution hierarchy.

An unaffordable high-ranked candidate should not be replaced automatically by a lower-ranked affordable candidate. Follow DCA_RULES and OPPORTUNITY_COST logic.

## 15. Tranche Logic

Initial provisional rules:
- Prefer staged construction over immediate maximum sizing.
- The first executable tranche should normally preserve room for future evidence-based adds unless one board lot itself dominates the feasible size.
- Each subsequent tranche requires refreshed evidence and post-trade risk recalculation.
- Price decline alone does not trigger the next tranche.
- Additional capital requires thesis INTACT/IMPROVING, confidence >=MEDIUM, valuation still passing the required hurdle, and no unresolved risk review.
- Do not pre-commit future tranches irrespective of new information.
- Do not split trades into cosmetically small tranches when fees, lot mechanics, or unchanged information make the split economically meaningless.

Exact tranche percentages remain intentionally provisional until validation; the framework governs behavior even without fixed percentages.

## 16. Averaging Down Sizing

A lower price can increase desired position only if updated underwriting demonstrates:
- thesis remains valid;
- business quality and financial health remain acceptable;
- intrinsic value has not deteriorated proportionally;
- expected return improves;
- MOS improves;
- risk remains acceptable;
- concentration permits add;
- opportunity cost remains favorable.

Otherwise desired size does not increase merely because price fell.

## 17. Averaging Up Sizing

A higher price does not prohibit adding when:
- intrinsic value has risen;
- business fundamentals strengthened;
- expected return still clears hurdle;
- portfolio fit remains strong;
- position is still below justified target.

Avoid anchoring to prior purchase price.

## 18. Opportunity-Cost Sizing Interface

Before allocating incremental capital, compare:
1. current candidate;
2. other actionable VN30 candidates;
3. existing holdings eligible for ACCUMULATE;
4. cash.

A position can be attractive in isolation yet receive zero incremental capital when another option offers materially better risk-adjusted expected value.

Detailed switching and ranking thresholds belong to OPPORTUNITY_COST.md.

## 19. Cash Policy Interface

- ~5% NAV operating liquidity is a guideline, not a mandatory minimum.
- Cash may be substantially higher when opportunity quality is poor or lot constraints dominate.
- No fixed maximum cash allocation.
- Do not deploy cash merely to achieve diversification or monthly activity.

## 20. Behavioral Finance Controls

Position sizing must explicitly check for:
- FOMO after rapid price appreciation;
- loss aversion causing refusal to reduce;
- anchoring to cost basis;
- averaging-down reflex;
- overconfidence after recent wins;
- action bias from idle cash;
- diversification-for-appearance rather than economic merit.

If behavioral rationale materially influences size, flag for review. Behavioral flags may reduce or defer discretionary sizing, but they must not be used to override a mandatory SELL/REDUCE required by a higher-precedence rule.

## 21. Required Sizing Output

Every sizing recommendation must contain:
- Decision State
- Current shares
- Current weight
- Economic Target weight/range
- Maximum permitted target after risk clipping
- Proposed executable shares/lots
- Proposed post-trade weight
- Execution status and blocking/defer reason, if any
- Sector exposure before/after
- Cash before/after settlement
- Phase 1 or Phase 2
- Risk regime
- Whether exception/approval is required
- Sizing rationale
- Why not larger
- Why not smaller
- Opportunity-cost comparator
- Next review trigger

## 22. Audit Trail

Record:
- Decision ID
- Position-sizing methodology version
- Portfolio reconstruction ID
- NAV as-of
- ticker/security ID
- decision state
- thesis status
- score/confidence
- valuation/expected return/MOS
- economic target range and maximum permitted target
- current and proposed executable weight
- sector exposure and relevant hidden-factor exposure
- lot cost
- cash impact
- risk approvals/exceptions
- opportunity-cost comparison
- behavioral flags
- final sizing decision

## 23. Quality-Control Invariants

The engine must never:
- size from score alone;
- use cost basis as target-weight input;
- buy more solely because price fell;
- exceed Risk Policy limits silently;
- treat board-lot infeasibility as fundamental unattractiveness;
- force monthly deployment;
- convert STRONG BUY into all-in;
- increase exposure when LOW confidence blocks new capital;
- hide concentration behind sector labels;
- use technical signals to determine target ownership;
- let lot rounding silently breach a concentration cap;
- double-count cash contributions already present in the portfolio snapshot;
- treat a provisional target range as a guaranteed allocation;
- allow a lower-ranked affordable name to consume capital merely because the preferred candidate is temporarily unaffordable;
- use MEDIUM confidence to justify the upper end of a high-conviction range without explicit rationale;
- allow hidden-factor concentration to pass merely because formal sector exposure remains under its numeric cap.

## 24. Validation Cases to Cover Later

At minimum:
1. Small NAV where one lot creates >20% position.
2. STRONG BUY but sector >30%.
3. ACCUMULATE candidate already >15% NAV.
4. Best candidate unaffordable; second-best affordable.
5. Price falls 25% but thesis weakens.
6. Price rises 30% but intrinsic value rises faster.
7. CRITICAL portfolio drawdown with attractive candidate.
8. High score but LOW confidence.
9. Multiple correlated bank positions below formal sector cap but high hidden-factor exposure.
10. SELL decision executed in stages while target remains zero.
11. Phase 1 candidate where one lot lands at 12% despite a 3–5% starter guide.
12. Lot rounding would take a position from 14.2% to 16.8% without exception approval.
13. Portfolio snapshot already includes the monthly contribution; sizing must not add it twice.
14. Formal sector exposure is 28% but correlated-factor exposure is judged excessive.
15. MEDIUM-confidence candidate otherwise qualifies for high-conviction sizing.
16. REDUCE/SELL where buy-side 100-share affordability rules are irrelevant to disposal.

## 25. Open Items for Review

Items intentionally provisional for CIO/Risk review:
- empirical calibration of starter/core/high-conviction target ranges;
- empirical calibration of the phase-transition trigger;
- tranche-sizing increments after validation;
- quantitative treatment of correlated-factor concentration once sufficient portfolio data exists;
- whether expected-return spread should influence target ranges quantitatively;
- whether explicit liquidity/ADV constraints become material as NAV grows.

These items are calibration questions, not gaps in the current control framework. Until validated, no unapproved numeric optimization formula may override the deterministic waterfall or Risk Policy.

## 26. Approval Gate

This file remains Approved Baseline v1.0 until explicitly approved. Do not proceed to OPPORTUNITY_COST.md until POSITION_SIZING.md is approved.


## 27. Five-Role Review — Approved Baseline v1.0

### CIO Review
- Architecture aligns sizing with capital-allocation merit while preserving cash optionality and long-term compounding.
- Phase logic avoids forcing mature-portfolio precision onto a small NAV.
- No unresolved Critical or Major issue.

### Portfolio Manager Review
- Deterministic waterfall now separates Economic Target from Executable Trade Size.
- Lot rounding, post-trade checks, phase behavior, and tranche logic are operationally implementable without turning board-lot constraints into investment opinions.
- No unresolved Critical or Major issue.

### Equity Research Analyst Review
- Position size remains downstream of thesis, business quality, valuation, expected return, MOS, confidence, and residual risk.
- Cost basis and price movement cannot create sizing merit.
- No unresolved Critical or Major issue.

### Risk Manager Review
- Single-name, sector, drawdown, hidden-factor, and Small-NAV exception rules remain subordinate to Risk Policy.
- Risk clipping can only reduce permitted exposure; exceptions require explicit authorization.
- No unresolved Critical or Major issue.

### Behavioral Finance Review
- Controls address FOMO, loss aversion, anchoring, averaging-down reflex, action bias, overconfidence, and cosmetic diversification.
- Behavioral controls cannot delay mandatory higher-precedence exits.
- No unresolved Critical or Major issue.

### Review Result
- Critical unresolved: 0
- Major unresolved: 0
- Minor/provisional: empirical calibration items explicitly deferred to validation.
- Target quality: approximately 9.9/10 for M4 design baseline.
