# Phase 1 — offline identity bridge contract

Implemented version: `nav-security-identity-bridge-v1`. Mode: **OFFLINE_PREPARATION**. A prepared bridge and a successful resolution are not accepted mappings.

Files: `src/domain/nav-preparation/contracts.ts`, `validation.ts`, `identity.ts`; SHA-256 facade: `src/infrastructure/nav-preparation/hash.ts`. No production reader imports them. The implementation reads no files, database, environment, credentials or provider endpoints.

## Payload and validation

The root binds portfolioId, explicit createdAt and ordered rows. It has a deterministic contentHash over every other root field. Each row binds exact ledger namespace/security ID, market namespace/lowercase UUID, TCBS provider instrument code (leading zeros preserved), ticker, venue, class, ISIN or structured alternate, effective/knowledge intervals, relationship and corporate-action status. Original ledger IDs are values, never rewritten or matched by ticker.

Every row requires ledgerAnchor, marketAnchor, intervalEvidence and corporateActionEvidence. Evidence references contain an exact reference, lowercase SHA-256, JSON Pointer and explicit UTC knownAt. These are structurally validated references, not evidence-content authentication. A missing ISIN requires a matching stable-provider-code/venue/class continuity witness with at least one evidence reference; it does not grant an exception to source acceptance. Invalid ISIN syntax or missing alternate evidence rejects preparation. ISIN validation is syntax only; authenticity/check-digit or original source qualification is not claimed.

Effective dates are explicit validFrom-inclusive/validTo-exclusive exchange DateOnly values. knownFrom, recordedAt and createdAt are canonical UTC millisecond Instants. knownTo is exclusive; null ends must be explicitly supplied. Source evidence must be known by knownFrom; knownFrom ≤ recordedAt ≤ bridge.createdAt. A knownTo must follow recordedAt. No date is inferred from ticker, capture, file mtime, listing date or a bar's trading date. Future bridge/evidence knowledge cannot resolve at an earlier request cutoff.

Strict recursive field allowlists reject extra/unknown properties, including approval booleans. Lists are bounded to 1,000 entries; evidence text is bounded to 512 characters. Arrays are ordered contract content. Existing canonicalJson sorts object keys by code point while preserving arrays and exact strings; the facade computes SHA-256 of canonical UTF-8. Reordering an array changes the hash. Reads verify the hash and return detached deeply frozen copies. Hashes provide integrity, not signatures, trusted timestamps or identity authority.

## Resolution

Resolution starts with portfolio, exact ledger ID/namespaces, provider, venue/class, trading date, knowledge cutoff and now. Ticker is not a lookup argument. Exactly one applicable row is required. Overlapping effective mappings for a ledger identity, reverse UUID reuse across ledger instruments, and conflicting provider code/ticker/ISIN identities in the same venue/class are rejected. This version conservatively rejects effective overlap even if knowledge intervals differ; a correction belongs in a new immutable bridge version.

Renames and ticker reuse can be represented only by separate explicitly evidenced nonoverlapping rows. No suffix stripping, same-name/equal-value matching, implicit merger or corporate-action successor transformation exists. SAME_ECONOMIC_INSTRUMENT is the only relationship. UNCERTAIN corporate actions may be retained as a candidate row but cannot resolve.

A successful resolution returns the row, bridge hash and **acceptedMapping=false**. Stable failures include STRICT_FIELDS, MARKET_UUID_REQUIRED, ISIN_OR_ALTERNATE_EVIDENCE_REQUIRED, OVERLAPPING_LEDGER_IDENTITY, AMBIGUOUS_REVERSE_IDENTITY, AMBIGUOUS_PROVIDER_IDENTITY, MISSING_IDENTITY_EVIDENCE, BRIDGE_NOT_KNOWN, VENUE_MISMATCH, SECURITY_CLASS_MISMATCH, CORPORATE_ACTION_UNCERTAIN and BRIDGE_HASH_MISMATCH. NavContractError exposes a reason code; no error grants fallback authority.

## Limits

Phase 1 verifies proposal structure, internal consistency and deterministic hashing. It does not open the referenced ledger/master/source evidence, qualify economic continuity, accept an effective date, verify a principal/signature, resolve operational revocation or create a production mapping. No actual eleven-stock bridge file is generated. All executable test mappings are isolated synthetic fixtures under tests/fixtures/nav-preparation.
