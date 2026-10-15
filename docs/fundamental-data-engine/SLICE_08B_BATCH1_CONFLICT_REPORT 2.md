# SLICE 08B — BATCH 1 CONFLICT RESOLUTION RESULT

**Investigation complete; admission remains blocked. DI9 FAIL → FAIL.**

HEAD: `6b145db15b6a086dc018253747c4ef89f612e804`. Evidence: [2026-10-11-slice08b-batch1-conflict-resolution.json](evidence/2026-10-11-slice08b-batch1-conflict-resolution.json), SHA-256 `9276620b0a53cfea1205e43cb6d150f481e549c933f7d0247a08b484c9c3fe8e`.

No canonical values were replaced or added. Original files, source occurrences and previous closure evidence remain intact. Batch 2/3 were not processed.

## Manual inventory

9 files discovered: 8 relevant PDFs, all 8 content inspected; 5 reuse existing engine-qualified content, 3 are content verified with raw qualification pending. 6 PDFs are byte-identical to retained sources; 0 byte duplicates within the manual folder. One `.DS_Store` metadata file excluded. The two new HPG binaries are corroborating sources, not hash aliases of the older PDFs.

| Case | Before (VND) | Manual evidence | Resolution | Canonical result | Conflict status |
|---|---|---|---|---|---|
| VCB TOTAL_ASSETS 2025-06-30 | 2217941098000000 / 2217636600000000 | `a2869ddae22b6c9f545b360c049862ded9a323b603546bbb993b743dc6c9f957` PDF p.9; `789948b37004bdfcb11e56c0efa153bc745e4ec2b79b4336d2a8413ac87f034a` PDF p.4 | Different original/reviewed or audited vintages; UNRESOLVED_CONFLICT | No new admission; prior occurrences retained | UNRESOLVED |
| HPG CURRENT_LIABILITIES 2025-12-31 | 94208648920111 / 94186268324508 | `f38c5f75becf7d3f145d27183eec81f119fd4f75e378b983a2763ddc3f7e0c07` PDF p.9; `e6689e18fc46f8eac61ee76e24d582923cecd66654c0d7b4324d7325ac5684e3` PDF p.4 | Different original/reviewed or audited vintages; UNRESOLVED_CONFLICT | No new admission; prior occurrences retained | UNRESOLVED |
| HPG RECEIVABLES 2026-06-30 | 18040238720080 / 18040238952446 | `2601aa68f0dd3e55195bfa263452ab513efd56094459fa436748b93d6ebcfe8c` PDF p.9; `8a02ac8e297c3d7d11af70dc43468fc57a62a422bc003548e3c81d02b7833031` PDF p.2 | Different original/reviewed or audited vintages; UNRESOLVED_CONFLICT | No new admission; prior occurrences retained | UNRESOLVED |
| GVR CFO 2026-06-30 | 5424396116575 / 6034447925142 | `f7a61f44c9747b3386bdb3f17ce0e0af895cb6ecc7d4592ab5592916b6271d48` PDF p.12; `b783766f41494dbaa6bd626e9eef5a14d64174313c8e5381f2409fb73e8237f5` PDF p.11 | DIFFERENT_DEFINITION: 6.034T is PBT code 01; actual CFO pair still UNRESOLVED_CONFLICT | No new admission; prior occurrences retained | BLOCKED_SEPARATE_FROM_THREE_DI9_GROUPS |

## Exact cells and lineage assessment

All page numbers are physical PDF pages, one based. Every exact cell includes a render SHA, caption, row code, column, period, lexical value, unit, scale and scope in the JSON. Signing dates establish report chronology only; no historical publication or knowledge boundary was inferred from them.

### VCB TOTAL_ASSETS 2025-06-30

Both PDFs repeat existing retained bytes. Same issuer, consolidated instant, caption and million-VND scale are proven. July 30 original and August 12 EY review identify different vintages, but the inspected evidence does not explicitly connect the earlier exact total-assets cell to the reviewed replacement.

