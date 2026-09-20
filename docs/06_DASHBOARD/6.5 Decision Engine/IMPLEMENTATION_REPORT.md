# M6.5 implementation report

Implementation date: 2026-09-20. Scope: deterministic decision domain, application boundaries and immutable persistence. No production methodology is approved or registered by this change.

## A. Rule ownership

The complete rule/source/calculation/evidence/output matrix is in [RULE_OWNERSHIP_MATRIX.md](RULE_OWNERSHIP_MATRIX.md). It was produced before domain implementation. M1 owns constitutional/risk constraints; M3/M6.4 own scores and ranking; M4 owns decision and return logic; M2/M6.3 own accounting; M5 owns later workflows.

The three conflicting rules were paused, then resolved by the user's explicit “Approve these three resolutions” reply. The pinned implementation identity is `m65-decision-v1-session-resolutions-20260920`. See [CHANGE_REQUESTS.md](CHANGE_REQUESTS.md).

## B. Implementation mapping

Paths below are relative to the repository root.

| Approved rule | Implementation | Test evidence |
| --- | --- | --- |
| Engine §13 / Buy §§5–10: seven states, ownership, fundamental prerequisites | src/domain/decision/engine.ts: decide | tests/unit/decision.test.ts: approved decision states; A/B; same-score cases |
| Framework §4.7: full Stage 0 and precedence | src/domain/decision/contracts.ts; validation.ts; engine.ts | Stage0 fail, precedence, secondary veto, conditional PASS, investability review |
| Risk §14 / Buy §6.3: normal, exceptional and adjusted hurdles | engine.ts: requiredReturn, assessRequiredReturn, rankingRequiredReturn | exception floor boundaries, approval resolution, missing calibration, missing forecast |
| Sell §§4–15: mandatory exit, residual reduction, robust valuation switch | engine.ts: ownershipExit, valuedExit, independentReduce, discretionaryReduce | E/F, broken-thesis resolution, target zero, cash switching, uncertainty and 2pp rejection |
| Opportunity §§4–16: cash, scoped alternatives, incremental/switch comparison | engine.ts: opportunityCost; application/decision/engine.ts comparator qualification | H, cash switch, stale comparator, switch edge, qualified artifact boundary |
| Sizing §§6–15 / Risk: exposure, limits and approvals | engine.ts: portfolioImpact | concentration, emergency ceiling, drawdown, post-sale exposure |
| Engine §19 / Buy §14: separate timing, cash and execution | engine.ts: execution routing | I, insufficient cash, variable board lot, invalid lot preserves BUY, blocked sale |
| M6.3 portfolio boundary / scoped integrity | application/decision/portfolio-context.ts; ports/decision.ts | tests/unit/decision-portfolio.test.ts: actual derived snapshot, cost-only exception and no writes |
| Template §§2–24 / M6.1 domain §16: lineage and immutable record | contracts.ts; infrastructure/repositories/decision-artifacts.ts; Prisma decision migration | tests/integration/decision.test.ts: append/read/replay/revisions/duplicates/mutation rejection |
| M6.1 security: deterministic server authority | validation.ts; application/decision/engine.ts | unknown fields, future evidence, AI source, supplied final state, stale snapshot, forged artifacts |

M6.4's Stage0 type and scorecard validation now retain `PASS WITH CONDITIONS`; score arithmetic is unchanged. The decision layer consumes the full dated assessment and checks its compatibility with the scorecard summary. Ranking remains evidence, never capital authority.

## C. Decision state matrix

All positive states require actionable score evidence, non-LOW confidence, current membership, fresh valid thesis, valuation and required return, no capital veto, compliant portfolio exposure and acceptable opportunity cost. Category prerequisites are independent gates; total score never routes state.

| State | Ownership | Additional conditions |
| --- | --- | --- |
| STRONG BUY | Unowned INITIATE or owned ADD | PASS; HIGH confidence; BQ ≥18, FH ≥11, RG ≥7; LOW/MODERATE residual risk; ≥18% return; significant margin of safety, exceptional asymmetry, HIGH valuation confidence; top-tier versus alternatives/cash |
| BUY | Unowned only | PASS or explicitly permitted mitigated conditional PASS; BQ ≥13, FH ≥8, RG ≥5, VAL ≥10; all positive gates |
| ACCUMULATE | Owned only | PASS; positive gates; fresh incremental thesis and decline review; averaging down additionally needs improved forward economics and no value trap |
| HOLD | Owned only | Explicit continued-ownership rationale, why not add/exit and comparison to alternatives; incomplete review is separately Provisional HOLD/PENDING or ESCALATED |
| REDUCE | Owned only | Supported risk/concentration/thesis/valuation/opportunity/legacy cause; defensible residual ownership; positive target below current quantity |
| SELL | Owned only | Mandatory ownership prohibition/veto/BROKEN thesis, or supported zero-ownership case; valuation-only requires robust extreme valuation, inadequate return, switching test and zero superior to residual |
| AVOID | Unowned only | Identified failed eligibility/economic gate; incomplete evidence is explicitly temporary with PENDING/ESCALATED qualifier and no trade authority |

