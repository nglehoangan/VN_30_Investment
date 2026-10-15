# FPT Level-1 ticker data closure — 15 October 2026

**B. FPT CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD**

Starting HEAD: `b3f552daa722659d403b41179b06b19e44ef4104`. FPT only, TECHNOLOGY. This is a data closure; no official scoring, ranking, investment decision, DCA, DI14 or DI15 approval. Independent review and Project Owner approval remain required. Stop after FPT.

| Tier | Baseline admitted / required | Final admitted / required |
|---|---:|---:|
| CORE | 20 / 35 | 35 / 35 |
| SECTOR_CORE | 4 / 5 | 5 / 5 |
| SUPPORTING | 17 / 40 | 35 / 40 |

The fixed windows are FY2022–FY2025 and 6M ended 30 June 2026. `FPT_BASELINE.json` was frozen before data changes. `FPT_CONTRACT_TRACE.json` binds approved authority files and the exact registry requirements. Technology requires reported cash reinvestment (CapEx); the investigative business indicators in the request do not create extra canonical requirements.

CafeF NAM/QUY snapshots remain the primary structured ingestion input. Original audited annual and reviewed interim consolidated statements verify accounting and resolve conflicts. Provider anomalies remain visible; unknown schema/uncertified observations fail closed. Canonical cash uses issuer cash **and cash equivalents**, not unrestricted cash. Each admitted required fact has source hash, PDF page/row, exact period/frame, consolidated scope, VND/unit, definition and audit/review provenance.

Debt Contract v2 is unchanged. Reported borrowing populations include disclosed bank/related-party loans and finance leases, with current portions counted once. Carrying amounts reconcile to both balance sheet captions and debt-note components. Miscellaneous liabilities and deposits remain explicitly UNKNOWN; their financing/materiality qualification is deferred. Comprehensive financial debt and NET_DEBT are unavailable. Reported borrowings satisfy the approved CORE anyOf; this does not establish decision-grade financial health.

Original negative CapEx observations remain in history. Per-observation revision links correct their canonical sign to the approved cash outflow magnitude using exact issuer row 21. Acquisitions, debt investments and investing totals are excluded. This is a local normalization correction, not an invented issuer restatement or global sign change. Actual issuer-adjusted EPS comparatives and 2025 receivables reclassification retain their original values and explicit revision relationships.

From 1 January 2026, FTEL moves from full consolidation to the equity method. `FPT_SEGMENT_REVIEW.json` preserves issuer segment labels, the elimination column and rounding, and the issuer's alternative comparable 6M 2025 income figures. Consolidated revenue comes from the consolidated statement row, never an unadjusted segment sum. No unproven comparable CFO/CapEx or organic-growth series is constructed. Goodwill/intangibles do not reduce equity in this closure.

Five missing supporting common-earnings cells remain unavailable. Parent earnings do not automatically qualify as common earnings. Other normalized, forward, cash-availability, acquisition-quality and comparable-growth work is carried in `FPT_DEFERRED_ANALYTICAL_GAPS.json`. No unresolved Critical/Major/Minor Level-1 integrity issue remains. Historical PIT is separately NOT_READY: publication timestamps and revision chronology are not fabricated. The current original proves publication **date** 21 August 2026, with no inferred time.

The cleanup removes the byte-identical unused `client 2.ts` and two obsolete unreferenced `3.ts` implementations. Canonical source files, Debt Contract v2 and HPG/VCB/SSI evidence are unchanged. `DELETION_MANIFEST.json` records disposable extraction cleanup without backup/archive. Nineteen pre-existing OCR files are retained only because older sealed shared-corpus replays physically hash/read them; they are not dependencies of this FPT closure. No newly produced OCR/text/render file is retained.

Replay from the normal repository workspace, using Node 22.23.2:

```sh
node scripts/verify-fpt-ticker-closure.mjs
node scripts/close-fpt-ticker-closure.mjs --out=/tmp/fpt-review-reproduction
```

The verifier checks every retained source byte hash, full canonical replay, separate-process producer regeneration, integer debt reconciliation and segment elimination/rounding. Source originals/raw snapshots are retained at their bound paths; no network or extraction artifacts are needed. Independent process verification is not independent human approval.

See `TEST_RESULTS.json` for exact test outcomes, resolved intermediate failures and checks. `ARTIFACT_HASHES.json` seals this directory except itself. Final commit SHA is the commit containing this directory (avoids a self-referential commit hash).
