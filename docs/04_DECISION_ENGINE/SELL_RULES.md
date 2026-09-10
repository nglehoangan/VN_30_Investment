# VN30 Value Investing OS — Sell Rules

**Document:** `04_DECISION_ENGINE/SELL_RULES.md`  
**Milestone:** 4 — Buy / Hold / Sell Decision Engine  
**Status:** Approved Baseline v1.0
**Version:** 1.0
**Date:** 2026-09-06

**Primary Parent:**
- `04_DECISION_ENGINE/DECISION_ENGINE.md` v1.0 — Approved Baseline

**Sibling Dependency:**
- `04_DECISION_ENGINE/BUY_RULES.md` v1.0 — Approved Baseline

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

This document defines the detailed rules for reducing or exiting an existing VN30 portfolio position.

It owns the operational logic for:

- `REDUCE`;
- `SELL`;
- thesis-driven exits;
- risk-driven exits;
- concentration-driven reductions;
- overvaluation-driven reductions/exits;
- opportunity-cost-driven switching;
- VN30 removal / Legacy Holding exits;
- partial versus full exit logic;
- execution staging for an already-decided REDUCE or SELL;
- anti-bias controls around winners, losers, anchoring, sunk cost, and break-even thinking;
- mandatory evidence and audit trail for any disposal decision.

This document does **not** permit selling simply because price rose, price fell, a profit target was reached, or the investor wants to return to break-even.

---

# 2. Core Principle

Selling is a capital-allocation decision, not a P&L-management reflex.

The engine must always distinguish:

- price;
- cost basis;
- current business quality;
- current thesis;
- intrinsic value;
- forward expected return;
- residual risk;
- portfolio concentration;
- opportunity cost;
- and execution timing.

Cost basis and unrealized P&L are accounting facts. They are **not** independent reasons to REDUCE or SELL.

The governing question is:

> Given the information available today, is continuing to own the current position size still the best use of capital within the VN30 mandate and Risk Policy?

---

# 3. Scope Boundary

## 3.1 This file owns

This file owns:

1. REDUCE eligibility and routing;
2. SELL eligibility and routing;
3. partial-versus-full exit logic;
4. exit precedence;
5. thesis-break handling;
6. ownership-veto handling;
7. concentration normalization logic;
8. extreme-overvaluation exit logic;
9. opportunity-cost switching interface;
10. Legacy Holding sell logic;
11. execution staging after the decision state is determined;
12. anti-bias controls specific to disposal decisions;
13. sell-side audit requirements.

## 3.2 This file does not own

This file does not redefine:

- M3 scoring formulas or thresholds;
- hard veto definitions;
- single-name and sector concentration limits;
- DCA allocation mechanics;
- final position-sizing formulas;
- final opportunity-cost scoring/calibration;
- accounting or tax-lot methodology;
- transaction-cost formulas;
- VN30 membership records;
- market data source rules.

These remain governed by approved upstream files or later M4 files.

---

# 4. Exit Decision Precedence

The sell-side decision must follow the governing precedence inherited from the approved constitution:

1. **Mandate / legal / operational prohibition**
2. **Ownership Veto or other hard Risk Policy ownership prohibition**
3. **Thesis BROKEN / ownership no longer justified**
4. **Hard portfolio-risk breach requiring normalization**
5. **Extreme overvaluation / asymmetric downside**
6. **Materially superior opportunity cost**
7. **Concentration optimization with otherwise intact thesis**
8. **Other portfolio-construction reasons**
9. **Execution timing**

`Capital-Allocation Veto` is not an ownership prohibition and therefore does not automatically route an existing holding to SELL.

This hierarchy is not a mechanical formula. Higher-order reasons dominate lower-order reasons when they conflict.

Examples:

- A BROKEN thesis cannot be rescued by attractive technicals.
- An Ownership Veto cannot be overridden by low valuation.
- Severe overvaluation may justify REDUCE or SELL even when historical P&L is negative.
- A +20% gain never outranks thesis, valuation, risk, or opportunity cost.

---

# 5. Required Inputs Before REDUCE or SELL

At minimum, the engine should determine:

## 5.1 Security state
- current ticker / security ID;
- current VN30 membership status;
- Legacy Holding status if removed from VN30;
- current market price and as-of date.

