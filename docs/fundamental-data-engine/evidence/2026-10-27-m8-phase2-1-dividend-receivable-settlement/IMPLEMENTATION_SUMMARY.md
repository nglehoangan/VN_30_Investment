# Dividend receivable settlement engine — implementation summary

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Scope: owner-authorized Phase 2.1 implementation and isolated validation only. No Phase 2.2, production posting, source acceptance or migration execution authorized.

New event schema `dividend-receivable-settlement-v1` supports net settlement of an explicitly allocated imported opening RECEIVABLE. Existing accounting engine is extended, not replaced. Allocation and receipt evidence live inside immutable event facts; audit hashes bind their exact contents. No actual GAS/MWG allocation or receipt is accepted or posted.

Trusted authority adapter is an infrastructure dependency with **no production implementation or runtime wiring**. Default repository fails closed on new settlements/reversals; legacy cash credits after settlement enrollment also require canonical receipt resolution. A client acceptance reference alone never authorizes posting. Synthetic authority exists only under tests/fixtures and is never imported by application composition.

Prepared SQL migration expands the existing type CHECK via a lossless table rebuild and adds immutable audit/receipt-owner storage. Executed only against temporary synthetic databases, including already posted legacy records. Actual database retains old schema and data.

|Changed file|Inventory|
|---|---|
|`prisma/migrations/202610270001_dividend_settlement/migration.sql`|NEW|
|`prisma/schema.prisma`|MODIFIED|
|`src/application/portfolio/engine.ts`|MODIFIED|
|`src/domain/portfolio/dividend-settlement.ts`|NEW|
|`src/domain/portfolio/reconstruct.ts`|MODIFIED|
|`src/domain/portfolio/transaction.ts`|MODIFIED|
|`src/infrastructure/repositories/dividend-settlement-guard.ts`|NEW|
|`src/infrastructure/repositories/portfolio-command-schema.ts`|MODIFIED|
|`src/infrastructure/repositories/portfolio-ledger.ts`|MODIFIED|
|`src/ports/portfolio.ts`|MODIFIED|
|`tests/fixtures/portfolio/dividend-settlement.ts`|NEW|
|`tests/integration/dividend-settlement.test.ts`|NEW|
|`tests/unit/dividend-settlement.test.ts`|NEW|

Companion CHANGED_FILE_INVENTORY.json has exact SHA-256. No investment/risk policy, MWAC identity, auth, dashboard, provider or NAV/scoring activation changes. Implementation boundaries: NET only; one whole receipt per event; claim recognition currently restricted to existing OPENING_BALANCE receivables. Gross claims, one receipt split across claims, reallocation of an already-bound parent and new accrual recognition remain unsupported/fail closed.
