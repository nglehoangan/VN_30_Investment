# VN30 Value Investing OS — Ranking Rules

**Document:** `03_SCORING/RANKING_RULES.md`  
**Milestone:** 3 — VN30 Scoring Engine  
**Status:** Approved  
**Version:** 1.0  
**Date:** 2026-09-05  
**Governing Documents:**  
- `SCORING_MODEL.md` v1.0
- `03_SCORING/SCORING_ENGINE.md` v0.2 — Approved
- `03_SCORING/METRIC_DEFINITIONS.md` v1.0 — Approved
- `03_SCORING/SECTOR_NORMALIZATION.md` v1.0 — Approved
- `03_SCORING/SCORECARD_TEMPLATE.md` v1.0 — Approved
- `RISK_POLICY.md` v1.0
- `DECISION_FRAMEWORK.md` v1.0
- `DATA_MODEL.md`
- `DATA_RULES.md`

---

# 1. Purpose

This document defines deterministic rules for ranking reliably scored VN30 securities and producing the investable Top 10 input for Milestone 4.

Ranking must:

- preserve the approved 100-point Investment Score;
- separate fundamental attractiveness from portfolio constraints;
- avoid false precision;
- prevent low-confidence/high-score names from appearing actionable;
- respect hard vetoes and category gates;
- avoid sector-concentration distortions;
- preserve reproducibility and historical auditability;
- never convert ranking order directly into BUY / HOLD / SELL.

Ranking is a **capital-allocation prioritization layer**, not a decision-state engine.

Ranking outputs are derived analytical artifacts. They are never authoritative sources for score inputs, portfolio accounting, corporate-action state, cash, quantity, cost basis, P&L or NAV.

---

# 1A. Source-of-Truth Contract

## 1A.1 Input ownership

Ranking may consume only already-approved source domains:

- security score / category score / confidence / validity → approved scorecard output;
- issuer fundamentals → scoring evidence owned by M3 metric/scoring layers;
- current/historical VN30 membership → effective-dated M2 reference data;
- sector assignment → effective-dated M2 sector data;
- market price → dated market observation;
- portfolio quantity/cash/P&L/cost basis/NAV → reconstructed M2 state;
- corporate-action accounting effects → M2 authoritative event/transaction reconstruction.

`RANKING_RULES.md` must not redefine any of these facts.

## 1A.2 No shadow ranking state

Persisted rank tables may cache rank, tie-cluster membership, portfolio priority and exclusion reason.

They must not become alternate authoritative stores for score, cash, position quantity, cost basis, sector weight, portfolio weight or corporate-action effects.

Cached rank tables must be disposable and reproducible.

## 1A.3 Reconstruction-first rule

Any ranking field that depends on portfolio state must use a portfolio snapshot or replay result whose lineage resolves to authoritative transaction history.

Manual portfolio values may never be used merely because they are convenient.

---

# 2. Ranking Outputs

The engine must support at least three distinct ranking views.

## 2.1 Fundamental Ranking

Ranks securities based on issuer-level fundamental attractiveness.

Required fields:

- Ticker
- Total Investment Score
- Score Band
- Valuation score
- Business Quality score
- Financial Health score
- Growth Quality score
- Risk & Governance score
- Expected 5Y Return
- Confidence
- Score Validity

This ranking does not consider the investor's existing portfolio weights or cash.

## 2.2 Investable Ranking

Includes only names eligible for new-capital consideration.

Requires:

- `VALID — ACTIONABLE`;
- Confidence at least MEDIUM;
- no hard veto;
- no decision-critical missing evidence;
- category gates satisfied as required;
- no blocking accounting-integrity issue when portfolio-aware context is used.

## 2.3 Portfolio-Aware Ranking

Prioritizes among otherwise investable candidates by considering:

- existing exposure;
- sector concentration;
- cash/execution feasibility;
- opportunity cost;
- ownership-state context.

Portfolio-aware considerations must **not** rewrite the fundamental 100-point score.

This view is available only when the relevant portfolio state is reconstructable and reconciliation status is acceptable for every field used in the ranking.

---

# 3. Universe Gate

Before ranking:

1. Freeze `analysis_as_of_date`.
2. Resolve effective VN30 membership.
3. Resolve effective sector assignment.
4. Exclude securities not valid VN30 members for the analysis date unless separately labeled as Legacy Holdings for portfolio-risk purposes.
5. Validate scorecard completeness.
6. Validate Stage 0.
7. Validate score status/confidence.

