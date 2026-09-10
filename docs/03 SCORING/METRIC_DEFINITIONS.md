# VN30 Value Investing OS — Metric Definitions

**Document:** `03_SCORING/METRIC_DEFINITIONS.md`  
**Milestone:** 3 — VN30 Scoring Engine  
**Status:** Approved  
**Version:** 1.0  
**Date:** 2026-09-05  
**Governing Documents:**  
- `INVESTMENT_POLICY.md` v1.1
- `RISK_POLICY.md` v1.0
- `DECISION_FRAMEWORK.md` v1.0
- `SCORING_MODEL.md` v1.0
- `03_SCORING/SCORING_ENGINE.md` v0.2 — Approved
- `DATA_MODEL.md`
- `DATA_RULES.md`

---

# 1. Purpose

This document is the authoritative Milestone-3 metric dictionary for the VN30 Scoring Engine.

It defines how evidence is converted into scoring inputs.

It does **not**:

- change the approved 100-point architecture;
- map score directly to BUY / HOLD / SELL;
- create a second source of truth for accounting data;
- define portfolio position sizing;
- define final sector-normalization matrices;
- define execution timing.

Every metric must be traceable through:

> source → raw observation → normalization → scoring anchor → point contribution

No metric may be used outside the rules defined here without a documented substitution under `SCORING_ENGINE.md`.

---

# 2. Metric Contract

Every scoring metric must contain the following fields.

| Field | Requirement |
|---|---|
| `metric_id` | Stable identifier |
| `metric_name` | Human-readable name |
| `category` | One of the 7 approved categories |
| `subcategory` | Approved scoring subcategory |
| `evidence_type` | QNT / QLT / MIXED |
| `economic_principle` | What the metric is intended to measure |
| `formula` | Explicit when quantitative |
| `unit` | %, x, VND, days, qualitative band, etc. |
| `measurement_period` | TTM / FY / 3Y / 5Y / point-in-time / forward |
| `normalization_rule` | Required where cycle/one-off adjustment applies |
| `primary_source` | Preferred source hierarchy |
| `fallback_source` | Permitted fallback |
| `scoring_anchor` | Point rubric |
| `missing_rule` | Substitute / range / N/R / block |
| `double_count_rule` | Primary scoring home |
| `sector_applicability` | Common / sector-specific |
| `confidence_sensitivity` | LOW / MEDIUM / HIGH |
| `method_version` | Required for production |

Metric definitions are versioned methodology, not analyst preference.

---

# 3. General Measurement Rules

## 3.1 Historical periods

Unless a metric states otherwise:

- **TTM** is used for current operating state.
- **3-year** history is the minimum for trend assessment when 5-year history is unavailable.
- **5-year** history is preferred for durable quality/growth.
- cyclical sectors require through-cycle periods where possible.

A single quarter cannot determine a long-term score unless it represents a documented structural break.

## 3.2 Per-share metrics

EPS, BVPS, DPS and per-share FCF must use corporate-action-comparable share counts and documented share-denominator methodology.

For historical growth:

- restated company-reported per-share figures may be used when the issuer explicitly provides comparable restatement;
- otherwise reconstruct a comparable denominator only from authoritative share/corporate-action terms;
- do not infer a historical adjusted denominator from current shares outstanding alone.

Mechanical share-count changes from splits, bonus shares or similar proportional actions must not be treated as economic dilution.

Economic dilution includes issuance where existing owners surrender per-share value without adequate offsetting value creation.

If a rights issue, merger, spinoff, ESOP, conversion or other issuance materially changes per-share economics, growth and capital-allocation scoring must explicitly assess the value transferred/created per old share rather than only the percentage change in share count.

## 3.3 Adjusted / normalized metrics

Normalization must remove or separately identify:

- one-off gains/losses;
- asset disposals;
- revaluation gains;
- unusual provisions/reversals;
- accounting-policy changes;
- acquisition step-changes;
- unusually favorable/unfavorable commodity spreads;
- low-base rebounds;
- temporary tax effects.

Adjustments must be symmetric.

## 3.4 Point interpolation

Where a numeric metric has anchor bands, use **band-based scoring**, not excessive decimal interpolation.

Example:

- threshold band = 3 points;
- a tiny numerical difference around the threshold must not create false precision.

If a metric falls exactly on a threshold, use the more conservative adjacent score unless the rubric explicitly states inclusive treatment.

## 3.5 Multiple metrics inside one subcategory

Subcategory points are **not** the arithmetic sum of all listed metrics.

Metrics are evidence used to assign the subcategory's bounded point score.

This prevents metric proliferation from increasing category weight.

## 3.6 Source quality

Preferred hierarchy:

1. audited company financial statements / annual report;
2. official company disclosures;
3. exchange / regulator disclosures;
4. official index / industry data;
5. reputable structured financial-data provider;
6. broker research / consensus;
7. secondary commentary.

Qualitative claims from management are evidence, not truth, unless corroborated.

---

# 3A. Accounting / Portfolio Source-of-Truth Boundary

`METRIC_DEFINITIONS.md` defines analytical metrics. It does **not** own portfolio accounting facts.

## 3A.1 Ownership precedence

When a metric requires portfolio/accounting context, the authoritative source is determined by M2 ownership:

- economic event facts → `Transaction`;
- posted cash/security/balance effects → `TransactionLeg`;
- trade settlement / reversal lifecycle → `TRANSACTIONS.md`;
- portfolio position, NAV and P&L semantics → `PORTFOLIO.md`;
- corporate-action terms → `CorporateActionEvent` + linked immutable transactions;
- current/historical VN30 membership → `VN30Membership`;
- sector classification → effective-dated sector assignment;
- security prices → dated market observations.

This file must not redefine those facts.

If a metric definition conflicts with the owning M2 document, the M2 owner wins and the M3 metric is blocked until corrected.

## 3A.2 Issuer metrics vs portfolio metrics

The engine must distinguish two different data domains:

### Issuer/company fundamentals
Examples:

- company CFO;
- company capex;
- company debt;
- company cash;
- company dividends declared/paid;
- company shares outstanding;
- company EPS/BVPS.

These come from company/exchange/regulatory evidence.

### Investor portfolio accounting
Examples:

- portfolio settled cash;
- investor quantity held;
- investor average/open cost;
- realized/unrealized P&L;
- dividend cash actually received by the portfolio;
- transaction fees/taxes;
- portfolio NAV.

These come from reconstructed M2 ledger state.

**Issuer company cash must never be confused with portfolio cash.**  
**Company dividend policy must never be inferred from the investor's dividend receipt ledger alone.**  
**Portfolio P&L must never be used as evidence of business quality or valuation.**

