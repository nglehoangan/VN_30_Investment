# Dependency matrix

2026-10-27 · Phase 3.3 · DESIGN ONLY — NOT IMPLEMENTED / NOT ACCEPTED

ARCHITECTURE_MATRIX.json describes A–J; DEPENDENCY_MATRIX.json records their edges and external gates; IMPLEMENTATION_SLICES.json records future authorization boundaries. None is a runtime configuration or approval record.

|Capability|Current readiness|Minimum unresolved dependencies|
|---|---|---|
|Ledger integrity/replay|Implemented / retained read-only validation|Accepted starting scope and forward source completeness still absent|
|Accounting input qualification|Partially implemented contract; actual inputs blocked|B1–B4, B5ownership-impact scope, authenticated reconciliation/completeness|
|Identity resolution|Offline candidate validation only|B1account-specific anchors, dated lifecycle, independent acceptance|
|Market-price qualification|Technical normalizer/replay implemented; operational NAV blocked|Accepted current all-held source/capture, NAV calendar/finality policy, identity and source decisions|
|Independent acceptance|Interface/test fixture only|Actual distinct authorized reviewer, trusted decision/audit/revocation infrastructure|
|Publication|No new gate/view/route|Approved operational contract amendment, exact O/R decisions and final consistent heads|
|Deployment|Not authorized|B6/B7, target/build/config/schema/registry/recovery evidence, owner scopedGO|

No shortcut from B7technical rehearsal or Phase3.2synthetic tests closes B1financial authority. No fresh market acquisition alone closes broker liabilities or forward continuity. B5need not make arithmetic depend on cost basis when properly scoped; it continues to block unaccepted P&L/full-reconciliation/release uses. Calendar/finality, trust infrastructure and publication-contract gaps are additional explicit dependencies, not relabelled resolutions of B1–B7.
