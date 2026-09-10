# VN30 Value Investing OS — Sector Normalization

**Document:** `03_SCORING/SECTOR_NORMALIZATION.md`  
**Milestone:** 3 — VN30 Scoring Engine  
**Status:** Approved  
**Version:** 1.0  
**Date:** 2026-09-05  
**Governing Documents:**  
- `SCORING_MODEL.md` v1.0
- `03_SCORING/SCORING_ENGINE.md` v0.2 — Approved
- `03_SCORING/METRIC_DEFINITIONS.md` v1.0 — Approved
- `SECTOR_MASTER.md`
- `DATA_MODEL.md`
- `DATA_RULES.md`

---

# 1. Purpose

This document defines how the VN30 Scoring Engine compares companies from structurally different sectors without changing the approved category weights.

The core rule is:

> **Weights stay constant. Economic principles stay constant. Metrics and normalization methods may change by sector.**

Sector normalization must prevent:

- bank leverage from being judged like industrial debt;
- real-estate inventory from being judged like retailer inventory;
- asset-light technology from being penalized for low tangible book value;
- commodity companies from being rewarded for peak-cycle earnings;
- structurally weak sectors from receiving high scores simply because one company is best within a weak peer set;
- structurally advantaged sectors from receiving automatic premium scores without company-specific evidence.

---

# 2. Normalization Architecture

Each category score uses three layers.

## 2.1 Absolute economic anchor

Every company must pass a common cross-sector economic question.

Examples:

- Does the business generate acceptable through-cycle returns?
- Can it survive a severe but plausible stress?
- Does growth increase per-share intrinsic value?
- Is expected forward return adequate?
- Is governance acceptable?

Sector-relative excellence cannot override a failed absolute anchor.

## 2.2 Sector-specific metric translation

Use sector-appropriate measures of the same economic principle.

Example:

| Principle | Bank | Industrial |
|---|---|---|
| Economic return | sustainable ROE/ROTE | normalized ROIC |
| Funding resilience | CAR/CET1, LDR, liquidity | leverage, interest coverage |
| Earnings quality | provisioning/NPL recognition | CFO/NPAT |
| Growth quality | risk-adjusted loan/BVPS growth | revenue/EPS/incremental ROIC |
| Valuation | P/B vs sustainable ROE | normalized P/E, EV/EBIT, FCF yield |

## 2.3 Relative context

Relative comparison may use:

1. same-sector VN30 peers;
2. broader comparable listed Vietnamese peers;
3. own 5Y history;
4. normalized cycle history.

Peer-relative data is supporting evidence, not a substitute for absolute economics.

---

# 3. Peer-Set Rules

## 3.1 Minimum peer-set quality

A peer set must be:

- economically comparable;
- based on similar business models;
- large enough to avoid meaningless percentile ranking;
- current to the analysis date.

## 3.2 Small-sample rule

If the VN30 contains fewer than 4 genuinely comparable companies in a subgroup:

- do not use VN30-only percentile as primary scoring evidence;
- expand to broader listed-sector peers where reliable;
- otherwise use absolute + own-history anchors.

## 3.3 No forced equalization

Sector averages are **not required** to converge.

If banks genuinely have stronger economics than a cyclical materials group at a given time, sector-average scores may differ.

Normalization removes accounting-structure bias; it does not force equal sector scores.

## 3.4 Peer drift

Peer definitions must be versioned.

A company cannot be moved into a more favorable peer group merely to improve its score.

---

# 4. Common Sector-Neutral Principles

All sectors must ultimately be judged on the same seven categories:

1. Business Quality /25
2. Financial Health /15
3. Growth Quality /15
4. Industry & Competitive Position /10
5. Valuation & Forward Return /20
6. Risk & Governance /10
7. Capital Allocation Quality /5

Sector normalization may alter:

- metric selection;
- metric denominator;
- cycle adjustment;
- stress assumptions;
- primary valuation method.

It may **not** alter category weights.

---

# 4A. Source-of-Truth and Portfolio Reconstruction Boundary

