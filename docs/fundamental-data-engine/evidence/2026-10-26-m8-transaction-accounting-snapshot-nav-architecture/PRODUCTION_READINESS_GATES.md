# Production readiness gates

Daily full historical NAV is **OPTIONAL HISTORICAL ENHANCEMENT** for current portfolio management under owner-approved direction. The following are current evidence assessments, not operational permissions.

|Capability|Code/evidence readiness|Actual production status / minimum gate|
|---|---|---|
|Existing accounting replay/local views|READY for retained supported opening mechanics; owner-approved ledger remediation evidence exists|Current external accounting completeness PARTIALLY_READY: preserve12/24 replay; resolve570,000 claim classification,105 debt scope, pending FPT and exact basis/forward-event reconciliation before reliable use|
|New transaction intake and current holdings|PARTIALLY_READY: 17/29/93 raw source rows reconciled offline|BLOCKED for unreviewed import: approved exact-source mapping, supported opening, no duplicate pre-inception buys, revision/idempotency and actual current pending/ordinary/availability reconciliation|
|Current NAV|PARTIALLY_READY point math, BLOCKED authority/economic composition|Accepted PORTFOLIO_NAV source/calendar/identity and all held prices at valid asOf; complete cash/receivables/liabilities/pending valuation; exact reconciliation; current evidence/heads. Does not require2025 prices/TPB daily history for a portfolio with no TPB now|
|NAV snapshots|BLOCKED: logical design exists, durable operational contract/storage not implemented|Approve D1/D2/D3, implement atomic append/correction/query, independently validate and approve concrete target migration separately. No new snapshot acceptance until NAV gate passes|
|Accounting analytics|PARTIALLY_READY replay outputs; totals scoped to supported book|Realized P&L/dividends valid only for admitted supported opening/forward events; historical XLSX summaries remain source observations|
|Unrealized/total P&L|BLOCKED where current NAV/basis or beginning valuation absent|Current qualified price+basis for unrealized; start/end NAV+flows for total. Missing daily history alone is not a blocker|
|XIRR|BLOCKED / NOT_IMPLEMENTED|Approved dated-flow/terminal/inception/perimeter method and unique validated numeric result; no daily NAV prerequisite|
|Snapshot returns / observed drawdown|PARTIALLY_READY design only, implementation BLOCKED|Accepted samples + exact flow adjustment; sampling disclosure; risk/workflow measurement amendment before official band use|
|Current concentration/cash risk monitoring|BLOCKED current inputs, independent of full daily history|One complete qualified NAV snapshot, sectors/identity and same-time policy inputs. Unknown drawdown prevents claims of full risk clearance; policy/approval gates retained|
|Official full risk/scoring/actionability|BLOCKED unchanged|Existing risk-policy/M7 independent evidence/formal source/decision gates, not waived by NAV display or architecture approval|
|Daily NAV/benchmark historical research|OPTIONAL, current evidence PARTIAL_PRICE_COVERAGE|Historical TPB/earlyprices/adjustment/2025 calendar/CA gaps remain for that workstream only|

Minimize current snapshot requirements to its actual valuation date: an accepted current FPT instrument/availability/claim reconciliation can support future current snapshots without reconstructing the exact historical conversion day, **provided** its current effective interval and evidence are explicit and source-qualified. It does not retroactively validate the unknown past. Similarly complete current debt/claim proof can supersede uncertainty prospectively via approved accounting correction, never by assuming old105 debt vanished or carrying it forever.

No-login policy remains: ordinary local accounting/research viewing is allowed under integrity gates. Source/identity/independent acceptance blocked where authenticated operational evidence absent. Do not implement login, install providers or replace approval with OS username/local JSON/chat/Codex. External authenticated acceptance is an unapproved architecture option, not an existing permission.

No arbitrary materiality or stale-price thresholds introduced. Keep exact reconciliation; if owner wishes immaterial residual tolerances, require a separate method amendment and explicit residual handling before code. No readiness flag expands VALUATION to PORTFOLIO_NAV or NAV to INVESTMENT_ACTIONABILITY/PRODUCTION_SCORING.
