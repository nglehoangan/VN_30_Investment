# DI15 amendment — Quarantined Partial-Universe

Version: **1.0**. Status: **OWNER APPROVED**. Effective prospectively: **2026-10-17**.

**Policy B — Quarantined Partial-Universe approved by Owner.** The exact request and its SHA256 are retained in [Owner decision](../fundamental-data-engine/evidence/2026-10-17-di15-partial-universe-amendment/OWNER_POLICY_DECISION.json). This approval changes governance and acceptance contracts. It does not approve DI14, scores, rankings, Top10, valuations or investment actions.

## Previous and amended rules

`independent-di-acceptance-v1` retains its original rule: no unresolved Critical/Major issue in the full accepted dataset. Its serialized fields, hashes, trusted-review capability and historical replay remain unchanged.

New `independent-di-acceptance-v2` adds a hash-bound `quarantined-partial-universe-v1` admission partition and complete issue/source register. A material ticker-isolated evidence blocker may remain OPEN at its original severity in DEFERRED_UNIVERSE. Quarantine is an accepted admission disposition, never issue resolution. This requires explicit v2 acceptance; existing acceptance records are not promoted, rewritten or reinterpreted.

FULL_UNIVERSE contains every certified effective VN30 member. SCORABLE_UNIVERSE and DEFERRED_UNIVERSE form a complete, disjoint partition by mandatory Level-1 admission evidence. SCORABLE denotes admission eligibility, not a completed score or permission to trade: existing market, valuation, qualitative, confidence, snapshot/PIT, independent DI14 and M3/M4/M5 gates still apply. Every member remains in full denominator reporting.

## DI15 conditions

Every member must have exactly one state. SCORABLE members require Level-1 PASS and no unresolved material admission issue. DEFERRED members require Level-1 non-PASS, the exact original blocker(s), real severity, source provenance and deterministic authoritative-evidence reopen triggers. The source register is hash-bound and must equal the operational issue register; dropping, downgrading or marking a deferred issue resolved is forbidden.

Deferred scores are null/unavailable, never zero, neutral, median, sector average or a placeholder. Deferred members cannot enter scoring, ranking, Top10, STRONG BUY/BUY/ACCUMULATE, new capital or DCA. Neither score weight nor portfolio capital is redistributed merely because a member is deferred. Technical exclusion is validated and enforced at formal dataset authorization and bound-artifact reads used by decision/marginal/DCA paths. Separate positive-capital and LOW-confidence restrictions are unchanged.

Only SOURCE_UNAVAILABLE, REGULATORY_SOURCE_UNAVAILABLE, ACCOUNTING_POPULATION_UNRESOLVED and DEFINITION_UNRESOLVED may be classified as ticker-isolated evidence insufficiency. Shared universe, registry, mapping, source/schema, calculation, unit, contamination, replay or production infrastructure failures remain GLOBAL_SYSTEM_BLOCKERs and block DI15. **The stricter existing Critical rule is preserved: every unresolved Critical blocks DI15, including one claimed to be isolated.** This amendment does not waive arbitrary Critical integrity failures.

Universe certification must PASS. All other mandatory DI gates must remain satisfied. In accordance with the Owner's condition 8, the v2 DI15 release evaluation checks DI1–DI14, including independent DI14. The evaluator separately reports structural quarantine PASS so it does not misrepresent a pending DI14 as an accounting or shared-system corruption issue. Structural PASS alone cannot grant release DI15 PASS. Accepted formal v2 datasets still require all 15 PASS gates and a trusted independent acceptance capability pinned to the exact acceptance hash.

## Reports and reopening

All Policy B reports disclose FULL_UNIVERSE_COUNT, SCORABLE_UNIVERSE_COUNT, DEFERRED_UNIVERSE_COUNT and deferred names. A future partial ranking must use a qualified label such as “Top ranked among currently scorable VN30 constituents”; an unqualified “Top10 VN30” is prohibited for partial eligibility. This amendment encodes the reporting invariant; it creates no Top10 or ranking.

Reopening requires qualifying original issuer filings, regulatory capital disclosures, accessible reviewed originals/mirrors, issuer definition bridges or debt-note evidence. Price movements, sentiment, a desired scorable count and ranking needs are not reopen events. A new source does not silently promote a member: a new reviewed partition/snapshot and independent acceptance are required.

## Authority and compatibility

M1 Investment Policy §§ data integrity/missing information; Scoring Model missing-data/weight/confidence rules; Risk Policy and Decision Framework material uncertainty/new-capital gates already support these exclusions. This narrow M1 clarification is recorded in this amendment; no weights, decision thresholds, portfolio constraints or unrelated constitutional rules change. M2 effective-dated universe/identity and sector authorities remain unchanged. M8 DATA_INITIALIZATION §28 and INITIAL_SCORING_REPORT §7 are amended prospectively for v2 only.

No DB migration is needed: append-only acceptance JSON already carries versioned contracts with body hashes. Existing trusted independent-review binding and approved methodology records must bind the entire new body, including partition and source issue ledger. A caller-authored PASS, recomputed checksum or Owner policy approval alone is not independent DI14 approval. New formal scoring remains closed until exact independent acceptance and all existing gates pass.
