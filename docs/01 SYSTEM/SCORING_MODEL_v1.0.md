# VN30 Value Investing OS — Scoring Model

**Document:** SCORING_MODEL.md  
**Milestone:** 1 — Investment Constitution  
**Status:** Approved Constitution Baseline  
**Version:** 1.0  
**Date:** 2026-09-04  
**Governing Documents:**  
- `INVESTMENT_POLICY.md` v1.1  
- `DECISION_FRAMEWORK.md` v1.0  
- `RISK_POLICY.md` v1.0

---

# 1. Purpose

This document defines the 100-point scoring model used by the VN30 Value Investing OS to compare eligible VN30 securities consistently across industries.

The score is a **decision-support tool**, not a mechanical Buy/Sell engine.

It must:

- reward durable business quality;
- reward financial resilience;
- reward high-quality growth;
- reward attractive valuation relative to quality and risk;
- penalize governance, cyclicality, leverage, and thesis uncertainty;
- remain comparable across sectors without forcing identical accounting metrics on structurally different industries;
- and support ranking of the VN30 universe.

The score must **never override**:

- a hard veto in `RISK_POLICY.md`;
- Stage 0 failure in `DECISION_FRAMEWORK.md`;
- binding portfolio constraints;
- ownership-state semantics;
- or a final qualitative judgment that is explicitly documented.

---

# 2. Core Design Principles

## 2.1 Score the economics, not the accounting label

The model must evaluate underlying economics using metrics appropriate to each industry.

Examples:

- Bank leverage is not compared directly with industrial debt ratios.
- Property developers are not scored on inventory in the same way as retailers.
- Technology companies are not penalized for low tangible assets when economics are asset-light.
- Retailers are not rewarded for rapid store expansion if unit economics and cash conversion deteriorate.

## 2.2 Sector-relative metrics, cross-sector absolute principles

Metrics may differ by sector, but the underlying principles remain constant:

- Can the business create value?
- Is the balance sheet resilient?
- Is growth profitable and durable?
- Is governance trustworthy?
- Is valuation attractive relative to normalized economics?
- Is downside risk acceptable?

## 2.3 Avoid false precision

A score of 82 is not meaningfully superior to 81 by itself.

Scores should be interpreted in bands, supported by qualitative reasoning.

## 2.4 Score is not a veto

A stock with 90/100 can still be:

> AVOID

if a confirmed hard veto exists.

A stock with 72/100 can still be:

> HOLD

if it is an existing high-quality holding with acceptable forward return and switching hurdle not met.

## 2.5 Forward-looking but evidence-based

The model should combine:

- historical evidence;
- current financial condition;
- normalized economics;
- forward estimates;
- and valuation.

Forward estimates must be explicitly labeled as estimates and uncertainty must be reflected in confidence and risk scoring.

---

# 3. 100-Point Architecture

The total score is:

| Category | Weight |
|---|---:|
| Business Quality | 25 |
| Financial Health | 15 |
| Growth Quality | 15 |
| Industry & Competitive Position | 10 |
| Valuation & Forward Return | 20 |
| Risk & Governance | 10 |
| Capital Allocation Quality | 5 |
| **Total** | **100** |

Market flow, technical entry, portfolio impact, and opportunity cost do **not** receive permanent fundamental score points.

They remain separate decision inputs under `DECISION_FRAMEWORK.md`.


## 3.1 Category gates

A high total score must not conceal a critical weakness in a core category.

The following category gates apply to **positive allocation candidates**:

- **Business Quality:** minimum 13/25 for any normal new-capital decision (BUY or ACCUMULATE); STRONG BUY normally requires 18/25 or higher.
- **Financial Health:** minimum 8/15 for any normal new-capital decision; STRONG BUY normally requires 11/15 or higher.
- **Risk & Governance:** minimum 5/10 for any normal new-capital decision; STRONG BUY normally requires 7/10 or higher.
- **Valuation & Forward Return:** minimum 10/20 for any normal new-capital decision, subject to the separate forward-return hurdle in `RISK_POLICY.md`.

These are **score gates**, not substitutes for Stage 0, Risk Policy, or the Decision Framework. They are minimum scoring guardrails for new capital, not a mechanical mapping to Decision States. Meeting every gate does not create a BUY/ACCUMULATE/STRONG BUY recommendation.

