# ADR 0004 — M6.3 ledger, exact arithmetic and rebuildable portfolio state

Date: 2026-09-16. Implementation decision within approved M2 and M6.1. No investment-rule change or automatic methodology approval.

The current implementation request authorizes all of M6.3. The earlier uncommitted preparation documents describe a proposed slice-by-slice handoff; their historical Slice 1 stopping point does not replace that request. Existing user edits remain preserved.

## Authority and audit

Owning accounting contracts: DATA_MODEL v1.2, TRANSACTIONS v1.2, PORTFOLIO v1.1 and DATA_RULES v1.2 under `docs/02 DATABASE/`. Reference ownership remains VN30_MASTER and SECTOR_MASTER; BENCHMARK does not alter accounting. M1 controls no margin/long-only and distinguishes accounting facts from recommendations. M3–M5 downstream decision, ranking and review contracts are not implemented. Use the canonical `docs/06_DASHBOARD/` tree, not its copy.

M6.2 supplies MethodologyId, DateOnly, Instant, safe errors, decimal transport, Clock, the methodology registry, private SQLite connections and architecture tests. These are retained. Read the bundled Next Vitest guide before code changes; no Next API or presentation change is needed. M6.2's numeric transport proof did not define a calculation policy. M2 DATA_RULES §36 delegates precision selection to implementation; M6.1 permits exact scaled-integer arithmetic.

## Numeric implementation

`m63-mwac-decimal12-half-even-v1` uses BigInt scaled by 10^12. Inputs allow at most 30 integer and 12 fractional digits. Amounts and quantity/price facts cross persistence as decimal TEXT or strings in the immutable fact payload, never Number/REAL. Canonical leg formatting removes insignificant zeroes without rounding. Input fact text remains preserved.

Addition/subtraction are exact. Multiplication rejects a result that cannot be represented at this scale. Ordinary shares are whole, nonnegative shares; signed whole quantity deltas are permitted for supported corporate actions. Prices are positive. VND is the only currency. No fee/tax percentage, market convention or broker calendar is assumed.

Rounding occurs at two named derived boundaries: partial cost release (`openCost × sold / priorQuantity`) and displayed MWAC/valuation weight division. Both use half-even at 12 decimal places, with a single combined division for released basis, not rounded average cost multiplied by quantity. Full exit releases the entire remaining basis and sets average cost to null. Signed tie and repeating-division tests pin this behavior. Twelve sub-VND decimal places are computational precision, not a claim about broker settlement precision. Exact supplied monetary facts are never silently rounded to whole VND.

A MethodologyRecord must exist, carry the executable implementation identity above and be effective at the event date. The immutable reference is persisted with every event. Production governance records are not seeded or approved by this implementation. Changing the executable arithmetic identity requires a new implementation and tests; unknown identities fail closed.

## Aggregate and lifecycle

Transaction facts and signed TransactionLeg postings remain distinct. Domain construction produces the complete canonical aggregate. Application commands validate input, claim the expected ledger revision, load authoritative history, build events, replay all affected history, and commit atomically. Unposted drafts have no effect. Internally, the adapter inserts PENDING, inserts every required leg, then finalizes POSTED inside the same database transaction. It exposes no draft mutation, posted update/delete or arbitrary holding/cash/NAV operation.

Structural SQLite triggers protect POSTED headers and closed leg sets from update, delete, REPLACE and late insertion. They validate leg-count completion and basic lineage; no accounting formula lives in a trigger. Foreign keys protect portfolio, security, methodology, originating transaction, originating obligation and corporate-action reference identities. Idempotency keys and portfolio/source/event references have unique constraints. Different economic identities with identical amounts are not merged. A retry is explicitly rejected, not counted again.

CorporateActionReference contains immutable issuer/reference terms. Separate CORPORATE_ACTION transactions carry the confirmed accounting stage and its effects. Stage facts do not mutate the reference or a previous accounting transaction. Announcements and fractional/tax-specific actions lacking policy cannot post speculative effects.

## Replay and accounting

Replay starts from zero or evidenced opening legs. Filter each leg at the requested as-of, then sort by `effectiveAt → eventAt → transactionId → legSequence`, using code-point string comparison. Ingestion order and revision do not enter economic ordering. All currently supported stage builders emit a single effective timestamp per event; the replay cutoff is still leg-based.

BUY recognizes quantity and capitalized gross plus supplied attributable fees/taxes, with a positive liability PAYABLE. SELL removes quantity, releases MWAC basis and realizes net proceeds minus released cost, with a positive RECEIVABLE. TRADE_SETTLEMENT references the originating obligation and changes cash and the obligation only. Net settlement supports evidenced partial clearing; split settlement currently requires full clearing because partial categorized charge allocation needs explicit additional source detail. The split representation never also posts net cash.

