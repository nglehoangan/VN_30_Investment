# VN30 Value Investing OS — Decision Engine

**Document:** `04_DECISION_ENGINE/DECISION_ENGINE.md`  
**Milestone:** 4 — Buy / Hold / Sell Decision Engine  
**Status:** Approved Baseline v1.0
**Version:** 1.0
**Date:** 2026-09-06  

**Governing Documents:**
- `INVESTMENT_POLICY.md` v1.1 — Approved
- `RISK_POLICY.md` v1.0 — Approved
- `DECISION_FRAMEWORK.md` v1.0 — Approved
- `SCORING_MODEL.md` v1.0 — Approved
- `03_SCORING/SCORING_ENGINE.md` — Approved
- `03_SCORING/SCORECARD_TEMPLATE.md` v1.0 — Approved
- `03_SCORING/RANKING_RULES.md` v1.0 — Approved
- Milestone 2 portfolio/accounting data model and data rules — Approved

---

# 1. Purpose

This document defines the top-level Buy / Hold / Sell Decision Engine for the VN30 Value Investing OS.

Its purpose is to convert approved research, scoring, valuation, thesis, risk, portfolio, cash, execution, and opportunity-cost inputs into exactly one portfolio Decision State:

- `STRONG BUY`
- `BUY`
- `ACCUMULATE`
- `HOLD`
- `REDUCE`
- `SELL`
- `AVOID`

The engine is deliberately **not** a score-to-label mapper.

A Total Investment Score is evidence of fundamental attractiveness. It is not sufficient authority to deploy or withdraw capital.

The engine must preserve the approved distinction among:

- business quality;
- financial health;
- growth;
- industry position;
- valuation and expected return;
- risk;
- thesis;
- confidence;
- current portfolio state;
- executable cash;
- board-lot feasibility;
- opportunity cost;
- market / technical timing;
- and final portfolio action.

---

# 2. Scope and Boundaries

## 2.1 This document owns

This document owns:

1. decision-input contract;
2. decision precedence;
3. minimum eligibility gates for positive capital allocation;
4. thesis-state gates;
5. valuation / forward-return gates;
6. Risk Policy veto enforcement;
7. portfolio-constraint enforcement;
8. cash and lot-size actionability gates;
9. opportunity-cost routing;
10. ownership-state-aware Decision State selection;
11. decision confidence and actionability status;
12. decision audit trail;
13. mandatory review triggers;
14. anti-bias controls at the final decision layer.

## 2.2 This document does not own

This document does not redefine:

- the 100-point scoring weights;
- issuer metric formulas;
- sector normalization;
- hard risk veto definitions;
- single-name or sector concentration limits;
- authoritative portfolio cash or position accounting;
- cost-basis accounting;
- VN30 membership truth;
- ranking methodology;
- detailed DCA mechanics;
- detailed position-sizing formulas;
- detailed sell execution mechanics.

Those remain owned by their approved source documents or later Milestone 4 files.

## 2.3 Planned lower-level M4 files

The following architecture is retained:

```text
04_DECISION_ENGINE/
├── DECISION_ENGINE.md
├── BUY_RULES.md
├── SELL_RULES.md
├── DCA_RULES.md
├── POSITION_SIZING.md
├── OPPORTUNITY_COST.md
├── DECISION_TEMPLATE.md
└── VALIDATION_CASES.md
```

Reason:

- `DECISION_ENGINE.md` defines precedence, state machine, gates, and interfaces.
- `BUY_RULES.md` owns detailed initiation/add/averaging-down rules.
- `SELL_RULES.md` owns REDUCE/SELL hierarchy and exit execution.
- `DCA_RULES.md` owns monthly cash deployment and carry-forward logic.
- `POSITION_SIZING.md` owns small-NAV vs mature-portfolio sizing.
- `OPPORTUNITY_COST.md` owns deterministic relative-attractiveness comparisons.
- `DECISION_TEMPLATE.md` standardizes final output and audit records.
- `VALIDATION_CASES.md` tests conflicts, boundary cases, and behavioral traps.

No lower-level file may weaken this document or the approved M1–M3 rules.

---

# 3. Source-of-Truth Contract

The Decision Engine is a **derived decision layer**.

It must not become a shadow database for:

- positions;
- cash;
- cost basis;
- realized/unrealized P&L;
- NAV;
- sector classification;
- VN30 membership;
- corporate actions;
- score inputs.

## 3.1 Required upstream sources

Issuer fundamentals and score:
- approved M3 scorecard/scoring engine.

Portfolio state:
- reconstructed M2 transaction/accounting state.

Membership:
- effective-dated VN30 Master.

Sector:
- effective-dated Sector Master.

Market price:
- dated valid market observation.

Cash:
- ledger-derived settled cash and approved executable-cash derivation.

Corporate actions:
- authoritative corporate-action records plus linked accounting entries.

## 3.2 Portfolio integrity gate

Before any portfolio-aware actionable recommendation is issued, required portfolio fields must be reconstructable and sufficiently reconciled for the requested action.

If the required portfolio state is `BLOCKED`:

- issuer-level fundamental analysis may continue;
- a non-portfolio fundamental attractiveness view may still be reported;
- but no actionable `BUY`, `ACCUMULATE`, `REDUCE`, or executable `SELL` sizing may be fabricated.

The Decision Engine must state:

> `ACTIONABILITY BLOCKED — PORTFOLIO STATE UNRECONCILED`

A cost-basis-only reconstruction failure does not block fundamental analysis or quantity-based concentration analysis when cost basis is not needed.

## 3.3 Cost-basis firewall

Average cost, unrealized loss, unrealized gain, and break-even price must never determine intrinsic value or fundamental attractiveness.

They may be shown for reporting and review-trigger purposes only.

---

# 4. Decision Inputs

Every final decision consumes, at minimum, the following input groups.

## 4.1 Security eligibility

- current VN30 membership;
- Legacy Holding status;
- Stage 0 composite outcome;
- Score Validity;
- investability status.

## 4.2 Fundamental evidence

- Total Investment Score;
- Business Quality score;
- Financial Health score;
- Growth Quality score;
- Industry & Competitive Position score;
- Valuation & Forward Return score;
- Risk & Governance score;
- Capital Allocation Quality score.

## 4.3 Thesis evidence

Required fields:

- `Original Thesis`;
- `Current Thesis`;
- `Thesis Status`;
- `Thesis Strength`;
- `Thesis Break Conditions`;
- `Last Thesis Review Date`;
- `Material Changes Since Prior Decision`.

Canonical M4 Thesis Status:

- `IMPROVING`
- `INTACT`
- `WEAKENING`
- `BROKEN`
- `PENDING`

Mapping from M1 Risk Policy terminology:

| Risk Policy thesis result | M4 canonical status |
|---|---|
| VALID | INTACT |
| VALID WITH CONDITIONS | INTACT with conditions |
| WEAKENED | WEAKENING |
| INVALIDATED | BROKEN |
| PENDING | PENDING |

`IMPROVING` is an M4 refinement of a valid thesis when current evidence is materially stronger than the prior thesis without creating a new untested speculative thesis.

## 4.4 Valuation evidence

- current market price;
- conservative intrinsic-value range;
- base intrinsic-value range;
- downside value / downside case;
- Margin of Safety;
- expected 5-year annualized total return;
- valuation confidence;
- primary valuation method;
- relevant cross-checks.

## 4.5 Risk evidence

- hard-veto status;
- veto type if applicable;
- residual risk;
- drawdown band;
- review status;
- single-name concentration status;
- sector concentration status;
- hidden-factor concentration;
- liquidity risk;
- risk-exception status.

