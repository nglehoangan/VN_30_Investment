# Slice 04 implementation report — 2026-10-09

Authorization: user approved Slice 03 and requested Slice 04. Initial HEAD/baseline was `addaf5bbf06fe772822bbd557ec7110b477c4e55`, working tree clean. During implementation HEAD advanced externally to `0a3c67c80514685748a45993381bdc6db0bd6b9d` (Update Fundamental Data Engine Slice 4), containing the initial 18-file implementation. The agent issued no git commit, staging or push commands. Further hardening and this report are part of the final reviewed tree; compare against the initial baseline for the complete Slice 04 scope.

AGENTS.md, installed Next backend-for-frontend guide, approved fundamental design (especially Slice 04 and derivation/availability boundaries), existing registry/contracts/repositories, Slice 01–03 implementation reports, M3 metric definitions, sector normalization, existing calculateMetrics/Evidence, and isolated database/migration test patterns were reviewed. No Next route or UI was changed.

## Delivered behavior

Slice 04 prepares explicitly pinned canonical operands and delegates ROE, FCF, CASA and NPL arithmetic to **existing calculateMetrics**. It does not implement a competing formula catalogue. A small generic typing change permits calculateMetrics to consume the minimal arithmetic fields it actually reads, while preserving full Evidence types for existing scoring callers. Evidence availability checks and all formula bodies remain unchanged. The internal arithmetic projection contains no invented publishedAt, provider receipt or canonical availableAt; it is neither persisted as scoring Evidence nor offered as PIT-eligible input.

An immutable versioned sector/operand crosswalk pins registry hash, formula version, precision policy, source-document/code hashes, recording/effective dates and approval reference/status. The initial crosswalk is **PROPOSED**. It maps non-financial ROE to explicitly reviewed normalized common-attributable profit and average common equity; FCF uses issuer CFO and reconciled positive issuer capex. Bank ROE uses the common-profit/equity route. Bank CASA/NPL component mappings remain unresolved because the production registry has no approved canonical bank-component definitions. Insurance/securities routes remain unresolved rather than imposing generic industrial mandatory metrics. No readiness or DI policy is invented.

Production FORMAL derivation requires approved registry/crosswalk and existing exact registry/methodology binding. Crosswalk recording/effective dates must be known by calculation execution. Source mapping/registry/crosswalk approvals are external governance dependencies; Slice 04 approval does not self-approve those releases. Numeric synthetic CASA/NPL tests use an explicitly isolated test registry containing test-only bank components; these definitions are absent from the production manifest.

Every request names its security, sector, economic window, cycle context, ordered operand IDs and exact observation IDs. There is no querying for latest values or choosing a favorable revision. Facts must match security/scope/sector, exist exactly once in the supplied manifest and be ingested by execution. Each operand requires its explicit crosswalk item and operation; constituent source/mapping/calendar/accounting/scope/currency contexts must be comparable. Missing, conflicting, invalid, unresolved and incompatible inputs produce null/N_R with retained reasons and LOW calculation confidence, rather than imputation.

## Operand preparation and financial review

Supported operand primitives:

- REPORTED: one canonical fact covering the exact requested window.
- AVERAGE_ENDPOINTS: two STOCK/INSTANT common-equity endpoints, immediately before the economic start and at its end; exact add/divide under the declared decimal policy.
- TTM_QUARTERS: exactly four explicitly ordered, contiguous native three-month FLOW quarters, covering the requested twelve-month window with consistent fiscal sequence, source/mapping/calendar and item identity. No balance-sheet stock summation or duplicate/gapped constituents.
- QUARTER_FROM_YTD: later minus earlier explicitly ordered compatible YTD flows with a common fiscal start, consecutive fiscal quarters and explicitly supplied target dates. Revision kinds and correction evidence/knowledge must be compatible; changed mappings or incompatible vintages fail closed.
- HUMAN_NORMALIZED: an explicitly reviewed additive adjustment to a pinned fact, with retained amount, rationale, reviewer, evidence, review time and confidence. The engine invents no earnings adjustment.
- ACTION_ADJUSTED: an explicitly reviewed positive factor applied only to a per-share input, retaining original units and full adjustment evidence. No production EPS/action route is approved in this registry. Arithmetic preparation can be exercised synthetically; a per-share result cannot be relabeled as currency to calculate FCF/ROE/CASA/NPL.

