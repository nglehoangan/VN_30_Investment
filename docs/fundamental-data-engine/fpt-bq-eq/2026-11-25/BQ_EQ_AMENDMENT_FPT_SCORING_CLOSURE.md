# BQ-EQ Amendment v1.0 and FPT scoring closure

| Result | FY2025 foundation | 13 November 2026 |
|---|---:|---:|
| Executable BQ-EQ | **5/8 · CONSERVATIVE** | **N/R · null** |
| Economic basis | Good economics under funded-capital sensitivity | Post-FTEL return spread and persistence remain unresolved |
| Authority | Isolated real-issuer research | Isolated real-issuer research |

## Approval and implementation

The owner approved D1–D8 on 25 November 2026. The successor methodology record registers Approved Baseline v1.0 for BQ-EQ and binds it to a separate research executable. Formal scores, persistence, publication and production activation require separate exact authority. [Owner request](OWNER_REQUEST.txt) · [Approved methodology record](../../../03%20SCORING/BQ_EQ_EVIDENCE_SUFFICIENCY_v1.0.json)

The isolated scorer requires eligible references for returns, three or more consecutive FYs of persistence, an appropriate cost-of-capital estimate and counterevidence. Margins default to supporting. They become required where material to the thesis or where the maximum score is selected. The scorer checks the approved A–D route order, measure/hurdle compatibility, scope comparability, leverage review, stronger evidence for the upper point and exceptional justification for the maximum. Peer context is optional under the existing own-history and absolute-anchor rules. The existing registry supplies 0, 1–2, 3–4, 5–6 and 7–8 unchanged.

The FPT adapter checks the single-ticker guard, validates retained file hashes, verifies financial-cell pointers and issuer/scope/unit identity, replays derived metrics and calls the isolated scorer for both stages. Economic conclusions, normalizations and band selection remain explicit analyst judgments. The executable independently admits or rejects the submitted points against the amended contract. It emits a research receipt on stdout. The existing production calculators, routing, Stage 0 and M1 Risk Policy gates, economic-channel double-count controls and total-score null policy retain their original paths. The receipt has null total, Stage 0 UNKNOWN, hard veto PENDING, residual risk NOT_RATED and decision eligibility false.

## Actual financial calculations

Amounts in **VND trillion**, rounded to three decimals. The FY funded-capital sensitivities show **0%, 50%, 100%** deductions of short-term held-to-maturity deposits in that order.

| Metric | FY2022 | FY2023 | FY2024 | FY2025 | 9M2026 to 30 Sep |
|---|---:|---:|---:|---:|---:|
| Net revenue | 44.010 | 52.618 | 62.849 | 70.113 | 40.023 |
| Direct EBIT, normalization proxy | 6.795 | 8.452 | 10.508 | 10.989 | 5.900 |
| Operating tax assumption | 20% | 20% | 20% | 20% | 20% stress; 11.33% consolidated effective rate |
| NOPAT at 20% | 5.436 | 6.761 | 8.407 | 8.791 | 4.720, sensitivity |
| Closing invested capital, funded proxy | 37.738 / 31.215 / 24.691 | 43.979 / 35.927 / 27.875 | 50.675 / 39.782 / 28.890 | 64.822 / 50.006 / 35.191 | 21.417 selected operating lines |
| Average invested capital, funded proxy | 39.626 / 31.182 / 22.737 | 40.859 / 33.571 / 26.283 | 47.327 / 37.855 / 28.382 | 57.748 / 44.894 / 32.040 | 9M unknown; 20.995 selected, April–September |
| ROIC sensitivity | 13.72% / 17.43% / 23.91% | 16.55% / 20.14% / 25.73% | 17.76% / 22.21% / 29.62% | 15.22% / 19.58% / 27.44% | 9M unknown; 14.74–16.33% for six months on selected capital |
| Common equity closing proxy | 21.046 | 24.974 | 29.794 | 36.483 | Comparable opening balance unavailable |
| Reported parent earnings | 5.310 | 6.465 | 7.857 | 9.376 | 7.778, includes equity-method results |
| Reported parent ROE cross-check | 27.24% | 28.10% | 28.69% | 28.29% | Scope-comparable normalized ROE unavailable |
| Direct EBIT margin | 15.44% | 16.06% | 16.72% | 15.67% | 14.74% |
| Reported debt / total equity | 48.83% | 46.92% | 41.84% | 48.17% | 37.69%, new scope |

