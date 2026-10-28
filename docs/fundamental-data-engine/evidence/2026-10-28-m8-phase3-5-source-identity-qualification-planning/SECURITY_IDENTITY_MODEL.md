# Canonical security identity model

2026-10-28 · SOURCE_IDENTITY_QUALIFICATION_PLANNING_ONLY · DESIGN, NOT ACCEPTANCE

Proposed IdentitySubjectV1 is a scoped immutable relationship, not a ticker-keyed global mutable master. Preserve ledgerNamespace/securityID; bind portfolio/private account evidence; provider/market namespace plus local UUID assignment evidence; stable broker/provider instrument code; venue; instrument class; issuer/legal instrument reference where evidenced; optional ISIN with verification provenance; symbol history; listing/trading status; explicit valid and knowledge intervals; source/action/continuity pins and decision scope. No new canonical ID is allocated in this phase.

Required: original ledger anchor, exact broker account position relation to stable instrument, namespaced market identifier/code and venue/class, effective/knowledge witnesses, unique no-overlap relation and relevant corporate-action continuity. ISIN is preferred corroboration only when actually present/verified; if absent, existing strict Bridge alternate requires stable provider-code+venue+class plus explicit continuity evidence. Optional issuer names/tickers/ISIN/listing dates are never guessed or elevated to account proofs.

Matching precedence is evidence precedence, not a fallback heuristic:

1. Verify exact account/portfolio/perimeter/source and original ledger anchor before matching market identities.
2. Establish account-linked stable broker/depository instrument identity and explicit interval/lifecycle. Compare accepted identifiers within the same provider namespace/venue/class.
3. Corroborate market-side code/ISIN/master/UUID assignment with independent instrument reference where required. A syntactically valid ISIN or provider claim is not independent verification.
4. Accept only one relationship for each ledger economic unit and inverse market instrument in the effective scope. All required dimensions must agree. A conflicting ISIN/code/venue/class blocks; do not choose a preferred field to ignore contradictions.
5. Ticker/name/quantity/price equality can propose a search candidate only. No fuzzy name, ticker-only, same-value or current-master historical inference can qualify.

Intervals are half-open[validFrom,validTo) and[knownFrom,knownTo); dates must be witnessed, not defaulted to ledger inception/listing/retrieval. Null end is explicitly evidenced open-ended scope, not UNKNOWN. Unknown dates remain in the planning dossier and cannot be serialized into a valid Bridge. Corporate-action/event boundaries may require narrower mappings and separate successor instruments; no implicit remapping.

Ticker rename: retain original ledger ID and old/new dated symbols, accepted continuity notice and code/ISIN status. Ticker reuse/delisting/relisting/merger: new instrument relation unless exact evidence establishes continuity; ambiguous/reused code or ISIN blocks. Delisting does not delete ledger ownership, and identity qualification does not establish a fresh eligible price. Listing status/halt are sourced/time-bound observations, not an implicit valuation exception.

VN30 membership is a separate effective-dated classification. Entry/exit does not change economic identity, remove a held security or authorize price coverage omission. HistoricTPBmust remain in historical-analysis universe if relevant even though current11holdings exclude it. No historicalNAVimplementation is added here.

Compatibility: existing nav-security-identity-bridge-v1 allows wider venues/classes in offline preparation; current calculator requires HOSE/COMMON_SHARE. Do not widen calculator eligibility by qualifying identity. Existing resolveBridge remains offline/acceptedMappingfalse. New accepted relationship state/storage/resolver needs separately approved versioned contracts, not mutation of a frozen candidate DTO.
