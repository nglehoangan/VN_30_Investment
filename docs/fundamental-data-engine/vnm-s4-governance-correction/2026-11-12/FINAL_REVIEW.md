# VN30 S4 governance correction — CIO review

Baseline: `23dfc97284cf3602496a545564aa1835ece9486b`.

**The17-fact VNM research admission is PENDING_EXPLICIT_OWNER_APPROVAL.** Economic evidence remains `READY_FOR_OWNER_ADMISSION`; readiness is not authorization. The earlier assistant interpreted an ambiguous “Approve với điều kiện” task statement as explicit approval of the exact proposal. The conversation does not establish that authorization. An assistant recommendation or generated receipt cannot supply it.

[The correction/supersession record](../../governance/VNM_S4_APPROVAL_PROVENANCE_CORRECTION_2026-11-12.json) pins the unsupported receipt and original proposal hashes. The old receipt is **preserved byte-identical for audit only**, with no current approval authority. [Current admission status](CURRENT_ADMISSION_STATUS.json) references the unchanged proposal rather than rewriting its17 facts or source hashes. This correction request itself is not admission approval.

| Scope | Corrected current status |
| --- | --- |
| VNM17-fact research admission | **PENDING_EXPLICIT_OWNER_APPROVAL**, authorization=null. |
| Economic evidence readiness | **READY_FOR_OWNER_ADMISSION** — unchanged56,900VND raw close,15 historical cash components and2,089,955,445 carried-forward shares. |
| R1 | **CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY** — separately authorized policy preserved. |
| R4 | **CLOSED_BY_SCOPE_EXCLUSION** — separately authorized raw-close-only/exclusion policy preserved. |
| R3 | **RESTRICTED_TO_HISTORICAL_COMPLETENESS** — no new cutoff-value veto. |
| F1 / F2 formal consumption | **OPEN** under the same existing contracts; no authority promotion. |
| Historical PIT / total return | **NOT_QUALIFIED** by this package. |
| Reusable skill | **READY_FOR_CIO_REVIEW_AS_OFFLINE_RESEARCH_BASELINE**; no research/formal source admission or production authority granted. |

## Provenance enforcement

The skill now emits separate `research` (evidence readiness) and `ownerAdmission` fields. The offline runner has **no owner verifier installed** and always leaves admission pending, even if an input says `EXPLICITLY_APPROVED`, contains PASS booleans or references the superseded receipt. It never manufactures an authorization reference.

The isolated `owner-decision.ts` verifier helper distinguishes proposed records from exact owner-authorized records for a separate trusted host. Recognition requires an actual retained authorization reference, an independently verified original OWNER-authored APPROVE decision, owner identity, matching proposal hash/path/pointer, ticker, cutoff, research purpose and a non-superseded record. A request cannot provide its own trusted verifier. The helper's positive tests use explicitly synthetic SYN records only; no real VNM approval is created. Recognizing a research authorization separately still cannot close F1/F2 or activate production.

[Corrected VNM acceptance](replay/VNM/2026-10-30/ACCEPTANCE.json) and [evidence](replay/VNM/2026-10-30/EVIDENCE.json) are versioned successors to the earlier replay, whose original files remain audit history with a supersession pointer. Price, actions, shares, source pins, original receipts and the input fixture remain unchanged; only acceptance/provenance fields change. Updated AGENTS/skill instructions, summaries, targeted findings, migration notes and CIO checklists no longer inherit the unsupported approval.

## Remaining F1/F2 requirements — unchanged

- **F1:** independently accepted CaféF adapter/capability, source/request, dated30Oct HOSE session/observation-time policy and valuation-purpose raw replay binding. Existing economic price/date/unit evidence is sufficient. Rules: [`RetainedMarketAuthority`](../../../../src/infrastructure/market-boundary-authority.ts) `approve`, `adapter`, `replayCapability`, `replayMarket`; [`BoundaryLifecycle`](../../../../src/application/market-boundary/lifecycle.ts) `qualifyCapability`, `acceptMarket`, `validateAnalysisForConsumption`; market validation time/source/semantics checks. No new discovery or price pipeline is requested.
- **F2:** actual financial-fact publication/availability/source-role assessments and formal-run bindings for15 cash components plus shares, under [`Evidence::validateTime`](../../../../src/domain/scoring/evidence.ts), lines43–61. Reuse the eight retained VSDC update clues; DATE_ONLY is permitted when qualified with timezone/provenance. Original-publication facts remain unestablished for event IDs178865,173284,173285,163678,157497,157500,147849 and the selected Q3 PDF in the reviewed bindings. Keep these specific unknowns or qualify an existing permitted corroboration route; do not invent publication timestamps or backdate November availability. No new share certificate or repeated economic reconciliation.

[The detailed residual/CIO sheet](../../vnm-s4-reusable-skill/2026-11-12/RESIDUAL_BLOCKERS_AND_CIO_CHECKLIST.md) remains current with corrected approval status. R1/R4 are not reopened.

## Validation and changed files

**119/119 scoped TypeScript tests (14new governance cases) and34/34 Python tests pass.** The177 governance checks verify52 protected files unchanged,35 distinct proposal source pins,17 unchanged facts and byte-identical corrected replay. [VALIDATION.json](VALIDATION.json) records scoped TypeScript/Python results, skill schema/typecheck/boundary checks, deterministic VNM replay, retained-byte preservation and governance consistency. This is not a full application-suite or configured-lint PASS claim. Reproduce:

```sh
node node_modules/vitest/vitest.mjs run --config docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/vitest.config.mjs
node node_modules/typescript/bin/tsc -p docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/tsconfig.json
python3 -B scripts/test-share-count-carry-forward.py
python3 -B docs/fundamental-data-engine/vnm-s4-skills/2026-11-11/test_skills.py
python3 -B docs/fundamental-data-engine/vnm-s4-governance-correction/2026-11-12/validate_governance.py
node skills/vn30-market-price-corporate-actions/scripts/runtime.mjs --input docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/VNM_INPUT.json --out docs/fundamental-data-engine/vnm-s4-governance-correction/2026-11-12/replay
```

Changed files:

- Governance: new correction/supersession JSON; original unsupported receipt unchanged.
- This dated directory: current status, preservation receipt, corrected replay, consistency validator/results and this report.
- `skills/vn30-market-price-corporate-actions/`: SKILL.md, contract/migration notes, review orchestration and new `scripts/owner-decision.ts`.
- `tests/unit/vn30-market-price-corporate-actions.test.ts`, `tests/fixtures/vn30-s4/owner-{proposal,authorization}.json`: provenance regression cases, explicitly synthetic.
- `AGENTS.md`, previous reusable-skill review/CIO sheet, source-admission summary/owner sheet and targeted findings: corrected active statuses and supersession pointers.
- Earlier replay directory: `SUPERSEDED.json` only; original replay bytes retained.

## Final CIO checklist

- [x] Preserve unsupported receipt; record provenance correction without claiming authorization.
- [x] Mark exact17-fact admission pending; preserve facts/source hashes and separately authorized R1/R4 policies.
- [x] Distinguish proposal readiness, independently verified explicit owner authorization and formal/PIT/production contracts in code/tests.
- [ ] Obtain a real owner-authored authorization reference for the exact17-fact retrospective proposal.
- [ ] CIO accepts the corrected reusable research baseline.
- [ ] Resolve and independently accept F1/F2 before any formal S4 closure.

No reacquisition, M3/M4 edits, portfolio mutation or production activation. **STOP for CIO review.**