## 5.2 Fundamental state
- latest Total Investment Score;
- category scores;
- Score Validity;
- Data Confidence;
- Business Quality;
- Financial Health;
- Risk & Governance;
- valuation and forward-return assessment.

## 5.3 Thesis state
- Original Thesis;
- Current Thesis;
- Thesis Status: `INTACT / IMPROVING / WEAKENING / BROKEN / PENDING`;
- thesis evidence that changed;
- Break Conditions;
- whether a Break Condition has actually been triggered.

## 5.4 Portfolio state
- shares held;
- current market value;
- position weight / NAV;
- sector exposure;
- portfolio drawdown state;
- relevant concentration limits;
- liquidity / tradability constraints;
- current cash only where switching/reallocation is being considered.

## 5.5 Valuation state
- intrinsic-value range;
- current price versus intrinsic range;
- forward expected 5Y annualized total return;
- margin of safety / downside asymmetry;
- bear/base/bull scenario where material.

## 5.6 Opportunity-cost state
- expected return of current holding from today;
- best actionable alternatives;
- relative business quality;
- relative risk;
- confidence;
- portfolio-fit effect;
- switching frictions.

If the required inputs for the asserted reason are stale, contradictory, or unavailable, the engine must not fabricate a disposal rationale.

However, data incompleteness must not be used to block a higher-order mandatory exit. If an Ownership Veto, legal/mandate prohibition, or sufficiently evidenced severe risk event already requires zero ownership, the engine may route to SELL with an explicitly stated confidence/data limitation while separately requiring data refresh. Low confidence can block discretionary valuation/opportunity-cost selling, but it cannot override a mandatory ownership prohibition.

---

# 6. REDUCE — Definition

`REDUCE` means:

> The business may still be ownable, but the current position size is no longer optimal.

Target weight remains greater than zero unless a staged transition to SELL has already been explicitly decided.

REDUCE is appropriate when partial ownership remains justified but one or more of the following is true:

- position concentration is too high;
- sector concentration is too high;
- valuation has become materially unattractive but thesis remains intact;
- expected forward return has deteriorated meaningfully;
- thesis has weakened but is not broken;
- residual risk has increased enough to require less exposure;
- portfolio drawdown/risk state requires de-risking;
- another opportunity is materially superior but full replacement is not justified;
- position drift has created an inefficient allocation;
- a Legacy Holding requires orderly exit but immediate full liquidation is not optimal.

REDUCE must specify **why partial ownership remains justified**.

If that answer cannot be defended, `SELL` should be considered instead.

---

# 7. SELL — Definition

`SELL` means:

> Target ownership is zero.

SELL is appropriate when continuing ownership is no longer justified after considering business quality, thesis, risk, valuation, mandate, and opportunity cost.

Typical SELL cases:

1. Thesis = `BROKEN`;
2. Ownership Veto is triggered;
3. mandate no longer permits continued ownership and orderly exit is required;
4. the security is no longer suitable to own even at a smaller size;
5. extreme overvaluation makes expected forward return and downside asymmetry unacceptable enough that zero exposure is preferable;
6. a materially superior replacement opportunity exists and the full switch passes the opportunity-cost standard;
7. risk deterioration makes continued ownership unacceptable;
8. a Legacy Holding has reached the point where exit should be completed.

SELL may be executed in one transaction or staged, but execution staging does not change the Decision State.

A SELL recommendation must distinguish:
- **Decision State:** target ownership is zero;
- **Sell Authorization:** whether disposal is permitted/required now;
- **Execution Status:** how the order can practically be completed.

Cash availability is never a prerequisite for selling an existing position. Buy-side lot affordability must not block a valid SELL.

---

# 8. Thesis-Driven Exit Engine

## 8.1 Thesis = INTACT

An intact thesis does not automatically mean HOLD.

Possible states remain:
- HOLD;
- REDUCE;
- SELL in exceptional overvaluation/opportunity-cost cases;
- ACCUMULATE where BUY_RULES allows.

For an intact thesis, REDUCE/SELL requires a reason independent of mere price appreciation.

## 8.2 Thesis = IMPROVING

Normally argues against SELL unless:
- hard veto/risk requirement overrides it;
- valuation becomes extremely asymmetric;
- portfolio concentration requires reduction;
- mandate removal requires exit.