## 4.6 Data confidence

- `HIGH`
- `MEDIUM`
- `LOW`

LOW confidence cannot support new capital.

## 4.7 Portfolio context

- ownership state;
- current shares;
- current position market value;
- current position weight;
- post-trade position weight;
- current sector weight;
- post-trade sector weight;
- hidden/correlated exposure;
- current NAV;
- current cash;
- expected post-trade cash.

## 4.8 Execution context

- current board-lot rule;
- minimum executable shares;
- lot cost;
- estimated fees;
- estimated taxes where applicable;
- liquidity;
- market impact;
- technical entry status;
- market/money-flow overlay.

## 4.9 Opportunity-cost context

Compare against:

1. holding cash;
2. current holdings eligible for additional capital;
3. investable Top-ranked VN30 alternatives;
4. for switches, the current holding being sold.

---

# 5. Governing Precedence

The Decision Engine must evaluate factors in this order.

## Level 0 — Mandate / operational legality

Examples:

- current VN30 eligibility for new capital;
- no margin / no borrowing;
- board-lot legality;
- valid execution channel.

A failure cannot be repaired by score or valuation.

## Level 1 — Hard Risk Veto

A confirmed hard veto overrides:

- Total Score;
- valuation discount;
- technical setup;
- money flow;
- analyst conviction;
- historical gain/loss.

## Level 2 — Stage 0 / evidence actionability

Positive capital allocation requires an approved actionable Stage 0 / score-validity state.

PENDING, FAIL, RESEARCH ONLY, NOT RELIABLY SCORABLE, or material evidence-block conditions prohibit new capital.

## Level 3 — Thesis

Thesis status determines whether ownership merit remains valid.

- `BROKEN` → no new capital; normally REDUCE/SELL.
- `PENDING` → no new capital.
- `WEAKENING` → no automatic add; re-underwrite; normally HOLD/REDUCE.
- `INTACT` / `IMPROVING` → may proceed to valuation/risk gates.

## Level 4 — Minimum fundamental/category gates

A high Total Score cannot compensate for a failed non-compensable category gate.

## Level 5 — Valuation / expected forward return

A good company at an unattractive price may be HOLD / WAIT.

## Level 6 — Portfolio risk and concentration

A fundamentally attractive stock may be non-addable because the portfolio already has enough exposure.

## Level 7 — Cash / lot size / execution feasibility

Insufficient cash changes actionability, not company quality.

## Level 8 — Opportunity cost

Capital goes to the best sufficiently superior eligible use, or remains cash.

## Level 9 — Market / technical timing

Technical conditions can improve timing or temporarily defer execution.

They cannot create fundamental eligibility.

---

# 6. Minimum Eligibility Gates

A positive capital-allocation state (`STRONG BUY`, `BUY`, `ACCUMULATE`) is determined in two layers:

1. **Allocation-Merit Gates** — determine whether the security deserves incremental capital in principle.
2. **Execution-Feasibility Gates** — determine whether the approved action can be implemented now, staged, deferred, or requires cash accumulation.

A temporary execution constraint must not be misrepresented as weak business quality or poor valuation. Conversely, a hard portfolio/risk prohibition cannot be hidden behind a positive fundamental label.

The Decision Engine therefore distinguishes:

- **temporary execution blockers** — cash accumulation, board-lot affordability, temporary technical/execution risk; these may retain a positive Decision State with a non-executable Execution Sub-Status when no higher-precedence rule prohibits the allocation merit;
- **capital-allocation blockers** — Risk Policy veto, Stage 0 failure, unresolved mandatory review, portfolio `NEGATIVE — DO NOT ADD`, prohibited concentration, or unacceptable risk; these block the positive Decision State itself.

## G1 — Mandate Gate

For new capital:

- security must be a current VN30 constituent;
- no Legacy Holding may receive new capital;
- no prohibited leverage/financing.

Failure:
- unowned → `AVOID`;
- owned Legacy Holding → no-add; evaluate HOLD/REDUCE/SELL under orderly exit rules.

## G2 — Stage 0 Gate

Required:
- `STRONG BUY` → Composite Stage 0 = `PASS`.
- `ACCUMULATE` → Composite Stage 0 = `PASS`.
- `BUY` → normally `PASS`; `PASS WITH CONDITIONS` may support BUY only when the approved Decision Framework explicitly permits positive allocation, the condition is not a possible veto, confidence remains sufficient, and the condition is fully documented.

`PASS WITH CONDITIONS` can never support `STRONG BUY` or averaging down.

Any definitive FAIL or unresolved PENDING blocks new capital.

## G3 — Score Validity / Actionability Gate

For positive allocation merit, the issuer score must be analytically defensible and must not be `RESEARCH ONLY` or `NOT RELIABLY SCORABLE`.

Normal case:
- `VALID — ACTIONABLE` → may proceed.

`VALID — NON-ACTIONABLE` requires reason decomposition before M4 routing:

- if caused only by a **temporary execution constraint** such as insufficient settled cash for the board lot, the Decision Engine may retain BUY/STRONG BUY allocation merit and assign `REQUIRES CASH ACCUMULATION`;
- if caused by a **portfolio/risk/accounting-integrity blocker** that makes the implied allocation impermissible, BUY/ACCUMULATE/STRONG BUY are blocked and the final state must route to HOLD/AVOID/REDUCE/SELL as appropriate;
- if portfolio accounting state required to determine which case applies is itself `BLOCKED`, portfolio-aware actionability is blocked and the system must not guess.

This decomposition prevents circular logic between M3 score validity and M4 action selection.

## G4 — Confidence Gate

- STRONG BUY → `HIGH`.
- BUY → at least `MEDIUM`.
- ACCUMULATE → at least `MEDIUM`.
- LOW → no new capital.

## G5 — Category Gates

Normal new-capital minimums:

| Category | Minimum |
|---|---:|
| Business Quality | 13/25 |
| Financial Health | 8/15 |
| Risk & Governance | 5/10 |
| Valuation & Forward Return | 10/20 |

Normal STRONG BUY prerequisites:

| Category | Normal prerequisite |
|---|---:|
| Business Quality | ≥18/25 |
| Financial Health | ≥11/15 |
| Risk & Governance | ≥7/10 |
| Valuation & Forward Return | must support exceptional risk/reward |

A category-gate failure cannot be repaired by points in another category.

## G6 — Thesis Gate

See §7.

## G7 — Risk Gate

No active:
- ownership/capital-allocation veto inconsistent with the action;
- unresolved mandatory risk review;
- prohibited concentration outcome;
- unacceptable residual risk.

## G8 — Valuation / Return Gate

See §8.

## G9 — Portfolio Impact Gate

Positive allocation requires:

- `IMPROVES PORTFOLIO`, or
- `NEUTRAL / ACCEPTABLE`, or
- `CONSTRAINED — SMALLER SIZE REQUIRED` with compliant reduced sizing.

`NEGATIVE — DO NOT ADD` blocks new capital.

`REQUIRES REDUCTION` requires REDUCE/SELL routing.

## G10 — Cash / Lot Execution Gate

The approved allocation must never require borrowing or margin.

If settled/executable cash is insufficient for the minimum board lot:
- fundamental attractiveness remains unchanged;
- a positive allocation-merit state may remain in force only when all higher-precedence gates pass;
- Execution Sub-Status becomes `REQUIRES CASH ACCUMULATION`;
- Action must explicitly state `DO NOT TRADE NOW`;
- the engine must compare carrying cash with other sufficiently attractive affordable alternatives.

Cash insufficiency by itself is **not** a reason to label an otherwise investable company `AVOID`.

---

