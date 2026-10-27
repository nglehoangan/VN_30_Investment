# Event classification matrix

Assessment: 2026-10-27 Asia/Ho_Chi_Minh. Owner authorizes Phase2.2 isolated implementation and targeted blocker investigation only. No Phase2.3, Current NAV implementation, production posting/migration or acceptance changes.

|Result|Deterministic condition|Posting consequence|
|---|---|---|
|SUPPORTED_EVENT|Explicit supported type, source/identity scope and content qualified, exact post-opening ordering|Candidate still subject to builder/replay/CAS/atomic revalidation|
|DUPLICATE|Same independently resolved economic namespace/event/component/revision and financial content|No new posting; original transaction ID retained, source variant returned|
|NEEDS_REVIEW|Ambiguous command/type, conflicting revision/financial data, unknown existing-ledger identity or malformed record|Entire batch0posted|
|UNSUPPORTED|Unknown contract/category or unsupported corporate-action subtype|No inferred replacement event|
|BLOCKED_SOURCE|Missing/hash-invalid source, unavailable/revoked authority, self-review, wrong account/scope/content or future knowledge|0posted|
|BLOCKED_IDENTITY|Missing exact security evidence or accepted identity scope mismatch|No ticker-only promotion|
|BLOCKED_OPENING_BOUNDARY|Before/equal opening, mismatched timestamp or date-only evidence|No assigned intraday time; no lifetime reconstruction|

All records have outcomes carrying original record and reason; none silently discarded. Duplicate records within a pending batch refer to its prospective first event; if batch later blocks, postedCount remains0 and no such transaction is claimed committed. Business-invalid commands qualify for review but fail existing accounting validation before commit, returning BLOCKED/NEEDS_REVIEW for the batch. This distinction is not a relaxation of source acceptance.
