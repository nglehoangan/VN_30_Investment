# VN30 Value Investing OS — Scoring Engine

**Document:** `03_SCORING/SCORING_ENGINE.md`  
**Milestone:** 3 — VN30 Scoring Engine  
**Status:** Draft for Approval  
**Version:** 0.2  
**Date:** 2026-09-05  
**Primary Constitutional Baseline:** `SCORING_MODEL.md` v1.0  
**Governing Documents:** `INVESTMENT_POLICY.md` v1.1, `RISK_POLICY.md` v1.0, `DECISION_FRAMEWORK.md` v1.0  
**Data Contracts:** `DATA_MODEL.md`, `DATA_RULES.md`

---

# 1. Purpose

This document defines the operational architecture for turning the approved Milestone-1 scoring constitution into a repeatable, auditable VN30 scoring process.

The engine must:

- score every reliably scorable current VN30 constituent on a 0–100 Investment Score;
- preserve comparability across sectors without forcing inappropriate common metrics;
- separate business quality, financial resilience, growth quality, industry position, valuation, residual risk/governance, and capital allocation;
- preserve the distinction between FACT, ESTIMATE, and ASSUMPTION;
- prevent missing or stale data from being silently converted into numeric zero or neutral points;
- prevent technical analysis or money flow from dominating long-term fundamental attractiveness;
- produce a reproducible ranking input for Milestone 4 without directly mapping scores to BUY / HOLD / SELL;
- retain sufficient lineage to explain every category score and every material score change.

The engine is a **decision-support layer**, not a decision authority.

A high score cannot override:

1. Stage 0 failure;
2. a hard Risk Policy veto;
3. insufficient evidence;
4. binding portfolio or concentration constraints;
5. ownership-state rules;
6. execution constraints;
7. a documented decision-framework override.

---

# 2. Review of the Approved Scoring Constitution

## 2.1 Constitutional weights

Milestone 3 must implement the approved seven-category architecture:

| Category | Weight |
|---|---:|
| Business Quality | 25 |
| Financial Health | 15 |
| Growth Quality | 15 |
| Industry & Competitive Position | 10 |
| Valuation & Forward Return | 20 |
| Risk & Governance | 10 |
| Capital Allocation Quality | 5 |
| **Investment Score** | **100** |

These weights are frozen for M3 implementation unless a formal constitution change is approved.

## 2.2 Design delta versus the initial M3 proposal

The M3 kickoff proposed an illustrative architecture containing:

- Market / Money Flow = 3 points;
- Technical Entry Quality = 2 points;
- Risk Adjustment = 5 points;
- Business Quality = 30 points;
- Valuation = 25 points.

This differs from the approved `SCORING_MODEL.md` v1.0.

Because the kickoff explicitly allows the initial framework to be adjusted and requires compliance with approved M1 documents, the engine resolves the delta as follows:

- **Market / Money Flow remains outside the permanent 100-point Investment Score.**
- **Technical Entry Quality remains outside the permanent 100-point Investment Score.**
- Both are retained as separate M4 timing / execution overlays.
- Risk remains represented through the approved **Risk & Governance /10**, category gates, Stage 0 and Risk Policy vetoes.
- Business Quality remains /25 and Valuation & Forward Return remains /20.
- Capital Allocation Quality remains a distinct /5 category to prevent governance and management capital-allocation evidence from being mixed.

This is an implementation of the approved constitution, not a weight change.

## 2.3 Conflict assessment

**No unresolved Critical conflict** has been identified between the approved M1 scoring constitution and the M2 data contracts.

The key implementation boundary is:

> M2 owns data truth, effective dating, quality state, versioning and provenance.  
> M3 owns score construction from those inputs.  
> M3 must not repair missing M2 truth by guessing.

---

# 3. Scoring Architecture

The engine has five logical layers.

## Layer 0 — Eligibility and scoreability gate

Before a stock receives an actionable score:

1. Resolve current VN30 membership as of the analysis date.
2. Resolve sector classification using the effective-dated sector master.
3. Evaluate Stage 0.
4. Check hard-veto status.
5. Check whether all decision-critical scoring inputs are sufficiently current and reliable.
6. Assign initial Score Validity Status.

Possible results:

- `VALID — ACTIONABLE`
- `VALID — NON-ACTIONABLE`
- `RESEARCH ONLY`
- `NOT RELIABLY SCORABLE`

A definitive Stage 0 fail may terminate positive ranking.

## Layer 1 — Evidence normalization

For every metric or assessment, store:

- metric / assessment name;
- economic principle;
- raw value;
- normalized value where applicable;
- unit;
- source;
- reporting period;
- as-of date;
- received / captured date where available;
- source quality;
- FACT / ESTIMATE / ASSUMPTION label;
- methodology version;
- adjustment note;
- missing-data state.

Normalization must occur **before** point assignment.

## Layer 2 — Category scoring

Each of the seven approved categories is scored independently using:

- sector-appropriate quantitative metrics;
- bounded qualitative assessments;
- absolute anchors;
- peer / own-history context when statistically defensible;
- cycle normalization when required.

## Layer 3 — Score controls and confidence

Apply:

- category gates;
- no-compensating-score rule;
- double-count checks;
- cyclical-normalization checks;
- evidence sufficiency checks;
- confidence assessment;
- score-validity assessment.