A security that misses a category gate may remain HOLD for an existing position if the Decision Framework supports continued ownership, but the score must not be used to justify new capital.

## 3.2 No compensating-score rule

Points in one category cannot mathematically “buy back” a failure in another category when the failed category represents:

- survivability;
- governance/integrity;
- investability;
- or a binding Risk Policy condition.

For example, 20/20 valuation cannot compensate for unacceptable Financial Health.


---

# 4. Score Interpretation Bands

| Total Score | Interpretation |
|---|---|
| **90–100** | Exceptional |
| **82–89** | Very Strong |
| **75–81** | Strong |
| **68–74** | Acceptable |
| **60–67** | Weak |
| **<60** | Poor / High Caution |

These bands do **not** directly map one-to-one to Decision States.

Score bands are intentionally wide. Differences of **1–2 total points should normally be treated as economically indistinguishable** unless supported by a material qualitative difference.

A score must always be combined with:

- Stage 0;
- valuation;
- residual risk;
- ownership status;
- Risk Policy;
- portfolio impact;
- confidence;
- and opportunity cost.

---

# 5. Business Quality — 25 Points

Business Quality measures the durability and quality of the company's underlying economics.

## 5.1 Economic quality — 8 points

Evaluate:

- normalized ROIC / ROE / ROA as sector-appropriate;
- return above cost of capital;
- persistence of returns;
- quality of margins;
- ability to generate economic profit.

Scoring guide:

| Score | Standard |
|---|---|
| 7–8 | consistently superior economics, durable returns |
| 5–6 | good economics, some cyclicality or variability |
| 3–4 | average economics |
| 1–2 | weak economics or poor return persistence |
| 0 | structurally value-destructive |

Sector notes:
- Banks: prioritize normalized ROE, NIM quality, credit-cost-adjusted returns.
- Property: prioritize project-level returns, asset quality, cash conversion, and normalized ROE rather than reported gross margin alone.
- Retail: emphasize store-level economics, same-store sales, inventory turns, ROIC.
- Technology: emphasize recurring revenue quality, incremental margins, retention, asset-light ROIC.

## 5.2 Competitive advantage / moat — 6 points

Evaluate:

- brand;
- distribution;
- switching costs;
- cost advantage;
- regulation / licenses;
- network effect;
- data advantage;
- customer stickiness;
- scale;
- market structure.

Scoring:

| Score | Standard |
|---|---|
| 6 | strong and durable moat |
| 4–5 | meaningful advantage |
| 2–3 | moderate / contestable advantage |
| 1 | weak advantage |
| 0 | commoditized / structurally disadvantaged |

## 5.3 Operating earnings quality / cash conversion — 6 points

Evaluate:

- cash flow conversion;
- accrual intensity;
- working-capital behavior;
- recurring vs non-recurring operating earnings;
- dependence on one-off gains;
- consistency between reported operating performance and cash realization.

**Do not score governance, management integrity, or disclosure trustworthiness here.** Those belong to §10 Risk & Governance and Stage 0. This prevents double-counting.

Sector notes:
- Banks: use asset quality, provisioning quality, NPL recognition, fee quality.
- Property: use cash collection, presales conversion, project handover cash realization.
- Retail: use CFO vs EBITDA/NPAT, inventory discipline.
- Technology: use operating cash flow, deferred revenue, recurring contract quality.

## 5.4 Business model resilience — 5 points

Evaluate:

- revenue diversification;
- cyclicality;
- customer concentration;
- supplier dependence;
- regulatory dependence;
- pricing power;
- disruption risk.

---

# 6. Financial Health — 15 Points

Financial Health assesses survivability and funding resilience.

## 6.1 Balance-sheet strength — 6 points

Sector-appropriate analysis:

### Banks
- CET1 / capital adequacy;
- loan-to-deposit / funding structure;
- liquidity;
- asset quality;
- provisioning coverage.

### Property
- net debt;
- debt maturity;
- interest coverage;
- cash;
- project funding;
- presale liabilities;
- refinancing dependence.

### Retail / Industrial
- net debt / EBITDA;
- interest coverage;
- lease liabilities;
- working-capital intensity;
- liquidity.

### Technology
- net cash / net debt;
- recurring cash generation;
- acquisition leverage;
- working-capital profile.

Scoring:
- 5–6: strong
- 3–4: adequate
- 1–2: weak
- 0: unacceptable