The default proposed FCF crosswalk permits REPORTED operands; TTM/YTD alternatives require a separately versioned explicit crosswalk and approval for FORMAL use. The current calendar primitive supports native three-month quarters in a twelve-month fiscal year. Unresolved irregular/52–53-week calendars need separately governed support, not guessed dates.

Formula operands must share reporting scope, segment, accounting basis, fiscal calendar, units and currency. The four current wrappers require monetary VND components; USD is never relabeled or converted to VND. ROE uses reviewed common-attributable profit, not total NPAT. Zero/nonpositive denominators retain existing N/R behavior. An explicitly cyclical request without financial normalization retains the existing cycle-normalization N/R rule.

Independent fixtures reconcile ROE `(24 − 6) / ((100 + 140) / 2) = 0.15`, FCF `100 − 30 = 70`, CASA `30 / 200 = 0.15`, NPL `4 / 200 = 0.02`, four-quarter FCF `40 − 8 = 32`, and quarter-from-YTD FCF `(50 − 20) − (9 − 5) = 26`. Review confidence propagates by the weakest adjustment/validity contribution; N/R is LOW. This is calculation confidence, not an investment score or a production data-quality acceptance verdict. A future human review is rejected even when the route is unresolved.

## Immutable persistence and migration

One additive migration creates `fundamental_derivation` and `fundamental_derivation_input`. The artifact retains request, crosswalk and registry manifests/hashes, original canonical observation bodies/hashes, ordered constituent IDs, adjustment evidence, prepared operand values/reasons, formula identity, precision policy, execution time and result/null. Restrictive Security/observation/derivation foreign keys and update/delete/replace guards preserve old rows and input links. No existing table is altered or backfilled.

The application loads only the named observations. The repository independently reloads/replays them inside the append transaction, checks the complete result hash and atomically inserts the artifact plus ordered input links. Missing inputs, forged outputs and duplicate append fail without partial writes. Reads verify immutable body hash/indexed metadata, exact ordered link manifest, raw-backed observation integrity, registry/methodology binding and independent calculation replay; reopened databases reproduce the same result. Raw facts, revision chains, qualifications and old normalization assessments remain unchanged.

Migration checks upgrade a populated Slice 03 baseline containing prior canonical facts and a synthetic prior normalization storage row, compare all old table rows/DDL/guards unchanged, repeat deployment and check foreign keys/status. Earlier populated portfolio/fundamental migration regressions also run against the new latest schema. Schema validation and generation used an explicit harmless temporary DATABASE_URL and `--no-env-file`; operational migrations were executed only by owned temporary test fixtures.

## Verification

Required runtime: Node 22.23.2 and pnpm 10.34.5. No production/private database or environment file was accessed. The scoring/decision script test lists were executed directly with vitest after isolated client generation, avoiding their default database-generation wrappers that read .env.local.

- Focused derivation, populated migrations, registry and architecture: **9 files / 62 tests passed**.
- TypeScript `tsc --noEmit`, ESLint zero warnings, architecture boundary checks **127 modules**, Prisma validate/generate and git diff checks passed.
- Existing scoring/decision script test lists: **12 files / 345 tests passed**.
- Full final-code unit/integration/architecture regression: **58 files / 847 tests passed**.
- Token-session regression: **3 tests passed**.
- Final typecheck, lint, boundaries and diff checks passed after the full suite. This report was then updated with completed execution counts; no implementation/test/schema change followed that run.

Initial typecheck errors in callback annotations and confidence return inference were fixed before passing verification. All new arithmetic fixtures, immutable persistence/reopen, forged/missing input, FORMAL gate, N/R retention, SQL mutation/FK and legacy migration checks pass. No failing initial check is claimed as PASS.

## Exact implementation files

