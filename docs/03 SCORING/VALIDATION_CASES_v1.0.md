# VN30 Value Investing OS — Validation Cases

**Document:** `03_SCORING/VALIDATION_CASES.md`  
**Milestone:** 3 — VN30 Scoring Engine  
**Status:** Approved  
**Version:** 1.0  
**Date:** 2026-09-06  
**Governing Documents:** `SCORING_MODEL.md` v1.0, approved M3 files through `RANKING_RULES.md` v1.0, `RISK_POLICY.md` v1.0, `DECISION_FRAMEWORK.md` v1.0, `DATA_MODEL.md`, `DATA_RULES.md`

---

# 1. Purpose

This document defines the minimum validation suite required before the VN30 Scoring Engine may be considered production-ready.

Validation must prove that the engine:

- preserves the approved 100-point architecture;
- compares sectors on principle-equivalent economics;
- avoids false precision and double counting;
- blocks value traps and quality-at-any-price errors;
- handles missing/stale data safely;
- respects hard vetoes, confidence and category gates;
- preserves source-of-truth boundaries;
- prevents investor cost basis/P&L from contaminating fundamentals;
- blocks portfolio-aware outputs when accounting state is unreconciled;
- handles corporate actions and historical corrections correctly;
- can reconstruct portfolio-aware ranking from transaction history.

The suite validates rules and invariants, not whether later share prices rose.

---

# 2. Test Case Contract

Every case must record:

| Field | Requirement |
|---|---|
| Case ID | Required |
| Scenario | Required |
| Inputs | Required |
| Input class | FACT / ESTIMATE / ASSUMPTION / SYNTHETIC |
| Method versions | Required |
| Expected score behavior | Required |
| Expected ranking behavior | Required |
| Expected confidence/validity | Required |
| Source-of-truth expectation | Required |
| Actual result | Required during implementation |
| PASS/FAIL | Required |
| Severity | Critical / Major / Minor |
| Fix version | Required after remediation |

---

# 3. Global Exit Criteria

M3 validation passes only when:

- **0 Critical failures remain**;
- **0 Major failures remain**;
- all accounting-integrity cases pass;
- all no-hindsight cases pass;
- all mandatory sector cases pass;
- all ranking-gate cases pass;
- all missing-data cases pass;
- all reproducibility cases pass.

Minor calibration observations may remain if documented and non-blocking.

---

# 4. Architecture & Gate Cases

## VC-001 — Score architecture
Expected: category maxima sum to 100; no hidden bonus/penalty; technical and money-flow overlays add 0 points.

## VC-002 — Technical cannot rescue weak fundamentals
Input: weak fundamentals, favorable technicals.  
Expected: fundamental score unchanged; technical status remains overlay.

## VC-003 — Money flow cannot rescue weak fundamentals
Expected: supportive flow may affect timing only.

## VC-004 — High score + failed Financial Health gate
Input: total 82, Financial Health 7/15.  
Expected: excluded from normal investable ranking.

## VC-005 — High valuation score + weak Business Quality
Expected: category gate blocks value-trap candidate.

## VC-006 — High quality + inadequate forward return
Expected: insufficient valuation/return blocks normal new-capital eligibility.

## VC-007 — High score + hard veto
Expected: excluded from investable ranking; veto cannot be overridden.

## VC-008 — High score + LOW Confidence
Expected: numeric score preserved; excluded from new-capital Top 10.

---

# 5. Missing Data & Confidence Cases

## VC-020 — Missing metric is not zero
Expected: substitute/range/N/R/block; never automatic zero or midpoint.

## VC-021 — Missing weight is not redistributed
Expected: other metrics do not receive extra weight.

## VC-022 — Decision-critical valuation input missing
Expected: valuation N/R or total `NOT RELIABLY SCORABLE`.

## VC-023 — New authoritative data known but not incorporated
Expected: scorecard marked stale/provisional.

---

# 6. Sector Comparability Cases

