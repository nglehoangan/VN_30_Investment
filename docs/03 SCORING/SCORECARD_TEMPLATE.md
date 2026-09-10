# VN30 Value Investing OS — Scorecard Template

**Document:** `03_SCORING/SCORECARD_TEMPLATE.md`  
**Milestone:** 3 — VN30 Scoring Engine  
**Status:** Approved  
**Version:** 1.0  
**Date:** 2026-09-05  
**Governing Documents:**  
- `SCORING_MODEL.md` v1.0
- `03_SCORING/SCORING_ENGINE.md` v0.2 — Approved
- `03_SCORING/METRIC_DEFINITIONS.md` v1.0 — Approved
- `03_SCORING/SECTOR_NORMALIZATION.md` v1.0 — Approved
- `DATA_MODEL.md`
- `DATA_RULES.md`

---

# 1. Purpose

This document defines the standard per-security scorecard used by the VN30 Scoring Engine.

The scorecard must be:

- reproducible;
- auditable;
- comparable across sectors;
- explicit about data freshness;
- explicit about FACT / ESTIMATE / ASSUMPTION;
- resistant to double counting;
- resistant to missing-data bias;
- compatible with later ranking and Buy/Hold/Sell logic;
- safe to combine with portfolio-aware context only when M2 reconstruction integrity passes.

The scorecard is a **record of analysis**, not a recommendation engine.

---

# 2. Scorecard Principles

Every scorecard must separate:

1. identity and effective-dated reference data;
2. Stage 0 and veto status;
3. issuer-level fundamental evidence;
4. category scores;
5. valuation and forward return;
6. risk and confidence;
7. missing/stale/uncertain evidence;
8. market/technical overlays;
9. optional portfolio-aware context;
10. methodology and reconstruction lineage.

The scorecard must never merge investor accounting state into company fundamental scoring.

The scorecard is a **derived analytical artifact**. It is never an authoritative ledger, position record, cash ledger, cost-basis register, corporate-action ledger or NAV store.

---

# 2A. Source-of-Truth Contract

## 2A.1 Authoritative ownership

Any field copied into the scorecard must retain its original owner.

Portfolio/accounting fields are sourced only from approved M2 reconstruction:

- event facts → `Transaction`;
- posted balance effects → `TransactionLeg`;
- corporate-action terms/effects → `CorporateActionEvent` + linked immutable transactions;
- position/cash/P&L/NAV → derived M2 reconstruction;
- market price → dated market observation;
- sector/VN30 membership → effective-dated reference data.

The scorecard must not permit manual edits that become authoritative accounting truth.

## 2A.2 Snapshot semantics

A scorecard may cache values for readability, but every cached portfolio/accounting field must be labeled `DERIVED SNAPSHOT`.

Deleting a scorecard must not destroy the ability to reconstruct:

- quantity;
- settled cash;
- receivables/payables;
- cost basis;
- realized/unrealized P&L;
- NAV;
- portfolio/sector weights.

## 2A.3 Portfolio-state trust gate

If portfolio-aware context is present, the scorecard must display:

- reconstruction status;
- reconciliation status;
- reconstruction method/version;
- supported inception status;
- data-as-of timestamp.

If any material portfolio accounting state is `BLOCKED`, the scorecard must not show a portfolio-aware recommendation state as actionable.

---

# 3. Header Block

Every scorecard starts with:

| Field | Requirement |
|---|---|
| `security_id` | Required system identifier |
| `ticker` | Required display field |
| `company_name` | Required |
| `sector_id` | Required |
| `sector_name` | Required |
| `sector_subgroup` | Required where applicable |
| `analysis_as_of_date` | Required |
| `latest_financial_period` | Required |
| `price_as_of_timestamp` | Required for valuation |
| `vn30_membership_as_of` | Required |
| `sector_assignment_as_of` | Required |
| `scoring_method_version` | Required |
| `metric_definition_version` | Required |
| `sector_normalization_version` | Required |

Ticker is display metadata, not long-lived identity.

---

# 4. Stage 0 Block

Required fields:

| Field | Allowed values |
|---|---|
| Eligibility | PASS / FAIL / UNKNOWN |
| Investability | PASS / FAIL / UNKNOWN |
| Risk veto | PASS / FAIL / PENDING |
| Evidence sufficiency | PASS / PASS WITH CONDITIONS / PENDING |
| Composite Stage 0 Outcome | approved deterministic outcome |
| Stage 0 notes | Required when not PASS |

If Composite Stage 0 Outcome is a definitive FAIL:

- positive allocation scoring may terminate;
- owned positions may continue only as required for exit/de-risk analysis;
- scorecard must indicate which downstream sections are N/A or research-only.

---

# 5. Score Validity and Actionability

Required:

| Field | Allowed values |
|---|---|
| Score Validity | VALID — ACTIONABLE / VALID — NON-ACTIONABLE / RESEARCH ONLY / NOT RELIABLY SCORABLE |
| Data Confidence | HIGH / MEDIUM / LOW |
| Accounting Integrity | PASS / PASS WITH NON-MATERIAL EXCEPTION / BLOCKED / N.A. |
| Actionability reason | Required when not actionable |
| Accounting integrity scope | PORTFOLIO-AWARE / ISSUER-ONLY |
| Integrity source | M2 reconstruction result/version |

For issuer-only research with no portfolio context, `Accounting Integrity = N.A.` is permitted.

A valid issuer score can coexist with blocked portfolio-aware actionability.

---

# 6. Category Score Summary

| Category | Score | Max | Gate | Evidence Coverage | Confidence Note |
|---|---:|---:|---|---|---|
| Business Quality |  | 25 | PASS/FAIL/N.A. |  |  |
| Financial Health |  | 15 | PASS/FAIL/N.A. |  |  |
| Growth Quality |  | 15 | N.A. |  |  |
| Industry & Competitive Position |  | 10 | N.A. |  |  |
| Valuation & Forward Return |  | 20 | PASS/FAIL/N.A. |  |  |
| Risk & Governance |  | 10 | PASS/FAIL/N.A. |  |  |
| Capital Allocation Quality |  | 5 | N.A. |  |  |
| **Total Investment Score** |  | **100** |  |  |  |

The total is arithmetic only across reliably scored category points.

Missing subcategory weight is not redistributed.

---

# 7. Business Quality Detail

## 7.1 Economic Quality /8

Record:

- metrics used;
- normalized values;
- period;
- sector substitutions;
- score;
- rationale.

Suggested fields:

| Metric | Raw | Normalized | Period | Source | Type | Score impact |
|---|---:|---:|---|---|---|---|

## 7.2 Competitive Advantage /6

Required:

- moat assessment;
- evidence;
- disconfirming evidence;
- durability rationale;
- score.

## 7.3 Earnings Quality / Cash Conversion /6

Required:

- primary cash/earnings quality metrics;
- one-off adjustments;
- working-capital context;
- sector substitution where applicable;
- score.

## 7.4 Business Model Resilience /5

Required:

- customer/product/geographic concentration;
- cyclicality;
- pricing power;
- disruption/regulatory dependence;
- score.

---

# 8. Financial Health Detail

## 8.1 Balance-Sheet Strength /6

Record sector-appropriate metrics only.

Examples:

**Banks**
- capital adequacy;
- NPL;
- coverage;
- funding structure.

**Non-financial**
- net debt/normalized EBITDA;
- net debt/equity;
- leverage quality.

## 8.2 Liquidity & Refinancing /4

Record:

- short-term obligations;
- liquidity resources;
- interest coverage;
- maturity profile;
- covenant/funding risks.

## 8.3 Downside Survivability /5

Required:

- stress scenario;
- key assumptions;
- survival outcome;
- dilution/refinancing need;
- score.

---

# 9. Growth Quality Detail

## 9.1 Historical Growth /5

Required:

- 3Y/5Y revenue growth;
- normalized earnings/per-share growth;
- acquisition adjustment;
- low-base adjustment;
- corporate-action adjustment;
- score.

## 9.2 Forward Growth Durability /5

