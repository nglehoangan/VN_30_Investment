# Formal runtime dataset — contract and safe state transition

This is a pre-implementation review, not an accepted snapshot or authority grant. No source amounts, publication dates, human points, method approvals or acceptance rows were created. `SCORING_DATASET_CONTRACT.json` contains the exact state transition, source pins and observed method/table counts; `RUNTIME_SOURCE_INVENTORY.json` inventories every existing canonical fact by immutable run body hash and JSON Pointer without copying its amount into a new dataset.

## Observed gaps

30 accepted CURRENT_ANALYSIS admission runs contain1,793 facts (1,754 for eligible29,39 for deferred MBB). No eligible fact currently records publishedAt or historicalPitEligible=true. These properties do not prove that prospective evidence can never be obtained; they prohibit treating existing financial-period/review/retrieval dates as verified publication/availability. New real publication/date-only/provider evidence must satisfy the existing approved time policy, with actual ingestion/operational knowledge, never backdating.

The broad default runtime registry `fundamentals-items-v1` is PROPOSED, approvalReference=null. The approved debt-only registry does not authorize all CORE/SECTOR_CORE items. Production has no matching APPROVED/PRODUCTION registry-sha256, availability-sha256, readiness-requirements-sha256 or di-acceptance-sha256 method registrations. The active scoring executable/model's manual-fundamental requirements file has different semantics/schema from a full runtime ScoringReadinessRequirements object. Its static approval cannot be reused as these missing bindings.

There are0 FORMAL observations, availability assessments, derivations, sealed runtime snapshots, dataset acceptances and score bindings. No valid canonical runtime source chain can be assembled by simply renaming the30 admission documents. Retired original source paths are flagged in the inventory; no symlinks/old amount copies were restored. A legitimately reacquired document would need exact source/hash/period/scope verification and a proper new source/import/capture record, not a fake old-path replay.

## Required transition under existing contracts

1. Obtain independent approval for the exact broad registry, approved item/period/scope requirements and availability policy/method records. Preserve the scoped debt approval; do not promote the proposed registry automatically.
2. Register source/version, immutable raw capture/import and declared normalization/mapping records. Every material observation must identify source document/cell locator, sourceHash, period/scope/unit/scale and actual ingestion. Do not turn unknown/null/dash into zero or infer labels from amounts.
3. Produce verified availability assessments using real publication evidence, governed DATE_ONLY fallback/trusted receipts only where permitted, public and operational knowledge/correction boundaries. Recompute derivations from accepted operands/formula versions with exact lossless decimal semantics and source lineage.
4. Build a FORMAL/AS_KNOWN snapshot with revisionCutoff=null and explicit reference/version/knownAt, requirements, observation/assessment/derived pins. Use the repository builder that re-enumerates conflicts and seals contentHash plus exact manifest digest.
5. Build a bridge with facts(observationId,evidenceId,validThrough), metrics(derivationId,requestId,two operand evidenceIds,validThrough), external(HUMAN/MARKET/VALUATION) origins. Reproduce bridgeScoringInputs and assertBridgeMatches against the legitimate reviewed input. Source cutoff/quality/unit/scope and sector-topic checks remain mandatory.
6. Human analysts and M1 gate owners supply reviewed rubric/valuation/context and dated gate envelopes. All29 eligible issuers must be genuinely ready; MBB remains null input/null bridge in the full30 acceptance population.
7. An independent reviewer binds the exact acceptance hash/reviewer/approval capability, with registered requirements and acceptance metadata, all15 DI gates, issue register, snapshot/manifest/universe/scoring-method hashes and pinned acceptance identity. Operationally require readiness PASS for29; do not exploit schema allowance for a metadata row with missing inputs. Append only the genuinely accepted dataset under existing repository rules.
8. Read-only authorize() may then validate reviewed semantic input, selection, exact approval hashes, time, registered scoring method and recomputed readiness. An authorization object is not a scorecard.
9. Only after all A-D production conditions PASS may ScoringEngine calculate and repository append an actual immutable scorecard plus its dataset binding in one transaction. Ranking/Top10/replay require further valid accepted evidence and29-member coverage. No investment action is included.

## Why C cannot persist a pre-scoring score binding

Prisma `ScoringDatasetBinding.scorecardId` is a foreign key to an actual AnalyticalArtifact. `PrismaPolicyBScoringDatasets.append` independently recalculates/re-authorizes, then writes the actual SCORECARD and binding atomically. Creating a binding during prerequisite work would require a fake scorecard or a contract change. Neither is allowed. C can prepare and independently verify snapshot/input/acceptance and later read-only authorization; persisted score binding is an output of conditional legitimate scoring, not a readiness placeholder.

## Application composition remains closed

Default `requireAcceptedMarketBoundary()` and the legacy default dependency activation helper still throw. The already-activated trusted release resolver is separate. No guard was removed; valid production composition must independently supply the correct accepted context and real external review bindings. The approved market capability/session policy is VALUATION-only; a successful valuation capture cannot silently authorize SCORING/RANKING purposes. Any required additional purpose/composition activation must be explicitly reviewed under the existing authority architecture.

Next reviewable inputs: exact broad runtime registry+crosswalk approval, availability policy/authority binding, runtime readiness requirements/method binding, verified source publication/availability/normalization evidence,29 complete reviewed dossiers and independent dataset acceptance. This task does not invent IDs, approve proposed artifacts or implement a parallel bridge.
