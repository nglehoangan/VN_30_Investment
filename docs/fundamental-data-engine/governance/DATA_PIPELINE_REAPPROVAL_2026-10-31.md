# Data Pipeline Re-Approval Governance Record

| Field | Recorded decision |
| --- | --- |
| Record ID | `DATA-PIPELINE-REAPPROVAL-2026-10-31-R1` |
| Decision date | 2026-10-31 (Asia/Ho_Chi_Minh; date only) |
| Repository | `nglehoangan/VN_30_Investment` |
| Evidence baseline commit | `b3f432d24c93f8574171d848132c5fa7b52c414b` |
| HEAD inspected before this change | `b3f432d24c93f8574171d848132c5fa7b52c414b` |
| Baseline difference | None: inspected HEAD equals the evidence baseline. The documentation commit containing this record is a subsequent commit and does not extend the approved evidence baseline. |
| Approval authority | Project owner, through the explicit request in the project conversation to implement this scoped re-approval record. |
| Approval form | Owner-requested governance decision; not a cryptographically signed approval. No exact approval time, signature, external reviewer identity or external acceptance is asserted. |
| Record/release status | `READY_FOR_OWNER_REVIEW` / production activation `NOT_APPROVED` |

## 1. Purpose, authority and evidence boundary

This documentation-only record records two separate owner decisions below. The pipeline decision labels are scoped permissions, not production GO decisions or executable authority receipts. `READY_FOR_OWNER_REVIEW` describes this record's review readiness; it does not suspend the stated owner-scoped permissions or turn them into production approval.

The authority is the owner's attached request titled “TASK: Implement Data Pipeline Re-Approval Governance Record” in the project conversation. That request supplies the decision date, baseline, decision labels, capability matrix and exclusions. This record adds no signature or precise message timestamp. It neither creates a runtime receipt nor changes an existing approval receipt.

Before authoring, the baseline commit was confirmed to exist as a Git commit, HEAD was inspected, and the working tree was clean. Searches for this record ID, filename and scoped decision labels found no existing duplicate re-approval record. The evidence below is pinned to bytes present at the baseline; the mutable `current-review.json` pointer is not an approval of whatever it may point to in the future.

Repository conventions reviewed include [AGENTS.md](../../../AGENTS.md), the exact-manifest owner receipt and activation report (A3/A4), the personal AI review criteria (G1), and [Production Acceptance](../../08_CONTINUOUS_IMPROVEMENT/PRODUCTION_ACCEPTANCE.md). The latter remains a production-acceptance contract/candidate with explicit NO-GO boundaries; this record does not promote its status or claim its execution gates passed.

## 2. Pipeline A — Portfolio Data

**Decision: `APPROVED_WITH_RESTRICTIONS_V1.0`.**

### Approved scope

- Read-only portfolio display and holdings visualization.
- Cash and dividend presentation, preserving settled, pending and payable categories.
- Portfolio reconciliation analysis and source-labeled financial data.
- Validation against explicitly dated evidence, quantities, imported cost basis and source identities.

### Not authorized

- Production-qualified NAV publication.
- Automatic accounting ledger postings or automatic broker evidence acceptance.
- Automatic trading.
- Production database migration under this record.
- Unreviewed source authority promotion.

### Evidence assessment

A1 reports successful integration of the owner's B1–B5 read model for 11 holdings, with date/revision/quantity/cost guards. The 2026-10-28 observation distinguishes cash 327,420 VND, pending dividends 475,000 VND and accrued custody fee 420 VND. These are dated historical observations, not asserted balances as of 2026-10-31. Buying power, linked-bank availability, cash and pending dividends must not be added repeatedly to broker NAV. P/L uses the owner-selected imported cost basis and explicitly dated prices; it is not independently reconstructed lifetime total return.

FPT ordinary tradable shares and pending corporate-action shares remain distinct: the reviewed observation records 220 owned = 200 tradable + 20 pending bonus shares (`FPT_WFT`). A confirmed conversion may change availability, not create another 20 shares. Pending dividends become received cash only against supporting matched account-credit evidence, once; an accrued fee is not a paid fee without settlement evidence.

A1's original engineering failures are historical results, not current unresolved counts. A2 later reports 2,509 engineering tests passed with no unresolved engineering failures, 18 archival tests not executed/not counted as passes, 25 API tests, 34 retained-corpus tests, lint/typecheck/build passes, and migration/backup rehearsals. These are evidence-reported results, not tests rerun for this record and not independent acceptance of all financial balances.

