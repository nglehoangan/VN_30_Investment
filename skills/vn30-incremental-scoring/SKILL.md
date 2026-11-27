---
name: vn30-incremental-scoring
description: Prepare a successor to the latest published scorecard for one VN30 ticker at a new cutoff. Compare qualified evidence, reassess affected rubrics, and carry forward verified assessments through existing scoring and publication gates.
---

# VN30 incremental scoring

Accept exactly one ticker, a new explicit cutoff and an approved universe version. Use the [single-ticker contract](../vn30-rollout-orchestrator/references/single-ticker-contract.md) and qualified sector reference. Send multiple tickers through the sequential orchestrator. This workflow requires a strictly later cutoff than the baseline.

1. Resolve the newest authorized publication through the existing publication reader. Record scorecard identity, cutoff, publication and artifact hashes, and source, methodology, executable, dataset and review identities. A newer record with failed verification, revoked authority, missing lineage or no eligible baseline blocks incremental reuse. Use the normal first-assessment workflow if there has never been a valid publication.
2. Compare the new-cutoff admitted facts and selected sources with those consumed by the baseline. Reuse [S1–S5](../equity-s1-s5-assessment/SKILL.md), existing market, corporate-action and source-admission services, and the Future Evidence Register. Compare actual input values, dates, scope, definitions, freshness, hashes and authorizations. Distinguish display-only prices, newly available reports, revisions and effective events from formally admitted inputs. Keep separate economic and knowledge dates. Reject future leakage and flag unresolved conflicts.
3. Trace changes to rubric and shared-gate dependencies, including indirect ones. For example, a raw close change can affect VAL-RET and VAL-MOS, while a share-count change can also affect per-share history and valuation inputs. Check the actual sector rules and formulas before finalizing the affected set. If methodology, sector, authority or reusable evidence validity changed, widen the review to all dependent rubrics and gates.
4. For each carried-forward rubric, verify unchanged economics, unchanged applicable rule and evidence validity through the new cutoff. Record its previous disposition, supporting hashes and the reason reuse remains valid. Reassess everything else using the [one-pass coverage skill](../vn30-evidence-coverage-closure/SKILL.md). Preserve unresolved N/R as null where permitted and report any gating limitation.
5. Assemble a complete successor assessment with all applicable rubric dispositions and recompute totals, coverage, bounds and eligibility in the existing governed engine. Record old and new rubric points, the driver of each change, and coverage changes separately from economic score changes. Keep the prior publication immutable and use a new assessment identity, route and approval package tied to the new cutoff.
6. Run both reviews and read-only prepare. Require exact new route authorization before check and score. Require separate publication approval, then verify website readback using [publication hygiene](../vn30-scoring-publication-hygiene/SKILL.md). A dashboard update signal and the prior approval are insufficient for either write.

For handoff, show the latest published cutoff, newest qualified observation dates by source, changed evidence, affected rubrics, what was carried forward, remaining blockers and the next gate. A later market observation is a reassessment signal, not a new score or admission decision.

## Annual fundamentals and incremental research

Pin the latest admitted final FY separately from interim observations. Use the [SEGM v1.2 annual contract](../../docs/fundamental-data-engine/structural-evaluation-gaps/2026-11-23/SEGM_V12_ANNUAL_REASSESSMENT.md) to compare immutable prior and current evidence indexes through the read-only Prepare companion. Do not roll the FY forward for an interim filing. Preserve original known-at and publication clocks. Carry a review only when its basis, evidence and validity window still match. Pass the affected valuation and decision dependencies to the existing owner-approved model and decision workflows.

Use `--rubric-completion <diagnostic-packet>` on `tools/scoring/vn30_prepare_evaluation.py` to include the reviewed N/R inventory in read-only Prepare. Match ticker, cutoff, qualified sector and pinned universe to the native request. The companion result records research dispositions with no authority effect. The native successor still requires exact candidate pins, reviews and approval.

## Public-data assessment routes

