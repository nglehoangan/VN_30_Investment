# WP2 Financial Health bounded assessment closure

**Recommendation · Accept the WP2 research closure with two genuine economic N/R limitations.** Replayed the existing FPT WP2 route end-to-end on the exact retained input. Neither FH-LIQ nor FH-STRESS was blocked by a requirement stricter than FH01–FH15 on these data. Corrected the coverage classification in research aggregation, ranking input, Decision input and HTML. Local starting HEAD was `6d323f7aa4364f374c88bb71a1d4854bb0f9639b`. The pinned validators and evaluator match implementation commit `e02ae32`. [Original WP2 closure](../v1.0/WP2_FINANCIAL_HEALTH_FPT_SCORING_CLOSURE.md) · [Owner direction](OWNER_REQUEST.txt) · [Approved FH01–FH15](../../../03%20SCORING/WP2_FINANCIAL_HEALTH_AMENDMENT_v1.0.json)

| Rubric | Previous WP2 FY2025 | Revised FY2025 | Current at 13 Nov 2026 | Effective Score | Disposition |
|---|---:|---:|---:|---:|---|
| FH-BS | 3/6 | 3/6 | 3/6 | 3/6 CONFIRMED_CURRENT | Unchanged, updated within the post-FTEL scope. |
| FH-LIQ | N/R | N/R | N/R | N/R | No defensible band at either window. Payment timing, resources usable by the obligor and covenant materiality remain unresolved. |
| FH-STRESS | N/R | N/R | N/R | N/R | No defensible band at either window. Retained severe cases leave funding and consequent capital response unbounded. |

## Exact predicate review

| Predicate | Finding |
|---|---|
| `MATCHED_TIMING_UNRESOLVED` | Requires an economically sufficient match of timed sources and uses. The predicate can accept qualified buckets and a conservative range for band 2 without exact intra-bucket dates. For FPT, reported sources and grouped debt maturities fail to establish which funds the obligor can use in time. Both windows triggered the predicate. |
| `COVENANT_DISPOSITION_UNRESOLVED` | Requires a documented PX01 disposition and screens potential breach. A bounded nondisclosure disposition can pass a lower band with no exact headroom. FPT's unknown covenant impact remains tied to funding the lower band depends on; the retained evidence supplies no basis for bounded nondisclosure. Both windows triggered the predicate. |
| `COUNTEREVIDENCE` | The retained assessments address adverse maturity concentration, fragile liquidity assumptions and cash deterioration. The predicate did not block either rubric. Keep it active. |
| `PX01_NOT_ELIGIBLE` | A subsequent check for proposed scores that have cleared the preceding gates. The FPT rows have no qualified proposal and do not reach it. The bounded-nondisclosure lower-band test passes through PX01, and maximum with nondisclosure is still rejected. |
| `CAPITAL_CONCLUSION_UNRESOLVED` | Requires an economic conclusion on funding/capital response. Demonstrated vulnerability can pass without proof of successful refinancing or a detailed recapitalization plan. Both FPT windows triggered the predicate because the modeled response depends on unverified usable resources. Maximum and upper-band tests remain unchanged. |

