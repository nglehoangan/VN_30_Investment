# Source evidence provenance

2026-10-28 · SOURCE_IDENTITY_QUALIFICATION_PLANNING_ONLY · DESIGN, NOT ACCEPTANCE

Proposed SourceIdentityEvidenceV1 includes provider/legal issuer and document/API endpoint/request/response ID, source type, exact source schema/parser version, private account/perimeter linkage, security/market namespaces, economic asOf/precision/timezone, source publication if explicitly witnessed(otherwise UNKNOWN), retrieval time, local acquisition/known time and separate formal-knowledge receipt, exact original byte length/SHA-256, field pointers or physical PDFpage/boxes, variants/conflicts/revisions, qualified scope and current revocation/supersession head. See SOURCE_EVIDENCE_CONTRACT.json. No record is created from this field list.

|Assurance|What proves it|What it does not prove|
|---|---|---|
|DATA_INTEGRITY|Exact retained byte SHA-256/size and replay|Authentic issuer, account ownership, identity or approval|
|SOURCE_IDENTITY|Privately verified exact document/API/account/issuer relation|Financial field semantics or authority for NAV|
|FINANCIAL_INTERPRETATION|Accepted meaning, units, disjoint rights/claims/obligations/action stage|Publication or investment actionability|
|SOURCE_AUTHORITY|Authenticated authorized role, exact source/purpose/scope and interval|Independent reproduction or operational release|
|INDEPENDENT_ACCEPTANCE|Genuinely distinct authenticated reviewer, exact bundle and validation|Any broader purpose/dataset/interval or dashboard/scoring permission|

Observation-envelope field references in SliceAprove envelope bytes, not original broker API/PDFlineage. Future transformation must pin original source and each extraction/mapping/normalization step separately with immutable pointers; never overwrite originals or promote an envelope's self-declared account as owner evidence. Separate public redacted derivatives and private original hashes/access records; no original secrets in public pointers/URLs/filenames or tracebacks.

All times preserve source semantics. Original publication, retrieval, economic record date, preparation/recorded time and formal knowledge are different. Selected master obtained25Octcannot establish knowledge23Oct. Filemtime, commitdate, localcaptureheader or a document folder date cannot be a trusted formal knowledge event. No AS_KNOWN support is claimed. Effective endUNKNOWN cannot be encoded as indefinite null without evidence.

Corrected sources are retained as new versions with exact predecessor/affected interval and authenticated acceptance if used; keep all conflicts visible, no latest-wins. Current revocation must be checked at use/publication; unknown head denies. A hash of an unsigned local decision is not an approval. Existing request/result/Bridge/envelope contracts and their schemas remain unchanged.