Only current eligible VN30 securities may enter the current investable ranking.

Legacy Holdings may remain visible in portfolio-risk views but cannot enter the current VN30 opportunity ranking.

---

# 4. Score Validity Gate

Eligible for investable ranking:

- `VALID — ACTIONABLE`

Not eligible for investable ranking:

- `VALID — NON-ACTIONABLE`
- `RESEARCH ONLY`
- `NOT RELIABLY SCORABLE`

A separate research table may display the latter for transparency.

---

# 5. Confidence Gate

For new-capital relevance:

- HIGH → eligible
- MEDIUM → eligible
- LOW → excluded from investable Top 10

LOW confidence does not automatically reduce the numeric score.

It blocks actionability.

---

# 6. Hard Veto Gate

Any active hard veto:

- removes the security from investable ranking;
- cannot be overridden by high score, low valuation or technical strength;
- must remain visible in the excluded/research list with reason.

For owned positions, de-risk/exit analysis belongs to M4.

---

# 7. Category Gate Rules

For normal new-capital eligibility:

| Category | Minimum |
|---|---:|
| Business Quality | 13/25 |
| Financial Health | 8/15 |
| Risk & Governance | 5/10 |
| Valuation & Forward Return | 10/20 |

A failed category gate blocks normal investable ranking even when Total Score is high.

No-compensating-score principle applies.

---

# 8. Score Bands

Use approved broad bands:

| Score | Band |
|---|---|
| 90–100 | Exceptional |
| 82–89 | Very Strong |
| 75–81 | Strong |
| 68–74 | Acceptable |
| 60–67 | Weak |
| <60 | Poor / High Caution |

Score band is more important than one-point rank differences.

---

# 9. False-Precision Rule

Differences of **1–2 points** are treated as economically indistinguishable by default.

Example:

- Stock A = 83
- Stock B = 82

Do not claim A is materially superior solely because of one point.

They enter a tie cluster.

---

# 10. Tie-Cluster Definition

A tie cluster contains securities whose Total Scores are within 2 points and whose Score Bands overlap economically.

Within a tie cluster, use secondary ranking dimensions.

---

# 11. Secondary Tie-Breakers

Apply in order:

1. Expected 5Y annualized total return
2. Residual risk
3. Data Confidence
4. Margin of Safety / downside asymmetry
5. Business Quality
6. Financial Health
7. Capital Allocation Quality
8. Portfolio impact, only for portfolio-aware ranking
9. Sector concentration, only for portfolio-aware ranking
10. Opportunity cost, only for portfolio-aware ranking

No technical indicator may precede fundamental tie-breakers.

---

# 12. Expected Return Tie-Break

Higher expected 5Y return ranks higher only when:

- assumptions are comparably reliable;
- valuation model confidence is comparable;
- return is not driven by aggressive multiple expansion;
- no hidden downside asymmetry dominates.

A 20% estimate with low confidence may rank below a 17% estimate with high confidence.

---

# 13. Residual Risk Tie-Break

Preferred order:

1. LOW
2. MODERATE
3. ELEVATED — controlled
4. ELEVATED — weakly mitigated
5. HIGH

Hard-veto / UNACCEPTABLE risk is excluded before tie-breaking.

---

# 14. Confidence Tie-Break

Within materially similar scores/returns:

HIGH > MEDIUM > LOW

LOW is already excluded from investable ranking.

Confidence is not numerically multiplied into score.

---

# 15. Margin-of-Safety Tie-Break

Prefer:

- wider conservative discount;
- lower downside impairment risk;
- less dependence on terminal multiple;
- stronger balance-sheet survivability.

Do not use investor purchase cost.

---

# 16. Quality Tie-Break

If valuation/return are similar:

prefer stronger:

- Business Quality;
- Financial Health;
- Capital Allocation Quality.

Avoid promoting weak-quality names merely because current P/E is low.

---

# 17. Portfolio-Aware Ranking Rules

Portfolio-aware ranking may affect **allocation priority**, not fundamental score.

## 17.1 Existing Position Exposure

Potential priority may decline when:

- position weight is already high;
- marginal addition increases concentration risk;
- position size is near/above approved risk limits.

This does not lower the issuer score.

## 17.2 Sector Concentration

Potential priority may decline when:

- sector weight is already high;
- adding the candidate creates concentration beyond approved risk policy.

Sector concentration cannot be used to claim the company is lower quality.

