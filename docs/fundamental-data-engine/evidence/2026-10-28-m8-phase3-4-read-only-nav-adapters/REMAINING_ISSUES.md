# Findings and scope limits

2026-10-28 · Phase3.4 SliceA · READ_ONLY_ADAPTERS_ONLY

|Severity|Finding|Disposition|
|---|---|---|
|CRITICAL external|B1authenticated source/identity/independent acceptance unavailable; economic gaps B2–B4persist|Preserved blocked full NAV; no synthetic or local substitute|
|MAJOR external|No complete current accounting/identity/market/calendar/forward-continuity evidence|Provider deliberately cannot emit a complete plan; slicesB–Gnotimplemented|
|MAJOR scope limit|Actual TCBS/PDF layouts are not the new observation-envelope schema|Explicitly unsupported; no converter or fake actual envelope, positive broker read tests synthetic only|
|MAJOR fixed local|Blocked preparation heads initially omitted unread/invalid configured pins|Bind all sorted pins and full request; different invalid account pins now yield distinct heads|
|MINOR fixed local|Wrapper initially omitted optional read-through forwarding|Forward existing parameter; tested without changing underlying repository|
|MINOR fixed local|Composition inferred preparation as null/never across async callback|Explicit return typing; no V1contract amendment|
|MINOR fixed local|Zod was initially placed outside approved validation/config boundary|Move schema to infrastructure/config; boundary rules unchanged|
|MINOR fixed test|Corruption test attempted modifying immutable posted leg directly|First assert trigger denies update; isolated fault injection/restoration only; actual trigger unchanged|
|MINOR fixed local|Unused head parameter lint warning|Explicitly consumed without changing always-false behavior|

No known unresolved SliceA implementation defect after final validations. Threat limit: filesystem hashing/path/stat checks cannot authenticate source authority or prevent privileged same-process/OS control; no tamper-proof claim. Complete verified ownership, original broker-source semantics, signed acceptance, clock/audit anchoring and deployment protection remain separate dependencies.

Review perspectives: CIO preserves policy/release restrictions; portfolio manager preserves disjoint economics and pending shares; risk reviewer rejects unknown obligations and indication fallback; accounting engineer verifies one existing reconstruction/MWAC engine; security reviewer verifies bounded reads/pins/path/race handling and no trust from JSON; architect verifies backward compatibility and absent production composition. These are implementing-agent code-review perspectives, not authenticated producer-distinct operational acceptance.
