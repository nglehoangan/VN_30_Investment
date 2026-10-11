# Slice 08B — Final remediation execution candidate

**Status: FAILED ADMISSION GATES; AWAITING INDEPENDENT REVIEW.** Actual retained-data execution is complete. This evidence package is immutable; admission/scoring eligibility remains blocked. DI14 and DI15 are not approved.

HEAD: `c11c17fbe0d7b0a09099e67029662584778e35d3`. Executed source digest: `cc68fc3cd9d23405d7f17a91d941d1825d78355d251326d48036681136f6c863`. Uncommitted source changes are copied and hashed in the local execution package.

Execution package hash: `eff0e6dc7d99972d7c518ff02eb1f96a6f4e049dbbfc232a697d47b1af3af275`.

[New immutable closure evidence](evidence/2026-10-11-final-08b-remediation-closure-v2.json) — SHA-256 `4d111a5199071ac3cc8a6b83b08cb016b0245d451934154be823d44fa0a7ed6b`.

[Every unresolved required metric, exact financial window and retained source attempt](evidence/2026-10-11-final-08b-remediation-missing-required.json) — SHA-256 `d1046e0af113d54ff5d039e4d036013dc9d1901c5150b7581ce73a5f920ed06a`.

Private package: `data/initialization-08b-remediation-work/execution-history/slice08b-remediation-live-aebddb4ad4a45745c5574d0e/execution-package.json`. Its file SHA-256 is `dbd257a7b896c3633e57d65040b9c91c0f7ca064eaf6b37fbc1193b642a3c39e`. This is failed execution evidence, not an admission seal. The original failed package `968435ab75a8f969ace10bc6fa932986d50c1d71575faeb1388e8f8c2bb5a250` and database remain unchanged.

## Fundamentals

155 uniquely qualified documents (158 qualification records, including retained corrections); 1,782 audited financial cells (1,682 in current work plus 100 prior-package cells), plus one audited accounting-basis qualification proof. Of the financial cells, 217 use original OCR plus explicit assistant source-image reading; these are not asserted to be two-OCR agreement or human approval. 1218 canonical observations, including four retained withdrawn occurrences; 157 total normalization records (139 new); one calculated derived result.

| Sector | Canonical observations |
|---|---:|
| BANK | 607 |
| ENERGY | 20 |
| INDUSTRIAL | 36 |
| MATERIALS | 78 |
| REAL_ESTATE | 69 |
| RETAIL | 232 |
| SECURITIES | 13 |
| TECHNOLOGY | 141 |
| UTILITIES | 22 |

1,017 previous required metric obligations remain 1,017 incomplete metric obligations; legitimate N/R = 0. This is the frozen metric denominator, not a claim that 1,017 financial cells are absent. The separate financial-window catalog contains 3,198 exact windows and records available facts, usable PIT, missing context, source exceptions and fallback evidence individually.

## Freshness and PIT

| Required class | CURRENT | AGING | STALE | UNKNOWN |
|---|---:|---:|---:|---:|
| FUNDAMENTALS | 193 | 0 | 0 | 449 |
| MARKET | 30 | 0 | 0 | 0 |
| VN30_MEMBERSHIP | 30 | 0 | 0 | 0 |
| SECTOR_MASTER | 30 | 0 | 0 | 0 |
| ESTIMATES | 0 | 0 | 0 | 30 |

Fundamental freshness uses 642 required current input windows; the other classes use 30 security bindings each. Missing or conflicted required inputs remain UNKNOWN. DI8 is BLOCKED. All 1218 availability assessments are VERIFIED for conservative initial-live public access; UNKNOWN = 0, INVALID = 0. This does not establish historical publication dates or scoring readiness.

## Conflicts, accounting and derivations

