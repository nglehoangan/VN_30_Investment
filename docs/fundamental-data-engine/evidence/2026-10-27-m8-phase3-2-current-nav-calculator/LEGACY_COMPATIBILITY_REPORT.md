# Legacy Compatibility Report

Date: 2026-10-27. Scope: Phase 3.2 isolated implementation only.

All pre-existing tracked and retained-data bytes are checked against PROTECTED_INPUT_HASHES.json; SAFETY_VERIFICATION.json records outcome. No edits to frozen policy, portfolio domain, MWAC identity, old valuation/reconciliation/P&L, current dashboard/API/reader, market boundary, identity contracts, Prisma schema/migrations or production composition.

Read-only actual SQLite replay checks each of12original transaction facts, headers and24ordered legs against existing buildTransaction; JSON serialization matches and reconstructed11holdings/cash/claims/payables match saved projection. `validation/opening-replay.json` is actual read-only evidence, not synthetic acceptance. Helpers copied additively from Phase2.3; no sealed prior report overwritten.

`validation/actual-nav-blocked.json` exercises the new service with actual read-only ledger and intentionally unavailable operational input provider/no authority: NAV_BLOCKED. It validates default fail-closed behavior; it does not test an actual accepted NAV path. Synthetic SQLite integration writes only disposable test databases and asserts no read-service writes.

Legacy regression suites retain accounting, settlement, intake, correction, concurrency and migration behavior in isolated databases. No actual migration execution or transaction import.
