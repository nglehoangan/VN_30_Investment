# DFR-02 final review

**IMPLEMENTED AND VALIDATED — PENDING OWNER APPROVAL.** Work stops at this review boundary. The six-issuer research slice remains separate from production acceptance and from expansion to other issuers.

## Deliverables

1. [DFR_02_METRIC_MAPPING.md](DFR_02_METRIC_MAPPING.md) — sector routes, source selection, decimal arithmetic, comparability and exact metric ledger.
2. [DFR_02_FINANCIAL_SUMMARIES.md](DFR_02_FINANCIAL_SUMMARIES.md) — financial health, growth, cash/economic realization, industry risks and conditional valuation for all six issuers.
3. [DFR_02_RUBRIC_READINESS.md](DFR_02_RUBRIC_READINESS.md) — all 138 rubric dispositions and topic-specific remaining work.
4. [DFR_02_ASSESSMENT_RESULTS.md](DFR_02_ASSESSMENT_RESULTS.md) — completed topic evidence, counterevidence, exact M3 bands and self-challenge rationale.
5. [DFR_02_VALIDATION.md](DFR_02_VALIDATION.md) — mandatory fixtures, expected/actual results, deterministic replay and production-boundary evidence.
6. This final review — progress, conflicts, valuation limits, issue severity and the owner decision.

Machine-readable evidence: [issuer dossiers](issuers/), [progress versus DFR-01](progress-vs-dfr01.json), [source conflicts](source-conflicts.json), [issues](issues.json), [input pins](input-snapshot.json), [current research manifest](manifest.json).

## Exact progress versus DFR-01

| Measure | DFR-01 | DFR-02 final |
|---|---:|---:|
| Existing supported parent-accounting-capital metric instances | 4 | 4 retained unchanged |
| New supported derived financial metric instances | 0 | **351**, across **45 distinct derived concepts** |
| Newly research-supported reported fact instances | 0 in the bounded DFR-01 metric layer | **352** reused exact reviewed source values |
| Completed research rubrics | 1/138 | **4/138**, including **3 new** |
| NOT_RATED rubrics | 137 | **132** |
| READY_FOR_REVIEW rubrics, null points | 0 | **1** |
| CONFLICT rubric, null points | 0 | **1** |
| Total rubrics still unscored | 137 | **134** |
| Complete formal issuer acceptance | 0 | **0** |

An instance is issuer × concept × period × scope. The 352 facts are existing reviewed values newly usable in this research layer, not newly acquired or admitted accounting facts. The 351 calculations include annual ratios, signed cash bridges, year-on-year and FY22→FY25 cumulative changes; they are not 351 independent investment conclusions. No total score or ranking is produced.

## Research judgments ready for owner review

| Issuer/rubric | Exact approved M3 band | Points | Disposition |
|---|---|---:|---|
| VNM / BQ-CASH | Adequate realization with material qualifications | **3/6** | New completed provisional judgment |
| BID / RG-UNC | High uncertainty | **0/2** | New completed provisional judgment |
| VHM / RG-UNC | High uncertainty | **0/2** | New completed provisional judgment |
| VIC / RG-UNC | High uncertainty | **0/2** | Existing DFR-01/R4 judgment retained |
| FPT / BQ-CASH | No completed band | null | READY_FOR_REVIEW; recognition/one-off and restated WC review incomplete |
| TCX / RG-UNC | No completed band | null | CONFLICT; exact common-numerator path and trading/funding challenge remain open |

The new zero-point uncertainty judgments rest on named economic evidence: BID recoveries/reversal/credit-charge alternatives, and VHM handover/cash-timing/transaction-income variability. They are not missing-data penalties or claims of accounting failure. VNM's 3/6 is a qualified economic-realization judgment using actual parent cash/notes reconciliation; reported group CFO/NPAT is explicitly not substituted for the M3 normalized ratio. These are AI research judgments with source review and a separate self-challenge pass, not independent human review or authenticated formal scoring artifacts. Owner approval is still pending.

## Material source conflicts and containment

