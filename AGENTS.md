<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Direct TCBS API data persistence (owner instruction 2026-10-29)

- `node api/tcbs.mjs` now writes API observations and display prices directly into the application SQLite database (`DATABASE_URL` or default `data/vn30.sqlite`). Do not add per-run capture folders, raw/manifest/capture JSON files, staging imports or extra data copies to this live workflow. Existing historical captures stay unchanged. Private authentication/session state remains separate from API result data.
- Raw REST text, parameters/variants, receipt time and SHA-256 are preserved in immutable `broker_observation` rows; display prices use `TCBS_MARKET_PRICE`. Market display updates are independent of account capture HTTP failures and never admit accounting facts or scoring authority.
- Dashboard/holdings and VN30 board read validated DB prices through `src/infrastructure/repositories/direct-market-prices.ts`; preserve ticker/unit/date/raw lineage and imported basis. Use valid exact match prices when supplied, otherwise explicitly dated eligible daily bars. Never invent a current quote from pre-open reference metadata or roll prices back to an older session. Mixed-day positions retain their own dates and do not produce a misleading aggregate valuation.
- Implementation: `api/direct-data.mjs`; verification: `docs/fundamental-data-engine/evidence/2026-10-29-direct-api-dashboard/`. Existing29Oct API bytes were verified and loaded directly for30market prices; original ledger/portfolio/projection fingerprints unchanged. This closes the display-price integration issue, not remaining B6 release gates.

## Active B1–B5 personal account runtime (2026-10-28)

- Owner explicitly authorized runtime integration after the original B6 campaign. `data/account-current/personal-account.json` is the active dated personal-account observation; earlier per-topic JSON remains evidence/diagnostics, not additional additive balances. Runtime: `src/infrastructure/personal-account.ts`, `src/domain/portfolio/personal-account.ts`, `src/ui/personal-account.tsx`, wired through `app/server/dashboard.ts`.
- Match portfolio, ledger revision, all quantities and imported costs before showing it. Refuse invalid/stale revisions; do not silently fall back to old broker snapshots on invalid owner data. Display dated personal data separately from immutable accounting history; do not post duplicate purchases/dividends or rewrite opening balances.
- Corrected buying-power arithmetic: 327420 + 12152752 - accrued custody fee420 = 12479752. Fee is not already paid; broker NAV already subtracts it. Pending475000 remains outside cash; FPT220 includes200tradable+20pending. P/L uses imported basis and explicitly dated source prices, not claimed live prices.
- Integration verification and latest readiness: `docs/fundamental-data-engine/evidence/2026-10-28-b1-b5-runtime-integration/`. Personal data integration passes; whole-production gates still require resolution of prior tests/lint and independent acceptance. Earlier statements below saying runtime unchanged describe their original review stage, superseded for the owner read model by this authorization.

## B1 personal portfolio source policy (owner instruction 2026-10-28)

- Use owner-supplied broker Excel stock statements and trade history as the preferred personal portfolio source. PDF is optional; never require a PDF snapshot or continuous historical PDF chain to identify current holdings.
- Owner removed historical snapshot/continuity requirements from current B1 personal-portfolio identity scope. The 11-stock public identity comparison is complete; B1 identity in this bounded owner workflow is resolved. Do not reintroduce historical PDF requests from old planning packages.
- FPT total ownership is 220: 200 tradable plus 20 bonus shares under FPT_WFT, not tradable. Record the pending shares as owned; change availability only on confirmed conversion and never add another 20. Unknown conversion dates stay unknown.
- Current decision and read-only Excel inspection: `docs/fundamental-data-engine/evidence/2026-10-28-b1-excel-source-policy/`. This supersedes earlier B1 history/PDF workflow requirements, not independent production acceptance, accounting admission or B2–B7.
- Preserve source files, ledger transactions and sealed evidence. Removal of the B1 history requirement does not authorize deleting accounting history or claiming historical NAV validation. No runtime activation is implied.

## B2 cash sources (owner instruction 2026-10-28)

