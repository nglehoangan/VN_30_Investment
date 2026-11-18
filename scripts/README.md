# Script entry points

Prefer an existing reusable Skill or library over adding a ticker-specific script here.

| Task | Current entry point |
| --- | --- |
| One-ticker execution guard / sequential rollout | `skills/vn30-rollout-orchestrator/scripts/runtime.py` |
| S1–S5 assessment | `skills/equity-s1-s5-assessment/SKILL.md` |
| Market price and corporate actions | `skills/vn30-market-price-corporate-actions/SKILL.md` |
| CaféF price-history retrieval | `skills/fetch-cafef-price-history/SKILL.md` |
| Vietstock discovery / PDF downloads | `skills/fetch-vietstock-dividend-pdfs/SKILL.md` |
| PDF lookup and reading | `skills/read-pdf-json-first/SKILL.md` |
| Source-domain / redirect checks | `scripts/lib/vietstock_source_policy.py` |
| Download catalog, filenames, deduplication, repository audit | `tools/maintenance/README.md` |
| Direct TCBS ingestion | `api/tcbs.mjs` (existing owner-authorized database workflow) |

Historical `build-*`, `close-*`, `seal-*`, `record-*` and `verify-*` scripts may be bound to an exact dated evidence package. Their names do not make them safe generic entry points. Consult references and approval scope before invocation; do not run them as a maintenance batch. Pinned code stays byte-identical until a legitimately approved successor replaces it.

Shared pure helpers belong in an existing `scripts/lib/` module or the maintenance library. Keep economic methodology in domain code and sector-specific Skills. Reports belong to their dated evidence package, source documents to their ticker folder, and disposable processing output to temporary storage. Do not introduce a new copy of a validation runner for each task: use the shared explicit-config runner.