## 3A.3 Portfolio-aware metric eligibility

A metric may consume portfolio state only if:

1. the relevant state is reconstructable from authoritative transaction history;
2. the reconstruction method/version is known;
3. cash/quantity/cost-basis/corporate-action integrity is not `BLOCKED`;
4. the metric's purpose genuinely requires portfolio state.

Examples of permitted portfolio-context usage:

- ownership-state display;
- unrealized P&L display;
- position affordability;
- portfolio exposure;
- sector concentration;
- opportunity-cost analysis;
- later execution/tax context.

None of these are fundamental metric evidence for the 100-point Investment Score.

## 3A.4 Cost-basis firewall

Investor cost basis is **never** a fundamental metric input.

The following are explicitly prohibited:

- `market price / average cost` as valuation;
- percentage gain/loss since purchase as quality evidence;
- break-even price as intrinsic value;
- averaging-down room as margin of safety;
- unrealized P&L as evidence of cheapness/expensiveness.

If investor cost basis is unreconciled, only cost-dependent portfolio displays are unavailable. Company-level valuation must remain independent.

## 3A.5 Cash reconciliation firewall

Portfolio cash used by any later ranking/actionability overlay must be ledger-derived.

Forbidden substitutes include:

- manually maintained `current_cash`;
- broker statement balance as authoritative truth;
- planned DCA amount;
- unsettled trade receivable treated as settled cash;
- unmatched settlement cash;
- dashboard snapshot not reproducible from M2 history.

A broker mismatch creates a reconciliation exception; it must not alter metric inputs by manual overwrite.

## 3A.6 Corporate-action comparability gate

Before using historical per-share metrics across a corporate action, the engine must establish denominator comparability.

This applies to:

- EPS;
- BVPS;
- DPS;
- FCF/share;
- shares outstanding;
- dilution;
- share-based compensation;
- buyback effect;
- per-share intrinsic value.

Required distinction:

### Mechanical share-count change
Examples:
- stock split;
- reverse split;
- bonus share / stock dividend where no economic value transfer occurs beyond proportional re-denomination.

These require denominator adjustment but are **not economic dilution by themselves**.

### Economic issuance / dilution
Examples:
- rights issue;
- private placement;
- ESOP/options;
- acquisition shares;
- conversion;
- issuance below intrinsic value without adequate offsetting economics.

These require evaluation of **per-share value impact**, not merely share-count growth.

### Basis-transfer / multi-stage actions
Merger, spinoff, rights subscription, cash-in-lieu and similar events require authoritative event terms and linked transaction stages.

If material terms are missing or the action cannot be reconciled:

- affected per-share metric = `N/R`;
- affected category may become `NOT RELIABLY SCORABLE`;
- no guessed adjustment is permitted.

## 3A.7 Dividend double-count boundary

Dividend evidence exists at two different layers:

### Company capital-allocation evidence
Use:
- declared/sustainable dividend policy;
- payout ratio;
- retained/reinvested capital;
- buyback/dividend economics.

Primary scoring home: Capital Allocation Quality.

### Portfolio accounting evidence
Use:
- dividend cash actually received;
- tax withheld;
- cash reconciliation.

Primary home: portfolio accounting/reporting only.

The same investor cash receipt must not independently increase:

- Business Quality;
- Growth;
- Valuation;
- Capital Allocation

without distinct issuer-level evidence.

Expected dividend yield in Valuation must be based on a **sustainable forward dividend assumption**, not simply the last portfolio cash receipt.

## 3A.8 Fee / tax / settlement isolation

Broker fees, taxes and trade settlement are investor accounting items.

They must not:

- alter issuer earnings;
- alter issuer FCF;
- alter company valuation denominators;
- create Business Quality penalties;
- create Growth penalties.

They may affect later realized investor return, transaction cost, or execution decisions outside the fundamental score.

## 3A.9 Reconstructability requirement

Any persisted metric record that depends on portfolio state must record enough lineage to reproduce the input:

> portfolio_id → analysis_as_of → transaction/replay version → relevant transaction IDs/derived snapshot → metric method version

Deleting an analytical cache must not destroy the ability to reconstruct the underlying portfolio state.

---

# 4. Business Quality — 25 Points

## 4.1 Economic Quality — 8 Points

### BQ-EQ-01 — Normalized Return on Invested Capital

**Purpose:** measure return generated on operating capital.

**Formula — non-financial companies:**

`NOPAT / average invested capital`

Where:

- NOPAT = normalized EBIT × (1 − normalized tax rate)
- invested capital = operating assets − non-interest-bearing operating liabilities

**Preferred period:** 5Y normalized average plus latest TTM.

**Applicability:** non-financial businesses where invested capital is economically meaningful.

**Scoring evidence anchor:**

| Normalized ROIC | Evidence signal |
|---|---|
| ≥ 20% | Exceptional |
| 15–20% | Strong |
| 10–15% | Good |
| 7–10% | Average |
| < 7% | Weak |
| consistently below estimated cost of capital | Value destructive |

ROIC alone does not determine the /8 subcategory score.

**Normalization:** exclude excess cash and material non-operating assets where appropriate; normalize cycle-sensitive EBIT.

**Double-count:** primary home = Business Quality. Incremental ROIC belongs to Growth Quality.

**Missing:** substitute sector-equivalent return metric; never assign zero automatically.

### BQ-EQ-02 — Sustainable ROE / ROTE

**Purpose:** sector-appropriate economic return where ROIC is not meaningful.

**Primary applicability:** banks and financial institutions; secondary cross-check elsewhere.

**Formula:**

`normalized net profit attributable to common shareholders / average common equity`

ROTE may use tangible common equity when goodwill materially distorts comparability.

**Indicative bank anchor:**

| Sustainable ROE | Evidence signal |
|---|---|
| ≥ 20% with sound asset quality/capital | Exceptional |
| 17–20% | Strong |
| 14–17% | Good |
| 11–14% | Average |
| 8–11% | Weak |
| < 8% | Poor |

High ROE caused by undercapitalization, weak provisioning or excessive risk does not receive full credit.

### BQ-EQ-03 — Margin Quality and Stability

**Purpose:** assess sustainable operating profitability and pricing power.

**Measures may include:**

- gross margin;
- EBIT margin;
- EBITDA margin only where economically appropriate;
- net interest margin for banks;
- pre-provision operating profitability for banks.

**Assessment inputs:**

- current normalized margin;
- 5Y median;
- dispersion / volatility;
- performance under stress;
- peer position.

**Rubric:**