- Use owner-supplied cash statement Excel for cash movement history and the owner-provided account image for its displayed cash/dividend/buying-power categories; no PDF requirement. Review: `docs/fundamental-data-engine/evidence/2026-10-28-b2-cash-excel-screen-review/`.
- 93 supplied cash rows reconcile to 327420 VND at the 2026 export end; 2026 row 71 explicitly identifies MWG net dividend 95000 on 16 October, record date 8 October.
- Owner confirmed image date 2026-10-28: cash 327420, pending dividends 475000, total money 802420; buying power 12479752 includes linked-bank availability 12152752. Do not double count buying power, linked bank, pending dividends or cash.
- Owner confirmed debt420 is accrued custody fee increasing daily and deducted at month end. Keep it payable until actual payment evidence; no invented daily rate. Broker NAV already subtracts it, so never subtract again from broker NAV. B2 is resolved for owner current cash/obligations scope at 2026-10-28; this is not independent production acceptance. Do not infer historical105/390 transitions or historical500000 classification. Image does not identify issuer/action for pending475000; B4 remains separate. DB and runtime unchanged.

## B4 pending dividends (owner instruction 2026-10-28)

- Store 475000 VND separately as `Cổ tức chờ về` in `data/account-current/pending-dividends.json`, as of 2026-10-28. It is not received cash or spendable cash. Issuer/action/payment date remain unknown; no GAS inference.
- Recognize as received only on confirmed account credit; reduce pending by the matched receipt and increase cash once. Preserve partial pending balances and do not duplicate entries already in cash statements. Do not subtract the already-received October16 MWG95000 again from current pending475000.
- B4 is resolved for owner pending-display/current-cash scope. Historical claim matching and production acceptance are not implied. Record and limitations: `docs/fundamental-data-engine/evidence/2026-10-28-b4-pending-dividend-policy/`. Data is saved separately, not yet integrated into runtime; ledger unchanged. Preserve broker NAV as reported and never add pending to it again.

## B5 Excel acquisition cost (2026-10-28)

- Read-only replay of supplied Excel covers 17 trades, 29 stock events and 14 purchase-date cash/fee reconciliations. Acquisition cost for all 11 current holdings is stored separately in `data/account-current/acquisition-cost-basis.json`; evidence and remaining differences: `docs/fundamental-data-engine/evidence/2026-10-28-b5-excel-cost-basis/`.
- Acquisition cost is matched BUY gross + BUY fees + BUY taxes; use execution price, never order price or broker trade cost column. Stock dividends conserve total cost; no automatic cash-dividend reduction or custody-fee capitalization. FPT20pending owner-confirmed shares affect ownership denominator without adding purchase cost. No held-security sales appear in supplied Excel; disposed TPB remains outside the11holding result.
- Owner subsequently selected imported cost basis for P/L on 2026-10-28. B5 is resolved for personal portfolio P/L on that basis; no further broker rounding/adjustment proof is required for this chosen scope. `data/account-current/selected-pnl-basis.json` pins all11 imported bases verified against ledger. P/L = dated market value minus imported openCost; Excel acquisition cost remains reconciliation-only. Existing valuation already uses ledger openCost. Do not deduct cash dividends again from selected basis or count pending dividends as received; do not label this as independently reconstructed lifetime total return. Preserve both figures, source dates and limitations; no ledger rewrite, runtime activation or production acceptance.

## B6 validation campaign (2026-10-28)

- Latest recheck after owner ran data: `docs/fundamental-data-engine/evidence/2026-10-29-b6-recheck/REPORT.md` and `ISSUE_REGISTER.json`. Full2474tests:2445pass/29fail, including28baseline failures and one backup20s timeout; isolated backup rerun3/3passes. B1–B5all12tests and actual-copy runtime pass; build/typecheck/boundaries pass; lint16errors/4warnings persists. B6 remainsNO_GO. No source fixes/data mutations/deployment performed by that review.
- Fresh29Octmarket capture has28Octdaily bars for all11holdings and61hash-valid HTTP200market requests, but dashboard still consumes11Octsnapshot/09Octquote date. Unified capture partial due account APIs4.16/4.17 HTTP400. Fix market/read-model integration separately from owner-resolved B1–B5 and optional account capture; never turn HTTP400 into zero or edit historical seals to fix tests.

