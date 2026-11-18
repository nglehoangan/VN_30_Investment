# VNM PUB-01–03 bounded closure

**PUB-01 CLOSED. PUB-02 implemented and validated in isolation. PUB-03 prepared, approval-gated and rehearsed. Publication readiness: CONDITIONALLY_READY, not live-publication-ready.** No live publication, activation or production registration was performed. The VNM result remains43/100, LOW, VALID — NON-ACTIONABLE.

## PUB-01 — governed bootstrap route

Reproduced the original14 failures before changing bootstrap. All15 dependency-head tests now pass without changing those tests. `retainedDependencyBootstrap` still checks the exact owner-accepted candidate binding, but consumes the already accepted static-data successor rather than executing the20Oct fetch capsule against current HEAD.

`RETAINED_STATIC_HEAD_BINDING.json` from Step3 pins seven unchanged data heads from accepted release `dependency-release-45716b70a9509547873ebf116d2964462eb0fc1ca3d9643c6ac7d4ce215a885f` / `2f34d81611b8dd832b824e26608d23371fe7d9c2700b5d509126fd6f26a38140`. The new reader verifies the receipt's exact bytes, the immutable DB release/body hash, release compatibility, each retained head's bytes and full equality to that release, and equality of consumed candidate data to those accepted heads. Original dates, coverage, policy exceptions and missing-authority restrictions are retained.

No capsule, original source pin or approval receipt was rehashed. A dedicated regression proves direct historical capsule replay still rejects its old executable mismatch; a changed successor receipt is rejected before DB access. This is accepted-data consumption, not weakened historical executable replay. No additional owner decision is needed for this route. It grants no current membership, scoring or CAS activation by itself.

## PUB-02 — existing catalog, explicit current-purpose envelope

`CurrentScorePublications` stores a versioned reference envelope in the existing immutable `analytical_artifact` catalog, using its existing SCORECARD kind. It does not copy a current card into the legacy FORMAL/PIT schema, add a parallel publication table or alter the generic sealed ANALYSIS/DECISION flow. The catalog checksum decoder deliberately cannot treat that envelope as a legacy scorecard.

`readDashboard` dispatches the explicit envelope to the qualified current reader. `loadDashboard` accepts that reader only through a trusted server-services argument, separate from browser/query inputs. Without the registered server consumer, a current reference fails closed. The production pages do not register or enable it automatically.

Each read verifies catalog integrity and publication authority identity/currentness, then calls the real `CurrentPurposeScoring.find` to revalidate source/data/assessment/methodology/executable authority. The envelope binds the exact card/dataset/method/review hashes and original timestamps. Authority or underlying data revocation blocks reads; no older-card fallback is used when the newest current revision is invalid. Publishing an existing identical ID is idempotent; a distinct older version is rejected. Latest selection uses economic cutoff, then calculatedAt; historical detail remains explicitly addressable.

The UI shows current-purpose/dated/read-only/NOT HISTORICAL PIT semantics and original cutoff, knownAt and calculatedAt. LOW and NON-ACTIONABLE are unchanged. Publication supplies no trade permission and cannot enter the legacy ranking/decision path as a fake FORMAL card. Existing decision/DCA gates remain unchanged.

## PUB-03 — exact governed deployment preparation

`GovernedCurrentDeployment` checks the server-owned operation gate and verifies its recipe before writes, then checks the exact resulting scorecard/dataset/method/review identity. Its plan always excludes publication activation and historical PIT. The recipe uses existing financial admissions, dataset/coverage/prebinding consumer, approved method registration and current scorer; it is not a raw JSON/admission insertion shortcut.

The actual VNM rehearsal reuses the exact retained input/review and original knownAt. Approved v6 admission produced69 governed facts,35 current evidence rows and65 historical facts. Replaying the recipe twice preserves identities/counts and reads back the same43/100. The default closed gate causes zero recipe writes. Only an explicit disposable-target rehearsal gate was supplied; no owner production approval or live trusted registration was invented.

`GOVERNED_DEPLOYMENT_REVIEW_MANIFEST.json` identifies the exact operation request/hash, retained method/authority/assessment bindings, schema prerequisite pins and protected production baseline. The disposable fixture prepares the existing schema; the gated recipe validates and replays governed data. This is not a claim that a production migration/registration command has run. Existing namespace SQL and migration tooling must be applied only in an authorized deployment. The existing analytical catalog itself needs no schema widening.

## Actual publication rehearsal and validation

The real qualified current service published two **isolated** immutable reference records: the original card and a later calculation of the same accepted economics for revision-control testing. The actual server loader/reader returned the original exact card, then selected the newer revision. Duplicate publish created no extra record. An older distinct publication, unregistered permission, legacy interpretation, changed assessment/M1 and revoked authority/data were rejected. Public loader returns BLOCKED with no cards on authority withdrawal. No production record or approval fixture was fabricated.

All previously failing dependency cases pass, along with publication/UI, scoring, ledger-adapter, decision and DCA regressions. See `VALIDATION.json` for final counts, strict typecheck, lint and the deterministic replay. Original source evidence, current executable authority, M3/M4 investment rules, portfolio/NAV and live scoring configuration remain unchanged.

## Remaining owner action — no new research loop

Before live use, CIO/owner must authorize execution of the exact prepared governed materialization and trusted server registration against the protected baseline. Materialization permission does **not** grant publication permission. PUB-04 explicit read-only publication approval remains separate. Current production tables/records and registration are intentionally not populated by this task.

Readiness therefore remains **CONDITIONALLY_READY**: technical paths and isolated proof are complete; authorized production materialization/registration and publication permission remain. No new financial PDF, source approval, scoring methodology or repeated S1–S5 assessment is requested.

STOP for CIO review.