- top score evidence requires structurally superior and durable margins;
- temporary peak-cycle margins receive limited credit;
- rising margin with deteriorating cash conversion does not receive full credit.

---

## 4.2 Competitive Advantage / Moat — 6 Points

### BQ-MOAT-01 — Competitive Advantage Assessment

**Evidence type:** QLT / MIXED.

**Evaluate:**

- brand;
- distribution;
- switching costs;
- cost advantage;
- network effects;
- licenses / regulatory barriers;
- scale;
- proprietary data / know-how;
- customer stickiness;
- ecosystem control.

**Rubric:**

| Score | Standard |
|---:|---|
| 6 | Multiple durable advantages evidenced through economics and behavior |
| 5 | Strong advantage with long demonstrated durability |
| 4 | Meaningful advantage but partially contestable |
| 3 | Some differentiation; moat uncertain |
| 2 | Weak / narrow advantage |
| 1 | Minimal advantage |
| 0 | Commodity / structurally disadvantaged |

Maximum score requires evidence of **persistence**, not narrative alone.

### BQ-MOAT-02 — Market Share Quality

Market share is corroborating evidence, not an automatic moat score.

High share receives limited credit if produced by:

- uneconomic pricing;
- excessive incentives;
- leverage;
- regulatory favoritism that may reverse;
- acquisitions without return discipline.

Primary scoring home remains Industry Position unless market share directly proves durable moat economics.

---

## 4.3 Operating Earnings Quality / Cash Conversion — 6 Points

### BQ-CASH-01 — CFO / Normalized Net Profit

**Formula:**

`CFO / normalized NPAT`

**Preferred period:** cumulative 3Y and 5Y.

**Indicative anchor for non-financial companies:**

| 3–5Y CFO / NPAT | Signal |
|---|---|
| ≥ 110% | Strong |
| 90–110% | Good |
| 70–90% | Watch |
| 50–70% | Weak |
| < 50% | Poor |

Interpret with working-capital model.

A structurally negative-working-capital retailer may naturally exceed 100%; this does not automatically imply exceptional earnings quality.

### BQ-CASH-02 — Free Cash Flow Conversion

**Formula:**

`normalized FCF / normalized NPAT`

or, when more meaningful:

`normalized FCF / normalized EBIT after tax`

FCF must distinguish maintenance from growth capex where feasible.

**Use cautiously for:**

- high-growth businesses;
- developers;
- banks.

### BQ-CASH-03 — Accrual / One-Off Dependence

Assess:

- receivables growth vs revenue;
- inventory growth vs revenue;
- capitalized costs;
- non-cash gains;
- related-party receivables;
- repeated "one-off" income;
- provision reversals;
- fair-value gains.

**Penalty trigger:** persistent divergence between earnings and cash/economic realization.

### Bank substitute — BQ-CASH-BANK

Use:

- NPL recognition quality;
- provisioning coverage;
- credit-cost adequacy;
- accrued interest quality;
- fee-income recurrence;
- off-balance-sheet risk where material.

Do not use CFO/NPAT for banks as if it were an industrial cash-flow measure.

### Property substitute — BQ-CASH-RE

Use:

- presale-to-collection conversion;
- handover-to-cash conversion;
- operating cash realization;
- inventory monetization;
- receivables quality.

---

## 4.4 Business Model Resilience — 5 Points

### BQ-RES-01 — Revenue / Earnings Concentration

Evaluate:

- customer concentration;
- product concentration;
- supplier concentration;
- geographic concentration;
- project concentration;
- funding concentration.

**Generic customer anchor where disclosed:**

- no customer >10% revenue = generally positive;
- >20% single-customer exposure = material risk unless contract quality is exceptional;
- >30% = major concentration requiring explicit mitigation.

Thresholds are context, not automatic points.

### BQ-RES-02 — Pricing Power

Evidence:

- ability to pass input inflation;
- stable/growing gross margin;
- low churn after price increases;
- non-price differentiation;
- premium pricing durability.

### BQ-RES-03 — Cyclicality / Stress Behavior

Assess normalized earnings drawdown through prior stress periods.

Maximum resilience score requires evidence that the business can protect franchise value and avoid distressed capital actions during a severe but plausible downturn.

---

# 5. Financial Health — 15 Points

## 5.1 Balance-Sheet Strength — 6 Points

### FH-BS-01 — Net Debt / EBITDA

**Applicability:** non-financial companies with meaningful EBITDA.

**Formula:**

`(interest-bearing debt − unrestricted cash) / normalized EBITDA`

**Indicative anchor:**

| Net Debt / EBITDA | Signal |
|---|---|
| net cash | Exceptional |
| 0–1.0x | Strong |
| 1.0–2.0x | Good |
| 2.0–3.0x | Watch |
| 3.0–4.0x | Weak |
| >4.0x | High risk |

For cyclical businesses use normalized/downside EBITDA, not peak EBITDA.

Lease liabilities must be treated consistently within sector comparisons.

### FH-BS-02 — Debt / Equity

Secondary metric only for suitable non-financial companies.

Do **not** use as a universal leverage metric.

Do **not** use for banks as a Financial Health scoring input.

### FH-BS-03 — Net Debt / Equity

Useful for developers and asset-heavy companies when earnings are unstable.

Interpret with asset quality and cash realizability.

### FH-BS-BANK-01 — Capital Adequacy

Use the most authoritative disclosed regulatory capital ratio available, ideally CET1/common-equity or equivalent plus total CAR.

Scoring must consider:

- regulatory minimum;
- management buffer;
- risk-weight density;
- growth requirements;
- asset-quality uncertainty.

A ratio barely above minimum cannot receive a strong balance-sheet score.

### FH-BS-BANK-02 — NPL Ratio

**Formula:**

`non-performing loans / gross customer loans`

Generic context:

- <1% = strong asset-quality signal;
- 1–2% = generally healthy;
- 2–3% = watch;
- >3% = elevated.

This is not standalone scoring because recognition practices differ.

### FH-BS-BANK-03 — Loan-Loss Coverage

**Formula:**

`loan-loss reserves / NPL`

Generic context:

- >150% = strong coverage signal;
- 100–150% = adequate/good;
- 70–100% = watch;
- <70% = weak unless justified by collateral/structure.

Must be read together with NPL recognition quality.

### FH-BS-BANK-04 — Funding Quality / CASA

CASA is supporting evidence of funding franchise, not a standalone safety metric.

High CASA may support:

- funding stability;
- NIM resilience;
- franchise quality.

It must not double-count both Business Quality and Financial Health without distinct rationale.

---

## 5.2 Liquidity & Refinancing Resilience — 4 Points

### FH-LIQ-01 — Current / Quick Liquidity