- Original campaign: `docs/fundamental-data-engine/evidence/2026-10-28-b6-validation/REPORT.md`. Latest integration/recheck: `docs/fundamental-data-engine/evidence/2026-10-28-b1-b5-runtime-integration/REPORT.md` and `FINAL_STATUS.json`. Personal B1–B5 runtime passes12newtests,113personal/architecture checks,actual-copy composition root,actual browser1440/390/FPTdetail,13synthetic browser checks,build/typecheck/changed-code lint. Whole release remains NO_GO:28baseline test failures and16lint errors/4warnings remain. Full integration run2445/2474passes/29fails included one new timezone test that subsequently passed with all12newtests on final code; no final full-suite PASS claim.
- Owner personal-scope B1/B2/B4/B5 resolutions stand, but their saved data is not runtime integration. Actual ledger still cash232420/receivable570000/payable0 vs owner28Oct327420/475000/420. No ledger rewrite, migration or release was performed; source/database hashes unchanged.
- Remediate runtime integration, current migration/adapter/research failures and exact authority hash mismatch, and classify cleanup-dependent historical replay tests without restoring deleted source folders or altering seals. Do not ask owner to resend existing Excel/PDF to cure engineering gaps. Independent M7 acceptance and B7 deployment remain separate.

## Report API data storage convention

User-confirmed convention (2026-10-18): use the CafeF display mapping as the default pattern when storing financial report API data for future website rendering.

- Keep immutable raw API responses plus a request inventory containing parameters, retrieval time, response status, SHA-256 and raw payload path. Keep provider namespaces separate.
- Store presentation JSON per ticker with the hierarchy `reports → report key → periods → year/quarter key → variants[] → groups[] → rows[]`. Annual, quarterly and YTD periods must remain distinct.
- Preserve provider template labels, group IDs, row codes and array order. Use codes and occurrence-aware IDs for identity, not labels. Preserve provider level metadata without assuming it defines tree depth.
- Preserve separate captures/report types/request modes as variants; do not silently overwrite or select the latest. Flag mode mismatches and duplicate template codes. Retain cells absent from the template separately; record invalid periods or failed captures in a manifest.
- Store financial values as lossless decimal strings. Distinguish zero, explicit null and missing cells. Keep declared units and per-share metadata; mark undeclared units explicitly, without guessing conversion factors.
- Retain source hash, raw payload path, retrieval time and an exact JSON Pointer for each available cell so values can be traced to the original response.
- Presentation data alone does not authorize accounting admission or scoring. Keep its status explicit and follow the existing admission rules independently.
- CafeF reference implementation: `src/infrastructure/fundamentals/cafef-display.ts`; rebuild command: `node scripts/map-cafef-display.mjs` with the project's supported Node version. Current output: `data/providers/cafef/display-v1/<TICKER>.json`; documentation: `data/providers/cafef/display-v1/README.md`.
- Apply this pattern to other report APIs using their own provider directory, versioned schema and adapters. Do not mix raw captures from different providers or rewrite existing sealed evidence.

## Manual PDF report display JSON

- User requested the same presentation hierarchy for all PDFs under `data/manual-fundamentals`. Output per ticker: `data/manual-extracted/display-v1/<TICKER>.json`.
- Workflow and limitations: `docs/fundamental-data-engine/MANUAL_PDF_DISPLAY_JSON.md`. Scripts: `scripts/extract-manual-display.py`, `scripts/map-manual-display.py`, `scripts/verify-manual-display.py` (Python with PyMuPDF; local Apple Vision for missing scan readers).
- Keep all physical PDFs/pages represented in the inventory. Preserve separate source documents, comparative periods, consolidation scopes and revision variants. Preserve source PDF hashes, page/box evidence and exact raw reader JSON pointers.
- Geometry/OCR output is an unreviewed presentation candidate; do not promote its labels, period assignments or amounts to approved accounting facts. Unknown periods, units, missing cells and ambiguous readings must remain explicit.

## Readable report comparisons

- User requested inline values and readable concept keys for comparing manual PDFs with CafeF, starting with VNM. Keep hashes in a separate provenance ledger, not as user-facing data keys.
- VNM FY2025 pilot: `docs/fundamental-data-engine/VNM_READABLE_COMPARISON_PILOT.md`; output `data/comparisons/VNM/FY2025/`; builder `scripts/compare-vnm-readable.py`.
- Match captions/definitions, period, scope and units explicitly; never choose mappings because amounts happen to match. Keep source captions/codes/values, unknown dimensions, classification differences, dash versus zero and aggregation formulas visible. Do not generalize the pilot's issuer/year-specific code crosswalk to the full universe without checking source templates.

## User source priority for readable report data