Three unresolved economic value groups produce three matching snapshot conflict diagnostics; the producer reports six diagnostics in total. 249 exact-equivalence groups and 24 explicit issuer revision item rules retain their original occurrences. The previous VIB customer-deposit independent-root conflict is resolved by source-bound exact equivalence at 317,451,548,000,000 VND. TCB statutory deposits (662,447,730,000,000 VND) and the CASA matching-definition denominator (697,400,000,000,000 VND) are different definitions; only the latter supports this CASA result, and statutory raw cells remain retained.

| Ticker / item / instant | Retained competing values (VND) | Remaining evidence |
|---|---|---|
| VCB TOTAL_ASSETS / 2025-06-30 | 2,217,941,098,000,000; 2,217,636,600,000,000 | Issuer item-specific correction/revision evidence between unreviewed and reviewed statements |
| HPG CURRENT_LIABILITIES / 2025-12-31 | 94,208,648,920,111; 94,186,268,324,508 | Item-specific audit adjustment/revision evidence; inspected profit explanation does not establish it |
| HPG RECEIVABLES / 2026-06-30 | 18,040,238,720,080; 18,040,238,952,446 | Explicit revision/materiality disposition; no amount tolerance invented |

Accounting PASS = 135, FAIL = 0, NOT_EVALUABLE = 271, NOT_APPLICABLE = 1. Missing operands do not establish accounting consistency.

Derivations attempted = 69; calculated = 1 (TCB CASA); blocked = 68; N/R = 0. All blocked routes identify exact canonical operand roles and actual input IDs in the closure artifact. ROE requires reviewed normalized common profit and compatible average common equity; FCF lacks qualifying issuer CAPEX (GVR/VJC also lack usable CFO); bank CASA/NPL routes lack exact matching reported numerators. Four native TTM quarters or compatible adjacent YTD operations remain required; FY + H1 − prior H1 is not introduced. The 159 frozen derived-metric obligations remain incomplete even though CASA is calculated.

GVR reviewed H1 2026 cashflow was retried with original readers, EasyOCR, 400 DPI and nine numeric-region configurations. The July issuer alternative was retained, but reports a different CFO (6,034,447,925,142 VND) from the inspected reviewed source (5,424,396,116,575 VND); neither a repaired OCR string nor substitution was admitted. Every remaining metric needs the precise source/normalization/context or investment judgment recorded in the missing evidence artifact.

## New immutable AS_KNOWN snapshot

Run: `slice08b-remediation-live-aebddb4ad4a45745c5574d0e`.

Content hash and manifest digest: `c75e6be975e413fc9f077695f9a7228a8352aebbc650f8ec6524a8ad3b3fd9ce`.

Eligible members: 294; excluded occurrences: 924. Independent serialized replay: PASS, input SHA-256 `cee8e552bfb0efa81a6bc94b47af617e49e74c5cb23f172cd74a30bdfa9ac2fe`. Blockers: BLOCKED_CONFLICT, BLOCKED_FRESHNESS_POLICY_UNRESOLVED, BLOCKED_REQUIRED_FACT_MISSING.

- decisionAsOf: `2026-10-11T06:05:13.192Z`
- systemKnownAt: `2026-10-11T06:05:13.192Z`
- fundamentalCutoff: `2026-10-11T06:05:13.192Z`
- marketCutoff: `2026-10-11T06:05:13.192Z`

No new staged database or production admission was written: DI5/7/8/9/10 do not pass. The raw initialization database and original failed staged database retain their full-file hashes. The new snapshot is persisted as immutable JSON evidence and independently replayed; planned producer row counts are not claimed as database writes.

## Exactly 30 constituent readiness rows

Required/satisfied/missing refer to complete frozen metrics; canonical coverage is eligible current input windows / required current input windows. F = fundamental freshness C/U (estimates are U for every row); PIT = verified retained observations / total. D = calculated / attempted derivations; V and Q = satisfied / required valuation and qualitative evidence metrics. Detailed blockers and exact missing metric IDs are in the closure and missing artifacts.