Use only when meaningful for sector economics.

Generic current ratio is **not** suitable for banks and can be misleading for developers/retailers.

### FH-LIQ-02 — Short-Term Debt Coverage

**Formula options:**

`unrestricted cash / debt due within 12 months`

or

`(cash + committed undrawn facilities + highly liquid assets) / obligations due within 12 months`

Indicative anchor:

- ≥1.5x = strong;
- 1.0–1.5x = adequate;
- 0.75–1.0x = watch;
- <0.75x = weak unless refinancing visibility is exceptionally strong.

### FH-LIQ-03 — Interest Coverage

**Formula:**

`normalized EBIT / net interest expense`

or EBITDA/interest only if capex intensity is explicitly considered.

Indicative anchor:

| Interest coverage | Signal |
|---|---|
| ≥8x | Strong |
| 5–8x | Good |
| 3–5x | Watch |
| 2–3x | Weak |
| <2x | High risk |

For developers, use cash interest burden and debt maturity in addition to accounting coverage.

### FH-LIQ-04 — Debt Maturity Concentration

Qualitative/quantitative assessment:

- % debt due in 12 months;
- % due in 24 months;
- refinancing source diversity;
- secured/unsecured composition;
- covenant headroom.

---

## 5.3 Downside Survivability — 5 Points

### FH-STRESS-01 — Stress Coverage Assessment

Required downside test.

At minimum evaluate a severe but plausible scenario appropriate to sector.

Examples:

**Non-financial:**
- revenue −15% to −25%;
- margin compression;
- working-capital outflow;
- higher funding cost.

**Banks:**
- higher credit cost;
- NPL formation;
- NIM compression;
- capital consumption.

**Property:**
- 12–24 month sales/handover delay;
- refinancing stress;
- lower presale collection;
- project legal delay.

**Materials:**
- mid/down-cycle commodity price;
- utilization decline.

High score requires survival **without** emergency dilution, distressed asset sale or structurally damaging refinancing.

---

# 6. Growth Quality — 15 Points

## 6.1 Historical Growth Quality — 5 Points

### GQ-HIST-01 — Revenue CAGR

**Formula:**

`(Revenue_end / Revenue_start)^(1/n) − 1`

Preferred period: 3Y and 5Y.

Interpret alongside:

- acquisitions;
- inflation;
- share issuance;
- cyclicality;
- base effects.

Indicative cross-sector context:

| Normalized CAGR | Signal |
|---|---|
| ≥15% | Strong growth |
| 10–15% | Good |
| 5–10% | Moderate |
| 0–5% | Low |
| <0% | Contraction |

Not a direct point table.

### GQ-HIST-02 — Normalized EPS / NPAT CAGR

Use corporate-action-comparable per-share figures where possible.

A high EPS CAGR from:

- low base;
- provision reversal;
- asset sale;
- temporary commodity peak

must be normalized.

### GQ-HIST-03 — Book Value per Share CAGR

Especially useful for banks and financials.

Must adjust for:

- capital raises;
- bonus shares;
- retained earnings;
- dilution.

### GQ-HIST-04 — FCF / Owner-Earnings Growth

Useful only where FCF is economically meaningful and stable.

Do not penalize businesses automatically for negative FCF caused by high-return expansion if reinvestment economics are independently strong.

### Bank growth substitute

Use:

- loans;
- deposits;
- fee income;
- pre-provision profit;
- BVPS;
- normalized EPS.

Growth cannot receive full credit if credit quality or capital ratios deteriorate materially.

### Property growth substitute

Use:

- presales;
- backlog;
- collections;
- deliveries;
- normalized project earnings;
- NAV growth.

---

## 6.2 Forward Growth Durability — 5 Points

### GQ-FWD-01 — 3–5Y Sustainable Growth Estimate

Evidence type: ESTIMATE / MIXED.

Required components:

- revenue/volume runway;
- reinvestment capacity;
- competitive position;
- balance-sheet funding capacity;
- addressable market;
- regulatory constraints;
- execution history.

**Rubric:**

| Score | Standard |
|---:|---|
| 5 | High-confidence multi-year runway with attractive economics |
| 4 | Good runway, manageable uncertainty |
| 3 | Moderate/normal growth visibility |
| 2 | Limited or cyclical growth |
| 1 | Weak visibility / likely stagnation |
| 0 | Structural decline |

A broker consensus number alone cannot justify 5/5.

### GQ-FWD-02 — Backlog / Pipeline Visibility

Use only where economically meaningful.

Examples:

- contracted backlog;
- presales;
- recurring contracts;
- committed capacity;
- customer renewal base.

Pipeline without conversion evidence receives limited credit.

---

## 6.3 Incremental Returns on Growth — 5 Points

### GQ-INC-01 — Incremental ROIC

**Conceptual formula:**

`change in normalized NOPAT / change in invested capital`

Use multi-year periods to reduce noise.

Indicative anchor:

- ≥20% = exceptional incremental economics;
- 15–20% = strong;
- 10–15% = acceptable/good;
- 7–10% = mediocre;
- <7% or below cost of capital = weak.

Do not calculate mechanically when denominator is very small or distorted by acquisitions/corporate actions.

### GQ-INC-BANK — Incremental ROE / Capital Efficiency

Assess whether loan/asset growth creates attractive incremental profit **after**:

- credit cost;
- capital consumption;
- funding cost.

### GQ-INC-RETAIL — Store Economics

Possible evidence:

- mature-store ROIC;
- payback period;
- sales/store;
- profit/store;
- same-store sales;
- closure rate.

Store expansion with deteriorating unit economics cannot score highly.

---

# 7. Industry & Competitive Position — 10 Points

## 7.1 Industry Structure — 4 Points

### IC-IND-01 — Industry Attractiveness Assessment

Evaluate:

- barriers to entry;
- competitive intensity;
- pricing discipline;
- customer bargaining power;
- supplier bargaining power;
- capital intensity;
- disruption;
- regulatory structure;
- structural demand.

**Rubric:**

| Score | Standard |
|---:|---|
| 4 | Structurally attractive, rational competition, durable demand |
| 3 | Generally attractive with manageable risks |
| 2 | Mixed / cyclical / average |
| 1 | Structurally difficult |
| 0 | Persistently value-destructive industry economics |

Being the best company in a weak sector does not make the industry score high.

---

## 7.2 Company Position Within Industry — 4 Points

### IC-POS-01 — Relative Competitive Position

Evaluate:

- market share;
- cost position;
- distribution;
- product/service quality;
- operating efficiency;
- scale;
- strategic assets.

**Rubric:**