Confidence is **not** a multiplier on the 100-point score.

## Layer 4 — Ranking and decision overlays

The raw Investment Score is then displayed together with:

- Score Validity;
- Confidence;
- Residual Risk;
- expected 5-year annualized total return;
- valuation assessment;
- Market / Money Flow overlay;
- Technical Entry overlay;
- portfolio exposure;
- sector concentration;
- opportunity-cost context.

Portfolio, Market Flow and Technical overlays may affect ranking tie-breaks or later action, but do not rewrite the fundamental Investment Score.

Portfolio-aware overlays are permitted only when the underlying portfolio state passes the accounting-integrity contract in §3A.

---

# 3A. Accounting Integrity & Source-of-Truth Boundary

Milestone 3 does not own portfolio accounting.

The scoring engine must **consume** authoritative or reproducibly derived M2 state; it must never create a parallel cash, quantity, cost-basis, P&L, corporate-action or NAV truth.

## 3A.1 Authoritative ownership

For portfolio-changing economic facts:

- `Transaction` owns immutable event facts.
- `TransactionLeg` owns authoritative posted balance effects.
- linked `CorporateActionEvent` terms supply event-specific terms when required.
- the approved accounting / cost-basis method version supplies reconstruction semantics.
- `Position`, `CashBalance`, NAV, allocation, P&L and similar states are derived outputs only.
- broker statements and reconciliation observations are evidence, never replacement accounting truth.

The scoring engine must never persist or edit a competing authoritative field for current cash, security quantity, average cost, open cost, realized P&L, unrealized P&L, unsettled receivable/payable, portfolio NAV, portfolio weight or sector weight.

## 3A.2 Reconstruction prerequisite for portfolio-aware outputs

Before M3 uses any portfolio-dependent field for Top-10 capital-allocation ranking, portfolio exposure, sector concentration, position affordability, ownership-state context, opportunity-cost comparison or cash-availability context, the portfolio state must be reconstructable for the relevant `as_of` timestamp from:

1. posted `Transaction` headers;
2. posted `TransactionLeg` rows;
3. linked corporate-action terms when applicable;
4. the applicable versioned accounting / cost-basis policy;
5. a valid supported inception state or explicit auditable `OPENING_BALANCE` migration.

If reconstruction is incomplete, inconsistent or unsupported:

- the **security-level fundamental Investment Score may still be calculated** if company evidence is sufficient;
- portfolio-dependent overlays must be marked `BLOCKED — PORTFOLIO STATE UNRECONCILED`;
- the security cannot be presented as an actionable portfolio-aware Top-10 allocation candidate until the blocking accounting issue is resolved.

This separation prevents an accounting defect from corrupting a valid company score while preventing capital allocation from using invalid portfolio state.

## 3A.3 Required accounting integrity state

Each portfolio-aware scoring run must consume an integrity status with, at minimum:

- `ledger_reconstruction_status`;
- `cash_reconciliation_status`;
- `cost_basis_reconstruction_status`;
- `corporate_action_reconciliation_status`;
- `supported_inception_status`;
- `portfolio_valuation_quality_status`;
- applicable accounting / reconstruction method version.

Permitted high-level result:

- `PASS`
- `PASS WITH NON-MATERIAL EXCEPTION`
- `BLOCKED`

A `BLOCKED` state prohibits portfolio-aware actionability.

A non-material exception may be tolerated only when it cannot affect security quantity, cash available, NAV, sector exposure, ownership state, cost basis or any other field consumed by the requested analysis.

## 3A.4 Cash reconciliation boundary

M3 must use **reconstructed cash state**, not:

- a manually typed `current_cash`;
- DCA planned contribution;
- a broker cash balance copied as truth;
- a dashboard snapshot that cannot be reproduced;
- a settlement amount not matched to its originating obligation.

At minimum, portfolio-aware allocation logic must distinguish settled cash, unsettled trade receivables, unsettled trade payables, other recognized receivables/liabilities where applicable, and broker-specific available-to-trade cash only when an approved derivation exists.

A broker-vs-ledger mismatch creates a reconciliation exception. M3 must not “fix” the mismatch by altering ledger-derived state.

## 3A.5 Cost basis boundary

Purchase cost / average cost is **not an input to intrinsic value or fundamental attractiveness**.

The engine must not:

- award valuation points because market price is below the investor's average cost;
- deduct valuation points because market price is above average cost;
- rank a security higher to “get back to break-even”;
- treat historical purchase price as evidence of margin of safety.

Reconstructed cost basis may be used only for legitimate portfolio/reporting context such as unrealized P&L display, realized P&L reconciliation, ownership history, or later transaction-cost/tax analysis if formally introduced.

If cost basis is unreconciled, fundamental scoring remains independent, but any output that displays or depends on cost basis must be blocked or clearly unavailable.

## 3A.6 Corporate-action boundary

Corporate actions must be consumed from authoritative transaction/event history.

M3 must not infer corporate-action economics from price charts, current share count, adjusted market data or broker snapshots when authoritative terms are required.

Before scoring per-share historical metrics, growth, dilution, capital allocation or valuation across a corporate-action boundary, the engine must establish whether comparability requires adjustment for events such as:

- stock split / reverse split;
- stock dividend / bonus shares;
- rights issue / rights subscription;
- merger / spinoff;
- tender / cash-in-lieu;
- security substitution or other basis-transfer event.

Corporate-action processing must satisfy these controls:

1. quantity effects occur once;
2. cash effects occur once;
3. cost-basis effects occur once;
4. settlement does not recreate the underlying trade/action;
5. non-realizing basis-transfer actions conserve basis subject to documented terms and rounding;
6. per-share historical series use a documented adjustment methodology;
7. dilution assessment distinguishes economic dilution from mechanical share-count changes;
8. EPS / BVPS / DPS growth is not calculated across incomparable pre/post-action denominators without adjustment.

If material corporate-action terms are missing, affected per-share metrics are `N/R` or the relevant category becomes `NOT RELIABLY SCORABLE`.

## 3A.7 Double-counting between accounting and scoring

A portfolio accounting fact must never receive scoring credit merely because it appears in multiple derived views.

Examples:

- the same dividend must not support both “cash generation” and “capital allocation quality” unless separate economic evidence is documented;
- realized P&L is not business quality;
- unrealized P&L is not valuation evidence;
- a higher portfolio weight is not conviction evidence for the fundamental score;
- DCA deployment is not company growth;
- broker-reported P&L is not an independent confirmation of ledger P&L.

## 3A.8 Derived-state reproducibility

Any M3 output that persists portfolio-aware context must record enough lineage to reproduce the state:

> portfolio ID → analysis as-of timestamp → ledger/reconstruction version → market-price timestamp → derived portfolio snapshot/version → scoring method version

A persisted scorecard may cache derived values, but deleting that cache must not destroy the ability to reconstruct portfolio state from M2 authoritative history.

---

# 4. Final Weighting Model

## 4.1 Business Quality — 25

Measures durable underlying economics.

Substructure:

- Economic quality /8
- Competitive advantage /6
- Operating earnings quality / cash conversion /6
- Business-model resilience /5

Quantitative evidence normally includes sector-appropriate returns, margins, cash conversion, persistence and concentration measures.

Qualitative evidence normally includes moat durability, pricing power, customer/supplier structure and business-model resilience.

## 4.2 Financial Health — 15

Measures solvency, funding resilience and downside survivability.

Substructure:

- Balance-sheet strength /6
- Liquidity & refinancing resilience /4
- Downside survivability /5

The same leverage metric must not be applied mechanically across all sectors.

## 4.3 Growth Quality — 15

Measures value-creating, durable growth rather than headline growth.

Substructure:

- Historical growth quality /5
- Forward growth durability /5
- Incremental returns on growth /5

A low-base rebound, acquisition jump, accounting change or temporary price-cycle windfall cannot receive full growth credit without normalization.

## 4.4 Industry & Competitive Position — 10

Substructure:

- Industry structure /4
- Company position within industry /4
- Cycle position /2

The cycle component is intentionally limited to 2 points so short-term sector momentum cannot dominate.

## 4.5 Valuation & Forward Return — 20

Substructure:

- Primary valuation attractiveness /8
- Expected 5-year annualized total return /8
- Margin of safety / downside asymmetry /4

Valuation methods must be sector-appropriate and based on normalized economics.

A low P/E or P/B alone never establishes cheapness.

## 4.6 Risk & Governance — 10

Substructure:

- Governance & shareholder alignment /4
- Residual business / financial risk /4
- Thesis uncertainty /2

A hard veto is not a 0-point score. It is an override outside the arithmetic.

## 4.7 Capital Allocation Quality — 5

Substructure:

- Reinvestment discipline /2
- Dividend / buyback discipline /1
- Dilution discipline /1
- Per-share value creation outcome /1

This category evaluates economic capital deployment and must not duplicate governance evidence unless the same behavior independently constitutes an integrity issue.

---

# 5. Quantitative vs Qualitative Scoring

## 5.1 Principle

The engine must not define a universal fixed percentage split between quantitative and qualitative evidence across all sectors, because the availability and relevance of metrics differ.

Instead each **subcategory** is assigned through a bounded evidence matrix.

Each awarded point must be traceable to one or more of:

- **QNT** — quantitative evidence;
- **QLT** — qualitative assessment;
- **MIXED** — both quantitative and qualitative evidence.

## 5.2 Quantitative rules

Quantitative inputs should be preferred when:

- definitions are consistent;
- historical periods are comparable;
- the metric measures the intended economic principle;
- sector accounting does not make the metric misleading.

Quantitative values must not receive automatic points solely because they are numerically high or low.

## 5.3 Qualitative rules

Qualitative points require:

- an explicit assessment statement;
- evidence references;
- a defined rubric;
- at least one disconfirming consideration when the score is near the maximum;
- no unsupported “strong management”, “good moat” or similar labels.

## 5.4 Top-decile justification

Any subcategory score in its top scoring band must include a written reason explaining why the company deserves exceptional credit.

---

# 6. Metric-to-Point Conversion

M3 uses a three-anchor method rather than uncontrolled analyst intuition.

Every metric definition created later in `METRIC_DEFINITIONS.md` must specify:

