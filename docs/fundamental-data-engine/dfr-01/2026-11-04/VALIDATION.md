# DFR-01 pilot validation — 2026-11-04

**PASS for the scoped read-only pilot.** This is not independent production acceptance or a full-release test result.

Owner-authorized scope: FPT, VNM, BID, TCX, VIC, VHM; FY2025 AS_REVISED. Thirty issuers inventoried across the PDF, notes, API and combine layers; all 90 display/combine shard hashes verified against their manifests. Eight API schema quarantines remain visible.

## Results

| Check | Actual result |
|---|---|
| `node scripts/build-dfr01-pilot.mjs` | Six dossiers, 844 input pins, 19 deterministic output files |
| Repeated build with unchanged code/inputs/cutoff | Byte-identical output manifest; see [replay receipt](REPLAY_VALIDATION.json) |
| `node --test scripts/test-dfr01-pilot.mjs` | **15/15 PASS** |
| `pnpm exec vitest run tests/unit/retained-financial-research.test.tsx tests/integration/personal-ai-scoring.test.ts tests/unit/personal-ai-scoring.test.ts tests/unit/personal-ai-provenance.test.ts` | **4 files, 54/54 PASS** |
| `python3 scripts/test-investment-research-v2.py` | **18/18 PASS** |
| `node scripts/verify-approved-scoring-authority.mjs` | PASS; 37 authority artifacts, 133 historical files unchanged, 9 compatibilities |
| ESLint on the three new `.mjs` files | PASS |
| Node syntax checks and `git diff --check` | PASS |

Executed JavaScript with `/private/tmp/node-v22.23.2-darwin-arm64/bin/node` (and that directory prepended to PATH for pnpm). **87 scoped tests passed.** The original new-test run had one assertion-API syntax failure; the test was corrected and the complete final 15-test run passed. No unresolved test failure is hidden by the final scoped result. Full build/typecheck/B6 suites were not rerun because production/runtime code is unchanged; no whole-production PASS is asserted.

Deterministic manifest SHA-256: `af7bb08d37d692632e198382282be704316753cf8aefdc43edaff0c77ac7240c`. Actual execution timestamps are kept separately in [EXECUTION.json](EXECUTION.json), without authenticated model/session claims.

## Research output and explicit limits

- 2,732 FY2025/date-key primary-statement row candidates: 2,216 `REFERENCE_ONLY`, 516 `MISSING` after loader eligibility/lineage checks. Original candidate values, lexical readings, review reasons and evidence pointers remain available. A withheld extraction value is not interpreted as accounting zero.
- Four supported **accounting-capital** references, reused from hash-pinned prior source-page review. Expected/actual VND values: BID 167,988,959,000,000; TCX 44,099,580,183,375; VIC 147,566,342,000,000; VHM 238,079,067,000,000. These do not establish recoverable/distributable capital or common-share fair value.
- Six reported-common-earnings references remain `REFERENCE_ONLY`; retained scenario models remain conditional estimates. VNM's consolidated reported reference and standalone working case are kept distinct.
- **1/138** rubric judgments reused: VIC/RG-UNC, “High uncertainty”, 0/2. This is an actual supported prior band judgment, not a missing-data penalty. **137/138 remain NOT_RATED**; no new rubric ratings, total score, weight redistribution or ranking. The historical R4 receipt remains 4/690, with no new issuer acceptance.
- Eighteen API probes replay exact raw numeric tokens through raw JSON Pointers and pinned request metadata. Unknown provider units, mode/scope questions and HPG clustered zeros remain references requiring review.
- TCX date keys/row pages, VHM's extraction/closing-column exception and VIC's unresolved closing-column binding are explicit. Original extraction bytes remain unchanged; capital overlays link to predecessor reviews. There was no new whole-statement visual review and no claim of independent human challenge.
- History/interim/unresolved variants remain separate; no generic growth series, new share-price target or MoS is inferred.

## Boundary evidence and handoff

[Boundary verification](boundary-verification.json) contains before/after fingerprints for application/domain/infrastructure code, Prisma/config, prior scoring-dataset artifacts and the database/available sidecars. The final tests rehash those files. Both formal DI and AI-review validators reject dossier objects. Approved scoring authority remains `8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1`.

No production code/config, source JSON, sealed baseline, scoring registry, weights, decision/DCA behavior, SQLite ledger or NAV was changed. No deployment, commit or push was performed.

The pilot is ready for owner dossier review. Expansion to 30 issuer dossiers remains a subsequent decision. Formal acceptance still requires route-specific revalidation, exact bindings/seals, DI1–DI15, strict-v2 and the applicable market/share/action/valuation prerequisites and authenticated sign-off.