## VC-030 — Bank vs industrial leverage
Bank: strong CAR, low NPL, strong coverage.  
Industrial: same apparent Debt/Equity, weak interest coverage.  
Expected: bank not judged by industrial leverage rules.

## VC-031 — Bank high ROE from weak provisioning
Input: ROE 22%, rising NPL, weak coverage, abnormally low credit cost.  
Expected: no exceptional quality score solely from ROE.

## VC-032 — Developer low P/E but weak cash realization
Input: P/E 5x, weak collections, legal delay, refinancing pressure.  
Expected: low P/E does not establish cheapness.

## VC-033 — Technology low tangible book
Input: high ROIC, recurring revenue, strong FCF.  
Expected: low tangible book is not a penalty by itself.

## VC-034 — Retail store growth with deteriorating unit economics
Expected: Growth score capped/reduced.

## VC-035 — Materials peak-cycle low P/E
Expected: normalized earnings used; `PEAK_CYCLE_RISK` set.

## VC-036 — Materials trough-cycle high P/E
Expected: symmetric normalization; trough P/E not treated mechanically as expensive.

---

# 7. Double-Counting Cases

## VC-040 — FCF family
High FCF yield, low P/FCF and attractive DCF all use same forecast.  
Expected: one correlated evidence family; no triple confirmation bonus.

## VC-041 — Bank asset-quality cluster
Rising NPL, falling coverage, higher credit cost.  
Expected: distinct channels only; no repeated full penalty.

## VC-042 — Retail inventory stress
Inventory days rise, CFO weakens, liquidity worsens.  
Expected: root cause identified; no automatic triple penalty.

## VC-043 — Developer legal delay
Expected: growth/RNAV/risk effects separated; same uncertainty not deducted repeatedly.

## VC-044 — Portfolio constraints
Expected: sector weight and position weight affect portfolio priority once; fundamental score unchanged.

## VC-045 — Confidence
Expected: confidence qualifies actionability once; no second score haircut.

---

# 8. Cost-Basis Firewall Cases

## VC-050 — Below investor cost but above intrinsic value
Average cost 100, market price 70, intrinsic value 65.  
Expected: no upgrade from being below cost.

## VC-051 — Large gain but still undervalued
Average cost 50, market 100, intrinsic value 130.  
Expected: gain alone does not reduce rank.

## VC-052 — Cost basis unreconciled
Quantity/cash valid, opening basis missing.  
Expected: fundamental and exposure ranking may remain available; cost/P&L unavailable.

## VC-053 — Broker average cost differs from reconstructed basis
Expected: broker average cost is reconciliation evidence only; no overwrite.

---

# 9. Cash Reconciliation Cases

## VC-060 — Broker cash mismatch
Ledger cash 10m; broker cash 10.5m.  
Expected: ledger remains authoritative; exception created; no manual overwrite.

## VC-061 — Planned DCA is not cash
Plan 5m, no contribution transaction.  
Expected: executable cash does not increase.

## VC-062 — Unsettled receivable
Expected: shown separately from settled cash.

## VC-063 — 100-share lot infeasible
Expected: `REQUIRES CASH ACCUMULATION`; score unchanged.

## VC-064 — Manual current_cash rejected
Expected: reconstructed ledger cash wins.

---

# 10. Corporate Action Cases

## VC-070 — Stock split
Expected: quantity adjusts, total basis preserved, per-share history adjusted, no economic dilution.

## VC-071 — Bonus shares
Expected: mechanical share change, no automatic value creation or dilution.

## VC-072 — Rights issue — economically neutral/accretive
Expected: assess per-share value impact, not raw share-count growth.

## VC-073 — Rights issue — destructive dilution
Expected: Capital Allocation/valuation effects only through real per-share economics.

## VC-074 — Merger/spinoff with missing terms
Expected: affected metrics N/R; no guessed continuity.

## VC-075 — Multi-stage corporate action
Stages: announcement → entitlement → exercise → share credit → settlement.  
Expected: only effective/known stages used; no duplicate quantity/cash/basis.