1. **Absolute anchor** — minimum economic standard.
2. **Relative context** — sector peer or own-history reference when useful.
3. **Cycle / quality adjustment** — normalization, one-off or accounting-quality adjustment.
4. **Point rubric** — deterministic ranges or bounded analyst rubric.
5. **Evidence requirements** — required source quality and periods.
6. **Fallback rule** — what happens when the metric is unavailable.
7. **Double-count map** — categories where the metric may or may not also appear.

The engine must not rely on percentile rank alone.

---

# 7. Sector Normalization

## 7.1 General rule

Category weights remain constant across sectors.

**Metrics may change; economic principles may not.**

A sector-specific metric substitution is valid only if it:

- measures the same underlying economic principle;
- is standard or defensible for that sector;
- is documented;
- is applied consistently across comparable firms;
- does not make the sector structurally easier to score.

## 7.2 Banks

Do not use industrial Debt/Equity as a financial-strength metric.

Core evidence may include:

**Business Quality**
- normalized ROE / ROTE;
- NIM quality;
- fee-income quality;
- cost-to-income;
- franchise / CASA quality.

**Financial Health**
- capital adequacy / CET1 where available;
- NPL;
- special-mention / problem-loan indicators where available;
- loan-loss coverage;
- funding structure;
- LDR / liquidity;
- credit-cost resilience.

**Growth**
- loan/deposit growth;
- fee-income growth;
- per-share book-value growth;
- growth adjusted for credit quality and capital consumption.

**Valuation**
- P/B relative to sustainable ROE and cost of equity;
- residual-income / justified-P/B logic;
- P/E and dividend yield as cross-checks.

A high ROE produced by weak provisioning, aggressive asset growth or inadequate capital must not receive full quality credit.

## 7.3 Real Estate

Core evidence may include:

- net debt and debt maturity;
- interest burden;
- cash and refinancing dependence;
- project legal status;
- presales;
- backlog;
- collection / handover conversion;
- inventory composition and aging;
- project-level economics;
- normalized delivery mix;
- RNAV quality and realization probability.

Reported earnings without cash realization must receive reduced earnings-quality credit.

A large RNAV discount is not automatically a margin of safety if legal, funding or realization risk is high.

## 7.4 Technology

Core evidence may include:

- ROIC;
- recurring / repeat revenue;
- contract quality;
- gross / operating margin;
- FCF conversion;
- incremental margins;
- customer concentration;
- retention / renewal indicators when available;
- acquisition dependence;
- talent / execution risk.

Low tangible book value is not a negative by itself.

## 7.5 Retail / Consumer

Core evidence may include:

- same-store sales where available;
- gross and operating margin;
- inventory turns / inventory aging;
- working-capital intensity;
- CFO conversion;
- store-level economics;
- payback period where available;
- store expansion productivity;
- brand / distribution strength.

Store-count growth without acceptable unit economics cannot receive full growth credit.

## 7.6 Industrials / Materials

Core evidence must be cycle-normalized where applicable.

Possible evidence:

- mid-cycle margins;
- normalized ROIC;
- utilization;
- through-cycle FCF;
- cost-curve position;
- commodity sensitivity;
- balance-sheet resilience through downturns;
- maintenance vs growth capex;
- normalized earnings rather than spot-cycle earnings.

A company at peak commodity margins must not receive maximum quality, growth or valuation credit solely from current earnings.

---

# 8. Cyclical Earnings Treatment

## 8.1 When normalization is mandatory

Normalization is required when current results are materially distorted by:

- commodity peaks or troughs;
- credit-cost cycle;
- property delivery timing;
- low-base recovery;
- temporary supply shortage;
- extraordinary spreads / margins;
- one-off contracts;
- accounting changes;
- acquisitions or disposals;
- non-recurring gains / losses.

## 8.2 Normalization hierarchy

Prefer, in order:

1. through-cycle company history;
2. normalized operating drivers;
3. sector-cycle history;
4. conservative external consensus estimates;
5. explicitly documented analyst assumptions.

## 8.3 Symmetry rule

Normalization must be symmetric.

The engine cannot remove negative one-offs but retain positive one-offs merely to improve score.

## 8.4 Peak-cycle safeguard

If current earnings are judged above normalized earnings:

- Growth Quality must use normalized growth;
- Valuation must use normalized earnings / cash flow;
- Industry Cycle Position may reflect the favorable cycle only within its limited /2 weight;
- Confidence must fall if the normalized level is highly uncertain.

---

# 9. Missing Data Treatment

## 9.1 Missing is not zero

Missing data must never become numeric zero unless zero is an observed economic fact.

Missing data must also not automatically receive midpoint / neutral points.

## 9.2 Four treatment states

For each missing input choose exactly one:

### A. Substitute metric
Use only when a sector-appropriate metric measures the same economic principle.

### B. Defensible conservative range
Allowed when enough evidence exists to bound the value reliably.

The range and conservative scoring rule must be documented.

### C. Subcategory N/R
Use when the subcategory cannot be reliably scored but the category can still be defended from other non-duplicative evidence.

The missing weight cannot be silently redistributed.

The category must state reduced evidence coverage and Confidence impact.

### D. Category / Total NOT RELIABLY SCORABLE
Required when the missing input is decision-critical and prevents a defensible category or total score.

The stock cannot enter the investable Top 10 until resolved.

## 9.3 No automatic weight redistribution

Missing evidence does **not** cause remaining metrics to receive larger weights.

This prevents companies with weaker disclosure from being structurally advantaged.

