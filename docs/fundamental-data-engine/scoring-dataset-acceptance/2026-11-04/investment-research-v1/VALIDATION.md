# Validation — 30-issuer investment research v1

Executed 2026-11-04. This validates dated research calculations, not fair-value acceptance or live trade eligibility.

| Exact command | Result |
|---|---:|
| `python3 scripts/build-vn30-investment-research.py` | 30 dossiers, 11 revalued issuers / 33 scenarios; DB unchanged |
| `python3 scripts/test-vn30-investment-research.py` | 13/13 PASS |
| `python3 scripts/test-earnings-normalization-v4.py` | 16/16 PASS |
| `python3 scripts/test-vn30-fy2025-analysis-acceptance.py` | 14/14 PASS |
| `python3 scripts/test-held-normalization.py` | 31/31 PASS |
| `python3 scripts/test-underwriting-remediation.py` | 28/28 PASS |
| `PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH pnpm exec vitest run tests/unit/economic-normalization.test.ts tests/unit/review-lineage.test.ts tests/integration/review-lineage.test.ts tests/unit/personal-ai-scoring.test.ts tests/unit/personal-ai-provenance.test.ts tests/integration/personal-ai-scoring.test.ts` | 6 files / 102 tests PASS |
| `PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH node scripts/verify-approved-scoring-authority.mjs` | PASS: 37 artifacts, 133 historical files unchanged, 9 compatibilities |
| `git diff --check` | PASS |

Total: **204 tests passed**. No full release-suite claim.

New checks cover the exact 30-issuer scope and 11-model set, earnings-v4 binding for every scenario, null valuations for unsupported models, all source/output hashes, actual-case DCF/RIM recomputation, SSI's once-only fund bridge, VNM standalone/fixed fund/no duplicate subsidiary values/reinvestment maximum, ACB clean-surplus parity, no signals from dated unqualified prices, TCB/MBB share-count conflicts, invalid capital growth, corrupt price-body rejection, and three research conditions per issuer.

Price observations were read only from SQLite with `mode=ro`. Price body hashes, raw REST hashes, API/field, ticker, exact cell amount and trading date were checked. Decimal parsing preserves integral JSON prices such as `21000.0` without a lossy float conversion. All retained selected prices are dated 2026-10-30; these are not November 4 current quotes. No TCBS acquisition was run, no raw broker response was copied, and no credentials/account data were exported.

Existing annual financial/cashflow and capital-review inputs retain their original qualifications. No new PDF transcription or whole-statement financial acceptance is claimed. September share anchors, provider provisional counts and unknown action/dilution coverage remain distinct. Underwriting v2 and held-model outputs are checked against their predecessor manifests before use.

The 11 valuations use the new working earnings bridge with explicitly retained forecast assumptions. Old tax/NCI allocations, fund haircuts, cycle multipliers and ACB target ROE paths are not reapplied. Legacy unused assumptions are retained as metadata, distinct from applied assumptions. Ranges cover named forecast scenarios only, not unknown funds/tax/NCI, all future cycles or post-FY2025 changes. A low scenario is not a complete downside bound. RIM/DDM parity is an algebraic crosscheck, not independent asset-quality validation.

Approved scoring authority: `8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1` (unchanged).

Database SHA-256 before/after: `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`.

No database posting, source promotion, criterion/weight change, production scoring, NAV, trading activation, deployment, push or merge.