Technical deferral, insufficient cash and invalid execution lots do not rewrite economic attractiveness. Binding concentration does block a positive state under the approved resolution. Board lot and shares are inputs, not a hard-coded 100-share order. No order is submitted.

## D. Anti-shortcut evidence

Tests are in `tests/unit/decision.test.ts`. Strict input validation additionally rejects raw P/E, P&L, gain, decline, monthly contribution and client final-state fields as decision authority.

| Prohibited shortcut | Named regression evidence |
| --- | --- |
| High score → BUY | high score alone is not BUY; same-score valuation/ownership/portfolio/hurdle tests |
| Top 10 → BUY | Top 10 alone is not BUY (actual ranking artifact) |
| Low P/E → BUY | low P/E alone is not BUY; raw pe cannot enter decision authority |
| Price decline → ACCUMULATE | price decline alone is not ACCUMULATE (C); raw priceDecline rejected |
| Loss → ACCUMULATE | loss position alone is not ACCUMULATE (C); raw unrealizedPnl rejected |
| +20% gain → REDUCE | +20% alone is not REDUCE/SELL (D); raw gainPercent rejected |
| +20% gain → SELL | same regression plus +25% case |
| Technical signal → BUY | technical signal alone is not BUY |
| Technical weakness → SELL | technical weakness alone is not REDUCE/SELL (D) |
| Affordable lot → BUY | affordable board lot alone is not BUY; lot feasibility does not rewrite economic BUY |
| Monthly cash → forced deployment | monthly DCA cash alone is not BUY; raw monthlyContribution rejected; H cash wins |

Price/P&L triggers belong to upstream review evidence; the domain deliberately has no raw profit or price-change signal from which to derive a state. Parameterized labels exercise that boundary, rather than inventing a return-series subsystem.

## E. Historical reproducibility

Each record retains IDs, as-of and known-at cutoffs, server recorded time, prior decision/revision reason, dated evidence, pinned scorecard and optional ranking, portfolio snapshot ID/watermark, captured derived context, and decision/risk/required-return/scoring methodology metadata. The full frozen decision input is retained for deterministic replay. This duplicates a bounded historical read context for audit, not a ledger or independently calculated accounting model.

The application resolves stored analytical artifacts and registered methodologies, verifies prior lineage, and checks portfolio currency before and after computation. Eligible stock comparators require a persisted qualifying decision for the same portfolio/watermark and cutoff. Formal issuance requires APPROVED/PRODUCTION metadata; synthetic tests require explicit synthetic scope.

Persistence revalidates the computed record, stores a SHA-256 body checksum, verifies indexed metadata, and replays on read. Append-only ports and SQLite triggers reject update, delete and replacement. Revisions append a new ID and retain the old bytes. Future rule implementations must preserve dispatch for this pinned identity; changing its behavior would break replay verification.

## F. Validation

See [VALIDATION_REPORT.md](VALIDATION_REPORT.md) for command, exit code, result and counts, and `verification-evidence/` for command logs and machine-readable results. Tests use fresh temporary SQLite and a populated M6.4 migration baseline, including repeat deployment. The real portfolio database was not migrated or used for validation.

## G. Findings and boundaries

See the validation report for final severity counts. Production activation remains gated on registered APPROVED/PRODUCTION upstream and M6.5 methodologies. This is an explicit governance boundary, not implicit approval from passing synthetic tests.

Qualitative concepts (thesis integrity, downside protection, uncertainty robustness, economic target, cash merit and risk calibration) remain attributable human assessments with dated evidence. This implementation validates their provenance/consistency and applies approved deterministic conditions; it does not claim to compute those judgments from market data. Missing required calibration or evidence prohibits dependent capital action. The domain requires a complete schema even for a Stage 0 failure; no sparse early-review UI is introduced.

## H. Scope

**M6.6+ functionality implemented: NO**

No monthly allocator, review scheduler, dashboard, charts, provider redesign, broker integration, order execution, margin, AI authority, generic mutation endpoint or ledger-writing dependency was added. M6.5 stops at an auditable decision and execution assessment.
