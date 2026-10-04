# Local normalized source operation

Set the optional server-only `VN30_CURRENT_SOURCE_FILE` to an absolute local JSON dataset file. If unset, missing, malformed, oversized, future-dated, ambiguous or incomparable, current readiness fails closed. No browser field can select this file or supply prices, validity, reconciliation or methodology.

The exact strict input schema is `src/shared/validation/current-source.ts`; normalized port types are in `src/ports/current.ts`. This path consumes an already-normalized manual dataset. It does not implement the deferred full import workflow or automatically grant data/policy approval.

The source custodian must preserve upstream provenance:

- Dataset identity, FORMAL versus SYNTHETIC_TEST scope, portfolio/as-of, received timestamp, exact ledger watermark, taxonomy and existing valuation method identity.
- Prices in unscaled VND with canonical security IDs, actual observedAt, receivedAt, revision, provider, source reference, RAW/ADJUSTED status, quality and externally established validThrough/policyReference. Without an approved deterministic validity window, use null and readiness remains UNKNOWN; never invent an age threshold.
- Versioned effective-dated reference intervals with taxonomy, source reference and explicit reference validity policy. Missing/expired policy blocks readiness.
- Independent statement reconciliation evidence at the exact portfolio valuation as-of. Do not copy internal ledger values into a source record and call it independent reconciliation.
- Optional analyst evidence: reviewer/source/version, as-of/receipt/validity, FACT/ESTIMATE/ASSUMPTION observations, sections, thesis assessments, verified triggers and next-review recommendation. All section/trigger/thesis references must resolve to evidence. Formal derived outputs are excluded by the schema.

Maintain immutable prior dataset revisions and atomically replace the selected current file only after normalization/validation. New inputs must change dataset and analyst versions as appropriate. Historical artifacts do not change when the current file changes. The current query revalidates ledger/source state; stale/missing prices cannot silently fall back to an older quote.

Review intent contains only `type`, `requestedDate`, nullable `contributionReference` and nullable `eventReference`. Requested date is the Vietnam business date of the selected source as-of; browser date does not override snapshot/cutoff. Preview is read-only. Formal creation re-resolves readiness, invokes M6.6 and persists through its existing idempotent adapter. Retry of the same captured intent returns the same review identity; a changed source/analyst revision is a new scope. Review creation has no write-capable ledger.

The current service blocks imported-inception actionability when historical inception price/reference evidence is absent, using M6.3's existing MISSING_INCEPTION_INPUTS result. Current supported NAV remains a valuation result; no inception or benchmark return history is invented. Full historical source/import support remains deferred.
