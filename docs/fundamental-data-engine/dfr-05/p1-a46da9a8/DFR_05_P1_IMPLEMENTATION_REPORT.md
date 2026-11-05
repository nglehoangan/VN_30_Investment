# DFR-05 P1 implementation — RESEARCH_PROVISIONAL
Baseline `a46da9a8ca4ba6171287fb98410e366ae05e82ec`. Explicit owner message: “Tôi approve hãy start”, responding to the P1-only approval question. Approval message timestamp remains unknown; recordedAt is receipt-record creation time. This authorizes P1 only; no acceptance of investment judgments, source expansion, valuation inputs or production is inferred.

## Implemented contract and source adapters
Implementation: scripts/lib/dfr05_p1.py; builder: scripts/build-dfr05-p1.py; fresh verification/seal: scripts/finalize-dfr05-p1.py. No application, Next.js, database schema or runtime source changes. Python standard library only.

Four deterministic adapters validate original schema/ticker/status, stable occurrence-aware pointers, exact original decimal strings, annual/quarter/YTD/instant metadata, scope, native unit evidence and revision. Unknown dimensions/publication times remain null. Notes preserve full-page pointers and document hashes without duplicating text. CaféF available cells are checked against raw payload bytes/hash/pointer with Decimal, including null/zero; raw values beyond binary precision remain lossless. Combined selections remain unreviewed presentation references, not facts or automatic source promotion.

The24 original source files contain 323166 rows/pages. Only 5650 dependency-relevant cells/pages and explicit FY2022–25 schema/window witnesses are materialized; all original files remain hash-pinned. Adapters support deterministic full traversal, but export does not duplicate unrelated retained history. No source file was deleted or rewritten.

## Reused financial and qualification logic
Replay rebuilds 789 DFR02 metric objects using its actual verified-input selectors, overlays, sector calculations and standalone VNM bridge. The one explicitly conflicted TCX printed-common node is carried unchanged, value null; no correction is manufactured. Derived ratios retain DFR02 exact fractions and 12dp HALF_EVEN policy; add/subtract use Decimal. Provider crosschecks also match exactly.

DFR03 validate_review is reused; DFR04 topic qualification and closure validators are called for the matching historical assessment families. Four sealed legacy-format judgments lack the newer counterevidence-array format: VNM:BQ-CASH and BID/VIC/VHM:RG-UNC. They pass unchanged M3 band/full-topic validation and exact sealed-object comparison; no counter-reference fields are fabricated. New-format reviews retain the full validator. This compatibility path preserves history and does not authorize creating new legacy assessments.

## Explicit dependency graph
8309 nodes and 5536 edges connect exact source bindings/raw provider cells, selected extraction cells/pages, verified metrics, qualified context, topics, rubrics and isolated legacy exceptions. Graph IDs and exported order are deterministic; cycles, dangling edges, wrong issuers and new tickers fail closed.

Calculation/support/counterevidence edges propagate source conflicts. Discovery, unreviewed extraction candidates and presentation/provider crosschecks are explicitly non-authoritative. Conflict replay returns a separate status overlay with null points, leaving original metrics and judgments unchanged. Shared document changes affect their actual dependents; a single reviewed pointer does not cause a blanket issuer veto. Conditional earnings/valuation context stays labelled as context, never as a reported financial fact.

## Sector routes
BANK (BID), SECURITIES (TCX), TECHNOLOGY (FPT), CONSUMER_DAIRY (VNM), COMPLEX_GROUP (VIC), DEVELOPER (VHM) retain DFR02 research subtypes and explicit economic rules. These are research routing labels, not new approved M3 sectors or formal admission. Bank capital/funding and securities book cash flows cannot silently use industrial FCF. No bands, weights or taxonomy files are changed.

## Run / verify
Run `python3 scripts/build-dfr05-p1.py` for deterministic six-pilot exports. Run `python3 scripts/finalize-dfr05-p1.py` for two fresh replays, tests, protected-source checks and an owner-review manifest. Both require the exact baseline and unchanged tracked bytes. Boundary validation requires the repository-supported Node >=22.23.2 <23 from PATH, or an explicit DFR05_NODE_BINARY executable; unsupported versions fail before replay, with no automatic download. Any consumer must verify the manifest, implementation and input hashes before trusting an export; manifest presence alone is insufficient.

No P2, new issuer, external acquisition, new rating, owner valuation assumption, scoring authorization, deployment or ledger operation occurs.