A3/A4 approve the exact executable authority manifest with content hash `8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1`. That separate authorization remains valid in its original scope; it did not accept a market snapshot, accounting dataset, ranking or investment decision.

A2's pending two-migration blocker was subsequently closed by A5 under the owner's separate “vậy cập nhật db đi” authorization: A5 reports 21/21 migrations, preserved application rows and successful isolated restore validation. This record does not revoke that completed authorization, reopen that historical schema blocker or authorize any further production migration. No live DB status probe or migration was executed for this documentation task.

M1 subsequently reports 30 checked completed-close references for the 2026-10-30 session, 93 REST requests, and `PASS_COMPLETED_CLOSE_REFERENCE`, expressly limited to display/review. Provider adjustment basis remains undeclared. This is not a missing display-price integration issue, a live quote on 2026-10-31, or an accepted production NAV snapshot. A later dated reference does not rewrite A1's old price evidence.

### Outstanding Pipeline A gates

| Gate | Unresolved condition / restriction |
| --- | --- |
| Qualified market snapshot/session | Production-purpose price/session eligibility and snapshot acceptance are not established by M1's display/review close references. Keep session, observation time, adjustment basis and intended use explicit. |
| Source identity and provenance | Bounded B1 owner identity is resolved; do not reinstate an obligatory historical PDF chain. Production broker/source authority, account/instrument lineage and authenticity still require evidence for the intended snapshot. A hash alone cannot establish them. |
| Accounting reconciliation | Dated owner observations and imported basis do not establish independent historical ledger/settlement reconciliation. No automatic postings or balancing entries are permitted. |
| Corporate-action reconciliation | Preserve FPT pending/tradable distinction, exact conversion evidence and pending-dividend claim/receipt matching. Do not infer issuer, payment date or settlement from the pending total. |
| Release acceptance | Production E3/M7, historical point-in-time and release acceptance remain separate evidence-backed gates. Engineering success and personal read-model approval do not close them. |
| Migration authorization | The previously authorized two migrations are historical completed work (A5). Every further production migration needs separate explicit authorization; none is granted here. |

## 3. Pipeline B — VN30 Fundamental Data

**Decision: `APPROVED_FOR_RESEARCH_AND_VALIDATION_V1.0`.**

### Approved scope

- Fundamental data collection and financial statement reconciliation.
- Economic normalization and sector-specific valuation research.
- Conditional valuation scenarios.
- Scoring evidence preparation and scoring engine validation.

### Not authorized

- Production scoring dataset acceptance.
- Official VN30 ranking publication or official Top 10 investment recommendations.
- Automatic Buy/Sell recommendations based on unaccepted scoring data.
- Promotion of conditional valuation into accepted intrinsic value.

### Evidence assessment and numerical reconciliation

B1 points to the R4 review candidate, records `b6Acceptance=NOT_COMPLETE` and `productionScoringAuthorized=false`. Its manifest hash was verified against B6. All 122 entries in B6's artifact, builder and profile-capture pin groups matched the retained files (49 + 11 + 62). This establishes byte integrity of those entries, not source authenticity or financial acceptance.

The R4 index and all 30 issuer packets were inspected programmatically to cross-check B2/B3, including score rows and acceptance flags:

| Acceptance measure | Verified baseline value | Interpretation |
| --- | --- | --- |
| Distinct issuers | 30 | The retained review universe, not acceptance of all issuer facts. |
| Issuers with conditional valuation models | 2: VNM and ACB | Six scenarios in total; not six separate accepted models. |
| Accepted primary valuations | 0 | Conditional outputs have not become accepted intrinsic values. |
| Accepted total scores | 0 | No complete score is authorized for production. |
| Rubric instances not ready | 688 of 690 | 30 issuers × 23 rubrics. Two RG-UNC judgments are assessed; their 0/2 values are not total scores of zero. Missing weights are not redistributed. |
| Economic normalization | Incomplete / `PARTIAL` | Reported cash bridges are not automatically normalized common-owner FCFE. |
| BSR/GVR source conflicts | Unresolved | BSR common-profit arithmetic conflict; GVR fund-table/footnote mismatch. |
| Production scoring | Not authorized | Explicitly false in the reviewed records. |

**No discrepancy was found against the owner's specified acceptance figures.** R4 reports 58 cash bridges, 39 bank provision observations and 20 additional checked asset-acquisition values. Those quantities are research progress, not production admission counts.

B4 reports 70 focused tests, 13 normalization tests after assertion correction, 127 scoring regression tests and 43 API tests passed, with lint/typecheck passing. The 13 tests overlap focused coverage and must not be added as an independent unique-test total. B4 explicitly says the full repository suite was not run. These historical reports were inspected, not rerun, and are not financial sign-offs.