1. `src/domain/fundamentals/derivation.ts`
2. `src/application/fundamentals/derive.ts`
3. `src/ports/fundamentals.ts`
4. `src/domain/scoring/metrics.ts` — narrow generic arithmetic operand type; formulas unchanged.
5. `src/domain/scoring/evidence.ts` — available() accepts the fields it reads; logic unchanged.
6. `src/infrastructure/fundamentals/derivation-crosswalk-v1.json`
7. `src/infrastructure/fundamentals/derivation-crosswalk.ts`
8. `src/infrastructure/repositories/fundamental-derivation.ts`
9. `prisma/schema.prisma`
10. `prisma/migrations/202610090002_fundamental_derivation/migration.sql`
11. `tests/fixtures/database.ts`
12. `tests/fixtures/derivation.ts`
13. `tests/unit/fundamentals-derivation.test.ts`
14. `tests/integration/fundamentals-derivation.test.ts`
15. `tests/integration/fundamentals-derivation-migration.test.ts`
16. `tests/integration/fundamentals-migration.test.ts`
17. `tests/integration/fundamentals-normalization-migration.test.ts`
18. `tests/integration/registry.test.ts`
19. `docs/fundamental-data-engine/SLICE_4_IMPLEMENTATION_REPORT.md`

## Review boundaries

Technical self-review: the arithmetic wrapper preserves investment formulas, explicit ordered lineage, immutable predecessors and no latest-wins behavior; financial tests distinguish common profit, stock averaging, native-quarter sums, compatible YTD subtraction, currency and sector economics; Risk/QA negative controls block missing/invalid evidence, future review, tampering and production gate bypass. These implementation checks are not independent CIO/Data Architect/Financial Data Engineer/Risk sign-off.

Mapping, registry and derivation crosswalk are not self-approved. Real reviewed issuer data, banking definitions, complete sector requirements/coverage, reviewer authenticity, source access/retention/storage qualification and governed production release remain pending. A reviewer/evidence reference is a trusted local declaration, not cryptographic authentication. No live issuer derivation or private DB migration was performed.

No Slice 05 work: no availability evaluator, publication fallback, AS-KNOWN/AS-REVISED/latest selector, snapshot builder or snapshot content identity. Every derived artifact keeps availableAt null/UNKNOWN. No production scoring/ranking/Top 10, valuation engine, portfolio decision or investment recommendation was run. Existing scoring/decision test fixtures were executed solely as regression checks. DI1–DI15 statuses are unchanged; no DI gate becomes PASS from this implementation.

Recommendation after completed regression evidence: **READY FOR SLICE 04 IMPLEMENTATION REVIEW**, within the proposed-crosswalk/pinned-arithmetic scope above. Stop before Slice 05.

## Slice 04 conditional-review remediation — 2026-10-09

Previous external review: **CONDITIONAL APPROVAL**, Critical **0**, Major **1**, Minor **2**. Reviewed commit and remediation HEAD/baseline: `42f180c173149c48e39627822ca6ab53e227d85a`; working tree initially clean. Original feature baseline remains `addaf5bbf06fe772822bbd557ec7110b477c4e55`. HEAD matches the reviewed commit exactly, with no material divergence. The historical implementation and verification narrative above is preserved; it is not rewritten as an external PASS.

Re-audit covered AGENTS.md and the installed Next backend-for-frontend guide; DESIGN_REVIEW.md; Slice 01–04 reports; canonical registry, FinancialUnit and normalization/revision contracts; derivation crosswalk/domain/application/repository; M3 metric definitions and calculateMetrics; existing immutable derivation migration and unit/integration/migration tests. No investment formula, Next route/UI or production data was changed.

### Major: explicit immutable adjustment dimensions

ReviewedAdjustment now requires `amount`, `unit`, `currency`, `adjustmentKind`, reviewerReference, reviewedAt, evidenceReference, rationale and confidence (plus its existing id). Unit uses the **existing canonical FinancialUnit** type; there is no parallel unit or scale system. Every field is mandatory in the exact JSON schema. Missing unit/currency/classification, unsupported units, invalid currency or omitted/empty required review evidence rejects new admission. The metadata is retained directly inside the immutable request/artifact and protected by existing body hash, transaction replay and SQL mutation guards. Nothing is inherited from a base observation to fill an absent adjustment field.

