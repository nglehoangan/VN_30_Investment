# VN30 Value Investing OS — Risk Policy

**Document:** RISK_POLICY.md  
**Milestone:** 1 — Investment Constitution  
**Status:** Approved Constitution Baseline  
**Version:** 1.0  
**Date:** 2026-08-29  
**Governing Policy:** `INVESTMENT_POLICY.md` v1.1  
**Consumed By:** `DECISION_FRAMEWORK.md` v1.0

---

## 1. Purpose

This Risk Policy is the authoritative source of portfolio risk limits, hard risk vetoes, escalation rules, concentration controls, drawdown response, cash-reserve discipline, DCA/add-position risk controls, and mandatory thesis-review triggers for the VN30 Value Investing OS.

Its purpose is to prevent permanent capital impairment, uncontrolled concentration, forced selling, leverage-driven loss, behavioral averaging down, and risk-seeking behavior caused by the 15%–20% long-term return target.

This document owns:

- hard portfolio risk limits;
- hard risk veto definitions;
- drawdown escalation rules;
- concentration and sector limits;
- cash and liquidity rules;
- no-margin / no-leverage rules;
- conditions that prohibit additional capital;
- DCA/add-position risk requirements;
- mandatory thesis-review triggers;
- risk-related escalation status;
- and the minimum forward-return / risk hurdle framework consumed by `DECISION_FRAMEWORK.md`.

This document does **not** own:

- business-quality scoring weights;
- valuation model mechanics;
- technical indicators;
- final Buy/Hold/Sell state definitions;
- or security-ranking weights.

Those belong to their respective Milestone 1 documents.

---

# 2. Governing Risk Principles

All portfolio decisions must follow this risk hierarchy:

1. **Mandate compliance.**
2. **No leverage or forced-loss amplification.**
3. **Avoid unacceptable permanent-capital-loss risk.**
4. **Prevent uncontrolled single-name and sector concentration.**
5. **Maintain sufficient liquidity and optionality.**
6. **Protect the portfolio from thesis-error compounding.**
7. **Only then optimize long-term expected return.**

The 15%–20% long-term return target must never justify violating a higher-priority risk rule.

Risk management must distinguish between:

- **price volatility**;
- **temporary mark-to-market drawdown**;
- **fundamental deterioration**;
- **thesis invalidation**;
- **liquidity stress**;
- **portfolio concentration risk**;
- and **permanent capital impairment**.

Price decline alone is not proof of increased risk, and price appreciation alone is not proof of reduced risk.

---

# 3. Risk Authority and Precedence

## 3.1 Risk Policy authority

`RISK_POLICY.md` is the single source of truth for:

- hard risk vetoes;
- hard portfolio limits;
- minimum forward-return / risk hurdle;
- risk escalation;
- no-add conditions;
- and mandatory risk reviews.

`DECISION_FRAMEWORK.md` must enforce these rules.

`SCORING_MODEL.md` may reflect these rules in scoring but must not override or redefine them.

## 3.2 Precedence

When multiple rules conflict, precedence is:

1. Mandate / legal / operational prohibition
2. Hard Risk Policy veto
3. Hard portfolio limit
4. Mandatory thesis review / PENDING or ESCALATED status
5. Portfolio resilience requirement
6. Valuation / expected return
7. Market, money flow, and technical execution considerations

A lower-precedence factor cannot override a higher-precedence prohibition.

---

# 4. No Margin, No Leverage, No Forced Financing Risk

## 4.1 Absolute prohibition

The portfolio must not use:

- margin loans;
- securities-backed borrowing;
- leveraged derivatives;
- short positions;
- borrowing to fund stock purchases;
- or any financing structure whose loss can exceed invested cash or create forced liquidation risk.

This is a **hard rule**.

## 4.2 Effective leverage

The system must also avoid synthetic or indirect leverage.

Any instrument, structure, or transaction that materially amplifies equity exposure beyond cash capital must be treated as leverage and is prohibited unless the Investment Policy is formally amended.

## 4.3 Operational consequence

If available cash is insufficient for the minimum executable board lot:

> **Do not borrow. Accumulate cash and wait.**

No opportunity, including STRONG BUY, overrides this rule.

---

# 5. Drawdown Policy

## 5.1 Objective

The portfolio-level drawdown objective is to keep peak-to-trough drawdown **around or below 20% under normal adverse market conditions**, as stated in `INVESTMENT_POLICY.md`.

This is a **soft risk tolerance and escalation threshold**, not a guaranteed maximum loss and not an automatic stop-loss rule.

The system must never sell a fundamentally sound security solely because portfolio drawdown crosses a numerical threshold.

## 5.2 Drawdown measurement

Portfolio drawdown must be measured on a **cash-flow-adjusted basis** so that monthly DCA contributions or withdrawals do not artificially create or erase drawdown.

The preferred implementation is a time-weighted or unitized NAV method.

Conceptually:

> Adjusted Drawdown = (Current Flow-Adjusted NAV Index − Prior High-Water-Mark Flow-Adjusted NAV Index) / Prior High-Water-Mark Flow-Adjusted NAV Index

External cash flows must be excluded from investment performance when resetting or comparing the high-water mark.

Use total portfolio economic value including:

- market value of securities;
- cash;
- receivables where relevant;
- and dividends received;

