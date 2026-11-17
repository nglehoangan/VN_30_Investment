# VNM retained mapping and admission adapter

All five requested adapter components are implemented in `src/infrastructure/source-admission/retained-mapping.ts`. The executable entry point is `scripts/run-vnm-retained-admission.mjs`. No live DB writes, scoring changes or source-authority amendments are performed.

## Execute

```sh
python3 scripts/map-vnm-retained-financials.py
python3 scripts/test-vnm-retained-financial-mapping.py
node scripts/run-vnm-retained-admission.mjs
node node_modules/vitest/vitest.mjs run --config docs/fundamental-data-engine/vnm-f2-mapping/2026-11-16/vitest.config.mjs
```

Use the supported Node 22 runtime. The admission runner pins the reviewed mapping SHA-256 in trusted composition. Rebuilding unchanged inputs reproduces that hash; changing mapping semantics requires an intentional versioned catalog update, not a request-supplied hash.

## Five implemented components

1. **Catalog loading:** exact pinned, versioned catalog; unique mapping IDs; supported concepts and dimensional schema. Requests cannot replace semantic mappings, checks or source pointers.
2. **Per-observation validation:** exact ticker/concept/caption/code/column witnesses, period, scope, vintage, unit, hash and native value. Verify retained JSON/PDF/supporting-evidence hashes and pointers, including original PDF identity. Sources are reused, not rediscovered. Bad observations are quarantined with reasons.
3. **Normalization:** reuse `normalizeLexical`, canonical VND to CURRENCY factor 1, source-reviewed signs and explicit outflow-magnitude conventions. Unknown/scaled unit mismatches are rejected. Stock, annual and YTD periods remain distinct; no automatic TTM/restatement stitching. Zero is preserved; null/dash are not zero. Assumptions do not become reported facts; retained SAFE_DERIVED classifications remain DERIVED.
4. **Decision:** `ACCEPTED_BY_ADAPTER` candidates only after all adapter controls pass; conflicting same-vintage observations are excluded from accepted output, including NET_PROFIT_GROUP/NET_INCOME aliases. Duplicate mapping submissions are quarantined. Equivalent observations are grouped and output is explicitly non-additive; totals/components and different vintages/scopes must never be blindly summed or latest-wins merged.
5. **Provenance:** mapping/version/hash/pointer, source cell/value/hash, PDF/page/geometry where retained, supporting evidence, source role, original receipt/publication/review clocks where present, validation clock, verification IDs and adapter/policy version. Missing original clocks remain null; later review is not backdated to publication or receipt. Historical PIT is rejected.

## Real VNM result and mapping correction

294 observations across 61 source concepts pass adapter validation; zero quarantine/conflicts on the selected retained real data. `ADMISSION_PLAN.json` is the actual executable result; `COVERAGE.json` lists exact scopes/periods/vintages. Coverage of a concept does not imply every historical/current period is available.

The earlier 292-row catalog contained a positional STOCK-list bug: four annual revenue cells were incorrectly assigned stock periods, and two Q3 revenue cells were omitted. This is corrected with an explicit stock list. Existing mapping IDs are preserved. `MAPPING_CONTRACT_PRE_ADMISSION_FIX.json` retains the original mapping and `MAPPING_CORRECTION.json` records the four fixes and two additions. Source documents and numbers are unchanged.

The result covers equity, cash/deposits/investments, receivables/inventory/payables/borrowings; income statement and parent profit; CFO, D&A, asset payments, tax/interest cashflows; funds, payables, leases and commitments. Lease/commitment buckets measured FY2025 are not silently treated as Q3 obligations. Source-review outflow magnitudes are preserved explicitly. Supported S1–S5 economic adjustments, maintenance CAPEX, deposit availability and WACC remain in their analytical models, not reported FACT cells.

## Boundary

The new versioned adapter handles concepts beyond TOTAL_ASSETS, alongside the unchanged v4 verifier. It does not rewrite the pinned v4 implementation or claim its old registry automatically covers new executable code. Standing source approvals are preserved; no new per-fact owner receipt or proof of source realness is requested. `ACCEPTED_BY_ADAPTER` is the handoff to governed persistence, not a formal authority grant, hybrid canonical promotion or scoring dataset acceptance.

Remaining F2 integration is to route this validated plan through governed persistence/qualification and consumer coverage/binding in an isolated DB. Original receipt/source-role requirements of that existing downstream contract still apply; this adapter preserves unknown fields and does not invent them. VNM17 remains pending, historical PIT remains not qualified, production stays unauthorized. No DB persistence success or full F2 closure is claimed here.

## Validation

33 TypeScript tests (21 adapter + 12 existing normalization) and 11 Python mapping tests pass; real replay is deterministic. Added cases cover catalog hash/schema, mapping stock/flow, caption/column, scope/period/unit/ticker/hash, native value, cutoff/knowledge restrictions, conflicting values, duplicate input, unknown mapping, cross-ticker reuse, missing values, zero/sign handling and provenance. Full and scoped TypeScript CLI checks were attempted but stalled without diagnostics; they were interrupted. Typecheck is therefore NOT VERIFIED, not reported as passing.

The active SQLite remains SHA-256 `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`. The runner has no DB dependency or write path.
