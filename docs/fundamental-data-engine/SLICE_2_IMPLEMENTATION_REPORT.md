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