while treating external contributions and withdrawals as capital flows rather than investment gains/losses.

Until Milestone 2 implements the formal NAV model, every drawdown calculation must explicitly state:

- calculation date;
- external cash contributions since the prior high-water mark;
- withdrawals, if any;
- whether the figure is fully flow-adjusted or provisional.

A raw NAV high-water mark that ignores external DCA flows must not be used for official risk classification.

## 5.3 Drawdown escalation ladder

### NORMAL — `DD > -10%`

Normal portfolio-management rules apply.

Actions:
- continue normal underwriting;
- deploy new capital only when opportunities satisfy all rules;
- maintain normal cash discipline;
- no special de-risking solely because of market movement.

### WATCH — `-15% < DD ≤ -10%`

Required actions:
1. identify whether drawdown is market-wide, sector-driven, concentration-driven, or thesis-specific;
2. review top contributors to drawdown;
3. re-check concentration and liquidity;
4. prohibit automatic averaging down;
5. require fresh underwriting before any add to a losing position.

New capital remains allowed when normal risk and valuation standards are met.

### ELEVATED — `-20% < DD ≤ -15%`

Required actions:
1. portfolio-level risk review;
2. mandatory review of all positions contributing materially to drawdown;
3. re-check sector and single-name concentration;
4. increase scrutiny of balance-sheet risk and correlated exposures;
5. new capital deployment must be selective and supported by explicit forward-return and downside analysis;
6. avoid increasing positions whose risk contribution is already high;
7. preserve additional cash when opportunity quality is uncertain.

No forced selling is required solely because this band is reached.

### CRITICAL — `-25% < DD ≤ -20%`

Crossing -20% is a **mandatory CIO/Risk escalation trigger**.

Required actions:
1. classify the source of drawdown;
2. review every material holding and every concentrated exposure;
3. identify thesis failures, balance-sheet risk, sector clustering, liquidity risk, and hidden correlation;
4. freeze discretionary risk-increasing trades until the review is completed;
5. prohibit adding to any position with PENDING or ESCALATED thesis/risk status;
6. allow new capital only after explicit CIO/Risk review confirms that the purchase reduces or does not materially worsen portfolio risk and that Stage 0 remains PASS;
7. establish a recovery / de-risking plan where required.

A CRITICAL drawdown does **not** automatically require broad portfolio liquidation.

### SEVERE — `DD ≤ -25%`

This level requires an emergency portfolio review and **CIO/Risk authorization for any new risk**, but it does not impose a blanket prohibition on all new positions.

Until the review is completed:

- no new position may be initiated **without explicit CIO/Risk approval**;
- no existing position may be increased without explicit approval;
- approval may be granted for a documented market dislocation when Stage 0 = PASS, balance-sheet risk is acceptable, the trade does not materially worsen concentration, and expected forward return is compelling;
- LOW-confidence, PENDING, ESCALATED, weak-balance-sheet, or concentration-increasing trades remain prohibited;
- all REDUCE / SELL candidates must be prioritized for review;
- liquidity and cash needs must be revalidated;
- concentration limits must be checked immediately.

The objective is to distinguish temporary market repricing from permanent capital impairment while preserving the ability to deploy selectively into exceptional opportunities.

## 5.4 Current Drawdown Band vs Drawdown Review Status

The **Current Drawdown Band** is determined only by the current cash-flow-adjusted drawdown level.

The **Drawdown Review Status** is tracked separately as:

- **OPEN**
- **COMPLETED**
- **ESCALATED**

A recovery in NAV immediately changes the Current Drawdown Band according to the measured drawdown, even if a prior WATCH / ELEVATED / CRITICAL / SEVERE review remains OPEN.

Example:

> Current Drawdown = -8% → Current Drawdown Band = NORMAL  
> Prior CRITICAL Drawdown Review Status = OPEN

Unresolved review findings, STOP-BUY conditions, or escalation restrictions remain in force until explicitly resolved. Recovery in price does not cancel unresolved thesis or risk issues.

---

# 6. Single-Name Concentration Risk

## 6.1 Strategic concentration bands

Position size is measured as percentage of total portfolio NAV using current market value.

The following **strategic** limits apply when portfolio NAV is sufficiently large for normal board-lot sizing:

- **0%–10% NAV:** normal range;
- **>10%–15% NAV:** elevated concentration; requires explicit justification;
- **>15% NAV:** no additional capital under normal conditions;
- **20% NAV:** strategic single-name ceiling under normal conditions.

No purchase should intentionally take a position above **20% of NAV** unless an approved Small-NAV Operational Exception under §6.3 applies.

## 6.2 Passive breach due to price appreciation

A position may exceed a soft limit because its market price rises.

Price appreciation alone does not force a sale.

If a position exceeds:

- **15% NAV:** mandatory concentration review;
- **20% NAV:** no additional capital and mandatory CIO/Risk review;
- **25% NAV:** normally requires a REDUCE plan **unless the exposure is covered by an approved Small-NAV Operational Exception or another explicitly approved temporary exception**.

For a newly approved Small-NAV Operational Exception that intentionally starts above 20% NAV, the pre-trade CIO/Risk review and explicit user approval satisfy the **initial** >20% mandatory-review requirement. The position remains subject to periodic concentration review, no-add rules, exception expiry, and normalization requirements thereafter.

