# VNM targeted Step 4 remediation

Baseline: `d5db9877513309bb556f9de584697f2ab038707c`. Economic cutoff remains 2026-10-30. Source confirmations, F1/F2 standing authorities, Step 1/2/3 and S1–S5 research closures remain unchanged.

## Implemented changes

| Issue | Implementation | Acceptance boundary |
|---|---|---|
| Current data entered historical DI authorization | `PurposeAwareScoringEngine.scoreCurrent` routes to `CurrentPurposeScoring`, which resolves the genuine current binding, verifies every native financial evidence object against the consumed dataset, and binds exact dataset/input/review/method hashes. Current artifacts persist with an independent immutable binding in `current_score_artifact`. | Explicit application route implemented and tested. No historical DI row, fake snapshot or scorecard is needed to create a data binding. No live composition or schema migration is activated. |
| Method effective date compared to economic date | New `current-scoring/time.ts` requires economic cutoff = source asOf date; asOf ≤ knownAt ≤ evaluatedAt ≤ calculatedAt; method effective date ≤ evaluation date; method recordedAt ≤ knownAt. | Real retained VNM cutoff/time tuple passes temporal validation. The separate legacy path is unchanged and still rejects CURRENT_ONLY and later-method historical replay. Temporal consistency does not grant methodology approval. |
| Four rubric bands | Recomputed 16 coherent incremental scenarios, group operating-profit history, common-owner EPS changes, parent dividend funding, JV/associate movements and parent TTM update from retained evidence. | `VNM_ECONOMIC_BRIDGES.json` records exact inputs/formulas/scope and remaining economic dependencies. All four remain N/R; missing detail is not assigned zero/midpoint. No new financial report is demanded. |
| Assessment/M1 adoption | Reuses the existing pinned two-pass AI review contract through a generated current-input namespace. Exact input/review hashes bind all assessments, current-time context and dated external M1 gates. A pinned adoption packet must additionally match the consumed dataset hash and disposition all existing metric families with rule/evidence references. | Actual trusted verification is implemented and exercised with clearly labelled synthetic authorities. A complete real VNM assessment is not fabricated: four mandatory bands remain missing. No HUMAN relabeling, per-fact source approval or invented review receipt. |

The generator derives the financial algorithm from the existing personal-AI scorecard and the existing metadata-only action predicate. Only evidence type, explicit purpose/time handling and output namespace are adapted. The original HUMAN and personal-AI source bytes and all 71 Step 3 runtime pins remain intact. Generator parity and cross-sector numeric comparison guard against an independently drifting scoring formula. This is code reuse, not a new financial data pipeline.

## Confidence and actionability

The new path retains all five confidence dimensions. A complete, genuinely adopted score with LOW confidence can be `VALID — NON-ACTIONABLE`, consistent with the domain and M3 confidence overlay; it does not become eligible for new capital. Unknown Stage0 or pending hard-veto review blocks admission. A high score never creates a trade decision. No confidence value is raised to pass a gate.

## Real-data execution and authority

`run-real-validation.mjs` uses actual retained VNM observations and the existing real source authority in a disposable DB: 69 admitted financial facts, 35 consumed current facts and 65 retained historical facts. The actual application current-purpose preflight rejects with `CURRENT_EXECUTABLE_APPROVAL_PENDING`, rather than attempting legacy DI. No new score rows are inserted. `CURRENT_ROUTE_VALIDATION.json` records the exact rejection, clock, counts and replay.

The new current-purpose executable is a distinct candidate version. `CURRENT_EXECUTABLE_REVIEW_PACKET.json` binds its exact code/schema/build-tool bytes, the preserved Step 3 baseline and proposed method. It is explicitly PROPOSED. The prior owner approval was for the old exact executable; this implementation request is not converted into an exact-content signature. A real approved version and complete review are required before formal consumption. The proposed method is registered only as PROPOSED in the disposable DB. No old manifest is rehashed and no new production authorization is self-issued.

This packet is not yet an approvable final VNM numeric assessment: its economic selections are incomplete. Approving code alone cannot supply those selections, and no repeated source approval is requested.

## Remaining indispensable dependencies

| Rubric / boundary | What remains | What is not required |
|---|---|---|
| GQ-INC | A defensible aggregate incremental-capital/earnings basis or principle-equivalent marginal-economics assessment. The retained small/classification-sensitive net-book deltas are not automatically reliable marginal capital. | Exact project/factory attribution, a new provider or a fabricated return factor. |
| CA-REINV | Outcomes of material allocation choices sufficient to distinguish consistently accretive, mixed/acceptable and repeatedly destructive behavior. One JV loss is bounded counterevidence, not a verdict on all allocation. | An exhaustive project ledger or blindly reusing S1 level ROIC/S5 forecast budgets. |
| CA-DIST | Retention/distribution opportunity-cost assessment relative to actual reinvestment uses. Parent FY2025 cash dividends exceeded common earnings by about 2.758tn VND; deposit runoff/net borrowing explain funding, but neither prove nor disprove rational surplus distribution. | Reopening S2 payability, private deposit terms or assuming high dividend yield earns a point. |
| CA-PSV | Cycle/action-adjusted common-owner economic outcome sufficient to establish real per-share compounding. FY2025 common EPS growth is only about 0.137%; nominal four-year growth and book-plus-cash do not prove normalized intrinsic growth. | Mandatory new inflation dataset, historical PIT or a mechanical dividend addition to EPS. |
| Formal adoption / executable version | Complete exact assessments and dated M1 gates through the genuine trusted review path, plus legitimate acceptance of the new exact executable version. | Reapproval of real source websites/APIs, every PDF/fact, the old Step 3 executable or an invented HUMAN identity. |

If retained evidence cannot resolve an economic dependency, retain N/R and no complete VNM total. No additional generic milestones or acquisition campaign are proposed. Portfolio, NAV, trades and live CAS remain untouched. Stop for CIO review.

## Replay

Use the supported Node version and verified migration cache recorded by the prior validation package:

```sh
python3 docs/fundamental-data-engine/vnm-step4-targeted-remediation/2026-11-17/economic-bridges.py
VN30_TEST_MIGRATIONS_DIR=/private/tmp/step3-verified-migrations /private/tmp/node-v22.23.2-darwin-arm64/bin/node docs/fundamental-data-engine/vnm-step4-targeted-remediation/2026-11-17/run-real-validation.mjs
VN30_TEST_MIGRATIONS_DIR=/private/tmp/step3-verified-migrations /private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/vitest/vitest.mjs run --config docs/fundamental-data-engine/vnm-step4-targeted-remediation/2026-11-17/validation.config.mjs
/private/tmp/node-v22.23.2-darwin-arm64/bin/node docs/fundamental-data-engine/vnm-step4-targeted-remediation/2026-11-17/typecheck.mjs /private/tmp/vn30-step2-dependencies scoped
```

These temp dependency/cache locations reproduce this environment; the lockfile and Git blob checks remain mandatory. No test command migrates the live database. `VALIDATION.json` is the final result; historical initial attempts are not final PASS claims.