Required:

- 3–5Y runway;
- reinvestment capacity;
- backlog/pipeline where relevant;
- structural vs cyclical growth;
- score.

## 9.3 Incremental Returns /5

Required:

- incremental ROIC/ROE/store economics/project returns;
- denominator quality;
- score.

---

# 10. Industry & Competitive Position Detail

## 10.1 Industry Structure /4

Record:

- barriers;
- competition;
- regulation;
- capital intensity;
- structural demand;
- disruption.

## 10.2 Company Position /4

Record:

- market share;
- relative cost;
- distribution;
- scale;
- strategic assets;
- score.

## 10.3 Cycle Position /2

Required:

- cycle classification;
- evidence;
- normalized forward interpretation;
- score.

Cycle score cannot duplicate valuation impact from the same cycle assumption.

---

# 11. Valuation & Forward Return Detail

## 11.1 Primary Valuation /8

Required:

- primary valuation method;
- normalized denominator;
- current price;
- fair/base value;
- conservative value;
- cross-check methods;
- score.

## 11.2 Expected 5Y Annualized Return /8

Required:

| Component | Assumption | Type | Source |
|---|---:|---|---|
| Starting normalized earnings/value |  | FACT/ESTIMATE |  |
| 5Y growth |  | ESTIMATE |  |
| Dividends |  | ESTIMATE |  |
| Dilution/leakage |  | ESTIMATE |  |
| Exit/terminal valuation |  | ASSUMPTION |  |

Output:

- base expected return;
- downside expected return;
- upside expected return;
- score.

## 11.3 Margin of Safety /4

Required:

- conservative intrinsic value;
- discount/premium;
- downside case;
- key uncertainty;
- score.

Investor purchase cost is prohibited from this section.

---

# 12. Risk & Governance Detail

## 12.1 Governance /4

Record:

- disclosure quality;
- related-party behavior;
- controlling shareholder behavior;
- minority treatment;
- auditor/regulatory issues;
- score.

## 12.2 Residual Risk /4

Required:

- Risk Policy residual classification;
- risks already captured elsewhere;
- residual risks not double-counted;
- score.

## 12.3 Thesis Uncertainty /2

Record:

- forecast range;
- model sensitivity;
- missing evidence;
- dependence on assumptions;
- score.

---

# 13. Capital Allocation Quality Detail

## 13.1 Reinvestment Discipline /2

Record:

- historical reinvestment returns;
- acquisitions;
- capex discipline;
- divestments.

## 13.2 Dividend / Buyback Discipline /1

Record:

- payout policy;
- buyback price discipline;
- balance-sheet compatibility.

## 13.3 Dilution Discipline /1

Record:

- issuances;
- rights issues;
- ESOP/options;
- acquisition shares;
- economic per-share impact.

Mechanical split/bonus-share changes are not dilution by themselves.

## 13.4 Per-Share Value Creation /1

Record:

- EPS/BVPS/FCF-share/intrinsic-value-share evidence;
- corporate-action comparability;
- score.

---

# 14. Missing Data Block

Required fields:

| Missing item | Materiality | Treatment | Score impact | Confidence impact | Action |
|---|---|---|---|---|---|
|  | HIGH/MEDIUM/LOW | SUBSTITUTE / RANGE / N/R / BLOCK |  |  |  |

Rules:

- no automatic zero;
- no automatic midpoint;
- no weight redistribution;
- decision-critical missing data may force `NOT RELIABLY SCORABLE`.

---

# 15. Data Freshness Block

Required:

| Data item | Reporting/as-of date | Freshness status | Source | Impact |
|---|---|---|---|---|
| Price |  | CURRENT/STALE |  |  |
| Financials |  | CURRENT/STALE |  |  |
| Consensus |  | CURRENT/STALE |  |  |
| Sector assignment |  | CURRENT/STALE |  |  |
| VN30 membership |  | CURRENT/STALE |  |  |
| Corporate-action terms |  | CURRENT/STALE/N.A. |  |  |

If newer authoritative data is known but not incorporated, the scorecard must be marked provisional/stale as applicable.