## VC-076 — Corporate-action settlement
Expected: settlement cash not treated as company growth or fresh owner contribution.

---

# 11. Transaction Reconstruction Cases

## VC-080 — Ordinary BUY
Expected: quantity and cost basis increase once; obligation represented once.

## VC-081 — BUY settlement
Expected: cash decreases once; payable clears; no second quantity/basis effect.

## VC-082 — Partial SELL
Expected: quantity decreases; MWAC cost released once; realized P&L once.

## VC-083 — SELL settlement
Expected: cash increases once; receivable clears; no second P&L.

## VC-084 — Full exit and re-entry
Expected: full exit leaves quantity/open cost at zero; re-entry starts new cost cycle.

## VC-085 — Opening migration
Expected: explicit opening cash/quantity/verified basis; no typed Position truth.

## VC-086 — Missing opening basis
Expected: exposure reconstructs; cost/P&L does not; pre-inception P&L unknown.

---

# 12. Reversal / Correction Cases

## VC-090 — Trade reversal
Expected: original remains visible historically; reversal applies exact inverse from effective time.

## VC-091 — Correcting settled BUY
Required sequence: reverse settlement → reverse trade → corrected trade → corrected settlement.  
Expected: cash, payable, quantity, basis and P&L reconcile as one correction group.

## VC-092 — Historical rank before correction
Expected: pre-correction ranking retains original economic history.

## VC-093 — Historical rank after correction
Expected: original + reversal/correction effects apply from correction effective time onward.

---

# 13. Ranking Cases

## VC-100 — 82 vs 83 tie
Expected: tie cluster; secondary tie-breakers used.

## VC-101 — Higher expected return inside tie
Expected: higher-return name ranks above only when confidence/risk are comparable.

## VC-102 — Higher return but weaker confidence
Expected: no mechanical return-only win.

## VC-103 — Sector concentration blocks addition
Expected: fundamental rank unchanged; portfolio priority declines/blocks.

## VC-104 — Top 10 has fewer than 10
Expected: do not force weaker names into Top 10.

## VC-105 — Cash accumulation opportunity
Expected: company remains attractive; execution status requires accumulation.

## VC-106 — Cost basis cannot break tie
Expected: investor gain/loss ignored.

---

# 14. No-Hindsight & Effective-Dating Cases

## VC-110 — Future VN30 inclusion
Expected: not treated as member before effective date.

## VC-111 — Historical sector assignment
Expected: use sector effective at cutoff.

## VC-112 — Later annual report
Expected: unavailable to historical score before release.

## VC-113 — Later price outcome
Expected: cannot influence historical methodology.

## VC-114 — Future corporate-action terms
Expected: announcement/effective stages handled according to information available at cutoff.

---

# 15. Portfolio-Aware Reconstruction Cases

## VC-120 — Fundamental rank valid, portfolio reconstruction blocked
Expected: Fundamental Ranking available; Portfolio-Aware Ranking unavailable.

## VC-121 — Cost-basis-only failure
Expected: exposure/concentration rank available; cost/P&L unavailable.

## VC-122 — Manual current position conflicts with ledger
Expected: reconstructed quantity wins.

## VC-123 — Manual cash conflicts with ledger
Expected: reconstructed cash wins.

## VC-124 — Reproducible portfolio-aware rank
Given same scorecards, transaction history, replay version, prices, sector mapping, ranking version and as-of: identical rank output.

## VC-125 — Settled-trade correction incomplete
Expected: portfolio-aware ranking blocked until linked settlement/trade correction reconciles.

---

# 16. Calibration Diagnostics

## 16.1 Sector distribution review
Inspect median, dispersion, category medians and outliers by sector.  
Do not force equal sector medians.

## 16.2 Score saturation
Flag if too many names score >90 or categories cluster near maxima.

## 16.3 Excessive dispersion
Flag if tiny input differences produce large score differences.

## 16.4 Tie-frequency review
If almost every stock ties, rubrics may be too coarse.  
If no stocks tie, model may be creating false precision.