## 8.3 Thesis = WEAKENING

A weakening thesis triggers mandatory re-underwriting.

The engine must identify:
- what weakened;
- whether the change is temporary, cyclical, structural, or governance-related;
- whether intrinsic value has changed;
- whether downside risk has increased;
- what evidence could restore confidence.

Possible outcomes:
- HOLD with conditions;
- REDUCE;
- SELL if evidence crosses a Break Condition.

WEAKENING alone is not automatically SELL.

## 8.4 Thesis = BROKEN

Default Decision State: `SELL`.

Required handling:
- identify the violated Break Condition;
- document the evidence;
- recalculate valuation only to understand exit economics, not to rationalize continued ownership;
- do not wait for cost-basis recovery;
- do not average down;
- do not allow technical weakness to postpone the decision indefinitely.

Exception:
- execution may be staged for liquidity, market mechanics, or explicit risk-control reasons;
- state remains SELL while target ownership remains zero.

## 8.5 Thesis = PENDING

No new capital.

Existing holding decision depends on risk severity:
- if pending because evidence is incomplete but no ownership veto exists → normally `HOLD` with Decision Qualifier `REVIEW PENDING`;
- if plausible evidence suggests an Ownership Veto or severe risk → escalate; REDUCE/SELL may be required by Risk Policy.

`REVIEW PENDING` is a qualifier, not an eighth Decision State.

The engine must not convert uncertainty into a false high-confidence SELL unless the risk policy itself requires de-risking.

---

# 9. Hard Veto Handling

## 9.1 Capital-Allocation Veto

A Capital-Allocation Veto blocks new capital.

It does **not** automatically require SELL.

Existing position can route to:
- HOLD;
- REDUCE;
- SELL,

depending on thesis, risk, valuation, and whether ownership itself remains acceptable.

## 9.2 Ownership Veto

An Ownership Veto requires target ownership = zero.

Default Decision State: `SELL`.

No valuation discount, loss position, technical signal, or cost basis may override an Ownership Veto.

## 9.3 Possible / unresolved veto

If the veto is plausible but unresolved:
- mark review `PENDING / ESCALATED`;
- prohibit new capital;
- determine whether risk containment requires temporary REDUCE;
- do not fabricate certainty.

---

# 10. Concentration-Driven REDUCE Rules

Concentration may justify REDUCE even when thesis is intact and valuation is attractive.

## 10.1 Single-name concentration

Risk Policy reference:
- 0–10% NAV: normal;
- >10–15%: elevated;
- >15%: normally no additional capital;
- 20%: strategic ceiling under normal conditions;
- >20%: no-add + CIO/Risk review;
- >25%: normally requires a REDUCE plan unless approved exception;
- small-NAV board-lot exception may temporarily permit more, subject to the approved exception rules.

Sell-side interpretation:

- >15% does not automatically force REDUCE;
- >20% requires explicit review;
- >25% normally routes to a documented REDUCE plan unless an approved exception applies;
- above the small-NAV emergency ceiling is not a normal tolerated state and requires immediate risk escalation.

The target weight must be set by `POSITION_SIZING.md`; this file only determines that reduction is required or justified.

## 10.2 Sector concentration

Risk Policy reference:
- 0–25% normal;
- >25–30% elevated;
- >30–35% high concentration, normally no additional capital;
- >35–40% CIO/Risk review;
- 40% provisional normal-condition ceiling.

REDUCE may be justified when sector exposure is too high, particularly where hidden factor correlation increases true portfolio risk.

Do not reduce automatically based only on sector labels. Consider underlying correlated exposures.

## 10.3 Which holding to reduce within a concentrated sector

Do not simply sell the largest winner.

Prefer reducing the name with the least attractive combination of:
- forward expected return;
- MOS;
- thesis strength;
- business quality;
- risk;
- confidence;
- portfolio diversification contribution.

Detailed ranking belongs to `OPPORTUNITY_COST.md`.

---

# 11. Valuation-Driven REDUCE / SELL

High price alone is not a sell reason.

The engine must evaluate:
- current intrinsic-value range;
- updated fundamentals;
- forward expected return from current price;
- downside asymmetry;
- risk;
- quality and durability;
- opportunity cost.

## 11.1 Fairly valued