HUMAN_NORMALIZED monetary earnings addition requires a CURRENCY base, CURRENCY adjustment and exactly matching explicit currency before any addition. VND + explicitly VND is eligible; VND + USD, CURRENCY + RATIO/SHARES/CURRENCY_PER_SHARE yield null/N_R with `MONETARY_ADJUSTMENT_DIMENSION_MISMATCH` and LOW confidence. MILLION_CURRENCY/BILLION_CURRENCY are not canonical adjustment units and are rejected. No FX or unit scaling is performed. The original fact and mismatched review declaration both remain visible in a retained N/R artifact.

ACTION_ADJUSTED separately requires `unit: RATIO`, `currency: null`, `adjustmentKind: CORPORATE_ACTION_FACTOR`, and a strictly positive amount. Existing per-share-only input restriction remains. Multiplication retains original CURRENCY_PER_SHARE unit and original currency. Monetary metadata cannot be passed as an action factor; factor classification cannot be passed as a monetary normalization. No monetary addition, FX relabeling or implicit factor dimension is permitted.

### Minor #1: bounded economic audit classification and sign semantics

HUMAN_NORMALIZED classification is exactly:

- NON_RECURRING_GAIN
- NON_RECURRING_LOSS
- ACCOUNTING_RECLASSIFICATION
- OTHER_REVIEWED

These labels are **audit metadata**, not financial justification or an investment rule. Evidence, rationale, reviewer, timestamp and confidence remain mandatory. The reviewed signed amount controls arithmetic. Removing a gain by `-6` gives `24 - 6 = 18`; adding back a reviewed expense by `+6` gives `24 + 6 = 30`. Reclassifying the same signed amount never flips its sign or changes its value. No gain/loss sign rule was invented.

### Minor #2: explicit ROE normalization requirement

M3 METRIC_DEFINITIONS.md §12.3 defines common-attributable profit / average common equity and states **“Use normalized NPAT for scoring.”** Existing METRICS.ROE names its numerator `normalized_common_profit`. The proposed crosswalk therefore intentionally continues to require NET_INCOME_ATTRIBUTABLE_COMMON → HUMAN_NORMALIZED for this route. A raw reported common-profit fact is not automatically asserted to be economically normalized.

No AS_REPORTED alternative was invented for this scoring-oriented route. Missing review/adjustment is rejected; substituting REPORTED under the current crosswalk returns N/R. The engine never injects amount 0, a reviewer, evidence or rationale to make ROE pass. A genuinely reviewed zero amount is not automatically prohibited by a new investment rule: it must be independently supplied with the same complete dimensions/classification/evidence and review controls. It is not a synthetic fallback generated by this remediation. The genuine test normalization removes a reviewed non-recurring gain by -6 VND, rather than using a zero workaround.

Crosswalk bytes/status, canonical registry, source mapping and methodology/formula files are unchanged. Crosswalk remains **PROPOSED**, as do registry and source mapping. Their frozen authority/code hashes still match. No release is self-approved.

### Backward compatibility and migration

**No schema or migration changes.** All additional metadata lives in existing immutable derivation JSON; restrictive FKs, immutable guards, atomic writes and ordered input links are unchanged. There is no production backfill or rewrite.

The reviewed contract has conditional implementation approval and no approved production acceptance in the available governance evidence. This is a clean contract correction: older adjusted bodies lacking explicit dimensions/classification fail closed on authoritative replay/admission, rather than fabricating their missing metadata. Tests retain a synthetic legacy body byte-for-byte and verify that both find/replay and append reject it. Its raw stored history is not deleted or reinterpreted. Existing unadjusted artifacts still replay through the unchanged null-adjustment schema. An independently reviewed new request can create a new immutable artifact; there is no automatic conversion of legacy review evidence.

### Tests and final-tree verification

Seven new focused unit tests cover independently declared VND dimensions and retained metadata; USD and unit mismatches/N_R; missing or malformed dimensions/classification/reviewer/evidence/rationale; explicit negative/positive signs independent of classification; mandatory ROE review with no zero fallback; action-factor/monetary separation and per-share restriction; and rejection of a non-monetary base. Existing action-factor coverage additionally verifies factor metadata and retained VND per-share units. Existing ROE and future-review fixtures now declare dimensions/classification explicitly.