- **VHM NCI:** retained extraction reads `11137.640` million VND; the exact prior reviewed page reads `11137640`. Both survive. The raw candidate is conflicting; the separate source-hash/page/closing-column overlay supports corrected accounting capital. No full statement is silently corrected.
- **VIC closing column:** unresolved year keys remain unresolved. The exact reviewed physical page 12 qualifies the closing-capital path only. No generic unresolved→FY2025 conversion is used.
- **FPT/VHM source-vintage bindings:** certain FY2025 balance-sheet items retain READY_FOR_REVIEW. Only their dependent ratios/trends are withheld. Reported cash/income paths with separate sufficient evidence continue.
- **TCX common EPS numerator:** a 1-VND printed/retained difference remains open on that specific concept and dependent estimates. Separate reviewed total standalone NPAT and accounting capital remain usable.
- **CaféF:** undeclared unit/scope/template quality prevents numerical fallback. Numerical agreement or difference is not treated as proof of source equivalence/provider error. HPG clustered zeros remain an adverse fixture, never cashflow facts.

The primary source for many supported facts is a pinned pre-existing reviewed PDF record/transcription, not newly certified OCR. Exact PDF extraction matches and original lexical values are attached where definition/page/period/caption or code resolves. Missing matches and VNM's field-specific page granularity remain visible; no new visual inspection is claimed.

## Issuer-specific valuation limits

| Issuer | Supported research use | What still prevents accepted valuation/per-share/MoS |
|---|---|---|
| FPT | Group financial trends, reported cash and positive post-acquisition cash; inherited conditional owner-cash cases | Exhaustive one-offs, restated WC, maintenance/growth split, cash-conversion/incremental-return persistence, common claims and compatible share/action/price |
| VNM | Group trends and separate FY2024–FY2025 standalone cash/tax/WC/fund bridge; inherited parent owner-cash DCF | Recurrence of finance credits, maintenance/reinvestment assumptions and sustainable parent distributions; no second subsidiary-value addition; compatible share/action/price |
| BID | Loan/deposit/reserve/CAR diagnostics, source-read recovery/reversal drivers, accounting-capital return sensitivities | Loan-level normalized credit cost/NPL/accrued-interest quality, recoverable/distributable capital, return persistence, common claims and same-cutoff market/share basis |
| TCX | Standalone margin financing, funding, exact date-key capital and paired revaluation bridge | Printed common-numerator conflict, market-cycle/trading recurrence, collateral/funding downside, regulatory/distributable capital and same-cutoff market/share basis |
| VIC | Reported trends/cash and named positive/negative common-incidence cases; exact closing capital | No selected common-earnings midpoint; sponsor/disposal/tax/preference/NCI waterfall and project/industrial common cash are not resolved. Book capital is not SOTP/RNAV |
| VHM | Handover/cash variability, source-sized termination/transfer readings and corrected closing NCI/capital | Recurring-versus-transaction earnings, project cash/completion cost/restrictions, tax/debt/minority waterfall and share/action/price compatibility. Book capital is not project RNAV |

All valuation cases keep their existing source identity, financial inputs, explicit assumptions and invalidation conditions. No new price, share count, publication date or missing financial operand is invented.

## Issue severity

**0 Critical / 6 Major / 2 Minor** in the bounded DFR-02 research-readiness register. Two Major issues are contained by exact overlays and four remain open; both Minor issues remain open. This does not replace historical B6/M7/M8 release severity or acceptance findings.

Major: VHM NCI extraction; limited VIC/VHM closing-column overlays; FPT/VHM vintage bindings; unqualified provider fallback; remaining rubric topic coverage; separate valuation/formal prerequisites. Minor: TCX's exact 1-VND numerator difference; VNM field-level page/box granularity. Exact state, issuer and next action are in [issues.json](issues.json).

## Validation and owner decision

**25 DFR-02 tests + 15 DFR-01 tests + 18 investment-research-v2 tests passed; 54 formal-boundary rejection probes passed.** Same-input replay produced 19 byte-identical research output files. All 7,122 protected fingerprints and the earlier DFR-01 protected baseline remain unchanged; approved authority also verifies unchanged.

**Owner decision requested:** approve or amend this six-issuer metric mapping, the three new partial research judgments and the documented deferred/conflicting dispositions. No further issuer expansion, remediation phase or activation proceeds from this receipt alone. Formal acceptance still requires its own exact route, bindings/seal, DI1–DI15, strict-v2 and applicable financial/share/action/market/valuation prerequisites and authorized sign-off.

Execution has stopped for owner review. Production, canonical accounting, scoring/ranking, decision/DCA, NAV and ledger are unchanged. Nothing was deployed, committed or pushed.