Annual gross profit less selling and administration expenses gives direct EBIT before financial and equity-accounted results. FY2025 uses 25.889 − 7.563 − 7.337 = 10.989 trillion VND before rounding. Beyond the functional exclusions, audited line items do not identify all one-offs or isolate sustainable operating tax. NOPAT uses the stated 20% assumption. Funded capital equals total equity plus reported borrowings less the scenario deposit deduction. ROE divides reported parent earnings by mean opening and closing equity net of NCI. The FY2025 NCI input comes from the audited equity note. The parent-income cross-check does not establish normalized common earnings.

The full operating-assets and non-interest-bearing operating-liabilities populations for FY2022–FY2025 remain unclassified. FY2025 has an existing selected-line alternative of 23.787 trillion closing and 21.809 trillion average capital. The implied 40.31% is sensitive to omitted lines. The approved FY range uses funded capital, and therefore needs neither that selected-line estimate nor standalone normalized common earnings. [Actual inputs and cell pointers](FPT_BQ_EQ_INPUT.json) · [FY balance-sheet bridge and ACBS anchors](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/FPT_BQ_FH_FY2025_BASELINE_REASSESSMENT.md)

FY2025 ended 31 December 2025. The audited consolidated report was public 19 March 2026. That date is also the conservative availability bound used for the earlier reports in the foundation. Their exact first-publication timestamps were unnecessary for this later research window and were not asserted. Public eligibility dates are distinct from repository receipt, review and execution dates. [FY publication proof](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/admission-rehearsal/FPT_SEGM_V13_FY_PUBLICATION_PROOF.json)

## 2026 incremental review

FTEL moved to equity accounting effective 1 January 2026. The following sequence uses economic effective dates and issuer publication dates. The H1 reviewed statement supersedes the Q2 report for the lũy kế cash interpretation.

| Available | Evidence and effect |
|---|---|
| 24 Apr | Q1 BCTC, following 22 Apr results. Revenue 12.480 trillion, direct EBIT 2.032 trillion, FCF −3.437 trillion. The adjusted prior-year income comparison supplies no comparable opening capital. |
| 27 Jul | Q2 BCTC, following 16 Jul H1 results. H1 revenue 26.269 trillion and PBT 5.714 trillion support continued profitability. |
| 21 Aug | Reviewed H1 BCTC. H1 FCF −2.482 trillion. Q2 incremental FCF improved by 0.955 trillion on the reviewed cumulative comparison. |
| 28 Oct | Q3 BCTC, following 21 Oct results. 9M direct margin 14.74%, FCF −1.077 trillion and Q3 incremental FCF +1.405 trillion. Interim dividend announcement preceded cutoff and the 27 Nov ex-date followed it. |
| Through 13 Nov | The September/October capitalization update is a share-count event. November AI and SBI news adds possible future economics with no quantified effect on current return on capital. The July tax decision of 0.244 billion VND did not change the band analysis. |

The reported 31 December 2025 comparative balance sheet still reflects full FTEL consolidation. Six identified operating lines account for a **−6.652 trillion VND** partial opening adjustment. Remaining working capital, eliminations and operating classifications are unbounded. The 31 March and 30 September selected operating balances do share the post-FTEL scope. The calculation uses **3.868 trillion** of direct April–September EBIT divided after tax by **20.995 trillion** average selected capital. The six-month estimate cannot establish an annual normalized spread because the reported interval is shorter and the selected accounts omit potentially material balances. The 9M direct EBIT excludes the separately recorded equity-method contribution. [Retained FTEL bridge and signed operands](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/FPT_BQ_EQ_INVESTED_CAPITAL_BRIDGE_2026-11-23.md) · [Publication and event chronology](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/admission-rehearsal/FPT_ANNUAL_BASELINE_INCREMENTAL_SCORING_REVIEW.md)

## Executable scoring and fallback review

| Output | FY2025 | 13 November 2026 |
|---|---|---|
| Selected route | C, conservative funded-capital sensitivities | E after A–D |
| Returns | Three funded-capital treatments, direct EBIT and reported parent ROE as leverage-aware context | Positive direct EBIT and six-month selected-capital returns; no annual post-FTEL spread established |
| Cost of capital | Nominal annual VND enterprise WACC benchmark 12.8% from March ACBS, stressed to 15%. At 15% and gross funded capital, FY2025 break-even tax is about 21.17%. | 15% from November ACBS, with March 12.8% as sensitivity. Published analyst anchors are retained. Post-FTEL financing weights and normalized operating tax remain uncertain. |
| Persistence | Four comparable FYs, EBIT rose every year. All four gross-funded returns exceed 12.8%, three exceed 15%. | FY history is still valid for its original scope. It supplies context for the re-scoped issuer. |
| Margin materiality | Supporting. FY2025 EBIT margin fell from 16.72% to 15.67%, within the 15.44–16.72% historical range. | Material to the combined route. The 14.74% margin and negative FCF do not resolve the capital and persistence question. |
| Counterevidence | 2022 gross-funded return fell below the 15% stress. FY2025 gross-funded spread at 15% was only 0.22 pp. FY2025 free cash flow weakened and debt increased. | Cash realization remains weaker than profits suggest. The six-month tests have partial coverage, and later events offer no quantified offset. |
| Selected band | Good economics | N/R |
| Analyst-selected points | 5 | null |
| Executable points | 5 | null |
| Research confidence | Medium, adequate for the lower point | Low for a numeric band |
| Disposition | CONSERVATIVE | N/R |
| Remaining limitations | Classification, tax, capital-cost sensitivities and FY2025 deterioration constrain upper points. | Unresolved opening working capital and eliminations after FTEL, normalized full-scope returns and persistence. |
| Production eligibility | No | No |

