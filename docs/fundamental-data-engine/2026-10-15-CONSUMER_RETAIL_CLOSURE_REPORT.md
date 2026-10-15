# Consumer / Retail independent Level-1 closure report

Starting HEAD: `2ba374b8ccadf9220d922de9769ea156f46eda44`. Final HEAD: `2ba374b8ccadf9220d922de9769ea156f46eda44`. Work remains uncommitted; no commit or push performed.

| Ticker | CORE before → after | SECTOR_CORE before → after | SUPPORTING before → after | Verdict |
|---|---|---|---|---|
| MSN | 20/35 → 30/35 | 4/5 → 5/5 | 19/40 → 19/40 | C — blocked |
| MWG | 18/35 → 35/35 | 4/5 → 5/5 | 14/40 → 16/40 | B — conditionally closed |
| VNM | 20/35 → 24/35 | 3/5 → 4/5 | 14/40 → 16/40 | C — blocked |
| SAB | 20/35 → 35/35 | 4/5 → 5/5 | 18/40 → 18/40 | C — blocked |
| MCH | 20/35 → 35/35 | 4/5 → 5/5 | 16/40 → 16/40 | B — conditionally closed |

## MSN

**C. MSN BLOCKED — MATERIAL LEVEL-1 DATA-INTEGRITY GAPS REMAIN**

Current: 2026-06-30; consolidated scope. Critical/Major/Minor: 0/1/0. Retained PDFs: 5. Cash and equivalents are not qualified unrestricted cash; NET_DEBT remains N_R.

- Interest-bearing deferred acquisition payables and investment deposits require carrying-amount/non-overlap reconciliation against reported captions before v2 debt population can be certified

Full source, debt, comparability, anomaly, conflict, cleanup, replay and supporting-gap details: [independent final review](evidence/2026-10-15-ticker-closure-MSN/FINAL_REVIEW.md).

## MWG

**B. MWG CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD**

Current: 2026-06-30; consolidated scope. Critical/Major/Minor: 0/0/0. Retained PDFs: 5. Cash and equivalents are not qualified unrestricted cash; NET_DEBT remains N_R.

Reported-borrowing population and current trajectory qualified; remaining analytical gaps carried forward.

Full source, debt, comparability, anomaly, conflict, cleanup, replay and supporting-gap details: [independent final review](evidence/2026-10-15-ticker-closure-MWG/FINAL_REVIEW.md).

## VNM

**C. VNM BLOCKED — MATERIAL LEVEL-1 DATA-INTEGRITY GAPS REMAIN**

Current: UNAVAILABLE (required 2026-06-30); consolidated scope. Critical/Major/Minor: 0/2/0. Retained PDFs: 4. Cash and equivalents are not qualified unrestricted cash; NET_DEBT remains N_R.

- Reviewed consolidated 6M2026 original unavailable: issuer-linked CloudFront URL returns HTTP 403; quarter flows do not satisfy current YTD obligation
- Annual short/long borrowing captions verified, but exact end-date current-portion and financing-population reconciliation is unqualified; no v2 receipt manufactured from annual transfer flows

Full source, debt, comparability, anomaly, conflict, cleanup, replay and supporting-gap details: [independent final review](evidence/2026-10-15-ticker-closure-VNM/FINAL_REVIEW.md).

## SAB

**C. SAB BLOCKED — MATERIAL LEVEL-1 DATA-INTEGRITY GAPS REMAIN**

Current: 2026-06-30; consolidated scope. Critical/Major/Minor: 0/1/0. Retained PDFs: 5. Cash and equivalents are not qualified unrestricted cash; NET_DEBT remains N_R.

- FY2023 CFO differs between original FY2023 and FY2024 comparative (1,940,064,108,479 versus 2,104,718,257,779 VND); revision relationship requires issuer disclosure qualification

Full source, debt, comparability, anomaly, conflict, cleanup, replay and supporting-gap details: [independent final review](evidence/2026-10-15-ticker-closure-SAB/FINAL_REVIEW.md).

## MCH

**B. MCH CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD**

Current: 2026-06-30; consolidated scope. Critical/Major/Minor: 0/0/0. Retained PDFs: 9. Cash and equivalents are not qualified unrestricted cash; NET_DEBT remains N_R.

Reported-borrowing population and current trajectory qualified; remaining analytical gaps carried forward.

Full source, debt, comparability, anomaly, conflict, cleanup, replay and supporting-gap details: [independent final review](evidence/2026-10-15-ticker-closure-MCH/FINAL_REVIEW.md).

## Shared validation and boundaries

- Final full application suite: **1,428 PASS / 0 FAIL**, 108 files, exit 0.
- Consumer/Retail semantics: 43 PASS, covering all 33 mandated cases plus ticker-specific isolation/source checks.
- Shared debt/CafeF/current-period/protected/architecture targeted set: 340 PASS. Complete unit suite: 1,096 PASS. Architecture tests: 98 PASS.
- Fundamental data, structured certification, current-period and canonical-conflict tests: PASS within the final full suite.
- HPG, VCB, SSI, FPT, VHM, VRE and VPL: existing independent replays/regressions PASS; protected evidence and original-source hashes unchanged. HPG debt replay also PASS.
- Lint, architecture boundaries, typecheck and database schema validation: PASS.
- Earlier thread-pool SIGSEGV process failures and one 20-second backup-test timeout were recovered. They remain recorded in every ticker's TEST_RESULTS.json; no failures are hidden. Final standard full-suite command succeeded.
- Five separate offline replays pass after deleting 1,772 disposable extraction/tooling files. Original PDFs, immutable NAM/QUY provider snapshots and provenance/replay essentials remain. Existing legacy extraction with 359 protected HPG source bindings was not deleted. No backup or archive was made.

All five use inherited RETAIL labels in the retained admission universe; the exact existing accounting denominators are unchanged. The earlier official effective-dated production sector mapping remains BLOCKED. This work does not claim that inherited route labels constitute official M3 classification approval. MSN's conglomerate consolidation perimeter and MCH/MSN issuer separation remain explicit.

Current obligation is 6M2026 under the existing 60-day quarterly grace rule; no Q2→6M assumption or annualization. Original and later comparative observations/reclassification relationships are retained without silently overwriting original-year reporting bases. Supporting completeness, unrestricted cash, comprehensive debt, normalized economics and historical PIT are not forced prerequisites for B closure.

Original/raw files under data/ are locally retained and ignored by the existing repository policy. Git alone does not distribute them; deterministic offline replay requires these physical source bytes and fails closed on absence/hash mismatch.

Independent human review and Project Owner approval remain required. No scoring, ranking, valuation, investment recommendation, DCA, DI14 or DI15 approval. No additional ticker or sector processed. Await **Review Consumer / Retail Group Closure**.
