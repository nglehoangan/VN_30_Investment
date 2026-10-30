# B6 — findings

Review date:2026-10-28. Existing code reviewed; no production activation or accounting migration.

|ID|Severity|Finding|Required next action|
|---|---|---|---|
|B6-01|Major|Owner data decisions are saved outside runtime. Active ledger has cash232420/receivable570000/payable0 vs owner28Oct327420/475000/420.|Implement a scoped dated personal-account input/read model, reconcile receipt and fee without inventing or duplicating ledger events. Verify all11holdings, FPT200+20 and imported-basis P/L in the real personal flow.|
|B6-02|Major|ReadOnlyNavInputProvider deliberately returns blocked; no real accepted identity/source/price/calendar/independent-acceptance bindings.|Implement the authorized personal-scope integration and validate its actual market-date/source scope. Do not bypass production authority gates or treat owner documentary resolutions as a configured runtime provider.|
|B6-03|Major release-check failure|pnpm lint exits1:16errors plus4warnings, including explicit-any in fixtures/tests and unused imports/variables.|Remediate active source/test lint issues; the historical sealed verifier warning needs a scoped tooling treatment preserving sealed bytes, not silent seal edits or blanket lint suppression.|
|B6-04|Unmet release gate|Existing automated tests/browser fixtures are supporting producer evidence. M7 independentE3 expected-vs-actual material accounting/decision evidence and final authenticated release decision are absent.|Complete independent gate evidence and exact scope release decision; retain no-GO until satisfied.|

B1/B2/B4/B5 personal-scope decisions remain valid and are not reopened as requests for more user PDF/Excel. Missing runtime implementation is engineering work, not missing user statements. PendingFPT availability stays unknown until confirmed. Production/B7 deployment remain separate.

No source code fixed during this validation campaign; lint finding remains explicit. Browser screenshots are isolated SYNTHETIC TEST ONLY, not live portfolio evidence.

## Full-suite findings

Full Vitest run:2462tests,2434passed,28failed,0pending. Preserve every failure in TEST_SUMMARY.json and rawvalidation/vitest.json. Migration assertions compare entire historical schema to latest and fail on ledger_transaction changes; investigate expected permitted migration changes before changing tests. Registry table inventory also differs. Opening-receivable adapter synthetic seam fails DataIntegrityError (do not infer live database corruption); inspect current guard query capabilities in mock before changing production validation. Dashboard optional research issue assertion fails; determine current retained research contract before relaxing isolation. Source-authority pin mismatch on transaction.ts blocks exact approved-bundle use. Cleanup-era missing paths are historical replay limitations, not a request to restore deleted old data.
