# MSN Level-1 ticker closure review

C. MSN BLOCKED — MATERIAL LEVEL-1 DATA-INTEGRITY GAPS REMAIN

Starting HEAD: `2ba374b8ccadf9220d922de9769ea156f46eda44`. Final HEAD: `2ba374b8ccadf9220d922de9769ea156f46eda44`. Changes remain uncommitted.

| Requirement | Before | After | Missing after |
|---|---:|---:|---:|
| CORE | 20/35 | 30/35 | 5 |
| SECTOR_CORE | 4/5 | 5/5 | 0 |
| SUPPORTING | 19/40 | 19/40 | 21 |

Latest qualified current YTD: 2026-06-30. Scope: CONSOLIDATED. The 60-day grace requires 6M2026 on 15 October 2026; Q3 is not yet the required YTD window. Quarter flows never substitute for YTD and no interim flow is annualized.

Debt: BLOCKED; issuer carrying amounts, current portion counted once. Comprehensive debt and economically unrestricted cash remain unqualified; NET_DEBT is N_R. These analytical gaps alone do not block Level 1. Exact required debt gaps, when present, are visible in the reconciliation.

Critical: 0; Major: 1; Minor: 0.

- Interest-bearing deferred acquisition payables and investment deposits require carrying-amount/non-overlap reconciliation against reported captions before v2 debt population can be certified

Provider anomaly/zero review rows: 200. Original raw observations are retained; issuer-resolved discrepancies are in MSN_CONFLICT_RESOLUTION.csv. SAB's external issuer CFO conflict is explicitly retained as unresolved, separate from the admission engine's conflict list.

Inventory uses issuer net totals and exact gross/provision reconciliation. Components preserve merchandise, raw materials, work in progress, finished goods, goods in transit, supplies and consignment where disclosed. Consolidated net accounting revenue is distinct from segment/JV/associate revenue, customer advances, GMV and store KPIs. Cash, term deposits and financial investments are distinct. Commercial payables are not debt without financing evidence. Recognized finance leases follow existing policy; future rent is not capitalized. No Level-2/3 normalization or valuation was produced.

The inherited RETAIL requirement route is unchanged from the retained admission universe at starting HEAD: 7 CORE, 1 SECTOR_CORE (INVENTORY), 8 SUPPORTING per required period. No generic consumer contract was invented. The older official effective-dated production sector mapping is BLOCKED; inherited accounting routes are not promoted into official M3 sector-assignment authority. MSN retains its consolidated conglomerate perimeter regardless of the inherited route label. Project Owner review of production sector assignments remains outstanding.

Original PDFs retained: 5. Missing required originals: none. Qualified annual FY2022-FY2025 sources and available reviewed 6M2026 originals remain under data/manual-fundamentals/MSN/. Unqualified MCH notice/alternative files remain excluded from canonical use. Publication times are null unless proven; dated index disclosures are separate from exact timestamps.

Cleanup: 463 ticker-prefixed disposable files deleted, plus shared disposable tooling recorded in DELETION_MANIFEST.json. No backup or archive. Legacy extraction with protected HPG replay dependencies is retained. All five independent offline replays pass after deletion; source hashes, exact canonical output, inventory/debt arithmetic and separate producer processes are verified.

Supporting gaps are not neutral-filled. MSN_DEFERRED_ANALYTICAL_GAPS.json carries common-share qualification, normalized returns/cash flow/EBITDA, unrestricted cash, organic growth, store/brand economics and valuation to later work. Optional missing accounting support is visible in its closure CSV; it is not relabeled as proven analytical evidence.

Validation: 43 Consumer/Retail regressions PASS; shared targeted regressions 340 PASS; unit suite 1,096 PASS; architecture suite 98 PASS; lint/typecheck/DB PASS; all seven protected ticker regressions/replays PASS; final full application suite **1,428 PASS / 0 FAIL**. Earlier native SIGSEGV runs and one timeout, subsequently recovered, are preserved with classifications in TEST_RESULTS.json.

Independent human review and Project Owner approval remain pending. Historical PIT NOT_READY does not block CURRENT_ANALYSIS by itself. No official M3 scoring, ranking, investment decisions, DI14 or DI15 approval. Stop after these five tickers; await “Review Consumer / Retail Group Closure”.
