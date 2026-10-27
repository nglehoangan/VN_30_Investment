# Immutable reversal and correction

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Scope: owner-authorized Phase 2.1 implementation and isolated validation only. No Phase 2.2, production posting, source acceptance or migration execution authorized.

Existing REVERSAL references original event, requires later effective time, emits exact negated legs, and leaves original facts/legs unchanged. For dividend settlement, cash decreases and original claim reopens without reversing unrelated income or capital flows. Replay reduces consumed subclaim balance; earlier as-of state retains original receipt.

Reversal with spent cash fails no-negative/no-margin invariants. Accepted authority is required for both reversals and new corrected postings. Current revocation/acceptance failure rolls back. Direct legacy reversal path with no adapter cannot bypass this guard.

Receipt remains permanently reserved to original lineage. `correctionOf` explicitly names previous settlement; its reversal must be present in the same correctionGroupId/effective instant. New receipt identity must match original; an unrelated reuse or correction branch fails. Allocation remains identical for the parent. Reversal/replacement must follow existing deterministic economic ordering (effective time, event time, transaction ID, leg sequence); callers must choose an order that restores the claim before consuming it again. Invalid order fails, not auto-reordered. Multi-event correction remains one existing atomic group.

A compatibility defect found during isolated validation was fixed: rebuilding an earlier settlement with later corrected descendants in complete retained history initially rejected its receipt. Validator now permits only verified ancestor/descendant lineage while keeping unrelated reuse rejection. Legacy sort/recognition rules are unchanged. Audit pins both originalId and immutable transaction facts; original receipt ownership row is preserved. SQL update/delete/replace guards and read-side audit hash/facts binding are tested.