An approved Small-NAV Operational Exception above 25% does not by itself require an immediate REDUCE plan. Instead it requires:
- no further add;
- active normalization through future cash inflows / NAV growth;
- periodic concentration review;
- and REDUCE review if the normalization plan fails, risk deteriorates, or the exception expires.

The review must consider:

- business quality;
- thesis confidence;
- downside scenario;
- liquidity;
- sector exposure;
- correlation with other holdings;
- tax / transaction costs;
- expected forward return;
- and opportunity cost.

## 6.3 Small-NAV / board-lot operational framework

Because VN30 transactions may require a minimum board lot of approximately 100 shares, a small portfolio may be unable to comply mechanically with the strategic 20% cap for certain otherwise eligible securities.

A temporary **Small-NAV Operational Exception** may be considered only when all of the following are true:

1. the security otherwise qualifies for positive capital allocation;
2. no margin or borrowing is used;
3. the resulting position remains below an **emergency ceiling of 30% NAV**;
4. before approval, the case is classified **Review Status = ESCALATED — LOT-SIZE CONSTRAINT**, and no capital may be deployed;
5. after explicit user approval, Review Status returns to **FINAL** and a separate field must record **Risk Exception Status = APPROVED — SMALL_NAV_LOT_SIZE**;
6. no further capital is added while the position remains above the normal 15% no-add threshold;
7. the decision record includes a dilution-by-future-cash plan showing how future DCA inflows or portfolio growth are expected to reduce concentration;
8. the trade does not create unacceptable sector or hidden-factor concentration;
9. explicit user approval is obtained after CIO/Risk recommendation;
10. cash accumulation is preferred when the exception would create an unattractive risk profile.

The **30% Small-NAV emergency ceiling is absolute under the current policy**. It is an operational backstop, not a target allocation, and it may not be exceeded through an ordinary Risk Policy exception.

An approved Small-NAV exception must include an expiry or normalization trigger. If the exception expires or its conditions cease to hold, the position must be re-reviewed.

Once portfolio NAV is large enough for normal board-lot sizing, the strategic 20% cap applies without this exception.

---

# 7. Sector Concentration Risk

## 7.1 Sector measurement

Sector exposure is measured using the official sector classification adopted by the VN30 Master / portfolio data model.

The same classification must be used consistently across holdings and review periods.

## 7.2 Default sector limits

Until VN30 sector weights and historical concentration are formally calibrated, sector thresholds are **provisional strategic limits** rather than immutable constitutional caps.

Default framework:

- **0%–25% NAV:** normal;
- **>25%–30% NAV:** elevated; requires explicit justification;
- **>30%–35% NAV:** high concentration; normally no additional capital;
- **>35%–40% NAV:** mandatory CIO/Risk review; new capital requires explicit approval and hidden-factor analysis;
- **40% NAV:** provisional sector ceiling under normal conditions.

Exposure above 35% is therefore a mandatory-review zone, not an automatic forced-reduction trigger.

The 40% provisional sector ceiling may be recalibrated after the VN30 Master and sector-weight analysis are completed, provided the change is formally documented and remains consistent with the Investment Policy.

## 7.3 Sector-ceiling exceptions

Because VN30 membership can be structurally concentrated in certain sectors, an exception above the provisional sector ceiling may be considered only when:

- the mandate universe itself is heavily concentrated;
- underlying businesses have materially different risk drivers;
- portfolio correlation remains acceptable;
- hidden-factor concentration remains acceptable;
- and CIO/Risk recommends the exception for explicit user approval.

The system may not self-approve a sector-concentration exception.

Before approval:

> Review Status = ESCALATED and no new sector capital may be deployed under the requested exception.

After explicit user approval:

> Review Status = FINAL  
> Risk Exception Status = APPROVED — SECTOR_CONCENTRATION

The exception must include:

- rationale;
- current exposure;
- **maximum approved temporary exposure** (the exception is never open-ended);
- expiry/review trigger;
- hidden-factor analysis;
- and de-concentration / normalization plan.

## 7.4 Hidden concentration

Sector labels alone are insufficient.

The risk review must also identify cross-sector exposures to the same underlying drivers, including:

- property / real-estate cycle;
- credit cycle;
- interest rates;
- commodity prices;
- consumer demand;
- government policy;
- FX;
- foreign capital flows;
- and refinancing conditions.

Two companies in different sectors may still represent the same economic risk.

---

# 8. Cash Reserve and Liquidity Policy

## 8.1 Cash is strategic optionality

Cash is an active portfolio allocation and may accumulate across multiple DCA cycles.

The portfolio is not required to deploy monthly contributions.

Cash accumulation should arise primarily from:

- insufficiently attractive eligible opportunities;
- portfolio concentration limits;
- drawdown / escalation constraints;
- board-lot constraints;
- liquidity needs;
- or risk uncertainty.

Cash must not be accumulated primarily because of speculative short-term market timing.

## 8.2 Operating liquidity guideline

The portfolio should normally aim for approximately:

> **5% of portfolio NAV in cash or immediately available settlement liquidity**

as an **operating liquidity guideline**, not a minimum allocation requirement.

Cash may fall below 5% when:

