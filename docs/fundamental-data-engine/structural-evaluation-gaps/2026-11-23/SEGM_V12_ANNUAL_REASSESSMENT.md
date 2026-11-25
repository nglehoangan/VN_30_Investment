# SEGM v1.2 · FY baseline and incremental reassessment

**PASS WITH LIMITATIONS.** The new diagnostic validates and routes a reviewed single-ticker evidence packet. It identifies precisely which approvals and calculations still belong to the original scoring, valuation and decision workflows.

## Integration and audit

M1 Prepare uses `tools/scoring/vn30_score.py` and the approved worker to check universe, admitted datasets, assessment, review artifacts, executable and exact approvals. The read-only Prepare companion adds independent output without changing native route hashes. F1/F2 and the historical admissions own evidence identity, source eligibility and original publication clocks. Legacy FPT financial history is admissible for its recorded purpose, with 88 reviewed facts. Its retained FY2025 source manifest does not establish an exact original publication timestamp and original knowledge eligibility for 01/04/2026. That observed-history limitation stays separate from a synthetic replay that supplies both timestamps.

Scoring bands and weights come from the existing methodology registry. The dependency router compares evidence and reviewed bands and does not calculate an official score. Valuation retains the admitted price and prior model inputs, applies the sector's existing calculation rules in its existing workflow and records a separately versioned model result. Decision reassessment remains subject to M1, M4/M6.5, independently authorized actions, portfolio constraints and publication contracts. The companion cannot grant these authorities.

## Packet contract

Use `tools/scoring/vn30_prepare_evaluation.py --ticker <TICKER> --universe-version <VERSION> --cutoff <DATE> --annual-reassessment <PACKET>`. Optional native candidate and feasibility inputs retain their usual meaning.

| Entity | Required fields and interpretation |
|---|---|
| Packet | `contract=segm-annual-reassessment-v1`, exact `subject` with ticker/securityId/sector/cutoff/universeVersion, `purpose` of HISTORICAL_PIT or CURRENT_FORMAL_VALUATION, pinned `methodology`, `rubrics`, `current` snapshot, and optional pinned `prior` snapshot. Pins use repo-local path and SHA-256. Snapshot pins support an optional JSON Pointer. |
| Snapshot | ticker/securityId/sector, cutoff, knownAt, methodology, annualReports, observations, assessments and optional pin to valuationAssumptions. Snapshots are complete evidence indexes for their scope. They are retained versions and a producer should include still-valid inputs when adding new observations. |
| Annual report | ticker/securityId, periodType FY, fiscalYear, periodEnd, statementVersion, status AUDITED_FINAL/FINAL/PROVISIONAL, original publishedAt, knownAt, admitted, revoked, eligibility, source and admission pins, metricVersions, normalization and corporateActionComparability. Baseline hash binds the selected evidence row and methodology. |
| Observation | ticker/securityId, unique id, dependency, periodEnd, publishedAt, knownAt, eligibility, admitted, revoked, absolute value, unit, scope, normalization, optional validThrough, source and admission pins. Actual id/units/definitions must come from existing admitted records. |
| Assessment | One per approved rubric in the completed prior snapshot. Reviewed disposition includes state VERIFIED/CONSERVATIVE/N/R, points, band, rootCause for N/R, topic→evidence IDs, rationale, bandReview, review pin, reviewedAt, validThrough and snapshotHash. Generate the basis with `assessment_basis`. A rated result must contain each mandatory topic and use the approved band. CONSERVATIVE uses the band minimum. |

Use a reviewed evidence index from existing admission and policy workflows. Source pins prove unchanged bytes. This diagnostic does not independently grant admission based on a packet's assertions. Preserve originally recorded time precision. A report without the required publication timestamp is ineligible as a final baseline. Current-only observations may retain null publication time. For PIT, both publication and knowledge must be available by the recorded evaluation instant on the economic cutoff date. Later restatements are new revisions in the later snapshot. A provisional FY remains available as a diagnostic candidate and needs its original provisional rules before use.

## Routing and materiality

`RUBRIC_DEPENDENCIES` covers all 23 IDs. Map underlying fields to its economic domains only after normalizing definition/scope/unit:

- Returns and growth use comparable ROIC, NOPAT, invested capital and acquisition bridges. Cash flow uses CFO, CAPEX and compatible FCF/FCFE. Earnings/valuation use already normalized earnings or cash flow separately from reported data.
- Leverage/funding use qualified borrowings, cash, maturities, restrictions and financing. Industry, competitive position, stress and governance use issuer/sector evidence and tested alternative explanations.
- Share, corporate-action and per-share history dependencies distinguish raw closing price, effective ending shares, diluted shares and comparable EPS. Valuation also tracks distributions, terminal assumptions, discount rates, scenario sets and growth. Decision inputs include thesis, risk, required return through valuation, portfolio concentration, opportunity cost, Stage 0, veto and authority.

Review changes to admitted inputs using exact evidence IDs and semantics. Output an absolute delta only for one-to-one observations with matching units, scope and normalization. Input impact is a reassessment signal. Only an explicit validated assessment may change band or resolve N/R. KEEP checks the old reviewed basis and applicability at the new cutoff. Avoid replacing a supported finding with a placeholder or using data outside its purpose. Missing data in one branch does not prevent research elsewhere. Diagnostic PASS, PASS WITH LIMITATIONS and BLOCKED map to the existing feasibility vocabulary. Methodology changes and invalid basis require review through established control, with no new production enum.

When valuation inputs change, the output identifies the changed dependencies, missing prerequisites and whether the existing model needs a rerun. Price can invalidate forward-return and MOS even where a future assessment keeps the same rubric score. The companion does not calculate new model values from unnormalized data. Recompute in the existing sector model and revalidate its assumptions before adoption. Decision output includes impacts and remains blocked in this read-only scope. The originating workflow owns required-return and portfolio checks.

## Verification and impact

- Synthetic replays A–J plus invalid eligibility and prior-basis rejection pass. Fixtures separate publication, receipt and assessment clocks. They do not qualify actual historical FPT for 01/04/2026.
- Existing evaluation-gap, scoring CLI and structural N/R Python suites pass. Current scoring formula parity passes.
- FPT V8 read-only Prepare smoke check with retained price and shares produced 23 routing rows. Native READY_FOR_CIO result, route, preflight hash, approval hash and limited coverage matched the existing V8 result. Annual diagnostic was PASS WITH LIMITATIONS. That packet lacked eligible final FY, normalized earnings/cash flow and assumptions. Valuation and decision remained blocked.
- Native scoring, approved scoring weights/anchors/risk rules, databases, production publication and authority receipts received no changes for this task. Existing CLI callers retain their behavior when passing only `--evaluation-feasibility`.
- Unfinished integration: derive whole reviewed evidence indexes automatically from each admission/sector source and pass outputs to existing model execution. The diagnostic accepts pinned reviewed inputs today; data admission, detailed metric calculation, all rubric judgments and actual model reruns remain the approved consumers' responsibility. To get a real Historical PIT example on 01/04/2026, supply a qualified universe version for that date and admissible publication and knowledge receipts for FY2025. No new owner approval is required to run this research diagnostic. New formal assessments, changes to an approved executable or methodology, scoring and publication use their existing distinct approval requirements.