Two added integration tests cover full monetary review persist/reopen/replay and retained USD-mismatch N/R without fact mutation, plus immutable legacy adjusted bodies and rejection of dimension guessing. Original missing/zero, conflicts, revision lineage, averaging, native-quarter TTM, YTD, unresolved bank/insurance/securities routes, temporal review, replay/tamper/FK/migration controls remain exercised.

Runtime: Node **22.23.2**, pnpm **10.34.5**. Owned isolated temporary databases only; no environment file or production/private database accessed. Schema unchanged, so Prisma validate/generate is not repeated solely for this metadata correction. Existing migration tests run in focused/full suites, including populated prior-baseline preservation and repeat deployment. Scoring/decision test lists run directly after existing generated-client validation, avoiding wrappers that read .env.local.

Acceptance evidence below is verified by repeating the complete commands against the finished report/code/test tree before handoff:

- Focused Slice 01–04 fundamentals, derivation, populated migrations, registry and architecture: **19 files / 132 tests passed**.
- Existing scoring/decision regression: **12 files / 345 tests passed**.
- Complete unit/integration/architecture: **59 files / 856 tests passed**.
- Token-session: **3 tests passed**.
- Static checks: TypeScript `tsc --noEmit`, ESLint zero warnings, architecture boundaries (**127 modules**) and `git diff --check` passed.

No implementation/test/schema changes will follow the final acceptance run. A changed-file SHA-256 manifest is captured before that run and checked afterward to prove final-tree stability. No reliance on a pre-final-patch full suite plus focused follow-up is used for final acceptance.

### Exact remediation files

1. `src/domain/fundamentals/derivation.ts`
2. `tests/fixtures/reviewed-adjustment.ts` (new)
3. `tests/unit/fundamentals-adjustment.test.ts` (new)
4. `tests/unit/fundamentals-derivation.test.ts`
5. `tests/integration/fundamentals-derivation.test.ts`
6. `docs/fundamental-data-engine/SLICE_4_IMPLEMENTATION_REPORT.md`

### Four-role self-review

These are independently reasoned implementation perspectives, not independent external reviewer sign-off or DI14 acceptance.

| Role | Score / 10 | Assessment |
|---|---:|---|
| CIO | 9.8 | No adjustment is justified merely because it improves ROE; metadata makes declared economics auditable; no investment action is generated. |
| Data Architect | 9.6 | Explicit dimensions/classification are immutable and hash/replay protected; missing metadata never inherits from a fact; no latest-wins/PIT selector; legacy ambiguity remains truthfully blocked. |
| Financial Data Engineer | 9.6 | Monetary unit/currency compatibility is checked before addition; sign is exactly reviewed; no FX/scale guess; corporate-action factors are distinct and retain per-share dimensions. |
| Risk/QA | 9.6 | Missing/malformed dimensions and kind reject; mismatches produce N/R; mandatory ROE review cannot be satisfied by injected zero; final-tree checks and unchanged governance are verified. |
| Overall, equal-weight mean | 9.65 | Ready for independent Slice 04 final implementation review after completed final acceptance. |

Remaining in-scope self-review findings: **Critical 0 / Major 0 / Minor 0**. Reviewer/evidence declarations still require operational authenticity and independent financial judgment; their presence does not prove an adjustment is economically justified. Production approval, real-source data qualification/coverage, approved bank components, complete sector requirements and governed PIT/availability remain open dependencies. Legacy adjusted artifacts with unknown dimensions intentionally do not gain new replay eligibility.

**DI1–DI15: no status changes; no gate promoted to PASS.** Engine implemented ≠ production data approved ≠ PIT ready ≠ scoring ready ≠ DI PASS. No Slice 05, availableAt derivation, publication fallback, AS-KNOWN/AS-REVISED/latest selector, snapshot/content snapshot identity, readiness/DI acceptance engine, live VN30 scoring/ranking/Top 10, valuation, portfolio decision or DCA recommendation was implemented/run. availableAt stays null/UNKNOWN; reviewedAt is not availability. Existing scoring/decision fixtures run only as regression tests. No production/private DB, self-approval, commit or push occurred.

Recommendation after final acceptance: **READY FOR SLICE 04 FINAL REVIEW**. Stop before Slice 05.
