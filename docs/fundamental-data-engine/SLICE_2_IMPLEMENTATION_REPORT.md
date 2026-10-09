# Slice 02 — FPT raw-document collector

Implemented 2026-10-09 under the owner's approval of Slice 01, repeated Slice 02 implementation request and selection of public issuer websites. This implements the first issuer adapter and raw capture/import path. Full provider qualification, complete historical coverage, access/retention verification and real-source acceptance remain pending. No licensed API, entitlement or source terms approval is fabricated.

## Scope and contract

- `src/infrastructure/fundamentals/fpt.ts`: FPT-only static discovery and reviewed PDF seed links, sequential bounded HTTP and raw capture envelopes.
- `src/application/fundamentals/ingest.ts`: appends a source version and one atomic batch/capture manifest through the existing repository; never appends canonical financial observations.
- `src/ports/fundamentals.ts`: injected document collector port. Selection is independent of portfolio holdings. This first adapter does not attempt other issuers from `issuer-sources.json`.
- `scripts/collect-fpt.mjs`: explicit manual collector with private output files and an offline fixture mode. No environment-file loading, database connection, cron job, UI or scoring changes.

The documented discovery root is `https://fpt.com/vi/nha-dau-tu`. Only HTTPS on the exact `fpt.com` origin is permitted. Report paths must be `/api/media/<filename>.pdf`; query strings, credentials, fragments, other hosts, alternate ports and redirect following are rejected. Financial links are identified by BCTC or financial-report wording in the URL. Annual reports and financial-report links hidden in JavaScript may be missed; a reviewed explicit seed can be supplied. Discovery is not proof of issuer/period/scope identity of every file; downstream acceptance must inspect the document.

Defaults: 20 documents, 32 MB per HTTP body, 15-second timeout per attempt, two attempts and at least one second between requests. Hard ceilings are 100 documents, 64 MB per body, 60-second timeout and three attempts. Only transport errors, timeout, HTTP 429 and HTTP 5xx are retried. Redirects require review. Every attempted request, including failures and retry successes, generates immutable captures. A no-document run is `FAILED`; successful document collection remains `PARTIAL` because static archive/dynamic coverage is unverified. Earlier failed attempts remain in batch errors even after recovery. No `COMPLETE` or DI PASS is asserted.

## Raw preservation

Existing Slice 01 schema and repository are reused without migrations. The existing 4,000,000-character capture payload bound remains unchanged. Binary bodies are split into 1,000,000-byte chunks and stored as base64 in `raw-document-envelope-v1` JSON envelopes; HTML is preserved as bytes through the same envelope. Each envelope records URL, attempt, actual nullable HTTP status, content type, safe error code, chunk index/count, retained byte length, whole retained-body SHA-256 and bytes. Each capture also hashes its serialized envelope. Capture timestamps are actual controlled retrieval times; batch timestamps come from the injected clock. No publication date or financial value is inferred.

For errors, `FundamentalRawCapture.responseStatus = 599` is a **local failure sentinel**, not a claimed HTTP response from FPT. The actual HTTP status, or null for transport failure, is inside the envelope. This also prevents the existing observation repository from accepting failed retrievals as successful source evidence. Failed bodies may contain only the retained prefix; `bodyComplete` is false. For successful captures, decode base64 and concatenate chunks in index order within the same URL/attempt; verify count, byte length, body SHA-256 and capture payload hashes before use. Raw envelopes are not structured financial observations and must not be fed directly to normalization.

## Manual execution

Use repository-required Node **22.23.2** and installed dependencies. The CLI uses Node's local module hooks and the installed TypeScript transpiler for repository aliases; it does not alter the app runtime.

```sh
node scripts/collect-fpt.mjs --help
node scripts/collect-fpt.mjs --output /absolute/new-private-directory
```

Optionally add `--report` with an exact reviewed FPT PDF URL from `SOURCE_REGISTER.md`. The output directory must be absolute and must not already exist. It is created with mode 0700; `manifest.json` and `manifest.sha256` are written exclusively with mode 0600. The manifest contains source, batch, captures and execution mode. FAILED runs still retain their evidence and exit 2; invalid arguments or operational failures exit 1. PARTIAL is explicitly printed; exit 0 does not mean full data acceptance. Files are local captures, not production DB imports. No recurring collection is installed. A failed operational write may leave a reserved directory; use a new destination for a new run.

For a network-free trial:

```sh
node scripts/collect-fpt.mjs --output /absolute/new-directory --offline /absolute/fixture.json
```

The offline file is an array of `{ "url": "https://fpt.com/...", "status": 200, "mediaType": "text/html", "bodyBase64": "..." }` entries. It is test input; the manifest is explicitly labeled `OFFLINE_FIXTURE`. Requests absent from the fixture become recorded transport failures. This mode never falls back to network. The fixture tests model the independently browsed URL/content-type shape; they are synthetic, not independently reconciled financial disclosures.