Normally:
- HOLD if thesis remains valid and expected return remains acceptable for existing capital;
- do not REDUCE merely because the stock is no longer cheap enough for a new BUY.

The hurdle for HOLD is not identical to the hurdle for deploying new capital.

## 11.2 Moderately overvalued

May still be HOLD for a high-quality compounder if:
- thesis remains strong;
- forward return is acceptable for holding;
- downside is tolerable;
- switching alternatives are not materially superior;
- portfolio concentration is acceptable.

## 11.3 Materially overvalued

Consider REDUCE when:
- forward expected return falls materially below an acceptable hold level;
- downside asymmetry worsens;
- position size is significant;
- better opportunities exist;
- valuation risk is not justified by quality/growth.

## 11.4 Extremely overvalued

SELL may be justified even with an intact thesis only when the full valuation case is unusually strong:
- expected forward return is exceptionally poor or negative under reasonable assumptions;
- price materially exceeds a defensible intrinsic-value range across a reasonable scenario set, not merely a single-point estimate;
- downside asymmetry is severe;
- confidence in the valuation framework is at least MEDIUM;
- the conclusion remains robust to reasonable assumption sensitivity;
- zero exposure is superior to retaining a residual position after opportunity-cost and portfolio-fit review.

If valuation confidence is LOW, the engine must not issue a discretionary full SELL solely on overvaluation; use HOLD/REDUCE only if another independently sufficient risk or portfolio reason exists.

No single P/E or price-to-book threshold is sufficient by itself.

The exact calibration of hold/switch opportunity cost belongs to `OPPORTUNITY_COST.md`.

---

# 12. +20% Gain Review Rule

A gain of approximately +20% from purchase cost is a **mandatory review trigger**, not a take-profit rule.

The review must reassess:

1. thesis;
2. business quality;
3. financial health;
4. intrinsic value;
5. expected forward return;
6. MOS;
7. position size;
8. sector exposure;
9. risk;
10. opportunity cost.

Possible outcomes include:
- ACCUMULATE;
- HOLD;
- REDUCE;
- SELL.

The fact that P&L is +20% may be recorded as the trigger but cannot be the substantive reason for REDUCE or SELL.

---

# 13. Loss / Drawdown Review Rules

A loss does not create a sell rule by itself.

Relevant review triggers include:
- price decline ≥15% from the most recent meaningful purchase reference;
- price decline ≥20% from the last formal thesis-review price;
- any thesis/risk event independent of price.

On a material decline, reassess:
- whether intrinsic value also declined;
- whether thesis weakened/broke;
- whether risk increased;
- whether the market is revealing information not previously considered;
- whether data confidence has deteriorated.

Possible outcomes:
- ACCUMULATE if BUY_RULES fresh-underwriting gates pass;
- HOLD;
- REDUCE;
- SELL.

Never SELL merely to stop seeing an unrealized loss.
Never HOLD merely to avoid realizing a loss.
Never wait for break-even if thesis is BROKEN.

---

# 14. Opportunity-Cost-Driven Switching

A valid current holding should not be sold for a merely slightly better idea.

Opportunity-cost switching is discretionary capital allocation, so it requires current, decision-useful data for **both** the incumbent and the proposed replacement. A stale alternative cannot justify SELL of a valid holding.

Switching must consider:
- expected forward return advantage;
- business quality;
- financial health;
- residual risk;
- confidence;
- MOS;
- portfolio concentration/diversification;
- transaction and execution friction;
- risk of being wrong in both legs.

Provisional M4 default inherited from `DECISION_ENGINE.md`:

> A full switch normally requires the replacement opportunity to offer approximately ≥3 percentage points higher expected 5Y annualized total return, with quality no worse, risk not materially higher, confidence no lower, and portfolio fit not worse.

This is a **provisional calibration**, not a permanent constitutional threshold. `OPPORTUNITY_COST.md` will finalize the framework.

A smaller return advantage may justify **REDUCE rather than SELL** when it independently improves concentration or risk.

Opportunity cost cannot justify buying a lower-quality/high-risk security merely because its modeled return is numerically higher.

---

# 15. REDUCE vs SELL Decision Test

Before REDUCE, answer:

