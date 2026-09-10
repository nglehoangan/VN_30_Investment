# VN30 Value Investing OS — Decision Framework

**Document:** DECISION_FRAMEWORK.md  
**Milestone:** 1 — Investment Constitution  
**Status:** Approved Constitution Baseline  
**Version:** 1.0  
**Date:** 2026-08-29  
**Governing Policy:** `INVESTMENT_POLICY.md` v1.1

---

## 1. Purpose

This document defines the standard decision process used by the VN30 Value Investing OS to evaluate a VN30 security and convert research into one final portfolio decision state.

The framework is designed to prevent decisions based on a single valuation multiple, price move, technical signal, score, narrative, or behavioral anchor.

Every real investment decision must move through the required decision gates in the order defined here, except where a step is explicitly marked N/A with a documented reason.

This framework governs **how decisions are made**. It does not own hard risk limits or risk veto definitions. Those belong to `RISK_POLICY.md`. It also does not own the final quantitative scoring weights, which belong to `SCORING_MODEL.md`.

---

## 2. Governing Principles

Every decision must comply with the following hierarchy:

1. **Mandate compliance.** Only eligible VN30 securities may receive new capital.
2. **Hard-risk compliance.** A `RISK_POLICY.md` veto overrides valuation, score, technical setup, and conviction.
3. **Avoid permanent capital impairment.** Business and financial survivability come before return optimization.
4. **Preserve portfolio resilience.** A good stock can still be a bad portfolio decision at the wrong size.
5. **Optimize long-term forward return.** Capital is allocated to the best risk-adjusted opportunity available within the mandate.
6. **Use market and technical inputs only as secondary execution context.** They do not create the thesis.
7. **Score informs; judgment decides.** No numerical score mechanically determines STRONG BUY, BUY, ACCUMULATE, HOLD, REDUCE, SELL, or AVOID.

---

## 3. Decision Architecture

Every security review follows four layers.

### Layer 0 — Eligibility / Investability / Veto Screen

Determine whether the security is eligible to proceed as a positive capital-allocation candidate.

### Layer 1 — Fundamental Underwriting

Evaluate:

1. Business Quality
2. Financial Health
3. Growth
4. Industry
5. Valuation
6. Full Risk Analysis

### Layer 2 — Market and Portfolio Context

Evaluate:

7. Market / Money Flow
8. Technical Entry
9. Portfolio Impact
10. Opportunity Cost

### Layer 3 — Final Decision

Assign exactly one state:

- STRONG BUY
- BUY
- ACCUMULATE
- HOLD
- REDUCE
- SELL
- AVOID

The final state must reflect the complete chain of evidence, not one isolated factor.

---

# 4. Stage 0 — Eligibility / Investability / Veto Screen

Stage 0 must be completed before valuation can support a positive purchase decision.

## 4.1 VN30 eligibility

For a security not currently owned:

- **PASS** — current VN30 constituent.
- **FAIL** — not a current VN30 constituent.

A FAIL means no new purchase may be recommended.

For an existing holding removed from VN30:

- classify it as a **Legacy Holding**;
- prohibit additional purchases;
- continue analysis only for HOLD-for-orderly-exit, REDUCE, or SELL decisions under the governing Legacy Holding rules.

## 4.2 Minimum business viability

The company must have a business model sufficiently understandable and economically viable to support a defensible long-term thesis.

Stage 0 should fail or be escalated when the analyst cannot establish, with reasonable confidence:

- what the company economically does;
- how it earns money;
- what drives cash generation or shareholder value;
- and why the business can remain viable through the intended holding horizon.

## 4.3 Minimum financial health

The company must have sufficient balance-sheet, liquidity, funding, and earnings resilience to justify deeper underwriting.

This is a **screen**, not the full Financial Health analysis.

## 4.4 Governance and reporting reliability

The system must establish that available disclosures are sufficiently trustworthy to estimate business economics and value.

Material unresolved concerns about governance, integrity, related-party behavior, disclosure quality, or financial-reporting reliability must be escalated to the Risk Policy veto process.

## 4.5 Evidence sufficiency

A positive decision requires enough reliable evidence to build a falsifiable investment thesis.

If critical evidence is missing, outdated, internally inconsistent, or unverifiable, the system must:

- reduce confidence;
- identify the missing evidence;
- and avoid using valuation precision to conceal information weakness.

## 4.6 Risk Policy veto check

`RISK_POLICY.md` is the authoritative source of hard vetoes.

When a Risk Policy veto is triggered:

- unowned security → **AVOID**;
- owned security → normally **SELL** or **REDUCE**, depending on the Risk Policy response and feasibility of orderly exit;
- score and valuation must not override the veto.

Until `RISK_POLICY.md` is approved, any possible hard-veto issue must be labeled **PENDING RISK POLICY REVIEW** rather than silently treated as passed.

## 4.7 Stage 0 result

Every analysis must state one of:

- **PASS**
- **PASS WITH CONDITIONS**
- **FAIL — INELIGIBLE**
- **FAIL — INVESTABILITY**
- **FAIL — RISK VETO**
- **PENDING — INSUFFICIENT EVIDENCE**
- **PENDING — RISK POLICY REVIEW**

### Composite Stage 0 Outcome

Stage 0 contains four component checks:

1. Eligibility
2. Investability
3. Risk Policy veto status
4. Evidence sufficiency

The analysis must also produce exactly one **Composite Stage 0 Outcome** using the following deterministic precedence, from highest to lowest:

1. **FAIL — INELIGIBLE**
2. **FAIL — RISK VETO**
3. **FAIL — INVESTABILITY**
4. **PENDING — RISK POLICY REVIEW**
5. **PENDING — INSUFFICIENT EVIDENCE**
6. **PASS WITH CONDITIONS**
7. **PASS**

If more than one component issue is present, the highest-precedence applicable outcome governs the Composite Stage 0 Outcome. Lower-precedence issues must still be documented as secondary findings.

The Composite Stage 0 Outcome is the single Stage 0 status consumed by the Decision Framework and must be recorded in the Final Decision Record.

### Secondary high-severity findings

The Composite Stage 0 Outcome determines the controlling workflow state, but it must **not suppress other material Stage 0 findings**.

Any identified or suspected hard-risk veto must remain explicitly visible in both the analysis and Final Decision Record even when another higher-precedence outcome, such as `FAIL — INELIGIBLE`, controls the composite result.

The Final Decision Record must therefore preserve:

- the **Composite Stage 0 Outcome**;
- all **Material Secondary Stage 0 Findings**;
- any **Hard-Veto Finding / Veto Review Status** as a separate explicit field.

