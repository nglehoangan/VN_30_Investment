# Slice 03 implementation report

Date: 2026-10-09. Baseline: `4dcaec468c1dfe15512d785fa76c73becd4e3c9c`, initially clean. Authorization: user approved Slice 02 and requested Slice 03. Result: ready for Slice 03 implementation review; this is not source acceptance, release approval, or a DI PASS.

## Delivered behavior

Slice 03 adds a reviewed statement import and normalization engine. It accepts an explicit reviewed JSON transcription tied to a freshly qualified retained PDF: document ID, raw body hash, qualification ID, reviewer reference, review time, and page evidence. It does not extract tables from PDFs or perform OCR. Tests use synthetic documents; no actual issuer financial facts were accepted in this slice.

`parseReviewedStatement` validates a bounded, exact JSON schema. `loadStatementMapping` validates and hashes an explicit mapping against the registry. `NormalizeFundamentals.run` obtains a qualified candidate, normalizes the extract, loads comparable observations, evaluates conflicts, rechecks qualification, and appends through the normalization repository. Composition requires the existing qualification gate, an explicitly bound registry and repository, and normalization tools. No production CLI, UI, or automatic scheduler was added.

Rows retain the original lexical cell, actual source caption, reviewed field label, and definition, unit and period page locators. JSON numeric cells are rejected. Declared Vietnamese/English/canonical formats control lexical parsing; there is no locale guessing. Exact decimal arithmetic scales millions of VND and converts declared percentages to fractions. Zero remains zero; null and explicitly declared missing tokens remain missing. Malformed grouping, exponents, unsupported units, overflow and precision loss are rejected. Missing-token policies cannot conceal numeric values.

Currency, reporting scope, sector applicability and periods are checked explicitly. There is no FX conversion, minority adjustment, TTM construction, or inferred sign. The proposed capex policy only negates a nonpositive reported outflow; a positive input fails its policy. Stocks require an instant at the qualified report end. A YTD-qualified document may contain a separately evidenced native quarter column inside its covered period; quarter and YTD observations retain separate identities. No YTD subtraction derives a quarter. Publication time, provider receipt and available-at remain unknown; this slice supplies no point-in-time eligibility or latest-value selector.

## Mapping and release boundaries

The FPT reviewed-import mapping has five proposed fields: revenue, total net income, total assets, operating cash flow and issuer capex. All use explicit million-VND units and Vietnamese lexical formatting. Reviewed field labels are import schema labels, not a verified FPT PDF caption or statutory code contract. A real import still requires independent review of source captions, definitions, units, consolidated/separate scope, sector and calendar evidence, particularly total NPAT and capex semantics.

Mapping status remains **PROPOSED**, SHA-256 `8a90b38a924f4d0c9171847f9314445afaff3933509b75871a798bcc86f1324f`. The eight-item canonical registry remains **PROPOSED**, SHA-256 `80804db9834eef4ce6f3e56b844e2a1bcccd6ce5cfae801c8c7e50cd1210970e`. Slice approval has not rewritten either release. FORMAL normalization requires approved mapping/registry and the existing exact registry/methodology binding. Percent arithmetic is tested independently; no banking ratio item or issuer ratio mapping was invented.

Manifest hashes cover exact serialized validated JSON, not original uploaded JSON whitespace. The original issuer PDF retains the Slice 02 byte hash. Observation provenance includes document, qualification, extraction, mapping, normalization run, definition and unit/period evidence references.

## Validation, conflicts and persistence

Assessments are VALIDATED, PARTIAL or BLOCKED and retain reviewed inputs, proposed observations, findings and hashes of compared historical observations. Missing mapped cells produce explicit null/MISSING observations. Unknown fields, inconsistent labels, currency/scope/period violations and conflicting values block publication. Wrong units or invalid numeric cells retain INVALID null proposals.

Comparability includes security, canonical item, reporting scope, segment, accounting basis, complete period/calendar identity, normalized unit/currency and observation scope. Competing unequal numeric values create blocking conflicts; equivalent receipts do not. Existing facts are never overwritten or selected by recency/favorability. Mapping changes on an already captured statement require explicit revision handling and are blocked here. No arbitrary magnitude threshold substitutes for an approved methodology rule.

One additive `fundamental_normalization` table stores immutable assessments with restrictive foreign keys, bounded valid JSON, status/hash constraints and update/delete/replace guards. No existing table is altered or backfilled. Assessment and eligible observations are written in one transaction. BLOCKED assessments publish **zero observations** while retaining all proposals and evidence. PARTIAL assessments preserve missing/null observations. Duplicate-capture or stale-context failures roll back the entire append.

