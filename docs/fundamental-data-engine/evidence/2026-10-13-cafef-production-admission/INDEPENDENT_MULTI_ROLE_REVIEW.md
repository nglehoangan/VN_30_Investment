# Independent multi-role review

Reviewer: separate review agent, 2026-10-14 (Asia/Ho_Chi_Minh). Reviewed the retained production input, canonical admission report, required-window admission matrix, source policy, hybrid loader/admission implementation and closure runner. No scoring, ranking, investment decisions or DI approval performed. This aggregate review incorporates three additional separate independent agents: accounting/source authority (INDEPENDENT_ACCOUNTING_REVIEW.md), QA/PIT (INDEPENDENT_QA_PIT_REVIEW.md), and architecture/governance (INDEPENDENT_ARCHITECTURE_GOVERNANCE_REVIEW.md). Their recommendations agree with the aggregate reviewer.

Verdict: **C. BLOCKED — MATERIAL DATA GAPS REMAIN**.

## Accounting and data integrity

**Critical:** CORE admits 250/750 required cells (33.3333333333%), against 95%; SECTOR_CORE admits 90/365 (24.6575342466%), against 95%. Sixteen required CORE cells are classified CONFLICT. Production admission must remain blocked. The canonical report has zero unresolved issuer-versus-issuer conflicts; that narrower statistic does not resolve the required-window provider conflicts.

Independent arithmetic checked 1,115 unique ticker/tier/group/window rows. CORE counts: DIRECT_STRUCTURED 0, SAFE_DERIVED 2, PDF_VERIFIED 248, ISSUER_VERIFIED 0, FALLBACK_REQUIRED 385, PROVIDER_ANOMALY 3, CONFLICT 16, UNAVAILABLE 96. SECTOR_CORE counts: DIRECT_STRUCTURED 0, SAFE_DERIVED 0, PDF_VERIFIED 90, ISSUER_VERIFIED 0, FALLBACK_REQUIRED 185, PROVIDER_ANOMALY 2, CONFLICT 0, UNAVAILABLE 88. Denominators include all four baseline annual windows FY2022–FY2025 and the H1 2026 current trajectory required window, including missing data. The final five-window denominator corrects an incomplete two-window coverage subset found during closure. The final report also uses existing evaluateHybridTarget scope semantics: prefer consolidated for the entire target, with standalone only when that target has no admitted consolidated facts. Independently counted 243 consolidated and seven standalone admitted CORE cells; all 90 admitted SECTOR_CORE cells are consolidated. The reviewer inspected that the runner calls the existing evaluator for scope selection. No unavailable rows, quarter substitutions or provider-dependent window choices were excluded in the final arithmetic.

Retained actual HPG FY2024 CFO zero resolves to issuer value 6608320655215, CapEx zero to 35495026797327. SSI FY2025 CFO zero resolves to -10425608767324, CapEx zero to 148182381457. These four facts are PDF_VERIFIED, with QUALIFIED_ISSUER_RESOLVES_PROVIDER_CONFLICT. VCB FY2025 NET_INCOME_ATTRIBUTABLE_PARENT is PDF_VERIFIED at 35177663000000 with the same conflict-resolution reason. These checks verify report behavior, not an additional visual reread of PDFs.

**Major:** Required current YTD, sector-critical issuer evidence and exact-record structured metadata certification are incomplete. All 30 symbols have at least one insufficient required cell. Pending selective VHM review must remain excluded.

## Architecture

The source policy correctly distinguishes CafeF primary structured ingestion from issuer/PDF accounting verification authority. Detail/Summary agreement is explicitly disallowed as independent verification. A certificate is required for DIRECT_STRUCTURED; retained input has zero certificates and canonical report has zero directly admitted structured facts. That fail-closed result is correct and must not be relaxed for coverage.

**Major:** The production loader still initializes certificates: []. No independently reviewed exact-record certificate evidence exists. The closure explicitly reports noncertification instead of manufacturing attestations; direct production coverage cannot be claimed. Future certificate admission needs retained content verification, exact concept/window/scope binding and independently reviewed evidence.