| Score | Standard |
|---:|---|
| 4 | Clear leader with sustainable advantage |
| 3 | Strong top-tier position |
| 2 | Competitive but not advantaged |
| 1 | Weak position |
| 0 | Structurally disadvantaged |

Avoid double-counting moat.

---

## 7.3 Cycle Position — 2 Points

### IC-CYCLE-01 — Cycle Assessment

Possible states:

- `DEPRESSED`
- `EARLY RECOVERY`
- `MID-CYCLE`
- `LATE-CYCLE`
- `PEAK / OVERHEATED`
- `STRUCTURAL DECLINE`
- `NOT CYCLICAL / N.A.`

Scoring logic:

- maximum 2 points is reserved for favorable **normalized forward asymmetry**, not simply strong current momentum;
- peak-cycle profits with poor forward asymmetry should not receive 2/2;
- depressed cycle with sound survivability and improving supply/demand may receive positive credit.

This metric cannot duplicate valuation discount from the same cycle assumption.

---

# 8. Valuation & Forward Return — 20 Points

## 8.1 Primary Valuation Attractiveness — 8 Points

### VAL-PRIMARY-01 — Primary Valuation Assessment

This is a method-selection metric rather than one universal ratio.

Each company must identify:

1. primary valuation method;
2. normalized denominator;
3. base case;
4. conservative case;
5. cross-checks.

### Non-financial mature business

Possible methods:

- normalized P/E;
- EV/EBIT;
- EV/EBITDA where capex distortion is controlled;
- FCF yield;
- DCF / owner earnings.

### Banks

Primary:

- P/B relative to sustainable ROE and cost of equity;
- residual income / justified P/B.

Cross-check:

- P/E;
- dividend yield;
- historical band.

### Real Estate

Primary:

- RNAV / NAV discount;
- normalized project cash flow / earnings.

Cross-check:

- P/B;
- normalized P/E.

### Technology

Primary:

- DCF / owner earnings;
- EV/EBIT;
- P/E for mature profitable businesses.

### Primary valuation scoring rubric

| Score | Standard |
|---:|---|
| 8 | Deeply attractive under conservative normalized assumptions |
| 7 | Very attractive |
| 6 | Attractive |
| 5 | Moderately attractive |
| 4 | Fair |
| 3 | Slightly expensive |
| 2 | Expensive |
| 1 | Very expensive |
| 0 | Clearly overvalued / poor forward return |

A low P/E is not a scoring method by itself.

---

## 8.2 Expected 5-Year Annualized Total Return — 8 Points

### VAL-RET-01 — Expected 5Y Annualized Total Return

Conceptual decomposition:

`fundamental per-share value growth + dividends/distributions + valuation normalization − dilution/leakage`

Where multiple scenarios are modeled, use a probability-weighted or explicitly conservative base case.

Approved base score:

| Expected 5Y annualized return | Base score |
|---|---:|
| ≥22% | 8 |
| 18% to <22% | 7 |
| 15% to <18% | 6 |
| 12% to <15% | 4–5 |
| 8% to <12% | 2–3 |
| <8% | 0–1 |

Within a range:

- use lower point for high uncertainty;
- use upper point only with strong evidence and downside support.

Return above 22% driven primarily by aggressive multiple expansion does not automatically receive 8/8.

### Required components

Record:

- current market price;
- normalized starting earnings/value;
- 5Y growth assumption;
- terminal/exit valuation assumption;
- dividends;
- dilution;
- scenario range;
- source date.

---

## 8.3 Margin of Safety / Downside Asymmetry — 4 Points

### VAL-MOS-01 — Conservative Intrinsic Value Discount

**Formula where point estimate is valid:**

`(conservative intrinsic value − market price) / conservative intrinsic value`

Indicative context:

| Discount | Signal |
|---|---|
| ≥35% | Strong MOS candidate |
| 25–35% | Attractive |
| 15–25% | Moderate |
| 0–15% | Thin |
| <0% | No MOS |

This table is supporting context, not an automatic /4 score.

### VAL-MOS-02 — Downside Case

Required inputs:

- stressed earnings;
- stressed valuation;
- balance-sheet response;
- dilution/refinancing risk;
- asset backing where relevant.

**Rubric:**

| Score | Standard |
|---:|---|
| 4 | Strong discount + contained downside + high evidence quality |
| 3 | Attractive asymmetry |
| 2 | Balanced / fair |
| 1 | Thin MOS / meaningful downside |
| 0 | Poor asymmetry |

---

## 8.4 Valuation Dependency Controls

The following are correlated evidence families:

- P/E, earnings yield and expected-return model using same EPS;
- FCF yield, P/FCF and DCF using same FCF;
- P/B, justified P/B and residual income using same ROE/book-value assumptions;
- EV/EBITDA and EV/EBIT using same enterprise value and operating forecast.

They may serve as cross-checks but cannot be counted as independent proof without distinct information.

---

# 9. Risk & Governance — 10 Points

## 9.1 Governance & Shareholder Alignment — 4 Points

### RG-GOV-01 — Governance Assessment

Evaluate:

- related-party transactions;
- disclosure timeliness;
- financial-reporting quality;
- controlling shareholder behavior;
- minority shareholder treatment;
- board oversight;
- capital-market conduct;
- regulatory sanctions;
- unusual auditor issues.

**Rubric:**

| Score | Standard |
|---:|---|
| 4 | Strong disclosure, alignment and minority treatment |
| 3 | Generally sound, minor concerns |
| 2 | Mixed / recurring concerns |
| 1 | Significant concerns |
| 0 | Serious governance weakness short of hard veto |

A hard veto is handled outside score arithmetic.

### RG-GOV-02 — Reporting Reliability

If accounting or disclosures are insufficiently reliable to underwrite value:

- reduce Confidence;
- potentially trigger Stage 0 pending/fail;
- do not merely subtract one point and continue.

---

## 9.2 Residual Business / Financial Risk — 4 Points

### RG-RISK-01 — Residual Risk Mapping

Use approved Risk Policy residual risk classification:

| Residual Risk | Score |
|---|---:|
| LOW | 4 |
| MODERATE | 3 |
| ELEVATED — controlled | 2 |
| ELEVATED — weakly mitigated / near HIGH | 1 |
| HIGH | 0 |
| UNACCEPTABLE | scoring cannot override veto |

Risk already fully reflected in Financial Health must not be deducted twice.

This category captures residual risk after category-specific analysis.

---

## 9.3 Thesis Uncertainty — 2 Points

### RG-UNC-01 — Thesis Uncertainty

Evaluate:

- forecast range;
- business-model uncertainty;
- data reliability;
- valuation sensitivity;
- dependence on unverified assumptions;
- cyclicality;
- event dependence.