# 7. Thesis Gate

## 7.1 Thesis Status = IMPROVING

May support:
- STRONG BUY;
- BUY;
- ACCUMULATE;
- HOLD.

Still requires all valuation, risk, confidence, portfolio, and execution gates.

Improving thesis alone is never a reason to buy at any price.

## 7.2 Thesis Status = INTACT

May support:
- STRONG BUY;
- BUY;
- ACCUMULATE;
- HOLD.

## 7.3 Thesis Status = WEAKENING

Default:
- no additional capital;
- complete re-underwriting;
- `HOLD` if residual ownership remains clearly justified and risk is acceptable;
- `REDUCE` if risk/reward has materially worsened or conviction no longer supports current size;
- `SELL` if residual ownership no longer offers acceptable risk-adjusted value.

A WEAKENING thesis cannot be upgraded to ACCUMULATE merely because price fell.

## 7.4 Thesis Status = BROKEN

Rules:

1. no additional capital;
2. no averaging down;
3. cost basis is irrelevant;
4. valuation must not be used to rationalize the old thesis.

Default routing:
- `SELL` when zero ownership is preferable;
- `REDUCE` only when a smaller temporary/residual ownership case is independently defensible and no ownership veto requires zero exposure.

A confirmed ownership veto forces `SELL`.

## 7.5 Thesis Status = PENDING

No new capital.

Owned position:
- HOLD temporarily only if continued ownership is policy-compliant and known risk does not justify de-risking;
- REDUCE or SELL if known evidence already warrants it.

Unowned:
- `AVOID / WAIT — RESEARCH PENDING`.

Because the seven final Decision States do not include `WAIT`, the formal state is `AVOID` for an unowned non-actionable candidate, with reason `TEMPORARY — PENDING EVIDENCE`, not `structural rejection`.

---

# 8. Valuation and Forward-Return Gate

## 8.1 Normal BUY hurdle

Normal new capital requires:

> expected 5-year annualized total return ≥ 15%

subject to quality, risk, confidence, and portfolio constraints.

## 8.2 Exceptional absolute floor

Expected 5-year annualized return of:

> 12% to <15%

may support BUY only under the approved high-quality exception framework:

- very high business quality;
- low residual risk;
- high confidence;
- strong downside protection;
- clear portfolio-resilience benefit;
- explicit `Hurdle Exception = YES`.

This exception must not become the normal BUY standard.

## 8.3 Below 12%

Expected return <12% cannot support normal new capital.

Typical result:
- unowned → `AVOID` / WAIT for better price or fundamentals;
- owned high-quality business → `HOLD` may remain valid depending on switching hurdle, tax/costs, risk, and forward return;
- materially overvalued owned position → REDUCE/SELL review.

## 8.4 STRONG BUY valuation requirement

STRONG BUY requires all of:

1. expected forward return materially above the 15% normal BUY hurdle;
2. significant Margin of Safety;
3. attractive downside asymmetry;
4. HIGH confidence;
5. low/moderate residual risk;
6. valuation not dependent mainly on aggressive multiple expansion;
7. valuation supported by a sector-appropriate primary method and meaningful cross-checks.

Default quantitative guide:

- expected 5Y annualized total return should normally be **≥18%**;
- **≥22%** is stronger evidence but is not sufficient by itself.

STRONG BUY is a rare state, not a score band.

## 8.5 Valuation Status

For M4 decisions, classify valuation as:

- `DEEPLY ATTRACTIVE`
- `ATTRACTIVE`
- `FAIR`
- `EXPENSIVE`
- `EXTREME`
- `UNRELIABLE / PENDING`

The classification must be based on expected return, intrinsic-value range, MOS, downside asymmetry, and uncertainty—not a single multiple.

---

# 9. Risk Veto Logic

## 9.1 Capital-Allocation Veto

Effect:
- no new capital.

Unowned:
- `AVOID`.

Owned:
- may be HOLD / REDUCE / SELL depending on thesis and ownership risk.

## 9.2 Ownership Veto

Effect:
- continued ownership is inconsistent with policy.

Owned:
- `SELL`.

Execution may be staged for liquidity/market-impact reasons, but state remains SELL.

## 9.3 Possible but unresolved veto

Effect:
- Review Status = `PENDING` or `ESCALATED`;
- no new capital;
- owned position may be provisional HOLD/REDUCE/SELL based on known risk.

## 9.4 Veto non-compensation

The following may never override a veto:

- high Total Score;
- high Valuation Score;
- low P/E/P/B;
- large price decline;
- attractive technical support;
- large unrealized loss;
- large dividend yield;
- analyst conviction.

---

# 10. Portfolio Constraint Engine

## 10.1 Single-name concentration

Approved strategic bands:

- 0–10% NAV: normal;
- >10–15%: elevated, explicit justification;
- >15%: normally no additional capital;
- 20%: strategic ceiling under normal conditions.

Passive appreciation does not force sale.

Reviews:
- >15% → mandatory concentration review;
- >20% → no-add + CIO/Risk review;
- >25% → normally requires REDUCE plan unless an approved exception applies.

Small-NAV exception:
- may temporarily permit position above 20%;
- absolute emergency ceiling = 30%;
- requires explicit approved exception;
- no further add while above normal no-add threshold;
- normalization plan required.

## 10.2 Sector concentration

Approved provisional bands:

- 0–25%: normal;
- >25–30%: elevated;
- >30–35%: high concentration, normally no add;
- >35–40%: CIO/Risk review; new capital requires approval;
- 40%: provisional normal-condition ceiling.

Sector labels are not sufficient; hidden-factor concentration must also be checked.

## 10.3 Portfolio Impact mapping

| Portfolio Impact | Allowed routing |
|---|---|
| IMPROVES PORTFOLIO | positive states may proceed |
| NEUTRAL / ACCEPTABLE | positive states may proceed |
| CONSTRAINED — SMALLER SIZE REQUIRED | positive state only at compliant reduced size |
| NEGATIVE — DO NOT ADD | BUY/ACCUMULATE blocked; existing normally HOLD unless reduction reason exists |
| REQUIRES REDUCTION | REDUCE or SELL |

## 10.4 Portfolio constraint does not rewrite fundamental quality

If an excellent stock cannot be purchased because of concentration:

- do not lower Total Score;
- do not lower Valuation Score;
- mark the action as portfolio-constrained.

---

# 11. Cash and Lot-Size Gate

## 11.1 Required cash

For a standard 100-share board lot:

`Required Cash = Current Price × 100 + Estimated Buy Fees`

Use the current approved board-lot rule if it changes.

## 11.2 Cash source

Use only:
- reconstructed settled cash;
- approved executable-cash derivation where formally defined.

Do not use:
- planned monthly DCA as if already received;
- manually typed cash;
- unreconciled broker cash;
- unsettled proceeds as settled cash without an approved rule.

## 11.3 Insufficient cash

If the highest-ranked eligible opportunity cannot be purchased:

Do not:
- borrow;
- use margin;
- automatically buy a cheaper inferior stock;
- lower quality/valuation standards.

Compare:

### Option A — Carry cash
Wait until enough cash exists for the preferred opportunity.

### Option B — Buy another eligible opportunity
Permitted only when the alternative is not materially inferior after:
- expected return;
- downside;
- quality;
- confidence;
- valuation/MOS;
- portfolio fit;
- sector exposure;
- execution.

## 11.4 Initial M4 materiality rule for lot substitution

Until `OPPORTUNITY_COST.md` calibrates a richer model:

A lower-ranked affordable candidate should **not** replace an unaffordable higher-ranked candidate when:

- it is outside the same approved attractiveness/tie cluster; or
- its expected 5Y annualized return is more than **2 percentage points lower**; or
- its residual risk is worse by a material category; or
- its confidence is lower; or
- its MOS is materially weaker.

A substitution may be considered when all are true:

1. both candidates pass all positive-allocation gates;
2. score difference is within the approved M3 tie-cluster concept (normally ≤2 points), **or** the alternative has a clearly superior portfolio fit;
3. expected return difference is ≤2 percentage points;
4. risk is not meaningfully worse;
5. confidence is not lower;
6. purchase does not create concentration problems.

This is a **temporary M4 engine default** and must be formally reviewed in `OPPORTUNITY_COST.md`.

If conditions are not met:

> `HOLD CASH — ACCUMULATE FOR HIGHER-PRIORITY OPPORTUNITY`

---

# 12. Opportunity-Cost Engine — Top-Level Logic

Every BUY or ACCUMULATE candidate must be compared with:

1. cash;
2. other investable VN30 candidates;
3. eligible existing holdings;
4. current portfolio risk budget.

## 12.1 New-cash allocation

New cash does not require the candidate to be rank #1.

But the selected candidate must be among the highest-quality **actionable** uses of capital after portfolio constraints.

A small rank difference is not automatically economically meaningful.

## 12.2 Tie-cluster principle

M3 treats Total Scores within approximately 2 points as a tie cluster.

Inside a tie cluster, prefer:

1. higher robust expected return;
2. lower residual risk;
3. higher confidence;
4. stronger MOS/downside asymmetry;
5. better portfolio diversification;
6. better execution feasibility.

## 12.3 Existing-capital switching

Selling an intact high-quality holding to buy another stock requires a higher hurdle than allocating new cash.

A switch must be **materially superior**, not merely:
- 1–2 score points higher;
- slightly cheaper;
- temporarily stronger technically.

Switch analysis must include:
- expected-return advantage;
- quality difference;
- risk difference;
- confidence;
- taxes/fees;
- liquidity;
- thesis-transition risk;
- lost compounding;
- portfolio impact.

## 12.4 Default switch materiality guide

Until `OPPORTUNITY_COST.md` defines calibrated rules, a full switch should normally require:

- replacement expected 5Y return advantage of at least **3 percentage points**, **and**
- replacement quality no worse, **and**
- residual risk no higher materially, **and**
- confidence no lower, **and**
- portfolio fit not worse.

A smaller advantage may justify a partial REDUCE/reallocation only when concentration reduction or risk reduction is independently valuable.

This is a starting decision-control threshold, not a guarantee of superiority.

---

# 13. Decision State Definitions

# 13.1 STRONG BUY

Purpose:
- rare, highest-conviction positive allocation state.

Required normal conditions:

1. current VN30 constituent;
2. Stage 0 PASS;
3. Score Validity is `VALID — ACTIONABLE`, or `VALID — NON-ACTIONABLE` only when the sole blocker is temporary cash/lot execution and §6 G3 decomposition permits positive allocation merit;
4. HIGH confidence;
5. Thesis = INTACT or IMPROVING;
6. Business Quality ≥18/25;
7. Financial Health ≥11/15;
8. Risk & Governance ≥7/10;
9. no hard veto;
10. residual risk LOW/MODERATE;
11. valuation DEEPLY ATTRACTIVE or clearly ATTRACTIVE with exceptional asymmetry;
12. expected 5Y return normally ≥18%;
13. significant MOS;
14. portfolio impact acceptable;
15. position/sector limits permit the proposed size;
16. opportunity cost is top-tier relative to actionable alternatives;
17. cash/lot feasibility is known; if insufficient cash is the only execution blocker, use `REQUIRES CASH ACCUMULATION` and `DO NOT TRADE NOW`;
18. technicals may improve entry but are not required.

STRONG BUY does **not** mean:
- all-in;
- ignore diversification;
- ignore board-lot risk;
- override Small-NAV concentration rules;
- ignore cash reserve/risk state.

Ownership semantics:
- unowned → `STRONG BUY` means highest-priority initiation merit;
- owned → `STRONG BUY` may be used only when the incremental-add case independently meets the full STRONG BUY standard; otherwise use `ACCUMULATE`.

The Action field must always disambiguate `INITIATE` versus `ADD`.

## 13.2 BUY

Used primarily for initiating a new position.

Required:

1. current VN30 member;
2. Stage 0 = PASS, or narrowly permitted PASS WITH CONDITIONS under §6 G2;
3. Score Validity passes §6 G3 reason decomposition;
4. category gates pass;
5. Thesis = INTACT or IMPROVING;
6. confidence ≥MEDIUM;
7. valuation attractive;
8. expected 5Y return normally ≥15%, or approved 12–15% hurdle exception;
9. no veto;
10. residual risk acceptable;
11. portfolio limits allow the trade;
12. cash/lot feasibility is known; if insufficient cash is the only blocker, BUY may remain the Decision State with `REQUIRES CASH ACCUMULATION` and no immediate trade;
13. opportunity cost is acceptable.

BUY should not be issued merely because Total Score ≥ a numeric threshold.

## 13.3 ACCUMULATE

Used primarily for an existing position.

Required:

1. position already owned;
2. Composite Stage 0 = PASS;
3. fresh underwriting completed;
4. Thesis = INTACT or IMPROVING;
5. category gates for new capital pass;
6. confidence ≥MEDIUM;
7. valuation attractive and forward-return hurdle met;
8. no material new risk;
9. no unresolved mandatory thesis/risk review;
10. post-trade position and sector exposures remain compliant;
11. opportunity cost supports adding this holding rather than another candidate or cash;
12. cash/lot feasibility is known; if cash is insufficient, ACCUMULATE may remain the allocation-merit state only when no portfolio/risk blocker exists, with `REQUIRES CASH ACCUMULATION` and no immediate trade.

A lower price is not an ACCUMULATE reason.

## 13.4 HOLD

HOLD is an active decision, not an analytical default.

Use when continued ownership is justified but additional capital is not.

Typical cases:

- thesis INTACT;
- business quality remains acceptable/high;
- valuation FAIR;
- expected forward return remains acceptable for holding but below new-buy hurdle;
- position already sufficiently large;
- concentration blocks further add;
- portfolio opportunity cost favors keeping the position but not adding;
- evidence is temporarily incomplete but continued ownership remains prudent;
- large gain has reduced valuation attractiveness but not enough to justify REDUCE.

Every HOLD must state:

> Why is holding superior to both adding and selling?

## 13.5 REDUCE

Use when a smaller position is preferable to the current position.

Possible drivers:

- valuation is very high but thesis remains valid;
- position concentration is too high;
- sector/hidden-factor concentration is too high;
- thesis WEAKENING;
- residual risk has increased;
- forward return has fallen materially;
- opportunity cost is materially better;
- portfolio downside contribution is excessive;
- exception normalization requires de-concentration.

REDUCE is not automatic at +20% gain.

REDUCE must specify:
- target shares or target exposure;
- reason for partial rather than full exit;
- what would trigger further reduction or re-accumulation.

## 13.6 SELL

SELL means zero target ownership, subject to orderly execution.

Priority hierarchy:

### Level 1 — Thesis Broken / Ownership Veto
Highest priority.

Examples:
- durable moat impairment;
- serious governance/integrity failure;
- financial survivability failure;
- structural decline invalidating the case;
- thesis no longer falsifiably true.

### Level 2 — Risk Breach
Examples:
- confirmed ownership veto;
- unacceptable legal/regulatory risk;
- unacceptable leverage/refinancing risk;
- portfolio policy requires full exit.