## 6.2 Liquidity & refinancing resilience — 4 points

Evaluate:

- short-term obligations;
- debt maturity ladder;
- cash availability;
- access to funding;
- covenant risk;
- stress resilience.

## 6.3 Downside survivability — 5 points

Evaluate whether the business can withstand:

- recession;
- earnings decline;
- rate shock;
- credit stress;
- commodity shock;
- project delay;
- customer weakness.

High score requires survival without emergency dilution or distressed financing.

---

# 7. Growth Quality — 15 Points

Growth is rewarded only when it creates shareholder value.

## 7.1 Historical growth quality — 5 points

Evaluate normalized 3–5 year trends in:

- revenue;
- earnings;
- book value;
- FCF;
- deposits / loans for banks;
- presales / backlog / delivered area for property where appropriate.

Growth must be adjusted for:
- acquisitions;
- dilution;
- accounting changes;
- cyclical rebound.

## 7.2 Forward growth durability — 5 points

Evaluate:

- runway;
- reinvestment opportunities;
- addressable market;
- capacity growth;
- competitive sustainability;
- management execution.

## 7.3 Incremental returns on growth — 5 points

Ask:

> Does growth improve per-share intrinsic value?

Penalize:
- low-return expansion;
- dilution-funded growth;
- debt-funded growth with weak returns;
- revenue growth with falling margins;
- store/project expansion with weak unit economics.

Reward:
- high incremental ROIC;
- high incremental ROE;
- scalable asset-light economics;
- retained earnings reinvested at attractive rates.

---

# 8. Industry & Competitive Position — 10 Points

## 8.1 Industry structure — 4 points

Evaluate:
- concentration;
- pricing discipline;
- barriers to entry;
- regulation;
- capital intensity;
- disruption;
- structural demand.

## 8.2 Company position within industry — 4 points

Evaluate:
- market share;
- relative cost position;
- distribution;
- product quality;
- operating efficiency;
- strategic position.

## 8.3 Cycle position — 2 points

Evaluate:
- industry cycle;
- credit cycle;
- inventory cycle;
- property cycle;
- commodity cycle;
- demand normalization.

Cycle position should influence score modestly, not dominate long-term quality.

---

# 9. Valuation & Forward Return — 20 Points

Valuation receives 20 points because Value Investing requires disciplined entry price, but valuation cannot rescue failed quality or veto conditions.

## 9.1 Primary valuation attractiveness — 8 points

Use sector-appropriate primary methods.

### Banks
Primary:
- P/B relative to sustainable ROE and cost of equity;
- residual income / justified P/B.

Cross-check:
- P/E;
- dividend yield;
- historical valuation.

### Property
Primary:
- RNAV / NAV discount;
- normalized earnings / project cash flow.

Cross-check:
- P/B;
- normalized P/E;
- enterprise value.

### Retail
Primary:
- normalized EV/EBIT;
- P/E;
- DCF where stable.

Cross-check:
- FCF yield;
- EV/sales only when margin structure is explicitly considered.

### Technology
Primary:
- DCF / owner earnings;
- EV/EBIT;
- P/E for mature profitable businesses.

Cross-check:
- FCF yield;
- growth-adjusted valuation.

Scoring:
- 7–8: deeply attractive with strong evidence
- 5–6: attractive
- 3–4: fair
- 1–2: expensive
- 0: clearly overvalued

## 9.2 Expected 5-year annualized total return — 8 points

Use expected forward total return:

> earnings / intrinsic-value growth  
> + dividends / distributions  
> + valuation normalization  
> − dilution / structural leakage

Guide:

| Expected 5Y Annualized Return | Base Score |
|---|---:|
| `≥22%` | 8 |
| `18% ≤ return <22%` | 7 |
| `15% ≤ return <18%` | 6 |
| `12% ≤ return <15%` | 4–5 |
| `8% ≤ return <12%` | 2–3 |
| `<8%` | 0–1 |

Within a range, use the lower point when estimate uncertainty is high or the return is near the lower boundary; use the upper point only when evidence quality and downside support are stronger.

This table must respect `RISK_POLICY.md`:
- 12% is only an exceptional absolute floor;
- 15%+ is the normal BUY hurdle.

## 9.3 Margin of safety / downside asymmetry — 4 points

Evaluate:
- discount to conservative intrinsic value;
- downside case;
- balance-sheet protection;
- asset backing;
- earnings resilience;
- valuation uncertainty.