### Outstanding Pipeline B gates

- Complete issuer-specific recurring-profit normalization, employee/non-shareholder fund treatment, common-owner claims, maintenance/growth investment and working-capital bridges.
- Build sector-appropriate primary forecasts for the other 28 issuers; admit and cross-check the two conditional models before treating their outputs as accepted value.
- Reconcile current common shares, treasury shares, provisional rights and conversion/dilution claims against each model's price and equity basis.
- Resolve BSR/GVR source conflicts without rewriting source evidence or substituting zero for unknown values.
- Support the remaining 688 rubric instances with topic-specific evidence, rationale and counter-evidence; complete formal dataset, point-in-time and release acceptance before production scoring.

G1 permits owner-authorized ChatGPT self-review for this personal project, not fabricated independent human review. This record does not invent external sign-offs, bypass runtime acceptance contracts, or turn research-review permission into formal production dataset acceptance. Pipeline B normalization/scoring blockers are not Pipeline A broker settlement or pending-share gates, even where both use the term “corporate-action bridge.”

## 4. Capability decision matrix

The unversioned labels below summarize the two versioned decisions; they do not create additional permissions.

| Capability | Governance Decision |
| --- | --- |
| Portfolio read-only display | APPROVED_WITH_RESTRICTIONS |
| Portfolio reconciliation and validation | APPROVED_WITH_RESTRICTIONS |
| Fundamental research | APPROVED_FOR_RESEARCH_AND_VALIDATION |
| Economic normalization research | APPROVED_FOR_RESEARCH_AND_VALIDATION |
| Conditional valuation modeling | APPROVED_FOR_RESEARCH_AND_VALIDATION |
| Production NAV | NOT_APPROVED |
| Production scoring | NOT_APPROVED |
| Official VN30 ranking publication | NOT_APPROVED |
| Automated investment execution | NOT_APPROVED |
| Production migrations | NOT_APPROVED |

## 5. Mandatory governance rules

1. Source integrity does not imply source authenticity.
2. Technical validation does not imply financial acceptance.
3. Research data does not automatically qualify as production data.
4. Conditional valuation is not accepted intrinsic value.
5. Historical prices must not be presented as current prices. Display their actual session/date; no historical value may be relabeled as a live quote.
6. Approved authority configuration does not override dataset acceptance gates.
7. Pipeline A and Pipeline B have independent acceptance criteria. Approval or closure in one cannot satisfy the other's gates by analogy.
8. Approval does not extend automatically to future commits or changed evidence. In particular, this record's own subsequent documentation commit does not expand the evidence baseline.
9. Production activation requires separate explicit authorization, in addition to passing the applicable acceptance gates.
10. This record does not grant permission to publish NAV, ranking or investment decisions. This includes official Top 10 publication and automatic Buy/Sell outputs based on unaccepted scoring data.

## 6. Change control and compatibility with prior approvals

This record is additive. It does not replace, revoke or retroactively amend exact-manifest activation receipts, the completed migration authorization, dated source decisions, immutable evidence or personal AI review criteria. Their original scopes and limitations remain. In a proposed broader use, apply all applicable production restrictions; do not interpret this record as a waiver or a new executable receipt.

For a changed commit, evidence file, provider/source authority, account/instrument mapping, financial claim, model assumption, scoring input, methodology/weight, runtime configuration or intended use:

1. Identify the exact proposed commit and affected evidence hashes, lineage and pipeline.
2. Record differences against this evidence baseline, including which prior conclusions no longer apply.
3. Revalidate the affected financial/source/point-in-time/release gates and retain failures visibly.
4. Obtain a separate explicit owner decision bound to the new scope and exact reviewed evidence; create a new versioned governance record rather than editing this historical decision to extend it.
5. Obtain separate production activation, migration or publication authorization where applicable. Owner approval alone does not waive financial gates; passing gates alone does not grant activation permission.

This task changes documentation only. It grants no new functionality or production behavior, writes no portfolio/ledger transactions, changes no schema or environment, modifies no approved authority manifest/receipt, and changes no scoring methodology or weights. No trading, publication, production migration or next-milestone workflow is part of this task.

## 7. Evidence references and baseline integrity

All linked evidence below exists and matches its bytes at the evidence baseline commit. Hashes are SHA-256 of the referenced file, not owner signatures or proof of original publication/authenticity. Use the pinned baseline version if a live pointer or document later changes.

