# Business Quality Prepare → Scoring integration closure

**Verdict · End-to-end validated for the isolated FPT research successor.** The queued execution reached `SCORED_RESEARCH_ONLY` and emitted **14/25 PROVISIONAL** Business Quality from all four accepted Effective Scores. Its full Investment Score is null. The starting HEAD was `901a1cb09fe3192b7a6d21cfa38208f80f64e16f`. The validation scope comes from the retained owner request and applies to FPT at 13 November 2026. [Owner direction](OWNER_REQUEST.txt) · [Exact candidate](CANDIDATE.json) · [Executed workflow and scorecard](FPT_BQ_SUCCESSOR_WORKFLOW_RESULT.json)

## Root causes and integration point

1. The official controller `vn30_score.py::prepare_route` requires an admitted dataset and adapter, assessment, reference, executable and review bindings. Its worker then requires a registered band and every native topic with known evidence IDs, except the pinned limited-route exclusions. It can return `CURRENT_SCORE_MANDATORY_ASSESSMENTS_REQUIRED` for qualified BQ research with intentionally absent supporting detail. The old gate is appropriate for its registered formal contract. [Controller](../../../../tools/scoring/vn30_score.py) · [Worker](../../../../tools/scoring/vn30_score_worker.mjs)
2. The formal `calculateScorecard` uses current topic completeness, counterevidence, action comparability and other native requirements. It nulls a rubric, category and full total when the corresponding requirements fail. Its input and admission service have no field for research Effective Score. `PinnedCurrentAssessmentAdoption` and `CurrentPurposeScoring.authorize` separately require the exact approved assessment, dataset, methodology, executable, review and external risk controls. Passing economics does not grant that authority. [Scorer](../../../../src/domain/current-scoring/scorecard.ts) · [Adoption and authorization](../../../../src/infrastructure/source-admission/current-scoring.ts)
3. The formal controller and worker are part of the approved executable pin. The versioned successor reuses `scope`, `prepare`, `Rollout.plan`, `Worker` and `run_next` through the existing governed single-ticker framework. It binds a separate `RETROSPECTIVE_RESEARCH` request and keeps the formal paths and route catalog byte-identical. [Successor controller and adapter](../../../../tools/scoring/vn30_bq_successor.py)

## Executed workflow comparison

| Stage | Existing official route | Successor BQ-compatible route |
|---|---|---|
| Candidate construction | Exact formal route for the security, cutoff and purpose | `construct_candidate` verifies the ticker and universe through the formal scope resolver, then binds a separate research job to the owner direction, approved methodology, exact input, accepted result, trusted adapter and orchestrator bytes. |
| Prepare | Admitted dataset and native registry-topic completeness | `prepare_assessment` consumes a fresh exact replay of the approved Evidence Sufficiency validators and Effective Score resolvers. Actual status **PREPARED**, 4 rows accepted and zero blockers. |
| Assessment adoption | Exact AI review, dataset and formal assessment bindings | `adopt_candidate` binds the research scope and owner direction to the candidate and Prepare hash. Actual status **ADOPTED_FOR_ISOLATED_VALIDATION**. |
| Evidence sufficiency | Native all-topic predicate or exact limited-route exception | Rubric-specific supporting, conditional and band-dependent rules are applied by the retained evaluator. There is no synthesized topic binding. Cash CAPEX maintenance/growth split is legitimately absent in the approved assessment. A missing eligible BQ Effective Score blocks this exact candidate. |
| Preflight | Registry/executable/dataset/adoption/risk checks; exact route and owner authorization hashes | `preflight_candidate` checks the adoption and pin bindings. Actual status **AUTHORIZED_FOR_ISOLATED_VALIDATION**, formal permissions all false. |
| Scoring execution | Registered live worker, current scorecard and SQLite transaction | `execute_candidate` checks the preflight, re-executes the evaluator, and checks equality with the exact accepted result and Prepare rows. Actual status **SCORED_RESEARCH_ONLY**. |
| BQ-EQ | N/R in official V8 | **5/8 PROVISIONAL**, current N/R |
| BQ-MOAT | 3/6 in official V8 | **3/6 CONFIRMED_CURRENT**, current 3/6 REAFFIRMED |
| BQ-CASH | N/R in official V8 | **3/6 PROVISIONAL**, current N/R |
| BQ-RES | N/R in official V8 | **3/5 PROVISIONAL**, current N/R |
| Business Quality | Category total null in V8 | **14/25 PROVISIONAL**, 4/4 rubrics and 25/25 weight |
| Downstream consumption | Canonical formal scorecard eligibility applies | Same four Effective Scores reach the accepted research aggregator, rank input, Investment Decision input and HTML scorecard. |
| Production authority | V8 exact scope and the existing trust and revocation checks | Scope is `ISOLATED_BQ_VALIDATION_ONLY`. The receipt grants no formal admission, production scoring, ranking, trade or publication authority. |

