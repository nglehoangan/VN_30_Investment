# Slice 7 — Data Freshness UI

Implementation baseline: `06ce9d679424beac89c4189c126d3948052d8d9e` (Slice 06 remediation). User authorization: “Implement Slice 7”. Scope follows DESIGN_REVIEW.md §G, Slice 7. This report does not grant external Slice 06/07 approval or DI acceptance.

## Delivered behavior

`/data` lists sealed financial snapshot references; `/data/<runId>` reads an exact run. The default is the latest historical build, explicitly labelled READ ONLY. Counters use the pinned universe and selected canonical members, including a tested 30-member universe; missing/integrity-blocked snapshots show unknown counters. Coverage means every required item/scope/period has one selected fact, not scoring admission.

An explicit `?acceptance=<id>` requests independently verified readiness for that exact run. Stored acceptance/PASS declarations cannot establish authority. Default FORMAL reads remain blocked without externally approved capabilities. Valid historical provenance can remain visible when its readiness review is unavailable or blocked. v2 dataReady and scoring-ready counts retain Slice 06 semantics; legacy v1's narrower dataReady count is withheld. View-time age uses the pinned policy threshold diagnostically and never refreshes DI acceptance or authorizes a trade.

Native disclosure panels expose reporting periods, normalized values/units, quality/applicability, exact issuer publication or DATE_ONLY/UNKNOWN, provider receipt, local retrieval/ingestion, operational availability, evidence class/policy/hash and receipt knowledge. DATE_ONLY publishedAt stays null. Selected and excluded pinned facts remain distinguishable. Requirement findings, missing coverage, snapshot blockers and revision predecessors are visible. Governed derived metrics retain their actual result, ordered operands and canonical constituent links. Ancestors outside pinned display are explicitly identified.

A whitelist public DTO excludes raw payloads, field locators/raw lexical text, private documentation/terms/operator references, account capture and full reviewed scoring input bodies. Document links retain exact HTTPS resource identity; references containing userinfo, query strings, fragments or local/non-public URLs are withheld. Links never fetch source data. `/data` server composition returns before brokerage, portfolio reconstruction or current projection capture; tests verify no unrelated writes and no private brokerage rendering.

Display bounds: 50 snapshot/review catalog references (older exact IDs remain addressable), 5,000 assessment pins, 1,000 derived artifacts and 100 revision ancestors. Exceeding integrity/display bounds fails closed. IDs and catalog timestamps are validated. The UI remains keyboard operable and supports desktop/mobile table scrolling.

## Runtime and compatibility

No Prisma schema/migration, score formulas, M3 weights, decision/ranking rules or registry content changes. Node 22 JSON import attributes were added to the three existing financial JSON loaders so the E2E fixture can use the same loaders. The Next server build explicitly externalizes `@prisma/adapter-better-sqlite3` to preserve native SQLite binding resolution: the isolated webpack browser build revealed the bundled adapter otherwise searched inside the Prisma client package for `better_sqlite3.node`.

Installed Next page/searchParams and serverExternalPackages guides were read before the corresponding changes. All database tests own temporary synthetic databases. The production build uses a separate temporary copy without `.env.local` or private data. Browser tests use an owned loopback server and disposable synthetic DB. No real source fetch, scoring, ranking, Top 10, DI promotion, Slice 8 initialization, private DB access, commit or push.

## Verification gates

The final handoff is gated on matching actual results for the frozen tree:

| Check | Required result |
| --- | --- |
| New public model/repository/UI regression | 15 tests passed |
| Complete unit/integration/architecture | 73 files / 950 tests passed |
| Browser regression, including Slice 7 desktop/mobile keyboard/provenance | 12 tests passed |
| Isolated production webpack build | Passed |
| TypeScript noEmit, ESLint zero warnings, architecture | Passed; 139 source modules |
| Token-session regression | 3 tests passed |
| Prisma validation/client generation, explicit temporary URL and --no-env-file | Passed |
| git diff --check | Passed |

New tests cover 30-member coverage, DATE_ONLY/null exact publication, independently verified historical readiness and present-time stale diagnosis, absent/forged authority, UNKNOWN exclusion, integrity tamper, redaction, public URL withholding, correction predecessor replay, actual governed FCF operands, empty/blocked and legacy/synthetic/AS_REVISED UI, no broker leakage and keyboard/overflow at 1440/390px. Existing suites include current, portfolio, workflow, backup, scoring/golden, decision, Slice 01–06 and migration regression.

Logs and screenshots remain outside the repository under `/private/tmp/vn30-slice7-*`. The empty presentation helper is exposed through the existing dashboard model facade; UI imports domain financial contracts only as types. Database opening/configuration failures also produce an explicit BLOCKED freshness model. Final full verification uses before/after SHA-256 inventories of tracked and new sources/tests/config/reports. Earlier development failures (correction fixture reusing a canonical capture identity, Node JSON imports , native adapter bundling and a direct UI runtime import caught by the existing authority test) are superseded by the final runs; they are not counted as successful evidence.

## Serial implementation self-review

This is self-review, not independent owner or DI approval.

| Role | Finding |
| --- | --- |
| CIO | Readiness and freshness remain historical diagnostics; no investment action or future knowledge inference. |
| Data Architect | Existing integrity repositories remain authority; public DTO, exact run/review binding and inward dependencies preserved. |
| Financial Data Engineer | Separate publication/operational clocks, DATE_ONLY/null semantics and canonical revision/derived lineage preserved. |
| Risk/QA | Missing authority/integrity yields blocked or unknown; private canary redaction and isolated regression required. |

No in-scope Critical/Major issue identified, contingent on the verification gates above. Ready for Slice 7 review after they pass. Real source/registry/policy/requirements/methodology approval and independently composed DI authority remain external prerequisites; this UI does not create them. No later slice is authorized by this implementation.