## 16.5 Top-10 stability
Test whether trivial input changes cause excessive Top-10 churn.

---

# 17. Source-of-Truth Invariants

The validation suite must explicitly fail any implementation that:

1. treats rank tables as authoritative accounting state;
2. manually edits `current_cash` to match a broker;
3. manually edits average cost;
4. reconstructs holdings from Position rows instead of transaction history;
5. guesses missing opening basis;
6. uses planned DCA as actual cash;
7. posts trade accounting again at settlement;
8. counts net settlement plus fee/tax again;
9. treats split quantity increase as a BUY;
10. removes reversed transactions retroactively from all history;
11. uses current sector/VN30 membership for all historical dates;
12. guesses missing corporate-action terms;
13. uses investor P&L as fundamental evidence.

Any such failure is Critical or Major depending on impact.

---

# 18. Severity Definitions

## Critical
A failure that can corrupt authoritative state, override a hard veto, use future information in historical ranking, fabricate missing data, or drive portfolio-aware decisions from unreconstructable state.

## Major
A failure that can materially distort category score/ranking, create structural sector bias, double-count material evidence, contaminate valuation with investor cost basis, or materially mishandle corporate actions.

## Minor
A presentation/calibration issue that does not change core economic correctness.

---

# 19. Review — CIO / Equity Research / Quant / Risk

## CIO
**Critical:** 0 unresolved.  
**Major:** 0 unresolved.  
Coverage includes value traps, quality-at-any-price, opportunity cost, Top-10 gating and separation of rank from action state.  
**Result:** PASS for validation architecture.

## Equity Research Analyst
**Critical:** 0 unresolved.  
**Major:** 0 unresolved.  
Coverage includes banks, developers, technology, retail, materials, cycle normalization and corporate-action comparability.  
**Result:** PASS.

## Quant Analyst
**Critical:** 0 unresolved.  
**Major:** 0 unresolved.  
Deterministic rules, historical reconstruction, tie behavior, reproducibility and calibration diagnostics are separated.  
**Result:** PASS pending implementation execution.

## Risk Manager
**Critical:** 0 unresolved.  
**Major:** 0 unresolved.  
Cash reconciliation, cost-basis failure, opening migration, reversals/corrections, hard vetoes and blocked reconstruction are covered.  
**Result:** PASS.

---

# 20. Milestone 3 Exit Criteria

M3 may be considered complete only after:

1. all six M3 documents are approved;
2. this validation suite is approved;
3. 0 Critical and 0 Major design issues remain;
4. all hard invariants are internally consistent;
5. architecture supports all current VN30 sectors without accounting-structure bias;
6. ranking remains separate from Buy/Hold/Sell decisions;
7. portfolio-aware logic consumes M2 reconstructed state only;
8. M3 baseline document versions are frozen.

Approval of this file completes the **design/documentation baseline** for M3. It does not itself prove a future code implementation passes these cases.

---

# 21. Approval Gate

Approve `VALIDATION_CASES.md` only if:

1. 100-point scoring invariants are tested.
2. Category gates are tested.
3. Confidence/missing-data rules are tested.
4. Sector comparability is tested.
5. Peak/trough cycle normalization is symmetric.
6. Double counting is tested.
7. Investor cost-basis/P&L firewall is tested.
8. Cash reconciliation is tested.
9. The 100-share constraint is tested without changing score.
10. Corporate actions, including multi-stage events, are tested.
11. BUY/SELL/settlement reconstruction is tested.
12. Opening migration and missing basis are tested.
13. Reversal/correction semantics are tested.
14. Tie clusters and Top-10 gates are tested.
15. No-hindsight/effective dating is tested.
16. Portfolio-aware ranking reconstruction is tested.
17. Calibration does not force equal sector averages.
18. Severity definitions are accepted.
19. M3 completion requires explicit user approval.
20. No move to M4 occurs automatically.

---

## Status

> **APPROVED — VERSION 1.0 — MILESTONE 3 DESIGN/DOCUMENTATION BASELINE COMPLETE**
