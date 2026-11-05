# DFR-03 validation

**PASS for the bounded research workflow; PENDING OWNER APPROVAL.** This is not independent financial acceptance, authenticated formal AI provenance or a full-production release result.

## Executed checks

| Command/check | Actual result |
|---|---|
| `python3 scripts/build-dfr03.py inspect` | DFR-02 core and final-review bundle, underlying source pins and protected baseline revalidated; six financial-layer hashes recorded |
| `python3 scripts/build-dfr03.py prepare` | Three topic-complete proposals, two explicit batches, actual preparation time and exact evidence bindings |
| `python3 scripts/build-dfr03.py challenge` | Separate later invocation; preparation hash verified; three substantive self-challenge records |
| `python3 scripts/build-dfr03.py finalize` | Six issuer dossiers, 138 unique rubric rows, seven completed and 131 unscored |
| Repeat `finalize` with identical inspection/preparation/challenge | 19 byte-identical output files; actual review passes were not regenerated or backdated |
| `python3 scripts/test-dfr03.py` | **17/17 PASS** |
| `python3 scripts/test-dfr02.py` | **25/25 PASS** |
| `node scripts/verify-dfr03-boundaries.mjs` | **54/54 rejection probes PASS** |
| `node scripts/verify-approved-scoring-authority.mjs` | PASS: 37 authority artifacts, 133 historical files unchanged, nine compatibilities |
| ESLint on the new boundary verifier; Python compilation; `git diff --check` | PASS |

JavaScript used the supported Node 22 binary at `/private/tmp/node-v22.23.2-darwin-arm64/bin/node`; its directory was prepended to PATH for pnpm. **42 tests passed, plus 54 explicit boundary probes.** [Machine receipt](validation-results.json), [boundary results](boundary-results.json), [phase bindings](phase-bindings.json).

Full build/typecheck/release suites were not rerun because no production application/configuration code changed. Prior release gates remain separate; no whole-release PASS is asserted.

## Required validation matrix

| Requirement | Evidence and outcome |
|---|---|
| All six issuers / all 138 rubrics | Exact issuer and rubric identity sets, 23 rows per issuer; every row has an allowed eligibility classification |
| Financial parity with DFR-02 | Metric arrays, provider references, estimates and complete original issuer files hash-identical for every issuer; **zero financial metric/value/status changes** |
| Existing four judgments | Exact original bands, points and topic evidence preserved; their status remains provisional research, not newly authenticated acceptance |
| New band support | Exact approved bands/topics validated; each new judgment has supporting refs, substantive counterevidence, assumptions, medium confidence and explicit invalidation conditions |
| Unsupported band / missing topic | Rejected; unknown evidence and conflicted metric dependencies also rejected |
| Missing information / N/A | Null points for every unfinished rubric; an unapproved N/A request is rejected; zero requires an affirmative economic-adversity basis |
| Distinct preparation/challenge | Strict inspection → preparation → challenge ordering; actual separate calls; challenge binds exact preparation file and per-assessment hashes; same-assistant self-review explicitly disclosed |
| FPT cash challenge | Six exact original pages visually reviewed for this material exception; initial proposed 4/6 lowered to 3/6 after challenge; original cash adjustments and recognition policies replace neither DFR-02 metrics nor audit assurance |
| TCX conflict containment | Printed common EPS numerator remains conflicting in unchanged DFR-02. New RG-UNC evidence excludes that numerator and all conflicted inherited common-value estimates; total NPAT/trading/funding evidence stays separate |
| Source conflict through metric graph | Injected FPT CFO conflict flows through cash metrics to FPT/BQ-CASH, removing its points; independent FPT revenue, TCX and VNM paths remain supported |
| No invented qualitative evidence | Industry, moat, market share, governance, action-adjusted growth and sector stress gaps remain explicit; reported scale/ratios do not manufacture those topics |
| Formal boundaries | Actual dossiers rejected by scoring, ranking root, nested ranking card, decision, monthly DCA command, NAV request, ledger transaction construction, DI acceptance and formal AI-provenance validators |

Eligibility counts are **7 READY_FOR_ASSESSMENT** (all seven already completed), **127 DATA_MISSING**, **4 ANALYST_REVIEW_PENDING**, **0 MATERIAL_CONFLICT**, **0 NOT_APPLICABLE**. These are eligibility categories separate from completion status. The 131 unscored rubrics consist of the latter 127 + 4; their points remain null. DATA_MISSING means missing *qualified topic evidence in the bound layer*, not proof the source document is absent. There is no request to resend retained documents.

## Targeted PDF review and provenance limits

Only FPT's material BQ-CASH recognition/WC exception triggered an original-PDF review: physical pages **12, 13, 29, 30, 31, 32** of the retained FY2025 consolidated report. Six full-page PNGs were rendered using the existing read-only PDFKit renderer and visually inspected. The source hash, physical pages, direct PDF hrefs and exact retained-notes JSON Pointers are in [FPT-exception-review.json](FPT-exception-review.json). Temporary renders are disposable; no original source or removed OCR-reader directory was recreated.

The exception is bounded. Policy disclosure does not prove every contract complied. The other-profit subtotal does not establish recurrence of finance income. The source v4 full-cycle/exhaustive-one-off limitations remain. Page13's OCR column interleaving for depreciation is documented as an observation only; the DFR-02 array is unchanged.

Metric evidence binds the original DFR-02 issuer file SHA-256 and exact `/metrics/N` pointer. Conditional context remains labelled as context, not an admitted normalized input or accepted valuation. TCX's conflicted common-value context is forbidden by the resolver. Original PDF hashes/units/lineage remain reachable through the unchanged DFR-02 layer. Model/session IDs remain unknown; no trusted execution or independent-human sign-off is invented.

## Protected state

**7,150 protected file/database fingerprints** match inspection and final validation, including production code/configuration, M1–M8 historical artifacts, all DFR-02 outputs and the active database/available sidecars. DFR-02's earlier protected baseline was also checked. Approved scoring-authority identity remains `8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1`.

No production route imports DFR-03. Entry-point rejection tests establish direct DTO incompatibility, not prevention of deliberate transformation by another authorized actor. No scoring/decision/DCA/NAV/ledger adapter, canonical admission, database posting, source promotion, weight/methodology change, deployment, commit or push occurred.

The current research [manifest](manifest.json) binds deterministic outputs. The [final review manifest](final-review-manifest.json) separately binds the six deliverables, validation receipts and source/code/spec identities. Neither manifest grants formal acceptance or production authority.