- `a2869ddae22b6c9f545b360c049862ded9a323b603546bbb993b743dc6c9f957`, PDF p.9: TỔNG TÀI SẢN CÓ (no row code), `2.217.636.600` × 1000000 = `2217636600000000` VND; REVIEWED, CONSOLIDATED.
- `789948b37004bdfcb11e56c0efa153bc745e4ec2b79b4336d2a8413ac87f034a`, PDF p.4: TỔNG TÀI SẢN CÓ (no row code), `2.217.941.098` × 1000000 = `2217941098000000` VND; UNREVIEWED, CONSOLIDATED.

The inspected issuer/auditor identity, period, scope and exact definition support a reviewed/audited finalization hypothesis. That hypothesis is not promoted to an exact supersession rule in this batch. This is an evidence decision for these four cells, not a new generic requirement for every audited statement.

### HPG CURRENT_LIABILITIES 2025-12-31

Both PDFs repeat retained bytes. Issuer inventory pairs original Q4 and audited FY2025 editions and Deloitte audit is verified. This supports a finalization hypothesis; it does not itself identify the exact code-310 adjustment as superseding the January disclosure. The explicit reclassification on PDF page 20 concerns December 2024 codes 333/342, not December 2025 code 310.

- `f38c5f75becf7d3f145d27183eec81f119fd4f75e378b983a2763ddc3f7e0c07`, PDF p.9: Nợ ngắn hạn (310), `94.186.268.324.508` × 1 = `94186268324508` VND; AUDITED, CONSOLIDATED.
- `e6689e18fc46f8eac61ee76e24d582923cecd66654c0d7b4324d7325ac5684e3`, PDF p.4: Nợ ngắn hạn (310), `94.208.648.920.111` × 1 = `94208648920111` VND; UNREVIEWED, CONSOLIDATED.

The inspected issuer/auditor identity, period, scope and exact definition support a reviewed/audited finalization hypothesis. That hypothesis is not promoted to an exact supersession rule in this batch. This is an evidence decision for these four cells, not a new generic requirement for every audited statement.

### HPG RECEIVABLES 2026-06-30

Two new manual binaries reproduce both exact source cells. The issuer inventory pairs original Q2 and reviewed H1 editions; manual reviewed PDF page 1 expressly discloses August 28 publication. That confirms reviewed vintage, not an item-specific supersession. Pages 66–67 explain H1/2026 profit versus H1/2025, not the code-130 change. Difference is exactly 232366 VND; no tolerance applied.

- `2601aa68f0dd3e55195bfa263452ab513efd56094459fa436748b93d6ebcfe8c`, PDF p.9: Các khoản phải thu ngắn hạn (130), `18.040.238.952.446` × 1 = `18040238952446` VND; REVIEWED, CONSOLIDATED.
- `8a02ac8e297c3d7d11af70dc43468fc57a62a422bc003548e3c81d02b7833031`, PDF p.2: Các khoản phải thu ngắn hạn (130), `18.040.238.720.080` × 1 = `18040238720080` VND; UNREVIEWED, CONSOLIDATED.

The inspected issuer/auditor identity, period, scope and exact definition support a reviewed/audited finalization hypothesis. That hypothesis is not promoted to an exact supersession rule in this batch. This is an evidence decision for these four cells, not a new generic requirement for every audited statement.

### GVR CFO 2026-06-30

Original PDF page 11 code 01 is profit before tax 6034447925142, not CFO. Actual code 20 is 5151615462077; reviewed PDF page 12 code 20 is 5424396116575. Both have the same January–June window, consolidated scope, caption and VND scale. Distinct actual CFO vintages remain without explicit supersession evidence; no canonical 6034447925142 CFO was found to withdraw.

- `f7a61f44c9747b3386bdb3f17ce0e0af895cb6ecc7d4592ab5592916b6271d48`, PDF p.12: Lưu chuyển tiền thuần từ hoạt động kinh doanh (20), `5.424.396.116.575` × 1 = `5424396116575` VND; REVIEWED, CONSOLIDATED.
- `b783766f41494dbaa6bd626e9eef5a14d64174313c8e5381f2409fb73e8237f5`, PDF p.11: Lưu chuyển tiền thuần từ hoạt động kinh doanh (20), `5.151.615.462.077` × 1 = `5151615462077` VND; UNREVIEWED, CONSOLIDATED.

The inspected issuer/auditor identity, period, scope and exact definition support a reviewed/audited finalization hypothesis. That hypothesis is not promoted to an exact supersession rule in this batch. This is an evidence decision for these four cells, not a new generic requirement for every audited statement.

