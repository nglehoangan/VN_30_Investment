# VNM Step 3 — approved static executable authority transition

This is the successor to the technical review at commit 9c0013a6e98e84d117b381b1a9d658b71a29e197. The actual owner answered the exact-content approval question with:

> Approve exact scoring executable manifest 67a28b1cad9fc3efcd97bed9a1191d4d8fc52c5a0976c7d1e120a596de339c33 for SCORING_EXECUTABLE_PRODUCTION

The question explicitly identified both the manifest and verifier SHA-256 and authorized static binding/version transition only. OWNER_REQUEST.txt preserves the exact answer; OWNER_AUTHORIZATION_CONTEXT.json retains the actual question identifier, scope and unavailable message timestamp as null. No owner signature or message timestamp was invented.

## Applied scope

- The executable manifest remains byte-for-byte the reviewed proposal: content hash `67a28b1cad9fc3efcd97bed9a1191d4d8fc52c5a0976c7d1e120a596de339c33`, 71 runtime artifacts. The five previously mismatched runtime files were not edited or restored.
- The live verifier was replaced byte-for-byte with the approved text: SHA-256 `2b936408f3cb7bf712f874bfbcb4cc744f709428f6bb032ae5da8c700886ef69`. It retains the historical tuple and adds only the reviewed new tuple and exact owner statement, with all source/hash/scope/compatibility checks retained.
- New owner receipt, executable authority, nine compatibility proofs, bundle and four authority heads are versioned in this folder. Old approvals, manifests, compatibility records and research acceptance are unchanged. Changed implementation pins appear only in new proofs, with previous pins and semantic-review references preserved.
- The server-owned static configuration selects the new bundle. Its status is ACCEPTED_STATIC_AUTHORITIES_PENDING_CAS. No live database release activation or methodology registration was performed.

The older TCBS bootstrap capture retains pre-RAW-policy software pins; the initial bootstrap attempt rejected validation.ts. Its historical pins were not rewritten. The existing catalog contract supports complete fixed STATIC_CLASSES configuration, so seven unchanged static data heads were taken from the already-accepted immutable release, verified using readRelease and its stored content hash, and pinned alongside the four new authority heads. Original dates, coverage, authority/source references and head contents remain unchanged. No new data admission or authority was manufactured. RETAINED_STATIC_HEAD_BINDING.json identifies the source release and exact retained pins. Negative tests confirm that changing retained head bytes is rejected and that the legacy code-pin reader still rejects the old validation hash. Full historical raw replay is not requalified or claimed by this closure.

The active bundle verifier and intended LocalAcceptedDependencyCatalog now both accept: 71 runtime artifacts, nine compatibility proofs and 11 static heads. The old authority cannot authorize the changed bytes; an approved-byte historical control still passes.

## Validation and preservation

FINAL_TEST_RESULTS.json records the final complete selected regression run, with no skipped assertions. It includes M3 golden/scoring, market, Evidence/provenance, M1/risk/portfolio-gate, current-purpose consumer, authority/CAS rollback in disposable databases, historical tuple and new tamper/forged-owner controls. Strict TypeScript results are recorded in SCOPED_TYPECHECK.json. PRE_CACHE_TEST_ATTEMPT.json retains the earlier isolated I/O timeout rather than hiding it.

The private test bootstrap uses a committed-SQL cache only when every Git blob and SHA-256 matches the current HEAD migration set. This avoids macOS dataless read timeouts; it does not change migration content or schema, apply production SQL, or weaken any admission assertion. MIGRATION_CACHE_VERIFICATION.json records all 23 unchanged source SQL identities. Current financial test fixtures now use the existing checksummed native bootstrap; the historical Step 2 evidence/helper remains intact.

The real VNM Step 2 path was rerun in a disposable database. Its frozen replay hashes are unchanged: 34 current native inputs plus qualified borrowings, 65 historical facts, raw CaféF close and carried-forward shares. Current-only/PIT separation remains in force; VNM17 remains pending.

Live database and key table fingerprints, including CAS pointer, release history, methodology registry, scorecards, ledger and portfolio projections, are recorded before/after. No live CAS, actual VNM score, production publication, portfolio/transactions/NAV mutation or Step 4 was executed. Synthetic scoring and CAS regression fixtures ran only in disposable test databases.

## Blocker disposition

S3-AUTH-EXACT-CONTENT is resolved by the actual exact-content owner reply and new pinned receipt. S3-AUTH-VERSION-TRANSITION is resolved by the byte-identical reviewed verifier patch, versioned bundle/proofs and accepted static configuration. See VNM_STEP3_ACCEPTANCE.json for final acceptance and VERIFIER_BEFORE_AFTER.json for actual verifier results.

Executable authority approval does not select rubric bands, approve a numeric assessment or waive M1/confidence/data-purpose gates. The new methodology metadata uses the actual owner approval date; no approval was backdated for historical scoring. The live CAS remains unchanged and no whole-application production-readiness claim is made.

STOP after Step 3 for CIO review. Do not begin Step 4 automatically.