---

# 16. FACT / ESTIMATE / ASSUMPTION Register

Every material non-trivial input should appear here.

| Item | Classification | Value/statement | Source | Sensitivity |
|---|---|---|---|---|
|  | FACT |  |  |  |
|  | ESTIMATE |  |  |  |
|  | ASSUMPTION |  |  |  |

Assumptions driving multiple categories must be flagged as common dependencies.

---

# 17. Corporate-Action Comparability Block

Required when material.

| Field | Requirement |
|---|---|
| Action type | Required |
| Effective date | Required |
| Action/event source | Required |
| Issuer restatement available | Yes/No |
| Historical denominator adjusted | Yes/No |
| Adjustment method/version | Required when adjusted |
| Economic dilution assessment | Required where applicable |
| Portfolio accounting reconciliation | PASS/BLOCKED/N.A. |
| Linked transaction/event lineage | Required when portfolio accounting is affected |
| Metrics affected | Required |
| Confidence impact | Required |

If comparability cannot be established, affected per-share metrics are N/R.

The scorecard must not infer quantity, basis or cash effects from current share count, adjusted price charts or broker snapshots.

---

# 18. Double-Count Review Block

Every completed scorecard must include:

## 18.1 Evidence Ownership Check

List major evidence families and their primary category.

Example:

| Evidence family | Primary home | Secondary use | Duplicate risk |
|---|---|---|---|
| ROIC | Business Quality | Incremental ROIC in Growth | LOW |
| leverage | Financial Health | residual risk only | MEDIUM |
| dilution | Capital Allocation | growth normalization | MEDIUM |
| NPL/provisioning | Financial Health / earnings quality | residual risk | HIGH |

## 18.2 Correlated Metric Check

Flag shared dependencies such as:

- P/E + earnings yield;
- FCF yield + P/FCF + DCF;
- P/B + residual income;
- NPL + coverage + credit cost;
- spot commodity price + margin + EPS + P/E.

## 18.3 Accounting Evidence Check

Required questions:

1. Does any scoring rationale reference investor cost basis or P&L?
2. Does any issuer cash-flow metric accidentally use portfolio cash data?
3. Does any dividend score rely only on investor cash receipt?
4. Does any corporate-action adjustment use inferred rather than authoritative terms?
5. Does any portfolio-aware field come from an unreconciled/manual snapshot?
6. Is the same fee/tax/dividend/corporate-action effect represented twice?

Any `YES` without a documented valid reason blocks finalization of the scorecard.

---

# 19. Market / Money Flow Overlay

Separate from fundamental score.

| Field | Value |
|---|---|
| Status | SUPPORTIVE / NEUTRAL / ADVERSE / NOT ASSESSED |
| Liquidity |  |
| Foreign flow |  |
| Institutional/ETF context |  |
| Notes |  |

No points are added to the 100-point Investment Score.

---

# 20. Technical Entry Overlay

Separate from fundamental score.

| Field | Value |
|---|---|
| Status | FAVORABLE / NEUTRAL / UNFAVORABLE / NOT ASSESSED |
| MA50 context |  |
| MA200 context |  |
| Volume/trend |  |
| Volatility/gap risk |  |
| Notes |  |

Technical Entry may affect timing, not thesis quality.

---

# 21. Optional Portfolio-Aware Context

This section appears only when valid portfolio data is available.

Required integrity fields:

| Field | Value |
|---|---|
| Portfolio ID |  |
| Portfolio as-of timestamp |  |
| Ledger reconstruction status | PASS/PASS WITH EXCEPTION/BLOCKED |
| Cash reconciliation status |  |
| Cost-basis reconstruction status |  |
| Corporate-action reconciliation status |  |
| Supported inception status |  |
| Reconstruction method/version |  |

Permitted context:

- current position quantity;
- portfolio weight;
- sector weight;
- position market value;
- settled cash;
- unsettled receivables/payables where relevant;
- available-to-trade cash if separately approved;
- concentration warnings;
- ownership state;
- average/open cost **for reporting only**;
- unrealized/realized P&L **for reporting only**.

