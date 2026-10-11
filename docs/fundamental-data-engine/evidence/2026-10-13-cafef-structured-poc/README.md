# CafeF structured-financial ingestion POC

This dated bundle records an isolated, non-destructive ingestion experiment for the exact 30-symbol Project Owner universe. It does not certify current official membership or change the approved M3 model, manual-first architecture or initialization gates.

## Implementation plan and resulting pipeline

1. Inspect existing fact/capture contracts, normalization, canonical concept definitions, M3/sector requirements, provider collectors, manual review evidence and validation boundaries.
2. Verify actual public endpoint payloads and the HPG, bank, securities and property templates.
3. Retain bounded, sequential HTTP attempts and hash exact raw bodies before any normalization; cache by request with body integrity checks.
4. Normalize into an isolated provider projection of existing financial fact dimensions/IDs, retaining report period kind separately from STOCK INSTANT observations; apply mapping, zero-pattern, identity, conflict and temporal controls.
5. Build review-only canonical candidates, effective-period selection, requirement coverage, cross-endpoint checks and four-PDF verification. Validate deterministic replay, preserve production data, stop for review.

CafeF API → ignored raw archive → normalized provider facts → validation/quarantine → canonical REVIEW_CANDIDATE groups → safe component sums/coverage/reconciliation. None of these layers writes production repositories or the manual snapshot.

## Artifacts

- cafef_request_inventory.json: 364 systematic requests, parameters, status, retrieval time, hashes and raw paths. Annual page2 was needed for TCX; all 30 symbols attempted NAM/QUY/LUYKE across all four endpoint families.
- cafef_exploratory_sample_manifest.json: 11 retained schema-probe bodies; incomplete probe timestamps/status are explicitly null. Systematic request inventory owns coverage denominators.
- cafef_template_inventory.json / cafef_period_inventory.json: observed templates, namespaces, metadata and classified report periods.
- cafef_coverage_matrix.csv / cafef_metric_summary.csv: provisional metric-symbol coverage and exact denominators; no production admission percentages.
- cafef_requirement_group_coverage.csv: preserves existing anyOf requirement-group semantics.
- cafef_anomalies.csv / cafef_reconciliation.csv: suspicious zeros, malformed periods, CF ambiguity, accounting identities, cash comparisons and Detail/Summary comparisons.
- cafef_pdf_validation_sample.csv / cafef_pdf_sample_cell_observations.json: four-symbol POC visual/page and retained-reader evidence; does not amend canonical manual facts.
- cafef_symbol_summary.csv: annual/current-quarter/current-YTD availability and effective analysis report frame.
- `CAFEF_POC_REVIEW.md`: the 15 required review answers and recommendation.
- CAFEF_POC_SUMMARY.json, cafef_independent_replay.json, cafef_open_issues.json, VALIDATION_REPORT.json and ARTIFACT_HASHES.json provide machine-readable outcomes and integrity.


## Raw retention

Raw bodies and normalized/canonical candidate files are retained under `data/providers/cafef/poc-2026-10-13/`. The repository's existing /data/ ignore policy is respected; no large raw set is added to git. Manifests bind hashes/paths; four reduced actual-response fixtures support portable deterministic regressions. Local evidence/raw retention is necessary to replay this bundle, including existing sampled PDFs/readers. No network or DB write is needed for offline replay.

## Commands

Use the repository-supported Node >=22.23.2 <23. All commands were run from the repository root.

```sh
node scripts/fetch-cafef-poc.mjs                 # explicit public POC acquisition, 1.25s interval, max2 attempts
node scripts/fetch-cafef-poc.mjs --offline       # exact cached replay; missing cache fails before HTTP
node scripts/analyze-cafef-poc.mjs              # raw-hash verification and isolated evidence; refuses sealed bundle
node scripts/verify-cafef-poc.mjs               # independent source/semantics/production-preservation check
pnpm exec vitest run tests/unit/cafef-poc.test.ts tests/unit/manual-first.test.ts tests/integration/manual-first.test.ts
pnpm exec tsc --noEmit
node scripts/check-boundaries.mjs
pnpm exec eslint src/infrastructure/fundamentals/cafef.ts src/infrastructure/fundamentals/cafef-transport.ts src/shared/validation/cafef.ts scripts/fetch-cafef-poc.mjs scripts/analyze-cafef-poc.mjs scripts/verify-cafef-poc.mjs tests/unit/cafef-poc.test.ts --max-warnings=0
```

`data:cafef:fetch` and `data:cafef:analyze` are convenience scripts. This dated run becomes immutable after sealing. Re-analysis/acquisition requires an explicitly new dated namespace rather than overwriting the reviewed bundle.

## Boundaries

The existing FundamentalRawCapture validator is reused. Provider fields are a typed projection of FundamentalObservation rather than a second production financial model. Source-specific runtime schema validation lives in shared/validation per repository rules. Decimal normalization and safe calculations reuse existing exact accounting arithmetic. Existing manual qualification/canonicalization retains authority. Unknown publication, scope, units and fiscal calendars remain explicit.

The collector uses allowlisted public endpoints, timeout, bounded retry/backoff, identifying user-agent, fixed rate limiting, size limits, JSON validation and raw retention. HTTP401/403/429 stops all acquisition without bypass. No credentials are sent. Summary only reconciles; it does not fill canonical candidate holes. All estimates/annualization are absent. No stock snapshots are summed over reporting windows.

The retained PDF skill was used for the focused visual sample. Only four original FY2025 PDFs and selected pages were examined; prior corpus packages and the current manual sidecar are unchanged.