The repository independently recomputes the assessment inside the transaction and rejects forged outputs or changed comparison context. Reads verify hashes, indexed metadata, archived qualification bindings, compared observations and replayed results. Historical audit reads after qualification revocation do not renew current eligibility; a new normalization still requires the current qualification gate.

## Verification

Runtime: Node 22.23.2; repository package manager pnpm 10.34.5. Prisma validate and client generation passed using an explicitly owned temporary database URL and `--no-env-file`. No production/private database or environment file was used.

- Full unit/integration/architecture regression: **54 files, 823 tests passed**.
- Final focused regression after the native-quarter coverage change: **12 files, 92 tests passed**, covering normalization, qualification, ingest, repository, registry, both migration paths and architecture.
- Existing token-session tests: **3 passed**.
- TypeScript `tsc --noEmit`, ESLint with zero warnings, architecture boundary check (**123 source modules**) and `git diff --check`: passed.

An initial implicit-any typecheck error in missing-token validation was corrected before passing validation. The full suite preceded the final native-quarter test/change; the final focused suite and static checks validate that change. No additional full-suite rerun was required after those checks.

Migration tests deploy and repeat migrations against owned isolated databases. The new migration is exercised over a populated Slice 02 baseline with all prior table rows and DDL compared unchanged. The existing earlier-baseline migration regression also verifies preservation of populated portfolio data. Foreign key, status, immutability, forged-body, transaction rollback, missing-data, conflict and qualification-revocation cases pass. No production migration was performed; any future production deployment still needs its normal backup/recovery procedure.

## Changed implementation

- Domain: `src/domain/fundamentals/normalization.ts`; qualified-input comment in `document-qualification.ts`.
- Application/ports: `src/application/fundamentals/normalize.ts`; `src/ports/fundamentals.ts`.
- Infrastructure: `reviewed-statement.ts`, `fpt-reviewed-mapping-v1.json`, `repositories/fundamental-normalization.ts`; existing fundamentals repository now supports a shared transaction client.
- Storage: Prisma schema relations/new model; `202610090001_fundamental_normalization` additive migration.
- Verification: normalization fixtures, unit/integration/migration tests; existing database fixture, registry inventory and fundamentals migration expectations updated.

## Remaining boundaries

Real source access/retention qualification and historical coverage remain the Slice 02 review matters; this work does not close them. Production mapping approval, exact registry/methodology approval/binding, independent review of actual report evidence and wider issuer coverage remain pending. This slice neither automates real PDF transcription nor claims all VN30 sources are ingestible.

No production facts, derived metrics, snapshots, scoring, rankings, Top 10 selection, portfolio behavior, DI 1–15 PASS, or Slice 04 work was introduced. Changes remain uncommitted for review. Slice 03 implementation is ready for review within the reviewed-import scope described above.

## Slice 03 conditional-review remediation — 2026-10-09

Previous external review: **CONDITIONAL APPROVAL**, Critical **0**, Major **1**, Minor **3**, reviewed commit `42315509cbdeb0e7b970eb54e46df2cf5eaa7638`. Remediation HEAD and baseline are exactly that commit; working tree was clean. There is no material baseline divergence. The original implementation/verification narrative above is preserved as historical evidence, including its pre-final-patch full regression limitation. This section supersedes its statement that explicit mapping revision handling is unavailable.

Re-audit covered AGENTS.md and the installed Next backend-for-frontend guide; DESIGN_REVIEW.md (including revision taxonomy and Slice 03 boundaries); Slice 01–03 implementation reports; canonical contracts/validation/registry; document qualification and reviewed extraction contracts; FPT mapping; normalization application and repositories; Prisma schema and fundamental migrations; Slice 01–03 fixtures/tests; M7 DATA_VALIDATION/HISTORICAL_VALIDATION_PLAN publication and revision controls; and M8 DATA_INITIALIZATION DI1–DI15 requirements. No Next route/UI, investment logic, source register or approval manifest changes were needed.

### Major remediation: immutable explicit revision lineage

Reviewed rows may now contain `revision`: kind, recordVersion, immediate predecessorId, evidenceReference, reason, knownAt, optional independently evidenced issuer publication, and predecessorMappingHash for mapping corrections. The taxonomy is exactly **ORIGINAL / ISSUER_RESTATEMENT / PROVIDER_CORRECTION / MAPPING_CORRECTION**. No competing taxonomy or latest-value selector was added.

