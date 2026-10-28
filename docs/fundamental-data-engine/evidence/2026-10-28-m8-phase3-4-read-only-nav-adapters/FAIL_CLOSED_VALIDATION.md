# Fail-closed behavior

2026-10-28 · Phase3.4 SliceA · READ_ONLY_ADAPTERS_ONLY

|Input failure / gap|Behavior|
|---|---|
|Missing/modified/hash/path/schema/identity broker file|BLOCKED observation with safe reason; no accepted value|
|Unknown liability/missing claim/cash observation|Explicit UNKNOWN_LIABILITY/MISSING_RECEIVABLE_EVIDENCE/MISSING_CASH_OBSERVATION; no0fallback|
|Cash/claim/debt discrepancy|Explicit unresolved discrepancy; ledger unchanged|
|Pending/unknown corporate action or lifecycle|CORPORATE_ACTION_LIFECYCLE_UNQUALIFIED; no conversion/double shares|
|Duplicate security or competing source fields|Explicit duplicate/conflict; no latest-selection|
|Future or different economic time|Reject source or ledger; no backdating/currentEODsubstitution|
|Revision/facts/state/head mismatch|Reject stale or mismatched snapshot; preserve blocked diagnostic|
|Missing source authority / independent reviewer|Always SOURCE_AUTHORITY_MISSING / INDEPENDENT_ACCEPTANCE_MISSING|
|Unproven ownership/forward coverage/market calendar|Always explicit unverified/acceptance/qualification reasons|
|Complete numeric observations without required acceptance|Still no complete plan; load=null; NAV_BLOCKED|

QUALIFIED_ONLY never downgrades. Explicit indicative opt-in also remains fully blocked because SliceA cannot establish a complete coherent accepted/observed economic perimeter. totalNav=null and indicativeValue=null in the unchanged NAV result. Partial ledger/observation diagnostics are not a full NAV or a securities subtotal result.

Actual external B1–B7cannot be resolved by these tests. Existing0payable and opening claims remain ledger observations rather than evidence of economic completeness. No approved policy or legacy accounting/actionability gate is weakened.