| ID | Evidence file | SHA-256 at baseline |
| --- | --- | --- |
| A1 | [evidence/2026-10-28-b1-b5-runtime-integration/REPORT.md](../evidence/2026-10-28-b1-b5-runtime-integration/REPORT.md) | `906dc77763f14973fa96f457d30ff12eafc2fdef4bf92acb949dff5f9a2da663` |
| A2 | [evidence/2026-10-29-b6-final-remediation/FINAL_STATUS.json](../evidence/2026-10-29-b6-final-remediation/FINAL_STATUS.json) | `ec5a3dc40a7b5e0fa7b556e19dc80c5114ab311821b07ebfd796c95d7c866461` |
| A3 | [evidence/2026-10-29-approved-authority-activation/REPORT.md](../evidence/2026-10-29-approved-authority-activation/REPORT.md) | `68b584676d837282643d00d8192c91e4622d96ddde17003a34133bdae1a84614` |
| A4 | [evidence/2026-10-29-approved-authority-activation/OWNER_APPROVAL_RECEIPT.json](../evidence/2026-10-29-approved-authority-activation/OWNER_APPROVAL_RECEIPT.json) | `1e25261c0e867613c2abfbc3c99c5ef03d299fb7f5702ef18883a93ded07c890` |
| A5 | [evidence/2026-10-29-live-account-migrations/REPORT.md](../evidence/2026-10-29-live-account-migrations/REPORT.md) | `b243c4c28b6831628f6057dd1c09644685daedff793713144c1f44287d738754` |
| M1 | [scoring-dataset-acceptance/2026-10-30/b6-economics-r3/market-review.json](../scoring-dataset-acceptance/2026-10-30/b6-economics-r3/market-review.json) | `cc3f91020d43176b261db14ea62837e0c1f1e4f26b1a9716cb85165076886832` |
| B1 | [scoring-dataset-acceptance/current-review.json](../scoring-dataset-acceptance/current-review.json) | `3938a612f2c047e92a2890160d9c40d61215759433e6223d56111a88e495253f` |
| B2 | [scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/RESULT.md](../scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/RESULT.md) | `17b541e69f800758efcfe880ce010f44ef5906269046c2fbb83d037d75b30997` |
| B3 | [scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/acceptance-review.json](../scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/acceptance-review.json) | `31b394508e77d5bf2a2bc79edbc39cc2a22dd2243ee531c961867e09d969a83c` |
| B4 | [scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/verification.json](../scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/verification.json) | `8c7f0835a0ff1eadd7d95822eeffddb3f87bf766e28cb4b68038d06f76a3bd96` |
| B5 | [scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/review-index.json](../scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/review-index.json) | `9051d9be52bbc69e4e266993072214353b1f01d706433801a5c682a96fe7d7aa` |
| B6 | [scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/artifact-manifest.json](../scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/artifact-manifest.json) | `b5bff30359c500dfa2b0a7c22efad16742b0463582a75f354a18f7005f3f3ff3` |
| G1 | [scoring-dataset-acceptance/2026-10-29/PERSONAL_AI_ACCEPTANCE.md](../scoring-dataset-acceptance/2026-10-29/PERSONAL_AI_ACCEPTANCE.md) | `a598d95557218ec2e5a6342c49218538c6b6fdaa24fccb023c73d8ad1b5552be` |

## 8. Record validation and final governance status

Documentation validation verified the baseline commit and inspected HEAD, all linked repository files, evidence-byte bindings, the R4 pointer/manifest and its 122 pin entries, all 30 issuer counts/score states, terminology and the capability exclusions. The initial tree was clean, and this record is the sole intended changed file. No conflicting or duplicate scoped re-approval was found. Historical migration completion, authority activation and AI-review permissions remain distinguished from production dataset/release acceptance.

No dedicated Markdown/documentation validator was found in the inspected repository scripts/configuration; targeted link, hash, required-content and Git diff checks are used instead. Runtime tests, build, migration, DB probes and production workflows are intentionally not executed for this documentation-only change. Historical test figures above remain attributed to their evidence files.

**Final governance status: `READY_FOR_OWNER_REVIEW`.**

Pipeline A is `APPROVED_WITH_RESTRICTIONS_V1.0`; Pipeline B is `APPROVED_FOR_RESEARCH_AND_VALIDATION_V1.0`. Production NAV, production scoring, official ranking/investment publication, automated execution and further production migrations are **NOT_APPROVED by this record**. B6 remains incomplete. Stop after recording, validating and committing this document; no next milestone is authorized.
