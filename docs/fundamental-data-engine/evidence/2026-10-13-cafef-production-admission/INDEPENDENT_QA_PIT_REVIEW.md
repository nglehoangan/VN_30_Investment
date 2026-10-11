# Independent QA and PIT review

Recommended verdict: C. BLOCKED — MATERIAL DATA GAPS REMAIN

This review was performed by a separate QA/PIT role with no implementation edits and no DI gate approval. The reviewer read the admission domain, retained admission input, certification report, period/sector/PIT validations, coverage issues, and verifier, and executed offline replay independently.

Command: `/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/verify-cafef-production-admission.mjs`.
Exit code: 0. Result at first inspection: PASS, 15 regressions, 826 source bindings. The verifier independently hashes retained sources, compares the full canonical snapshot, and launches a separate-process artifact regeneration into a temporary directory. No network or official scoring was used.

Required HPG/SSI false-zero regressions and VCB parent-NPAT discrepancy are covered. The invalid-quarter sentinel, ambiguous quarterly cash-flow basis, missing current YTD denominators, cross-sector namespace collision, common-mode Detail/Summary agreement, malformed numeric input, noncanonical lexical zero, malformed certificate review timestamp, unbound certificate, and historical publication exclusion checks pass in the inspected suite.

Certificate admission remains fail closed. Exact-record certificates require matching candidate ID, raw hash, concept, dimensions, retained reference/hash, and explicit attestation flags. Retained evidence does not establish the full metadata/revision attestations; zero certificates are issued and zero candidates admitted DIRECT_STRUCTURED. Provider agreement is not independent verification. Unknown historical publication is excluded: historical replay admits zero facts, with zero observed historical PIT violations. This is safe exclusion, not proof of useful historical coverage.

Production coverage remains materially insufficient: CORE 250/750 (33.3333%), SECTOR_CORE 90/365 (24.6575%), and 16 unresolved required CORE conflicts. Missing YTD and decision-critical sector evidence remains in the denominators. These findings preclude production approval despite successful replay.

An additional adversarial check found an availability defect at first inspection: replacing a retained candidate value with `not-a-number` while retaining matching issuer verifications throws from issuer numeric matching. The existing malformed-input test removes verifications and therefore misses this branch. The finding was reported to the implementation owner for repair and expanded validation. It does not demonstrate silent admission. See the final addendum below for repair disposition.

Historical dashboard PNGs were temporarily modified by browser tests at inspection. The implementation owner was notified to restore these generated historical artifacts before evidence sealing. Historical preservation must be assessed from the final preservation report and clean diff, not from transient test output.

Limits: this QA review independently validates deterministic processing and retained-source byte bindings. It does not independently re-extract every PDF cell, establish missing publication/revision dates, certify absent structured metadata, or grant DI-14/DI-15 approval. `readyForScoring` remains false.

## Final repair verification addendum

The QA reviewer independently reran the same verifier after the reported repair: exit code 0, PASS, 17 regressions, 826 retained source bindings. Expanded checks preserve the exact qualified issuer value when a matching provider numeric is malformed, record `NUMERIC_OR_PERIOD_INVALID`, and exercise valid synthetic canonical-body certificate binding. The synthetic positive fixture tests mechanics and supplies no real-world certificate or additional production coverage. The malformed matching-issuer availability finding is resolved.

`git diff --name-only -- docs/06_DASHBOARD` produced no output. A separate byte comparison checked each of the 48 historical image files against `git show HEAD:<path>` and its recorded SHA-256; all passed, exit code 0. New browser captures reside exclusively in the current closure directory. The transient historical-image finding is resolved.

Material coverage, absent real structured certificates, missing historical publication proof, and unresolved required CORE conflicts remain. The recommended verdict remains C. BLOCKED — MATERIAL DATA GAPS REMAIN. Full-suite completion is recorded by the implementation owner in the final test-command evidence; this role's directly executed checks are listed above.

The initial image-byte comparison command exited 1 because Node's default child-process output buffer was smaller than a historical PNG (`ENOBUFS`). Rerunning with `maxBuffer: 32 * 1024 * 1024` completed all 48 comparisons, exit 0; this execution limit did not indicate an evidence mismatch.
