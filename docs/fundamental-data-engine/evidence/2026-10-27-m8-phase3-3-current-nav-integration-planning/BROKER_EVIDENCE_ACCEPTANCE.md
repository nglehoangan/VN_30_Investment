# Broker evidence acceptance

2026-10-27 · Phase 3.3 · DESIGN ONLY — NOT IMPLEMENTED / NOT ACCEPTED

Proposed BrokerEvidenceBundleV1 is an immutable manifest, not an approval. Required fields:

|Group|Required exact content|
|---|---|
|Identity|bundle version/id; provider namespace; exact document ID or API endpoint/request/response ID; contract version; account ID and accepted account↔portfolio linkage; currency/perimeter|
|Times|economic asOf with precision/timezone; original publication time if witnessed, otherwise null+UNKNOWN; capture/request start/end/retrieval; first retained knowledge; no timestamp substitutions|
|Integrity|source path/byte length/SHA-256; exact JSON pointers or PDF physical page/boxes; decoder/version and normalized content hash; all variants/failures retained|
|Semantics|disjoint cash/withdrawable/cash-equivalent/claims/debt/fee definitions, quantity/availability/right partitions; units; source schema and field interpretation evidence|
|Continuity|opening boundary; coverage intervals and sequence/count/gap/duplicate witnesses; trade/settlement and CA IDs; claim/payment links; source revisions/conflicts|
|Reconciliation|ledger revision/facts/state hashes; T/K; full legacy result plus NAV-economic addendum; discrepancies and accepted non-economic limitations|

Workflow: acquire separately under owner authority → retain bytes/inventory → producer decode/qualify → identity reviewer verifies account/security scope → financial reviewer resolves semantics/continuity/reconciliation → genuinely independent validator accepts exact bundle → owner/release roles separately decide operational use. This phase performs none of those acquisitions or decisions.

A proposed BrokerAcceptanceDecisionV1 includes exact bundle/hash and source-contract hash, account/portfolio/datasets/security/event/period/purpose scope, effective interval, knowledge boundary, decision APPROVE/APPROVE_WITH_RESTRICTIONS/DEFER/REJECT, reviewer authenticated subject and role-grant/audit, distinct producer identity, acceptance time, limitations, revocation/supersession references and signature/trusted audit proof. Only authenticated APPROVE scopes satisfying every mandatory economic gate can qualify; restrictions cannot waive unknown mandatory obligations. A recommendation is not this decision.

Never mutate evidence or replace a conflicting version. Append a new bundle/decision with explicit predecessor and affected interval; unresolved multiple effective decisions block. Revocation removes future qualification/publication and invalidates dependent views; preserve prior audit with later invalidation status. Hashes only prove retained bytes, not who issued or accepted them.

Still unresolved:500000cash-equivalent component,105fee/debt linkage,570000claim composition/NET basis, GAS475000/MWG95000exact entitlement and16Oct receipt, FPT20pending lifecycle inside220aggregate, all11basis provenance. No amount-equality matching, balance plug, guessed conversion or implicit local approval. Exact external next actions are in ESCALATED_BLOCKER_STATUS.json.