For repository integration, explicitly construct `PrismaFundamentals` with the intended client and call `ingestFundamentalDocuments(collector, repository, uniqueExecutionId)`. Reusing an execution identity conflicts; new refreshes retain independent batches. Existing source content must match the registered source version. No source aliases, overwrite or latest-wins behavior is added. No production client is composed by this change.

## Validation and remaining acceptance

Using Node 22.23.2 and private temporary databases, focused collector/CLI/ingest tests, foundational contracts/repository tests and broker observation regression passed: **6 files, 27 tests**. The existing TCBS token-session suite passed **3 tests**. Architecture tests passed **3 files, 36 tests**. Prisma generation used an isolated harmless URL and `--no-env-file`; Next type generation, TypeScript checking, ESLint and boundary checks passed. A separate offline CLI trial verified manifest/payload/body hashes, lossless bytes, 0600 permissions and refusal to overwrite an existing directory. The first attempt under default Node 22.12 failed due to missing default TypeScript/SQLite runtime support; checks were rerun successfully under the required version.

No live HTTP was executed by the new adapter, no personal environment file or production database was read, and no commit/push was performed. No production financial observation, availability, normalized metric, ranking or score was created. FPT page/PDF accessibility was established by the earlier public browsing survey, not by an end-to-end run of this adapter. Live collector qualification, independently reviewed real capture fixtures, website access/retention conditions, dynamic discovery/history/pagination completeness and broader VN30 coverage remain open. This is implementation evidence, not a claim that every Slice 02 source-qualification acceptance criterion is closed. Slice 03 is not implemented.


## Conditional-review remediation — 2026-10-09

Original review: **CONDITIONAL APPROVAL; Critical 0 / Major 1 / Minor 3**. Re-audited HEAD: `ab253f4b4c57fa5b0199724f2b250a2339d94d76`; it exactly matches the supplied review commit. Working tree was clean before remediation. No material baseline drift was found. This section supersedes the earlier prose-only statement that downstream acceptance must inspect documents: it is now enforced through a distinct document-input gate. It does not supersede the open source-operational qualification items.

### Authority and scope re-audit

Inspected AGENTS.md and the installed Next backend guide; design sections A–G, Slice 1/2 reports, source register/configuration, foundational contracts/validation, registry manifest/loader, ports/repository, FPT adapter, ingest service, existing Slice 2 and foundational tests, Prisma schema and foundation migration. Governing M7 authority: `docs/07_VALIDATION/DATA_VALIDATION.md`, especially identity, temporal validity, fundamentals, conflicts and correction lineage. Governing M8 authority: `docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md` and `INITIAL_SCORING_REPORT.md`: DI/SC acceptance remains dataset/evidence-dependent. Slice 1 owner approval is retained; the registry file still says PROPOSED and its formal-write approval binding remains enforced. This remediation does not manufacture approval metadata or modify that registry.

### Major: separate document qualification gate

The enforced path is:

`raw captures → verified reconstructed PDF → explicit immutable document qualification → branded normalization candidate`

The collector does not create qualifications. An empty qualification history means **UNQUALIFIED**. HTTPS, issuer-hosted URL, HTTP 200, PDF MIME/signature and filenames establish no semantic qualification.

`DocumentQualification` records qualification ID, deterministic raw-document identity/body hash, source version, import/capture lineage, intended and evidenced durable Security IDs/tickers/issuer references, document type, explicit period/fiscal-calendar reference and reporting scope, state, method, page-level evidence, review time/reviewer, policy version and correction predecessor/reason. Existing SecurityId and ReportingScope conventions are reused; no new security master is introduced. Qualification IDs are scoped within their document history.

States: UNQUALIFIED, QUALIFIED, REJECTED, CONFLICTED. Only a current chain head with QUALIFIED status can produce a candidate. QUALIFIED requires FINANCIAL_STATEMENTS; matching intended/evidenced issuer identity; explicit period and CONSOLIDATED or SEPARATE_STANDALONE scope; DOCUMENT_CONTENT_REVIEW method; reviewer/policy references; and hash-bound, page-anchored content evidence for all four dimensions: issuer, document type, reporting period and scope. Missing/ambiguous metadata, wrong issuer, filename-only locators or missing evidence block qualification. This verifies a declared content-review contract; it does not authenticate a human reviewer or independently read a real PDF. No real qualification is seeded.

