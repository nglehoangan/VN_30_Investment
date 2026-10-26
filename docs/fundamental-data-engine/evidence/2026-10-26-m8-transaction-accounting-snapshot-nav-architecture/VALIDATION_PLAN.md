# Validation plan and assessment verification

This turn performs source inspection, exact baseline/input hashing, read-only schema/count/integrity inspection and documentation cross-checks only. No new source code, migration or numerical performance implementation exists, so no new test suite or operational PASS is claimed. Prior78/52/ledger replay evidence remains supporting historical evidence only.

## Future independent accounting tests

Use independently hand-derived golden books plus retained source comparison, not production helper as oracle. Cover deposit versus trade/internal bank transfer, imported opening not contribution, exact fee/tax once, MWAC sale/reversal, effective-time ordering, partial linked settlement and concurrent stale revision. Claim-clearing test must prove cash +95 and receivable −95 with **no second income**, and reject unknown/mismatched/opening claim linkage and over-clear. Test old method versions unchanged; no CASH_ADJUSTMENT repair.

## Current NAV separation tests

A complete current ledger/price/claim/liability/identity source set and missing all daily NAV files must still yield qualified NAV-only output **after authority approval**. Missing imported inception prices blocks since-inception P&L/actionability but not the separately authorized complete current point calculation. Missing current claim/debt/FPT pending valuation, source acceptance, wrong purpose, partial universe, future information, bad hash, revoked identity/source/calendar or stale price must yield unavailable NAV. Existing context/scoring/review gates must remain blocked; no FORMAL flag bypass.

## Snapshot persistence tests

Independent expected canonical totals/hashes; input source substitution; same request/idempotent reuse versus changed-input conflict; concurrent ledger/evidence-head advance; DB rollback of snapshot+audit; old snapshot retained after correction; unambiguous effective heads; original-as-known versus later restated query; immutable evidence and scoped authority. Prove repeat read does not fabricate daily points. Restore test requires latest independently trusted head for rollback-resistance claims; same-host hash/triggers alone insufficient. Migrations only in disposable fixtures until deployment approval.

## Performance tests

No-flow two snapshots simple return; contributions create no gain; nonuniform dated investor flows with known unique XIRR; invalid/no/nonunique root, zero horizon, terminal future/wrong scope, imported initial value and terminal liquidation double count. Test net-only dividend gross analytics unavailable; actual withdrawn dividend versus retained cash. Reconcile absolute economic change with approved P&L increments and expenses without charging trade fees twice. Missing endpoint/flow-time marks returns unavailable, not raw growth/Modified Dietz or invented dates.

## Risk/UI/API tests

Cash-flow adjusted snapshots versus rawNAV rise from DCA; missing intermediate peak/trough; observed drawdown loss bound; unknown drawdown not NORMAL; valid observed breach cannot be suppressed; existing concentration/sector/exception thresholds exact; no automatic selling or risk addition. Separate point concentration from path risk coverage. Dates/statuses visible, broker observations distinct from computed snapshots, corrected version accessible, local no-login viewing works, unauthorized approval/admission/scoring paths fail closed. API v1 compatibility plus additive status DTO cases.

## Candidate regression commands — NOT RUN in this assessment

- Supported Node22.23.2: `node node_modules/vitest/vitest.mjs run tests/unit/portfolio-accounting.test.ts tests/unit/portfolio-read-models.test.ts tests/integration/portfolio-regressions.test.ts tests/integration/current-remediation.test.ts tests/unit/nav-preparation.test.ts tests/architecture/m68-authority.test.mjs`
- `node scripts/check-boundaries.mjs` and TypeScript no-emit checks after code exists.
- Add new meaningful independent snapshot/metric fixture tests only in the authorized implementation slice. Do not run old closure-writer scripts that overwrite sealed evidence. Real provider/independent acceptance must be labelled operational, not synthetic integration.

Release criteria are scoped by capability; full M7 real-money validation remains separately evidenced. Owner must approve contract/method proposals before independent operational acceptance, no implementation begins from this document.
