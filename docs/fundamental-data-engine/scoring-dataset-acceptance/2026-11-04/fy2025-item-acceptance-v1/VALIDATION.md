# Validation — FY2025 item-level data and analysis acceptance

Date: 2026-11-04. Owner-authorized AI self-review. This receipt accepts scoped research use; it is not independent production acceptance.

| Exact command | Result |
|---|---:|
| `python3 scripts/build-vn30-fy2025-analysis-acceptance.py` | 30 issuers, 300 item decisions, 310 registered readings/input packages |
| `python3 scripts/test-vn30-fy2025-analysis-acceptance.py` | 14/14 PASS |
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

285 tests passed. No full release-suite PASS is claimed.

The 14 new checks cover the exact 30-issuer/300-item scope; removal of sustainability/2026-tax-return gates for this research use; explicit corpus/valuation/authority exclusions; all source/output pins; preservation of 29 conditional numeric bridges; BSR's record-local arithmetic exception; GVR's incomplete distribution; VIC's exact prior record statuses and no invented point; VNM's standalone scope; unchanged 690 rubric weights/points and 2490 topic readiness/expired-binding dispositions; source identity/hash/page guards; missing values/unknown currency/unsupported period/unreviewed readings; percentages remaining fractions rather than VND; and the canonical governance receipt's exact snapshot hash.

There are 301 accepted reported-reading entries, 1 accepted-as-printed arithmetic exception, 2 accepted input packages, 5 accepted management-disclosure readings and 1 pending caption reconciliation. Entries include repeated source readings and are not a count of distinct fully accepted financial metrics. The prior VIC exception and BSR exception remain local to their records.

Research artifacts are additive. Earlier source/governance records and financial criteria/weights remain unchanged. Topic acceptance/scoring is not inferred from this receipt. Partial statement coverage remains explicit for each issuer. The scoped 29 calculations do not become company-published adjusted earnings; VIC's common point stays null.

Approved scoring authority remains `8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1`.

`data/vn30.sqlite` SHA-256 before and after: `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`.

No production database change, ledger posting, source authority promotion, NAV activation, scoring activation, trade authorization, push or merge is part of this review.