1. Is some ownership still justified?
2. Is thesis still INTACT/IMPROVING or at least not BROKEN?
3. Is residual risk acceptable at a smaller position?
4. Does current valuation still support a positive hold case for some capital?
5. Would a smaller position improve portfolio construction?

If mostly YES → REDUCE is plausible.

Before SELL, answer:

1. Is target ownership genuinely zero?
2. Is thesis BROKEN, ownership prohibited, risk unacceptable, valuation extreme, or full replacement clearly superior?
3. Is retaining a token position analytically justified, or merely emotional?

If target ownership cannot be defended above zero → SELL.

---

# 16. Mandatory Reasons NOT to Sell

The following are invalid standalone sell reasons:

- “The stock is up 20%.”
- “The stock is up a lot.”
- “I want to lock in profit.”
- “The price doubled.”
- “I am afraid profit will disappear.”
- “The stock is down 20%.”
- “I want to stop the pain.”
- “I will sell when I get back to break-even.”
- “My purchase price was X.”
- “The chart looks bad” when thesis/risk do not support exit.
- “P/E is high” without contextual valuation analysis.
- “Another stock looks exciting” without opportunity-cost evidence.
- “I need to make back a previous loss.”

These may trigger review or reveal behavioral bias, but they do not constitute an investment rationale.

---

# 17. Legacy Holding / VN30 Removal

When a stock leaves the current VN30:

- no additional capital is permitted;
- position becomes `Legacy Holding`;
- a documented exit plan is required;
- immediate forced liquidation is not automatically required unless mandate/risk rules demand it.

The exit plan must consider:
- liquidity;
- thesis;
- valuation;
- corporate action context;
- market impact where relevant;
- risk of delaying exit;
- portfolio opportunity cost.

Possible state:
- HOLD temporarily only as part of an explicit orderly-exit plan;
- REDUCE;
- SELL.

The end-state objective is zero exposure unless an approved project policy later changes the mandate.

---

# 18. Portfolio Drawdown Interaction

Portfolio drawdown is not a mechanical sell trigger.

Risk Policy ladder:
- NORMAL: DD > -10%;
- WATCH: -15% < DD ≤ -10%;
- ELEVATED: -20% < DD ≤ -15%;
- CRITICAL: -25% < DD ≤ -20%;
- SEVERE: DD ≤ -25%.

At CRITICAL/SEVERE:
- discretionary risk-increasing trades are constrained;
- risk review is mandatory;
- de-risking may be appropriate;
- broad indiscriminate selling is still prohibited.

If reduction is required, prioritize exposures with:
- weakest thesis;
- worst downside asymmetry;
- highest residual risk;
- lowest expected return;
- excessive concentration;
- lowest confidence.

Do not liquidate the strongest assets simply because they are the easiest winners to sell.

---

# 19. Execution Staging

Decision State and execution are separate.

Examples:
- `SELL + EXECUTE`
- `SELL + STAGED`
- `REDUCE + STAGED`
- `REDUCE + TEMPORARILY DEFERRED`

Staging may be used for:
- liquidity;
- large position relative to normal trading volume;
- operational constraints;
- explicit tax/fee handling once supported by the system;
- orderly Legacy Holding exit;
- risk-managed transition.

Staging must not be used to disguise unwillingness to act on a BROKEN thesis.

For SELL, target weight remains zero even if execution requires multiple transactions.

---

# 20. Technical Analysis Boundary

Technical analysis may influence **how** a REDUCE/SELL is executed, but not whether a broken thesis should remain owned.

Permitted:
- staging around liquidity;
- avoiding obviously poor execution conditions where delay does not increase fundamental/risk exposure materially;
- selecting among equivalent near-term execution windows.

Not permitted:
- waiting indefinitely for a rebound after thesis breaks;
- refusing an Ownership Veto exit because RSI is oversold;
- selling a valid long-term holding solely because moving averages turn bearish;
- converting REDUCE/SELL into HOLD purely on chart signals.

Fundamentals and risk determine the state. Technicals are an execution overlay.

---

# 21. Behavioral Finance Controls

Before any REDUCE or SELL, explicitly test for:

## 21.1 Disposition effect
Selling winners too early simply to realize gains.

Control:
- ignore realized/unrealized status in fundamental decision logic;
- reassess forward return from today.

## 21.2 Loss aversion
Holding a broken thesis to avoid realizing a loss.