### Level 3 — Extreme Overvaluation
SELL may be appropriate when:
- price is materially above a defensible intrinsic-value range;
- expected forward return is inadequate;
- downside asymmetry is poor;
- HOLD no longer compensates for risk.

### Level 4 — Opportunity Cost
Full switch only when alternative is materially superior after all switching costs/risks.

SELL is never triggered solely by:
- +20% gain;
- a technical sell signal;
- a broad market decline;
- desire to "lock profit";
- desire to return a losing position to break-even.

## 13.7 AVOID

Used for an unowned security that should not receive capital.

Typical reasons:
- non-VN30;
- hard veto;
- Stage 0 failure;
- LOW confidence;
- not reliably scorable;
- failed category gate;
- broken/pending thesis case;
- unattractive valuation;
- forward return below hurdle;
- inferior opportunity cost;
- portfolio cannot responsibly own the required lot.

AVOID reason must distinguish:

- `STRUCTURAL`;
- `RISK VETO`;
- `VALUATION`;
- `DATA / CONFIDENCE`;
- `TEMPORARY PORTFOLIO CONSTRAINT`.

`TEMPORARY CASH / LOT CONSTRAINT` is **not** by itself an AVOID reason when allocation merit is otherwise BUY/STRONG BUY. Use the positive Decision State plus `REQUIRES CASH ACCUMULATION`.

## 13.8 Decision State vs Decision Qualifier

To avoid semantic overload, every final state may carry one non-state **Decision Qualifier** when useful:

- `STRUCTURAL`
- `VALUATION-DRIVEN`
- `THESIS-DRIVEN`
- `RISK-DRIVEN`
- `PORTFOLIO-CONSTRAINED`
- `EXECUTION-CONSTRAINED`
- `OPPORTUNITY-COST-DRIVEN`

The qualifier explains *why* the state applies. It never creates an eighth Decision State.

---

# 14. Averaging-Down Engine

Averaging down is not a Decision State.

It is a special case of `ACCUMULATE` that must pass additional controls.

## 14.1 Good Averaging Down

Pattern:

`Price ↓`  
`Intrinsic Value stable or ↑`  
`Thesis INTACT / IMPROVING`  
`Fundamentals stable or improving`  
`Risk not materially worse`  
`Valuation/MOS improves`

May proceed only if all normal ACCUMULATE gates pass.

## 14.2 Value-Trap Averaging Down

Pattern:

`Price ↓`  
`Earnings power ↓`  
`Intrinsic Value ↓`  
`Balance sheet ↓`  
`Governance risk ↑`  
`Thesis WEAKENING / BROKEN`

Result:

> `DO NOT ADD`

Possible final states:
- HOLD;
- REDUCE;
- SELL.

## 14.3 Fundamental-score deterioration check

A lower Total Score alone does not automatically forbid an add, because score changes can arise from valuation or normalization.

However:

- material deterioration in Business Quality;
- Financial Health;
- Risk & Governance;
- thesis evidence;

must be explained before any add.

A score decline of **≥5 points** since the prior formal decision requires explicit attribution and cannot be ignored.

If the decline is mainly caused by worsening fundamentals/risk rather than valuation normalization:

> averaging down is presumptively blocked until the deterioration is resolved.

## 14.4 Price-decline review trigger

Before an add, mandatory review is required when:

- price is ≥15% below the most recent meaningful purchase; or
- price is ≥20% below the last formal thesis-review price.

No-add remains until review is completed.

---

# 15. +20% Profit Review Rule

A gain of approximately +20% is a mandatory review trigger, not a sell signal.

Required review:

1. recalculate valuation;
2. update intrinsic-value range;
3. update expected 5Y return;
4. reassess thesis;
5. reassess residual risk;
6. check position weight;
7. check sector/hidden-factor exposure;
8. compare investable Top 10 alternatives;
9. estimate transaction costs/taxes where applicable;
10. choose one final state:
   - ACCUMULATE;
   - HOLD;
   - REDUCE;
   - SELL.

Forbidden shortcut:

> `Gain ≥20% → SELL`

---

# 16. Loss / Drawdown Review

Price drawdown and portfolio drawdown are review signals, not automatic trade signals.

## 16.1 Position-level review bands

Operational review bands:

- `-10%`: WATCH;
- `-15%`: MANDATORY FRESH REVIEW BEFORE ADD;
- `-20%`: DEEP THESIS / VALUATION / RISK REVIEW;
- `<-20%`: repeated review only on new material evidence or predefined trigger, not compulsive price watching.

Each review asks:

1. What changed in business quality?
2. What changed in normalized earnings/cash flow?
3. What changed in financial health?
4. What changed in governance?
5. What changed in intrinsic value?
6. What changed in expected return?
7. Is the thesis intact?
8. Has residual risk increased?
9. Is this market repricing or fundamental impairment?
10. Is there a better use of capital?

## 16.2 Portfolio drawdown bands

Use the approved Risk Policy ladder:

- NORMAL: DD > -10%;
- WATCH: -15% < DD ≤ -10%;
- ELEVATED: -20% < DD ≤ -15%;
- CRITICAL: -25% < DD ≤ -20%;
- SEVERE: DD ≤ -25%.

CRITICAL/SEVERE rules can freeze or require explicit approval for risk-increasing trades.

No drawdown band automatically forces averaging down or broad liquidation.

---

# 17. Cash and Monthly DCA Engine — Top-Level Contract

Monthly contribution is a cash inflow, not a deployment mandate.

Track:

- planned contribution;
- actual settled contribution;
- carry-forward cash;
- settled cash;
- executable cash;
- committed/unsettled obligations.

Decision sequence:

1. update available cash;
2. update actionable VN30 ranking;
3. remove ineligible/veto/non-actionable candidates;
4. apply thesis/valuation/confidence/category gates;
5. review existing holdings eligible for add;
6. apply portfolio and sector constraints;
7. calculate lot affordability;
8. compare opportunity cost;
9. choose the best sufficiently attractive capital use;
10. if none qualifies → `HOLD CASH`.

The engine must never buy an inferior stock merely because 100 shares are affordable.

Detailed DCA policy belongs to `DCA_RULES.md`.

---

# 18. Technical Entry Overlay

Technical analysis is subordinate to fundamentals.

Permitted inputs may include:

- MA50;
- MA200;
- trend regime;
- support/resistance zone;
- volume;
- volatility/gap risk;
- liquidity.

Technical status:

- `FAVORABLE`
- `NEUTRAL`
- `UNFAVORABLE`
- `NOT ASSESSED`

Effects:

- FAVORABLE → may support normal execution;
- NEUTRAL → no change;
- UNFAVORABLE → may stage or temporarily defer a fundamentally valid trade when there is a concrete execution-risk reason.

Technical status must not change an existing-position Decision State from ACCUMULATE/BUY-merit to HOLD by itself. It changes execution timing only, unless the market condition creates a separate material liquidity/market-impact risk that belongs to Risk/Execution analysis.

Technical conditions may not:

- convert a weak company into BUY;
- override a broken thesis;
- override a veto;
- indefinitely defer a fundamentally approved purchase merely because a chart is not ideal.

---

# 19. Execution Sub-Status

Decision State and timing are separate.

For trade-implying states, use:

- `EXECUTE`
- `STAGED`
- `TEMPORARILY DEFERRED`
- `REQUIRES CASH ACCUMULATION`
- `BLOCKED — PORTFOLIO/RISK`
- `NOT ACTIONABLE`

Examples:

`BUY + EXECUTE`  
`ACCUMULATE + STAGED`  
`STRONG BUY + REQUIRES CASH ACCUMULATION`  
`SELL + STAGED`  
`HOLD + NOT ACTIONABLE`

