> Superseded governance status and replay: see [current correction/readiness report](../../vnm-s4-governance-correction/2026-11-12/FINAL_REVIEW.md). Earlier validation numbers are historical; they are not new governance-remediation results.

# Reusable VN30 S4 skill — CIO review

Created [the reusable skill](../../../../skills/vn30-market-price-corporate-actions/SKILL.md), its [input/output contract](../../../../skills/vn30-market-price-corporate-actions/references/contract.md) and [migration notes](../../../../skills/vn30-market-price-corporate-actions/references/migration.md). It performs deterministic, source-pinned offline research review for one ticker/exchange/cutoff, delegates raw selection and share carry-forward to existing code, and never admits a source or activates production.

The [approval-provenance correction](../../governance/VNM_S4_APPROVAL_PROVENANCE_CORRECTION_2026-11-12.json) supersedes the unsupported conditional-approval claim. The original receipt is preserved only for audit;17-fact admission is **PENDING_EXPLICIT_OWNER_APPROVAL**. **R1/R4 remain CLOSED; R3 is limited to historical completeness. F1/F2 remain OPEN and formal S4 is NOT_CLOSED.** [Exact residual requirements and the final CIO checklist](RESIDUAL_BLOCKERS_AND_CIO_CHECKLIST.md) separate accepted economics, retained publication clues, actual later knowledge and missing executable bindings. No new economic reconciliation, share certification, adjusted-price methodology or broad discovery is required.

**105/105 TypeScript checks (32new,73existing) and34/34 Python checks (10carry-forward,24acquisition) pass.** Validation covers the requested14 scenarios plus failure/identity/output boundaries, using retained VNM and two synthetic tickers. [Machine results](VALIDATION.json) record the actual counts and limits. Original45 source/database files remain byte-identical; the real VNM CLI replay is byte-identical on rerun. Synthetic output is marked `SYNTHETIC_TEST_ONLY` and cannot imply live admission.

The configured ESLint attempt stalled in an existing `globalthis` dependency read and was stopped after more than4minutes. No lint/full-application-suite PASS is claimed. Scoped TypeScript, architecture, skill-schema and Python checks pass. This does not close independent governance acceptance.

Reproduce from repository root:

```sh
node node_modules/vitest/vitest.mjs run --config docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/vitest.config.mjs
node node_modules/typescript/bin/tsc -p docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/tsconfig.json
python3 -B scripts/test-share-count-carry-forward.py
python3 -B docs/fundamental-data-engine/vnm-s4-skills/2026-11-11/test_skills.py
node scripts/check-boundaries.mjs
node skills/vn30-market-price-corporate-actions/scripts/runtime.mjs --input docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/VNM_INPUT.json --out docs/fundamental-data-engine/vnm-s4-governance-correction/2026-11-12/replay
```

Changed files for review:

- `skills/vn30-market-price-corporate-actions/`: SKILL.md, `agents/openai.yaml`, two references, shared orchestration TypeScript and offline runtime.
- `src/domain/market-boundary/cafef-raw-close.ts`: factor the unchanged raw/date/unit/decimal selection into a shared function; the existing full Observation contract retains its identity/time requirements.
- `tests/unit/vn30-market-price-corporate-actions.test.ts`, `tests/fixtures/vn30-s4/{SYN,XYZ}.json`: reusable behavior and isolation tests.
- This dated review directory: VNM input/replay, scoped test/typecheck configurations, validation results, residual/CIO checklist and this review.
- `docs/fundamental-data-engine/governance/VNM_S4_CONDITIONAL_RESEARCH_APPROVAL_2026-11-12.json`: superseded unsupported receipt, preserved for audit only.
- Existing source-admission summary/owner sheet and targeted findings: successor notice for the conditional decision; original proposal and raw evidence remain unchanged.
- `AGENTS.md` and the two existing fetching SKILL.md files: route S4 review to the new skill without changing their collectors or storage behavior.

No M3/M4, portfolio, SQLite, source-authority registry, sealed evidence or production activation changes. **STOP for CIO review.**