Compare admitted evidence, calculated metrics and retained assessments first. Apply the relevant public route and record the route review during the one allowed evidence-improvement round. Follow the [Approved Baseline v1.0 and stopping rules](../../docs/03%20SCORING/PUBLIC_DATA_PROXY_SPECIFICATION_23_RUBRICS.md#evidence-discovery-workflow-and-stopping-rule).

## Governed category rollout

Category execution parameters use one ticker with `category`, `cutoff`, `methodologyVersion`, `priorAcceptedCategories` and `executionScope`. Resolve the cutoff and category from the approved candidate. Preserve prior accepted categories on identical inputs.

Retain the annual baseline and latest valid assessment separately from the incremental review, confirmed/provisional Effective Score and current eligibility. Recalculate affected operands only. Reassess financial positions at authoritative statements, debt-maturity rollover, new borrowing or repayment, cash or asset deterioration, covenant warning, distress, capital impairment and structural change. Block historical use when funding applicability or supported expiry fails. Preserve unresolved materiality separately from confirmed invalidation.

[Approved Financial Health baseline](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_AMENDMENT_v1.0.json)

### Approved Financial Health A/B routes

If fresh qualified evidence enables B after A, prioritize the current B result, including an adverse downgrade. Document the route transition and rerun freshness and maturity applicability before carrying a prior score.

For FH-LIQ and FH-STRESS, apply the [approved v1.2 amendment](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_ANALYST_RISK_v1.2.json) to one ticker and the requested Financial Health periods. Method B retains the canonical direct bands and takes priority. For eligible detail gaps, Method A assesses a distinct public-data risk profile, capped at 3/4 for FH-LIQ and 4/5 for FH-STRESS. Reuse the qualified source-bound financial product and sector normalization, including bank and property conventions. Preserve observed facts, calculations, estimates and scenario assumptions separately. Avoid repeat discovery.

Record an explicit analyst band or N/R before validation, with evidence for the selected conclusion, adjacent-band rationale, counterevidence disposition and limitations. Review whether each unresolved dependency affects that band. Never infer points from a ratio or treat unverified resources or actions as certain. Record the five confidence dimensions independently of points, and enforce the existing freshness, invalidation and historical eligibility checks. Carry method and band semantics through research consumers with no formal gate credit or assumed cross-route cardinal equivalence. Keep genuine N/R distinct from outside scope.

[Historical v1.1 replay contract](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_DUAL_ROUTE_v1.1.json)


### Approved Growth Quality research routes

For one ticker and an eligible cutoff, apply the [WP3 Growth Quality baseline](../../docs/03%20SCORING/WP3_GROWTH_QUALITY_AMENDMENT_v1.0.json). Use B first for History and Forward, and Direct → unchanged PX02 → Capital Productivity Profile for Incremental. Method A uses route-specific bands capped at 4/5, 4/5 and 3/5 respectively. Record proposals before validation and preserve sector normalization, confidence, counterevidence, method identity and research-only authority. Preserve the separate economic channels and mixed-route comparability limits.

Review adjusted historical growth continuity, new forward drivers, material disclosures, deployment and commissioning. Preserve scope and action comparability. An unbridged scope change can block a current productivity profile while allowing a separately eligible historical PROVISIONAL result.


### Approved Industry & Competitive Position research routes

Apply the [WP4 baseline](../../docs/03%20SCORING/WP4_INDUSTRY_COMPETITIVE_POSITION_AMENDMENT_v1.0.json) for one ticker, a pinned cutoff and sector. Use Direct before Public Industry Structure or Cycle Exposure. Competitive Position uses Direct → unchanged PX03 → Competitive Capability. Method A ceilings are 3/4, 3/4 and 1/2. Preserve canonical bands, sector normalization, source eligibility, counterevidence and confidence. Qualify evidence ownership against accepted BQ, FH and GQ. Keep shared observations distinct from independent corroboration and research separate from formal gates.

Refresh for changes in demand, competitive entry, customer access, delivery economics, industry regulation and cycle phase. Review economic associate exposure separately from reported consolidation. A stale cycle profile is ineligible for provisional carry.


### Approved Valuation & Forward Return research routes

For one ticker and the pinned cutoff, apply the [WP5 baseline](../../docs/03%20SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.0.json). Select the sector method, qualify the exact raw close and share basis, and distinguish reported or annualized earnings from supported normalized economics. Prefer detailed Method B, then bounded quantitative Method A with canonical ceilings 6/8, 6/8 and 3/4. Separate enterprise WACC, equity discount rate, shareholder IRR and investor hurdle rate.

Record assumption provenance, materiality, scope, downside, counterevidence and freshness before scoring. Preserve the scenario, no-rerating, reverse return and conservative impairment analyses. Sensitivities convey no scoring authority. A change in raw price requires fresh band assessment even when the financial model remains eligible. A material share or financial change requires model review. Retain genuine N/R and its dependency blockers. Bind predecessor Effective Scores through the serial cumulative workflow and retain reproducible research receipts. Preserve formal gates and publication restrictions.


### Valuation v1.1 external research and independent rubric eligibility

Use the [external research intake skill](../vn30-external-research-evidence/SKILL.md) for approved inputs only. Bind material dependencies, cross-check and adverse evidence per rubric/model/route/period. Keep publication eligibility, source-family revisions, investor corporate-action entitlement and terminal horizon traceable. Explicit zero dividend credit makes no payout prediction. Same-basis no-rerating may use the scale-free return when normalized economics, growth, dilution and contraction review qualify. Preserve independent conservative MOS, price-bound recalculation, sensitivity-only labels, exact replay and research authority.


### WP5 bounded shareholder IRR

For one ticker and cutoff, use the [scoped VAL-RET v1.2 amendment](../../docs/03%20SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.2.json). Distinguish qualified point, conservative case, single-band range, unexplained cross-band range and sensitivity only. Low or negative supported returns can score; zero points and N/R are distinct. Qualify the complete coherent uncertainty set, endpoints and material adverse cases. Review entitlement, terminal horizon, distribution credit and contraction. Use admitted analyst forecasts as evidence, and qualify material bounds independently. Exclude irrelevant model dependencies. Keep the existing cumulative workflow, price and share binding, counterevidence, model and band lineage, exact assessment record and research-only authority.

### WP5 v2.0 analyst-driven valuation

For one ticker and an eligible sector model, follow [RR01–RR20](../../docs/03%20SCORING/WP5_VALUE_INVESTING_ANALYSIS_AMENDMENT_v2.0.json). Pin a Data Freeze per period. Separate facts, reproducible calculations and analyst-generated estimates. Persist the model proposal and reasonableness challenge separately. External corroboration is optional. Classify material blockers RB01–RB05, allow a single revision, and bind the final economic disposition and limitations to the exact proposal. Preserve model-specific lineage, Method B priority, bounded return forms, five confidence dimensions, current-price Effective Score and existing research authority.

### WP6 Risk & Governance research

Use the [RG01–RG20 amendment](../../docs/03%20SCORING/WP6_RISK_GOVERNANCE_AMENDMENT_v1.0.json) for one ticker, eligible sector and frozen information window. Preserve factual audit, governance, sanctions and veto evidence separately from judgments. Review public governance and distinct residual loss channels. Record the prior rubric owner and distinguish planned controls, implementation and demonstrated effectiveness at the assessment date. Recompute thesis sensitivities using eligible retained scenarios and record shared dependencies separately from score levels. Use RV01–RV06, RB01–RB05 and at most one revision. Apply Effective Score freshness and material-event rules. Preserve formal Stage 0, Hard Veto and Risk Policy status independently from research classifications.

### WP7 Capital Allocation Quality research

Use the [CA01–CA24 research amendment](../../docs/03%20SCORING/WP7_CAPITAL_ALLOCATION_AMENDMENT_v1.0.json) for one eligible ticker and sector. Freeze factual decisions, deployed capital, commissioning and attributable outcomes. Reconcile parent cash retention, paid distributions and buyback applicability. Separate new issuance, treasury transfers and pro-rata entitlement changes. Calculate event-aligned transfer, ESOP break-even benefits and sequential per-share effects. Prioritize detailed, unchanged PX04/PX05 and then applicable bounded routes. Bind both comparative share basis and distinct cycle-adjusted support before awarding binary maxima. Preserve any N/R and provisional origins in the complete 23-rubric display. Aggregate complete research totals only when all Effective Scores qualify, with existing formal authority kept separate.
