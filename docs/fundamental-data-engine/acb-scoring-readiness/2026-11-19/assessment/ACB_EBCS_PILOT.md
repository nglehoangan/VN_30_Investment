# ACB Evidence-Based Conservative Scoring pilot

Scope is ACB/HOSE, BANK, cutoff 2026-10-30. The EBCS implementation is a research preview over the existing scorecard calculator. Verified rows must pass the existing rubric and evidence rules. A conservative disposition must match the lowest point of an existing, evidence-supported band and record the supporting references and reviewed counter-evidence. Unsupported rows remain unassessed with null points and their original maximum weight. The preview computes the subtotal, score interval and coverage using the original 100-point architecture.

The preview takes a single JSON packet with contract `ebcs-research-preview-input-v1`, a structurally reviewed current-purpose `input` and a `conservativeAssessments` array. It emits `RESEARCH_ONLY`, null official total and explicit false eligibility for ranking and allocation. It performs no database or route writes. Its scope check compares the requested ticker and date with the calculated scorecard. This preview is not the pinned dataset or authority verifier used by official prepare.

```sh
node tools/scoring/vn30_ebcs_preview.mjs --ticker ACB --cutoff 2026-10-30 --input <packet.json>
```

| Rubric | Pilot disposition | Existing evidence |
| --- | --- | --- |
| FH-LIQ | NOT_RATED | Q3 contractual maturity gap and H1 collateral sensitivity. The source of incremental available Q3 liquidity and representative retention remain unresolved. |
| FH-STRESS | NOT_RATED | H1 reverse stress and Q3 credit data inform the downside range. Funding availability and combined capital effects remain unresolved. |
| RG-GOV | NOT_RATED | Resolution 4490 evidences the approval process. Transaction-specific conflict handling and price oversight remain unresolved. |
| RG-RISK | NOT_RATED | The related-party channel is identified. Amounts, terms and control effectiveness do not support a residual risk class. |

The four N/R dispositions cover 17 possible points. If all other bands pass formal review, rated coverage would be 83/100 across 19/23 rubrics. This is a coverage projection. Actual ACB subtotal and bounds were not computed because the V12 draft is not a reviewed score input. The research preview rejected that draft. See [V12](ACB_ASSESSMENT_REVIEW_DRAFT_V12.json), [BANK readback](ACB_BANK_BINDING_RECOVERY_RESULT.json), and the [CIO N/R decision](ACB_CIO_NR_DISPOSITIONS_APPROVAL.json).

Read-only `prepare` on the retained route draft exited 1 with `CANDIDATE_PIN_REQUIRED` and `CANDIDATE_REVIEW_BINDINGS_REQUIRED`. `check` exited 1 with `NO_REGISTERED_TICKER_MAPPING_ADAPTER` and `NO_EXACT_TICKER_SCORING_AUTHORITY`. The BANK binding and data are unchanged. No score was executed or published. Baseline methodology, worker, executable authority and route gates continue to apply to official scoring.

Next decision is approval of the specific versioned limited-coverage calculation/display and executable changes. Once approved, integrate that version into official prepare and the shared authorization service, validate the end-to-end route, complete both reviews using the exact ACB BANK dataset and obtain an approval hash from prepare. Execution requires separate approval of that exact route followed by a successful authorized check.