Sector normalization changes **how issuer economics are interpreted**. It does not change where facts come from.

## 4A.1 Authoritative data ownership

Sector-specific scoring must consume facts from the approved owner domains:

- issuer financial statements / official disclosures for company fundamentals;
- `Transaction` + `TransactionLeg` for investor portfolio accounting;
- `CorporateActionEvent` + linked immutable transactions for portfolio-changing corporate-action terms/effects;
- effective-dated sector assignments for sector classification;
- effective-dated VN30 membership for eligibility;
- dated market observations for price-based valuation.

`SECTOR_NORMALIZATION.md` must never create a parallel authoritative field for:

- portfolio cash;
- investor quantity;
- investor average/open cost;
- realized/unrealized P&L;
- NAV;
- settlement state;
- corporate-action accounting effects.

## 4A.2 Issuer economics vs investor accounting

Sector normalization operates primarily on **issuer/company economics**.

Examples:

- bank NPL, CAR, ROE;
- developer inventory, presales, debt;
- retailer inventory turns;
- technology FCF;
- materials mid-cycle margin.

These must not be confused with investor portfolio accounting such as:

- portfolio cash;
- average purchase cost;
- realized P&L;
- dividend cash received;
- broker fees/taxes.

Investor accounting context has no fundamental scoring home.

## 4A.3 Portfolio-aware ranking gate

If sector-normalized scores are later combined with portfolio context for Top-10 or allocation ranking, portfolio state must first be reconstructable under M2.

Required portfolio integrity status:

- ledger reconstruction = PASS;
- cash reconciliation = PASS or non-material exception;
- cost-basis reconstruction = PASS when cost/P&L context is displayed;
- corporate-action reconciliation = PASS when relevant;
- supported inception = PASS;
- valuation-quality state = acceptable.

If any material item is `BLOCKED`:

- issuer-level sector-normalized score may remain valid;
- portfolio-aware actionability must be blocked;
- no portfolio exposure, cash availability, concentration or cost-based context may be inferred from stale/manual state.

## 4A.4 Cost-basis firewall

Sector normalization must never use investor cost basis as:

- a valuation denominator;
- a margin-of-safety reference;
- evidence that a stock is cheap/expensive;
- a sector-relative anchor;
- a reason to upgrade/downgrade a score.

The investor's historical purchase price is not issuer intrinsic value.

## 4A.5 Cash reconciliation firewall

Any later sector-aware portfolio overlay using cash must use reconstructed M2 cash state.

Forbidden:

- broker statement overwrite;
- manually typed `current_cash`;
- planned DCA as actual cash;
- unsettled receivable treated as settled cash;
- unmatched settlement;
- unreproducible dashboard snapshot.

Sector normalization itself must not alter cash-related facts.

## 4A.6 Corporate-action comparability

Sector-specific metrics that use historical per-share or segment data require corporate-action comparability.

This includes:

- EPS/BVPS/DPS/FCF per share;
- share-count dilution;
- store/shareholder value per share;
- bank BVPS growth;
- developer NAV/share;
- technology FCF/share;
- conglomerate SOTP/share.

Use, in order:

1. issuer-restated comparable series;
2. authoritative corporate-action terms;
3. defensible reconstruction from approved event history.

If comparability cannot be established:

- affected metric = `N/R`;
- category confidence is reduced;
- category/total may become `NOT RELIABLY SCORABLE` if material.

No guessed continuity is permitted.

## 4A.7 Corporate-action accounting non-duplication

For portfolio accounting context, a corporate action must affect:

- quantity once;
- cash once;
- cost basis once;
- realized P&L once where applicable.

Sector normalization must never infer those effects from:

- current share count;
- adjusted price charts;
- issuer headline share capital;
- broker balance snapshots.

It may only consume reconciled M2 outputs.

## 4A.8 Derived-state reproducibility

Any sector-normalized record that later stores portfolio-aware context must record enough lineage to reproduce that state:

> security_id → sector assignment/version → analysis_as_of → portfolio_id (if used) → replay/reconstruction version → market-price timestamp → normalization method version

