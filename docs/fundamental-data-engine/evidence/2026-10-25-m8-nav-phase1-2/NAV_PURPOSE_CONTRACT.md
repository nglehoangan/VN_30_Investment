# Phase 2 — offline NAV source and purpose contracts

Implemented source version: `nav-source-preparation-v1`; result version: `nav-only-unavailable-v1`. Both require OFFLINE_PREPARATION and exact purpose PORTFOLIO_NAV. They are deliberately incompatible with CurrentSource, accepted MARKET records and production scoring inputs.

## Source envelope

The envelope binds portfolio, ledger/market namespaces, ledger watermark/state hash, bridge hash, explicit creation and valuation instants, TCBS source/schema/normalizer versions, a candidate session/calendar proof and exact price/quantity bindings. Evidence origin is SYNTHETIC_TEST or RETAINED_PREPARATION; neither is source acceptance. Strict field validation and canonical SHA-256 prevent unnoticed structural/content changes. Detached results are deeply frozen.

Each price binds the unchanged ledger ID to bridge row ID, market UUID, provider code, ISIN, venue/class, quantity, decimal price, VND, VND_PER_SHARE, multiplier 1, trading date, observed/received times, validThrough and raw-source reference/hash/pointer/knownAt. Quantity must be positive whole common shares. Price must be positive and conform to existing exact Decimal limits: 30 integer and 12 fractional digits. Binary numbers, exponent notation, excessive precision, guessed unit conversion and rounding inputs are rejected. Multiplication must fit the existing accounting precision. Exact quantity text is compared with held quantity text; no automatic lexical or economic adjustment is applied.

Only the existing TCBS bars/normalizer versions and HOSE COMMON_SHARE binding are eligible in the offline NAV checks. Different price purpose, schema, venue, class, UUID, provider code, ISIN, row ID, bridge, ledger namespace, state hash or watermark fails. All held identities require exactly one observation; extra, duplicate or ambiguous observations block. There is no fundamental-eligibility filter that drops a held MBB or another security.

Raw source pins must match the caller's isolated expected reference/hash pins. `verifyOfflineSourceBytes` additionally verifies supplied in-memory bytes against SHA-256 and returns sourceAuthorityVerified=false. It never fetches a reference. Matching caller-supplied pins or hashes does not authenticate a source or prove that prices were normalized from actual source bytes; operational evidence replay remains future work.

## Candidate calendar/session proof

A proof must explicitly declare CANDIDATE, PORTFOLIO_NAV, CLOSE, RAW, Asia/Ho_Chi_Minh, trading date, completedAt, eligibleFrom, eligibleThrough, nextCompletedAt, calendar coverage and calendar/policy references. completedAt equals valuationAt; eligibleFrom equals completedAt; eligibleThrough equals one millisecond before a later-day nextCompletedAt within the declared calendar range. Price validThrough must equal that policy window, never an independent TTL. Observations must match the valuation/session, and requests outside the window block. Session/price validThrough is inclusive; authority expiresAt is exclusive.

These checks establish internal candidate-boundary consistency only. No holiday/exception calendar is independently certified or recomputed from source records by Phase 2; candidate calendar/policy evidence remains unaccepted. No arbitrary stale-day threshold, new accepted session or changed existing VALUATION policy is created. Missing proof, unknown calendar range, incomplete/future chronology and altered expiry reject.

Knowledge cutoff is mandatory and cannot exceed now; valuation cannot exceed cutoff. Envelope and bridge must already exist by cutoff. Capture and source evidence cannot be later than cutoff or envelope creation; raw evidence knownAt cannot predate its observation or exceed receivedAt. Source/policy/bridge references cannot be backdated into earlier knowledge. Timestamps are caller-supplied offline fixture/preparation inputs, not a trusted clock implementation.

## Authority placeholders and unavailable result

Five dependencies are explicit: SOURCE_AUTHORITY, INDEPENDENT_ACCEPTANCE, OWNER_APPROVAL, IDENTITY_BRIDGE_ACCEPTANCE and CALENDAR_POLICY_ACCEPTANCE. Their subjects bind respectively to the NAV envelope, bridge or policy hash. Placeholder states are MISSING, PENDING, PRESENT_UNVERIFIED, EXPIRED or REVOKED. **No ACCEPTED state, credential verifier, approval issuer or injected production verifier exists.** Even an apparently complete unsigned record remains unverified. Wrong subject, missing evidence, expired/revoked state or future knowledge produces an explicit rejection reason.

`assessOfflineNav` returns technicalStatus PASS/BLOCKED, held-coverage diagnostics, and invariably:

- status UNAVAILABLE and nav=null;
- productionAuthorized=false and acceptedMapping=false;
- investmentActionabilityAuthorized=false and scoringAuthorized=false;
- authority blockers, including OPERATIONAL_AUTHORITY_NOT_IMPLEMENTED.

Malformed preparation input returns an unavailable result with a stable reason rather than a numeric fallback. Direct strict readers throw NavContractError for rejected contracts. There is no official/accepted numeric result branch, NAV runtime integration, live identity bridge, source approval or operational revocation resolver in this milestone.

INDICATIVE_BROKER_VALUE, INVESTMENT_ACTIONABILITY, PRODUCTION_SCORING and existing VALUATION are rejected as NAV-purpose substitutions. No CurrentReadService.context(), LocalCurrentSource FORMAL injection, global marketCurrent change, D2/scoring activation, login, session or production read path is added. Future accepted NAV integration requires separately authorized phases and must not turn these offline placeholders into trust.
