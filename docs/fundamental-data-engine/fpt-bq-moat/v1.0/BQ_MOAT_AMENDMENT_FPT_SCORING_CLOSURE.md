# BQ-MOAT Evidence Sufficiency v1.0 and FPT scoring closure

**Implementation verdict · Pass for isolated research.** The owner approved M01–M10 on 26 November 2026. Approved Baseline v1.0 preserves the Competitive Advantage objective, six-point maximum and exact registry bands. The starting local HEAD was `2333dbf55c60a51307b3cb073b72263176e25eb8`. [Owner approval](OWNER_REQUEST.txt) · [Approved methodology](../../../03%20SCORING/BQ_MOAT_EVIDENCE_SUFFICIENCY_v1.0.json)

**Operational scoring verdict · FPT 3/6 for FY2025 and 3/6 for the 13 November 2026 reassessment.** The current result is CONSERVATIVE and REAFFIRMED. The Effective Score is **3/6, CONFIRMED_CURRENT in research**. Together with the accepted BQ-EQ provisional 5/8, the two rubrics contribute **8 assessed points on 14/25 Business Quality weight**.

## Evidence contract and implementation

The analyst selects an existing band. The scorer requires a documented competitive mechanism or disadvantage and a linked observable economic outcome, plus qualified counterevidence. Financial signals and market position may corroborate the assessment. The validator rejects financial-only or management-narrative claims as core mechanism evidence. Public proxies need a stated interpretation and limitation. Only economically relevant mechanism types are reviewed.