This prevents mandate ineligibility, evidence status, or another composite result from hiding a material risk signal needed for portfolio governance and the Investment Journal.

### Early termination after definitive Stage 0 FAIL

A definitive Stage 0 FAIL may terminate positive underwriting early. When the Composite Stage 0 Outcome is **FAIL — INELIGIBLE**, **FAIL — RISK VETO**, or **FAIL — INVESTABILITY**, downstream sections that cannot change the positive-allocation decision may be marked:

> `N/A — TERMINATED AT STAGE 0`

For an owned position, the analysis must still complete any downstream work necessary to determine **REDUCE versus SELL**, expected execution impact, and an orderly exit or de-risking plan. Early termination must not be used to avoid analyzing residual ownership risk.

### PASS WITH CONDITIONS — strict definition

PASS WITH CONDITIONS may be used only when **all** of the following are true:

1. the unresolved condition is **not** a known or reasonably possible hard-veto issue under `RISK_POLICY.md`;
2. the condition does not make the company's economics, financial survivability, governance reliability, or valuation fundamentally un-underwritable;
3. the issue has a documented mitigation, monitoring action, or evidence requirement;
4. the uncertainty is explicitly reflected in valuation, confidence, sizing, or execution;
5. the remaining evidence is sufficient to support a falsifiable thesis.

Any unresolved issue that could reasonably trigger a Risk Policy veto **must not** receive PASS WITH CONDITIONS. It must be classified **PENDING — RISK POLICY REVIEW** until resolved.

`PASS WITH CONDITIONS` may support **BUY** for an unowned security when all BUY requirements are otherwise met, but it **cannot support STRONG BUY**. STRONG BUY requires an unqualified Stage 0 **PASS**.

### FAIL — INVESTABILITY

Use **FAIL — INVESTABILITY** when evidence is sufficient to conclude that the company does not meet the minimum investability floor even though it may remain a current VN30 constituent and no formal Risk Policy veto has yet been triggered.

Typical causes include:

- business viability below the minimum acceptable floor;
- financial health below the minimum acceptable floor;
- governance or reporting quality inadequate for reliable underwriting;
- economics too weak or structurally impaired to support a defensible long-term thesis.

A FAIL — INVESTABILITY result blocks positive capital allocation.

- Unowned security → **AVOID** with the appropriate reason code.
- Owned security → mandatory **REDUCE / SELL review** using the residual-thesis rule:
  - **REDUCE** when a smaller position remains justified because a positive, defensible residual ownership thesis still exists and residual risk remains acceptable within `RISK_POLICY.md`;
  - **SELL** when zero position is preferable because continued ownership is no longer justified, the residual thesis is no longer defensible, or policy requires full exit.

`FAIL — INVESTABILITY` is therefore **not an automatic SELL** for an owned position. It is an automatic prohibition on further capital and a mandatory reassessment of whether any residual ownership remains justified.

A valuation discount cannot reverse FAIL — INVESTABILITY.

### Positive-allocation restriction

A new positive capital-allocation decision requires **PASS** or a valid **PASS WITH CONDITIONS**.

Neither **PENDING — INSUFFICIENT EVIDENCE** nor **PENDING — RISK POLICY REVIEW** may produce **STRONG BUY, BUY, or ACCUMULATE**.

For an unowned security, a PENDING result must remain non-actionable for new capital and be represented as **AVOID — INSUFFICIENT EVIDENCE** or **AVOID — RISK REVIEW PENDING**, as applicable, until the issue is resolved.

For an owned security, a PENDING result may support HOLD only when continued ownership does not violate any known policy or known risk limit; otherwise the position must be escalated for REDUCE / SELL review.

---

# 5. Business Quality

## 5.1 Objective

Determine whether the company has economics worth owning for many years, independent of current share price.

## 5.2 Required questions

Evaluate at minimum:

- Is the business understandable?
- What are the core revenue and profit engines?
- Does the company possess durable competitive advantages or defensible market positioning?
- How strong is customer retention, brand, distribution, cost advantage, network effect, switching cost, regulation, scale, or ecosystem advantage where relevant?
- Is demand structurally durable or highly cyclical?
- Does the company convert accounting profit into cash or economic value?
- Is return on invested capital / equity economically attractive for the sector?
- Is management capital allocation rational?
- Are minority shareholders treated acceptably?
- Is business complexity proportionate to the evidence available?

## 5.3 Output

Classify Business Quality as:

- **EXCELLENT**
- **GOOD**
- **ACCEPTABLE**
- **WEAK**
- **UNINVESTABLE**

A positive purchase decision normally requires at least **ACCEPTABLE**, and BUY / STRONG BUY should usually require **GOOD or EXCELLENT** unless a lower-quality case is explicitly justified by improving economics, strong evidence, and adequate risk controls.

A valuation discount alone cannot convert UNINVESTABLE into investable.

---

# 6. Financial Health

## 6.1 Objective

Determine whether the company can survive adverse conditions and fund its strategy without unacceptable permanent-loss risk.

## 6.2 Required areas

Review sector-appropriate measures of:

- leverage;
- liquidity;
- debt maturity and refinancing exposure;
- interest coverage / debt-service capacity;
- cash generation;
- working-capital behavior;
- asset quality where relevant;
- capital adequacy where relevant;
- contingent liabilities;
- off-balance-sheet obligations where material;
- dilution risk;
- dividend sustainability;
- sensitivity to funding costs, FX, commodity prices, or credit conditions where relevant.

## 6.3 Trend matters

The system must distinguish:

- strong and improving;
- strong but deteriorating;
- weak but improving;
- weak and deteriorating.

A single healthy-looking balance-sheet snapshot is insufficient when trend risk is material.

## 6.4 Output

Classify Financial Health as:

- **VERY STRONG**
- **STRONG**
- **ADEQUATE**
- **STRESSED**
- **UNACCEPTABLE**

A new positive purchase decision normally requires at least **ADEQUATE**, subject to stricter sector-specific rules in `RISK_POLICY.md`.

UNACCEPTABLE financial health is not compensable by low valuation.

---

# 7. Growth

## 7.1 Objective

Estimate whether future earnings, cash flow, book value, dividends, or other sector-relevant value drivers can compound intrinsic value over the intended holding period.

## 7.2 Growth must be decomposed

The system should distinguish growth driven by:

- volume;
- pricing;
- market share;
- capacity expansion;
- new products;
- operating leverage;
- credit growth;
- asset growth;
- margin expansion;
- acquisitions;
- financial leverage;
- cyclical rebound;
- accounting effects.

Growth created mainly by leverage, dilution, aggressive acquisition, or temporary cycle effects should receive lower quality than internally funded durable growth.

