# M8 local application readiness closure

**Review complete; reliable local portfolio/analysis readiness: BLOCKED. Await owner review.** The application can start and display its shell without login, but the retained portfolio is not currently usable through authoritative live views.

## Prerequisite

The user's explicit “Approve” reply approved the PEC-1D Authentication Deferral Amendment before M8 began. PREREQUISITE_APPROVAL.json records that scoped instruction. Google OIDC/authentication remain DEFERRED_BY_OWNER. This is not a source-authority, independent-validation, migration or scoring approval.

## Actual outcome

A fresh production build passed and the app ran exclusively on 127.0.0.1 against the actual retained SQLite database. Eighteen real browser routes returned HTTP 200 without login/session/JS errors, navigation worked and redacted desktop screenshots were visually checked. SQLite integrity/FKs and Prisma connectivity pass. These observations establish local runtime/shell availability, not working portfolio data.

The current ledger validator rejects one of twelve retained opening transactions: the saved cash record includes a nonzero RECEIVABLE from opening.receivable, whereas the current builder regenerates CASH only. Saved facts/relational legs agree, and eleven other records replay identically. The aggregate therefore correctly fails closed. Cash/holdings/cost basis/history are withheld; the UI also misleadingly shows empty-portfolio/history copy. No validation bypass, receivable removal or data repair was made.

Retained rebuilt financial JSON/PDF/API data exists, but the dashboard research adapter still targets the intentionally removed legacy layout. Formal financial snapshots/independent acceptance are absent. Current accepted market/reference data is unavailable, so current NAV/actionability is blocked. Complete current membership query and performance time-series/benchmark/TWR/XIRR/CAGR are not implemented in the current UI. No subsequent trade/dividend ledger history is available to validate those live workflows.

## Tests versus readiness

135 synthetic unit/UI/accounting/runtime tests and 87 PEC-1B/PEC-2 regressions passed (222 total). They are explicitly not live runtime acceptance of missing/blocked features. Actual runtime evidence found blockers despite those green tests. Build completed with four existing filesystem tracing warnings. Sandbox launch denials were resolved through authorized review execution permissions; diagnostic BigInt serialization was corrected losslessly. The financial contract mismatch remains unresolved.

## Safety and recommendation

The review only performed build/read-only GET/browser/Prisma/SQLite diagnostics and synthetic tests. Production policies, source/approval/admission/activation contracts and actual database contents remain unchanged; twelve prior seals are verified. Eight original source candidates stay DEFERRED; no source approval, effective admission, D2 or scoring activation is created. The review server was stopped. No migrations, authentication implementation or new milestone work occurred.

Use the local UI only to inspect its blocked/empty states and retained evidence limitations. Do not rely on withheld balances/NAV or treat empty copy as proof no portfolio exists. Owner should review the specific ledger-compatibility, rebuilt-data adapter and accepted-market/reference gaps before authorizing a separately scoped remediation. Do not weaken gates, remove the receivable, restore deleted legacy folders or activate scoring to obtain a working-looking screen. Stop after this M8 review and await owner approval.

## Deliverables

- [Local runtime inventory](LOCAL_RUNTIME_INVENTORY.md)
- [Feature readiness matrix](FEATURE_READINESS_MATRIX.md)
- [Data availability report](DATA_AVAILABILITY_REPORT.md)
- [Security boundary review](SECURITY_BOUNDARY_REVIEW.md)
- [Validation results](VALIDATION_RESULTS.json)
- [Blockers](BLOCKER_STATUS.json)

Live evidence is LIVE_RUNTIME_RESULTS.json, ACTUAL_DATA_RECONSTRUCTION.json, LEDGER_DIAGNOSTIC.json and redacted screenshots under validation/. Final sealed safety receipt is validation/safety-verification.json; it must have packetSealChecked=true. A SHA-256 seal proves integrity only, not readiness/approval.

## Final evidence totals

Safety verification rehashed 7,150 protected pre-existing files and twelve prior seals, with unchanged database bytes/logical contents/counts/approval metadata. All eight candidates remain DEFERRED, no admissions/activation/migrations occurred, and the owned review server is stopped. The 18-page live browser review and the 222 synthetic regression tests are separate evidence classes; overall feature readiness remains BLOCKED.
