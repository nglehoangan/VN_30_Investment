# CaféF ingest/transform/persistence contract

## Inputs and architecture

Reuse `fetch-cafef-price-history` for HTTP, pagination, date windows and raw retention. There is no second fetcher or price calculation. Live captures enter through that trusted collector's existing container; retained replay consumes its exact bytes. No unrestricted downloads were performed. [PROFILE_INPUT.json](PROFILE_INPUT.json) names the fixed versioned material sources; the generated [material review proposal](MATERIAL_REVIEW_PROPOSAL.json) contains exact hashes and is **not independent acceptance**.

Server-only composition: `app/server/cafef-standing-services.ts` (`ingestRetainedCafef`, `ingestCafef`, `validateCafefLifecycle`). Infrastructure: `cafef-standing.ts` (policy, capture/schema/identity/unit/date/replay adapters) and the existing `PrismaBoundaryStore` extended by `repositories/market-ingest.ts`. Composition stays in the server layer; source adapters/store do not depend on application services. No route, dashboard, scoring or portfolio consumer was activated.

Explicit ingest spec: retained file path/SHA, ticker, exchange, trading date and actual ingestion `knownAt`. The trusted host supplies current standing authorization, independent material acceptance and controlled-capture evidence. Those are never taken from submitted JSON flags. Before acceptance the host's actual clock rejects future `knownAt`; historical requests cannot spoof a future `now` at consumption.

## Deterministic transform

1. Verify immutable container bytes/hash and existing producer schema1; match price entry to the exact original request URL/parameters/status/receipt and embedded response SHA. Strict JSON decoding rejects duplicate keys; API/price-row shape changes suspend qualification.
2. Verify declared identity, bounded official VN30 membership/security-ID source mapping and existing HOSE trading calendar. A weekday guess cannot extend evidence outside its version/range.
3. Verify unit declaration and original receipt; retain original unknown/native unit metadata unchanged. Invoke **the existing CaféF normalizer**, not a competing arithmetic function. Missing/raw-null/adjusted-only/nonpositive close never falls back to adjusted close.
4. Derive `observedAt` only from the versioned conservative full-session convention, explicitly labelled **not provider timestamp**. Preserve `providerAt=null`. Original retrieval text, including microseconds, is retained; its domain compatibility instant is rounded **up** to the next millisecond when necessary, never earlier. Dates/times are validated, not silently repaired. `knownAt`/createdAt describe actual later ingestion, not historical operational availability.
5. Seal CAPABILITY/MARKET candidates and deterministically replay original bytes. The normalized observation carries security/ticker/exchange/date/session/RAW/CLOSE/VND value, source/schema/normalization/capability pins and knownAt. Provenance records provider, adapter/policy/normalizer versions, original receipt/units, unit source/receipt, request/body/container hashes and explicit time convention.
6. Under the standing trust gate, run actual `RetainedMarketAuthority` and `BoundaryLifecycle` qualification/acceptance inside the persistence transaction. Candidate construction or structural seal success alone is not accepted admission.

## Existing database boundary, additive extension

Use **the same application SQLite database** (`DATABASE_URL` / `data/vn30.sqlite`) after approved migration/activation; no parallel operational DB. This package only ran private disposable SQLite fixtures, not active schema/data migration.

The existing immutable `market_boundary_record` stores accepted capability/market envelopes. Additive migration `202611120001_market_ingest` adds:

| Table | Immutable role |
| --- | --- |
| `market_boundary_ingest_raw` | Original UTF-8 collector-container text, full SHA, provider and original locator; exact API bodies/receipts remain inside |
| `market_boundary_ingest_link` | Unique provider/security/date/RAW/policy/material identity → accepted capability, market, raw and request lineage; first committing run ID |
| `market_boundary_ingest_receipt` | Additional valid captures corroborating an already accepted identical raw close; never rewrite original source/availability |
| `market_boundary_ingest_quarantine` | Verified raw plus exact failure/context, never a consumable market observation |
| `market_boundary_ingest_revocation` | Append-only rollback of a committed ingest identity; no evidence deletion |

All have immutable update/delete triggers; foreign keys bind accepted records/raw. Accepted batch writes are one transaction: raw, capability, market, linkage and corroborating receipts either commit together or roll back. The raw entrypoint turns failed qualification of verified raw into separate quarantine. Missing/tampered unavailable raw cannot be inserted under a falsely claimed hash.

Identical retries return existing record IDs. A changed ingestion time alone does not duplicate an observation. A newly captured response with the **same raw close** (including adjusted-only revisions) is audited as corroboration without adding duplicate active prices or changing original source timestamps. A genuinely changed raw close on the same governed identity fails as a conflict; no overwrite/latest-wins/averaging. Callers must use the returned accepted/existing IDs, not assume a freshly constructed duplicate candidate was persisted.

## Consumption and rollback

`consumeCafefValuation` requires the exact accepted raw/normalized link and checks DB revocation itself. It rechecks active policy, material and capture trust, replays actual accepted records through authority and applies existing market freshness rules. A request callback/PASS flag cannot substitute for that link. Replay can read immutable raw from SQLite even if the original evolving collector file no longer exists. Default filesystem authority behavior is preserved for other integrations.

This release permits explicitly later-knowledge **HISTORICAL valuation market-input** consumption only; it rejects LIVE activation, another purpose/security and future clock claims. This is not PIT certification. Existing whole-analysis/F2 initialization, accounting and scoring authority remain separate and unchanged.

For rollback, call `PrismaBoundaryStore.revokeMarketRun(runId, actualUtcTime, reason)` through the trusted server. Only identities first created by that run are revoked; duplicate/preexisting records are not. Evidence/receipts/records remain immutable. Consumption and automatic reingest of revoked identities fail; rebuild requires a newly qualified material/policy namespace and independent acceptance, not deleting/clearing revocation or dropping tables. A pre-commit failure needs no rollback migration because the transaction leaves no partial acceptance. Keep the migration applied as additive audit history; do not reverse it by dropping evidence tables.

## Reproduce this dry-run

```sh
node scripts/cafef-standing.mjs --package docs/fundamental-data-engine/cafef-standing-source/2026-11-12
```

The workbench uses explicit fixed profile/knowledge time for repeatable outputs, an **empty independent acceptance registry**, and never opens the active database. It records proposals, normalized candidates, quarantine reasons and pilot limitations. A future trusted ingest host records its actual new ingestion time; it does not reuse this dry-run time to imply earlier acceptance.