---

# 10. Data As-of and No-Hindsight Controls

Every scoring run must store:

- `analysis_as_of_date`;
- financial reporting period for each material input;
- price timestamp used for valuation;
- VN30 membership effective date;
- sector classification effective date;
- estimate publication / capture date where applicable;
- methodology version;
- data-quality state.

For a historical scoring run:

> Only information available or legitimately effective at the historical cutoff may be used.

Later events may be used only in a separately labeled restated / corrected view.

The engine must not:

- use a later annual report to improve a historical score;
- use a future index reconstitution before its effective date;
- use later earnings to judge whether an earlier valuation was “obviously cheap”;
- recalibrate thresholds to make historical winners rank higher.

---

# 11. Confidence Framework

Every scored company receives one of:

- `HIGH`
- `MEDIUM`
- `LOW`

Confidence is an overlay, not a numeric multiplier.

## 11.1 Confidence dimensions

Assess five dimensions:

1. **Freshness**
2. **Completeness**
3. **Source reliability**
4. **Estimate dependence**
5. **Model / cycle uncertainty**

Each dimension is assessed as Strong / Adequate / Weak.

## 11.2 HIGH

Normally requires:

- no decision-critical stale input;
- high completeness;
- primary-source financial evidence;
- limited reliance on aggressive estimates;
- reasonably narrow normalized-earnings and valuation ranges.

## 11.3 MEDIUM

Appropriate when:

- evidence is sufficient for action;
- one or more dimensions contain meaningful uncertainty;
- normalized earnings or valuation ranges are moderately wide;
- some secondary-source or estimate dependence remains.

## 11.4 LOW

Triggered by one or more of:

- major evidence gaps;
- material stale data;
- unstable or highly cyclical economics with wide normalization range;
- valuation dependent on aggressive assumptions;
- contradictory evidence;
- weak source reliability.

LOW confidence cannot support new capital under the approved Risk Policy / Decision Framework.

## 11.5 Confidence non-duplication

Do not apply a blanket numeric haircut solely because Confidence is MEDIUM or LOW if uncertainty is already reflected in category scoring.

Confidence constrains interpretation and actionability.

---

# 12. Score Validity

Every total score carries exactly one status.

## VALID — ACTIONABLE

- Stage 0 permits positive analysis;
- material categories are reliably scorable;
- no known blocking risk / portfolio condition prevents positive allocation analysis;
- when portfolio-aware actionability is asserted, accounting-integrity status is not `BLOCKED`.

## VALID — NON-ACTIONABLE

Score is analytically valid but current portfolio, execution, ownership-state, risk or accounting-integrity constraints block new capital.

A company may therefore retain a valid fundamental score while a broken portfolio reconstruction forces `VALID — NON-ACTIONABLE` for portfolio-aware use.

## RESEARCH ONLY

Stage 0 failure or equivalent condition makes the score unsuitable for positive ranking.

## NOT RELIABLY SCORABLE

Decision-critical evidence is insufficient to support a defensible 100-point score.

Only `VALID — ACTIONABLE` names may occupy the investable Top 10.

---

# 13. Category Gates

For new-capital candidates, retain the approved gates:

| Category | Minimum for normal new capital | STRONG BUY normal prerequisite |
|---|---:|---:|
| Business Quality | 13/25 | 18/25 |
| Financial Health | 8/15 | 11/15 |
| Risk & Governance | 5/10 | 7/10 |
| Valuation & Forward Return | 10/20 | subject to higher overall return/risk conditions |

These gates do not map scores directly to Decision States.

A category-gate failure cannot be repaired by unusually high points elsewhere.

---

# 14. Market / Money Flow Overlay

Market / Money Flow does **not** add points to the Investment Score.

M3 may record a separate contextual status such as:

- SUPPORTIVE
- NEUTRAL
- ADVERSE
- NOT ASSESSED

Evidence may include:

- liquidity;
- foreign flow;
- institutional flow;
- ETF-related effects;
- unusual volume / ownership pressure.

This overlay may later support execution or tie-breaking.

It must not turn a weak fundamental candidate into a high-ranked investment.

---

# 15. Technical Entry Overlay

Technical Entry does **not** add points to the Investment Score.

A later implementation may classify:

- FAVORABLE
- NEUTRAL
- UNFAVORABLE
- NOT ASSESSED

Possible inputs:

- MA50;
- MA200;
- trend regime;
- volume confirmation;
- volatility / gap risk.

Technical Entry may improve or delay timing.

It does not invalidate a good long-term business thesis by itself and cannot override a broken thesis or hard veto.

---

# 16. Anti-Bias Safeguards

Every final score must pass the following controls.

## 16.1 Value-trap check

A low valuation cannot compensate for structural deterioration, poor returns, weak cash conversion or balance-sheet fragility.

## 16.2 Quality-at-any-price check

An exceptional business cannot receive an exceptional total score if expected forward return and margin of safety are poor.

## 16.3 Growth-quality check

Revenue / earnings growth is not rewarded fully unless it creates per-share intrinsic value.

## 16.4 Peak-cycle check

Current peak margins / earnings cannot be treated as normalized economics.

## 16.5 Low-base check

A rebound from an unusually weak base must be normalized.

## 16.6 Sector-accounting check

Do not compare structurally incompatible raw metrics across sectors.

