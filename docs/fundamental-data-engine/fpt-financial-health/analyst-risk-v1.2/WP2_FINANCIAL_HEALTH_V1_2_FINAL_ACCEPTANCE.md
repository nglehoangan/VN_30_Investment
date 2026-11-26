# Financial Health Amendment v1.2 — Final Research Acceptance

**Technical verdict. Pass for isolated FPT research.** The owner accepted the retained assessments subject to technical closure. This record confirms AC01–AC12. The implementation and 19-file artifact set are already committed in f9745f4f5604edf97f93a331d7395b0abf0e848a. Its parent is the verified pre-v1.2 baseline 302003c8dca99aa1dd1aadc6f6c1cb17a43d2fe1. The final acceptance commit adds only this record. The initial index and working tree were clean. [Comprehensive closure](WP2_FINANCIAL_HEALTH_ANALYST_RISK_V1_2_FPT_CLOSURE.md)

## Accepted results at 2026-11-13

| Rubric | Effective result |
| --- | --- |
| BQ-EQ | 5/8 PROVISIONAL |
| BQ-MOAT | 3/6 CONFIRMED_CURRENT |
| BQ-CASH | 3/6 PROVISIONAL |
| BQ-RES | 3/5 PROVISIONAL |
| FH-BS | 3/6 CONFIRMED_CURRENT |
| FH-LIQ | 2/4 Method A, CONSERVATIVE, CONFIRMED_CURRENT, confidence 7/10 |
| FH-STRESS | 2/5 Method A, CONSERVATIVE, CONFIRMED_CURRENT, confidence 7/10 |

**BQ 14/25 PROVISIONAL, FH 7/15, combined 21 points on 40/100 rated weight and 7/23 effective coverage.** Genuine in-scope N/R is zero. Sixteen rubrics remain outside the rollout. Full Investment Score is null.

FY2025 supports the same A band scores, with confidence 8/10 for LIQ and 7/10 for STRESS. LIQ assesses meaningful financial capacity alongside material refinancing risk. STRESS assesses material vulnerability in a plausible severe scenario. Method B retains priority and canonical semantics. Its LIQ timing and covenant disposition and STRESS capital-response conclusion remain unresolved in both periods. [Analyst assessment](FPT_FH_ANALYST_RISK_ASSESSMENT.json) · [Result](FPT_FH_ANALYST_RISK_RESULT.json)

Current validity applies to the risk profile. Formal liquidity adequacy and survivability are NOT_ASSESSED. Stage 0 is UNKNOWN, Hard Veto PENDING, residual risk NOT_RATED and valuation NOT_ASSESSED. Formal ranking, actionability and production publication are disabled. The single-issuer research comparison has no rank ordinal. Official FPT V8 remains at its exact authorized scope.

## Control disposition

| Controls | Disposition |
| --- | --- |
| FH01–FH03 | Weights and canonical objectives retained. FH-BS sector, asset quality, leverage and resource controls retained. |
| FH04–FH08 | Direct B requirements retained. Approved A risk bands govern eligible A assessments, including restricted-resource and unsupported-funding exclusions. |
| FH09–FH12 | Sector normalization, independent analyst judgment, period and scope lineage, incremental freshness and invalidation retained. |
| FH13–FH15 | Accepted workflow, six skills, downstream restrictions and BQ/FH-BS replay verified. |
| AB01–AB04 | B-first selection, shared evidence, detailed-gap eligibility and adverse-evidence protection retained. |
| AB05–AB08 | A ceilings 3/4 and 4/5 retained. A LIQ and STRESS semantics follow v1.2. B/PX01 qualification and the stress model retained. |
| AB09–AB12 | Freshness and Effective Score, Prepare-to-Scoring, six skills and isolated downstream authority verified. |
| AR01–AR18 | Accepted for isolated FPT research. The comprehensive closure maps each item to owner direction. |