- settlement and near-term liquidity needs are fully covered;
- no drawdown, concentration, or risk-escalation rule requires additional liquidity;
- and a sufficiently attractive opportunity justifies deployment.

The system must not sell a security or reject an otherwise valid opportunity solely to restore cash to 5%.

## 8.3 Elevated-risk cash preference

During:

- ELEVATED drawdown;
- CRITICAL drawdown;
- high concentration;
- major unresolved thesis risk;
- or unusually weak opportunity quality;

the system should prefer a higher cash allocation until risk is resolved.

No fixed maximum cash allocation exists.

Holding 20%, 30%, or more in cash is acceptable when no eligible opportunity satisfies the required risk/return standards.

## 8.4 Cash is not a performance failure

Uninvested cash must not be treated as a problem merely because it creates benchmark underperformance during rising markets.

The system must not force deployment to reduce cash drag.

---

# 9. DCA and Add-Position Risk Policy

## 9.1 DCA is optional

Monthly DCA capital is an inflow of deployable cash, not an obligation to buy.

The system may:

- deploy immediately;
- deploy partially;
- or retain all of it as cash.

## 9.2 Price decline is not a buy signal

A falling share price, lower unrealized P/L, or lower portfolio cost basis must never independently justify additional capital.

The following reasoning is prohibited:

> "The stock fell, therefore average down."

or:

> "Buy more to reduce cost basis and sell when P/L returns to zero."

## 9.3 Mandatory requirements before adding to a declining position

Every add to a position whose market price has declined materially from the last purchase must satisfy all of the following:

1. **Stage 0 = PASS.**
2. **Review Status = FINAL.**
3. Investment thesis remains valid.
4. Business quality has not deteriorated below the required standard.
5. Financial Health remains acceptable.
6. No hard Risk Policy veto exists.
7. No mandatory thesis-review trigger remains unresolved.
8. Valuation is more attractive on updated fundamentals, not merely because price is lower.
9. Expected forward return meets the applicable Risk Policy hurdle.
10. Residual risk is acceptable.
11. Portfolio Impact permits additional capital.
12. Single-name and sector limits permit additional capital.
13. Confidence is at least MEDIUM.
14. The add passes fresh underwriting under `DECISION_FRAMEWORK.md`.
15. The analyst explicitly states what changed since the previous purchase.

If any requirement fails:

> **DO NOT ADD.**

## 9.4 Deterioration rule

If price falls while intrinsic value falls by an equal or greater amount, the security has **not necessarily become cheaper**.

Examples requiring caution:

- lower earnings power;
- higher debt;
- weaker governance;
- dilution;
- worsening competitive position;
- lower normalized ROIC/ROE;
- structurally weaker industry economics;
- higher required return;
- increased probability of permanent loss.

The system must reassess intrinsic value before declaring improved margin of safety.

## 9.5 Add-frequency discipline

Repeated purchases must not become automatic averaging-down loops.

After each meaningful add:

- the next add requires a fresh decision record;
- portfolio concentration must be recalculated;
- thesis invalidation conditions must be rechecked;
- and the analyst must verify that incremental expected return remains attractive.

---

# 10. Conditions That Prohibit Additional Capital

New capital must not be allocated to a security when any of the following applies:

1. Security is not a current VN30 constituent, except no-add Legacy Holding rules already prohibit purchases.
2. Composite Stage 0 Outcome is not PASS for ACCUMULATE.
3. Composite Stage 0 Outcome is FAIL, PENDING, or otherwise unresolved.
4. Review Status is PENDING or ESCALATED.
5. A hard Risk Policy veto is active.
6. Business Quality is below minimum investability standard.
7. Financial Health is unacceptable.
8. Governance or reporting reliability is materially unresolved.
9. Thesis has been invalidated.
10. Required current data is materially stale or contradictory.
11. Single-name concentration rule prohibits additional capital.
12. Sector concentration rule prohibits additional capital.
13. Portfolio Impact = NEGATIVE — DO NOT ADD.
14. Portfolio Impact = REQUIRES REDUCTION.
15. CRITICAL or SEVERE drawdown applies and the trade has **not** satisfied the explicit CIO/Risk authorization requirements defined in §5.3.
16. Liquidity is insufficient to execute responsibly.
17. The purchase would require margin or borrowing.
18. Confidence is LOW.
19. Valuation does not meet the required forward-return / risk hurdle.
20. The rationale is primarily loss aversion, FOMO, anchoring, cost-basis repair, or price decline alone.

When a no-add condition applies, underlying fundamental attractiveness may still be recorded, but the actionable portfolio decision must obey the prohibition.

---

# 11. Hard Risk Vetoes

A hard veto overrides score, valuation, technical setup, money flow, historical gain/loss, and analyst conviction.

## 11.1 Mandate veto

Hard veto for new capital when:

- security is not a current VN30 constituent;
- transaction would violate the no-margin rule;
- transaction would intentionally violate an applicable portfolio concentration ceiling or absolute emergency ceiling contrary to the exception rules in this policy.

## 11.2 Governance / integrity veto

Hard veto when credible evidence indicates that financial information, management integrity, or shareholder treatment is too unreliable to support a defensible valuation or ownership thesis.

Examples include:

- material financial-reporting unreliability;
- credible fraud or manipulation concern;
- severe undisclosed related-party risk;
- repeated material disclosure failures;
- management conduct that makes shareholder value materially untrustworthy.