New normalization requires explicit reviewed semantics. Missing revision evidence produces `REVISION_SEMANTICS_UNRESOLVED`, a BLOCKED assessment and no admitted observation; it is never inferred from first ingestion. Explicit ORIGINAL needs an evidence reference and cannot claim a predecessor, correction reason/time, mapping predecessor or restatement publication. Its original-evidence reference stays in immutable extraction and transformation provenance.

A revision must identify an existing economically comparable predecessor using all existing dimensions: observation scope, security, canonical item, reporting scope, segment, accounting basis, full period/fiscal calendar, unit and currency. It cannot supersede itself or an incompatible item/window/currency/scope. The complete predecessor chain is traversed, checked for missing links, incompatible identities and cycles, and retained in `ancestorReferences`. New observation IDs remain deterministic from explicit normalization run and row identities; replay does not regenerate identities from current time.

Issuer restatement additionally requires its own qualified document body and explicit VERIFIED disclosure evidence distinct from the predecessor's disclosure. Provider/local mapping corrections inherit predecessor issuer publication rather than creating issuer restatement facts. MAPPING_CORRECTION requires a changed mapping version/hash and verifies the supplied prior hash against predecessor provenance. Both mapping manifests/hashes remain retained through their immutable assessments. Production mapping/registry approval gates remain unchanged.

Only validated ancestors of a new revision are exempt from unequal-value conflict checks. Unexplained unequal competitors and unrelated branches remain CONFLICTING/BLOCKED. No earlier observation is updated, deleted or retroactively reinterpreted. Corrected values do not automatically become selected scoring inputs.

The application first creates comparison candidates, then validates lineage with loaded history. This provisional comparison pass is not an admission decision. The repository independently recomputes authoritative lineage in the append transaction; a provisional or forged result cannot be persisted. Fundamental observation append/read checks also enforce full comparable identity, chronology and immutable predecessor traversal. Hash-valid direct storage corruption is not accepted as a validated normalization result.

New artifacts carry `revisionPolicyVersion: explicit-lineage-v1`. Previously persisted artifacts without that marker retain their original replay policy for **audit reads only**. Newly appending an artifact without the marker is rejected. Historical ORIGINAL labels are not rewritten or newly asserted to be independently evidenced; their evidence remains as originally recorded. Existing raw documents, qualification history, extraction bodies, observations and assessment bodies are untouched.

### Minor remediation and temporal safety

**Minor #1:** `NormalizationAssessment.recordedAt` is documented as the execution/recording timestamp only. The injected clock still controls execution deterministically. It is distinct from period end, report/signing date, issuer publication, provider receipt, local retrieval and revision evidence knowledge time. Revision `knownAt` must be no earlier than predecessor ingestion and no later than reviewed extraction/execution. Genuine issuer publication must be separately evidenced, supported by receipt chronology and no later than correction knowledge. A future local execution clock does not populate publication, report date, provider receipt or availability. No clock is used as publication fallback.

**Minor #2:** proposed FPT mapping and canonical registry remain unchanged/unapproved, with their original hashes above. FORMAL still requires approved manifests and exact methodology binding. All newly created financial observations in tests are isolated SYNTHETIC_TEST fixtures. **Normalization engine implemented ≠ mapping approved ≠ production fundamentals accepted ≠ DI PASS.**

**Minor #3:** final acceptance uses the complete unit/integration/architecture suite after all remediation code/test/report changes, in addition to the focused Slice 01–03 regression. The earlier historical 823-test run plus focused follow-up is not reused as remediation acceptance evidence.

`availableAt` remains null/UNKNOWN for every revision. No availability evaluator, publication fallback, AS-KNOWN/AS-REVISED selector, snapshot or investment action is implemented. Issuer evidence, correction knowledge and local execution remain separately retained for later governed PIT work.

### Added tests and exact changed files

Seven new unit tests cover unknown/original semantics; explicit 100-million versus 110-million unexplained conflict; provider correction; issuer restatement disclosure; changed mapping/hash lineage; invalid predecessor/security/item/scope/period/accounting/currency/self-reference/evidence/future knowledge/cycles; A→B→C replay and unrelated competing branch; and controlled future local clock without publication/availability leakage. Two added integration tests cover persistent issuer→provider→same-capture mapping correction, predecessor immutability and reopen/replay, plus legacy artifact audit replay and rejection of new legacy admission. Existing Slice 03 fixture rows now explicitly declare synthetic ORIGINAL review evidence; synthetic PDF bodies differ by fixture identity so restatement document lineage is independently exercised.