The supported conservative funding capability requires settled cash to cover outstanding payables at validated boundaries. Unsettled sale proceeds are not buying power. This enforces the no-margin subset without asserting a universal broker available-to-trade formula. Unsupported timing/financing exceptions reject for review. Trade and settlement dates are checked against their accounting instants in Vietnam time (UTC+07); no settlement schedule is generated.

Dividends recognize actual net receipt, with gross/withholding only when both are known; net-only evidence returns null for those analytics. Opening assets are not contributions. Economic P&L for imported inception remains unavailable without a priced inception baseline. Exceptional CASH_ADJUSTMENT requires a reason, evidence and note, remains classified separately, and is never generated by reconciliation.

Reversal keeps the original POSTED, emits opposite legs at a later instant, and inverts the original replayed, version-pinned BUY/SELL cost/P&L transition. Explicit opening/action basis is inverted by its basis legs. Settled-trade corrections require an atomic same-effective-time correction group including affected settlement reversals; invalid downstream quantity/basis/funding transitions reject the entire group. There is no historical deletion or P&L plug.

## Watermarks, reads and projections

Portfolio revision is a monotonic decimal-text counter, atomically advanced with a commit (including a complete correction group). It stores source version, not a balance. Compare-and-set occurs before state-dependent validation; independent SQLite connections serialize or fail closed. There is no blind stale-command retry.

Read/reconstruction accepts an optional historical watermark, allowing the original input set to be recovered after a later backdated event. Snapshots carry as-of, calculation time, transaction IDs, method identity, source watermark and market/reference versions. Ledger-only `isCurrent` checks revision; `isSnapshotCurrent` additionally compares the supplied current price/reference versions. Previously returned objects must be rechecked before reuse.

The optional persisted accounting projection is only a rebuild cache. Rebuild failure returns POSTED plus BLOCKED and retains the committed event. Old cache rows are detectable by watermark. A late old rebuild cannot overwrite a newer revision's cache, and a newer commit observed before returning marks the post result STALE. A full snapshot is assembled from fresh replay, valuation and reconciliation; no unrestricted snapshot CRUD exists.

## Valuation and reconciliation

Price inputs are normalized, versioned observations, not a provider. Only observations at/before the historical as-of are eligible. `validThrough` must come from the supplied pricing policy; the engine invents no freshness threshold. Missing, stale or conflicting prices block official NAV/weights and remain explicit per position. NAV includes settled cash + market value + receivables − payables. Weights are decimal fractions of NAV; undefined/nonpositive denominators return null. Contributions do not become economic gain.

Reconciliation compares a complete, exact-time reference to internal cash, quantity, optional supplied cost and obligations. Difference is external minus internal. Version `m63-exact-reconciliation-v1` uses zero tolerance and approved MATCH/MISMATCH/MISSING_EVIDENCE/NOT_COMPARABLE states. Missing cost/obligation evidence prevents a full MATCH. Outstanding unresolved discrepancy blocks even if balances match. It never emits an accounting adjustment.

Effective reference inputs use inclusive-from/exclusive-to intervals and source/version evidence. Missing membership is unknown unless a complete coverage assertion and 30 active distinct members support confirmed absence. Historical identifiers and sector taxonomy lookup never use today's values. Missing reference data blocks technical actionability; no investment Decision State is produced.

## Persistence and validation boundaries

The additive `202609160001_portfolio_ledger` migration leaves the existing methodology migration untouched. Identity-only portfolio initialization accepts no balances. Production startup does not migrate or seed a database. Test databases are private temporary SQLite files; migration tests cover an empty database and a populated M6.2 database, repeated deploy and reload.

A narrowly allowlisted infrastructure Zod schema validates unknown command payloads. Domain constructors then check nominal IDs, dates and accounting. Server composition is developer-facing only: no Server Action, HTTP mutation endpoint or transaction dashboard was added. Prisma remains confined to infrastructure. Existing public error/log serializers continue to prevent raw financial or SQL diagnostics from escaping.

Limitations and requested upstream clarifications are recorded in the M6.3 implementation report and CHANGE_REQUESTS.md. No M6.4+ feature is introduced.

## 2026-09-17 — verification closure

Corporate-action EFFECTIVE-stage uniqueness is now a replay invariant. An active issuer-action ID is registered when its economic event is visited and released only when its reversal is visited. A future reversal cannot retroactively permit another active stage. A correction at the reversal instant must satisfy the existing deterministic ordering; invalid ordering fails closed. SETTLEMENT remains obligation-based, permitting evidenced partial clearing without duplicating entitlement.

LedgerRead carries the immutable supported inception instant. Application reconstruct/snapshot always passes it into replay, which rejects earlier cutoffs with BEFORE_SUPPORTED_INCEPTION. Standalone pure replay may omit inception metadata for existing synthetic fixtures; it then reports supportedInceptionAt null and must not be presented as an authoritative application snapshot.