A rumor alone is insufficient; evidence quality must be assessed.

When evidence is serious but unresolved:

> **PENDING — RISK POLICY REVIEW / Review Status = ESCALATED**

until resolved.

## 11.3 Financial survivability veto

Hard veto for new capital when there is a material, non-speculative risk that the company cannot meet obligations or sustain operations without:

- emergency refinancing;
- highly dilutive capital raising;
- distressed asset sales;
- or another action likely to cause severe permanent shareholder impairment.

Sector-specific definitions will be calibrated in later implementation documents.

## 11.4 Unquantifiable thesis veto

Hard veto for positive allocation when:

- the business economics cannot be understood sufficiently;
- critical disclosures are unavailable or unreliable;
- or intrinsic value cannot be estimated within a defensible range because the information base is structurally inadequate.

This is not the same as ordinary valuation uncertainty.

## 11.5 Veto response

### 11.5.1 Veto type

Every hard veto must be classified as one of:

- **CAPITAL-ALLOCATION VETO** — prohibits new capital but does not by itself require disposal of an existing holding;
- **OWNERSHIP VETO** — continued ownership is inconsistent with the Risk Policy and requires a SELL decision.

Examples:
- non-VN30 status for an existing Legacy Holding is a capital-allocation veto, not automatically an ownership veto;
- confirmed governance/integrity or financial-survivability failure will normally be an ownership veto.

### 11.5.2 Action mapping

For an unowned security subject to any hard veto:

> **AVOID**

For an owned security with a **confirmed OWNERSHIP VETO**:

> **SELL**

If liquidity, market impact, settlement, or other execution considerations require an orderly exit, the Decision State remains **SELL** and the execution plan may be STAGED or otherwise orderly. Execution staging does **not** convert SELL into REDUCE.

For an owned security with a **CAPITAL-ALLOCATION VETO** only:

- no additional capital;
- continued ownership may remain HOLD / REDUCE / SELL depending on the underlying thesis and other policy rules.

For a serious but unresolved possible veto:

- Review Status = PENDING or ESCALATED;
- no new capital;
- temporary action may be Provisional HOLD or REDUCE depending on known risk.

For deterioration that is serious but does **not** constitute a confirmed hard ownership veto, apply normal residual-thesis logic:

- smaller position still defensible → REDUCE;
- zero position preferable → SELL.

Hard veto findings must remain explicitly recorded even if another Composite Stage 0 Outcome controls workflow precedence.

---

# 12. Mandatory Thesis-Review Triggers

A thesis review is mandatory when any of the following occurs.

## 12.1 Business triggers

- material change in business model;
- major acquisition or disposal;
- loss of a key franchise, license, customer, supplier, distribution channel, or competitive advantage;
- significant deterioration in unit economics;
- persistent loss of market position;
- major management or controlling-shareholder change;
- material governance controversy.

## 12.2 Financial triggers

- debt or leverage rises materially beyond thesis assumptions;
- liquidity deteriorates materially;
- recurring cash-flow conversion weakens;
- dividend is cut or suspended for reasons indicating financial stress;
- large unexpected equity issuance or dilution;
- covenant, refinancing, or solvency concern;
- material auditor qualification or accounting restatement;
- earnings quality deteriorates materially.

## 12.3 Growth / industry triggers

- long-term growth assumptions materially weaken;
- industry structure changes adversely;
- regulation materially changes economics;
- technological disruption changes competitive position;
- commodity / rate / credit-cycle exposure moves beyond original thesis assumptions.

## 12.4 Valuation triggers

Mandatory valuation review when:

- share price appreciates materially enough to reduce expected forward return;
- intrinsic-value assumptions change materially;
- normalized earnings power changes;
- discount rate / required return changes materially;
- or market price moves outside the prior valuation range.

A gain of **20% or more from purchase cost** is a mandatory review trigger under the Investment Policy, but **not an automatic sell trigger**.

## 12.5 Price-decline triggers

A price decline of:

- **15% or more from the most recent meaningful purchase**, or
- **20% or more from the last formal thesis review price**

requires a fresh thesis review before any additional purchase.

The review must determine whether:

- price declined while intrinsic value stayed stable;
- intrinsic value declined;
- risk increased;
- or the market move is primarily non-fundamental.

No-add remains in force until the review is complete.

The standardized definition of **meaningful purchase** is owned by the Portfolio Data Model / transaction workflow in Milestone 2. Until that definition is implemented, use the latest material tranche explicitly identified in the formal decision record; do not redefine “meaningful” ad hoc during a review.

## 12.6 Portfolio-risk triggers

Mandatory review when:

- single-name exposure exceeds 15% NAV;
- sector exposure exceeds 30% NAV;
- portfolio drawdown enters ELEVATED, CRITICAL, or SEVERE;
- position liquidity deteriorates materially;
- correlation / hidden factor exposure becomes concentrated;
- or a holding becomes a Legacy Holding.

## 12.7 Data / evidence triggers

Mandatory review when:

- a new audited or interim financial report becomes available and materially affects assumptions;
- prior analysis is based on stale data;
- material new official disclosure contradicts the thesis;
- important estimates can no longer be verified;
- or prior Fact / Estimate / Assumption classification changes materially.