Exact remediation files:

1. `src/domain/fundamentals/normalization.ts`
2. `src/application/fundamentals/normalize.ts`
3. `src/infrastructure/repositories/fundamental-normalization.ts`
4. `src/infrastructure/repositories/fundamentals.ts`
5. `tests/fixtures/normalization.ts`
6. `tests/unit/fundamentals-revisions.test.ts` (new)
7. `tests/integration/fundamentals-normalization.test.ts`
8. `docs/fundamental-data-engine/SLICE_3_IMPLEMENTATION_REPORT.md`

**Schema/migration changes: none.** Existing immutable observation/normalization JSON bodies, predecessor FK and guards are sufficient. No backfill fabricates ORIGINAL semantics. Existing populated-baseline migrations and preservation regressions are included in focused/full checks.

### Final verification

Node **22.23.2**, pnpm **10.34.5**; controlled transports and owned isolated temporary databases only. No environment file or production/private database was read. Prisma schema/generation was unchanged by remediation; no new Prisma generation or migration deployment outside isolated tests is required.

- Focused Slice 01–03 fundamentals, registry and architecture: **15 files / 109 tests passed**.
- Complete final-tree unit/integration/architecture: **55 files / 833 tests passed**.
- Existing token-session regression: **3 tests passed**.
- TypeScript `tsc --noEmit`, ESLint zero warnings, boundary checks (**123 modules**) and `git diff --check`: passed.
- Existing isolated migration tests preserve prior populated portfolio/fundamental tables; no schema changes or production migration.

Initial new restatement tests failed because the synthetic publication timestamp was later than retrieval; fixture chronology was corrected without weakening validation. Typecheck caught an optional-property delete in the test helper and an accidental variable-reference substitution in repository code; both were corrected. These initial failures are not counted as PASS.

### Four-role self-review and remaining limits

These are separately reasoned implementation self-reviews, not independent owner/CIO sign-off or DI14 acceptance.

| Role | Score / 10 | Assessment |
|---|---:|---|
| CIO | 9.8 | Corrections cause no scoring, valuation or BUY/SELL action; historical investment evidence remains unchanged/reconstructable. |
| Data Architect | 9.6 | Immediate predecessor and full immutable chain, deterministic explicit identities, no overwrite/cycle/latest-wins; mapping/registry/raw/qualification evidence survives; historical audit replay does not approve old inferred semantics. |
| Financial Data Engineer | 9.6 | Issuer restatement, provider correction and mapping correction stay distinct; comparable economic identity is enforced; YTD/native quarter/stock/flow and exact lexical conversion remain covered. |
| Risk/QA | 9.6 | Unexplained differences still block; invalid lineage and future correction knowledge fail closed; controlled-clock regression prevents publication/availability substitution; no production DB or DI promotion. |
| Overall, equal-weight mean | 9.65 | Ready for independent Slice 03 final implementation review within reviewed-import scope. |

Remaining in-scope findings from self-review: **Critical 0 / Major 0 / blocking Minor 0 / Minor 0**. Real independently reviewed disclosures, authenticity/retention/access/storage qualification, production approval, broad VN30 coverage and future governed availability/selection remain explicit operational or later-slice dependencies, not claims closed by synthetic tests. Evidence references are reviewed declarations in the trusted local workflow, not cryptographic authentication of an issuer or reviewer. Existing captured-cell uniqueness remains: provider corrections should retain a distinct capture; mapping corrections of the same capture require a distinct mapping version. This remediation does not create a generic reprocessing/version scheduler.

**DI1–DI15: no status changes and no gate promoted to PASS.** Technical lineage readiness improved; DI5/6 operational fundamentals/normalization, DI11 PIT, DI14 independent review and DI15 closure still require their own evidence. No slices beyond Slice 03 were implemented: no derived ratios/growth/TTM/YTD subtraction, snapshots, PIT/AS-KNOWN/latest selector, readiness engine, scoring/ranking/Top 10, valuation, portfolio decision or investment recommendation. `availableAt` was not derived. No production/private DB, live financial ingest, commit or push occurred. Mapping/registry were not self-approved.

Recommendation after successful final verification: **READY FOR SLICE 03 FINAL REVIEW**. Stop here; Slice 04 is not authorized by this remediation.
