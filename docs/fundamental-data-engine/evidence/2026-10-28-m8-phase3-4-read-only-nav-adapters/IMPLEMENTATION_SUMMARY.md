# Read-only NAV adapter implementation

2026-10-28 · Phase3.4 SliceA · READ_ONLY_ADAPTERS_ONLY

Final status: READY_FOR_OWNER_REVIEW, isolated SliceA only. Owner request approves Phase3.3 commit `0f3a4dabcd06912981df2b9d07be80ee557c421e`; this is implementation scope authorization, not authenticated source/identity/independent acceptance or deployment permission.

Implemented A1 immutable ledger read/snapshot wrapper, A2 bounded immutable observation-envelope reader, A3 always-blocked CurrentNavInputProvider skeleton and A4 test-only isolated composition. A5 deterministic synthetic/disposable SQLite validation and actual retained-ledger read-only replay are documented in TEST_RESULTS.md.

|Component|Implementation|
|---|---|
|Contracts|src/ports/nav-read-adapters.ts: versioned observation/pin, ledger snapshot and typed blocked preparation|
|A1|src/application/current-nav/ledger-read-adapter.ts: PortfolioNavLedgerReader|
|A2|src/infrastructure/current-nav/broker-evidence-reader.ts plus infrastructure/config/nav-broker-observations.ts|
|A3|src/application/current-nav/input-provider-skeleton.ts: ReadOnlyNavInputProvider|
|A4|tests/fixtures/nav-adapter-composition.ts: read-only result/preparation wrapper, no production import|
|Fixtures/tests|tests/fixtures/nav-adapter-evidence.ts; tests/unit/nav-read-adapters.test.ts; tests/integration/nav-read-adapters.test.ts|

Reused unchanged: PortfolioLedger.read and PrismaPortfolioLedger integrity checks/transactions; reconstructPortfolio and existing accounting implementation; Decimal/decimal/shareQuantity; deepFreeze; exactJson lossless/duplicate-key parser; snapshotHash; CurrentNavReadService and approved calculator. No second accounting/valuation/acquisition engine.

Pre-implementation contract conflict is recorded in IMPLEMENTATION_BOUNDARY_DECISION.md: old provider requires complete plan|null, while SliceA cannot legitimately provide one. Add typed partial outcome alongside the interface and return null via load; no amendment to any existing approved port/request/result/calculator is needed. Existing broker UI snapshot/parser lacks account/exact decimal semantics needed here, so this reader has a narrowly explicit observation-envelope schema. No automatic real-source converter is added.

Only new files are added. No source approval, accepted bridge, new trust/auth mechanism, financial reconciliation evaluator, market qualification, independent acceptance or publication/deployment slice B–G is implemented.
