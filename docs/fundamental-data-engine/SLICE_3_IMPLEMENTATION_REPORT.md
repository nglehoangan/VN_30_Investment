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