**Rubric:**

| Score | Standard |
|---:|---|
| 2 | Narrow, well-supported thesis range |
| 1 | Material but manageable uncertainty |
| 0 | High uncertainty |

LOW Data Confidence may coexist with 0/2, but Confidence is not mechanically multiplied into score.

---

# 10. Capital Allocation Quality — 5 Points

## 10.1 Reinvestment Discipline — 2 Points

### CA-REINV-01 — Reinvestment Quality

Evaluate:

- reinvestment returns;
- capex discipline;
- acquisition returns;
- divestment discipline;
- balance between growth and distributions.

**Rubric:**

| Score | Standard |
|---:|---|
| 2 | Consistently value-accretive reinvestment |
| 1 | Mixed / acceptable |
| 0 | Repeated low-return or value-destructive reinvestment |

Do not duplicate incremental ROIC points from Growth without distinct capital-allocation evidence.

---

## 10.2 Dividend / Buyback Discipline — 1 Point

### CA-DIST-01 — Distribution Discipline

Award 1 only when management:

- distributes capital when reinvestment returns are unattractive;
- retains capital when high-return reinvestment is available;
- executes buybacks only at sensible valuation;
- maintains balance-sheet resilience.

High dividend yield alone is not positive evidence.

---

## 10.3 Dilution Discipline — 1 Point

### CA-DIL-01 — Economic Dilution

Evaluate:

- repeated equity issuance;
- ESOP / option dilution;
- rights issues;
- acquisition shares;
- conversion;
- issue price versus conservative per-share value;
- proceeds received and returns earned on those proceeds;
- per-share value impact.

**Scoring:**

- 1 = disciplined / value-accretive or economically neutral issuance history;
- 0 = material value-destructive dilution.

Do not score dilution from raw share-count growth alone.

Mechanical share-count changes from splits/bonus shares are not economic dilution.

For rights issues and other capital raises, compare pre- and post-transaction per-share economics using authoritative issue terms. A large increase in shares may still be economically neutral if value/proceeds are transferred proportionally; a small issuance can be harmful if issued materially below value without adequate strategic benefit.

---

## 10.4 Per-Share Value Creation — 1 Point

### CA-PSV-01 — Per-Share Intrinsic Value Outcome

Assess whether management's historical capital decisions increased:

- normalized EPS;
- BVPS;
- FCF/share;
- intrinsic value/share

after adjusting for corporate actions and cycle.

Award 1 only when evidence supports real per-share compounding.

---

# 11. Sector-Specific Metric Set

This section defines minimum principle-equivalent metric families. Exact sector matrices are finalized in `SECTOR_NORMALIZATION.md`.

## 11.1 Banks

Minimum scoring evidence should normally cover:

**Business Quality**
- sustainable ROE/ROTE;
- NIM quality;
- fee-income quality;
- cost-to-income;
- CASA / franchise quality;
- asset-quality-adjusted earnings quality.

**Financial Health**
- CAR/CET1 where available;
- NPL;
- loan-loss coverage;
- funding/LDR/liquidity;
- credit-cost stress resilience.

**Growth**
- loan/deposit growth;
- fee growth;
- BVPS/EPS growth;
- capital consumption;
- incremental risk-adjusted returns.

**Valuation**
- P/B vs sustainable ROE;
- residual income / justified P/B;
- normalized P/E;
- dividends.

**Do not use**
- Debt/Equity as if bank leverage were industrial debt;
- industrial CFO conversion.

---

## 11.2 Real Estate

Minimum evidence:

- net debt;
- debt maturity;
- interest burden;
- unrestricted cash;
- presales;
- backlog;
- collections;
- inventory quality;
- legal/project risk;
- handover timing;
- normalized project margins;
- RNAV realization probability.

Inventory must be decomposed where possible into:

- legally clear/marketable;
- under development;
- delayed/legal-risk;
- land bank;
- completed unsold.

High inventory is not automatically bad; low-quality/unfinanceable inventory is.

---

## 11.3 Technology

Minimum evidence:

- ROIC;
- recurring/repeat revenue;
- margin stability;
- FCF conversion;
- incremental margin;
- customer concentration;
- contract backlog/renewal;
- acquisition dependence;
- employee/talent dependence where material.

Do not penalize low tangible book value by itself.

---

## 11.4 Retail / Consumer

Minimum evidence:

- same-store sales where available;
- store count and store productivity;
- gross/EBIT margin;
- inventory turns/aging;
- working capital;
- CFO conversion;
- store payback / ROIC;
- brand/distribution;
- consumer-cycle resilience.

Revenue growth from store openings with declining mature-store economics receives limited credit.

---

## 11.5 Industrials / Materials

Minimum evidence:

- normalized ROIC;
- mid-cycle margin;
- through-cycle FCF;
- capacity utilization;
- cost curve;
- leverage under trough earnings;
- maintenance capex;
- commodity/input sensitivity.

Spot earnings at cycle peak cannot be used as normalized valuation denominator.

---

# 12. Common Quantitative Definitions

## 12.1 Revenue CAGR

`(Revenue_t / Revenue_t-n)^(1/n) − 1`

Use comparable consolidated revenue.

## 12.2 EPS CAGR

`(Adjusted EPS_t / Adjusted EPS_t-n)^(1/n) − 1`

Use corporate-action-adjusted shares.

If starting EPS ≤0, CAGR is not meaningful; use N/R and alternative trend assessment.

## 12.3 ROE

`NPAT attributable to common shareholders / average common equity`

Use normalized NPAT for scoring.

## 12.4 ROIC

`NOPAT / average invested capital`

Definition must be consistently applied by company/sector.

## 12.5 CFO Conversion

`cumulative CFO / cumulative normalized NPAT`

Prefer multi-year cumulative measure.

## 12.6 FCF

Baseline **issuer-level** non-financial definition:

`company CFO − company capital expenditure required to sustain/grow operations`

This formula refers to the company's financial statements, **not portfolio cash movements**.

If maintenance capex cannot be isolated, disclose whether total capex is used.

Investor BUY/SELL cash, deposits, withdrawals, dividends received, broker fees and taxes must never enter issuer FCF.

## 12.7 Net Debt

`interest-bearing debt − unrestricted cash and cash equivalents`

Do not net restricted cash unless economically available.

## 12.8 Interest Coverage

`normalized EBIT / net interest expense`

Alternative definitions require explicit label.

## 12.9 NPL Ratio

`NPL / gross customer loans`

Follow reported regulatory definition and disclose changes.

## 12.10 Loan-Loss Coverage

`loan-loss reserves / NPL`