High score requires attractive upside **and** contained downside.


## 9.4 Valuation double-counting control

The same valuation signal must not be awarded independently in all three valuation subcategories without distinct evidence.

Examples:

- a low P/E may support primary valuation attractiveness but does not automatically prove margin of safety;
- an RNAV discount does not automatically imply a high expected return if realization is uncertain;
- high expected return derived mainly from aggressive multiple expansion must receive lower confidence and weaker downside-asymmetry scoring.

The analyst must identify the distinct evidence supporting §9.1, §9.2, and §9.3.

---

# 10. Risk & Governance — 10 Points

This score reflects residual risk only after Stage 0.

A confirmed hard veto does not merely reduce points; it overrides the scoring model.

## 10.1 Governance & shareholder alignment — 4 points

Evaluate:
- disclosure quality;
- related-party transactions;
- controlling shareholder behavior;
- minority shareholder treatment;
- accounting credibility;
- governance consistency and treatment of outside shareholders.

**Do not score reinvestment returns, acquisition economics, dividend policy, buyback discipline, or dilution outcomes here unless they are evidence of governance/integrity failure.** Their normal economic scoring belongs to §11 Capital Allocation Quality.

## 10.2 Residual business / financial risk — 4 points

Map from Risk Policy taxonomy:

| Residual Risk | Score Range |
|---|---:|
| LOW | 4 |
| MODERATE | 3 |
| ELEVATED | 1–2; use 1 when the risk is near HIGH or weakly mitigated, 2 when clearly controlled and compensated |
| HIGH | 0 |
| UNACCEPTABLE | score not applicable; positive allocation prohibited |

## 10.3 Thesis uncertainty — 2 points

Evaluate:
- forecast range;
- model uncertainty;
- data reliability;
- sensitivity to key assumptions.

---

# 11. Capital Allocation Quality — 5 Points

Evaluate the **economic quality of capital deployment**, not governance character.

Governance, disclosure quality, related-party behavior, and minority-shareholder treatment belong to §10. This section must not award or deduct the same evidence twice.

## 11.1 Reinvestment discipline — 2 points

Reward:
- reinvestment above cost of capital;
- disciplined capex;
- rational acquisition strategy.

## 11.2 Dividend / buyback discipline — 1 point

Reward:
- distributions when reinvestment opportunities are weak;
- buybacks only below intrinsic value.

## 11.3 Dilution discipline — 1 point

Penalize:
- repeated dilution without adequate return;
- value-destructive issuance.

## 11.4 Capital-allocation outcome / per-share value creation — 1 point

Evaluate whether management's historical capital decisions have increased **per-share intrinsic value** after considering acquisitions, divestments, dilution, and reinvestment outcomes.

---

# 12. Sector-Neutral Scoring Framework

The model avoids cross-sector bias through **principle-equivalent metrics**.

## 12.1 Common principle → sector-specific metric

| Principle | Bank | Property | Retail | Technology |
|---|---|---|---|---|
| Economic returns | ROE, ROTE | ROE, project IRR | ROIC | ROIC, incremental margin |
| Balance sheet | CAR, NPL, LDR | net debt, maturities | net debt, leases | net cash/debt |
| Cash quality | provisioning / NPL | collections / handover | CFO / inventory | FCF / recurring cash |
| Growth quality | loan/deposit/fee growth | presales/backlog | SSS/store growth | recurring revenue/user growth |
| Valuation | P/B vs ROE | RNAV | P/E, EV/EBIT | DCF, P/E, EV/EBIT |
| Risk | credit cycle | funding/project cycle | consumer/inventory | disruption/customer concentration |

## 12.2 No raw-metric ranking across incompatible sectors

Prohibited examples:

- ranking banks and retailers by debt/equity;
- ranking property developers and software companies by asset turnover;
- rewarding a bank solely for high ROE without asset-quality adjustment;
- penalizing tech for low tangible book value;
- rewarding property companies for high reported earnings without cash realization.

## 12.3 Sector-relative percentile use

Where useful, quantitative metrics may be normalized by:

- sector percentile when the peer set is sufficiently large and comparable;
- 5-year own-history percentile;
- cycle-adjusted range.

When a VN30 sector has too few comparable constituents for a reliable percentile, use broader listed-sector peers or absolute/own-history anchors rather than a misleading small-sample percentile.