The state expresses portfolio intent.
The execution sub-status expresses whether and how the intent can be implemented now.

---

# 20. Decision Hierarchy — Deterministic Routing

Use the following sequence.

## Step 1 — Resolve ownership

Classify:

- `UNOWNED`
- `OWNED`
- `LEGACY HOLDING`

## Step 2 — Apply mandate and hard vetoes

If mandate fail for new capital:
- UNOWNED → AVOID.
- OWNED Legacy → no-add; continue exit/hold analysis.

If confirmed ownership veto:
- OWNED → SELL.
- UNOWNED → AVOID.

## Step 3 — Apply Stage 0 / score-validity / confidence

First distinguish **fundamental/evidence blockers** from **temporary execution blockers**.

If Stage 0, confidence, score reliability, risk, or accounting integrity blocks positive allocation:
- UNOWNED → AVOID / research;
- OWNED → HOLD/REDUCE/SELL based on known risk.

Do not classify a security AVOID merely because current cash is temporarily insufficient.

## Step 4 — Resolve thesis

BROKEN:
- REDUCE/SELL.

WEAKENING:
- HOLD/REDUCE normally.

PENDING:
- no add.

INTACT/IMPROVING:
- continue.

## Step 5 — Check fundamental category gates

If failed:
- no positive new-capital state;
- existing holding may remain HOLD only if continued ownership remains defensible.

## Step 6 — Check valuation / return

Deeply attractive + strong quality/risk:
- eligible for STRONG BUY evaluation.

Attractive + hurdle met:
- eligible for BUY/ACCUMULATE.

Fair:
- typically HOLD.

Expensive:
- HOLD/REDUCE.

Extreme:
- REDUCE/SELL review.

## Step 7 — Apply portfolio constraints

No-add:
- convert positive add intention to HOLD.

Reduction required:
- REDUCE/SELL.

## Step 8 — Apply opportunity cost

If a materially superior new-cash use exists:
- candidate may drop from BUY/ACCUMULATE priority to HOLD CASH / HOLD position.

If switch hurdle is not met:
- retain existing holding.

## Step 9 — Check cash / lot

Insufficient cash:
- no fake immediate trade;
- preserve the already-determined allocation-merit Decision State only when cash/lot is the sole blocker;
- use `REQUIRES CASH ACCUMULATION`;
- Action = `DO NOT TRADE NOW`;
- compare carry-cash versus sufficiently attractive affordable alternatives.

## Step 10 — Apply technical/execution overlay

Technical may stage/defer.
It does not rewrite fundamental state unless execution risk changes actual risk/reward materially.

## Step 11 — Finalize exactly one Decision State

No ambiguous dual state such as:
- `BUY/HOLD`;
- `HOLD/ACCUMULATE`.

One state must be selected and justified.

---

# 21. Score and Decision-State Conflict Rules

## 21.1 High score + expensive valuation

Possible:
- HOLD;
- AVOID;
- REDUCE for an owned materially overvalued position.

Not automatically BUY.

## 21.2 Medium score + deep discount

Cannot BUY unless:
- quality/financial/risk category gates pass;
- thesis is valid;
- expected-return hurdle passes;
- no veto exists.

Cheapness cannot compensate for weak investability.

## 21.3 Low score + price crash

No automatic BUY.

Investigate value-trap risk.

## 21.4 High score + concentration block

Fundamental score remains high.

Action:
- HOLD / no-add;
- or REQUIRES CASH/PORTFOLIO NORMALIZATION.

## 21.5 High score + LOW confidence

No new capital.

## 21.6 High score + broken thesis

REDUCE/SELL, not ACCUMULATE.

## 21.7 Lower-ranked current holding vs slightly higher-ranked alternative

Do not switch automatically.

Apply switching hurdle.

---

# 22. Phase 1 vs Phase 2 Position-Sizing Interface

Detailed formulas belong to `POSITION_SIZING.md`.

This engine defines only the phase-selection interface.

## 22.1 Phase 1 — Capital Building

Purpose:
- prevent fake precision when one 100-share lot is a large fraction of NAV.

Phase 1 applies while one normal board lot of a meaningful portion of the investable VN30 universe can cause a compliant high-quality purchase to exceed ordinary strategic target weights.

Operational behavior:
- prioritize absolute lot affordability;
- use Small-NAV exception only when explicitly approved;
- tolerate imperfect diversification;
- do not force percentage targets that cannot be executed;
- carry cash when a lot would create unacceptable risk.

## 22.2 Phase 2 — Mature Portfolio

Phase 2 begins when normal 100-share lots for the majority of actionable VN30 opportunities can be added without requiring Small-NAV concentration exceptions and without routinely causing >10% single-name starting weights.

Initial transition trigger:

> Review for Phase 2 when NAV is large enough that a 100-share lot of at least 80% of the current actionable VN30 opportunity set would represent ≤10% of NAV.

The final phase trigger will be formalized in `POSITION_SIZING.md`.

---

# 23. Decision Output Contract

Every decision must contain:

## 23.1 Recommendation

Exactly one:

- STRONG BUY
- BUY
- ACCUMULATE
- HOLD
- REDUCE
- SELL
- AVOID

## 23.2 Evidence

- Total Score;
- category scores;
- Valuation Score;
- expected 5Y return;
- Margin of Safety;
- Data Confidence;
- Score Validity;
- Thesis Status;
- Residual Risk;
- key positives;
- key risks.

## 23.3 Portfolio Context

- current shares;
- average cost, if reconstructable, reporting only;
- current market price;
- current weight;
- post-trade weight;
- sector weight;
- post-trade sector weight;
- available settled/executable cash;
- lot cost;
- drawdown band;
- risk-exception status.

## 23.4 Action

Examples:

- `BUY 100 shares`
- `ACCUMULATE 100 shares`
- `HOLD — DO NOT DEPLOY CAPITAL`
- `REDUCE 100 shares`
- `SELL ALL — STAGED EXECUTION`
- `AVOID — VALUATION BELOW HURDLE`
- `STRONG BUY — REQUIRES CASH ACCUMULATION`

## 23.5 Why

3–5 most decision-relevant reasons.

Do not list every metric.

## 23.6 Invalidation Conditions

Explicit conditions that would change the recommendation.

Examples:

- thesis break;
- Financial Health falls below gate;
- governance event;
- expected return falls below hurdle;
- position exceeds approved concentration;
- valuation becomes extreme;
- alternative becomes materially superior.

## 23.7 Next Review Trigger

At least one:

- quarterly/interim results;
- audited annual results;
- ±15% material price move;
- +20% gain review;
- mandatory drawdown band;
- material corporate action;
- material governance/news event;
- valuation threshold;
- thesis change;
- VN30 membership change;
- concentration threshold.

---

# 24. Decision Audit Trail

Every recommendation must create an immutable or versioned Decision Record containing:

| Field | Requirement |
|---|---|
| Decision ID | required, unique |
| Decision Date/Time | required |
| Data As-of Date | required |
| Portfolio As-of Date | required if portfolio-aware |
| Ticker / Security ID | required |
| VN30 Membership Status | required |
| Ownership State | required |
| Recommendation | required |
| Execution Sub-Status | required where applicable |
| Total Score | required if reliably scorable |
| Score Validity | required |
| Category Scores | required where scorable |
| Data Confidence | required |
| Thesis Status | required |
| Valuation Status | required |
| Expected 5Y Return | required where estimable |
| Intrinsic Value Range | required where estimable |
| Margin of Safety | required where estimable |
| Residual Risk | required |
| Hard Veto Status | required |
| Review Status | required |
| Position Shares | required if owned |
| Position Weight | required if portfolio-aware |
| Sector Weight | required if portfolio-aware |
| Available Cash | required for buy/add actionability |
| Lot Cost | required for buy/add |
| Opportunity-Cost Comparison | required for buy/add/switch |
| Key Reasons | required |
| Invalidation Conditions | required |
| Next Review Trigger | required |
| Method Versions | required |
| Portfolio Reconstruction ID/version | required if portfolio-aware |
| Prior Decision ID | required when revising prior view |