Every portfolio field must include either a direct lineage reference or a shared `portfolio_snapshot_id` / reconstruction version that makes the value reproducible.

Prohibited fundamental uses:

- average cost as valuation;
- break-even as intrinsic value;
- unrealized P&L as cheapness;
- realized P&L as business quality;
- DCA deployment as growth;
- portfolio weight as moat/conviction evidence;
- broker cash balance as accounting truth;
- manually entered position quantity as official holdings.

If any material integrity field is `BLOCKED`, portfolio-aware actionability must be blocked.

If cost-basis reconstruction is blocked, cost/P&L display fields must be omitted or marked unavailable even if quantity/cash reconstruction passes.

---

# 21A. Cash / Cost-Basis / Reconstruction Controls

## 21A.1 Cash reconciliation record

When cash is shown, record:

| Field | Requirement |
|---|---|
| Settled cash | Derived |
| Unsettled receivables | Derived where applicable |
| Unsettled payables | Derived where applicable |
| Broker-observed cash | Optional evidence |
| Ledger-vs-broker difference | Required if broker observation exists |
| Reconciliation status | PASS / EXCEPTION / BLOCKED |
| Reconciliation note | Required for exception/block |

Broker cash never overwrites ledger-derived cash.

## 21A.2 Cost-basis record

When cost basis/P&L is shown:

| Field | Requirement |
|---|---|
| Cost-basis method | Required |
| Cost-basis method version | Required |
| Open quantity | Derived |
| Open cost | Derived |
| Average cost | Derived |
| Realized P&L | Derived |
| Unrealized P&L | Derived from price + reconstructed open cost |
| Reconstruction status | PASS/BLOCKED |

Ordinary BUY/SELL cost basis must be reconstructed under the approved accounting method. No manually entered average-cost plug is allowed.

## 21A.3 Supported inception / opening migration

If the portfolio predates the supported transaction history, the scorecard must state:

- supported inception date;
- whether opening cash is migrated;
- whether opening quantity is migrated;
- whether verified opening basis exists;
- which lifetime metrics are unavailable before inception.

A manually typed current position is not an acceptable substitute for an opening migration.

## 21A.4 Deterministic reconstruction

The scorecard must not store a portfolio-dependent value without enough lineage to reproduce it at the same `as_of`.

At minimum, one of the following must exist:

- explicit transaction/event references; or
- a versioned reconstructed portfolio snapshot whose lineage resolves to transaction history.

Historical replay must follow the approved M2 deterministic ordering and correction/reversal semantics.

---

# 21B. Accounting-to-Scoring Double-Count Firewall

The following accounting fields are **display/context only** and have no direct category-score effect:

- quantity held;
- average/open cost;
- realized P&L;
- unrealized P&L;
- settled cash;
- contributions/withdrawals;
- transaction fees/taxes;
- trade settlement;
- DCA deployed amount.

If any of these appear in a scoring rationale, the scorecard must explicitly explain the issuer-level economic channel; otherwise the score is invalid.

Examples:

- portfolio dividend cash received ≠ issuer dividend discipline;
- portfolio gain ≠ business quality;
- investor average cost ≠ intrinsic value;
- transaction tax ≠ issuer financial risk.

---

# 22. Key Strengths / Weaknesses / Flags

Required:

## Key strengths
Maximum 5, prioritized by investment relevance.

## Key weaknesses
Maximum 5, prioritized by permanent-loss relevance.

## Valuation flags
Examples:

- LOW_PE_NOT_ENOUGH
- PEAK_CYCLE_EARNINGS
- RNAV_REALIZATION_RISK
- MULTIPLE_EXPANSION_DEPENDENCE
- THIN_MARGIN_OF_SAFETY

## Risk flags
Examples:

- GOVERNANCE
- LEVERAGE
- REFINANCING
- NPL
- CUSTOMER_CONCENTRATION
- PROJECT_LEGAL
- DILUTION
- EVENT_RISK

## Data flags
Examples:

- STALE_FINANCIALS
- MISSING_ACTION_TERMS
- LOW_CONFIDENCE
- N/R_METRIC
- RECONCILIATION_BLOCK

---

# 23. Investment Thesis Block

Although M3 does not issue Buy/Hold/Sell, each scorecard must include a concise fundamental thesis.

Required structure:

- **Core thesis**
- **Why the business can compound**
- **What valuation assumes**
- **What can go wrong**
- **What would invalidate the thesis**

This makes the score falsifiable and usable in M4.

---

# 24. Score Change Attribution

If prior score exists:

| Category | Prior | Current | Change | Reason |
|---|---:|---:|---:|---|

A total score change ≥5 points requires explicit written explanation.

Prior score must not be copied forward without current evidence review.

---

# 25. Ranking Interface Fields

Minimum export fields:

| Rank input field | Required |
|---|---|
| Ticker | Yes |
| Total Score | Yes |
| Score Validity | Yes |
| Confidence | Yes |
| Quality composite | Yes |
| Valuation score | Yes |
| Residual risk | Yes |
| Expected 5Y return | Yes when reliably estimable |
| Stage 0 | Yes |
| Category gates | Yes |
| Key flags | Yes |
| Portfolio-aware eligibility | Yes where portfolio context used |

Ranking logic itself belongs to `RANKING_RULES.md`.

---

# 26. Traceability Requirements

Every category score must be reproducible through:

> source → raw input → normalization → sector rule → metric rubric → subcategory score → category score → total score

Every portfolio-aware field must be reproducible through:

> Transaction / TransactionLeg / CorporateActionEvent → approved replay/cost-basis method version → derived portfolio state → reconciliation status → scorecard context

For corrected/reversed trades, lineage must preserve the original event, reversal/correction group and effective historical truth.

For multi-stage corporate actions, lineage must preserve the specific entitlement/exercise/share-credit/cash-settlement stages so quantity, cash, basis and realized P&L are not double-counted.

Cached scorecards are not authoritative source data.

---

# 27. Example Blank Scorecard

## Identity

- Ticker:
- Company:
- Sector:
- As-of:
- Financial period:
- Price date:
- Method version:

## Stage 0

- Eligibility:
- Investability:
- Risk veto:
- Evidence sufficiency:
- Composite Stage 0:

## Scores

- Business Quality: __ /25
- Financial Health: __ /15
- Growth Quality: __ /15
- Industry & Competitive Position: __ /10
- Valuation & Forward Return: __ /20
- Risk & Governance: __ /10
- Capital Allocation Quality: __ /5
- **Total: __ /100**

## Confidence / Validity

- Data Confidence:
- Score Validity:
- Accounting Integrity:
- Key missing data:

## Valuation

- Primary method:
- Expected 5Y annualized return:
- Margin of safety:
- Downside case:

## Thesis

- Core thesis:
- Key strengths:
- Key weaknesses:
- Invalidation conditions:

## Overlays

- Market / Money Flow:
- Technical Entry:

## Portfolio Context

- Position:
- Portfolio weight:
- Sector weight:
- Settled cash:
- Unsettled receivable/payable:
- Cash reconciliation status:
- Cost-basis reconstruction status:
- Corporate-action reconciliation status:
- Supported inception:
- Reconstruction method/version:
- Portfolio snapshot/lineage reference:
- Concentration flags:

---

# 28. Integrity Re-Review — CIO / Equity Research / Quant / Risk

## 28.1 CIO

### Critical
- **0 unresolved.**

### Major issues resolved
1. **The scorecard could become a shadow accounting store because portfolio fields were displayed without an explicit non-authoritative contract.** Fixed by §2A.
2. **Portfolio-aware actionability could be shown without enough trust metadata.** Fixed with reconstruction, reconciliation, method-version and inception gates.
3. **Investor cost/P&L could leak into analyst narrative despite being excluded from valuation section.** Fixed by §21B accounting-to-scoring firewall.

**Result:** **PASS — 0 Critical / 0 Major unresolved.**

## 28.2 Equity Research Analyst

### Critical
- **0 unresolved.**