## 16.7 Recency check

One quarter or one year cannot dominate 3–5 year economics without a documented structural reason.

## 16.8 Narrative check

Management claims cannot override audited / regulatory evidence.

## 16.9 Anchoring check

The new score must be reconstructed from current evidence rather than copied from the prior score.

## 16.10 Outcome / hindsight check

Historical score validation must use only contemporaneously available information.

## 16.11 Double-count check

Every material scoring input must have a primary scoring home.

If the same fact appears in multiple categories, the analyst must explain the distinct economic principles affected.

## 16.11A Evidence ownership matrix

The same underlying economic fact may affect more than one principle, but the engine must assign a **primary scoring home** and document any secondary use.

| Evidence | Primary scoring home | Secondary use allowed only when distinct |
|---|---|---|
| ROIC / normalized ROE | Business Quality | Growth only for incremental-return evidence |
| CFO / earnings conversion | Business Quality | Valuation only as an input to owner earnings / FCF, not a second quality reward |
| leverage / liquidity | Financial Health | Risk only for residual risk not already captured by Financial Health |
| moat / pricing power | Business Quality | Industry only for company-vs-industry positioning, not a second moat award |
| market share | Industry & Competitive Position | Business Quality only when it demonstrates durable moat economics |
| historical revenue / EPS growth | Growth Quality | Valuation only as a forecast input, not a second growth reward |
| expected 5Y earnings/value growth | Valuation expected return | Growth only if independently supported as durable reinvestment runway |
| dilution | Capital Allocation Quality | Growth for per-share normalization; Risk only if it creates distinct solvency/governance risk |
| related-party / minority treatment | Risk & Governance | Capital Allocation only for separately measurable economic allocation outcomes |
| dividend / buyback policy | Capital Allocation Quality | Valuation expected return only through future cash-return assumptions |
| cycle position | Industry & Competitive Position | Valuation only through normalized earnings; no duplicate cycle bonus |
| portfolio P&L / cost basis | No fundamental scoring home | Reporting / portfolio context only |

If a single observation drives multiple category scores, the scorecard must state why the economic channels are distinct.

## 16.11B Derived-metric dependency rule

A derived metric cannot create multiple independent points merely by changing presentation.

Examples:

- `FCF yield`, `P/FCF` and DCF based on the same FCF forecast are one valuation evidence family, not three independent confirmations;
- P/E and expected-return calculations using the same normalized EPS are not independent evidence;
- ROE and P/B-vs-ROE valuation share an earnings/book-value dependency and must be sensitivity-tested;
- NPL and loan-loss coverage may be related evidence of asset quality and must not be counted as fully independent if driven by the same recognition assumption.

The analyst must identify common-input dependencies for any material cluster of correlated metrics.

## 16.12 Assumption-dependency check

When Quality, Growth and Valuation all depend on the same optimistic assumption, explicitly flag the common dependency and reduce confidence where appropriate.

## 16.13 Score-inflation check

Top-band scores require exceptional evidence and written justification.

---

# 17. Scoring Run Workflow

For each scoring date:

1. Freeze `analysis_as_of_date`.
2. Resolve effective VN30 membership.
3. Resolve effective sector.
4. Run Stage 0.
5. Resolve veto status.
6. If any portfolio-aware output is requested, validate M2 reconstruction and reconciliation status.
7. Collect and classify company evidence.
8. Apply data-quality and freshness checks.
9. Resolve material corporate-action comparability for per-share/history inputs.
10. Normalize cyclical / one-off metrics.
11. Score seven categories.
12. Run category gates.
13. Run evidence-ownership, double-count and common-dependency checks.
14. Assign Confidence.
15. Assign Score Validity.
16. Compute Investment Score /100.
17. Record Market Flow overlay separately.
18. Record Technical Entry overlay separately.
19. Attach portfolio-aware context only from reconciled reconstructed state.
20. Generate scorecard.
21. Generate ranking eligibility.
22. Compare material score changes to prior run.
23. Store scoring methodology / input lineage and, where used, portfolio reconstruction lineage.

For a score change of **5 points or more**, the score record must explain the point change by category.

---

# 18. Standard Per-Stock Output

Minimum scorecard output:

| Field | Requirement |
|---|---|
| Ticker | Required |
| Security ID | Required in system record |
| Sector | Required |
| Analysis as-of date | Required |
| Financial reporting period | Required |
| Composite Stage 0 Outcome | Required |
| Business Quality | /25 |
| Financial Health | /15 |
| Growth Quality | /15 |
| Industry & Competitive Position | /10 |
| Valuation & Forward Return | /20 |
| Risk & Governance | /10 |
| Capital Allocation Quality | /5 |
| **Total Investment Score** | **/100** |
| Score Validity | Required |
| Data Confidence | HIGH / MEDIUM / LOW |
| Residual Risk | Required |
| Expected 5Y annualized total return | Required when reliably estimable |
| Margin-of-safety assessment | Required |
| Category gates | PASS / FAIL per relevant gate |
| Hard-veto status | Required |
| Market / Money Flow | Separate overlay |
| Technical Entry | Separate overlay |
| Key strengths | Required |
| Key weaknesses | Required |
| Valuation flags | Required |
| Risk flags | Required |
| Missing / stale data flags | Required |
| FACT / ESTIMATE / ASSUMPTION notes | Required where material |
| Portfolio accounting integrity | Required when portfolio-aware context is used |
| Ledger reconstruction version | Required when portfolio-aware context is used |
| Cash reconciliation status | Required when cash/actionability context is used |
| Cost-basis reconstruction status | Required when P&L/cost context is displayed |
| Corporate-action comparability status | Required when material to per-share/history metrics |
| Portfolio-state blocking flags | Required when any accounting integrity check is not PASS |