Deleting the cached scorecard must not destroy reconstruction capability.

---

# 5. Banks

## 5.1 Business Quality

Primary evidence:

- sustainable ROE/ROTE;
- normalized NIM;
- cost-to-income;
- fee-income quality;
- CASA/funding franchise;
- asset-quality-adjusted earnings;
- franchise durability.

### Normalization rules

High ROE receives reduced credit when driven by:

- under-provisioning;
- unusually low credit cost;
- aggressive loan growth;
- low capital buffers;
- temporary NIM expansion.

Use multi-year normalized credit cost when current provisioning is abnormally low/high.

## 5.2 Financial Health

Primary evidence:

- CET1/common-equity ratio where available;
- CAR;
- NPL ratio;
- special-mention/problem loans where disclosed;
- loan-loss coverage;
- LDR;
- liquidity/funding concentration;
- deposit franchise;
- stress capital resilience.

### Prohibited substitutions

Do not use:

- Debt/Equity;
- current ratio;
- industrial interest-coverage formula;
- CFO/NPAT.

## 5.3 Growth

Reward:

- loan growth with stable/improving credit quality;
- fee-income growth;
- BVPS growth;
- per-share earnings growth;
- deposit growth supporting funding;
- capital-efficient growth.

Penalize:

- growth requiring repeated equity raises;
- loan growth with worsening NPL/provisioning;
- growth driven by temporary credit-cycle looseness.

## 5.4 Valuation

Primary:

- P/B versus sustainable ROE and cost of equity;
- residual income / justified P/B.

Cross-check:

- normalized P/E;
- sustainable dividend yield;
- own-history valuation.

Low P/B is not cheap if sustainable ROE is weak or asset quality is overstated.

## 5.5 Risk

Key sector risks:

- credit cycle;
- property exposure;
- concentration;
- regulatory capital;
- funding concentration;
- recognition/provisioning quality;
- related-party lending.

---

# 6. Real Estate Developers

## 6.1 Business Quality

Primary evidence:

- project execution;
- land-bank quality;
- legal-clearance capability;
- presales conversion;
- collection quality;
- project economics;
- normalized ROE;
- brand/distribution;
- access to financing without excessive leverage.

Reported gross margin alone is insufficient.

## 6.2 Financial Health

Primary:

- net debt;
- net debt/equity;
- cash;
- debt maturity ladder;
- interest burden;
- refinancing dependence;
- secured debt;
- presale liabilities;
- project-level funding.

### Inventory normalization

Classify inventory where possible:

- legally clear/marketable;
- active construction;
- completed unsold;
- delayed/legal risk;
- land bank;
- speculative/low-visibility.

High inventory is not automatically negative.

Low-quality, legally blocked or highly leveraged inventory is.

## 6.3 Growth

Use:

- normalized presales;
- backlog;
- collections;
- deliveries;
- project launches with legal readiness;
- NAV growth;
- per-share value creation.

Do not reward a handover spike from timing alone.

## 6.4 Valuation

Primary:

- conservative RNAV;
- normalized project cash-flow value.

Cross-check:

- P/B;
- normalized P/E.

RNAV must haircut:

- legal uncertainty;
- execution delay;
- funding/refinancing risk;
- tax/fees;
- minority interests;
- realization timing.

A large headline RNAV discount without realizability is not a strong MOS.

## 6.5 Risk

Key risks:

- legal approvals;
- refinancing;
- bond maturity;
- project concentration;
- related-party transactions;
- presale collection;
- regulatory changes.

---

# 7. Technology / IT Services

## 7.1 Business Quality

Primary:

- ROIC;
- recurring/repeat revenue;
- customer retention;
- margin quality;
- FCF conversion;
- incremental margin;
- employee productivity;
- intellectual capital;
- customer concentration.

Low tangible assets are not a weakness by themselves.

## 7.2 Financial Health

Primary:

- net cash/debt;
- cash conversion;
- acquisition leverage;
- working-capital profile;
- recurring cash generation.

## 7.3 Growth

Use:

- organic revenue growth;
- recurring revenue growth;
- backlog/contract visibility;
- international expansion;
- incremental margin;
- incremental ROIC.

