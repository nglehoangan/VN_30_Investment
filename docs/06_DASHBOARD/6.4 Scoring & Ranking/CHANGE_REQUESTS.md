# M6.4 prerequisite Change Requests

Date: 2026-09-17. Remediation status: **CR-M64-01 / CR-M64-02 = IMPLEMENTED_FOR_TEST, PRODUCTION_APPROVAL_PENDING**. See [METHODOLOGY_CLARIFICATION.md](METHODOLOGY_CLARIFICATION.md) and [M6_4_2_REMEDIATION_REPORT.md](M6_4_2_REMEDIATION_REPORT.md). The historical findings below explain the original stop. No old baseline text was changed and no production approval is claimed.

These requests follow the task's explicit instruction to stop affected capabilities when an approved rule is missing or contradictory. They do not supersede M3. Qualitative assessment is expressly permitted by M3; the request is not to replace it with mechanical ratio scoring.

## CR-M64-01 — Missing bounded point rubrics

Severity: Major. Affects complete score construction, golden score fixtures, and all ranking that depends on those scorecards.

Owning documents:

- `docs/03 SCORING/SCORING_ENGINE.md` §5.3 requires a defined rubric for qualitative points; §6 requires a point rubric; §21 requires evidence-to-rubric-to-score traceability.
- `docs/03 SCORING/METRIC_DEFINITIONS.md` §3.5 explicitly says listed metrics are evidence for a bounded subcategory assessment, not additive points.
- The same document §4.3 provides CFO/NPAT evidence signals, FCF alternatives, a qualitative penalty trigger, and bank/property substitutions. It does not specify which evidence assessment earns each point or bounded point range of Earnings Quality /6.
- §4.4 provides concentration context, pricing-power evidence, and a maximum-score prerequisite, but no intermediate point rubric for Business Model Resilience /5.
- `docs/01 SYSTEM/SCORING_MODEL_v1.0.md` §§5.3–5.4 supplies evaluation principles and sector notes, but no missing point/range mapping. Its §5.1 does supply a bounded economic-quality rubric; that is not a rubric for these separate subcategories.
- `docs/03 SCORING/SCORECARD_TEMPLATE.md` §§7.3–7.4 requires recording scores and evidence, but does not define the absent rubrics.

Concrete synthetic counterexample: cumulative CFO = 120, normalized NPAT = 100, both in the same monetary unit and comparable periods. The ratio is 1.2 (120%), which is a Strong evidence signal under BQ-CASH-01. That signal does not establish whether Earnings Quality earns 4, 5, or 6 points. The rule expressly requires working-capital context and says a retailer exceeding 100% is not automatically exceptional. Mapping Strong to 6, linearly scaling the ratio, or accepting an arbitrary score without an approved rubric would invent policy.

Safe stop: no complete official scorecard or synthetic 100-point golden result is issued. No default points, weight redistribution, free-form scoring formula, or AI-generated point assignment is introduced. No existing issuer evidence is being rejected; this repository has no M6.4 engine yet.

Requested resolution: approve bounded analyst-assessment rubrics for these subcategories, including sector-equivalent evidence and any within-band choice requirements. Alternatively, identify the already-approved owning document containing those rubrics. The analyst's evidence-backed assessment can be a versioned input; it need not be inferred automatically from raw financial ratios. Supply worked synthetic cases for the chosen rubric. Review the other subcategories for the same completeness requirement before registering a production methodology.

Acceptance evidence: at least two non-maximum assessments and one maximum assessment per affected rubric, missing-evidence cases, bank/property substitution cases, and reproducible evidence → assessment → points → total examples. No return forecasts, real company values, or replacement rubrics are proposed here.

## CR-M64-02 — Tie-cluster partition and band-boundary semantics

Severity: Major. Affects official ordered ranking and Top 10 when ambiguous near-ties occur.

Owning documents:

- `docs/03 SCORING/RANKING_RULES_v1.0.md` §§8–10: bands matter; 1–2-point differences are economically indistinguishable by default; a cluster contains scores within 2 points whose bands overlap economically.
- §22: sort primarily by total, build tie clusters, then apply secondary criteria.
- §33: immutable security ID may order otherwise equal entries, without economic meaning.
- `docs/03 SCORING/VALIDATION_CASES_v1.0.md` VC-100 covers 82 versus 83, but does not settle an overlapping chain or a band boundary.

Concrete synthetic ambiguity: 84, 82, and 80. Adjacent differences are 2, but the endpoints differ by 4. A connected cluster puts all three together; a highest-score-anchored cluster separates 80; alternative pair selection separates 84. At 82/81 there is also a score-band boundary. These choices can change which eligible name reaches position 10 after secondary comparisons. Stable security-ID order only addresses fully equal tie-breaks; it does not define cluster membership.

Safe stop: do not publish an official ranking/Top 10 by choosing a clustering algorithm or taking the first ten from a score sort. This does not prohibit later implementation of unambiguous eligibility checks or a research-only display.

Requested resolution: specify cluster construction, treatment across adjacent score bands, and cluster behavior at the tenth-place cutoff. Explicitly distinguish deterministic display order from an economic preference. No algorithm is selected in this request.

Acceptance evidence: 84/82/80, 83/82/81, 82/81, equal scores and equal secondary criteria, shuffled input order, and a tie spanning positions 9–12. Pin the approved semantics in the ranking methodology identity.

## Integration observation — not a policy Change Request

M3 Ranking Rules §§18 and 32 expressly allow exposure-only ranking when cost basis alone is unavailable and quantity/cash are valid; VC-052 and VC-121 confirm this. `PortfolioEngine.snapshot()` currently exposes a conservative aggregate block, and `reconcilePortfolio()` blocks on missing cost evidence. M6.4 must consume an application-level, field-scoped integrity result without changing ledger truth or simply ignoring the aggregate block. The existing detailed reconstruction/reconciliation result is the starting point. This is implementation work under an already-defined rule, not permission to invent accounting or a reason to change M6.3 policy.
