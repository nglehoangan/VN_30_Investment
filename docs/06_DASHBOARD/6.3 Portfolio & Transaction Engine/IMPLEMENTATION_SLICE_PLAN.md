# M6.3 — Implementation Slice Plan

2026-09-16. Baseline-aligned handoff; no slice implemented or approved by this document.

Authority: `../6.1 Requirements & Architecture/IMPLEMENTATION_PLAN_v1.0.md` §4. See [audit](PRE_IMPLEMENTATION_AUDIT.md) for accounting invariants, concrete sources and risks.

## Approved order versus suggested slices

The approved plan specifies dependencies and mandatory vertical proofs, not six numbered implementation slices. The user's six slices are useful starting points but omit explicit snapshots/stale blocking and complete reversal/corporate-action work. Use the following eight slices to cover the approved order without changing its accounting rules. Low-level correction linkage is designed in Slice 1; executable reversal behavior follows snapshots, as specified in the approved order.

| Slice | Exact responsibility | Approved §4 order | Principal proof / enabling gate |
| --- | --- | --- | --- |
| 1 — Transaction Ledger foundation | Money/quantity/ratio representation, source/time/IDs, portfolio/reference minimums, header/leg contracts, additive persistence, immutable leg sets, atomic dedup/version commit; CASH_DEPOSIT is the only supported posted command | 1–4 | Valid deposit persists once; duplicates/stale submissions/invalid or unsupported events leave no partial rows or revision advance. No cash projection. |
| 2 — Cash and accounting replay foundation | Pure effective-time replay, external flows, cash-only events, opening cash, evidence for exceptions; atomic validation against full affected history before enabling withdrawals/charges. Define trade funding/obligation validation contract | 5, first part | Deposit/withdrawal/dividend/FEE/TAX cash and classification; insufficient funds; dividend gross/net availability; no header double count. BUY/SELL helpers may be tested but trade posting stays disabled until Slice 3. |
| 3 — Positions, MWAC and settlement | Enable BUY/SELL/TRADE_SETTLEMENT with state-aware validation, acquisition/released basis, realized P&L accounting transition, obligation matching, opening holdings, lifecycle and backdated replay | 5, completion | Oversell and concurrent SELL rejection; partial/full exits/rebuy; exact MWAC; no duplicate realization or basis at settlement. Version rounding before enabling arithmetic that divides. |
| 4 — Valuation, P&L and NAV | Provider-independent price port/observations, market value, unrealized P&L, realized read models, complete NAV, contributions versus economics | 6 | Below/above-cost prices, absent/stale/conflicting prices, obligations in NAV, no price-derived realized gain. No live provider integration. |
| 5 — Reconciliation and snapshots | Cash/quantity/cost/settlement comparison, discrepancy evidence, derived historical snapshots, source watermark, stale detection and rebuild-failure handling | 7–8 | MATCH/WARNING/MISMATCH reporting with baseline PASS/quality mapping; stale reference cannot MATCH; snapshots reproducible and cannot masquerade as current. |
| 6 — Reversals and corrections | Exact inverse original transitions, owner-flow reversal, historical cutoff, settlement dependency discovery and atomic correction groups | 9 | Original remains POSTED; before/after historical state; original method version used; corrected settled trades reconcile as a group; unsupported dependency cases blocked. |
| 7 — Supported corporate actions | Terms/detail persistence, stage-specific effects, split/reverse split and other M2 cases only where codified, basis conservation, explicit unsupported states | 10 | No artificial gains; no inferred quantity-to-BUY mapping; no speculative announcement posting; complex/missing terms blocked. |
| 8 — Golden fixture and integration closure | Hand-audited multi-security regression fixture, all vertical proofs, upgrade/reopen/concurrency/precision regressions, full gates and final documentation | §4 exit gate | All M6.3 DoD items demonstrated; remaining Critical/Major fixed and re-reviewed. User milestone approval remains separate. |

Realized P&L's pure accounting transition belongs beside SELL cost release in Slice 3; Slice 4 exposes it with valuation. This dependency follows the approved replay-before-valuation order. Basic fixtures/tests accompany every slice; Slice 8 consolidates them, not defers correctness until the end.

