VCB Level-1 ticker data closure, 15 October 2026

Verdict: B. VCB CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD.

CORE 15/15 and BANK SECTOR_CORE 20/20 are admitted across FY2022–FY2025 and reviewed 6M2026. SUPPORTING is 12/45; missing disclosures and analytical qualifications remain unavailable. Requirement definitions and denominators are unchanged. Ordinary non-financial Debt Contract v2 does not apply.

Original issuer PDFs are retained under `data/manual-fundamentals/VCB/`, the repository's manual source directory. `VCB_SOURCE_MANIFEST.json` binds original filenames, periods, scope, URLs, source hashes and retrieval/publication metadata. New sources comprise the reviewed 6M2026 consolidated statement and five original regulatory capital disclosures. Financial statements are audited/reviewed accounting authority; Pillar 3 is regulatory disclosure, never represented as audited financial statements.

`VCB_RETAINED_ADMISSION_INPUT.json` and `VCB_CANONICAL_FACTS.json` are the canonical closure/replay package. BANK certification witnesses reuse earlier contracts; they never admit other tickers. CafeF ingestion is retained NAM/QUY only. No new live LUYKE ingestion or unknown schema certification was performed. Uncertified observations remain quarantined.

With the repository's pinned Node version, replay offline:

```sh
node scripts/verify-vcb-ticker-closure.mjs
pnpm exec vitest run tests/unit/vcb-ticker-closure.test.ts
```

Replay reads original PDFs, retained CafeF raw payloads and compact provenance. It does not read OCR, rendered pages, extracted source copies or temporary text. Canonical build regeneration is available through `scripts/close-vcb-ticker-closure.mjs --out=/tmp/vcb-rebuild`; its baseline/legacy ingestion adapter still uses required legacy corpus readers. That legacy dependency is separate from final canonical replay. The sealed evidence directory cannot be overwritten.

`VCB_BANK_INPUTS.json` retains compact page-labelled source components; `VCB_BANK_METRICS.json` distinguishes safely derived NPL/coverage from reported CAR/CET1 and unavailable CASA/NIM. Demand deposits are not silently relabelled CASA; total assets are not used for NIM. Historical Tier 1 is not relabelled CET1. The 2026 Circular 14 capital series is distinguished from earlier Circular 41 disclosures.

FY2023 labelled restatements supersede preserved original observations. FY2025 parent NPAT remains VND 35,177,663,000,000, despite the conflicting CafeF observation. Legacy parent/common earnings proxies without ordinary-share qualification are preserved outside canonical admission.

Historical PIT remains NOT_READY. Level-1 closure does not authorize scoring, ranking, Top10, investment recommendations, DI14 or DI15. Independent review and Project Owner approval remain outstanding. Stop after VCB.
