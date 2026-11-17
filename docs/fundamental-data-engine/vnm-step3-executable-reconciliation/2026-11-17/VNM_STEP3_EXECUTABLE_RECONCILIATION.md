# VNM Step 3 — TECHNICALLY_VALID / AUTHORIZATION_BLOCKED

Baseline: c3519b146094333a72ae27740a5450741fa9bef0, the owner-approved Step 2 closure. Tracked source was clean at review start. No live executable, verifier, approval, active authority configuration, source admission, research closure or portfolio data was modified by this reconciliation.

## Exact identity and provenance

The active configuration is `src/infrastructure/dependencies/active-authorities.json`, pointing to the 2026-10-29 approved bundle. Its executable is `scoring-executable-production-m64-clarification-1-v1.0.0-20261029-r1`, bound to manifest content hash `8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1`.

There are **five**, not four, current runtime mismatches: four domain files plus the additive Step 2 `engine.ts` change. All 37 approved runtime pins and two dependency pins were checked. Each of the five approved file versions was recovered from commit 9949c62a3d315cca1d2d1b2acd6d74256895ed5c and verified against its original approved SHA-256. The same bytes were independently fetched from that exact repository commit through GitHub; no baseline was inferred from tests. Snapshots are `.txt` to avoid compiling archived code as live source.

See `EXECUTABLE_HASH_COMPARISON.json`, `approved/`, `current/` and the five unified diffs.

## Semantic findings

| File | Classification and effect |
| --- | --- |
| application/scoring/engine.ts | Compatibility extension: independent current dataset resolution and optional dependency. Existing score/rank method bytes are identical. No score authorization is granted by data consumption. |
| domain/market-boundary/validation.ts | Validation tightening: enforce CaféF raw-only semantics and reject adjusted/substitute close observations. Adds a runtime raw-close dependency. Removing it would weaken the separately approved raw-price policy. |
| domain/scoring/evidence.ts | Purpose-scoped extension: explicitly accept later operational knowledge for CURRENT_FORMAL_VALUATION with hash/receipt/review/ingestion checks. Historical branch retained; current-only evidence remains rejected by the historical/default scorecard path. |
| domain/scoring/metrics.ts | Validation tightening plus behavior-changing correction: source/scope/revision/annual endpoint validation and action-adjusted EPS requirements. Proper cross-year CAGR endpoints can calculate where the old equal-period guard rejected them. Growth arithmetic itself is unchanged; this is not universal input/output equivalence. |
| domain/scoring/scorecard.ts | Scoped gate relaxation plus action-metric tightening: unrelated rubrics are no longer globally blocked by action comparability. Per-share/action-dependent topics remain gated. Component eligibility can change. This must not be called formatting or unconditional equivalence. |

Five exact protected code-segment comparisons independently establish unchanged score/rank methods, growth arithmetic, M1/confidence/risk gate validation, assessment band checks and final category/confidence/validity calculation. Weights and thresholds are unchanged. `METRIC_DEFINITIONS` §3A.6 limits corporate-action comparability to action/per-share dependencies; §12.1/§12.2 define revenue/EPS CAGR. These support the implementation rationale, but do not approve changed executable bytes.

No new trading, portfolio mutation, automatic production authority, or bypass of HUMAN assessment provenance was found. Production use of the changed bytes remains unauthorized under the old executable identity.

## Runtime and regression evidence

- Final current suite: **280 passed, 2 failed, 0 skipped, 282 total**. The two failures are the existing positive production-authority acceptance/CAS tests, both blocked by `SCORING_EXECUTABLE_HASH_MISMATCH:src/application/scoring/engine.ts`. They are genuine unresolved authority failures, not suppressed tests.
- Functional tests excluding that authority-acceptance file: **266/266 passed**. Authority file: 14 negative checks passed; two positive authority checks remain blocked.
- M3 golden tests: 32/32 on current code and 32/32 against a temporary 37-file approved-byte runtime control.
- Nine complete synthetic outputs are equal between approved/current code, including sector, Stage0, veto and confidence cases. Two deliberate behavior differences are recorded: scoped action eligibility and three-year CAGR. No VNM score was generated.
- Restoration control: old engine has no current dataset resolver, and old Evidence rejects all 35 retained current-purpose evidence rows. Current code accepts those evidence rows under the explicit current purpose. Thus wholesale restoration would break approved Step 2.
- Actual unchanged verifier: approved-byte temporary control passes; replacing each individual file with current bytes rejects that specific file. Formatting-only drift also rejects.
- Strict scoped TypeScript: PASS, zero diagnostics. The initial cold-cache negative-test timeout was rerun successfully and the final whole selected suite has no timeout.

## Authority decision

The old `OWNER_APPROVAL_RECEIPT.json` explicitly excludes “future changed bytes”. `production-authority.ts` also pins the exact manifest ID/hash/build tuple and exact old owner statement. Its historical approval cannot authorize this proposal; source standing approvals and Step 2 acceptance cannot replace executable approval.

Actual verifier before: BLOCKED on engine.ts. After: the same BLOCKED result. No authorized change was available or applied. The approved-byte positive control passed only in a disposable root; it was not restored into live source.

An exact review package is prepared:

- `PROPOSED_EXECUTABLE_REVIEW_MANIFEST.json`: 71 current runtime artifacts, preserving the old closure and explicitly adding current intake roots; status remains technically reviewed, not approved.
- `PROPOSED_VERSION_TRANSITION.json` and `proposed/production-authority.ts.txt`: exact text-only verifier extension for this one new manifest tuple, with current/proposed hashes. Old tuple and all source/receipt/hash checks remain. Tests show the old approved tuple still passes, all five old-tuple drifts still reject, and the new manifest cannot inherit the old owner approval.
- `AUTHORITY_BINDING_DECISION.json`: exact missing authority and transition scope. No owner receipt/signature, approved bundle or activation was manufactured.

Required authority: PROJECT_OWNER under the existing SCORING_EXECUTABLE_PRODUCTION contract. The owner must review and authorize the exact candidate manifest and proposed verifier bytes, including observable eligibility changes. Thereafter a separately versioned verifier/binding/compatibility transition must be implemented and accepted by the actual verifier. The current verifier does not support arbitrary new manifest hashes; do not simply rehash the old manifest or activate a new bundle.

Source approvals are not reopened. S1–S5 and Steps 1/2 remain intact. Step 3 is BLOCKING, classified TECHNICALLY_VALID / AUTHORIZATION_BLOCKED. No Step 4, VNM scoring, CAS/live production activation, portfolio, transactions or NAV changes occurred.

STOP for CIO review of this exact package.

Exact candidate manifest content hash: `67a28b1cad9fc3efcd97bed9a1191d4d8fc52c5a0976c7d1e120a596de339c33`.

Exact proposed verifier SHA-256: `2b936408f3cb7bf712f874bfbcb4cc744f709428f6bb032ae5da8c700886ef69`.

Neither hash has an actual owner authorization reference. The proposed verifier is a text-only review artifact, not active code. The proposal builder is anchored to the pre-evidence-commit reviewed tree c3519b1; future replay should verify the frozen pins rather than redate/rewrite this review.
