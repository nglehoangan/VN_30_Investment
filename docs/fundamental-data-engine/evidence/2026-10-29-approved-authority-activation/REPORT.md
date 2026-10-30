# Owner-approved current manifest — activation 2026-10-29

Status: **AUTHORITY_HASH_P1_RESOLVED**. Exact manifest `scoring-executable-current-review-20261029-r1`, content hash `8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1`, received explicit owner approval in the immediately following conversation turn: “Apporve cho mainifest mới”. Original spelling is preserved in OWNER_REQUEST.txt. Approval is recorded as an owner governance receipt, not a cryptographic signature; its recording instant is not a claimed message timestamp.

The reviewed manifest itself remains unchanged, including its historical review-only status. Approval is a separate v2 receipt bound to the exact ID/content hash. No retrospective approval was inserted into the review or old seals. Methodology identity/version and weights remain m64-clarification-1 / 1.0.0; the executable build revision and methodology registry ID distinguish 20261029-r1.

## Changes and activation

- Issued a new executable authority, nine compatibility proofs, bundle and four mutually compatible static authority heads. Rechecked every existing governing/implementation pin before issuing proofs; executable proofs additionally reference the reviewed receivable/settlement delta and its tests.
- Production verifier accepts this exact reviewed manifest only with the new approval contract, matching owner statement/date, exact manifest binding, artifact/dependency hashes, and compatibility proofs. Historical verifier behavior remains; changed bytes do not inherit old approval.
- Switched active-authorities.json to the new bundle and heads. PREVIOUS_ACTIVE_AUTHORITIES.json preserves its exact prior bytes. PROPOSED_ACTIVE_AUTHORITIES.json is the pre-CAS staging record; the active config now records CAS_ACTIVATED.
- Applied the normal ProductionDependencies.activate path against the actual local database, including catalog assertCurrent and compare-and-swap. No direct SQL head override or bypass of compatibility gates was used. CAS_ACTIVATION.json records old/new release pins and the resolved current release.
- Existing ledger, legs, portfolio, portfolio projection, publications, scoring bindings and analytical artifacts have identical row counts/hashes before and after. No scoring, ranking, decision or publication was executed.

The CAS release is `dependency-release-45716b70a9509547873ebf116d2964462eb0fc1ca3d9643c6ac7d4ce215a885f`, content hash `2f34d81611b8dd832b824e26608d23371fe7d9c2700b5d509126fd6f26a38140`.

## Validation

- validation.log: **228/228 tests passed across nine files**, including all 16 authority tests, scoring/golden/portfolio/methodology tests, portfolio accounting and dividend settlement unit/integration tests. New negatives cover the added dividend dependency and rehashed receipts with unauthorized scope, manifest binding or statement.
- TypeScript check passed; lint for changed verifier/tests/new approval, activation and verification scripts passed. Architecture boundaries passed (268 source modules).
- verification.json: all 37 current artifact pins and nine compatibility proofs valid; 133 historical authority files unchanged; the 134th historical pin is the previous active configuration, verified against its archived exact bytes.
- RUNTIME_PREFLIGHT.json: FUNDAMENTAL_DESCRIPTION resolves the newly activated release. VALUATION remains blocked by UNKNOWN_OR_AMBIGUOUS_SESSION / CURRENT_MARKET_SNAPSHOT_NOT_AVAILABLE. FORMAL_SCORING_DATASET_ACCEPTANCE_MISSING also remains. The read-only probe left the database unchanged.

The prior isolated mock-ledger failure and other B6 baseline issues are outside this authority fix; this result is not a claim that all B6 tests or release gates pass.

## Replay

```sh
PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH node scripts/verify-approved-scoring-authority.mjs
```

Use this post-activation verifier. The earlier review builder's `--verify` intentionally checks the pre-activation configuration snapshot and will detect the now-authorized active-config change. Its original script, manifest and review evidence are preserved unchanged. The new verifier checks that old config against PREVIOUS_ACTIVE_AUTHORITIES.json and checks current runtime authority through the normal verifier. One-shot approval/activation scripts refuse to overwrite their existing artifacts or activation receipt.

Approval does not extend to future changed bytes, new weights, data admission, market qualification, ranking/publication or investment decisions. Remaining market/dataset gates stay enforced.