`RepositoryRawDocuments` validates registered source/import lineage, capture and envelope hashes, request fingerprint, actual HTTP evidence, complete PDF MIME/signature, chunk membership/count/index/size, consistent URL/attempt/retrieval lineage, total length and whole-body hash before reconstructing bytes. It canonicalizes chunk ordering and returns an opaque VerifiedRawDocument. Its document ID binds source/import/resource/attempt, ordered capture IDs and payload hashes plus body hash, so a different receipt or modified body needs its own qualification. No financial statement values are read.

`FundamentalDocumentGate.record` reconstructs the raw document before recording a review. `candidate` reconstructs again, reads the complete qualification chain and binds the current qualified record to the requested issuer and exact raw document. Review time cannot precede ingestion. The opaque QualifiedNormalizationCandidate and narrow QualifiedDocumentInput port describe the future handoff. Raw captures and unbranded documents do not satisfy those types. No normalizer is implemented. A future consumer must call the gate for each handoff; retaining an old candidate does not bypass a later correction. This operational head check is not a historical PIT selector.

### Immutable storage without schema expansion

**Prisma schema changes: none. Migrations: none.** The narrow local qualification artifact journal satisfies Slice 2 review persistence without creating another financial-data table, abusing raw captures as review records, or copying raw blobs. `FileDocumentQualifications` implements only append/history in an explicitly supplied private absolute directory; no runtime composition points it at production.

Records and commit receipts are exclusively created with mode 0400 in a mode 0700 directory; record writes are flushed. Each journal entry verifies its body hash, prior-entry hash and commit receipt. Corrections explicitly supersede the current head, preserve the prior record and require a reason. One exclusive writer lock prevents stale predecessor/fork appends; readers fail closed while a writer is active. Gaps, missing terminal correction records with retained receipts, partial writes and tampering fail closed. There is no update/delete/overwrite API. Reopen is tested. Raw-capture linkage is checked through the existing repository on record and on candidate issuance, rather than through new SQL foreign keys.

This is a trusted local artifact store, not a production archival/WORM or cryptographically authenticated reviewer system. An owner with filesystem administrative access can replace/delete an entire journal and its receipts; hashes alone cannot authenticate a wholesale rewrite. Production storage/backup/access-policy qualification remains future operational work. A crashed writer can leave a lock or incomplete entry: the gate stays blocked; preserve the artifacts and review recovery rather than automatically removing evidence or choosing an earlier favorable qualification. No such production deployment or recovery action was performed.

### Three Minor findings

1. **Generic architecture:** raw reconstruction, qualification contracts, journal port and candidate gate are issuer-independent. FPT-specific URL/discovery policy remains in the FPT adapter. No other issuer adapter is built. `issuer-sources.json` is unchanged discovery configuration; source discovered ≠ source operationally qualified ≠ document qualified ≠ financial observation accepted. SOURCE_REGISTER.md now states this explicitly.
2. **599 sentinel:** INTERNAL_RAW_FAILURE_STATUS names the reserved local capture failure sentinel. RAW_DOCUMENT_MEDIA_TYPE identifies the envelope protocol. `rawDocumentHttpEvidence` returns actual nullable provider status separately from local failure and rejects inconsistent sentinel/envelope combinations. A genuine provider HTTP 599, if received, remains explicit envelope evidence; it is not inferred merely from capture.responseStatus. Existing failure exclusion at the observation repository is preserved.
3. **Implementation/source qualification separation:** live adapter qualification, independent real captures, website access/retention conditions, history, dynamic discovery, archive/pagination, publication provenance and VN30 coverage remain open. No source is promoted to production qualified or DI5 PASS.

### Exact remediation files

- `src/domain/fundamentals/document-qualification.ts` — qualification contracts, validation, correction-chain checks, fail-closed states and branded candidate.
- `src/application/fundamentals/document-qualification.ts` — gate for recording reviews and issuing qualified candidates.
- `src/ports/fundamentals.ts` — generic reader, qualification repository and future input port.
- `src/infrastructure/fundamentals/raw-document.ts` — generic raw reconstruction and actual HTTP evidence accessor.
- `src/infrastructure/fundamentals/fpt.ts` — reuse named sentinel/media type; collection policy unchanged.
- `src/infrastructure/repositories/document-qualifications.ts` — private append-only qualification journal.
- `tests/unit/document-qualification.test.ts` — qualification, reconstruction, correction/storage and sentinel adversarial tests plus compile-time negative assertions.
- `tests/integration/fundamentals-ingest.test.ts` — persistent capture reconstruction and qualification/correction checks; raw captures unchanged and observation count remains zero.
- `docs/fundamental-data-engine/SOURCE_REGISTER.md` — explicit lifecycle distinctions.
- `docs/fundamental-data-engine/SLICE_2_IMPLEMENTATION_REPORT.md` — this remediation evidence/report.

### Test cases and results