AB01–AB12 are audit references assigned here to the v1.1 requirements. The v1.1 owner direction did not number them as AB items. [FH01–FH15 owner direction](../v1.0/OWNER_REQUEST.txt#L9) · [v1.1 owner direction](../dual-route-v1.1/OWNER_REQUEST.txt) · [AR01–AR18 dispositions](WP2_FINANCIAL_HEALTH_ANALYST_RISK_V1_2_FPT_CLOSURE.md#amendment-controls)

## Typecheck baseline and technical debt

**Five identical diagnostics on both revisions. Zero new or worsened diagnostics.** Compared a temporary git archive of the verified parent against the active project using TypeScript 6.0.3, the same dependency tree, unchanged tsconfig.json, shared Next type inputs and an equivalent generated Prisma client. Used the same flags for both runs: --noEmit --pretty false --incremental false --project tsconfig.json. An initial baseline run identified the archive's missing generated Prisma client. After copying the equivalent generated client into the archive, the raw diagnostics matched byte for byte. The active project was left intact for the comparison.

For each diagnostic below: present on the verified parent, no effect on the WP2 execution path, and neither introduced nor worsened by v1.2. All five remain open technical debt. The existing test receipt records the issues. This acceptance record appends independent baseline attribution because no separate repository-wide Technical Debt Register was located. [Existing diagnostic record](TEST_RESULTS.json)

```text
app/server/acb-bank-admission.ts(73,40): error TS2345: Argument of type '{ now(): string; }' is not assignable to parameter of type 'Clock'.
  The types returned by 'now()' are incompatible between these types.
    Type 'string' is not assignable to type 'Instant'.
      Type 'string' is not assignable to type '{ readonly [instantBrand]: true; }'.
app/server/acb-bank-admission.ts(97,14): error TS2322: Type 'string' is not assignable to type 'Instant'.
  Type 'string' is not assignable to type '{ readonly [instantBrand]: true; }'.
tests/unit/debt-metric-contract-proposal.test.ts(4,192): error TS2307: Cannot find module '../../scripts/lib/debt-metric-proposal' or its corresponding type declarations.
tests/unit/di-governance-closure.test.ts(14,73): error TS2307: Cannot find module '../../scripts/lib/hpg-durable-successor.mjs' or its corresponding type declarations.
tests/unit/tcx-ket-vang-targeted.test.ts(5,82): error TS2307: Cannot find module '../../scripts/lib/tcx-ket-vang-review.mjs' or its corresponding type declarations.
```

## Execution and regression evidence

Execution exec-5532255d06ee7b93e497688e, queue queue-63bd8d0cc0f981c7119198d4. Verified methodology, candidate, analyst input, predecessor and executable pins. Method B contracts and the official V8 route match the parent. Financial inputs match the pinned v1.1 product. Recomputed the Prepare → Adoption → Preflight → Scoring hash chain, matched the Effective Scores and route qualifiers, and matched aggregation, ranking and Decision inputs against the executable result. [Candidate](CANDIDATE.json) · [Workflow](FPT_FH_ANALYST_RISK_WORKFLOW_RESULT.json)

Retained receipts verify **285/285 TypeScript**, **33/33 Python** and **33/33 formal integration**, including official V8, BQ/FH-BS replay, Method A scoring, Method B priority and authority. Final targeted runs passed **3/3 TypeScript** with 16 filtered out and **2/2 Python**, including byte-exact evaluator and workflow replay and publication rejection. Formal parity returned CURRENT_PARITY_PASS. All six skills retain the reusable v1.2 instructions and v1.1 replay links. [Regression evidence](TEST_RESULTS.json)

| Identity | SHA-256 |
| --- | --- |
| Methodology wp2-financial-health-analyst-risk-v1.2.0 | e6449f12c24109ec4997b5413b2998a2dd67052df423614a794c266cc093d79a |
| Scoring module fh-analyst-risk-research-v1.2.0 | f53c75a0357954fa0920ce949fa1ccc070c3c851c361bb13bdb609f9eb2eb253 |
| FPT evaluator | 166d9767b864bff635a1cf9397998dccd9b0e61a30ef0e426fb108addf088a24 |
| FPT workflow host | bb850dc9a5bb0089d7e2ba3a9dca3a9f220314d0284dae8c8ee94ca1b18d1f81 |
| Analyst proposals | 695e03e2d8fbdec11fb1ee17cac227f2bc9d63c06674595ba24f769cea919fc9 |
| Effective Score and analytical result | 2f89613a4ed9cd0211a1308ace0c0a2dc5eaa484cc125fdab57de358f8d7bfea |
| Complete workflow receipt | 4103adf625a1705f7cef601869c9f1b670ed9da0a2fd1ca5b733364ec227b7f7 |

Future Method B assessment still needs unrestricted cash and deposit accessibility, obligor-specific funding and maturity matching, material covenant disposition, committed funding availability and relevant capital-response details. These limitations do not block the accepted A risk profiles. Mixed-route cardinal comparability remains a future calibration item.

**Recommendation.** Close WP2 v1.2 as accepted for isolated FPT research. Preserve the result, its restrictions and the prior versions for replay.