Acquisition-driven growth must be separated from organic growth.

## 7.4 Valuation

Primary:

- DCF / owner earnings;
- EV/EBIT;
- normalized P/E.

Cross-check:

- FCF yield;
- historical multiple relative to growth quality.

High growth does not justify unlimited terminal multiple expansion.

## 7.5 Risk

Key risks:

- customer concentration;
- talent retention;
- wage inflation;
- technological disruption;
- acquisition integration;
- FX exposure.

---

# 8. Retail / Consumer

## 8.1 Business Quality

Primary:

- same-store sales;
- mature-store economics;
- gross/EBIT margins;
- inventory turns;
- brand;
- distribution;
- pricing power;
- working-capital economics.

## 8.2 Financial Health

Primary:

- net debt/EBITDA;
- lease-adjusted leverage where material;
- interest coverage;
- liquidity;
- inventory financing dependence.

Lease treatment must be consistent across peers.

## 8.3 Growth

Separate:

- same-store growth;
- new-store growth;
- acquisition growth;
- price inflation.

New store expansion receives high credit only if:

- payback is attractive;
- mature-store productivity is stable;
- cannibalization is controlled;
- working capital does not deteriorate materially.

## 8.4 Valuation

Primary:

- normalized P/E;
- EV/EBIT;
- DCF.

Cross-check:

- FCF yield.

Do not annualize a temporary consumer rebound as permanent growth.

## 8.5 Risk

Key risks:

- discretionary-demand cycle;
- inventory obsolescence;
- supplier concentration;
- store saturation;
- execution risk;
- consumer credit exposure where applicable.

---

# 9. Industrials

## 9.1 Business Quality

Primary:

- normalized ROIC;
- margin stability;
- backlog quality;
- customer concentration;
- cost position;
- maintenance-capex intensity;
- cash conversion.

## 9.2 Financial Health

Use:

- net debt/normalized EBITDA;
- interest coverage;
- liquidity;
- debt maturity;
- working-capital stress.

## 9.3 Growth

Distinguish:

- organic capacity growth;
- backlog conversion;
- M&A;
- cyclical rebound.

Reward growth only if incremental ROIC remains attractive.

## 9.4 Valuation

Use:

- normalized P/E;
- EV/EBIT;
- EV/EBITDA when capex distortion is controlled;
- FCF yield;
- DCF.

## 9.5 Risk

Key risks:

- customer concentration;
- capex cycle;
- input cost;
- construction/execution;
- receivables;
- FX.

---

# 10. Materials / Commodities

## 10.1 Mandatory cycle normalization

Spot earnings must never be the only scoring denominator.

Use, where possible:

- 5–10Y mid-cycle margin;
- normalized commodity spread;
- normalized utilization;
- cost-curve position;
- through-cycle ROIC;
- through-cycle FCF.

## 10.2 Business Quality

Reward:

- low-cost production;
- durable resource/assets;
- strong cost curve;
- efficient capital base;
- cycle-surviving balance sheet.

Do not treat commodity price strength as moat.

## 10.3 Financial Health

Use trough or normalized EBITDA for leverage.

Peak-cycle leverage ratios are not sufficient.

## 10.4 Growth

Capacity expansion earns credit only when:

- returns exceed cost of capital under normalized prices;
- balance sheet remains resilient;
- demand/supply economics support the investment.

## 10.5 Valuation

Primary:

- normalized earnings;
- mid-cycle EV/EBITDA/EV/EBIT;
- replacement value where defensible;
- normalized FCF yield.

Peak P/E may look low because earnings are temporarily high; this is a value-trap risk.

## 10.6 Cycle scoring

The favorable-cycle component remains capped within Industry Cycle Position /2.

Commodity momentum cannot become a fundamental score driver.

---

# 11. Utilities / Infrastructure

## 11.1 Business Quality

Primary:

- regulated/contracted return quality;
- utilization;
- asset availability;
- concession duration;
- operating efficiency;
- cash-flow stability.

## 11.2 Financial Health

