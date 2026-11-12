# CafeF raw close only — CIO review

Implemented the explicit owner field-selection decision. CafeF calculation inputs now require `GiaDongCua`, RAW/CLOSE metadata and the original raw-field pointer. The normalizer converts evidenced thousand-VND values to VND with decimal arithmetic. Missing/invalid raw close fails; adjusted prices cannot substitute. No existing application CafeF history consumer was found; dashboard prices remain on their existing TCBS path.

Historical total-return/backtest inputs require separately verified complete corporate-action coverage and evidenced trading sessions; backtests additionally require PIT evidence. Incomplete inputs return `NOT_QUALIFIED` and no numeric return. This is an input guard, not a new performance engine or source-admission decision.

| S4 item | Current decision |
| --- | --- |
| RAW_CLOSE_CUTOFF | RESEARCH_QUALIFIED |
| ADJUSTED_PRICE_SERIES | EXCLUDED_BY_OWNER_POLICY |
| S4-R4 | CLOSED_BY_SCOPE_EXCLUSION |

Adjustment-methodology documentation is outside the owner-selected scope and must not be requested again. The earlier report's section R4 source-admission proposal remains distinct and pending. Existing cutoff share-count and formal source/PIT limitations are unchanged; this change does not approve source authority, modify portfolio transactions or activate production.

## Validation

- 73/73 tests pass across four suites: new field/unit/fallback/action tests, new application field-access architecture guard and existing market-boundary unit/architecture suites.
- Existing acquisition/evidence tests: 24/24 pass. Skill schema validation passes; boundaries pass for 292 source modules.
- Strict standalone production-domain TypeScript check passes for the normalizer and modified validation module with their dependencies.
- 26 retained source/data files have identical before/after SHA-256, including CafeF1197 rows, the1200-date provider index,3 separate Vietstock gap rows, original XLS/PDF/official receipts and SQLite. No reacquisition was performed.
- Default browser-environment test workers timed out before executing tests. The checked-in scoped configuration runs these pure domain/architecture suites in Node and passes. Configured ESLint and full-project typecheck stalled on existing dependency-file reads and were stopped; no lint/full-project PASS is claimed. See `TEST_RESULTS.json`.

Reproduce scoped tests from repository root:

```sh
node node_modules/vitest/vitest.mjs run --config docs/fundamental-data-engine/vnm-s4-raw-close-policy/2026-11-12/vitest.config.mjs
python3 docs/fundamental-data-engine/vnm-s4-skills/2026-11-11/test_skills.py
node scripts/check-boundaries.mjs
```

## Changed files

- `AGENTS.md`
- `docs/fundamental-data-engine/CAFEF_RAW_CLOSE_ONLY_POLICY.md`
- `docs/fundamental-data-engine/governance/CAFEF_RAW_CLOSE_ONLY_OWNER_DECISION_2026-11-12.json`
- `docs/fundamental-data-engine/vnm-s4-raw-close-policy/2026-11-12/FINAL_REVIEW.md`
- `docs/fundamental-data-engine/vnm-s4-raw-close-policy/2026-11-12/RAW_EVIDENCE_PRESERVATION.json`
- `docs/fundamental-data-engine/vnm-s4-raw-close-policy/2026-11-12/TEST_RESULTS.json`
- `docs/fundamental-data-engine/vnm-s4-raw-close-policy/2026-11-12/vitest.config.mjs`
- `docs/fundamental-data-engine/vnm-s4-skills/2026-11-11/VNM_S4_ACCEPTANCE.md`
- `docs/fundamental-data-engine/vnm-s4-skills/2026-11-11/build_analysis.py`
- `docs/fundamental-data-engine/vnm-s4-targeted-remediation/2026-11-12/FINAL_REMEDIATION.md`
- `docs/fundamental-data-engine/vnm-s4-targeted-remediation/2026-11-12/OWNER_DECISION_SHEET.md`
- `docs/fundamental-data-engine/vnm-s4-targeted-remediation/2026-11-12/TARGETED_FINDINGS.json`
- `skills/fetch-cafef-price-history/SKILL.md`
- `src/domain/market-boundary/cafef-raw-close-policy.json`
- `src/domain/market-boundary/cafef-raw-close.ts`
- `src/domain/market-boundary/validation.ts`
- `tests/architecture/cafef-raw-close.test.mjs`
- `tests/unit/cafef-raw-close.test.ts`

The pre-existing untracked `PRICE_GAP_XLS_UPDATE.md` is outside this change. Raw collector code and all retained source bytes are unchanged. Archived assessment replay is explicitly guarded so it cannot accidentally regenerate current acceptance decisions.

STOP — prepared for CIO review. No production promotion or source-authority approval.
