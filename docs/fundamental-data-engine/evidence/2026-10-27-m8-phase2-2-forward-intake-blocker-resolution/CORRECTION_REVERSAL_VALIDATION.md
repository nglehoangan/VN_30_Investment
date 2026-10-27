# Correction and reversal validation

Assessment: 2026-10-27 Asia/Ho_Chi_Minh. Owner authorizes Phase2.2 isolated implementation and targeted blocker investigation only. No Phase2.3, Current NAV implementation, production posting/migration or acceptance changes.

Original transactions/legs are never edited. A standalone source-authorized REVERSAL must reference an existing non-opening event and the authority grant must name that original. A corrected revision of an existing economic key requires a different explicit provider revision, correctsTransactionId naming latest accepted posting, and paired reversal/replacement with identical correctionGroupId/effective time. No unlinked source revision may replace the book silently.

Corrections use existing exact negated-leg rules, deterministic ordering and affected-future replay. Receipt corrections still obey Phase2.1 lineage/allocation restrictions; intake does not free a reserved receipt or weaken NET-only treatment. If a legacy cash correction cannot satisfy existing Phase2.1 canonical receipt constraints it fails closed, pending a separately reviewed receipt-lifecycle extension.

Tests verify deposit receipt reversal, paired corrected revision, rejection of missing pair, duplicate corrected-source replay and immutable history. Unknown liabilities/source identities are not corrected with CASH_ADJUSTMENT. Source revision acceptance must be genuine; a correctionGroupId alone grants no source authority.
