# Proposed immutable security identity bridge

Design identifier: `nav-security-identity-bridge-v1` (proposed only). No bridge payload, accepted mapping or alias is installed.

## Evidence found and still unqualified

The ledger namespace has eleven ticker-shaped durable IDs; the market candidate has different UUIDs. All eleven have matching ticker labels. This is discovery only. INSPECTED_EVIDENCE.json records every ledger security row hash, original opening aggregate hash/source reference, corresponding candidate UUID, provider code, ISIN, venue and exact 5.11 raw pointer/hash. Older broker 5.11 observations are also inventoried when their code/ISIN agree. No accepted bridge exists.

For example, ledger `FPT` has candidate UUID `ec91b3cb-8eab-45ae-95e7-738bb3c7de52`, TCBS code `000208`, ISIN `VN000000FPT1`, HOSE/common-share metadata. The exact retained 5.11 record is pinned in the evidence inventory. The ledger table and opening source's ticker alone do not establish that both records represent the same economic instrument across all dates. The underlying opening broker instrument evidence and identifier continuity must be reviewed, not inferred from equal amounts, names or current ticker strings.

The candidate FPT identity has knownAt 2026-10-20T01:25:51.698Z and a generated `from` date of 20 October, whereas its candidate price is for 19 October. Existing adapter construction also uses a profile trading date as an interval boundary. Neither transformation is an approved historic identity-effective-date witness. Distinguish provider observation, code-generated interval and independently evidenced effective interval. Do not backdate a new bridge to opening time, listing time or bar date merely to make replay succeed.

## Proposed payload fields

|Field group|Required content|
|---|---|
|Identity|Contract version; content-derived bridge ID; immutable row ID; ledger namespace/security ID; market namespace/security UUID; provider and provider instrument code; instrument/share class; exchange/venue; ticker identifier and its interval.|
|Identifiers|ISIN plus exact source/pointer when available. Missing ISIN is explicit, not copied or invented. A non-ISIN path requires a separately qualified stable provider instrument key, venue/class evidence and a reviewed ledger-instrument continuity witness; absent that evidence the mapping blocks.|
|Temporal scope|validFrom inclusive and validTo exclusive are exchange-local DateOnly session dates (or an evidenced open-ended validTo=null); knownAt, recordedAt and source capture times are qualified UTC Instants. Resolve validity against the valuation session date; unresolved intraday identity/class transitions block this initial date-granular contract. Validity and knowledge are separate clocks. An open end does not waive revocation/status checks.|
|Ledger anchor|Original security row hash; exact immutable opening/transaction reference and aggregate hash; original broker instrument evidence path/body hash/pointer; documented linkage to this ledger economic position. No account-wide inference from one mapped stock.|
|Market anchor|Pinned master/release/candidate identity namespace; exact raw 5.11 request and response hashes/pointers; codeId/ISIN/venue/class; source contract and identity-method version. Preserve market UUID, never replace it inside sealed raw/market evidence.|
|Continuity|Evidence for the interval and absence/resolution of relevant rename, relisting, class change, merger or identifier reuse; explicit corporate-action exclusions and unresolved limitations.|
|Integrity|Canonical JSON/UTF-8 SHA-256 under a versioned serialization contract; complete evidence pin list; supersedes reference for a new immutable replacement, not an in-place edit. Hashing provides reproducibility, not signature or source authority.|

Acceptance is a **separate authenticated record** bound to the exact bridge content hash, portfolio/ledger namespace, market source, instrument set, purpose PORTFOLIO_NAV, effective/knowledge limits, policy versions, role/actor proof and revocation status. Payload fields such as approved=true, filename, owner text, OS username or a draft status cannot supply acceptance. A collection-level acceptance must enumerate exact row hashes; adding a security changes the set/hash and requires a new scoped decision.

## Resolution and failure rules

1. Start from the actual held ledger ID and valuation instant, not a ticker lookup. Resolve exactly one effective accepted bridge row, then exactly one eligible market observation for the pinned market UUID/source/session/purpose.
2. Confirm ledger anchor, provider stable key, class and venue against original retained evidence. Require ISIN agreement where available. Equal ticker/company labels and equal monetary values are never sufficient. Index membership is separate from instrument identity.
3. Require bridge knownAt, evidence availability and acceptance capture to be no later than the applicable knowledge cutoff. Current preparation may qualify a prospective interval only with evidence; it cannot upgrade historical knowledge.
4. Reject overlapping mappings for the same ledger identity and source/venue, multiple market UUIDs, duplicate observations or conflicting identifiers. Reverse mappings that would merge two distinct ledger instruments block; do not add their quantities silently. Broker available/unavailable subrows require separate reviewed instrument evidence, not suffix stripping.
5. A ticker rename may create a new identifier interval for the same proven instrument. A merger, successor, split-related class change or delisting cannot remap holdings implicitly. Accounting corporate-action events remain governed by the ledger; any new economic instrument needs separately reviewed identity and accounting treatment.
6. Unknown identity, missing source, invalid hash, unknown effective interval, unsupported security, pending/revoked acceptance, unresolved corporate action or missing exact market observation returns an explicit blocker and null official NAV. No closest match, latest-wins mapping or older approved fallback over a newer conflict.
7. Preserve all original ledger IDs, transaction IDs/timestamps and legs. Translation occurs only in the later derived price binding. Its lineage preserves original market UUID/observation ID and bridge row hash alongside the unchanged ledger ID.

## Replacement, revocation and replay

Retain append-only bridge versions and authenticated acceptance/revocation events under future approved audit controls. LIVE valuation resolves the current trust/revocation head at read and immediately before return; revoked or superseded mappings cannot remain effective through a cached NAV. Cache keys include dependency hashes and trust head, not only price date. Historical replay must explicitly state knowledge and revocation cutoffs and any subsequently invalidated evidence; it cannot silently regain LIVE authority. Corrections create a new pinned version and explanation; no retrospective overwrite or approval timestamp mutation.