But sector-relative ranking must not reward a structurally weak sector merely because one company is “best of a bad group.”

Absolute investability standards still apply.


## 12.4 Metric-substitution rule

Each subcategory keeps the same point weight across sectors, but the **metric used to evidence that principle may be substituted**.

A substitution is valid only when:

1. it measures the same economic principle;
2. it is standard or defensible for the sector;
3. the substitution is documented;
4. it is applied consistently to peer companies;
5. it does not make the sector structurally easier to score.

The model must never change category weights simply because one sector has more available metrics.

## 12.5 Common absolute anchors

Sector-relative data may inform scoring, but the final score must also pass common absolute questions:

- Does the company earn acceptable returns through a cycle?
- Can it survive a severe but plausible stress scenario?
- Does growth increase per-share intrinsic value?
- Are disclosures sufficiently reliable?
- Is expected forward return adequate for the residual risk?

Being top-quartile within a weak sector is not sufficient by itself.

## 12.6 Sector score calibration check

Before full-VN30 ranking, the system must review the distribution of category scores by sector.

If one sector systematically scores materially higher or lower because of accounting structure rather than economics, the metric definitions—not the category weights—must be recalibrated.

Calibration must not force identical average scores across sectors. Its purpose is to detect **measurement bias**, not manufacture statistical equality.

---

# 13. Score Construction Rules

## 13.1 Evidence hierarchy

Prefer:

1. audited / official company disclosures;
2. regulatory filings;
3. exchange disclosures;
4. company presentations with reconciliation;
5. reputable third-party data;
6. analyst estimates.

Lower-quality evidence must reduce confidence.

## 13.2 Normalization

Use normalized rather than peak/trough metrics when cycles distort results.

Examples:
- banks: normalized credit cost;
- property: normalized delivery / project mix;
- retailers: normalized same-store growth and margins;
- technology: normalized growth and margins excluding one-off contracts/acquisitions.

## 13.3 One-off adjustments

Any adjustment must be:
- explicit;
- documented;
- symmetric;
- and not used only when it improves the score.

## 13.4 Missing data

Do not award neutral points automatically.

If material data is unavailable:

- reduce confidence;
- use conservative scoring only when a defensible range can still be estimated;
- classify evidence as **PENDING** when the gap is decision-critical;
- never use a neutral midpoint merely to complete the 100-point table.

When PENDING prevents a reliable category score, report that category as **N/R — Not Reliably Scorable** rather than inventing points. The security is excluded from positive investable ranking until resolved.

---

# 13A. Score Validity Status

Every total score must carry one Score Validity Status:

- **VALID — ACTIONABLE:** Stage 0 permits positive capital-allocation analysis, all material categories are reliably scorable, and no currently known binding Risk Policy / portfolio constraint blocks the implied action.
- **VALID — NON-ACTIONABLE:** the score is analytically useful, but a Risk Policy, ownership-state, execution, or portfolio constraint currently blocks positive allocation.
- **RESEARCH ONLY:** Stage 0 FAIL or another condition makes the score unsuitable for positive ranking; retained only for audit/research.
- **NOT RELIABLY SCORABLE:** decision-critical evidence is insufficient to construct a defensible 100-point score.

A score with `RESEARCH ONLY` or `NOT RELIABLY SCORABLE` must never appear in the investable Top-10 ranking as if it were equivalent to a VALID score.

---

# 14. Score-to-Decision Interaction

The score provides a default attractiveness zone only.

Suggested default interpretation:

| Score | Default Attractiveness Zone |
|---|---|
| 90–100 | Exceptional attractiveness candidate |
| 82–89 | Very strong attractiveness candidate |
| 75–81 | Strong / selective candidate |
| 68–74 | Acceptable / watch |
| 60–67 | Weak attractiveness |
| <60 | Poor attractiveness / exit-review candidate |

This table is **not a Decision State mapping**.

It must not be used to infer ownership-specific action. For example, an 86 score does not mechanically mean BUY for an unowned security or ACCUMULATE for an owned security.

Final Decision must still obey:

- ownership status;
- Stage 0 outcome;
- residual risk;
- return hurdle;
- portfolio impact;
- concentration;
- confidence;
- opportunity cost;
- and Risk Policy vetoes.

Examples:

### Example A
Score = 91  
Hard governance veto = YES

