# Current-purpose DI / scorer dataset consumer

The data-consumer purpose mismatch is resolved through an explicit current-purpose entry point on the existing ScoringEngine. The historical FORMAL/AS_KNOWN route remains unchanged; current facts are never relabelled as historical facts.

## Executable path

`ScoringEngine.resolveCurrentDataset(reference, context)` delegates to the trusted `CurrentPurposeScoringConsumer` configured as its fourth constructor dependency. The engine rejects absent consumer configuration and purposes other than CURRENT_FORMAL_VALUATION. Existing constructor callers remain compatible.

The consumer verifies the immutable pre-scoring reference, replays the enrichment binding, resolves the parent financial dataset, rechecks governed sources, hashes and revocation, and validates the 34 selected current financial observations plus qualified reported borrowing evidence using the existing CURRENT_FORMAL_VALUATION Evidence validator. It also returns the 65 previously admitted historical facts, accepted research metric bundle, real raw close, and share-count lineage. Incomplete or conflicting data cannot produce an acceptance.

Economic cutoff stays 2026-10-30; original receipts, review times and actual later operational knownAt remain unchanged. No fabricated publication timestamps or historical availability assertions are added.

## Independent current DI acceptance

A successful resolution returns `ACCEPTED_CURRENT_DATA`, a deterministic `dataAcceptanceId`, the original binding knownAt, and `readyForScoring:false` / `historicalPitGranted:false`. The consumer persists a small immutable `current-purpose-data-initialization-acceptance-v1` receipt in the proposed `current_scoring_data_acceptance` table. It binds the dataset hash, binding ID, context and purpose without copying the full fact corpus or requiring a scorecard FK. Repeated resolution checks the existing receipt and does not add duplicates. Existing historical DataInitializationAcceptance rows are not forged or repurposed.

The SQL proposal is explicitly applied only in disposable validation databases. No active database migration or production activation is authorized or performed.

## Scoring boundary

Dataset resolution does not call score(), calculateScorecard(), methodology approval, or artifact append. The existing `score()` path, 23 assessments, HUMAN provenance, M1, confidence, DI requirements and executable authorization remain unchanged. A valid current dataset does not make an incomplete assessment or pending authorization valid. VNM17 is not promoted.

This resolves Step 2's consumer data-intake requirement: a real persisted binding and current-purpose acceptance can be resolved by the actual ScoringEngine before a scorecard exists. It does not claim the remaining formal scoring inputs are complete, or that score() now accepts CURRENT_ONLY evidence directly. A future authorized scoring operation must still satisfy its own approved domain/authorization contract; no score is fabricated to demonstrate dataset consumption.

## Composition and changed files

The isolated real-data runner composes the existing financial admission, dataset, coverage and prebinding services; passes the same Prisma client to CurrentPurposeScoringConsumer; and injects it into the actual ScoringEngine. Methodology/scoring write dependencies deliberately throw if invoked during data resolution. This proves the actual engine consumer uses the data path without invoking scoring.

Changes: src/application/scoring/engine.ts; new src/ports/current-scoring-datasets.ts; new src/infrastructure/source-admission/current-scoring-consumer.ts; proposed prisma/proposals/current-scoring-data-acceptance-v1.sql; tests/integration/current-scoring-consumer.test.ts; this evidence package. No Next.js UI, M3 calculation, weights, source authority or portfolio changes.

See VALIDATION.json and REAL_EXECUTION.json for actual validation results and limitations. Full typecheck is not represented as passed. The pre-existing populated-M6.3 partial-schema migration test cannot run under the scoped native fixture; its result is explicitly distinguished from current-purpose consumer tests.