Use:

- project/corporate leverage;
- DSCR where available;
- interest coverage;
- maturity profile;
- refinancing;
- currency mismatch.

High leverage may be acceptable only when cash flows are contractually stable and sufficiently covered.

## 11.3 Growth

Use:

- committed projects;
- capacity additions;
- tariff framework;
- demand growth;
- reinvestment returns.

## 11.4 Valuation

Use:

- DCF;
- EV/EBITDA with leverage/capex context;
- dividend yield only when sustainable.

---

# 12. Energy / Fuel Distribution

Where applicable, distinguish:

- upstream commodity exposure;
- refining margin exposure;
- regulated/distribution economics;
- inventory-price effects.

Normalize:

- crack spreads;
- inventory gains/losses;
- commodity price impacts;
- regulated margins.

Inventory gains from price increases are not recurring business-quality evidence.

---

# 13. Non-Bank Financial Services

For securities, insurance or other financial services, do not mechanically apply bank rules.

## 13.1 Securities / Brokerage

Possible metrics:

- ROE through cycle;
- recurring fee income;
- market-share economics;
- proprietary-trading dependence;
- margin-loan concentration;
- liquidity/capital adequacy;
- earnings sensitivity to market turnover.

Valuation:

- P/B / P/E relative to sustainable through-cycle ROE.

Peak bull-market brokerage earnings must be normalized.

## 13.2 Insurance

Possible metrics:

- underwriting profitability;
- combined ratio;
- reserve adequacy;
- investment income quality;
- solvency capital;
- premium growth quality.

Financial-health and valuation methods must reflect insurance balance-sheet economics.

---

# 14. Conglomerates / Diversified Holdings

Use a look-through approach.

## 14.1 Business Quality

Assess major economic subsidiaries/business segments rather than relying solely on consolidated headline ratios.

## 14.2 Financial Health

Separate:

- holding-company debt;
- operating-company debt;
- recourse/non-recourse obligations;
- subsidiary cash not freely distributable.

Do not net subsidiary cash against holding-company debt unless the cash is legally/economically distributable and the normalization method explicitly permits it.

Look-through debt/cash figures must come from issuer disclosures, not investor portfolio cash state.

## 14.3 Valuation

Use:

- sum-of-the-parts / NAV where appropriate;
- holding-company debt;
- tax/leakage;
- minority interests;
- reasonable holding discount.

A historical holding discount is not automatically a margin of safety.

---

# 15. Cross-Sector Quantitative Normalization

## 15.1 Percentile method

Percentiles may be used only as supporting context.

Suggested interpretation:

- ≥80th percentile: strong relative signal;
- 60–80th: above average;
- 40–60th: neutral;
- 20–40th: below average;
- <20th: weak.

No score is assigned from percentile alone.

## 15.2 Own-history percentile

Own-history valuation/economic metrics are useful when accounting definitions remain comparable.

Historical percentiles must not include future data in point-in-time backtests.

## 15.3 Winsorization

For peer analytics, extreme values may be winsorized for display/calibration only.

Raw values must remain preserved.

Winsorization must not hide an actual extreme risk in individual scoring.

---

# 16. Cycle Normalization Framework

Every sector receives one of:

- `NON_CYCLICAL`
- `MILDLY_CYCLICAL`
- `CYCLICAL`
- `HIGHLY_CYCLICAL`

## 16.1 Required treatment for CYCLICAL/HIGHLY_CYCLICAL

Use:

- multi-year median/normalized earnings;
- normalized margin;
- normalized utilization;
- stress/down-cycle leverage;
- conservative exit multiple.

## 16.2 Peak-cycle flag

Set `PEAK_CYCLE_RISK` when:

- margins materially exceed long-run normal;
- commodity spreads are unusually favorable;
- credit costs are unusually low;
- inventory gains materially support earnings;
- demand is clearly above sustainable capacity.

Peak-cycle flag must affect normalization and Confidence, not simply deduct arbitrary points.

## 16.3 Trough-cycle treatment

Trough earnings must also be normalized.