Vietnam business-date conversion is centralized in shared/time.ts and used for trade/settlement validation, accounting-method effective dates and snapshot references. Half-open reference intervals are evaluated at the UTC+7 business day, including the UTC 17:00 boundary.

For IMPORTED portfolios, deriveSupportedInception replays only evidenced OPENING_BALANCE transactions at the declared inception. Same-instant deposits or trades are excluded from imported capital. Subsequent opening reversals remain post-inception effects, not edits to the original baseline. It values opening assets using separate normalized inception prices and effective reference inputs. The derived baseline carries ledger watermark, inception instant, calculation time, opening transaction/method IDs, price/reference versions, valuation methodology, selected price evidence, resolved references and reference interval evidence. No NAV is stored as editable truth and no new schema is required.

Snapshot economicPnl = current NAV − supported inception NAV − net external contributions. For zero-start history the inception baseline is zero. Imported economicPnl remains null and the snapshot BLOCKED when inception inputs are absent, stale, missing, conflicting or reference coverage is insufficient; current NAV may still be available separately. Imported cost basis supports future MWAC but is never substituted for market NAV. Metrics are since supportedInceptionAt, not invented lifetime history. isSnapshotCurrent also requires matching inception price/reference versions for imported snapshots.

## Independent review remediation — M63-R2

Reviewed commit: `6f4af0c5122eaf6b642ec6d6e6ce72a93780b335`.

M2 TRANSACTIONS §4.3 excludes speculative announced portfolio changes from authoritative legs. The reviewed builder conservatively rejected *all* future effective timestamps; thus that commit rejected a future oversell by date rather than proving its economic validity. This remediation preserves `eventAt <= now` and source-evidence requirements for an already confirmed event, while allowing its accounting `effectiveAt` to be later, as requested by the review. It does not schedule speculative events or synthesize settlement calendars. No approved baseline was changed.

`prepareCandidate` runs inside the repository's claimed-revision transaction. It builds the complete candidate and replays to `max(now, every candidate-history leg.effectiveAt)`. This is one full ordered replay, not merely a final-state check: the existing replay validates after each complete economic event or same-effective-time correction group. It therefore checks every new effective transition **and every existing later affected transition**, including intermediate invalid balances which a later event might repair. Failures roll back rows and revision. The current post result still reconstructs at now; accepted future legs do not appear early in current balances. Snapshot reads always reconstruct at their explicit asOf; a watermark is source-version metadata, not proof that an asOf-pinned cache advances with the clock.

`completePost` separates the already-committed outcome from derived-state work:

| Condition | Projection | Portfolio accounting trust | Reason |
|---|---|---|---|
| Successful reconstruction/rebuild/currentness check | VALID | VALID | null |
| Ordinary failure at the projection infrastructure boundary | BLOCKED | VALID | PROJECTION_REBUILD_REQUIRED |
| Newer ledger watermark, including a rebuild ConflictError | STALE | STALE | LEDGER_ADVANCED |
| Reconstruction failure, typed integrity/domain failure from projection, or failed post-commit read | BLOCKED | BLOCKED | POST_COMMIT_INTEGRITY_FAILURE |

All failures block actionability and retain `status=POSTED` with the committed watermark. There is no rollback-after-commit, compensation or blind retry. Structured diagnostics carry only an allowlisted phase and typed error code alongside the committed watermark. The integrity response uses the existing DataIntegrityError/public-error serializer. No raw error message, stack, cause, SQL, filesystem path or credentials enter the returned diagnostics. VALID accounting trust is not a portfolio recommendation: full snapshot valuation/reference/reconciliation checks remain required.

`PortfolioEngine` retains application orchestration and snapshot/currentness operations; candidate validation and post-commit classification are two small application helpers. The replay keeps its single ordered loop and MWAC behavior. Only obligation creation/clearing was extracted into a pure `applyObligationLeg` returning a replacement entry, making settlement-origin checks easier to audit without a rewrite.

`economicGainSinceSupportedInception` is the semantically preferred name for the existing absolute VND NAV bridge:

`NAV − supportedInceptionNAV − netContributions`.

It is an **accounting/valuation NAV bridge**, not TWR, CAGR, XIRR, annualized return, benchmark-relative return, or evidence that the 15–20% annual investment objective has been achieved. It can reflect documented cash adjustments and other accounting/valuation changes. The deprecated `economicPnl` alias and `economicPnlStatus` remain compatible; `economicGainSemantics` pins kind/unit/scope and literal false flags for investment-return and objective claims. No performance analytics (M6.8) or M6.4+ features were added.

Tampering regressions deliberately disable guards only inside disposable SQLite fixtures to emulate damaged persistence. The production constraints are unchanged. Malformed facts JSON, normalized-column mismatch, persisted-leg mismatch, unknown accounting method and corporate-action terms mismatch must all fail with DataIntegrityError through the normal repository/application read path. These tests also assert the safe public serialization.