---

# 13. Thesis Review Outcomes

Every mandatory thesis review must end with:

1. updated thesis status:
   - VALID;
   - VALID WITH CONDITIONS;
   - WEAKENED;
   - INVALIDATED;
   - PENDING;
2. updated intrinsic-value range;
3. updated expected forward-return estimate;
4. updated downside case;
5. updated risk classification;
6. updated confidence;
7. updated portfolio impact;
8. one Decision State under `DECISION_FRAMEWORK.md`;
9. explicit add / no-add status;
10. next review trigger.

## 13.1 Thesis VALID

May support:

- STRONG BUY;
- BUY;
- ACCUMULATE;
- HOLD;

subject to all other rules.

## 13.2 VALID WITH CONDITIONS

No STRONG BUY.

New capital is allowed only when:

- the Composite Stage 0 Outcome permits it;
- the condition is not a possible veto;
- and the specific Decision Framework state permits allocation.

## 13.3 WEAKENED

Default:

- no automatic add;
- re-underwrite;
- consider HOLD / REDUCE;
- additional capital only after the weakness is resolved and Stage 0 returns to the required state.

## 13.4 INVALIDATED

No additional capital.

Normally:

- REDUCE if a defensible residual ownership case remains temporarily;
- SELL if zero position is preferable or policy requires exit.

## 13.5 PENDING

No additional capital.

Owned positions may use Provisional HOLD, REDUCE, or SELL depending on known risk.

---

# 14. Minimum Forward-Return / Risk Hurdle

## 14.1 Purpose

A stock must not receive capital merely because its accounting multiple looks cheap.

Capital allocation requires expected forward return sufficient to compensate for:

- business quality;
- financial risk;
- cyclicality;
- forecast uncertainty;
- governance risk;
- valuation uncertainty;
- liquidity;
- concentration;
- and opportunity cost.

## 14.2 Base hurdle framework

Until sector-specific calibration is completed, the following constitutional default applies:

- **12% expected 5-year annualized total return is an exceptional absolute floor, not the normal BUY hurdle.**
- **The normal BUY hurdle is 15% expected 5-year annualized total return or higher.**
- A BUY below 15% and at or above 12% is permitted only as an explicitly justified exception for a **very high-quality, low-risk, high-confidence** business where downside protection and portfolio-resilience benefits are unusually strong.

Every BUY approved below the normal 15% hurdle must record:

> **Hurdle Exception = YES**

and document:

- Business Quality;
- Residual Risk;
- Confidence;
- downside protection;
- portfolio-resilience benefit;
- reason the expected return below 15% is still acceptable.

These hurdle exceptions must be visible in portfolio risk reviews to prevent exception creep. They are **not Risk Policy overrides** and therefore do not require user exception approval when all requirements of §14.2 are satisfied; however, they must remain explicitly auditable and cannot be used to bypass any hard risk rule.
- **STRONG BUY normally requires expected return materially above the normal BUY hurdle, high confidence, residual risk LOW/MODERATE, and exceptional risk/reward.**
- **Lower-quality / higher-risk cases require a higher hurdle, not a lower one.**

The system must not use the 12% floor as an anchor to approve ordinary BUY candidates.

These are expected returns, not guaranteed returns.

## 14.3 Quality/risk adjustment principle

Required return must increase when:

- Business Quality is only ACCEPTABLE;
- Financial Health is merely ADEQUATE;
- residual risk is ELEVATED;
- cyclicality is high;
- valuation uncertainty is high;
- governance confidence is lower;
- liquidity is weaker;
- or concentration impact is higher.

Exact risk premiums and sector-specific hurdle adjustments belong to later calibration / scoring implementation, but must remain consistent with this policy.

## 14.4 HOLD hurdle

An existing holding does not need to meet the same hurdle as a fresh purchase because selling and switching incur:

- uncertainty;
- transaction cost;
- tax where applicable;
- opportunity loss;
- and risk of interrupting long-term compounding.

However, an existing holding must still offer an acceptable positive forward return relative to risk and alternatives.

## 14.5 Switching hurdle

Switching existing capital requires a **material advantage**, not a marginally higher forecast return.

A replacement opportunity must compensate for:

- valuation uncertainty;
- thesis uncertainty;
- transaction costs;
- taxes;
- liquidity;
- execution risk;
- and lost future compounding from the current holding.

The Decision Framework consumes this principle when deciding HOLD / REDUCE / SELL.

---

# 15. Stop-Buy and Freeze Rules

## 15.1 Security-level stop-buy

A security enters **STOP-BUY** immediately when:

- Stage 0 is not PASS for an owned add candidate;
- Review Status becomes PENDING or ESCALATED;
- thesis review is mandatory but incomplete;
- a hard veto is suspected or triggered;
- concentration rule blocks additional capital;
- data is materially stale or contradictory;
- financial survivability is uncertain;
- or any no-add condition in §10 applies.

STOP-BUY remains in effect until the relevant issue is resolved and a fresh Decision Framework review authorizes capital.

## 15.2 Sector-level stop-buy

A sector enters **SECTOR STOP-BUY** when:

- exposure reaches or exceeds the current provisional sector ceiling of **40% NAV**; or
- CIO/Risk determines that hidden correlated exposure makes further sector capital unacceptable.