The system must not use depressed current earnings to make valuation artificially expensive if the business has strong survivability and credible normalized recovery.

Normalization is symmetric.

---

# 17. Sector-Specific Stress Tests

Minimum stress concepts:

| Sector | Core stress |
|---|---|
| Banks | NIM compression + higher credit cost + capital consumption |
| Real Estate | delayed sales/handover + refinancing shock |
| Technology | growth slowdown + margin pressure + concentration loss |
| Retail | SSS decline + inventory/working-capital stress |
| Industrials | backlog/revenue decline + margin compression |
| Materials | trough commodity price + utilization decline |
| Utilities | tariff/demand shock + financing cost |
| Securities | market turnover collapse + proprietary loss |
| Insurance | adverse claims/reserving + investment-income decline |

Stress scenarios are not forecasts. They test resilience.

---

# 18. Missing Sector-Specific Data

If a sector metric is unavailable:

1. use a principle-equivalent substitute;
2. use own-history/absolute evidence;
3. mark N/R if still unsupported;
4. block category/score when decision-critical.

Missing-data weight is never redistributed.

A sector with poor disclosure must not become easier to score.

---

# 19. Cross-Sector Double-Count Controls

## 19.1 Bank asset quality

NPL, coverage and credit cost are related.

They may inform multiple economic questions, but cannot create independent full rewards/penalties in:

- Business Quality;
- Financial Health;
- Risk

without distinct channels.

## 19.2 Real-estate legal/funding risk

Legal delay may affect:

- cash conversion;
- growth timing;
- RNAV;
- risk.

Use distinct economic effects; do not deduct the same uncertainty four times.

## 19.3 Retail store growth

Store count, revenue growth and total profit growth are correlated.

Growth scoring must emphasize mature-store economics + incremental returns.

## 19.4 Commodity cycle

Spot price, margin, EPS and P/E are one cycle-linked evidence family.

Do not reward all four independently.

## 19.5 Technology recurring revenue

Recurring revenue may support moat, growth visibility and valuation inputs, but must not create three independent maximum scores without distinct evidence.

---

# 20. Corporate Actions and Sector Normalization

Sector normalization must consume corporate-action-comparable company metrics.

Examples:

- stock splits: adjust per-share history; no economic dilution;
- rights issues: evaluate capital raised, issue terms and per-share value impact;
- mergers/spinoffs: segment/financial history may become incomparable;
- large acquisitions: distinguish organic from acquired growth;
- disposals: restate historical earning power where appropriate;
- bonus shares/stock dividends: adjust denominators without automatically treating them as value creation or dilution;
- conversions/ESOP/private placements: assess economic dilution, not only share-count change.

## 20.1 Issuer comparability vs portfolio accounting

Issuer-level normalization asks whether company historical metrics are economically comparable.

Portfolio accounting asks how the investor's quantity, cash and basis changed.

These are related but separate questions.

A valid issuer-level adjustment must not be treated as an accounting posting.

A valid accounting posting must not automatically determine issuer-level economic dilution or value creation.

## 20.2 Required action-term evidence

For material actions, the normalization record should identify:

- action type;
- effective date;
- ratio/issue terms;
- cash consideration where applicable;
- issuer restatement availability;
- whether historical denominators were adjusted;
- whether per-share value transfer occurred;
- confidence impact.

## 20.3 Multi-stage action safeguard

Announcement, entitlement, exercise, share credit and settlement may occur at different times.

Sector normalization must not:

- use announced-but-not-effective terms as if completed;
- count an action twice because issuer reporting and portfolio settlement occur on different dates;
- treat settlement cash as new issuer growth/earnings;
- treat a split quantity increase as investor purchase or issuer economic growth.

If historical comparability cannot be established, use N/R/conservative ranges rather than fabricated continuity.

---

# 20A. Cross-Domain Double-Counting Controls

## 20A.1 Banks

The same asset-quality deterioration may affect:

- earnings quality;
- financial health;
- residual risk.

Do not apply three full independent penalties from one NPL/provisioning observation.

Use:

- Business Quality for recognition/earnings-quality impact;
- Financial Health for solvency/capital resilience;
- Risk only for residual uncertainty not already captured.

## 20A.2 Real Estate

The same legal delay may affect:

- presales conversion;
- debt/refinancing;
- RNAV;
- risk.

Score distinct economic channels only.

A single delayed project cannot receive four identical penalties under different labels.

## 20A.3 Retail

Inventory deterioration may affect:

- cash conversion;
- financial health;
- risk.

Avoid independently penalizing inventory days, working capital, CFO and liquidity when they are manifestations of the same root cause unless separate effects are documented.

## 20A.4 Materials

Commodity price, margin, EPS and valuation multiple are highly correlated.

Normalize the cycle first; do not reward/penalize each raw manifestation independently.

## 20A.5 Conglomerates

Holding-company discount, subsidiary valuation discounts and minority-interest haircuts must not all represent the same economic leakage.

Each haircut must have a separate rationale.

## 20A.6 Portfolio accounting facts

The following have no sector-normalization scoring home:

- investor cost basis;
- investor realized/unrealized P&L;
- portfolio cash;
- broker fee/tax;
- trade settlement;
- DCA contribution/deployment.

They may appear only in portfolio context outside the fundamental sector-normalized score.

---
# 21. Calibration Safeguards

Before production ranking:

1. calculate category-score distribution by sector;
2. inspect median and dispersion;
3. identify structural metric bias;
4. inspect top/bottom outliers manually;
5. verify differences are economic, not accounting artifacts;
6. validate against synthetic cases;
7. freeze methodology version.

Do **not** force sector medians to identical values.

---

# 22. Standard Sector Normalization Record

Each scorecard should later record:

- Ticker
- Sector
- Sector subgroup
- Sector-normalization method version
- Primary peer set
- Absolute anchors used
- Sector-specific metric substitutions
- Cycle classification
- Cycle normalization method
- Stress scenario
- Missing sector metrics
- Corporate-action comparability
- Double-count flags
- Analyst rationale

---

# 22A. Required Integrity Validation Cases

`VALIDATION_CASES.md` must include:

1. bank with high ROE caused by weak provisioning;
2. developer with large RNAV discount but blocked project/legal cash realization;
3. materials company with low spot P/E at peak-cycle earnings;
4. retailer with high inventory, weak CFO and low liquidity without triple-counting one root cause;
5. technology company with acquisition-driven growth separated from organic growth;
6. stock split preserving per-share comparability without false dilution;
7. rights issue assessed by per-share economics rather than share-count increase alone;
8. merger/spinoff with missing terms causing N/R;
9. broker cash mismatch leaving sector-normalized issuer score unchanged but blocking portfolio-aware actionability;
10. unreconciled investor cost basis not affecting valuation score;
11. portfolio-aware sector ranking reproducible from transaction history;
12. corporate-action multi-stage settlement not counted as issuer growth or investor purchase twice.

---
# 23. Integrity Re-Review — CIO / Equity Research / Quant / Risk

## 23.1 CIO

### Critical
- **0 unresolved.**

### Major issues resolved
1. **Sector normalization could consume portfolio/accounting facts without an explicit source-of-truth boundary.** Fixed by §4A.
2. **Investor cost basis could leak into sector-relative valuation or ranking.** Fixed by cost-basis firewall.
3. **Portfolio-aware rankings could be produced from stale/manual portfolio state.** Fixed by reconstruction gate and lineage requirements.

**Result:** **PASS — 0 Critical / 0 Major unresolved.**

## 23.2 Equity Research Analyst

### Critical
- **0 unresolved.**

### Major issues resolved
1. **Issuer-level corporate-action comparability and investor accounting were not explicitly separated.** Fixed by §20.1.
2. **Share-count changes could still be misread as growth/dilution across sectors.** Fixed with action-term evidence and per-share comparability rules.
3. **Cross-sector root causes could be penalized repeatedly under multiple category labels.** Fixed by §20A.

**Result:** **PASS — 0 Critical / 0 Major unresolved.**

## 23.3 Quant Analyst