Execution `exec-e135b1fcd21f4e3768ae1176`, queue `queue-df825187dde01543cf3a8eea`, candidate digest `feaa5a12b724d43107579b22e67b65a664828e8ffcf52cac207825c0794525f9`. The retained receipt contains six immutable-stage checkpoint payloads from a temporary single-worker store, including assessment lineage, freshness flags, confidence, provisional material dependencies, preflight hash, scores, downstream inputs and HTML. The runner performs no production database access.

- **Coverage** · Confirmed 1/23 at weight 6/100; provisional 3/23 at 19/100; effective 4/23 at 25/100. The other 19 are explicitly outside the completed rollout scope, 75/100 weight. No points were fabricated or redistributed.
- **Downstream** · Research rank input has one issuer and a null ordinal. Decision input retains Stage 0 UNKNOWN, hard veto PENDING and residual risk NOT_RATED. Full provisional, confirmed current and formal Investment Scores are null.
- **Economic limitations** · FTEL scope, comparable cash realization and operating resilience remain pending as in the accepted inputs. The provisional points remain visibly provisional. This workflow resolves the research validation barrier. The separate formal authority gate continues to apply.

## Replay, regression and reuse

```sh
python3 -B tools/scoring/vn30_bq_successor.py --ticker FPT --cutoff 2026-11-13 \
  --universe-version vn30-20260803-reviewed-20261115 > /tmp/fpt-bq-successor.json

jq -r '.evidence[] | select(.stage=="RESEARCH_SCORECARD") | .result.html' \
  /tmp/fpt-bq-successor.json > /tmp/fpt-bq-successor-scorecard.html
```

Implementation `vn30-bq-prepare-scoring-research-successor-v1`. Changed files are the new successor controller, its focused test, and this package containing owner direction, candidate manifest, actual workflow receipt and closure. Existing scoring files and accepted research artifacts were kept as exact dependencies. [Successor tests](../../../../tests/unit/test_vn30_bq_successor.py)

**245/245 TypeScript tests passed**, including all 33 formal integration cases. **22/22 Python tests passed** across successor (5), formal controller (10) and unified governance regression (7). The tests verify scoped idempotent replay, absent supporting CAPEX detail, ineligible missing or expired historical foundations, confirmed invalidation, adoption drift and rejected formal/publication flags. The accepted BQ research matched byte-for-byte. Formal parity returned `CURRENT_PARITY_PASS`. Exact V8 reducer replay matched `fpt-limited-v8-2026-11-13`, BQ-MOAT 3/6, IC-IND 2/4, 21 N/R and a null full score. These are in-memory replay and code-pin checks.

For a subsequent authorized category, bind the exact ticker/cutoff, owner direction and approved assessment/evaluator/output to a versioned isolated candidate. Reuse the single-ticker queue with an explicit rubric scope. Let the approved evaluator determine current and historical eligibility, then bind Prepare → adoption → preflight → scoring hashes. Keep current and provisional coverage separate and publish only through separately authorized paths. This adapter's entry point is pinned to the demonstrated FPT BQ candidate.

**Remaining formal authority** · No further owner approval is needed for this isolated run. Any future official successor for FPT security `ec91b3cb-8eab-45ae-95e7-738bb3c7de52` at 13 November 2026 requires its own `CURRENT_FORMAL_VALUATION` methodology/executable, admitted dataset, exact assessment adoption and formal preflight. `vn30_score_worker.mjs` then requires an exact `vn30-single-ticker-score-approval-v1` receipt with scope `CURRENT_SCORE_ARTIFACT_ONLY` and the owner statement `Approve exact single-ticker VN30 score <formal approvalHash> for FPT at 2026-11-13`. No such formal successor digest has been produced. Existing V8 authority and this research candidate digest cannot approve that different route.

| Criteria | Disposition |
|---|---|
| AC01–AC03 | Pass. Identified the formal validation mismatch and executed the approved sufficiency and Effective Score contracts in the successor. |
| AC04–AC07 | Pass. Full isolated workflow produced 14/25 PROVISIONAL from four rows, leaving the full total null. |
| AC08–AC10 | Pass. Formal controls and V8 preserved. Research-only authorization and output verified. |
