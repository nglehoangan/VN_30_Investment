# BQ-EQ incremental assessment and FPT scoring closure

**Implementation verdict** · Approved Baseline v1.1 executed in isolated research.

**Operational scoring verdict** · FY2025 **5/8, CONSERVATIVE, BASELINE**. At 13 November 2026 **N/R, INVALIDATED for current applicability**. The FY2025 assessment remains valid for its original scope.

## Authority and implementation

Owner approval dated 26 November 2026 preserves D1–D8 and adds D9–D14. The new methodology record pins the predecessor and owner request. Scope covers BQ-EQ and isolated FPT research. Production needs separate exact methodology, executable, data and assessment approval, formal Stage 0 and Risk Policy clearance as applicable, and separate publication authorization for any publication. [Owner approval](OWNER_REQUEST.txt) · [Approved Baseline v1.1](../../../03%20SCORING/BQ_EQ_INCREMENTAL_ASSESSMENT_v1.1.json)

The lifecycle module reuses the v1.0 BQ-EQ scorer and its band registry. The isolated FPT CLI replays v1.0, compares the bytes with the retained result, and submits the established annual assessment, both economic windows and the new materiality review to v1.1. The successor adds no production entry point. [Lifecycle module](../../../../src/domain/current-scoring/bq-eq-incremental.ts) · [FPT executable](../../../../tools/scoring/validate_fpt_bq_eq_incremental.mjs)

- **BASELINE** runs the qualified original assessment against evidence eligible at its original cutoff.
- **UPDATED** requires a supported current assessment with fresh return evidence. A method or scope transition requires evidence-backed rationale and implications. The same primary method has priority. When the primary method is unavailable, the lifecycle tests inheritance before selecting a qualified reassessment using another route.
- **REAFFIRMED** requires the same method, band and points under eligible new evidence.
- **CARRIED_FORWARD** requires the original assessment to pass evidence and sufficiency checks again, a cutoff-specific materiality review and affirmative new support. Bounded structural impacts may qualify. Evidence expiry and newly available authoritative annual information trigger reassessment.
- **INVALIDATED** records no defensible current band after checking inheritance and reassessment. A material adverse or unresolved issue must be addressed in a replacement assessment's counterevidence.

Confidence follows the existing five dimensions on a 0–10 scale. Review date, underlying period, latest reviewed period, economic cutoff, confidence, update status, score validity and authority are recorded separately. The lifecycle emits no inherited current-period metric. Evidence eligibility uses the public availability cutoff even when the operational review takes place later.

## Executable comparison

| Output | FY2025 baseline | Cutoff before v1.1 | Cutoff after v1.1 |
|---|---|---|---|
| Assessment method | C · direct EBIT and funded-capital sensitivities versus nominal annual VND WACC | A–D reviewed, E selected | C retained as the primary framework. A–D considered; E after inheritance failed |
| Underlying financial period | FY2022–FY2025, ending 31 Dec 2025 | No currently rated period | No currently rated period; original FY basis preserved |
| Latest period reviewed | FY2025 | 9M2026, plus eligible subsequent developments | 9M2026, plus eligible subsequent developments |
| Current comparable ROIC | FY25 funded-capital proxy 15.22%, 19.58%, 27.44% across three cases | Null | Null |
| Economic band | Good economics | N/R | N/R |
| Analyst-selected points | 5 | Null | Null |
| Executable output points | **5/8** | **N/R** | **N/R** |
| Assessment quality | CONSERVATIVE | N/R | N/R |
| Update status | BASELINE | Lifecycle status unavailable in v1.0 | INVALIDATED for current applicability |
| Confidence | 7/10 · 2/1/2/1/1 on the v1.1 confidence record | Low for a numeric band | 5/10 · 2/0/2/1/0 |
| FTEL materiality | Full line consolidation through FY2025 | Unresolved current scope comparability | Material impact unresolved for scope, mix, funded capital and recurring return spread |
| Remaining limitations | Thin spread under 15% hurdle; funded capital and tax sensitivity | Incomplete post-FTEL opening balance and recurring return case | Same limitation prevents both a fresh normalized band and affirmative inheritance |
| Production eligibility | No | No | No |

The FY2025 report ended 31 December 2025, was public 19 March 2026 and was assessed 25 November 2026. Its four-year EBIT and margin record, funded-capital scenarios, 20% tax stress and 12.8–15% WACC sensitivity reproduce **5/8**. The new review is dated 26 November 2026 and only uses economic evidence available by 13 November. [v1.0 calculations and cutoff record](../2026-11-25/BQ_EQ_AMENDMENT_FPT_SCORING_CLOSURE.md) · [v1.1 real input](FPT_BQ_EQ_INCREMENTAL_INPUT.json) · [v1.1 executable receipt](FPT_BQ_EQ_INCREMENTAL_RESULT.json)

## FTEL materiality and inheritance

