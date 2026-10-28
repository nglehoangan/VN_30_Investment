# Current identity inventory

2026-10-28 · SOURCE_IDENTITY_QUALIFICATION_PLANNING_ONLY · DESIGN, NOT ACCEPTANCE

This is a bounded reread of known approved source/evidence packages, not a new source search. No actualDBquery, API/web request or broker document acquisition was run. Prior evidence remains immutable. Exact hashes/commits and raw market-side byte pins are reverified; prior observation timestamps remain local acquisition metadata unless independently authenticated.

**PORTFOLIO — IMPLEMENTED / EXTERNAL_EVIDENCE_REQUIRED**

`src/ports/portfolio.ts`: PortfolioDefinition/ledger IDs; existing read/reconstruction and Phase3.4hash snapshot. Gap: Exact external account-owner/perimeter binding not established.

**BROKER_UI — IMPLEMENTED / EXTERNAL_EVIDENCE_REQUIRED**

`src/domain/portfolio/broker-snapshot.ts`: vvios-broker-snapshot-v1symbol/quantity/status/cash; no exact account/stable instrument fields. Gap: Not a complete identity proof.

**BROKER_UI_MASK — IMPLEMENTED / MISSING**

`src/infrastructure/config/broker-api-data.ts`: UI account output masks numbers and uses display-oriented DTO. Gap: Masked number cannot prove account equality; parser is not NAV authority.

**BROKER_ENVELOPE — IMPLEMENTED / EXTERNAL_EVIDENCE_REQUIRED**

`src/ports/nav-read-adapters.ts`: nav-broker-observations-v1exact structural account/document/perimeter/time fields; reader returns acceptedfalse. Gap: Positive envelopes synthetic; real source conversion/authentication absent.

**LEDGER_READER — IMPLEMENTED / EXTERNAL_EVIDENCE_REQUIRED**

`src/application/current-nav/ledger-read-adapter.ts`: Immutable read/snapshot/facts+state hashes and cutoff/revision checks. Gap: financiallyCompletefalse; replay not accepted source linkage.

**MARKET_MASTER — IMPLEMENTED / EXTERNAL_EVIDENCE_REQUIRED**

`src/domain/market-boundary/tcbs-eod.ts`: TCBS master codeId/isinCode/symbol/tradePlace/secType/status/halt parsing. Gap: Market-side observations not personal ledger linkage; technicalfrom=knowledge date is not legal effective date.

**VN30_MASTER — IMPLEMENTED / EXTERNAL_EVIDENCE_REQUIRED**

`docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json`: Pinned30members/local UUID namespace; membership/reference context. Gap: UUID assignment provenance/namespace authority and account continuity unaccepted.

**OFFLINE_BRIDGE — IMPLEMENTED / EXTERNAL_EVIDENCE_REQUIRED**

`src/domain/nav-preparation/identity.ts`: Strict immutable offline Bridge structural validation and resolveBridge(acceptedMapping:false). Gap: Real11dossiers incomplete; no actual complete Bridge rows emitted.

**IDENTITY_DOSSIERS — DESIGNED / EXTERNAL_EVIDENCE_REQUIRED**

`docs/fundamental-data-engine/evidence/2026-10-26-m8-identity-bridge-evidence-preparation/IDENTITY_BRIDGE_CANDIDATES.json`: 11incomplete evidence dossiers; bridgeCandidates and acceptedMappings empty. Gap: Relationship/effective/formal knowledge/action clearance UNKNOWN.

**CA_STRUCTURAL — IMPLEMENTED / EXTERNAL_EVIDENCE_REQUIRED**

`src/domain/portfolio/dividend-settlement.ts`: Claim/action/payment/allocation identity contracts; original ledger corporate action rules unchanged. Gap: FPTlifecycle/GAS-MWGclaim source linkage incomplete.

**NAV_QUALIFICATION — IMPLEMENTED / MISSING**

`src/domain/current-nav/qualification.ts`: Exact unit identity, reverse uniqueness, evidence/time/authority gates. Gap: No real accepted identity/authority provider.

**NAV_PROVIDER — IMPLEMENTED / MISSING**