## Required vertical proofs

| Approved vertical slice | Implementation path | Completion evidence |
| --- | --- | --- |
| CASH_DEPOSIT → CashState → snapshot → reconciliation | 1 → 2 → 5 | Effective deposit cash and external contribution, reproducible snapshot, exact comparison and mismatch behavior |
| BUY → quantity/cash/cost basis → valuation | 1 → 3 → 4 | Trade payable then settlement cash, MWAC, prices and full NAV |
| SELL → realized P&L → settlement → snapshot | 3 → 4 → 5 | Partial/full release, net proceeds, cleared receivable, versioned snapshot |
| Reversal → immutable lineage → replay → restored supported state | 6, regression in 8 | Original/reversal/replacement evidence, inverse cost/P&L, dependent settlements, historic cutoffs |

## Activation and migration discipline

Each slice enables only event types whose full invariants it can validate. No raw generic POSTED writer bypasses the activation gate. A known-but-unimplemented type returns explicit UNSUPPORTED/REVIEW_REQUIRED; unknown type returns invalid input. This is temporary delivery staging, not a reduced M6.3 production contract.

Slice 1 supports canonical ledger construction and deposit persistence, not a usable portfolio engine. Structural type support is not a claim that SELL/reversal accounting works. Draft UI/workflow and imports remain unimplemented. Subsequent slices may add migrations rather than prematurely create unsupported entities or foreign-key placeholders.

Ordinary event ordering remains the M2 tuple even when revision order differs. Before enabling historical writes, replay must validate every affected later transition. Corporate-action/settled-trade correction groups require their own atomic validated boundary; no intermediate invalid state is presented as an official portfolio.

No fixed brokerage fees/taxes, settlement calendar, fractional corporate-action rule, price staleness threshold, or buying-power formula is invented. Technical precision/rounding and supported policy parameters must be explicit and pinned before their calculations are enabled. Missing governing rules are surfaced with source/conflict/severity/resolution, not guessed.

## Workflow and review gate for every slice

1. Read relevant owning sources and audit current code; enumerate allowed files and invariants.
2. Write narrow implementation prompt and behavioral test cases with independently expected results.
3. Implement only that slice. Preserve user edits; avoid baseline changes and unrelated refactors.
4. Run lint, typecheck, unit, integration, boundary, build, applicable schema/migration checks and `git diff --check`; use the pinned runtime. Use isolated databases and a separate build workspace if an existing dev process owns `.next`.
5. Review actual diff as Software Architect, Senior TypeScript Engineer, Financial Systems Engineer, Data Engineer, QA Engineer and Security Reviewer. Record Critical/Major/Minor, source, consequence and disposition.
6. Fix Critical/Major, rerun relevant validation and re-review. Distinguish technical self-review from user approval. Stop for review after Slice 1; do not execute Slice 2 automatically.

## Whole-milestone acceptance coverage

- Cash: deposit, withdrawal, trade/settlement, dividend, fee, tax, opening cash and evidenced exceptional adjustment.
- Positions: empty, first/repeated BUY, partial/full SELL, re-entry, opening holdings, corporate actions, long-only invariants and effective identity lookup.
- Financial results: MWAC, charges once, realized/unrealized gains/losses, obligation-aware NAV, contributions separated, inception baseline limits.
- Integrity: invalid numbers/dates/currency/identity/type; duplicates; atomic rollback; stale writes; concurrent SELL/import; backdated downstream failures.
- History: shuffled input determinism, leg-level cutoff, before/after settlement/reversal, original policy identity and source transaction IDs.
- Evidence: exact/cash/holding/multiple mismatches, stale observations, no auto-fix, historical snapshots and watermark/failure states.
- Persistence: clean and populated-foundation upgrade, precision, relationships, indexes, immutable headers and closed leg sets, repeat deploy/reopen.
- Golden fixture: fixed prices and separately recorded settlements; cash, obligations, quantity, basis, realized/unrealized P&L and NAV verified by hand at named cutoffs.

Scoring, decision/DCA recommendations, AI, broker integration, trading execution, large UI and M6.4 are excluded throughout this plan.