> Final Decision = AVOID / SELL  
> Score cannot override veto.

### Example B
Score = 86  
Owned position  
Valuation attractive  
Stage 0 PASS  
Portfolio capacity available

> ACCUMULATE may be appropriate.

### Example C
Score = 88  
Owned position already above concentration ceiling

> HOLD / no-add may be appropriate despite strong score.

### Example D
Score = 74  
High-quality existing holding  
Forward return acceptable  
Switching hurdle not met

> HOLD may be appropriate.

---

# 15. Confidence Overlay

Every score must include Confidence:

- HIGH
- MEDIUM
- LOW

## HIGH
- reliable data;
- stable economics;
- narrow valuation range;
- low model uncertainty.

## MEDIUM
- adequate evidence;
- some forecast / cycle uncertainty.

## LOW
- major evidence gaps;
- unstable economics;
- wide valuation range.

LOW confidence cannot support new capital under the approved Risk Policy / Decision Framework.

Confidence is an overlay, not a mechanical multiplier on total score.

Do not apply a second blanket numeric discount to the total score merely because Confidence is LOW/MEDIUM if the underlying uncertainty has already been reflected in the relevant category scores. This avoids double-penalizing uncertainty.

The numeric score must also never be increased to compensate for low confidence.

---

# 16. Anti-Bias Controls

Before finalizing a score, check for:

## 16.1 Value trap bias
- low P/E mistaken for cheapness;
- weak business rewarded by valuation alone.

## 16.2 Growth bias
- revenue growth rewarded despite poor incremental returns.

## 16.3 Quality-at-any-price bias
- excellent business scored too highly despite poor forward return.

## 16.4 Sector bias
- bank leverage compared with industrial leverage;
- asset-light companies penalized for low book value;
- property earnings trusted without cash realization.

## 16.5 Recency bias
- one strong year dominating 5-year economics.

## 16.6 Narrative bias
- management story overriding financial evidence.

## 16.7 Anchoring
- score anchored to prior score or purchase price.

## 16.8 Score inflation
Analyst must justify any category score in the top 10% range.

## 16.9 Double-counting bias
The same fact must not earn points in multiple categories unless it supports genuinely different economic principles.

## 16.10 Model-confirmation bias
If valuation, growth, and quality scores all depend heavily on the same optimistic assumption, the analyst must explicitly identify that common dependency and reduce confidence where appropriate.

---

# 17. Mandatory Score Record

Every stock score must record:

- Ticker
- Date / data as-of date
- Sector
- Ownership status
- Composite Stage 0 Outcome
- Business Quality score / 25
- Financial Health score / 15
- Growth Quality score / 15
- Industry score / 10
- Valuation & Forward Return score / 20
- Risk & Governance score / 10
- Capital Allocation Quality score / 5
- Total Score / 100
- Score Validity Status
- Category Gate Results
- Confidence
- Residual Risk
- Expected 5-year annualized total return
- Margin-of-safety assessment
- Hard-veto status
- Hurdle Exception: YES / NO
- Key score drivers
- Key penalties
- Data limitations
- Final Decision State
- Score-to-decision override explanation, if final state materially differs from default score zone

---

# 18. VN30 Ranking Rules

When ranking the full VN30:

1. the **investable Top-10** may contain only securities with `Score Validity Status = VALID — ACTIONABLE`;
2. `VALID — NON-ACTIONABLE` securities may appear in a separate clearly labeled comparison/watch section, but must not occupy an investable Top-10 slot while the blocking condition remains;
3. exclude `RESEARCH ONLY` and `NOT RELIABLY SCORABLE` securities from the investable Top-10;
4. preserve non-actionable/raw research scores separately for audit;
5. rank investable securities primarily by total score **within broad score bands**, not by false precision;
6. for securities within **2 total points**, treat them as effectively tied and use expected forward return, residual risk, confidence, and portfolio impact as tie-breakers;
7. do not force ownership of the Top 10;
8. do not buy solely because a stock ranks highly;
9. re-rank when material new data changes the score or validity status.

Recommended ranking output:

| Rank | Ticker | Score | Score Validity | Confidence | Residual Risk | Expected Return | Decision State |
|---|---|---:|---|---|---|---:|---|

---

# 19. Score Stability and Review

A score must be recalculated when:

- new quarterly / annual results are released;
- material business events occur;
- thesis review is triggered;
- valuation changes materially;
- Risk Policy review changes residual risk;
- or VN30 membership changes.

A share-price move may change the **Valuation & Forward Return** score because price is an input to expected return and margin of safety. It must not mechanically change Business Quality, Financial Health, Growth Quality, Industry, or Capital Allocation scores unless underlying evidence changes.

Large score changes must explain:

> What changed in the business, financials, growth, industry, valuation, risk, or evidence?

For a total-score change of **5 points or more**, the decision record must attribute the change by category.

---

# 20. Key Scoring Rules Summary

1. **100 points total** across seven economic categories.
2. Business Quality = 25; Financial Health = 15; Growth Quality = 15; Industry = 10; Valuation & Forward Return = 20; Risk & Governance = 10; Capital Allocation Quality = 5.
3. **Score is decision support, not decision authority.**
4. Stage 0, hard vetoes, portfolio limits, and ownership semantics override score.
5. **Category gates prevent total-score masking** of weak Business Quality, Financial Health, Risk/Governance, or Valuation.
6. Points in one category cannot compensate for survivability, governance, or investability failure.
7. Sector-specific metrics are required, but category weights remain constant.
8. Banks, property, retail, and technology use principle-equivalent rather than identical raw metrics.
9. Sector-relative percentile scoring must be checked against absolute economics and sample-size quality.
10. Growth scores highly only when it increases per-share intrinsic value.
11. Valuation must estimate expected forward return and downside asymmetry, not merely low P/E/P/B.
12. Valuation subcomponents require distinct evidence to prevent double-counting.
13. `12%–15%` expected return is exceptional; `15%+` is the normal BUY hurdle under Risk Policy.
14. Residual Risk HIGH / UNACCEPTABLE blocks positive allocation regardless of total score.
15. LOW confidence blocks new capital, but confidence must not be double-counted through an arbitrary second score haircut.
16. Missing decision-critical data may produce **NOT RELIABLY SCORABLE**, not invented midpoint points.
17. Every score has a **Score Validity Status**.
18. Only VALID — ACTIONABLE securities may enter the investable Top-10; VALID — NON-ACTIONABLE belongs in a separate watch/comparison section.
19. Differences of 1–2 total points are normally economically indistinguishable.
20. Strong score plus concentration or Risk Policy constraint may still lead to HOLD / no-add.
21. Existing holdings are not mechanically switched because another security scores marginally higher.
22. Price changes affect valuation score but do not mechanically rewrite fundamental category scores.
23. The same fact must not be double-counted across categories.
24. Every score must document key drivers, penalties, assumptions, data quality, category gates, and any score-to-decision divergence.

---

# 21. Approval Gate

Before approval, CIO / Risk Manager should confirm:

1. Are the 25/15/15/10/20/10/5 weights appropriate for long-term VN30 Value Investing?
2. Do category gates adequately prevent a high total score from hiding weak Financial Health or Risk/Governance?
3. Does 20% Valuation & Forward Return provide sufficient price discipline without overpowering business quality?
4. Are governance and capital-allocation evidence separated sufficiently to prevent double-counting?
5. Are banks protected from leverage/accounting bias and scored on capital, funding, asset quality, and normalized returns?
6. Are property companies scored on cash realization, funding, RNAV quality, and project economics rather than accounting profit alone?
7. Are retailers evaluated on unit economics, inventory discipline, same-store economics, and ROIC?
8. Are technology companies evaluated on recurring economics, incremental returns, cash generation, and disruption risk rather than tangible book?
9. Are sector-relative metrics constrained by absolute economic anchors and small-peer-set safeguards?
10. Are valuation-return score intervals deterministic and consistent with the 12% exceptional / 15% normal BUY hurdle?
11. Is the Score Validity Status sufficient to ensure only VALID — ACTIONABLE securities enter the investable Top-10 while constrained securities remain separately visible?
12. Are 1–2 point differences treated with sufficiently low precision?
13. Does the model avoid double-penalizing uncertainty through both category scores and confidence?
14. Does the ranking framework avoid unnecessary switching and false precision?
15. Are the current category gates appropriate as constitutional defaults pending Milestone 3 calibration?
16. Are any important sector-specific principle-equivalent metrics missing before implementation?

**Current status:** Approved Constitution Baseline.

This document is the approved constitutional baseline for the VN30 scoring model.