Exposure above **35% NAV** triggers mandatory CIO/Risk review but does not automatically create SECTOR STOP-BUY unless the review determines that further capital is unacceptable.

No additional sector capital may be deployed while SECTOR STOP-BUY is active until exposure falls below the approved limit or a formal exception is approved.

## 15.3 Portfolio-level risk freeze

A temporary **PORTFOLIO RISK FREEZE** applies during:

- CRITICAL drawdown pending portfolio review;
- SEVERE drawdown;
- unresolved leverage / settlement breach;
- material portfolio data-integrity failure;
- or another condition explicitly escalated by CIO/Risk.

During a freeze, only:

- risk-reducing transactions;
- mandatory exits;
- or explicitly approved exceptional transactions

may proceed.

---

# 16. Liquidity and Execution Risk

## 16.1 General rule

The portfolio must remain capable of adjusting positions without creating unnecessary forced-sale risk.

Liquidity review must consider:

- average trading liquidity;
- realistic order size;
- board-lot constraints;
- abnormal spreads;
- price gaps;
- suspension risk;
- and settlement requirements.

## 16.2 Execution must not create leverage

Settlement cash must be available before committing to a purchase.

The system must not assume future DCA inflows to cover an already committed purchase.

## 16.3 Liquidity and sizing

If a desired position cannot be built or reduced responsibly:

- reduce the intended size;
- stage execution;
- accumulate cash;
- or defer the trade.

Do not solve liquidity constraints with leverage.

---

# 17. Legacy Holding Risk Rules

A security removed from VN30 becomes a Legacy Holding.

Rules:

1. no additional capital;
2. mandatory thesis and exit review;
3. Review Status cannot be treated as ordinary long-term accumulation;
4. exit plan must be documented;
5. concentration and liquidity continue to be monitored;
6. the holding must not remain indefinitely without escalation.

If a Legacy Holding remains in the portfolio beyond the initial orderly-exit period established during implementation:

1. **Review Status = ESCALATED**;
2. no additional capital remains permitted;
3. CIO/Risk must issue a recommendation on whether continued temporary ownership is justified;
4. continued ownership beyond the normal exit horizon requires **explicit user approval**;
5. after approval:
   - Review Status = FINAL;
   - Risk Exception Status = APPROVED — LEGACY_HOLDING_EXTENSION;
   - a new expiry / next review trigger must be documented.

If user approval is not granted, the existing exit plan remains active.

The implementation workflow must define the review frequency and maximum normal exit horizon.

---

# 18. Behavioral Risk Controls

Before any material purchase, add, reduce, or sell, the decision record must check for:

- FOMO;
- loss aversion;
- anchoring to purchase price;
- anchoring to previous intrinsic value;
- averaging-down bias;
- disposition effect / premature profit-taking;
- recency bias;
- confirmation bias;
- sunk-cost thinking;
- benchmark-chasing;
- and market-timing narratives.

A trade justified primarily by behavioral bias must not proceed until re-underwritten.

Examples of prohibited logic:

- "I am down 25%, so I must buy more."
- "I need to get back to breakeven."
- "I am up 20%, so I should take profit."
- "The index is rising, so cash must be deployed."
- "Foreign investors are buying, so the thesis is confirmed."

---

# 19. Risk Exceptions

## 19.1 General rule

Hard Risk Policy rules may not be overridden informally.

The system may **recommend** a Risk Policy exception but may not self-approve one.

Any exception that overrides a hard limit, provisional ceiling, STOP-BUY, or another policy restriction requires:

- CIO/Risk recommendation;
- **explicit user approval**;
- rule being excepted;
- rationale;
- expected benefit;
- incremental risk;
- approving authority;
- maximum size / exposure;
- date;
- expiry or review trigger;
- and exit / normalization plan.

Before user approval:

> **Review Status = ESCALATED** and no new capital may be deployed under the requested exception.

After user approval:

> **Review Status = FINAL** and the approved exception must be recorded in **Risk Exception Status** with its expiry/review trigger.

## 19.2 Non-waivable rules

The following are non-waivable under the current mandate:

- no margin / no borrowing for stock purchases;
- no intentional purchase of a non-VN30 security;
- no capital allocation while a confirmed hard governance/integrity veto is active;
- no trade knowingly based on falsified or materially unreliable information.

Changing these requires amendment of the governing Investment Policy, not a one-off exception.

---

# 20. Required Portfolio Risk Review

A formal portfolio risk review must include:

1. Portfolio NAV and cash
2. Current cash-flow-adjusted drawdown and **Current Drawdown Band**
3. **Drawdown Review Status** and unresolved drawdown-review actions
4. Position concentration
5. Sector concentration
6. Hidden factor concentration
7. Liquidity profile
8. Legacy Holdings
9. STOP-BUY securities
10. PENDING / ESCALATED security reviews
11. Hard-veto findings
12. Largest downside contributors
13. Thesis-review triggers
14. Cash deployment capacity
15. Margin / leverage compliance
16. Risk exceptions and expiries
17. **Hurdle Exceptions for BUY below 15%**, including rationale and current outcome
18. Recommended risk actions

---

# 21. Risk Decision Record

Every security-level risk review must record:

- Ticker
- Ownership status
- VN30 eligibility
- Composite Stage 0 Outcome
- Hard-Veto Finding / Veto Review Status
- Thesis status
- Review Status: FINAL / PENDING / ESCALATED
- Current position size (% NAV)
- Sector exposure (% NAV)
- Current Drawdown Band
- Drawdown Review Status: OPEN / COMPLETED / ESCALATED
- Financial Health risk
- Governance / reporting risk
- Liquidity risk
- Residual risk classification
- Required forward-return hurdle
- Estimated forward return
- STOP-BUY status
- Add-capital permission: YES / NO
- Mandatory review trigger
- Risk Exception Status, if any
- Hurdle Exception: YES / NO
- Hurdle Exception rationale, if YES
- Recommended risk action
- Next review trigger

---

# 22. Key Risk Rules Summary

1. **No margin or borrowing.** If cash is insufficient, wait.
2. **20% drawdown is an escalation threshold, not an automatic stop-loss.**
3. **At -20% portfolio drawdown, CIO/Risk review is mandatory.**
4. **At -25% or worse, emergency review is mandatory and any new risk requires explicit CIO/Risk approval; exceptional dislocation purchases remain possible if all risk conditions are satisfied.**
5. **Normal single-name range is up to 10% NAV; above 15% no-add normally applies; 20% is the strategic single-name ceiling under normal conditions, while an explicitly user-approved Small-NAV exception may temporarily permit up to the absolute 30% emergency ceiling.**
6. **Normal sector range is up to 25% NAV; above 30% concentration is high; above 35% requires mandatory review; 40% is the provisional sector ceiling unless an explicitly user-approved exception exists.**
7. **Price appreciation can create a passive concentration breach without forcing an immediate sale, but mandatory review applies.**
8. **Cash is strategic optionality, not idle failure.**
9. **Approximately 5% cash is an operating liquidity guideline, not a minimum allocation requirement; higher or lower cash may be appropriate when liquidity and risk conditions permit.**
10. **Monthly DCA is optional; cash may accumulate across months.**
11. **Price decline alone never justifies averaging down.**
12. **Every add to a declining position requires fresh underwriting and Stage 0 PASS.**
13. **PENDING, ESCALATED, LOW confidence, hard veto, failed investability, or binding portfolio limits mean NO ADD.**
14. **A 15% decline from the latest meaningful purchase or 20% decline from the last formal review price triggers mandatory thesis review before any add.**
15. **A 20% gain is a valuation/thesis review trigger, not a take-profit rule.**
16. **Risk Policy owns hard vetoes and minimum forward-return / risk hurdles.**
17. **12% expected 5-year annualized total return is only an exceptional absolute floor; the normal BUY hurdle is 15%+ and lower-quality/higher-risk cases require higher hurdles.**
18. **Hard governance/integrity and financial-survivability risks cannot be rescued by a low valuation.**
19. **STOP-BUY remains in force until the issue is resolved and fresh underwriting authorizes capital.**
20. **Legacy Holdings receive no new capital and require an orderly exit plan.**
21. **REDUCE means a smaller position remains defensible; SELL means zero position is preferable or policy requires full exit.**
22. **Risk exceptions must be explicit, time-bounded, and require explicit user approval after CIO/Risk recommendation; the system may not self-approve exceptions.**
23. **Behavioral motives such as FOMO, breakeven anchoring, averaging-down bias, and premature profit-taking cannot justify trades.**
24. **Current Drawdown Band and Drawdown Review Status are separate fields; price recovery does not close unresolved risk actions.**
25. **Every BUY below the normal 15% hurdle must be explicitly flagged and audited to prevent exception creep.**
26. **Risk management protects long-term compounding; it does not mechanically eliminate ordinary equity volatility.**

---

# 23. Approval Gate

Before approval, CIO and Risk Manager should confirm:

1. Do drawdown thresholds create review and authorization without mechanical broad selling?
2. Is the Small-NAV Operational Exception, including the absolute 30% emergency ceiling and explicit user approval, appropriate for the current board-lot constraint?
3. Is the 20% strategic single-name ceiling under normal conditions appropriate?
4. Is the >35% mandatory-review zone and 40% provisional sector ceiling appropriate pending VN30 sector calibration?
5. Is the approximately 5% operating liquidity guideline appropriately non-binding?
6. Are STOP-BUY conditions deterministic and consistent with authorized CRITICAL/SEVERE drawdown deployment?
7. Are DCA/add rules strict enough to prevent behavioral averaging down?
8. Are capital-allocation vetoes and ownership vetoes distinguished clearly enough?
9. Is the 12% exceptional floor / 15% normal BUY hurdle consistent with the 15%–20% long-term portfolio objective?
10. Are deterministic drawdown bands and cash-flow-adjusted measurement suitable for the Milestone 2 NAV model?
11. Are Legacy Holding extension rules consistent with explicit user-controlled exception governance?
12. Are all Risk Policy exceptions auditable, time-bounded, and incapable of AI self-approval?
13. Are BUY hurdle exceptions below 15% sufficiently visible to prevent the 12% exceptional floor from becoming the de facto normal hurdle?
14. Are Current Drawdown Band and Drawdown Review Status represented as separate fields in the future Portfolio Data Model?

**Current status:** Approved Constitution Baseline.

This document is the approved constitutional baseline for portfolio risk governance.