- User requested PDF first: use a readable numeric PDF value, including zero; only if unavailable use CafeF as a clearly labelled reference and list it for user checking. Preserve PDF when values differ. Never turn a PDF dash/null/unreadable OCR into zero automatically.
- Versioned rule: `src/domain/fundamentals/report-display-source-priority-v2.json`; implementation: `scripts/lib/report_source_priority.py`; workflow: `docs/fundamental-data-engine/PDF_FIRST_REPORT_RULE.md`.
- VNM outputs: `selected-pdf-first.json`, `review-pdf-first.json`, `review-pdf-first.md` under `data/comparisons/VNM/FY2025/`; rebuild with `scripts/select-vnm-pdf-first.py` after rebuilding the comparison.
- CafeF reference values and template zeros require review of PDF notes, definitions, period, unit, scope and duplicate/label-drift warnings. No latest-wins conflict resolution or automatic accounting/scoring admission is authorized by this display-selection rule.

- User-authorized exclusion (2026-10-18): omit nonzero CafeF-only fallback rows whose amount already appears under another PDF caption in the same issuer/period comparison. Preserve excluded values and PDF matches in an audit ledger; do not use equality to create mappings or assert proven provider errors. Do not exclude zeros or correctly mapped same-concept PDF/CafeF pairs. VNM ledger: `data/comparisons/VNM/FY2025/excluded-cafef-pdf-duplicates.json`.

## VNM historical readable reports

- Checked FY2022–FY2024 annual current-year columns: `scripts/compare-vnm-history.py`, transcripts/input pins in `docs/fundamental-data-engine/VNM_FY<year>_*`. Scope is the three primary statements on physical pages 7–14 of each original annual PDF. Keep FY2025's existing builder and evidence unchanged.
- Run `scripts/select-vnm-pdf-first.py <year>` for each rebuilt year, then `scripts/summarize-vnm-history.py`; verify with `scripts/test-vnm-history.py`. Multi-year output: `data/comparisons/VNM/annual-pdf-first.json`; review index: `data/comparisons/VNM/README.md`.
- Historical cashflow templates have repeated codes and extra captions. Keep loss on asset disposal, goodwill amortization, associate adjustments and NCI dividends separate; explicit comparison aggregates preserve operands. Do not reuse the FY2025 crosswalk blindly.
- Additional 2021 comparative columns and interim 2026 are separate unreviewed candidates. The interim OCR currently labels both Q2 and six-month income variants as YTD; do not select by period key alone.

## VN30 readable PDF-first data

- User requested applying the rule to the entire retained 30-stock universe. Builder: `scripts/build-vn30-readable.py`; tests: `scripts/test-vn30-readable.py`; workflow/limitations: `docs/fundamental-data-engine/VN30_READABLE_REPORTS.md`.
- Output: `data/comparisons/VN30/annual-pdf-first.json`, per-ticker `<TICKER>/annual-pdf-first.json`, `manifest.json`, `review-index.json`, readable review tables and source/exclusion/provenance ledgers.
- Annual scope: 2022–2025. Reuse checked VNM files unchanged; keep the other 29 stocks explicitly UNREVIEWED_OCR until source-image/caption review. Never describe full-corpus automated selection as VNM-level visual checking.
- Generic mappings require unique exact normalized captions, not equal codes, fuzzy labels, VNM crosswalk reuse or matching amounts. Resolve ambiguous PDF matches as issues, not provider fallback. Keep known/unknown units and standalone/consolidated scopes distinct. Do not guess generic EPS scaling.
- Relative year headers require explicit current/ending cues plus the original annual document year; opening/prior/quarter/ambiguous change columns stay separate. All primary-report input cells remain either in annual manual data or additional-period candidates.
- VIC FY2022 income extraction gap is supplied by the checked, hash-pinned `docs/fundamental-data-engine/VIC_FY2022_INCOME_TRANSCRIPTION.json`. Preserve signed million-VND amounts and separate EPS unit.

## User-authorized data-folder cleanup

- On 2026-10-18, the user explicitly requested deleting unnecessary artifacts in `data/` without backups, retaining extracted and aggregated JSON. This supersedes earlier source-retention instructions for the deleted data-folder artifacts.
- `scripts/prune-data-artifacts.py` previews cleanup; `--apply` executes deletion. Retain PDF display JSON (direct files in `data/manual-extracted/display-v1/`), CafeF JSON (including raw captures), comparison/aggregation JSON, current-analysis JSON and the active `data/vn30.sqlite` database/sidecars.
- Original PDFs, OCR readers/images, remediation work directories, old backups/import/session/onboarding artifacts and data-folder Markdown were removed. Do not claim source PDF/OCR replay still works, automatically regenerate deleted work directories or treat historical provenance pointers as extant files.
- Cleanup results and retained-byte verification are in `data/retained-data-index.json`. JSON values remain unchanged. Full source extraction/replay requires reacquiring source documents. Use retained-data checks for current JSON integrity; historical source-replay tests intentionally depend on removed artifacts.

