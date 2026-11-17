# Current-purpose binding before scoring

Owner authorization is retained verbatim in OWNER_DECISION.txt. It permits dataset preparation and verification before scoring. It does not approve numeric assessments, resolve N/R rubrics, grant DI acceptance, grant scoring authority or activate production.

## API and persistence

`CurrentPreScoringBindings.prepare(datasetId, context)` creates/reuses the existing immutable `current_financial_enrichment` record. It returns a `current-purpose-pre-scoring-reference-v1` reference: binding ID, original context, manifest hash, `permitsScoring:false`, `historicalPitGranted:false`. There is no scorecard foreign key or fake scorecard. The existing proposed enrichment SQL is explicitly applied only in isolated validation. No second copy of financial facts or new live migration is introduced.

`verify(reference, context)` resolves the stored record, replays source admission and dataset lineage, checks its exact manifest hash, security/ticker, economic cutoff, operational knowledge, purpose and revocation. A later consumer may know more; the original binding clock and manifest remain unchanged. CURRENT_FORMAL_VALUATION remains distinct from historical PIT.

## Scorer composition

`PreboundScoringDatasets(bindings, reference, governedDatasets)` implements the existing ScoringDatasets port. Trusted application composition supplies the reference and existing governed repository, never caller JSON gate flags. Before `authorize` or `append`, it verifies the data binding against the actual ScoreInput security, economic date and knownAt. It then calls the unchanged governed repository. It grants no scoring authorization itself.

The existing ScoringEngine still registers methodology, requires formal dataset authorization, runs calculateScorecard (including domain assessment/M1/confidence checks), and appends through the governed repository, which replays its own authorization. The wrapper adds a necessary data check; it never makes that check sufficient. Existing DI requirements remain enforced. No modification to ScoreInput, scoring weights, RUBRICS, source authority or executable manifests.

The reference is deliberately not a legacy `{snapshotRunId, acceptanceId}` selection. No CURRENT_ONLY evidence is relabelled FORMAL/AS_KNOWN. Therefore resolving the separate legacy current-purpose admission mismatch, and satisfying outstanding rubric/authorization gates, are still required before actual formal scoring. This change closes pre-scoring persistence/verification independently of those gates; it does not claim a complete successful formal score path.

## Validation and scope

81 scoped tests pass, including three new isolated DB integration tests. The real VNM run uses actual standing source authority, market service and share evidence. It prepares and verifies one immutable enrichment binding while DI, legacy scoring binding and scorecard counts remain zero. Duplicate prepare returns the same reference. Real-path negative checks cover false scoring permission, changed manifest, PIT and revocation. Test doubles exercise pending downstream gates; they are not evidence that formal authority exists.

No active database changes, portfolio/NAV mutation, production wiring or production activation. Existing SQL remains a reviewed proposal used in disposable DBs. Full TypeScript typecheck remains unverified due to the previously observed compiler environment stall; runtime test success is not a typecheck PASS.

Files added: src/ports/pre-scoring-datasets.ts; src/infrastructure/source-admission/pre-scoring-binding.ts; tests/integration/pre-scoring-binding.test.ts; this bounded evidence package.
