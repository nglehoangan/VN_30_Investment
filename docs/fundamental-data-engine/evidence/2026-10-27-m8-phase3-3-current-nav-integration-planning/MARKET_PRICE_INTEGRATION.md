# NAV market-price integration

2026-10-27 · Phase 3.3 · DESIGN ONLY — NOT IMPLEMENTED / NOT ACCEPTED

Reuse api/tcbs.mjs acquisition and retained manifests/raw responses. Reuse exact-json parser, tcbs-latest-eod-close-v1 normalizer and replay pipeline; no second API engine. This phase makes no requests and creates no captures/candidates. Future acquisition must be separately authorized and retain pinned30-stock universe; NAV valuation coverage independently requires every held economic security, including any holding outside currentVN30 or unsupported venue/class.

Proposed read-only adapter steps: verify all byte hashes/path confinement/size/schema → verify exact capture/request identities and selected session → replay master/board/bar normalization → resolve accepted ledger-to-market continuity atT/K → apply a NAV-specific accepted price/finality/calendar/CA contract → translate lossless RAW VND/share multiplier1 observations into CurrentNavPriceV1 → bind exact proofs/sourcePins. Retain each original timestamp; normalizedAt is a session boundary, providerAt remains null where unknown and explicitly allowed.

|Check|Required qualification / rejection|
|---|---|
|Security|UUID/provider code/ISIN or accepted alternate, venue/class and effective/knowledge intervals; no ticker-only mapping|
|Units|exact decimal strings, VND_PER_SHARE, multiplier1; no guessed scaling or float arithmetic|
|Adjustment|latest RAW close matched to contemporaneous board plus accepted CA/finality semantics; historical adjusted series cannot be substituted|
|Session/calendar|latest accepted completed EOD, exceptional calendar changes, accepted next-completed boundary; no stale-age guess|
|Authority|purpose PORTFOLIO_NAV and exact source/session/security/dataset scope; VALUATION-only grant insufficient|
|Finality|provider EOD close distinguished from official exchange close; exact proof of eligible kind required; no renaming provider close OFFICIAL_CLOSE|
|Conflict|identical canonical duplicate may deduplicate per calculator; distinct competing rows/revisions block until explicit accepted supersession; retain both|
|Suspension|no accepted price/eligibility exception exists for this scope; fail closed, no last available price/carry-forward|
|Freshness/revocation|valid through exclusive next-completed boundary; recheck current grant/CA/policy revocation atC and publicationP|

Retained selected2026-10-23EOD capture `data/market-source/tcbs/2026-10-25T11-16-55.130Z-unified` remains PARTIAL_CAPTURE overall with61/61HTTP core/30observations technically qualified under candidate calendar. First knowledge25Oct cannot become23Oct knowledge. It is historical evidence, not automatically latest current EOD on27Oct. No current acceptance or stale fallback is created by this plan. Existing pipeline calendar technical15:00bound is not an exchange event timestamp. TCBS parseTcbsIdentity.from derived from retrieval day is a technical profile field, not an independent ledger identity effective-date witness.

Current market boundary admits PORTFOLIO_NAV as a type, but actual tcbsBoundaryServices checks purpose===VALUATION. Preserve that scope. Future NAV adapter needs its own accepted contract/pins rather than extending an approval implicitly.