For FY2025, A could not close a full direct operating-capital calculation. B could not substitute technology ROE for an operating return. C supported 5 based on the four-year return record, including the adverse deposit and hurdle sensitivities. The observed returns support good economics while the weak spread under stress precludes superior economics. D was unnecessary once C supported the band.

For November, A failed on opening-scope comparability, B on leverage and equity-method earnings comparability, and C on unsupported bounds for the remaining opening capital adjustments and incomplete annual coverage. D reviewed historical return, margins, leverage, operating cash realization, scope change and the six-month matched comparison. Together those observations establish continuing profitability but cannot distinguish a sustainable positive economic spread from average or weak post-FTEL economics. None establishes persistent destruction or durable superiority. Route E therefore returns null. Audited FY2026 disclosures could resolve this through an opening-to-closing operating-capital bridge with working-capital eliminations, normalized EBIT and tax, or a defensible equivalent economic-return analysis. No owner decision is needed to close this research execution.

## Replay and version binding

```sh
node tools/scoring/validate_fpt_bq_eq.mjs --ticker FPT
```

Implementation identity is `bq-eq-evidence-sufficiency-research-v1.0.0`. The result records the SHA-256 for the scorer, CLI, methodology configuration, unchanged band registry and real input. Research execution ID is `exec-8e2bd503394673db9396b722`. The base Git commit is `480c647fb344dd3606610cb6d596373453546ff8`. For the delivery commit use `git log -1 --format=%H -- src/domain/current-scoring/bq-eq-research.ts tools/scoring/validate_fpt_bq_eq.mjs`. [Real input](FPT_BQ_EQ_INPUT.json) · [Executable result](FPT_BQ_EQ_RESULT.json)

## Tests and regression

- The final bounded Vitest run used the Node environment, one worker and Node 22.12 with `--experimental-sqlite`. **194/195 tests passed**, including all 11 BQ-EQ checks and all 33 current-formal integration checks. The one unresolved compatibility check invokes the retired `scripts/generate-personal-ai-compatibility.mjs --check`; the script is absent at the base commit. The surviving historical and current behavioral checks passed across all registered sectors.
- The current parity verifier returned `CURRENT_PARITY_PASS`. A separate in-memory replay of the exact V8 input reproduced `fpt-limited-v8-2026-11-13`, BQ-MOAT 3/6, IC-IND 2/4, 21 N/R and null full score. Tracked production scorer, registry, routes and V8 records matched the base commit byte-for-byte.
- The FPT command reproduced the full output byte-for-byte. The CLI rejected `--publish`. The real validation path has no database, route-registration or publication call.

## Acceptance

| ID | Disposition | Evidence |
|---|---|---|
| AC01 | Pass | Owner request and hash-bound Approved Baseline v1.0. |
| AC02 | Pass | New module evaluates BQ-EQ only. |
| AC03 | Pass | Required return, persistence and hurdle references enforced. |
| AC04 | Pass | Missing supporting margin references are allowed when non-material. |
| AC05 | Pass | Material margin evidence, contradictions and maximum checks enforce eligibility. |
| AC06 | Pass | Direct, sector-equivalent, range and combined routes exercised. |
| AC07 | Pass | Existing registry bands, 8-point rubric and 100-point framework verified. |
| AC08 | Pass | Actual FY2025 input returned 5 through the amended scorer. |
| AC09 | Pass | Actual 13 November input returned N/R through the amended scorer. |
| AC10 | Pass | Four documented fallback attempts identify the post-FTEL denominator and durability limits. |
| AC11 | Behavioral pass | All 22 other rubric behaviors remain on their original paths. The retired-generator check remains unavailable. |
| AC12 | Pass | Tracked V8 bytes and exact replay verified. |
