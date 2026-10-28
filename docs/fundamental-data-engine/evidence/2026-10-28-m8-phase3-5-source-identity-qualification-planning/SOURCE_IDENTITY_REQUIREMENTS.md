# Source identity requirements

2026-10-28 · SOURCE_IDENTITY_QUALIFICATION_PLANNING_ONLY · DESIGN, NOT ACCEPTANCE

Approved implementation baseline: `81e2e8e669f2bea1a60aecf71de3952edd38965c`. This package designs identity qualification/evidence acquisition only. No resolver, acceptance record, authentication, migration or integration is implemented.

The required evidence graph is: exact portfolio → privately verified broker account/ownership/perimeter → original position/event source → exact ledger security ID → dated instrument continuity → namespaced market instrument identifiers → applicable corporate-action entitlement/availability → immutable source bytes and authenticated independent scoped decision. Each arrow needs its own evidence; identifiers alone are not relationships.

|Requirement|Mandatory control|
|---|---|
|Portfolio/account|Explicit portfolio/namespace, broker/account/subaccount/product/currency and economic perimeter, ownership/authorized-use evidence, dated source binding|
|Security|Preserve original ledgerID; issuer/instrument/venue/class, broker code and provider namespace/ID, ISIN if actually available or evidenced alternate continuity|
|Intervals|Real witnessed validFrom/validTo and genuine known/recorded times; no inception/listing/retrieval substitution; no overlapping ambiguity|
|Entitlement|Exact action/allocation/receipt/availability IDs and disjoint quantities/claims; legal entitlement is not automatically tradability|
|Evidence|Original document/API/request/schema/hash/field pointer, economic/publication/retrieval/knowledge times separately, revision/conflict provenance|
|Authority|Independent authenticated reviewer and role/scope/interval/revocation proof; local hash/JSON/test flags insufficient|
|Purpose|Identity qualification only; no NAV, market-price, metric, decision, scoring or release authority implied|

Inventory labels have exact meanings: IMPLEMENTED=inspected executable code, or explicitly identified retained data with an implemented consumer (not an acceptance claim); DESIGNED=proposed contract/workflow only; MISSING=no operational implementation/record established; EXTERNAL_EVIDENCE_REQUIRED=source/reviewer/owner evidence unavailable locally. A datum can be implemented structurally while its real source/authority evidence remains missing. These dimensions are separate in CURRENT_IDENTITY_INVENTORY.json.

Existing offline Bridge DTO stays OFFLINE_PREPARATION with acceptedMapping:false; existing AuthorityPlaceholder has no ACCEPTED state. Proposed qualification records live in a separately reviewed future contract. No extension or automatic promotion of those frozen contracts is authorized here. Phase3.4typedblocked provider remains unchanged and cannot manufacture a complete NAV plan.

Privacy: use opaque redacted account alias `OWNER_ACCOUNT_A` in this package. No real account number, ownership name, credential or raw account payload is copied. Exact matching is a future authorized private verification task, not a last-four match. Public document hashes identify entire evidence blobs, not plain hashes of low-entropy account secrets. Sources and commits are pinned in SOURCE_REFERENCES.json/BASELINE_IDENTITY.json.