M3 does not require a Buy / Hold / Sell mapping.

---

# 19. Ranking Interface

The scoring engine must be able to produce:

| Rank | Ticker | Total Score | Valuation | Quality | Risk | Confidence |
|---:|---|---:|---|---|---|---|

Recommended expanded form:

| Rank | Ticker | Score | Score Validity | Confidence | Residual Risk | Expected 5Y Return | Valuation Flag |
|---:|---|---:|---|---|---|---:|---|

## 19.1 Ranking precision

- Rank primarily by broad score bands.
- Differences of 1–2 points are economically indistinguishable by default.
- Do not imply statistical precision that the model does not possess.

## 19.2 Top-10 eligibility

The investable Top 10 may contain only:

- `VALID — ACTIONABLE`;
- Confidence at least MEDIUM for new-capital relevance;
- no hard veto;
- no decision-critical missing evidence;
- if portfolio-aware ranking is being produced, no `BLOCKED` portfolio accounting-integrity state;
- no material unreconciled corporate-action issue affecting the metrics used for ranking.

A security with a valid high fundamental score may still appear in a **research ranking** when portfolio reconstruction is blocked, but it must not be presented as an actionable allocation candidate.

## 19.3 Top-10 selection logic

Top 10 is not a blind sort of Total Score.

Within effectively tied names, consider:

1. expected forward return;
2. residual risk;
3. confidence;
4. valuation downside asymmetry;
5. portfolio exposure;
6. sector concentration;
7. opportunity cost.

Portfolio exposure and sector concentration must **not** change the fundamental Investment Score.

They only affect capital-allocation ranking / actionability.

---

# 20. Calibration and Governance

## 20.1 Weight governance

Weights may not be changed to improve historical performance or make current rankings “look right”.

A weight change requires:

- explicit hypothesis;
- documented reason;
- validation;
- version increment;
- user approval where constitution-level.

## 20.2 Sector calibration

Before production ranking of all VN30:

- inspect category-score distributions by sector;
- identify structural scoring bias;
- recalibrate metric definitions if needed;
- do not force equal sector averages.

## 20.3 Threshold governance

Metric thresholds must be versioned.

Any later change must document:

- old threshold;
- new threshold;
- evidence;
- expected effect;
- whether historical scores are restated or preserved as-calculated.

---

# 21. Traceability Contract

Every numeric point must be explainable through the chain:

> **Source evidence → metric/assessment → normalization → rubric → subcategory score → category score → total score**

For material estimates:

> **Source evidence → estimate / assumption → sensitivity → confidence impact → score**

A score that cannot be reconstructed from its evidence and methodology version is not production-valid.

---

# 22. M3 File Boundaries

Recommended `03_SCORING/` structure remains appropriate:

- `SCORING_ENGINE.md` — architecture and scoring process;
- `METRIC_DEFINITIONS.md` — metric dictionary, thresholds, formulas, source requirements;
- `SECTOR_NORMALIZATION.md` — sector-specific substitutions and normalization;
- `SCORECARD_TEMPLATE.md` — standard per-stock record;
- `RANKING_RULES.md` — deterministic ranking and Top-10 logic;
- `VALIDATION_CASES.md` — synthetic / historical validation scenarios.

No additional file is required before approval of this document.

---

# 23. Review Findings — Integrity Re-Review

## 23.1 CIO Review

### Critical issues
- **0 unresolved.**

### Major issues resolved
1. **Portfolio-aware ranking could consume an unaudited derived portfolio snapshot.** Fixed by §3A: all portfolio-dependent overlays require reconstructable M2 state and lineage.
2. **Cost basis could leak into valuation or behavioral ranking.** Fixed by explicit cost-basis boundary: purchase cost is not intrinsic value and has no fundamental scoring home.
3. **High fundamental score could remain “actionable” despite broken accounting state.** Fixed: security score and portfolio actionability are separated; blocked reconstruction prohibits portfolio-aware Top-10 actionability.

### Minor / deferred
- Exact implementation representation of the accounting-integrity status object belongs to later implementation/data-interface work.

**CIO result:** **PASS — 0 Critical, 0 Major unresolved.**

## 23.2 Equity Research Analyst Review

### Critical issues
- **0 unresolved.**

### Major issues resolved
1. **Corporate actions could distort EPS/BVPS/DPS growth, dilution and valuation comparability.** Fixed by §3A.6 adjustment and comparability controls.
2. **Correlated evidence could be rewarded across Business Quality, Growth, Valuation and Capital Allocation.** Fixed with explicit evidence-ownership and derived-dependency rules.
3. **Portfolio P&L could be mistaken for business-quality evidence.** Explicitly prohibited.

### Minor / deferred
- Event-specific financial-statement adjustment formulas will be specified in `METRIC_DEFINITIONS.md` / `SECTOR_NORMALIZATION.md`.