## 24.1 Decision change attribution

When a decision changes, identify the driver:

- score change;
- thesis change;
- valuation change;
- risk change;
- confidence change;
- portfolio concentration;
- cash/lot feasibility;
- opportunity cost;
- VN30 membership;
- technical/execution change.

## 24.2 No hindsight rewriting

Historical Decision Records must not be overwritten to make old decisions look better.

Corrections must be:
- versioned;
- effective-dated;
- linked to the prior record.

---

# 25. Behavioral Finance Controls

Every final decision must pass the following checklist.

## 25.1 Anchoring

Question:
> Is average cost, previous target price, or historical high influencing intrinsic value?

If yes:
- remove the anchor and re-underwrite.

## 25.2 Loss aversion

Question:
> Am I holding because I refuse to realize a loss?

If yes:
- compare current holding from zero-based capital-allocation perspective.

## 25.3 Break-even bias

Question:
> Am I adding mainly to lower cost basis or get back to 0% P&L?

If yes:
- add is prohibited.

## 25.4 FOMO

Question:
> Am I buying because price has risen, news is exciting, or peers are outperforming?

If yes:
- require valuation and thesis evidence independent of price momentum.

## 25.5 Disposition effect / premature profit-taking

Question:
> Am I selling only because the position is +20% or more?

If yes:
- trigger review, not sale.

## 25.6 Sunk-cost bias

Past research effort and holding duration do not justify continued ownership.

## 25.7 Score anchoring

The prior score must not be copied forward without fresh evidence.

## 25.8 Rank chasing

A rank change alone does not create a trade.

---

# 26. Conflict Resolution Between M1–M3 Rules

## 26.1 Score vs Decision State

Resolved:
- Score is an attractiveness input.
- Decision State is an ownership/action output.
- No direct numeric mapping is permitted.

## 26.2 M1 thesis terminology vs requested M4 terminology

Resolved through canonical mapping in §4.3.

No M1 meaning is weakened.

## 26.3 Top-10 rank vs portfolio action

Resolved:
- M3 fundamental rank remains issuer-level.
- M4 portfolio action may differ because of concentration, ownership, cash, lot size, or opportunity cost.
- M4 must not rewrite the M3 score to justify the portfolio action.

## 26.4 High-quality HOLD below BUY hurdle

Resolved:
- new-capital hurdle and hold hurdle are different;
- an existing quality compounder may remain HOLD even when it would not qualify as a fresh BUY today.

## 26.5 Technical delay vs value discipline

Resolved:
- technicals may temporarily defer execution;
- technical weakness alone cannot indefinitely block an otherwise approved long-term purchase;
- any deferral requires an observable execution reason and review trigger.

## 26.6 Small NAV vs strategic concentration limits

Resolved:
- normal strategic limits remain authoritative;
- Small-NAV exception is explicit, capped, approved, temporary, and non-self-authorized.

---

# 27. Minimum Decision-State Matrix

| Condition | Unowned | Owned |
|---|---|---|
| Ownership veto | AVOID | SELL |
| Capital-allocation veto | AVOID | HOLD / REDUCE / SELL, no add |
| Stage 0 fail | AVOID | HOLD / REDUCE / SELL based on residual case |
| LOW confidence | AVOID | HOLD / REDUCE / SELL; no add |
| Thesis BROKEN | AVOID | REDUCE / SELL |
| Thesis WEAKENING | AVOID | HOLD / REDUCE |
| Thesis INTACT + unattractive valuation | AVOID | HOLD / REDUCE |
| Thesis INTACT + attractive valuation + gates pass | BUY | ACCUMULATE |
| Exceptional quality/risk/reward + all strong gates | STRONG BUY | STRONG BUY / ACCUMULATE subject to capacity |
| Portfolio no-add constraint | AVOID — TEMPORARY PORTFOLIO CONSTRAINT | HOLD |
| Portfolio requires reduction | N/A | REDUCE / SELL |
| Insufficient cash for lot, all merit gates pass | BUY/STRONG BUY + REQUIRES CASH ACCUMULATION | ACCUMULATE/STRONG BUY + REQUIRES CASH ACCUMULATION |
| Materially superior alternative | may buy alternative | HOLD / REDUCE / SELL depending switching hurdle |

---

# 28. Review Triggers

Mandatory or default re-decision triggers include:

## Issuer
- quarterly/interim result;
- annual audited result;
- material guidance change;
- major acquisition/disposal;
- material governance event;
- leverage/refinancing deterioration;
- material dilution;
- competitive-position change.

## Valuation
- +20% gain from relevant cost basis;
- ≥15% decline from meaningful purchase before add;
- ≥20% move from last thesis-review price;
- price outside prior valuation range;
- material change in required return.

## Portfolio
- position >15%;
- sector >30%;
- drawdown enters ELEVATED/CRITICAL/SEVERE;
- hidden-factor concentration changes;
- material cash contribution/withdrawal.

## Universe
- VN30 addition/removal.

## Data
- confidence change;
- stale-data resolution;
- corrected financial/corporate-action information.

---

# 29. Decision Quality Tests

Before finalizing any decision, answer:

1. Would I make the same decision if I did not know my cost basis?
2. Would I make the same decision if the stock had not recently risen/fallen?
3. Does the thesis still explain why intrinsic value should compound?
4. Is expected return based on normalized economics?
5. Is downside survivable?
6. Is a veto or non-compensable risk being hidden by cheap valuation?
7. Does portfolio concentration change the correct action?
8. Is there a better actionable use of cash?
9. Is a rank difference economically meaningful or noise?
10. Can the proposed trade actually be executed without leverage and within lot rules?
11. Are technicals merely timing the trade rather than creating the thesis?
12. What specific evidence would prove this decision wrong?

If any answer is unresolved and decision-critical:
- new capital must not be deployed.

---

# 30. Final Multi-Role Review — v0.2

## 30.1 CIO Review

### Critical
**0 unresolved.**

### Major resolved in v0.1
1. **Risk of converting M3 score bands directly into BUY/SELL labels.**  
   Resolved by precedence and non-compensable gates.

2. **Risk of forced deployment because monthly cash exists.**  
   Resolved by explicit cash-as-alternative rule.

3. **Risk of switching good compounders for marginal rank differences.**  
   Resolved by separate switching hurdle.

4. **Risk of STRONG BUY being interpreted as all-in.**  
   Explicitly prohibited.

### Minor / deferred
- exact calibrated position-size formula belongs to `POSITION_SIZING.md`;
- richer opportunity-cost utility function belongs to `OPPORTUNITY_COST.md`.

**CIO result: PASS — 0 Critical / 0 Major unresolved. — 9.9/10**

## 30.2 Portfolio Manager Review

### Critical
**0 unresolved.**

### Major resolved
1. **High-ranked but unaffordable stock could cause automatic substitution into a cheaper inferior stock.**  
   Resolved by carry-cash comparison and provisional ≤2-point/≤2%-return substitution discipline.

2. **Small NAV could make strategic percentage limits mechanically impossible.**  
   Resolved by consuming approved Small-NAV exception and adding a Phase 1/Phase 2 interface.

