# Bank targeted fix — final review

Starting HEAD: `42501c4f086fd901b824386e157f6bf841424baf`  
Final HEAD: `PENDING_COMMIT`

| Ticker | Outcome | CORE | SECTOR_CORE | Major |
|---|---|---|---|---|
| MBB | REMAINS DEFERRED BLOCKED — AUTHORITATIVE EVIDENCE INSUFFICIENT | 15/15 | 19/20 | 1 |
| VIB | REMAINS DEFERRED BLOCKED — AUTHORITATIVE EVIDENCE INSUFFICIENT | 15/15 | 19/20 | 2 |

MBB's issuer prospectus Part 1, physical pages 62, 101 and 102, reports 10.73% consolidated and 10.85% standalone CAR with a March 31, 2026 footnote under a June 30 column. These are rejected for the current requirement. Exact June 30 CAR or explicit CET1 with scope and framework is still needed.

VIB's indexed June capital disclosure was inaccessible (403); the permitted mirror candidate returned 404. Neither the listing nor historical ratios establish a current canonical observation. The required original remains unacquired; no access controls were bypassed.

VIB note 44.1, physical page 63, independently discloses broader classified asset totals of VND 553,320,031 million current and 525,394,779 million comparative. Dividing the unchanged group 3–5 sums by these totals rounds to 2.10% and 2.16%. This is a plausible population explanation, not a qualified issuer headline formula. Notes 4.3–4.5 describe broader regulated debt classifications, but explicit headline denominator/perimeter confirmation remains missing. Outcome D applies. No accounting facts or canonical ratios were overwritten.

Validation: 1,717 PASS / 0 FAIL across 116 test files, matching baseline. MBB/VIB targeted checks, bank semantic regressions, all 25 approved replays, VCB, VNM/TCX preservation, structured certification, architecture boundaries, lint, typecheck and DB validation passed. The fundamental-data suite is included in the full run. The added evidence verifier passes after cleanup; it is automated independent-process replay, not independent human review. All pinned prior evidence bytes remain unchanged.

Four original MBB prospectus PDFs remain in manual folders; disposable OCR, renders, extracted readers, temporary scripts/logs/JSON and newly created structured-certification scratch were deleted. No backup/archive was made. Receipts and source hashes replay offline after deletion. No production code changed.

`readyForScoring=false`; `decisionReady=false`; DI14/DI15 `NOT_APPROVED`. No scoring, rankings, investment decisions, VIC work or further forensic round.

**STOP — wait for “Review Bank Targeted Fix”.**
