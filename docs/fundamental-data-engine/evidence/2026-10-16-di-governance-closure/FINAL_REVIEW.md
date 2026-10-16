# Data Initialization — Governance Closure Fix

Starting HEAD: `718685ebab973b1c800c78f51a2ae76147e502e5`. Review date:2026-10-16, Asia/Ho_Chi_Minh. This is an infrastructure/governance candidate, not scoring authorization or independent DI acceptance.

## Separate outcomes

|Workstream|Outcome|
|---|---|
|OFFICIAL_UNIVERSE|CERTIFIED|
|HPG|CLOSED|
|VJC|CLOSED|
|GVR|CLOSED|
|PARTIAL_UNIVERSE_POLICY|OWNER_DECISION_REQUIRED|
|DI14|PENDING_INDEPENDENT_APPROVAL|
|DI15|FAIL|

**25 CLOSED,5 DEFERRED_BLOCKED,0 UNPROCESSED,0 INCONSISTENT.** Original accounting facts for VNM/TCX/MBB/VIB/VIC were not reanalyzed or edited. All candidate readyForScoring/decisionReady flags remain false. CLOSED means Level1 evidence closure; it does not mean confidence/qualitative/market/valuation/production admission gates pass.

## Official universe and subsequent history

The [July15 official notice](https://api.hsx.vn/n/api/v1/1/news/2479382) announces the August3 effective composition. The freshly retrieved [original constituent PDF](https://staticfile.hsx.vn/Uploads/UploadDocuments/2479382/15072026%20CBTT%20-%20Danh%20muc%20thanh%20phan%20HOSE-Index%20thang%207.2026.pdf) matches the retained original SHA256 `441799b3afbc4f29f8b53ce6ef3b500b9121a4d032ca4cfeb1d4aa6e14407879`. Its main page1 table was extracted by table boundaries and visually inspected; all30 numbered rows are included and the separate five-name reserve table is excluded.

The dated notice was not assumed permanently current. The official application's actual date-query parameters were inspected, then all9 pages of the [August3–October16 official news history](https://api.hsx.vn/n/api/v1/1/news?startDate=2026-08-03&endDate=2026-10-16&pageIndex=1&pageSize=1000&aliasCate=tin-tuc) were retained and hashed:8992 records,8992 unique IDs, matching the advertised total with no page gap. An additional3 pages covering July15–August2 contain2792 unique records, to catch announcements before the effective date that could take effect later. Twenty-four index-administration/change-notice candidates were reviewed. The initial catId-only endpoint probe ignored that filter; its unrestricted historical output is explicitly not used to prove completeness.

Actual later constituent changes were inspected: SD6 and DVM concern VNX Allshare; TTF concerns VNSmallcap/VNAllshare/VNX Allshare, not VN30. The August3 share-count update leaves previously announced other information unchanged. September29 rule reorganization introduces general/specific documents and a future periodic announcement/effective timetable; its official communication and original rule PDFs were retained, not treated as a constituent-change event. The latest factsheet is updated September30 and published October16; a monthly top-company table is not used as complete membership evidence. No subsequent VN30 constituent-change notice was found in the complete captured official publication interval.

The undated API still returns DGC/PLX/TPB where the dated composition has BSR/MCH/TCX. It provides no dated index-review event/effective interval explaining replacement, so it cannot override the official effective-dated notice plus reviewed subsequent history. Its original response and diagnostic discrepancy remain visible. Certification is bounded to official publications available in the captured October16 history; future retroactive notices would require review, not silent overwrite.

Certified composition:

ACB, BID, BSR, CTG, FPT, GAS, GVR, HDB, HPG, LPB, MBB, MCH, MSN, MWG, SAB, SHB, SSB, SSI, STB, TCB, TCX, VCB, VHM, VIB, VIC, VJC, VNM, VPB, VPL, VRE.

Entering versus research denominator: **none**. Exiting: **none**. Exact30/unique and every disposition reconcile. Production membership/sector registries and databases were not rewritten. If independently established composition differs, the new guard reports CHANGED_REQUIRES_INITIALIZATION / UNIVERSE_CHANGE_REQUIRES_DATA_INITIALIZATION with exact entering/exiting names and stops candidate generation. Tests cover this negative path; no new ticker initialization is performed.

## HPG compact durable successor

The original activated input had873 source bindings,359 of which were extraction/render artifacts. `validVerification` does not consult retainedReaderProof. However, `buildHybridAdmission` copies verification metadata using `{...v}` and can retain issuer-verification metadata inside certified structured facts. That copied proof therefore changes exact canonical serialization even though no accounting value changes. In addition, every sourceBinding is included in the snapshot contentHash; removing unused extraction bindings legitimately creates a new snapshot identity.

The successor removes only retainedReaderProof recursively and the359 extraction bindings. All514 retained source bindings are physically hash-verified. REQUIRED_DURABLE_PROVENANCE includes original PDFs; REQUIRED_REPLAY_INPUT includes immutable provider raw/certification and semantic receipt bindings; extraction bindings are DISPOSABLE_EXTRACTION_ARTIFACT in the successor; copied reader proofs are REDUNDANT_METADATA. Every original binding and reader-proof field is classified individually in HPG_RETENTION_DEPENDENCY_ANALYSIS.json. Legacy cross-ticker sources/calibration context remain where needed to preserve exact registry diagnostics and snapshot semantics; no foreign issuer fact enters HPG.

All84 canonical facts are semantically identical. The equivalence check compares the entire snapshots after excluding ONLY retainedReaderProof recursively plus the top-level sourceBindings/contentHash. Fact IDs, values, periods, units, scope, source identity, revisions, debt populations, derived metrics, diagnostics, requirements/provider/mapping versions and every other field remain equal. A separate exact comparison checks key accounting/source/provenance tuples. No debt/economic re-analysis, guessed normalization or value patch occurred.

HPG_COMPACT_PROVENANCE_REVIEW.json retains original PDF hashes, issuer, exact period/scope, note/page/statement locators, observation values, verification method, review lineage and parser/mapping versions. The successor's physical PDF hashes remain auditable. Independent offline domain replay exactly reproduces its new canonical artifact; a separate producer process regenerates all successor outputs byte-for-byte. Source bindings and serialized successor input contain no OCR/page render/image/extracted-text/scratch dependency.

No historical extraction file was deleted or archived. Historical sealed packages and their old replay tests still bind those bytes; they are REQUIRED_REPLAY_INPUT for those immutable historical contracts even though disposable for the new active successor. This is not an exception allowing active disposable dependencies: the new closure needs none. Removing historical bytes would break protected replay and is outside this retention-only successor. Original HPG accounting/source packages and all old seals are untouched.

## VJC and GVR exit1

Both original failures reproduce exactly: `node scripts/verify-vjc-ticker.mjs` and `node scripts/verify-gvr-ticker.mjs` omit mandatory --ticker. At line13, `assert(['VJC'].includes(ticker))` (or the GVR equivalent) receives undefined, producing actual false versus expected true before source/hash/canonical checks execute. Classification: **COMMAND_INVOCATION_ERROR**, not stale HEAD/hash, nondeterminism or accounting divergence.

Corrected commands are `node scripts/verify-vjc-ticker.mjs --ticker=VJC` and `node scripts/verify-gvr-ticker.mjs --ticker=GVR`. Both independent sealed producer replays pass. Exact stdout/stderr, assertion, expected/actual, exits and canonical file hashes are in the diagnosis JSON files. The new aggregate runner records explicit arguments. Original verifier scripts, expected-head fields, artifact seals and canonical accounting files are unchanged. Original exit1 logs are retained rather than hidden by successful reruns. The previous final review narrative overstated verifier-success coverage; its retained command records contain these two exit1 results. This successor corrects the aggregate claim without rewriting historical sealed evidence.

## Partial-universe governance and DI gates

M1 governs VN30-only investability and capital protection; M2 makes effective-dated membership/coverage authoritative; M3 disallows fabricated complete scores and missing-weight redistribution; M4/M5 preserve readiness/actionability requirements; M6 implementation requires trusted exact independent DI acceptance; M7 preserves data-validation requirements; M8 defines DI15 as no unresolved Critical/Major data issue. PARTIAL_UNIVERSE_GOVERNANCE_REVIEW.md and DI15_POLICY_REVIEW.json trace exact repository paths and effects.

`scoring-readiness.ts:53–63` requires all15 DI gates PASS, all30 members accounted and every Critical/Major issue in the full acceptance register resolved. Null ticker input/bridge is representable, but does not waive global issue closure. INITIAL_SCORING_REPORT.md §7 allows explicitly blocked/deferred/excluded members only under approved rules; it does not approve omitting these five unresolved source issues. Current full-initialization acceptance follows A. B requires an explicit Owner policy amendment to DI15 scope and compatible reviewed acceptance-contract implementation. Any Constitution conflict would need its separate change-control process. This work does not modify the Constitution or choose B.

The proposal keeps FULL_UNIVERSE visible and partitions evidence eligibility without neutral scores, Top10 inclusion, positive STRONG BUY/BUY/ACCUMULATE states or new capital for deferred members. Every deferred row retains its actual blocker and next-review trigger. Mandatory market/valuation/qualitative/confidence/global acceptance gates remain additional requirements even for Level1 CLOSED. This is an unapproved proposal; no runtime policy is enabled by this evidence package.

**DI15 remains FAIL** because concrete Major Level1 source/definition/accounting issues remain in VNM/TCX/MBB/VIB/VIC. Quarantine is not closure. **DI14 remains PENDING_INDEPENDENT_APPROVAL**. Its candidate binds the starting commit plus explicit hashed working-tree overlay, exact universe hash, all30 snapshot hashes and aggregate dataSnapshotHash, build/test evidence, exception register and disposition matrix. Reviewer signoff, approval capability and final review commit remain null; an independent reviewer must pin the actual final committed candidate before acceptance. No producer-authored PASS or formal acceptance is written.

## Validation

**Full-suite retest:1804 PASS /0 FAIL** (120 files), using `pnpm exec vitest run --testTimeout=60000`. The original `pnpm test` run was1803 PASS /1 FAIL: existing backup/restore safety test exceeded its20000ms timeout; no safety assertion failed. The same backup file passed3/3 in isolation with the original timeout. Only the repeat command timeout increased; repository configuration and safety assertions are unchanged. The initial new governance run had2 matcher failures (localized public Error.message versus structured reason codes), fixed in test assertions and retained in logs. Original VJC/GVR missing-argument exit1 logs remain retained.

Final completed checks:21/21 governance+aggregate,603/603 fundamental/closure,98/98 architecture,32/32 protected replay commands,30/30 aggregate dispositions, structured certification, HPG independent replay, lint/typecheck/DB, Webpack production build and12/12 E2E. See TEST_RESULTS.json for exact commands, exits and all initial failures/retests. Existing baseline stated by the request is1783; starting HEAD also contains3 aggregate regressions, and this work adds18 governance cases, so the complete suite contains1804 tests. New governance plus aggregate focused tests contain21 cases; fundamental/closure focused suite contains603 cases; architecture contains98 cases. All protected replay commands, structured certification, source hashes, lint/typecheck/DB checks and Webpack build/E2E are recorded separately. Tests use synthetic investment fixtures; no production scoring, ranking, Top10 or investment decision is executed.

No existing tracked source/evidence was changed. E2E-generated48 tracked synthetic screenshots were restored from the clean starting HEAD and checked byte-for-byte. The entire new evidence package and review scripts/tests are hash-bound in ARTIFACT_HASHES.json. No new commit or push is claimed.

**STOP. Await “Review Data Initialization Governance Closure”.**