| Ticker | Sector | Observations | Canonical coverage | Required | Satisfied | N/R | Missing | F C/U | PIT | Conflicts | D | V | Q | Confidence | dataReady | readyForScoring | Blocker |
|---|---|---:|---|---:|---:|---:|---:|---|---|---:|---|---|---|---|---|---|---|
| ACB | BANK | 72 | 14/20 | 32 | 0 | 0 | 32 | 14/6 | 72/72 | 0 | 0/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| BID | BANK | 21 | 8/19 | 32 | 0 | 0 | 32 | 8/11 | 21/21 | 0 | 0/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| BSR | ENERGY | 20 | 10/25 | 35 | 0 | 0 | 35 | 10/15 | 20/20 | 0 | 0/2 | 0/3 | 0/16 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| CTG | BANK | 12 | 4/19 | 32 | 0 | 0 | 32 | 4/15 | 12/12 | 0 | 0/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| FPT | TECHNOLOGY | 141 | 9/25 | 35 | 0 | 0 | 35 | 9/16 | 141/141 | 0 | 0/2 | 0/3 | 0/16 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| GAS | UTILITIES | 22 | 11/25 | 35 | 0 | 0 | 35 | 11/14 | 22/22 | 0 | 0/2 | 0/3 | 0/16 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| GVR | MATERIALS | 41 | 5/25 | 35 | 0 | 0 | 35 | 5/20 | 41/41 | 0 | 0/2 | 0/3 | 0/16 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| HDB | BANK | 50 | 9/19 | 32 | 0 | 0 | 32 | 9/10 | 50/50 | 0 | 0/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| HPG | MATERIALS | 37 | 8/25 | 35 | 0 | 0 | 35 | 8/17 | 37/37 | 4 | 0/2 | 0/3 | 0/16 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN; UNRESOLVED_REVISION_OR_VALUE_CONFLICT |
| LPB | BANK | 10 | 7/19 | 32 | 0 | 0 | 32 | 7/12 | 10/10 | 0 | 0/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| MBB | BANK | 58 | 5/19 | 32 | 0 | 0 | 32 | 5/14 | 58/58 | 0 | 0/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| MCH | RETAIL | 39 | 6/25 | 36 | 0 | 0 | 36 | 6/19 | 39/39 | 0 | 0/2 | 0/3 | 0/17 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| MSN | RETAIL | 56 | 7/25 | 36 | 0 | 0 | 36 | 7/18 | 56/56 | 0 | 0/2 | 0/3 | 0/17 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| MWG | RETAIL | 44 | 12/25 | 36 | 0 | 0 | 36 | 12/13 | 44/44 | 0 | 0/2 | 0/3 | 0/17 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| SAB | RETAIL | 32 | 9/25 | 36 | 0 | 0 | 36 | 9/16 | 32/32 | 0 | 0/2 | 0/3 | 0/17 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| SHB | BANK | 6 | 4/19 | 32 | 0 | 0 | 32 | 4/15 | 6/6 | 0 | 0/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| SSB | BANK | 21 | 5/19 | 32 | 0 | 0 | 32 | 5/14 | 21/21 | 0 | 0/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| SSI | SECURITIES | 5 | 0/9 | 26 | 0 | 0 | 26 | 0/9 | 5/5 | 0 | 0/0 | 0/3 | 0/19 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| STB | BANK | 8 | 3/19 | 32 | 0 | 0 | 32 | 3/16 | 8/8 | 0 | 0/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| TCB | BANK | 95 | 4/19 | 32 | 0 | 0 | 32 | 4/15 | 95/95 | 0 | 1/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| TCX | SECURITIES | 8 | 0/9 | 26 | 0 | 0 | 26 | 0/9 | 8/8 | 0 | 0/0 | 0/3 | 0/19 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| VCB | BANK | 78 | 5/20 | 32 | 0 | 0 | 32 | 5/15 | 78/78 | 2 | 0/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN; UNRESOLVED_REVISION_OR_VALUE_CONFLICT |
| VHM | REAL_ESTATE | 20 | 7/25 | 41 | 0 | 0 | 41 | 7/18 | 20/20 | 0 | 0/2 | 0/4 | 0/22 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| VIB | BANK | 92 | 2/19 | 32 | 0 | 0 | 32 | 2/17 | 92/92 | 0 | 0/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| VIC | REAL_ESTATE | 37 | 7/25 | 41 | 0 | 0 | 41 | 7/18 | 37/37 | 0 | 0/2 | 0/4 | 0/22 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| VJC | INDUSTRIAL | 36 | 5/25 | 35 | 0 | 0 | 35 | 5/20 | 36/36 | 0 | 0/2 | 0/3 | 0/16 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| VNM | RETAIL | 49 | 6/25 | 36 | 0 | 0 | 36 | 6/19 | 49/49 | 0 | 0/2 | 0/3 | 0/17 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| VPB | BANK | 84 | 6/19 | 32 | 0 | 0 | 32 | 6/13 | 84/84 | 0 | 0/3 | 0/3 | 0/20 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| VPL | RETAIL | 12 | 8/25 | 36 | 0 | 0 | 36 | 8/17 | 12/12 | 0 | 0/2 | 0/3 | 0/17 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |
| VRE | REAL_ESTATE | 12 | 7/25 | 41 | 0 | 0 | 41 | 7/18 | 12/12 | 0 | 0/2 | 0/4 | 0/22 | LOW | false | false | M3_REQUIRED_WINDOWS_CONTEXT_AND_VALUATION_INCOMPLETE; REQUIRED_CURRENT_INPUTS_OR_FRESHNESS_UNPROVEN |