Control:
- ask whether the security would be purchased today if not already owned.

## 21.3 Anchoring
Anchoring to:
- purchase price;
- historical high;
- previous target price;
- analyst consensus.

Control:
- rebuild intrinsic value from current evidence.

## 21.4 Sunk-cost fallacy
Retaining capital because research time or prior conviction was high.

Control:
- prior effort has zero portfolio value unless thesis remains valid.

## 21.5 House-money effect
Taking excessive risk because the position is already profitable.

Control:
- evaluate total current market value as real capital at risk.

## 21.6 Regret avoidance
Refusing to sell because price may rebound after exit.

Control:
- judge decision quality by process and evidence, not subsequent short-term price path.

## 21.7 Action bias
Selling simply because a review was triggered.

Control:
- HOLD is valid when evidence supports continued ownership.

---

# 22. Deterministic Sell-Side Routing

Use the following order:

### Step 1 — Confirm ownership and portfolio integrity
If no position is owned, SELL/REDUCE is not applicable.

### Step 2 — Check mandate / legal / operational ownership prohibition
If continued ownership is prohibited → SELL.
If removed from VN30 but continued temporary ownership remains permitted under policy → Legacy Holding exit workflow.

### Step 3 — Check Ownership Veto
If triggered → SELL.

### Step 4 — Check thesis
If BROKEN → SELL unless higher-order operational staging only affects execution.

### Step 5 — Check mandatory risk normalization
If hard risk rule requires reduction → REDUCE or SELL according to target ownership required.

### Step 6 — Check thesis weakening / residual risk
If smaller exposure remains justified → REDUCE.
If ownership no longer justified → SELL.

### Step 7 — Re-underwrite valuation
If extreme → evaluate SELL.
If materially unattractive → evaluate REDUCE.

### Step 8 — Check concentration
If oversized → REDUCE unless full exit has superior rationale.

### Step 9 — Check opportunity cost
If materially superior replacement passes switching standard → REDUCE or SELL.

### Step 10 — Determine target ownership
- target >0 → REDUCE;
- target =0 → SELL;
- current size still optimal → HOLD.

### Step 11 — Determine execution status
Use the parent-engine execution vocabulary. For sell-side actions, typical states are `EXECUTE`, `STAGED`, or `TEMPORARILY DEFERRED` for a documented operational reason. A valid mandatory SELL must not be relabeled as HOLD merely because execution is temporarily constrained.

Cash shortage, buy-side board-lot affordability, or desire to wait for a replacement purchase are **not** valid reasons to block a SELL. Any true operational block must be named explicitly and escalated.

### Step 12 — Record audit trail
No disposal decision is complete without rationale and review trigger.

---

# 23. Conflict Resolution Rules

## 23.1 High score + BROKEN thesis
SELL can still be correct.

Reason:
- score is evidence, not authority;
- thesis-break evidence may be newer or non-compensable.

## 23.2 Low score + intact thesis
Do not automatically SELL.

Review:
- which categories deteriorated;
- confidence;
- valuation;
- risk;
- whether current ownership remains preferable to alternatives.

## 23.3 Large profit + attractive valuation
Do not REDUCE merely because profit is large.

## 23.4 Large loss + BROKEN thesis
SELL. Do not wait for break-even.

## 23.5 Intact thesis + excessive concentration
REDUCE may override HOLD/ACCUMULATE.

## 23.6 Extreme overvaluation + excellent business
Business quality does not make valuation irrelevant.
REDUCE or SELL may still be appropriate after full forward-return analysis.

## 23.7 Weak technicals + intact thesis
Technicals alone cannot create SELL.

---

# 24. Minimum Sell-Side Output Contract

Every REDUCE or SELL recommendation must include:

1. **Decision State:** REDUCE / SELL
2. **Score and Score Validity**
3. **Data Confidence**
4. **Original Thesis**
5. **Current Thesis**
6. **Thesis Status**
7. **Primary Exit Reason**
8. **Secondary Reasons**
9. **Valuation Assessment**
10. **Expected 5Y Forward Return**
11. **Intrinsic Value Range / MOS**
12. **Key Positives still remaining**
13. **Key Risks**
14. **Current Position Weight**
15. **Sector Exposure**
16. **Target Ownership Direction**
17. **Why REDUCE vs SELL**, when applicable
18. **Opportunity-Cost Comparison**
19. **Suggested Action**
20. **Sell Authorization:** REQUIRED / PERMITTED / NOT YET AUTHORIZED, with reason
21. **Execution Status**
22. **Conditions that invalidate the current exit thesis**
23. **Next Review Trigger**