### Critical
- **0 unresolved.**

### Major issues resolved
1. **Portfolio-aware sector outputs lacked replay/version lineage.** Fixed by §4A.8.
2. **Corporate-action adjustments could create hidden restatement assumptions.** Fixed: issuer restatement or authoritative terms required; otherwise N/R.
3. **Correlated sector metrics could create artificial score dispersion.** Fixed by cross-domain double-count controls.
4. **Peer-normalized outputs could silently mix issuer and portfolio data domains.** Explicitly prohibited.

**Result:** **PASS — 0 Critical / 0 Major unresolved.**

## 23.4 Risk Manager

### Critical
- **0 unresolved.**

### Major issues resolved
1. **Cash-reconciliation failure lacked explicit sector-ranking behavior.** Fixed: issuer score remains separate; portfolio-aware actionability is blocked.
2. **Cost-basis reconstruction failure could contaminate valuation context.** Fixed by firewall.
3. **Corporate-action accounting effects could be inferred from current share count/adjusted price data.** Explicitly prohibited.
4. **Unsupported opening/reconstruction state could still feed concentration/cash overlays.** Fixed by §4A.3.
5. **Multi-stage corporate actions could be double-counted across issuer normalization and portfolio settlement.** Fixed by §20.3.

**Result:** **PASS — 0 Critical / 0 Major unresolved.**

## 23.5 Cross-domain closure

| Area | Result |
|---|---|
| Source of truth | PASS |
| Issuer vs portfolio data separation | PASS |
| Double counting | PASS |
| Cost-basis firewall | PASS |
| Cash reconciliation boundary | PASS |
| Corporate-action comparability | PASS |
| Multi-stage corporate-action handling | PASS |
| Portfolio reconstruction dependency | PASS |
| Derived-state reproducibility | PASS |
| Critical unresolved | **0** |
| Major unresolved | **0** |

> **Integrity conclusion: `SECTOR_NORMALIZATION.md` v0.2 has 0 Critical and 0 Major unresolved issues.**

---

# 24. Open Items for Later M3 Files

Deferred:

1. scorecard implementation schema;
2. deterministic ranking tie-breaks;
3. empirical sector-distribution calibration;
4. validation cases against actual/synthetic companies;
5. final threshold tuning after validation.

No deferred item permits a weight change without governance.

---

# 25. Approval Gate

Approve `SECTOR_NORMALIZATION.md` only if:

1. Category weights remain fixed across sectors.
2. Sector-specific metrics measure principle-equivalent economics.
3. Absolute anchors override purely relative ranking.
4. Small VN30 peer groups cannot use misleading percentiles.
5. Sector averages are not forced to equality.
6. Banks never use industrial Debt/Equity/CFO rules as primary financial-health/cash-quality metrics.
7. Real-estate RNAV is adjusted for legal, financing and realization risk.
8. Technology is not penalized for low tangible assets by itself.
9. Retail growth requires acceptable store economics.
10. Industrials/materials use cycle-normalized earnings.
11. Peak-cycle earnings do not create artificial cheapness.
12. Trough-cycle earnings are also normalized symmetrically.
13. Corporate actions/acquisitions must preserve historical comparability or produce N/R.
14. Sector-specific missing data is never automatically neutral.
15. Correlated sector metrics cannot be independently double-counted.
16. Peer sets and normalization methods are versioned.
17. Sector normalization never creates a second source of truth for cash, quantity, cost basis, P&L, NAV or corporate-action accounting effects.
18. Portfolio-aware sector ranking requires reconstructable M2 state and acceptable reconciliation status.
19. Investor cost basis and portfolio P&L never influence sector-normalized fundamental valuation.
20. Issuer-level corporate-action normalization and investor accounting remain separate but consistent.
21. Corporate-action comparability must be proven or affected metrics become N/R.
22. Derived portfolio-aware sector outputs remain reproducible from transaction history and method versions.
23. The next M3 file will not begin until explicit approval.

---

## Status

> **APPROVED — VERSION 1.0 — 0 CRITICAL / 0 MAJOR UNRESOLVED**