| Material change | Evidence | Economic impact | Impact on previous band | Disposition |
|---|---|---|---|---|
| Core activities and operating profitability | Restated 9M revenue rose 12.42%; 9M direct EBIT VND 5.900tn at 14.74% margin | Continuing operating profitability after change in scope | Supports continuity, but a profitable operation alone does not establish the old economic spread | MATERIAL_BUT_BOUNDED for operating continuity |
| Mix and consolidation | Equity method effective 1 January; 45.66% interest retained per H1 reviewed disclosure | FPT retained exposure to FTEL. The prior numerator and funded-capital denominator included its lines | The recurring contribution on a comparable return basis remains unbounded | MATERIAL_IMPACT_UNRESOLVED for the old band's applicability |
| Accounting treatment and ownership | H1/Q3 disclosures and retained share | Presentation change and continued economic exposure are evidenced | A change in accounting treatment alone gives no basis for a downgrade | MATERIAL_BUT_BOUNDED for the presentation event |
| Operating capital and economic returns | Six identified adjustments total −VND 6.652tn; opening working capital, eliminations and other lines unresolved | 14.74–16.33% selected-capital return covers six months and uses an incomplete capital set | The FY2025 gross-funded spread over 15% WACC was only 0.22 pp. The unbounded change could materially alter the spread; the six-month test supplies no annual bound | MATERIAL_IMPACT_UNRESOLVED |
| Leverage and cost of capital | FY25 debt/equity 48.17%, 9M 37.69%; VND 7.511tn of FTEL obligations removed. March/November 12.8–15% WACC anchors | Reported leverage fell in a different scope. The same nominal annual VND hurdle framework remains usable for sensitivity | Neither observed leverage nor market hurdle evidence establishes an unchanged spread | MATERIAL_BUT_BOUNDED for observed changes |
| Cash realization and subsequent events | Q1 to 9M FCF improved from −VND 3.437tn to −VND 1.077tn; reviewed tax decision, dividend, AI/SBI disclosures | Positive EBIT and improving cash realization coexist with negative YTD free cash flow | Cash data is mixed counterevidence; events provide no quantified offset to unresolved economics | MATERIAL_BUT_BOUNDED as counterevidence |

The April Q1, July Q2, August reviewed H1 and October Q3 publications are reviewed in order, followed by eligible information through 13 November. The H1 reviewed statement supplies the retained H1 cash comparison. The subsequent dividend ex-date after cutoff contributes no realized economics. [FTEL bridge](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/FPT_BQ_EQ_INVESTED_CAPITAL_BRIDGE_2026-11-23.md) · [Publication chronology](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/admission-rehearsal/FPT_ANNUAL_BASELINE_INCREMENTAL_SCORING_REVIEW.md) · [Retained scope and H1 comparison](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/admission-rehearsal/FPT_FY2025_BASELINE_FTEL_COMPARABILITY_CLOSURE.md)

A missing current ROIC by itself permits inheritance when new evidence supports the old band. Here, the positive indicators support business continuity. The changed economic perimeter, material observed capital reclassification and thin stressed FY spread prevent an affirmative conclusion that the old band still applies. The four fallback routes likewise fail: A lacks compatible opening capital, B lacks a sector-equivalent measure that resolves the FTEL contribution, C lacks defensible bounds, and D combines operating, cash and capital cross-checks that establish ongoing profitability but fail to bound the economic spread. The executable returns N/R. Reassess on eligible authoritative FY2026 disclosures, a supported matched-scope or equivalent economic return case, relevant evidence expiry, or a material event. No arbitrary expiry period was applied.

## Replay and regression

```sh
node tools/scoring/validate_fpt_bq_eq_incremental.mjs --ticker FPT
```

Identity `bq-eq-incremental-research-v1.1.0`. The receipt includes exact input, predecessor, module, adapter and methodology hashes. The implementation commit is resolved by `git log -1 --format=%H -- src/domain/current-scoring/bq-eq-incremental.ts`.

- **207/207 passed** across nine focused files, including 12 incremental cases, 11 v1.0 BQ-EQ cases and all 33 formal scoring integration cases. The run used Node 22.12 with experimental SQLite enabled and Vitest's Node environment, one worker.
- **Obsolete-generator disposition** · Git records the removal of the root generator in `91267322`. The retired script's original check replayed successfully from Git. The test now invokes the same three exact derivations and byte comparisons through a read-only verifier under `tools/scoring/`. Generated sources were kept byte-identical. The verifier returned `PARITY_CHECK_PASS`.
- **Production regression** · `CURRENT_PARITY_PASS`. The exact V8 input reproduced the stored ID, BQ-MOAT 3/6, IC-IND 2/4, 21 N/R and null full score. The production registry, scorer, routes and official V8 files were verified unchanged. The real research output replayed byte-for-byte and the CLI rejected attempted publication.

## Acceptance

| Criterion | Disposition |
|---|---|
| AC01 | Pass. Owner approval and D9–D14 recorded in v1.1. |
| AC02 | Pass. v1.0 scorer and policy preserved and replayed byte-for-byte. |
| AC03 | Pass. Primary method priority and documented scope or method transitions. |
| AC04 | Pass. Affirmatively supported inheritance exercised, including bounded accounting changes. |
| AC05 | Pass. Materiality review, blocking scope impacts and replacement counterevidence enforced. |
| AC06 | Pass. Separate confidence record and evidence freshness. |
| AC07 | Pass. Historical metrics stay with FY2025; current comparable ROIC is null. |
| AC08 | Pass. Actual annual input executed and returned 5/8. |
| AC09 | Pass. Actual 9M and eligible subsequent evidence processed by the inheritance decision. |
| AC10 | Pass. Executable returned N/R at cutoff. |
| AC11 | Pass. FTEL scope and spread uncertainty block inheritance and A–D reassessment. |
| AC12 | Pass. Other 22 rubric behavior and exact V8 replay verified. |
| AC13 | Pass. Focused suite green and obsolete test repaired with equivalent read-only checks. |
| AC14 | Pass. Research-only receipt and blocked publication flag. |