Code review observations were communicated and remediated during closure. Follow-up inspection confirmed zero classification now uses a guarded decimal parse; certificate reviewedAt is validated with instant; and certificateReference must have both a retained source binding whose SHA256 equals certificateHash and the canonical body hash. No real reviewed certificates were issued, so future direct admission remains evidence-dependent. Follow-up adversarial QA found malformed numeric matching against issuer verifications could throw; numericMatch now catches parse failures and preserves issuer authority, with a matching-issuer regression. The retained canonical certificate body/envelope format is documented and a positive synthetic fixture proves digest binding is satisfiable; it issues no real production certificate. The original complete migration prompt is unavailable in retained repository context; full historical phase completeness cannot be independently attested beyond the explicit current requirements.

## QA and point in time

Independent offline matrix recomputation exited 0. Canonical report contains 601 PDF_VERIFIED facts and two SAFE_DERIVED facts across all retained periods; these totals must not be confused with current required-window coverage. Seventy-one verification records are rejected. No canonical fact has a period end after the analysis cutoff.

**Major:** Historical publication/revision proof remains incomplete. The recorded historical replay intentionally admits no facts; it demonstrates exclusion under that cutoff, not full historical readiness. REGRESSION_VALIDATION.json records seventeen passing regression checks, including all requested cases, exact issuer replacements, malformed numeric quarantine, noncanonical lexical zero rejection, and invalid certificate timestamp rejection. The zero invariants are supported by the accompanying verifier results; the closure runner alone would not constitute that evidence.

INDEPENDENT_REPLAY.json records PASS for separate-process offline regeneration and retained-input domain replay, with 826 retained source bindings hash-checked, 22 artifact comparisons and seventeen regressions. This reviewer independently reran the offline verifier successfully under the supported runtime, but did not independently execute the complete application test suite; complete-suite command/exit evidence is finalized by the closure agent. The reviewer attempted `node scripts/verify-cafef-production-admission.mjs`: exit 1 because default Node v22.12.0 lacks node:module registerHooks; the project requires a newer pinned Node runtime. The reviewer then ran `/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/verify-cafef-production-admission.mjs`: exit 0, PASS, seventeen regressions and 826 bindings; 22 separately regenerated artifacts matched byte-for-byte. Passing tests and reproducible replay do not remove the quantified admission gaps.

## Governance

readyForScoring remains false; DI14 awaits independent review and DI15 awaits Project Owner approval. This review supplies independent findings but grants neither DI gate. No official VN30 scoring, Top 10, ranking or investment decisions were observed or requested by the reviewer. Closure reports preservation checks for 81 historical artifacts across three sealed packages and unchanged hashes for eight existing databases. The QA role independently compared all 48 temporarily overwritten historical PNGs to HEAD and confirmed exact restoration. This reviewer did not rewrite historical evidence.

There is no evidence-based basis for A or B. The observed gaps do not demonstrate rejection of the structured-first architecture, so D is also unsupported. C follows from the coverage shortfalls and remaining material required-window conflicts. Minor issues do not determine this verdict.


## Final suite and aggregate signoff

At-end review inspected the retained finalChecks commands/exit codes and the final full-suite log: 96 files and 1,159 tests passed, exit 0. The complete suite used `--testTimeout=40000` after an earlier 20-second backup-test timeout under concurrent browser activity; assertions were unchanged. Final lint, typecheck, boundaries, database validation, Webpack build, twelve browser checks, invalid configuration checks, Python corpus/extraction suites and offline verifier each exited 0. Earlier failures, diagnostics and remediation remain retained. This aggregate reviewer directly reran the offline verifier; broader-suite conclusions rely on retained execution logs.

All three separate role agents recommend C, and the aggregate reviewer concurs. Final open severity count is two Critical, five Major, zero Minor. All 30 symbols remain insufficient. Production data admission and read-model promotion remain blocked; no reserved DI gate is granted. Final verdict: **C. BLOCKED — MATERIAL DATA GAPS REMAIN**.