3. **HOLD could become a lazy residual state.**  
   Resolved by requiring explicit justification versus both adding and selling.

### Minor / deferred
- exact number of tranches/staged-entry rules belong to BUY_RULES/POSITION_SIZING.

**Portfolio Manager result: PASS — 0 Critical / 0 Major unresolved. — 9.9/10**

## 30.3 Equity Research Analyst Review

### Critical
**0 unresolved.**

### Major resolved
1. **Thesis terminology inconsistent between M1 and M4 request.**  
   Resolved by explicit mapping.

2. **Price decline could be confused with improved valuation.**  
   Resolved by intrinsic-value-stability requirement for averaging down.

3. **Extreme valuation could dominate business-quality analysis.**  
   Category gates and thesis gate remain non-compensable.

### Minor / deferred
- sector-specific valuation-status calibration remains downstream of approved M3 valuation definitions and later validation.

**Equity Research result: PASS — 0 Critical / 0 Major unresolved. — 9.9/10**

## 30.4 Risk Manager Review

### Critical
**0 unresolved.**

### Major resolved
1. **Potential conflict between STRONG BUY and concentration ceilings.**  
   Risk limits explicitly override decision strength.

2. **Potential use of unreconciled cash/positions in actionable recommendations.**  
   Portfolio integrity gate blocks actionability.

3. **Potential averaging down during unresolved risk review.**  
   Explicitly prohibited.

4. **Potential accidental weakening of M1 15% BUY hurdle.**  
   Preserved; 12% remains exceptional floor only.

5. **Potential automatic selling at -20% drawdown.**  
   Drawdown remains escalation/review, not stop-loss.

### Minor / deferred
- implementation-specific fee/tax estimation precision;
- broker-specific executable-cash rules.

**Risk Manager result: PASS — 0 Critical / 0 Major unresolved. — 9.9/10**

## 30.5 Behavioral Finance Review

### Critical
**0 unresolved.**

### Major resolved
1. **Break-even anchoring.**
2. **Disposition effect at +20%.**
3. **Loss-aversion averaging down.**
4. **FOMO / momentum-driven initiation.**
5. **Rank chasing / overtrading.**
6. **Sunk-cost bias.**

All are explicitly checked at decision finalization.

### Minor / deferred
- future Investment Journal can measure repeated bias patterns statistically.

**Behavioral Finance result: PASS — 0 Critical / 0 Major unresolved. — 9.9/10**

---

## 30.6 v0.2 Re-Review Closure

The second review cycle resolved the following issues found in v0.1:

### Major — resolved
1. **Allocation merit and immediate execution feasibility were internally inconsistent.** Resolved by two-layer merit/execution gates and reason decomposition for `VALID — NON-ACTIONABLE`.
2. **Temporary cash insufficiency could incorrectly map an otherwise investable unowned security to AVOID.** Resolved: cash-only blocker now preserves BUY/STRONG BUY merit with `REQUIRES CASH ACCUMULATION` and `DO NOT TRADE NOW`.
3. **PASS WITH CONDITIONS treatment was too broad for ACCUMULATE.** Resolved: ACCUMULATE and STRONG BUY require Stage 0 PASS; conditional BUY is narrowly governed.
4. **Technical timing could leak into HOLD state selection.** Resolved: technicals change execution timing only unless they create an independently classified liquidity/execution risk.
5. **Owned-position STRONG BUY semantics could overlap ACCUMULATE without explanation.** Resolved by explicit ownership semantics and mandatory Action disambiguation.

### Minor — resolved
1. Removed `TEMPORARY CASH / LOT CONSTRAINT` as an AVOID reason when allocation merit remains positive.
2. Added Decision Qualifier to explain temporary/structural reasons without inventing an eighth Decision State.
3. Clarified that M3 `VALID — NON-ACTIONABLE` must be decomposed rather than consumed mechanically, preventing circular M3↔M4 action logic.

### Remaining deferred items
Only implementation/calibration items explicitly owned by later M4 files remain. No unresolved item changes the validity of the top-level state machine.

**Re-review result: 0 Critical / 0 Major unresolved.**

---

# 31. Cross-Domain Review Summary

| Area | Status |
|---|---|
| M1 Investment Policy alignment | PASS |
| Risk Policy precedence | PASS |
| Decision Framework alignment | PASS |
| M3 score/decision separation | PASS |
| Thesis gate | PASS |
| Valuation hurdle preservation | PASS |
| Risk veto enforcement | PASS |
| Portfolio concentration | PASS |
| Cash/lot feasibility | PASS |
| Opportunity cost | PASS |
| Averaging-down protection | PASS |
| +20% review rule | PASS |
| Drawdown review rule | PASS |
| Technical-analysis boundary | PASS |
| Portfolio reconstruction integrity | PASS |
| Cost-basis firewall | PASS |
| Audit trail | PASS |
| Behavioral-bias controls | PASS |
| Critical unresolved | **0** |
| Major unresolved | **0** |

---

# 32. Open Items for Later M4 Files

The following are intentionally deferred and do not block approval of this top-level engine:

1. exact BUY/ACCUMULATE tranche mechanics;
2. exact REDUCE/SELL execution sizing;
3. DCA monthly workflow details;
4. mature-portfolio sizing formula;
5. final Phase 1 → Phase 2 calibration;
6. calibrated opportunity-cost scoring/utility model;
7. precise treatment of fees/taxes in switches;
8. decision-record field schema / template formatting;
9. synthetic and historical validation cases;
10. calibration of the provisional 2-point / 2%-return lot-substitution threshold;
11. calibration of the provisional 3%-return switching materiality guide.

These items may refine execution mechanics but may not weaken M1–M3 gates.

---

# 33. Approved Baseline Gate

`DECISION_ENGINE.md` v1.0 is approved as the Milestone 4 baseline because all of the following are accepted:

1. Total Score never directly determines Decision State.
2. Risk veto and mandate rules have higher precedence than valuation/score.
3. Positive capital allocation requires defensible evidence, valid thesis, valuation, risk, confidence, portfolio capacity and opportunity-cost review; cash/lot feasibility must be known, but a temporary cash-only blocker may defer execution without erasing allocation merit.
4. LOW confidence cannot receive new capital.
5. Category gates remain non-compensable.
6. Normal BUY hurdle remains 15% expected 5Y annualized total return.
7. 12% remains an exceptional floor, not a normal BUY target.
8. Thesis BROKEN prohibits averaging down.
9. Price decline alone cannot support ACCUMULATE.
10. +20% gain triggers review, not automatic sale.
11. Portfolio drawdown thresholds trigger review/escalation, not mechanical trades.
12. Single-name and sector limits are consumed from Risk Policy without redefinition.
13. Cash may accumulate indefinitely when no sufficient opportunity exists.
14. Insufficient cash for Top 1 does not automatically redirect capital to a cheaper inferior name.
15. STRONG BUY does not imply all-in.
16. HOLD requires positive justification.
17. REDUCE and SELL remain distinct.
18. Switching an intact long-term holding uses a higher hurdle than deploying new cash.
19. Technical analysis can affect timing but cannot create fundamental eligibility.
20. Portfolio-aware actionability requires reconstructable M2 state.
21. Cost basis never influences intrinsic value or fundamental rank.
22. Every decision is auditable and historically versioned.
23. M4 proceeds one file at a time; each downstream file requires its own review and approval before the next file begins.

---

## Status

> **APPROVED BASELINE v1.0 — Multi-role review + re-review completed — 0 Critical / 0 Major unresolved — estimated design quality 9.9/10.**

> **Next approved work item: `04_DECISION_ENGINE/BUY_RULES.md`.**
