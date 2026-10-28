# Legacy accounting and contract compatibility

2026-10-28 · Phase3.4 SliceA · READ_ONLY_ADAPTERS_ONLY

No pre-existing source, test, policy, Prisma/migration, retained broker/market/financial data or sealed evidence file is changed. Only additive source/fixture/test/evidence files are introduced. Existing CurrentNavInputProvider, CurrentNavReadService, current-nav V1 result/request/plan and qualification/calculation code remain byte-identical to approved baseline.

Existing portfolio/accounting, dividend settlement, forward intake and Phase3.2 NAV regression suites pass in the recorded combined run. All authoritative financial arithmetic/replay uses unchanged m63-mwac-decimal12-half-even-v1 and reconstructPortfolio; no recalculated imported basis or second ledger. Read wrapper canonicalizes only derived history/hash order and forwards optional through revision.

Actual SQLite opened only through Node DatabaseSync(readOnly:true) helpers.12POSTED opening transactions and24ordered legs rebuild exactly with existing buildTransaction and agree byte-for-byte serialized;11holdings and cash232420/receivables570000/payable0 agree with retained projection. PRAGMA integrity_check=ok, foreign-key check clean. New adapter snapshot preserves identical economics at retained opening cutoff; financiallyComplete remainsfalse. That is actual read-only validation, not current NAV readiness.

Disposable SQLite test setup posts synthetic fixtures and prepares test-only schema. Corruption fault injection first asserts immutable trigger refuses a leg update; only in its private disposable DB the test temporarily removes that one trigger to simulate on-disk corruption, verifies repository/adapter rejection, then restores original row and trigger in finally. This is not weakening production validation or executing production migrations. Actual database/schema/history/policies/candidates/authority/scoring remain hash-identical.