For REDUCE, the output must state why residual ownership remains rational.

For SELL, the output must state why target ownership is zero.

---

# 25. Audit Trail

Minimum fields:

- Decision ID;
- decision date/time;
- data as-of;
- portfolio as-of;
- ticker/security ID;
- VN30 membership / Legacy status;
- shares before decision;
- market value;
- current position weight;
- sector exposure;
- recommendation;
- execution status;
- target direction / target weight if available;
- score / category scores / score validity;
- confidence;
- thesis status;
- violated Break Condition if any;
- valuation summary;
- expected return;
- residual risk;
- veto state;
- concentration state;
- opportunity-cost comparison;
- P&L only as contextual accounting information, never as primary rationale;
- primary reason;
- secondary reasons;
- next review trigger;
- prior Decision ID;
- methodology versions.

---

# 26. Decision Quality Tests

A REDUCE/SELL decision fails quality control if any of the following is true:

1. primary reason is only price gain/loss;
2. cost basis determines the action;
3. thesis status is missing;
4. a BROKEN thesis is held only to await rebound/break-even;
5. Ownership Veto is overridden by valuation;
6. REDUCE has no explanation for why residual ownership remains justified;
7. SELL does not establish why target ownership is zero;
8. P/E or one valuation multiple alone determines exit;
9. technicals override fundamentals/risk;
10. concentration reduction sells the easiest winner without relative analysis;
11. opportunity-cost switch lacks superiority evidence;
12. stale/contradictory data is presented as current fact;
13. execution staging changes the fundamental Decision State;
14. +20% profit is treated as automatic take-profit;
15. a large loss is treated as automatic stop-loss despite no such constitutional rule;
16. `REVIEW PENDING` is treated as a new Decision State rather than a qualifier;
17. LOW confidence is used to block a mandatory Ownership-Veto/legal exit;
18. discretionary overvaluation SELL relies on a single-point valuation without sensitivity/scenario robustness;
19. a valid SELL is delayed only because cash is insufficient to buy the replacement;
20. buy-side lot-size constraints are applied as a prerequisite to disposing of an existing holding;
21. a stale or non-actionable replacement is used to justify an opportunity-cost switch;
22. execution constraints silently change target ownership from zero to non-zero.

---

# 27. Interfaces with Later M4 Files

## 27.1 DCA_RULES.md
Will determine capital deployment after sales and whether proceeds should remain cash or be redeployed.

## 27.2 POSITION_SIZING.md
Will define exact target weights, trimming amounts, and Phase 1/Phase 2 normalization.

## 27.3 OPPORTUNITY_COST.md
Will finalize:
- switching thresholds;
- replacement-comparison mechanics;
- ranking among trim candidates;
- cash vs current holding vs alternative comparisons.

## 27.4 DECISION_TEMPLATE.md
Will standardize human/machine-readable output and audit fields.

## 27.5 VALIDATION_CASES.md
Will test:
- winner sold too early;
- loser held to break-even;
- broken thesis despite cheap valuation;
- intact thesis but excessive concentration;
- extreme overvaluation;
- Legacy Holding exit;
- risk-veto conflict;
- opportunity-cost switch;
- technical-signal conflict.

---

# 28. Open Items Deferred for Calibration

The following are intentionally not finalized here:

1. exact REDUCE target-weight formula;
2. exact tranche sizes for staged exits;
3. final HOLD expected-return floor;
4. final extreme-overvaluation quantitative bands;
5. final opportunity-cost switching threshold and scoring model;
6. tax/fee friction treatment;
7. liquidity/ADV-based staged execution thresholds;
8. exact Phase 1/Phase 2 trimming behavior.

These belong to later approved M4 files rather than being guessed here.

---

# 29. Five-Role Review and Verification — Draft v0.2

## 29.1 CIO Review

**Result: 9.9/10**

