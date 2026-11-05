# DFR-02 validation

**PASS — scoped six-issuer implementation and research validation. PENDING OWNER REVIEW.** No full-release or independent financial-acceptance PASS is claimed.

Scope: FPT, VNM, BID, TCX, VIC, VHM. Existing pinned sources only; no acquisition, other-issuer dossier, production integration or authority change. HPG is an adverse cashflow fixture only. Source publication timestamps remain unknown where the retained evidence does not qualify them.

## Executed checks

| Exact command/check | Result |
|---|---|
| `python3 scripts/build-dfr02.py` | Six dossiers; 880 input pins; 19 deterministic research output files |
| Repeat the same build, compare manifest SHA-256 | PASS, byte-identical outputs; [replay receipt](replay-validation.json) |
| `python3 scripts/test-dfr02.py` | **25/25 PASS** on final code |
| `node scripts/verify-dfr02-boundaries.mjs` | **54/54 rejection probes PASS**: six issuers × nine entry-point probes |
| `node --test scripts/test-dfr01-pilot.mjs` | **15/15 PASS** |
| `python3 scripts/test-investment-research-v2.py` | **18/18 PASS** |
| `node scripts/verify-approved-scoring-authority.mjs` | PASS: 37 artifacts, 133 historical files unchanged, nine compatibilities |
| `pnpm exec eslint scripts/verify-dfr02-boundaries.mjs` | PASS |
| `python3 -m py_compile scripts/build-dfr02.py scripts/lib/dfr02.py scripts/lib/dfr02_reports.py scripts/test-dfr02.py` | PASS |
| Node syntax check; `git diff --check` | PASS |

JavaScript commands used `/private/tmp/node-v22.23.2-darwin-arm64/bin/node`; that directory was prepended to PATH for pnpm. **58 tests passed, plus 54 explicit rejection probes.** Test/probe receipts: [validation-results.json](validation-results.json), [boundary-results.json](boundary-results.json). Full build/typecheck/B6 suites were not rerun: runtime code/configuration is unchanged and no whole-production PASS is asserted.

An intermediate export correctly stopped on an unsupported assumption that every retained valuation case used `name`; bank/securities/property cases use `id`. The adapter now preserves either exact source identity. The final test checks case identity, assumptions/value bindings, no new valuation acceptance and all six issuers. The failed run's manifest is retained as invalidated audit history, outside the current publication manifest. No input value was changed to make the test pass.

## Mandatory cases and expected-versus-actual evidence

| Case | Expected | Final actual |
|---|---|---|
| FPT technology cash | Acquisition spending remains positive spending when original statement shows negative outflow | FY2025 CFO less spending = **5,038,124,566,055 VND**; FY2024 signed source row retained; no double negation |
| VNM consumer cash/scope | Group and parent statements stay separate | Group CFO **8,668,137,048,520** vs standalone **7,690,701,645,261 VND**; standalone WC cash change **−1,414,952,025,062**; tax-expense/payment gap **775,375,113,368 VND** |
| BID bank differences | No industrial CFO ratio, no fake NIM or NPL coverage | Loan/customer deposits **1.067460193782**; reserves/gross loans **0.014726596969**; reported CAR retains TT41/2016 Basel II source framework |
| TCX securities/date keys | Standalone financing metrics; exact date-key evidence; paired revaluation only once | Margin loans/equity **0.978756138754**; parent capital **44,099,580,183,375 VND**; paired net revaluation **3,231,414,097 VND** |
| VIC closing column | Only exact reviewed closing page qualifies | Physical page **12**, FY2025 closing overlay; parent accounting capital **147,566,342,000,000 VND**; no common-earnings midpoint |
| VHM NCI | Preserve bad extraction and exact correction separately | **11137.640** vs **11137640** native million-VND values retained; corrected parent accounting capital **238,079,067,000,000 VND** |
| FY2022–FY2025 comparison | Full annual flows/December instant balances; same scope, normalized unit/scale and reviewed vintage | All six tested; quarter/YTD, wrong dates, scope, unknown units, different scale/currency and changed revision rejected |
| Negative base / missing denominator | No meaningless growth or implicit zero | Metric value remains null/MISSING; original annual figures remain visible |
| Unknown CaféF units/mode | No scale inference or numeric fallback from equal amounts | References/raw pointers retained, calculation authority withheld |
| HPG all-zero cashflow fixture | Clustered zeros require source review | REFERENCE_ONLY; no missing CFO filled with zero; no HPG dossier created |
| Conflict isolation | Only descendants lose eligibility | VHM checked-NCI conflict blocks parent capital; raw-OCR conflict does not revoke the reviewed overlay; independent cash/revenue/group-return paths continue |
| TCX specific common-numerator difference | Do not globally revoke separate total NPAT/capital | Printed **5,683,331,855,109** vs retained **5,683,331,855,108 VND** flags common estimate and dependent review candidate; separate NPAT/ROE/capital remain supported |

Add/subtract/multiplication use decimal arithmetic; ratio results retain exact numerator/denominator and declared 12-place HALF_EVEN display precision. No binary financial floating point or approximate-root CAGR is used. Four-year aggregates explicitly carry `MULTI_YEAR`, not mislabeled annual windows.

## Production and baseline boundaries

Actual dossier objects were refused by formal scoring, ranking root, a nested ranking-card input, decision, monthly DCA command, NAV request, ledger transaction construction, formal DI acceptance and formal AI-provenance validation. These are DTO/entry-point incompatibility checks, not a claim to prevent an actor deliberately rewriting research into a different authorized input.

There is no DFR-02 import/route in `src/` or `app/`, no SQLite connection or posting path in the builder, and no canonical/scoring/decision/DCA/NAV adapter was added. The final test checks **7,122 protected file/database fingerprints**, before versus after and against actual retained bytes. The builder also checks the earlier DFR-01 protected baseline. See [protected-fingerprints.json](protected-fingerprints.json).

Approved scoring-authority identity remains `8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1`. M1–M8 baseline/seals, DFR-01, data/source JSON, SQLite and available sidecars remain unchanged. No source promotion, ledger posting, score total, ranking, investment action, deployment, commit or push occurred.

The deterministic research manifest excludes execution/validation/final-review receipts. [final-review-manifest.json](final-review-manifest.json) separately binds all six requested deliverables and the validation/replay/boundary receipts to that research manifest.