## MANUAL_DATA_STILL_REQUIRED

- **VCB**, 2025-01-01–2025-06-30, **CONSOLIDATED / REVIEWED**: Issuer disclosure/correction or before-after review reconciliation for consolidated H1/2025 total assets. Missing: Issuer-supported exact TOTAL_ASSETS predecessor/supersession or adjustment relationship: 2217941098000000 -> 2217636600000000 VND. Current files establish the values/vintages but do not explicitly establish that predecessor relationship.
- **HPG**, 2025-01-01–2025-12-31, **CONSOLIDATED / AUDITED**: CBTT - Công văn giải trình BCTC kiểm toán hợp nhất năm 2025, including before-after audit adjustment schedule for code 310. Missing: Issuer-supported exact CURRENT_LIABILITIES predecessor/supersession or adjustment relationship: 94208648920111 -> 94186268324508 VND. Current files establish the values/vintages but do not explicitly establish that predecessor relationship.
- **HPG**, 2026-01-01–2026-06-30, **CONSOLIDATED / REVIEWED**: Issuer correction or before-after reviewed H1/2026 adjustment schedule identifying code 130 and the original Q2 disclosure. Missing: Issuer-supported exact RECEIVABLES predecessor/supersession or adjustment relationship: 18040238720080 -> 18040238952446 VND. Current files establish the values/vintages but do not explicitly establish that predecessor relationship.
- **GVR**, 2026-01-01–2026-06-30, **CONSOLIDATED / REVIEWED**: Issuer before-after reviewed H1/2026 consolidated cash-flow reconciliation identifying code 20, including predecessor Q2 statement. Missing: Issuer-supported exact CFO predecessor/supersession or adjustment relationship: 5151615462077 -> 5424396116575 VND. Current files establish the values/vintages but do not explicitly establish that predecessor relationship.

For HPG FY2025 the retained issuer index explicitly lists the consolidated audit explanation letter. Please supply that letter, not the separate parent-company explanation. If a letter only explains annual profit versus the previous year, it does not supply this balance-sheet adjustment evidence. No repeated OCR or crawling was attempted.

## Before / after and affected execution

Unique DI9 economic groups **3 → 3**; combined comparable/snapshot diagnostics **6 → 6**. Accounting **135 PASS / 0 FAIL / 271 NOT_EVALUABLE / 1 NOT_APPLICABLE**, unchanged (407 checks). PIT **1218 VERIFIED / 0 UNKNOWN / 0 INVALID**, unchanged. Required fundamental freshness **193 CURRENT / 449 UNKNOWN** across 642 required windows, unchanged. Derivations **1 calculated / 68 blocked** across 69 attempts, unchanged. DI5/7/8/10 remain **BLOCKED**; 0/30 ready, 1017 missing required metrics. GVR FCF remains blocked; no qualifying CAPEX was inferred from reported asset payments.

Affected replay: 7 retained normalizations, 61 availability checks, 21 freshness bindings, 17 accounting checks and 7 direct derivation attempts. No economic admission means original operand/hash identities remain unchanged. A new current-cutoff snapshot binds the manual investigation hash; it retains the original public inventory evidence and does not claim a new public capture.

New snapshot `slice08b-batch1-742056363030ce1306dfd233`; content hash `5e789f18ee36ef84f6f16d9016e985fa6cbd16946815611ada8d8330ab4257a9`; 294 eligible members, unchanged. Separate-process reversed-order serialized replay **PASS**.

## Validation and safety

Full regression: **1045 tests / 145 suites PASS**. Source/render hashes, existing raw reconstruction and qualification, exact normalization, retained revision/correction lineage replay, conflict diagnostics including negative controls, availability, freshness, accounting and deterministic snapshot replay PASS. TypeScript, ESLint, architecture boundaries, Prisma validation, SQLite quick_check/foreign_key_check and git diff --check PASS.

No production scoring, ranking, Top 10, Buy/Hold/Sell, DCA or portfolio/account writes ran. Full regression includes isolated fixture tests of those modules. M3 and M4 were unchanged; origin DB was opened read-only. No owner/independent human approval is fabricated. **STOP: Batch 1 only.**