## 17.3 Opportunity Cost

Compare candidate with:

- other investable VN30 candidates;
- existing holdings eligible for add;
- holding cash.

Cash is a valid alternative when no candidate clears hurdle.

## 17.4 Ownership-State Context

Ranking may distinguish:

- unowned candidate;
- owned/add candidate;
- owned/hold-only;
- owned/de-risk candidate.

Final action mapping belongs to M4.

---

# 18. Portfolio Integrity Gate

Any portfolio-aware ranking requires:

- ledger reconstruction PASS;
- cash reconciliation PASS or documented non-material exception;
- supported inception PASS;
- quantity reconstruction PASS;
- corporate-action reconciliation PASS when relevant;
- cost-basis reconstruction PASS **only when cost/P&L reporting context is displayed**;
- valid market prices;
- valid sector assignments;
- known replay/reconstruction method version.

If blocked:

- fundamental ranking remains available;
- portfolio-aware ranking becomes unavailable;
- system must not guess current exposure, sector weight, ownership state, cash or execution feasibility.

A cost-basis-only failure does **not** block a fundamental or exposure-based rank if quantity/cash state is otherwise valid and cost/P&L is not used. In that case, cost/P&L fields are omitted or marked unavailable.

---

# 19. Cash Feasibility

Cash does not affect fundamental rank.

For execution-aware ranking:

- use reconstructed settled cash;
- separately show unsettled receivables/payables where relevant;
- use approved available-to-trade cash only if a formally defined derivation exists;
- do not treat planned DCA as actual cash;
- do not count unsettled receivable as settled cash unless an approved execution policy explicitly permits it;
- do not use broker-observed cash as authoritative truth;
- do not use a manually entered cash figure or dashboard snapshot as a substitute.

If broker-observed cash differs from ledger-derived cash:

- preserve ledger-derived cash as accounting truth;
- mark reconciliation exception;
- block or qualify execution-aware ranking according to exception materiality;
- never force cash to broker balance by manual adjustment.

Insufficient cash does not make the company less attractive.

It affects executable priority only.

---

# 20. Minimum Trade-Lot Constraint

Current operating rule: minimum trade size is 100 shares.

Portfolio-aware execution ranking should flag when:

`100 × current price + estimated transaction costs > executable cash`

Possible status:

- EXECUTABLE NOW
- REQUIRES CASH ACCUMULATION
- BLOCKED BY PORTFOLIO LIMIT
- NOT ASSESSED

This status must not alter Total Investment Score.

---

# 21. Technical / Market Overlay

Technical Entry and Market / Money Flow do not change fundamental rank.

They may be used after fundamental ranking to classify execution timing:

- FAVORABLE
- NEUTRAL
- UNFAVORABLE

A technically weak entry may delay purchase.

It cannot turn a high-quality/cheap company into a weak fundamental candidate.

---

# 22. Top 10 Construction

The investable Top 10 is constructed as follows:

1. start from current VN30 universe;
2. apply Stage 0;
3. apply hard-veto gate;
4. apply Score Validity gate;
5. apply Confidence gate;
6. apply category gates;
7. assign score bands;
8. sort primarily by Total Score;
9. build tie clusters for scores within 2 points;
10. apply secondary fundamental tie-breakers;
11. for portfolio-aware Top 10, apply portfolio impact / sector concentration / opportunity cost;
12. preserve original Total Score;
13. output Top 10 plus excluded/research list.

Top 10 may contain fewer than 10 names.

Do not force 10 candidates if fewer qualify.

---

# 23. Ranking Record

Required output:

| Rank | Ticker | Score | Band | Valuation | Quality | Residual Risk | Confidence | Expected 5Y Return | Validity |
|---:|---|---:|---|---:|---:|---|---|---:|---|

Portfolio-aware expanded output:

| Rank | Ticker | Score | Fundamental Rank | Portfolio Priority | Sector Weight | Position Weight | Execution Status |
|---:|---|---:|---:|---|---:|---:|---|

---

# 24. Excluded / Research List

Every ranking run must retain excluded securities with reasons.

Examples:

- hard veto;
- LOW confidence;
- failed category gate;
- missing valuation input;
- stale data;
- not reliably scorable;
- non-actionable due to portfolio constraint;
- legacy/non-current VN30 membership.

Do not hide excluded names.

---

# 25. Rank Change Attribution

For each reranking:

