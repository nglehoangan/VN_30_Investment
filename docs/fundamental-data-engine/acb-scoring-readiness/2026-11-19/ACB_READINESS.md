# ACB scoring readiness — 19 November 2026

**Final status: BLOCKED.** Economic cutoff **30 October 2026**. Universe **`vn30-20260803-reviewed-20261115`**. Scope **CURRENT_FORMAL_VALUATION**.

## Repository and CLI

The reviewed commit `912673229af9b8ade624dc7c828377716c30d959` retired the root scripts. At that commit, `tools/` offered maintenance utilities, the rollout Skill exposed `inventory`, `prepare`, `plan` and `status`, and `src/` held the governed engine and source-admission contracts. The application served the separately registered VNM readback. None provided a reusable scoring CLI at that SHA. Its immediate successor `54ee0266cf19027f8281411cf8683aff71243181` implemented one under root `scripts/`. This change moves that implementation into [tools/scoring](../../../../tools/scoring/vn30_score.py), consistent with [root script retirement](../../../maintenance/2026-11-19/SCRIPT_RETIREMENT.md).

The [CLI guide](../../single-ticker-architecture/2026-11-18/SCORING_CLI.md) covers all four commands. Each accepts one ticker and requires the universe version and cutoff.

| Mode | Implemented behavior |
| --- | --- |
| `check` | Read-only scope and inventory check. For a complete registered route, uses the Node bridge and the existing `CurrentPurposeScoring.preflight` via read-only SQLite. |
| `score` | Checkpoints the prerequisites under the store-wide lease. A complete registration and exact preflight are required before dispatch to the existing scorer. |
| `status` | Verifies and reads the saved execution state and result. |
| `resume` | Explicit retry with the same operation key. Completed results are reused. A changed route or bound input produces a separate execution. |

The [bridge](../../../../tools/scoring/vn30_score_worker.mjs) constructs the existing scorer with its governed data consumer, pinned assessment and pinned executable verifier. It checks ticker/security/cutoff/sector, exact preflight hash and revocation before allowing an artifact write. The [registry](../../../../tools/scoring/vn30-score-routes.json) is empty. ACB stops during read-only prerequisites, before governed scoring preflight can run.

## ACB evidence and blockers

| Area | Verified result | Remaining work |
| --- | --- | --- |
| Membership, identity and route | Exact 30 October membership qualifies. HOSE, security ID `658fafbe-65b3-4176-999f-d4d32e1bd838`, BANK from the accepted sector head. | Use this exact identity, reference and cutoff in any later registration. |
| Financial data and research mapping | Both retained ACB combined and API JSON inventories are present. The Level 1 evidence lists ACB as a closure candidate. The 16 October review found accounting sufficient for Level 1. DFR-05 provides 85 supported/92 metric objects, seven gaps and zero unresolved financial conflicts. The 4 November successor accepts specific FY2025 readings and a bounded earnings bridge. | Reuse the checked overlaps, then bind the required cutoff periods and concepts to the current-route mapping. Preserve the distinction between the FY2025 accepted earnings bridge and still-unqualified historical parent-attributable windows and CET1 scope. |
| Source authority and admission | Retained sources are covered by the owner-confirmed provenance principle within its recorded scope. SQLite read-only inventory shows zero ACB current admissions or datasets at cutoff. The current admission/dataset tables hold VNM only. Legacy data-initialization acceptance and scoring-dataset-binding tables are empty. | Verify per-observation lineage and source authority in the existing consumer, then obtain the governed ACB admission, exact dataset binding and data-acceptance receipt under separate authorization. |
| S1–S5 | S1 has earnings/credit-cost work and scoped FY2025 acceptance. S2 has funding, reserve and capital evidence. S3 requires ACB-specific market-position, advantage and counterevidence. S4 has a dated price reference with provider adjustment basis undeclared and an unfinished September share-count-to-cutoff bridge. S5 has conditional research scenarios. DFR-05 recorded 23 deferred rubrics, zero with complete topic readiness and zero new points. No exact successor adoption for the audited scope was found. | Close the unresolved sustainable return and common-owner inputs, funding and maturity coverage, qualitative rubric topics, qualified raw close and share/corporate-action bridge, and valuation dependencies. Bind the finished assessment and reviews to the exact governed dataset. |
| BANK valuation | The Skill specifies sustainable ROE/ROTE against cost of equity, asset-quality/credit-cost, funding and capital checks, then residual income or justified P/B, with normalized P/E as a cross-check. Conditional ACB residual-income research exists. The 4 November successor rejects the positive provision addback and retains actual credit costs for its FY2025 case. | Reuse the BANK route and the successor's scoped earnings treatment. Qualify common equity, sustainable returns, cost of equity, capital retention/distribution assumptions and the dated per-share basis before adopting a formal input. |
| Formal inputs and authority | No registered ACB packet establishes exact dataset lineage, mandatory rubric assessments, M1/risk gate, confidence and score authorization. The historical VNM registration and authority target VNM. | Separately review the complete ACB input and resolve all required gates. Record an exact ACB owner receipt and active, unrevoked executable and assessment bindings. |
| Executable integration | Existing reusable governed scorer and CLI bridge are present. The ACB dataset adapter is unregistered. The retained current executable authority pins the retired `scripts/generate-current-scoring.mjs`. | Compose/register the ACB dataset consumer from existing services. Resolve the missing executable pin through the existing successor approval workflow. Preserve the old receipt and root script retirement. |
| Existing scores and retry | The current-score table contains one VNM score. The only legacy analytical artifact is a read-only publication envelope for VNM. No ACB formal score was found. ACB CLI status is `NOT_STARTED`. | After exact gates are independently verified, use the same deterministic execution for retries. No other issuer's evidence or approvals enter the registration. |

Retained evidence: [Level 1 accounting review](../../evidence/2026-10-16-ticker-closure-ACB/FINAL_REVIEW.md), [DFR-05 final review](../../dfr-05/p2-2-acb-01-264c7120/DFR_05_P2_2_ACB_FINAL_REVIEW.md), [FY2025 item acceptance](../../scoring-dataset-acceptance/2026-11-04/fy2025-item-acceptance-v1/issuers/ACB.md), [successor valuation research](../../scoring-dataset-acceptance/2026-11-04/investment-research-v2/issuers/ACB.md).

## Validation

- Real read-only CLI `check` returned `BLOCKED` with `NO_ADMITTED_CURRENT_DATASET_AT_CUTOFF`, `NO_REGISTERED_TICKER_MAPPING_ADAPTER`, and `NO_EXACT_TICKER_SCORING_AUTHORITY`. Execution ID `exec-267abb04b9e876998ce11992`. Read-only `status` returned `NOT_STARTED`.
- Eight isolated CLI tests and 18 rollout tests passed. Covered scope rejection, BANK routing, bridge rejection with missing authority, propagation of a synthetic governed preflight blocker, duplicate execution and interrupted retry. The registered-route preflight and successful completion branches used synthetic results. No registered ACB scorer call was made.
- Each isolated CLI test checked that its protected portfolio/NAV SQLite fixture stayed byte-identical with no sidecars. The active database hash matched the previous protected baseline `0876f70a76b8d89efe1d33559ff2d68b4f8b50bdccb2e510562fd4dc748d8e51`. The PUB-04 registration hash matched the reviewed file. Node syntax validation passed.

**STOP for CIO review.** No scoring, production deployment, publication or trading was performed.