**readyForScoring = 0 / 30.** Every official constituent remains in the denominator.

## DI execution

| Gate | Actual new result |
|---|---|
| DI1 | PASS |
| DI2 | PASS |
| DI3 | PASS |
| DI4 | PASS |
| DI5 | BLOCKED |
| DI6 | PASS |
| DI7 | BLOCKED |
| DI8 | BLOCKED |
| DI9 | FAIL |
| DI10 | BLOCKED |
| DI11 | PASS |
| DI12 | PASS |
| DI13 | PASS |
| DI14 | AWAITING_INDEPENDENT_REVIEW |
| DI15 | AWAITING_FINAL_ISSUE_CLOSURE |

## Remaining issues and validation

Critical: no implementation violation identified by the executed checks; independent review remains pending. Major: the three exact economic conflicts; missing qualified financial windows/common-attribution/normalization; 68 blocked formula attempts; incomplete human qualitative and valuation review; 449 UNKNOWN required fundamental freshness bindings and 30 UNKNOWN estimate bindings. Minor: metric-specific consumer/hospitality applicability confirmation remains open. The exact ticker/metric/item/window/source problems and fallback status are recorded in the immutable missing artifact. No generic N/R closes these obligations.

Regression PASS: unit 728, integration 229, architecture 88 = 1,045 tests across 145 suites; extraction/reconciliation 49; 1,783 source proofs; 904 cell-tamper controls and 12 metadata-image controls, zero source mutation; reader immutability 1; metric routing/freshness/seal 13; withdrawal ordering and conflict-diagnostic controls PASS. TypeScript PASS; ESLint 0 errors/0 warnings across 315 files; 145-module architecture boundaries PASS; Prisma validate/generate 7.10.0 PASS; SQLite quick_check ok and foreign_key_check empty; independent deterministic replay PASS. Git whitespace validation is recorded separately after generating these reports.

**Audit trail:** this work belongs to Slice 08B, not Slice 7; Git history was not rewritten. No M3 weights or M4 rules changed. No real scoring, ranking, Top 10, Buy/Hold/Sell, DCA or portfolio/account writes ran. Stop for independent review; DI14/15 remain pending.

[Post-generation integrity verification](evidence/2026-10-11-final-08b-integrity-verification.json) records package/artifact validation and `git diff --check`.