## 7.3 Required questions

- Is historical growth repeatable?
- What must be true for the forecast to occur?
- Is reinvestment required, and at what return?
- Does growth increase or destroy per-share value?
- Is growth already embedded in the market price?
- What happens under a conservative growth case?

## 7.4 Output

Classify Growth Outlook as:

- **HIGH-QUALITY GROWTH**
- **MODERATE / DURABLE**
- **STABLE / LOW GROWTH**
- **CYCLICAL / UNCERTAIN**
- **STRUCTURALLY DECLINING**

Growth is not mandatory for investment, but the valuation must be consistent with realistic future economics.

---

# 8. Industry Analysis

## 8.1 Objective

Determine whether industry structure supports or undermines long-term value creation.

## 8.2 Required areas

Assess:

- industry growth;
- cyclicality;
- supply / demand structure;
- competitive intensity;
- barriers to entry;
- regulation;
- pricing power;
- technological disruption;
- capital intensity;
- customer / supplier bargaining power;
- commodity exposure;
- macro sensitivity;
- industry profitability through a full cycle.

## 8.3 Company versus industry

The system must separate:

- a good company in a bad industry;
- an average company in a good industry;
- a cyclical recovery;
- and a structurally improving industry.

Industry tailwinds must not be mistaken for company-specific competitive advantage.

## 8.4 Output

Classify Industry Position as:

- **ATTRACTIVE / STRUCTURALLY SUPPORTIVE**
- **NEUTRAL / MANAGEABLE**
- **CYCLICAL BUT INVESTABLE**
- **CHALLENGING**
- **STRUCTURALLY UNFAVORABLE**

---

# 9. Valuation

## 9.1 Objective

Estimate a reasonable range of intrinsic value and expected forward return from the current market price.

## 9.2 Required valuation structure

Every positive purchase recommendation must contain:

1. Current market price and price date.
2. Sector-appropriate primary valuation method.
3. Relevant cross-check(s).
4. Base-case intrinsic-value range.
5. Conservative / downside case.
6. Key assumptions.
7. Expected forward return over a stated horizon.
8. Margin of safety or valuation cushion.
9. Sensitivity to major assumptions.

## 9.3 Valuation assessment categories

Classify valuation as:

- **DEEPLY ATTRACTIVE**
- **ATTRACTIVE**
- **FAIR / REASONABLE**
- **FULL**
- **EXPENSIVE**
- **EXTREME / UNJUSTIFIABLE**

These labels must reflect both price-to-value and the confidence in the valuation estimate.

## 9.4 No cheapness shortcut

The following are insufficient by themselves:

- low P/E;
- low P/B;
- price decline;
- discount to historical multiple;
- discount to peers.

The system must explain **why the current price is below, near, or above economic value**.

## 9.5 Forward return

Expected forward return should consider, as applicable:

- fundamental growth;
- normalization of profitability;
- dividends;
- buybacks / dilution;
- changes in valuation multiples;
- reinvestment returns;
- downside risk.

A high expected return that depends mainly on aggressive multiple expansion should receive lower confidence than one supported by business compounding and cash distributions.

---

# 10. Full Risk Analysis

## 10.1 Objective

Identify what can make the thesis wrong, permanently impair capital, or create an unacceptable portfolio outcome.

## 10.2 Risk taxonomy

At minimum assess:

- business-model risk;
- competitive risk;
- financial / solvency risk;
- liquidity / refinancing risk;
- governance / integrity risk;
- accounting / reporting risk;
- regulatory risk;
- industry / disruption risk;
- macro risk;
- interest-rate risk;
- FX / commodity risk where relevant;
- capital-allocation risk;
- execution risk;
- dilution risk;
- valuation risk;
- event risk;
- thesis-dependence on a small number of assumptions.

## 10.3 Risk severity

Each major risk should state:

- probability: LOW / MEDIUM / HIGH;
- impact: LOW / MEDIUM / HIGH / SEVERE;
- whether the risk is temporary or potentially permanent;
- whether it is already reflected in valuation;
- leading indicators to monitor;
- thesis-invalidation condition where applicable.

## 10.4 Risk conclusion

Classify residual risk after mitigation as:

- **LOW**
- **MODERATE**
- **ELEVATED**
- **HIGH**
- **UNACCEPTABLE**

A positive purchase decision requires residual risk within the applicable `RISK_POLICY.md` limits.

---

# 11. Market / Money Flow

## 11.1 Objective

Provide secondary context about current market positioning and execution conditions without altering the fundamental thesis.

## 11.2 Inputs may include

- market trend;
- foreign-investor flow;
- proprietary flow;
- volume;
- turnover and liquidity;
- block transactions;
- abnormal accumulation / distribution;
- sentiment;
- catalyst-related positioning.

## 11.3 Interpretation

Classify market / money-flow context as:

- **SUPPORTIVE**
- **NEUTRAL**
- **CAUTIONARY**
- **STRESSED / DISLOCATED**

Money flow may alter:

- urgency;
- staging;
- tranche sizing;
- execution risk;

but must not determine long-term ownership merit.

---

# 12. Technical Entry

## 12.1 Objective

Use technical information to improve execution after a fundamentally acceptable decision already exists.

## 12.2 Technical factors may include

- support / resistance;
- trend structure;
- moving averages;
- relative strength;
- volume confirmation;
- volatility;
- gap / event risk;
- overbought / oversold conditions;
- liquidity and order-book conditions where available.

## 12.3 Technical entry classification

Classify entry condition as:

- **FAVORABLE**
- **ACCEPTABLE**
- **POOR — STAGE ENTRY**
- **VERY POOR — EXECUTION RISK; TEMPORARY DELAY MAY BE JUSTIFIED**
- **N/A**

Technical analysis may change **how** and **how fast** approved capital is deployed, but it must not indefinitely determine **whether** a fundamentally approved investment receives capital.

A temporary delay is justified only by execution-relevant risk such as abnormal volatility, event-gap risk, liquidity disorder, unstable order-book conditions, or material market-impact risk. Trend weakness, moving-average signals, RSI, momentum, or similar technical indicators alone are insufficient reasons to defer a fundamentally approved purchase indefinitely.

Technical analysis cannot convert an otherwise fundamentally AVOID security into BUY.

For thesis-break SELL decisions, Technical Entry may be N/A unless orderly execution materially affects loss minimization.

---

# 13. Portfolio Impact

## 13.1 Objective

Determine whether the security improves the portfolio rather than merely looking attractive in isolation.

## 13.2 Required checks

Assess:

- current position weight;
- post-trade position weight;
- issuer concentration;
- sector concentration;
- correlated exposure;
- factor concentration;
- liquidity;
- cash reserve impact;
- minimum board-lot affordability;
- overlap with existing theses;
- effect on portfolio downside;
- expected return contribution;
- dividend / cash-flow profile where relevant.

Hard position and sector limits must come from `RISK_POLICY.md`.

## 13.3 Portfolio impact classification

Classify the proposed action as:

- **IMPROVES PORTFOLIO**
- **NEUTRAL / ACCEPTABLE**
- **CONSTRAINED — SMALLER SIZE REQUIRED**
- **NEGATIVE — DO NOT ADD**
- **REQUIRES REDUCTION**

### Binding mapping to Final Decision States

Portfolio Impact constrains the set of valid Final Decision States:

- **IMPROVES PORTFOLIO** → may support a positive allocation state if all other gates pass.
- **NEUTRAL / ACCEPTABLE** → may support a positive allocation state if all other gates pass.
- **CONSTRAINED — SMALLER SIZE REQUIRED** → BUY / ACCUMULATE / STRONG BUY is allowed only with explicitly reduced Risk Policy-compliant sizing.
- **NEGATIVE — DO NOT ADD** → prohibits final **BUY** and **ACCUMULATE** and prohibits an owned-position **STRONG BUY** that implies additional capital; for an existing position, the actionable state is normally HOLD unless reduction is required for another reason.
- **REQUIRES REDUCTION** → final state must normally be **REDUCE** or **SELL**, depending on whether a smaller position or zero position is preferable.

A security may be fundamentally attractive while the correct portfolio action is HOLD because additional exposure would create concentration risk. Portfolio Impact therefore constrains the Final Decision State and cannot be treated as a narrative-only input.

---

# 14. Opportunity Cost

## 14.1 Objective

Compare the security with alternative uses of capital while distinguishing **new-capital allocation** from **switching existing invested capital**.

Alternatives include:

- other current VN30 opportunities;
- increasing existing holdings;
- retaining cash;
- avoiding a trade altogether.

### New-capital allocation hurdle

New cash should be deployed only when the candidate clears the applicable minimum required forward-return / risk hurdle and is sufficiently attractive relative to other eligible uses of new capital. No existing holding needs to be sold for this test.

### Existing-capital switching hurdle

Switching an existing holding requires a materially higher standard because it incurs uncertainty, transaction costs, taxes where relevant, liquidity risk, thesis-transition risk, and possible loss of future compounding. An existing holding does **not** need to be the highest-ranked VN30 opportunity in order to remain HOLD.

## 14.2 Comparison factors

Compare:

- expected forward return;
- downside risk;
- business quality;
- thesis confidence;
- valuation confidence;
- liquidity;
- concentration impact;
- diversification benefit;
- transaction costs and taxes where relevant;
- switching risk;
- lost future compounding from selling an existing quality holding.

## 14.3 Switching hurdle

A valid long-term holding should not be sold merely because another security has a marginally higher score or expected return.

A switch requires the replacement to be **materially superior** after uncertainty, costs, taxes, liquidity, thesis confidence, portfolio fit, and lost future compounding are considered.

The **new-capital allocation hurdle** and the **existing-capital switching hurdle** are distinct. The switching hurdle must be higher.

---

# 15. Decision Confidence

Every final decision must state a confidence level:

- **HIGH** — evidence is current, internally consistent, thesis drivers are understandable, valuation range is reasonably robust, and major risks are identifiable.
- **MEDIUM** — decision is supportable but contains material uncertainty or sensitivity.
- **LOW** — evidence gaps, unstable economics, valuation sensitivity, or unresolved risks materially reduce conviction.

Confidence governs whether new capital may be deployed:

- **STRONG BUY requires HIGH confidence.**
- **BUY requires at least MEDIUM confidence.**
- **ACCUMULATE requires at least MEDIUM confidence.**
- **LOW confidence prohibits new capital deployment.**

LOW confidence may still support HOLD for an existing position only when continued ownership remains policy-compliant and the purpose is to preserve optionality while resolving evidence gaps. Depending on risk severity, LOW confidence may instead require REDUCE, SELL, or AVOID.

---

# 15A. Execution Sub-Status

Decision State and execution timing are related but distinct.

Every positive capital-allocation decision that implies a trade must include exactly one execution sub-status:

- **EXECUTE** — capital may be deployed now within the approved sizing and Risk Policy limits.
- **STAGED** — capital is approved for deployment, but execution should occur in planned tranches because of valuation uncertainty, liquidity, volatility, board-lot constraints, portfolio pacing, or other non-veto execution considerations.
- **TEMPORARILY DEFERRED** — the investment decision remains fundamentally valid, but no tranche may be executed until a specific, documented execution-risk condition is resolved.

`TEMPORARILY DEFERRED` may be used only for genuine execution risk as defined in §12.3. It must include:

1. the exact reason for deferral;
2. the observable condition required to resume execution;
3. the review trigger or expiry condition;
4. confirmation that no Stage 0, Risk Policy, or Portfolio Impact constraint has invalidated the positive decision itself.

A positive Decision State with `TEMPORARILY DEFERRED` is not equivalent to "do nothing indefinitely." Every deferral must include at least one explicit expiry mechanism: a calendar expiry date, the next material company/market event, or a specific observable execution condition.

At expiry or trigger, the position must be **re-underwritten** and the execution sub-status must be reset to **EXECUTE**, **STAGED**, or a changed Final Decision State. `TEMPORARILY DEFERRED` must not roll forward automatically.

If the deferral condition remains unresolved or becomes a higher-precedence risk issue, the security must be re-underwritten and the Final Decision State updated.

If a Stage 0 result, hard Risk Policy limit, or binding Portfolio Impact classification prohibits capital deployment, the framework must not use BUY, ACCUMULATE, or STRONG BUY merely with a deferred execution label. The Final Decision State itself must change to the appropriate actionable state.

---

# 16. Ownership-Aware Decision States

The final Decision State is an **actionable portfolio state**, not merely a statement of fundamental attractiveness. If portfolio constraints prevent the action implied by an attractiveness assessment, the final state must reflect the action that is actually permitted. Underlying attractiveness may be recorded separately, but it must not override the actionable state.

Examples:

- Fundamentally STRONG BUY-level but hard concentration limit prohibits adding → final decision normally **HOLD**, with underlying attractiveness recorded separately.
- Fundamentally BUY-level but Stage 0 is PENDING → final decision **AVOID / non-actionable pending review**, not BUY.

The seven states are not simple score bands. They combine:

- Stage 0 status;
- business quality;
- financial health;
- growth and industry outlook;
- valuation;
- residual risk;
- decision confidence;
- portfolio impact;
- opportunity cost;
- ownership status;
- execution conditions.

