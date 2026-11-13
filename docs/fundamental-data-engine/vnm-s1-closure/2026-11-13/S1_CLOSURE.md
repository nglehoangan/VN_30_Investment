# VNM S1 acceptance — CLOSED

S1 economic-returns gap is **CLOSED** under the owner S1 resolution policy and existing M3 rules. No indispensable S1 input remains absent. No additional user data or renewed policy approval is required.

This is the current successor acceptance to the earlier S1 BLOCKING/uncompleted-review findings. Original reports, computations and evidence remain unchanged. Closing this issue does not admit financial facts, complete rubric scores or authorize production.

## Mandatory M3 reconciliation

| Requirement | Rule | Result and evidence |
| --- | --- | --- |
| NORMALIZATION | METRIC_DEFINITIONS §§3.3,4.1; SCORING_MODEL §§13.2–13.3 | **PASS** — Consolidated operating earnings exclude finance/associate income and charge group personnel fund once; tax and identified cost cases explicit, including adverse credit reversal treatment. `docs/fundamental-data-engine/vnm-s1-economic-returns/2026-11-13/S1_RESOLUTION.md` |
| CAPITAL_SCOPE | METRIC_DEFINITIONS §§4.1,12.4 | **PASS** — Matching group/NCI scope; opening/closing average operating assets less noninterest operating liabilities; financial asset/cash/residual ranges; leases consistently expensed. `docs/fundamental-data-engine/vnm-s1-economic-returns/2026-11-13/S1_ECONOMIC_RETURNS.json` |
| RETURNS_PERSISTENCE_MARGINS | SCORING_MODEL §5.1; METRIC_DEFINITIONS §§3.1,4.1 | **PASS_WITH_LIMITS** — Four annual observations exceed the three-year trend minimum. Gross margins about39.86–41.42%; no extrapolation of durability from ROIC alone; fifth year is preferred, not a new mandatory input. `docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/WACC_ROIC_Q3_ASSESSMENT.json` |
| CAPITAL_COST | SCORING_MODEL §5.1; methodology.ts BQ-EQ topics cost_of_capital | **PASS_WITH_LIMITS** — Nominal-VND WACC estimate7.57–10.79%; source-vintage, country/beta/debt/NCI proxies disclosed. Minimum historical conservative spread12.70pp; positive spread is conditional on tested assumptions. `docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/FINAL_REVIEW.md` |
| CURRENT_UPDATE | METRIC_DEFINITIONS §§3.1,4.1,14,13.1 | **PASS_WITH_LIMITS** — Q3 incorporated. Current-state TTM operating earnings bridged; exact TTM ROIC N/R for absent same-basis Sep2025 capital. Matching 9M return23.70–35.09% versus9M WACC charge5.67–8.09% supplies bounded current comparison. No annualized9M substitution or stale H1-only conclusion. `docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/WACC_Q3_INPUTS.json` |
| INCREMENTAL_COMPARABILITY | METRIC_DEFINITIONS §§6.3,13.1; methodology.ts GQ-INC | **N_R_PERMITTED** — Annual/multi-year deltas and reclassification quantified; small/distorted capital changes preclude reliable ratio. No project table mandated. GQ-INC score remains null/N/R; no attractive incremental-return conclusion or automatic points. `docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/WACC_ROIC_Q3_ASSESSMENT.json` |
| CONFIDENCE_CONTRADICTIONS | SCORING_MODEL §§2.5,13.1,13.4; METRIC_DEFINITIONS §§13.1–13.2,15 | **PASS_WITH_LIMITS** — Analytical confidence MEDIUM; future persistence, accounting classification, WACC proxies and incremental/TTM limits explicit. No unresolved material contradiction invalidates the bounded level-of-return/spread conclusion. These limits still constrain downstream rubric judgment. `docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/FINAL_REVIEW.md` |
| REPRODUCIBILITY | Owner S1 acceptance; METRIC_DEFINITIONS §17 | **PASS** — Native source references, hashes, original receipts,65 selected Q3 cells and deterministic annual/current replay preserved. Validation must pass before closure record is used. `docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/VALIDATION.json` |
| DOUBLE_COUNT_BOUNDARY | METRIC_DEFINITIONS §§4.1,10.1,16; SCORING_MODEL §11 | **PASS** — BQ-EQ return-level evidence does not grant GQ-INC or CA-REINV/CA-PSV points; common earnings/valuation and per-share outcomes remain distinct S5/rubric responsibilities. `src/domain/scoring/methodology.ts` |

## Missing-data and scoring rulings

METRIC_DEFINITIONS §3.1 defaults current state to TTM; §4.1 prefers five years plus TTM. This is addressed explicitly rather than silently waiving it: four annual periods meet the three-year trend minimum, TTM earnings are bridged, Q3 capital/earnings are checked on a matching nine-month basis, and the unavailable exact TTM capital ratio remains N/R under §13.1. A nine-month return is never presented as annual or TTM.

Incremental efficiency has been assessed, including the quantified presentation change. §6.3 says: “Do not calculate mechanically when denominator is very small or distorted by acquisitions/corporate actions.” The N/R result resolves the *analysis request* without asserting that growth creates value. GQ-INC remains unscored; if it prevents a reliable Growth category or total score, SCORING_MODEL §13.4 still applies. That downstream scoring limit is not an unresolved S1 source-data demand or grounds to reopen a project-level schedule requirement.

The evidence covers executable BQ-EQ topics returns, persistence, margins and cost_of_capital. It supports historical/current operating-return spreads in the tested ranges; it does not establish perpetual superior returns, maximum rubric points, fair value, common cash distributions or per-share investment outcomes. CA-REINV/CA-PSV and S5 require their own distinct evidence. Confidence remains MEDIUM for this analytical assessment, with documented proxy and comparability limits; no blanket score haircut, zero or midpoint is assigned.

## Validation and final disposition

S1_ACCEPTANCE.json is machine-readable; VALIDATION.json records actual reruns, source/policy pins, deterministic closure replay and protected database/account/scoring bytes. S1_S5_CURRENT_RECONCILIATION.md and CURRENT_BLOCKER_REGISTER.md carry forward the other issues and replace only the S1 finding. S2, S3, S4-ADMISSION, S5 and independent scoring/executable gates are unchanged. Full VNM scoring is not ready; no score, financial admission, VNM17 promotion, production activation or portfolio mutation is created.
