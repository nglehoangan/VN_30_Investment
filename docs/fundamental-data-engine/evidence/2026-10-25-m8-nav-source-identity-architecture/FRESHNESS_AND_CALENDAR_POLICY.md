# Proposed freshness and calendar policy

Design only. No calendar, validThrough, source approval or price timestamp is installed or backdated.

## Valuation time and session eligibility

Use **latest completed EOD**, not intraday, for the proposed initial NAV scope. At a trusted request instant, resolve the latest completed supported HOSE session from an independently accepted versioned calendar, timezone Asia/Ho_Chi_Minh, session boundaries, holidays and exceptional closures. The existing conservative full-session bound is 15:00 local (08:00 UTC), not an assertion that a provider quote event occurred exactly then. Keep normalized EOD-boundary time and provider event time distinct; unknown provider time remains null.

The existing 2026 calendar is a technical candidate. Its validity ends 2026-12-31 and it must not be extended by weekday guessing. Retained source URLs are references, not independently verified approval. Existing code's holiday/weekend selection and EOD window logic may be reused only after appropriate NAV policy qualification. Exceptional trading-calendar changes require new immutable evidence/policy versions, not edits to old seals.

For a session S, the proposed ordinary eligibility window starts at its approved completed-session boundary and ends immediately before the next supported session's approved completed-session boundary. This reuses the current calendar-driven shape, subject to owner/independent approval. Holidays/weekends may therefore span multiple civil days. No arbitrary “N days old” threshold is proposed. A boundary-time request without an eligible completed capture blocks; it cannot keep the older session fresh simply because the replacement capture failed.

`validThrough` must derive from the accepted NAV-purpose session policy, not from caller JSON, mtime, HTTP Date or the current clock plus an invented TTL. Verify again at return/consumption; expired cached proofs fail closed. The old active 19 October window is not current and must not be extended. No new session or current price is certified by this design on 25 October.

## Temporal and provenance rules

Preserve request start, retrieval/availableAt, raw hash/path/pointer, provider timestamp if qualified, policy-normalized observedAt, identity knownAt, bridge evidence/acceptance times, calendar/policy knowledge, normalization time, valuationAt and calculatedAt. Use UTC instants with explicit session-local date semantics. Source request/observation must be temporally coherent; no future observation, retrieval, policy knowledge or acceptance may pass a request/knowledge cutoff. A newly captured historical bar cannot be inserted as evidence known at its trading date. Do not upgrade preparation timestamps to authenticated capture events.

Reconstruct CASH, RECEIVABLE, PAYABLE and held quantities at valuationAt (completed EOD), with exact ledger version. Never mix later cash/holdings with an earlier close. The NAV result binds both that valuation instant and the actual calculation/request instant. If later activity or a changed ledger revision invalidates a “current account” claim, block that promotion and require an explicit historical EOD label or separately approved policy. No mutation/reversal is generated to reconcile a mismatch.

Current-account completeness and same-cutoff reconciliation require evidence, not absence of new ledger rows. A dated broker snapshot with asynchronous cash/holdings capture is only indicative. Imported inception valuation and investment-return calculations remain separate dependencies.

## Security availability and corporate actions

- Normal trading: require exactly one qualified CLOSE in VND/share with approved RAW semantics, matching identity, source session and independent board evidence as required by the existing normalizer.
- Halted/suspended, unavailable, no-trade, missing close or unsupported venue/class: withhold official aggregate NAV under the minimum proposal. No zero, cost-basis substitution, stale-price carry or estimated liquidity discount. A later carrying-price policy needs a separate explicit decision and evidence.
- Broker availability labels such as FPT_UNAVAILABLE are not exchange suspension evidence or separate accepted securities. Do not strip suffixes, merge positions or remap quantities from labels.
- Stock split, dividend, rights, merger, relisting or adjustment uncertainty: verify quantity/price economic basis at the same instant and bind the accepted corporate-action policy. Do not combine pre-action quantity with post-action price. Unknown relevant events block; an identity bridge never implements accounting actions.
- Current latest-close RAW support is not historical adjusted-price, total-return or corporate-action-adjusted series support. No EPS/financial or scoring calculation enters this adapter.

## Decimal normalization and clocks

Reuse existing `exactJson` and `normalizeTcbsEod` lexeme-preserving path and exact accounting Decimal limits. Preserve raw capture bytes, original lexemes and normalization version. Currency VND, unit VND_PER_SHARE and multiplier 1 require explicit source qualification; tradeUnit is not a scaling instruction. Reject nonpositive, malformed, out-of-range or unsupported-precision values rather than rounding an input. Existing named accounting division boundaries remain unchanged.

The personal Mac's Date/OS user alone is not trusted audit identity/time. Offline tests may inject labelled clocks and fixtures. Effective LIVE acceptance requires the existing PEC-1C identity/event/audit contracts to have an owner-approved operational realization, including UTC health/rollback checks and auditable trust/revocation state. Local hashes and SQLite triggers do not establish absolute tamper-proof time or authenticated acceptance. With that prerequisite absent, NAV admission remains blocked.
