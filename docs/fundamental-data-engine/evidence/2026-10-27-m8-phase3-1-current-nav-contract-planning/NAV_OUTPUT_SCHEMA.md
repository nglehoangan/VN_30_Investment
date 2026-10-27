# Structured NAV output proposal

2026-10-27 · Phase 3.1 DESIGN PROPOSAL ONLY. No calculator, adapter, schema validator, snapshot store, migration, acceptance artifact or Phase 3.2 implementation is created. Proposed amendments require explicit owner review.

This is a field/schema design, not executable TypeScript/JSONSchema, a runtime result or an acceptance record. NAV_OUTPUT_DESIGN.json is labelled DESIGN_SPECIFICATION_NOT_A_NAV_RESULT.

|Field group|Contract|
|---|---|
|contractVersion|current-nav-result-v1 (PROPOSED, no implementation)|
|origin|SYNTHETIC_TEST or RETAINED_RESEARCH or VERIFIED_OPERATIONAL; origin is never authority|
|portfolioId/perimeter/currency|Exact IDs, scope/version, VND|
|purpose/valuationMode/knowledgeMode|PORTFOLIO_NAV / LATEST_COMPLETED_EOD / RETROSPECTIVE; other modesblocked|
|valuationAt/tradingDate/session/timezone|Accepted economic cutoffT and calendar/policy identities|
|requestedAt/calculatedAt/knowledgeCutoff|Actual timestamps and clock-assurance refs; no inventedknownAt|
|navState/requiredProfile|QUALIFIED_NAV,INDICATIVE_NAV,NAV_BLOCKED plus approved gate-profile identity|
|cash/securitiesMarketValue/receivables/liabilities|Component envelopes with exactstring|null, coverage, confidence, source/time/reconciliation|
|totalNav|Exactstring only whenQUALIFIED_NAV; otherwise null|
|indicativeValue|Exactstring only opt-in INDICATIVE_NAV fullobserved scope; otherwise null|
|researchSubtotals|Named scope, exact subtotal, included/excluded IDs, limitations; no defaultNAVlabel|
|positions/claims/obligations|Original ledger IDs/economic units, quantities, status partitions, linked leg/action/price IDs; no duplicates|
|componentCompleteness/sourceQualification|Ten dimensions, percomponent confidence/acceptance and independent evidencerefs|
|missingInputs/blockingReasons/limitations|Stable reasoncodes+affected IDs; UNKNOWN distinct from0|
|accountingMethod/valuationMethod/calculationVersion|Approvedregistry refs, existingMWAC identity, versionedpointNAVrules and exact softwarecommit|
|priceQualification/identity/calendar|Exact contract/version/hash/coverage/purpose and revocationheads|
|reconciliation/validationEvidence|NAVeconomicassessment separately fromlegacyfull/inception/risk status|
|ledgerRevision/stateHash/inputManifestHash/resultContentHash|Canonical orderedcontent and immutable inputreferences, schema/code/methodversion|
|runId/reproducibility/lineage|Content versus auditrun identity, correction/supersession links, realknownAt|
|effectiveCurrentEligibility/usePermissions|OfficialNAVpublication/performance/risk/decision/scoring are distinct; defaultsdeny; no autoPASS|

ComponentEnvelope design: `{componentId, kind, amount: decimalString|null, currency, economicAt, knownAt, sourceRefs[], ledgerLegIds[], quantityOrClaimCoverage, completeness, qualification, acceptanceRefs[], reconciliation, missingReasons[]}`. SourceRef pins provider/publisher/document/rawURI+hash+pointer, retrieval/knowledge times and availability/authorization. Required evidence must be extant/verifiable under authorized access; hash-only pointers to deleted raw records do not prove replay.

Discriminated branch constraints: Qhas onlytotalNav; Ihas onlyindicativeValue plus explicit complete-observed scope and limits; BLOCKEDhas bothnull, with missing/blocking reasons. No `amount:0` serialization default for unknown. Researchsubtotals cannot populate either scalar automatically. Identity/action/economic-unit IDs and exact coverage must bind the amount, not only labels.

Initial safe use permissions deny officialperformance/risk/decision/scoring forIandBLOCKED. EvenQ is not by itself a release: officialNAVpublication needs an exact NAVoperational release/acceptance and current-consumption check; officialperformance/risk require their own approved contracts; productiondecision/scoring never granted by this DTO. Existing CurrentModel/actionability/PASS remain unchanged. Do not export legacy valuation.nav when legacycontext is blocked as a newlyqualified result. No fullnav scalar for incompleteheldset.

Proposed reason codes: ACCOUNTING_INCOMPLETE,UNKNOWN_LIABILITY,UNACCEPTED_RECEIVABLE,IDENTITY_UNRESOLVED,PENDING_RIGHTS_UNQUALIFIED,MISSING_PRICE,STALE_SESSION,SOURCE_CONFLICT,UNKNOWN_CALENDAR,PRICE_ADJUSTMENT_MISMATCH,INCOMPATIBLE_ASOF,REVISION_CHANGED,AUTHORITY_MISSING_OR_REVOKED,INDEPENDENT_ACCEPTANCE_PENDING,PROFILE_APPROVAL_REQUIRED,UNSUPPORTED_CURRENCY,BITEMPORAL_QUERY_UNSUPPORTED. Scope/affected IDs and source/dates accompany codes; they are not new transaction error semantics.