## User-authorized full data rebuild (2026-10-19)

- The latest owner request supersedes the old data-folder retention and output paths above: delete everything in `data/` except `vn30.sqlite`, reacquire saved Vietstock PDFs and CafeF responses, and build four directories: `manual-download/`, `manual-extracted-pdf/`, `manual-extracted-api/`, `combine/`. Do not recreate historical folders or symlinks as substitutes for fresh acquisition.
- Control inventory and reset receipt: `docs/fundamental-data-engine/rebuild-2026-10-19/`. The database is preserved; the rebuild does not admit new accounting facts or scores.
- PDF display hierarchy and source-priority v2 still apply. PDF numeric values remain decimal strings in their declared native units. Notes include every page's full text and raw geometry pointers under `manual-extracted-pdf/notes/`; OCR is unreviewed.
- Preserve raw CafeF captures and all request variants in `manual-extracted-api/`; quarantine schema failures in the manifest. Keep failed PDF downloads visible. Missing documents/periods are not zero values.
- Current workflow: `docs/fundamental-data-engine/REBUILT_DATA_WORKFLOW.md`. Verification: `scripts/verify-vn30-rebuilt.py` and `data/combine/verification.json`. Historical artifact-specific checks may require the intentionally deleted old files; do not restore them by copying historical extracted amounts into the rebuilt data.
- `scripts/prune-data-artifacts.py` implements the superseded cleanup layout and is not the cleanup workflow for these four directories. Preserve freshly reacquired PDFs and API raw responses unless the owner explicitly requests another reset.
- Subsequent owner cleanup request: keep source files, raw data and results; clear disposable processing intermediates. Remove rendered page images, temporary previews, partial files and scratch logs/scripts after processing. The initial cleanup retained OCR raw; the later direct-PDF request below supersedes that retention. Cleanup receipt: `docs/fundamental-data-engine/rebuild-2026-10-19/temporary-cleanup.json`.

## Direct PDF evidence and OCR-reader removal

- Latest owner request: link directly to the source PDF instead of hash-named intermediate JSON, then delete `data/manual-extracted-pdf/documents/` and `readers/`.
- Migration: `scripts/link-pdf-sources.py`; receipt: `docs/fundamental-data-engine/rebuild-2026-10-19/direct-pdf-migration.json`. Source PDFs, API raw, extracted values and full-page notes remain. Direct evidence contains PDF path, physical page (`#page=N`) and normalized cell/caption boxes. Hashes remain integrity metadata only.
- Current PDF manifests have `evidenceMode: DIRECT_PDF`. Final combined rows contain `pdfEvidence.pdfPath`, `href`, page and boxes; their JSON Pointer to the readable per-ticker JSON remains available for value comparisons. No active result depends on removed OCR files.
- Exact prior word-level OCR/JSON-Pointer replay is unavailable after deletion. Re-extract PDFs to rebuild OCR if needed; do not silently recreate deleted raw readers during ordinary validation. Run `scripts/verify-vn30-rebuilt.py` to validate current PDF links, page coverage, values, API lineage and selection rules.

## Vietstock-only financial document acquisition (owner reconfirmed 2026-10-22)

- Discover and acquire financial PDFs only through `finance.vietstock.vn` and `static2.vietstock.vn`. No issuer/company or exchange website fallback, including historical `issuerDiscoveryUrl`/`officialDiscoveryUrl` fields or old PE1 acquisition scripts. Validate every redirect before requesting it.
- Current configuration: `docs/fundamental-data-engine/issuer-sources.json`, `issuer-document-routes.json`; policy: `VIETSTOCK_ONLY_SOURCE_POLICY.md` in the same directory. Historical sealed captures are audit history, not current source authorization. Do not edit old seals to reflect new policy.
- Recalculate coverage using `scripts/recalculate-vietstock-coverage.py`. Separate exact retained Vietstock PDF coverage from original-publication evidence and formal admission. Exclude prior company/HOSE discovery from current coverage. Vietstock remains a third-party mirror; no automatic D2/source approval or AS_KNOWN relaxation.
