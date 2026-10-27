# Current Nav Contract Implementation

Date: 2026-10-27. Scope: Phase 3.2 isolated implementation only.

`contracts.ts` defines CurrentNavRequestV1, CurrentNavComponentV1, CurrentNavResultV1, CurrentNavEvidenceManifestV1 and NavQualificationAssessmentV1. Additional plan/unit/price/authority types are additive. Request has exact keys, PORTFOLIO_NAV, LATEST_COMPLETED_EOD, RETROSPECTIVE, request/K time, explicit scope and pinned revision. CURRENT_ACCOUNT_NOW and AS_KNOWN fail closed.

QUALIFIED_ONLY requires complete economics and trusted verifier proofs. It cannot downgrade to indication. OBSERVED_FULL_PORTFOLIO requires allowIndicative=true and coherent complete observations; its totalNav is always null. NAV_BLOCKED has both totals null. Securities subtotal is explicitly `SECURITIES_SUBTOTAL — NOT NAV` with included/excluded units.

All results, including synthetic QUALIFIED_NAV, deny official/production/performance/risk/actionability/scoring use and persistence. NavOrigin is SYNTHETIC_TEST or RETAINED_RESEARCH, not a production grant. Synthetic authority exists only in tests. The injected authority port is a trust boundary for already authenticated evidence; no runtime production verifier, acceptance storage or JSON-flag adapter is provided.

Runtime checks validate request fields, version/profile, enums, evidence pins, dimensions, quantities, identities, components, session/time and proofs. Malformed input returns a blocked result when safely serializable. These are server/internal typed contracts, not an HTTP deserialization or authentication API. Source bytes must be verified by a future input provider; matching caller-supplied pins alone does not authenticate them.
