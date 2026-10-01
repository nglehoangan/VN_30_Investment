# M6.6 rule ownership audit

Audited 2026-10-01 before implementation. M5 v1.0 is the workflow baseline; M6.5 production decision identity is `m65-decision-v1-sector-monotonicity-20261001`. No policy approval is inferred from this implementation.

All 14 files in `docs/05_PORTFOLIO_WORKFLOW` were inspected, including the final review, templates and validation cases. Upstream audit covers M1 Investment Policy §3/6/14–19, Decision Framework §27, Risk Policy drawdown/concentration controls; M3 Ranking Rules §17–21; M4 Decision Engine §5–6, Buy Rules, Sell Rules §12, DCA Rules §4–19, Position Sizing and Opportunity Cost §7–12; M6.1 Architecture §14–17/24 and Domain Model §13/19–20; M6.3 portfolio snapshot/reconciliation, M6.4 scorecard/ranking and M6.5 decision application/repository contracts.

| Rule | Owning baseline | M6.6 calculates? | Consumed upstream artifact | Output | Failure behavior |
|---|---|---|---|---|---|
| Contribution is not deployment | M1; M4 DCA §4; M5 Monthly §7–9 | No balance calculation | M6.3 cash and deposit reference | Separate contribution/cash fields | No assumed cash or double counting |
| Ledger, executable and reserved cash | M6.3; M6.5 portfolio adapter | No | Captured portfolio cash/payables and executable cash | Available capital; proposal residual only | Unreconciled → REVIEW REQUIRED |
| BUY for unowned; ACCUMULATE for owned; STRONG BUY either | M4 DCA §5; M5 Monthly §16 | Routing only | Formal M6.5 Decision | Eligible consideration | HOLD/REDUCE/SELL/AVOID receive zero capital |
| Required return, risk, capacity, execution | M4/M6.5 | No | Decision requiredReturn/portfolioImpact/executionStatus | Referenced assessment; copied approved quantity/cost | Any block prevents proposal item |
| Ranking is not trade authority | M3 Ranking; M5 Monthly §13 | No ranking | Immutable complete M6.4 ranking | Display rank separate from economic priority | Missing/stale lineage blocks |
| Economic comparison | M4 Opportunity Cost §7–9 | Compare derived robust comparator evidence only | M6.5 opportunityCost | Partial economic ordering, ties retained | Unresolved material tie → REVIEW REQUIRED |
| Cash vs candidate | M4 Opportunity Cost §10; M5 Monthly §21 | Routing only | M6.5 cash/relative merit | HOLD CASH or proposed allocation | No robust superiority → HOLD CASH |
| Unaffordable preferred candidate | M4 Opportunity Cost §12 | No substitution formula | M6.5 execution evidence | HOLD CASH; merit preserved | Unsupported substitution remains blocked |
| Sequential marginal allocation | M5 Monthly §22–23 | No risk simulation | Requires new upstream marginal snapshot | Single supported lot; remaining cash retained | Multi-lot/split missing contract → REVIEW REQUIRED (CR-01) |
| Freshness | M1 §16; M6.1 Architecture §24; M6.4/5 evidence | Compare pinned dates only | asOf/knownAt/validThrough/watermark | Explicit data-quality failure | No invented TTL; mismatched cutoff blocks capital |
| Weekly surveillance | M5 Weekly §16–20/30 | Yes, disposition | Validated evidence and T0–T4 findings | NO ACTION/REVIEW REQUIRED/DECISION REQUIRED | No weekly automatic refresh/trade |
| Quarterly fundamentals | M5 Quarterly §6/18/25/30 | Completeness/routing only | Holding-level evidence and thesis assessments | Review or decision handoff | Missing required sections → REVIEW REQUIRED |
| Annual governance | M5 Annual §15/20–27 | Completeness/routing only | Performance, benchmark, risk and audit references | Governance recommendation | No automatic policy change; unavailable benchmark recorded |
| Event precedence | M5 Operating §2.2; Event §4/29/30 | Yes | Verified effective-dated event findings | Immediate linked escalation | Unverified evidence cannot manufacture decision |
| Behavioral indicators | M5 Behavioral §7–17; Journal §21 | Structured evidence checks | Human-recorded original rationale/indicator | Evidence-linked observation/review | No P&L-based diagnosis; no classifier authority |
| Decision audit | M5 Journal §26; Templates §15 | Calendar reminders only | Original immutable decision/journal | Suggested 3/6/12-month dates; independent quality dimensions | Missing original evidence blocks classification |
| Immutable history/linkage | M6.1; M5 Journal §22–28 | IDs, validation, deduplication | Pinned upstream IDs and append-only records | Review/proposal/journal/audit/execution links | No update/delete; invalid link rejected |

## Vocabulary

Use M6.1 `MONTHLY_DCA` with `WEEKLY`, `QUARTERLY`, `ANNUAL`, `EVENT_DRIVEN`. Review disposition remains exactly NO ACTION, REVIEW REQUIRED or DECISION REQUIRED. Allocation outcome separately uses HOLD CASH, BUY or ACCUMULATE; proposed trade authority is still the referenced M6.5 decision. ESCALATED is workflow status. No eighth Decision State.

## Implementation boundaries

Files: `src/domain/workflow/*`, `src/application/workflow/*`, `src/ports/workflow.ts`, `src/infrastructure/repositories/workflow-artifacts.ts`. Tests: `tests/unit/workflow.test.ts`, `tests/unit/dca.test.ts`, `tests/integration/workflow.test.ts`. See CHANGE_REQUESTS for unsupported upstream semantics; none is silently calibrated here.
