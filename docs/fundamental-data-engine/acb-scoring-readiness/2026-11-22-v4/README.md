# ACB V4 research closure and CIO handoff

V4 research closed after one retained-evidence pass for ACB BANK at 30 October 2026. The V3 score artifact remains the latest stored official limited-coverage result. Both versions have 14 rated rubrics, nine N/R, 18 confirmed points, 58/100 rated weight, 42/100 unrated weight and bounds of 18–60. The complete official total is blank. No result is eligible for ranking or capital allocation. V4 added zero percentage points of coverage.

[V4 research closure](V4_RESEARCH_CLOSURE.json) contains all 23 rubric dispositions with evidence hashes, publication dates when known, counter-evidence, confidence and reopening conditions. None of the nine gaps supported a verified or conservatively bounded band. The closure records why retained evidence was sufficient to close the research pass and why further public searching was deferred.

| N/R rubric | Evidence required to reassess |
| --- | --- |
| BQ-MOAT | Comparable retention, churn and servicing economics |
| FH-LIQ | Q3 incremental sources after haircuts and overlap removal, and support for funding retention |
| FH-STRESS | Joint funding costs, funding capacity and post-stress capital on the same scope |
| GQ-FWD | Consistent growth, margin, credit cost and capital/RWA projections |
| IC-POS | Market share or a comparable segment distribution proxy |
| VAL-PRIMARY | Defensible sustainable ROE and cost of equity, or a comparable long-run pricing check |
| RG-GOV | Transaction-specific evidence of disclosures, recusal, pricing control or independent oversight |
| RG-RISK | Actual transaction exposure, terms and safeguards |
| CA-REINV | Same-period subsidiary net profit, paid-in amounts and deployment dates |

## Future evidence

The dashboard navigation opens `/acb-scoring`. It reads the local SQLite register and displays the research closure, separate score versions, seven expected report classes, document-event history and pending reviews. Publication windows in the [seed inventory](FUTURE_EVIDENCE_SEED.json) are planning estimates. Actual publication dates start empty.

Record a source manually with the command below. It stores the supplied bytes by SHA-256 and appends a dated event. Repeat the identical event to retry safely. Use the report IDs and field names in the seed inventory.

```sh
python3 -B tools/scoring/acb_future_evidence.py --database data/vn30.sqlite --event /path/to/event.json --source /path/to/report.pdf
```

A capture event accepts `reportId`, `status` (`CAPTURED`), `ticker` (`ACB`), `issuer`, `reportingPeriod`, `actualPublicationDate`, `sourceUrl`, `sourceHash` and optional `nextReviewDate`. For `VALIDATED`, add `identityBasis` documenting the issuer, period and publication locator, a `reassessmentCutoff` on or after publication and `fields` keyed by the seed field names. Each field has a string `value` on its original basis and an exact `locator`. This is an analyst-attested import workflow. It retains analyst-supplied field mappings and creates a review item limited to the affected rubric IDs. `ADMITTED` requires `admissionId` for an existing governed BANK receipt matching the ACB cutoff and source digest. `REJECTED` and `SUPERSEDED` require a reason. Nothing runs on a schedule or alters an approved score.

## Prepared route

[Assessment](V4_ASSESSMENT.json), [preparation review](V4_PREPARATION.json) and [challenge review](V4_CHALLENGE.json) are bound to the [candidate](V4_ROUTE_CANDIDATE.json). The existing CLI accepted these two AI self-review artifacts and the original BANK binding against the already approved limited-coverage methodology and executable. It returned `READY_FOR_CIO` with `scoringAuthorized: false`. The [exact prepare package](V4_PREPARE_RESULT.json) records the proposed route, preflight and approval hashes. The input BANK reference in that package pins the binding manifest and acceptance.

```sh
python3 -B tools/scoring/vn30_score.py --ticker ACB --mode prepare \
  --universe-version vn30-20260803-reviewed-20261115 --cutoff 2026-10-30 \
  --candidate docs/fundamental-data-engine/acb-scoring-readiness/2026-11-22-v4/V4_ROUTE_CANDIDATE.json
```

