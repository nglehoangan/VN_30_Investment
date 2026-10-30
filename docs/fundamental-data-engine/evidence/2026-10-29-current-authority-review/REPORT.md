# Current scoring authority review — 2026-10-29

Technical review and current-byte manifest are complete. Production authority remains blocked; this review does not manufacture or inherit owner approval for changed code.

## Reviewed version

Git HEAD: `9949c62a3d315cca1d2d1b2acd6d74256895ed5c`. Exact worktree bytes are authoritative; this is not a clean-commit attestation. Methodology identity remains `m64-clarification-1` / `1.0.0`; review build revision is `20261029-r1`, not a newly approved methodology version.

Manifest: `SCORING_EXECUTABLE_REVIEW_MANIFEST.json`, contract `scoring-executable-review-manifest-v1`. Its separate contract deliberately prevents the existing production loader from interpreting technical review as production authorization. It pins 37 runtime source/JSON artifacts, import edges, dependency lockfiles, its builder and 134 historical authority/configuration files. Roots cover application scoring engine, execution context, portfolio context and ranking. Explicit type-only imports are excluded; baseline artifacts are retained. This scope does not attest the whole dashboard/API application or prove package supply-chain security.

## Code review

Compared all 36 historical manifest artifacts against their current bytes. Exactly one changed: `src/domain/portfolio/transaction.ts`. Reviewed its full diff against its historical source commit `42afdf58fbdcb9ec91cb311d9f0efbf6d1e5af48` and the complete added runtime dependency `src/domain/portfolio/dividend-settlement.ts`.

- Opening balances now accept an evidenced receivable separately from cash. Nonnegative decimal validation remains; no dividend income or spendable cash is created by opening receivables.
- Explicit dividend receipt settlement posts cash and reduces the original receivable. The validator checks portfolio/currency/issuer/action identity, original opening leg, exact allocation totals, evidence/time boundaries, receipt uniqueness and correction lineage. Structural evidence checks do not authenticate owner acceptance; infrastructure authorization remains necessary.
- Other transaction paths retain existing behavior. The scoring implementation, weights/category maxima, ranking, eligibility and methodology bytes in the historical manifest are unchanged. The dependency change is nevertheless real and cannot be waved through as a hash-only maintenance update.
- The new dependency has an explicit type-only back-reference to transaction types; it is not a runtime import cycle.

## Validation

`validation.log`: nine files, 239 tests: **238 passed, 1 failed**. Scoring, golden scoring, portfolio scoring, methodology validation, scoring artifacts, portfolio accounting and dividend-settlement unit/integration tests passed. The sole failure is the previously recorded `strict adapter accepts complete canonical opening aggregate`: its synthetic Prisma transaction mock omits the raw-query capability required by the ledger adapter. This review leaves that unrelated fixture issue visible rather than claiming a fully green suite.

`production-authority.log`: **10 passed, 2 failed**. Both positive historical-production tests reject current `transaction.ts` with `SCORING_EXECUTABLE_HASH_MISMATCH`; negative tamper/approval checks pass. This remains an activation blocker, not a review-manifest integrity failure.

Replay current manifest and historical pins:

```sh
PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH node scripts/review-scoring-authority.mjs --verify
```

The verifier recomputes the runtime closure, exact hashes/sizes, dependency pins, Git HEAD and historical inventory. Drift fails closed. The generator refuses to overwrite an existing review manifest; later source changes require a new revision/output path. `verification.json` records the successful replay. Historical seals and `active-authorities.json` were not modified. No database writes or activation were performed by this task.

## Remaining activation work

The historical receipt expressly excludes changed bytes and future versions. New owner approval must bind this review manifest's exact content hash. A subsequent activation must issue a new versioned executable authority, compatibility proofs and bundle, add appropriate verifier support, and pass production activation tests before switching the active binding. The historical seals remain immutable throughout. M7/release approval and investment/publication permissions are separate and are not supplied by this review.

Thus the requested current-version review/manifest is delivered; the broader P1 production-authority blocker is **REVIEW_COMPLETE_PENDING_NEW_APPROVAL_AND_ACTIVATION**, not closed.