Validated:
- exit logic preserves long-term compounding rather than encouraging premature profit-taking;
- SELL is reserved for zero-ownership cases;
- REDUCE is explicitly tied to residual ownership merit;
- valid holdings are protected from weak opportunity-cost switches;
- valuation exits require forward-return and scenario analysis rather than headline multiples.

Resolved issue:
- precedence was aligned to the constitutional order so mandate/legal prohibition and Ownership Veto dominate thesis/valuation decisions.

## 29.2 Portfolio Manager Review

**Result: 9.9/10**

Validated:
- target ownership is separated from execution staging;
- concentration reductions do not automatically liquidate the strongest winner;
- portfolio drawdown cannot trigger indiscriminate selling;
- full switches require material superiority and portfolio-fit review;
- sale proceeds are not assumed to require immediate redeployment.

Resolved issue:
- buy-side cash/lot constraints are explicitly prohibited from blocking a valid sell-side decision.

## 29.3 Equity Research Analyst Review

**Result: 9.9/10**

Validated:
- original/current thesis and Break Conditions are mandatory;
- WEAKENING is distinguished from BROKEN;
- overvaluation SELL requires a defensible intrinsic-value range, scenarios, and sensitivity robustness;
- stale data cannot be presented as a current exit thesis;
- a stale alternative cannot support an opportunity-cost switch.

Resolved issue:
- LOW valuation confidence now blocks discretionary full SELL based solely on overvaluation, while not blocking mandatory ownership exits.

## 29.4 Risk Manager Review

**Result: 9.9/10**

Validated:
- Ownership Veto routes to zero target ownership;
- Capital-Allocation Veto is not incorrectly treated as mandatory SELL;
- concentration thresholds remain inherited from Risk Policy rather than redefined;
- CRITICAL/SEVERE drawdown triggers review, not mechanical liquidation;
- mandatory exits remain valid even when execution must be staged.

Resolved issue:
- decision/data confidence logic now cannot override a higher-order legal, mandate, or Ownership-Veto requirement.

## 29.5 Behavioral Finance Review

**Result: 9.9/10**

Validated controls for:
- disposition effect;
- loss aversion;
- anchoring;
- sunk cost;
- house-money effect;
- regret avoidance;
- action bias.

Additional control verified:
- inability to immediately purchase a replacement cannot become an excuse to retain a BROKEN or prohibited holding.

## 29.6 Cross-Document Consistency Verification

PASS:
- `Score ≠ Decision`;
- only seven canonical Decision States are used; `REVIEW PENDING` remains a qualifier;
- +20% gain is review-only;
- loss is not an automatic stop-loss;
- cost basis is excluded from intrinsic-value/ownership logic;
- mandate/legal prohibition and Ownership Veto outrank discretionary analysis;
- BROKEN thesis defaults to SELL;
- Capital-Allocation Veto alone does not force SELL;
- REDUCE requires an analytically justified residual position;
- extreme-overvaluation SELL requires robust valuation evidence;
- concentration can require REDUCE without thesis failure;
- opportunity-cost switches require materially superior, current, actionable evidence;
- technicals affect execution only;
- Legacy Holdings receive no new capital and require an orderly exit plan;
- portfolio drawdown does not create indiscriminate selling;
- sell-side execution is separated from target ownership;
- cash/lot affordability for future buys cannot block disposal of an existing position.

## 29.7 Issue Summary

- **Critical unresolved:** 0
- **Major unresolved:** 0
- **Minor / intentionally deferred:** exact trim target weights, staged-exit tranche sizing, HOLD return floor, quantitative extreme-overvaluation calibration, final switch calibration, transaction-cost/tax treatment, liquidity thresholds, and Phase 1/Phase 2 trimming. These remain assigned to later M4 files.

**Overall review score: 9.9/10.**

---

# 30. Approval Gate

Current status: **Draft v0.2 — Five-role review complete; awaiting approval**.

No `Critical` or `Major` issue remains unresolved.

On explicit approval, promote this file to **Approved Baseline v1.0** before proceeding to `DCA_RULES.md`.

Do not proceed to `DCA_RULES.md` until:

1. this file has undergone the agreed five-role review;
2. Critical and Major issues are resolved;
3. user explicitly approves the file;
4. the approved file is promoted to baseline v1.0 unless the user specifies another versioning rule.