Scores 0–2 require supported evidence for the selected low band. Score 3 accepts observed differentiation with a disclosed durability limitation. Score 4 requires documented persistence. Scores 5–6 require demonstrated multi-year durability, with evidence at the mechanism level. Six additionally requires multiple supported durable mechanisms, the existing maximum prerequisites, exceptional justification and valid counterevidence review. There are seven single-point bands and no mechanical weighting of the three evidence dimensions. [Registry](../../../../src/domain/scoring/methodology.ts) · [Metric Definitions](../../../03%20SCORING/METRIC_DEFINITIONS.md#42-competitive-advantage--moat--6-points)

| File | Change |
|---|---|
| `src/domain/current-scoring/bq-moat-research.ts` | `scoreCompetitiveAdvantage` validates advantage, linked behavior, public proxies, persistence, selected band and disconfirming evidence. |
| `src/domain/current-scoring/research-incremental.ts` | Parameterizes the accepted incremental qualification rules by rubric scorer and evidence roles. The tightly pinned BQ-EQ replay retains the original file and identity. A retained-input regression compares the parameterized lifecycle with the pinned implementation. |
| `src/domain/current-scoring/bq-moat-incremental.ts` | `scoreIncrementalCompetitiveAdvantage` supplies the moat evidence roles and invokes the existing historical retention and Effective Score functions. |
| `src/domain/current-scoring/research-combined-bq.ts` | Passes both scores into the existing research aggregation, ranking and Decision functions and identifies provisional coverage when a moat observation is provisional. |
| `src/ui/research-moat-score.tsx` | Extends the local combined research view with moat basis, review, reassessment, status, confidence and material limits. |
| `tools/scoring/validate_fpt_bq_moat.mjs` | Hash-checks owner approval, real input and evidence locations; replays the accepted BQ-EQ result byte-for-byte and executes BQ-MOAT and combined downstream scoring. |
| `tests/unit/bq-moat-research.test.ts`; existing assessment skill | Bounded tests and BQ-MOAT research guidance. |

The reused lifecycle checks evidence eligibility at the original and reviewed cutoffs, requires review of eligible incremental evidence, and keeps expiry, new annual information, unconfirmed material effects and confirmed invalidation separate. Confirmed inheritance still requires affirmative support. Pending materiality can allow provisional use of a qualified historical score. An adverse change addressed by a replacement still requires relevant counterevidence. Research findings preserve source dates, assessment dates, period and confidence separately.

## FPT competitive advantage and evidence

The FY2022–FY2025 foundation uses the audited annual basis and retained issuer disclosures. FY2025 ended 31 December 2025. The conservative public-evidence window closes on 8 April 2026, when the retained chronology shows publication of the annual report, following preliminary results on 26 January and audited financial statements on 19 March. The assessments were executed on the 26 November 2026 review basis. The incremental economic cutoff is 13 November 2026. [Historical assessment and issuer references](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/FPT_23_RUBRIC_FY2025_RESEARCH_SCORECARD.md) · [Publication and event chronology](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/admission-rehearsal/FPT_ANNUAL_BASELINE_INCREMENTAL_SCORING_REVIEW.md)

| Advantage | Public evidence | Economic behavior | Persistence | Counterevidence | Conclusion |
|---|---|---|---|---|---|
| Technology expertise and integrated delivery | Issuer description of specialized integration and the multi-year Airbus strategic IT agreement | A longstanding customer made a new multi-year commitment; H1 and 9M awards corroborate demand for complex delivery | Airbus relationship of about a decade. Durability across the client portfolio is uncertain. | Award counts do not show renewal rates, contract pricing, relative cost or realized profitability. | Actual differentiation supports 3. |
| International delivery and access | International IT service disclosure, Japanese joint-venture channels and customer revenue thresholds | Customers generating at least USD 1m increased from 251 to 266 in FY2025 disclosures. Public updates report 14 H1 and 16 9M project wins above USD 10m across cumulative periods. | Continuing participation and repeat-client example. Customer-level retention and protected economics remain unquantified. | Wage pressure, delivery mix and competition limit a pricing-power claim. No peer cost leadership was established. | Corroborates the same mechanism. No separate scale or distribution premium. |
| Talent, know-how, brand and AI | Issuer capabilities and November AI/SBI developments | Integrated service wins provide execution context. November announcements provide no quantified economic protection. | The reviewed record does not establish a distinct durable talent, brand or AI advantage. | AI may commoditize delivery and pressure pricing; no outcome series bounds that effect. | Context and counterevidence, with no additional advantage credit. |
| FTEL and segment mix | Equity accounting effective 1 January 2026, disclosed 18 March | Post-transition technology awards continue to demonstrate customer demand for the relevant mechanism | The band rests on software and technology-services behavior, with no FTEL moat claim. | Group returns and margins contain a changed mix. | Reviewed and bounded for this band. The separate BQ-EQ materiality result stays pending. |

This assessment uses customer buying and delivery as the economic channel. BQ-EQ separately assesses returns on capital, BQ-RES stress resilience, and IC-POS relative position. Shared segment reporting corroborates customer economics here. The scorer awards no points for ROIC, standalone growth, size or market share. The 15.32% 9M international IT margin provides corroboration only.

Q1 issued financial statements on 24 April and supports continuing operations. Q2 financial statements followed the July H1 results. The reviewed August H1 release qualifies the half-year financial context. The October 9M results and Q3 filing supply an updated project-win window and segment profitability corroboration. The November AI/SBI news was reviewed as potential disruption or opportunity. This supplies independently supported continuation at band 3. A single durable named relationship and new awards do not show broad, persistent capture of economic benefits required for band 4 or above.

| Output | FY2025 foundation | Cutoff 13 November 2026 |
|---|---|---|
| Relevant competitive advantages | Integrated technology services and repeat customer relationships | Same technology-service mechanism |
| Advantage evidence | Multi-year Airbus strategic IT agreement, sector integration and international delivery disclosures | Continued technology-service awards and the retained FY mechanism |
| Economic behavior evidence | Repeat demand from Airbus and 251→266 customers generating at least USD 1m | 14 H1 and 16 9M awards above USD 10m; corroborating segment profitability |
| Persistence evidence | About a decade of Airbus work, breadth across customers uncertain | Continued wins show commercial activity; no broad renewal or pricing series |
| Public proxies used | Renewal/long relationship and complex implementation as indicators of competitive differentiation | Large project awards as evidence of repeated market selection, without treating them as customer retention rates |
| Material counterevidence | Wage and mix effects, missing renewal, comparable price and client economics | AI and competitive pressure, retained FTEL exposure with a changed group accounting scope, unresolved broad pricing power |
| Selected band | Some differentiation | Some differentiation |
| Analyst-selected points | 3 | 3 |
| Executable points | **3/6** | **3/6** |
| Latest Valid Score | 3/6 · FY2025 | 3/6 · original qualified FY2025 |
| Effective Score | 3/6 at the baseline | **3/6 · CONFIRMED_CURRENT** |
| Assessment quality | CONSERVATIVE | CONSERVATIVE |
| Confidence | 7/10 | 7/10 |
| Update status | BASELINE | REAFFIRMED |
| Remaining economic limitations | Exact churn, switching costs and sustainable pricing advantage unavailable | Missing comparable cohort renewal, client pricing/productivity and measured AI effects |

## Combined downstream execution

| Output | Accepted BQ-EQ only | BQ-EQ + BQ-MOAT |
|---|---|---|
| BQ-EQ Effective Score | 5/8 · PROVISIONAL | 5/8 · PROVISIONAL; MATERIAL_REVIEW_PENDING |
| BQ-MOAT Effective Score | Outside the run | 3/6 · CONFIRMED_CURRENT |
| Business Quality assessed points | 5 | **8**, including five provisional |
| Business Quality assessed weight | 8/25 | **14/25**; category total stays null |
| Effective coverage | 1/23 | **2/23** |
| Effective rated weight | 8/100 | **14/100** |
| Provisional score contribution | 5 points, 8 weight | 5 points, 8 weight; confirmed coverage 1 rubric, weight 6 |
| Investment Score completeness | Incomplete | Incomplete; 21 unassessed, null full provisional total |
| Research ranking input | FPT only, 5 assessed points, no ordinal | Same-cutoff FPT input includes both scores and their limitations, 8 points at weight 14, no ordinal |
| Investment Decision input | BQ-EQ 5, incomplete BQ and total | Both scores, coverage, confidence and limits. Stage 0 UNKNOWN, hard veto PENDING and residual risk NOT_RATED. |

No activity beyond BQ-MOAT and reuse of accepted BQ-EQ was needed. The full BQ category and /100 score remain incomplete. There is no research comparison peer in this run. Production activation would require separate executable/methodology authorization and qualified scoring and evidence bindings. Formal ranking and decisions still require applicable Stage 0, Risk Policy, valuation, financial-health and portfolio gates, and publication requires separate authority.

## Replay and regression

```sh
node tools/scoring/validate_fpt_bq_moat.mjs --ticker FPT
node tools/scoring/validate_fpt_bq_moat.mjs --ticker FPT --html > /tmp/fpt-bq-moat-scorecard.html
```

Implementation identity `bq-moat-evidence-sufficiency-research-v1.0.0`. The implementation commit is `4aabfb26874d36f556a64790e7f57cd81846a818`. The receipt records runnable code and input SHA-256 identities. [Real research input and retained evidence locators](FPT_BQ_MOAT_INPUT.json) · [Executed result and both downstream inputs](FPT_BQ_MOAT_RESULT.json)

**234/234 tests passed** across 10 focused files, including 17 new moat cases and all 33 formal scoring integration cases. Focused TypeScript validation and `CURRENT_PARITY_PASS` passed. The exact FPT V8 input reproduced the stored ID, BQ-MOAT 3/6, IC-IND 2/4, 21 N/R and null full score. The accepted BQ-EQ replay matched byte-for-byte, with 5/8 provisional and MATERIAL_REVIEW_PENDING. The research adapter rejected publication. The local HTML displayed both scores, BQ coverage and the moat limitations.

| Criteria | Disposition |
|---|---|
| AC01–AC07 | Pass. M01–M10 recorded, unchanged bands, core behavior and band-specific persistence enforced, public proxies qualified and upper bands protected. |
| AC08–AC11 | Pass. Both real assessment windows executed. Incremental qualification, retention and Effective Score rules reused. |
| AC12–AC13 | Pass. Combined downstream research result and view consumed both scores and their limitations. |
| AC14–AC17 | Pass. Accepted BQ-EQ replay, unchanged formal behavior for the other rubrics and exact V8 regression verified. |
| AC18 | Pass. Research-only code path and publication flag rejection. |