`src/application/current-nav/input-provider-skeleton.ts`: SliceAprepare typedBLOCKED/loadnull; source/identity/independent/market/continuity missing reasons. Gap: Never complete plan; no production root binding.

**AUTH_MODEL — DESIGNED / EXTERNAL_EVIDENCE_REQUIRED**

`docs/fundamental-data-engine/evidence/2026-10-27-m8-phase3-3-current-nav-integration-planning/SOURCE_AUTHORITY_MODEL.md`: Separate identity/financial/independent/publication/release responsibilities. Gap: Real authenticated reviewer/role/revocation/audit integration absent.

**LOCAL_AUTH — DESIGNED / MISSING**

`docs/adr/0005-local-authentication-deferral.md`: Owner no-login decision; existing PEC-1Csecurity contracts preserved. Gap: Authenticated independent acceptance remains blocked, not substituted locally.

## Retained11holding market-side observations

|Original ledgerID|Local market UUID|TCBS code|Provider ISIN|Account-to-instrument continuity|
|---|---|---|---|---|
|FPT|ec91b3cb-8eab-45ae-95e7-738bb3c7de52|000208|VN000000FPT1|UNKNOWN / EXTERNAL_EVIDENCE_REQUIRED|
|GAS|b56425c0-fc3e-4b56-a8de-a9a537d05b58|002033|VN000000GAS3|UNKNOWN / EXTERNAL_EVIDENCE_REQUIRED|
|HPG|ee1da5cd-aedc-4567-98a6-d525b8c79ebc|000286|VN000000HPG4|UNKNOWN / EXTERNAL_EVIDENCE_REQUIRED|
|MBB|ff699c86-8eaf-4178-af14-0b38fd5b1255|000054|VN000000MBB5|UNKNOWN / EXTERNAL_EVIDENCE_REQUIRED|
|MWG|3376630f-ec27-4d02-9168-b2274d6abdb7|003170|VN000000MWG0|UNKNOWN / EXTERNAL_EVIDENCE_REQUIRED|
|SSI|483a7e5c-ae5d-456d-840e-54433896ad43|000065|VN000000SSI1|UNKNOWN / EXTERNAL_EVIDENCE_REQUIRED|
|TCB|2a3c69b1-08aa-473c-bbd5-92d096a0d23a|003415|VN000000TCB8|UNKNOWN / EXTERNAL_EVIDENCE_REQUIRED|
|VCB|32002fe9-b6cd-4760-91ba-8b7a59d4758e|000193|VN000000VCB4|UNKNOWN / EXTERNAL_EVIDENCE_REQUIRED|
|VHM|20847702-0506-43fc-81b3-a6a1a5ef1b32|005791|VN000000VHM0|UNKNOWN / EXTERNAL_EVIDENCE_REQUIRED|
|VPL|bcb6df7e-001b-4368-a913-e9e01bae30fb|000153|VN000000VPL5|UNKNOWN / EXTERNAL_EVIDENCE_REQUIRED|
|VRE|e032abe6-6e8a-4241-8546-5a7e3a960ef4|005599|VN000000VRE6|UNKNOWN / EXTERNAL_EVIDENCE_REQUIRED|

Ledger IDs happen to be ticker strings; preserve exact values, not their interpretation as global IDs. UUIDs belong to PINNED_LEVEL1_RELEASE_MEMBERS local namespace, not TCBS-issued UUIDs. codeId/ISIN are observed provider metadata; retained HOSElist corroborates ticker/ISIN for all11 but supplies neither account linkage nor continuous identity intervals. No primary depository lifecycle document was established in retained discovery scope.

Prior dossier has11incomplete rows and zero complete bridgeCandidates/acceptedMappings. Its retained search verified111DBmaster observations and110raw captures; those historical counts are cited, not a search rerun. Original broker opening anchor has symbol/quantity/cost data but no stable code/ISIN. Known account APIs4.14lack those stable fields in position rows;4.4/4.6retained histories are empty. No unobserved account endpoint or export capability is assumed.

Selected market capture remains2026-10-23EOD, acquired25Oct and PARTIAL_CAPTURE overall. It does not establish a current28Octsession or prior AS_KNOWN evidence. All11same-economic-instrument relationships and effective/formal-knowledge/CAclearance fields remain UNKNOWN. No mapping or identity decision is created here.
