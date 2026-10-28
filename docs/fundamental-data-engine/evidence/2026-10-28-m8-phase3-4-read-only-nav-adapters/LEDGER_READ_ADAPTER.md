# Portfolio ledger read adapter

2026-10-28 · Phase3.4 SliceA · READ_ONLY_ADAPTERS_ONLY

PortfolioNavLedgerReader receives only Pick<PortfolioLedger,"read"> and an injected digest. It exposes read and snapshot, no commit/post/engine/projection API. Existing optional through-revision semantics are forwarded to the original read API rather than silently ignored. The test composition exposes read only.

read clones ledger inputs, rejects foreign portfolio/non-POSTED rows, canonicalizes transaction order by exact ID and deep-freezes results. Saved transaction facts/legs are not rewritten; canonical order is derived presentation/hash order. Real repository still owns buildTransaction/header/ordered-leg/dividend/intake integrity checks.

snapshot pins exact portfolio/revision/T/K, validates supported request semantics and T<=K, rejects transactions created/event-known afterK, and reuses reconstructPortfolio atT. It returns immutable LedgerRead/history, reconstructed state, exact factsHash/stateHash, ledger revision, economic cutoff and knowledge cutoff. It checks optional expected hash formats/content, then rereads ledger and compares both revision and full read content to reject stale or same-revision replacement. Provider repeats snapshot after broker reads and checks exact state/facts; no mixed revision result is allowed.

The financiallyComplete flag is always false: replay integrity or recorded payable0 does not establish source completeness, accepted opening boundary or forward coverage. MWAC/cost basis are produced solely by existing accounting reconstruction; no alternative calculation or balance plug.

Actual retained opening scope replay:12transactions/24legs/11holdings; cash232420, receivables570000, payable0; state/facts/legs/projection exact. validation/actual-ledger-adapter.json is real read-only adapter execution at retained openingT with honestly recorded currentK; it is not current NAV, AS_KNOWN history or financial acceptance. No actual DB write/migration/import occurs.