## 16.1 STRONG BUY

### Meaning

A rare, high-conviction opportunity where a fundamentally strong or clearly investable business trades at a sufficiently attractive valuation to offer an unusually favorable long-term risk/reward within the VN30 universe.

### Required conditions

Normally all must be true:

1. Stage 0 = PASS.
2. No Risk Policy veto or hard-limit violation.
3. Business Quality is normally GOOD or EXCELLENT.
4. Financial Health is normally STRONG or VERY STRONG, or sector-appropriate equivalent.
5. Thesis is clear, evidence-backed, and falsifiable.
6. Expected forward return is materially above the minimum required return and attractive relative to available VN30 alternatives.
7. Valuation is ATTRACTIVE or DEEPLY ATTRACTIVE with meaningful margin of safety.
8. Downside case is tolerable relative to upside and portfolio risk.
9. Residual risk is **LOW or MODERATE**. ELEVATED, HIGH, or equivalent residual risk is incompatible with STRONG BUY and cannot be overridden by narrative justification.
10. Decision confidence = HIGH.
11. Portfolio impact is acceptable after proposed sizing.
12. The opportunity is compelling even without favorable technical or money-flow signals.

### Action

- Unowned: initiate position, potentially with meaningful but Risk Policy-compliant sizing.
- Owned: STRONG BUY is an **exceptional add-capital state above ACCUMULATE**, not a separate ownership category. It means the already-owned security currently presents unusually favorable incremental risk/reward and may receive additional capital more aggressively **only if portfolio capacity exists within approved concentration, liquidity, and cash limits**.
- Assign execution sub-status **EXECUTE**, **STAGED**, or, only for genuine execution risk, **TEMPORARILY DEFERRED** under §15A.
- If hard portfolio constraints prohibit adding, the final portfolio decision **must not remain STRONG BUY**; record the underlying attractiveness separately and use the appropriate actionable state, normally HOLD.

### Disqualifiers

Normally cannot be STRONG BUY when:

- evidence confidence is LOW;
- valuation requires optimistic assumptions;
- financial health is merely stressed;
- major unresolved governance/reporting concerns exist;
- thesis depends mainly on short-term market timing;
- portfolio limits prohibit additional exposure.

---

## 16.2 BUY

### Meaning

An attractive **unowned** new-capital opportunity with a favorable long-term expected return and acceptable risk, but less exceptional than STRONG BUY.

### Required conditions

Normally all must be true:

1. Stage 0 = PASS or PASS WITH CONDITIONS.
2. No Risk Policy veto.
3. Business Quality is at least ACCEPTABLE, normally GOOD or better.
4. Financial Health is at least ADEQUATE.
5. Valuation is ATTRACTIVE, or FAIR/REASONABLE only when exceptional business quality and durable compounding justify the forward return.
6. Expected forward return is above the required hurdle after risk adjustment.
7. Residual risks are understood and acceptable.
8. Confidence is at least MEDIUM.
9. Portfolio sizing can remain within Risk Policy limits.
10. Opportunity cost versus other VN30 names and cash supports deployment.

### Action

- **Unowned only:** initiate a position.
- Assign execution sub-status **EXECUTE**, **STAGED**, or, only for genuine execution risk, **TEMPORARILY DEFERRED** under §15A.

Once a position has been initiated and is owned, any further positive new-capital decision must use **ACCUMULATE** or **STRONG BUY**, subject to portfolio capacity and the final-action rule. BUY and ACCUMULATE are therefore mutually exclusive by ownership status.

BUY does not require favorable technical conditions. Poor technical entry may change execution from immediate purchase to staged purchase without changing the fundamental state.

---

## 16.3 ACCUMULATE

### Meaning

An **owned** position remains attractive enough for incremental capital, but the case does not justify full desired allocation immediately.

ACCUMULATE is an **owned-position state** and is not a weaker synonym for BUY. It may be used immediately after initial position creation when the investment plan intentionally calls for staged building, but the security must already be owned at the time the ACCUMULATE decision is issued.

### Required conditions

Normally all must be true:

1. Stage 0 remains **PASS**. `PASS WITH CONDITIONS` does **not** qualify for ACCUMULATE. This is intentional: adding capital to an already-owned position requires an unqualified Stage 0 pass.
2. Thesis remains valid or has improved.
3. Fresh underwriting has been completed.
4. Business and financial quality remain investable.
5. Updated valuation remains attractive enough for incremental capital.
6. No Risk Policy veto or concentration breach would result.
7. Expected forward return remains superior to cash and competitive with alternatives.
8. Incremental purchase improves or does not materially weaken portfolio construction.
9. Decision confidence is at least MEDIUM.

### Typical reasons to use ACCUMULATE instead of BUY

- position already exists and is below target allocation;
- valuation is attractive but not exceptional;
- uncertainty warrants staged deployment;
- technical/liquidity conditions support gradual entry;
- available monthly cash or board-lot constraints require gradual building;
- portfolio concentration suggests smaller increments.

### Action

Add selectively in tranches, subject to fresh review before each meaningful addition.

ACCUMULATE normally uses execution sub-status **STAGED**. It may use **EXECUTE** for an approved immediate incremental purchase, or **TEMPORARILY DEFERRED** only for genuine execution risk under §15A.

A falling share price alone is never sufficient for ACCUMULATE.

---

## 16.4 HOLD

### Meaning

The security remains worth owning at its current market value, but additional capital does not currently offer a sufficiently superior risk/reward to justify BUY or ACCUMULATE.

### Owned security conditions

HOLD is appropriate when:

1. thesis remains valid;
2. business quality and financial health remain acceptable;
3. no sell-triggering Risk Policy condition exists;
4. expected forward return remains acceptable for continued ownership;
5. valuation is generally FAIR/REASONABLE to FULL, or attractive but portfolio constraints prevent adding;
6. switching hurdle is not met by alternatives;
7. position size remains acceptable.

### Unowned security semantics

For an unowned security, HOLD is generally **not used**. If the company is investable but current valuation does not justify purchase, use **AVOID / WATCHLIST-NO PURCHASE** only if the implementation supports a watchlist qualifier. Because the constitutional state list contains only seven states, the formal state for an unowned, non-actionable security is **AVOID**, with the reason explicitly stated as **valuation / opportunity-cost AVOID rather than quality veto**.

### Action

- Owned: maintain position; do not add unless conditions improve.
- Review on material thesis, valuation, or risk changes.

HOLD is a current-capital-allocation decision and must be justified using forward return from today's price, not historical cost basis.

### Provisional HOLD for unresolved evidence