**Equity Research result:** **PASS — 0 Critical, 0 Major unresolved.**

## 23.3 Quant Analyst Review

### Critical issues
- **0 unresolved.**

### Major issues resolved
1. **Source-of-truth lineage was incomplete for portfolio-conditioned ranking.** Fixed with reconstruction version and portfolio-state lineage contract.
2. **Double counting was controlled conceptually but lacked a default evidence ownership map.** Fixed by §16.11A and §16.11B.
3. **Corporate-action denominator breaks could create false historical growth signals.** Fixed by mandatory comparability status and N/R/block behavior.
4. **Derived snapshots risked becoming silent authoritative inputs.** Fixed: caches are consumable only when reproducible from authoritative history.

### Minor / deferred
- Metric-level covariance/redundancy diagnostics remain part of later validation cases.
- Exact tolerances for reconciliation remain owned by M2/implementation contracts.

**Quant result:** **PASS — 0 Critical, 0 Major unresolved.**

## 23.4 Risk Manager Review

### Critical issues
- **0 unresolved.**

### Major issues resolved
1. **No explicit M3 response to cash-reconciliation failure.** Fixed: reconciliation failure blocks portfolio-aware actionability; broker statements cannot overwrite ledger truth.
2. **No explicit M3 response to broken cost-basis reconstruction.** Fixed: cost-dependent outputs are blocked while fundamental score remains independent.
3. **Corporate-action quantity/cash/basis double counting was not explicitly guarded at the scoring integration boundary.** Fixed in §3A.6.
4. **Unsupported opening portfolio state could make portfolio reconstruction appear complete.** Fixed by mandatory supported-inception / `OPENING_BALANCE` prerequisite.
5. **Settlement errors could leak into available cash and allocation decisions.** Fixed: M3 may consume cash/actionability state only after matched/reconciled reconstruction.

### Minor / deferred
- Broker-specific available-to-trade-cash rules remain outside M3 scoring and require a later approved execution contract.

**Risk Manager result:** **PASS — 0 Critical, 0 Major unresolved.**

## 23.5 Cross-domain conclusion

The scoring engine now has explicit controls for:

- source of truth;
- double counting;
- cost basis;
- cash reconciliation;
- corporate actions;
- deterministic portfolio reconstruction from transaction history.

It does **not** duplicate the accounting engine. It consumes M2 truth and blocks portfolio-aware use when that truth cannot be reconstructed or reconciled.

**Integrity re-review conclusion: 0 Critical unresolved; 0 Major unresolved.**

---

# 24. Open Items Before Production Scoring

These are **not blockers for approval of SCORING_ENGINE.md**, but must be completed in later M3 files:

1. metric definitions and point thresholds;
2. sector-specific metric matrices for all VN30 sectors;
3. precise data freshness requirements by metric;
4. scorecard evidence schema;
5. deterministic ranking tie-break implementation;
6. validation cases for:
   - bank vs industrial comparability;
   - peak-cycle materials;
   - low-base rebound;
   - missing data;
   - LOW confidence high-score case;
   - hard-veto high-score case;
   - valuation-driven score change;
   - historical no-hindsight reconstruction;
   - portfolio-ledger reconstruction failure blocking a high-scoring stock from actionable Top 10;
   - broker cash mismatch without ledger overwrite;
   - settled-trade reversal/correction preserving cash, quantity, basis and realized P&L;
   - stock split / rights / merger preserving per-share comparability and preventing false dilution/growth;
   - imported opening position with missing verified basis;
   - duplicate fee/tax or settlement path detection before portfolio-aware ranking.

---

# 25. Approval Gate

Approve `SCORING_ENGINE.md` only if the following are accepted:

1. The 100-point architecture remains `25/15/15/10/20/10/5`.
2. Technical Entry and Market / Money Flow remain outside the 100-point Investment Score.
3. Confidence remains an overlay, not a score multiplier.
4. Missing data is never automatically zero or neutral.
5. Missing weights are not redistributed.
6. Decision-critical gaps may produce `NOT RELIABLY SCORABLE`.
7. Category weights remain fixed across sectors while metric substitutions are sector-specific.
8. Cyclical earnings are normalized before quality, growth and valuation scoring.
9. Category gates and hard-veto rules remain non-compensable.
10. Ranking treats 1–2 point differences as effectively tied.
11. Portfolio constraints do not alter the fundamental score.
12. Historical scoring must be reproducible without hindsight.
13. Every point must be traceable to evidence, normalization, rubric and methodology version.
14. M3 never creates a second source of truth for cash, quantity, cost basis, P&L, NAV or corporate-action effects.
15. Portfolio-aware ranking is blocked when ledger/cash/cost-basis/corporate-action reconstruction is materially unreconciled.
16. Investor cost basis never influences intrinsic value or fundamental score.
17. Corporate-action comparability must be resolved before per-share growth/dilution/valuation metrics are used.
18. Derived portfolio snapshots used by M3 must remain reproducible from authoritative M2 history.
19. The next M3 file will be created only after explicit approval of this document.

---

## Status

> **INTEGRITY-REVIEWED DRAFT FOR USER APPROVAL — 0 CRITICAL / 0 MAJOR UNRESOLVED — DO NOT PROCEED TO THE NEXT M3 FILE**
