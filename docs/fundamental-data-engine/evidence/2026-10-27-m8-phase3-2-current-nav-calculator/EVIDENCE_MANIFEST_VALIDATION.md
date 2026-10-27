# Evidence Manifest Validation

Date: 2026-10-27. Scope: Phase 3.2 isolated implementation only.

Manifest captures version/origin, portfolio/revision, ledger state hash, T/K, canonical full request/state/plan and optional exact ledger-facts hash. Plan contains methodology/profile, policy/calendar evidence, quantities, prices, cash/claims/liabilities, source references/hashes and completeness dimensions. Output includes exact proof decisions/reasons and result hash.

Digest is injected; tests/service validation use existing canonical SHA-256 snapshotHash. sourcePins bind exact evidence references/hash lexemes; future provider must verify bytes, not only metadata. Canonical sorting is limited to defined set collections; source lexemes and evidence variant content remain preserved.

inputHash=hash(canonical semantic inputs); resultHash=hash({inputHash,...semantic result excluding C/manifest/runHash}); runHash=hash({resultHash,calculatedAt:C}). Result hash includes denied permissions, nonpositive flag, legacy reconciliation and qualification. Tests independently reconstruct this hash and show permission mutation changes it. CalculatedAt varies without altering semantic evidence when qualification remains valid. Outputs deep-frozen after cloning; verifier-owned proof objects remain unfrozen/unmodified.

This is reproducible derived evidence, not tamper-proof persistence, a signature, external audit anchor or operational approval. No snapshots are saved.