An owned position with **PENDING — INSUFFICIENT EVIDENCE** or **PENDING — RISK POLICY REVIEW** may use **HOLD** only as a **Provisional HOLD** when immediate REDUCE or SELL is not yet justified and continued ownership does not violate any known policy or hard limit.

A Provisional HOLD must include:

- **Review Status = PENDING**;
- no new capital deployment;
- the exact unresolved evidence or risk question;
- the information, event, or decision needed to resolve it;
- a review deadline, next material event, or observable trigger;
- an escalation condition for REDUCE or SELL if the uncertainty worsens or remains unresolved.

Provisional HOLD does **not** assert that the thesis is fully revalidated. It means only that immediate exit is not yet justified while material evidence is being resolved.

---

## 16.5 REDUCE

### Meaning

The security remains investable or partially worth owning, but the current position size is too large or the forward risk/reward has deteriorated enough that partial capital reallocation is warranted.

### Typical triggers

One or more may apply:

- valuation has become expensive enough to reduce expected forward return materially;
- position weight exceeds or approaches Risk Policy limits;
- sector/correlated concentration has become excessive;
- thesis confidence has weakened but is not fully broken;
- financial or business risk has risen but does not require full exit;
- intrinsic value estimate has declined;
- a materially superior alternative meets the switching hurdle;
- a Legacy Holding is being exited in an orderly manner;
- liquidity or event risk favors staged reduction rather than immediate exit.

### Action

Sell part of the position to restore acceptable risk/reward or portfolio construction.

### REDUCE / SELL boundary

Use **REDUCE** only when a **smaller position is preferable to both the current position and a zero position** because a positive, defensible ownership thesis still remains.

Use **SELL** when a **zero position is preferable** because continued ownership itself is no longer justified or policy requires exit.

REDUCE must specify:

- why a smaller residual position remains justified and why full SELL is not required;
- desired post-reduction exposure or principle for determining it;
- conditions for returning to HOLD / ACCUMULATE or escalating to SELL.

---

## 16.6 SELL

### Meaning

Continued ownership is no longer justified, **zero position is preferable**, or a governing policy requires exit.

### SELL triggers and REDUCE / SELL review triggers

SELL is appropriate when **zero position is preferable** or a governing policy requires full exit.

#### Direct SELL triggers

The following may justify SELL directly when applicable:

1. Investment thesis is materially invalidated such that continued ownership is no longer defensible.
2. A Risk Policy veto explicitly requires full exit.
3. Portfolio risk cannot be restored adequately through partial reduction.
4. The security is a Legacy Holding and the governing orderly-exit plan requires completion.
5. Evidence shows the original thesis was materially wrong and current facts do not support a defensible replacement thesis.
6. Current market price implies a **materially inadequate or negative expected forward return**, and continued ownership fails the switching / reallocation test after considering valuation uncertainty, business quality, taxes, transaction costs, liquidity, available alternatives, cash, and lost future compounding. A merely lower-than-target forward return is not by itself sufficient for SELL.

#### Mandatory REDUCE / SELL review triggers

The following do **not** automatically mean SELL unless a Risk Policy rule separately requires full exit:

- Business quality deteriorates below the investability floor.
- Financial health becomes unacceptable.
- Governance or reporting reliability becomes unacceptable.
- Intrinsic value is materially impaired.
- Residual risk rises materially but may still be acceptable at a smaller exposure.

For these cases apply the residual-thesis rule:

- **REDUCE** when a smaller position remains justified because a positive, defensible residual ownership thesis still exists and residual risk is acceptable.
- **SELL** when zero position is preferable because continued ownership is no longer justified, the residual thesis is no longer defensible, or policy requires full exit.

This mapping is binding and must remain consistent with **FAIL — INVESTABILITY** treatment in Stage 0.

### Action

Exit the position, immediately or through an orderly execution plan depending on liquidity, market impact, and Risk Policy requirements.

### Technical treatment

A weak technical setup is never sufficient for SELL. Conversely, a strong technical setup must not delay a mandatory exit caused by thesis failure or a Risk Policy veto, except where execution sequencing is necessary to reduce market-impact risk.

---

## 16.7 AVOID

### Meaning

Do not deploy new capital into the security under current conditions.

AVOID applies only to **unowned securities**.

For an owned security, inability to receive new capital is a portfolio constraint rather than an AVOID state. Owned securities must use **HOLD, REDUCE, or SELL** as the final state. Legacy Holdings likewise use HOLD-for-orderly-exit, REDUCE, or SELL.

### AVOID categories

The reason must be classified as one of:

- **AVOID — INELIGIBLE**: not eligible for new purchase under the VN30 mandate.
- **AVOID — RISK VETO**: Risk Policy hard veto.
- **AVOID — QUALITY**: business quality below required floor.
- **AVOID — FINANCIAL HEALTH**: unacceptable balance-sheet or funding risk.
- **AVOID — GOVERNANCE / REPORTING**: evidence reliability or governance unacceptable.
- **AVOID — VALUATION**: company may be good, but current price does not provide adequate forward return.
- **AVOID — INSUFFICIENT EVIDENCE**: investment case cannot be underwritten confidently.
- **AVOID — OPPORTUNITY COST**: investable but clearly inferior to available alternatives or cash.

### Important semantic rule

AVOID does **not** always mean “bad company.” It means “do not allocate new capital now,” and the reason must be explicit.

---

# 17. Decision-State Precedence

When multiple signals conflict, apply the following precedence:

1. **Mandate ineligibility / Risk Policy hard veto**
2. **Thesis invalidation / permanent-value impairment**
3. **Financial survivability / governance reliability**
4. **Portfolio hard limits**
5. **Business quality and long-term economics**
6. **Valuation and expected forward return**
7. **Opportunity cost**
8. **Market / money flow**
9. **Technical execution**

Higher-precedence failures cannot be overridden by lower-precedence positives.

Example:

> Excellent technical momentum + cheap P/E cannot override a governance veto.

---

# 18. Score Interaction

## 18.1 Role of score

Every final decision must include a score, but the score is a structured summary of evidence rather than an automatic trading rule.

## 18.2 Score thresholds

Exact score weights and quantitative thresholds belong to `SCORING_MODEL.md` and are intentionally not fixed here.

When `SCORING_MODEL.md` is approved, score bands may establish **default decision zones**, but the final state must still satisfy the qualitative gates in this framework.

## 18.3 Override rules

A score may never override:

- mandate ineligibility;
- a Risk Policy veto;
- a broken thesis;
- unacceptable financial health;
- unacceptable governance/reporting reliability;
- portfolio hard limits.

Any decision differing materially from the default score-implied state must document the reason.