Use consistent NPL definition.

## 12.11 CASA Ratio

`current accounts + savings accounts / customer deposits`

Use bank-reported definitions where available.

## 12.12 FCF Yield

`normalized FCF to equity / market capitalization`

or

`FCFF / enterprise value`

Do not mix equity and enterprise denominators.

## 12.13 Earnings Yield

`normalized EPS / price`

Inverse P/E only when earnings are positive and normalized.

## 12.14 Dividend Yield

`expected sustainable issuer cash dividend per share / current market price`

The numerator is a forward issuer-level capital-distribution assumption supported by company/disclosure evidence.

Do **not** use the investor portfolio's last dividend cash receipt as the numerator because receipt amount also depends on quantity held, ex-date eligibility, withholding tax and portfolio history.

Special dividends are excluded unless recurring evidence supports inclusion.

## 12.15 P/B

`market price / current book value per share`

For banks, analyze relative to sustainable ROE/cost of equity.

## 12.16 EV / EBIT

`enterprise value / normalized EBIT`

Enterprise value must use consistent debt/cash definitions.

## 12.17 Margin of Safety

`(conservative intrinsic value − market price) / conservative intrinsic value`

Do not calculate if intrinsic value range is too wide to support meaningful precision.

---

# 13. Missing Data Rules by Metric Type

## 13.1 Core quantitative metric unavailable

Use, in order:

1. principle-equivalent metric;
2. defensible conservative range;
3. N/R with reduced evidence coverage;
4. `NOT RELIABLY SCORABLE` if decision-critical.

## 13.2 Qualitative evidence unavailable

Do not assign neutral/midpoint automatically.

If the assessment cannot be supported, mark N/R and reduce Confidence.

## 13.3 Sector peer data unavailable

Use:

- own-history anchors;
- absolute economics;
- broader listed-sector peers when comparable.

Do not compute meaningless percentiles from tiny samples.

## 13.4 Forward consensus unavailable

Use conservative analyst estimate only when:

- assumptions are explicit;
- source data is current;
- sensitivity is shown.

Otherwise valuation expected-return score may become N/R or total score may be blocked if decision-critical.

---

# 14. Data Freshness Classes

Exact provider-specific thresholds may be refined later, but the baseline methodology is:

| Data type | Preferred freshness |
|---|---|
| Market price | latest valid trading date for current ranking |
| VN30 membership | effective as of analysis date |
| Sector classification | effective as of analysis date |
| Quarterly financials | latest officially available period |
| Annual audited data | latest audited FY when required for audit-quality assessment |
| Management guidance | latest valid disclosure, secondary to official financial facts |
| Consensus estimates | current enough to reflect latest material disclosure |
| Corporate-action terms | authoritative terms effective for affected periods |

If a newer authoritative disclosure is known to exist but not incorporated, the metric must be marked stale/provisional.

---

# 15. Metric Confidence Sensitivity

## High-sensitivity metrics

Missing/weak evidence strongly affects Confidence:

- normalized earnings;
- expected 5Y return;
- intrinsic value;
- NPL/provisioning quality for banks;
- developer debt maturity/legal status;
- corporate-action comparability;
- governance/reporting reliability.

## Medium-sensitivity metrics

- ROIC/ROE;
- margins;
- historical growth;
- FCF conversion;
- market share.

## Low-sensitivity / contextual metrics

- non-critical peer percentiles;
- supplementary ratios;
- secondary valuation cross-checks.

A large number of low-sensitivity missing metrics does not automatically equal a single high-sensitivity missing metric; materiality matters.

---

# 16. Evidence Ownership & Double-Count Map

| Evidence family | Primary home | Common forbidden duplicate |
|---|---|---|
| normalized ROIC/ROE | Business Quality | Capital Allocation without distinct reinvestment evidence |
| historical revenue/EPS growth | Growth | Business Quality solely because growth is high |
| incremental ROIC | Growth | Business Quality unless measuring level/persistence |
| leverage/liquidity | Financial Health | Risk penalty for identical exposure |
| NPL/provisioning | Financial Health / earnings-quality evidence | repeated penalty in every bank subcategory |
| moat | Business Quality | Industry score for identical evidence |
| market share | Industry Position | Moat unless durability economics are shown |
| FCF conversion | Business Quality | Valuation quality reward beyond valuation denominator use |
| cycle position | Industry | Growth + Valuation cycle bonus |
| expected 5Y growth | Growth durability evidence | Expected Return only as model input, not double reward |
| dilution | Capital Allocation | Growth adjustment only; governance only if integrity/alignment issue |
| dividend policy | Capital Allocation | Valuation only via cash return |
| governance event | Risk & Governance | Capital Allocation unless separate economic outcome |
| investor cost basis/P&L | no fundamental category | any fundamental scoring category |

When ambiguity exists, assign one primary home and explain secondary channels.

---

# 17. Scoring Documentation Requirement

Every subcategory score must record:

1. metrics used;
2. metrics unavailable;
3. raw values;
4. normalized values;
5. as-of/reporting periods;
6. source;
7. FACT / ESTIMATE / ASSUMPTION;
8. scoring rationale;
9. point awarded;
10. double-count check;
11. confidence impact;
12. any corporate-action adjustment;
13. any cyclical normalization.

Top-band scores require written justification.

---

# 18. Threshold Governance

The thresholds in v0.1 are **baseline calibration anchors**, not timeless truths.

They may change only through versioned methodology review.

A change must record:

- metric;
- old threshold;
- new threshold;
- reason;
- validation evidence;
- sector impact;
- expected ranking impact;
- whether prior scores are preserved as-calculated or restated.

Thresholds must never be tuned solely to improve hindsight performance.

---

# 19. Validation Requirements for This File

Before production use, `VALIDATION_CASES.md` must test at least:

1. high-ROIC industrial vs high-ROE bank;
2. bank with high ROE but poor NPL/provisioning;
3. developer with low P/E but weak collections/refinancing;
4. materials company at peak earnings;
5. retailer with fast store growth but deteriorating store economics;
6. technology company with low tangible book but high recurring cash economics;
7. high FCF yield + low P/FCF + DCF all driven by one forecast;
8. company with missing critical valuation input;
9. corporate-action-adjusted EPS growth;
10. economic dilution vs mechanical split/bonus shares;
11. high historical growth caused by low base;
12. strong quality but inadequate forward return;
13. issuer CFO correctly separated from portfolio cash ledger;
14. portfolio dividend receipt not double-counted as issuer capital-allocation evidence;
15. unreconciled investor cost basis not leaking into valuation;
16. broker cash mismatch not altering fundamental metrics;
17. split/bonus-share denominator adjustment without false dilution;
18. rights issue with value-accretive vs value-destructive per-share outcome;
19. merger/spinoff with missing authoritative terms causing N/R rather than guessed metrics;
20. portfolio-aware metric cache reproducible from transaction history.