| Ticker | Prior Rank | Current Rank | Score Change | Rank Change Driver |
|---|---:|---:|---:|---|

Rank changes must distinguish:

- score change;
- confidence change;
- eligibility change;
- portfolio constraint change;
- sector concentration change;
- peer reranking without score change.

A rank move does not necessarily imply thesis change.

---

# 26. Recalculation Triggers

Rerank when:

- material financial results arrive;
- new audited statements arrive;
- valuation changes materially;
- material guidance changes;
- corporate action changes per-share economics;
- VN30 membership changes effective;
- sector assignment changes effective;
- hard-veto status changes;
- data quality/confidence changes;
- material portfolio exposure changes;
- material cash contribution/withdrawal occurs for portfolio-aware ranking.

---

# 27. Historical Ranking / No-Hindsight Rule

Historical ranking as of date `t` may use only:

- data available/effective by `t`;
- membership effective at `t`;
- sector classification effective at `t`;
- price observations valid at `t`;
- estimates known at `t`;
- portfolio state reconstructable at `t`.

Later information may appear only in a separately labeled restated/corrected analysis.

Do not backfill future winners into past Top 10.

---

# 28. Source-of-Truth Boundary

Ranking consumes scorecards and reconstructed portfolio state.

It must not become an authoritative source for:

- score inputs;
- cash;
- positions;
- cost basis;
- NAV;
- corporate-action effects.

Rank tables are derived analytical outputs.

---

# 29. Cost Basis Firewall

Investor average cost, open cost, realized P&L and unrealized P&L are prohibited fundamental rank inputs and tie-breakers.

Never rank a stock higher because:

- it is below cost;
- it is near break-even;
- the investor has a loss;
- averaging down would lower average cost.

Never rank lower solely because it already has a large gain.

Cost basis may appear only as reporting context when reconstructed under the approved accounting method/version.

If cost basis is unreconciled:

- do not infer it from current market price;
- do not copy broker average cost as authoritative truth;
- do not block issuer/fundamental ranking solely for that reason;
- omit cost/P&L-dependent portfolio context.

---

# 30. Double-Count Controls

## 30.1 Score vs tie-break evidence

A tie-breaker must not simply re-count the same raw evidence already embedded in Total Score unless it serves a distinct priority purpose.

Example:

- Valuation Score already contains expected return;
- Expected 5Y Return may still break a tie because it is the explicit forward-return dimension, but must not be converted into extra score points.

## 30.2 Portfolio constraints

Position weight and sector weight affect portfolio priority once.

Do not:

- reduce fundamental score for concentration;
- apply the same concentration penalty in multiple priority stages;
- count position weight both as concentration and as “conviction”.

## 30.3 Confidence

Confidence blocks/qualifies actionability once.

Do not also apply an arbitrary score haircut.

## 30.4 Cash / execution

Cash insufficiency affects execution status once.

Do not additionally downgrade:

- fundamental score;
- valuation score;
- company rank within the fundamental view.

## 30.5 Corporate actions

A corporate action may affect multiple economic dimensions only through distinct channels.

Examples:

- rights issue may affect dilution, financial health and valuation;
- split/bonus shares should not affect economics by themselves;
- merger/spinoff may alter comparability and valuation.

Do not count the portfolio quantity increase/decrease itself as an additional rank signal.

## 30.6 Accounting facts

The following have no ranking evidence role beyond portfolio context:

- investor cost basis;
- realized/unrealized P&L;
- transaction fees/taxes;
- settlement cash movement;
- contribution/withdrawal;
- DCA deployment.

If any appears in rank logic, the ranking result is invalid unless a separate approved execution rule explicitly owns that use.

---

# 31. Corporate-Action Ranking Rules

Corporate actions may affect ranking only after:

- issuer-level comparability is resolved;
- per-share metrics are adjusted;
- authoritative action terms are available;
- portfolio accounting is reconciled where relevant;
- the effective date is appropriate to the ranking `as_of`.

A split/bonus issue alone must not improve/damage rank.

A rights issue may affect rank only through:

- per-share economics;
- capital allocation quality;
- valuation;
- dilution;
- financial health

as economically appropriate.

Do not use portfolio quantity increase itself as a positive growth signal.

## 31.1 Multi-stage action rule

Announcement, entitlement, exercise, share credit and settlement can occur on different dates.

Ranking must:

- use only stages effective/known at the ranking cutoff;
- avoid counting announced future effects as completed;
- avoid counting issuer-level dilution and portfolio quantity change as two independent rank signals;
- avoid treating corporate-action settlement cash as company growth or investor fresh contribution.

## 31.2 Missing action terms

If a material corporate action prevents reliable per-share comparability:

- affected issuer metrics become N/R;
- Confidence may fall;
- Score Validity may become `NOT RELIABLY SCORABLE`;
- ranking must not guess the adjustment.

If only portfolio accounting reconciliation is blocked, issuer-level fundamental ranking may remain available, but portfolio-aware ranking is blocked.

---

# 32. Portfolio Reconstruction Rules

For portfolio-aware ranking, current state must be reconstructable from:

- `Transaction`;
- `TransactionLeg`;
- `CorporateActionEvent` where applicable;
- approved replay/cost-basis method version;
- supported opening migration.

Required reconstructable fields depend on the ranking feature used:

| Feature | Minimum reconstructed state |
|---|---|
| Position exposure | quantity + valid price |
| Sector concentration | quantity + price + effective sector |
| Cash feasibility | settled cash + relevant unsettled obligations |
| Ownership state | quantity/history |
| Cost/P&L display | quantity + open cost + cost-basis method |
| Portfolio NAV context | all applicable assets/liabilities + valid prices |

Derived snapshots may be used for performance, but must remain reproducible.

A broken reconstruction blocks only the portfolio-dependent ranking layer that requires the broken field; it does not automatically invalidate issuer fundamentals.

A broken reconstruction must never trigger manual correction inside the ranking engine.

---

# 32A. Reconstruction Lineage and Historical Corrections

Every persisted portfolio-aware ranking run must record enough lineage to reproduce the result:

- `analysis_as_of_date`;
- portfolio ID;
- portfolio reconstruction/snapshot ID;
- replay method version;
- scoring method version;
- sector-normalization version;
- ranking-rules version;
- market-price timestamp(s);
- relevant reconciliation status.

For reversal/correction groups:

- historical rankings before correction effective time retain the original economic history;
- rankings after correction effective time use original + reversal/correction effects;
- the original transaction must not be silently removed from all historical replay.

For settled-trade corrections:

- linked settlement corrections must be reflected consistently;
- cash, receivable/payable, quantity, cost basis and P&L must reconcile as a group before portfolio-aware ranking resumes.

---

# 33. Deterministic Ordering

Ranking results must be reproducible for the same:

- input scorecards;
- methodology versions;
- as-of date;
- portfolio state/reconstruction version;
- reconciliation status;
- market-price inputs;
- tie-break rules.

If all defined tie-breakers remain equal, use a deterministic final ordering such as immutable `security_id`.

This final deterministic ordering has **no economic meaning**.

---

# 34. Integrity Re-Review — CIO / Equity Research / Quant / Risk

## 34.1 CIO

### Critical
- **0 unresolved.**

### Major issues resolved
1. **Ranking tables could become a shadow source for portfolio state.** Fixed by §1A: rank outputs are disposable derived artifacts.
2. **Portfolio-aware priority could consume manual/unreconciled state.** Fixed by reconstruction-first and integrity gates.
3. **Portfolio constraints could be double-counted across score and priority.** Fixed by §30.

**Result:** **PASS — 0 Critical / 0 Major unresolved.**

## 34.2 Equity Research Analyst

### Critical
- **0 unresolved.**

### Major issues resolved
1. **Corporate-action ranking logic did not fully distinguish issuer economics from portfolio accounting stages.** Fixed by §31.
2. **Missing action terms could tempt guessed per-share adjustment.** Fixed: N/R/block behavior is explicit.
3. **Investor gain/loss/cost basis could still influence analyst ranking narrative.** Fixed by §29.

**Result:** **PASS — 0 Critical / 0 Major unresolved.**

## 34.3 Quant Analyst

### Critical
- **0 unresolved.**

### Major issues resolved
1. **Portfolio-aware ranking lacked complete reproducibility lineage.** Fixed by §32A.
2. **Reversal/correction semantics were not explicit in historical rankings.** Fixed with effective-time correction rules.
3. **Field-level reconstruction dependencies were too coarse.** Fixed by §32 dependency matrix.
4. **Cash/portfolio constraints could be applied more than once.** Fixed by double-count controls.

**Result:** **PASS — 0 Critical / 0 Major unresolved.**

## 34.4 Risk Manager

### Critical
- **0 unresolved.**