---

# 19. Decision Matrix

The following is a qualitative default matrix. It is not a substitute for full analysis.

| State | Ownership | Fundamentals | Valuation / Forward Return | Risk | Portfolio Action |
|---|---|---|---|---|---|
| STRONG BUY | Unowned or owned | Strong, HIGH confidence | Exceptionally attractive | Acceptable and capacity available | Initiate/add strongly within limits; otherwise downgrade final actionable state |
| BUY | Unowned only | Investable, at least MEDIUM confidence | Attractive | Acceptable | Initiate position |
| ACCUMULATE | Owned only | Thesis intact, at least MEDIUM confidence | Attractive enough for incremental capital | Acceptable | Add gradually |
| HOLD | Owned | Thesis intact | Adequate for continued ownership, not enough to add | Acceptable | Maintain |
| REDUCE | Owned | Partially intact / risk rising | Forward return deteriorated or size excessive | Elevated but manageable | Trim |
| SELL | Owned | Thesis broken / unacceptable | Ownership no longer justified | Unacceptable or mandate exit | Exit |
| AVOID | Unowned | Any, depending on reason | Not actionable | May be unacceptable | No new capital |

---

# 20. Required Final Decision Record

Every completed security decision must contain the following fields.

## 20.1 Identification

- Ticker
- Company
- Current VN30 membership status
- Ownership status: UNOWNED / OWNED / LEGACY HOLDING
- Analysis as-of date
- Market-price date
- Financial-reporting period

## 20.2 Stage 0

- Eligibility result
- Investability result
- Risk Policy veto status
- Evidence sufficiency
- **Composite Stage 0 Outcome**
- **Material Secondary Stage 0 Findings**
- **Hard-Veto Finding / Veto Review Status**

## 20.3 Underwriting summary

- Business Quality classification
- Financial Health classification
- Growth Outlook classification
- Industry classification
- Valuation classification
- Intrinsic-value range
- Expected forward return
- Full Risk classification
- Market / Money Flow classification
- Technical Entry classification
- Portfolio Impact classification
- Opportunity Cost conclusion

## 20.4 Final decision

- **Decision State**
- **Score**
- **Decision Confidence**
- **Review Status: FINAL / PENDING / ESCALATED**
- **Execution Sub-Status: EXECUTE / STAGED / TEMPORARILY DEFERRED / N/A**
- **Investment Thesis**
- **Key Positives**
- **Key Risks**
- **Valuation Assessment**
- **Suggested Action**
- **Position-sizing implication**
- **Thesis Invalidation Conditions**
- **Next Review Trigger**

### Review Status definitions

- **FINAL** — sufficient evidence and policy clarity exist for the current Decision State to stand until the next scheduled or event-driven review.
- **PENDING** — a defined evidence gap, pending risk review, or unresolved condition prevents final confirmation. No new capital may be deployed while PENDING.
- **ESCALATED** — the case cannot be resolved within normal analyst/portfolio-manager decision authority because of a material policy-interpretation issue, exceptional risk, conflicting high-precedence conditions, mandate ambiguity, or another matter requiring explicit CIO and/or Risk Manager review.

`ESCALATED` is a governance status, not an eighth Decision State. While ESCALATED, **no new capital may be deployed** until the escalation is resolved.

An ESCALATED record must identify:

1. the issue being escalated;
2. the policy sections involved;
3. the required decision authority;
4. the current temporary portfolio action;
5. the review deadline or event trigger.

For an owned position, the temporary action during escalation may be HOLD, Provisional HOLD, REDUCE, or SELL depending on known risk and policy constraints. For an unowned security, the Decision State remains AVOID until escalation is resolved.

## 20.5 Behavioral check

Explicitly flag whether the decision may be influenced by:

- FOMO;
- anchoring to cost basis;
- anchoring to historical high;
- loss aversion;
- confirmation bias;
- recency bias;
- action bias;
- premature profit-taking;
- averaging-down bias.

---

# 21. Thesis Invalidation Framework

Every BUY, STRONG BUY, ACCUMULATE, or HOLD thesis must contain explicit invalidation conditions.

Invalidation conditions should be observable and decision-relevant, such as:

- deterioration in a key competitive advantage;
- sustained profitability below the thesis case;
- leverage or liquidity moving outside acceptable bounds;
- governance/reporting deterioration;
- structural industry change;
- failure of a major strategic assumption;
- capital-allocation behavior inconsistent with the thesis;
- permanent reduction in normalized earning power or intrinsic value.

Price decline by itself is not thesis invalidation.

Price appreciation by itself is not thesis confirmation.

---

# 22. Re-Underwriting Rules

Fresh underwriting is mandatory before:

- initiating a position;
- adding meaningful new capital;
- reversing REDUCE to ACCUMULATE;
- reversing SELL/AVOID after material prior concerns;
- making a major position-size increase;
- changing the investment thesis materially.

A review may reuse prior research, but current facts, valuation, risk, and portfolio context must be refreshed.

---

# 23. Event-Driven Decision Rules

A full or targeted review should be triggered by material events including:

- earnings or annual-report release;
- major acquisition or divestiture;
- significant capital raise;
- dividend policy change;
- leadership/governance event;
- material regulatory action;
- credit deterioration;
- major litigation;
- structural industry change;
- large intrinsic-value change;
- VN30 inclusion/removal;
- unusual price move when accompanied by potentially thesis-relevant new information.

A price move without new fundamental information is not automatically a thesis event.

---

# 24. Conflict Resolution Rules

When two parts of the analysis point in different directions:

### 24.1 Good business, expensive valuation

Default: HOLD if owned; AVOID — VALUATION if unowned.

### 24.2 Weak business, apparently cheap valuation

Default: AVOID unless the company still passes the minimum investability floor and a defensible improving-business thesis exists. Cheapness alone is insufficient.

### 24.3 Strong fundamentals, poor technical entry

Default: preserve the underlying fundamental attractiveness assessment, but the **Final Decision State must remain consistent with the action actually permitted**.

If technical conditions only affect execution quality, retain the otherwise valid positive Decision State and assign an execution sub-status under §15A:

- **EXECUTE** when deployment may begin now;
- **STAGED** when deployment is approved but should occur in tranches;
- **TEMPORARILY DEFERRED** only when a genuine execution-risk condition under §12.3 prevents any tranche from being executed immediately.

A positive Decision State marked `TEMPORARILY DEFERRED` must include a specific re-entry condition and review trigger. It cannot mean "wait until the chart looks better."