---

# 20. Integrity Re-Review — CIO / Equity Research / Quant / Risk

## 20.1 CIO Review

### Critical issues
- **0 unresolved.**

### Major issues resolved

1. **Issuer cash and portfolio cash were not explicitly separated.**  
   Fixed in §3A.2 and §12.6. Company CFO/FCF comes from issuer financial statements; portfolio cash comes from M2 ledger reconstruction.

2. **Investor cost basis could still enter downstream valuation through implementation shortcuts.**  
   Fixed by §3A.4: investor cost basis has no fundamental scoring home and cannot define cheapness, margin of safety or intrinsic value.

3. **Portfolio-aware analytical metrics lacked a reconstruction prerequisite.**  
   Fixed by §3A.3/§3A.9: portfolio state must be reconstructable and method-versioned before use.

**CIO result:** **PASS — 0 Critical / 0 Major unresolved.**

## 20.2 Equity Research Analyst Review

### Critical issues
- **0 unresolved.**

### Major issues resolved

1. **Corporate-action-adjusted per-share metrics were under-specified.**  
   Fixed by §3.2 and §3A.6. Historical EPS/BVPS/DPS/FCF-share require comparable denominators from issuer restatement or authoritative action terms.

2. **Raw share-count growth could be misclassified as dilution.**  
   Fixed in `CA-DIL-01`: mechanical share changes are separated from economic dilution; rights issues and issuance are assessed by per-share value impact.

3. **Dividend evidence could be double counted between issuer capital allocation, valuation and investor cash receipt.**  
   Fixed by §3A.7 and §12.14.

**Equity Research result:** **PASS — 0 Critical / 0 Major unresolved.**

## 20.3 Quant Analyst Review

### Critical issues
- **0 unresolved.**

### Major issues resolved

1. **Portfolio-derived metric lineage was incomplete.**  
   Fixed by §3A.9 requiring replay/method lineage.

2. **Corporate-action denominator adjustments could become hidden analyst estimates.**  
   Fixed: authoritative issuer restatement/action terms are required; otherwise N/R.

3. **Same economic dividend or cash-flow observation could create multiple independent scoring signals.**  
   Fixed by domain separation and dividend evidence ownership.

4. **Accounting snapshots could silently become source data.**  
   Fixed: any portfolio-derived analytical cache must remain reconstructable from transaction history.

**Quant result:** **PASS — 0 Critical / 0 Major unresolved.**

## 20.4 Risk Manager Review

### Critical issues
- **0 unresolved.**

### Major issues resolved

1. **Cash reconciliation failure did not have explicit metric-layer behavior.**  
   Fixed by §3A.5: portfolio cash-dependent analytics cannot use unreconciled/manual/broker-overwritten cash.

2. **Cost-basis reconstruction failure could contaminate valuation or decision context.**  
   Fixed by cost-basis firewall.

3. **Corporate-action lifecycle errors could create false per-share growth or dilution signals.**  
   Fixed by corporate-action comparability gate; unresolved terms produce N/R/block behavior.

4. **Settlement, broker fee and tax items could leak into issuer fundamental metrics.**  
   Fixed by §3A.8.

5. **Opening portfolio/migration reconstruction was not explicitly tied to portfolio-dependent metrics.**  
   Fixed by §3A.3/§3A.9 through M2 reconstruction prerequisites; unsupported inception cannot be treated as fully reconstructable portfolio state.

**Risk Manager result:** **PASS — 0 Critical / 0 Major unresolved.**

## 20.5 Cross-domain closure

Focused audit result:

| Area | Result |
|---|---|
| Source of truth | PASS |
| Issuer vs portfolio data separation | PASS |
| Double counting | PASS |
| Investor cost-basis firewall | PASS |
| Cash reconciliation boundary | PASS |
| Corporate-action comparability | PASS |
| Dividend evidence separation | PASS |
| Fee/tax/settlement isolation | PASS |
| Portfolio reconstruction dependency | PASS |
| Derived-state reproducibility | PASS |
| Critical unresolved | **0** |
| Major unresolved | **0** |

> **Integrity conclusion: METRIC_DEFINITIONS.md v0.2 has 0 Critical and 0 Major unresolved issues.**

---

# 21. Open Items for Later M3 Files

The following are intentionally deferred:

1. full sector-by-sector metric substitution table;
2. sector-relative percentile methodology;
3. exact peer set construction;
4. bank-specific, developer-specific and cyclical-material scoring matrices;
5. deterministic scorecard schema;
6. ranking tie-break implementation;
7. empirical threshold calibration;
8. synthetic and historical validation cases.

These are not grounds to change the approved 100-point weights.

---

# 22. Approval Gate

Approve `METRIC_DEFINITIONS.md` only if the following are accepted:

1. Metrics are evidence used to assign bounded subcategory scores, not independent additive weights.
2. Thresholds are baseline versioned anchors and require validation before production.
3. Sector-inappropriate metrics must be substituted with principle-equivalent metrics.
4. ROIC is primary for suitable non-financials; sustainable ROE/ROTE is primary for banks.
5. Debt/Equity is prohibited as a universal bank leverage metric.
6. CFO/NPAT is prohibited as an industrial-style bank cash-quality metric.
7. Historical growth must be normalized for cycle, low base, acquisitions and corporate actions.
8. Valuation must use normalized denominators and multiple methods as cross-checks, without double counting.
9. Expected 5Y annualized total return retains the approved /8 scoring bands.
10. Missing data is never automatically 0 or midpoint.
11. Investor cost basis/P&L has no fundamental scoring home.
12. Corporate-action-adjusted per-share comparability is mandatory.
13. Correlated metrics share evidence families and cannot create artificial confirmation.
14. Threshold changes require methodology versioning and validation.
15. Issuer/company cash-flow metrics and investor portfolio cash are separate source domains.
16. Portfolio state may be used only when reconstructable from authoritative M2 transaction history and method version.
17. Investor cost basis, portfolio P&L, broker fees, taxes and settlement have no fundamental scoring home.
18. Corporate-action denominator comparability must be proven or the affected per-share metric is N/R.
19. Dividend cash received by the portfolio cannot substitute for issuer-level dividend policy or sustainable dividend assumptions.
20. The next M3 file will not begin until explicit approval of this file.

---

## Status

> **APPROVED — VERSION 1.0 — 0 CRITICAL / 0 MAJOR UNRESOLVED**