### Major issues resolved
1. **Cash feasibility did not explicitly prohibit broker/manual cash as truth.** Fixed by §19.
2. **Cost-basis reconstruction failure could unnecessarily contaminate non-cost portfolio ranking.** Fixed by scoped blocking.
3. **Corporate-action multi-stage accounting could leak into ranking twice.** Fixed by §31.1.
4. **Settled-trade corrections could produce inconsistent exposure/cash rank if settlement correction lagged.** Fixed by §32A group reconciliation rule.
5. **Unsupported reconstruction could trigger analyst/manual repair.** Explicitly prohibited.

**Result:** **PASS — 0 Critical / 0 Major unresolved.**

## 34.5 Cross-domain closure

| Area | Result |
|---|---|
| Source of truth | PASS |
| Shadow-ranking-state prevention | PASS |
| Double counting | PASS |
| Cost-basis firewall | PASS |
| Cash reconciliation | PASS |
| Corporate-action handling | PASS |
| Multi-stage action handling | PASS |
| Portfolio reconstruction | PASS |
| Historical correction/reversal logic | PASS |
| Deterministic reproducibility | PASS |
| Critical unresolved | **0** |
| Major unresolved | **0** |

> **Integrity conclusion: `RANKING_RULES.md` v0.2 has 0 Critical and 0 Major unresolved issues.**

---

# 35. Validation Requirements

`VALIDATION_CASES.md` must test:

1. high score + hard veto;
2. high score + LOW confidence;
3. high total score + failed Financial Health gate;
4. scores 82 vs 83 treated as tie cluster;
5. lower score but higher expected return within tie cluster;
6. high expected return driven by low-confidence multiple expansion;
7. top candidate blocked by sector concentration;
8. high-quality candidate requiring cash accumulation for 100-share lot;
9. no qualifying tenth candidate → Top 10 has fewer than 10;
10. corporate-action-adjusted reranking;
11. portfolio reconstruction failure blocking portfolio-aware rank only;
12. historical reranking without future information;
13. rank change caused by price/valuation without thesis deterioration;
14. existing holding with large gain not automatically reduced;
15. losing position not promoted due to cost basis;
16. broker cash mismatch blocking execution-aware rank without overwriting ledger;
17. cost-basis-only reconstruction failure leaving exposure rank available but cost/P&L unavailable;
18. settled-trade correction requiring linked settlement reconciliation before portfolio-aware ranking;
19. rights issue with announcement/entitlement/share-credit/settlement across different dates;
20. split/bonus issue changing quantity but not fundamental rank;
21. portfolio-aware rank reproducible from transaction history and method versions;
22. manual `current_cash`/position snapshot rejected as ranking input.

---

# 36. Approval Gate

Approve `RANKING_RULES.md` only if:

1. Fundamental Ranking, Investable Ranking and Portfolio-Aware Ranking remain distinct.
2. Only `VALID — ACTIONABLE` names enter investable ranking.
3. LOW Confidence is excluded from new-capital Top 10.
4. Hard veto overrides score/rank.
5. Category gates are non-compensable.
6. 1–2 point score differences are treated as ties by default.
7. Tie-break priority starts with expected return, residual risk, confidence and MOS.
8. Portfolio/sector concentration does not modify fundamental score.
9. Cash is a valid opportunity-cost alternative.
10. Top 10 may contain fewer than 10 securities.
11. Investor cost basis/P&L never influences rank.
12. Market/technical overlays never rewrite fundamental rank.
13. Corporate actions affect ranking only after economic comparability is resolved.
14. Portfolio-aware ranking requires reconstructable M2 state.
15. Historical ranking obeys no-hindsight rules.
16. Final tie ordering is deterministic but economically meaningless.
17. Ranking outputs never become authoritative stores for cash, position, cost basis, P&L, NAV or corporate-action effects.
18. Portfolio-aware ranking consumes only reconstructable M2 state with reconciliation/method lineage.
19. Cash feasibility uses ledger-derived cash; broker/manual cash cannot overwrite it.
20. Cost-basis failures block only cost/P&L-dependent context, not unrelated issuer fundamentals.
21. Corporate-action stages are effective-dated and cannot be double-counted between issuer economics and portfolio accounting.
22. Historical correction/reversal semantics preserve original history before correction effective time.
23. The next M3 file will not begin until explicit approval.

---

## Status

> **APPROVED — VERSION 1.0 — 0 CRITICAL / 0 MAJOR UNRESOLVED**
