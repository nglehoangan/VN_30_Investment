# DI Market Data Boundary Amendment — implementation candidate

Start with [FINAL_REVIEW.md](FINAL_REVIEW.md). No independent acceptance or live source qualification is claimed. Production readiness remains false; historical evidence is preserved.

- Versioned governance: docs/08_CONTINUOUS_IMPROVEMENT/DI_MARKET_DATA_BOUNDARY_AMENDMENT.md.
- Contracts/runtime: src/domain/market-boundary, src/application/market-boundary, src/infrastructure/market-boundary-authority.ts, repositories/market-boundary.ts.
- Additive migration validated on disposable fresh DBs and production copy only. No production schema/data write.
- Protected replay: build-protected-review.py uses retained baseline hashes and a disposable /private/tmp/di-market-migration/production-copy.sqlite created via SQLite read-only backup, then migrated with the project-supported Node22.23.2; it writes only this package.
- Validation commands: pnpm lint; pnpm typecheck; pnpm db:validate; pnpm build; node node_modules/vitest/vitest.mjs run; node scripts/smoke-app.mjs --e2e. Baseline suite executed from a clean git archive of startingHEAD with its own generated client. New fixtures are synthetic and cannot qualify a production source.
- Scope: candidate contracts, fail-closed production boundary, additive persistence and tests. No source scraping, automatic price refresh, MBB evidence or actual investment scoring/ranking/Top10.
- Exact baseline/final/focused/remediation case results and gate logs are under validation/. The suite remains red for18 independently reproduced pre-existing missing-source evidence cases.
- Review bundle hashes are not runtime snapshot acceptance. No DI14/15 approval is granted.
