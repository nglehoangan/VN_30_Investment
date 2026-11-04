# Validation — FY2025 working earnings bridges v4

Executed 2026-11-04 in the local repository. Research artifacts only; no production postings or database writes by the builder. This is engineering validation, not independent financial acceptance.

| Exact command | Result |
|---|---:|
| `python3 scripts/build-earnings-normalization-v4.py` | Generated 30 profiles, snapshot, readable report and pinned manifest |
| `python3 scripts/test-earnings-normalization-v4.py` | 16/16 PASS |
| `python3 scripts/test-earnings-normalization-v3.py` | 40/40 PASS |
| `python3 scripts/test-base-assumption-decisions.py` | 21/21 PASS |
| `python3 scripts/test-normalization-acceptance-review.py` | 22/22 PASS |
| `python3 scripts/test-held-normalization.py` | 31/31 PASS |
| `python3 scripts/test-vic-parent-bridge.py` | 24/24 PASS |
| `python3 scripts/test-vic-reported-data-acceptance.py` | 15/15 PASS |
| `PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH pnpm exec vitest run tests/unit/economic-normalization.test.ts tests/unit/review-lineage.test.ts tests/integration/review-lineage.test.ts tests/unit/personal-ai-scoring.test.ts tests/unit/personal-ai-provenance.test.ts tests/integration/personal-ai-scoring.test.ts` | 6 files / 102 tests PASS |
| `PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH node scripts/verify-approved-scoring-authority.mjs` | PASS: 37 artifacts, 133 historical files unchanged, 9 compatibilities |
| `git diff --check` | PASS |

271 tests passed. No full release-suite or whole-production PASS claim.

New regression checks cover all 29 numeric bridges, preservation of the prior 16 selected cases, negative results, duplicate adjustment rejection, finite decimal strings, source hash / issuer / period / column / unit / unchecked-reading rejection, independent tax/NCI component envelopes, SSI paired legs and once-only funds, VNM standalone scope and fixed fund, VHM full-transfer exclusion, VPL separate post-tax stress, and VIC without a fabricated common-earnings point.

Approved scoring authority remains `8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1`.

`data/vn30.sqlite` SHA-256 before and after: `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`.

Remaining financial work is issuer-specific and recorded in each profile/report. All 30 accepted sustainable earnings fields remain null. Unknown funds are null; no complete cycle or exhaustive one-off review is asserted. No RNAV prerequisite is introduced for the earnings bridge. NAV/scoring/trading authority remains false.