Do not issue a Final Decision such as **STRONG BUY — DO NOT BUY** or **BUY — WAIT INDEFINITELY**. If a Stage 0 result, hard Risk Policy limit, or binding Portfolio Impact constraint prohibits capital deployment, the Final Decision State itself must change to the appropriate actionable state and the fundamental attractiveness must be recorded separately.

### 24.4 Weak money flow, attractive valuation

Do not invalidate the thesis solely because of weak flows. Adjust execution caution only.

### 24.5 Attractive stock, portfolio concentration too high

Default: HOLD / DO NOT ADD, or REDUCE if existing concentration breaches Risk Policy limits.

### 24.6 High score, Risk Policy veto

Default: AVOID if unowned; REDUCE/SELL if owned according to Risk Policy. Score is irrelevant to override.

### 24.7 Large unrealized gain, thesis intact, forward return still attractive

Default: HOLD or ACCUMULATE depending on valuation and portfolio capacity. Historical gain is not a sell reason.

### 24.8 Large unrealized loss, thesis intact, valuation improved

Do not automatically ACCUMULATE. Perform fresh underwriting and compare the position with all available alternatives and cash.

---

# 25. What This Framework Does Not Define

The following remain outside this document:

- issuer weight limits;
- sector limits;
- correlated-risk limits;
- cash minimum/maximum ranges;
- quantitative drawdown ladder;
- hard solvency/governance veto thresholds;
- exact margin-of-safety thresholds;
- exact required-return hurdles by sector/risk class;
- score weights;
- score bands;
- position-sizing formulas;
- detailed staged-entry rules.

The **minimum acceptable forward-return / risk hurdle framework is owned by `RISK_POLICY.md` as the single source of truth**. This Decision Framework consumes and enforces that hurdle; `SCORING_MODEL.md` may reflect it in scoring but must not redefine or override it.

Other quantitative scoring weights and score bands belong to `SCORING_MODEL.md`; later operating workflows may define execution mechanics that do not conflict with either policy.

---

# 26. Governance

This document is subordinate to:

1. `INVESTMENT_POLICY.md`
2. `RISK_POLICY.md`

and has authority over lower-level decision implementation and scoring behavior once approved.

If this framework conflicts with `INVESTMENT_POLICY.md`, the Investment Policy prevails.

If a decision rule conflicts with a hard risk limit or veto in `RISK_POLICY.md`, the Risk Policy prevails.

---

# 27. Key Decision Rules Summary

1. **Stage 0 first.** Eligibility, investability, evidence sufficiency, and Risk Policy vetoes are checked before valuation can support a positive purchase decision.
2. **No single-metric decisions.** P/E, P/B, price movement, score, flow, technicals, or one growth number cannot independently determine the final state.
3. **Business before price.** Understand quality, financial resilience, growth economics, and industry structure before deciding whether price is attractive.
4. **Valuation must estimate forward return.** Cheap-looking multiples are not enough.
5. **Risk can veto value.** A hard Risk Policy veto overrides valuation and score.
6. **Money flow and technicals are secondary.** They optimize execution, not ownership merit; technicals cannot indefinitely defer a fundamentally approved purchase absent genuine execution risk.
7. **Portfolio context can constrain a good stock.** Portfolio Impact classification is binding: DO NOT ADD blocks positive add states, while REQUIRES REDUCTION requires REDUCE or SELL.
8. **Opportunity cost is mandatory.** New-capital allocation and switching existing capital use different hurdles; the switching hurdle must be higher.
9. **STRONG BUY is rare.** It requires exceptional risk/reward, strong evidence, high confidence, residual risk LOW or MODERATE, and acceptable portfolio impact.
10. **Final state must be actionable.** Fundamental attractiveness cannot remain STRONG BUY/BUY/ACCUMULATE when hard portfolio or Stage 0 constraints prohibit the implied trade.
11. **PENDING and ESCALATED block new capital.** Neither status may receive new capital until resolved.
12. **Execution sub-status is separate from Decision State.** EXECUTE / STAGED / TEMPORARILY DEFERRED describe implementation; they cannot hide a higher-precedence prohibition on deployment.
13. **PASS WITH CONDITIONS cannot support STRONG BUY, and ACCUMULATE requires PASS.** This asymmetry is intentional and conservative.
14. **Composite Stage 0 is deterministic but never hides material risk findings.** Hard-veto findings remain explicitly visible even when another composite outcome controls.
15. **Definitive Stage 0 FAIL may terminate positive underwriting early.** Owned positions must still complete enough analysis to choose REDUCE versus SELL and plan execution.
16. **Owned STRONG BUY is an exceptional add state above ACCUMULATE.**
17. **BUY means initiate an unowned position.** Once owned, additional positive allocation uses ACCUMULATE or, when truly exceptional and capacity exists, STRONG BUY.
18. **BUY with only ACCEPTABLE Business Quality requires enhanced underwriting and conservative sizing.**
19. **ACCUMULATE means additional capital to an owned position.** It requires fresh underwriting, at least MEDIUM confidence, and is not automatic averaging down.
20. **HOLD is an active capital-allocation decision.** Continued ownership must be justified from today's price.
21. **REDUCE means a smaller position is preferable and a positive residual ownership thesis remains.**
22. **SELL means zero position is preferable, continued ownership is no longer justified, or policy requires exit.**
23. **AVOID is for unowned securities only.** It means no new capital, and the exact reason must be stated. Owned securities use HOLD, REDUCE, or SELL.
24. **Historical gain/loss is not a decision anchor.** Forward return, thesis quality, downside risk, and opportunity cost govern the decision.
25. **A score informs but does not rule.** Hard vetoes, thesis failure, and portfolio constraints take precedence.
26. **Every positive thesis must be falsifiable.** Thesis-invalidation conditions are mandatory.
27. **Every Add is fresh underwriting.** Price decline alone never justifies more capital.
28. **One final state only.** Every completed review must end with exactly one of the seven approved Decision States.

---

## 28. Approval Gate

**Current status:** Approved Constitution Baseline.

Before this document is approved, the following should be reviewed from CIO and Risk Manager perspectives:

1. Whether the seven Decision States are mutually exclusive enough for automation.
2. Whether HOLD versus AVOID semantics for unowned securities are acceptable.
3. Whether ACCUMULATE should remain primarily an owned/staged-entry state.
4. Whether STRONG BUY / BUY conditions are sufficiently strict without premature numerical thresholds.
5. Whether REDUCE / SELL precedence is clear enough.
6. Whether the framework properly defers hard limits and veto thresholds to `RISK_POLICY.md`.
7. Whether later `SCORING_MODEL.md` can map scores into this framework without becoming the decision authority.

No implementation, stock-specific analysis, or scoring-engine coding should begin until this document has passed the review gate.