### Major issues resolved
1. **Corporate-action block lacked source/method/lineage detail.** Fixed with action source, adjustment method/version and linked-event lineage.
2. **Issuer-level dividend/cash evidence could be confused with portfolio receipts.** Fixed by mandatory accounting evidence checks.
3. **Per-share comparability could be accepted without reconstructable adjustment methodology.** Fixed by required adjustment method/version or N/R.

**Result:** **PASS — 0 Critical / 0 Major unresolved.**

## 28.3 Quant Analyst

### Critical
- **0 unresolved.**

### Major issues resolved
1. **Portfolio fields could be cached without deterministic reconstruction lineage.** Fixed by §21A.4 and §26.
2. **Reversal/correction and multi-stage corporate-action lineage were not represented explicitly.** Fixed in traceability requirements.
3. **Cost-basis method/version was missing from the reporting template.** Fixed in §21A.2.
4. **Accounting double counting was not part of the mandatory scorecard QA checklist.** Fixed by §18.3.

**Result:** **PASS — 0 Critical / 0 Major unresolved.**

## 28.4 Risk Manager

### Critical
- **0 unresolved.**

### Major issues resolved
1. **Cash reconciliation was too coarse; settled and unsettled balances could be conflated.** Fixed by §21A.1.
2. **Broken cost basis could still leave P&L visible.** Fixed: cost/P&L display becomes unavailable if basis reconstruction is blocked.
3. **Unsupported opening positions could appear fully reconstructable.** Fixed by supported-inception/opening-migration block.
4. **Manual/broker snapshot values could feed portfolio-aware context.** Explicitly prohibited.
5. **Corporate-action accounting could be inferred from adjusted prices/current shares.** Explicitly prohibited.

**Result:** **PASS — 0 Critical / 0 Major unresolved.**

## 28.5 Cross-domain closure

| Area | Result |
|---|---|
| Source of truth | PASS |
| Shadow-ledger prevention | PASS |
| Double counting | PASS |
| Cost-basis firewall | PASS |
| Cash reconciliation | PASS |
| Corporate-action lineage | PASS |
| Opening migration / supported inception | PASS |
| Transaction-history reconstruction | PASS |
| Reversal/correction traceability | PASS |
| Derived-state reproducibility | PASS |
| Critical unresolved | **0** |
| Major unresolved | **0** |

> **Integrity conclusion: `SCORECARD_TEMPLATE.md` v0.2 has 0 Critical and 0 Major unresolved issues.**

---

# 29. Approval Gate

Approve `SCORECARD_TEMPLATE.md` only if:

1. One standard scorecard is used across all VN30 securities.
2. The seven approved category weights remain unchanged.
3. Stage 0, veto, confidence and score validity appear before actionability.
4. Fundamental score is separated from market, technical and portfolio overlays.
5. Missing data is explicitly recorded and never silently zeroed.
6. FACT / ESTIMATE / ASSUMPTION are separately documented.
7. Corporate-action comparability is recorded where material.
8. Double-count review is mandatory.
9. Investor cost basis never enters fundamental valuation.
10. Portfolio-aware context requires reconstructable M2 state.
11. Cached scorecards are non-authoritative and reproducible.
12. Score changes ≥5 points require attribution.
13. Thesis invalidation conditions are mandatory.
14. Ranking export fields are standardized but ranking logic remains in `RANKING_RULES.md`.
15. Scorecards are derived analytical artifacts and never authoritative accounting stores.
16. Portfolio-aware fields require reconstructable M2 lineage, reconciliation status and method versions.
17. Settled cash, unsettled receivables/payables and broker-observed cash remain distinct.
18. Cost-basis/P&L display is blocked when cost-basis reconstruction is blocked.
19. Supported inception/opening migration must be explicit for pre-existing portfolios.
20. Corporate-action source, adjustment method and transaction/event lineage are mandatory when material.
21. Accounting fields have no direct fundamental scoring home.
22. The next M3 file will not begin until explicit approval.

---

## Status

> **APPROVED — VERSION 1.0 — 0 CRITICAL / 0 MAJOR UNRESOLVED**
