# Final authority and architecture audit

| Concept | Single authority | Runtime implementation | Evidence |
|---|---|---|---|
| Ledger/accounting | M6.3 | PortfolioEngine → PrismaPortfolioLedger; portfolio/reconstruct, transaction | portfolio integration; immutable SQL triggers; m68 explicit trade/reversal |
| Cash | M6.3 | reconstructPortfolio; decision-context consumes settled cash less existing payables | portfolio-accounting; workflow cash adapter; m68 A |
| Cost basis | M6.3 | moving weighted-average exact Decimal reconstruction | accounting golden fixture; large/fractional TEXT roundtrip |
| Realized P&L | M6.3 | portfolio/reconstruct | partial/full sell and charges regressions |
| Market valuation/current read model | M6.7 application boundary using M6.3 semantics | CurrentReadService → PortfolioEngine.snapshot → valuePortfolio | current-remediation; m68 current correction/performance |
| Score | M6.4 | calculateScorecard / ScoringEngine | scoring-golden; scoring-artifacts; m68 formal fixtures |
| Ranking | M6.4 | rankScorecards | scoring/portfolio golden cases; immutable rank replay |
| Top 10 eligibility | M6.4 | scoring/eligibility and ranking/rank | ranking exclusion/confidence/category cases |
| Decision State | M6.5 | decide / DecisionEngine | decision unit/integration; m68 C/D/E/I |
| Risk authorization | M6.5 | decision/engine and incrementalSize | exact name boundaries; sector monotonicity; drawdown tests |
| Opportunity cost | M6.5 | decision/engine; marginal | dca robust comparator; marginal substitution conjunction |
| Marginal allocation authorization | M6.5 | MarginalDecisionEngine / assessMarginalAllocation | persisted two-lot chain, stop, missing/tampered evidence tests |
| Review orchestration | M6.6 | WorkflowEngine / createReview | cadence, event precedence and governance tests |
| Allocation Proposal | M6.6 | workflow/allocation consumes pinned M6.5 decisions/marginal artifacts | m68 formal production composition and no ledger effects |
| HOLD CASH | M6.6 | workflow/allocation; upstream decision capital-use assessment consumed | m68 A; dca; marginal stop |
| Presentation | M6.7 | src/ui; app pages and server read composition | architecture UI-authority; UI and desktop/mobile E2E |
| Transaction posting | M6.3 | manual confirmed intent → PortfolioEngine.post | signed preview tampering; posted ledger/replay; no proposal execution |

`SOURCE_SCAN.json` records production source hits; generated Prisma/vendor files are excluded. The installed TypeScript resolver boundary scan and UI authority tests cover disconnected modules, client transitive imports, runtime calculator calls and assignment of formal outputs. New architecture checks prohibit ledger writers in scoring/decision/workflow and protect the absence of the vulnerable next/og surface.

No duplicate **cross-owner** investment calculator was found. `decision/engine` retains the original risk-result assessment and delegates current incremental capacity to `incremental-size`; both are M6.5, versioned together, with exact-boundary regressions. The old proposed and M6.5.2 branches are historical replay implementations and cannot issue new formal current decisions. Infrastructure repositories invoke owning domain calculators to validate replay; they do not maintain separate formulas. The ranking module replays scorecards with the M6.4 score calculator. Current sector aggregation is informational and never assigns a risk authorization.

Production source fixture hits are scope types, rejection guards and UI warnings; methodology prose containing “demonstrate” is a regex false positive. No production test-fixture import, hard-coded ticker/quote/score/Decision State fallback or seed is present. Operational tests/fixtures and E2E use disposable databases. Synthetic source history remains inspectable but current formal actionability blocks it.

Policy-like numbers: M6.4 score/return bands are owned by the scoring methodology; M6.5 return floors/concentration/switching/substitution thresholds belong to approved decision methodologies (M4 §12's 2-point/2-percentage-point substitution comparisons included). UI 100-point labels are presentation; 100-record catalog caps, 100-command/evidence bounds, 1,000-frame limits and retry/timer constants are operational bounds. The M6.4 lot-context display helper's 100 shares is the approved M2 board-lot context, not new capital authority; M6.5 consumes its explicitly supplied board lot and tests non-100 lots. M6.6/UI do not duplicate risk thresholds. No new investment-policy number was added.

The numeric scan's Number conversion in decision/engine converts a small integer score-category threshold; the UI converts event priority order indexes. Neither performs authoritative financial arithmetic. New validation-script Number conversions count passed tests only. All money/quantity/valuation/cost/weights use the existing exact Decimal/bigint implementation; this milestone introduces no financial calculator.

Backup commands use SQLite snapshots and row/schema/checksum metadata. They neither calculate accounting nor authorize investment, and restore never activates a portfolio automatically. Domain replay proof uses the existing owners in integration tests.

M68-M03 timing regression proves calculations recorded after receipt are accepted only through their issuance cutoff; wall-clock retries retain the immutable command. A new monthly marginal plan links/supersedes the single prior current monthly review/proposal without rewriting it. Ambiguous predecessor authority fails closed; event reviews are not automatically superseded.

M68-M04 catalog hardening hashes immutable marginal bodies before selecting embedded context/scope fields, preventing corrupt rows from hiding authority. Hash validation does not calculate an investment result; selected artifacts still replay through the existing M6.5 owner.
