# M8 Phase1 accounting and reconciliation contract closure

Assessment date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 1 design/evidence closure only. Owner approved the prior architecture assessment as baseline v1.0 in the current task; this is not authenticated source/identity acceptance or Phase 2 authorization. Original baselines and sealed evidence remain unchanged. SOURCE_REFERENCES.json pins inspected files; JSON Pointers below address those pinned bytes.

Final decision: **READY_FOR_IMPLEMENTATION_REVIEW**.

All13 required deliverables are present. This means the design is ready for review, **not** that actual accounting discrepancies are resolved, Phase2 authorized or production ready. Architecture impact baselinev1.0 owner approval recorded from current task; old baseline files preserved.

Actual read-only replay PASS:12 original opening transactions,24 exact legs,11 positions; cash232420/receivable570000/payable0 and all quantity/cost fields match original projection.17 verified trades,93cash rows,29security events inspected; trade totals rechecked. No new source workbook/PDF extraction or authentication claimed. Original source hashes/rows are preserved in pinned retained evidence. Detailed diagnostic covers all11basis totals plus disposedTPB; no deltas posted.

Proposed smallest extension: explicit versioned dividend-receivable settlement plus accepted allocation of aggregate opening claim. Net-claim receipt clears linked claim and increases cash, with zero second income/flow/basis. Existing cash dividends and trade settlements retain meaning. FPT remains aggregate220 with separately evidenced ordinary200/pending20, never an additional20 or invented conversion date.

Unresolved Critical blocker: exact source/security identity and authority acceptance **ESCALATED**. Major blockers:500k cash-equivalent category,105 debt/transition completeness, GAS/MWG claim allocation/linkage, FPT lifecycle/basis,11-position acquisition-to-imported basis differences, nontrade settlement implementation and M7 independent release evidence. Repeated blockers with conservative ≥3cycles are explicitly escalated in RISKS_AND_OPEN_DECISIONS.md, with first steps, causes, attempted resolutions and concrete responsible actions. No more generic review is proposed as evidence replacement.

Readiness: deterministic original replay READY; actual economic reconciliation BLOCKED; new settlement/status/intake contracts PARTIALLY_READY pending review/evidence/implementation. Lifetime accounting is unavailable, but daily historical NAV is not required for current portfolio accounting. Current obligations and source/identity gates remain mandatory.

Validation: actual broker-database read-only replay and retained-file/hash arithmetic checks, distinct from planned synthetic/new-event tests. Initial temporary loader path failure fixed and rerunPASS; no validation gate weakened. No production code or database changes, ledger/historical rewrites, migration, approval, provider call, NAV/scoring/D2 activation or milestone advancement. Safety verification and sealed source/artifact inventories accompany package.

Owner review: ratify perimeter, claim settlement/versioning, FPT status treatment; obtain precise broker/issuer evidence and independent review; explicitly authorize any Phase2 work afterward. Stop after Phase1. No Phase2 implementation performed.