Reviewed the retained input, evaluator results, workflow receipt, prior liquidity assessment, FH01–FH15 and canonical §5.2–5.3. No economic predicate correction was justified. No new evidence was sought and the FTEL bridge was reused as retained. [FH validator](../../../../src/domain/current-scoring/fh-research.ts) · [Freshness and Effective Score](../../../../src/domain/current-scoring/fh-incremental.ts) · [PX01 implementation](../../../../src/domain/current-scoring/public-proxy-review.ts) · [PX01 specification](../../../03%20SCORING/PUBLIC_DATA_PROXY_SPECIFICATION_23_RUBRICS.md#fh-liq--px01-approved-covenant-and-availability-binding) · [Metric Definitions](../../../03%20SCORING/METRIC_DEFINITIONS.md#52-liquidity--refinancing-resilience--4-points)

## Bounded economic decision

**FH-LIQ.** The historical FY2025 research band 2 was based on VND 10.522tn book cash, 29.631tn deposits, 20.173tn selected uses, 10.136tn CFO, and approximately 43.071tn new draws and 36.891tn principal repaid. Roughly 91% of debt was short term. The retained annual scenarios imply 0.89× at 25% deposit access and 1.26× at 50%, before interest and other unmapped obligations. At September the corresponding outcomes are 0.83× and 1.17×. Actual historic refinancing and positive FY cash generation support a plausible financing response. They do not bind an available resource to the obligor and payment period. The deposit access fractions are sensitivities rather than evidenced bounds. The retained cases therefore establish that band 2 is possible, rather than establish adequate coverage with dependence. Band 1 requires affirmative evidence of severe dependence, and band 0 observed uncovered obligations without credible funding. Conditional scenario shortfalls cannot establish either. Bands 3–4 require a stronger demonstrated resource-and-maturity match and, at the maximum, resilient diversified funding and covenant protection. The materiality disposition stays unresolved in both windows. [Historical FY2025 liquidity rationale](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/FPT_FH_LIQ_FY2025_CONSERVATIVE_ASSESSMENT.md)

**FH-STRESS.** The retained severe cases show weak headroom, but their surplus changes sign with deposit access.

| Severe case, VND trillion | 25% deposit access | 50% deposit access | Modeled break-even access |
|---|---:|---:|---:|
| FY2025 | −6.917 | +0.491 | 48.34% |
| September 2026 | −5.145 | +0.075 | 49.64% |

The break-even points assume the other retained model inputs and exclude unmapped obligations. Near-zero headroom at 50% is a warning, not a verified upper bound on capacity. Without an evidence-supported accessibility and funding range, severe vulnerability cannot be distinguished from survival with constraints. This rejects band 2 on this evidence while preserving it for an affirmatively supported downside case. The evidence likewise cannot establish demonstrated failure or likely distressed financing (0–1), confirmed survival under constraints (3–4), or robust survival (5). No stress engine or assumption was replaced. [Retained input](../v1.0/FPT_FH_INPUT.json) · [Retained calculations and actual annual/current assessment](../v1.0/FPT_FH_RESULT.json)

**Freshness.** No accepted annual FH-LIQ or FH-STRESS numeric foundation exists for inheritance under this contract. The 2026 FTEL change and maturity rollover also leave the current funding applicability guard active. The retained execution records `fundingRisk=true` for both, without asserting a calendar expiry or confirmed breach. FH-BS remains based on current qualified evidence.

## Workflow and coverage correction

`vn30_fh_bounded_closure.py` invokes the existing WP2 entry point and requires byte-for-byte equality with its pinned receipt before projecting corrected coverage. `corrected_coverage` verifies the reviewed and outside-scope populations are distinct and reconcile to the existing total. `project` sends the same corrected breakdown to aggregation, research ranking, Decision and the HTML scorecard. The original legacy receipt still carries the all-unrated 18/69 field; the corrected research result labels it `unratedTotal`. No official or pinned WP2 inputs or behavior changed. [Coverage adapter](../../../../tools/scoring/vn30_fh_bounded_closure.py) · [Exact bindings](BINDINGS.json)

| Actual result | Disposition |
|---|---|
| Prepare → Adoption → Preflight → Scoring | PREPARED_BQ_FH → ADOPTED_FOR_ISOLATED_VALIDATION → AUTHORIZED_FOR_ISOLATED_VALIDATION → SCORED_RESEARCH_ONLY |
| Business Quality | 14/25 PROVISIONAL |
| Financial Health | 3 assessed points at 6/15 weight; full category null |
| Combined | 17 assessed points at 31/100 rated weight; 5/23 effective rubrics; full Investment Score null |
| Genuine N/R in reviewed scope | 2 rubrics, 9/100, FH-LIQ and FH-STRESS |
| Outside completed rollout | 16 rubrics, 60/100 |
| Total unrated | 18 rubrics, 69/100 |
| Research consumers | Same points and classifications in Decision and ranking inputs; one issuer, no ordinal. HTML shows both classes. |
| Authority | No live scoring, publication, rank or Decision authority. Stage 0 UNKNOWN, hard veto PENDING and residual risk NOT_RATED remain controlling. |

```sh
python3 -B tools/scoring/vn30_fh_bounded_closure.py --ticker FPT --cutoff 2026-11-13 \
  --universe-version vn30-20260803-reviewed-20261115
```

The wrapper replays WP2 execution `exec-be59ad3a3be63079a86d2c83` and queue `queue-ba525c15ae392c7a4b055e8e`. [Legacy workflow receipt](../v1.0/FPT_WP2_WORKFLOW_RESULT.json) · [Bounded replay and corrected downstream output](FPT_WP2_BOUNDED_WORKFLOW_RESULT.json)

**Regressions.** 254 TypeScript tests passed, including all 33 formal integrations, the qualified bucket/nondisclosure case, and an evidence-supported stress band 2 without proof of successful funding. 28 Python tests passed across WP2, WP1, the formal controller, governance and the bounded coverage adapter. The new tests verify actual replay, mismatched-scope rejection and publication rejection. Formal parity passed and exact FPT V8 replay reproduced BQ-MOAT 3/6, IC-IND 2/4, 21 N/R and the null full score. Accept these two documented N/R limitations and close the bounded review.
