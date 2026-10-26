# M8 architecture impact assessment closure

Final decision: **READY_FOR_OWNER_REVIEW**. Twelve required design/impact deliverables complete. Implementation NOT started.

Main finding: current repository already uses transaction-based MWAC accounting and point-in-time NAV. No executable requirement for complete daily Historical NAV was found in the inspected core path. Existing M2 design explicitly permits derived valuation snapshots. New work should focus on snapshot persistence/provenance, capability-specific readiness and performance/risk readers, not a replacement ledger or daily NAV backfill.

Critical compatibility distinctions: imported inception NAV remains necessary for since-inception economic P&L and existing composite actionability; current NAV-only can be separately qualified without a daily path. Risk Policy still requires cash-flow-adjusted drawdown; sparse observed data cannot replace official path risk, imply NORMAL or waive approved thresholds. XIRR needs exact investor flows and valid terminal snapshot, not daily NAV; official strategy return remains approved TWR/unitization.

A newly identified implementation contract limit requires review before forward cash reconciliation: DIVIDEND_CASH adds cash/income, TRADE_SETTLEMENT only clears BUY/SELL claims, so imported opening receivable must not be left outstanding when separately posting its dividend receipt. Proposed versioned non-trade claim handling is D4, not a fix implemented now.

Actual data12 opening transactions/24 legs,11 holdings,450 broker records and no corporate-action rows remain unchanged. 17 historical trades/29 securities events/93 cash rows are verified offline sources but not admitted production events. Rebase/pre-inception imports, current FPT availability, claim/debt/basis reconciliation and accepted NAV-purpose identity/source/calendar remain unresolved. Daily2025/TPB price gaps are optional historical enhancements for current management, not waived evidence for those unresolved current components.

Retained M7 report has restrictive release verdict/candidate status and open independent evidence; this direction does not certify full M7 real-money support. Future scoped readiness must preserve that distinction and resolve exact baseline manifest/approval evidence. Stale M8 summary pointer should be updated additively in authorized documentation follow-up, not by rewriting sealed closures.

BASELINE_IMPACT_MATRIX.md/JSON classifies36 affected existing/proposed groups with rule/proposal/risk/approval/migration implications. Roadmap is accounting/reconciliation → current NAV → auditable snapshot storage → per-metric performance → risk analytics. D1–D9 are review decisions, not approvals fabricated here. No new infrastructure or login proposed as an implemented dependency.

Safety verified in ASSESSMENT_VERIFICATION.json and SAFETY_VERIFICATION.json: current protected files/source/policies/database hashes unchanged, SQLite inspected read-only, no new code/tests/migrations, no ledger or historical evidence edits, no provider calls, source/identity approvals, NAV/D2/scoring activation or milestone advancement.

Stop after assessment; await explicit owner authorization of concrete contracts/implementation slice before changes. Architecture direction approval is recorded only for scope, not production acceptance.
