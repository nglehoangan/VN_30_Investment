# VIC Level-1 primary closure round

**C. BLOCKED — MATERIAL LEVEL-1 DATA-INTEGRITY GAPS REMAIN.**

Read [FINAL_REVIEW.md](FINAL_REVIEW.md), [VIC_FINAL_SUFFICIENCY.json](VIC_FINAL_SUFFICIENCY.json), and [OPEN_ISSUES.json](OPEN_ISSUES.json). Required accounting coverage remains 13/35 CORE, 3/5 SECTOR_CORE and 9/40 SUPPORTING. SUPPORTING incompleteness is not itself the blocker.

The unchanged production registry assigns VIC to REAL_ESTATE. This is the approved requirement route, not a claim that Vingroup is exclusively a real-estate business. All canonical accounting preserves VIC's consolidated issuer perimeter. No VHM, VRE, VPL, VinFast or other subsidiary facts substitute for VIC.

The issuer's 2026 index lists a reviewed consolidated interim statement dated 29 August 2026. Its linked original returned HTTP 403. The required current window is 1 January–30 June 2026 under the existing 60-day grace policy; Q3 is still within grace on 16 October. No interim original was retained or qualified, and no assertion of global source unavailability is made.

The annual originals and existing reviewed observations are retained unchanged. This round does not certify completion of the consolidation, debt-population, hybrid, cash, inventory, CapEx, NCI or restatement note reviews. The corresponding review artifacts explicitly record that limit. They must not be read as clean accounting opinions or evidence that no material changes occurred.

Run offline with Node 22.23.2:

```sh
node scripts/verify-vic-ticker.mjs --ticker=VIC
node scripts/close-vic-ticker.mjs --ticker=VIC --out=/tmp/vic-offline-replay
```

The verifier checks source bytes and canonical replay in a separate process, then reproduces generated artifacts byte for byte. It is not independent human accounting approval. Original PDFs and CafeF raw snapshots are physically retained under the existing ignored data policy; a Git-only checkout will require those exact source bytes. The verifier fails if they are missing or altered.

Starting HEAD: `a79b6c3e3448b6d841bd6ffda5855eb9fb1ac453`. Final HEAD: `PENDING_COMMIT`. No commit created.

The 25 approved tickers remain protected. VNM, TCX, MBB and VIB remain DEFERRED BLOCKED. Stop after this primary round; wait for **Review VIC Level-1 Closure**. No automatic forensic round, scoring, ranking, decisions, DI14 or DI15 approval. `readyForScoring=false`, `decisionReady=false`.