The CIO subsequently authorized the exact route and approval hash `9096cf81e4c11623ffdcf256c1a0936bda76293bdf9fedc930112af7ffd9da3d`. The registered route passed read-only [check](V4_AUTHORIZED_CHECK.json), and the governed [execution](V4_SCORE_EXECUTION.json) completed. [SQLite readback](V4_SCORE_READBACK.json) verified the immutable V4 artifact and the original V3 artifact. Website deployment and publication were separately governed at scoring time.

## Exact hashes for CIO

| Item | Identity |
| --- | --- |
| Dataset | `b916468f9808b2f7fed904ef5ba14913c7546cb644289bb0b0a28d3aa1152568` |
| BANK binding manifest | `bff83724df834f2b29a7a4d0a3a3b573ab466aa2c2d4f72ab23f9b42b2825119` |
| BANK data acceptance ID | `current-data-acceptance:2624e22d282b23bd94db0834ecc6f012828350dce9ad2f729d994b30bdac614f` |
| Methodology | `75f46e49dfe3abb2d40a25554b57f0567c04cc099823d865caa08bc902c43d68` |
| Executable approval file | `407b0ab0b6a918139c27b8fb5b642ad70f1d92d4177d2772b73579705caad75d` |
| Formal assessment | `336c1096353836667baf41d772536baa361bf0ab77d690be8d4880d9184cbba3` |
| Review | `c293afa063edc2499c2bdb8db8f3881e27404c30c6cb538d45692a9a5bdc69da` |
| PREPARATION file | `96225c519dd5b9542f8e966f7683cba8120e3056b3e41c06785fe7a19037f476` |
| CHALLENGE file | `01bdbbae8ef9115c9ccabe06383857f782e1d535964e79c452a7d433d0f62317` |
| Preflight | `c1f8f6d763dc2a25d876090531e5665714018180948d8430d6ea4bb14632616f` |
| Approval | `9096cf81e4c11623ffdcf256c1a0936bda76293bdf9fedc930112af7ffd9da3d` |

## Validation and local migration

- Applied SQLite migration `202611220001_acb_future_evidence` transactionally on the local target after the Prisma CLI stalled. The migration history records the checked-in SQL checksum. SQLite quick check returned `ok`. The seven expected registrations are present and both existing score artifacts matched their pre-migration bytes.
- Four evidence-register tests and ten isolated scoring CLI tests passed. The latter use a fixture registry for missing-authority checks and synthetic workers for write/retry scenarios. These tests ran before CIO authorization and used no live score writes.
- Thirty-four integration tests passed for current formal scoring and the scoring consumer. The existing current-parity check passed.
- Rendered the ACB page server-side from local SQLite and checked the 23 rows, nine N/R labels, seven-document register section, pending reviews and separate V3/V4 history. The Next development server stalled before returning an HTTP response. No deployment was attempted.
- Repeated read-only `prepare` after migration and reproduced the package byte for byte. Full repository typecheck remains blocked by existing errors in BANK admission and three tests that import missing scripts.


## Website publication

The owner subsequently authorized read-only ACB V4 publication. The governed service added a single immutable catalog entry with hash `d7bf7095aa984decbf521df18290f841dd7e502521a7192d4833767226059c88`. Its detail path is `/scoring/acb-official-limited-v4-20261030-60771d30b8aa`. The registered server reader verified the card and its lineage, and a repeat publish did not duplicate the entry. VNM already has its original PUB-04 catalog entry. Its current detail read fails on the retired `scripts/cafef-standing.mjs` replay dependency. No second VNM entry was written.

Removed 25 tracked superseded drafts and diagnostics with no retained references. [Cleanup inventory](V4_CLEANUP_RESULT.json) lists the removed files and the drafts still referenced. Governed pins, final results, evidence history and approvals are required for replay and remain available. The ACB route passed read-only `check` after cleanup.