New tests cover A: transport success remains UNQUALIFIED; B: FPT Online cannot qualify as FPT Corporation; C/D: unknown period/scope blocks; E: immutable qualification/rejection corrections, stale predecessor and fork rejection, reopen; F: body/hash substitution, fully rehashed replacement needing a new identity, duplicate/missing/mixed chunks, corrupt journal and missing final correction detection; G: integration observation count remains zero. Additional cases check all nonqualified states, expected-security mismatch, wrong document type, all four content evidence dimensions, filename-only evidence rejection, reserved 599 vs actual nullable/provider 503/provider 599 evidence and compile-time exclusion of raw captures from future input.

Toolchain: repository-required Node 22.23.2; pnpm 10.34.5 and locked dependencies. Tests use controlled transports and owned private temporary DBs; database fixture migration commands use explicit absolute DATABASE_URL and --no-env-file. No production/private DB or personal environment file is used. Schema unchanged, so schema validation/generation was not repeated solely for this remediation. No Next UI/server route was changed; existing generated route types were checked with tsc.

Validation commands:

```sh
pnpm exec vitest run tests/unit tests/integration tests/architecture
pnpm exec vitest run tests/unit/document-qualification.test.ts tests/unit/fpt-collector.test.ts tests/unit/fpt-cli.test.ts tests/integration/fundamentals-ingest.test.ts tests/unit/fundamentals-contracts.test.ts tests/integration/fundamentals-repository.test.ts tests/integration/fundamentals-migration.test.ts tests/integration/broker-observations.test.ts tests/architecture
node --test api/token-session.test.mjs
pnpm exec tsc --noEmit
pnpm exec eslint . --max-warnings=0
node scripts/check-boundaries.mjs
git diff --check
```

Full unit/integration/architecture regression: **51 files / 807 tests passed**, including existing portfolio/scoring/decision test fixtures. The final focused suite reruns changed qualification/collector/CLI/ingest, foundational contracts/repository/populated migration, broker and architecture checks after the final hardening. Final focused results: **11 files / 75 tests passed**, including **12 new qualification tests** and the strengthened integration test. Final tsc, ESLint, boundary checks (**119 modules**) and git diff --check passed. Token-session regression: **3 tests passed**. Initial typechecking caught the opaque-document cast; boundary checking caught the local `document` identifier (the repository conservatively treats that name as an ambient browser global). These were corrected by using an audited infrastructure-only opaque cast and `rawDocument` naming. An intermediate mechanical rename changed an import path; the affected test load failed, the path was corrected, and focused checks were rerun successfully. None of those initial failures is hidden or treated as a PASS.

### Four-role self-review

These are bounded implementation self-assessments, not independent reviewer sign-off or source/data acceptance. The requested 9.8–9.9 overall is not claimed without live/independent evidence and operational storage qualification.

| Role | Score / 10 | Evidence and limits |
|---|---:|---|
| CIO | 9.8 | No financial data/coverage becomes BUY or readiness; no capital action or investment logic change. |
| Data Architect | 9.5 | Raw transport, immutable content review and branded future handoff are separate; generic boundaries reuse existing Security ownership; local storage has explicit deployment/recovery limits. |
| Financial Data Engineer | 9.6 | Issuer, type, period, fiscal calendar and reporting scope are explicit, hash-bound review evidence is required; no filename/date inference or normalized values; real-review qualification remains pending. |
| Risk/QA | 9.6 | Fail-closed states, wrong-issuer/ambiguity/integrity/correction negative controls, no publication/availableAt inference, no production DB or DI PASS. |
| Overall (equal-weight mean, one decimal) | 9.6 | Ready for independent final Slice 2 implementation review, not source production acceptance. |

Remaining in-scope remediation findings identified by self-review: **Critical 0 / Major 0 / Minor 0**. The original Major and three Minor code/architecture findings are addressed. Open source qualification and operational storage/authentication limitations are retained as acceptance/deployment dependencies; they are not falsely closed by these tests. No DI1–DI15 status changes: all remain evidence-dependent, especially DI5 fundamentals, DI6 normalization, DI11 PIT and DI14/15 independent review/issue closure. This report cannot itself certify DI15 PASS.

**Recommendation: READY FOR SLICE 2 FINAL REVIEW.** Slice 3 was not implemented: no statement parser, OCR/table extraction, canonical item mapping, normalization, YTD conversion, TTM/FX/derived metrics, availableAt/PIT selection, dataset snapshots, readiness/scoring/ranking/Top 10/valuation/investment decisions were added. No normalized financial observations were created by the remediation; only existing foundational regression fixtures exercise those contracts. No live scoring/ranking/Top 10 was run. No production/private database was accessed, DI gate promoted, portfolio ledger or investment logic changed, or commit/push performed. Stop after review preparation; do not proceed to Slice 3.
